// ============================================================================
//  StyleSync — V1 Recommendation Engine (TypeScript / server build)
//  Twin of public/recommend.js. Faithful to RECOMMENDATION_LOGIC_V1.md.
//  Pure logic over WardrobeItem[] — no model hosting, no GPU.
// ============================================================================

import type {
  WardrobeItem, Category, Occasion, PatternFamily, MaterialFamily, SleeveFamily,
} from './types';

const NEUTRALS = new Set(['black', 'white', 'cream', 'gray', 'brown', 'tan']);
const WARM = new Set(['red', 'orange', 'yellow', 'pink']);
const COOL = new Set(['blue', 'green', 'purple']);
const QUIET = new Set<PatternFamily>(['solid', 'striped']);
const LOUD = new Set<PatternFamily>(['graphic', 'floral']);

export const OCCASIONS: Occasion[] = ['casual', 'formal', 'sports'];
const HARD_CLASH: Record<Occasion, Occasion | null> = { formal: 'sports', sports: 'formal', casual: null };

export const WEIGHTS = { occasion: 0.30, color: 0.25, slot: 0.15, pattern: 0.15, sleeve: 0.10, material: 0.05 };
const FALLBACK_MIN_SCORE = 0.35;
const FALLBACK_MAX_GAP = 0.15;

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const colorGroup = (c: string) => NEUTRALS.has(c) ? 'neutral' : WARM.has(c) ? 'warm' : COOL.has(c) ? 'cool' : 'neutral';

type Slot = 'top' | 'bottom' | 'outerwear' | 'shoes';

export interface RecoRecord {
  id: string; label: string; image?: string; cat: Category;
  color: string; swatch: string;
  occasion: Occasion; occasionScores: Record<Occasion, number> | null;
  occasionConfidence: number | null;
  patternFamily: PatternFamily; materialFamily: MaterialFamily; sleeveFamily: SleeveFamily | null;
  _fallback?: boolean; _raw: WardrobeItem;
}

export interface Outfit {
  slots: Record<Slot, RecoRecord | null>;
  items: RecoRecord[];
  score: number;
  breakdown: Record<'occasion' | 'color' | 'slot' | 'pattern' | 'sleeve' | 'material', number>;
  penalty: number;
  fallbacks: string[];
  explanation: string[];
}

const VIBE_TO_OCCASION: Record<string, Occasion> = {
  casual: 'casual', cottage: 'casual', minimal: 'casual', punk: 'casual',
  business_casual: 'formal', athletic: 'sports',
};

function mapPattern(p?: string): PatternFamily {
  if (!p) return 'solid';
  const s = p.toLowerCase();
  if (s.includes('strip')) return 'striped';
  if (s.includes('graphic')) return 'graphic';
  if (s.includes('floral')) return 'floral';
  return 'solid';
}
function mapMaterial(f?: string): MaterialFamily {
  if (!f) return 'other';
  const s = f.toLowerCase();
  if (s.includes('denim')) return 'denim';
  if (s.includes('knit') || s.includes('wool') || s.includes('rib')) return 'knit';
  if (s.includes('leather')) return 'leather';
  if (s.includes('silk') || s.includes('chiffon')) return 'chiffon';
  return 'other';
}
function inferOccasion(item: WardrobeItem): Occasion {
  if (item.occasion && OCCASIONS.includes(item.occasion)) return item.occasion;
  for (const tg of item.tags || []) if (VIBE_TO_OCCASION[tg]) return VIBE_TO_OCCASION[tg];
  return 'casual';
}

export function normalize(item: WardrobeItem): RecoRecord {
  return {
    id: item.id, label: item.label, image: item.image, cat: item.cat,
    color: item.color, swatch: item.swatch,
    occasion: inferOccasion(item),
    occasionScores: (item as any).occasionScores || null,
    occasionConfidence: typeof item.occasionConfidence === 'number' ? item.occasionConfidence : null,
    patternFamily: item.patternFamily || mapPattern(item.pattern),
    materialFamily: item.materialFamily || mapMaterial(item.fabric),
    sleeveFamily: item.sleeveFamily || null,
    _raw: item,
  };
}

function occScore(it: RecoRecord, target: Occasion): number {
  if (it.occasionScores && typeof it.occasionScores[target] === 'number') return clamp01(it.occasionScores[target]);
  if (it.occasion === target) return it.occasionConfidence != null ? clamp01(0.6 + 0.4 * it.occasionConfidence) : 1.0;
  return 0;
}
function topOccScore(it: RecoRecord): number {
  if (it.occasionScores) return Math.max(...OCCASIONS.map(o => it.occasionScores![o] ?? 0));
  return it.occasionConfidence != null ? clamp01(0.6 + 0.4 * it.occasionConfidence) : 1.0;
}

function scoreOccasion(items: RecoRecord[], target: Occasion) {
  if (!items.length) return 0;
  const mean = items.reduce((s, it) => s + (it.occasion === target ? occScore(it, target) : 0), 0) / items.length;
  return clamp01(mean);
}
function scoreColor(items: RecoRecord[]) {
  const colors = items.map(i => i.color);
  const uniqueColors = [...new Set(colors)];
  const groups = colors.map(colorGroup);
  const hasNeutral = groups.includes('neutral');
  const accents = colors.filter(c => colorGroup(c) !== 'neutral');
  const uniqueAccents = [...new Set(accents)];
  const warmN = accents.filter(c => WARM.has(c)).length;
  const coolN = accents.filter(c => COOL.has(c)).length;
  let score: number;
  if (accents.length === 0) score = 1.0;
  else if (uniqueAccents.length === 1) score = hasNeutral ? 0.92 : 0.82;
  else {
    const sameTemp = warmN === 0 || coolN === 0;
    if (sameTemp) score = hasNeutral ? 0.72 : 0.58;
    else score = hasNeutral ? 0.5 : 0.3;
  }
  if (uniqueColors.length === 1) score = Math.max(score, 0.95);
  if (uniqueColors.length > 3) score -= 0.1 * (uniqueColors.length - 3);
  return clamp01(score);
}
function scoreSlots(slots: Record<Slot, RecoRecord | null>) {
  if (!slots.top || !slots.bottom) return 0;
  let s = 0.7;
  if (slots.shoes) s += 0.15;
  if (slots.outerwear) s += 0.15;
  return clamp01(s);
}
function scorePattern(items: RecoRecord[]) {
  const pats = items.filter(i => i.cat !== 'shoes').map(i => i.patternFamily || 'solid');
  if (!pats.length) return 0.8;
  const loud = pats.filter(p => LOUD.has(p)).length;
  const quiet = pats.filter(p => QUIET.has(p)).length;
  const others = pats.filter(p => p === 'other').length;
  const allSolid = pats.every(p => p === 'solid');
  let score: number;
  if (allSolid) score = 1.0;
  else if (loud === 0) score = 0.88;
  else if (loud === 1) score = others === 0 ? 0.82 : 0.6;
  else score = 0.3;
  if (loud >= 1 && quiet === 0) score -= 0.12;
  return clamp01(score);
}
function scoreMaterial(items: RecoRecord[], target: Occasion) {
  const mats = items.filter(i => i.cat !== 'shoes').map(i => i.materialFamily).filter(Boolean);
  if (!mats.length) return 0.8;
  const has = (m: MaterialFamily) => mats.includes(m);
  if (target === 'casual') return clamp01(0.8 + (has('denim') || has('knit') ? 0.15 : 0));
  if (target === 'formal') {
    let s = 0.8;
    if (has('leather') || has('chiffon')) s += 0.08;
    if (has('denim')) s -= 0.2;
    return clamp01(s);
  }
  return 0.8;
}
function scoreSleeve(items: RecoRecord[], target: Occasion) {
  const top = items.find(i => i.cat === 'top');
  const hasOuter = items.some(i => i.cat === 'outerwear');
  const sleeve = top && top.sleeveFamily;
  if (!sleeve) return 0.85;
  if (target === 'formal') {
    if (sleeve === 'sleeveless') return hasOuter ? 0.6 : 0.4;
    if (sleeve === 'short_sleeve') return hasOuter ? 0.85 : 0.7;
    return 1.0;
  }
  if (hasOuter && (sleeve === 'long_sleeve' || sleeve === 'short_sleeve')) return 1.0;
  return 0.9;
}
function occasionPenalty(items: RecoRecord[], target: Occasion) {
  let penalty = 0, reject = false;
  for (const it of items) {
    if (it.occasion === target) continue;
    if (HARD_CLASH[target] && it.occasion === HARD_CLASH[target]) { reject = true; break; }
    penalty += 0.08;
  }
  return { penalty, reject };
}
function explain(items: RecoRecord[], target: Occasion, b: Outfit['breakdown']) {
  const out: string[] = [];
  const colors = items.map(i => i.color);
  const accents = colors.filter(c => colorGroup(c) !== 'neutral');
  const uniqueColors = [...new Set(colors)];
  if (b.color >= 0.95 && uniqueColors.length === 1) out.push(`Tonal ${colors[0]} dressing — one color, head to toe.`);
  else if (accents.length === 0) out.push('A calm, all-neutral palette that pairs with anything.');
  else if ([...new Set(accents)].length === 1) out.push(`The ${accents[0]} piece pops against a neutral base.`);
  const nonShoe = items.filter(i => i.cat !== 'shoes');
  const loudItem = nonShoe.find(i => LOUD.has(i.patternFamily));
  const solidAnchor = nonShoe.find(i => i.patternFamily === 'solid' && i !== loudItem);
  if (loudItem && solidAnchor) out.push(`The solid ${solidAnchor.cat} anchors the ${loudItem.patternFamily} ${loudItem.cat}.`);
  else if (b.pattern >= 0.99) out.push('Clean solids throughout — quiet and easy to wear.');
  if (b.occasion >= 0.99) out.push(`Every piece reads ${target}.`);
  else if (b.occasion > 0) out.push(`Mostly ${target}, with a flexible piece filling a gap.`);
  if (items.some(i => i.cat === 'outerwear')) {
    const top = items.find(i => i.cat === 'top');
    if (top && (top.sleeveFamily === 'long_sleeve' || top.sleeveFamily === 'short_sleeve'))
      out.push('The layer sits comfortably over the top without fighting it.');
  }
  return out.slice(0, 2);
}

function buildPools(items: RecoRecord[], target: Occasion, capPerSlot: number) {
  const bySlot: Record<Slot, RecoRecord[]> = { top: [], bottom: [], outerwear: [], shoes: [] };
  for (const it of items) if (bySlot[it.cat as Slot]) bySlot[it.cat as Slot].push(it);
  const pools = {} as Record<Slot, RecoRecord[]>;
  for (const slot of ['top', 'bottom', 'outerwear', 'shoes'] as Slot[]) {
    const all = bySlot[slot] || [];
    let pool = all.filter(it => it.occasion === target);
    if (pool.length === 0 && all.length) {
      const fb = all
        .filter(it => occScore(it, target) >= FALLBACK_MIN_SCORE && (topOccScore(it) - occScore(it, target)) <= FALLBACK_MAX_GAP)
        .map(it => ({ ...it, _fallback: true }));
      pool = fb.length ? fb
        : all.slice().sort((a, b) => occScore(b, target) - occScore(a, target)).slice(0, 3).map(it => ({ ...it, _fallback: true }));
    }
    pool.sort((a, b) => occScore(b, target) - occScore(a, target));
    pools[slot] = pool.slice(0, capPerSlot);
  }
  return pools;
}

export function scoreOutfit(slots: Record<Slot, RecoRecord | null>, target: Occasion) {
  const items = (['top', 'bottom', 'outerwear', 'shoes'] as Slot[]).map(s => slots[s]).filter(Boolean) as RecoRecord[];
  const breakdown = {
    occasion: scoreOccasion(items, target), color: scoreColor(items), slot: scoreSlots(slots),
    pattern: scorePattern(items), sleeve: scoreSleeve(items, target), material: scoreMaterial(items, target),
  };
  const weighted = WEIGHTS.occasion * breakdown.occasion + WEIGHTS.color * breakdown.color +
    WEIGHTS.slot * breakdown.slot + WEIGHTS.pattern * breakdown.pattern +
    WEIGHTS.sleeve * breakdown.sleeve + WEIGHTS.material * breakdown.material;
  const { penalty, reject } = occasionPenalty(items, target);
  return { items, breakdown, weighted, penalty, reject, score: reject ? -1 : clamp01(weighted - penalty) };
}

export function recommend(
  wardrobe: WardrobeItem[], target: Occasion, opts: { limit?: number; capPerSlot?: number } = {}
): { outfits: Outfit[]; target: Occasion; reason?: string } {
  const limit = opts.limit ?? 4;
  const capPerSlot = opts.capPerSlot ?? 6;
  if (!OCCASIONS.includes(target)) target = 'casual';
  const items = (wardrobe || []).map(normalize);
  const pools = buildPools(items, target, capPerSlot);
  if (!pools.top.length || !pools.bottom.length) return { outfits: [], target, reason: 'need_top_and_bottom' };

  const outerOpts: (RecoRecord | null)[] = [null, ...pools.outerwear];
  const shoeOpts: (RecoRecord | null)[] = [null, ...pools.shoes];
  const results: Outfit[] = [];
  for (const top of pools.top)
    for (const bottom of pools.bottom)
      for (const outerwear of outerOpts)
        for (const shoes of shoeOpts) {
          const slots = { top, bottom, outerwear, shoes };
          const r = scoreOutfit(slots, target);
          if (r.reject) continue;
          results.push({
            slots, items: r.items, score: r.score, breakdown: r.breakdown, penalty: r.penalty,
            fallbacks: r.items.filter(i => i._fallback).map(i => i.id),
            explanation: explain(r.items, target, r.breakdown),
          });
        }
  results.sort((a, b) => b.score - a.score);
  const seen = new Set<string>();
  const picked: Outfit[] = [];
  for (const r of results) {
    const key = r.slots.top!.id + '|' + r.slots.bottom!.id;
    if (seen.has(key)) continue;
    seen.add(key); picked.push(r);
    if (picked.length >= limit) break;
  }
  return { outfits: picked, target };
}

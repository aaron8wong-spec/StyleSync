import type { WardrobeItem, Occasion, PatternFamily } from './types';

// ── Public types ─────────────────────────────────────────────────────────────

export type OutfitSlots = {
  top?: WardrobeItem;
  bottom?: WardrobeItem;
  outerwear?: WardrobeItem;
  shoes?: WardrobeItem;
  dress?: WardrobeItem;
};

export type Outfit = {
  items: OutfitSlots;
  occasion: string;
  score: number;
  explanation: string[];
};

// ── Internal types ────────────────────────────────────────────────────────────

type CandidatePools = {
  tops: WardrobeItem[];
  bottoms: WardrobeItem[];
  outerwear: WardrobeItem[];
  shoes: WardrobeItem[];
  dresses: WardrobeItem[];
};

// ── Color constants ───────────────────────────────────────────────────────────

const NEUTRALS = new Set(['black', 'white', 'cream', 'gray', 'brown', 'tan']);
const COOL_ACCENTS = new Set(['blue', 'green', 'purple']);
const WARM_ACCENTS = new Set(['red', 'orange', 'yellow', 'pink']);

type ColorGroup = 'neutral' | 'cool' | 'warm';

function getColorGroup(color: string): ColorGroup {
  const c = color.toLowerCase();
  if (NEUTRALS.has(c)) return 'neutral';
  if (COOL_ACCENTS.has(c)) return 'cool';
  if (WARM_ACCENTS.has(c)) return 'warm';
  return 'neutral'; // unknown defaults to neutral
}

// ── Sub-scorers ───────────────────────────────────────────────────────────────

function scoreColors(colors: string[]): number {
  if (colors.length === 0) return 0.7;

  const groups = colors.map(getColorGroup);
  const neutralCount = groups.filter(g => g === 'neutral').length;
  const coolCount    = groups.filter(g => g === 'cool').length;
  const warmCount    = groups.filter(g => g === 'warm').length;
  const accentCount  = coolCount + warmCount;
  const hasMixed     = coolCount > 0 && warmCount > 0;
  const hasNeutral   = neutralCount > 0;

  // All neutrals
  if (accentCount === 0) return 1.0;

  // Tonal: all exactly the same colour
  const uniqueColors = new Set(colors.map(c => c.toLowerCase()));
  if (uniqueColors.size === 1) return 1.0;

  // Single accent colour type present
  if (!hasMixed) {
    if (accentCount === 1) return 1.0;          // one accent, rest neutral
    if (hasNeutral)        return 0.9;           // one accent family + neutrals
    return 0.85;                                 // warm+warm or cool+cool, no neutrals
  }

  // Mixed warm and cool
  if (accentCount >= 3) return 0.2;             // multiple unrelated accents
  // Exactly 2 accents from different families
  return hasNeutral ? 0.5 : 0.6;
}

function pairPatternScore(a: string, b: string): number {
  const norm = (p: string): string =>
    ['solid', 'striped', 'graphic', 'floral'].includes(p) ? p : 'other';
  const pa = norm(a);
  const pb = norm(b);
  const isLoud = (p: string) => p === 'graphic' || p === 'floral';

  if (pa === 'solid'   && pb === 'solid')   return 1.0;
  if (pa === 'solid'   || pb === 'solid')   return 0.9;  // solid anchors anything
  if (pa === 'striped' && pb === 'striped') return 0.7;
  if ((pa === 'striped' && isLoud(pb)) || (pb === 'striped' && isLoud(pa))) return 0.6;
  if (isLoud(pa) && isLoud(pb))             return 0.2;
  if ((pa === 'other' && isLoud(pb)) || (pb === 'other' && isLoud(pa))) return 0.3;
  return 0.7; // other+other or other+quiet
}

function scorePatterns(patterns: (string | undefined)[]): number {
  const defined = patterns.filter((p): p is string => p !== undefined && p !== null);
  if (defined.length === 0) return 0.8;
  if (defined.length === 1) return 0.9;

  // Score all pairs, take minimum (worst clash drives the result)
  let min = 1.0;
  for (let i = 0; i < defined.length; i++) {
    for (let j = i + 1; j < defined.length; j++) {
      min = Math.min(min, pairPatternScore(defined[i], defined[j]));
    }
  }
  return min;
}

function scoreSleeve(
  sleeveFamily: string | undefined,
  hasOuterwear: boolean,
  occasion: string,
): number {
  if (!sleeveFamily) return 0.75;

  if (hasOuterwear) {
    if (sleeveFamily === 'long_sleeve')  return 1.0;
    if (sleeveFamily === 'short_sleeve') return 0.9;
    // sleeveless + outerwear
    return occasion === 'formal' ? 0.4 : 0.8;
  }

  // No outerwear
  if (sleeveFamily === 'sleeveless' && occasion === 'formal') return 0.5;
  return 0.8;
}

function scoreMaterials(
  materials: (string | undefined)[],
  occasion: string,
): number {
  const defined = materials.filter((m): m is string => m !== undefined && m !== null);
  if (defined.length === 0) return 0.75;

  const has = (m: string) => defined.includes(m);

  // Hard mismatches
  if (occasion === 'formal'  && has('denim'))   return 0.4;
  if (occasion === 'sports'  && has('chiffon')) return 0.5;
  if (occasion === 'sports'  && has('leather')) return 0.5;

  // Positive pairings
  if (occasion === 'casual' && (has('denim') || has('knit'))) return 0.9;
  if (occasion === 'formal' && (has('chiffon') || has('leather')) && !has('denim')) return 0.9;

  return 0.75;
}

function scoreOccasionConsistency(
  items: WardrobeItem[],
  occasion: string,
): number {
  if (items.length === 0) return 0;

  let total = 0;
  for (const item of items) {
    if (item.occasion === undefined) {
      total += 0.55; // unknown — mildly penalised but not excluded
    } else if (item.occasion === (occasion as Occasion)) {
      total += item.occasionConfidence ?? 0.7;
    } else {
      total += 0.3; // wrong occasion
    }
  }
  return total / items.length;
}

function scoreSlotCompleteness(slots: OutfitSlots): number {
  const { top, bottom, shoes, outerwear, dress } = slots;

  if (dress) {
    if (shoes && outerwear) return 1.0;
    if (shoes)              return 0.9;
    if (outerwear)          return 0.8;
    return 0.7;
  }

  if (!top || !bottom) return 0.3; // invalid
  if (shoes && outerwear) return 1.0;
  if (shoes)              return 0.9;
  return 0.7;
}

function applyOccasionPenalties(
  score: number,
  items: WardrobeItem[],
  occasion: string,
  fallbackIds: ReadonlySet<string>,
): number {
  let multiplier = 1.0;

  for (const item of items) {
    // Hard reject: sports item in formal with high model confidence
    if (
      occasion === 'formal' &&
      item.occasion === 'sports' &&
      (item.occasionConfidence ?? 0) > 0.8
    ) {
      return 0;
    }

    let m = 1.0;
    if (fallbackIds.has(item.id)) {
      m = 0.75; // closest-score fallback
    } else if (item.occasion !== undefined && item.occasion !== (occasion as Occasion)) {
      m = (item.occasionConfidence ?? 0.5) > 0.7 ? 0.4 : 0.75; // obvious mismatch
    }
    multiplier = Math.min(multiplier, m);
  }

  return Math.max(0, score * multiplier);
}

// ── Public pipeline functions ─────────────────────────────────────────────────

export function filterByOccasion(
  items: WardrobeItem[],
  occasion: string,
): WardrobeItem[] {
  return items.filter(item => {
    if (item.occasion === undefined || item.occasion === (occasion as Occasion)) return true;
    const conf = item.occasionConfidence ?? 0;
    // Allow fallback when confidence in own occasion is meaningful (>= 0.35)
    // but not so dominant that the target occasion is implausible (<= 0.65)
    return conf >= 0.35 && conf <= 0.65;
  });
}

export function buildCandidatePools(
  items: WardrobeItem[],
  occasion: string,
): CandidatePools {
  const pool = filterByOccasion(items, occasion);
  return {
    tops:      pool.filter(i => i.cat === 'top'),
    bottoms:   pool.filter(i => i.cat === 'bottom'),
    outerwear: pool.filter(i => i.cat === 'outerwear'),
    shoes:     pool.filter(i => i.cat === 'shoes'),
    dresses:   pool.filter(i => i.cat === 'dress'),
  };
}

export function generateCandidateOutfits(
  pools: CandidatePools,
  maxOutfits = 20,
): Outfit[] {
  const candidates: Outfit[] = [];
  const seen = new Set<string>();

  function key(items: WardrobeItem[]): string {
    return items.map(i => i.id).sort().join('\x00');
  }

  function tryAdd(slots: OutfitSlots): void {
    if (candidates.length >= maxOutfits) return;
    const present = Object.values(slots).filter((i): i is WardrobeItem => i !== undefined);
    const k = key(present);
    if (seen.has(k)) return;
    seen.add(k);
    candidates.push({ items: slots, occasion: '', score: 0, explanation: [] });
  }

  // Dress-based combinations
  for (const dress of pools.dresses) {
    if (candidates.length >= maxOutfits) break;
    tryAdd({ dress });
    for (const shoes of pools.shoes) {
      tryAdd({ dress, shoes });
      for (const outerwear of pools.outerwear) {
        tryAdd({ dress, shoes, outerwear });
      }
    }
    for (const outerwear of pools.outerwear) {
      tryAdd({ dress, outerwear });
    }
  }

  // Top + bottom combinations
  for (const top of pools.tops) {
    if (candidates.length >= maxOutfits) break;
    for (const bottom of pools.bottoms) {
      if (candidates.length >= maxOutfits) break;
      // Minimum valid outfit
      tryAdd({ top, bottom });
      // With shoes
      for (const shoes of pools.shoes) {
        if (candidates.length >= maxOutfits) break;
        tryAdd({ top, bottom, shoes });
        for (const outerwear of pools.outerwear) {
          tryAdd({ top, bottom, shoes, outerwear });
        }
      }
      // With outerwear, no shoes
      for (const outerwear of pools.outerwear) {
        tryAdd({ top, bottom, outerwear });
      }
    }
  }

  return candidates;
}

export function scoreOutfit(
  outfit: Outfit,
  occasion: string,
  fallbackIds: ReadonlySet<string> = new Set(),
): number {
  const allItems = Object.values(outfit.items).filter(
    (i): i is WardrobeItem => i !== undefined,
  );

  // Shoes excluded from pattern, material, sleeve scoring per spec
  const garments = allItems.filter(i => i.cat !== 'shoes');
  const topItem   = outfit.items.top ?? outfit.items.dress;

  const occasionScore     = scoreOccasionConsistency(allItems, occasion);
  const colorScore        = scoreColors(allItems.map(i => i.color).filter(Boolean));
  const completenessScore = scoreSlotCompleteness(outfit.items);
  const patternScore      = scorePatterns(
    garments
      .filter(i => i.cat === 'top' || i.cat === 'bottom' || i.cat === 'dress')
      .map(i => i.patternFamily),
  );
  const sleeveScore  = scoreSleeve(topItem?.sleeveFamily, !!outfit.items.outerwear, occasion);
  const materialScore = scoreMaterials(garments.map(i => i.materialFamily), occasion);

  const weighted =
    occasionScore     * 0.30 +
    colorScore        * 0.25 +
    completenessScore * 0.15 +
    patternScore      * 0.15 +
    sleeveScore       * 0.10 +
    materialScore     * 0.05;

  return applyOccasionPenalties(weighted, allItems, occasion, fallbackIds);
}

export function rankOutfits(outfits: Outfit[], n = 3): Outfit[] {
  const seen = new Set<string>();
  const sorted = [...outfits].sort((a, b) => {
    if (Math.abs(b.score - a.score) > 1e-9) return b.score - a.score;
    const slotCount = (o: Outfit) =>
      Object.values(o.items).filter(Boolean).length;
    return slotCount(b) - slotCount(a);
  });

  // Return top n ensuring no item appears in two different returned outfits
  const result: Outfit[] = [];
  const usedIds = new Set<string>();

  for (const outfit of sorted) {
    const ids = Object.values(outfit.items)
      .filter((i): i is WardrobeItem => i !== undefined)
      .map(i => i.id);

      // Deduplicate by combination, not by individual item
    const comboKey = ids.sort().join('\x00');
    if (seen.has(comboKey)) continue;
    seen.add(comboKey);
    result.push(outfit);

    if (result.length >= n) break;
  }

  return result;
}

export function explainOutfit(outfit: Outfit, occasion: string): string[] {
  const explanations: string[] = [];

  const allItems = Object.values(outfit.items).filter(
    (i): i is WardrobeItem => i !== undefined,
  );
  const garments = allItems.filter(i => i.cat !== 'shoes');

  // 1. Occasion alignment — strongest signal
  const allMatchOccasion = allItems.every(
    i => i.occasion === undefined || i.occasion === (occasion as Occasion),
  );
  if (allMatchOccasion && allItems.some(i => i.occasion !== undefined)) {
    const label = occasion.charAt(0).toUpperCase() + occasion.slice(1);
    explanations.push(`All pieces align with the same ${label} occasion.`);
  }

  // 2. Color story
  const colors = allItems.map(i => i.color).filter(Boolean);
  if (colors.length > 0) {
    const groups      = colors.map(getColorGroup);
    const accentCount = groups.filter(g => g !== 'neutral').length;
    const coolCount   = groups.filter(g => g === 'cool').length;
    const warmCount   = groups.filter(g => g === 'warm').length;
    const hasNeutral  = groups.some(g => g === 'neutral');

    if (accentCount === 0) {
      explanations.push('The color palette stays in the same soft neutral family.');
    } else if (accentCount === 1 && hasNeutral) {
      const family = coolCount > 0 ? 'cool' : 'warm';
      explanations.push(
        `A ${family}-toned accent stands out against a clean neutral base.`,
      );
    } else if (coolCount > 0 && warmCount === 0) {
      explanations.push('The colors stay in the same cool tonal family.');
    } else if (warmCount > 0 && coolCount === 0) {
      explanations.push('The colors stay in the same warm tonal family.');
    }
  }

  // 3. Pattern anchor
  if (explanations.length < 3) {
    const patterns = garments
      .filter(i => i.cat === 'top' || i.cat === 'bottom' || i.cat === 'dress')
      .map(i => i.patternFamily)
      .filter((p): p is PatternFamily => p !== undefined);

    const hasSolid  = patterns.some(p => p === 'solid');
    const hasLoud   = patterns.some(p => p === 'graphic' || p === 'floral');
    const hasStripe = patterns.some(p => p === 'striped');

    if (hasSolid && hasLoud) {
      explanations.push('The solid piece anchors the patterned item without competing.');
    } else if (hasSolid && hasStripe && !hasLoud) {
      explanations.push('The solid piece anchors the striped item cleanly.');
    } else if (patterns.every(p => p === 'solid')) {
      explanations.push('Clean solids throughout keep the palette sharp.');
    }
  }

  // 4. Layering
  if (explanations.length < 3 && outfit.items.outerwear) {
    explanations.push('This layer supports the outfit without adding visual noise.');
  }

  // Return 1–3 explanations; guarantee at least one
  if (explanations.length === 0) {
    const label = occasion.charAt(0).toUpperCase() + occasion.slice(1);
    explanations.push(`A cohesive ${label.toLowerCase()} look from your wardrobe.`);
  }

  return explanations.slice(0, 3);
}

// ── Main export ───────────────────────────────────────────────────────────────

export function generateOutfits(
  wardrobe: WardrobeItem[],
  occasion: string,
  n = 3,
): Outfit[] {
  if (wardrobe.length === 0) {
    console.warn('[outfitEngine] Empty wardrobe — returning []');
    return [];
  }

  // Track fallback items with internal set (not exposed in public filterByOccasion)
  const fallbackIds = new Set<string>();

  const filtered = wardrobe.filter(item => {
    if (item.occasion === undefined || item.occasion === (occasion as Occasion)) {
      return true; // primary match (or no occasion stored)
    }
    const conf = item.occasionConfidence ?? 0;
    if (conf >= 0.35 && conf <= 0.65) {
      fallbackIds.add(item.id);
      return true; // closest-score fallback
    }
    return false;
  });

  const pools = {
    tops:      filtered.filter(i => i.cat === 'top'),
    bottoms:   filtered.filter(i => i.cat === 'bottom'),
    outerwear: filtered.filter(i => i.cat === 'outerwear'),
    shoes:     filtered.filter(i => i.cat === 'shoes'),
    dresses:   filtered.filter(i => i.cat === 'dress'),
  };

  const hasTops    = pools.tops.length > 0;
  const hasBottoms = pools.bottoms.length > 0;
  const hasDresses = pools.dresses.length > 0;

  if (!hasDresses && (!hasTops || !hasBottoms)) {
    console.warn('[outfitEngine] No valid top+bottom or dress available — returning []');
    return [];
  }

  const candidates = generateCandidateOutfits(pools);

  const scored = candidates.map(outfit => {
    const withOccasion: Outfit = { ...outfit, occasion };
    return {
      ...withOccasion,
      score: scoreOutfit(withOccasion, occasion, fallbackIds),
    };
  });

  const ranked = rankOutfits(scored, n);

  return ranked.map(outfit => ({
    ...outfit,
    explanation: explainOutfit(outfit, occasion),
  }));
}

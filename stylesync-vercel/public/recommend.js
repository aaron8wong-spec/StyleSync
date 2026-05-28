// ============================================================================
//  StyleSync — V1 Recommendation Engine  (browser build)
//  A faithful port of recommendation/RECOMMENDATION_LOGIC_V1.md.
//
//  Deterministic, rule-based, reliability-weighted. Exposes window.SS_RECO.
//  The TypeScript twin lives at stylesync-vercel/lib/recommend.ts — keep them
//  in sync if you change the rules.
//
//  Public API:
//    SS_RECO.recommend(wardrobe, occasion, { limit })  → { outfits: [...] }
//      each outfit: { slots:{top,bottom,outerwear,shoes}, items:[...],
//                     score, breakdown, penalty, explanation:[...], fallbacks:[...] }
// ============================================================================
(function () {
  // ─── Label groups ───────────────────────────────────────────────────────
  const NEUTRALS = new Set(['black', 'white', 'cream', 'gray', 'brown', 'tan']);
  const WARM     = new Set(['red', 'orange', 'yellow', 'pink']);
  const COOL     = new Set(['blue', 'green', 'purple']);

  const QUIET = new Set(['solid', 'striped']);
  const LOUD  = new Set(['graphic', 'floral']);

  const OCCASIONS = ['casual', 'formal', 'sports'];
  // formal ↔ sports is a hard clash; casual bridges to either.
  const HARD_CLASH = { formal: 'sports', sports: 'formal', casual: null };

  // V1 weights (must sum to 1.0)
  const W = { occasion: 0.30, color: 0.25, slot: 0.15, pattern: 0.15, sleeve: 0.10, material: 0.05 };

  // Fallback gate (RECOMMENDATION_LOGIC_V1.md → Closest-Score Fallback Rule)
  const FALLBACK_MIN_SCORE = 0.35;
  const FALLBACK_MAX_GAP   = 0.15;

  const clamp01 = (x) => Math.max(0, Math.min(1, x));
  const colorGroup = (c) => NEUTRALS.has(c) ? 'neutral' : WARM.has(c) ? 'warm' : COOL.has(c) ? 'cool' : 'neutral';

  // ─── Normalise a WardrobeItem → canonical recommendation record ──────────
  // Prefers structured model outputs; falls back to legacy tags/pattern/fabric.
  const VIBE_TO_OCCASION = {
    casual: 'casual', cottage: 'casual', minimal: 'casual', punk: 'casual',
    business_casual: 'formal', athletic: 'sports',
  };
  function mapPattern(p) {
    if (!p) return 'solid';
    const s = String(p).toLowerCase();
    if (s.includes('strip')) return 'striped';
    if (s.includes('graphic')) return 'graphic';
    if (s.includes('floral')) return 'floral';
    return 'solid'; // denim/rib/knit/sole/mesh/puff are textures → read as solid
  }
  function mapMaterial(f) {
    if (!f) return 'other';
    const s = String(f).toLowerCase();
    if (s.includes('denim')) return 'denim';
    if (s.includes('knit') || s.includes('wool') || s.includes('rib')) return 'knit';
    if (s.includes('leather')) return 'leather';
    if (s.includes('silk') || s.includes('chiffon')) return 'chiffon';
    return 'other';
  }
  function inferOccasion(item) {
    if (item.occasion && OCCASIONS.includes(item.occasion)) return item.occasion;
    for (const tg of (item.tags || [])) {
      if (VIBE_TO_OCCASION[tg]) return VIBE_TO_OCCASION[tg];
    }
    return 'casual';
  }
  function normalize(item) {
    return {
      id: item.id,
      label: item.label,
      image: item.image,
      cat: item.cat,
      color: item.color,
      swatch: item.swatch,
      occasion: inferOccasion(item),
      // per-occasion score vector if the model gave one, else a 1-hot from the label
      occasionScores: item.occasionScores || null,
      occasionConfidence: typeof item.occasionConfidence === 'number' ? item.occasionConfidence : null,
      patternFamily: item.patternFamily || mapPattern(item.pattern),
      materialFamily: item.materialFamily || mapMaterial(item.fabric),
      sleeveFamily: item.sleeveFamily || null,
      _raw: item,
    };
  }

  // target-occasion score for one item (0..1). Uses the score vector when present.
  function occScore(item, target) {
    if (item.occasionScores && typeof item.occasionScores[target] === 'number') {
      return clamp01(item.occasionScores[target]);
    }
    if (item.occasion === target) {
      return item.occasionConfidence != null ? clamp01(0.6 + 0.4 * item.occasionConfidence) : 1.0;
    }
    return 0.0;
  }
  // top occasion score for the item (for the fallback gap test)
  function topOccScore(item) {
    if (item.occasionScores) return Math.max(...OCCASIONS.map(o => item.occasionScores[o] ?? 0));
    return item.occasionConfidence != null ? clamp01(0.6 + 0.4 * item.occasionConfidence) : 1.0;
  }

  // ─── Sub-scores (each 0..1) ──────────────────────────────────────────────
  function scoreOccasion(items, target) {
    if (!items.length) return 0;
    const mean = items.reduce((s, it) => s + (it.occasion === target ? occScore(it, target) : 0), 0) / items.length;
    return clamp01(mean);
  }

  function scoreColor(items) {
    const colors = items.map(i => i.color);
    const uniqueColors = [...new Set(colors)];
    const groups = colors.map(colorGroup);
    const hasNeutral = groups.includes('neutral');
    const accents = colors.filter(c => colorGroup(c) !== 'neutral');
    const uniqueAccents = [...new Set(accents)];
    const warmN = accents.filter(c => WARM.has(c)).length;
    const coolN = accents.filter(c => COOL.has(c)).length;

    let score;
    if (accents.length === 0) {
      score = 1.0;                                   // all neutrals — always safe
    } else if (uniqueAccents.length === 1) {
      score = hasNeutral ? 0.92 : 0.82;              // one accent (+ neutral base)
    } else {
      const sameTemp = warmN === 0 || coolN === 0;   // accents share a temperature
      if (sameTemp) score = hasNeutral ? 0.72 : 0.58;
      else          score = hasNeutral ? 0.5  : 0.3; // warm+cool mix; anchor helps
    }
    if (uniqueColors.length === 1) score = Math.max(score, 0.95); // tonal/monochrome
    if (uniqueColors.length > 3)   score -= 0.1 * (uniqueColors.length - 3);
    return clamp01(score);
  }

  function scoreSlots(slots) {
    if (!slots.top || !slots.bottom) return 0; // not a valid outfit
    let s = 0.7;
    if (slots.shoes) s += 0.15;
    if (slots.outerwear) s += 0.15;
    return clamp01(s);
  }

  function scorePattern(items) {
    // shoes carry no pattern signal in V1
    const pats = items.filter(i => i.cat !== 'shoes').map(i => i.patternFamily || 'solid');
    if (!pats.length) return 0.8;
    const loud  = pats.filter(p => LOUD.has(p)).length;
    const quiet = pats.filter(p => QUIET.has(p)).length;
    const others = pats.filter(p => p === 'other').length;
    const allSolid = pats.every(p => p === 'solid');

    let score;
    if (allSolid)             score = 1.0;
    else if (loud === 0)      score = 0.88;                  // solids + stripes
    else if (loud === 1)      score = others === 0 ? 0.82 : 0.6; // one statement piece
    else                      score = 0.3;                   // graphic+floral etc.
    if (loud >= 1 && quiet === 0) score -= 0.12;             // no calm anchor
    return clamp01(score);
  }

  function scoreMaterial(items, target) {
    const mats = items.filter(i => i.cat !== 'shoes').map(i => i.materialFamily).filter(Boolean);
    if (!mats.length) return 0.8;
    const has = (m) => mats.includes(m);
    if (target === 'casual') return clamp01(0.8 + (has('denim') || has('knit') ? 0.15 : 0));
    if (target === 'formal') {
      let s = 0.8;
      if (has('leather') || has('chiffon')) s += 0.08;
      if (has('denim')) s -= 0.2;                            // denim reads casual
      return clamp01(s);
    }
    return 0.8; // sports — material is a weak signal
  }

  function scoreSleeve(items, target) {
    const top = items.find(i => i.cat === 'top');
    const hasOuter = items.some(i => i.cat === 'outerwear');
    const sleeve = top && top.sleeveFamily;
    if (!sleeve) return 0.85;                                // unknown → neutral
    if (target === 'formal') {
      if (sleeve === 'sleeveless') return hasOuter ? 0.6 : 0.4; // formal wants coverage
      if (sleeve === 'short_sleeve') return hasOuter ? 0.85 : 0.7;
      return 1.0;                                            // long sleeve
    }
    // casual / sports — sleeve barely matters; small bump for sensible layering
    if (hasOuter && (sleeve === 'long_sleeve' || sleeve === 'short_sleeve')) return 1.0;
    return 0.9;
  }

  // ─── Occasion penalty layer (applied AFTER the weighted score) ───────────
  // Returns { penalty, reject } — reject kills hard occasion clashes outright.
  function occasionPenalty(items, target) {
    let penalty = 0;
    let reject = false;
    for (const it of items) {
      if (it.occasion === target) continue;                 // exact match — no penalty
      if (HARD_CLASH[target] && it.occasion === HARD_CLASH[target]) { reject = true; break; }
      penalty += 0.08;                                       // adjacent fallback
    }
    return { penalty, reject };
  }

  // ─── Explanations ────────────────────────────────────────────────────────
  function explain(items, target, breakdown) {
    const out = [];
    const colors = items.map(i => i.color);
    const accents = colors.filter(c => colorGroup(c) !== 'neutral');
    const uniqueColors = [...new Set(colors)];

    if (breakdown.color >= 0.95 && uniqueColors.length === 1) {
      out.push(`Tonal ${colors[0]} dressing — one color, head to toe.`);
    } else if (accents.length === 0) {
      out.push('A calm, all-neutral palette that pairs with anything.');
    } else if ([...new Set(accents)].length === 1) {
      out.push(`The ${accents[0]} piece pops against a neutral base.`);
    }

    const nonShoe = items.filter(i => i.cat !== 'shoes');
    const loudItem = nonShoe.find(i => LOUD.has(i.patternFamily));
    const solidAnchor = nonShoe.find(i => i.patternFamily === 'solid' && i !== loudItem);
    if (loudItem && solidAnchor) {
      out.push(`The solid ${solidAnchor.cat} anchors the ${loudItem.patternFamily} ${loudItem.cat}.`);
    } else if (breakdown.pattern >= 0.99) {
      out.push('Clean solids throughout — quiet and easy to wear.');
    }

    if (breakdown.occasion >= 0.99) {
      out.push(`Every piece reads ${target}.`);
    } else if (breakdown.occasion > 0) {
      out.push(`Mostly ${target}, with a flexible piece filling a gap.`);
    }

    if (items.some(i => i.cat === 'outerwear')) {
      const top = items.find(i => i.cat === 'top');
      if (top && (top.sleeveFamily === 'long_sleeve' || top.sleeveFamily === 'short_sleeve')) {
        out.push('The layer sits comfortably over the top without fighting it.');
      }
    }
    return out.slice(0, 2);
  }

  // ─── Candidate pools (occasion-first, limited fallback) ──────────────────
  function buildPools(items, target, capPerSlot) {
    const bySlot = { top: [], bottom: [], outerwear: [], shoes: [] };
    for (const it of items) if (bySlot[it.cat]) bySlot[it.cat].push(it);

    const pools = {};
    for (const slot of ['top', 'bottom', 'outerwear', 'shoes']) {
      const all = bySlot[slot] || [];
      let pool = all.filter(it => it.occasion === target);
      // Sparse slot → closest-score fallback from other occasions, gated + flagged.
      if (pool.length === 0 && all.length) {
        const fb = all
          .filter(it => occScore(it, target) >= FALLBACK_MIN_SCORE
                     && (topOccScore(it) - occScore(it, target)) <= FALLBACK_MAX_GAP)
          .map(it => ({ ...it, _fallback: true }));
        // If the gate is too strict for a sparse closet, still surface the best
        // target-scorers so required slots can be filled.
        pool = fb.length ? fb
          : all.slice().sort((a, b) => occScore(b, target) - occScore(a, target))
               .slice(0, 3).map(it => ({ ...it, _fallback: true }));
      }
      // rank by target-occasion alignment, then keep a tractable cap
      pool.sort((a, b) => occScore(b, target) - occScore(a, target));
      pools[slot] = pool.slice(0, capPerSlot);
    }
    return pools;
  }

  function scoreOutfit(slots, target) {
    const items = ['top', 'bottom', 'outerwear', 'shoes'].map(s => slots[s]).filter(Boolean);
    const breakdown = {
      occasion: scoreOccasion(items, target),
      color:    scoreColor(items),
      slot:     scoreSlots(slots),
      pattern:  scorePattern(items),
      sleeve:   scoreSleeve(items, target),
      material: scoreMaterial(items, target),
    };
    const weighted =
      W.occasion * breakdown.occasion + W.color * breakdown.color +
      W.slot * breakdown.slot + W.pattern * breakdown.pattern +
      W.sleeve * breakdown.sleeve + W.material * breakdown.material;
    const { penalty, reject } = occasionPenalty(items, target);
    const score = reject ? -1 : clamp01(weighted - penalty);
    return { items, breakdown, weighted, penalty, reject, score };
  }

  // ─── Main entry ──────────────────────────────────────────────────────────
  function recommend(wardrobe, target, opts) {
    opts = opts || {};
    const limit = opts.limit || 4;
    const capPerSlot = opts.capPerSlot || 6;
    if (!OCCASIONS.includes(target)) target = 'casual';

    const items = (wardrobe || []).map(normalize);
    const pools = buildPools(items, target, capPerSlot);

    if (!pools.top.length || !pools.bottom.length) {
      return { outfits: [], reason: 'need_top_and_bottom', pools };
    }

    const outerOpts = [null, ...pools.outerwear];
    const shoeOpts  = [null, ...pools.shoes];
    const results = [];
    for (const top of pools.top)
      for (const bottom of pools.bottom)
        for (const outerwear of outerOpts)
          for (const shoes of shoeOpts) {
            const slots = { top, bottom, outerwear, shoes };
            const r = scoreOutfit(slots, target);
            if (r.reject) continue;
            results.push({
              slots,
              items: r.items,
              score: r.score,
              breakdown: r.breakdown,
              penalty: r.penalty,
              fallbacks: r.items.filter(i => i._fallback).map(i => i.id),
              explanation: explain(r.items, target, r.breakdown),
            });
          }

    results.sort((a, b) => b.score - a.score);

    // de-dup near-identical top+bottom pairings to keep suggestions varied
    const seen = new Set();
    const picked = [];
    for (const r of results) {
      const key = r.slots.top.id + '|' + r.slots.bottom.id;
      if (seen.has(key)) continue;
      seen.add(key);
      picked.push(r);
      if (picked.length >= limit) break;
    }
    return { outfits: picked, target, pools };
  }

  window.SS_RECO = { recommend, normalize, scoreOutfit, OCCASIONS, WEIGHTS: W };
})();

// Shared types between client and API routes.

export type Category = 'top' | 'bottom' | 'dress' | 'outerwear' | 'shoes';

// ── Model B (occasion) + Model C (attribute) label spaces ──
export type Occasion = 'casual' | 'formal' | 'sports';
export type PatternFamily = 'solid' | 'striped' | 'graphic' | 'floral' | 'other';
export type MaterialFamily = 'denim' | 'knit' | 'leather' | 'chiffon' | 'other';
export type SleeveFamily = 'sleeveless' | 'short_sleeve' | 'long_sleeve';

export type Vibe =
  | 'casual'
  | 'business_casual'
  | 'minimal'
  | 'athletic'
  | 'punk'
  | 'cottage';

export type WardrobeItem = {
  id: string;
  label: string;       // e.g. "Linen tee"
  cat: Category;
  color: string;       // named color, e.g. "blue"
  swatch: string;      // hex, e.g. "#5A7CA8"
  pattern?: string;    // solid / stripe / denim / rib / ...
  fabric?: string;
  tags: Vibe[];
  image: string;       // public URL to the uploaded photo
  confidence?: number; // category-model confidence at upload time

  // ── Structured model outputs (Models B & C). Optional so older items
  //    saved before integration still load; the recommender falls back to
  //    `tags` / `pattern` / `fabric` when these are missing.
  occasion?: Occasion;
  occasionConfidence?: number;
  patternFamily?: PatternFamily;
  materialFamily?: MaterialFamily;
  sleeveFamily?: SleeveFamily;

  createdAt: number;
};

export type SavedOutfit = {
  id: string;
  name: string;
  slots: Record<Category, string | null>; // wardrobe item IDs
  tag: Vibe | null;
  createdAt: number;
};

export type Prediction = {
  // Model A — category
  category: Category;
  subcategory: string;
  // Color extractor
  color: string;
  swatch: string;
  confidence: number;

  // Model B — occasion
  occasion?: Occasion;
  occasionConfidence?: number;

  // Model C — multi-head attributes. Null when the head doesn't apply to the
  // predicted category (e.g. sleeve on bottomwear) or wasn't returned.
  patternFamily?: PatternFamily | null;
  materialFamily?: MaterialFamily | null;
  sleeveFamily?: SleeveFamily | null;
};

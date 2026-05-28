// Thin wrapper around the Hugging Face Space hosting the ResNet classifier.
// Uses @gradio/client which handles Gradio's two-step REST protocol for us.

import { Client } from '@gradio/client';
import type {
  Prediction, Category, Occasion, PatternFamily, MaterialFamily, SleeveFamily,
} from './types';

const SPACE_ID = process.env.HF_SPACE_ID || 'aaron8wong/stylesync-app';

let cachedClient: Awaited<ReturnType<typeof Client.connect>> | null = null;

async function getClient() {
  if (!cachedClient) {
    cachedClient = await Client.connect(SPACE_ID);
  }
  return cachedClient;
}

// Defensive coercion — the model's category labels match our frontend
// already, but if anything drifts we map it here.
const VALID_CATEGORIES = new Set<Category>([
  'top', 'bottom', 'dress', 'outerwear', 'shoes',
]);

function coerceCategory(raw: unknown): Category {
  const s = String(raw).toLowerCase();
  return (VALID_CATEGORIES.has(s as Category) ? s : 'top') as Category;
}

// ── Model B / Model C label coercion ──
// Each head can legitimately return null (head not applicable to the predicted
// category, or absent because the model isn't deployed yet). We coerce known
// labels, pass null through, and drop anything unexpected to null so a noisy
// label never crashes the recommender downstream.
const VALID_OCCASIONS = new Set<Occasion>(['casual', 'formal', 'sports']);
const VALID_PATTERNS  = new Set<PatternFamily>(['solid', 'striped', 'graphic', 'floral', 'other']);
const VALID_MATERIALS = new Set<MaterialFamily>(['denim', 'knit', 'leather', 'chiffon', 'other']);
const VALID_SLEEVES   = new Set<SleeveFamily>(['sleeveless', 'short_sleeve', 'long_sleeve']);

function coerceOccasion(raw: unknown): Occasion | undefined {
  if (raw == null) return undefined;
  const s = String(raw).toLowerCase();
  return VALID_OCCASIONS.has(s as Occasion) ? (s as Occasion) : undefined;
}
function coerceFromSet<T extends string>(raw: unknown, set: Set<T>): T | null {
  if (raw == null) return null;
  const s = String(raw).toLowerCase().replace(/[\s-]+/g, '_');
  return set.has(s as T) ? (s as T) : null;
}
function coerceConfidence(raw: unknown): number | undefined {
  return typeof raw === 'number' && raw >= 0 && raw <= 1 ? raw : undefined;
}

/**
 * Run a single prediction. Accepts a Blob/File (image data).
 * Returns the structured prediction or throws on failure.
 */
export async function predictClothing(image: Blob): Promise<Prediction> {
  const client = await getClient();

  // Our HF Space registered the fn as `api_name="predict"` → the route is "/predict".
  const result = await client.predict('/predict', [image]);

  const data = Array.isArray(result.data) ? result.data[0] : result.data;
  if (!data || typeof data !== 'object') {
    throw new Error('HF Space returned no prediction data');
  }

  const d = data as Record<string, unknown>;

  return {
    category:    coerceCategory(d.category),
    subcategory: String(d.subcategory ?? d.category ?? ''),
    color:       String(d.color ?? 'gray'),
    swatch:      String(d.swatch ?? '#B5B0A5'),
    confidence:  typeof d.confidence === 'number' ? d.confidence : 0,

    // Model B — occasion (accepts `occasion` + optional `occasion_confidence`)
    occasion:           coerceOccasion(d.occasion),
    occasionConfidence: coerceConfidence(d.occasion_confidence),

    // Model C — attribute heads (snake_case from the Space, null when N/A)
    patternFamily:  coerceFromSet<PatternFamily>(d.pattern_family, VALID_PATTERNS),
    materialFamily: coerceFromSet<MaterialFamily>(d.material_family, VALID_MATERIALS),
    sleeveFamily:   coerceFromSet<SleeveFamily>(d.sleeve_family, VALID_SLEEVES),
  };
}

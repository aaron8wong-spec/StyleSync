// GET  /api/outfits → { outfits: SavedOutfit[] }  (saved looks from KV)
// POST /api/outfits → generate recommendations
//      body: { occasion: 'casual' | 'formal' | 'sports' }
//      returns: { outfits: Outfit[] }

import { NextResponse } from 'next/server';
import { loadOutfits, loadWardrobe } from '@/lib/kv-store';
import { generateOutfits } from '@/lib/outfitEngine';
import type { Occasion } from '@/lib/types';

export const runtime = 'nodejs';

const VALID_OCCASIONS: Occasion[] = ['casual', 'formal', 'sports'];

export async function GET() {
  const outfits = await loadOutfits();
  return NextResponse.json({ outfits });
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { occasion?: string };
    const occasion = body.occasion;

    if (!occasion || !(VALID_OCCASIONS as string[]).includes(occasion)) {
      return NextResponse.json(
        { error: `occasion must be one of: ${VALID_OCCASIONS.join(', ')}` },
        { status: 400 },
      );
    }

    const wardrobe = await loadWardrobe();
    const outfits  = generateOutfits(wardrobe, occasion);

    return NextResponse.json({ outfits });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

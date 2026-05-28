// POST /api/recommend
// Body: { occasion: 'casual'|'formal'|'sports', limit?: number }
// Returns: { outfits: Outfit[], target }
//
// Runs the V1 rule-based engine over the caller's stored wardrobe. Pure logic —
// no model call, so this is fast and has no cold-start. The wardrobe is read
// from Vercel KV (same store the rest of the app uses).
//
// GET /api/recommend?occasion=casual  → same, convenience for quick testing.

import { NextResponse } from 'next/server';
import { loadWardrobe } from '@/lib/kv-store';
import { recommend, OCCASIONS } from '@/lib/recommend';
import type { Occasion } from '@/lib/types';

export const runtime = 'nodejs';

function coerceOccasion(raw: unknown): Occasion {
  const s = String(raw || '').toLowerCase();
  return (OCCASIONS as string[]).includes(s) ? (s as Occasion) : 'casual';
}

async function run(occasion: Occasion, limit: number) {
  const wardrobe = await loadWardrobe();
  return recommend(wardrobe, occasion, { limit });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const occasion = coerceOccasion(url.searchParams.get('occasion'));
  const limit = Number(url.searchParams.get('limit')) || 4;
  try {
    return NextResponse.json(await run(occasion, limit));
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as { occasion?: string; limit?: number };
    const occasion = coerceOccasion(body.occasion);
    const limit = body.limit ?? 4;
    return NextResponse.json(await run(occasion, limit));
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

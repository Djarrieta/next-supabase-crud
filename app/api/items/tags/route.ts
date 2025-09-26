import { NextResponse } from 'next/server';
import { listAllItemTags } from '@/app/items/tags/actions';

export const revalidate = 300; // cache for 5 minutes

export async function GET() {
  try {
    const tags = await listAllItemTags();
    // Just return name list to keep payload small
    return NextResponse.json((tags || []).map((t: any) => ({ name: t.name })));
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to load tags' }, { status: 500 });
  }
}

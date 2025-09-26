import { NextResponse } from 'next/server';
import { getAllPersonTags } from '@/app/persons/tags/actions';

export const revalidate = 300;

export async function GET() {
  try {
    const tags = await getAllPersonTags();
    return NextResponse.json((tags || []).map((t: any) => ({ name: t.name })));
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to load tags' }, { status: 500 });
  }
}

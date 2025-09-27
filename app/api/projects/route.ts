import { NextResponse } from 'next/server';
import { getProjectsService } from '@/app/projects/service';

export const revalidate = 60; // refresh list every minute

// Simple lightweight projects listing API for client selectors.
// Supports optional ?q= substring filter and ?limit=.
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const q = url.searchParams.get('q')?.trim() || ''; // substring on name
    const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') || '25', 10) || 25, 1), 100);
    // Use service list to reuse filters (status=active by default)
    const res = await getProjectsService().list({ nameQuery: q || undefined, status: 'active' }, 1, limit);
    return NextResponse.json(res.rows.map(r => ({ id: (r as any).id, name: (r as any).name, personId: (r as any).personId })));
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to load projects' }, { status: 500 });
  }
}

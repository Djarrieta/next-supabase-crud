// Projects service
//  - Create / update projects (name, description, status, personId)
//  - Soft delete via status = 'archived'
//  - Paginated listing with optional status, ids, nameQuery, personIds
//  - Repository: Drizzle (if DB env var) else Supabase
import { getSupabaseClient } from '@/lib/supabaseClient';
import { getDb, projects, persons } from '@/lib/db/client';
import { and, eq, ilike, inArray, sql } from 'drizzle-orm';
import type { Project, ProjectStatus } from './schema';

export interface ProjectUpdate { name?: string; description?: string; status?: ProjectStatus; personId?: number }
export interface PaginatedResult<T> { rows: T[]; total: number; page: number; pageSize: number }
export interface ProjectsListFilters { status?: string; ids?: number[]; nameQuery?: string; personIds?: number[] }

export interface ProjectRepository {
  create(name: string, description: string, personId: number): Promise<void>;
  update(id: number, update: ProjectUpdate): Promise<void>;
  list(filters: ProjectsListFilters, page: number, pageSize: number): Promise<PaginatedResult<Project>>;
  get(id: number): Promise<Project | null>;
}

class DrizzleProjectRepository implements ProjectRepository {
  async create(name: string, description: string, personId: number) {
    const db = getDb();
    // Validate person exists
    const pr = await db.select({ id: persons.id }).from(persons).where(eq(persons.id, personId)).limit(1);
    if (!pr.length) throw new Error('Invalid personId');
    await db.insert(projects).values({ name, description, personId: personId as any }).returning({ id: projects.id });
  }
  async update(id: number, update: ProjectUpdate) {
    const db = getDb();
    const patch: Record<string, unknown> = {};
    if (update.name !== undefined) patch.name = update.name;
    if (update.description !== undefined) patch.description = update.description;
    if (update.status !== undefined) patch.status = update.status;
    if (update.personId !== undefined) {
      const pr = await db.select({ id: persons.id }).from(persons).where(eq(persons.id, update.personId)).limit(1);
      if (!pr.length) throw new Error('Invalid personId');
      patch.personId = update.personId;
    }
    if (Object.keys(patch).length) await db.update(projects).set(patch).where(eq(projects.id, id));
  }
  async list(filters: ProjectsListFilters, page: number, pageSize: number): Promise<PaginatedResult<Project>> {
    const db = getDb();
    const offset = (page - 1) * pageSize;
    const clauses: any[] = [];
    if (filters.status && filters.status !== 'all') clauses.push(eq(projects.status, filters.status as any));
    if (filters.ids && filters.ids.length) clauses.push(inArray(projects.id, filters.ids));
    if (filters.personIds && filters.personIds.length) clauses.push(inArray(projects.personId, filters.personIds));
    if (filters.nameQuery) clauses.push(ilike(projects.name, `%${filters.nameQuery}%`));
    const whereExpr = clauses.length ? and(...clauses) : undefined;
    const countQuery = whereExpr
      ? db.select({ value: sql<number>`count(*)` }).from(projects).where(whereExpr)
      : db.select({ value: sql<number>`count(*)` }).from(projects);
    const [{ value: total }] = await countQuery;
    const baseRows = whereExpr
      ? await db.select().from(projects).where(whereExpr).orderBy(projects.id).limit(pageSize).offset(offset)
      : await db.select().from(projects).orderBy(projects.id).limit(pageSize).offset(offset);
    // fetch persons
    const personIds = Array.from(new Set(baseRows.map(r => (r as any).personId).filter((v: any) => v)));
    const personMap = new Map<number, { id: number; name: string }>();
    if (personIds.length) {
      const prs = await db.select().from(persons).where(inArray(persons.id, personIds));
      prs.forEach(p => personMap.set(p.id as number, { id: p.id as number, name: (p as any).name || '' }));
    }
    const mapped: Project[] = baseRows.map(r => ({ ...(r as any), person: personMap.get((r as any).personId) }));
    return { rows: mapped, total: Number(total) || 0, page, pageSize };
  }
  async get(id: number): Promise<Project | null> {
    const db = getDb();
    const rows = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
    if (!rows.length) return null;
    const row: any = rows[0];
    let p: { id: number; name: string } | undefined;
    if (row.personId) {
      const prs = await db.select().from(persons).where(eq(persons.id, row.personId));
      if (prs.length) p = { id: prs[0].id as number, name: (prs[0] as any).name || '' };
    }
    return { ...row, person: p } as Project;
  }
}

class SupabaseProjectRepository implements ProjectRepository {
  async create(name: string, description: string, personId: number) {
    const supabase = getSupabaseClient();
    await supabase.from('projects').insert({ name, description, person_id: personId }).single();
  }
  async update(id: number, update: ProjectUpdate) {
    const supabase = getSupabaseClient();
    const patch: Record<string, unknown> = {};
    if (update.name !== undefined) patch.name = update.name;
    if (update.description !== undefined) patch.description = update.description;
    if (update.status !== undefined) patch.status = update.status;
    if (update.personId !== undefined) patch.person_id = update.personId;
    if (Object.keys(patch).length) await supabase.from('projects').update(patch).eq('id', id).single();
  }
  async list(filters: ProjectsListFilters, page: number, pageSize: number): Promise<PaginatedResult<Project>> {
    const supabase = getSupabaseClient();
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    let query = supabase.from('projects').select('id, name, description, status, person_id', { count: 'exact' }).order('id').range(from, to);
    if (filters.status && filters.status !== 'all') query = query.eq('status', filters.status);
    if (filters.ids && filters.ids.length) query = query.in('id', filters.ids);
    if (filters.personIds && filters.personIds.length) query = query.in('person_id', filters.personIds);
    if (filters.nameQuery) query = query.ilike('name', `%${filters.nameQuery}%`);
    const { data, error, count } = await query;
    if (error) throw error;
    const rows = (data || []) as any[];
    const personIds = Array.from(new Set(rows.map(r => r.person_id).filter(Boolean)));
    let personMap = new Map<number, { id: number; name: string }>();
    if (personIds.length) {
      const { data: prRows } = await supabase.from('persons').select('id, name').in('id', personIds);
      (prRows || []).forEach(pr => personMap.set((pr as any).id, { id: (pr as any).id, name: (pr as any).name }));
    }
    const mapped: Project[] = rows.map(r => ({ id: r.id, name: r.name, description: r.description, status: r.status, personId: r.person_id, person: personMap.get(r.person_id) }));
    return { rows: mapped, total: count || 0, page, pageSize };
  }
  async get(id: number): Promise<Project | null> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.from('projects').select('id, name, description, status, person_id').eq('id', id).maybeSingle();
    if (error) throw error;
    if (!data) return null;
    let person: { id: number; name: string } | undefined;
    if ((data as any).person_id) {
      const { data: pr } = await supabase.from('persons').select('id, name').eq('id', (data as any).person_id).maybeSingle();
      if (pr) person = { id: (pr as any).id, name: (pr as any).name };
    }
    return { id: (data as any).id, name: (data as any).name, description: (data as any).description, status: (data as any).status, personId: (data as any).person_id, person } as Project;
  }
}

export class ProjectsService {
  constructor(private repo: ProjectRepository) {}
  async createFromForm(fd: FormData) {
    const name = String(fd.get('name') || '').trim() || 'Unnamed';
    const description = String(fd.get('description') || '').trim();
    const personId = Number(fd.get('personId'));
    if (!Number.isInteger(personId) || personId <= 0) throw new Error('Invalid person');
    await this.repo.create(name, description, personId);
  }
  async updateFromForm(fd: FormData) {
    const id = this.extractId(fd);
    const name = fd.get('name') != null ? String(fd.get('name') || '').trim() : undefined;
    const description = String(fd.get('description') || '').trim();
    const rawStatus = String(fd.get('status') || '').trim();
    const status = rawStatus ? (['active','inactive','archived'].includes(rawStatus) ? rawStatus as ProjectStatus : undefined) : undefined;
    const personIdRaw = fd.get('personId');
    const personId = personIdRaw != null ? Number(personIdRaw) : undefined;
    await this.repo.update(id, { name, description, status, personId });
  }
  async softDeleteFromForm(fd: FormData) {
    const id = this.extractId(fd);
    await this.repo.update(id, { status: 'archived' });
  }
  async list(filters: ProjectsListFilters, page: number, pageSize: number) {
    const allowed = ['active','inactive','archived','all'];
    const status = filters.status && allowed.includes(filters.status) ? filters.status : filters.status ? 'active' : undefined;
    const ids = (filters.ids || []).filter(v => Number.isInteger(v) && v > 0);
    const nameQuery = (filters.nameQuery || '').trim() || undefined;
    const personIds = (filters.personIds || []).filter(v => Number.isInteger(v) && v > 0);
    const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
    const safePageSize = Number.isFinite(pageSize) && pageSize > 0 && pageSize <= 100 ? Math.floor(pageSize) : 10;
    return this.repo.list({ status, ids, nameQuery, personIds }, safePage, safePageSize);
  }
  async get(id: number) { return this.repo.get(id); }
  private extractId(fd: FormData): number { const raw = fd.get('id'); if (!raw) throw new Error('Missing project id'); const id = Number(raw); if (Number.isNaN(id)) throw new Error('Invalid project id'); return id; }
}

let _service: ProjectsService | null = null;
export function getProjectsService(): ProjectsService {
  if (!_service) {
    const useDrizzle = Boolean(process.env.DATABASE_URL || process.env.DRIZZLE_DATABASE_URL);
    _service = new ProjectsService(useDrizzle ? new DrizzleProjectRepository() : new SupabaseProjectRepository());
  }
  return _service;
}

"use server";
import { revalidatePath } from 'next/cache';
import { getProjectsService } from './service';
import type { ProjectsListFilters } from './service';

export async function createProject(fd: FormData) {
  try { await getProjectsService().createFromForm(fd); } catch (e) { console.error('createProject failed:', e); throw e; }
  revalidatePath('/projects');
}
export async function updateProject(fd: FormData) {
  try { await getProjectsService().updateFromForm(fd); } catch (e) { console.error('updateProject failed:', e); throw e; }
  revalidatePath('/projects'); const id = fd.get('id'); if (id) revalidatePath(`/projects/${id}`);
}
export async function deleteProject(fd: FormData) {
  try { await getProjectsService().softDeleteFromForm(fd); } catch (e) { console.error('deleteProject failed:', e); throw e; }
  revalidatePath('/projects'); const id = fd.get('id'); if (id) revalidatePath(`/projects/${id}`);
}
export async function listProjects(filters: ProjectsListFilters, page: number, pageSize: number) {
  try { return await getProjectsService().list(filters, page, pageSize); } catch (e) { console.error('listProjects failed:', e); throw e; }
}
export async function getProject(id: number) { try { return await getProjectsService().get(id); } catch (e) { console.error('getProject failed:', e); throw e; } }

"use server";
import { revalidatePath } from 'next/cache';
import { getPersonsService } from '@/app/persons/service';
import type { PersonsListFilters } from '@/app/persons/service';

export async function createPerson(formData: FormData) {
  try { await getPersonsService().createFromForm(formData); } catch (e) { console.error('createPerson failed:', e); throw e; }
  revalidatePath('/persons');
}
export async function updatePerson(formData: FormData) {
  try { await getPersonsService().updateFromForm(formData); } catch (e) { console.error('updatePerson failed:', e); throw e; }
  revalidatePath('/persons');
  const id = formData.get('id'); if (id) revalidatePath(`/persons/${id}`);
}
export async function deletePerson(formData: FormData) {
  try { await getPersonsService().softDeleteFromForm(formData); } catch (e) { console.error('deletePerson failed:', e); throw e; }
  revalidatePath('/persons'); const id = formData.get('id'); if (id) revalidatePath(`/persons/${id}`);
}
export async function listPersons(filters: PersonsListFilters, page: number, pageSize: number) {
  try { return await getPersonsService().list(filters, page, pageSize); } catch (e) { console.error('listPersons failed:', e); throw e; }
}
export async function getPerson(id: number) {
  try { return await getPersonsService().get(id); } catch (e) { console.error('getPerson failed:', e); throw e; }
}

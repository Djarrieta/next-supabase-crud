"use server";
// Server actions for Persons.
import { revalidatePath } from 'next/cache';
import { getPersonsService } from '@/app/persons/service';
import type { PersonStatus } from '@/app/persons/schema';

export async function createPerson(formData: FormData) {
  try { await getPersonsService().createFromForm(formData); } catch (e) { console.error('createPerson failed:', e); throw e; }
  revalidatePath('/persons');
}

export async function updatePerson(formData: FormData) {
  try { await getPersonsService().updateFromForm(formData); } catch (e) { console.error('updatePerson failed:', e); throw e; }
  revalidatePath('/persons');
}

export async function deletePerson(formData: FormData) {
  try { await getPersonsService().softDeleteFromForm(formData); } catch (e) { console.error('deletePerson failed:', e); throw e; }
  revalidatePath('/persons');
}

export async function listPersons(statusFilter: PersonStatus | 'all', page: number, pageSize: number) {
  try { return await getPersonsService().list(statusFilter, page, pageSize); } catch (e) { console.error('listPersons failed:', e); throw e; }
}

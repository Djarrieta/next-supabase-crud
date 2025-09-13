"use server";
// Server actions for personTags (global catalog for people)
import { getPersonTagsService } from '@/app/persons/tags/service';
import { revalidatePath } from 'next/cache';

export async function listPersonTags(page: number, pageSize: number) {
  try { return await getPersonTagsService().list(page, pageSize); } catch (e) { console.error('listPersonTags failed:', e); throw e; }
}

export async function listAllPersonTags() {
  try { return await getPersonTagsService().listAll(); } catch (e) { console.error('listAllPersonTags failed:', e); throw e; }
}

export async function updatePersonTag(formData: FormData) {
  try { await getPersonTagsService().updateFromForm(formData); } catch (e) { console.error('updatePersonTag failed:', e); throw e; }
  revalidatePath('/persons/tags');
}

export async function deletePersonTag(formData: FormData) {
  try { await getPersonTagsService().deleteFromForm(formData); } catch (e) { console.error('deletePersonTag failed:', e); throw e; }
  revalidatePath('/persons/tags');
}

export async function createPersonTag(formData: FormData) {
  try { await getPersonTagsService().createFromForm(formData); } catch (e) { console.error('createPersonTag failed:', e); throw e; }
  revalidatePath('/persons/tags');
}

"use server";
import { revalidatePath } from 'next/cache';
import { getPersonTagsService } from './service';

export async function listPersonTags(page: number, pageSize: number) { try { return await getPersonTagsService().list(page, pageSize); } catch (e) { console.error('listPersonTags failed:', e); throw e; } }
export async function getAllPersonTags() { try { return await getPersonTagsService().listAll(); } catch (e) { console.error('getAllPersonTags failed:', e); throw e; } }
export async function updatePersonTag(fd: FormData) { try { await getPersonTagsService().updateFromForm(fd); } catch (e) { console.error('updatePersonTag failed:', e); throw e; } revalidatePath('/persons/tags'); }
export async function deletePersonTag(fd: FormData) { try { await getPersonTagsService().deleteFromForm(fd); } catch (e) { console.error('deletePersonTag failed:', e); throw e; } revalidatePath('/persons/tags'); }
export async function createPersonTag(fd: FormData) { try { await getPersonTagsService().createFromForm(fd); } catch (e) { console.error('createPersonTag failed:', e); throw e; } revalidatePath('/persons/tags'); }

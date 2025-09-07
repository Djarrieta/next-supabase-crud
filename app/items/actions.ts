// Server actions for Items.
// Only import the domain service (app/items/domain/service) and framework utilities (next/*).
// Do NOT import UI components or client-only modules here.

"use server";
import { revalidatePath } from "next/cache";
import { getItemsService } from "@/app/items/domain/service";

export async function createItem(formData: FormData) {
  try {
    await getItemsService().createFromForm(formData);
  } catch (e) {
    console.error("createItem failed:", e);
    throw e;
  }
  revalidatePath("/items");
}

export async function updateItem(formData: FormData) {
  try {
    await getItemsService().updateFromForm(formData);
  } catch (e) {
    console.error("updateItem failed:", e);
    throw e;
  }
  revalidatePath("/items");
}

export async function deleteItem(formData: FormData) {
  try {
    await getItemsService().softDeleteFromForm(formData);
  } catch (e) {
    console.error("deleteItem failed:", e);
    throw e;
  }
  revalidatePath("/items");
}

export async function listItems(statusFilter: string, page: number, pageSize: number) {
  try {
    return await getItemsService().list(statusFilter, page, pageSize);
  } catch (e) {
    console.error("listItems failed:", e);
    throw e;
  }
}

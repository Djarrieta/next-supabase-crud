"use server";
import { revalidatePath } from "next/cache";
import { getItemsService } from "@/lib/items/service";

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

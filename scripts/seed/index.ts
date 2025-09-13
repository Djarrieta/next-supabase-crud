import { seedItemTags, seedItems } from "./items";

async function main() {
  // Seeds itemTags and items
  const seededItemTags = await seedItemTags(5);
  await seedItems(seededItemTags, 101);
  

  console.log("Seed complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
// person seed functions moved to ./persons



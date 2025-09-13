import { seedItemTags, seedItems } from "./items";
import { seedPersonTags, seedPersons } from "./persons";

async function main() {
  // Seeds itemTags and items
  const seededItemTags = await seedItemTags(5);
  await seedItems(seededItemTags, 1000);
  
  // Seeds personTags and persons
  const personTagRows = await seedPersonTags(5);
  await seedPersons(personTagRows, 200);
  console.log("Seed complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
// person seed functions moved to ./persons



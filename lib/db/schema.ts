// Central Drizzle schema aggregator.
// Feature schemas live in app/<feature>/domain/schema.ts and are re-exported here.
// Only import pure schema modules (no React/Next/UI imports, no side-effects).

export { items, itemStatusEnum, ITEM_STATUS_VALUES } from '@/app/items/schema';
export type { Item, NewItem, ItemStatus } from '@/app/items/schema';

// itemTags feature
export { itemTags } from '@/app/items/tags/schema';
export type { ItemTagRow, NewItemTagRow } from '@/app/items/tags/schema';

// persons feature
export { persons, personStatusEnum, PERSON_STATUS_VALUES, personTypeEnum, PERSON_TYPE_VALUES } from '@/app/persons/schema';
export type { Person, NewPerson, PersonStatus } from '@/app/persons/schema';

// personTags feature
export { personTags } from '@/app/persons/tags/schema';
export type { PersonTagRow, NewPersonTagRow } from '@/app/persons/tags/schema';



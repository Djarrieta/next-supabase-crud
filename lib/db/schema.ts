// Central Drizzle schema aggregator.
// Feature schemas live in app/<feature>/domain/schema.ts and are re-exported here.
// Only import pure schema modules (no React/Next/UI imports, no side-effects).

export { items, itemStatusEnum, ITEM_STATUS_VALUES } from '@/app/items/domain/schema';
export type { Item, NewItem, ItemStatus } from '@/app/items/domain/schema';

// itemTags feature
export { itemTags } from '@/app/item-tags/domain/schema';
export type { ItemTagRow, NewItemTagRow } from '@/app/item-tags/domain/schema';



// Central Drizzle schema aggregator.
// Feature schemas live in app/<feature>/domain/schema.ts and are re-exported here.
// Only import pure schema modules (no React/Next/UI imports, no side-effects).

export { items, itemStatusEnum, ITEM_STATUS_VALUES } from '@/app/items/domain/schema';
export type { Item, NewItem, ItemStatus } from '@/app/items/domain/schema';

// Future additions:
// export { users } from '@/app/users/domain/schema';
// export type { User } from '@/app/users/domain/schema';

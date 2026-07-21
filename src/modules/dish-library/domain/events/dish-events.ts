/**
 * Dish domain events — defined, not emitted yet.
 * @see docs/12-domain-model/module-01/Dish.md
 */

export type DishDomainEvent =
  | DishCreatedEvent
  | DishUpdatedEvent
  | DishActivatedEvent
  | DishDeactivatedEvent
  | DishArchivedEvent
  | DishRestoredEvent
  | RecipeAssignedEvent
  | RecipeUpdatedEvent
  | DishDuplicatedEvent;

export type DishCreatedEvent = {
  type: "DishCreated";
  dishId: string;
  tenantId: string;
};

export type DishUpdatedEvent = {
  type: "DishUpdated";
  dishId: string;
  tenantId: string;
};

export type DishActivatedEvent = {
  type: "DishActivated";
  dishId: string;
  tenantId: string;
};

export type DishDeactivatedEvent = {
  type: "DishDeactivated";
  dishId: string;
  tenantId: string;
};

export type DishArchivedEvent = {
  type: "DishArchived";
  dishId: string;
  tenantId: string;
};

export type DishRestoredEvent = {
  type: "DishRestored";
  dishId: string;
  tenantId: string;
};

export type RecipeAssignedEvent = {
  type: "RecipeAssigned";
  dishId: string;
  tenantId: string;
};

export type RecipeUpdatedEvent = {
  type: "RecipeUpdated";
  dishId: string;
  tenantId: string;
};

export type DishDuplicatedEvent = {
  type: "DishDuplicated";
  sourceDishId: string;
  newDishId: string;
  tenantId: string;
};

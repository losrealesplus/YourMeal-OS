import type { DishDomainEvent } from "../domain/events";

/**
 * Application ports for Dish use cases — contracts only.
 * @see docs/14-application/use-cases/CreateDishUseCase.md
 */

export interface IdGenerator {
  generate(): string;
}

export interface Clock {
  now(): Date;
}

export interface EventPublisher {
  publish(events: readonly DishDomainEvent[]): Promise<void>;
}

export const systemClock: Clock = {
  now: () => new Date(),
};

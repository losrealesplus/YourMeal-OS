# Domain events (scaffold)

**Status:** Prepared only — do not implement brokers, queues, or consumers yet.

Future events will connect notifications, automation, and AI without coupling UI to side effects.

## Planned events

| Event | When |
|-------|------|
| `DishCreated` | Dish created |
| `DishPublished` | Dish → published |
| `DishArchived` | Dish archived |
| `OrderConfirmed` | Order confirmed |
| `MenuPublished` | Weekly Menu published |
| `InventoryUpdated` | Stock changed |
| `InvoicePaid` | Payment recorded |
| `RouteCompleted` | Delivery Route completed |
| `ProductionStarted` | Production Batch → running |

## Package location

```text
packages/events/
  src/
    types.ts      # Event name union + payloads (stubs)
    index.ts
  README.md
```

Not a workspace dependency yet (single-app). Types can be imported via path alias when Module 01+ needs them.

## Rule

Services own emission later. Presentation never emits domain events directly.

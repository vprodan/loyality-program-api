interface BaseEvent {
  EventTime: string;
  EventName: string;
  EntityName: string;
  Sequence: number;
  Payload: Record<string, unknown>;
}

interface OrderReturnedEvent extends BaseEvent {
  EventName: "OrderReturned";
  EntityName: "Order";
  Payload: {
    OrderId: string;
  };
}

interface OrderPlacedEvent extends BaseEvent {
  EventName: "OrderPlaced";
  EntityName: "Order";
  Payload: {
    OrderId: string;
    CustomerId: string;
    TotalOrderAmount: number;
  };
}

interface OrderCanceledEvent extends BaseEvent {
  EventName: "OrderCanceled";
  EntityName: "Order";
  Payload: {
    OrderId: string;
  };
}

interface CustomerDeletedEvent extends BaseEvent {
  EventName: "CustomerDeleted";
  EntityName: "Customer";
  Payload: {
    CustomerId: string;
  };
}

interface CustomerCreatedEvent extends BaseEvent {
  EventName: "CustomerCreated";
  EntityName: "Customer";
  Payload: {
    CustomerId: string;
  };
}

declare type WebhookEvent =
  | OrderReturnedEvent
  | OrderPlacedEvent
  | OrderCanceledEvent
  | CustomerDeletedEvent
  | CustomerCreatedEvent;

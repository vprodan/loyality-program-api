interface BaseEvent {
  EventTime: string;
  EventName: string;
  EntityName: string;
  Sequence: number;
  Payload: Record<string, unknown>;
}

export interface OrderReturnedEvent extends BaseEvent {
  EventName: "OrderReturned";
  EntityName: "Order";
  Payload: {
    OrderId: string;
  };
}

export interface OrderPlacedEvent extends BaseEvent {
  EventName: "OrderPlaced";
  EntityName: "Order";
  Payload: {
    OrderId: string;
    CustomerId: string;
    TotalOrderAmount: number;
  };
}

export interface OrderCanceledEvent extends BaseEvent {
  EventName: "OrderCanceled";
  EntityName: "Order";
  Payload: {
    OrderId: string;
  };
}

export interface CustomerDeletedEvent extends BaseEvent {
  EventName: "CustomerDeleted";
  EntityName: "Customer";
  Payload: {
    CustomerId: string;
  };
}

export interface CustomerCreatedEvent extends BaseEvent {
  EventName: "CustomerCreated";
  EntityName: "Customer";
  Payload: {
    CustomerId: string;
  };
}

export type WebhookEvent =
  | OrderReturnedEvent
  | OrderPlacedEvent
  | OrderCanceledEvent
  | CustomerDeletedEvent
  | CustomerCreatedEvent;

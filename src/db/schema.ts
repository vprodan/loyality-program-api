import { and, lte, sql, or, gt, gte, isNull } from "drizzle-orm";
import { pgTable, uuid, timestamp, serial, integer, index, check } from "drizzle-orm/pg-core";

export const pointTransaction = pgTable(
  "point_transaction",
  {
    id: serial("id").primaryKey(),
    customerId: uuid("customer_id").notNull(),
    orderId: uuid("order_id").unique().notNull(),
    earned: integer("earned").notNull(),
    available: integer("available").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    removedAt: timestamp("removed_at"),
  },
  (pointTransaction) => {
    const notRemovedOrPositiveBalance = or(
      isNull(pointTransaction.removedAt),
      gt(pointTransaction.available, sql.raw("0")),
    )!;

    return [
      index("customer_idx").on(pointTransaction.customerId).where(notRemovedOrPositiveBalance),
      index("order_idx").on(pointTransaction.orderId).where(notRemovedOrPositiveBalance),
      index("created_at_idx").on(pointTransaction.createdAt).where(notRemovedOrPositiveBalance),
      check("earned_gte_0", gt(pointTransaction.earned, sql.raw("0"))),
      check(
        "available_gte_0_lte_earned",
        and(
          gte(pointTransaction.available, sql.raw("0")),
          lte(pointTransaction.available, pointTransaction.earned),
        )!,
      ),
    ];
  },
);

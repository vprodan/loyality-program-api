import { isNotNull, and, gte, lte, sql } from "drizzle-orm";
import { pgTable, uuid, timestamp, serial, integer, index, check } from "drizzle-orm/pg-core";

export const pointTransactions = pgTable(
  "point_transactions",
  {
    id: serial("id").primaryKey(),
    customerId: uuid("customer_id").notNull(),
    orderId: uuid("order_id").unique().notNull(),
    points: integer("points").notNull(),
    pointsUsed: integer("points_used").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    removedAt: timestamp("removed_at"),
  },
  (table) => [
    index("customer_idx").on(table.customerId).where(isNotNull(table.removedAt)),
    index("order_idx").on(table.orderId).where(isNotNull(table.removedAt)),
    index("created_at_idx").on(table.createdAt).where(isNotNull(table.removedAt)),
    check("points_gte_0", gte(table.points, sql.raw("0"))),
    check(
      "points_used_gte_0_lte_points",
      and(gte(table.pointsUsed, sql.raw("0")), lte(table.pointsUsed, table.points))!,
    ),
  ],
);

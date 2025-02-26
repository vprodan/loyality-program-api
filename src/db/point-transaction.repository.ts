import { db } from "@db/index.js";
import { pointTransaction } from "@db/schema.js";
import { and, asc, eq, gt, isNull, or, sql, sum } from "drizzle-orm";
import { NodePgDatabase } from "drizzle-orm/node-postgres";

const POINTS_ALIVE_INTERVAL = "6 months" as const;

class PointTransactionRepository<T extends Record<string, unknown>> {
  private readonly table = pointTransaction;

  constructor(private readonly db: NodePgDatabase<T>) {}

  async create(customerId: string, orderId: string, earned: number) {
    return this.db.insert(this.table).values({
      customerId,
      orderId,
      earned,
      available: earned,
    });
  }

  async findByCustomerId(customerId: string) {
    return this.db
      .select()
      .from(this.table)
      .where(
        and(
          this.notRemovedOrPositiveBalance(),
          this.createdWithinInterval(),
          this.isCustomer(customerId),
        ),
      )
      .orderBy(asc(this.table.createdAt))
      .execute();
  }

  async getAvailablePoints(customerId: string): Promise<number> {
    return this.db
      .select({
        availableSum: sum(this.table.available),
      })
      .from(this.table)
      .where(
        and(
          this.notRemovedOrPositiveBalance(),
          this.createdWithinInterval(),
          this.isCustomer(customerId),
        ),
      )
      .execute()
      .then((res) => +(res?.[0].availableSum ?? 0));
  }

  async updateManyAvailable(set: { id: number; available: number }[]): Promise<void> {
    return this.db.transaction(async (tx) => {
      const updating = [];

      for (const { id, available } of set) {
        updating.push(
          tx
            .update(this.table)
            .set({
              available,
              updatedAt: sql`NOW()`,
            })
            .where(eq(this.table.id, id))
            .execute(),
        );
      }

      await Promise.all(updating);
    });
  }

  async removeByOrderId(orderId: string) {
    return this.db
      .update(this.table)
      .set({
        removedAt: sql`NOW()`,
        updatedAt: sql`NOW()`,
      })
      .where(this.isOrder(orderId))
      .execute();
  }

  async removeByCustomerId(customerId: string) {
    return this.db
      .update(this.table)
      .set({
        removedAt: sql`NOW()`,
        updatedAt: sql`NOW()`,
      })
      .where(this.isCustomer(customerId))
      .execute();
  }

  private notRemovedOrPositiveBalance() {
    return or(isNull(this.table.removedAt), gt(this.table.available, sql`0`));
  }

  private createdWithinInterval(interval = POINTS_ALIVE_INTERVAL) {
    return gt(this.table.createdAt, sql`NOW() - INTERVAL '${sql.raw(interval)}'`);
  }

  private isCustomer(customerId: string) {
    return eq(this.table.customerId, customerId);
  }

  private isOrder(orderId: string) {
    return eq(this.table.orderId, orderId);
  }
}

export default new PointTransactionRepository(db);

import { and, eq, sql, isNull, gt } from "drizzle-orm";

import { NotEnoughPointsError } from "../api/errors/not-enough-points.error.js";
import { db } from "../db/index.js";
import { pointTransactions } from "../db/schema.js";

const POINTS_ALIVE_INTERVAL = "6 months";

const getCustomerPointsCondition = (customerId: string) =>
  and(
    isNull(pointTransactions.removedAt),
    eq(pointTransactions.customerId, customerId),
    gt(pointTransactions.createdAt, sql`NOW() - INTERVAL '${sql.raw(POINTS_ALIVE_INTERVAL)}'`),
  );

export class LoyalityPointsService {
  async consumePoints(customerId: string, points: number): Promise<number> {
    points = Math.max(0, points);

    const totalActivePoints = await this.getPoints(customerId);

    if (totalActivePoints < points) {
      throw new NotEnoughPointsError(totalActivePoints);
    }

    const query = db
      .select({
        id: pointTransactions.id,
        points: sql<number>`(${pointTransactions.points} - ${pointTransactions.pointsUsed}) AS points`,
      })
      .from(pointTransactions)
      .where(getCustomerPointsCondition(customerId))
      .orderBy(pointTransactions.createdAt);

    let totalPointsUsed = 0;
    await db.transaction(async (tx) => {
      await tx.execute(sql`DECLARE cursor CURSOR FOR ${query} FOR UPDATE;`);

      while (totalPointsUsed < points) {
        const result = await tx
          .execute(sql`FETCH 1 FROM cursor;`)
          .then((res) => res.rows as Awaited<typeof query>);
        if (result.length === 0) {
          break;
        }

        const item = result[0];
        const pointsUsed = Math.min(points - totalPointsUsed, item.points);
        const removedAt = item.points === pointsUsed ? sql`NOW()` : null;
        totalPointsUsed += pointsUsed;

        await tx
          .update(pointTransactions)
          .set({
            pointsUsed: sql`${pointTransactions.pointsUsed} + ${pointsUsed}`,
            removedAt,
          })
          .where(eq(pointTransactions.id, item.id));
      }
    });

    return totalActivePoints - points;
  }

  async getPoints(customerId: string): Promise<number> {
    const result = await db
      .select({
        totalActivePoints: sql<number>`SUM(${pointTransactions.points} - ${pointTransactions.pointsUsed})`,
      })
      .from(pointTransactions)
      .where(getCustomerPointsCondition(customerId));

    return result?.[0].totalActivePoints ?? 0;
  }

  calculatePoints(totalAmount: number) {
    return Math.floor(totalAmount / 50);
  }

  /**
   * Soft removing points by order id
   */
  async removePointsByOrderId(orderId: string) {
    await db
      .update(pointTransactions)
      .set({ removedAt: sql`NOW()` })
      .where(eq(pointTransactions.orderId, orderId));
  }

  /**
   * Soft removing points by customer id
   */
  async removePointsByCustomerId(customerId: string) {
    await db
      .update(pointTransactions)
      .set({ removedAt: sql`NOW()` })
      .where(eq(pointTransactions.customerId, customerId));
  }

  /**
   * Adds points to the customer by order id
   */
  async addPoints(customerId: string, orderId: string, points: number) {
    await db.insert(pointTransactions).values({
      customerId,
      orderId,
      points,
    });
  }
}

export default new LoyalityPointsService();

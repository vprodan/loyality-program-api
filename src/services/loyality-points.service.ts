import { NotEnoughPointsError } from "@api/errors/not-enough-points.error.js";
import pointTransactionRepository from "@db/point-transaction.repository.js";

export class LoyalityPointsService {
  async getAvailable(customerId: string): Promise<number> {
    return pointTransactionRepository.getAvailablePoints(customerId);
  }

  async consume(customerId: string, count: number): Promise<number> {
    count = Math.max(0, count); // prevent negative values

    const availablePoints = await this.getAvailable(customerId);
    if (availablePoints < count) {
      throw new NotEnoughPointsError(availablePoints);
    }

    const transactions = await pointTransactionRepository.findByCustomerId(customerId);

    let needToConsume = count;
    const updateSet: { id: number; available: number }[] = [];
    for (const tr of transactions) {
      if (needToConsume === 0) {
        break;
      }

      const pointsToUse = Math.min(tr.available, needToConsume);
      needToConsume -= pointsToUse;

      const available = tr.available - pointsToUse;

      updateSet.push({ id: tr.id, available });
    }

    if (updateSet.length > 0) {
      await pointTransactionRepository.updateManyAvailable(updateSet);
    }

    return availablePoints - count;
  }

  async orderPlaced(customerId: string, orderId: string, orderAmount: number): Promise<void> {
    const earned = this.getPointsByOrderAmount(orderAmount);
    await pointTransactionRepository.create(customerId, orderId, earned);
  }

  async orderCancelled(orderId: string): Promise<void> {
    await pointTransactionRepository.removeByOrderId(orderId);
  }

  async customerRemoved(customerId: string): Promise<void> {
    await pointTransactionRepository.removeByCustomerId(customerId);
  }

  private getPointsByOrderAmount(totalAmount: number) {
    return Math.floor(totalAmount / 50);
  }
}

export default new LoyalityPointsService();

import { describe, it, expect, vi, beforeEach } from "vitest";
import { LoyalityPointsService } from "../../../src/services/loyality-points.service.js";
import pointTransactionRepository from "../../../src/db/point-transaction.repository.js";
import { NotEnoughPointsError } from "../../../src/api/errors/not-enough-points.error.js";

// Mock the repository
vi.mock("../../../src/db/point-transaction.repository.js", () => ({
  default: {
    getAvailablePoints: vi.fn(),
    findByCustomerId: vi.fn(),
    updateManyAvailable: vi.fn(),
    create: vi.fn(),
    removeByOrderId: vi.fn(),
    removeByCustomerId: vi.fn(),
  },
}));

describe("LoyalityPointsService", () => {
  let service: LoyalityPointsService;
  const customerId = "customer-123";
  const orderId = "order-456";

  beforeEach(() => {
    vi.resetAllMocks();
    service = new LoyalityPointsService();
  });

  describe("getAvailable", () => {
    it("should return available points from repository", async () => {
      vi.mocked(pointTransactionRepository.getAvailablePoints).mockResolvedValue(100);

      const result = await service.getAvailable(customerId);

      expect(result).toBe(100);
      expect(pointTransactionRepository.getAvailablePoints).toHaveBeenCalledWith(customerId);
    });
  });

  describe("consume", () => {
    it("should throw NotEnoughPointsError when points are insufficient", async () => {
      vi.mocked(pointTransactionRepository.getAvailablePoints).mockResolvedValue(50);

      await expect(service.consume(customerId, 100)).rejects.toThrow(NotEnoughPointsError);
      expect(pointTransactionRepository.getAvailablePoints).toHaveBeenCalledWith(customerId);
      expect(pointTransactionRepository.findByCustomerId).not.toHaveBeenCalled();
    });

    it("should prevent negative values and use 0 instead", async () => {
      vi.mocked(pointTransactionRepository.getAvailablePoints).mockResolvedValue(100);
      vi.mocked(pointTransactionRepository.findByCustomerId).mockResolvedValue([]);

      await service.consume(customerId, -10);

      expect(pointTransactionRepository.updateManyAvailable).not.toHaveBeenCalled();
    });

    it("should consume points from transactions", async () => {
      vi.mocked(pointTransactionRepository.getAvailablePoints).mockResolvedValue(100);
      vi.mocked(pointTransactionRepository.findByCustomerId).mockResolvedValue([
        { id: 1, available: 30 },
        { id: 2, available: 40 },
        { id: 3, available: 30 },
      ]);
      vi.mocked(pointTransactionRepository.updateManyAvailable).mockResolvedValue();

      const result = await service.consume(customerId, 60);

      expect(result).toBe(40);
      expect(pointTransactionRepository.updateManyAvailable).toHaveBeenCalledWith([
        { id: 1, available: 0 },
        { id: 2, available: 10 },
      ]);
    });

    it("should not update if nothing to consume", async () => {
      vi.mocked(pointTransactionRepository.getAvailablePoints).mockResolvedValue(100);
      vi.mocked(pointTransactionRepository.findByCustomerId).mockResolvedValue([]);

      const result = await service.consume(customerId, 0);

      expect(result).toBe(100);
      expect(pointTransactionRepository.updateManyAvailable).not.toHaveBeenCalled();
    });
  });

  describe("orderPlaced", () => {
    it("should create a transaction with correct points", async () => {
      vi.mocked(pointTransactionRepository.create).mockResolvedValue(undefined as any);

      // Order of 150 should give 3 points (150/50 = 3)
      await service.orderPlaced(customerId, orderId, 150);

      expect(pointTransactionRepository.create).toHaveBeenCalledWith(customerId, orderId, 3);
    });

    it("should floor points when order amount is not divisible by 50", async () => {
      vi.mocked(pointTransactionRepository.create).mockResolvedValue(undefined as any);

      // Order of 175 should give 3 points (175/50 = 3.5, floored to 3)
      await service.orderPlaced(customerId, orderId, 175);

      expect(pointTransactionRepository.create).toHaveBeenCalledWith(customerId, orderId, 3);
    });
  });

  describe("orderCancelled", () => {
    it("should remove transactions by order id", async () => {
      vi.mocked(pointTransactionRepository.removeByOrderId).mockResolvedValue(undefined as any);

      await service.orderCancelled(orderId);

      expect(pointTransactionRepository.removeByOrderId).toHaveBeenCalledWith(orderId);
    });
  });

  describe("customerRemoved", () => {
    it("should remove all customer transactions", async () => {
      vi.mocked(pointTransactionRepository.removeByCustomerId).mockResolvedValue(undefined as any);

      await service.customerRemoved(customerId);

      expect(pointTransactionRepository.removeByCustomerId).toHaveBeenCalledWith(customerId);
    });
  });
});

import { pointTransaction } from "../../../src/db/schema.js";
import { expect, vi, beforeEach, describe, it } from "vitest";

import { db } from "../../../src/db/index.js";
import pointTransactionRepository from "../../../src/db/point-transaction.repository.js";

// Mock the db and schema
vi.mock("../../../src/db/index.js", () => ({
  db: {
    insert: vi.fn(),
    select: vi.fn(),
    update: vi.fn(),
    transaction: vi.fn(),
  },
}));

vi.mock("../../../src/db/schema.js", () => ({
  pointTransaction: {
    id: "id",
    customerId: "customerId",
    orderId: "orderId",
    earned: "earned",
    available: "available",
    createdAt: "createdAt",
    updatedAt: "updatedAt",
    removedAt: "removedAt",
  },
}));

// Need to import these after mocking

describe("PointTransactionRepository", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  describe("create", () => {
    it("should insert a new transaction with correct values", async () => {
      const mockInsert = {
        values: vi.fn().mockReturnThis(),
      };
      vi.mocked(db).insert.mockReturnValue(mockInsert as any);

      const customerId = "123-456";
      const orderId = "order-123";
      const earned = 100;

      await pointTransactionRepository.create(customerId, orderId, earned);

      expect(db.insert).toHaveBeenCalledWith(pointTransaction);
      expect(mockInsert.values).toHaveBeenCalledWith({
        customerId,
        orderId,
        earned,
        available: earned,
      });
    });
  });

  describe("findByCustomerId", () => {
    it("should select transactions with proper filters", async () => {
      const mockExecute = vi.fn().mockResolvedValue([{ id: 1, available: 50 }]);
      const mockOrderBy = { orderBy: vi.fn().mockReturnValue({ execute: mockExecute }) };
      const mockWhere = { where: vi.fn().mockReturnValue(mockOrderBy) };
      const mockFrom = { from: vi.fn().mockReturnValue(mockWhere) };

      vi.mocked(db).select.mockReturnValue(mockFrom as any);

      const customerId = "123-456";
      const result = await pointTransactionRepository.findByCustomerId(customerId);

      expect(db.select).toHaveBeenCalled();
      expect(mockFrom.from).toHaveBeenCalledWith(pointTransaction);
      expect(mockWhere.where).toHaveBeenCalled();
      expect(mockOrderBy.orderBy).toHaveBeenCalled();
      expect(mockExecute).toHaveBeenCalled();
      expect(result).toEqual([{ id: 1, available: 50 }]);
    });
  });

  describe("getAvailablePoints", () => {
    it("should return sum of available points", async () => {
      const mockExecute = vi.fn().mockResolvedValue([{ availableSum: 150 }]);
      const mockWhere = { where: vi.fn().mockReturnValue({ execute: mockExecute }) };
      const mockFrom = { from: vi.fn().mockReturnValue(mockWhere) };

      vi.mocked(db).select.mockReturnValue(mockFrom as any);

      const customerId = "123-456";
      const result = await pointTransactionRepository.getAvailablePoints(customerId);

      expect(db.select).toHaveBeenCalled();
      expect(mockFrom.from).toHaveBeenCalledWith(pointTransaction);
      expect(mockWhere.where).toHaveBeenCalled();
      expect(mockExecute).toHaveBeenCalled();
      expect(result).toBe(150);
    });
  });
});

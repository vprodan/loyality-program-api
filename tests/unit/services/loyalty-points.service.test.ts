import { drizzle } from "drizzle-orm/node-postgres";
import { describe, it, vi, expect, beforeEach } from "vitest";

import { db } from "../../../src/db/index.js";
import loyalityPointsService from "../../../src/services/loyality-points.service.js";

vi.mock("../../src/db/index.js", () => ({
  db: drizzle.mock(),
}));

describe("LoyalityPointsService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("consumePoints", () => {
    it("should successfully consume points", async () => {
      const customerId = "customer123";
      const pointsToConsume = 30;

      vi.spyOn(loyalityPointsService, "getPoints").mockResolvedValueOnce(50);

      const result = await loyalityPointsService.consumePoints(customerId, pointsToConsume);

      expect(loyalityPointsService.getPoints).toHaveBeenCalledWith(customerId);
      expect(result).toBe(20);
      expect(db.transaction).toHaveBeenCalled();
    });

    // it("should throw NotEnoughPointsError when insufficient points", async () => {
    //   const customerId = "customer123";
    //   const pointsToConsume = 100;

    //   vi.mocked(db.select().from().where).mockImplementationOnce(() => ({
    //     orderBy: vi.fn().mockResolvedValueOnce([{ totalActivePoints: 50 }]),
    //   }));

    //   await expect(
    //     loyalityPointsService.consumePoints(customerId, pointsToConsume),
    //   ).rejects.toThrow(NotEnoughPointsError);
    // });
  });

  //   describe("getPoints", () => {
  //     it("should return total active points for customer", async () => {
  //       const customerId = "customer123";
  //       const expectedPoints = 150;

  //       vi.mocked(db.select().from().where).mockImplementationOnce(() => ({
  //         orderBy: vi.fn().mockResolvedValueOnce([{ totalActivePoints: expectedPoints }]),
  //       }));

  //       const result = await loyalityPointsService.getPoints(customerId);

  //       expect(result).toBe(expectedPoints);
  //     });

  //     it("should return 0 when no points found", async () => {
  //       const customerId = "customer123";

  //       vi.mocked(db.select().from().where).mockImplementationOnce(() => ({
  //         orderBy: vi.fn().mockResolvedValueOnce([{ totalActivePoints: null }]),
  //       }));

  //       const result = await loyalityPointsService.getPoints(customerId);

  //       expect(result).toBe(0);
  //     });
  //   });

  describe("calculatePoints", () => {
    it("should calculate points correctly", () => {
      expect(loyalityPointsService.calculatePoints(100)).toBe(2);
      expect(loyalityPointsService.calculatePoints(49)).toBe(0);
      expect(loyalityPointsService.calculatePoints(250)).toBe(5);
    });
  });

  //   describe("removePoints", () => {
  //     it("should remove points by order id", async () => {
  //       const orderId = "order123";
  //       await loyalityPointsService.removePointsByOrderId(orderId);

  //       expect(db.update).toHaveBeenCalled();
  //     });

  //     it("should remove points by customer id", async () => {
  //       const customerId = "customer123";
  //       await loyalityPointsService.removePointsByCustomerId(customerId);

  //       expect(db.update).toHaveBeenCalled();
  //     });
  //   });

  //   describe("addPoints", () => {
  //     it("should add points successfully", async () => {
  //       const customerId = "customer123";
  //       const orderId = "order123";
  //       const points = 50;

  //       await loyalityPointsService.addPoints(customerId, orderId, points);

  //       expect(db.insert).toHaveBeenCalled();
  //     });
  //   });
});

import { createError } from "@fastify/error";

export const NotEnoughPointsError = createError<[number]>(
  "NOT_ENOUGH_PTS",
  "Not enough points, available: %s",
  422,
);

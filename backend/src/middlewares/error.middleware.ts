import { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/index";

const send = (
  res: Response,
  statusCode: number,
  message: string,
  errors: unknown[] = [],
) =>
  res
    .status(statusCode)
    .json({ statusCode, data: null, message, success: false, errors });

export const notFoundHandler = (
  _req: Request,
  _res: Response,
  next: NextFunction,
) => {
  next(new ApiError(404, "Route not found"));
};

export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  if (err instanceof ApiError) {
    return send(res, err.statusCode, err.message, err.errors);
  }

  const type = (err as { type?: string } | null)?.type;
  if (type === "entity.parse.failed")
    return send(res, 400, "Invalid JSON body");
  if (type === "entity.too.large")
    return send(res, 413, "Request body too large");

  console.error(err);
  return send(res, 500, "Internal server error");
};

import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { prisma } from "../config/prisma";
import { ApiError } from "../utils/index";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
    email: string;
  };
}

export const verifyJWT = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.headers["authorization"]?.replace("Bearer ", "");

    if (typeof token !== "string" || token.trim() === "") {
      throw new ApiError(401, "Unauthorized request");
    }

    const decodedToken = jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET as string,
    ) as JwtPayload;

    if (typeof decodedToken.id !== "string") {
      throw new ApiError(401, "Invalid access token");
    }

    const user = await prisma.user.findUnique({
      where: { id: decodedToken.id },
      select: { id: true, username: true, email: true },
    });

    if (!user) {
      throw new ApiError(401, "Invalid access token");
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof ApiError) {
      return next(error);
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return next(new ApiError(401, error.message));
    }
    return next(error);
  }
};

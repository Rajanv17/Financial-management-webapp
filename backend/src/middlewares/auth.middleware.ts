import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/index";
import jwt, { JwtPayload } from "jsonwebtoken";
import { UserModel } from "../models/index";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
    email: string;
  };
}

export const verifyJWT = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.headers["authorization"]?.replace("Bearer ", "");

    if (!token) {
      throw new ApiError(401, "Unauthorized request");
    }
    if (typeof token !== "string" || token.trim() === "") {
      return res.status(401).json(new ApiError(401, "Unauthorized request"));
    }

    const decodedToken = jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET as string,
    ) as JwtPayload;

    const user = await UserModel.findById(decodedToken?._id).select(
      "-password -refreshToken",
    );

    if (!user) {
      throw new ApiError(401, "Invalid access token");
    }

    req.user = {
      id: user._id.toString(),
      username: user.username,
      email: user.email,
    };
    next();
  } catch (error: any) {
    next(new ApiError(401, error?.message || "Invalid access token"));
  }
};

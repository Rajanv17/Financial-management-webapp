import { Request, Response } from "express";
import crypto from "crypto";
import jwt, { JwtPayload } from "jsonwebtoken";
import { prisma } from "../config/prisma";
import { accessCookieOptions, refreshCookieOptions } from "../config/cookies";
import {
  ApiError,
  ApiResponse,
  hashPassword,
  normalizeIdentifier,
  generateAccessToken,
  generateRefreshToken,
  comparePassword,
} from "../utils/index";
import { AuthenticatedRequest } from "../middlewares/index";

const publicUserSelect = {
  id: true,
  username: true,
  email: true,
  createdAt: true,
} as const;

const hashToken = (token: string) =>
  crypto.createHash("sha256").update(token).digest("hex");

const issueTokens = async (user: {
  id: string;
  username: string;
  email: string;
}) => {
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user.id);

  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken: hashToken(refreshToken) },
  });

  return { accessToken, refreshToken };
};

const registerUser = async (req: Request, res: Response) => {
  const { username, email, password } = req.body;

  if (
    ![username, email, password].every(
      (f) => typeof f === "string" && f.trim() !== "",
    )
  ) {
    throw new ApiError(400, "All fields are required");
  }

  if (password.length < 8) {
    throw new ApiError(400, "Password must be at least 8 characters");
  }

  const passwordHash = await hashPassword(password);

  try {
    const user = await prisma.user.create({
      data: {
        username: normalizeIdentifier(username),
        email: normalizeIdentifier(email),
        passwordHash,
      },
      select: publicUserSelect,
    });

    return res
      .status(201)
      .json(new ApiResponse(201, user, "User registered successfully"));
  } catch (error: any) {
    if (error?.code === "P2002") {
      throw new ApiError(
        400,
        "User already exists with given username or email",
      );
    }
    throw error;
  }
};

const loginUser = async (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (
    typeof username !== "string" ||
    typeof password !== "string" ||
    !username.trim() ||
    !password
  ) {
    throw new ApiError(400, "Username and password are required");
  }

  const user = await prisma.user.findUnique({
    where: { username: normalizeIdentifier(username) },
  });

  const isPasswordValid =
    user && (await comparePassword(password, user.passwordHash));

  if (!user || !isPasswordValid) {
    throw new ApiError(401, "Invalid username or password");
  }

  const { accessToken, refreshToken } = await issueTokens(user);
  const { passwordHash, refreshToken: _rt, ...safeUser } = user;

  return res
    .status(200)
    .cookie("accessToken", accessToken, accessCookieOptions())
    .cookie("refreshToken", refreshToken, refreshCookieOptions())
    .json(
      new ApiResponse(
        200,
        { user: safeUser, accessToken, refreshToken },
        "User logged in successfully",
      ),
    );
};

const logoutUser = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) throw new ApiError(401, "Unauthorized request");

  await prisma.user.update({
    where: { id: userId },
    data: { refreshToken: null },
  });

  return res
    .status(200)
    .clearCookie("accessToken", accessCookieOptions())
    .clearCookie("refreshToken", refreshCookieOptions())
    .json(new ApiResponse(200, null, "User logged out successfully"));
};

const fetchUser = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) throw new ApiError(401, "Unauthorized request");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: publicUserSelect,
  });
  if (!user) throw new ApiError(404, "User not found");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "User details fetched successfully"));
};

const refreshAccessToken = async (req: Request, res: Response) => {
  const incoming = req.cookies.refreshToken || req.body.refreshToken;
  if (!incoming) throw new ApiError(401, "Unauthorized request");

  let decoded: JwtPayload;
  try {
    decoded = jwt.verify(
      incoming,
      process.env.REFRESH_TOKEN_SECRET as string,
    ) as JwtPayload;
  } catch {
    throw new ApiError(401, "Invalid or expired refresh token");
  }

  if (typeof decoded.id !== "string") {
    throw new ApiError(401, "Invalid or expired refresh token");
  }

  const user = await prisma.user.findUnique({ where: { id: decoded.id } });

  if (!user || user.refreshToken !== hashToken(incoming)) {
    throw new ApiError(401, "Refresh token is expired or used");
  }

  const { accessToken, refreshToken } = await issueTokens(user);

  return res
    .status(200)
    .cookie("accessToken", accessToken, accessCookieOptions())
    .cookie("refreshToken", refreshToken, refreshCookieOptions())
    .json(
      new ApiResponse(
        200,
        { accessToken, refreshToken },
        "Access token refreshed successfully",
      ),
    );
};

const updateUser = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) throw new ApiError(401, "Unauthorized request");
  const { username, email } = req.body;

  const data = {
    ...(typeof username === "string" &&
      username.trim() !== "" && { username: normalizeIdentifier(username) }),
    ...(typeof email === "string" &&
      email.trim() !== "" && { email: normalizeIdentifier(email) }),
  };

  if (Object.keys(data).length === 0) {
    throw new ApiError(400, "Provide a username or email to update");
  }

  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data,
      select: publicUserSelect,
    });
    return res
      .status(200)
      .json(new ApiResponse(200, user, "User updated successfully"));
  } catch (error: any) {
    if (error?.code === "P2002")
      throw new ApiError(400, "Username or email already taken");
    if (error?.code === "P2025") throw new ApiError(404, "User not found");
    throw error;
  }
};

const deleteUser = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) throw new ApiError(401, "Unauthorized request");

  try {
    await prisma.user.delete({ where: { id: userId } });
  } catch (error: any) {
    if (error?.code === "P2025") throw new ApiError(404, "User not found");
    throw error;
  }

  return res
    .status(200)
    .clearCookie("accessToken", accessCookieOptions())
    .clearCookie("refreshToken", refreshCookieOptions())
    .json(new ApiResponse(200, null, "User deleted successfully"));
};

export {
  registerUser,
  loginUser,
  logoutUser,
  fetchUser,
  refreshAccessToken,
  updateUser,
  deleteUser,
};

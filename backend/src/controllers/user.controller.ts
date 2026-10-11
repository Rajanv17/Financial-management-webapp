import { UserModel } from "../models/index";
import { Request, Response } from "express";
import { ApiError, ApiResponse } from "../utils/index";
import jwt, { JwtPayload } from "jsonwebtoken";
import { AuthenticatedRequest } from "../middlewares/index";

const generateAccessAndRefreshTokens = async (userId: string) => {
  try {
    const user = await UserModel.findById(userId);

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save();

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating refresh or access tokens",
    );
  }
};

// Register a new user
const registerUser = async (req: Request, res: Response) => {
  const { username, email, password } = req.body;
  if ([username, email, password].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "All fields are required");
  }

  const existingUser = await UserModel.findOne({
    $or: [{ username }, { email }],
  });

  if (existingUser) {
    throw new ApiError(400, "User already exists with given username or email");
  }

  const user = await UserModel.create({
    username,
    email,
    password,
  });

  const createdUser = await UserModel.findById(user._id).select(
    "-password -refreshToken",
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while creating user");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, createdUser, "User registered successfully"));
};

// Login user
const loginUser = async (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    throw new ApiError(400, "Username and password are required");
  }

  const user = await UserModel.findOne({
    $or: [{ username }],
  });

  if (!user) {
    throw new ApiError(400, "User not found");
  }

  const isPasswordValid = await user.comparePassword(password);

  if (!isPasswordValid) {
    throw new ApiError(400, "Invalid password");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id as string,
  );

  const loggedInUser = await UserModel.findById(user._id).select(
    "-password -refreshToken",
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken: accessToken,
          refreshToken: refreshToken,
        },
        "User logged in successfully",
      ),
    );
};

const logoutUser = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;

  const user = await UserModel.findById(
    userId,
    {
      unset: {
        refreshToken: "",
      },
    },
    { new: true },
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, null, "User logged out successfully"));
};

// Get current user
const fetchUser = async (req: AuthenticatedRequest, res: Response) => {
  const user = await UserModel.findById(req.user?.id).select(
    "-password -refreshToken",
  );

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, user, "User details fetched successfully"));
};

// Refresh access token
const refreshAccessToken = async (req: Request, res: Response) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized request");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET as string,
    ) as JwtPayload;

    const user = await UserModel.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }

    if (user?.refreshToken !== incomingRefreshToken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
      user._id,
    );

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          200,
          {
            accessToken,
            refreshToken,
          },
          "Access token refreshed successfully",
        ),
      );
  } catch (error: any) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
};

// Update user details
const updateUser = async (req: AuthenticatedRequest, res: Response) => {
  const { username, email } = req.body;

  const user = await UserModel.findByIdAndUpdate(
    req.user?.id,
    {
      $set: { username, email },
    },
    { new: true },
  ).select("-password -refreshToken");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, user, "User updated successfully"));
};

// Delete user
const deleteUser = async (req: AuthenticatedRequest, res: Response) => {
  const user = await UserModel.findByIdAndDelete(req.user?.id).select(
    "-password -refreshToken",
  );

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, user, "User deleted successfully"));
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

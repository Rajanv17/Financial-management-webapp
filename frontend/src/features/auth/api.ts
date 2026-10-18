import { api } from "@/lib/api";
import type { LoginInput, RegisterInput, User } from "./types";

type LoginResponse = {
  user: User & { updatedAt?: string };
  accessToken: string;
  refreshToken: string;
};

const toUser = (user: User & { updatedAt?: string }): User => ({
  id: user.id,
  username: user.username,
  email: user.email,
  createdAt: user.createdAt,
});

export const registerUser = (input: RegisterInput) =>
  api<User>("/user/register", {
    method: "POST",
    body: JSON.stringify(input),
  });

export const loginUser = async (input: LoginInput) => {
  const data = await api<LoginResponse>("/user/login", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return toUser(data.user);
};

export const logoutUser = () =>
  api<null>("/user/logout", {
    method: "POST",
  });

export const fetchProfile = () => api<User>("/user/profile");

export const updateProfile = (id: string, input: { username?: string; email?: string }) =>
  api<User>(`/user/update/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });

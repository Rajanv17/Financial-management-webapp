import request from "supertest";
import { expect } from "vitest";
import { app } from "../app";

export const api = () => request(app);

export type Category = {
  id: string;
  name: string;
  type: "income" | "expense";
  isDefault: boolean;
  isArchived: boolean;
  color: string | null;
};

const setCookieHeaders = (res: request.Response): string[] => {
  const header = res.headers["set-cookie"];
  if (!header) return [];
  return Array.isArray(header) ? header : [header];
};

export const cookieNames = (res: request.Response): string[] =>
  setCookieHeaders(res).map((value) => value.split("=")[0]);

export const getCookie = (res: request.Response, name: string) => {
  const prefix = `${name}=`;
  const header = setCookieHeaders(res).find((value) => value.startsWith(prefix));
  if (!header) return undefined;
  return header.slice(prefix.length).split(";")[0];
};

const cookieHeaderFrom = (res: request.Response): string =>
  setCookieHeaders(res)
    .map((value) => value.split(";")[0])
    .join("; ");

export const authedClient = (loginRes: request.Response) => {
  const cookie = cookieHeaderFrom(loginRes);
  const withCookie = (req: request.Test) => req.set("Cookie", cookie);
  return {
    get: (url: string) => withCookie(api().get(url)),
    post: (url: string) => withCookie(api().post(url)),
    patch: (url: string) => withCookie(api().patch(url)),
    delete: (url: string) => withCookie(api().delete(url)),
  };
};

export type AuthedClient = ReturnType<typeof authedClient>;

export const registerUser = async (overrides?: {
  username?: string;
  email?: string;
  password?: string;
}) => {
  const suffix = crypto.randomUUID().replace(/-/g, "").slice(0, 12);
  const username = overrides?.username ?? `user_${suffix}`;
  const email = overrides?.email ?? `${username}@example.com`;
  const password = overrides?.password ?? "password12";

  const res = await api().post("/api/v1/user/register").send({
    username,
    email,
    password,
  });
  expect(res.status).toBe(201);
  return { username, email, password, user: res.body.data };
};

export const login = async (username: string, password: string) => {
  const res = await api().post("/api/v1/user/login").send({ username, password });
  expect(res.status).toBe(200);
  return { client: authedClient(res), res };
};

export const registerAndLogin = async (overrides?: {
  username?: string;
  email?: string;
  password?: string;
}) => {
  const account = await registerUser(overrides);
  const { client, res } = await login(account.username, account.password);
  return { ...account, client, loginRes: res };
};

export const defaultCategories = async (client: AuthedClient) => {
  const res = await client.get("/api/v1/categories");
  expect(res.status).toBe(200);
  const categories = res.body.data as Category[];
  const expense = categories.find((c) => c.type === "expense" && c.isDefault);
  const income = categories.find((c) => c.type === "income" && c.isDefault);
  if (!expense || !income) {
    throw new Error("Default expense and income categories are required");
  }
  return { categories, expense, income };
};

export class ApiClientError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.name = "ApiClientError";
    this.statusCode = statusCode;
  }
}

type Envelope<T> = {
  statusCode: number;
  data: T;
  message: string;
  success: boolean;
  errors?: unknown[];
};

type UnauthorizedHandler = () => void;

let unauthorizedHandler: UnauthorizedHandler | null = null;
let refreshInFlight: Promise<boolean> | null = null;

export const setUnauthorizedHandler = (handler: UnauthorizedHandler | null) => {
  unauthorizedHandler = handler;
};

const apiBaseUrl = () => {
  const url = import.meta.env.VITE_API_URL;
  if (!url) {
    throw new ApiClientError(500, "VITE_API_URL is not set");
  }
  return url.replace(/\/$/, "");
};

const skipRefresh = (path: string) =>
  path.startsWith("/user/login") ||
  path.startsWith("/user/register") ||
  path.startsWith("/user/refresh-token");

const parseEnvelope = async <T>(res: Response): Promise<Envelope<T>> => {
  let json: Envelope<T> | null = null;
  try {
    json = (await res.json()) as Envelope<T>;
  } catch {
    throw new ApiClientError(res.status, "Unexpected response from server");
  }

  if (typeof json?.message !== "string") {
    throw new ApiClientError(res.status, "Unexpected response from server");
  }

  return json;
};

const refreshSession = async (): Promise<boolean> => {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    const res = await fetch(`${apiBaseUrl()}/user/refresh-token`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    return res.ok;
  })().finally(() => {
    refreshInFlight = null;
  });

  return refreshInFlight;
};

export const api = async <T>(path: string, init: RequestInit = {}): Promise<T> => {
  const headers = new Headers(init.headers);
  if (init.body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const request = () =>
    fetch(`${apiBaseUrl()}${path}`, {
      ...init,
      credentials: "include",
      headers,
    });

  let res = await request();

  if (res.status === 401 && !skipRefresh(path)) {
    const refreshed = await refreshSession();
    if (refreshed) {
      res = await request();
    }
  }

  const envelope = await parseEnvelope<T>(res);

  if (!res.ok || envelope.success === false) {
    if (res.status === 401 && !skipRefresh(path)) {
      unauthorizedHandler?.();
    }
    throw new ApiClientError(
      envelope.statusCode || res.status,
      envelope.message,
    );
  }

  return envelope.data;
};

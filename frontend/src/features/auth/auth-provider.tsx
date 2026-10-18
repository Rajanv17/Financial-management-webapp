import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { ApiClientError, setUnauthorizedHandler } from "@/lib/api";
import {
  fetchProfile,
  loginUser,
  logoutUser,
  registerUser,
  updateProfile as updateProfileRequest,
} from "./api";
import type { LoginInput, ProfileInput, RegisterInput, User } from "./types";

type AuthContextValue = {
  user: User | null;
  isLoading: boolean;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (input: ProfileInput) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setUnauthorizedHandler(() => setUser(null));
    return () => setUnauthorizedHandler(null);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const profile = await fetchProfile();
        if (!cancelled) setUser(profile);
      } catch (error) {
        if (!cancelled) setUser(null);
        if (!(error instanceof ApiClientError && error.statusCode === 401)) {
          console.error(error);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (input: LoginInput) => {
    const nextUser = await loginUser(input);
    setUser(nextUser);
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    await registerUser(input);
    const nextUser = await loginUser({
      username: input.username,
      password: input.password,
    });
    setUser(nextUser);
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutUser();
    } finally {
      setUser(null);
    }
  }, []);

  const updateProfile = useCallback(
    async (input: ProfileInput) => {
      if (!user) {
        throw new ApiClientError(401, "Unauthorized request");
      }
      const nextUser = await updateProfileRequest(user.id, input);
      setUser(nextUser);
    },
    [user],
  );

  const value = useMemo(
    () => ({ user, isLoading, login, register, logout, updateProfile }),
    [user, isLoading, login, register, logout, updateProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

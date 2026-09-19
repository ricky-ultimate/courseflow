"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import {
  AuthResponse,
  CurrentUser,
  LoginData,
  RegisterData,
  Role,
} from "@/types";
import { apiClient } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface AuthResult {
  success: boolean;
  error?: string;
}

interface AuthContextType {
  user: CurrentUser | null;
  loading: boolean;
  login: (data: LoginData) => Promise<AuthResult>;
  register: (data: RegisterData) => Promise<AuthResult>;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isCollegeAdmin: boolean;
  isLecturer: boolean;
  isHod: boolean;
  isStudent: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const PUBLIC_PATHS = ["/courses", "/schedules", "/departments", "/colleges"];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );
}

const AUTH_PATHS = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
];

function isAuthPath(pathname: string): boolean {
  return AUTH_PATHS.some((p) => pathname === p || pathname.startsWith(p));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  const persistUser = useCallback((next: CurrentUser) => {
    setUser(next);
    localStorage.setItem("user", JSON.stringify(next));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    apiClient.setToken(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("user");
    }
  }, []);

  useEffect(() => {
    const handle401 = () => {
      const currentPath = window.location.pathname;
      if (isPublicPath(currentPath) || isAuthPath(currentPath)) return;
      setUser(null);
      apiClient.setToken(null);
      localStorage.removeItem("user");
      toast({
        title: "Your session has expired. Please sign in again.",
        variant: "warning",
      });
      router.push("/login");
    };
    apiClient.setOn401(handle401);
    return () => apiClient.setOn401(null);
  }, [toast, router]);

  useEffect(() => {
    const validateToken = async () => {
      const token = apiClient.getToken();
      if (token) {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser) as CurrentUser;
            if (parsedUser && parsedUser.id) {
              setUser(parsedUser);
            }
          } catch {
            localStorage.removeItem("user");
          }
        }
        try {
          const response = await apiClient.getCurrentUserSilent();
          if (response.success && response.data) {
            persistUser(response.data);
          } else if (response.statusCode === 401 || !storedUser) {
            logout();
          }
        } catch {
          if (!storedUser) logout();
        }
      }
      setLoading(false);
    };

    validateToken();
  }, [logout, persistUser]);

  const completeAuthentication = async (auth: AuthResponse): Promise<void> => {
    apiClient.setToken(auth.access_token);
    const profile = await apiClient.getCurrentUserSilent();
    persistUser(
      profile.success && profile.data
        ? profile.data
        : (auth.user as CurrentUser),
    );
  };

  const login = async (data: LoginData): Promise<AuthResult> => {
    try {
      setLoading(true);
      const response = await apiClient.login(data.email, data.password);
      if (response.success && response.data) {
        await completeAuthentication(response.data);
        return { success: true };
      }
      return { success: false, error: response.error || "Invalid credentials" };
    } catch {
      return { success: false, error: "An unexpected error occurred" };
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: RegisterData): Promise<AuthResult> => {
    try {
      setLoading(true);
      const response = await apiClient.register(data);
      if (response.success && response.data) {
        await completeAuthentication(response.data);
        return { success: true };
      }
      return { success: false, error: response.error || "Registration failed" };
    } catch {
      return { success: false, error: "An unexpected error occurred" };
    } finally {
      setLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === Role.ADMIN,
    isCollegeAdmin: user?.role === Role.COLLEGE_ADMIN,
    isLecturer: user?.role === Role.LECTURER,
    isHod: user?.role === Role.HOD,
    isStudent: user?.role === Role.STUDENT,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

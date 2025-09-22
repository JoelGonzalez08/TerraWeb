import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { insertUserSchema, User as SelectUser } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

export type UserRole = "admin" | "technician" | "user";

// Role-based access control functions
export function hasRole(userRole: string, requiredRole: UserRole): boolean {
  const roleHierarchy = {
    admin: 3,
    technician: 2,
    user: 1,
  };
  return roleHierarchy[userRole as keyof typeof roleHierarchy] >= roleHierarchy[requiredRole];
}

export function canAccessAnalytics(userRole: string): boolean {
  return hasRole(userRole, "technician"); // technician and admin can access analytics
}

export function canManageSensors(userRole: string): boolean {
  return hasRole(userRole, "technician"); // technician and admin can manage sensors
}

export function canExportData(userRole: string): boolean {
  return hasRole(userRole, "technician"); // technician and admin can export data
}

export function canManageUsers(userRole: string): boolean {
  return hasRole(userRole, "admin"); // only admin can manage users
}

export function canAccessAdvancedSettings(userRole: string): boolean {
  return hasRole(userRole, "admin"); // only admin can access advanced settings
}

type AuthContextType = {
  user: SelectUser | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<SelectUser, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  hasRole: (requiredRole: UserRole) => boolean;
  canAccessAnalytics: () => boolean;
  canManageSensors: () => boolean;
  canExportData: () => boolean;
  canManageUsers: () => boolean;
  canAccessAdvancedSettings: () => boolean;
  canAccessAdminPanel: () => boolean;
};

type LoginData = {
  username: string;
  password: string;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<SelectUser | null>({
    queryKey: ["/api/user"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/user", {
          credentials: "include",
        });
        if (response.status === 401) {
          return null; // Not authenticated
        }
        if (!response.ok) {
          throw new Error("Failed to fetch user");
        }
        return await response.json();
      } catch (error) {
        return null; // Return null if there's an error (user not authenticated)
      }
    },
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(credentials),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error de inicio de sesión");
      }
      
      return await response.json();
    },
    onSuccess: (user: SelectUser) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "¡Bienvenido!",
        description: `Sesión iniciada correctamente como ${user.username}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error de inicio de sesión",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/logout", {
        method: "POST",
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Error al cerrar sesión");
      }
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión correctamente",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error al cerrar sesión",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Role-based access control methods
  const checkRole = (requiredRole: UserRole) => 
    user ? hasRole(user.role || "user", requiredRole) : false;

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        hasRole: checkRole,
        canAccessAnalytics: () => user ? canAccessAnalytics(user.role || "user") : false,
        canManageSensors: () => user ? canManageSensors(user.role || "user") : false,
        canExportData: () => user ? canExportData(user.role || "user") : false,
        canManageUsers: () => user ? canManageUsers(user.role || "user") : false,
        canAccessAdvancedSettings: () => user ? canAccessAdvancedSettings(user.role || "user") : false,
        canAccessAdminPanel: () => user ? canManageUsers(user.role || "user") : false,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
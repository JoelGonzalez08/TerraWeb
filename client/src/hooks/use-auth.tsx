import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

// Tipo de usuario para el frontend (sin password)
export type User = {
  id: string;
  username: string;
  role: string;
};

const FASTAPI_BASE_URL = 'http://localhost:8000';

// Helper para obtener headers de autorización
export function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('access_token');
  if (!token) return {};
  
  return {
    'Authorization': `Bearer ${token}`
  };
}

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
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<User, Error, LoginData>;
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
  } = useQuery<User | null>({
    queryKey: ["user"],
    queryFn: async () => {
      try {
        const storedUser = localStorage.getItem('user');
        const storedToken = localStorage.getItem('access_token');
        
        if (!storedUser || !storedToken) {
          return null;
        }
        
        return JSON.parse(storedUser);
      } catch (error) {
        localStorage.removeItem('user');
        localStorage.removeItem('access_token');
        return null;
      }
    },
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const formData = new URLSearchParams();
      formData.append('username', credentials.username);
      formData.append('password', credentials.password);
      
      const response = await fetch(`${FASTAPI_BASE_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Error de inicio de sesión");
      }
      
      const userData = await response.json();
      
      // Guardar en localStorage
      localStorage.setItem('user', JSON.stringify({
        id: userData.id,
        username: userData.username,
        role: userData.role
      }));
      localStorage.setItem('access_token', userData.access_token);
      
      return {
        id: userData.id,
        username: userData.username,
        role: userData.role
      };
    },
    onSuccess: (user: User) => {
      queryClient.setQueryData(["user"], user);
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
      // Simplemente limpiar localStorage - no necesitamos llamar a FastAPI
      localStorage.removeItem('user');
      localStorage.removeItem('access_token');
    },
    onSuccess: () => {
      queryClient.setQueryData(["user"], null);
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
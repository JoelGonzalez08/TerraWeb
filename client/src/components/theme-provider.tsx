import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";

type ThemeContextType = {
  theme: string;
  setTheme: (theme: string) => void;
};

export const ThemeContext = createContext<ThemeContextType | null>(null);

const roleThemes = {
  admin: "theme-admin",
  technician: "theme-technician", 
  user: "theme-user",
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [theme, setTheme] = useState<string>("theme-user");

  useEffect(() => {
    if (user?.role) {
      const newTheme = roleThemes[user.role as keyof typeof roleThemes] || "theme-user";
      setTheme(newTheme);
      
      // Apply theme to document
      document.documentElement.className = document.documentElement.className.replace(/theme-\w+/g, "");
      document.documentElement.classList.add(newTheme);
    } else {
      // Default theme for non-authenticated users
      document.documentElement.className = document.documentElement.className.replace(/theme-\w+/g, "");
      document.documentElement.classList.add("theme-user");
      setTheme("theme-user");
    }
  }, [user?.role]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
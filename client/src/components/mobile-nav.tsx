import { Link, useLocation } from "wouter";
import { Home, BarChart3, Settings, Upload, Cog, Activity, Shield } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function MobileNav() {
  const [location] = useLocation();
  const { user } = useAuth();

  const navItems = [
    { path: "/", label: "Inicio", icon: Home },
    { path: "/program", label: "Programa", icon: Cog },
    { path: "/upload", label: "Datos", icon: Upload },
    { path: "/analytics", label: "Análisis", icon: BarChart3 },
    { path: "/admin", label: "Admin", icon: Shield, adminOnly: true },
    { path: "/settings", label: "Config", icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50">
      <div className="px-4 py-2">
        <div className="flex justify-around">
          {navItems.map((item) => {
            // Hide admin only items if user is not admin
            if (item.adminOnly && (!user || user.role !== 'admin')) {
              return null;
            }
            
            const Icon = item.icon;
            const isActive = location === item.path;
            
            return (
              <Link key={item.path} href={item.path}>
                <button
                  data-testid={`mobile-nav-${item.label.toLowerCase()}`}
                  className={`flex flex-col items-center py-2 transition-colors ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  <Icon className="text-lg mb-1" size={20} />
                  <span className={`text-xs ${isActive ? "font-medium" : ""}`}>
                    {item.label}
                  </span>
                </button>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

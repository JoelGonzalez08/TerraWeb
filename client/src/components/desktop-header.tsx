import { Link, useLocation } from "wouter";
import { Leaf, LogOut, User, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

export default function DesktopHeader() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();

  const navItems = [
    { path: "/", label: "Panel" },
    { path: "/program", label: "Programa" },
    { path: "/upload", label: "Datos" },
    { path: "/analytics", label: "Análisis" },
    { path: "/admin", label: "Admin", adminOnly: true },
    { path: "/settings", label: "Configuración" },
  ];

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <header className="bg-background border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img src="/terra-logo.svg" alt="Terra Logo" className="w-12 h-12" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Terra</h1>
              <p className="text-sm text-muted-foreground">Recolección de Datos Ambientales</p>
            </div>
          </div>
          <div className="flex items-center space-x-6">
            <nav className="flex space-x-6">
              {navItems.map((item) => {
                // Hide admin only items if user is not admin
                if (item.adminOnly && (!user || user.role !== 'admin')) {
                  return null;
                }
                
                return (
                  <Link key={item.path} href={item.path}>
                    <button
                      data-testid={`nav-${item.label.toLowerCase()}`}
                      className={`px-4 py-2 font-medium transition-colors flex items-center gap-1 ${
                        location === item.path
                          ? "text-primary border-b-2 border-primary"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {item.label === "Admin" && <Shield className="h-4 w-4" />}
                      {item.label}
                    </button>
                  </Link>
                );
              })}
            </nav>
            
            {user && (
              <div className="flex items-center space-x-4 border-l border-border pl-6">
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  <div className="flex flex-col">
                    <span data-testid="user-display">{user.username}</span>
                    <span className="text-xs text-muted-foreground/70">
                      {user.role === 'admin' ? 'Administrador' : 
                       user.role === 'technician' ? 'Técnico' : 'Usuario'}
                    </span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  disabled={logoutMutation.isPending}
                  data-testid="button-logout"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  {logoutMutation.isPending ? "Cerrando sesión..." : "Cerrar sesión"}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

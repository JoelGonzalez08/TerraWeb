import { useState } from "react";
import { Redirect } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Leaf, TrendingUp, Map, Database } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useIsMobile } from "@/hooks/use-mobile";

export default function AuthPage() {
  const { user, loginMutation } = useAuth();
  const isMobile = useIsMobile();
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });

  // Redirect if user is already logged in
  if (user) {
    return <Redirect to="/" />;
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginForm.username && loginForm.password) {
      loginMutation.mutate({
        username: loginForm.username,
        password: loginForm.password,
      });
    }
  };

  if (isMobile) {
    // Mobile layout - single column
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          {/* Logo and Title */}
          <div className="text-center space-y-4">
            <img src="/terra-logo.svg" alt="Terra Logo" className="w-20 h-20 mx-auto" />
            <div>
              <h1 className="text-3xl font-bold text-foreground">TERRA-IO</h1>
            </div>
          </div>

          {/* Auth Form */}
          <Card>
            <CardContent className="p-6">
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label htmlFor="login-username">Usuario</Label>
                  <Input
                    id="login-username"
                    type="text"
                    value={loginForm.username}
                    onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                    required
                    data-testid="input-login-username"
                  />
                </div>
                <div>
                  <Label htmlFor="login-password">Contraseña</Label>
                  <Input
                    id="login-password"
                    type="password"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    required
                    data-testid="input-login-password"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={loginMutation.isPending}
                  data-testid="button-login"
                >
                  {loginMutation.isPending ? "Iniciando Sesión..." : "Iniciar Sesión"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Desktop layout - two columns
  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Column - Hero Section */}
      <div className="flex-1 bg-gradient-to-br from-primary to-accent p-12 flex items-center justify-center text-primary-foreground">
        <div className="max-w-md space-y-8">
          <div className="space-y-4">
            <img src="/terra-logo.svg" alt="Terra Logo" className="w-24 h-24" />
            <h1 className="text-5xl font-bold">TERRA-IO</h1>
          </div>

          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <TrendingUp className="text-xl" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Monitoreo en Tiempo Real</h3>
                <p className="opacity-80">Rastrea niveles de CO2, temperatura y humedad desde sensores Bluetooth en tiempo real.</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <Map className="text-xl" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Mapas Interactivos</h3>
                <p className="opacity-80">Visualiza datos ambientales en mapas de calor interactivos con coordenadas GPS.</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <Database className="text-xl" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Gestión de Datos</h3>
                <p className="opacity-80">Importa, exporta y analiza datos ambientales con filtrado avanzado y reportes.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-12">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold text-foreground">Bienvenido</h2>
            <p className="text-muted-foreground">Inicia sesión en tu cuenta</p>
          </div>

          <Card>
            <CardContent className="p-8">
              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="login-username">Usuario</Label>
                  <Input
                    id="login-username"
                    type="text"
                    placeholder="Ingresa tu usuario"
                    value={loginForm.username}
                    onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                    required
                    data-testid="input-login-username"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Contraseña</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="Ingresa tu contraseña"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    required
                    data-testid="input-login-password"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={loginMutation.isPending}
                  data-testid="button-login"
                >
                  {loginMutation.isPending ? "Iniciando Sesión..." : "Iniciar Sesión"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
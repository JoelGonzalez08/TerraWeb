import { ReactNode } from "react";
import { useAuth, UserRole } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Shield } from "lucide-react";

interface RoleGuardProps {
  children: ReactNode;
  requiredRole?: UserRole;
  requiredPermission?: keyof Pick<
    ReturnType<typeof useAuth>,
    'canAccessAnalytics' | 'canManageSensors' | 'canExportData' | 'canManageUsers' | 'canAccessAdvancedSettings'
  >;
  fallback?: ReactNode;
  hideWhenNoAccess?: boolean;
}

export function RoleGuard({ 
  children, 
  requiredRole, 
  requiredPermission,
  fallback, 
  hideWhenNoAccess = false 
}: RoleGuardProps) {
  const auth = useAuth();

  // Check if user has access
  let hasAccess = true;
  
  if (requiredRole) {
    hasAccess = auth.hasRole(requiredRole);
  }
  
  if (requiredPermission && hasAccess) {
    hasAccess = auth[requiredPermission]();
  }

  // If user has access, render children
  if (hasAccess) {
    return <>{children}</>;
  }

  // If hideWhenNoAccess is true, don't render anything
  if (hideWhenNoAccess) {
    return null;
  }

  // If fallback is provided, render it
  if (fallback) {
    return <>{fallback}</>;
  }

  // Default access denied message
  return (
    <Card className="w-full">
      <CardContent className="flex items-center justify-center py-8">
        <div className="text-center">
          <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Acceso Restringido
          </h3>
          <p className="text-muted-foreground max-w-sm">
            {requiredRole 
              ? `Esta funcionalidad requiere permisos de ${requiredRole === 'admin' ? 'administrador' : requiredRole === 'technician' ? 'técnico' : 'usuario'}.`
              : 'No tienes permisos para acceder a esta funcionalidad.'
            }
          </p>
          {auth.user && (
            <p className="text-xs text-muted-foreground mt-2">
              Tu rol actual: <span className="font-medium">
                {auth.user.role === 'admin' ? 'Administrador' : 
                 auth.user.role === 'technician' ? 'Técnico' : 'Usuario'}
              </span>
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
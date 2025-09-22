import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Crown, Users, ShieldCheck, User, Settings } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { RoleGuard } from "@/lib/role-guard";

interface User {
  id: string;
  username: string;
  role: "admin" | "technician" | "user";
}

const roleIcons = {
  admin: Crown,
  technician: ShieldCheck,
  user: User,
};

const roleBadgeColors = {
  admin: "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600",
  technician: "bg-blue-500 hover:bg-blue-600",
  user: "bg-green-500 hover:bg-green-600",
};

const roleLabels = {
  admin: "Administrador",
  technician: "Técnico", 
  user: "Usuario"
};

export default function AdminPage() {
  const isMobile = useIsMobile();
  const { toast } = useToast();
  
  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: string }) => {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ role: newRole }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to update user role");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Rol actualizado",
        description: "El rol del usuario ha sido actualizado exitosamente",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo actualizar el rol del usuario",
        variant: "destructive",
      });
    },
  });

  const handleRoleChange = (userId: string, newRole: string) => {
    updateRoleMutation.mutate({ userId, newRole });
  };

  const getRoleCounts = () => {
    if (!users) return { admin: 0, technician: 0, user: 0 };
    return users.reduce(
      (counts, user) => {
        counts[user.role]++;
        return counts;
      },
      { admin: 0, technician: 0, user: 0 }
    );
  };

  const roleCounts = getRoleCounts();

  if (isLoading) {
    return (
      <main className={`${isMobile ? 'px-4 py-4 pb-20' : 'max-w-7xl mx-auto px-6 py-8'}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  return (
    <RoleGuard requiredPermission="canManageUsers">
      <main className={`${isMobile ? 'px-4 py-4 pb-20' : 'max-w-7xl mx-auto px-6 py-8'}`}>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
                <Settings className="h-8 w-8" />
                Administración de Usuarios
              </h1>
              <p className="text-muted-foreground mt-1">
                Gestiona los roles y permisos de los usuarios del sistema
              </p>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Administradores</CardTitle>
                <Crown className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{roleCounts.admin}</div>
                <p className="text-xs text-muted-foreground">Control total del sistema</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Técnicos</CardTitle>
                <ShieldCheck className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{roleCounts.technician}</div>
                <p className="text-xs text-muted-foreground">Gestión de sensores y datos</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Usuarios</CardTitle>
                <User className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{roleCounts.user}</div>
                <p className="text-xs text-muted-foreground">Acceso básico a datos</p>
              </CardContent>
            </Card>
          </div>

          {/* Users Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Lista de Usuarios
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isMobile ? (
                <div className="space-y-4">
                  {users?.map((user) => {
                    const IconComponent = roleIcons[user.role];
                    return (
                      <div key={user.id} className="p-4 border rounded-lg space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <IconComponent className="h-4 w-4" />
                            <span className="font-medium" data-testid={`user-${user.id}`}>
                              {user.username}
                            </span>
                          </div>
                          <Badge className={`${roleBadgeColors[user.role]} text-white`}>
                            {roleLabels[user.role]}
                          </Badge>
                        </div>
                        <Select
                          value={user.role}
                          onValueChange={(newRole) => handleRoleChange(user.id, newRole)}
                          disabled={updateRoleMutation.isPending}
                        >
                          <SelectTrigger data-testid={`select-role-${user.id}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">Usuario</SelectItem>
                            <SelectItem value="technician">Técnico</SelectItem>
                            <SelectItem value="admin">Administrador</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Rol Actual</TableHead>
                      <TableHead>Cambiar Rol</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users?.map((user) => {
                      const IconComponent = roleIcons[user.role];
                      return (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <IconComponent className="h-4 w-4" />
                              <span data-testid={`user-${user.id}`}>{user.username}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={`${roleBadgeColors[user.role]} text-white`}>
                              {roleLabels[user.role]}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={user.role}
                              onValueChange={(newRole) => handleRoleChange(user.id, newRole)}
                              disabled={updateRoleMutation.isPending}
                            >
                              <SelectTrigger className="w-40" data-testid={`select-role-${user.id}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="user">Usuario</SelectItem>
                                <SelectItem value="technician">Técnico</SelectItem>
                                <SelectItem value="admin">Administrador</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </RoleGuard>
  );
}
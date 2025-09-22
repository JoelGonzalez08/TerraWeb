import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Bell, MapPin, Bluetooth, Database, User, Save } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";

interface SettingsState {
  notifications: {
    enabled: boolean;
    dataAlerts: boolean;
    connectionAlerts: boolean;
    lowBattery: boolean;
  };
  measurement: {
    units: "metric" | "imperial";
    precision: number;
    autoSync: boolean;
    retentionDays: number;
  };
  location: {
    gpsEnabled: boolean;
    defaultLatitude: string;
    defaultLongitude: string;
  };
  bluetooth: {
    autoConnect: boolean;
    discoveryTimeout: number;
    preferredDevices: string[];
  };
}

export default function Settings() {
  const isMobile = useIsMobile();
  const { toast } = useToast();
  
  const [settings, setSettings] = useState<SettingsState>({
    notifications: {
      enabled: true,
      dataAlerts: true,
      connectionAlerts: true,
      lowBattery: false,
    },
    measurement: {
      units: "metric",
      precision: 2,
      autoSync: true,
      retentionDays: 30,
    },
    location: {
      gpsEnabled: true,
      defaultLatitude: "37.7749",
      defaultLongitude: "-122.4194",
    },
    bluetooth: {
      autoConnect: true,
      discoveryTimeout: 30,
      preferredDevices: ["ENV-001", "ENV-002"],
    },
  });

  const updateSetting = (section: keyof SettingsState, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value,
      },
    }));
  };

  const saveSettings = () => {
    // In a real app, this would send settings to the server
    toast({
      title: "Configuración Guardada",
      description: "Tus preferencias han sido guardadas exitosamente.",
    });
  };

  const resetSettings = () => {
    toast({
      title: "Configuración Restablecida",
      description: "Todas las configuraciones han sido restablecidas a los valores por defecto.",
    });
  };

  return (
    <main className={`${isMobile ? 'px-4 py-4 pb-20' : 'max-w-7xl mx-auto px-6 py-8'}`}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Settings</h1>
          <p className="text-muted-foreground">
            Configure your Terra application preferences
          </p>
        </div>

        {/* User Profile */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <CardTitle>Perfil de Usuario</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="user-name">Display Name</Label>
                  <Input
                    id="user-name"
                    placeholder="Your name"
                    data-testid="input-user-name"
                  />
                </div>
                <div>
                  <Label htmlFor="user-email">Email</Label>
                  <Input
                    id="user-email"
                    type="email"
                    placeholder="your.email@example.com"
                    data-testid="input-user-email"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Bell className="h-5 w-5" />
              <CardTitle>Notificaciones</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Habilitar Notificaciones</p>
                  <p className="text-xs text-muted-foreground">Receive alerts and updates</p>
                </div>
                <Switch
                  checked={settings.notifications.enabled}
                  onCheckedChange={(value) => updateSetting("notifications", "enabled", value)}
                  data-testid="switch-notifications"
                />
              </div>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm">Alertas de recolección de datos</p>
                  <Switch
                    checked={settings.notifications.dataAlerts}
                    onCheckedChange={(value) => updateSetting("notifications", "dataAlerts", value)}
                    disabled={!settings.notifications.enabled}
                    data-testid="switch-data-alerts"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm">Alertas de estado de conexión</p>
                  <Switch
                    checked={settings.notifications.connectionAlerts}
                    onCheckedChange={(value) => updateSetting("notifications", "connectionAlerts", value)}
                    disabled={!settings.notifications.enabled}
                    data-testid="switch-connection-alerts"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm">Low battery warnings</p>
                  <Switch
                    checked={settings.notifications.lowBattery}
                    onCheckedChange={(value) => updateSetting("notifications", "lowBattery", value)}
                    disabled={!settings.notifications.enabled}
                    data-testid="switch-battery-alerts"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Measurement Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Database className="h-5 w-5" />
              <CardTitle>Configuración de Mediciones</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="units">Units</Label>
                  <Select
                    value={settings.measurement.units}
                    onValueChange={(value: "metric" | "imperial") => updateSetting("measurement", "units", value)}
                  >
                    <SelectTrigger data-testid="select-units">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="metric">Metric (°C, m, kg)</SelectItem>
                      <SelectItem value="imperial">Imperial (°F, ft, lbs)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="precision">Decimal Precision</Label>
                  <Select
                    value={settings.measurement.precision.toString()}
                    onValueChange={(value) => updateSetting("measurement", "precision", parseInt(value))}
                  >
                    <SelectTrigger data-testid="select-precision">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 decimal place</SelectItem>
                      <SelectItem value="2">2 decimal places</SelectItem>
                      <SelectItem value="3">3 decimal places</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Auto-sync data</p>
                  <p className="text-xs text-muted-foreground">Automatically sync with connected sensors</p>
                </div>
                <Switch
                  checked={settings.measurement.autoSync}
                  onCheckedChange={(value) => updateSetting("measurement", "autoSync", value)}
                  data-testid="switch-auto-sync"
                />
              </div>
              <div>
                <Label htmlFor="retention">Data Retention (days)</Label>
                <Select
                  value={settings.measurement.retentionDays.toString()}
                  onValueChange={(value) => updateSetting("measurement", "retentionDays", parseInt(value))}
                >
                  <SelectTrigger data-testid="select-retention">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 days</SelectItem>
                    <SelectItem value="30">30 days</SelectItem>
                    <SelectItem value="90">90 days</SelectItem>
                    <SelectItem value="365">1 year</SelectItem>
                    <SelectItem value="-1">Never delete</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Location Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <MapPin className="h-5 w-5" />
              <CardTitle>Configuración de Ubicación</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Habilitar GPS</p>
                  <p className="text-xs text-muted-foreground">Use device GPS for location data</p>
                </div>
                <Switch
                  checked={settings.location.gpsEnabled}
                  onCheckedChange={(value) => updateSetting("location", "gpsEnabled", value)}
                  data-testid="switch-gps"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="default-lat">Default Latitude</Label>
                  <Input
                    id="default-lat"
                    placeholder="37.7749"
                    value={settings.location.defaultLatitude}
                    onChange={(e) => updateSetting("location", "defaultLatitude", e.target.value)}
                    data-testid="input-latitude"
                  />
                </div>
                <div>
                  <Label htmlFor="default-lng">Default Longitude</Label>
                  <Input
                    id="default-lng"
                    placeholder="-122.4194"
                    value={settings.location.defaultLongitude}
                    onChange={(e) => updateSetting("location", "defaultLongitude", e.target.value)}
                    data-testid="input-longitude"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bluetooth Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Bluetooth className="h-5 w-5" />
              <CardTitle>Configuración de Bluetooth</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Auto-connect to devices</p>
                  <p className="text-xs text-muted-foreground">Automatically connect to known sensors</p>
                </div>
                <Switch
                  checked={settings.bluetooth.autoConnect}
                  onCheckedChange={(value) => updateSetting("bluetooth", "autoConnect", value)}
                  data-testid="switch-auto-connect"
                />
              </div>
              <div>
                <Label htmlFor="discovery-timeout">Discovery Timeout (seconds)</Label>
                <Select
                  value={settings.bluetooth.discoveryTimeout.toString()}
                  onValueChange={(value) => updateSetting("bluetooth", "discoveryTimeout", parseInt(value))}
                >
                  <SelectTrigger data-testid="select-discovery-timeout">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 seconds</SelectItem>
                    <SelectItem value="30">30 seconds</SelectItem>
                    <SelectItem value="60">1 minute</SelectItem>
                    <SelectItem value="120">2 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Preferred Devices</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {settings.bluetooth.preferredDevices.map((device, index) => (
                    <Badge key={index} variant="secondary" data-testid={`device-${index}`}>
                      {device}
                    </Badge>
                  ))}
                  <Badge variant="outline" className="cursor-pointer" data-testid="add-device">
                    + Add Device
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex space-x-4">
          <Button onClick={saveSettings} data-testid="button-save">
            <Save className="mr-2 h-4 w-4" />
            Save Settings
          </Button>
          <Button variant="outline" onClick={resetSettings} data-testid="button-reset">
            Reset to Defaults
          </Button>
        </div>
      </div>
    </main>
  );
}

import { useIsMobile } from "@/hooks/use-mobile";
import FastAPIHeatmap from "@/components/fastapi-heatmap";
import SensorControls from "@/components/sensor-controls";
import MeasurementStats from "@/components/measurement-stats";
import DataTable from "@/components/data-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bluetooth, Download } from "lucide-react";

export default function Dashboard() {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <main className="px-2 py-4 pb-20">
        {/* Quick Stats */}
        <div className="mb-4">
          <MeasurementStats isMobile />
        </div>

        {/* AlphaEarth Satellite Analysis - Más ancho en móvil */}
        <div className="mb-6">
          <FastAPIHeatmap isMobile />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3 my-6">
          <Button className="p-4 h-auto flex-col" data-testid="mobile-button-connect">
            <Bluetooth className="mb-2 text-lg" />
            <div className="text-sm">Conectar Dispositivo</div>
          </Button>
          <Button variant="secondary" className="p-4 h-auto flex-col" data-testid="mobile-button-extract">
            <Download className="mb-2 text-lg" />
            <div className="text-sm">Extraer Datos</div>
          </Button>
        </div>

        {/* Recent Data */}
        <Card>
          <CardHeader>
            <CardTitle>Lecturas Recientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-sm text-foreground">14:30 - Centro</span>
                <span className="text-sm font-semibold text-primary">412 ppm</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-sm text-foreground">14:25 - Área del Parque</span>
                <span className="text-sm font-semibold text-primary">385 ppm</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-foreground">14:20 - Residencial</span>
                <span className="text-sm font-semibold text-primary">358 ppm</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="w-full px-4 py-6">
      {/* Header con estadísticas */}
      <div className="mb-6">
        {/* <MeasurementStats /> */}
      </div>

      {/* Satellite Analysis - Diseño rectangular ancho */}
      <div className="w-full">
        <FastAPIHeatmap />
      </div>
    </main>
  );
}

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, Plus, Trash2 } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface MeasurementProgram {
  id: string;
  name: string;
  interval: number;
  sensors: string[];
  isActive: boolean;
  measurements: string[];
}

export default function Program() {
  const isMobile = useIsMobile();
  const [programs, setPrograms] = useState<MeasurementProgram[]>([
    {
      id: "1",
      name: "Calidad del Aire Urbano",
      interval: 300,
      sensors: ["sensor-001", "sensor-002"],
      isActive: true,
      measurements: ["CO2", "temperature", "humidity"],
    },
    {
      id: "2",
      name: "Monitoreo del Parque",
      interval: 600,
      sensors: ["sensor-003"],
      isActive: false,
      measurements: ["CO2", "temperature"],
    },
  ]);

  const [newProgram, setNewProgram] = useState({
    name: "",
    interval: 300,
    measurements: [] as string[],
    description: "",
  });

  const toggleProgram = (id: string) => {
    setPrograms(programs.map(p => 
      p.id === id ? { ...p, isActive: !p.isActive } : p
    ));
  };

  const deleteProgram = (id: string) => {
    setPrograms(programs.filter(p => p.id !== id));
  };

  const addProgram = () => {
    if (!newProgram.name) return;
    
    const program: MeasurementProgram = {
      id: Date.now().toString(),
      name: newProgram.name,
      interval: newProgram.interval,
      sensors: [],
      isActive: false,
      measurements: newProgram.measurements,
    };
    
    setPrograms([...programs, program]);
    setNewProgram({
      name: "",
      interval: 300,
      measurements: [],
      description: "",
    });
  };

  return (
    <main className={`${isMobile ? 'px-4 py-4 pb-20' : 'max-w-7xl mx-auto px-6 py-8'}`}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Programas de Medición</h1>
          <p className="text-muted-foreground">
            Configura rutinas y horarios de medición automatizados
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Programas Activos</CardTitle>
          </CardHeader>
          <CardContent>
            {programs.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No hay programas de medición configurados. Crea tu primer programa a continuación.
              </p>
            ) : (
              <div className="space-y-4">
                {programs.map((program) => (
                  <div
                    key={program.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{program.name}</h3>
                        <Badge variant={program.isActive ? "default" : "secondary"}>
                          {program.isActive ? "Activo" : "Inactivo"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Intervalo: {program.interval}s | Sensores: {program.sensors.length}
                      </p>
                      <div className="flex gap-1">
                        {program.measurements.map((measurement) => (
                          <Badge key={measurement} variant="outline" className="text-xs">
                            {measurement}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleProgram(program.id)}
                      >
                        {program.isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        {program.isActive ? "Pausar" : "Iniciar"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteProgram(program.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Crear Nuevo Programa</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <div>
                <Label htmlFor="program-name">Nombre del Programa</Label>
                <Input
                  id="program-name"
                  placeholder="Ej: Monitoreo de Calidad del Aire"
                  value={newProgram.name}
                  onChange={(e) => setNewProgram({...newProgram, name: e.target.value})}
                />
              </div>
              
              <div>
                <Label htmlFor="program-interval">Intervalo de Medición (segundos)</Label>
                <Select
                  value={newProgram.interval.toString()}
                  onValueChange={(value) => setNewProgram({...newProgram, interval: parseInt(value)})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar intervalo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="60">1 minuto (60s)</SelectItem>
                    <SelectItem value="300">5 minutos (300s)</SelectItem>
                    <SelectItem value="600">10 minutos (600s)</SelectItem>
                    <SelectItem value="1800">30 minutos (1800s)</SelectItem>
                    <SelectItem value="3600">1 hora (3600s)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Mediciones a Realizar</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {[
                    { key: "temperature", label: "Temperatura" },
                    { key: "humidity", label: "Humedad" },
                    { key: "CO2", label: "CO2" },
                    { key: "pressure", label: "Presión" },
                    { key: "light", label: "Luz" },
                    { key: "noise", label: "Ruido" },
                  ].map((measurement) => (
                    <div key={measurement.key} className="flex items-center space-x-2">
                      <Switch
                        id={measurement.key}
                        checked={newProgram.measurements.includes(measurement.key)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setNewProgram({
                              ...newProgram,
                              measurements: [...newProgram.measurements, measurement.key],
                            });
                          } else {
                            setNewProgram({
                              ...newProgram,
                              measurements: newProgram.measurements.filter(m => m !== measurement.key),
                            });
                          }
                        }}
                      />
                      <Label htmlFor={measurement.key} className="text-sm">
                        {measurement.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="program-description">Descripción (Opcional)</Label>
                <Textarea
                  id="program-description"
                  placeholder="Describe el propósito de este programa de medición..."
                  value={newProgram.description}
                  onChange={(e) => setNewProgram({...newProgram, description: e.target.value})}
                />
              </div>
            </div>

            <Button 
              onClick={addProgram} 
              className="w-full"
              disabled={!newProgram.name || newProgram.measurements.length === 0}
            >
              <Plus className="h-4 w-4 mr-2" />
              Crear Programa de Medición
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-20 flex-col gap-2">
              <Play className="h-6 w-6" />
              <span>Iniciar Todos</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <Pause className="h-6 w-6" />
              <span>Pausar Todos</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <Trash2 className="h-6 w-6" />
              <span>Eliminar Inactivos</span>
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

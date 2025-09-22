import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, Activity, Droplets, Thermometer, Wind, Leaf, Satellite, BarChart3 } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { RoleGuard } from "@/lib/role-guard";
import { useAuth } from "@/hooks/use-auth";

// Datos simulados para análisis
const performanceData = [
  { month: "Ene", humidity: 65, temperature: 22, co2: 380, growth: 85 },
  { month: "Feb", humidity: 72, temperature: 24, co2: 385, growth: 88 },
  { month: "Mar", humidity: 68, temperature: 26, co2: 390, growth: 92 },
  { month: "Abr", humidity: 70, temperature: 28, co2: 395, growth: 94 },
  { month: "May", humidity: 75, temperature: 30, co2: 388, growth: 96 },
  { month: "Jun", humidity: 78, temperature: 32, co2: 392, growth: 98 },
];

const heatMapAnalysis = [
  { zone: "Zona A", efficiency: 95, area: "50 ha", ndvi: 0.85 },
  { zone: "Zona B", efficiency: 88, area: "45 ha", ndvi: 0.78 },
  { zone: "Zona C", efficiency: 92, area: "38 ha", ndvi: 0.82 },
  { zone: "Zona D", efficiency: 90, area: "42 ha", ndvi: 0.80 },
];

const vegetationGrowthData = [
  { week: "S1", ndvi: 0.3, growth: 15, soil_moisture: 45 },
  { week: "S2", ndvi: 0.4, growth: 25, soil_moisture: 48 },
  { week: "S3", ndvi: 0.5, growth: 35, soil_moisture: 52 },
  { week: "S4", ndvi: 0.6, growth: 50, soil_moisture: 55 },
  { week: "S5", ndvi: 0.7, growth: 65, soil_moisture: 58 },
  { week: "S6", ndvi: 0.8, growth: 78, soil_moisture: 62 },
];

const sensorDistribution = [
  { name: "CO2", value: 28, color: "#8884d8" },
  { name: "Humedad", value: 32, color: "#82ca9d" },
  { name: "Temperatura", value: 25, color: "#ffc658" },
  { name: "Crecimiento", value: 15, color: "#ff7c7c" },
];

export default function Analytics() {
  const isMobile = useIsMobile();
  const [selectedMetric, setSelectedMetric] = useState("all");
  const [timeRange, setTimeRange] = useState("6months");
  const { user } = useAuth();

  return (
    <RoleGuard requiredPermission="canAccessAnalytics">
      <main className={`${isMobile ? 'px-4 py-4 pb-20' : 'max-w-7xl mx-auto px-6 py-8'}`}>
        <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Análisis Avanzado</h1>
            <p className="text-muted-foreground mt-1">
              Análisis de rendimiento y visualizaciones de datos ambientales
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <Select value={selectedMetric} onValueChange={setSelectedMetric}>
              <SelectTrigger className="w-full sm:w-40" data-testid="select-metric">
                <SelectValue placeholder="Métrica" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las métricas</SelectItem>
                <SelectItem value="humidity">Humedad</SelectItem>
                <SelectItem value="temperature">Temperatura</SelectItem>
                <SelectItem value="co2">CO2</SelectItem>
                <SelectItem value="growth">Crecimiento</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-full sm:w-32" data-testid="select-timerange">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1month">1 mes</SelectItem>
                <SelectItem value="3months">3 meses</SelectItem>
                <SelectItem value="6months">6 meses</SelectItem>
                <SelectItem value="1year">1 año</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Métricas principales */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Humedad Promedio</CardTitle>
              <Droplets className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="metric-humidity">71.3%</div>
              <p className="text-xs text-green-600">+2.5% este mes</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Temperatura</CardTitle>
              <Thermometer className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="metric-temperature">27.2°C</div>
              <p className="text-xs text-blue-600">-1.2°C este mes</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Índice NDVI</CardTitle>
              <Leaf className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="metric-ndvi">0.82</div>
              <p className="text-xs text-green-600">+0.08 este mes</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Crecimiento</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="metric-growth">88.7%</div>
              <p className="text-xs text-green-600">+5.2% este mes</p>
            </CardContent>
          </Card>
        </div>

        {/* Análisis en pestañas */}
        <Tabs defaultValue="performance" className="space-y-4">
          <TabsList className={`grid w-full ${isMobile ? 'grid-cols-2' : 'grid-cols-4'}`}>
            <TabsTrigger value="performance" data-testid="tab-performance">
              <Activity className="h-4 w-4 mr-2" />
              {!isMobile && "Rendimiento"}
            </TabsTrigger>
            <TabsTrigger value="heatmap" data-testid="tab-heatmap">
              <Satellite className="h-4 w-4 mr-2" />
              {!isMobile && "Heat Map"}
            </TabsTrigger>
            <TabsTrigger value="vegetation" data-testid="tab-vegetation">
              <Leaf className="h-4 w-4 mr-2" />
              {!isMobile && "Vegetación"}
            </TabsTrigger>
            <TabsTrigger value="distribution" data-testid="tab-distribution">
              <BarChart3 className="h-4 w-4 mr-2" />
              {!isMobile && "Distribución"}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="performance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Análisis de Rendimiento Histórico</CardTitle>
                <CardDescription>
                  Tendencias de humedad, temperatura, CO2 y crecimiento durante los últimos 6 meses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className={`${isMobile ? 'h-64' : 'h-80'}`}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={performanceData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="humidity" stroke="#8884d8" name="Humedad (%)" />
                      <Line type="monotone" dataKey="temperature" stroke="#82ca9d" name="Temperatura (°C)" />
                      <Line type="monotone" dataKey="co2" stroke="#ffc658" name="CO2 (ppm)" />
                      <Line type="monotone" dataKey="growth" stroke="#ff7c7c" name="Crecimiento (%)" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="heatmap" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Análisis de Zonas del Heat Map</CardTitle>
                <CardDescription>
                  Eficiencia y características por zona de cultivo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className={`${isMobile ? 'h-64' : 'h-80'}`}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={heatMapAnalysis}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="zone" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="efficiency" fill="#8884d8" name="Eficiencia (%)" />
                      <Bar dataKey="ndvi" fill="#82ca9d" name="NDVI" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="vegetation" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Análisis de Crecimiento de Vegetación</CardTitle>
                <CardDescription>
                  Índices NDVI, crecimiento y humedad del suelo semanales
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className={`${isMobile ? 'h-64' : 'h-80'}`}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={vegetationGrowthData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="week" />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="ndvi" stackId="1" stroke="#8884d8" fill="#8884d8" name="NDVI" />
                      <Area type="monotone" dataKey="growth" stackId="2" stroke="#82ca9d" fill="#82ca9d" name="Crecimiento (%)" />
                      <Area type="monotone" dataKey="soil_moisture" stackId="3" stroke="#ffc658" fill="#ffc658" name="Humedad Suelo (%)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="distribution" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Distribución de Sensores</CardTitle>
                  <CardDescription>
                    Porcentaje de sensores por tipo de medición
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className={`${isMobile ? 'h-48' : 'h-64'}`}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={sensorDistribution}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {sensorDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Resumen por Zonas</CardTitle>
                  <CardDescription>
                    Estadísticas detalladas por área de cultivo
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {heatMapAnalysis.map((zone, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-muted rounded-lg"
                        data-testid={`zone-summary-${index}`}
                      >
                        <div>
                          <h4 className="font-medium">{zone.zone}</h4>
                          <p className="text-sm text-muted-foreground">Área: {zone.area}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{zone.efficiency}%</p>
                          <p className="text-sm text-muted-foreground">NDVI: {zone.ndvi}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Botón de exportar análisis */}
        <div className="flex justify-end">
          <RoleGuard requiredPermission="canExportData">
            <Button data-testid="button-export-analysis">
              <BarChart3 className="mr-2 h-4 w-4" />
              Exportar Análisis
            </Button>
          </RoleGuard>
        </div>
      </div>
    </main>
    </RoleGuard>
  );
}
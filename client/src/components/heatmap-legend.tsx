import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Info } from "lucide-react";

interface LegendProps {
  index: string;
  isMobile?: boolean;
}

// Configuración de leyendas para cada índice
const legendConfig = {
  ndvi: {
    title: "NDVI - Índice de Vegetación",
    description: "Densidad y salud de la vegetación",
    ranges: [
      { min: -1, max: -0.1, color: "#8B4513", label: "Suelo desnudo/Agua", description: "Sin vegetación" },
      { min: -0.1, max: 0.1, color: "#D2B48C", label: "Muy escasa", description: "Vegetación muy pobre" },
      { min: 0.1, max: 0.3, color: "#FFD700", label: "Escasa", description: "Vegetación dispersa" },
      { min: 0.3, max: 0.5, color: "#9ACD32", label: "Moderada", description: "Vegetación moderada" },
      { min: 0.5, max: 0.7, color: "#32CD32", label: "Buena", description: "Vegetación saludable" },
      { min: 0.7, max: 1, color: "#006400", label: "Excelente", description: "Vegetación muy densa" }
    ]
  },
  ndwi: {
    title: "NDWI - Índice de Agua",
    description: "Contenido de humedad y cuerpos de agua",
    ranges: [
      { min: -1, max: -0.3, color: "#8B4513", label: "Muy seco", description: "Sin contenido de agua" },
      { min: -0.3, max: -0.1, color: "#DEB887", label: "Seco", description: "Bajo contenido de agua" },
      { min: -0.1, max: 0.1, color: "#F0E68C", label: "Moderado", description: "Humedad moderada" },
      { min: 0.1, max: 0.3, color: "#87CEEB", label: "Húmedo", description: "Alto contenido de agua" },
      { min: 0.3, max: 0.6, color: "#4169E1", label: "Muy húmedo", description: "Muy alta humedad" },
      { min: 0.6, max: 1, color: "#0000FF", label: "Agua", description: "Cuerpos de agua" }
    ]
  },
  ndmi: {
    title: "NDMI - Nivel de estrés hídrico",
    description: "Contenido de humedad en la vegetación",
    ranges: [
      { min: -1, max: -0.4, color: "#8B0000", label: "Muy seco", description: "Vegetación muy estresada" },
      { min: -0.4, max: -0.2, color: "#CD853F", label: "Seco", description: "Vegetación estresada" },
      { min: -0.2, max: 0, color: "#DAA520", label: "Moderadamente seco", description: "Estrés hídrico moderado" },
      { min: 0, max: 0.2, color: "#9ACD32", label: "Moderadamente húmedo", description: "Humedad moderada" },
      { min: 0.2, max: 0.4, color: "#32CD32", label: "Húmedo", description: "Buena humedad" },
      { min: 0.4, max: 1, color: "#006400", label: "Muy húmedo", description: "Excelente humedad" }
    ]
  },
  evi: {
    title: "EVI - Índice de Vegetación Mejorado",
    description: "Vegetación con corrección atmosférica",
    ranges: [
      { min: -1, max: 0, color: "#8B4513", label: "Sin vegetación", description: "Suelo o agua" },
      { min: 0, max: 0.2, color: "#D2B48C", label: "Muy baja", description: "Vegetación muy escasa" },
      { min: 0.2, max: 0.4, color: "#FFD700", label: "Baja", description: "Vegetación dispersa" },
      { min: 0.4, max: 0.6, color: "#9ACD32", label: "Moderada", description: "Vegetación moderada" },
      { min: 0.6, max: 0.8, color: "#32CD32", label: "Alta", description: "Vegetación saludable" },
      { min: 0.8, max: 1, color: "#006400", label: "Muy alta", description: "Vegetación muy densa" }
    ]
  },
  savi: {
    title: "SAVI - Índice Ajustado por Suelo",
    description: "Vegetación minimizando efectos del suelo",
    ranges: [
      { min: -1, max: 0, color: "#8B4513", label: "Suelo expuesto", description: "Sin vegetación" },
      { min: 0, max: 0.15, color: "#D2B48C", label: "Muy escasa", description: "Vegetación muy pobre" },
      { min: 0.15, max: 0.3, color: "#FFD700", label: "Escasa", description: "Vegetación dispersa" },
      { min: 0.3, max: 0.45, color: "#9ACD32", label: "Moderada", description: "Vegetación moderada" },
      { min: 0.45, max: 0.6, color: "#32CD32", label: "Buena", description: "Vegetación saludable" },
      { min: 0.6, max: 1, color: "#006400", label: "Excelente", description: "Vegetación muy densa" }
    ]
  }
};

export default function HeatmapLegend({ index, isMobile = false }: LegendProps) {
  const config = legendConfig[index as keyof typeof legendConfig];
  
  if (!config) return null;

  return (
    <Card className={`${isMobile ? 'w-full' : 'w-80'} shadow-lg border-0`}>
      <CardHeader className={`${isMobile ? 'pb-2' : 'pb-3'}`}>
        <CardTitle className={`flex items-center gap-2 ${isMobile ? 'text-sm' : 'text-base'}`}>
          <Info className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} text-blue-600`} />
          <div>
            <div className="font-semibold">{config.title}</div>
            <div className={`${isMobile ? 'text-xs' : 'text-sm'} font-normal text-gray-600`}>
              {config.description}
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className={`${isMobile ? 'pt-0 space-y-1' : 'pt-0 space-y-2'}`}>
        {config.ranges.map((range, index) => (
          <div key={index} className="flex items-center gap-3">
            {/* Indicador de color */}
            <div 
              className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} rounded-sm border border-gray-300 flex-shrink-0`}
              style={{ backgroundColor: range.color }}
            />
            
            {/* Información del rango */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-gray-700`}>
                  {range.label}
                </span>
                <Badge 
                  variant="outline" 
                  className={`${isMobile ? 'text-xs px-1' : 'text-xs'} ml-2 flex-shrink-0`}
                >
                  {range.min.toFixed(1)} - {range.max.toFixed(1)}
                </Badge>
              </div>
              <div className={`${isMobile ? 'text-xs' : 'text-xs'} text-gray-500 mt-0.5`}>
                {range.description}
              </div>
            </div>
          </div>
        ))}
        
        {/* Nota informativa */}
        <div className={`${isMobile ? 'mt-2 pt-2' : 'mt-3 pt-3'} border-t border-gray-200`}>
          <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-gray-500 text-center`}>
            Los valores se calculan automáticamente según los datos satelitales
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
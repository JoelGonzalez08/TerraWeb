import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, useMap, Marker, Popup, Circle } from 'react-leaflet';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Expand, Download, Satellite, Loader2, MapPin, BarChart3, Settings, Info } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import L from 'leaflet';
import { fastapiService, FastAPIRequest, TimeSeriesRequest, SeriesData, TimeSeriesResponse } from "@/services/fastapi-service-fixed";
import KMLUpload from './kml-upload';
import ParcelOverlay from './parcel-overlay';
import HeatmapLegend from './heatmap-legend';

// Fix for default markers in React Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface AlphaEarthMapProps {
  isMobile?: boolean;
}

interface ParcelData {
  success: boolean;
  message: string;
  geometry: {
    type: string;
    coordinates: number[][][];
  };
  features_count: number;
  area_hectares: number;
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
}

// Component to add tile layer to map
function CustomTileLayer({ 
  tileUrl, 
  opacity = 0.85,
  blendMode = "overlay"
}: { 
  tileUrl?: string; 
  opacity?: number;
  blendMode?: string;
}) {
  const map = useMap();

  useEffect(() => {
    if (!tileUrl) return;

    console.log('🛰️ Adding custom tile layer from FastAPI');
    console.log('Tile URL:', tileUrl);
    console.log('Blend mode:', blendMode);

    const customLayer = L.tileLayer(tileUrl, {
      opacity: opacity,
      maxZoom: 18,
      minZoom: 1,
      // Agregar filtros CSS para mejorar el contraste
      className: 'heatmap-overlay'
    });
    
    customLayer.addTo(map);

    // Agregar estilos CSS para mejor blending y contraste
    const style = document.createElement('style');
    style.textContent = `
      .heatmap-overlay {
        mix-blend-mode: ${blendMode};
        filter: contrast(1.4) brightness(1.2) saturate(1.3);
        image-rendering: -webkit-optimize-contrast;
        image-rendering: crisp-edges;
      }
      
      /* Estilos adicionales para mejor visibilidad */
      .leaflet-tile-pane {
        filter: ${tileUrl ? 'brightness(0.9) contrast(0.8)' : 'none'};
      }
    `;
    document.head.appendChild(style);

    return () => {
      map.removeLayer(customLayer);
      if (style.parentNode) {
        style.parentNode.removeChild(style);
      }
    };
  }, [map, tileUrl, opacity, blendMode]);

  return null;
}

// Component to show analysis area and markers
function AnalysisMarkers({ 
  coordinates, 
  widthM, 
  heightM 
}: { 
  coordinates: { lat: number; lng: number };
  widthM: number;
  heightM: number;
}) {
  const map = useMap();

  useEffect(() => {
    // Crear un icono personalizado para el punto de análisis
    const customIcon = L.divIcon({
      html: `
        <div style="
          background: #ef4444;
          border: 2px solid white;
          border-radius: 50%;
          width: 16px;
          height: 16px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        "></div>
      `,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
      className: 'custom-marker'
    });

    // Marcador del punto central
    const centerMarker = L.marker([coordinates.lat, coordinates.lng], {
      icon: customIcon
    });

    centerMarker.bindPopup(`
      <div style="font-size: 12px; line-height: 1.4;">
        <strong>📍 Punto de Análisis</strong><br/>
        <div style="margin-top: 4px;">
          <div><strong>Lat:</strong> ${coordinates.lat.toFixed(6)}°</div>
          <div><strong>Lng:</strong> ${coordinates.lng.toFixed(6)}°</div>
          <div><strong>Área:</strong> ${widthM}m × ${heightM}m</div>
        </div>
      </div>
    `);

    centerMarker.addTo(map);

    // Crear un rectángulo para mostrar el área de análisis
    // Convertir metros a grados con mayor precisión
    const latOffsetM = heightM / 2; // heightM corresponde a la dimensión Norte-Sur
    const lngOffsetM = widthM / 2;  // widthM corresponde a la dimensión Este-Oeste
    
    // Conversión más precisa de metros a grados
    const latOffset = latOffsetM / 111320; // 1 grado lat ≈ 111.32 km
    const lngOffset = lngOffsetM / (111320 * Math.cos(coordinates.lat * Math.PI / 180)); // ajustado por latitud

    const bounds = [
      [coordinates.lat - latOffset, coordinates.lng - lngOffset],
      [coordinates.lat + latOffset, coordinates.lng + lngOffset]
    ] as L.LatLngBoundsExpression;

    const analysisArea = L.rectangle(bounds, {
      color: '#3b82f6',
      weight: 2,
      opacity: 0.8,
      fillColor: '#3b82f6',
      fillOpacity: 0.1,
      dashArray: '5, 5'
    });

    analysisArea.bindPopup(`
      <div style="font-size: 12px; line-height: 1.4;">
        <strong>📐 Área de Análisis</strong><br/>
        <div style="margin-top: 4px;">
          <div><strong>Dimensiones:</strong> ${widthM}m × ${heightM}m</div>
          <div><strong>Área total:</strong> ${((widthM * heightM) / 10000).toFixed(2)} hectáreas</div>
        </div>
      </div>
    `);

    analysisArea.addTo(map);

    return () => {
      map.removeLayer(centerMarker);
      map.removeLayer(analysisArea);
    };
  }, [map, coordinates.lat, coordinates.lng, widthM, heightM]);

  return null;
}

// Component to update map center
function MapUpdater({ 
  center, 
  widthM, 
  heightM, 
  shouldUpdate, 
  onViewChange 
}: { 
  center: [number, number], 
  widthM: number, 
  heightM: number,
  shouldUpdate: boolean,
  onViewChange: (center: [number, number], zoom: number) => void
}) {
  const map = useMap();
  
  useEffect(() => {
    if (shouldUpdate) {
      map.setView(center);
      
      // Ajustar zoom basado en el área de análisis
      const latOffsetM = heightM / 2; // heightM corresponde a la dimensión Norte-Sur
      const lngOffsetM = widthM / 2;  // widthM corresponde a la dimensión Este-Oeste
      
      const latOffset = latOffsetM / 111320; // 1 grado lat ≈ 111.32 km
      const lngOffset = lngOffsetM / (111320 * Math.cos(center[0] * Math.PI / 180)); // ajustado por latitud
      
      const bounds = [
        [center[0] - latOffset, center[1] - lngOffset],
        [center[0] + latOffset, center[1] + lngOffset]
      ] as L.LatLngBoundsExpression;
      
      // Ajustar la vista para que el área sea visible con padding
      map.fitBounds(bounds, { padding: [50, 50] });
      
      // Reportar la nueva vista después de un delay para que se complete el fitBounds
      setTimeout(() => {
        const newCenter = map.getCenter();
        const newZoom = map.getZoom();
        onViewChange([newCenter.lat, newCenter.lng], newZoom);
      }, 100);
    }
  }, [center, map, widthM, heightM, shouldUpdate, onViewChange]);

  return null;
}

export default function AlphaEarthMap({ isMobile = false }: AlphaEarthMapProps) {
  // Estados para configuración de ubicación
  const [coordinates, setCoordinates] = useState({
    lat: 15.7845002,     
    lng: -92.7611756
  });
  
  // Estados para mantener zoom y centro del mapa
  const [mapCenter, setMapCenter] = useState<[number, number]>([15.7845002, -92.7611756]);
  const [mapZoom, setMapZoom] = useState<number>(13);
  const [shouldUpdateView, setShouldUpdateView] = useState<boolean>(true);
  
  // Estados para configuración de FastAPI
  const [widthM, setWidthM] = useState<number>(1000);   // Área inicial 1000m
  const [heightM, setHeightM] = useState<number>(1000); // Área inicial 1000m
  const [startDate, setStartDate] = useState<string>("2024-01-01");
  const [endDate, setEndDate] = useState<string>("2024-06-30");
  const [index, setIndex] = useState<string>("none");
  const cloudPct = 30;   // Filtro de nubes fijo en 30%
  
  // Configuraciones fijas de visualización
  const mapStyle = "satellite-hybrid";  // Satelital + etiquetas fijo
  const overlayOpacity = 100;           // Opacidad fija en 100%
  const showBaseMap = true;             // Siempre mostrar mapa base
  const blendMode = "overlay";          // Modo overlay fijo
  
  // Estados para resultados
  const [tileUrl, setTileUrl] = useState<string | null>(null);
  const [seriesData, setSeriesData] = useState<SeriesData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [parcelData, setParcelData] = useState<ParcelData | null>(null);
  const [map, setMap] = useState<L.Map | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);

  // Configuraciones de diferentes estilos de mapa
  const getMapTileConfig = (style: string) => {
    switch (style) {
      case "satellite":
        return {
          url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
          attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
        };
      case "satellite-hybrid":
        return {
          url: "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}",
          attribution: '&copy; Google'
        };
      case "terrain":
        return {
          url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Physical_Map/MapServer/tile/{z}/{y}/{x}",
          attribution: 'Tiles &copy; Esri &mdash; Source: US National Park Service'
        };
      case "topographic":
        return {
          url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
          attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community'
        };
      case "streets":
        return {
          url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        };
      default:
        return {
          url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
          attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
        };
    }
  };

  // Load data from FastAPI
  const loadHeatmapData = async () => {
    // Si está seleccionada la opción "none", limpiar el mapa de calor
    if (index === 'none') {
      setTileUrl(null);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('🛰️ Loading heatmap data from FastAPI...');
      console.log(`📍 Location: ${coordinates.lat}, ${coordinates.lng}`);
      console.log(`📊 Area: ${widthM}m x ${heightM}m`);
      console.log(`📅 Period: ${startDate} to ${endDate}`);
      console.log(`📈 Index: ${index}, Cloud threshold: ${cloudPct}%`);
      
      // Normalizar el índice a minúsculas para evitar problemas de coincidencia
      const normalizedIndex = index.toLowerCase();
      console.log(`🔄 Normalized index: ${normalizedIndex}`);
      
      const params: FastAPIRequest = {
        lon: coordinates.lng,
        lat: coordinates.lat,
        width_m: widthM,
        height_m: heightM,
        start: startDate,
        end: endDate,
        mode: "heatmap",
        index: normalizedIndex as any,
        cloud_pct: cloudPct
      };

      console.log('📦 Parámetros a enviar:', JSON.stringify(params, null, 2));

      const result = await fastapiService.computeHeatmap(params);
      
      setTileUrl(result.tileUrlTemplate);
      setSeriesData(result.series || []);
      
      console.log('✅ Heatmap data loaded successfully');
      console.log('🗺️ Tile URL:', result.tileUrlTemplate);
      console.log('📊 Time series points:', result.series?.length || 0);
      
    } catch (error) {
      console.error('❌ Error loading heatmap data:', error);
      setError(error instanceof Error ? error.message : 'Error conectando con FastAPI');
    } finally {
      setLoading(false);
    }
  };

  // Nueva función para cargar solo time-series
  const loadTimeSeriesData = async () => {
    if (!index || index === 'none') {
      setError('Debe seleccionar un índice para generar la serie temporal');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log('📊 Loading time-series data from FastAPI...');
      console.log(`📍 Location: ${coordinates.lat}, ${coordinates.lng}`);
      console.log(`📊 Area: ${widthM}m x ${heightM}m`);
      console.log(`📅 Period: ${startDate} to ${endDate}`);
      console.log(`📈 Index: ${index}`);
      
      // Normalizar el índice a minúsculas para evitar problemas de coincidencia
      const normalizedIndex = index.toLowerCase();
      console.log(`🔄 Normalized index for time-series: ${normalizedIndex}`);
      
      const params: TimeSeriesRequest = {
        lon: coordinates.lng,
        lat: coordinates.lat,
        width_m: widthM,
        height_m: heightM,
        start: startDate,
        end: endDate,
        index: normalizedIndex as any
      };

      console.log('📦 Time-series params:', JSON.stringify(params, null, 2));

      const result = await fastapiService.getTimeSeries(params);
      
      console.log('✅ Time-series result received:', result);
      console.log('📊 Series data type:', typeof result.series);
      console.log('📊 Series data length:', result.series?.length);
      console.log('📊 Series data content:', result.series);
      
      if (result.series && result.series.length > 0) {
        console.log('📊 First data point:', result.series[0]);
        console.log('📊 Sample data structure:', {
          date: result.series[0]?.date,
          value: result.series[0]?.value,
          dateType: typeof result.series[0]?.date,
          valueType: typeof result.series[0]?.value
        });
      }
      
      setSeriesData(result.series || []);
      
      console.log('✅ Time-series data loaded successfully');
      console.log('📊 Data points:', result.data_points);
      console.log('📊 Average:', result.average);
      console.log('📊 Source:', result.source);
      console.log('📊 Final seriesData state will be:', result.series || []);
      console.log('📊 State update - setting seriesData to:', (result.series || []).length, 'items');
      
      // Forzar re-render verificando el estado después de un breve delay
      setTimeout(() => {
        console.log('📊 State check after timeout - seriesData length:', seriesData.length);
      }, 100);
      
    } catch (error) {
      console.error('❌ Error loading time-series data:', error);
      
      let errorMessage = 'Error conectando con FastAPI';
      
      if (error instanceof Error) {
        if (error.message.includes('No se encontraron imágenes')) {
          errorMessage = `No hay datos disponibles para ${index?.toUpperCase()} en el período ${startDate} - ${endDate}. 
          Intenta: • Ampliar el rango de fechas
          • Cambiar a otro índice (NDVI suele tener más disponibilidad)
          • Verificar que la ubicación tenga cobertura de Sentinel-2`;
        } else {
          errorMessage = error.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement && mapRef.current) {
      mapRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleKMLUpload = (data: ParcelData) => {
    setParcelData(data);
    
    // Procesar automáticamente las coordenadas del polígono
    if (data && data.bounds) {
      // Calcular el centro del polígono
      const centerLat = (data.bounds.north + data.bounds.south) / 2;
      const centerLng = (data.bounds.east + data.bounds.west) / 2;
      
      // Calcular las dimensiones aproximadas del área
      // Conversión aproximada de grados a metros (depende de la latitud)
      const latDiffKm = (data.bounds.north - data.bounds.south) * 111; // 1 grado ≈ 111 km
      const lngDiffKm = (data.bounds.east - data.bounds.west) * 111 * Math.cos(centerLat * Math.PI / 180);
      
      // Convertir a metros y usar el 100% del área para cubrir todo el polígono
      const areaWidthM = Math.round(lngDiffKm * 1000);
      const areaHeightM = Math.round(latDiffKm * 1000);
      
      console.log(`🎯 KML procesado - Centro: ${centerLat}, ${centerLng}`);
      console.log(`📐 Dimensiones calculadas: ${areaWidthM}m x ${areaHeightM}m (100% cobertura)`);
      console.log(`📊 Área KML: ${data.area_hectares} hectáreas`);
      console.log(`📊 Área análisis: ${((Math.min(areaWidthM, 10000) * Math.min(areaHeightM, 10000)) / 10000).toFixed(2)} hectáreas`);
      
      // Actualizar las coordenadas y dimensiones
      setCoordinates({ lat: centerLat, lng: centerLng });
      setWidthM(Math.min(areaWidthM, 10000)); // Máximo 10km para parcelas grandes
      setHeightM(Math.min(areaHeightM, 10000)); // Máximo 10km para parcelas grandes
      
      // Procesar automáticamente después de un pequeño delay
      setTimeout(() => {
        // Si hay un índice seleccionado (no "none"), generar el heatmap automáticamente
        if (index && index !== 'none') {
          console.log(`🚀 Generando heatmap automáticamente con índice: ${index}`);
          // El useEffect se encargará de cargar los datos automáticamente
        } else {
          // Si no hay índice seleccionado, seleccionar NDVI por defecto
          console.log(`🌱 Seleccionando NDVI por defecto para procesar KML`);
          setIndex('ndvi');
        }
      }, 1000); // Delay de 1 segundo para que se actualice el mapa
    }
  };

  const handleClearParcel = () => {
    setParcelData(null);
    // Restablecer a valores por defecto completamente
    setIndex('none');
    setTileUrl(null);
    setWidthM(1000);
    setHeightM(1000);
    setSeriesData([]);
    setError(null);
    setLoading(false);
    
    // Restablecer coordenadas a valores por defecto
    setCoordinates({
      lat: 15.7845002,     
      lng: -92.7611756
    });
    
    // Forzar actualización de la vista del mapa
    setShouldUpdateView(true);
    
    console.log(`🧹 Parcela limpiada completamente, restableciendo todos los valores por defecto`);
  };

  const handleMapReady = (mapInstance: L.Map) => {
    try {
      if (mapInstance && mapInstance.getContainer()) {
        setMap(mapInstance);
      }
    } catch (error) {
      console.warn('Error setting map instance:', error);
    }
  };

  // Manejar cambios en la vista del mapa
  const handleViewChange = (center: [number, number], zoom: number) => {
    setMapCenter(center);
    setMapZoom(zoom);
    setShouldUpdateView(false); // Ya no necesitamos actualizar la vista automáticamente
  };

  // Manejar cambios de vista por parte del usuario (arrastrar, zoom)
  const handleUserViewChange = (center: [number, number], zoom: number) => {
    setMapCenter(center);
    setMapZoom(zoom);
    // No cambiar shouldUpdateView aquí, ya que queremos mantener la vista del usuario
  };

  // Actualizar vista solo cuando cambien las coordenadas (no cuando cambie el índice)
  useEffect(() => {
    setMapCenter([coordinates.lat, coordinates.lng]);
    setShouldUpdateView(true); // Permitir actualización cuando cambien las coordenadas
  }, [coordinates.lat, coordinates.lng]);

  // Manejar el estado de montaje del componente
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  // Auto-cargar heatmap cuando cambien los parámetros
  useEffect(() => {
    // Solo hacer la petición si tenemos un índice seleccionado y el componente está montado
    if (index && startDate && endDate && mapRef.current && isMounted) {
      // Agregar un pequeño delay para evitar peticiones excesivas
      const timeoutId = setTimeout(() => {
        loadHeatmapData();
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [index, startDate, endDate, coordinates.lat, coordinates.lng, widthM, heightM, isMounted]);

  // Forzar actualización del mapa cuando se restablecen las dimensiones
  useEffect(() => {
    if (widthM === 1000 && heightM === 1000 && !parcelData) {
      // Esto indica que se acaba de limpiar la parcela
      setShouldUpdateView(true);
    }
  }, [widthM, heightM, parcelData]);

  const mapHeight = isMobile ? "350px" : "450px"; // Reducido un poco en desktop
  const containerHeight = isMobile ? "auto" : "600px"; // Altura fija en desktop para aspecto rectangular

  return (
    <div className={`w-full ${isMobile ? 'min-h-screen' : `h-[${containerHeight}]`} flex flex-col bg-gradient-to-br from-green-50 to-blue-50 rounded-lg shadow-lg`}>
      {/* Header - Más compacto */}
      <div className={`${isMobile ? 'p-4' : 'p-4'} bg-white border-b shadow-sm rounded-t-lg`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Satellite className={`${isMobile ? 'h-5 w-5' : 'h-6 w-6'} text-green-600`} />
            </div>
            <div>
              <h1 className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold text-gray-900`}>Análisis Satelital</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content with Tabs */}
      <div className={`flex-1 ${isMobile ? 'p-3' : 'p-4'}`}>
        <Tabs defaultValue="map" className="h-full flex flex-col">
          <TabsList className={`grid w-full grid-cols-2 mb-3 ${isMobile ? 'h-10' : 'h-12'}`}>
            <TabsTrigger value="map" className="flex items-center space-x-2">
              <MapPin className="h-4 w-4" />
              <span className={isMobile ? 'text-xs' : 'text-sm'}>Mapa de Calor</span>
            </TabsTrigger>
            <TabsTrigger value="timeseries" className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span className={isMobile ? 'text-xs' : 'text-sm'}>Serie Temporal</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="map" className={`flex-1 ${isMobile ? 'flex flex-col space-y-4' : 'flex space-x-4'}`}>
            {/* Controls Panel */}
            <Card className={`${isMobile ? 'w-full order-2' : 'w-72'} shadow-lg border-0 bg-white/80 backdrop-blur`}>
              <CardHeader className="pb-3">
                <CardTitle className={`flex items-center space-x-2 ${isMobile ? 'text-base' : 'text-lg'}`}>
                  <Settings className="h-4 w-4 text-blue-600" />
                  <span>Configuración</span>
                </CardTitle>
              </CardHeader>
              <CardContent className={`${isMobile ? 'space-y-3' : 'space-y-4'}`}>
                {/* Coordenadas */}
                <div className="space-y-2">
                  <Label className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium`}>📍 Coordenadas</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="latitude" className="text-xs">Latitud</Label>
                      <Input
                        id="latitude"
                        type="number"
                        step="0.000001"
                        value={coordinates.lat}
                        onChange={(e) => setCoordinates(prev => ({ ...prev, lat: parseFloat(e.target.value) || 0 }))}
                        className={`${isMobile ? 'h-7 text-xs' : 'h-8'}`}
                      />
                    </div>
                    <div>
                      <Label htmlFor="longitude" className="text-xs">Longitud</Label>
                      <Input
                        id="longitude"
                        type="number"
                        step="0.000001"
                        value={coordinates.lng}
                        onChange={(e) => setCoordinates(prev => ({ ...prev, lng: parseFloat(e.target.value) || 0 }))}
                        className={`${isMobile ? 'h-7 text-xs' : 'h-8'}`}
                      />
                    </div>
                  </div>
                </div>

                {/* Dimensiones del área */}
                <div className="space-y-2">
                  <Label className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium`}>📐 Área de Análisis</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="widthM" className="text-xs">Ancho (m)</Label>
                      <Input
                        id="widthM"
                        type="number"
                        step="100"
                        value={widthM}
                        onChange={(e) => setWidthM(parseInt(e.target.value) || 1000)}
                        className={`${isMobile ? 'h-7 text-xs' : 'h-8'}`}
                      />
                    </div>
                    <div>
                      <Label htmlFor="heightM" className="text-xs">Alto (m)</Label>
                      <Input
                        id="heightM"
                        type="number"
                        step="100"
                        value={heightM}
                        onChange={(e) => setHeightM(parseInt(e.target.value) || 1000)}
                        className={`${isMobile ? 'h-7 text-xs' : 'h-8'}`}
                      />
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    Área total: {((widthM * heightM) / 10000).toFixed(2)} hectáreas
                  </div>
                </div>

                {/* Rango de fechas */}
                <div className="space-y-2">
                  <Label className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium`}>📅 Período</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="startDate" className="text-xs">Inicio</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className={`${isMobile ? 'h-7 text-xs' : 'h-8'}`}
                      />
                    </div>
                    <div>
                      <Label htmlFor="endDate" className="text-xs">Fin</Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className={`${isMobile ? 'h-7 text-xs' : 'h-8'}`}
                      />
                    </div>
                  </div>
                </div>

                {/* Índice satelital */}
                <div className="space-y-2">
                  <Label className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium`}>📊 Índice Satelital</Label>
                  <Select value={index} onValueChange={setIndex}>
                    <SelectTrigger className={`${isMobile ? 'h-7 text-xs' : 'h-8'}`}>
                      <SelectValue placeholder="Seleccionar parámetro..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Ninguno (Solo mapa base)</SelectItem>
                      {/* <SelectItem value="rgb">RGB Composite</SelectItem> */}
                      <SelectItem value="ndvi">NDVI (Vegetación)</SelectItem>
                      <SelectItem value="ndwi">NDWI (Agua)</SelectItem>
                      <SelectItem value="ndmi">NDMI (Humedad)</SelectItem>
                      <SelectItem value="evi">EVI (Vegetación Mejorada)</SelectItem>
                      <SelectItem value="savi">SAVI (Suelo Ajustado)</SelectItem>
                      {/* <SelectItem value="gci">GCI (Clorofila Verde)</SelectItem> */}
                    </SelectContent>
                  </Select>
                </div>

                {/* KML Upload */}
                <div className="space-y-2">
                  <Label className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium`}>📁 Archivo KML</Label>
                  <KMLUpload 
                    onParcelLoaded={handleKMLUpload}
                    currentParcel={parcelData}
                    onClearParcel={handleClearParcel}
                    compact={true}
                  />
                </div>

                {/* Indicador de estado */}
                <div className={`w-full p-3 rounded-lg border ${loading ? 'bg-blue-50 border-blue-200' : index ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex items-center justify-center space-x-2">
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                        <span className={`${isMobile ? 'text-xs' : 'text-sm'} text-blue-600 font-medium`}>
                          Generando heatmap automáticamente...
                        </span>
                      </>
                    ) : index ? (
                      <>
                        <Satellite className="h-4 w-4 text-green-600" />
                        <span className={`${isMobile ? 'text-xs' : 'text-sm'} text-green-600 font-medium`}>
                          Listo
                        </span>
                      </>
                    ) : (
                      <>
                        <Info className="h-4 w-4 text-gray-600" />
                        <span className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600`}>
                          Selecciona un índice para generar heatmap
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Error display */}
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg space-y-3">
                    <p className="text-red-700 text-sm">{error}</p>
                    {error.includes('No se encontraron imágenes') && (
                      <div className="flex flex-col space-y-2">
                        <p className="text-xs text-red-600 font-medium">Soluciones rápidas:</p>
                        <div className="flex flex-wrap gap-2">
                          {index !== 'ndvi' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                              onClick={() => {
                                setIndex('ndvi');
                                setError(null);
                              }}
                            >
                              🌱 Cambiar a NDVI
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={() => {
                              setStartDate('2024-01-01');
                              setEndDate('2024-06-30');
                              setError(null);
                            }}
                          >
                            📅 Usar fechas 2024
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Map */}
            <Card className={`${isMobile ? 'w-full order-1' : 'flex-1'} shadow-lg border-0 overflow-hidden`}>
              <CardContent className="p-0">
                <div 
                  ref={mapRef} 
                  className="relative"
                  style={{ height: mapHeight }}
                >
                  <Button
                    onClick={toggleFullscreen}
                    className={`absolute top-2 right-2 z-[1000] bg-white/90 hover:bg-white text-gray-700 ${isMobile ? 'h-8 w-8 p-0' : ''}`}
                    size="sm"
                  >
                    <Expand className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} />
                  </Button>
                  
                  <MapContainer
                    center={mapCenter}
                    zoom={mapZoom}
                    style={{ 
                      height: '100%', 
                      width: '100%',
                      backgroundColor: showBaseMap ? 'transparent' : '#000000' 
                    }}
                    className="rounded-lg shadow-inner"
                    scrollWheelZoom={true}
                    doubleClickZoom={true}
                    dragging={true}
                  >
                    {/* Mapa base condicional */}
                    {showBaseMap && (
                      <TileLayer
                        url={getMapTileConfig(mapStyle).url}
                        attribution={getMapTileConfig(mapStyle).attribution}
                        maxZoom={18}
                        minZoom={1}
                      />
                    )}
                    
                    {/* Capa de heatmap */}
                    {tileUrl && (
                      <CustomTileLayer 
                        tileUrl={tileUrl} 
                        opacity={overlayOpacity / 100} 
                        blendMode={blendMode}
                      />
                    )}
                    <AnalysisMarkers 
                      coordinates={coordinates}
                      widthM={widthM}
                      heightM={heightM}
                    />
                    <MapUpdater 
                      center={mapCenter} 
                      widthM={widthM}
                      heightM={heightM}
                      shouldUpdate={shouldUpdateView}
                      onViewChange={handleViewChange}
                    />
                    {parcelData && map && (
                      <ParcelOverlay parcelData={parcelData} map={map} />
                    )}
                    <MapEventHandler 
                      onMapReady={handleMapReady} 
                      onViewChange={handleUserViewChange}
                    />
                  </MapContainer>
                </div>
              </CardContent>
            </Card>

            {/* Leyenda del Heatmap */}
            {tileUrl && (
              <div className={`${isMobile ? 'w-full' : 'w-80'} flex-shrink-0`}>
                <HeatmapLegend index={index} isMobile={isMobile} />
              </div>
            )}
          </TabsContent>

          <TabsContent value="timeseries" className="flex-1">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                    <span>Serie Temporal</span>
                  </div>
                  <Button 
                    onClick={loadTimeSeriesData}
                    disabled={loading || !index}
                    className={`bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 ${isMobile ? 'h-8 text-xs px-3' : ''}`}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Cargando...
                      </>
                    ) : (
                      <>
                        <BarChart3 className="mr-2 h-4 w-4" />
                        Generar Serie
                      </>
                    )}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="h-full">
                
                {seriesData && Array.isArray(seriesData) && seriesData.length > 0 ? (
                  <div>
                    <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded">
                      <p className="text-sm text-green-600">
                        Rango: {seriesData[0]?.date} - {seriesData[seriesData.length - 1]?.date}
                      </p>
                    </div>
                    <ResponsiveContainer width="100%" height={400}>
                      <LineChart data={seriesData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          tick={{ fontSize: 12 }}
                          angle={-45}
                          textAnchor="end"
                          height={60}
                        />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip 
                          labelFormatter={(value) => `Fecha: ${value}`}
                          formatter={(value) => [value, `${index?.toUpperCase()} Index`]}
                        />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="value" 
                          stroke="#8884d8" 
                          strokeWidth={3}
                          dot={{ fill: '#8884d8', strokeWidth: 2, r: 4 }}
                          name={`${index?.toUpperCase() || 'Unknown'} Index`}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                    <div className="text-center">
                      <BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      {loading ? (
                        <div className="flex items-center justify-center">
                          <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                          <p>Cargando datos de serie temporal...</p>
                        </div>
                      ) : (
                        <p>No hay datos de serie temporal disponibles.</p>
                      )}
                    </div>  
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Componente para manejar eventos del mapa
const MapEventHandler: React.FC<{ 
  onMapReady: (map: L.Map) => void;
  onViewChange?: (center: [number, number], zoom: number) => void;
}> = ({ onMapReady, onViewChange }) => {
  const map = useMap();
  
  useEffect(() => {
    if (map && map.getContainer()) {
      // Agregar un pequeño delay para asegurar que el DOM esté listo
      const timeoutId = setTimeout(() => {
        try {
          onMapReady(map);
        } catch (error) {
          console.warn('Error en MapEventHandler:', error);
        }
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [map, onMapReady]);

  useEffect(() => {
    if (map && onViewChange) {
      const handleViewChange = () => {
        const center = map.getCenter();
        const zoom = map.getZoom();
        onViewChange([center.lat, center.lng], zoom);
      };

      // Escuchar eventos de movimiento y zoom del usuario
      map.on('moveend', handleViewChange);
      map.on('zoomend', handleViewChange);

      return () => {
        map.off('moveend', handleViewChange);
        map.off('zoomend', handleViewChange);
      };
    }
  }, [map, onViewChange]);

  return null;
};
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, MapPin, Trash2, FileText, CheckCircle, FolderOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

interface KMLUploadProps {
  onParcelLoaded: (data: ParcelData) => void;
  currentParcel: ParcelData | null;
  onClearParcel: () => void;
  compact?: boolean;
}

const FASTAPI_BASE_URL = import.meta.env.VITE_FASTAPI_URL || 'http://172.17.16.104:8000';

// KML precargados disponibles
const PRELOADED_KML_OPTIONS = [
  {
    id: 'parcela_demo_1',
    name: 'Parcela Demo 1',
    description: 'Valle Central - Cultivos mixtos',
    filename: 'parcela_demo_1.kml',
    path: '/demo-kmls/parcela_demo_1.kml'
  }
];

export default function KMLUpload({ onParcelLoaded, currentParcel, onClearParcel, compact = false }: KMLUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedPreloadedKML, setSelectedPreloadedKML] = useState<string>("");
  const [isLoadingPreloaded, setIsLoadingPreloaded] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.kml')) {
      toast({
        title: "Error",
        description: "Por favor selecciona un archivo KML válido",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${FASTAPI_BASE_URL}/upload-kml`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server response:', errorText);
        throw new Error(`Error del servidor: ${response.status}`);
      }

      const data: ParcelData = await response.json();
      
      if (data.success) {
        onParcelLoaded(data);
        toast({
          title: "¡Parcela cargada!",
          description: `${data.message} Área: ${data.area_hectares.toFixed(2)} hectáreas`,
        });
      } else {
        throw new Error(data.message || 'Error procesando el archivo KML');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al procesar el archivo KML",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      // Limpiar el input
      event.target.value = '';
    }
  };

  // Función para cargar KML precargados
  const handlePreloadedKMLSelect = async (kmlId: string) => {
    if (!kmlId) return;
    
    setIsLoadingPreloaded(true);
    setSelectedPreloadedKML(kmlId);
    
    try {
      const selectedKML = PRELOADED_KML_OPTIONS.find(kml => kml.id === kmlId);
      if (!selectedKML) {
        throw new Error('KML seleccionado no encontrado');
      }

      // Cargar el archivo KML directamente desde la carpeta public
      const response = await fetch(selectedKML.path);
      if (!response.ok) {
        throw new Error(`Error cargando archivo: ${response.status}`);
      }
      
      const kmlContent = await response.text();
      
      // Crear un archivo simulado para reutilizar la lógica existente
      const kmlBlob = new Blob([kmlContent], { type: 'application/vnd.google-earth.kml+xml' });
      const kmlFile = new File([kmlBlob], selectedKML.filename, { 
        type: 'application/vnd.google-earth.kml+xml' 
      });

      // Usar la misma lógica de upload pero con el archivo precargado
      const formData = new FormData();
      formData.append('file', kmlFile);

      const uploadResponse = await fetch(`${FASTAPI_BASE_URL}/upload-kml`, {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error('Server response:', errorText);
        throw new Error(`Error del servidor: ${uploadResponse.status}`);
      }

      const data: ParcelData = await uploadResponse.json();
      
      if (data.success) {
        onParcelLoaded(data);
        toast({
          title: "¡Parcela precargada!",
          description: `${selectedKML.name} cargada. Área: ${data.area_hectares.toFixed(2)} hectáreas`,
        });
      } else {
        throw new Error(data.message || 'Error procesando KML precargado');
      }
    } catch (error) {
      console.error('Error loading preloaded KML:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al cargar el KML precargado",
        variant: "destructive",
      });
      setSelectedPreloadedKML(""); // Reset selection on error
    } finally {
      setIsLoadingPreloaded(false);
    }
  };

  return (
    <>
      {compact ? (
        <div className="space-y-2">
          {!currentParcel ? (
            <div className="space-y-2">
              {/* Selector de KML precargados */}
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <Select 
                    value={selectedPreloadedKML} 
                    onValueChange={handlePreloadedKMLSelect}
                    disabled={isLoadingPreloaded || isUploading}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="📁 KML precargados" />
                    </SelectTrigger>
                    <SelectContent>
                      {PRELOADED_KML_OPTIONS.map((kml) => (
                        <SelectItem key={kml.id} value={kml.id} className="text-xs">
                          <div className="flex items-center gap-2">
                            <FolderOpen className="h-3 w-3" />
                            <span>{kml.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {isLoadingPreloaded && (
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Upload className="h-3 w-3 mr-1 animate-pulse" />
                    Cargando...
                  </div>
                )}
              </div>
              
              {/* Separador */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="flex-1 border-t"></div>
                <span>o</span>
                <div className="flex-1 border-t"></div>
              </div>
              
              {/* Upload de archivo */}
              <div className="flex items-center gap-2">
                <div className="flex-1 relative">
                  <Input
                    type="file"
                    accept=".kml"
                    onChange={handleFileUpload}
                    disabled={isUploading || isLoadingPreloaded}
                    className="file:mr-2 file:py-1 file:px-2 file:rounded-sm file:border-0 file:text-xs file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                  />
                </div>
                {isUploading && (
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Upload className="h-3 w-3 mr-1 animate-pulse" />
                    Subiendo...
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded-md">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <div className="text-sm">
                  <span className="font-medium text-green-800">{currentParcel.area_hectares.toFixed(1)} ha</span>
                  <span className="text-green-600 ml-1">cargada</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Input
                  type="file"
                  accept=".kml"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  className="hidden"
                  id="kml-change"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={() => document.getElementById('kml-change')?.click()}
                  disabled={isUploading}
                >
                  <FileText className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={onClearParcel}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3 p-3 bg-muted/30 rounded-lg border border-border/50">
          {!currentParcel ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Contorno de Parcela</span>
              </div>
              
              {/* Selector de KML precargados */}
              <div className="space-y-2">
                <span className="text-xs font-medium text-muted-foreground">Parcelas de demostración:</span>
                <Select 
                  value={selectedPreloadedKML} 
                  onValueChange={handlePreloadedKMLSelect}
                  disabled={isLoadingPreloaded || isUploading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="📁 Seleccionar KML precargado" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRELOADED_KML_OPTIONS.map((kml) => (
                      <SelectItem key={kml.id} value={kml.id}>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <FolderOpen className="h-4 w-4" />
                            <span className="font-medium">{kml.name}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">{kml.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {isLoadingPreloaded && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Upload className="h-4 w-4 mr-1 animate-pulse" />
                    Cargando parcela precargada...
                  </div>
                )}
              </div>
              
              {/* Separador */}
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="flex-1 border-t"></div>
                <span>o subir archivo propio</span>
                <div className="flex-1 border-t"></div>
              </div>
              
              {/* Upload de archivo */}
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept=".kml"
                  onChange={handleFileUpload}
                  disabled={isUploading || isLoadingPreloaded}
                  className="flex-1 file:mr-2 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                />
                {isUploading && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Upload className="h-4 w-4 mr-1 animate-pulse" />
                    Subiendo...
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Archivo KML para mostrar el contorno en el mapa
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Parcela Cargada</span>
              </div>
              <div className="p-2 bg-green-50 border border-green-200 rounded-md">
                <div className="flex items-center justify-between">
                  <div className="grid grid-cols-2 gap-3 text-sm flex-1">
                    <div>
                      <span className="text-muted-foreground">Área:</span>
                      <span className="ml-1 font-medium text-green-800">{currentParcel.area_hectares.toFixed(2)} ha</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Polígonos:</span>
                      <span className="ml-1 font-medium text-green-800">{currentParcel.features_count}</span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onClearParcel}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept=".kml"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  className="flex-1"
                />
                {isUploading && (
                  <span className="text-xs text-muted-foreground">Cambiando...</span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
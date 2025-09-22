import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, MapPin, Trash2, FileText, CheckCircle } from "lucide-react";
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

const FASTAPI_BASE_URL = 'http://localhost:8000';

export default function KMLUpload({ onParcelLoaded, currentParcel, onClearParcel, compact = false }: KMLUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
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

  return (
    <>
      {compact ? (
        <div className="space-y-2">
          {!currentParcel ? (
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <Input
                  type="file"
                  accept=".kml"
                  onChange={handleFileUpload}
                  disabled={isUploading}
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
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept=".kml"
                  onChange={handleFileUpload}
                  disabled={isUploading}
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
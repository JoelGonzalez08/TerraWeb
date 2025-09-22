import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Upload, Download, FileText, CheckCircle, AlertCircle } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { DataFile } from "@shared/schema";

interface UploadStatus {
  file: File;
  progress: number;
  status: "uploading" | "completed" | "error";
  error?: string;
}

export default function UploadPage() {
  const isMobile = useIsMobile();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploads, setUploads] = useState<UploadStatus[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: dataFiles, isLoading } = useQuery<DataFile[]>({
    queryKey: ["/api/uploads"],
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      
      const response = await fetch("/api/uploads", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error(`Error en la carga: ${response.statusText}`);
      }
      
      return response.json();
    },
    onSuccess: (data, file) => {
      setUploads(prev => prev.map(upload => 
        upload.file === file 
          ? { ...upload, progress: 100, status: "completed" as const }
          : upload
      ));
      toast({
        title: "Carga Exitosa",
        description: `${file.name} se ha cargado correctamente.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/uploads"] });
    },
    onError: (error, file) => {
      setUploads(prev => prev.map(upload => 
        upload.file === file 
          ? { ...upload, status: "error" as const, error: error.message }
          : upload
      ));
      toast({
        title: "Error en la Carga",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    files.forEach(file => {
      // Validate file type
      if (!file.name.endsWith('.csv') && !file.name.endsWith('.json')) {
        toast({
          title: "Tipo de Archivo Inválido",
          description: "Please select CSV or JSON files only.",
          variant: "destructive",
        });
        return;
      }

      // Add to uploads list
      setUploads(prev => [...prev, {
        file,
        progress: 0,
        status: "uploading",
      }]);

      // Start upload
      uploadMutation.mutate(file);
    });

    // Clear input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const downloadTemplate = () => {
    const csvTemplate = [
      "timestamp,latitude,longitude,measurementType,value,unit",
      "2024-01-15T14:30:00Z,37.7749,-122.4194,CO2,412,ppm",
      "2024-01-15T14:30:00Z,37.7749,-122.4194,temperature,23.5,C",
      "2024-01-15T14:30:00Z,37.7749,-122.4194,humidity,68,%"
    ].join('\n');
    
    const blob = new Blob([csvTemplate], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'terra-template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportData = async () => {
    try {
      const response = await apiRequest("GET", "/api/measurements/export", {});
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `terra-export-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast({
        title: "Error en la Exportación",
        description: "Error al exportar los datos de medición.",
        variant: "destructive",
      });
    }
  };

  return (
    <main className={`${isMobile ? 'px-4 py-4 pb-20' : 'max-w-7xl mx-auto px-6 py-8'}`}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Data Upload & Export</h1>
          <p className="text-muted-foreground">
            Import measurement data from files or export collected data
          </p>
        </div>

        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle>Cargar Datos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="file-upload">Select Files</Label>
                <div className="mt-2">
                  <Input
                    ref={fileInputRef}
                    id="file-upload"
                    type="file"
                    multiple
                    accept=".csv,.json"
                    onChange={handleFileSelect}
                    data-testid="input-file-upload"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Supported formats: CSV, JSON (Max 10MB per file)
                  </p>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  data-testid="button-browse-files"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Browse Files
                </Button>
                <Button
                  variant="outline"
                  onClick={downloadTemplate}
                  data-testid="button-download-template"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download Template
                </Button>
              </div>

              {/* Upload Progress */}
              {uploads.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-foreground">Upload Progress</h4>
                  {uploads.map((upload, index) => (
                    <div key={index} className="p-3 border border-border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-foreground">{upload.file.name}</span>
                        <div className="flex items-center space-x-2">
                          {upload.status === "completed" && (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          )}
                          {upload.status === "error" && (
                            <AlertCircle className="h-4 w-4 text-red-500" />
                          )}
                          <Badge variant={
                            upload.status === "completed" ? "default" :
                            upload.status === "error" ? "destructive" : "secondary"
                          }>
                            {upload.status}
                          </Badge>
                        </div>
                      </div>
                      {upload.status === "uploading" && (
                        <Progress value={upload.progress} className="h-2" />
                      )}
                      {upload.error && (
                        <p className="text-sm text-red-500 mt-1">{upload.error}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Export Section */}
        <Card>
          <CardHeader>
            <CardTitle>Exportar Datos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Export all collected measurement data as CSV or JSON format
              </p>
              <div className="flex space-x-2">
                <Button onClick={exportData} data-testid="button-export-csv">
                  <Download className="mr-2 h-4 w-4" />
                  Export as CSV
                </Button>
                <Button variant="outline" data-testid="button-export-json">
                  <Download className="mr-2 h-4 w-4" />
                  Export as JSON
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upload History */}
        <Card>
          <CardHeader>
            <CardTitle>Historial de Cargas</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-4 text-muted-foreground">Loading...</div>
            ) : dataFiles?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No files uploaded yet. Upload your first data file above.
              </div>
            ) : (
              <div className="space-y-3">
                {dataFiles?.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-3 border border-border rounded-lg"
                    data-testid={`file-${file.id}`}
                  >
                    <div className="flex items-center space-x-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{file.filename}</p>
                        <p className="text-xs text-muted-foreground">
                          Uploaded {new Date(file.uploadedAt).toLocaleDateString()} • {file.recordCount} records
                        </p>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {(file.size / 1024).toFixed(1)} KB
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

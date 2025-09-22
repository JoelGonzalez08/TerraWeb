import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bluetooth, Download, Upload, Calculator } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function SensorControls() {
  const [isConnected, setIsConnected] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const connectBluetoothMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/sensors/connect", {});
    },
    onSuccess: () => {
      setIsConnected(true);
      toast({
        title: "Bluetooth Connected",
        description: "Successfully connected to environmental sensor.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/sensors"] });
    },
    onError: (error) => {
      toast({
        title: "Connection Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const extractDataMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/sensors/extract", {});
    },
    onSuccess: () => {
      toast({
        title: "Data Extracted",
        description: "Sensor data has been successfully extracted.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/measurements"] });
    },
    onError: (error) => {
      toast({
        title: "Extraction Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Device Connection</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-3 mb-4">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></div>
            <span className="text-sm text-foreground">
              {isConnected ? "Connected to Sensor #001" : "No device connected"}
            </span>
          </div>
          <Button
            className="w-full"
            onClick={() => connectBluetoothMutation.mutate()}
            disabled={connectBluetoothMutation.isPending || isConnected}
            data-testid="button-connect-bluetooth"
          >
            <Bluetooth className="mr-2 h-4 w-4" />
            {connectBluetoothMutation.isPending ? "Connecting..." : "Connect Bluetooth"}
          </Button>
        </CardContent>
      </Card>

      {/* Data Operations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Data Operations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => extractDataMutation.mutate()}
              disabled={extractDataMutation.isPending || !isConnected}
              data-testid="button-extract-data"
            >
              <Download className="mr-2 h-4 w-4" />
              {extractDataMutation.isPending ? "Extracting..." : "Extract Data"}
            </Button>
            <Button
              variant="outline"
              className="w-full"
              data-testid="button-upload-data"
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload Data
            </Button>
            <Button
              variant="outline"
              className="w-full"
              data-testid="button-calculate-averages"
            >
              <Calculator className="mr-2 h-4 w-4" />
              Calculate Averages
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

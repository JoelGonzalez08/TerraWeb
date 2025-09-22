import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Filter, Download } from "lucide-react";
import type { Measurement } from "@shared/schema";

export default function DataTable() {
  const [filter, setFilter] = useState<string>("");
  
  const { data: measurements, isLoading } = useQuery<Measurement[]>({
    queryKey: ["/api/measurements"],
  });

  const getStatusBadge = (value: number, type: string) => {
    let status = "good";
    let variant: "default" | "secondary" | "destructive" = "default";
    
    if (type === "CO2") {
      if (value > 1000) {
        status = "poor";
        variant = "destructive";
      } else if (value > 800) {
        status = "moderate";
        variant = "secondary";
      }
    }
    
    return <Badge variant={variant} className="text-xs">{status}</Badge>;
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const exportData = () => {
    if (!measurements) return;
    
    const csv = [
      "Timestamp,Location,CO2 (ppm),Temperature (°C),Humidity (%),Status",
      ...measurements.map(m => 
        `${formatTimestamp(m.timestamp.toString())},${m.latitude} ${m.longitude},${m.value},,,${m.status || 'good'}`
      )
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'terra-measurements.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Measurement Data</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Measurement Data</CardTitle>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" data-testid="button-filter">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
            <Button size="sm" onClick={exportData} data-testid="button-export">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {measurements?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No measurement data available. Connect a sensor to start collecting data.
                  </TableCell>
                </TableRow>
              ) : (
                measurements?.map((measurement) => (
                  <TableRow key={measurement.id} className="hover:bg-muted/50">
                    <TableCell className="text-sm" data-testid={`row-timestamp-${measurement.id}`}>
                      {formatTimestamp(measurement.timestamp.toString())}
                    </TableCell>
                    <TableCell className="text-sm" data-testid={`row-location-${measurement.id}`}>
                      {measurement.latitude.toFixed(4)}, {measurement.longitude.toFixed(4)}
                    </TableCell>
                    <TableCell className="text-sm font-medium" data-testid={`row-value-${measurement.id}`}>
                      {measurement.value}
                    </TableCell>
                    <TableCell className="text-sm" data-testid={`row-type-${measurement.id}`}>
                      {measurement.measurementType}
                    </TableCell>
                    <TableCell className="text-sm" data-testid={`row-unit-${measurement.id}`}>
                      {measurement.unit}
                    </TableCell>
                    <TableCell data-testid={`row-status-${measurement.id}`}>
                      {getStatusBadge(measurement.value, measurement.measurementType)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

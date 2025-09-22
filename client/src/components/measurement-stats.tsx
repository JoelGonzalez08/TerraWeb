import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Measurement } from "@shared/schema";

interface MeasurementStatsProps {
  isMobile?: boolean;
}

export default function MeasurementStats({ isMobile = false }: MeasurementStatsProps) {
  const { data: measurements, isLoading } = useQuery<Measurement[]>({
    queryKey: ["/api/measurements/recent"],
  });

  if (isLoading) {
    return (
      <div className={`grid ${isMobile ? 'grid-cols-3' : 'grid-cols-1'} gap-3`}>
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-3">
              <Skeleton className="h-6 w-16 mb-2" />
              <Skeleton className="h-4 w-12" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const getLatestMeasurement = (type: string) => {
    return measurements?.find(m => m.measurementType === type);
  };

  const co2 = getLatestMeasurement("CO2");
  const temperature = getLatestMeasurement("temperature");
  const humidity = getLatestMeasurement("humidity");

  if (isMobile) {
    return (
      <div className="grid grid-cols-3 gap-3 mb-6">
        <Card className="text-center">
          <CardContent className="p-3">
            <div className="text-lg font-bold text-primary" data-testid="stat-co2">
              {co2?.value || "--"}
            </div>
            <div className="text-xs text-muted-foreground">CO2 ppm</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="p-3">
            <div className="text-lg font-bold text-primary" data-testid="stat-temperature">
              {temperature?.value ? `${temperature.value}°` : "--"}
            </div>
            <div className="text-xs text-muted-foreground">Temperature</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="p-3">
            <div className="text-lg font-bold text-primary" data-testid="stat-humidity">
              {humidity?.value ? `${humidity.value}%` : "--"}
            </div>
            <div className="text-xs text-muted-foreground">Humidity</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Recent Measurements</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
            <span className="text-sm text-foreground">CO2 Level</span>
            <span className="font-semibold text-primary" data-testid="recent-co2">
              {co2?.value ? `${co2.value} ppm` : "-- ppm"}
            </span>
          </div>
          <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
            <span className="text-sm text-foreground">Temperature</span>
            <span className="font-semibold text-primary" data-testid="recent-temperature">
              {temperature?.value ? `${temperature.value}°C` : "--°C"}
            </span>
          </div>
          <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
            <span className="text-sm text-foreground">Humidity</span>
            <span className="font-semibold text-primary" data-testid="recent-humidity">
              {humidity?.value ? `${humidity.value}%` : "--%"}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

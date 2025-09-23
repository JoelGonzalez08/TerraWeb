// Tipos para la API de FastAPI (basados en tu esquema)
import { getAuthHeaders } from '@/hooks/use-auth';
import { FASTAPI_BASE_URL } from '@/config/constants';

export interface FastAPIRequest {
  geometry?: Record<string, any>;  // opcional
  lon: number;
  lat: number;
  width_m: number;
  height_m: number;
  start: string;  // formato: "YYYY-MM-DD"
  end: string;    // formato: "YYYY-MM-DD"
  mode: "heatmap" | "series";
  index: "rgb_composite" | "ndvi" | "ndwi" | "ndmi" | "evi" | "savi" | "gci";
  cloud_pct: number;  // 0-100
}

// Nueva interfaz para time-series (sin mode ni cloud_pct)
export interface TimeSeriesRequest {
  lon: number;
  lat: number;
  width_m: number;
  height_m: number;
  start: string;  // formato: "YYYY-MM-DD"
  end: string;    // formato: "YYYY-MM-DD"
  index: "ndvi" | "ndwi" | "ndmi" | "evi" | "savi" | "gci";
}

export interface SeriesData {
  date: string;
  value: number;
  // Propiedades adicionales que pueden venir de la API
  year?: number;
  month?: number;
  mean?: number;
  image_count?: number;
  min?: number | null;
  max?: number | null;
  std?: number | null;
  pixels?: number | null;
}

export interface FastAPIResponse {
  mode: string;
  index: string;
  roi: Record<string, any>;
  tileUrlTemplate: string;
  vis: Record<string, any>;
  series: SeriesData[];
  saved_files: Record<string, any>;
}

// Nueva interfaz para respuesta de time-series (basada en el formato real)
export interface TimeSeriesResponse {
  analysis_type: string;
  time_series: SeriesData[];
  summary: {
    total_points: number;
    period_mean: number;
    data_source: string;
  };
  // Propiedades de compatibilidad
  index?: string;
  data_points?: number;
  source?: string;
  series?: SeriesData[];
  average?: number;
}

export class FastAPIService {
  private baseUrl: string;

  constructor(baseUrl: string = FASTAPI_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  // Función para validar los parámetros antes de enviar
  private validateParams(params: FastAPIRequest): void {
    const errors: string[] = [];

    if (!params.lon || isNaN(params.lon)) {
      errors.push('Longitud debe ser un número válido');
    }
    if (!params.lat || isNaN(params.lat)) {
      errors.push('Latitud debe ser un número válido');
    }
    if (!params.width_m || params.width_m < 100 || params.width_m > 50000) {
      errors.push('width_m debe estar entre 100 y 50000 metros');
    }
    if (!params.height_m || params.height_m < 100 || params.height_m > 50000) {
      errors.push('height_m debe estar entre 100 y 50000 metros');
    }
    if (!params.start || !/^\d{4}-\d{2}-\d{2}$/.test(params.start)) {
      errors.push('start debe tener formato YYYY-MM-DD');
    }
    if (!params.end || !/^\d{4}-\d{2}-\d{2}$/.test(params.end)) {
      errors.push('end debe tener formato YYYY-MM-DD');
    }
    if (params.cloud_pct < 0 || params.cloud_pct > 100) {
      errors.push('cloud_pct debe estar entre 0 y 100');
    }

    // Validar fechas más específicamente
    if (params.start && params.end) {
      const startDate = new Date(params.start);
      const endDate = new Date(params.end);
      const now = new Date();

      if (endDate > now) {
        errors.push('La fecha de fin no puede ser futura');
      }
      if (startDate > now) {
        errors.push('La fecha de inicio no puede ser futura');
      }
      if (startDate >= endDate) {
        errors.push('La fecha de inicio debe ser anterior a la fecha de fin');
      }
      
      const daysDiff = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysDiff < 1) {
        errors.push('El rango de fechas debe ser de al menos 1 día');
      }
    }

    if (errors.length > 0) {
      throw new Error(`Errores de validación: ${errors.join(', ')}`);
    }
  }

  // Función de prueba simple para la conexión
  async testConnection(): Promise<boolean> {
    try {
      // Intentar conectar a /docs que debería estar disponible en FastAPI
      const response = await fetch(`${this.baseUrl}/docs`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response.ok;
    } catch (error) {
      console.error('Cannot connect to FastAPI:', error);
      return false;
    }
  }

  // Nuevo método para time-series
  async getTimeSeries(params: TimeSeriesRequest): Promise<TimeSeriesResponse> {
    try {
      // Convertir TimeSeriesRequest a FastAPIRequest con mode "series"
      const computeParams: FastAPIRequest = {
        lon: params.lon,
        lat: params.lat,
        width_m: params.width_m,
        height_m: params.height_m,
        start: params.start,
        end: params.end,
        mode: "series" as const,
        index: params.index,
        cloud_pct: 70 // Valor más permisivo para series temporales (era 30)
      };

      console.log('🚀 Sending time-series request to FastAPI:', {
        url: `${this.baseUrl}/compute`,
        method: 'POST',
        params: computeParams
      });
      
      console.log('� DEBUG - Service level date verification:');
      console.log(`  - Original params.start: "${params.start}"`);
      console.log(`  - Original params.end: "${params.end}"`);
      console.log(`  - computeParams.start: "${computeParams.start}"`);
      console.log(`  - computeParams.end: "${computeParams.end}"`);
      console.log(`  - Dates match original? start=${computeParams.start === params.start}, end=${computeParams.end === params.end}`);
      
      console.log('�📦 Time-series JSON payload:');
      console.log(JSON.stringify(computeParams, null, 2));

      const response = await fetch(`${this.baseUrl}/compute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(computeParams),
      });

      console.log('📡 Time-series response status:', response.status);
      
      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        
        try {
          const errorData = await response.json();
          console.error('❌ Time-series error response:', errorData);
          
          if (response.status === 422 && errorData.detail) {
            if (Array.isArray(errorData.detail)) {
              const validationErrors = errorData.detail.map((err: any) => 
                `Campo '${err.loc?.join('.')}': ${err.msg} (valor recibido: ${err.input})`
              ).join('; ');
              errorMessage = `Errores de validación: ${validationErrors}`;
            } else {
              errorMessage = `Error 422: ${JSON.stringify(errorData.detail)}`;
            }
          } else {
            errorMessage = `Error ${response.status}: ${JSON.stringify(errorData)}`;
          }
        } catch (parseError) {
          console.error('❌ Error parsing time-series response:', parseError);
          const textResponse = await response.text();
          console.error('Raw response:', textResponse);
          errorMessage = `Error ${response.status}: ${textResponse.slice(0, 200)}...`;
        }
        
        throw new Error(errorMessage);
      }

      const result = await response.json();
      
      // Transformar la respuesta al formato esperado
      let seriesData: SeriesData[] = [];
      
      // Intentar diferentes formatos de respuesta
      if (result.time_series && Array.isArray(result.time_series)) {
        seriesData = result.time_series;
      } else if (result.series && Array.isArray(result.series)) {
        seriesData = result.series;
      } else if (result.data && Array.isArray(result.data)) {
        seriesData = result.data;
      } else if (Array.isArray(result)) {
        seriesData = result;
      } else if (result.timeseries && Array.isArray(result.timeseries)) {
        seriesData = result.timeseries;
      } else {
        const keys = Object.keys(result);
        for (const key of keys) {
          if (key.match(/\d{4}-\d{2}/) && typeof result[key] === 'number') {
            seriesData.push({
              date: key,
              value: result[key]
            });
          }
          
          if (typeof result[key] === 'object' && result[key] !== null) {
            const nestedKeys = Object.keys(result[key]);
            for (const nestedKey of nestedKeys) {
              if (nestedKey.match(/\d{4}-\d{2}/) && typeof result[key][nestedKey] === 'number') {
                seriesData.push({
                  date: nestedKey,
                  value: result[key][nestedKey]
                });
              }
            }
          }
        }
      }

      // Ordenar por fecha si hay datos
      if (seriesData.length > 0) {
        seriesData.sort((a, b) => a.date.localeCompare(b.date));
        
        // Transformar el formato de datos para que funcione con la gráfica
        seriesData = seriesData.map(item => {
          if (item.value !== undefined) {
            return item;
          }
          
          if (item.mean !== undefined && item.mean !== null) {
            return {
              date: item.date,
              value: item.mean
            };
          }
          
          if (typeof item === 'object' && item.mean !== undefined) {
            return {
              ...item,
              value: item.mean
            };
          }
          
          return item;
        });
      }      const transformedResult: TimeSeriesResponse = {
        // Formato principal de la respuesta
        analysis_type: result.analysis_type || params.index,
        time_series: seriesData,
        summary: {
          total_points: result.summary?.total_points || seriesData.length,
          period_mean: result.summary?.period_mean || (seriesData.length > 0 ? seriesData.reduce((sum, item) => sum + (item.value || item.mean || 0), 0) / seriesData.length : 0),
          data_source: result.summary?.data_source || 'Sentinel-2 SR Harmonized'
        },
        // Propiedades de compatibilidad para el código existente
        index: result.analysis_type || params.index,
        data_points: seriesData.length,
        source: result.summary?.data_source || 'Sentinel-2 SR Harmonized',
        series: seriesData,
        average: result.summary?.period_mean || (seriesData.length > 0 ? seriesData.reduce((sum, item) => sum + (item.value || item.mean || 0), 0) / seriesData.length : 0)
      };
      
      console.log('📊 Final transformed result:', transformedResult);
      
      return transformedResult;
      
    } catch (error) {
      console.error('❌ Error in getTimeSeries:', error);
      throw error;
    }
  }

  async computeHeatmap(params: FastAPIRequest): Promise<FastAPIResponse> {
    try {
      // Validar parámetros antes de enviar
      this.validateParams(params);
      
      console.log('🚀 Sending request to FastAPI:', {
        url: `${this.baseUrl}/compute`,
        method: 'POST',
        params: params
      });
      
      console.log('📦 Exact JSON payload:');
      console.log(JSON.stringify(params, null, 2));

      const response = await fetch(`${this.baseUrl}/compute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        
        try {
          const errorData = await response.json();
          console.error('❌ Error response from FastAPI:', errorData);
          
          // Manejar errores específicos de Google Earth Engine
          if (errorData.detail && typeof errorData.detail === 'string') {
            if (errorData.detail.includes("Parameter 'image' is required") || 
                errorData.detail.includes("Collection contains no images")) {
              errorMessage = `No se encontraron imágenes satelitales para el rango de fechas seleccionado (${params.start} - ${params.end}). 
                             Sugerencias:
                             • Intenta con un rango de fechas más amplio
                             • Verifica que las fechas sean posteriores a 2015-06-23 (inicio de Sentinel-2)
                             • Algunas áreas pueden tener menos cobertura de imágenes disponibles`;
            } else if (errorData.detail.includes("date")) {
              errorMessage = `Error en las fechas: ${errorData.detail}. 
                             Las fechas deben estar en formato YYYY-MM-DD y la fecha inicial debe ser anterior a la final.`;
            } else {
              errorMessage = errorData.detail;
            }
          }
          // Extraer detalles específicos del error 422
          else if (response.status === 422 && errorData.detail) {
            if (Array.isArray(errorData.detail)) {
              const validationErrors = errorData.detail.map((err: any) => 
                `Campo '${err.loc?.join('.')}': ${err.msg} (valor recibido: ${err.input})`
              ).join('; ');
              errorMessage = `Errores de validación: ${validationErrors}`;
            } else {
              errorMessage = errorData.detail;
            }
          } else {
            errorMessage = errorData.detail || errorData.message || errorMessage;
          }
        } catch (parseError) {
          const textError = await response.text();
          console.error('❌ Error response (text):', textError);
          errorMessage = textError || errorMessage;
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('✅ Success response from FastAPI:', data);
      return data;
    } catch (error) {
      console.error('❌ Error calling FastAPI:', error);
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('No se puede conectar con la API de FastAPI. ¿Está ejecutándose en el puerto correcto?');
      }
      throw error;
    }
  }

  // Método para obtener solo la URL del tile
  async getTileUrl(params: FastAPIRequest): Promise<string> {
    const result = await this.computeHeatmap(params);
    return result.tileUrlTemplate;
  }
}

export const fastapiService = new FastAPIService(FASTAPI_BASE_URL);
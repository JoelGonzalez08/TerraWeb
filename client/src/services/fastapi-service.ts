// Tipos para la API de FastAPI (basados en tu esquema)
export interface FastAPIRequest {
  geometry?: Record<string, any>;  // opcional
  lon: number;
  lat: number;
  width_m: number;
  height_m: number;
  start: string;  // formato: "YYYY-MM-DD"
  end: string;    // formato: "YYYY-MM-DD"
  mode: "heatmap";
  index: "rgb_composite" | "ndvi" | "ndwi" | "ndmi" | "evi" | "savi" | "gci";
  cloud_pct: number;  // 0-100
}

export interface SeriesData {
  date: string;
  value: number;
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

export class FastAPIService {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:8000') {
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
      });
      return response.ok;
    } catch (error) {
      console.error('Cannot connect to FastAPI:', error);
      return false;
    }
  }
  // Método para enviar la solicitud de heatmap a FastAPI
  async computeHeatmap(params: FastAPIRequest): Promise<FastAPIResponse> {
    try {
      // Validar parámetros antes de enviar
      this.validateParams(params);
      
      console.log('🚀 Sending request to FastAPI:', {
        url: `${this.baseUrl}/compute`,
        method: 'POST',
        params: params
      });

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
          errorMessage = errorData.detail || errorData.message || errorMessage;
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

  // Método para obtener solo la serie temporal
  async getTimeSeries(params: FastAPIRequest): Promise<SeriesData[]> {
    const result = await this.computeHeatmap(params);
    return result.series;
  }

  // Método para obtener solo la URL del tile
  async getTileUrl(params: FastAPIRequest): Promise<string> {
    const result = await this.computeHeatmap(params);
    return result.tileUrlTemplate;
  }
}

export const fastapiService = new FastAPIService('http://localhost:8000');
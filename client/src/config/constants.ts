/**
 * Configuración centralizada de la aplicación
 * Cambiar FASTAPI_BASE_URL para despliegue
 */

// URL base de la API FastAPI
export const FASTAPI_BASE_URL = 'http://localhost:8000';

// Configuración para diferentes entornos
export const API_CONFIG = {
  // Para desarrollo local
  DEVELOPMENT: 'http://localhost:8000',
  
  // Para producción (cambiar por la URL real del servidor)
  PRODUCTION: 'https://your-production-api.com',
  
  // Para staging/testing (opcional)
  STAGING: 'https://staging-api.com'
};

// Variables de entorno (fallback a desarrollo si no está definida)
export const API_BASE_URL = import.meta.env.VITE_API_URL || FASTAPI_BASE_URL;

// Otras constantes de la aplicación
export const APP_CONFIG = {
  NAME: 'TerraSense',
  VERSION: '1.0.0',
  DEFAULT_COORDINATES: {
    lat: 15.7845002,
    lng: -92.7611756
  },
  DEFAULT_DIMENSIONS: {
    width: 1000,
    height: 1000
  }
};
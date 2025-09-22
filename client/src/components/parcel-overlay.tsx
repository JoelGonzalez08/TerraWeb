import { useEffect } from "react";
import L from "leaflet";

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

interface ParcelOverlayProps {
  map: L.Map | null;
  parcelData: ParcelData | null;
}

export default function ParcelOverlay({ map, parcelData }: ParcelOverlayProps) {
  useEffect(() => {
    if (!map || !parcelData || !map.getContainer()) return;

    try {
      // Crear el GeoJSON a partir de los datos de la parcela
      const geoJsonData: GeoJSON.Feature = {
        type: "Feature",
        properties: {
          area_hectares: parcelData.area_hectares,
          features_count: parcelData.features_count
        },
        geometry: parcelData.geometry as GeoJSON.Polygon
      };

    // Configurar el estilo del polígono - más visible sobre heatmaps
    const parcelStyle = {
      color: '#ff4444', // Rojo brillante para mayor contraste
      weight: 4, // Línea más gruesa
      opacity: 1,
      fillColor: 'transparent', // Sin relleno para ver el heatmap
      fillOpacity: 0, // Sin opacidad de relleno
      dashArray: '8, 4', // Línea punteada más visible
      lineCap: 'round' as const,
      lineJoin: 'round' as const,
      className: 'parcel-boundary' // Para aplicar estilos CSS adicionales
    };

    // Estilo para resaltar al hacer hover
    const highlightStyle = {
      color: '#ff0000',
      weight: 6,
      opacity: 1,
      fillOpacity: 0 // También sin relleno en hover
    };

    // Crear la capa GeoJSON
    const parcelLayer = L.geoJSON(geoJsonData, {
      style: parcelStyle,
      onEachFeature: (feature, layer) => {
        // Popup con información de la parcela
        const popupContent = `
          <div class="parcel-popup">
            <h4 style="margin: 0 0 8px 0; font-weight: 600; color: #647459;">📍 Parcela KML</h4>
            <p style="margin: 4px 0;"><strong>Área:</strong> ${parcelData.area_hectares.toFixed(2)} hectáreas</p>
            <p style="margin: 4px 0;"><strong>Polígonos:</strong> ${parcelData.features_count}</p>
            <p style="margin: 4px 0; font-size: 12px; color: #666;">Contorno importado desde archivo KML</p>
          </div>
        `;
        layer.bindPopup(popupContent);

        // Eventos de interacción para resaltar
        layer.on('mouseover', function() {
          if ('setStyle' in layer) {
            (layer as L.Path).setStyle(highlightStyle);
            (layer as L.Path).bringToFront();
          }
        });

        layer.on('mouseout', function() {
          if ('setStyle' in layer) {
            (layer as L.Path).setStyle(parcelStyle);
          }
        });

        // Hacer que siempre esté al frente
        if ('bringToFront' in layer) {
          (layer as L.Path).bringToFront();
        }
      }
    });

    // Agregar la capa al mapa con z-index alto
    parcelLayer.addTo(map);

    // Asegurar que la capa esté siempre al frente
    const bringToFront = () => {
      parcelLayer.eachLayer((layer) => {
        if ('bringToFront' in layer) {
          (layer as L.Path).bringToFront();
        }
      });
    };

    // Ejecutar inmediatamente y también después de un pequeño delay
    bringToFront();
    setTimeout(bringToFront, 100);

    // Listener para mantener la capa al frente cuando se agreguen nuevas capas
    map.on('layeradd', bringToFront);

    // Ajustar la vista del mapa para mostrar toda la parcela
    try {
      const bounds = L.latLngBounds([
        [parcelData.bounds.south, parcelData.bounds.west],
        [parcelData.bounds.north, parcelData.bounds.east]
      ]);
      
      // Expandir un poco los bounds para dar contexto
      const expandedBounds = bounds.pad(0.1);
      map.fitBounds(expandedBounds);
    } catch (error) {
      console.warn('Error ajustando bounds del mapa:', error);
    }

    // Función de cleanup para remover la capa cuando el componente se desmonte
    return () => {
      try {
        map.off('layeradd', bringToFront);
        map.removeLayer(parcelLayer);
      } catch (error) {
        console.warn('Error removiendo capa de parcela:', error);
      }
    };

    } catch (error) {
      console.warn('Error en ParcelOverlay:', error);
    }
  }, [map, parcelData]);

  return null; // Este componente no renderiza nada visible
}
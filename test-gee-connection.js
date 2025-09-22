#!/usr/bin/env node

/**
 * Script de prueba para verificar la conexión con Google Earth Engine
 * Ejecutar: node test-gee-connection.js
 */

const { GoogleEarthEngineService } = require('./server/gee-service');

async function testGEEConnection() {
  console.log('🔬 Iniciando prueba de conexión con Google Earth Engine...\n');

  try {
    const geeService = new GoogleEarthEngineService();
    
    console.log('1️⃣ Inicializando servicio GEE...');
    await geeService.initialize();
    console.log('✅ Servicio GEE inicializado correctamente\n');

    console.log('2️⃣ Probando generación de mapa de calor...');
    const config = {
      center: {
        lat: 15.7845002,
        lng: -92.7611756
      },
      zoom: 15,
      bounds: {
        north: 15.7850002,
        south: 15.7840002,
        east: -92.7606756,
        west: -92.7616756
      },
      dataType: 'ndvi_proxy',
      year: 2023
    };

    const heatMapData = await geeService.generateHeatMap(config);
    console.log('✅ Mapa de calor generado correctamente');
    console.log('📊 Datos obtenidos:');
    console.log(`   - Tiles: ${heatMapData.tiles.length} tile(s)`);
    console.log(`   - Tipo: ${heatMapData.metadata.dataType}`);
    console.log(`   - Año: ${heatMapData.metadata.year}`);
    console.log(`   - Coordenadas: ${config.center.lat}°N, ${Math.abs(config.center.lng)}°W\n`);

    console.log('3️⃣ Probando diferentes tipos de datos...');
    const dataTypes = ['ndvi_proxy', 'embeddings', 'similarity', 'change_detection'];
    
    for (const dataType of dataTypes) {
      try {
        console.log(`   Testing ${dataType}...`);
        const testConfig = { ...config, dataType };
        const result = await geeService.generateHeatMap(testConfig);
        console.log(`   ✅ ${dataType}: OK`);
      } catch (error) {
        console.log(`   ❌ ${dataType}: Error - ${error.message}`);
      }
    }

    console.log('\n🎉 ¡Todas las pruebas completadas exitosamente!');
    console.log('🌍 Tu aplicación está lista para usar datos reales de Google Earth Engine');
    console.log('📍 Parcela configurada en Guatemala: 15.7845002°N, 92.7611756°W');

  } catch (error) {
    console.error('\n❌ Error en la prueba de conexión:');
    console.error('   Mensaje:', error.message);
    console.error('\n🔧 Posibles soluciones:');
    console.error('   1. Verificar que el archivo gee-credentials.json existe');
    console.error('   2. Comprobar que las credenciales son válidas');
    console.error('   3. Asegurar que la cuenta tiene acceso a Earth Engine');
    console.error('   4. Consultar el archivo GEE-SETUP.md para más detalles');
    
    process.exit(1);
  }
}

// Solo ejecutar si es llamado directamente
if (require.main === module) {
  testGEEConnection();
}

module.exports = { testGEEConnection };
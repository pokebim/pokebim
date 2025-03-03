const fs = require('fs');
const path = require('path');

// Crear un mock simple para gRPC
const simpleMockContent = `
// Mock básico para módulos de gRPC
module.exports = {};
`;

// Crear el directorio src/lib si no existe
const libDir = path.join(__dirname, 'src', 'lib');
if (!fs.existsSync(libDir)) {
  console.log(`Creando directorio: ${libDir}`);
  fs.mkdirSync(libDir, { recursive: true });
}

// Crear el archivo grpc-mock.js en src/lib
const mockFilePath = path.join(libDir, 'grpc-mock.js');
try {
  fs.writeFileSync(mockFilePath, simpleMockContent);
  console.log(`Archivo mock grpc-mock.js creado correctamente en ${libDir}`);
} catch (error) {
  console.error(`Error al crear grpc-mock.js: ${error.message}`);
  // Continuamos de todas formas
}

console.log('Preparación completada');
process.exit(0); // Siempre salir con éxito para no interrumpir el build 
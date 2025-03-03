const fs = require('fs');
const path = require('path');

// Crear el mock para grpc-js
const grpcMockContent = `
module.exports = {
  // Mock para call-stream
  callStream: {},
  
  // Mock para call-credentials-filter
  callCredentialsFilter: {},
  
  // Otros mocks que podrían ser necesarios
  mockGrpc: true
};
`;

// Directorio de node_modules
const nodeModulesDir = path.join(__dirname, 'node_modules', '@grpc', 'grpc-js', 'build', 'src');

// Comprobar si existe el directorio
try {
  if (!fs.existsSync(nodeModulesDir)) {
    console.log(`Creando directorio: ${nodeModulesDir}`);
    fs.mkdirSync(nodeModulesDir, { recursive: true });
  }

  // Crear archivos mock
  fs.writeFileSync(path.join(nodeModulesDir, 'call-stream.js'), grpcMockContent);
  console.log('Archivo mock call-stream.js creado correctamente');

  fs.writeFileSync(path.join(nodeModulesDir, 'call-credentials-filter.js'), grpcMockContent);
  console.log('Archivo mock call-credentials-filter.js creado correctamente');

  console.log('Preparación completada con éxito');
} catch (error) {
  console.error('Error durante la preparación:', error);
  process.exit(1);
} 
const fs = require('fs');
const path = require('path');

// Contenido del mock más completo
const grpcMockContent = `
// Mock para módulos de gRPC que causan problemas en Vercel
module.exports = {
  callStream: {
    // Implementación simulada
    status: { code: 0, details: 'OK' },
    time: new Date(),
    fromObject: () => ({}),
    toObject: () => ({}),
  },
  
  callCredentialsFilter: {
    // Implementación simulada
    filterContext: () => ({}),
    generateMetadata: () => ({}),
  },
  
  // Funciones adicionales que pueden ser requeridas
  makeClientConstructor: () => function() {},
  makeClientStreamRequest: () => ({}),
  handleUnaryCall: () => ({}),
  handleServerStreamingCall: () => ({}),
  handleClientStreamingCall: () => ({}),
  handleBidiStreamingCall: () => ({}),
  
  // Para simular la inicialización de gRPC
  load: () => ({}),
  loadPackageDefinition: () => ({}),
  Server: class Server {
    constructor() {}
    addService() {}
    bind() {}
    start() {}
  },
  
  // Mock adicional para cualquier función que pueda ser llamada
  mockGrpc: true
};
`;

// Crear un archivo mock para un directorio específico
function createMockFile(directory, filename) {
  try {
    // Asegurarse de que el directorio existe
    if (!fs.existsSync(directory)) {
      console.log(`Creando directorio: ${directory}`);
      fs.mkdirSync(directory, { recursive: true });
    }
    
    // Crear el archivo mock
    const filePath = path.join(directory, filename);
    fs.writeFileSync(filePath, grpcMockContent);
    console.log(`Archivo mock ${filename} creado correctamente en ${directory}`);
    return true;
  } catch (error) {
    console.error(`Error al crear ${filename} en ${directory}:`, error);
    return false;
  }
}

// Lista de directorios y archivos a crear
const mockFiles = [
  // Para @grpc/grpc-js
  {
    dir: path.join(__dirname, 'node_modules', '@grpc', 'grpc-js', 'build', 'src'),
    files: ['call-stream.js', 'call-credentials-filter.js']
  },
  // Mock principal en src/lib
  {
    dir: path.join(__dirname, 'src', 'lib'),
    files: ['grpc-mock.js']
  }
];

// Crear todos los mocks
let success = true;
for (const { dir, files } of mockFiles) {
  for (const file of files) {
    if (!createMockFile(dir, file)) {
      success = false;
    }
  }
}

// Verificar el resultado
if (success) {
  console.log('Preparación completada con éxito');
  process.exit(0);
} else {
  console.error('Hubo errores durante la preparación');
  // Continuamos de todas formas, ya que algunos mocks pueden haberse creado correctamente
  process.exit(0);
} 
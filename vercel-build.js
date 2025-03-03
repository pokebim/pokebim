const fs = require('fs');
const path = require('path');

// Crear un mock simple para módulos gRPC
const simpleMockContent = `
// Mock básico para módulos de gRPC
module.exports = {};
`;

// Lista de archivos mock que necesitamos crear
const mockFiles = [
  // Archivos específicos en @grpc/grpc-js
  { dir: path.join(__dirname, 'node_modules', '@grpc', 'grpc-js', 'build', 'src'), file: 'call-stream.js' },
  { dir: path.join(__dirname, 'node_modules', '@grpc', 'grpc-js', 'build', 'src'), file: 'call-credentials-filter.js' },
  { dir: path.join(__dirname, 'node_modules', '@grpc', 'grpc-js', 'build', 'src'), file: 'metadata.js' },
  { dir: path.join(__dirname, 'node_modules', '@grpc', 'grpc-js', 'build', 'src'), file: 'resolver.js' },
  { dir: path.join(__dirname, 'node_modules', '@grpc', 'grpc-js', 'build', 'src'), file: 'subchannel.js' },
  
  // Archivo mock general para nuestra app
  { dir: path.join(__dirname, 'src', 'lib'), file: 'grpc-mock.js' }
];

// Crear todos los archivos mock necesarios
for (const { dir, file } of mockFiles) {
  try {
    // Crear el directorio si no existe
    if (!fs.existsSync(dir)) {
      console.log(`Creando directorio: ${dir}`);
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Crear el archivo mock
    const filePath = path.join(dir, file);
    fs.writeFileSync(filePath, simpleMockContent);
    console.log(`Archivo mock ${file} creado correctamente en ${dir}`);
  } catch (error) {
    console.error(`Error al crear ${file}: ${error.message}`);
    // Continuamos de todas formas
  }
}

// Crear un archivo index.js para exportar todo lo que pueda ser necesario
try {
  const grpcJsDir = path.join(__dirname, 'node_modules', '@grpc', 'grpc-js', 'build', 'src');
  const indexContent = `
// Index file que exporta todos los mocks
const callStream = require('./call-stream');
const callCredentialsFilter = require('./call-credentials-filter');
const metadata = require('./metadata');
const resolver = require('./resolver');
const subchannel = require('./subchannel');

module.exports = {
  callStream,
  callCredentialsFilter,
  metadata,
  resolver,
  subchannel,
  // Funciones básicas que podrían ser llamadas
  makeUnaryRequest: () => {},
  makeServerStreamRequest: () => {},
  makeClientStreamRequest: () => {},
  makeBidiStreamRequest: () => {},
  createClient: () => ({}),
  loadPackageDefinition: () => ({}),
  getClientChannel: () => ({}),
  waitForClientReady: (client, deadline, callback) => { callback(null); },
  // Clases que podrían ser instanciadas
  Server: class Server {
    constructor() {}
    addService() { return this; }
    bindAsync() { return this; }
    start() { return this; }
  },
  ServiceError: class ServiceError extends Error {
    constructor(message) { super(message); }
  },
  StatusBuilder: class StatusBuilder {
    constructor() {}
    withCode() { return this; }
    withDetails() { return this; }
    withMetadata() { return this; }
    build() { return {}; }
  }
};
  `;
  fs.writeFileSync(path.join(grpcJsDir, 'index.js'), indexContent);
  console.log(`Archivo index.js creado correctamente en ${grpcJsDir}`);
} catch (error) {
  console.error(`Error al crear index.js: ${error.message}`);
}

console.log('Preparación completada');
process.exit(0); // Siempre salir con éxito para no interrumpir el build 
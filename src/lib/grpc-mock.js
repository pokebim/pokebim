// Mock para módulos de gRPC que causan problemas en Vercel
module.exports = {
  // Mock para call-stream
  callStream: {},
  
  // Mock para call-credentials-filter
  callCredentialsFilter: {},
  
  // Otros mocks que podrían ser necesarios
  mockGrpc: true
}; 
// Este archivo actúa como una capa intermedia para Firebase
// Permite que las importaciones funcionen tanto en el cliente como en el servidor

// Importaciones básicas de Firebase sin importar @grpc/grpc-js
const firebase = {
  // Funciones básicas de autenticación
  auth: {
    signInWithEmailAndPassword: async () => ({ user: { uid: 'mock-uid' } }),
    signOut: async () => {},
    onAuthStateChanged: () => () => {}
  },
  
  // Funciones básicas de Firestore
  firestore: {
    collection: () => ({
      doc: () => ({
        set: async () => {},
        update: async () => {},
        delete: async () => {},
        get: async () => ({ exists: true, data: () => ({}) })
      }),
      add: async () => ({ id: 'mock-id' }),
      get: async () => ({ docs: [], empty: true }),
      where: () => ({}),
      orderBy: () => ({}),
      limit: () => ({})
    })
  },
  
  // Funciones básicas de Storage
  storage: {
    ref: () => ({
      put: async () => ({ ref: { getDownloadURL: async () => 'https://example.com/image.jpg' } }),
      getDownloadURL: async () => 'https://example.com/image.jpg',
      delete: async () => {}
    })
  }
};

// Exportar como módulo
module.exports = firebase; 
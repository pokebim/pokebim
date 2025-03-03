// Este archivo actúa como wrapper para firebase-admin
// Solo se usa en el lado del servidor (API routes)

// Objeto mock para entornos donde firebase-admin no está disponible
const mockFirebaseAdmin = {
  apps: [],
  initializeApp: () => ({ 
    firestore: () => mockFirestore,
    auth: () => mockAuth,
    storage: () => mockStorage
  }),
  credential: {
    cert: () => ({})
  },
  firestore: () => mockFirestore,
  auth: () => mockAuth,
  storage: () => mockStorage
};

// Mock de Firestore
const mockFirestore = {
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
  }),
  batch: () => ({
    set: () => {},
    update: () => {},
    delete: () => {},
    commit: async () => {}
  }),
  runTransaction: async (callback) => await callback({
    get: async () => ({ exists: true, data: () => ({}) }),
    set: () => {},
    update: () => {},
    delete: () => {}
  })
};

// Mock de Auth
const mockAuth = {
  verifyIdToken: async () => ({ uid: 'mock-uid' }),
  getUser: async () => ({ uid: 'mock-uid', email: 'user@example.com' }),
  createUser: async () => ({ uid: 'new-mock-uid' }),
  updateUser: async () => ({ uid: 'mock-uid' }),
  deleteUser: async () => {}
};

// Mock de Storage
const mockStorage = {
  bucket: () => ({
    file: () => ({
      save: async () => {},
      delete: async () => {},
      getSignedUrl: async () => ['https://example.com/signed-url']
    }),
    getFiles: async () => [[{ name: 'file1.jpg' }]]
  })
};

// Detectar si estamos en el cliente o en el servidor
const isClient = typeof window !== 'undefined';

// Exportar el mock en el cliente, o el módulo real en el servidor
module.exports = isClient ? mockFirebaseAdmin : (() => {
  try {
    return require('firebase-admin');
  } catch (e) {
    console.warn('firebase-admin no disponible, usando mock');
    return mockFirebaseAdmin;
  }
})(); 
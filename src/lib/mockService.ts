'use client';

// Este archivo proporciona datos simulados y mocks para todos los servicios
// cuando Firebase no está disponible

// Datos de ejemplo para el modo simulado
export const mockData = {
  suppliers: [
    {
      id: "mock1",
      name: "Proveedor de prueba 1",
      country: "España",
      city: "Madrid",
      url: "https://example.com",
      notes: "Proveedor ficticio para demostración",
      verified: true,
      isFavorite: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: "mock2",
      name: "Proveedor de prueba 2",
      country: "China",
      city: "Shenzhen",
      url: "https://example2.com",
      notes: "Otro proveedor ficticio para demostración",
      verified: false,
      isFavorite: false,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ],
  clients: [
    {
      id: "mock1",
      name: "Cliente de prueba 1",
      email: "cliente1@ejemplo.com",
      phone: "123456789",
      notes: "Cliente ficticio para demostración",
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ],
  products: [],
  tasks: [],
  materials: [],
  inventory: [],
  expenses: [],
  missingProducts: []
};

// Funciones de Firestore simuladas
export const firestoreMocks = {
  // Función collection simulada
  collection: (db: any, collectionName: string) => {
    // Ignoramos db porque sabemos que es null
    // Retornamos un objeto que simula una colección
    return {
      collectionName,
      // Datos almacenados localmente
      data: mockData[collectionName] || [],
    };
  },
  
  // Función doc simulada
  doc: (db: any, collectionName: string, docId: string) => {
    // Ignoramos db porque sabemos que es null
    // Buscamos el documento con ese ID
    const data = mockData[collectionName]?.find(item => item.id === docId);
    return {
      id: docId,
      data,
      collectionName
    };
  },
  
  // Función query simulada
  query: (collectionRef: any, ...args: any[]) => {
    // Solo devolvemos la referencia a la colección
    return collectionRef;
  },
  
  // Función getDocs simulada
  getDocs: async (query: any) => {
    // Suponemos que query es una colección o una consulta sobre una colección
    return {
      empty: !query.data || query.data.length === 0,
      size: query.data ? query.data.length : 0,
      docs: (query.data || []).map((item: any) => ({
        id: item.id,
        data: () => ({ ...item }),
        exists: () => true
      }))
    };
  },
  
  // Función getDoc simulada
  getDoc: async (docRef: any) => {
    const data = docRef.data;
    return {
      exists: () => !!data,
      data: () => data ? { ...data } : null,
      id: docRef.id
    };
  },
  
  // Función addDoc simulada
  addDoc: async (collectionRef: any, data: any) => {
    const newId = `mock-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newDoc = { ...data, id: newId };
    
    // Añadimos el documento a nuestros datos locales
    if (!mockData[collectionRef.collectionName]) {
      mockData[collectionRef.collectionName] = [];
    }
    mockData[collectionRef.collectionName].push(newDoc);
    
    return { id: newId };
  },
  
  // Función updateDoc simulada
  updateDoc: async (docRef: any, updateData: any) => {
    if (!mockData[docRef.collectionName]) return;
    
    const index = mockData[docRef.collectionName].findIndex(item => item.id === docRef.id);
    if (index !== -1) {
      mockData[docRef.collectionName][index] = {
        ...mockData[docRef.collectionName][index],
        ...updateData,
        updatedAt: new Date()
      };
    }
    return;
  },
  
  // Función deleteDoc simulada
  deleteDoc: async (docRef: any) => {
    if (!mockData[docRef.collectionName]) return;
    
    const index = mockData[docRef.collectionName].findIndex(item => item.id === docRef.id);
    if (index !== -1) {
      mockData[docRef.collectionName].splice(index, 1);
    }
    return;
  },
  
  // Funciones de consulta
  where: () => ({}),
  orderBy: () => ({}),
  limit: () => ({}),
  startAfter: () => ({}),
  
  // Otras funciones útiles
  serverTimestamp: () => new Date()
};

// Mock de una colección - reemplaza la función collection() de Firebase
export function mockCollection(data: any[] = []) {
  return {
    data,
    // Simula la funcionalidad de query
    query: (...conditions: any[]) => {
      return {
        data,
        // Simula la funcionalidad de getDocs
        getDocs: async () => {
          return {
            empty: data.length === 0,
            docs: data.map(item => ({
              id: item.id,
              data: () => item,
              exists: () => true
            }))
          };
        }
      };
    },
    // Simula la funcionalidad de addDoc
    addDoc: async (newData: any) => {
      const id = `mock-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const withId = { ...newData, id };
      data.push(withId);
      return { id };
    }
  };
}

// Mock de un documento - reemplaza la función doc() de Firebase
export function mockDoc(docId: string, data: Record<string, any> | null = null) {
  return {
    id: docId,
    // Simula la funcionalidad de getDoc
    getDoc: async () => {
      return {
        exists: () => !!data,
        data: () => data,
        id: docId
      };
    },
    // Simula la funcionalidad de updateDoc
    updateDoc: async (updateData: Record<string, any>) => {
      if (data) {
        Object.assign(data, updateData);
      }
      return;
    },
    // Simula la funcionalidad de deleteDoc
    deleteDoc: async () => {
      // Esta es una simulación, no elimina realmente ningún dato
      return;
    }
  };
}

// Simula funciones de Firestore
export const FirestoreMock = {
  // Colecciones de datos simulados
  collections: {
    clients: [],
    suppliers: [],
    products: [],
    inventory: [],
    materials: [],
    photos: [],
    photoAlbums: [],
    wiki: [],
    links: [],
    linkGroups: [],
    missingProducts: [],
    tasks: [],
    movements: [],
    expenses: []
  },
  
  // Obtener una colección
  collection: (name: string) => {
    if (!FirestoreMock.collections[name]) {
      FirestoreMock.collections[name] = [];
    }
    return mockCollection(FirestoreMock.collections[name]);
  },
  
  // Obtener un documento
  doc: (collectionName: string, docId: string) => {
    const collection = FirestoreMock.collections[collectionName] || [];
    const doc = collection.find(item => item.id === docId) || null;
    return mockDoc(docId, doc);
  },
  
  // Funciones de consulta
  query: (collection: any, ...conditions: any[]) => {
    // Simplemente devolvemos la colección por ahora
    return collection;
  },
  
  where: (field: string, operator: string, value: any) => {
    // Esta es solo una representación del "where", no hace nada en realidad
    return { field, operator, value, type: 'where' };
  },
  
  orderBy: (field: string, direction: 'asc' | 'desc' = 'asc') => {
    // Esta es solo una representación del "orderBy", no hace nada en realidad
    return { field, direction, type: 'orderBy' };
  },
  
  limit: (n: number) => {
    // Esta es solo una representación del "limit", no hace nada en realidad
    return { limit: n, type: 'limit' };
  },
  
  startAfter: (doc: any) => {
    // Esta es solo una representación del "startAfter", no hace nada en realidad
    return { doc, type: 'startAfter' };
  },
  
  serverTimestamp: () => {
    return new Date();
  }
};

// Exportar funciones simuladas de Firestore
export const firestoreMocks = {
  collection: FirestoreMock.collection,
  doc: FirestoreMock.doc,
  query: FirestoreMock.query,
  where: FirestoreMock.where,
  orderBy: FirestoreMock.orderBy,
  limit: FirestoreMock.limit,
  startAfter: FirestoreMock.startAfter,
  serverTimestamp: FirestoreMock.serverTimestamp,
  getDocs: async (query: any) => {
    return {
      empty: query.data.length === 0,
      docs: query.data.map((item: any) => ({
        id: item.id,
        data: () => item,
        exists: () => true
      }))
    };
  },
  getDoc: async (docRef: any) => {
    return await docRef.getDoc();
  },
  addDoc: async (collectionRef: any, newData: any) => {
    return await collectionRef.addDoc(newData);
  },
  updateDoc: async (docRef: any, updateData: any) => {
    return await docRef.updateDoc(updateData);
  },
  deleteDoc: async (docRef: any) => {
    return await docRef.deleteDoc();
  }
}; 
import { 
  collection, 
  addDoc, 
  getDocs, 
  getDoc,
  doc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  orderBy
} from "firebase/firestore/lite";
import { db, isFirebaseAvailable } from "./firebase";

// Mock data para modo sin conexión
const mockClients = [
  {
    id: "mock1",
    name: "Cliente de ejemplo 1",
    email: "cliente1@ejemplo.com",
    phone: "123456789",
    platform: "General",
    address: "Calle Ejemplo 123",
    city: "Madrid",
    postalCode: "28001",
    notes: "Cliente de demostración",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "mock2",
    name: "Cliente de ejemplo 2",
    email: "cliente2@ejemplo.com",
    phone: "987654321",
    platform: "General",
    address: "Avenida Muestra 456",
    city: "Barcelona",
    postalCode: "08001",
    notes: "Otro cliente de demostración",
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Interfaz para el cliente
export interface Client {
  id?: string;
  name: string;
  email?: string;
  phone?: string;
  platform?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  notes?: string;
  createdAt?: any;
  updatedAt?: any;
}

// Obtener todos los clientes
export async function getAllClients(): Promise<Client[]> {
  // Modo sin conexión
  if (!isFirebaseAvailable) {
    console.log("Firebase no disponible, usando datos de muestra");
    return mockClients;
  }
  
  try {
    const clientsCollection = collection(db, "clients");
    const q = query(clientsCollection, orderBy("name", "asc"));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return [];
    }
    
    return querySnapshot.docs.map(doc => {
      return {
        id: doc.id,
        ...doc.data()
      } as Client;
    });
  } catch (error) {
    console.error("Error al obtener clientes:", error);
    return mockClients; // Fallback a los datos de prueba
  }
}

// Obtener un cliente por ID
export async function getClientById(id: string): Promise<Client | null> {
  // Modo sin conexión
  if (!isFirebaseAvailable) {
    const mockClient = mockClients.find(client => client.id === id);
    return mockClient || null;
  }
  
  try {
    const clientDoc = doc(db, "clients", id);
    const clientSnapshot = await getDoc(clientDoc);
    
    if (!clientSnapshot.exists()) {
      return null;
    }
    
    return {
      id: clientSnapshot.id,
      ...clientSnapshot.data()
    } as Client;
  } catch (error) {
    console.error("Error al obtener cliente por ID:", error);
    return null;
  }
}

// Añadir un nuevo cliente
export async function addClient(clientData: Client): Promise<string> {
  // Modo sin conexión
  if (!isFirebaseAvailable) {
    const newId = `mock${mockClients.length + 1}`;
    const newClient = {
      id: newId,
      ...clientData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    mockClients.push(newClient);
    return newId;
  }
  
  try {
    const clientsCollection = collection(db, "clients");
    const now = new Date();
    const newClient = {
      ...clientData,
      createdAt: now,
      updatedAt: now
    };
    
    const docRef = await addDoc(clientsCollection, newClient);
    return docRef.id;
  } catch (error) {
    console.error("Error al añadir cliente:", error);
    throw error;
  }
}

// Actualizar un cliente existente
export async function updateClient(id: string, clientData: Partial<Client>): Promise<void> {
  // Modo sin conexión
  if (!isFirebaseAvailable) {
    const clientIndex = mockClients.findIndex(client => client.id === id);
    if (clientIndex !== -1) {
      mockClients[clientIndex] = {
        ...mockClients[clientIndex],
        ...clientData,
        updatedAt: new Date()
      };
    }
    return;
  }
  
  try {
    const clientDoc = doc(db, "clients", id);
    const now = new Date();
    await updateDoc(clientDoc, {
      ...clientData,
      updatedAt: now
    });
  } catch (error) {
    console.error("Error al actualizar cliente:", error);
    throw error;
  }
}

// Eliminar un cliente
export async function deleteClient(id: string): Promise<void> {
  // Modo sin conexión
  if (!isFirebaseAvailable) {
    const clientIndex = mockClients.findIndex(client => client.id === id);
    if (clientIndex !== -1) {
      mockClients.splice(clientIndex, 1);
    }
    return;
  }
  
  try {
    const clientDoc = doc(db, "clients", id);
    await deleteDoc(clientDoc);
  } catch (error) {
    console.error("Error al eliminar cliente:", error);
    throw error;
  }
} 
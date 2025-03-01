'use client';

// Implementación completamente aislada de Firebase para Next.js
import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";

// Variables para almacenar las instancias singleton
let firebaseApp: FirebaseApp | undefined;
let firestoreInstance: Firestore | undefined;

// Detectar si estamos en el cliente
const isClient = typeof window !== 'undefined';

// Función segura para inicializar Firebase solo en el cliente
export function getFirebaseApp() {
  // No inicializar Firebase en el servidor bajo ninguna circunstancia
  if (!isClient) {
    console.warn('Intentando acceder a Firebase en el servidor - operación cancelada');
    return undefined;
  }

  try {
    // Devolver la instancia existente si ya se inicializó
    if (firebaseApp) {
      return firebaseApp;
    }

    // Configuración de Firebase
    const firebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
    };

    // Verificar que todos los valores necesarios estén disponibles
    const requiredConfig = ['apiKey', 'authDomain', 'projectId'];
    for (const key of requiredConfig) {
      if (!firebaseConfig[key]) {
        console.error(`Firebase: Falta configuración para ${key}`);
        return undefined;
      }
    }

    // Crear una nueva instancia o usar la existente
    if (!getApps().length) {
      firebaseApp = initializeApp(firebaseConfig);
      console.log('Firebase: App inicializada correctamente');
    } else {
      firebaseApp = getApps()[0];
      console.log('Firebase: App existente recuperada');
    }

    return firebaseApp;
  } catch (error) {
    console.error('Error al inicializar Firebase App:', error);
    return undefined;
  }
}

// Obtener instancia de Firestore de forma segura
export function getFirestoreDb() {
  // No inicializar Firestore en el servidor
  if (!isClient) {
    console.warn('Intentando acceder a Firestore en el servidor - operación cancelada');
    return undefined;
  }

  try {
    // Devolver la instancia existente si ya se inicializó
    if (firestoreInstance) {
      return firestoreInstance;
    }

    // Obtener la app e inicializar Firestore
    const app = getFirebaseApp();
    if (!app) {
      console.warn('No se pudo obtener la app de Firebase para inicializar Firestore');
      return undefined;
    }

    firestoreInstance = getFirestore(app);
    console.log('Firestore: Inicializado correctamente');
    return firestoreInstance;
  } catch (error) {
    console.error('Error al inicializar Firestore:', error);
    return undefined;
  }
}

// No exportar instancias por defecto para evitar inicialización en tiempo de importación
// En su lugar, exportamos solo las funciones de acceso que verifican el entorno

// IMPORTANTE: No usar export default para evitar que se inicialice automáticamente 
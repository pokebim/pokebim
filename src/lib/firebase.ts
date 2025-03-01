'use client';

// Import the functions you need from the SDKs you need
import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";

// Función para obtener Firebase App
let firebaseApp: FirebaseApp | undefined;
let firestoreInstance: Firestore | undefined;

// Inicialización lazy de Firebase
export function getFirebaseApp() {
  if (typeof window === 'undefined') {
    // No inicializar Firebase en el servidor
    return undefined;
  }

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

  // Verificar si ya hay apps inicializadas
  if (!getApps().length) {
    firebaseApp = initializeApp(firebaseConfig);
  } else {
    firebaseApp = getApps()[0];
  }

  return firebaseApp;
}

// Obtener instancia de Firestore
export function getFirestoreDb() {
  if (typeof window === 'undefined') {
    // No inicializar Firestore en el servidor
    return undefined;
  }

  if (firestoreInstance) {
    return firestoreInstance;
  }

  const app = getFirebaseApp();
  if (!app) {
    return undefined;
  }

  firestoreInstance = getFirestore(app);
  return firestoreInstance;
}

// Para compatibilidad con el código existente
export const db = typeof window !== 'undefined' ? getFirestoreDb() : undefined;

export default getFirebaseApp(); 
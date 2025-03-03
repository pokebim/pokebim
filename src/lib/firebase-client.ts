// Este archivo solo importa lo necesario para el cliente
import { initializeApp, getApp, getApps } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  getDoc, 
  doc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter, 
  DocumentData 
} from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// Configuración del Firebase (sin importar módulos del servidor)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Inicializar Firebase solo una vez
function initializeFirebaseClient() {
  if (!getApps().length) {
    return initializeApp(firebaseConfig);
  }
  return getApp();
}

// Inicializar
const app = initializeFirebaseClient();

// Exportar funciones específicas del cliente
export const clientFirestore = getFirestore(app);
export const clientAuth = getAuth(app);
export const clientStorage = getStorage(app);

// Exportar también las funciones y tipos de Firestore para uso en cliente
export {
  collection,
  getDocs,
  getDoc,
  doc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  DocumentData,
  signInWithEmailAndPassword,
  signOut,
  ref,
  uploadBytes,
  getDownloadURL,
}; 
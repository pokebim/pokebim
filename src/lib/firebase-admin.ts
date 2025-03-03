// Este archivo debe usarse solo en funciones serverless o rutas API
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';

// Solo inicializar la app si no existe ya
function initializeFirebaseAdmin() {
  if (getApps().length === 0) {
    const serviceAccount = JSON.parse(
      process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}'
    );
    
    initializeApp({
      credential: cert(serviceAccount),
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
  }
  
  return {
    db: getFirestore(),
    auth: getAuth(),
    storage: getStorage()
  };
}

// Exportar funciones para usar en API routes
export function getServerFirestore() {
  const { db } = initializeFirebaseAdmin();
  return db;
}

export function getServerAuth() {
  const { auth } = initializeFirebaseAdmin();
  return auth;
}

export function getServerStorage() {
  const { storage } = initializeFirebaseAdmin();
  return storage;
}

export default initializeFirebaseAdmin; 
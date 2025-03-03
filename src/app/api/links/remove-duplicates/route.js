import { NextResponse } from 'next/server';
import { initializeApp } from "firebase/app";
import { getFirestore, collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore/lite';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Configurar las opciones de la ruta para que sea compatible con Node.js Runtime
function initializeFirebaseForApi() {
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

  // Inicializar Firebase si aún no está inicializado
  try {
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    return db;
  } catch (error) {
    console.error("Error al inicializar Firebase:", error);
    throw error;
  }
}

export async function GET(request) {
  try {
    const db = initializeFirebaseForApi();
    const linksRef = collection(db, 'links');
    
    // Obtener todos los links
    const allLinks = await getDocs(linksRef);
    
    // Mapear URLs a IDs
    const urlMap = new Map();
    const duplicates = [];
    
    allLinks.forEach(doc => {
      const linkData = doc.data();
      const url = linkData.url?.toLowerCase();
      
      if (!url) return; // Ignorar enlaces sin URL
      
      if (urlMap.has(url)) {
        // Si ya existe, es un duplicado
        duplicates.push({
          id: doc.id,
          url: linkData.url,
          title: linkData.title,
          duplicate_of: urlMap.get(url).id
        });
      } else {
        // Si no existe, añadirlo al mapa
        urlMap.set(url, {
          id: doc.id,
          title: linkData.title
        });
      }
    });
    
    // Eliminar duplicados
    let deletedCount = 0;
    
    for (const duplicate of duplicates) {
      try {
        await deleteDoc(doc(db, 'links', duplicate.id));
        deletedCount++;
      } catch (error) {
        console.error(`Error al eliminar duplicado ${duplicate.id}:`, error);
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `Se encontraron ${duplicates.length} duplicados y se eliminaron ${deletedCount}.`,
      duplicates
    });
    
  } catch (error) {
    console.error("Error al eliminar duplicados:", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
} 
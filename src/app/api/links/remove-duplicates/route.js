import { NextResponse } from 'next/server';
import { initializeApp } from "firebase/app";
import { getFirestore, collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';

// Configurar las opciones de la ruta para que sea compatible con Node.js Runtime
export const runtime = 'nodejs';

// Timeout aumentado para operaciones de Firebase que pueden tardar
export const fetchCache = 'force-no-store';
export const revalidate = 0;

// Función segura para inicializar Firebase específicamente para esta API
function initializeFirebaseForApi() {
  try {
    // Verificar que las variables de entorno necesarias estén configuradas
    const requiredEnvVars = [
      'NEXT_PUBLIC_FIREBASE_API_KEY',
      'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
      'NEXT_PUBLIC_FIREBASE_PROJECT_ID'
    ];
    
    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        console.error(`Variable de entorno requerida no configurada: ${envVar}`);
        return null;
      }
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

    // Crear un nombre único para la aplicación para evitar problemas con múltiples instancias
    const uniqueAppName = `remove-duplicates-api-${Date.now()}`;
    
    // Inicializar la app con el nombre único
    const app = initializeApp(firebaseConfig, uniqueAppName);
    console.log(`Firebase inicializado para API con nombre: ${uniqueAppName}`);
    
    // Devolver la instancia de Firestore
    return getFirestore(app);
  } catch (error) {
    console.error('Error al inicializar Firebase para API:', error);
    return null;
  }
}

export async function GET(request) {
  try {
    // Inicializar Firebase específicamente para esta API
    const db = initializeFirebaseForApi();
    
    if (!db) {
      return NextResponse.json({ 
        success: false, 
        error: 'No se pudo inicializar Firebase' 
      }, { status: 500 });
    }
    
    // Obtener el groupId de los parámetros de consulta
    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get('groupId');

    if (!groupId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Se requiere un ID de grupo' 
      }, { status: 400 });
    }

    console.log(`Buscando duplicados en el grupo: ${groupId}`);

    // Obtener todos los enlaces del grupo
    const linksRef = collection(db, 'links');
    const q = query(linksRef, where('groupId', '==', groupId));
    const linksSnapshot = await getDocs(q);

    if (linksSnapshot.empty) {
      return NextResponse.json({ 
        success: true, 
        message: 'No hay enlaces en este grupo' 
      });
    }

    // Mapa para seguir enlaces por URL normalizada (sin http/https y www)
    const linksByUrl = new Map();
    const duplicates = [];

    // Identificar duplicados
    linksSnapshot.forEach((linkDoc) => {
      const link = { id: linkDoc.id, ...linkDoc.data() };
      
      if (!link.url) {
        console.warn(`Enlace sin URL encontrado con ID: ${link.id}`);
        return; // Continuar con el siguiente enlace
      }
      
      // Normalizar URL para comparación (eliminar http://, https://, www.)
      let normalizedUrl = link.url.toLowerCase()
        .replace(/^https?:\/\//, '')
        .replace(/^www\./, '')
        .replace(/\/$/, ''); // Eliminar trailing slash
      
      if (linksByUrl.has(normalizedUrl)) {
        // Es un duplicado
        duplicates.push(link);
      } else {
        // Es el primer enlace con esta URL
        linksByUrl.set(normalizedUrl, link);
      }
    });

    console.log(`Se encontraron ${duplicates.length} enlaces duplicados`);

    if (duplicates.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'No se encontraron enlaces duplicados' 
      });
    }

    // Eliminar los duplicados
    const deletePromises = duplicates.map(link => 
      deleteDoc(doc(db, 'links', link.id))
    );

    await Promise.all(deletePromises);

    return NextResponse.json({ 
      success: true, 
      message: `Se eliminaron ${duplicates.length} enlaces duplicados` 
    });

  } catch (error) {
    console.error('Error al eliminar duplicados:', error);
    
    return NextResponse.json({ 
      success: false, 
      error: 'Error al eliminar enlaces duplicados: ' + (error?.message || 'Error desconocido')
    }, { status: 500 });
  }
} 
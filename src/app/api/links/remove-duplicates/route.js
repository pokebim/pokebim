import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';

// Configurar las opciones de la ruta para que sea compatible con Node.js Runtime
export const runtime = 'nodejs';

export async function GET(request) {
  try {
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
      error: 'Error al eliminar enlaces duplicados: ' + error.message 
    }, { status: 500 });
  }
} 
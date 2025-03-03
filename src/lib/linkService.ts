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
  orderBy, 
  serverTimestamp
} from "firebase/firestore/lite";
import { db } from "./firebase";

// Interfaz para los grupos de enlaces
export interface LinkGroup {
  id?: string;
  name: string;
  description?: string;
  icon?: string;
  order: number;
  createdAt?: any;
  updatedAt?: any;
}

// Interfaz para los enlaces individuales
export interface Link {
  id?: string;
  groupId: string;
  title: string;
  url: string;
  description?: string;
  icon?: string;
  order: number;
  clicks?: number;
  active: boolean;
  createdAt?: any;
  updatedAt?: any;
}

/**
 * Obtiene todos los grupos de enlaces ordenados por el campo 'order'
 */
export async function getAllLinkGroups(): Promise<LinkGroup[]> {
  try {
    const groupsCollection = collection(db, "link_groups");
    const q = query(groupsCollection, orderBy("order", "asc"));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => {
      return { 
        id: doc.id, 
        ...doc.data() as Omit<LinkGroup, 'id'> 
      };
    });
  } catch (error) {
    console.error("Error getting link groups:", error);
    throw error;
  }
}

/**
 * Obtiene un grupo de enlaces por su ID
 */
export async function getLinkGroupById(id: string): Promise<LinkGroup | null> {
  try {
    const docRef = doc(db, "link_groups", id);
    const snapshot = await getDoc(docRef);
    
    if (!snapshot.exists()) {
      return null;
    }
    
    return { 
      id: snapshot.id, 
      ...snapshot.data() as Omit<LinkGroup, 'id'> 
    };
  } catch (error) {
    console.error(`Error getting link group ${id}:`, error);
    throw error;
  }
}

/**
 * Crea un nuevo grupo de enlaces
 */
export async function createLinkGroup(group: Omit<LinkGroup, 'id'>): Promise<string> {
  try {
    // Get all groups first to determine the maximum order
    const groups = await getAllLinkGroups();
    const maxOrder = groups.length > 0 
      ? Math.max(...groups.map(g => g.order || 0)) 
      : 0;
    
    // Set the order for the new group
    const groupWithOrder = {
      ...group,
      order: maxOrder + 1,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, "link_groups"), groupWithOrder);
    return docRef.id;
  } catch (error) {
    console.error("Error creating link group:", error);
    throw error;
  }
}

/**
 * Actualiza un grupo de enlaces existente
 */
export async function updateLinkGroup(id: string, group: Partial<LinkGroup>): Promise<void> {
  try {
    const groupRef = doc(db, "link_groups", id);
    const updateData = {
      ...group,
      updatedAt: serverTimestamp()
    };
    
    await updateDoc(groupRef, updateData);
  } catch (error) {
    console.error(`Error updating link group ${id}:`, error);
    throw error;
  }
}

/**
 * Elimina un grupo de enlaces y todos sus enlaces asociados
 */
export async function deleteLinkGroup(id: string): Promise<void> {
  try {
    // Delete the group
    const groupRef = doc(db, "link_groups", id);
    await deleteDoc(groupRef);
    
    // Get and delete all links for this group
    const links = await getLinksByGroup(id);
    for (const link of links) {
      if (link.id) {
        await deleteLink(link.id);
      }
    }
  } catch (error) {
    console.error(`Error deleting link group ${id}:`, error);
    throw error;
  }
}

/**
 * Actualiza el orden de los grupos de enlaces
 */
export async function updateLinkGroupsOrder(orderedGroups: {id: string, order: number}[]): Promise<void> {
  try {
    // Procesar cada grupo individualmente en lugar de usar un batch
    for (const group of orderedGroups) {
      const groupRef = doc(db, "link_groups", group.id);
      await updateDoc(groupRef, { 
        order: group.order,
        updatedAt: serverTimestamp() 
      });
    }
  } catch (error) {
    console.error("Error updating link groups order:", error);
    throw error;
  }
}

/**
 * Obtiene todos los enlaces de un grupo específico
 */
export async function getLinksByGroup(groupId: string): Promise<Link[]> {
  try {
    const linksCollection = collection(db, "links");
    const q = query(
      linksCollection, 
      where("groupId", "==", groupId),
      orderBy("order", "asc")
    );
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => {
      return { 
        id: doc.id, 
        ...doc.data() as Omit<Link, 'id'> 
      };
    });
  } catch (error) {
    console.error(`Error getting links for group ${groupId}:`, error);
    throw error;
  }
}

/**
 * Obtiene un enlace por su ID
 */
export async function getLinkById(id: string): Promise<Link | null> {
  try {
    const docRef = doc(db, "links", id);
    const snapshot = await getDoc(docRef);
    
    if (!snapshot.exists()) {
      return null;
    }
    
    return { 
      id: snapshot.id, 
      ...snapshot.data() as Omit<Link, 'id'> 
    };
  } catch (error) {
    console.error(`Error getting link ${id}:`, error);
    throw error;
  }
}

/**
 * Crea un nuevo enlace
 */
export async function createLink(link: Omit<Link, 'id'>): Promise<string> {
  try {
    // Get all links first to determine the maximum order in this group
    const links = await getLinksByGroup(link.groupId);
    const maxOrder = links.length > 0 
      ? Math.max(...links.map(l => l.order || 0)) 
      : 0;
    
    // Set the order for the new link
    const linkWithDetails = {
      ...link,
      order: maxOrder + 1,
      clicks: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, "links"), linkWithDetails);
    return docRef.id;
  } catch (error) {
    console.error("Error creating link:", error);
    throw error;
  }
}

/**
 * Actualiza un enlace existente
 */
export async function updateLink(id: string, link: Partial<Link>): Promise<void> {
  try {
    const linkRef = doc(db, "links", id);
    
    // Añadir timestamp de actualización
    const linkWithTimestamp = {
      ...link,
      updatedAt: serverTimestamp()
    };
    
    await updateDoc(linkRef, linkWithTimestamp);
  } catch (error) {
    console.error(`Error al actualizar enlace ${id}:`, error);
    throw error;
  }
}

/**
 * Elimina un enlace
 */
export async function deleteLink(id: string): Promise<void> {
  try {
    const linkRef = doc(db, "links", id);
    await deleteDoc(linkRef);
  } catch (error) {
    console.error(`Error al eliminar enlace ${id}:`, error);
    throw error;
  }
}

/**
 * Actualiza el orden de los enlaces dentro de un grupo
 */
export async function updateLinksOrder(orderedLinks: {id: string, order: number}[]): Promise<void> {
  try {
    const batch = writeBatch(db);
    
    orderedLinks.forEach(({id, order}) => {
      const linkRef = doc(db, "links", id);
      batch.update(linkRef, { 
        order,
        updatedAt: serverTimestamp()
      });
    });
    
    await batch.commit();
  } catch (error) {
    console.error("Error al actualizar el orden de los enlaces:", error);
    throw error;
  }
}

/**
 * Incrementa el contador de clics para un enlace
 */
export async function incrementLinkClick(id: string): Promise<void> {
  try {
    const linkRef = doc(db, "links", id);
    const linkSnap = await getDoc(linkRef);
    
    if (linkSnap.exists()) {
      const currentClicks = linkSnap.data().clicks || 0;
      await updateDoc(linkRef, { 
        clicks: currentClicks + 1,
        updatedAt: serverTimestamp()
      });
    }
  } catch (error) {
    console.error(`Error al incrementar clics para el enlace ${id}:`, error);
    throw error;
  }
} 
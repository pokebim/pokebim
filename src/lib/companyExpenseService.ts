import { db } from './firebase';
import { collection, getDocs, getDoc, doc, addDoc, updateDoc, deleteDoc, query, orderBy, Timestamp } from 'firebase/firestore/lite';

export interface CompanyExpense {
  id?: string;
  name: string;
  price: number;
  link?: string;
  paidBy: 'edmon' | 'albert' | 'biel' | 'todos';
  isPaid: boolean;
  paymentDate?: Date | null;
  category?: string;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Obtener todos los gastos
export const getAllCompanyExpenses = async (): Promise<CompanyExpense[]> => {
  try {
    console.log('Cargando gastos empresariales desde Firebase');
    
    const expensesCollection = collection(db, 'companyExpenses');
    const expensesQuery = query(expensesCollection, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(expensesQuery);
    
    if (snapshot.empty) {
      console.log('No hay gastos empresariales registrados');
      return [];
    }
    
    const expenses: CompanyExpense[] = [];
    
    snapshot.forEach(doc => {
      const data = doc.data();
      expenses.push({
        id: doc.id,
        name: data.name,
        price: data.price,
        link: data.link || undefined,
        paidBy: data.paidBy,
        isPaid: data.isPaid || false,
        paymentDate: data.paymentDate ? data.paymentDate.toDate() : null,
        category: data.category || undefined,
        notes: data.notes || undefined,
        createdAt: data.createdAt ? data.createdAt.toDate() : new Date(),
        updatedAt: data.updatedAt ? data.updatedAt.toDate() : new Date()
      });
    });
    
    console.log(`Cargados ${expenses.length} gastos empresariales`);
    return expenses;
  } catch (error) {
    console.error('Error al cargar gastos empresariales:', error);
    throw error;
  }
};

// Añadir un nuevo gasto
export const addCompanyExpense = async (expenseData: Omit<CompanyExpense, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const expensesCollection = collection(db, 'companyExpenses');
    
    const docData = {
      ...expenseData,
      price: Number(expenseData.price),
      isPaid: expenseData.isPaid || false,
      paymentDate: expenseData.paymentDate ? Timestamp.fromDate(new Date(expenseData.paymentDate)) : null,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };
    
    const docRef = await addDoc(expensesCollection, docData);
    console.log(`Gasto empresarial añadido con ID: ${docRef.id}`);
    
    return docRef.id;
  } catch (error) {
    console.error('Error al añadir gasto empresarial:', error);
    throw error;
  }
};

// Actualizar un gasto existente
export const updateCompanyExpense = async (id: string, expenseData: Partial<CompanyExpense>): Promise<void> => {
  try {
    const expenseDoc = doc(db, 'companyExpenses', id);
    
    // Preparar datos para actualizar
    const updateData: any = {
      ...expenseData,
      updatedAt: Timestamp.now()
    };
    
    // Convertir fecha de pago si existe
    if (expenseData.paymentDate) {
      updateData.paymentDate = Timestamp.fromDate(new Date(expenseData.paymentDate));
    }
    
    // Asegurarse de que el precio sea un número
    if (expenseData.price !== undefined) {
      updateData.price = Number(expenseData.price);
    }
    
    await updateDoc(expenseDoc, updateData);
    console.log(`Gasto empresarial con ID ${id} actualizado`);
  } catch (error) {
    console.error(`Error al actualizar gasto empresarial ${id}:`, error);
    throw error;
  }
};

// Eliminar un gasto
export const deleteCompanyExpense = async (id: string): Promise<void> => {
  try {
    const expenseDoc = doc(db, 'companyExpenses', id);
    await deleteDoc(expenseDoc);
    console.log(`Gasto empresarial con ID ${id} eliminado`);
  } catch (error) {
    console.error(`Error al eliminar gasto empresarial ${id}:`, error);
    throw error;
  }
};

// Obtener un gasto por su ID
export const getCompanyExpenseById = async (id: string): Promise<CompanyExpense | null> => {
  try {
    const expenseDoc = doc(db, 'companyExpenses', id);
    const snapshot = await getDoc(expenseDoc);
    
    if (!snapshot.exists()) {
      console.log(`No se encontró gasto empresarial con ID ${id}`);
      return null;
    }
    
    const data = snapshot.data();
    
    return {
      id: snapshot.id,
      name: data.name,
      price: data.price,
      link: data.link || undefined,
      paidBy: data.paidBy,
      isPaid: data.isPaid || false,
      paymentDate: data.paymentDate ? data.paymentDate.toDate() : null,
      category: data.category || undefined,
      notes: data.notes || undefined,
      createdAt: data.createdAt ? data.createdAt.toDate() : new Date(),
      updatedAt: data.updatedAt ? data.updatedAt.toDate() : new Date()
    };
  } catch (error) {
    console.error(`Error al obtener gasto empresarial ${id}:`, error);
    throw error;
  }
}; 
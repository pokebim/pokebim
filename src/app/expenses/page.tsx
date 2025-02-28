'use client';

import { useState, useEffect, useMemo } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import Modal from '@/components/ui/Modal';
import DataTable from '@/components/ui/DataTable';
import CompanyExpenseForm from '@/components/forms/CompanyExpenseForm';
import { createColumnHelper } from '@tanstack/react-table';
import { 
  CompanyExpense,
  getAllCompanyExpenses,
  addCompanyExpense,
  updateCompanyExpense,
  deleteCompanyExpense
} from '@/lib/companyExpenseService';
import { toast } from 'react-hot-toast';

// Componente para mostrar el badge del estado de pago
const PaymentStatusBadge = ({ isPaid }: { isPaid: boolean }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
    isPaid 
      ? 'bg-green-900 text-green-200' 
      : 'bg-yellow-900 text-yellow-200'
  }`}>
    {isPaid ? 'Pagado' : 'Pendiente'}
  </span>
);

// Componente para la página principal de gastos
export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<CompanyExpense[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editingExpense, setEditingExpense] = useState<CompanyExpense | null>(null);
  const [filterPaidBy, setFilterPaidBy] = useState<string>('all');

  // Cargar los gastos al montar el componente
  useEffect(() => {
    fetchExpenses();
  }, []);

  // Función para cargar todos los gastos
  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const data = await getAllCompanyExpenses();
      setExpenses(data);
      setError(null);
    } catch (error) {
      console.error('Error al cargar los gastos:', error);
      setError('No se pudieron cargar los gastos. Por favor, inténtalo de nuevo más tarde.');
    } finally {
      setLoading(false);
    }
  };

  // Manejar la eliminación de un gasto
  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este gasto?')) {
      return;
    }
    
    try {
      await deleteCompanyExpense(id);
      setExpenses(prev => prev.filter(expense => expense.id !== id));
      toast.success('Gasto eliminado correctamente');
    } catch (error) {
      console.error('Error al eliminar el gasto:', error);
      toast.error('Error al eliminar el gasto');
    }
  };

  // Manejar la edición de un gasto
  const handleEdit = (expense: CompanyExpense) => {
    setEditingExpense(expense);
    setModalOpen(true);
  };

  // Manejar el envío del formulario
  const handleSubmit = async (formData: Partial<CompanyExpense>) => {
    try {
      if (editingExpense && editingExpense.id) {
        // Actualizar un gasto existente
        await updateCompanyExpense(editingExpense.id, formData);
        
        // Actualizar el estado local
        setExpenses(prev => 
          prev.map(expense => 
            expense.id === editingExpense.id 
              ? { ...expense, ...formData, updatedAt: new Date() } 
              : expense
          )
        );
        
        toast.success('Gasto actualizado correctamente');
      } else {
        // Añadir un nuevo gasto
        const newId = await addCompanyExpense(formData as Omit<CompanyExpense, 'id' | 'createdAt' | 'updatedAt'>);
        
        // Actualizar el estado local
        const newExpense: CompanyExpense = {
          id: newId,
          ...formData as Omit<CompanyExpense, 'id'>,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        setExpenses(prev => [newExpense, ...prev]);
        
        toast.success('Gasto añadido correctamente');
      }
      
      // Cerrar el modal y limpiar el estado de edición
      setModalOpen(false);
      setEditingExpense(null);
    } catch (error) {
      console.error('Error al guardar el gasto:', error);
      toast.error('Error al guardar el gasto');
    }
  };

  // Definir las columnas de la tabla
  const columnHelper = createColumnHelper<CompanyExpense>();
  
  const columns = useMemo(() => [
    columnHelper.accessor('name', {
      header: 'Nombre',
      cell: info => <span className="font-medium text-white">{info.getValue()}</span>
    }),
    columnHelper.accessor('price', {
      header: 'Precio',
      cell: info => <span className="text-white">{info.getValue().toFixed(2)} €</span>
    }),
    columnHelper.accessor('category', {
      header: 'Categoría',
      cell: info => <span className="text-gray-300">{info.getValue() || 'Sin categoría'}</span>
    }),
    columnHelper.accessor('paidBy', {
      header: 'Pagado por',
      cell: info => {
        const value = info.getValue();
        let displayText = '';
        let bgClass = '';
        
        switch(value) {
          case 'edmon':
            displayText = 'Edmon';
            bgClass = 'bg-blue-900 text-blue-200';
            break;
          case 'albert':
            displayText = 'Albert';
            bgClass = 'bg-red-900 text-red-200';
            break;
          case 'biel':
            displayText = 'Biel';
            bgClass = 'bg-yellow-900 text-yellow-200';
            break;
          case 'todos':
            displayText = 'Todos';
            bgClass = 'bg-purple-900 text-purple-200';
            break;
          default:
            displayText = value;
            bgClass = 'bg-gray-900 text-gray-200';
        }
        
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgClass}`}>
            {displayText}
          </span>
        );
      }
    }),
    columnHelper.accessor('isPaid', {
      header: 'Estado',
      cell: info => <PaymentStatusBadge isPaid={info.getValue()} />
    }),
    columnHelper.accessor('link', {
      header: 'Enlace',
      cell: info => {
        const link = info.getValue();
        return link ? (
          <a 
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 underline truncate block max-w-[200px]"
          >
            Ver producto
          </a>
        ) : (
          <span className="text-gray-500">-</span>
        );
      }
    }),
    columnHelper.accessor('createdAt', {
      header: 'Fecha',
      cell: info => {
        const date = info.getValue();
        return date ? (
          <span className="text-gray-300">
            {new Date(date).toLocaleDateString()}
          </span>
        ) : '-';
      }
    }),
    columnHelper.accessor('id', {
      header: 'Acciones',
      cell: info => (
        <div className="flex space-x-2">
          <button
            onClick={() => handleEdit(info.row.original)}
            className="px-3 py-1 text-xs bg-blue-700 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Editar
          </button>
          <button
            onClick={() => handleDelete(info.getValue() as string)}
            className="px-3 py-1 text-xs bg-red-700 text-white rounded hover:bg-red-600 transition-colors"
          >
            Eliminar
          </button>
        </div>
      )
    })
  ], []);

  // Filtrar los gastos según el filtro seleccionado
  const filteredExpenses = useMemo(() => {
    if (filterPaidBy === 'all') {
      return expenses;
    }
    return expenses.filter(expense => expense.paidBy === filterPaidBy);
  }, [expenses, filterPaidBy]);

  // Calcular estadísticas
  const stats = useMemo(() => {
    const total = expenses.reduce((sum, expense) => sum + expense.price, 0);
    
    const byPerson = {
      edmon: expenses.filter(e => e.paidBy === 'edmon').reduce((sum, e) => sum + e.price, 0),
      albert: expenses.filter(e => e.paidBy === 'albert').reduce((sum, e) => sum + e.price, 0),
      biel: expenses.filter(e => e.paidBy === 'biel').reduce((sum, e) => sum + e.price, 0),
      todos: expenses.filter(e => e.paidBy === 'todos').reduce((sum, e) => sum + e.price, 0)
    };
    
    const byCategory = expenses.reduce((acc, expense) => {
      const category = expense.category || 'Sin categoría';
      acc[category] = (acc[category] || 0) + expense.price;
      return acc;
    }, {} as Record<string, number>);
    
    return { total, byPerson, byCategory };
  }, [expenses]);

  return (
    <MainLayout>
      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingExpense(null);
        }}
        title={editingExpense ? "Editar gasto" : "Añadir nuevo gasto"}
      >
        <CompanyExpenseForm
          onSubmit={handleSubmit}
          onCancel={() => {
            setModalOpen(false);
            setEditingExpense(null);
          }}
          initialData={editingExpense}
        />
      </Modal>

      <div className="py-6">
        <div className="px-4 sm:px-6 md:px-8">
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-semibold leading-tight text-white">
                Gastos Empresariales
              </h2>
              <p className="mt-1 text-sm text-gray-400">
                Gestiona los gastos de material, web, y otros recursos para la empresa.
              </p>
            </div>
            <div className="mt-4 flex space-x-3 md:mt-0 md:ml-4">
              <button
                type="button"
                onClick={fetchExpenses}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-600 hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                </svg>
                Actualizar
              </button>
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
                Añadir Gasto
              </button>
            </div>
          </div>
          
          {error && (
            <div className="mt-4 bg-red-900 border-l-4 border-red-500 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-200">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Panel de estadísticas */}
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="bg-gray-900 rounded-lg shadow p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-400 truncate">
                      Total Gastos
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-white">
                        {stats.total.toFixed(2)} €
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="bg-gray-900 rounded-lg shadow p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-400 truncate">
                      Gastos de Edmon
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-white">
                        {stats.byPerson.edmon.toFixed(2)} €
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="bg-gray-900 rounded-lg shadow p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-red-500 rounded-md p-3">
                  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-400 truncate">
                      Gastos de Albert
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-white">
                        {stats.byPerson.albert.toFixed(2)} €
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="bg-gray-900 rounded-lg shadow p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">
                  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-400 truncate">
                      Gastos de Biel
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-white">
                        {stats.byPerson.biel.toFixed(2)} €
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Selector de filtro */}
          <div className="mt-8 mb-4">
            <label className="text-sm font-medium text-white mr-2">
              Filtrar por persona:
            </label>
            <div className="mt-1">
              <select
                value={filterPaidBy}
                onChange={(e) => setFilterPaidBy(e.target.value)}
                className="w-full sm:w-48 p-2 bg-gray-800 border border-gray-700 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 text-white"
              >
                <option value="all">Todos</option>
                <option value="edmon">Edmon</option>
                <option value="albert">Albert</option>
                <option value="biel">Biel</option>
                <option value="todos">Pagado por todos</option>
              </select>
            </div>
          </div>

          {/* Tabla de gastos */}
          <div className="mt-4">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
                <span className="ml-3 text-white">Cargando gastos...</span>
              </div>
            ) : filteredExpenses.length === 0 ? (
              <div className="text-center py-12 bg-gray-900 rounded-lg">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                </svg>
                <p className="mt-2 text-sm font-medium text-gray-400">
                  No hay gastos registrados{filterPaidBy !== 'all' ? ` para ${filterPaidBy}` : ''}.
                </p>
                <div className="mt-6">
                  <button
                    type="button"
                    onClick={() => setModalOpen(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Añadir nuevo gasto
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-gray-900 shadow-md rounded-lg overflow-hidden">
                <DataTable
                  data={filteredExpenses}
                  columns={columns}
                  searchPlaceholder="Buscar por nombre, categoría..."
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
} 
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
import DetailView, { DetailField, DetailGrid, DetailSection, DetailBadge, DetailLink } from '@/components/ui/DetailView';
import { getAllSales } from '@/lib/salesService';

// Simple Tooltip component
const Tooltip = ({ content, children }: { content: string, children: React.ReactNode }) => {
  return (
    <div className="group relative inline-block">
      {children}
      <div className="absolute z-10 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition bg-gray-900 text-white text-xs p-2 rounded w-64 -translate-x-1/2 left-1/2 bottom-full mb-1">
        {content}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
      </div>
    </div>
  );
};

// Collapsible Section component
const CollapsibleSection = ({ title, children, defaultOpen = true, tooltipContent }: { 
  title: string, 
  children: React.ReactNode, 
  defaultOpen?: boolean,
  tooltipContent?: string 
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <div className="bg-gray-800 p-4 rounded-lg mb-6">
      <div className="flex justify-between items-center cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
        <div className="flex items-center">
          <h3 className="text-white font-medium">
            {title}
          </h3>
          {tooltipContent && (
            <Tooltip content={tooltipContent}>
              <svg className="w-4 h-4 ml-2 text-gray-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"></path>
              </svg>
            </Tooltip>
          )}
        </div>
        <svg 
          className={`w-5 h-5 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
        </svg>
      </div>
      
      <div 
        className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-[2000px] opacity-100 mt-4' : 'max-h-0 opacity-0'}`}
      >
        {children}
      </div>
    </div>
  );
};

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

// Componente para mostrar el badge de asignación
const AssignedToBadge = ({ assignedTo }: { assignedTo?: string }) => {
  if (!assignedTo) return null;
  
  const bgColor = 
    assignedTo === 'edmon' ? 'bg-blue-900 text-blue-200' : 
    assignedTo === 'albert' ? 'bg-purple-900 text-purple-200' : 
    'bg-red-900 text-red-200';
  
  const label = 
    assignedTo === 'edmon' ? 'Pagado a Edmon' : 
    assignedTo === 'albert' ? 'Pagado a Albert' : 
    'Pagado a Biel';
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColor}`}>
      {label}
    </span>
  );
};

// Componente para la página principal de gastos
export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<CompanyExpense[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editingExpense, setEditingExpense] = useState<CompanyExpense | null>(null);
  const [filterPaidBy, setFilterPaidBy] = useState<string>('all');
  // Nuevo estado para la vista detallada
  const [detailViewOpen, setDetailViewOpen] = useState<boolean>(false);
  const [selectedExpense, setSelectedExpense] = useState<CompanyExpense | null>(null);
  // Nuevo estado para preseleccionar la categoría de impuestos
  const [preselectedCategory, setPreselectedCategory] = useState<string | null>(null);
  // Estado para almacenar el total de ventas
  const [totalSales, setTotalSales] = useState<number>(0);

  // Cargar los datos de ventas
  useEffect(() => {
    const fetchSalesData = async () => {
      try {
        const salesData = await getAllSales();
        // Calcular el total de ventas
        const total = salesData.reduce((sum, sale) => {
          const pricePerUnit = sale.hasVAT ? sale.totalWithVAT : sale.price;
          const quantity = sale.quantity || 1;
          return sum + (pricePerUnit * quantity);
        }, 0);
        setTotalSales(total);
      } catch (error) {
        console.error('Error al cargar las ventas:', error);
      }
    };

    fetchSalesData();
  }, []);

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
      // Primero obtenemos los impuestos relacionados con este gasto
      const relatedTaxes = getRelatedTaxExpenses(id);
      
      // Eliminamos el gasto principal
      await deleteCompanyExpense(id);
      
      // Ahora eliminamos todos los impuestos relacionados
      for (const tax of relatedTaxes) {
        if (tax.id) {
          await deleteCompanyExpense(tax.id);
        }
      }
      
      // Actualizar el estado de la UI para eliminar tanto el gasto como sus impuestos
      setExpenses(prev => prev.filter(expense => 
        expense.id !== id && expense.relatedExpenseId !== id
      ));
      
      toast.success('Gasto e impuestos relacionados eliminados correctamente');
    } catch (error) {
      console.error('Error al eliminar el gasto:', error);
      toast.error('Error al eliminar el gasto');
    }
  };

  // Manejar la edición de un gasto
  const handleEdit = (expense: CompanyExpense) => {
    setEditingExpense(expense);
    setPreselectedCategory(null);
    setModalOpen(true);
  };

  // Nuevo método para manejar la adición de impuestos a un gasto existente
  const handleAddTaxToExpense = (expense: CompanyExpense) => {
    setEditingExpense(expense);
    setPreselectedCategory('Impuestos');
    setModalOpen(true);
  };

  // Manejar el envío del formulario
  const handleSubmit = async (formData: Partial<CompanyExpense>) => {
    try {
      if (editingExpense && editingExpense.id) {
        // Si estamos añadiendo un impuesto a un gasto existente
        if (preselectedCategory === 'Impuestos' && editingExpense.category !== 'Impuestos') {
          // Crear un nuevo gasto para el impuesto, vinculado al gasto original
          const taxExpense: Omit<CompanyExpense, 'id' | 'createdAt' | 'updatedAt'> = {
            name: `Impuesto: ${editingExpense.name}`,
            price: formData.price || 0,
            link: '',
            paidBy: editingExpense.paidBy || 'edmon',
            isPaid: editingExpense.isPaid || false,
            paymentDate: editingExpense.paymentDate || null,
            category: 'Impuestos',
            notes: `Impuesto asociado al gasto: ${editingExpense.name}`,
            taxType: formData.taxType || '',
            taxBase: formData.taxBase || 0,
            taxRate: formData.taxRate || 0,
            relatedExpenseId: editingExpense.id
          };
          
          // Añadir el nuevo gasto de impuesto
          const newId = await addCompanyExpense(taxExpense);
          
          // Actualizar el estado local con el nuevo gasto de impuesto
          const newExpense: CompanyExpense = {
            id: newId,
            ...taxExpense,
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          setExpenses(prev => [newExpense, ...prev]);
          
          toast.success('Impuesto añadido correctamente al gasto existente');
        } else {
          // Actualizar un gasto existente normalmente
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
        }
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
      setPreselectedCategory(null);
    } catch (error) {
      console.error('Error al guardar el gasto:', error);
      toast.error('Error al guardar el gasto');
    }
  };

  // Función para abrir la vista detallada
  const handleViewDetail = (expense: CompanyExpense) => {
    setSelectedExpense(expense);
    setDetailViewOpen(true);
  };

  // Función para abrir el modal de nuevo gasto
  const openNewExpenseModal = (category: string | null = null) => {
    setEditingExpense(null);
    setPreselectedCategory(category);
    setModalOpen(true);
  };

  // Filtrar los gastos según el filtro seleccionado
  const filteredExpenses = useMemo(() => {
    // Primero obtenemos una lista de IDs de los gastos que son impuestos
    // relacionados con otros gastos, para excluirlos de la vista principal
    const taxExpenseIds = expenses
      .filter(expense => expense.category === 'Impuestos' && expense.relatedExpenseId)
      .map(expense => expense.id);
    
    // Filtramos para excluir los impuestos que están relacionados con gastos existentes
    // ya que mostraremos esa información en la misma línea del gasto original
    let filtered = expenses.filter(expense => !taxExpenseIds.includes(expense.id));
    
    // Aplicamos el filtro de persona
    if (filterPaidBy !== 'all') {
      filtered = filtered.filter(expense => expense.paidBy === filterPaidBy);
    }
    
    return filtered;
  }, [expenses, filterPaidBy]);

  // Función para obtener los impuestos relacionados a un gasto
  const getRelatedTaxExpenses = (expenseId: string) => {
    return expenses.filter(expense => 
      expense.relatedExpenseId === expenseId && 
      expense.category === 'Impuestos'
    );
  };

  // Verificar si un gasto tiene impuestos asociados
  const hasRelatedTaxExpense = (expenseId: string) => {
    return expenses.some(expense => 
      expense.relatedExpenseId === expenseId && 
      expense.category === 'Impuestos'
    );
  };

  // Calcular estadísticas
  const stats = useMemo(() => {
    const total = expenses.reduce((sum, expense) => sum + expense.price, 0);
    
    // Calcular pagos por persona
    const byPerson = {
      edmon: expenses.filter(e => e.paidBy === 'edmon').reduce((sum, e) => sum + e.price, 0),
      albert: expenses.filter(e => e.paidBy === 'albert').reduce((sum, e) => sum + e.price, 0),
      biel: expenses.filter(e => e.paidBy === 'biel').reduce((sum, e) => sum + e.price, 0),
      todos: expenses.filter(e => e.paidBy === 'todos').reduce((sum, e) => sum + e.price, 0)
    };
    
    // Calcular gastos asignados a cada persona
    const assignedToPerson = {
      edmon: expenses.filter(e => e.assignedTo === 'edmon').reduce((sum, e) => sum + e.price, 0),
      albert: expenses.filter(e => e.assignedTo === 'albert').reduce((sum, e) => sum + e.price, 0),
      biel: expenses.filter(e => e.assignedTo === 'biel').reduce((sum, e) => sum + e.price, 0),
    };
    
    // Calcular totales netos (pagos - asignaciones)
    const netByPerson = {
      edmon: byPerson.edmon - assignedToPerson.edmon,
      albert: byPerson.albert - assignedToPerson.albert,
      biel: byPerson.biel - assignedToPerson.biel,
      todos: byPerson.todos
    };
    
    // Total neto (suma de los netos individuales)
    const netTotal = netByPerson.edmon + netByPerson.albert + netByPerson.biel + netByPerson.todos;
    
    // Consider sales income (attributed to Biel, as he keeps the sales money)
    const salesAttribution = {
      edmon: 0,
      albert: 0,
      biel: totalSales || 0, // All sales money is attributed to Biel
    };
    
    // Cálculo de reparto equitativo considerando ventas
    const totalGasto = netTotal; // El total neto que debe ser repartido
    const totalIngresos = totalSales || 0; // Total de ingresos por ventas
    const netBeneficio = totalIngresos - totalGasto; // Beneficio neto
    const parteEquitativa = totalGasto / 3; // División entre las 3 personas
    const parteEquitativaIngresos = totalIngresos / 3; // Cada persona debería recibir 1/3 de los ingresos
    
    // Diferencia entre lo que ha pagado cada uno y lo que debería pagar para que sea equitativo
    const balanceEquitativo = {
      edmon: parteEquitativa - netByPerson.edmon, // Positivo: debe pagar, Negativo: debe recibir
      albert: parteEquitativa - netByPerson.albert,
      biel: parteEquitativa - netByPerson.biel
    };

    // Biel tiene todo el dinero de ventas, pero debería repartirlo equitativamente
    const ventasARepartir = {
      edmon: parteEquitativaIngresos, // Lo que Edmon debería recibir de las ventas
      albert: parteEquitativaIngresos, // Lo que Albert debería recibir de las ventas
      biel: parteEquitativaIngresos - totalIngresos // Lo que Biel debería pagar (negativo) por tener todo el dinero
    };
    
    // Balance final considerando gastos + ventas
    const balanceFinal = {
      edmon: balanceEquitativo.edmon - ventasARepartir.edmon, // Resta lo que debería recibir de ventas
      albert: balanceEquitativo.albert - ventasARepartir.albert, // Resta lo que debería recibir de ventas
      biel: balanceEquitativo.biel - ventasARepartir.biel // Resta lo que debe pagar por tener todas las ventas
    };
    
    const byCategory = expenses.reduce((acc, expense) => {
      const category = expense.category || 'Sin categoría';
      acc[category] = (acc[category] || 0) + expense.price;
      return acc;
    }, {} as Record<string, number>);
    
    const pendingPayment = expenses.filter(e => !e.isPaid).length;
    const paid = expenses.filter(e => e.isPaid).length;
    
    return {
      total,
      netTotal,
      byPerson,
      assignedToPerson,
      netByPerson,
      byCategory,
      pendingPayment,
      paid,
      parteEquitativa,
      balanceEquitativo,
      totalIngresos,
      netBeneficio,
      beneficioEquitativo: netBeneficio / 3,
      balanceFinal,
      salesAttribution
    };
  }, [expenses, totalSales]);

  // Función para renderizar el paidBy como badge
  const renderPaidByBadge = (paidBy: string) => {
    let color: 'blue' | 'red' | 'yellow' | 'purple' = 'blue';
    let displayText = '';
    
    switch(paidBy) {
      case 'edmon':
        displayText = 'Edmon';
        color = 'blue';
        break;
      case 'albert':
        displayText = 'Albert';
        color = 'red';
        break;
      case 'biel':
        displayText = 'Biel';
        color = 'yellow';
        break;
      case 'todos':
        displayText = 'Todos';
        color = 'purple';
        break;
      default:
        displayText = paidBy;
    }
    
    return <DetailBadge color={color}>{displayText}</DetailBadge>;
  };

  // Obtiene el gasto original de un impuesto
  const getOriginalExpense = (taxExpense: CompanyExpense) => {
    if (taxExpense.relatedExpenseId) {
      return expenses.find(expense => expense.id === taxExpense.relatedExpenseId);
    }
    return null;
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
    columnHelper.display({
      id: 'taxDetails',
      header: 'Detalles Impuesto',
      cell: info => {
        const expense = info.row.original;
        
        // Si el gasto mismo es un impuesto, mostrar sus detalles
        if (expense.category === 'Impuestos' && expense.taxType) {
          return (
            <div className="text-sm">
              <span className="text-indigo-400 font-medium">{expense.taxType}</span>
              {expense.taxBase ? (
                <div className="text-gray-400">
                  Base: {expense.taxBase.toFixed(2)}€ ({expense.taxRate}%)
                </div>
              ) : null}
            </div>
          );
        }
        
        // Si el gasto tiene impuestos relacionados, mostrarlos aquí
        if (hasRelatedTaxExpense(expense.id!)) {
          const relatedTaxes = getRelatedTaxExpenses(expense.id!);
          
          return (
            <div className="space-y-1">
              {relatedTaxes.map((tax, index) => (
                <div key={tax.id} className="text-sm bg-gray-800 p-1.5 rounded">
                  <span className="text-indigo-400 font-medium">{tax.taxType}</span>
                  {tax.taxBase ? (
                    <div className="text-gray-400">
                      Base: {tax.taxBase.toFixed(2)}€ ({tax.taxRate}%) = {tax.price.toFixed(2)}€
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          );
        }
        
        return null;
      }
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
    columnHelper.accessor('assignedTo', {
      header: 'Pagado a',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <AssignedToBadge assignedTo={row.original.assignedTo} />
        </div>
      ),
      enableSorting: true
    }),
    columnHelper.accessor('id', {
      header: 'Acciones',
      cell: info => {
        const expense = info.row.original;
        return (
          <div className="flex space-x-2">
            <button
              onClick={() => handleViewDetail(expense)}
              className="px-3 py-1 text-xs bg-indigo-700 text-white rounded hover:bg-indigo-600 transition-colors"
            >
              Ver
            </button>
            <button
              onClick={() => handleEdit(expense)}
              className="px-3 py-1 text-xs bg-blue-700 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Editar
            </button>
            {expense.category !== 'Impuestos' && (
              <button
                onClick={() => handleAddTaxToExpense(expense)}
                className="px-3 py-1 text-xs bg-purple-700 text-white rounded hover:bg-purple-600 transition-colors"
                title="Añadir información de impuestos a este gasto"
              >
                + Impuesto
              </button>
            )}
            <button
              onClick={() => handleDelete(info.getValue() as string)}
              className="px-3 py-1 text-xs bg-red-700 text-white rounded hover:bg-red-600 transition-colors"
            >
              Eliminar
            </button>
          </div>
        );
      }
    })
  ], [expenses]);

  return (
    <MainLayout>
      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingExpense(null);
          setPreselectedCategory(null);
        }}
        title={editingExpense ? (preselectedCategory === 'Impuestos' ? 'Añadir impuesto al gasto' : 'Editar gasto') : 'Añadir gasto'}
      >
        <CompanyExpenseForm 
          onSubmit={handleSubmit} 
          initialData={editingExpense || undefined}
          onCancel={() => {
            setModalOpen(false);
            setEditingExpense(null);
            setPreselectedCategory(null);
          }}
          preselectedCategory={preselectedCategory}
          isAddingTaxToExpense={preselectedCategory === 'Impuestos' && !!editingExpense}
        />
      </Modal>

      <DetailView
        isOpen={detailViewOpen}
        onClose={() => setDetailViewOpen(false)}
        title={selectedExpense?.name || ''}
      >
        {selectedExpense && (
          <DetailGrid>
            <DetailField label="Precio" value={`${selectedExpense.price.toFixed(2)} €`} />
            <DetailField label="Estado" 
              value={<PaymentStatusBadge isPaid={selectedExpense.isPaid} />} 
            />
            <DetailField label="Pagado por" 
              value={renderPaidByBadge(selectedExpense.paidBy || 'edmon')}
            />
            {selectedExpense.paymentDate && (
              <DetailField 
                label="Fecha de pago" 
                value={new Date(selectedExpense.paymentDate).toLocaleDateString()} 
              />
            )}
            {selectedExpense.link && (
              <DetailField 
                label="Link" 
                value={<DetailLink href={selectedExpense.link} target="_blank" />} 
              />
            )}
            <DetailField label="Categoría" value={selectedExpense.category} />
            {selectedExpense.notes && (
              <DetailSection title="Notas" fullWidth>
                <p className="text-gray-300 whitespace-pre-wrap">{selectedExpense.notes}</p>
              </DetailSection>
            )}
            
            {/* Sección especial para impuestos */}
            {selectedExpense.category === 'Impuestos' && (
              <DetailSection title="Información de Impuesto" fullWidth>
                <div className="bg-gray-900 p-3 rounded-md">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
                    <div>
                      <p className="text-sm text-gray-400">Tipo de impuesto</p>
                      <p className="font-medium text-white">{selectedExpense.taxType || 'No especificado'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Base imponible</p>
                      <p className="font-medium text-white">{selectedExpense.taxBase ? `${selectedExpense.taxBase.toFixed(2)} €` : 'No especificado'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Tasa de impuesto</p>
                      <p className="font-medium text-white">{selectedExpense.taxRate ? `${selectedExpense.taxRate}%` : 'No especificado'}</p>
                    </div>
                  </div>
                  
                  {selectedExpense.relatedExpenseId && (
                    <div className="mt-2 pt-2 border-t border-gray-700">
                      <p className="text-sm text-gray-400">Gasto relacionado</p>
                      {getOriginalExpense(selectedExpense) ? (
                        <p className="font-medium text-white">{getOriginalExpense(selectedExpense)?.name}</p>
                      ) : (
                        <p className="font-medium text-red-400">Gasto original no encontrado</p>
                      )}
                    </div>
                  )}
                </div>
              </DetailSection>
            )}
            
            {/* Sección para impuestos relacionados */}
            {selectedExpense.category !== 'Impuestos' && getRelatedTaxExpenses(selectedExpense.id || '').length > 0 && (
              <DetailSection title="Impuestos relacionados" fullWidth>
                <div className="bg-gray-900 p-3 rounded-md">
                  {getRelatedTaxExpenses(selectedExpense.id || '').map((tax, index) => (
                    <div key={tax.id || index} className="mb-2 pb-2 border-b border-gray-700 last:border-0 last:mb-0 last:pb-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-white">{tax.name}</p>
                          <p className="text-sm text-green-400">{tax.price.toFixed(2)} €</p>
                        </div>
                        <DetailBadge>{tax.taxType || 'Impuesto'}</DetailBadge>
                      </div>
                      {tax.taxBase && tax.taxRate && (
                        <div className="mt-1 text-sm text-gray-400">
                          Base: {tax.taxBase.toFixed(2)} € | Tasa: {tax.taxRate}%
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </DetailSection>
            )}
          </DetailGrid>
        )}
      </DetailView>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-gray-900 rounded-lg shadow-sm overflow-hidden">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-white mb-4 sm:mb-0">Gastos</h1>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                <button
                  className="bg-white text-gray-900 px-4 py-2 rounded shadow hover:bg-gray-100 transition-colors"
                  onClick={() => openNewExpenseModal()}
                >
                  Añadir gasto
                </button>
                <button
                  className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 transition-colors"
                  onClick={() => openNewExpenseModal('Impuestos')}
                >
                  Añadir impuesto
                </button>
              </div>
            </div>
            
            {/* Mostrar estadísticas al inicio de la página */}
            <CollapsibleSection 
              title="Resumen de Estadísticas" 
              tooltipContent="Vista general de ventas, gastos y contribuciones individuales"
              defaultOpen={true}
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                {/* New cards for Sales and Profit */}
                <div className="bg-gray-800 p-4 rounded-lg">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                      <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                      </svg>
                    </div>
                    <div className="ml-4">
                      <Tooltip content="Suma total de todas las ventas registradas en el sistema">
                        <h3 className="text-gray-400 mb-1 text-sm flex items-center">
                          Total Ventas
                          <svg className="w-3 h-3 ml-1 text-gray-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"></path>
                          </svg>
                        </h3>
                      </Tooltip>
                      <p className="text-2xl font-semibold text-white">{totalSales?.toFixed(2) || "0.00"} €</p>
                    </div>
                  </div>
                </div>
              </div>
            </CollapsibleSection>
          </div>
        </div>
      </div>
    </MainLayout>
  );
} 
import React, { useState, useEffect } from 'react';

export default function ProfitCalculator() {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [buyPrice, setBuyPrice] = useState<string>('');
  const [sellPrice, setSellPrice] = useState<string>('');
  const [profitPercentage, setProfitPercentage] = useState<number>(0);
  const [profitAmount, setProfitAmount] = useState<number>(0);
  const [netSellPrice, setNetSellPrice] = useState<number>(0);
  const [netBuyPrice, setNetBuyPrice] = useState<number>(0);

  const TAX_RATE = 0.21; // 21% IVA

  // Función para calcular el beneficio
  const calculateProfit = () => {
    if (!buyPrice || !sellPrice) {
      setProfitPercentage(0);
      setProfitAmount(0);
      setNetSellPrice(0);
      setNetBuyPrice(0);
      return;
    }

    // Convertir a números
    const buyValue = parseFloat(buyPrice);
    const sellValue = parseFloat(sellPrice);

    if (isNaN(buyValue) || isNaN(sellValue) || buyValue <= 0 || sellValue <= 0) {
      setProfitPercentage(0);
      setProfitAmount(0);
      return;
    }

    // Calcular precios netos sin IVA
    const netBuy = buyValue / (1 + TAX_RATE);
    const netSell = sellValue / (1 + TAX_RATE);
    
    // Calcular beneficio en euros
    const profit = netSell - netBuy;
    
    // Calcular porcentaje de beneficio
    const percentage = (profit / netBuy) * 100;
    
    setNetBuyPrice(netBuy);
    setNetSellPrice(netSell);
    setProfitAmount(profit);
    setProfitPercentage(percentage);
  };

  // Calcular cada vez que cambien los precios
  useEffect(() => {
    calculateProfit();
  }, [buyPrice, sellPrice]);

  // Toggle el widget
  const toggleWidget = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Botón para abrir/cerrar el widget */}
      <button
        onClick={toggleWidget}
        className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg hover:bg-indigo-700 transition-colors"
        title="Calculadora de beneficios"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      </button>

      {/* Widget expandido */}
      {isOpen && (
        <div className="fixed bottom-16 right-4 w-80 bg-gray-900 rounded-lg shadow-xl overflow-hidden border border-gray-700 animate-slideIn">
          <div className="p-4 bg-indigo-700">
            <div className="flex justify-between items-center">
              <h3 className="text-white font-medium">Calculadora de Beneficios</h3>
              <button
                onClick={toggleWidget}
                className="text-white hover:text-gray-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          
          <div className="p-4 space-y-3">
            {/* Formulario */}
            <div>
              <label htmlFor="buyPrice" className="block text-sm font-medium text-gray-300">
                Precio de compra (€) con IVA
              </label>
              <input
                type="number"
                id="buyPrice"
                value={buyPrice}
                onChange={(e) => setBuyPrice(e.target.value)}
                min="0"
                step="0.01"
                className="mt-1 block w-full p-2 bg-gray-800 border border-gray-700 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-white"
                placeholder="0.00"
              />
              {netBuyPrice > 0 && (
                <p className="text-xs text-gray-400 mt-1">Sin IVA: {netBuyPrice.toFixed(2)} €</p>
              )}
            </div>
            
            <div>
              <label htmlFor="sellPrice" className="block text-sm font-medium text-gray-300">
                Precio de venta (€) con IVA
              </label>
              <input
                type="number"
                id="sellPrice"
                value={sellPrice}
                onChange={(e) => setSellPrice(e.target.value)}
                min="0"
                step="0.01"
                className="mt-1 block w-full p-2 bg-gray-800 border border-gray-700 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-white"
                placeholder="0.00"
              />
              {netSellPrice > 0 && (
                <p className="text-xs text-gray-400 mt-1">Sin IVA: {netSellPrice.toFixed(2)} €</p>
              )}
            </div>
            
            {/* Resultados */}
            <div className="bg-gray-800 p-3 rounded-md mt-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-sm text-gray-400">Beneficio</p>
                  <p className={`text-xl font-semibold ${profitAmount >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {profitAmount.toFixed(2)} €
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Porcentaje</p>
                  <p className={`text-xl font-semibold ${profitPercentage >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {profitPercentage.toFixed(2)} %
                  </p>
                </div>
              </div>
            </div>
            
            {/* Nota sobre IVA */}
            <div className="mt-3 border-t border-gray-700 pt-3">
              <p className="text-xs text-gray-400">
                Los cálculos se realizan con los precios sin IVA para determinar el beneficio real. 
                El IVA aplicado es del 21%.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
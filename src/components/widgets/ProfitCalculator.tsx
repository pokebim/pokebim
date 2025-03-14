import React, { useState, useEffect } from 'react';

export default function ProfitCalculator() {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [buyPrice, setBuyPrice] = useState<string>('');
  const [sellPrice, setSellPrice] = useState<string>('');
  const [buyPriceIncludesVAT, setBuyPriceIncludesVAT] = useState<boolean>(true);
  const [sellPriceIncludesVAT, setSellPriceIncludesVAT] = useState<boolean>(true);
  
  // Resultados de cálculos
  const [standardProfit, setStandardProfit] = useState<{
    amount: number;
    percentage: number;
  }>({ amount: 0, percentage: 0 });
  
  const [alternativeProfit, setAlternativeProfit] = useState<{
    amount: number;
    percentage: number;
  }>({ amount: 0, percentage: 0 });
  
  // Precios convertidos para mostrar
  const [netBuyPrice, setNetBuyPrice] = useState<number>(0);
  const [netSellPrice, setNetSellPrice] = useState<number>(0);
  const [buyWithVAT, setBuyWithVAT] = useState<number>(0);
  const [sellWithVAT, setSellWithVAT] = useState<number>(0);

  const TAX_RATE = 0.21; // 21% IVA

  // Función para calcular precios y beneficios
  const calculateProfit = () => {
    if (!buyPrice || !sellPrice) {
      resetCalculations();
      return;
    }

    // Convertir a números
    const rawBuyValue = parseFloat(buyPrice);
    const rawSellValue = parseFloat(sellPrice);

    if (isNaN(rawBuyValue) || isNaN(rawSellValue) || rawBuyValue <= 0 || rawSellValue <= 0) {
      resetCalculations();
      return;
    }

    // Calcular precios netos y con IVA según las opciones seleccionadas
    let buyValueWithoutVAT = buyPriceIncludesVAT ? rawBuyValue / (1 + TAX_RATE) : rawBuyValue;
    let buyValueWithVAT = buyPriceIncludesVAT ? rawBuyValue : rawBuyValue * (1 + TAX_RATE);
    
    let sellValueWithoutVAT = sellPriceIncludesVAT ? rawSellValue / (1 + TAX_RATE) : rawSellValue;
    let sellValueWithVAT = sellPriceIncludesVAT ? rawSellValue : rawSellValue * (1 + TAX_RATE);
    
    // Guardar precios convertidos para mostrar
    setNetBuyPrice(buyValueWithoutVAT);
    setNetSellPrice(sellValueWithoutVAT);
    setBuyWithVAT(buyValueWithVAT);
    setSellWithVAT(sellValueWithVAT);
    
    // Cálculo estándar (comparando ambos precios sin IVA)
    const standardProfitAmount = sellValueWithoutVAT - buyValueWithoutVAT;
    const standardProfitPercentage = (standardProfitAmount / buyValueWithoutVAT) * 100;
    
    setStandardProfit({
      amount: standardProfitAmount,
      percentage: standardProfitPercentage
    });
    
    // Cálculo alternativo (comparando precio de venta sin IVA con precio de compra con IVA)
    const alternativeProfitAmount = sellValueWithoutVAT - buyValueWithVAT;
    const alternativeProfitPercentage = (alternativeProfitAmount / buyValueWithVAT) * 100;
    
    setAlternativeProfit({
      amount: alternativeProfitAmount,
      percentage: alternativeProfitPercentage
    });
  };
  
  // Función para resetear todos los cálculos
  const resetCalculations = () => {
    setStandardProfit({ amount: 0, percentage: 0 });
    setAlternativeProfit({ amount: 0, percentage: 0 });
    setNetBuyPrice(0);
    setNetSellPrice(0);
    setBuyWithVAT(0);
    setSellWithVAT(0);
  };

  // Calcular cada vez que cambien los precios o las opciones de IVA
  useEffect(() => {
    calculateProfit();
  }, [buyPrice, sellPrice, buyPriceIncludesVAT, sellPriceIncludesVAT]);

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
        <div className="fixed bottom-16 right-4 w-96 bg-gray-900 rounded-lg shadow-xl overflow-hidden border border-gray-700 animate-slideIn">
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
          
          <div className="p-4 space-y-4">
            {/* Precio de compra */}
            <div>
              <div className="flex justify-between items-center">
                <label htmlFor="buyPrice" className="block text-sm font-medium text-gray-300">
                  Precio de compra (€)
                </label>
                <div className="flex items-center">
                  <label className="inline-flex items-center cursor-pointer">
                    <span className="text-xs text-gray-400 mr-2">Incluye IVA</span>
                    <input 
                      type="checkbox" 
                      checked={buyPriceIncludesVAT}
                      onChange={() => setBuyPriceIncludesVAT(!buyPriceIncludesVAT)}
                      className="sr-only peer"
                    />
                    <div className="relative w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
              </div>
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
              {buyPrice && (
                <div className="text-xs text-gray-400 mt-1 flex justify-between">
                  <span>Con IVA: {buyWithVAT.toFixed(2)} €</span>
                  <span>Sin IVA: {netBuyPrice.toFixed(2)} €</span>
                </div>
              )}
            </div>
            
            {/* Precio de venta */}
            <div>
              <div className="flex justify-between items-center">
                <label htmlFor="sellPrice" className="block text-sm font-medium text-gray-300">
                  Precio de venta (€)
                </label>
                <div className="flex items-center">
                  <label className="inline-flex items-center cursor-pointer">
                    <span className="text-xs text-gray-400 mr-2">Incluye IVA</span>
                    <input 
                      type="checkbox" 
                      checked={sellPriceIncludesVAT}
                      onChange={() => setSellPriceIncludesVAT(!sellPriceIncludesVAT)}
                      className="sr-only peer"
                    />
                    <div className="relative w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
              </div>
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
              {sellPrice && (
                <div className="text-xs text-gray-400 mt-1 flex justify-between">
                  <span>Con IVA: {sellWithVAT.toFixed(2)} €</span>
                  <span>Sin IVA: {netSellPrice.toFixed(2)} €</span>
                </div>
              )}
            </div>
            
            {/* Resultados del cálculo estándar (Ambos sin IVA) */}
            <div className="bg-gray-800 p-3 rounded-md">
              <h4 className="text-sm font-medium text-white mb-2">Método 1: Ambos precios sin IVA</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-sm text-gray-400">Beneficio</p>
                  <p className={`text-xl font-semibold ${standardProfit.amount >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {standardProfit.amount.toFixed(2)} €
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Porcentaje</p>
                  <p className={`text-xl font-semibold ${standardProfit.percentage >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {standardProfit.percentage.toFixed(2)} %
                  </p>
                </div>
              </div>
            </div>
            
            {/* Resultados del cálculo alternativo (Venta sin IVA, Compra con IVA) */}
            <div className="bg-gray-800 p-3 rounded-md">
              <h4 className="text-sm font-medium text-white mb-2">Método 2: Venta sin IVA, Compra con IVA</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-sm text-gray-400">Beneficio</p>
                  <p className={`text-xl font-semibold ${alternativeProfit.amount >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {alternativeProfit.amount.toFixed(2)} €
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Porcentaje</p>
                  <p className={`text-xl font-semibold ${alternativeProfit.percentage >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {alternativeProfit.percentage.toFixed(2)} %
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Este método compara el precio de venta sin IVA con el precio de compra con IVA.
              </p>
            </div>
            
            {/* Nota sobre IVA */}
            <div className="mt-3 border-t border-gray-700 pt-3">
              <p className="text-xs text-gray-400">
                El IVA aplicado es del 21%. Puedes activar/desactivar si los precios incluyen IVA.
                El Método 1 es el estándar contable, mientras que el Método 2 es más conservador.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
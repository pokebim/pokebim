import React, { useState, useEffect } from 'react';

// Definir tipos para las pestañas y tasas de IVA
type CalculatorTab = 'europa' | 'internacional' | 'personalizado';
type VATRate = 0.21 | 0.1 | 0.04 | 0;

interface ProfitResult {
  amount: number;
  percentage: number;
}

export default function ProfitCalculator() {
  // Estados básicos
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<CalculatorTab>('europa');
  
  // Datos de entrada
  const [buyPrice, setBuyPrice] = useState<string>('');
  const [sellPrice, setSellPrice] = useState<string>('');
  
  // Configuración de impuestos
  const [buyPriceIncludesVAT, setBuyPriceIncludesVAT] = useState<boolean>(true);
  const [sellPriceIncludesVAT, setSellPriceIncludesVAT] = useState<boolean>(true);
  const [buyVATRate, setBuyVATRate] = useState<VATRate>(0.21);
  const [sellVATRate, setSellVATRate] = useState<VATRate>(0.21);
  
  // Costos adicionales
  const [importFees, setImportFees] = useState<string>('');
  const [shippingCost, setShippingCost] = useState<string>('');
  const [includeAdditionalCosts, setIncludeAdditionalCosts] = useState<boolean>(false);
  
  // Resultados de cálculos
  const [standardProfit, setStandardProfit] = useState<ProfitResult>({ amount: 0, percentage: 0 });
  const [simpleProfit, setSimpleProfit] = useState<ProfitResult>({ amount: 0, percentage: 0 });
  const [realProfit, setRealProfit] = useState<ProfitResult>({ amount: 0, percentage: 0 });
  
  // Precios convertidos para mostrar
  const [netBuyPrice, setNetBuyPrice] = useState<number>(0);
  const [netSellPrice, setNetSellPrice] = useState<number>(0);
  const [buyWithVAT, setBuyWithVAT] = useState<number>(0);
  const [sellWithVAT, setSellWithVAT] = useState<number>(0);
  const [totalCost, setTotalCost] = useState<number>(0);

  // Actualizar configuración basada en la pestaña seleccionada
  useEffect(() => {
    if (activeTab === 'europa') {
      setBuyPriceIncludesVAT(true);
      setSellPriceIncludesVAT(true);
      setBuyVATRate(0.21);
      setSellVATRate(0.21);
      setIncludeAdditionalCosts(false);
    } else if (activeTab === 'internacional') {
      setBuyPriceIncludesVAT(false);
      setSellPriceIncludesVAT(true);
      setBuyVATRate(0);
      setSellVATRate(0.21);
      setIncludeAdditionalCosts(true);
    }
    // Para 'personalizado' mantenemos los valores actuales
  }, [activeTab]);

  // Función para calcular precios y beneficios
  const calculateProfit = () => {
    if (!buyPrice || !sellPrice) {
      resetCalculations();
      return;
    }

    // Convertir a números
    const rawBuyValue = parseFloat(buyPrice);
    const rawSellValue = parseFloat(sellPrice);
    const importFeesValue = parseFloat(importFees || '0');
    const shippingCostValue = parseFloat(shippingCost || '0');

    if (isNaN(rawBuyValue) || isNaN(rawSellValue) || rawBuyValue <= 0 || rawSellValue <= 0) {
      resetCalculations();
      return;
    }

    // Calcular precios netos y con IVA según las opciones seleccionadas
    let buyValueWithoutVAT = buyPriceIncludesVAT ? rawBuyValue / (1 + buyVATRate) : rawBuyValue;
    let buyValueWithVAT = buyPriceIncludesVAT ? rawBuyValue : rawBuyValue * (1 + buyVATRate);
    
    let sellValueWithoutVAT = sellPriceIncludesVAT ? rawSellValue / (1 + sellVATRate) : rawSellValue;
    let sellValueWithVAT = sellPriceIncludesVAT ? rawSellValue : rawSellValue * (1 + sellVATRate);
    
    // Costos adicionales
    const additionalCosts = includeAdditionalCosts ? (importFeesValue + shippingCostValue) : 0;
    const totalCostValue = buyValueWithoutVAT + additionalCosts;
    
    // Guardar precios convertidos para mostrar
    setNetBuyPrice(buyValueWithoutVAT);
    setNetSellPrice(sellValueWithoutVAT);
    setBuyWithVAT(buyValueWithVAT);
    setSellWithVAT(sellValueWithVAT);
    setTotalCost(totalCostValue);
    
    // Cálculo estándar (comparando ambos precios sin IVA)
    const standardProfitAmount = sellValueWithoutVAT - buyValueWithoutVAT;
    const standardProfitPercentage = (standardProfitAmount / buyValueWithoutVAT) * 100;
    
    setStandardProfit({
      amount: standardProfitAmount,
      percentage: standardProfitPercentage
    });
    
    // Cálculo simple (venta con IVA quitado - precio de compra original)
    const simpleProfitAmount = sellValueWithoutVAT - rawBuyValue;
    const simpleProfitPercentage = (simpleProfitAmount / rawBuyValue) * 100;
    
    setSimpleProfit({
      amount: simpleProfitAmount,
      percentage: simpleProfitPercentage
    });
    
    // Cálculo real (incluyendo costos adicionales)
    const realProfitAmount = sellValueWithoutVAT - totalCostValue;
    const realProfitPercentage = (realProfitAmount / totalCostValue) * 100;
    
    setRealProfit({
      amount: realProfitAmount,
      percentage: realProfitPercentage
    });
  };
  
  // Función para resetear todos los cálculos
  const resetCalculations = () => {
    setStandardProfit({ amount: 0, percentage: 0 });
    setSimpleProfit({ amount: 0, percentage: 0 });
    setRealProfit({ amount: 0, percentage: 0 });
    setNetBuyPrice(0);
    setNetSellPrice(0);
    setBuyWithVAT(0);
    setSellWithVAT(0);
    setTotalCost(0);
  };

  // Calcular cada vez que cambien los valores relevantes
  useEffect(() => {
    calculateProfit();
  }, [
    buyPrice, 
    sellPrice, 
    buyPriceIncludesVAT, 
    sellPriceIncludesVAT,
    buyVATRate,
    sellVATRate,
    importFees,
    shippingCost,
    includeAdditionalCosts
  ]);

  // Toggle el widget
  const toggleWidget = () => {
    setIsOpen(!isOpen);
  };
  
  // Función para formatear decimales
  const formatNumber = (num: number): string => {
    return num.toFixed(2);
  };
  
  // Función para obtener el texto del IVA basado en la tasa
  const getVATText = (rate: VATRate): string => {
    switch(rate) {
      case 0.21: return "IVA 21%";
      case 0.1: return "IVA 10%";
      case 0.04: return "IVA 4%";
      case 0: return "Sin IVA";
      default: return `IVA ${(rate * 100).toFixed(0)}%`;
    }
  };
  
  // Toggle de pestañas
  const handleTabChange = (tab: CalculatorTab) => {
    setActiveTab(tab);
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
          
          {/* Pestañas */}
          <div className="bg-gray-800 px-4 flex border-b border-gray-700">
            <button 
              className={`py-2 px-3 text-sm font-medium ${activeTab === 'europa' ? 'text-white border-b-2 border-indigo-500' : 'text-gray-400 hover:text-white'}`}
              onClick={() => handleTabChange('europa')}
            >
              Europa
            </button>
            <button 
              className={`py-2 px-3 text-sm font-medium ${activeTab === 'internacional' ? 'text-white border-b-2 border-indigo-500' : 'text-gray-400 hover:text-white'}`}
              onClick={() => handleTabChange('internacional')}
            >
              Internacional
            </button>
            <button 
              className={`py-2 px-3 text-sm font-medium ${activeTab === 'personalizado' ? 'text-white border-b-2 border-indigo-500' : 'text-gray-400 hover:text-white'}`}
              onClick={() => handleTabChange('personalizado')}
            >
              Personalizado
            </button>
          </div>
          
          <div className="p-4 space-y-4">
            {/* Sección: Precios de compra y venta */}
            <div className="space-y-3">
              {/* Precio de compra */}
              <div>
                <div className="flex justify-between items-center">
                  <label htmlFor="buyPrice" className="block text-sm font-medium text-gray-300">
                    Precio de compra (€)
                  </label>
                  {activeTab === 'personalizado' && (
                    <div className="flex items-center">
                      <label className="inline-flex items-center cursor-pointer">
                        <span className="text-xs text-gray-400 mr-2">
                          {buyPriceIncludesVAT ? getVATText(buyVATRate) : "Sin IVA"}
                        </span>
                        <input 
                          type="checkbox" 
                          checked={buyPriceIncludesVAT}
                          onChange={() => setBuyPriceIncludesVAT(!buyPriceIncludesVAT)}
                          className="sr-only peer"
                        />
                        <div className="relative w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>
                  )}
                  {activeTab !== 'personalizado' && (
                    <div className="text-xs text-gray-400">
                      {activeTab === 'europa' ? 'Con IVA 21%' : 'Sin IVA (Importación)'}
                    </div>
                  )}
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
                    <span>Con IVA: {formatNumber(buyWithVAT)} €</span>
                    <span>Sin IVA: {formatNumber(netBuyPrice)} €</span>
                  </div>
                )}
              </div>
              
              {/* Precio de venta */}
              <div>
                <div className="flex justify-between items-center">
                  <label htmlFor="sellPrice" className="block text-sm font-medium text-gray-300">
                    Precio de venta (€)
                  </label>
                  {activeTab === 'personalizado' && (
                    <div className="flex items-center">
                      <label className="inline-flex items-center cursor-pointer">
                        <span className="text-xs text-gray-400 mr-2">
                          {sellPriceIncludesVAT ? getVATText(sellVATRate) : "Sin IVA"}
                        </span>
                        <input 
                          type="checkbox" 
                          checked={sellPriceIncludesVAT}
                          onChange={() => setSellPriceIncludesVAT(!sellPriceIncludesVAT)}
                          className="sr-only peer"
                        />
                        <div className="relative w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>
                  )}
                  {activeTab !== 'personalizado' && (
                    <div className="text-xs text-gray-400">
                      Con IVA 21%
                    </div>
                  )}
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
                    <span>Con IVA: {formatNumber(sellWithVAT)} €</span>
                    <span>Sin IVA: {formatNumber(netSellPrice)} €</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Tasas de IVA en modo personalizado */}
            {activeTab === 'personalizado' && (
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-700">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Tasa IVA Compra</label>
                  <select 
                    value={buyVATRate.toString()} 
                    onChange={(e) => setBuyVATRate(parseFloat(e.target.value) as VATRate)}
                    className="w-full p-2 bg-gray-800 border border-gray-700 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-white text-sm"
                    disabled={!buyPriceIncludesVAT}
                  >
                    <option value="0.21">21% (General)</option>
                    <option value="0.1">10% (Reducido)</option>
                    <option value="0.04">4% (Superreducido)</option>
                    <option value="0">0% (Sin IVA)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Tasa IVA Venta</label>
                  <select 
                    value={sellVATRate.toString()} 
                    onChange={(e) => setSellVATRate(parseFloat(e.target.value) as VATRate)}
                    className="w-full p-2 bg-gray-800 border border-gray-700 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-white text-sm"
                    disabled={!sellPriceIncludesVAT}
                  >
                    <option value="0.21">21% (General)</option>
                    <option value="0.1">10% (Reducido)</option>
                    <option value="0.04">4% (Superreducido)</option>
                    <option value="0">0% (Sin IVA)</option>
                  </select>
                </div>
              </div>
            )}
            
            {/* Costos adicionales para importación */}
            {(activeTab === 'internacional' || (activeTab === 'personalizado' && includeAdditionalCosts)) && (
              <div className="space-y-3 pt-2 border-t border-gray-700">
                <h4 className="text-sm font-medium text-gray-300">Costos adicionales</h4>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="shippingCost" className="block text-xs font-medium text-gray-400">
                      Envío (€)
                    </label>
                    <input
                      type="number"
                      id="shippingCost"
                      value={shippingCost}
                      onChange={(e) => setShippingCost(e.target.value)}
                      min="0"
                      step="0.01"
                      className="mt-1 block w-full p-2 bg-gray-800 border border-gray-700 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-white text-sm"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label htmlFor="importFees" className="block text-xs font-medium text-gray-400">
                      Impuestos/Tasas (€)
                    </label>
                    <input
                      type="number"
                      id="importFees"
                      value={importFees}
                      onChange={(e) => setImportFees(e.target.value)}
                      min="0"
                      step="0.01"
                      className="mt-1 block w-full p-2 bg-gray-800 border border-gray-700 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-white text-sm"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                
                {activeTab === 'personalizado' && (
                  <div className="flex items-center">
                    <label className="inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={includeAdditionalCosts}
                        onChange={() => setIncludeAdditionalCosts(!includeAdditionalCosts)}
                        className="sr-only peer"
                      />
                      <div className="relative w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                      <span className="ml-2 text-sm text-gray-300">Incluir costos adicionales</span>
                    </label>
                  </div>
                )}
                
                {(activeTab === 'internacional' || includeAdditionalCosts) && totalCost > 0 && (
                  <div className="text-xs font-medium text-gray-300 flex justify-between">
                    <span>Costo total (con adicionales):</span>
                    <span>{formatNumber(totalCost)} €</span>
                  </div>
                )}
              </div>
            )}
            
            {/* Resultados de beneficios */}
            <div className="space-y-3 pt-2">
              {/* Resultados del cálculo que corresponda según el tab */}
              <div className="bg-gray-800 p-3 rounded-md">
                <h4 className="text-sm font-medium text-white mb-2">
                  {activeTab === 'internacional' ? 'Beneficio Real (con costos adicionales)' : 'Beneficio Estándar'}
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-sm text-gray-400">Beneficio</p>
                    <p className={`text-xl font-semibold ${
                      activeTab === 'internacional' 
                        ? (realProfit.amount >= 0 ? 'text-green-400' : 'text-red-400')
                        : (standardProfit.amount >= 0 ? 'text-green-400' : 'text-red-400')
                    }`}>
                      {activeTab === 'internacional' 
                        ? formatNumber(realProfit.amount) 
                        : formatNumber(standardProfit.amount)} €
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Porcentaje</p>
                    <p className={`text-xl font-semibold ${
                      activeTab === 'internacional' 
                        ? (realProfit.percentage >= 0 ? 'text-green-400' : 'text-red-400')
                        : (standardProfit.percentage >= 0 ? 'text-green-400' : 'text-red-400')
                    }`}>
                      {activeTab === 'internacional' 
                        ? formatNumber(realProfit.percentage) 
                        : formatNumber(standardProfit.percentage)} %
                    </p>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {activeTab === 'internacional' 
                    ? 'Incluye todos los costos de importación para un cálculo real'
                    : 'Compara precios sin IVA para un cálculo contable estándar'}
                </p>
              </div>
              
              {/* En modo personalizado, mostrar todos los cálculos */}
              {activeTab === 'personalizado' && (
                <>
                  <div className="bg-gray-800 p-3 rounded-md">
                    <h4 className="text-sm font-medium text-white mb-2">Beneficio Simple</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-sm text-gray-400">Beneficio</p>
                        <p className={`text-xl font-semibold ${simpleProfit.amount >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {formatNumber(simpleProfit.amount)} €
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Porcentaje</p>
                        <p className={`text-xl font-semibold ${simpleProfit.percentage >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {formatNumber(simpleProfit.percentage)} %
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Precio de venta (sin IVA) menos precio de compra original
                    </p>
                  </div>
                  
                  {includeAdditionalCosts && (
                    <div className="bg-gray-800 p-3 rounded-md">
                      <h4 className="text-sm font-medium text-white mb-2">Beneficio Real (con costos adicionales)</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-sm text-gray-400">Beneficio</p>
                          <p className={`text-xl font-semibold ${realProfit.amount >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {formatNumber(realProfit.amount)} €
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">Porcentaje</p>
                          <p className={`text-xl font-semibold ${realProfit.percentage >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {formatNumber(realProfit.percentage)} %
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Incluye todos los costos adicionales para un cálculo real
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
            
            {/* Notas informativas según el modo */}
            <div className="mt-3 border-t border-gray-700 pt-3">
              {activeTab === 'europa' && (
                <p className="text-xs text-gray-400">
                  Modo Europa: Para compras y ventas dentro de la UE con IVA. El beneficio se calcula comparando ambos precios sin IVA para determinar el margen real.
                </p>
              )}
              
              {activeTab === 'internacional' && (
                <p className="text-xs text-gray-400">
                  Modo Internacional: Para compras desde fuera de la UE (como China) sin IVA y ventas en España con IVA. Incluye costos adicionales como envío e impuestos de importación.
                </p>
              )}
              
              {activeTab === 'personalizado' && (
                <p className="text-xs text-gray-400">
                  Modo Personalizado: Configuración completa con control sobre tasas de IVA y costos adicionales. Muestra múltiples cálculos para comparar diferentes escenarios.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
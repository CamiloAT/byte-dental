import React from 'react';

const ProcedureDistributionChart = ({ data, totalProcedures }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <p className="text-lg mb-2">No hay datos disponibles</p>
          <p className="text-sm">Intenta ajustar los filtros o verifica que existan procedimientos registrados</p>
        </div>
      </div>
    );
  }
  
  // Función para generar colores únicos para cada procedimiento
  const getColor = (index) => {
    return `hsl(${220 + (index * 30)}, 70%, 50%)`;
  };

  // Función para generar color hover más oscuro
  const getHoverColor = (index) => {
    return `hsl(${220 + (index * 30)}, 70%, 40%)`;
  };

  return (
    <div className="h-80">
      {/* Información general */}
      <div className="mb-4 text-center">
        <p className="text-sm text-gray-600">
          Total de procedimientos: <span className="font-semibold">{totalProcedures}</span>
        </p>
      </div>

      {/* Gráfico */}
      <div className="relative h-48 border-b border-l border-gray-200 bg-gray-50">
        {/* Contenedor con altura fija para las barras */}
        <div className="absolute bottom-0 left-0 right-0 h-full flex items-end justify-around px-2 py-2">
          {data.map((item, index) => {
            // Usar el porcentaje directamente para la altura
            const heightPercentage = Math.max(item.percentage, 0);
            
            const barColor = getColor(index);
            const hoverColor = getHoverColor(index);
            
            return (
              <div 
                key={index} 
                className="flex flex-col items-center justify-end h-full"
                style={{ 
                  width: `${Math.min(85 / data.length, 20)}%`,
                  maxWidth: '120px'
                }}
              >
                {/* Contenedor de la información y la barra */}
                <div className="flex flex-col items-center w-full" style={{ height: '95%' }}>
                  {/* Espaciador flexible */}
                  <div style={{ flex: `${100 - heightPercentage}` }} />
                  
                  {/* Información encima de la barra */}
                  <div className="mb-0.5 text-center flex-shrink-0">
                    <div className="text-xs font-semibold text-gray-700">{item.quantity}</div>
                    <div className="text-xs font-medium" style={{ color: barColor }}>
                      {item.percentage.toFixed(1)}%
                    </div>
                  </div>
                  
                  {/* Barra */}
                  <div
                    className="w-full transition-all duration-200 rounded-t-sm relative group cursor-pointer flex-shrink-0"
                    style={{
                      backgroundColor: barColor,
                      height: `${heightPercentage}%`,
                      minHeight: item.quantity > 0 ? (heightPercentage < 5 ? '8px' : '12px') : '0',
                      maxHeight: '95%'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = hoverColor;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = barColor;
                    }}
                    title={`${item.procedure}: ${item.quantity} procedimientos (${item.percentage.toFixed(1)}%)`}
                  >
                    {/* Tooltip on hover */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap z-10 pointer-events-none">
                      {item.procedure}
                      <br />
                      {item.quantity} procedimientos
                      <br />
                      {item.percentage.toFixed(1)}% del total
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Etiquetas de los ejes */}
        <div className="absolute -left-9 top-1/2 transform -translate-y-1/2 -rotate-90 text-xs text-gray-600 whitespace-nowrap">
          Cantidad
        </div>
      </div>
      
      {/* Etiquetas de procedimientos debajo del gráfico - nombres completos */}
      <div className="mt-4 space-y-2 max-h-20 overflow-y-auto">
        <div className="text-center text-xs text-gray-600 font-medium mb-2">
          Tipos de Procedimientos
        </div>
        <div className="grid grid-cols-1 gap-1 px-2">
          {data.map((item, index) => (
            <div key={index} className="flex items-center text-xs">
              <div 
                className="w-3 h-3 rounded-sm mr-2 flex-shrink-0"
                style={{ backgroundColor: getColor(index) }}
              ></div>
              <div className="flex-1 text-gray-700 text-left">
                <span className="font-medium">{item.procedure}</span>
                <span className="text-gray-500 ml-1">
                  ({item.quantity} - {item.percentage.toFixed(1)}%)
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProcedureDistributionChart;
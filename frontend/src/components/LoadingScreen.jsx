import React from 'react';

const LoadingScreen = () => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Blur overlay - blurs whatever is behind it */}
      <div className="absolute inset-0 backdrop-blur-md bg-[#0b2842]/60" />
      
      {/* Spinner */}
      <div className="relative z-10 flex flex-col items-center gap-3">
        <div className="animate-spin rounded-full h-12 w-12 border-[3px] border-white/20 border-t-[#48A4D6]" />
        <p className="text-white/50 text-[12px] font-poppins">Cargando...</p>
      </div>
    </div>
  );
};

export default LoadingScreen;

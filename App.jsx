import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Wallet, 
  ArrowLeft, 
  LogOut, 
  Building2,
  LayoutDashboard
} from 'lucide-react';

// ============================================================================
// MÓDULO: ESTADO DE RESULTADO (EN BLANCO)
// ============================================================================
const EstadoResultado = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <button 
        onClick={onBack} 
        className="flex items-center gap-2 mb-6 text-gray-600 hover:text-black font-bold uppercase text-sm transition-colors"
      >
        <ArrowLeft size={18} /> Volver al Dashboard
      </button>
      
      <div className="bg-white p-8 rounded shadow-sm border-t-4 border-[#F97316]">
        <h1 className="text-2xl font-bold font-serif text-[#111827] uppercase mb-2">Estado de Resultado Integral</h1>
        <p className="text-gray-500 mb-8">Estructura en blanco. (Aquí integraremos el árbol de ingresos, costos y gastos).</p>
        
        {/* Contenedor vacío para la futura tabla */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg h-64 flex items-center justify-center bg-gray-50">
          <p className="text-gray-400 font-bold uppercase">Espacio para la tabla financiera</p>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MÓDULO: BALANCE GENERAL (EN BLANCO)
// ============================================================================
const BalanceGeneral = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <button 
        onClick={onBack} 
        className="flex items-center gap-2 mb-6 text-gray-600 hover:text-black font-bold uppercase text-sm transition-colors"
      >
        <ArrowLeft size={18} /> Volver al Dashboard
      </button>
      
      <div className="bg-white p-8 rounded shadow-sm border-t-4 border-[#111827]">
        <h1 className="text-2xl font-bold font-serif text-[#111827] uppercase mb-2">Estado de Situación Financiera</h1>
        <p className="text-gray-500 mb-8">Estructura en blanco. (Aquí integraremos los activos, pasivos y patrimonio).</p>
        
        {/* Contenedor vacío para la futura tabla */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg h-64 flex items-center justify-center bg-gray-50">
          <p className="text-gray-400 font-bold uppercase">Espacio para la tabla financiera</p>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// DASHBOARD CONTABLE
// ============================================================================
const ContDash = ({ onSelectModule, onLogout }) => {
  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      {/* HEADER */}
      <header className="bg-white border-b border-gray-300 px-8 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <Building2 size={28} className="text-[#F97316]" />
          <div>
            <h1 className="text-xl font-bold text-[#111827] uppercase tracking-tight">Servicios Jiret G&B, C.A.</h1>
            <p className="text-xs text-gray-500 font-bold uppercase">Módulo Financiero y Contable</p>
          </div>
        </div>
        <button 
          onClick={onLogout} 
          className="flex items-center gap-2 text-gray-500 hover:text-red-600 font-bold text-sm uppercase transition-colors"
        >
          <LogOut size={18} /> Salir
        </button>
      </header>

      {/* CONTENIDO DASHBOARD */}
      <main className="p-8 max-w-6xl mx-auto">
        <div className="flex items-center gap-2 mb-8">
          <LayoutDashboard size={24} className="text-gray-700" />
          <h2 className="text-2xl font-bold text-gray-800">Panel de Reportes</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* TARJETA: ESTADO DE RESULTADOS */}
          <div 
            onClick={() => onSelectModule('estado_resultado')} 
            className="bg-white p-6 rounded-lg shadow-sm cursor-pointer hover:shadow-md hover:-translate-y-1 transition-all border-t-4 border-[#F97316] group"
          >
            <div className="w-14 h-14 bg-orange-50 rounded-full flex items-center justify-center mb-4 group-hover:bg-[#F97316] transition-colors">
              <FileSpreadsheet size={28} className="text-[#F97316] group-hover:text-white" />
            </div>
            <h3 className="text-xl font-bold text-[#111827] mb-2">Estado de Resultado</h3>
            <p className="text-gray-500 text-sm">Ingresa para visualizar y estructurar el desglose de ingresos, costos operacionales y gastos administrativos.</p>
          </div>

          {/* TARJETA: BALANCE GENERAL */}
          <div 
            onClick={() => onSelectModule('balance')} 
            className="bg-white p-6 rounded-lg shadow-sm cursor-pointer hover:shadow-md hover:-translate-y-1 transition-all border-t-4 border-[#111827] group"
          >
            <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-[#111827] transition-colors">
              <Wallet size={28} className="text-[#111827] group-hover:text-white" />
            </div>
            <h3 className="text-xl font-bold text-[#111827] mb-2">Balance General</h3>
            <p className="text-gray-500 text-sm">Ingresa para estructurar los activos circulantes, pasivos por pagar y el comportamiento del patrimonio.</p>
          </div>
        </div>
      </main>
    </div>
  );
};

// ============================================================================
// COMPONENTE PRINCIPAL (ENRUTADOR)
// ============================================================================
export default function App() {
  // Estado para controlar qué pantalla se está mostrando.
  // Por defecto empezamos en 'cont_dash'.
  const [view, setView] = useState('cont_dash');

  return (
    <>
      {view === 'cont_dash' && (
        <ContDash 
          onSelectModule={(modulo) => setView(modulo)} 
          onLogout={() => alert('Regresando al login... (Lógica de Firebase en pausa)')} 
        />
      )}
      
      {view === 'estado_resultado' && (
        <EstadoResultado onBack={() => setView('cont_dash')} />
      )}
      
      {view === 'balance' && (
        <BalanceGeneral onBack={() => setView('cont_dash')} />
      )}
    </>
  );
}

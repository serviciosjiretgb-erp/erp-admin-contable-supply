import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Package, Factory, TrendingUp, TrendingDown, AlertTriangle, 
  ClipboardList, PlayCircle, History, FileText, Settings2, Trash2, 
  PlusCircle, Calculator, Plus, Users, UserPlus, LogOut, Lock, 
  ArrowDownToLine, ArrowUpFromLine, BarChart3, ShieldCheck, Box, Home, Edit, 
  Printer, X, Search, Loader2, FileCheck, Beaker, CheckCircle, CheckCircle2, 
  Receipt, ArrowRight, User, ArrowRightLeft, ClipboardEdit, Download, 
  Save, ShoppingCart, DollarSign, Landmark, Percent, Plane, FileSpreadsheet
} from 'lucide-react';

// ============================================================================
// CONFIGURACIÓN BASE DEL SISTEMA Y EMPRESA
// ============================================================================
const DEFAULT_COMPANY_CONFIG = {
  razonSocial: 'SERVICIOS JIRET G&B, C.A.',
  rif: 'J-412309374',
  direccion: 'Maracaibo, Venezuela',
  contador: 'Lic. LUIS MOISES FERRER AGUILAR C.P.C NRO 146.397',
  monedaBase: 'VES',
  monedaSistema: 'USD',
  esContribuyenteEspecial: true,
  retencionIvaPorcentaje: 75
};

const formatNum = (num, currency = '') => {
  const val = new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num || 0);
  return currency ? `${currency} ${val}` : val;
};

const getTodayDate = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};

// ============================================================================
// COMPONENTE PRINCIPAL ERP
// ============================================================================
export default function ERP() {
  // ── ESTADOS GLOBALES ──
  const [activeModule, setActiveModule] = useState('home');
  const [subModule, setSubModule] = useState('');
  
  // ── ESTADOS MULTIMONEDA ──
  const [tasaCambioDelDia, setTasaCambioDelDia] = useState(38.50); // Ejemplo tasa BCV
  const [historialTasas, setHistorialTasas] = useState([]);

  // ── DATOS (Mocks Iniciales para el entorno operativo) ──
  const [inventario, setInventario] = useState([
    { id: 'MP-001', desc: 'POLIETILENO ALTA DENSIDAD', categoria: 'Materia Prima', stock: 5000, costUSD: 1.20 },
    { id: 'PT-001', desc: 'BOLSAS TIPO CAMISETA', categoria: 'Producto Terminado', stock: 150, costUSD: 0.80 }
  ]);
  const [facturas, setFacturas] = useState([]);
  const [compras, setCompras] = useState([]);
  const [movimientosBancos, setMovimientosBancos] = useState([]);

  // ============================================================================
  // RENDERIZADO: PANEL PRINCIPAL (DASHBOARD)
  // ============================================================================
  const renderDashboard = () => {
    const mainModules = [
      { id: 'facturacion', icon: <Receipt size={40}/>, title: 'Ventas y Facturación', desc: 'Emisión, Notas de Entrega y CXC', color: 'border-blue-500', bg: 'bg-black', text: 'text-white', iconColor: 'text-blue-500', sub: 'emision' },
      { id: 'inventario', icon: <Package size={40}/>, title: 'Control de Inventario', desc: 'Kardex, Catálogo y Toma Física', color: 'border-orange-500', bg: 'bg-black', text: 'text-white', iconColor: 'text-orange-500', sub: 'catalogo' },
      { id: 'compras', icon: <ShoppingCart size={40}/>, title: 'Compras y CXP', desc: 'Órdenes, Proveedores y Pagos', color: 'border-green-500', bg: 'bg-white', text: 'text-gray-900', iconColor: 'text-green-500', sub: 'ordenes' },
      { id: 'importacion', icon: <Plane size={40}/>, title: 'Importaciones', desc: 'Tránsito, Aduanas y Nacionalización', color: 'border-purple-500', bg: 'bg-white', text: 'text-gray-900', iconColor: 'text-purple-600', sub: 'expedientes' },
      { id: 'bancos', icon: <Landmark size={40}/>, title: 'Bancos y Tesorería', desc: 'Flujo de Caja, Préstamos y Conciliación', color: 'border-emerald-500', bg: 'bg-white', text: 'text-gray-900', iconColor: 'text-emerald-600', sub: 'flujo' },
      { id: 'impuestos', icon: <Percent size={40}/>, title: 'Gestión de Impuestos', desc: 'Retenciones IVA/ISLR y Declaraciones', color: 'border-red-500', bg: 'bg-white', text: 'text-gray-900', iconColor: 'text-red-600', sub: 'retenciones' },
      { id: 'reportes', icon: <BarChart3 size={40}/>, title: 'Reportes Financieros', desc: 'Estado de Resultados y Balances', color: 'border-indigo-500', bg: 'bg-white', text: 'text-gray-900', iconColor: 'text-indigo-600', sub: 'financieros' },
      { id: 'configuracion', icon: <Settings2 size={40}/>, title: 'Configuración', desc: 'Empresa, Tasas y Usuarios', color: 'border-gray-400', bg: 'bg-white', text: 'text-gray-900', iconColor: 'text-gray-600', sub: 'general' },
    ];

    return (
      <div className="w-full max-w-7xl mx-auto py-10 animate-in fade-in">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black text-black uppercase tracking-widest">Supply ERP Multimoneda</h1>
          <div className="w-32 h-2 bg-orange-500 mx-auto mt-4 rounded-full"></div>
          <p className="mt-4 font-bold text-gray-500 uppercase tracking-widest">Tasa del Día: Bs. {formatNum(tasaCambioDelDia)} / USD</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 px-4">
          {mainModules.map((mod) => (
            <button key={mod.id} onClick={() => { setActiveModule(mod.id); setSubModule(mod.sub); }}
              className={`${mod.bg} border-l-8 ${mod.color} rounded-3xl p-8 text-left hover:scale-[1.03] transition-transform shadow-xl flex flex-col gap-4 group`}>
              <div className={`${mod.iconColor} group-hover:animate-pulse`}>{mod.icon}</div>
              <div>
                <h3 className={`text-base font-black ${mod.text} uppercase leading-tight tracking-wide`}>{mod.title}</h3>
                <p className="text-[10px] text-gray-400 mt-2 font-bold uppercase">{mod.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  };

  // ============================================================================
  // LAYOUT DE MÓDULO SECUNDARIO
  // ============================================================================
  const ModuleLayout = ({ title, icon, sidebarOptions, children }) => (
    <div className="flex h-screen bg-gray-50 animate-in slide-in-from-right-8">
      {/* Sidebar Lateral */}
      <div className="w-72 bg-black text-white flex flex-col shadow-2xl z-10">
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center gap-3 text-orange-500 mb-2">{icon} <h2 className="text-lg font-black uppercase tracking-widest text-white">{title}</h2></div>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{DEFAULT_COMPANY_CONFIG.razonSocial}</p>
        </div>
        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
          {sidebarOptions.map(opt => (
            <button key={opt.id} onClick={() => setSubModule(opt.id)}
              className={`w-full text-left px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${subModule === opt.id ? 'bg-orange-500 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
              {opt.label}
            </button>
          ))}
        </div>
        <div className="p-6 border-t border-gray-800">
          <button onClick={() => setActiveModule('home')} className="w-full flex items-center justify-center gap-2 bg-white text-black px-4 py-3 rounded-xl font-black text-xs uppercase hover:bg-gray-200 transition-colors">
            <LayoutDashboard size={16}/> Volver al Panel
          </button>
        </div>
      </div>
      {/* Contenido Central */}
      <div className="flex-1 overflow-y-auto p-10 bg-gray-50">
        {children}
      </div>
    </div>
  );

  // ============================================================================
  // MÓDULO 1: FACTURACIÓN MULTIMONEDA
  // ============================================================================
  const renderFacturacion = () => (
    <ModuleLayout title="Facturación" icon={<Receipt size={28}/>} sidebarOptions={[
      { id: 'emision', label: 'Emitir Factura' }, { id: 'historial', label: 'Historial de Ventas' }, { id: 'cxc', label: 'Cuentas por Cobrar' }
    ]}>
      {subModule === 'emision' && (
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-200">
          <h2 className="text-xl font-black uppercase text-black mb-6 border-b-2 border-blue-500 pb-2 inline-block">Nueva Factura (Multi-Moneda)</h2>
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <label className="text-[10px] font-black text-gray-500 uppercase block mb-2">Cliente</label>
              <input type="text" className="w-full border-2 border-gray-200 rounded-xl p-4 font-black uppercase outline-none focus:border-blue-500 text-xs" placeholder="RAZÓN SOCIAL O RIF" />
            </div>
            <div>
              <label className="text-[10px] font-black text-gray-500 uppercase block mb-2">Tasa de Cambio Aplicada</label>
              <div className="w-full bg-blue-50 border-2 border-blue-200 rounded-xl p-4 font-black text-blue-800 text-xs">Bs. {formatNum(tasaCambioDelDia)} / USD</div>
            </div>
          </div>
          {/* Lógica Contable Multimoneda Oculta en UI */}
          <table className="w-full border-collapse mb-6">
            <thead className="bg-gray-100 text-[10px] uppercase font-black text-gray-600 tracking-widest">
              <tr><th className="p-4 text-left">Producto</th><th className="p-4 text-center">Cant</th><th className="p-4 text-right">Precio USD</th><th className="p-4 text-right">Total USD</th><th className="p-4 text-right">Total VES</th></tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100">
                <td className="p-4 font-bold text-xs uppercase">BOLSAS TIPO CAMISETA</td><td className="p-4 text-center font-black">10</td><td className="p-4 text-right font-bold text-gray-600">$120.00</td><td className="p-4 text-right font-black text-green-600">$1,200.00</td><td className="p-4 text-right font-black text-blue-600">Bs. {formatNum(1200 * tasaCambioDelDia)}</td>
              </tr>
            </tbody>
          </table>
          <div className="flex justify-end"><button className="bg-blue-600 text-white px-10 py-4 rounded-xl font-black text-xs uppercase shadow-xl hover:bg-blue-700">Procesar Factura</button></div>
        </div>
      )}
    </ModuleLayout>
  );

  // ============================================================================
  // MÓDULO 2: INVENTARIO (CON TOMA FÍSICA ART 177)
  // ============================================================================
  const renderInventario = () => (
    <ModuleLayout title="Inventario" icon={<Package size={28}/>} sidebarOptions={[
      { id: 'catalogo', label: 'Catálogo de Productos' }, { id: 'kardex', label: 'Kardex Multimoneda' }, { id: 'tomafisica', label: 'Toma Física (Art. 177)' }
    ]}>
      {subModule === 'tomafisica' && (
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-200">
          <div className="flex justify-between items-center border-b-2 border-orange-500 pb-4 mb-6">
            <h2 className="text-xl font-black uppercase text-black">Toma Física de Inventario</h2>
            <span className="bg-gray-100 text-gray-800 px-4 py-2 rounded-xl text-[10px] font-black uppercase">Cumplimiento LISLR Art. 177</span>
          </div>
          <table className="w-full text-left text-sm border-collapse">
             <thead className="bg-gray-100 border-b-2 border-gray-200">
                <tr className="uppercase font-black text-[10px] tracking-widest text-gray-600">
                   <th className="py-4 px-4 border-r">Código / Descripción</th><th className="py-4 px-4 border-r text-center">Stock Sistema</th><th className="py-4 px-4 border-r text-center bg-orange-100 text-orange-800">Conteo Físico Real</th><th className="py-4 px-4 text-center">Diferencia</th>
                </tr>
             </thead>
             <tbody>
                {inventario.map(item => (
                   <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4 border-r font-black text-xs uppercase">{item.desc}<br/><span className="text-[10px] text-gray-500">{item.id}</span></td>
                      <td className="py-4 px-4 border-r text-center font-black text-blue-600 text-lg">{formatNum(item.stock)}</td>
                      <td className="py-3 px-4 border-r bg-orange-50/30">
                         <input type="number" className="w-full border-2 border-orange-200 rounded-xl p-3 text-center font-black text-lg outline-none focus:border-orange-500 bg-white" placeholder="-" />
                      </td>
                      <td className="py-4 px-4 text-center font-black text-gray-400">-</td>
                   </tr>
                ))}
             </tbody>
          </table>
          <div className="flex justify-end mt-6 gap-4">
             <button className="bg-white border-2 border-gray-200 text-gray-700 px-8 py-4 rounded-xl font-black text-[10px] uppercase shadow-sm hover:bg-gray-50 flex items-center gap-2"><FileSpreadsheet size={16}/> Exportar Excel 177</button>
             <button className="bg-orange-500 text-white px-8 py-4 rounded-xl font-black text-[10px] uppercase shadow-xl hover:bg-orange-600">Procesar Ajustes</button>
          </div>
        </div>
      )}
    </ModuleLayout>
  );

  // ============================================================================
  // MÓDULO 3: BANCOS Y PRÉSTAMOS
  // ============================================================================
  const renderBancos = () => (
    <ModuleLayout title="Bancos" icon={<Landmark size={28}/>} sidebarOptions={[
      { id: 'flujo', label: 'Flujo de Caja' }, { id: 'prestamos', label: 'Gestión de Préstamos' }, { id: 'conciliacion', label: 'Conciliación' }
    ]}>
      {subModule === 'prestamos' && (
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-200">
           <h2 className="text-xl font-black uppercase text-black mb-6 border-b-2 border-emerald-500 pb-2 inline-block">Amortización de Préstamos Bancarios</h2>
           <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 mb-6">
              <div className="grid grid-cols-4 gap-4 text-center">
                 <div><p className="text-[10px] font-black uppercase text-emerald-800 mb-1">Banco</p><p className="font-black text-sm uppercase">BANCARIBE</p></div>
                 <div><p className="text-[10px] font-black uppercase text-emerald-800 mb-1">Monto Otorgado</p><p className="font-black text-lg text-emerald-700">Bs. 6,500,000.00</p></div>
                 <div><p className="text-[10px] font-black uppercase text-emerald-800 mb-1">Plazo</p><p className="font-black text-sm">9 MESES</p></div>
                 <div><p className="text-[10px] font-black uppercase text-emerald-800 mb-1">Cargos SCAF</p><p className="font-black text-sm text-red-600">Aplicado</p></div>
              </div>
           </div>
           {/* Aquí iría la tabla de amortización dinámica */}
           <div className="text-center p-10 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400">
              <Calculator size={40} className="mx-auto mb-4 opacity-50"/>
              <p className="font-black text-xs uppercase tracking-widest">Módulo de cálculo de cuotas y SCAF en desarrollo</p>
           </div>
        </div>
      )}
    </ModuleLayout>
  );

  // ============================================================================
  // MÓDULO 4: IMPUESTOS (RETENCIONES)
  // ============================================================================
  const renderImpuestos = () => (
    <ModuleLayout title="Impuestos" icon={<Percent size={28}/>} sidebarOptions={[
      { id: 'retenciones', label: 'Retenciones IVA/ISLR' }, { id: 'libros', label: 'Libros de Compra/Venta' }
    ]}>
      {subModule === 'retenciones' && (
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-6 border-b-2 border-red-500 pb-4">
             <h2 className="text-xl font-black uppercase text-black">Comprobantes de Retención</h2>
             <div className="bg-red-100 text-red-800 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">Política: Retención {DEFAULT_COMPANY_CONFIG.retencionIvaPorcentaje}% (Contribuyente Especial)</div>
          </div>
          <div className="grid grid-cols-2 gap-6 mb-6">
             <button className="p-8 border-2 border-red-100 bg-red-50 rounded-2xl hover:border-red-500 transition-colors text-center group">
               <ArrowDownToLine size={32} className="text-red-400 mx-auto mb-3 group-hover:text-red-600 transition-colors"/>
               <h3 className="font-black uppercase text-red-800 text-sm">Cargar Retenciones Recibidas (Clientes)</h3>
               <p className="text-[10px] font-bold text-red-600 mt-2 uppercase">Protección de Flujo de Caja</p>
             </button>
             <button className="p-8 border-2 border-gray-200 bg-gray-50 rounded-2xl hover:border-gray-400 transition-colors text-center group">
               <ArrowUpFromLine size={32} className="text-gray-400 mx-auto mb-3 group-hover:text-gray-600 transition-colors"/>
               <h3 className="font-black uppercase text-gray-800 text-sm">Emitir Retenciones a Proveedores</h3>
               <p className="text-[10px] font-bold text-gray-500 mt-2 uppercase">Generación de TXT Seniat</p>
             </button>
          </div>
        </div>
      )}
    </ModuleLayout>
  );

  // ── CONTROLADOR DE RUTAS ──
  if (activeModule === 'home') return renderDashboard();
  if (activeModule === 'facturacion') return renderFacturacion();
  if (activeModule === 'inventario') return renderInventario();
  if (activeModule === 'bancos') return renderBancos();
  if (activeModule === 'impuestos') return renderImpuestos();

  // Vista por defecto para módulos en construcción (Compras, Importación, Reportes, Config)
  return (
    <ModuleLayout title={activeModule.toUpperCase()} icon={<Settings2 size={28}/>} sidebarOptions={[{id: 'general', label: 'Vista General'}]}>
      <div className="flex flex-col items-center justify-center h-full text-gray-400">
        <Loader2 size={60} className="animate-spin mb-6 text-orange-500"/>
        <h2 className="text-xl font-black uppercase tracking-widest text-black">Módulo en Integración</h2>
        <p className="text-xs font-bold uppercase mt-2">Construyendo arquitectura base de datos...</p>
      </div>
    </ModuleLayout>
  );
}

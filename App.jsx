import React, { useState, useMemo } from 'react';
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { 
  FileText, BookOpen, Plus, X, ArrowLeft, 
  FileDown, FileSpreadsheet, PieChart, Activity, 
  List, Layers, MinusSquare, PlusSquare, DollarSign, 
  TrendingUp, Upload, Smartphone, Coins, Zap, Hexagon, 
  CreditCard, ArrowRightLeft, Users, Receipt, Link, Calendar
} from 'lucide-react'; [cite: 1]

// --- CONFIGURACIÓN DE FIREBASE (ERP ADMIN CONTABLE SUPPLY) ---
const firebaseConfig = {
  apiKey: "AIzaSyD4fIG6D94cuwHA0ZC-diHBwWHs8woMbkc",
  authDomain: "erp-admin-contable-supply.firebaseapp.com",
  projectId: "erp-admin-contable-supply",
  storageBucket: "erp-admin-contable-supply.firebasestorage.app",
  messagingSenderId: "138985315880",
  appId: "1:138985315880:web:534e8335f763589ac91f1d",
  measurementId: "G-6N7D0QVYW7"
}; [cite: 93]

// Inicialización de servicios
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// --- DATA PRE-CARGADA ---
const rawDataString = `Comprobante	Mes	Fecha	Código	Cuenta de movimiento	Tipo	Nro Documento	CONCEPTO	Tasa	Debe Bs	Haber Bs	Saldo Bs	Debe USD	Haber USD	Saldo USD
VENTAS	febrero	2026-02-04	4.1.01.01.001	INGRESOS POR VENTAS GENERALES	FACTURAS	F00002791	C0369 ITAL FURNITURE, C.A	375.08	0.00	-40508.91	-40508.91	0.00	-108.00	-108.00
VENTAS	febrero	2026-02-04	4.1.01.01.001	INGRESOS POR VENTAS GENERALES	FACTURAS	F00002793	C0011 INVERSIONES LACTEAS SAN SIMON	375.08	0.00	-1997314.31	-2069330.15	0.00	-5325.00	-5517.00
VENTAS	febrero	2026-02-05	4.1.01.01.001	INGRESOS POR VENTAS GENERALES	FACTURAS	F00002798	C0084 ANIMAL FEED SOLUTIONS., C.A	378.46	0.00	-7998714.06	-14573944.11	0.00	-21135.00	-38562.10
VENTAS	febrero	2026-02-09	4.1.01.01.001	INGRESOS POR VENTAS GENERALES	FACTURAS	F00002805	C0002 VENILAC C.A	378.46	0.00	-3687696.70	-20533520.50	0.00	-9744.00	-54291.36
VENTAS	febrero	2026-02-12	4.1.01.01.001	INGRESOS POR VENTAS GENERALES	FACTURAS	F00002809	C0323 BIG SEAFOOD EXPORTERS, C.A	390.29	0.00	-368359.85	-23438994.38	0.00	-943.80	-61818.86
COSTOS	febrero	2026-02-04	5.1.01.01.001	COSTO DE PRODUCCIÓN Y VENTAS	FACTURAS	F00002791	C0369 ITAL FURNITURE, C.A	375.08	12767.81	0.00	12767.81	34.04	0.00	34.04
COSTOS	febrero	2026-02-04	5.1.01.01.001	COSTO DE PRODUCCIÓN Y VENTAS	FACTURAS	F00002793	C0011 INVERSIONES LACTEAS SAN SIMON	375.08	957585.62	0.00	983121.24	2553.00	0.00	2621.08
COSTOS	febrero	2026-02-05	5.1.01.01.001	COSTO DE PRODUCCIÓN Y VENTAS	FACTURAS	F00002798	C0084 ANIMAL FEED SOLUTIONS., C.A	378.46	3462892.53	0.00	6479025.54	9150.00	0.00	17144.69
COSTOS	febrero	2026-02-09	5.1.01.01.001	COSTO DE PRODUCCIÓN Y VENTAS	FACTURAS	F00002805	C0002 VENILAC C.A	378.46	1830678.01	0.00	9337337.44	4837.20	0.00	24690.76
COSTOS	febrero	2026-02-12	5.1.01.01.001	COSTO DE PRODUCCIÓN Y VENTAS	FACTURAS	F00002809	C0323 BIG SEAFOOD EXPORTERS, C.A	390.29	95309.89	0.00	10944188.39	244.20	0.00	28857.63
COMPRAS	febrero	2026-02-09	6.2.02.04.009	ALIMENTOS Y BEBIDAS	FACTURA	00004063	RESTAURANT NUEVA CHINA GOURMET, C.A	382.63	19100.00	0.00	976727.81	49.92	0.00	2595.76
BANCARIBE	febrero	2026-02-02	1.1.01.02.003	BANCARIBE	ND	00014223	PAGO RETENCION DE IVA II ENE 2026	370.25	0.00	-604997.37	-604997.37	0.00	-1634.00	-1634.01`; [cite: 2, 3]

const parseInitialData = () => {
  const rows = rawDataString.split('\n').map(row => row.split('\t'));
  return rows.slice(1).map(r => ({
    comprobante: r[0]?.trim(), mes: r[1]?.trim(), fecha: r[2]?.trim(), codigo: r[3]?.trim(), cuenta: r[4]?.trim(),
    tipo: r[5]?.trim(), nroDocumento: r[6]?.trim(), concepto: r[7]?.trim(), tasa: parseFloat(r[8])||0,
    debeBs: parseFloat(r[9])||0, haberBs: parseFloat(r[10])||0, saldoBs: parseFloat(r[11])||0,
    debeUSD: parseFloat(r[12])||0, haberUSD: parseFloat(r[13])||0, saldoUSD: parseFloat(r[14])||0
  })); [cite: 4]
}; [cite: 5]

export default function App() {
  const [isEntered, setIsEntered] = useState(false);
  const [currentView, setCurrentView] = useState('menu');
  const [comprobantes, setComprobantes] = useState(parseInitialData()); [cite: 6]
  const [currencyMode, setCurrencyMode] = useState('multi'); 
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [expandedCategories, setExpandedCategories] = useState({}); [cite: 7]

  const toggleCategory = (cat) => {
    setExpandedCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
  }; [cite: 8]

  const formatNumber = (num, minDecimals = 2) => {
    if (num === null || num === undefined || num === 0) return '-';
    return new Intl.NumberFormat('es-VE', { minimumFractionDigits: minDecimals, maximumFractionDigits: minDecimals }).format(num); [cite: 9]
  };

  const filteredComprobantes = useMemo(() => {
    return comprobantes.filter(c => {
      const f = c.fecha;
      if (!f) return true;
      if (dateFrom && f < dateFrom) return false;
      if (dateTo && f > dateTo) return false;
      return true;
    }); [cite: 10]
  }, [comprobantes, dateFrom, dateTo]);

  const reportes = useMemo(() => {
    const grouped = { activos: {}, pasivos: {}, capital: {}, ingresos: {}, costos: {}, gastos: {}, mayor: {} }; [cite: 11]

    filteredComprobantes.forEach(c => {
       const code = String(c.codigo || '').trim();
       const prefix = code.charAt(0);
       const cuenta = c.cuenta || 'Sin Cuenta Registrada';
       const debeBs = Number(c.debeBs) || 0;
       const haberBs = Number(c.haberBs) || 0;
       const debeUSD = Number(c.debeUSD) || 0;
       const haberUSD = Number(c.haberUSD) || 0; [cite: 12]
       
       const netoBs = debeBs + haberBs;
       const netoUSD = debeUSD + haberUSD;
       let targetGroup = null; let multiplier = 1;

       if (prefix === '1') { targetGroup = grouped.activos; multiplier = 1; } 
       else if (prefix === '2') { targetGroup = grouped.pasivos; multiplier = -1; } 
       else if (prefix === '3') { targetGroup = grouped.capital; multiplier = -1; } 
       else if (prefix === '4') { targetGroup = grouped.ingresos; multiplier = -1; } [cite: 13, 14]
       else if (prefix === '5') { targetGroup = grouped.costos; multiplier = 1; } [cite: 15]
       else if (prefix === '6') { targetGroup = grouped.gastos; multiplier = 1; } [cite: 16]

       if (targetGroup) {
         if (!targetGroup[cuenta]) targetGroup[cuenta] = { cuenta, bs: 0, usd: 0, rawBs: 0, rawUsd: 0, codigo: code, txs: [] };
         targetGroup[cuenta].bs += (netoBs * multiplier);
         targetGroup[cuenta].usd += (netoUSD * multiplier); [cite: 17]
         targetGroup[cuenta].rawBs += netoBs; targetGroup[cuenta].rawUsd += netoUSD;
         targetGroup[cuenta].txs.push({ ...c, impactBs: netoBs * multiplier, impactUSD: netoUSD * multiplier }); [cite: 18]
       } [cite: 19]

       if (!grouped.mayor[cuenta]) grouped.mayor[cuenta] = { cuenta, codigo: code, bs: 0, usd: 0, debeBs: 0, haberBs: 0, debeUSD: 0, haberUSD: 0, txs: [] }; [cite: 20]
       grouped.mayor[cuenta].bs += netoBs; grouped.mayor[cuenta].usd += netoUSD;
       grouped.mayor[cuenta].debeBs += debeBs; grouped.mayor[cuenta].haberBs += haberBs;
       grouped.mayor[cuenta].debeUSD += debeUSD; grouped.mayor[cuenta].haberUSD += haberUSD; [cite: 21]
       grouped.mayor[cuenta].txs.push(c);
    });

    const processGroup = (group) => {
      const list = Object.values(group)
        .filter(item => Math.abs(item.bs) > 0.01 || Math.abs(item.usd) > 0.01)
        .sort((a, b) => a.codigo.localeCompare(b.codigo));
      return { 
        list, totalBs: list.reduce((s, i) => s + i.bs, 0), totalUSD: list.reduce((s, i) => s + i.usd, 0) 
      }; [cite: 22, 23]
    };

    const ingresos = processGroup(grouped.ingresos); const activos = processGroup(grouped.activos);
    const pasivos = processGroup(grouped.pasivos); const capital = processGroup(grouped.capital); [cite: 24]
    const costos = processGroup(grouped.costos); const gastos = processGroup(grouped.gastos);
    const mayor = processGroup(grouped.mayor);
    const utilidadBs = ingresos.totalBs - costos.totalBs - gastos.totalBs;
    const utilidadUSD = ingresos.totalUSD - costos.totalUSD - gastos.totalUSD; [cite: 25]

    return {
       activos, pasivos, capital, ingresos, costos, gastos, balanceComprobacion: mayor,
       utilidadBs, utilidadUSD, patrimonioTotalBs: capital.totalBs + utilidadBs, patrimonioTotalUSD: capital.totalUSD + utilidadUSD
    }; [cite: 26]
  }, [filteredComprobantes]);

  // --- COMPONENTES DE UI ---
  const renderCover = () => (
    <div className="min-h-screen w-full flex items-center justify-center bg-black relative overflow-hidden">
      <div className="absolute w-[600px] h-[600px] bg-orange-500/10 rounded-full blur-[100px] -top-32 -left-32"></div>
      <div className="bg-white p-10 md:p-14 rounded-2xl shadow-2xl max-w-md w-full mx-4 text-center border-t-8 border-orange-500 z-10">
        <h1 className="text-5xl font-black text-black tracking-tighter uppercase">Admin Contable</h1> [cite: 32]
        <h2 className="text-2xl font-bold text-orange-500 tracking-tight mt-1 uppercase">Supply</h2>
        <div className="w-16 h-1 bg-black mx-auto my-6"></div>
        <p className="text-slate-500 font-medium mb-8 uppercase tracking-widest text-xs">Ejercicio Fiscal 2026</p> [cite: 33]
        <button onClick={() => setIsEntered(true)} className="w-full bg-orange-500 hover:bg-orange-600 text-white font-black py-4 px-4 rounded shadow-lg transition-all flex items-center justify-center gap-2">
          INGRESAR AL SISTEMA
        </button>
      </div>
    </div>
  ); [cite: 34]

  const ReportControls = ({ title, icon: Icon, showFilters = true }) => {
    const TitleIcon = Icon; [cite: 35]
    return (
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-6 bg-white p-4 rounded-xl shadow-sm border-t-4 border-orange-500 gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => setCurrentView('menu')} className="flex items-center gap-2 text-slate-500 hover:text-black font-bold transition-colors">
            <ArrowLeft className="w-5 h-5" /> Volver
          </button>
          <div className="h-6 w-px bg-slate-300"></div>
          <h2 className="text-xl font-black text-black flex items-center gap-2 uppercase">
            <TitleIcon className="text-orange-500"/> {title}
          </h2> [cite: 36]
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          {showFilters && (
            <div className="flex gap-2 items-center bg-slate-50 border border-slate-200 rounded p-1"> [cite: 37]
              <span className="text-[10px] font-bold text-slate-500 ml-2">DESDE:</span>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="bg-white border border-slate-200 text-slate-700 px-2 py-1.5 rounded text-xs font-bold outline-none cursor-pointer"/>
              <span className="text-[10px] font-bold text-slate-500 ml-2">HASTA:</span>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="bg-white border border-slate-200 text-slate-700 px-2 py-1.5 rounded text-xs font-bold outline-none cursor-pointer"/>
            </div> [cite: 38]
          )}
          <div className="flex bg-slate-100 p-1 rounded font-semibold text-xs border border-slate-200">
            <button onClick={()=>setCurrencyMode('multi')} className={`px-3 py-1.5 rounded transition-all ${currencyMode==='multi'?'bg-black text-white':'text-slate-500 hover:text-black'}`}>MULTIMONEDA</button>
            <button onClick={()=>setCurrencyMode('bs')} className={`px-3 py-1.5 rounded transition-all ${currencyMode==='bs'?'bg-orange-500 text-white':'text-slate-500 hover:text-orange-500'}`}>SOLO BS</button>
            <button onClick={()=>setCurrencyMode('usd')} className={`px-3 py-1.5 rounded transition-all ${currencyMode==='usd'?'bg-slate-500 text-white':'text-slate-500 hover:text-black'}`}>SOLO USD</button> [cite: 39]
          </div>
        </div>
      </div>
    ); [cite: 40]
  };

  const AccountPivotGroup = ({ groupTitle, data, colorClass, baseBs, baseUSD }) => {
    if (!data || !data.list || data.list.length === 0) return null; [cite: 41]
    const formatPct = (val, b) => (!b || b === 0) ? '0.0%' : `${Math.abs((val / b) * 100).toFixed(1)}%`; [cite: 42]
    return (
      <React.Fragment>
        <tr className="bg-black text-white border-y-2 border-slate-700">
          <td colSpan={currencyMode === 'multi' ? 3 : 2} className="py-3 px-4 font-black uppercase tracking-widest text-xs">{groupTitle}</td>
        </tr> [cite: 43]
        {data.list.map(acc => {
          const isExpanded = expandedCategories[`acc_${acc.codigo}`];
          return (
            <React.Fragment key={acc.codigo}>
              <tr className="border-b border-slate-200 hover:bg-orange-50 bg-white transition-colors cursor-pointer" onClick={() => toggleCategory(`acc_${acc.codigo}`)}>
                <td className="py-3 px-4 font-bold flex items-center gap-3 text-slate-800">
                  <span className="w-5 h-5 border-2 border-orange-500 rounded flex items-center justify-center text-orange-600 bg-white text-xs font-mono">{isExpanded ? '-' : '+'}</span> [cite: 44, 45]
                  <span className="font-mono text-orange-600">{acc.codigo}</span>
                  <span className="uppercase text-[13px]">{acc.cuenta}</span>
                </td>
                {(currencyMode === 'multi' || currencyMode === 'bs') && (
                  <td className={`py-3 px-4 text-right font-black ${colorClass}`}>
                    {formatNumber(acc.bs)} <span className="text-[10px] text-slate-400 ml-1 font-semibold">({formatPct(acc.bs, baseBs)})</span>
                  </td> [cite: 46, 47]
                )}
                {(currencyMode === 'multi' || currencyMode === 'usd') && (
                  <td className={`py-3 px-4 text-right font-black ${colorClass}`}>
                    {formatNumber(acc.usd)} <span className="text-[10px] text-slate-400 ml-1 font-semibold">({formatPct(acc.usd, baseUSD)})</span>
                  </td> [cite: 48, 49]
                )}
              </tr>
              {isExpanded && acc.txs.map((tx, idx) => (
                <tr key={`${acc.codigo}_tx_${idx}`} className="bg-slate-100 text-[11px] border-b border-white">
                  <td className="py-2 pl-14 text-slate-600 truncate max-w-[450px]">
                    <span className="font-mono text-slate-400 mr-2">{tx.fecha}</span>
                    <span className="font-bold text-black mr-2 uppercase">{tx.concepto}</span> [cite: 50]
                  </td>
                  {(currencyMode === 'multi' || currencyMode === 'bs') && <td className="py-2 px-4 text-right font-mono text-slate-500">{formatNumber(tx.impactBs)}</td>} [cite: 51]
                  {(currencyMode === 'multi' || currencyMode === 'usd') && <td className="py-2 px-4 text-right font-mono text-slate-500">{formatNumber(tx.impactUSD)}</td>}
                </tr>
              ))}
            </React.Fragment> [cite: 54, 55]
          );
        })}
      </React.Fragment>
    );
  };

  const renderMenuPaneles = () => (
    <div className="min-h-screen bg-slate-100 p-8 flex flex-col items-center">
      <div className="w-full max-w-6xl flex justify-between items-center mb-8 bg-black p-6 rounded-xl shadow-lg border-b-4 border-orange-500">
        <div><h2 className="text-2xl font-black text-white uppercase tracking-tighter">Panel Administrativo</h2><p className="text-orange-500 font-bold text-sm">ERP Supply 2026</p></div> [cite: 56]
        <button onClick={() => setIsEntered(false)} className="bg-white/10 text-white hover:bg-orange-500 px-4 py-2 rounded font-bold flex items-center gap-2 transition-colors"><X className="w-4 h-4" /> Salir</button>
      </div>
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 flex flex-col gap-3"> [cite: 57]
          <h3 className="font-black text-slate-400 mb-2 uppercase tracking-widest text-xs border-b border-slate-300 pb-2">Módulos Financieros</h3>
          {[
            { id: 'estado_resultados', label: 'ESTADO DE RESULTADOS', icon: Activity, bg: 'bg-orange-500', hover: 'hover:bg-orange-600' },
            { id: 'balance_general', label: 'BALANCE GENERAL', icon: BookOpen, bg: 'bg-black', hover: 'hover:bg-slate-800' }, [cite: 58, 59]
            { id: 'mayor_analitico', label: 'MAYOR ANALÍTICO', icon: List, bg: 'bg-white', text: 'text-black', border: 'border-2 border-black' }
          ].map(btn => {
            const BtnIcon = btn.icon;
            return (
              <button key={btn.id} onClick={() => setCurrentView(btn.id)} className={`${btn.bg} ${btn.hover || ''} ${btn.text || 'text-white'} ${btn.border || ''} p-4 rounded-lg shadow-md flex items-center gap-3 text-left transition-transform transform hover:translate-x-2`}>
                <BtnIcon className={`w-6 h-6 shrink-0 ${btn.id === 'mayor_analitico' ? 'text-orange-500' : ''}`} /> [cite: 60, 61]
                <span className="font-bold text-sm">{btn.label}</span>
              </button> [cite: 62]
            );
          })}
        </div>
      </div>
    </div>
  ); [cite: 63]

  if (!isEntered) return renderCover(); [cite: 82]
  if (currentView === 'menu') return renderMenuPaneles();
  if (currentView === 'estado_resultados') {
    return (
      <div className="p-6 bg-slate-100 min-h-screen">
        <div className="max-w-[1200px] mx-auto">
          <ReportControls title="Estado de Resultados (P&L)" icon={Activity} /> [cite: 84]
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-black text-white">
                <tr>
                  <th className="text-left py-5 px-6 font-black tracking-widest text-[11px] uppercase">Código / Cuenta</th> [cite: 85]
                  {(currencyMode === 'multi' || currencyMode === 'bs') && <th className="text-right py-5 px-6 font-black text-[11px] uppercase tracking-widest">Moneda Nacional (Bs)</th>}
                  {(currencyMode === 'multi' || currencyMode === 'usd') && <th className="text-right py-5 px-6 font-black text-[11px] uppercase tracking-widest">Moneda Extranjera (USD)</th>} [cite: 86]
                </tr>
              </thead>
              <tbody>
                <AccountPivotGroup groupTitle="Ingresos Operacionales" data={reportes.ingresos} colorClass="text-emerald-700" baseBs={reportes.ingresos.totalBs} baseUSD={reportes.ingresos.totalUSD} /> [cite: 87]
                <AccountPivotGroup groupTitle="Costos de Ventas" data={reportes.costos} colorClass="text-red-600" baseBs={reportes.ingresos.totalBs} baseUSD={reportes.ingresos.totalUSD} />
                <AccountPivotGroup groupTitle="Gastos Operativos" data={reportes.gastos} colorClass="text-orange-600" baseBs={reportes.ingresos.totalBs} baseUSD={reportes.ingresos.totalUSD} />
              </tbody>
              <tfoot className="bg-orange-500 text-white border-t-4 border-orange-600">
                <tr>
                  <td className="py-5 px-6 font-black uppercase text-base tracking-tighter">Utilidad / Pérdida del Ejercicio</td>
                  {(currencyMode === 'multi' || currencyMode === 'bs') && <td className="py-5 px-6 text-right font-black text-xl">{formatNumber(reportes.utilidadBs)}</td>} [cite: 88, 89]
                  {(currencyMode === 'multi' || currencyMode === 'usd') && <td className="py-5 px-6 text-right font-black text-xl">{formatNumber(reportes.utilidadUSD)}</td>}
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    ); [cite: 90, 91]
  }

  return (
    <div className="p-8 text-center bg-slate-100 min-h-screen flex flex-col items-center justify-center">
      <div className="bg-white p-12 rounded-3xl shadow-2xl border-t-8 border-orange-500 max-w-lg w-full text-center">
        <h2 className="text-3xl font-black mb-2 uppercase text-black tracking-tighter">{currentView.replace('_', ' ')}</h2>
        <h3 className="font-bold text-orange-500 mb-8 tracking-widest text-sm uppercase">Módulo en Desarrollo</h3> [cite: 92]
        <button onClick={() => setCurrentView('menu')} className="bg-black text-white px-8 py-4 rounded-xl font-black w-full hover:bg-orange-500 transition-all shadow-xl active:scale-95">VOLVER AL PANEL</button>
      </div>
    </div>
  );
}

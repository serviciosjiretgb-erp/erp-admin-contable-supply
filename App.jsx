import React, { useState, useMemo } from 'react';
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { 
  FileText, BookOpen, X, ArrowLeft, 
  FileDown, FileSpreadsheet, Activity, 
  List, Layers, DollarSign, TrendingUp, Upload
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

// Inicialización
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// --- DATA INICIAL ---
const rawDataString = `Comprobante	Mes	Fecha	Código	Cuenta de movimiento	Tipo	Nro Documento	CONCEPTO	Tasa	Debe Bs	Haber Bs	Saldo Bs	Debe USD	Haber USD	Saldo USD
VENTAS	febrero	2026-02-04	4.1.01.01.001	INGRESOS POR VENTAS GENERALES	FACTURAS	F00002791	C0369 ITAL FURNITURE, C.A	375.08	0.00	-40508.91	-40508.91	0.00	-108.00	-108.00
VENTAS	febrero	2026-02-04	4.1.01.01.001	INGRESOS POR VENTAS GENERALES	FACTURAS	F00002793	C0011 INVERSIONES LACTEAS SAN SIMON	375.08	0.00	-1997314.31	-2069330.15	0.00	-5325.00	-5517.00
COSTOS	febrero	2026-02-04	5.1.01.01.001	COSTO DE PRODUCCIÓN Y VENTAS	FACTURAS	F00002791	C0369 ITAL FURNITURE, C.A	375.08	12767.81	0.00	12767.81	34.04	0.00	34.04
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

  const formatNumber = (num, minDecimals = 2) => {
    if (!num || num === 0) return '-';
    return new Intl.NumberFormat('es-VE', { minimumFractionDigits: minDecimals, maximumFractionDigits: minDecimals }).format(num); [cite: 9]
  };

  const filteredComprobantes = useMemo(() => {
    return comprobantes.filter(c => {
      if (!c.fecha) return true;
      if (dateFrom && c.fecha < dateFrom) return false;
      if (dateTo && c.fecha > dateTo) return false;
      return true;
    }); [cite: 10]
  }, [comprobantes, dateFrom, dateTo]);

  // Cálculo de Totales para Libro Diario
  const totales = useMemo(() => {
    return filteredComprobantes.reduce((acc, curr) => ({
      debeBs: acc.debeBs + (curr.debeBs || 0),
      haberBs: acc.haberBs + (curr.haberBs || 0),
      debeUSD: acc.debeUSD + (curr.debeUSD || 0),
      haberUSD: acc.haberUSD + (curr.haberUSD || 0),
      saldoBs: acc.saldoBs + (curr.debeBs || 0) + (curr.haberBs || 0),
      saldoUSD: acc.saldoUSD + (curr.debeUSD || 0) + (curr.haberUSD || 0)
    }), { debeBs: 0, haberBs: 0, debeUSD: 0, haberUSD: 0, saldoBs: 0, saldoUSD: 0 });
  }, [filteredComprobantes]);

  const reportes = useMemo(() => {
    const grouped = { activos: {}, pasivos: {}, capital: {}, ingresos: {}, costos: {}, gastos: {}, mayor: {} }; [cite: 11]

    filteredComprobantes.forEach(c => {
       const code = String(c.codigo || '').trim();
       const prefix = code.charAt(0);
       const cuenta = c.cuenta || 'Sin Cuenta Registrada';
       const netoBs = (Number(c.debeBs) || 0) + (Number(c.haberBs) || 0);
       const netoUSD = (Number(c.debeUSD) || 0) + (Number(c.haberUSD) || 0);
       let targetGroup = null; let multiplier = 1;

       if (prefix === '1') { targetGroup = grouped.activos; multiplier = 1; } 
       else if (prefix === '2') { targetGroup = grouped.pasivos; multiplier = -1; } 
       else if (prefix === '3') { targetGroup = grouped.capital; multiplier = -1; } 
       else if (prefix === '4') { targetGroup = grouped.ingresos; multiplier = -1; } [cite: 13, 14]
       else if (prefix === '5') { targetGroup = grouped.costos; multiplier = 1; } [cite: 15]
       else if (prefix === '6') { targetGroup = grouped.gastos; multiplier = 1; } [cite: 16]

       if (targetGroup) {
         if (!targetGroup[cuenta]) targetGroup[cuenta] = { cuenta, bs: 0, usd: 0, codigo: code, txs: [] };
         targetGroup[cuenta].bs += (netoBs * multiplier);
         targetGroup[cuenta].usd += (netoUSD * multiplier); [cite: 17]
         targetGroup[cuenta].txs.push({ ...c, impactBs: netoBs * multiplier, impactUSD: netoUSD * multiplier }); [cite: 18]
       }
    });

    const processGroup = (group) => {
      const list = Object.values(group).sort((a, b) => a.codigo.localeCompare(b.codigo));
      return { list, totalBs: list.reduce((s, i) => s + i.bs, 0), totalUSD: list.reduce((s, i) => s + i.usd, 0) }; [cite: 22, 23]
    };

    const ingresos = processGroup(grouped.ingresos);
    const costos = processGroup(grouped.costos);
    const gastos = processGroup(grouped.gastos);
    const utilidadBs = ingresos.totalBs - costos.totalBs - gastos.totalBs;
    const utilidadUSD = ingresos.totalUSD - costos.totalUSD - gastos.totalUSD; [cite: 25]

    return { ingresos, costos, gastos, utilidadBs, utilidadUSD }; [cite: 26]
  }, [filteredComprobantes]);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const rows = evt.target.result.split('\n').map(row => row.split('\t')); [cite: 29]
      const parsedData = rows.slice(1).filter(r => r.length >= 14).map(r => ({
        comprobante: r[0]?.trim(), mes: r[1]?.trim(), fecha: r[2]?.trim(), codigo: r[3]?.trim(), cuenta: r[4]?.trim(),
        tipo: r[5]?.trim(), nroDocumento: r[6]?.trim(), concepto: r[7]?.trim(), 
        tasa: parseFloat(String(r[8]).replace(/[^0-9.]/g, ''))||0,
        debeBs: parseFloat(String(r[9]).replace(/[^0-9.-]/g, ''))||0,
        haberBs: parseFloat(String(r[10]).replace(/[^0-9.-]/g, ''))||0,
        debeUSD: parseFloat(String(r[12]).replace(/[^0-9.-]/g, ''))||0,
        haberUSD: parseFloat(String(r[13]).replace(/[^0-9.-]/g, ''))||0 [cite: 30]
      }));
      setComprobantes(prev => [...parsedData, ...prev]); [cite: 31]
      alert(`¡Éxito! Importados ${parsedData.length} registros.`);
    };
    reader.readAsText(file);
  };

  const renderCover = () => (
    <div className="min-h-screen w-full flex items-center justify-center bg-black relative overflow-hidden">
      <div className="bg-white p-10 rounded-2xl shadow-2xl max-w-md w-full text-center border-t-8 border-orange-500 z-10">
        <h1 className="text-5xl font-black text-black tracking-tighter uppercase">Admin Contable</h1> [cite: 32]
        <h2 className="text-2xl font-bold text-orange-500 tracking-tight mt-1 uppercase">Supply</h2>
        <p className="text-slate-500 font-medium my-6 uppercase tracking-widest text-xs">Ejercicio Fiscal 2026</p> [cite: 33]
        <button onClick={() => setIsEntered(true)} className="w-full bg-orange-500 hover:bg-orange-600 text-white font-black py-4 rounded shadow-lg transition-all">
          INGRESAR AL SISTEMA
        </button>
      </div>
    </div>
  ); [cite: 34]

  const renderMenu = () => (
    <div className="min-h-screen bg-slate-100 p-8 flex flex-col items-center">
      <div className="w-full max-w-6xl flex justify-between items-center mb-8 bg-black p-6 rounded-xl border-b-4 border-orange-500">
        <div><h2 className="text-2xl font-black text-white uppercase">Panel Administrativo</h2><p className="text-orange-500 font-bold text-sm">ERP Supply 2026</p></div> [cite: 56]
        <button onClick={() => setIsEntered(false)} className="bg-white/10 text-white px-4 py-2 rounded font-bold transition-colors">Salir</button>
      </div>
      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-6">
        <button onClick={() => setCurrentView('estado_resultados')} className="bg-orange-500 text-white p-6 rounded-xl shadow-lg hover:translate-x-2 transition-transform font-black">ESTADO DE RESULTADOS</button>
        <button onClick={() => setCurrentView('libro_diario')} className="bg-black text-white p-6 rounded-xl shadow-lg hover:translate-x-2 transition-transform font-black">LIBRO DIARIO</button>
      </div>
    </div>
  ); [cite: 63]

  const renderLibroDiario = () => (
    <div className="p-6 bg-slate-100 min-h-screen">
      <div className="max-w-[1400px] mx-auto">
        <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-xl border-t-4 border-orange-500">
          <button onClick={() => setCurrentView('menu')} className="flex items-center gap-2 font-bold"><ArrowLeft/> Volver</button>
          <label className="bg-orange-500 text-white px-6 py-2 rounded-xl font-black cursor-pointer flex items-center gap-2">
            <Upload className="w-4 h-4"/> IMPORTAR TXT
            <input type="file" className="hidden" onChange={handleFileUpload} />
          </label>
        </div>
        
        {/* Resumen de Totales */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-white p-4 rounded-xl border-l-4 border-black">
            <h3 className="font-black text-xs uppercase mb-2">Totales Bolívares (Bs.)</h3>
            <div className="flex justify-between"><span className="text-slate-500">Debe: {formatNumber(totales.debeBs)}</span><span className="text-red-600">Haber: {formatNumber(totales.haberBs)}</span></div>
          </div>
          <div className="bg-white p-4 rounded-xl border-l-4 border-orange-500">
            <h3 className="font-black text-xs uppercase mb-2">Totales Dólares (USD)</h3>
            <div className="flex justify-between"><span className="text-slate-500">Debe: {formatNumber(totales.debeUSD)}</span><span className="text-red-600">Haber: {formatNumber(totales.haberUSD)}</span></div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-xl overflow-hidden">
          <table className="w-full text-[10px] text-left">
            <thead className="bg-black text-white uppercase">
              <tr><th className="p-3">Fecha</th><th className="p-3">Cuenta</th><th className="p-3">Concepto</th><th className="p-3 text-right">Debe Bs</th><th className="p-3 text-right">Haber Bs</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredComprobantes.map((row, i) => (
                <tr key={i} className="hover:bg-orange-50">
                  <td className="p-3 font-mono">{row.fecha}</td>
                  <td className="p-3 font-black">{row.cuenta}</td>
                  <td className="p-3 uppercase truncate max-w-[200px]">{row.concepto}</td>
                  <td className="p-3 text-right">{formatNumber(row.debeBs)}</td>
                  <td className="p-3 text-right text-red-600">{formatNumber(row.haberBs)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  if (!isEntered) return renderCover(); [cite: 82]
  if (currentView === 'menu') return renderMenu();
  if (currentView === 'libro_diario') return renderLibroDiario();
  if (currentView === 'estado_resultados') {
    return (
      <div className="p-6 bg-slate-100 min-h-screen">
        <div className="max-w-[1000px] mx-auto">
          <div className="bg-white p-4 rounded-xl mb-6 flex justify-between border-t-4 border-orange-500">
            <button onClick={() => setCurrentView('menu')} className="font-bold flex items-center gap-2"><ArrowLeft/> Volver</button>
            <h2 className="font-black uppercase">Estado de Resultados (P&L)</h2>
          </div>
          <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-black text-white">
                <tr><th className="text-left p-4">Cuenta</th><th className="text-right p-4">Bolívares (Bs)</th><th className="text-right p-4">Dólares (USD)</th></tr>
              </thead>
              <tbody>
                <tr className="bg-slate-50 font-black"><td className="p-4" colSpan="3">INGRESOS</td></tr>
                {reportes.ingresos.list.map((acc, i) => (
                  <tr key={i} className="border-b"><td className="p-4 pl-8 uppercase">{acc.cuenta}</td><td className="p-4 text-right text-emerald-700">{formatNumber(acc.bs)}</td><td className="p-4 text-right text-emerald-700">{formatNumber(acc.usd)}</td></tr>
                ))}
                <tr className="bg-slate-50 font-black"><td className="p-4" colSpan="3">EGRESOS (COSTOS Y GASTOS)</td></tr>
                {reportes.costos.list.map((acc, i) => (
                  <tr key={i} className="border-b"><td className="p-4 pl-8 uppercase">{acc.cuenta}</td><td className="p-4 text-right text-red-600">{formatNumber(acc.bs)}</td><td className="p-4 text-right text-red-600">{formatNumber(acc.usd)}</td></tr>
                ))}
              </tbody>
              <tfoot className="bg-orange-500 text-white">
                <tr className="font-black text-lg"><td className="p-4">UTILIDAD DEL EJERCICIO</td><td className="p-4 text-right">{formatNumber(reportes.utilidadBs)}</td><td className="p-4 text-right">{formatNumber(reportes.utilidadUSD)}</td></tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    ); [cite: 90, 91]
  }

  return <div>Vista no encontrada</div>;
}

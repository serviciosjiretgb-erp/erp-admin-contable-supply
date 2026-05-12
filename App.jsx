import React, { useState, useMemo, useEffect } from 'react';
import { 
  ArrowLeft, Upload, CheckCircle, Scale, 
  LineChart, CalendarDays, AlertTriangle, ChevronRight, ChevronDown, Star, PlusCircle, Trash2, ArrowUpRight, ArrowDownRight, GitCompare, Landmark, FileSpreadsheet,
  FileText, Users, Briefcase, Search, BookOpen, Database, FileOutput, Printer, Download, Activity, LayoutDashboard
} from 'lucide-react';

// ============================================================================
// 0. ESTILOS DE IMPRESIÓN Y DISEÑO CORPORATIVO
// ============================================================================
const PrintStyles = () => (
  <style>{`
    @media print {
      @page { size: letter; margin: 12mm 12mm; }
      body { background-color: white !important; -webkit-print-color-adjust: exact; }
      .no-print { display: none !important; }
      .print-area { box-shadow: none !important; border: none !important; padding: 0 !important; margin: 0 auto !important; width: 100% !important; max-width: 100% !important; }
      table { page-break-inside: auto; width: 100% !important; table-layout: fixed; border-collapse: collapse; }
      tr { page-break-inside: avoid; page-break-after: auto; }
      thead { display: table-header-group; }
      th, td { word-wrap: break-word; overflow: hidden; padding: 8px 4px !important; }
    }
  `}</style>
);

const HeaderMembretado = ({ isExport = false }) => (
  <div className={`${isExport ? 'flex' : 'hidden print:flex'} w-full justify-between items-end border-b-[3px] border-orange-500 pb-3 mb-6 pt-4 px-2 bg-white`}>
    <div>
      <p className="text-slate-400 text-lg mb-1 leading-none font-bold">Supply</p>
      <h1 className="text-5xl font-black leading-none tracking-tight text-black">G<span className="text-orange-500">&</span>B</h1>
    </div>
    <div className="text-right">
      <h2 className="text-lg font-black uppercase text-black tracking-widest">SERVICIOS JIRET G&B, C.A.</h2>
      <p className="text-xs font-bold text-slate-700">RIF: J-412309374</p>
      <p className="text-[10px] text-slate-500 mt-1 uppercase">AV CIRCUNVALACION NRO 02 C.C EL DIVIDIVI LOCAL G-9 PB</p>
      <p className="text-[10px] text-slate-500 uppercase">MARACAIBO - EDO. ZULIA</p>
    </div>
  </div>
);

// ============================================================================
// 1. MOTOR DE EXPORTACIÓN EXCEL (SEGURO - NO PISA DATOS)
// ============================================================================
const handleExportExcel = (tableId, fileName, reportTitle) => {
  if (!window.XLSX) { alert("Cargando librería de Excel..."); return; }
  const table = document.getElementById(tableId);
  const wsTable = window.XLSX.utils.table_to_sheet(table);
  const tableData = window.XLSX.utils.sheet_to_json(wsTable, { header: 1 });

  const headerData = [
    ["SERVICIOS JIRET G&B, C.A."],
    ["RIF: J-412309374"],
    [reportTitle ? reportTitle.toUpperCase() : fileName.toUpperCase()],
    [`Fecha de reporte: ${new Date().toLocaleDateString()}`],
    [] 
  ];

  const finalData = [...headerData, ...tableData];
  const ws = window.XLSX.utils.aoa_to_sheet(finalData);
  ws['!cols'] = [{ wch: 55 }, { wch: 18 }, { wch: 18 }, { wch: 12 }, { wch: 12 }];

  const wb = window.XLSX.utils.book_new();
  window.XLSX.utils.book_append_sheet(wb, ws, "Reporte");
  window.XLSX.writeFile(wb, `${fileName}.xlsx`);
};

// ============================================================================
// 2. PROCESADORES DE DATOS (ANTI-PANTALLA BLANCA)
// ============================================================================
const loadSheetJS = () => new Promise((r) => {
  if (window.XLSX) return r(window.XLSX);
  const s = document.createElement('script');
  s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
  s.onload = () => r(window.XLSX);
  document.head.appendChild(s);
});

const monthOrder = { "Saldos Iniciales": 0, "Enero": 1, "Febrero": 2, "Marzo": 3, "Abril": 4, "Mayo": 5, "Junio": 6, "Julio": 7, "Agosto": 8, "Septiembre": 9, "Octubre": 10, "Noviembre": 11, "Diciembre": 12 };

const processFiles = async (files) => {
  let allParsedData = [];
  const detectMonth = (n) => {
    const m = (n||'').match(/(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)/i);
    return m ? m[0].charAt(0).toUpperCase() + m[0].slice(1).toLowerCase() : 'Enero';
  };
  const detectYear = (n) => { const y = (n||'').match(/20\d{2}/); return y ? y[0] : new Date().getFullYear().toString(); };

  const XL = await loadSheetJS();
  for (const file of Array.from(files)) {
    const month = detectMonth(file.name);
    const year = detectYear(file.name);
    const buffer = await file.arrayBuffer();
    const wb = XL.read(buffer, { type: 'array' });
    const rows = XL.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, defval: null });

    let pathStack = [];
    const parseVal = (v) => {
      if (v === null || v === undefined || v === '') return null;
      if (typeof v === 'number') return v;
      let s = String(v).replace(/\$|Bs\./ig, '').trim();
      if (s.includes(',') && s.includes('.')) s = s.replace(/,/g, '');
      else if (s.includes(',') && !s.includes('.')) s = s.replace(/,/g, '.');
      return isNaN(parseFloat(s)) ? null : parseFloat(s);
    };

    rows.forEach(row => {
      if (!row || row.length === 0) return;
      const name = row[0] != null ? String(row[0]).trim() : '';
      if (!name || name.includes('Etiquetas') || name.includes('RESULTADO')) return;
      if (name.startsWith('Total ')) {
        const what = name.replace(/^Total\s+/i, '').trim().toUpperCase();
        let idx = pathStack.length - 1;
        while (idx >= 0) { if ((pathStack[idx]||'').toUpperCase() === what) { pathStack.splice(idx); break; } idx--; }
        return;
      }
      const usd = parseVal(row[1]);
      const bs = parseVal(row[2]);
      if (usd !== null) {
        allParsedData.push({ month, year, path: pathStack.join('>'), name: name, usd, bs: bs || 0 });
      } else {
        pathStack.push(name);
      }
    });
  }
  return allParsedData;
};

const processPlanCuentas = async (file) => {
  const text = await file.text();
  const plan = {};
  text.split(/\r?\n/).forEach(line => {
    const cols = line.split('\t');
    if (cols.length >= 5 && cols[0].trim() !== 'Código') {
      plan[cols[1].trim()] = `${cols[2].trim()}>${cols[3].trim()}>${cols[4].trim()}`;
    }
  });
  return plan;
};

const processSaldosBalance = async (file, planCuentas) => {
  const XL = await loadSheetJS();
  const buffer = await file.arrayBuffer();
  const wb = XL.read(buffer, { type: 'array' });
  const rows = XL.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, defval: null });
  const yearMatch = file.name.match(/20\d{2}/);
  const year = yearMatch ? yearMatch[0] : new Date().getFullYear().toString();

  const parseVal = (v) => {
    if (!v) return 0;
    if (typeof v === 'number') return v;
    let s = String(v).replace(/USD|Bs\./ig, '').trim();
    if (s.includes(',') && s.includes('.')) s = s.replace(/\./g, '').replace(/,/g, '.');
    else if (s.includes(',')) s = s.replace(/,/g, '.');
    return isNaN(parseFloat(s)) ? 0 : parseFloat(s);
  };

  return rows.filter((r, i) => i > 0 && r[0]).map(row => {
    const rawName = String(row[0]).trim();
    // REGLA CLAVE: Ignorar montos de CxC y CxP del archivo de saldos para evitar duplicidad
    const isAuxAccount = rawName.startsWith('1.1.02') || rawName.startsWith('2.1.01');
    
    let path = planCuentas[rawName];
    if (!path) {
      if (rawName.startsWith('1.')) path = 'ACTIVOS>OTROS ACTIVOS';
      else if (rawName.startsWith('2.')) path = 'PASIVOS>OTROS PASIVOS';
      else if (rawName.startsWith('3.')) path = 'PATRIMONIO>CAPITAL';
      else path = 'OTROS';
    }

    return {
      month: 'Saldos Iniciales', year, path, name: rawName,
      usd: isAuxAccount ? 0 : parseVal(row[1]),
      bs: isAuxAccount ? 0 : parseVal(row[2])
    };
  });
};

const processAuxFile = async (files) => {
  const result = {}; 
  const XL = await loadSheetJS();
  const parseVal = (v) => {
    if (!v) return 0;
    if (typeof v === 'number') return v;
    let s = String(v).replace(/\$|Bs\.|USD/ig, '').trim();
    if (s.includes(',') && s.includes('.')) s = s.replace(/\./g, '').replace(/,/g, '.');
    else if (s.includes(',')) s = s.replace(/,/g, '.');
    return isNaN(parseFloat(s)) ? 0 : parseFloat(s);
  };

  for (const file of Array.from(files)) {
    const buffer = await file.arrayBuffer();
    const wb = XL.read(buffer, { type: 'array' });
    for (const sheetName of wb.SheetNames) {
      const rows = XL.utils.sheet_to_json(wb.Sheets[sheetName], { defval: null });
      rows.forEach(rawRow => {
        const row = {};
        for (const k in rawRow) { row[k.trim().toLowerCase()] = rawRow[k]; }
        const cc = row['cuenta contable'];
        if (!cc) return;
        const code = cc.split('-')[0].trim();
        if (!result[code]) result[code] = { label: cc.replace(code, '').replace(/^[- ]+/, '').trim(), records: [] };
        result[code].records.push({
          cod: row['código'] || row['codigo'] || '-',
          nombre: row['descripción'] || row['descripcion'] || '-',
          operacion: row['operación'] || row['operacion'] || '-',
          vence: row['vencimiento'] || '-',
          monto: parseVal(row['monto']),
          cuentaContable: cc
        });
      });
    }
  }
  return result;
};

// ============================================================================
// 3. COMPONENTE: FILA DESPLEGABLE (RESTAURADA E INTACTA)
// ============================================================================
const ExpandableRow = ({ node, level = 0, totalBaseUSD, defaultOpen = false, highlightedAccounts, toggleHighlight, onShowReport, isBalance = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  useEffect(() => setIsOpen(defaultOpen), [defaultOpen]);
  
  if (!node) return null;
  const isLeaf = !node.c || node.c.length === 0;
  const accountCode = (node.n || '').split('-')[0].trim();
  const hasMapping = isBalance && /^\d[\d\.]+$/.test(accountCode);
  const fmt = (v) => new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2 }).format(v || 0);
  const indent = { paddingLeft: `${level * 18 + 10}px` };

  if (!isLeaf && !/^\d\./.test(node.n || '')) {
    const isRoot = level === 0;
    return (
      <>
        <tr className={isRoot ? 'bg-slate-50 border-b border-slate-200' : 'bg-white border-b border-slate-100'}>
          <td style={indent} className={`py-3 px-3 font-black text-xs uppercase tracking-widest ${isRoot ? 'text-slate-800' : 'text-slate-500'}`}>{node.n}</td>
          <td colSpan={3} />
        </tr>
        {isOpen && node.c.map((child, i) => <ExpandableRow key={i} node={child} level={level+1} totalBaseUSD={totalBaseUSD} highlightedAccounts={highlightedAccounts} toggleHighlight={toggleHighlight} onShowReport={onShowReport} isBalance={isBalance}/>)}
        {isOpen && (
          <tr className="bg-slate-100/50 font-black text-[10px] border-t border-slate-200 shadow-inner">
            <td style={{ paddingLeft: level * 18 + 28 }} className="py-2 px-3 uppercase text-slate-500">TOTAL {node.n}</td>
            <td className="py-2 px-3 text-right font-mono text-slate-900">{fmt(Math.abs(node.u))}</td>
            <td className="py-2 px-3 text-right font-mono hidden sm:table-cell text-slate-900">{fmt(Math.abs(node.b))}</td>
            <td className="py-2 px-3 text-right font-mono text-slate-400">{(Math.abs(node.u)/Math.abs(totalBaseUSD||1)*100).toFixed(2)}%</td>
          </tr>
        )}
        {!isOpen && isRoot && (
           <tr className="bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => setIsOpen(true)}>
             <td style={indent} className="py-2.5 px-3 font-black text-xs uppercase flex items-center gap-2">
               <span className="w-4 h-4 border border-slate-300 rounded bg-white text-center leading-none text-[10px] text-slate-500">+</span> {node.n}
             </td>
             <td className="py-2.5 px-3 text-right font-mono font-black text-slate-800">{fmt(Math.abs(node.u))}</td><td colSpan={2}/>
           </tr>
        )}
      </>
    );
  }

  const isHigh = highlightedAccounts?.has(node.n);
  return (
    <tr onClick={() => !isLeaf && setIsOpen(!isOpen)} className={`border-b border-slate-50 hover:bg-slate-50 transition-all cursor-pointer ${isHigh ? 'bg-amber-50 border-l-4 border-amber-500' : 'bg-white border-l-4 border-transparent'}`}>
      <td style={indent} className="py-2.5 px-3 font-bold text-[11px] text-slate-700 uppercase flex items-center gap-2">
        {!isLeaf && <span className="no-print w-4 h-4 border border-slate-300 rounded bg-white text-center leading-none text-[10px] text-slate-500">{isOpen ? '−' : '+'}</span>}
        <button onClick={(e) => {e.stopPropagation(); toggleHighlight(node.n)}} className="no-print focus:outline-none"><Star size={14} fill={isHigh?"#f59e0b":"none"} color={isHigh?"#f59e0b":"#cbd5e1"}/></button>
        <span className="truncate max-w-[280px]">{node.n}</span>
        {hasMapping && <button onClick={(e)=>{e.stopPropagation(); onShowReport(accountCode)}} className="no-print ml-2 px-2 py-0.5 bg-slate-800 text-white text-[9px] rounded font-black hover:bg-orange-500 shadow-sm transition-colors">AUX</button>}
      </td>
      <td className="py-2.5 px-3 text-right font-mono text-[11px] text-slate-600">{fmt(Math.abs(node.u))}</td>
      <td className="py-2.5 px-3 text-right font-mono text-[11px] hidden sm:table-cell text-slate-600">{fmt(Math.abs(node.b))}</td>
      <td className="py-2.5 px-3 text-right font-mono text-[11px] text-slate-400">{(Math.abs(node.u)/Math.abs(totalBaseUSD||1)*100).toFixed(2)}%</td>
    </tr>
  );
};
// ============================================================================
// 4. VISTA: ESTADO DE RESULTADOS
// ============================================================================
function EstadoResultadoView({ onBack, dbData }) {
  const availableYears = useMemo(() => [...new Set(dbData.map(d => d.year))].filter(Boolean).sort(), [dbData]);
  const [selectedYear, setSelectedYear] = useState(availableYears[availableYears.length - 1] || new Date().getFullYear().toString());
  const availableMonths = useMemo(() => [...new Set(dbData.filter(d => d.year === selectedYear).map(d => d.month))].filter(m=>m!=='Sin Mes' && m!=='Saldos Iniciales'), [dbData, selectedYear]);
  const [selectedMonth, setSelectedMonth] = useState('General');
  const [defaultOpen, setDefaultOpen] = useState(false);
  const [expandKey, setExpandKey] = useState(0);

  const { trees, totals } = useMemo(() => {
    const data = selectedMonth === 'General' ? dbData.filter(d=>d.year===selectedYear && d.month !== 'Saldos Iniciales') : dbData.filter(d=>d.year===selectedYear && d.month===selectedMonth);
    const resData = data.filter(i => !i.path?.toUpperCase().includes('ACTIVO') && !i.path?.toUpperCase().includes('PASIVO') && !/^[123]/.test(i.name||''));
    
    const build = (arr, mult = 1) => {
      const root = [];
      arr.forEach(i => {
        let cur = root;
        const path = (i.path || 'OTROS').split('>');
        path.forEach(f => {
          let folder = cur.find(n => n.n === f);
          if (!folder) { folder = { n: f, c: [], u: 0, b: 0 }; cur.push(folder); }
          cur = folder.c;
        });
        let leaf = cur.find(n => n.n === i.name);
        if (!leaf) cur.push({ n: i.name, u: i.usd*mult, b: i.bs*mult, isLeaf: true });
        else { leaf.u += i.usd*mult; leaf.b += i.bs*mult; }
      });
      const comp = (nodes) => {
        let u=0, b=0; nodes.forEach(n => { if(!n.isLeaf){ const t=comp(n.c); n.u=t.u; n.b=t.b; } u+=n.u; b+=n.b; });
        return {u, b};
      };
      comp(root); return root;
    };

    const isIng = i => (i.path||'').toUpperCase().includes('INGRESO') || (i.name||'').startsWith('4');
    const isCos = i => (i.path||'').toUpperCase().includes('COSTO') || (i.name||'').startsWith('5');
    const tIng = build(resData.filter(isIng), -1); 
    const tCos = build(resData.filter(isCos));
    const tGas = build(resData.filter(i => !isIng(i) && !isCos(i)));

    const s = (n) => n.reduce((a,c)=>a+c.u, 0);
    const ti=s(tIng), tc=s(tCos), tg=s(tGas);
    return { trees: { tIng, tCos, tGas }, totals: { ti, tc, tg, ub: ti-tc, un: (ti-tc)-tg } };
  }, [dbData, selectedMonth, selectedYear]);

  const fmtR = (v) => new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);

  return (
    <div className="min-h-screen bg-[#f8fafc] print:bg-white pb-20">
      <PrintStyles />
      <header className="no-print bg-white/90 backdrop-blur border-b border-slate-200 p-4 flex justify-between items-center sticky top-0 z-30 shadow-sm flex-wrap gap-4">
        <button onClick={onBack} className="flex items-center gap-2 font-black text-xs text-slate-500 uppercase hover:text-slate-900"><ArrowLeft size={16}/> Panel</button>
        <div className="flex gap-2 items-center">
          <select value={selectedYear} onChange={e=>setSelectedYear(e.target.value)} className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded p-1.5 font-bold outline-none">{availableYears.map(y=><option key={y}>{y}</option>)}</select>
          <select value={selectedMonth} onChange={e=>setSelectedMonth(e.target.value)} className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded p-1.5 font-bold outline-none"><option value="General">Acumulado</option>{availableMonths.map(m=><option key={m}>{m}</option>)}</select>
          <span className="text-slate-300 mx-2">|</span>
          <button onClick={() => { setDefaultOpen(true); setExpandKey(k=>k+1); }} className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase flex items-center gap-1 hover:bg-slate-200"><ChevronDown size={14}/> Expandir</button>
          <button onClick={() => { setDefaultOpen(false); setExpandKey(k=>k+1); }} className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase flex items-center gap-1 hover:bg-slate-200"><ChevronRight size={14}/> Contraer</button>
          <span className="text-slate-300 mx-2">|</span>
          <button onClick={()=>window.print()} className="px-3 py-1.5 bg-slate-800 text-white rounded text-[10px] font-black uppercase"><Printer size={14}/></button>
          <button onClick={()=>handleExportExcel('table-res', `Estado_Resultados_${selectedMonth}`, `Estado de Resultados`)} className="px-3 py-1.5 bg-emerald-700 text-white rounded text-[10px] font-black uppercase"><Download size={14}/></button>
        </div>
      </header>
      <main className="p-4 md:p-8 max-w-5xl mx-auto">
        <HeaderMembretado isExport={true}/>
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
          <table id="table-res" className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase border-b border-slate-200">
              <tr><th className="px-5 py-5 w-[55%]">Cuentas</th><th className="px-4 py-5 text-right">Saldo USD</th><th className="px-4 py-5 text-right hidden sm:table-cell">Saldo Bs.</th><th className="px-4 py-5 text-right">%</th></tr>
            </thead>
            <tbody key={expandKey}>
              <tr className="bg-white border-b border-slate-100 font-black text-xs uppercase"><td colSpan={4} className="p-5">I. INGRESOS</td></tr>
              {trees.tIng.map((n,i)=><ExpandableRow key={i} node={n} totalBaseUSD={totals.ti} defaultOpen={defaultOpen}/>)}
              <tr className="bg-slate-50 text-slate-800 font-black border-y-2 border-slate-200"><td className="p-4 pl-8 text-[11px] uppercase tracking-widest">TOTAL INGRESOS</td><td className="p-4 text-right font-mono">{fmtR(totals.ti)}</td><td className="hidden sm:table-cell p-4 text-right font-mono">{fmtR(totals.ti*45)}</td><td className="p-4 text-right font-mono">100%</td></tr>

              <tr className="bg-white border-b border-slate-100 font-black text-xs uppercase"><td colSpan={4} className="p-5 pt-8">II. COSTOS DE VENTA</td></tr>
              {trees.tCos.map((n,i)=><ExpandableRow key={i} node={n} totalBaseUSD={totals.ti} defaultOpen={defaultOpen}/>)}
              <tr className="bg-slate-50 text-slate-800 font-black border-y-2 border-slate-200"><td className="p-4 pl-8 text-[11px] uppercase tracking-widest">TOTAL COSTOS</td><td className="p-4 text-right font-mono">{fmtR(totals.tc)}</td><td className="hidden sm:table-cell p-4 text-right font-mono">{fmtR(totals.tc*45)}</td><td className="p-4 text-right font-mono">{(totals.tc/(totals.ti||1)*100).toFixed(2)}%</td></tr>

              <tr className="bg-slate-900 text-white font-black border-y-4 border-slate-400"><td className="p-6 uppercase text-sm tracking-widest">III. UTILIDAD BRUTA</td><td className={`p-6 text-right text-base font-mono ${totals.ub < 0 ? 'text-red-400':'text-emerald-400'}`}>{fmtR(totals.ub)}</td><td className="hidden sm:table-cell"/><td className="p-6 text-right font-mono">{(Math.abs(totals.ub)/(totals.ti||1)*100).toFixed(2)}%</td></tr>

              <tr className="bg-white border-b border-slate-100 font-black text-xs uppercase"><td colSpan={4} className="p-5 pt-8">IV. GASTOS OPERATIVOS</td></tr>
              {trees.tGas.map((n,i)=><ExpandableRow key={i} node={n} totalBaseUSD={totals.ti} defaultOpen={defaultOpen}/>)}
              <tr className="bg-slate-50 text-slate-800 font-black border-y-2 border-slate-200"><td className="p-4 pl-8 text-[11px] uppercase tracking-widest">TOTAL GASTOS</td><td className="p-4 text-right font-mono">{fmtR(totals.tg)}</td><td className="hidden sm:table-cell p-4 text-right font-mono">{fmtR(totals.tg*45)}</td><td className="p-4 text-right font-mono">{(totals.tg/(totals.ti||1)*100).toFixed(2)}%</td></tr>

              <tr className="bg-black text-white font-black border-t-4 border-orange-500"><td className="p-8 uppercase text-sm tracking-widest">V. RESULTADO NETO</td><td className={`p-8 text-right text-xl font-mono ${totals.un < 0 ? 'text-red-500':'text-orange-500'}`}>{fmtR(totals.un)}</td><td className="hidden sm:table-cell"/><td className="p-8 text-right font-mono text-slate-400">{(Math.abs(totals.un)/(totals.ti||1)*100).toFixed(2)}%</td></tr>
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

// ============================================================================
// 5. VISTA: ANÁLISIS COMPARATIVO
// ============================================================================
function AnalisisComparativoView({ onBack, dbData }) {
  const availableYears = useMemo(() => [...new Set(dbData.map(d => d.year))].filter(Boolean).sort(), [dbData]);
  const [year1, setYear1] = useState(availableYears[availableYears.length - 1] || '2026');
  const [year2, setYear2] = useState(availableYears[availableYears.length - 1] || '2026');
  
  const getMonths = (y) => [...new Set(dbData.filter(d=>d.year===y).map(d => d.month))].filter(m => m !== 'Sin Mes' && m !== 'Saldos Iniciales');
  const months1 = getMonths(year1); const months2 = getMonths(year2);
  
  const [month1, setMonth1] = useState(months1[0] || '');
  const [month2, setMonth2] = useState(months2[1] || months2[0] || '');

  useEffect(() => { setMonth1(getMonths(year1)[0] || ''); }, [year1]);
  useEffect(() => { setMonth2(getMonths(year2)[1] || getMonths(year2)[0] || ''); }, [year2]);

  const tree = useMemo(() => {
    const root = [];
    const m1Data = dbData.filter(d => d.year === year1 && d.month === month1 && !d.path?.toUpperCase().includes('ACTIVO') && !d.path?.toUpperCase().includes('PASIVO') && !d.path?.toUpperCase().includes('PATRIMONIO'));
    const m2Data = dbData.filter(d => d.year === year2 && d.month === month2 && !d.path?.toUpperCase().includes('ACTIVO') && !d.path?.toUpperCase().includes('PASIVO') && !d.path?.toUpperCase().includes('PATRIMONIO'));

    const processItem = (item, isM1) => {
      const pathParts = (item.path || '').split('>');
      const mainCategory = pathParts[0] ? pathParts[0].trim().toUpperCase() : 'OTROS';
      let accountOriginalName = pathParts.length > 1 ? pathParts[pathParts.length - 1].trim() : String(item.name || '').trim();
      if (!/^(\d[\d\.]+)/.test(accountOriginalName) && /^(\d[\d\.]+)/.test(String(item.name||'').trim())) accountOriginalName = item.name.trim();
      const matchKey = accountOriginalName.match(/^(\d[\d\.]+)/);
      const accountKey = matchKey ? matchKey[1] : accountOriginalName.toUpperCase();

      let categoryNode = root.find(n => n.key === mainCategory);
      if (!categoryNode) { categoryNode = { key: mainCategory, n: pathParts[0] ? pathParts[0].trim().toUpperCase() : 'OTROS', c: [], m1_u: 0, m2_u: 0 }; root.push(categoryNode); }
      let accountNode = categoryNode.c.find(n => n.key === accountKey);
      if (!accountNode) { accountNode = { key: accountKey, n: accountOriginalName, m1_u: 0, m2_u: 0 }; categoryNode.c.push(accountNode); }

      if (isM1) accountNode.m1_u += item.usd; else accountNode.m2_u += item.usd;
    };

    m1Data.forEach(item => processItem(item, true));
    m2Data.forEach(item => processItem(item, false));

    root.forEach(cat => {
      let cat_m1 = 0, cat_m2 = 0;
      const isIngreso = cat.n.includes('INGRESO') || cat.n.includes('VENTA') || cat.key?.startsWith('4');
      const multiplier = isIngreso ? -1 : 1;

      cat.c.forEach(acc => { acc.m1_u *= multiplier; acc.m2_u *= multiplier; cat_m1 += acc.m1_u; cat_m2 += acc.m2_u; });
      cat.m1_u = cat_m1; cat.m2_u = cat_m2;
    });

    return root;
  }, [dbData, month1, year1, month2, year2]);

  let total_m1 = 0, total_m2 = 0;
  tree.forEach(cat => {
    const isIngreso = cat.n.includes('INGRESO') || cat.n.includes('VENTA') || (cat.key && cat.key.startsWith('4'));
    if (isIngreso) { total_m1 += cat.m1_u; total_m2 += cat.m2_u; } else { total_m1 -= cat.m1_u; total_m2 -= cat.m2_u; }
  });

  const varAbsTotal = total_m1 - total_m2;
  const varPctTotal = total_m2 !== 0 ? (varAbsTotal / Math.abs(total_m2)) * 100 : (total_m1 !== 0 ? 100 : 0);
  const fmtR = (v) => new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);

  return (
    <div className="min-h-screen bg-[#f8fafc] print:bg-white pb-20">
      <PrintStyles />
      <header className="no-print bg-white/90 backdrop-blur border-b border-slate-200 p-4 flex justify-between items-center sticky top-0 z-30 shadow-sm flex-wrap gap-2">
        <button onClick={onBack} className="flex items-center gap-2 font-black text-xs text-slate-500 uppercase hover:text-slate-900"><ArrowLeft size={16}/> Panel</button>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-400">Base:</span>
          <select value={year1} onChange={(e) => setYear1(e.target.value)} className="bg-slate-50 border border-slate-200 rounded p-1.5 font-bold outline-none text-xs">{availableYears.map(y=><option key={y}>{y}</option>)}</select>
          <select value={month1} onChange={(e) => setMonth1(e.target.value)} className="bg-slate-50 border border-slate-200 rounded p-1.5 font-bold outline-none text-xs">{months1.map(m => <option key={m}>{m}</option>)}</select>
          <span className="mx-2 text-slate-300">VS</span>
          <span className="text-xs font-bold text-slate-400">Comp:</span>
          <select value={year2} onChange={(e) => setYear2(e.target.value)} className="bg-slate-50 border border-slate-200 rounded p-1.5 font-bold outline-none text-xs">{availableYears.map(y=><option key={y}>{y}</option>)}</select>
          <select value={month2} onChange={(e) => setMonth2(e.target.value)} className="bg-slate-50 border border-slate-200 rounded p-1.5 font-bold outline-none text-xs">{months2.map(m => <option key={m}>{m}</option>)}</select>
          <span className="mx-2 text-slate-300">|</span>
          <button onClick={() => window.print()} className="px-3 py-1.5 bg-slate-800 text-white rounded text-[10px] font-black uppercase"><Printer size={14}/></button>
          <button onClick={() => handleExportExcel('table-comparativo', `Comparativo`, `Análisis Comparativo`)} className="px-3 py-1.5 bg-emerald-700 text-white rounded text-[10px] font-black uppercase"><Download size={14}/></button>
        </div>
      </header>
      <main className="p-4 md:p-8 max-w-5xl mx-auto">
        <HeaderMembretado isExport={true} />
        {!month1 || !month2 ? (
          <div className="bg-white p-12 text-center rounded-3xl border border-slate-200 shadow-xl"><AlertTriangle className="mx-auto text-orange-400 mb-4" size={48}/><p className="text-slate-500 font-black text-sm uppercase tracking-wider">Faltan datos para comparar.</p></div>
        ) : (
          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
            <table id="table-comparativo" className="w-full text-left border-collapse">
              <thead className="bg-slate-50 text-[10px] uppercase font-black text-slate-400 border-b border-slate-200">
                <tr><th className="p-5">Estructura</th><th className="p-5 text-right">📅 {month1}</th><th className="p-5 text-right">📅 {month2}</th><th className="p-5 text-right">Var. Abs</th><th className="p-5 text-right">%</th></tr>
              </thead>
              <tbody>
                {tree.map((cat, i) => {
                  const isIngreso = cat.n.includes('INGRESO') || (cat.key && cat.key.startsWith('4'));
                  const cGood = isIngreso ? (cat.m1_u - cat.m2_u) > 0 : (cat.m1_u - cat.m2_u) < 0;
                  return (
                    <React.Fragment key={i}>
                      <tr className="bg-slate-50 font-black text-xs"><td className="p-4 uppercase text-slate-800">{cat.n}</td><td colSpan={4}/></tr>
                      {cat.c.sort((a,b)=>String(a.n).localeCompare(String(b.n))).map((acc, j) => {
                        const vA = acc.m1_u - acc.m2_u;
                        const vP = acc.m2_u !== 0 ? (vA/Math.abs(acc.m2_u))*100 : (acc.m1_u !== 0 ? 100 : 0);
                        const good = isIngreso ? vA > 0 : vA < 0;
                        return (
                          <tr key={j} className="border-b border-slate-50 hover:bg-slate-50">
                            <td className="p-3 pl-8 text-[11px] font-bold text-slate-600 truncate max-w-xs">{acc.n}</td>
                            <td className="p-3 text-right font-mono text-[11px]">{fmtR(acc.m1_u)}</td>
                            <td className="p-3 text-right font-mono text-[11px] font-bold bg-slate-50/50">{fmtR(acc.m2_u)}</td>
                            <td className={`p-3 text-right font-mono text-[11px] font-bold ${good ? 'text-emerald-500':'text-red-500'}`}>{vA>0?'+':''}{fmtR(vA)}</td>
                            <td className={`p-3 text-right font-mono text-[11px] font-bold ${good ? 'text-emerald-500':'text-red-500'}`}>{Math.abs(vP).toFixed(2)}%</td>
                          </tr>
                        );
                      })}
                      <tr className="bg-slate-100 font-black text-[11px] border-y border-slate-200">
                        <td className="p-4 pl-8 uppercase">TOTAL {cat.n}</td>
                        <td className="p-4 text-right font-mono">{fmtR(cat.m1_u)}</td><td className="p-4 text-right font-mono bg-slate-200/50">{fmtR(cat.m2_u)}</td>
                        <td className={`p-4 text-right font-mono ${cGood?'text-emerald-600':'text-red-500'}`}>{fmtR(cat.m1_u - cat.m2_u)}</td><td className={`p-4 text-right font-mono ${cGood?'text-emerald-600':'text-red-500'}`}>{Math.abs(cat.m2_u!==0?((cat.m1_u-cat.m2_u)/Math.abs(cat.m2_u)*100):100).toFixed(2)}%</td>
                      </tr>
                    </React.Fragment>
                  );
                })}
                <tr className="bg-slate-900 text-white font-black border-t-4 border-orange-500">
                  <td className="p-6 uppercase text-sm">RESULTADO NETO</td>
                  <td className="p-6 text-right font-mono text-base border-l border-slate-800">{fmtR(total_m1)}</td>
                  <td className="p-6 text-right font-mono text-base border-l border-slate-800">{fmtR(total_m2)}</td>
                  <td className={`p-6 text-right font-mono text-lg border-l border-slate-800 ${varAbsTotal > 0?'text-emerald-400':'text-red-400'}`}>{fmtR(varAbsTotal)}</td>
                  <td className={`p-6 text-right font-mono text-lg border-l border-slate-800 ${varAbsTotal > 0?'text-emerald-400':'text-red-400'}`}>{Math.abs(varPctTotal).toFixed(2)}%</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}

// ============================================================================
// 6. VISTA: BALANCE GENERAL (ACUMULATIVO REAL - SIN EXPANDIR EN HEADER)
// ============================================================================
function BalanceGeneralView({ onBack, dbData, auxDataConfig }) {
  const balanceRecords = useMemo(() => dbData.filter(item => item.path?.toUpperCase().includes('ACTIVO') || item.path?.toUpperCase().includes('PASIVO') || item.path?.toUpperCase().includes('PATRIMONIO') || /^[123]/.test(item.name || '')), [dbData]);
  const availableYears = useMemo(() => [...new Set(balanceRecords.map(d => d.year))].filter(Boolean).sort(), [balanceRecords]);
  const [selectedYear, setSelectedYear] = useState(availableYears[availableYears.length - 1] || '2026');
  
  const availableMonths = useMemo(() => [...new Set(balanceRecords.filter(d => d.year === selectedYear).map(d => d.month))], [balanceRecords, selectedYear]);
  const defaultMonth = availableMonths.filter(m => m !== 'Saldos Iniciales').pop() || availableMonths[0] || 'Enero';
  const [selectedMonth, setSelectedMonth] = useState(defaultMonth); 
  const [tasa, setTasa] = useState(90);
  const [activeCode, setActiveCode] = useState(null);

  const tree = useMemo(() => {
    const root = [];
    const selectedMonthIndex = monthOrder[selectedMonth] || 0;
    
    // Acumulativo: Suma Saldos Iniciales + Meses Anteriores + Mes Seleccionado
    const cumulativeData = balanceRecords.filter(d => {
      if (d.year !== selectedYear) return false;
      const mIndex = monthOrder[d.month] || 0; 
      return mIndex <= selectedMonthIndex;
    });
    
    const auxEntries = [];
    for (const code in auxDataConfig) {
      const group = auxDataConfig[code];
      const totalMonto = group.records.reduce((acc, r) => acc + r.monto, 0);
      if (totalMonto !== 0) {
        auxEntries.push({
          name: `${code} - ${group.label}`,
          path: code.startsWith('1') ? 'ACTIVOS>ACTIVO CIRCULANTE>CUENTAS POR COBRAR' : 'PASIVOS>PASIVO CIRCULANTE>CUENTAS POR PAGAR',
          usd: totalMonto, bs: totalMonto * tasa
        });
      }
    }

    const fullData = [...cumulativeData, ...auxEntries];
    const normKey = s => String(s || '').trim().replace(/\s+/g,' ').toUpperCase();

    fullData.forEach(item => {
      const pathArray = (item.path || 'OTROS').split('>');
      let cur = root;
      pathArray.forEach(folderName => {
        if(!folderName) return;
        const key = normKey(folderName);
        let folder = cur.find(n => normKey(n.n) === key);
        if (!folder) { folder = { n: folderName.trim(), c: [], u: 0, b: 0 }; cur.push(folder); }
        cur = folder.c;
      });
      const leafKey = normKey(item.name);
      let leaf = cur.find(n => normKey(n.n) === leafKey && n.isLeaf);
      if (!leaf) cur.push({ n: String(item.name || '').trim(), u: item.usd, b: item.bs, isLeaf: true });
      else { leaf.u += item.usd; leaf.b += item.bs; }
    });

    const compute = (nodes) => {
      let u = 0, b = 0;
      nodes.forEach(n => { if (!n.isLeaf) { const t = compute(n.c); n.u = t.u; n.b = t.b; } u += n.u; b += n.b; });
      return { u, b };
    };
    compute(root);

    const sectionOrder = (name) => {
      const n = name.toUpperCase();
      if (n.includes('ACTIVO') || n.startsWith('1')) return 1;
      if (n.includes('PASIVO') || n.startsWith('2')) return 2;
      if (n.includes('PATRIMONIO') || n.startsWith('3')) return 3;
      return 9;
    };
    return root.sort((a, b) => sectionOrder(a.n) - sectionOrder(b.n));
  }, [balanceRecords, selectedMonth, selectedYear, tasa, auxDataConfig]);

  let totalActivos = 0; let totalPasPat = 0;
  tree.forEach(n => { if(n.n.toUpperCase().includes('ACTIVO') || n.n.startsWith('1')) totalActivos += n.u; else totalPasPat += n.u; });

  const fmtR = (v) => new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Math.abs(v));

  if (activeCode) return <AuxiliarReportView accountCode={activeCode} onBack={() => setActiveCode(null)} auxDataConfig={auxDataConfig} />;

  return (
    <div className="min-h-screen bg-[#f8fafc] print:bg-white pb-20">
      <PrintStyles />
      <header className="no-print bg-white/90 backdrop-blur border-b border-slate-200 p-4 flex justify-between items-center sticky top-0 z-30 shadow-sm flex-wrap gap-2">
        <button onClick={onBack} className="flex items-center gap-2 font-black text-xs text-slate-500 uppercase hover:text-slate-900 transition-colors"><ArrowLeft size={16}/> Panel</button>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400">Año:</span>
            <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} className="bg-slate-50 border border-slate-200 rounded p-1.5 font-bold outline-none text-xs">{availableYears.map(y=><option key={y}>{y}</option>)}</select>
            <span className="text-xs font-bold text-slate-400 ml-2">Corte:</span>
            <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="bg-slate-50 border border-slate-200 rounded p-1.5 font-bold outline-none text-xs">
              {availableMonths.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2 border-l border-slate-200 pl-4">
            <span className="text-xs font-bold text-slate-400 uppercase">Tasa Bs/USD:</span>
            <input type="number" min="1" step="0.01" value={tasa} onChange={e => setTasa(parseFloat(e.target.value) || 1)} className="bg-slate-50 border border-slate-200 rounded p-1.5 w-20 font-black outline-none text-xs"/>
          </div>
          <span className="text-slate-300">|</span>
          <button onClick={() => window.print()} className="px-3 py-1.5 bg-slate-800 text-white rounded text-[10px] font-black uppercase"><Printer size={14}/></button>
          <button onClick={() => handleExportExcel('table-balance', `Balance_${selectedMonth}`, `Balance General`)} className="px-3 py-1.5 bg-emerald-700 text-white rounded text-[10px] font-black uppercase"><Download size={14}/></button>
        </div>
      </header>
      <main className="p-4 md:p-8 max-w-5xl mx-auto">
        <HeaderMembretado isExport={true} />
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
          <table id="table-balance" className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase border-b border-slate-200">
              <tr><th className="px-5 py-5 w-[55%]">Estructura</th><th className="px-4 py-5 text-right">Saldo USD</th><th className="px-4 py-5 text-right hidden sm:table-cell">Equiv. Bs.</th><th className="px-4 py-5 text-right">%</th></tr>
            </thead>
            <tbody>
              {tree.map((node, i) => <ExpandableRow key={i} node={node} totalBaseUSD={totalActivos} defaultOpen={false} onShowReport={setActiveCode} isBalance={true}/>)}
              <tr className="bg-slate-900 text-white font-black border-t-4 border-slate-400">
                <td colSpan={4} className="p-8">
                  <div className="flex justify-between items-center px-4">
                    <div className="flex items-center gap-4"><Scale size={36} className="text-slate-400"/><div><p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Ecuación Patrimonial</p><p className="text-sm font-black tracking-widest text-slate-200">ACTIVOS = PASIVOS + PATRIMONIO</p></div></div>
                    <div className="flex gap-10 text-right">
                      <div><p className="text-[10px] text-slate-400 uppercase font-bold">Total Activos</p><p className="text-2xl font-mono text-white">USD {fmtR(totalActivos)}</p></div>
                      <div><p className="text-[10px] text-slate-400 uppercase font-bold">Pasivo + Pat.</p><p className="text-2xl font-mono text-white">USD {fmtR(totalPasPat)}</p></div>
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

// ============================================================================
// 7. VISTA: SUB-REPORTE AUXILIARES
// ============================================================================
function AuxiliarReportView({ accountCode, onBack, auxDataConfig }) {
  const group = auxDataConfig[accountCode] || { label: 'Sin registros', records: [] };
  const total = group.records.reduce((a,c)=>a+c.monto, 0);

  return (
    <div className="min-h-screen bg-[#f8fafc] print:bg-white pb-20">
      <PrintStyles />
      <header className="no-print bg-white/90 backdrop-blur border-b border-slate-200 p-4 flex justify-between items-center sticky top-0 z-30 shadow-sm">
        <button onClick={onBack} className="flex items-center gap-2 font-black text-xs text-slate-500 uppercase hover:text-slate-900"><ArrowLeft size={16}/> Volver</button>
        <div className="flex gap-2">
          <button onClick={()=>window.print()} className="px-3 py-1.5 bg-slate-800 text-white rounded text-[10px] font-black uppercase"><Printer size={14}/></button>
          <button onClick={()=>handleExportExcel(`table-aux-${accountCode}`, `Auxiliar_${accountCode}`, `Auxiliar`)} className="px-3 py-1.5 bg-emerald-700 text-white rounded text-[10px] font-black uppercase"><Download size={14}/></button>
        </div>
      </header>
      <main className="p-4 md:p-8 max-w-5xl mx-auto">
        <HeaderMembretado isExport={true} />
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl mb-6 flex justify-between items-center">
          <div><h2 className="text-2xl font-black text-slate-900 uppercase">Detalle Auxiliar</h2><p className="text-slate-400 font-bold uppercase text-xs mt-1">Cuenta: {accountCode} - {group.label}</p></div>
          <div className="text-right"><p className="text-[10px] font-black text-slate-400 uppercase">Saldo Neto USD</p><p className="text-4xl font-mono font-black text-slate-900">{total.toLocaleString('es-VE')}</p></div>
        </div>
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
          <table id={`table-aux-${accountCode}`} className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase border-b border-slate-200">
              <tr><th className="p-5">Código</th><th className="p-5">Descripción</th><th className="p-5">Operación</th><th className="p-5 text-right">Monto USD</th></tr>
            </thead>
            <tbody>
              {group.records.map((r,i)=>(
                <tr key={i} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="p-4 text-[11px] font-bold text-slate-500">{r.cod}</td><td className="p-4 text-[11px] font-black text-slate-800">{r.nombre}</td><td className="p-4 text-[11px] text-slate-600">{r.operacion}</td><td className="p-4 text-right font-mono text-[12px] font-black">{r.monto.toLocaleString('es-VE')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

// ============================================================================
// 8. VISTA: ACTIVOS FIJOS (RESTAURADO)
// ============================================================================
const ACTIVOS_FIJOS = [
  { grupo:'Vehículos',                   cod:'AF-V001', descripcion:'Camión Reparto — Chevrolet N300',          fechaAdq:'07/10/2025', costoOriginal:21110.23, depAcum:2637.53, vidaUtil:60 },
  { grupo:'Inmuebles',                   cod:'AF-I001', descripcion:'Local Comercial — Contrato Pacomela',      fechaAdq:'02/01/2026', costoOriginal:169547.91,depAcum:4238.70, vidaUtil:240 },
  { grupo:'Maquinaria y Equipos',        cod:'AF-M001', descripcion:'Equipos de Producción y Empaque',         fechaAdq:'01/06/2024', costoOriginal:15000.00, depAcum:3750.00, vidaUtil:60 },
  { grupo:'Maquinaria y Equipos',        cod:'AF-M002', descripcion:'Sistema de Refrigeración Industrial',     fechaAdq:'15/08/2024', costoOriginal:8500.00,  depAcum:1487.50, vidaUtil:84 },
  { grupo:'Mobiliario y Equipos Oficina',cod:'AF-O001', descripcion:'Mobiliario Oficina Administrativa',       fechaAdq:'01/03/2024', costoOriginal:3200.00,  depAcum:1280.00, vidaUtil:60 },
  { grupo:'Mobiliario y Equipos Oficina',cod:'AF-O002', descripcion:'Equipos de Computación y Periféricos',   fechaAdq:'15/09/2024', costoOriginal:4800.00,  depAcum:1200.00, vidaUtil:36 },
];

function InversionesView({ onBack }) {
  const grupos = [...new Set(ACTIVOS_FIJOS.map(a => a.grupo))];
  const fmt = v => new Intl.NumberFormat('es-VE', { minimumFractionDigits:2, maximumFractionDigits:2 }).format(v);
  const totalCosto = ACTIVOS_FIJOS.reduce((s,a) => s + a.costoOriginal, 0);
  const totalDep   = ACTIVOS_FIJOS.reduce((s,a) => s + a.depAcum, 0);

  return (
    <div className="min-h-screen bg-[#f8fafc] print:bg-white pb-20">
      <PrintStyles />
      <header className="no-print bg-white/90 backdrop-blur border-b border-slate-200 p-4 flex justify-between items-center sticky top-0 z-30 shadow-sm">
        <button onClick={onBack} className="flex items-center gap-2 font-black text-xs text-slate-500 uppercase hover:text-slate-900"><ArrowLeft size={16}/> Panel</button>
        <div className="flex gap-2">
          <button onClick={() => window.print()} className="px-3 py-1.5 text-[10px] font-black uppercase text-white bg-slate-800 rounded"><Printer size={14}/></button>
          <button onClick={() => handleExportExcel('table-activos', 'Activos_Fijos', 'Activos Fijos')} className="px-3 py-1.5 text-[10px] font-black uppercase text-white bg-emerald-700 rounded"><Download size={14}/></button>
        </div>
      </header>
      <main className="p-4 md:p-8 max-w-5xl mx-auto">
        <HeaderMembretado isExport={true} />
        <div className="bg-white p-8 border border-slate-100 shadow-xl flex flex-col items-center text-center mb-8 rounded-3xl">
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-widest mb-6">Registro de Activos Fijos</h2>
          <div className="no-print grid grid-cols-3 gap-8 w-full max-w-2xl mb-2">
            {[{ label:'Costo Original', val:fmt(totalCosto), color:'text-slate-800' }, { label:'Dep. Acumulada', val:fmt(totalDep), color:'text-red-500' }, { label:'Valor Neto USD', val:fmt(totalCosto-totalDep), color:'text-slate-900' }].map(k => (
              <div key={k.label} className="bg-slate-50 rounded-2xl p-5 border border-slate-200 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{k.label}</p>
                <p className={`text-xl font-black font-mono ${k.color}`}>{k.val}</p>
              </div>
            ))}
          </div>
        </div>
        <div id="table-activos">
        {grupos.map(grupo => {
          const items = ACTIVOS_FIJOS.filter(a => a.grupo === grupo);
          const gCosto = items.reduce((s,a) => s + a.costoOriginal, 0);
          const gDep   = items.reduce((s,a) => s + a.depAcum, 0);
          return (
            <div key={grupo} className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100 mb-6">
              <div className="bg-slate-50 px-6 py-4 flex justify-between items-center border-b border-slate-200">
                <span className="text-slate-800 font-black text-sm uppercase tracking-widest">{grupo}</span>
                <span className="text-slate-500 text-[10px] font-bold uppercase">Neto: <span className="text-slate-900 font-black ml-1">USD {fmt(gCosto-gDep)}</span></span>
              </div>
              <table className="w-full text-left border-collapse">
                <thead className="bg-white text-[10px] uppercase font-black text-slate-400 border-b border-slate-100">
                  <tr><th className="p-4">Código</th><th className="p-4">Descripción</th><th className="p-4">Adq.</th><th className="p-4 text-right">Costo USD</th><th className="p-4 text-right">Dep. Acum.</th><th className="p-4 text-right">Valor Neto</th></tr>
                </thead>
                <tbody>
                  {items.map((a,i) => (
                    <tr key={i} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="p-4 text-[11px] font-black text-slate-400">{a.cod}</td><td className="p-4 text-[11px] font-bold text-slate-800">{a.descripcion}</td><td className="p-4 text-[11px] text-slate-400">{a.fechaAdq}</td><td className="p-4 text-right text-[11px] font-mono text-slate-600">{fmt(a.costoOriginal)}</td><td className="p-4 text-right text-[11px] font-mono text-red-400">({fmt(a.depAcum)})</td><td className="p-4 text-right text-[12px] font-mono font-black text-slate-800">{fmt(a.costoOriginal-a.depAcum)}</td>
                    </tr>
                  ))}
                  <tr className="bg-slate-100 font-black text-[11px] border-t-2 border-slate-200">
                    <td colSpan={3} className="p-4 text-slate-700 uppercase tracking-wider">Total {grupo}</td><td className="p-4 text-right font-mono text-slate-800">{fmt(gCosto)}</td><td className="p-4 text-right font-mono text-red-500">({fmt(gDep)})</td><td className="p-4 text-right font-mono text-slate-900 text-[13px]">{fmt(gCosto-gDep)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          );
        })}
        </div>
      </main>
    </div>
  );
}

// ============================================================================
// 9. DASHBOARD PRINCIPAL (GLASSMORPHISM / 3D RELIEVE CLARO)
// ============================================================================
function ReportesFinancierosApp() {
  const [view, setView] = useState('dashboard');
  const [dbData, setDbData] = useState(() => JSON.parse(localStorage.getItem('j_db') || '[]'));
  const [planCuentas, setPlanCuentas] = useState(() => JSON.parse(localStorage.getItem('j_pc') || '{}'));
  const [auxDataConfig, setAuxDataConfig] = useState(() => JSON.parse(localStorage.getItem('j_ax') || '{}'));

  useEffect(() => {
    localStorage.setItem('j_db', JSON.stringify(dbData));
    localStorage.setItem('j_pc', JSON.stringify(planCuentas));
    localStorage.setItem('j_ax', JSON.stringify(auxDataConfig));
  }, [dbData, planCuentas, auxDataConfig]);

  if (view === 'configuracion') return (
    <div className="min-h-screen bg-[#f1f5f9] p-8 relative overflow-hidden">
      {/* Fondo con diseño */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-orange-200 opacity-20 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-200 opacity-20 rounded-full blur-[100px] pointer-events-none"></div>
      
      <div className="max-w-3xl mx-auto bg-white/90 backdrop-blur-xl rounded-[2rem] p-10 border border-white shadow-[0_20px_50px_rgba(0,0,0,0.05)] relative z-10">
        <button onClick={()=>setView('dashboard')} className="flex items-center gap-2 font-black text-[10px] uppercase text-slate-400 mb-8 hover:text-slate-800 transition-colors"><ArrowLeft size={16}/> Panel Central</button>
        <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-8 flex items-center gap-4"><div className="p-3 bg-orange-50 rounded-2xl"><Database className="text-orange-500" size={24}/></div> Ingesta de Información</h2>
        <div className="space-y-4">
          {[
            { n:'01', l:'Plan de Cuentas (.txt)', h: (e)=>processPlanCuentas(e.target.files[0]).then(p=>{setPlanCuentas(p); alert("Plan de Cuentas Listo")}) },
            { n:'02', l:'Saldos Iniciales (.xlsx)', h: (e)=>processSaldosBalance(e.target.files[0], planCuentas).then(d=>{setDbData(prev=>[...prev, ...d]); alert("Saldos Iniciales Cargados")}) },
            { n:'03', l:'Estado de Resultados (.xlsx)', h: (e)=>processFiles(e.target.files).then(d=>{setDbData(prev=>[...prev, ...d]); alert("Archivos de meses cargados")}), m:true },
            { n:'04', l:'Auxiliares CxC / CxP (.xlsx)', h: (e)=>processAuxFile(e.target.files).then(a=>{setAuxDataConfig(a); alert("Auxiliares procesados")}), m:true }
          ].map(s => (
            <label key={s.n} className="flex items-center gap-6 p-6 rounded-3xl border border-slate-100 bg-white cursor-pointer hover:border-orange-500/30 hover:shadow-[0_10px_20px_rgba(249,115,22,0.05)] hover:-translate-y-1 transition-all duration-300 group">
              <span className="text-3xl font-black font-mono text-slate-100 group-hover:text-orange-200 transition-colors">{s.n}</span>
              <span className="flex-1 font-bold text-sm uppercase tracking-wider text-slate-600 group-hover:text-slate-900">{s.l}</span>
              <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:bg-orange-50 transition-colors">
                <Upload size={20} className="text-slate-300 group-hover:text-orange-500"/>
              </div>
              <input type="file" multiple={s.m} className="hidden" onChange={s.h}/>
            </label>
          ))}
        </div>
        <button onClick={()=>{if(window.confirm("¿Borrar todo?")){setDbData([]); setPlanCuentas({}); setAuxDataConfig({})}}} className="w-full mt-10 p-5 bg-red-50/50 border border-red-100 text-red-500 font-black uppercase text-[11px] tracking-widest rounded-2xl hover:bg-red-500 hover:text-white transition-all duration-300">Limpiar Base de Datos Completa</button>
      </div>
    </div>
  );

  if (view === 'resultado')   return <EstadoResultadoView onBack={()=>setView('dashboard')} dbData={dbData}/>;
  if (view === 'balance')     return <BalanceGeneralView onBack={()=>setView('dashboard')} dbData={dbData} auxDataConfig={auxDataConfig}/>;
  if (view === 'comparativo') return <AnalisisComparativoView onBack={()=>setView('dashboard')} dbData={dbData}/>;
  if (view === 'inversiones') return <InversionesView onBack={()=>setView('dashboard')} />;

  return (
    <div className="min-h-screen bg-[#f4f7fa] relative overflow-hidden font-sans">
      {/* Fondo Neumorfismo / Glassmorphism */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]"></div>
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-orange-300/20 rounded-full blur-[120px] pointer-events-none"></div>
      
      <header className="relative z-10 bg-white/80 backdrop-blur-xl shadow-[0_4px_30px_rgba(0,0,0,0.03)] border-b border-white p-8 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30">
            <Activity size={28} className="text-white"/>
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Jiret G&B <span className="text-slate-400 font-normal">Finance</span></h1>
            <p className="text-[10px] font-black text-slate-400 tracking-[0.3em] uppercase mt-1">Servicios Administrativos Contables</p>
          </div>
        </div>
        <button onClick={()=>setView('configuracion')} className="bg-white border border-slate-200 hover:border-orange-500 hover:text-orange-600 px-6 py-3.5 rounded-2xl font-black uppercase text-[11px] shadow-sm hover:shadow-md transition-all flex items-center gap-3">
          <Database size={16}/> Configuración
        </button>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-10 py-20">
        <div className="mb-12">
          <h2 className="text-slate-900 font-black text-4xl tracking-tight mb-2">Panel Administrativo</h2>
          <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">Módulos Financieros y Reportes</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { id:'resultado', t:'Estado de Resultados', d:'Rentabilidad Mensual', i:<LineChart size={36}/> },
            { id:'balance', t:'Balance General', d:'Situación Acumulada', i:<Scale size={36}/> },
            { id:'comparativo', t:'Análisis Variación', d:'Comparativo Mensual', i:<GitCompare size={36}/> },
            { id:'inversiones', t:'Activos Fijos', d:'Inversiones y Dep.', i:<Landmark size={36}/> }
          ].map(m => (
            <button key={m.id} onClick={()=>setView(m.id)} className="group relative bg-white/90 backdrop-blur-md rounded-[2.5rem] p-10 text-left border border-white shadow-[0_15px_35px_rgba(0,0,0,0.04)] hover:shadow-[0_30px_60px_rgba(249,115,22,0.1)] hover:-translate-y-4 hover:border-orange-200 transition-all duration-500">
              <div className="bg-slate-50 w-24 h-24 rounded-[1.5rem] flex items-center justify-center mb-8 border border-slate-100 shadow-[inset_0_4px_10px_rgba(0,0,0,0.03)] group-hover:bg-gradient-to-br group-hover:from-orange-50 group-hover:to-orange-100 group-hover:border-orange-200 text-slate-400 group-hover:text-orange-500 transition-all duration-300">
                {m.i}
              </div>
              <h3 className="font-black text-xl text-slate-900 mb-2 uppercase tracking-tighter leading-none group-hover:text-orange-600 transition-colors">{m.t}</h3>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{m.d}</p>
              
              {/* Flecha indicadora animada */}
              <div className="absolute bottom-10 right-10 w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center opacity-0 scale-50 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300">
                <ArrowUpRight className="text-orange-500" size={20}/>
              </div>
            </button>
          ))}
        </div>
        <p className="text-center text-slate-300 font-black text-[10px] uppercase tracking-[0.5em] mt-32">Supply ERP · High Impact Accounting v5.0</p>
      </main>
    </div>
  );
}

export default ReportesFinancierosApp;

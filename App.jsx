import React, { useState, useMemo, useEffect } from 'react';
import { 
  ArrowLeft, Upload, CheckCircle, Scale, LayoutDashboard,
  LineChart, CalendarDays, AlertTriangle, ChevronRight, ChevronDown, Star, PlusCircle, Trash2, ArrowUpRight, ArrowDownRight, GitCompare, Landmark, FileSpreadsheet,
  FileText, Users, Briefcase, Search, BookOpen, Database, FileOutput, Printer, Download, Activity, Menu, X
} from 'lucide-react';

// ============================================================================
// 0. ESTILOS DE IMPRESIÓN Y MEMBRETE
// ============================================================================
const PrintStyles = () => (
  <style>{`
    @media print {
      @page { size: letter; margin: 10mm; }
      body { background-color: white !important; -webkit-print-color-adjust: exact; }
      .no-print { display: none !important; }
      .print-area { box-shadow: none !important; border: none !important; padding: 0 !important; margin: 0 auto !important; width: 100% !important; max-width: 100% !important; }
      table { page-break-inside: auto; width: 100% !important; table-layout: fixed; border-collapse: collapse; }
      tr { page-break-inside: avoid; page-break-after: auto; }
      thead { display: table-header-group; }
      th, td { word-wrap: break-word; overflow: hidden; padding: 6px 4px !important; }
    }
  `}</style>
);

const HeaderMembretado = ({ isExport = false }) => (
  <div className={`${isExport ? 'flex' : 'hidden print:flex'} w-full justify-between items-end border-b-4 border-orange-500 pb-3 mb-6 pt-2 bg-white`}>
    <div>
      <p className="text-slate-400 text-lg mb-1 leading-none font-bold">Supply</p>
      <h1 className="text-5xl font-black leading-none tracking-tight text-slate-900">G<span className="text-orange-500">&</span>B</h1>
    </div>
    <div className="text-right">
      <h2 className="text-xl font-black uppercase text-slate-900 tracking-widest">SERVICIOS JIRET G&B, C.A.</h2>
      <p className="text-sm font-bold text-slate-600">RIF: J-412309374</p>
      <p className="text-[11px] text-slate-500 mt-1 uppercase font-bold">AV CIRCUNVALACION NRO 02 C.C EL DIVIDIVI LOCAL G-9 PB</p>
      <p className="text-[11px] text-slate-500 uppercase font-bold">MARACAIBO - EDO. ZULIA</p>
    </div>
  </div>
);

// ============================================================================
// 1. MOTOR EXCEL (MEMBRETE PERFECTO Y SEGURO)
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
// 2. PROCESADORES DE DATOS (Saldos Iniciales y Anti-Errores)
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
    const isAuxAccount = rawName.startsWith('1.1.02') || rawName.startsWith('2.1.01'); // REGLA: No duplica CxC/CxP
    
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
// 3. COMPONENTE: ÁRBOL EXPANDIBLE (RESTAURADO CON BOTONES + / -)
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
          <td style={indent} className={`py-3 px-4 font-black text-xs uppercase tracking-widest ${isRoot ? 'text-slate-800' : 'text-slate-500'}`}>{node.n}</td>
          <td colSpan={3} />
        </tr>
        {isOpen && node.c.map((child, i) => <ExpandableRow key={i} node={child} level={level+1} totalBaseUSD={totalBaseUSD} highlightedAccounts={highlightedAccounts} toggleHighlight={toggleHighlight} onShowReport={onShowReport} isBalance={isBalance}/>)}
        {isOpen && (
          <tr className="bg-slate-100/50 font-black text-[10px] border-t border-slate-200 shadow-inner">
            <td style={{ paddingLeft: level * 18 + 28 }} className="py-2.5 px-4 uppercase text-slate-500 tracking-wider">TOTAL {node.n}</td>
            <td className="py-2.5 px-4 text-right font-mono text-slate-900">{fmt(Math.abs(node.u))}</td>
            <td className="py-2.5 px-4 text-right font-mono hidden sm:table-cell text-slate-900">{fmt(Math.abs(node.b))}</td>
            <td className="py-2.5 px-4 text-right font-mono text-slate-400">{(Math.abs(node.u)/Math.abs(totalBaseUSD||1)*100).toFixed(2)}%</td>
          </tr>
        )}
        {!isOpen && isRoot && (
           <tr className="bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => setIsOpen(true)}>
             <td style={indent} className="py-3 px-4 font-black text-xs uppercase flex items-center gap-3">
               <span className="w-5 h-5 border border-slate-300 rounded bg-white text-center leading-[18px] text-[12px] text-slate-500 shadow-sm">+</span> {node.n}
             </td>
             <td className="py-3 px-4 text-right font-mono font-black text-slate-800">{fmt(Math.abs(node.u))}</td><td colSpan={2}/>
           </tr>
        )}
      </>
    );
  }

  const isHigh = highlightedAccounts?.has(node.n);
  return (
    <tr onClick={() => !isLeaf && setIsOpen(!isOpen)} className={`border-b border-slate-50 hover:bg-slate-50 transition-all cursor-pointer ${isHigh ? 'bg-orange-50 border-l-4 border-orange-500' : 'bg-white border-l-4 border-transparent'}`}>
      <td style={indent} className="py-2.5 px-4 font-bold text-[11px] text-slate-700 uppercase flex items-center gap-3">
        {!isLeaf && <span className="no-print w-5 h-5 border border-slate-300 rounded bg-white text-center leading-[18px] text-[12px] text-slate-500 shadow-sm">{isOpen ? '−' : '+'}</span>}
        <button onClick={(e) => {e.stopPropagation(); toggleHighlight(node.n)}} className="no-print focus:outline-none"><Star size={16} fill={isHigh?"#f97316":"none"} color={isHigh?"#f97316":"#cbd5e1"}/></button>
        <span className="truncate max-w-[320px]">{node.n}</span>
        {hasMapping && <button onClick={(e)=>{e.stopPropagation(); onShowReport(accountCode)}} className="no-print ml-2 px-3 py-1 bg-slate-800 text-white text-[9px] rounded font-black hover:bg-orange-500 shadow-md transition-colors">AUX</button>}
      </td>
      <td className="py-2.5 px-4 text-right font-mono text-[11px] text-slate-600">{fmt(Math.abs(node.u))}</td>
      <td className="py-2.5 px-4 text-right font-mono text-[11px] hidden sm:table-cell text-slate-600">{fmt(Math.abs(node.b))}</td>
      <td className="py-2.5 px-4 text-right font-mono text-[11px] text-slate-400">{(Math.abs(node.u)/Math.abs(totalBaseUSD||1)*100).toFixed(2)}%</td>
    </tr>
  );
};

// ============================================================================
// 4. VISTA: ESTADO DE RESULTADOS
// ============================================================================
function EstadoResultadoView({ dbData }) {
  const availableYears = useMemo(() => [...new Set(dbData.map(d => d.year))].filter(Boolean).sort(), [dbData]);
  const [selectedYear, setSelectedYear] = useState(availableYears[availableYears.length - 1] || new Date().getFullYear().toString());
  const availableMonths = useMemo(() => [...new Set(dbData.filter(d => d.year === selectedYear).map(d => d.month))].filter(m=>m!=='Sin Mes' && m!=='Saldos Iniciales'), [dbData, selectedYear]);
  const [selectedMonth, setSelectedMonth] = useState('General');
  
  const [defaultOpen, setDefaultOpen] = useState(false);
  const [expandKey, setExpandKey] = useState(0);

  const [highlightedAccounts, setHighlightedAccounts] = useState(() => {
    try { const saved = localStorage.getItem('jiret_highlighted_accounts'); return saved ? new Set(JSON.parse(saved)) : new Set(); } 
    catch (e) { return new Set(); }
  });
  useEffect(() => { localStorage.setItem('jiret_highlighted_accounts', JSON.stringify([...highlightedAccounts])); }, [highlightedAccounts]);

  const toggleHighlight = (accountName) => {
    setHighlightedAccounts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(accountName)) newSet.delete(accountName); else newSet.add(accountName);
      return newSet;
    });
  };

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
    <div className="pb-20 animate-in fade-in">
      <PrintStyles />
      <header className="no-print bg-white/80 backdrop-blur-md border-b border-slate-200 p-4 flex justify-between items-center sticky top-0 z-30 shadow-sm rounded-b-2xl mb-6 flex-wrap gap-4">
        <div className="flex gap-3 items-center">
          <select value={selectedYear} onChange={e=>setSelectedYear(e.target.value)} className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl p-2 font-bold outline-none shadow-sm">{availableYears.map(y=><option key={y}>{y}</option>)}</select>
          <select value={selectedMonth} onChange={e=>setSelectedMonth(e.target.value)} className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl p-2 font-bold outline-none shadow-sm"><option value="General">Acumulado General</option>{availableMonths.map(m=><option key={m}>{m}</option>)}</select>
          <div className="h-6 w-px bg-slate-300 mx-2"></div>
          <button onClick={() => { setDefaultOpen(true); setExpandKey(k=>k+1); }} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-bold uppercase flex items-center gap-2 hover:bg-slate-200 transition-colors shadow-sm"><ChevronDown size={14}/> Expandir</button>
          <button onClick={() => { setDefaultOpen(false); setExpandKey(k=>k+1); }} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-bold uppercase flex items-center gap-2 hover:bg-slate-200 transition-colors shadow-sm"><ChevronRight size={14}/> Contraer</button>
        </div>
        <div className="flex gap-3">
          <button onClick={()=>window.print()} className="px-5 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase flex items-center gap-2 shadow-md hover:bg-slate-800 transition-colors"><Printer size={14}/> PDF</button>
          <button onClick={()=>handleExportExcel('table-res', `Estado_Resultados_${selectedMonth}`, `Estado de Resultados`)} className="px-5 py-2 bg-orange-500 text-white rounded-xl text-[10px] font-black uppercase flex items-center gap-2 shadow-md hover:bg-orange-600 transition-colors"><Download size={14}/> Excel</button>
        </div>
      </header>
      <main className="max-w-5xl mx-auto print-area">
        <HeaderMembretado isExport={true}/>
        <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden print:shadow-none print:border-none">
          <div className="bg-slate-50 p-8 border-b border-slate-100 text-center print:bg-white print:border-none print:p-0 print:mb-6">
             <h2 className="text-2xl font-black text-slate-900 uppercase tracking-widest">Estado de Resultados</h2>
             <p className="text-slate-500 font-bold uppercase text-xs mt-2 tracking-widest">{selectedMonth === 'General' ? 'Acumulado General' : `Mes: ${selectedMonth}`} - {selectedYear}</p>
          </div>
          <table id="table-res" className="w-full text-left border-collapse">
            <thead className="bg-white text-[10px] font-black text-slate-400 uppercase border-b border-slate-200">
              <tr><th className="px-6 py-5 w-[55%]">Estructura de Cuentas</th><th className="px-4 py-5 text-right">Saldo USD</th><th className="px-4 py-5 text-right hidden sm:table-cell">Saldo Bs.</th><th className="px-4 py-5 text-right">%</th></tr>
            </thead>
            <tbody key={expandKey}>
              <tr className="bg-white border-b border-slate-100 font-black text-xs uppercase"><td colSpan={4} className="px-6 py-5 tracking-widest text-slate-800">I. INGRESOS</td></tr>
              {trees.tIng.map((n,i)=><ExpandableRow key={i} node={n} totalBaseUSD={totals.ti} defaultOpen={defaultOpen} highlightedAccounts={highlightedAccounts} toggleHighlight={toggleHighlight}/>)}
              <tr className="bg-slate-50 text-slate-800 font-black border-y-2 border-slate-200"><td className="px-6 py-4 pl-10 text-[11px] uppercase tracking-widest">TOTAL INGRESOS</td><td className="px-4 py-4 text-right font-mono text-sm">{fmtR(totals.ti)}</td><td className="hidden sm:table-cell px-4 py-4 text-right font-mono text-sm">{fmtR(totals.ti*45)}</td><td className="px-4 py-4 text-right font-mono text-sm">100%</td></tr>

              <tr className="bg-white border-b border-slate-100 font-black text-xs uppercase"><td colSpan={4} className="px-6 py-5 pt-8 tracking-widest text-slate-800">II. COSTOS DE VENTA</td></tr>
              {trees.tCos.map((n,i)=><ExpandableRow key={i} node={n} totalBaseUSD={totals.ti} defaultOpen={defaultOpen} highlightedAccounts={highlightedAccounts} toggleHighlight={toggleHighlight}/>)}
              <tr className="bg-slate-50 text-slate-800 font-black border-y-2 border-slate-200"><td className="px-6 py-4 pl-10 text-[11px] uppercase tracking-widest">TOTAL COSTOS</td><td className="px-4 py-4 text-right font-mono text-sm">{fmtR(totals.tc)}</td><td className="hidden sm:table-cell px-4 py-4 text-right font-mono text-sm">{fmtR(totals.tc*45)}</td><td className="px-4 py-4 text-right font-mono text-sm">{(totals.tc/(totals.ti||1)*100).toFixed(2)}%</td></tr>

              <tr className="bg-slate-900 text-white font-black border-y-4 border-slate-400 print:bg-slate-200 print:text-black print:border-black"><td className="px-6 py-6 uppercase tracking-widest">III. UTILIDAD BRUTA</td><td className={`px-4 py-6 text-right text-lg font-mono ${totals.ub < 0 ? 'text-red-400':'text-emerald-400'} print:text-black`}>{fmtR(totals.ub)}</td><td className="hidden sm:table-cell"/><td className="px-4 py-6 text-right font-mono text-slate-300 print:text-black">{(Math.abs(totals.ub)/(totals.ti||1)*100).toFixed(2)}%</td></tr>

              <tr className="bg-white border-b border-slate-100 font-black text-xs uppercase"><td colSpan={4} className="px-6 py-5 pt-8 tracking-widest text-slate-800">IV. GASTOS OPERATIVOS</td></tr>
              {trees.tGas.map((n,i)=><ExpandableRow key={i} node={n} totalBaseUSD={totals.ti} defaultOpen={defaultOpen} highlightedAccounts={highlightedAccounts} toggleHighlight={toggleHighlight}/>)}
              <tr className="bg-slate-50 text-slate-800 font-black border-y-2 border-slate-200"><td className="px-6 py-4 pl-10 text-[11px] uppercase tracking-widest">TOTAL GASTOS</td><td className="px-4 py-4 text-right font-mono text-sm">{fmtR(totals.tg)}</td><td className="hidden sm:table-cell px-4 py-4 text-right font-mono text-sm">{fmtR(totals.tg*45)}</td><td className="px-4 py-4 text-right font-mono text-sm">{(totals.tg/(totals.ti||1)*100).toFixed(2)}%</td></tr>

              <tr className="bg-orange-500 text-white font-black border-t-4 border-orange-600 print:bg-slate-400 print:text-black print:border-black"><td className="px-6 py-8 uppercase text-lg tracking-widest">V. RESULTADO NETO</td><td className="px-4 py-8 text-right text-2xl font-mono">{fmtR(totals.un)}</td><td className="hidden sm:table-cell"/><td className="px-4 py-8 text-right font-mono text-orange-200 print:text-slate-800">{(Math.abs(totals.un)/(totals.ti||1)*100).toFixed(2)}%</td></tr>
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
// ============================================================================
// 5. VISTA: BALANCE GENERAL (ACUMULATIVO REAL + AUXILIARES)
// ============================================================================
function BalanceGeneralView({ dbData, auxDataConfig, setSubView }) {
  const balanceRecords = useMemo(() => dbData.filter(item => item.path?.toUpperCase().includes('ACTIVO') || item.path?.toUpperCase().includes('PASIVO') || item.path?.toUpperCase().includes('PATRIMONIO') || /^[123]/.test(item.name || '')), [dbData]);
  const availableYears = useMemo(() => [...new Set(balanceRecords.map(d => d.year))].filter(Boolean).sort(), [balanceRecords]);
  const [selectedYear, setSelectedYear] = useState(availableYears[availableYears.length - 1] || new Date().getFullYear().toString());
  
  const availableMonths = useMemo(() => [...new Set(balanceRecords.filter(d => d.year === selectedYear).map(d => d.month))], [balanceRecords, selectedYear]);
  // Selecciona por defecto el último mes que no sea "Saldos Iniciales"
  const defaultMonth = availableMonths.filter(m => m !== 'Saldos Iniciales').pop() || availableMonths[0] || 'Enero';
  const [selectedMonth, setSelectedMonth] = useState(defaultMonth); 
  const [tasa, setTasa] = useState(90);

  // Lógica Acumulativa: Suma histórica hasta el mes de corte
  const tree = useMemo(() => {
    const root = [];
    const selectedMonthIndex = monthOrder[selectedMonth] || 0;
    
    // Acumulativo: Suma Saldos Iniciales + Meses Anteriores + Mes Seleccionado
    const cumulativeData = balanceRecords.filter(d => {
      if (d.year !== selectedYear) return false;
      const mIndex = monthOrder[d.month] || 0; 
      return mIndex <= selectedMonthIndex;
    });
    
    // Inyección dinámica de Auxiliares
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

  return (
    <div className="pb-20 animate-in fade-in">
      <PrintStyles />
      {/* Header sin botones de Expandir/Contraer, tal como lo pediste */}
      <header className="no-print bg-white/80 backdrop-blur-md border-b border-slate-200 p-4 flex justify-between items-center sticky top-0 z-30 shadow-sm rounded-b-2xl mb-6">
        <div className="flex items-center gap-3">
          <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl p-2 font-bold outline-none shadow-sm">{availableYears.map(y=><option key={y}>{y}</option>)}</select>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Corte Acumulado:</span>
          <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl p-2 font-bold outline-none shadow-sm">
            {availableMonths.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <div className="h-6 w-px bg-slate-300 mx-2"></div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tasa Bs:</span>
          <input type="number" min="1" step="0.01" value={tasa} onChange={e => setTasa(parseFloat(e.target.value) || 1)} className="bg-slate-50 border border-slate-200 rounded-xl p-2 w-24 font-black outline-none text-xs shadow-sm"/>
        </div>
        <div className="flex gap-3">
          <button onClick={() => window.print()} className="px-5 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase flex items-center gap-2 shadow-md hover:bg-slate-800 transition-colors"><Printer size={14}/> PDF</button>
          <button onClick={() => handleExportExcel('table-balance', `Balance_${selectedMonth}`, `Balance General`)} className="px-5 py-2 bg-orange-500 text-white rounded-xl text-[10px] font-black uppercase flex items-center gap-2 shadow-md hover:bg-orange-600 transition-colors"><Download size={14}/> Excel</button>
        </div>
      </header>
      <main className="max-w-5xl mx-auto print-area">
        <HeaderMembretado isExport={true} />
        <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden print:shadow-none print:border-none">
          <div className="bg-slate-50 p-8 border-b border-slate-100 text-center print:bg-white print:border-none print:p-0 print:mb-6">
             <h2 className="text-2xl font-black text-slate-900 uppercase tracking-widest">Balance de Situación</h2>
             <p className="text-slate-500 font-bold uppercase text-xs mt-2 tracking-widest">Acumulado al Corte: {selectedMonth} {selectedYear}</p>
          </div>
          <table id="table-balance" className="w-full text-left border-collapse">
            <thead className="bg-white text-[10px] font-black text-slate-400 uppercase border-b border-slate-200">
              <tr><th className="px-6 py-5 w-[55%]">Estructura Patrimonial</th><th className="px-4 py-5 text-right">Saldo USD</th><th className="px-4 py-5 text-right hidden sm:table-cell">Equiv. Bs.</th><th className="px-4 py-5 text-right">%</th></tr>
            </thead>
            <tbody>
              {tree.map((node, i) => <ExpandableRow key={i} node={node} totalBaseUSD={totalActivos} defaultOpen={false} onShowReport={(code) => setSubView({type:'auxiliar', code})} isBalance={true}/>)}
              <tr className="bg-slate-900 text-white font-black border-t-4 border-slate-400 print:bg-slate-200 print:text-black print:border-black">
                <td colSpan={4} className="p-8">
                  <div className="flex justify-between items-center px-4">
                    <div className="flex items-center gap-5"><Scale size={40} className="text-slate-400 print:text-slate-800"/><div><p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold print:text-slate-600">Ecuación Patrimonial</p><p className="text-sm font-black tracking-widest text-slate-200 print:text-slate-900">ACTIVOS = PASIVOS + PATRIMONIO</p></div></div>
                    <div className="flex gap-10 text-right">
                      <div><p className="text-[10px] text-slate-400 uppercase font-bold print:text-slate-600">Total Activos</p><p className="text-2xl font-mono text-white print:text-slate-900">USD {fmtR(totalActivos)}</p></div>
                      <div><p className="text-[10px] text-slate-400 uppercase font-bold print:text-slate-600">Pasivo + Pat.</p><p className="text-2xl font-mono text-white print:text-slate-900">USD {fmtR(totalPasPat)}</p></div>
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
// 6. VISTA: ANÁLISIS COMPARATIVO (ESTADO DE RESULTADOS)
// ============================================================================
function AnalisisComparativoView({ dbData }) {
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
    const m1Data = dbData.filter(d => d.year === year1 && d.month === month1 && !d.path?.toUpperCase().includes('ACTIVO') && !d.path?.toUpperCase().includes('PASIVO') && !d.path?.toUpperCase().includes('PATRIMONIO') && !/^[123]/.test(d.name));
    const m2Data = dbData.filter(d => d.year === year2 && d.month === month2 && !d.path?.toUpperCase().includes('ACTIVO') && !d.path?.toUpperCase().includes('PASIVO') && !d.path?.toUpperCase().includes('PATRIMONIO') && !/^[123]/.test(d.name));

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
    <div className="pb-20 animate-in fade-in">
      <PrintStyles />
      <header className="no-print bg-white/80 backdrop-blur-md border-b border-slate-200 p-4 flex justify-between items-center sticky top-0 z-30 shadow-sm rounded-b-2xl mb-6">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Base:</span>
          <select value={year1} onChange={(e) => setYear1(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold outline-none text-xs shadow-sm">{availableYears.map(y=><option key={y}>{y}</option>)}</select>
          <select value={month1} onChange={(e) => setMonth1(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold outline-none text-xs shadow-sm">{months1.map(m => <option key={m}>{m}</option>)}</select>
          <span className="mx-2 text-slate-300 font-black">VS</span>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Comp:</span>
          <select value={year2} onChange={(e) => setYear2(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold outline-none text-xs shadow-sm">{availableYears.map(y=><option key={y}>{y}</option>)}</select>
          <select value={month2} onChange={(e) => setMonth2(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold outline-none text-xs shadow-sm">{months2.map(m => <option key={m}>{m}</option>)}</select>
        </div>
        <div className="flex gap-3">
          <button onClick={() => window.print()} className="px-5 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase flex items-center gap-2 shadow-md hover:bg-slate-800 transition-colors"><Printer size={14}/> PDF</button>
          <button onClick={() => handleExportExcel('table-comparativo', `Comparativo`, `Análisis Comparativo`)} className="px-5 py-2 bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase flex items-center gap-2 shadow-md hover:bg-emerald-600 transition-colors"><Download size={14}/> Excel</button>
        </div>
      </header>
      <main className="max-w-5xl mx-auto print-area">
        <HeaderMembretado isExport={true} />
        {!month1 || !month2 ? (
          <div className="bg-white p-12 text-center rounded-3xl border border-slate-100 shadow-xl mt-10">
            <AlertTriangle className="mx-auto text-orange-400 mb-6" size={64}/>
            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-widest mb-2">Faltan Datos</h2>
            <p className="text-slate-500 font-bold uppercase text-xs tracking-wider">Carga información de al menos 2 meses para comparar.</p>
          </div>
        ) : (
          <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden print:shadow-none print:border-none">
            <div className="bg-slate-50 p-8 border-b border-slate-100 text-center print:bg-white print:border-none print:p-0 print:mb-6">
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-widest">Análisis Comparativo</h2>
              <p className="text-slate-500 font-bold uppercase text-xs mt-2 tracking-widest">{month1} {year1} vs {month2} {year2}</p>
            </div>
            <table id="table-comparativo" className="w-full text-left border-collapse">
              <thead className="bg-white text-[10px] uppercase font-black text-slate-400 border-b border-slate-200">
                <tr><th className="px-6 py-5">Estructura</th><th className="px-4 py-5 text-right">📅 {month1}</th><th className="px-4 py-5 text-right">📅 {month2}</th><th className="px-4 py-5 text-right">Var. Abs</th><th className="px-4 py-5 text-right">%</th></tr>
              </thead>
              <tbody>
                {tree.map((cat, i) => {
                  const isIngreso = cat.n.includes('INGRESO') || (cat.key && cat.key.startsWith('4'));
                  const cGood = isIngreso ? (cat.m1_u - cat.m2_u) > 0 : (cat.m1_u - cat.m2_u) < 0;
                  return (
                    <React.Fragment key={i}>
                      <tr className="bg-slate-50 font-black text-xs"><td className="px-6 py-4 uppercase text-slate-800 tracking-widest">{cat.n}</td><td colSpan={4}/></tr>
                      {cat.c.sort((a,b)=>String(a.n).localeCompare(String(b.n))).map((acc, j) => {
                        const vA = acc.m1_u - acc.m2_u;
                        const vP = acc.m2_u !== 0 ? (vA/Math.abs(acc.m2_u))*100 : (acc.m1_u !== 0 ? 100 : 0);
                        const good = isIngreso ? vA > 0 : vA < 0;
                        return (
                          <tr key={j} className="border-b border-slate-50 hover:bg-slate-50">
                            <td className="px-6 py-3 pl-10 text-[11px] font-bold text-slate-600 truncate max-w-xs">{acc.n}</td>
                            <td className="px-4 py-3 text-right font-mono text-[11px]">{fmtR(acc.m1_u)}</td>
                            <td className="px-4 py-3 text-right font-mono text-[11px] font-bold bg-slate-50/50">{fmtR(acc.m2_u)}</td>
                            <td className={`px-4 py-3 text-right font-mono text-[11px] font-bold ${good ? 'text-emerald-500':'text-red-500'}`}>{vA>0?'+':''}{fmtR(vA)}</td>
                            <td className={`px-4 py-3 text-right font-mono text-[11px] font-bold ${good ? 'text-emerald-500':'text-red-500'}`}>{Math.abs(vP).toFixed(2)}%</td>
                          </tr>
                        );
                      })}
                      <tr className="bg-slate-100 font-black text-[11px] border-y border-slate-200">
                        <td className="px-6 py-4 pl-10 uppercase tracking-widest">TOTAL {cat.n}</td>
                        <td className="px-4 py-4 text-right font-mono">{fmtR(cat.m1_u)}</td><td className="px-4 py-4 text-right font-mono bg-slate-200/50">{fmtR(cat.m2_u)}</td>
                        <td className={`px-4 py-4 text-right font-mono ${cGood?'text-emerald-600':'text-red-500'}`}>{fmtR(cat.m1_u - cat.m2_u)}</td><td className={`px-4 py-4 text-right font-mono ${cGood?'text-emerald-600':'text-red-500'}`}>{Math.abs(cat.m2_u!==0?((cat.m1_u-cat.m2_u)/Math.abs(cat.m2_u)*100):100).toFixed(2)}%</td>
                      </tr>
                    </React.Fragment>
                  );
                })}
                <tr className="bg-slate-900 text-white font-black border-t-4 border-orange-500 print:bg-slate-300 print:text-black print:border-black">
                  <td className="px-6 py-6 uppercase text-sm tracking-widest">RESULTADO NETO</td>
                  <td className="px-4 py-6 text-right font-mono text-base border-l border-slate-800 print:border-slate-400">{fmtR(total_m1)}</td>
                  <td className="px-4 py-6 text-right font-mono text-base border-l border-slate-800 print:border-slate-400">{fmtR(total_m2)}</td>
                  <td className={`px-4 py-6 text-right font-mono text-lg border-l border-slate-800 print:border-slate-400 ${varAbsTotal > 0?'text-emerald-400 print:text-black':'text-red-400 print:text-black'}`}>{fmtR(varAbsTotal)}</td>
                  <td className={`px-4 py-6 text-right font-mono text-lg border-l border-slate-800 print:border-slate-400 ${varAbsTotal > 0?'text-emerald-400 print:text-black':'text-red-400 print:text-black'}`}>{Math.abs(varPctTotal).toFixed(2)}%</td>
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
// 7. VISTA: SUB-REPORTE AUXILIARES (SE ABRE DENTRO DEL BALANCE)
// ============================================================================
function AuxiliarReportView({ accountCode, onBack, auxDataConfig }) {
  const group = auxDataConfig[accountCode] || { label: 'Sin registros', records: [] };
  const total = group.records.reduce((a,c)=>a+c.monto, 0);

  return (
    <div className="animate-in fade-in pb-20">
      <PrintStyles />
      <header className="no-print bg-white/80 backdrop-blur-md border-b border-slate-200 p-4 flex justify-between items-center sticky top-0 z-30 shadow-sm rounded-b-2xl mb-6">
        <button onClick={onBack} className="flex items-center gap-2 font-black text-xs text-slate-500 uppercase hover:text-orange-500 transition-colors"><ArrowLeft size={16}/> Volver al Balance</button>
        <div className="flex gap-3">
          <button onClick={()=>window.print()} className="px-5 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase flex items-center gap-2 shadow-md hover:bg-slate-800 transition-colors"><Printer size={14}/> PDF</button>
          <button onClick={()=>handleExportExcel(`table-aux-${accountCode}`, `Auxiliar_${accountCode}`, `Auxiliar`)} className="px-5 py-2 bg-orange-500 text-white rounded-xl text-[10px] font-black uppercase flex items-center gap-2 shadow-md hover:bg-orange-600 transition-colors"><Download size={14}/> Excel</button>
        </div>
      </header>
      <main className="max-w-5xl mx-auto print-area">
        <HeaderMembretado isExport={true} />
        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl mb-6 flex justify-between items-center print:shadow-none print:border-none print:p-0">
          <div><h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Detalle Auxiliar</h2><p className="text-orange-500 font-bold uppercase text-xs mt-2 tracking-widest">Cuenta: {accountCode} - {group.label}</p></div>
          <div className="text-right bg-slate-50 p-4 rounded-2xl border border-slate-100 print:bg-transparent print:border-none print:p-0"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Saldo Neto USD</p><p className="text-4xl font-mono font-black text-slate-900">{total.toLocaleString('es-VE')}</p></div>
        </div>
        <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden print:shadow-none print:border-none">
          <table id={`table-aux-${accountCode}`} className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase border-b border-slate-200">
              <tr><th className="px-6 py-5">Código</th><th className="px-4 py-5">Descripción</th><th className="px-4 py-5">Operación</th><th className="px-6 py-5 text-right">Monto USD</th></tr>
            </thead>
            <tbody>
              {group.records.map((r,i)=>(
                <tr key={i} className="border-b border-slate-50 hover:bg-slate-50 transition-colors print:border-b-slate-200">
                  <td className="px-6 py-4 text-[11px] font-bold text-slate-500">{r.cod}</td>
                  <td className="px-4 py-4 text-[12px] font-black text-slate-800 uppercase">{r.nombre}</td>
                  <td className="px-4 py-4 text-[11px] font-bold text-slate-400">{r.operacion}</td>
                  <td className="px-6 py-4 text-right font-mono text-[13px] font-black text-slate-900">{r.monto.toLocaleString('es-VE')}</td>
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
// 8. VISTA: ACTIVOS FIJOS / INVERSIONES (RESTAURADO)
// ============================================================================
const ACTIVOS_FIJOS = [
  { grupo:'Vehículos',                   cod:'AF-V001', descripcion:'Camión Reparto — Chevrolet N300',          fechaAdq:'07/10/2025', costoOriginal:21110.23, depAcum:2637.53, vidaUtil:60 },
  { grupo:'Inmuebles',                   cod:'AF-I001', descripcion:'Local Comercial — Contrato Pacomela',      fechaAdq:'02/01/2026', costoOriginal:169547.91,depAcum:4238.70, vidaUtil:240 },
  { grupo:'Maquinaria y Equipos',        cod:'AF-M001', descripcion:'Equipos de Producción y Empaque',         fechaAdq:'01/06/2024', costoOriginal:15000.00, depAcum:3750.00, vidaUtil:60 },
  { grupo:'Maquinaria y Equipos',        cod:'AF-M002', descripcion:'Sistema de Refrigeración Industrial',     fechaAdq:'15/08/2024', costoOriginal:8500.00,  depAcum:1487.50, vidaUtil:84 },
  { grupo:'Mobiliario y Equipos Oficina',cod:'AF-O001', descripcion:'Mobiliario Oficina Administrativa',       fechaAdq:'01/03/2024', costoOriginal:3200.00,  depAcum:1280.00, vidaUtil:60 },
  { grupo:'Mobiliario y Equipos Oficina',cod:'AF-O002', descripcion:'Equipos de Computación y Periféricos',   fechaAdq:'15/09/2024', costoOriginal:4800.00,  depAcum:1200.00, vidaUtil:36 },
];

function InversionesView() {
  const grupos = [...new Set(ACTIVOS_FIJOS.map(a => a.grupo))];
  const fmt = v => new Intl.NumberFormat('es-VE', { minimumFractionDigits:2, maximumFractionDigits:2 }).format(v);
  const totalCosto = ACTIVOS_FIJOS.reduce((s,a) => s + a.costoOriginal, 0);
  const totalDep   = ACTIVOS_FIJOS.reduce((s,a) => s + a.depAcum, 0);
  const currentYear = new Date().getFullYear().toString();

  return (
    <div className="pb-20 animate-in fade-in">
      <PrintStyles />
      <header className="no-print bg-white/80 backdrop-blur-md border-b border-slate-200 p-4 flex justify-between items-center sticky top-0 z-30 shadow-sm rounded-b-2xl mb-6">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 shadow-sm">Año Fiscal: {currentYear}</span>
        </div>
        <div className="flex gap-3">
          <button onClick={() => window.print()} className="px-5 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase flex items-center gap-2 shadow-md hover:bg-slate-800 transition-colors"><Printer size={14}/> PDF</button>
          <button onClick={() => handleExportExcel('table-activos', 'Activos_Fijos', 'Registro de Activos Fijos')} className="px-5 py-2 bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase flex items-center gap-2 shadow-md hover:bg-emerald-600 transition-colors"><Download size={14}/> Excel</button>
        </div>
      </header>
      <main className="max-w-6xl mx-auto print-area">
        <HeaderMembretado isExport={true} />
        <div className="bg-white p-8 border border-slate-100 shadow-xl flex flex-col items-center text-center mb-8 rounded-[2rem] print:shadow-none print:border-none print:p-0 print:mb-6">
          <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-8 print:text-xl">Registro de Activos Fijos</h2>
          <div className="no-print grid grid-cols-3 gap-8 w-full max-w-3xl">
            {[{ label:'Costo Original', val:fmt(totalCosto), color:'text-slate-800' }, { label:'Dep. Acumulada', val:fmt(totalDep), color:'text-red-500' }, { label:'Valor Neto USD', val:fmt(totalCosto-totalDep), color:'text-orange-500' }].map(k => (
              <div key={k.label} className="bg-slate-50 rounded-2xl p-6 border border-slate-200 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">{k.label}</p>
                <p className={`text-2xl font-black font-mono ${k.color}`}>{k.val}</p>
              </div>
            ))}
          </div>
        </div>
        
        <div id="table-activos" className="space-y-6">
        {grupos.map(grupo => {
          const items = ACTIVOS_FIJOS.filter(a => a.grupo === grupo);
          const gCosto = items.reduce((s,a) => s + a.costoOriginal, 0);
          const gDep   = items.reduce((s,a) => s + a.depAcum, 0);
          return (
            <div key={grupo} className="bg-white rounded-[2rem] shadow-xl overflow-hidden border border-slate-100 print:shadow-none print:border-slate-300">
              <div className="bg-slate-50 px-8 py-5 flex justify-between items-center border-b border-slate-200">
                <span className="text-slate-800 font-black text-sm uppercase tracking-widest">{grupo}</span>
                <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Neto: <span className="text-slate-900 font-black ml-2 text-sm font-mono">USD {fmt(gCosto-gDep)}</span></span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse" style={{minWidth: '700px'}}>
                  <thead className="bg-white text-[10px] uppercase font-black text-slate-400 border-b border-slate-100">
                    <tr><th className="px-6 py-4">Código</th><th className="px-4 py-4">Descripción</th><th className="px-4 py-4">Adq.</th><th className="px-4 py-4 text-right">Costo USD</th><th className="px-4 py-4 text-right">Dep. Acum.</th><th className="px-6 py-4 text-right">Valor Neto</th></tr>
                  </thead>
                  <tbody>
                    {items.map((a,i) => (
                      <tr key={i} className="border-b border-slate-50 hover:bg-slate-50 transition-colors print:border-b-slate-200">
                        <td className="px-6 py-4 text-[11px] font-black text-slate-400">{a.cod}</td>
                        <td className="px-4 py-4 text-[11px] font-bold text-slate-800">{a.descripcion}</td>
                        <td className="px-4 py-4 text-[11px] text-slate-400">{a.fechaAdq}</td>
                        <td className="px-4 py-4 text-right text-[12px] font-mono text-slate-600">{fmt(a.costoOriginal)}</td>
                        <td className="px-4 py-4 text-right text-[12px] font-mono text-red-400">({fmt(a.depAcum)})</td>
                        <td className="px-6 py-4 text-right text-[12px] font-mono font-black text-slate-800">{fmt(a.costoOriginal-a.depAcum)}</td>
                      </tr>
                    ))}
                    <tr className="bg-slate-100 font-black text-[11px] border-t-2 border-slate-200">
                      <td colSpan={3} className="px-6 py-5 text-slate-700 uppercase tracking-widest">Total {grupo}</td>
                      <td className="px-4 py-5 text-right font-mono text-[13px] text-slate-800">{fmt(gCosto)}</td>
                      <td className="px-4 py-5 text-right font-mono text-[13px] text-red-500">({fmt(gDep)})</td>
                      <td className="px-6 py-5 text-right font-mono text-[14px] text-slate-900">{fmt(gCosto-gDep)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
        </div>
      </main>
    </div>
  );
}

// ============================================================================
// 9. APLICACIÓN PRINCIPAL (MENÚ LATERAL + DASHBOARD TIPO ERP)
// ============================================================================
function ReportesFinancierosApp() {
  const [view, setView] = useState('resultado');
  const [subView, setSubView] = useState(null); 
  const [menuOpen, setMenuOpen] = useState(true);

  // MANEJO DE ESTADO CONSTRUIDO PARA EVITAR ERRORES DE LOCALSTORAGE
  const [dbData, setDbData] = useState(() => { try { return JSON.parse(localStorage.getItem('j_db') || '[]'); } catch(e){return []} });
  const [planCuentas, setPlanCuentas] = useState(() => { try { return JSON.parse(localStorage.getItem('j_pc') || '{}'); } catch(e){return {}} });
  const [auxDataConfig, setAuxDataConfig] = useState(() => { try { return JSON.parse(localStorage.getItem('j_ax') || '{}'); } catch(e){return {}} });

  useEffect(() => {
    try {
      localStorage.setItem('j_db', JSON.stringify(dbData));
      localStorage.setItem('j_pc', JSON.stringify(planCuentas));
      localStorage.setItem('j_ax', JSON.stringify(auxDataConfig));
    } catch (e) {
      console.warn("Memoria Local superada. Los datos vivirán solo en esta sesión (hasta recargar).");
    }
  }, [dbData, planCuentas, auxDataConfig]);

  const MenuItem = ({ id, icon: Icon, label }) => (
    <button onClick={() => { setView(id); setSubView(null); if(window.innerWidth < 768) setMenuOpen(false); }} 
            className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all duration-300 ${view === id ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}>
      <Icon size={20} className={view === id ? 'text-white' : 'text-slate-400'}/> {label}
    </button>
  );

  return (
    <div className="flex h-screen bg-[#f4f7fa] font-sans overflow-hidden">
      
      {/* MENÚ LATERAL (SIDEBAR) */}
      <aside className={`no-print bg-white border-r border-slate-100 flex flex-col transition-all duration-300 z-40 ${menuOpen ? 'w-72' : 'w-0 hidden'} shadow-[10px_0_30px_rgba(0,0,0,0.02)] relative shrink-0`}>
        <div className="p-8 border-b border-slate-50 flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/30 shrink-0">
            <Activity size={24} className="text-white"/>
          </div>
          <div className="overflow-hidden whitespace-nowrap">
            <h1 className="text-2xl font-black text-slate-900 tracking-tighter uppercase leading-none">Supply</h1>
            <p className="text-[9px] font-black text-orange-500 tracking-[0.2em] uppercase mt-1">Jiret G&B Finance</p>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto overflow-x-hidden">
          <p className="px-6 py-4 text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Módulos Financieros</p>
          <MenuItem id="resultado" icon={LineChart} label="Resultados" />
          <MenuItem id="balance" icon={Scale} label="Balance General" />
          <MenuItem id="comparativo" icon={GitCompare} label="Variaciones" />
          <MenuItem id="inversiones" icon={Landmark} label="Activos Fijos" />
          
          <p className="px-6 pt-8 pb-4 text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Configuración</p>
          <MenuItem id="configuracion" icon={Database} label="Base de Datos" />
        </nav>
        
        <div className="p-6 border-t border-slate-50 text-center bg-slate-50/50">
           <p className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em]">Versión 5.0 PRO</p>
        </div>
      </aside>

      {/* ÁREA PRINCIPAL DE TRABAJO */}
      <main className="flex-1 h-screen overflow-y-auto relative bg-[#f4f7fa]">
        {/* Decoración Glassmorphism (Solo visible en pantallas grandes) */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none hidden md:block"></div>
        <div className="absolute top-[-10%] left-[-5%] w-[400px] h-[400px] bg-orange-400/10 rounded-full blur-[100px] pointer-events-none hidden md:block"></div>
        
        <div className="relative z-10 p-4 md:p-8">
          
          {/* Botón Flotante para abrir/cerrar menú */}
          <div className="no-print mb-6 flex items-center justify-between">
            <button onClick={()=>setMenuOpen(!menuOpen)} className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-500 hover:text-orange-500 shadow-md border border-slate-100 transition-all hover:scale-105 active:scale-95">
              {menuOpen ? <X size={20}/> : <Menu size={20}/>}
            </button>
            <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100 hidden md:flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Sistema Activo</span>
            </div>
          </div>

          {/* RENDERIZADO DINÁMICO DE VISTAS */}
          {view === 'resultado' && <EstadoResultadoView dbData={dbData}/>}
          {view === 'comparativo' && <AnalisisComparativoView dbData={dbData}/>}
          {view === 'inversiones' && <InversionesView />}
          
          {view === 'balance' && (
             subView?.type === 'auxiliar' 
             ? <AuxiliarReportView accountCode={subView.code} onBack={()=>setSubView(null)} auxDataConfig={auxDataConfig} />
             : <BalanceGeneralView dbData={dbData} auxDataConfig={auxDataConfig} setSubView={setSubView}/>
          )}

          {/* VISTA CONFIGURACIÓN E INGESTA DE DATOS */}
          {view === 'configuracion' && (
            <div className="max-w-4xl mx-auto bg-white/90 backdrop-blur-xl rounded-[2.5rem] p-8 md:p-12 border border-white shadow-[0_20px_50px_rgba(0,0,0,0.05)] animate-in fade-in slide-in-from-bottom-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
                 <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter flex items-center gap-4">
                   <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100 text-orange-500"><Database size={28}/></div> 
                   Ingesta de Datos
                 </h2>
                 <div className="text-left md:text-right bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Registros en Memoria</p>
                    <p className="text-2xl font-black text-slate-800 font-mono">{dbData.length}</p>
                 </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {[
                  { n:'01', l:'Plan de Cuentas (.txt)', h: (e)=>processPlanCuentas(e.target.files[0]).then(p=>{setPlanCuentas(p); alert("Plan de Cuentas Listo")}) },
                  { n:'02', l:'Saldos Iniciales (.csv / .xlsx)', h: (e)=>processSaldosBalance(e.target.files[0], planCuentas).then(d=>{setDbData(prev=>[...prev, ...d]); alert("Saldos Iniciales Cargados")}) },
                  { n:'03', l:'Meses (Resultados) (.xlsx)', h: (e)=>processFiles(e.target.files).then(d=>{setDbData(prev=>[...prev, ...d]); alert("Archivos procesados")}), m:true },
                  { n:'04', l:'Auxiliares CxC/CxP (.xlsx)', h: (e)=>processAuxFile(e.target.files).then(a=>{setAuxDataConfig(a); alert("Auxiliares listos")}), m:true }
                ].map(s => (
                  <label key={s.n} className="flex items-center gap-5 p-6 rounded-3xl border border-slate-100 bg-white cursor-pointer hover:border-orange-500/30 hover:shadow-[0_10px_20px_rgba(249,115,22,0.05)] hover:-translate-y-1 transition-all duration-300 group">
                    <span className="text-3xl font-black font-mono text-slate-100 group-hover:text-orange-200 transition-colors">{s.n}</span>
                    <span className="flex-1 font-bold text-[11px] md:text-xs uppercase tracking-wider text-slate-600 group-hover:text-slate-900">{s.l}</span>
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:bg-orange-50 transition-colors">
                      <Upload size={20} className="text-slate-300 group-hover:text-orange-500"/>
                    </div>
                    <input type="file" multiple={s.m} className="hidden" onChange={s.h}/>
                  </label>
                ))}
              </div>
              
              <div className="mt-12 p-6 bg-red-50/50 border border-red-100 rounded-3xl">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-black text-red-600 uppercase tracking-widest mb-1">Zona de Peligro</h3>
                    <p className="text-xs font-bold text-red-400">Esta acción borrará toda la información cargada en el sistema.</p>
                  </div>
                  <button onClick={()=>{if(window.confirm("¿Estás seguro de borrar toda la base de datos? Esta acción no se puede deshacer.")){setDbData([]); setPlanCuentas({}); setAuxDataConfig({})}}} 
                          className="w-full md:w-auto px-6 py-3 bg-white border-2 border-red-100 text-red-500 font-black uppercase text-[11px] tracking-widest rounded-xl hover:bg-red-500 hover:border-red-500 hover:text-white transition-all duration-300 shadow-sm">
                    Limpiar Sistema
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

export default ReportesFinancierosApp;

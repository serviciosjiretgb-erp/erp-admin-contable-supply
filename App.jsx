import React, { useState, useMemo, useEffect } from 'react';
import { 
  ArrowLeft, Upload, CheckCircle, Scale, 
  LineChart, CalendarDays, AlertTriangle, ChevronRight, ChevronDown, Star, PlusCircle, Trash2, ArrowUpRight, ArrowDownRight, GitCompare, Landmark, FileSpreadsheet,
  FileText, Users, Briefcase, Search, BookOpen, Database, FileOutput, Printer, Download, Activity
} from 'lucide-react';

// ============================================================================
// 0. ESTILOS DE IMPRESIÓN Y DISEÑO PROFESIONAL
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
// 1. MOTOR DE EXPORTACIÓN EXCEL (FIX: NO PISA DATOS)
// ============================================================================
const handleExportExcel = (tableId, fileName, reportTitle) => {
  if (!window.XLSX) { alert("Cargando librería..."); return; }
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
  const detectYear = (n) => { const y = (n||'').match(/20\d{2}/); return y ? y[0] : '2026'; };

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
        while (idx >= 0) { if (pathStack[idx].toUpperCase() === what) { pathStack.splice(idx); break; } idx--; }
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
  const year = file.name.match(/20\d{2}/) ? file.name.match(/20\d{2}/)[0] : '2026';

  const parseVal = (v) => {
    if (!v) return 0;
    if (typeof v === 'number') return v;
    let s = String(v).replace(/USD|Bs\./ig, '').trim();
    if (s.includes(',') && s.includes('.')) s = s.replace(/\./g, '').replace(/,/g, '.');
    else if (s.includes(',')) s = s.replace(/,/g, '.');
    return isNaN(parseFloat(s)) ? 0 : parseFloat(s);
  };

  return rows.filter((r, i) => i > 0 && r[0]).map(row => {
    const name = String(row[0]).trim();
    // REGLA: Ignorar montos de CxC y CxP del archivo de saldos para que no se dupliquen
    const isAuxAccount = name.startsWith('1.1.02') || name.startsWith('2.1.01');
    return {
      month: 'Saldos Iniciales',
      year,
      path: planCuentas[name] || 'ACTIVOS>OTROS',
      name,
      usd: isAuxAccount ? 0 : parseVal(row[1]),
      bs: 0
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
// 3. COMPONENTE: FILAS CON RELIEVE 3D
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

  if (!isLeaf && !/^\d\./.test(node.n)) {
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
    <tr onClick={() => !isLeaf && setIsOpen(!isOpen)} className={`border-b border-slate-50 hover:bg-slate-50 transition-all ${isHigh ? 'bg-amber-50 border-l-4 border-amber-500' : 'bg-white border-l-4 border-transparent'}`}>
      <td style={indent} className="py-2.5 px-3 font-bold text-[11px] text-slate-700 uppercase flex items-center gap-2">
        <button onClick={(e) => {e.stopPropagation(); toggleHighlight(node.n)}} className="no-print"><Star size={14} fill={isHigh?"#f59e0b":"none"} color={isHigh?"#f59e0b":"#cbd5e1"}/></button>
        <span className="truncate max-w-[280px]">{node.n}</span>
        {hasMapping && <button onClick={(e)=>{e.stopPropagation(); onShowReport(accountCode)}} className="no-print ml-2 px-2 py-0.5 bg-slate-800 text-white text-[9px] rounded font-black hover:bg-orange-500 shadow-sm">AUX</button>}
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
  const [selectedYear, setSelectedYear] = useState(availableYears[availableYears.length - 1] || '2026');
  const availableMonths = useMemo(() => [...new Set(dbData.filter(d => d.year === selectedYear).map(d => d.month))].filter(m=>m!=='Sin Mes' && m!=='Saldos Iniciales'), [dbData, selectedYear]);
  const [selectedMonth, setSelectedMonth] = useState('General');

  const { trees, totals } = useMemo(() => {
    const data = selectedMonth === 'General' ? dbData.filter(d=>d.year===selectedYear) : dbData.filter(d=>d.year===selectedYear && d.month===selectedMonth);
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

    const isIng = i => (i.path||'').includes('INGRESO') || (i.name||'').startsWith('4');
    const isCos = i => (i.path||'').includes('COSTO') || (i.name||'').startsWith('5');
    const tIng = build(resData.filter(isIng), -1);
    const tCos = build(resData.filter(isCos));
    const tGas = build(resData.filter(i => !isIng(i) && !isCos(i)));

    const s = (n) => n.reduce((a,c)=>a+c.u, 0);
    const ti=s(tIng), tc=s(tCos), tg=s(tGas);
    return { trees: { tIng, tCos, tGas }, totals: { ti, tc, tg, ub: ti-tc, un: (ti-tc)-tg } };
  }, [dbData, selectedMonth, selectedYear]);

  return (
    <div className="min-h-screen bg-[#f8fafc] print:bg-white pb-20">
      <PrintStyles />
      <header className="no-print bg-white/80 backdrop-blur-md border-b border-slate-200 p-4 flex justify-between items-center sticky top-0 z-30 shadow-sm">
        <button onClick={onBack} className="flex items-center gap-2 font-black text-xs text-slate-500 uppercase hover:text-slate-900"><ArrowLeft size={16}/> Panel</button>
        <div className="flex gap-2">
          <select value={selectedYear} onChange={e=>setSelectedYear(e.target.value)} className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded p-1.5 font-bold">{availableYears.map(y=><option key={y}>{y}</option>)}</select>
          <select value={selectedMonth} onChange={e=>setSelectedMonth(e.target.value)} className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded p-1.5 font-bold"><option value="General">Acumulado</option>{availableMonths.map(m=><option key={m}>{m}</option>)}</select>
          <button onClick={()=>window.print()} className="px-3 py-1.5 bg-slate-800 text-white rounded text-[10px] font-black uppercase"><Printer size={14}/></button>
          <button onClick={()=>handleExportExcel('table-res', 'Estado_Resultados', 'Estado de Resultados')} className="px-3 py-1.5 bg-emerald-700 text-white rounded text-[10px] font-black uppercase"><Download size={14}/></button>
        </div>
      </header>
      <main className="p-4 md:p-8 max-w-5xl mx-auto">
        <HeaderMembretado isExport={true}/>
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          <table id="table-res" className="w-full text-left border-collapse">
            <thead className="bg-slate-100 text-[10px] font-black text-slate-500 uppercase border-b border-slate-300">
              <tr><th className="px-4 py-4 w-[55%]">Cuentas</th><th className="px-3 py-4 text-right">Saldo USD</th><th className="px-3 py-4 text-right hidden sm:table-cell">Saldo Bs.</th><th className="px-3 py-4 text-right">%</th></tr>
            </thead>
            <tbody>
              <tr className="bg-white border-b border-slate-200 font-black text-xs uppercase"><td colSpan={4} className="p-4">I. INGRESOS</td></tr>
              {trees.tIng.map((n,i)=><ExpandableRow key={i} node={n} totalBaseUSD={totals.ti}/>)}
              <tr className="bg-slate-900 text-white font-black border-y-4 border-orange-500"><td className="p-5 uppercase text-sm">V. RESULTADO NETO</td><td className="p-5 text-right text-lg font-mono text-orange-400">{new Intl.NumberFormat('es-VE').format(totals.un)}</td><td className="hidden sm:table-cell"/><td className="p-5 text-right font-mono">{(Math.abs(totals.un)/(totals.ti||1)*100).toFixed(2)}%</td></tr>
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

// ============================================================================
// 6. VISTA: BALANCE GENERAL (ACUMULATIVO REAL)
// ============================================================================
function BalanceGeneralView({ onBack, dbData, auxDataConfig }) {
  const availableYears = useMemo(() => [...new Set(dbData.map(d => d.year))].filter(Boolean).sort(), [dbData]);
  const [selectedYear, setSelectedYear] = useState(availableYears[availableYears.length - 1] || '2026');
  const availableMonths = useMemo(() => [...new Set(dbData.filter(d => d.year === selectedYear).map(d => d.month))].filter(m=>m!=='Sin Mes'), [dbData, selectedYear]);
  const [selectedMonth, setSelectedMonth] = useState(availableMonths[availableMonths.length - 1] || 'Enero');
  const [activeCode, setActiveCode] = useState(null);

  const tree = useMemo(() => {
    const limitOrder = monthOrder[selectedMonth];
    // Lógica Acumulativa: Todo lo anterior + el mes seleccionado
    const historical = dbData.filter(d => d.year === selectedYear && monthOrder[d.month] <= limitOrder);
    
    // Inyección de Auxiliares
    const auxs = [];
    for (const code in auxDataConfig) {
      const sum = auxDataConfig[code].records.reduce((a,r)=>a+r.monto, 0);
      if (sum !== 0) auxs.push({
        name: `${code} - ${auxDataConfig[code].label}`,
        path: code.startsWith('1') ? 'ACTIVOS>CIRCULANTE>CXC' : 'PASIVOS>CIRCULANTE>CXP',
        usd: sum, bs: 0
      });
    }

    const all = [...historical, ...auxs];
    const root = [];
    all.forEach(i => {
      if (!i.path?.toUpperCase().includes('ACTIVO') && !i.path?.toUpperCase().includes('PASIVO') && !/^[123]/.test(i.name)) return;
      let cur = root;
      const path = (i.path || 'OTROS').split('>');
      path.forEach(f => {
        let folder = cur.find(n => n.n === f);
        if (!folder) { folder = { n: f, c: [], u: 0, b: 0 }; cur.push(folder); }
        cur = folder.c;
      });
      let leaf = cur.find(n => n.n === i.name);
      if (!leaf) cur.push({ n: i.name, u: i.usd, b: i.bs, isLeaf: true });
      else { leaf.u += i.usd; leaf.b += i.bs; }
    });
    const comp = (nodes) => {
      let u=0, b=0; nodes.forEach(n => { if(!n.isLeaf){ const t=comp(n.c); n.u=t.u; n.b=t.b; } u+=n.u; b+=n.b; });
      return {u, b};
    };
    comp(root); 
    return root.sort((a,b) => (a.n.includes('ACTIVO') ? -1 : 1));
  }, [dbData, selectedMonth, selectedYear, auxDataConfig]);

  let ta=0, tp=0; tree.forEach(n => { if(n.n.includes('ACTIVO')) ta+=n.u; else tp+=n.u; });
  if (activeCode) return <AuxiliarReportView accountCode={activeCode} onBack={()=>setActiveCode(null)} auxDataConfig={auxDataConfig} />;

  return (
    <div className="min-h-screen bg-[#f8fafc] print:bg-white pb-20">
      <PrintStyles />
      <header className="no-print bg-white border-b border-slate-200 p-4 flex justify-between items-center sticky top-0 z-30 shadow-sm">
        <button onClick={onBack} className="flex items-center gap-2 font-black text-xs text-slate-500 uppercase hover:text-slate-900 transition-colors"><ArrowLeft size={16}/> Panel</button>
        <div className="flex gap-2">
          <select value={selectedYear} onChange={e=>setSelectedYear(e.target.value)} className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded p-1.5 font-bold">{availableYears.map(y=><option key={y}>{y}</option>)}</select>
          <select value={selectedMonth} onChange={e=>setSelectedMonth(e.target.value)} className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded p-1.5 font-bold">{availableMonths.map(m=><option key={m}>{m}</option>)}</select>
          <button onClick={()=>window.print()} className="px-3 py-1.5 bg-slate-800 text-white rounded text-[10px] font-black uppercase"><Printer size={14}/></button>
          <button onClick={()=>handleExportExcel('table-bg', 'Balance_General', 'Balance General')} className="px-3 py-1.5 bg-emerald-700 text-white rounded text-[10px] font-black uppercase"><Download size={14}/></button>
        </div>
      </header>
      <main className="p-4 md:p-8 max-w-5xl mx-auto">
        <HeaderMembretado isExport={true} />
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          <table id="table-bg" className="w-full text-left border-collapse">
            <thead className="bg-slate-100 text-[10px] font-black text-slate-500 uppercase border-b border-slate-300">
              <tr><th className="px-4 py-4 w-[55%]">Estructura</th><th className="px-3 py-4 text-right">Saldo USD</th><th className="px-3 py-4 text-right hidden sm:table-cell">Saldo Bs.</th><th className="px-3 py-4 text-right">%</th></tr>
            </thead>
            <tbody>
              {tree.map((n,i)=><ExpandableRow key={i} node={n} totalBaseUSD={ta} onShowReport={setActiveCode} isBalance={true}/>)}
              <tr className="bg-black text-white font-black border-t-4 border-orange-500">
                <td colSpan={4} className="p-6">
                  <div className="flex justify-between items-center px-4">
                    <div className="flex items-center gap-4"><Scale size={32} className="text-slate-400"/><div><p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest leading-none mb-1">Ecuación Patrimonial</p><p className="text-xs font-black tracking-widest">ACTIVOS = PASIVOS + PATRIMONIO</p></div></div>
                    <div className="flex gap-10 text-right">
                      <div><p className="text-[10px] text-slate-400 uppercase font-bold">Total Activos</p><p className="text-xl font-mono text-white">USD {ta.toLocaleString('es-VE')}</p></div>
                      <div><p className="text-[10px] text-slate-400 uppercase font-bold">Pasivo + Pat.</p><p className="text-xl font-mono text-white">USD {tp.toLocaleString('es-VE')}</p></div>
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
// 7. VISTA: SUB-REPORTE AUXILIAR DINÁMICO
// ============================================================================
function AuxiliarReportView({ accountCode, onBack, auxDataConfig }) {
  const group = auxDataConfig[accountCode] || { label: 'Sin registros', records: [] };
  const total = group.records.reduce((a,c)=>a+c.monto, 0);

  return (
    <div className="animate-in fade-in bg-[#f8fafc] min-h-screen p-4 pb-20">
      <header className="bg-white border-b border-slate-200 p-4 mb-6 flex justify-between items-center shadow-sm">
        <button onClick={onBack} className="flex items-center gap-2 font-black text-xs text-slate-500 uppercase"><ArrowLeft size={16}/> Volver</button>
        <button onClick={()=>window.print()} className="px-4 py-2 bg-slate-800 text-white rounded text-[10px] font-black uppercase flex items-center gap-2"><Printer size={14}/> PDF</button>
      </header>
      <main className="max-w-5xl mx-auto">
        <HeaderMembretado isExport={true} />
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xl mb-6 flex justify-between items-center">
          <div><h2 className="text-2xl font-black text-slate-900 uppercase">Detalle Auxiliar</h2><p className="text-slate-400 font-bold uppercase text-xs">Cuenta: {accountCode} - {group.label}</p></div>
          <div className="text-right"><p className="text-[10px] font-black text-slate-400 uppercase">Saldo Neto USD</p><p className="text-3xl font-mono font-black text-slate-900">{total.toLocaleString('es-VE')}</p></div>
        </div>
        <table id="table-aux" className="w-full text-left bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <thead className="bg-slate-800 text-white text-[9px] font-black uppercase">
            <tr><th className="p-4">Código</th><th className="p-4">Descripción</th><th className="p-4">Operación</th><th className="p-4 text-right">Monto USD</th></tr>
          </thead>
          <tbody>
            {group.records.map((r,i)=>(
              <tr key={i} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                <td className="p-3 text-[11px] font-bold text-slate-500">{r.cod}</td><td className="p-3 text-[11px] font-black text-slate-800">{r.nombre}</td><td className="p-3 text-[11px] text-slate-600">{r.operacion}</td><td className="p-3 text-right font-mono text-[11px] font-black">{r.monto.toLocaleString('es-VE')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>
    </div>
  );
}

// ============================================================================
// 8. DASHBOARD PRINCIPAL (TEMA CLARO CON RELIEVE 3D)
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
    <div className="min-h-screen bg-[#f1f5f9] p-8">
      <div className="max-w-3xl mx-auto bg-white rounded-3xl p-10 border border-slate-200 shadow-2xl">
        <button onClick={()=>setView('dashboard')} className="flex items-center gap-2 font-black text-[10px] uppercase text-slate-400 mb-8"><ArrowLeft size={16}/> Volver al Panel</button>
        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-8 flex items-center gap-3"><Database className="text-orange-500"/> Ingesta de Información</h2>
        <div className="space-y-4">
          {[
            { n:'01', l:'Plan de Cuentas (.txt)', h: (e)=>processPlanCuentas(e.target.files[0]).then(p=>{setPlanCuentas(p); alert("OK")}) },
            { n:'02', l:'Saldos Iniciales — Balance (.xlsx)', h: (e)=>processSaldosBalance(e.target.files[0], planCuentas).then(d=>setDbData(prev=>[...prev, ...d])) },
            { n:'03', l:'Estado de Resultados (.xlsx)', h: (e)=>processFiles(e.target.files).then(d=>setDbData(prev=>[...prev, ...d])), m:true },
            { n:'04', l:'Auxiliares CxC / CxP (.xlsx)', h: (e)=>processAuxFile(e.target.files).then(a=>setAuxDataConfig(a)), m:true }
          ].map(s => (
            <label key={s.n} className="flex items-center gap-5 p-5 rounded-2xl border-2 border-slate-100 cursor-pointer hover:border-orange-500/40 hover:bg-orange-50/30 transition-all group shadow-sm active:scale-[0.98]">
              <span className="text-2xl font-black font-mono text-slate-200 group-hover:text-orange-500 transition-colors">{s.n}</span>
              <span className="flex-1 font-bold text-xs uppercase tracking-wider text-slate-600">{s.l}</span>
              <Upload size={20} className="text-slate-300 group-hover:text-orange-500"/>
              <input type="file" multiple={s.m} className="hidden" onChange={s.h}/>
            </label>
          ))}
        </div>
        <button onClick={()=>{if(window.confirm("¿Borrar todo?")){setDbData([]); setPlanCuentas({}); setAuxDataConfig({})}}} className="w-full mt-10 p-4 border border-red-200 text-red-500 font-black uppercase text-[10px] rounded-2xl hover:bg-red-50 transition-all">Limpiar Base de Datos</button>
      </div>
    </div>
  );

  if (view === 'resultado') return <EstadoResultadoView onBack={()=>setView('dashboard')} dbData={dbData}/>;
  if (view === 'balance')   return <BalanceGeneralView onBack={()=>setView('dashboard')} dbData={dbData} auxDataConfig={auxDataConfig}/>;

  return (
    <div className="min-h-screen bg-[#f4f7fa] relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]"></div>
      <header className="relative z-10 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.05)] border-b border-slate-200 p-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3 uppercase"><Activity size={32} className="text-orange-500"/> Jiret G&B <span className="text-slate-400 font-normal">Finance</span></h1>
          <p className="text-[10px] font-black text-slate-400 tracking-[0.3em] uppercase mt-1">Servicios Administrativos Contables</p>
        </div>
        <button onClick={()=>setView('configuracion')} className="bg-white border-2 border-slate-100 hover:border-orange-500 hover:text-orange-600 px-6 py-3 rounded-2xl font-black uppercase text-[10px] shadow-sm transition-all flex items-center gap-2"><Database size={16}/> Configuración</button>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-10 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {[
            { id:'resultado', t:'Estado de Resultados', d:'Rentabilidad Mensual', i:<LineChart size={32}/> },
            { id:'balance', t:'Balance General', d:'Situación Financiera', i:<Scale size={32}/> },
            { id:'comparativo', t:'Análisis Variación', d:'Mes vs Mes', i:<GitCompare size={32}/> },
            { id:'config', t:'Base de Datos', d:'Ingesta de Archivos', i:<Database size={32}/>, act:()=>setView('configuracion') }
          ].map(m => (
            <button key={m.id} onClick={m.act || (()=>setView(m.id))} className="group relative bg-white rounded-[2rem] p-10 text-left border-b-8 border-slate-200 shadow-[0_15px_30px_rgba(0,0,0,0.05)] hover:shadow-[0_25px_50px_rgba(0,0,0,0.1)] hover:-translate-y-3 hover:border-orange-500 transition-all duration-300">
              <div className="bg-slate-50 w-20 h-20 rounded-3xl flex items-center justify-center mb-8 border border-slate-100 shadow-[inset_0_4px_8px_rgba(0,0,0,0.05)] group-hover:bg-orange-50 group-hover:border-orange-200 text-slate-600 group-hover:text-orange-500 transition-colors">
                {m.i}
              </div>
              <h3 className="font-black text-base text-slate-900 mb-2 uppercase tracking-tighter leading-none">{m.t}</h3>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{m.d}</p>
              <div className="absolute bottom-10 right-10 opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all"><ChevronRight className="text-orange-500" size={24}/></div>
            </button>
          ))}
        </div>
        <p className="text-center text-slate-300 font-black text-[10px] uppercase tracking-[0.5em] mt-32">Supply ERP · High Impact Accounting v4.0</p>
      </main>
    </div>
  );
}

export default ReportesFinancierosApp;

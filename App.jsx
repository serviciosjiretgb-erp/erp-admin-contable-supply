import React, { useState, useMemo, useEffect } from 'react';
import { 
  ArrowLeft, Upload, CheckCircle, Scale, 
  LineChart, CalendarDays, AlertTriangle, ChevronRight, ChevronDown, Star, PlusCircle, Trash2, ArrowUpRight, ArrowDownRight, GitCompare, Landmark, FileSpreadsheet
} from 'lucide-react';

// ============================================================================
// LÓGICA DE PROCESAMIENTO
// ============================================================================

const loadSheetJS = () => new Promise((resolve, reject) => {
  if (window.XLSX) { resolve(window.XLSX); return; }
  const s = document.createElement('script');
  s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
  s.onload  = () => resolve(window.XLSX);
  s.onerror = () => reject(new Error('No se pudo cargar SheetJS'));
  document.head.appendChild(s);
});

const processFiles = async (files) => {
  let allParsedData = [];

  const detectMonth = (name) => {
    const m = name.match(/(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)/i);
    return m ? m[0].charAt(0).toUpperCase() + m[0].slice(1).toLowerCase() : 'Sin Mes';
  };

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const ext = file.name.split('.').pop().toLowerCase();
    const month = detectMonth(file.name);
    let dataRows = [];

    if (ext === 'xlsx' || ext === 'xls' || ext === 'xlsm') {
      const XL = await loadSheetJS();
      const buffer = await file.arrayBuffer();
      const wb = XL.read(buffer, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      dataRows = XL.utils.sheet_to_json(ws, { header: 1, defval: null });
    } else if (ext === 'csv' || ext === 'txt') {
      const text = await file.text();
      const lines = text.split(/\r?\n/);
      dataRows = lines.map(line => {
        if (!line.trim()) return null;
        return line.split(/[,;](?=(?:(?:[^"]*"){2})*[^"]*$)/).map(c => c.replace(/^"|"$/g, '').trim());
      }).filter(Boolean);
    }

    if (dataRows.length === 0) continue;
    let pathStack = [];

    const smartPop = (stack, totalName) => {
      const what = totalName.replace(/^Total\s+/i, '').trim();
      let idx = stack.length - 1;
      while (idx >= 0) {
        if (stack[idx].trim() === what) { stack.splice(idx); break; }
        idx--;
      }
    };

    const parseVal = (v) => {
      if (v === null || v === undefined || v === '') return null;
      if (typeof v === 'number') return v;
      let cleanStr = String(v).replace(/\$|Bs\./ig, '').trim();
      if (cleanStr.includes(',') && cleanStr.includes('.')) cleanStr = cleanStr.replace(/,/g, '');
      else if (cleanStr.includes(',') && !cleanStr.includes('.')) cleanStr = cleanStr.replace(/,/g, '.');
      const n = parseFloat(cleanStr);
      return isNaN(n) ? null : n;
    };

    for (let r = 0; r < dataRows.length; r++) {
      const row = dataRows[r];
      if (!row || row.length === 0) continue;
      const name = row[0] != null ? String(row[0]).trim() : '';
      if (!name || name === 'Etiquetas de fila' || name === 'RESULTADO DEL EJERCICIO') continue;
      if (name.startsWith('Total ')) { smartPop(pathStack, name); continue; }
      
      const usdStr = row[1];
      const bsStr = row[2];
      
      if (String(usdStr).includes('SALDO NETO') || String(bsStr).includes('SALDO NETO')) {
        pathStack.push(name);
        continue;
      }
      
      const usd = parseVal(usdStr);
      const bs = parseVal(bsStr);
      
      if (usd !== null) {
        allParsedData.push({ month, path: pathStack.join('>'), name, usd: usd, bs: bs || 0 });
      } else {
        pathStack.push(name);
      }
    }
  }
  return allParsedData;
};

// ============================================================================
// COMPONENTES: VISTA MENSUAL / GENERAL
// ============================================================================
const ExpandableRow = ({ node, level = 0, totalVentasUSD, defaultOpen = false, highlightedAccounts, toggleHighlight }) => {
  const isAccountNode = /^\d\./.test(node.n);
  const isLeaf = !node.c || node.c.length === 0;
  const [isOpen, setIsOpen] = useState(defaultOpen);

  useEffect(() => { setIsOpen(defaultOpen); }, [defaultOpen]);

  const fmtCur = (v) => new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);
  const pct = totalVentasUSD && node.u !== 0 ? `${((node.u / totalVentasUSD) * 100).toFixed(2)}%` : '';
  const indent = { paddingLeft: `${level * 18 + 10}px` };

  if (!isLeaf && !isAccountNode) {
    const isRoot = level === 0;
    return (
      <>
        <tr className={isRoot ? 'bg-[#111827]' : 'bg-white border-b border-gray-100'}>
          <td style={indent} className={isRoot ? 'py-3 px-3 text-orange-500 font-black text-xs uppercase tracking-[0.2em]' : 'py-2 px-3 font-black text-[11px] text-slate-800 uppercase'}>
            {node.n}
          </td>
          <td colSpan={3} />
        </tr>
        {node.c.map((child, i) => (
          <ExpandableRow key={i} node={child} level={level + 1} totalVentasUSD={totalVentasUSD} defaultOpen={defaultOpen} highlightedAccounts={highlightedAccounts} toggleHighlight={toggleHighlight}/>
        ))}
        <tr className={`${isRoot ? 'bg-slate-900 text-white border-t-2 border-orange-500' : 'bg-slate-200 text-slate-800 border-t border-slate-300'} shadow-sm transition-colors`}>
          <td style={{ paddingLeft: level * 18 + 28 }} className="py-2.5 px-3 font-black text-[10px] uppercase tracking-wider">TOTAL {node.n}</td>
          <td className={`py-2.5 px-3 text-right font-mono text-[11px] font-black ${isRoot ? 'text-orange-500' : 'text-slate-900'}`}>{fmtCur(node.u)}</td>
          <td className={`py-2.5 px-3 text-right font-mono text-[11px] font-black hidden sm:table-cell ${isRoot ? 'text-orange-500' : 'text-slate-900'}`}>{fmtCur(node.b)}</td>
          <td className={`py-2.5 px-3 text-right font-mono text-[11px] font-black ${isRoot ? 'text-orange-500' : 'text-slate-900'}`}>{pct}</td>
        </tr>
      </>
    );
  }

  if (!isLeaf && isAccountNode) {
    const isHighlighted = highlightedAccounts.has(node.n);
    return (
      <>
        <tr onClick={() => setIsOpen(!isOpen)} className={`border-b border-gray-200 cursor-pointer transition-colors ${isHighlighted ? 'bg-amber-100/80 hover:bg-amber-200 border-l-4 border-amber-500' : 'bg-white hover:bg-orange-50 border-l-4 border-orange-400'}`}>
          <td style={indent} className="py-2.5 px-3 font-bold text-[11px] text-slate-900 uppercase select-none flex items-center">
            <span className={`inline-flex items-center justify-center w-4 h-4 mr-2 border rounded-sm text-[11px] leading-none transition-colors ${isOpen ? 'border-orange-500 text-orange-600 bg-orange-100' : 'border-slate-300 text-slate-400 bg-white'}`}>{isOpen ? '−' : '+'}</span>
            <button onClick={(e) => { e.stopPropagation(); toggleHighlight(node.n); }} className="mr-2 focus:outline-none transition-transform hover:scale-110" title={isHighlighted ? "Quitar resaltado" : "Resaltar cuenta"}><Star size={16} fill={isHighlighted ? "#f59e0b" : "none"} color={isHighlighted ? "#f59e0b" : "#cbd5e1"} /></button>
            <span className="truncate">{node.n}</span>
          </td>
          <td className={`py-2.5 px-3 text-right font-mono text-[11px] font-bold ${isHighlighted ? 'text-amber-900' : 'text-slate-800'}`}>{fmtCur(node.u)}</td>
          <td className={`py-2.5 px-3 text-right font-mono text-[11px] font-bold hidden sm:table-cell ${isHighlighted ? 'text-amber-900' : 'text-slate-800'}`}>{fmtCur(node.b)}</td>
          <td className={`py-2.5 px-3 text-right font-mono text-[11px] font-bold ${isHighlighted ? 'text-amber-700' : 'text-slate-500'}`}>{pct}</td>
        </tr>
        {isOpen && node.c.map((child, i) => (
          <ExpandableRow key={i} node={child} level={level + 1} totalVentasUSD={totalVentasUSD} defaultOpen={defaultOpen} highlightedAccounts={highlightedAccounts} toggleHighlight={toggleHighlight}/>
        ))}
      </>
    );
  }

  if (isLeaf) {
    return (
      <tr className="bg-slate-50/50 border-b border-gray-100 hover:bg-white transition-colors">
        <td style={indent} className="py-1.5 px-3 text-[10px] text-slate-600 pl-8 relative">
          <div className="absolute left-4 top-0 bottom-0 w-px bg-slate-200"></div><div className="absolute left-4 top-1/2 w-2 h-px bg-slate-200"></div>
          <span className="ml-2 italic">{node.n}</span>
        </td>
        <td className={`py-1.5 px-3 text-right font-mono text-[10px] whitespace-nowrap ${node.u < 0 ? 'text-red-500' : 'text-slate-700'}`}>{fmtCur(node.u)}</td>
        <td className={`py-1.5 px-3 text-right font-mono text-[10px] hidden sm:table-cell whitespace-nowrap ${node.b < 0 ? 'text-red-500' : 'text-slate-500'}`}>{fmtCur(node.b)}</td>
        <td className="py-1.5 px-3 text-right font-mono text-[10px] text-slate-400">{pct}</td>
      </tr>
    );
  }
  return null;
};

// ============================================================================
// COMPONENTES: VISTA COMPARATIVA 
// ============================================================================
const ExpandableComparativeRow = ({ node, level = 0, defaultOpen = false }) => {
  const isAccountNode = /^\d\./.test(node.n);
  const isLeaf = !node.c || node.c.length === 0;
  const [isOpen, setIsOpen] = useState(defaultOpen);

  useEffect(() => { setIsOpen(defaultOpen); }, [defaultOpen]);

  const fmtCur = (v) => new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);
  const indent = { paddingLeft: `${level * 18 + 10}px` };

  const varAbs = node.m2_u - node.m1_u;
  const varPct = node.m1_u !== 0 ? (varAbs / Math.abs(node.m1_u)) * 100 : (node.m2_u !== 0 ? 100 : 0);
  
  const isPositive = varAbs > 0;
  const isNegative = varAbs < 0;
  const colorClass = isPositive ? 'text-emerald-600' : (isNegative ? 'text-red-500' : 'text-slate-400');
  const ArrowIcon = isPositive ? ArrowUpRight : (isNegative ? ArrowDownRight : null);

  if (!isLeaf && !isAccountNode) {
    const isRoot = level === 0;
    return (
      <>
        <tr className={isRoot ? 'bg-[#111827]' : 'bg-white border-b border-gray-100'}>
          <td style={indent} className={isRoot ? 'py-3 px-3 text-orange-500 font-black text-xs uppercase tracking-[0.2em]' : 'py-2 px-3 font-black text-[11px] text-slate-800 uppercase'}>{node.n}</td>
          <td colSpan={4} />
        </tr>
        {node.c.map((child, i) => (
          <ExpandableComparativeRow key={i} node={child} level={level + 1} defaultOpen={defaultOpen}/>
        ))}
        <tr className={`${isRoot ? 'bg-slate-900 text-white border-t-2 border-orange-500' : 'bg-slate-200 text-slate-800 border-t border-slate-300'} shadow-sm transition-colors`}>
          <td style={{ paddingLeft: level * 18 + 28 }} className="py-2.5 px-3 font-black text-[10px] uppercase tracking-wider">TOTAL {node.n}</td>
          <td className={`py-2.5 px-3 text-right font-mono text-[11px] font-black ${isRoot ? 'text-white' : 'text-slate-900'}`}>{fmtCur(node.m1_u)}</td>
          <td className={`py-2.5 px-3 text-right font-mono text-[11px] font-black ${isRoot ? 'text-white' : 'text-slate-900'}`}>{fmtCur(node.m2_u)}</td>
          <td className={`py-2.5 px-3 text-right font-mono text-[11px] font-black ${isRoot ? 'text-orange-500' : 'text-slate-900'}`}>{fmtCur(varAbs)}</td>
          <td className={`py-2.5 px-3 text-right font-mono text-[11px] font-black flex justify-end items-center gap-1 ${colorClass}`}>
            {ArrowIcon && <ArrowIcon size={12}/>} {Math.abs(varPct).toFixed(2)}%
          </td>
        </tr>
      </>
    );
  }

  if (!isLeaf && isAccountNode) {
    return (
      <>
        <tr onClick={() => setIsOpen(!isOpen)} className="bg-white hover:bg-orange-50 border-l-4 border-orange-400 border-b border-gray-200 cursor-pointer transition-colors">
          <td style={indent} className="py-2.5 px-3 font-bold text-[11px] text-slate-900 uppercase select-none flex items-center">
            <span className={`inline-flex items-center justify-center w-4 h-4 mr-2 border rounded-sm text-[11px] leading-none transition-colors ${isOpen ? 'border-orange-500 text-orange-600 bg-orange-100' : 'border-slate-300 text-slate-400 bg-white'}`}>{isOpen ? '−' : '+'}</span>
            <span className="truncate">{node.n}</span>
          </td>
          <td className="py-2.5 px-3 text-right font-mono text-[11px] font-bold text-slate-600">{fmtCur(node.m1_u)}</td>
          <td className="py-2.5 px-3 text-right font-mono text-[11px] font-bold text-slate-800">{fmtCur(node.m2_u)}</td>
          <td className={`py-2.5 px-3 text-right font-mono text-[11px] font-bold ${varAbs !== 0 ? 'text-orange-600' : 'text-slate-400'}`}>{fmtCur(varAbs)}</td>
          <td className={`py-2.5 px-3 text-right font-mono text-[11px] font-bold flex justify-end items-center gap-1 ${colorClass}`}>
            {ArrowIcon && <ArrowIcon size={12}/>} {Math.abs(varPct).toFixed(2)}%
          </td>
        </tr>
        {isOpen && node.c.map((child, i) => (
          <ExpandableComparativeRow key={i} node={child} level={level + 1} defaultOpen={defaultOpen}/>
        ))}
      </>
    );
  }

  if (isLeaf) {
    return (
      <tr className="bg-slate-50/50 border-b border-gray-100 hover:bg-white transition-colors">
        <td style={indent} className="py-1.5 px-3 text-[10px] text-slate-600 pl-8 relative">
          <div className="absolute left-4 top-0 bottom-0 w-px bg-slate-200"></div><div className="absolute left-4 top-1/2 w-2 h-px bg-slate-200"></div>
          <span className="ml-2 italic">{node.n}</span>
        </td>
        <td className="py-1.5 px-3 text-right font-mono text-[10px] whitespace-nowrap text-slate-400">{fmtCur(node.m1_u)}</td>
        <td className="py-1.5 px-3 text-right font-mono text-[10px] whitespace-nowrap text-slate-700">{fmtCur(node.m2_u)}</td>
        <td className="py-1.5 px-3 text-right font-mono text-[10px] text-orange-400">{fmtCur(varAbs)}</td>
        <td className={`py-1.5 px-3 text-right font-mono text-[10px] flex justify-end items-center gap-1 ${colorClass}`}>
          {ArrowIcon && <ArrowIcon size={10}/>} {Math.abs(varPct).toFixed(2)}%
        </td>
      </tr>
    );
  }
  return null;
};

// ============================================================================
// VISTA: ANÁLISIS COMPARATIVO
// ============================================================================
function AnalisisComparativoView({ onBack, dbData }) {
  const availableMonths = useMemo(() => [...new Set(dbData.map(d => d.month))].filter(m => m !== 'Sin Mes'), [dbData]);
  
  const [month1, setMonth1] = useState(availableMonths[0] || '');
  const [month2, setMonth2] = useState(availableMonths[1] || availableMonths[0] || '');
  const [defaultOpen, setDefaultOpen] = useState(false);
  const [expandKey, setExpandKey] = useState(0);

  const tree = useMemo(() => {
    const root = [];
    const m1Data = dbData.filter(d => d.month === month1);
    const m2Data = dbData.filter(d => d.month === month2);

    const processItem = (item, isM1) => {
      const pathArray = item.path.split('>');
      let cur = root;
      pathArray.forEach(folderName => {
        let folder = cur.find(n => n.n === folderName);
        if (!folder) { folder = { n: folderName, c: [], m1_u: 0, m2_u: 0, isLeaf: false }; cur.push(folder); }
        cur = folder.c;
      });

      let leaf = cur.find(n => n.n === item.name && n.isLeaf);
      if (!leaf) {
        leaf = { n: item.name, m1_u: 0, m2_u: 0, isLeaf: true };
        cur.push(leaf);
      }
      if (isM1) leaf.m1_u += item.usd;
      else leaf.m2_u += item.usd;
    };

    m1Data.forEach(item => processItem(item, true));
    m2Data.forEach(item => processItem(item, false));

    const compute = (nodes) => {
      let sum_m1 = 0, sum_m2 = 0;
      nodes.forEach(n => {
        if (!n.isLeaf) { const t = compute(n.c); n.m1_u = t.m1; n.m2_u = t.m2; }
        sum_m1 += n.m1_u; sum_m2 += n.m2_u;
      });
      return { m1: sum_m1, m2: sum_m2 };
    };
    compute(root);

    root.forEach(rootNode => {
      const name = rootNode.n.toUpperCase();
      const isIngreso = name.includes('INGRESO') || name.includes('VENTA') || name.startsWith('4');
      const multiplier = isIngreso ? -1 : 1;
      const applySign = (nodes) => {
        nodes.forEach(n => {
          n.m1_u = (n.m1_u * multiplier) === 0 ? 0 : (n.m1_u * multiplier);
          n.m2_u = (n.m2_u * multiplier) === 0 ? 0 : (n.m2_u * multiplier);
          if (!n.isLeaf) applySign(n.c);
        });
      };
      applySign([rootNode]);
    });

    return root;
  }, [dbData, month1, month2]);

  let total_m1 = 0, total_m2 = 0;
  tree.forEach(rootNode => {
    const name = rootNode.n.toUpperCase();
    if (name.includes('INGRESO') || name.includes('VENTA') || name.startsWith('4')) {
      total_m1 += rootNode.m1_u; total_m2 += rootNode.m2_u;
    } else {
      total_m1 -= rootNode.m1_u; total_m2 -= rootNode.m2_u;
    }
  });

  const varAbsTotal = total_m2 - total_m1;
  const varPctTotal = total_m1 !== 0 ? (varAbsTotal / Math.abs(total_m1)) * 100 : (total_m2 !== 0 ? 100 : 0);
  const isPosTotal = varAbsTotal > 0;
  const isNegTotal = varAbsTotal < 0;
  const TotalArrowIcon = isPosTotal ? ArrowUpRight : (isNegTotal ? ArrowDownRight : null);

  const fmtR = (v) => new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);

  return (
    <div className="min-h-screen bg-[#f1f5f9]">
      <header className="bg-white border-b-2 border-orange-500 p-4 flex justify-between items-center sticky top-0 z-30 shadow-md flex-wrap gap-4">
        <div className="flex items-center gap-4 flex-wrap">
          <button onClick={onBack} className="flex items-center gap-2 font-black text-xs text-slate-600 uppercase hover:text-orange-600 transition-colors">
            <ArrowLeft size={16}/> Volver
          </button>
          <div className="flex items-center gap-2 border-l-2 border-slate-200 pl-4 flex-wrap">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mr-1">Mes Base:</span>
            <select value={month1} onChange={(e) => setMonth1(e.target.value)} className="bg-slate-50 border border-slate-300 text-slate-700 text-xs rounded-lg focus:ring-orange-500 focus:border-orange-500 block p-1.5 font-bold uppercase">
              {availableMonths.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mx-2">VS</span>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mr-1">Mes Comparar:</span>
            <select value={month2} onChange={(e) => setMonth2(e.target.value)} className="bg-orange-50 border border-orange-300 text-orange-700 text-xs rounded-lg focus:ring-orange-500 focus:border-orange-500 block p-1.5 font-bold uppercase">
              {availableMonths.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>

        <div className="flex gap-2 bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button onClick={() => { setDefaultOpen(true); setExpandKey(k=>k+1); }} className={`px-3 py-1.5 rounded text-[10px] font-black uppercase flex items-center gap-1 transition-colors ${defaultOpen ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>
            <ChevronDown size={14}/> Expandir
          </button>
          <button onClick={() => { setDefaultOpen(false); setExpandKey(k=>k+1); }} className={`px-3 py-1.5 rounded text-[10px] font-black uppercase flex items-center gap-1 transition-colors ${!defaultOpen ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>
            <ChevronRight size={14}/> Contraer
          </button>
        </div>
      </header>
      
      <main className="p-4 md:p-8 max-w-6xl mx-auto pb-16">
        <div className="bg-white px-8 py-10 border-t-8 border-orange-500 shadow-xl flex flex-col items-center text-center mb-6 rounded-b-2xl">
          <h1 className="text-3xl font-black text-slate-900 uppercase mb-2">Servicios Jiret G&B, C.A.</h1>
          <div className="w-20 h-1.5 bg-orange-500 mb-4 rounded-full"/>
          <p className="font-sans text-xs text-slate-500 font-black tracking-[0.3em] mb-4">RIF: J-412309374</p>
          <h2 className="text-xl font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-2 mb-4 w-full max-w-md">Análisis Comparativo (USD)</h2>
          <p className="font-black uppercase flex items-center gap-2 px-5 py-2 rounded-full text-[10px] bg-slate-800 text-white shadow-sm">
            <GitCompare size={14}/> {month1} vs {month2}
          </p>
        </div>
        
        {availableMonths.length < 2 ? (
          <div className="bg-white p-12 text-center rounded-xl border border-slate-200 shadow-sm">
             <AlertTriangle className="mx-auto text-orange-400 mb-4" size={48}/>
             <p className="text-slate-500 font-black text-xs uppercase tracking-wider">Necesitas cargar al menos dos meses para poder comparar.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-800 text-[10px] uppercase font-black text-slate-300 border-b-2 border-orange-500">
                <tr>
                  <th className="px-4 py-5 w-[45%] tracking-widest">Estructura de Cuentas</th>
                  <th className="px-3 py-5 text-right tracking-widest border-l border-slate-700 bg-slate-900/50">{month1}</th>
                  <th className="px-3 py-5 text-right tracking-widest border-l border-slate-700 bg-slate-900">{month2}</th>
                  <th className="px-3 py-5 text-right tracking-widest border-l border-slate-700 text-orange-400">Var. Absoluta</th>
                  <th className="px-3 py-5 text-right tracking-widest">Var. %</th>
                </tr>
              </thead>
              <tbody key={expandKey}>
                {tree.map((node, i) => (
                  <ExpandableComparativeRow key={i} node={node} defaultOpen={defaultOpen}/>
                ))}
                <tr className="bg-slate-900 text-white font-black border-t-4 border-orange-600">
                  <td className="px-5 py-7 text-sm uppercase tracking-[0.2em]" style={{paddingLeft:28}}>RESULTADO DEL EJERCICIO</td>
                  <td className="px-3 py-7 text-right text-base font-mono border-l border-slate-800">{fmtR(total_m1)}</td>
                  <td className="px-3 py-7 text-right text-base font-mono border-l border-slate-800">{fmtR(total_m2)}</td>
                  <td className={`px-3 py-7 text-right text-lg font-mono border-l border-slate-800 ${isPosTotal ? 'text-emerald-400' : (isNegTotal ? 'text-red-400' : 'text-slate-400')}`}>
                    {fmtR(varAbsTotal)}
                  </td>
                  <td className={`px-3 py-7 text-right text-lg font-mono flex justify-end items-center gap-1 ${isPosTotal ? 'text-emerald-400' : (isNegTotal ? 'text-red-400' : 'text-slate-400')}`}>
                    {TotalArrowIcon && <TotalArrowIcon size={16}/>} {Math.abs(varPctTotal).toFixed(2)}%
                  </td>
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
// VISTA: ESTADO DE RESULTADOS (ORIGINAL MEJORADA)
// ============================================================================
function EstadoResultadoView({ onBack, dbData, onUpload, onDeleteMonth }) {
  const availableMonths = useMemo(() => [...new Set(dbData.map(d => d.month))], [dbData]);
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

  const handleRemoveMonth = (month) => {
    onDeleteMonth(month);
    if (selectedMonth === month) setSelectedMonth('General');
  };

  const tree = useMemo(() => {
    const root = [];
    const monthData = selectedMonth === 'General' ? dbData : dbData.filter(d => d.month === selectedMonth);
    
    monthData.forEach(item => {
      const pathArray = item.path.split('>');
      let cur = root;
      pathArray.forEach(folderName => {
        let folder = cur.find(n => n.n === folderName);
        if (!folder) { folder = { n: folderName, c: [], u: 0, b: 0 }; cur.push(folder); }
        cur = folder.c;
      });
      let leaf = cur.find(n => n.n === item.name && n.isLeaf);
      if (!leaf) cur.push({ n: item.name, u: item.usd, b: item.bs, isLeaf: true });
      else { leaf.u += item.usd; leaf.b += item.bs; }
    });

    const compute = (nodes) => {
      let u = 0, b = 0;
      nodes.forEach(n => {
        if (!n.isLeaf) { const t = compute(n.c); n.u = t.u; n.b = t.b; }
        u += n.u; b += n.b;
      });
      return { u, b };
    };
    compute(root);

    root.forEach(rootNode => {
      const name = rootNode.n.toUpperCase();
      const isIngreso = name.includes('INGRESO') || name.includes('VENTA') || name.startsWith('4');
      const multiplier = isIngreso ? -1 : 1;
      const applySign = (nodes) => {
        nodes.forEach(n => {
          n.u = (n.u * multiplier) === 0 ? 0 : (n.u * multiplier);
          n.b = (n.b * multiplier) === 0 ? 0 : (n.b * multiplier);
          if (!n.isLeaf) applySign(n.c);
        });
      };
      applySign([rootNode]);
    });
    return root;
  }, [dbData, selectedMonth]);

  let totalUSD = 0; let totalBs = 0; let baseVentas = 0;
  tree.forEach(rootNode => {
    const name = rootNode.n.toUpperCase();
    if (name.includes('INGRESO') || name.includes('VENTA') || name.startsWith('4')) {
      totalUSD += rootNode.u; totalBs += rootNode.b; baseVentas += rootNode.u; 
    } else {
      totalUSD -= rootNode.u; totalBs -= rootNode.b;
    }
  });

  if (baseVentas === 0) baseVentas = 1;
  const fmtR = (v) => new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);

  return (
    <div className="min-h-screen bg-[#f1f5f9]">
      <header className="bg-white border-b-2 border-orange-500 p-4 flex justify-between items-center sticky top-0 z-30 shadow-md flex-wrap gap-4">
        <div className="flex items-center gap-4 flex-wrap">
          <button onClick={onBack} className="flex items-center gap-2 font-black text-xs text-slate-600 uppercase hover:text-orange-600 transition-colors">
            <ArrowLeft size={16}/> Volver
          </button>
          <div className="flex items-center gap-2 border-l-2 border-slate-200 pl-4 flex-wrap">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mr-1">Filtro:</span>
            <button onClick={() => setSelectedMonth('General')} className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase shadow-sm transition-all ${selectedMonth === 'General' ? 'bg-slate-800 text-white ring-2 ring-slate-300' : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-100'}`}>General</button>
            {availableMonths.map(m => (
              <button key={m} onClick={() => setSelectedMonth(m)} className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase shadow-sm transition-all ${selectedMonth === m ? 'bg-orange-600 text-white ring-2 ring-orange-200' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}>{m}</button>
            ))}
            {selectedMonth !== 'General' && (
              <button onClick={() => handleRemoveMonth(selectedMonth)} className="ml-2 px-3 py-1.5 rounded-full bg-red-50 text-red-600 border border-red-200 text-[10px] font-black uppercase hover:bg-red-100 transition-colors flex items-center gap-1 shadow-sm"><Trash2 size={12}/> Eliminar {selectedMonth}</button>
            )}
            <label className="ml-2 px-3 py-1.5 rounded-full bg-slate-800 text-white text-[10px] font-black uppercase cursor-pointer hover:bg-orange-500 transition-colors flex items-center gap-1 shadow-sm">
              <PlusCircle size={14}/> Cargar Mes
              <input type="file" multiple accept=".xlsx,.xls,.xlsm,.txt,.csv" className="hidden" onChange={onUpload}/>
            </label>
          </div>
        </div>
        <div className="flex gap-2 bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button onClick={() => { setDefaultOpen(true); setExpandKey(k=>k+1); }} className={`px-3 py-1.5 rounded text-[10px] font-black uppercase flex items-center gap-1 transition-colors ${defaultOpen ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500'}`}><ChevronDown size={14}/> Expandir</button>
          <button onClick={() => { setDefaultOpen(false); setExpandKey(k=>k+1); }} className={`px-3 py-1.5 rounded text-[10px] font-black uppercase flex items-center gap-1 transition-colors ${!defaultOpen ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500'}`}><ChevronRight size={14}/> Contraer</button>
        </div>
      </header>
      <main className="p-4 md:p-8 max-w-6xl mx-auto pb-16">
        <div className="bg-white px-8 py-10 border-t-8 border-orange-500 shadow-xl flex flex-col items-center text-center mb-6 rounded-b-2xl">
          <h1 className="text-3xl font-black text-slate-900 uppercase mb-2">Servicios Jiret G&B, C.A.</h1>
          <div className="w-20 h-1.5 bg-orange-500 mb-4 rounded-full"/>
          <p className="font-sans text-xs text-slate-500 font-black tracking-[0.3em] mb-4">RIF: J-412309374</p>
          <h2 className="text-xl font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-2 mb-4 w-full max-w-md">Estado de Resultado {selectedMonth === 'General' ? 'Acumulado' : 'Mensual'}</h2>
          <div className="flex gap-2">
            <p className={`font-black uppercase flex items-center gap-2 px-5 py-2 rounded-full text-[10px] border shadow-sm ${selectedMonth === 'General' ? 'bg-slate-800 text-white border-slate-700' : 'bg-orange-50 text-orange-600 border-orange-100'}`}>
              <CalendarDays size={14}/> {selectedMonth === 'General' ? 'Todos los meses registrados' : `Periodo Fiscal: ${selectedMonth}`}
            </p>
          </div>
        </div>
        
        {dbData.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-xl border border-slate-200 shadow-sm"><AlertTriangle className="mx-auto text-orange-400 mb-4" size={48}/><p className="text-slate-500 font-black text-xs uppercase tracking-wider">No hay información cargada.</p></div>
        ) : (
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-800 text-[10px] uppercase font-black text-slate-300">
                <tr>
                  <th className="px-4 py-5 w-[55%] tracking-widest">Estructura de Cuentas</th>
                  <th className="px-3 py-5 text-right tracking-widest">Saldo USD</th>
                  <th className="px-3 py-5 text-right hidden sm:table-cell tracking-widest">Saldo Bs.</th>
                  <th className="px-3 py-5 text-right tracking-widest">%</th>
                </tr>
              </thead>
              <tbody key={expandKey}>
                {tree.map((node, i) => <ExpandableRow key={i} node={node} totalVentasUSD={baseVentas} defaultOpen={defaultOpen} highlightedAccounts={highlightedAccounts} toggleHighlight={toggleHighlight}/>)}
                <tr className="bg-slate-900 text-white font-black border-t-4 border-orange-600">
                  <td className="px-5 py-7 text-sm uppercase tracking-[0.2em]" style={{paddingLeft:28}}>RESULTADO DEL EJERCICIO</td>
                  <td className={`px-3 py-7 text-right text-lg font-mono ${totalUSD < 0 ? 'text-red-400' : 'text-emerald-400'}`}>{fmtR(totalUSD)}</td>
                  <td className={`px-3 py-7 text-right text-lg font-mono hidden sm:table-cell ${totalBs < 0 ? 'text-red-400' : 'text-emerald-400'}`}>{fmtR(totalBs)}</td>
                  <td className="px-3 py-7 text-right text-lg font-mono">{((Math.abs(totalUSD) / baseVentas) * 100).toFixed(2)}%</td>
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
// COMPONENTE PRINCIPAL / DASHBOARD REDISEÑADO
// ============================================================================
function ReportesFinancierosApp() {
  const [view, setView] = useState('dashboard');
  const [dbData, setDbData] = useState([]);

  const handleUpload = async (e) => {
    if (!e.target.files.length) return;
    try {
      const newData = await processFiles(e.target.files);
      setDbData(prev => {
        const newlyUploadedMonths = [...new Set(newData.map(d => d.month))];
        const keepData = prev.filter(d => !newlyUploadedMonths.includes(d.month));
        return [...keepData, ...newData];
      });
    } catch (error) { 
      alert("Error al procesar el archivo."); console.error(error); 
    }
  };

  const handleDeleteMonth = (monthToDelete) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar permanentemente la información de ${monthToDelete}?`)) {
      setDbData(prev => prev.filter(d => d.month !== monthToDelete));
    }
  };

  const loadedMonths = [...new Set(dbData.map(d => d.month))].filter(m => m !== 'Sin Mes');

  if (view === 'resultado') return <EstadoResultadoView onBack={() => setView('dashboard')} dbData={dbData} onUpload={handleUpload} onDeleteMonth={handleDeleteMonth}/>;
  if (view === 'comparativo') return <AnalisisComparativoView onBack={() => setView('dashboard')} dbData={dbData} />;
  
  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* BARRA SUPERIOR */}
      <header className="px-6 py-4 bg-[#111827] border-b-4 border-orange-500 flex justify-between items-center shadow-lg">
        <h1 className="text-white font-black text-xl tracking-widest uppercase flex items-center gap-2">
          Jiret G&B <span className="text-orange-500 px-2 py-0.5 rounded bg-orange-500/10 text-sm">Finance</span>
        </h1>
        <button className="text-slate-400 hover:text-white transition-colors flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
           <ArrowLeft size={16}/> Salir
        </button>
      </header>
      
      {/* CUERPO DEL DASHBOARD (Layout a 2 columnas) */}
      <main className="max-w-7xl mx-auto p-6 lg:p-8 mt-4 grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* COLUMNA IZQUIERDA: Carga Compacta */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 text-center">
            <FileSpreadsheet className="mx-auto text-slate-300 mb-4" size={40}/>
            <h3 className="font-black text-slate-800 text-sm uppercase mb-2 tracking-wide">Carga de Datos</h3>
            <p className="text-[11px] text-slate-500 mb-5 leading-relaxed font-medium">Sube archivos Excel o CSV de exportación contable. El sistema organizará automáticamente la jerarquía.</p>
            
            <label className="bg-slate-800 text-white px-4 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest cursor-pointer hover:bg-orange-500 transition-colors flex items-center justify-center gap-2 w-full shadow-md hover:shadow-lg hover:-translate-y-0.5">
              <Upload size={14}/> Subir Archivos
              <input type="file" multiple accept=".xlsx,.xls,.xlsm,.txt,.csv" className="hidden" onChange={handleUpload}/>
            </label>
          </div>

          {loadedMonths.length > 0 && (
            <div className="bg-emerald-50 rounded-3xl p-6 border border-emerald-100 shadow-sm">
              <p className="text-emerald-800 font-black text-[10px] uppercase tracking-widest mb-4 flex items-center gap-2">
                <CheckCircle size={14}/> Meses Cargados
              </p>
              <div className="flex flex-wrap gap-2">
                {loadedMonths.map(m => (
                  <span key={m} className="bg-white text-emerald-600 border border-emerald-200 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm">
                    {m}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* COLUMNA DERECHA: Portada y Módulos */}
        <div className="lg:col-span-3 space-y-8">
          
          {/* PORTADA DE LA EMPRESA */}
          <div className="bg-white rounded-3xl p-8 lg:p-10 shadow-sm border-l-8 border-orange-500 relative overflow-hidden flex flex-col justify-center min-h-[220px]">
            <div className="absolute top-0 right-0 w-80 h-80 bg-orange-50 rounded-full blur-3xl -mr-20 -mt-20 opacity-70 pointer-events-none"></div>
            <h2 className="text-3xl lg:text-4xl font-black text-slate-900 uppercase tracking-tight mb-2 relative z-10">Servicios Jiret G&B, C.A.</h2>
            <p className="text-sm font-bold text-slate-500 tracking-[0.3em] mb-6 relative z-10">RIF: J-412309374</p>
            <p className="text-sm text-slate-600 max-w-2xl relative z-10 leading-relaxed font-medium">
              Panel central de reportes financieros. Selecciona un módulo en la parte inferior para visualizar, analizar y comparar el rendimiento contable y operativo de la organización.
            </p>
          </div>

          {/* CUADRÍCULA DE MÓDULOS (4 Opciones) */}
          <div className="grid sm:grid-cols-2 gap-6">
            
            <button onClick={() => dbData.length > 0 ? setView('resultado') : alert('Por favor, carga datos en el panel izquierdo.')}
              className={`group bg-white p-6 rounded-3xl shadow-sm border-b-4 border-orange-500 text-left transition-all ${dbData.length > 0 ? 'hover:shadow-xl hover:-translate-y-1' : 'opacity-60 grayscale'}`}>
              <div className="bg-orange-50 w-14 h-14 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <LineChart className="text-orange-500" size={28}/>
              </div>
              <h3 className="font-black uppercase text-base text-slate-900 tracking-tight">Estado de Resultados</h3>
              <p className="text-xs text-slate-500 mt-2 font-medium">Reporte mensual o acumulado (General). Resalta cuentas y filtra data.</p>
            </button>

            <button onClick={() => dbData.length >= 2 ? setView('comparativo') : alert('Para comparar necesitas cargar al menos 2 meses.')}
              className={`group bg-white p-6 rounded-3xl shadow-sm border-b-4 border-indigo-500 text-left transition-all ${dbData.length >= 2 ? 'hover:shadow-xl hover:-translate-y-1' : 'opacity-60 grayscale'}`}>
              <div className="bg-indigo-50 w-14 h-14 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <GitCompare className="text-indigo-500" size={28}/>
              </div>
              <h3 className="font-black uppercase text-base text-slate-900 tracking-tight">Variaciones</h3>
              <p className="text-xs text-slate-500 mt-2 font-medium">Análisis horizontal entre dos periodos con variación porcentual.</p>
            </button>
            
            <div className="bg-white p-6 rounded-3xl shadow-sm border-b-4 border-blue-500 opacity-50 text-left cursor-not-allowed">
              <div className="bg-blue-50 w-14 h-14 rounded-2xl flex items-center justify-center mb-5">
                <Scale className="text-blue-500" size={28}/>
              </div>
              <h3 className="font-black uppercase text-base text-slate-900 tracking-tight">Balance General</h3>
              <p className="text-xs text-slate-500 mt-2 font-medium">Estructura de Activos, Pasivos y Patrimonio (Próximamente).</p>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-sm border-b-4 border-teal-500 opacity-50 text-left cursor-not-allowed">
              <div className="bg-teal-50 w-14 h-14 rounded-2xl flex items-center justify-center mb-5">
                <Landmark className="text-teal-500" size={28}/>
              </div>
              <h3 className="font-black uppercase text-base text-slate-900 tracking-tight">Inversiones</h3>
              <p className="text-xs text-slate-500 mt-2 font-medium">Control de portafolio y retorno de inversión (Próximamente).</p>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}

export default ReportesFinancierosApp;

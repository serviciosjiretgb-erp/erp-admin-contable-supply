import React, { useState, useMemo, useEffect } from 'react';
import { 
  ArrowLeft, Upload, CheckCircle, Scale, 
  LineChart, CalendarDays, AlertTriangle, ChevronRight, ChevronDown, Star, PlusCircle, Trash2, ArrowUpRight, ArrowDownRight, GitCompare, Landmark, FileSpreadsheet,
  FileText, Users, Briefcase, Search
} from 'lucide-react';

// ============================================================================
// LÓGICA DE PROCESAMIENTO (MOTOR BASE)
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
      const what = totalName.replace(/^Total\s+/i, '').trim().toUpperCase();
      let idx = stack.length - 1;
      while (idx >= 0) {
        if (stack[idx].trim().toUpperCase() === what) { stack.splice(idx); break; }
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
        pathStack.push(name.trim());
        continue;
      }
      const usd = parseVal(usdStr);
      const bs = parseVal(bsStr);
      if (usd !== null) {
        allParsedData.push({ month, path: pathStack.map(p => p.trim()).join('>'), name: name.trim(), usd: usd, bs: bs || 0 });
      } else {
        pathStack.push(name.trim());
      }
    }
  }
  return allParsedData;
};

// ============================================================================
// CONFIGURACIÓN DE MAPEO CXC / CXP (BALANCE)
// ============================================================================
const ACCOUNT_MAPS = {
  '1.1.02.01.001': { type: 'cxc', filter: 'ALL', label: 'Clientes Generales' },
  '1.1.05.01.008': { type: 'cxc', filter: 'ZULIANA DE EMPAQUE, C.A', label: 'Anticipos Zuliana' },
  '2.1.01.02.008': { type: 'cxp', filter: 'AUTO TOTAL, C.A', label: 'Vehículos por Pagar' },
  '2.1.01.01.004': { type: 'cxp', filter: 'SURE PACK', label: 'CxP Sure Pack' },
  '2.1.01.02.007': { type: 'cxp', filter: 'AGRO INDUSTRIAS LACTEAS PACOMELA, C.A', label: 'Inmueble por Pagar' },
  '2.1.01.01.003': { type: 'cxp', filter: 'YANCARLOS PEREZ CASANOVA', label: 'Otras CxP Proveedores' }
};

const AUX_DATA = {
  cxc: [
    { cod: 'C0047', nombre: 'ALIMENTOS BOTALON C.A', doc: '00002973', emision: '30/04/2026', vence: '07/05/2026', monto: 519.51 },
    { cod: 'C0084', nombre: 'ANIMAL FEED SOLUTIONS., C.A', doc: '00002174', emision: '30/04/2025', vence: '30/04/2025', monto: 86.98 },
    { cod: 'C0030', nombre: 'ZULIANA DE EMPAQUE, C.A', doc: 'ANT-001', emision: '15/04/2026', vence: '15/04/2026', monto: 2500.00 },
    { cod: 'C0120', nombre: 'INVERSORA E&S', doc: '00002589', emision: '09/10/2025', vence: '09/10/2025', monto: 164.20 }
  ],
  cxp: [
    { cod: 'P0005', nombre: 'YANCARLOS PEREZ CASANOVA', doc: '001073', emision: '17/04/2026', vence: '17/04/2026', monto: 7920.07 },
    { cod: 'P0515', nombre: 'AGRO INDUSTRIAS LACTEAS PACOMELA, C.A', doc: '2602', emision: '02/01/2026', vence: '02/01/2026', monto: 20173.60 },
    { cod: 'P0999', nombre: 'AUTO TOTAL, C.A', doc: 'CUOTA-04', emision: '10/04/2026', vence: '10/04/2026', monto: 1500.00 },
    { cod: 'P0888', nombre: 'SURE PACK', doc: 'FAC-992', emision: '22/04/2026', vence: '30/04/2026', monto: 3450.12 }
  ]
};

// ============================================================================
// COMPONENTE: ÁRBOL JERÁRQUICO (USADO POR ESTADO DE RESULTADOS Y BALANCE)
// ============================================================================
const ExpandableRow = ({ node, level = 0, totalBaseUSD, defaultOpen = false, highlightedAccounts, toggleHighlight, onShowReport, isBalance = false }) => {
  const isAccountNode = /^\d\./.test(node.n);
  const isLeaf = !node.c || node.c.length === 0;
  const [isOpen, setIsOpen] = useState(defaultOpen);

  useEffect(() => { setIsOpen(defaultOpen); }, [defaultOpen]);

  const accountCode = isAccountNode ? node.n.split('-')[0].trim() : null;
  const hasMapping = accountCode && ACCOUNT_MAPS[accountCode];

  const fmtCur = (v) => new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);
  const pct = totalBaseUSD && node.u !== 0 ? `${((Math.abs(node.u) / totalBaseUSD) * 100).toFixed(2)}%` : '';
  const indent = { paddingLeft: `${level * 18 + 10}px` };

  if (!isLeaf && !isAccountNode) {
    const isRoot = level === 0;
    let rootColor = 'text-orange-500';
    let borderColor = 'border-orange-500';
    if (isBalance) {
      if (node.n.includes('ACTIVO')) { rootColor = 'text-blue-500'; borderColor = 'border-blue-500'; }
      else if (node.n.includes('PASIVO')) { rootColor = 'text-red-500'; borderColor = 'border-red-500'; }
      else if (node.n.includes('PATRIMONIO')) { rootColor = 'text-purple-500'; borderColor = 'border-purple-500'; }
    }

    return (
      <>
        <tr className={isRoot ? 'bg-[#111827]' : 'bg-white border-b border-gray-100'}>
          <td style={indent} className={isRoot ? `py-3 px-3 ${rootColor} font-black text-xs uppercase tracking-[0.2em]` : 'py-2 px-3 font-black text-[11px] text-slate-800 uppercase'}>{node.n}</td>
          <td colSpan={3} />
        </tr>
        {node.c.map((child, i) => (
          <ExpandableRow key={i} node={child} level={level + 1} totalBaseUSD={totalBaseUSD} defaultOpen={defaultOpen} highlightedAccounts={highlightedAccounts} toggleHighlight={toggleHighlight} onShowReport={onShowReport} isBalance={isBalance}/>
        ))}
        <tr className={`${isRoot ? `bg-slate-900 text-white border-t-2 ${borderColor}` : 'bg-slate-200 text-slate-800 border-t border-slate-300'} shadow-sm`}>
          <td style={{ paddingLeft: level * 18 + 28 }} className="py-2.5 px-3 font-black text-[10px] uppercase tracking-wider">TOTAL {node.n}</td>
          <td className={`py-2.5 px-3 text-right font-mono text-[11px] font-black ${isRoot ? rootColor : 'text-slate-900'}`}>{fmtCur(Math.abs(node.u))}</td>
          <td className={`py-2.5 px-3 text-right font-mono text-[11px] font-black hidden sm:table-cell ${isRoot ? rootColor : 'text-slate-900'}`}>{fmtCur(Math.abs(node.b))}</td>
          <td className={`py-2.5 px-3 text-right font-mono text-[11px] font-black ${isRoot ? rootColor : 'text-slate-900'}`}>{pct}</td>
        </tr>
      </>
    );
  }

  if (!isLeaf && isAccountNode) {
    const isHighlighted = highlightedAccounts.has(node.n);
    return (
      <>
        <tr onClick={() => setIsOpen(!isOpen)} className={`border-b border-gray-200 cursor-pointer transition-colors ${isHighlighted ? 'bg-amber-100/80 hover:bg-amber-200 border-l-4 border-amber-500' : 'bg-white hover:bg-slate-50 border-l-4 border-slate-400'}`}>
          <td style={indent} className="py-2.5 px-3 font-bold text-[11px] text-slate-900 uppercase select-none flex items-center flex-wrap gap-2">
            <span className={`inline-flex items-center justify-center w-4 h-4 border rounded-sm text-[11px] leading-none transition-colors ${isOpen ? 'border-slate-500 text-slate-600 bg-slate-100' : 'border-slate-300 text-slate-400 bg-white'}`}>{isOpen ? '−' : '+'}</span>
            <button onClick={(e) => { e.stopPropagation(); toggleHighlight(node.n); }} className="focus:outline-none transition-transform hover:scale-110"><Star size={16} fill={isHighlighted ? "#f59e0b" : "none"} color={isHighlighted ? "#f59e0b" : "#cbd5e1"} /></button>
            <span className="truncate">{node.n}</span>
            {hasMapping && isBalance && (
              <button onClick={(e) => { e.stopPropagation(); onShowReport(accountCode); }} className="ml-2 px-2.5 py-1 bg-blue-600 text-white rounded-md text-[9px] font-black tracking-widest hover:bg-blue-700 shadow-md flex items-center gap-1">
                <Search size={10}/> VER REPORTE
              </button>
            )}
          </td>
          <td className={`py-2.5 px-3 text-right font-mono text-[11px] font-bold ${isHighlighted ? 'text-amber-900' : 'text-slate-800'}`}>{fmtCur(Math.abs(node.u))}</td>
          <td className={`py-2.5 px-3 text-right font-mono text-[11px] font-bold hidden sm:table-cell ${isHighlighted ? 'text-amber-900' : 'text-slate-800'}`}>{fmtCur(Math.abs(node.b))}</td>
          <td className={`py-2.5 px-3 text-right font-mono text-[11px] font-bold ${isHighlighted ? 'text-amber-700' : 'text-slate-500'}`}>{pct}</td>
        </tr>
        {isOpen && node.c.map((child, i) => (
          <ExpandableRow key={i} node={child} level={level + 1} totalBaseUSD={totalBaseUSD} defaultOpen={defaultOpen} highlightedAccounts={highlightedAccounts} toggleHighlight={toggleHighlight} onShowReport={onShowReport} isBalance={isBalance}/>
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
        <td className={`py-1.5 px-3 text-right font-mono text-[10px] whitespace-nowrap ${node.u < 0 ? 'text-red-500' : 'text-slate-700'}`}>{fmtCur(Math.abs(node.u))}</td>
        <td className={`py-1.5 px-3 text-right font-mono text-[10px] hidden sm:table-cell whitespace-nowrap ${node.b < 0 ? 'text-red-500' : 'text-slate-500'}`}>{fmtCur(Math.abs(node.b))}</td>
        <td className="py-1.5 px-3 text-right font-mono text-[10px] text-slate-400">{pct}</td>
      </tr>
    );
  }
  return null;
};

// ============================================================================
// COMPONENTE: ÁRBOL PLANO PARA ANÁLISIS COMPARATIVO (BLINDADO)
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
        {node.c.map((child, i) => <ExpandableComparativeRow key={i} node={child} level={level + 1} defaultOpen={defaultOpen}/>)}
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
        {isOpen && node.c.map((child, i) => <ExpandableComparativeRow key={i} node={child} level={level + 1} defaultOpen={defaultOpen}/>)}
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
// VISTA: SUB-REPORTE DETALLADO (CXC / CXP)
// ============================================================================
function AuxiliarReportView({ accountCode, onBack }) {
  const mapInfo = ACCOUNT_MAPS[accountCode];
  const allData = AUX_DATA[mapInfo.type];
  const filteredData = mapInfo.filter === 'ALL' ? allData : allData.filter(d => d.nombre.toUpperCase().includes(mapInfo.filter.toUpperCase()));
  const total = filteredData.reduce((acc, curr) => acc + curr.monto, 0);
  const fmtCur = (v) => new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);

  return (
    <div className="animate-in fade-in duration-300">
      <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-black text-xs uppercase mb-4 transition-colors"><ArrowLeft size={16}/> Volver al Balance</button>
      <div className="flex items-center justify-between mb-6 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
            {mapInfo.type === 'cxc' ? <Users className="text-blue-500"/> : <Briefcase className="text-red-500"/>}
            Auxiliar Detallado
          </h2>
          <p className="text-xs font-bold text-slate-400 uppercase mt-1">Cuenta: {accountCode} - {mapInfo.label}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Saldo en Cuenta</p>
          <p className={`text-2xl font-mono font-black ${mapInfo.type === 'cxc' ? 'text-blue-600' : 'text-red-600'}`}>USD {fmtCur(total)}</p>
        </div>
      </div>
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-800 text-[10px] uppercase font-black text-slate-300">
            <tr><th className="px-4 py-4">Código</th><th className="px-4 py-4">Sujeto</th><th className="px-4 py-4">Documento</th><th className="px-4 py-4">Vence</th><th className="px-4 py-4 text-right">Monto USD</th></tr>
          </thead>
          <tbody>
            {filteredData.map((item, i) => (
              <tr key={i} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 text-xs font-bold text-slate-500">{item.cod}</td>
                <td className="px-4 py-3 text-xs font-black text-slate-800">{item.nombre}</td>
                <td className="px-4 py-3 text-xs text-slate-600 font-mono">{item.doc}</td>
                <td className="px-4 py-3 text-xs text-slate-500">{item.vence}</td>
                <td className="px-4 py-3 text-right text-sm font-mono font-bold text-slate-900">{fmtCur(item.monto)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================================
// VISTA: BALANCE GENERAL (BLINDADO)
// ============================================================================
function BalanceGeneralView({ onBack, dbData }) {
  const availableMonths = useMemo(() => [...new Set(dbData.map(d => d.month))], [dbData]);
  const [selectedMonth, setSelectedMonth] = useState('General'); 
  const [defaultOpen, setDefaultOpen] = useState(false);
  const [expandKey, setExpandKey] = useState(0);
  const [activeCode, setActiveCode] = useState(null);

  const [highlightedAccounts, setHighlightedAccounts] = useState(() => {
    try { const saved = localStorage.getItem('jiret_highlighted_accounts'); return saved ? new Set(JSON.parse(saved)) : new Set(); } catch(e){return new Set();}
  });
  useEffect(() => { localStorage.setItem('jiret_highlighted_accounts', JSON.stringify([...highlightedAccounts])); }, [highlightedAccounts]);

  const tree = useMemo(() => {
    const root = [];
    const monthData = selectedMonth === 'General' ? dbData : dbData.filter(d => d.month === selectedMonth);
    const balanceData = monthData.filter(item => item.path.toUpperCase().includes('ACTIVO') || item.path.toUpperCase().includes('PASIVO') || item.path.toUpperCase().includes('PATRIMONIO') || /^[123]/.test(item.name));
    balanceData.forEach(item => {
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
      nodes.forEach(n => { if (!n.isLeaf) { const t = compute(n.c); n.u = t.u; n.b = t.b; } u += n.u; b += n.b; });
      return { u, b };
    };
    compute(root);
    return root;
  }, [dbData, selectedMonth]);

  let totalActivos = 0; let totalPasPat = 0;
  tree.forEach(n => { if(n.n.toUpperCase().includes('ACTIVO') || n.n.startsWith('1')) totalActivos += n.u; else totalPasPat += n.u; });

  const fmtR = (v) => new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Math.abs(v));

  if (activeCode) return <AuxiliarReportView accountCode={activeCode} onBack={() => setActiveCode(null)} />;

  return (
    <div className="min-h-screen bg-[#f1f5f9]">
      <header className="bg-white border-b-2 border-blue-500 p-4 flex justify-between items-center sticky top-0 z-30 shadow-md">
        <button onClick={onBack} className="flex items-center gap-2 font-black text-xs text-slate-600 uppercase hover:text-blue-600 transition-colors"><ArrowLeft size={16}/> Salir al Panel</button>
        <div className="flex items-center gap-2">
          <button onClick={() => setSelectedMonth('General')} className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase shadow-sm ${selectedMonth === 'General' ? 'bg-slate-800 text-white' : 'bg-white border border-slate-200'}`}>General</button>
          {availableMonths.map(m => <button key={m} onClick={() => setSelectedMonth(m)} className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase shadow-sm ${selectedMonth === m ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200'}`}>{m}</button>)}
        </div>
      </header>
      <main className="p-4 md:p-8 max-w-6xl mx-auto pb-16">
        <div className="bg-white px-8 py-10 border-t-8 border-blue-500 shadow-xl flex flex-col items-center text-center mb-6 rounded-b-2xl">
          <h1 className="text-3xl font-black text-slate-900 uppercase mb-2 tracking-tighter">Servicios Jiret G&B, C.A.</h1>
          <h2 className="text-xl font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-2 mb-4 w-full max-w-md">Balance de Situación Financiera</h2>
          <p className="text-blue-600 font-black uppercase flex items-center gap-2 bg-blue-50 px-5 py-2 rounded-full text-[10px] border border-blue-100 shadow-sm"><Landmark size={14}/> {selectedMonth === 'General' ? 'Acumulado Histórico' : `Corte al mes de ${selectedMonth}`}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-800 text-[10px] uppercase font-black text-slate-300">
              <tr><th className="px-4 py-5 w-[55%]">Estructura</th><th className="px-3 py-5 text-right">Saldo USD</th><th className="px-3 py-5 text-right hidden sm:table-cell">Bs.</th><th className="px-3 py-5 text-right">%</th></tr>
            </thead>
            <tbody key={expandKey}>
              {tree.map((node, i) => <ExpandableRow key={i} node={node} totalBaseUSD={totalActivos} defaultOpen={defaultOpen} highlightedAccounts={highlightedAccounts} toggleHighlight={a => setHighlightedAccounts(p => {const s=new Set(p); if(s.has(a))s.delete(a); else s.add(a); return s;})} onShowReport={setActiveCode} isBalance={true}/>)}
              <tr className="bg-slate-900 text-white font-black border-t-4 border-blue-500">
                <td colSpan={4} className="p-6">
                  <div className="flex flex-wrap justify-between items-center px-4">
                    <div className="flex items-center gap-4"><Scale size={32} className="text-blue-400"/><div><p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">Ecuación Patrimonial</p><p className="text-sm font-black tracking-widest">ACTIVOS = PASIVOS + PATRIMONIO</p></div></div>
                    <div className="flex gap-8 text-right">
                      <div><p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Total Activos</p><p className="text-xl font-mono text-blue-400">USD {fmtR(totalActivos)}</p></div>
                      <div><p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Pasivo + Patrimonio</p><p className="text-xl font-mono text-purple-400">USD {fmtR(totalPasPat)}</p></div>
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
// VISTA: ESTADO DE RESULTADOS (BLINDADA)
// ============================================================================
function EstadoResultadoView({ onBack, dbData }) {
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

  const tree = useMemo(() => {
    const root = [];
    const monthData = selectedMonth === 'General' ? dbData : dbData.filter(d => d.month === selectedMonth);
    const resData = monthData.filter(item => !item.path.toUpperCase().includes('ACTIVO') && !item.path.toUpperCase().includes('PASIVO') && !item.path.toUpperCase().includes('PATRIMONIO') && !/^[123]/.test(item.name));
    
    resData.forEach(item => {
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
      nodes.forEach(n => { if (!n.isLeaf) { const t = compute(n.c); n.u = t.u; n.b = t.b; } u += n.u; b += n.b; });
      return { u, b };
    };
    compute(root);

    root.forEach(rootNode => {
      const isIngreso = rootNode.n.toUpperCase().includes('INGRESO') || rootNode.n.toUpperCase().includes('VENTA') || rootNode.n.startsWith('4');
      const multiplier = isIngreso ? -1 : 1;
      const applySign = (nodes) => nodes.forEach(n => { n.u *= multiplier; n.b *= multiplier; if (!n.isLeaf) applySign(n.c); });
      applySign([rootNode]);
    });
    return root;
  }, [dbData, selectedMonth]);

  let totalUSD = 0; let baseVentas = 0;
  tree.forEach(n => { 
    if(n.n.toUpperCase().includes('INGRESO') || n.n.toUpperCase().includes('VENTA') || n.n.startsWith('4')) { 
      totalUSD += n.u; baseVentas += n.u; 
    } else { totalUSD -= n.u; } 
  });
  
  if (baseVentas === 0) baseVentas = 1;
  const fmtR = (v) => new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);

  return (
    <div className="min-h-screen bg-[#f1f5f9]">
      <header className="bg-white border-b-2 border-orange-500 p-4 flex justify-between items-center sticky top-0 z-30 shadow-md flex-wrap gap-4">
        <button onClick={onBack} className="flex items-center gap-2 font-black text-xs text-slate-600 uppercase hover:text-orange-600 transition-colors"><ArrowLeft size={16}/> Volver</button>
        <div className="flex items-center gap-2">
           <button onClick={() => setSelectedMonth('General')} className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase shadow-sm transition-all ${selectedMonth === 'General' ? 'bg-slate-800 text-white ring-2 ring-slate-300' : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-100'}`}>General</button>
           {availableMonths.map(m => <button key={m} onClick={() => setSelectedMonth(m)} className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase shadow-sm transition-all ${selectedMonth === m ? 'bg-orange-600 text-white ring-2 ring-orange-200' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}>{m}</button>)}
        </div>
        <div className="flex gap-2 bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button onClick={() => { setDefaultOpen(true); setExpandKey(k=>k+1); }} className="px-3 py-1.5 rounded text-[10px] font-black uppercase flex items-center gap-1"><ChevronDown size={14}/> Expandir</button>
          <button onClick={() => { setDefaultOpen(false); setExpandKey(k=>k+1); }} className="px-3 py-1.5 rounded text-[10px] font-black uppercase flex items-center gap-1"><ChevronRight size={14}/> Contraer</button>
        </div>
      </header>
      <main className="p-4 md:p-8 max-w-6xl mx-auto pb-16">
        <div className="bg-white px-8 py-10 border-t-8 border-orange-500 shadow-xl flex flex-col items-center text-center mb-6 rounded-b-2xl">
          <h1 className="text-3xl font-black text-slate-900 uppercase mb-2">Servicios Jiret G&B, C.A.</h1>
          <div className="w-20 h-1.5 bg-orange-500 mb-4 rounded-full"/>
          <h2 className="text-xl font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-2 mb-4 w-full max-w-md">Estado de Resultado {selectedMonth === 'General' ? 'Acumulado' : 'Mensual'}</h2>
          <p className="text-orange-600 font-black uppercase flex items-center gap-2 bg-orange-50 px-5 py-2 rounded-full text-[10px] border border-orange-100 shadow-sm"><CalendarDays size={14}/> {selectedMonth}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-800 text-[10px] uppercase font-black text-slate-300">
              <tr><th className="px-4 py-5 w-[55%]">Cuentas</th><th className="px-3 py-5 text-right">Saldo USD</th><th className="px-3 py-5 text-right hidden sm:table-cell">Saldo Bs.</th><th className="px-3 py-5 text-right">%</th></tr>
            </thead>
            <tbody key={expandKey}>
              {tree.map((node, i) => <ExpandableRow key={i} node={node} totalBaseUSD={baseVentas} defaultOpen={defaultOpen} highlightedAccounts={highlightedAccounts} toggleHighlight={toggleHighlight} isBalance={false}/>)}
              <tr className="bg-slate-900 text-white font-black border-t-4 border-orange-600">
                <td className="px-5 py-7 text-sm uppercase tracking-[0.2em]" style={{paddingLeft:28}}>RESULTADO DEL EJERCICIO</td>
                <td className={`px-3 py-7 text-right text-lg font-mono ${totalUSD < 0 ? 'text-red-400' : 'text-emerald-400'}`}>{fmtR(totalUSD)}</td>
                <td className={`px-3 py-7 text-right text-lg font-mono hidden sm:table-cell ${totalUSD < 0 ? 'text-red-400' : 'text-emerald-400'}`}>{fmtR(totalUSD * 45)}</td>
                <td className="px-3 py-7 text-right text-lg font-mono">{(Math.abs(totalUSD)/baseVentas*100).toFixed(2)}%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

// ============================================================================
// VISTA: ANÁLISIS COMPARATIVO (BLINDADA)
// ============================================================================
function AnalisisComparativoView({ onBack, dbData }) {
  const availableMonths = useMemo(() => [...new Set(dbData.map(d => d.month))].filter(m => m !== 'Sin Mes'), [dbData]);
  const [month1, setMonth1] = useState(availableMonths[0] || '');
  const [month2, setMonth2] = useState(availableMonths[1] || availableMonths[0] || '');

  const tree = useMemo(() => {
    const root = [];
    const m1Data = dbData.filter(d => d.month === month1 && !d.path.toUpperCase().includes('ACTIVO') && !d.path.toUpperCase().includes('PASIVO') && !d.path.toUpperCase().includes('PATRIMONIO'));
    const m2Data = dbData.filter(d => d.month === month2 && !d.path.toUpperCase().includes('ACTIVO') && !d.path.toUpperCase().includes('PASIVO') && !d.path.toUpperCase().includes('PATRIMONIO'));

    const processItem = (item, isM1) => {
      const pathParts = item.path.split('>');
      const mainCategory = pathParts[0] ? pathParts[0].trim().toUpperCase() : 'OTROS';
      let accountOriginalName = pathParts.length > 1 ? pathParts[pathParts.length - 1].trim() : item.name.trim();
      if (!/^(\d[\d\.]+)/.test(accountOriginalName) && /^(\d[\d\.]+)/.test(item.name.trim())) accountOriginalName = item.name.trim();
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
      const isIngreso = cat.n.includes('INGRESO') || cat.n.includes('VENTA') || cat.key.startsWith('4');
      const multiplier = isIngreso ? -1 : 1;

      cat.c.forEach(acc => {
        acc.m1_u *= multiplier; acc.m2_u *= multiplier;
        cat_m1 += acc.m1_u; cat_m2 += acc.m2_u;
      });
      cat.m1_u = cat_m1; cat.m2_u = cat_m2;
    });

    return root;
  }, [dbData, month1, month2]);

  let total_m1 = 0, total_m2 = 0;
  tree.forEach(cat => {
    const isIngreso = cat.n.includes('INGRESO') || cat.n.includes('VENTA') || cat.key.startsWith('4');
    if (isIngreso) { total_m1 += cat.m1_u; total_m2 += cat.m2_u; } 
    else { total_m1 -= cat.m1_u; total_m2 -= cat.m2_u; }
  });

  const varAbsTotal = total_m2 - total_m1;
  const varPctTotal = total_m1 !== 0 ? (varAbsTotal / Math.abs(total_m1)) * 100 : (total_m2 !== 0 ? 100 : 0);
  const isPosTotal = varAbsTotal > 0;
  const isNegTotal = varAbsTotal < 0;
  const TotalArrowIcon = isPosTotal ? ArrowUpRight : (isNegTotal ? ArrowDownRight : null);
  const fmtR = (v) => new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);

  return (
    <div className="min-h-screen bg-[#f1f5f9]">
      <header className="bg-white border-b-2 border-indigo-500 p-4 flex justify-between items-center sticky top-0 z-30 shadow-md">
        <button onClick={onBack} className="flex items-center gap-2 font-black text-xs text-slate-600 uppercase hover:text-indigo-600"><ArrowLeft size={16}/> Volver</button>
        <div className="flex items-center gap-2 border-l-2 border-slate-200 pl-4">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mr-1">Mes Base:</span>
          <select value={month1} onChange={(e) => setMonth1(e.target.value)} className="bg-slate-50 border border-slate-300 text-slate-700 text-xs rounded-lg block p-1.5 font-bold uppercase cursor-pointer outline-none">
            {availableMonths.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mx-2">VS</span>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mr-1">Mes Comparar:</span>
          <select value={month2} onChange={(e) => setMonth2(e.target.value)} className="bg-indigo-50 border border-indigo-300 text-indigo-700 text-xs rounded-lg block p-1.5 font-bold uppercase cursor-pointer outline-none">
            {availableMonths.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </header>
      <main className="p-4 md:p-8 max-w-6xl mx-auto pb-16">
        <div className="bg-white px-8 py-10 border-t-8 border-indigo-500 shadow-xl flex flex-col items-center text-center mb-6 rounded-b-2xl">
          <h1 className="text-3xl font-black text-slate-900 uppercase mb-2">Servicios Jiret G&B, C.A.</h1>
          <h2 className="text-xl font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-2 mb-4 w-full max-w-md">Análisis Comparativo (Resultados)</h2>
          <p className="font-black uppercase flex items-center gap-2 px-5 py-2 rounded-full text-[10px] bg-slate-800 text-white shadow-sm"><GitCompare size={14}/> {month1} vs {month2}</p>
        </div>
        
        {availableMonths.length < 2 ? (
          <div className="bg-white p-12 text-center rounded-xl border border-slate-200 shadow-sm"><AlertTriangle className="mx-auto text-indigo-400 mb-4" size={48}/><p className="text-slate-500 font-black text-xs uppercase tracking-wider">Necesitas al menos 2 meses cargados.</p></div>
        ) : (
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-800 text-[10px] uppercase font-black text-slate-300 border-b-2 border-indigo-500">
                <tr><th className="px-4 py-5 w-[45%]">Estructura</th><th className="px-3 py-5 text-right bg-slate-900/50">{month1}</th><th className="px-3 py-5 text-right bg-slate-900">{month2}</th><th className="px-3 py-5 text-right text-indigo-400">Var. Absoluta</th><th className="px-3 py-5 text-right">Var. %</th></tr>
              </thead>
              <tbody>
                {tree.map((cat, i) => {
                  const sortedAccounts = [...cat.c].sort((a, b) => String(a.n).localeCompare(String(b.n)));
                  const catVarAbs = cat.m2_u - cat.m1_u;
                  const catVarPct = cat.m1_u !== 0 ? (catVarAbs / Math.abs(cat.m1_u)) * 100 : (cat.m2_u !== 0 ? 100 : 0);
                  const isPosCat = catVarAbs > 0; const isNegCat = catVarAbs < 0;
                  const CatColorClass = isPosCat ? 'text-emerald-600' : (isNegCat ? 'text-red-500' : 'text-slate-400');
                  const CatArrowIcon = isPosCat ? ArrowUpRight : (isNegCat ? ArrowDownRight : null);

                  return (
                    <React.Fragment key={i}>
                      <tr className="bg-[#111827]"><td className="py-3 px-4 text-indigo-400 font-black text-xs uppercase tracking-[0.2em]">{cat.n}</td><td colSpan={4} /></tr>
                      {sortedAccounts.map((acc, j) => {
                        const varAbs = acc.m2_u - acc.m1_u;
                        const varPct = acc.m1_u !== 0 ? (varAbs / Math.abs(acc.m1_u)) * 100 : (acc.m2_u !== 0 ? 100 : 0);
                        const isPos = varAbs > 0; const isNeg = varAbs < 0;
                        const colorClass = isPos ? 'text-emerald-600' : (isNeg ? 'text-red-500' : 'text-slate-400');
                        const ArrowIcon = isPos ? ArrowUpRight : (isNeg ? ArrowDownRight : null);

                        return (
                          <tr key={j} className="bg-white border-b border-gray-100 hover:bg-indigo-50 transition-colors">
                            <td className="py-2.5 px-4 font-bold text-[11px] text-slate-800 uppercase pl-6 border-l-4 border-indigo-400 truncate max-w-xs">{acc.n}</td>
                            <td className="py-2.5 px-3 text-right font-mono text-[11px] text-slate-600">{fmtR(acc.m1_u)}</td>
                            <td className="py-2.5 px-3 text-right font-mono text-[11px] text-slate-800 font-bold">{fmtR(acc.m2_u)}</td>
                            <td className={`py-2.5 px-3 text-right font-mono text-[11px] font-bold ${varAbs !== 0 ? 'text-indigo-600' : 'text-slate-400'}`}>{fmtR(varAbs)}</td>
                            <td className={`py-2.5 px-3 text-right font-mono text-[11px] font-bold flex justify-end items-center gap-1 ${colorClass}`}>
                              {ArrowIcon && <ArrowIcon size={12}/>} {Math.abs(varPct).toFixed(2)}%
                            </td>
                          </tr>
                        );
                      })}
                      <tr className="bg-slate-200 text-slate-800 border-t border-slate-300 shadow-sm transition-colors">
                        <td className="py-3 px-4 font-black text-[11px] uppercase tracking-wider pl-6">TOTAL {cat.n}</td>
                        <td className="py-3 px-3 text-right font-mono text-[12px] font-black">{fmtR(cat.m1_u)}</td>
                        <td className="py-3 px-3 text-right font-mono text-[12px] font-black">{fmtR(cat.m2_u)}</td>
                        <td className={`py-3 px-3 text-right font-mono text-[12px] font-black ${catVarAbs !== 0 ? 'text-indigo-600' : 'text-slate-500'}`}>{fmtR(catVarAbs)}</td>
                        <td className={`py-3 px-3 text-right font-mono text-[12px] font-black flex justify-end items-center gap-1 ${CatColorClass}`}>
                          {CatArrowIcon && <CatArrowIcon size={14}/>} {Math.abs(catVarPct).toFixed(2)}%
                        </td>
                      </tr>
                    </React.Fragment>
                  );
                })}
                <tr className="bg-slate-900 text-white font-black border-t-4 border-indigo-600">
                  <td className="px-5 py-7 text-sm uppercase tracking-[0.2em]" style={{paddingLeft:28}}>RESULTADO DEL EJERCICIO</td>
                  <td className="px-3 py-7 text-right text-base font-mono border-l border-slate-800">{fmtR(total_m1)}</td>
                  <td className="px-3 py-7 text-right text-base font-mono border-l border-slate-800">{fmtR(total_m2)}</td>
                  <td className={`px-3 py-7 text-right text-lg font-mono border-l border-slate-800 ${isPosTotal ? 'text-emerald-400' : (isNegTotal ? 'text-red-400' : 'text-slate-400')}`}>{fmtR(varAbsTotal)}</td>
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
// COMPONENTE PRINCIPAL / DASHBOARD REDISEÑADO (PERSISTENTE)
// ============================================================================
function ReportesFinancierosApp() {
  const [view, setView] = useState('dashboard');
  const [dbData, setDbData] = useState(() => {
    try { const saved = localStorage.getItem('jiret_erp_db_data'); return saved ? JSON.parse(saved) : []; } catch(e){return [];}
  });

  useEffect(() => { localStorage.setItem('jiret_erp_db_data', JSON.stringify(dbData)); }, [dbData]);

  const handleUpload = async (e) => {
    if (!e.target.files.length) return;
    try {
      const newData = await processFiles(e.target.files);
      setDbData(prev => {
        const newlyUploadedMonths = [...new Set(newData.map(d => d.month))];
        const keepData = prev.filter(d => !newlyUploadedMonths.includes(d.month));
        return [...keepData, ...newData];
      });
    } catch (error) { alert("Error al procesar el archivo."); console.error(error); }
  };

  const handleDeleteMonth = (monthToDelete) => {
    if (window.confirm(`¿Eliminar permanentemente ${monthToDelete}?`)) {
      setDbData(prev => prev.filter(d => d.month !== monthToDelete));
    }
  };

  const loadedMonths = [...new Set(dbData.map(d => d.month))].filter(m => m !== 'Sin Mes');

  if (view === 'resultado') return <EstadoResultadoView onBack={() => setView('dashboard')} dbData={dbData} />;
  if (view === 'comparativo') return <AnalisisComparativoView onBack={() => setView('dashboard')} dbData={dbData} />;
  if (view === 'balance') return <BalanceGeneralView onBack={() => setView('dashboard')} dbData={dbData} />;
  
  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <header className="px-6 py-4 bg-[#111827] border-b-4 border-orange-500 flex justify-between items-center shadow-lg">
        <h1 className="text-white font-black text-xl tracking-widest uppercase flex items-center gap-2">Jiret G&B <span className="text-orange-500 px-2 py-0.5 rounded bg-orange-500/10 text-sm">Finance</span></h1>
        <button onClick={() => { if(window.confirm("¿Borrar todos los datos de memoria?")) setDbData([]); }} className="text-red-400 hover:text-red-500 transition-colors text-[10px] font-black uppercase">Limpiar Memoria</button>
      </header>
      <main className="max-w-7xl mx-auto p-6 lg:p-8 mt-4 grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 text-center">
            <FileSpreadsheet className="mx-auto text-slate-300 mb-4" size={40}/>
            <h3 className="font-black text-slate-800 text-sm uppercase mb-2">Carga de Datos</h3>
            <p className="text-[11px] text-slate-500 mb-5 leading-relaxed font-medium">Sube archivos Excel o CSV. Los datos se guardarán en tu navegador automáticamente.</p>
            <label className="bg-slate-800 text-white px-4 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest cursor-pointer hover:bg-orange-500 transition-colors flex items-center justify-center gap-2 w-full shadow-md hover:-translate-y-0.5">
              <Upload size={14}/> Subir Archivos
              <input type="file" multiple accept=".xlsx,.xls,.xlsm,.txt,.csv" className="hidden" onChange={handleUpload}/>
            </label>
          </div>
          {loadedMonths.length > 0 && (
            <div className="bg-emerald-50 rounded-3xl p-6 border border-emerald-100">
              <p className="text-emerald-800 font-black text-[10px] uppercase tracking-widest mb-4 flex items-center gap-2"><CheckCircle size={14}/> Memoria Activa</p>
              <div className="flex flex-wrap gap-2">
                {loadedMonths.map(m => (
                  <span key={m} className="bg-white text-emerald-600 border border-emerald-200 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 shadow-sm">
                    {m} <button onClick={() => handleDeleteMonth(m)}><Trash2 size={10} className="text-red-300 hover:text-red-500"/></button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="lg:col-span-3 space-y-8">
          <div className="bg-white rounded-3xl p-8 lg:p-10 shadow-sm border-l-8 border-orange-500 relative overflow-hidden flex flex-col justify-center min-h-[220px]">
            <div className="absolute top-0 right-0 w-80 h-80 bg-orange-50 rounded-full blur-3xl -mr-20 -mt-20 opacity-70"></div>
            <h2 className="text-3xl lg:text-4xl font-black text-slate-900 uppercase tracking-tight mb-2 relative z-10">Servicios Jiret G&B, C.A.</h2>
            <p className="text-sm font-bold text-slate-500 tracking-[0.3em] mb-6 relative z-10">RIF: J-412309374</p>
            <p className="text-sm text-slate-600 max-w-2xl relative z-10 leading-relaxed font-medium">Panel financiero integral. Los reportes auxiliares de CxC y CxP están mapeados a cuentas específicas del Balance.</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            <button onClick={() => dbData.length > 0 ? setView('resultado') : alert('Carga datos primero.')} className="group bg-white p-6 rounded-3xl shadow-sm border-b-4 border-orange-500 text-left transition-all hover:shadow-xl hover:-translate-y-1">
              <div className="bg-orange-50 w-14 h-14 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform"><LineChart className="text-orange-500" size={28}/></div>
              <h3 className="font-black uppercase text-base text-slate-900">Estado de Resultados</h3>
              <p className="text-xs text-slate-500 mt-2 font-medium">Visualización de ingresos, costos y gastos acumulados o mensuales.</p>
            </button>
            <button onClick={() => dbData.length > 0 ? setView('balance') : alert('Carga datos primero.')} className="group bg-white p-6 rounded-3xl shadow-sm border-b-4 border-blue-500 text-left transition-all hover:shadow-xl hover:-translate-y-1">
              <div className="bg-blue-50 w-14 h-14 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform"><Scale className="text-blue-500" size={28}/></div>
              <h3 className="font-black uppercase text-base text-slate-900">Balance General</h3>
              <p className="text-xs text-slate-500 mt-2 font-medium">Activos, Pasivos y Patrimonio con <strong>mapeo detallado de CxC y CxP</strong>.</p>
            </button>
            <button onClick={() => dbData.length >= 2 ? setView('comparativo') : alert('Para comparar necesitas cargar al menos 2 meses.')} className="group bg-white p-6 rounded-3xl shadow-sm border-b-4 border-indigo-500 text-left transition-all hover:shadow-xl hover:-translate-y-1">
              <div className="bg-indigo-50 w-14 h-14 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform"><GitCompare className="text-indigo-500" size={28}/></div>
              <h3 className="font-black uppercase text-base text-slate-900">Variaciones</h3>
              <p className="text-xs text-slate-500 mt-2 font-medium">Análisis horizontal entre dos periodos con variación porcentual.</p>
            </button>
            <div className="bg-white p-6 rounded-3xl shadow-sm border-b-4 border-teal-500 opacity-50 text-left cursor-not-allowed">
              <div className="bg-teal-50 w-14 h-14 rounded-2xl flex items-center justify-center mb-5"><Landmark className="text-teal-500" size={28}/></div>
              <h3 className="font-black uppercase text-base text-slate-900">Inversiones</h3>
              <p className="text-xs text-slate-500 mt-2 font-medium">Control de portafolio y retorno de inversión (Próximamente).</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default ReportesFinancierosApp;

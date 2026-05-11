import React, { useState, useMemo, useEffect } from 'react';
import { 
  ArrowLeft, Upload, CheckCircle, Scale, 
  LineChart, CalendarDays, AlertTriangle, ChevronRight, ChevronDown, Star, GitCompare, Landmark,
  Database, FileOutput, Trash2, ArrowUpRight, ArrowDownRight, BookOpen
} from 'lucide-react';

// ============================================================================
// 1. LÓGICA DE PROCESAMIENTO DE ARCHIVOS
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

const processPlanCuentas = async (file) => {
  const text = await file.text();
  const lines = text.split(/\r?\n/);
  const plan = {};
  lines.forEach(line => {
    const cols = line.split('\t');
    if (cols.length >= 5 && cols[0].trim() !== 'Código') {
      const name = cols[1].trim();
      const grupo = cols[2].trim();
      const subgrupo = cols[3].trim();
      const cuenta = cols[4].trim();
      plan[name] = `${grupo}>${subgrupo}>${cuenta}`;
    }
  });
  return plan;
};

const processSaldosBalance = async (file, planCuentas) => {
  const text = await file.text();
  const lines = text.split(/\r?\n/);
  if (lines.length < 2) return [];

  const headers = lines[0].split('\t');
  const months = headers.map(h => {
    const m = h.match(/(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)/i);
    return m ? m[0].charAt(0).toUpperCase() + m[0].slice(1).toLowerCase() : null;
  });

  const parseVal = (v) => {
    if (!v || v.trim() === '-' || v.trim() === 'USD -' || v.trim() === 'Bs. -') return 0;
    let cleanStr = String(v).replace(/USD|Bs\./ig, '').trim();
    if (cleanStr.includes(',') && cleanStr.includes('.')) cleanStr = cleanStr.replace(/\./g, '').replace(/,/g, '.');
    else if (cleanStr.includes(',')) cleanStr = cleanStr.replace(/,/g, '.');
    const n = parseFloat(cleanStr);
    return isNaN(n) ? 0 : n;
  };

  let balanceData = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split('\t');
    if (cols.length < 2) continue;
    const accountName = cols[0].trim();
    if (!accountName) continue;

    const path = planCuentas[accountName] || (accountName.includes('BANCO') || accountName.includes('CAJA') ? 'ACTIVOS>ACTIVO CIRCULANTE>DISPONIBLE' : 'ACTIVOS>OTROS');

    for (let c = 1; c < cols.length; c++) {
      if (months[c] && cols[c]) {
        const val = parseVal(cols[c]);
        if (val !== 0) {
          const isUsd = cols[c].includes('USD');
          balanceData.push({
            month: months[c],
            path: path,
            name: accountName,
            usd: isUsd ? val : 0,
            bs: isUsd ? 0 : val
          });
        }
      }
    }
  }
  return balanceData;
};

// Procesador de Inversiones (Activos Fijos)
const processActivosFijos = async (file) => {
  const XL = await loadSheetJS();
  const buffer = await file.arrayBuffer();
  const wb = XL.read(buffer, { type: 'array', cellDates: true });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XL.utils.sheet_to_json(ws, { header: 1, defval: null });
  
  let activos = [];
  if (rows.length < 2) return activos;
  
  let headerIdx = -1;
  let colMap = { cat: -1, desc: -1, fecha: -1, valor: -1, vidaUtil: -1 };
  
  for (let i = 0; i < Math.min(10, rows.length); i++) {
    const row = rows[i]; if (!row) continue;
    const cells = row.map(c => c ? String(c).toLowerCase().trim() : '');
    if (cells.some(c => c.includes('descrip') || c.includes('activo') || c.includes('categor'))) {
      headerIdx = i;
      cells.forEach((c, idx) => {
        if ((c.includes('cat') || c.includes('tipo')) && colMap.cat === -1) colMap.cat = idx;
        else if ((c.includes('descrip') || c.includes('nombre') || c.includes('activo')) && colMap.desc === -1) colMap.desc = idx;
        else if ((c.includes('fecha') || c.includes('adquisi')) && colMap.fecha === -1) colMap.fecha = idx;
        else if ((c.includes('valor') || c.includes('monto') || c.includes('costo')) && colMap.valor === -1) colMap.valor = idx;
        else if ((c.includes('meses') || c.includes('vida') || c.includes('tiempo')) && colMap.vidaUtil === -1) colMap.vidaUtil = idx;
      });
      break;
    }
  }
  
  if (headerIdx === -1) { colMap = { cat:0, desc:1, fecha:2, valor:3, vidaUtil:4 }; headerIdx = 0; }
  
  for (let i = headerIdx + 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.every(c => !c)) continue;
    
    const desc = colMap.desc >= 0 ? row[colMap.desc] : null;
    let valorStr = colMap.valor >= 0 && row[colMap.valor] ? String(row[colMap.valor]) : '';
    if (valorStr.includes(',') && valorStr.includes('.')) valorStr = valorStr.replace(/\./g, '').replace(/,/g, '.');
    else if (valorStr.includes(',')) valorStr = valorStr.replace(/,/g, '.');
    const valor = parseFloat(valorStr);
    
    if (!desc || isNaN(valor)) continue;
    
    let fecha = colMap.fecha >= 0 ? row[colMap.fecha] : new Date();
    if (typeof fecha === 'number') fecha = new Date((fecha - 25569) * 86400 * 1000);
    else if (typeof fecha === 'string') {
      const parts = fecha.split('/');
      if (parts.length === 3) fecha = new Date(parts[2], parts[1]-1, parts[0]);
      else fecha = new Date(fecha);
    }
    if (isNaN(fecha.getTime())) fecha = new Date();

    const vidaStr = colMap.vidaUtil >= 0 ? String(row[colMap.vidaUtil]).replace(/,/g,'.') : '';
    let vidaUtilMeses = parseFloat(vidaStr);
    if (isNaN(vidaUtilMeses) || vidaUtilMeses <= 0) vidaUtilMeses = 60; // Por defecto 5 años (60 meses)

    activos.push({
      categoria: colMap.cat >= 0 && row[colMap.cat] ? String(row[colMap.cat]).toUpperCase() : 'ACTIVOS GENERALES',
      descripcion: String(desc).toUpperCase(),
      fechaAdquisicion: fecha.toISOString().split('T')[0],
      valorAdquisicion: valor,
      vidaUtilMeses: vidaUtilMeses
    });
  }
  return activos;
};


// ============================================================================
// 2. COMPONENTE: ÁRBOL EXPANDIBLE (COMPARTIDO)
// ============================================================================
const ExpandableRow = ({ node, level = 0, totalBaseUSD, defaultOpen = false, highlightedAccounts, toggleHighlight, isBalance = false }) => {
  const isAccountNode = /^\d\./.test(node.n) || (!node.c || node.c.length === 0);
  const isLeaf = !node.c || node.c.length === 0;
  const [isOpen, setIsOpen] = useState(defaultOpen);

  useEffect(() => { setIsOpen(defaultOpen); }, [defaultOpen]);

  const fmtCur = (v) => new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);
  const pct = totalBaseUSD && node.u !== 0 ? `${((Math.abs(node.u) / totalBaseUSD) * 100).toFixed(2)}%` : '';
  const indent = { paddingLeft: `${level * 18 + 10}px` };

  if (!isLeaf && !isAccountNode) {
    const isRoot = level === 0;
    let rootColor = 'text-black'; let borderColor = 'border-black';
    if (isBalance) {
      if (node.n.includes('ACTIVO')) { rootColor = 'text-black'; borderColor = 'border-black'; }
      else if (node.n.includes('PASIVO')) { rootColor = 'text-orange-600'; borderColor = 'border-orange-600'; }
      else if (node.n.includes('PATRIMONIO')) { rootColor = 'text-orange-500'; borderColor = 'border-orange-500'; }
    } else {
        rootColor = 'text-orange-600'; borderColor = 'border-orange-600';
    }

    return (
      <>
        <tr className={isRoot ? 'bg-black' : 'bg-white border-b border-gray-100'}>
          <td style={indent} className={isRoot ? `py-3 px-3 text-white font-black text-xs uppercase tracking-[0.2em]` : 'py-2 px-3 font-black text-[11px] text-black uppercase'}>{node.n}</td>
          <td colSpan={3} />
        </tr>
        {node.c.map((child, i) => (
          <ExpandableRow key={i} node={child} level={level + 1} totalBaseUSD={totalBaseUSD} defaultOpen={defaultOpen} highlightedAccounts={highlightedAccounts} toggleHighlight={toggleHighlight} isBalance={isBalance}/>
        ))}
        <tr className={`${isRoot ? `bg-gray-100 text-black border-t-2 ${borderColor}` : 'bg-gray-50 text-black border-t border-gray-300'} shadow-sm`}>
          <td style={{ paddingLeft: level * 18 + 28 }} className="py-2.5 px-3 font-black text-[10px] uppercase tracking-wider">TOTAL {node.n}</td>
          <td className={`py-2.5 px-3 text-right font-mono text-[11px] font-black ${isRoot ? rootColor : 'text-black'}`}>{fmtCur(Math.abs(node.u))}</td>
          <td className={`py-2.5 px-3 text-right font-mono text-[11px] font-black hidden sm:table-cell ${isRoot ? rootColor : 'text-black'}`}>{fmtCur(Math.abs(node.b))}</td>
          <td className={`py-2.5 px-3 text-right font-mono text-[11px] font-black ${isRoot ? rootColor : 'text-black'}`}>{pct}</td>
        </tr>
      </>
    );
  }

  if (isLeaf || isAccountNode) {
    const isHighlighted = highlightedAccounts.has(node.n);
    return (
      <>
        <tr onClick={() => !isLeaf && setIsOpen(!isOpen)} className={`border-b border-gray-200 cursor-pointer transition-colors ${isHighlighted ? 'bg-orange-100/50 hover:bg-orange-200 border-l-4 border-orange-500' : 'bg-white hover:bg-gray-50 border-l-4 border-gray-300'}`}>
          <td style={indent} className="py-2.5 px-3 font-bold text-[11px] text-black uppercase select-none flex items-center flex-wrap gap-2">
            {!isLeaf && <span className={`inline-flex items-center justify-center w-4 h-4 border rounded-sm text-[11px] leading-none transition-colors ${isOpen ? 'border-gray-500 text-gray-600 bg-gray-100' : 'border-gray-300 text-gray-400 bg-white'}`}>{isOpen ? '−' : '+'}</span>}
            <button onClick={(e) => { e.stopPropagation(); toggleHighlight(node.n); }} className="focus:outline-none transition-transform hover:scale-110"><Star size={16} fill={isHighlighted ? "#f97316" : "none"} color={isHighlighted ? "#f97316" : "#cbd5e1"} /></button>
            <span className="truncate">{node.n}</span>
          </td>
          <td className={`py-2.5 px-3 text-right font-mono text-[11px] font-bold ${isHighlighted ? 'text-orange-900' : 'text-black'}`}>{fmtCur(Math.abs(node.u))}</td>
          <td className={`py-2.5 px-3 text-right font-mono text-[11px] font-bold hidden sm:table-cell ${isHighlighted ? 'text-orange-900' : 'text-black'}`}>{fmtCur(Math.abs(node.b))}</td>
          <td className={`py-2.5 px-3 text-right font-mono text-[11px] font-bold ${isHighlighted ? 'text-orange-700' : 'text-gray-500'}`}>{pct}</td>
        </tr>
        {isOpen && node.c && node.c.map((child, i) => (
          <ExpandableRow key={i} node={child} level={level + 1} totalBaseUSD={totalBaseUSD} defaultOpen={defaultOpen} highlightedAccounts={highlightedAccounts} toggleHighlight={toggleHighlight} isBalance={isBalance}/>
        ))}
      </>
    );
  }
  return null;
};

// ============================================================================
// 3. VISTA: ESTADO DE RESULTADOS (CON LISTA DESPLEGABLE Y COLORES J&B)
// ============================================================================
function EstadoResultadoView({ onBack, dbData }) {
  const availableMonths = useMemo(() => [...new Set(dbData.map(d => d.month))].filter(m=>m!=='Sin Mes'), [dbData]);
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
    
    const normKey = s => s.trim().replace(/\s+/g,' ').toUpperCase();
    resData.forEach(item => {
      const pathArray = item.path.split('>');
      let cur = root;
      pathArray.forEach(folderName => {
        const key = normKey(folderName);
        let folder = cur.find(n => normKey(n.n) === key);
        if (!folder) { folder = { n: folderName.trim(), c: [], u: 0, b: 0 }; cur.push(folder); }
        cur = folder.c;
      });
      const leafKey = normKey(item.name);
      let leaf = cur.find(n => normKey(n.n) === leafKey && n.isLeaf);
      if (!leaf) cur.push({ n: item.name.trim(), u: item.usd, b: item.bs, isLeaf: true });
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
    
    // Sort Results Structure
    const sortTree = (nodes) => {
      nodes.sort((a,b) => {
        const aMatch = a.n.match(/^(\d[\d\.]*)/);
        const bMatch = b.n.match(/^(\d[\d\.]*)/);
        if(aMatch && bMatch) return aMatch[1].localeCompare(bMatch[1], undefined, {numeric: true});
        return a.n.localeCompare(b.n);
      });
      nodes.forEach(n => { if(n.c && n.c.length > 0) sortTree(n.c); });
    };
    sortTree(root);
    
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
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b-2 border-orange-500 p-4 flex justify-between items-center sticky top-0 z-30 shadow-md flex-wrap gap-4">
        <div className="flex items-center gap-4 flex-wrap">
          <button onClick={onBack} className="flex items-center gap-2 font-black text-xs text-black uppercase hover:text-orange-600 transition-colors"><ArrowLeft size={16}/> Volver al Panel</button>
          <div className="flex items-center gap-2 border-l-2 border-gray-200 pl-4 flex-wrap">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest mr-1">Filtro:</span>
            <select 
              value={selectedMonth} 
              onChange={(e) => setSelectedMonth(e.target.value)} 
              className="bg-white border border-gray-300 text-black text-xs rounded-md block p-1.5 font-bold uppercase cursor-pointer outline-none focus:ring-2 focus:ring-orange-500 shadow-sm"
            >
              <option value="General">General</option>
              {availableMonths.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>
        <div className="flex gap-2 bg-gray-100 p-1 rounded-lg border border-gray-200">
          <button onClick={() => { setDefaultOpen(true); setExpandKey(k=>k+1); }} className="px-3 py-1.5 rounded text-[10px] font-black text-black uppercase flex items-center gap-1 hover:bg-white"><ChevronDown size={14}/> Expandir</button>
          <button onClick={() => { setDefaultOpen(false); setExpandKey(k=>k+1); }} className="px-3 py-1.5 rounded text-[10px] font-black text-black uppercase flex items-center gap-1 hover:bg-white"><ChevronRight size={14}/> Contraer</button>
        </div>
      </header>
      <main className="p-4 md:p-8 max-w-6xl mx-auto pb-16">
        <div className="bg-white px-8 py-10 border-t-8 border-black shadow-xl flex flex-col items-center text-center mb-6 rounded-b-2xl">
          <h1 className="text-3xl font-black text-black uppercase mb-2">Servicios Jiret G&B, C.A.</h1>
          <div className="w-20 h-1.5 bg-orange-500 mb-4 rounded-full"/>
          <h2 className="text-xl font-black text-gray-800 uppercase tracking-widest border-b border-gray-100 pb-2 mb-4 w-full max-w-md">Estado de Resultado {selectedMonth === 'General' ? 'Acumulado' : 'Mensual'}</h2>
          <p className="text-white font-black uppercase flex items-center gap-2 bg-black px-5 py-2 rounded-full text-[10px] shadow-sm"><CalendarDays size={14}/> {selectedMonth}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
          <table className="w-full text-left border-collapse">
            <thead className="bg-black text-[10px] uppercase font-black text-white">
              <tr><th className="px-4 py-5 w-[55%]">Cuentas</th><th className="px-3 py-5 text-right text-orange-400">Saldo USD</th><th className="px-3 py-5 text-right hidden sm:table-cell">Saldo Bs.</th><th className="px-3 py-5 text-right">%</th></tr>
            </thead>
            <tbody key={expandKey}>
              {tree.map((node, i) => <ExpandableRow key={i} node={node} totalBaseUSD={baseVentas} defaultOpen={defaultOpen} highlightedAccounts={highlightedAccounts} toggleHighlight={toggleHighlight} isBalance={false}/>)}
              <tr className="bg-black text-white font-black border-t-4 border-orange-500">
                <td className="px-5 py-7 text-sm uppercase tracking-[0.2em]" style={{paddingLeft:28}}>RESULTADO DEL EJERCICIO</td>
                <td className={`px-3 py-7 text-right text-lg font-mono ${totalUSD < 0 ? 'text-red-400' : 'text-white'}`}>{fmtR(totalUSD)}</td>
                <td className={`px-3 py-7 text-right text-lg font-mono hidden sm:table-cell ${totalUSD < 0 ? 'text-red-400' : 'text-white'}`}>{fmtR(totalUSD * 45)}</td>
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
// 4. VISTA: ANÁLISIS COMPARATIVO 
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
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b-2 border-black p-4 flex justify-between items-center sticky top-0 z-30 shadow-md">
        <button onClick={onBack} className="flex items-center gap-2 font-black text-xs text-black uppercase hover:text-orange-600"><ArrowLeft size={16}/> Volver al Panel</button>
        <div className="flex items-center gap-2 border-l-2 border-gray-200 pl-4">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-widest mr-1">Mes Base:</span>
          <select value={month1} onChange={(e) => setMonth1(e.target.value)} className="bg-white border border-gray-300 text-black text-xs rounded-md block p-1.5 font-bold uppercase cursor-pointer outline-none">
            {availableMonths.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mx-2">VS</span>
          <span className="text-xs font-bold text-gray-500 uppercase tracking-widest mr-1">Mes Comparar:</span>
          <select value={month2} onChange={(e) => setMonth2(e.target.value)} className="bg-orange-50 border border-orange-300 text-black text-xs rounded-md block p-1.5 font-bold uppercase cursor-pointer outline-none">
            {availableMonths.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </header>
      <main className="p-4 md:p-8 max-w-6xl mx-auto pb-16">
        <div className="bg-white px-8 py-10 border-t-8 border-black shadow-xl flex flex-col items-center text-center mb-6 rounded-b-2xl">
          <h1 className="text-3xl font-black text-black uppercase mb-2">Servicios Jiret G&B, C.A.</h1>
          <div className="w-20 h-1.5 bg-orange-500 mb-4 rounded-full"/>
          <h2 className="text-xl font-black text-gray-800 uppercase tracking-widest border-b border-gray-100 pb-2 mb-4 w-full max-w-md">Análisis Comparativo</h2>
          <p className="font-black uppercase flex items-center gap-2 px-5 py-2 rounded-full text-[10px] bg-black text-white shadow-sm"><GitCompare size={14}/> {month1} vs {month2}</p>
        </div>
        
        {availableMonths.length < 2 ? (
          <div className="bg-white p-12 text-center rounded-xl border border-gray-200 shadow-sm"><AlertTriangle className="mx-auto text-orange-400 mb-4" size={48}/><p className="text-gray-500 font-black text-xs uppercase tracking-wider">Necesitas al menos 2 meses cargados.</p></div>
        ) : (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
            <table className="w-full text-left border-collapse">
              <thead className="bg-black text-[10px] uppercase font-black text-white border-b-2 border-orange-500">
                <tr><th className="px-4 py-5 w-[45%]">Estructura</th><th className="px-3 py-5 text-right text-gray-300">{month1}</th><th className="px-3 py-5 text-right text-white">{month2}</th><th className="px-3 py-5 text-right text-orange-400">Var. Absoluta</th><th className="px-3 py-5 text-right">Var. %</th></tr>
              </thead>
              <tbody>
                {tree.map((cat, i) => {
                  const sortedAccounts = [...cat.c].sort((a, b) => String(a.n).localeCompare(String(b.n)));
                  const catVarAbs = cat.m2_u - cat.m1_u;
                  const catVarPct = cat.m1_u !== 0 ? (catVarAbs / Math.abs(cat.m1_u)) * 100 : (cat.m2_u !== 0 ? 100 : 0);
                  const isPosCat = catVarAbs > 0; const isNegCat = catVarAbs < 0;
                  const CatColorClass = isPosCat ? 'text-green-600' : (isNegCat ? 'text-red-500' : 'text-gray-400');
                  const CatArrowIcon = isPosCat ? ArrowUpRight : (isNegCat ? ArrowDownRight : null);

                  return (
                    <React.Fragment key={i}>
                      <tr className="bg-black border-b border-gray-800"><td className="py-3 px-4 text-white font-black text-xs uppercase tracking-[0.2em]">{cat.n}</td><td colSpan={4} /></tr>
                      {sortedAccounts.map((acc, j) => {
                        const varAbs = acc.m2_u - acc.m1_u;
                        const varPct = acc.m1_u !== 0 ? (varAbs / Math.abs(acc.m1_u)) * 100 : (acc.m2_u !== 0 ? 100 : 0);
                        const isPos = varAbs > 0; const isNeg = varAbs < 0;
                        const colorClass = isPos ? 'text-green-600' : (isNeg ? 'text-red-500' : 'text-gray-400');
                        const ArrowIcon = isPos ? ArrowUpRight : (isNeg ? ArrowDownRight : null);

                        return (
                          <tr key={j} className="bg-white border-b border-gray-100 hover:bg-orange-50 transition-colors">
                            <td className="py-2.5 px-4 font-bold text-[11px] text-black uppercase pl-6 border-l-4 border-gray-300 truncate max-w-xs">{acc.n}</td>
                            <td className="py-2.5 px-3 text-right font-mono text-[11px] text-gray-600">{fmtR(acc.m1_u)}</td>
                            <td className="py-2.5 px-3 text-right font-mono text-[11px] text-black font-bold">{fmtR(acc.m2_u)}</td>
                            <td className={`py-2.5 px-3 text-right font-mono text-[11px] font-bold ${varAbs !== 0 ? 'text-orange-600' : 'text-gray-400'}`}>{fmtR(varAbs)}</td>
                            <td className={`py-2.5 px-3 text-right font-mono text-[11px] font-bold flex justify-end items-center gap-1 ${colorClass}`}>
                              {ArrowIcon && <ArrowIcon size={12}/>} {Math.abs(varPct).toFixed(2)}%
                            </td>
                          </tr>
                        );
                      })}
                      <tr className="bg-gray-100 text-black border-t border-gray-300 shadow-sm transition-colors">
                        <td className="py-3 px-4 font-black text-[11px] uppercase tracking-wider pl-6">TOTAL {cat.n}</td>
                        <td className="py-3 px-3 text-right font-mono text-[12px] font-black">{fmtR(cat.m1_u)}</td>
                        <td className="py-3 px-3 text-right font-mono text-[12px] font-black">{fmtR(cat.m2_u)}</td>
                        <td className={`py-3 px-3 text-right font-mono text-[12px] font-black ${catVarAbs !== 0 ? 'text-orange-600' : 'text-gray-500'}`}>{fmtR(catVarAbs)}</td>
                        <td className={`py-3 px-3 text-right font-mono text-[12px] font-black flex justify-end items-center gap-1 ${CatColorClass}`}>
                          {CatArrowIcon && <CatArrowIcon size={14}/>} {Math.abs(catVarPct).toFixed(2)}%
                        </td>
                      </tr>
                    </React.Fragment>
                  );
                })}
                <tr className="bg-black text-white font-black border-t-4 border-orange-500">
                  <td className="px-5 py-7 text-sm uppercase tracking-[0.2em]" style={{paddingLeft:28}}>RESULTADO DEL EJERCICIO</td>
                  <td className="px-3 py-7 text-right text-base font-mono border-l border-gray-800">{fmtR(total_m1)}</td>
                  <td className="px-3 py-7 text-right text-base font-mono border-l border-gray-800">{fmtR(total_m2)}</td>
                  <td className={`px-3 py-7 text-right text-lg font-mono border-l border-gray-800 ${isPosTotal ? 'text-green-400' : (isNegTotal ? 'text-red-400' : 'text-gray-400')}`}>{fmtR(varAbsTotal)}</td>
                  <td className={`px-3 py-7 text-right text-lg font-mono flex justify-end items-center gap-1 ${isPosTotal ? 'text-green-400' : (isNegTotal ? 'text-red-400' : 'text-gray-400')}`}>
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
// 5. VISTA: BALANCE GENERAL (ORDENADO ESTRICTAMENTE POR ECUACIÓN PATRIMONIAL)
// ============================================================================
function BalanceGeneralView({ onBack, dbData }) {
  const availableMonths = useMemo(() => {
    const balanceRecords = dbData.filter(item => item.path.toUpperCase().includes('ACTIVO') || item.path.toUpperCase().includes('PASIVO') || item.path.toUpperCase().includes('PATRIMONIO') || /^[123]/.test(item.name));
    return [...new Set(balanceRecords.map(d => d.month))];
  }, [dbData]);
  
  const [selectedMonth, setSelectedMonth] = useState(availableMonths[availableMonths.length - 1] || ''); 
  const [defaultOpen, setDefaultOpen] = useState(false);
  const [expandKey, setExpandKey] = useState(0);
  const [tasa, setTasa] = useState(90); 

  const [highlightedAccounts, setHighlightedAccounts] = useState(() => {
    try { const saved = localStorage.getItem('jiret_highlighted_accounts'); return saved ? new Set(JSON.parse(saved)) : new Set(); } catch(e){return new Set();}
  });
  useEffect(() => { localStorage.setItem('jiret_highlighted_accounts', JSON.stringify([...highlightedAccounts])); }, [highlightedAccounts]);

  const tree = useMemo(() => {
    const root = [];
    const monthData = dbData.filter(d => d.month === selectedMonth);
    const balanceData = monthData.filter(item => item.path.toUpperCase().includes('ACTIVO') || item.path.toUpperCase().includes('PASIVO') || item.path.toUpperCase().includes('PATRIMONIO') || /^[123]/.test(item.name));
    const normKey = s => s.trim().replace(/\s+/g,' ').toUpperCase();

    balanceData.forEach(item => {
      const pathArray = item.path.split('>');
      let cur = root;
      pathArray.forEach(folderName => {
        const key = normKey(folderName);
        let folder = cur.find(n => normKey(n.n) === key);
        if (!folder) { folder = { n: folderName.trim(), c: [], u: 0, b: 0 }; cur.push(folder); }
        cur = folder.c;
      });
      const usdVal = item.usd || (item.bs ? item.bs / tasa : 0);
      const bsVal  = item.bs  || (item.usd ? item.usd * tasa : 0);
      const leafKey = normKey(item.name);
      let leaf = cur.find(n => normKey(n.n) === leafKey && n.isLeaf);
      if (!leaf) cur.push({ n: item.name.trim(), u: usdVal, b: bsVal, isLeaf: true });
      else { leaf.u += usdVal; leaf.b += bsVal; }
    });
    
    // ORDENAMIENTO ESTRICTO DE ECUACIÓN PATRIMONIAL (Activos, Pasivos, Patrimonio)
    const sortTree = (nodes) => {
      nodes.sort((a, b) => {
        // Orden alfanumérico si hay números (ej. 1. Activo, 1.1 Disponible, 1.1.1 Caja)
        const aMatch = a.n.match(/^(\d[\d\.]*)/);
        const bMatch = b.n.match(/^(\d[\d\.]*)/);
        if (aMatch && bMatch) {
            return aMatch[1].localeCompare(bMatch[1], undefined, {numeric: true});
        }
        
        // Forzar orden raíz si no tienen numeración
        const order = {"ACTIVO": 1, "PASIVO": 2, "PATRIMONIO": 3};
        const aUpper = a.n.toUpperCase();
        const bUpper = b.n.toUpperCase();
        const aVal = order[Object.keys(order).find(k => aUpper.includes(k))] || 99;
        const bVal = order[Object.keys(order).find(k => bUpper.includes(k))] || 99;
        
        if (aVal !== bVal) return aVal - bVal;
        
        // Alfabético
        return a.n.localeCompare(b.n);
      });
      nodes.forEach(n => { if (n.c && n.c.length > 0) sortTree(n.c); });
    };
    
    sortTree(root);

    const compute = (nodes) => {
      let u = 0, b = 0;
      nodes.forEach(n => { if (!n.isLeaf) { const t = compute(n.c); n.u = t.u; n.b = t.b; } u += n.u; b += n.b; });
      return { u, b };
    };
    compute(root);
    return root;
  }, [dbData, selectedMonth, tasa]);

  let totalActivos = 0; let totalPasPat = 0;
  tree.forEach(n => { if(n.n.toUpperCase().includes('ACTIVO') || n.n.startsWith('1')) totalActivos += n.u; else totalPasPat += n.u; });

  const fmtR = (v) => new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Math.abs(v));

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b-2 border-black p-4 flex justify-between items-center sticky top-0 z-30 shadow-md flex-wrap gap-2">
        <div className="flex items-center gap-4 flex-wrap">
          <button onClick={onBack} className="flex items-center gap-2 font-black text-xs text-black uppercase hover:text-orange-600 transition-colors"><ArrowLeft size={16}/> Salir al Panel</button>
          {availableMonths.length > 0 && (
            <div className="border-l-2 border-gray-200 pl-4 flex items-center gap-2">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Corte:</span>
              <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="bg-white border border-gray-300 text-black text-xs rounded-md block p-1.5 font-bold uppercase cursor-pointer outline-none">
                {availableMonths.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          )}
          <div className="border-l-2 border-gray-200 pl-4 flex items-center gap-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Tasa Bs/USD:</span>
            <input
              type="number" min="1" step="0.01" value={tasa}
              onChange={e => setTasa(parseFloat(e.target.value) || 1)}
              className="bg-white border border-gray-300 text-black text-xs rounded-md p-1.5 w-24 font-black outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>
        <div className="flex gap-2 bg-gray-100 p-1 rounded-lg border border-gray-200">
          <button onClick={() => { setDefaultOpen(true); setExpandKey(k=>k+1); }} className="px-3 py-1.5 rounded text-[10px] font-black text-black uppercase flex items-center gap-1 hover:bg-white"><ChevronDown size={14}/> Expandir</button>
          <button onClick={() => { setDefaultOpen(false); setExpandKey(k=>k+1); }} className="px-3 py-1.5 rounded text-[10px] font-black text-black uppercase flex items-center gap-1 hover:bg-white"><ChevronRight size={14}/> Contraer</button>
        </div>
      </header>
      <main className="p-4 md:p-8 max-w-6xl mx-auto pb-16">
        <div className="bg-white px-8 py-10 border-t-8 border-black shadow-xl flex flex-col items-center text-center mb-6 rounded-b-2xl">
          <h1 className="text-3xl font-black text-black uppercase mb-2 tracking-tighter">Servicios Jiret G&B, C.A.</h1>
          <div className="w-20 h-1.5 bg-orange-500 mb-4 rounded-full"/>
          <h2 className="text-xl font-black text-gray-800 uppercase tracking-widest border-b border-gray-100 pb-2 mb-4 w-full max-w-md">Balance General</h2>
          <p className="text-white font-black uppercase flex items-center gap-2 bg-black px-5 py-2 rounded-full text-[10px] shadow-sm"><Scale size={14}/> {selectedMonth ? `Corte de Mes: ${selectedMonth}` : 'Sin datos'}</p>
        </div>
        
        {dbData.length === 0 || tree.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-xl border border-gray-200 shadow-sm">
            <AlertTriangle className="mx-auto text-orange-400 mb-4" size={48}/>
            <p className="text-gray-500 font-black text-xs uppercase tracking-wider mb-2">No se detectaron cuentas de Balance.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
            <table className="w-full text-left border-collapse">
              <thead className="bg-black text-[10px] uppercase font-black text-white">
                <tr>
                  <th className="px-4 py-5 w-[55%]">Estructura</th>
                  <th className="px-3 py-5 text-right text-orange-400">Saldo USD</th>
                  <th className="px-3 py-5 text-right text-gray-300 hidden sm:table-cell">Equiv. Bs. <span className="text-gray-500 font-normal normal-case">(× {tasa})</span></th>
                  <th className="px-3 py-5 text-right">%</th>
                </tr>
              </thead>
              <tbody key={expandKey}>
                {tree.map((node, i) => <ExpandableRow key={i} node={node} totalBaseUSD={totalActivos} defaultOpen={defaultOpen} highlightedAccounts={highlightedAccounts} toggleHighlight={a => setHighlightedAccounts(p => {const s=new Set(p); if(s.has(a))s.delete(a); else s.add(a); return s;})} isBalance={true}/>)}
                <tr className="bg-black text-white font-black border-t-4 border-orange-500">
                  <td colSpan={4} className="p-6">
                    <div className="flex flex-wrap justify-between items-center px-4">
                      <div className="flex items-center gap-4"><Landmark size={32} className="text-orange-500"/><div><p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">Ecuación Patrimonial</p><p className="text-sm font-black tracking-widest">ACTIVOS = PASIVOS + PATRIMONIO</p></div></div>
                      <div className="flex gap-8 text-right">
                        <div><p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Total Activos</p><p className="text-xl font-mono text-white">USD {fmtR(totalActivos)}</p></div>
                        <div><p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Pasivo + Patrimonio</p><p className="text-xl font-mono text-white">USD {fmtR(totalPasPat)}</p></div>
                      </div>
                    </div>
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
// 6. VISTA: INVERSIONES / ACTIVOS FIJOS (REPORTE DE DEPRECIACIÓN)
// ============================================================================
function InversionesView({ onBack, activosData }) {
  const [fechaCorte, setFechaCorte] = useState(new Date().toISOString().split('T')[0]);
  const [expandedCats, setExpandedCats] = useState({});

  const toggleCat = (cat) => setExpandedCats(p => ({...p, [cat]: !p[cat]}));
  const fmtCur = (v) => new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);

  const getMonthsDiff = (d1, d2) => {
      const date1 = new Date(d1); const date2 = new Date(d2);
      let months = (date2.getFullYear() - date1.getFullYear()) * 12;
      months -= date1.getMonth(); months += date2.getMonth();
      return months <= 0 ? 0 : months;
  };

  // Agrupar y Calcular
  const categories = useMemo(() => {
    const cats = {};
    activosData.forEach(activo => {
      if (!cats[activo.categoria]) cats[activo.categoria] = { items: [], totalValor: 0, totalDepreciacion: 0, totalNeto: 0 };
      
      const mesesTranscurridos = getMonthsDiff(activo.fechaAdquisicion, fechaCorte);
      const cuotaMensual = activo.valorAdquisicion / activo.vidaUtilMeses;
      let depreciacionAcumulada = cuotaMensual * mesesTranscurridos;
      if (depreciacionAcumulada > activo.valorAdquisicion) depreciacionAcumulada = activo.valorAdquisicion; // Max depreciado
      
      const valorNeto = activo.valorAdquisicion - depreciacionAcumulada;

      cats[activo.categoria].items.push({ ...activo, mesesTranscurridos, depreciacionAcumulada, valorNeto });
      cats[activo.categoria].totalValor += activo.valorAdquisicion;
      cats[activo.categoria].totalDepreciacion += depreciacionAcumulada;
      cats[activo.categoria].totalNeto += valorNeto;
    });
    return cats;
  }, [activosData, fechaCorte]);

  let granTotalValor = 0; let granTotalDep = 0; let granTotalNeto = 0;
  Object.values(categories).forEach(c => { granTotalValor += c.totalValor; granTotalDep += c.totalDepreciacion; granTotalNeto += c.totalNeto; });

  return (
    <div className="min-h-screen bg-gray-50">
       <header className="bg-white border-b-2 border-black p-4 flex justify-between items-center sticky top-0 z-30 shadow-md">
        <button onClick={onBack} className="flex items-center gap-2 font-black text-xs text-black uppercase hover:text-orange-600 transition-colors"><ArrowLeft size={16}/> Volver al Panel</button>
        <div className="flex items-center gap-2 border-l-2 border-gray-200 pl-4">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Fecha de Corte para Depreciación:</span>
          <input type="date" value={fechaCorte} onChange={e => setFechaCorte(e.target.value)} className="bg-white border border-gray-300 text-black text-xs rounded-md p-1.5 font-bold outline-none focus:ring-2 focus:ring-orange-500" />
        </div>
      </header>
      <main className="p-4 md:p-8 max-w-6xl mx-auto pb-16">
        <div className="bg-white px-8 py-10 border-t-8 border-black shadow-xl flex flex-col items-center text-center mb-6 rounded-b-2xl">
          <h1 className="text-3xl font-black text-black uppercase mb-2">Servicios Jiret G&B, C.A.</h1>
          <div className="w-20 h-1.5 bg-orange-500 mb-4 rounded-full"/>
          <h2 className="text-xl font-black text-gray-800 uppercase tracking-widest border-b border-gray-100 pb-2 mb-4 w-full max-w-md">Reporte de Activos Fijos e Inversiones</h2>
          <p className="text-white font-black uppercase flex items-center gap-2 bg-black px-5 py-2 rounded-full text-[10px] shadow-sm"><Landmark size={14}/> Detalle de Depreciación</p>
        </div>

        {activosData.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-xl border border-gray-200 shadow-sm"><AlertTriangle className="mx-auto text-orange-400 mb-4" size={48}/><p className="text-gray-500 font-black text-xs uppercase tracking-wider">No hay Activos Fijos cargados.</p></div>
        ) : (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
             <table className="w-full text-left border-collapse">
              <thead className="bg-black text-[9px] uppercase font-black text-white">
                <tr>
                  <th className="px-4 py-4 w-[35%]">Categoría / Activo</th>
                  <th className="px-3 py-4 text-center">Adquisición</th>
                  <th className="px-3 py-4 text-right text-orange-400">Valor Original USD</th>
                  <th className="px-3 py-4 text-center">Meses Depreciados</th>
                  <th className="px-3 py-4 text-right text-red-400">Depreciación Acum.</th>
                  <th className="px-3 py-4 text-right text-green-400">Valor Neto USD</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(categories).sort().map(catName => {
                  const cat = categories[catName];
                  const isExpanded = expandedCats[catName];
                  return (
                    <React.Fragment key={catName}>
                       {/* Fila Categoría */}
                       <tr onClick={() => toggleCat(catName)} className="bg-gray-100 border-b border-gray-300 cursor-pointer hover:bg-gray-200 transition-colors">
                          <td className="py-3 px-4 font-black text-xs text-black uppercase tracking-wider flex items-center gap-2">
                            <span className="inline-flex items-center justify-center w-4 h-4 border border-gray-400 rounded-sm text-[11px] leading-none bg-white">{isExpanded ? '−' : '+'}</span>
                            {catName}
                          </td>
                          <td className="py-3 px-3 text-center text-xs font-bold text-gray-500">-</td>
                          <td className="py-3 px-3 text-right text-[12px] font-mono font-black text-black">{fmtCur(cat.totalValor)}</td>
                          <td className="py-3 px-3 text-center text-xs font-bold text-gray-500">-</td>
                          <td className="py-3 px-3 text-right text-[12px] font-mono font-bold text-red-600">{fmtCur(cat.totalDepreciacion)}</td>
                          <td className="py-3 px-3 text-right text-[12px] font-mono font-black text-green-600">{fmtCur(cat.totalNeto)}</td>
                       </tr>
                       {/* Filas Detalle */}
                       {isExpanded && cat.items.map((activo, idx) => (
                         <tr key={idx} className="bg-white border-b border-gray-100 hover:bg-orange-50">
                           <td className="py-2.5 px-4 pl-10 font-bold text-[11px] text-gray-800 truncate max-w-[250px] border-l-4 border-orange-500">{activo.descripcion}</td>
                           <td className="py-2.5 px-3 text-center text-[11px] font-mono text-gray-600">{activo.fechaAdquisicion}</td>
                           <td className="py-2.5 px-3 text-right text-[11px] font-mono font-bold text-black">{fmtCur(activo.valorAdquisicion)}</td>
                           <td className="py-2.5 px-3 text-center text-[11px] font-mono font-bold text-gray-500">{activo.mesesTranscurridos} <span className="text-gray-400 font-normal">/ {activo.vidaUtilMeses}</span></td>
                           <td className="py-2.5 px-3 text-right text-[11px] font-mono text-red-500">{fmtCur(activo.depreciacionAcumulada)}</td>
                           <td className="py-2.5 px-3 text-right text-[11px] font-mono font-bold text-green-600">{fmtCur(activo.valorNeto)}</td>
                         </tr>
                       ))}
                    </React.Fragment>
                  );
                })}
                <tr className="bg-black text-white font-black border-t-4 border-orange-500">
                  <td className="px-4 py-6 text-sm uppercase tracking-[0.2em]">TOTAL ACTIVOS FIJOS</td>
                  <td className="px-3 py-6 text-center text-gray-500">-</td>
                  <td className="px-3 py-6 text-right text-lg font-mono text-orange-400">{fmtCur(granTotalValor)}</td>
                  <td className="px-3 py-6 text-center text-gray-500">-</td>
                  <td className="px-3 py-6 text-right text-lg font-mono text-red-400">{fmtCur(granTotalDep)}</td>
                  <td className="px-3 py-6 text-right text-lg font-mono text-green-400">{fmtCur(granTotalNeto)}</td>
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
// 7. COMPONENTE PRINCIPAL / DASHBOARD REDISEÑADO J&B
// ============================================================================
function ReportesFinancierosApp() {
  const [view, setView] = useState('dashboard');
  
  const [dbData, setDbData] = useState(() => {
    try { const saved = localStorage.getItem('jiret_erp_db_data'); return saved ? JSON.parse(saved) : []; } catch(e){return [];}
  });
  const [planCuentas, setPlanCuentas] = useState(() => {
    try { const saved = localStorage.getItem('jiret_plan_cuentas'); return saved ? JSON.parse(saved) : {}; } catch(e){return {};}
  });
  const [activosData, setActivosData] = useState(() => {
    try { const saved = localStorage.getItem('jiret_erp_activos_data'); return saved ? JSON.parse(saved) : []; } catch(e){return [];}
  });

  useEffect(() => { localStorage.setItem('jiret_erp_db_data', JSON.stringify(dbData)); }, [dbData]);
  useEffect(() => { localStorage.setItem('jiret_plan_cuentas', JSON.stringify(planCuentas)); }, [planCuentas]);
  useEffect(() => { localStorage.setItem('jiret_erp_activos_data', JSON.stringify(activosData)); }, [activosData]);

  const handleUploadResultados = async (e) => {
    if (!e.target.files.length) return;
    try {
      const newData = await processFiles(e.target.files);
      setDbData(prev => {
        const newlyUploadedMonths = [...new Set(newData.map(d => d.month))];
        const keepData = prev.filter(d => !newlyUploadedMonths.includes(d.month));
        return [...keepData, ...newData];
      });
      alert("✅ Resultados cargados exitosamente.");
    } catch (error) { alert("Error al procesar."); }
  };

  const handleUploadPlan = async (e) => {
    if (!e.target.files.length) return;
    try {
      const plan = await processPlanCuentas(e.target.files[0]);
      setPlanCuentas(plan);
      alert("✅ Plan de cuentas cargado.");
    } catch (error) { alert("Error al procesar el Plan."); }
  };

  const handleUploadSaldos = async (e) => {
    if (!e.target.files.length) return;
    if (Object.keys(planCuentas).length === 0) { alert("⚠️ Carga el Plan de Cuentas primero."); return; }
    try {
      const newBalanceData = await processSaldosBalance(e.target.files[0], planCuentas);
      setDbData(prev => [...prev, ...newBalanceData]);
      alert("✅ Saldos de Balance cargados.");
    } catch (error) { alert("Error al procesar los Saldos."); }
  };

  const handleUploadActivos = async (e) => {
    if (!e.target.files.length) return;
    try {
      const activos = await processActivosFijos(e.target.files[0]);
      setActivosData(activos);
      alert(`✅ Activos Fijos cargados exitosamente (${activos.length} registros).`);
    } catch (error) { alert("Error al procesar archivo de Activos Fijos."); }
  };

  const handleDeleteMonth = (monthToDelete) => {
    if (window.confirm(`¿Eliminar los datos de ${monthToDelete}?`)) {
      setDbData(prev => prev.filter(d => d.month !== monthToDelete));
    }
  };

  const loadedMonths = [...new Set(dbData.map(d => d.month))].filter(m => m !== 'Sin Mes');
  const hasPlan = Object.keys(planCuentas).length > 0;
  const hasActivos = activosData.length > 0;

  if (view === 'resultado')     return <EstadoResultadoView   onBack={() => setView('dashboard')} dbData={dbData} />;
  if (view === 'comparativo')   return <AnalisisComparativoView onBack={() => setView('dashboard')} dbData={dbData} />;
  if (view === 'balance')       return <BalanceGeneralView    onBack={() => setView('dashboard')} dbData={dbData} />;
  if (view === 'inversiones')   return <InversionesView       onBack={() => setView('dashboard')} activosData={activosData} />;

  // ── VISTA CONFIGURACIÓN ────────────────────────────────────────────────────
  if (view === 'configuracion') return (
    <div className="min-h-screen bg-gray-50">
      <header className="px-6 py-4 bg-black border-b-4 border-orange-500 flex items-center gap-4 shadow-lg">
        <button onClick={() => setView('dashboard')} className="flex items-center gap-2 text-gray-400 hover:text-white font-black text-xs uppercase transition-colors"><ArrowLeft size={16}/> Panel</button>
        <h1 className="text-white font-black text-lg tracking-widest uppercase flex items-center gap-2">
          Configuración <span className="text-orange-500 text-sm">/ Ingesta de Datos</span>
        </h1>
      </header>
      <main className="max-w-3xl mx-auto p-8 space-y-6">

        {/* STATUS BAR */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label:'Plan de Cuentas', ok: hasPlan,   val: hasPlan ? 'Cargado' : 'Pendiente' },
            { label:'Meses en Memoria', ok: loadedMonths.length > 0, val: loadedMonths.length > 0 ? loadedMonths.join(', ') : 'Ninguno' },
            { label:'Activos Fijos', ok: hasActivos, val: hasActivos ? `${activosData.length} registros` : 'Pendiente' },
          ].map(s => (
            <div key={s.label} className={`rounded-xl p-4 border ${s.ok ? 'bg-orange-50 border-orange-300' : 'bg-white border-gray-200'} shadow-sm`}>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">{s.label}</p>
              <p className={`text-xs font-bold truncate ${s.ok ? 'text-orange-600' : 'text-gray-500'}`}>{s.val}</p>
            </div>
          ))}
        </div>

        {/* UPLOAD STEPS */}
        <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-md space-y-4">
          <h2 className="text-black font-black text-sm uppercase tracking-widest mb-6 flex items-center gap-2"><Database size={16} className="text-orange-500"/> Carga de Archivos</h2>

          {[
            { num:'01', label: hasPlan ? '✓ Plan de Cuentas Cargado' : 'Plan de Cuentas (.txt)', color:'black', active: true, accept:'.txt', handler: handleUploadPlan },
            { num:'02', label:'Saldos Iniciales — Balance (.txt)', color:'orange', active: hasPlan, accept:'.txt', handler: handleUploadSaldos },
            { num:'03', label:'Estado de Resultados (.xlsx / .csv)', color:'black', active: true, accept:'.xlsx,.xls,.xlsm,.txt,.csv', handler: handleUploadResultados, multiple: true },
            { num:'04', label: hasActivos ? `✓ Activos Fijos Cargados` : 'Activos Fijos / Inversiones (.xlsx)', color:'orange', active: true, accept:'.xlsx,.xls,.csv', handler: handleUploadActivos },
          ].map(step => {
            const colors = {
              orange: 'border-orange-500 text-orange-600 bg-orange-50',
              black:   'border-black text-black bg-gray-50',
            };
            return (
              <label key={step.num} className={`flex items-center gap-4 p-4 rounded-xl border-2 ${step.active ? `${colors[step.color]} cursor-pointer hover:shadow-md transition-all` : 'border-gray-200 text-gray-400 opacity-60 cursor-not-allowed'}`}>
                <span className="text-2xl font-black font-mono opacity-30">{step.num}</span>
                <span className="flex-1 font-black text-xs uppercase tracking-wider">{step.label}</span>
                <Upload size={16} className="opacity-50"/>
                <input type="file" accept={step.accept} multiple={step.multiple} disabled={!step.active} className="hidden" onChange={step.handler}/>
              </label>
            );
          })}
        </div>

        {/* MESES EN MEMORIA */}
        {loadedMonths.length > 0 && (
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <p className="text-gray-400 font-black text-[10px] uppercase tracking-widest mb-4 flex items-center gap-2"><CheckCircle size={14} className="text-orange-500"/> Meses en Memoria</p>
            <div className="flex flex-wrap gap-2">
              {loadedMonths.map(m => (
                <span key={m} className="bg-black text-white border border-black px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 shadow-sm">
                  {m}
                  <button onClick={() => handleDeleteMonth(m)} className="hover:text-orange-400 transition-colors"><Trash2 size={10}/></button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ZONA PELIGROSA */}
        <div className="bg-red-50 rounded-2xl p-5 border border-red-200 flex items-center justify-between">
          <div>
            <p className="text-red-600 font-black text-xs uppercase tracking-wider">Zona de Peligro</p>
            <p className="text-red-400 text-[11px] mt-0.5 font-bold">Elimina todos los datos cargados en memoria</p>
          </div>
          <button onClick={() => { if(window.confirm("¿Borrar TODOS los datos?")) { setDbData([]); setPlanCuentas({}); setActivosData([]); }}}
            className="bg-red-600 hover:bg-red-700 text-white border border-red-700 px-4 py-2 rounded-xl font-black uppercase text-[9px] tracking-widest transition-all shadow-md">
            Limpiar Todo
          </button>
        </div>

      </main>
    </div>
  );

  // ── DASHBOARD PRINCIPAL (BLANCO, NARANJA, NEGRO) ──────────────────────────
  const modules = [
    {
      id: 'resultado',
      title: 'Estado de Resultados',
      desc: 'P&L mensual y acumulado por cuentas',
      icon: <LineChart size={32}/>,
      accent: '#f97316', // Orange
      dark: false,
      onClick: () => dbData.length > 0 ? setView('resultado') : alert('Carga datos en Configuración primero.'),
    },
    {
      id: 'balance',
      title: 'Balance General',
      desc: 'Situación financiera multimoneda USD/Bs',
      icon: <Scale size={32}/>,
      accent: '#000000', // Black
      dark: true,
      onClick: () => dbData.length > 0 ? setView('balance') : alert('Carga datos en Configuración primero.'),
    },
    {
      id: 'comparativo',
      title: 'Análisis de Variaciones',
      desc: 'Comparativo mes a mes de resultados',
      icon: <GitCompare size={32}/>,
      accent: '#f97316', // Orange
      dark: false,
      onClick: () => dbData.length >= 2 ? setView('comparativo') : alert('Necesitas al menos 2 meses cargados.'),
    },
    {
      id: 'inversiones',
      title: 'Inversiones y Activos',
      desc: `${hasActivos ? activosData.length + ' activos registrados' : 'Depreciación y control'}`,
      icon: <Landmark size={32}/>,
      accent: '#000000', // Black
      dark: true,
      onClick: () => hasActivos ? setView('inversiones') : alert('Carga tus Activos Fijos en Configuración.'),
    },
    {
      id: 'libro',
      title: 'Libro Diario',
      desc: 'Asientos y movimientos contables',
      icon: <BookOpen size={32}/>,
      accent: '#000000', 
      dark: false,
      disabled: true,
    },
    {
      id: 'configuracion',
      title: 'Configuración',
      desc: `Plan: ${hasPlan ? '✓' : '—'} · Meses: ${loadedMonths.length}`,
      icon: <Database size={32}/>,
      accent: '#f97316', // Orange
      dark: false,
      onClick: () => setView('configuracion'),
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* HEADER */}
      <header className="px-8 py-5 bg-black border-b-4 border-orange-500 shadow-xl">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-white font-black text-2xl tracking-[0.15em] uppercase">
              JIRET G&B <span className="text-orange-500">Finance</span>
            </h1>
            <p className="text-gray-400 text-[11px] font-bold tracking-[0.3em] uppercase mt-0.5">Servicios Jiret G&B, C.A. · RIF: J-412309374</p>
          </div>
          <div className="flex items-center gap-3">
            {loadedMonths.length > 0 && (
              <span className="bg-orange-500/20 border border-orange-500 text-orange-400 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest">
                {loadedMonths.length} mes{loadedMonths.length !== 1 ? 'es' : ''} en memoria
              </span>
            )}
            <button onClick={() => setView('configuracion')} className="bg-white hover:bg-gray-100 text-black border border-gray-300 px-4 py-2 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center gap-2">
              <Database size={14} className="text-orange-500"/> Config.
            </button>
          </div>
        </div>
      </header>

      {/* PANEL GRID */}
      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="text-center mb-10">
          <h2 className="text-black font-black text-3xl tracking-[0.2em] uppercase mb-2">Panel Principal</h2>
          <div className="w-16 h-1 bg-orange-500 mx-auto rounded-full"/>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map(mod => (
            <button
              key={mod.id}
              onClick={mod.disabled ? undefined : mod.onClick}
              disabled={mod.disabled}
              className={`group relative rounded-2xl p-6 text-left transition-all duration-300 overflow-hidden shadow-lg border-2 
                ${mod.dark
                  ? 'bg-black text-white hover:shadow-2xl hover:-translate-y-1'
                  : 'bg-white text-black hover:shadow-2xl hover:-translate-y-1'
                }
                ${mod.disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
              `}
              style={{ borderColor: mod.disabled ? '#e5e7eb' : (mod.dark ? 'black' : '#f97316') }}
            >
              <div className="mb-4 transition-transform duration-200 group-hover:scale-110"
                style={{ color: mod.dark ? '#f97316' : '#f97316' }}>
                {mod.icon}
              </div>
              <h3 className={`font-black text-sm uppercase tracking-tight leading-tight mb-1.5`}>
                {mod.title}
              </h3>
              <p className={`text-[11px] font-bold leading-relaxed ${mod.dark ? 'text-gray-400' : 'text-gray-500'}`}>
                {mod.desc}
              </p>
            </button>
          ))}
        </div>

        {/* FOOTER NOTE */}
        <p className="text-center text-gray-400 text-[10px] font-black uppercase tracking-widest mt-12">
          Módulo de Reportes Financieros · Jiret G&B Finance v2.5
        </p>
      </main>
    </div>
  );
}

export default ReportesFinancierosApp;

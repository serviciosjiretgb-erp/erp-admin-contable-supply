import React, { useState, useMemo, useEffect } from 'react';
import { 
  ArrowLeft, Upload, CheckCircle, Scale, 
  LineChart, CalendarDays, AlertTriangle, ChevronRight, ChevronDown, Star, GitCompare, Landmark,
  Database, Trash2, ArrowUpRight, ArrowDownRight
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

    if (ext === 'xlsx' || ext === 'xls' || ext === 'xlsm' || ext === 'csv') {
      const XL = await loadSheetJS();
      const buffer = await file.arrayBuffer();
      const wb = XL.read(buffer, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      dataRows = XL.utils.sheet_to_json(ws, { header: 1, defval: null });
    } else if (ext === 'txt') {
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
      const usdStr = row[1]; const bsStr = row[2];
      if (String(usdStr).includes('SALDO NETO') || String(bsStr).includes('SALDO NETO')) {
        pathStack.push(name.trim()); continue;
      }
      const usd = parseVal(usdStr); const bs = parseVal(bsStr);
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
      plan[cols[1].trim()] = `${cols[2].trim()}>${cols[3].trim()}>${cols[4].trim()}`;
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
    const n = parseFloat(cleanStr); return isNaN(n) ? 0 : n;
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
          balanceData.push({ month: months[c], path: path, name: accountName, usd: isUsd ? val : 0, bs: isUsd ? 0 : val });
        }
      }
    }
  }
  return balanceData;
};

const processActivosFijos = async (file) => {
  const XL = await loadSheetJS();
  const buffer = await file.arrayBuffer();
  const wb = XL.read(buffer, { type: 'array', cellDates: true });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XL.utils.sheet_to_json(ws, { header: 1, defval: null });
  let activos = [];
  if (rows.length < 2) return activos;
  
  let headerIdx = -1;
  let colMap = { cod: -1, cat: -1, desc: -1, fecha: -1, prov: -1, valor: -1, vidaUtil: -1 };
  
  for (let i = 0; i < Math.min(15, rows.length); i++) {
    const row = rows[i]; if (!row) continue;
    const cells = row.map(c => c ? String(c).toLowerCase().trim() : '');
    if (cells.some(c => c.includes('descrip') || c.includes('activo') || c.includes('categor'))) {
      headerIdx = i;
      cells.forEach((c, idx) => {
        if ((c.includes('cód') || c.includes('cod')) && colMap.cod === -1) colMap.cod = idx;
        else if (c.includes('categor') && colMap.cat === -1) colMap.cat = idx;
        else if ((c.includes('descrip') || c.includes('nombre')) && colMap.desc === -1) colMap.desc = idx;
        else if ((c.includes('fecha') || c.includes('adquisi')) && colMap.fecha === -1) colMap.fecha = idx;
        else if ((c.includes('prov') || c.includes('proveedor')) && colMap.prov === -1) colMap.prov = idx;
        else if ((c.includes('valor') || c.includes('costo') || c.includes('monto')) && colMap.valor === -1) colMap.valor = idx;
        else if ((c.includes('vida') || c.includes('meses') || c.includes('útil')) && colMap.vidaUtil === -1) colMap.vidaUtil = idx;
      });
      break;
    }
  }
  
  if (headerIdx === -1) { colMap = { cod:0, desc:1, fecha:2, prov:3, valor:4, vidaUtil:5, cat:6 }; headerIdx = 0; }
  
  for (let i = headerIdx + 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.every(c => !c)) continue;
    
    const rawDesc = colMap.desc >= 0 ? row[colMap.desc] : null;
    const rawCat = colMap.cat >= 0 ? row[colMap.cat] : 'OTROS';
    let valorStr = colMap.valor >= 0 && row[colMap.valor] ? String(row[colMap.valor]) : '0';
    valorStr = valorStr.replace(/[^\d,.-]/g, '').replace(',', '.');
    const valor = parseFloat(valorStr);
    
    if (isNaN(valor)) continue;
    
    let fecha = colMap.fecha >= 0 ? row[colMap.fecha] : new Date();
    if (typeof fecha === 'number') fecha = new Date((fecha - 25569) * 86400 * 1000);
    const vidaStr = colMap.vidaUtil >= 0 && row[colMap.vidaUtil] !== null ? String(row[colMap.vidaUtil]) : '60';
    let vidaUtilMeses = parseFloat(vidaStr.replace(/[^\d.]/g, '')) || 60;
    const esMejora = String(rawDesc || '').toUpperCase().includes('MEJORA') || String(rawCat || '').toUpperCase().includes('MEJORA');

    activos.push({
      codigo: colMap.cod >= 0 && row[colMap.cod] ? String(row[colMap.cod]).toUpperCase() : '-',
      categoria: String(rawCat).toUpperCase(),
      descripcion: String(rawDesc || rawCat).toUpperCase(),
      proveedor: colMap.prov >= 0 && row[colMap.prov] ? String(row[colMap.prov]).toUpperCase() : '—',
      fechaAdquisicion: (fecha instanceof Date && !isNaN(fecha)) ? fecha.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      valorAdquisicion: valor,
      vidaUtilMeses: esMejora ? 0 : vidaUtilMeses,
      esMejora: esMejora
    });
  }
  return activos;
};

// ============================================================================
// 2. COMPONENTE: ÁRBOL EXPANDIBLE
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
            {!isLeaf && <span className={`inline-flex items-center justify-center w-4 h-4 border rounded-sm text-[11px] font-bold transition-colors ${isOpen ? 'border-gray-500 text-gray-600 bg-gray-100' : 'border-gray-300 text-gray-400 bg-white'}`}>{isOpen ? '−' : '+'}</span>}
            <button onClick={(e) => { e.stopPropagation(); toggleHighlight(node.n); }} className="focus:outline-none transition-transform hover:scale-110"><Star size={16} fill={isHighlighted ? "#f97316" : "none"} color={isHighlighted ? "#f97316" : "#cbd5e1"} /></button>
            <span className="truncate">{node.n}</span>
          </td>
          <td className={`py-2.5 px-3 text-right font-mono text-[11px] font-bold ${isHighlighted ? 'text-orange-900' : 'text-black'}`}>{fmtCur(Math.abs(node.u))}</td>
          <td className={`py-2.5 px-3 text-right font-mono text-[11px] font-bold hidden sm:table-cell ${isHighlighted ? 'text-orange-900' : 'text-black'}`}>{fmtCur(Math.abs(node.b))}</td>
          <td className={`py-2.5 px-3 text-right font-mono text-[11px] font-bold ${isHighlighted ? 'text-orange-700' : 'text-gray-500'}`}>{pct}</td>
        </tr>
      </>
    );
  }
  return null;
};

// ============================================================================
// COMPONENTE MEMBRETE OFICIAL
// ============================================================================
const ReportHeader = ({ title, period }) => (
  <div className="text-center mb-10 text-black font-sans">
    <h1 className="text-xl font-bold uppercase">SERVICIOS JIRET G&B, C.A</h1>
    <p className="text-sm font-bold mt-1">J-412309374</p>
    <p className="text-base font-bold uppercase mt-4">{title}</p>
    <p className="text-sm font-bold uppercase mt-1">{period}</p>
    <p className="text-sm font-bold uppercase mt-4">EXPRESADO EN DOLARES AMERICANOS (USD)</p>
  </div>
);

// ============================================================================
// 3. VISTA: ESTADO DE RESULTADOS
// ============================================================================
function EstadoResultadoView({ onBack, dbData }) {
  const availableMonths = useMemo(() => [...new Set(dbData.map(d => d.month))].filter(m=>m!=='Sin Mes'), [dbData]);
  const [selectedMonth, setSelectedMonth] = useState('General'); 
  const [defaultOpen, setDefaultOpen] = useState(false);
  const [expandKey, setExpandKey] = useState(0);

  const [highlightedAccounts, setHighlightedAccounts] = useState(() => {
    try { const saved = localStorage.getItem('jiret_highlighted_accounts'); return saved ? new Set(JSON.parse(saved)) : new Set(); } catch (e) { return new Set(); }
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
    const resData = monthData.filter(item => {
      const p = item.path.toUpperCase();
      const n = item.name.toUpperCase();
      const isBalance = p.includes('ACTIVO') || p.includes('PASIVO') || (p.includes('PATRIMONIO') && !p.includes('RESULTADO')) || /^[123]/.test(n);
      return !isBalance;
    });
    
    const normKey = s => s.trim().replace(/\s+/g,' ').toUpperCase();
    resData.forEach(item => {
      let pathArray = item.path.split('>');
      let cur = root;
      
      let itemName = item.name.trim();
      const isVenta = itemName.toUpperCase().includes('VENTA') || itemName.toUpperCase().includes('INGRESO') || item.path.toUpperCase().includes('VENTA');
      if (isVenta) {
        itemName = "4.1.01.001 - INGRESOS GENERALES POR VENTA";
        pathArray = ["INGRESOS"]; // Forzar la carpeta superior también
      }

      pathArray.forEach(folderName => {
        const key = normKey(folderName);
        let folder = cur.find(n => normKey(n.n) === key);
        if (!folder) { folder = { n: folderName.trim(), c: [], u: 0, b: 0 }; cur.push(folder); }
        cur = folder.c;
      });

      const leafKey = normKey(itemName);
      let leaf = cur.find(n => normKey(n.n) === leafKey && n.isLeaf);
      if (!leaf) cur.push({ n: itemName, u: item.usd, b: item.bs, isLeaf: true });
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
    
    const sortTree = (nodes, level = 0) => {
      nodes.sort((a,b) => {
        if (level === 0) {
          const order = { "INGRESO": 1, "VENTA": 1, "COSTO": 2, "GASTO": 3, "EGRESO": 3 };
          const aVal = order[Object.keys(order).find(k => a.n.toUpperCase().includes(k))] || 99;
          const bVal = order[Object.keys(order).find(k => b.n.toUpperCase().includes(k))] || 99;
          if (aVal !== bVal) return aVal - bVal;
        }
        const aMatch = a.n.match(/^(\d[\d\.]*)/); const bMatch = b.n.match(/^(\d[\d\.]*)/);
        if(aMatch && bMatch) return aMatch[1].localeCompare(bMatch[1], undefined, {numeric: true});
        return a.n.localeCompare(b.n);
      });
      nodes.forEach(n => { if(n.c && n.c.length > 0) sortTree(n.c, level + 1); });
    };
    sortTree(root, 0);

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
    <div className="min-h-screen bg-white">
      <header className="bg-white border-b-2 border-black p-4 flex justify-between items-center sticky top-0 z-30 shadow-md">
        <button onClick={onBack} className="flex items-center gap-2 font-black text-xs text-black uppercase hover:text-orange-600 transition-colors"><ArrowLeft size={16}/> Volver al Panel</button>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-widest mr-1">Filtro:</span>
          <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="bg-white border border-gray-300 text-black text-xs rounded-md p-1.5 font-bold uppercase cursor-pointer outline-none focus:ring-2 focus:ring-orange-500">
            <option value="General">General</option>
            {availableMonths.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </header>
      <main className="p-8 max-w-6xl mx-auto pb-16">
        
        <ReportHeader 
          title="ESTADO DE RESULTADO" 
          period={selectedMonth === 'General' ? 'ACUMULADO' : `MES: ${selectedMonth}`}
        />

        <div className="bg-white border border-gray-200">
          <table className="w-full text-left border-collapse">
            <thead className="bg-black text-[10px] uppercase font-black text-white">
              <tr><th className="px-4 py-5 w-[55%]">Cuentas</th><th className="px-3 py-5 text-right text-orange-400">USD</th><th className="px-3 py-5 text-right hidden sm:table-cell">Bs.</th><th className="px-3 py-5 text-right">%</th></tr>
            </thead>
            <tbody key={expandKey}>
              {tree.map((node, i) => <ExpandableRow key={i} node={node} totalBaseUSD={baseVentas || 1} defaultOpen={defaultOpen} highlightedAccounts={highlightedAccounts} toggleHighlight={a => setHighlightedAccounts(p => {const s=new Set(p); if(s.has(a))s.delete(a); else s.add(a); return s;})} isBalance={false}/>)}
              <tr className="bg-black text-white font-black border-t-4 border-orange-500">
                <td className="px-5 py-7 text-sm uppercase tracking-[0.2em]">RESULTADO DEL EJERCICIO</td>
                <td className={`px-3 py-7 text-right text-lg font-mono ${totalUSD < 0 ? 'text-red-400' : 'text-white'}`}>{fmtR(totalUSD)}</td>
                <td className={`px-3 py-7 text-right text-lg font-mono hidden sm:table-cell ${totalUSD < 0 ? 'text-red-400' : 'text-white'}`}>{fmtR(totalUSD * 45)}</td>
                <td className="px-3 py-7 text-right text-lg font-mono">{(Math.abs(totalUSD)/(baseVentas||1)*100).toFixed(2)}%</td>
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
  // month1 = Anterior, month2 = Actual
  const [month1, setMonth1] = useState(availableMonths[1] || availableMonths[0] || ''); 
  const [month2, setMonth2] = useState(availableMonths[0] || '');
  
  const tree = useMemo(() => {
    const root = [];
    const filterFn = d => {
      const p = d.path.toUpperCase(); const n = d.name.toUpperCase();
      return !(p.includes('ACTIVO') || p.includes('PASIVO') || (p.includes('PATRIMONIO') && !p.includes('RESULTADO')) || /^[123]/.test(n));
    };

    const m1Data = dbData.filter(d => d.month === month1 && filterFn(d));
    const m2Data = dbData.filter(d => d.month === month2 && filterFn(d));
    
    const processItem = (item, isM1) => {
      let mainCategory = item.path.split('>')[0] ? item.path.split('>')[0].trim().toUpperCase() : 'OTROS';
      let accName = item.name.trim();

      const isVenta = accName.toUpperCase().includes('VENTA') || accName.toUpperCase().includes('INGRESO') || item.path.toUpperCase().includes('VENTA');
      if (isVenta) {
        mainCategory = "INGRESOS";
        accName = "4.1.01.001 - INGRESOS GENERALES POR VENTA";
      }

      let categoryNode = root.find(n => n.key === mainCategory);
      if (!categoryNode) { categoryNode = { key: mainCategory, n: mainCategory, c: [], m1_u: 0, m2_u: 0 }; root.push(categoryNode); }
      let accountNode = categoryNode.c.find(n => n.n === accName);
      if (!accountNode) { accountNode = { n: accName, m1_u: 0, m2_u: 0 }; categoryNode.c.push(accountNode); }
      if (isM1) accountNode.m1_u += item.usd; else accountNode.m2_u += item.usd;
    };
    
    m1Data.forEach(item => processItem(item, true)); 
    m2Data.forEach(item => processItem(item, false));
    
    root.forEach(cat => {
      let cat_m1 = 0, cat_m2 = 0;
      const isIngreso = cat.n.includes('INGRESO') || cat.n.includes('VENTA') || cat.key.startsWith('4');
      const multiplier = isIngreso ? -1 : 1;
      cat.c.forEach(acc => { acc.m1_u *= multiplier; acc.m2_u *= multiplier; cat_m1 += acc.m1_u; cat_m2 += acc.m2_u; });
      cat.m1_u = cat_m1; cat.m2_u = cat_m2;
    });
    
    root.sort((a, b) => {
      const order = { "INGRESO": 1, "VENTA": 1, "COSTO": 2, "GASTO": 3 };
      const aVal = order[Object.keys(order).find(k => a.n.toUpperCase().includes(k))] || 99;
      const bVal = order[Object.keys(order).find(k => b.n.toUpperCase().includes(k))] || 99;
      return aVal - bVal;
    });
    return root;
  }, [dbData, month1, month2]);

  let total_m1 = 0, total_m2 = 0;
  tree.forEach(cat => {
    const isIngreso = cat.n.includes('INGRESO') || cat.n.includes('VENTA') || cat.key.startsWith('4');
    if (isIngreso) { total_m1 += cat.m1_u; total_m2 += cat.m2_u; } else { total_m1 -= cat.m1_u; total_m2 -= cat.m2_u; }
  });
  
  const varAbsTotal = total_m2 - total_m1;
  const varPctTotal = total_m1 !== 0 ? (varAbsTotal / Math.abs(total_m1)) * 100 : (total_m2 !== 0 ? 100 : 0);
  const fmtR = (v) => new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white border-b-2 border-black p-4 flex justify-between items-center sticky top-0 z-30 shadow-md">
        <button onClick={onBack} className="flex items-center gap-2 font-black text-xs text-black uppercase hover:text-orange-600"><ArrowLeft size={16}/> Volver</button>
        <div className="flex gap-2 items-center">
          <span className="text-[10px] font-black uppercase text-gray-500">Mes Anterior:</span>
          <select value={month1} onChange={(e) => setMonth1(e.target.value)} className="text-xs p-1 border rounded font-bold uppercase outline-none focus:border-black">{availableMonths.map(m => <option key={m} value={m}>{m}</option>)}</select>
          <span className="font-bold text-xs pt-1 mx-2">VS</span>
          <span className="text-[10px] font-black uppercase text-gray-500">Mes Actual:</span>
          <select value={month2} onChange={(e) => setMonth2(e.target.value)} className="text-xs p-1 border rounded font-bold uppercase bg-gray-100 outline-none focus:border-black">{availableMonths.map(m => <option key={m} value={m}>{m}</option>)}</select>
        </div>
      </header>
      <main className="p-8 max-w-6xl mx-auto">
        
        <ReportHeader 
          title="ANÁLISIS COMPARATIVO" 
          period={`${month1} VS ${month2}`}
        />

        <div className="bg-white border border-gray-200">
          <table className="w-full text-left border-collapse">
            <thead className="bg-black text-white text-[10px] uppercase font-black border-b-2 border-orange-500">
              <tr><th className="p-4">Estructura</th><th className="p-4 text-right text-gray-300">{month1}</th><th className="p-4 text-right">{month2}</th><th className="p-4 text-right text-orange-400">Var. Absoluta</th><th className="p-4 text-right">Var. %</th></tr>
            </thead>
            <tbody>
              {tree.map((cat, i) => {
                const isIngreso = cat.n.includes('INGRESO') || cat.n.includes('VENTA') || cat.key.startsWith('4');
                const sortedAccounts = [...cat.c].sort((a, b) => String(a.n).localeCompare(String(b.n)));
                
                const catVarAbs = cat.m2_u - cat.m1_u; // Actual - Anterior
                const catVarPct = cat.m1_u !== 0 ? (catVarAbs / Math.abs(cat.m1_u)) * 100 : (cat.m2_u !== 0 ? 100 : 0);
                const isPosCat = catVarAbs > 0;
                const isNegCat = catVarAbs < 0;
                
                let CatColorClass = 'text-gray-500';
                let CatArrowIcon = isPosCat ? ArrowUpRight : (isNegCat ? ArrowDownRight : null);
                if (isPosCat || isNegCat) {
                  if (isIngreso) CatColorClass = isPosCat ? 'text-green-600' : 'text-red-500';
                  else CatColorClass = isPosCat ? 'text-red-500' : 'text-green-600';
                }

                return (
                  <React.Fragment key={i}>
                    <tr className="bg-black border-b border-gray-800"><td colSpan={5} className="py-2 px-4 font-black text-white text-xs uppercase tracking-[0.2em]">{cat.n}</td></tr>
                    {sortedAccounts.map((acc, j) => {
                      const vAbs = acc.m2_u - acc.m1_u; // Actual - Anterior
                      const vPct = acc.m1_u !== 0 ? (vAbs / Math.abs(acc.m1_u)) * 100 : (acc.m2_u !== 0 ? 100 : 0);
                      const isPos = vAbs > 0; const isNeg = vAbs < 0;
                      
                      let colorClass = 'text-gray-400';
                      let ArrowIcon = isPos ? ArrowUpRight : (isNeg ? ArrowDownRight : null);
                      if (isPos || isNeg) {
                        if (isIngreso) colorClass = isPos ? 'text-green-600' : 'text-red-500';
                        else colorClass = isPos ? 'text-red-500' : 'text-green-600';
                      }

                      return (
                        <tr key={j} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                          <td className="py-2 px-4 pl-8 text-[11px] font-bold uppercase border-l-4 border-gray-300">{acc.n}</td>
                          <td className="py-2 px-3 text-right font-mono text-[11px] text-gray-600">{fmtR(acc.m1_u)}</td>
                          <td className="py-2 px-3 text-right font-mono text-[11px] font-bold">{fmtR(acc.m2_u)}</td>
                          <td className={`py-2 px-3 text-right font-mono text-[11px] font-bold ${vAbs !== 0 ? 'text-orange-600' : ''}`}>{fmtR(vAbs)}</td>
                          <td className={`py-2 px-3 text-right font-mono text-[11px] font-black flex items-center justify-end gap-1 ${colorClass}`}>
                            {ArrowIcon && <ArrowIcon size={14}/>} {Math.abs(vPct).toFixed(2)}%
                          </td>
                        </tr>
                      );
                    })}
                    <tr className="bg-gray-100 text-black border-t border-gray-300">
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
                <td className="px-5 py-6 text-sm uppercase tracking-[0.2em]">RESULTADO NETO</td>
                <td className="px-3 py-6 text-right text-base font-mono">{fmtR(total_m1)}</td>
                <td className="px-3 py-6 text-right text-base font-mono">{fmtR(total_m2)}</td>
                <td className={`px-3 py-6 text-right text-lg font-mono text-orange-400`}>{fmtR(varAbsTotal)}</td>
                <td className={`px-3 py-6 text-right text-lg font-mono flex items-center justify-end gap-2 ${varAbsTotal > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {varAbsTotal > 0 ? <ArrowUpRight size={20}/> : <ArrowDownRight size={20}/>} {Math.abs(varPctTotal).toFixed(2)}%
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
// 5. VISTA: BALANCE GENERAL
// ============================================================================
function BalanceGeneralView({ onBack, dbData }) {
  const availableMonths = useMemo(() => {
    const balanceRecords = dbData.filter(item => item.path.toUpperCase().includes('ACTIVO') || item.path.toUpperCase().includes('PASIVO') || item.path.toUpperCase().includes('PATRIMONIO') || /^[123]/.test(item.name));
    return [...new Set(balanceRecords.map(d => d.month))];
  }, [dbData]);
  const [selectedMonth, setSelectedMonth] = useState(availableMonths[availableMonths.length - 1] || ''); 
  const [tasa, setTasa] = useState(45); 

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
    const sortTree = (nodes) => {
      nodes.sort((a, b) => {
        const order = {"ACTIVO": 1, "PASIVO": 2, "PATRIMONIO": 3};
        const aVal = order[Object.keys(order).find(k => a.n.toUpperCase().includes(k))] || 99;
        const bVal = order[Object.keys(order).find(k => b.n.toUpperCase().includes(k))] || 99;
        if (aVal !== bVal) return aVal - bVal;
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
    <div className="min-h-screen bg-white">
      <header className="bg-white border-b-2 border-black p-4 flex justify-between items-center sticky top-0 z-30 shadow-md">
        <button onClick={onBack} className="flex items-center gap-2 font-black text-xs uppercase hover:text-orange-600"><ArrowLeft size={16}/> Volver al Panel</button>
        <div className="flex gap-4 items-center">
          <span className="text-[10px] font-black uppercase text-gray-500">Corte:</span>
          <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="text-xs p-1.5 border border-gray-300 rounded font-bold uppercase outline-none focus:ring-1 focus:ring-orange-500">{availableMonths.map(m => <option key={m} value={m}>{m}</option>)}</select>
          <span className="text-[10px] font-black uppercase text-gray-500 ml-2">Tasa Bs/USD:</span>
          <input type="number" value={tasa} onChange={e => setTasa(parseFloat(e.target.value) || 1)} className="text-xs border border-gray-300 p-1.5 rounded w-20 font-bold outline-none focus:ring-1 focus:ring-orange-500" />
        </div>
      </header>
      <main className="p-8 max-w-6xl mx-auto pb-16">
        
        <ReportHeader 
          title="BALANCE GENERAL" 
          period={`AL MES DE ${selectedMonth}`}
        />

        <div className="bg-white border border-gray-200">
          <table className="w-full text-left border-collapse">
            <thead className="bg-black text-white text-[10px] uppercase font-black">
              <tr><th className="p-4 w-[55%]">Estructura</th><th className="p-4 text-right text-orange-400">USD</th><th className="p-4 text-right text-gray-300 hidden sm:table-cell">Equiv. Bs.</th><th className="p-4 text-right">%</th></tr>
            </thead>
            <tbody>
              {tree.map((node, i) => <ExpandableRow key={i} node={node} totalBaseUSD={totalActivos || 1} highlightedAccounts={new Set()} toggleHighlight={()=>{}} isBalance={true}/>)}
            </tbody>
            <tfoot>
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
            </tfoot>
          </table>
        </div>
      </main>
    </div>
  );
}

// ============================================================================
// 6. VISTA: INVERSIONES / ACTIVOS FIJOS
// ============================================================================
function InversionesView({ onBack, activosData }) {
  const [fechaCorte, setFechaCorte] = useState(new Date().toISOString().split('T')[0]);
  const [mesFiltro, setMesFiltro] = useState('Todos');
  const fmtCur = (v) => new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);
  
  const getMonthsDiff = (d1, d2) => {
    const date1 = new Date(d1); const date2 = new Date(d2);
    let months = (date2.getFullYear() - date1.getFullYear()) * 12 + (date2.getMonth() - date1.getMonth());
    return months <= 0 ? 0 : months;
  };

  const categories = useMemo(() => {
    const cats = {};
    const filtrados = activosData.filter(a => {
      if (mesFiltro === 'Todos') return true;
      const d = new Date(a.fechaAdquisicion + 'T00:00:00');
      return d.toLocaleString('es-ES', { month: 'long', year: 'numeric' }).toUpperCase() === mesFiltro;
    });

    filtrados.forEach(a => {
      if (!cats[a.categoria]) cats[a.categoria] = { items: [], totalCosto: 0, totalDep: 0, totalNeto: 0 };
      let depAcum = 0;
      if (!a.esMejora && a.vidaUtilMeses > 0) {
        const meses = getMonthsDiff(a.fechaAdquisicion, fechaCorte);
        depAcum = (a.valorAdquisicion / a.vidaUtilMeses) * meses;
        if (depAcum > a.valorAdquisicion) depAcum = a.valorAdquisicion;
      }
      const neto = a.valorAdquisicion - depAcum;
      cats[a.categoria].items.push({ ...a, depAcum, neto });
      cats[a.categoria].totalCosto += a.valorAdquisicion; cats[a.categoria].totalDep += depAcum; cats[a.categoria].totalNeto += neto;
    });
    return cats;
  }, [activosData, fechaCorte, mesFiltro]);

  const granTotalNeto = Object.values(categories).reduce((acc, c) => acc + c.totalNeto, 0);

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white border-b-2 border-black p-4 flex justify-between items-center sticky top-0 z-30 shadow-md">
        <button onClick={onBack} className="flex items-center gap-2 font-black text-xs uppercase hover:text-orange-500"><ArrowLeft size={16}/> Volver</button>
        <div className="flex gap-4 items-center">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Inversión:</span>
            <select value={mesFiltro} onChange={e => setMesFiltro(e.target.value)} className="bg-white border border-gray-300 text-black text-xs rounded p-1.5 font-bold outline-none focus:ring-1 focus:ring-orange-500">
              <option value="Todos">HISTÓRICO</option>
              {[...new Set(activosData.map(a => new Date(a.fechaAdquisicion + 'T00:00:00').toLocaleString('es-ES', { month: 'long', year: 'numeric' }).toUpperCase()))].map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2 border-l-2 border-gray-200 pl-4">
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Corte Depreciación:</span>
            <input type="date" value={fechaCorte} onChange={e => setFechaCorte(e.target.value)} className="bg-black text-white border border-gray-800 text-xs rounded p-1.5 font-bold outline-none focus:ring-1 focus:ring-orange-500" />
          </div>
        </div>
      </header>

      <main className="p-8 max-w-[1200px] mx-auto pb-24">
        
        <ReportHeader 
          title="AUXILIAR DE ACTIVOS FIJOS E INVERSIONES" 
          period={mesFiltro === 'Todos' ? 'HISTÓRICO GENERAL' : `MES: ${mesFiltro}`}
        />

        <div className="space-y-12 mt-8">
          {Object.keys(categories).sort().map(catName => (
            <div key={catName} className="bg-white border border-gray-200">
              <div className="flex justify-between items-end border-b-4 border-black bg-gray-50 p-4">
                <h2 className="text-xl font-black uppercase tracking-tight text-black">{catName}</h2>
                <div className="text-right">
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Neto de Categoría</p>
                  <p className="text-xl font-mono font-black text-black">USD {fmtCur(categories[catName].totalNeto)}</p>
                </div>
              </div>

              <table className="w-full text-left text-[11px] border-collapse">
                <thead className="bg-black font-black uppercase text-white border-b-2 border-orange-500">
                  <tr><th className="p-3">Código</th><th className="p-3">Descripción</th><th className="p-3 text-center">Fecha</th><th className="p-3">Proveedor</th><th className="p-3 text-right">Costo USD</th><th className="p-3 text-right">Dep. Acum.</th><th className="p-3 text-right">Valor Neto</th><th className="p-3 text-center">Vida Útil</th></tr>
                </thead>
                <tbody>
                  {categories[catName].items.map((a, i) => (
                    <tr key={i} className="border-b border-gray-100 hover:bg-orange-50 transition-colors">
                      <td className="p-3 font-mono text-gray-400 font-bold">{a.codigo}</td>
                      <td className="p-3 font-black text-black">{a.descripcion} {a.esMejora && <span className="ml-2 bg-orange-100 text-orange-800 text-[8px] px-1.5 py-0.5 rounded font-black border border-orange-200">MEJORA</span>}</td>
                      <td className="p-3 text-center font-mono text-gray-600">{a.fechaAdquisicion.split('-').reverse().join('/')}</td>
                      <td className="p-3 text-gray-500 font-bold truncate max-w-[150px]">{a.proveedor}</td>
                      <td className="p-3 text-right font-mono font-black text-black">{fmtCur(a.valorAdquisicion)}</td>
                      <td className="p-3 text-right font-mono font-bold text-red-500">({fmtCur(a.depAcum)})</td>
                      <td className="p-3 text-right font-mono font-black text-green-600">{fmtCur(a.neto)}</td>
                      <td className="p-3 text-center font-bold text-gray-500">{a.esMejora ? 'N/A' : `${a.vidaUtilMeses} meses`}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-100 font-black text-[11px] text-black border-t-2 border-black">
                    <td colSpan={4} className="py-4 px-3 uppercase tracking-widest pl-6">Total {catName}</td>
                    <td className="py-4 px-3 text-right font-mono text-[12px]">{fmtCur(categories[catName].totalCosto)}</td>
                    <td className="py-4 px-3 text-right font-mono text-red-600 text-[12px]">({fmtCur(categories[catName].totalDep)})</td>
                    <td className="py-4 px-3 text-right font-mono text-black text-[12px]">{fmtCur(categories[catName].totalNeto)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ))}
        </div>

        <div className="mt-12 bg-black p-8 rounded-2xl flex justify-between items-center shadow-2xl border-l-8 border-orange-500">
          <div>
            <h3 className="text-orange-500 font-black text-[10px] uppercase tracking-[0.3em]">Patrimonio en Inversiones</h3>
            <p className="text-white font-black text-2xl uppercase mt-1 tracking-tighter">Total Activos Fijos Netos</p>
          </div>
          <div className="text-right">
            <p className="text-white text-4xl font-mono font-black tracking-tighter">USD {fmtCur(granTotalNeto)}</p>
          </div>
        </div>
      </main>
    </div>
  );
}

// ============================================================================
// 7. COMPONENTE PRINCIPAL / DASHBOARD REDISEÑADO
// ============================================================================
export default function ReportesFinancierosApp() {
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
    } catch (error) { alert("Error al procesar TXT/Excel."); }
  };

  const handleUploadPlan = async (e) => {
    if (!e.target.files.length) return;
    try {
      const plan = await processPlanCuentas(e.target.files[0]);
      setPlanCuentas(plan);
      alert("✅ Plan de cuentas cargado.");
    } catch (error) { alert("Error al procesar el Plan de Cuentas."); }
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
      const nuevos = await processActivosFijos(e.target.files[0]);
      setActivosData(nuevos);
      alert(`✅ Activos Fijos cargados (${nuevos.length} registros).`);
    } catch (error) { alert("Error al procesar archivo de Activos Fijos."); }
  };

  const loadedMonths = [...new Set(dbData.map(d => d.month))].filter(m => m !== 'Sin Mes');
  const hasPlan = Object.keys(planCuentas).length > 0;
  const hasActivos = activosData.length > 0;

  if (view === 'resultado')     return <EstadoResultadoView   onBack={() => setView('dashboard')} dbData={dbData} />;
  if (view === 'comparativo')   return <AnalisisComparativoView onBack={() => setView('dashboard')} dbData={dbData} />;
  if (view === 'balance')       return <BalanceGeneralView    onBack={() => setView('dashboard')} dbData={dbData} />;
  if (view === 'inversiones')   return <InversionesView       onBack={() => setView('dashboard')} activosData={activosData} />;

  return (
    <div className="min-h-screen bg-white">
      <header className="px-8 py-5 bg-black border-b-4 border-orange-500 flex justify-between items-center shadow-xl">
        <h1 className="text-white font-black text-2xl tracking-[0.15em] uppercase">JIRET G&B <span className="text-orange-500">Finance</span></h1>
        <button onClick={() => setView('config')} className="bg-white hover:bg-gray-100 text-black border border-gray-300 px-4 py-2 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center gap-2">
           <Database size={14} className="text-orange-500"/> Config.
        </button>
      </header>
      <main className="max-w-5xl mx-auto px-6 py-20">
        <div className="text-center mb-10">
          <h2 className="text-black font-black text-3xl tracking-[0.2em] uppercase mb-2">Panel Principal</h2>
          <div className="w-16 h-1 bg-orange-500 mx-auto rounded-full"/>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <button onClick={() => dbData.length > 0 ? setView('resultado') : alert('Carga datos en Configuración primero.')} className="bg-white border-2 border-orange-500 p-10 rounded-2xl text-left hover:shadow-2xl transition-all group">
            <LineChart className="text-orange-500 mb-4 group-hover:scale-110 transition-transform" size={48} />
            <h3 className="font-black text-2xl uppercase">Resultados</h3>
            <p className="text-gray-500 text-xs font-bold mt-2 tracking-widest">INGRESOS {'>'} COSTOS {'>'} GASTOS</p>
          </button>
          <button onClick={() => dbData.length > 0 ? setView('balance') : alert('Carga datos en Configuración primero.')} className="bg-black p-10 rounded-2xl text-left hover:shadow-2xl transition-all group">
            <Scale className="text-orange-500 mb-4 group-hover:scale-110 transition-transform" size={48} />
            <h3 className="font-black text-2xl text-white uppercase">Balance General</h3>
            <p className="text-gray-400 text-xs font-bold mt-2 tracking-widest">SITUACIÓN FINANCIERA</p>
          </button>
          <button onClick={() => dbData.length >= 2 ? setView('comparativo') : alert('Necesitas al menos 2 meses cargados.')} className="bg-black p-10 rounded-2xl text-left hover:shadow-2xl transition-all group">
            <GitCompare className="text-orange-500 mb-4 group-hover:scale-110 transition-transform" size={48} />
            <h3 className="font-black text-2xl text-white uppercase">Variaciones</h3>
            <p className="text-gray-400 text-xs font-bold mt-2 tracking-widest">MES VS MES</p>
          </button>
          <button onClick={() => hasActivos ? setView('inversiones') : alert('Carga tus Activos Fijos en Configuración.')} className="bg-white border-2 border-orange-500 p-10 rounded-2xl text-left hover:shadow-2xl transition-all group">
            <Landmark className="text-orange-500 mb-4 group-hover:scale-110 transition-transform" size={48} />
            <h3 className="font-black text-2xl uppercase">Inversiones</h3>
            <p className="text-gray-500 text-xs font-bold mt-2 tracking-widest">ACTIVOS FIJOS Y MEJORAS</p>
          </button>
        </div>
      </main>

      {view === 'config' && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-6 z-50">
          <div className="bg-white p-10 rounded-3xl w-full max-w-lg shadow-2xl border-t-8 border-orange-500">
            <h2 className="text-3xl font-black text-black uppercase mb-6">Panel de Carga</h2>
            <div className="space-y-4">
              <label className="block p-4 bg-gray-100 rounded-xl cursor-pointer hover:bg-orange-100 border border-gray-200">
                <p className="font-black text-[10px] uppercase text-gray-500">1. Plan de Cuentas (.txt)</p>
                <input type="file" className="mt-2 text-xs" onChange={handleUploadPlan} />
              </label>
              <label className="block p-4 bg-gray-100 rounded-xl cursor-pointer hover:bg-orange-100 border border-gray-200">
                <p className="font-black text-[10px] uppercase text-gray-500">2. Saldos Iniciales Balance (.txt)</p>
                <input type="file" className="mt-2 text-xs" onChange={handleUploadSaldos} />
              </label>
              <label className="block p-4 bg-gray-100 rounded-xl cursor-pointer hover:bg-orange-100 border border-gray-200">
                <p className="font-black text-[10px] uppercase text-gray-500">3. Estados de Resultado (.xlsx)</p>
                <input type="file" multiple className="mt-2 text-xs" onChange={handleUploadResultados} />
              </label>
              <label className="block p-4 bg-gray-100 rounded-xl cursor-pointer hover:bg-orange-100 border border-gray-200">
                <p className="font-black text-[10px] uppercase text-gray-500">4. Auxiliar Activos Fijos (.xlsx)</p>
                <input type="file" className="mt-2 text-xs" onChange={handleUploadActivos} />
              </label>
            </div>
            <div className="mt-6 flex justify-between">
               <button onClick={() => { if(window.confirm("¿Limpiar todo?")) {setDbData([]); setActivosData([]); }}} className="text-red-500 font-black text-[10px] uppercase underline hover:text-red-700">Borrar Datos</button>
               <button onClick={() => setView('dashboard')} className="bg-black hover:bg-gray-800 text-white px-8 py-3 rounded-xl font-black uppercase text-xs transition-colors">Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

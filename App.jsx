import React, { useState, useMemo, useEffect } from 'react';
import { 
  ArrowLeft, Upload, CheckCircle, Scale, 
  LineChart, CalendarDays, AlertTriangle, ChevronRight, ChevronDown, Star, PlusCircle, Trash2, ArrowUpRight, ArrowDownRight, GitCompare, Landmark, FileSpreadsheet,
  FileText, Users, Briefcase, Search, BookOpen, Database, FileOutput, Printer, Download, Activity
} from 'lucide-react';

// ============================================================================
// 0. ESTILOS DE IMPRESIÓN (PDF CENTRADO Y ESCALADO)
// ============================================================================
const PrintStyles = () => (
  <style>{`
    @media print {
      @page { size: letter; margin: 10mm 10mm; }
      body { background-color: white !important; -webkit-print-color-adjust: exact; }
      .no-print { display: none !important; }
      .print-area { box-shadow: none !important; border: none !important; padding: 0 !important; margin: 0 auto !important; width: 100% !important; max-width: 100% !important; }
      table { page-break-inside: auto; width: 100% !important; table-layout: fixed; border-collapse: collapse; }
      tr { page-break-inside: avoid; page-break-after: auto; }
      thead { display: table-header-group; }
      th, td { word-wrap: break-word; overflow: hidden; }
      .print-only { display: block !important; }
    }
  `}</style>
);

const HeaderMembretado = ({ isExport = false }) => (
  <div className={`${isExport ? 'flex' : 'hidden print:flex'} w-full justify-between items-end border-b-[3px] border-orange-500 pb-3 mb-6 pt-4 px-2 bg-white`}>
    <div>
      <p className="text-slate-400 text-lg mb-1 leading-none">Supply</p>
      <h1 className="text-5xl font-black leading-none tracking-tight text-black">G<span className="text-orange-500">&</span>B</h1>
    </div>
    <div className="text-right">
      <h2 className="text-lg font-black uppercase text-black tracking-widest">SERVICIOS JIRET G&B, C.A.</h2>
      <p className="text-xs font-bold text-slate-700">RIF: J-412309374</p>
      <p className="text-[10px] text-slate-500 mt-1">AV CIRCUNVALACION NRO 02 C.C EL DIVIDIVI LOCAL G-9 NIVEL PB</p>
      <p className="text-[10px] text-slate-500">SECTOR EL TREBOL MARACAIBO-ZULIA</p>
      <p className="text-[10px] text-slate-500">Tel: 0414-693.03.42</p>
    </div>
  </div>
);

// ============================================================================
// 1. LÓGICA DE EXPORTACIÓN EXCEL PROFESIONAL
// ============================================================================
const handleExportExcel = (tableId, fileName, reportTitle) => {
  if (!window.XLSX) { alert("Cargando librería..."); return; }
  const table = document.getElementById(tableId);
  const ws = window.XLSX.utils.table_to_sheet(table);

  const header = [
    ["SERVICIOS JIRET G&B, C.A."],
    ["RIF: J-412309374"],
    [reportTitle ? reportTitle.toUpperCase() : fileName.toUpperCase()],
    [`Fecha de reporte: ${new Date().toLocaleDateString()}`],
    [] 
  ];

  window.XLSX.utils.sheet_add_aoa(ws, header, { origin: "A1" });
  const colWidths = [{ wch: 50 }, { wch: 18 }, { wch: 18 }, { wch: 12 }];
  ws['!cols'] = colWidths;

  const wb = window.XLSX.utils.book_new();
  window.XLSX.utils.book_append_sheet(wb, ws, "Reporte");
  window.XLSX.writeFile(wb, `${fileName}.xlsx`);
};

// ============================================================================
// 2. LÓGICA DE PROCESAMIENTO DE ARCHIVOS (ORDEN CRONOLÓGICO)
// ============================================================================
const loadSheetJS = () => new Promise((resolve) => {
  if (window.XLSX) { resolve(window.XLSX); return; }
  const s = document.createElement('script');
  s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
  s.onload = () => resolve(window.XLSX);
  document.head.appendChild(s);
});

const monthOrder = { "Enero": 1, "Febrero": 2, "Marzo": 3, "Abril": 4, "Mayo": 5, "Junio": 6, "Julio": 7, "Agosto": 8, "Septiembre": 9, "Octubre": 10, "Noviembre": 11, "Diciembre": 12 };

const processFiles = async (files) => {
  let allParsedData = [];
  const detectMonth = (name) => {
    const m = name.match(/(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)/i);
    return m ? m[0].charAt(0).toUpperCase() + m[0].slice(1).toLowerCase() : 'Sin Mes';
  };
  const detectYear = (name) => {
    const y = name.match(/20\d{2}/);
    return y ? y[0] : new Date().getFullYear().toString();
  };

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const ext = file.name.split('.').pop().toLowerCase();
    const month = detectMonth(file.name);
    const year = detectYear(file.name);
    let dataRows = [];

    const XL = await loadSheetJS();
    const buffer = await file.arrayBuffer();
    const wb = XL.read(buffer, { type: 'array' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    dataRows = XL.utils.sheet_to_json(ws, { header: 1, defval: null });

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
        allParsedData.push({ month, year, path: pathStack.map(p => p.trim()).join('>'), name: name.trim(), usd: usd, bs: bs || 0 });
      } else {
        pathStack.push(name.trim());
      }
    }
  }

  return allParsedData.sort((a, b) => {
    if (a.year !== b.year) return parseInt(a.year) - parseInt(b.year);
    return monthOrder[a.month] - monthOrder[b.month];
  });
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

  const detectYear = (name) => {
    const y = name.match(/20\d{2}/);
    return y ? y[0] : new Date().getFullYear().toString();
  };
  const fileYear = detectYear(file.name);

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
          balanceData.push({ month: months[c], year: fileYear, path: path, name: accountName, usd: isUsd ? val : 0, bs: isUsd ? 0 : val });
        }
      }
    }
  }
  return balanceData;
};

// ============================================================================
// 1b. PROCESADOR INTELIGENTE DE AUXILIARES (DINÁMICO DESDE EXCEL)
// ============================================================================
const processAuxFile = async (files) => {
  const result = {}; 

  const parseVal = (v) => {
    if (v === null || v === undefined || v === '') return 0;
    if (typeof v === 'number') return v;
    let s = String(v).replace(/\$|Bs\.|USD/ig, '').trim();
    if (s.includes(',') && s.includes('.')) s = s.replace(/\./g, '').replace(/,/g, '.');
    else if (s.includes(',') && !s.includes('.')) s = s.replace(/,/g, '.');
    const n = parseFloat(s);
    return isNaN(n) ? 0 : n;
  };

  for (const file of Array.from(files)) {
    const XL = await loadSheetJS();
    const buffer = await file.arrayBuffer();
    const wb = XL.read(buffer, { type: 'array' });
    
    for (const sheetName of wb.SheetNames) {
      const ws = wb.Sheets[sheetName];
      const rows = XL.utils.sheet_to_json(ws, { defval: null });
      
      for (const rawRow of rows) {
        const row = {};
        for (const key in rawRow) {
          if (rawRow[key] !== null) row[key.trim().toLowerCase()] = rawRow[key];
        }

        const cc = row['cuenta contable'];
        if (!cc) continue; 
        
        const match = cc.match(/^(\d[\d\.]+)/);
        if (!match) continue;
        
        const code = match[1]; 
        const label = cc.replace(code, '').replace(/^[- ]+/, '').trim(); 
        
        if (!result[code]) {
          result[code] = { 
            label, 
            type: code.startsWith('1') ? 'cxc' : 'cxp', 
            records: [] 
          };
        }
        
        result[code].records.push({
          cod: row['código'] || row['codigo'] || '-',
          nombre: row['descripción'] || row['descripcion'] || '-',
          operacion: row['operación'] || row['operacion'] || '-',
          emision: row['emisión'] || row['emision'] || '-',
          vence: row['vencimiento'] || '-',
          dias: row['días'] || row['dias'] || '-',
          doc: row['no. documento'] || row['documento'] || '-',
          descripcion: row['descripción de operación'] || row['descripcion de operacion'] || '-',
          monto: parseVal(row['monto']),
          cuentaContable: cc
        });
      }
    }
  }
  return result;
};
// ============================================================================
// 3. COMPONENTE: ÁRBOL EXPANDIBLE (RESPETA APERTURA Y NO UNIFICA)
// ============================================================================
const ExpandableRow = ({ node, level = 0, totalBaseUSD, defaultOpen = false, highlightedAccounts, toggleHighlight, onShowReport, isBalance = false, rootColorOverride = null }) => {
  const isAccountNode = /^\d\./.test(node.n) || (!node.c || node.c.length === 0);
  const isLeaf = !node.c || node.c.length === 0;
  
  const [isOpen, setIsOpen] = useState(defaultOpen);
  useEffect(() => { setIsOpen(defaultOpen); }, [defaultOpen]);

  const accountCodeMatch = node.n.match(/^(\d[\d\.]+)/);
  const accountCode = accountCodeMatch ? accountCodeMatch[1] : null;
  const hasMapping = isBalance && accountCode;

  const fmtCur = (v) => new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);
  const pct = totalBaseUSD && node.u !== 0 ? `${((Math.abs(node.u) / Math.abs(totalBaseUSD)) * 100).toFixed(2)}%` : '';
  const indent = { paddingLeft: `${level * 18 + 10}px` };

  if (!node) return null;

  if (!isLeaf && !isAccountNode) {
    const isRoot = level === 0;
    let rootColor = rootColorOverride || 'text-slate-800'; 
    let borderColor = rootColorOverride ? rootColorOverride.replace('text-', 'border-') : 'border-slate-800';
    
    if (isBalance && !rootColorOverride) {
      if (node.n.includes('ACTIVO')) { rootColor = 'text-blue-600'; borderColor = 'border-blue-600'; }
      else if (node.n.includes('PASIVO')) { rootColor = 'text-red-600'; borderColor = 'border-red-600'; }
      else if (node.n.includes('PATRIMONIO')) { rootColor = 'text-purple-600'; borderColor = 'border-purple-600'; }
    }

    return (
      <>
        <tr className={isRoot ? 'bg-slate-50 print:bg-white print:border-b print:border-slate-200' : 'bg-white border-b border-slate-100 print:bg-white'}>
          <td style={indent} className={isRoot ? `py-3 px-3 ${rootColor} font-black text-xs uppercase tracking-[0.1em] print:text-black` : 'py-2 px-3 font-black text-[11px] text-slate-700 uppercase print:text-black'}>{node.n}</td>
          <td colSpan={3} />
        </tr>
        
        {isOpen && node.c && node.c.map((child, i) => (
          <ExpandableRow key={i} node={child} level={level + 1} totalBaseUSD={totalBaseUSD} defaultOpen={defaultOpen} highlightedAccounts={highlightedAccounts} toggleHighlight={toggleHighlight} onShowReport={onShowReport} isBalance={isBalance} rootColorOverride={rootColorOverride}/>
        ))}

        {isOpen && (
          <tr className={`${isRoot ? `bg-slate-100 print:bg-slate-50 text-slate-800 print:text-black border-t-2 ${borderColor} print:border-slate-300` : 'bg-slate-50 text-slate-800 border-t border-slate-200 print:bg-slate-50 print:text-black'} shadow-sm print:shadow-none`}>
            <td style={{ paddingLeft: level * 18 + 28 }} className="py-2.5 px-3 font-black text-[10px] uppercase tracking-wider print:text-black">TOTAL {node.n}</td>
            <td className={`py-2.5 px-3 text-right font-mono text-[11px] font-black ${isRoot ? rootColor : 'text-slate-900'} print:text-black`}>{fmtCur(Math.abs(node.u))}</td>
            <td className={`py-2.5 px-3 text-right font-mono text-[11px] font-black hidden sm:table-cell ${isRoot ? rootColor : 'text-slate-900'} print:text-black`}>{fmtCur(Math.abs(node.b))}</td>
            <td className={`py-2.5 px-3 text-right font-mono text-[11px] font-black ${isRoot ? rootColor : 'text-slate-900'} print:text-black`}>{pct}</td>
          </tr>
        )}
        
        {!isOpen && isRoot && (
           <tr className={`bg-slate-100 print:bg-slate-50 text-slate-800 print:text-black border-t-2 ${borderColor} print:border-slate-300 shadow-sm print:shadow-none cursor-pointer hover:bg-slate-200`} onClick={() => setIsOpen(true)}>
             <td style={{ paddingLeft: level * 18 + 10 }} className="py-2.5 px-3 font-black text-xs uppercase tracking-widest print:text-black flex items-center gap-2">
               <span className="no-print inline-flex items-center justify-center w-4 h-4 border rounded-sm text-[11px] leading-none bg-white text-slate-600 border-slate-300">+</span>
               {node.n}
             </td>
             <td className={`py-2.5 px-3 text-right font-mono text-[11px] font-black ${rootColor} print:text-black`}>{fmtCur(Math.abs(node.u))}</td>
             <td className={`py-2.5 px-3 text-right font-mono text-[11px] font-black hidden sm:table-cell ${rootColor} print:text-black`}>{fmtCur(Math.abs(node.b))}</td>
             <td className={`py-2.5 px-3 text-right font-mono text-[11px] font-black ${rootColor} print:text-black`}>{pct}</td>
           </tr>
        )}
      </>
    );
  }

  if (isLeaf || isAccountNode) {
    const isHighlighted = highlightedAccounts?.has(node.n);
    return (
      <>
        <tr onClick={() => !isLeaf && setIsOpen(!isOpen)} className={`border-b border-slate-100 cursor-pointer transition-colors ${isHighlighted ? 'bg-amber-50 hover:bg-amber-100 border-l-4 border-amber-500 print:bg-transparent print:border-l-0' : 'bg-white hover:bg-slate-50 print:bg-transparent print:border-l-0'}`}>
          <td style={indent} className="py-2.5 px-3 font-bold text-[11px] text-slate-700 uppercase select-none flex items-center flex-wrap gap-2 print:pl-6 print:text-black">
            {!isLeaf && <span className={`no-print inline-flex items-center justify-center w-4 h-4 border rounded-sm text-[11px] leading-none transition-colors ${isOpen ? 'border-slate-400 text-slate-600 bg-slate-100' : 'border-slate-300 text-slate-400 bg-white'}`}>{isOpen ? '−' : '+'}</span>}
            <button onClick={(e) => { e.stopPropagation(); toggleHighlight(node.n); }} className="no-print focus:outline-none transition-transform hover:scale-110"><Star size={16} fill={isHighlighted ? "#f59e0b" : "none"} color={isHighlighted ? "#f59e0b" : "#cbd5e1"} /></button>
            <span className="truncate max-w-[280px]">{node.n}</span>
            {hasMapping && (
              <button onClick={(e) => { e.stopPropagation(); onShowReport(accountCode); }} className="no-print ml-2 px-2 py-0.5 bg-slate-800 text-white rounded text-[9px] font-black tracking-widest hover:bg-orange-500 transition-colors flex items-center gap-1">
                <Search size={10}/> AUX
              </button>
            )}
          </td>
          <td className={`py-2.5 px-3 text-right font-mono text-[11px] font-bold ${isHighlighted ? 'text-amber-900' : 'text-slate-700'} print:text-black`}>{fmtCur(Math.abs(node.u))}</td>
          <td className={`py-2.5 px-3 text-right font-mono text-[11px] font-bold hidden sm:table-cell ${isHighlighted ? 'text-amber-900' : 'text-slate-700'} print:text-black`}>{fmtCur(Math.abs(node.b))}</td>
          <td className={`py-2.5 px-3 text-right font-mono text-[11px] font-bold ${isHighlighted ? 'text-amber-700' : 'text-slate-400'} print:text-black`}>{pct}</td>
        </tr>
        {isOpen && node.c && node.c.map((child, i) => (
          <ExpandableRow key={i} node={child} level={level + 1} totalBaseUSD={totalBaseUSD} defaultOpen={defaultOpen} highlightedAccounts={highlightedAccounts} toggleHighlight={toggleHighlight} onShowReport={onShowReport} isBalance={isBalance} rootColorOverride={rootColorOverride}/>
        ))}
      </>
    );
  }
  return null;
};

// ============================================================================
// 4. VISTA: SUB-REPORTE DETALLADO (DINÁMICO POR CUENTA)
// ============================================================================
function AuxiliarReportView({ accountCode, onBack, auxDataConfig }) {
  const dataGroup = auxDataConfig[accountCode] || { label: 'Sin cargar en el Excel', type: accountCode.startsWith('1') ? 'cxc' : 'cxp', records: [] };
  const filteredData = dataGroup.records;
  
  const total = filteredData.reduce((acc, curr) => acc + curr.monto, 0);
  const fmtCur = (v) => new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);

  return (
    <div className="animate-in fade-in duration-300 print-area bg-white p-4">
      <PrintStyles />
      <button onClick={onBack} className="no-print flex items-center gap-2 text-slate-500 hover:text-slate-800 font-black text-xs uppercase mb-4 transition-colors"><ArrowLeft size={16}/> Volver al Balance</button>
      <HeaderMembretado isExport={true} />
      <div className="flex items-center justify-between mb-6 bg-white p-6 rounded-2xl shadow-sm print:shadow-none border border-slate-100 print:border-none print:p-0">
        <div>
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
            {dataGroup.type === 'cxc' ? <Users className="text-blue-500 no-print"/> : <Briefcase className="text-red-500 no-print"/>}
            Auxiliar Detallado
          </h2>
          <p className="text-xs font-bold text-slate-400 print:text-black uppercase mt-1">
            Cuenta: {accountCode} - {dataGroup.label}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black uppercase text-slate-400 print:text-black tracking-widest">Saldo en Cuenta</p>
          <p className={`text-2xl font-mono font-black ${dataGroup.type === 'cxc' ? 'text-blue-600 print:text-black' : 'text-red-600 print:text-black'}`}>USD {fmtCur(total)}</p>
        </div>
      </div>
      <div className="bg-white rounded-2xl shadow-xl print:shadow-none overflow-hidden border border-slate-200 print:border-none">
        <div className="overflow-x-auto">
        <table id={`table-auxiliar-${accountCode}`} className="w-full text-left border-collapse" style={{minWidth:'900px'}}>
          <thead className="bg-slate-800 print:bg-slate-200 text-[9px] uppercase font-black text-slate-300 print:text-black border-b border-slate-300">
            <tr>
              <th className="px-3 py-4">Código</th>
              <th className="px-3 py-4">Descripción</th>
              <th className="px-3 py-4">Operación</th>
              <th className="px-3 py-4">Emisión</th>
              <th className="px-3 py-4">Vencimiento</th>
              <th className="px-3 py-4 text-right">Días</th>
              <th className="px-3 py-4">No. Documento</th>
              <th className="px-3 py-4 text-right">Monto USD</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-8 text-slate-400 font-bold">Sin transacciones registradas en este auxiliar.</td></tr>
            ) : (
              filteredData.map((item, i) => (
                <tr key={i} className="border-b border-slate-100 hover:bg-slate-50 transition-colors print:border-slate-300">
                  <td className="px-3 py-2.5 text-[11px] font-bold text-slate-500 print:text-slate-800 whitespace-nowrap">{item.cod}</td>
                  <td className="px-3 py-2.5 text-[11px] font-black text-slate-800 print:text-black max-w-[160px] truncate">{item.nombre}</td>
                  <td className="px-3 py-2.5 text-[11px] text-slate-600 print:text-slate-900 whitespace-nowrap">{item.operacion || '-'}</td>
                  <td className="px-3 py-2.5 text-[11px] text-slate-500 print:text-slate-900 whitespace-nowrap font-mono">{item.emision}</td>
                  <td className="px-3 py-2.5 text-[11px] text-slate-500 print:text-slate-900 whitespace-nowrap font-mono">{item.vence}</td>
                  <td className={`px-3 py-2.5 text-right text-[11px] font-mono whitespace-nowrap ${Number(item.dias) < 0 ? 'text-red-500 font-bold print:text-black' : 'text-slate-500 print:text-black'}`}>{item.dias ?? '-'}</td>
                  <td className="px-3 py-2.5 text-[11px] text-slate-600 print:text-slate-900 font-mono whitespace-nowrap">{item.doc}</td>
                  <td className={`px-3 py-2.5 text-right text-[12px] font-mono font-bold whitespace-nowrap ${item.monto < 0 ? 'text-red-500 print:text-black' : 'text-slate-900 print:text-black'}`}>{fmtCur(item.monto)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>
      <div className="no-print mt-6 flex justify-end gap-3">
         <button onClick={() => window.print()} className="px-4 py-2 bg-slate-800 text-white rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-slate-700 shadow-md"><Printer size={14}/> Imprimir PDF</button>
         <button onClick={() => handleExportExcel(`table-auxiliar-${accountCode}`, `Auxiliar_${accountCode}`, `Auxiliar - ${dataGroup.label}`)} className="px-4 py-2 bg-emerald-700 text-white rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-600 shadow-md"><Download size={14}/> Exportar Excel</button>
      </div>
    </div>
  );
}
// ============================================================================
// 5. VISTA: ESTADO DE RESULTADOS (DISEÑO LIMPIO Y LÓGICA DE AGRUPACIÓN)
// ============================================================================
function EstadoResultadoView({ onBack, dbData }) {
  const availableYears = useMemo(() => [...new Set(dbData.map(d => d.year))].filter(Boolean).sort(), [dbData]);
  const [selectedYear, setSelectedYear] = useState(availableYears[availableYears.length - 1] || new Date().getFullYear().toString());
  const availableMonths = useMemo(() => [...new Set(dbData.filter(d => d.year === selectedYear).map(d => d.month))].filter(m=>m!=='Sin Mes'), [dbData, selectedYear]);
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

  const { treeIngresos, treeCostos, treeGastos, totIng, totCos, totGas, utBruta, utNeta } = useMemo(() => {
    const yearData = dbData.filter(d => d.year === selectedYear);
    const monthData = selectedMonth === 'General' ? yearData : yearData.filter(d => d.month === selectedMonth);
    
    let resData = monthData.filter(item =>
      !item.path.toUpperCase().includes('ACTIVO') &&
      !item.path.toUpperCase().includes('PASIVO') &&
      !item.path.toUpperCase().includes('PATRIMONIO') &&
      !/^[123]/.test(item.name)
    );

    const normKey = s => s.trim().replace(/\s+/g,' ').toUpperCase();
    const byCode = {};
    resData.forEach(item => {
      // LOGICA DEL COMPARATIVO INYECTADA AQUI PARA RESULTADOS EXACTOS
      const pathParts = item.path.split('>');
      let accountOriginalName = pathParts.length > 1 ? pathParts[pathParts.length - 1].trim() : item.name.trim();
      if (!/^(\d[\d\.]+)/.test(accountOriginalName) && /^(\d[\d\.]+)/.test(item.name.trim())) accountOriginalName = item.name.trim();
      const codeMatch = accountOriginalName.match(/^(\d[\d\.]+)/);
      const key = codeMatch ? codeMatch[1] : normKey(accountOriginalName);

      if (!byCode[key]) {
        byCode[key] = { ...item, name: accountOriginalName, path: pathParts.slice(0, -1).join('>') || 'OTROS' };
      } else {
        byCode[key].usd += item.usd;
        byCode[key].bs  += item.bs;
      }
    });
    const deduplicated = Object.values(byCode);

    const isIng = item => item.path.toUpperCase().includes('INGRESO') || item.path.toUpperCase().includes('VENTA') || item.name.match(/^4/);
    const isCos = item => item.path.toUpperCase().includes('COSTO DE VENTA') || item.path.toUpperCase().includes('COSTO VENTA') || item.name.match(/^5\.1/);
    const isGas = item => !isIng(item) && !isCos(item);

    const buildTree = (dataArr) => {
      const root = [];
      dataArr.forEach(item => {
        const pathArray = item.path.split('>');
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
        if (!leaf) cur.push({ n: item.name.trim(), u: item.usd, b: item.bs, isLeaf: true });
        else { leaf.u += item.usd; leaf.b += item.bs; }
      });

      const compute = (nodes) => {
        let u = 0, b = 0;
        nodes.forEach(n => { if (!n.isLeaf) { const t = compute(n.c); n.u = t.u; n.b = t.b; } u += n.u; b += n.b; });
        return { u, b };
      };
      compute(root);
      return root;
    };

    const applyMult = (nodes, m) => {
      nodes.forEach(n => { n.u *= m; n.b *= m; if (!n.isLeaf) applyMult(n.c, m); });
    };

    const tIng = buildTree(deduplicated.filter(isIng)); applyMult(tIng, -1); 
    const tCos = buildTree(deduplicated.filter(isCos)); 
    const tGas = buildTree(deduplicated.filter(isGas)); 

    const sumT = (nodes) => nodes.reduce((acc, n) => acc + n.u, 0);
    const totI = sumT(tIng);
    const totC = sumT(tCos);
    const totG = sumT(tGas);

    return { 
      treeIngresos: tIng, treeCostos: tCos, treeGastos: tGas,
      totIng: totI, totCos: totC, totGas: totG,
      utBruta: totI - totC, utNeta: (totI - totC) - totG
    };
  }, [dbData, selectedMonth, selectedYear]);

  const baseVentas = totIng === 0 ? 1 : totIng;
  const fmtR = (v) => new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);

  return (
    <div className="min-h-screen bg-[#f8fafc] print:bg-white">
      <PrintStyles />
      <header className="no-print bg-white border-b border-slate-200 p-4 flex justify-between items-center sticky top-0 z-30 shadow-sm flex-wrap gap-4">
        <div className="flex items-center gap-4 flex-wrap">
          <button onClick={onBack} className="flex items-center gap-2 font-black text-xs text-slate-500 uppercase hover:text-slate-900 transition-colors"><ArrowLeft size={16}/> Volver al Panel</button>
          <div className="flex items-center gap-2 border-l border-slate-200 pl-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Año:</span>
            <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-md p-1.5 font-bold uppercase outline-none focus:border-slate-400">
              {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-2">Mes:</span>
            <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-md p-1.5 font-bold uppercase outline-none focus:border-slate-400 min-w-[120px]">
              <option value="General">Acumulado General</option>
              {availableMonths.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="flex gap-2 bg-slate-100 p-1 rounded-md border border-slate-200">
            <button onClick={() => { setDefaultOpen(true); setExpandKey(k=>k+1); }} className="px-3 py-1 rounded text-[10px] font-bold uppercase flex items-center gap-1 hover:bg-white text-slate-600"><ChevronDown size={14}/> Expandir</button>
            <button onClick={() => { setDefaultOpen(false); setExpandKey(k=>k+1); }} className="px-3 py-1 rounded text-[10px] font-bold uppercase flex items-center gap-1 hover:bg-white text-slate-600"><ChevronRight size={14}/> Contraer</button>
          </div>
          <div className="flex gap-2 bg-slate-800 p-1 rounded-md">
            <button onClick={() => window.print()} className="px-3 py-1 rounded text-[10px] font-bold uppercase flex items-center gap-1 text-white hover:bg-slate-700"><Printer size={14}/> PDF</button>
            <button onClick={() => handleExportExcel('table-resultados', `Estado_Resultados_${selectedMonth}_${selectedYear}`, `Estado de Resultados - ${selectedMonth} ${selectedYear}`)} className="px-3 py-1 rounded text-[10px] font-bold uppercase flex items-center gap-1 text-white hover:bg-slate-700"><Download size={14}/> Excel</button>
          </div>
        </div>
      </header>
      <main className="print-area p-4 md:p-8 max-w-5xl mx-auto pb-16">
        <HeaderMembretado isExport={true}/>
        <div className="bg-white px-8 py-8 border border-slate-200 print:border-none shadow-sm print:shadow-none flex flex-col items-center text-center mb-6 rounded-xl">
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-2 mb-3 w-full max-w-md">Estado de Resultado {selectedMonth === 'General' ? 'Acumulado' : 'Mensual'}</h2>
          <p className="text-slate-600 font-bold uppercase text-[10px] tracking-widest">{selectedMonth} {selectedYear}</p>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm print:shadow-none overflow-hidden border border-slate-200 print:border-none">
          <table id="table-resultados" className="w-full text-left border-collapse">
            <thead className="bg-slate-100 print:bg-slate-100 text-[10px] uppercase font-black text-slate-500 print:text-black border-b border-slate-300">
              <tr><th className="px-4 py-4 w-[55%]">Cuentas Contables</th><th className="px-3 py-4 text-right">Saldo USD</th><th className="px-3 py-4 text-right hidden sm:table-cell">Saldo Bs.</th><th className="px-3 py-4 text-right">%</th></tr>
            </thead>
            <tbody key={expandKey}>
              {/* INGRESOS - DISEÑO LIMPIO */}
              <tr className="bg-white print:bg-white border-b border-slate-200"><td colSpan={4} className="py-3 px-4 font-black text-xs text-slate-800 uppercase tracking-widest">I. INGRESOS</td></tr>
              {treeIngresos.map((node, i) => <ExpandableRow key={`ing-${i}`} node={node} totalBaseUSD={baseVentas} defaultOpen={defaultOpen} highlightedAccounts={highlightedAccounts} toggleHighlight={toggleHighlight}/>)}
              <tr className="bg-slate-50 print:bg-slate-100 text-slate-900 print:text-black font-black border-t-2 border-slate-300">
                <td className="px-5 py-3 text-[11px] uppercase tracking-[0.2em]" style={{paddingLeft:28}}>TOTAL INGRESOS</td>
                <td className="px-3 py-3 text-right text-xs font-mono">{fmtR(totIng)}</td><td className="px-3 py-3 text-right text-xs font-mono hidden sm:table-cell">{fmtR(totIng*45)}</td><td className="px-3 py-3 text-right text-xs font-mono">{(totIng/baseVentas*100).toFixed(2)}%</td>
              </tr>

              {/* COSTOS DE VENTA - DISEÑO LIMPIO */}
              <tr className="bg-white print:bg-white border-b border-slate-200 mt-4"><td colSpan={4} className="py-3 px-4 font-black text-xs text-slate-800 uppercase tracking-widest">II. COSTOS DE PRODUCCIÓN Y VENTA</td></tr>
              {treeCostos.map((node, i) => <ExpandableRow key={`cos-${i}`} node={node} totalBaseUSD={baseVentas} defaultOpen={defaultOpen} highlightedAccounts={highlightedAccounts} toggleHighlight={toggleHighlight}/>)}
              <tr className="bg-slate-50 print:bg-slate-100 text-slate-900 print:text-black font-black border-t-2 border-slate-300">
                <td className="px-5 py-3 text-[11px] uppercase tracking-[0.2em]" style={{paddingLeft:28}}>TOTAL COSTOS DE VENTA</td>
                <td className="px-3 py-3 text-right text-xs font-mono">{fmtR(totCos)}</td><td className="px-3 py-3 text-right text-xs font-mono hidden sm:table-cell">{fmtR(totCos*45)}</td><td className="px-3 py-3 text-right text-xs font-mono">{(totCos/baseVentas*100).toFixed(2)}%</td>
              </tr>

              {/* UTILIDAD BRUTA - RESALTADA */}
              <tr className="bg-slate-900 print:bg-slate-300 text-white print:text-black font-black border-y-4 border-slate-400">
                <td className="px-5 py-5 text-sm uppercase tracking-[0.1em]" style={{paddingLeft:20}}>III. UTILIDAD BRUTA EN VENTAS</td>
                <td className={`px-3 py-5 text-right text-base font-mono ${utBruta < 0 ? 'text-red-400 print:text-red-700' : 'text-emerald-400 print:text-black'}`}>{fmtR(utBruta)}</td>
                <td className={`px-3 py-5 text-right text-base font-mono hidden sm:table-cell ${utBruta < 0 ? 'text-red-400 print:text-red-700' : 'text-emerald-400 print:text-black'}`}>{fmtR(utBruta*45)}</td>
                <td className="px-3 py-5 text-right text-base font-mono text-slate-300 print:text-black">{(Math.abs(utBruta)/baseVentas*100).toFixed(2)}%</td>
              </tr>

              {/* GASTOS OPERATIVOS - DISEÑO LIMPIO */}
              <tr className="bg-white print:bg-white border-b border-slate-200 mt-4"><td colSpan={4} className="py-3 px-4 font-black text-xs text-slate-800 uppercase tracking-widest">IV. GASTOS OPERATIVOS Y OTROS EGRESOS</td></tr>
              {treeGastos.map((node, i) => <ExpandableRow key={`gas-${i}`} node={node} totalBaseUSD={baseVentas} defaultOpen={defaultOpen} highlightedAccounts={highlightedAccounts} toggleHighlight={toggleHighlight}/>)}
              <tr className="bg-slate-50 print:bg-slate-100 text-slate-900 print:text-black font-black border-t-2 border-slate-300">
                <td className="px-5 py-3 text-[11px] uppercase tracking-[0.2em]" style={{paddingLeft:28}}>TOTAL GASTOS OPERATIVOS</td>
                <td className="px-3 py-3 text-right text-xs font-mono">{fmtR(totGas)}</td><td className="px-3 py-3 text-right text-xs font-mono hidden sm:table-cell">{fmtR(totGas*45)}</td><td className="px-3 py-3 text-right text-xs font-mono">{(totGas/baseVentas*100).toFixed(2)}%</td>
              </tr>

              {/* UTILIDAD NETA - RESALTADA INSTITUCIONAL */}
              <tr className="bg-black print:bg-slate-400 text-white print:text-black font-black border-t-4 border-orange-500 print:border-black">
                <td className="px-5 py-6 text-sm uppercase tracking-[0.1em]" style={{paddingLeft:20}}>V. RESULTADO DEL EJERCICIO (NETO)</td>
                <td className={`px-3 py-6 text-right text-lg font-mono ${utNeta < 0 ? 'text-red-500 print:text-red-800' : 'text-orange-500 print:text-black'}`}>{fmtR(utNeta)}</td>
                <td className={`px-3 py-6 text-right text-lg font-mono hidden sm:table-cell ${utNeta < 0 ? 'text-red-500 print:text-red-800' : 'text-orange-500 print:text-black'}`}>{fmtR(utNeta*45)}</td>
                <td className="px-3 py-6 text-right text-lg font-mono text-slate-400 print:text-black">{(Math.abs(utNeta)/baseVentas*100).toFixed(2)}%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

// ============================================================================
// 6. VISTA: ANÁLISIS COMPARATIVO 
// ============================================================================
function AnalisisComparativoView({ onBack, dbData }) {
  const availableYears = useMemo(() => [...new Set(dbData.map(d => d.year))].filter(Boolean).sort(), [dbData]);
  const [year1, setYear1] = useState(availableYears[availableYears.length - 1] || '2026');
  const [year2, setYear2] = useState(availableYears[availableYears.length - 1] || '2026');
  
  const getMonths = (y) => [...new Set(dbData.filter(d=>d.year===y).map(d => d.month))].filter(m => m !== 'Sin Mes');
  const months1 = getMonths(year1); const months2 = getMonths(year2);
  
  const [month1, setMonth1] = useState(months1[0] || '');
  const [month2, setMonth2] = useState(months2[1] || months2[0] || '');

  useEffect(() => { setMonth1(getMonths(year1)[0] || ''); }, [year1]);
  useEffect(() => { setMonth2(getMonths(year2)[1] || getMonths(year2)[0] || ''); }, [year2]);

  const tree = useMemo(() => {
    const root = [];
    const m1Data = dbData.filter(d => d.year === year1 && d.month === month1 && !d.path.toUpperCase().includes('ACTIVO') && !d.path.toUpperCase().includes('PASIVO') && !d.path.toUpperCase().includes('PATRIMONIO'));
    const m2Data = dbData.filter(d => d.year === year2 && d.month === month2 && !d.path.toUpperCase().includes('ACTIVO') && !d.path.toUpperCase().includes('PASIVO') && !d.path.toUpperCase().includes('PATRIMONIO'));

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
  }, [dbData, month1, year1, month2, year2]);

  let total_m1 = 0, total_m2 = 0;
  tree.forEach(cat => {
    const isIngreso = cat.n.includes('INGRESO') || cat.n.includes('VENTA') || (cat.key && cat.key.startsWith('4'));
    if (isIngreso) { total_m1 += cat.m1_u; total_m2 += cat.m2_u; } 
    else { total_m1 -= cat.m1_u; total_m2 -= cat.m2_u; }
  });

  const varAbsTotal = total_m1 - total_m2;
  const varPctTotal = total_m2 !== 0 ? (varAbsTotal / Math.abs(total_m2)) * 100 : (total_m1 !== 0 ? 100 : 0);
  const isPosTotal = varAbsTotal > 0;
  const isNegTotal = varAbsTotal < 0;
  const TotalArrowIcon = isPosTotal ? ArrowUpRight : (isNegTotal ? ArrowDownRight : null);
  const fmtR = (v) => new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);

  return (
    <div className="min-h-screen bg-[#f8fafc] print:bg-white">
      <PrintStyles />
      <header className="no-print bg-white border-b border-slate-200 p-4 flex justify-between items-center sticky top-0 z-30 shadow-sm flex-wrap gap-2">
        <div className="flex items-center gap-4 flex-wrap">
          <button onClick={onBack} className="flex items-center gap-2 font-black text-xs text-slate-500 uppercase hover:text-slate-900"><ArrowLeft size={16}/> Volver al Panel</button>
          <div className="flex items-center gap-2 border-l border-slate-200 pl-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mr-1">Base:</span>
            <select value={year1} onChange={(e) => setYear1(e.target.value)} className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-md p-1.5 font-bold uppercase outline-none">{availableYears.map(y=><option key={y}>{y}</option>)}</select>
            <select value={month1} onChange={(e) => setMonth1(e.target.value)} className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-md p-1.5 font-bold uppercase outline-none">{months1.map(m => <option key={m}>{m}</option>)}</select>
            <span className="text-xs font-bold text-slate-300 uppercase tracking-widest mx-2">VS</span>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mr-1">Comparar:</span>
            <select value={year2} onChange={(e) => setYear2(e.target.value)} className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-md p-1.5 font-bold uppercase outline-none">{availableYears.map(y=><option key={y}>{y}</option>)}</select>
            <select value={month2} onChange={(e) => setMonth2(e.target.value)} className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-md p-1.5 font-bold uppercase outline-none">{months2.map(m => <option key={m}>{m}</option>)}</select>
          </div>
        </div>
        <div className="flex gap-2 bg-slate-800 p-1 rounded-md">
          <button onClick={() => window.print()} className="px-3 py-1 rounded text-[10px] font-bold uppercase flex items-center gap-1 text-white hover:bg-slate-700"><Printer size={14}/> PDF</button>
          <button onClick={() => handleExportExcel('table-comparativo', `Comparativo_${month1}${year1}_vs_${month2}${year2}`, `Análisis Comparativo - ${month1} ${year1} vs ${month2} ${year2}`)} className="px-3 py-1 rounded text-[10px] font-bold uppercase flex items-center gap-1 text-white hover:bg-slate-700"><Download size={14}/> Excel</button>
        </div>
      </header>
      <main className="print-area p-4 md:p-8 max-w-5xl mx-auto pb-16">
        <HeaderMembretado isExport={true} />
        <div className="bg-white px-8 py-8 border border-slate-200 print:border-none shadow-sm print:shadow-none flex flex-col items-center text-center mb-6 rounded-xl">
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-2 mb-3 w-full max-w-md">Análisis Comparativo</h2>
          <p className="text-slate-600 font-bold uppercase text-[10px] tracking-widest">{month1} {year1} vs {month2} {year2}</p>
        </div>
        
        {!month1 || !month2 ? (
          <div className="bg-white p-12 text-center rounded-xl border border-slate-200 shadow-sm"><AlertTriangle className="mx-auto text-slate-300 mb-4" size={48}/><p className="text-slate-500 font-black text-xs uppercase tracking-wider">Faltan datos para comparar.</p></div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm print:shadow-none overflow-hidden border border-slate-200 print:border-none">
            <table id="table-comparativo" className="w-full text-left border-collapse">
              <thead className="bg-slate-100 print:bg-slate-200 text-[10px] uppercase font-black text-slate-500 print:text-black border-b border-slate-300">
                <tr>
                  <th className="px-4 py-4 w-[40%]">Estructura de Cuentas</th>
                  <th className="px-3 py-4 text-right">📅 {month1} {year1} <span className="text-slate-400 font-normal">(Base)</span></th>
                  <th className="px-3 py-4 text-right bg-slate-50 print:bg-transparent">📅 {month2} {year2} <span className="text-slate-400 font-normal">(Comparar)</span></th>
                  <th className="px-3 py-4 text-right">Var. Absoluta</th>
                  <th className="px-3 py-4 text-right">Var. %</th>
                </tr>
              </thead>
              <tbody>
                {tree.map((cat, i) => {
                  const sortedAccounts = [...cat.c].sort((a, b) => String(a.n).localeCompare(String(b.n)));
                  const catVarAbs = cat.m1_u - cat.m2_u;
                  const catVarPct = cat.m2_u !== 0 ? (catVarAbs / Math.abs(cat.m2_u)) * 100 : (cat.m1_u !== 0 ? 100 : 0);
                  const isCatIngreso = cat.n.includes('INGRESO') || cat.n.includes('VENTA') || (cat.key && cat.key.startsWith('4'));
                  const catGood = isCatIngreso ? catVarAbs > 0 : catVarAbs < 0;
                  const catBad  = isCatIngreso ? catVarAbs < 0 : catVarAbs > 0;
                  const CatColorClass = catGood ? 'text-emerald-600 print:text-black' : (catBad ? 'text-red-500 print:text-black' : 'text-slate-400 print:text-black');
                  const CatArrowIcon  = catGood ? ArrowUpRight : (catBad ? ArrowDownRight : null);

                  return (
                    <React.Fragment key={i}>
                      <tr className="bg-slate-50 print:bg-slate-100 border-b border-slate-200"><td className="py-3 px-4 text-slate-800 print:text-black font-black text-[11px] uppercase tracking-widest">{cat.n}</td><td colSpan={4} /></tr>
                      {sortedAccounts.map((acc, j) => {
                        const varAbs = acc.m1_u - acc.m2_u; 
                        const varPct = acc.m2_u !== 0 ? (varAbs / Math.abs(acc.m2_u)) * 100 : (acc.m1_u !== 0 ? 100 : 0);
                        const good = isCatIngreso ? varAbs > 0 : varAbs < 0;
                        const bad  = isCatIngreso ? varAbs < 0 : varAbs > 0;
                        const colorClass = good ? 'text-emerald-600 print:text-black' : (bad ? 'text-red-500 print:text-black' : 'text-slate-400 print:text-black');
                        const ArrowIcon  = good ? ArrowUpRight : (bad ? ArrowDownRight : null);

                        return (
                          <tr key={j} className="bg-white border-b border-slate-100 hover:bg-slate-50 transition-colors">
                            <td className="py-2.5 px-4 font-bold text-[11px] text-slate-700 uppercase pl-6 print:border-none truncate max-w-xs">{acc.n}</td>
                            <td className="py-2.5 px-3 text-right font-mono text-[11px] text-slate-500 print:text-black">{fmtR(acc.m1_u)}</td>
                            <td className="py-2.5 px-3 text-right font-mono text-[11px] text-slate-800 print:text-black font-bold bg-slate-50/50 print:bg-transparent">{fmtR(acc.m2_u)}</td>
                            <td className={`py-2.5 px-3 text-right font-mono text-[11px] font-bold ${good ? 'text-emerald-600 print:text-black' : (bad ? 'text-red-500 print:text-black' : 'text-slate-400 print:text-black')}`}>
                              {varAbs >= 0 ? '+' : ''}{fmtR(varAbs)}
                            </td>
                            <td className={`py-2.5 px-3 text-right font-mono text-[11px] font-bold flex justify-end items-center gap-1 ${colorClass}`}>
                              {ArrowIcon && <ArrowIcon size={12}/>} {Math.abs(varPct).toFixed(2)}%
                            </td>
                          </tr>
                        );
                      })}
                      <tr className="bg-slate-100 print:bg-slate-50 text-slate-800 border-t-2 border-slate-200">
                        <td className="py-3 px-4 font-black text-[11px] uppercase tracking-wider pl-6">TOTAL {cat.n}</td>
                        <td className="py-3 px-3 text-right font-mono text-[11px] font-black print:text-black">{fmtR(cat.m1_u)}</td>
                        <td className="py-3 px-3 text-right font-mono text-[11px] font-black print:text-black bg-slate-200/50 print:bg-transparent">{fmtR(cat.m2_u)}</td>
                        <td className={`py-3 px-3 text-right font-mono text-[11px] font-black ${catGood ? 'text-emerald-600 print:text-black' : (catBad ? 'text-red-500 print:text-black' : 'text-slate-500 print:text-black')}`}>
                          {catVarAbs >= 0 ? '+' : ''}{fmtR(catVarAbs)}
                        </td>
                        <td className={`py-3 px-3 text-right font-mono text-[11px] font-black flex justify-end items-center gap-1 ${CatColorClass}`}>
                          {CatArrowIcon && <CatArrowIcon size={12}/>} {Math.abs(catVarPct).toFixed(2)}%
                        </td>
                      </tr>
                    </React.Fragment>
                  );
                })}
                <tr className="bg-black print:bg-slate-400 text-white print:text-black font-black border-t-4 border-orange-500 print:border-black">
                  <td className="px-5 py-6 text-sm uppercase tracking-[0.1em]" style={{paddingLeft:28}}>RESULTADO DEL EJERCICIO</td>
                  <td className="px-3 py-6 text-right text-base font-mono border-l border-slate-800 print:border-slate-500">{fmtR(total_m1)}</td>
                  <td className="px-3 py-6 text-right text-base font-mono border-l border-slate-800 print:border-slate-500">{fmtR(total_m2)}</td>
                  <td className={`px-3 py-6 text-right text-lg font-mono border-l border-slate-800 print:border-slate-500 ${isPosTotal ? 'text-emerald-400 print:text-black' : (isNegTotal ? 'text-red-400 print:text-black' : 'text-slate-400 print:text-black')}`}>
                    {varAbsTotal >= 0 ? '+' : ''}{fmtR(varAbsTotal)}
                  </td>
                  <td className={`px-3 py-6 text-right text-lg font-mono flex justify-end items-center gap-1 ${isPosTotal ? 'text-emerald-400 print:text-black' : (isNegTotal ? 'text-red-400 print:text-black' : 'text-slate-400 print:text-black')}`}>
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
// 7. VISTA: BALANCE GENERAL
// ============================================================================
function BalanceGeneralView({ onBack, dbData, auxDataConfig }) {
  const balanceRecords = useMemo(() => dbData.filter(item => item.path.toUpperCase().includes('ACTIVO') || item.path.toUpperCase().includes('PASIVO') || item.path.toUpperCase().includes('PATRIMONIO') || /^[123]/.test(item.name)), [dbData]);
  const availableYears = useMemo(() => [...new Set(balanceRecords.map(d => d.year))].filter(Boolean).sort(), [balanceRecords]);
  const [selectedYear, setSelectedYear] = useState(availableYears[availableYears.length - 1] || '2026');
  
  const availableMonths = useMemo(() => [...new Set(balanceRecords.filter(d => d.year === selectedYear).map(d => d.month))], [balanceRecords, selectedYear]);
  const [selectedMonth, setSelectedMonth] = useState(availableMonths[availableMonths.length - 1] || ''); 
  
  const [defaultOpen, setDefaultOpen] = useState(false);
  const [expandKey, setExpandKey] = useState(0);
  const [activeCode, setActiveCode] = useState(null);
  const [tasa, setTasa] = useState(90);

  const [highlightedAccounts, setHighlightedAccounts] = useState(() => {
    try { const saved = localStorage.getItem('jiret_highlighted_accounts'); return saved ? new Set(JSON.parse(saved)) : new Set(); } catch(e){return new Set();}
  });
  useEffect(() => { localStorage.setItem('jiret_highlighted_accounts', JSON.stringify([...highlightedAccounts])); }, [highlightedAccounts]);

  const tree = useMemo(() => {
    const root = [];
    const monthData = balanceRecords.filter(d => d.year === selectedYear && d.month === selectedMonth);
    const normKey = s => s.trim().replace(/\s+/g,' ').toUpperCase();

    monthData.forEach(item => {
      const pathArray = item.path.split('>');
      let cur = root;
      pathArray.forEach(folderName => {
        if(!folderName) return;
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
    root.sort((a, b) => sectionOrder(a.n) - sectionOrder(b.n));

    const assetSubOrder = (name) => {
      const n = name.toUpperCase();
      if (n.includes('DISPONIBLE') || n.includes('CAJA') || n.includes('BANCO')) return 1;
      if (n.includes('POR COBRAR') || n.includes('COBRAR'))                       return 2;
      if (n.includes('INVENTARIO') || n.includes('MERCANCIA'))                    return 3;
      if (n.includes('ANTICIPO') || n.includes('PREPAGO'))                        return 4;
      if (n.includes('FIJO') || n.includes('INMUEBLE') || n.includes('VEHICLE')) return 6;
      return 5;
    };
    const sortNodes = (nodes, depth) => {
      if (depth === 0) return; 
      nodes.sort((a, b) => {
        const ao = assetSubOrder(a.n), bo = assetSubOrder(b.n);
        if (ao !== bo) return ao - bo;
        return a.n.localeCompare(b.n);
      });
      nodes.forEach(n => { if (!n.isLeaf && n.c) sortNodes(n.c, depth - 1); });
    };
    root.forEach(r => { if (r.c) sortNodes(r.c, 3); });

    return root;
  }, [balanceRecords, selectedMonth, selectedYear, tasa]);

  let totalActivos = 0; let totalPasPat = 0;
  tree.forEach(n => { if(n.n.toUpperCase().includes('ACTIVO') || n.n.startsWith('1')) totalActivos += n.u; else totalPasPat += n.u; });

  const fmtR = (v) => new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Math.abs(v));

  if (activeCode) return <AuxiliarReportView accountCode={activeCode} onBack={() => setActiveCode(null)} auxDataConfig={auxDataConfig} />;

  return (
    <div className="min-h-screen bg-[#f8fafc] print:bg-white">
      <PrintStyles />
      <header className="no-print bg-white border-b border-slate-200 p-4 flex justify-between items-center sticky top-0 z-30 shadow-sm flex-wrap gap-2">
        <div className="flex items-center gap-4 flex-wrap">
          <button onClick={onBack} className="flex items-center gap-2 font-black text-xs text-slate-500 uppercase hover:text-slate-900 transition-colors"><ArrowLeft size={16}/> Salir al Panel</button>
          {availableMonths.length > 0 && (
            <div className="border-l border-slate-200 pl-4 flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Año:</span>
              <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-md block p-1.5 font-bold uppercase outline-none">{availableYears.map(y=><option key={y}>{y}</option>)}</select>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Mes:</span>
              <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-md block p-1.5 font-bold uppercase outline-none">
                {availableMonths.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          )}
          <div className="border-l border-slate-200 pl-4 flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tasa Bs/USD:</span>
            <input
              type="number" min="1" step="0.01" value={tasa}
              onChange={e => setTasa(parseFloat(e.target.value) || 1)}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-md p-1.5 w-24 font-black outline-none focus:border-slate-400"
            />
          </div>
        </div>
        <div className="flex gap-2 bg-slate-800 p-1 rounded-md">
          <button onClick={() => { setDefaultOpen(true); setExpandKey(k=>k+1); }} className="px-3 py-1 rounded text-[10px] font-bold uppercase flex items-center gap-1 text-slate-300 hover:text-white"><ChevronDown size={14}/> Expandir</button>
          <button onClick={() => { setDefaultOpen(false); setExpandKey(k=>k+1); }} className="px-3 py-1 rounded text-[10px] font-bold uppercase flex items-center gap-1 text-slate-300 hover:text-white"><ChevronRight size={14}/> Contraer</button>
          <span className="text-slate-600">|</span>
          <button onClick={() => window.print()} className="px-3 py-1 rounded text-[10px] font-bold uppercase flex items-center gap-1 text-white hover:bg-slate-700"><Printer size={14}/> PDF</button>
          <button onClick={() => handleExportExcel('table-balance', `Balance_General_${selectedMonth}_${selectedYear}`, `Balance General - ${selectedMonth} ${selectedYear}`)} className="px-3 py-1 rounded text-[10px] font-bold uppercase flex items-center gap-1 text-white hover:bg-slate-700"><Download size={14}/> Excel</button>
        </div>
      </header>
      <main className="print-area p-4 md:p-8 max-w-5xl mx-auto pb-16">
        <HeaderMembretado isExport={true} />
        <div className="bg-white px-8 py-8 border border-slate-200 print:border-none shadow-sm print:shadow-none flex flex-col items-center text-center mb-6 rounded-xl">
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-2 mb-3 w-full max-w-md">Balance de Situación Financiera</h2>
          <p className="text-slate-600 font-bold uppercase text-[10px] tracking-widest">{selectedMonth ? `Corte: ${selectedMonth} ${selectedYear}` : 'Sin datos'}</p>
        </div>
        
        {dbData.length === 0 || tree.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-xl border border-slate-200 shadow-sm">
            <AlertTriangle className="mx-auto text-slate-300 mb-4" size={48}/>
            <p className="text-slate-500 font-black text-xs uppercase tracking-wider mb-2">No se detectaron cuentas de Balance en el mes seleccionado.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm print:shadow-none overflow-hidden border border-slate-200 print:border-none">
            <table id="table-balance" className="w-full text-left border-collapse">
              <thead className="bg-slate-100 print:bg-slate-100 text-[10px] uppercase font-black text-slate-500 print:text-black border-b border-slate-300">
                <tr>
                  <th className="px-4 py-4 w-[55%]">Estructura</th>
                  <th className="px-3 py-4 text-right">Saldo USD</th>
                  <th className="px-3 py-4 text-right hidden sm:table-cell">Equiv. Bs. <span className="font-normal normal-case">(× {tasa})</span></th>
                  <th className="px-3 py-4 text-right">%</th>
                </tr>
              </thead>
              <tbody key={expandKey}>
                {tree.map((node, i) => <ExpandableRow key={i} node={node} totalBaseUSD={totalActivos} defaultOpen={defaultOpen} highlightedAccounts={highlightedAccounts} toggleHighlight={a => setHighlightedAccounts(p => {const s=new Set(p); if(s.has(a))s.delete(a); else s.add(a); return s;})} onShowReport={setActiveCode} isBalance={true}/>)}
                <tr className="bg-black print:bg-slate-200 text-white print:text-black font-black border-t-4 border-slate-400 print:border-black">
                  <td colSpan={4} className="p-6">
                    <div className="flex flex-wrap justify-between items-center px-4">
                      <div className="flex items-center gap-4"><Scale size={32} className="text-slate-400 print:text-black"/><div><p className="text-[10px] text-slate-400 print:text-slate-700 font-bold uppercase tracking-widest mb-1">Ecuación Patrimonial</p><p className="text-sm font-black tracking-widest">ACTIVOS = PASIVOS + PATRIMONIO</p></div></div>
                      <div className="flex gap-8 text-right">
                        <div><p className="text-[10px] text-slate-400 print:text-slate-700 font-black uppercase tracking-widest mb-1">Total Activos</p><p className="text-xl font-mono text-white print:text-black">USD {fmtR(totalActivos)}</p></div>
                        <div><p className="text-[10px] text-slate-400 print:text-slate-700 font-black uppercase tracking-widest mb-1">Pasivo + Patrimonio</p><p className="text-xl font-mono text-white print:text-black">USD {fmtR(totalPasPat)}</p></div>
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
// 8. VISTA: ACTIVOS FIJOS (INVERSIONES)
// ============================================================================
const ACTIVOS_FIJOS = [
  { grupo:'Vehículos',                   cod:'AF-V001', descripcion:'Camión Reparto — Chevrolet N300',          fechaAdq:'07/10/2025', costoOriginal:21110.23, depAcum:2637.53, vidaUtil:60,  proveedor:'AUTO TOTAL, C.A' },
  { grupo:'Inmuebles',                   cod:'AF-I001', descripcion:'Local Comercial — Contrato Pacomela',      fechaAdq:'02/01/2026', costoOriginal:169547.91,depAcum:4238.70, vidaUtil:240, proveedor:'AGRO INDUSTRIAS LACTEAS PACOMELA, C.A' },
  { grupo:'Maquinaria y Equipos',        cod:'AF-M001', descripcion:'Equipos de Producción y Empaque',         fechaAdq:'01/06/2024', costoOriginal:15000.00, depAcum:3750.00, vidaUtil:60,  proveedor:'—' },
  { grupo:'Maquinaria y Equipos',        cod:'AF-M002', descripcion:'Sistema de Refrigeración Industrial',     fechaAdq:'15/08/2024', costoOriginal:8500.00,  depAcum:1487.50, vidaUtil:84,  proveedor:'—' },
  { grupo:'Mobiliario y Equipos Oficina',cod:'AF-O001', descripcion:'Mobiliario Oficina Administrativa',       fechaAdq:'01/03/2024', costoOriginal:3200.00,  depAcum:1280.00, vidaUtil:60,  proveedor:'—' },
  { grupo:'Mobiliario y Equipos Oficina',cod:'AF-O002', descripcion:'Equipos de Computación y Periféricos',   fechaAdq:'15/09/2024', costoOriginal:4800.00,  depAcum:1200.00, vidaUtil:36,  proveedor:'—' },
];

function InversionesView({ onBack }) {
  const grupos = [...new Set(ACTIVOS_FIJOS.map(a => a.grupo))];
  const fmt = v => new Intl.NumberFormat('es-VE', { minimumFractionDigits:2, maximumFractionDigits:2 }).format(v);
  const totalCosto = ACTIVOS_FIJOS.reduce((s,a) => s + a.costoOriginal, 0);
  const totalDep   = ACTIVOS_FIJOS.reduce((s,a) => s + a.depAcum, 0);
  const totalNeto  = totalCosto - totalDep;

  const currentYear = new Date().getFullYear().toString();
  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState('Abril');

  return (
    <div className="min-h-screen bg-[#f8fafc] print:bg-white">
      <PrintStyles />
      <header className="no-print bg-white border-b border-slate-200 p-4 flex justify-between items-center sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="flex items-center gap-2 font-black text-xs text-slate-500 uppercase hover:text-slate-900"><ArrowLeft size={16}/> Volver</button>
          <span className="text-slate-200">|</span>
          <select value={year} onChange={e=>setYear(e.target.value)} className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded p-1 font-bold outline-none"><option>{currentYear}</option><option>2025</option><option>2024</option></select>
          <select value={month} onChange={e=>setMonth(e.target.value)} className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded p-1 font-bold outline-none"><option>Enero</option><option>Febrero</option><option>Marzo</option><option>Abril</option><option>Mayo</option><option>Junio</option><option>Julio</option><option>Agosto</option><option>Septiembre</option><option>Octubre</option><option>Noviembre</option><option>Diciembre</option></select>
        </div>
        <div className="flex gap-2">
          <button onClick={() => window.print()} className="px-3 py-1.5 text-[10px] font-black uppercase text-white bg-slate-800 rounded flex items-center gap-1"><Printer size={14}/> Imprimir PDF</button>
          <button onClick={() => handleExportExcel('table-activos', 'Activos_Fijos', 'Registro de Activos Fijos')} className="px-3 py-1.5 text-[10px] font-black uppercase text-white bg-emerald-700 rounded flex items-center gap-1"><Download size={14}/> Excel</button>
        </div>
      </header>
      <main className="print-area p-4 md:p-8 max-w-6xl mx-auto pb-16">
        <HeaderMembretado isExport={true} />
        <div className="bg-white px-8 py-8 border border-slate-200 print:border-none shadow-sm print:shadow-none flex flex-col items-center text-center mb-6 rounded-xl">
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-widest mb-5">Registro de Activos Fijos</h2>
          <div className="no-print grid grid-cols-3 gap-6 w-full max-w-2xl mb-4">
            {[
              { label:'Costo Original', val:fmt(totalCosto), color:'text-slate-800' },
              { label:'Dep. Acumulada', val:fmt(totalDep),   color:'text-red-500' },
              { label:'Valor Neto USD', val:fmt(totalNeto),  color:'text-slate-900' },
            ].map(k => (
              <div key={k.label} className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{k.label}</p>
                <p className={`text-lg font-black font-mono ${k.color}`}>{k.val}</p>
              </div>
            ))}
          </div>
          <p className="text-slate-500 text-xs font-bold uppercase mt-2">Corte: {month} {year}</p>
        </div>
        
        <div id="table-activos">
        {grupos.map(grupo => {
          const items = ACTIVOS_FIJOS.filter(a => a.grupo === grupo);
          const gCosto = items.reduce((s,a) => s + a.costoOriginal, 0);
          const gDep   = items.reduce((s,a) => s + a.depAcum, 0);
          return (
            <div key={grupo} className="bg-white rounded-xl shadow-sm print:shadow-none overflow-hidden border border-slate-200 mb-5">
              <div className="bg-slate-100 print:bg-slate-200 px-6 py-3 flex justify-between items-center border-b border-slate-200">
                <span className="text-slate-800 print:text-black font-black text-xs uppercase tracking-widest">{grupo}</span>
                <span className="text-slate-500 print:text-black text-[10px] font-bold">Neto: <span className="text-slate-900 print:text-black font-black">USD {fmt(gCosto-gDep)}</span></span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse" style={{minWidth:'780px'}}>
                  <thead className="bg-white text-[9px] uppercase font-black text-slate-400 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Código</th><th className="px-4 py-3">Descripción</th>
                      <th className="px-4 py-3">Fecha Adq.</th><th className="px-4 py-3">Proveedor</th>
                      <th className="px-4 py-3 text-right">Costo USD</th><th className="px-4 py-3 text-right">Dep. Acum.</th>
                      <th className="px-4 py-3 text-right text-slate-800 print:text-black">Valor Neto</th><th className="px-4 py-3 text-center">Vida Útil</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((a,i) => (
                      <tr key={i} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 text-[11px] font-black text-slate-500 font-mono">{a.cod}</td>
                        <td className="px-4 py-3 text-[11px] font-bold text-slate-800">{a.descripcion}</td>
                        <td className="px-4 py-3 text-[11px] text-slate-500 font-mono">{a.fechaAdq}</td>
                        <td className="px-4 py-3 text-[10px] text-slate-400 max-w-[140px] truncate" title={a.proveedor}>{a.proveedor}</td>
                        <td className="px-4 py-3 text-right text-[11px] font-mono text-slate-700">{fmt(a.costoOriginal)}</td>
                        <td className="px-4 py-3 text-right text-[11px] font-mono text-red-400">({fmt(a.depAcum)})</td>
                        <td className="px-4 py-3 text-right text-[12px] font-mono font-black text-slate-800 print:text-black">{fmt(a.costoOriginal-a.depAcum)}</td>
                        <td className="px-4 py-3 text-center text-[10px] text-slate-400">{a.vidaUtil} meses</td>
                      </tr>
                    ))}
                    <tr className="bg-slate-50 font-black text-[11px] border-t border-slate-200">
                      <td colSpan={4} className="px-4 py-3 text-slate-700 uppercase tracking-wider">Total {grupo}</td>
                      <td className="px-4 py-3 text-right font-mono text-slate-800">{fmt(gCosto)}</td>
                      <td className="px-4 py-3 text-right font-mono text-red-500">({fmt(gDep)})</td>
                      <td className="px-4 py-3 text-right font-mono text-slate-900 print:text-black">{fmt(gCosto-gDep)}</td>
                      <td/>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
        </div>

        <div className="bg-black print:bg-transparent rounded-xl p-6 flex justify-between items-center border-t-4 border-orange-500 print:border-black shadow-lg print:shadow-none mt-8">
          <span className="text-white print:text-black font-black uppercase tracking-widest text-sm">TOTAL ACTIVOS FIJOS NETOS</span>
          <span className="text-white print:text-black font-black font-mono text-2xl">USD {fmt(totalNeto)}</span>
        </div>
      </main>
    </div>
  );
}

// ============================================================================
// 9. COMPONENTE PRINCIPAL / DASHBOARD REDISEÑADO (TEMA OSCURO MODERNO)
// ============================================================================
function ReportesFinancierosApp() {
  const [view, setView] = useState('dashboard');
  
  const [dbData, setDbData] = useState(() => { try { const saved = localStorage.getItem('jiret_erp_db_data'); return saved ? JSON.parse(saved) : []; } catch(e){return [];} });
  const [planCuentas, setPlanCuentas] = useState(() => { try { const saved = localStorage.getItem('jiret_plan_cuentas'); return saved ? JSON.parse(saved) : {}; } catch(e){return {};} });
  const [auxDataConfig, setAuxDataConfig] = useState(() => { try { const saved = localStorage.getItem('jiret_erp_aux_data'); return saved ? JSON.parse(saved) : {}; } catch(e){return {};} });

  useEffect(() => { localStorage.setItem('jiret_erp_db_data', JSON.stringify(dbData)); }, [dbData]);
  useEffect(() => { localStorage.setItem('jiret_plan_cuentas', JSON.stringify(planCuentas)); }, [planCuentas]);
  useEffect(() => { localStorage.setItem('jiret_erp_aux_data', JSON.stringify(auxDataConfig)); }, [auxDataConfig]);

  const handleUploadResultados = async (e) => {
    if (!e.target.files.length) return;
    try {
      const newData = await processFiles(e.target.files);
      setDbData(prev => {
        const newKeys = [...new Set(newData.map(d => `${d.month}-${d.year}`))];
        const keepData = prev.filter(d => !newKeys.includes(`${d.month}-${d.year}`));
        return [...keepData, ...newData];
      });
      alert("✅ Resultados cargados exitosamente.");
    } catch (error) { alert("Error al procesar."); }
    e.target.value = '';
  };

  const handleUploadPlan = async (e) => {
    if (!e.target.files.length) return;
    try { const plan = await processPlanCuentas(e.target.files[0]); setPlanCuentas(plan); alert("✅ Plan de cuentas cargado."); } catch (error) { alert("Error."); }
    e.target.value = '';
  };

  const handleUploadSaldos = async (e) => {
    if (!e.target.files.length) return;
    if (Object.keys(planCuentas).length === 0) { alert("⚠️ Carga el Plan de Cuentas primero."); return; }
    try { const newBalanceData = await processSaldosBalance(e.target.files[0], planCuentas); setDbData(prev => [...prev, ...newBalanceData]); alert("✅ Saldos cargados."); } catch (error) { alert("Error."); }
    e.target.value = '';
  };

  const handleUploadAuxiliar = async (e) => {
    if (!e.target.files.length) return;
    try {
      const parsedGroups = await processAuxFile(e.target.files);
      setAuxDataConfig(prev => {
        const newConfig = { ...prev };
        for (const code in parsedGroups) {
          if (!newConfig[code]) newConfig[code] = parsedGroups[code];
          else newConfig[code].records = [...newConfig[code].records, ...parsedGroups[code].records];
        }
        return newConfig;
      });
      const totalGroups = Object.keys(parsedGroups).length;
      let totalRecords = 0;
      for (const k in parsedGroups) totalRecords += parsedGroups[k].records.length;
      
      alert(`✅ Auxiliares procesados.\n— ${totalGroups} cuentas detectadas.\n— ${totalRecords} registros agregados.`);
    } catch (err) { alert("❌ Error al procesar auxiliares: " + err.message); }
    e.target.value = '';
  };

  const handleDeleteMonth = (monthToDelete) => {
    if (window.confirm(`¿Eliminar los datos de ${monthToDelete}?`)) {
      setDbData(prev => prev.filter(d => d.month !== monthToDelete));
    }
  };

  const handleDeleteData = () => { if(window.confirm("¿Borrar TODOS los datos?")) { setDbData([]); setPlanCuentas({}); setAuxDataConfig({}); } };

  const loadedMonths = [...new Set(dbData.map(d => d.month))].filter(m => m !== 'Sin Mes');
  const hasPlan = Object.keys(planCuentas).length > 0;
  const auxTotalGrupos = Object.keys(auxDataConfig).length;
  
  if (view === 'resultado')     return <EstadoResultadoView   onBack={() => setView('dashboard')} dbData={dbData} />;
  if (view === 'comparativo')   return <AnalisisComparativoView onBack={() => setView('dashboard')} dbData={dbData} />;
  if (view === 'balance')       return <BalanceGeneralView    onBack={() => setView('dashboard')} dbData={dbData} auxDataConfig={auxDataConfig} />;
  if (view === 'inversiones')   return <InversionesView       onBack={() => setView('dashboard')} />;

  const modules = [
    { id:'resultado',   title:'Estado de Resultados',   desc:'P&L mensual y acumulado',       icon:<LineChart size={24} className="text-orange-500"/>,  onClick:() => dbData.length > 0 ? setView('resultado')   : alert('Carga datos en Configuración.') },
    { id:'balance',     title:'Balance General',         desc:'Situación financiera multimoneda', icon:<Scale size={24} className="text-orange-500"/>,      onClick:() => dbData.length > 0 ? setView('balance')     : alert('Carga datos en Configuración.') },
    { id:'comparativo', title:'Análisis de Variación',   desc:'Comparativo mes a mes',           icon:<GitCompare size={24} className="text-orange-500"/>, onClick:() => dbData.length >= 2 ? setView('comparativo') : alert('Necesitas al menos 2 meses.') },
    { id:'inversiones', title:'Activos Fijos',           desc:'Registro y depreciación',          icon:<Landmark size={24} className="text-orange-500"/>,   onClick:() => setView('inversiones') },
    { id:'diario',      title:'Libro Diario',            desc:'Movimientos contables',            icon:<BookOpen size={24} className="text-slate-500"/>,   disabled:true },
    { id:'config',      title:'Configuración',           desc:`Plan: ${hasPlan?'✓':'—'} · Meses: ${loadedMonths.length}`, icon:<Database size={24} className="text-slate-400"/>, onClick:() => setView('configuracion') },
  ];

  if (view === 'configuracion') return (
    <div className="min-h-screen bg-[#0f1115] text-slate-300 font-sans">
      <header className="px-6 py-4 bg-[#16191f] border-b border-white/5 flex items-center gap-4">
        <button onClick={() => setView('dashboard')} className="flex items-center gap-2 text-slate-400 hover:text-white font-bold text-xs uppercase transition-colors"><ArrowLeft size={16}/> Panel</button>
        <h1 className="text-white font-black text-lg tracking-widest uppercase flex items-center gap-2">Configuración <span className="text-orange-500 text-sm">/ Ingesta</span></h1>
      </header>
      <main className="max-w-3xl mx-auto p-8 space-y-6">
        <div className="grid grid-cols-3 gap-4">
          {[
            { label:'Plan de Cuentas',    ok: hasPlan,              val: hasPlan ? 'Cargado' : 'Pendiente' },
            { label:'Meses en Memoria',   ok: loadedMonths.length > 0, val: loadedMonths.length > 0 ? loadedMonths.join(', ') : 'Ninguno' },
            { label:'Auxiliares (Cuentas)', ok: auxTotalGrupos > 0,     val: auxTotalGrupos > 0 ? `${auxTotalGrupos} Cuentas` : 'Pendiente' },
          ].map(s => (
            <div key={s.label} className={`rounded-xl p-4 border ${s.ok ? 'bg-emerald-900/10 border-emerald-500/30' : 'bg-white/5 border-white/10'}`}>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">{s.label}</p>
              <p className={`text-xs font-bold truncate ${s.ok ? 'text-emerald-400' : 'text-slate-400'}`}>{s.val}</p>
            </div>
          ))}
        </div>
        <div className="bg-[#16191f] rounded-2xl p-8 border border-white/5 space-y-4">
          <h2 className="text-white font-black text-sm uppercase tracking-widest mb-6 flex items-center gap-2"><Database size={16} className="text-orange-500"/> Carga de Archivos</h2>
          {[
            { num:'01', label: hasPlan ? '✓ Plan de Cuentas Cargado' : 'Plan de Cuentas (.txt)', active: true, accept:'.txt', handler: handleUploadPlan },
            { num:'02', label:'Saldos Iniciales — Balance (.txt)', active: hasPlan, accept:'.txt', handler: handleUploadSaldos },
            { num:'03', label:'Estado de Resultados (.xlsx / .csv)', active: true, accept:'.xlsx,.xls,.xlsm,.txt,.csv', handler: handleUploadResultados, multiple: true },
            { num:'04', label: auxTotalGrupos > 0 ? `✓ Auxiliares cargados` : 'Auxiliares Dinámicos (.xlsx)', active: true, accept:'.xlsx,.xls,.xlsm,.csv,.txt', handler: handleUploadAuxiliar, multiple: true },
          ].map(step => (
            <label key={step.num} className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all
              ${step.active ? 'border-orange-500/30 text-orange-400 bg-orange-500/5 hover:bg-orange-500/10 hover:border-orange-500/50' : 'border-white/5 text-slate-600 opacity-40 cursor-not-allowed'}`}>
              <span className="text-xl font-black font-mono opacity-30">{step.num}</span>
              <span className="flex-1 font-bold text-xs uppercase tracking-wider">{step.label}</span>
              <Upload size={16} className="opacity-50"/>
              <input type="file" accept={step.accept} multiple={step.multiple} disabled={!step.active} className="hidden" onChange={step.handler}/>
            </label>
          ))}
        </div>
        {loadedMonths.length > 0 && (
          <div className="bg-[#16191f] rounded-2xl p-6 border border-white/5">
            <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest mb-4 flex items-center gap-2"><CheckCircle size={14} className="text-emerald-500"/> Meses en Memoria</p>
            <div className="flex flex-wrap gap-2">
              {loadedMonths.map(m => (
                <span key={m} className="bg-black/50 text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2">
                  {m}<button onClick={() => handleDeleteMonth(m)} className="hover:text-red-400 transition-colors"><Trash2 size={10}/></button>
                </span>
              ))}
            </div>
          </div>
        )}
        <div className="bg-red-900/10 rounded-xl p-5 border border-red-500/20 flex items-center justify-between">
          <div>
            <p className="text-red-400 font-black text-xs uppercase tracking-wider">Zona de Peligro</p>
            <p className="text-slate-500 text-[11px] mt-0.5">Elimina todos los datos cargados en memoria</p>
          </div>
          <button onClick={handleDeleteData} className="bg-red-500/20 hover:bg-red-500/40 text-red-300 border border-red-500/30 px-4 py-2 rounded-lg font-black uppercase text-[10px] tracking-widest transition-all">
            Limpiar Todo
          </button>
        </div>
      </main>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-slate-300 font-sans relative overflow-hidden">
      {/* Fondo decorativo oscuro / Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-orange-500 opacity-20 blur-[100px]"></div>

      <header className="relative z-10 px-8 py-6 border-b border-white/5 flex justify-between items-center bg-[#0a0a0b]/80 backdrop-blur-md">
        <div>
          <h1 className="text-white font-black text-2xl tracking-[0.1em] uppercase flex items-center gap-3">
            <Activity size={28} className="text-orange-500"/> JIRET G&B <span className="text-slate-500 font-normal">Finance</span>
          </h1>
          <p className="text-slate-500 text-[10px] font-black tracking-[0.2em] uppercase mt-1">Servicios Jiret G&B, C.A. · RIF: J-412309374</p>
        </div>
        <div className="flex items-center gap-3">
          {loadedMonths.length > 0 && (
            <span className="bg-orange-500/10 border border-orange-500/20 text-orange-400 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest hidden md:block">
              {loadedMonths.length} mes{loadedMonths.length !== 1 ? 'es' : ''} en memoria
            </span>
          )}
          <button onClick={() => setView('configuracion')} className="bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white px-4 py-2 rounded-xl font-bold uppercase text-[10px] tracking-widest transition-all flex items-center gap-2">
            <Database size={14}/> Configuración
          </button>
        </div>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-6 py-16">
        <div className="mb-12">
          <h2 className="text-white font-bold text-3xl tracking-tight mb-2">Módulos Financieros</h2>
          <p className="text-slate-400 text-sm">Selecciona un reporte para visualizar la información.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map(mod => (
            <button key={mod.id} onClick={mod.disabled ? undefined : mod.onClick} disabled={mod.disabled} className={`group relative bg-[#111318] rounded-2xl p-6 text-left border border-white/5 shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:border-orange-500/30 hover:bg-[#16191f] overflow-hidden ${mod.disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}>
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                {mod.icon}
              </div>
              <div className="bg-[#1a1d24] w-12 h-12 rounded-xl flex items-center justify-center mb-5 border border-white/5 group-hover:border-orange-500/30 transition-colors">
                {mod.icon}
              </div>
              <h3 className="font-bold text-base text-white mb-2">{mod.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{mod.desc}</p>
            </button>
          ))}
        </div>
        
        <p className="text-center text-slate-600 text-[10px] font-bold uppercase tracking-widest mt-16">
          Supply ERP · Jiret G&B Finance v2.0
        </p>
      </main>
    </div>
  );
}

export default ReportesFinancierosApp;

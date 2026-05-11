import React, { useState, useMemo, useEffect } from 'react';
import { 
  ArrowLeft, Upload, CheckCircle, Scale, 
  LineChart, CalendarDays, AlertTriangle, ChevronRight, ChevronDown, Star, PlusCircle, Trash2, ArrowUpRight, ArrowDownRight, GitCompare, Landmark, FileSpreadsheet,
  FileText, Users, Briefcase, Search, BookOpen, Database, FileOutput
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

// ============================================================================
// 1b. PROCESADOR DE AUXILIARES (CxC / CxP)
// ============================================================================
const processAuxFile = async (files, fileType) => {
  const result = { cxc_general: [], cxc_zuliana: [], cxp_autototal: [], cxp_surepack: [], cxp_pacomela: [], cxp_yancarlos: [] };

  const parseVal = (v) => {
    if (v === null || v === undefined || v === '') return null;
    if (typeof v === 'number') return v;
    let s = String(v).replace(/\$|Bs\.|USD/ig, '').trim();
    if (s.includes(',') && s.includes('.')) s = s.replace(/\./g, '').replace(/,/g, '.');
    else if (s.includes(',') && !s.includes('.')) s = s.replace(/,/g, '.');
    const n = parseFloat(s);
    return isNaN(n) ? null : n;
  };

  const parseDate = (v) => {
    if (!v) return '-';
    if (typeof v === 'number') {
      const d = new Date((v - 25569) * 86400 * 1000);
      return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
    }
    return String(v).trim();
  };

  for (const file of Array.from(files)) {
    const ext = file.name.split('.').pop().toLowerCase();
    let dataRows = [];

    if (ext === 'xlsx' || ext === 'xls' || ext === 'xlsm') {
      const XL = await loadSheetJS();
      const buffer = await file.arrayBuffer();
      const wb = XL.read(buffer, { type: 'array', cellDates: false });
      const ws = wb.Sheets[wb.SheetNames[0]];
      dataRows = XL.utils.sheet_to_json(ws, { header: 1, defval: null, raw: true });
    } else if (ext === 'csv' || ext === 'txt') {
      const text = await file.text();
      dataRows = text.split(/\r?\n/).map(line => {
        if (!line.trim()) return null;
        return line.split(/[,;](?=(?:(?:[^"]*"){2})*[^"]*$)/).map(c => c.replace(/^"|"$/g, '').trim());
      }).filter(Boolean);
    }
    if (!dataRows.length) continue;

    // --- Detectar fila de encabezado ---
    let headerRow = -1;
    let colMap = { cod: -1, nombre: -1, doc: -1, emision: -1, vence: -1, monto: -1 };

    for (let i = 0; i < Math.min(15, dataRows.length); i++) {
      const row = dataRows[i];
      if (!row) continue;
      const cells = row.map(c => c ? String(c).toLowerCase().trim() : '');
      const hasName = cells.some(c => c.includes('nombre') || c.includes('cliente') || c.includes('proveedor') || c.includes('razon') || c.includes('razón') || c.includes('sujeto'));
      if (hasName) {
        headerRow = i;
        cells.forEach((c, idx) => {
          if ((c.includes('cód') || c.includes('cod') || c === 'id') && colMap.cod === -1) colMap.cod = idx;
          else if ((c.includes('nombre') || c.includes('cliente') || c.includes('proveedor') || c.includes('razon') || c.includes('razón') || c.includes('sujeto')) && colMap.nombre === -1) colMap.nombre = idx;
          else if ((c.includes('doc') || c.includes('factura') || c.includes('nro') || c.includes('número') || c.includes('numero')) && colMap.doc === -1) colMap.doc = idx;
          else if ((c.includes('emi') || (c.includes('fecha') && !c.includes('venc'))) && colMap.emision === -1) colMap.emision = idx;
          else if (c.includes('venc') && colMap.vence === -1) colMap.vence = idx;
          else if ((c.includes('monto') || c.includes('saldo') || c.includes('importe') || c.includes('total') || c === 'usd' || c === 'bs') && colMap.monto === -1) colMap.monto = idx;
        });
        break;
      }
    }

    // Fallback posicional si no se encontró encabezado
    if (headerRow === -1 || colMap.nombre === -1) {
      colMap = { cod: 0, nombre: 1, doc: 2, emision: 3, vence: 4, monto: 5 };
      headerRow = 0;
    }

    // --- Procesar filas de datos ---
    for (let i = headerRow + 1; i < dataRows.length; i++) {
      const row = dataRows[i];
      if (!row || row.every(c => !c)) continue;

      const nombre = colMap.nombre >= 0 && row[colMap.nombre] ? String(row[colMap.nombre]).trim().toUpperCase() : '';
      if (!nombre) continue;

      const monto = colMap.monto >= 0 ? parseVal(row[colMap.monto]) : null;
      if (monto === null || monto === 0) continue;

      const record = {
        cod:     colMap.cod     >= 0 && row[colMap.cod]     ? String(row[colMap.cod]).trim()  : '-',
        nombre,
        doc:     colMap.doc     >= 0 && row[colMap.doc]     ? String(row[colMap.doc]).trim()  : '-',
        emision: colMap.emision >= 0                        ? parseDate(row[colMap.emision])  : '-',
        vence:   colMap.vence   >= 0                        ? parseDate(row[colMap.vence])    : '-',
        monto,
      };

      // --- MAPEO POR NOMBRE ---
      if (fileType === 'cxc') {
        if (nombre.includes('ZULIANA DE EMPAQUE')) result.cxc_zuliana.push(record);
        else result.cxc_general.push(record);
      } else { // cxp
        if      (nombre.includes('AUTO TOTAL'))                                   result.cxp_autototal.push(record);
        else if (nombre.includes('SURE PACK'))                                    result.cxp_surepack.push(record);
        else if (nombre.includes('PACOMELA') || nombre.includes('AGRO INDUSTRIAS LACTEAS')) result.cxp_pacomela.push(record);
        else if (nombre.includes('YANCARLOS') || nombre.includes('PEREZ CASANOVA'))         result.cxp_yancarlos.push(record);
        // Proveedor no reconocido: se ignora silenciosamente (se puede ampliar)
      }
    }
  }
  return result;
};

// ============================================================================
// 2. CONFIGURACIÓN DE MAPEO Y DATA PRECARGADA (PDFs)
// ============================================================================
const ACCOUNT_MAPS = {
  '1.1.02.01.001': { type: 'cxc_general', label: 'Clientes Generales' },
  '1.1.05.01.008': { type: 'cxc_zuliana', label: 'Anticipos Zuliana' },
  '2.1.01.02.008': { type: 'cxp_autototal', label: 'Vehículos por Pagar' },
  '2.1.01.01.004': { type: 'cxp_surepack', label: 'CxP Sure Pack' },
  '2.1.01.02.007': { type: 'cxp_pacomela', label: 'Inmueble por Pagar' },
  '2.1.01.01.003': { type: 'cxp_yancarlos', label: 'Otras CxP Proveedores' }
};

const DEFAULT_AUX_DATA = {
  cxc_general: [
    { cod: 'C0047', nombre: 'ALIMENTOS BOTALON C.A', doc: '00002973', emision: '30/04/2026', vence: '07/05/2026', monto: 519.51 },
    { cod: 'C0084', nombre: 'ANIMAL FEED SOLUTIONS., C.A', doc: '00002174', emision: '30/04/2025', vence: '30/04/2025', monto: 86.98 },
    { cod: 'C0084', nombre: 'ANIMAL FEED SOLUTIONS., C.A', doc: '00002385', emision: '13/08/2025', vence: '20/08/2025', monto: 873.38 },
    { cod: 'C0120', nombre: 'INVERSORA E&S', doc: '00002589', emision: '09/10/2025', vence: '09/10/2025', monto: 164.20 }
  ],
  cxc_zuliana: [{ cod: 'C0030', nombre: 'ZULIANA DE EMPAQUE, C.A', doc: 'ANT-001', emision: '15/04/2026', vence: '15/04/2026', monto: 2500.00 }],
  cxp_yancarlos: [{ cod: 'P0005', nombre: 'YANCARLOS PEREZ CASANOVA', doc: '001073', emision: '17/04/2026', vence: '17/04/2026', monto: 7920.07 }],
  cxp_pacomela: [{ cod: 'P0515', nombre: 'AGRO INDUSTRIAS LACTEAS PACOMELA, C.A', doc: '2602', emision: '02/01/2026', vence: '02/01/2026', monto: 20173.60 }],
  cxp_autototal: [{ cod: 'P0999', nombre: 'AUTO TOTAL, C.A', doc: 'CUOTA-04', emision: '10/04/2026', vence: '10/04/2026', monto: 1500.00 }],
  cxp_surepack: [{ cod: 'P0888', nombre: 'SURE PACK', doc: 'FAC-992', emision: '22/04/2026', vence: '30/04/2026', monto: 3450.12 }]
};

// ============================================================================
// 3. COMPONENTE: ÁRBOL EXPANDIBLE (COMPARTIDO RESULTADOS Y BALANCE)
// ============================================================================
const ExpandableRow = ({ node, level = 0, totalBaseUSD, defaultOpen = false, highlightedAccounts, toggleHighlight, onShowReport, isBalance = false }) => {
  const isAccountNode = /^\d\./.test(node.n) || (!node.c || node.c.length === 0);
  const isLeaf = !node.c || node.c.length === 0;
  const [isOpen, setIsOpen] = useState(defaultOpen);

  useEffect(() => { setIsOpen(defaultOpen); }, [defaultOpen]);

  const accountCodeMatch = node.n.match(/^(\d[\d\.]+)/);
  const accountCode = accountCodeMatch ? accountCodeMatch[1] : null;
  const hasMapping = (accountCode && ACCOUNT_MAPS[accountCode]) || (isBalance && (node.n.toUpperCase().includes('POR COBRAR') || node.n.toUpperCase().includes('POR PAGAR')));

  const fmtCur = (v) => new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);
  const pct = totalBaseUSD && node.u !== 0 ? `${((Math.abs(node.u) / totalBaseUSD) * 100).toFixed(2)}%` : '';
  const indent = { paddingLeft: `${level * 18 + 10}px` };

  if (!isLeaf && !isAccountNode) {
    const isRoot = level === 0;
    let rootColor = 'text-orange-500'; let borderColor = 'border-orange-500';
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

  if (isLeaf || isAccountNode) {
    const isHighlighted = highlightedAccounts.has(node.n);
    return (
      <>
        <tr onClick={() => !isLeaf && setIsOpen(!isOpen)} className={`border-b border-gray-200 cursor-pointer transition-colors ${isHighlighted ? 'bg-amber-100/80 hover:bg-amber-200 border-l-4 border-amber-500' : 'bg-white hover:bg-slate-50 border-l-4 border-slate-400'}`}>
          <td style={indent} className="py-2.5 px-3 font-bold text-[11px] text-slate-900 uppercase select-none flex items-center flex-wrap gap-2">
            {!isLeaf && <span className={`inline-flex items-center justify-center w-4 h-4 border rounded-sm text-[11px] leading-none transition-colors ${isOpen ? 'border-slate-500 text-slate-600 bg-slate-100' : 'border-slate-300 text-slate-400 bg-white'}`}>{isOpen ? '−' : '+'}</span>}
            <button onClick={(e) => { e.stopPropagation(); toggleHighlight(node.n); }} className="focus:outline-none transition-transform hover:scale-110"><Star size={16} fill={isHighlighted ? "#f59e0b" : "none"} color={isHighlighted ? "#f59e0b" : "#cbd5e1"} /></button>
            <span className="truncate">{node.n}</span>
            {hasMapping && isBalance && (
              <button onClick={(e) => { 
                e.stopPropagation(); 
                const typeToPass = accountCode ? accountCode : (node.n.toUpperCase().includes('COBRAR') ? 'cxc' : 'cxp');
                onShowReport(typeToPass); 
              }} className="ml-2 px-2.5 py-1 bg-blue-600 text-white rounded-md text-[9px] font-black tracking-widest hover:bg-blue-700 shadow-md flex items-center gap-1">
                <Search size={10}/> VER REPORTE
              </button>
            )}
          </td>
          <td className={`py-2.5 px-3 text-right font-mono text-[11px] font-bold ${isHighlighted ? 'text-amber-900' : 'text-slate-800'}`}>{fmtCur(Math.abs(node.u))}</td>
          <td className={`py-2.5 px-3 text-right font-mono text-[11px] font-bold hidden sm:table-cell ${isHighlighted ? 'text-amber-900' : 'text-slate-800'}`}>{fmtCur(Math.abs(node.b))}</td>
          <td className={`py-2.5 px-3 text-right font-mono text-[11px] font-bold ${isHighlighted ? 'text-amber-700' : 'text-slate-500'}`}>{pct}</td>
        </tr>
        {isOpen && node.c && node.c.map((child, i) => (
          <ExpandableRow key={i} node={child} level={level + 1} totalBaseUSD={totalBaseUSD} defaultOpen={defaultOpen} highlightedAccounts={highlightedAccounts} toggleHighlight={toggleHighlight} onShowReport={onShowReport} isBalance={isBalance}/>
        ))}
      </>
    );
  }
  return null;
};

// ============================================================================
// 4. VISTA: SUB-REPORTE DETALLADO (CXC / CXP)
// ============================================================================
function AuxiliarReportView({ accountCode, onBack, auxDataConfig }) {
  const mapInfo = ACCOUNT_MAPS[accountCode] || { type: accountCode === 'cxc' ? 'cxc' : 'cxp', filter: 'ALL', label: 'Reporte General' };
  const allData = auxDataConfig[mapInfo.type] || [];
  
  const filteredData = (!mapInfo.filter || mapInfo.filter === 'ALL')
    ? allData
    : allData.filter(d => d.nombre.toUpperCase().includes(mapInfo.filter.toUpperCase()));

  const total = filteredData.reduce((acc, curr) => acc + curr.monto, 0);
  const fmtCur = (v) => new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);

  return (
    <div className="animate-in fade-in duration-300">
      <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-black text-xs uppercase mb-4 transition-colors"><ArrowLeft size={16}/> Volver al Balance</button>
      <div className="flex items-center justify-between mb-6 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
            {mapInfo.type.includes('cxc') ? <Users className="text-blue-500"/> : <Briefcase className="text-red-500"/>}
            Auxiliar Detallado
          </h2>
          <p className="text-xs font-bold text-slate-400 uppercase mt-1">
            {accountCode.includes('.') ? `Cuenta: ${accountCode} - ${mapInfo.label}` : 'Reporte Consolidado'}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Saldo en Cuenta</p>
          <p className={`text-2xl font-mono font-black ${mapInfo.type.includes('cxc') ? 'text-blue-600' : 'text-red-600'}`}>USD {fmtCur(total)}</p>
        </div>
      </div>
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-800 text-[10px] uppercase font-black text-slate-300">
            <tr><th className="px-4 py-4">Código</th><th className="px-4 py-4">Sujeto Comercial</th><th className="px-4 py-4">Documento</th><th className="px-4 py-4">Vence</th><th className="px-4 py-4 text-right">Monto USD</th></tr>
          </thead>
          <tbody>
            {filteredData.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-8 text-slate-400 font-bold">Sin transacciones registradas en este auxiliar.</td></tr>
            ) : (
              filteredData.map((item, i) => (
                <tr key={i} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-xs font-bold text-slate-500">{item.cod}</td>
                  <td className="px-4 py-3 text-xs font-black text-slate-800">{item.nombre}</td>
                  <td className="px-4 py-3 text-xs text-slate-600 font-mono">{item.doc}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{item.vence}</td>
                  <td className={`px-4 py-3 text-right text-sm font-mono font-bold ${item.monto < 0 ? 'text-red-500' : 'text-slate-900'}`}>{fmtCur(item.monto)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================================
// 5. VISTA: ESTADO DE RESULTADOS (CERRADA Y ESTABLE)
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
        <div className="flex items-center gap-4 flex-wrap">
          <button onClick={onBack} className="flex items-center gap-2 font-black text-xs text-slate-600 uppercase hover:text-orange-600 transition-colors"><ArrowLeft size={16}/> Volver al Panel</button>
          <div className="flex items-center gap-2 border-l-2 border-slate-200 pl-4 flex-wrap">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mr-1">Filtro:</span>
            <button onClick={() => setSelectedMonth('General')} className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase shadow-sm transition-all ${selectedMonth === 'General' ? 'bg-slate-800 text-white ring-2 ring-slate-300' : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-100'}`}>General</button>
            {availableMonths.map(m => <button key={m} onClick={() => setSelectedMonth(m)} className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase shadow-sm transition-all ${selectedMonth === m ? 'bg-orange-600 text-white ring-2 ring-orange-200' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}>{m}</button>)}
          </div>
        </div>
        <div className="flex gap-2 bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button onClick={() => { setDefaultOpen(true); setExpandKey(k=>k+1); }} className="px-3 py-1.5 rounded text-[10px] font-black uppercase flex items-center gap-1 hover:bg-white"><ChevronDown size={14}/> Expandir</button>
          <button onClick={() => { setDefaultOpen(false); setExpandKey(k=>k+1); }} className="px-3 py-1.5 rounded text-[10px] font-black uppercase flex items-center gap-1 hover:bg-white"><ChevronRight size={14}/> Contraer</button>
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
// 6. VISTA: ANÁLISIS COMPARATIVO (CERRADA Y ESTABLE, PLANA)
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
        <button onClick={onBack} className="flex items-center gap-2 font-black text-xs text-slate-600 uppercase hover:text-indigo-600"><ArrowLeft size={16}/> Volver al Panel</button>
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
// 7. VISTA: BALANCE GENERAL (UN SOLO MES)
// ============================================================================
function BalanceGeneralView({ onBack, dbData, auxDataConfig }) {
  const availableMonths = useMemo(() => {
    const balanceRecords = dbData.filter(item => item.path.toUpperCase().includes('ACTIVO') || item.path.toUpperCase().includes('PASIVO') || item.path.toUpperCase().includes('PATRIMONIO') || /^[123]/.test(item.name));
    return [...new Set(balanceRecords.map(d => d.month))];
  }, [dbData]);
  
  const [selectedMonth, setSelectedMonth] = useState(availableMonths[availableMonths.length - 1] || ''); 
  const [defaultOpen, setDefaultOpen] = useState(false);
  const [expandKey, setExpandKey] = useState(0);
  const [activeCode, setActiveCode] = useState(null);

  const [highlightedAccounts, setHighlightedAccounts] = useState(() => {
    try { const saved = localStorage.getItem('jiret_highlighted_accounts'); return saved ? new Set(JSON.parse(saved)) : new Set(); } catch(e){return new Set();}
  });
  useEffect(() => { localStorage.setItem('jiret_highlighted_accounts', JSON.stringify([...highlightedAccounts])); }, [highlightedAccounts]);

  const tree = useMemo(() => {
    const root = [];
    const monthData = dbData.filter(d => d.month === selectedMonth);
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

  if (activeCode) return <AuxiliarReportView accountCode={activeCode} onBack={() => setActiveCode(null)} auxDataConfig={auxDataConfig} />;

  return (
    <div className="min-h-screen bg-[#f1f5f9]">
      <header className="bg-white border-b-2 border-blue-500 p-4 flex justify-between items-center sticky top-0 z-30 shadow-md">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="flex items-center gap-2 font-black text-xs text-slate-600 uppercase hover:text-blue-600 transition-colors"><ArrowLeft size={16}/> Salir al Panel</button>
          {availableMonths.length > 0 && (
            <div className="border-l-2 border-slate-200 pl-4 flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Corte al Mes:</span>
              <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="bg-blue-50 border border-blue-300 text-blue-700 text-xs rounded-lg block p-1.5 font-bold uppercase cursor-pointer outline-none">
                {availableMonths.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          )}
        </div>
        <div className="flex gap-2 bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button onClick={() => { setDefaultOpen(true); setExpandKey(k=>k+1); }} className="px-3 py-1.5 rounded text-[10px] font-black uppercase flex items-center gap-1 hover:bg-white"><ChevronDown size={14}/> Expandir</button>
          <button onClick={() => { setDefaultOpen(false); setExpandKey(k=>k+1); }} className="px-3 py-1.5 rounded text-[10px] font-black uppercase flex items-center gap-1 hover:bg-white"><ChevronRight size={14}/> Contraer</button>
        </div>
      </header>
      <main className="p-4 md:p-8 max-w-6xl mx-auto pb-16">
        <div className="bg-white px-8 py-10 border-t-8 border-blue-500 shadow-xl flex flex-col items-center text-center mb-6 rounded-b-2xl">
          <h1 className="text-3xl font-black text-slate-900 uppercase mb-2 tracking-tighter">Servicios Jiret G&B, C.A.</h1>
          <h2 className="text-xl font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-2 mb-4 w-full max-w-md">Balance de Situación Financiera</h2>
          <p className="text-blue-600 font-black uppercase flex items-center gap-2 bg-blue-50 px-5 py-2 rounded-full text-[10px] border border-blue-100 shadow-sm"><Landmark size={14}/> {selectedMonth ? `Corte de Mes: ${selectedMonth}` : 'Sin datos'}</p>
        </div>
        
        {dbData.length === 0 || tree.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-xl border border-slate-200 shadow-sm">
            <AlertTriangle className="mx-auto text-blue-400 mb-4" size={48}/>
            <p className="text-slate-500 font-black text-xs uppercase tracking-wider mb-2">No se detectaron cuentas de Balance en el mes seleccionado.</p>
            <p className="text-slate-400 text-[10px] mt-2">Asegúrate de cargar tu Plan de Cuentas y luego el TXT con los saldos iniciales.</p>
          </div>
        ) : (
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
        )}
      </main>
    </div>
  );
}

// ============================================================================
// 8. COMPONENTE PRINCIPAL / DASHBOARD REDISEÑADO
// ============================================================================
function ReportesFinancierosApp() {
  const [view, setView] = useState('dashboard');
  
  const [dbData, setDbData] = useState(() => {
    try { const saved = localStorage.getItem('jiret_erp_db_data'); return saved ? JSON.parse(saved) : []; } catch(e){return [];}
  });
  const [planCuentas, setPlanCuentas] = useState(() => {
    try { const saved = localStorage.getItem('jiret_plan_cuentas'); return saved ? JSON.parse(saved) : {}; } catch(e){return {};}
  });
  const [auxDataConfig, setAuxDataConfig] = useState(() => {
    try { const saved = localStorage.getItem('jiret_erp_aux_data'); return saved ? JSON.parse(saved) : {}; } catch(e){return {};}
  });

  useEffect(() => { localStorage.setItem('jiret_erp_db_data', JSON.stringify(dbData)); }, [dbData]);
  useEffect(() => { localStorage.setItem('jiret_plan_cuentas', JSON.stringify(planCuentas)); }, [planCuentas]);
  useEffect(() => { localStorage.setItem('jiret_erp_aux_data', JSON.stringify(auxDataConfig)); }, [auxDataConfig]);

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
      alert("✅ Plan de cuentas cargado. Ahora el sistema sabe estructurar el Balance.");
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

  const handleUploadAuxCxC = async (e) => {
    if (!e.target.files.length) return;
    try {
      const parsed = await processAuxFile(e.target.files, 'cxc');
      setAuxDataConfig(prev => ({
        ...prev,
        cxc_general: [...(prev.cxc_general || []), ...parsed.cxc_general],
        cxc_zuliana: [...(prev.cxc_zuliana || []), ...parsed.cxc_zuliana],
      }));
      const total = parsed.cxc_general.length + parsed.cxc_zuliana.length;
      alert(`✅ CxC procesado: ${total} líneas mapeadas.\n• Clientes generales (1.1.02.01.001): ${parsed.cxc_general.length}\n• Zuliana de Empaque (1.1.05.01.008): ${parsed.cxc_zuliana.length}`);
    } catch (err) { alert("❌ Error al procesar CxC: " + err.message); }
    e.target.value = '';
  };

  const handleUploadAuxCxP = async (e) => {
    if (!e.target.files.length) return;
    try {
      const parsed = await processAuxFile(e.target.files, 'cxp');
      setAuxDataConfig(prev => ({
        ...prev,
        cxp_autototal:  [...(prev.cxp_autototal  || []), ...parsed.cxp_autototal],
        cxp_surepack:   [...(prev.cxp_surepack   || []), ...parsed.cxp_surepack],
        cxp_pacomela:   [...(prev.cxp_pacomela   || []), ...parsed.cxp_pacomela],
        cxp_yancarlos:  [...(prev.cxp_yancarlos  || []), ...parsed.cxp_yancarlos],
      }));
      const total = parsed.cxp_autototal.length + parsed.cxp_surepack.length + parsed.cxp_pacomela.length + parsed.cxp_yancarlos.length;
      alert(`✅ CxP procesado: ${total} líneas mapeadas.\n• Auto Total (2.1.01.02.008): ${parsed.cxp_autototal.length}\n• Sure Pack (2.1.01.01.004): ${parsed.cxp_surepack.length}\n• Pacomela (2.1.01.02.007): ${parsed.cxp_pacomela.length}\n• Yancarlos Pérez (2.1.01.01.003): ${parsed.cxp_yancarlos.length}`);
    } catch (err) { alert("❌ Error al procesar CxP: " + err.message); }
    e.target.value = '';
  };

  const handleSimulatePDFs = () => {
    setAuxDataConfig(DEFAULT_AUX_DATA);
    alert("✅ PDFs auxiliares procesados y mapeados al Balance General.");
  };

  const handleDeleteMonth = (monthToDelete) => {
    if (window.confirm(`¿Eliminar los datos de ${monthToDelete}?`)) {
      setDbData(prev => prev.filter(d => d.month !== monthToDelete));
    }
  };

  const loadedMonths = [...new Set(dbData.map(d => d.month))].filter(m => m !== 'Sin Mes');
  const hasPlan = Object.keys(planCuentas).length > 0;
  const hasAuxData = Object.keys(auxDataConfig).length > 0;

  if (view === 'resultado') return <EstadoResultadoView onBack={() => setView('dashboard')} dbData={dbData} />;
  if (view === 'comparativo') return <AnalisisComparativoView onBack={() => setView('dashboard')} dbData={dbData} />;
  if (view === 'balance') return <BalanceGeneralView onBack={() => setView('dashboard')} dbData={dbData} auxDataConfig={auxDataConfig} />;
  
  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <header className="px-6 py-4 bg-[#111827] border-b-4 border-orange-500 flex justify-between items-center shadow-lg">
        <h1 className="text-white font-black text-xl tracking-widest uppercase flex items-center gap-2">Jiret G&B <span className="text-orange-500 px-2 py-0.5 rounded bg-orange-500/10 text-sm">Finance</span></h1>
        <button onClick={() => { if(window.confirm("¿Borrar todos los datos?")) { setDbData([]); setPlanCuentas({}); setAuxDataConfig({}); } }} className="text-red-400 hover:text-red-500 transition-colors text-[10px] font-black uppercase">Limpiar Memoria</button>
      </header>
      <main className="max-w-7xl mx-auto p-6 lg:p-8 mt-4 grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* PANEL LATERAL DE CARGA */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 text-center">
            <Database className="mx-auto text-slate-300 mb-4" size={40}/>
            <h3 className="font-black text-slate-800 text-sm uppercase mb-2">Ingesta de Datos</h3>
            <p className="text-[11px] text-slate-500 mb-5 leading-relaxed font-medium">Carga en orden para habilitar los módulos de Balance y Resultados.</p>
            
            <label className={`${hasPlan ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-slate-800 text-white'} px-4 py-2.5 rounded-xl font-black uppercase text-[9px] tracking-widest cursor-pointer hover:bg-emerald-500 hover:text-white transition-colors flex items-center justify-center gap-2 w-full shadow-sm mb-3`}>
              {hasPlan ? <CheckCircle size={14}/> : <BookOpen size={14}/>} {hasPlan ? 'Plan Cargado' : '1. Cargar Plan Cuentas'}
              <input type="file" accept=".txt" className="hidden" onChange={handleUploadPlan}/>
            </label>

            <label className={`${!hasPlan ? 'opacity-50 cursor-not-allowed' : 'bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-600 hover:text-white'} px-4 py-2.5 rounded-xl font-black uppercase text-[9px] tracking-widest cursor-pointer transition-colors flex items-center justify-center gap-2 w-full shadow-sm mb-3`}>
              <Scale size={14}/> 2. Saldos Iniciales (Bal)
              <input type="file" disabled={!hasPlan} accept=".txt" className="hidden" onChange={handleUploadSaldos}/>
            </label>

            <label className="bg-orange-50 text-orange-600 border border-orange-200 px-4 py-2.5 rounded-xl font-black uppercase text-[9px] tracking-widest cursor-pointer hover:bg-orange-500 hover:text-white transition-colors flex items-center justify-center gap-2 w-full shadow-sm mb-3">
              <LineChart size={14}/> 3. Subir Resultados
              <input type="file" multiple accept=".xlsx,.xls,.xlsm,.txt,.csv" className="hidden" onChange={handleUploadResultados}/>
            </label>

            <label className={`${auxDataConfig?.cxc_general?.length > 0 || auxDataConfig?.cxc_zuliana?.length > 0 ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-teal-50 text-teal-600 border border-teal-200 hover:bg-teal-600 hover:text-white'} px-4 py-2.5 rounded-xl font-black uppercase text-[9px] tracking-widest cursor-pointer transition-colors flex items-center justify-center gap-2 w-full shadow-sm mb-2`}>
              {(auxDataConfig?.cxc_general?.length > 0 || auxDataConfig?.cxc_zuliana?.length > 0) ? <CheckCircle size={14}/> : <Users size={14}/>}
              {(auxDataConfig?.cxc_general?.length > 0 || auxDataConfig?.cxc_zuliana?.length > 0) ? `CxC (${(auxDataConfig.cxc_general?.length||0)+(auxDataConfig.cxc_zuliana?.length||0)} reg.)` : '4a. Auxiliar CxC'}
              <input type="file" multiple accept=".xlsx,.xls,.xlsm,.csv,.txt" className="hidden" onChange={handleUploadAuxCxC}/>
            </label>

            <label className={`${auxDataConfig?.cxp_surepack?.length > 0 || auxDataConfig?.cxp_autototal?.length > 0 ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-600 hover:text-white'} px-4 py-2.5 rounded-xl font-black uppercase text-[9px] tracking-widest cursor-pointer transition-colors flex items-center justify-center gap-2 w-full shadow-sm mb-3`}>
              {(auxDataConfig?.cxp_surepack?.length > 0 || auxDataConfig?.cxp_autototal?.length > 0) ? <CheckCircle size={14}/> : <Briefcase size={14}/>}
              {(auxDataConfig?.cxp_surepack?.length > 0 || auxDataConfig?.cxp_autototal?.length > 0) ? `CxP (${(auxDataConfig.cxp_surepack?.length||0)+(auxDataConfig.cxp_autototal?.length||0)+(auxDataConfig.cxp_pacomela?.length||0)+(auxDataConfig.cxp_yancarlos?.length||0)} reg.)` : '4b. Auxiliar CxP'}
              <input type="file" multiple accept=".xlsx,.xls,.xlsm,.csv,.txt" className="hidden" onChange={handleUploadAuxCxP}/>
            </label>

            <button onClick={handleSimulatePDFs} className="bg-slate-100 text-slate-400 border border-slate-200 hover:bg-slate-200 px-4 py-2 rounded-xl font-black uppercase text-[8px] tracking-widest transition-colors flex items-center justify-center gap-2 w-full shadow-sm">
              <FileOutput size={12}/> Cargar datos de demo
            </button>
          </div>
          
          {loadedMonths.length > 0 && (
            <div className="bg-emerald-50 rounded-3xl p-6 border border-emerald-100">
              <p className="text-emerald-800 font-black text-[10px] uppercase tracking-widest mb-4 flex items-center gap-2"><CheckCircle size={14}/> Meses en Memoria</p>
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

        {/* MÓDULOS PRINCIPALES */}
        <div className="lg:col-span-3 space-y-8">
          <div className="bg-white rounded-3xl p-8 lg:p-10 shadow-sm border-l-8 border-orange-500 relative overflow-hidden flex flex-col justify-center min-h-[220px]">
            <div className="absolute top-0 right-0 w-80 h-80 bg-orange-50 rounded-full blur-3xl -mr-20 -mt-20 opacity-70"></div>
            <h2 className="text-3xl lg:text-4xl font-black text-slate-900 uppercase tracking-tight mb-2 relative z-10">Servicios Jiret G&B, C.A.</h2>
            <p className="text-sm font-bold text-slate-500 tracking-[0.3em] mb-6 relative z-10">RIF: J-412309374</p>
            <p className="text-sm text-slate-600 max-w-2xl relative z-10 leading-relaxed font-medium">Panel financiero integral. El Balance General ahora te permite ver cortes mensuales limpios y cuenta con el mapeo de auxiliares pre-cargado.</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            <button onClick={() => dbData.length > 0 ? setView('resultado') : alert('Carga Resultados primero.')} className="group bg-white p-6 rounded-3xl shadow-sm border-b-4 border-orange-500 text-left transition-all hover:shadow-xl hover:-translate-y-1">
              <div className="bg-orange-50 w-14 h-14 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform"><LineChart className="text-orange-500" size={28}/></div>
              <h3 className="font-black uppercase text-base text-slate-900">Estado de Resultados</h3>
            </button>
            <button onClick={() => dbData.length > 0 ? setView('balance') : alert('Carga Saldos de Balance primero.')} className="group bg-white p-6 rounded-3xl shadow-sm border-b-4 border-blue-500 text-left transition-all hover:shadow-xl hover:-translate-y-1">
              <div className="bg-blue-50 w-14 h-14 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform"><Scale className="text-blue-500" size={28}/></div>
              <h3 className="font-black uppercase text-base text-slate-900">Balance General</h3>
            </button>
            <button onClick={() => dbData.length >= 2 ? setView('comparativo') : alert('Para comparar necesitas cargar al menos 2 meses.')} className="group bg-white p-6 rounded-3xl shadow-sm border-b-4 border-indigo-500 text-left transition-all hover:shadow-xl hover:-translate-y-1">
              <div className="bg-indigo-50 w-14 h-14 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform"><GitCompare className="text-indigo-500" size={28}/></div>
              <h3 className="font-black uppercase text-base text-slate-900">Variaciones</h3>
            </button>
            <div className="bg-white p-6 rounded-3xl shadow-sm border-b-4 border-teal-500 opacity-50 text-left cursor-not-allowed">
              <div className="bg-teal-50 w-14 h-14 rounded-2xl flex items-center justify-center mb-5"><Landmark className="text-teal-500" size={28}/></div>
              <h3 className="font-black uppercase text-base text-slate-900">Inversiones</h3>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default ReportesFinancierosApp;

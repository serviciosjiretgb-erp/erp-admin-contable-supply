import React, { useState, useMemo, useEffect } from 'react';
import {
  ArrowLeft, Upload, Scale, LineChart, AlertTriangle, ChevronRight,
  ChevronDown, Star, PlusCircle, Trash2, ArrowUpRight, GitCompare, Landmark,
  Search, Database, Printer, Download, Activity, X, Edit, Save,
  Bell, Settings, LogOut, BookOpen, TrendingUp, CreditCard, BarChart2,
  FileText, Users, Filter, Clock
} from 'lucide-react';

// ============================================================================
// 0. ESTILOS DE IMPRESIÓN
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
// 1. EXPORT EXCEL — desde tabla DOM o desde datos JS
// ============================================================================
const handleExportExcel = (tableId, fileName, reportTitle) => {
  if (!window.XLSX) { alert("Cargando librería de Excel..."); return; }
  const table = document.getElementById(tableId);
  const wsTable = window.XLSX.utils.table_to_sheet(table);
  const tableData = window.XLSX.utils.sheet_to_json(wsTable, { header: 1 });
  const headerData = [
    ["SERVICIOS JIRET G&B, C.A."], ["RIF: J-412309374"],
    [reportTitle ? reportTitle.toUpperCase() : fileName.toUpperCase()],
    [`Fecha de reporte: ${new Date().toLocaleDateString()}`], []
  ];
  const ws = window.XLSX.utils.aoa_to_sheet([...headerData, ...tableData]);
  ws['!cols'] = [{ wch: 55 }, { wch: 18 }, { wch: 18 }, { wch: 12 }, { wch: 12 }];
  const wb = window.XLSX.utils.book_new();
  window.XLSX.utils.book_append_sheet(wb, ws, "Reporte");
  window.XLSX.writeFile(wb, `${fileName}.xlsx`);
};

const handleExportExcelFromData = (records, fileName, title) => {
  if (!window.XLSX) { alert("Cargando librería Excel..."); return; }
  const headers = ['Código','Descripción','Operación','Emisión','Vencimiento','Días','No. Documento','Desc. Operación','Monto USD','Cuenta Contable'];
  const fmtD = (v) => {
    if (!v) return '';
    if (typeof v === 'number' && v > 40000 && v < 60000) {
      const d = new Date(Math.round((v - 25569) * 86400 * 1000));
      return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
    }
    return String(v);
  };
  const rows = records.map(r => [r.cod, r.nombre, r.operacion, fmtD(r.emision), fmtD(r.vencimiento), r.dias, r.noDocumento, r.descOperacion, r.monto, r.cuentaContable]);
  const ws = window.XLSX.utils.aoa_to_sheet([
    ["SERVICIOS JIRET G&B, C.A."], ["RIF: J-412309374"],
    [title.toUpperCase()], [`Fecha: ${new Date().toLocaleDateString()}`], [], headers, ...rows
  ]);
  ws['!cols'] = [10,30,12,12,12,6,15,30,14,35].map(w => ({ wch: w }));
  const wb = window.XLSX.utils.book_new();
  window.XLSX.utils.book_append_sheet(wb, ws, "Auxiliar");
  window.XLSX.writeFile(wb, `${fileName}.xlsx`);
};

// ============================================================================
// 2. CARGA DE SHEETJS + PARSERS
// ============================================================================
const loadSheetJS = () => new Promise((r) => {
  if (window.XLSX) return r(window.XLSX);
  const s = document.createElement('script');
  s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
  s.onload = () => r(window.XLSX);
  document.head.appendChild(s);
});

const monthOrder = { "Saldos Iniciales": 0, "Enero": 1, "Febrero": 2, "Marzo": 3, "Abril": 4, "Mayo": 5, "Junio": 6, "Julio": 7, "Agosto": 8, "Septiembre": 9, "Octubre": 10, "Noviembre": 11, "Diciembre": 12 };

// Parser meses/resultados — sin cambios
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
        allParsedData.push({ month, year, path: pathStack.join('>'), name, usd, bs: bs || 0 });
      } else {
        pathStack.push(name);
      }
    });
  }
  return allParsedData;
};

// Plan de cuentas — sin cambios
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

// ★ NUEVO: Saldos Iniciales desde .TXT (TSV)
// Formato esperado: Cuenta Contable \t SALDO USD \t SALDO BS
const processSaldosBalance = async (file, planCuentas) => {
  const text = await file.text();
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  const yearMatch = file.name.match(/20\d{2}/);
  const year = yearMatch ? yearMatch[0] : new Date().getFullYear().toString();

  const parseVal = (v) => {
    if (!v) return 0;
    let s = String(v).replace(/USD|Bs\./ig, '').replace(/\s/g, '').trim();
    // Formato español: 65.712,84 → 65712.84
    if (s.includes(',') && s.includes('.')) {
      s = s.replace(/\./g, '').replace(/,/g, '.');
    } else if (s.includes(',')) {
      s = s.replace(/,/g, '.');
    }
    return isNaN(parseFloat(s)) ? 0 : parseFloat(s);
  };

  return lines
    .filter((l, i) => i > 0 && l.includes('\t'))
    .map(line => {
      const cols = line.split('\t');
      const rawName = cols[0] ? String(cols[0]).trim() : '';
      if (!rawName) return null;
      const isAuxAccount = rawName.startsWith('1.1.02') || rawName.startsWith('2.1.01');
      const nameParts = rawName.split('-');
      const cleanName = nameParts.length > 1 ? nameParts.slice(1).join('-').trim() : rawName;
      let path = planCuentas[cleanName] || planCuentas[rawName];
      if (!path) {
        if (rawName.startsWith('1.')) path = 'ACTIVOS>OTROS ACTIVOS';
        else if (rawName.startsWith('2.')) path = 'PASIVOS>OTROS PASIVOS';
        else if (rawName.startsWith('3.')) path = 'PATRIMONIO>CAPITAL';
        else path = 'OTROS';
      }
      return {
        month: 'Saldos Iniciales', year, path, name: rawName,
        usd: isAuxAccount ? 0 : parseVal(cols[1]),
        bs: isAuxAccount ? 0 : parseVal(cols[2])
      };
    })
    .filter(Boolean);
};

// ★ NUEVO: Auxiliar CxC o CxP desde Excel con columnas completas
const processAuxExcel = async (files) => {
  const XL = await loadSheetJS();
  const nk = (k) => String(k).trim().toLowerCase()
    .replace(/á/g,'a').replace(/é/g,'e').replace(/í/g,'i').replace(/ó/g,'o').replace(/ú/g,'u')
    .replace(/ñ/g,'n');
  const parseVal = (v) => {
    if (!v) return 0;
    if (typeof v === 'number') return v;
    let s = String(v).replace(/\$|Bs\.|USD/ig, '').trim();
    if (s.includes(',') && s.includes('.')) s = s.replace(/\./g, '').replace(/,/g, '.');
    else if (s.includes(',')) s = s.replace(/,/g, '.');
    return isNaN(parseFloat(s)) ? 0 : parseFloat(s);
  };
  const records = [];
  for (const file of Array.from(files)) {
    const buffer = await file.arrayBuffer();
    const wb = XL.read(buffer, { type: 'array' });
    for (const sheetName of wb.SheetNames) {
      const rows = XL.utils.sheet_to_json(wb.Sheets[sheetName], { defval: null });
      rows.forEach(rawRow => {
        const row = {};
        for (const k in rawRow) { row[nk(k)] = rawRow[k]; }
        records.push({
          cod: String(row['codigo'] || '-').trim(),
          nombre: String(row['descripcion'] || '-').trim(),
          operacion: String(row['operacion'] || '-').trim(),
          emision: row['emision'] || '',
          vencimiento: row['vencimiento'] || '',
          dias: row['dias'] || 0,
          noDocumento: String(row['no. documento'] || row['no documento'] || row['documento'] || '-').trim(),
          descOperacion: String(row['descripcion de operacion'] || '-').trim(),
          monto: parseVal(row['monto']),
          cuentaContable: String(row['cuenta contable'] || '-').trim()
        });
      });
    }
  }
  return { records };
};

// ★ NUEVO: Auxiliar Activos Fijos desde Excel
// Columnas: Cant | MOBILIARIO Y EQUIPO | SEDE | CUENTA | DEPRECIACION | DEPRECIACION ACUM |
//           FECHA DE ADQUISICION | VIDA UTIL ASIGNADA | VIDA UTIL TRANSCURRIDA |
//           COSTO ADQUISICION USD | COSTO ADQUISICION BS | DEP.ACUM | VALOR NETO LIBROS |
//           DEPRE. MENSUAL | Tasa
const processActivosFijosExcel = async (files) => {
  const XL = await loadSheetJS();

  const nk = (k) => String(k || '').trim().toLowerCase()
    .replace(/[áà]/g,'a').replace(/[éè]/g,'e').replace(/[íì]/g,'i')
    .replace(/[óò]/g,'o').replace(/[úù]/g,'u').replace(/ñ/g,'n')
    .replace(/\./g,'').replace(/\s+/g,' ').trim();

  const parseVal = (v) => {
    if (v === null || v === undefined || v === '') return 0;
    if (typeof v === 'number') return v;
    let s = String(v).replace(/\$|Bs\.|USD/ig, '').replace(/\s/g,'').trim();
    if (s.startsWith('(') && s.endsWith(')')) s = '-' + s.slice(1,-1);
    if (s.includes(',') && s.includes('.')) s = s.replace(/\./g,'').replace(/,/g,'.');
    else if (s.includes(',') && !s.includes('.')) s = s.replace(/,/g,'.');
    return isNaN(parseFloat(s)) ? 0 : parseFloat(s);
  };

  const fmtXLDate = (v) => {
    if (!v) return '';
    if (typeof v === 'number' && v > 40000 && v < 80000) {
      const d = new Date(Math.round((v - 25569) * 86400 * 1000));
      return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
    }
    return String(v);
  };

  const SKIP_WORDS = ['cant','mobiliario','sede','cuenta','costo','valor','tasa','vida','depreciacion'];

  const records = [];
  for (const file of Array.from(files)) {
    const buffer = await file.arrayBuffer();
    const wb = XL.read(buffer, { type: 'array', cellDates: false });
    for (const sheetName of wb.SheetNames) {
      const rawRows = XL.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1, defval: null });
      if (!rawRows.length) continue;

      // Localizar fila de encabezados (busca fila con "mobiliario" o "cant"+"costo")
      let hIdx = 0;
      for (let ri = 0; ri < Math.min(10, rawRows.length); ri++) {
        const joined = rawRows[ri].map(c => nk(String(c || ''))).join(' ');
        if (joined.includes('mobiliario') || (joined.includes('cant') && joined.includes('costo'))) {
          hIdx = ri; break;
        }
      }

      const hRow = rawRows[hIdx].map(c => nk(String(c || '')));

      // Busca índice por nombres alternativos
      const ci = (...names) => {
        for (const n of names) {
          const idx = hRow.findIndex(h => h === n || h.includes(n));
          if (idx !== -1) return idx;
        }
        return -1;
      };

      const iCant    = ci('cant','cantidad');
      const iDesc    = ci('mobiliario y equipo','mobiliario','descripcion','activo','bien');
      const iSede    = ci('sede');
      const iCuenta  = ci('cuenta');
      // DEPRECIACION (método, texto) es la primera col con "depreciacion" que NO tiene "acum"
      const iDeprMet = hRow.findIndex(h => h.includes('depreciacion') && !h.includes('acum'));
      // DEPRECIACION ACUM es la col con "depreciacion" Y "acum"
      const iDepAcum1 = hRow.findIndex(h => h.includes('depreciacion') && h.includes('acum'));
      const iFecha   = ci('fecha de adquisicion','fecha adquisicion','fecha');
      const iVUA     = ci('vida util asignada','vida util asig','vida util');
      const iVUT     = ci('vida util transcurrida','vida util trans','vida transcurrida');
      const iCUSD    = ci('costo adquisicion usd','costo usd','costo adquisicion');
      const iCBS     = ci('costo adquisicion bs','costo bs');
      // DEP.ACUM (col 12) = última col con "dep" y "acum" (distinta de iDepAcum1)
      const allDepAcum = hRow.reduce((acc, h, idx) => {
        if ((h === 'depacum' || (h.includes('dep') && h.includes('acum'))) && idx !== iDepAcum1) acc.push(idx);
        return acc;
      }, []);
      const iDepAcum2 = allDepAcum.length ? allDepAcum[allDepAcum.length - 1] : iDepAcum1;
      const iNeto    = ci('valor neto libros','valor neto');
      const iMes     = ci('depre mensual','dep mensual','depreciacion mensual','depre  mensual');
      const iTasa    = ci('tasa');

      const g = (row, idx) => idx >= 0 && idx < row.length ? row[idx] : null;

      for (let ri = hIdx + 1; ri < rawRows.length; ri++) {
        const row = rawRows[ri];
        if (!row || row.every(c => c === null || c === '')) continue;
        const descRaw = String(g(row, iDesc) || '').trim();
        if (!descRaw) continue;
        const descNk = nk(descRaw);
        if (SKIP_WORDS.filter(w => descNk.includes(w)).length >= 3) continue;
        if (/^(total|subtotal|gran total)/i.test(descRaw)) continue;

        records.push({
          cant:            parseVal(g(row, iCant)) || 1,
          descripcion:     descRaw,
          sede:            String(g(row, iSede) || '-').trim(),
          cuenta:          String(g(row, iCuenta) || '-').trim(),
          depreciacion:    String(g(row, iDeprMet) || '-').trim(),
          depreciacionAcum: parseVal(g(row, iDepAcum1)),
          fechaAdq:        fmtXLDate(g(row, iFecha)),
          vidaUtilAsig:    parseVal(g(row, iVUA)),
          vidaUtilTrans:   parseVal(g(row, iVUT)),
          costoUSD:        parseVal(g(row, iCUSD)),
          costoBS:         parseVal(g(row, iCBS)),
          depAcum:         parseVal(g(row, iDepAcum2)),
          valorNeto:       parseVal(g(row, iNeto)),
          depreMensual:    parseVal(g(row, iMes)),
          tasa:            parseVal(g(row, iTasa)),
        });
      }
    }
  }
  return { records };
};

// Export Excel activos fijos con todas las columnas
const handleExportActivosFijosExcel = (records, fileName) => {
  if (!window.XLSX) { alert("Cargando librería Excel..."); return; }
  const headers = ['Cant','MOBILIARIO Y EQUIPO','SEDE','CUENTA','DEPRECIACION','DEPRECIACION ACUM',
    'FECHA DE ADQUISICION','VIDA UTIL ASIGNADA','VIDA UTIL TRANSCURRIDA',
    'COSTO ADQUISICION USD','COSTO ADQUISICION BS','DEP.ACUM','VALOR NETO LIBROS','DEPRE. MENSUAL','Tasa'];
  const rows = records.map(r => [r.cant, r.descripcion, r.sede, r.cuenta, r.depreciacion,
    r.depreciacionAcum, r.fechaAdq, r.vidaUtilAsig, r.vidaUtilTrans,
    r.costoUSD, r.costoBS, r.depAcum, r.valorNeto, r.depreMensual, r.tasa]);
  const ws = window.XLSX.utils.aoa_to_sheet([
    ["SERVICIOS JIRET G&B, C.A."], ["RIF: J-412309374"],
    ["REGISTRO DE ACTIVOS FIJOS"], [`Fecha: ${new Date().toLocaleDateString()}`], [], headers, ...rows
  ]);
  ws['!cols'] = [5,36,14,18,14,14,16,12,12,16,16,14,14,13,8].map(w => ({ wch: w }));
  const wb = window.XLSX.utils.book_new();
  window.XLSX.utils.book_append_sheet(wb, ws, "Activos Fijos");
  window.XLSX.writeFile(wb, `${fileName}.xlsx`);
};

// ============================================================================
// 3. RELOJ EN VIVO
// ============================================================================
function LiveClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => { const id = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(id); }, []);
  const DAYS = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
  const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  const hh = String(now.getHours()).padStart(2,'0');
  const mm = String(now.getMinutes()).padStart(2,'0');
  const ss = String(now.getSeconds()).padStart(2,'0');
  return (
    <div className="text-center leading-tight">
      <p className="text-[15px] font-black font-mono text-slate-900 tracking-wider">{hh}:{mm}:{ss}</p>
      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
        {DAYS[now.getDay()]} {now.getDate()} {MONTHS[now.getMonth()]}. {now.getFullYear()}
      </p>
    </div>
  );
}

// ============================================================================
// 4. MINI CHARTS SVG PARA EL DASHBOARD
// ============================================================================
const MiniLineChart = () => (
  <svg viewBox="0 0 160 60" className="w-full h-12">
    <polyline points="0,50 20,40 40,45 60,25 80,30 100,15 120,20 140,10 160,5"
      fill="none" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <polyline points="0,55 20,50 40,52 60,40 80,42 100,35 120,30 140,28 160,22"
      fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="4 2"/>
  </svg>
);
const MiniBarChart = () => (
  <svg viewBox="0 0 160 60" className="w-full h-12">
    {[14,28,20,42,18,50,30,38,22,46].map((h,i)=>(
      <rect key={i} x={i*16+2} y={60-h} width="12" height={h} rx="2"
        fill={i%2===0?'#f97316':'#fb923c'} opacity={0.7+i*0.03}/>
    ))}
  </svg>
);
const MiniGroupedBar = () => (
  <svg viewBox="0 0 160 60" className="w-full h-12">
    {[0,1,2,3,4].map(i=>(
      <g key={i}>
        <rect x={i*32+2} y={60-[40,50,30,44,36][i]} width="13" height={[40,50,30,44,36][i]} rx="2" fill="#64748b" opacity="0.6"/>
        <rect x={i*32+17} y={60-[28,38,42,30,50][i]} width="13" height={[28,38,42,30,50][i]} rx="2" fill="#f97316" opacity="0.8"/>
      </g>
    ))}
  </svg>
);
const MiniDonut = ({ pct = 0.72, color = '#f97316' }) => {
  const r = 22, cx = 30, cy = 30;
  const circ = 2 * Math.PI * r;
  const dash = circ * pct;
  return (
    <svg viewBox="0 0 60 60" className="h-12">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e2e8f0" strokeWidth="8"/>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="8"
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`}/>
    </svg>
  );
};
const MiniChecklist = () => (
  <div className="space-y-1 text-[10px] font-bold text-slate-500">
    {['Asiento de nómina','Factura de compra','Factura de compra','Factura de compra'].map((l,i)=>(
      <div key={i} className="flex items-center gap-1.5">
        <span className="w-3 h-3 rounded-sm bg-emerald-100 border border-emerald-300 flex items-center justify-center text-[8px] text-emerald-600">✓</span>
        <span className="truncate">{l}</span>
      </div>
    ))}
  </div>
);

// ============================================================================
// 5. FILA EXPANDIBLE (actualizado: botón AUX detecta CxC / CxP por nombre)
// ============================================================================
const ExpandableRow = ({ node, level = 0, totalBaseUSD, defaultOpen = false, highlightedAccounts, toggleHighlight, onShowReport, isBalance = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  useEffect(() => setIsOpen(defaultOpen), [defaultOpen]);
  if (!node) return null;
  const isLeaf = !node.c || node.c.length === 0;
  const fmt = (v) => new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2 }).format(v || 0);
  const indent = { paddingLeft: `${level * 18 + 10}px` };
  const nodeName = (node.n || '').toUpperCase();
  const isCxC = isBalance && (/COBRAR/.test(nodeName) || /^1\.1\.02/.test(nodeName));
  const isCxP = isBalance && (/PAGAR/.test(nodeName) || /^2\.1\.01/.test(nodeName));
  const hasMapping = isCxC || isCxP;
  const auxType = isCxC ? 'cxc' : 'cxp';

  if (!isLeaf && !/^\d\./.test(node.n || '')) {
    const isRoot = level === 0;
    return (
      <>
        <tr onClick={() => setIsOpen(!isOpen)} className={`cursor-pointer ${isRoot ? 'bg-slate-50 border-b border-slate-200' : 'bg-white border-b border-slate-100'}`}>
          <td style={indent} className={`py-3 px-4 font-black text-xs uppercase tracking-widest flex items-center gap-2 ${isRoot ? 'text-slate-800' : 'text-slate-500'}`}>
            <span className="no-print w-5 h-5 border border-slate-300 rounded bg-white text-center leading-[18px] text-[12px] text-slate-500 shadow-sm select-none">{isOpen ? '−' : '+'}</span>
            {node.n}
          </td>
          <td className="py-3 px-4 text-right font-mono font-black text-slate-800">{fmt(Math.abs(node.u))}</td>
          <td className="py-3 px-4 text-right font-mono hidden sm:table-cell text-slate-600">{fmt(Math.abs(node.b))}</td>
          <td className="py-3 px-4 text-right font-mono text-slate-400">{(Math.abs(node.u)/Math.abs(totalBaseUSD||1)*100).toFixed(2)}%</td>
        </tr>
        {isOpen && node.c.map((child, i) => <ExpandableRow key={i} node={child} level={level+1} totalBaseUSD={totalBaseUSD} highlightedAccounts={highlightedAccounts} toggleHighlight={toggleHighlight} onShowReport={onShowReport} isBalance={isBalance}/>)}
        {isOpen && (
          <tr className="bg-slate-100/50 font-black text-[10px] border-t border-slate-200">
            <td style={{ paddingLeft: level * 18 + 28 }} className="py-2.5 px-4 uppercase text-slate-500 tracking-wider">TOTAL {node.n}</td>
            <td className="py-2.5 px-4 text-right font-mono text-slate-900">{fmt(Math.abs(node.u))}</td>
            <td className="py-2.5 px-4 text-right font-mono hidden sm:table-cell text-slate-900">{fmt(Math.abs(node.b))}</td>
            <td className="py-2.5 px-4 text-right font-mono text-slate-400">{(Math.abs(node.u)/Math.abs(totalBaseUSD||1)*100).toFixed(2)}%</td>
          </tr>
        )}
      </>
    );
  }

  const isHigh = highlightedAccounts?.has(node.n);
  // Nodos con nombre numérico (ej: 4.1.01.01.001-INGRESOS...) también pueden tener hijos
  return (
    <>
      <tr
        onClick={() => !isLeaf && setIsOpen(!isOpen)}
        className={`border-b border-slate-50 transition-all ${!isLeaf ? 'cursor-pointer' : ''} ${isHigh ? 'bg-orange-50 border-l-4 border-orange-500' : 'bg-white border-l-4 border-transparent'} hover:bg-slate-50`}
      >
        <td style={indent} className="py-2.5 px-4 font-bold text-[11px] text-slate-700 uppercase">
          <div className="flex items-center gap-2">
            {!isLeaf && (
              <span className="no-print w-5 h-5 border border-slate-300 rounded bg-white text-center leading-[18px] text-[12px] text-slate-500 shadow-sm select-none flex-shrink-0">
                {isOpen ? '−' : '+'}
              </span>
            )}
            {toggleHighlight && <button onClick={(e)=>{e.stopPropagation(); toggleHighlight(node.n)}} className="no-print focus:outline-none flex-shrink-0"><Star size={14} fill={isHigh?"#f97316":"none"} color={isHigh?"#f97316":"#cbd5e1"}/></button>}
            <span className="truncate max-w-[280px]">{node.n}</span>
            {hasMapping && (
              <button onClick={(e)=>{e.stopPropagation(); onShowReport(auxType)}}
                className="no-print ml-1 px-2.5 py-0.5 bg-orange-500 text-white text-[9px] rounded font-black hover:bg-orange-600 shadow-sm transition-colors whitespace-nowrap flex-shrink-0">
                VER AUX
              </button>
            )}
          </div>
        </td>
        <td className="py-2.5 px-4 text-right font-mono text-[11px] text-slate-600">{fmt(Math.abs(node.u))}</td>
        <td className="py-2.5 px-4 text-right font-mono text-[11px] hidden sm:table-cell text-slate-600">{fmt(Math.abs(node.b))}</td>
        <td className="py-2.5 px-4 text-right font-mono text-[11px] text-slate-400">{(Math.abs(node.u)/Math.abs(totalBaseUSD||1)*100).toFixed(2)}%</td>
      </tr>
      {/* Hijos de nodos con código numérico (sub-transacciones / sub-cuentas) */}
      {!isLeaf && isOpen && node.c.map((child, i) => (
        <ExpandableRow key={i} node={child} level={level+1} totalBaseUSD={totalBaseUSD}
          highlightedAccounts={highlightedAccounts} toggleHighlight={toggleHighlight}
          onShowReport={onShowReport} isBalance={isBalance}/>
      ))}
      {!isLeaf && isOpen && (
        <tr className="bg-slate-100/60 font-black text-[10px] border-t border-slate-200">
          <td style={{ paddingLeft: level * 18 + 28 }} className="py-2 px-4 uppercase text-slate-500 tracking-wider">TOTAL {node.n}</td>
          <td className="py-2 px-4 text-right font-mono text-slate-900">{fmt(Math.abs(node.u))}</td>
          <td className="py-2 px-4 text-right font-mono hidden sm:table-cell text-slate-900">{fmt(Math.abs(node.b))}</td>
          <td className="py-2 px-4 text-right font-mono text-slate-400">{(Math.abs(node.u)/Math.abs(totalBaseUSD||1)*100).toFixed(2)}%</td>
        </tr>
      )}
    </>
  );
};

// ============================================================================
// 6. ESTADO DE RESULTADOS — sin cambios estructurales
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
        (i.path || 'OTROS').split('>').forEach(f => {
          let folder = cur.find(n => n.n === f);
          if (!folder) { folder = { n: f, c: [], u: 0, b: 0 }; cur.push(folder); }
          cur = folder.c;
        });
        let leaf = cur.find(n => n.n === i.name);
        if (!leaf) cur.push({ n: i.name, u: i.usd*mult, b: i.bs*mult, isLeaf: true });
        else { leaf.u += i.usd*mult; leaf.b += i.bs*mult; }
      });
      const comp = (nodes) => { let u=0,b=0; nodes.forEach(n => { if(!n.isLeaf){ const t=comp(n.c); n.u=t.u; n.b=t.b; } u+=n.u; b+=n.b; }); return {u,b}; };
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
        <button onClick={onBack} className="flex items-center gap-2 font-black text-xs text-slate-500 uppercase hover:text-slate-900"><ArrowLeft size={16}/> Panel</button>
        <div className="flex gap-2 items-center">
          <select value={selectedYear} onChange={e=>setSelectedYear(e.target.value)} className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl p-2 font-bold outline-none shadow-sm">{availableYears.map(y=><option key={y}>{y}</option>)}</select>
          <select value={selectedMonth} onChange={e=>setSelectedMonth(e.target.value)} className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl p-2 font-bold outline-none shadow-sm"><option value="General">Acumulado General</option>{availableMonths.map(m=><option key={m}>{m}</option>)}</select>
          <button onClick={() => { setDefaultOpen(true); setExpandKey(k=>k+1); }} className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase flex items-center gap-1 hover:bg-slate-200 shadow-sm"><ChevronDown size={14}/> Expandir</button>
          <button onClick={() => { setDefaultOpen(false); setExpandKey(k=>k+1); }} className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase flex items-center gap-1 hover:bg-slate-200 shadow-sm"><ChevronRight size={14}/> Contraer</button>
        </div>
        <div className="flex gap-3">
          <button onClick={()=>window.print()} className="px-5 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase flex items-center gap-2 shadow-md hover:bg-slate-800"><Printer size={14}/> PDF</button>
          <button onClick={()=>handleExportExcel('table-res', `Estado_Resultados_${selectedMonth}`, `Estado de Resultados`)} className="px-5 py-2 bg-orange-500 text-white rounded-xl text-[10px] font-black uppercase flex items-center gap-2 shadow-md hover:bg-orange-600"><Download size={14}/> Excel</button>
        </div>
      </header>
      <main className="max-w-5xl mx-auto print-area">
        <HeaderMembretado isExport={true}/>
        <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden print:shadow-none print:border-none">
          <div className="bg-slate-50 p-8 border-b border-slate-100 text-center print:bg-white">
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-widest">Estado de Resultados</h2>
            <p className="text-slate-500 font-bold uppercase text-xs mt-2 tracking-widest">{selectedMonth === 'General' ? 'Acumulado General' : `Mes: ${selectedMonth}`} - {selectedYear}</p>
          </div>
          <table id="table-res" className="w-full text-left border-collapse">
            <thead className="bg-white text-[10px] font-black text-slate-400 uppercase border-b border-slate-200">
              <tr><th className="px-6 py-5 w-[55%]">Estructura de Cuentas</th><th className="px-4 py-5 text-right">Saldo USD</th><th className="px-4 py-5 text-right hidden sm:table-cell">Saldo Bs.</th><th className="px-4 py-5 text-right">%</th></tr>
            </thead>
            <tbody key={expandKey}>
              <tr className="bg-white border-b border-slate-100 font-black text-xs uppercase"><td colSpan={4} className="px-6 py-5 tracking-widest text-slate-800">I. INGRESOS</td></tr>
              {trees.tIng.map((n,i)=><ExpandableRow key={i} node={n} totalBaseUSD={totals.ti} defaultOpen={defaultOpen}/>)}
              <tr className="bg-slate-50 text-slate-800 font-black border-y-2 border-slate-200"><td className="px-6 py-4 pl-10 text-[11px] uppercase tracking-widest">TOTAL INGRESOS</td><td className="px-4 py-4 text-right font-mono text-sm">{fmtR(totals.ti)}</td><td className="hidden sm:table-cell px-4 py-4 text-right font-mono text-sm">{fmtR(totals.ti*45)}</td><td className="px-4 py-4 text-right font-mono text-sm">100%</td></tr>
              <tr className="bg-white border-b border-slate-100 font-black text-xs uppercase"><td colSpan={4} className="px-6 py-5 pt-8 tracking-widest text-slate-800">II. COSTOS DE VENTA</td></tr>
              {trees.tCos.map((n,i)=><ExpandableRow key={i} node={n} totalBaseUSD={totals.ti} defaultOpen={defaultOpen}/>)}
              <tr className="bg-slate-50 text-slate-800 font-black border-y-2 border-slate-200"><td className="px-6 py-4 pl-10 text-[11px] uppercase tracking-widest">TOTAL COSTOS</td><td className="px-4 py-4 text-right font-mono text-sm">{fmtR(totals.tc)}</td><td className="hidden sm:table-cell px-4 py-4 text-right font-mono text-sm">{fmtR(totals.tc*45)}</td><td className="px-4 py-4 text-right font-mono text-sm">{(totals.tc/(totals.ti||1)*100).toFixed(2)}%</td></tr>
              <tr className="bg-slate-900 text-white font-black border-y-4 border-slate-400 print:bg-slate-200 print:text-black print:border-black"><td className="px-6 py-6 uppercase tracking-widest">III. UTILIDAD BRUTA</td><td className={`px-4 py-6 text-right text-lg font-mono ${totals.ub < 0 ? 'text-red-400':'text-emerald-400'} print:text-black`}>{fmtR(totals.ub)}</td><td className="hidden sm:table-cell"/><td className="px-4 py-6 text-right font-mono text-slate-300 print:text-black">{(Math.abs(totals.ub)/(totals.ti||1)*100).toFixed(2)}%</td></tr>
              <tr className="bg-white border-b border-slate-100 font-black text-xs uppercase"><td colSpan={4} className="px-6 py-5 pt-8 tracking-widest text-slate-800">IV. GASTOS OPERATIVOS</td></tr>
              {trees.tGas.map((n,i)=><ExpandableRow key={i} node={n} totalBaseUSD={totals.ti} defaultOpen={defaultOpen}/>)}
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
// 7. ANÁLISIS COMPARATIVO — sin cambios
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
      <header className="no-print bg-white/80 backdrop-blur-md border-b border-slate-200 p-4 flex flex-wrap justify-between items-center gap-3 sticky top-0 z-30 shadow-sm rounded-b-2xl mb-6">
        <button onClick={onBack} className="flex items-center gap-2 font-black text-xs text-slate-500 uppercase hover:text-slate-900"><ArrowLeft size={16}/> Panel</button>
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Base:</span>
          <select value={year1} onChange={(e) => setYear1(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold outline-none text-xs shadow-sm">{availableYears.map(y=><option key={y}>{y}</option>)}</select>
          <select value={month1} onChange={(e) => setMonth1(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold outline-none text-xs shadow-sm">{months1.map(m => <option key={m}>{m}</option>)}</select>
          <span className="mx-2 text-slate-300 font-black">VS</span>
          <select value={year2} onChange={(e) => setYear2(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold outline-none text-xs shadow-sm">{availableYears.map(y=><option key={y}>{y}</option>)}</select>
          <select value={month2} onChange={(e) => setMonth2(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold outline-none text-xs shadow-sm">{months2.map(m => <option key={m}>{m}</option>)}</select>
        </div>
        <div className="flex gap-3">
          <button onClick={() => window.print()} className="px-5 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase flex items-center gap-2 shadow-md hover:bg-slate-800"><Printer size={14}/> PDF</button>
          <button onClick={() => handleExportExcel('table-comparativo', `Comparativo`, `Análisis Comparativo`)} className="px-5 py-2 bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase flex items-center gap-2 shadow-md hover:bg-emerald-600"><Download size={14}/> Excel</button>
        </div>
      </header>
      <main className="max-w-5xl mx-auto print-area">
        <HeaderMembretado isExport={true} />
        {!month1 || !month2 ? (
          <div className="bg-white p-12 text-center rounded-[2rem] border border-slate-100 shadow-xl mt-10"><AlertTriangle className="mx-auto text-orange-400 mb-6" size={64}/><h2 className="text-2xl font-black text-slate-800 uppercase tracking-widest mb-2">Faltan Datos</h2><p className="text-slate-500 font-bold uppercase text-xs tracking-wider">Carga información de al menos 2 meses.</p></div>
        ) : (
          <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden">
            <div className="bg-slate-50 p-8 border-b border-slate-100 text-center">
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
                        <td className="px-4 py-4 text-right font-mono">{fmtR(cat.m1_u)}</td>
                        <td className="px-4 py-4 text-right font-mono bg-slate-200/50">{fmtR(cat.m2_u)}</td>
                        <td className={`px-4 py-4 text-right font-mono ${cGood?'text-emerald-600':'text-red-500'}`}>{fmtR(cat.m1_u - cat.m2_u)}</td>
                        <td className={`px-4 py-4 text-right font-mono ${cGood?'text-emerald-600':'text-red-500'}`}>{Math.abs(cat.m2_u!==0?((cat.m1_u-cat.m2_u)/Math.abs(cat.m2_u)*100):100).toFixed(2)}%</td>
                      </tr>
                    </React.Fragment>
                  );
                })}
                <tr className="bg-slate-900 text-white font-black border-t-4 border-orange-500 print:bg-slate-300 print:text-black">
                  <td className="px-6 py-6 uppercase text-sm tracking-widest">RESULTADO NETO</td>
                  <td className="px-4 py-6 text-right font-mono text-base border-l border-slate-800">{fmtR(total_m1)}</td>
                  <td className="px-4 py-6 text-right font-mono text-base border-l border-slate-800">{fmtR(total_m2)}</td>
                  <td className={`px-4 py-6 text-right font-mono text-lg border-l border-slate-800 ${varAbsTotal > 0?'text-emerald-400':'text-red-400'}`}>{fmtR(varAbsTotal)}</td>
                  <td className={`px-4 py-6 text-right font-mono text-lg border-l border-slate-800 ${varAbsTotal > 0?'text-emerald-400':'text-red-400'}`}>{Math.abs(varPctTotal).toFixed(2)}%</td>
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
// 8. BALANCE GENERAL (actualizado: cxc/cxp + activos fijos)
// ============================================================================
function BalanceGeneralView({ onBack, dbData, auxDataConfig, activosFijosData, setSubView }) {
  const balanceRecords = useMemo(() => dbData.filter(item => item.path?.toUpperCase().includes('ACTIVO') || item.path?.toUpperCase().includes('PASIVO') || item.path?.toUpperCase().includes('PATRIMONIO') || /^[123]/.test(item.name || '')), [dbData]);
  const availableYears = useMemo(() => [...new Set(balanceRecords.map(d => d.year))].filter(Boolean).sort(), [balanceRecords]);
  const [selectedYear, setSelectedYear] = useState(availableYears[availableYears.length - 1] || new Date().getFullYear().toString());
  const availableMonths = useMemo(() => [...new Set(balanceRecords.filter(d => d.year === selectedYear).map(d => d.month))], [balanceRecords, selectedYear]);
  const defaultMonth = availableMonths.filter(m => m !== 'Saldos Iniciales').pop() || availableMonths[0] || 'Enero';
  const [selectedMonth, setSelectedMonth] = useState(defaultMonth);
  const [tasa, setTasa] = useState(90);

  const tree = useMemo(() => {
    const root = [];
    const selectedMonthIndex = monthOrder[selectedMonth] || 0;
    const cumulativeData = balanceRecords.filter(d => {
      if (d.year !== selectedYear) return false;
      return (monthOrder[d.month] || 0) <= selectedMonthIndex;
    });

    // Entradas auxiliares desde nueva estructura cxc/cxp + activos fijos
    const auxEntries = [];
    if (auxDataConfig?.cxc?.records?.length) {
      const total = auxDataConfig.cxc.records.reduce((s, r) => s + r.monto, 0);
      if (total !== 0) auxEntries.push({ name: '1.1.02-CUENTAS POR COBRAR', path: 'ACTIVOS>ACTIVO CIRCULANTE>CUENTAS POR COBRAR', usd: total, bs: total * tasa });
    }
    if (auxDataConfig?.cxp?.records?.length) {
      const total = auxDataConfig.cxp.records.reduce((s, r) => s + r.monto, 0);
      if (total !== 0) auxEntries.push({ name: '2.1.01-CUENTAS POR PAGAR', path: 'PASIVOS>PASIVO CIRCULANTE>CUENTAS POR PAGAR', usd: total, bs: total * tasa });
    }
    // Activos Fijos: agrupar por CUENTA, sumar VALOR NETO LIBROS
    if (activosFijosData?.records?.length) {
      const cuentaMap = {};
      activosFijosData.records.forEach(r => {
        const cta = r.cuenta && r.cuenta !== '-' ? r.cuenta : 'ACTIVOS FIJOS';
        if (!cuentaMap[cta]) cuentaMap[cta] = { neto: 0, bs: 0 };
        cuentaMap[cta].neto += r.valorNeto;
        cuentaMap[cta].bs   += r.costoBS - (r.depAcum * (r.tasa || tasa));
      });
      Object.entries(cuentaMap).forEach(([cta, v]) => {
        if (v.neto !== 0) {
          auxEntries.push({
            name: cta,
            path: 'ACTIVOS>ACTIVOS NO CORRIENTES>ACTIVOS FIJOS',
            usd: v.neto,
            bs:  v.neto * tasa
          });
        }
      });
    }

    [...cumulativeData, ...auxEntries].forEach(item => {
      let cur = root;
      (item.path || 'OTROS').split('>').forEach(folderName => {
        if (!folderName) return;
        const key = String(folderName).trim().replace(/\s+/g,' ').toUpperCase();
        let folder = cur.find(n => String(n.n).trim().replace(/\s+/g,' ').toUpperCase() === key);
        if (!folder) { folder = { n: folderName.trim(), c: [], u: 0, b: 0 }; cur.push(folder); }
        cur = folder.c;
      });
      const leafKey = String(item.name || '').trim().replace(/\s+/g,' ').toUpperCase();
      let leaf = cur.find(n => String(n.n).trim().replace(/\s+/g,' ').toUpperCase() === leafKey && n.isLeaf);
      if (!leaf) cur.push({ n: String(item.name || '').trim(), u: item.usd, b: item.bs, isLeaf: true });
      else { leaf.u += item.usd; leaf.b += item.bs; }
    });

    const compute = (nodes) => { let u = 0, b = 0; nodes.forEach(n => { if (!n.isLeaf) { const t = compute(n.c); n.u = t.u; n.b = t.b; } u += n.u; b += n.b; }); return { u, b }; };
    compute(root);
    return root.sort((a, b) => {
      const gO = n => { const x=n.toUpperCase(); if(x.includes('ACTIVO')||x.startsWith('1'))return 1; if(x.includes('PASIVO')||x.startsWith('2'))return 2; if(x.includes('PATRIMONIO')||x.startsWith('3'))return 3; return 9; };
      return gO(a.n) - gO(b.n);
    });
  }, [balanceRecords, selectedMonth, selectedYear, tasa, auxDataConfig, activosFijosData]);

  let totalActivos = 0; let totalPasPat = 0;
  tree.forEach(n => { if(n.n.toUpperCase().includes('ACTIVO') || n.n.startsWith('1')) totalActivos += n.u; else totalPasPat += n.u; });
  const fmtR = (v) => new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Math.abs(v));

  return (
    <div className="pb-20 animate-in fade-in">
      <PrintStyles />
      <header className="no-print bg-white/80 backdrop-blur-md border-b border-slate-200 p-4 flex flex-wrap justify-between items-center gap-3 sticky top-0 z-30 shadow-sm rounded-b-2xl mb-6">
        <button onClick={onBack} className="flex items-center gap-2 font-black text-xs text-slate-500 uppercase hover:text-slate-900"><ArrowLeft size={16}/> Panel</button>
        <div className="flex flex-wrap items-center gap-3">
          <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl p-2 font-bold outline-none shadow-sm">{availableYears.map(y=><option key={y}>{y}</option>)}</select>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Corte:</span>
          <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl p-2 font-bold outline-none shadow-sm">{availableMonths.map(m => <option key={m} value={m}>{m}</option>)}</select>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tasa Bs:</span>
          <input type="number" min="1" step="0.01" value={tasa} onChange={e => setTasa(parseFloat(e.target.value) || 1)} className="bg-slate-50 border border-slate-200 rounded-xl p-2 w-24 font-black outline-none text-xs shadow-sm"/>
        </div>
        <div className="flex gap-3">
          <button onClick={() => window.print()} className="px-5 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase flex items-center gap-2 shadow-md hover:bg-slate-800"><Printer size={14}/> PDF</button>
          <button onClick={() => handleExportExcel('table-balance', `Balance_${selectedMonth}`, `Balance General`)} className="px-5 py-2 bg-orange-500 text-white rounded-xl text-[10px] font-black uppercase flex items-center gap-2 shadow-md hover:bg-orange-600"><Download size={14}/> Excel</button>
        </div>
      </header>
      <main className="max-w-5xl mx-auto print-area">
        <HeaderMembretado isExport={true} />
        <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden print:shadow-none print:border-none">
          <div className="bg-slate-50 p-8 border-b border-slate-100 text-center">
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-widest">Balance de Situación Financiera</h2>
            <p className="text-slate-500 font-bold uppercase text-xs mt-2 tracking-widest">Acumulado al Corte: {selectedMonth} {selectedYear}</p>
          </div>
          <table id="table-balance" className="w-full text-left border-collapse">
            <thead className="bg-white text-[10px] font-black text-slate-400 uppercase border-b border-slate-200">
              <tr><th className="px-6 py-5 w-[55%]">Estructura Patrimonial</th><th className="px-4 py-5 text-right">Saldo USD</th><th className="px-4 py-5 text-right hidden sm:table-cell">Equiv. Bs.</th><th className="px-4 py-5 text-right">%</th></tr>
            </thead>
            <tbody>
              {tree.map((node, i) => <ExpandableRow key={i} node={node} totalBaseUSD={totalActivos} defaultOpen={false} onShowReport={(type) => setSubView({type:'auxiliar', code: type})} isBalance={true}/>)}
              <tr className="bg-slate-900 text-white font-black border-t-4 border-slate-400 print:bg-slate-200 print:text-black">
                <td colSpan={4} className="p-8">
                  <div className="flex justify-between items-center px-4">
                    <div className="flex items-center gap-5"><Scale size={40} className="text-slate-400"/><div><p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Ecuación Patrimonial</p><p className="text-sm font-black tracking-widest text-slate-200 print:text-slate-900">ACTIVOS = PASIVOS + PATRIMONIO</p></div></div>
                    <div className="flex gap-10 text-right">
                      <div><p className="text-[10px] text-slate-400 uppercase font-bold">Total Activos</p><p className="text-2xl font-mono text-white print:text-slate-900">USD {fmtR(totalActivos)}</p></div>
                      <div><p className="text-[10px] text-slate-400 uppercase font-bold">Pasivo + Pat.</p><p className="text-2xl font-mono text-white print:text-slate-900">USD {fmtR(totalPasPat)}</p></div>
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
// 9. AUXILIAR COMPLETO — CxC o CxP con búsqueda y columnas completas
// ============================================================================
function AuxiliarFullView({ type, auxDataConfig, onBack }) {
  const data = auxDataConfig?.[type] || { records: [] };
  const [search, setSearch] = useState('');
  const [filterField, setFilterField] = useState('all');

  const fmtDate = (v) => {
    if (!v) return '-';
    if (typeof v === 'number' && v > 40000 && v < 60000) {
      const d = new Date(Math.round((v - 25569) * 86400 * 1000));
      return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
    }
    return String(v);
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return data.records;
    const q = search.toLowerCase();
    return data.records.filter(r => {
      if (filterField === 'cliente') return r.nombre.toLowerCase().includes(q);
      if (filterField === 'documento') return r.noDocumento.toLowerCase().includes(q);
      if (filterField === 'fecha') return fmtDate(r.emision).includes(q) || fmtDate(r.vencimiento).includes(q);
      return r.nombre.toLowerCase().includes(q) || r.noDocumento.toLowerCase().includes(q) ||
             fmtDate(r.emision).includes(q) || fmtDate(r.vencimiento).includes(q) || r.cod.toLowerCase().includes(q);
    });
  }, [data.records, search, filterField]);

  const total = filtered.reduce((s, r) => s + r.monto, 0);
  const fmtM = (v) => new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2 }).format(Math.abs(v));
  const title = type === 'cxc' ? 'Cuentas por Cobrar' : 'Cuentas por Pagar';
  const accentColor = type === 'cxc' ? 'text-blue-600' : 'text-orange-600';

  return (
    <div className="animate-in fade-in pb-20">
      <PrintStyles />
      <header className="no-print bg-white/80 backdrop-blur-md border-b border-slate-200 p-4 flex flex-wrap justify-between items-center gap-3 sticky top-0 z-30 shadow-sm rounded-b-2xl mb-6">
        <button onClick={onBack} className="flex items-center gap-2 font-black text-xs text-slate-500 uppercase hover:text-orange-500 transition-colors"><ArrowLeft size={16}/> Volver</button>
        <div className="flex gap-2 items-center flex-1 min-w-0 max-w-lg">
          <div className="relative flex-1 min-w-0">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por cliente, documento o fecha..."
              className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-orange-400 shadow-sm"/>
          </div>
          <select value={filterField} onChange={e => setFilterField(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-bold outline-none shadow-sm flex-shrink-0">
            <option value="all">Todos los campos</option>
            <option value="cliente">Cliente / Proveedor</option>
            <option value="documento">N° Documento</option>
            <option value="fecha">Fecha</option>
          </select>
          {search && <button onClick={()=>setSearch('')} className="text-slate-400 hover:text-slate-700 flex-shrink-0"><X size={16}/></button>}
        </div>
        <div className="flex gap-3">
          <button onClick={()=>window.print()} className="px-5 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase flex items-center gap-2 shadow-md hover:bg-slate-800"><Printer size={14}/> PDF</button>
          <button onClick={()=>handleExportExcelFromData(filtered, `${type.toUpperCase()}_auxiliar`, title)} className="px-5 py-2 bg-orange-500 text-white rounded-xl text-[10px] font-black uppercase flex items-center gap-2 shadow-md hover:bg-orange-600"><Download size={14}/> Excel</button>
        </div>
      </header>
      <main className="max-w-[1400px] mx-auto print-area px-4">
        <HeaderMembretado isExport={true} />
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl mb-6 flex flex-wrap justify-between items-center gap-4">
          <div>
            <h2 className={`text-2xl font-black uppercase tracking-tighter ${accentColor}`}>{title}</h2>
            <p className="text-slate-400 text-[10px] font-bold uppercase mt-1 tracking-widest">{filtered.length} registros {search ? `(filtrados de ${data.records.length})` : ''}</p>
          </div>
          <div className="text-right bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Saldo Neto USD</p>
            <p className="text-3xl font-mono font-black text-slate-900">USD {fmtM(total)}</p>
          </div>
        </div>
        <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden overflow-x-auto">
          <table id={`table-aux-${type}`} className="w-full text-left border-collapse" style={{minWidth:'1150px'}}>
            <thead className="bg-slate-50 text-slate-400 text-[9px] font-black uppercase border-b border-slate-200 sticky top-0">
              <tr>
                <th className="px-4 py-4 w-20">Código</th>
                <th className="px-4 py-4 w-44">Descripción</th>
                <th className="px-4 py-4 w-24">Operación</th>
                <th className="px-4 py-4 w-28">Emisión</th>
                <th className="px-4 py-4 w-28">Vencimiento</th>
                <th className="px-4 py-4 w-14 text-center">Días</th>
                <th className="px-4 py-4 w-28">No. Documento</th>
                <th className="px-4 py-4">Desc. Operación</th>
                <th className="px-4 py-4 w-32 text-right">Monto</th>
                <th className="px-4 py-4 w-48">Cuenta Contable</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={10} className="text-center py-12 text-slate-400 font-bold text-sm">No se encontraron registros</td></tr>
              ) : filtered.map((r, i) => (
                <tr key={i} className="border-b border-slate-50 hover:bg-slate-50 transition-colors print:border-b-slate-200">
                  <td className="px-4 py-3 text-[11px] font-bold text-slate-500">{r.cod}</td>
                  <td className="px-4 py-3 text-[11px] font-black text-slate-800 truncate max-w-[176px]" title={r.nombre}>{r.nombre}</td>
                  <td className="px-4 py-3 text-[11px] text-slate-500">{r.operacion}</td>
                  <td className="px-4 py-3 text-[11px] font-mono text-slate-500">{fmtDate(r.emision)}</td>
                  <td className="px-4 py-3 text-[11px] font-mono text-slate-500">{fmtDate(r.vencimiento)}</td>
                  <td className={`px-4 py-3 text-[11px] font-mono text-center font-black ${Number(r.dias) < 0 ? 'text-red-500' : Number(r.dias) === 0 ? 'text-amber-500' : 'text-emerald-600'}`}>{r.dias}</td>
                  <td className="px-4 py-3 text-[11px] font-mono text-slate-600">{r.noDocumento}</td>
                  <td className="px-4 py-3 text-[11px] text-slate-500 truncate max-w-[200px]" title={r.descOperacion}>{r.descOperacion}</td>
                  <td className="px-4 py-3 text-right font-mono text-[12px] font-black text-slate-900">USD {fmtM(r.monto)}</td>
                  <td className="px-4 py-3 text-[10px] text-slate-400 truncate max-w-[192px]" title={r.cuentaContable}>{r.cuentaContable}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t-2 border-slate-200 bg-slate-100 font-black">
              <tr>
                <td colSpan={8} className="px-4 py-4 text-[11px] uppercase tracking-widest text-slate-700">TOTAL — {filtered.length} registros</td>
                <td className="px-4 py-4 text-right font-mono text-sm text-slate-900">USD {fmtM(total)}</td>
                <td/>
              </tr>
            </tfoot>
          </table>
        </div>
      </main>
    </div>
  );
}

// ============================================================================
// 10. ACTIVOS FIJOS — Basado en Excel auxiliar con todas las columnas
// ============================================================================
function InversionesView({ onBack, activosFijosData }) {
  const records = activosFijosData?.records || [];
  const [search, setSearch] = useState('');
  const [filterSede, setFilterSede] = useState('all');
  const [filterCuenta, setFilterCuenta] = useState('all');

  const sedes   = useMemo(() => ['all', ...new Set(records.map(r => r.sede).filter(s => s && s !== '-'))], [records]);
  const cuentas = useMemo(() => ['all', ...new Set(records.map(r => r.cuenta).filter(c => c && c !== '-'))], [records]);

  const filtered = useMemo(() => {
    let r = records;
    if (filterSede !== 'all') r = r.filter(x => x.sede === filterSede);
    if (filterCuenta !== 'all') r = r.filter(x => x.cuenta === filterCuenta);
    if (search.trim()) {
      const q = search.toLowerCase();
      r = r.filter(x => x.descripcion.toLowerCase().includes(q) || x.cuenta.toLowerCase().includes(q) || x.sede.toLowerCase().includes(q));
    }
    return r;
  }, [records, search, filterSede, filterCuenta]);

  // Agrupa por CUENTA para mostrar secciones
  const grupos = useMemo(() => {
    const map = {};
    filtered.forEach(r => {
      const g = r.cuenta && r.cuenta !== '-' ? r.cuenta : 'SIN CUENTA';
      if (!map[g]) map[g] = [];
      map[g].push(r);
    });
    return map;
  }, [filtered]);

  const fmt = v => new Intl.NumberFormat('es-VE', { minimumFractionDigits:2, maximumFractionDigits:2 }).format(v || 0);

  const totalCosto    = filtered.reduce((s,r) => s + r.costoUSD, 0);
  const totalDepAcum  = filtered.reduce((s,r) => s + r.depAcum, 0);
  const totalNeto     = filtered.reduce((s,r) => s + r.valorNeto, 0);
  const totalMensual  = filtered.reduce((s,r) => s + r.depreMensual, 0);

  if (records.length === 0) return (
    <div className="pb-20 animate-in fade-in">
      <PrintStyles />
      <header className="no-print bg-white/80 backdrop-blur-md border-b border-slate-200 p-4 flex justify-between items-center sticky top-0 z-30 shadow-sm rounded-b-2xl mb-6">
        <button onClick={onBack} className="flex items-center gap-2 font-black text-xs text-slate-500 uppercase hover:text-slate-900"><ArrowLeft size={16}/> Panel</button>
      </header>
      <div className="max-w-2xl mx-auto mt-24 text-center">
        <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-emerald-100">
          <Landmark size={36} className="text-emerald-400"/>
        </div>
        <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter mb-3">Sin Datos de Activos Fijos</h2>
        <p className="text-slate-500 font-bold text-sm mb-6">Ve a <span className="text-orange-500">Configuración → 05 Activos Fijos</span> y carga tu auxiliar Excel.</p>
        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Columnas requeridas: Cant · MOBILIARIO Y EQUIPO · SEDE · CUENTA · COSTO ADQUISICION USD · DEP.ACUM · VALOR NETO LIBROS · DEPRE. MENSUAL · Tasa</p>
      </div>
    </div>
  );

  return (
    <div className="pb-20 animate-in fade-in relative">
      <PrintStyles />
      <header className="no-print bg-white/80 backdrop-blur-md border-b border-slate-200 p-4 flex flex-wrap justify-between items-center gap-3 sticky top-0 z-30 shadow-sm rounded-b-2xl mb-6">
        <button onClick={onBack} className="flex items-center gap-2 font-black text-xs text-slate-500 uppercase hover:text-slate-900"><ArrowLeft size={16}/> Panel</button>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar activo..."
              className="pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-orange-400 w-44 shadow-sm"/>
          </div>
          <select value={filterSede} onChange={e=>setFilterSede(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-bold outline-none shadow-sm">
            {sedes.map(s=><option key={s} value={s}>{s === 'all' ? 'Todas las sedes' : s}</option>)}
          </select>
          <select value={filterCuenta} onChange={e=>setFilterCuenta(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-bold outline-none shadow-sm">
            {cuentas.map(c=><option key={c} value={c}>{c === 'all' ? 'Todas las cuentas' : c}</option>)}
          </select>
        </div>
        <div className="flex gap-3">
          <button onClick={()=>window.print()} className="px-5 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase flex items-center gap-2 shadow-md hover:bg-slate-800"><Printer size={14}/> PDF</button>
          <button onClick={()=>handleExportActivosFijosExcel(filtered, 'Activos_Fijos')} className="px-5 py-2 bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase flex items-center gap-2 shadow-md hover:bg-emerald-600"><Download size={14}/> Excel</button>
        </div>
      </header>

      <main className="max-w-[1500px] mx-auto print-area px-4">
        <HeaderMembretado isExport={true} />

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label:'Costo Adq. USD',   val: `USD ${fmt(totalCosto)}`,   color:'text-slate-800',   bg:'bg-slate-50',   border:'border-slate-200' },
            { label:'Dep. Acum. USD',    val: `(${fmt(totalDepAcum)})`,  color:'text-red-500',    bg:'bg-red-50',     border:'border-red-100' },
            { label:'Valor Neto Libros', val: `USD ${fmt(totalNeto)}`,   color:'text-emerald-600', bg:'bg-emerald-50', border:'border-emerald-100' },
            { label:'Dep. Mensual USD',  val: `USD ${fmt(totalMensual)}`,color:'text-orange-500',  bg:'bg-orange-50',  border:'border-orange-100' },
          ].map(k => (
            <div key={k.label} className={`${k.bg} rounded-2xl p-5 border ${k.border} shadow-sm`}>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">{k.label}</p>
              <p className={`text-lg font-black font-mono ${k.color} truncate`}>{k.val}</p>
              <p className="text-[9px] text-slate-400 font-bold mt-1">{filtered.length} activos</p>
            </div>
          ))}
        </div>

        {/* Tabla por grupo de CUENTA */}
        <div id="table-activos" className="space-y-6">
          {Object.entries(grupos).map(([cuenta, items]) => {
            const gCosto   = items.reduce((s,r) => s + r.costoUSD, 0);
            const gDepAcum = items.reduce((s,r) => s + r.depAcum, 0);
            const gNeto    = items.reduce((s,r) => s + r.valorNeto, 0);
            const gMensual = items.reduce((s,r) => s + r.depreMensual, 0);
            return (
              <div key={cuenta} className="bg-white rounded-[2rem] shadow-xl overflow-hidden border border-slate-100 print:shadow-none print:border-slate-300">
                <div className="bg-slate-800 px-6 py-4 flex flex-wrap justify-between items-center gap-3">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Cuenta Contable</p>
                    <span className="text-white font-black text-sm uppercase tracking-widest">{cuenta}</span>
                  </div>
                  <div className="flex gap-6 text-right">
                    <div><p className="text-[8px] text-slate-400 font-bold uppercase">Costo USD</p><p className="font-mono font-black text-white text-sm">{fmt(gCosto)}</p></div>
                    <div><p className="text-[8px] text-slate-400 font-bold uppercase">Dep. Acum</p><p className="font-mono font-black text-red-400 text-sm">({fmt(gDepAcum)})</p></div>
                    <div><p className="text-[8px] text-slate-400 font-bold uppercase">Valor Neto</p><p className="font-mono font-black text-emerald-400 text-sm">{fmt(gNeto)}</p></div>
                    <div><p className="text-[8px] text-slate-400 font-bold uppercase">Dep/Mes</p><p className="font-mono font-black text-orange-400 text-sm">{fmt(gMensual)}</p></div>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse" style={{minWidth:'1600px'}}>
                    <thead className="bg-slate-50 text-[9px] uppercase font-black text-slate-400 border-b border-slate-200">
                      <tr>
                        <th className="px-3 py-3 w-10 text-center">Cant</th>
                        <th className="px-3 py-3 w-48">Mobiliario y Equipo</th>
                        <th className="px-3 py-3 w-24">Sede</th>
                        <th className="px-3 py-3 w-40">Cuenta</th>
                        <th className="px-3 py-3 w-20">Depreciación</th>
                        <th className="px-3 py-3 w-24 text-right">Dep. Acum</th>
                        <th className="px-3 py-3 w-24">F. Adquisición</th>
                        <th className="px-3 py-3 w-14 text-center">V.U. Asig</th>
                        <th className="px-3 py-3 w-14 text-center">V.U. Trans</th>
                        <th className="px-3 py-3 w-28 text-right">Costo Adq. USD</th>
                        <th className="px-3 py-3 w-28 text-right">Costo Adq. Bs.</th>
                        <th className="px-3 py-3 w-28 text-right">Dep. Acum USD</th>
                        <th className="px-3 py-3 w-28 text-right">Valor Neto</th>
                        <th className="px-3 py-3 w-24 text-right">Dep. Mensual</th>
                        <th className="px-3 py-3 w-14 text-center">Tasa</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((a, i) => (
                        <tr key={i} className="border-b border-slate-50 hover:bg-slate-50 transition-colors print:border-b-slate-200">
                          <td className="px-3 py-2.5 text-[11px] font-mono text-center text-slate-500">{a.cant}</td>
                          <td className="px-3 py-2.5 text-[11px] font-bold text-slate-800 truncate max-w-[192px]" title={a.descripcion}>{a.descripcion}</td>
                          <td className="px-3 py-2.5 text-[10px] text-slate-500 truncate">{a.sede}</td>
                          <td className="px-3 py-2.5 text-[10px] text-slate-600 font-bold truncate max-w-[160px]" title={a.cuenta}>{a.cuenta}</td>
                          <td className="px-3 py-2.5 text-[10px] text-slate-500 truncate">{a.depreciacion}</td>
                          <td className="px-3 py-2.5 text-right font-mono text-[11px] text-red-400">({fmt(a.depreciacionAcum)})</td>
                          <td className="px-3 py-2.5 text-[11px] font-mono text-slate-500">{a.fechaAdq}</td>
                          <td className="px-3 py-2.5 text-center text-[11px] font-mono text-slate-500">{a.vidaUtilAsig}</td>
                          <td className="px-3 py-2.5 text-center text-[11px] font-mono text-slate-500">{a.vidaUtilTrans}</td>
                          <td className="px-3 py-2.5 text-right font-mono text-[11px] text-slate-700">{fmt(a.costoUSD)}</td>
                          <td className="px-3 py-2.5 text-right font-mono text-[11px] text-slate-500">{fmt(a.costoBS)}</td>
                          <td className="px-3 py-2.5 text-right font-mono text-[11px] text-red-400">({fmt(a.depAcum)})</td>
                          <td className="px-3 py-2.5 text-right font-mono text-[11px] font-black text-emerald-700">{fmt(a.valorNeto)}</td>
                          <td className="px-3 py-2.5 text-right font-mono text-[11px] text-orange-500">{fmt(a.depreMensual)}</td>
                          <td className="px-3 py-2.5 text-center font-mono text-[11px] text-slate-500">{a.tasa}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-100 font-black text-[10px] border-t-2 border-slate-200">
                        <td colSpan={5} className="px-3 py-3 text-slate-700 uppercase tracking-wider">SUBTOTAL {cuenta}</td>
                        <td className="px-3 py-3 text-right font-mono text-red-500">({fmt(items.reduce((s,r)=>s+r.depreciacionAcum,0))})</td>
                        <td colSpan={3}/>
                        <td className="px-3 py-3 text-right font-mono text-slate-800">{fmt(gCosto)}</td>
                        <td className="px-3 py-3 text-right font-mono text-slate-600">{fmt(items.reduce((s,r)=>s+r.costoBS,0))}</td>
                        <td className="px-3 py-3 text-right font-mono text-red-500">({fmt(gDepAcum)})</td>
                        <td className="px-3 py-3 text-right font-mono text-emerald-700">{fmt(gNeto)}</td>
                        <td className="px-3 py-3 text-right font-mono text-orange-500">{fmt(gMensual)}</td>
                        <td/>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            );
          })}
        </div>

        {/* Total General */}
        <div className="mt-6 bg-slate-900 rounded-2xl px-8 py-5 flex flex-wrap justify-between items-center gap-4 text-white print:bg-slate-200 print:text-black">
          <p className="font-black text-sm uppercase tracking-widest">TOTAL GENERAL — {filtered.length} activos</p>
          <div className="flex gap-8 text-right flex-wrap">
            <div><p className="text-[9px] text-slate-400 font-bold uppercase">Costo USD</p><p className="font-mono font-black text-lg">{fmt(totalCosto)}</p></div>
            <div><p className="text-[9px] text-slate-400 font-bold uppercase">Costo Bs.</p><p className="font-mono font-black text-lg text-slate-300">{fmt(filtered.reduce((s,r)=>s+r.costoBS,0))}</p></div>
            <div><p className="text-[9px] text-slate-400 font-bold uppercase">Dep. Acum</p><p className="font-mono font-black text-lg text-red-400">({fmt(totalDepAcum)})</p></div>
            <div><p className="text-[9px] text-slate-400 font-bold uppercase">Valor Neto</p><p className="font-mono font-black text-lg text-emerald-400">{fmt(totalNeto)}</p></div>
            <div><p className="text-[9px] text-slate-400 font-bold uppercase">Dep/Mes</p><p className="font-mono font-black text-lg text-orange-400">{fmt(totalMensual)}</p></div>
          </div>
        </div>
      </main>
    </div>
  );
}

// ============================================================================
// 11. APP PRINCIPAL — DASHBOARD PANEL FINANCIERO (estilo imagen)
// ============================================================================
function ReportesFinancierosApp() {
  const [view, setView] = useState('dashboard');
  const [subView, setSubView] = useState(null);

  const [dbData, setDbData] = useState(() => { try { return JSON.parse(localStorage.getItem('j_db') || '[]'); } catch(e){return []} });
  const [planCuentas, setPlanCuentas] = useState(() => { try { return JSON.parse(localStorage.getItem('j_pc') || '{}'); } catch(e){return {}} });
  const [auxDataConfig, setAuxDataConfig] = useState(() => {
    try {
      const s = JSON.parse(localStorage.getItem('j_ax') || '{}');
      if (s.cxc || s.cxp) return s;
      return { cxc: { records: [] }, cxp: { records: [] } };
    } catch(e) { return { cxc: { records: [] }, cxp: { records: [] } }; }
  });
  const [activosFijosData, setActivosFijosData] = useState(() => {
    try { const s = JSON.parse(localStorage.getItem('j_af') || 'null'); return s || { records: [] }; } catch(e) { return { records: [] }; }
  });

  useEffect(() => {
    try {
      localStorage.setItem('j_db', JSON.stringify(dbData));
      localStorage.setItem('j_pc', JSON.stringify(planCuentas));
      localStorage.setItem('j_ax', JSON.stringify(auxDataConfig));
      localStorage.setItem('j_af', JSON.stringify(activosFijosData));
    } catch(e) { console.warn("Memoria Local superada."); }
  }, [dbData, planCuentas, auxDataConfig, activosFijosData]);

  const mesesEnMemoria = useMemo(() => new Set(dbData.filter(d => d.month && d.month !== 'Saldos Iniciales').map(d => `${d.month}-${d.year}`)).size, [dbData]);
  const cxcCount = auxDataConfig?.cxc?.records?.length || 0;
  const cxpCount = auxDataConfig?.cxp?.records?.length || 0;
  const afCount  = activosFijosData?.records?.length || 0;

  // Rutas desde balance
  if (view === 'resultado')   return <EstadoResultadoView onBack={()=>setView('dashboard')} dbData={dbData}/>;
  if (view === 'comparativo') return <AnalisisComparativoView onBack={()=>setView('dashboard')} dbData={dbData}/>;
  if (view === 'inversiones') return <InversionesView onBack={()=>setView('dashboard')} activosFijosData={activosFijosData}/>;
  if (view === 'cxc')         return <AuxiliarFullView type="cxc" auxDataConfig={auxDataConfig} onBack={()=>setView('dashboard')}/>;
  if (view === 'cxp')         return <AuxiliarFullView type="cxp" auxDataConfig={auxDataConfig} onBack={()=>setView('dashboard')}/>;
  if (view === 'balance') {
    if (subView?.type === 'auxiliar')
      return <AuxiliarFullView type={subView.code} auxDataConfig={auxDataConfig} onBack={()=>setSubView(null)}/>;
    return <BalanceGeneralView onBack={()=>setView('dashboard')} dbData={dbData} auxDataConfig={auxDataConfig} activosFijosData={activosFijosData} setSubView={setSubView}/>;
  }

  // ── PANTALLA CONFIGURACIÓN ──
  if (view === 'configuracion') return (
    <div className="min-h-screen bg-[#f4f7fa] p-8 relative overflow-hidden font-sans">
      <div className="absolute top-[-10%] left-[-5%] w-[400px] h-[400px] bg-orange-400/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="max-w-4xl mx-auto bg-white/90 backdrop-blur-xl rounded-[2.5rem] p-8 md:p-12 border border-white shadow-[0_20px_50px_rgba(0,0,0,0.05)] relative z-10 mt-10">
        <button onClick={()=>setView('dashboard')} className="flex items-center gap-2 font-black text-[10px] uppercase text-slate-400 mb-8 hover:text-orange-500 transition-colors"><ArrowLeft size={16}/> Volver al Panel</button>
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
          {/* 01 Plan de Cuentas */}
          <label className="flex items-center gap-5 p-6 rounded-3xl border border-slate-100 bg-white cursor-pointer hover:border-orange-500/30 hover:shadow-[0_10px_20px_rgba(249,115,22,0.05)] hover:-translate-y-1 transition-all duration-300 group">
            <span className="text-3xl font-black font-mono text-slate-100 group-hover:text-orange-200 transition-colors">01</span>
            <div className="flex-1">
              <p className="font-bold text-[11px] uppercase tracking-wider text-slate-600 group-hover:text-slate-900">Plan de Cuentas (.txt)</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{Object.keys(planCuentas).length > 0 ? `✓ ${Object.keys(planCuentas).length} cuentas cargadas` : 'Sin cargar'}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:bg-orange-50 transition-colors">
              <Upload size={20} className="text-slate-300 group-hover:text-orange-500"/>
            </div>
            <input type="file" className="hidden" onChange={(e)=>processPlanCuentas(e.target.files[0]).then(p=>{setPlanCuentas(p); alert("Plan de Cuentas Listo")})}/>
          </label>

          {/* 02 Saldos Iniciales .TXT */}
          <label className="flex items-center gap-5 p-6 rounded-3xl border border-slate-100 bg-white cursor-pointer hover:border-orange-500/30 hover:shadow-[0_10px_20px_rgba(249,115,22,0.05)] hover:-translate-y-1 transition-all duration-300 group">
            <span className="text-3xl font-black font-mono text-slate-100 group-hover:text-orange-200 transition-colors">02</span>
            <div className="flex-1">
              <p className="font-bold text-[11px] uppercase tracking-wider text-slate-600 group-hover:text-slate-900">Saldos Iniciales (.txt)</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Columnas: Cuenta Contable | SALDO USD | SALDO BS</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:bg-orange-50 transition-colors">
              <Upload size={20} className="text-slate-300 group-hover:text-orange-500"/>
            </div>
            <input type="file" accept=".txt" className="hidden" onChange={(e)=>processSaldosBalance(e.target.files[0], planCuentas).then(d=>{setDbData(prev=>[...prev.filter(x=>x.month!=='Saldos Iniciales'), ...d]); alert(`Saldos Iniciales cargados: ${d.length} cuentas`)})}/>
          </label>

          {/* 03 Meses */}
          <label className="flex items-center gap-5 p-6 rounded-3xl border border-slate-100 bg-white cursor-pointer hover:border-orange-500/30 hover:shadow-[0_10px_20px_rgba(249,115,22,0.05)] hover:-translate-y-1 transition-all duration-300 group">
            <span className="text-3xl font-black font-mono text-slate-100 group-hover:text-orange-200 transition-colors">03</span>
            <div className="flex-1">
              <p className="font-bold text-[11px] uppercase tracking-wider text-slate-600 group-hover:text-slate-900">Meses (Resultados) (.xlsx)</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{mesesEnMemoria > 0 ? `✓ ${mesesEnMemoria} mes(es) en memoria` : 'Sin cargar'}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:bg-orange-50 transition-colors">
              <Upload size={20} className="text-slate-300 group-hover:text-orange-500"/>
            </div>
            <input type="file" multiple accept=".xlsx,.xls" className="hidden" onChange={(e)=>processFiles(e.target.files).then(d=>{setDbData(prev=>[...prev, ...d]); alert(`${d.length} registros procesados`)})}/>
          </label>

          {/* 04a CxC */}
          <label className="flex items-center gap-5 p-6 rounded-3xl border border-slate-100 bg-white cursor-pointer hover:border-blue-400/30 hover:shadow-[0_10px_20px_rgba(59,130,246,0.05)] hover:-translate-y-1 transition-all duration-300 group">
            <span className="text-3xl font-black font-mono text-slate-100 group-hover:text-blue-200 transition-colors">04a</span>
            <div className="flex-1">
              <p className="font-bold text-[11px] uppercase tracking-wider text-slate-600 group-hover:text-slate-900">Auxiliar Cuentas x Cobrar (.xlsx)</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{cxcCount > 0 ? `✓ ${cxcCount} registros cargados` : 'Sin cargar'}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:bg-blue-50 transition-colors">
              <Upload size={20} className="text-slate-300 group-hover:text-blue-500"/>
            </div>
            <input type="file" multiple accept=".xlsx,.xls" className="hidden" onChange={(e)=>processAuxExcel(e.target.files).then(d=>{setAuxDataConfig(prev=>({...prev, cxc: d})); alert(`CxC: ${d.records.length} registros cargados`)})}/>
          </label>

          {/* 04b CxP */}
          <label className="flex items-center gap-5 p-6 rounded-3xl border border-slate-100 bg-white cursor-pointer hover:border-orange-500/30 hover:shadow-[0_10px_20px_rgba(249,115,22,0.05)] hover:-translate-y-1 transition-all duration-300 group">
            <span className="text-3xl font-black font-mono text-slate-100 group-hover:text-orange-200 transition-colors">04b</span>
            <div className="flex-1">
              <p className="font-bold text-[11px] uppercase tracking-wider text-slate-600 group-hover:text-slate-900">Auxiliar Cuentas x Pagar (.xlsx)</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{cxpCount > 0 ? `✓ ${cxpCount} registros cargados` : 'Sin cargar'}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:bg-orange-50 transition-colors">
              <Upload size={20} className="text-slate-300 group-hover:text-orange-500"/>
            </div>
            <input type="file" multiple accept=".xlsx,.xls" className="hidden" onChange={(e)=>processAuxExcel(e.target.files).then(d=>{setAuxDataConfig(prev=>({...prev, cxp: d})); alert(`CxP: ${d.records.length} registros cargados`)})}/>
          </label>

          {/* 05 Activos Fijos */}
          <label className="flex items-center gap-5 p-6 rounded-3xl border border-slate-100 bg-white cursor-pointer hover:border-emerald-400/30 hover:shadow-[0_10px_20px_rgba(16,185,129,0.05)] hover:-translate-y-1 transition-all duration-300 group lg:col-span-2">
            <span className="text-3xl font-black font-mono text-slate-100 group-hover:text-emerald-200 transition-colors">05</span>
            <div className="flex-1">
              <p className="font-bold text-[11px] uppercase tracking-wider text-slate-600 group-hover:text-slate-900">Auxiliar Activos Fijos (.xlsx)</p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {afCount > 0
                  ? `✓ ${afCount} activos cargados`
                  : 'Columnas: Cant · MOBILIARIO Y EQUIPO · SEDE · CUENTA · COSTO ADQUISICION USD · DEP.ACUM · VALOR NETO LIBROS · DEPRE. MENSUAL · Tasa'}
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:bg-emerald-50 transition-colors">
              <Upload size={20} className="text-slate-300 group-hover:text-emerald-500"/>
            </div>
            <input type="file" multiple accept=".xlsx,.xls" className="hidden" onChange={(e)=>processActivosFijosExcel(e.target.files).then(d=>{setActivosFijosData(d); alert(`Activos Fijos: ${d.records.length} registros cargados`)})}/>
          </label>
        </div>

        <div className="mt-12 p-6 bg-red-50/50 border border-red-100 rounded-3xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-black text-red-600 uppercase tracking-widest mb-1">Zona de Peligro</h3>
              <p className="text-xs font-bold text-red-400">Borrará toda la información del sistema.</p>
            </div>
            <button onClick={()=>{if(window.confirm("¿Seguro de borrar toda la base de datos?")){setDbData([]); setPlanCuentas({}); setAuxDataConfig({ cxc:{ records:[] }, cxp:{ records:[] } }); setActivosFijosData({ records:[] })}}}
              className="w-full md:w-auto px-6 py-3 bg-white border-2 border-red-100 text-red-500 font-black uppercase text-[11px] tracking-widest rounded-xl hover:bg-red-500 hover:border-red-500 hover:text-white transition-all duration-300 shadow-sm">
              Limpiar Sistema
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // ── DASHBOARD PRINCIPAL ──
  const modules = [
    {
      id:'resultado', t:'Estado de Resultados', d:'P&L mensual y acumulado por cuentas',
      icon: <LineChart size={22} strokeWidth={2}/>,
      badge: mesesEnMemoria > 0 ? `${mesesEnMemoria} mes(es)` : null,
      color: 'from-slate-600 to-slate-800',
      chart: <MiniLineChart/>
    },
    {
      id:'balance', t:'Balance General', d:'Situación financiera multimoneda USD / Bs.',
      icon: <Scale size={22} strokeWidth={2}/>,
      badge: dbData.filter(d=>/^[123]/.test(d.name||'')).length > 0 ? 'Activo' : null,
      color: 'from-blue-500 to-blue-700',
      chart: <MiniBarChart/>
    },
    {
      id:'comparativo', t:'Análisis de Variaciones', d:'Comparativo mes a mes de resultados',
      icon: <GitCompare size={22} strokeWidth={2}/>,
      badge: null,
      color: 'from-violet-500 to-violet-700',
      chart: <MiniGroupedBar/>
    },
    {
      id:'inversiones', t:'Activos Fijos', d:'Registro y depreciación de activos fijos',
      icon: <Landmark size={22} strokeWidth={2}/>,
      badge: afCount > 0 ? `${afCount} activos` : null,
      color: 'from-emerald-500 to-emerald-700',
      chart: <MiniDonut pct={0.68} color="#10b981"/>
    },
    {
      id:'configuracion', t:'Libro Diario', d:'Asientos y movimientos contables',
      icon: <BookOpen size={22} strokeWidth={2}/>,
      badge: null,
      color: 'from-amber-500 to-amber-600',
      chart: <MiniChecklist/>
    },
    {
      id:'configuracion', t:'Simulador Flujo de Caja', d:'Proyección mensual',
      icon: <TrendingUp size={22} strokeWidth={2}/>,
      badge: null,
      color: 'from-cyan-500 to-cyan-700',
      chart: (
        <div className="flex items-center gap-2">
          <span className="text-2xl font-black font-mono text-slate-700">$12,350</span>
          <MiniBarChart/>
        </div>
      )
    },
    {
      id:'cxc', t:'Cuentas por Cobrar', d:'Gestión de cartera de clientes',
      icon: <CreditCard size={22} strokeWidth={2}/>,
      badge: cxcCount > 0 ? `${cxcCount} reg.` : null,
      color: 'from-sky-500 to-sky-700',
      chart: <MiniDonut pct={0.6} color="#0ea5e9"/>
    },
    {
      id:'cxp', t:'Cuentas por Pagar', d:'Obligaciones con proveedores',
      icon: <Users size={22} strokeWidth={2}/>,
      badge: cxpCount > 0 ? `${cxpCount} reg.` : null,
      color: 'from-rose-500 to-rose-700',
      chart: <MiniDonut pct={0.45} color="#f43f5e"/>
    },
    {
      id:'configuracion', t:'Configuración', d:'Detalles del sistema',
      icon: <Settings size={22} strokeWidth={2}/>,
      badge: null,
      color: 'from-slate-400 to-slate-600',
      chart: (
        <div className="text-[11px] text-slate-500 font-bold space-y-1">
          <p>Plan: Mensual | Meses: {mesesEnMemoria}</p>
          <p>CxC: {cxcCount} reg. | CxP: {cxpCount} reg.</p>
          <p>Activos: {afCount} | Base: {dbData.length}</p>
        </div>
      )
    },
  ];

  return (
    <div className="min-h-screen font-sans" style={{background:'#f0ede8'}}>
      <div className="absolute inset-0 opacity-30 pointer-events-none" style={{backgroundImage:'repeating-linear-gradient(0deg,transparent,transparent 39px,#c8c4be 39px,#c8c4be 40px),repeating-linear-gradient(90deg,transparent,transparent 39px,#c8c4be 39px,#c8c4be 40px)'}}></div>

      {/* ── HEADER ── */}
      <header className="relative z-10 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-6 py-3 flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center shadow-md shadow-orange-500/30">
              <Activity size={20} className="text-white"/>
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-black text-slate-900 tracking-tight uppercase leading-none">JIRET G&B</span>
                <span className="text-lg font-black text-orange-500 tracking-tight uppercase leading-none ml-1">FINANCE</span>
              </div>
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider leading-none mt-0.5">SERVICIOS JIRET G&B, C.A. • RIF: J-412309374</p>
            </div>
          </div>

          {/* Center: clock + memory */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
              <Clock size={14} className="text-slate-400"/>
              <LiveClock/>
            </div>
            <button className="bg-orange-500 hover:bg-orange-600 text-white text-[10px] font-black uppercase tracking-wider px-4 py-2.5 rounded-xl shadow-md shadow-orange-500/20 transition-colors">
              {mesesEnMemoria} MESES EN MEMORIA
            </button>
            <button onClick={()=>setView('configuracion')} className="flex items-center gap-2 bg-white border border-slate-200 hover:border-slate-400 text-slate-700 text-[10px] font-black uppercase tracking-wider px-4 py-2.5 rounded-xl shadow-sm transition-colors">
              <Settings size={14}/> CONFIG.
            </button>
          </div>

          {/* Right: user */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="text-right hidden md:block">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">ANALISTA</p>
              <p className="text-[11px] font-black text-slate-800 leading-none mt-0.5">Administrador General</p>
            </div>
            <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center">
              <Users size={15} className="text-slate-500"/>
            </div>
            <div className="relative">
              <Bell size={18} className="text-slate-500"/>
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full text-[8px] text-white font-black flex items-center justify-center">0</span>
            </div>
            <button className="flex items-center gap-1.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-wider px-3 py-2 rounded-xl hover:bg-slate-700 transition-colors">
              <LogOut size={13}/> SALIR
            </button>
          </div>
        </div>
      </header>

      {/* ── MAIN ── */}
      <main className="relative z-10 max-w-[1400px] mx-auto px-6 py-8">
        {/* Título */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-black text-slate-700 uppercase tracking-[0.25em]">Panel Principal Financiero</h2>
          <div className="h-0.5 w-24 bg-orange-500 mx-auto mt-2 rounded-full"></div>
        </div>

        {/* Grid 3x3 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((m, idx) => (
            <button key={idx} onClick={()=>setView(m.id)}
              className="group bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-left overflow-hidden">
              {/* Card header */}
              <div className="p-5 pb-3">
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${m.color} flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform duration-300`}>
                    {m.icon}
                  </div>
                  {m.badge && (
                    <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-1 rounded-lg">{m.badge}</span>
                  )}
                </div>
                <h3 className="font-black text-slate-900 text-sm uppercase tracking-tight leading-tight mb-0.5 group-hover:text-orange-600 transition-colors">{m.t}</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-tight">{m.d}</p>
              </div>
              {/* Mini chart area */}
              <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 min-h-[56px] flex items-center">
                {m.chart}
              </div>
              {/* CTA button */}
              <div className="px-5 py-3">
                <div className="w-full bg-orange-500 group-hover:bg-orange-600 text-white text-[10px] font-black uppercase tracking-widest py-2 rounded-xl text-center transition-colors flex items-center justify-center gap-1">
                  Ir a módulo <ArrowUpRight size={12}/>
                </div>
              </div>
            </button>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center py-6">
        <p className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-400">Módulo de Reportes Financieros · JIRET G&B Finance V2.0</p>
      </footer>
    </div>
  );
}

export default ReportesFinancierosApp;

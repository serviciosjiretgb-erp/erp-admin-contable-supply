import React, { useState, useMemo, useEffect } from 'react';
import { 
  ArrowLeft, Upload, CheckCircle, Scale, 
  LineChart, CalendarDays, AlertTriangle, ChevronRight, ChevronDown 
} from 'lucide-react';

// ============================================================================
// LÓGICA DE PROCESAMIENTO (Formato Jerárquico Tabla Dinámica / Pivot)
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
        if (stack[idx].trim() === what) {
          stack.splice(idx);
          break;
        }
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
      if (name.startsWith('Total ')) {
        smartPop(pathStack, name);
        continue;
      }
      const usdStr = row[1];
      const bsStr = row[2];
      if (String(usdStr).includes('SALDO NETO') || String(bsStr).includes('SALDO NETO')) {
        pathStack.push(name);
        continue;
      }
      const usd = parseVal(usdStr);
      const bs = parseVal(bsStr);
      if (usd !== null) {
        allParsedData.push({ month, path: pathStack.join('>'), name, usd: Math.abs(usd), bs: bs !== null ? Math.abs(bs) : 0 });
      } else {
        pathStack.push(name);
      }
    }
  }
  return allParsedData;
};

// ============================================================================
// COMPONENTES DE INTERFAZ
// ============================================================================

const ExpandableRow = ({ node, level = 0, totalVentasUSD, defaultOpen = false }) => {
  const isAccountNode = /^\d\./.test(node.n);
  const isLeaf = !node.c || node.c.length === 0;
  const [isOpen, setIsOpen] = useState(defaultOpen);

  useEffect(() => { setIsOpen(defaultOpen); }, [defaultOpen]);

  const fmtCur = (v) => new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);
  const pct = totalVentasUSD && node.u !== 0 ? `${((node.u / totalVentasUSD) * 100).toFixed(2)}%` : '';
  const indent = { paddingLeft: `${level * 18 + 10}px` };

  // --- RENDIZADO DE CARPETAS Y SUBGRUPOS ---
  if (!isLeaf && !isAccountNode) {
    const isRoot = level === 0;
    return (
      <>
        {/* Cabecera del Grupo */}
        <tr className={isRoot ? 'bg-[#111827]' : 'bg-white border-b border-gray-100'}>
          <td 
            style={indent} 
            className={isRoot 
              ? 'py-3 px-3 text-orange-500 font-black text-xs uppercase tracking-[0.2em]' 
              : 'py-2 px-3 font-black text-[11px] text-slate-800 uppercase'
            }
          >
            {node.n}
          </td>
          <td colSpan={3} />
        </tr>
        
        {/* Hijos */}
        {node.c.map((child, i) => (
          <ExpandableRow key={i} node={child} level={level + 1} totalVentasUSD={totalVentasUSD} defaultOpen={defaultOpen}/>
        ))}

        {/* FILA DE TOTAL (Aparece al final de cada nivel de carpeta) */}
        <tr className={`${isRoot ? 'bg-slate-900 text-white border-t-2 border-orange-500' : 'bg-slate-200 text-slate-800 border-t border-slate-300'} shadow-sm transition-colors`}>
          <td style={{ paddingLeft: level * 18 + 28 }} className="py-2.5 px-3 font-black text-[10px] uppercase tracking-wider">
            TOTAL {node.n}
          </td>
          <td className={`py-2.5 px-3 text-right font-mono text-[11px] font-black ${isRoot ? 'text-orange-500' : 'text-slate-900'}`}>{fmtCur(node.u)}</td>
          <td className={`py-2.5 px-3 text-right font-mono text-[11px] font-black hidden sm:table-cell ${isRoot ? 'text-orange-500' : 'text-slate-900'}`}>{fmtCur(node.b)}</td>
          <td className={`py-2.5 px-3 text-right font-mono text-[11px] font-black ${isRoot ? 'text-orange-500' : 'text-slate-900'}`}>{pct}</td>
        </tr>
      </>
    );
  }

  // --- CUENTAS CONTABLES (Expandibles) ---
  if (!isLeaf && isAccountNode) {
    return (
      <>
        <tr 
          onClick={() => setIsOpen(!isOpen)}
          className="bg-white border-b border-gray-200 cursor-pointer hover:bg-orange-50 transition-colors"
        >
          <td style={indent} className="py-2.5 px-3 font-bold text-[11px] text-slate-900 uppercase border-l-4 border-orange-400 select-none flex items-center">
            <span className={`inline-flex items-center justify-center w-4 h-4 mr-2 border rounded-sm text-[11px] leading-none transition-colors ${isOpen ? 'border-orange-500 text-orange-600 bg-orange-100' : 'border-slate-300 text-slate-400 bg-white'}`}>
              {isOpen ? '−' : '+'}
            </span>
            <span className="truncate">{node.n}</span>
          </td>
          <td className="py-2.5 px-3 text-right font-mono text-[11px] font-bold text-slate-800">{fmtCur(node.u)}</td>
          <td className="py-2.5 px-3 text-right font-mono text-[11px] font-bold hidden sm:table-cell text-slate-800">{fmtCur(node.b)}</td>
          <td className="py-2.5 px-3 text-right font-mono text-[11px] text-slate-500 font-bold">{pct}</td>
        </tr>
        {isOpen && node.c.map((child, i) => (
          <ExpandableRow key={i} node={child} level={level + 1} totalVentasUSD={totalVentasUSD} defaultOpen={defaultOpen}/>
        ))}
      </>
    );
  }

  // --- HOJAS (Transacciones) ---
  if (isLeaf) {
    return (
      <tr className="bg-slate-50/50 border-b border-gray-100 hover:bg-white transition-colors">
        <td style={indent} className="py-1.5 px-3 text-[10px] text-slate-600 pl-8 relative">
          <div className="absolute left-4 top-0 bottom-0 w-px bg-slate-200"></div>
          <div className="absolute left-4 top-1/2 w-2 h-px bg-slate-200"></div>
          <span className="ml-2 italic">{node.n}</span>
        </td>
        <td className="py-1.5 px-3 text-right font-mono text-[10px] whitespace-nowrap text-slate-700">{fmtCur(node.u)}</td>
        <td className="py-1.5 px-3 text-right font-mono text-[10px] hidden sm:table-cell whitespace-nowrap text-slate-500">{fmtCur(node.b)}</td>
        <td className="py-1.5 px-3 text-right font-mono text-[10px] text-slate-400">{pct}</td>
      </tr>
    );
  }
  return null;
};

function EstadoResultadoView({ onBack, dbData }) {
  const availableMonths = useMemo(() => [...new Set(dbData.map(d => d.month))], [dbData]);
  const [selectedMonth, setSelectedMonth] = useState(availableMonths[0] || '');
  const [defaultOpen, setDefaultOpen] = useState(false);
  const [expandKey, setExpandKey] = useState(0);

  const tree = useMemo(() => {
    const root = [];
    const monthData = dbData.filter(d => d.month === selectedMonth);
    monthData.forEach(item => {
      const pathArray = item.path.split('>');
      let cur = root;
      pathArray.forEach(folderName => {
        let folder = cur.find(n => n.n === folderName);
        if (!folder) { folder = { n: folderName, c: [], u: 0, b: 0 }; cur.push(folder); }
        cur = folder.c;
      });
      cur.push({ n: item.name, u: item.usd, b: item.bs, isLeaf: true });
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
        <button onClick={onBack} className="flex items-center gap-2 font-black text-xs text-slate-600 uppercase hover:text-orange-600 transition-colors">
          <ArrowLeft size={16}/> Volver
        </button>
        <div className="flex gap-2 bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button onClick={() => { setDefaultOpen(true); setExpandKey(k=>k+1); }} className={`px-3 py-1.5 rounded text-[10px] font-black uppercase flex items-center gap-1 transition-colors ${defaultOpen ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500'}`}>
            <ChevronDown size={14}/> Expandir Todo
          </button>
          <button onClick={() => { setDefaultOpen(false); setExpandKey(k=>k+1); }} className={`px-3 py-1.5 rounded text-[10px] font-black uppercase flex items-center gap-1 transition-colors ${!defaultOpen ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500'}`}>
            <ChevronRight size={14}/> Contraer Todo
          </button>
        </div>
        <div className="flex gap-1.5">
          {availableMonths.map(m => (
            <button key={m} onClick={() => setSelectedMonth(m)}
              className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase shadow-sm ${selectedMonth === m ? 'bg-orange-600 text-white' : 'bg-white text-slate-500 border border-slate-200'}`}>
              {m}
            </button>
          ))}
        </div>
      </header>
      <main className="p-4 md:p-8 max-w-6xl mx-auto pb-16">
        <div className="bg-white px-8 py-10 border-t-8 border-orange-500 shadow-xl flex flex-col items-center text-center mb-6 rounded-b-2xl">
          <h1 className="text-3xl font-black text-slate-900 uppercase mb-2">Servicios Jiret G&B, C.A.</h1>
          <div className="w-20 h-1.5 bg-orange-500 mb-4 rounded-full"/>
          <p className="font-sans text-xs text-slate-500 font-black tracking-[0.3em] mb-4">RIF: J-412309374</p>
          <h2 className="text-xl font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-2 mb-4 w-full max-w-md">Estado de Resultado Integral</h2>
          <p className="text-orange-600 font-black uppercase flex items-center gap-2 bg-orange-50 px-5 py-2 rounded-full text-[10px] border border-orange-100">
            <CalendarDays size={14}/> Periodo Fiscal: {selectedMonth}
          </p>
        </div>
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-800 text-[10px] uppercase font-black text-slate-300">
              <tr>
                <th className="px-4 py-5 w-[55%]">Estructura de Cuentas</th>
                <th className="px-3 py-5 text-right">Saldo USD</th>
                <th className="px-3 py-5 text-right hidden sm:table-cell">Saldo Bs.</th>
                <th className="px-3 py-5 text-right">%</th>
              </tr>
            </thead>
            <tbody key={expandKey}>
              {tree.map((node, i) => <ExpandableRow key={i} node={node} totalVentasUSD={baseVentas} defaultOpen={defaultOpen}/>)}
              <tr className="bg-slate-900 text-white font-black border-t-4 border-orange-600">
                <td className="px-5 py-7 text-sm uppercase tracking-[0.2em]" style={{paddingLeft:28}}>RESULTADO DEL EJERCICIO</td>
                <td className={`px-3 py-7 text-right text-lg font-mono ${totalUSD < 0 ? 'text-red-400' : 'text-orange-500'}`}>{fmtR(totalUSD)}</td>
                <td className={`px-3 py-7 text-right text-lg font-mono hidden sm:table-cell ${totalBs < 0 ? 'text-red-400' : 'text-orange-500'}`}>{fmtR(totalBs)}</td>
                <td className="px-3 py-7 text-right text-lg font-mono">{((Math.abs(totalUSD) / baseVentas) * 100).toFixed(2)}%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

function ReportesFinancierosApp() {
  const [view, setView] = useState('dashboard');
  const [dbData, setDbData] = useState([]);
  const handleUpload = async (e) => {
    if (!e.target.files.length) return;
    try {
      const newData = await processFiles(e.target.files);
      setDbData(newData);
      alert(`✅ Carga exitosa.`);
    } catch (error) { alert("Error al procesar."); }
  };
  if (view === 'resultado') return <EstadoResultadoView onBack={() => setView('dashboard')} dbData={dbData}/>;
  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <header className="px-6 py-4 bg-[#111827] border-b-4 border-orange-500 flex justify-between items-center shadow-lg">
        <h1 className="text-white font-black text-xl tracking-widest uppercase">Jiret G&B <span className="text-orange-500">Finance</span></h1>
      </header>
      <main className="max-w-4xl mx-auto p-6 md:p-12 mt-4">
        <div className="bg-white border-2 border-dashed border-slate-300 p-10 rounded-[2rem] text-center mb-8 shadow-sm hover:border-orange-400 transition-colors">
          <Upload className="mx-auto text-orange-500 mb-5" size={56}/>
          <h2 className="text-2xl font-black uppercase mb-3 text-slate-800">Carga de Reportes</h2>
          <label className="bg-[#111827] text-white px-8 py-3.5 rounded-xl font-black uppercase text-xs cursor-pointer hover:bg-orange-600 transition-all flex items-center justify-center gap-2 shadow-lg">
            Seleccionar Archivos
            <input type="file" multiple accept=".xlsx,.xls,.xlsm,.txt,.csv" className="hidden" onChange={handleUpload}/>
          </label>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <button onClick={() => dbData.length > 0 ? setView('resultado') : alert('Carga un archivo')}
            className={`bg-white p-8 rounded-[2rem] shadow-sm border-b-4 border-orange-500 text-left ${dbData.length > 0 ? 'hover:shadow-xl' : 'opacity-60'}`}>
            <LineChart className="text-orange-500 mb-4" size={32}/>
            <h3 className="font-black uppercase text-lg text-slate-900">Estado de Resultados</h3>
            <p className="text-sm text-slate-500">Jerarquía completa con sub-totales automáticos.</p>
          </button>
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border-b-4 border-blue-500 opacity-50 text-left">
            <Scale className="text-blue-500 mb-4" size={32}/>
            <h3 className="font-black uppercase text-lg text-slate-900">Balance General</h3>
          </div>
        </div>
      </main>
    </div>
  );
}

export default ReportesFinancierosApp;

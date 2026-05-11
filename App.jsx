import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { 
  ChevronRight, ChevronDown, FileSpreadsheet, Wallet, Building2,
  LayoutDashboard, ArrowLeft, LogOut, Calendar, Upload, CheckCircle, AlertCircle
} from 'lucide-react';

// ============================================================================
// LÓGICA DE PROCESAMIENTO MULTI-FORMATO (TXT, CSV, XLSX)
// ============================================================================
const processAnyFile = async (files) => {
  let allParsedData = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const fileName = file.name.toLowerCase();
    
    // Detectar Mes
    let month = "Enero";
    const monthMatch = fileName.match(/(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)/i);
    if (monthMatch) month = monthMatch[0].charAt(0).toUpperCase() + monthMatch[0].slice(1).toLowerCase();

    let rows = [];

    if (fileName.endsWith('.txt')) {
      const text = await file.text();
      // El TXT usa tabulaciones (\t)
      rows = text.split(/\r?\n/).map(line => line.split('\t').map(c => c.trim()));
    } else {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    }

    let pathStack = [];

    rows.forEach(row => {
      if (!row || row.length === 0) return;
      const firstCol = String(row[0] || '').trim();
      
      if (!firstCol || firstCol.includes("SERVICIOS JIRET") || firstCol.includes("RIF:") || firstCol.includes("Etiquetas de fila")) return;
      if (firstCol.includes("ESTADO DE RESULTADO") || firstCol.includes("RESULTADO")) return;

      // Cerrar niveles si la fila empieza por "Total "
      if (firstCol.startsWith('Total ')) {
        pathStack.pop();
        return;
      }

      // Extraer montos limpiando puntos de miles y comas decimales
      const findAmount = (val) => {
        if (val === undefined || val === null) return null;
        const str = String(val).trim();
        if (str === '-' || str === '') return 0;
        // Quitar símbolos y formatear (Ej: -122.143,16 -> -122143.16)
        const clean = str.replace(/USD|Bs\.|Bs/g, '').trim().replace(/\./g, '').replace(',', '.');
        const num = parseFloat(clean);
        return isNaN(num) ? null : num;
      };

      const usdValue = findAmount(row[1]);
      const bsValue = findAmount(row[2]);

      if (usdValue !== null) {
        const fullPath = pathStack.join('>');
        allParsedData.push({ month, path: fullPath, name: firstCol, usd: usdValue, bs: bsValue || 0 });
      } else {
        // Es una carpeta de jerarquía
        pathStack.push(firstCol);
      }
    });
  }
  return allParsedData;
};

// ============================================================================
// COMPONENTE: FILA EXPANSIBLE (Con Subtotales)
// ============================================================================
const ExpandableRow = ({ node, level = 0, totalVentasUSD }) => {
  const isAccountNode = /^\d\./.test(node.n);
  const isLeaf = !node.c || node.c.length === 0;
  const [isOpen, setIsOpen] = useState(level < 2);

  const formatCurrency = (val) => new Intl.NumberFormat('es-VE', { 
    style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 
  }).format(val);

  let percentStr = '0,00%';
  if (totalVentasUSD && node.u !== 0) {
    const percent = (Math.abs(node.u) / Math.abs(totalVentasUSD)) * 100;
    percentStr = `${new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2 }).format(percent)}%`;
  }

  let rowClass = "cursor-pointer transition-colors border-b border-gray-200 ";
  let textClass = "";

  if (isLeaf) {
    rowClass += "bg-white hover:bg-gray-50";
    textClass = "text-gray-600 font-normal text-xs";
  } else if (isAccountNode) {
    rowClass += "bg-white hover:bg-orange-50";
    textClass = "text-black font-bold text-sm uppercase";
  } else {
    rowClass += level === 0 ? " bg-[#111827] text-white" : " bg-[#F97316] text-white";
    textClass = "font-black text-xs uppercase tracking-widest";
  }

  return (
    <>
      <tr onClick={() => !isLeaf && setIsOpen(!isOpen)} className={rowClass}>
        <td className={`px-4 py-3 flex items-center gap-2 ${textClass} ${isAccountNode ? 'border-l-4 border-[#F97316]' : ''}`} style={{ paddingLeft: `${level * 1.5 + 1}rem` }}>
          {!isLeaf ? (isOpen ? <ChevronDown size={14}/> : <ChevronRight size={14}/>) : <span className="w-4"></span>}
          <span className={isLeaf ? 'truncate max-w-[450px]' : ''}>{node.n}</span>
        </td>
        <td className="px-4 py-3 text-right font-mono text-xs font-bold">{formatCurrency(node.u)}</td>
        <td className="px-4 py-3 text-right font-mono text-xs hidden sm:table-cell">{formatCurrency(node.b)}</td>
        <td className="px-4 py-3 text-right font-mono text-xs">{percentStr}</td>
      </tr>
      
      {isOpen && !isLeaf && node.c.map((child, idx) => (
        <ExpandableRow key={idx} node={child} level={level + 1} totalVentasUSD={totalVentasUSD} />
      ))}

      {/* Fila de Subtotal/Total Automático */}
      {isOpen && !isLeaf && (
        <tr className={level === 0 ? "bg-gray-200 border-b-2 border-black" : "bg-orange-100 border-b border-orange-200"}>
          <td className="px-4 py-2 font-black text-[10px] uppercase italic text-gray-800" style={{ paddingLeft: `${level * 1.5 + 2}rem` }}>
            TOTAL {node.n}
          </td>
          <td className="px-4 py-2 text-right font-mono text-[10px] font-black">{formatCurrency(node.u)}</td>
          <td className="px-4 py-2 text-right font-mono text-[10px] font-black hidden sm:table-cell">{formatCurrency(node.b)}</td>
          <td className="px-4 py-2 text-right font-mono text-[10px] font-black">{percentStr}</td>
        </tr>
      )}
    </>
  );
};

// ============================================================================
// VISTA: ESTADO DE RESULTADO
// ============================================================================
const EstadoResultado = ({ onBack, dbData }) => {
  const availableMonths = useMemo(() => [...new Set(dbData.map(d => d.month))], [dbData]);
  const [selectedMonth, setSelectedMonth] = useState(availableMonths[0] || '');

  const tree = useMemo(() => {
    const root = [];
    const monthData = dbData.filter(d => d.month === selectedMonth);
    monthData.forEach(item => {
      const pathArray = item.path.split('>');
      let currentLevel = root;
      pathArray.forEach(folderName => {
        let folder = currentLevel.find(n => n.n === folderName);
        if (!folder) {
          folder = { n: folderName, c: [], u: 0, b: 0 };
          currentLevel.push(folder);
        }
        currentLevel = folder.c;
      });
      currentLevel.push({ n: item.name, u: item.usd, b: item.bs, isLeaf: true });
    });
    const compute = (nodes) => {
      let u = 0, b = 0;
      nodes.forEach(n => {
        if (!n.isLeaf) {
          const totals = compute(n.c);
          n.u = totals.u; n.b = totals.b;
        }
        u += n.u; b += n.b;
      });
      return { u, b };
    };
    compute(root);
    return root;
  }, [dbData, selectedMonth]);

  const ingresosNode = tree.find(n => n.n === 'INGRESOS');
  const baseVentas = ingresosNode ? Math.abs(ingresosNode.u) : 1;
  const totalUSD = tree.reduce((acc, n) => acc + n.u, 0);
  const totalBs = tree.reduce((acc, n) => acc + n.b, 0);

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <header className="bg-white border-b p-4 flex justify-between items-center sticky top-0 z-30 shadow-sm">
        <button onClick={onBack} className="flex items-center gap-2 font-black text-xs text-slate-600 uppercase"><ArrowLeft size={16}/> Volver</button>
        <div className="flex gap-2">
          {availableMonths.map(m => (
            <button key={m} onClick={() => setSelectedMonth(m)} className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase ${selectedMonth === m ? 'bg-orange-600 text-white shadow-md' : 'bg-slate-100 text-slate-500'}`}>{m}</button>
          ))}
        </div>
      </header>
      
      <main className="p-4 md:p-8 max-w-6xl mx-auto">
        {/* HOJA MEMBRETADA INTEGRADA */}
        <div className="bg-white px-8 py-10 border-t-8 border-[#F97316] mb-8 shadow-md flex flex-col items-center text-center">
          <h1 className="text-2xl sm:text-3xl font-black font-serif text-[#111827] uppercase tracking-tight mb-2">Servicios Jiret G&B, C.A.</h1>
          <div className="w-16 h-1.5 bg-[#F97316] mb-4 rounded-full"></div>
          <p className="font-sans text-sm text-[#111827] font-bold mb-2">RIF: J-412309374</p>
          <p className="font-sans text-xs text-gray-500 max-w-2xl font-semibold uppercase tracking-widest leading-relaxed mb-8">
            AV CIRCUNVALACION NRO 02 C.C EL DIVIDIVI LOCAL G-9 NIVEL PB SECTOR EL TREBOL MARACAIBO-ZULIA
          </p>
          <h2 className="text-xl font-black font-serif text-gray-800 uppercase tracking-widest border-b-2 border-gray-100 pb-2">Estado de Resultado Integral</h2>
          <p className="font-sans text-sm text-orange-600 font-black mt-4 uppercase flex items-center gap-2 bg-orange-50 px-4 py-1 rounded-full"><Calendar size={14}/> Periodo: {selectedMonth} 2026</p>
        </div>

        <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-slate-200">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 text-[10px] uppercase font-black text-slate-500 border-b-2 border-slate-300">
                <th className="px-4 py-4 w-[50%]">Descripción de Cuenta</th>
                <th className="px-4 py-4 text-right">Saldo USD</th>
                <th className="px-4 py-4 text-right hidden sm:table-cell">Saldo Bs.</th>
                <th className="px-4 py-4 text-right">Suma de %</th>
              </tr>
            </thead>
            <tbody>
              {tree.map((node, i) => <ExpandableRow key={i} node={node} totalVentasUSD={baseVentas}/>)}
              <tr className="bg-[#111827] text-white font-black">
                <td className="px-4 py-6 text-sm uppercase tracking-widest">RESULTADO DEL EJERCICIO</td>
                <td className="px-4 py-6 text-right text-base text-orange-400 font-mono">{new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2 }).format(totalUSD)}</td>
                <td className="px-4 py-6 text-right text-base hidden sm:table-cell font-mono">{new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2 }).format(totalBs)}</td>
                <td className="px-4 py-6 text-right text-base text-orange-400 font-mono">{(Math.abs(totalUSD)/baseVentas*100).toFixed(2)}%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
};

// ============================================================================
// DASHBOARD PRINCIPAL
// ============================================================================
const ContDash = ({ onSelectModule, dbData, setDbData }) => {
  const handleUpload = async (e) => {
    if (e.target.files.length === 0) return;
    const newData = await processAnyFile(e.target.files);
    setDbData(newData);
    alert(`Éxito: Se procesaron ${e.target.files.length} reportes.`);
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans">
      <header className="bg-white border-b border-gray-300 px-8 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <Building2 size={28} className="text-[#F97316]" />
          <h1 className="font-black text-xl text-slate-800 uppercase tracking-tighter">Servicios Jiret G&B, C.A.</h1>
        </div>
        <button className="text-slate-400 hover:text-red-600 transition-colors flex items-center gap-2 font-bold text-xs uppercase"><LogOut size={16}/> Salir</button>
      </header>
      
      <main className="p-8 max-w-5xl mx-auto">
        <div className="bg-white p-8 rounded-2xl border-2 border-dashed border-slate-300 mb-8 text-center shadow-sm">
          <Upload className="mx-auto text-orange-500 mb-4" size={40}/>
          <h2 className="font-black text-xl text-slate-800 uppercase mb-1">Cargar Reportes Mensuales</h2>
          <p className="text-slate-500 text-sm mb-6 mx-auto">Sube archivos <strong>.txt</strong> de Getxu o archivos <strong>.xlsx</strong> de Excel.</p>
          
          <div className="flex justify-center items-center gap-4">
            <label className="bg-[#111827] text-white px-8 py-3 rounded-xl font-black uppercase text-xs cursor-pointer hover:bg-black transition-all flex items-center gap-2 shadow-lg">
              <Upload size={16}/> Buscar Archivos
              <input type="file" multiple accept=".txt, .xlsx, .xls, .csv" className="hidden" onChange={handleUpload}/>
            </label>
            {dbData.length > 0 && <span className="text-green-600 font-black text-xs uppercase bg-green-50 px-4 py-3 rounded-xl border border-green-200 flex items-center gap-2"><CheckCircle size={16}/> Data Lista</span>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div onClick={() => onSelectModule('resultado')} className="bg-white p-8 rounded-2xl shadow-sm border-t-8 border-[#F97316] cursor-pointer hover:scale-105 transition-all group">
            <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mb-4 group-hover:bg-[#F97316] transition-colors">
              <FileSpreadsheet size={32} className="text-[#F97316] group-hover:text-white"/>
            </div>
            <h3 className="font-black text-xl text-slate-800 uppercase">Estado de Resultado</h3>
            <p className="text-slate-500 text-sm mt-2">Ingresos y Gastos con navegación por meses.</p>
          </div>
          
          <div className="bg-white p-8 rounded-2xl shadow-sm border-t-8 border-slate-300 opacity-60 grayscale cursor-not-allowed">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <Wallet size={32} className="text-slate-400"/>
            </div>
            <h3 className="font-black text-xl text-slate-400 uppercase">Balance General</h3>
            <p className="text-slate-400 text-sm mt-2">Próximamente: Activos, Pasivos y Patrimonio.</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default function App() {
  const [view, setView] = useState('dash');
  const [dbData, setDbData] = useState([]);

  return (
    <>
      {view === 'dash' && <ContDash onSelectModule={setView} dbData={dbData} setDbData={setDbData} />}
      {view === 'resultado' && <EstadoResultado onBack={() => setView('dash')} dbData={dbData} />}
    </>
  );
}

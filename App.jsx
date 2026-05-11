import React, { useState, useMemo } from 'react';
import { 
  ChevronRight, ChevronDown, FileSpreadsheet, Wallet, Building2,
  LayoutDashboard, ArrowLeft, LogOut, Calendar, Upload, CheckCircle, AlertCircle
} from 'lucide-react';

// ============================================================================
// LÓGICA DE PROCESAMIENTO AVANZADA (Parser Inteligente)
// ============================================================================
const processTxtFiles = async (files) => {
  let allParsedData = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const text = await file.text();
    
    // Identificar el mes
    let month = "Enero"; 
    const monthMatch = file.name.match(/(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)/i);
    if (monthMatch) month = monthMatch[0].charAt(0).toUpperCase() + monthMatch[0].slice(1).toLowerCase();

    const lines = text.split(/\r?\n/);
    let pathStack = [];

    lines.forEach(line => {
      const cleanLine = line.trim();
      if (!cleanLine || cleanLine.includes("SERVICIOS JIRET") || cleanLine.includes("RIF:") || cleanLine.includes("Etiquetas de fila")) return;
      if (cleanLine.includes("ESTADO DE RESULTADO") || cleanLine.startsWith("Total") || cleanLine.includes("RESULTADO")) return;

      const usdMatch = line.match(/USD\s*([-\d.,]+|\s*-\s*)/);
      const bsMatch = line.match(/Bs\.\s*([-\d.,]+|\s*-\s*)/);

      if (usdMatch && bsMatch) {
        // Es una línea de detalle (factura)
        const name = line.split('USD')[0].trim();
        const cleanVal = (val) => {
          if (!val || val.trim() === '-' || val.trim() === '') return 0;
          return parseFloat(val.trim().replace(/\./g, '').replace(',', '.'));
        };

        const usd = cleanVal(usdMatch[1]);
        const bs = cleanVal(bsMatch[1]);
        
        const fullPath = pathStack.join('>');
        allParsedData.push({ month, path: fullPath, name, usd, bs });
      } else {
        // Es una categoría o cuenta
        const parts = line.split('\t').map(p => p.trim()).filter(p => p !== "");
        const categoryName = parts[0];

        if (["INGRESOS", "COSTOS", "GASTOS"].includes(categoryName)) {
          pathStack = [categoryName];
        } else if (categoryName) {
          if (pathStack[pathStack.length - 1] !== categoryName) {
            if (/^\d\./.test(categoryName)) {
              pathStack = pathStack.filter(p => !/^\d\./.test(p));
            }
            pathStack.push(categoryName);
          }
        }
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
  const [isOpen, setIsOpen] = useState(!isLeaf && level < 3); 

  const formatCurrency = (val) => new Intl.NumberFormat('es-VE', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);

  let percentStr = '0,00%';
  if (totalVentasUSD && node.u !== 0) {
    const percent = (Math.abs(node.u) / Math.abs(totalVentasUSD)) * 100;
    percentStr = `${formatCurrency(percent)}%`;
  }

  let rowClass = "cursor-pointer transition-colors border-b border-gray-200 ";
  let textClass = "";

  if (isLeaf) {
    rowClass += "bg-white hover:bg-gray-50";
    textClass = "text-gray-600 font-normal text-sm";
  } else if (isAccountNode) {
    rowClass += "bg-white hover:bg-orange-50";
    textClass = "text-black font-bold text-sm uppercase"; 
  } else {
    if (level === 0) {
      rowClass += " bg-[#111827] hover:bg-gray-800 text-white";
      textClass = "font-black text-base uppercase tracking-wider";
    } else {
      rowClass += " bg-[#F97316] hover:bg-orange-600 text-white";
      textClass = "font-bold text-sm uppercase tracking-wide";
    }
  }

  return (
    <>
      <tr onClick={() => !isLeaf && setIsOpen(!isOpen)} className={rowClass}>
        <td className={`px-4 py-2.5 flex items-center gap-2 ${textClass} ${isAccountNode ? 'border-l-4 border-[#F97316]' : ''}`} style={{ paddingLeft: `${level * 1.5 + 1}rem` }}>
          {!isLeaf ? (isOpen ? <ChevronDown size={16}/> : <ChevronRight size={16}/>) : <span className="w-4"></span>}
          <span className={`${isLeaf ? 'truncate max-w-[400px]' : ''}`} title={node.n}>{node.n}</span>
        </td>
        <td className="px-4 py-2.5 text-right font-mono text-xs font-bold">{formatCurrency(node.u)}</td>
        <td className="px-4 py-2.5 text-right font-mono text-xs hidden sm:table-cell">{formatCurrency(node.b)}</td>
        <td className="px-4 py-2.5 text-right font-mono text-xs">{percentStr}</td>
      </tr>
      
      {/* Hijos de este nodo */}
      {isOpen && !isLeaf && node.c.map((child, idx) => (
        <ExpandableRow key={idx} node={child} level={level + 1} totalVentasUSD={totalVentasUSD} />
      ))}

      {/* Fila de Subtotal/Total de la categoría (Se muestra al final de los hijos si está abierto) */}
      {isOpen && !isLeaf && (
        <tr className={level === 0 ? "bg-gray-300 border-b-4 border-black" : "bg-orange-100 border-b-2 border-orange-300"}>
          <td className={`px-4 py-3 font-black text-xs uppercase tracking-widest ${level === 0 ? 'text-black' : 'text-orange-900'}`} style={{ paddingLeft: `${level * 1.5 + 2}rem` }}>
            Total {node.n}
          </td>
          <td className={`px-4 py-3 text-right font-mono text-xs font-black ${level === 0 ? 'text-black' : 'text-orange-900'}`}>{formatCurrency(node.u)}</td>
          <td className={`px-4 py-3 text-right font-mono text-xs font-black hidden sm:table-cell ${level === 0 ? 'text-black' : 'text-orange-900'}`}>{formatCurrency(node.b)}</td>
          <td className={`px-4 py-3 text-right font-mono text-xs font-black ${level === 0 ? 'text-black' : 'text-orange-900'}`}>{percentStr}</td>
        </tr>
      )}
    </>
  );
};

// ============================================================================
// MÓDULO: ESTADO DE RESULTADO
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
  const formatResult = (val) => new Intl.NumberFormat('es-VE', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <header className="bg-white border-b p-4 flex justify-between items-center sticky top-0 z-30 shadow-sm">
        <button onClick={onBack} className="flex items-center gap-2 font-black text-xs text-slate-600 hover:text-black uppercase transition-colors"><ArrowLeft size={16}/> Volver</button>
        <div className="flex gap-2">
          {availableMonths.map(m => (
            <button key={m} onClick={() => setSelectedMonth(m)} className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase transition-all ${selectedMonth === m ? 'bg-orange-600 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>{m}</button>
          ))}
        </div>
      </header>
      
      <main className="p-4 md:p-8 max-w-6xl mx-auto">
        {/* HOJA MEMBRETADA */}
        <div className="bg-white px-8 py-10 border-t-8 border-[#F97316] mb-8 shadow-md flex flex-col items-center text-center">
          <h1 className="text-2xl sm:text-3xl font-black font-serif text-[#111827] uppercase tracking-tight mb-2">Servicios Jiret G&B, C.A.</h1>
          <div className="w-16 h-1.5 bg-[#F97316] mb-4 rounded-full"></div>
          <p className="font-sans text-sm text-[#111827] font-bold mb-2 tracking-wide">RIF: J-412309374</p>
          <p className="font-sans text-xs text-gray-600 max-w-2xl font-semibold uppercase tracking-widest leading-relaxed mb-8">
            AV CIRCUNVALACION NRO 02 C.C EL DIVIDIVI LOCAL G-9 NIVEL PB SECTOR EL TREBOL MARACAIBO-ZULIA
          </p>
          <div className="border-b-2 border-gray-200 pb-3 w-full max-w-lg mb-4">
            <h2 className="text-xl font-black font-serif text-gray-800 uppercase tracking-widest">
              Estado de Resultado Integral
            </h2>
          </div>
          <p className="font-sans text-sm text-orange-600 font-black uppercase flex items-center gap-2 bg-orange-50 px-4 py-2 rounded-full">
            <Calendar size={16}/> Periodo: {selectedMonth}
          </p>
        </div>

        {dbData.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-xl shadow-sm border-t-4 border-orange-500">
            <AlertCircle size={48} className="mx-auto text-orange-400 mb-4"/>
            <p className="text-gray-500 font-bold">No hay reportes cargados. Por favor, importa los archivos TXT en el Dashboard.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-slate-200">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 text-[10px] uppercase font-black text-slate-500 border-b-2 border-slate-300">
                  <th className="px-4 py-4 w-[50%]">Etiquetas de Fila</th>
                  <th className="px-4 py-4 text-right">Saldo USD</th>
                  <th className="px-4 py-4 text-right hidden sm:table-cell">Saldo Bs.</th>
                  <th className="px-4 py-4 text-right">Suma de %</th>
                </tr>
              </thead>
              <tbody>
                {tree.map((node, i) => <ExpandableRow key={i} node={node} totalVentasUSD={baseVentas}/>)}
                
                {/* FILA FINAL DE RESULTADO */}
                <tr className="bg-[#111827] text-white font-black">
                  <td className="px-4 py-6 text-sm uppercase tracking-widest">RESULTADO DEL EJERCICIO</td>
                  <td className="px-4 py-6 text-right text-base text-orange-400 font-mono">{formatResult(totalUSD)}</td>
                  <td className="px-4 py-6 text-right text-base hidden sm:table-cell font-mono">{formatResult(totalBs)}</td>
                  <td className="px-4 py-6 text-right text-base text-orange-400 font-mono">{(Math.abs(totalUSD)/baseVentas*100).toFixed(2)}%</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
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
    const newData = await processTxtFiles(e.target.files);
    setDbData(newData);
    alert(`Reportes importados: ${e.target.files.length}. Revisa el Estado de Resultados.`);
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
          <h2 className="font-black text-xl text-slate-800 uppercase mb-1">Cargar Reportes de Sistema (.txt)</h2>
          <p className="text-slate-500 text-sm mb-6 max-w-lg mx-auto">Selecciona uno o varios archivos TXT generados por el sistema matriz para consolidar la información financiera mensual.</p>
          
          <div className="flex justify-center items-center gap-4">
            <label className="bg-[#111827] text-white px-8 py-3 rounded-xl font-black uppercase text-xs cursor-pointer hover:bg-black transition-all flex items-center gap-2 shadow-lg">
              <Upload size={16}/> Buscar Archivos
              <input type="file" multiple accept=".txt" className="hidden" onChange={handleUpload}/>
            </label>
            {dbData.length > 0 && (
              <span className="flex items-center gap-1 text-green-600 font-bold text-xs uppercase bg-green-50 px-4 py-3 rounded-xl border border-green-200">
                <CheckCircle size={16} /> Data Lista
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div onClick={() => onSelectModule('resultado')} className="bg-white p-8 rounded-2xl shadow-sm border-t-8 border-[#F97316] cursor-pointer hover:scale-105 transition-all group">
            <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mb-4 group-hover:bg-[#F97316] transition-colors">
              <FileSpreadsheet size={32} className="text-[#F97316] group-hover:text-white"/>
            </div>
            <h3 className="font-black text-xl text-slate-800 uppercase">Estado de Resultado</h3>
            <p className="text-slate-500 text-sm mt-2">Flujo de ingresos, costos y gastos operativos interactivo por mes.</p>
          </div>
          
          <div onClick={() => alert("Módulo en desarrollo")} className="bg-white p-8 rounded-2xl shadow-sm border-t-8 border-[#111827] cursor-not-allowed opacity-60">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <Wallet size={32} className="text-[#111827]"/>
            </div>
            <h3 className="font-black text-xl text-slate-800 uppercase">Balance General</h3>
            <p className="text-slate-500 text-sm mt-2">Estructura para el control de Activos, Pasivos y Patrimonio.</p>
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

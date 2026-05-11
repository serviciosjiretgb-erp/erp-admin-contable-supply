import React, { useState, useMemo } from 'react';
import { 
  ChevronRight, 
  ChevronDown, 
  FileSpreadsheet, 
  Wallet, 
  Building2,
  LayoutDashboard,
  ArrowLeft,
  LogOut,
  Calendar,
  Upload,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

// ============================================================================
// LÓGICA DE PROCESAMIENTO AVANZADA (Parser Inteligente)
// ============================================================================
const processTxtFiles = async (files) => {
  let allParsedData = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const text = await file.text();
    
    let month = "Desconocido";
    const monthMatch = file.name.match(/(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)/i);
    if (monthMatch) {
      month = monthMatch[0].charAt(0).toUpperCase() + monthMatch[0].slice(1).toLowerCase();
    }

    const lines = text.split('\n');
    let pathStack = [];

    lines.forEach(line => {
      const cleanLine = line.trim();
      if (!cleanLine || cleanLine.includes("SERVICIOS JIRET") || cleanLine.includes("Etiquetas de fila")) return;
      if (cleanLine.includes("ESTADO DE RESULTADO") || cleanLine.startsWith("Total") || cleanLine.includes("RESULTADO")) return;

      // Detectar si es una línea de datos (contiene montos USD y Bs)
      const usdMatch = line.match(/USD\s*([-\d.,]+|\s*-\s*)/);
      const bsMatch = line.match(/Bs\.\s*([-\d.,]+|\s*-\s*)/);

      if (usdMatch && bsMatch) {
        // Es una factura o detalle
        const name = line.split('USD')[0].trim();
        
        const cleanVal = (val) => {
          if (!val || val.trim() === '-' || val.trim() === '') return '0.00';
          return val.trim().replace(/\./g, '').replace(/,/g, '.');
        };

        const usd = cleanVal(usdMatch[1]);
        const bs = cleanVal(bsMatch[1]);
        
        // Construir ruta jerárquica
        const fullPath = pathStack.join('>');
        allParsedData.push(`${month}|resultados|${fullPath}|${name}|${usd}|${bs}`);
      } else {
        // Es una categoría o cuenta contable
        const parts = line.split('\t').map(p => p.trim()).filter(p => p !== "");
        const categoryName = parts[0];

        if (["INGRESOS", "COSTOS", "GASTOS"].includes(categoryName)) {
          pathStack = [categoryName];
        } else {
          // Evitar duplicados en la ruta (como "INGRESOS OPERACIONALES" que sale dos veces)
          if (pathStack[pathStack.length - 1] !== categoryName) {
            // Si es una cuenta (empieza por número), reemplazamos la última cuenta si existía
            if (/^[456]\.\d/.test(categoryName)) {
              pathStack = pathStack.filter(p => !/^[456]\.\d/.test(p));
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
// COMPONENTE: FILA EXPANSIBLE
// ============================================================================
const ExpandableRow = ({ node, level = 0, isBalance, totalVentasUSD }) => {
  const isAccountNode = /^\d\./.test(node.n);
  const isLeaf = !node.c || node.c.length === 0;
  const isStructural = !isAccountNode && !isLeaf;
  const [isOpen, setIsOpen] = useState(isStructural);

  const formatCurrency = (val) => new Intl.NumberFormat('es-VE', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);

  let percentStr = '';
  if (!isBalance && totalVentasUSD) {
    const percent = (Math.abs(node.u) / totalVentasUSD) * 100 * (node.u < 0 ? 1 : -1);
    percentStr = `${new Intl.NumberFormat('es-VE', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(percent)}%`;
  }

  const showRowBalance = isLeaf || isAccountNode;
  let rowClass = "cursor-pointer transition-colors border-b border-gray-100 ";
  let textClass = "";

  if (isLeaf) {
    rowClass += "bg-white hover:bg-gray-50";
    textClass = "text-gray-600 font-normal text-sm";
  } else if (isAccountNode) {
    rowClass += "bg-white hover:bg-orange-50 border-gray-200";
    textClass = "text-black font-bold text-sm uppercase"; 
  } else {
    if (level === 0) {
      rowClass += " bg-[#111827] hover:bg-gray-800 text-white";
      textClass = "font-bold text-base uppercase tracking-wider";
    } else {
      rowClass += " bg-[#F97316] hover:bg-orange-600 text-white";
      textClass = "font-bold text-sm uppercase";
    }
  }

  return (
    <>
      <tr onClick={() => !isLeaf && setIsOpen(!isOpen)} className={rowClass}>
        <td className={`px-4 py-2.5 flex items-center gap-2 ${textClass} ${isAccountNode ? 'border-l-4 border-[#F97316]' : ''}`} style={{ paddingLeft: `${(level * 1.5) + (isAccountNode ? 0.5 : 1)}rem` }}>
          {!isLeaf ? (isOpen ? <ChevronDown size={16}/> : <ChevronRight size={16}/>) : (<span className="w-4"></span>)}
          <span className={`${isLeaf ? 'truncate max-w-[400px]' : ''}`} title={node.n}>{node.n}</span>
        </td>
        <td className="px-4 py-2.5 text-right font-sans tabular-nums">{showRowBalance ? formatCurrency(node.u) : ''}</td>
        <td className="px-4 py-2.5 text-right font-sans tabular-nums hidden sm:table-cell">{showRowBalance ? formatCurrency(node.b) : ''}</td>
        <td className="px-4 py-2.5 text-right font-sans tabular-nums">{showRowBalance ? percentStr : ''}</td>
      </tr>
      {isOpen && !isLeaf && node.c.map((child, idx) => (<ExpandableRow key={idx} node={child} level={level + 1} isBalance={isBalance} totalVentasUSD={totalVentasUSD} />))}
    </>
  );
};

// ============================================================================
// MÓDULO: ESTADO DE RESULTADO
// ============================================================================
const EstadoResultado = ({ onBack, dbData }) => {
  const availableMonths = useMemo(() => [...new Set(dbData.map(line => line.split('|')[0]))], [dbData]);
  const [selectedMonth, setSelectedMonth] = useState(availableMonths[0] || '');

  const currentTree = useMemo(() => {
    const root = [];
    dbData.filter(line => line.split('|')[0] === selectedMonth).forEach(line => {
      const [,, pathStr, leafName, usdStr, bsStr] = line.split('|');
      const pathArray = pathStr.split('>');
      let currentLevel = root;
      pathArray.forEach(folderName => {
        let existingFolder = currentLevel.find(n => n.n === folderName);
        if (!existingFolder) {
          existingFolder = { n: folderName, c: [], u: 0, b: 0 };
          currentLevel.push(existingFolder);
        }
        currentLevel = existingFolder.c;
      });
      currentLevel.push({ n: leafName, u: parseFloat(usdStr), b: parseFloat(bsStr), isLeaf: true });
    });

    const computeTotals = (nodes) => {
      let sumU = 0, sumB = 0;
      nodes.forEach(node => {
        if (!node.isLeaf) {
          const totals = computeTotals(node.c);
          node.u = totals.u;
          node.b = totals.b;
        }
        sumU += node.u;
        sumB += node.b;
      });
      return { u: sumU, b: sumB };
    };
    computeTotals(root);
    return root;
  }, [dbData, selectedMonth]);

  const totalTreeUSD = currentTree.reduce((acc, n) => acc + n.u, 0);
  const totalTreeBs = currentTree.reduce((acc, n) => acc + n.b, 0);
  const ingresosNode = currentTree.find(n => n.n === 'INGRESOS');
  const baseVentasUSD = ingresosNode ? Math.abs(ingresosNode.u) : 1;
  const formatResult = (val) => new Intl.NumberFormat('es-VE', { style: 'decimal', minimumFractionDigits: 2 }).format(val);

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white border-b border-gray-300 py-3 px-8 flex justify-between items-center sticky top-0 z-20">
        <button onClick={onBack} className="flex items-center gap-2 text-gray-600 font-bold uppercase text-xs"><ArrowLeft size={18}/> Volver</button>
        <div className="flex gap-2">
          {availableMonths.map(m => (
            <button key={m} onClick={() => setSelectedMonth(m)} className={`px-4 py-1.5 rounded text-xs font-bold ${selectedMonth === m ? 'bg-[#F97316] text-white' : 'bg-gray-100'}`}>{m}</button>
          ))}
        </div>
      </header>
      <main className="p-8 max-w-6xl mx-auto">
        {dbData.length === 0 ? (
          <div className="bg-white p-12 text-center rounded shadow-sm border-t-4 border-orange-500">
            <AlertCircle size={48} className="mx-auto text-orange-400 mb-4"/>
            <p className="text-gray-500 font-bold">No hay reportes cargados. Por favor, importa los archivos TXT en el Dashboard.</p>
          </div>
        ) : (
          <div className="bg-white rounded shadow-sm overflow-hidden border border-gray-200">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-[10px] uppercase font-black text-gray-500 border-b">
                  <th className="px-4 py-4 w-[50%]">Etiquetas de Fila</th>
                  <th className="px-4 py-4 text-right">Saldo USD</th>
                  <th className="px-4 py-4 text-right hidden sm:table-cell">Saldo Bs.</th>
                  <th className="px-4 py-4 text-right">%</th>
                </tr>
              </thead>
              <tbody>
                {currentTree.map((node, i) => <ExpandableRow key={i} node={node} totalVentasUSD={baseVentasUSD}/>)}
                <tr className="bg-[#111827] text-white font-black">
                  <td className="px-4 py-6 text-lg">RESULTADO DEL EJERCICIO</td>
                  <td className="px-4 py-6 text-right text-lg text-[#F97316]">{formatResult(totalTreeUSD)}</td>
                  <td className="px-4 py-6 text-right text-lg hidden sm:table-cell">{formatResult(totalTreeBs)}</td>
                  <td className="px-4 py-6 text-right">100%</td>
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
    alert("Archivos procesados correctamente.");
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white border-b border-gray-300 px-8 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <Building2 size={28} className="text-[#F97316]" />
          <h1 className="text-xl font-black text-[#111827] uppercase">Servicios Jiret G&B, C.A.</h1>
        </div>
      </header>
      <main className="p-8 max-w-6xl mx-auto">
        <div className="bg-white p-6 rounded-lg border-2 border-dashed border-gray-300 mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h2 className="font-bold text-gray-800">Importación de Datos</h2>
            <p className="text-sm text-gray-500">Sube los archivos TXT de Enero, Febrero, Marzo y Abril.</p>
          </div>
          <label className="bg-[#111827] text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 cursor-pointer hover:bg-black transition-all">
            <Upload size={20}/> Cargar Reportes
            <input type="file" multiple accept=".txt" className="hidden" onChange={handleUpload}/>
          </label>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div onClick={() => onSelectModule('resultado')} className="bg-white p-8 rounded-xl shadow-sm border-t-8 border-[#F97316] cursor-pointer hover:shadow-lg transition-all group">
            <FileSpreadsheet size={40} className="text-orange-500 mb-4 group-hover:scale-110 transition-transform"/>
            <h3 className="text-xl font-black text-gray-800 uppercase">Estado de Resultado</h3>
            <p className="text-gray-500 text-sm mt-2">Visualiza el flujo de ingresos y gastos de forma jerárquica.</p>
          </div>
          <div onClick={() => alert("Módulo en desarrollo")} className="bg-white p-8 rounded-xl shadow-sm border-t-8 border-[#111827] cursor-pointer hover:shadow-lg transition-all group">
            <Wallet size={40} className="text-gray-800 mb-4 group-hover:scale-110 transition-transform"/>
            <h3 className="text-xl font-black text-gray-800 uppercase">Balance General</h3>
            <p className="text-gray-500 text-sm mt-2">Control de Activos, Pasivos y Patrimonio de la empresa.</p>
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

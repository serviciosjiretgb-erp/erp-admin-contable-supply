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
// LÓGICA DE PROCESAMIENTO (Parser de TXT a Base de Datos)
// ============================================================================
const processTxtFiles = async (files) => {
  let allParsedData = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const text = await file.text();
    
    // Extraer el mes del nombre del archivo (ej. "abril 2026.txt" -> "Abril")
    let month = "Desconocido";
    const monthMatch = file.name.match(/(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)/i);
    if (monthMatch) {
      month = monthMatch[0].charAt(0).toUpperCase() + monthMatch[0].slice(1).toLowerCase();
    }

    const lines = text.split('\n');
    let currentAccount = "SIN_CUENTA";

    lines.forEach(line => {
      line = line.trim();
      if (!line || line.startsWith('Total') || line.startsWith('RESULTADO') || line.startsWith('Etiquetas')) return;

      // Detectar la cuenta contable (ej. 4.1.01.01.001-INGRESOS...)
      if (/^[456]\.\d/.test(line)) {
        currentAccount = line;
        return;
      }

      // Detectar líneas con montos
      if (line.includes('USD') && line.includes('Bs.')) {
        const name = line.split('USD')[0].trim();
        const usdMatch = line.match(/USD\s*([-\d.,]+|\s*-\s*)/);
        const bsMatch = line.match(/Bs\.\s*([-\d.,]+|\s*-\s*)/);

        if (usdMatch && bsMatch) {
          let usdRaw = usdMatch[1].trim();
          let bsRaw = bsMatch[1].trim();

          // Limpiar montos: convertir guiones en 0.00 y formato VE a formato informático
          const cleanAmount = (val) => {
            if (val === '-' || val === '') return '0.00';
            return val.replace(/\./g, '').replace(/,/g, '.');
          };

          const usdVal = cleanAmount(usdRaw);
          const bsVal = cleanAmount(bsRaw);

          let root = "GASTOS";
          if (currentAccount.startsWith('4')) root = "INGRESOS";
          else if (currentAccount.startsWith('5')) root = "COSTOS";

          allParsedData.push(`${month}|resultados|${root}>${currentAccount}|${name}|${usdVal}|${bsVal}`);
        }
      }
    });
  }
  return allParsedData;
};


// ============================================================================
// COMPONENTE: FILA EXPANSIBLE (Maneja el árbol de datos)
// ============================================================================
const ExpandableRow = ({ node, level = 0, isBalance, totalVentasUSD }) => {
  const isAccountNode = /^\d\./.test(node.n);
  const isLeaf = !node.c || node.c.length === 0;
  const isStructural = !isAccountNode && !isLeaf;
  const [isOpen, setIsOpen] = useState(isStructural ? true : false);

  const formatCurrency = (val) => new Intl.NumberFormat('es-VE', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);

  const showPercent = !isBalance;
  let percentStr = '';
  if (showPercent && totalVentasUSD) {
    const percent = (Math.abs(node.u) / totalVentasUSD) * 100 * (node.u < 0 ? 1 : -1);
    percentStr = `${new Intl.NumberFormat('es-VE', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(percent)}%`;
  }

  const showRowBalance = isLeaf || isAccountNode;
  let rowClass = "";
  let textClass = "";

  if (isLeaf) {
    rowClass = "bg-white hover:bg-gray-50 border-b border-gray-100 transition-colors";
    textClass = "text-gray-600 font-normal text-sm";
  } else if (isAccountNode) {
    rowClass = "bg-white hover:bg-orange-50 border-b border-gray-200 cursor-pointer transition-colors";
    textClass = "text-black font-bold text-sm uppercase"; 
  } else {
    rowClass = "cursor-pointer transition-colors border-b border-gray-300";
    if (level === 0) {
      rowClass += " bg-[#111827] hover:bg-gray-800"; 
      textClass = "text-white font-bold text-base uppercase tracking-wider";
    } else {
      rowClass += " bg-[#F97316] hover:bg-orange-600"; 
      textClass = "text-white font-bold text-sm uppercase";
    }
  }

  return (
    <>
      <tr onClick={() => !isLeaf && setIsOpen(!isOpen)} className={rowClass}>
        <td className={`px-4 py-2.5 flex items-center gap-2 ${textClass} ${isAccountNode ? 'border-l-4 border-[#F97316]' : ''}`} style={{ paddingLeft: `${(level * 1.5) + (isAccountNode ? 0.5 : 1)}rem` }}>
          {!isLeaf ? (isOpen ? <ChevronDown size={16} className={level === 0 || level === 1 ? "text-white" : "text-[#F97316]"}/> : <ChevronRight size={16} className={level === 0 || level === 1 ? "text-white" : "text-[#F97316]"}/>) : (<span className="w-4 inline-block"></span>)}
          <span className={`${isLeaf ? 'truncate max-w-[300px] md:max-w-[500px]' : ''}`} title={node.n}>{node.n}</span>
        </td>
        <td className={`px-4 py-2.5 text-right font-sans tabular-nums tracking-tight ${level===0||level===1 ? 'text-white' : 'text-gray-900'} ${isAccountNode || isLeaf ? '' : 'font-medium'}`}>
          {showRowBalance ? formatCurrency(node.u) : ''}
        </td>
        <td className={`px-4 py-2.5 text-right font-sans tabular-nums tracking-tight hidden sm:table-cell ${level===0||level===1 ? 'text-white' : 'text-gray-500'}`}>
          {showRowBalance ? formatCurrency(node.b) : ''}
        </td>
        {showPercent && (
          <td className={`px-4 py-2.5 text-right font-sans tabular-nums tracking-tight ${isLeaf ? 'text-gray-400' : 'text-gray-600'}`}>
            {showRowBalance && showPercent ? percentStr : ''}
          </td>
        )}
      </tr>
      {isOpen && !isLeaf && node.c.map((child, idx) => (<ExpandableRow key={idx} node={child} level={level + 1} isBalance={isBalance} totalVentasUSD={totalVentasUSD} />))}
      {isOpen && level === 0 && (
        <tr className="bg-gray-300 border-t-2 border-b-4 border-black">
          <td className="px-4 py-4 text-black font-black text-sm uppercase tracking-widest" style={{ paddingLeft: '1.5rem' }}>TOTAL {node.n}</td>
          <td className="px-4 py-4 text-right font-sans tabular-nums font-black text-black text-base tracking-tight">{formatCurrency(node.u)}</td>
          <td className="px-4 py-4 text-right font-sans tabular-nums font-black text-black text-base tracking-tight hidden sm:table-cell">{formatCurrency(node.b)}</td>
          {showPercent && <td className="px-4 py-4 text-right font-sans tabular-nums font-black text-black text-base tracking-tight">{percentStr}</td>}
        </tr>
      )}
    </>
  );
};

// ============================================================================
// MÓDULO: ESTADO DE RESULTADO
// ============================================================================
const EstadoResultado = ({ onBack, dbData }) => {
  // Extraer meses disponibles dinámicamente
  const availableMonths = useMemo(() => {
    if (dbData.length === 0) return [];
    const months = dbData.map(line => line.split('|')[0]);
    return [...new Set(months)];
  }, [dbData]);

  const [selectedMonth, setSelectedMonth] = useState(availableMonths[0] || 'Sin Datos');

  const currentTree = useMemo(() => {
    if (dbData.length === 0) return [];
    const root = [];
    
    dbData.forEach(line => {
      const [mes, tab, pathStr, leafName, usdStr, bsStr] = line.split('|');
      if (mes !== selectedMonth) return; // Solo resultados por ahora

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
      currentLevel.push({ n: leafName, u: parseFloat(usdStr) || 0, b: parseFloat(bsStr) || 0, isLeaf: true });
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

  const formatResult = (val) => new Intl.NumberFormat('es-VE', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);
  
  let baseVentasUSD = 1;
  const ingresosNode = currentTree.find(n => n.n === 'INGRESOS');
  if (ingresosNode) baseVentasUSD = Math.abs(ingresosNode.u);

  const totalTreeUSD = currentTree.reduce((acc, n) => acc + n.u, 0);
  const totalTreeBs = currentTree.reduce((acc, n) => acc + n.b, 0);
  const percentResultStr = `${new Intl.NumberFormat('es-VE', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format((Math.abs(totalTreeUSD) / baseVentasUSD) * 100 * (totalTreeUSD < 0 ? 1 : -1))}%`;

  return (
    <div className="min-h-screen bg-gray-100 pb-12">
      <header className="bg-white border-b border-gray-300 py-3 shadow-sm sticky top-0 z-20 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-black font-bold uppercase text-sm transition-colors">
            <ArrowLeft size={18} /> Volver al Dashboard
          </button>

          {availableMonths.length > 0 && (
            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg border border-gray-300">
              <Calendar size={16} className="text-[#F97316] ml-2 mr-1" />
              <span className="text-xs font-bold text-gray-500 uppercase mr-2">Corte:</span>
              {availableMonths.map(mes => (
                <button 
                  key={mes} 
                  onClick={() => setSelectedMonth(mes)} 
                  className={`px-4 py-1.5 rounded text-sm font-bold ${selectedMonth === mes ? 'bg-[#F97316] text-white shadow-sm' : 'text-gray-600'}`}
                >
                  {mes}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-white px-8 py-8 border-t-8 border-[#F97316] mb-8 shadow-sm flex flex-col items-center text-center">
          <h1 className="text-2xl sm:text-3xl font-bold font-serif text-[#111827] uppercase tracking-tight mb-2">Servicios Jiret G&B, C.A.</h1>
          <div className="w-16 h-1 bg-[#F97316] mb-4"></div>
          <p className="font-sans text-sm text-[#111827] font-bold mb-1">RIF: J412309374</p>
          <h2 className="mt-8 text-xl font-bold font-serif text-gray-500 uppercase tracking-widest border-b border-gray-300 pb-2 inline-block">Estado de Resultado Integral</h2>
          <p className="font-sans text-sm text-gray-500 font-bold mt-2 uppercase">Periodo: {selectedMonth}</p>
        </div>

        {dbData.length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-6 rounded-lg flex items-center gap-3 shadow-sm justify-center">
            <AlertCircle size={24} />
            <p className="font-medium text-lg">No hay datos cargados. Ve al Dashboard e importa los reportes TXT.</p>
          </div>
        ) : (
          <div className="animate-in fade-in duration-500">
            <div className="bg-white rounded shadow border border-gray-300 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-100 border-b-2 border-gray-400 text-xs uppercase tracking-wider text-black font-black">
                      <th className="px-6 py-4 border-r border-gray-300 w-[60%]">Cuenta Contable</th>
                      <th className="px-4 py-4 text-right border-r border-gray-300 w-32">SALDO (USD)</th>
                      <th className="px-4 py-4 text-right border-r border-gray-300 hidden sm:table-cell w-36">SALDO (BS)</th>
                      <th className="px-4 py-4 text-right w-24">SUMA DE %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentTree.map((node, idx) => (<ExpandableRow key={idx} node={node} isBalance={false} totalVentasUSD={baseVentasUSD} />))}
                    <tr className="bg-[#111827]">
                      <td className="px-6 py-6 font-black font-sans text-xl text-white border-r border-gray-700">RESULTADO DEL EJERCICIO</td>
                      <td className="px-4 py-6 text-right font-sans tabular-nums font-black text-[#F97316] text-xl tracking-tight border-r border-gray-700">{formatResult(totalTreeUSD)}</td>
                      <td className="px-4 py-6 text-right font-sans tabular-nums font-black text-[#F97316] text-xl tracking-tight border-r border-gray-700 hidden sm:table-cell">{formatResult(totalTreeBs)}</td>
                      <td className="px-4 py-6 text-right font-sans tabular-nums font-black text-[#F97316] text-xl tracking-tight">{percentResultStr}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

// ============================================================================
// MÓDULO: BALANCE GENERAL (EN BLANCO)
// ============================================================================
const BalanceGeneral = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <button onClick={onBack} className="flex items-center gap-2 mb-6 text-gray-600 hover:text-black font-bold uppercase text-sm transition-colors">
        <ArrowLeft size={18} /> Volver al Dashboard
      </button>
      <div className="bg-white p-8 rounded shadow-sm border-t-4 border-[#111827]">
        <h1 className="text-2xl font-bold font-serif text-[#111827] uppercase mb-2">Estado de Situación Financiera</h1>
        <p className="text-gray-500 mb-8">Próximamente... Estructura para integrar los Activos y Pasivos.</p>
        <div className="border-2 border-dashed border-gray-300 rounded-lg h-64 flex items-center justify-center bg-gray-50">
          <p className="text-gray-400 font-bold uppercase">Espacio para la tabla del balance</p>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// DASHBOARD CONTABLE (CON IMPORTACIÓN MULTIPLE)
// ============================================================================
const ContDash = ({ onSelectModule, onLogout, dbData, setDbData }) => {
  
  const handleFileUpload = async (e) => {
    if(!e.target.files || e.target.files.length === 0) return;
    try {
      const parsedRecords = await processTxtFiles(e.target.files);
      setDbData(parsedRecords);
      alert(`¡Se procesaron ${e.target.files.length} reportes exitosamente!`);
    } catch (error) {
      alert("Hubo un error leyendo los archivos. Asegúrate de que sean los TXT correctos.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      <header className="bg-white border-b border-gray-300 px-8 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <Building2 size={28} className="text-[#F97316]" />
          <div>
            <h1 className="text-xl font-bold text-[#111827] uppercase tracking-tight">Servicios Jiret G&B, C.A.</h1>
            <p className="text-xs text-gray-500 font-bold uppercase">Módulo Financiero y Contable</p>
          </div>
        </div>
        <button onClick={onLogout} className="flex items-center gap-2 text-gray-500 hover:text-red-600 font-bold text-sm uppercase transition-colors">
          <LogOut size={18} /> Salir
        </button>
      </header>

      <main className="p-8 max-w-6xl mx-auto">
        <div className="flex items-center gap-2 mb-8">
          <LayoutDashboard size={24} className="text-gray-700" />
          <h2 className="text-2xl font-bold text-gray-800">Panel de Reportes</h2>
        </div>

        {/* ÁREA DE IMPORTACIÓN DE DATOS */}
        <div className="mb-10 bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-1">Importar Reportes Mensuales</h3>
            <p className="text-sm text-gray-500">Selecciona los archivos TXT (Ej. "abril 2026.txt", "mayo 2026.txt") exportados de tu sistema matriz.</p>
          </div>
          
          <div className="flex items-center gap-4">
            {dbData.length > 0 && (
              <span className="flex items-center gap-1 text-green-600 font-bold text-sm bg-green-50 px-3 py-1.5 rounded-full">
                <CheckCircle size={16} /> Datos Cargados
              </span>
            )}
            <label className="cursor-pointer bg-[#111827] hover:bg-gray-800 text-white font-bold py-2.5 px-6 rounded transition-colors flex items-center gap-2 shadow-sm">
              <Upload size={18} />
              Seleccionar TXTs
              <input type="file" multiple accept=".txt" className="hidden" onChange={handleFileUpload} />
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div onClick={() => onSelectModule('estado_resultado')} className="bg-white p-6 rounded-lg shadow-sm cursor-pointer hover:shadow-md hover:-translate-y-1 transition-all border-t-4 border-[#F97316] group">
            <div className="w-14 h-14 bg-orange-50 rounded-full flex items-center justify-center mb-4 group-hover:bg-[#F97316] transition-colors">
              <FileSpreadsheet size={28} className="text-[#F97316] group-hover:text-white" />
            </div>
            <h3 className="text-xl font-bold text-[#111827] mb-2">Estado de Resultado</h3>
            <p className="text-gray-500 text-sm">Visualizar el desglose de ingresos y gastos de los meses importados.</p>
          </div>

          <div onClick={() => onSelectModule('balance')} className="bg-white p-6 rounded-lg shadow-sm cursor-pointer hover:shadow-md hover:-translate-y-1 transition-all border-t-4 border-[#111827] group">
            <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-[#111827] transition-colors">
              <Wallet size={28} className="text-[#111827] group-hover:text-white" />
            </div>
            <h3 className="text-xl font-bold text-[#111827] mb-2">Balance General</h3>
            <p className="text-gray-500 text-sm">Estructura en blanco para los activos circulantes, pasivos y patrimonio.</p>
          </div>
        </div>
      </main>
    </div>
  );
};

// ============================================================================
// COMPONENTE PRINCIPAL ENRUTADOR
// ============================================================================
export default function App() {
  const [view, setView] = useState('cont_dash');
  
  // Almacenamos los datos aquí para que sobrevivan si el usuario sale y vuelve a entrar al reporte.
  const [dbData, setDbData] = useState([]);

  return (
    <>
      {view === 'cont_dash' && <ContDash onSelectModule={setView} onLogout={() => alert('Cerrando sesión...')} dbData={dbData} setDbData={setDbData} />}
      {view === 'estado_resultado' && <EstadoResultado onBack={() => setView('cont_dash')} dbData={dbData} />}
      {view === 'balance' && <BalanceGeneral onBack={() => setView('cont_dash')} />}
    </>
  );
}

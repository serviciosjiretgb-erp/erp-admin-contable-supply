import React, { useState, useMemo } from 'react';
import { 
  ChevronRight, 
  ChevronDown, 
  Calendar,
  FileSpreadsheet,
  Wallet
} from 'lucide-react';

// --- BASE DE DATOS MULTI-MES ---
// Los datos de Abril 2026 provienen directamente del reporte de Servicios Jiret G&B, C.A. 
const rawDataString = `
// ==================== ABRIL 2026 ====================
Abril|resultados|INGRESOS>INGRESOS OPERACIONALES>VENTAS BRUTAS>4.1.01.01.001-INGRESOS POR VENTAS GENERALES|"OMCORP, C.A" Facturas Ventas Gravables-00002950|-675.00|-425250.00
Abril|resultados|INGRESOS>INGRESOS OPERACIONALES>VENTAS BRUTAS>4.1.01.01.001-INGRESOS POR VENTAS GENERALES|"VECOFLEX, C.A." Facturas Ventas Gravables-00002956|-113.40|-54870.78
Abril|resultados|INGRESOS>INGRESOS OPERACIONALES>VENTAS BRUTAS>4.1.01.01.001-INGRESOS POR VENTAS GENERALES|ALIMENTOS BOTALON C.A Facturas Ventas Gravables-00002973|-447.00|-217742.25
Abril|resultados|INGRESOS>INGRESOS OPERACIONALES>VENTAS BRUTAS>4.1.01.01.001-INGRESOS POR VENTAS GENERALES|ANGEL VALERA Facturas Ventas Gravables-00002925|-95.76|-45691.76
Abril|resultados|INGRESOS>INGRESOS OPERACIONALES>VENTAS BRUTAS>4.1.01.01.001-INGRESOS POR VENTAS GENERALES|ANNIE SANCHEZ PULGAR Facturas Ventas Gravables-00002942|-22.49|-10857.25
Abril|resultados|INGRESOS>INGRESOS OPERACIONALES>VENTAS BRUTAS>4.1.01.01.001-INGRESOS POR VENTAS GENERALES|ANVIAGUA C.A Facturas Ventas Gravables-00002919|-1680.00|-796101.60
Abril|resultados|INGRESOS>INGRESOS OPERACIONALES>VENTAS BRUTAS>4.1.01.01.001-INGRESOS POR VENTAS GENERALES|AVILA BELT COMPANY, C.A. Facturas Ventas Gravables-00002931|-174.00|-82899.52
Abril|resultados|INGRESOS>INGRESOS OPERACIONALES>VENTAS BRUTAS>4.1.01.01.001-INGRESOS POR VENTAS GENERALES|C.A RON SANTA TERESA, S.A.C.A Facturas Ventas Gravables-00002933|-3038.40|-1457755.20
Abril|resultados|INGRESOS>INGRESOS OPERACIONALES>VENTAS BRUTAS>4.1.01.01.001-INGRESOS POR VENTAS GENERALES|CARBONERA DE NEGOCIOS VENEZOLANOS, C.A Facturas Ventas Gravables-00002921|-33.70|-16039.80
Abril|resultados|INGRESOS>INGRESOS OPERACIONALES>VENTAS BRUTAS>4.1.01.01.001-INGRESOS POR VENTAS GENERALES|CARBONERA DE NEGOCIOS VENEZOLANOS, C.A Facturas Ventas Gravables-00002971|-437.76|-212836.32
Abril|resultados|INGRESOS>INGRESOS OPERACIONALES>VENTAS BRUTAS>4.1.01.01.001-INGRESOS POR VENTAS GENERALES|CENTRO CLINICO LOS OLIVOS, C.A. Facturas Ventas Gravables-00002959|-81.00|-39263.97
Abril|resultados|INGRESOS>INGRESOS OPERACIONALES>VENTAS BRUTAS>4.1.01.01.001-INGRESOS POR VENTAS GENERALES|CESAR AUGUSTO GOYO PIÑERO Facturas Ventas Gravables-00002920|-32.40|-15374.90
Abril|resultados|INGRESOS>INGRESOS OPERACIONALES>VENTAS BRUTAS>4.1.01.01.001-INGRESOS POR VENTAS GENERALES|COMERCIALIZACIÓN Y TECNOLOGÍA "COYTECA", C.A. Facturas Ventas Gravables-00002955|-93.60|-45290.16
Abril|resultados|INGRESOS>INGRESOS OPERACIONALES>VENTAS BRUTAS>4.1.01.01.001-INGRESOS POR VENTAS GENERALES|CONVELAC, C.A. Facturas Ventas Gravables-00002932|-1680.00|-801610.00
Abril|resultados|INGRESOS>INGRESOS OPERACIONALES>VENTAS BRUTAS>4.1.01.01.001-INGRESOS POR VENTAS GENERALES|CORPORACION TOYOMAYOR, C.A Facturas Ventas Gravables-00002924|-93.60|-44661.24
Abril|resultados|INGRESOS>INGRESOS OPERACIONALES>VENTAS BRUTAS>4.1.01.01.001-INGRESOS POR VENTAS GENERALES|DISTRIMPORT VENEZUELA, C.A. Facturas Ventas Gravables-00002969|-72.80|-35395.04
Abril|resultados|INGRESOS>INGRESOS OPERACIONALES>VENTAS BRUTAS>4.1.01.01.001-INGRESOS POR VENTAS GENERALES|EMPAQUES CORRUGADOS ZULIA C.A Facturas Ventas Gravables-00002951|-875.04|-422434.08
Abril|resultados|INGRESOS>INGRESOS OPERACIONALES>VENTAS BRUTAS>4.1.01.01.001-INGRESOS POR VENTAS GENERALES|ESTELAR LATINOAMERICA, C.A Facturas Ventas Gravables-00002941|-10.00|-4827.59
Abril|resultados|INGRESOS>INGRESOS OPERACIONALES>VENTAS BRUTAS>4.1.01.01.001-INGRESOS POR VENTAS GENERALES|FLORISTERIA Y DISTRIBUCION LA CHINITA, C.A Facturas Ventas Gravables-00002936|-156.00|-75069.96
Abril|resultados|INGRESOS>INGRESOS OPERACIONALES>VENTAS BRUTAS>4.1.01.01.001-INGRESOS POR VENTAS GENERALES|GOVICA, C.A. Facturas Ventas Gravables-00002929|-113.40|-54162.78
Abril|resultados|INGRESOS>INGRESOS OPERACIONALES>VENTAS BRUTAS>4.1.01.01.001-INGRESOS POR VENTAS GENERALES|HENRIQUETA BRIGITTE ZARRAGA SILVA Facturas Ventas Gravables-00002958|-46.80|-22645.10
Abril|resultados|INGRESOS>INGRESOS OPERACIONALES>VENTAS BRUTAS>4.1.01.01.001-INGRESOS POR VENTAS GENERALES|INDUSTRIA ALIMENTICIA NACIONAL DE CEREALES Y HARINAS C.A. Facturas Ventas Gravables-00002938|-8940.00|-4315862.50
Abril|resultados|INGRESOS>INGRESOS OPERACIONALES>VENTAS BRUTAS>4.1.01.01.001-INGRESOS POR VENTAS GENERALES|INVERSIONES AVICOLAS, C.A. Facturas Ventas Gravables-00002912|-553.80|-262534.20
Abril|resultados|INGRESOS>INGRESOS OPERACIONALES>VENTAS BRUTAS>4.1.01.01.001-INGRESOS POR VENTAS GENERALES|INVERSIONES AVICOLAS, C.A. Facturas Ventas Gravables-00002914|-1136.00|-538532.00
Abril|resultados|INGRESOS>INGRESOS OPERACIONALES>VENTAS BRUTAS>4.1.01.01.001-INGRESOS POR VENTAS GENERALES|INVERSIONES AVICOLAS, C.A. Facturas Ventas Gravables-00002964|-364.00|-176622.00
Abril|resultados|INGRESOS>INGRESOS OPERACIONALES>VENTAS BRUTAS>4.1.01.01.001-INGRESOS POR VENTAS GENERALES|INVERSIONES LACTEAS SAN SIMON, C.A Facturas Ventas Gravables-00002952|-5070.00|-2453217.00
Abril|resultados|INGRESOS>INGRESOS OPERACIONALES>VENTAS BRUTAS>4.1.01.01.001-INGRESOS POR VENTAS GENERALES|INVERSIONES SELVA, C. A. Facturas Ventas Gravables-00002917|-2532.00|-1201519.50
Abril|resultados|INGRESOS>INGRESOS OPERACIONALES>VENTAS BRUTAS>4.1.01.01.001-INGRESOS POR VENTAS GENERALES|INVERSIONES SELVA, C. A. Facturas Ventas Gravables-00002967|-1359.75|-661104.00
Abril|resultados|INGRESOS>INGRESOS OPERACIONALES>VENTAS BRUTAS>4.1.01.01.001-INGRESOS POR VENTAS GENERALES|INVERSORA E & S 2018, C.A. Facturas Ventas Gravables-00002922|-4373.60|-2083732.64
Abril|resultados|INGRESOS>INGRESOS OPERACIONALES>VENTAS BRUTAS>4.1.01.01.001-INGRESOS POR VENTAS GENERALES|LA EXCELENCIA C.A. Facturas Ventas Gravables-00002918|-307.80|-144207.60
Abril|resultados|INGRESOS>INGRESOS OPERACIONALES>VENTAS BRUTAS>4.1.01.01.001-INGRESOS POR VENTAS GENERALES|LISBETH PARRA Facturas Ventas Gravables-00002926|-60.00|-28628.92
Abril|resultados|INGRESOS>INGRESOS OPERACIONALES>VENTAS BRUTAS>4.1.01.01.001-INGRESOS POR VENTAS GENERALES|MANUFACTURAS DE PAPEL, C.A. (MANPA) S.A.C.A. Facturas Ventas Gravables-00002948|-907.20|-437958.60
Abril|resultados|INGRESOS>INGRESOS OPERACIONALES>VENTAS BRUTAS>4.1.01.01.001-INGRESOS POR VENTAS GENERALES|MATERIALES DELTA, C.A Facturas Ventas Gravables-00002947|-81.40|-39210.29
Abril|resultados|INGRESOS>INGRESOS OPERACIONALES>VENTAS BRUTAS>4.1.01.01.001-INGRESOS POR VENTAS GENERALES|MAXI CUAJOS, C.A Facturas Ventas Gravables-00002915|-194.40|-92249.36
Abril|resultados|INGRESOS>INGRESOS OPERACIONALES>VENTAS BRUTAS>4.1.01.01.001-INGRESOS POR VENTAS GENERALES|PAPELES VENEZOLANOS, C.A. Facturas Ventas Gravables-00002937|-18240.00|-8777412.00
Abril|resultados|INGRESOS>INGRESOS OPERACIONALES>VENTAS BRUTAS>4.1.01.01.001-INGRESOS POR VENTAS GENERALES|PAPELES VENEZOLANOS, C.A. Facturas Ventas Gravables-00002939|-18240.00|-8805516.00
Abril|resultados|INGRESOS>INGRESOS OPERACIONALES>VENTAS BRUTAS>4.1.01.01.001-INGRESOS POR VENTAS GENERALES|PRODUCTOS ARQUITECTONICOS PROARCA C.A Facturas Ventas Gravables-00002944|-128.00|-61867.28
Abril|resultados|INGRESOS>INGRESOS OPERACIONALES>VENTAS BRUTAS>4.1.01.01.001-INGRESOS POR VENTAS GENERALES|PRODUCTOS DE VIDRIO S.A (PRODUVISA) Facturas Ventas Gravables-00002927|-8235.01|-3933255.60
Abril|resultados|INGRESOS>INGRESOS OPERACIONALES>VENTAS BRUTAS>4.1.01.01.001-INGRESOS POR VENTAS GENERALES|PRODUCTOS DE VIDRIO S.A (PRODUVISA) Facturas Ventas Gravables-00002928|-2025.60|-967478.40
Abril|resultados|INGRESOS>INGRESOS OPERACIONALES>VENTAS BRUTAS>4.1.01.01.001-INGRESOS POR VENTAS GENERALES|PRODUCTOS DE VIDRIO S.A (PRODUVISA) Facturas Ventas Gravables-00002968|-12015.00|-5841639.60
Abril|resultados|INGRESOS>INGRESOS OPERACIONALES>VENTAS BRUTAS>4.1.01.01.001-INGRESOS POR VENTAS GENERALES|PRODUCTOS LACTEOS LA ARGENTINA, C.A. Facturas Ventas Gravables-00002953|-923.00|-446611.50
Abril|resultados|INGRESOS>INGRESOS OPERACIONALES>VENTAS BRUTAS>4.1.01.01.001-INGRESOS POR VENTAS GENERALES|PRODUCTOS LACTEOS LA ARGENTINA, C.A. Facturas Ventas Gravables-00002970|-1023.50|-496131.50
Abril|resultados|INGRESOS>INGRESOS OPERACIONALES>VENTAS BRUTAS>4.1.01.01.001-INGRESOS POR VENTAS GENERALES|PRODUCTOS UTILES DE VENEZUELA, C.A Facturas Ventas Gravables-00002923|-352.80|-168084.60
Abril|resultados|INGRESOS>INGRESOS OPERACIONALES>VENTAS BRUTAS>4.1.01.01.001-INGRESOS POR VENTAS GENERALES|SECURE WRAP PROTECTION DE VENEZUELA, C.A Facturas Ventas Gravables-00002954|-75.00|-36290.21
Abril|resultados|INGRESOS>INGRESOS OPERACIONALES>VENTAS BRUTAS>4.1.01.01.001-INGRESOS POR VENTAS GENERALES|SERVICIOS Y PRODUCTOS INDUSTRIALES S&J, C.A Facturas Ventas Gravables-00002930|-1350.40|-646276.00
Abril|resultados|INGRESOS>INGRESOS OPERACIONALES>VENTAS BRUTAS>4.1.01.01.001-INGRESOS POR VENTAS GENERALES|SUINFERCA CORP, C.A Facturas Ventas Gravables-00002945|-76.68|-37062.36
Abril|resultados|INGRESOS>INGRESOS OPERACIONALES>VENTAS BRUTAS>4.1.01.01.001-INGRESOS POR VENTAS GENERALES|SUINFERCA CORP, C.A Facturas Ventas Gravables-00002946|-78.30|-37845.36
Abril|resultados|INGRESOS>INGRESOS OPERACIONALES>VENTAS BRUTAS>4.1.01.01.001-INGRESOS POR VENTAS GENERALES|TOTAL PLASTIC, C.A. Facturas Ventas Gravables-00002916|-812.00|-385321.40
Abril|resultados|INGRESOS>INGRESOS OPERACIONALES>VENTAS BRUTAS>4.1.01.01.001-INGRESOS POR VENTAS GENERALES|UNIFORMES COVERALL FIRE RESISTANT CORP, C.A. Facturas Ventas Gravables-00002911|-182.76|-86613.24
Abril|resultados|INGRESOS>INGRESOS OPERACIONALES>VENTAS BRUTAS>4.1.01.01.001-INGRESOS POR VENTAS GENERALES|VENILAC C.A Facturas Ventas Gravables-00002957|-10143.75|-4896981.25
Abril|resultados|INGRESOS>INGRESOS OPERACIONALES>VENTAS BRUTAS>4.1.01.01.001-INGRESOS POR VENTAS GENERALES|VIDRIOS DOMESTICOS MAV C.C.S Facturas Ventas Gravables-00002940|-8899.92|-4296512.52
Abril|resultados|INGRESOS>INGRESOS OPERACIONALES>VENTAS BRUTAS>4.1.01.01.001-INGRESOS POR VENTAS GENERALES|VITRINAS ESTANTES DE OCCIDENTE Y ORIENTE, C.A Facturas Ventas Gravables-00002963|-58.74|-28502.12
Abril|resultados|INGRESOS>INGRESOS OPERACIONALES>VENTAS BRUTAS>4.1.01.01.002-INGRESOS POR ORDEN DE PRODUCCION|ANIMAL FEED SOLUTIONS., C.A Facturas Ventas Gravables-00002935|-10354.50|-4972823.15
Abril|resultados|INGRESOS>INGRESOS OPERACIONALES>VENTAS BRUTAS>4.1.01.01.002-INGRESOS POR ORDEN DE PRODUCCION|ANIMAL FEED SOLUTIONS., C.A Facturas Ventas Gravables-00002962|-1235.52|-599505.31
Abril|resultados|INGRESOS>INGRESOS OPERACIONALES>VENTAS BRUTAS>4.1.01.01.002-INGRESOS POR ORDEN DE PRODUCCION|CRIADORES AVICOLAS DEL ZULIA, C.A Facturas Ventas Gravables-00002949|-800.00|-386664.00
Abril|resultados|INGRESOS>INGRESOS OPERACIONALES>VENTAS BRUTAS>4.1.01.01.002-INGRESOS POR ORDEN DE PRODUCCION|INVERSIONES AVICOLAS, C.A. Facturas Ventas Gravables-00002913|-7112.50|-3371750.50
Abril|resultados|INGRESOS>INGRESOS OPERACIONALES>VENTAS BRUTAS>4.1.01.01.002-INGRESOS POR ORDEN DE PRODUCCION|INVERSIONES AVICOLAS, C.A. Facturas Ventas Gravables-00002934|-14082.75|-6756586.65
Abril|resultados|INGRESOS>INGRESOS OPERACIONALES>VENTAS BRUTAS>4.1.01.01.002-INGRESOS POR ORDEN DE PRODUCCION|INVERSIONES AVICOLAS, C.A. Facturas Ventas Gravables-00002960|-6463.80|-3133264.80
Abril|resultados|INGRESOS>INGRESOS OPERACIONALES>VENTAS BRUTAS>4.1.01.01.002-INGRESOS POR ORDEN DE PRODUCCION|INVERSIONES AVICOLAS, C.A. Facturas Ventas Gravables-00002961|-1440.00|-698026.00
Abril|resultados|INGRESOS>INGRESOS OPERACIONALES>VENTAS BRUTAS>4.1.01.01.002-INGRESOS POR ORDEN DE PRODUCCION|INVERSIONES AVICOLAS, C.A. Facturas Ventas Gravables-00002972|-6463.80|-3148641.00
// --- Otros meses (Enero-Marzo) e información de Balance omitidos para brevedad ---
`;

// --- COMPONENTE FILA EXPANSIBLE (RECURSIVO) ---
const ExpandableRow = ({ node, level = 0, isBalance, totalVentasUSD }) => {
  const isAccountNode = /^\d\./.test(node.n);
  const isLeaf = !node.c || node.c.length === 0;
  const isStructural = !isAccountNode && !isLeaf;
  
  const [isOpen, setIsOpen] = useState(isStructural ? true : false);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('es-VE', { 
      style: 'decimal', 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    }).format(val);
  };

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
    } else if (level === 1) {
      rowClass += " bg-[#F97316] hover:bg-orange-600"; 
      textClass = "text-white font-bold text-sm uppercase";
    } else if (level === 2) {
      rowClass += " bg-gray-200 hover:bg-gray-300"; 
      textClass = "text-black font-bold text-sm uppercase";
    } else {
      rowClass += " bg-gray-50 hover:bg-gray-100"; 
      textClass = "text-gray-700 font-bold text-sm uppercase";
    }
  }

  return (
    <>
      <tr onClick={() => !isLeaf && setIsOpen(!isOpen)} className={rowClass}>
        <td className={`px-4 py-2.5 flex items-center gap-2 ${textClass} ${isAccountNode ? 'border-l-4 border-[#F97316]' : ''}`} style={{ paddingLeft: `${(level * 1.5) + (isAccountNode ? 0.5 : 1)}rem` }}>
          {!isLeaf ? (
            isOpen ? <ChevronDown size={16} className={level === 0 || level === 1 ? "text-white" : "text-[#F97316]"}/> 
                   : <ChevronRight size={16} className={level === 0 || level === 1 ? "text-white" : "text-[#F97316]"}/>
          ) : (
            <span className="w-4 inline-block"></span>
          )}
          <span className={`${isLeaf ? 'truncate max-w-[300px] md:max-w-[500px]' : ''}`} title={node.n}>
            {node.n}
          </span>
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
      {isOpen && !isLeaf && node.c.map((child, idx) => (
        <ExpandableRow key={idx} node={child} level={level + 1} isBalance={isBalance} totalVentasUSD={totalVentasUSD} />
      ))}
      {isOpen && level === 0 && (
        <tr className="bg-gray-300 border-t-2 border-b-4 border-black">
          <td className="px-4 py-4 text-black font-black text-sm uppercase tracking-widest" style={{ paddingLeft: '1.5rem' }}>
            TOTAL {node.n}
          </td>
          <td className="px-4 py-4 text-right font-sans tabular-nums font-black text-black text-base tracking-tight">
            {formatCurrency(node.u)}
          </td>
          <td className="px-4 py-4 text-right font-sans tabular-nums font-black text-black text-base tracking-tight hidden sm:table-cell">
            {formatCurrency(node.b)}
          </td>
          {showPercent && (
            <td className="px-4 py-4 text-right font-sans tabular-nums font-black text-black text-base tracking-tight">
              {percentStr}
            </td>
          )}
        </tr>
      )}
    </>
  );
};

export default function ReporteFinanciero() {
  const [selectedMonth, setSelectedMonth] = useState('Abril');
  const [activeTab, setActiveTab] = useState('resultados');

  const currentTree = useMemo(() => {
    const lines = rawDataString.trim().split('\n');
    const root = [];

    lines.forEach(line => {
      if (!line.trim() || line.startsWith('//')) return;
      const [mes, tab, pathStr, leafName, usdStr, bsStr] = line.split('|');
      if (mes !== selectedMonth || tab !== activeTab) return;

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
  }, [selectedMonth, activeTab]);

  const formatResult = (val) => new Intl.NumberFormat('es-VE', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);
  
  let baseVentasUSD = 1;
  if (activeTab === 'resultados') {
    const ingresosNode = currentTree.find(n => n.n === 'INGRESOS');
    if (ingresosNode) baseVentasUSD = Math.abs(ingresosNode.u);
  }

  const totalTreeUSD = currentTree.reduce((acc, n) => acc + n.u, 0);
  const totalTreeBs = currentTree.reduce((acc, n) => acc + n.b, 0);

  const percentResultStr = activeTab === 'resultados' 
    ? `${new Intl.NumberFormat('es-VE', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format((Math.abs(totalTreeUSD) / baseVentasUSD) * 100 * (totalTreeUSD < 0 ? 1 : -1))}%`
    : '';

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 font-sans selection:bg-orange-200 pb-12">
      <header className="bg-white border-b border-gray-300 py-3 shadow-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex gap-4">
            <button onClick={() => setActiveTab('resultados')} className={`flex items-center gap-2 px-3 py-2 text-sm font-bold uppercase rounded ${activeTab === 'resultados' ? 'bg-[#111827] text-white' : 'bg-gray-100 text-gray-600'}`}>
              <FileSpreadsheet size={18} /> Resultados
            </button>
            <button onClick={() => setActiveTab('balance')} className={`flex items-center gap-2 px-3 py-2 text-sm font-bold uppercase rounded ${activeTab === 'balance' ? 'bg-[#111827] text-white' : 'bg-gray-100 text-gray-600'}`}>
              <Wallet size={18} /> Situación Financiera
            </button>
          </div>
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg border border-gray-300">
            <Calendar size={16} className="text-[#F97316] ml-2 mr-1" />
            <span className="text-xs font-bold text-gray-500 uppercase mr-2">Corte:</span>
            {['Enero', 'Febrero', 'Marzo', 'Abril'].map(mes => (
              <button key={mes} onClick={() => setSelectedMonth(mes)} className={`px-4 py-1.5 rounded text-sm font-bold ${selectedMonth === mes ? 'bg-[#F97316] text-white shadow-sm' : 'text-gray-600'}`}>{mes}</button>
            ))}
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-white px-8 py-8 border-t-8 border-[#F97316] mb-8 shadow-sm flex flex-col items-center text-center">
          <h1 className="text-2xl sm:text-3xl font-bold font-serif text-[#111827] uppercase tracking-tight mb-2">Servicios Jiret G&B, C.A.</h1>
          <div className="w-16 h-1 bg-[#F97316] mb-4"></div>
          <p className="font-sans text-sm text-[#111827] font-bold mb-1">RIF: J412309374</p>
          <p className="font-sans text-xs text-gray-800 max-w-2xl font-semibold uppercase tracking-wider">AV CIRCUNVALACION NRO 02 C.C EL DIVIDIVI LOCAL G-9 MARACAIBO-ZULIA</p>
          <h2 className="mt-8 text-xl font-bold font-serif text-gray-500 uppercase tracking-widest border-b border-gray-300 pb-2 inline-block">
            {activeTab === 'resultados' ? 'Estado de Resultado Integral' : 'Estado de Situación Financiera'}
          </h2>
          <p className="font-sans text-sm text-gray-500 font-bold mt-2 uppercase">Periodo: {selectedMonth} 2026</p>
        </div>
        <div className="animate-in fade-in duration-500">
          <div className="bg-white rounded shadow border border-gray-300 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-100 border-b-2 border-gray-400 text-xs uppercase tracking-wider text-black font-black">
                    <th className="px-6 py-4 border-r border-gray-300 w-[60%]">Cuenta Contable</th>
                    <th className="px-4 py-4 text-right border-r border-gray-300 w-32">SALDO (USD)</th>
                    <th className="px-4 py-4 text-right border-r border-gray-300 hidden sm:table-cell w-36">SALDO (BS)</th>
                    {activeTab === 'resultados' && <th className="px-4 py-4 text-right w-24">SUMA DE %</th>}
                  </tr>
                </thead>
                <tbody>
                  {currentTree.map((node, idx) => (<ExpandableRow key={idx} node={node} isBalance={activeTab === 'balance'} totalVentasUSD={baseVentasUSD} />))}
                  {activeTab === 'resultados' && (
                    <tr className="bg-[#111827]">
                      <td className="px-6 py-6 font-black font-sans text-xl text-white border-r border-gray-700">RESULTADO DEL EJERCICIO</td>
                      <td className="px-4 py-6 text-right font-sans tabular-nums font-black text-[#F97316] text-xl tracking-tight border-r border-gray-700">{formatResult(totalTreeUSD)}</td>
                      <td className="px-4 py-6 text-right font-sans tabular-nums font-black text-[#F97316] text-xl tracking-tight border-r border-gray-700 hidden sm:table-cell">{formatResult(totalTreeBs)}</td>
                      <td className="px-4 py-6 text-right font-sans tabular-nums font-black text-[#F97316] text-xl tracking-tight">{percentResultStr}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

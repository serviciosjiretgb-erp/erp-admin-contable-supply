// ============================================================================
// REPORTES FINANCIEROS — lógica y componentes (estructura copiada de App 98)
// ============================================================================

// ── Cargador dinámico de SheetJS (sin npm install) ──────────────────────────
const loadSheetJS = () => new Promise((resolve, reject) => {
  if (window.XLSX) { resolve(window.XLSX); return; }
  const s = document.createElement('script');
  s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
  s.onload  = () => resolve(window.XLSX);
  s.onerror = () => reject(new Error('No se pudo cargar SheetJS'));
  document.head.appendChild(s);
});

// ── Procesador de archivos XLSX / TXT / CSV ──────────────────────────────────
const processFiles = async (files) => {
  let allParsedData = [];

  // Detectar mes desde nombre de archivo
  const detectMonth = (name) => {
    const m = name.match(/(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)/i);
    return m ? m[0].charAt(0).toUpperCase() + m[0].slice(1).toLowerCase() : 'Sin Mes';
  };

  // Emite una fila al array de datos usando el pathStack actual
  const emit = (pathStack, month, name, usd, bs) => {
    const cleanPath = [];
    pathStack.forEach(p => { if (cleanPath.length === 0 || cleanPath[cleanPath.length - 1] !== p) cleanPath.push(p); });
    allParsedData.push({ month, path: cleanPath.join('>'), name, usd, bs: bs || 0 });
  };

  // Filtros de líneas/filas que siempre se omiten
  const skipLine = (n) => !n || n.includes('SERVICIOS JIRET') || n.includes('RIF:') ||
    n === 'Etiquetas de fila' || n === 'SALDO NETO EN USD' ||
    n.includes('ESTADO DE RESULTADO');

  // Pop inteligente: solo quita del stack si el último elemento coincide con la sección totalizada
  const smartPop = (stack, totalName) => {
    const what = totalName.replace(/^Total\s+/i, '').trim();
    if (stack.length > 0 && stack[stack.length - 1].trim() === what) stack.pop();
  };

  for (let i = 0; i < files.length; i++) {
    const file   = files[i];
    const ext    = file.name.split('.').pop().toLowerCase();
    const month  = detectMonth(file.name);
    let pathStack = [];

    // ── XLSX / XLS ──────────────────────────────────────────────────────────
    if (ext === 'xlsx' || ext === 'xls' || ext === 'xlsm') {
      const XL     = await loadSheetJS();
      const buffer = await file.arrayBuffer();
      const wb     = XL.read(buffer, { type: 'array' });
      const ws     = wb.Sheets[wb.SheetNames[0]];
      // header:1 → arrays; defval:null → celdas vacías = null
      const rows   = XL.utils.sheet_to_json(ws, { header: 1, defval: null });

      for (const row of rows) {
        const name = row[0] != null ? String(row[0]).trim() : '';
        if (skipLine(name)) continue;

        // "Total XXX" → pop inteligente
        if (name.startsWith('Total ')) { smartPop(pathStack, name); continue; }
        // "RESULTADO DEL EJERCICIO" → ignorar, se recalcula en el componente
        if (name === 'RESULTADO DEL EJERCICIO') continue;

        const usdRaw = row[1];
        const bsRaw  = row[2];
        const hasUsd = usdRaw !== null && usdRaw !== undefined && usdRaw !== '';
        const usd    = hasUsd ? Number(usdRaw) : null;
        const bs     = (bsRaw !== null && bsRaw !== undefined && bsRaw !== '') ? Number(bsRaw) : 0;

        if (hasUsd) {
          emit(pathStack, month, name, usd, bs);
        } else {
          pathStack.push(name);
        }
      }

    // ── CSV ─────────────────────────────────────────────────────────────────
    } else if (ext === 'csv') {
      const text  = await file.text();
      const lines = text.split(/\r?\n/);
      lines.forEach(line => {
        const cleanLine = line.trim();
        if (!cleanLine) return;
        const cols      = cleanLine.split(/[,;](?=(?:(?:[^"]*"){2})*[^"]*$)/).map(c => c.replace(/^"|"$/g, '').trim());
        const name      = cols[0];
        if (skipLine(name)) return;
        if (name.startsWith('Total ')) { smartPop(pathStack, name); return; }
        if (name === 'RESULTADO DEL EJERCICIO') return;
        const usdStr    = cols[1];
        const bsStr     = cols[2];
        const cleanVal  = (v) => { if (!v || v.trim() === '-') return null; const n = parseFloat(v.replace(/\./g,'').replace(',','.')); return isNaN(n)?null:n; };
        const usd       = cleanVal(usdStr);
        const bs        = cleanVal(bsStr);
        if (usd !== null) emit(pathStack, month, name, usd, bs);
        else pathStack.push(name);
      });

    // ── TXT ─────────────────────────────────────────────────────────────────
    } else {
      const text  = await file.text();
      const lines = text.split(/\r?\n/);
      lines.forEach(line => {
        const cleanLine = line.trim();
        if (!cleanLine) return;
        if (skipLine(cleanLine)) return;
        if (cleanLine.startsWith('Total')) { smartPop(pathStack, cleanLine.split('\t')[0].trim()); return; }
        if (cleanLine === 'RESULTADO DEL EJERCICIO') return;

        const usdMatch = line.match(/USD\s*([-\d.,]+)/);
        const bsMatch  = line.match(/Bs\.\s*([-\d.,]+)/);
        if (usdMatch && bsMatch) {
          const name = line.split('USD')[0].trim();
          if (!name) return;
          const cleanVal = (v) => { const n = parseFloat(v.replace(/\./g,'').replace(',','.')); return isNaN(n)?null:n; };
          const usd = cleanVal(usdMatch[1]);
          const bs  = cleanVal(bsMatch[1]);
          if (usd !== null) emit(pathStack, month, name, usd, bs);
        } else {
          const name = line.split('\t')[0].trim();
          if (name) pathStack.push(name);
        }
      });
    }
  }
  return allParsedData;
};

// ── Fila tipo tabla dinámica: secciones fijas, cuentas con +/− ───────────────
const ExpandableRow = ({ node, level = 0, totalVentasUSD, defaultOpen = false }) => {
  const isAccountNode = /^\d\./.test(node.n);
  const isLeaf = !node.c || node.c.length === 0;
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const fmtCur = (v) =>
    new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);
  const pct =
    totalVentasUSD && node.u !== 0
      ? `${fmtCur((Math.abs(node.u) / Math.abs(totalVentasUSD)) * 100)}%`
      : '';
  const indent = { paddingLeft: `${level * 18 + 10}px` };

  // ── ENCABEZADOS DE SECCIÓN (siempre visibles, sin botón de colapso) ─────────
  if (!isLeaf && !isAccountNode) {
    const isRoot   = level === 0;   // INGRESOS / COSTOS / GASTOS
    const isOrange = level >= 3;    // VENTAS BRUTAS, COSTO DE VENTA, etc.
    return (
      <>
        {/* fila de encabezado */}
        <tr className={isRoot ? 'bg-[#111827]' : 'bg-white border-b border-gray-100'}>
          <td
            style={indent}
            className={
              isRoot
                ? 'py-2 px-3 text-white font-black text-[11px] uppercase tracking-widest'
                : isOrange
                ? 'py-1.5 px-3 font-bold text-[11px] uppercase text-[#F97316]'
                : 'py-1.5 px-3 font-black text-[11px] uppercase text-slate-800'
            }
          >
            <span className="mr-1.5 opacity-40 text-[9px]">⊟</span>
            {node.n}
          </td>
          <td colSpan={3} />
        </tr>
        {/* hijos siempre renderizados */}
        {node.c.map((child, i) => (
          <ExpandableRow key={i} node={child} level={level + 1} totalVentasUSD={totalVentasUSD} defaultOpen={defaultOpen}/>
        ))}
        {/* fila de total solo para secciones raíz */}
        {isRoot && (
          <tr className="bg-[#111827] text-white border-t-2 border-orange-500">
            <td style={{ paddingLeft: 28 }} className="py-3 px-3 font-black text-[11px] uppercase tracking-widest">
              Total {node.n}
            </td>
            <td className="py-3 px-3 text-right font-mono text-[11px] font-black text-[#F97316] whitespace-nowrap">
              <span className="text-white opacity-40 text-[9px] mr-1">USD</span>
              {fmtCur(node.u)}
            </td>
            <td className="py-3 px-3 text-right font-mono text-[11px] font-black text-[#F97316] hidden sm:table-cell whitespace-nowrap">
              <span className="text-white opacity-40 text-[9px] mr-1">Bs.</span>
              {fmtCur(node.b)}
            </td>
            <td className="py-3 px-3 text-right font-mono text-[11px] font-black text-[#F97316]">{pct}</td>
          </tr>
        )}
      </>
    );
  }

  // ── CUENTA CON HIJOS (TXT — expande a transacciones individuales) ─────────────
  if (isAccountNode && !isLeaf) {
    return (
      <>
        <tr
          onClick={() => setIsOpen(o => !o)}
          className="bg-white border-b border-gray-200 cursor-pointer hover:bg-orange-50 transition-colors"
          style={{ borderLeft: '3px solid #F97316' }}
        >
          <td style={indent} className="py-2.5 px-3 font-bold text-[11px] text-black uppercase">
            <span
              className="inline-flex items-center justify-center w-[15px] h-[15px] border border-gray-400 text-gray-600 font-black text-[11px] mr-2 select-none flex-shrink-0 bg-white hover:border-orange-500 hover:text-orange-600 transition-colors"
              style={{ lineHeight: 1, fontFamily: 'monospace' }}
            >{isOpen ? '−' : '+'}</span>
            {node.n}
          </td>
          <td className="py-2.5 px-3 text-right font-mono text-[11px] font-bold whitespace-nowrap">
            <span className="text-gray-400 text-[9px] font-normal mr-1">USD</span>{fmtCur(node.u)}
          </td>
          <td className="py-2.5 px-3 text-right font-mono text-[11px] font-bold hidden sm:table-cell whitespace-nowrap">
            <span className="text-gray-400 text-[9px] font-normal mr-1">Bs.</span>{fmtCur(node.b)}
          </td>
          <td className="py-2.5 px-3 text-right font-mono text-[11px] text-gray-600">{pct}</td>
        </tr>
        {isOpen && node.c.map((child, i) => (
          <ExpandableRow key={i} node={child} level={level + 1} totalVentasUSD={totalVentasUSD} defaultOpen={defaultOpen}/>
        ))}
      </>
    );
  }

  // ── CUENTA HOJA (XLSX — valor ya consolidado, sin detalle de transacciones) ───
  if (isAccountNode && isLeaf) {
    return (
      <tr className="bg-white border-b border-gray-200" style={{ borderLeft: '3px solid #F97316' }}>
        <td style={indent} className="py-2.5 px-3 font-bold text-[11px] text-black uppercase">
          <span
            className="inline-flex items-center justify-center w-[15px] h-[15px] border border-gray-200 text-gray-300 text-[11px] mr-2 select-none flex-shrink-0 bg-gray-50"
            style={{ lineHeight: 1, fontFamily: 'monospace' }}
            title="Cargue el TXT con detalle de transacciones para expandir"
          >+</span>
          {node.n}
        </td>
        <td className="py-2.5 px-3 text-right font-mono text-[11px] font-bold whitespace-nowrap">
          <span className="text-gray-400 text-[9px] font-normal mr-1">USD</span>{fmtCur(node.u)}
        </td>
        <td className="py-2.5 px-3 text-right font-mono text-[11px] font-bold hidden sm:table-cell whitespace-nowrap">
          <span className="text-gray-400 text-[9px] font-normal mr-1">Bs.</span>{fmtCur(node.b)}
        </td>
        <td className="py-2.5 px-3 text-right font-mono text-[11px] text-gray-600">{pct}</td>
      </tr>
    );
  }

  // ── HOJA de transacción individual (TXT) ─────────────────────────────────────
  return (
    <tr className="bg-slate-50 border-b border-gray-100 hover:bg-amber-50 transition-colors">
      <td style={indent} className="py-1.5 px-3 text-[10px] text-gray-600 max-w-xs">{node.n}</td>
      <td className="py-1.5 px-3 text-right font-mono text-[10px] text-gray-700 whitespace-nowrap">{fmtCur(node.u)}</td>
      <td className="py-1.5 px-3 text-right font-mono text-[10px] text-gray-500 hidden sm:table-cell whitespace-nowrap">{fmtCur(node.b)}</td>
      <td className="py-1.5 px-3 text-right font-mono text-[10px] text-gray-400">{pct}</td>
    </tr>
  );
};

// ── Estado de Resultado Integral ─────────────────────────────────────────────
function EstadoResultadoView({ onBack, dbData }) {
  const availableMonths = React.useMemo(() => [...new Set(dbData.map(d => d.month))], [dbData]);
  const [selectedMonth, setSelectedMonth] = useState(availableMonths[0] || '');
  // Expandir / Contraer todo: cambia key para forzar re-mount con nuevo defaultOpen
  const [expandKey,    setExpandKey]    = useState(0);
  const [defaultOpen,  setDefaultOpen]  = useState(false);

  const expandAll   = () => { setDefaultOpen(true);  setExpandKey(k => k + 1); };
  const collapseAll = () => { setDefaultOpen(false); setExpandKey(k => k + 1); };
  const tree = React.useMemo(() => {
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
      nodes.forEach(n => { if (!n.isLeaf) { const t = compute(n.c); n.u = t.u; n.b = t.b; } u += n.u; b += n.b; });
      return { u, b };
    };
    compute(root);
    return root;
  }, [dbData, selectedMonth]);

  const ingresosNode = tree.find(n => n.n === 'INGRESOS');
  const baseVentas  = ingresosNode ? Math.abs(ingresosNode.u) : 1;
  // Excluir nodos hoja sueltos (como RESULTADO DEL EJERCICIO si quedó en el árbol)
  const mainTree    = tree.filter(n => n.n !== 'RESULTADO DEL EJERCICIO');
  const totalUSD    = mainTree.reduce((acc, n) => acc + n.u, 0);
  const totalBs     = mainTree.reduce((acc, n) => acc + n.b, 0);
  const fmtR = (val) => new Intl.NumberFormat('es-VE', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <header className="bg-white border-b p-4 flex justify-between items-center sticky top-0 z-30 shadow-sm">
        <button onClick={onBack} className="flex items-center gap-2 font-black text-xs text-slate-600 hover:text-black uppercase transition-colors">
          <ArrowLeft size={16}/> Volver
        </button>
        <div className="flex items-center gap-2 flex-wrap justify-center">
          {/* Expandir / Contraer todo */}
          <button onClick={expandAll}
            className="px-3 py-1.5 bg-orange-500 text-white text-[10px] font-black uppercase rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-1">
            ⊞ Expandir todo
          </button>
          <button onClick={collapseAll}
            className="px-3 py-1.5 bg-slate-700 text-white text-[10px] font-black uppercase rounded-lg hover:bg-black transition-colors flex items-center gap-1">
            ⊟ Contraer todo
          </button>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          {availableMonths.map(m => (
            <button key={m} onClick={() => setSelectedMonth(m)}
              className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase transition-all ${selectedMonth === m ? 'bg-orange-600 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
              {m}
            </button>
          ))}
        </div>
      </header>
      <main className="p-4 md:p-8 max-w-6xl mx-auto">
        <div className="bg-white px-8 py-10 border-t-8 border-[#F97316] mb-8 shadow-md flex flex-col items-center text-center">
          <h1 className="text-2xl sm:text-3xl font-black font-serif text-[#111827] uppercase tracking-tight mb-2">Servicios Jiret G&amp;B, C.A.</h1>
          <div className="w-16 h-1.5 bg-[#F97316] mb-4 rounded-full"/>
          <p className="font-sans text-sm text-[#111827] font-bold mb-2 tracking-wide">RIF: J-412309374</p>
          <p className="font-sans text-xs text-gray-600 max-w-2xl font-semibold uppercase tracking-widest leading-relaxed mb-8">
            AV CIRCUNVALACION NRO 02 C.C EL DIVIDIVI LOCAL G-9 NIVEL PB SECTOR EL TREBOL MARACAIBO-ZULIA
          </p>
          <div className="border-b-2 border-gray-200 pb-3 w-full max-w-lg mb-4">
            <h2 className="text-xl font-black font-serif text-gray-800 uppercase tracking-widest">Estado de Resultado Integral</h2>
          </div>
          <p className="font-sans text-sm text-orange-600 font-black uppercase flex items-center gap-2 bg-orange-50 px-4 py-2 rounded-full">
            <CalendarDays size={16}/> Periodo: {selectedMonth}
          </p>
        </div>
        {dbData.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-xl shadow-sm border-t-4 border-orange-500">
            <AlertTriangle size={48} className="mx-auto text-orange-400 mb-4"/>
            <p className="text-gray-500 font-bold">No hay reportes cargados. Por favor, importa archivos <strong>.xlsx</strong>, <strong>.txt</strong> o <strong>.csv</strong> desde el dashboard de Reportes Financieros.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-slate-200">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 text-[9px] uppercase font-black text-slate-500 border-b-2 border-slate-300 sticky top-0">
                  <th className="px-3 py-3 w-[52%] text-left">Etiquetas de fila</th>
                  <th className="px-3 py-3 text-right">Saldo Neto en USD</th>
                  <th className="px-3 py-3 text-right hidden sm:table-cell">Saldo Neto en Bs.</th>
                  <th className="px-3 py-3 text-right">Suma de %</th>
                </tr>
              </thead>
              <tbody key={expandKey}>
                {mainTree.map((node, i) => <ExpandableRow key={i} node={node} totalVentasUSD={baseVentas} defaultOpen={defaultOpen}/>)}
                <tr className="bg-[#111827] text-white font-black border-t-4 border-orange-500">
                  <td className="px-4 py-5 text-sm uppercase tracking-widest" style={{paddingLeft:28}}>
                    RESULTADO DEL EJERCICIO
                  </td>
                  <td className="px-3 py-5 text-right text-base text-[#F97316] font-mono whitespace-nowrap">
                    <span className="text-white opacity-40 text-[9px] mr-1">USD</span>
                    {fmtR(totalUSD)}
                  </td>
                  <td className="px-3 py-5 text-right text-base hidden sm:table-cell text-[#F97316] font-mono whitespace-nowrap">
                    <span className="text-white opacity-40 text-[9px] mr-1">Bs.</span>
                    {fmtR(totalBs)}
                  </td>
                  <td className="px-3 py-5 text-right text-base text-[#F97316] font-mono">
                    {(Math.abs(totalUSD) / baseVentas * 100).toFixed(2)}%
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

// ── Balance General (próximamente) ───────────────────────────────────────────
function BalanceGeneralView({ onBack }) {
  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <header className="bg-white border-b p-4 flex items-center gap-3 sticky top-0 z-30 shadow-sm">
        <button onClick={onBack} className="flex items-center gap-2 font-black text-xs text-slate-600 hover:text-black uppercase transition-colors">
          <ArrowLeft size={16}/> Volver
        </button>
        <span className="font-black text-sm text-slate-800 uppercase tracking-wide">Balance General</span>
      </header>
      <main className="p-8 max-w-4xl mx-auto">
        <div className="bg-white px-8 py-10 border-t-8 border-[#3b82f6] mb-8 shadow-md flex flex-col items-center text-center">
          <h1 className="text-2xl font-black font-serif text-[#111827] uppercase tracking-tight mb-2">Servicios Jiret G&amp;B, C.A.</h1>
          <div className="w-16 h-1.5 bg-[#3b82f6] mb-4 rounded-full"/>
          <p className="font-sans text-sm text-[#111827] font-bold mb-2">RIF: J-412309374</p>
          <h2 className="text-xl font-black font-serif text-gray-800 uppercase tracking-widest mt-4">Estado de Situación Financiera</h2>
          <p className="text-xs text-gray-500 mt-2">Balance General al cierre del período</p>
        </div>
        <div className="bg-white rounded-xl shadow-md border border-slate-200 p-12 text-center">
          <Scale size={56} className="mx-auto text-blue-300 mb-5"/>
          <h3 className="font-black text-lg text-slate-700 uppercase mb-2">Módulo en desarrollo</h3>
          <p className="text-slate-400 text-sm max-w-md mx-auto">El Balance General con carga de archivos TXT/CSV estará disponible en la próxima actualización. Mientras tanto puedes usar el módulo <strong>Estados Financieros</strong> del área Contabilidad General.</p>
        </div>
      </main>
    </div>
  );
}

// ── Dashboard de Reportes Financieros ────────────────────────────────────────
function ReportesFinancierosApp({ onBack }) {
  const [subView, setSubView]   = useState('dashboard');
  const [dbData,  setDbData]    = useState([]);
  const [dataOk,  setDataOk]    = useState(false);

  const handleUpload = async (e) => {
    if (!e.target.files.length) return;
    const newData = await processFiles(e.target.files);
    setDbData(newData);
    setDataOk(true);
    alert(`✅ ${e.target.files.length} archivo(s) importado(s) correctamente.`);
  };

  if (subView === 'resultado')
    return <EstadoResultadoView onBack={() => setSubView('dashboard')} dbData={dbData}/>;
  if (subView === 'balance')
    return <BalanceGeneralView onBack={() => setSubView('dashboard')}/>;

  const modulos = [
    {
      id: 'resultado',
      name: 'Estado de Resultado',
      icon: LineChart,
      color: '#f97316',
      desc: 'Ingresos, costos y gastos · detalle por factura · filtro mensual',
      ready: true,
    },
    {
      id: 'balance',
      name: 'Balance General',
      icon: Scale,
      color: '#3b82f6',
      desc: 'Activos, Pasivos y Patrimonio · Estado de Situación Financiera',
      ready: false,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#f8fafc' }}>
      {/* Header */}
      <header className="px-6 py-3 flex items-center justify-between shadow-lg border-b-4 border-orange-500" style={{ background: '#000' }}>
        <div className="flex items-center gap-3">
          <span className="text-lg font-light tracking-widest text-gray-300">Supply</span>
          <span className="text-white font-black text-xl leading-none">G</span>
          <div className="bg-orange-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-black">&amp;</div>
          <span className="text-white font-black text-xl leading-none">B</span>
          <span className="ml-3 text-[10px] font-black uppercase tracking-[3px] text-orange-400 border border-orange-800/50 px-2 py-0.5 rounded-full">Reportes Financieros</span>
        </div>
        <button onClick={onBack} className="px-3 py-1.5 rounded-lg border border-red-800/50 text-red-400 hover:bg-red-500 hover:text-white transition-colors flex items-center gap-1.5 text-[10px] font-black uppercase">
          <ArrowLeft size={12}/> Volver
        </button>
      </header>

      <div className="flex-1 max-w-5xl mx-auto w-full px-6 py-8">
        {/* Título */}
        <div className="text-center mb-8">
          <div className="w-0.5 h-8 bg-orange-500 mx-auto mb-3"/>
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-[0.15em] mb-1.5">Reportes Financieros</h1>
          <p className="text-xs text-slate-400 font-medium">Servicios Jiret G&amp;B, C.A. · RIF J-412309374</p>
          <div className="w-12 h-0.5 bg-orange-500 mx-auto mt-3"/>
        </div>

        {/* Zona de carga */}
        <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 hover:border-orange-300 transition-colors p-8 mb-8 text-center shadow-sm">
          <Upload className="mx-auto text-orange-400 mb-3" size={36}/>
          <h2 className="font-black text-base text-slate-800 uppercase mb-1">Cargar Reportes del Sistema</h2>
          <p className="text-slate-400 text-sm mb-5 max-w-lg mx-auto">
            Selecciona archivos <strong>.xlsx</strong>, <strong>.txt</strong> o <strong>.csv</strong> exportados por tu sistema.
            Nombra cada archivo con el mes (ej: <em>abril_2026.xlsx</em>) para que se detecte automáticamente.
          </p>
          <div className="flex justify-center items-center gap-4 flex-wrap">
            <label className="bg-black text-white px-8 py-3 rounded-xl font-black uppercase text-xs cursor-pointer hover:bg-gray-900 transition-all flex items-center gap-2 shadow-lg">
              <Upload size={14}/> Buscar Archivos
              <input type="file" multiple accept=".xlsx,.xls,.xlsm,.txt,.csv" className="hidden" onChange={handleUpload}/>
            </label>
            {dataOk && (
              <span className="flex items-center gap-1.5 text-emerald-700 font-black text-xs uppercase bg-emerald-50 px-4 py-3 rounded-xl border border-emerald-200">
                <CheckCircle size={14}/> {dbData.length} registros cargados
              </span>
            )}
          </div>
        </div>

        {/* Tarjetas de módulos */}
        <div className="mb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px flex-1 bg-slate-100"/>
            <p className="text-[9px] font-black uppercase tracking-[3px] px-3 py-1 rounded-full border border-orange-200 text-orange-500 bg-orange-50">Estados Financieros</p>
            <div className="h-px flex-1 bg-slate-100"/>
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            {modulos.map(mod => (
              <button
                key={mod.id}
                onClick={() => mod.ready && setSubView(mod.id)}
                disabled={!mod.ready}
                className={`group text-left bg-white rounded-2xl p-6 transition-all duration-200 border border-slate-100 ${mod.ready ? 'hover:-translate-y-0.5 hover:shadow-xl cursor-pointer' : 'opacity-55 cursor-not-allowed grayscale'}`}
                style={{ borderBottom: `4px solid ${mod.color}`, boxShadow: '0 2px 14px rgba(0,0,0,0.06)' }}>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ background: mod.color + '15' }}>
                  <mod.icon size={22} style={{ color: mod.color }}/>
                </div>
                <h3 className="font-black text-sm uppercase tracking-wide text-slate-900 mb-1">{mod.name}</h3>
                <p className="text-[11px] text-slate-400 leading-snug">{mod.desc}</p>
                <div className="mt-4 flex items-center gap-1" style={{ color: mod.color }}>
                  {mod.ready
                    ? <><span className="text-[9px] font-black uppercase tracking-widest">Abrir Reporte</span><ChevronRight size={10}/></>
                    : <span className="text-[9px] font-black uppercase tracking-widest text-slate-300">Próximamente</span>
                  }
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

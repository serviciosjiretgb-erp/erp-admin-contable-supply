import React, { useState, useMemo, useEffect } from 'react';
import { 
  ArrowLeft, Upload, CheckCircle, Scale, 
  LineChart, CalendarDays, AlertTriangle, ChevronRight, ChevronDown, Star, PlusCircle, Trash2, ArrowUpRight, ArrowDownRight, GitCompare, Landmark, FileSpreadsheet,
  FileText, Users, Briefcase, Search, BookOpen, Database, FileOutput, CornerDownRight,
  BarChart2, TrendingUp, TrendingDown, DollarSign, Activity, PieChart as PieIcon
} from 'lucide-react';

// ============================================================================
// DATOS PREDETERMINADOS (semilla): Balance Abril, Activos Fijos Abril,
// Estado de Resultado Ene-Abr, Saldos Iniciales, Auxiliares CxC/CxP, Tasas.
// Se cargan automaticamente si el navegador no tiene datos guardados.
// ============================================================================
const JIRET_SEED_DATA = {"dbData":[],"planCuentas":{},"tasaByMonth":{},"auxByMonth":{},"afByMonth":{},"activosFijosData":{"records":[]},"auxDataConfig":{}};


// ============================================================================
// 1. LÓGICA DE PROCESAMIENTO DE ARCHIVOS
// ============================================================================
const loadSheetJS = () => new Promise((resolve, reject) => {
  if (window.XLSXStyle) { resolve(window.XLSXStyle); return; }
  if (window.XLSX && window.XLSX.utils && window.XLSX.writeFile) { resolve(window.XLSX); return; }
  const s = document.createElement('script');
  s.src = 'https://cdn.jsdelivr.net/npm/xlsx-js-style@1.2.0/dist/xlsx.bundle.js';
  s.onload  = () => resolve(window.XLSXStyle || window.XLSX);
  s.onerror = () => {
    const s2 = document.createElement('script');
    s2.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
    s2.onload = () => resolve(window.XLSX);
    s2.onerror = () => reject(new Error('No se pudo cargar SheetJS'));
    document.head.appendChild(s2);
  };
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
      while (idx >= 0) { if (stack[idx].trim().toUpperCase() === what) { stack.splice(idx); break; } idx--; }
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
      const usdStr = row[1]; const bsStr = row[2];
      if (String(usdStr).includes('SALDO NETO') || String(bsStr).includes('SALDO NETO')) { pathStack.push(name.trim().toUpperCase()); continue; }
      const usd = parseVal(usdStr); const bs = parseVal(bsStr);
      if (usd !== null) { allParsedData.push({ month, path: pathStack.map(p => p.trim().toUpperCase()).join('>'), name: name.trim().toUpperCase(), usd, bs: bs || 0 }); }
      else { pathStack.push(name.trim().toUpperCase()); }
    }
  }
  return allParsedData;
};

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

const processSaldosBalance = async (file, planCuentas) => {
  const ext = file.name.split('.').pop().toLowerCase();
  const detectMonth = (name) => {
    const m = name.match(/(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)/i);
    return m ? m[0].charAt(0).toUpperCase() + m[0].slice(1).toLowerCase() : 'Saldos Iniciales';
  };
  const fileMonth = detectMonth(file.name);

  const parseVal = (v) => {
    if (v === null || v === undefined) return null;
    const s0 = String(v).trim();
    if (!s0 || s0 === '-' || s0 === 'USD -' || s0 === 'Bs. -' || s0 === 'USD-' || s0 === '0,00') {
      if (s0 === '0,00' || s0 === '0.00') return 0;
      if (s0 === '-') return null;
    }
    let s = s0.replace(/USD|Bs\.|Bs|BsF|\$/ig, '').trim();
    if (!s || s === '-') return null;
    if (s.includes(',') && s.includes('.')) s = s.replace(/\./g, '').replace(/,/g, '.');
    else if (s.includes(',') && !s.includes('.')) s = s.replace(/,/g, '.');
    const n = parseFloat(s);
    return isNaN(n) ? null : n;
  };

  const smartPop = (stack, totalName) => {
    const what = totalName.replace(/^Total\s+/i, '').trim().toUpperCase();
    let idx = stack.length - 1;
    while (idx >= 0) {
      if (stack[idx].trim().toUpperCase() === what) { stack.splice(idx); break; }
      idx--;
    }
  };

  if (ext === 'txt' || ext === 'csv') {
    const text = await file.text();
    const lines = text.split(/\r?\n/);
    let pathStack = [];
    let balanceData = [];

    for (const rawLine of lines) {
      if (!rawLine.trim()) continue;
      const cols = rawLine.split('\t');
      const name = (cols[0] || '').trim();
      if (!name) continue;

      if (/ACTIVO.*PASIVO.*PATRIMONIO|ACTIVO-\(PASIVO/i.test(name)) continue;

      if (/^Total\s+/i.test(name)) { smartPop(pathStack, name); continue; }

      let usdVal = null, bsVal = null;
      for (let ci = 1; ci < cols.length; ci++) {
        const c = (cols[ci] || '').trim();
        if (!c) continue;
        const cUp = c.toUpperCase();
        if (cUp.includes('USD') || (!cUp.includes('BS') && ci === 1)) {
          const v = parseVal(c); if (v !== null) usdVal = v;
        } else if (cUp.includes('BS') || ci >= 2) {
          const v = parseVal(c); if (v !== null) bsVal = v;
        }
      }

      const isAccount = /^\d[\d\.]{4,}/.test(name);

      if (isAccount && (usdVal !== null || bsVal !== null)) {
        const path = pathStack.map(p => p.trim()).filter(Boolean).join('>');
        if (!path) continue;
        balanceData.push({
          month: fileMonth,
          path,
          name: name.trim(),
          usd: usdVal ?? 0,
          bs:  bsVal  ?? 0,
        });
      } else if (!isAccount) {
        const topName = pathStack.length ? pathStack[pathStack.length-1].toUpperCase() : '';
        if (name.toUpperCase() !== topName) {
          pathStack.push(name.trim().toUpperCase());
        }
      }
    }
    return balanceData;
  }

  const XL = await loadSheetJS();
  const buffer = await file.arrayBuffer();
  const wb = XL.read(buffer, { type: 'array' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rawData = XL.utils.sheet_to_json(ws, { header: 1, defval: null });
  if (!rawData.length) return [];

  let headerRowIdx = 0;
  let idxCuenta = -1, idxUSD = -1, idxBs = -1;

  for (let ri = 0; ri < Math.min(5, rawData.length); ri++) {
    const hr = rawData[ri].map(h => String(h||'').toUpperCase().trim());
    const cIdx = hr.findIndex(h => h.includes('CUENTA') || h.includes('NOMBRE') || h.includes('DESCRIPCION'));
    const uIdx = hr.findIndex(h => h.includes('USD') || h.includes('DOLAR'));
    const bIdx = hr.findIndex(h => h.includes('BS') || h.includes('BOLIVAR'));
    if (cIdx !== -1 || uIdx !== -1) { headerRowIdx = ri; idxCuenta = cIdx; idxUSD = uIdx; idxBs = bIdx; break; }
  }

  if (idxCuenta === -1) { idxCuenta = 0; idxUSD = 1; idxBs = 2; headerRowIdx = -1; }

  const balanceData = [];
  let pathStack = [];
  for (let ri = headerRowIdx + 1; ri < rawData.length; ri++) {
    const row = rawData[ri];
    if (!row || row.every(c => c === null || c === '')) continue;
    const name = String(row[idxCuenta] || '').trim();
    if (!name) continue;
    if (/ACTIVO.*PASIVO|ACTIVO-\(/i.test(name)) continue;

    if (/^Total\s+/i.test(name)) { smartPop(pathStack, name); continue; }

    const usdV = idxUSD >= 0 ? parseVal(row[idxUSD]) : null;
    const bsV  = idxBs  >= 0 ? parseVal(row[idxBs])  : null;
    const isAccount = /^\d[\d\.]{4,}/.test(name);

    if (isAccount && (usdV !== null || bsV !== null)) {
      balanceData.push({
        month: fileMonth,
        path: pathStack.map(p => p.trim().toUpperCase()).join('>') || 'ACTIVOS>OTROS',
        name, usd: usdV ?? 0, bs: bsV ?? 0,
      });
    } else if (!isAccount) {
      pathStack.push(name.trim().toUpperCase());
    }
  }
  return balanceData;
};

// ============================================================================
// 1d. EXPORTACIÓN EXCEL — utilidades compartidas
// ============================================================================
const XS = {
  BLACK:    '111111', ORANGE:  'E05A00', WHITE:  'FFFFFF',
  HDR_BG:   '111827', SECT1:   '1F2937', GREY:   '6B7280',
  SECT2:    'E5E7EB', SECT3:   'F3F4F6', SECT4:  'FAFAFA',
  TOT1:     'D1D5DB', TOT2:    'E5E7EB', TOT3:   'F3F4F6',
  RED:      'DC2626', AMBER:   'F59E0B', GREEN:  '15803D',
  TEAL:     '0D9488', BLUE:    '1D4ED8', PURPLE: '7C3AED',
  NUM:      '#,##0.00',  PCT: '0.00',

  fill: (rgb) => ({ fgColor: { rgb } }),
  font: (bold=false, rgb='111111', sz=9, italic=false) =>
    ({ name:'Arial', bold, color:{ rgb }, sz, italic }),
  al: (h='left', v='center', ind=0, wrap=false) =>
    ({ horizontal:h, vertical:v, indent:ind, wrapText:wrap }),
  side: (style, rgb) => ({ style, color:{ rgb } }),

  cell: (fillRgb, fontRgb, bold=false, h='left', sz=9, numFmt=null,
         topStyle=null, topColor=null, botStyle=null, botColor=null, italic=false) => ({
    fill:{ patternType:'solid', fgColor:{ rgb: fillRgb || 'FFFFFF' } },
    font:{ name:'Arial', bold, color:{ rgb: fontRgb||'111111' }, sz, italic },
    alignment:{ horizontal:h, vertical:'center' },
    border:{
      top:    topStyle ? { style:topStyle, color:{ rgb:topColor||'D1D5DB' } } : {},
      bottom: botStyle ? { style:botStyle, color:{ rgb:botColor||'D1D5DB' } } : {},
    },
    ...(numFmt ? { numFmt } : {}),
  }),
};

const mkCell = (v, s) => {
  const t = typeof v === 'number' ? 'n' : (v == null || v === '' ? 'z' : 's');
  return { v: v ?? '', t, s };
};

const writeRow = (ws, rowIdx, cols, cells, defaultH=14) => {
  cols.forEach((col, ci) => {
    const addr = String.fromCharCode(65+ci)+(rowIdx);
    ws[addr] = cells[ci] || mkCell('', {});
  });
};

const applyLetterhead = (ws, title, subtitle, nCols) => {
  const colRange = Array.from({length:nCols},(_,i)=>i);
  colRange.forEach(ci => {
    const addr = String.fromCharCode(65+ci)+'1';
    if (!ws[addr]) ws[addr] = mkCell('', {});
    ws[addr].s = { ...ws[addr].s,
      border:{ top:{ style:'thick', color:{ rgb:XS.ORANGE } } } };
  });
  const logoCell = ws['A1'] || mkCell('Supply G&B',{});
  ws['A1'] = { v:'Supply G&B', t:'s', s: XS.cell(XS.WHITE,XS.ORANGE,true,'left',16,null,'thick',XS.ORANGE) };
  const lastCol = String.fromCharCode(65+nCols-1);
  [
    ['SERVICIOS JIRET G&B, C.A.',       XS.cell(XS.WHITE,XS.BLACK,true,'right',10,null,'thick',XS.ORANGE)],
    ['RIF: J-412309374',                 XS.cell(XS.WHITE,XS.GREY,false,'right',8)],
    ['AV CIRCUNVALACION NRO 02 C.C EL DIVIDIVI LOCAL G-9 NIVEL PB', XS.cell(XS.WHITE,XS.GREY,false,'right',7)],
    ['SECTOR EL TREBOL MARACAIBO-ZULIA', XS.cell(XS.WHITE,XS.GREY,false,'right',7)],
  ].forEach(([txt, st], i) => {
    const addr = lastCol+(1+i);
    ws[addr] = { v:txt, t:'s', s:st };
  });
  ws['A6'] = { v:title, t:'s', s: XS.cell(XS.WHITE,XS.BLACK,true,'center',13) };
  if (subtitle) ws['A7'] = { v:subtitle, t:'s', s: XS.cell(XS.WHITE,XS.GREY,false,'center',9,null,null,null,null,null,true) };
};

const applyHeaderRow = (ws, rowIdx, labels, borderColor=XS.ORANGE) => {
  labels.forEach((lbl, ci) => {
    const addr = String.fromCharCode(65+ci)+rowIdx;
    ws[addr] = { v:lbl, t:'s', s:{
      fill:{ patternType:'solid', fgColor:{ rgb:XS.HDR_BG } },
      font:{ name:'Arial', bold:true, color:{ rgb:XS.WHITE }, sz:9 },
      alignment:{ horizontal: ci===0?'left':'right', vertical:'center' },
      border:{ bottom:{ style:'medium', color:{ rgb:borderColor } } },
    }};
  });
};

const rowStyle = (row, colIdx, isLabelCol) => {
  const lvl = row.level || 0;
  const isRoot = lvl === 0 && row.isSection;
  const isTotalRoot = lvl === 0 && row.isTotal;
  const isSubtotal = row.isTotal && lvl > 0;
  const isLeaf = row.isLeaf;

  if (isRoot) {
    const bg = XS.SECT1;
    return XS.cell(bg, XS.ORANGE, true, isLabelCol?'left':'right', 10, colIdx>0?XS.NUM:null, 'medium', XS.ORANGE, 'thin', '374151');
  }
  if (isTotalRoot) {
    return XS.cell(XS.BLACK, XS.AMBER, true, isLabelCol?'left':'right', 10, colIdx>0?XS.NUM:null, 'medium', XS.ORANGE, 'thin', '374151');
  }
  if (isSubtotal) {
    const bgs = [XS.TOT1, XS.TOT2, XS.TOT3, 'F9FAFB'];
    const bg = bgs[Math.min(lvl-1, 3)];
    return XS.cell(bg, XS.BLACK, true, isLabelCol?'left':'right', 9, colIdx>0?XS.NUM:null, 'thin', '9CA3AF', 'thin', '9CA3AF');
  }
  if (row.isSection) {
    const bgs = [XS.SECT1, XS.SECT2, XS.SECT3, 'F9FAFB', 'FFFFFF'];
    const fgs = [XS.ORANGE, XS.BLACK, XS.BLACK, XS.BLACK, XS.BLACK];
    const idx = Math.min(lvl, 4);
    return XS.cell(bgs[idx], fgs[idx], true, isLabelCol?'left':'right', 9, colIdx>0?XS.NUM:null);
  }
  return XS.cell('FFFFFF', (row.u < 0 && !isLabelCol) ? XS.RED : XS.BLACK, false, isLabelCol?'left':'right', 9, colIdx>0?XS.NUM:null, null,null,'hair','E5E7EB');
};

const buildStyledSheet = (XL, flatRows, colHeaders, nCols, extraFooterRows=[]) => {
  const ws = {};
  const HEADER_ROW = 9;
  const DATA_START  = 10;

  let maxRow = DATA_START;

  for (let r=1; r<=8; r++) {
    for (let c=0; c<nCols; c++) {
      const addr = String.fromCharCode(65+c)+r;
      ws[addr] = mkCell('', {});
    }
  }

  applyHeaderRow(ws, HEADER_ROW, colHeaders);

  flatRows.forEach((row, i) => {
    const rowIdx = DATA_START + i;
    const vals = row._vals;
    vals.forEach((v, ci) => {
      const addr = String.fromCharCode(65+ci)+rowIdx;
      ws[addr] = { v: v??'', t: typeof v==='number'?'n':'s',
                   s: rowStyle(row, ci, ci===0) };
    });
    maxRow = rowIdx;
  });

  extraFooterRows.forEach((frow, i) => {
    const rowIdx = maxRow + 2 + i;
    frow.forEach((cell, ci) => {
      const addr = String.fromCharCode(65+ci)+rowIdx;
      ws[addr] = cell;
    });
    maxRow = rowIdx;
  });

  ws['!ref'] = `A1:${String.fromCharCode(65+nCols-1)}${maxRow}`;
  ws['!rows'] = [];
  for (let r=1; r<=8; r++) ws['!rows'][r-1] = { hpx: r===1?28:14 };
  ws['!rows'][HEADER_ROW-1] = { hpx: 18 };
  flatRows.forEach((row, i) => {
    const isRoot = row.level===0;
    const isTot0 = row.isTotal && row.level===0;
    ws['!rows'][DATA_START+i-1] = { hpx: isRoot||isTot0 ? 20 : (row.isTotal?16:14) };
  });

  return ws;
};

const buildLetterheadRows = (title, subtitle) => [
  ['Supply G&B', '', '', '', 'SERVICIOS JIRET G&B, C.A.'],
  ['',           '', '', '', 'RIF: J-412309374'          ],
  ['',           '', '', '', 'AV CIRCUNVALACION NRO 02 C.C EL DIVIDIVI LOCAL G-9 NIVEL PB'],
  ['',           '', '', '', 'SECTOR EL TREBOL MARACAIBO-ZULIA'],
  [],
  [title],
  ...(subtitle ? [[subtitle]] : []),
  [],
];

// ============================================================================
// sortTreeNodes: ordena los HIJOS de cada nodo del árbol de menor a mayor
// según su código contable, de forma NUMÉRICA (no alfabética) y RECURSIVA.
// Las carpetas SIN código propio (ej. "DISPONIBLE", "PREPAGADOS") toman como
// código efectivo el MENOR código entre las cuentas que contienen, para que
// el grupo de "Caja" (001) quede antes que "Prepagados" (005) aunque sus
// nombres, alfabéticamente, digan lo contrario.
// ============================================================================
const compareCodeArrays = (pa, pb) => {
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i]||0) - (pb[i]||0);
    if (d !== 0) return d;
  }
  return 0;
};
const getEffectiveCode = (node) => {
  const own = node.n.match(/^(\d[\d.]*)/)?.[1];
  if (own) return own.split('.').map(Number);
  if (node.c && node.c.length) {
    let best = null;
    node.c.forEach(child => {
      const code = getEffectiveCode(child);
      if (code && (!best || compareCodeArrays(code, best) < 0)) best = code;
    });
    return best;
  }
  return null;
};
const sortTreeNodes = (nodes) => {
  nodes.forEach(n => { if (n.c && n.c.length) sortTreeNodes(n.c); });
  nodes.sort((a, b) => {
    const codeA = getEffectiveCode(a);
    const codeB = getEffectiveCode(b);
    if (codeA && codeB) return compareCodeArrays(codeA, codeB);
    if (codeA && !codeB) return -1;
    if (!codeA && codeB) return 1;
    return a.n.localeCompare(b.n);
  });
  return nodes;
};

// ============================================================================
// correctTopLevelPath: fuerza que cada línea quede bajo INGRESOS/COSTOS/GASTOS
// según el PRIMER DÍGITO de su código de cuenta (4=Ingresos, 5=Costos,
// 6=Gastos), sin importar cómo el archivo origen la haya agrupado. Esto
// corrige archivos donde, por ejemplo, una cuenta 5.2.xx (costo) aparece
// anidada bajo la sección "GASTOS" del pivote exportado.
// ============================================================================
const CODE_TOP_LEVEL = { '4': 'INGRESOS', '5': 'COSTOS', '6': 'GASTOS' };
const correctTopLevelPath = (pathArray, itemName) => {
  const codeDigit = itemName.match(/^(\d)/)?.[1];
  const correctTop = codeDigit && CODE_TOP_LEVEL[codeDigit];
  if (correctTop && pathArray.length > 0 && pathArray[0].trim().toUpperCase() !== correctTop) {
    return [correctTop, ...pathArray.slice(1)];
  }
  return pathArray;
};

const flattenTreeForExcel = (nodes, openStates, level = 0, rows = []) => {
  nodes.forEach(n => {
    const isAccountNode = /^\d\./.test(n.n) || (!n.c || n.c.length === 0);
    if (!n.isLeaf && n.c?.length) {
      if (!isAccountNode) {
        rows.push({ label: n.n, level, isSection: true, u: null, b: null });
        flattenTreeForExcel(n.c, openStates, level + 1, rows);
        rows.push({ label: 'TOTAL ' + n.n, level, isTotal: true, u: n.u, b: n.b });
      } else {
        rows.push({ label: n.n, level, isLeaf: true, u: n.u, b: n.b });
        const isOpen = !openStates || openStates.has(n.n.trim().toUpperCase());
        if (isOpen) {
          flattenTreeForExcel(n.c, openStates, level + 1, rows);
          rows.push({ label: 'TOTAL ' + n.n, level, isTotal: true, u: n.u, b: n.b });
        }
      }
    } else {
      rows.push({ label: n.n, level, isLeaf: true, u: n.u, b: n.b });
    }
  });
  return rows;
};

const footerCell = (v, colorRgb, isNum=false, h='left') => ({
  v: v??'', t: typeof v==='number'?'n':'s',
  s: {
    fill:{ patternType:'solid', fgColor:{ rgb:XS.BLACK } },
    font:{ name:'Arial', bold:true, color:{ rgb:colorRgb }, sz:10 },
    alignment:{ horizontal:h, vertical:'center' },
    border:{ top:{ style:'medium', color:{ rgb:XS.ORANGE } },
             bottom:{ style:'thin', color:{ rgb:'374151' } } },
    ...(isNum ? { numFmt:XS.NUM } : {}),
  }
});

const exportBalanceExcel = async (tree, selectedMonth, tasa, totalActivos, totalPasPat, balanceDiff, openNodes, currency='both') => {
  try {
    const XL = await loadSheetJS();
    const n = v => v != null && !isNaN(v) ? parseFloat(Math.abs(v).toFixed(2)) : null;
    const showUSD = currency !== 'bs'; const showBS = currency !== 'usd';
    const colHeaders = ['CUENTA / DESCRIPCIÓN', ...(showUSD?['USD']:[]), ...(showBS?['Bs.']:[])];
    const nCols = colHeaders.length;

    const flatRows = flattenTreeForExcel(tree, openNodes);
    flatRows.forEach(r => {
      r._vals = [r.label, ...(showUSD?[r.u!=null?n(r.u):null]:[]), ...(showBS?[r.b!=null?n(r.b):null]:[])];
    });

    const ab = n(Math.abs(totalPasPat));
    const tb = n(totalActivos);
    const diff = parseFloat((totalActivos - Math.abs(totalPasPat)).toFixed(2));
    const footerRows = [
      [footerCell('TOTAL PASIVO Y PATRIMONIO',XS.AMBER,false,'left'),
       ...(showUSD?[footerCell(ab,'F59E0B',true,'right')]:[] ),
       ...(showBS?[footerCell('','F59E0B',false,'right')]:[] )],
      [footerCell('TOTAL ACTIVOS','F97316',false,'left'),
       ...(showUSD?[footerCell(tb,'F97316',true,'right')]:[] ),
       ...(showBS?[footerCell('','F97316',false,'right')]:[] )],
      [footerCell('ACTIVO − (PASIVO+PATRIMONIO)', Math.abs(diff)<0.01?'10B981':XS.RED,false,'left'),
       ...(showUSD?[footerCell(Math.abs(diff), Math.abs(diff)<0.01?'10B981':XS.RED, true,'right')]:[] ),
       ...(showBS?[footerCell(Math.abs(diff)<0.01?'✓ CUADRADO':'','10B981',false,'right')]:[] )],
    ];

    const ws = buildStyledSheet(XL, flatRows, colHeaders, nCols, footerRows);
    applyLetterhead(ws, 'BALANCE DE SITUACIÓN FINANCIERA', `Corte: ${selectedMonth}  |  Tasa: ${tasa} Bs/USD`, nCols);
    ws['!cols'] = [{ wch:60 }, ...(showUSD?[{wch:20}]:[]), ...(showBS?[{wch:22}]:[])];
    const wb = XL.utils.book_new();
    XL.utils.book_append_sheet(wb, ws, 'Balance General');
    XL.writeFile(wb, `Balance_${selectedMonth}_${new Date().toLocaleDateString('es-VE').replace(/\//g,'-')}.xlsx`);
  } catch(e) { console.error(e); alert('Error exportar Balance: '+e.message); }
};

const exportResultadoExcel = async (tree, selectedMonth, totalUSD, openNodes, currency='both') => {
  try {
    const XL = await loadSheetJS();
    const showUSD = currency !== 'bs'; const showBS = currency !== 'usd';
    const n = v => v != null && !isNaN(v) ? parseFloat(Math.abs(v).toFixed(2)) : null;
    const baseVentas = tree.reduce((s,nd)=>nd.n.toUpperCase().includes('INGRESO')||nd.n.toUpperCase().includes('VENTA')||nd.n.startsWith('4')?s+Math.abs(nd.u):s,0)||1;
    const fmtPct = u => u!=null ? parseFloat((Math.abs(u)/Math.abs(baseVentas)*100).toFixed(2)) : null;
    const colHeaders = ['CUENTA / DESCRIPCIÓN', ...(showUSD?['USD']:[]), ...(showBS?['Bs.']:[]), '%'];
    const nCols = colHeaders.length;

    const flatRows = flattenTreeForExcel(tree, openNodes);
    flatRows.forEach(r => {
      r._vals = [r.label, ...(showUSD?[r.u!=null?n(r.u):null]:[]), ...(showBS?[r.b!=null?n(r.b):null]:[]), r.u!=null?fmtPct(r.u):null];
    });

    const pct = fmtPct(totalUSD);
    const isLoss = totalUSD < 0;
    const resultColor = isLoss ? XS.RED : '10B981';
    const footerRows = [[
      footerCell('RESULTADO DEL EJERCICIO', resultColor, false, 'left'),
      ...(showUSD?[footerCell(n(totalUSD), resultColor, true, 'right')]:[]),
      ...(showBS?[footerCell('', resultColor, false, 'right')]:[]),
      footerCell(pct!=null?`${pct}%`:'', resultColor, false, 'right'),
    ]];

    const ws = buildStyledSheet(XL, flatRows, colHeaders, nCols, footerRows);
    applyLetterhead(ws, 'ESTADO DE RESULTADO', `Período: ${selectedMonth==='General'?'Acumulado':selectedMonth}`, nCols);
    ws['!cols'] = [{wch:60},...(showUSD?[{wch:18}]:[]),...(showBS?[{wch:22}]:[]),{wch:10}];
    const wb = XL.utils.book_new();
    XL.utils.book_append_sheet(wb, ws, 'Estado de Resultado');
    XL.writeFile(wb, `EstadoResultado_${selectedMonth}_${new Date().toLocaleDateString('es-VE').replace(/\//g,'-')}.xlsx`);
  } catch(e) { console.error(e); alert('Error exportar Estado: '+e.message); }
};

const exportComparativoExcel = async (tree, month1, month2, total_m1, total_m2) => {
  try {
    const XL = await loadSheetJS();
    const n = v => parseFloat((v||0).toFixed(2));
    const pct = (v, base) => base ? `${Math.abs(v/Math.abs(base)*100).toFixed(2)}%` : '—';
    const nCols = 5;
    const colHeaders = ['ESTRUCTURA', month1, month2, 'VAR. ABSOLUTA', 'VAR. %'];

    const letterhead = buildLetterheadRows('ANÁLISIS COMPARATIVO DE VARIACIONES', `${month1} vs ${month2}`);
    const SECT_COLORS = ['1F2937','374151','4B5563'];
    let sectIdx = 0;

    const sheetRows = [];
    tree.forEach((cat, ci) => {
      const bg = SECT_COLORS[ci % 3];
      const catStyle = (h='left') => ({
        fill:{patternType:'solid',fgColor:{rgb:bg}},
        font:{name:'Arial',bold:true,color:{rgb:XS.ORANGE},sz:10},
        alignment:{horizontal:h,vertical:'center'},
        border:{top:{style:'medium',color:{rgb:XS.ORANGE}},bottom:{style:'thin',color:{rgb:'374151'}}},
        numFmt:h!=='left'?XS.NUM:undefined,
      });
      sheetRows.push({ _vals:[cat.n,n(cat.m1_u),n(cat.m2_u),n(cat.m2_u-cat.m1_u),pct(cat.m2_u-cat.m1_u,cat.m1_u)], level:0, isSection:true, _forceSt: catStyle });

      [...cat.c].sort((a,b)=>a.n.localeCompare(b.n)).forEach(acc => {
        const varAbs = acc.m2_u - acc.m1_u;
        const color = varAbs > 0 ? XS.GREEN : varAbs < 0 ? XS.RED : XS.GREY;
        sheetRows.push({ _vals:['  '+acc.n,n(acc.m1_u),n(acc.m2_u),n(varAbs),pct(varAbs,acc.m1_u)], level:1, isLeaf:true, _varColor:color });
      });
      sheetRows.push({ _vals:['TOTAL '+cat.n,n(cat.m1_u),n(cat.m2_u),n(cat.m2_u-cat.m1_u),pct(cat.m2_u-cat.m1_u,cat.m1_u)], level:1, isTotal:true });
      sheetRows.push({ _vals:['','','','',''], level:0, isSection:false, _empty:true });
    });

    const varTotal = total_m2 - total_m1;
    const isLoss = total_m2 < total_m1;
    const footerRows = [[
      footerCell('RESULTADO DEL EJERCICIO',XS.AMBER,false,'left'),
      footerCell(n(total_m1),XS.AMBER,true,'right'),
      footerCell(n(total_m2),XS.AMBER,true,'right'),
      footerCell(n(varTotal),isLoss?XS.RED:'10B981',true,'right'),
      footerCell(pct(varTotal,total_m1),isLoss?XS.RED:'10B981',false,'right'),
    ]];

    const ws = {};
    let r = 1;
    for (let i=0;i<8;i++) {
      for (let c=0;c<nCols;c++) ws[String.fromCharCode(65+c)+(r)]=mkCell('',{});
      r++;
    }
    applyHeaderRow(ws, r, colHeaders, XS.ORANGE);
    r++;
    const dataStart = r;

    sheetRows.forEach(row => {
      if (row._empty) { for(let c=0;c<nCols;c++) ws[String.fromCharCode(65+c)+r]=mkCell('',{}); r++; return; }
      row._vals.forEach((v, ci) => {
        const addr = String.fromCharCode(65+ci)+r;
        let st;
        if (row._forceSt) { st = row._forceSt(ci===0?'left':'right'); }
        else if (row.isTotal) { st = XS.cell(XS.TOT2,ci>0&&ci<4?(v<0?XS.RED:XS.BLACK):XS.GREY,true,ci===0?'left':'right',9,ci>0&&ci<4?XS.NUM:null,'thin','9CA3AF','thin','9CA3AF'); }
        else { st = XS.cell(ci%2===0?'FFFFFF':'FAFAFA', ci>0?(v<0?XS.RED:XS.BLACK):XS.BLACK, false, ci===0?'left':'right', 9, (ci>0&&ci<4)?XS.NUM:null, null,null,'hair','E5E7EB'); }
        ws[addr] = { v:v??'', t:typeof v==='number'?'n':'s', s:st };
      });
      r++;
    });
    footerRows.forEach(frow => {
      frow.forEach((cell,ci) => { ws[String.fromCharCode(65+ci)+r]=cell; }); r++;
    });
    ws['!ref'] = `A1:${String.fromCharCode(65+nCols-1)}${r}`;
    ws['!cols'] = [{wch:50},{wch:18},{wch:18},{wch:18},{wch:12}];
    applyLetterhead(ws, 'ANÁLISIS COMPARATIVO DE VARIACIONES', `${month1} vs ${month2}`, nCols);
    const wb = XL.utils.book_new();
    XL.utils.book_append_sheet(wb, ws, 'Comparativo');
    XL.writeFile(wb, `Comparativo_${month1}_vs_${month2}.xlsx`);
  } catch(e) { console.error(e); alert('Error exportar Comparativo: '+e.message); }
};

const exportAuxiliarExcel = async (byClient, total, mapInfo, accountCode, isCxC) => {
  try {
    const XL = await loadSheetJS();
    const nCols = 10;
    const colHeaders = ['Cód.','Nombre','Operación','Emisión','Vencimiento','Días','No. Documento','Descripción','Monto USD','Cuenta Contable'];
    const accentColor = isCxC ? '1D4ED8' : 'B91C1C';
    const ws = {};
    let r = 1;
    for(let i=0;i<8;i++){ for(let c=0;c<nCols;c++) ws[String.fromCharCode(65+c)+r]=mkCell('',{}); r++; }
    applyHeaderRow(ws, r, colHeaders, accentColor); r++;

    const nameStyle = (bg='FFFFFF') => XS.cell(bg,XS.BLACK,false,'left',9,null,null,null,'hair','E5E7EB');
    const numStyle  = (bg='FFFFFF') => ({...XS.cell(bg,isCxC?'1D4ED8':'B91C1C',false,'right',9,XS.NUM,null,null,'hair','E5E7EB')});
    const clientHdr = () => ({
      fill:{patternType:'solid',fgColor:{rgb:isCxC?'1E3A5F':'3B1219'}},
      font:{name:'Arial',bold:true,color:{rgb:isCxC?'93C5FD':'FCA5A5'},sz:10},
      alignment:{horizontal:'left',vertical:'center'},
      border:{top:{style:'medium',color:{rgb:accentColor}},bottom:{style:'thin',color:{rgb:'374151'}}},
    });

    let odd = true;
    byClient.forEach(([nombre, group]) => {
      ws['A'+r] = {v:nombre,t:'s',s:clientHdr()};
      for(let c=1;c<nCols;c++) ws[String.fromCharCode(65+c)+r]={v:'',t:'s',s:clientHdr()};
      r++;
      group.records.forEach(item => {
        const bg = odd?'FFFFFF':'F9FAFB'; odd=!odd;
        const rowVals = [group.cod,nombre,item.operacion||'-',item.emision,item.vence,item.dias,item.doc,item.descripcion||'-',parseFloat((item.monto||0).toFixed(2)),item.cuentaContable||'-'];
        rowVals.forEach((v,ci) => {
          ws[String.fromCharCode(65+ci)+r] = {v:v??'',t:typeof v==='number'?'n':'s',
            s:ci===8?numStyle(bg):nameStyle(bg)};
        });
        r++;
      });
      const stSt = XS.cell(isCxC?'EFF6FF':'FFF1F2',accentColor,true,'left',9);
      for(let c=0;c<nCols;c++) ws[String.fromCharCode(65+c)+r]={v:'',t:'s',s:stSt};
      ws['B'+r]={v:'SUBTOTAL '+nombre,t:'s',s:stSt};
      ws['I'+r]={v:parseFloat(group.subtotal.toFixed(2)),t:'n',s:{...stSt,alignment:{horizontal:'right'},numFmt:XS.NUM}};
      r++;
    });
    r++;
    for(let c=0;c<nCols;c++) ws[String.fromCharCode(65+c)+r]=footerCell('',XS.AMBER);
    ws['B'+r]=footerCell('TOTAL GENERAL',XS.AMBER,false,'left');
    ws['I'+r]=footerCell(parseFloat(total.toFixed(2)),XS.AMBER,true,'right');
    r++;
    ws['!ref']=`A1:J${r}`;
    ws['!cols']=[{wch:8},{wch:32},{wch:12},{wch:12},{wch:12},{wch:7},{wch:15},{wch:28},{wch:16},{wch:32}];
    applyLetterhead(ws, isCxC?'AUXILIAR DE CUENTAS POR COBRAR':'AUXILIAR DE CUENTAS POR PAGAR', `Cuenta: ${accountCode} — ${mapInfo.label}`, nCols);
    const wb=XL.utils.book_new();
    XL.utils.book_append_sheet(wb,ws,isCxC?'CxC':'CxP');
    XL.writeFile(wb,`Auxiliar_${accountCode}_${new Date().toLocaleDateString('es-VE').replace(/\//g,'-')}.xlsx`);
  } catch(e){console.error(e);alert('Error exportar Auxiliar: '+e.message);}
};

const exportActivosFijosExcelGrouped = async (records, getRubo, fileName, mesCorte, getDepAcumFn, getNetoFn, fmt) => {
  try {
    const XL = await loadSheetJS();
    const n = v => parseFloat((v||0).toFixed(2));
    const nCols = 12;
    const ws = {};
    let r = 1;
    for(let i=0;i<8;i++){for(let c=0;c<nCols;c++) ws[String.fromCharCode(65+c)+r]=mkCell('',{}); r++;}
    const hdrs=['Cant','Descripción','Sede','Fecha Adq.','V.U. Asig.','V.U. Trans.','Costo USD','Costo Bs.','Dep.Acum USD','Val.Neto USD','Dep.Mensual USD','Tasa'];
    const grupos={};
    records.forEach(rec=>{const g=getRubo(rec);if(!grupos[g])grupos[g]=[];grupos[g].push(rec);});
    const RUBRO_ORDER=['MOBILIARIO Y EQUIPO DE OFICINA','EQUIPOS DE COMPUTACIÓN Y TELECOMUNICACIONES','HERRAMIENTAS MENORES','MAQUINARIA Y EQUIPOS','PLANTA ELÉCTRICA','GALPÓN E INMUEBLES','VEHÍCULOS'];
    const RUBRO_COLORS={
      'MOBILIARIO Y EQUIPO DE OFICINA':               ['B45309','FEF3C7'],
      'EQUIPOS DE COMPUTACIÓN Y TELECOMUNICACIONES':  ['1D4ED8','EFF6FF'],
      'HERRAMIENTAS MENORES':                         ['92400E','FFFBEB'],
      'MAQUINARIA Y EQUIPOS':                         ['6D28D9','F5F3FF'],
      'PLANTA ELÉCTRICA':                             ['BE123C','FFF1F2'],
      'GALPÓN E INMUEBLES':                           ['065F46','ECFDF5'],
      'VEHÍCULOS':                                    ['1E40AF','EFF6FF'],
    };
    const orderedRubros=RUBRO_ORDER.filter(r=>grupos[r]).concat(Object.keys(grupos).filter(r2=>!RUBRO_ORDER.includes(r2)));

    orderedRubros.forEach(rubro=>{
      const [fgRgb, bgRgb] = RUBRO_COLORS[rubro]||['374151','F9FAFB'];
      const items=grupos[rubro];
      const rubSt={fill:{patternType:'solid',fgColor:{rgb:'111827'}},
        font:{name:'Arial',bold:true,color:{rgb:fgRgb},sz:11},
        alignment:{horizontal:'left',vertical:'center'},
        border:{top:{style:'medium',color:{rgb:XS.ORANGE}},bottom:{style:'thin',color:{rgb:'374151'}}}};
      for(let c=0;c<nCols;c++) ws[String.fromCharCode(65+c)+r]={v:c===0?rubro:'',t:'s',s:rubSt};
      r++;
      hdrs.forEach((h,ci)=>{
        const addr=String.fromCharCode(65+ci)+r;
        const hSt={fill:{patternType:'solid',fgColor:{rgb:'1F2937'}},
          font:{name:'Arial',bold:true,color:{rgb:'D1FAE5'},sz:8},
          alignment:{horizontal:ci<2||ci===3?'left':'right',vertical:'center'},
          border:{bottom:{style:'thin',color:{rgb:fgRgb}}}};
        ws[addr]={v:h,t:'s',s:hSt};
      });
      r++;
      let odd=true;
      items.forEach(rec=>{
        const bg=odd?'FFFFFF':bgRgb; odd=!odd;
        const vals=[rec.cant,rec.descripcion,rec.sede,rec.fechaAdq,rec.vidaUtilAsig,rec.vidaUtilTrans,n(rec.costoUSD),n(rec.costoBS),n(getDepAcumFn(rec)),n(getNetoFn(rec)),n(rec.depreMensual),n(rec.tasa)];
        const isNumCol=[false,false,false,false,false,false,true,true,true,true,true,true];
        vals.forEach((v,ci)=>{
          const addr=String.fromCharCode(65+ci)+r;
          const st={fill:{patternType:'solid',fgColor:{rgb:bg}},
            font:{name:'Arial',bold:ci===9,color:{rgb:ci===9?fgRgb:XS.BLACK},sz:9},
            alignment:{horizontal:isNumCol[ci]?'right':ci===1?'left':'center',vertical:'center'},
            border:{bottom:{style:'hair',color:{rgb:'E5E7EB'}}},
            ...(isNumCol[ci]?{numFmt:XS.NUM}:{})};
          ws[addr]={v:v??'',t:typeof v==='number'?'n':'s',s:st};
        });
        r++;
      });
      const sUSD=items.reduce((s,rec)=>s+rec.costoUSD,0);
      const sBS=items.reduce((s,rec)=>s+rec.costoBS,0);
      const sDA=items.reduce((s,rec)=>s+getDepAcumFn(rec),0);
      const sN=items.reduce((s,rec)=>s+getNetoFn(rec),0);
      const sM=items.reduce((s,rec)=>s+rec.depreMensual,0);
      const stotSt={fill:{patternType:'solid',fgColor:{rgb:bgRgb}},
        font:{name:'Arial',bold:true,color:{rgb:fgRgb},sz:9},
        alignment:{horizontal:'right',vertical:'center'},
        border:{top:{style:'thin',color:{rgb:'9CA3AF'}},bottom:{style:'medium',color:{rgb:fgRgb}}},
        numFmt:XS.NUM};
      const stotVals=['','','','','','',n(sUSD),n(sBS),n(sDA),n(sN),n(sM),''];
      stotVals.forEach((v,ci)=>{
        const addr=String.fromCharCode(65+ci)+r;
        const ist={...stotSt,alignment:{horizontal:ci<6?'left':'right'}};
        if(ci===0){ws[addr]={v:'SUBTOTAL '+rubro,t:'s',s:{...ist,alignment:{horizontal:'left'}}};}
        else ws[addr]={v:v??'',t:typeof v==='number'?'n':'s',s:ist};
      });
      r++;
      r++;
    });

    const totUSD=records.reduce((s,rec)=>s+rec.costoUSD,0);
    const totBS=records.reduce((s,rec)=>s+rec.costoBS,0);
    const totDA=records.reduce((s,rec)=>s+getDepAcumFn(rec),0);
    const totN=records.reduce((s,rec)=>s+getNetoFn(rec),0);
    const totM=records.reduce((s,rec)=>s+rec.depreMensual,0);
    const totVals=['','','','','','',n(totUSD),n(totBS),n(totDA),n(totN),n(totM),''];
    totVals.forEach((v,ci)=>{
      const addr=String.fromCharCode(65+ci)+r;
      const ft=footerCell(v, ci===6?'60A5FA':ci===7?'D1FAE5':ci===8?'FCA5A5':ci===9?XS.AMBER:ci===10?'86EFAC':XS.WHITE, ci>=6&&ci<=10);
      if(ci===0) ws[addr]=footerCell('TOTAL GENERAL',XS.WHITE,false,'left');
      else ws[addr]=ft;
    });

    ws['!ref']=`A1:L${r}`;
    ws['!cols']=[5,38,12,14,10,10,16,16,16,16,16,8].map(w=>({wch:w}));
    applyLetterhead(ws,'REGISTRO DE ACTIVOS FIJOS',`Corte: ${mesCorte}  —  ${new Date().toLocaleDateString('es-VE')}`,nCols);
    const wb=XL.utils.book_new();
    XL.utils.book_append_sheet(wb,ws,'Activos Fijos');
    XL.writeFile(wb,`${fileName}.xlsx`);
  } catch(e){console.error(e);alert('Error: '+e.message);}
};

const printReport = (titleHtml, contentHtml) => {
  const win = window.open('', '_blank', 'width=1000,height=700');
  if (!win) { alert('Permite las ventanas emergentes para imprimir/PDF.'); return; }
  win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8">
<title>Reporte</title>
<style>
  @page { size: A4; margin: 18mm 14mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; font-size: 9pt; color: #111; background: #fff; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 3px solid #E05A00; }
  .logo { font-size: 18pt; font-weight: 900; color: #E05A00; line-height: 1; }
  .logo span { color: #111; }
  .company { text-align: right; }
  .company .name { font-weight: 900; font-size: 11pt; }
  .company .sub { font-size: 7.5pt; color: #555; line-height: 1.4; }
  .title-block { text-align: center; margin-bottom: 10px; }
  .title-block h1 { font-size: 13pt; font-weight: 900; text-transform: uppercase; }
  .title-block h2 { font-size: 9pt; color: #666; margin-top: 3px; }
  table { width: 100%; border-collapse: collapse; font-size: 8.5pt; }
  th { background: #111; color: #fff; padding: 5px 6px; text-align: right; font-size: 7.5pt; text-transform: uppercase; }
  th:first-child { text-align: left; }
  td { padding: 3.5px 6px; border-bottom: 1px solid #eee; }
  td:first-child { text-align: left; }
  td:not(:first-child) { text-align: right; font-family: 'Courier New', monospace; }
  tr.section td { font-weight: 900; text-transform: uppercase; background: #F3F3F3; color: #E05A00; }
  tr.total td { font-weight: 900; background: #f7f7f7; border-top: 1.5px solid #ccc; }
  tr.grand-total td { font-weight: 900; background: #111; color: #fff; font-size: 9pt; }
  .footer-eq { margin-top: 12px; padding: 8px; background: #111; color: #fff; display: flex; justify-content: space-between; border-radius: 4px; font-size: 8pt; }
  @media print { button { display: none; } }
</style>
</head><body>
<div class="header">
  <div><div class="logo">Supply<br><span>G</span>&amp;<span>B</span></div></div>
  <div class="company">
    <div class="name">SERVICIOS JIRET G&amp;B, C.A.</div>
    <div class="sub">RIF: J-412309374<br>AV CIRCUNVALACION NRO 02 C.C EL DIVIDIVI LOCAL G-9 NIVEL PB<br>SECTOR EL TREBOL MARACAIBO-ZULIA</div>
  </div>
</div>
<div class="title-block">${titleHtml}</div>
${contentHtml}
<br><button onclick="window.print()" style="padding:8px 20px;background:#E05A00;color:#fff;border:none;border-radius:4px;font-weight:900;cursor:pointer;font-size:10pt;">🖨 IMPRIMIR / GUARDAR PDF</button>
</body></html>`);
  win.document.close();
};
const isNewAuxFormat = (row) => {
  if (!row || row.length < 8) return false;
  const cells = row.map(c => c ? String(c).toLowerCase().trim() : '');
  return cells.some(c => c.includes('operaci') || c.includes('descripci') || c.includes('cuenta contable'));
};

// ============================================================================
// FIX APLICADO: processAuxFile ahora recibe expectedType ('cxc' | 'cxp') y lo
// usa como bucket por defecto en vez de forzar siempre "cxp_general".
// ============================================================================
const processAuxFile = async (files, expectedType = 'cxc') => {
  const result = { cxc_general: [], cxc_zuliana: [], cxp_autototal: [], cxp_surepack: [], cxp_pacomela: [], cxp_yancarlos: [], cxp_general: [] };
  const defaultBucket = expectedType === 'cxp' ? 'cxp_general' : 'cxc_general';
  const parseVal = (v) => {
    if (v === null || v === undefined || v === '') return null;
    if (typeof v === 'number') return v;
    let s = String(v).replace(/\$|Bs\.|USD/ig, '').trim();
    if (s.includes(',') && s.includes('.')) s = s.replace(/\./g, '').replace(/,/g, '.');
    else if (s.includes(',') && !s.includes('.')) s = s.replace(/,/g, '.');
    const n = parseFloat(s); return isNaN(n) ? null : n;
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
    let sheetsData = [];
    if (ext === 'xlsx' || ext === 'xls' || ext === 'xlsm') {
      const XL = await loadSheetJS();
      const buffer = await file.arrayBuffer();
      const wb = XL.read(buffer, { type: 'array', cellDates: false });
      for (const sheetName of wb.SheetNames) {
        const rows = XL.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1, defval: null, raw: true });
        if (rows.length > 1) sheetsData.push(rows);
      }
    } else if (ext === 'csv' || ext === 'txt') {
      const text = await file.text();
      const rows = text.split(/\r?\n/).map(line => {
        if (!line.trim()) return null;
        return line.split(/[,;](?=(?:(?:[^"]*"){2})*[^"]*$)/).map(c => c.replace(/^"|"$/g, '').trim());
      }).filter(Boolean);
      if (rows.length > 1) sheetsData.push(rows);
    }
    for (const dataRows of sheetsData) {
      if (!dataRows.length) continue;
      let headerIdx = -1;
      for (let i = 0; i < Math.min(10, dataRows.length); i++) {
        if (dataRows[i] && isNewAuxFormat(dataRows[i])) { headerIdx = i; break; }
      }
      if (headerIdx >= 0) {
        const headerRow = dataRows[headerIdx];
        const hr = headerRow.map(h => h ? String(h).toLowerCase().trim() : '');
        const findCol = (...keys) => { for (const k of keys) { const idx = hr.findIndex(h => h.includes(k)); if (idx !== -1) return idx; } return -1; };
        const iCod = findCol('código','codigo',' cod','cod.');
        const iDescOperacion = hr.findIndex(h => h.includes('descripci') && h.includes('operaci'));
        const iDescripcion = iDescOperacion !== -1 ? iDescOperacion : findCol('descripci');
        const iNombrePlanoDesc = hr.findIndex(h => h.includes('descripci') && !h.includes('operaci'));
        const iNombreCol = findCol('nombre','cliente','proveedor','razón social','razon social') !== -1
          ? findCol('nombre','cliente','proveedor','razón social','razon social')
          : iNombrePlanoDesc;
        const iOperacion = findCol('operaci');
        const iEmision = findCol('emisi','fecha');
        const iVence = findCol('venc');
        const iDias = findCol('día','dia');
        const iDoc = findCol('documento','doc.');
        const iMonto = findCol('monto','saldo');
        const iCuenta = findCol('cuenta contable','cuenta');
        for (let i = headerIdx + 1; i < dataRows.length; i++) {
          const row = dataRows[i];
          if (!row || row.every(c => !c)) continue;
          const monto = iMonto >= 0 ? parseVal(row[iMonto]) : null;
          if (monto === null) continue;
          const descRaw = iDescripcion >= 0 && row[iDescripcion] ? String(row[iDescripcion]).trim() : '';
          // Si no hay columna de nombre propia (como en el export de "Descripción de
          // Operación"), el cliente/proveedor viene como el primer segmento del texto,
          // ej. "ALIMENTOS DOÑA EMILIA S.A - N.E. NE-00170 - ..."
          let nombre = iNombreCol >= 0 && row[iNombreCol] ? String(row[iNombreCol]).trim().toUpperCase() : '';
          if (!nombre && descRaw) nombre = descRaw.split(' - ')[0].trim().toUpperCase();
          if (!nombre) continue;
          const cuentaContable = iCuenta >= 0 && row[iCuenta] ? String(row[iCuenta]).trim() : '';
          const codeMatch = cuentaContable.match(/^(\d[\d\.]+)/);
          const accountCode = codeMatch ? codeMatch[1] : null;
          const mapInfo = accountCode ? ACCOUNT_MAPS[accountCode] : null;
          const bucket = (mapInfo && result[mapInfo.type] !== undefined) ? mapInfo.type : defaultBucket;
          result[bucket].push({
            cod: iCod >= 0 && row[iCod] ? String(row[iCod]).trim() : '-', nombre,
            operacion: iOperacion >= 0 && row[iOperacion] ? String(row[iOperacion]).trim() : '-',
            emision: iEmision >= 0 ? parseDate(row[iEmision]) : '-',
            vence: iVence >= 0 ? parseDate(row[iVence]) : '-',
            dias: iDias >= 0 && row[iDias] !== null && row[iDias] !== undefined ? String(row[iDias]).trim() : '-',
            doc: iDoc >= 0 && row[iDoc] ? String(row[iDoc]).trim() : '-',
            descripcion: descRaw || '-',
            monto, cuentaContable,
          });
        }
        continue;
      }
      let colMap = { cod: -1, nombre: -1, doc: -1, emision: -1, vence: -1, monto: -1 };
      for (let i = 0; i < Math.min(15, dataRows.length); i++) {
        const row = dataRows[i]; if (!row) continue;
        const cells = row.map(c => c ? String(c).toLowerCase().trim() : '');
        if (cells.some(c => c.includes('nombre') || c.includes('descripci'))) {
          headerIdx = i;
          cells.forEach((c, idx) => {
            if ((c.includes('cód') || c.includes('cod') || c === 'id') && colMap.cod === -1) colMap.cod = idx;
            else if ((c.includes('nombre') || c.includes('descripci')) && colMap.nombre === -1) colMap.nombre = idx;
            else if ((c.includes('doc') || c.includes('nro')) && colMap.doc === -1) colMap.doc = idx;
            else if ((c.includes('emi') || c.includes('fecha')) && colMap.emision === -1) colMap.emision = idx;
            else if (c.includes('venc') && colMap.vence === -1) colMap.vence = idx;
            else if ((c.includes('monto') || c.includes('saldo') || c === 'usd') && colMap.monto === -1) colMap.monto = idx;
          });
          break;
        }
      }
      let colCuenta = -1;
      if (headerIdx >= 0 && headerIdx < dataRows.length) {
        const hRow = dataRows[headerIdx] || [];
        hRow.forEach((c, idx) => {
          const s = c ? String(c).toLowerCase().trim() : '';
          if ((s.includes('cuenta') || s.includes('cta') || s.includes('ctble')) && colCuenta === -1) colCuenta = idx;
        });
      }
      for (let i = headerIdx + 1; i < dataRows.length; i++) {
        const row = dataRows[i];
        if (!row || row.every(c => !c)) continue;
        const nombre = colMap.nombre >= 0 && row[colMap.nombre] ? String(row[colMap.nombre]).trim().toUpperCase() : '';
        const monto = colMap.monto >= 0 ? parseVal(row[colMap.monto]) : null;
        if (!nombre || monto === null || monto === 0) continue;
        let cuentaContable = colCuenta >= 0 && row[colCuenta] ? String(row[colCuenta]).trim() : '';
        if (!cuentaContable) {
          for (const cell of row) {
            if (cell && /^\d\.\d\.\d{2}\.\d{2}/.test(String(cell).trim())) {
              cuentaContable = String(cell).trim(); break;
            }
          }
        }
        const codeMatch = cuentaContable.match(/^(\d[\d.]+)/);
        const accountCode = codeMatch ? codeMatch[1] : null;
        const mapInfoFromCuenta = accountCode ? ACCOUNT_MAPS[accountCode] : null;

        const record = {
          cod: colMap.cod >= 0 && row[colMap.cod] ? String(row[colMap.cod]).trim() : '-',
          nombre, operacion: '-', dias: '-', descripcion: '-', cuentaContable,
          doc: colMap.doc >= 0 && row[colMap.doc] ? String(row[colMap.doc]).trim() : '-',
          emision: colMap.emision >= 0 ? parseDate(row[colMap.emision]) : '-',
          vence: colMap.vence >= 0 ? parseDate(row[colMap.vence]) : '-', monto,
        };

        if (mapInfoFromCuenta && result[mapInfoFromCuenta.type] !== undefined) {
          result[mapInfoFromCuenta.type].push(record);
        }
        else if (nombre.includes('ZULIANA DE EMPAQUE')) result.cxc_zuliana.push({...record, monto: Math.abs(monto)});
        else if (nombre.includes('AUTO TOTAL') || nombre.includes('AUTOTOTAL') || nombre.includes('VEHICULO') || nombre.includes('VEHÍCULO')) result.cxp_autototal.push(record);
        else if (nombre.includes('SURE PACK') || nombre.includes('SUREPACK')) result.cxp_surepack.push(record);
        else if (nombre.includes('PACOMELA') || nombre.includes('AGRO INDUSTRIAS LACTEAS')) result.cxp_pacomela.push(record);
        else if (nombre.includes('YANCARLOS') || nombre.includes('PEREZ CASANOVA')) result.cxp_yancarlos.push(record);
        else result[defaultBucket].push(record);
      }
    }
  }
  return result;
};

const processActivosFijosExcel = async (files) => {
  const XL = await loadSheetJS();
  const nk = (k) => String(k||'').trim().toLowerCase().replace(/[áà]/g,'a').replace(/[éè]/g,'e').replace(/[íì]/g,'i').replace(/[óò]/g,'o').replace(/[úù]/g,'u').replace(/ñ/g,'n').replace(/\./g,'').replace(/\s+/g,' ').trim();
  const parseVal = (v) => {
    if (v===null||v===undefined||v==='') return 0;
    if (typeof v==='number') return v;
    let s=String(v).replace(/\$|Bs\.|USD/ig,'').replace(/\s/g,'').trim();
    if (s.startsWith('(')&&s.endsWith(')')) s='-'+s.slice(1,-1);
    if (s.includes(',')&&s.includes('.')) s=s.replace(/\./g,'').replace(/,/g,'.');
    else if (s.includes(',')&&!s.includes('.')) s=s.replace(/,/g,'.');
    return isNaN(parseFloat(s))?0:parseFloat(s);
  };
  const fmtXLDate = (v) => {
    if (!v) return '';
    if (typeof v==='number'&&v>40000&&v<80000) {
      const d=new Date(Math.round((v-25569)*86400*1000));
      return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
    }
    return String(v);
  };
  const SKIP=['cant','mobiliario','sede','cuenta','costo','valor','tasa','vida','depreciacion'];
  const records=[];
  for (const file of Array.from(files)) {
    const buffer=await file.arrayBuffer();
    const wb=XL.read(buffer,{type:'array',cellDates:false});
    for (const sheetName of wb.SheetNames) {
      const raw=XL.utils.sheet_to_json(wb.Sheets[sheetName],{header:1,defval:null});
      if (!raw.length) continue;
      let hIdx=0;
      for (let ri=0;ri<Math.min(10,raw.length);ri++){
        const j=raw[ri].map(c=>nk(String(c||''))).join(' ');
        if (j.includes('mobiliario')||(j.includes('cant')&&j.includes('costo'))){hIdx=ri;break;}
      }
      const hRow=raw[hIdx].map(c=>nk(String(c||'')));
      const ci=(...ns)=>{for(const n of ns){const i=hRow.findIndex(h=>h===n||h.includes(n));if(i!==-1)return i;}return -1;};
      const iCant=ci('cant','cantidad'); 
      const iDesc=ci('mobiliario y equipo','mobiliario','descripcion','activo','bien');
      const iSede=ci('sede'); 
      const iCuenta=ci('cuenta contable del activo','cuenta del activo','cuenta activo','cuenta del bien','cuentaactivo');
      const iCuentaGasto   = ci(
        'cuenta gasto depreciacion','cuenta gasto dep','gasto depreciacion',
        'cuenta debito','ctadebito','cta gasto','cta debito',
        'cuenta gasto','cta. gasto','n cuenta gasto','cuenta de gasto',
        'cuenta dep gasto','cuenta gasto dep','cuentagasto','c/gasto',
        'cuenta debe','ctadebe','debito'
      );
      const iCuentaDepAcum = ci(
        'cuenta depreciacion acumulada','cuenta dep acum','cuenta acumulada',
        'cuenta credito','ctacredito','cta haber','cta acum',
        'cuenta haber','ctahaber','cuenta dep acumulada','c/dep acum'
      );
      const iDeprMet=hRow.findIndex(h=>h.includes('depreciacion')&&!h.includes('acum'));
      const iDepAcum1=hRow.findIndex(h=>h.includes('depreciacion')&&h.includes('acum'));
      const iFecha=ci('fecha de adquisicion','fecha adquisicion','fecha');
      const iVUA=ci('vida util asignada','vida util asig','vida util');
      const iVUT=ci('vida util transcurrida','vida util trans','vida transcurrida');
      const iCUSD=ci('costo adquisicion usd','costo usd','costo adquisicion');
      const iCBS=ci('costo adquisicion bs','costo bs');
      const allDep=hRow.reduce((a,h,i)=>{if((h==='depacum'||(h.includes('dep')&&h.includes('acum')))&&i!==iDepAcum1)a.push(i);return a;},[]);
      const iDA2=allDep.length?allDep[allDep.length-1]:iDepAcum1;
      const iNeto=ci('valor neto libros','valor neto');
      const iMes=ci('depre mensual','dep mensual','depreciacion mensual','depre  mensual');
      const iTasa=ci('tasa');

      const allCuentaCols = hRow.reduce((a,h,i)=>{ if(h.includes('cuenta')) a.push(i); return a; }, []);
      const resolvedCuenta     = iCuenta     >= 0 ? iCuenta     : (allCuentaCols[0] ?? -1);
      // FIX: en archivos donde las columnas se llaman literalmente "DEPRECIACION"
      // y "DEPRECIACION ACUM" (sin la palabra "cuenta"), iDeprMet/iDepAcum1 ya las
      // ubican correctamente — se priorizan sobre la búsqueda por posición, que
      // fallaba y dejaba cuentaGasto/cuentaDepAcum vacíos.
      const resolvedCtaGasto   = iCuentaGasto   >= 0 ? iCuentaGasto   : (iDeprMet  >= 0 ? iDeprMet  : (allCuentaCols.find(i=>i>resolvedCuenta) ?? -1));
      const resolvedCtaDepAcum = iCuentaDepAcum >= 0 ? iCuentaDepAcum : (iDepAcum1 >= 0 ? iDepAcum1 : (allCuentaCols.find(i=>i>resolvedCtaGasto&&i!==resolvedCtaGasto) ?? -1));
      const g=(row,i)=>i>=0&&i<row.length?row[i]:null;
      for (let ri=hIdx+1;ri<raw.length;ri++){
        const row=raw[ri];
        if (!row||row.every(c=>c===null||c==='')) continue;
        const descRaw=String(g(row,iDesc)||'').trim();
        if (!descRaw) continue;
        const dn=nk(descRaw);
        if (SKIP.filter(w=>dn.includes(w)).length>=3) continue;
        if (/^(total|subtotal|gran total)/i.test(descRaw)) continue;
        records.push({
          cant:parseVal(g(row,iCant))||1, descripcion:descRaw, sede:String(g(row,iSede)||'-').trim(),
          cuenta:String(g(row,resolvedCuenta)||'-').trim(),
          cuentaGasto:   resolvedCtaGasto   >= 0 ? String(g(row,resolvedCtaGasto)||'').trim()   : '',
          cuentaDepAcum: resolvedCtaDepAcum >= 0 ? String(g(row,resolvedCtaDepAcum)||'').trim() : '',
          depreciacion:String(g(row,iDeprMet)||'-').trim(),
          depreciacionAcum:String(g(row,iDepAcum1)||"-").trim(),
          fechaAdq:fmtXLDate(g(row,iFecha)),
          vidaUtilAsig:parseVal(g(row,iVUA)), vidaUtilTrans:parseVal(g(row,iVUT)),
          costoUSD:parseVal(g(row,iCUSD)), costoBS:parseVal(g(row,iCBS)), depAcum:parseVal(g(row,iDA2)),
          valorNeto:parseVal(g(row,iNeto)), depreMensual:parseVal(g(row,iMes)), tasa:parseVal(g(row,iTasa)),
        });
      }
    }
  }
  return {records};
};

const handleExportActivosFijosExcel = async (records, fileName) => {
  try {
    const XL = await loadSheetJS();
    const headers = ['Cant','MOBILIARIO Y EQUIPO','SEDE','FECHA DE ADQUISICION',
      'VIDA UTIL ASIGNADA','VIDA UTIL TRANSCURRIDA','COSTO ADQUISICION USD',
      'COSTO ADQUISICION BS','DEP.ACUM','VALOR NETO LIBROS','DEPRE. MENSUAL','Tasa'];
    const rows = records.map(r => [
      r.cant, r.descripcion, r.sede, r.fechaAdq,
      r.vidaUtilAsig, r.vidaUtilTrans, r.costoUSD,
      r.costoBS, r.depAcum, r.valorNeto, r.depreMensual, r.tasa
    ]);
    const letterhead = [
      ['Supply G&B', '', '', '', '', '', '', '', '', '', '', 'SERVICIOS JIRET G&B, C.A.'],
      ['', '', '', '', '', '', '', '', '', '', '', 'RIF: J-412309374'],
      ['', '', '', '', '', '', '', '', '', '', '', 'AV CIRCUNVALACION NRO 02 C.C EL DIVIDIVI LOCAL G-9 NIVEL PB'],
      ['', '', '', '', '', '', '', '', '', '', '', 'SECTOR EL TREBOL MARACAIBO-ZULIA'],
      [],
      ['REGISTRO DE ACTIVOS FIJOS'],
      [`Fecha de corte: ${new Date().toLocaleDateString('es-VE')}`],
      [],
    ];
    const ws = XL.utils.aoa_to_sheet([...letterhead, headers, ...rows]);
    ws['!cols'] = [5,36,14,16,12,12,16,16,14,14,13,8].map(w=>({wch:w}));
    const wb = XL.utils.book_new();
    XL.utils.book_append_sheet(wb, ws, "Activos Fijos");
    XL.writeFile(wb, `${fileName}.xlsx`);
  } catch(e) { console.error('Export error:', e); }
};

// ============================================================================
// 2. CONFIGURACIÓN DE MAPEO
// ============================================================================
const ACCOUNT_MAPS = {
  '1.1.02.01.001': { type: 'cxc_general',  label: 'Cuentas por Cobrar Clientes' },
  '1.1.02.05.002': { type: 'cxc_general',  label: 'Otras Cuentas por Cobrar' },
  '1.1.05.01.008': { type: 'cxc_zuliana',  label: 'Anticipos a Proveedores Zuliana' },
  '2.1.01.01.003': { type: 'cxp_yancarlos', label: 'Otras CxP Proveedores' },
  '2.1.01.01.004': { type: 'cxp_surepack',  label: 'CxP Sure Pack' },
  '2.1.01.02.001': { type: 'cxp_general',  label: 'CxP Zuliana de Empaque Préstamos' },
  '2.1.01.02.007': { type: 'cxp_pacomela',  label: 'Inmueble por Pagar' },
  '2.1.01.02.008': { type: 'cxp_autototal', label: 'Vehículos por Pagar' },
  '2.1.01.01.001': { type: 'cxp_general',   label: 'Cuentas por Pagar Proveedores' },
};

const VER_REPORTE_ACCOUNTS = new Set([
  '1.1.02.01.001', '1.1.02.05.002', '1.1.05.01.008', '2.1.01.01.001',
  '2.1.01.01.003', '2.1.01.01.004', '2.1.01.02.007', '2.1.01.02.008',
]);

const mkR = (cod,nombre,operacion,emision,vence,dias,doc,descripcion,monto,cc) =>
  ({ cod, nombre, operacion, emision, vence, dias: String(dias), doc, descripcion, monto, cuentaContable: cc });

const DEFAULT_AUX_DATA = {
  cxc_general: [
    mkR('C0047','ALIMENTOS BOTALON C.A','Factura','30/04/2026','07/05/2026',-7,'00002973','Doc : 00002973',519.51,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0084','ANIMAL FEED SOLUTIONS., C.A','Factura','17/04/2026','24/04/2026',6,'00002935','Doc : 00002935',12011.22,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0013','PAPELES VENEZOLANOS, C.A.','Factura','20/04/2026','23/04/2026',7,'00002937','Doc : 00002937',21158.40,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
  ],
  cxc_zuliana: [], cxp_autototal: [], cxp_surepack: [], cxp_pacomela: [], cxp_yancarlos: [],
  cxp_general: [
    mkR('P0040','PAPELERIA ESTEVA EL TRANSITO,C.A.','Factura','15/04/2026','22/04/2026',8,'0000033995','Doc',202.43,'2.1.01.01.001-CUENTAS POR PAGAR PROVEEDORES'),
    mkR('P0492','EMPAQUES PLASTICOS CABIMAS C.A','Factura','30/01/2026','20/02/2026',69,'ODC 0040','ODC 0040',29444.20,'2.1.01.01.001-CUENTAS POR PAGAR PROVEEDORES'),
  ]
};

// ============================================================================
// 3. COMPONENTE: ÁRBOL EXPANDIBLE
// ============================================================================

const ExpandableRow = ({ node, level = 0, totalBaseUSD, defaultOpen = false, highlightedAccounts, toggleHighlight, onShowReport, isBalance = false, currency = 'both', onToggle }) => {
  const isAccountNode = /^\d\./.test(node.n) || (!node.c || node.c.length === 0);
  const isLeaf = !node.c || node.c.length === 0;
  const [isOpen, setIsOpen] = useState(defaultOpen);
  useEffect(() => { setIsOpen(defaultOpen); if(onToggle) onToggle(node.n, defaultOpen); }, [defaultOpen]);

  const accountCodeMatch = node.n.match(/^(\d[\d\.]+)/);
  const accountCode = accountCodeMatch ? accountCodeMatch[1] : null;
  const hasMapping = isBalance && accountCode && VER_REPORTE_ACCOUNTS.has(accountCode);

  const fmtCur = (v) => new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);
  const pct = totalBaseUSD && node.u !== 0 ? `${((Math.abs(node.u) / totalBaseUSD) * 100).toFixed(2)}%` : '';
  const indent = { paddingLeft: `${level * 18 + 10}px` };
  const showUSD = currency !== 'bs'; const showBS = currency !== 'usd';

  const fmtLabel = (text) => text ? text.toUpperCase() : '';

  if (!isLeaf && !isAccountNode) {
    const isRoot = level === 0;
    let rootColor = 'text-orange-500'; let borderColor = 'border-orange-500';
    if (isBalance) {
      if (node.n.toUpperCase().includes('ACTIVO')) { rootColor = 'text-blue-500'; borderColor = 'border-blue-500'; }
      else if (node.n.toUpperCase().includes('PASIVO')) { rootColor = 'text-red-500'; borderColor = 'border-red-500'; }
      else if (node.n.toUpperCase().includes('PATRIMONIO')) { rootColor = 'text-purple-500'; borderColor = 'border-purple-500'; }
    }
    return (
      <>
        <tr className={isRoot ? 'bg-[#111827]' : 'bg-white border-b border-gray-100'}>
          <td style={indent} className={isRoot ? `py-3 px-3 ${rootColor} font-black text-xs uppercase tracking-[0.2em]` : 'py-2 px-3 font-black text-[11px] text-slate-800 uppercase'}>{fmtLabel(node.n)}</td>
          <td colSpan={3} />
        </tr>
        {node.c.map((child, i) => <ExpandableRow key={i} node={child} level={level + 1} totalBaseUSD={totalBaseUSD} defaultOpen={defaultOpen} highlightedAccounts={highlightedAccounts} toggleHighlight={toggleHighlight} onShowReport={onShowReport} isBalance={isBalance} currency={currency} onToggle={onToggle}/>)}
        <tr className={`${isRoot ? `bg-slate-900 text-white border-t-2 ${borderColor}` : 'bg-slate-200 text-slate-800 border-t border-slate-300'} shadow-sm`}>
          <td style={{ paddingLeft: level * 18 + 28 }} className="py-2.5 px-3 font-black text-[10px] uppercase tracking-wider">TOTAL {fmtLabel(node.n)}</td>
          {showUSD && <td className={`py-2.5 px-3 text-right font-mono text-[11px] font-black ${isRoot ? rootColor : 'text-slate-900'}`}>{fmtCur(Math.abs(node.u))}</td>}
          {showBS  && <td className={`py-2.5 px-3 text-right font-mono text-[11px] font-black hidden sm:table-cell ${isRoot ? rootColor : 'text-slate-900'}`}>{fmtCur(Math.abs(node.b))}</td>}
          <td className={`py-2.5 px-3 text-right font-mono text-[11px] font-black ${isRoot ? rootColor : 'text-slate-900'}`}>{pct}</td>
        </tr>
      </>
    );
  }

  if (isLeaf || isAccountNode) {
    const isHighlighted = highlightedAccounts.has(node.n);
    const isSubItem = level > 0 && isLeaf && !isAccountNode;
    if (isSubItem) {
      return (
        <tr className="border-b border-slate-100 bg-slate-50/80 hover:bg-slate-100 transition-colors">
          <td style={{ paddingLeft: `${level * 18 + 28}px` }} className="py-1.5 px-3 text-[10px] text-slate-500 flex items-center gap-2">
            <span className="w-1 h-1 rounded-full bg-slate-300 flex-shrink-0"/>
            <span className="truncate max-w-[420px] italic">{fmtLabel(node.n)}</span>
          </td>
          {showUSD && <td className="py-1.5 px-3 text-right font-mono text-[10px] text-slate-500">{fmtCur(Math.abs(node.u))}</td>}
          <td className="py-1.5 px-3 text-right font-mono text-[10px] text-slate-400 hidden sm:table-cell">{fmtCur(Math.abs(node.b))}</td>
          {showBS  && <td className="py-1.5 px-3 text-right font-mono text-[9px] text-slate-400 hidden sm:table-cell">—</td>}
          <td className="py-1.5 px-3 text-right font-mono text-[9px] text-slate-400">{pct}</td>
        </tr>
      );
    }
    return (
      <>
        <tr onClick={() => !isLeaf && setIsOpen(!isOpen)} className={`border-b border-gray-200 cursor-pointer transition-colors ${isHighlighted ? 'bg-amber-100/80 hover:bg-amber-200 border-l-4 border-amber-500' : 'bg-white hover:bg-slate-50 border-l-4 border-slate-400'}`}>
          <td style={indent} className="py-2.5 px-3 font-bold text-[11px] text-slate-900 uppercase select-none flex items-center flex-wrap gap-2">
            {!isLeaf && <span onClick={e=>{e.stopPropagation();const next=!isOpen;setIsOpen(next);if(onToggle)onToggle(node.n,next);}} className={`inline-flex items-center justify-center w-4 h-4 border rounded-sm text-[11px] leading-none transition-colors ${isOpen ? 'border-slate-500 text-slate-600 bg-slate-100' : 'border-slate-300 text-slate-400 bg-white'}`}>{isOpen ? '−' : '+'}</span>}
            <button onClick={(e) => { e.stopPropagation(); toggleHighlight(node.n); }} className="focus:outline-none transition-transform hover:scale-110"><Star size={16} fill={isHighlighted ? "#f59e0b" : "none"} color={isHighlighted ? "#f59e0b" : "#cbd5e1"} /></button>
            <span className="truncate">{fmtLabel(node.n, isLeaf)}</span>
            {hasMapping && isBalance && (
              <button onClick={(e) => { e.stopPropagation(); const typeToPass = accountCode ? accountCode : (node.n.toUpperCase().includes('COBRAR') ? 'cxc' : 'cxp'); onShowReport(typeToPass); }}
                className="ml-2 px-2.5 py-1 bg-blue-600 text-white rounded-md text-[9px] font-black tracking-widest hover:bg-blue-700 shadow-md flex items-center gap-1">
                <Search size={10}/> VER REPORTE
              </button>
            )}
          </td>
          {showUSD && <td className={`py-2.5 px-3 text-right font-mono text-[11px] font-bold ${isHighlighted ? 'text-amber-900' : 'text-slate-800'}`}>{fmtCur(Math.abs(node.u))}</td>}
          {showBS  && <td className={`py-2.5 px-3 text-right font-mono text-[11px] font-bold hidden sm:table-cell ${isHighlighted ? 'text-amber-900' : 'text-slate-800'}`}>{fmtCur(Math.abs(node.b))}</td>}
          <td className={`py-2.5 px-3 text-right font-mono text-[11px] font-bold ${isHighlighted ? 'text-amber-700' : 'text-slate-500'}`}>{pct}</td>
        </tr>
        {isOpen && node.c && node.c.map((child, i) => <ExpandableRow key={i} node={child} level={level + 1} totalBaseUSD={totalBaseUSD} defaultOpen={defaultOpen} highlightedAccounts={highlightedAccounts} toggleHighlight={toggleHighlight} onShowReport={onShowReport} isBalance={isBalance} currency={currency} onToggle={onToggle}/>)}
        {!isLeaf && isOpen && (
          <tr className="bg-slate-200/60 font-black text-[10px] border-t border-slate-200">
            <td style={{ paddingLeft: level * 18 + 24 }} className="py-1.5 px-3 uppercase text-slate-500 tracking-wider">TOTAL {fmtLabel(node.n)}</td>
            {showUSD && <td className="py-1.5 px-3 text-right font-mono text-slate-700">{fmtCur(Math.abs(node.u))}</td>}
            {showBS  && <td className="py-1.5 px-3 text-right font-mono text-slate-700 hidden sm:table-cell">{fmtCur(Math.abs(node.b))}</td>}
            <td className="py-1.5 px-3 text-right font-mono text-slate-500">{pct}</td>
          </tr>
        )}
      </>
    );
  }
  return null;
};

// ============================================================================
// 4. VISTA: SUB-REPORTE AUXILIAR (CxC / CxP) — agrupado por cliente
// ============================================================================
function AuxiliarReportView({ accountCode, onBack, auxDataConfig }) {
  const mapInfo = ACCOUNT_MAPS[accountCode] || { type: 'cxp_general', label: 'Reporte General' };

  const filteredData = useMemo(() => {
    const allRecords = Object.values(auxDataConfig).flat().filter(Boolean);
    const byCC = allRecords.filter(d => {
      const cc = (d.cuentaContable || '').trim();
      return cc.startsWith(accountCode) || cc.includes(accountCode);
    });
    if (byCC.length > 0) return byCC;
    const bucketData = auxDataConfig[mapInfo.type] || [];
    return bucketData;
  }, [auxDataConfig, accountCode, mapInfo.type]);

  const total = filteredData.reduce((acc, curr) => acc + (curr.monto||0), 0);
  const fmtCur = (v) => new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);
  const isCxC = mapInfo.type.includes('cxc');

  const byClient = useMemo(() => {
    const map = {};
    filteredData.forEach(item => {
      if (!map[item.nombre]) map[item.nombre] = { cod: item.cod, records: [], subtotal: 0 };
      map[item.nombre].records.push(item);
      map[item.nombre].subtotal += item.monto;
    });
    return Object.entries(map).sort((a,b) => a[0].localeCompare(b[0]));
  }, [filteredData]);

  const [expanded, setExpanded] = useState({});
  const toggleClient = (name) => setExpanded(p => ({...p, [name]: !p[name]}));

  return (
    <div className="animate-in fade-in duration-300">
      <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-black text-xs uppercase mb-4 transition-colors"><ArrowLeft size={16}/> Volver al Balance</button>
      <div className="flex items-center justify-between mb-6 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
            {isCxC ? <Users className="text-blue-500"/> : <Briefcase className="text-red-500"/>} Auxiliar Detallado
          </h2>
          <p className="text-xs font-bold text-slate-400 uppercase mt-1">{accountCode.includes('.') ? `Cuenta: ${accountCode} — ${mapInfo.label}` : 'Reporte'}</p>
          <p className="text-[10px] text-slate-300 mt-0.5">{byClient.length} {isCxC ? 'clientes' : 'proveedores'} · {filteredData.length} documentos</p>
        </div>
        <div className="flex flex-col items-end gap-3">
          <div className="text-right">
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Saldo Total</p>
            <p className={`text-2xl font-mono font-black ${isCxC ? 'text-blue-600' : 'text-red-600'}`}>USD {fmtCur(total)}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => exportAuxiliarExcel(byClient, total, mapInfo, accountCode, isCxC)}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-md transition-colors">
              <FileSpreadsheet size={14}/> Excel
            </button>
            <button onClick={() => {
              const fmtP = v => new Intl.NumberFormat('es-VE',{minimumFractionDigits:2,maximumFractionDigits:2}).format(v||0);
              const rows = byClient.map(([nombre, group]) => {
                const detRows = group.records.map(item =>
                  `<tr><td>&nbsp;&nbsp;&nbsp;&nbsp;${item.doc}</td><td>${item.emision}</td><td>${item.vence}</td><td style="text-align:right">${item.dias}</td><td>${item.descripcion||'-'}</td><td style="text-align:right;font-weight:900">${fmtP(item.monto)}</td></tr>`
                ).join('');
                return `<tr class="section"><td colspan="5" style="font-weight:900">${nombre}</td><td style="text-align:right;font-weight:900">${fmtP(group.subtotal)}</td></tr>${detRows}<tr class="total"><td colspan="5">SUBTOTAL ${nombre}</td><td style="text-align:right">${fmtP(group.subtotal)}</td></tr>`;
              }).join('');
              printReport(
                `<h1>${isCxC?'Auxiliar de Cuentas por Cobrar':'Auxiliar de Cuentas por Pagar'}</h1><h2>Cuenta: ${accountCode} — ${mapInfo.label}</h2>`,
                `<table><thead><tr><th>Nombre / Doc.</th><th>Emisión</th><th>Vencimiento</th><th>Días</th><th>Descripción</th><th>Monto USD</th></tr></thead><tbody>${rows}<tr class="grand-total"><td colspan="5">TOTAL GENERAL</td><td style="text-align:right">${fmtP(total)}</td></tr></tbody></table>`
              );
            }}
              className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-md transition-colors">
              <FileText size={14}/> PDF
            </button>
          </div>
        </div>
      </div>
      <div className="space-y-2">
        {byClient.map(([nombre, group]) => (
          <div key={nombre} className="bg-white rounded-xl overflow-hidden border border-slate-200 shadow-sm">
            <button onClick={() => toggleClient(nombre)} className="w-full flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition-colors text-left gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <span className={`inline-flex items-center justify-center w-5 h-5 border rounded text-[11px] flex-shrink-0 ${expanded[nombre] ? 'border-blue-400 text-blue-600 bg-blue-50' : 'border-slate-300 text-slate-400 bg-white'}`}>{expanded[nombre] ? '−' : '+'}</span>
                <span className="text-[10px] font-black text-slate-400 flex-shrink-0">{group.cod}</span>
                <span className="font-black text-[12px] text-slate-900 uppercase truncate">{nombre}</span>
              </div>
              <span className={`font-mono font-black text-sm flex-shrink-0 ${group.subtotal < 0 ? 'text-red-500' : isCxC ? 'text-blue-700' : 'text-red-700'}`}>USD {fmtCur(group.subtotal)}</span>
            </button>
            {expanded[nombre] && (
              <div className="border-t border-slate-100">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 text-[9px] uppercase font-black text-slate-400">
                    <tr><th className="px-4 py-2">Operación</th><th className="px-4 py-2">Emisión</th><th className="px-4 py-2">Vencimiento</th><th className="px-4 py-2 text-right">Días</th><th className="px-4 py-2">No. Documento</th><th className="px-4 py-2">Descripción</th><th className="px-4 py-2 text-right">Monto USD</th><th className="px-4 py-2">Cuenta Contable</th></tr>
                  </thead>
                  <tbody>
                    {group.records.map((item, i) => (
                      <tr key={i} className="border-b border-slate-50 hover:bg-blue-50/30 transition-colors">
                        <td className="px-4 py-2 text-[11px] text-slate-600">{item.operacion||'-'}</td>
                        <td className="px-4 py-2 text-[11px] font-mono text-slate-500">{item.emision}</td>
                        <td className="px-4 py-2 text-[11px] font-mono text-slate-500">{item.vence}</td>
                        <td className={`px-4 py-2 text-right text-[11px] font-mono font-bold ${Number(item.dias)<0?'text-red-500':Number(item.dias)===0?'text-amber-500':'text-slate-500'}`}>{item.dias??'-'}</td>
                        <td className="px-4 py-2 text-[11px] font-mono text-slate-600">{item.doc}</td>
                        <td className="px-4 py-2 text-[11px] text-slate-500 max-w-[200px] truncate">{item.descripcion||'-'}</td>
                        <td className={`px-4 py-2 text-right text-[12px] font-mono font-bold ${item.monto<0?'text-red-500':'text-slate-900'}`}>{fmtCur(item.monto)}</td>
                        <td className="px-4 py-2 text-[10px] text-slate-400 font-mono truncate max-w-[160px]">{item.cuentaContable||'-'}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot><tr className="bg-slate-100 font-black text-[10px]"><td colSpan={6} className="px-4 py-2 text-slate-600 uppercase tracking-wider">Subtotal {nombre}</td><td className={`px-4 py-2 text-right font-mono text-sm ${group.subtotal<0?'text-red-600':isCxC?'text-blue-700':'text-red-700'}`}>USD {fmtCur(group.subtotal)}</td><td/></tr></tfoot>
                </table>
              </div>
            )}
          </div>
        ))}
      </div>
      <div className={`mt-4 rounded-2xl p-5 flex justify-between items-center border-2 ${isCxC?'bg-blue-900 border-blue-500':'bg-red-900 border-red-500'}`}>
        <span className="text-white font-black uppercase tracking-widest text-sm">TOTAL {mapInfo.label}</span>
        <span className="font-mono font-black text-xl text-white">USD {fmtCur(total)}</span>
      </div>
    </div>
  );
}

// ============================================================================
// 5. VISTA: ESTADO DE RESULTADOS
// ============================================================================
function EstadoResultadoView({ onBack, dbData, activosFijosData }) {
  const availableMonths = useMemo(() => [...new Set(dbData.map(d => d.month))].filter(m=>m!=='Sin Mes'), [dbData]);
  const monthLabel = (m) => m === 'Saldos Iniciales' ? 'Depreciaciones' : m;
  const [selectedMonth, setSelectedMonth] = useState('General');
  const [defaultOpen, setDefaultOpen] = useState(false);
  const [expandKey, setExpandKey] = useState(0);
  const [highlightedAccounts, setHighlightedAccounts] = useState(() => new Set());
  const [currency, setCurrency] = useState('both');
  const toggleHighlight = (a) => setHighlightedAccounts(prev => { const s=new Set(prev); if(s.has(a))s.delete(a); else s.add(a); return s; });
  const [openNodeMap, setOpenNodeMap] = useState(() => ({}));
  const reportNodeOpen = (label, isOpen) => setOpenNodeMap(p => ({...p, [label.trim().toUpperCase()]: isOpen}));
  const getOpenSet = () => defaultOpen ? null : new Set(Object.entries(openNodeMap).filter(([,v])=>v).map(([k])=>k));

  const tree = useMemo(() => {
    const root = [];
    const monthData = selectedMonth === 'General' ? dbData : dbData.filter(d => d.month === selectedMonth);
    const resData = monthData.filter(item => !item.path.toUpperCase().includes('ACTIVO') && !item.path.toUpperCase().includes('PASIVO') && !item.path.toUpperCase().includes('PATRIMONIO') && !/^[123]/.test(item.name));
    const normKey = s => s.trim().replace(/\s+/g,' ').toUpperCase();
    resData.forEach(item => {
      const pathArray = correctTopLevelPath(item.path.split('>'), item.name);
      let cur = root;
      pathArray.forEach(folderName => {
        const key = normKey(folderName);
        let folder = cur.find(n => normKey(n.n) === key);
        if (!folder) { folder = { n: folderName.trim(), c: [], u: 0, b: 0 }; cur.push(folder); }
        cur = folder.c;
      });
      let leaf = cur.find(n => normKey(n.n) === normKey(item.name) && n.isLeaf);
      if (!leaf) cur.push({ n: item.name.trim(), u: item.usd, b: item.bs, isLeaf: true });
      else { leaf.u += item.usd; leaf.b += item.bs; }
    });

    const afRecords = activosFijosData?.records || [];
    if (afRecords.length > 0) {
      const monthsToProcess = selectedMonth === 'General'
        ? [...new Set(dbData.map(d=>d.month))].filter(m=>m!=='Sin Mes')
        : [selectedMonth];
      const numMeses = monthsToProcess.length;

      const depByCtaGasto = {};
      afRecords.filter(r=>r.costoUSD>0&&r.depreMensual>0).forEach(r => {
        const perMesUSD = r.depreMensual;
        const perMesBs  = r.tasa > 0 ? perMesUSD * r.tasa : perMesUSD;
        const ctaGasto  = (r.cuentaGasto||'').trim();

        if (ctaGasto && /^\d/.test(ctaGasto)) {
          const codeMatch = ctaGasto.match(/^(\d[\d.]+)/);
          const code  = codeMatch ? codeMatch[1] : ctaGasto;
          const label = ctaGasto.includes('-') ? ctaGasto : `${code}-DEPRECIACIÓN`;
          if (!depByCtaGasto[label]) depByCtaGasto[label] = { montoBs: 0, montoUSD: 0 };
          depByCtaGasto[label].montoBs  += perMesBs  * numMeses;
          depByCtaGasto[label].montoUSD += perMesUSD * numMeses;
        } else {
          const rubro = getRubro(r);
          const map = RUBRO_DEPR_MAP[rubro];
          if (map) {
            if (map.debe.length === 1) {
              const d0 = map.debe[0];
              const label = `${d0.cta}-${d0.nombre}`;
              if (!depByCtaGasto[label]) depByCtaGasto[label] = { montoBs: 0, montoUSD: 0 };
              depByCtaGasto[label].montoBs  += perMesBs  * numMeses;
              depByCtaGasto[label].montoUSD += perMesUSD * numMeses;
            } else {
              const sede2 = (r.sede||'').toUpperCase().trim();
              const desc2 = ((r.descripcion||'')+(r.cuenta||'')).toUpperCase();
              const esAdm = sede2 === 'C2' || /\bC2\b/.test(sede2) ||
                /JAC\b|\bT6\b|ADMIN|OFICIN|ADM\b|GERENC|DIRECCI/.test(desc2);
              const ctaElegida = esAdm
                ? map.debe.find(d => /^6/.test(d.cta)) || map.debe[0]
                : map.debe.find(d => /^5/.test(d.cta)) || map.debe[0];
              const label = `${ctaElegida.cta}-${ctaElegida.nombre}`;
              if (!depByCtaGasto[label]) depByCtaGasto[label] = { montoBs: 0, montoUSD: 0 };
              depByCtaGasto[label].montoBs  += perMesBs  * numMeses;
              depByCtaGasto[label].montoUSD += perMesUSD * numMeses;
            }
          } else {
            const label = `5.x.xx.xx.xxx-DEPRECIACIÓN ${rubro}`;
            if (!depByCtaGasto[label]) depByCtaGasto[label] = { montoBs: 0, montoUSD: 0 };
            depByCtaGasto[label].montoBs  += perMesBs  * numMeses;
            depByCtaGasto[label].montoUSD += perMesUSD * numMeses;
          }
        }
      });

      const getDepPath = (ctaLabel) => {
        const firstChar = ctaLabel.trim()[0];
        if (firstChar === '6') {
          const gastoNode = root.find(n => /^(GASTOS|GASTO)/i.test(n.n.trim()));
          const gastoName = gastoNode ? gastoNode.n : 'GASTOS OPERATIVOS Y ADMINISTRATIVOS';
          return [gastoName, 'GASTOS DE DEPRECIACIÓN'];
        }
        const costoNode = root.find(n => /^(COSTO)/i.test(n.n.trim()));
        const costoName = costoNode ? costoNode.n : 'COSTOS Y GASTOS OPERATIVOS';
        return [costoName, 'DEPRECIACIÓN'];
      };

      Object.entries(depByCtaGasto).forEach(([ctaGasto, vals]) => {
        const pathDep = getDepPath(ctaGasto);
        let cur = root;
        pathDep.forEach(folderName => {
          const key = normKey(folderName);
          let folder = cur.find(n => normKey(n.n) === key);
          if (!folder) { folder = { n: folderName, c: [], u: 0, b: 0 }; cur.push(folder); }
          cur = folder.c;
        });
        let leaf = cur.find(n => normKey(n.n)===normKey(ctaGasto)&&n.isLeaf);
        if (!leaf) cur.push({ n: ctaGasto, u: vals.montoUSD, b: vals.montoBs, isLeaf: true });
        else { leaf.u += vals.montoUSD; leaf.b += vals.montoBs; }
      });
    }

    const compute = (nodes) => { let u=0,b=0; nodes.forEach(n => { if(!n.isLeaf){const t=compute(n.c);n.u=t.u;n.b=t.b;} u+=n.u;b+=n.b; }); return {u,b}; };
    compute(root);
    root.forEach(rootNode => {
      const isIngreso = rootNode.n.toUpperCase().includes('INGRESO') || rootNode.n.toUpperCase().includes('VENTA') || rootNode.n.startsWith('4');
      const multiplier = isIngreso ? -1 : 1;
      const applySign = (nodes) => nodes.forEach(n => { n.u *= multiplier; n.b *= multiplier; if (!n.isLeaf) applySign(n.c); });
      applySign([rootNode]);
    });
    root.forEach(cat => { if (cat.c && cat.c.length) sortTreeNodes(cat.c); });
    return root;
  }, [dbData, selectedMonth, activosFijosData]);

  let totalUSD = 0; let totalBS = 0; let baseVentas = 0;
  let ingresosUSD = 0; let ingresosBS = 0;
  let costosUSD = 0;  let costosBS = 0;
  tree.forEach(n => {
    const up = n.n.toUpperCase();
    const isIng  = up.includes('INGRESO') || up.includes('VENTA') || n.n.startsWith('4');
    const isCost = up.includes('COSTO') || n.n.startsWith('5');
    if (isIng)  { totalUSD+=n.u; totalBS+=n.b; baseVentas+=n.u; ingresosUSD+=n.u; ingresosBS+=n.b; }
    else        { totalUSD-=n.u; totalBS-=n.b; if(isCost){ costosUSD+=n.u; costosBS+=n.b; } }
  });
  if (baseVentas === 0) baseVentas = 1;
  const utilidadBrutaUSD = ingresosUSD - costosUSD;
  const utilidadBrutaBS  = ingresosBS  - costosBS;
  const fmtR = (v) => new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);

  const toTitleCase = (str) => str.replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());

  return (
    <div className="min-h-screen" style={{background:'#f3f2ef',backgroundImage:'radial-gradient(circle,#c8c8c8 1px,transparent 1px)',backgroundSize:'22px 22px'}}>
      <header className="bg-[#111111] border-b-4 border-orange-500 px-6 py-3 flex justify-between items-center sticky top-0 z-30 shadow-lg flex-wrap gap-4">
        <div className="flex items-center gap-4 flex-wrap">
          <button onClick={onBack} className="flex items-center gap-2 font-black text-xs text-slate-400 uppercase hover:text-orange-400"><ArrowLeft size={16}/> Panel</button>
          <div className="flex items-center gap-2 border-l-2 border-slate-700 pl-4">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Período:</span>
            <select value={selectedMonth} onChange={e=>setSelectedMonth(e.target.value)} className="bg-orange-500/10 border border-orange-500/40 text-orange-300 text-xs rounded-lg p-1.5 font-black uppercase cursor-pointer outline-none min-w-[120px]">
              <option value="General">General (Acumulado)</option>
              {availableMonths.map(m => <option key={m} value={m}>{monthLabel(m)}</option>)}
            </select>
          </div>
          <div className="flex gap-1 bg-slate-800 p-1 rounded-lg border border-slate-700 border-l-2 border-l-slate-700 ml-2">
            {[['both','USD + Bs'],['usd','Solo USD'],['bs','Solo Bs']].map(([v,lbl])=>(
              <button key={v} onClick={()=>setCurrency(v)} className={`px-3 py-1.5 rounded text-[10px] font-black uppercase transition-colors ${currency===v?'bg-orange-500 text-white':'text-slate-400 hover:text-white hover:bg-slate-700'}`}>{lbl}</button>
            ))}
          </div>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          <div className="flex gap-1 bg-slate-800 p-1 rounded-lg border border-slate-700">
            <button onClick={() => { setDefaultOpen(true); setExpandKey(k=>k+1); }} className="px-3 py-1.5 rounded text-[10px] font-black uppercase flex items-center gap-1 text-slate-300 hover:bg-slate-700 hover:text-white"><ChevronDown size={14}/> Expandir</button>
            <button onClick={() => { setDefaultOpen(false); setExpandKey(k=>k+1); }} className="px-3 py-1.5 rounded text-[10px] font-black uppercase flex items-center gap-1 text-slate-300 hover:bg-slate-700 hover:text-white"><ChevronRight size={14}/> Contraer</button>
          </div>
          <button onClick={() => exportResultadoExcel(tree, monthLabel(selectedMonth), totalUSD, getOpenSet(), currency)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest shadow-md transition-colors">
            <FileSpreadsheet size={13}/> Excel
          </button>
          <button onClick={() => {
            const fmtP = v => new Intl.NumberFormat('es-VE',{minimumFractionDigits:2,maximumFractionDigits:2}).format(Math.abs(v||0));
            const showUSD = currency !== 'bs'; const showBS = currency !== 'usd';
            const cols = ['Cuenta', ...(showUSD?['USD']:[]), ...(showBS?['Bs.']:[]), '%'].map(c=>`<th>${c}</th>`).join('');
            const openStates = getOpenSet();
            const buildRows = (nodes, lvl=0) => nodes.map(n => {
              const indent = '&nbsp;'.repeat(lvl*4);
              const isAccountNode = /^\d\./.test(n.n) || (!n.c || n.c.length === 0);

              if (!n.isLeaf && n.c?.length) {
                if (!isAccountNode) {
                  const childRows = buildRows(n.c, lvl+1);
                  return `<tr class="section"><td>${indent}${n.n}</td>${showUSD?'<td></td>':''}${showBS?'<td></td>':''}<td></td></tr>${childRows}<tr class="total"><td>${indent}TOTAL ${n.n}</td>${showUSD?`<td>${fmtP(n.u)}</td>`:''}${showBS?`<td>${fmtP(n.b)}</td>`:''}<td></td></tr>`;
                } else {
                  const isOpen = !openStates || openStates.has(n.n.trim().toUpperCase());
                  let html = `<tr><td>${indent}${n.n}</td>${showUSD?`<td>${fmtP(n.u)}</td>`:''}${showBS?`<td>${fmtP(n.b)}</td>`:''}<td>${baseVentas?((Math.abs(n.u)/Math.abs(baseVentas)*100).toFixed(2)+'%'):''}</td></tr>`;
                  if (isOpen) {
                    html += buildRows(n.c, lvl+1);
                    html += `<tr class="total"><td>${indent}TOTAL ${n.n}</td>${showUSD?`<td>${fmtP(n.u)}</td>`:''}${showBS?`<td>${fmtP(n.b)}</td>`:''}<td></td></tr>`;
                  }
                  return html;
                }
              }
              return `<tr><td>${indent}${n.n}</td>${showUSD?`<td>${fmtP(n.u)}</td>`:''}${showBS?`<td>${fmtP(n.b)}</td>`:''}<td>${baseVentas?((Math.abs(n.u)/Math.abs(baseVentas)*100).toFixed(2)+'%'):''}</td></tr>`;
            }).join('');
            printReport(`<h1>Estado de Resultado</h1><h2>Período: ${selectedMonth==='General'?'Acumulado':monthLabel(selectedMonth)}</h2>`,
              `<table><thead><tr>${cols}</tr></thead><tbody>${buildRows(tree)}<tr class="grand-total"><td>RESULTADO DEL EJERCICIO</td>${showUSD?`<td>${fmtP(totalUSD)}</td>`:''}${showBS?'<td></td>':''}<td>${baseVentas?((Math.abs(totalUSD)/Math.abs(baseVentas)*100).toFixed(2)+'%'):''}</td></tr></tbody></table>`);
          }}
            className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-3 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest shadow-md transition-colors">
            <FileText size={13}/> PDF
          </button>
        </div>
      </header>
      <main className="p-4 md:p-8 max-w-6xl mx-auto pb-16">
        <div className="bg-white px-8 py-8 border-t-4 border-orange-500 shadow-md flex flex-col items-center text-center mb-6 rounded-b-2xl">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500 mb-1">Servicios Jiret G&B, C.A.</p>
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-1">Estado de Resultado</h1>
          <p className="text-orange-600 font-black uppercase bg-orange-50 px-5 py-1.5 rounded-full text-[10px] border border-orange-200 mt-2">
            Período: {selectedMonth === 'General' ? 'Acumulado' : monthLabel(selectedMonth)}
          </p>
        </div>
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#111111] text-[10px] uppercase font-black text-slate-300">
              <tr>
                <th className="px-4 py-5 w-[55%]">Cuentas</th>
                {currency !== 'bs'  && <th className="px-3 py-5 text-right text-orange-300">USD</th>}
                {currency !== 'usd' && <th className="px-3 py-5 text-right text-amber-300 hidden sm:table-cell">Bs.</th>}
                <th className="px-3 py-5 text-right text-slate-400">%</th>
              </tr>
            </thead>
            <tbody key={expandKey}>
              {tree.map((node, i) => {
                const up = node.n.toUpperCase();
                const isIng  = up.includes('INGRESO') || up.includes('VENTA') || node.n.startsWith('4');
                const isCost = up.includes('COSTO') || node.n.startsWith('5');
                const showUB = isCost;
                return (
                  <React.Fragment key={i}>
                    <ExpandableRow node={node} totalBaseUSD={baseVentas} defaultOpen={defaultOpen} highlightedAccounts={highlightedAccounts} toggleHighlight={toggleHighlight} isBalance={false} currency={currency} onToggle={reportNodeOpen}/>
                    {showUB && (
                      <tr className="border-t-2 border-emerald-400 bg-emerald-50">
                        <td className="px-5 py-3 font-black text-[11px] uppercase tracking-widest text-emerald-800 pl-8">UTILIDAD BRUTA</td>
                        {currency !== 'bs'  && <td className={`px-3 py-3 text-right font-mono font-black text-sm ${utilidadBrutaUSD >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>{fmtR(utilidadBrutaUSD)}</td>}
                        {currency !== 'usd' && <td className={`px-3 py-3 text-right font-mono font-black text-sm hidden sm:table-cell ${utilidadBrutaBS >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{fmtR(utilidadBrutaBS)}</td>}
                        <td className="px-3 py-3 text-right font-mono font-black text-[11px] text-emerald-600">{baseVentas ? (Math.abs(utilidadBrutaUSD)/Math.abs(baseVentas)*100).toFixed(2) : 0}%</td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
              <tr className="bg-[#111111] text-white font-black border-t-4 border-orange-600">
                <td className="px-5 py-7 text-sm uppercase tracking-[0.2em]" style={{paddingLeft:28}}>RESULTADO DEL EJERCICIO</td>
                {currency !== 'bs'  && <td className={`px-3 py-7 text-right text-lg font-mono ${totalUSD < 0 ? 'text-red-400' : 'text-emerald-400'}`}>{fmtR(totalUSD)}</td>}
                {currency !== 'usd' && <td className={`px-3 py-7 text-right text-base font-mono hidden sm:table-cell ${totalBS < 0 ? 'text-red-300' : 'text-amber-300'}`}>{fmtR(totalBS)}</td>}
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
// 6. VISTA: ANÁLISIS COMPARATIVO
// ============================================================================
function AnalisisComparativoView({ onBack, dbData, activosFijosData }) {
  const availableMonths = useMemo(() => [...new Set(dbData.map(d => d.month))].filter(m => m !== 'Sin Mes'), [dbData]);
  const [month1, setMonth1] = useState(availableMonths[0] || '');
  const [month2, setMonth2] = useState(availableMonths[1] || availableMonths[0] || '');
  const fmtR = (v) => new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);

  const tree = useMemo(() => {
    const root = [];
    const getData = (m) => dbData.filter(d => d.month === m && !d.path.toUpperCase().includes('ACTIVO') && !d.path.toUpperCase().includes('PASIVO') && !d.path.toUpperCase().includes('PATRIMONIO') && !/^[123]/.test(d.name));
    const m1Data = getData(month1); const m2Data = getData(month2);
    const processItem = (item, isM1) => {
      const pathParts = correctTopLevelPath(item.path.split('>'), item.name);
      const mainCategory = pathParts[0] ? pathParts[0].trim().toUpperCase() : 'OTROS';
      let accountOriginalName = pathParts.length > 1 ? pathParts[pathParts.length - 1].trim() : item.name.trim();
      if (!/^(\d[\d\.]+)/.test(accountOriginalName) && /^(\d[\d\.]+)/.test(item.name.trim())) accountOriginalName = item.name.trim();
      const matchKey = accountOriginalName.match(/^(\d[\d\.]+)/);
      const accountKey = matchKey ? matchKey[1] : accountOriginalName.toUpperCase();
      let categoryNode = root.find(n => n.key === mainCategory);
      if (!categoryNode) { categoryNode = { key: mainCategory, n: pathParts[0]?pathParts[0].trim().toUpperCase():'OTROS', c: [], m1_u: 0, m2_u: 0 }; root.push(categoryNode); }
      let accountNode = categoryNode.c.find(n => n.key === accountKey);
      if (!accountNode) { accountNode = { key: accountKey, n: accountOriginalName, m1_u: 0, m2_u: 0 }; categoryNode.c.push(accountNode); }
      if (isM1) accountNode.m1_u += item.usd; else accountNode.m2_u += item.usd;
    };
    m1Data.forEach(item => processItem(item, true));
    m2Data.forEach(item => processItem(item, false));

    const afRecords = activosFijosData?.records || [];
    if (afRecords.length > 0) {
      const getDeprByRubro = () => {
        const byRubro = {};
        afRecords.filter(r=>r.costoUSD>0&&r.depreMensual>0).forEach(r => {
          const rubro = getRubro(r);
          const map = RUBRO_DEPR_MAP[rubro];
          if (!map) return;
          const nDebe = map.debe.length;

          const perMesUSD = r.depreMensual;

          map.debe.forEach(d => {
            const key = `${d.cta}-${d.nombre}`;
            if (!byRubro[key]) byRubro[key] = { m1: 0, m2: 0, cat: d.cta[0]==='6'?'GASTOS':'COSTOS Y GASTOS OPERATIVOS' };
            byRubro[key].m1 += perMesUSD / nDebe;
            byRubro[key].m2 += perMesUSD / nDebe;
          });
        });
        return byRubro;
      };
      const deprByRubro = getDeprByRubro();
      Object.entries(deprByRubro).forEach(([label, vals]) => {
        const catKey = vals.cat;
        let catNode = root.find(n => n.key === catKey);
        if (!catNode) { catNode = { key: catKey, n: catKey, c: [], m1_u: 0, m2_u: 0 }; root.push(catNode); }
        let accNode = catNode.c.find(n => n.key === label);
        if (!accNode) { accNode = { key: label, n: label, m1_u: 0, m2_u: 0 }; catNode.c.push(accNode); }
        accNode.m1_u += vals.m1;
        accNode.m2_u += vals.m2;
      });
    }

    root.forEach(cat => {
      let cat_m1 = 0, cat_m2 = 0;
      const up = cat.n.toUpperCase();
      const isIngreso = up.includes('INGRESO') || up.includes('VENTA') || /^4/.test(cat.key||'');
      const multiplier = isIngreso ? -1 : 1;
      cat.c.forEach(acc => { acc.m1_u *= multiplier; acc.m2_u *= multiplier; cat_m1 += acc.m1_u; cat_m2 += acc.m2_u; });
      cat.m1_u = cat_m1; cat.m2_u = cat_m2;
    });
    root.forEach(cat => { if (cat.c && cat.c.length) sortTreeNodes(cat.c); });
    return root;
  }, [dbData, month1, month2, activosFijosData]);

  let total_m1 = 0, total_m2 = 0;
  tree.forEach(cat => {
    const isIng = cat.n.toUpperCase().includes('INGRESO') || cat.n.toUpperCase().includes('VENTA') || (cat.key && /^4/.test(cat.key));
    if (isIng) { total_m1 += cat.m1_u; total_m2 += cat.m2_u; }
    else       { total_m1 -= cat.m1_u; total_m2 -= cat.m2_u; }
  });
  const varAbsTotal = total_m2 - total_m1;

  return (
    <div className="min-h-screen" style={{background:'#f3f2ef',backgroundImage:'radial-gradient(circle,#c8c8c8 1px,transparent 1px)',backgroundSize:'22px 22px'}}>
      <header className="bg-white border-b-2 border-indigo-400 px-6 py-3 flex justify-between items-center sticky top-0 z-30 shadow-sm flex-wrap gap-3">
        <button onClick={onBack} className="flex items-center gap-2 font-black text-xs text-slate-600 uppercase hover:text-indigo-600"><ArrowLeft size={16}/> Volver al Panel</button>
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Base:</span>
          <select value={month1} onChange={e=>setMonth1(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs font-bold outline-none">{availableMonths.map(m=><option key={m}>{m}</option>)}</select>
          <span className="text-slate-400 font-black text-xs">VS</span>
          <select value={month2} onChange={e=>setMonth2(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs font-bold outline-none">{availableMonths.map(m=><option key={m}>{m}</option>)}</select>
          <button onClick={() => exportComparativoExcel(tree, month1, month2, total_m1, total_m2)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest shadow-md transition-colors">
            <FileSpreadsheet size={13}/> Excel
          </button>
          <button onClick={() => {
            const fmtR = v => new Intl.NumberFormat('es-VE',{minimumFractionDigits:2,maximumFractionDigits:2}).format(v||0);
            const pct = (varAbs, base) => base !== 0 ? (Math.abs(varAbs) / Math.abs(base) * 100).toFixed(2) + '%' : '—';
            const cols = `<th>Estructura</th><th style="text-align:right">${month1}</th><th style="text-align:right">${month2}</th><th style="text-align:right">Var. Absoluta</th><th style="text-align:right">Var. %</th>`;
            let rowsHtml = '';
            tree.forEach(cat => {
              const sortedAccounts = [...cat.c].sort((a,b) => String(a.n).localeCompare(String(b.n)));
              const catVarAbs = cat.m2_u - cat.m1_u;
              rowsHtml += `<tr class="section"><td colspan="5" style="text-align:left;">${cat.n}</td></tr>`;
              sortedAccounts.forEach(acc => {
                const varAbs = acc.m2_u - acc.m1_u;
                rowsHtml += `<tr><td style="text-align:left;padding-left:15px;">${acc.n}</td><td style="text-align:right">${fmtR(acc.m1_u)}</td><td style="text-align:right">${fmtR(acc.m2_u)}</td><td style="text-align:right">${fmtR(varAbs)}</td><td style="text-align:right">${pct(varAbs,acc.m1_u)}</td></tr>`;
              });
              rowsHtml += `<tr class="total"><td style="text-align:left;padding-left:15px;">TOTAL ${cat.n}</td><td style="text-align:right">${fmtR(cat.m1_u)}</td><td style="text-align:right">${fmtR(cat.m2_u)}</td><td style="text-align:right">${fmtR(catVarAbs)}</td><td style="text-align:right">${pct(catVarAbs,cat.m1_u)}</td></tr>`;
            });
            const varAbsTotal = total_m2 - total_m1;
            printReport(
              `<h1>Análisis Comparativo de Variaciones</h1><h2>${month1} vs ${month2}</h2>`,
              `<table><thead><tr>${cols}</tr></thead><tbody>${rowsHtml}<tr class="grand-total"><td style="text-align:left;">RESULTADO DEL EJERCICIO</td><td style="text-align:right">${fmtR(total_m1)}</td><td style="text-align:right">${fmtR(total_m2)}</td><td style="text-align:right">${fmtR(varAbsTotal)}</td><td style="text-align:right">${pct(varAbsTotal,total_m1)}</td></tr></tbody></table>`
            );
          }}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest shadow-md transition-colors">
            <FileText size={13}/> PDF
          </button>
        </div>
      </header>
      <main className="p-4 md:p-8 max-w-6xl mx-auto pb-16">
        <div className="bg-white px-8 py-10 border-t-4 border-indigo-400 shadow-md flex flex-col items-center text-center mb-6 rounded-b-2xl">
          <h1 className="text-3xl font-black text-slate-900 uppercase mb-2">Servicios Jiret G&B, C.A.</h1>
          <h2 className="text-xl font-black text-slate-800 uppercase tracking-widest mb-2">Análisis Comparativo</h2>
          <p className="font-black uppercase bg-slate-800 text-white px-5 py-2 rounded-full text-[10px]">{month1} vs {month2}</p>
        </div>
        {availableMonths.length < 2 ? (
          <div className="bg-white p-12 text-center rounded-xl border border-slate-200"><AlertTriangle className="mx-auto text-indigo-400 mb-4" size={48}/><p className="text-slate-500 font-black text-xs uppercase">Necesitas al menos 2 meses cargados.</p></div>
        ) : (
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-800 text-[10px] uppercase font-black text-slate-300 border-b-2 border-indigo-500">
                <tr><th className="px-4 py-5 w-[45%]">Estructura</th><th className="px-3 py-5 text-right bg-slate-900/50">{month1}</th><th className="px-3 py-5 text-right bg-slate-900">{month2}</th><th className="px-3 py-5 text-right text-indigo-400">Var. Absoluta</th><th className="px-3 py-5 text-right">Var. %</th></tr>
              </thead>
              <tbody>
                {tree.map((cat, i) => {
                  const sortedAccounts = [...cat.c].sort((a,b) => String(a.n).localeCompare(String(b.n)));
                  const catVarAbs = cat.m2_u - cat.m1_u;
                  return (
                    <React.Fragment key={i}>
                      <tr className="bg-[#111827]"><td className="py-3 px-4 text-indigo-400 font-black text-xs uppercase tracking-[0.2em]">{cat.n}</td><td colSpan={4}/></tr>
                      {sortedAccounts.map((acc, j) => {
                        const varAbs = acc.m2_u - acc.m1_u;
                        const varPct = acc.m1_u !== 0 ? (varAbs/Math.abs(acc.m1_u))*100 : (acc.m2_u !== 0 ? 100 : 0);
                        const colorClass = varAbs > 0 ? 'text-emerald-600' : (varAbs < 0 ? 'text-red-500' : 'text-slate-400');
                        return (
                          <tr key={j} className="bg-white border-b border-gray-100 hover:bg-indigo-50 transition-colors">
                            <td className="py-2.5 px-4 font-bold text-[11px] text-slate-800 uppercase pl-6 border-l-4 border-indigo-400 truncate max-w-xs">{acc.n}</td>
                            <td className="py-2.5 px-3 text-right font-mono text-[11px] text-slate-600">{fmtR(acc.m1_u)}</td>
                            <td className="py-2.5 px-3 text-right font-mono text-[11px] text-slate-800 font-bold">{fmtR(acc.m2_u)}</td>
                            <td className={`py-2.5 px-3 text-right font-mono text-[11px] font-bold ${varAbs !== 0 ? 'text-indigo-600' : 'text-slate-400'}`}>{fmtR(varAbs)}</td>
                            <td className={`py-2.5 px-3 text-right font-mono text-[11px] font-bold ${colorClass}`}>{Math.abs(varPct).toFixed(2)}%</td>
                          </tr>
                        );
                      })}
                      <tr className="bg-slate-200 text-slate-800 border-t border-slate-300">
                        <td className="py-3 px-4 font-black text-[11px] uppercase pl-6">TOTAL {cat.n}</td>
                        <td className="py-3 px-3 text-right font-mono text-[12px] font-black">{fmtR(cat.m1_u)}</td>
                        <td className="py-3 px-3 text-right font-mono text-[12px] font-black">{fmtR(cat.m2_u)}</td>
                        <td className={`py-3 px-3 text-right font-mono text-[12px] font-black ${catVarAbs !== 0 ? 'text-indigo-600' : 'text-slate-500'}`}>{fmtR(catVarAbs)}</td>
                        <td className="py-3 px-3 text-right font-mono text-[12px] font-black text-slate-500">{cat.m1_u!==0?Math.abs(catVarAbs/Math.abs(cat.m1_u)*100).toFixed(2):'—'}%</td>
                      </tr>
                    </React.Fragment>
                  );
                })}
                <tr className="bg-slate-900 text-white font-black border-t-4 border-indigo-600">
                  <td className="px-5 py-7 text-sm uppercase tracking-[0.2em]" style={{paddingLeft:28}}>RESULTADO DEL EJERCICIO</td>
                  <td className="px-3 py-7 text-right text-base font-mono border-l border-slate-800">{fmtR(total_m1)}</td>
                  <td className="px-3 py-7 text-right text-base font-mono border-l border-slate-800">{fmtR(total_m2)}</td>
                  <td className={`px-3 py-7 text-right text-lg font-mono border-l border-slate-800 ${varAbsTotal > 0?'text-emerald-400':'text-red-400'}`}>{fmtR(varAbsTotal)}</td>
                  <td className={`px-3 py-7 text-right text-lg font-mono ${varAbsTotal > 0?'text-emerald-400':'text-red-400'}`}>{total_m2!==0?Math.abs(varAbsTotal/Math.abs(total_m2)*100).toFixed(2):'—'}%</td>
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
const DEP_ACUM_ACCOUNT_MAP = {
  'MOBILIARIO':       '1.1.06.01.013-DEP. ACUMULADA MOBILIARIO',
  'MAQUINARIA':       '1.1.06.01.004-DEP. ACUMULADA MAQUINARIA Y EQUIPOS',
  'PLANTA ELECTRICA': '1.1.06.01.017-DEP. ACUMULADA PLANTA ELECTRICA',
  'GALPON':           '1.1.06.01.002-DEP. ACUMULADA MEJORAS AL INMUEBLE (GALPON)',
  'INMUEBLE':         '1.1.06.01.002-DEP. ACUMULADA MEJORAS AL INMUEBLE (GALPON)',
  'VEHICULO':         '1.1.06.01.009-DEP. ACUMULADA VEHÍCULOS',
};

const RUBRO_DEPR_MAP = {
  'GALPÓN E INMUEBLES': {
    debe:  [{ cta: '5.1.03.05.009', nombre: 'DEPRECIACIÓN GALPON (OP)' }],
    haber: [{ cta: '1.1.06.01.002', nombre: 'DEP. ACUMULADA MEJORAS AL INMUEBLE (GALPON)' }],
  },
  'MAQUINARIA Y EQUIPOS': {
    debe:  [{ cta: '5.1.03.05.010', nombre: 'DEPRECIACIÓN MAQUINARIA Y EQUIPOS (OP)' }],
    haber: [{ cta: '1.1.06.01.004', nombre: 'DEP. ACUMULADA MAQUINARIA Y EQUIPOS' }],
  },
  'HERRAMIENTAS MENORES': {
    debe:  [{ cta: '5.1.03.05.013', nombre: 'DEPRECIACIÓN MONTACARGAS (OP)' }],
    haber: [{ cta: '1.1.06.01.004', nombre: 'DEP. ACUMULADA MAQUINARIA Y EQUIPOS' }],
  },
  'MOBILIARIO Y EQUIPO DE OFICINA': {
    debe:  [
      { cta: '5.1.03.05.011', nombre: 'DEPRECIACIÓN MOBILIARIO Y EQUIPO (OP)' },
      { cta: '6.2.02.02.006', nombre: 'DEP. MOBILIARIO' },
    ],
    haber: [{ cta: '1.1.06.01.013', nombre: 'DEP. ACUMULADA MOBILIARIO' }],
  },
  'VEHÍCULOS': {
    debe:  [
      { cta: '5.1.03.05.012', nombre: 'DEPRECIACIÓN VEHÍCULOS DE OPERACIONES (OP)' },
      { cta: '6.2.02.02.004', nombre: 'DEP. VEHÍCULOS' },
    ],
    haber: [{ cta: '1.1.06.01.009', nombre: 'DEP. ACUMULADA VEHÍCULOS' }],
  },
  'PLANTA ELÉCTRICA': {
    debe:  [{ cta: '5.1.03.05.014', nombre: 'DEPRECIACIÓN PLANTA ELECTRICA (OP)' }],
    haber: [{ cta: '1.1.06.01.017', nombre: 'DEP. ACUMULADA PLANTA ELECTRICA' }],
  },
  'EQUIPOS DE COMPUTACIÓN Y TELECOMUNICACIONES': {
    debe:  [
      { cta: '5.1.03.05.015', nombre: 'DEP. EQUIPOS DE COMPUTACIÓN (OP)' },
      { cta: '6.2.02.02.003', nombre: 'DEP. EQUIPOS DE COMPUTACIÓN' },
    ],
    haber: [{ cta: '1.1.06.01.007', nombre: 'DEP. ACUMULADA EQUIPOS DE COMPUTACIÓN' }],
  },
};
const BALANCE_ACCOUNT_PATH = {
  '1.1.01.01': ['ACTIVOS','ACTIVO CIRCULANTE','DISPONIBLE','CAJA MONEDA EXTRANJERA'],
  '1.1.01.02': ['ACTIVOS','ACTIVO CIRCULANTE','DISPONIBLE','BANCOS NACIONALES'],
  '1.1.01.03': ['ACTIVOS','ACTIVO CIRCULANTE','DISPONIBLE','BANCOS NACIONALES MONEDA EXT.'],
  '1.1.01.04': ['ACTIVOS','ACTIVO CIRCULANTE','DISPONIBLE','BANCOS EXTRANJEROS.'],
  '1.1.02.01': ['ACTIVOS','ACTIVO CIRCULANTE','EFECTOS Y CUENTAS POR COBRAR','CLIENTES'],
  '1.1.02.02': ['ACTIVOS','ACTIVO CIRCULANTE','EFECTOS Y CUENTAS POR COBRAR','INTERCOMPAÑIAS'],
  '1.1.02.03': ['ACTIVOS','ACTIVO CIRCULANTE','EFECTOS Y CUENTAS POR COBRAR','DIRECTORES'],
  '1.1.02.04': ['ACTIVOS','ACTIVO CIRCULANTE','EFECTOS Y CUENTAS POR COBRAR','EMPLEADOS'],
  '1.1.02.05': ['ACTIVOS','ACTIVO CIRCULANTE','EFECTOS Y CUENTAS POR COBRAR','ANTICIPOS Y OTRAS CUENTAS'],
  '1.1.03.01': ['ACTIVOS','ACTIVO CIRCULANTE','INVERSIONES A CORTO PLAZO','INVENTARIOS'],
  '1.1.04.01': ['ACTIVOS','ACTIVO CIRCULANTE','RETENCIONES Y APORTES','RETENCIONES Y CREDITOS FISCALES'],
  '1.1.05.01': ['ACTIVOS','ACTIVO CIRCULANTE','PREPAGADOS','GASTOS PAGADOS POR ANTICIPADO'],
  '2.1.01.01': ['PASIVO','PASIVO CIRCULANTE','CTAS Y EFECTOS POR PAGAR','CUENTAS POR PAGAR'],
  '2.1.01.02': ['PASIVO','PASIVO CIRCULANTE','OTRAS CUENTAS POR PAGAR','OTRAS CUENTAS POR PAGAR'],
  '2.1.01.04': ['PASIVO','PASIVO CIRCULANTE','DIRECTORES','DIRECTORES'],
  '2.1.02.01': ['PASIVO','PASIVO CIRCULANTE','RET. Y APORTES POR ENTERAR','RETENCIONES E IMPUESTOS POR ENTERAR'],
  '2.1.02.02': ['PASIVO','PASIVO CIRCULANTE','RET. Y APORTES POR ENTERAR','CONTRIBUYENTE I.V.A.'],
  '2.1.02.03': ['PASIVO','PASIVO CIRCULANTE','RET. Y APORTES POR ENTERAR','IMPUESTOS REGIONALES Y APORTES'],
  '2.1.03.01': ['PASIVO','PASIVO CIRCULANTE','PASIVOS LABORALES','PASIVOS NOMINALES'],
  '2.2.02.01': ['PASIVO','PASIVO A LARGO PLAZO','APARTADOS','APARTADOS'],
  '2.2.03.01': ['PASIVO','DIFERIDOS','DIFERIDOS','DIFERIDOS'],
  '3.1.01.01': ['PATRIMONIO','CAPITAL SOCIAL','CAPITAL SOCIAL','CAPITAL SOCIAL'],
  '3.1.03.01': ['PATRIMONIO','UTILIDADES NO DISTRIBUIDAS','UTILIDADES NO DISTRIBUIDAS','UTILIDADES NO DISTRIBUIDAS'],
  '3.1.05.01': ['PATRIMONIO','RESULTADO DEL EJERCICIO','RESULTADO DEL EJERCICIO','RESULTADO DEL EJERCICIO'],
};

const AF_CATEGORY_MAP_BY_CODE = {
  '1.1.06.01.001': 'INMUEBLE (GALPON)',
  '1.1.06.01.002': 'INMUEBLE (GALPON)',
  '1.1.06.01.003': 'MAQUINARIAS Y EQUIPOS',
  '1.1.06.01.004': 'MAQUINARIAS Y EQUIPOS',
  '1.1.06.01.005': 'EQUIPOS DE COMPUTACIÓN',
  '1.1.06.01.006': 'EQUIPOS DE COMPUTACIÓN',
  '1.1.06.01.007': 'EQUIPOS DE COMPUTACIÓN',
  '1.1.06.01.008': 'VEHÍCULOS',
  '1.1.06.01.009': 'VEHÍCULOS',
  '1.1.06.01.010': 'VEHÍCULOS',
  '1.1.06.01.011': 'VEHÍCULOS',
  '1.1.06.01.012': 'MOBILIARIO',
  '1.1.06.01.013': 'MOBILIARIO',
  '1.1.06.01.014': 'MOBILIARIO',
  '1.1.06.01.015': 'MOBILIARIO',
  '1.1.06.01.016': 'MOBILIARIO',
  '1.1.06.01.017': 'PLANTA ELÉCTRICA',
  '1.1.06.01.018': 'PLANTA ELÉCTRICA',
};

function BalanceGeneralView({ onBack, dbData, auxByMonth, afByMonth, auxDataConfig, activosFijosData, tasaByMonth = {}, onSaveTasa }) {
  const availableMonths = useMemo(() => {
    const MORD_B = {Enero:1,Febrero:2,Marzo:3,Abril:4,Mayo:5,Junio:6,Julio:7,Agosto:8,Septiembre:9,Octubre:10,Noviembre:11,Diciembre:12};
    const months = new Set();

    dbData.forEach(d => {
      if (d.month && d.month !== 'Sin Mes') {
        const isBalRec = /^[123]/.test(d.name) ||
          (d.path||'').toUpperCase().includes('ACTIV') ||
          (d.path||'').toUpperCase().includes('PASIV') ||
          (d.path||'').toUpperCase().includes('PATRIMON');
        if (isBalRec) months.add(d.month);
      }
    });

    Object.keys(afByMonth || {}).forEach(m => {
      if (m && m !== 'Sin Mes' && afByMonth[m]?.records?.length) months.add(m);
    });

    Object.keys(tasaByMonth || {}).forEach(m => {
      if (m && m !== 'Sin Mes') {
        const hasAux = auxByMonth?.[m] && Object.values(auxByMonth[m]).some(v => Array.isArray(v) && v.length > 0);
        if (hasAux) months.add(m);
      }
    });

    return [...months].filter(Boolean).sort((a, b) => {
      if (a === 'Saldos Iniciales') return -1;
      if (b === 'Saldos Iniciales') return 1;
      return (MORD_B[a] || 99) - (MORD_B[b] || 99);
    });
  }, [dbData, afByMonth, auxByMonth, tasaByMonth]);
  const [selectedMonth, setSelectedMonth] = useState(() => availableMonths[availableMonths.length - 1] || '');
  useEffect(() => {
    if (availableMonths.length > 0) {
      setSelectedMonth(prev => {
        if (!prev || !availableMonths.includes(prev)) return availableMonths[availableMonths.length - 1];
        return prev;
      });
    }
  }, [availableMonths]);
  const [defaultOpen, setDefaultOpen] = useState(false);
  const [expandKey, setExpandKey] = useState(0);
  const [activeCode, setActiveCode] = useState(null);
  const [tasa, setTasaLocal] = useState(() => tasaByMonth[availableMonths[availableMonths.length-1] || ''] || 90);
  const handleTasaChange = (v) => { setTasaLocal(v); if(onSaveTasa && selectedMonth) onSaveTasa(selectedMonth, v); };
  useEffect(() => {
    if (selectedMonth) {
      const saved = tasaByMonth[selectedMonth];
      if (saved) setTasaLocal(saved);
    }
  }, [selectedMonth, tasaByMonth]);
  const [highlightedAccounts, setHighlightedAccounts] = useState(() => new Set());
  const [currency, setCurrency] = useState('both');
  const displayMonths = useMemo(() => {
    const hasSI    = availableMonths.includes('Saldos Iniciales');
    const hasAbril = availableMonths.includes('Abril');
    if (hasSI && hasAbril) return availableMonths.filter(m => m !== 'Saldos Iniciales');
    return availableMonths;
  }, [availableMonths]);
  const monthLabel = (m) => m === 'Saldos Iniciales' ? 'Abril' : m;

  const currentAux = (() => {
    const hasData = (obj) => obj && Object.values(obj).some(v => Array.isArray(v) && v.length > 0);
    if (hasData(auxByMonth?.[selectedMonth])) return auxByMonth[selectedMonth];
    if (hasData(auxDataConfig)) return auxDataConfig;
    if (selectedMonth === 'Saldos Iniciales' && auxByMonth && Object.keys(auxByMonth).length > 0) {
      const MORD_A = {Enero:1,Febrero:2,Marzo:3,Abril:4,Mayo:5,Junio:6,Julio:7,Agosto:8,Septiembre:9,Octubre:10,Noviembre:11,Diciembre:12};
      const sorted = Object.entries(auxByMonth).filter(([,v]) => hasData(v))
        .sort((a,b) => (MORD_A[b[0]]||0) - (MORD_A[a[0]]||0));
      if (sorted.length > 0) return sorted[0][1];
    }
    if (auxByMonth && Object.keys(auxByMonth).length > 0) {
      const MORD_A = {Enero:1,Febrero:2,Marzo:3,Abril:4,Mayo:5,Junio:6,Julio:7,Agosto:8,Septiembre:9,Octubre:10,Noviembre:11,Diciembre:12};
      const mesNum = MORD_A[selectedMonth] || 99;
      const cands = Object.entries(auxByMonth).filter(([m,v]) => hasData(v) && (MORD_A[m]||99) <= mesNum)
        .sort((a,b) => (MORD_A[b[0]]||0) - (MORD_A[a[0]]||0));
      if (cands.length > 0) return cands[0][1];
      const any = Object.entries(auxByMonth).filter(([,v]) => hasData(v))
        .sort((a,b) => (MORD_A[b[0]]||0) - (MORD_A[a[0]]||0));
      if (any.length > 0) return any[0][1];
    }
    return {};
  })();
  const currentAF  = (() => {
    const MORD2 = {Enero:1,Febrero:2,Marzo:3,Abril:4,Mayo:5,Junio:6,Julio:7,Agosto:8,Septiembre:9,Octubre:10,Noviembre:11,Diciembre:12};
    if (afByMonth?.[selectedMonth]?.records?.length) return afByMonth[selectedMonth];
    if (activosFijosData?.records?.length) return activosFijosData;
    if (afByMonth && Object.keys(afByMonth).length > 0) {
      const entries = Object.entries(afByMonth).filter(([,v]) => v?.records?.length);
      if (!entries.length) return {records:[]};
      if (selectedMonth === 'Saldos Iniciales' || selectedMonth === 'Abril') {
        return entries.sort((a,b) => (MORD2[a[0]]||99) - (MORD2[b[0]]||99))[0][1];
      }
      const mesNum = MORD2[selectedMonth] || 99;
      const cands = entries.filter(([m]) => (MORD2[m]||99) <= mesNum)
        .sort((a,b) => (MORD2[b[0]]||0) - (MORD2[a[0]]||0));
      return (cands.length > 0 ? cands[0] : entries.sort((a,b)=>(MORD2[b[0]]||0)-(MORD2[a[0]]||0))[0])[1];
    }
    return {records:[]};
  })();

  const MORD = {'Saldos Iniciales':0,Enero:1,Febrero:2,Marzo:3,Abril:4,Mayo:5,Junio:6,Julio:7,Agosto:8,Septiembre:9,Octubre:10,Noviembre:11,Diciembre:12};

  const tree = useMemo(() => {
    const root = [];
    const exactData = dbData.filter(d => d.month === selectedMonth);
    const siData    = dbData.filter(d => d.month === 'Saldos Iniciales');
    let monthData;
    if ((selectedMonth === 'Abril' || selectedMonth === 'Saldos Iniciales') && siData.length > 0) {
      if (selectedMonth === 'Saldos Iniciales') {
        monthData = siData;
      } else {
        const exactNames = new Set(exactData.map(d => (d.name||'').toUpperCase().trim()));
        const siSupplement = siData.filter(d => !exactNames.has((d.name||'').toUpperCase().trim()));
        monthData = [...exactData, ...siSupplement];
      }
    } else {
      monthData = exactData;
    }
    const normKey = s => s.trim().replace(/\s+/g,' ').toUpperCase();

    const insertLeaf = (pathArray, name, usdVal, bsVal) => {
      let cur = root;
      pathArray.forEach(folderName => {
        const key = normKey(folderName);
        let folder = cur.find(n => normKey(n.n) === key);
        if (!folder) { folder = { n: folderName, c: [], u: 0, b: 0 }; cur.push(folder); }
        cur = folder.c;
      });
      const leafKey = normKey(name);
      const leaf = cur.find(n => normKey(n.n) === leafKey && n.isLeaf);
      if (!leaf) cur.push({ n: name.trim(), u: usdVal, b: bsVal, isLeaf: true });
      else { leaf.u += usdVal; leaf.b += bsVal; }
    };

    const hasAFAuxiliar = !!(currentAF?.records?.length);

    monthData.forEach(item => {
      const fullCodeMatch = item.name.match(/^(\d+\.\d+\.\d+\.\d+\.\d+)/);
      if (!fullCodeMatch) return;
      const fullCode = fullCodeMatch[1];
      const prefix   = fullCode.substring(0, fullCode.lastIndexOf('.'));
      const isDepAcum = /DEP.*ACUM|ACUMULAD/i.test(item.name);
      const isAF = fullCode.startsWith('1.1.06');

      if (isAF) {
        if (hasAFAuxiliar) return;
        const category = AF_CATEGORY_MAP_BY_CODE[fullCode] || 'PROPIEDAD, PLANTA Y EQUIPOS';
        const afPath = ['ACTIVOS','ACTIVO CIRCULANTE','PROPIEDAD, PLANTA Y EQUIPOS', category];
        let usdV, bsV;
        if (isDepAcum) {
          bsV  = -Math.abs(item.bs  || 0);
          usdV = tasa > 0 ? bsV / tasa : 0;
        } else {
          usdV = item.usd || 0;
          bsV  = item.bs  || (usdV * tasa);
        }
        insertLeaf(afPath, item.name, usdV, bsV);
        return;
      }

      const canonPath = BALANCE_ACCOUNT_PATH[prefix];
      if (!canonPath) return;

      let usdV, bsV;

      if (fullCode === '3.1.03.01.002') {
        usdV = Math.abs(item.usd ?? 0);
        bsV  = Math.abs(item.bs  ?? 0);
      } else {
        usdV = (item.usd != null) ? item.usd : (item.bs ? item.bs / tasa : 0);
        bsV  = (item.bs  != null && item.bs !== 0) ? item.bs : (item.usd ? item.usd * tasa : 0);

        const isContraAccount = /DEP.*ACUM/i.test(item.name);
        if (isContraAccount) {
          usdV = -Math.abs(usdV);
          bsV  = -Math.abs(bsV);
        } else {
          usdV = Math.abs(usdV);
          bsV  = Math.abs(bsV);
        }
      }

      insertLeaf(canonPath, item.name, usdV, bsV);
    });

    {
      Object.entries(ACCOUNT_MAPS).forEach(([code, info]) => {
        const allRecords = currentAux?.[info.type] || [];
        const forThisCode = allRecords.filter(d => (d.cuentaContable||'').trim().startsWith(code));
        const isSharedBucket = Object.values(ACCOUNT_MAPS).filter(m => m.type === info.type).length > 1;
        const records = forThisCode.length > 0 ? forThisCode : (isSharedBucket ? [] : allRecords);
        const total = records.reduce((s, r) => s + r.monto, 0);
        if (total === 0) return;
        const prefixMatch = code.match(/^(\d+\.\d+\.\d+\.\d+)/);
        if (!prefixMatch) return;
        const canonPath = BALANCE_ACCOUNT_PATH[prefixMatch[1]];
        if (!canonPath) return;
        const leafName = `${code}-${info.label}`;
        let cur = root; let ok = true;
        for (const f of canonPath) { const node = cur?.find(n => normKey(n.n) === normKey(f)); if (!node) { ok = false; break; } cur = node.c; }
        if (ok) { const i = cur.findIndex(n => normKey(n.n)===normKey(leafName)&&n.isLeaf); if (i!==-1) cur.splice(i,1); }
        insertLeaf(canonPath, leafName, total, total * tasa);
      });

      if (currentAF?.records?.length) {
        const getRubroBalance = (r) => {
          const s = ((r.cuenta||'')+(r.descripcion||'')).toUpperCase();
          if (s.includes('VEHICUL')||s.includes('CAMION')||s.includes('CARRO')) return 'VEHÍCULOS';
          if (s.includes('GALPON')||s.includes('INMUEBLE')||s.includes('LOCAL')) return 'INMUEBLE (GALPON)';
          if (s.includes('COMPUT')||s.includes('LAPTOP')||s.includes('MONITOR')||s.includes('IMPRES')) return 'EQUIPOS DE COMPUTACIÓN';
          if (s.includes('MOBIL')||s.includes('ESCRITORIO')||s.includes('SILLA')||s.includes('MUEBLE')) return 'MOBILIARIO';
          if (s.includes('PLANTA')||s.includes('ELECTRIC')||s.includes('GENERA')) return 'PLANTA ELÉCTRICA';
          if (s.includes('MONTACAR')) return 'MAQUINARIAS Y EQUIPOS';
          return 'MAQUINARIAS Y EQUIPOS';
        };
        const AF_COSTO_LABEL = {
          'INMUEBLE (GALPON)':      '1.1.06.01.001-INMUEBLE (GALPON)',
          'MOBILIARIO':             '1.1.06.01.012-MOBILIARIO Y EQUIPO',
          'MAQUINARIAS Y EQUIPOS':  '1.1.06.01.003-MAQUINARIAS Y EQUIPOS',
          'EQUIPOS DE COMPUTACIÓN': '1.1.06.01.005-EQUIPOS DE COMPUTACIÓN',
          'VEHÍCULOS':              '1.1.06.01.008-VEHÍCULOS',
          'PLANTA ELÉCTRICA':       '1.1.06.01.017-PLANTA ELÉCTRICA',
        };
        const AF_DEP_LABEL = {
          'INMUEBLE (GALPON)':      '1.1.06.01.002-DEP. ACUMULADA MEJORAS AL INMUEBLE (GALPON)',
          'MOBILIARIO':             '1.1.06.01.013-DEP. ACUMULADA MOBILIARIO',
          'MAQUINARIAS Y EQUIPOS':  '1.1.06.01.004-DEP. ACUMULADA MAQUINARIA Y EQUIPOS',
          'EQUIPOS DE COMPUTACIÓN': '1.1.06.01.007-DEP. ACUMULADA EQUIPOS DE COMPUTACIÓN',
          'VEHÍCULOS':              '1.1.06.01.009-DEP. ACUMULADA VEHÍCULOS',
          'PLANTA ELÉCTRICA':       '1.1.06.01.017-DEP. ACUMULADA PLANTA ELECTRICA',
        };
        const costoByRubro = {}, depByAccount = {};
        currentAF.records.forEach(r => {
          const rubro = getRubroBalance(r);
          if (!costoByRubro[rubro]) costoByRubro[rubro] = { usd: 0, bs: 0 };
          costoByRubro[rubro].usd += r.costoUSD || 0;
          costoByRubro[rubro].bs  += r.costoBS  || 0;
          const depActualUSD = r.depAcum || 0;
          if (depActualUSD > 0) {
            const ctaHaber = AF_DEP_LABEL[rubro] || `DEP. ACUMULADA ${rubro}`;
            if (!depByAccount[ctaHaber]) depByAccount[ctaHaber] = { usd: 0, rubro };
            depByAccount[ctaHaber].usd += depActualUSD;
          }
        });
        const PPE_PATH = ['ACTIVOS','ACTIVO CIRCULANTE','PROPIEDAD, PLANTA Y EQUIPOS'];
        Object.entries(costoByRubro).forEach(([rubro, v]) => {
          if (v.usd > 0) insertLeaf([...PPE_PATH, rubro], AF_COSTO_LABEL[rubro]||rubro, v.usd, v.usd * tasa);
        });
        Object.entries(depByAccount).forEach(([ctaLabel, info]) => {
          insertLeaf([...PPE_PATH, info.rubro], ctaLabel, -info.usd, -(info.usd * tasa));
        });
      }
    }

    const compute = (nodes) => {
      let u=0, b=0;
      nodes.forEach(n => {
        if (!n.isLeaf && n.c?.length) { const t = compute(n.c); n.u = t.u; n.b = t.b; }
        u += n.u; b += n.b;
      });
      return {u, b};
    };
    compute(root);

    {
      const hayPatrim = root.some(n => n.n.toUpperCase().includes('PATRIM'));
      if (hayPatrim) {
        let _aU = 0, _pU = 0, _aB = 0, _pB = 0;
        root.forEach(n => { if (n.n.toUpperCase().includes('ACTIV')) { _aU += n.u; _aB += n.b; } else { _pU += Math.abs(n.u); _pB += Math.abs(n.b); } });
        const _rU = _aU - _pU, _rB = _aB - _pB;
        if (Math.abs(_rU) > 0.005 || Math.abs(_rB) > 0.005) {
          const _find = (nodes) => { for (const n of nodes) { if (n.isLeaf && /^3\.1\.03\.01\.002/.test(n.n)) return n; if (n.c && n.c.length) { const f = _find(n.c); if (f) return f; } } return null; };
          let _leaf = _find(root);
          if (!_leaf) { insertLeaf(['PATRIMONIO','UTILIDADES NO DISTRIBUIDAS','UTILIDADES NO DISTRIBUIDAS','UTILIDADES NO DISTRIBUIDAS'], '3.1.03.01.002-(UTILIDAD) PÉRDIDA ACUMULADA', 0, 0); _leaf = _find(root); }
          if (_leaf) { _leaf.u += _rU; _leaf.b += _rB; compute(root); }
        }
      }
    }

    root.sort((a, b) => {
      const o = n => { const u=n.toUpperCase(); return u.includes('ACTIV')?1:u.includes('PASIV')?2:u.includes('PATRIM')?3:4; };
      return o(a.n) - o(b.n);
    });
    root.forEach(cat => { if (cat.c && cat.c.length) sortTreeNodes(cat.c); });

    return root;
  }, [dbData, selectedMonth, tasa, auxDataConfig, activosFijosData]);

  let totalActivos = 0; let totalPasPat = 0;
  let totalActivos_bs = 0; let totalPasPat_bs = 0;
  tree.forEach(n => {
    if (n.n.toUpperCase().includes('ACTIV')) {
      totalActivos    += n.u;
      totalActivos_bs += n.b;
    } else {
      totalPasPat    += Math.abs(n.u);
      totalPasPat_bs += Math.abs(n.b);
    }
  });
  const balanceDiff    = totalActivos - totalPasPat;
  const balanceDiff_bs = totalActivos_bs - totalPasPat_bs;
  const fmtR  = (v) => new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Math.abs(v));
  const fmtRs = (v) => new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);
  const [openNodes, setOpenNodes] = useState(() => new Set());
  const toggleOpen = (label) => setOpenNodes(p => { const s=new Set(p); if(s.has(label))s.delete(label); else s.add(label); return s; });
  const [openNodeMap, setOpenNodeMap] = useState(() => ({}));
  const reportNodeOpen = (label, isOpen) => setOpenNodeMap(p => ({...p, [label.trim().toUpperCase()]: isOpen}));
  const getOpenSet = () => defaultOpen ? null : new Set(Object.entries(openNodeMap).filter(([,v])=>v).map(([k])=>k));

  const handlePrintBalance = () => {
    const fmtP = (v) => new Intl.NumberFormat('es-VE',{minimumFractionDigits:2,maximumFractionDigits:2}).format(Math.abs(v||0));
    const showUSD = currency !== 'bs'; const showBS = currency !== 'usd';
    const cols = ['Cuenta', ...(showUSD?['USD']:[]), ...(showBS?['Bs.']:[]), '%'].map(c=>`<th>${c}</th>`).join('');
    const openStates = getOpenSet();
    const buildRows = (nodes, lvl=0) => nodes.map(n => {
      const indent = '&nbsp;'.repeat(lvl*4);
      const isAccountNode = /^\d\./.test(n.n) || (!n.c || n.c.length === 0);

      if (!n.isLeaf && n.c?.length) {
        if (!isAccountNode) {
          const childRows = buildRows(n.c, lvl+1);
          return `<tr class="section"><td>${indent}${n.n}</td>${showUSD?'<td></td>':''}${showBS?'<td></td>':''}<td></td></tr>${childRows}<tr class="total"><td>${indent}TOTAL ${n.n}</td>${showUSD?`<td>${fmtP(n.u)}</td>`:''}${showBS?`<td>${fmtP(n.b)}</td>`:''}<td></td></tr>`;
        } else {
          const isOpen = !openStates || openStates.has(n.n.trim().toUpperCase());
          let html = `<tr><td>${indent}${n.n}</td>${showUSD?`<td>${fmtP(n.u)}</td>`:''}${showBS?`<td>${fmtP(n.b)}</td>`:''}<td></td></tr>`;
          if (isOpen) {
            html += buildRows(n.c, lvl+1);
            html += `<tr class="total"><td>${indent}TOTAL ${n.n}</td>${showUSD?`<td>${fmtP(n.u)}</td>`:''}${showBS?`<td>${fmtP(n.b)}</td>`:''}<td></td></tr>`;
          }
          return html;
        }
      }
      return `<tr><td>${indent}${n.n}</td>${showUSD?`<td>${fmtP(n.u)}</td>`:''}${showBS?`<td>${fmtP(n.b)}</td>`:''}<td></td></tr>`;
    }).join('');
    const content = `<table><thead><tr>${cols}</tr></thead><tbody>${buildRows(tree)}<tr class="grand-total"><td>TOTAL PASIVO Y PATRIMONIO</td>${showUSD?`<td>${fmtP(-totalPasPat)}</td>`:''}${showBS?'<td></td>':''}<td></td></tr><tr class="grand-total"><td>TOTAL ACTIVOS</td>${showUSD?`<td>${fmtP(totalActivos)}</td>`:''}${showBS?'<td></td>':''}<td></td></tr><tr class="grand-total" style="background:${Math.abs(balanceDiff)<0.01?'#006622':'#990000'}"><td>ACTIVO − (PASIVO+PATRIMONIO)</td>${showUSD?`<td>${fmtP(balanceDiff)}</td>`:''}${showBS?'<td></td>':''}<td>${Math.abs(balanceDiff)<0.01?'✓ CUADRADO':''}</td></tr></tbody></table>`;
    printReport(`<h1>Balance de Situación Financiera</h1><h2>Corte: ${monthLabel(selectedMonth)} | Tasa: ${tasa} Bs/USD</h2>`, content);
  };

  if (activeCode) return <AuxiliarReportView accountCode={activeCode} onBack={() => setActiveCode(null)} auxDataConfig={currentAux} />;

  return (
    <div className="min-h-screen" style={{background:'#f3f2ef',backgroundImage:'radial-gradient(circle,#c8c8c8 1px,transparent 1px)',backgroundSize:'22px 22px'}}>
      <header className="bg-[#111111] border-b-4 border-orange-500 px-6 py-3 flex justify-between items-center sticky top-0 z-30 shadow-lg flex-wrap gap-2">
        <div className="flex items-center gap-4 flex-wrap">
          <button onClick={onBack} className="flex items-center gap-2 font-black text-xs text-slate-400 uppercase hover:text-orange-400"><ArrowLeft size={16}/> Panel</button>
          {availableMonths.length > 0 && (
            <div className="border-l-2 border-slate-700 pl-4 flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Corte:</span>
              <select value={selectedMonth} onChange={e=>setSelectedMonth(e.target.value)} className="bg-orange-500/10 border border-orange-500/40 text-orange-300 text-xs rounded-lg p-1.5 font-bold uppercase cursor-pointer outline-none">
                {displayMonths.map(m => <option key={m} value={m}>{monthLabel(m).toUpperCase()}</option>)}
              </select>
            </div>
          )}
          <div className="border-l-2 border-slate-700 pl-4 flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Tasa Bs/USD:</span>
            <input type="number" min="1" step="0.01" value={tasa} onChange={e=>handleTasaChange(parseFloat(e.target.value)||1)} className="bg-amber-500/10 border border-amber-500/40 text-amber-300 text-xs rounded-lg p-1.5 w-24 font-black outline-none"/>
          </div>
          <div className="flex gap-1 bg-slate-800 p-1 rounded-lg border border-slate-700">
            {[['both','USD + Bs'],['usd','Solo USD'],['bs','Solo Bs']].map(([v,lbl])=>(
              <button key={v} onClick={()=>setCurrency(v)} className={`px-3 py-1.5 rounded text-[10px] font-black uppercase transition-colors ${currency===v?'bg-orange-500 text-white':'text-slate-400 hover:text-white hover:bg-slate-700'}`}>{lbl}</button>
            ))}
          </div>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          <div className="flex gap-1 bg-slate-800 p-1 rounded-lg border border-slate-700">
            <button onClick={()=>{setDefaultOpen(true);setExpandKey(k=>k+1);}} className="px-3 py-1.5 rounded text-[10px] font-black uppercase flex items-center gap-1 text-slate-300 hover:bg-slate-700 hover:text-white"><ChevronDown size={14}/> Expandir</button>
            <button onClick={()=>{setDefaultOpen(false);setExpandKey(k=>k+1);}} className="px-3 py-1.5 rounded text-[10px] font-black uppercase flex items-center gap-1 text-slate-300 hover:bg-slate-700 hover:text-white"><ChevronRight size={14}/> Contraer</button>
          </div>
          <button onClick={() => exportBalanceExcel(tree, monthLabel(selectedMonth), tasa, totalActivos, totalPasPat, balanceDiff, getOpenSet(), currency)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest shadow-md transition-colors">
            <FileSpreadsheet size={13}/> Excel
          </button>
          <button onClick={handlePrintBalance}
            className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-3 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest shadow-md transition-colors">
            <FileText size={13}/> PDF
          </button>
        </div>
      </header>
      <main className="p-4 md:p-8 max-w-6xl mx-auto pb-16">
        <div className="bg-white px-8 py-8 border-t-4 border-orange-500 shadow-md flex flex-col items-center text-center mb-6 rounded-b-2xl">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500 mb-1">Servicios Jiret G&B, C.A.</p>
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-1">Balance de Situación Financiera</h1>
          <p className="text-orange-600 font-black uppercase bg-orange-50 px-5 py-1.5 rounded-full text-[10px] border border-orange-200 mt-2">
            Corte: {monthLabel(selectedMonth) || 'Sin datos'} {tasa > 1 ? `· Tasa: ${tasa} Bs/USD` : ''}
          </p>
        </div>
        {dbData.length === 0 || tree.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-xl border border-slate-200"><AlertTriangle className="mx-auto text-orange-400 mb-4" size={48}/><p className="text-slate-500 font-black text-xs uppercase">No se detectaron cuentas de Balance.</p></div>
        ) : (
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
            <table className="w-full text-left border-collapse">
              <thead className="bg-[#111111] text-[10px] uppercase font-black text-slate-300">
                <tr>
                  <th className="px-4 py-5 w-[55%]">Estructura</th>
                  {currency !== 'bs'  && <th className="px-3 py-5 text-right text-orange-300">USD</th>}
                  {currency !== 'usd' && <th className="px-3 py-5 text-right text-amber-300 hidden sm:table-cell">Bs.</th>}
                  <th className="px-3 py-5 text-right text-slate-400">%</th>
                </tr>
              </thead>
              <tbody key={expandKey}>
                {tree.map((node, i) => <ExpandableRow key={i} node={node} totalBaseUSD={totalActivos} defaultOpen={defaultOpen} highlightedAccounts={highlightedAccounts} toggleHighlight={a=>{setHighlightedAccounts(p=>{const s=new Set(p);if(s.has(a))s.delete(a);else s.add(a);return s;})}} onShowReport={setActiveCode} isBalance={true} currency={currency} onToggle={reportNodeOpen}/>)}
                <tr className="bg-slate-100 border-t-2 border-slate-300">
                  <td className="px-4 py-3 font-black text-xs uppercase text-slate-700 tracking-wider pl-6">TOTAL PASIVO Y PATRIMONIO</td>
                  {currency !== 'bs'  && <td className="px-3 py-3 text-right font-mono font-black text-sm text-slate-900">{fmtR(-totalPasPat)}</td>}
                  {currency !== 'usd' && <td className="px-3 py-3 text-right font-mono font-black text-sm text-amber-700 hidden sm:table-cell">Bs. {fmtR(-totalPasPat_bs)}</td>}
                  <td/>
                </tr>
                <tr className="bg-[#111111] text-white font-black border-t-4 border-orange-500">
                  <td colSpan={currency==='both'?4:3} className="p-5">
                    <div className="flex flex-wrap justify-between items-center px-2 gap-4">
                      <div className="flex items-center gap-3">
                        <Scale size={28} className="text-orange-400"/>
                        <div>
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">Ecuación Patrimonial</p>
                          <p className="text-xs font-black tracking-widest">ACTIVOS = PASIVOS + PATRIMONIO</p>
                        </div>
                      </div>
                      <div className="flex gap-5 text-right flex-wrap">
                        <div>
                          <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">Total Activos</p>
                          {currency !== 'bs'  && <p className="text-lg font-mono text-orange-400">USD {fmtR(totalActivos)}</p>}
                          {currency !== 'usd' && <p className="text-sm font-mono text-amber-300">Bs. {fmtR(totalActivos_bs)}</p>}
                        </div>
                        <div>
                          <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">Pasivo + Patrimonio</p>
                          {currency !== 'bs'  && <p className="text-lg font-mono text-amber-400">USD {fmtR(-totalPasPat)}</p>}
                          {currency !== 'usd' && <p className="text-sm font-mono text-amber-300">Bs. {fmtR(-totalPasPat_bs)}</p>}
                        </div>
                        <div>
                          <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">DIFERENCIA</p>
                          {currency !== 'bs' && <p className={`text-lg font-mono font-black ${Math.abs(balanceDiff) < 0.01 ? 'text-emerald-400' : 'text-red-400'}`}>
                            USD {new Intl.NumberFormat('es-VE',{minimumFractionDigits:2,maximumFractionDigits:2}).format(Math.abs(balanceDiff))}
                            {Math.abs(balanceDiff) < 0.01 && <span className="ml-2 text-[10px]">✓ CUADRADO</span>}
                          </p>}
                          {currency !== 'usd' && <p className={`text-sm font-mono font-black ${Math.abs(balanceDiff_bs) < 1 ? 'text-emerald-400' : 'text-red-400'}`}>
                            Bs. {new Intl.NumberFormat('es-VE',{minimumFractionDigits:2,maximumFractionDigits:2}).format(Math.abs(balanceDiff_bs))}
                          </p>}
                        </div>
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
// 8. VISTA: ACTIVOS FIJOS (Valores en Bs — Tasa Histórica)
// ============================================================================
const getRubro = (r) => {
  const s = ((r.cuenta||'')+(r.descripcion||'')).toUpperCase();
  if (s.includes('HERRAMIENTA')) return 'HERRAMIENTAS MENORES';
  if (s.includes('VEHICUL')||s.includes('CAMION')||s.includes('CARRO')||s.includes('MOTO')) return 'VEHÍCULOS';
  if (s.includes('PLANTA ELECTR')||s.includes('PLANTA ELEC')||s.includes('GENERATOR')||s.includes('GENERADOR')) return 'PLANTA ELÉCTRICA';
  if (s.includes('GALPON')||s.includes('GALPÓN')||s.includes('INMUEBLE')||s.includes('LOCAL')||s.includes('MEJORA')||s.includes('EDIFICIO')||s.includes('TERRENO')) return 'GALPÓN E INMUEBLES';
  if (s.includes('COMPUT')||s.includes('LAPTOP')||s.includes('MONITOR')||s.includes('IMPRES')||s.includes('TELECO')||s.includes('TELEFON')||s.includes('SERVER')||s.includes('RED ')||s.includes('SWITCH')||s.includes('ROUTER')||s.includes('SCANER')) return 'EQUIPOS DE COMPUTACIÓN Y TELECOMUNICACIONES';
  if (s.includes('MAQUINAR')||s.includes('TORNO')||s.includes('PRENSA')||s.includes('SOLDAD')||s.includes('COMPRESOR')||s.includes('BOMBA')) return 'MAQUINARIA Y EQUIPOS';
  if (s.includes('MOBIL')||s.includes('ESCRITORIO')||s.includes('SILLA')||s.includes('MUEBLE')||s.includes('ESTANTE')||s.includes('ARCHIV')||s.includes('VITRINA')||s.includes('MOSTRADOR')) return 'MOBILIARIO Y EQUIPO DE OFICINA';
  return 'MAQUINARIA Y EQUIPOS';
};
const MONTH_NUM = {Enero:1,Febrero:2,Marzo:3,Abril:4,Mayo:5,Junio:6,Julio:7,Agosto:8,Septiembre:9,Octubre:10,Noviembre:11,Diciembre:12};
const BASE_MONTH = 4;

function InversionesView({ onBack, activosFijosData, setActivosFijosData }) {
  const records = activosFijosData?.records || [];
  const [search, setSearch] = useState('');
  const [filterSede, setFilterSede] = useState('all');
  const [filterRubro, setFilterRubro] = useState('all');
  const [mesCorte, setMesCorte] = useState('Abril');
  const [editIdx, setEditIdx] = useState(null);
  const [editData, setEditData] = useState(null);
  const [showAsiento, setShowAsiento] = useState(false);

  const sedes = useMemo(()=>['all',...new Set(records.map(r=>r.sede).filter(s=>s&&s!=='-'))],[records]);
  const rubros = useMemo(()=>['all',...new Set(records.map(getRubro))],[records]);
  const mesesCorte = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const getTasaHist = (r) => r.tasa || (r.costoUSD ? r.costoBS / r.costoUSD : 1);
  const getDepAcumActual = (r) => r.depAcum;
  const getValorNetoActual = (r) => r.valorNeto;

  const INVALID = new Set(['CUENTA','CUENTA CONTABLE','MOBILIARIO Y EQUIPO','-','']);
  const filteredValid = useMemo(()=>{
    let rs = records.filter(r => r.costoUSD > 0 && !INVALID.has((r.cuenta||'').toUpperCase().trim()));
    if (filterSede !== 'all') rs = rs.filter(r => r.sede === filterSede);
    if (filterRubro !== 'all') rs = rs.filter(r => getRubro(r) === filterRubro);
    if (search.trim()) { const q = search.toLowerCase(); rs = rs.filter(r => r.descripcion.toLowerCase().includes(q) || r.sede.toLowerCase().includes(q)); }
    return rs;
  }, [records, search, filterSede, filterRubro]);

  const grupos = useMemo(() => {
    const m = {};
    filteredValid.forEach(r => {
      const g = getRubro(r);
      if (!m[g]) m[g] = [];
      m[g].push(r);
    });
    return m;
  }, [filteredValid]);

  const fmt = v => new Intl.NumberFormat('es-VE', {minimumFractionDigits:2,maximumFractionDigits:2}).format(v||0);

  const totalCostoUSD = filteredValid.reduce((s,r)=>s+r.costoUSD,0);
  const totalCostoBS  = filteredValid.reduce((s,r)=>s+r.costoBS,0);
  const totalDepAcum  = filteredValid.reduce((s,r)=>s+getDepAcumActual(r),0);
  const totalNeto     = filteredValid.reduce((s,r)=>s+getValorNetoActual(r),0);
  const totalMensual  = filteredValid.reduce((s,r)=>s+r.depreMensual,0);

  const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const asientosPorMes = useMemo(() => {
    const result = {};
    MESES.forEach(mes => {
      const montoPorRubro = {};
      records.filter(r => r.costoUSD > 0 && r.depreMensual > 0).forEach(r => {
        const rubro = getRubro(r);
        const depreMensualBs = r.depreMensual * (r.tasa || 1);
        montoPorRubro[rubro] = (montoPorRubro[rubro] || 0) + depreMensualBs;
      });
      const debeLines = [], haberLines = [];
      Object.entries(montoPorRubro).forEach(([rubro, totalBs]) => {
        if (totalBs <= 0) return;
        const map = RUBRO_DEPR_MAP[rubro];
        if (!map) {
          debeLines.push({ cta: `5.x.xx.xx.xxx`, nombre: `DEPRECIACIÓN ${rubro}`, montoBs: totalBs });
          haberLines.push({ cta: `1.1.06.xx.xxx`, nombre: `DEP. ACUMULADA ${rubro}`, montoBs: totalBs });
          return;
        }
        const nDebe = map.debe.length;
        map.debe.forEach(d => debeLines.push({ cta: d.cta, nombre: d.nombre, montoBs: totalBs / nDebe }));
        map.haber.forEach(h => haberLines.push({ cta: h.cta, nombre: h.nombre, montoBs: totalBs / map.haber.length }));
      });
      const totalDebe  = debeLines.reduce((s,l)=>s+l.montoBs, 0);
      const totalHaber = haberLines.reduce((s,l)=>s+l.montoBs, 0);
      result[mes] = { debeLines, haberLines, totalDebe, totalHaber };
    });
    return result;
  }, [records]);

  const exportAsientoExcel = async (mes) => {
    try {
      const XL = await loadSheetJS();
      const { debeLines, haberLines, totalDebe, totalHaber } = asientosPorMes[mes] || { debeLines:[], haberLines:[], totalDebe:0, totalHaber:0 };
      const fmtN = v => new Intl.NumberFormat('es-VE',{minimumFractionDigits:2}).format(v);
      const letterhead = [
        ['Supply G&B','','','','SERVICIOS JIRET G&B, C.A.'],
        ['','','','','RIF: J-412309374'],
        ['','','','','AV CIRCUNVALACION NRO 02 C.C EL DIVIDIVI LOCAL G-9 NIVEL PB'],
        ['','','','','SECTOR EL TREBOL MARACAIBO-ZULIA'],
        [],
        [`ASIENTO CONTABLE DE DEPRECIACIÓN — ${mes.toUpperCase()}`],
        ['(Expresado en Bs.)'],
        [],
        ['Código de Cuenta','Nombre de la Cuenta','Debe (Bs.)','Haber (Bs.)'],
      ];
      const debeRows  = debeLines.map(l  => [l.cta,  l.nombre,  fmtN(l.montoBs), '']);
      const haberRows = haberLines.map(l => [l.cta,  l.nombre,  '',              fmtN(l.montoBs)]);
      const sheetData = [...letterhead, ...debeRows, ...haberRows, [], ['TOTALES','',fmtN(totalDebe),fmtN(totalHaber)]];
      const ws = XL.utils.aoa_to_sheet(sheetData);
      ws['!cols'] = [{wch:22},{wch:50},{wch:20},{wch:20}];
      const wb = XL.utils.book_new();
      XL.utils.book_append_sheet(wb, ws, `Depreciacion ${mes}`);
      XL.writeFile(wb, `Asiento_Depreciacion_${mes}.xlsx`);
    } catch(e) { alert('Error: '+e.message); }
  };

  const openEdit = (r, globalIdx) => { setEditIdx(globalIdx); setEditData({...r}); };
  const saveEdit = () => {
    if (editIdx === null || !editData) return;
    const newRecords = [...records];
    newRecords[editIdx] = {...editData,
      costoUSD: parseFloat(editData.costoUSD)||0,
      costoBS:  parseFloat(editData.costoBS)||0,
      depAcum:  parseFloat(editData.depAcum)||0,
      valorNeto:parseFloat(editData.valorNeto)||0,
      depreMensual:parseFloat(editData.depreMensual)||0,
      tasa:     parseFloat(editData.tasa)||0,
      vidaUtilAsig: parseFloat(editData.vidaUtilAsig)||0,
      vidaUtilTrans:parseFloat(editData.vidaUtilTrans)||0,
    };
    setActivosFijosData({ records: newRecords });
    setEditIdx(null); setEditData(null);
  };
  const cancelEdit = () => { setEditIdx(null); setEditData(null); };

  const RUBRO_COLORS = {
    'VEHÍCULOS':                                 {bg:'bg-blue-600',    text:'text-blue-700',   light:'bg-blue-50'},
    'MOBILIARIO Y EQUIPO DE OFICINA':            {bg:'bg-amber-600',   text:'text-amber-700',  light:'bg-amber-50'},
    'EQUIPOS DE COMPUTACIÓN Y TELECOMUNICACIONES':{bg:'bg-sky-600',    text:'text-sky-700',    light:'bg-sky-50'},
    'HERRAMIENTAS MENORES':                      {bg:'bg-orange-600',  text:'text-orange-700', light:'bg-orange-50'},
    'MAQUINARIA Y EQUIPOS':                      {bg:'bg-purple-600',  text:'text-purple-700', light:'bg-purple-50'},
    'GALPÓN E INMUEBLES':                        {bg:'bg-emerald-700', text:'text-emerald-700',light:'bg-emerald-50'},
    'PLANTA ELÉCTRICA':                          {bg:'bg-rose-600',    text:'text-rose-600',   light:'bg-rose-50'},
    'OTROS':                                     {bg:'bg-slate-600',   text:'text-slate-600',  light:'bg-slate-50'},
  };

  if (!records.length) return (
    <div className="min-h-screen" style={{background:'#f3f2ef',backgroundImage:'radial-gradient(circle,#c8c8c8 1px,transparent 1px)',backgroundSize:'22px 22px'}}>
      <header className="bg-white border-b border-slate-200 px-4 py-3 shadow-sm">
        <button onClick={onBack} className="flex items-center gap-2 font-black text-xs text-slate-600 uppercase hover:text-orange-600"><ArrowLeft size={16}/> Volver</button>
      </header>
      <div className="max-w-xl mx-auto mt-24 text-center p-8">
        <Landmark size={48} className="text-orange-300 mx-auto mb-4"/>
        <h2 className="text-xl font-black text-slate-700 uppercase mb-2">Sin datos de Activos Fijos</h2>
        <p className="text-slate-400 text-sm">Ve a <span className="text-orange-500 font-bold">Configuración → 05</span> y carga tu auxiliar Excel.</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen" style={{background:'#f3f2ef',backgroundImage:'radial-gradient(circle,#c8c8c8 1px,transparent 1px)',backgroundSize:'22px 22px'}}>
      {editData && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={cancelEdit}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden" onClick={e=>e.stopPropagation()}>
            <div className="bg-slate-800 px-6 py-4 flex justify-between items-center">
              <div>
                <p className="text-[9px] font-black text-orange-400 uppercase tracking-widest">Editar Activo</p>
                <p className="text-white font-black text-sm truncate">{editData.descripcion}</p>
              </div>
              <button onClick={cancelEdit} className="text-slate-400 hover:text-white text-xl leading-none">✕</button>
            </div>
            <div className="p-6 grid grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto">
              {[
                {label:'Descripción (MOBILIARIO Y EQUIPO)', key:'descripcion', type:'text', full:true},
                {label:'Sede', key:'sede', type:'text'},
                {label:'Fecha de Adquisición', key:'fechaAdq', type:'text'},
                {label:'Vida Útil Asignada (meses)', key:'vidaUtilAsig', type:'number'},
                {label:'Vida Útil Transcurrida (meses)', key:'vidaUtilTrans', type:'number'},
                {label:'Costo Adq. USD', key:'costoUSD', type:'number'},
                {label:'Costo Adq. Bs.', key:'costoBS', type:'number'},
                {label:'DEP.ACUM (USD)', key:'depAcum', type:'number'},
                {label:'Valor Neto Libros (USD)', key:'valorNeto', type:'number'},
                {label:'Dep. Mensual (USD)', key:'depreMensual', type:'number'},
                {label:'Tasa histórica', key:'tasa', type:'number'},
              ].map(f=>(
                <div key={f.key} className={f.full ? 'col-span-2' : ''}>
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">{f.label}</label>
                  <input
                    type={f.type}
                    value={editData[f.key]||''}
                    onChange={e=>setEditData(p=>({...p,[f.key]:e.target.value}))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 outline-none focus:border-orange-400 bg-slate-50"
                  />
                </div>
              ))}
            </div>
            <div className="px-6 py-4 bg-slate-50 flex justify-end gap-3 border-t border-slate-200">
              <button onClick={cancelEdit} className="px-5 py-2 rounded-lg text-xs font-black uppercase text-slate-500 hover:bg-slate-100 border border-slate-200">Cancelar</button>
              <button onClick={saveEdit} className="px-6 py-2 rounded-lg text-xs font-black uppercase bg-orange-500 hover:bg-orange-600 text-white shadow-md">Guardar Cambios</button>
            </div>
          </div>
        </div>
      )}

      <header className="bg-white border-b border-slate-200 px-4 py-3 flex flex-wrap justify-between items-center gap-3 sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="flex items-center gap-2 font-black text-xs text-slate-600 uppercase hover:text-orange-600"><ArrowLeft size={16}/> Volver al Panel</button>
          <span className="text-slate-300">|</span>
          <span className="font-black text-xs text-slate-700 uppercase flex items-center gap-1.5"><Landmark size={13} className="text-orange-500"/> Activos Fijos</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative"><Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar activo..." className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none w-36"/>
          </div>
          <select value={filterRubro} onChange={e=>setFilterRubro(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs font-bold outline-none">
            {rubros.map(s=><option key={s} value={s}>{s==='all'?'Todos los rubros':s}</option>)}
          </select>
          <select value={filterSede} onChange={e=>setFilterSede(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs font-bold outline-none">
            {sedes.map(s=><option key={s} value={s}>{s==='all'?'Todas las sedes':s}</option>)}
          </select>
          <div className="flex items-center gap-1.5 bg-orange-50 border border-orange-200 rounded-lg px-2 py-1">
            <span className="text-[9px] font-black text-orange-500 uppercase whitespace-nowrap">Corte:</span>
            <select value={mesCorte} onChange={e=>setMesCorte(e.target.value)} className="bg-transparent text-orange-700 text-xs font-black outline-none cursor-pointer">
              {mesesCorte.map(m=><option key={m}>{m}</option>)}
            </select>
          </div>
        </div>
        <button onClick={()=>exportActivosFijosExcelGrouped(filteredValid,getRubro,'Activos_Fijos',mesCorte,getDepAcumActual,getValorNetoActual,fmt)} className="px-4 py-1.5 bg-emerald-600 text-white rounded-lg text-[10px] font-black uppercase hover:bg-emerald-700 flex items-center gap-1.5">
          <FileSpreadsheet size={13}/> Excel
        </button>
        <button onClick={() => {
          const fmtP = v => new Intl.NumberFormat('es-VE',{minimumFractionDigits:2,maximumFractionDigits:2}).format(v||0);
          const gruposPDF = {};
          filteredValid.forEach(r => {
            const g = getRubro(r);
            if (!gruposPDF[g]) gruposPDF[g] = [];
            gruposPDF[g].push(r);
          });
          const RUBRO_ORDER = ['MOBILIARIO Y EQUIPO DE OFICINA','EQUIPOS DE COMPUTACIÓN Y TELECOMUNICACIONES','HERRAMIENTAS MENORES','MAQUINARIA Y EQUIPOS','PLANTA ELÉCTRICA','GALPÓN E INMUEBLES','VEHÍCULOS'];
          const orderedRubros = RUBRO_ORDER.filter(r=>gruposPDF[r]).concat(Object.keys(gruposPDF).filter(r=>!RUBRO_ORDER.includes(r)));
          let rowsHtml = '';
          orderedRubros.forEach(rubro => {
            const items = gruposPDF[rubro];
            rowsHtml += `<tr class="section"><td colspan="12" style="font-weight:900; background:#f3f3f3; color:#E05A00; text-align:left;">${rubro.toUpperCase()}</td></tr>`;
            items.forEach(r => {
              rowsHtml += `<tr><td style="text-align:center">${r.cant}</td><td style="text-align:left">${r.descripcion}</td><td style="text-align:center">${r.sede}</td><td style="text-align:center">${r.fechaAdq||'-'}</td><td style="text-align:center">${r.vidaUtilAsig||'-'}</td><td style="text-align:center">${r.vidaUtilTrans||'-'}</td><td style="text-align:right">${fmtP(r.costoUSD)}</td><td style="text-align:right">${fmtP(r.costoBS)}</td><td style="text-align:right">${fmtP(getDepAcumActual(r))}</td><td style="text-align:right;font-weight:bold">${fmtP(getValorNetoActual(r))}</td><td style="text-align:right">${fmtP(r.depreMensual)}</td><td style="text-align:right">${fmtP(r.tasa)}</td></tr>`;
            });
            const sUSD=items.reduce((s,r)=>s+r.costoUSD,0), sBS=items.reduce((s,r)=>s+r.costoBS,0), sDA=items.reduce((s,r)=>s+getDepAcumActual(r),0), sN=items.reduce((s,r)=>s+getValorNetoActual(r),0), sM=items.reduce((s,r)=>s+r.depreMensual,0);
            rowsHtml += `<tr class="total" style="background:#f7f7f7;font-weight:900;"><td colspan="6" style="text-align:left">SUBTOTAL ${rubro}</td><td style="text-align:right">${fmtP(sUSD)}</td><td style="text-align:right">${fmtP(sBS)}</td><td style="text-align:right">${fmtP(sDA)}</td><td style="text-align:right">${fmtP(sN)}</td><td style="text-align:right">${fmtP(sM)}</td><td></td></tr>`;
          });
          const thHtml = ['Cant','Descripción','Sede','Fecha Adq.','V.U. Asig.','V.U. Trans.','Costo USD','Costo Bs.','Dep.Acum USD','Val.Neto USD','Dep.Mensual USD','Tasa'].map(h=>`<th>${h}</th>`).join('');
          printReport(
            `<h1>Registro de Activos Fijos</h1><h2>Corte: ${mesCorte}</h2>`,
            `<table><thead><tr>${thHtml}</tr></thead><tbody>${rowsHtml}<tr class="grand-total" style="background:#111;color:#fff;font-weight:900;"><td colspan="6" style="text-align:left">TOTAL GENERAL</td><td style="text-align:right;color:#fff">USD ${fmtP(totalCostoUSD)}</td><td style="text-align:right;color:#fff">Bs. ${fmtP(totalCostoBS)}</td><td style="text-align:right;color:#fff">USD ${fmtP(totalDepAcum)}</td><td style="text-align:right;color:#fff">USD ${fmtP(totalNeto)}</td><td style="text-align:right;color:#fff">USD ${fmtP(totalMensual)}</td><td></td></tr></tbody></table>`
          );
        }} className="px-4 py-1.5 bg-orange-600 text-white rounded-lg text-[10px] font-black uppercase hover:bg-orange-700 flex items-center gap-1.5 shadow-md transition-colors">
          <FileText size={13}/> PDF
        </button>
        <button onClick={()=>setShowAsiento(v=>!v)} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase flex items-center gap-1.5 border transition-colors ${showAsiento?'bg-violet-600 text-white border-violet-700':'bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100'}`}>
          <BookOpen size={13}/> Asientos Dep.
        </button>
      </header>

      <main className="p-4 md:p-6 max-w-[1700px] mx-auto pb-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
          {[
            {label:'Costo Adq. USD', val:`USD ${fmt(totalCostoUSD)}`, color:'text-blue-700', bg:'bg-blue-50 border-blue-200'},
            {label:'Costo Histórico Bs.', val:`Bs. ${fmt(totalCostoBS)}`, color:'text-slate-700', bg:'bg-white border-slate-200'},
            {label:`Dep. Acum USD (${mesCorte})`, val:`USD ${fmt(totalDepAcum)}`, color:'text-red-600', bg:'bg-red-50 border-red-200'},
            {label:'Valor Neto USD', val:`USD ${fmt(totalNeto)}`, color:'text-orange-600', bg:'bg-orange-50 border-orange-200'},
            {label:'Dep. Mensual USD', val:`USD ${fmt(totalMensual)}`, color:'text-emerald-600', bg:'bg-emerald-50 border-emerald-200'},
          ].map(k=>(
            <div key={k.label} className={`rounded-xl p-4 border ${k.bg} shadow-sm`}>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">{k.label}</p>
              <p className={`text-sm font-black font-mono ${k.color}`}>{k.val}</p>
            </div>
          ))}
        </div>

        {Object.entries(grupos).map(([rubro, items])=>{
          const colors = RUBRO_COLORS[rubro] || RUBRO_COLORS['OTROS'];
          const gCostoUSD = items.reduce((s,r)=>s+r.costoUSD,0);
          const gCostoBS  = items.reduce((s,r)=>s+r.costoBS,0);
          const gDepAcum  = items.reduce((s,r)=>s+getDepAcumActual(r),0);
          const gNeto     = items.reduce((s,r)=>s+getValorNetoActual(r),0);
          const gMensual  = items.reduce((s,r)=>s+r.depreMensual,0);
          return (
            <div key={rubro} className="bg-white rounded-xl shadow-sm border border-slate-200 mb-4 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 bg-slate-50 border-b border-slate-200">
                <div className="flex items-center gap-3">
                  <span className={`${colors.bg} text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full`}>{rubro}</span>
                  <span className="text-slate-400 text-[10px]">{items.length} activo{items.length!==1?'s':''}</span>
                </div>
                <div className="flex gap-5 text-right text-[10px]">
                  <div><p className="text-slate-400 text-[8px] uppercase font-bold">Costo USD</p><p className={`font-mono font-black ${colors.text}`}>USD {fmt(gCostoUSD)}</p></div>
                  <div><p className="text-slate-400 text-[8px] uppercase font-bold">Costo Bs.</p><p className="font-mono font-black text-slate-700">Bs. {fmt(gCostoBS)}</p></div>
                  <div><p className="text-slate-400 text-[8px] uppercase font-bold">Dep. Acum</p><p className="font-mono font-black text-red-600">USD {fmt(gDepAcum)}</p></div>
                  <div><p className="text-slate-400 text-[8px] uppercase font-bold">Val. Neto</p><p className="font-mono font-black text-orange-600">USD {fmt(gNeto)}</p></div>
                  <div><p className="text-slate-400 text-[8px] uppercase font-bold">Dep/Mes</p><p className="font-mono font-black text-emerald-600">USD {fmt(gMensual)}</p></div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse" style={{minWidth:'1300px'}}>
                  <thead>
                    <tr className="text-[8px] uppercase font-black border-b border-slate-100 bg-slate-50">
                      <th className="px-2 py-2 text-center text-slate-400 w-8">Cant</th>
                      <th className="px-3 py-2 text-slate-600 w-48">Mobiliario y Equipo</th>
                      <th className="px-2 py-2 text-center text-slate-400 w-12">Sede</th>
                      <th className="px-2 py-2 text-slate-400 w-20">F. Adquisición</th>
                      <th className="px-2 py-2 text-center text-slate-400 w-14">V.U. Asig</th>
                      <th className="px-2 py-2 text-center text-slate-400 w-14">V.U. Trans</th>
                      <th className="px-2 py-2 text-right text-blue-600 w-28 bg-blue-50/60">Costo Adq. USD</th>
                      <th className="px-2 py-2 text-right text-slate-500 w-28 bg-slate-100">Costo Adq. Bs.</th>
                      <th className="px-2 py-2 text-right text-red-500 w-28 bg-red-50">DEP.ACUM USD</th>
                      <th className="px-2 py-2 text-right text-orange-600 w-28 bg-orange-50">Val. Neto USD</th>
                      <th className="px-2 py-2 text-right text-emerald-600 w-24 bg-emerald-50">Dep. Mensual USD</th>
                      <th className="px-2 py-2 text-right text-slate-400 w-14">Tasa</th>
                      <th className="px-2 py-2 text-center w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((a, i) => {
                      const globalIdx = records.indexOf(a);
                      return (
                        <tr key={i} className={`border-b border-slate-100 hover:bg-orange-50/30 transition-colors ${i%2===0?'bg-white':'bg-slate-50/30'}`}>
                          <td className="px-2 py-2 text-center font-mono text-[10px] text-slate-400">{a.cant}</td>
                          <td className="px-3 py-2 font-bold text-[10px] text-slate-800 max-w-[192px] truncate" title={a.descripcion}>{a.descripcion}</td>
                          <td className="px-2 py-2 text-center text-[10px] font-bold text-slate-500">{a.sede}</td>
                          <td className="px-2 py-2 font-mono text-[10px] text-slate-500 whitespace-nowrap">{a.fechaAdq||'-'}</td>
                          <td className="px-2 py-2 text-center font-mono text-[10px] text-slate-400">{a.vidaUtilAsig||'-'}</td>
                          <td className="px-2 py-2 text-center font-mono text-[10px] text-slate-400">{a.vidaUtilTrans||'-'}</td>
                          <td className="px-2 py-2 text-right font-mono font-bold text-[10px] text-blue-700 bg-blue-50/40 whitespace-nowrap">USD {fmt(a.costoUSD)}</td>
                          <td className="px-2 py-2 text-right font-mono text-[10px] text-slate-600 bg-slate-50 whitespace-nowrap">Bs. {fmt(a.costoBS)}</td>
                          <td className="px-2 py-2 text-right font-mono text-[10px] text-red-600 bg-red-50/30 whitespace-nowrap">USD {fmt(getDepAcumActual(a))}</td>
                          <td className="px-2 py-2 text-right font-mono font-bold text-[11px] text-orange-600 bg-orange-50/40 whitespace-nowrap">USD {fmt(getValorNetoActual(a))}</td>
                          <td className="px-2 py-2 text-right font-mono text-[10px] text-emerald-600 bg-emerald-50/30 whitespace-nowrap">USD {fmt(a.depreMensual)}</td>
                          <td className="px-2 py-2 text-right font-mono text-[10px] text-slate-400 whitespace-nowrap">{(a.tasa||0).toFixed(2)}</td>
                          <td className="px-2 py-2 text-center">
                            <button onClick={()=>openEdit(a, globalIdx)}
                              className="p-1 rounded hover:bg-orange-100 text-slate-400 hover:text-orange-600 transition-colors" title="Editar">
                              ✏️
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100 font-black text-[9px] border-t-2 border-slate-300">
                      <td colSpan={6} className="px-3 py-2.5 text-slate-600 uppercase tracking-wider">Subtotal {rubro}</td>
                      <td className="px-2 py-2.5 text-right font-mono text-blue-700 whitespace-nowrap">USD {fmt(gCostoUSD)}</td>
                      <td className="px-2 py-2.5 text-right font-mono text-slate-700 whitespace-nowrap">Bs. {fmt(gCostoBS)}</td>
                      <td className="px-2 py-2.5 text-right font-mono text-red-600 whitespace-nowrap">USD {fmt(gDepAcum)}</td>
                      <td className="px-2 py-2.5 text-right font-mono text-orange-700 whitespace-nowrap">USD {fmt(gNeto)}</td>
                      <td className="px-2 py-2.5 text-right font-mono text-emerald-600 whitespace-nowrap">USD {fmt(gMensual)}</td>
                      <td colSpan={2}/>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          );
        })}

        {showAsiento && (
          <div className="bg-white rounded-xl shadow-sm border border-violet-200 mb-4 overflow-hidden">
            <div className="bg-violet-600 px-5 py-3 flex items-center justify-between">
              <div>
                <p className="text-[9px] font-black text-violet-200 uppercase tracking-widest">Libro Diario</p>
                <p className="text-white font-black text-sm">Asientos Contables de Depreciación por Mes</p>
              </div>
              <p className="text-violet-200 text-[10px] font-bold">Depreciación mensual: USD {fmt(totalMensual)}</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse" style={{minWidth:'900px'}}>
                <thead>
                  <tr className="text-[9px] uppercase font-black border-b border-violet-100 bg-violet-50">
                    <th className="px-4 py-2 text-violet-600 w-12">Mes</th>
                    <th className="px-4 py-2 text-violet-500">Cuenta Contable</th>
                    <th className="px-3 py-2 text-violet-400 w-40">Rubro</th>
                    <th className="px-3 py-2 text-emerald-600 text-right w-32">DEBE Bs.</th>
                    <th className="px-3 py-2 text-red-500 text-right w-32">HABER Bs.</th>
                    <th className="px-2 py-2 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'].map(mes => {
                    const { debeLines=[], haberLines=[], totalDebe=0, totalHaber=0 } = asientosPorMes[mes] || {};
                    if (!debeLines.length) return null;
                    return (
                      <React.Fragment key={mes}>
                        <tr className="bg-violet-50/80 border-t-2 border-violet-200">
                          <td colSpan={4} className="px-4 py-2 font-black text-violet-700 text-[10px] uppercase tracking-widest">{mes}</td>
                          <td className="px-3 py-2 text-right text-[9px] font-black text-violet-500"></td>
                          <td className="px-2 py-2 text-center">
                            <button onClick={()=>exportAsientoExcel(mes)} title="Exportar" className="p-1 hover:bg-violet-100 rounded text-violet-400 hover:text-violet-700">
                              <FileSpreadsheet size={12}/>
                            </button>
                          </td>
                        </tr>
                        {debeLines.map((l,i) => (
                          <tr key={`d${i}`} className="border-b border-slate-50 hover:bg-emerald-50/30">
                            <td className="px-4 py-1.5 text-center"><span className="text-[8px] font-black text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded">DEBE</span></td>
                            <td className="px-4 py-1.5 font-mono text-[10px] text-slate-700"><span className="font-black text-slate-900">{l.cta}</span> — {l.nombre}</td>
                            <td className="px-3 py-1.5 text-[9px] text-slate-400"></td>
                            <td className="px-3 py-1.5 text-right font-mono font-bold text-[10px] text-emerald-700">Bs. {fmt(l.montoBs)}</td>
                            <td className="px-3 py-1.5 text-right font-mono text-[10px] text-slate-300">—</td>
                            <td/>
                          </tr>
                        ))}
                        {haberLines.map((l,i) => (
                          <tr key={`h${i}`} className="border-b border-slate-50 hover:bg-red-50/30">
                            <td className="px-4 py-1.5 text-center"><span className="text-[8px] font-black text-red-600 bg-red-100 px-1.5 py-0.5 rounded">HABER</span></td>
                            <td className="px-4 py-1.5 font-mono text-[10px] text-slate-700 pl-10"><span className="font-black text-slate-900">{l.cta}</span> — {l.nombre}</td>
                            <td className="px-3 py-1.5 text-[9px] text-slate-400"></td>
                            <td className="px-3 py-1.5 text-right font-mono text-[10px] text-slate-300">—</td>
                            <td className="px-3 py-1.5 text-right font-mono font-bold text-[10px] text-red-600">Bs. {fmt(l.montoBs)}</td>
                            <td/>
                          </tr>
                        ))}
                        <tr className="bg-violet-50 border-t border-violet-200">
                          <td colSpan={3} className="px-4 py-2 text-[9px] font-black text-violet-600 uppercase">TOTALES {mes}</td>
                          <td className="px-3 py-2 text-right font-mono font-black text-[10px] text-emerald-700">Bs. {fmt(totalDebe)}</td>
                          <td className="px-3 py-2 text-right font-mono font-black text-[10px] text-red-600">Bs. {fmt(totalHaber)}</td>
                          <td/>
                        </tr>
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="bg-slate-800 rounded-xl p-5 flex flex-wrap justify-between items-center gap-4 border border-slate-700 shadow-md">
          <span className="text-white font-black uppercase tracking-widest text-sm">TOTAL ACTIVOS FIJOS — {filteredValid.length} activos</span>
          <div className="flex gap-6 text-right flex-wrap">
            <div><p className="text-[8px] text-slate-400 font-bold uppercase">Costo USD</p><p className="font-mono font-black text-blue-400">USD {fmt(totalCostoUSD)}</p></div>
            <div><p className="text-[8px] text-slate-400 font-bold uppercase">Costo Bs.</p><p className="font-mono font-black text-white">Bs. {fmt(totalCostoBS)}</p></div>
            <div><p className="text-[8px] text-slate-400 font-bold uppercase">Dep. Acum USD</p><p className="font-mono font-black text-red-400">USD {fmt(totalDepAcum)}</p></div>
            <div><p className="text-[8px] text-slate-400 font-bold uppercase">Valor Neto USD</p><p className="font-mono font-black text-orange-400">USD {fmt(totalNeto)}</p></div>
            <div><p className="text-[8px] text-slate-400 font-bold uppercase">Dep/Mes USD</p><p className="font-mono font-black text-emerald-400">USD {fmt(totalMensual)}</p></div>
          </div>
        </div>
      </main>
    </div>
  );
}

// ============================================================================
// 10. VISTA: DASHBOARD FINANCIERO
// ============================================================================
const SVG_W = 480, SVG_H = 220, PAD = { t:10, r:16, b:32, l:56 };
const cw = SVG_W - PAD.l - PAD.r;
const ch = SVG_H - PAD.t - PAD.b;

function SvgTooltip({ x, y, lines }) {
  if (!lines?.length) return null;
  const w = 140, lh = 16, ph = 8;
  const h = lines.length * lh + ph * 2;
  const tx = Math.min(x + 10, SVG_W - w - 4);
  const ty = Math.max(y - h / 2, 4);
  return (
    <g>
      <rect x={tx} y={ty} width={w} height={h} rx={6} fill="#0f172a" opacity={0.93}/>
      {lines.map((l, i) => (
        <text key={i} x={tx + 8} y={ty + ph + (i + 0.75) * lh}
          fontSize={9} fontWeight={700} fill={l.color || '#e2e8f0'}>{l.text}</text>
      ))}
    </g>
  );
}

function SvgAreaChart({ data, series, height = 220, refLine }) {
  const [tip, setTip] = useState(null);
  if (!data?.length) return <div className="h-full flex items-center justify-center text-slate-400 text-xs font-bold uppercase">SIN DATOS</div>;
  const H = height; const inner_h = H - PAD.t - PAD.b;
  const allVals = series.flatMap(s => data.map(d => d[s.key] || 0));
  const maxV = Math.max(...allVals, 1);
  const minV = Math.min(...allVals, 0);
  const rangeV = maxV - minV || 1;
  const xScale = i => PAD.l + (i / (data.length - 1)) * cw;
  const yScale = v => PAD.t + inner_h - ((v - minV) / rangeV) * inner_h;
  const fmtK = v => { const a = Math.abs(v); if (a >= 1e6) return (v/1e6).toFixed(1)+'M'; if (a >= 1e3) return (v/1e3).toFixed(0)+'K'; return v.toFixed(0); };
  const yTicks = 4;

  return (
    <svg viewBox={`0 0 ${SVG_W} ${H}`} className="w-full" style={{height}}>
      {Array.from({length: yTicks + 1}, (_, i) => {
        const v = minV + (rangeV / yTicks) * i;
        const y = yScale(v);
        return <g key={i}>
          <line x1={PAD.l} y1={y} x2={SVG_W - PAD.r} y2={y} stroke="#f1f5f9" strokeWidth={1}/>
          <text x={PAD.l - 4} y={y + 3} fontSize={8} fill="#94a3b8" textAnchor="end">{fmtK(v)}</text>
        </g>;
      })}
      {refLine != null && <line x1={PAD.l} y1={yScale(refLine)} x2={SVG_W-PAD.r} y2={yScale(refLine)} stroke="#10b981" strokeWidth={1} strokeDasharray="4 2"/>}
      {series.filter(s => s.area).map(s => {
        const pts = data.map((d, i) => `${xScale(i)},${yScale(d[s.key] || 0)}`).join(' ');
        const last = data.length - 1;
        return <polygon key={s.key} points={`${xScale(0)},${yScale(minV)} ${pts} ${xScale(last)},${yScale(minV)}`} fill={s.color} opacity={0.15}/>;
      })}
      {series.map(s => {
        const pts = data.map((d, i) => `${xScale(i)},${yScale(d[s.key] || 0)}`).join(' ');
        return <polyline key={s.key} points={pts} fill="none" stroke={s.color} strokeWidth={s.width || 2} strokeDasharray={s.dash || ''}/>;
      })}
      {data.map((d, i) => (
        <rect key={i} x={xScale(i) - 8} y={PAD.t} width={16} height={inner_h + PAD.b}
          fill="transparent"
          onMouseEnter={() => setTip({ x: xScale(i), y: PAD.t + inner_h / 2, lines: [{ text: d.mes, color: '#f97316' }, ...series.map(s => ({ text: `${s.label}: ${fmtK(d[s.key] || 0)}`, color: s.color }))] })}
          onMouseLeave={() => setTip(null)}/>
      ))}
      {data.map((d, i) => (
        <text key={i} x={xScale(i)} y={H - 6} fontSize={8} fill="#94a3b8" fontWeight={700} textAnchor="middle">{d.mes}</text>
      ))}
      {tip && <SvgTooltip {...tip}/>}
    </svg>
  );
}

function SvgBarChart({ data, series, height = 220, refLine }) {
  const [tip, setTip] = useState(null);
  if (!data?.length) return <div className="flex items-center justify-center text-slate-400 text-xs font-bold uppercase" style={{height}}>SIN DATOS</div>;
  const H = height; const inner_h = H - PAD.t - PAD.b;
  const allVals = series.flatMap(s => data.map(d => d[s.key] || 0));
  const maxV = Math.max(...allVals.map(Math.abs), 1);
  const minV = Math.min(...allVals, 0);
  const rangeV = maxV - minV || 1;
  const barW = Math.max(6, Math.min(32, cw / data.length / series.length - 4));
  const groupW = barW * series.length + 4;
  const xCenter = i => PAD.l + (i + 0.5) * (cw / data.length);
  const yScale = v => PAD.t + inner_h - ((v - minV) / rangeV) * inner_h;
  const y0 = yScale(0);
  const fmtK = v => { const a = Math.abs(v); if (a >= 1e6) return (v/1e6).toFixed(1)+'M'; if (a >= 1e3) return (v/1e3).toFixed(0)+'K'; return v.toFixed(0); };

  return (
    <svg viewBox={`0 0 ${SVG_W} ${H}`} className="w-full" style={{height}}>
      {Array.from({length: 5}, (_, i) => {
        const v = minV + (rangeV / 4) * i;
        const y = yScale(v);
        return <g key={i}>
          <line x1={PAD.l} y1={y} x2={SVG_W-PAD.r} y2={y} stroke="#f1f5f9" strokeWidth={1}/>
          <text x={PAD.l-4} y={y+3} fontSize={8} fill="#94a3b8" textAnchor="end">{fmtK(v)}</text>
        </g>;
      })}
      {refLine != null && <line x1={PAD.l} y1={y0} x2={SVG_W-PAD.r} y2={y0} stroke="#64748b" strokeWidth={1} strokeDasharray="3 3"/>}
      {data.map((d, i) => {
        const cx = xCenter(i);
        return <g key={i}>
          {series.map((s, si) => {
            const v = d[s.key] || 0;
            const y = yScale(v); const rectH = Math.abs(y - y0);
            const x = cx - groupW/2 + si * (barW + 2);
            const fill = typeof s.color === 'function' ? s.color(v) : s.color;
            return <rect key={si} x={x} y={v >= 0 ? y : y0} width={barW} height={Math.max(rectH, 1)}
              fill={fill} rx={2}
              onMouseEnter={() => setTip({ x: cx, y: PAD.t + inner_h/2, lines: [{ text: d.mes, color:'#f97316' }, { text: `${s.label}: ${fmtK(v)}`, color: typeof s.color==='function'?s.color(v):s.color }] })}
              onMouseLeave={() => setTip(null)}/>;
          })}
          <text x={cx} y={H-6} fontSize={8} fill="#94a3b8" fontWeight={700} textAnchor="middle">{d.mes}</text>
        </g>;
      })}
      {tip && <SvgTooltip {...tip}/>}
    </svg>
  );
}

function SvgHBar({ data, height = 220 }) {
  if (!data?.length) return null;
  const maxV = Math.max(...data.map(d => d.valor), 1);
  const bH = 22; const gap = 12;
  const total_h = data.length * (bH + gap) + 20;
  const fmtK = v => { const a=Math.abs(v); if(a>=1e6)return (v/1e6).toFixed(2)+'M'; if(a>=1e3)return (v/1e3).toFixed(1)+'K'; return v.toFixed(0); };
  const xLabel = 80, xBar = xLabel + 8, barW = SVG_W - xBar - 64;
  return (
    <svg viewBox={`0 0 ${SVG_W} ${total_h}`} className="w-full" style={{height: Math.min(height, total_h)}}>
      {data.map((d, i) => {
        const y = 10 + i * (bH + gap);
        const w = (d.valor / maxV) * barW;
        return <g key={i}>
          <text x={xLabel} y={y + bH/2 + 3} fontSize={9} fill="#374151" fontWeight={700} textAnchor="end">{d.name}</text>
          <rect x={xBar} y={y} width={Math.max(w, 2)} height={bH} fill={d.fill} rx={4}/>
          <text x={xBar + Math.max(w,2) + 6} y={y + bH/2 + 3} fontSize={9} fill="#374151" fontWeight={700}>{fmtK(d.valor)}</text>
        </g>;
      })}
    </svg>
  );
}

function SvgDonut({ data, size = 200 }) {
  const [hov, setHov] = useState(null);
  if (!data?.length) return <div className="flex items-center justify-center text-slate-400 text-xs font-bold uppercase" style={{height:size}}>SIN DATOS</div>;
  const PIE_COLORS = ['#6366f1','#f97316','#10b981','#f59e0b','#3b82f6','#8b5cf6','#ec4899'];
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const cx = size/2, cy = size/2, R = size*0.36, r = size*0.20;
  let angle = -Math.PI / 2;
  const fmtK = v => { const a=Math.abs(v); if(a>=1e6)return (v/1e6).toFixed(1)+'M'; if(a>=1e3)return (v/1e3).toFixed(0)+'K'; return v.toFixed(0); };
  const slices = data.map((d, i) => {
    const sweep = (d.value / total) * Math.PI * 2;
    const x1 = cx + R * Math.cos(angle);
    const y1 = cy + R * Math.sin(angle);
    angle += sweep;
    const x2 = cx + R * Math.cos(angle);
    const y2 = cy + R * Math.sin(angle);
    const lf = sweep > Math.PI ? 1 : 0;
    const ix1 = cx + r * Math.cos(angle - sweep);
    const iy1 = cy + r * Math.sin(angle - sweep);
    const ix2 = cx + r * Math.cos(angle);
    const iy2 = cy + r * Math.sin(angle);
    const path = `M${x1},${y1} A${R},${R},0,${lf},1,${x2},${y2} L${ix2},${iy2} A${r},${r},0,${lf},0,${ix1},${iy1} Z`;
    return { path, color: PIE_COLORS[i % PIE_COLORS.length], label: d.name, value: d.value };
  });
  return (
    <div className="flex flex-col items-center gap-3">
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} className="flex-shrink-0">
        {slices.map((s, i) => (
          <path key={i} d={s.path} fill={s.color}
            opacity={hov === null || hov === i ? 1 : 0.5}
            stroke="#fff" strokeWidth={2}
            onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)}/>
        ))}
        {hov !== null && (
          <text x={cx} y={cy-6} textAnchor="middle" fontSize={8} fill="#374151" fontWeight={700}>{slices[hov]?.label}</text>
        )}
        {hov !== null && (
          <text x={cx} y={cy+8} textAnchor="middle" fontSize={9} fill="#6366f1" fontWeight={900}>{fmtK(slices[hov]?.value)}</text>
        )}
      </svg>
      <div className="flex flex-wrap justify-center gap-x-3 gap-y-1">
        {slices.map((s, i) => (
          <div key={i} className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{background:s.color}}/>
            <span className="text-[8px] font-bold text-slate-600 uppercase">{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SvgStackedBar({ data, series, height = 180 }) {
  const [tip, setTip] = useState(null);
  if (!data?.length) return null;
  const H = height; const inner_h = H - PAD.t - PAD.b;
  const maxV = Math.max(...data.map(d => series.reduce((s, sr) => s + Math.abs(d[sr.key]||0), 0)), 1);
  const barW = Math.max(8, Math.min(40, cw / data.length - 8));
  const xCenter = i => PAD.l + (i + 0.5) * (cw / data.length);
  const yScale = v => PAD.t + inner_h - (v / maxV) * inner_h;
  const fmtK = v => { const a=Math.abs(v); if(a>=1e6)return (v/1e6).toFixed(1)+'M'; if(a>=1e3)return (v/1e3).toFixed(0)+'K'; return v.toFixed(0); };

  return (
    <svg viewBox={`0 0 ${SVG_W} ${H}`} className="w-full" style={{height}}>
      {Array.from({length:5},(_,i)=>{
        const v=maxV/4*i; const y=yScale(v);
        return <g key={i}><line x1={PAD.l} y1={y} x2={SVG_W-PAD.r} y2={y} stroke="#f1f5f9" strokeWidth={1}/><text x={PAD.l-4} y={y+3} fontSize={8} fill="#94a3b8" textAnchor="end">{fmtK(v)}</text></g>;
      })}
      {data.map((d, i) => {
        const cx = xCenter(i);
        let cumCost = 0;
        return <g key={i}>
          {series.map((s, si) => {
            const v = Math.abs(d[s.key] || 0);
            const y = yScale(cumCost + v);
            const rectH = yScale(cumCost) - y;
            cumCost += v;
            return <rect key={si} x={cx - barW/2} y={y} width={barW} height={Math.max(rectH,1)}
              fill={s.color} rx={si===series.length-1?2:0}
              onMouseEnter={()=>setTip({x:cx,y:PAD.t+inner_h/2,lines:[{text:d.mes,color:'#f97316'},...series.map(sr=>({text:`${sr.label}: ${fmtK(d[sr.key]||0)}`,color:sr.color}))]})}
              onMouseLeave={()=>setTip(null)}/>;
          })}
          <text x={cx} y={H-6} fontSize={8} fill="#94a3b8" fontWeight={700} textAnchor="middle">{d.mes}</text>
        </g>;
      })}
      {tip && <SvgTooltip {...tip}/>}
    </svg>
  );
}

function ChartLegend({ items }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
      {items.map(item => (
        <div key={item.label} className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{background:item.color}}/>
          <span className="text-[9px] font-bold text-slate-500 uppercase">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

function DashboardFinancieroView({ onBack, dbData, tasaByMonth = {}, afByMonth = {}, activosFijosData }) {
  const MESES_ORDER = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const fmtK = v => { const a=Math.abs(v||0); if(a>=1e6)return (v/1e6).toFixed(2)+'M'; if(a>=1e3)return (v/1e3).toFixed(1)+'K'; return (v||0).toFixed(0); };
  const fmtN = v => new Intl.NumberFormat('es-VE',{minimumFractionDigits:2,maximumFractionDigits:2}).format(v||0);
  const pctFmt = v => (v||0).toFixed(1)+'%';

  const pathUp = (d) => (d.path||'').toUpperCase();
  const isResRecord = (d) => !pathUp(d).includes('ACTIVO')&&!pathUp(d).includes('PASIVO')&&!pathUp(d).includes('PATRIMONIO')&&!/^[123]/.test(d.name);
  const isBalRecord = (d) => /^[123]/.test(d.name)||pathUp(d).includes('ACTIVO')||pathUp(d).includes('PASIVO')||pathUp(d).includes('PATRIMONIO');

  const allMeses = useMemo(()=>{
    const combined = new Set([
      ...dbData.filter(d=>isResRecord(d)).map(d=>d.month),
      ...dbData.filter(d=>isBalRecord(d)&&d.month!=='Saldos Iniciales').map(d=>d.month),
    ]);
    if (!combined.has('Abril') && dbData.some(d=>d.month==='Saldos Iniciales'&&isBalRecord(d))) {
      combined.add('Abril');
    }
    return [...combined].filter(m=>m&&m!=='Sin Mes')
      .sort((a,b)=>(MESES_ORDER.indexOf(a)+1||99)-(MESES_ORDER.indexOf(b)+1||99));
  },[dbData]);

  const [selectedMes, setSelectedMes] = useState('');
  useEffect(()=>{
    if(allMeses.length>0) {
      setSelectedMes(prev=>(prev&&allMeses.includes(prev))?prev:allMeses[allMeses.length-1]);
    }
  },[allMeses]);
  const mes = selectedMes || allMeses[allMeses.length-1] || 'Abril';

  const hasPL  = useMemo(()=>dbData.some(d=>d.month?.toLowerCase()===mes.toLowerCase()&&isResRecord(d)),[dbData,mes]);
  const hasBal = useMemo(()=>{
    const exact = dbData.some(d=>d.month?.toLowerCase()===mes.toLowerCase()&&isBalRecord(d));
    const siAsFallback = mes.toLowerCase()==='abril' && dbData.some(d=>d.month==='Saldos Iniciales'&&isBalRecord(d));
    return exact || siAsFallback;
  },[dbData,mes]);

  const calcPL = (m) => {
    const mn = m.toLowerCase();
    const resData = dbData.filter(x => x.month?.toLowerCase() === mn && isResRecord(x));
    if (!resData.length) return {ingresos:0,costoVentas:0,costosOp:0,costos:0,gastos:0,utilBruta:0,utilOp:0,resultado:0,margenBruto:0,margenOp:0,margenNeto:0};

    const root = [];
    const normKey = s => (s||'').trim().replace(/\s+/g,' ').toUpperCase();
    resData.forEach(item => {
      const pathArray = correctTopLevelPath((item.path||'').split('>').filter(Boolean), item.name);
      let cur = root;
      pathArray.forEach(folderName => {
        const key = normKey(folderName);
        let folder = cur.find(n => normKey(n.n) === key);
        if (!folder) { folder = {n:folderName.trim(), c:[], u:0, b:0}; cur.push(folder); }
        cur = folder.c;
      });
      let leaf = cur.find(n => normKey(n.n) === normKey(item.name) && n.isLeaf);
      if (!leaf) cur.push({n:item.name.trim(), u:item.usd, b:item.bs, isLeaf:true});
      else { leaf.u += item.usd; leaf.b += item.bs; }
    });

    const sumNode = (node) => {
      if (node.isLeaf) return { u: node.u, b: node.b };
      let u = 0, b = 0;
      (node.c||[]).forEach(child => { const s = sumNode(child); u += s.u; b += s.b; });
      node.u = u; node.b = b;
      return { u, b };
    };
    root.forEach(sumNode);

    const afData = afByMonth[m] || (activosFijosData?.records?.length ? activosFijosData : null);
    const afRecs = afData?.records || [];
    if (afRecs.length > 0) {
      const depByLabel = {};
      afRecs.filter(r=>r.costoUSD>0&&r.depreMensual>0).forEach(r => {
        const perMesUSD = r.depreMensual;
        const t = r.tasa || tasaByMonth[m] || 1;
        const perMesBs  = t > 0 ? perMesUSD * t : perMesUSD;
        const ctaGasto  = (r.cuentaGasto||'').trim();
        if (ctaGasto && /^\d/.test(ctaGasto)) {
          const label = ctaGasto.includes('-') ? ctaGasto : `${ctaGasto}-DEPRECIACIÓN`;
          if (!depByLabel[label]) depByLabel[label] = {bs:0,usd:0};
          depByLabel[label].bs  += perMesBs;
          depByLabel[label].usd += perMesUSD;
        } else {
          const rubro = getRubro(r);
          const map = RUBRO_DEPR_MAP[rubro];
          if (map) {
            if (map.debe.length === 1) {
              const d0 = map.debe[0];
              const label = `${d0.cta}-${d0.nombre}`;
              if (!depByLabel[label]) depByLabel[label] = {bs:0,usd:0};
              depByLabel[label].bs  += perMesBs;
              depByLabel[label].usd += perMesUSD;
            } else {
              const sede2 = (r.sede||'').toUpperCase().trim();
              const desc2 = ((r.descripcion||'')+(r.cuenta||'')).toUpperCase();
              const esAdm = sede2 === 'C2' || /\bC2\b/.test(sede2) ||
                /JAC\b|\bT6\b|ADMIN|OFICIN|ADM\b|GERENC|DIRECCI/.test(desc2);
              const ctaElegida = esAdm
                ? map.debe.find(d => /^6/.test(d.cta)) || map.debe[0]
                : map.debe.find(d => /^5/.test(d.cta)) || map.debe[0];
              const label = `${ctaElegida.cta}-${ctaElegida.nombre}`;
              if (!depByLabel[label]) depByLabel[label] = {bs:0,usd:0};
              depByLabel[label].bs  += perMesBs;
              depByLabel[label].usd += perMesUSD;
            }
          }
        }
      });
      Object.entries(depByLabel).forEach(([label, vals]) => {
        const cta = label.split('-')[0].trim();
        const isGasto = /^6/.test(cta);
        const path5Node = root.find(n => /^(COSTO)/i.test(n.n));
        const path6Node = root.find(n => /^(GASTO)/i.test(n.n));
        const folderPath = isGasto
          ? (path6Node ? path6Node.n : 'GASTOS')
          : (path5Node ? path5Node.n : 'COSTOS');
        const subPath = isGasto ? 'GASTOS DE DEPRECIACIÓN' : 'DEPRECIACIÓN';
        const insertInRoot = (sectionName, sub, leafName, u, b) => {
          const normKey2 = s => (s||'').trim().replace(/\s+/g,' ').toUpperCase();
          let section = root.find(n => normKey2(n.n)===normKey2(sectionName));
          if (!section) { section = {n:sectionName, c:[], u:0, b:0}; root.push(section); }
          let subNode = section.c.find(n => normKey2(n.n)===normKey2(sub));
          if (!subNode) { subNode = {n:sub, c:[], u:0, b:0}; section.c.push(subNode); }
          let leaf2 = subNode.c.find(n => normKey2(n.n)===normKey2(leafName)&&n.isLeaf);
          if (!leaf2) subNode.c.push({n:leafName, u, b, isLeaf:true});
          else { leaf2.u += u; leaf2.b += b; }
        };
        insertInRoot(folderPath, subPath, label, vals.usd, vals.bs);
      });
      root.forEach(sumNode);
    }

    let ingresos = 0, costoVentas = 0, costosOp = 0, gastos = 0;
    root.forEach(n => {
      const up = (n.n||'').toUpperCase();
      const v = Math.abs(n.u);
      if (up.includes('INGRESO') || up.startsWith('4')) {
        ingresos += v;
      } else if (up.includes('COSTO DE VENTA') || up.includes('COSTO VENTA') || up.includes('OTROS COSTO')) {
        costoVentas += v;
      } else if (up.includes('COSTO') || up.startsWith('5')) {
        costosOp += v;
      } else {
        gastos += v;
      }
    });

    const costos = costoVentas + costosOp;
    const utilBruta = ingresos - costoVentas;
    const utilOp = utilBruta - costosOp;
    const resultado = utilOp - gastos;
    return {ingresos, costoVentas, costosOp, costos, gastos, utilBruta, utilOp, resultado,
      margenBruto: ingresos ? utilBruta/ingresos*100 : 0,
      margenOp:    ingresos ? utilOp/ingresos*100 : 0,
      margenNeto:  ingresos ? resultado/ingresos*100 : 0};
  };

  const calcBal = (m) => {
    const mn = m.toLowerCase();
    const hasExact = dbData.some(d=>d.month?.toLowerCase()===mn&&isBalRecord(d));
    const target = hasExact ? m : 'Saldos Iniciales';
    const balData = dbData.filter(x=>x.month?.toLowerCase()===target.toLowerCase()&&isBalRecord(x));

    const root = [];
    const normKey = s => (s||'').trim().replace(/\s+/g,' ').toUpperCase();
    balData.forEach(item => {
      const pathArray = (item.path||'').split('>').filter(Boolean);
      let cur = root;
      pathArray.forEach(folderName => {
        const key = normKey(folderName);
        let folder = cur.find(n => normKey(n.n) === key);
        if (!folder) { folder = {n:folderName.trim(), c:[], u:0, b:0, top:pathArray[0]}; cur.push(folder); }
        cur = folder.c;
      });
      let leaf = cur.find(n => normKey(n.n) === normKey(item.name) && n.isLeaf);
      if (!leaf) cur.push({n:item.name.trim(), u:item.usd, b:item.bs, isLeaf:true, top:(item.path||'').split('>')[0]});
      else { leaf.u += item.usd; leaf.b += item.bs; }
    });

    let activos=0, pasivos=0, patrimonio=0;
    const walkLeaves = (nodes, topSection) => {
      nodes.forEach(n => {
        if (n.isLeaf) {
          const v = Math.abs(n.u||0);
          const sec = (topSection || n.top || '').toUpperCase();
          if (sec.includes('ACTIV')) activos += v;
          else if (sec.includes('PASIV')) pasivos += v;
          else patrimonio += v;
        } else {
          walkLeaves(n.c||[], topSection || (n.top||n.n));
        }
      });
    };
    walkLeaves(root, '');

    return {activos, pasivos, patrimonio,
      razonCte: pasivos>0 ? activos/pasivos : 0,
      endeudam: activos>0 ? pasivos/activos*100 : 0};
  };

  const pl  = useMemo(()=>calcPL(mes), [dbData,mes]);
  const bal = useMemo(()=>calcBal(mes),[dbData,mes]);
  const tasa = tasaByMonth[mes]||1;

  const resMeses = useMemo(()=>[...new Set(dbData.filter(d=>isResRecord(d)).map(d=>d.month))].filter(m=>m&&m!=='Sin Mes').sort((a,b)=>(MESES_ORDER.indexOf(a)+1||99)-(MESES_ORDER.indexOf(b)+1||99)),[dbData]);

  const trendData = useMemo(()=>resMeses.map(m=>{
    const p=calcPL(m);
    return {mes:m.slice(0,3).toUpperCase(),ingresos:+p.ingresos.toFixed(2),costoVentas:+p.costoVentas.toFixed(2),costosOp:+p.costosOp.toFixed(2),gastos:+p.gastos.toFixed(2),resultado:+p.resultado.toFixed(2),margenBruto:+p.margenBruto.toFixed(1),margenOp:+p.margenOp.toFixed(1)};
  }),[dbData,resMeses.join(',')]);

  const ACTIVO_GROUPS=[
    {label:'DISPONIBLE',re:/^1\.1\.01/},{label:'CxC',re:/^1\.1\.02/},
    {label:'INVENTARIOS',re:/^1\.1\.03/},{label:'OTROS CORR.',re:/^1\.1\.(04|05)/},{label:'ACTIVOS FIJOS',re:/^1\.1\.06/},
  ];
  const activosPie = useMemo(()=>{
    const mn=mes.toLowerCase();
    const target=dbData.some(d=>d.month?.toLowerCase()===mn&&(/^1/.test(d.name)||pathUp(d).includes('ACTIVO')))?mes:'Saldos Iniciales';
    const d=dbData.filter(x=>x.month?.toLowerCase()===target.toLowerCase()&&(/^1/.test(x.name)||x.path?.toUpperCase().includes('ACTIVO')));
    return ACTIVO_GROUPS.map(g=>({name:g.label,value:+d.filter(x=>g.re.test(x.name)).reduce((s,x)=>s+Math.abs(x.usd||0),0).toFixed(2)})).filter(g=>g.value>0);
  },[dbData,mes]);

  const Kpi = ({label,val,sub,color,icon,trend})=>(
    <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col gap-1">
      <div className="flex items-center justify-between mb-1">
        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{label}</p>
        <span className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>{icon}</span>
      </div>
      <p className={`text-lg font-black font-mono ${trend===false?'text-red-600':trend===true?'text-emerald-600':'text-slate-900'}`}>{val}</p>
      {sub && <p className="text-[9px] text-slate-400 font-bold truncate">{sub}</p>}
    </div>
  );
  return (
    <div className="min-h-screen" style={{background:'#f1f5f9',backgroundImage:'radial-gradient(circle,#cbd5e1 1px,transparent 1px)',backgroundSize:'24px 24px'}}>
      <header className="bg-[#0f172a] border-b-4 border-indigo-500 px-6 py-3 flex justify-between items-center sticky top-0 z-30 shadow-xl flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="flex items-center gap-2 font-black text-xs text-slate-400 uppercase hover:text-indigo-400"><ArrowLeft size={16}/> PANEL</button>
          <div className="border-l-2 border-slate-700 pl-4 flex items-center gap-2">
            <BarChart2 size={18} className="text-indigo-400"/>
            <span className="text-white font-black text-sm uppercase tracking-widest">DASHBOARD FINANCIERO</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-800 border border-indigo-500/40 rounded-xl px-4 py-2">
            <CalendarDays size={13} className="text-indigo-400"/>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">PERÍODO:</span>
            <select value={mes} onChange={e=>setSelectedMes(e.target.value)} className="bg-transparent text-indigo-300 text-sm font-black uppercase cursor-pointer outline-none">
              {allMeses.length > 0
                ? allMeses.map(m=><option key={m} value={m}>{m.toUpperCase()}</option>)
                : <option value="Abril">ABRIL</option>}
            </select>
          </div>
          <div className="flex gap-2 text-[9px]">
            {hasPL  && <span className="bg-emerald-900/60 text-emerald-300 font-black px-2 py-1 rounded-lg border border-emerald-700 uppercase">P&L ✓</span>}
            {hasBal && <span className="bg-indigo-900/60 text-indigo-300 font-black px-2 py-1 rounded-lg border border-indigo-700 uppercase">Balance ✓</span>}
            {!hasPL && !hasBal && <span className="bg-slate-800 text-slate-500 font-black px-2 py-1 rounded-lg border border-slate-700 uppercase">SIN DATOS</span>}
          </div>
        </div>
      </header>

      <main className="p-5 md:p-8 max-w-[1400px] mx-auto pb-16 space-y-8">
        {hasPL ? <section>
          <div className="bg-white rounded-2xl border-t-4 border-emerald-500 px-6 py-4 shadow-sm mb-5 flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500">ESTADO DE RESULTADO</p>
              <h2 className="text-xl font-black text-slate-900 uppercase">PERÍODO: {mes.toUpperCase()}</h2>
            </div>
            <span className="text-[10px] font-black text-emerald-600 uppercase bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">{resMeses.length} {resMeses.length===1?'MES':'MESES'} EN TENDENCIA</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-3">
            <Kpi label="INGRESOS"        val={`USD ${fmtK(pl.ingresos)}`}     sub={fmtN(pl.ingresos)}    color="bg-emerald-100" icon={<DollarSign size={14} className="text-emerald-600"/>} trend={true}/>
            <Kpi label="COSTO DE VENTAS" val={`USD ${fmtK(pl.costoVentas)}`}  sub={fmtN(pl.costoVentas)} color="bg-orange-100"  icon={<TrendingDown size={14} className="text-orange-600"/>} trend={false}/>
            <Kpi label="UTIL. BRUTA"     val={`USD ${fmtK(pl.utilBruta)}`}    sub={fmtN(pl.utilBruta)}   color="bg-blue-100"    icon={<Activity size={14} className="text-blue-600"/>}    trend={pl.utilBruta>=0}/>
            <Kpi label="MARGEN BRUTO"    val={pctFmt(pl.margenBruto)}          sub="SOBRE INGRESOS"       color="bg-teal-100"    icon={<TrendingUp size={14} className="text-teal-600"/>}   trend={pl.margenBruto>=30}/>
            <Kpi label="MARGEN NETO"     val={pctFmt(pl.margenNeto)}           sub="SOBRE INGRESOS"       color={pl.margenNeto>=0?"bg-emerald-100":"bg-red-100"} icon={<TrendingUp size={14} className={pl.margenNeto>=0?"text-emerald-600":"text-red-600"}/>} trend={pl.margenNeto>=0}/>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
            <Kpi label="COSTOS OPERAT."  val={`USD ${fmtK(pl.costosOp)}`}     sub={fmtN(pl.costosOp)}    color="bg-amber-100"   icon={<TrendingDown size={14} className="text-amber-600"/>}  trend={false}/>
            <Kpi label="GASTOS"          val={`USD ${fmtK(pl.gastos)}`}        sub={fmtN(pl.gastos)}      color="bg-rose-100"    icon={<TrendingDown size={14} className="text-rose-600"/>}   trend={false}/>
            <Kpi label="UTIL. OPERATIVA" val={`USD ${fmtK(pl.utilOp)}`}        sub={fmtN(pl.utilOp)}      color="bg-violet-100"  icon={<Activity size={14} className="text-violet-600"/>}  trend={pl.utilOp>=0}/>
            <Kpi label="MARGEN OPERAT."  val={pctFmt(pl.margenOp)}             sub="SOBRE INGRESOS"       color="bg-violet-100"  icon={<TrendingUp size={14} className="text-violet-600"/>}  trend={pl.margenOp>=0}/>
            <Kpi label="RESULTADO"       val={`USD ${fmtK(pl.resultado)}`}     sub={fmtN(pl.resultado)}   color="bg-indigo-100"  icon={<BarChart2 size={14} className="text-indigo-600"/>}   trend={pl.resultado>=0}/>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <p className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-1">INGRESOS VS COSTOS DE VENTAS + COSTOS OPERAT.</p>
              <ChartLegend items={[{label:'Ingresos',color:'#10b981'},{label:'Costo Ventas',color:'#f97316'},{label:'Costos Op.',color:'#f59e0b'},{label:'Gastos',color:'#e879f9'}]}/>
              <div className="mt-3">
                <SvgAreaChart data={trendData} series={[
                  {key:'ingresos',    label:'Ingresos',    color:'#10b981', width:2.5, area:true},
                  {key:'costoVentas', label:'Costo Ventas',color:'#f97316', width:2,   area:true},
                  {key:'costosOp',    label:'Costos Op.',  color:'#f59e0b', width:1.5, dash:'4 2'},
                  {key:'gastos',      label:'Gastos',      color:'#e879f9', width:1.5, dash:'2 3'},
                ]}/>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <p className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-1">RESULTADO DEL EJERCICIO POR MES</p>
              <ChartLegend items={[{label:'Positivo',color:'#6366f1'},{label:'Negativo',color:'#ef4444'}]}/>
              <div className="mt-3">
                <SvgBarChart data={trendData} series={[{key:'resultado',label:'Resultado',color:(v)=>v>=0?'#6366f1':'#ef4444'}]} refLine={0}/>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <p className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-1">EVOLUCIÓN DE MÁRGENES (%)</p>
              <ChartLegend items={[{label:'Margen Bruto',color:'#10b981'},{label:'Margen Operativo',color:'#8b5cf6'},{label:'Meta 30%',color:'#64748b'}]}/>
              <div className="mt-3">
                <SvgAreaChart data={trendData} height={180}
                  series={[
                    {key:'margenBruto',label:'Margen Bruto %',  color:'#10b981', width:2.5},
                    {key:'margenOp',   label:'Margen Operat. %',color:'#8b5cf6', width:2, dash:'3 2'},
                  ]} refLine={30}/>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <p className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-1">DESGLOSE DE COSTOS Y GASTOS POR MES</p>
              <ChartLegend items={[{label:'Costo Ventas',color:'#f97316'},{label:'Costos Op.',color:'#f59e0b'},{label:'Gastos',color:'#e879f9'}]}/>
              <div className="mt-3">
                <SvgStackedBar data={trendData} height={180} series={[
                  {key:'costoVentas', label:'Costo Ventas', color:'#f97316'},
                  {key:'costosOp',    label:'Costos Op.',   color:'#f59e0b'},
                  {key:'gastos',      label:'Gastos',       color:'#e879f9'},
                ]}/>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm mt-5">
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-4">RESUMEN ESTADO DE RESULTADO — {mes.toUpperCase()}</p>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11px]">
                <thead><tr className="bg-slate-50 border-b-2 border-slate-200">
                  <th className="px-4 py-2 font-black uppercase text-slate-500">CONCEPTO</th>
                  <th className="px-4 py-2 font-black uppercase text-slate-500 text-right">USD</th>
                  <th className="px-4 py-2 font-black uppercase text-slate-500 text-right">% INGRESOS</th>
                  <th className="px-4 py-2 font-black uppercase text-slate-500 text-right">VARIACIÓN</th>
                </tr></thead>
                <tbody>
                  {[
                    {label:'INGRESOS',          v:pl.ingresos,    bold:true,  color:'text-emerald-700', border:'border-b-2 border-emerald-200'},
                    {label:'(−) COSTO DE VENTAS',v:pl.costoVentas, bold:false, color:'text-orange-600',  border:'border-b border-slate-100'},
                    {label:'= UTILIDAD BRUTA',   v:pl.utilBruta,   bold:true,  color:pl.utilBruta>=0?'text-blue-700':'text-red-600', border:'border-b-2 border-blue-200'},
                    {label:'(−) COSTOS OPERAT.', v:pl.costosOp,    bold:false, color:'text-amber-600',   border:'border-b border-slate-100'},
                    {label:'= UTILIDAD OPERAT.', v:pl.utilOp,      bold:true,  color:pl.utilOp>=0?'text-violet-700':'text-red-600', border:'border-b-2 border-violet-200'},
                    {label:'(−) GASTOS',         v:pl.gastos,      bold:false, color:'text-rose-600',    border:'border-b border-slate-100'},
                    {label:'= RESULTADO NETO',   v:pl.resultado,   bold:true,  color:pl.resultado>=0?'text-indigo-700':'text-red-700', border:'border-t-2 border-indigo-300'},
                  ].map(row=>(
                    <tr key={row.label} className={`${row.border} ${row.bold?'bg-slate-50/80':''}`}>
                      <td className={`px-4 py-2.5 ${row.bold?'font-black':'font-bold'} text-slate-700 uppercase`}>{row.label}</td>
                      <td className={`px-4 py-2.5 text-right font-mono ${row.bold?'font-black':'font-bold'} ${row.color}`}>{fmtN(row.v)}</td>
                      <td className={`px-4 py-2.5 text-right font-mono text-slate-500 ${row.bold?'font-black':''}`}>{pl.ingresos>0?pctFmt(row.v/pl.ingresos*100):'—'}</td>
                      <td className="px-4 py-2.5 text-right">
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded ${row.v>=0?'bg-emerald-100 text-emerald-700':'bg-red-100 text-red-700'}`}>
                          {row.v>=0?'▲':'▼'} {pctFmt(Math.abs(row.v)/Math.max(pl.ingresos,1)*100)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section> : <div className="bg-white rounded-2xl border-t-4 border-slate-200 px-6 py-12 text-center shadow-sm"><p className="text-slate-400 font-black uppercase text-sm">SIN DATOS DE ESTADO DE RESULTADO PARA {mes.toUpperCase()}</p></div>}

        {hasBal ? <section>
          <div className="bg-white rounded-2xl border-t-4 border-indigo-500 px-6 py-4 shadow-sm mb-5 flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500">BALANCE GENERAL</p>
              <h2 className="text-xl font-black text-slate-900 uppercase">CORTE: {mes.toUpperCase()} {tasa>1?`· TASA: ${tasa} Bs/USD`:''}</h2>
            </div>
            <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase ${Math.abs(bal.activos-(bal.pasivos+bal.patrimonio))<1?'bg-emerald-100 text-emerald-700':'bg-red-100 text-red-700'}`}>
              {Math.abs(bal.activos-(bal.pasivos+bal.patrimonio))<1?'✓ ECUACIÓN CUADRADA':'⚠ REVISAR ECUACIÓN'}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
            <Kpi label="TOTAL ACTIVOS"    val={`USD ${fmtK(bal.activos)}`}    sub={fmtN(bal.activos)}    color="bg-indigo-100"  icon={<DollarSign size={14} className="text-indigo-600"/>}/>
            <Kpi label="TOTAL PASIVOS"    val={`USD ${fmtK(bal.pasivos)}`}    sub={fmtN(bal.pasivos)}    color="bg-red-100"     icon={<TrendingDown size={14} className="text-red-600"/>}   trend={false}/>
            <Kpi label="PATRIMONIO"       val={`USD ${fmtK(bal.patrimonio)}`} sub={fmtN(bal.patrimonio)} color="bg-purple-100"  icon={<Activity size={14} className="text-purple-600"/>}   trend={true}/>
            <Kpi label="PAS + PATRIMONIO" val={`USD ${fmtK(bal.pasivos+bal.patrimonio)}`} sub="TOTAL FINANCIAMIENTO" color="bg-blue-100" icon={<Scale size={14} className="text-blue-600"/>}/>
            <Kpi label="ENDEUDAMIENTO"    val={pctFmt(bal.endeudam)}           sub="PASIVO / ACTIVO"      color={bal.endeudam<70?"bg-emerald-100":"bg-amber-100"} icon={<BarChart2 size={14} className={bal.endeudam<70?"text-emerald-600":"text-amber-600"}/>} trend={bal.endeudam<70}/>
            <Kpi label="RAZ. CORRIENTE"   val={bal.razonCte.toFixed(2)+'x'}    sub="ACTIVO / PASIVO"      color={bal.razonCte>=1?"bg-teal-100":"bg-red-100"} icon={<TrendingUp size={14} className={bal.razonCte>=1?"text-teal-600":"text-red-600"}/>} trend={bal.razonCte>=1}/>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <p className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-3">ECUACIÓN PATRIMONIAL</p>
              <SvgHBar height={200} data={[
                {name:'ACTIVOS',    valor:parseFloat(bal.activos.toFixed(2)),          fill:'#6366f1'},
                {name:'PASIVOS',    valor:parseFloat(bal.pasivos.toFixed(2)),           fill:'#ef4444'},
                {name:'PATRIMONIO', valor:parseFloat(bal.patrimonio.toFixed(2)),        fill:'#8b5cf6'},
                {name:'PAS+PAT',    valor:parseFloat((bal.pasivos+bal.patrimonio).toFixed(2)),fill:'#3b82f6'},
              ]}/>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <p className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-3">COMPOSICIÓN DE ACTIVOS</p>
              <SvgDonut data={activosPie} size={180}/>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <p className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-4">ESTRUCTURA DE FINANCIAMIENTO</p>
              <div className="space-y-4">
                {[
                  {label:'ACTIVOS',    v:bal.activos,    tot:bal.activos, color:'bg-indigo-500'},
                  {label:'PASIVOS',    v:bal.pasivos,    tot:bal.activos, color:'bg-red-500'},
                  {label:'PATRIMONIO', v:bal.patrimonio, tot:bal.activos, color:'bg-purple-500'},
                ].map(({label,v,tot,color})=>{
                  const pct2=tot>0?(v/tot*100):0;
                  return <div key={label}>
                    <div className="flex justify-between mb-1">
                      <span className="text-[10px] font-black text-slate-600 uppercase">{label}</span>
                      <span className="text-[10px] font-black font-mono text-slate-800">USD {fmtK(v)} <span className="text-slate-400">({pct2.toFixed(1)}%)</span></span>
                    </div>
                    <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${color} transition-all duration-700`} style={{width:`${Math.min(pct2,100)}%`}}/>
                    </div>
                  </div>;
                })}
                <div className="border-t border-slate-100 pt-3">
                  <div className="flex justify-between">
                    <span className="text-[10px] font-black text-slate-500 uppercase">COBERTURA PATRIMONIAL</span>
                    <span className={`text-[11px] font-black ${bal.activos>0&&bal.patrimonio/bal.activos>0.3?'text-emerald-600':'text-amber-600'}`}>
                      {bal.activos>0?(bal.patrimonio/bal.activos*100).toFixed(1):'0'}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
            {[
              {label:'CAPITAL DE TRABAJO', val:`USD ${fmtK(bal.activos-bal.pasivos)}`, sub:'ACTIVOS − PASIVOS', border:bal.activos>bal.pasivos?'border-emerald-500':'border-red-500', bg:bal.activos>bal.pasivos?'bg-emerald-50':'bg-red-50'},
              {label:'NIVEL DE DEUDA',     val:pctFmt(bal.endeudam),            sub:'PASIVO / ACTIVO × 100', border:bal.endeudam<60?'border-green-500':'border-amber-500', bg:bal.endeudam<60?'bg-green-50':'bg-amber-50'},
              {label:'FINANCIAMIENTO PROPIO', val:pctFmt(bal.activos>0?bal.patrimonio/bal.activos*100:0), sub:'PATRIMONIO / ACTIVO × 100', border:'border-purple-500', bg:'bg-purple-50'},
              {label:'SOLIDEZ PATRIMONIAL', val:bal.pasivos>0?(bal.patrimonio/bal.pasivos).toFixed(2)+'x':'—', sub:'PATRIMONIO / PASIVO', border:'border-indigo-500', bg:'bg-indigo-50'},
            ].map(k=>(
              <div key={k.label} className={`${k.bg} rounded-2xl p-5 border-l-4 ${k.border} shadow-sm`}>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2">{k.label}</p>
                <p className="text-2xl font-black font-mono text-slate-900">{k.val}</p>
                <p className="text-[9px] text-slate-400 font-bold mt-1">{k.sub}</p>
              </div>
            ))}
          </div>
        </section> : <div className="bg-white rounded-2xl border-t-4 border-slate-200 px-6 py-12 text-center shadow-sm"><p className="text-slate-400 font-black uppercase text-sm">NO HAY BALANCE PARA {mes.toUpperCase()}</p></div>}
      </main>
    </div>
  );
}

// 11. VISTA: BALANCE DE COMPROBACIÓN
// ============================================================================
function BalanceComprobacionView({ onBack, dbData, tasaByMonth = {} }) {
  const MESES_ORDER = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

  const allMeses = useMemo(() => {
    const balMs = new Set(dbData.filter(isBalRecord).map(d=>d.month));
    const resMs = new Set(dbData.filter(isResRecord).map(d=>d.month));
    const realMonths = [...new Set([...resMs, ...balMs])].filter(m=>m!=='Saldos Iniciales' && m!=='Sin Mes');
    if (realMonths.length === 0 && balMs.has('Saldos Iniciales')) realMonths.push('Saldos Iniciales');
    return realMonths.sort((a,b)=>(MESES_ORDER.indexOf(a)+1||99)-(MESES_ORDER.indexOf(b)+1||99));
  }, [dbData]);

  const [selectedMonth, setSelectedMonth] = useState(() => allMeses[0] || 'Abril');
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [currency, setCurrency] = useState('both');

  const tasa = tasaByMonth[selectedMonth] || 1;
  const fmtR = v => new Intl.NumberFormat('es-VE',{minimumFractionDigits:2,maximumFractionDigits:2}).format(Math.abs(v||0));
  const showUSD = currency !== 'bs';
  const showBS  = currency !== 'usd';

  const rows = useMemo(() => {
    const exactBal = dbData.filter(d => d.month === selectedMonth && isBalRecord(d));
    const initBal  = dbData.filter(d => d.month === 'Saldos Iniciales' && isBalRecord(d));
    const balData  = exactBal.length > 0 ? exactBal : initBal;

    const resData  = dbData.filter(d => d.month === selectedMonth && isResRecord(d));

    const map = {};
    [...balData, ...resData].forEach(item => {
      const code = item.name.match(/^(\d[\d\.]+)/)?.[1] || null;
      if (!code) return;
      const key = item.name.trim().toUpperCase();
      if (!map[key]) map[key] = { name: key, code, usd: 0, bs: 0 };
      map[key].usd += item.usd || 0;
      map[key].bs  += item.bs  || 0;
    });

    return Object.values(map)
      .filter(r => r.usd !== 0 || r.bs !== 0)
      .sort((a,b) => a.code.localeCompare(b.code, undefined, {numeric:true}));
  }, [dbData, selectedMonth]);

  const filtered = useMemo(() => {
    let rs = rows;
    if (filterType !== 'all') rs = rs.filter(r => r.code.startsWith(filterType));
    if (search.trim()) {
      const q = search.toUpperCase();
      rs = rs.filter(r => r.name.includes(q));
    }
    return rs;
  }, [rows, filterType, search]);

  const totDeudorUSD  = filtered.filter(r=>r.usd>0).reduce((s,r)=>s+r.usd,0);
  const totAcreedUSD  = filtered.filter(r=>r.usd<0).reduce((s,r)=>s+Math.abs(r.usd),0);
  const totDeudorBS   = filtered.filter(r=>r.bs>0).reduce((s,r)=>s+r.bs,0);
  const totAcreedBS   = filtered.filter(r=>r.bs<0).reduce((s,r)=>s+Math.abs(r.bs),0);
  const cuadra = Math.abs(totDeudorUSD - totAcreedUSD) < 0.10;

  const groupLabel = {
    '1':'ACTIVOS (1)','2':'PASIVOS (2)','3':'PATRIMONIO (3)',
    '4':'INGRESOS (4)','5':'COSTOS (5)','6':'GASTOS (6)',
  };
  const groupColor = {
    '1':'bg-blue-900 text-blue-300','2':'bg-red-900 text-red-300',
    '3':'bg-purple-900 text-purple-300','4':'bg-emerald-900 text-emerald-300',
    '5':'bg-amber-900 text-amber-300','6':'bg-orange-900 text-orange-300',
  };

  const exportComprobacionExcel = async () => {
    try {
      const XL = await loadSheetJS();
      const n = v => parseFloat((v||0).toFixed(2));
      const nCols = showUSD && showBS ? 6 : showUSD ? 4 : 4;
      const colHeaders = ['CÓDIGO','CUENTA / DESCRIPCIÓN',
        ...(showUSD?['DEUDOR USD','ACREEDOR USD']:[]),
        ...(showBS ?['DEUDOR Bs.','ACREEDOR Bs.'  ]:[]),
      ];
      const ws = {}; let r = 1;
      for(let i=0;i<8;i++){for(let c=0;c<nCols;c++) ws[String.fromCharCode(65+c)+r]=mkCell('',{}); r++;}
      applyHeaderRow(ws, r, colHeaders, XS.TEAL); r++;
      let prevGrp = '';
      filtered.forEach(row => {
        const grp = row.code[0];
        if (grp !== prevGrp) {
          const grpColors={'1':'1E3A5F','2':'3B1219','3':'2E1065','4':'064E3B','5':'78350F','6':'431407'};
          const grpFonts={'1':'93C5FD','2':'FCA5A5','3':'D8B4FE','4':'6EE7B7','5':'FCD34D','6':'FDBA74'};
          const bg=grpColors[grp]||'111827'; const fg=grpFonts[grp]||'FFFFFF';
          const grpSt={fill:{patternType:'solid',fgColor:{rgb:bg}},font:{name:'Arial',bold:true,color:{rgb:fg},sz:10},alignment:{horizontal:'left',vertical:'center'},border:{top:{style:'medium',color:{rgb:XS.TEAL}}}};
          for(let c=0;c<nCols;c++) ws[String.fromCharCode(65+c)+r]={v:c===0?groupLabel[grp]:'',t:'s',s:grpSt};
          r++; prevGrp=grp;
        }
        const isD=row.usd>=0;
        const bg=r%2===0?'FFFFFF':'F0FDFA';
        const bdr={bottom:{style:'hair',color:{rgb:'E5E7EB'}}};
        const rowVals=['CÓDIGO','CUENTA',...(showUSD?['DU','AU']:[]),...(showBS?['DB','AB']:[])];
        const vals=[row.code, row.name.replace(/^\d[\d.]*-?/,''),
          ...(showUSD?[row.usd>0?n(row.usd):null, row.usd<0?n(Math.abs(row.usd)):null]:[]),
          ...(showBS ?[row.bs>0?n(row.bs):null,   row.bs<0?n(Math.abs(row.bs)):null  ]:[]),
        ];
        vals.forEach((v,ci)=>{
          const addr=String.fromCharCode(65+ci)+r;
          const isNum=ci>=2; const isAcr=ci===3||ci===5;
          ws[addr]={v:v??'',t:typeof v==='number'?'n':'s',s:{
            fill:{patternType:'solid',fgColor:{rgb:bg}},
            font:{name:'Arial',bold:false,color:{rgb:isAcr?'B91C1C':'0D9488'},sz:9},
            alignment:{horizontal:isNum?'right':ci===0?'center':'left',vertical:'center'},
            border:bdr,...(isNum&&v!=null?{numFmt:XS.NUM}:{})}};
        });
        r++;
      });
      const totVals=[['',  'TOTAL DEUDOR',   ...(showUSD?[n(totDeudorUSD), null]:[]), ...(showBS?[n(totDeudorBS), null]:[])],
                     ['',  'TOTAL ACREEDOR',  ...(showUSD?[null, n(totAcreedUSD)]:[]), ...(showBS?[null, n(totAcreedBS)]:[])],
                     ['',  cuadra?'✓ CUADRADO':'DIFERENCIA', ...(showUSD?[n(Math.abs(totDeudorUSD-totAcreedUSD)),null]:[]),...(showBS?[n(Math.abs(totDeudorBS-totAcreedBS)),null]:[])],
      ];
      totVals.forEach(tv => {
        tv.forEach((v,ci) => { ws[String.fromCharCode(65+ci)+r]=footerCell(v??'', ci===1?(cuadra?'10B981':XS.AMBER):ci===2||ci===4?'0D9488':'B91C1C', ci>=2&&v!=null); }); r++;
      });
      ws['!ref']=`A1:${String.fromCharCode(65+nCols-1)}${r}`;
      ws['!cols']=[{wch:18},{wch:52},...(showUSD?[{wch:18},{wch:18}]:[]),...(showBS?[{wch:20},{wch:20}]:[])];
      applyLetterhead(ws,'BALANCE DE COMPROBACIÓN',`Período: ${selectedMonth}  |  Tasa: ${tasa} Bs/USD`,nCols);
      const wb=XL.utils.book_new();
      XL.utils.book_append_sheet(wb,ws,'Balance de Comprobación');
      XL.writeFile(wb,`BalanceComprobacion_${selectedMonth}_${new Date().toLocaleDateString('es-VE').replace(/\//g,'-')}.xlsx`);
    } catch(e){alert('Error: '+e.message);}
  };

  const handlePrint = () => {
    const fmtP = v => new Intl.NumberFormat('es-VE',{minimumFractionDigits:2,maximumFractionDigits:2}).format(Math.abs(v||0));
    const colHeaders = ['<th>Código</th><th>Cuenta / Descripción</th>',
      ...(showUSD?['<th style="text-align:right">Deudor USD</th><th style="text-align:right">Acreedor USD</th>']:[]),
      ...(showBS ?['<th style="text-align:right">Deudor Bs.</th><th style="text-align:right">Acreedor Bs.</th>']:[]),
    ].join('');
    let prev = '';
    const rows_html = filtered.map(r => {
      const grp = r.code[0];
      let sep = '';
      if (grp !== prev) { sep = `<tr class="section"><td colspan="6">${groupLabel[grp]||grp}</td></tr>`; prev=grp; }
      return `${sep}<tr>
        <td style="font-size:8pt;color:#666">${r.code}</td>
        <td>${r.name.replace(/^\d[\d.]*-?/,'')}</td>
        ${showUSD?`<td style="text-align:right">${r.usd>0?fmtP(r.usd):''}</td><td style="text-align:right">${r.usd<0?fmtP(Math.abs(r.usd)):''}</td>`:''}
        ${showBS ?`<td style="text-align:right">${r.bs>0?fmtP(r.bs):''}</td><td style="text-align:right">${r.bs<0?fmtP(Math.abs(r.bs)):''}</td>`:''}
      </tr>`;
    }).join('');
    printReport(
      `<h1>Balance de Comprobación</h1><h2>Período: ${selectedMonth} | Tasa: ${tasa} Bs/USD</h2>`,
      `<table><thead><tr>${colHeaders}</tr></thead><tbody>${rows_html}
      <tr class="grand-total"><td colspan="2">TOTAL DEUDOR</td>${showUSD?`<td style="text-align:right">${fmtP(totDeudorUSD)}</td><td></td>`:''}${showBS?`<td style="text-align:right">${fmtP(totDeudorBS)}</td><td></td>`:''}</tr>
      <tr class="grand-total"><td colspan="2">TOTAL ACREEDOR</td>${showUSD?`<td></td><td style="text-align:right">${fmtP(totAcreedUSD)}</td>`:''}${showBS?`<td></td><td style="text-align:right">${fmtP(totAcreedBS)}</td>`:''}</tr>
      </tbody></table>`
    );
  };

  return (
    <div className="min-h-screen" style={{background:'#f3f2ef',backgroundImage:'radial-gradient(circle,#c8c8c8 1px,transparent 1px)',backgroundSize:'22px 22px'}}>
      <header className="bg-[#111111] border-b-4 border-teal-500 px-6 py-3 flex justify-between items-center sticky top-0 z-30 shadow-lg flex-wrap gap-3">
        <div className="flex items-center gap-4 flex-wrap">
          <button onClick={onBack} className="flex items-center gap-2 font-black text-xs text-slate-400 uppercase hover:text-teal-400"><ArrowLeft size={16}/> Panel</button>
          <div className="flex items-center gap-2 border-l-2 border-slate-700 pl-4">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Período:</span>
            <select value={selectedMonth} onChange={e=>setSelectedMonth(e.target.value)} className="bg-teal-500/10 border border-teal-500/40 text-teal-300 text-xs rounded-lg p-1.5 font-black uppercase cursor-pointer outline-none">
              {allMeses.length > 0 ? allMeses.map(m=><option key={m}>{m}</option>) : <option>Sin datos</option>}
            </select>
          </div>
          <div className="relative border-l-2 border-slate-700 pl-4">
            <Search size={11} className="absolute left-7 top-1/2 -translate-y-1/2 text-slate-400"/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="BUSCAR CUENTA..." className="pl-8 pr-3 py-1.5 bg-slate-800 border border-slate-700 text-slate-300 rounded-lg text-xs outline-none w-44"/>
          </div>
          <select value={filterType} onChange={e=>setFilterType(e.target.value)} className="bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded-lg p-1.5 outline-none">
            <option value="all">TODAS LAS CUENTAS</option>
            {['1','2','3','4','5','6'].map(k=><option key={k} value={k}>{groupLabel[k]}</option>)}
          </select>
          <div className="flex gap-1 bg-slate-800 p-1 rounded-lg border border-slate-700">
            {[['both','USD + Bs'],['usd','Solo USD'],['bs','Solo Bs']].map(([v,lbl])=>(
              <button key={v} onClick={()=>setCurrency(v)} className={`px-3 py-1.5 rounded text-[10px] font-black uppercase transition-colors ${currency===v?'bg-teal-500 text-white':'text-slate-400 hover:text-white hover:bg-slate-700'}`}>{lbl}</button>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={exportComprobacionExcel} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest shadow-md transition-colors">
            <FileSpreadsheet size={13}/> Excel
          </button>
          <button onClick={handlePrint} className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-3 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest shadow-md transition-colors">
            <FileText size={13}/> PDF
          </button>
        </div>
      </header>

      <main className="p-4 md:p-8 max-w-7xl mx-auto pb-16">
        <div className="bg-white px-8 py-6 border-t-4 border-teal-500 shadow-md flex flex-col items-center text-center mb-6 rounded-b-2xl">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-500 mb-1">SERVICIOS JIRET G&B, C.A.</p>
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-1">BALANCE DE COMPROBACIÓN</h1>
          <p className="text-teal-600 font-black uppercase bg-teal-50 px-5 py-1.5 rounded-full text-[10px] border border-teal-200 mt-2">
            PERÍODO: {selectedMonth.toUpperCase()} {tasa > 1 ? `· TASA: ${tasa} Bs/USD` : ''}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
          {[
            ...(showUSD?[
              {label:'TOTAL DEUDOR USD',   val:`USD ${fmtR(totDeudorUSD)}`,  color:'text-teal-700',   bg:'bg-teal-50 border-teal-200'},
              {label:'TOTAL ACREEDOR USD', val:`USD ${fmtR(totAcreedUSD)}`,  color:'text-orange-700', bg:'bg-orange-50 border-orange-200'},
            ]:[]),
            ...(showBS?[
              {label:'TOTAL DEUDOR Bs.',   val:`Bs. ${fmtR(totDeudorBS)}`,   color:'text-teal-600',   bg:'bg-white border-slate-200'},
              {label:'TOTAL ACREEDOR Bs.', val:`Bs. ${fmtR(totAcreedBS)}`,   color:'text-slate-700',  bg:'bg-white border-slate-200'},
            ]:[]),
            {label:'DIFERENCIA USD', val:cuadra?'✓ CUADRADO':`USD ${fmtR(totDeudorUSD-totAcreedUSD)}`,
             color:cuadra?'text-emerald-600':'text-red-600', bg:cuadra?'bg-emerald-50 border-emerald-200':'bg-red-50 border-red-200'},
          ].map(k=>(
            <div key={k.label} className={`rounded-xl p-4 border ${k.bg} shadow-sm`}>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">{k.label}</p>
              <p className={`text-sm font-black font-mono ${k.color}`}>{k.val}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-3 mb-4 flex-wrap">
          {[
            {label:`BALANCE (1-3): ${rows.filter(r=>/^[123]/.test(r.code)).length} CUENTAS`, color:'text-blue-600 bg-blue-50 border-blue-200'},
            {label:`RESULTADO (4-6): ${rows.filter(r=>/^[456]/.test(r.code)).length} CUENTAS`, color:'text-emerald-600 bg-emerald-50 border-emerald-200'},
          ].map(b=>(
            <span key={b.label} className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border ${b.color}`}>{b.label}</span>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#111111] text-[9px] uppercase font-black text-slate-300 sticky top-0">
              <tr>
                <th className="px-3 py-4 w-[36%]">CUENTA / DESCRIPCIÓN</th>
                {showUSD && <th className="px-3 py-4 text-right text-teal-400">DEUDOR USD</th>}
                {showUSD && <th className="px-3 py-4 text-right text-orange-400">ACREEDOR USD</th>}
                {showBS  && <th className="px-3 py-4 text-right text-teal-300 hidden md:table-cell">DEUDOR Bs.</th>}
                {showBS  && <th className="px-3 py-4 text-right text-orange-300 hidden md:table-cell">ACREEDOR Bs.</th>}
                <th className="px-3 py-4 text-center text-slate-400 w-12">NAT.</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                let prevGrp = '';
                return filtered.map((row, i) => {
                  const grp = row.code[0];
                  const showGrpHeader = grp !== prevGrp;
                  prevGrp = grp;
                  const isDeudor = row.usd >= 0;
                  return (
                    <React.Fragment key={i}>
                      {showGrpHeader && (
                        <tr className={groupColor[grp]||'bg-slate-800 text-slate-300'}>
                          <td colSpan={2+(showUSD?2:0)+(showBS?2:0)} className="px-4 py-2 font-black text-[10px] uppercase tracking-widest">
                            {groupLabel[grp] || `GRUPO ${grp}`}
                          </td>
                        </tr>
                      )}
                      <tr className={`border-b border-slate-100 hover:bg-teal-50/30 transition-colors ${i%2===0?'bg-white':'bg-slate-50/40'}`}>
                        <td className="px-3 py-2.5 uppercase text-[10px] font-bold text-slate-800 truncate max-w-[300px]" title={row.name}>
                          <span className="text-slate-400 mr-1.5 font-mono text-[9px]">{row.code}</span>
                          {row.name.replace(/^\d[\d.]*-?/,'').trim()}
                        </td>
                        {showUSD && <td className="px-3 py-2.5 text-right font-mono text-[11px] text-teal-700 font-bold">{row.usd>0?fmtR(row.usd):''}</td>}
                        {showUSD && <td className="px-3 py-2.5 text-right font-mono text-[11px] text-orange-700 font-bold">{row.usd<0?fmtR(Math.abs(row.usd)):''}</td>}
                        {showBS  && <td className="px-3 py-2.5 text-right font-mono text-[10px] text-teal-600 hidden md:table-cell">{row.bs>0?fmtR(row.bs):''}</td>}
                        {showBS  && <td className="px-3 py-2.5 text-right font-mono text-[10px] text-orange-600 hidden md:table-cell">{row.bs<0?fmtR(Math.abs(row.bs)):''}</td>}
                        <td className="px-3 py-2.5 text-center">
                          <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${isDeudor?'bg-teal-100 text-teal-700':'bg-orange-100 text-orange-700'}`}>{isDeudor?'D':'A'}</span>
                        </td>
                      </tr>
                    </React.Fragment>
                  );
                });
              })()}
              <tr className="bg-[#111111] text-white font-black border-t-4 border-teal-500">
                <td className="px-4 py-5 text-sm uppercase tracking-widest">TOTALES</td>
                {showUSD && <td className="px-3 py-5 text-right font-mono text-teal-400 text-sm">{fmtR(totDeudorUSD)}</td>}
                {showUSD && <td className="px-3 py-5 text-right font-mono text-orange-400 text-sm">{fmtR(totAcreedUSD)}</td>}
                {showBS  && <td className="px-3 py-5 text-right font-mono text-teal-300 hidden md:table-cell">{fmtR(totDeudorBS)}</td>}
                {showBS  && <td className="px-3 py-5 text-right font-mono text-orange-300 hidden md:table-cell">{fmtR(totAcreedBS)}</td>}
                <td className="px-3 py-5 text-center">
                  <span className={`text-[9px] font-black px-2 py-1 rounded ${cuadra?'bg-emerald-500':'bg-red-500'}`}>{cuadra?'✓':'✗'}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-center text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-4">{filtered.length} CUENTAS MOSTRADAS · {rows.length} TOTAL</p>
      </main>
    </div>
  );
}

// ============================================================================
// 12. APP PRINCIPAL
// ============================================================================
// ============================================================================
// StepCard: definido a NIVEL DE MÓDULO (no dentro de ReportesFinancierosApp)
// a propósito — si se define dentro de un componente que se re-renderiza
// seguido (como el reloj en vivo del panel, que actualiza cada segundo),
// React lo trata como un componente "nuevo" en cada render y lo desmonta/
// remonta constantemente, lo que puede cortar la selección de archivo
// mientras el diálogo del sistema operativo sigue abierto.
// ============================================================================
// ============================================================================
// isResRecord / isBalRecord: definidos UNA sola vez a nivel de módulo y
// reutilizados tanto al guardar los datos (handleUploadResultados/Saldos)
// como al calcular los indicadores "Sin cargar / Listo" de Configuración.
// Antes había dos copias de esta lógica (una para guardar, otra para
// mostrar el estado) y se desincronizaron: un nombre de proveedor que
// empieza con un dígito (ej. "261 Agencia de Viajes") hacía que el
// indicador de Balance se marcara como cargado aunque el dato real
// guardado fuera de Estado de Resultado.
// ============================================================================
const isResRecord = (p) => {
  const pathUp = (p.path||'').toUpperCase();
  return !pathUp.includes('ACTIVO') && !pathUp.includes('PASIVO') && !pathUp.includes('PATRIMONIO') && !/^[123]\.\d/.test(p.name);
};
const isBalRecord = (p) => {
  const pathUp = (p.path||'').toUpperCase();
  return pathUp.includes('ACTIV') || pathUp.includes('PASIV') || pathUp.includes('PATRIMON') || /^[123]\.\d/.test(p.name);
};

const StepCard = ({ num, title, subtitle, isGlobal, loaded, countLabel, onUpload, onClear, accentClass, accept="*.xlsx,*.xls,*.csv,*.txt" }) => (
  <div className={`rounded-xl p-4 flex items-center justify-between gap-4 flex-wrap border ${loaded ? 'bg-emerald-950/30 border-emerald-700' : 'bg-slate-900 border-slate-700'} ${accentClass||''}`}>
    <div className="flex items-center gap-4 min-w-0">
      <div className="flex flex-col items-start gap-1.5 flex-shrink-0 w-14">
        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Paso {String(num).padStart(2,'0')}</span>
        <div className="flex gap-1 flex-wrap">
          {isGlobal && <span className="text-[8px] font-black uppercase bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded">Global</span>}
          {loaded && <span className="text-[8px] font-black uppercase bg-emerald-600 text-white px-1.5 py-0.5 rounded flex items-center gap-0.5"><CheckCircle size={8}/>Listo</span>}
        </div>
      </div>
      <div className="min-w-0">
        <p className="font-black text-white text-sm uppercase truncate">{title}</p>
        <p className="text-[10px] text-slate-400 truncate">{subtitle}</p>
      </div>
    </div>
    <div className="flex items-center gap-3 flex-shrink-0">
      <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap hidden sm:inline">{loaded ? countLabel : 'Sin cargar'}</span>
      {loaded ? (
        <div className="flex gap-2">
          <label className="bg-slate-700 hover:bg-slate-600 text-white text-[10px] font-black uppercase px-3 py-2 rounded-lg cursor-pointer flex items-center gap-1.5 whitespace-nowrap transition-colors">
            <Upload size={11}/> Reemplazar
            <input type="file" multiple accept={accept} className="hidden" onChange={onUpload}/>
          </label>
          {onClear && <button onClick={onClear} className="text-red-400 hover:text-red-300 text-[10px] font-black uppercase flex items-center gap-1 whitespace-nowrap"><Trash2 size={11}/> Limpiar</button>}
        </div>
      ) : (
        <label className="bg-orange-500 hover:bg-orange-600 text-white text-[10px] font-black uppercase px-4 py-2.5 rounded-lg cursor-pointer flex items-center gap-1.5 whitespace-nowrap transition-colors">
          <Upload size={11}/> Cargar
          <input type="file" multiple accept={accept} className="hidden" onChange={onUpload}/>
        </label>
      )}
    </div>
  </div>
);

const MiniSparkline = ({ points, color }) => {
  const w=140,h=44;
  const max=Math.max(...points), min=Math.min(...points), range=(max-min)||1;
  const xs = points.map((_,i)=>i/(points.length-1)*w);
  const ys = points.map(p=>h-2-((p-min)/range)*(h-4));
  const pts = xs.map((x,i)=>`${x},${ys[i]}`).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-11">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
};
const MiniBars = ({ values, color, highlightIdx }) => {
  const w=140,h=44,gap=4,bw=w/values.length-gap;
  const max=Math.max(...values,1);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-11">
      {values.map((v,i)=>{
        const bh=Math.max((v/max)*(h-2),2);
        return <rect key={i} x={i*(bw+gap)} y={h-bh} width={bw} height={bh} rx={2} fill={highlightIdx===i?color:'#e2e8f0'}/>;
      })}
    </svg>
  );
};
const MiniProgressRows = ({ rows }) => (
  <div className="flex flex-col gap-2.5 w-full py-2">
    {rows.map((r,i)=>(
      <div key={i} className="flex gap-1">
        {r.map((seg,j)=>(<div key={j} className="h-2.5 rounded-full flex-1" style={{background:seg}}/>))}
      </div>
    ))}
  </div>
);

function ReportesFinancierosApp() {
  const [currentView, setCurrentView] = useState('panel');
  const [dbData, setDbData] = useState(() => { try { const s=JSON.parse(localStorage.getItem('jiret_erp_db_data')||'null'); return (Array.isArray(s)&&s.length)?s:((JIRET_SEED_DATA&&JIRET_SEED_DATA.dbData)||[]); } catch(e){ return ((JIRET_SEED_DATA&&JIRET_SEED_DATA.dbData)||[]); } });
  const [planCuentas, setPlanCuentas] = useState(() => { try { const s=JSON.parse(localStorage.getItem('jiret_erp_plan_cuentas')||'null'); return s||(JIRET_SEED_DATA.planCuentas||{}); } catch(e){ return JIRET_SEED_DATA.planCuentas||{}; } });
  const [tasaByMonth, setTasaByMonth] = useState(() => { try { const s=JSON.parse(localStorage.getItem('jiret_erp_tasa_by_month')||'null'); return s||(JIRET_SEED_DATA.tasaByMonth||{}); } catch(e){ return JIRET_SEED_DATA.tasaByMonth||{}; } });
  const [auxByMonth, setAuxByMonth] = useState(() => { try { const s=JSON.parse(localStorage.getItem('jiret_erp_aux_by_month')||'null'); return s||(JIRET_SEED_DATA.auxByMonth||{}); } catch(e){ return JIRET_SEED_DATA.auxByMonth||{}; } });
  const [afByMonth, setAfByMonth] = useState(() => { try { const s=JSON.parse(localStorage.getItem('jiret_erp_af_by_month')||'null'); return s||(JIRET_SEED_DATA.afByMonth||{}); } catch(e){ return JIRET_SEED_DATA.afByMonth||{}; } });
  const [activosFijosData, setActivosFijosData] = useState(() => { try { const s=JSON.parse(localStorage.getItem('jiret_erp_activos_fijos')||'null'); return s||(JIRET_SEED_DATA.activosFijosData||{records:[]}); } catch(e){ return JIRET_SEED_DATA.activosFijosData||{records:[]}; } });
  const [auxDataConfig, setAuxDataConfig] = useState(() => { try { const s=JSON.parse(localStorage.getItem('jiret_erp_aux_data_config')||'null'); return s||(JIRET_SEED_DATA.auxDataConfig||{}); } catch(e){ return JIRET_SEED_DATA.auxDataConfig||{}; } });
  const [configMes, setConfigMes] = useState('Abril');

  // ==========================================================================
  // TEMPORAL — solo para depurar el caso de Montacargas. Expone los datos
  // reales de Activos Fijos a la consola del navegador (F12 → Console).
  // No afecta nada del funcionamiento normal de la app.
  // ==========================================================================
  useEffect(() => {
    window.__DEBUG_AF = { activosFijosData, afByMonth };
  });
  const MESES_CFG = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

  useEffect(() => { try { localStorage.setItem('jiret_erp_db_data', JSON.stringify(dbData)); } catch(e){} }, [dbData]);
  useEffect(() => { try { localStorage.setItem('jiret_erp_plan_cuentas', JSON.stringify(planCuentas)); } catch(e){} }, [planCuentas]);
  useEffect(() => { try { localStorage.setItem('jiret_erp_tasa_by_month', JSON.stringify(tasaByMonth)); } catch(e){} }, [tasaByMonth]);
  useEffect(() => { try { localStorage.setItem('jiret_erp_aux_by_month', JSON.stringify(auxByMonth)); } catch(e){} }, [auxByMonth]);
  useEffect(() => { try { localStorage.setItem('jiret_erp_af_by_month', JSON.stringify(afByMonth)); } catch(e){} }, [afByMonth]);
  useEffect(() => { try { localStorage.setItem('jiret_erp_activos_fijos', JSON.stringify(activosFijosData)); } catch(e){} }, [activosFijosData]);
  useEffect(() => { try { localStorage.setItem('jiret_erp_aux_data_config', JSON.stringify(auxDataConfig)); } catch(e){} }, [auxDataConfig]);

  const getAuxForMonth = (mes) => auxByMonth[mes] || { cxc_general:[], cxc_zuliana:[], cxp_autototal:[], cxp_surepack:[], cxp_pacomela:[], cxp_yancarlos:[], cxp_general:[] };

  const handleUploadResultados = async (e) => {
    if (!e.target.files.length) return;
    try {
      const parsed = await processFiles(e.target.files);
      const resParsed = parsed.filter(isResRecord);
      setDbData(prev => {
        const meses = new Set(parsed.map(p => p.month));
        const kept = prev.filter(d => !meses.has(d.month) || !isResRecord(d));
        return [...kept, ...resParsed];
      });
      alert(`✅ Estado de Resultado: ${resParsed.length} registros procesados`);
    } catch(err) { alert('❌ Error Estado de Resultado: '+err.message); } e.target.value='';
  };

  const handleUploadPlan = async (e) => {
    if (!e.target.files.length) return;
    try {
      const plan = await processPlanCuentas(e.target.files[0]);
      setPlanCuentas(plan);
      alert(`✅ Plan de Cuentas: ${Object.keys(plan).length} cuentas cargadas`);
    } catch(err) { alert('❌ Error Plan de Cuentas: '+err.message); } e.target.value='';
  };

  const handleUploadSaldos = async (e) => {
    if (!e.target.files.length) return;
    try {
      const parsed = await processSaldosBalance(e.target.files[0], planCuentas);
      // FIX: antes se usaba el mes detectado del NOMBRE del archivo (ej. un
      // archivo "Balance_Mayo...xlsx" se guardaba como Mayo aunque en pantalla
      // estuvieras en Junio). Ahora siempre se guarda bajo el mes seleccionado
      // en el dropdown "Mes de carga", igual que Estado de Resultado/CxC/CxP.
      const balParsed = parsed.filter(isBalRecord).map(p => ({ ...p, month: configMes }));
      setDbData(prev => [...prev.filter(d => d.month !== configMes || !isBalRecord(d)), ...balParsed]);
      alert(`✅ Balance / Saldos (${configMes}): ${balParsed.length} cuentas`);
    } catch(err) { alert('❌ Error Balance/Saldos: '+err.message); } e.target.value='';
  };

  // ==========================================================================
  // FIX: handleUploadCxC / handleUploadCxP ahora pasan expectedType a
  // processAuxFile para que lo no reconocido caiga en el bucket correcto
  // según el botón usado, en vez de ir siempre a "cxp_general".
  // ==========================================================================
  const handleUploadCxC = async (e) => {
    if (!e.target.files.length) return;
    try {
      const parsed = await processAuxFile(e.target.files, 'cxc');
      const tot = Object.values(parsed).reduce((s, arr) => s + arr.length, 0);
      setAuxByMonth(prev => {
        const merged = { ...getAuxForMonth(configMes) };
        merged.cxc_general = parsed.cxc_general;
        merged.cxc_zuliana = parsed.cxc_zuliana;
        ['cxp_autototal','cxp_surepack','cxp_pacomela','cxp_yancarlos','cxp_general'].forEach(k => {
          if (parsed[k] && parsed[k].length > 0) merged[k] = parsed[k];
        });
        return { ...prev, [configMes]: merged };
      });
      alert(`✅ CxC ${configMes}: ${tot} registros`);
    } catch(err){ alert("❌ Error CxC: "+err.message); } e.target.value='';
  };

  const handleUploadCxP = async (e) => {
    if (!e.target.files.length) return;
    try {
      const parsed = await processAuxFile(e.target.files, 'cxp');
      // FIX: antes solo se guardaban los buckets cxp_* — si el archivo de CxP
      // traía una cuenta clasificada como CxC (ej. Anticipos a Proveedores
      // Zuliana, 1.1.05.01.008), se calculaba bien pero se descartaba al
      // guardar. Ahora también se guarda ese bucket "cruzado", sin borrar
      // datos de CxC que vengan de otra carga si este archivo no trae nada ahí.
      const tot = Object.values(parsed).reduce((s, arr) => s + arr.length, 0);
      setAuxByMonth(prev => {
        const merged = { ...getAuxForMonth(configMes) };
        merged.cxp_autototal = parsed.cxp_autototal;
        merged.cxp_surepack  = parsed.cxp_surepack;
        merged.cxp_pacomela  = parsed.cxp_pacomela;
        merged.cxp_yancarlos = parsed.cxp_yancarlos;
        merged.cxp_general   = parsed.cxp_general;
        ['cxc_general','cxc_zuliana'].forEach(k => {
          if (parsed[k] && parsed[k].length > 0) merged[k] = parsed[k];
        });
        return { ...prev, [configMes]: merged };
      });
      alert(`✅ CxP ${configMes}: ${tot} registros`);
    } catch(err){ alert("❌ Error CxP: "+err.message); } e.target.value='';
  };

  const handleUploadActivosFijos = async (e) => {
    if (!e.target.files.length) return;
    try {
      const parsed = await processActivosFijosExcel(e.target.files);
      setAfByMonth(prev => ({ ...prev, [configMes]: parsed }));
      setActivosFijosData(parsed);
      alert(`✅ Activos Fijos (${configMes}): ${parsed.records.length} registros`);
    } catch(err) { alert('❌ Error Activos Fijos: '+err.message); } e.target.value='';
  };

  const onSaveTasa = (mes, val) => setTasaByMonth(prev => ({ ...prev, [mes]: val }));

  const clearSlot = (key) => {
    if (!window.confirm('¿Seguro que deseas borrar estos datos?')) return;
    if (key === 'resultados') setDbData(prev => prev.filter(d => !isResRecord(d)));
    else if (key === 'plan') setPlanCuentas({});
    else if (key === 'saldos') setDbData(prev => prev.filter(d => !isBalRecord(d)));
    else if (key === 'cxc') setAuxByMonth(prev => ({ ...prev, [configMes]: { ...getAuxForMonth(configMes), cxc_general:[], cxc_zuliana:[] } }));
    else if (key === 'cxp') setAuxByMonth(prev => ({ ...prev, [configMes]: { ...getAuxForMonth(configMes), cxp_autototal:[], cxp_surepack:[], cxp_pacomela:[], cxp_yancarlos:[], cxp_general:[] } }));
    else if (key === 'activos') { setAfByMonth(prev => ({ ...prev, [configMes]: { records:[] } })); setActivosFijosData({records:[]}); }
  };

  const handleDeleteMonth = (mes) => {
    if (!window.confirm(`¿Eliminar TODOS los datos cargados de "${mes}"? Esta acción no se puede deshacer.`)) return;
    setDbData(prev => prev.filter(d => d.month !== mes));
    setAuxByMonth(prev => { const c={...prev}; delete c[mes]; return c; });
    setAfByMonth(prev => { const c={...prev}; delete c[mes]; return c; });
    setTasaByMonth(prev => { const c={...prev}; delete c[mes]; return c; });
  };

  // ==========================================================================
  // Reloj en vivo (header del Panel Principal)
  // ==========================================================================
  const [clock, setClock] = useState(() => new Date());
  useEffect(() => { const t = setInterval(() => setClock(new Date()), 1000); return () => clearInterval(t); }, []);
  const DIAS_ABR = ['DOM','LUN','MAR','MIÉ','JUE','VIE','SÁB'];
  const MESES_ABR = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC'];
  const clockStr = `${String(clock.getHours()).padStart(2,'0')}:${String(clock.getMinutes()).padStart(2,'0')}:${String(clock.getSeconds()).padStart(2,'0')} · ${DIAS_ABR[clock.getDay()]} ${clock.getDate()} ${MESES_ABR[clock.getMonth()]}. ${clock.getFullYear()}`;

  // ==========================================================================
  // Meses en memoria + totales globales (para el Panel y Configuración)
  // ==========================================================================
  const MESES_ORDER_FULL = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const mesesEnMemoria = useMemo(() => {
    const set = new Set();
    dbData.forEach(d => { if (d.month && d.month !== 'Sin Mes') set.add(d.month); });
    Object.keys(auxByMonth||{}).forEach(m => { if (m!=='Sin Mes' && Object.values(auxByMonth[m]||{}).some(v=>Array.isArray(v)&&v.length)) set.add(m); });
    Object.keys(afByMonth||{}).forEach(m => { if (m!=='Sin Mes' && afByMonth[m]?.records?.length) set.add(m); });
    Object.keys(tasaByMonth||{}).forEach(m => { if (m!=='Sin Mes' && tasaByMonth[m]) set.add(m); });
    return set;
  }, [dbData, auxByMonth, afByMonth, tasaByMonth]);

  const totalCxCReg = useMemo(() => Object.values(auxByMonth).reduce((s,m)=>s+(m?.cxc_general?.length||0)+(m?.cxc_zuliana?.length||0),0), [auxByMonth]);
  const totalCxPReg = useMemo(() => Object.values(auxByMonth).reduce((s,m)=>s+(m?.cxp_autototal?.length||0)+(m?.cxp_surepack?.length||0)+(m?.cxp_pacomela?.length||0)+(m?.cxp_yancarlos?.length||0)+(m?.cxp_general?.length||0),0), [auxByMonth]);
  const totalActivosReg = useMemo(() => {
    const fromMonths = Object.values(afByMonth).reduce((s,m)=>s+(m?.records?.length||0),0);
    return fromMonths || (activosFijosData?.records?.length || 0);
  }, [afByMonth, activosFijosData]);

  // ==========================================================================
  // Compartir con Directivos: exportar/importar paquete .json con todos los datos
  // ==========================================================================
  const handleExportPaquete = () => {
    try {
      const paquete = { dbData, planCuentas, tasaByMonth, auxByMonth, afByMonth, activosFijosData, auxDataConfig, exportedAt: new Date().toISOString() };
      const blob = new Blob([JSON.stringify(paquete)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `JIRET_Paquete_${new Date().toLocaleDateString('es-VE').replace(/\//g,'-')}.json`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch(err) { alert('❌ Error exportando paquete: '+err.message); }
  };
  const handleImportPaquete = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (data.dbData) setDbData(data.dbData);
      if (data.planCuentas) setPlanCuentas(data.planCuentas);
      if (data.tasaByMonth) setTasaByMonth(data.tasaByMonth);
      if (data.auxByMonth) setAuxByMonth(data.auxByMonth);
      if (data.afByMonth) setAfByMonth(data.afByMonth);
      if (data.activosFijosData) setActivosFijosData(data.activosFijosData);
      if (data.auxDataConfig) setAuxDataConfig(data.auxDataConfig);
      alert('✅ Paquete importado correctamente');
    } catch(err) { alert('❌ Error importando paquete: '+err.message); }
    e.target.value = '';
  };

  if (currentView === 'resultados')   return <EstadoResultadoView onBack={()=>setCurrentView('panel')} dbData={dbData} activosFijosData={activosFijosData}/>;
  if (currentView === 'balance')      return <BalanceGeneralView onBack={()=>setCurrentView('panel')} dbData={dbData} auxByMonth={auxByMonth} afByMonth={afByMonth} auxDataConfig={getAuxForMonth(configMes)} activosFijosData={activosFijosData} tasaByMonth={tasaByMonth} onSaveTasa={onSaveTasa}/>;
  if (currentView === 'comparativo')  return <AnalisisComparativoView onBack={()=>setCurrentView('panel')} dbData={dbData} activosFijosData={activosFijosData}/>;
  if (currentView === 'activos')      return <InversionesView onBack={()=>setCurrentView('panel')} activosFijosData={activosFijosData} setActivosFijosData={setActivosFijosData}/>;
  if (currentView === 'dashboard')    return <DashboardFinancieroView onBack={()=>setCurrentView('panel')} dbData={dbData} tasaByMonth={tasaByMonth} afByMonth={afByMonth} activosFijosData={activosFijosData}/>;
  if (currentView === 'comprobacion') return <BalanceComprobacionView onBack={()=>setCurrentView('panel')} dbData={dbData} tasaByMonth={tasaByMonth}/>;

  if (currentView === 'config') {
    const TAG_COLOR_CLASSES = {
      blue: 'bg-blue-600', emerald: 'bg-emerald-600', sky: 'bg-sky-600',
      rose: 'bg-rose-600', purple: 'bg-purple-600', amber: 'bg-amber-600',
    };

    const currentAux = getAuxForMonth(configMes);
    const cxcCount = (currentAux.cxc_general?.length||0) + (currentAux.cxc_zuliana?.length||0);
    const cxpCount = (currentAux.cxp_autototal?.length||0)+(currentAux.cxp_surepack?.length||0)+(currentAux.cxp_pacomela?.length||0)+(currentAux.cxp_yancarlos?.length||0)+(currentAux.cxp_general?.length||0);
    const afCount = afByMonth[configMes]?.records?.length || 0;
    const planCount = Object.keys(planCuentas).length;
    const planLoaded = planCount > 0;
    const balanceLoaded = dbData.some(d=>d.month===configMes && isBalRecord(d));
    const resultadoLoaded = dbData.some(d=>d.month===configMes && isResRecord(d));
    const mesesConPL = MESES_ORDER_FULL.filter(m => dbData.some(d=>d.month===m && isResRecord(d)));
    const resultadoSubtitle = mesesConPL.length > 0
      ? `Ya cargados: ${mesesConPL.filter(m=>m!==configMes).join(', ') || '—'} · Solo se agrega ${configMes}`
      : `Se agregará ${configMes}`;

    const datosGuardadosPorMes = MESES_ORDER_FULL.filter(m => mesesEnMemoria.has(m)).map(m => {
      const tags = [];
      if (dbData.some(d=>d.month===m && isBalRecord(d))) tags.push({label:'BAL', color:'blue'});
      if (dbData.some(d=>d.month===m && isResRecord(d))) tags.push({label:'P&L', color:'emerald'});
      const aux = auxByMonth[m] || {};
      if ((aux.cxc_general?.length||0)+(aux.cxc_zuliana?.length||0) > 0) tags.push({label:'CxC', color:'sky'});
      if ((aux.cxp_autototal?.length||0)+(aux.cxp_surepack?.length||0)+(aux.cxp_pacomela?.length||0)+(aux.cxp_yancarlos?.length||0)+(aux.cxp_general?.length||0) > 0) tags.push({label:'CxP', color:'rose'});
      if (afByMonth[m]?.records?.length > 0) tags.push({label:'AF', color:'purple'});
      if (tasaByMonth[m]) tags.push({label:'TASA', color:'amber'});
      return { mes: m, tags };
    });

    return (
      <div className="min-h-screen bg-[#0b0f19]">
        <header className="bg-[#111111] border-b-4 border-orange-500 px-6 py-3 flex justify-between items-center sticky top-0 z-30 shadow-lg flex-wrap gap-3">
          <button onClick={()=>setCurrentView('panel')} className="flex items-center gap-2 font-black text-xs text-slate-400 uppercase hover:text-orange-400"><ArrowLeft size={16}/> Panel</button>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Mes de carga:</span>
            <select value={configMes} onChange={e=>setConfigMes(e.target.value)} className="bg-orange-500/10 border border-orange-500/40 text-orange-300 text-xs rounded-lg p-1.5 font-black uppercase cursor-pointer outline-none">
              {MESES_CFG.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </header>
        <main className="p-4 md:p-8 max-w-4xl mx-auto pb-16 space-y-5">

          <div>
            <p className="text-orange-400 font-black text-sm uppercase tracking-widest mb-4 flex items-center gap-2"><Database size={16}/> Archivos — {configMes}</p>
            <div className="space-y-3">
              <StepCard num={1} title="Plan de Cuentas" subtitle="Aplica a todos los meses" isGlobal loaded={planLoaded}
                countLabel={`✓ ${planCount} cuentas cargadas`} onUpload={handleUploadPlan} onClear={()=>clearSlot('plan')} accept="*.txt,*.csv"/>
              <StepCard num={2} title={`Balance General — ${configMes}`} subtitle="Saldos de cuentas 1,2,3 del balance" loaded={balanceLoaded}
                countLabel="✓ cargado" onUpload={handleUploadSaldos} onClear={()=>clearSlot('saldos')}/>
              <StepCard num={3} title={`Estado de Resultado — ${configMes}`} subtitle={resultadoSubtitle} loaded={resultadoLoaded}
                countLabel="✓ cargado" onUpload={handleUploadResultados} onClear={()=>clearSlot('resultados')}/>
              <StepCard num={4} title={`Auxiliar CxC — ${configMes}`} subtitle="Cuentas por cobrar de clientes" loaded={cxcCount>0}
                countLabel={`✓ ${cxcCount} registros`} onUpload={handleUploadCxC} onClear={()=>clearSlot('cxc')} accentClass="border-l-4 border-l-blue-500"/>
              <StepCard num={5} title={`Auxiliar CxP — ${configMes}`} subtitle="Cuentas por pagar a proveedores" loaded={cxpCount>0}
                countLabel={`✓ ${cxpCount} registros`} onUpload={handleUploadCxP} onClear={()=>clearSlot('cxp')} accentClass="border-l-4 border-l-rose-500"/>
              <StepCard num={6} title={`Activos Fijos — ${configMes}`} subtitle="Inventario de activos fijos y depreciación" loaded={afCount>0}
                countLabel={`✓ ${afCount} registros`} onUpload={handleUploadActivosFijos} onClear={()=>clearSlot('activos')}/>
            </div>
          </div>

          {datosGuardadosPorMes.length > 0 && (
            <div className="bg-slate-900 rounded-2xl p-5 border border-slate-700">
              <p className="text-[11px] font-black text-emerald-400 uppercase tracking-widest mb-4 flex items-center gap-2"><CheckCircle size={13}/> Datos Guardados por Mes</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {datosGuardadosPorMes.map(({mes, tags}) => (
                  <div key={mes} className={`rounded-lg p-3 border ${mes===configMes ? 'bg-orange-950/40 border-orange-500' : 'bg-slate-800 border-slate-700'}`}>
                    <div className="flex items-center justify-between mb-1.5 gap-2">
                      <span className="font-black text-white text-xs uppercase truncate">{mes}</span>
                      {mes===configMes && <span className="text-[8px] font-black bg-orange-500 text-white px-1.5 py-0.5 rounded uppercase flex-shrink-0">Activo</span>}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {tags.length === 0 && <span className="text-[8px] text-slate-500 font-bold uppercase">Sin datos</span>}
                      {tags.map(t => <span key={t.label} className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded text-white ${TAG_COLOR_CLASSES[t.color]}`}>{t.label}</span>)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-indigo-950/40 border border-indigo-700 rounded-xl p-4 flex gap-3 items-start">
            <AlertTriangle size={16} className="text-indigo-400 flex-shrink-0 mt-0.5"/>
            <p className="text-[11px] text-indigo-200 font-bold leading-relaxed">
              Todo lo que cargues aquí se guarda <span className="text-indigo-100 font-black">exclusivamente para el mes {configMes.toUpperCase()}</span>. Los datos de otros meses no se modifican. Cada mes tiene su propio Balance, CxC, CxP, AF y Tasa.
            </p>
          </div>

          <div className="bg-slate-900 border border-amber-600/60 rounded-xl p-5 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-amber-400 font-black text-xs uppercase tracking-widest mb-1">Tasa de Cambio — {configMes}</p>
              <p className="text-[10px] text-slate-400">Tasa Bs/USD al cierre del mes. Se aplica al Balance y se guarda solo para {configMes}.</p>
            </div>
            <input type="number" min="0" step="0.01" value={tasaByMonth[configMes] ?? ''}
              onChange={e=>setTasaByMonth(prev=>({...prev,[configMes]:parseFloat(e.target.value)||0}))}
              placeholder="Ej: 90.00"
              className="bg-slate-800 border border-amber-600/40 text-amber-300 font-black text-sm rounded-lg px-4 py-2.5 w-36 outline-none"/>
          </div>

          <div className="bg-emerald-950/30 border border-emerald-700 rounded-xl p-4">
            <p className="text-emerald-400 font-black text-[11px] uppercase tracking-widest mb-3 flex items-center gap-2"><CheckCircle size={13}/> Estado de Resultado — Meses ya en Memoria (no se pierden)</p>
            <div className="flex flex-wrap gap-2">
              {mesesConPL.filter(m=>m!==configMes).map(m => <span key={m} className="text-[10px] font-black uppercase bg-emerald-700 text-white px-2.5 py-1 rounded-full">{m}</span>)}
              <span className="text-[10px] font-black uppercase bg-slate-700 text-slate-300 px-2.5 py-1 rounded-full">{configMes} — {resultadoLoaded ? 'cargado' : 'pendiente'}</span>
            </div>
          </div>

          <div className="bg-violet-950/30 border border-violet-700 rounded-xl p-5">
            <p className="text-violet-300 font-black text-[11px] uppercase tracking-widest mb-1.5 flex items-center gap-2"><FileOutput size={13}/> Compartir con Directivos</p>
            <p className="text-[10px] text-slate-400 mb-4 leading-relaxed">
              Exporta <span className="text-slate-200 font-bold">todos los datos cargados</span> en un archivo .json. Los directivos lo importan una sola vez y ven la información actualizada — sin adjuntar ningún archivo contable.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button onClick={handleExportPaquete} className="flex-1 bg-violet-600 hover:bg-violet-700 text-white font-black text-xs uppercase tracking-wide py-3 rounded-xl flex items-center justify-center gap-2 transition-colors">
                <FileOutput size={14}/> Exportar Paquete
              </button>
              <label className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-black text-xs uppercase tracking-wide py-3 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors">
                <Upload size={14}/> Importar Paquete
                <input type="file" accept=".json" className="hidden" onChange={handleImportPaquete}/>
              </label>
            </div>
            <p className="text-center text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-4">Incluye: Balance · Estado de Resultado · CxC · CxP · Activos Fijos · Tasas · Plan de Cuentas</p>
          </div>

          {mesesEnMemoria.size > 0 && (
            <div className="bg-slate-900 rounded-2xl p-5 border border-slate-700">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Eliminar datos de un mes</p>
              <div className="flex flex-wrap gap-2">
                {[...mesesEnMemoria].map(m => (
                  <div key={m} className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5">
                    <span className="text-[10px] font-black text-slate-300 uppercase">{m}</span>
                    <button onClick={()=>handleDeleteMonth(m)} className="text-red-400 hover:text-red-300"><Trash2 size={11}/></button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    );
  }


  const MODULES = [
    { key:'resultados',   label:'Estado de Resultados',    icon:<LineChart size={20}/>,  iconBg:'bg-slate-900',   desc:'P&L mensual y acumulado por cuentas',
      viz: <MiniSparkline points={[4,6,5,7,6,9,8,11,10]} color="#f97316"/> },
    { key:'balance',      label:'Balance General',         icon:<Scale size={20}/>,      iconBg:'bg-blue-600',    desc:'Situación financiera multimoneda USD / Bs.',
      viz: <MiniBars values={[3,4,5,6,7,8]} color="#f97316"/> },
    { key:'dashboard',    label:'Dashboard Financiero',    icon:<BarChart2 size={20}/>,  iconBg:'bg-indigo-600',  desc:'Indicadores visuales · Balance y P&L',
      viz: <MiniProgressRows rows={[['#e0e7ff','#6366f1','#e0e7ff'],['#fed7aa','#f97316','#fed7aa']]}/> },
    { key:'comparativo',  label:'Análisis de Variaciones', icon:<GitCompare size={20}/>, iconBg:'bg-violet-600',  desc:'Comparativo mes a mes de resultados',
      viz: <MiniBars values={[3,5,3,7,4,8,5,9,6]} color="#f97316"/> },
    { key:'activos',      label:'Activos Fijos',           icon:<Landmark size={20}/>,   iconBg:'bg-emerald-600', desc:'Registro y depreciación de activos fijos',
      viz: <MiniBars values={[3,3,3,8,3,3]} color="#f97316" highlightIdx={3}/> },
    { key:'config',       label:'Configuración',           icon:<Database size={20}/>,   iconBg:'bg-slate-500',   desc:'Plan · meses · auxiliares · activos', isConfig:true },
  ];

  return (
    <div className="min-h-screen" style={{background:'#f3f2ef',backgroundImage:'radial-gradient(circle,#c8c8c8 1px,transparent 1px)',backgroundSize:'22px 22px'}}>
      <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center flex-shrink-0"><LineChart size={20}/></div>
          <div>
            <h1 className="font-black text-sm text-slate-900 tracking-tight">JIRET G&amp;B <span className="text-orange-500">FINANCE</span></h1>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wide">Servicios Jiret G&amp;B, C.A. · RIF: J-412309374</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="text-[10px] font-mono text-slate-400 border border-slate-200 rounded-lg px-3 py-2 whitespace-nowrap">{clockStr}</div>
          <div className="bg-orange-500 text-white text-[10px] font-black uppercase tracking-wide px-3 py-2 rounded-lg whitespace-nowrap">{mesesEnMemoria.size} Meses en Memoria</div>
          <button onClick={()=>setCurrentView('config')} className="border border-slate-200 text-slate-600 text-[10px] font-black uppercase tracking-wide px-3 py-2 rounded-lg flex items-center gap-1.5 hover:bg-slate-50 transition-colors"><Database size={13}/> Config.</button>
        </div>
      </header>
      <main className="max-w-6xl mx-auto p-4 md:p-8 pb-16">
        <div className="text-center mb-9">
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-[0.15em] inline-block relative pb-3">
            Panel Principal Financiero
            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-1 bg-orange-500 rounded-full"/>
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {MODULES.map(mod => (
            <div key={mod.key} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col">
              <div className={`w-11 h-11 rounded-xl ${mod.iconBg} text-white flex items-center justify-center mb-4`}>{mod.icon}</div>
              <h3 className="font-black text-sm text-slate-900 uppercase tracking-tight mb-1">{mod.label}</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-4 leading-relaxed">{mod.desc}</p>
              <div className="flex-1 flex items-center mb-4">
                {mod.isConfig ? (
                  <div className="text-[11px] space-y-1 py-1 w-full">
                    <p className="text-slate-500">Plan: <span className={Object.keys(planCuentas).length>0 ? 'text-emerald-600 font-black' : 'text-slate-400 font-black'}>{Object.keys(planCuentas).length>0?'Cargado':'Sin cargar'}</span> &nbsp;|&nbsp; Meses: <span className="font-black text-slate-700">{mesesEnMemoria.size}</span></p>
                    <p className="text-slate-500">CxC: <span className="font-black text-slate-700">{totalCxCReg}</span> reg. &nbsp;|&nbsp; CxP: <span className="font-black text-slate-700">{totalCxPReg}</span> reg.</p>
                    <p className="text-slate-500">Activos: <span className="font-black text-slate-700">{totalActivosReg}</span> &nbsp;|&nbsp; Base: <span className="font-black text-slate-700">{dbData.length}</span></p>
                  </div>
                ) : mod.viz}
              </div>
              <button onClick={()=>setCurrentView(mod.key)} className="w-full bg-orange-500 hover:bg-orange-600 text-white font-black text-xs uppercase tracking-wide py-3 rounded-xl transition-colors flex items-center justify-center gap-1.5">
                Ir a Módulo <ChevronRight size={14}/>
              </button>
            </div>
          ))}
        </div>
        <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-10">Módulo de Reportes Financieros · JIRET G&amp;B Finance V2.0</p>
      </main>
    </div>
  );
}

export default ReportesFinancierosApp;

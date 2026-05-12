import React, { useState, useMemo, useEffect } from 'react';
import { 
  ArrowLeft, Upload, CheckCircle, Scale, 
  LineChart, CalendarDays, AlertTriangle, ChevronRight, ChevronDown, Star, PlusCircle, Trash2, ArrowUpRight, ArrowDownRight, GitCompare, Landmark, FileSpreadsheet,
  FileText, Users, Briefcase, Search, BookOpen, Database, FileOutput, Printer, Download
} from 'lucide-react';

// ============================================================================
// 0. ESTILOS DE IMPRESIÓN (PDF CENTRADO Y ESCALADO)
// ============================================================================
const PrintStyles = () => (
  <style>{`
    @media print {
      @page {
        size: letter;
        margin: 10mm 10mm;
      }
      body { 
        background-color: white !important; 
        -webkit-print-color-adjust: exact;
      }
      .no-print { display: none !important; }
      .print-area { 
        box-shadow: none !important; 
        border: none !important; 
        padding: 0 !important; 
        margin: 0 auto !important;
        width: 100% !important;
        max-width: 100% !important;
      }
      table { 
        page-break-inside: auto; 
        width: 100% !important; 
        table-layout: fixed;
        border-collapse: collapse;
      }
      tr { page-break-inside: avoid; page-break-after: auto; }
      thead { display: table-header-group; }
      th, td { 
        word-wrap: break-word; 
        overflow: hidden;
      }
      .print-only { display: block !important; }
    }
  `}</style>
);

const HeaderMembretado = () => (
  <div className="hidden print:flex w-full justify-between items-end border-b-[3px] border-orange-500 pb-3 mb-6 pt-4 px-2 bg-white">
    <div>
      <p className="text-slate-400 text-lg mb-1 leading-none">Supply</p>
      <h1 className="text-5xl font-black leading-none tracking-tight text-black">G<span className="text-orange-500">&</span>B</h1>
    </div>
    <div className="text-right">
      <h2 className="text-lg font-black uppercase text-black tracking-widest">SERVICIOS JIRET G&B, C.A.</h2>
      <p className="text-xs font-bold text-slate-700">RIF: J-412309374</p>
      <p className="text-[10px] text-slate-500 mt-1">AV CIRCUNVALACION NRO 02 C.C EL DIVIDIVI LOCAL G-9 NIVEL PB</p>
      <p className="text-[10px] text-slate-500">SECTOR EL TREBOL MARACAIBO-ZULIA</p>
      <p className="text-[10px] text-slate-500">Tel: 0414-693.03.42</p>
    </div>
  </div>
);

// ============================================================================
// 1. LÓGICA DE EXPORTACIÓN EXCEL PROFESIONAL
// ============================================================================
const handleExportExcel = (tableId, fileName, reportTitle) => {
  if (!window.XLSX) { alert("Cargando librería..."); return; }
  
  const table = document.getElementById(tableId);
  const ws = window.XLSX.utils.table_to_sheet(table);

  // Inyectar Membrete en el Excel
  const header = [
    ["SERVICIOS JIRET G&B, C.A."],
    ["RIF: J-412309374"],
    [reportTitle.toUpperCase()],
    [`Fecha de reporte: ${new Date().toLocaleDateString()}`],
    [] // Fila vacía de separación
  ];

  window.XLSX.utils.sheet_add_aoa(ws, header, { origin: "A1" });

  // Ajustar anchos de columna para que no se vea "horrible"
  const colWidths = [{ wch: 50 }, { wch: 18 }, { wch: 18 }, { wch: 12 }];
  ws['!cols'] = colWidths;

  const wb = window.XLSX.utils.book_new();
  window.XLSX.utils.book_append_sheet(wb, ws, "Reporte");
  window.XLSX.writeFile(wb, `${fileName}.xlsx`);
};

// ============================================================================
// 2. LÓGICA DE PROCESAMIENTO DE ARCHIVOS (ORDEN CRONOLÓGICO)
// ============================================================================
const loadSheetJS = () => new Promise((resolve) => {
  if (window.XLSX) { resolve(window.XLSX); return; }
  const s = document.createElement('script');
  s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
  s.onload = () => resolve(window.XLSX);
  document.head.appendChild(s);
});

const monthOrder = { "Enero": 1, "Febrero": 2, "Marzo": 3, "Abril": 4, "Mayo": 5, "Junio": 6, "Julio": 7, "Agosto": 8, "Septiembre": 9, "Octubre": 10, "Noviembre": 11, "Diciembre": 12 };

const processFiles = async (files) => {
  let allParsedData = [];
  const detectMonth = (name) => {
    const m = name.match(/(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)/i);
    return m ? m[0].charAt(0).toUpperCase() + m[0].slice(1).toLowerCase() : 'Sin Mes';
  };
  const detectYear = (name) => {
    const y = name.match(/20\d{2}/);
    return y ? y[0] : new Date().getFullYear().toString();
  };

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const ext = file.name.split('.').pop().toLowerCase();
    const month = detectMonth(file.name);
    const year = detectYear(file.name);
    let dataRows = [];

    const XL = await loadSheetJS();
    const buffer = await file.arrayBuffer();
    const wb = XL.read(buffer, { type: 'array' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    dataRows = XL.utils.sheet_to_json(ws, { header: 1, defval: null });

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
        allParsedData.push({ month, year, path: pathStack.map(p => p.trim()).join('>'), name: name.trim(), usd: usd, bs: bs || 0 });
      } else {
        pathStack.push(name.trim());
      }
    }
  }

  // Ordenar cronológicamente antes de devolver
  return allParsedData.sort((a, b) => {
    if (a.year !== b.year) return parseInt(a.year) - parseInt(b.year);
    return monthOrder[a.month] - monthOrder[b.month];
  });
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

  const detectYear = (name) => {
    const y = name.match(/20\d{2}/);
    return y ? y[0] : new Date().getFullYear().toString();
  };
  const fileYear = detectYear(file.name);

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
            year: fileYear,
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
const isNewAuxFormat = (row) => {
  if (!row || row.length < 8) return false;
  const cells = row.map(c => c ? String(c).toLowerCase().trim() : '');
  return cells.some(c => c.includes('operaci') || c.includes('descripci') || c.includes('cuenta contable'));
};

const processAuxFile = async (files) => {
  const result = { cxc_general: [], cxc_zuliana: [], cxp_autototal: [], cxp_surepack: [], cxp_pacomela: [], cxp_yancarlos: [], cxp_general: [] };

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
    let sheetsData = []; 

    if (ext === 'xlsx' || ext === 'xls' || ext === 'xlsm') {
      const XL = await loadSheetJS();
      const buffer = await file.arrayBuffer();
      const wb = XL.read(buffer, { type: 'array', cellDates: false });
      for (const sheetName of wb.SheetNames) {
        const ws = wb.Sheets[sheetName];
        const rows = XL.utils.sheet_to_json(ws, { header: 1, defval: null, raw: true });
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
        for (let i = headerIdx + 1; i < dataRows.length; i++) {
          const row = dataRows[i];
          if (!row || row.every(c => !c)) continue;
          const nombre = row[1] ? String(row[1]).trim().toUpperCase() : '';
          const monto = parseVal(row[8]);
          if (!nombre || monto === null) continue;

          const cuentaContable = row[9] ? String(row[9]).trim() : '';
          const codeMatch = cuentaContable.match(/^(\d[\d\.]+)/);
          const accountCode = codeMatch ? codeMatch[1] : null;
          const mapInfo = accountCode ? ACCOUNT_MAPS[accountCode] : null;
          const bucket = (mapInfo && result[mapInfo.type] !== undefined) ? mapInfo.type : null;
          if (!bucket) continue; 

          result[bucket].push({
            cod:            row[0] ? String(row[0]).trim() : '-',
            nombre,
            operacion:      row[2] ? String(row[2]).trim() : '-',
            emision:        parseDate(row[3]),
            vence:          parseDate(row[4]),
            dias:           row[5] !== null && row[5] !== undefined ? String(row[5]).trim() : '-',
            doc:            row[6] ? String(row[6]).trim() : '-',
            descripcion:    row[7] ? String(row[7]).trim() : '-',
            monto,
            cuentaContable,
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
      if (headerIdx === -1) { colMap = { cod:0, nombre:1, doc:2, emision:3, vence:4, monto:5 }; headerIdx = 0; }

      for (let i = headerIdx + 1; i < dataRows.length; i++) {
        const row = dataRows[i];
        if (!row || row.every(c => !c)) continue;
        const nombre = colMap.nombre >= 0 && row[colMap.nombre] ? String(row[colMap.nombre]).trim().toUpperCase() : '';
        const monto = colMap.monto >= 0 ? parseVal(row[colMap.monto]) : null;
        if (!nombre || monto === null || monto === 0) continue;

        const record = {
          cod: colMap.cod >= 0 && row[colMap.cod] ? String(row[colMap.cod]).trim() : '-',
          nombre, operacion: '-', dias: '-', descripcion: '-', cuentaContable: '',
          doc:     colMap.doc >= 0 && row[colMap.doc] ? String(row[colMap.doc]).trim() : '-',
          emision: colMap.emision >= 0 ? parseDate(row[colMap.emision]) : '-',
          vence:   colMap.vence >= 0 ? parseDate(row[colMap.vence]) : '-',
          monto,
        };
        
        if      (nombre.includes('ZULIANA DE EMPAQUE'))                                    result.cxc_zuliana.push({...record, monto: Math.abs(monto)});
        else if (nombre.includes('AUTO TOTAL'))                                            result.cxp_autototal.push(record);
        else if (nombre.includes('SURE PACK'))                                            result.cxp_surepack.push(record);
        else if (nombre.includes('PACOMELA') || nombre.includes('AGRO INDUSTRIAS LACTEAS')) result.cxp_pacomela.push(record);
        else if (nombre.includes('YANCARLOS') || nombre.includes('PEREZ CASANOVA'))       result.cxp_yancarlos.push(record);
        else result.cxp_general.push(record);
      }
    }
  }
  return result;
};

// ============================================================================
// 2. CONFIGURACIÓN DE MAPEO Y DATA PRECARGADA (PDFs)
// ============================================================================
const ACCOUNT_MAPS = {
  '1.1.02.01.001': { type: 'cxc_general',  label: 'Cuentas por Cobrar Clientes' },
  '1.1.05.01.008': { type: 'cxc_zuliana',  label: 'Anticipos a Proveedores Zuliana' },
  '2.1.01.02.008': { type: 'cxp_autototal', label: 'Vehículos por Pagar' },
  '2.1.01.01.004': { type: 'cxp_surepack',  label: 'CxP Sure Pack' },
  '2.1.01.02.007': { type: 'cxp_pacomela',  label: 'Inmueble por Pagar' },
  '2.1.01.01.003': { type: 'cxp_yancarlos', label: 'Otras CxP Proveedores' },
  '2.1.01.01.001': { type: 'cxp_general',   label: 'Cuentas por Pagar Proveedores' }
};

const mkR = (cod,nombre,operacion,emision,vence,dias,doc,descripcion,monto,cc) =>
  ({ cod, nombre, operacion, emision, vence, dias: String(dias), doc, descripcion, monto, cuentaContable: cc });

const DEFAULT_AUX_DATA = {
  cxc_general: [
    mkR('C0047','ALIMENTOS BOTALON C.A','Factura','30/04/2026','07/05/2026',-7,'00002973','Doc : 00002973',519.51,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0084','ANIMAL FEED SOLUTIONS., C.A','Factura','17/04/2026','24/04/2026',6,'00002935','Doc : 00002935',12011.22,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0084','ANIMAL FEED SOLUTIONS., C.A','Factura','28/04/2026','05/05/2026',-5,'00002962','Doc : 00002962',1433.20,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0400','C.A RON SANTA TERESA, S.A.C.A','Factura','16/04/2026','28/04/2026',2,'00002933','Doc : 00002933',3524.54,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0119','C.A. CENTRAL LA PASTORA','Factura','19/11/2025','04/12/2025',147,'00002666','Factor:237,7505 Doc:00002666',3178.47,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0119','C.A. CENTRAL LA PASTORA','Adelanto','19/02/2026','19/02/2026',70,'00000410','ANTICIPO CENTRAL LA PASTORA, C.A',-2000,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0119','C.A. CENTRAL LA PASTORA','Factura','24/02/2026','03/03/2026',58,'00002827','Doc : 00002827',5230.62,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0119','C.A. CENTRAL LA PASTORA','Factura','26/02/2026','05/03/2026',56,'00002835','Doc : 00002835',1038.96,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0119','C.A. CENTRAL LA PASTORA','Adelanto','24/04/2026','24/04/2026',6,'00000552','ANTICIPO C.A CENTRAL LA PASTORA',-3448.05,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0012','CONVELAC, C.A.','Factura','16/04/2026','16/04/2026',14,'00002932','Doc : 00002932',201.60,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0051','ENVASES MUNDIAL, C.A','Adelanto','17/09/2025','17/09/2025',225,'00002277','Adelanto - Factor: 161,8880',-15.01,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0051','ENVASES MUNDIAL, C.A','Adelanto','17/09/2025','17/09/2025',225,'00002278','Adelanto - Factor: 161,8880',-5.52,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0051','ENVASES MUNDIAL, C.A','Adelanto','02/12/2025','02/12/2025',149,'00002465','Adelanto - Factor: 247,30',-18.39,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0051','ENVASES MUNDIAL, C.A','Factura','09/03/2026','16/03/2026',45,'2309','Factura NF Factor: 433,1664',4091.55,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0051','ENVASES MUNDIAL, C.A','Factura','30/04/2026','30/04/2026',0,'2437','Factura NF - Factor: 487,1192',234.97,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0004','INDUSTRIA ALIMENTICIA NACIONAL DE CEREALES Y HARINAS','Factura','03/03/2026','10/03/2026',51,'00002841','Doc : 00002841',2059.20,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0004','INDUSTRIA ALIMENTICIA NACIONAL DE CEREALES Y HARINAS','Factura','24/03/2026','31/03/2026',30,'00002894','Doc : 00002894',1613.49,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0004','INDUSTRIA ALIMENTICIA NACIONAL DE CEREALES Y HARINAS','Factura','22/04/2026','29/04/2026',1,'00002938','Doc : 00002938',10370.40,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0094','INDUSTRIAS MAROS, C.A.','Factura','18/02/2026','25/02/2026',64,'18021','Factura Factor: 396,3674',5265.26,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0363','INGENIERIA CREATIVA, C.A','Factura','30/04/2026','07/05/2026',-7,'2434','Factura NF - Factor: 487,1192',286.72,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0043','INVERSIONES AVICOLAS, C.A.','Adelanto','06/04/2026','06/04/2026',24,'00000519','ANTICIPO 30% ODC 45/75884 INVERSIONES AVICOLAS',-1050,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0043','INVERSIONES AVICOLAS, C.A.','Adelanto','09/04/2026','09/04/2026',21,'00000523','ANTICIPO ODC 45/75899 DIV $ INVERSIONES AVICOLAS',-6480,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0043','INVERSIONES AVICOLAS, C.A.','Factura','27/04/2026','04/05/2026',-4,'00002960','Doc : 00002960',7498.01,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0043','INVERSIONES AVICOLAS, C.A.','Factura','27/04/2026','04/05/2026',-4,'00002961','Doc : 00002961',1670.40,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0043','INVERSIONES AVICOLAS, C.A.','Factura','28/04/2026','05/05/2026',-5,'00002964','Doc : 00002964',422.24,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0043','INVERSIONES AVICOLAS, C.A.','Factura','30/04/2026','07/05/2026',-7,'00002972','Doc : 00002972',7512.25,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0011','INVERSIONES LACTEAS SAN SIMON, C.A','Factura','24/04/2026','01/05/2026',-1,'00002952','Doc : 00002952',5881.20,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0037','INVERSIONES LUXÓS, C.A.','N/D','25/07/2023','01/08/2023',1003,'00000537','N.E 341 4.740$ Factor: 29,0872',1754.20,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0037','INVERSIONES LUXÓS, C.A.','Adelanto','20/08/2025','20/08/2025',253,'00002208','Adelanto - 150$ Factor: 192',-150,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0037','INVERSIONES LUXÓS, C.A.','Adelanto','15/09/2025','15/09/2025',227,'00002267','Adelanto - Factor: 158,9289',-170,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0037','INVERSIONES LUXÓS, C.A.','Adelanto','18/02/2026','18/02/2026',71,'00000408','Adelanto Factor: 398,7456',-80,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0037','INVERSIONES LUXÓS, C.A.','Adelanto','23/02/2026','23/02/2026',66,'00000415','Adelanto Factor: 460',-100,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0165','INVERSIONES NESMOCA, C.A','Factura','09/02/2024','01/03/2024',790,'00001455','Factor:36,2919 Doc:00001455 Palmar 1',1184.46,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0165','INVERSIONES NESMOCA, C.A','Factura','09/02/2024','01/03/2024',790,'00001456','Factor:36,2919 - Produvisa',2553.86,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0165','INVERSIONES NESMOCA, C.A','Factura','14/02/2024','06/03/2024',785,'00001457','Factor:36,3185 - Palmar 2',593.92,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0165','INVERSIONES NESMOCA, C.A','Factura','16/02/2024','08/03/2024',783,'00001460','Factor:36,2737 - Palmar 3',74.24,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0165','INVERSIONES NESMOCA, C.A','Factura','16/02/2024','08/03/2024',783,'00001462','Factor:36,2737 Doc:00001462',3758.40,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0165','INVERSIONES NESMOCA, C.A','Factura','15/03/2024','05/04/2024',755,'00001526','Factor:36,276 - Grupo Serex',1559.04,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0165','INVERSIONES NESMOCA, C.A','Factura','04/04/2024','25/04/2024',735,'00001562','Factor:36,2493 - Cartonera',751.68,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0165','INVERSIONES NESMOCA, C.A','Factura','11/04/2024','02/05/2024',728,'00001575','Factor:36,1883 - Purolomo 1',3006.72,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0164','INVERSIONES SELVA, C. A.','Factura','29/04/2026','14/05/2026',-14,'00002967','Doc : 00002967',1577.31,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0202','JOSE LUIS BOHORQUEZ','Factura','14/04/2026','21/04/2026',9,'2393','Factura NF Factor: 477,6259',122.15,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0312','JULIO CESAR OJEDA CASANOVA','Factura','16/10/2025','16/10/2025',196,'00002605','Factor:201,4665 Doc:00002605',58.46,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0312','JULIO CESAR OJEDA CASANOVA','N/D','02/12/2025','09/12/2025',142,'00002563','NE 2116 - 58,46$ Factor 247,4071',58.46,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0312','JULIO CESAR OJEDA CASANOVA','Factura','06/02/2026','13/02/2026',76,'2248.','Factura F - Factor: 381,1074',239.42,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0312','JULIO CESAR OJEDA CASANOVA','Factura','18/03/2026','25/03/2026',36,'2341','Factura NF Factor: 451,5072',30.16,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0312','JULIO CESAR OJEDA CASANOVA','Factura','23/03/2026','30/03/2026',31,'2347','Factura NF Factor: 457,0575',58.46,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0054','LA EXCELENCIA C.A.','Factura','24/04/2026','01/05/2026',-1,'2417','Factura NF - Factor: 483,8695',193.02,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0140','MARCOS ANTONIO RODRIGUEZ FINOL','Factura','20/03/2026','27/03/2026',34,'2343','Factura NF Factor: 455,2547',2227.20,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0140','MARCOS ANTONIO RODRIGUEZ FINOL','Adelanto','20/04/2026','20/04/2026',10,'00000561','ANTICIPO MARCOS ANTONIO RODRIGUEZ FINOL',-1000,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0155','MUEBLES & PRESTIGIOS, C.A','Factura','23/09/2025','30/09/2025',212,'00002564','Factor:168,4157 Doc:00002564',37.31,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0013','PAPELES VENEZOLANOS, C.A.','Factura','20/04/2026','23/04/2026',7,'00002937','Doc : 00002937',21158.40,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0013','PAPELES VENEZOLANOS, C.A.','Factura','22/04/2026','02/05/2026',-2,'00002939','Doc : 00002939',21158.40,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0319','PEGAMENTOS UTILES DE VENEZUELA, C.A','Factura','30/04/2026','07/05/2026',-7,'2436','Factura NF - Factor: 487,1192',1820.00,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0195','PINTURAS DEL CARIBE, S.A.','Factura','24/03/2026','31/03/2026',30,'2353','Factura NF Factor: 459,4525',3377.92,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0188','PRODUCTOS DE VIDRIO S.A (PRODUVISA)','Factura','14/04/2026','21/04/2026',9,'00002927','Doc : 00002927',9552.62,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0188','PRODUCTOS DE VIDRIO S.A (PRODUVISA)','Factura','14/04/2026','21/04/2026',9,'00002928','Doc : 00002928',2349.69,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0188','PRODUCTOS DE VIDRIO S.A (PRODUVISA)','Factura','29/04/2026','06/05/2026',-6,'00002968','Doc : 00002968',13937.40,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0223','PRODUCTOS LACTEOS LA ARGENTINA, C.A.','Adelanto','13/11/2025','13/11/2025',168,'00002421','Adelanto - Factor: 233,56',-6.86,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0005','RIAS, CA','Factura','31/03/2026','07/04/2026',23,'2369','Factura NF - Factor: 473,8702',1948.80,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0139','VE-PACK INVESTMENT, C.A','Adelanto','10/11/2025','10/11/2025',171,'00002398','Adelanto - Factor: 231,0462',-22.08,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0139','VE-PACK INVESTMENT, C.A','Factura','26/03/2026','02/04/2026',28,'2358','Factura NF - Factor: 466,6014',1131.00,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0139','VE-PACK INVESTMENT, C.A','Factura','26/03/2026','02/04/2026',28,'2359','Factura NF - Factor: 466,6014',181.66,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0139','VE-PACK INVESTMENT, C.A','Factura','30/03/2026','06/04/2026',24,'2367','Factura NF Factor: 471,7004',100.90,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0184','VENEZOLANA DEL VIDRIO C.A. (VENVIDRIO)','N/D','19/03/2024','03/04/2024',757,'00001219','N.E 845 341,51$ Factor 36,2653',341.51,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0184','VENEZOLANA DEL VIDRIO C.A. (VENVIDRIO)','N/D','21/11/2025','21/11/2025',160,'00002548','NE 2086 100,05$ Factor: 241,5780',100.05,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0002','VENILAC C.A','Factura','12/03/2026','19/03/2026',42,'2324','Factura NF Factor: 440,9657',233.86,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0002','VENILAC C.A','Factura','20/04/2026','27/04/2026',3,'2402','Factura NF - Factor: 481,2177',9621.50,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0002','VENILAC C.A','Factura','24/04/2026','24/04/2026',6,'00002957','Doc : 00002957',1217.25,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0216','VICTOR HUGO RODRIGUEZ ARAMBULO','Factura','31/07/2024','15/08/2024',623,'00001779','Doc:00001779 - Procesadora Antartica',4800.00,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0216','VICTOR HUGO RODRIGUEZ ARAMBULO','Factura','28/02/2025','28/02/2025',426,'00002174','Doc:00002174 - EYS',86.98,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0216','VICTOR HUGO RODRIGUEZ ARAMBULO','N/D','30/04/2025','30/04/2025',365,'00002272','NE 1699 - Polimar',93.59,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0216','VICTOR HUGO RODRIGUEZ ARAMBULO','N/D','05/06/2025','12/06/2025',322,'00002385','NE 1781 - Alimentos Mar Caribe',872.79,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0216','VICTOR HUGO RODRIGUEZ ARAMBULO','N/D','13/08/2025','20/08/2025',253,'00002458','NE 1885 - Polimar',93.59,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0216','VICTOR HUGO RODRIGUEZ ARAMBULO','Factura','09/10/2025','09/10/2025',203,'00002589','Doc:00002589 - Inversora E&S',165.00,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0216','VICTOR HUGO RODRIGUEZ ARAMBULO','Factura','09/10/2025','09/10/2025',203,'00002593','Doc:00002593 - Julio Ojeda',271.98,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0216','VICTOR HUGO RODRIGUEZ ARAMBULO','N/D','10/10/2025','10/10/2025',202,'00002503','NE 1993 - Polimar',93.59,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0216','VICTOR HUGO RODRIGUEZ ARAMBULO','N/D','25/11/2025','25/11/2025',156,'00002550','NE 2094 - Polimar',93.59,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0216','VICTOR HUGO RODRIGUEZ ARAMBULO','Factura','30/01/2026','06/02/2026',83,'2234','NE 2234 - Polimar',93.54,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0216','VICTOR HUGO RODRIGUEZ ARAMBULO','Factura','10/04/2026','17/04/2026',13,'2381','Factura NF Factor: 476,4342 - Polimar',150.34,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0227','VIDRIOS DOMESTICOS MAV C.C.S','Factura','22/04/2026','29/04/2026',1,'00002940','Doc : 00002940',1067.99,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
  ],
  cxc_zuliana: [
    mkR('P0424','ZULIANA DE EMPAQUE, C.A','Adelanto','01/09/2025','01/09/2025',241,'1','Adelanto',11950.00,'1.1.05.01.008-ANTICIPOS A PROVEEDORES ZULIANA DE EMPAQUE'),
    mkR('P0424','ZULIANA DE EMPAQUE, C.A','Adelanto','03/09/2025','03/09/2025',239,'2','Adelanto',3022.56,'1.1.05.01.008-ANTICIPOS A PROVEEDORES ZULIANA DE EMPAQUE'),
    mkR('P0424','ZULIANA DE EMPAQUE, C.A','Adelanto','05/09/2025','05/09/2025',237,'3','Adelanto',200.00,'1.1.05.01.008-ANTICIPOS A PROVEEDORES ZULIANA DE EMPAQUE'),
    mkR('P0424','ZULIANA DE EMPAQUE, C.A','Adelanto','09/09/2025','09/09/2025',233,'4','Adelanto',40.00,'1.1.05.01.008-ANTICIPOS A PROVEEDORES ZULIANA DE EMPAQUE'),
    mkR('P0424','ZULIANA DE EMPAQUE, C.A','Adelanto','10/09/2025','10/09/2025',232,'5','Adelanto',30.00,'1.1.05.01.008-ANTICIPOS A PROVEEDORES ZULIANA DE EMPAQUE'),
    mkR('P0424','ZULIANA DE EMPAQUE, C.A','Adelanto','13/11/2025','13/11/2025',168,'5','Adelanto',40000.00,'1.1.05.01.008-ANTICIPOS A PROVEEDORES ZULIANA DE EMPAQUE'),
    mkR('P0424','ZULIANA DE EMPAQUE, C.A','Adelanto','13/11/2025','13/11/2025',168,'3','Adelanto',13269.00,'1.1.05.01.008-ANTICIPOS A PROVEEDORES ZULIANA DE EMPAQUE'),
    mkR('P0424','ZULIANA DE EMPAQUE, C.A','Adelanto','17/11/2025','17/11/2025',164,'1','Adelanto',15000.00,'1.1.05.01.008-ANTICIPOS A PROVEEDORES ZULIANA DE EMPAQUE'),
    mkR('P0424','ZULIANA DE EMPAQUE, C.A','Factura','30/01/2026','30/01/2026',90,'000040','Doc : 000040',-2219.49,'1.1.05.01.008-ANTICIPOS A PROVEEDORES ZULIANA DE EMPAQUE'),
    mkR('P0424','ZULIANA DE EMPAQUE, C.A','Factura','30/01/2026','30/01/2026',90,'000039','Factor:367,3069 Doc:000039',-5192.87,'1.1.05.01.008-ANTICIPOS A PROVEEDORES ZULIANA DE EMPAQUE'),
    mkR('P0424','ZULIANA DE EMPAQUE, C.A','Factura','27/02/2026','27/02/2026',62,'000042','Doc : 000042',-5150.05,'1.1.05.01.008-ANTICIPOS A PROVEEDORES ZULIANA DE EMPAQUE'),
  ],
  cxp_yancarlos: [
    mkR('P0005','YANCARLOS PEREZ CASANOVA','Factura','17/04/2026','17/04/2026',13,'001073','Doc : 001073',7920.07,'2.1.01.01.003-OTRAS CUENTAS POR PAGAR PROVEEDORES'),
    mkR('P0005','YANCARLOS PEREZ CASANOVA','Adelanto','17/04/2026','17/04/2026',13,'170426','PAGO MATERIA PRIMA 158,42 / FAC: 1073',-158.42,'2.1.01.01.003-OTRAS CUENTAS POR PAGAR PROVEEDORES'),
    mkR('P0005','YANCARLOS PEREZ CASANOVA','Adelanto','17/04/2026','17/04/2026',13,'17042026','PAGO MATERIA PRIMA 175$ / FAC: 1073',-175.00,'2.1.01.01.003-OTRAS CUENTAS POR PAGAR PROVEEDORES'),
    mkR('P0005','YANCARLOS PEREZ CASANOVA','Adelanto','22/04/2026','22/04/2026',8,'2204','EGRESO X Z2 / FAC: 1073',-1090.00,'2.1.01.01.003-OTRAS CUENTAS POR PAGAR PROVEEDORES'),
    mkR('P0005','YANCARLOS PEREZ CASANOVA','Adelanto','22/04/2026','22/04/2026',8,'220426.','PAGO DE MALLA 100$ / FAC: 1073',-100.00,'2.1.01.01.003-OTRAS CUENTAS POR PAGAR PROVEEDORES'),
    mkR('P0005','YANCARLOS PEREZ CASANOVA','Factura','23/04/2026','23/04/2026',7,'001075','Doc : 001075',10395.07,'2.1.01.01.003-OTRAS CUENTAS POR PAGAR PROVEEDORES'),
    mkR('P0005','YANCARLOS PEREZ CASANOVA','Adelanto','24/04/2026','24/04/2026',6,'1368','PAGO LEINYS CASTRO PERS. EVENTUAL / FAC: 1073',-80.00,'2.1.01.01.003-OTRAS CUENTAS POR PAGAR PROVEEDORES'),
    mkR('P0005','YANCARLOS PEREZ CASANOVA','Adelanto','24/04/2026','24/04/2026',6,'0358','PAGO JULIO ALBARRAN PERS. EVENTUAL 125$ / FAC: 1073',-125.00,'2.1.01.01.003-OTRAS CUENTAS POR PAGAR PROVEEDORES'),
    mkR('P0005','YANCARLOS PEREZ CASANOVA','Adelanto','24/04/2026','24/04/2026',6,'2701','PAGO RICARDO VIELMA PERS. EVENTUAL 90$ / FAC: 1073',-90.00,'2.1.01.01.003-OTRAS CUENTAS POR PAGAR PROVEEDORES'),
    mkR('P0005','YANCARLOS PEREZ CASANOVA','Adelanto','24/04/2026','24/04/2026',6,'3688','PAGO JOEL JIMENEZ CHOFER 100$ / FAC: 1073',-100.00,'2.1.01.01.003-OTRAS CUENTAS POR PAGAR PROVEEDORES'),
    mkR('P0005','YANCARLOS PEREZ CASANOVA','Adelanto','28/04/2026','28/04/2026',2,'7593','PAGO LUIS COMISIONES 304,31$ / FAC:1073',-304.31,'2.1.01.01.003-OTRAS CUENTAS POR PAGAR PROVEEDORES'),
    mkR('P0005','YANCARLOS PEREZ CASANOVA','Adelanto','30/04/2026','30/04/2026',0,'5429','PAGO BOLETOS AEREOS JCB-JDB / FAC: 1073',-152.45,'2.1.01.01.003-OTRAS CUENTAS POR PAGAR PROVEEDORES'),
    mkR('P0005','YANCARLOS PEREZ CASANOVA','Adelanto','30/04/2026','30/04/2026',0,'1464','PAGO 2 BOLETOS AEREOS JCB-JDB / FAC: 1073',-49.05,'2.1.01.01.003-OTRAS CUENTAS POR PAGAR PROVEEDORES'),
    mkR('P0005','YANCARLOS PEREZ CASANOVA','Adelanto','30/04/2026','30/04/2026',0,'3343','PAGO COMBUSTIBLE VIATICOS JDB / FAC: 1073',-13.96,'2.1.01.01.003-OTRAS CUENTAS POR PAGAR PROVEEDORES'),
    mkR('P0005','YANCARLOS PEREZ CASANOVA','Adelanto','30/04/2026','30/04/2026',0,'1822','PAGO ABIEL BONILLA FLETE / FAC: 1073',-100.00,'2.1.01.01.003-OTRAS CUENTAS POR PAGAR PROVEEDORES'),
    mkR('P0005','YANCARLOS PEREZ CASANOVA','Adelanto','30/04/2026','30/04/2026',0,'32900','PAGO JULIO ALBARRAN / FAC: 1073',-110.00,'2.1.01.01.003-OTRAS CUENTAS POR PAGAR PROVEEDORES'),
    mkR('P0005','YANCARLOS PEREZ CASANOVA','Adelanto','30/04/2026','30/04/2026',0,'1099','PAGO LEINYS CASTRO PERS. EVENTUAL / FAC: 1073',-80.00,'2.1.01.01.003-OTRAS CUENTAS POR PAGAR PROVEEDORES'),
    mkR('P0005','YANCARLOS PEREZ CASANOVA','Adelanto','30/04/2026','30/04/2026',0,'1173','PAGO RICARDO VIELMA PERS. EVENTUAL / FAC: 1073',-80.00,'2.1.01.01.003-OTRAS CUENTAS POR PAGAR PROVEEDORES'),
  ],
  cxp_surepack: [
    mkR('P0082','SURE PACK','Factura','12/08/2025','11/09/2025',231,'3284.','Doc: 3284 Factor: 195.2490',686.39,'2.1.01.01.004-CUENTAS POR PAGAR SURE PACK'),
    mkR('P0082','SURE PACK','Factura','12/08/2025','11/09/2025',231,'3285.','Doc: 3285 Factor: 195.2490',661.44,'2.1.01.01.004-CUENTAS POR PAGAR SURE PACK'),
    mkR('P0082','SURE PACK','Factura','12/08/2025','11/09/2025',231,'3286.','Doc: 3286 Factor: 223.6450',24112.85,'2.1.01.01.004-CUENTAS POR PAGAR SURE PACK'),
    mkR('P0082','SURE PACK','N/C','16/10/2025','24/10/2025',188,'00000459','Doc : 00003308',-540.80,'2.1.01.01.004-CUENTAS POR PAGAR SURE PACK'),
    mkR('P0082','SURE PACK','N/C','16/10/2025','24/10/2025',188,'00000460','Doc : 00003309',-86.25,'2.1.01.01.004-CUENTAS POR PAGAR SURE PACK'),
    mkR('P0082','SURE PACK','N/C','27/11/2025','27/11/2025',154,'00000488','Doc : 00000488',-1895.67,'2.1.01.01.004-CUENTAS POR PAGAR SURE PACK'),
    mkR('P0082','SURE PACK','Factura','07/01/2026','07/01/2026',113,'3332','FACTURA SURE PACK 3332 EMB 58',30971.20,'2.1.01.01.004-CUENTAS POR PAGAR SURE PACK'),
    mkR('P0082','SURE PACK','Factura','20/01/2026','21/03/2026',40,'3336','FACTURA 3336 SURE PACK EMB 59',10699.42,'2.1.01.01.004-CUENTAS POR PAGAR SURE PACK'),
    mkR('P0082','SURE PACK','Factura','04/02/2026','04/02/2026',85,'3323','FACTURA 3323 SURE PACK EMB 57',24000.00,'2.1.01.01.004-CUENTAS POR PAGAR SURE PACK'),
    mkR('P0082','SURE PACK','Factura','16/02/2026','17/04/2026',13,'3340','FACTURA 3340 FACTOR: 477.6250',12508.80,'2.1.01.01.004-CUENTAS POR PAGAR SURE PACK'),
    mkR('P0082','SURE PACK','Factura','09/03/2026','08/04/2026',22,'3349','FACTURA 3349 FACTOR 477,625',11855.50,'2.1.01.01.004-CUENTAS POR PAGAR SURE PACK'),
    mkR('P0082','SURE PACK','Factura','09/03/2026','08/04/2026',22,'3350','FACTURA 3350 FACTOR: 477,625',11222.00,'2.1.01.01.004-CUENTAS POR PAGAR SURE PACK'),
    mkR('P0082','SURE PACK','Factura','18/03/2026','17/05/2026',-17,'3353','FACTURA 3353 FACTOR: 478.581',7421.80,'2.1.01.01.004-CUENTAS POR PAGAR SURE PACK'),
  ],
  cxp_pacomela: [
    mkR('P0511','AGRO INDUSTRIAS LACTEAS PACOMELA, C.A','Factura','02/01/2026','02/01/2026',118,'2602','CONTRATO',169547.91,'2.1.01.02.007-INMUEBLE POR PAGAR'),
    mkR('P0511','AGRO INDUSTRIAS LACTEAS PACOMELA, C.A','Adelanto','04/03/2026','04/03/2026',57,'0403','ABONO PROVEEDOR PACOMELA',-147546.91,'2.1.01.02.007-INMUEBLE POR PAGAR'),
    mkR('P0511','AGRO INDUSTRIAS LACTEAS PACOMELA, C.A','Adelanto','06/04/2026','06/04/2026',24,'0604','ABONO AGRO INDUSTRIAS LACTEAS PACOMELA, C.A',-1827.40,'2.1.01.02.007-INMUEBLE POR PAGAR'),
  ],
  cxp_autototal: [
    mkR('P0338','AUTO TOTAL, C.A','Factura','07/10/2025','07/10/2025',205,'11166','Factor:187,2893 Doc:11166',2797.98,'2.1.01.02.008-VEHÍCULOS POR PAGAR'),
    mkR('P0338','AUTO TOTAL, C.A','Factura','07/10/2025','07/10/2025',205,'11164','Factor:187,2893 Doc:11164',17532.25,'2.1.01.02.008-VEHÍCULOS POR PAGAR'),
    mkR('P0338','AUTO TOTAL, C.A','Factura','07/10/2025','07/10/2025',205,'11165','Factor:187,2893 Doc:11165',780.00,'2.1.01.02.008-VEHÍCULOS POR PAGAR'),
    mkR('P0338','AUTO TOTAL, C.A','Adelanto','08/10/2025','08/10/2025',204,'1','Adelanto',-7766.00,'2.1.01.02.008-VEHÍCULOS POR PAGAR'),
    mkR('P0338','AUTO TOTAL, C.A','Adelanto','08/10/2025','08/10/2025',204,'2','Adelanto',-4905.38,'2.1.01.02.008-VEHÍCULOS POR PAGAR'),
  ],
  cxp_general: [
    mkR('P0040','PAPELERIA ESTEVA EL TRANSITO,C.A.','Factura','15/04/2026','22/04/2026',8,'0000033995','Doc : 0000033995',202.43,'2.1.01.01.001-CUENTAS POR PAGAR PROVEEDORES'),
    mkR('P0040','PAPELERIA ESTEVA EL TRANSITO,C.A.','Factura','22/04/2026','29/04/2026',1,'0000034111','Doc : 0000034111',79.57,'2.1.01.01.001-CUENTAS POR PAGAR PROVEEDORES'),
    mkR('P0040','PAPELERIA ESTEVA EL TRANSITO,C.A.','Factura','24/04/2026','01/05/2026',-1,'0000034154','Doc : 0000034154',60.54,'2.1.01.01.001-CUENTAS POR PAGAR PROVEEDORES'),
    mkR('P0074','OK PIZZA, COMPAÑIA ANONIMA','Factura','09/09/2025','09/09/2025',233,'003077','Factor:154,9825 Doc:003077',18.02,'2.1.01.01.001-CUENTAS POR PAGAR PROVEEDORES'),
    mkR('P0103','SERVICIOS Y MANT. ENRIQUE FLEIRES FP','Factura','13/04/2026','13/04/2026',17,'000927','Doc : 000927',29.78,'2.1.01.01.001-CUENTAS POR PAGAR PROVEEDORES'),
    mkR('P0103','SERVICIOS Y MANT. ENRIQUE FLEIRES FP','Factura','21/04/2026','21/04/2026',9,'000933','Doc : 000933',396.07,'2.1.01.01.001-CUENTAS POR PAGAR PROVEEDORES'),
    mkR('P0103','SERVICIOS Y MANT. ENRIQUE FLEIRES FP','Factura','23/04/2026','23/04/2026',7,'000934','Doc : 000934',29.77,'2.1.01.01.001-CUENTAS POR PAGAR PROVEEDORES'),
    mkR('P0117','E. P. & O. ASOCIADOS, C. A.','Factura','20/04/2026','20/04/2026',10,'00003138','Doc : 00003138',357.00,'2.1.01.01.001-CUENTAS POR PAGAR PROVEEDORES'),
    mkR('P0117','E. P. & O. ASOCIADOS, C. A.','Factura','20/04/2026','20/04/2026',10,'00003142','Doc : 00003142',900.00,'2.1.01.01.001-CUENTAS POR PAGAR PROVEEDORES'),
    mkR('P0117','E. P. & O. ASOCIADOS, C. A.','Factura','23/04/2026','23/04/2026',7,'00003146','Doc : 00003146',900.00,'2.1.01.01.001-CUENTAS POR PAGAR PROVEEDORES'),
    mkR('P0117','E. P. & O. ASOCIADOS, C. A.','Factura','23/04/2026','23/04/2026',7,'00003145','Doc : 00003145',900.00,'2.1.01.01.001-CUENTAS POR PAGAR PROVEEDORES'),
    mkR('P0117','E. P. & O. ASOCIADOS, C. A.','Factura','24/04/2026','24/04/2026',6,'00003147','Doc : 00003147',900.00,'2.1.01.01.001-CUENTAS POR PAGAR PROVEEDORES'),
    mkR('P0293','RUTA 70 CAR WASH AND SERVICE, C.A','Factura','28/04/2026','04/05/2026',-4,'PRSPTO 08','PRESUPUESTO 08',104.75,'2.1.01.01.001-CUENTAS POR PAGAR PROVEEDORES'),
    mkR('P0348','ANGEL EDUARDO GARCIA RINCON','Factura','20/03/2026','20/03/2026',41,'000056','Doc : 000056',176.00,'2.1.01.01.001-CUENTAS POR PAGAR PROVEEDORES'),
    mkR('P0369','CORPORACION VENEZOLANA DE SEGURIDAD I, C.A.','Factura','13/04/2026','19/04/2026',11,'PROFORMA 01','PROFORMA 01',918.72,'2.1.01.01.001-CUENTAS POR PAGAR PROVEEDORES'),
    mkR('P0418','PINTURAS Y DECORACIONES, C.A','Factura','21/04/2026','28/04/2026',2,'00026073','Doc : 00026073',43.93,'2.1.01.01.001-CUENTAS POR PAGAR PROVEEDORES'),
    mkR('P0466','DISTRIBUIDORA Y SERVICIOS INTEGRALES C A','Factura','17/04/2026','24/04/2026',6,'ODC 0079','ODC 0079',41.76,'2.1.01.01.001-CUENTAS POR PAGAR PROVEEDORES'),
    mkR('P0466','DISTRIBUIDORA Y SERVICIOS INTEGRALES C A','Factura','23/04/2026','30/04/2026',0,'ODC 0082','ODC 0082',50.34,'2.1.01.01.001-CUENTAS POR PAGAR PROVEEDORES'),
    mkR('P0466','DISTRIBUIDORA Y SERVICIOS INTEGRALES C A','Factura','30/04/2026','07/05/2026',-7,'ODC 84','ODC 84',39.44,'2.1.01.01.001-CUENTAS POR PAGAR PROVEEDORES'),
    mkR('P0467','FERRETERIA ELECTRICA INDUSTRIAL, C.A.','Factura','16/03/2026','23/03/2026',38,'ODC 0061','ODC 0061',4187.76,'2.1.01.01.001-CUENTAS POR PAGAR PROVEEDORES'),
    mkR('P0467','FERRETERIA ELECTRICA INDUSTRIAL, C.A.','Factura','24/03/2026','31/03/2026',30,'ODC 0066','ODC 0066',114.84,'2.1.01.01.001-CUENTAS POR PAGAR PROVEEDORES'),
    mkR('P0492','EMPAQUES PLASTICOS CABIMAS C.A (EMPLASCA)','Factura','30/01/2026','20/02/2026',69,'ODC 0040','ODC 0040',29444.20,'2.1.01.01.001-CUENTAS POR PAGAR PROVEEDORES'),
    mkR('P0492','EMPAQUES PLASTICOS CABIMAS C.A (EMPLASCA)','Adelanto','30/01/2026','30/01/2026',90,'3001','ABONO INSUMOS Y SUMINISTROS BYB C.A.',-7000.00,'2.1.01.01.001-CUENTAS POR PAGAR PROVEEDORES'),
    mkR('P0492','EMPAQUES PLASTICOS CABIMAS C.A (EMPLASCA)','Adelanto','04/02/2026','04/02/2026',85,'9566','ABONO INSUMOS Y SUMINITROS BYB, C.A 50% ODC 0040',-7222.10,'2.1.01.01.001-CUENTAS POR PAGAR PROVEEDORES'),
    mkR('P0492','EMPAQUES PLASTICOS CABIMAS C.A (EMPLASCA)','Adelanto','21/04/2026','21/04/2026',9,'2004.','ABONO EMPAQUES PLASTICOS CABIMAS, C.A ODC 0040',-108.40,'2.1.01.01.001-CUENTAS POR PAGAR PROVEEDORES'),
    mkR('P0515','SUMINISTROS QUIVEN, C.A.','Adelanto','28/04/2026','28/04/2026',2,'2804','PAGO BASE SUMINISTROS QUIVEN, C.A',-578.50,'2.1.01.01.001-CUENTAS POR PAGAR PROVEEDORES'),
    mkR('P0515','SUMINISTROS QUIVEN, C.A.','Adelanto','30/04/2026','30/04/2026',0,'33333','PAGO IVA SUMINISTROS QUIVEN, C.A',-23.14,'2.1.01.01.001-CUENTAS POR PAGAR PROVEEDORES'),
    mkR('P0531','LOSDEKLUZ 2.0., C.A','Factura','27/03/2026','27/03/2026',34,'000000644','Doc : 000000644',311.63,'2.1.01.01.001-CUENTAS POR PAGAR PROVEEDORES'),
    mkR('P0531','LOSDEKLUZ 2.0., C.A','Adelanto','27/03/2026','27/03/2026',34,'6184','ABONO 70% LOSDKLUZ 2.0, C.A FAC: 000000644',-222.59,'2.1.01.01.001-CUENTAS POR PAGAR PROVEEDORES'),
  ]
};

// ============================================================================
// 3. COMPONENTE: ÁRBOL EXPANDIBLE (SE RESPETA APERTURA MANUAL)
// ============================================================================
const ExpandableRow = ({ node, level = 0, totalBaseUSD, defaultOpen = false, highlightedAccounts, toggleHighlight, onShowReport, isBalance = false, rootColorOverride = null }) => {
  const isAccountNode = /^\d\./.test(node.n) || (!node.c || node.c.length === 0);
  const isLeaf = !node.c || node.c.length === 0;
  
  // Respetar estado guardado localmente si fue expandido
  const [isOpen, setIsOpen] = useState(defaultOpen);
  useEffect(() => { setIsOpen(defaultOpen); }, [defaultOpen]);

  const accountCodeMatch = node.n.match(/^(\d[\d\.]+)/);
  const accountCode = accountCodeMatch ? accountCodeMatch[1] : null;
  const hasMapping = (accountCode && ACCOUNT_MAPS[accountCode]) || (isBalance && (node.n.toUpperCase().includes('POR COBRAR') || node.n.toUpperCase().includes('POR PAGAR')));

  const fmtCur = (v) => new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);
  const pct = totalBaseUSD && node.u !== 0 ? `${((Math.abs(node.u) / Math.abs(totalBaseUSD)) * 100).toFixed(2)}%` : '';
  const indent = { paddingLeft: `${level * 18 + 10}px` };

  // Evitar romper el render si node es undefined
  if (!node) return null;

  if (!isLeaf && !isAccountNode) {
    const isRoot = level === 0;
    let rootColor = rootColorOverride || 'text-orange-500'; 
    let borderColor = rootColorOverride ? rootColorOverride.replace('text-', 'border-') : 'border-orange-500';
    
    if (isBalance && !rootColorOverride) {
      if (node.n.includes('ACTIVO')) { rootColor = 'text-blue-500'; borderColor = 'border-blue-500'; }
      else if (node.n.includes('PASIVO')) { rootColor = 'text-red-500'; borderColor = 'border-red-500'; }
      else if (node.n.includes('PATRIMONIO')) { rootColor = 'text-purple-500'; borderColor = 'border-purple-500'; }
    }

    return (
      <>
        <tr className={isRoot ? 'bg-slate-100/50 print:bg-white print:border-b-2 print:border-slate-300' : 'bg-white border-b border-gray-100 print:bg-white'}>
          <td style={indent} className={isRoot ? `py-3 px-3 ${rootColor} font-black text-xs uppercase tracking-[0.2em] print:text-black` : 'py-2 px-3 font-black text-[11px] text-slate-800 uppercase print:text-black'}>{node.n}</td>
          <td colSpan={3} />
        </tr>
        
        {/* Solo renderiza hijos si está expandido, así el PDF respeta la vista */}
        {isOpen && node.c && node.c.map((child, i) => (
          <ExpandableRow key={i} node={child} level={level + 1} totalBaseUSD={totalBaseUSD} defaultOpen={defaultOpen} highlightedAccounts={highlightedAccounts} toggleHighlight={toggleHighlight} onShowReport={onShowReport} isBalance={isBalance}/>
        ))}

        {isOpen && (
          <tr className={`${isRoot ? `bg-slate-800 print:bg-slate-100 text-white print:text-black border-t-2 ${borderColor} print:border-slate-400` : 'bg-slate-200 text-slate-800 border-t border-slate-300 print:bg-slate-50 print:text-black'} shadow-sm print:shadow-none`}>
            <td style={{ paddingLeft: level * 18 + 28 }} className="py-2.5 px-3 font-black text-[10px] uppercase tracking-wider print:text-black">TOTAL {node.n}</td>
            <td className={`py-2.5 px-3 text-right font-mono text-[11px] font-black ${isRoot ? rootColor : 'text-slate-900'} print:text-black`}>{fmtCur(Math.abs(node.u))}</td>
            <td className={`py-2.5 px-3 text-right font-mono text-[11px] font-black hidden sm:table-cell ${isRoot ? rootColor : 'text-slate-900'} print:text-black`}>{fmtCur(Math.abs(node.b))}</td>
            <td className={`py-2.5 px-3 text-right font-mono text-[11px] font-black ${isRoot ? rootColor : 'text-slate-900'} print:text-black`}>{pct}</td>
          </tr>
        )}
        
        {/* Fila compacta cuando está cerrado */}
        {!isOpen && isRoot && (
           <tr className={`bg-slate-800 print:bg-slate-100 text-white print:text-black border-t-2 ${borderColor} print:border-slate-400 shadow-sm print:shadow-none cursor-pointer`} onClick={() => setIsOpen(true)}>
             <td style={{ paddingLeft: level * 18 + 10 }} className="py-2.5 px-3 font-black text-xs uppercase tracking-widest print:text-black flex items-center gap-2">
               <span className="no-print inline-flex items-center justify-center w-4 h-4 border rounded-sm text-[11px] leading-none bg-white text-slate-800">+</span>
               {node.n}
             </td>
             <td className={`py-2.5 px-3 text-right font-mono text-[11px] font-black ${rootColor} print:text-black`}>{fmtCur(Math.abs(node.u))}</td>
             <td className={`py-2.5 px-3 text-right font-mono text-[11px] font-black hidden sm:table-cell ${rootColor} print:text-black`}>{fmtCur(Math.abs(node.b))}</td>
             <td className={`py-2.5 px-3 text-right font-mono text-[11px] font-black ${rootColor} print:text-black`}>{pct}</td>
           </tr>
        )}
      </>
    );
  }

  // Nodos Hojas / Cuentas Individuales
  if (isLeaf || isAccountNode) {
    const isHighlighted = highlightedAccounts?.has(node.n);
    return (
      <>
        <tr onClick={() => !isLeaf && setIsOpen(!isOpen)} className={`border-b border-gray-200 cursor-pointer transition-colors ${isHighlighted ? 'bg-amber-100/80 hover:bg-amber-200 border-l-4 border-amber-500 print:bg-transparent print:border-l-0' : 'bg-white hover:bg-slate-50 border-l-4 border-slate-400 print:bg-transparent print:border-l-0'}`}>
          <td style={indent} className="py-2.5 px-3 font-bold text-[11px] text-slate-900 uppercase select-none flex items-center flex-wrap gap-2 print:pl-6 print:text-black">
            {!isLeaf && <span className={`no-print inline-flex items-center justify-center w-4 h-4 border rounded-sm text-[11px] leading-none transition-colors ${isOpen ? 'border-slate-500 text-slate-600 bg-slate-100' : 'border-slate-300 text-slate-400 bg-white'}`}>{isOpen ? '−' : '+'}</span>}
            <button onClick={(e) => { e.stopPropagation(); toggleHighlight(node.n); }} className="no-print focus:outline-none transition-transform hover:scale-110"><Star size={16} fill={isHighlighted ? "#f59e0b" : "none"} color={isHighlighted ? "#f59e0b" : "#cbd5e1"} /></button>
            <span className="truncate">{node.n}</span>
            {hasMapping && isBalance && (
              <button onClick={(e) => { 
                e.stopPropagation(); 
                const typeToPass = accountCode ? accountCode : (node.n.toUpperCase().includes('COBRAR') ? 'cxc' : 'cxp');
                onShowReport(typeToPass); 
              }} className="no-print ml-2 px-2.5 py-1 bg-blue-600 text-white rounded-md text-[9px] font-black tracking-widest hover:bg-blue-700 shadow-md flex items-center gap-1">
                <Search size={10}/> VER REPORTE
              </button>
            )}
          </td>
          <td className={`py-2.5 px-3 text-right font-mono text-[11px] font-bold ${isHighlighted ? 'text-amber-900' : 'text-slate-800'} print:text-black`}>{fmtCur(Math.abs(node.u))}</td>
          <td className={`py-2.5 px-3 text-right font-mono text-[11px] font-bold hidden sm:table-cell ${isHighlighted ? 'text-amber-900' : 'text-slate-800'} print:text-black`}>{fmtCur(Math.abs(node.b))}</td>
          <td className={`py-2.5 px-3 text-right font-mono text-[11px] font-bold ${isHighlighted ? 'text-amber-700' : 'text-slate-500'} print:text-black`}>{pct}</td>
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
    <div className="animate-in fade-in duration-300 print-area bg-white p-4">
      <PrintStyles />
      <button onClick={onBack} className="no-print flex items-center gap-2 text-slate-500 hover:text-slate-800 font-black text-xs uppercase mb-4 transition-colors"><ArrowLeft size={16}/> Volver al Balance</button>
      <HeaderMembretado />
      <div className="flex items-center justify-between mb-6 bg-white p-6 rounded-2xl shadow-sm print:shadow-none border border-slate-100 print:border-none print:p-0">
        <div>
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
            {mapInfo.type.includes('cxc') ? <Users className="text-blue-500 no-print"/> : <Briefcase className="text-red-500 no-print"/>}
            Auxiliar Detallado
          </h2>
          <p className="text-xs font-bold text-slate-400 print:text-black uppercase mt-1">
            {accountCode.includes('.') ? `Cuenta: ${accountCode} - ${mapInfo.label}` : 'Reporte Consolidado'}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black uppercase text-slate-400 print:text-black tracking-widest">Saldo en Cuenta</p>
          <p className={`text-2xl font-mono font-black ${mapInfo.type.includes('cxc') ? 'text-blue-600 print:text-black' : 'text-red-600 print:text-black'}`}>USD {fmtCur(total)}</p>
        </div>
      </div>
      <div className="bg-white rounded-2xl shadow-xl print:shadow-none overflow-hidden border border-slate-200 print:border-none">
        <div className="overflow-x-auto">
        <table id="table-auxiliar" className="w-full text-left border-collapse" style={{minWidth:'900px'}}>
          <thead className="bg-slate-800 print:bg-slate-200 text-[9px] uppercase font-black text-slate-300 print:text-black">
            <tr>
              <th className="px-3 py-4">Código</th>
              <th className="px-3 py-4">Descripción</th>
              <th className="px-3 py-4">Operación</th>
              <th className="px-3 py-4">Emisión</th>
              <th className="px-3 py-4">Vencimiento</th>
              <th className="px-3 py-4 text-right">Días</th>
              <th className="px-3 py-4">No. Documento</th>
              <th className="px-3 py-4 text-right">Monto USD</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-8 text-slate-400 font-bold">Sin transacciones registradas en este auxiliar.</td></tr>
            ) : (
              filteredData.map((item, i) => (
                <tr key={i} className="border-b border-slate-100 hover:bg-slate-50 transition-colors print:border-slate-300">
                  <td className="px-3 py-2.5 text-[11px] font-bold text-slate-500 print:text-slate-800 whitespace-nowrap">{item.cod}</td>
                  <td className="px-3 py-2.5 text-[11px] font-black text-slate-800 print:text-black max-w-[160px] truncate">{item.nombre}</td>
                  <td className="px-3 py-2.5 text-[11px] text-slate-600 print:text-slate-900 whitespace-nowrap">{item.operacion || '-'}</td>
                  <td className="px-3 py-2.5 text-[11px] text-slate-500 print:text-slate-900 whitespace-nowrap font-mono">{item.emision}</td>
                  <td className="px-3 py-2.5 text-[11px] text-slate-500 print:text-slate-900 whitespace-nowrap font-mono">{item.vence}</td>
                  <td className={`px-3 py-2.5 text-right text-[11px] font-mono whitespace-nowrap ${Number(item.dias) < 0 ? 'text-red-500 font-bold print:text-black' : 'text-slate-500 print:text-black'}`}>{item.dias ?? '-'}</td>
                  <td className="px-3 py-2.5 text-[11px] text-slate-600 print:text-slate-900 font-mono whitespace-nowrap">{item.doc}</td>
                  <td className={`px-3 py-2.5 text-right text-[12px] font-mono font-bold whitespace-nowrap ${item.monto < 0 ? 'text-red-500 print:text-black' : 'text-slate-900 print:text-black'}`}>{fmtCur(item.monto)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>
      <div className="no-print mt-6 flex justify-end gap-3">
         <button onClick={() => window.print()} className="px-4 py-2 bg-slate-800 text-white rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-slate-700 shadow-md"><Printer size={14}/> Imprimir PDF</button>
         <button onClick={() => handleExportExcel('table-auxiliar', `Auxiliar_${accountCode}`, `Auxiliar de Cuentas - ${mapInfo.label}`)} className="px-4 py-2 bg-emerald-700 text-white rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-600 shadow-md"><Download size={14}/> Exportar Excel</button>
      </div>
    </div>
  );
}
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

  const detectYear = (name) => {
    const y = name.match(/20\d{2}/);
    return y ? y[0] : new Date().getFullYear().toString();
  };
  const fileYear = detectYear(file.name);

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
            year: fileYear,
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
const isNewAuxFormat = (row) => {
  if (!row || row.length < 8) return false;
  const cells = row.map(c => c ? String(c).toLowerCase().trim() : '');
  return cells.some(c => c.includes('operaci') || c.includes('descripci') || c.includes('cuenta contable'));
};

const processAuxFile = async (files) => {
  const result = { cxc_general: [], cxc_zuliana: [], cxp_autototal: [], cxp_surepack: [], cxp_pacomela: [], cxp_yancarlos: [], cxp_general: [] };

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
    let sheetsData = []; 

    if (ext === 'xlsx' || ext === 'xls' || ext === 'xlsm') {
      const XL = await loadSheetJS();
      const buffer = await file.arrayBuffer();
      const wb = XL.read(buffer, { type: 'array', cellDates: false });
      for (const sheetName of wb.SheetNames) {
        const ws = wb.Sheets[sheetName];
        const rows = XL.utils.sheet_to_json(ws, { header: 1, defval: null, raw: true });
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
        for (let i = headerIdx + 1; i < dataRows.length; i++) {
          const row = dataRows[i];
          if (!row || row.every(c => !c)) continue;
          const nombre = row[1] ? String(row[1]).trim().toUpperCase() : '';
          const monto = parseVal(row[8]);
          if (!nombre || monto === null) continue;

          const cuentaContable = row[9] ? String(row[9]).trim() : '';
          const codeMatch = cuentaContable.match(/^(\d[\d\.]+)/);
          const accountCode = codeMatch ? codeMatch[1] : null;
          const mapInfo = accountCode ? ACCOUNT_MAPS[accountCode] : null;
          const bucket = (mapInfo && result[mapInfo.type] !== undefined) ? mapInfo.type : null;
          if (!bucket) continue; 

          result[bucket].push({
            cod:            row[0] ? String(row[0]).trim() : '-',
            nombre,
            operacion:      row[2] ? String(row[2]).trim() : '-',
            emision:        parseDate(row[3]),
            vence:          parseDate(row[4]),
            dias:           row[5] !== null && row[5] !== undefined ? String(row[5]).trim() : '-',
            doc:            row[6] ? String(row[6]).trim() : '-',
            descripcion:    row[7] ? String(row[7]).trim() : '-',
            monto,
            cuentaContable,
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
      if (headerIdx === -1) { colMap = { cod:0, nombre:1, doc:2, emision:3, vence:4, monto:5 }; headerIdx = 0; }

      for (let i = headerIdx + 1; i < dataRows.length; i++) {
        const row = dataRows[i];
        if (!row || row.every(c => !c)) continue;
        const nombre = colMap.nombre >= 0 && row[colMap.nombre] ? String(row[colMap.nombre]).trim().toUpperCase() : '';
        const monto = colMap.monto >= 0 ? parseVal(row[colMap.monto]) : null;
        if (!nombre || monto === null || monto === 0) continue;

        const record = {
          cod: colMap.cod >= 0 && row[colMap.cod] ? String(row[colMap.cod]).trim() : '-',
          nombre, operacion: '-', dias: '-', descripcion: '-', cuentaContable: '',
          doc:     colMap.doc >= 0 && row[colMap.doc] ? String(row[colMap.doc]).trim() : '-',
          emision: colMap.emision >= 0 ? parseDate(row[colMap.emision]) : '-',
          vence:   colMap.vence >= 0 ? parseDate(row[colMap.vence]) : '-',
          monto,
        };
        
        if      (nombre.includes('ZULIANA DE EMPAQUE'))                                    result.cxc_zuliana.push({...record, monto: Math.abs(monto)});
        else if (nombre.includes('AUTO TOTAL'))                                            result.cxp_autototal.push(record);
        else if (nombre.includes('SURE PACK'))                                            result.cxp_surepack.push(record);
        else if (nombre.includes('PACOMELA') || nombre.includes('AGRO INDUSTRIAS LACTEAS')) result.cxp_pacomela.push(record);
        else if (nombre.includes('YANCARLOS') || nombre.includes('PEREZ CASANOVA'))       result.cxp_yancarlos.push(record);
        else result.cxp_general.push(record);
      }
    }
  }
  return result;
};

// ============================================================================
// 2. CONFIGURACIÓN DE MAPEO Y DATA PRECARGADA (PDFs)
// ============================================================================
const ACCOUNT_MAPS = {
  '1.1.02.01.001': { type: 'cxc_general',  label: 'Cuentas por Cobrar Clientes' },
  '1.1.05.01.008': { type: 'cxc_zuliana',  label: 'Anticipos a Proveedores Zuliana' },
  '2.1.01.02.008': { type: 'cxp_autototal', label: 'Vehículos por Pagar' },
  '2.1.01.01.004': { type: 'cxp_surepack',  label: 'CxP Sure Pack' },
  '2.1.01.02.007': { type: 'cxp_pacomela',  label: 'Inmueble por Pagar' },
  '2.1.01.01.003': { type: 'cxp_yancarlos', label: 'Otras CxP Proveedores' },
  '2.1.01.01.001': { type: 'cxp_general',   label: 'Cuentas por Pagar Proveedores' }
};

const mkR = (cod,nombre,operacion,emision,vence,dias,doc,descripcion,monto,cc) =>
  ({ cod, nombre, operacion, emision, vence, dias: String(dias), doc, descripcion, monto, cuentaContable: cc });

const DEFAULT_AUX_DATA = {
  cxc_general: [
    mkR('C0047','ALIMENTOS BOTALON C.A','Factura','30/04/2026','07/05/2026',-7,'00002973','Doc : 00002973',519.51,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0084','ANIMAL FEED SOLUTIONS., C.A','Factura','17/04/2026','24/04/2026',6,'00002935','Doc : 00002935',12011.22,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0084','ANIMAL FEED SOLUTIONS., C.A','Factura','28/04/2026','05/05/2026',-5,'00002962','Doc : 00002962',1433.20,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0400','C.A RON SANTA TERESA, S.A.C.A','Factura','16/04/2026','28/04/2026',2,'00002933','Doc : 00002933',3524.54,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0119','C.A. CENTRAL LA PASTORA','Factura','19/11/2025','04/12/2025',147,'00002666','Factor:237,7505 Doc:00002666',3178.47,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0119','C.A. CENTRAL LA PASTORA','Adelanto','19/02/2026','19/02/2026',70,'00000410','ANTICIPO CENTRAL LA PASTORA, C.A',-2000,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0119','C.A. CENTRAL LA PASTORA','Factura','24/02/2026','03/03/2026',58,'00002827','Doc : 00002827',5230.62,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0119','C.A. CENTRAL LA PASTORA','Factura','26/02/2026','05/03/2026',56,'00002835','Doc : 00002835',1038.96,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0119','C.A. CENTRAL LA PASTORA','Adelanto','24/04/2026','24/04/2026',6,'00000552','ANTICIPO C.A CENTRAL LA PASTORA',-3448.05,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0012','CONVELAC, C.A.','Factura','16/04/2026','16/04/2026',14,'00002932','Doc : 00002932',201.60,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0051','ENVASES MUNDIAL, C.A','Adelanto','17/09/2025','17/09/2025',225,'00002277','Adelanto - Factor: 161,8880',-15.01,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0051','ENVASES MUNDIAL, C.A','Adelanto','17/09/2025','17/09/2025',225,'00002278','Adelanto - Factor: 161,8880',-5.52,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0051','ENVASES MUNDIAL, C.A','Adelanto','02/12/2025','02/12/2025',149,'00002465','Adelanto - Factor: 247,30',-18.39,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0051','ENVASES MUNDIAL, C.A','Factura','09/03/2026','16/03/2026',45,'2309','Factura NF Factor: 433,1664',4091.55,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0051','ENVASES MUNDIAL, C.A','Factura','30/04/2026','30/04/2026',0,'2437','Factura NF - Factor: 487,1192',234.97,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0004','INDUSTRIA ALIMENTICIA NACIONAL DE CEREALES Y HARINAS','Factura','03/03/2026','10/03/2026',51,'00002841','Doc : 00002841',2059.20,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0004','INDUSTRIA ALIMENTICIA NACIONAL DE CEREALES Y HARINAS','Factura','24/03/2026','31/03/2026',30,'00002894','Doc : 00002894',1613.49,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0004','INDUSTRIA ALIMENTICIA NACIONAL DE CEREALES Y HARINAS','Factura','22/04/2026','29/04/2026',1,'00002938','Doc : 00002938',10370.40,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0094','INDUSTRIAS MAROS, C.A.','Factura','18/02/2026','25/02/2026',64,'18021','Factura Factor: 396,3674',5265.26,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0363','INGENIERIA CREATIVA, C.A','Factura','30/04/2026','07/05/2026',-7,'2434','Factura NF - Factor: 487,1192',286.72,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0043','INVERSIONES AVICOLAS, C.A.','Adelanto','06/04/2026','06/04/2026',24,'00000519','ANTICIPO 30% ODC 45/75884 INVERSIONES AVICOLAS',-1050,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0043','INVERSIONES AVICOLAS, C.A.','Adelanto','09/04/2026','09/04/2026',21,'00000523','ANTICIPO ODC 45/75899 DIV $ INVERSIONES AVICOLAS',-6480,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0043','INVERSIONES AVICOLAS, C.A.','Factura','27/04/2026','04/05/2026',-4,'00002960','Doc : 00002960',7498.01,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0043','INVERSIONES AVICOLAS, C.A.','Factura','27/04/2026','04/05/2026',-4,'00002961','Doc : 00002961',1670.40,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0043','INVERSIONES AVICOLAS, C.A.','Factura','28/04/2026','05/05/2026',-5,'00002964','Doc : 00002964',422.24,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0043','INVERSIONES AVICOLAS, C.A.','Factura','30/04/2026','07/05/2026',-7,'00002972','Doc : 00002972',7512.25,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0011','INVERSIONES LACTEAS SAN SIMON, C.A','Factura','24/04/2026','01/05/2026',-1,'00002952','Doc : 00002952',5881.20,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0037','INVERSIONES LUXÓS, C.A.','N/D','25/07/2023','01/08/2023',1003,'00000537','N.E 341 4.740$ Factor: 29,0872',1754.20,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0037','INVERSIONES LUXÓS, C.A.','Adelanto','20/08/2025','20/08/2025',253,'00002208','Adelanto - 150$ Factor: 192',-150,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0037','INVERSIONES LUXÓS, C.A.','Adelanto','15/09/2025','15/09/2025',227,'00002267','Adelanto - Factor: 158,9289',-170,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0037','INVERSIONES LUXÓS, C.A.','Adelanto','18/02/2026','18/02/2026',71,'00000408','Adelanto Factor: 398,7456',-80,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0037','INVERSIONES LUXÓS, C.A.','Adelanto','23/02/2026','23/02/2026',66,'00000415','Adelanto Factor: 460',-100,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0165','INVERSIONES NESMOCA, C.A','Factura','09/02/2024','01/03/2024',790,'00001455','Factor:36,2919 Doc:00001455 Palmar 1',1184.46,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0165','INVERSIONES NESMOCA, C.A','Factura','09/02/2024','01/03/2024',790,'00001456','Factor:36,2919 - Produvisa',2553.86,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0165','INVERSIONES NESMOCA, C.A','Factura','14/02/2024','06/03/2024',785,'00001457','Factor:36,3185 - Palmar 2',593.92,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0165','INVERSIONES NESMOCA, C.A','Factura','16/02/2024','08/03/2024',783,'00001460','Factor:36,2737 - Palmar 3',74.24,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0165','INVERSIONES NESMOCA, C.A','Factura','16/02/2024','08/03/2024',783,'00001462','Factor:36,2737 Doc:00001462',3758.40,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0165','INVERSIONES NESMOCA, C.A','Factura','15/03/2024','05/04/2024',755,'00001526','Factor:36,276 - Grupo Serex',1559.04,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0165','INVERSIONES NESMOCA, C.A','Factura','04/04/2024','25/04/2024',735,'00001562','Factor:36,2493 - Cartonera',751.68,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0165','INVERSIONES NESMOCA, C.A','Factura','11/04/2024','02/05/2024',728,'00001575','Factor:36,1883 - Purolomo 1',3006.72,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0164','INVERSIONES SELVA, C. A.','Factura','29/04/2026','14/05/2026',-14,'00002967','Doc : 00002967',1577.31,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0202','JOSE LUIS BOHORQUEZ','Factura','14/04/2026','21/04/2026',9,'2393','Factura NF Factor: 477,6259',122.15,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0312','JULIO CESAR OJEDA CASANOVA','Factura','16/10/2025','16/10/2025',196,'00002605','Factor:201,4665 Doc:00002605',58.46,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0312','JULIO CESAR OJEDA CASANOVA','N/D','02/12/2025','09/12/2025',142,'00002563','NE 2116 - 58,46$ Factor 247,4071',58.46,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0312','JULIO CESAR OJEDA CASANOVA','Factura','06/02/2026','13/02/2026',76,'2248.','Factura F - Factor: 381,1074',239.42,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0312','JULIO CESAR OJEDA CASANOVA','Factura','18/03/2026','25/03/2026',36,'2341','Factura NF Factor: 451,5072',30.16,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0312','JULIO CESAR OJEDA CASANOVA','Factura','23/03/2026','30/03/2026',31,'2347','Factura NF Factor: 457,0575',58.46,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0054','LA EXCELENCIA C.A.','Factura','24/04/2026','01/05/2026',-1,'2417','Factura NF - Factor: 483,8695',193.02,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0140','MARCOS ANTONIO RODRIGUEZ FINOL','Factura','20/03/2026','27/03/2026',34,'2343','Factura NF Factor: 455,2547',2227.20,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0140','MARCOS ANTONIO RODRIGUEZ FINOL','Adelanto','20/04/2026','20/04/2026',10,'00000561','ANTICIPO MARCOS ANTONIO RODRIGUEZ FINOL',-1000,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0155','MUEBLES & PRESTIGIOS, C.A','Factura','23/09/2025','30/09/2025',212,'00002564','Factor:168,4157 Doc:00002564',37.31,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0013','PAPELES VENEZOLANOS, C.A.','Factura','20/04/2026','23/04/2026',7,'00002937','Doc : 00002937',21158.40,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0013','PAPELES VENEZOLANOS, C.A.','Factura','22/04/2026','02/05/2026',-2,'00002939','Doc : 00002939',21158.40,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0319','PEGAMENTOS UTILES DE VENEZUELA, C.A','Factura','30/04/2026','07/05/2026',-7,'2436','Factura NF - Factor: 487,1192',1820.00,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0195','PINTURAS DEL CARIBE, S.A.','Factura','24/03/2026','31/03/2026',30,'2353','Factura NF Factor: 459,4525',3377.92,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0188','PRODUCTOS DE VIDRIO S.A (PRODUVISA)','Factura','14/04/2026','21/04/2026',9,'00002927','Doc : 00002927',9552.62,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0188','PRODUCTOS DE VIDRIO S.A (PRODUVISA)','Factura','14/04/2026','21/04/2026',9,'00002928','Doc : 00002928',2349.69,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0188','PRODUCTOS DE VIDRIO S.A (PRODUVISA)','Factura','29/04/2026','06/05/2026',-6,'00002968','Doc : 00002968',13937.40,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0223','PRODUCTOS LACTEOS LA ARGENTINA, C.A.','Adelanto','13/11/2025','13/11/2025',168,'00002421','Adelanto - Factor: 233,56',-6.86,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0005','RIAS, CA','Factura','31/03/2026','07/04/2026',23,'2369','Factura NF - Factor: 473,8702',1948.80,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0139','VE-PACK INVESTMENT, C.A','Adelanto','10/11/2025','10/11/2025',171,'00002398','Adelanto - Factor: 231,0462',-22.08,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0139','VE-PACK INVESTMENT, C.A','Factura','26/03/2026','02/04/2026',28,'2358','Factura NF - Factor: 466,6014',1131.00,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0139','VE-PACK INVESTMENT, C.A','Factura','26/03/2026','02/04/2026',28,'2359','Factura NF - Factor: 466,6014',181.66,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0139','VE-PACK INVESTMENT, C.A','Factura','30/03/2026','06/04/2026',24,'2367','Factura NF Factor: 471,7004',100.90,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0184','VENEZOLANA DEL VIDRIO C.A. (VENVIDRIO)','N/D','19/03/2024','03/04/2024',757,'00001219','N.E 845 341,51$ Factor 36,2653',341.51,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0184','VENEZOLANA DEL VIDRIO C.A. (VENVIDRIO)','N/D','21/11/2025','21/11/2025',160,'00002548','NE 2086 100,05$ Factor: 241,5780',100.05,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0002','VENILAC C.A','Factura','12/03/2026','19/03/2026',42,'2324','Factura NF Factor: 440,9657',233.86,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0002','VENILAC C.A','Factura','20/04/2026','27/04/2026',3,'2402','Factura NF - Factor: 481,2177',9621.50,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0002','VENILAC C.A','Factura','24/04/2026','24/04/2026',6,'00002957','Doc : 00002957',1217.25,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0216','VICTOR HUGO RODRIGUEZ ARAMBULO','Factura','31/07/2024','15/08/2024',623,'00001779','Doc:00001779 - Procesadora Antartica',4800.00,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0216','VICTOR HUGO RODRIGUEZ ARAMBULO','Factura','28/02/2025','28/02/2025',426,'00002174','Doc:00002174 - EYS',86.98,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0216','VICTOR HUGO RODRIGUEZ ARAMBULO','N/D','30/04/2025','30/04/2025',365,'00002272','NE 1699 - Polimar',93.59,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0216','VICTOR HUGO RODRIGUEZ ARAMBULO','N/D','05/06/2025','12/06/2025',322,'00002385','NE 1781 - Alimentos Mar Caribe',872.79,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0216','VICTOR HUGO RODRIGUEZ ARAMBULO','N/D','13/08/2025','20/08/2025',253,'00002458','NE 1885 - Polimar',93.59,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0216','VICTOR HUGO RODRIGUEZ ARAMBULO','Factura','09/10/2025','09/10/2025',203,'00002589','Doc:00002589 - Inversora E&S',165.00,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0216','VICTOR HUGO RODRIGUEZ ARAMBULO','Factura','09/10/2025','09/10/2025',203,'00002593','Doc:00002593 - Julio Ojeda',271.98,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0216','VICTOR HUGO RODRIGUEZ ARAMBULO','N/D','10/10/2025','10/10/2025',202,'00002503','NE 1993 - Polimar',93.59,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0216','VICTOR HUGO RODRIGUEZ ARAMBULO','N/D','25/11/2025','25/11/2025',156,'00002550','NE 2094 - Polimar',93.59,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0216','VICTOR HUGO RODRIGUEZ ARAMBULO','Factura','30/01/2026','06/02/2026',83,'2234','NE 2234 - Polimar',93.54,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0216','VICTOR HUGO RODRIGUEZ ARAMBULO','Factura','10/04/2026','17/04/2026',13,'2381','Factura NF Factor: 476,4342 - Polimar',150.34,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
    mkR('C0227','VIDRIOS DOMESTICOS MAV C.C.S','Factura','22/04/2026','29/04/2026',1,'00002940','Doc : 00002940',1067.99,'1.1.02.01.001-CUENTAS POR COBRAR CLIENTES'),
  ],
  cxc_zuliana: [
    mkR('P0424','ZULIANA DE EMPAQUE, C.A','Adelanto','01/09/2025','01/09/2025',241,'1','Adelanto',11950.00,'1.1.05.01.008-ANTICIPOS A PROVEEDORES ZULIANA DE EMPAQUE'),
    mkR('P0424','ZULIANA DE EMPAQUE, C.A','Adelanto','03/09/2025','03/09/2025',239,'2','Adelanto',3022.56,'1.1.05.01.008-ANTICIPOS A PROVEEDORES ZULIANA DE EMPAQUE'),
    mkR('P0424','ZULIANA DE EMPAQUE, C.A','Adelanto','05/09/2025','05/09/2025',237,'3','Adelanto',200.00,'1.1.05.01.008-ANTICIPOS A PROVEEDORES ZULIANA DE EMPAQUE'),
    mkR('P0424','ZULIANA DE EMPAQUE, C.A','Adelanto','09/09/2025','09/09/2025',233,'4','Adelanto',40.00,'1.1.05.01.008-ANTICIPOS A PROVEEDORES ZULIANA DE EMPAQUE'),
    mkR('P0424','ZULIANA DE EMPAQUE, C.A','Adelanto','10/09/2025','10/09/2025',232,'5','Adelanto',30.00,'1.1.05.01.008-ANTICIPOS A PROVEEDORES ZULIANA DE EMPAQUE'),
    mkR('P0424','ZULIANA DE EMPAQUE, C.A','Adelanto','13/11/2025','13/11/2025',168,'5','Adelanto',40000.00,'1.1.05.01.008-ANTICIPOS A PROVEEDORES ZULIANA DE EMPAQUE'),
    mkR('P0424','ZULIANA DE EMPAQUE, C.A','Adelanto','13/11/2025','13/11/2025',168,'3','Adelanto',13269.00,'1.1.05.01.008-ANTICIPOS A PROVEEDORES ZULIANA DE EMPAQUE'),
    mkR('P0424','ZULIANA DE EMPAQUE, C.A','Adelanto','17/11/2025','17/11/2025',164,'1','Adelanto',15000.00,'1.1.05.01.008-ANTICIPOS A PROVEEDORES ZULIANA DE EMPAQUE'),
    mkR('P0424','ZULIANA DE EMPAQUE, C.A','Factura','30/01/2026','30/01/2026',90,'000040','Doc : 000040',-2219.49,'1.1.05.01.008-ANTICIPOS A PROVEEDORES ZULIANA DE EMPAQUE'),
    mkR('P0424','ZULIANA DE EMPAQUE, C.A','Factura','30/01/2026','30/01/2026',90,'000039','Factor:367,3069 Doc:000039',-5192.87,'1.1.05.01.008-ANTICIPOS A PROVEEDORES ZULIANA DE EMPAQUE'),
    mkR('P0424','ZULIANA DE EMPAQUE, C.A','Factura','27/02/2026','27/02/2026',62,'000042','Doc : 000042',-5150.05,'1.1.05.01.008-ANTICIPOS A PROVEEDORES ZULIANA DE EMPAQUE'),
  ],
  cxp_yancarlos: [
    mkR('P0005','YANCARLOS PEREZ CASANOVA','Factura','17/04/2026','17/04/2026',13,'001073','Doc : 001073',7920.07,'2.1.01.01.003-OTRAS CUENTAS POR PAGAR PROVEEDORES'),
    mkR('P0005','YANCARLOS PEREZ CASANOVA','Adelanto','17/04/2026','17/04/2026',13,'170426','PAGO MATERIA PRIMA 158,42 / FAC: 1073',-158.42,'2.1.01.01.003-OTRAS CUENTAS POR PAGAR PROVEEDORES'),
    mkR('P0005','YANCARLOS PEREZ CASANOVA','Adelanto','17/04/2026','17/04/2026',13,'17042026','PAGO MATERIA PRIMA 175$ / FAC: 1073',-175.00,'2.1.01.01.003-OTRAS CUENTAS POR PAGAR PROVEEDORES'),
    mkR('P0005','YANCARLOS PEREZ CASANOVA','Adelanto','22/04/2026','22/04/2026',8,'2204','EGRESO X Z2 / FAC: 1073',-1090.00,'2.1.01.01.003-OTRAS CUENTAS POR PAGAR PROVEEDORES'),
    mkR('P0005','YANCARLOS PEREZ CASANOVA','Adelanto','22/04/2026','22/04/2026',8,'220426.','PAGO DE MALLA 100$ / FAC: 1073',-100.00,'2.1.01.01.003-OTRAS CUENTAS POR PAGAR PROVEEDORES'),
    mkR('P0005','YANCARLOS PEREZ CASANOVA','Factura','23/04/2026','23/04/2026',7,'001075','Doc : 001075',10395.07,'2.1.01.01.003-OTRAS CUENTAS POR PAGAR PROVEEDORES'),
    mkR('P0005','YANCARLOS PEREZ CASANOVA','Adelanto','24/04/2026','24/04/2026',6,'1368','PAGO LEINYS CASTRO PERS. EVENTUAL / FAC: 1073',-80.00,'2.1.01.01.003-OTRAS CUENTAS POR PAGAR PROVEEDORES'),
    mkR('P0005','YANCARLOS PEREZ CASANOVA','Adelanto','24/04/2026','24/04/2026',6,'0358','PAGO JULIO ALBARRAN PERS. EVENTUAL 125$ / FAC: 1073',-125.00,'2.1.01.01.003-OTRAS CUENTAS POR PAGAR PROVEEDORES'),
    mkR('P0005','YANCARLOS PEREZ CASANOVA','Adelanto','24/04/2026','24/04/2026',6,'2701','PAGO RICARDO VIELMA PERS. EVENTUAL 90$ / FAC: 1073',-90.00,'2.1.01.01.003-OTRAS CUENTAS POR PAGAR PROVEEDORES'),
    mkR('P0005','YANCARLOS PEREZ CASANOVA','Adelanto','24/04/2026','24/04/2026',6,'3688','PAGO JOEL JIMENEZ CHOFER 100$ / FAC: 1073',-100.00,'2.1.01.01.003-OTRAS CUENTAS POR PAGAR PROVEEDORES'),
    mkR('P0005','YANCARLOS PEREZ CASANOVA','Adelanto','28/04/2026','28/04/2026',2,'7593','PAGO LUIS COMISIONES 304,31$ / FAC:1073',-304.31,'2.1.01.01.003-OTRAS CUENTAS POR PAGAR PROVEEDORES'),
    mkR('P0005','YANCARLOS PEREZ CASANOVA','Adelanto','30/04/2026','30/04/2026',0,'5429','PAGO BOLETOS AEREOS JCB-JDB / FAC: 1073',-152.45,'2.1.01.01.003-OTRAS CUENTAS POR PAGAR PROVEEDORES'),
    mkR('P0005','YANCARLOS PEREZ CASANOVA','Adelanto','30/04/2026','30/04/2026',0,'1464','PAGO 2 BOLETOS AEREOS JCB-JDB / FAC: 1073',-49.05,'2.1.01.01.003-OTRAS CUENTAS POR PAGAR PROVEEDORES'),
    mkR('P0005','YANCARLOS PEREZ CASANOVA','Adelanto','30/04/2026','30/04/2026',0,'3343','PAGO COMBUSTIBLE VIATICOS JDB / FAC: 1073',-13.96,'2.1.01.01.003-OTRAS CUENTAS POR PAGAR PROVEEDORES'),
    mkR('P0005','YANCARLOS PEREZ CASANOVA','Adelanto','30/04/2026','30/04/2026',0,'1822','PAGO ABIEL BONILLA FLETE / FAC: 1073',-100.00,'2.1.01.01.003-OTRAS CUENTAS POR PAGAR PROVEEDORES'),
    mkR('P0005','YANCARLOS PEREZ CASANOVA','Adelanto','30/04/2026','30/04/2026',0,'32900','PAGO JULIO ALBARRAN / FAC: 1073',-110.00,'2.1.01.01.003-OTRAS CUENTAS POR PAGAR PROVEEDORES'),
    mkR('P0005','YANCARLOS PEREZ CASANOVA','Adelanto','30/04/2026','30/04/2026',0,'1099','PAGO LEINYS CASTRO PERS. EVENTUAL / FAC: 1073',-80.00,'2.1.01.01.003-OTRAS CUENTAS POR PAGAR PROVEEDORES'),
    mkR('P0005','YANCARLOS PEREZ CASANOVA','Adelanto','30/04/2026','30/04/2026',0,'1173','PAGO RICARDO VIELMA PERS. EVENTUAL / FAC: 1073',-80.00,'2.1.01.01.003-OTRAS CUENTAS POR PAGAR PROVEEDORES'),
  ],
  cxp_surepack: [
    mkR('P0082','SURE PACK','Factura','12/08/2025','11/09/2025',231,'3284.','Doc: 3284 Factor: 195.2490',686.39,'2.1.01.01.004-CUENTAS POR PAGAR SURE PACK'),
    mkR('P0082','SURE PACK','Factura','12/08/2025','11/09/2025',231,'3285.','Doc: 3285 Factor: 195.2490',661.44,'2.1.01.01.004-CUENTAS POR PAGAR SURE PACK'),
    mkR('P0082','SURE PACK','Factura','12/08/2025','11/09/2025',231,'3286.','Doc: 3286 Factor: 223.6450',24112.85,'2.1.01.01.004-CUENTAS POR PAGAR SURE PACK'),
    mkR('P0082','SURE PACK','N/C','16/10/2025','24/10/2025',188,'00000459','Doc : 00003308',-540.80,'2.1.01.01.004-CUENTAS POR PAGAR SURE PACK'),
    mkR('P0082','SURE PACK','N/C','16/10/2025','24/10/2025',188,'00000460','Doc : 00003309',-86.25,'2.1.01.01.004-CUENTAS POR PAGAR SURE PACK'),
    mkR('P0082','SURE PACK','N/C','27/11/2025','27/11/2025',154,'00000488','Doc : 00000488',-1895.67,'2.1.01.01.004-CUENTAS POR PAGAR SURE PACK'),
    mkR('P0082','SURE PACK','Factura','07/01/2026','07/01/2026',113,'3332','FACTURA SURE PACK 3332 EMB 58',30971.20,'2.1.01.01.004-CUENTAS POR PAGAR SURE PACK'),
    mkR('P0082','SURE PACK','Factura','20/01/2026','21/03/2026',40,'3336','FACTURA 3336 SURE PACK EMB 59',10699.42,'2.1.01.01.004-CUENTAS POR PAGAR SURE PACK'),
    mkR('P0082','SURE PACK','Factura','04/02/2026','04/02/2026',85,'3323','FACTURA 3323 SURE PACK EMB 57',24000.00,'2.1.01.01.004-CUENTAS POR PAGAR SURE PACK'),
    mkR('P0082','SURE PACK','Factura','16/02/2026','17/04/2026',13,'3340','FACTURA 3340 FACTOR: 477.6250',12508.80,'2.1.01.01.004-CUENTAS POR PAGAR SURE PACK'),
    mkR('P0082','SURE PACK','Factura','09/03/2026','08/04/2026',22,'3349','FACTURA 3349 FACTOR 477,625',11855.50,'2.1.01.01.004-CUENTAS POR PAGAR SURE PACK'),
    mkR('P0082','SURE PACK','Factura','09/03/2026','08/04/2026',22,'3350','FACTURA 3350 FACTOR: 477,625',11222.00,'2.1.01.01.004-CUENTAS POR PAGAR SURE PACK'),
    mkR('P0082','SURE PACK','Factura','18/03/2026','17/05/2026',-17,'3353','FACTURA 3353 FACTOR: 478.581',7421.80,'2.1.01.01.004-CUENTAS POR PAGAR SURE PACK'),
  ],
  cxp_pacomela: [
    mkR('P0511','AGRO INDUSTRIAS LACTEAS PACOMELA, C.A','Factura','02/01/2026','02/01/2026',118,'2602','CONTRATO',169547.91,'2.1.01.02.007-INMUEBLE POR PAGAR'),
    mkR('P0511','AGRO INDUSTRIAS LACTEAS PACOMELA, C.A','Adelanto','04/03/2026','04/03/2026',57,'0403','ABONO PROVEEDOR PACOMELA',-147546.91,'2.1.01.02.007-INMUEBLE POR PAGAR'),
    mkR('P0511','AGRO INDUSTRIAS LACTEAS PACOMELA, C.A','Adelanto','06/04/2026','06/04/2026',24,'0604','ABONO AGRO INDUSTRIAS LACTEAS PACOMELA, C.A',-1827.40,'2.1.01.02.007-INMUEBLE POR PAGAR'),
  ],
  cxp_autototal: [
    mkR('P0338','AUTO TOTAL, C.A','Factura','07/10/2025','07/10/2025',205,'11166','Factor:187,2893 Doc:11166',2797.98,'2.1.01.02.008-VEHÍCULOS POR PAGAR'),
    mkR('P0338','AUTO TOTAL, C.A','Factura','07/10/2025','07/10/2025',205,'11164','Factor:187,2893 Doc:11164',17532.25,'2.1.01.02.008-VEHÍCULOS POR PAGAR'),
    mkR('P0338','AUTO TOTAL, C.A','Factura','07/10/2025','07/10/2025',205,'11165','Factor:187,2893 Doc:11165',780.00,'2.1.01.02.008-VEHÍCULOS POR PAGAR'),
    mkR('P0338','AUTO TOTAL, C.A','Adelanto','08/10/2025','08/10/2025',204,'1','Adelanto',-7766.00,'2.1.01.02.008-VEHÍCULOS POR PAGAR'),
    mkR('P0338','AUTO TOTAL, C.A','Adelanto','08/10/2025','08/10/2025',204,'2','Adelanto',-4905.38,'2.1.01.02.008-VEHÍCULOS POR PAGAR'),
  ],
  cxp_general: [
    mkR('P0040','PAPELERIA ESTEVA EL TRANSITO,C.A.','Factura','15/04/2026','22/04/2026',8,'0000033995','Doc : 0000033995',202.43,'2.1.01.01.001-CUENTAS POR PAGAR PROVEEDORES'),
    mkR('P0040','PAPELERIA ESTEVA EL TRANSITO,C.A.','Factura','22/04/2026','29/04/2026',1,'0000034111','Doc : 0000034111',79.57,'2.1.01.01.001-CUENTAS POR PAGAR PROVEEDORES'),
    mkR('P0040','PAPELERIA ESTEVA EL TRANSITO,C.A.','Factura','24/04/2026','01/05/2026',-1,'0000034154','Doc : 0000034154',60.54,'2.1.01.01.001-CUENTAS POR PAGAR PROVEEDORES'),
    mkR('P0074','OK PIZZA, COMPAÑIA ANONIMA','Factura','09/09/2025','09/09/2025',233,'003077','Factor:154,9825 Doc:003077',18.02,'2.1.01.01.001-CUENTAS POR PAGAR PROVEEDORES'),
    mkR('P0103','SERVICIOS Y MANT. ENRIQUE FLEIRES FP','Factura','13/04/2026','13/04/2026',17,'000927','Doc : 000927',29.78,'2.1.01.01.001-CUENTAS POR PAGAR PROVEEDORES'),
    mkR('P0103','SERVICIOS Y MANT. ENRIQUE FLEIRES FP','Factura','21/04/2026','21/04/2026',9,'000933','Doc : 000933',396.07,'2.1.01.01.001-CUENTAS POR PAGAR PROVEEDORES'),
    mkR('P0103','SERVICIOS Y MANT. ENRIQUE FLEIRES FP','Factura','23/04/2026','23/04/2026',7,'000934','Doc : 000934',29.77,'2.1.01.01.001-CUENTAS POR PAGAR PROVEEDORES'),
    mkR('P0117','E. P. & O. ASOCIADOS, C. A.','Factura','20/04/2026','20/04/2026',10,'00003138','Doc : 00003138',357.00,'2.1.01.01.001-CUENTAS POR PAGAR PROVEEDORES'),
    mkR('P0117','E. P. & O. ASOCIADOS, C. A.','Factura','20/04/2026','20/04/2026',10,'00003142','Doc : 00003142',900.00,'2.1.01.01.001-CUENTAS POR PAGAR PROVEEDORES'),
    mkR('P0117','E. P. & O. ASOCIADOS, C. A.','Factura','23/04/2026','23/04/2026',7,'00003146','Doc : 00003146',900.00,'2.1.01.01.001-CUENTAS POR PAGAR PROVEEDORES'),
    mkR('P0117','E. P. & O. ASOCIADOS, C. A.','Factura','23/04/2026','23/04/2026',7,'00003145','Doc : 00003145',900.00,'2.1.01.01.001-CUENTAS POR PAGAR PROVEEDORES'),
    mkR('P0117','E. P. & O. ASOCIADOS, C. A.','Factura','24/04/2026','24/04/2026',6,'00003147','Doc : 00003147',900.00,'2.1.01.01.001-CUENTAS POR PAGAR PROVEEDORES'),
    mkR('P0293','RUTA 70 CAR WASH AND SERVICE, C.A','Factura','28/04/2026','04/05/2026',-4,'PRSPTO 08','PRESUPUESTO 08',104.75,'2.1.01.01.001-CUENTAS POR PAGAR PROVEEDORES'),
    mkR('P0348','ANGEL EDUARDO GARCIA RINCON','Factura','20/03/2026','20/03/2026',41,'000056','Doc : 000056',176.00,'2.1.01.01.001-CUENTAS POR PAGAR PROVEEDORES'),
    mkR('P0369','CORPORACION VENEZOLANA DE SEGURIDAD I, C.A.','Factura','13/04/2026','19/04/2026',11,'PROFORMA 01','PROFORMA 01',918.72,'2.1.01.01.001-CUENTAS POR PAGAR PROVEEDORES'),
    mkR('P0418','PINTURAS Y DECORACIONES, C.A','Factura','21/04/2026','28/04/2026',2,'00026073','Doc : 00026073',43.93,'2.1.01.01.001-CUENTAS POR PAGAR PROVEEDORES'),
    mkR('P0466','DISTRIBUIDORA Y SERVICIOS INTEGRALES C A','Factura','17/04/2026','24/04/2026',6,'ODC 0079','ODC 0079',41.76,'2.1.01.01.001-CUENTAS POR PAGAR PROVEEDORES'),
    mkR('P0466','DISTRIBUIDORA Y SERVICIOS INTEGRALES C A','Factura','23/04/2026','30/04/2026',0,'ODC 0082','ODC 0082',50.34,'2.1.01.01.001-CUENTAS POR PAGAR PROVEEDORES'),
    mkR('P0466','DISTRIBUIDORA Y SERVICIOS INTEGRALES C A','Factura','30/04/2026','07/05/2026',-7,'ODC 84','ODC 84',39.44,'2.1.01.01.001-CUENTAS POR PAGAR PROVEEDORES'),
    mkR('P0467','FERRETERIA ELECTRICA INDUSTRIAL, C.A.','Factura','16/03/2026','23/03/2026',38,'ODC 0061','ODC 0061',4187.76,'2.1.01.01.001-CUENTAS POR PAGAR PROVEEDORES'),
    mkR('P0467','FERRETERIA ELECTRICA INDUSTRIAL, C.A.','Factura','24/03/2026','31/03/2026',30,'ODC 0066','ODC 0066',114.84,'2.1.01.01.001-CUENTAS POR PAGAR PROVEEDORES'),
    mkR('P0492','EMPAQUES PLASTICOS CABIMAS C.A (EMPLASCA)','Factura','30/01/2026','20/02/2026',69,'ODC 0040','ODC 0040',29444.20,'2.1.01.01.001-CUENTAS POR PAGAR PROVEEDORES'),
    mkR('P0492','EMPAQUES PLASTICOS CABIMAS C.A (EMPLASCA)','Adelanto','30/01/2026','30/01/2026',90,'3001','ABONO INSUMOS Y SUMINISTROS BYB C.A.',-7000.00,'2.1.01.01.001-CUENTAS POR PAGAR PROVEEDORES'),
    mkR('P0492','EMPAQUES PLASTICOS CABIMAS C.A (EMPLASCA)','Adelanto','04/02/2026','04/02/2026',85,'9566','ABONO INSUMOS Y SUMINITROS BYB, C.A 50% ODC 0040',-7222.10,'2.1.01.01.001-CUENTAS POR PAGAR PROVEEDORES'),
    mkR('P0492','EMPAQUES PLASTICOS CABIMAS C.A (EMPLASCA)','Adelanto','21/04/2026','21/04/2026',9,'2004.','ABONO EMPAQUES PLASTICOS CABIMAS, C.A ODC 0040',-108.40,'2.1.01.01.001-CUENTAS POR PAGAR PROVEEDORES'),
    mkR('P0515','SUMINISTROS QUIVEN, C.A.','Adelanto','28/04/2026','28/04/2026',2,'2804','PAGO BASE SUMINISTROS QUIVEN, C.A',-578.50,'2.1.01.01.001-CUENTAS POR PAGAR PROVEEDORES'),
    mkR('P0515','SUMINISTROS QUIVEN, C.A.','Adelanto','30/04/2026','30/04/2026',0,'33333','PAGO IVA SUMINISTROS QUIVEN, C.A',-23.14,'2.1.01.01.001-CUENTAS POR PAGAR PROVEEDORES'),
    mkR('P0531','LOSDEKLUZ 2.0., C.A','Factura','27/03/2026','27/03/2026',34,'000000644','Doc : 000000644',311.63,'2.1.01.01.001-CUENTAS POR PAGAR PROVEEDORES'),
    mkR('P0531','LOSDEKLUZ 2.0., C.A','Adelanto','27/03/2026','27/03/2026',34,'6184','ABONO 70% LOSDKLUZ 2.0, C.A FAC: 000000644',-222.59,'2.1.01.01.001-CUENTAS POR PAGAR PROVEEDORES'),
  ]
};

// ============================================================================
// 3. COMPONENTE: ÁRBOL EXPANDIBLE (SE RESPETA APERTURA MANUAL)
// ============================================================================
const ExpandableRow = ({ node, level = 0, totalBaseUSD, defaultOpen = false, highlightedAccounts, toggleHighlight, onShowReport, isBalance = false, rootColorOverride = null }) => {
  const isAccountNode = /^\d\./.test(node.n) || (!node.c || node.c.length === 0);
  const isLeaf = !node.c || node.c.length === 0;
  
  // Respetar estado guardado localmente si fue expandido
  const [isOpen, setIsOpen] = useState(defaultOpen);
  useEffect(() => { setIsOpen(defaultOpen); }, [defaultOpen]);

  const accountCodeMatch = node.n.match(/^(\d[\d\.]+)/);
  const accountCode = accountCodeMatch ? accountCodeMatch[1] : null;
  const hasMapping = (accountCode && ACCOUNT_MAPS[accountCode]) || (isBalance && (node.n.toUpperCase().includes('POR COBRAR') || node.n.toUpperCase().includes('POR PAGAR')));

  const fmtCur = (v) => new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);
  const pct = totalBaseUSD && node.u !== 0 ? `${((Math.abs(node.u) / Math.abs(totalBaseUSD)) * 100).toFixed(2)}%` : '';
  const indent = { paddingLeft: `${level * 18 + 10}px` };

  // Evitar romper el render si node es undefined
  if (!node) return null;

  if (!isLeaf && !isAccountNode) {
    const isRoot = level === 0;
    let rootColor = rootColorOverride || 'text-orange-500'; 
    let borderColor = rootColorOverride ? rootColorOverride.replace('text-', 'border-') : 'border-orange-500';
    
    if (isBalance && !rootColorOverride) {
      if (node.n.includes('ACTIVO')) { rootColor = 'text-blue-500'; borderColor = 'border-blue-500'; }
      else if (node.n.includes('PASIVO')) { rootColor = 'text-red-500'; borderColor = 'border-red-500'; }
      else if (node.n.includes('PATRIMONIO')) { rootColor = 'text-purple-500'; borderColor = 'border-purple-500'; }
    }

    return (
      <>
        <tr className={isRoot ? 'bg-slate-100/50 print:bg-white print:border-b-2 print:border-slate-300' : 'bg-white border-b border-gray-100 print:bg-white'}>
          <td style={indent} className={isRoot ? `py-3 px-3 ${rootColor} font-black text-xs uppercase tracking-[0.2em] print:text-black` : 'py-2 px-3 font-black text-[11px] text-slate-800 uppercase print:text-black'}>{node.n}</td>
          <td colSpan={3} />
        </tr>
        
        {/* Solo renderiza hijos si está expandido, así el PDF respeta la vista */}
        {isOpen && node.c && node.c.map((child, i) => (
          <ExpandableRow key={i} node={child} level={level + 1} totalBaseUSD={totalBaseUSD} defaultOpen={defaultOpen} highlightedAccounts={highlightedAccounts} toggleHighlight={toggleHighlight} onShowReport={onShowReport} isBalance={isBalance}/>
        ))}

        {isOpen && (
          <tr className={`${isRoot ? `bg-slate-800 print:bg-slate-100 text-white print:text-black border-t-2 ${borderColor} print:border-slate-400` : 'bg-slate-200 text-slate-800 border-t border-slate-300 print:bg-slate-50 print:text-black'} shadow-sm print:shadow-none`}>
            <td style={{ paddingLeft: level * 18 + 28 }} className="py-2.5 px-3 font-black text-[10px] uppercase tracking-wider print:text-black">TOTAL {node.n}</td>
            <td className={`py-2.5 px-3 text-right font-mono text-[11px] font-black ${isRoot ? rootColor : 'text-slate-900'} print:text-black`}>{fmtCur(Math.abs(node.u))}</td>
            <td className={`py-2.5 px-3 text-right font-mono text-[11px] font-black hidden sm:table-cell ${isRoot ? rootColor : 'text-slate-900'} print:text-black`}>{fmtCur(Math.abs(node.b))}</td>
            <td className={`py-2.5 px-3 text-right font-mono text-[11px] font-black ${isRoot ? rootColor : 'text-slate-900'} print:text-black`}>{pct}</td>
          </tr>
        )}
        
        {/* Fila compacta cuando está cerrado */}
        {!isOpen && isRoot && (
           <tr className={`bg-slate-800 print:bg-slate-100 text-white print:text-black border-t-2 ${borderColor} print:border-slate-400 shadow-sm print:shadow-none cursor-pointer`} onClick={() => setIsOpen(true)}>
             <td style={{ paddingLeft: level * 18 + 10 }} className="py-2.5 px-3 font-black text-xs uppercase tracking-widest print:text-black flex items-center gap-2">
               <span className="no-print inline-flex items-center justify-center w-4 h-4 border rounded-sm text-[11px] leading-none bg-white text-slate-800">+</span>
               {node.n}
             </td>
             <td className={`py-2.5 px-3 text-right font-mono text-[11px] font-black ${rootColor} print:text-black`}>{fmtCur(Math.abs(node.u))}</td>
             <td className={`py-2.5 px-3 text-right font-mono text-[11px] font-black hidden sm:table-cell ${rootColor} print:text-black`}>{fmtCur(Math.abs(node.b))}</td>
             <td className={`py-2.5 px-3 text-right font-mono text-[11px] font-black ${rootColor} print:text-black`}>{pct}</td>
           </tr>
        )}
      </>
    );
  }

  // Nodos Hojas / Cuentas Individuales
  if (isLeaf || isAccountNode) {
    const isHighlighted = highlightedAccounts?.has(node.n);
    return (
      <>
        <tr onClick={() => !isLeaf && setIsOpen(!isOpen)} className={`border-b border-gray-200 cursor-pointer transition-colors ${isHighlighted ? 'bg-amber-100/80 hover:bg-amber-200 border-l-4 border-amber-500 print:bg-transparent print:border-l-0' : 'bg-white hover:bg-slate-50 border-l-4 border-slate-400 print:bg-transparent print:border-l-0'}`}>
          <td style={indent} className="py-2.5 px-3 font-bold text-[11px] text-slate-900 uppercase select-none flex items-center flex-wrap gap-2 print:pl-6 print:text-black">
            {!isLeaf && <span className={`no-print inline-flex items-center justify-center w-4 h-4 border rounded-sm text-[11px] leading-none transition-colors ${isOpen ? 'border-slate-500 text-slate-600 bg-slate-100' : 'border-slate-300 text-slate-400 bg-white'}`}>{isOpen ? '−' : '+'}</span>}
            <button onClick={(e) => { e.stopPropagation(); toggleHighlight(node.n); }} className="no-print focus:outline-none transition-transform hover:scale-110"><Star size={16} fill={isHighlighted ? "#f59e0b" : "none"} color={isHighlighted ? "#f59e0b" : "#cbd5e1"} /></button>
            <span className="truncate">{node.n}</span>
            {hasMapping && isBalance && (
              <button onClick={(e) => { 
                e.stopPropagation(); 
                const typeToPass = accountCode ? accountCode : (node.n.toUpperCase().includes('COBRAR') ? 'cxc' : 'cxp');
                onShowReport(typeToPass); 
              }} className="no-print ml-2 px-2.5 py-1 bg-blue-600 text-white rounded-md text-[9px] font-black tracking-widest hover:bg-blue-700 shadow-md flex items-center gap-1">
                <Search size={10}/> VER REPORTE
              </button>
            )}
          </td>
          <td className={`py-2.5 px-3 text-right font-mono text-[11px] font-bold ${isHighlighted ? 'text-amber-900' : 'text-slate-800'} print:text-black`}>{fmtCur(Math.abs(node.u))}</td>
          <td className={`py-2.5 px-3 text-right font-mono text-[11px] font-bold hidden sm:table-cell ${isHighlighted ? 'text-amber-900' : 'text-slate-800'} print:text-black`}>{fmtCur(Math.abs(node.b))}</td>
          <td className={`py-2.5 px-3 text-right font-mono text-[11px] font-bold ${isHighlighted ? 'text-amber-700' : 'text-slate-500'} print:text-black`}>{pct}</td>
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
    <div className="animate-in fade-in duration-300 print-area bg-white p-4">
      <PrintStyles />
      <button onClick={onBack} className="no-print flex items-center gap-2 text-slate-500 hover:text-slate-800 font-black text-xs uppercase mb-4 transition-colors"><ArrowLeft size={16}/> Volver al Balance</button>
      <HeaderMembretado />
      <div className="flex items-center justify-between mb-6 bg-white p-6 rounded-2xl shadow-sm print:shadow-none border border-slate-100 print:border-none print:p-0">
        <div>
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
            {mapInfo.type.includes('cxc') ? <Users className="text-blue-500 no-print"/> : <Briefcase className="text-red-500 no-print"/>}
            Auxiliar Detallado
          </h2>
          <p className="text-xs font-bold text-slate-400 print:text-black uppercase mt-1">
            {accountCode.includes('.') ? `Cuenta: ${accountCode} - ${mapInfo.label}` : 'Reporte Consolidado'}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black uppercase text-slate-400 print:text-black tracking-widest">Saldo en Cuenta</p>
          <p className={`text-2xl font-mono font-black ${mapInfo.type.includes('cxc') ? 'text-blue-600 print:text-black' : 'text-red-600 print:text-black'}`}>USD {fmtCur(total)}</p>
        </div>
      </div>
      <div className="bg-white rounded-2xl shadow-xl print:shadow-none overflow-hidden border border-slate-200 print:border-none">
        <div className="overflow-x-auto">
        <table id="table-auxiliar" className="w-full text-left border-collapse" style={{minWidth:'900px'}}>
          <thead className="bg-slate-800 print:bg-slate-200 text-[9px] uppercase font-black text-slate-300 print:text-black">
            <tr>
              <th className="px-3 py-4">Código</th>
              <th className="px-3 py-4">Descripción</th>
              <th className="px-3 py-4">Operación</th>
              <th className="px-3 py-4">Emisión</th>
              <th className="px-3 py-4">Vencimiento</th>
              <th className="px-3 py-4 text-right">Días</th>
              <th className="px-3 py-4">No. Documento</th>
              <th className="px-3 py-4 text-right">Monto USD</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-8 text-slate-400 font-bold">Sin transacciones registradas en este auxiliar.</td></tr>
            ) : (
              filteredData.map((item, i) => (
                <tr key={i} className="border-b border-slate-100 hover:bg-slate-50 transition-colors print:border-slate-300">
                  <td className="px-3 py-2.5 text-[11px] font-bold text-slate-500 print:text-slate-800 whitespace-nowrap">{item.cod}</td>
                  <td className="px-3 py-2.5 text-[11px] font-black text-slate-800 print:text-black max-w-[160px] truncate">{item.nombre}</td>
                  <td className="px-3 py-2.5 text-[11px] text-slate-600 print:text-slate-900 whitespace-nowrap">{item.operacion || '-'}</td>
                  <td className="px-3 py-2.5 text-[11px] text-slate-500 print:text-slate-900 whitespace-nowrap font-mono">{item.emision}</td>
                  <td className="px-3 py-2.5 text-[11px] text-slate-500 print:text-slate-900 whitespace-nowrap font-mono">{item.vence}</td>
                  <td className={`px-3 py-2.5 text-right text-[11px] font-mono whitespace-nowrap ${Number(item.dias) < 0 ? 'text-red-500 font-bold print:text-black' : 'text-slate-500 print:text-black'}`}>{item.dias ?? '-'}</td>
                  <td className="px-3 py-2.5 text-[11px] text-slate-600 print:text-slate-900 font-mono whitespace-nowrap">{item.doc}</td>
                  <td className={`px-3 py-2.5 text-right text-[12px] font-mono font-bold whitespace-nowrap ${item.monto < 0 ? 'text-red-500 print:text-black' : 'text-slate-900 print:text-black'}`}>{fmtCur(item.monto)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>
      <div className="no-print mt-6 flex justify-end gap-3">
         <button onClick={() => window.print()} className="px-4 py-2 bg-slate-800 text-white rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-slate-700 shadow-md"><Printer size={14}/> Imprimir PDF</button>
         <button onClick={() => handleExportExcel('table-auxiliar', `Auxiliar_${accountCode}`, `Auxiliar de Cuentas - ${mapInfo.label}`)} className="px-4 py-2 bg-emerald-700 text-white rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-600 shadow-md"><Download size={14}/> Exportar Excel</button>
      </div>
    </div>
  );
}

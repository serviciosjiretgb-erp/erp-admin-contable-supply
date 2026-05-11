import React, { useState, useMemo, useEffect } from 'react';
import { 
  ArrowLeft, Upload, CheckCircle, Scale, 
  LineChart, CalendarDays, AlertTriangle, ChevronRight, ChevronDown, Star, PlusCircle, Trash2, ArrowUpRight, ArrowDownRight, GitCompare, Landmark, FileSpreadsheet,
  FileText, Users, Briefcase, Search, BookOpen, Database, FileOutput
} from 'lucide-react';

// ============================================================================
// 1. LÓGICA DE PROCESAMIENTO DE ARCHIVOS
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
        allParsedData.push({ month, path: pathStack.map(p => p.trim()).join('>'), name: name.trim(), usd: usd, bs: bs || 0 });
      } else {
        pathStack.push(name.trim());
      }
    }
  }
  return allParsedData;
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
// Detecta si una fila de encabezado es el nuevo formato de 10 columnas
const isNewAuxFormat = (row) => {
  if (!row || row.length < 8) return false;
  const cells = row.map(c => c ? String(c).toLowerCase().trim() : '');
  return cells.some(c => c.includes('operaci') || c.includes('descripci') || c.includes('cuenta contable'));
};

const processAuxFile = async (files) => {
  // fileType ya no es necesario: el ruteo se hace por la columna "Cuenta Contable"
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
    let sheetsData = []; // array de arrays de filas, una por hoja

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

      // Buscar fila de encabezado
      let headerIdx = -1;
      for (let i = 0; i < Math.min(10, dataRows.length); i++) {
        if (dataRows[i] && isNewAuxFormat(dataRows[i])) { headerIdx = i; break; }
      }

      // --- NUEVO FORMATO (10 columnas) ---
      if (headerIdx >= 0) {
        // Col: 0=Código 1=Descripción 2=Operación 3=Emisión 4=Vencimiento 5=Días 6=No.Documento 7=Desc.Operación 8=Monto 9=CuentaContable
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
          if (!bucket) continue; // Cuenta no reconocida en el plan

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

      // --- FORMATO LEGACY (6 columnas, fallback) ---
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
        // Ruteo por nombre (legado)
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

// Datos reales extraídos de los PDFs auxiliares al 30/04/2026
// Estructura nueva: cod, nombre, operacion, emision, vence, dias, doc, descripcion, monto, cuentaContable
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
// 3. COMPONENTE: ÁRBOL EXPANDIBLE (COMPARTIDO RESULTADOS Y BALANCE)
// ============================================================================
const ExpandableRow = ({ node, level = 0, totalBaseUSD, defaultOpen = false, highlightedAccounts, toggleHighlight, onShowReport, isBalance = false }) => {
  const isAccountNode = /^\d\./.test(node.n) || (!node.c || node.c.length === 0);
  const isLeaf = !node.c || node.c.length === 0;
  const [isOpen, setIsOpen] = useState(defaultOpen);

  useEffect(() => { setIsOpen(defaultOpen); }, [defaultOpen]);

  const accountCodeMatch = node.n.match(/^(\d[\d\.]+)/);
  const accountCode = accountCodeMatch ? accountCodeMatch[1] : null;
  const hasMapping = (accountCode && ACCOUNT_MAPS[accountCode]) || (isBalance && (node.n.toUpperCase().includes('POR COBRAR') || node.n.toUpperCase().includes('POR PAGAR')));

  const fmtCur = (v) => new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);
  const pct = totalBaseUSD && node.u !== 0 ? `${((Math.abs(node.u) / totalBaseUSD) * 100).toFixed(2)}%` : '';
  const indent = { paddingLeft: `${level * 18 + 10}px` };

  if (!isLeaf && !isAccountNode) {
    const isRoot = level === 0;
    let rootColor = 'text-orange-500'; let borderColor = 'border-orange-500';
    if (isBalance) {
      if (node.n.includes('ACTIVO')) { rootColor = 'text-blue-500'; borderColor = 'border-blue-500'; }
      else if (node.n.includes('PASIVO')) { rootColor = 'text-red-500'; borderColor = 'border-red-500'; }
      else if (node.n.includes('PATRIMONIO')) { rootColor = 'text-purple-500'; borderColor = 'border-purple-500'; }
    }

    return (
      <>
        <tr className={isRoot ? 'bg-[#111827]' : 'bg-white border-b border-gray-100'}>
          <td style={indent} className={isRoot ? `py-3 px-3 ${rootColor} font-black text-xs uppercase tracking-[0.2em]` : 'py-2 px-3 font-black text-[11px] text-slate-800 uppercase'}>{node.n}</td>
          <td colSpan={3} />
        </tr>
        {node.c.map((child, i) => (
          <ExpandableRow key={i} node={child} level={level + 1} totalBaseUSD={totalBaseUSD} defaultOpen={defaultOpen} highlightedAccounts={highlightedAccounts} toggleHighlight={toggleHighlight} onShowReport={onShowReport} isBalance={isBalance}/>
        ))}
        <tr className={`${isRoot ? `bg-slate-900 text-white border-t-2 ${borderColor}` : 'bg-slate-200 text-slate-800 border-t border-slate-300'} shadow-sm`}>
          <td style={{ paddingLeft: level * 18 + 28 }} className="py-2.5 px-3 font-black text-[10px] uppercase tracking-wider">TOTAL {node.n}</td>
          <td className={`py-2.5 px-3 text-right font-mono text-[11px] font-black ${isRoot ? rootColor : 'text-slate-900'}`}>{fmtCur(Math.abs(node.u))}</td>
          <td className={`py-2.5 px-3 text-right font-mono text-[11px] font-black hidden sm:table-cell ${isRoot ? rootColor : 'text-slate-900'}`}>{fmtCur(Math.abs(node.b))}</td>
          <td className={`py-2.5 px-3 text-right font-mono text-[11px] font-black ${isRoot ? rootColor : 'text-slate-900'}`}>{pct}</td>
        </tr>
      </>
    );
  }

  if (isLeaf || isAccountNode) {
    const isHighlighted = highlightedAccounts.has(node.n);
    return (
      <>
        <tr onClick={() => !isLeaf && setIsOpen(!isOpen)} className={`border-b border-gray-200 cursor-pointer transition-colors ${isHighlighted ? 'bg-amber-100/80 hover:bg-amber-200 border-l-4 border-amber-500' : 'bg-white hover:bg-slate-50 border-l-4 border-slate-400'}`}>
          <td style={indent} className="py-2.5 px-3 font-bold text-[11px] text-slate-900 uppercase select-none flex items-center flex-wrap gap-2">
            {!isLeaf && <span className={`inline-flex items-center justify-center w-4 h-4 border rounded-sm text-[11px] leading-none transition-colors ${isOpen ? 'border-slate-500 text-slate-600 bg-slate-100' : 'border-slate-300 text-slate-400 bg-white'}`}>{isOpen ? '−' : '+'}</span>}
            <button onClick={(e) => { e.stopPropagation(); toggleHighlight(node.n); }} className="focus:outline-none transition-transform hover:scale-110"><Star size={16} fill={isHighlighted ? "#f59e0b" : "none"} color={isHighlighted ? "#f59e0b" : "#cbd5e1"} /></button>
            <span className="truncate">{node.n}</span>
            {hasMapping && isBalance && (
              <button onClick={(e) => { 
                e.stopPropagation(); 
                const typeToPass = accountCode ? accountCode : (node.n.toUpperCase().includes('COBRAR') ? 'cxc' : 'cxp');
                onShowReport(typeToPass); 
              }} className="ml-2 px-2.5 py-1 bg-blue-600 text-white rounded-md text-[9px] font-black tracking-widest hover:bg-blue-700 shadow-md flex items-center gap-1">
                <Search size={10}/> VER REPORTE
              </button>
            )}
          </td>
          <td className={`py-2.5 px-3 text-right font-mono text-[11px] font-bold ${isHighlighted ? 'text-amber-900' : 'text-slate-800'}`}>{fmtCur(Math.abs(node.u))}</td>
          <td className={`py-2.5 px-3 text-right font-mono text-[11px] font-bold hidden sm:table-cell ${isHighlighted ? 'text-amber-900' : 'text-slate-800'}`}>{fmtCur(Math.abs(node.b))}</td>
          <td className={`py-2.5 px-3 text-right font-mono text-[11px] font-bold ${isHighlighted ? 'text-amber-700' : 'text-slate-500'}`}>{pct}</td>
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
    <div className="animate-in fade-in duration-300">
      <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-black text-xs uppercase mb-4 transition-colors"><ArrowLeft size={16}/> Volver al Balance</button>
      <div className="flex items-center justify-between mb-6 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
            {mapInfo.type.includes('cxc') ? <Users className="text-blue-500"/> : <Briefcase className="text-red-500"/>}
            Auxiliar Detallado
          </h2>
          <p className="text-xs font-bold text-slate-400 uppercase mt-1">
            {accountCode.includes('.') ? `Cuenta: ${accountCode} - ${mapInfo.label}` : 'Reporte Consolidado'}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Saldo en Cuenta</p>
          <p className={`text-2xl font-mono font-black ${mapInfo.type.includes('cxc') ? 'text-blue-600' : 'text-red-600'}`}>USD {fmtCur(total)}</p>
        </div>
      </div>
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
        <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse" style={{minWidth:'900px'}}>
          <thead className="bg-slate-800 text-[9px] uppercase font-black text-slate-300">
            <tr>
              <th className="px-3 py-4">Código</th>
              <th className="px-3 py-4">Descripción</th>
              <th className="px-3 py-4">Operación</th>
              <th className="px-3 py-4">Emisión</th>
              <th className="px-3 py-4">Vencimiento</th>
              <th className="px-3 py-4 text-right">Días</th>
              <th className="px-3 py-4">No. Documento</th>
              <th className="px-3 py-4">Descripción de Operación</th>
              <th className="px-3 py-4 text-right">Monto USD</th>
              <th className="px-3 py-4">Cuenta Contable</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 ? (
              <tr><td colSpan={10} className="text-center py-8 text-slate-400 font-bold">Sin transacciones registradas en este auxiliar.</td></tr>
            ) : (
              filteredData.map((item, i) => (
                <tr key={i} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="px-3 py-2.5 text-[11px] font-bold text-slate-500 whitespace-nowrap">{item.cod}</td>
                  <td className="px-3 py-2.5 text-[11px] font-black text-slate-800 max-w-[140px] truncate">{item.nombre}</td>
                  <td className="px-3 py-2.5 text-[11px] text-slate-600 whitespace-nowrap">{item.operacion || '-'}</td>
                  <td className="px-3 py-2.5 text-[11px] text-slate-500 whitespace-nowrap font-mono">{item.emision}</td>
                  <td className="px-3 py-2.5 text-[11px] text-slate-500 whitespace-nowrap font-mono">{item.vence}</td>
                  <td className={`px-3 py-2.5 text-right text-[11px] font-mono whitespace-nowrap ${Number(item.dias) < 0 ? 'text-red-500 font-bold' : 'text-slate-500'}`}>{item.dias ?? '-'}</td>
                  <td className="px-3 py-2.5 text-[11px] text-slate-600 font-mono whitespace-nowrap">{item.doc}</td>
                  <td className="px-3 py-2.5 text-[11px] text-slate-500 max-w-[180px] truncate" title={item.descripcion}>{item.descripcion || '-'}</td>
                  <td className={`px-3 py-2.5 text-right text-[12px] font-mono font-bold whitespace-nowrap ${item.monto < 0 ? 'text-red-500' : 'text-slate-900'}`}>{fmtCur(item.monto)}</td>
                  <td className="px-3 py-2.5 text-[10px] text-slate-400 font-mono max-w-[140px] truncate" title={item.cuentaContable}>{item.cuentaContable || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 5. VISTA: ESTADO DE RESULTADOS (CERRADA Y ESTABLE)
// ============================================================================
function EstadoResultadoView({ onBack, dbData }) {
  const availableMonths = useMemo(() => [...new Set(dbData.map(d => d.month))].filter(m=>m!=='Sin Mes'), [dbData]);
  const [selectedMonth, setSelectedMonth] = useState('General'); 
  const [defaultOpen, setDefaultOpen] = useState(false);
  const [expandKey, setExpandKey] = useState(0);

  const [highlightedAccounts, setHighlightedAccounts] = useState(() => {
    try { const saved = localStorage.getItem('jiret_highlighted_accounts'); return saved ? new Set(JSON.parse(saved)) : new Set(); } 
    catch (e) { return new Set(); }
  });
  useEffect(() => { localStorage.setItem('jiret_highlighted_accounts', JSON.stringify([...highlightedAccounts])); }, [highlightedAccounts]);

  const toggleHighlight = (accountName) => {
    setHighlightedAccounts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(accountName)) newSet.delete(accountName); else newSet.add(accountName);
      return newSet;
    });
  };

  const tree = useMemo(() => {
    const normKey = s => s.trim().replace(/\s+/g,' ').toUpperCase();
    const root = [];
    const monthData = selectedMonth === 'General' ? dbData : dbData.filter(d => d.month === selectedMonth);
    let resData = monthData.filter(item =>
      !item.path.toUpperCase().includes('ACTIVO') &&
      !item.path.toUpperCase().includes('PASIVO') &&
      !item.path.toUpperCase().includes('PATRIMONIO') &&
      !/^[123]/.test(item.name)
    );

    // ── DEDUPLICACIÓN POR CÓDIGO DE CUENTA (crítico en modo General) ──────────
    // Distintos meses pueden tener paths con distinta profundidad para la misma
    // cuenta. Agrupamos por código numérico para sumar, y conservamos el path
    // más corto (más limpio) de la primera aparición.
    const byCode = {};
    resData.forEach(item => {
      const codeMatch = item.name.match(/^(\d[\d\.]+)/);
      const key = codeMatch ? codeMatch[1] : normKey(item.name);
      if (!byCode[key]) {
        byCode[key] = { ...item };
      } else {
        byCode[key].usd += item.usd;
        byCode[key].bs  += item.bs;
        // Conservar el path más corto (menos anidación)
        if (item.path.split('>').length < byCode[key].path.split('>').length) {
          byCode[key].path = item.path;
        }
      }
    });
    resData = Object.values(byCode);

    // ── CONSTRUIR ÁRBOL ────────────────────────────────────────────────────────
    resData.forEach(item => {
      const pathArray = item.path.split('>');
      let cur = root;
      pathArray.forEach(folderName => {
        const key = normKey(folderName);
        let folder = cur.find(n => normKey(n.n) === key);
        if (!folder) { folder = { n: folderName.trim(), c: [], u: 0, b: 0 }; cur.push(folder); }
        cur = folder.c;
      });
      const leafKey = normKey(item.name);
      let leaf = cur.find(n => normKey(n.n) === leafKey && n.isLeaf);
      if (!leaf) cur.push({ n: item.name.trim(), u: item.usd, b: item.bs, isLeaf: true });
      else { leaf.u += item.usd; leaf.b += item.bs; }
    });

    const compute = (nodes) => {
      let u = 0, b = 0;
      nodes.forEach(n => { if (!n.isLeaf) { const t = compute(n.c); n.u = t.u; n.b = t.b; } u += n.u; b += n.b; });
      return { u, b };
    };
    compute(root);

    // Aplicar signo (ingresos se muestran positivos)
    root.forEach(rootNode => {
      const isIngreso = rootNode.n.toUpperCase().includes('INGRESO') || rootNode.n.toUpperCase().includes('VENTA') || rootNode.n.startsWith('4');
      const multiplier = isIngreso ? -1 : 1;
      const applySign = (nodes) => nodes.forEach(n => { n.u *= multiplier; n.b *= multiplier; if (!n.isLeaf) applySign(n.c); });
      applySign([rootNode]);
    });

    // ── ORDENAR: Ingresos → Costo de Venta → Costos Operativos → Otros ───────
    const sectionOrder = (name) => {
      const n = name.toUpperCase();
      if (n.includes('INGRESO') || n.startsWith('4')) return 1;
      if (n.includes('COSTO DE VENTA') || n.includes('COSTO VENTA') || n.includes('5.1')) return 2;
      if (n.includes('OPERATIV') || n.includes('5.2')) return 3;
      if (/^5/.test(n) || n.includes('GASTO') || n.includes('EGRESO') || n.includes('COSTO')) return 4;
      return 5;
    };
    root.sort((a, b) => sectionOrder(a.n) - sectionOrder(b.n));

    return root;
  }, [dbData, selectedMonth]);

  let totalUSD = 0; let baseVentas = 0;
  tree.forEach(n => { 
    if(n.n.toUpperCase().includes('INGRESO') || n.n.toUpperCase().includes('VENTA') || n.n.startsWith('4')) { 
      totalUSD += n.u; baseVentas += n.u; 
    } else { totalUSD -= n.u; } 
  });
  
  if (baseVentas === 0) baseVentas = 1;
  const fmtR = (v) => new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);

  return (
    <div className="min-h-screen bg-[#f1f5f9]">
      <header className="bg-white border-b-2 border-orange-500 p-4 flex justify-between items-center sticky top-0 z-30 shadow-md flex-wrap gap-4">
        <div className="flex items-center gap-4 flex-wrap">
          <button onClick={onBack} className="flex items-center gap-2 font-black text-xs text-slate-600 uppercase hover:text-orange-600 transition-colors"><ArrowLeft size={16}/> Volver al Panel</button>
          <div className="flex items-center gap-2 border-l-2 border-slate-200 pl-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Período:</span>
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="bg-orange-50 border-2 border-orange-300 text-orange-800 text-xs rounded-lg p-1.5 font-black uppercase cursor-pointer outline-none focus:ring-2 focus:ring-orange-400 min-w-[120px]"
            >
              <option value="General">General (Acumulado)</option>
              {availableMonths.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>
        <div className="flex gap-2 bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button onClick={() => { setDefaultOpen(true); setExpandKey(k=>k+1); }} className="px-3 py-1.5 rounded text-[10px] font-black uppercase flex items-center gap-1 hover:bg-white"><ChevronDown size={14}/> Expandir</button>
          <button onClick={() => { setDefaultOpen(false); setExpandKey(k=>k+1); }} className="px-3 py-1.5 rounded text-[10px] font-black uppercase flex items-center gap-1 hover:bg-white"><ChevronRight size={14}/> Contraer</button>
        </div>
      </header>
      <main className="p-4 md:p-8 max-w-6xl mx-auto pb-16">
        <div className="bg-white px-8 py-10 border-t-8 border-orange-500 shadow-xl flex flex-col items-center text-center mb-6 rounded-b-2xl">
          <h1 className="text-3xl font-black text-slate-900 uppercase mb-2">Servicios Jiret G&B, C.A.</h1>
          <div className="w-20 h-1.5 bg-orange-500 mb-4 rounded-full"/>
          <h2 className="text-xl font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-2 mb-4 w-full max-w-md">Estado de Resultado {selectedMonth === 'General' ? 'Acumulado' : 'Mensual'}</h2>
          <p className="text-orange-600 font-black uppercase flex items-center gap-2 bg-orange-50 px-5 py-2 rounded-full text-[10px] border border-orange-100 shadow-sm"><CalendarDays size={14}/> {selectedMonth}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-800 text-[10px] uppercase font-black text-slate-300">
              <tr><th className="px-4 py-5 w-[55%]">Cuentas</th><th className="px-3 py-5 text-right">Saldo USD</th><th className="px-3 py-5 text-right hidden sm:table-cell">Saldo Bs.</th><th className="px-3 py-5 text-right">%</th></tr>
            </thead>
            <tbody key={expandKey}>
              {tree.map((node, i) => <ExpandableRow key={i} node={node} totalBaseUSD={baseVentas} defaultOpen={defaultOpen} highlightedAccounts={highlightedAccounts} toggleHighlight={toggleHighlight} isBalance={false}/>)}
              <tr className="bg-slate-900 text-white font-black border-t-4 border-orange-600">
                <td className="px-5 py-7 text-sm uppercase tracking-[0.2em]" style={{paddingLeft:28}}>RESULTADO DEL EJERCICIO</td>
                <td className={`px-3 py-7 text-right text-lg font-mono ${totalUSD < 0 ? 'text-red-400' : 'text-emerald-400'}`}>{fmtR(totalUSD)}</td>
                <td className={`px-3 py-7 text-right text-lg font-mono hidden sm:table-cell ${totalUSD < 0 ? 'text-red-400' : 'text-emerald-400'}`}>{fmtR(totalUSD * 45)}</td>
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
// 6. VISTA: ANÁLISIS COMPARATIVO (CERRADA Y ESTABLE, PLANA)
// ============================================================================
function AnalisisComparativoView({ onBack, dbData }) {
  const availableMonths = useMemo(() => [...new Set(dbData.map(d => d.month))].filter(m => m !== 'Sin Mes'), [dbData]);
  const [month1, setMonth1] = useState(availableMonths[0] || '');
  const [month2, setMonth2] = useState(availableMonths[1] || availableMonths[0] || '');

  const tree = useMemo(() => {
    const root = [];
    const m1Data = dbData.filter(d => d.month === month1 && !d.path.toUpperCase().includes('ACTIVO') && !d.path.toUpperCase().includes('PASIVO') && !d.path.toUpperCase().includes('PATRIMONIO'));
    const m2Data = dbData.filter(d => d.month === month2 && !d.path.toUpperCase().includes('ACTIVO') && !d.path.toUpperCase().includes('PASIVO') && !d.path.toUpperCase().includes('PATRIMONIO'));

    const processItem = (item, isM1) => {
      const pathParts = item.path.split('>');
      const mainCategory = pathParts[0] ? pathParts[0].trim().toUpperCase() : 'OTROS';
      let accountOriginalName = pathParts.length > 1 ? pathParts[pathParts.length - 1].trim() : item.name.trim();
      if (!/^(\d[\d\.]+)/.test(accountOriginalName) && /^(\d[\d\.]+)/.test(item.name.trim())) accountOriginalName = item.name.trim();
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
      const isIngreso = cat.n.includes('INGRESO') || cat.n.includes('VENTA') || cat.key.startsWith('4');
      const multiplier = isIngreso ? -1 : 1;

      cat.c.forEach(acc => {
        acc.m1_u *= multiplier; acc.m2_u *= multiplier;
        cat_m1 += acc.m1_u; cat_m2 += acc.m2_u;
      });
      cat.m1_u = cat_m1; cat.m2_u = cat_m2;
    });

    return root;
  }, [dbData, month1, month2]);

  let total_m1 = 0, total_m2 = 0;
  tree.forEach(cat => {
    const isIngreso = cat.n.includes('INGRESO') || cat.n.includes('VENTA') || (cat.key && cat.key.startsWith('4'));
    if (isIngreso) { total_m1 += cat.m1_u; total_m2 += cat.m2_u; } 
    else { total_m1 -= cat.m1_u; total_m2 -= cat.m2_u; }
  });

  // base(m1) - comparar(m2): positivo = el mes base tuvo mejor resultado
  const varAbsTotal = total_m1 - total_m2;
  const varPctTotal = total_m2 !== 0 ? (varAbsTotal / Math.abs(total_m2)) * 100 : (total_m1 !== 0 ? 100 : 0);
  const isPosTotal = varAbsTotal > 0;
  const isNegTotal = varAbsTotal < 0;
  const TotalArrowIcon = isPosTotal ? ArrowUpRight : (isNegTotal ? ArrowDownRight : null);
  const fmtR = (v) => new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);

  return (
    <div className="min-h-screen bg-[#f1f5f9]">
      <header className="bg-white border-b-2 border-indigo-500 p-4 flex justify-between items-center sticky top-0 z-30 shadow-md">
        <button onClick={onBack} className="flex items-center gap-2 font-black text-xs text-slate-600 uppercase hover:text-indigo-600"><ArrowLeft size={16}/> Volver al Panel</button>
        <div className="flex items-center gap-2 border-l-2 border-slate-200 pl-4">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mr-1">Mes Base:</span>
          <select value={month1} onChange={(e) => setMonth1(e.target.value)} className="bg-slate-50 border border-slate-300 text-slate-700 text-xs rounded-lg block p-1.5 font-bold uppercase cursor-pointer outline-none">
            {availableMonths.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mx-2">VS</span>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mr-1">Mes Comparar:</span>
          <select value={month2} onChange={(e) => setMonth2(e.target.value)} className="bg-indigo-50 border border-indigo-300 text-indigo-700 text-xs rounded-lg block p-1.5 font-bold uppercase cursor-pointer outline-none">
            {availableMonths.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </header>
      <main className="p-4 md:p-8 max-w-6xl mx-auto pb-16">
        <div className="bg-white px-8 py-10 border-t-8 border-indigo-500 shadow-xl flex flex-col items-center text-center mb-6 rounded-b-2xl">
          <h1 className="text-3xl font-black text-slate-900 uppercase mb-2">Servicios Jiret G&B, C.A.</h1>
          <h2 className="text-xl font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-2 mb-4 w-full max-w-md">Análisis Comparativo (Resultados)</h2>
          <p className="font-black uppercase flex items-center gap-2 px-5 py-2 rounded-full text-[10px] bg-slate-800 text-white shadow-sm"><GitCompare size={14}/> {month1} vs {month2}</p>
        </div>
        
        {availableMonths.length < 2 ? (
          <div className="bg-white p-12 text-center rounded-xl border border-slate-200 shadow-sm"><AlertTriangle className="mx-auto text-indigo-400 mb-4" size={48}/><p className="text-slate-500 font-black text-xs uppercase tracking-wider">Necesitas al menos 2 meses cargados.</p></div>
        ) : (
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-800 text-[10px] uppercase font-black text-slate-300 border-b-2 border-orange-500">
                <tr>
                  <th className="px-4 py-5 w-[40%]">Estructura</th>
                  <th className="px-3 py-5 text-right bg-slate-900/50">📅 {month1} <span className="text-slate-500 font-normal">(Base)</span></th>
                  <th className="px-3 py-5 text-right bg-slate-900">📅 {month2} <span className="text-slate-500 font-normal">(Comparar)</span></th>
                  <th className="px-3 py-5 text-right text-orange-400">Var. Absoluta</th>
                  <th className="px-3 py-5 text-right">Var. %</th>
                </tr>
              </thead>
              <tbody>
                {tree.map((cat, i) => {
                  const sortedAccounts = [...cat.c].sort((a, b) => String(a.n).localeCompare(String(b.n)));
                  // varAbs = BASE(m1) - COMPARAR(m2): positivo = el mes base mejoró
                  const catVarAbs = cat.m1_u - cat.m2_u;
                  const catVarPct = cat.m2_u !== 0 ? (catVarAbs / Math.abs(cat.m2_u)) * 100 : (cat.m1_u !== 0 ? 100 : 0);
                  // Para ingresos: subir = verde ↑ / bajar = rojo ↓
                  // Para costos: subir = rojo ↓ (malo) / bajar = verde ↑ (bueno)
                  const isCatIngreso = cat.n.includes('INGRESO') || cat.n.includes('VENTA') || (cat.key && cat.key.startsWith('4'));
                  const catGood = isCatIngreso ? catVarAbs > 0 : catVarAbs < 0;
                  const catBad  = isCatIngreso ? catVarAbs < 0 : catVarAbs > 0;
                  const CatColorClass = catGood ? 'text-emerald-600' : (catBad ? 'text-red-500' : 'text-slate-400');
                  const CatArrowIcon  = catGood ? ArrowUpRight : (catBad ? ArrowDownRight : null);

                  return (
                    <React.Fragment key={i}>
                      <tr className="bg-[#111827]"><td className="py-3 px-4 text-orange-400 font-black text-xs uppercase tracking-[0.2em]">{cat.n}</td><td colSpan={4} /></tr>
                      {sortedAccounts.map((acc, j) => {
                        const varAbs = acc.m1_u - acc.m2_u; // base - comparar
                        const varPct = acc.m2_u !== 0 ? (varAbs / Math.abs(acc.m2_u)) * 100 : (acc.m1_u !== 0 ? 100 : 0);
                        const isIngreso = isCatIngreso;
                        const good = isIngreso ? varAbs > 0 : varAbs < 0;
                        const bad  = isIngreso ? varAbs < 0 : varAbs > 0;
                        const colorClass = good ? 'text-emerald-600' : (bad ? 'text-red-500' : 'text-slate-400');
                        const ArrowIcon  = good ? ArrowUpRight : (bad ? ArrowDownRight : null);

                        return (
                          <tr key={j} className="bg-white border-b border-gray-100 hover:bg-orange-50/30 transition-colors">
                            <td className="py-2.5 px-4 font-bold text-[11px] text-slate-800 uppercase pl-6 border-l-4 border-orange-400 truncate max-w-xs">{acc.n}</td>
                            <td className="py-2.5 px-3 text-right font-mono text-[11px] text-slate-600">{fmtR(acc.m1_u)}</td>
                            <td className="py-2.5 px-3 text-right font-mono text-[11px] text-slate-800 font-bold">{fmtR(acc.m2_u)}</td>
                            <td className={`py-2.5 px-3 text-right font-mono text-[11px] font-bold ${good ? 'text-emerald-600' : (bad ? 'text-red-500' : 'text-slate-400')}`}>
                              {varAbs >= 0 ? '+' : ''}{fmtR(varAbs)}
                            </td>
                            <td className={`py-2.5 px-3 text-right font-mono text-[11px] font-bold flex justify-end items-center gap-1 ${colorClass}`}>
                              {ArrowIcon && <ArrowIcon size={12}/>} {Math.abs(varPct).toFixed(2)}%
                            </td>
                          </tr>
                        );
                      })}
                      <tr className="bg-slate-200 text-slate-800 border-t border-slate-300">
                        <td className="py-3 px-4 font-black text-[11px] uppercase tracking-wider pl-6">TOTAL {cat.n}</td>
                        <td className="py-3 px-3 text-right font-mono text-[12px] font-black">{fmtR(cat.m1_u)}</td>
                        <td className="py-3 px-3 text-right font-mono text-[12px] font-black">{fmtR(cat.m2_u)}</td>
                        <td className={`py-3 px-3 text-right font-mono text-[12px] font-black ${catGood ? 'text-emerald-600' : (catBad ? 'text-red-500' : 'text-slate-500')}`}>
                          {catVarAbs >= 0 ? '+' : ''}{fmtR(catVarAbs)}
                        </td>
                        <td className={`py-3 px-3 text-right font-mono text-[12px] font-black flex justify-end items-center gap-1 ${CatColorClass}`}>
                          {CatArrowIcon && <CatArrowIcon size={14}/>} {Math.abs(catVarPct).toFixed(2)}%
                        </td>
                      </tr>
                    </React.Fragment>
                  );
                })}
                <tr className="bg-slate-900 text-white font-black border-t-4 border-orange-500">
                  <td className="px-5 py-7 text-sm uppercase tracking-[0.2em]" style={{paddingLeft:28}}>RESULTADO DEL EJERCICIO</td>
                  <td className="px-3 py-7 text-right text-base font-mono border-l border-slate-800">{fmtR(total_m1)}</td>
                  <td className="px-3 py-7 text-right text-base font-mono border-l border-slate-800">{fmtR(total_m2)}</td>
                  <td className={`px-3 py-7 text-right text-lg font-mono border-l border-slate-800 ${isPosTotal ? 'text-emerald-400' : (isNegTotal ? 'text-red-400' : 'text-slate-400')}`}>
                    {varAbsTotal >= 0 ? '+' : ''}{fmtR(varAbsTotal)}
                  </td>
                  <td className={`px-3 py-7 text-right text-lg font-mono flex justify-end items-center gap-1 ${isPosTotal ? 'text-emerald-400' : (isNegTotal ? 'text-red-400' : 'text-slate-400')}`}>
                    {TotalArrowIcon && <TotalArrowIcon size={16}/>} {Math.abs(varPctTotal).toFixed(2)}%
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
// 7. VISTA: BALANCE GENERAL (UN SOLO MES)
// ============================================================================
function BalanceGeneralView({ onBack, dbData, auxDataConfig }) {
  const availableMonths = useMemo(() => {
    const balanceRecords = dbData.filter(item => item.path.toUpperCase().includes('ACTIVO') || item.path.toUpperCase().includes('PASIVO') || item.path.toUpperCase().includes('PATRIMONIO') || /^[123]/.test(item.name));
    return [...new Set(balanceRecords.map(d => d.month))];
  }, [dbData]);
  
  const [selectedMonth, setSelectedMonth] = useState(availableMonths[availableMonths.length - 1] || ''); 
  const [defaultOpen, setDefaultOpen] = useState(false);
  const [expandKey, setExpandKey] = useState(0);
  const [activeCode, setActiveCode] = useState(null);
  const [tasa, setTasa] = useState(90); // Tasa Bs/USD configurable

  const [highlightedAccounts, setHighlightedAccounts] = useState(() => {
    try { const saved = localStorage.getItem('jiret_highlighted_accounts'); return saved ? new Set(JSON.parse(saved)) : new Set(); } catch(e){return new Set();}
  });
  useEffect(() => { localStorage.setItem('jiret_highlighted_accounts', JSON.stringify([...highlightedAccounts])); }, [highlightedAccounts]);

  const tree = useMemo(() => {
    const root = [];
    const monthData = dbData.filter(d => d.month === selectedMonth);
    const balanceData = monthData.filter(item => item.path.toUpperCase().includes('ACTIVO') || item.path.toUpperCase().includes('PASIVO') || item.path.toUpperCase().includes('PATRIMONIO') || /^[123]/.test(item.name));
    const normKey = s => s.trim().replace(/\s+/g,' ').toUpperCase();

    balanceData.forEach(item => {
      const pathArray = item.path.split('>');
      let cur = root;
      pathArray.forEach(folderName => {
        const key = normKey(folderName);
        let folder = cur.find(n => normKey(n.n) === key);
        if (!folder) { folder = { n: folderName.trim(), c: [], u: 0, b: 0 }; cur.push(folder); }
        cur = folder.c;
      });
      // Conversión multimoneda: si sólo hay bs, derivar usd; si sólo usd, derivar bs
      const usdVal = item.usd || (item.bs ? item.bs / tasa : 0);
      const bsVal  = item.bs  || (item.usd ? item.usd * tasa : 0);
      const leafKey = normKey(item.name);
      let leaf = cur.find(n => normKey(n.n) === leafKey && n.isLeaf);
      if (!leaf) cur.push({ n: item.name.trim(), u: usdVal, b: bsVal, isLeaf: true });
      else { leaf.u += usdVal; leaf.b += bsVal; }
    });
    const compute = (nodes) => {
      let u = 0, b = 0;
      nodes.forEach(n => { if (!n.isLeaf) { const t = compute(n.c); n.u = t.u; n.b = t.b; } u += n.u; b += n.b; });
      return { u, b };
    };
    compute(root);

    // ── Ordenar por ecuación patrimonial: Activos → Pasivos → Patrimonio ──────
    const sectionOrder = (name) => {
      const n = name.toUpperCase();
      if (n.includes('ACTIVO') || n.startsWith('1')) return 1;
      if (n.includes('PASIVO') || n.startsWith('2')) return 2;
      if (n.includes('PATRIMONIO') || n.startsWith('3')) return 3;
      return 9;
    };
    root.sort((a, b) => sectionOrder(a.n) - sectionOrder(b.n));

    // Dentro de Activos: disponible/caja/banco primero, luego CxC, luego resto
    const assetSubOrder = (name) => {
      const n = name.toUpperCase();
      if (n.includes('DISPONIBLE') || n.includes('CAJA') || n.includes('BANCO')) return 1;
      if (n.includes('POR COBRAR') || n.includes('COBRAR'))                       return 2;
      if (n.includes('INVENTARIO') || n.includes('MERCANCIA'))                    return 3;
      if (n.includes('ANTICIPO') || n.includes('PREPAGO'))                        return 4;
      if (n.includes('FIJO') || n.includes('INMUEBLE') || n.includes('VEHICLE')) return 6;
      return 5;
    };
    const sortNodes = (nodes, depth) => {
      if (depth === 0) return; // root already sorted above
      nodes.sort((a, b) => {
        const ao = assetSubOrder(a.n), bo = assetSubOrder(b.n);
        if (ao !== bo) return ao - bo;
        return a.n.localeCompare(b.n);
      });
      nodes.forEach(n => { if (!n.isLeaf && n.c) sortNodes(n.c, depth - 1); });
    };
    root.forEach(r => { if (r.c) sortNodes(r.c, 3); });

    return root;
  }, [dbData, selectedMonth, tasa]);

  let totalActivos = 0; let totalPasPat = 0;
  tree.forEach(n => { if(n.n.toUpperCase().includes('ACTIVO') || n.n.startsWith('1')) totalActivos += n.u; else totalPasPat += n.u; });

  const fmtR = (v) => new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Math.abs(v));

  if (activeCode) return <AuxiliarReportView accountCode={activeCode} onBack={() => setActiveCode(null)} auxDataConfig={auxDataConfig} />;

  return (
    <div className="min-h-screen bg-[#f1f5f9]">
      <header className="bg-white border-b-2 border-blue-500 p-4 flex justify-between items-center sticky top-0 z-30 shadow-md flex-wrap gap-2">
        <div className="flex items-center gap-4 flex-wrap">
          <button onClick={onBack} className="flex items-center gap-2 font-black text-xs text-slate-600 uppercase hover:text-blue-600 transition-colors"><ArrowLeft size={16}/> Salir al Panel</button>
          {availableMonths.length > 0 && (
            <div className="border-l-2 border-slate-200 pl-4 flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Corte:</span>
              <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="bg-blue-50 border border-blue-300 text-blue-700 text-xs rounded-lg block p-1.5 font-bold uppercase cursor-pointer outline-none">
                {availableMonths.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          )}
          <div className="border-l-2 border-slate-200 pl-4 flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tasa Bs/USD:</span>
            <input
              type="number" min="1" step="0.01" value={tasa}
              onChange={e => setTasa(parseFloat(e.target.value) || 1)}
              className="bg-amber-50 border border-amber-300 text-amber-800 text-xs rounded-lg p-1.5 w-24 font-black outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
        </div>
        <div className="flex gap-2 bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button onClick={() => { setDefaultOpen(true); setExpandKey(k=>k+1); }} className="px-3 py-1.5 rounded text-[10px] font-black uppercase flex items-center gap-1 hover:bg-white"><ChevronDown size={14}/> Expandir</button>
          <button onClick={() => { setDefaultOpen(false); setExpandKey(k=>k+1); }} className="px-3 py-1.5 rounded text-[10px] font-black uppercase flex items-center gap-1 hover:bg-white"><ChevronRight size={14}/> Contraer</button>
        </div>
      </header>
      <main className="p-4 md:p-8 max-w-6xl mx-auto pb-16">
        <div className="bg-white px-8 py-10 border-t-8 border-blue-500 shadow-xl flex flex-col items-center text-center mb-6 rounded-b-2xl">
          <h1 className="text-3xl font-black text-slate-900 uppercase mb-2 tracking-tighter">Servicios Jiret G&B, C.A.</h1>
          <h2 className="text-xl font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-2 mb-4 w-full max-w-md">Balance de Situación Financiera</h2>
          <p className="text-blue-600 font-black uppercase flex items-center gap-2 bg-blue-50 px-5 py-2 rounded-full text-[10px] border border-blue-100 shadow-sm"><Landmark size={14}/> {selectedMonth ? `Corte de Mes: ${selectedMonth}` : 'Sin datos'}</p>
        </div>
        
        {dbData.length === 0 || tree.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-xl border border-slate-200 shadow-sm">
            <AlertTriangle className="mx-auto text-blue-400 mb-4" size={48}/>
            <p className="text-slate-500 font-black text-xs uppercase tracking-wider mb-2">No se detectaron cuentas de Balance en el mes seleccionado.</p>
            <p className="text-slate-400 text-[10px] mt-2">Asegúrate de cargar tu Plan de Cuentas y luego el TXT con los saldos iniciales.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-800 text-[10px] uppercase font-black text-slate-300">
                <tr>
                  <th className="px-4 py-5 w-[55%]">Estructura</th>
                  <th className="px-3 py-5 text-right text-blue-300">Saldo USD</th>
                  <th className="px-3 py-5 text-right text-amber-300 hidden sm:table-cell">Equiv. Bs. <span className="text-slate-500 font-normal normal-case">(× {tasa})</span></th>
                  <th className="px-3 py-5 text-right">%</th>
                </tr>
              </thead>
              <tbody key={expandKey}>
                {tree.map((node, i) => <ExpandableRow key={i} node={node} totalBaseUSD={totalActivos} defaultOpen={defaultOpen} highlightedAccounts={highlightedAccounts} toggleHighlight={a => setHighlightedAccounts(p => {const s=new Set(p); if(s.has(a))s.delete(a); else s.add(a); return s;})} onShowReport={setActiveCode} isBalance={true}/>)}
                <tr className="bg-slate-900 text-white font-black border-t-4 border-blue-500">
                  <td colSpan={4} className="p-6">
                    <div className="flex flex-wrap justify-between items-center px-4">
                      <div className="flex items-center gap-4"><Scale size={32} className="text-blue-400"/><div><p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">Ecuación Patrimonial</p><p className="text-sm font-black tracking-widest">ACTIVOS = PASIVOS + PATRIMONIO</p></div></div>
                      <div className="flex gap-8 text-right">
                        <div><p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Total Activos</p><p className="text-xl font-mono text-blue-400">USD {fmtR(totalActivos)}</p></div>
                        <div><p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Pasivo + Patrimonio</p><p className="text-xl font-mono text-purple-400">USD {fmtR(totalPasPat)}</p></div>
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
// 8. COMPONENTE PRINCIPAL / DASHBOARD REDISEÑADO
// ============================================================================
function ReportesFinancierosApp() {
  const [view, setView] = useState('dashboard');
  
  const [dbData, setDbData] = useState(() => {
    try { const saved = localStorage.getItem('jiret_erp_db_data'); return saved ? JSON.parse(saved) : []; } catch(e){return [];}
  });
  const [planCuentas, setPlanCuentas] = useState(() => {
    try { const saved = localStorage.getItem('jiret_plan_cuentas'); return saved ? JSON.parse(saved) : {}; } catch(e){return {};}
  });
  const [auxDataConfig, setAuxDataConfig] = useState(() => {
    try { const saved = localStorage.getItem('jiret_erp_aux_data'); return saved ? JSON.parse(saved) : {}; } catch(e){return {};}
  });

  useEffect(() => { localStorage.setItem('jiret_erp_db_data', JSON.stringify(dbData)); }, [dbData]);
  useEffect(() => { localStorage.setItem('jiret_plan_cuentas', JSON.stringify(planCuentas)); }, [planCuentas]);
  useEffect(() => { localStorage.setItem('jiret_erp_aux_data', JSON.stringify(auxDataConfig)); }, [auxDataConfig]);

  const handleUploadResultados = async (e) => {
    if (!e.target.files.length) return;
    try {
      const newData = await processFiles(e.target.files);
      setDbData(prev => {
        const newlyUploadedMonths = [...new Set(newData.map(d => d.month))];
        const keepData = prev.filter(d => !newlyUploadedMonths.includes(d.month));
        return [...keepData, ...newData];
      });
      alert("✅ Resultados cargados exitosamente.");
    } catch (error) { alert("Error al procesar."); }
  };

  const handleUploadPlan = async (e) => {
    if (!e.target.files.length) return;
    try {
      const plan = await processPlanCuentas(e.target.files[0]);
      setPlanCuentas(plan);
      alert("✅ Plan de cuentas cargado. Ahora el sistema sabe estructurar el Balance.");
    } catch (error) { alert("Error al procesar el Plan."); }
  };

  const handleUploadSaldos = async (e) => {
    if (!e.target.files.length) return;
    if (Object.keys(planCuentas).length === 0) { alert("⚠️ Carga el Plan de Cuentas primero."); return; }
    try {
      const newBalanceData = await processSaldosBalance(e.target.files[0], planCuentas);
      setDbData(prev => [...prev, ...newBalanceData]);
      alert("✅ Saldos de Balance cargados.");
    } catch (error) { alert("Error al procesar los Saldos."); }
  };

  // Un solo manejador: el Excel tiene ambas hojas (CxC + CxP) y el ruteo es por Cuenta Contable
  const handleUploadAuxiliar = async (e) => {
    if (!e.target.files.length) return;
    try {
      const parsed = await processAuxFile(e.target.files);
      setAuxDataConfig(prev => ({
        ...prev,
        cxc_general:   [...(prev.cxc_general   || []), ...parsed.cxc_general],
        cxc_zuliana:   [...(prev.cxc_zuliana   || []), ...parsed.cxc_zuliana],
        cxp_autototal: [...(prev.cxp_autototal || []), ...parsed.cxp_autototal],
        cxp_surepack:  [...(prev.cxp_surepack  || []), ...parsed.cxp_surepack],
        cxp_pacomela:  [...(prev.cxp_pacomela  || []), ...parsed.cxp_pacomela],
        cxp_yancarlos: [...(prev.cxp_yancarlos || []), ...parsed.cxp_yancarlos],
        cxp_general:   [...(prev.cxp_general   || []), ...parsed.cxp_general],
      }));
      const totCxC = parsed.cxc_general.length + parsed.cxc_zuliana.length;
      const totCxP = parsed.cxp_autototal.length + parsed.cxp_surepack.length + parsed.cxp_pacomela.length + parsed.cxp_yancarlos.length + parsed.cxp_general.length;
      alert(`✅ Auxiliares procesados.\n— CxC: ${totCxC} líneas (General: ${parsed.cxc_general.length} | Zuliana: ${parsed.cxc_zuliana.length})\n— CxP: ${totCxP} líneas (Sure Pack: ${parsed.cxp_surepack.length} | Pacomela: ${parsed.cxp_pacomela.length} | Yancarlos: ${parsed.cxp_yancarlos.length} | Auto Total: ${parsed.cxp_autototal.length} | General: ${parsed.cxp_general.length})`);
    } catch (err) { alert("❌ Error al procesar auxiliares: " + err.message); }
    e.target.value = '';
  };

  // Handlers legacy (por si acaso)
  const handleUploadAuxCxC = handleUploadAuxiliar;
  const handleUploadAuxCxP = handleUploadAuxiliar;

  const handleSimulatePDFs = () => {
    setAuxDataConfig(DEFAULT_AUX_DATA);
    alert("✅ PDFs auxiliares procesados y mapeados al Balance General.");
  };

  const handleDeleteMonth = (monthToDelete) => {
    if (window.confirm(`¿Eliminar los datos de ${monthToDelete}?`)) {
      setDbData(prev => prev.filter(d => d.month !== monthToDelete));
    }
  };

  const loadedMonths = [...new Set(dbData.map(d => d.month))].filter(m => m !== 'Sin Mes');
  const hasPlan = Object.keys(planCuentas).length > 0;
  const hasAuxData = Object.keys(auxDataConfig).length > 0;
  const auxTotal = (auxDataConfig?.cxc_general?.length||0)+(auxDataConfig?.cxp_surepack?.length||0)+(auxDataConfig?.cxp_general?.length||0);

  if (view === 'resultado')     return <EstadoResultadoView   onBack={() => setView('dashboard')} dbData={dbData} />;
  if (view === 'comparativo')   return <AnalisisComparativoView onBack={() => setView('dashboard')} dbData={dbData} />;
  if (view === 'balance')       return <BalanceGeneralView    onBack={() => setView('dashboard')} dbData={dbData} auxDataConfig={auxDataConfig} />;
  if (view === 'inversiones')   return <InversionesView       onBack={() => setView('dashboard')} />;

  // ── VISTA CONFIGURACIÓN ────────────────────────────────────────────────────
  if (view === 'configuracion') return (
    <div className="min-h-screen bg-[#111111]">
      <header className="px-6 py-4 bg-[#111111] border-b-4 border-orange-500 flex items-center gap-4 shadow-lg">
        <button onClick={() => setView('dashboard')} className="flex items-center gap-2 text-slate-400 hover:text-white font-black text-xs uppercase transition-colors"><ArrowLeft size={16}/> Panel</button>
        <h1 className="text-white font-black text-lg tracking-widest uppercase flex items-center gap-2">
          Configuración <span className="text-orange-500 text-sm">/ Ingesta de Datos</span>
        </h1>
      </header>
      <main className="max-w-3xl mx-auto p-8 space-y-6">
        <div className="grid grid-cols-3 gap-4">
          {[
            { label:'Plan de Cuentas',    ok: hasPlan,              val: hasPlan ? 'Cargado' : 'Pendiente' },
            { label:'Meses en Memoria',   ok: loadedMonths.length > 0, val: loadedMonths.length > 0 ? loadedMonths.join(', ') : 'Ninguno' },
            { label:'Auxiliares CxC/CxP', ok: hasAuxData,           val: hasAuxData ? `${auxTotal} registros` : 'Pendiente' },
          ].map(s => (
            <div key={s.label} className={`rounded-2xl p-4 border ${s.ok ? 'bg-emerald-950/40 border-emerald-700' : 'bg-[#1a1a1a] border-slate-700'}`}>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{s.label}</p>
              <p className={`text-xs font-bold truncate ${s.ok ? 'text-emerald-400' : 'text-slate-500'}`}>{s.val}</p>
            </div>
          ))}
        </div>
        <div className="bg-[#1a1a1a] rounded-3xl p-8 border border-slate-700 space-y-4">
          <h2 className="text-white font-black text-sm uppercase tracking-widest mb-6 flex items-center gap-2"><Database size={16} className="text-orange-500"/> Carga de Archivos</h2>
          {[
            { num:'01', label: hasPlan ? '✓ Plan de Cuentas Cargado' : 'Plan de Cuentas (.txt)', color:'orange', active: true, accept:'.txt', handler: handleUploadPlan },
            { num:'02', label:'Saldos Iniciales — Balance (.txt)', color:'blue', active: hasPlan, accept:'.txt', handler: handleUploadSaldos },
            { num:'03', label:'Estado de Resultados (.xlsx / .csv)', color:'orange', active: true, accept:'.xlsx,.xls,.xlsm,.txt,.csv', handler: handleUploadResultados, multiple: true },
            { num:'04', label: auxTotal > 0 ? `✓ Auxiliares cargados (${auxTotal} reg.)` : 'Auxiliares CxC + CxP (.xlsx)', color:'orange', active: true, accept:'.xlsx,.xls,.xlsm,.csv,.txt', handler: handleUploadAuxiliar, multiple: true },
          ].map(step => (
            <label key={step.num} className={`flex items-center gap-4 p-4 rounded-2xl border cursor-pointer transition-all
              ${step.active ? 'border-orange-500/50 text-orange-300 bg-orange-500/5 hover:bg-orange-500/10 hover:border-orange-500' : 'border-slate-700 text-slate-600 opacity-40 cursor-not-allowed'}`}>
              <span className="text-2xl font-black font-mono opacity-30">{step.num}</span>
              <span className="flex-1 font-black text-xs uppercase tracking-wider">{step.label}</span>
              <Upload size={16} className="opacity-50"/>
              <input type="file" accept={step.accept} multiple={step.multiple} disabled={!step.active} className="hidden" onChange={step.handler}/>
            </label>
          ))}
          <div className="pt-2 border-t border-slate-700">
            <button onClick={handleSimulatePDFs} className="w-full flex items-center justify-center gap-2 bg-[#222] hover:bg-[#333] text-slate-400 hover:text-white border border-slate-600 px-4 py-3 rounded-xl font-black uppercase text-[9px] tracking-widest transition-colors">
              <FileOutput size={12}/> Cargar datos demo Abr 2026
            </button>
          </div>
        </div>
        {loadedMonths.length > 0 && (
          <div className="bg-[#1a1a1a] rounded-3xl p-6 border border-slate-700">
            <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest mb-4 flex items-center gap-2"><CheckCircle size={14} className="text-emerald-500"/> Meses en Memoria</p>
            <div className="flex flex-wrap gap-2">
              {loadedMonths.map(m => (
                <span key={m} className="bg-[#222] text-emerald-400 border border-slate-600 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2">
                  {m}<button onClick={() => handleDeleteMonth(m)} className="hover:text-red-400 transition-colors"><Trash2 size={10}/></button>
                </span>
              ))}
            </div>
          </div>
        )}
        <div className="bg-red-950/20 rounded-2xl p-5 border border-red-900/40 flex items-center justify-between">
          <div>
            <p className="text-red-400 font-black text-xs uppercase tracking-wider">Zona de Peligro</p>
            <p className="text-slate-500 text-[11px] mt-0.5">Elimina todos los datos cargados en memoria</p>
          </div>
          <button onClick={() => { if(window.confirm("¿Borrar TODOS los datos?")) { setDbData([]); setPlanCuentas({}); setAuxDataConfig({}); }}}
            className="bg-red-900/60 hover:bg-red-600 text-red-300 hover:text-white border border-red-700 px-4 py-2 rounded-xl font-black uppercase text-[9px] tracking-widest transition-all">
            Limpiar Todo
          </button>
        </div>
      </main>
    </div>
  );

  // ── DASHBOARD PRINCIPAL (colores: negro · blanco · naranja) ─────────────────
  const modules = [
    { id:'resultado',   title:'Estado de Resultados',   desc:'P&L mensual y acumulado por cuentas',       icon:<LineChart size={30}/>,  onClick:() => dbData.length > 0 ? setView('resultado')   : alert('Carga datos en Configuración.') },
    { id:'balance',     title:'Balance General',         desc:'Situación financiera multimoneda USD / Bs', icon:<Scale size={30}/>,      onClick:() => dbData.length > 0 ? setView('balance')     : alert('Carga datos en Configuración.') },
    { id:'comparativo', title:'Análisis de Variaciones', desc:'Comparativo mes a mes de resultados',       icon:<GitCompare size={30}/>, onClick:() => dbData.length >= 2 ? setView('comparativo') : alert('Necesitas al menos 2 meses.') },
    { id:'inversiones', title:'Activos Fijos',           desc:'Registro y depreciación de activos fijos',  icon:<Landmark size={30}/>,   onClick:() => setView('inversiones') },
    { id:'diario',      title:'Libro Diario',            desc:'Asientos y movimientos contables',          icon:<BookOpen size={30}/>,   disabled:true },
    { id:'config',      title:'Configuración',           desc:`Plan: ${hasPlan?'✓':'—'} · Meses: ${loadedMonths.length} · Aux: ${hasAuxData?'✓':'—'}`, icon:<Database size={30}/>, onClick:() => setView('configuracion') },
  ];

  return (
    <div className="min-h-screen bg-[#111111]">
      <header className="px-8 py-5 bg-[#111111] border-b-4 border-orange-500 shadow-2xl">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-white font-black text-2xl tracking-[0.15em] uppercase">JIRET G&B <span className="text-orange-500">Finance</span></h1>
            <p className="text-slate-500 text-[11px] font-bold tracking-[0.3em] uppercase mt-0.5">Servicios Jiret G&B, C.A. · RIF: J-412309374</p>
          </div>
          <div className="flex items-center gap-3">
            {loadedMonths.length > 0 && (
              <span className="bg-orange-500/10 border border-orange-500/40 text-orange-400 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest">
                {loadedMonths.length} mes{loadedMonths.length !== 1 ? 'es' : ''} en memoria
              </span>
            )}
            <button onClick={() => setView('configuracion')} className="bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white px-4 py-2 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center gap-2">
              <Database size={14}/> Config.
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="text-center mb-10">
          <h2 className="text-white font-black text-3xl tracking-[0.3em] uppercase mb-3">Panel Principal</h2>
          <div className="w-14 h-1 bg-orange-500 mx-auto rounded-full"/>
        </div>

        {/* Row 1: 4 financial modules */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-5">
          {modules.slice(0,4).map(mod => (
            <button key={mod.id} onClick={mod.disabled ? undefined : mod.onClick} disabled={mod.disabled}
              className={`group bg-white rounded-2xl p-6 text-left border-l-4 border-orange-500 shadow-sm transition-all duration-200
                hover:shadow-xl hover:-translate-y-1 hover:border-l-[6px] ${mod.disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}>
              <div className="mb-4 text-orange-500 transition-transform duration-200 group-hover:scale-110">{mod.icon}</div>
              <h3 className="font-black text-sm uppercase tracking-tight leading-tight mb-1.5 text-[#111111]">{mod.title}</h3>
              <p className="text-[11px] font-medium leading-relaxed text-slate-500">{mod.desc}</p>
            </button>
          ))}
        </div>

        {/* Row 2: Libro Diario + Config */}
        <div className="grid grid-cols-2 gap-5">
          {modules.slice(4).map(mod => (
            <button key={mod.id} onClick={mod.disabled ? undefined : mod.onClick} disabled={mod.disabled}
              className={`group bg-white rounded-2xl p-6 text-left border-l-4 border-orange-500 shadow-sm transition-all duration-200
                hover:shadow-xl hover:-translate-y-1 hover:border-l-[6px] ${mod.disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}>
              <div className="mb-4 text-orange-500 transition-transform duration-200 group-hover:scale-110">{mod.icon}</div>
              <h3 className="font-black text-sm uppercase tracking-tight leading-tight mb-1.5 text-[#111111]">{mod.title}</h3>
              <p className="text-[11px] font-medium leading-relaxed text-slate-500">{mod.desc}</p>
            </button>
          ))}
        </div>

        <p className="text-center text-slate-600 text-[10px] font-bold uppercase tracking-widest mt-10">
          Módulo de Reportes Financieros · Jiret G&B Finance v2.0
        </p>
      </main>
    </div>
  );
}

// ============================================================================
// 9. VISTA: ACTIVOS FIJOS / INVERSIONES
// ============================================================================
const ACTIVOS_FIJOS = [
  { grupo:'Vehículos',                   cod:'AF-V001', descripcion:'Camión Reparto — Chevrolet N300',          fechaAdq:'07/10/2025', costoOriginal:21110.23, depAcum:2637.53, vidaUtil:60,  proveedor:'AUTO TOTAL, C.A' },
  { grupo:'Inmuebles',                   cod:'AF-I001', descripcion:'Local Comercial — Contrato Pacomela',      fechaAdq:'02/01/2026', costoOriginal:169547.91,depAcum:4238.70, vidaUtil:240, proveedor:'AGRO INDUSTRIAS LACTEAS PACOMELA, C.A' },
  { grupo:'Maquinaria y Equipos',        cod:'AF-M001', descripcion:'Equipos de Producción y Empaque',         fechaAdq:'01/06/2024', costoOriginal:15000.00, depAcum:3750.00, vidaUtil:60,  proveedor:'—' },
  { grupo:'Maquinaria y Equipos',        cod:'AF-M002', descripcion:'Sistema de Refrigeración Industrial',     fechaAdq:'15/08/2024', costoOriginal:8500.00,  depAcum:1487.50, vidaUtil:84,  proveedor:'—' },
  { grupo:'Mobiliario y Equipos Oficina',cod:'AF-O001', descripcion:'Mobiliario Oficina Administrativa',       fechaAdq:'01/03/2024', costoOriginal:3200.00,  depAcum:1280.00, vidaUtil:60,  proveedor:'—' },
  { grupo:'Mobiliario y Equipos Oficina',cod:'AF-O002', descripcion:'Equipos de Computación y Periféricos',   fechaAdq:'15/09/2024', costoOriginal:4800.00,  depAcum:1200.00, vidaUtil:36,  proveedor:'—' },
];

function InversionesView({ onBack }) {
  const grupos = [...new Set(ACTIVOS_FIJOS.map(a => a.grupo))];
  const fmt = v => new Intl.NumberFormat('es-VE', { minimumFractionDigits:2, maximumFractionDigits:2 }).format(v);
  const totalCosto = ACTIVOS_FIJOS.reduce((s,a) => s + a.costoOriginal, 0);
  const totalDep   = ACTIVOS_FIJOS.reduce((s,a) => s + a.depAcum, 0);
  const totalNeto  = totalCosto - totalDep;

  return (
    <div className="min-h-screen bg-[#f1f5f9]">
      <header className="bg-white border-b-2 border-orange-500 p-4 flex justify-between items-center sticky top-0 z-30 shadow-md">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="flex items-center gap-2 font-black text-xs text-slate-600 uppercase hover:text-orange-600 transition-colors"><ArrowLeft size={16}/> Volver al Panel</button>
          <span className="text-slate-200">|</span>
          <span className="font-black text-xs text-slate-700 uppercase tracking-widest flex items-center gap-2"><Landmark size={14} className="text-orange-500"/> Activos Fijos</span>
        </div>
        <span className="bg-orange-50 border border-orange-200 text-orange-700 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest">Corte: Abril 2026</span>
      </header>

      <main className="p-4 md:p-8 max-w-6xl mx-auto pb-16">
        <div className="bg-white px-8 py-10 border-t-8 border-orange-500 shadow-xl flex flex-col items-center text-center mb-6 rounded-b-2xl">
          <h1 className="text-3xl font-black text-slate-900 uppercase mb-1 tracking-tighter">Servicios Jiret G&B, C.A.</h1>
          <div className="w-16 h-1 bg-orange-500 mb-4 rounded-full"/>
          <h2 className="text-xl font-black text-slate-800 uppercase tracking-widest mb-5">Registro de Activos Fijos</h2>
          <div className="grid grid-cols-3 gap-6 w-full max-w-2xl">
            {[
              { label:'Costo Original', val:fmt(totalCosto), color:'text-slate-800' },
              { label:'Dep. Acumulada', val:fmt(totalDep),   color:'text-red-600' },
              { label:'Valor Neto USD', val:fmt(totalNeto),  color:'text-orange-600' },
            ].map(k => (
              <div key={k.label} className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{k.label}</p>
                <p className={`text-lg font-black font-mono ${k.color}`}>{k.val}</p>
              </div>
            ))}
          </div>
        </div>

        {grupos.map(grupo => {
          const items = ACTIVOS_FIJOS.filter(a => a.grupo === grupo);
          const gCosto = items.reduce((s,a) => s + a.costoOriginal, 0);
          const gDep   = items.reduce((s,a) => s + a.depAcum, 0);
          return (
            <div key={grupo} className="bg-white rounded-2xl shadow-lg overflow-hidden border border-slate-200 mb-5">
              <div className="bg-[#111111] px-6 py-3 flex justify-between items-center">
                <span className="text-orange-400 font-black text-xs uppercase tracking-widest">{grupo}</span>
                <span className="text-slate-400 text-[10px] font-bold">Neto: <span className="text-white font-black">USD {fmt(gCosto-gDep)}</span></span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse" style={{minWidth:'780px'}}>
                  <thead className="bg-slate-50 text-[9px] uppercase font-black text-slate-400 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Código</th><th className="px-4 py-3">Descripción</th>
                      <th className="px-4 py-3">Fecha Adq.</th><th className="px-4 py-3">Proveedor</th>
                      <th className="px-4 py-3 text-right">Costo USD</th><th className="px-4 py-3 text-right">Dep. Acum.</th>
                      <th className="px-4 py-3 text-right text-orange-600">Valor Neto</th><th className="px-4 py-3 text-center">Vida Útil</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((a,i) => (
                      <tr key={i} className="border-b border-slate-100 hover:bg-orange-50/30 transition-colors">
                        <td className="px-4 py-3 text-[11px] font-black text-slate-500 font-mono">{a.cod}</td>
                        <td className="px-4 py-3 text-[11px] font-bold text-slate-800">{a.descripcion}</td>
                        <td className="px-4 py-3 text-[11px] text-slate-500 font-mono">{a.fechaAdq}</td>
                        <td className="px-4 py-3 text-[10px] text-slate-400 max-w-[140px] truncate" title={a.proveedor}>{a.proveedor}</td>
                        <td className="px-4 py-3 text-right text-[11px] font-mono text-slate-700">{fmt(a.costoOriginal)}</td>
                        <td className="px-4 py-3 text-right text-[11px] font-mono text-red-500">({fmt(a.depAcum)})</td>
                        <td className="px-4 py-3 text-right text-[12px] font-mono font-black text-orange-600">{fmt(a.costoOriginal-a.depAcum)}</td>
                        <td className="px-4 py-3 text-center text-[10px] text-slate-400">{a.vidaUtil} meses</td>
                      </tr>
                    ))}
                    <tr className="bg-slate-100 font-black text-[11px] border-t-2 border-slate-300">
                      <td colSpan={4} className="px-4 py-2.5 text-slate-700 uppercase tracking-wider">Total {grupo}</td>
                      <td className="px-4 py-2.5 text-right font-mono text-slate-800">{fmt(gCosto)}</td>
                      <td className="px-4 py-2.5 text-right font-mono text-red-600">({fmt(gDep)})</td>
                      <td className="px-4 py-2.5 text-right font-mono text-orange-700">{fmt(gCosto-gDep)}</td>
                      <td/>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}

        <div className="bg-[#111111] rounded-2xl p-6 flex justify-between items-center border-2 border-orange-500 shadow-xl">
          <span className="text-white font-black uppercase tracking-widest text-sm">TOTAL ACTIVOS FIJOS NETOS</span>
          <span className="text-orange-400 font-black font-mono text-2xl">USD {fmt(totalNeto)}</span>
        </div>
      </main>
    </div>
  );
}

export default ReportesFinancierosApp;

import React, { useState, useMemo, useEffect } from 'react';
import { 
  ArrowLeft, Upload, CheckCircle, Scale, 
  LineChart, CalendarDays, AlertTriangle, ChevronRight, ChevronDown, Star, PlusCircle, Trash2, ArrowUpRight, ArrowDownRight, GitCompare, Landmark, FileSpreadsheet,
  FileText, Users, Briefcase, Search, BookOpen, Database, FileOutput, CornerDownRight
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
      if (String(usdStr).includes('SALDO NETO') || String(bsStr).includes('SALDO NETO')) { pathStack.push(name.trim()); continue; }
      const usd = parseVal(usdStr); const bs = parseVal(bsStr);
      if (usd !== null) { allParsedData.push({ month, path: pathStack.map(p => p.trim()).join('>'), name: name.trim(), usd, bs: bs || 0 }); }
      else { pathStack.push(name.trim()); }
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

// ─────────────────────────────────────────────────────────────────────────────
// Saldos Iniciales — parser jerárquico para TXT y Excel
// Soporta la estructura estándar venezolana con pathStack/smartPop (igual que
// el Estado de Resultados), con ambas columnas USD y Bs.
// TXT columnas: [Nombre]\t[USD]\t[Bs.] — las líneas "Total X" hacen pop del stack
// XLSX columnas detectadas dinámicamente: 'Cuenta Contable', 'USD', 'Bs.'
// ─────────────────────────────────────────────────────────────────────────────
const processSaldosBalance = async (file, planCuentas) => {
  const ext = file.name.split('.').pop().toLowerCase();

  const parseVal = (v) => {
    if (v === null || v === undefined) return null;
    const s0 = String(v).trim();
    if (!s0 || s0 === '-' || s0 === 'USD -' || s0 === 'Bs. -' || s0 === 'USD-' || s0 === '0,00') {
      // "0,00" is a real zero; "-" means missing
      if (s0 === '0,00' || s0 === '0.00') return 0;
      if (s0 === '-') return null; // truly absent
    }
    let s = s0.replace(/USD|Bs\.|Bs|BsF|\$/ig, '').trim();
    if (!s || s === '-') return null;
    // Handle Venezuelan format: 1.234.567,89 → 1234567.89
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

  // ── FORMATO TXT / CSV ──────────────────────────────────────────────────────
  if (ext === 'txt' || ext === 'csv') {
    const text = await file.text();
    const lines = text.split(/\r?\n/);
    let pathStack = [];
    let balanceData = [];

    for (const rawLine of lines) {
      if (!rawLine.trim()) continue;
      // Split by tab — col0=name, col1=USD or empty, col2=Bs. or empty
      const cols = rawLine.split('\t');
      const name = (cols[0] || '').trim();
      if (!name) continue;

      // Skip the verification/check line at the bottom
      if (/ACTIVO.*PASIVO.*PATRIMONIO|ACTIVO-\(PASIVO/i.test(name)) continue;

      // "Total X" → pop pathStack back to X
      if (/^Total\s+/i.test(name)) { smartPop(pathStack, name); continue; }

      // Try to parse values from columns
      // Column layout varies: some files put USD in col1, Bs. in col2
      // Others may put USD in col1 and Bs in col3 (with blank col2)
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

      // Is this an account entry? Heuristic: starts with a digit-code like 1.1.xx
      const isAccount = /^\d[\d\.]{4,}/.test(name);

      if (isAccount && (usdVal !== null || bsVal !== null)) {
        balanceData.push({
          month: 'Saldos Iniciales',
          path: pathStack.map(p => p.trim()).join('>'),
          name: name.trim(),
          usd: usdVal ?? 0,
          bs:  bsVal  ?? 0,
        });
      } else if (!isAccount) {
        // Section header → push to pathStack (ignore total rows already handled)
        pathStack.push(name.trim());
      }
    }
    return balanceData;
  }

  // ── FORMATO EXCEL (.xlsx / .xls) ──────────────────────────────────────────
  const XL = await loadSheetJS();
  const buffer = await file.arrayBuffer();
  const wb = XL.read(buffer, { type: 'array' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rawData = XL.utils.sheet_to_json(ws, { header: 1, defval: null });
  if (!rawData.length) return [];

  // Try to detect header row and column indices
  let headerRowIdx = 0;
  let idxCuenta = -1, idxUSD = -1, idxBs = -1;

  for (let ri = 0; ri < Math.min(5, rawData.length); ri++) {
    const hr = rawData[ri].map(h => String(h||'').toUpperCase().trim());
    const cIdx = hr.findIndex(h => h.includes('CUENTA') || h.includes('NOMBRE') || h.includes('DESCRIPCION'));
    const uIdx = hr.findIndex(h => h.includes('USD') || h.includes('DOLAR'));
    const bIdx = hr.findIndex(h => h.includes('BS') || h.includes('BOLIVAR'));
    if (cIdx !== -1 || uIdx !== -1) { headerRowIdx = ri; idxCuenta = cIdx; idxUSD = uIdx; idxBs = bIdx; break; }
  }

  // If header-less, guess: col0=name, col1=USD, col2=Bs
  if (idxCuenta === -1) { idxCuenta = 0; idxUSD = 1; idxBs = 2; headerRowIdx = -1; }

  const balanceData = [];
  // If header found, try hierarchical pathStack approach (same as TXT)
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
        month: 'Saldos Iniciales',
        path: pathStack.map(p => p.trim()).join('>') || 'ACTIVOS>OTROS',
        name, usd: usdV ?? 0, bs: bsV ?? 0,
      });
    } else if (!isAccount) {
      pathStack.push(name.trim());
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
            cod: row[0] ? String(row[0]).trim() : '-', nombre, operacion: row[2] ? String(row[2]).trim() : '-',
            emision: parseDate(row[3]), vence: parseDate(row[4]),
            dias: row[5] !== null && row[5] !== undefined ? String(row[5]).trim() : '-',
            doc: row[6] ? String(row[6]).trim() : '-', descripcion: row[7] ? String(row[7]).trim() : '-',
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
          doc: colMap.doc >= 0 && row[colMap.doc] ? String(row[colMap.doc]).trim() : '-',
          emision: colMap.emision >= 0 ? parseDate(row[colMap.emision]) : '-',
          vence: colMap.vence >= 0 ? parseDate(row[colMap.vence]) : '-', monto,
        };
        if (nombre.includes('ZULIANA DE EMPAQUE')) result.cxc_zuliana.push({...record, monto: Math.abs(monto)});
        else if (nombre.includes('AUTO TOTAL')) result.cxp_autototal.push(record);
        else if (nombre.includes('SURE PACK')) result.cxp_surepack.push(record);
        else if (nombre.includes('PACOMELA') || nombre.includes('AGRO INDUSTRIAS LACTEAS')) result.cxp_pacomela.push(record);
        else if (nombre.includes('YANCARLOS') || nombre.includes('PEREZ CASANOVA')) result.cxp_yancarlos.push(record);
        else result.cxp_general.push(record);
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
      const iCant=ci('cant','cantidad'); const iDesc=ci('mobiliario y equipo','mobiliario','descripcion','activo','bien');
      const iSede=ci('sede'); const iCuenta=ci('cuenta');
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
          cuenta:String(g(row,iCuenta)||'-').trim(), depreciacion:String(g(row,iDeprMet)||'-').trim(),
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

const handleExportActivosFijosExcel = (records,fileName) => {
  if (!window.XLSX){alert("Cargando librería Excel...");return;}
  const headers=['Cant','MOBILIARIO Y EQUIPO','SEDE','CUENTA','DEPRECIACION','DEPRECIACION ACUM','FECHA DE ADQUISICION','VIDA UTIL ASIGNADA','VIDA UTIL TRANSCURRIDA','COSTO ADQUISICION USD','COSTO ADQUISICION BS','DEP.ACUM','VALOR NETO LIBROS','DEPRE. MENSUAL','Tasa'];
  const rows=records.map(r=>[r.cant,r.descripcion,r.sede,r.cuenta,r.depreciacion,r.depreciacionAcum,r.fechaAdq,r.vidaUtilAsig,r.vidaUtilTrans,r.costoUSD,r.costoBS,r.depAcum,r.valorNeto,r.depreMensual,r.tasa]);
  const ws=window.XLSX.utils.aoa_to_sheet([["SERVICIOS JIRET G&B, C.A."],["RIF: J-412309374"],["REGISTRO DE ACTIVOS FIJOS"],[`Fecha: ${new Date().toLocaleDateString()}`],[],headers,...rows]);
  ws['!cols']=[5,36,14,18,14,14,16,12,12,16,16,14,14,13,8].map(w=>({wch:w}));
  const wb=window.XLSX.utils.book_new();
  window.XLSX.utils.book_append_sheet(wb,ws,"Activos Fijos");
  window.XLSX.writeFile(wb,`${fileName}.xlsx`);
};

// ============================================================================
// 2. CONFIGURACIÓN DE MAPEO
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
        {node.c.map((child, i) => <ExpandableRow key={i} node={child} level={level + 1} totalBaseUSD={totalBaseUSD} defaultOpen={defaultOpen} highlightedAccounts={highlightedAccounts} toggleHighlight={toggleHighlight} onShowReport={onShowReport} isBalance={isBalance}/>)}
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
    // Sub-transacción (factura hija): jerarquía visual diferenciada
    const isSubItem = level > 0 && isLeaf && !isAccountNode;
    if (isSubItem) {
      return (
        <tr className="border-b border-slate-100 bg-slate-50/80 hover:bg-slate-100 transition-colors">
          <td style={{ paddingLeft: `${level * 18 + 32}px` }} className="py-2 px-3 text-[10.5px] text-slate-500 flex items-center gap-2">
            <CornerDownRight size={12} className="text-slate-300 flex-shrink-0" />
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300 flex-shrink-0"/>
            <span className="truncate max-w-[380px] font-medium">{node.n}</span>
          </td>
          <td className="py-2 px-3 text-right font-mono text-[10.5px] text-slate-500">{fmtCur(Math.abs(node.u))}</td>
          <td className="py-2 px-3 text-right font-mono text-[10.5px] text-slate-500 hidden sm:table-cell">{fmtCur(Math.abs(node.b))}</td>
          <td className="py-2 px-3 text-right font-mono text-[10px] text-slate-400">{pct}</td>
        </tr>
      );
    }
    return (
      <>
        <tr onClick={() => !isLeaf && setIsOpen(!isOpen)} className={`border-b border-gray-200 cursor-pointer transition-colors ${isHighlighted ? 'bg-amber-100/80 hover:bg-amber-200 border-l-4 border-amber-500' : 'bg-white hover:bg-slate-50 border-l-4 border-slate-400'}`}>
          <td style={indent} className="py-2.5 px-3 font-bold text-[11px] text-slate-900 uppercase select-none flex items-center flex-wrap gap-2">
            {!isLeaf && <span className={`inline-flex items-center justify-center w-4 h-4 border rounded-sm text-[11px] leading-none transition-colors ${isOpen ? 'border-slate-500 text-slate-600 bg-slate-100' : 'border-slate-300 text-slate-400 bg-white'}`}>{isOpen ? '−' : '+'}</span>}
            <button onClick={(e) => { e.stopPropagation(); toggleHighlight(node.n); }} className="focus:outline-none transition-transform hover:scale-110"><Star size={16} fill={isHighlighted ? "#f59e0b" : "none"} color={isHighlighted ? "#f59e0b" : "#cbd5e1"} /></button>
            <span className="truncate">{node.n}</span>
            {hasMapping && isBalance && (
              <button onClick={(e) => { e.stopPropagation(); const typeToPass = accountCode ? accountCode : (node.n.toUpperCase().includes('COBRAR') ? 'cxc' : 'cxp'); onShowReport(typeToPass); }}
                className="ml-2 px-2.5 py-1 bg-blue-600 text-white rounded-md text-[9px] font-black tracking-widest hover:bg-blue-700 shadow-md flex items-center gap-1">
                <Search size={10}/> VER REPORTE
              </button>
            )}
          </td>
          <td className={`py-2.5 px-3 text-right font-mono text-[11px] font-bold ${isHighlighted ? 'text-amber-900' : 'text-slate-800'}`}>{fmtCur(Math.abs(node.u))}</td>
          <td className={`py-2.5 px-3 text-right font-mono text-[11px] font-bold hidden sm:table-cell ${isHighlighted ? 'text-amber-900' : 'text-slate-800'}`}>{fmtCur(Math.abs(node.b))}</td>
          <td className={`py-2.5 px-3 text-right font-mono text-[11px] font-bold ${isHighlighted ? 'text-amber-700' : 'text-slate-500'}`}>{pct}</td>
        </tr>
        {isOpen && node.c && node.c.map((child, i) => <ExpandableRow key={i} node={child} level={level + 1} totalBaseUSD={totalBaseUSD} defaultOpen={defaultOpen} highlightedAccounts={highlightedAccounts} toggleHighlight={toggleHighlight} onShowReport={onShowReport} isBalance={isBalance}/>)}
        {!isLeaf && isOpen && (
          <tr className="bg-slate-200/60 font-black text-[10px] border-t border-slate-200">
            <td style={{ paddingLeft: level * 18 + 24 }} className="py-1.5 px-3 uppercase text-slate-500 tracking-wider">TOTAL {node.n}</td>
            <td className="py-1.5 px-3 text-right font-mono text-slate-700">{fmtCur(Math.abs(node.u))}</td>
            <td className="py-1.5 px-3 text-right font-mono text-slate-700 hidden sm:table-cell">{fmtCur(Math.abs(node.b))}</td>
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
  const mapInfo = ACCOUNT_MAPS[accountCode] || { type: 'cxp_general', filter: 'ALL', label: 'Reporte General' };
  const allData = auxDataConfig[mapInfo.type] || [];
  const filteredData = (!mapInfo.filter || mapInfo.filter === 'ALL') ? allData : allData.filter(d => d.nombre.toUpperCase().includes(mapInfo.filter.toUpperCase()));
  const total = filteredData.reduce((acc, curr) => acc + curr.monto, 0);
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
        <div className="text-right">
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Saldo Total</p>
          <p className={`text-2xl font-mono font-black ${isCxC ? 'text-blue-600' : 'text-red-600'}`}>USD {fmtCur(total)}</p>
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
function EstadoResultadoView({ onBack, dbData }) {
  const availableMonths = useMemo(() => [...new Set(dbData.map(d => d.month))].filter(m=>m!=='Sin Mes'), [dbData]);
  const [selectedMonth, setSelectedMonth] = useState('General');
  const [defaultOpen, setDefaultOpen] = useState(false);
  const [expandKey, setExpandKey] = useState(0);
  const [highlightedAccounts, setHighlightedAccounts] = useState(() => new Set());
  const toggleHighlight = (a) => setHighlightedAccounts(prev => { const s=new Set(prev); if(s.has(a))s.delete(a); else s.add(a); return s; });

  const tree = useMemo(() => {
    const root = [];
    const monthData = selectedMonth === 'General' ? dbData : dbData.filter(d => d.month === selectedMonth);
    const resData = monthData.filter(item => !item.path.toUpperCase().includes('ACTIVO') && !item.path.toUpperCase().includes('PASIVO') && !item.path.toUpperCase().includes('PATRIMONIO') && !/^[123]/.test(item.name));
    const normKey = s => s.trim().replace(/\s+/g,' ').toUpperCase();
    resData.forEach(item => {
      const pathArray = item.path.split('>');
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
    const compute = (nodes) => { let u=0,b=0; nodes.forEach(n => { if(!n.isLeaf){const t=compute(n.c);n.u=t.u;n.b=t.b;} u+=n.u;b+=n.b; }); return {u,b}; };
    compute(root);
    root.forEach(rootNode => {
      const isIngreso = rootNode.n.toUpperCase().includes('INGRESO') || rootNode.n.toUpperCase().includes('VENTA') || rootNode.n.startsWith('4');
      const multiplier = isIngreso ? -1 : 1;
      const applySign = (nodes) => nodes.forEach(n => { n.u *= multiplier; n.b *= multiplier; if (!n.isLeaf) applySign(n.c); });
      applySign([rootNode]);
    });
    return root;
  }, [dbData, selectedMonth]);

  let totalUSD = 0; let baseVentas = 0;
  tree.forEach(n => { if(n.n.toUpperCase().includes('INGRESO')||n.n.toUpperCase().includes('VENTA')||n.n.startsWith('4')){totalUSD+=n.u;baseVentas+=n.u;}else{totalUSD-=n.u;} });
  if (baseVentas === 0) baseVentas = 1;
  const fmtR = (v) => new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);

  return (
    <div className="min-h-screen bg-[#f1f5f9]">
      <header className="bg-white border-b-2 border-orange-500 p-4 flex justify-between items-center sticky top-0 z-30 shadow-md flex-wrap gap-4">
        <div className="flex items-center gap-4 flex-wrap">
          <button onClick={onBack} className="flex items-center gap-2 font-black text-xs text-slate-600 uppercase hover:text-orange-600"><ArrowLeft size={16}/> Volver al Panel</button>
          <div className="flex items-center gap-2 border-l-2 border-slate-200 pl-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Período:</span>
            <select value={selectedMonth} onChange={e=>setSelectedMonth(e.target.value)} className="bg-orange-50 border-2 border-orange-300 text-orange-800 text-xs rounded-lg p-1.5 font-black uppercase cursor-pointer outline-none min-w-[120px]">
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
          <h2 className="text-xl font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-2 mb-4 w-full max-w-md">Estado de Resultado {selectedMonth === 'General' ? 'Acumulado' : selectedMonth}</h2>
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
                <td className="px-3 py-7 text-right text-lg font-mono hidden sm:table-cell text-slate-400">—</td>
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
function AnalisisComparativoView({ onBack, dbData }) {
  const availableMonths = useMemo(() => [...new Set(dbData.map(d => d.month))].filter(m => m !== 'Sin Mes'), [dbData]);
  const [month1, setMonth1] = useState(availableMonths[0] || '');
  const [month2, setMonth2] = useState(availableMonths[1] || availableMonths[0] || '');
  const fmtR = (v) => new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);

  const tree = useMemo(() => {
    const root = [];
    const getData = (m) => dbData.filter(d => d.month === m && !d.path.toUpperCase().includes('ACTIVO') && !d.path.toUpperCase().includes('PASIVO') && !d.path.toUpperCase().includes('PATRIMONIO'));
    const m1Data = getData(month1); const m2Data = getData(month2);
    const processItem = (item, isM1) => {
      const pathParts = item.path.split('>');
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
    root.forEach(cat => {
      let cat_m1 = 0, cat_m2 = 0;
      const isIngreso = cat.n.includes('INGRESO') || cat.n.includes('VENTA') || cat.key?.startsWith('4');
      const multiplier = isIngreso ? -1 : 1;
      cat.c.forEach(acc => { acc.m1_u *= multiplier; acc.m2_u *= multiplier; cat_m1 += acc.m1_u; cat_m2 += acc.m2_u; });
      cat.m1_u = cat_m1; cat.m2_u = cat_m2;
    });
    return root;
  }, [dbData, month1, month2]);

  let total_m1 = 0, total_m2 = 0;
  tree.forEach(cat => { const isIng = cat.n.includes('INGRESO')||(cat.key&&cat.key.startsWith('4')); if(isIng){total_m1+=cat.m1_u;total_m2+=cat.m2_u;}else{total_m1-=cat.m1_u;total_m2-=cat.m2_u;} });
  const varAbsTotal = total_m1 - total_m2;

  return (
    <div className="min-h-screen bg-[#f1f5f9]">
      <header className="bg-white border-b-2 border-indigo-500 p-4 flex justify-between items-center sticky top-0 z-30 shadow-md flex-wrap gap-3">
        <button onClick={onBack} className="flex items-center gap-2 font-black text-xs text-slate-600 uppercase hover:text-indigo-600"><ArrowLeft size={16}/> Volver al Panel</button>
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Base:</span>
          <select value={month1} onChange={e=>setMonth1(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs font-bold outline-none">{availableMonths.map(m=><option key={m}>{m}</option>)}</select>
          <span className="text-slate-400 font-black text-xs">VS</span>
          <select value={month2} onChange={e=>setMonth2(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs font-bold outline-none">{availableMonths.map(m=><option key={m}>{m}</option>)}</select>
        </div>
      </header>
      <main className="p-4 md:p-8 max-w-6xl mx-auto pb-16">
        <div className="bg-white px-8 py-10 border-t-8 border-indigo-500 shadow-xl flex flex-col items-center text-center mb-6 rounded-b-2xl">
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

function BalanceGeneralView({ onBack, dbData, auxDataConfig, activosFijosData }) {
  const availableMonths = useMemo(() => {
    const balanceRecords = dbData.filter(item =>
      item.path.toUpperCase().includes('ACTIVO') ||
      item.path.toUpperCase().includes('PASIVO') ||
      item.path.toUpperCase().includes('PATRIMONIO') ||
      /^[123]/.test(item.name)
    );
    const months = [...new Set(balanceRecords.map(d => d.month))];
    // Ensure 'Saldos Iniciales' always appears first if present
    const siIdx = months.indexOf('Saldos Iniciales');
    if (siIdx > 0) { months.splice(siIdx, 1); months.unshift('Saldos Iniciales'); }
    return months;
  }, [dbData]);
  const [selectedMonth, setSelectedMonth] = useState(availableMonths[availableMonths.length - 1] || '');
  const [defaultOpen, setDefaultOpen] = useState(false);
  const [expandKey, setExpandKey] = useState(0);
  const [activeCode, setActiveCode] = useState(null);
  const [tasa, setTasa] = useState(90);
  const [highlightedAccounts, setHighlightedAccounts] = useState(() => new Set());

  const MORD = {'Saldos Iniciales':0,Enero:1,Febrero:2,Marzo:3,Abril:4,Mayo:5,Junio:6,Julio:7,Agosto:8,Septiembre:9,Octubre:10,Noviembre:11,Diciembre:12};

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
      // Prefer actual file values; fall back to tasa conversion only if one is missing
      const usdVal = (item.usd !== undefined && item.usd !== null) ? item.usd : (item.bs ? item.bs / tasa : 0);
      const bsVal  = (item.bs  !== undefined && item.bs  !== null && item.bs !== 0) ? item.bs : (item.usd ? item.usd * tasa : 0);
      const leafKey = normKey(item.name);
      let leaf = cur.find(n => normKey(n.n) === leafKey && n.isLeaf);
      if (!leaf) cur.push({ n: item.name.trim(), u: usdVal, b: bsVal, isLeaf: true });
      else { leaf.u += usdVal; leaf.b += bsVal; }
    });

    const compute = (nodes) => { let u=0,b=0; nodes.forEach(n=>{if(!n.isLeaf){const t=compute(n.c);n.u=t.u;n.b=t.b;}u+=n.u;b+=n.b;}); return {u,b}; };

    const auxEntries = [];
    // CxC / CxP desde auxiliares
    Object.entries(ACCOUNT_MAPS).forEach(([code, info]) => {
      const records = auxDataConfig?.[info.type] || [];
      const total = records.reduce((s,r) => s + r.monto, 0);
      if (total === 0) return;
      const isCxC = info.type.startsWith('cxc');
      auxEntries.push({ name: `${code}-${info.label}`, path: isCxC ? 'ACTIVOS>ACTIVO CIRCULANTE>CUENTAS POR COBRAR' : 'PASIVOS>PASIVO CIRCULANTE>CUENTAS POR PAGAR', usd: total, bs: total * tasa });
    });

    // Activos Fijos — valores en Bs HISTÓRICOS, inmunes a tasa del día
    if (activosFijosData?.records?.length) {
      const extraM = Math.max(0, (MORD[selectedMonth]||4) - 4);
      const costoMap = {};
      const depAccMap = {};
      activosFijosData.records.forEach(r => {
        const assetCta = r.cuenta && r.cuenta !== '-' ? r.cuenta : 'ACTIVOS FIJOS';
        if (!costoMap[assetCta]) costoMap[assetCta] = { usd: 0, bs: 0 };
        costoMap[assetCta].usd += r.costoUSD;
        costoMap[assetCta].bs  += r.costoBS; // Bs histórico — no cambia con tasa

        const ctaUp = assetCta.toUpperCase();
        let depCta = 'DEP. ACUMULADA ACTIVOS FIJOS';
        for (const [kw, ccode] of Object.entries(DEP_ACUM_ACCOUNT_MAP)) {
          if (ctaUp.includes(kw)) { depCta = ccode; break; }
        }
        const depActualUSD = r.depAcum + (extraM * r.depreMensual);
        // Tasa histórica del activo para calcular Bs de depreciación
        const tasaHist = r.tasa || (r.costoUSD ? r.costoBS / r.costoUSD : 1);
        const depActualBS = depActualUSD * tasaHist;
        if (!depAccMap[depCta]) depAccMap[depCta] = { usd: 0, bs: 0 };
        depAccMap[depCta].usd += depActualUSD;
        depAccMap[depCta].bs  += depActualBS;
      });
      Object.entries(costoMap).forEach(([cta, v]) => {
        if (v.usd !== 0) auxEntries.push({ name: cta, path: 'ACTIVOS>ACTIVOS NO CORRIENTES>ACTIVOS FIJOS', usd: v.usd, bs: v.bs });
      });
      Object.entries(depAccMap).forEach(([depCta, vals]) => {
        if (vals.usd !== 0) auxEntries.push({ name: depCta, path: 'ACTIVOS>ACTIVOS NO CORRIENTES>ACTIVOS FIJOS', usd: -vals.usd, bs: -vals.bs });
      });
    }

    auxEntries.forEach(item => {
      const pathArray = item.path.split('>');
      let cur = root;
      pathArray.forEach(folderName => {
        const key = normKey(folderName);
        let folder = cur.find(n => normKey(n.n) === key);
        if (!folder) { folder = { n: folderName.trim(), c: [], u: 0, b: 0 }; cur.push(folder); }
        cur = folder.c;
      });
      const leafKey = normKey(item.name);
      const existIdx = cur.findIndex(n => normKey(n.n) === leafKey && n.isLeaf);
      if (existIdx !== -1) cur.splice(existIdx, 1);
      cur.push({ n: item.name.trim(), u: item.usd, b: item.bs, isLeaf: true });
    });

    compute(root);
    const sectionOrder = (name) => { const n=name.toUpperCase(); if(n.includes('ACTIVO')||n.startsWith('1'))return 1; if(n.includes('PASIVO')||n.startsWith('2'))return 2; if(n.includes('PATRIMONIO')||n.startsWith('3'))return 3; return 9; };
    root.sort((a,b) => sectionOrder(a.n) - sectionOrder(b.n));
    const assetSubOrder = (name) => { const n=name.toUpperCase(); if(n.includes('DISPONIBLE')||n.includes('CAJA')||n.includes('BANCO'))return 1; if(n.includes('POR COBRAR')||n.includes('COBRAR'))return 2; if(n.includes('INVENTARIO'))return 3; if(n.includes('ANTICIPO'))return 4; if(n.includes('FIJO')||n.includes('INMUEBLE'))return 6; return 5; };
    const sortNodes = (nodes, depth) => { if(depth===0)return; nodes.sort((a,b)=>{const ao=assetSubOrder(a.n),bo=assetSubOrder(b.n);if(ao!==bo)return ao-bo;return a.n.localeCompare(b.n);}); nodes.forEach(n=>{if(!n.isLeaf&&n.c)sortNodes(n.c,depth-1);}); };
    root.forEach(r => { if(r.c) sortNodes(r.c, 3); });
    return root;
  }, [dbData, selectedMonth, tasa, auxDataConfig, activosFijosData]);

  let totalActivos = 0; let totalPasPat = 0;
  tree.forEach(n => { if(n.n.toUpperCase().includes('ACTIVO')||n.n.startsWith('1'))totalActivos+=n.u; else totalPasPat+=n.u; });
  const fmtR = (v) => new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Math.abs(v));

  if (activeCode) return <AuxiliarReportView accountCode={activeCode} onBack={() => setActiveCode(null)} auxDataConfig={auxDataConfig} />;

  return (
    <div className="min-h-screen bg-[#f1f5f9]">
      <header className="bg-white border-b-2 border-blue-500 p-4 flex justify-between items-center sticky top-0 z-30 shadow-md flex-wrap gap-2">
        <div className="flex items-center gap-4 flex-wrap">
          <button onClick={onBack} className="flex items-center gap-2 font-black text-xs text-slate-600 uppercase hover:text-blue-600"><ArrowLeft size={16}/> Salir al Panel</button>
          {availableMonths.length > 0 && (
            <div className="border-l-2 border-slate-200 pl-4 flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Corte:</span>
              <select value={selectedMonth} onChange={e=>setSelectedMonth(e.target.value)} className="bg-blue-50 border border-blue-300 text-blue-700 text-xs rounded-lg p-1.5 font-bold uppercase cursor-pointer outline-none">
                {availableMonths.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          )}
          <div className="border-l-2 border-slate-200 pl-4 flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tasa Bs/USD:</span>
            <input type="number" min="1" step="0.01" value={tasa} onChange={e=>setTasa(parseFloat(e.target.value)||1)} className="bg-amber-50 border border-amber-300 text-amber-800 text-xs rounded-lg p-1.5 w-24 font-black outline-none"/>
          </div>
        </div>
        <div className="flex gap-2 bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button onClick={()=>{setDefaultOpen(true);setExpandKey(k=>k+1);}} className="px-3 py-1.5 rounded text-[10px] font-black uppercase flex items-center gap-1 hover:bg-white"><ChevronDown size={14}/> Expandir</button>
          <button onClick={()=>{setDefaultOpen(false);setExpandKey(k=>k+1);}} className="px-3 py-1.5 rounded text-[10px] font-black uppercase flex items-center gap-1 hover:bg-white"><ChevronRight size={14}/> Contraer</button>
        </div>
      </header>
      <main className="p-4 md:p-8 max-w-6xl mx-auto pb-16">
        <div className="bg-white px-8 py-10 border-t-8 border-blue-500 shadow-xl flex flex-col items-center text-center mb-6 rounded-b-2xl">
          <h1 className="text-3xl font-black text-slate-900 uppercase mb-2 tracking-tighter">Servicios Jiret G&B, C.A.</h1>
          <h2 className="text-xl font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-2 mb-4 w-full max-w-md">Balance de Situación Financiera</h2>
          <p className="text-blue-600 font-black uppercase bg-blue-50 px-5 py-2 rounded-full text-[10px] border border-blue-100">{selectedMonth ? `Corte: ${selectedMonth}` : 'Sin datos'}</p>
        </div>
        {dbData.length === 0 || tree.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-xl border border-slate-200"><AlertTriangle className="mx-auto text-blue-400 mb-4" size={48}/><p className="text-slate-500 font-black text-xs uppercase">No se detectaron cuentas de Balance.</p></div>
        ) : (
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-800 text-[10px] uppercase font-black text-slate-300">
                <tr>
                  <th className="px-4 py-5 w-[55%]">Estructura</th>
                  <th className="px-3 py-5 text-right text-blue-300">Saldo USD</th>
                  <th className="px-3 py-5 text-right text-amber-300 hidden sm:table-cell">Saldo Bs. <span className="text-slate-400 font-normal normal-case text-[8px]">(archivo · tasa×{tasa})</span></th>
                  <th className="px-3 py-5 text-right">%</th>
                </tr>
              </thead>
              <tbody key={expandKey}>
                {tree.map((node, i) => <ExpandableRow key={i} node={node} totalBaseUSD={totalActivos} defaultOpen={defaultOpen} highlightedAccounts={highlightedAccounts} toggleHighlight={a=>{setHighlightedAccounts(p=>{const s=new Set(p);if(s.has(a))s.delete(a);else s.add(a);return s;})}} onShowReport={setActiveCode} isBalance={true}/>)}
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
// 8. VISTA: ACTIVOS FIJOS (Valores en Bs — Tasa Histórica)
// ============================================================================
const getRubro = (r) => {
  const s = ((r.cuenta||'')+(r.descripcion||'')).toUpperCase();
  if (s.includes('VEHICUL')||s.includes('CAMION')||s.includes('CARRO')) return 'VEHÍCULOS';
  if (s.includes('PLANTA ELECTR')||s.includes('GENERATOR')) return 'PLANTA ELÉCTRICA';
  if (s.includes('GALPON')||s.includes('INMUEBLE')||s.includes('LOCAL')||s.includes('MEJORA')) return 'GALPON / INMUEBLE';
  if (s.includes('MAQUINAR')||s.includes('EQUIPO')) return 'MAQUINARIA Y EQUIPOS';
  if (s.includes('MOBIL')||s.includes('ESCRITORIO')||s.includes('SILLA')||s.includes('MUEBLE')) return 'MOBILIARIO';
  return 'OTROS';
};
const MONTH_NUM = {Enero:1,Febrero:2,Marzo:3,Abril:4,Mayo:5,Junio:6,Julio:7,Agosto:8,Septiembre:9,Octubre:10,Noviembre:11,Diciembre:12};
const BASE_MONTH = 4;

function InversionesView({ onBack, activosFijosData }) {
  const records = activosFijosData?.records || [];
  const [search, setSearch] = useState('');
  const [filterSede, setFilterSede] = useState('all');
  const [filterRubro, setFilterRubro] = useState('all');
  const [filterFechaAnio, setFilterFechaAnio] = useState('all');
  const [mesCorte, setMesCorte] = useState('Abril');
  const sedes = useMemo(()=>['all',...new Set(records.map(r=>r.sede).filter(s=>s&&s!=='-'))],[records]);
  const rubros = useMemo(()=>['all',...new Set(records.map(getRubro))],[records]);
  const anios = useMemo(()=>{ const set=new Set(); records.forEach(r=>{if(r.fechaAdq){const y=r.fechaAdq.split('/')[2];if(y)set.add(y);}}); return ['all',...[...set].sort()]; },[records]);
  const mesesCorte = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const extraMeses = Math.max(0, (MONTH_NUM[mesCorte]||4) - BASE_MONTH);

  // Lógica en Bs con tasa histórica (inmune a tasa del día)
  const getTasaHist = (r) => r.tasa || (r.costoUSD ? r.costoBS / r.costoUSD : 1);
  const getDepAcumActualBs = (r) => (r.depAcum + extraMeses * r.depreMensual) * getTasaHist(r);
  const getValorNetoActualBs = (r) => r.costoBS - getDepAcumActualBs(r);
  const getDepMensualBs = (r) => r.depreMensual * getTasaHist(r);

  const INVALID_CUENTAS = new Set(['CUENTA','CUENTA CONTABLE','MOBILIARIO Y EQUIPO','-','']);
  const filtered = useMemo(()=>{
    let r=records;
    if (filterSede!=='all') r=r.filter(x=>x.sede===filterSede);
    if (filterRubro!=='all') r=r.filter(x=>getRubro(x)===filterRubro);
    if (filterFechaAnio!=='all') r=r.filter(x=>x.fechaAdq&&x.fechaAdq.split('/')[2]===filterFechaAnio);
    if (search.trim()){const q=search.toLowerCase();r=r.filter(x=>x.descripcion.toLowerCase().includes(q)||x.cuenta.toLowerCase().includes(q));}
    return r;
  },[records,search,filterSede,filterRubro,filterFechaAnio]);
  const filteredValid = useMemo(()=>filtered.filter(r=>{ const c=(r.cuenta||'').toUpperCase().trim(); return !INVALID_CUENTAS.has(c)&&r.costoUSD>0; }),[filtered]);
  const grupos = useMemo(()=>{ const m={}; filteredValid.forEach(r=>{const g=r.cuenta&&r.cuenta!=='-'?r.cuenta:'SIN CUENTA';if(!m[g])m[g]=[];m[g].push(r);}); return m; },[filteredValid]);
  const fmt=v=>new Intl.NumberFormat('es-VE',{minimumFractionDigits:2,maximumFractionDigits:2}).format(v||0);
  const totalCostoBs=filteredValid.reduce((s,r)=>s+r.costoBS,0);
  const totalDepAcumBs=filteredValid.reduce((s,r)=>s+getDepAcumActualBs(r),0);
  const totalNetoBs=filteredValid.reduce((s,r)=>s+getValorNetoActualBs(r),0);
  const totalMensualBs=filteredValid.reduce((s,r)=>s+getDepMensualBs(r),0);

  if (!records.length) return (
    <div className="min-h-screen bg-[#f1f5f9]">
      <header className="bg-white border-b-2 border-orange-500 p-4"><button onClick={onBack} className="flex items-center gap-2 font-black text-xs text-slate-600 uppercase hover:text-orange-600"><ArrowLeft size={16}/> Volver al Panel</button></header>
      <div className="max-w-xl mx-auto mt-24 text-center p-8"><Landmark size={48} className="text-orange-300 mx-auto mb-4"/><h2 className="text-xl font-black text-slate-700 uppercase mb-2">Sin datos de Activos Fijos</h2><p className="text-slate-400 text-sm font-bold">Ve a <span className="text-orange-500">Configuración → 05</span> y carga tu auxiliar Excel.</p></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f1f5f9]">
      <header className="bg-white border-b-2 border-orange-500 p-4 flex flex-wrap justify-between items-center gap-3 sticky top-0 z-30 shadow-md">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="flex items-center gap-2 font-black text-xs text-slate-600 uppercase hover:text-orange-600"><ArrowLeft size={16}/> Volver al Panel</button>
          <span className="font-black text-xs text-slate-700 uppercase tracking-widest flex items-center gap-2"><Landmark size={14} className="text-orange-500"/> Activos Fijos (Bs)</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative"><Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar..." className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none w-36"/></div>
          <select value={filterRubro} onChange={e=>setFilterRubro(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs font-bold outline-none">{rubros.map(s=><option key={s} value={s}>{s==='all'?'Todos los rubros':s}</option>)}</select>
          <select value={filterSede} onChange={e=>setFilterSede(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs font-bold outline-none">{sedes.map(s=><option key={s} value={s}>{s==='all'?'Todas las sedes':s}</option>)}</select>
          <select value={filterFechaAnio} onChange={e=>setFilterFechaAnio(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs font-bold outline-none">{anios.map(a=><option key={a} value={a}>{a==='all'?'Todos los años':a}</option>)}</select>
          <div className="flex items-center gap-1.5 bg-orange-50 border border-orange-200 rounded-lg px-2 py-1">
            <span className="text-[9px] font-black text-orange-500 uppercase tracking-widest whitespace-nowrap">Corte:</span>
            <select value={mesCorte} onChange={e=>setMesCorte(e.target.value)} className="bg-transparent text-orange-700 text-xs font-black outline-none cursor-pointer">{mesesCorte.map(m=><option key={m}>{m}</option>)}</select>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={()=>window.print()} className="px-4 py-1.5 bg-slate-900 text-white rounded-lg text-[10px] font-black uppercase hover:bg-slate-800">PDF</button>
          <button onClick={()=>handleExportActivosFijosExcel(filteredValid,'Activos_Fijos')} className="px-4 py-1.5 bg-emerald-700 text-white rounded-lg text-[10px] font-black uppercase hover:bg-emerald-600">Excel</button>
        </div>
      </header>

      <main className="p-4 md:p-8 max-w-[1600px] mx-auto pb-16">
        <div className="bg-white px-8 py-8 border-t-8 border-orange-500 shadow-xl flex flex-col items-center text-center mb-6 rounded-b-2xl">
          <h1 className="text-2xl font-black text-slate-900 uppercase mb-1 tracking-tighter">Servicios Jiret G&B, C.A.</h1>
          <div className="w-16 h-1 bg-orange-500 mb-4 rounded-full"/>
          <h2 className="text-lg font-black text-slate-800 uppercase tracking-widest mb-2">Registro de Activos Fijos</h2>
          <p className="text-[9px] font-bold text-orange-500 uppercase tracking-widest mb-5">Valores en Bolívares · Tasa Histórica · Al corte de: {mesCorte} 2026{extraMeses>0?` (+${extraMeses} mes${extraMeses>1?'es':''} desde Abril)`:''}</p>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 w-full max-w-5xl">
            {[{label:'Costo Adq. USD',val:`USD ${fmt(filteredValid.reduce((s,r)=>s+r.costoUSD,0))}`,color:'text-blue-700',bg:'bg-blue-50'},
              {label:'Costo Histórico Bs',val:`Bs ${fmt(totalCostoBs)}`,color:'text-slate-700',bg:'bg-slate-50'},
              {label:`Dep. Acum. Bs al ${mesCorte}`,val:`(Bs ${fmt(totalDepAcumBs)})`,color:'text-red-600',bg:'bg-red-50'},
              {label:'Valor Neto Bs',val:`Bs ${fmt(totalNetoBs)}`,color:'text-orange-600',bg:'bg-orange-50'},
              {label:'Dep. Mensual Bs',val:`Bs ${fmt(totalMensualBs)}`,color:'text-emerald-600',bg:'bg-emerald-50'},
            ].map(k=>(<div key={k.label} className={`${k.bg} rounded-xl p-4 border border-slate-200`}><p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">{k.label}</p><p className={`text-base font-black font-mono ${k.color} truncate`}>{k.val}</p></div>))}
          </div>
        </div>

        {Object.entries(grupos).map(([cuenta,items])=>{
          const gCostoUSD=items.reduce((s,r)=>s+r.costoUSD,0);
          const gCostoBS=items.reduce((s,r)=>s+r.costoBS,0);
          const gDepAcumBs=items.reduce((s,r)=>s+getDepAcumActualBs(r),0);
          const gNetoBs=items.reduce((s,r)=>s+getValorNetoActualBs(r),0);
          const gMensualBs=items.reduce((s,r)=>s+getDepMensualBs(r),0);
          return (
            <div key={cuenta} className="bg-white rounded-xl shadow-md overflow-hidden border border-slate-200 mb-4">
              <div className="bg-slate-800 px-4 py-2.5 flex flex-wrap justify-between items-center gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-2 h-2 rounded-full bg-orange-400 flex-shrink-0"/>
                  <span className="text-orange-300 font-black text-[11px] tracking-wide truncate">{cuenta}</span>
                  <span className="text-slate-500 text-[10px]">· {items.length} activo{items.length!==1?'s':''}</span>
                </div>
                <div className="flex gap-4 text-right text-[10px] flex-shrink-0">
                  <div><p className="text-slate-500 text-[8px] uppercase font-bold">Costo USD</p><p className="font-mono font-black text-blue-400">USD {fmt(gCostoUSD)}</p></div>
                  <div><p className="text-slate-500 text-[8px] uppercase font-bold">Costo Bs</p><p className="font-mono font-black text-white">Bs {fmt(gCostoBS)}</p></div>
                  <div><p className="text-slate-500 text-[8px] uppercase font-bold">Dep.Acum Bs</p><p className="font-mono font-black text-red-400">(Bs {fmt(gDepAcumBs)})</p></div>
                  <div><p className="text-slate-500 text-[8px] uppercase font-bold">Val.Neto Bs</p><p className="font-mono font-black text-emerald-400">Bs {fmt(gNetoBs)}</p></div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse" style={{minWidth:'1600px'}}>
                  <thead>
                    <tr className="bg-slate-50 border-b-2 border-slate-200 text-[8px] uppercase font-black">
                      <th className="px-2 py-2 text-center text-slate-500 w-8">Cant</th>
                      <th className="px-2 py-2 text-slate-700 w-44">Descripción</th>
                      <th className="px-2 py-2 text-center text-slate-500 w-10">Sede</th>
                      <th className="px-2 py-2 text-slate-500 w-44">Cuenta</th>
                      <th className="px-2 py-2 text-violet-500 w-40">Depreciación (Gasto)</th>
                      <th className="px-2 py-2 text-indigo-500 w-44">Dep. Acum (Cuenta)</th>
                      <th className="px-2 py-2 text-slate-500 w-20">F. Adq.</th>
                      <th className="px-2 py-2 text-center text-slate-500 w-12">V.U. Asig</th>
                      <th className="px-2 py-2 text-center text-slate-500 w-12">V.U. Trans</th>
                      <th className="px-2 py-2 text-right text-blue-600 w-28 bg-blue-50">Costo Adq. USD</th>
                      <th className="px-2 py-2 text-right text-slate-600 w-28 bg-slate-100">Costo Adq. Bs.</th>
                      <th className="px-2 py-2 text-right text-red-500 w-28 bg-red-50">DEP.ACUM Bs.</th>
                      <th className="px-2 py-2 text-right text-orange-600 w-28 bg-orange-50">Val. Neto Bs.</th>
                      <th className="px-2 py-2 text-right text-emerald-600 w-24 bg-emerald-50">Dep. Mensual Bs.</th>
                      <th className="px-2 py-2 text-right text-slate-400 w-14">Tasa</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((a,i)=>(
                      <tr key={i} className={`border-b border-slate-100 hover:bg-orange-50/20 transition-colors ${i%2===0?'bg-white':'bg-slate-50/40'}`}>
                        <td className="px-2 py-1.5 text-center font-mono text-[10px] text-slate-400">{a.cant}</td>
                        <td className="px-2 py-1.5 font-bold text-[10px] text-slate-800 max-w-[176px] truncate" title={a.descripcion}>{a.descripcion}</td>
                        <td className="px-2 py-1.5 text-center text-[10px] text-slate-500 font-bold">{a.sede}</td>
                        <td className="px-2 py-1.5 font-mono text-[9px] text-slate-600 truncate max-w-[176px]" title={a.cuenta}>{a.cuenta||'-'}</td>
                        <td className="px-2 py-1.5 font-mono text-[9px] text-violet-500 truncate max-w-[160px]" title={a.depreciacion}>{a.depreciacion||'-'}</td>
                        <td className="px-2 py-1.5 font-mono text-[9px] text-indigo-400 truncate max-w-[176px]" title={a.depreciacionAcum}>{a.depreciacionAcum||'-'}</td>
                        <td className="px-2 py-1.5 font-mono text-[10px] text-slate-500 whitespace-nowrap">{a.fechaAdq||'-'}</td>
                        <td className="px-2 py-1.5 text-center font-mono text-[10px] text-slate-400">{a.vidaUtilAsig||'-'}</td>
                        <td className="px-2 py-1.5 text-center font-mono text-[10px] text-slate-400">{a.vidaUtilTrans||'-'}</td>
                        <td className="px-2 py-1.5 text-right font-mono font-bold text-[10px] text-blue-700 bg-blue-50/40 whitespace-nowrap">USD {fmt(a.costoUSD)}</td>
                        <td className="px-2 py-1.5 text-right font-mono text-[10px] text-slate-600 bg-slate-50 whitespace-nowrap">Bs. {fmt(a.costoBS)}</td>
                        <td className="px-2 py-1.5 text-right font-mono text-[10px] text-red-600 bg-red-50/30 whitespace-nowrap">Bs. {fmt(getDepAcumActualBs(a))}</td>
                        <td className="px-2 py-1.5 text-right font-mono font-bold text-[11px] text-orange-600 bg-orange-50/40 whitespace-nowrap">Bs. {fmt(getValorNetoActualBs(a))}</td>
                        <td className="px-2 py-1.5 text-right font-mono text-[10px] text-emerald-600 bg-emerald-50/30 whitespace-nowrap">Bs. {fmt(getDepMensualBs(a))}</td>
                        <td className="px-2 py-1.5 text-right font-mono text-[10px] text-slate-400 whitespace-nowrap">{(a.tasa||0).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-800 text-white font-black text-[9px] border-t-2 border-orange-500">
                      <td colSpan={9} className="px-3 py-2 text-orange-300 uppercase tracking-widest">Subtotal {cuenta}</td>
                      <td className="px-2 py-2 text-right font-mono text-blue-300 whitespace-nowrap">USD {fmt(gCostoUSD)}</td>
                      <td className="px-2 py-2 text-right font-mono whitespace-nowrap">Bs. {fmt(gCostoBS)}</td>
                      <td className="px-2 py-2 text-right font-mono text-red-300 whitespace-nowrap">Bs. {fmt(gDepAcumBs)}</td>
                      <td className="px-2 py-2 text-right font-mono text-orange-300 whitespace-nowrap">Bs. {fmt(gNetoBs)}</td>
                      <td className="px-2 py-2 text-right font-mono text-emerald-300 whitespace-nowrap">Bs. {fmt(gMensualBs)}</td>
                      <td/>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          );
        })}

        <div className="bg-[#111111] rounded-2xl p-6 flex flex-wrap justify-between items-center gap-4 border-2 border-orange-500 shadow-xl">
          <span className="text-white font-black uppercase tracking-widest text-sm">TOTAL ACTIVOS FIJOS — {filteredValid.length} activos</span>
          <div className="flex gap-8 text-right flex-wrap">
            <div><p className="text-[8px] text-slate-400 font-bold uppercase">Costo Bs</p><p className="font-mono font-black text-lg text-white">{fmt(totalCostoBs)}</p></div>
            <div><p className="text-[8px] text-slate-400 font-bold uppercase">Dep. Acum Bs</p><p className="font-mono font-black text-lg text-red-400">({fmt(totalDepAcumBs)})</p></div>
            <div><p className="text-[8px] text-slate-400 font-bold uppercase">Valor Neto Bs</p><p className="font-mono font-black text-lg text-orange-400">{fmt(totalNetoBs)}</p></div>
            <div><p className="text-[8px] text-slate-400 font-bold uppercase">Dep/Mes Bs</p><p className="font-mono font-black text-lg text-emerald-400">{fmt(totalMensualBs)}</p></div>
          </div>
        </div>
      </main>
    </div>
  );
}

// ============================================================================
// 9. APP PRINCIPAL / DASHBOARD
// ============================================================================
function ReportesFinancierosApp() {
  const [view, setView] = useState('dashboard');
  const [dbData, setDbData] = useState(() => { try { return JSON.parse(localStorage.getItem('jiret_erp_db_data')||'[]'); } catch(e){return [];} });
  const [planCuentas, setPlanCuentas] = useState(() => { try { return JSON.parse(localStorage.getItem('jiret_plan_cuentas')||'{}'); } catch(e){return {};} });
  const [auxDataConfig, setAuxDataConfig] = useState(() => { try { return JSON.parse(localStorage.getItem('jiret_erp_aux_data')||'{}'); } catch(e){return {};} });
  const [activosFijosData, setActivosFijosData] = useState(() => { try { const s=JSON.parse(localStorage.getItem('jiret_af_data')||'null'); return s||{records:[]}; } catch(e){return {records:[]};} });

  useEffect(() => { localStorage.setItem('jiret_erp_db_data', JSON.stringify(dbData)); }, [dbData]);
  useEffect(() => { localStorage.setItem('jiret_plan_cuentas', JSON.stringify(planCuentas)); }, [planCuentas]);
  useEffect(() => { localStorage.setItem('jiret_erp_aux_data', JSON.stringify(auxDataConfig)); }, [auxDataConfig]);
  useEffect(() => { localStorage.setItem('jiret_af_data', JSON.stringify(activosFijosData)); }, [activosFijosData]);

  const handleUploadActivosFijos = async (e) => { if (!e.target.files.length) return; try { const d=await processActivosFijosExcel(e.target.files); setActivosFijosData(d); alert(`✅ Activos Fijos: ${d.records.length} registros cargados.`); } catch(err){alert("Error: "+err.message);} e.target.value=''; };
  const handleUploadResultados = async (e) => { if (!e.target.files.length) return; try { const newData=await processFiles(e.target.files); setDbData(prev=>{const nm=[...new Set(newData.map(d=>d.month))];return [...prev.filter(d=>!nm.includes(d.month)),...newData];}); alert("✅ Resultados cargados."); } catch(err){alert("Error.");} };
  const handleUploadPlan = async (e) => { if (!e.target.files.length) return; try { const plan=await processPlanCuentas(e.target.files[0]); setPlanCuentas(plan); alert("✅ Plan de cuentas cargado."); } catch(err){alert("Error.");} };
  const handleUploadSaldos = async (e) => { if (!e.target.files.length) return; try { const d=await processSaldosBalance(e.target.files[0],planCuentas); setDbData(prev=>[...prev,...d]); alert("✅ Saldos cargados."); } catch(err){alert("Error.");} };
  const handleUploadAuxiliar = async (e) => {
    if (!e.target.files.length) return;
    try {
      const parsed = await processAuxFile(e.target.files);
      setAuxDataConfig(prev => ({...prev,
        cxc_general:   [...(prev.cxc_general   ||[]), ...parsed.cxc_general],
        cxc_zuliana:   [...(prev.cxc_zuliana   ||[]), ...parsed.cxc_zuliana],
        cxp_autototal: [...(prev.cxp_autototal ||[]), ...parsed.cxp_autototal],
        cxp_surepack:  [...(prev.cxp_surepack  ||[]), ...parsed.cxp_surepack],
        cxp_pacomela:  [...(prev.cxp_pacomela  ||[]), ...parsed.cxp_pacomela],
        cxp_yancarlos: [...(prev.cxp_yancarlos ||[]), ...parsed.cxp_yancarlos],
        cxp_general:   [...(prev.cxp_general   ||[]), ...parsed.cxp_general],
      }));
      const totCxC = parsed.cxc_general.length + parsed.cxc_zuliana.length;
      const totCxP = parsed.cxp_autototal.length+parsed.cxp_surepack.length+parsed.cxp_pacomela.length+parsed.cxp_yancarlos.length+parsed.cxp_general.length;
      alert(`✅ Auxiliares: CxC ${totCxC} · CxP ${totCxP} registros`);
    } catch(err){alert("❌ Error: "+err.message);} e.target.value='';
  };

  const handleSimulatePDFs = () => { setAuxDataConfig(DEFAULT_AUX_DATA); alert("✅ Datos demo cargados."); };

  // Limpiar slot individual
  const clearSlot = (slot) => {
    const msgs = {
      '01': () => { if(window.confirm("¿Limpiar Plan de Cuentas?")) { setPlanCuentas({}); alert("Plan de Cuentas eliminado."); }},
      '02': () => { if(window.confirm("¿Limpiar Saldos Iniciales?")) { setDbData(prev=>prev.filter(d=>d.month!=='Saldos Iniciales')); alert("Saldos Iniciales eliminados."); }},
      '03': () => { if(window.confirm("¿Limpiar todos los meses de Resultados?")) { setDbData(prev=>prev.filter(d=>d.month==='Saldos Iniciales')); alert("Resultados eliminados."); }},
      '04': () => { if(window.confirm("¿Limpiar todos los Auxiliares CxC/CxP?")) { setAuxDataConfig({}); alert("Auxiliares eliminados."); }},
      '05': () => { if(window.confirm("¿Limpiar datos de Activos Fijos?")) { setActivosFijosData({records:[]}); alert("Activos Fijos eliminados."); }},
    };
    msgs[slot] && msgs[slot]();
  };
  const handleDeleteMonth = (m) => { if(window.confirm(`¿Eliminar ${m}?`)) setDbData(prev=>prev.filter(d=>d.month!==m)); };

  const loadedMonths = [...new Set(dbData.map(d => d.month))].filter(m => m !== 'Sin Mes');
  const hasPlan = Object.keys(planCuentas).length > 0;
  const hasAuxData = Object.keys(auxDataConfig).length > 0;
  const auxTotal = (auxDataConfig?.cxc_general?.length||0)+(auxDataConfig?.cxp_surepack?.length||0)+(auxDataConfig?.cxp_general?.length||0);
  const afCount = activosFijosData?.records?.length || 0;

  // ── Clock (hook declarado antes de cualquier return condicional) ────────────
  const [clock, setClock] = useState('');
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2,'0');
      const mm = String(now.getMinutes()).padStart(2,'0');
      const ss = String(now.getSeconds()).padStart(2,'0');
      const dias = ['DOM','LUN','MAR','MIÉ','JUE','VIE','SÁB'];
      const meses = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC'];
      setClock(`${hh}:${mm}:${ss} · ${dias[now.getDay()]} ${now.getDate()} ${meses[now.getMonth()]}. ${now.getFullYear()}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  if (view === 'resultado')   return <EstadoResultadoView   onBack={()=>setView('dashboard')} dbData={dbData}/>;
  if (view === 'comparativo') return <AnalisisComparativoView onBack={()=>setView('dashboard')} dbData={dbData}/>;
  if (view === 'balance')     return <BalanceGeneralView    onBack={()=>setView('dashboard')} dbData={dbData} auxDataConfig={auxDataConfig} activosFijosData={activosFijosData}/>;
  if (view === 'inversiones') return <InversionesView       onBack={()=>setView('dashboard')} activosFijosData={activosFijosData}/>;

  if (view === 'configuracion') return (
    <div className="min-h-screen bg-[#111111]">
      <header className="px-6 py-4 bg-[#111111] border-b-4 border-orange-500 flex items-center gap-4 shadow-lg">
        <button onClick={()=>setView('dashboard')} className="flex items-center gap-2 text-slate-400 hover:text-white font-black text-xs uppercase"><ArrowLeft size={16}/> Panel</button>
        <h1 className="text-white font-black text-lg tracking-widest uppercase flex items-center gap-2">Configuración <span className="text-orange-500 text-sm">/ Ingesta de Datos</span></h1>
      </header>
      <main className="max-w-3xl mx-auto p-8 space-y-6">
        <div className="grid grid-cols-3 gap-4">
          {[{label:'Plan de Cuentas',ok:hasPlan,val:hasPlan?'Cargado':'Pendiente'},{label:'Meses en Memoria',ok:loadedMonths.length>0,val:loadedMonths.length>0?loadedMonths.join(', '):'Ninguno'},{label:'Auxiliares CxC/CxP',ok:hasAuxData,val:hasAuxData?`${auxTotal} reg.`:'Pendiente'}].map(s=>(
            <div key={s.label} className={`rounded-2xl p-4 border ${s.ok?'bg-emerald-950/40 border-emerald-700':'bg-[#1a1a1a] border-slate-700'}`}>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{s.label}</p>
              <p className={`text-xs font-bold truncate ${s.ok?'text-emerald-400':'text-slate-500'}`}>{s.val}</p>
            </div>
          ))}
        </div>
        <div className="bg-[#1a1a1a] rounded-3xl p-8 border border-slate-700 space-y-4">
          <h2 className="text-white font-black text-sm uppercase tracking-widest mb-6 flex items-center gap-2"><Database size={16} className="text-orange-500"/> Carga de Archivos</h2>
          {[
            {num:'01',label:hasPlan?`✓ Plan Cuentas (${Object.keys(planCuentas).length} ctas)`:'Plan de Cuentas (.txt)',active:true,accept:'.txt',handler:handleUploadPlan,hasClear:hasPlan},
            {num:'02',label:dbData.some(d=>d.month==='Saldos Iniciales')?'✓ Saldos Iniciales Cargados':'Balance General (.txt / .xlsx)',active:true,accept:'.xlsx,.xls,.xlsm,.txt',handler:handleUploadSaldos,hasClear:dbData.some(d=>d.month==='Saldos Iniciales')},
            {num:'03',label:loadedMonths.length>0?`✓ Resultados (${loadedMonths.length} mes${loadedMonths.length!==1?'es':''})`:'Estado de Resultados (.xlsx)',active:true,accept:'.xlsx,.xls,.xlsm,.txt,.csv',handler:handleUploadResultados,multiple:true,hasClear:loadedMonths.length>0},
            {num:'04',label:auxTotal>0?`✓ Auxiliares cargados (${auxTotal} reg.)`:'Auxiliares CxC + CxP (.xlsx)',active:true,accept:'.xlsx,.xls,.xlsm,.csv,.txt',handler:handleUploadAuxiliar,multiple:true,hasClear:hasAuxData},
            {num:'05',label:afCount>0?`✓ Activos Fijos (${afCount} reg.)`:'Activos Fijos (.xlsx)',active:true,accept:'.xlsx,.xls,.xlsm',handler:handleUploadActivosFijos,multiple:true,hasClear:afCount>0},
          ].map(step=>(
            <div key={step.num} className="flex items-center gap-2">
            <label key={step.num} className={`flex items-center gap-3 p-4 rounded-2xl border transition-all cursor-pointer ${step.active?'border-orange-500/50 text-orange-300 bg-orange-500/5 hover:bg-orange-500/10 hover:border-orange-500':'border-slate-700 text-slate-600 opacity-40 cursor-not-allowed'}`}>
              <span className="text-2xl font-black font-mono opacity-30">{step.num}</span>
              <span className="flex-1 font-black text-xs uppercase tracking-wider">{step.label}</span>
              <Upload size={16} className="opacity-50"/>
              <input type="file" accept={step.accept} multiple={step.multiple} disabled={!step.active} className="hidden" onChange={step.handler}/>
            </label>
              {step.hasClear && <button onClick={(e)=>{e.stopPropagation();clearSlot(step.num);}} title="Eliminar datos" className="flex-shrink-0 p-1.5 bg-red-950/60 hover:bg-red-600 text-red-500 hover:text-white rounded-lg border border-red-900/40 transition-colors"><Trash2 size={12}/></button>}
            </div>
          ))}
          <div className="pt-2 border-t border-slate-700">
            <button onClick={handleSimulatePDFs} className="w-full flex items-center justify-center gap-2 bg-[#222] hover:bg-[#333] text-slate-400 hover:text-white border border-slate-600 px-4 py-3 rounded-xl font-black uppercase text-[9px] tracking-widest transition-colors"><FileOutput size={12}/> Cargar datos demo Abr 2026</button>
          </div>
        </div>
        {loadedMonths.length > 0 && (
          <div className="bg-[#1a1a1a] rounded-3xl p-6 border border-slate-700">
            <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest mb-4 flex items-center gap-2"><CheckCircle size={14} className="text-emerald-500"/> Meses en Memoria</p>
            <div className="flex flex-wrap gap-2">
              {loadedMonths.map(m=>(<span key={m} className="bg-[#222] text-emerald-400 border border-slate-600 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2">{m}<button onClick={()=>handleDeleteMonth(m)} className="hover:text-red-400"><Trash2 size={10}/></button></span>))}
            </div>
          </div>
        )}
        <div className="bg-red-950/20 rounded-2xl p-5 border border-red-900/40 flex items-center justify-between">
          <div><p className="text-red-400 font-black text-xs uppercase tracking-wider">Zona de Peligro</p><p className="text-slate-500 text-[11px] mt-0.5">Elimina todos los datos en memoria</p></div>
          <button onClick={()=>{if(window.confirm("¿Borrar TODOS los datos?"))setDbData([]);setPlanCuentas({});setAuxDataConfig({});setActivosFijosData({records:[]});}} className="bg-red-900/60 hover:bg-red-600 text-red-300 hover:text-white border border-red-700 px-4 py-2 rounded-xl font-black uppercase text-[9px] tracking-widest">Limpiar Todo</button>
        </div>
      </main>
    </div>
  );

  // ── DASHBOARD PRINCIPAL — diseño SaaS light ────────────────────────────────
  const modules = [
    { id:'resultado',   title:'Estado de Resultados',   desc:'P&L mensual y acumulado por cuentas',
      iconBg:'bg-slate-800', icon:<LineChart size={22} className="text-white"/>,
      preview: <svg viewBox="0 0 120 40" className="w-full h-10 mt-3 opacity-70"><polyline points="0,38 20,28 40,32 60,18 80,22 100,10 120,14" fill="none" stroke="#f97316" strokeWidth="2.5" strokeLinejoin="round"/><polyline points="0,38 20,34 40,30 60,24 80,20 100,16 120,12" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinejoin="round" strokeDasharray="3 2"/></svg>,
      onClick:()=>dbData.length>0?setView('resultado'):alert('Carga datos en Configuración.') },
    { id:'balance',     title:'Balance General',         desc:'Situación financiera multimoneda USD / Bs.',
      iconBg:'bg-blue-600', icon:<Scale size={22} className="text-white"/>,
      preview: <svg viewBox="0 0 120 40" className="w-full h-10 mt-3 opacity-70">{[10,25,20,35,28,40,32,38].map((h,i)=><rect key={i} x={i*15+2} y={40-h} width="11" height={h} fill="#f97316" rx="2"/>)}</svg>,
      onClick:()=>dbData.length>0?setView('balance'):alert('Carga datos en Configuración.') },
    { id:'comparativo', title:'Análisis de Variaciones', desc:'Comparativo mes a mes de resultados',
      iconBg:'bg-purple-600', icon:<GitCompare size={22} className="text-white"/>,
      preview: <svg viewBox="0 0 120 40" className="w-full h-10 mt-3 opacity-70">{[20,15,22,18,24,16,20,14].map((h,i)=>[<rect key={`a${i}`} x={i*15+1} y={40-h} width="6" height={h} fill="#f97316" rx="1"/>,<rect key={`b${i}`} x={i*15+8} y={40-h*0.7} width="6" height={h*0.7} fill="#94a3b8" rx="1"/>])}</svg>,
      onClick:()=>dbData.length>=2?setView('comparativo'):alert('Necesitas al menos 2 meses.') },
    { id:'inversiones', title:'Activos Fijos',           desc:'Registro y depreciación de activos fijos',
      iconBg:'bg-emerald-600', icon:<Landmark size={22} className="text-white"/>,
      preview: <div className="mt-3 flex gap-1 items-end h-10">{[60,80,70,90,75,85].map((h,i)=><div key={i} className="flex-1 rounded-t" style={{height:`${h}%`,background: i===3?'#f97316':'#e2e8f0'}}/>)}</div>,
      onClick:()=>setView('inversiones') },
    { id:'diario',      title:'Libro Diario',            desc:'Asientos y movimientos contables',
      iconBg:'bg-amber-500', icon:<BookOpen size={22} className="text-white"/>,
      preview: <div className="mt-3 space-y-1.5 opacity-50">{['Asiento de nómina','Factura de compra','Factura de compra'].map((t,i)=><div key={i} className="flex items-center gap-2"><div className="w-3 h-3 rounded border-2 border-green-500 flex items-center justify-center"><div className="w-1.5 h-1.5 bg-green-500 rounded-sm"/></div><span className="text-[9px] text-slate-500">{t}</span></div>)}</div>,
      disabled:true },
    { id:'config',      title:'Configuración',           desc:'Plan · Meses · Auxiliares · Activos',
      iconBg:'bg-slate-500', icon:<Database size={22} className="text-white"/>,
      preview: <div className="mt-3 text-[10px] text-slate-500 space-y-0.5"><p>Plan: {hasPlan?<span className="text-emerald-600 font-bold">Cargado</span>:'—'} <span className="mx-1">|</span> Meses: {loadedMonths.length}</p><p>CxC: {(auxDataConfig?.cxc_general?.length||0)} reg. <span className="mx-1">|</span> CxP: {(auxDataConfig?.cxp_general?.length||0)} reg.</p><p>Activos: {afCount} <span className="mx-1">|</span> Base: {dbData.length}</p></div>,
      onClick:()=>setView('configuracion') },
  ];

  return (
    <div className="min-h-screen" style={{background:'#f3f2ef', backgroundImage:'radial-gradient(circle, #c8c8c8 1px, transparent 1px)', backgroundSize:'22px 22px'}}>
      {/* Header SaaS */}
      <header className="bg-white border-b border-slate-200 px-6 py-3 flex justify-between items-center shadow-sm sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
            <LineChart size={18} className="text-white"/>
          </div>
          <div>
            <p className="font-black text-sm text-slate-900 leading-none">JIRET G&B <span className="text-orange-500">FINANCE</span></p>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Servicios Jiret G&B, C.A. · RIF: J-412309374</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-1.5 text-slate-400 text-[10px] font-mono bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
            <span>{clock}</span>
          </div>
          {loadedMonths.length > 0 && (
            <span className="bg-orange-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg">
              {loadedMonths.length} {loadedMonths.length===1?'MES':'MESES'} EN MEMORIA
            </span>
          )}
          <button onClick={()=>setView('configuracion')} className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg font-black uppercase text-[10px] tracking-widest transition-all border border-slate-200"><Database size={13}/> CONFIG.</button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="text-center mb-8">
          <h2 className="font-black text-2xl text-slate-800 uppercase tracking-[0.25em] mb-2">Panel Principal Financiero</h2>
          <div className="w-14 h-0.5 bg-orange-500 mx-auto rounded-full"/>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {modules.map(m=>(
            <div key={m.id} className={`bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col transition-all duration-200 ${m.disabled?'opacity-50':'hover:shadow-lg hover:-translate-y-0.5'}`}>
              <div className="p-6 flex-1">
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-11 h-11 ${m.iconBg||'bg-slate-800'} rounded-xl flex items-center justify-center shadow-sm`}>{m.icon}</div>
                </div>
                <h3 className="font-black text-[13px] text-slate-900 uppercase tracking-tight mb-1">{m.title}</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-tight">{m.desc}</p>
                <div className="mt-1">{m.preview}</div>
              </div>
              <div className="px-6 pb-5">
                <button
                  onClick={m.disabled ? undefined : m.onClick}
                  disabled={m.disabled}
                  className={`w-full py-2.5 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${m.disabled?'bg-slate-100 text-slate-400 cursor-not-allowed':'bg-orange-500 hover:bg-orange-600 text-white shadow-md hover:shadow-lg'}`}>
                  {m.disabled?'PRÓXIMAMENTE':'IR A MÓDULO →'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
      <footer className="text-center pb-6"><p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Módulo de Reportes Financieros · Jiret G&B Finance V2.0</p></footer>
    </div>
  );
}

export default ReportesFinancierosApp;

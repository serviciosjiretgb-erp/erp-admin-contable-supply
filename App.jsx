// ============================================================================
// FIX: processAuxFile clasificaba TODO lo no reconocido como "cxp_general",
// sin importar si subiste el archivo en el botón de CxC o de CxP.
// Reemplaza estas 3 funciones en tu archivo por las de abajo.
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
          // ANTES: si no había mapInfo, hacía "continue" y perdía la fila.
          // AHORA: cae en el bucket por defecto según el botón usado.
          const bucket = (mapInfo && result[mapInfo.type] !== undefined) ? mapInfo.type : defaultBucket;
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

        // Prioridad 1: cuentaContable exacta
        if (mapInfoFromCuenta && result[mapInfoFromCuenta.type] !== undefined) {
          result[mapInfoFromCuenta.type].push(record);
        }
        // Prioridad 2: keywords específicas
        else if (nombre.includes('ZULIANA DE EMPAQUE')) result.cxc_zuliana.push({...record, monto: Math.abs(monto)});
        else if (nombre.includes('AUTO TOTAL') || nombre.includes('AUTOTOTAL') || nombre.includes('VEHICULO') || nombre.includes('VEHÍCULO')) result.cxp_autototal.push(record);
        else if (nombre.includes('SURE PACK') || nombre.includes('SUREPACK')) result.cxp_surepack.push(record);
        else if (nombre.includes('PACOMELA') || nombre.includes('AGRO INDUSTRIAS LACTEAS')) result.cxp_pacomela.push(record);
        else if (nombre.includes('YANCARLOS') || nombre.includes('PEREZ CASANOVA')) result.cxp_yancarlos.push(record);
        // Prioridad 3 (ANTES: siempre "cxp_general" → AHORA: según el botón usado)
        else result[defaultBucket].push(record);
      }
    }
  }
  return result;
};

const handleUploadCxC = async (e) => {
  if (!e.target.files.length) return;
  try {
    const parsed = await processAuxFile(e.target.files, 'cxc');
    const tot = parsed.cxc_general.length + parsed.cxc_zuliana.length;
    setAuxByMonth(prev => ({
      ...prev,
      [configMes]: { ...getAuxForMonth(configMes), cxc_general: parsed.cxc_general, cxc_zuliana: parsed.cxc_zuliana }
    }));
    alert(`✅ CxC ${configMes}: ${tot} registros`);
  } catch(err){ alert("❌ Error CxC: "+err.message); } e.target.value='';
};

const handleUploadCxP = async (e) => {
  if (!e.target.files.length) return;
  try {
    const parsed = await processAuxFile(e.target.files, 'cxp');
    const tot = parsed.cxp_autototal.length+parsed.cxp_surepack.length+parsed.cxp_pacomela.length+parsed.cxp_yancarlos.length+parsed.cxp_general.length;
    setAuxByMonth(prev => ({
      ...prev,
      [configMes]: { ...getAuxForMonth(configMes), cxp_autototal:parsed.cxp_autototal, cxp_surepack:parsed.cxp_surepack, cxp_pacomela:parsed.cxp_pacomela, cxp_yancarlos:parsed.cxp_yancarlos, cxp_general:parsed.cxp_general }
    }));
    alert(`✅ CxP ${configMes}: ${tot} registros`);
  } catch(err){ alert("❌ Error CxP: "+err.message); } e.target.value='';
};

import React, { useState, useEffect } from 'react';
import { 
  Lock, User, Briefcase, Calculator, LogOut, Users, Settings2, 
  FileText, Activity, Box, Receipt, Truck, Landmark, ArrowRightLeft, 
  Edit, Save, Plus, Trash2, Search, Download, Printer, BarChart3, 
  CheckCircle2, AlertTriangle, X, ShieldCheck, Home, ArrowRight, 
  CheckCircle, Image as ImageIcon, UserPlus, ShoppingCart, DollarSign, Globe, Wallet
} from 'lucide-react';

// ================================================================
// ================= MOCK API & DATABASE ==========================
// ================================================================

const fakeDB = {
  settings: { loginBg: '' },
  usuarios: [
    { id: 'admin', username: 'admin', password: '123', name: 'Administrador Master', role: 'Master', permissions: { ventas: true, compras: true, inventario: true, bancos: true, reportes: true, configuracion: true } }
  ],
  plan_cuentas: [ 
    { id: 1, codigo: '1.0.0.0', nombre: 'ACTIVO', tipo: 'ACTIVO' }, 
    { id: 2, codigo: '1.1.0.0', nombre: 'BANCOS', tipo: 'ACTIVO' },
    { id: 3, codigo: '2.0.0.0', nombre: 'PASIVO', tipo: 'PASIVO' }
  ],
  clientes: [
    { id: 1, rif: 'J-12345678-9', nombre: 'CORPORACIÓN EJEMPLO, C.A.', direccion: 'Av. Las Delicias', telefono: '0241-1234567', diasCredito: 15 },
    { id: 2, rif: 'V-12345678-0', nombre: 'CLIENTE MOSTRADOR CONTADO', direccion: 'N/A', telefono: 'N/A', diasCredito: 0 }
  ],
  productos: [
    { codigo: 'PRD-01', nombre: 'SERVIDOR DELL POWEREDGE T440', costo: 1800.00, precio: 2500.00, stock: 5, exento: false },
    { codigo: 'SRV-01', nombre: 'SERVICIO DE MANTENIMIENTO PREVENTIVO', costo: 0.00, precio: 80.00, stock: 999, exento: true }
  ]
};

const api = {
  login: (username, password) => new Promise((resolve, reject) => {
    setTimeout(() => {
      const user = fakeDB.usuarios.find(u => u.username === username.toLowerCase().trim() && u.password === password);
      if (!user) return reject({ message: 'Credenciales inválidas. Intente nuevamente.' });
      return resolve({ data: user });
    }, 400);
  })
};

// ================================================================
// ================= UTILIDADES GENERALES =========================
// ================================================================

const getTodayDate = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};

const formatNum = (num) => new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num || 0);

const compressImage = (file, callback) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = event => {
    const img = new Image();
    img.src = event.target.result;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const MAX_WIDTH = 1920;
      let width = img.width; let height = img.height;
      if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
      canvas.width = width; canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);
      callback(canvas.toDataURL('image/jpeg', 0.6)); 
    };
  };
};

const exportToCSV = (config, records) => {
  if (!records || records.length === 0) return alert('No hay datos para exportar');
  const headers = config.columns.map(c => c.label).join(',');
  const rows = records.map(r => config.columns.map(c => `"${r[c.key] !== undefined ? r[c.key] : ''}"`).join(','));
  const csv = [headers, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `${config.title}.csv`; link.click();
};

const printDocument = (config, records) => {
  if (!records || records.length === 0) return alert('No hay datos para imprimir');
  const printWindow = window.open('', '', 'width=900,height=650');
  const headers = config.columns.map(c => `<th style="border-bottom:2px solid #000; padding:10px; text-align:left; background:#f3f4f6; font-size:10px; text-transform:uppercase;">${c.label}</th>`).join('');
  const rows = records.map(r => `<tr>${config.columns.map(c => `<td style="border-bottom:1px solid #eee; padding:10px; font-size:11px;">${typeof r[c.key] === 'boolean' ? (r[c.key] ? 'Sí' : 'No') : (r[c.key] || '')}</td>`).join('')}</tr>`).join('');
  printWindow.document.write(`
    <html style="font-family: Arial, sans-serif; color: #111;">
      <head><title>${config.title}</title></head>
      <body style="padding: 40px;">
        <div style="border-bottom: 4px solid #f97316; padding-bottom: 10px; margin-bottom: 20px;">
            <h2 style="font-size: 20px; font-weight: 900; text-transform: uppercase; margin: 0;">${config.title}</h2>
            <p style="font-size: 10px; color: #666; font-weight: bold; margin-top: 4px; text-transform: uppercase;">FECHA DE EMISIÓN: ${getTodayDate()}</p>
        </div>
        <table style="width:100%; border-collapse: collapse;"><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table>
        <script>window.print(); window.onafterprint = function(){ window.close(); }</script>
      </body>
    </html>
  `);
  printWindow.document.close();
};

// ================================================================
// ================= COMPONENTES DE INTERFAZ (UI) =================
// ================================================================

const DialogModal = ({ dialog, setDialog }) => {
  if (!dialog) return null;
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[99999] p-4 transition-all">
      <div className="bg-white p-10 rounded-[2rem] shadow-2xl max-w-sm w-full text-center border-t-8 border-orange-500 transform transition-all">
        <div className="bg-orange-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
          {dialog.type === 'alert' || dialog.type === 'error' ? <AlertTriangle size={40} className="text-orange-500" /> : <CheckCircle size={40} className="text-blue-500" />}
        </div>
        <h3 className="text-xl font-black text-black uppercase mb-3 tracking-widest">{dialog.title}</h3>
        <p className="text-sm font-bold text-gray-500 mb-8">{dialog.text}</p>
        {dialog.type === 'confirm' ? (
          <div className="flex gap-3">
            <button onClick={() => setDialog(null)} className="flex-1 bg-gray-200 text-gray-800 font-black py-4 rounded-xl uppercase text-[10px] tracking-widest hover:bg-gray-300 transition-all">Cancelar</button>
            <button onClick={() => { dialog.onConfirm(); setDialog(null); }} className="flex-1 bg-black text-white font-black py-4 rounded-xl uppercase text-[10px] tracking-widest shadow-lg hover:bg-gray-800 transition-all flex justify-center items-center gap-2"><CheckCircle2 size={16}/> Confirmar</button>
          </div>
        ) : (
          <button onClick={() => setDialog(null)} className="w-full bg-black text-white font-black py-4 rounded-xl uppercase text-[10px] tracking-widest shadow-lg hover:bg-gray-800 transition-all">Aceptar</button>
        )}
      </div>
    </div>
  );
};

// ================================================================
// ================= MÓDULO: BANCOS (PAGO A PROVEEDORES) ==========
// ================================================================

const BancosModule = ({ setDialog }) => {
  const [montoPagoBs, setMontoPagoBs] = useState('');
  const [tasaCambio, setTasaCambio] = useState(36.50);
  const [montoDisponibleUsd, setMontoDisponibleUsd] = useState(0);
  const [bancoId, setBancoId] = useState('0108-provincial');

  const [proveedorSeleccionado, setProveedorSeleccionado] = useState('');
  const [facturasPendientes, setFacturasPendientes] = useState([]);
  const [distribucion, setDistribucion] = useState({}); 
  
  const [totalAplicadoUsd, setTotalAplicadoUsd] = useState(0);
  const [anticipoGenerado, setAnticipoGenerado] = useState(0);

  const dbSimulada = {
    'inveravica_01': [
      { id: 'FAC-0992', fecha: '2026-03-27', concepto: 'Bolsas/Millares', saldo_usd: 150.00, tasa_origen: 36.10 },
      { id: 'FAC-1005', fecha: '2026-04-10', concepto: 'Material Empaque', saldo_usd: 300.00, tasa_origen: 36.35 }
    ]
  };

  useEffect(() => {
    const bs = parseFloat(montoPagoBs) || 0;
    const tasa = parseFloat(tasaCambio) || 1;
    setMontoDisponibleUsd(bs / tasa);
  }, [montoPagoBs, tasaCambio]);

  useEffect(() => {
    if (proveedorSeleccionado) {
      setFacturasPendientes(dbSimulada[proveedorSeleccionado] || []);
      setDistribucion({});
    } else {
      setFacturasPendientes([]);
    }
  }, [proveedorSeleccionado]);

  useEffect(() => {
    const aplicado = Object.values(distribucion).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
    setTotalAplicadoUsd(aplicado);
    const sobrante = montoDisponibleUsd - aplicado;
    setAnticipoGenerado(sobrante > 0 ? sobrante : 0);
  }, [distribucion, montoDisponibleUsd]);

  const handleDistribucionChange = (facturaId, valorAportado, saldoMaximo) => {
    let valorNum = parseFloat(valorAportado);
    if (isNaN(valorNum)) valorNum = 0;
    if (valorNum > saldoMaximo) valorNum = saldoMaximo;
    setDistribucion(prev => ({ ...prev, [facturaId]: valorNum }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const bsParsed = parseFloat(montoPagoBs);
    if (!bsParsed || bsParsed <= 0) {
      return setDialog({title: 'Error', text: 'Debe ingresar un monto válido a debitar en el banco.', type: 'error'});
    }
    if (totalAplicadoUsd > montoDisponibleUsd) {
      return setDialog({title: 'Error de Cuadre', text: 'Estás intentando aplicar más dinero del que salió del banco.', type: 'error'});
    }
    if (totalAplicadoUsd === 0 && anticipoGenerado === 0) {
      return setDialog({title: 'Aviso', text: 'Debe aplicar montos a las facturas o generar un anticipo.', type: 'alert'});
    }

    setDialog({
      title: 'Pago Procesado', 
      text: `Valores inmutables bloqueados a Bs. ${tasaCambio}. Se aplicaron $${totalAplicadoUsd.toFixed(2)} a facturas y $${anticipoGenerado.toFixed(2)} de anticipo.`, 
      type: 'success'
    });
    
    setMontoPagoBs(''); setProveedorSeleccionado(''); setDistribucion({});
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden h-full flex flex-col animate-in fade-in duration-300">
      <div className="px-8 py-6 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-black text-black uppercase flex items-center gap-3 tracking-tighter">
            <Landmark className="text-orange-500" size={24}/> Emisión de Pagos (CxP)
          </h2>
          <p className="text-[10px] font-bold text-gray-500 mt-1 uppercase tracking-widest">Contabilidad Inmutable (Costo Histórico)</p>
        </div>
        <button onClick={handleSubmit} disabled={totalAplicadoUsd > montoDisponibleUsd || montoDisponibleUsd <= 0} className="bg-black text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase shadow-md hover:bg-gray-800 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
          <Save size={14}/> Bloquear Tasa y Contabilizar
        </button>
      </div>

      <div className="flex-grow overflow-y-auto bg-white p-8">
        <form className="max-w-5xl mx-auto space-y-8">
          
          <div className="bg-blue-50 p-8 rounded-[2rem] border border-blue-100 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-blue-600 text-white text-[9px] font-black uppercase px-4 py-1 tracking-widest rounded-bl-xl">Registro Protegido</div>
            <h3 className="text-xs font-black uppercase text-blue-900 border-b border-blue-200 pb-3 mb-6 tracking-widest flex items-center gap-2">
              <span className="bg-blue-200 text-blue-900 w-5 h-5 rounded-full inline-flex items-center justify-center text-[10px]">1</span>
              Origen de Fondos (Movimiento Bancario)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="md:col-span-2">
                <label className="text-[10px] font-black text-gray-500 uppercase block mb-2 tracking-widest">Banco Emisor</label>
                <select value={bancoId} onChange={(e) => setBancoId(e.target.value)} className="w-full bg-white border-2 border-transparent shadow-sm rounded-2xl p-4 font-black text-xs outline-none focus:border-blue-500 transition-all uppercase text-black">
                  <option value="0108-provincial">0108 - Banco Provincial (Bs)</option>
                  <option value="0134-banesco">0134 - Banesco (Bs)</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-500 uppercase block mb-2 tracking-widest">Monto Debitado (Bs)</label>
                <input type="number" step="0.01" required value={montoPagoBs} onChange={(e) => setMontoPagoBs(e.target.value)} className="w-full bg-white border-2 border-transparent shadow-sm rounded-2xl p-4 font-black text-sm text-center outline-none focus:border-blue-500 transition-all text-black" placeholder="Ej. 16500.00" />
              </div>
              <div>
                <label className="text-[10px] font-black text-blue-700 uppercase block mb-2 tracking-widest flex items-center gap-1"><Lock size={10}/> Tasa Bloqueada</label>
                <input type="number" step="0.01" required value={tasaCambio} onChange={(e) => setTasaCambio(e.target.value)} className="w-full bg-blue-100 border-2 border-transparent shadow-sm rounded-2xl p-4 font-black text-sm text-center outline-none focus:border-blue-500 transition-all text-blue-800" />
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <div className="bg-white px-6 py-4 rounded-2xl shadow-sm border border-green-200 flex items-center gap-4">
                <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Dólares Inmutables Disponibles:</span>
                <span className="text-2xl font-black text-green-600">${montoDisponibleUsd.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-8 rounded-[2rem] border border-gray-100 shadow-sm">
            <h3 className="text-xs font-black uppercase text-gray-700 border-b border-gray-200 pb-3 mb-6 tracking-widest flex items-center gap-2">
              <span className="bg-gray-200 text-gray-800 w-5 h-5 rounded-full inline-flex items-center justify-center text-[10px]">2</span>
              Aplicación a Facturas (Destino)
            </h3>
            <div className="mb-6 md:w-1/2">
              <label className="text-[10px] font-black text-gray-500 uppercase block mb-2 tracking-widest">Seleccionar Proveedor</label>
              <select value={proveedorSeleccionado} onChange={(e) => setProveedorSeleccionado(e.target.value)} className="w-full bg-white border-2 border-transparent shadow-sm rounded-2xl p-4 font-black text-xs outline-none focus:border-orange-500 transition-all uppercase text-black">
                <option value="">-- SELECCIONE UN PROVEEDOR --</option>
                <option value="inveravica_01">Inveravica</option>
                <option value="proveedor_02">Suministros Industriales</option>
              </select>
            </div>

            {facturasPendientes.length > 0 ? (
              <div className="border border-gray-200 rounded-[1.5rem] overflow-hidden bg-white mb-6">
                <table className="w-full text-left whitespace-nowrap text-sm">
                  <thead className="bg-gray-100 border-b-2 border-gray-200">
                    <tr className="uppercase font-black text-[10px] text-gray-500 tracking-widest">
                      <th className="py-4 px-4 text-center">Doc. / Factura</th>
                      <th className="py-4 px-4 text-center">Tasa Origen</th>
                      <th className="py-4 px-4 text-right">Saldo Pendiente</th>
                      <th className="py-4 px-4 text-center w-48">Monto a Aplicar ($)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-black">
                    {facturasPendientes.map(fac => (
                      <tr key={fac.id} className="hover:bg-orange-50 transition-colors">
                        <td className="py-3 px-4 font-black text-orange-600 text-xs text-center">{fac.id}<br/><span className="text-[9px] text-gray-400 uppercase tracking-widest">{fac.concepto}</span></td>
                        <td className="py-3 px-4 font-bold text-xs text-center text-gray-500">Bs. {fac.tasa_origen}</td>
                        <td className="py-3 px-4 font-black text-red-600 text-right">${fac.saldo_usd.toFixed(2)}</td>
                        <td className="py-3 px-4 text-center">
                          <input type="number" step="0.01" max={fac.saldo_usd} value={distribucion[fac.id] === 0 ? '' : (distribucion[fac.id] || '')} onChange={(e) => handleDistribucionChange(fac.id, e.target.value, fac.saldo_usd)} className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl p-2 font-black text-sm text-center outline-none focus:bg-white focus:border-blue-500 text-blue-600 transition-all" placeholder="0.00" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              proveedorSeleccionado && <div className="text-center py-8 text-gray-400 font-bold text-xs uppercase tracking-widest border-2 border-dashed border-gray-200 rounded-2xl mb-6">No hay facturas pendientes para este proveedor</div>
            )}

            {proveedorSeleccionado && (
              <div className="bg-gray-900 text-white rounded-[2rem] p-6 shadow-xl flex flex-col md:flex-row justify-between items-center">
                <div className="flex items-center gap-3 mb-4 md:mb-0">
                  <Activity className="text-gray-400" size={24}/>
                  <div>
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Resumen de Operación</h4>
                    <p className="text-xs font-bold text-gray-500">Distribución de los fondos aplicados</p>
                  </div>
                </div>
                <div className="flex gap-8 text-right">
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Aplicado a Facturas</p>
                    <p className="text-2xl font-black">${totalAplicadoUsd.toFixed(2)}</p>
                  </div>
                  <div className="border-l-2 border-gray-700 pl-8">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Anticipo Generado</p>
                    <p className={`text-2xl font-black ${anticipoGenerado > 0 ? 'text-green-500' : 'text-gray-400'}`}>${anticipoGenerado.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {totalAplicadoUsd > montoDisponibleUsd && (
            <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-2xl flex items-center gap-3 animate-in fade-in">
              <AlertTriangle size={24}/>
              <div>
                <p className="text-xs font-black uppercase tracking-widest">Error de Cuadre</p>
                <p className="text-xs font-bold">Has aplicado ${totalAplicadoUsd.toFixed(2)} pero el banco solo dispone de ${montoDisponibleUsd.toFixed(2)}.</p>
              </div>
            </div>
          )}

        </form>
      </div>
    </div>
  );
};

// ================================================================
// ================= MÓDULO DE FACTURACIÓN ========================
// ================================================================

const FacturacionModule = ({ setDialog }) => {
  const [factura, setFactura] = useState({
    nro: `FAC-${Math.floor(Math.random()*90000)+10000}`,
    fecha: getTodayDate(),
    moneda: 'USD',
    tasa: 1.00,
    diasCredito: 0,
    notas: ''
  });

  const [cliente, setCliente] = useState(null);
  const [items, setItems] = useState([]);
  
  const [itemForm, setItemForm] = useState({
    productoId: '', nombre: '', costoRef: 0, cantidad: 1, precio: 0, impuesto: '16'
  });

  const subtotalExento = items.filter(i => i.impuesto === 'E').reduce((acc, i) => acc + i.subtotal, 0);
  const subtotalGravado = items.filter(i => i.impuesto === '16').reduce((acc, i) => acc + i.subtotal, 0);
  const montoIva = items.reduce((acc, i) => acc + i.montoIva, 0);
  const totalGeneral = subtotalExento + subtotalGravado + montoIva;

  const handleClientChange = (e) => {
    const selected = fakeDB.clientes.find(c => c.rif === e.target.value);
    if (selected) {
      setCliente(selected);
      setFactura({ ...factura, diasCredito: selected.diasCredito });
    } else {
      setCliente(null);
      setFactura({ ...factura, diasCredito: 0 });
    }
  };

  const handleProductSelect = (e) => {
    const prod = fakeDB.productos.find(p => p.codigo === e.target.value);
    if (prod) {
      setItemForm({
        ...itemForm, productoId: prod.codigo, nombre: prod.nombre, costoRef: prod.costo, precio: prod.precio, cantidad: 1, impuesto: prod.exento ? 'E' : '16'
      });
    } else {
      setItemForm({ ...itemForm, productoId: '', nombre: '', costoRef: 0, precio: 0, cantidad: 1 });
    }
  };

  const handleAddItem = () => {
    if (!itemForm.productoId || itemForm.cantidad <= 0 || itemForm.precio < 0) {
      return setDialog({title: 'Aviso', text: 'Verifique que seleccionó un producto y la cantidad/precio sean válidos.', type: 'alert'});
    }
    const qty = parseFloat(itemForm.cantidad);
    const price = parseFloat(itemForm.precio);
    const subtotal = qty * price;
    const isGravado = itemForm.impuesto === '16';
    const ivaItem = isGravado ? (subtotal * 0.16) : 0;

    const newItem = { ...itemForm, cantidad: qty, precio: price, subtotal: subtotal, montoIva: ivaItem, total: subtotal + ivaItem };
    setItems([...items, newItem]);
    setItemForm({ productoId: '', nombre: '', costoRef: 0, cantidad: 1, precio: 0, impuesto: '16' });
  };

  const handleRemoveItem = (index) => setItems(items.filter((_, i) => i !== index));

  const handleSaveInvoice = () => {
    if (!cliente) return setDialog({title: 'Aviso', text: 'Debe seleccionar un cliente.', type: 'alert'});
    if (items.length === 0) return setDialog({title: 'Aviso', text: 'Debe agregar al menos un producto a la factura.', type: 'alert'});
    setDialog({title: 'Factura Emitida', text: `La factura ${factura.nro} ha sido registrada con éxito.`, type: 'success'});
    setItems([]); setCliente(null); setFactura({ ...factura, nro: `FAC-${Math.floor(Math.random()*90000)+10000}`, notas: ''});
  };

  const handlePrintStructural = () => {
    if (!cliente || items.length === 0) return setDialog({title: 'Aviso', text: 'Complete la factura para imprimir.', type: 'alert'});
    const printWindow = window.open('', '', 'width=900,height=700');
    const tableRows = items.map(i => `
      <tr>
        <td style="border:1px solid #ccc; padding:8px; font-size:11px; text-align:center;">${i.productoId}</td>
        <td style="border:1px solid #ccc; padding:8px; font-size:11px;">${i.nombre}</td>
        <td style="border:1px solid #ccc; padding:8px; font-size:11px; text-align:center;">${i.cantidad}</td>
        <td style="border:1px solid #ccc; padding:8px; font-size:11px; text-align:right;">${formatNum(i.precio)}</td>
        <td style="border:1px solid #ccc; padding:8px; font-size:11px; text-align:center;">${i.impuesto === '16' ? '16%' : 'E'}</td>
        <td style="border:1px solid #ccc; padding:8px; font-size:11px; text-align:right;">${formatNum(i.total)}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <html style="font-family: Arial, sans-serif; color: #111;">
        <head><title>Factura ${factura.nro}</title></head>
        <body style="padding: 40px; max-width: 800px; margin: 0 auto;">
          <div style="display: flex; justify-content: space-between; border-bottom: 4px solid #f97316; padding-bottom: 20px; margin-bottom: 20px;">
              <div>
                  <h1 style="font-size: 28px; font-weight: 900; margin: 0;">MI EMPRESA ERP, C.A.</h1>
                  <p style="font-size: 11px; color: #666; margin: 4px 0 0 0;">RIF: J-12345678-9 | Telf: 0212-5555555</p>
                  <p style="font-size: 11px; color: #666; margin: 2px 0 0 0;">Av. Principal, Edificio Empresarial.</p>
              </div>
              <div style="text-align: right;">
                  <h2 style="font-size: 22px; font-weight: 900; margin: 0; color: #f97316;">FACTURA</h2>
                  <p style="font-size: 16px; font-weight: bold; margin: 4px 0 0 0;">NRO: ${factura.nro}</p>
                  <p style="font-size: 11px; margin: 4px 0 0 0;">FECHA: ${factura.fecha}</p>
              </div>
          </div>
          <div style="background: #f9fafb; padding: 15px; border-radius: 8px; border: 1px solid #e5e7eb; margin-bottom: 20px; font-size: 12px;">
              <table style="width: 100%;">
                  <tr>
                      <td style="width: 15%; font-weight: bold; padding-bottom: 6px;">CLIENTE:</td>
                      <td style="width: 50%; padding-bottom: 6px;">${cliente.nombre}</td>
                      <td style="width: 15%; font-weight: bold; padding-bottom: 6px;">CONDICIÓN:</td>
                      <td style="padding-bottom: 6px;">${factura.diasCredito > 0 ? `CRÉDITO (${factura.diasCredito} DÍAS)` : 'CONTADO'}</td>
                  </tr>
                  <tr>
                      <td style="font-weight: bold; padding-bottom: 6px;">RIF/C.I.:</td>
                      <td style="padding-bottom: 6px;">${cliente.rif}</td>
                      <td style="font-weight: bold; padding-bottom: 6px;">MONEDA:</td>
                      <td style="padding-bottom: 6px;">${factura.moneda} (Tasa: ${factura.tasa})</td>
                  </tr>
                  <tr>
                      <td style="font-weight: bold;">DIRECCIÓN:</td>
                      <td colspan="3">${cliente.direccion} | Telf: ${cliente.telefono}</td>
                  </tr>
              </table>
          </div>
          <table style="width:100%; border-collapse: collapse; margin-bottom: 20px;">
            <thead>
              <tr>
                <th style="border-bottom:2px solid #000; padding:10px; background:#f3f4f6; font-size:10px; text-transform:uppercase; text-align:center;">CÓDIGO</th>
                <th style="border-bottom:2px solid #000; padding:10px; background:#f3f4f6; font-size:10px; text-transform:uppercase; text-align:left;">DESCRIPCIÓN DEL PRODUCTO/SERVICIO</th>
                <th style="border-bottom:2px solid #000; padding:10px; background:#f3f4f6; font-size:10px; text-transform:uppercase; text-align:center;">CANT.</th>
                <th style="border-bottom:2px solid #000; padding:10px; background:#f3f4f6; font-size:10px; text-transform:uppercase; text-align:right;">PRECIO U.</th>
                <th style="border-bottom:2px solid #000; padding:10px; background:#f3f4f6; font-size:10px; text-transform:uppercase; text-align:center;">IMP.</th>
                <th style="border-bottom:2px solid #000; padding:10px; background:#f3f4f6; font-size:10px; text-transform:uppercase; text-align:right;">TOTAL</th>
              </tr>
            </thead>
            <tbody>${tableRows}</tbody>
          </table>
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
              <div style="width: 50%; font-size: 11px; color: #666;">
                  <p style="font-weight: bold; margin-bottom: 4px;">NOTAS / OBSERVACIONES:</p>
                  <p style="border: 1px solid #ccc; padding: 10px; border-radius: 4px; min-height: 50px;">${factura.notas || 'Sin observaciones.'}</p>
              </div>
              <div style="width: 40%;">
                  <table style="width: 100%; font-size: 12px; border-collapse: collapse;">
                      <tr><td style="padding: 6px; border-bottom: 1px solid #eee;">SUBTOTAL EXENTO:</td><td style="padding: 6px; border-bottom: 1px solid #eee; text-align: right;">${formatNum(subtotalExento)}</td></tr>
                      <tr><td style="padding: 6px; border-bottom: 1px solid #eee;">SUBTOTAL GRAVADO:</td><td style="padding: 6px; border-bottom: 1px solid #eee; text-align: right;">${formatNum(subtotalGravado)}</td></tr>
                      <tr><td style="padding: 6px; border-bottom: 1px solid #eee;">I.V.A. (16%):</td><td style="padding: 6px; border-bottom: 1px solid #eee; text-align: right;">${formatNum(montoIva)}</td></tr>
                      <tr><td style="padding: 10px 6px; font-size: 16px; font-weight: 900;">TOTAL A PAGAR:</td><td style="padding: 10px 6px; font-size: 16px; font-weight: 900; text-align: right;">${formatNum(totalGeneral)} ${factura.moneda}</td></tr>
                  </table>
              </div>
          </div>
          <p style="text-align: center; font-size: 10px; margin-top: 50px; color: #666; border-top: 1px solid #ccc; padding-top: 10px;">Documento generado por Sistema ERP Premium - Válido para efectos contables.</p>
          <script>window.print(); window.onafterprint = function(){ window.close(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden h-full flex flex-col animate-in fade-in duration-300">
      <div className="px-8 py-6 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-black text-black uppercase flex items-center gap-3 tracking-tighter">
            <Receipt className="text-orange-500" size={24}/> Emisión de Facturas
          </h2>
          <p className="text-[10px] font-bold text-gray-500 mt-1 uppercase tracking-widest">Facturación integrada con Inventario</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handlePrintStructural} className="bg-white border-2 border-gray-100 text-gray-700 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase shadow-sm hover:bg-gray-50 transition-colors flex items-center gap-2">
            <Printer size={14}/> REPORTE ESTRUCTURAL PDF
          </button>
          <button onClick={handleSaveInvoice} className="bg-black text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase shadow-md hover:bg-gray-800 transition-all flex items-center gap-2">
            <Save size={14}/> GUARDAR FACTURA
          </button>
        </div>
      </div>

      <div className="flex-grow overflow-y-auto bg-white p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-gray-50 p-6 rounded-[2rem] border border-gray-100 shadow-sm">
              <h3 className="text-xs font-black uppercase text-gray-700 border-b border-gray-200 pb-3 mb-4 tracking-widest flex items-center gap-2"><User size={16} className="text-orange-500"/> Datos del Cliente</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase block mb-1">Seleccionar Cliente</label>
                  <select onChange={handleClientChange} className="w-full bg-white border-2 border-transparent shadow-sm rounded-xl p-3 font-black text-xs outline-none focus:border-orange-500 transition-all uppercase text-black">
                    <option value="">-- SELECCIONE UN CLIENTE --</option>
                    {fakeDB.clientes.map(c => <option key={c.id} value={c.rif}>{c.rif} - {c.nombre}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-500 uppercase block mb-1">R.I.F. / Documento</label>
                  <input type="text" readOnly value={cliente ? cliente.rif : ''} className="w-full bg-gray-200 border-2 border-transparent rounded-xl p-3 font-bold text-xs uppercase text-gray-600 outline-none" placeholder="Automático" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-500 uppercase block mb-1">Días de Crédito</label>
                  <div className="flex gap-2">
                    <input type="number" value={factura.diasCredito} onChange={e=>setFactura({...factura, diasCredito: parseInt(e.target.value)||0})} className="w-full bg-white border-2 border-gray-200 rounded-xl p-3 font-black text-xs text-center outline-none focus:border-orange-500 transition-all" />
                    <span className="flex items-center text-xs font-bold text-gray-400 bg-gray-100 px-3 rounded-xl">DÍAS</span>
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase block mb-1">Dirección Fiscal</label>
                  <input type="text" readOnly value={cliente ? cliente.direccion : ''} className="w-full bg-gray-200 border-2 border-transparent rounded-xl p-3 font-bold text-xs uppercase text-gray-600 outline-none" placeholder="Automático" />
                </div>
              </div>
            </div>

            <div className="bg-orange-50 p-6 rounded-[2rem] border border-orange-100 shadow-sm">
              <h3 className="text-xs font-black uppercase text-orange-800 border-b border-orange-200 pb-3 mb-4 tracking-widest flex items-center gap-2"><FileText size={16} className="text-orange-600"/> Parámetros Doc.</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-orange-700 uppercase block mb-1">Nro Factura</label>
                  <input type="text" value={factura.nro} onChange={e=>setFactura({...factura, nro: e.target.value.toUpperCase()})} className="w-full bg-white border-2 border-orange-200 rounded-xl p-3 font-black text-sm outline-none focus:border-orange-500 text-orange-600 text-center uppercase" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-orange-700 uppercase block mb-1">Fecha</label>
                    <input type="date" value={factura.fecha} onChange={e=>setFactura({...factura, fecha: e.target.value})} className="w-full bg-white border-2 border-orange-200 rounded-xl p-3 font-bold text-xs outline-none focus:border-orange-500 text-black text-center" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-orange-700 uppercase block mb-1">Moneda</label>
                    <select value={factura.moneda} onChange={e=>setFactura({...factura, moneda: e.target.value})} className="w-full bg-white border-2 border-orange-200 rounded-xl p-3 font-black text-xs outline-none focus:border-orange-500 text-black text-center">
                      <option value="VES">VES</option><option value="USD">USD</option><option value="EUR">EUR</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-orange-700 uppercase block mb-1">Tasa de Cambio</label>
                  <input type="number" step="0.01" value={factura.tasa} onChange={e=>setFactura({...factura, tasa: parseFloat(e.target.value)||1})} className="w-full bg-white border-2 border-orange-200 rounded-xl p-3 font-bold text-xs outline-none focus:border-orange-500 text-black text-center" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-[2rem] border border-gray-200 shadow-sm">
            <h3 className="text-xs font-black uppercase text-gray-700 border-b border-gray-100 pb-3 mb-4 tracking-widest flex items-center gap-2"><ShoppingCart size={16} className="text-blue-500"/> Agregar Renglón desde Inventario</h3>
            
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex-1 min-w-[250px]">
                <label className="text-[10px] font-black text-gray-500 uppercase block mb-1">Producto / Servicio</label>
                <select value={itemForm.productoId} onChange={handleProductSelect} className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl p-3 font-black text-xs outline-none focus:bg-white focus:border-blue-500 transition-all text-black uppercase">
                  <option value="">-- SELECCIONE DEL CATÁLOGO --</option>
                  {fakeDB.productos.map(p => (
                    <option key={p.codigo} value={p.codigo}>
                      {p.codigo} - {p.nombre} (Stock: {p.stock})
                    </option>
                  ))}
                </select>
                {itemForm.productoId && <span className="text-[9px] font-bold text-gray-400 mt-1 block">Costo Ref. Sistema: ${formatNum(itemForm.costoRef)}</span>}
              </div>
              <div className="w-24">
                <label className="text-[10px] font-black text-gray-500 uppercase block mb-1">Cant.</label>
                <input type="number" min="1" step="0.01" value={itemForm.cantidad} onChange={e=>setItemForm({...itemForm, cantidad: e.target.value})} className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl p-3 font-black text-sm text-center outline-none focus:bg-white focus:border-blue-500 text-black" />
              </div>
              <div className="w-32">
                <label className="text-[10px] font-black text-gray-500 uppercase block mb-1">Precio Venta</label>
                <input type="number" min="0" step="0.01" value={itemForm.precio} onChange={e=>setItemForm({...itemForm, precio: e.target.value})} className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl p-3 font-black text-sm text-right outline-none focus:bg-white focus:border-blue-500 text-blue-600" />
              </div>
              <div className="w-32">
                <label className="text-[10px] font-black text-gray-500 uppercase block mb-1">Impuesto</label>
                <select value={itemForm.impuesto} onChange={e=>setItemForm({...itemForm, impuesto: e.target.value})} className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl p-3 font-black text-xs text-center outline-none focus:bg-white focus:border-blue-500 text-black">
                  <option value="16">Gravado 16%</option>
                  <option value="E">Exento (E)</option>
                </select>
              </div>
              <button type="button" onClick={handleAddItem} className="bg-blue-600 text-white px-6 py-3.5 rounded-xl font-black text-[10px] uppercase shadow-md hover:bg-blue-700 transition-all flex items-center gap-2">
                <Plus size={16}/> Agregar
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3 border border-gray-200 rounded-[2rem] overflow-hidden">
              <table className="w-full text-left whitespace-nowrap text-sm">
                <thead className="bg-gray-100 border-b-2 border-gray-200">
                  <tr className="uppercase font-black text-[10px] text-gray-500 tracking-widest">
                    <th className="py-4 px-4 text-center">Código</th>
                    <th className="py-4 px-4 w-full">Descripción</th>
                    <th className="py-4 px-4 text-center">Cant.</th>
                    <th className="py-4 px-4 text-right">Precio U.</th>
                    <th className="py-4 px-4 text-center">Imp.</th>
                    <th className="py-4 px-4 text-right">Total</th>
                    <th className="py-4 px-4 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-black bg-white">
                  {items.map((it, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 font-black text-orange-600 text-xs text-center">{it.productoId}</td>
                      <td className="py-3 px-4 font-bold text-xs uppercase">{it.nombre}</td>
                      <td className="py-3 px-4 font-black text-center">{it.cantidad}</td>
                      <td className="py-3 px-4 font-bold text-gray-600 text-right">{formatNum(it.precio)}</td>
                      <td className="py-3 px-4 font-black text-gray-400 text-center">{it.impuesto === '16' ? '16%' : 'E'}</td>
                      <td className="py-3 px-4 font-black text-blue-600 text-right">{formatNum(it.total)}</td>
                      <td className="py-3 px-4 text-center">
                        <button onClick={() => handleRemoveItem(idx)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"><X size={16}/></button>
                      </td>
                    </tr>
                  ))}
                  {items.length === 0 && <tr><td colSpan="7" className="text-center py-16 text-gray-400 font-bold text-xs uppercase tracking-widest">Sin renglones agregados</td></tr>}
                </tbody>
              </table>
            </div>

            <div className="bg-gray-900 text-white rounded-[2rem] p-6 shadow-xl flex flex-col justify-between">
              <div>
                <h3 className="text-[10px] font-black uppercase text-gray-400 border-b border-gray-700 pb-3 mb-4 tracking-widest flex items-center gap-2"><Calculator size={14}/> Resumen Financiero</h3>
                <div className="space-y-3 font-mono text-sm">
                  <div className="flex justify-between items-center text-gray-300"><span>Sub-Total Exento:</span> <span className="font-bold">{formatNum(subtotalExento)}</span></div>
                  <div className="flex justify-between items-center text-gray-300"><span>Sub-Total Gravado:</span> <span className="font-bold">{formatNum(subtotalGravado)}</span></div>
                  <div className="flex justify-between items-center text-gray-300"><span>I.V.A. (16%):</span> <span className="font-bold">{formatNum(montoIva)}</span></div>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t-2 border-gray-700">
                <span className="text-[10px] font-black uppercase text-orange-500 tracking-widest block mb-1">TOTAL A PAGAR ({factura.moneda})</span>
                <div className="text-4xl font-black text-white text-right">{formatNum(totalGeneral)}</div>
                {factura.tasa > 1 && factura.moneda === 'USD' && (
                  <div className="text-right text-xs font-bold text-gray-400 mt-1">Ref VES: {formatNum(totalGeneral * factura.tasa)}</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ================================================================
// ================= MÓDULOS DE SUB-DASHBOARD =====================
// ================================================================

const SubDashboard = ({ moduleType, setActiveTab }) => {
  const isAdmin = moduleType === 'admin';
  
  const adminCards = [
    { id: 'fact_emision', title: 'Facturación', desc: 'Emisión, CxC y Retenciones', icon: Receipt, colorTheme: { text: 'text-orange-500', bg: 'bg-orange-50', hover: 'hover:border-orange-500' } },
    { id: 'comp_registro', title: 'Compras', desc: 'Registro, CxP y Retenciones', icon: Truck, colorTheme: { text: 'text-orange-500', bg: 'bg-orange-50', hover: 'hover:border-orange-500' } },
    { id: 'inv_catalogo', title: 'Inventario', desc: 'Catálogo de productos y stock', icon: Box, colorTheme: { text: 'text-orange-500', bg: 'bg-orange-50', hover: 'hover:border-orange-500' } },
    { id: 'ban_pagos', title: 'Bancos', desc: 'Pago a Proveedores y Costos Históricos', icon: Landmark, colorTheme: { text: 'text-orange-500', bg: 'bg-orange-50', hover: 'hover:border-orange-500' } },
    { id: 'nom_gestion', title: 'Nómina', desc: 'Gestión de pagos y empleados', icon: Wallet, colorTheme: { text: 'text-orange-500', bg: 'bg-orange-50', hover: 'hover:border-orange-500' } },
    { id: 'imp_costos', title: 'Importaciones', desc: 'Costos y liquidación', icon: Globe, colorTheme: { text: 'text-orange-500', bg: 'bg-orange-50', hover: 'hover:border-orange-500' } },
    { id: 'rep_libro_ventas', title: 'Reportes', desc: 'Impuestos, IGTF e ISLR', icon: BarChart3, colorTheme: { text: 'text-orange-500', bg: 'bg-orange-50', hover: 'hover:border-orange-500' } },
    { id: 'configuracion', title: 'Configuración', desc: 'Ajustes, usuarios y permisos', icon: Settings2, colorTheme: { text: 'text-gray-600', bg: 'bg-gray-100', hover: 'hover:border-gray-600' } },
  ];

  const accCards = [
    { id: 'rep_balance', title: 'Estados Financieros', desc: 'Balance general y comprobación', icon: BarChart3, colorTheme: { text: 'text-blue-600', bg: 'bg-blue-50', hover: 'hover:border-blue-600' } },
    { id: 'rep_mayor', title: 'Mayores Analíticos', desc: 'Libro mayor y movimientos', icon: FileText, colorTheme: { text: 'text-blue-600', bg: 'bg-blue-50', hover: 'hover:border-blue-600' } },
    { id: 'cnt_diario', title: 'Comprobantes Diarios', desc: 'Registro de asientos y diario', icon: Edit, colorTheme: { text: 'text-blue-600', bg: 'bg-blue-50', hover: 'hover:border-blue-600' } },
    { id: 'cnt_empresas', title: 'Configuración', desc: 'Empresas y plan de cuentas', icon: Settings2, colorTheme: { text: 'text-gray-600', bg: 'bg-gray-100', hover: 'hover:border-gray-600' } },
  ];

  const cards = isAdmin ? adminCards : accCards;

  return (
    <div className="h-full flex flex-col items-center justify-center p-2 animate-in fade-in zoom-in-95 duration-500">
       <div className="text-center mb-8">
         <h2 className={`text-2xl font-black uppercase tracking-widest ${isAdmin ? 'text-orange-600' : 'text-blue-600'}`}>
           Panel de {isAdmin ? 'Administración' : 'Contabilidad'}
         </h2>
         <div className={`w-16 h-1 mx-auto mt-3 rounded-full ${isAdmin ? 'bg-orange-500' : 'bg-blue-600'}`}></div>
         <p className="text-gray-500 mt-3 text-[10px] font-bold uppercase tracking-widest">
           Seleccione el submódulo a gestionar
         </p>
       </div>
       <div className={`grid grid-cols-2 md:grid-cols-3 ${isAdmin ? 'lg:grid-cols-4' : 'lg:grid-cols-4'} gap-4 lg:gap-6 w-full max-w-6xl`}>
          {cards.map((c, i) => {
             const IconComponent = c.icon;
             return (
               <button key={i} onClick={() => setActiveTab(c.id)} className={`bg-white p-6 rounded-[1.5rem] shadow-sm hover:shadow-lg transition-all border-b-4 border-transparent ${c.colorTheme.hover} group flex flex-col items-center text-center`}>
                  <div className={`${c.colorTheme.bg} w-16 h-16 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                     <IconComponent className={`h-8 w-8 ${c.colorTheme.text}`} />
                  </div>
                  <h3 className="text-sm font-black text-black uppercase tracking-widest mb-1">{c.title}</h3>
                  <p className="text-[9px] text-gray-500 font-bold uppercase leading-tight px-2">{c.desc}</p>
               </button>
             );
          })}
       </div>
    </div>
  );
};

// ================================================================
// ================= MÓDULO CRUD GENÉRICO (DISEÑO PREMIUM) ========
// ================================================================

const GenericCrudModule = ({ config, setDialog }) => {
  const [view, setView] = useState('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({});
  const [records, setRecords] = useState(config.initialData || []);

  const idKey = config.formFields[0].key; 
  const searchKey1 = config.columns[0].key;

  const handleNew = () => {
    const initialForm = {};
    config.formFields.forEach(f => initialForm[f.key] = f.type === 'checkbox' ? (f.defaultValue ?? true) : '');
    setFormData(initialForm); setView('form');
  };

  const handleSave = () => {
    if (!formData[idKey]) return setDialog({title: 'Aviso', text: `El campo ${config.formFields[0].label} es obligatorio.`, type: 'alert'});
    const exists = records.find(r => r[idKey] === formData[idKey]);
    if (exists) setRecords(records.map(r => r[idKey] === formData[idKey] ? formData : r));
    else setRecords([...records, formData]);
    setDialog({title: 'Éxito', text: 'Registro guardado correctamente.', type: 'success'});
    setView('list');
  };

  const handleDelete = (id) => {
    setDialog({
      title: 'Eliminar Registro', text: '¿Está seguro de eliminar este registro permanentemente?', type: 'confirm',
      onConfirm: () => { setRecords(records.filter(r => r[idKey] !== id)); setView('list'); }
    });
  };

  const filteredRecords = records.filter(r => String(r[searchKey1] || '').toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden h-full flex flex-col animate-in fade-in duration-300">
      <div className="px-8 py-6 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-black text-black uppercase flex items-center gap-3 tracking-tighter">
            <FileText className="text-orange-500" size={24}/> {config.title}
          </h2>
          <p className="text-[10px] font-bold text-gray-500 mt-1 uppercase tracking-widest">{view === 'list' ? 'Listado General' : 'Formulario de Registro'}</p>
        </div>
        <div className="flex gap-2">
          {view === 'list' ? (
            <>
              <button onClick={() => exportToCSV(config, filteredRecords)} className="bg-white border-2 border-gray-100 text-gray-700 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase shadow-sm hover:bg-gray-50 transition-colors flex items-center gap-2"><Download size={14}/> EXCEL</button>
              <button onClick={() => printDocument(config, filteredRecords)} className="bg-white border-2 border-gray-100 text-gray-700 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase shadow-sm hover:bg-gray-50 transition-colors flex items-center gap-2"><Printer size={14}/> PDF</button>
              <button onClick={handleNew} className="bg-black text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase shadow-md hover:bg-gray-800 transition-all flex items-center gap-2"><Plus size={14}/> NUEVO REGISTRO</button>
            </>
          ) : (
            <>
              <button onClick={() => setView('list')} className="bg-gray-200 text-gray-700 px-6 py-3 rounded-2xl text-[10px] font-black uppercase hover:bg-gray-300 transition-all flex items-center gap-2"><X size={14}/> CANCELAR</button>
              <button onClick={() => handleDelete(formData[idKey])} className="bg-red-100 text-red-600 px-4 py-3 rounded-2xl text-[10px] font-black uppercase hover:bg-red-200 transition-all"><Trash2 size={14}/></button>
              <button onClick={handleSave} className="bg-orange-500 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase shadow-lg hover:bg-orange-600 transition-all flex items-center gap-2"><Save size={14}/> GUARDAR DATOS</button>
            </>
          )}
        </div>
      </div>

      {view === 'list' ? (
        <div className="flex-grow flex flex-col p-8 bg-white">
          <div className="relative max-w-2xl mb-8">
            <Search className="absolute left-4 top-4 text-gray-400" size={18} />
            <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Buscar registros..." className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-xs font-black uppercase outline-none focus:bg-white focus:border-orange-200 text-black transition-all" />
          </div>
          <div className="flex-grow overflow-auto rounded-xl border border-gray-200">
            <table className="w-full text-left whitespace-nowrap text-sm">
              <thead className="bg-gray-100 border-b-2 border-gray-200 sticky top-0">
                <tr className="uppercase font-black text-[10px] text-gray-500 tracking-widest">
                  {config.columns.map((col, idx) => <th key={idx} className={`py-4 px-4 ${col.align === 'center' ? 'text-center' : ''} ${col.align === 'right' ? 'text-right' : ''}`}>{col.label}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-black">
                {filteredRecords.map((r, i) => (
                  <tr key={i} onDoubleClick={() => {setFormData(r); setView('form');}} className="hover:bg-orange-50/50 cursor-pointer transition-colors">
                    {config.columns.map((col, idx) => (
                      <td key={idx} className={`py-4 px-4 font-bold ${col.align === 'center' ? 'text-center' : ''} ${col.align === 'right' ? 'text-right' : ''} ${idx === 0 ? 'text-orange-600 font-black' : 'text-gray-700'}`}>
                        {typeof r[col.key] === 'boolean' ? (r[col.key] ? <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-[9px] font-black uppercase">SI</span> : <span className="bg-gray-100 text-gray-500 px-2 py-1 rounded text-[9px] font-black uppercase">NO</span>) : r[col.key]}
                      </td>
                    ))}
                  </tr>
                ))}
                {filteredRecords.length === 0 && <tr><td colSpan={config.columns.length} className="text-center py-16 text-gray-400 font-bold text-xs uppercase tracking-widest">No se encontraron resultados</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="flex-grow overflow-y-auto p-10 bg-gray-50/50">
          <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="bg-white p-10 rounded-[2rem] border border-gray-100 shadow-sm max-w-4xl mx-auto space-y-6">
            <h3 className="text-sm font-black uppercase text-black border-b border-gray-100 pb-3 mb-6 tracking-widest">Información del Registro</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {config.formFields.map((field, idx) => (
                <div key={idx} className={`flex flex-col ${field.fullWidth ? 'md:col-span-2' : ''}`}>
                  <label className="text-[10px] font-black text-gray-500 uppercase block mb-2 tracking-widest">{field.label}</label>
                  
                  {field.type === 'text' && <input type="text" required={field.required} value={formData[field.key] || ''} onChange={e => setFormData({...formData, [field.key]: e.target.value.toUpperCase()})} className="w-full bg-slate-100/70 p-4 rounded-2xl font-black text-xs outline-none focus:bg-white focus:border-orange-500 border-2 border-transparent transition-all uppercase" placeholder={`Ingrese ${field.label.toLowerCase()}`} />}
                  {field.type === 'number' && <input type="number" step="any" required={field.required} value={formData[field.key] || ''} onChange={e => setFormData({...formData, [field.key]: e.target.value})} className="w-full bg-slate-100/70 p-4 rounded-2xl font-black text-xs outline-none focus:bg-white focus:border-orange-500 border-2 border-transparent transition-all text-center" placeholder="0.00" />}
                  {field.type === 'date' && <input type="date" required={field.required} value={formData[field.key] || ''} onChange={e => setFormData({...formData, [field.key]: e.target.value})} className="w-full bg-slate-100/70 p-4 rounded-2xl font-black text-xs outline-none focus:bg-white focus:border-orange-500 border-2 border-transparent transition-all" />}
                  
                  {field.type === 'select' && (
                    <select required={field.required} value={formData[field.key] || ''} onChange={e => setFormData({...formData, [field.key]: e.target.value})} className="w-full bg-slate-100/70 p-4 rounded-2xl font-black text-xs outline-none focus:bg-white focus:border-orange-500 border-2 border-transparent transition-all uppercase">
                      <option value="">SELECCIONAR...</option>{field.options?.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  )}
                  
                  {field.type === 'textarea' && <textarea required={field.required} value={formData[field.key] || ''} onChange={e => setFormData({...formData, [field.key]: e.target.value.toUpperCase()})} className="w-full bg-slate-100/70 p-4 rounded-2xl font-black text-xs outline-none focus:bg-white focus:border-orange-500 border-2 border-transparent transition-all uppercase h-24 resize-none" placeholder="Observaciones adicionales..."></textarea>}
                  
                  {field.type === 'checkbox' && (
                    <label className="flex items-center space-x-3 p-4 bg-slate-100/70 border-2 border-transparent rounded-2xl cursor-pointer hover:bg-gray-100 transition-all">
                      <input type="checkbox" checked={formData[field.key] || false} onChange={e => setFormData({...formData, [field.key]: e.target.checked})} className="w-5 h-5 text-orange-500 rounded focus:ring-orange-500 border-gray-300" />
                      <span className="font-black text-xs text-gray-700 uppercase">Activar / Confirmar</span>
                    </label>
                  )}
                </div>
              ))}
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

// --- VISOR DE REPORTES PREMIUM ---
const ReportViewer = ({ config }) => (
  <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden h-full flex flex-col animate-in fade-in duration-300">
    <div className="px-8 py-6 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
      <div>
        <h2 className="text-xl font-black text-black uppercase flex items-center gap-3 tracking-tighter"><BarChart3 className="text-blue-600" size={24}/> {config.title}</h2>
        <p className="text-[10px] font-bold text-gray-500 mt-1 uppercase tracking-widest">Reporte Generado</p>
      </div>
      <div className="flex gap-2">
         <button onClick={() => exportToCSV(config, config.data)} className="bg-white border-2 border-gray-100 text-gray-700 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase shadow-sm hover:bg-gray-50 transition-colors flex items-center gap-2"><Download size={14}/> EXCEL</button>
         <button onClick={() => printDocument(config, config.data)} className="bg-black text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase shadow-md hover:bg-gray-800 transition-all flex items-center gap-2"><Printer size={14}/> IMPRIMIR PDF</button>
      </div>
    </div>
    <div className="flex-grow p-8 bg-white overflow-auto">
      <div className="rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-gray-100 border-b-2 border-gray-200">
            <tr className="uppercase font-black text-[10px] text-gray-500 tracking-widest">
              {config.columns.map((c, i) => <th key={i} className={`py-4 px-4 ${c.align === 'center' ? 'text-center' : ''} ${c.align === 'right' ? 'text-right' : ''}`}>{c.label}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-black">
            {config.data.map((r, i) => (
              <tr key={i} className="hover:bg-blue-50/30 transition-colors">
                {config.columns.map((c, idx) => <td key={idx} className={`py-4 px-4 font-bold ${c.align === 'center' ? 'text-center' : ''} ${c.align === 'right' ? 'text-right' : ''}`}>{r[c.key]}</td>)}
              </tr>
            ))}
            {config.data.length === 0 && <tr><td colSpan={config.columns.length} className="px-6 py-16 text-center text-gray-400 font-bold text-xs uppercase tracking-widest">No hay datos registrados para este reporte</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

// ================================================================
// ================= MÓDULO CONFIGURACIÓN Y USUARIOS ==============
// ================================================================

const ConfiguracionModule = ({ appSettings, setAppSettings, users, setUsers, setDialog }) => {
  const [editingUserId, setEditingUserId] = useState(null);
  const initialUserForm = { username: '', password: '', name: '', role: 'Usuario', permissions: { ventas: false, compras: false, inventario: false, bancos: false, reportes: false, configuracion: false } };
  const [newUserForm, setNewUserForm] = useState(initialUserForm);

  const handleBgUpload = (e) => {
    const file = e.target.files[0];
    if (file) { 
      compressImage(file, (base64) => { 
        setAppSettings({...appSettings, loginBg: base64}); 
        setDialog({title: 'Éxito', text: 'Fondo de pantalla actualizado.', type: 'alert'}); 
      }); 
    }
  };

  const handleSaveUser = (e) => {
    e.preventDefault();
    if (!newUserForm.username || !newUserForm.password) return setDialog({title:'Aviso', text:'Usuario y contraseña requeridos.', type:'alert'});
    const userId = newUserForm.username.toLowerCase().trim();
    const newUsersList = users.filter(u => u.username !== userId);
    setUsers([...newUsersList, { ...newUserForm, username: userId, id: userId }]);
    setNewUserForm(initialUserForm); setEditingUserId(null); 
    setDialog({title: 'Éxito', text: 'Usuario guardado correctamente.', type: 'success'});
  };

  const handleDeleteUser = (id) => {
    if(id === 'admin') return setDialog({title:'Denegado', text:'No se puede eliminar el administrador principal.', type:'error'}); 
    setDialog({ title: 'Eliminar', text: `¿Desea eliminar el acceso a ${id}?`, type: 'confirm', onConfirm: () => setUsers(users.filter(u => u.id !== id)) }); 
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300">
      <div className="bg-white p-10 rounded-3xl shadow-sm border border-gray-200">
         <h2 className="text-xl font-black uppercase text-black mb-6 flex items-center gap-3 border-b pb-4"><ImageIcon className="text-gray-400"/> Personalización Visual</h2>
         <div>
            <h3 className="text-sm font-black uppercase text-black mb-2">Fondo de Pantalla (Login)</h3>
            <p className="text-xs text-gray-500 font-bold mb-4">Sube una imagen atractiva para el fondo de inicio de sesión.</p>
            <input type="file" accept="image/*" onChange={handleBgUpload} className="block w-full text-sm text-gray-500 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:uppercase file:tracking-widest file:bg-gray-100 file:text-black hover:file:bg-gray-200 cursor-pointer" />
            {appSettings.loginBg && <img src={appSettings.loginBg} alt="Background Preview" className="mt-6 rounded-2xl border-4 border-gray-100 max-h-64 object-cover shadow-lg w-full" />}
         </div>
      </div>
      
      <div className="bg-white p-10 rounded-3xl shadow-sm border border-gray-200">
         <h2 className="text-xl font-black uppercase text-black mb-6 flex items-center gap-3 border-b pb-4"><Users className="text-orange-500"/> Gestión de Accesos y Usuarios</h2>
         
         <form onSubmit={handleSaveUser} className="space-y-4 mb-10 bg-gray-50 p-8 rounded-[2rem] border border-gray-100">
            <h3 className="text-sm font-black uppercase text-black mb-4">{editingUserId ? 'Modificar Usuario' : 'Crear Nuevo Usuario'}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div><label className="text-[10px] font-bold text-gray-500 uppercase block mb-2 tracking-widest">Usuario (Login ID)</label><input type="text" disabled={!!editingUserId} required value={newUserForm.username} onChange={e=>setNewUserForm({...newUserForm, username: e.target.value.toLowerCase().trim()})} className="w-full bg-white border-2 border-transparent rounded-2xl p-4 font-black text-xs outline-none focus:border-orange-500 transition-all" /></div>
               <div><label className="text-[10px] font-bold text-gray-500 uppercase block mb-2 tracking-widest">Contraseña</label><input type="text" required value={newUserForm.password} onChange={e=>setNewUserForm({...newUserForm, password: e.target.value})} className="w-full bg-white border-2 border-transparent rounded-2xl p-4 font-black text-xs outline-none focus:border-orange-500 transition-all" /></div>
               <div><label className="text-[10px] font-bold text-gray-500 uppercase block mb-2 tracking-widest">Nombre Completo</label><input type="text" required value={newUserForm.name} onChange={e=>setNewUserForm({...newUserForm, name: e.target.value.toUpperCase()})} className="w-full bg-white border-2 border-transparent rounded-2xl p-4 font-black text-xs uppercase outline-none focus:border-orange-500 transition-all" /></div>
               <div><label className="text-[10px] font-bold text-gray-500 uppercase block mb-2 tracking-widest">Rol del Sistema</label><input type="text" value={newUserForm.role} onChange={e=>setNewUserForm({...newUserForm, role: e.target.value.toUpperCase()})} className="w-full bg-white border-2 border-transparent rounded-2xl p-4 font-black text-xs uppercase outline-none focus:border-orange-500 transition-all" /></div>
            </div>
            <div className="mt-6">
               <label className="text-[10px] font-bold text-gray-500 uppercase block mb-3 tracking-widest">Permisos de Acceso a Módulos</label>
               <div className="flex flex-wrap gap-4">
                  {['ventas', 'compras', 'inventario', 'bancos', 'reportes', 'configuracion'].map(perm => (
                     <label key={perm} className="flex items-center gap-2 bg-white px-5 py-3 rounded-xl border border-gray-100 cursor-pointer hover:bg-orange-50 transition-all shadow-sm">
                        <input type="checkbox" checked={newUserForm.permissions[perm]} onChange={e=>setNewUserForm({...newUserForm, permissions: {...newUserForm.permissions, [perm]: e.target.checked}})} className="w-5 h-5 text-orange-500 focus:ring-orange-500 border-gray-300 rounded" />
                        <span className="text-[10px] font-black uppercase text-gray-700 tracking-widest">{perm}</span>
                     </label>
                  ))}
               </div>
            </div>
            <div className="flex justify-end pt-6 border-t border-gray-200 mt-6">
               <button type="submit" className="bg-black text-white px-10 py-4 rounded-2xl font-black text-[10px] uppercase shadow-xl hover:bg-gray-800 transition-all flex items-center gap-2"><UserPlus size={16}/> GUARDAR USUARIO</button>
            </div>
         </form>
         
         <div className="overflow-x-auto rounded-2xl border border-gray-200">
            <table className="w-full text-left whitespace-nowrap text-sm">
              <thead className="bg-gray-100 border-b-2 border-gray-200">
                <tr className="uppercase font-black text-[10px] text-gray-500 tracking-widest">
                  <th className="py-4 px-5">ID / Nombre</th>
                  <th className="py-4 px-5">Rol</th>
                  <th className="py-4 px-5">Permisos Concedidos</th>
                  <th className="py-4 px-5 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-black">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-5 font-black">{u.username}<br/><span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{u.name}</span></td>
                    <td className="py-4 px-5 font-bold text-xs uppercase">{u.role}</td>
                    <td className="py-4 px-5">
                      <div className="flex gap-1.5 flex-wrap max-w-xs">
                        {Object.entries(u.permissions||{}).filter(([_,v])=>v).map(([k])=><span key={k} className="bg-orange-100 text-orange-800 px-2.5 py-1 rounded-md text-[8px] font-black uppercase tracking-widest">{k}</span>)}
                      </div>
                    </td>
                    <td className="py-4 px-5 text-center">
                      <div className="flex justify-center gap-2">
                        <button onClick={()=>{setEditingUserId(u.id); setNewUserForm(u); window.scrollTo({top:0, behavior:'smooth'});}} className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-500 hover:text-white transition-all shadow-sm"><Edit size={16}/></button>
                        <button onClick={()=>handleDeleteUser(u.id)} className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm"><Trash2 size={16}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
         </div>
      </div>
    </div>
  );
}

// ================================================================
// ================= DATA DE CONFIGURACIÓN LIMPIA =================
// ================================================================

const MODULES_ADMIN = {
  'fact_cxc': {
    title: 'CUENTAS POR COBRAR',
    columns: [ { key: 'cliente', label: 'Cliente' }, { key: 'doc', label: 'Documento' }, { key: 'vence', label: 'Vencimiento', align: 'center' }, { key: 'saldo', label: 'Saldo Pendiente', align: 'right' } ],
    formFields: [ { key: 'cliente', label: 'Cliente Asignado', type: 'text', fullWidth: true, required: true }, { key: 'doc', label: 'Nro Documento Orig.', type: 'text', required: true }, { key: 'vence', label: 'Fecha Vencimiento', type: 'date', required: true }, { key: 'saldo', label: 'Monto Pendiente', type: 'number', required: true } ],
    initialData: [ { cliente: 'CORPORACIÓN EJEMPLO, C.A.', doc: 'FAC-0001', vence: '2024-06-10', saldo: 1500.00 } ]
  },
  'fact_retenciones': {
    title: 'RETENCIONES DE CLIENTES',
    columns: [ { key: 'comprobante', label: 'Comprobante Nro' }, { key: 'cliente', label: 'Cliente Agente Retención' }, { key: 'tipo', label: 'Tipo Impuesto', align: 'center' }, { key: 'monto', label: 'Monto Retenido', align: 'right' } ],
    formFields: [ { key: 'comprobante', label: 'Nro Comprobante', type: 'text', required: true }, { key: 'cliente', label: 'Cliente', type: 'text', fullWidth: true, required: true }, { key: 'tipo', label: 'Tipo Retención', type: 'select', options: ['IVA (75%)', 'IVA (100%)', 'ISLR'], required: true }, { key: 'monto', label: 'Monto Retenido', type: 'number', required: true } ]
  },
  
  'comp_registro': {
    title: 'REGISTRO DE COMPRAS',
    columns: [ { key: 'factura', label: 'Factura Prov.' }, { key: 'proveedor', label: 'Proveedor' }, { key: 'moneda', label: 'Moneda', align: 'center' }, { key: 'total', label: 'Total Base', align: 'right' } ],
    formFields: [ 
      { key: 'factura', label: 'Factura Proveedor', type: 'text', required: true }, { key: 'fecha', label: 'Fecha de Compra', type: 'date', required: true },
      { key: 'proveedor', label: 'Proveedor (Razón Social)', type: 'text', fullWidth: true, required: true },
      { key: 'moneda', label: 'Moneda Referencia', type: 'select', options: ['VES', 'USD', 'EUR'], required: true }, { key: 'tasa', label: 'Tasa de Cambio', type: 'number' },
      { key: 'total', label: 'Costo Total', type: 'number', required: true }
    ]
  },
  'comp_cxp': {
    title: 'CUENTAS POR PAGAR (VENCIMIENTOS)',
    columns: [ { key: 'proveedor', label: 'Proveedor' }, { key: 'doc', label: 'Nro Factura / Doc' }, { key: 'vence', label: 'Vencimiento', align: 'center' }, { key: 'saldo', label: 'Deuda Pendiente', align: 'right' } ],
    formFields: [ { key: 'proveedor', label: 'Proveedor', type: 'text', fullWidth: true, required: true }, { key: 'doc', label: 'Documento Origen', type: 'text', required: true }, { key: 'vence', label: 'Vencimiento Pago', type: 'date' }, { key: 'saldo', label: 'Deuda Pendiente', type: 'number', required: true } ]
  },
  'comp_retenciones': {
    title: 'EMISIÓN RETENCIONES A PROVEEDORES',
    columns: [ { key: 'comprobante', label: 'Nro Comprobante Emitido' }, { key: 'proveedor', label: 'Proveedor Sujeto' }, { key: 'tipo', label: 'Impuesto', align: 'center' }, { key: 'monto', label: 'Monto Retenido', align: 'right' } ],
    formFields: [ { key: 'comprobante', label: 'Comprobante Generado', type: 'text', required: true }, { key: 'proveedor', label: 'Proveedor Sujeto a Retención', type: 'text', fullWidth: true, required: true }, { key: 'tipo', label: 'Impuesto', type: 'select', options: ['IVA (75%)', 'IVA (100%)', 'ISLR'], required: true }, { key: 'monto', label: 'Monto a Retener', type: 'number', required: true } ]
  },

  'inv_catalogo': {
    title: 'CATÁLOGO DE PRODUCTOS (MULTIMONEDA)',
    columns: [ { key: 'codigo', label: 'Código' }, { key: 'nombre', label: 'Descripción del Artículo' }, { key: 'moneda', label: 'Moneda', align: 'center' }, { key: 'precio', label: 'Precio Base', align: 'right' }, { key: 'stock', label: 'Existencia Física', align: 'center' } ],
    formFields: [ 
      { key: 'codigo', label: 'Código SKU / Artículo', type: 'text', required: true }, { key: 'nombre', label: 'Nombre / Descripción', type: 'text', fullWidth: true, required: true },
      { key: 'moneda', label: 'Moneda Referencia', type: 'select', options: ['USD', 'VES', 'EUR'], required: true }, { key: 'precio', label: 'Precio Base Venta', type: 'number', required: true },
      { key: 'stock', label: 'Stock / Existencia Actual', type: 'number', required: true }
    ],
    initialData: [ { codigo: 'PRD-01', nombre: 'SERVIDOR DELL POWEREDGE T440', moneda: 'USD', precio: 2500, stock: 5 } ]
  },
  
  'nom_gestion': {
    title: 'GESTIÓN DE NÓMINA',
    columns: [ { key: 'empleado', label: 'Nombre Empleado' }, { key: 'cargo', label: 'Cargo' }, { key: 'salario', label: 'Salario Base ($)', align: 'right' }, { key: 'estado', label: 'Estado', align: 'center' } ],
    formFields: [ 
      { key: 'empleado', label: 'Nombre del Empleado', type: 'text', fullWidth: true, required: true },
      { key: 'cargo', label: 'Cargo / Puesto', type: 'text', required: true },
      { key: 'salario', label: 'Salario Base (USD)', type: 'number', required: true },
      { key: 'estado', label: 'Activo', type: 'select', options: ['ACTIVO', 'INACTIVO'], required: true }
    ]
  },
  
  'imp_costos': {
    title: 'COSTOS DE IMPORTACIÓN',
    columns: [ { key: 'bl', label: 'B/L (Tracking)' }, { key: 'proveedor', label: 'Proveedor Origen' }, { key: 'flete', label: 'Flete ($)', align: 'right' }, { key: 'aranceles', label: 'Aranceles ($)', align: 'right' }, { key: 'total', label: 'Costo Total', align: 'right' } ],
    formFields: [ 
      { key: 'bl', label: 'B/L o Tracking', type: 'text', required: true },
      { key: 'proveedor', label: 'Proveedor Origen', type: 'text', required: true },
      { key: 'flete', label: 'Costo de Flete (USD)', type: 'number', required: true },
      { key: 'aranceles', label: 'Gastos de Aduana y Aranceles', type: 'number', required: true },
      { key: 'total', label: 'Costo Total de Nacionalización', type: 'number', required: true }
    ]
  },
};

const MODULES_CONTABLE = {
  'cnt_empresas': {
    title: 'GESTOR MULTIEMPRESA',
    columns: [ { key: 'rif', label: 'RIF Identificador' }, { key: 'nombre', label: 'Razón Social (Empresa)' }, { key: 'moneda', label: 'Moneda Base', align: 'center' } ],
    formFields: [ { key: 'rif', label: 'RIF / NIT', type: 'text', required: true }, { key: 'nombre', label: 'Nombre de la Empresa Registrada', type: 'text', fullWidth: true, required: true }, { key: 'moneda', label: 'Moneda Contable Principal', type: 'select', options: ['VES', 'USD'], required: true }, { key: 'direccion', label: 'Dirección Fiscal Completa', type: 'textarea', fullWidth: true } ],
    initialData: [ { rif: 'J-12345678-9', nombre: 'CORPORACIÓN PRINCIPAL ERP, C.A.', moneda: 'VES' } ]
  },
  'cnt_plan': {
    title: 'PLAN DE CUENTAS MAESTRO',
    columns: [ { key: 'codigo', label: 'Código Contable' }, { key: 'nombre', label: 'Descripción de la Cuenta' }, { key: 'tipo', label: 'Naturaleza', align: 'center' } ],
    formFields: [ { key: 'codigo', label: 'Código (Ej: 1.0.0.0)', type: 'text', required: true }, { key: 'nombre', label: 'Nombre / Título de la Cuenta', type: 'text', fullWidth: true, required: true }, { key: 'tipo', label: 'Clasificación Financiera', type: 'select', options: ['ACTIVO', 'PASIVO', 'PATRIMONIO', 'INGRESOS', 'EGRESOS'], required: true } ],
    initialData: [ { codigo: '1.0.0.0', nombre: 'TOTAL ACTIVOS', tipo: 'ACTIVO' }, { codigo: '1.1.1.0', nombre: 'CAJA Y BANCOS', tipo: 'ACTIVO' } ]
  },
  'cnt_diario': {
    title: 'LIBRO DIARIO (ASIENTOS)',
    columns: [ { key: 'asiento', label: 'Nro Asiento' }, { key: 'fecha', label: 'Fecha Reg.' }, { key: 'desc', label: 'Concepto General' }, { key: 'total', label: 'Cuadre (Monto)', align: 'right' } ],
    formFields: [ { key: 'asiento', label: 'Correlativo Asiento', type: 'text', required: true }, { key: 'fecha', label: 'Fecha Contable', type: 'date', required: true }, { key: 'desc', label: 'Concepto / Glosa General', type: 'text', fullWidth: true, required: true }, { key: 'total', label: 'Suma Debe/Haber (Total Cuadrado)', type: 'number', required: true } ]
  }
};

// ================================================================
// ================= REPORTES (VISORES SOLO LECTURA) ==============
// ================================================================
const REPORTS = {
  'rep_libro_ventas': { title: 'LIBRO DE VENTAS (FISCAL)', columns: [ { key: 'fec', label: 'Fecha' }, { key: 'fac', label: 'Factura' }, { key: 'cli', label: 'Cliente (Razón Social)' }, { key: 'base', label: 'Base Imponible', align: 'right' }, { key: 'iva', label: 'IVA Debito', align: 'right' }, { key: 'tot', label: 'Total General', align: 'right' } ], data: [ { fec:'10/05/2024', fac:'001', cli:'INVERSIONES GLOBAL', base:'100.00', iva:'16.00', tot:'116.00' } ] },
  'rep_libro_compras': { title: 'LIBRO DE COMPRAS', columns: [ { key: 'fec', label: 'Fecha' }, { key: 'fac', label: 'Factura Prov.' }, { key: 'prov', label: 'Proveedor' }, { key: 'base', label: 'Base Imponible', align: 'right' }, { key: 'iva', label: 'IVA Crédito', align: 'right' }, { key: 'tot', label: 'Total', align: 'right' } ], data: [] },
  'rep_islr': { title: 'DETERMINACIÓN I.S.L.R.', columns: [ { key: 'concepto', label: 'Concepto Tributario' }, { key: 'base', label: 'Base Imponible (Renta)' }, { key: 'tarifa', label: 'Tarifa Aplicada (%)', align: 'center' }, { key: 'impuesto', label: 'Impuesto Causado', align: 'right' } ], data: [ { concepto: 'Ingresos Brutos Periodo', base: '10,000.00', tarifa: '34%', impuesto: '3,400.00' } ] },
  'rep_igtf': { title: 'DETERMINACIÓN I.G.T.F. (3%)', columns: [ { key: 'fecha', label: 'Fecha Operación' }, { key: 'doc', label: 'Doc. Referencia' }, { key: 'base_divisa', label: 'Base Pagada en Divisas' }, { key: 'igtf', label: 'IGTF Causado (3%)', align: 'right' } ], data: [] },
  'rep_pensiones': { title: 'LEY PROTECCIÓN PENSIONES', columns: [ { key: 'mes', label: 'Mes Fiscal' }, { key: 'nomina', label: 'Total Nómina Normal' }, { key: 'tasa', label: 'Tasa Fija (9%)', align: 'center' }, { key: 'pago', label: 'Aporte a Pagar', align: 'right' } ], data: [ { mes: 'Mayo 2024', nomina: '5,000.00', tasa: '9%', pago: '450.00' } ] },
  'rep_analisis_venc': { title: 'ANÁLISIS DE VENCIMIENTOS (CxC / CxP)', columns: [ { key: 'entidad', label: 'Cliente / Proveedor' }, { key: 'doc', label: 'Doc. Asoc.' }, { key: 'dias', label: 'Estatus Vencimiento', align: 'center' }, { key: 'saldo', label: 'Saldo Pendiente', align: 'right' } ], data: [ { entidad: 'Distribuidora X', doc: 'F-123', dias: 'Vencido (30 días)', saldo: '1,500.00' } ] },
  'rep_conciliacion': { title: 'CONCILIACIÓN BANCARIA', columns: [ { key: 'banco', label: 'Entidad Bancaria' }, { key: 'saldo_libro', label: 'Saldo s/Libros', align: 'right' }, { key: 'saldo_edo', label: 'Saldo s/Edo. Cuenta', align: 'right' }, { key: 'diff', label: 'Diferencia a Conciliar', align: 'right' } ], data: [ { banco: 'Banesco Cta Cte', saldo_libro: '5,000.00', saldo_edo: '5,000.00', diff: '0.00' } ] },
  
  'rep_mayor': { title: 'MAYOR GENERAL ANALÍTICO', columns: [ { key: 'cuenta', label: 'Código y Cuenta' }, { key: 'saldo_ant', label: 'Saldo Inicial', align: 'right' }, { key: 'cargos', label: 'Cargos (Debe)', align: 'right' }, { key: 'abonos', label: 'Abonos (Haber)', align: 'right' }, { key: 'saldo_act', label: 'Saldo Final', align: 'right' } ], data: [] },
  'rep_balance': { title: 'BALANCE DE COMPROBACIÓN', columns: [ { key: 'rubro', label: 'Rubro / Clase Contable' }, { key: 'monto', label: 'Monto Acumulado (Cierre)', align: 'right' } ], data: [ { rubro: '1.0 - Total Activos', monto: '15,000.00' }, { rubro: '2.0 - Total Pasivos', monto: '5,000.00' }, { rubro: '3.0 - Total Patrimonio', monto: '10,000.00' } ] }
};

// ================================================================
// ================= MENÚS DE NAVEGACIÓN SUPERIOR =================
// ================================================================

const MENU_ADMIN = [
  { label: 'Facturación', subItems: [ { id: 'fact_emision', label: 'Emisión de Facturas' }, { id: 'fact_cxc', label: 'Cuentas por Cobrar' }, { id: 'fact_retenciones', label: 'Retenciones a Clientes' } ] },
  { label: 'Compras', subItems: [ { id: 'comp_registro', label: 'Registro de Compras' }, { id: 'comp_cxp', label: 'Cuentas por Pagar' }, { id: 'comp_retenciones', label: 'Retenciones a Proveedores' } ] },
  { label: 'Inventario', subItems: [ { id: 'inv_catalogo', label: 'Catálogo y Existencias' } ] },
  { label: 'Bancos', subItems: [ { id: 'ban_pagos', label: 'Pago a Proveedores (CxP)' } ] },
  { label: 'Nómina', subItems: [ { id: 'nom_gestion', label: 'Gestión de Nómina' } ] },
  { label: 'Importaciones', subItems: [ { id: 'imp_costos', label: 'Costos de Importación' } ] },
  { label: 'Reportes', subItems: [ { id: 'rep_libro_ventas', label: 'Libro de Ventas' }, { id: 'rep_libro_compras', label: 'Libro de Compras' }, { id: 'rep_analisis_venc', label: 'Análisis de Vencimiento' }, { id: 'rep_conciliacion', label: 'Conciliación Bancaria' }, { separator: true }, { id: 'rep_islr', label: 'Liquidación I.S.L.R.' }, { id: 'rep_pensiones', label: 'Ley Prot. Pensiones' }, { id: 'rep_igtf', label: 'Liquidación I.G.T.F.' } ] },
  { label: 'Configuración', subItems: [ { id: 'configuracion', label: 'Ajustes y Usuarios' } ] }
];

const MENU_CONTABLE = [
  { label: 'Comprobantes Diarios', subItems: [ { id: 'cnt_diario', label: 'Libro Diario' } ] },
  { label: 'Mayores Analíticos', subItems: [ { id: 'rep_mayor', label: 'Libro Mayor Analítico' } ] },
  { label: 'Estados Financieros', subItems: [ { id: 'rep_balance', label: 'Balance de Comprobación' } ] },
  { label: 'Configuración', subItems: [ { id: 'cnt_empresas', label: 'Empresas' }, { id: 'cnt_plan', label: 'Plan de Cuentas' }, { separator: true }, { id: 'configuracion', label: 'Usuarios y Permisos' } ] }
];

// ================================================================
// ================= VISTAS DE NAVEGACIÓN =========================
// ================================================================

const Dashboard = ({ setView, appUser }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8 animate-in fade-in duration-500">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-black text-black uppercase tracking-widest">Plataforma ERP Integrada</h2>
        <div className="w-24 h-1.5 bg-orange-500 mx-auto mt-4 rounded-full"></div>
        <p className="text-gray-500 mt-4 text-xs font-bold uppercase tracking-widest">Bienvenido, {appUser?.name} — Seleccione entorno de trabajo</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
        <button onClick={() => setView('admin')} className="group bg-black border-l-4 border-orange-500 rounded-[2rem] p-10 text-left hover:bg-gray-900 transition-all shadow-2xl flex flex-col items-center text-center">
          <div className="bg-white/10 w-24 h-24 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <Briefcase className="h-10 w-10 text-orange-500" />
          </div>
          <h3 className="text-xl font-black text-white uppercase tracking-widest">Área Administrativa</h3>
          <p className="text-xs text-gray-400 mt-3 font-bold leading-relaxed max-w-xs mx-auto">Gestión de Facturación, Compras, Control de Inventario Multimoneda, Bancos y Generación de Reportes Fiscales.</p>
        </button>
        <button onClick={() => setView('accounting')} className="group bg-white border-l-4 border-blue-600 rounded-[2rem] p-10 text-left hover:bg-blue-50 transition-all shadow-xl flex flex-col items-center text-center">
          <div className="bg-blue-100 w-24 h-24 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <Calculator className="h-10 w-10 text-blue-600" />
          </div>
          <h3 className="text-xl font-black text-black uppercase tracking-widest">Área Contable</h3>
          <p className="text-xs text-gray-500 mt-3 font-bold leading-relaxed max-w-xs mx-auto">Mantenimiento de Multiempresas, Plan de Cuentas Central, Asientos de Libro Diario y Balances de Comprobación.</p>
        </button>
      </div>
    </div>
  );
};

const AppShell = ({ setView, moduleType, appUser, appSettings, setAppSettings, users, setUsers, setDialog }) => {
  const [activeTab, setActiveTab] = useState('sub_dashboard');
  const menus = moduleType === 'admin' ? MENU_ADMIN : MENU_CONTABLE;
  const dbConfig = moduleType === 'admin' ? MODULES_ADMIN : MODULES_CONTABLE;

  const [openDropdown, setOpenDropdown] = useState(null);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans animate-in fade-in duration-300">
      <nav className="bg-black text-white px-6 py-4 shadow-2xl print:hidden sticky top-0 z-40 border-b-4 border-orange-500">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <div className="flex items-center gap-8">
            <div className="flex items-center cursor-pointer group" onClick={() => setActiveTab('sub_dashboard')}>
              <span className="text-xl font-light tracking-widest text-gray-300 hidden md:inline">ERP</span>
              <span className="text-white font-black text-2xl leading-none ml-2 group-hover:text-orange-500 transition-colors">{moduleType === 'admin' ? 'ADM' : 'CNT'}</span>
              <div className={`bg-${moduleType === 'admin' ? 'orange' : 'blue'}-500 text-white rounded-full w-2 h-2 mx-1`}></div>
            </div>
            
            <div className="hidden lg:flex bg-gray-900 rounded-2xl p-1.5 gap-2 border border-gray-800">
              <button onClick={() => setActiveTab('sub_dashboard')} className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'sub_dashboard' ? 'bg-white text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}>
                <Home size={14}/> Panel Interior
              </button>
              {menus.map((m, i) => (
                <div key={i} className="relative" onMouseEnter={() => setOpenDropdown(i)} onMouseLeave={() => setOpenDropdown(null)}>
                  <div className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer transition-all flex items-center ${openDropdown === i || m.subItems.some(sub => sub.id === activeTab) ? 'bg-white text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}>
                    {m.label}
                  </div>
                  {openDropdown === i && (
                    <div className="absolute top-full left-0 mt-2 w-64 bg-white shadow-2xl rounded-2xl border border-gray-100 py-3 z-50 animate-in fade-in slide-in-from-top-2">
                      {m.subItems.map((sub, j) => sub.separator ? <div key={`sep-${j}`} className="h-px bg-gray-100 my-2"></div> : (
                        <div key={sub.id} onClick={() => { setActiveTab(sub.id); setOpenDropdown(null); }} className={`px-6 py-3 text-[10px] font-black uppercase tracking-widest cursor-pointer transition-colors ${activeTab === sub.id ? 'text-orange-600 bg-orange-50' : 'text-gray-600 hover:text-orange-500 hover:bg-gray-50'}`}>
                          {sub.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
               <p className="text-[9px] font-black text-orange-500 uppercase tracking-widest">{appUser?.role}</p>
               <p className="text-xs font-black text-white uppercase">{appUser?.name}</p>
            </div>
            <div className="h-8 w-px bg-gray-800 mx-2 hidden sm:block"></div>
            <button onClick={() => setView('login')} className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all border border-red-500/20 flex items-center gap-2 text-[10px] font-black uppercase"><LogOut size={16}/> <span className="hidden sm:inline">Cerrar Sesión</span></button>
          </div>
        </div>
      </nav>

      <main className="flex-grow p-4 md:p-8 max-w-[1400px] mx-auto w-full flex flex-col justify-center">
        {activeTab === 'sub_dashboard' ? (
          <SubDashboard moduleType={moduleType} setActiveTab={setActiveTab} />
        ) : activeTab === 'fact_emision' ? (
          <FacturacionModule setDialog={setDialog} />
        ) : activeTab === 'ban_pagos' ? (
          <BancosModule setDialog={setDialog} />
        ) : activeTab === 'configuracion' ? (
          <ConfiguracionModule appSettings={appSettings} setAppSettings={setAppSettings} users={users} setUsers={setUsers} setDialog={setDialog} />
        ) : dbConfig[activeTab] ? (
          <GenericCrudModule key={activeTab} config={dbConfig[activeTab]} setDialog={setDialog} />
        ) : REPORTS[activeTab] ? (
          <ReportViewer key={activeTab} config={REPORTS[activeTab]} />
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center animate-in fade-in zoom-in-95 duration-300">
            <div className="bg-white p-12 rounded-[2rem] border border-gray-200 shadow-sm max-w-md w-full">
              <div className="bg-orange-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                <Activity className="w-12 h-12 text-orange-500" />
              </div>
              <h2 className="text-xl font-black text-black uppercase tracking-widest mb-2">Módulo en Blanco</h2>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-8 leading-relaxed">Listo para diseñar desde cero<br/>({activeTab})</p>
              <button onClick={() => setActiveTab('sub_dashboard')} className="w-full bg-black text-white px-6 py-4 rounded-2xl text-[10px] font-black uppercase shadow-md hover:bg-gray-800 transition-all flex items-center justify-center gap-2">
                <ArrowRight size={16} className="rotate-180"/> Volver al Panel Principal
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default function App() {
  const [view, setView] = useState('login');
  const [appUser, setAppUser] = useState(fakeDB.usuarios[0]);
  const [appSettings, setAppSettings] = useState(fakeDB.settings);
  const [users, setUsers] = useState(fakeDB.usuarios);
  const [dialog, setDialog] = useState(null);

  return (
    <>
      {view === 'login' && <Login setView={setView} appSettings={appSettings} setAppUser={setAppUser} setDialog={setDialog} />}
      {view === 'dashboard' && <Dashboard setView={setView} appUser={appUser} />}
      {view === 'admin' && <AppShell setView={setView} moduleType="admin" appUser={appUser} appSettings={appSettings} setAppSettings={setAppSettings} users={users} setUsers={setUsers} setDialog={setDialog} />}
      {view === 'accounting' && <AppShell setView={setView} moduleType="accounting" appUser={appUser} appSettings={appSettings} setAppSettings={setAppSettings} users={users} setUsers={setUsers} setDialog={setDialog} />}
      <DialogModal dialog={dialog} setDialog={setDialog} />
    </>
  );
}

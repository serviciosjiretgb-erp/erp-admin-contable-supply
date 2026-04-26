// ============================================================
//  Supply ERP — Módulo de Banco · Servicios Jiret G&B, C.A.
//  App.jsx — Componente raíz (React 18 + react-chartjs-2)
//
//  Dependencias requeridas:
//    npm install chart.js react-chartjs-2
// ============================================================

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Title, Tooltip, Legend, Filler,
} from "chart.js";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import "./banco.css";

ChartJS.register(
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Title, Tooltip, Legend, Filler
);

// ─────────────────────────────────────────────
//  DATOS MOCK (reemplazar con llamadas a API)
// ─────────────────────────────────────────────
const TASA_HOY = 39.47;

const CUENTAS = [
  { banco:"Banesco", num:"0134-0136-26-1366009842", tipo:"Internacional", moneda:"USD", puc:"1.1.01.02.001", saldo:32545.80, estado:"Activa" },
  { banco:"Mercantil", num:"0105-0071-18-1071142380", tipo:"Corriente", moneda:"Bs.", puc:"1.1.01.01.001", saldo:987450.20, estado:"Activa" },
  { banco:"BNC", num:"0191-0020-43-2020014512", tipo:"Corriente", moneda:"Bs.", puc:"1.1.01.01.002", saldo:296941.80, estado:"Activa" },
  { banco:"Caja Principal", num:"—", tipo:"Caja", moneda:"Bs.", puc:"1.1.02.01.001", saldo:48350.00, estado:"Activa" },
];

const TASAS = [
  { fecha:"26/04/2026", tasa:39.47, var:"+0.08", fuente:"BCV" },
  { fecha:"25/04/2026", tasa:39.39, var:"+0.12", fuente:"BCV" },
  { fecha:"24/04/2026", tasa:39.27, var:"+0.05", fuente:"BCV" },
  { fecha:"23/04/2026", tasa:39.22, var:"-0.03", fuente:"BCV" },
  { fecha:"22/04/2026", tasa:39.25, var:"+0.10", fuente:"BCV" },
  { fecha:"21/04/2026", tasa:39.15, var:"+0.07", fuente:"BCV" },
  { fecha:"18/04/2026", tasa:39.08, var:"-0.02", fuente:"BCV" },
];

const TIPOS = [
  { cod:"ING-001", desc:"Cobro de facturas", nat:"ingreso", retIVA:"No", retISLR:"No", puc:"1.1.03.01" },
  { cod:"ING-002", desc:"Depósito en efectivo", nat:"ingreso", retIVA:"No", retISLR:"No", puc:"1.1.03.02" },
  { cod:"EGR-001", desc:"Pago a proveedores", nat:"egreso", retIVA:"Sí", retISLR:"Sí", puc:"2.1.02.01" },
  { cod:"EGR-002", desc:"Pago de nómina", nat:"egreso", retIVA:"No", retISLR:"No", puc:"6.1.01.01" },
  { cod:"EGR-003", desc:"Comisión bancaria", nat:"egreso", retIVA:"No", retISLR:"No", puc:"6.3.01.01" },
  { cod:"EGR-004", desc:"Impuestos y retenciones", nat:"egreso", retIVA:"No", retISLR:"No", puc:"2.1.04.01" },
];

const CHEQUERAS = [
  { banco:"Mercantil Bs.", serie:"A", ini:1, fin:50, actual:23, usados:22, estado:"Activa" },
  { banco:"BNC Bs.", serie:"B", ini:1, fin:30, actual:30, usados:29, estado:"Por agotar" },
  { banco:"BNC Bs.", serie:"C", ini:1, fin:50, actual:1, usados:0, estado:"Nueva" },
];

const MOVIMIENTOS = [
  { fecha:"26/04/2026", doc:"TRF-0089", concepto:"Cobro factura F-00421", cuenta:"Mercantil Bs.", moneda:"Bs.", monto:85000, equiv:85000, retIVA:"—", retISLR:"—", estado:"Confirmado", tipo:"ingreso" },
  { fecha:"25/04/2026", doc:"EGR-0112", concepto:"Pago proveedor Distribuidora Sur", cuenta:"Banesco USD", moneda:"USD", monto:1200, equiv:47364, retIVA:"Bs. 6,851", retISLR:"Bs. 947", estado:"Confirmado", tipo:"egreso" },
  { fecha:"25/04/2026", doc:"EGR-0111", concepto:"Pago nómina quincenal", cuenta:"BNC Bs.", moneda:"Bs.", monto:96800, equiv:96800, retIVA:"—", retISLR:"—", estado:"Confirmado", tipo:"egreso" },
  { fecha:"24/04/2026", doc:"ING-0098", concepto:"Depósito cliente Inversiones Lima", cuenta:"Mercantil Bs.", moneda:"Bs.", monto:42000, equiv:42000, retIVA:"—", retISLR:"—", estado:"Confirmado", tipo:"ingreso" },
  { fecha:"23/04/2026", doc:"EGR-0109", concepto:"Comisión transferencia SWIFT", cuenta:"Banesco USD", moneda:"USD", monto:35, equiv:1381, retIVA:"—", retISLR:"—", estado:"Confirmado", tipo:"egreso" },
  { fecha:"22/04/2026", doc:"ING-0095", concepto:"Cobro factura F-00418", cuenta:"Mercantil Bs.", moneda:"Bs.", monto:112500, equiv:112500, retIVA:"—", retISLR:"—", estado:"Confirmado", tipo:"ingreso" },
];

const VALES = [
  { num:"V-0019", fecha:"22/04/2026", beneficiario:"Carlos Rodríguez", concepto:"Anticipo viáticos", monto:8000, tipo:"egreso", estado:"Pendiente" },
  { num:"V-0021", fecha:"23/04/2026", beneficiario:"Almacén General", concepto:"Compra materiales limpieza", monto:5100, tipo:"egreso", estado:"Pendiente" },
  { num:"V-0023", fecha:"24/04/2026", beneficiario:"Luisa Martínez", concepto:"Solicitud efectivo caja chica", monto:10000, tipo:"egreso", estado:"Pendiente" },
  { num:"V-0018", fecha:"20/04/2026", beneficiario:"Reparaciones Técnicas", concepto:"Servicio mantenimiento AC", monto:12000, tipo:"egreso", estado:"Liquidado" },
  { num:"V-0017", fecha:"18/04/2026", beneficiario:"Pedro Gómez", concepto:"Anticipo viáticos", monto:6000, tipo:"egreso", estado:"Liquidado" },
];

const TRANSFERENCIAS = [
  { fecha:"24/04/2026", op:"TRF-0033", origen:"Banesco USD", destino:"Mercantil Bs.", monto:"$2,000", tasa:"39.27", equiv:"Bs. 78,540", estado:"Ejecutada" },
  { fecha:"20/04/2026", op:"TRF-0031", origen:"Mercantil Bs.", destino:"Caja Principal", monto:"Bs. 55,000", tasa:"—", equiv:"Bs. 55,000", estado:"Ejecutada" },
  { fecha:"15/04/2026", op:"TRF-0029", origen:"BNC Bs.", destino:"Mercantil Bs.", monto:"Bs. 80,000", tasa:"—", equiv:"Bs. 80,000", estado:"Ejecutada" },
];

const CONCIL = [
  { fecha:"26/04/2026", desc:"Cobro factura F-00421", banco:"85,000.00", sistema:"85,000.00", estado:"ok" },
  { fecha:"25/04/2026", desc:"Pago nómina quincenal", banco:"96,800.00", sistema:"96,800.00", estado:"ok" },
  { fecha:"25/04/2026", desc:"Cheque 023 – Proveedor X", banco:"—", sistema:"12,400.00", estado:"pendiente" },
  { fecha:"24/04/2026", desc:"Depósito cliente Lima", banco:"42,000.00", sistema:"42,000.00", estado:"ok" },
  { fecha:"22/04/2026", desc:"Comisión servicio mensual", banco:"850.00", sistema:"—", estado:"pendiente" },
];

const PROYECTADO = [
  { fecha:"30/04/2026", entidad:"Inversiones Lima C.A.", concepto:"Cobro Factura F-00425", tipo:"ingreso", monto:95000 },
  { fecha:"02/05/2026", entidad:"Proveedor El Norte", concepto:"Pago factura PR-0341", tipo:"egreso", monto:48500 },
  { fecha:"05/05/2026", entidad:"Gobierno Local", concepto:"Impuesto municipal 1er trimestre", tipo:"egreso", monto:12200 },
  { fecha:"10/05/2026", entidad:"Cliente Omega S.A.", concepto:"Cobro Factura F-00430", tipo:"ingreso", monto:120000 },
  { fecha:"15/05/2026", entidad:"Nómina Quincenal", concepto:"Pago nómina", tipo:"egreso", monto:96800 },
  { fecha:"20/05/2026", entidad:"Distribuidora Sur", concepto:"Pago factura $1,800", tipo:"egreso", monto:71046 },
];

const LIBRO = [
  { fecha:"20/04/2026", doc:"TRF-0031", desc:"Transferencia a Caja Principal", debito:"55,000.00", credito:"—", saldo:"88,450.20" },
  { fecha:"22/04/2026", doc:"ING-0095", desc:"Cobro F-00418", debito:"—", credito:"112,500.00", saldo:"200,950.20" },
  { fecha:"24/04/2026", doc:"ING-0098", desc:"Depósito Inversiones Lima", debito:"—", credito:"42,000.00", saldo:"242,950.20" },
  { fecha:"25/04/2026", doc:"EGR-0111", desc:"Pago nómina quincenal", debito:"96,800.00", credito:"—", saldo:"146,150.20" },
  { fecha:"26/04/2026", doc:"TRF-0089", desc:"Cobro F-00421", debito:"—", credito:"85,000.00", saldo:"231,150.20" },
];

const DIFERENCIAL = [
  { doc:"V-0018", tasaOrigen:"38.90", tasaLiq:"39.15", monto:"$1,200.00", difBs:"300.00", tipo:"Ganancia" },
  { doc:"CXP-0041", tasaOrigen:"38.50", tasaLiq:"39.27", monto:"$2,000.00", difBs:"1,540.00", tipo:"Pérdida" },
  { doc:"CXC-0093", tasaOrigen:"39.00", tasaLiq:"39.47", monto:"$850.00", difBs:"399.50", tipo:"Ganancia" },
];

// ─────────────────────────────────────────────
//  UTILIDADES
// ─────────────────────────────────────────────
const fmt = (n) =>
  new Intl.NumberFormat("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

// ─────────────────────────────────────────────
//  SUB-COMPONENTES REUTILIZABLES
// ─────────────────────────────────────────────

function Badge({ variant = "green", children }) {
  return <span className={`badge badge-${variant}`}>{children}</span>;
}

function KpiCard({ label, value, sub, variant = "green" }) {
  return (
    <div className={`kpi-card ${variant}`}>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      {sub && <div className="kpi-sub">{sub}</div>}
    </div>
  );
}

function Modal({ id, title, open, onClose, children, footer, width = 520 }) {
  if (!open) return null;
  return (
    <div className="modal-overlay open" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ width }}>
        <div className="modal-header">
          <div className="modal-title">{title}</div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

function FormGroup({ label, children }) {
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────
//  SECCIÓN: DASHBOARD
// ─────────────────────────────────────────────
function SectionDashboard({ openModal }) {
  const flujoRef = useRef(null);
  const distRef = useRef(null);
  const chartFlujo = useRef(null);
  const chartDist = useRef(null);

  useEffect(() => {
    if (flujoRef.current) {
      chartFlujo.current?.destroy();
      chartFlujo.current = new ChartJS(flujoRef.current, {
        type: "bar",
        data: {
          labels: ["L", "M", "M", "J", "V", "S", "D"],
          datasets: [
            { label: "Ingresos", data: [85000, 0, 42000, 0, 112500, 0, 0], backgroundColor: "#1a7d5a", borderRadius: 4 },
            { label: "Egresos", data: [0, 47364, 0, 96800, 0, 1381, 0], backgroundColor: "#c0392b", borderRadius: 4 },
          ],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { display: false } },
            y: { grid: { color: "rgba(0,0,0,.04)" }, ticks: { callback: (v) => v >= 1000 ? (v / 1000) + "k" : v } },
          },
        },
      });
    }
    if (distRef.current) {
      chartDist.current?.destroy();
      chartDist.current = new ChartJS(distRef.current, {
        type: "doughnut",
        data: {
          labels: ["Banesco USD", "Mercantil Bs.", "BNC Bs.", "Caja Princ."],
          datasets: [{ data: [32545.80 * 39.47, 987450.20, 296941.80, 48350], backgroundColor: ["#0d1b2e", "#c8972a", "#1a7d5a", "#1a5fa8"], borderWidth: 0, hoverOffset: 4 }],
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, cutout: "65%" },
      });
    }
    return () => { chartFlujo.current?.destroy(); chartDist.current?.destroy(); };
  }, []);

  const pendientes = VALES.filter((v) => v.estado === "Pendiente");
  const totalValesBs = pendientes.reduce((a, v) => a + v.monto, 0);

  return (
    <div>
      <div className="kpi-grid">
        <KpiCard label="Total Bancos (Bs.)" value="1,284,392" sub={<><span className="badge-up">↑ 4.2%</span> vs semana anterior</>} variant="green" />
        <KpiCard label="Total Bancos (USD)" value="$32,545.80" sub="≈ Bs. 1,285,206" variant="gold" />
        <KpiCard label="Caja Principal (Bs.)" value="48,350" sub="Efectivo físico disponible" variant="blue" />
        <KpiCard label="Vales Pendientes" value={`Bs. ${fmt(totalValesBs)}`} sub={<><span className="badge-down">{pendientes.length} vales</span> sin liquidar</>} variant="red" />
      </div>

      {/* Banner de posición */}
      <div className="position-banner">
        <div>
          <div className="position-banner-label">Posición Neta de Liquidez</div>
          <div className="position-banner-value">Bs. 1,309,642</div>
          <div className="position-banner-sub">Bancos + Caja − Vales Pendientes</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div className="position-banner-sub">Equivalente USD</div>
          <div className="position-banner-usd">$33,177.93</div>
          <div className="position-banner-sub" style={{ marginTop: 4 }}>Tasa BCV {TASA_HOY}</div>
        </div>
      </div>

      <div className="chart-row">
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Flujo de Caja — Últimos 7 días</div>
              <div className="card-subtitle">Ingresos vs Egresos en Bs.</div>
            </div>
          </div>
          <div style={{ position: "relative", height: 220 }}>
            <canvas ref={flujoRef} aria-label="Flujo de caja semanal" />
          </div>
        </div>
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Distribución por Cuenta</div>
              <div className="card-subtitle">Participación en saldo total</div>
            </div>
          </div>
          <div className="legend-row">
            {[["#0d1b2e","Banesco USD"],["#c8972a","Mercantil Bs."],["#1a7d5a","BNC Bs."],["#1a5fa8","Caja Princ."]].map(([c,l])=>(
              <span key={l} className="legend-item"><span className="legend-dot" style={{ background: c }} />{l}</span>
            ))}
          </div>
          <div style={{ position: "relative", height: 180 }}>
            <canvas ref={distRef} aria-label="Distribución de saldos" />
          </div>
        </div>
      </div>

      <div className="two-col">
        <div className="card">
          <div className="card-header">
            <div className="card-title">Últimos Movimientos</div>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Fecha</th><th>Concepto</th><th>Cuenta</th><th className="text-right">Monto</th><th>Estado</th></tr></thead>
              <tbody>
                {MOVIMIENTOS.slice(0, 5).map((m) => (
                  <tr key={m.doc}>
                    <td style={{ fontSize: 12, whiteSpace: "nowrap" }}>{m.fecha}</td>
                    <td>{m.concepto}</td>
                    <td style={{ fontSize: 12, color: "var(--muted)" }}>{m.cuenta}</td>
                    <td className={`text-right mono ${m.tipo === "ingreso" ? "text-green" : "text-red"}`}>
                      {m.tipo === "ingreso" ? "+" : "−"}{m.moneda === "USD" ? "$" : "Bs."} {fmt(m.monto)}
                    </td>
                    <td><Badge variant="green">{m.estado}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card">
          <div className="card-header">
            <div className="card-title">Vales en Tránsito</div>
            <Badge variant="red">{pendientes.length} pendientes</Badge>
          </div>
          {pendientes.map((v) => (
            <div key={v.num} className="vale-dash-item">
              <div>
                <div className="vale-dash-title">{v.num} — {v.beneficiario}</div>
                <div className="vale-dash-sub">{v.concepto} · {v.fecha}</div>
              </div>
              <div>
                <div className="mono text-red" style={{ fontSize: 13 }}>Bs. {fmt(v.monto)}</div>
                <button className="btn btn-sm btn-outline" onClick={() => openModal("liquidar")} style={{ marginTop: 6 }}>Liquidar</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  SECCIÓN: CUENTAS
// ─────────────────────────────────────────────
function SectionCuentas({ openModal }) {
  return (
    <div>
      <div className="account-grid">
        {CUENTAS.map((c) => (
          <div key={c.num} className="account-card">
            <div className="account-bank">{c.banco}</div>
            <div className="account-num">{c.num}</div>
            <div className="account-balance">{c.moneda === "USD" ? "$" : "Bs."} {fmt(c.saldo)}</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
              <span className={`tag ${c.moneda === "USD" ? "tag-usd" : "tag-bs"}`}>{c.moneda}</span>
              <Badge variant="green">{c.estado}</Badge>
            </div>
          </div>
        ))}
      </div>
      <div className="card">
        <div className="card-header">
          <div className="card-title">Registro de Cuentas</div>
          <button className="btn btn-primary btn-sm" onClick={() => openModal("cuenta")}>+ Nueva Cuenta</button>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Banco</th><th>Número de Cuenta</th><th>Tipo</th><th>Moneda</th><th>Plan Cuentas</th><th className="text-right">Saldo</th><th>Estado</th></tr></thead>
            <tbody>
              {CUENTAS.map((c) => (
                <tr key={c.num}>
                  <td><strong>{c.banco}</strong></td>
                  <td className="mono" style={{ fontSize: 12 }}>{c.num}</td>
                  <td>{c.tipo}</td>
                  <td><span className={`tag ${c.moneda === "USD" ? "tag-usd" : "tag-bs"}`}>{c.moneda}</span></td>
                  <td className="mono" style={{ fontSize: 12 }}>{c.puc}</td>
                  <td className="text-right mono">{c.moneda === "USD" ? "$" : "Bs."} {fmt(c.saldo)}</td>
                  <td><Badge variant="green">{c.estado}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  SECCIÓN: TASAS DE CAMBIO
// ─────────────────────────────────────────────
function SectionTasas({ openModal }) {
  const chartRef = useRef(null);
  const chartInst = useRef(null);

  useEffect(() => {
    if (chartRef.current) {
      chartInst.current?.destroy();
      chartInst.current = new ChartJS(chartRef.current, {
        type: "line",
        data: {
          labels: [...TASAS].reverse().map((t) => t.fecha.slice(0, 5)),
          datasets: [{ label: "Tasa BCV", data: [...TASAS].reverse().map((t) => t.tasa), borderColor: "#c8972a", backgroundColor: "rgba(200,151,42,.08)", tension: 0.3, fill: true, pointRadius: 3, pointBackgroundColor: "#c8972a" }],
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false } }, y: { min: 38.9, max: 39.6, grid: { color: "rgba(0,0,0,.04)" } } } },
      });
    }
    return () => chartInst.current?.destroy();
  }, []);

  return (
    <div>
      <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
        <KpiCard label="Tasa BCV Hoy" value={TASA_HOY.toFixed(2)} sub="Bs. / USD" variant="gold" />
        <KpiCard label="Tasa Paralela Ref." value="41.20" sub="Referencial" variant="blue" />
        <KpiCard label="Variación Mensual" value="+1.83%" sub="vs cierre anterior" variant="green" />
      </div>
      <div className="two-col">
        <div className="card">
          <div className="card-header">
            <div className="card-title">Histórico de Tasas BCV</div>
            <button className="btn btn-outline btn-sm" onClick={() => openModal("tasa")}>+ Registrar Tasa</button>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Fecha</th><th className="text-right">Tasa Bs./USD</th><th className="text-right">Variación</th><th>Fuente</th></tr></thead>
              <tbody>
                {TASAS.map((t) => (
                  <tr key={t.fecha}>
                    <td>{t.fecha}</td>
                    <td className="text-right mono">{t.tasa}</td>
                    <td className={`text-right mono ${t.var.startsWith("+") ? "text-green" : "text-red"}`}>{t.var}</td>
                    <td><Badge variant="blue">{t.fuente}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card">
          <div className="card-header"><div className="card-title">Evolución Tasa (7 días)</div></div>
          <div style={{ position: "relative", height: 220 }}>
            <canvas ref={chartRef} aria-label="Evolución tasa de cambio" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  SECCIÓN: TIPOS DE MOVIMIENTO
// ─────────────────────────────────────────────
function SectionTipos({ openModal }) {
  const [filtro, setFiltro] = useState("todos");
  const chartRef = useRef(null);
  const chartInst = useRef(null);

  const filtered = filtro === "todos" ? TIPOS : TIPOS.filter((t) => t.nat === filtro);

  useEffect(() => {
    if (chartRef.current) {
      chartInst.current?.destroy();
      chartInst.current = new ChartJS(chartRef.current, {
        type: "bar",
        data: {
          labels: TIPOS.map((t) => t.desc),
          datasets: [{ label: "Registros", data: [12, 4, 18, 6, 9, 3], backgroundColor: TIPOS.map((t) => t.nat === "ingreso" ? "#1a7d5a" : "#c0392b"), borderRadius: 4 }],
        },
        options: { responsive: true, maintainAspectRatio: false, indexAxis: "y", plugins: { legend: { display: false } }, scales: { x: { grid: { color: "rgba(0,0,0,.04)" } }, y: { grid: { display: false }, ticks: { font: { size: 11 } } } } },
      });
    }
    return () => chartInst.current?.destroy();
  }, []);

  return (
    <div className="two-col">
      <div className="card">
        <div className="card-header">
          <div className="card-title">Catálogo de Conceptos</div>
          <button className="btn btn-primary btn-sm" onClick={() => openModal("tipo")}>+ Nuevo Tipo</button>
        </div>
        <div className="tab-bar">
          {["todos","ingreso","egreso"].map((f) => (
            <button key={f} className={`tab ${filtro === f ? "active" : ""}`} onClick={() => setFiltro(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Código</th><th>Descripción</th><th>Naturaleza</th><th>Ret. IVA</th><th>Cuenta PUC</th></tr></thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.cod}>
                  <td className="mono" style={{ fontSize: 12 }}>{t.cod}</td>
                  <td>{t.desc}</td>
                  <td><Badge variant={t.nat === "ingreso" ? "green" : "red"}>{t.nat.charAt(0).toUpperCase() + t.nat.slice(1)}</Badge></td>
                  <td>{t.retIVA === "Sí" ? <Badge variant="gold">Sí</Badge> : "—"}</td>
                  <td className="mono" style={{ fontSize: 12 }}>{t.puc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="card">
        <div className="card-header"><div className="card-title">Uso por Tipo (mes actual)</div></div>
        <div style={{ position: "relative", height: 260 }}>
          <canvas ref={chartRef} aria-label="Uso por tipo de movimiento" />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  SECCIÓN: CHEQUERAS
// ─────────────────────────────────────────────
function SectionChequeras({ openModal }) {
  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">Registro de Chequeras</div>
        <button className="btn btn-primary btn-sm" onClick={() => openModal("chequera")}>+ Nueva Chequera</button>
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Banco / Cuenta</th><th>Serie</th><th>Folio Inicial</th><th>Folio Final</th><th>Folio Actual</th><th className="text-right">Usados</th><th>Estado</th></tr></thead>
          <tbody>
            {CHEQUERAS.map((c, i) => {
              const pct = Math.round((c.usados / (c.fin - c.ini + 1)) * 100);
              return (
                <tr key={i}>
                  <td><strong>{c.banco}</strong></td>
                  <td className="mono">{c.serie}</td>
                  <td className="mono text-center">{String(c.ini).padStart(3,"0")}</td>
                  <td className="mono text-center">{String(c.fin).padStart(3,"0")}</td>
                  <td className="mono text-center">{String(c.actual).padStart(3,"0")}</td>
                  <td className="text-right mono">{c.usados} / {c.fin - c.ini + 1} <span style={{ color:"var(--muted)", fontSize:11 }}>({pct}%)</span></td>
                  <td><Badge variant={c.estado === "Activa" ? "green" : c.estado === "Nueva" ? "blue" : "gold"}>{c.estado}</Badge></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  SECCIÓN: MOVIMIENTOS
// ─────────────────────────────────────────────
function SectionMovimientos({ openModal }) {
  return (
    <div>
      <div className="filter-bar">
        <div className="search-bar">
          <span className="search-icon">⌕</span>
          <input className="search-input" placeholder="Buscar por concepto, cuenta, monto..." />
        </div>
        <select className="form-control" style={{ width: 160 }}>
          <option>Todas las cuentas</option>
          {CUENTAS.map((c) => <option key={c.banco}>{c.banco}</option>)}
        </select>
        <select className="form-control" style={{ width: 140 }}>
          <option>Todos los tipos</option>
          <option>Ingresos</option>
          <option>Egresos</option>
        </select>
        <button className="btn btn-gold" onClick={() => openModal("movimiento")}>+ Registrar</button>
      </div>
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Libro de Movimientos</div>
            <div className="card-subtitle">Ingresos y egresos bancarios del período</div>
          </div>
          <button className="btn btn-outline btn-sm">↓ Exportar</button>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Fecha</th><th>N° Doc.</th><th>Concepto</th><th>Cuenta</th><th>Mon.</th><th className="text-right">Monto</th><th className="text-right">Equiv. Bs.</th><th>Ret. IVA</th><th>Ret. ISLR</th><th>Estado</th></tr></thead>
            <tbody>
              {MOVIMIENTOS.map((m) => (
                <tr key={m.doc}>
                  <td style={{ whiteSpace:"nowrap" }}>{m.fecha}</td>
                  <td className="mono" style={{ fontSize:12 }}>{m.doc}</td>
                  <td>{m.concepto}</td>
                  <td style={{ whiteSpace:"nowrap" }}>{m.cuenta}</td>
                  <td><span className={`tag ${m.moneda === "USD" ? "tag-usd" : "tag-bs"}`}>{m.moneda}</span></td>
                  <td className={`text-right mono ${m.tipo === "ingreso" ? "text-green" : "text-red"}`}>
                    {m.tipo === "ingreso" ? "+" : "−"}{m.moneda === "USD" ? "$" : "Bs."} {fmt(m.monto)}
                  </td>
                  <td className="text-right mono">Bs. {fmt(m.equiv)}</td>
                  <td style={{ fontSize:12 }}>{m.retIVA}</td>
                  <td style={{ fontSize:12 }}>{m.retISLR}</td>
                  <td><Badge variant="green">{m.estado}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  SECCIÓN: VALES
// ─────────────────────────────────────────────
function SectionVales({ openModal }) {
  const pendientes = VALES.filter((v) => v.estado === "Pendiente");
  const totalPend = pendientes.reduce((a, v) => a + v.monto, 0);

  return (
    <div>
      <div className="kpi-grid" style={{ gridTemplateColumns:"repeat(3,1fr)" }}>
        <KpiCard label="Vales Emitidos (mes)" value="8" sub="Total compromisos" variant="blue" />
        <KpiCard label="Pendientes" value={pendientes.length} sub={`Sin liquidar · Bs. ${fmt(totalPend)}`} variant="red" />
        <KpiCard label="Liquidados" value={VALES.length - pendientes.length} sub="Este período" variant="green" />
      </div>
      <div className="two-col">
        <div className="card">
          <div className="card-header">
            <div className="card-title">Vales y Caja Principal</div>
            <div style={{ display:"flex", gap:8 }}>
              <button className="btn btn-outline btn-sm" onClick={() => openModal("vale")}>+ Emitir Vale</button>
              <button className="btn btn-gold btn-sm" onClick={() => openModal("liquidar")}>Liquidar Vale</button>
            </div>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>N° Vale</th><th>Fecha</th><th>Beneficiario</th><th>Concepto</th><th className="text-right">Monto Bs.</th><th>Tipo</th><th>Estado</th><th></th></tr></thead>
              <tbody>
                {VALES.map((v) => (
                  <tr key={v.num}>
                    <td className="mono" style={{ fontSize:12 }}>{v.num}</td>
                    <td>{v.fecha}</td>
                    <td>{v.beneficiario}</td>
                    <td>{v.concepto}</td>
                    <td className="text-right mono">Bs. {fmt(v.monto)}</td>
                    <td><Badge variant={v.tipo === "egreso" ? "red" : "green"}>{v.tipo}</Badge></td>
                    <td><Badge variant={v.estado === "Pendiente" ? "gold" : "green"}>{v.estado}</Badge></td>
                    <td>{v.estado === "Pendiente" && <button className="btn btn-sm btn-outline" onClick={() => openModal("liquidar")}>Liquidar</button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card">
          <div className="card-header"><div className="card-title">Saldo Caja Principal</div></div>
          <div className="caja-banner">
            <div className="caja-banner-label">Saldo Disponible</div>
            <div className="caja-banner-value">Bs. 48,350.00</div>
            <div className="caja-banner-date">Actualizado · 26/04/2026 · 09:14 AM</div>
          </div>
          {[
            ["Saldo apertura hoy","Bs. 55,000.00",null],
            ["Ingresos del día","+ Bs. 12,350.00","green"],
            ["Egresos del día","− Bs. 19,000.00","red"],
            ["Vales pendientes","− Bs. 23,100.00","red"],
          ].map(([k,v,c]) => (
            <div key={k} className="info-row">
              <span className="info-key">{k}</span>
              <span className={`mono ${c ? `text-${c}` : ""}`}>{v}</span>
            </div>
          ))}
          <div className="info-row" style={{ borderTop:"2px solid var(--border)", marginTop:4, paddingTop:12 }}>
            <strong>Posición Neta</strong>
            <strong className="mono">Bs. 25,250.00</strong>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  SECCIÓN: TRANSFERENCIAS
// ─────────────────────────────────────────────
function SectionTransferencias({ openModal }) {
  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">Transferencias entre Cuentas Propias</div>
        <button className="btn btn-gold" onClick={() => openModal("transferencia")}>+ Nueva Transferencia</button>
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Fecha</th><th>N° Op.</th><th>Cuenta Origen</th><th>Cuenta Destino</th><th className="text-right">Monto</th><th>Tasa</th><th className="text-right">Equiv. Bs.</th><th>Estado</th></tr></thead>
          <tbody>
            {TRANSFERENCIAS.map((t) => (
              <tr key={t.op}>
                <td>{t.fecha}</td>
                <td className="mono" style={{ fontSize:12 }}>{t.op}</td>
                <td>{t.origen}</td>
                <td>{t.destino}</td>
                <td className="text-right mono">{t.monto}</td>
                <td className="mono">{t.tasa}</td>
                <td className="text-right mono">{t.equiv}</td>
                <td><Badge variant="green">{t.estado}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  SECCIÓN: CONCILIACIÓN
// ─────────────────────────────────────────────
function SectionConciliacion() {
  return (
    <div className="two-col">
      <div className="card">
        <div className="card-header">
          <div><div className="card-title">Conciliación Bancaria</div><div className="card-subtitle">Banesco USD · Período: Abril 2026</div></div>
          <select className="form-control" style={{ width:180 }}><option>Banesco USD</option><option>Mercantil Bs.</option><option>BNC Bs.</option></select>
        </div>
        <div className="concil-status concil-ok">✓ 23 movimientos conciliados correctamente</div>
        <div className="concil-status concil-pending">⚠ 2 movimientos pendientes de cruce</div>
        <div className="table-wrap" style={{ marginTop:16 }}>
          <table>
            <thead><tr><th>Fecha</th><th>Descripción</th><th className="text-right">Banco</th><th className="text-right">Sistema</th><th>Estado</th></tr></thead>
            <tbody>
              {CONCIL.map((c, i) => (
                <tr key={i}>
                  <td>{c.fecha}</td>
                  <td>{c.desc}</td>
                  <td className="text-right mono">{c.banco}</td>
                  <td className="text-right mono">{c.sistema}</td>
                  <td><Badge variant={c.estado === "ok" ? "green" : "gold"}>{c.estado === "ok" ? "Conciliado" : "Pendiente"}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="card">
        <div className="card-header"><div className="card-title">Resumen de Conciliación</div></div>
        {[["Saldo según banco","$ 28,450.00",null],["Saldo según sistema","$ 32,545.80",null],["Cheques en tránsito","− $ 4,095.80","red"],["Diferencia ajustada","$ 0.00","green"]].map(([k,v,c],i)=>(
          <div key={k} className="info-row" style={i===3?{borderTop:"2px solid var(--border)",marginTop:4,paddingTop:12}:{}}>
            {i===3?<strong>{k}</strong>:<span className="info-key">{k}</span>}
            {i===3?<strong className={`mono ${c?"text-"+c:""}`}>{v}</strong>:<span className={`mono ${c?"text-"+c:""}`}>{v}</span>}
          </div>
        ))}
        <button className="btn btn-primary" style={{ width:"100%", justifyContent:"center", marginTop:20 }}>Importar Extracto Bancario</button>
        <button className="btn btn-outline" style={{ width:"100%", justifyContent:"center", marginTop:10 }}>Generar Informe PDF</button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  SECCIÓN: ARQUEO
// ─────────────────────────────────────────────
function SectionArqueo({ openModal }) {
  const DENOMS = [200,100,50,20,10,5];
  const PIEZAS = [30,85,63,150,200,100];
  const total = DENOMS.reduce((a, d, i) => a + d * PIEZAS[i], 0);
  const pendientes = VALES.filter((v) => v.estado === "Pendiente");

  return (
    <div className="two-col">
      <div className="card">
        <div className="card-header">
          <div className="card-title">Arqueo de Caja Principal</div>
          <button className="btn btn-gold" onClick={() => openModal("arqueo")}>Iniciar Arqueo</button>
        </div>
        <div className="alert-gold">
          <div style={{ fontSize:11, fontWeight:600, marginBottom:4 }}>Último Arqueo Realizado</div>
          <div style={{ fontSize:13 }}>25/04/2026 · 06:00 PM · Por: Admin General</div>
          <div className="mono" style={{ fontSize:18, marginTop:6 }}>Bs. 55,000.00 <span style={{ fontSize:12, fontWeight:400 }}>sin diferencia</span></div>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Denominación</th><th className="text-right">Piezas</th><th className="text-right">Subtotal Bs.</th></tr></thead>
            <tbody>
              {DENOMS.map((d,i) => (
                <tr key={d}><td>Bs. {d}</td><td className="text-right mono">{PIEZAS[i]}</td><td className="text-right mono">Bs. {fmt(d*PIEZAS[i])}</td></tr>
              ))}
            </tbody>
            <tfoot>
              <tr><td colSpan={2} style={{ fontWeight:600, padding:"11px 12px" }}>Total Contado</td><td className="text-right mono" style={{ fontWeight:600, padding:"11px 12px", color:"var(--navy)" }}>Bs. {fmt(total)}</td></tr>
            </tfoot>
          </table>
        </div>
      </div>
      <div className="card">
        <div className="card-header"><div className="card-title">Vales Pendientes de Justificar</div></div>
        {pendientes.map((v) => (
          <div key={v.num} className="info-row" style={{ padding:"10px 0" }}>
            <div><div style={{ fontWeight:500, fontSize:13 }}>{v.num} — {v.beneficiario}</div><div style={{ fontSize:11, color:"var(--muted)" }}>{v.concepto} · {v.fecha}</div></div>
            <div className="mono text-red" style={{ fontSize:13 }}>Bs. {fmt(v.monto)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  SECCIÓN: REPORTES
// ─────────────────────────────────────────────
function SectionReportes() {
  const [tab, setTab] = useState("flujo");
  const proyRef = useRef(null);
  const proyInst = useRef(null);

  useEffect(() => {
    if (tab === "flujo" && proyRef.current) {
      setTimeout(() => {
        if (!proyRef.current) return;
        proyInst.current?.destroy();
        proyInst.current = new ChartJS(proyRef.current, {
          type: "line",
          data: {
            labels: ["Hoy","3 May","10 May","15 May","20 May","26 May"],
            datasets: [{ label: "Liquidez", data: [1309642,1309642,1404642,1333596,1236796,1165750], borderColor:"#0d1b2e", backgroundColor:"rgba(13,27,46,.05)", tension:0.4, fill:true, pointRadius:4, pointBackgroundColor:"#c8972a", pointBorderColor:"#fff", pointBorderWidth:2 }],
          },
          options: { responsive:true, maintainAspectRatio:false, plugins:{ legend:{ display:false } }, scales:{ x:{ grid:{ display:false } }, y:{ grid:{ color:"rgba(0,0,0,.04)" }, ticks:{ callback:(v)=>"Bs."+(v/1000).toFixed(0)+"k" } } } },
        });
      }, 50);
    }
    return () => proyInst.current?.destroy();
  }, [tab]);

  return (
    <div>
      <div className="tab-bar">
        {[["flujo","Flujo Proyectado"],["libro","Libro Auxiliar"],["multimoneda","Multimoneda"]].map(([k,l])=>(
          <button key={k} className={`tab ${tab===k?"active":""}`} onClick={()=>setTab(k)}>{l}</button>
        ))}
      </div>

      {tab === "flujo" && (
        <div>
          <div className="kpi-grid" style={{ gridTemplateColumns:"repeat(3,1fr)" }}>
            <KpiCard label="Cobros próx. 30 días" value="284,500" sub="4 facturas por cobrar" variant="green" />
            <KpiCard label="Pagos próx. 30 días" value="198,200" sub="6 obligaciones" variant="red" />
            <KpiCard label="Liquidez Proyectada" value="1,395,942" sub="Estimado al 26/05/2026" variant="gold" />
          </div>
          <div className="card">
            <div className="card-header"><div className="card-title">Flujo Proyectado — Próximos 30 días</div></div>
            <div style={{ position:"relative", height:260 }}><canvas ref={proyRef} aria-label="Flujo proyectado" /></div>
          </div>
          <div className="card">
            <div className="card-header"><div className="card-title">Compromisos por Vencer</div></div>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Vencimiento</th><th>Entidad</th><th>Concepto</th><th>Tipo</th><th className="text-right">Monto Bs.</th></tr></thead>
                <tbody>
                  {PROYECTADO.map((p, i) => (
                    <tr key={i}>
                      <td>{p.fecha}</td><td>{p.entidad}</td><td>{p.concepto}</td>
                      <td><Badge variant={p.tipo==="ingreso"?"green":"red"}>{p.tipo==="ingreso"?"Por cobrar":"Por pagar"}</Badge></td>
                      <td className={`text-right mono ${p.tipo==="ingreso"?"text-green":"text-red"}`}>{p.tipo==="ingreso"?"+":"−"} Bs. {fmt(p.monto)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === "libro" && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">Libro Auxiliar de Bancos</div>
            <div style={{ display:"flex", gap:8 }}>
              <select className="form-control" style={{ width:180 }}><option>Mercantil Bs.</option><option>Banesco USD</option><option>BNC Bs.</option></select>
              <button className="btn btn-outline btn-sm">↓ Exportar</button>
            </div>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Fecha</th><th>N° Doc.</th><th>Descripción</th><th className="text-right">Débito</th><th className="text-right">Crédito</th><th className="text-right">Saldo</th></tr></thead>
              <tbody>
                {LIBRO.map((l) => (
                  <tr key={l.doc}>
                    <td>{l.fecha}</td><td className="mono" style={{ fontSize:12 }}>{l.doc}</td><td>{l.desc}</td>
                    <td className="text-right mono text-red">{l.debito !== "—" ? l.debito : "—"}</td>
                    <td className="text-right mono text-green">{l.credito !== "—" ? l.credito : "—"}</td>
                    <td className="text-right mono" style={{ fontWeight:500 }}>Bs. {l.saldo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "multimoneda" && (
        <div className="card">
          <div className="card-header"><div className="card-title">Diferencial Cambiario del Período</div></div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Documento</th><th>Tasa Origen</th><th>Tasa Liquidación</th><th className="text-right">Monto USD</th><th className="text-right">Diferencial Bs.</th><th>Tipo</th></tr></thead>
              <tbody>
                {DIFERENCIAL.map((d) => (
                  <tr key={d.doc}>
                    <td className="mono" style={{ fontSize:12 }}>{d.doc}</td>
                    <td className="mono">{d.tasaOrigen}</td>
                    <td className="mono">{d.tasaLiq}</td>
                    <td className="text-right mono">{d.monto}</td>
                    <td className={`text-right mono ${d.tipo==="Ganancia"?"text-green":"text-red"}`}>Bs. {d.difBs}</td>
                    <td><Badge variant={d.tipo==="Ganancia"?"green":"red"}>{d.tipo}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
//  MODALES
// ─────────────────────────────────────────────
function ModalMovimiento({ open, onClose }) {
  const [moneda, setMoneda] = useState("bs");
  return (
    <Modal title="Registrar Movimiento Bancario" open={open} onClose={onClose}
      footer={<><button className="btn btn-outline" onClick={onClose}>Cancelar</button><button className="btn btn-gold" onClick={onClose}>Guardar Movimiento</button></>}>
      <div className="form-grid">
        <FormGroup label="Fecha"><input type="date" className="form-control" defaultValue="2026-04-26" /></FormGroup>
        <FormGroup label="Tipo de Movimiento"><select className="form-control"><option value="">Seleccionar...</option><option>Ingreso</option><option>Egreso</option></select></FormGroup>
        <div className="form-group" style={{ gridColumn:"1/-1" }}><label className="form-label">Concepto</label>
          <select className="form-control"><option>Cobro de factura</option><option>Pago a proveedor</option><option>Comisión bancaria</option><option>Pago de nómina</option></select>
        </div>
        <FormGroup label="Cuenta Bancaria"><select className="form-control"><option>Banesco USD</option><option>Mercantil Bs.</option><option>BNC Bs.</option><option>Caja Principal</option></select></FormGroup>
        <FormGroup label="Moneda"><select className="form-control" value={moneda} onChange={(e)=>setMoneda(e.target.value)}><option value="bs">Bolívares (Bs.)</option><option value="usd">Dólares (USD)</option></select></FormGroup>
        <FormGroup label="Monto"><input type="number" className="form-control" placeholder="0.00" /></FormGroup>
        {moneda === "usd" && <FormGroup label="Tasa de Cambio"><input type="number" className="form-control" defaultValue="39.47" /></FormGroup>}
        <hr className="form-divider" />
        <FormGroup label="Retención IVA (16%)"><select className="form-control"><option>No aplica</option><option>Aplica (75%)</option></select></FormGroup>
        <FormGroup label="Retención ISLR"><select className="form-control"><option>No aplica</option><option>2%</option><option>3%</option><option>5%</option></select></FormGroup>
        <div className="form-group" style={{ gridColumn:"1/-1" }}><label className="form-label">Descripción / Referencia</label><input type="text" className="form-control" placeholder="Nro. factura, referencia bancaria..." /></div>
      </div>
    </Modal>
  );
}

function ModalCuenta({ open, onClose }) {
  return (
    <Modal title="Nueva Cuenta Bancaria" open={open} onClose={onClose}
      footer={<><button className="btn btn-outline" onClick={onClose}>Cancelar</button><button className="btn btn-primary" onClick={onClose}>Crear Cuenta</button></>}>
      <div className="form-grid">
        <FormGroup label="Banco"><select className="form-control"><option>Banesco</option><option>Mercantil</option><option>BNC</option><option>Venezuela</option><option>Exterior (Internacional)</option></select></FormGroup>
        <FormGroup label="Tipo"><select className="form-control"><option>Corriente</option><option>Ahorro</option><option>Internacional</option><option>Caja Principal</option></select></FormGroup>
        <div className="form-group" style={{ gridColumn:"1/-1" }}><label className="form-label">Número de Cuenta</label><input className="form-control" placeholder="0134-xxxx-xx-xxxxxxxxxx" /></div>
        <FormGroup label="Moneda"><select className="form-control"><option>Bs. (VES)</option><option>USD</option><option>EUR</option></select></FormGroup>
        <FormGroup label="Cuenta PUC"><input className="form-control" placeholder="1.1.01.01.001" /></FormGroup>
        <FormGroup label="Saldo Inicial"><input type="number" className="form-control" placeholder="0.00" /></FormGroup>
        <FormGroup label="Fecha Apertura"><input type="date" className="form-control" /></FormGroup>
      </div>
    </Modal>
  );
}

function ModalTasa({ open, onClose }) {
  return (
    <Modal title="Registrar Tasa de Cambio" open={open} onClose={onClose} width={380}
      footer={<><button className="btn btn-outline" onClick={onClose}>Cancelar</button><button className="btn btn-gold" onClick={onClose}>Guardar</button></>}>
      <div className="form-grid">
        <FormGroup label="Fecha"><input type="date" className="form-control" /></FormGroup>
        <FormGroup label="Moneda"><select className="form-control"><option>USD</option><option>EUR</option></select></FormGroup>
        <div className="form-group" style={{ gridColumn:"1/-1" }}><label className="form-label">Tasa BCV (Bs. / divisa)</label><input type="number" className="form-control" placeholder="39.47" step="0.01" /></div>
        <div className="form-group" style={{ gridColumn:"1/-1" }}><label className="form-label">Tasa Paralela (opcional)</label><input type="number" className="form-control" placeholder="41.20" step="0.01" /></div>
      </div>
    </Modal>
  );
}

function ModalVale({ open, onClose }) {
  return (
    <Modal title="Emitir Vale de Caja" open={open} onClose={onClose}
      footer={<><button className="btn btn-outline" onClick={onClose}>Cancelar</button><button className="btn btn-gold" onClick={onClose}>Emitir Vale</button></>}>
      <div className="form-grid">
        <FormGroup label="Fecha Emisión"><input type="date" className="form-control" /></FormGroup>
        <FormGroup label="Tipo de Vale"><select className="form-control"><option>Egreso (Salida)</option><option>Ingreso (Entrada)</option></select></FormGroup>
        <div className="form-group" style={{ gridColumn:"1/-1" }}><label className="form-label">Beneficiario / Solicitante</label><input className="form-control" placeholder="Nombre del empleado o proveedor" /></div>
        <div className="form-group" style={{ gridColumn:"1/-1" }}><label className="form-label">Concepto</label><select className="form-control"><option>Anticipo de viáticos</option><option>Solicitud de efectivo</option><option>Anticipo de nómina</option><option>Compra menor</option></select></div>
        <FormGroup label="Monto Bs."><input type="number" className="form-control" placeholder="0.00" /></FormGroup>
        <FormGroup label="Fecha Límite"><input type="date" className="form-control" /></FormGroup>
        <div className="form-group" style={{ gridColumn:"1/-1" }}><label className="form-label">Observaciones</label><input className="form-control" placeholder="Descripción adicional..." /></div>
      </div>
      <div className="alert-gold" style={{ marginTop:12 }}>
        ⚠ El vale quedará en estado <strong>Pendiente</strong> y no afectará el saldo real de Caja Principal hasta su liquidación.
      </div>
    </Modal>
  );
}

function ModalLiquidar({ open, onClose }) {
  return (
    <Modal title="Liquidar Vale" open={open} onClose={onClose} width={420}
      footer={<><button className="btn btn-outline" onClick={onClose}>Cancelar</button><button className="btn btn-gold" onClick={onClose}>Liquidar y Ejecutar</button></>}>
      <FormGroup label="Seleccionar Vale">
        <select className="form-control">
          {VALES.filter((v)=>v.estado==="Pendiente").map((v)=><option key={v.num}>{v.num} · {v.concepto} · Bs. {fmt(v.monto)}</option>)}
        </select>
      </FormGroup>
      <div style={{ background:"var(--surface)", borderRadius:"var(--radius)", padding:14, margin:"16px 0" }}>
        <div className="info-row"><span className="info-key">Monto Emitido</span><span className="mono">Bs. 8,000.00</span></div>
        <div className="info-row"><span className="info-key">Monto Justificado</span><input type="number" className="form-control" placeholder="Bs. 0.00" style={{ width:140, textAlign:"right" }} /></div>
        <div className="info-row"><span className="info-key">Devolución a Caja</span><span className="mono text-green">Bs. 8,000.00</span></div>
      </div>
      <FormGroup label="Soporte / Comprobante"><input type="text" className="form-control" placeholder="Nro. factura o recibo..." /></FormGroup>
    </Modal>
  );
}

function ModalTransferencia({ open, onClose }) {
  return (
    <Modal title="Nueva Transferencia entre Cuentas" open={open} onClose={onClose}
      footer={<><button className="btn btn-outline" onClick={onClose}>Cancelar</button><button className="btn btn-gold" onClick={onClose}>Ejecutar Transferencia</button></>}>
      <div className="form-grid">
        <FormGroup label="Fecha"><input type="date" className="form-control" /></FormGroup>
        <FormGroup label="N° Operación"><input className="form-control" placeholder="TRF-0034" /></FormGroup>
        <FormGroup label="Cuenta Origen"><select className="form-control"><option>Banesco USD</option><option>Mercantil Bs.</option><option>BNC Bs.</option><option>Caja Principal</option></select></FormGroup>
        <FormGroup label="Cuenta Destino"><select className="form-control"><option>Mercantil Bs.</option><option>Banesco USD</option><option>BNC Bs.</option><option>Caja Principal</option></select></FormGroup>
        <FormGroup label="Monto"><input type="number" className="form-control" placeholder="0.00" /></FormGroup>
        <FormGroup label="Tasa (si aplica)"><input type="number" className="form-control" defaultValue="39.47" /></FormGroup>
        <div className="form-group" style={{ gridColumn:"1/-1" }}><label className="form-label">Referencia Bancaria</label><input className="form-control" placeholder="Número de comprobante..." /></div>
      </div>
    </Modal>
  );
}

// ─────────────────────────────────────────────
//  NAVEGACIÓN — configuración
// ─────────────────────────────────────────────
const NAV = [
  { section: null, label: "Panel", items: [
    { id:"dashboard", label:"Dashboard" },
  ]},
  { section: "Configuración", items: [
    { id:"cuentas",  label:"Cuentas Bancarias" },
    { id:"tasas",    label:"Tasas de Cambio" },
    { id:"tipos",    label:"Tipos de Movimiento" },
    { id:"chequeras",label:"Chequeras" },
  ]},
  { section: "Operativa", items: [
    { id:"movimientos",    label:"Ingresos / Egresos" },
    { id:"vales",          label:"Vales y Caja", badge:3 },
    { id:"transferencias", label:"Transferencias" },
  ]},
  { section: "Control", items: [
    { id:"conciliacion", label:"Conciliación" },
    { id:"arqueo",       label:"Arqueo de Caja" },
  ]},
  { section: "Reportes", items: [
    { id:"reportes", label:"Analítica & BI" },
  ]},
];

const TITLES = {
  dashboard:"Dashboard — Posición de Caja",
  cuentas:"Gestión de Cuentas Bancarias",
  tasas:"Control de Tasas de Cambio",
  tipos:"Tipos de Movimiento",
  chequeras:"Gestión de Chequeras",
  movimientos:"Ingresos y Egresos Bancarios",
  vales:"Vales y Caja Principal",
  transferencias:"Transferencias entre Cuentas",
  conciliacion:"Conciliación Bancaria",
  arqueo:"Arqueo de Caja Principal",
  reportes:"Analítica Financiera (BI)",
};

// ─────────────────────────────────────────────
//  APP ROOT
// ─────────────────────────────────────────────
export default function App() {
  const [active, setActive] = useState("dashboard");
  const [modals, setModals] = useState({});

  const openModal  = useCallback((k) => setModals((m) => ({ ...m, [k]: true })),  []);
  const closeModal = useCallback((k) => setModals((m) => ({ ...m, [k]: false })), []);

  const sections = {
    dashboard:      <SectionDashboard   openModal={openModal} />,
    cuentas:        <SectionCuentas     openModal={openModal} />,
    tasas:          <SectionTasas       openModal={openModal} />,
    tipos:          <SectionTipos       openModal={openModal} />,
    chequeras:      <SectionChequeras   openModal={openModal} />,
    movimientos:    <SectionMovimientos openModal={openModal} />,
    vales:          <SectionVales       openModal={openModal} />,
    transferencias: <SectionTransferencias openModal={openModal} />,
    conciliacion:   <SectionConciliacion />,
    arqueo:         <SectionArqueo      openModal={openModal} />,
    reportes:       <SectionReportes />,
  };

  return (
    <div className="erp-layout">
      {/* ── SIDEBAR ── */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-mark">Servicios Jiret G&amp;B</div>
          <div className="logo-sub">Supply ERP · Módulo Banco</div>
        </div>
        {NAV.map((group) => (
          <div key={group.section || "panel"}>
            {group.section && <div className="sidebar-section">{group.section}</div>}
            {group.items.map((item) => (
              <div key={item.id} className={`nav-item ${active === item.id ? "active" : ""}`} onClick={() => setActive(item.id)}>
                {item.label}
                {item.badge && <span className="nav-badge">{item.badge}</span>}
              </div>
            ))}
          </div>
        ))}
        <div className="sidebar-bottom">
          <div className="user-card">
            <div className="user-avatar">AG</div>
            <div>
              <div className="user-name">Admin General</div>
              <div className="user-role">Tesorero Principal</div>
            </div>
          </div>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main className="main">
        <div className="topbar">
          <div>
            <div className="topbar-title">{TITLES[active]}</div>
            <div className="topbar-breadcrumb">Banco &rsaquo; <span>{TITLES[active]}</span></div>
          </div>
          <div className="topbar-right">
            <div className="tasa-pill">
              <div className="tasa-dot" />
              BCV Hoy: Bs. <strong>{TASA_HOY}</strong> / USD
            </div>
            <button className="btn btn-gold btn-sm" onClick={() => openModal("movimiento")}>+ Movimiento</button>
          </div>
        </div>
        <div className="content">{sections[active]}</div>
      </main>

      {/* ── MODALES ── */}
      <ModalMovimiento    open={!!modals.movimiento}    onClose={() => closeModal("movimiento")} />
      <ModalCuenta        open={!!modals.cuenta}        onClose={() => closeModal("cuenta")} />
      <ModalTasa          open={!!modals.tasa}          onClose={() => closeModal("tasa")} />
      <ModalVale          open={!!modals.vale}          onClose={() => closeModal("vale")} />
      <ModalLiquidar      open={!!modals.liquidar}      onClose={() => closeModal("liquidar")} />
      <ModalTransferencia open={!!modals.transferencia} onClose={() => closeModal("transferencia")} />
    </div>
  );
}

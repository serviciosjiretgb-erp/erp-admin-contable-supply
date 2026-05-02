import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, Building2, TrendingUp, List, BookOpen,
  ArrowLeftRight, Wallet, ArrowRightLeft, Scale, Calculator,
  BarChart3, Plus, X, Search, ChevronRight, AlertTriangle,
  CheckCircle, Clock, DollarSign, Download, Trash2,
  Banknote, PiggyBank, FileText, LineChart, Landmark,
  TrendingDown, Receipt, Package, ShoppingCart, Globe,
  Users, ArrowLeft, Blocks, FileSpreadsheet, BookText,
  Briefcase, Upload, ShieldCheck, UserPlus, Save, LogOut,
  Settings, Home, Factory, Lock, User, ArrowRight,
  Mail, CreditCard, CalendarDays, MapPin, Key, PieChart,
  Tag, Layers, ArrowUpCircle, ArrowDownCircle, RefreshCw,
  BookMarked, Coins, BadgeDollarSign, Inbox, Send, Eye, EyeOff
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import {
  getFirestore, collection, doc, setDoc, updateDoc,
  onSnapshot, deleteDoc, query, orderBy, serverTimestamp, writeBatch
} from 'firebase/firestore';

// ============================================================================
// ERROR BOUNDARY
// ============================================================================
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, errorMsg: '' }; }
  static getDerivedStateFromError(error) { return { hasError: true }; }
  componentDidCatch(error) { this.setState({ errorMsg: error?.message || String(error) }); }
  render() {
    if (this.state.hasError) return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6">
        <AlertTriangle size={60} className="text-red-500 mb-4" />
        <h2 className="text-2xl font-black text-black uppercase mb-2">Sistema Protegido de Caída</h2>
        <p className="text-gray-500 text-sm mb-6">{this.state.errorMsg}</p>
        <button onClick={() => window.location.reload()} className="bg-black text-white font-black px-8 py-4 rounded-xl uppercase tracking-widest text-xs shadow-lg">Recargar Interfaz</button>
      </div>
    );
    return this.props.children;
  }
}

// ============================================================================
// FIREBASE CONFIG
// ============================================================================
const firebaseConfig = {
  apiKey: "AIzaSyBri2uZAaxsH4S0OpqhYvXB4wfCqo4g3sk", authDomain: "erp-gyb-supply.firebaseapp.com",
  projectId: "erp-gyb-supply", storageBucket: "erp-gyb-supply.firebasestorage.app",
  messagingSenderId: "201939139821", appId: "1:201939139821:web:95e5f589e546d7d557e0e4",
};
const fbApp = initializeApp(firebaseConfig, 'erp_master');
const auth = getAuth(fbApp);
const db = getFirestore(fbApp, "us-central");
const dref = (n, id) => doc(db, n, String(id));
const col = (n) => collection(db, n);

// ============================================================================
// UTILITIES
// ============================================================================
const fmt = (n) => new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(n) || 0);
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const dd = (s) => { if (!s) return '—'; const [y, m, d] = s.split('-'); return `${d}/${m}/${y}`; };
const gid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const mesActual = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; };

// ============================================================================
// DESIGN TOKENS & SHARED COMPONENTS
// ============================================================================
const DARK = '#000000';
const ORANGE = '#f97316';
const BLUE = '#3b82f6';
const BG = '#ffffff';

// ── Letterhead PDF generator ────────────────────────────────────────────────
const LETTERHEAD_CSS = `
  body{font-family:Arial,sans-serif;margin:0;padding:0;color:#1e293b;font-size:11px}
  .lh-header{background:#000;color:#fff;padding:14px 24px;display:flex;justify-content:space-between;align-items:center;border-bottom:4px solid #f97316}
  .lh-logo{display:flex;align-items:center;gap:4px}
  .lh-logo .g{font-size:26px;font-weight:900;color:#fff;line-height:1}
  .lh-logo .amp{background:#f97316;color:#fff;border-radius:50%;width:18px;height:18px;display:inline-flex;align-items:center;justify-content:center;font-size:12px;font-weight:900;margin:0 2px}
  .lh-logo .b{font-size:26px;font-weight:900;color:#fff;line-height:1}
  .lh-logo .supply{font-size:14px;font-weight:300;letter-spacing:4px;color:#d1d5db;margin-right:4px}
  .lh-company{text-align:right;font-size:9px;color:#9ca3af}
  .lh-company strong{color:#f97316;font-size:11px;display:block;margin-bottom:2px}
  .lh-title{text-align:center;padding:14px 24px;border-bottom:2px solid #f97316}
  .lh-title h2{font-size:15px;font-weight:900;text-transform:uppercase;letter-spacing:2px;margin:0;color:#000}
  .lh-title p{font-size:9px;color:#64748b;margin:3px 0 0;letter-spacing:1px;text-transform:uppercase}
  .lh-body{padding:20px 24px}
  table{width:100%;border-collapse:collapse;margin-top:12px}
  th{background:#000;color:#f97316;border:1px solid #333;padding:7px 10px;text-align:left;font-size:9px;text-transform:uppercase;letter-spacing:1px}
  td{border:1px solid #e2e8f0;padding:5px 10px;font-size:10px}
  tr:nth-child(even) td{background:#f8fafc}
  .lh-footer{margin-top:30px;border-top:2px solid #f97316;padding:12px 24px;display:flex;justify-content:space-between;font-size:8px;color:#94a3b8}
  .badge-green{background:#d1fae5;color:#065f46;padding:2px 8px;border-radius:12px;font-size:9px;font-weight:900}
  .badge-red{background:#fee2e2;color:#991b1b;padding:2px 8px;border-radius:12px;font-size:9px;font-weight:900}
  .badge-blue{background:#dbeafe;color:#1e40af;padding:2px 8px;border-radius:12px;font-size:9px;font-weight:900}
  @media print{@page{margin:1cm}}
`;

// Company data singleton — updated when settings load
let EMPRESA_DATA = {
  razonSocial:'SERVICIOS JIRET G&B, C.A.',
  rif:'J-412309374',
  direccion:'AV CIRCUNVALACION NRO 02 C.C EL DIVIDIVI LOCAL G-9 NIVEL PB SECTOR EL TREBOL MARACAIBO-ZULIA',
  telefono:'0414-693.03.42',
};

const letterheadOpen = (titulo, subtitulo='') => `
  <html><head><meta charset="utf-8"><title>${titulo}</title><style>${LETTERHEAD_CSS}</style></head><body>
  <div class="lh-header">
    <div class="lh-logo">
      <span class="supply">Supply</span><span class="g">G</span><span class="amp">&amp;</span><span class="b">B</span>
    </div>
    <div class="lh-company">
      <strong>${EMPRESA_DATA.razonSocial}</strong>
      RIF: ${EMPRESA_DATA.rif}<br>
      ${EMPRESA_DATA.direccion}<br>
      ${EMPRESA_DATA.telefono?'Tel: '+EMPRESA_DATA.telefono:''}
    </div>
  </div>
  <div class="lh-title">
    <h2>${titulo}</h2>
    <p>${subtitulo||'Generado: '+new Date().toLocaleDateString('es-VE')+' '+new Date().toLocaleTimeString('es-VE',{hour:'2-digit',minute:'2-digit'})}</p>
  </div>
  <div class="lh-body">
`;
const letterheadClose = (extra='') => `
  </div>
  <div class="lh-footer">
    <span>${EMPRESA_DATA.razonSocial} — RIF: ${EMPRESA_DATA.rif}</span>
    <span>${extra}</span>
    <span>Supply ERP · ${new Date().toLocaleDateString('es-VE')}</span>
  </div>
  <script>window.onload=()=>{window.print();}</script>
  </body></html>
`;

const printWindow = (html) => { const w=window.open('','_blank'); w.document.write(html); w.document.close(); };

const Badge = ({ children, v = 'green' }) => {
  const s = { green: 'bg-emerald-50 text-emerald-700 border border-emerald-200', red: 'bg-red-50 text-red-600 border border-red-200', gold: 'bg-amber-50 text-amber-700 border border-amber-200', blue: 'bg-blue-50 text-blue-700 border border-blue-200', gray: 'bg-slate-100 text-slate-500 border border-slate-200', purple: 'bg-purple-50 text-purple-700 border border-purple-200' };
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide ${s[v] || s.gray}`}>{children}</span>;
};

const Pill = ({ children, usd }) => <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase ${usd ? 'bg-slate-900 text-white' : 'bg-orange-500 text-white'}`}>{children}</span>;

const KPI = ({ label, value, sub, accent = 'green', Icon, trend }) => {
  const borders = { green: 'border-t-emerald-500', gold: 'border-t-orange-500', blue: 'border-t-blue-500', red: 'border-t-red-500', purple: 'border-t-purple-500' };
  const icons = { green: 'text-emerald-500 bg-emerald-50', gold: 'text-orange-500 bg-orange-50', blue: 'text-blue-500 bg-blue-50', red: 'text-red-500 bg-red-50', purple: 'text-purple-500 bg-purple-50' };
  return (
    <div className={`bg-white rounded-2xl border border-slate-100 border-t-4 ${borders[accent]} p-5 shadow-sm hover:shadow-md transition-shadow`}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
        {Icon && <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${icons[accent]}`}><Icon size={14} /></div>}
      </div>
      <p className="font-black text-2xl text-slate-900 font-mono leading-none">{value}</p>
      {sub && <p className="text-[10px] text-slate-400 mt-2 font-medium">{sub}</p>}
    </div>
  );
};

const Card = ({ title, subtitle, action, children, noPad }) => (
  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mb-5">
    {(title || action) && (
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-3 bg-white">
        <div>{title && <h3 className="font-black text-slate-800 text-sm uppercase tracking-wide">{title}</h3>}{subtitle && <p className="text-[10px] text-slate-400 mt-0.5 font-medium">{subtitle}</p>}</div>
        {action}
      </div>
    )}
    <div className={noPad ? '' : 'p-6'}>{children}</div>
  </div>
);

const Modal = ({ open, onClose, title, children, footer, wide, xwide }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4" style={{ background: 'rgba(15,23,42,.85)', backdropFilter: 'blur(4px)' }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={`bg-white rounded-2xl w-full ${xwide ? 'max-w-6xl' : wide ? 'max-w-3xl' : 'max-w-lg'} max-h-[95vh] flex flex-col shadow-2xl`}>
        <div className="flex items-center justify-between px-7 py-5 border-b border-slate-100 flex-shrink-0" style={{ background: 'linear-gradient(135deg,#0f172a,#1e293b)' }}>
          <h2 className="font-black text-white uppercase tracking-widest text-sm">{title}</h2>
          <button onClick={onClose} className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"><X size={16} className="text-white" /></button>
        </div>
        <div className="overflow-y-auto flex-1 p-7">{children}</div>
        {footer && <div className="px-7 py-4 border-t border-slate-100 flex justify-end gap-3 flex-shrink-0 bg-slate-50 rounded-b-2xl">{footer}</div>}
      </div>
    </div>
  );
};

const FG = ({ label, children, full }) => <div className={full ? 'col-span-2' : ''}><label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">{label}</label>{children}</div>;
const inp = "w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold outline-none focus:border-orange-500 transition-colors bg-white text-slate-900 placeholder:text-slate-300";
const sel = "w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold outline-none focus:border-orange-500 transition-colors bg-white text-slate-900";

const Bp = ({ onClick, children, sm, disabled }) => <button disabled={disabled} onClick={onClick} className={`bg-slate-900 text-white font-black uppercase tracking-widest ${sm ? 'text-[9px] px-3 py-1.5' : 'text-[10px] px-5 py-2.5'} rounded-xl hover:bg-slate-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50`}>{children}</button>;
const Bg = ({ onClick, children, sm, disabled }) => <button disabled={disabled} onClick={onClick} className={`bg-orange-500 text-white font-black uppercase tracking-widest ${sm ? 'text-[9px] px-3 py-1.5' : 'text-[10px] px-5 py-2.5'} rounded-xl hover:bg-orange-600 transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50`}>{children}</button>;
const Bo = ({ onClick, children, sm }) => <button onClick={onClick} className={`border-2 border-slate-200 bg-white text-slate-600 font-black uppercase tracking-widest ${sm ? 'text-[9px] px-3 py-1.5' : 'text-[10px] px-5 py-2.5'} rounded-xl hover:bg-slate-50 transition-all flex items-center justify-center gap-2`}>{children}</button>;
const Bd = ({ onClick, children, sm }) => <button onClick={onClick} className={`border-2 border-red-200 bg-white text-red-500 font-black uppercase tracking-widest ${sm ? 'text-[9px] px-3 py-1.5' : 'text-[10px] px-5 py-2.5'} rounded-xl hover:bg-red-50 transition-all flex items-center justify-center gap-2`}>{children}</button>;

const Th = ({ children, right }) => <th className={`px-4 py-3 text-[9px] font-black uppercase tracking-widest text-slate-400 border-b-2 border-slate-100 bg-slate-50 ${right ? 'text-right' : 'text-left'} whitespace-nowrap`}>{children}</th>;
const Td = ({ children, right, mono, className = '' }) => <td className={`px-4 py-3 text-xs border-b border-slate-50 ${right ? 'text-right' : ''} ${mono ? 'font-mono' : 'font-medium'} text-slate-700 ${className}`}>{children}</td>;

const EmptyState = ({ icon: Icon, title, desc }) => (
  <div className="flex flex-col items-center justify-center py-14 text-center">
    <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4"><Icon size={28} className="text-slate-300" /></div>
    <p className="font-black text-slate-700 text-sm uppercase tracking-wide mb-1">{title}</p>
    <p className="text-[11px] text-slate-400 font-medium max-w-xs">{desc}</p>
  </div>
);

// Sidebar layout — mejorado con colores por grupo
const SidebarLayout = ({ brand, brandSub, navGroups, activeId, onNav, children, headerContent, onBack, accentColor = ORANGE }) => {
  const activeGroup = navGroups.find(g => g.items.find(i => i.id === activeId));
  const activeColor = activeGroup?.color || accentColor;
  return (
    <div className="flex h-screen overflow-hidden w-full">
      {/* ── SIDEBAR ── */}
      <aside className="w-64 flex flex-col h-screen flex-shrink-0" style={{ background: '#0b1120' }}>
        {/* Brand */}
        <div className="flex-shrink-0 px-5 pt-5 pb-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0" style={{ background: `linear-gradient(135deg, ${accentColor}, ${accentColor}99)` }}>
              <Blocks size={16} className="text-white" />
            </div>
            <div>
              <p className="font-black text-white text-sm leading-none tracking-wide">{brand}</p>
              <p className="text-[9px] text-slate-500 uppercase tracking-[2px] font-bold mt-0.5">{brandSub}</p>
            </div>
          </div>
          {/* Indicador módulo activo */}
          <div className="rounded-xl px-3 py-2 flex items-center gap-2" style={{ background: `${activeColor}18`, border: `1px solid ${activeColor}30` }}>
            <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 animate-pulse" style={{ background: activeColor }}/>
            <span className="text-[10px] font-black uppercase tracking-widest truncate" style={{ color: activeColor }}>
              {navGroups.flatMap(g=>g.items).find(i=>i.id===activeId)?.label || 'Panel'}
            </span>
          </div>
        </div>

        <div className="mx-4 border-b border-white/5 mb-1"/>

        {/* Nav */}
        <nav className="flex-1 py-2 overflow-y-auto px-2 space-y-0.5">
          {navGroups.map(({ group, items, color: gColor }) => {
            const gc = gColor || accentColor;
            const isActiveGroup = items.some(i => i.id === activeId);
            return (
              <div key={group} className="mb-1">
                {/* Group header */}
                <div className="flex items-center gap-2 px-3 py-2">
                  <div className="w-1 h-3 rounded-full flex-shrink-0" style={{ background: isActiveGroup ? gc : '#334155' }}/>
                  <p className="text-[8px] font-black uppercase tracking-[2.5px]" style={{ color: isActiveGroup ? gc : '#475569' }}>{group}</p>
                </div>
                {/* Items */}
                {items.map(({ id, label, icon: Icon }) => {
                  const active = activeId === id;
                  return (
                    <button key={id} onClick={() => onNav(id)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-left transition-all duration-150 rounded-xl mb-0.5 group"
                      style={active
                        ? { background: `${gc}20`, borderLeft: `3px solid ${gc}` }
                        : { borderLeft: '3px solid transparent' }}>
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all"
                        style={active ? { background: gc } : { background: '#1e293b' }}>
                        <Icon size={13} style={{ color: active ? '#fff' : '#64748b' }} />
                      </div>
                      <span className={`text-[11px] font-bold uppercase tracking-wide truncate transition-colors ${active ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>
                        {label}
                      </span>
                      {active && <div className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: gc }}/>}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* Back button */}
        <div className="p-3 border-t border-white/5 flex-shrink-0">
          <button onClick={onBack}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:text-white"
            style={{ background: '#1e293b', color: '#64748b', border: '1px solid #334155' }}
            onMouseEnter={e => { e.currentTarget.style.background = accentColor; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = accentColor; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#1e293b'; e.currentTarget.style.color = '#64748b'; e.currentTarget.style.borderColor = '#334155'; }}>
            <ArrowLeft size={13} /> Volver
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0" style={{ background: BG }}>
        <header className="bg-white border-b border-slate-100 px-7 h-14 flex items-center justify-between flex-shrink-0 shadow-sm">
          {headerContent}
        </header>
        <main className="flex-1 overflow-y-auto p-7 max-w-6xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
};

// ============================================================================
// LOGIN SCREEN
// ============================================================================
function LoginScreen({ onLogin, settings, systemUsers }) {
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      const user = loginData.username.toLowerCase().trim();
      const pass = loginData.password.trim();
      const found = (systemUsers || []).find(u => u.username === user && u.password === pass);
      if (found || (user === 'admin' && pass === '1234')) {
        onLogin(found || { name: 'Administrador Maestro', role: 'Master' }); setLoginError('');
      } else { setLoginError('Credenciales incorrectas. Verifique e intente nuevamente.'); }
      setLoading(false);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative"
      style={{ backgroundImage: settings?.loginBg ? `url(${settings.loginBg})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center' }}>
      {settings?.loginBg && <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"/>}
      <div className="bg-white p-10 rounded-[2rem] shadow-2xl w-full max-w-md relative z-10 border-t-8 border-orange-500">
        {/* G&B Logo */}
        <div className="text-center mb-10">
          <span className="text-3xl font-light tracking-widest text-gray-800">Supply</span>
          <div className="flex items-center justify-center -mt-2">
            <span className="text-black font-black text-[52px] leading-none">G</span>
            <div className="bg-orange-500 text-white rounded-full w-9 h-9 flex items-center justify-center text-2xl font-black mx-1 shadow-inner">&amp;</div>
            <span className="text-black font-black text-[52px] leading-none">B</span>
          </div>
          <p className="text-[9px] font-black tracking-[3px] text-gray-400 mt-1 uppercase">Servicios Jiret G&B, C.A. · Enterprise Resource Planning</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-[10px] font-black text-gray-500 uppercase mb-2 tracking-widest">Usuario de Acceso</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18}/>
              <input type="text" required value={loginData.username} onChange={e=>setLoginData({...loginData,username:e.target.value})}
                className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-black outline-none focus:border-orange-500 focus:bg-white transition-all text-black" placeholder="admin"/>
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-500 uppercase mb-2 tracking-widest">Clave de Seguridad</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18}/>
              <input type="password" required value={loginData.password} onChange={e=>setLoginData({...loginData,password:e.target.value})}
                className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-black outline-none focus:border-orange-500 focus:bg-white transition-all text-black" placeholder="••••••••"/>
            </div>
          </div>
          {loginError && <div className="bg-red-50 text-red-500 text-[10px] font-black uppercase p-3 rounded-xl text-center border border-red-100">{loginError}</div>}
          <button type="submit" disabled={loading}
            className="w-full bg-black text-white font-black py-5 rounded-2xl uppercase tracking-widest text-xs hover:bg-gray-900 transition-all shadow-xl flex justify-center items-center gap-2 mt-2 disabled:opacity-70">
            {loading ? <><RefreshCw size={14} className="animate-spin"/> Verificando...</> : <>INGRESAR AL SISTEMA <ArrowRight size={16}/></>}
          </button>
        </form>
        <p className="text-center text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-8">© {new Date().getFullYear()} Jiret G&B C.A. Todos los derechos reservados.</p>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN SELECTOR
// ============================================================================
function MainSelector({ onSelect }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: BG }}>
      <div className="w-full max-w-4xl">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-xl" style={{ background: ORANGE }}><Blocks size={24} className="text-white" /></div>
            <h1 className="font-black text-slate-900 text-3xl tracking-tight">Supply <span style={{ color: ORANGE }}>G&B</span></h1>
          </div>
          <p className="text-slate-500 text-sm font-medium">Seleccione el área de trabajo</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* ADMIN */}
          <button onClick={() => onSelect('admin_dash')} className="group bg-white rounded-3xl p-10 text-left shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden relative">
            <div className="absolute top-0 left-0 w-1.5 h-full rounded-l-3xl" style={{ background: ORANGE }} />
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform" style={{ background: ORANGE }}><Briefcase size={30} className="text-white" /></div>
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-wide mb-3">Área Administrativa</h2>
            <p className="text-slate-500 text-sm font-medium leading-relaxed mb-6">Facturación, Inventario, Bancos y Tesorería.</p>
            <div className="flex flex-wrap gap-2">
              {['Ventas & CxC', 'Inventario', 'Tesorería'].map(t => <span key={t} className="text-[10px] font-black uppercase px-2.5 py-1 rounded-lg bg-orange-50 text-orange-600 border border-orange-100">{t}</span>)}
            </div>
          </button>

          {/* CONTABLE */}
          <button onClick={() => onSelect('cont_dash')} className="group bg-white rounded-3xl p-10 text-left shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden relative">
            <div className="absolute top-0 left-0 w-1.5 h-full rounded-l-3xl bg-blue-500" />
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform bg-blue-500"><Calculator size={30} className="text-white" /></div>
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-wide mb-3">Área Contable</h2>
            <p className="text-slate-500 text-sm font-medium leading-relaxed mb-6">Plan de Cuentas, Libro Diario y Balances Fiscales.</p>
            <div className="flex flex-wrap gap-2">
              {['Plan de Cuentas', 'Libro Diario', 'Balances'].map(t => <span key={t} className="text-[10px] font-black uppercase px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">{t}</span>)}
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// DASHBOARDS DE ÁREA
// ============================================================================
function AdminDash({ onSelectModule, onBack }) {
  const mods = [
    { id: 'facturacion',   name: 'Ventas & Facturación',   icon: Receipt,      color: '#f97316', border:'#f97316', desc: 'Clientes, facturas y cuentas por cobrar' },
    { id: 'compras',       name: 'Compras & Proveedores',  icon: ShoppingCart, color: '#10b981', border:'#10b981', desc: 'Proveedores, órdenes de compra e importación' },
    { id: 'inventario',    name: 'Control de Inventario',  icon: Package,      color: '#3b82f6', border:'#3b82f6', desc: 'Catálogo, stock y movimientos' },
    { id: 'banco',         name: 'Bancos & Tesorería',     icon: Building2,    color: '#8b5cf6', border:'#8b5cf6', desc: 'Cuentas, movimientos y conciliación' },
    { id: 'configuracion', name: 'Configuración',          icon: Settings,     color: '#64748b', border:'#64748b', desc: 'Empresa, usuarios y tasas de cambio' },
  ];
  return (
    <div className="min-h-screen flex flex-col" style={{background:'#ffffff'}}>
      {/* Header negro con acento naranja */}
      <header className="px-6 py-3 flex items-center justify-between shadow-lg border-b-4 border-orange-500" style={{background:'#000'}}>
        <div className="flex items-center gap-3">
          <span className="text-lg font-light tracking-widest text-gray-300">Supply</span>
          <span className="text-white font-black text-xl leading-none">G</span>
          <div className="bg-orange-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-black">&amp;</div>
          <span className="text-white font-black text-xl leading-none">B</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={()=>onSelectModule('configuracion')} className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/10 text-white hover:bg-orange-500 transition-colors"><Settings size={14}/></button>
          <button onClick={onBack} className="px-3 py-1.5 rounded-lg border border-red-800/50 text-red-400 hover:bg-red-500 hover:text-white transition-colors flex items-center gap-1.5 text-[10px] font-black uppercase"><LogOut size={12}/> Salir</button>
        </div>
      </header>
      {/* Body */}
      <div className="flex-1 max-w-5xl mx-auto w-full px-6 py-8">
        <div className="text-center mb-8">
          <div className="w-0.5 h-8 bg-orange-500 mx-auto mb-3"/>
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-[0.15em] mb-1.5" style={{fontFamily:"'Inter','Segoe UI',system-ui,sans-serif"}}>Panel Principal ERP</h1>
          <div className="w-12 h-0.5 bg-orange-500 mx-auto"/>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {mods.map(mod=>(
            <button key={mod.id} onClick={()=>onSelectModule(mod.id)}
              className="group text-left rounded-xl p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg bg-white border border-slate-100"
              style={{borderBottom:`3px solid ${mod.border}`,boxShadow:'0 2px 12px rgba(0,0,0,0.06)'}}>
              <div className="mb-4">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{background:mod.color+'12'}}>
                  <mod.icon size={18} style={{color:mod.color}}/>
                </div>
              </div>
              <h3 className="font-black text-[11px] uppercase tracking-wider text-slate-900 mb-1" style={{fontFamily:"'Inter','Segoe UI',system-ui,sans-serif"}}>{mod.name}</h3>
              <p className="text-[10px] text-slate-400 leading-relaxed mb-3">{mod.desc}</p>
              <div className="flex items-center gap-1" style={{color:mod.color}}>
                <span className="text-[9px] font-black uppercase tracking-widest">Ingresar</span>
                <ChevronRight size={10}/>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ContDash({ onSelectModule, onBack }) {
  const grupos = [
    {
      titulo: 'Contabilidad General',
      color: '#3b82f6',
      mods: [
        { id: 'contabilidad', name: 'Plan de Cuentas',       icon: BookOpen,   color: '#3b82f6', desc: 'PUC jerárquico, importar/exportar, edición' },
        { id: 'asientos',     name: 'Libro Diario',           icon: FileText,   color: '#f97316', desc: 'Comprobantes automáticos y manuales Bs/USD' },
        { id: 'balances',     name: 'Estados Financieros',    icon: BarChart3,  color: '#10b981', desc: 'Balance Gral., E. Resultados, Comprobación' },
      ]
    },
    {
      titulo: 'Fiscal & Tributario',
      color: '#ef4444',
      mods: [
        { id: 'activos_fijos', name: 'Activos Fijos',         icon: Layers,     color: '#8b5cf6', desc: 'Registro, depreciación y bajas de activos' },
        { id: 'fiscal',        name: 'IVA · IGTF · Retenciones', icon: Receipt, color: '#ef4444', desc: 'Libros de compras/ventas, retenciones, TXT' },
      ]
    },
  ];
  return (
    <div className="min-h-screen flex flex-col" style={{background:'#ffffff'}}>
      <header className="px-6 py-3 flex items-center justify-between shadow-lg border-b-4 border-blue-500" style={{background:'#000'}}>
        <div className="flex items-center gap-3">
          <span className="text-lg font-light tracking-widest text-gray-300">Supply</span>
          <span className="text-white font-black text-xl leading-none">G</span>
          <div className="bg-orange-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-black">&amp;</div>
          <span className="text-white font-black text-xl leading-none">B</span>
        </div>
        <button onClick={onBack} className="px-3 py-1.5 rounded-lg border border-red-800/50 text-red-400 hover:bg-red-500 hover:text-white transition-colors flex items-center gap-1.5 text-[10px] font-black uppercase"><LogOut size={12}/> Salir</button>
      </header>
      <div className="flex-1 max-w-5xl mx-auto w-full px-6 py-8">
        <div className="text-center mb-8">
          <div className="w-0.5 h-8 bg-blue-500 mx-auto mb-3"/>
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-[0.15em] mb-1.5" style={{fontFamily:"'Inter','Segoe UI',system-ui,sans-serif"}}>Área Contable &amp; Fiscal</h1>
          <div className="w-12 h-0.5 bg-blue-500 mx-auto"/>
        </div>
        {grupos.map(g=>(
          <div key={g.titulo} className="mb-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-px flex-1 bg-slate-100"/>
              <p className="text-[9px] font-black uppercase tracking-[3px] px-3 py-1 rounded-full border" style={{color:g.color,borderColor:g.color+'40',background:g.color+'08'}}>{g.titulo}</p>
              <div className="h-px flex-1 bg-slate-100"/>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {g.mods.map(mod=>(
                <button key={mod.id} onClick={()=>onSelectModule(mod.id)}
                  className="group text-left bg-white rounded-xl p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg border border-slate-100"
                  style={{borderBottom:`3px solid ${mod.color}`,boxShadow:'0 2px 12px rgba(0,0,0,0.06)'}}>
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-4" style={{background:mod.color+'12'}}>
                    <mod.icon size={18} style={{color:mod.color}}/>
                  </div>
                  <h3 className="font-black text-[11px] uppercase tracking-wider text-slate-900 mb-1">{mod.name}</h3>
                  <p className="text-[10px] text-slate-400 leading-tight">{mod.desc}</p>
                  <div className="mt-3 flex items-center gap-1" style={{color:mod.color}}>
                    <span className="text-[9px] font-black uppercase tracking-widest">Ingresar</span>
                    <ChevronRight size={10}/>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
function FacturacionApp({ fbUser, tasasList, onBack }) {
  const [sec, setSec] = useState('dashboard');
  const [clientes, setClientes] = useState([]);
  const [facturas, setFacturas] = useState([]);
  const [pagos, setPagos] = useState([]);
  const [tasas, setTasas] = useState(tasasList || []);

  useEffect(() => {
    if (!fbUser) return;
    const subs = [
      onSnapshot(col('facturacion_clientes'), s => setClientes(s.docs.map(d => d.data()))),
      onSnapshot(query(col('facturacion_facturas'), orderBy('fechaEmision', 'desc')), s => setFacturas(s.docs.map(d => d.data()))),
      onSnapshot(query(col('facturacion_pagos'), orderBy('fecha', 'desc')), s => setPagos(s.docs.map(d => d.data()))),
      onSnapshot(query(col('banco_tasas'), orderBy('fecha', 'desc')), s => setTasas(s.docs.map(d => d.data())))
    ];
    return () => subs.forEach(u => u());
  }, [fbUser]);

  const tasaActiva = tasas.find(t => t.modulo === 'Facturación' || t.modulo === 'Todos')?.tasaRef || tasas[0]?.tasaRef || 39.50;

  const DashboardView = () => {
    const totalCartera = facturas.reduce((a, f) => a + (f.saldoUSD || 0), 0);
    const porVencer = facturas.filter(f => f.estado === 'Pendiente' && f.fechaVencimiento >= today()).reduce((a, f) => a + (f.saldoUSD || 0), 0);
    const vencidas = facturas.filter(f => f.estado === 'Pendiente' && f.fechaVencimiento < today()).reduce((a, f) => a + (f.saldoUSD || 0), 0);
    const ventasMes = facturas.filter(f => f.fechaEmision?.startsWith(mesActual())).reduce((a, f) => a + (f.total || 0), 0);
    const cobradoMes = pagos.filter(p => p.fecha?.startsWith(mesActual())).reduce((a, p) => a + (p.monto || 0), 0);

    return (
      <div className="space-y-6">
        <div className="rounded-2xl p-7 text-white relative overflow-hidden" style={{ background: `linear-gradient(135deg,${DARK},#1e3a5f)` }}>
          <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle at 80% 50%, #f97316 0%, transparent 50%)' }} />
          <p className="text-[10px] font-black uppercase text-slate-400 mb-1 tracking-widest">Cartera Viva Total (CxC)</p>
          <p className="text-5xl font-mono font-black" style={{ color: ORANGE }}>$ {fmt(totalCartera)}</p>
          <p className="text-slate-500 text-xs mt-2">Tasa activa: <strong className="text-white">{tasaActiva} Bs./$</strong></p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPI label="Ventas del Mes" value={`$${fmt(ventasMes)}`} accent="blue" Icon={TrendingUp} sub={mesActual()} />
          <KPI label="Cobrado del Mes" value={`$${fmt(cobradoMes)}`} accent="green" Icon={CheckCircle} />
          <KPI label="Por Vencer" value={`$${fmt(porVencer)}`} accent="gold" Icon={Clock} />
          <KPI label="Cartera Vencida" value={`$${fmt(vencidas)}`} accent="red" Icon={AlertTriangle} />
        </div>
        <div className="grid lg:grid-cols-2 gap-5">
          <Card title="Últimas Facturas Emitidas">
            {facturas.length === 0 ? <EmptyState icon={Receipt} title="Sin facturas" desc="Emita su primera factura" /> :
              <table className="w-full"><thead><tr><Th>Factura</Th><Th>Cliente</Th><Th right>Total</Th><Th>Estado</Th></tr></thead>
                <tbody>{facturas.slice(0, 6).map(f => <tr key={f.id} className="hover:bg-slate-50">
                  <Td mono className="font-black text-orange-500">{f.numero}</Td>
                  <Td className="max-w-[120px] truncate">{f.clienteNombre}</Td>
                  <Td right mono>${fmt(f.total)}</Td>
                  <Td><Badge v={f.estado === 'Pagada' ? 'green' : f.fechaVencimiento < today() ? 'red' : 'gold'}>{f.estado || 'Pendiente'}</Badge></Td>
                </tr>)}</tbody>
              </table>}
          </Card>
          <Card title="Últimos Cobros Registrados">
            {pagos.length === 0 ? <EmptyState icon={Wallet} title="Sin cobros" desc="Los cobros aparecerán aquí" /> :
              <table className="w-full"><thead><tr><Th>Fecha</Th><Th>Factura</Th><Th>Método</Th><Th right>Monto</Th></tr></thead>
                <tbody>{pagos.slice(0, 6).map(p => <tr key={p.id} className="hover:bg-slate-50">
                  <Td>{dd(p.fecha)}</Td><Td mono className="font-black">{p.facturaNumero}</Td>
                  <Td><span className="text-[10px] text-slate-500 uppercase font-semibold">{p.metodo}</span></Td>
                  <Td right mono className="text-emerald-600 font-black">+${fmt(p.monto)}</Td>
                </tr>)}</tbody>
              </table>}
          </Card>
        </div>
      </div>
    );
  };

  const ClientesView = () => {
    const [modal, setModal]       = useState(false);
    const [detalle, setDetalle]   = useState(null);  // cliente en detalle/edición
    const [editando, setEditando] = useState(false);
    const [form, setForm]         = useState({ nombre:'',rif:'',codigo:'',direccion:'',telefono:'',email:'',diasCredito:'0',cuentaContableCod:'',cuentaContableNom:'',activo:true });
    const [busy, setBusy]         = useState(false);
    const [search, setSearch]     = useState('');
    const [contCuentas, setContCuentas] = useState([]);
    useEffect(()=>{ const u=onSnapshot(col('cont_cuentas'),s=>setContCuentas(s.docs.map(d=>d.data()))); return()=>u(); },[]);

    const rifToCodigo = (rif) => (rif||'').toUpperCase().replace(/[-\s]/g,'');
    const filtered = clientes.filter(c=>
      c.nombre?.toUpperCase().includes(search.toUpperCase())||
      c.rif?.toUpperCase().includes(search.toUpperCase())||
      (c.codigo||'').toUpperCase().includes(search.toUpperCase())
    );

    const initForm = ()=>({ nombre:'',rif:'',codigo:'',direccion:'',telefono:'',email:'',diasCredito:'0',cuentaContableCod:'',cuentaContableNom:'',activo:true });

    const openNew  = ()=>{ setEditando(false); setForm(initForm()); setModal(true); };
    const openEdit = (c)=>{ setEditando(true); setDetalle(null); setForm({nombre:c.nombre,rif:c.rif,codigo:c.codigo||rifToCodigo(c.rif),direccion:c.direccion||'',telefono:c.telefono||'',email:c.email||'',diasCredito:c.diasCredito||'0',cuentaContableCod:c.cuentaContableCod||'',cuentaContableNom:c.cuentaContableNom||'',activo:c.activo!==false}); setModal(true); };

    const save = async () => {
      if (!form.nombre || !form.rif) return alert('Nombre y RIF requeridos');
      const codigo = form.codigo || rifToCodigo(form.rif);
      setBusy(true);
      try {
        if(editando && detalle) {
          await updateDoc(dref('facturacion_clientes',detalle.id),{...form,codigo});
        } else {
          const id=gid(); await setDoc(dref('facturacion_clientes',id),{...form,codigo,id,ts:serverTimestamp()});
        }
        setModal(false); setForm(initForm()); setDetalle(null); setEditando(false);
      } finally { setBusy(false); }
    };

    const eliminar = async(c)=>{
      if(!window.confirm(`¿Eliminar cliente "${c.nombre}"?`)) return;
      await deleteDoc(dref('facturacion_clientes',c.id));
      setDetalle(null);
    };

    // ── Imprimir cliente individual (membretado) ──────────────────────
    const printCliente = (c) => {
      printWindow(
        letterheadOpen('Ficha de Cliente', `Código: ${c.codigo||rifToCodigo(c.rif)}`)+
        `<table style="width:100%;margin:0"><tbody>
          <tr><td style="width:30%;font-weight:bold;color:#64748b;padding:8px 0">Código / RIF</td><td style="font-weight:900;font-size:13px">${c.codigo||''} · ${c.rif}</td></tr>
          <tr><td style="font-weight:bold;color:#64748b;padding:8px 0">Razón Social</td><td style="font-weight:900;font-size:14px">${c.nombre}</td></tr>
          <tr><td style="font-weight:bold;color:#64748b;padding:8px 0">Teléfono</td><td>${c.telefono||'—'}</td></tr>
          <tr><td style="font-weight:bold;color:#64748b;padding:8px 0">Email</td><td>${c.email||'—'}</td></tr>
          <tr><td style="font-weight:bold;color:#64748b;padding:8px 0">Dirección</td><td>${c.direccion||'—'}</td></tr>
          <tr><td style="font-weight:bold;color:#64748b;padding:8px 0">Días de Crédito</td><td>${c.diasCredito||'0'} días</td></tr>
          <tr><td style="font-weight:bold;color:#64748b;padding:8px 0">Cuenta Contable</td><td><span style="font-family:monospace;color:#1e40af;font-weight:bold">${c.cuentaContableCod||'—'}</span> ${c.cuentaContableNom?'· '+c.cuentaContableNom:''}</td></tr>
          <tr><td style="font-weight:bold;color:#64748b;padding:8px 0">Estado</td><td><span style="background:${c.activo!==false?'#d1fae5':'#fee2e2'};color:${c.activo!==false?'#065f46':'#991b1b'};padding:2px 8px;border-radius:12px;font-size:9px;font-weight:900">${c.activo!==false?'ACTIVO':'INACTIVO'}</span></td></tr>
        </tbody></table>`+
        letterheadClose('Directorio de Clientes')
      );
    };

    // ── Imprimir directorio completo ─────────────────────────────────
    const printDirectorio = () => {
      let rows = filtered.map((c,i)=>`<tr>
        <td>${i+1}</td>
        <td style="font-family:monospace;font-weight:bold;color:#1e40af">${c.codigo||rifToCodigo(c.rif)}</td>
        <td style="font-family:monospace">${c.rif}</td>
        <td style="font-weight:700">${c.nombre}</td>
        <td>${c.telefono||'—'}</td>
        <td>${c.email||'—'}</td>
        <td>${c.diasCredito||'0'}d</td>
        <td style="font-family:monospace;color:#1e40af;font-size:9px">${c.cuentaContableCod||'—'}</td>
        <td><span class="badge-${c.activo!==false?'green':'red'}">${c.activo!==false?'Activo':'Inactivo'}</span></td>
      </tr>`).join('');
      printWindow(
        letterheadOpen('Directorio de Clientes',`${filtered.length} cliente(s) registrado(s)`)+
        `<table><thead><tr><th>#</th><th>Código</th><th>RIF</th><th>Razón Social</th><th>Teléfono</th><th>Email</th><th>Créd.</th><th>PUC</th><th>Estado</th></tr></thead><tbody>${rows}</tbody></table>`+
        letterheadClose(`Módulo: Ventas & Facturación`)
      );
    };

    // ── Exportar TXT ─────────────────────────────────────────────────
    const exportarTxt = () => {
      const HDRS=['Código','Descripción','Activo','Dirección','Telefono','RIF','E-Mail'];
      const rows=clientes.map(c=>[c.codigo||rifToCodigo(c.rif),c.nombre,c.activo!==false?'Si':'No',c.direccion||'',c.telefono||'',c.rif||'',c.email||'']);
      const content=[HDRS,...rows].map(r=>r.join('\t')).join('\r\n');
      const blob=new Blob(['\uFEFF'+content],{type:'text/plain;charset=utf-8'});
      const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='GENERALDECLIENTES.TXT';a.click();URL.revokeObjectURL(url);
    };

    const importarTxt = async(event)=>{
      const file=event.target.files[0];if(!file)return;
      const text=await file.text();
      const lines=text.split(/\r?\n/).filter(l=>l.trim());
      if(lines.length<2){alert('Archivo vacío');event.target.value='';return;}
      const firstCell=lines[0].split('\t')[0].trim();
      const hasHeader=/[a-zA-ZáéíóúÁÉÍÓÚ]/.test(firstCell)&&!firstCell.startsWith('C');
      const dataLines=hasHeader?lines.slice(1):lines;
      const existentes=new Set(clientes.map(c=>c.rif?.toUpperCase().replace(/[-\s]/g,'')));
      const batch=writeBatch(db);let importados=0,omitidos=0;
      for(const line of dataLines){
        const p=line.split('\t').map(v=>v.trim().replace(/^["']/,'').replace(/["']$/,''));
        if(p.length<2) continue;
        const cod=p[0],nombre=p[1],activo=p[2],dir=p[3]||'',tel=p[4]||'',rif=p[5]||'',email=p[6]||'';
        if(!nombre) continue;
        const rifKey=(rif||cod).toUpperCase().replace(/[-\s]/g,'');
        if(rifKey&&existentes.has(rifKey)){omitidos++;continue;}
        const id=gid();const codigo=rifToCodigo(rif||cod);
        batch.set(dref('facturacion_clientes',id),{id,codigo,nombre:nombre.toUpperCase(),activo:activo!=='No',direccion:dir,telefono:tel,rif:(rif||'').toUpperCase(),email,diasCredito:'0',ts:serverTimestamp()});
        importados++;
      }
      if(importados===0){alert(`Sin nuevos clientes. ${omitidos} ya existían.`);event.target.value='';return;}
      await batch.commit();
      alert(`✅ ${importados} cliente(s) importado(s).${omitidos>0?` (${omitidos} omitidos)`:''}`);
      event.target.value='';
    };

    return (
      <div>
        {/* ── MODAL DETALLE ── */}
        {detalle && !editando && (
          <Modal open onClose={()=>setDetalle(null)} title={`Cliente — ${detalle.nombre}`} wide
            footer={<>
              <Bd onClick={()=>eliminar(detalle)}>🗑 Eliminar</Bd>
              <div className="flex-1"/>
              <button onClick={()=>printCliente(detalle)} className="flex items-center gap-2 px-4 py-2 border-2 border-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase hover:bg-slate-50"><Download size={12}/> Imprimir</button>
              <Bg onClick={()=>openEdit(detalle)}>✏ Editar</Bg>
            </>}>
            <div className="grid grid-cols-2 gap-4">
              {/* Header con código */}
              <div className="col-span-2 p-5 rounded-2xl flex items-center gap-5" style={{background:'linear-gradient(135deg,#0f172a,#1e293b)'}}>
                <div className="w-14 h-14 rounded-2xl bg-orange-500 flex items-center justify-center flex-shrink-0">
                  <Users size={24} className="text-white"/>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-0.5">{detalle.codigo||rifToCodigo(detalle.rif)}</p>
                  <p className="font-black text-white text-lg leading-tight">{detalle.nombre}</p>
                  <p className="text-slate-400 text-xs mt-0.5">{detalle.rif}</p>
                </div>
                <div className="ml-auto"><Badge v={detalle.activo!==false?'green':'gray'}>{detalle.activo!==false?'Activo':'Inactivo'}</Badge></div>
              </div>
              {[['Código',detalle.codigo||rifToCodigo(detalle.rif)],['RIF/NIT',detalle.rif],['Teléfono',detalle.telefono||'—'],['Email',detalle.email||'—'],['Días de Crédito',(detalle.diasCredito||'0')+' días'],['Dirección',detalle.direccion||'—']].map(([k,v])=>(
                <div key={k} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-0.5">{k}</p>
                  <p className="font-semibold text-slate-800 text-sm truncate">{v}</p>
                </div>
              ))}
              {(detalle.cuentaContableCod) && (
                <div className="col-span-2 bg-blue-50 border border-blue-100 rounded-xl p-3">
                  <p className="text-[9px] font-black uppercase text-blue-700 tracking-widest mb-0.5">Cuenta Contable (PUC)</p>
                  <p className="font-mono font-black text-blue-700">{detalle.cuentaContableCod} <span className="font-medium text-slate-600">· {detalle.cuentaContableNom}</span></p>
                </div>
              )}
            </div>
          </Modal>
        )}

        {/* ── MODAL CREAR / EDITAR ── */}
        <Modal open={modal} onClose={()=>{setModal(false);setForm(initForm());setEditando(false);setDetalle(null);}} title={editando?`Editar: ${detalle?.nombre}`:'Registrar Nuevo Cliente'}
          footer={<><Bo onClick={()=>{setModal(false);setForm(initForm());setEditando(false);setDetalle(null);}}>Cancelar</Bo><Bg onClick={save} disabled={busy}>{busy?'Guardando...':(editando?'Guardar Cambios':'Guardar Cliente')}</Bg></>}>
          <div className="grid grid-cols-2 gap-4">
            <FG label="RIF / NIT *"><input className={inp} value={form.rif} onChange={e=>{const rif=e.target.value.toUpperCase();setForm({...form,rif,codigo:form.codigo||rifToCodigo(rif)});}} placeholder="J-12345678-9"/></FG>
            <FG label="Código (auto: RIF sin guiones)"><input className={inp} value={form.codigo} onChange={e=>setForm({...form,codigo:e.target.value.toUpperCase()})} placeholder={rifToCodigo(form.rif)||'J412345789'}/></FG>
            <FG label="Razón Social *" full><input className={inp} value={form.nombre} onChange={e=>setForm({...form,nombre:e.target.value.toUpperCase()})} placeholder="EMPRESA EJEMPLO C.A."/></FG>
            <FG label="Teléfono"><input className={inp} value={form.telefono} onChange={e=>setForm({...form,telefono:e.target.value})} placeholder="0414-0000000"/></FG>
            <FG label="Email"><input type="email" className={inp} value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="contacto@empresa.com"/></FG>
            <FG label="Días de Crédito"><input type="number" className={inp} value={form.diasCredito} onChange={e=>setForm({...form,diasCredito:e.target.value})} placeholder="15"/></FG>
            <FG label="Dirección Fiscal" full><input className={inp} value={form.direccion} onChange={e=>setForm({...form,direccion:e.target.value})}/></FG>
            <FG label="Cuenta Contable Asociada (PUC)" full>
              <select className={sel} value={form.cuentaContableCod} onChange={e=>{const c=contCuentas.find(x=>x.codigo===e.target.value);setForm({...form,cuentaContableCod:e.target.value,cuentaContableNom:c?.nombre||''});}}>
                <option value="">— Sin cuenta asociada —</option>
                {contCuentas.filter(c=>String(c.codigo).startsWith('1')).sort((a,b)=>String(a.codigo).localeCompare(String(b.codigo))).map(c=><option key={c.id} value={c.codigo}>{c.codigo} · {c.nombre}</option>)}
              </select>
              {form.cuentaContableCod&&<p className="text-[10px] text-blue-600 font-black mt-1">✓ {form.cuentaContableCod} · {form.cuentaContableNom}</p>}
            </FG>
            <FG label="Estado">
              <div className="flex gap-2">
                {['Activo','Inactivo'].map(s=><button key={s} onClick={()=>setForm({...form,activo:s==='Activo'})} className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase border-2 transition-all ${(form.activo&&s==='Activo')||(!form.activo&&s==='Inactivo')?'bg-slate-900 text-white border-slate-900':'bg-white text-slate-500 border-slate-200'}`}>{s}</button>)}
              </div>
            </FG>
          </div>
        </Modal>

        {/* ── TABLA ── */}
        <Card title="Directorio de Clientes" subtitle={`${clientes.length} clientes registrados`}
          action={<div className="flex gap-2 flex-wrap items-center">
            <div className="relative"><Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar..." className="border-2 border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs outline-none focus:border-orange-500 w-36"/></div>
            <button onClick={printDirectorio} className="flex items-center gap-1.5 px-3 py-2 border-2 border-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase hover:bg-slate-50"><Download size={12}/> PDF</button>
            <button onClick={exportarTxt} className="flex items-center gap-1.5 px-3 py-2 border-2 border-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase hover:bg-slate-50"><Download size={12}/> TXT</button>
            <label className="flex items-center gap-1.5 px-3 py-2 border-2 border-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase hover:border-emerald-400 hover:text-emerald-600 cursor-pointer">
              <Upload size={12}/> Importar<input type="file" accept=".txt,.csv" className="sr-only" onChange={importarTxt}/>
            </label>
            <Bg onClick={openNew} sm><Plus size={12}/> Nuevo</Bg>
          </div>}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr><Th>Código</Th><Th>RIF / NIT</Th><Th>Razón Social</Th><Th>Teléfono</Th><Th>Email</Th><Th>PUC</Th><Th>Días</Th><Th>Estado</Th><Th></Th></tr></thead>
              <tbody>
                {filtered.length===0&&<tr><td colSpan={9}><EmptyState icon={Users} title="Sin clientes" desc="Registre o importe clientes"/></td></tr>}
                {filtered.map(c=><tr key={c.id} className="hover:bg-slate-50 cursor-pointer" onClick={()=>setDetalle(c)}>
                  <Td mono className="font-black text-orange-600">{c.codigo||rifToCodigo(c.rif)}</Td>
                  <Td mono className="font-semibold text-slate-700">{c.rif}</Td>
                  <Td className="uppercase font-semibold max-w-[160px] truncate">{c.nombre}</Td>
                  <Td>{c.telefono||'—'}</Td>
                  <Td className="text-slate-400 max-w-[120px] truncate">{c.email||'—'}</Td>
                  <Td mono className="text-blue-600 text-[10px]">{c.cuentaContableCod||'—'}</Td>
                  <Td mono className="text-slate-500">{c.diasCredito||'0'}d</Td>
                  <Td><Badge v={c.activo!==false?'green':'gray'}>{c.activo!==false?'Activo':'Inactivo'}</Badge></Td>
                  <Td>
                    <div className="flex gap-1" onClick={e=>e.stopPropagation()}>
                      <button onClick={()=>setDetalle(c)} className="p-1.5 text-blue-400 hover:bg-blue-50 rounded-lg" title="Detalle"><Search size={12}/></button>
                      <button onClick={()=>openEdit(c)} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg" title="Editar"><Settings size={12}/></button>
                      <button onClick={()=>printCliente(c)} className="p-1.5 text-green-500 hover:bg-green-50 rounded-lg" title="Imprimir"><Download size={12}/></button>
                      <button onClick={()=>eliminar(c)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg" title="Eliminar"><Trash2 size={12}/></button>
                    </div>
                  </Td>
                </tr>)}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    );
  };

  const FacturasView = () => {
    const [modal, setModal] = useState(false);
    const [items, setItems] = useState([{ desc: '', cant: 1, precio: 0 }]);
    const [form, setForm] = useState({ clienteId: '', fechaEmision: today(), moneda: 'USD' });
    const [busy, setBusy] = useState(false);
    const subtotal = items.reduce((s, i) => s + (Number(i.cant) * Number(i.precio)), 0);
    const iva = subtotal * 0.16; const total = subtotal + iva;

    const save = async () => {
      if (!form.clienteId) return alert('Seleccione un cliente');
      if (!items[0]?.desc) return alert('Agregue al menos una línea');
      setBusy(true);
      try {
        const c = clientes.find(x => x.id === form.clienteId);
        const numero = `FACT-${String(facturas.length + 1).padStart(5, '0')}`;
        const id = gid(); let fVenc = form.fechaEmision;
        if (c.diasCredito > 0) { const d = new Date(form.fechaEmision); d.setDate(d.getDate() + Number(c.diasCredito)); fVenc = d.toISOString().split('T')[0]; }
        await setDoc(dref('facturacion_facturas', id), { id, numero, clienteId: c.id, clienteNombre: c.nombre, clienteRif: c.rif, fechaEmision: form.fechaEmision, fechaVencimiento: fVenc, moneda: form.moneda, tasaRef: tasaActiva, subtotal, iva, total, saldoUSD: total, estado: 'Pendiente', items, ts: serverTimestamp() });
        setModal(false); setForm({ clienteId: '', fechaEmision: today(), moneda: 'USD' }); setItems([{ desc: '', cant: 1, precio: 0 }]);
      } finally { setBusy(false); }
    };

    return (
      <div>
        <Card title="Historial de Facturas" subtitle={`${facturas.length} facturas emitidas`} action={<Bg onClick={() => setModal(true)}><Plus size={13} /> Emitir Factura</Bg>}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr><Th>Nro.</Th><Th>Emisión</Th><Th>Cliente</Th><Th>Vencimiento</Th><Th right>Total</Th><Th right>Saldo</Th><Th>Estado</Th></tr></thead>
              <tbody>
                {facturas.length === 0 && <tr><td colSpan={7}><EmptyState icon={Receipt} title="Sin facturas" desc="Emita su primera factura" /></td></tr>}
                {facturas.map(f => <tr key={f.id} className="hover:bg-slate-50">
                  <Td mono className="font-black text-orange-500">{f.numero}</Td>
                  <Td>{dd(f.fechaEmision)}</Td>
                  <Td className="uppercase font-semibold max-w-[140px] truncate">{f.clienteNombre}</Td>
                  <Td className={f.fechaVencimiento < today() && f.estado === 'Pendiente' ? 'text-red-500 font-bold' : ''}>{dd(f.fechaVencimiento)}</Td>
                  <Td right mono className="font-black">${fmt(f.total)}</Td>
                  <Td right mono className="font-black text-orange-600">${fmt(f.saldoUSD)}</Td>
                  <Td><Badge v={f.estado === 'Pagada' ? 'green' : f.fechaVencimiento < today() ? 'red' : 'gold'}>{f.estado || 'Pendiente'}</Badge></Td>
                </tr>)}
              </tbody>
            </table>
          </div>
        </Card>
        <Modal open={modal} onClose={() => setModal(false)} title="Emisión de Nueva Factura" wide footer={<><Bo onClick={() => setModal(false)}>Cancelar</Bo><Bg onClick={save} disabled={busy}>{busy ? 'Procesando...' : 'Emitir Factura'}</Bg></>}>
          <div className="grid grid-cols-2 gap-4 mb-6 pb-6 border-b border-slate-100">
            <FG label="Cliente" full><select className={sel} value={form.clienteId} onChange={e => setForm({ ...form, clienteId: e.target.value })}><option value="">— Seleccione cliente —</option>{clientes.map(c => <option key={c.id} value={c.id}>{c.rif} · {c.nombre}</option>)}</select></FG>
            <FG label="Fecha Emisión"><input type="date" className={inp} value={form.fechaEmision} onChange={e => setForm({ ...form, fechaEmision: e.target.value })} /></FG>
            <FG label="Moneda"><select className={sel} value={form.moneda} onChange={e => setForm({ ...form, moneda: e.target.value })}><option>USD</option><option>EUR</option></select></FG>
          </div>
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-xs font-black uppercase text-slate-700 tracking-wide">Líneas de Facturación</h4>
            <button onClick={() => setItems([...items, { desc: '', cant: 1, precio: 0 }])} className="text-[10px] font-black uppercase text-orange-500 flex items-center gap-1 hover:bg-orange-50 px-2 py-1 rounded-lg transition-colors"><Plus size={12} /> Agregar Línea</button>
          </div>
          <div className="space-y-2 mb-6">
            {items.map((item, i) => (
              <div key={i} className="flex gap-2 items-center bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <input type="text" className={`${inp} flex-1 bg-white`} placeholder="Descripción del producto/servicio" value={item.desc} onChange={e => { const n = [...items]; n[i].desc = e.target.value; setItems(n); }} />
                <input type="number" min="1" className={`${inp} w-16 text-center bg-white`} value={item.cant} onChange={e => { const n = [...items]; n[i].cant = e.target.value; setItems(n); }} />
                <input type="number" step="0.01" className={`${inp} w-28 text-right bg-white`} placeholder="P. Unit." value={item.precio} onChange={e => { const n = [...items]; n[i].precio = e.target.value; setItems(n); }} />
                <div className="w-24 text-right font-mono font-black text-xs text-slate-600">${fmt(item.cant * item.precio)}</div>
                <button onClick={() => { const n = [...items]; n.splice(i, 1); setItems(n); }} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={13} /></button>
              </div>
            ))}
          </div>
          <div className="rounded-2xl p-5 flex justify-end gap-10" style={{ background: DARK }}>
            <div className="text-right space-y-1.5 text-xs text-slate-400"><p>SUBTOTAL</p><p>IVA (16%)</p><p className="text-sm font-black text-white mt-2 pt-1 border-t border-white/10">TOTAL</p></div>
            <div className="text-right space-y-1.5 font-mono font-black text-xs text-white"><p>${fmt(subtotal)}</p><p>${fmt(iva)}</p><p className="text-xl mt-1 pt-1 border-t border-white/10" style={{ color: ORANGE }}>${fmt(total)}</p></div>
          </div>
        </Modal>
      </div>
    );
  };

  const CxCView = () => {
    const [modalPago, setModalPago] = useState(false);
    const [fActiva, setFActiva] = useState(null);
    const [formPago, setFormPago] = useState({ fecha: today(), monto: '', metodo: 'Transferencia Bs', ref: '' });
    const [busy, setBusy] = useState(false);
    const pendientes = facturas.filter(f => f.estado === 'Pendiente');
    const abonoUSD = Number(formPago.monto) || 0;
    const aplicaIGTF = ['Efectivo Divisas', 'Zelle'].includes(formPago.metodo);
    const montoIGTF = aplicaIGTF ? abonoUSD * 0.03 : 0;
    const montoBs = abonoUSD * tasaActiva;
    const difCambiario = montoBs - (abonoUSD * (fActiva?.tasaRef || tasaActiva));

    const registrarPago = async () => {
      if (!formPago.monto || !formPago.ref) return alert('Monto y referencia requeridos');
      if (abonoUSD > fActiva.saldoUSD + 0.01) return alert('El monto supera el saldo deudor');
      setBusy(true);
      try {
        const pId = gid(); const nuevoSaldo = Math.max(0, fActiva.saldoUSD - abonoUSD);
        const nuevoEstado = nuevoSaldo < 0.01 ? 'Pagada' : 'Pendiente';
        const batch = writeBatch(db);
        batch.set(dref('facturacion_pagos', pId), { id: pId, facturaId: fActiva.id, facturaNumero: fActiva.numero, clienteNombre: fActiva.clienteNombre, fecha: formPago.fecha, monto: abonoUSD, igtf: montoIGTF, difCambiario, metodo: formPago.metodo, ref: formPago.ref, ts: serverTimestamp() });
        batch.update(dref('facturacion_facturas', fActiva.id), { saldoUSD: nuevoSaldo, estado: nuevoEstado });
        await batch.commit();
        setModalPago(false); setFormPago({ fecha: today(), monto: '', metodo: 'Transferencia Bs', ref: '' }); setFActiva(null);
      } finally { setBusy(false); }
    };

    return (
      <div>
        <div className="grid grid-cols-3 gap-4 mb-5">
          <KPI label="Facturas Pendientes" value={pendientes.length} accent="gold" Icon={Clock} />
          <KPI label="Saldo Total CxC" value={`$${fmt(pendientes.reduce((a, f) => a + (f.saldoUSD || 0), 0))}`} accent="orange" Icon={Wallet} />
          <KPI label="Vencidas Críticas" value={pendientes.filter(f => f.fechaVencimiento < today()).length} accent="red" Icon={AlertTriangle} />
        </div>
        <Card title="Cuentas por Cobrar" subtitle="Facturas con saldo deudor pendiente">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr><Th>Factura</Th><Th>Cliente</Th><Th>Vencimiento</Th><Th right>Tasa Orig.</Th><Th right>Total Fact.</Th><Th right>Saldo Deudor</Th><Th></Th></tr></thead>
              <tbody>
                {pendientes.length === 0 && <tr><td colSpan={7}><EmptyState icon={CheckCircle} title="¡Todo al día!" desc="No hay cuentas pendientes de cobro" /></td></tr>}
                {pendientes.map(f => <tr key={f.id} className="hover:bg-slate-50">
                  <Td mono className="font-black text-slate-900">{f.numero}</Td>
                  <Td className="uppercase font-semibold max-w-[130px] truncate">{f.clienteNombre}</Td>
                  <Td className={f.fechaVencimiento < today() ? 'text-red-600 font-bold' : ''}>
                    {dd(f.fechaVencimiento)}{f.fechaVencimiento < today() && <span className="ml-1.5 text-[8px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full uppercase font-black">Vencida</span>}
                  </Td>
                  <Td right mono>{f.tasaRef}</Td>
                  <Td right mono className="font-black">${fmt(f.total)}</Td>
                  <Td right mono className="font-black text-orange-500 text-sm">${fmt(f.saldoUSD)}</Td>
                  <Td right>
                    <button onClick={() => { setFActiva(f); setFormPago({ fecha: today(), monto: String(f.saldoUSD), metodo: 'Transferencia Bs', ref: '' }); setModalPago(true); }}
                      className="px-3 py-1.5 rounded-lg text-[9px] font-black uppercase text-white transition-colors hover:opacity-90" style={{ background: ORANGE }}>Abonar</button>
                  </Td>
                </tr>)}
              </tbody>
            </table>
          </div>
        </Card>

        <Modal open={modalPago} onClose={() => setModalPago(false)} title={`Registrar Cobro — ${fActiva?.numero}`} footer={<><Bo onClick={() => setModalPago(false)}>Cancelar</Bo><Bg onClick={registrarPago} disabled={busy}>{busy ? 'Registrando...' : 'Confirmar Cobro'}</Bg></>}>
          {fActiva && <div className="space-y-5">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex justify-between items-center">
              <div><p className="text-[10px] text-slate-400 font-black uppercase mb-0.5">Cliente</p><p className="font-black text-slate-900">{fActiva.clienteNombre}</p></div>
              <div className="text-right"><p className="text-[10px] text-slate-400 font-black uppercase mb-0.5">Saldo Pendiente</p><p className="font-mono font-black text-2xl text-orange-500">${fmt(fActiva.saldoUSD)}</p></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FG label="Fecha de Cobro"><input type="date" className={inp} value={formPago.fecha} onChange={e => setFormPago({ ...formPago, fecha: e.target.value })} /></FG>
              <FG label="Monto USD a Abonar"><input type="number" step="0.01" className={inp} value={formPago.monto} onChange={e => setFormPago({ ...formPago, monto: e.target.value })} /></FG>
              <FG label="Método de Pago"><select className={sel} value={formPago.metodo} onChange={e => setFormPago({ ...formPago, metodo: e.target.value })}><option>Transferencia Bs</option><option>Efectivo Divisas</option><option>Zelle</option><option>Efectivo Bs</option></select></FG>
              <FG label="N° Referencia / Comprobante"><input className={inp} value={formPago.ref} onChange={e => setFormPago({ ...formPago, ref: e.target.value })} placeholder="REF-0000000" /></FG>
            </div>
            {formPago.metodo === 'Transferencia Bs' && abonoUSD > 0 && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 grid grid-cols-3 gap-3">
                <div><p className="text-[9px] font-black text-blue-600 uppercase mb-1">Cobro en Bs.</p><p className="font-mono font-black text-slate-900">Bs. {fmt(montoBs)}</p><p className="text-[9px] text-slate-400">Tasa: {tasaActiva}</p></div>
                <div><p className="text-[9px] font-black text-slate-500 uppercase mb-1">Valor Original</p><p className="font-mono font-black text-slate-600">Bs. {fmt(abonoUSD * (fActiva.tasaRef || tasaActiva))}</p><p className="text-[9px] text-slate-400">Tasa: {fActiva.tasaRef}</p></div>
                <div className="border-l border-blue-200 pl-3"><p className="text-[9px] font-black text-blue-600 uppercase mb-1">Dif. Cambiario</p><p className={`font-mono font-black ${difCambiario >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{difCambiario >= 0 ? '+' : ''}Bs. {fmt(difCambiario)}</p></div>
              </div>
            )}
            {aplicaIGTF && <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex justify-between items-center"><div><p className="text-[10px] font-black text-amber-700 uppercase flex items-center gap-1.5"><AlertTriangle size={13} /> Percepción IGTF (3%)</p><p className="text-[9px] text-slate-500 mt-0.5">Aplica por pago en divisas</p></div><p className="font-mono font-black text-xl text-amber-600">${fmt(montoIGTF)}</p></div>}
          </div>}
        </Modal>
      </div>
    );
  };

  const navGroups = [
    { group: 'Analítica', items: [{ id: 'dashboard', label: 'Resumen Ejecutivo', icon: LayoutDashboard }] },
    { group: 'Operaciones', items: [{ id: 'clientes', label: 'Directorio Clientes', icon: Users }, { id: 'facturas', label: 'Emisión de Facturas', icon: Receipt }] },
    { group: 'Finanzas', items: [{ id: 'cxc', label: 'Cuentas por Cobrar', icon: Wallet }] },
  ];
  const views = { dashboard: <DashboardView />, clientes: <ClientesView />, facturas: <FacturasView />, cxc: <CxCView /> };
  const curNav = navGroups.flatMap(g => g.items).find(n => n.id === sec);

  return (
    <SidebarLayout brand="Supply G&B" brandSub="Facturación & CxC" navGroups={navGroups} activeId={sec} onNav={setSec} onBack={onBack}
      headerContent={<>
        <div><h1 className="font-black text-slate-800 text-sm uppercase tracking-wide">{curNav?.label}</h1><p className="text-[9px] text-slate-400 font-medium uppercase tracking-widest">Ventas <ChevronRight size={8} className="inline" /> {navGroups.find(g => g.items.find(i => i.id === sec))?.group}</p></div>
        <div className="flex items-center gap-3">
          <div className="bg-orange-50 border border-orange-200 rounded-full px-3 py-1.5 flex items-center gap-1.5"><DollarSign size={12} className="text-orange-500" /><span className="text-[10px] font-black text-orange-700 font-mono">Tasa: {tasaActiva} Bs/$</span></div>
          <Bg onClick={() => setSec('facturas')} sm><Plus size={12} /> Facturar</Bg>
        </div>
      </>}>
      {views[sec]}
    </SidebarLayout>
  );
}

// ============================================================================
// MÓDULO INVENTARIO (NUEVO — COMPLETO)
// ============================================================================
function InventarioApp({ fbUser, onBack }) {
  const [sec, setSec] = useState('dashboard');
  const [categorias, setCategorias] = useState([]);
  const [productos, setProductos] = useState([]);
  const [movimientos, setMovimientos] = useState([]);

  useEffect(() => {
    if (!fbUser) return;
    const subs = [
      onSnapshot(col('inv_categorias'), s => setCategorias(s.docs.map(d => d.data()))),
      onSnapshot(col('inv_productos'), s => setProductos(s.docs.map(d => d.data()))),
      onSnapshot(query(col('inv_movimientos'), orderBy('fecha', 'desc')), s => setMovimientos(s.docs.map(d => d.data())))
    ];
    return () => subs.forEach(u => u());
  }, [fbUser]);

  const DashboardView = () => {
    const bajoMinimo = productos.filter(p => Number(p.stockActual || 0) <= Number(p.stockMinimo || 0));
    const valorInventario = productos.reduce((a, p) => a + (Number(p.stockActual || 0) * Number(p.precioCosto || 0)), 0);
    const entradasMes = movimientos.filter(m => m.tipo === 'Entrada' && m.fecha?.startsWith(mesActual())).reduce((a, m) => a + Number(m.cantidad || 0), 0);
    const salidasMes = movimientos.filter(m => m.tipo === 'Salida' && m.fecha?.startsWith(mesActual())).reduce((a, m) => a + Number(m.cantidad || 0), 0);

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPI label="Productos Activos" value={productos.length} accent="blue" Icon={Package} />
          <KPI label="Valor en Inventario" value={`$${fmt(valorInventario)}`} accent="green" Icon={DollarSign} sub="A precio de costo" />
          <KPI label="Alertas Stock Bajo" value={bajoMinimo.length} accent={bajoMinimo.length > 0 ? 'red' : 'green'} Icon={AlertTriangle} />
          <KPI label="Categorías" value={categorias.length} accent="purple" Icon={Tag} />
        </div>

        {bajoMinimo.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3"><AlertTriangle size={16} className="text-red-500" /><p className="font-black text-red-700 text-sm uppercase tracking-wide">Alertas de Reabastecimiento</p></div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {bajoMinimo.slice(0, 8).map(p => (
                <div key={p.id} className="bg-white rounded-xl p-3 border border-red-100">
                  <p className="font-black text-slate-900 text-xs uppercase truncate">{p.nombre}</p>
                  <p className="text-[10px] text-red-600 font-black mt-1">Stock: {p.stockActual} / Min: {p.stockMinimo}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-5">
          <Card title="Últimos Movimientos">
            {movimientos.length === 0 ? <EmptyState icon={ArrowLeftRight} title="Sin movimientos" desc="Los movimientos de inventario aparecerán aquí" /> :
              <table className="w-full"><thead><tr><Th>Fecha</Th><Th>Tipo</Th><Th>Producto</Th><Th right>Cant.</Th></tr></thead>
                <tbody>{movimientos.slice(0, 8).map(m => <tr key={m.id} className="hover:bg-slate-50">
                  <Td>{dd(m.fecha)}</Td>
                  <Td><Badge v={m.tipo === 'Entrada' ? 'green' : m.tipo === 'Salida' ? 'red' : 'blue'}>{m.tipo}</Badge></Td>
                  <Td className="max-w-[140px] truncate">{m.productoNombre}</Td>
                  <Td right mono className={`font-black ${m.tipo === 'Entrada' ? 'text-emerald-600' : 'text-red-500'}`}>{m.tipo === 'Entrada' ? '+' : '-'}{m.cantidad}</Td>
                </tr>)}</tbody>
              </table>}
          </Card>
          <Card title="Top Productos por Valor">
            {productos.length === 0 ? <EmptyState icon={Package} title="Sin productos" desc="Registre productos en el catálogo" /> :
              <table className="w-full"><thead><tr><Th>Producto</Th><Th right>Stock</Th><Th right>Valor</Th></tr></thead>
                <tbody>{[...productos].sort((a, b) => (Number(b.stockActual || 0) * Number(b.precioCosto || 0)) - (Number(a.stockActual || 0) * Number(a.precioCosto || 0))).slice(0, 6).map(p => <tr key={p.id} className="hover:bg-slate-50">
                  <Td className="max-w-[150px] truncate font-semibold">{p.nombre}</Td>
                  <Td right mono>{p.stockActual} {p.unidad}</Td>
                  <Td right mono className="font-black">${fmt(Number(p.stockActual || 0) * Number(p.precioCosto || 0))}</Td>
                </tr>)}</tbody>
              </table>}
          </Card>
        </div>
      </div>
    );
  };

  const CategoriasView = () => {
    const [modal, setModal] = useState(false);
    const [form, setForm] = useState({ nombre: '', descripcion: '' });
    const [busy, setBusy] = useState(false);
    const save = async () => {
      if (!form.nombre) return alert('Nombre requerido');
      setBusy(true);
      try { const id = gid(); await setDoc(dref('inv_categorias', id), { ...form, id, ts: serverTimestamp() }); setModal(false); setForm({ nombre: '', descripcion: '' }); } finally { setBusy(false); }
    };
    return (
      <div>
        <Card title="Categorías de Productos" subtitle={`${categorias.length} categorías registradas`} action={<Bg onClick={() => setModal(true)} sm><Plus size={12} /> Nueva</Bg>}>
          {categorias.length === 0 ? <EmptyState icon={Tag} title="Sin categorías" desc="Cree categorías para organizar su inventario" /> :
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              {categorias.map(c => (
                <div key={c.id} className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex items-center justify-between group">
                  <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center"><Tag size={14} className="text-emerald-600" /></div><div><p className="font-black text-slate-900 text-xs uppercase">{c.nombre}</p>{c.descripcion && <p className="text-[10px] text-slate-400">{c.descripcion}</p>}</div></div>
                  <button onClick={() => deleteDoc(dref('inv_categorias', c.id))} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={12} /></button>
                </div>
              ))}
            </div>}
        </Card>
        <Modal open={modal} onClose={() => setModal(false)} title="Nueva Categoría" footer={<><Bo onClick={() => setModal(false)}>Cancelar</Bo><Bg onClick={save} disabled={busy}>{busy ? 'Guardando...' : 'Guardar'}</Bg></>}>
          <div className="space-y-4">
            <FG label="Nombre de Categoría"><input className={inp} value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value.toUpperCase() })} placeholder="REPUESTOS ELÉCTRICOS" /></FG>
            <FG label="Descripción (Opcional)"><input className={inp} value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} placeholder="Descripción breve..." /></FG>
          </div>
        </Modal>
      </div>
    );
  };

  const ProductosView = () => {
    const [modal, setModal] = useState(false);
    const [form, setForm] = useState({ codigo: '', nombre: '', categoriaId: '', unidad: 'UND', precioCosto: '', precioVenta: '', stockActual: '0', stockMinimo: '0' });
    const [busy, setBusy] = useState(false);
    const [search, setSearch] = useState('');
    const filtered = productos.filter(p => p.nombre?.toUpperCase().includes(search.toUpperCase()) || p.codigo?.includes(search.toUpperCase()));

    const save = async () => {
      if (!form.codigo || !form.nombre) return alert('Código y nombre requeridos');
      setBusy(true);
      try {
        const id = gid(); const cat = categorias.find(c => c.id === form.categoriaId);
        await setDoc(dref('inv_productos', id), { ...form, id, categoriaNombre: cat?.nombre || '', precioCosto: Number(form.precioCosto), precioVenta: Number(form.precioVenta), stockActual: Number(form.stockActual), stockMinimo: Number(form.stockMinimo), ts: serverTimestamp() });
        setModal(false); setForm({ codigo: '', nombre: '', categoriaId: '', unidad: 'UND', precioCosto: '', precioVenta: '', stockActual: '0', stockMinimo: '0' });
      } finally { setBusy(false); }
    };

    return (
      <div>
        <Card title="Catálogo de Productos" subtitle={`${productos.length} productos registrados`}
          action={<div className="flex gap-2"><div className="relative"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..." className="border-2 border-slate-200 rounded-xl pl-8 pr-3 py-2 text-xs outline-none focus:border-orange-500 w-36" /></div><Bg onClick={() => setModal(true)} sm><Plus size={12} /> Nuevo</Bg></div>}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr><Th>Código</Th><Th>Producto</Th><Th>Categoría</Th><Th>Unidad</Th><Th right>P. Costo</Th><Th right>P. Venta</Th><Th right>Stock</Th><Th>Estado</Th><Th></Th></tr></thead>
              <tbody>
                {filtered.length === 0 && <tr><td colSpan={9}><EmptyState icon={Package} title="Sin productos" desc="Registre su primer producto" /></td></tr>}
                {filtered.map(p => {
                  const bajo = Number(p.stockActual) <= Number(p.stockMinimo);
                  return <tr key={p.id} className="hover:bg-slate-50">
                    <Td mono className="font-black text-slate-900">{p.codigo}</Td>
                    <Td className="font-semibold max-w-[160px] truncate">{p.nombre}</Td>
                    <Td><span className="text-[10px] text-slate-500 uppercase font-semibold">{p.categoriaNombre || '—'}</span></Td>
                    <Td><span className="text-[10px] font-black uppercase">{p.unidad}</span></Td>
                    <Td right mono>${fmt(p.precioCosto)}</Td>
                    <Td right mono className="font-black">${fmt(p.precioVenta)}</Td>
                    <Td right mono className={`font-black ${bajo ? 'text-red-500' : 'text-slate-900'}`}>{p.stockActual}</Td>
                    <Td><Badge v={bajo ? 'red' : 'green'}>{bajo ? 'Stock Bajo' : 'Normal'}</Badge></Td>
                    <Td><button onClick={() => deleteDoc(dref('inv_productos', p.id))} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={12} /></button></Td>
                  </tr>;
                })}
              </tbody>
            </table>
          </div>
        </Card>

        <Modal open={modal} onClose={() => setModal(false)} title="Registrar Producto" wide footer={<><Bo onClick={() => setModal(false)}>Cancelar</Bo><Bg onClick={save} disabled={busy}>{busy ? 'Guardando...' : 'Guardar Producto'}</Bg></>}>
          <div className="grid grid-cols-2 gap-4">
            <FG label="Código / SKU"><input className={inp} value={form.codigo} onChange={e => setForm({ ...form, codigo: e.target.value.toUpperCase() })} placeholder="PROD-001" /></FG>
            <FG label="Nombre del Producto"><input className={inp} value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value.toUpperCase() })} placeholder="CABLE ELÉCTRICO 2.5MM" /></FG>
            <FG label="Categoría"><select className={sel} value={form.categoriaId} onChange={e => setForm({ ...form, categoriaId: e.target.value })}><option value="">— Sin categoría —</option>{categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}</select></FG>
            <FG label="Unidad de Medida"><select className={sel} value={form.unidad} onChange={e => setForm({ ...form, unidad: e.target.value })}><option>UND</option><option>KG</option><option>GR</option><option>LT</option><option>MT</option><option>M2</option><option>CAJA</option><option>PAR</option></select></FG>
            <FG label="Precio de Costo ($)"><input type="number" step="0.01" className={inp} value={form.precioCosto} onChange={e => setForm({ ...form, precioCosto: e.target.value })} placeholder="0.00" /></FG>
            <FG label="Precio de Venta ($)"><input type="number" step="0.01" className={inp} value={form.precioVenta} onChange={e => setForm({ ...form, precioVenta: e.target.value })} placeholder="0.00" /></FG>
            <FG label="Stock Inicial"><input type="number" className={inp} value={form.stockActual} onChange={e => setForm({ ...form, stockActual: e.target.value })} /></FG>
            <FG label="Stock Mínimo (Alerta)"><input type="number" className={inp} value={form.stockMinimo} onChange={e => setForm({ ...form, stockMinimo: e.target.value })} /></FG>
          </div>
        </Modal>
      </div>
    );
  };

  const MovimientosView = () => {
    const [modal, setModal] = useState(false);
    const [form, setForm] = useState({ fecha: today(), tipo: 'Entrada', productoId: '', cantidad: '', descripcion: '', referencia: '' });
    const [busy, setBusy] = useState(false);

    const save = async () => {
      if (!form.productoId || !form.cantidad) return alert('Producto y cantidad requeridos');
      setBusy(true);
      try {
        const prod = productos.find(p => p.id === form.productoId);
        const cant = Number(form.cantidad);
        const nuevoStock = form.tipo === 'Entrada' ? Number(prod.stockActual || 0) + cant : Math.max(0, Number(prod.stockActual || 0) - cant);
        const id = gid();
        const batch = writeBatch(db);
        batch.set(dref('inv_movimientos', id), { id, fecha: form.fecha, tipo: form.tipo, productoId: prod.id, productoNombre: prod.nombre, productoCode: prod.codigo, cantidad: cant, descripcion: form.descripcion, referencia: form.referencia, stockAnterior: Number(prod.stockActual || 0), stockResultante: nuevoStock, ts: serverTimestamp() });
        batch.update(dref('inv_productos', prod.id), { stockActual: nuevoStock });
        await batch.commit();
        setModal(false); setForm({ fecha: today(), tipo: 'Entrada', productoId: '', cantidad: '', descripcion: '', referencia: '' });
      } finally { setBusy(false); }
    };

    return (
      <div>
        <Card title="Kardex — Movimientos de Inventario" subtitle="Historial de entradas, salidas y ajustes" action={<Bg onClick={() => setModal(true)}><Plus size={13} /> Nuevo Movimiento</Bg>}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr><Th>Fecha</Th><Th>Tipo</Th><Th>Código</Th><Th>Producto</Th><Th>Descripción</Th><Th>Referencia</Th><Th right>Cant.</Th><Th right>Stock Res.</Th></tr></thead>
              <tbody>
                {movimientos.length === 0 && <tr><td colSpan={8}><EmptyState icon={ArrowLeftRight} title="Sin movimientos" desc="Registre entradas y salidas de inventario" /></td></tr>}
                {movimientos.map(m => <tr key={m.id} className="hover:bg-slate-50">
                  <Td>{dd(m.fecha)}</Td>
                  <Td><Badge v={m.tipo === 'Entrada' ? 'green' : m.tipo === 'Salida' ? 'red' : 'blue'}>{m.tipo}</Badge></Td>
                  <Td mono className="font-black text-slate-700">{m.productoCode}</Td>
                  <Td className="max-w-[160px] truncate font-semibold">{m.productoNombre}</Td>
                  <Td className="text-slate-400 max-w-[160px] truncate">{m.descripcion || '—'}</Td>
                  <Td mono className="text-slate-500">{m.referencia || '—'}</Td>
                  <Td right mono className={`font-black text-sm ${m.tipo === 'Entrada' ? 'text-emerald-600' : 'text-red-500'}`}>{m.tipo === 'Entrada' ? '+' : '-'}{m.cantidad}</Td>
                  <Td right mono className="font-black text-slate-900">{m.stockResultante}</Td>
                </tr>)}
              </tbody>
            </table>
          </div>
        </Card>
        <Modal open={modal} onClose={() => setModal(false)} title="Registrar Movimiento de Inventario" footer={<><Bo onClick={() => setModal(false)}>Cancelar</Bo><Bg onClick={save} disabled={busy}>{busy ? 'Registrando...' : 'Registrar'}</Bg></>}>
          <div className="grid grid-cols-2 gap-4">
            <FG label="Fecha"><input type="date" className={inp} value={form.fecha} onChange={e => setForm({ ...form, fecha: e.target.value })} /></FG>
            <FG label="Tipo de Movimiento"><select className={sel} value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })}><option>Entrada</option><option>Salida</option><option>Ajuste</option><option>Devolución</option></select></FG>
            <FG label="Producto" full><select className={sel} value={form.productoId} onChange={e => setForm({ ...form, productoId: e.target.value })}><option value="">— Seleccione producto —</option>{productos.map(p => <option key={p.id} value={p.id}>{p.codigo} · {p.nombre} (Stock: {p.stockActual})</option>)}</select></FG>
            <FG label="Cantidad"><input type="number" min="0.01" step="0.01" className={inp} value={form.cantidad} onChange={e => setForm({ ...form, cantidad: e.target.value })} /></FG>
            <FG label="Referencia"><input className={inp} value={form.referencia} onChange={e => setForm({ ...form, referencia: e.target.value })} placeholder="OC-001 / FACT-001" /></FG>
            <FG label="Descripción" full><input className={inp} value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} placeholder="Descripción del movimiento..." /></FG>
          </div>
        </Modal>
      </div>
    );
  };

  const navGroups = [
    { group: 'Analítica', items: [{ id: 'dashboard', label: 'Tablero General', icon: LayoutDashboard }] },
    { group: 'Maestros', items: [{ id: 'categorias', label: 'Categorías', icon: Tag }, { id: 'productos', label: 'Catálogo Productos', icon: Package }] },
    { group: 'Operaciones', items: [{ id: 'movimientos', label: 'Kardex / Movimientos', icon: ArrowLeftRight }] },
  ];
  const views = { dashboard: <DashboardView />, categorias: <CategoriasView />, productos: <ProductosView />, movimientos: <MovimientosView /> };
  const curNav = navGroups.flatMap(g => g.items).find(n => n.id === sec);

  return (
    <SidebarLayout brand="Supply G&B" brandSub="Control de Inventario" navGroups={navGroups} activeId={sec} onNav={setSec} onBack={onBack} accentColor="#10b981"
      headerContent={<>
        <div><h1 className="font-black text-slate-800 text-sm uppercase tracking-wide">{curNav?.label}</h1><p className="text-[9px] text-slate-400 font-medium uppercase tracking-widest">Inventario <ChevronRight size={8} className="inline" /> Stock & Movimientos</p></div>
        <Bg onClick={() => setSec('movimientos')} sm><Plus size={12} /> Movimiento</Bg>
      </>}>
      {views[sec]}
    </SidebarLayout>
  );
}


// ============================================================================
// MÓDULO BANCO & CAJA — ARQUITECTURA COMPLETA v3
// ============================================================================
/* CSS para impresión (oculta controles, muestra solo contenido) */
const PRINT_STYLE = `@media print{.no-print{display:none!important}.print-only{display:block!important}body{background:#fff}@page{margin:1.5cm}}`;

const TIPO_BANCO = [
  { id:'Nacional-Bs',   label:'Banco Nacional — Bs.',   moneda:'BS',  flag:'🇻🇪' },
  { id:'Nacional-Ext',  label:'Banco Nacional — USD',   moneda:'USD', flag:'🏦' },
  { id:'Internacional', label:'Banco Internacional',     moneda:'USD', flag:'🌐' },
];

// Denominaciones VES para arqueo
const DENOM_BS  = [500,200,100,50,20,10,5,2,1,0.5,0.25,0.10,0.05,0.01];
const DENOM_USD = [100,50,20,10,5,2,1];

function BancoApp({ fbUser, onBack }) {
  const [sec, setSec] = useState('dashboard');
  const [cuentas,    setCuentas]  = useState([]);
  const [movBanco,   setMovBanco] = useState([]);
  const [movCaja,    setMovCaja]  = useState([]);
  const [arques,     setArques]   = useState([]);
  const [concils,    setConcils]  = useState([]);
  const [tasas,      setTasas]    = useState([]);
  const [clientes,   setClientes] = useState([]);
  const [facturas,   setFacturas] = useState([]);
  const [provs,      setProvs]    = useState([]);
  const [contCuentas,setContC]    = useState([]);

  useEffect(() => {
    if (!fbUser) return;
    const subs = [
      onSnapshot(col('banco_cuentas'), s => setCuentas(s.docs.map(d=>d.data()))),
      onSnapshot(query(col('banco_movimientos'), orderBy('fecha','desc')), s => setMovBanco(s.docs.map(d=>d.data()))),
      onSnapshot(query(col('caja_movimientos'), orderBy('fecha','desc')), s => setMovCaja(s.docs.map(d=>d.data()))),
      onSnapshot(query(col('caja_arques'), orderBy('fecha','desc')), s => setArques(s.docs.map(d=>d.data()))),
      onSnapshot(col('banco_conciliaciones'), s => setConcils(s.docs.map(d=>d.data()))),
      onSnapshot(query(col('banco_tasas'), orderBy('fecha','desc')), s => setTasas(s.docs.map(d=>d.data()))),
      onSnapshot(col('facturacion_clientes'), s => setClientes(s.docs.map(d=>d.data()))),
      onSnapshot(query(col('facturacion_facturas'), orderBy('fechaEmision','desc')), s => setFacturas(s.docs.map(d=>d.data()))),
      onSnapshot(col('compras_proveedores'), s => setProvs(s.docs.map(d=>d.data()))),
      onSnapshot(col('cont_cuentas'), s => setContC(s.docs.map(d=>d.data()))),
    ];
    return () => subs.forEach(u=>u());
  }, [fbUser]);

  const tasaActiva = tasas.find(t=>t.modulo==='Banco'||t.modulo==='Todos')?.tasaRef || tasas[0]?.tasaRef || 39.50;

  // ══════════════════════════════════════════════════════════════════════
  // 1. DASHBOARD
  // ══════════════════════════════════════════════════════════════════════
  const DashboardView = () => {
    const cuentasNacBs = cuentas.filter(c=>c.tipoBanco==='Nacional-Bs');
    const cuentasExt   = cuentas.filter(c=>c.tipoBanco==='Nacional-Ext'||c.tipoBanco==='Internacional');
    const totBs   = cuentasNacBs.reduce((a,c)=>a+Number(c.saldo||0),0);
    const totUSD  = cuentasExt.filter(c=>c.moneda==='USD').reduce((a,c)=>a+Number(c.saldo||0),0);
    const totEUR  = cuentasExt.filter(c=>c.moneda==='EUR').reduce((a,c)=>a+Number(c.saldo||0),0);
    const totConsolUSD = Math.max(0,totBs/tasaActiva) + Math.max(0,totUSD);
    const cajaBs  = movCaja.filter(m=>m.tipo==='Ingreso'&&m.moneda==='BS').reduce((a,m)=>a+Number(m.montoBs||0),0)
                  - movCaja.filter(m=>m.tipo==='Egreso'&&m.moneda==='BS').reduce((a,m)=>a+Number(m.montoBs||0),0);
    const cajaUSD = movCaja.filter(m=>m.tipo==='Ingreso'&&m.moneda==='USD').reduce((a,m)=>a+Number(m.montoUSD||0),0)
                  - movCaja.filter(m=>m.tipo==='Egreso'&&m.moneda==='USD').reduce((a,m)=>a+Number(m.montoUSD||0),0);
    // Format compacto (50.000 en vez de 50,000.00)
    const fmtC=(n)=>{const abs=Math.abs(Number(n)||0);if(abs>=1000000)return (n/1000000).toFixed(2)+'M';if(abs>=1000)return (n/1000).toFixed(1)+'K';return fmt(n);};
    const CuentaCard=({c})=>{
      const bs=c.moneda==='BS';const eur=c.moneda==='EUR';
      const usdEq=bs?Number(c.saldo)/tasaActiva:Number(c.saldo);
      const bsEq=bs?Number(c.saldo):Number(c.saldo)*tasaActiva;
      const movsCta=movBanco.filter(m=>m.cuentaId===c.id);
      const pendientes=movsCta.filter(m=>m.estatus!=='Conciliado').length;
      const colorBorde=bs?'#3b82f6':eur?'#f59e0b':'#10b981';
      return(<div onClick={()=>setSec('movimientos')} className="bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-150 cursor-pointer overflow-hidden" style={{borderTop:`3px solid ${colorBorde}`}}>
        <div className="px-4 pt-3 pb-2 flex items-start justify-between">
          <div className="flex items-center gap-2"><div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{background:colorBorde+'12'}}><Landmark size={12} style={{color:colorBorde}}/></div>
            <div><p className="text-[8px] font-black uppercase tracking-widest text-slate-400 leading-none">{c.tipoBanco}</p><p className="font-black text-slate-900 text-[11px] uppercase leading-tight mt-0.5">{c.banco}</p></div></div>
          <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md text-white" style={{background:bs?'#f97316':'#0f172a'}}>{c.moneda}</span>
        </div>
        <div className="px-4 py-2"><p className="font-black text-slate-900 text-base leading-none">{bs?'Bs.':(c.moneda==='USD'?'$':'€')} {fmt(c.saldo)}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">{bs?`≈ $${fmtC(usdEq)}`:c.moneda==='EUR'?`≈ $${fmtC(usdEq)} · Bs.${fmtC(bsEq)}`:`≈ Bs.${fmtC(bsEq)}`}</p></div>
        <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <p className="font-mono text-[9px] text-slate-400 truncate max-w-[130px]">{c.numeroCuenta}</p>
          <div className="flex items-center gap-1.5">{movsCta.length>0&&<span className="text-[9px] text-slate-400">{movsCta.length} mov</span>}<div className={`w-1.5 h-1.5 rounded-full ${pendientes>0?'bg-amber-400':'bg-emerald-400'}`}/></div>
        </div></div>);
    };
    return(<div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPI label="Bancos USD" value={`$${fmt(Math.max(0,totUSD))}`} accent="green" Icon={Building2} sub={`≈ Bs.${fmtC(Math.max(0,totUSD)*tasaActiva)}`}/>
        <KPI label="Bancos Bs." value={`Bs.${fmtC(Math.max(0,totBs))}`} accent="blue" Icon={Landmark} sub={`≈ $${fmtC(Math.max(0,totBs)/tasaActiva)}`}/>
        <KPI label="Caja USD" value={`$${fmt(Math.max(0,cajaUSD))}`} accent="purple" Icon={DollarSign} sub="Efectivo + Vales"/>
      </div>
      {cuentasNacBs.length>0&&<div>
        <div className="flex items-center gap-2 mb-3"><div className="w-1 h-5 rounded-full bg-blue-500"/><p className="font-black text-[10px] uppercase tracking-widest text-slate-700">Cuentas Nacionales · Bolívares</p><div className="flex-1 h-px bg-slate-100"/><div className="bg-blue-50 px-3 py-1 rounded-lg"><span className="text-[9px] font-black text-blue-700 uppercase">Total: Bs.{fmtC(totBs)}</span></div></div>
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">{cuentasNacBs.map(c=><CuentaCard key={c.id} c={c}/>)}</div>
      </div>}
      {cuentasExt.length>0&&<div>
        <div className="flex items-center gap-2 mb-3"><div className="w-1 h-5 rounded-full bg-emerald-500"/><p className="font-black text-[10px] uppercase tracking-widest text-slate-700">Moneda Extranjera</p><div className="flex-1 h-px bg-slate-100"/><div className="bg-emerald-50 px-3 py-1 rounded-lg"><span className="text-[9px] font-black text-emerald-700 uppercase">USD: ${fmtC(totUSD)} · EUR: €{fmtC(totEUR)}</span></div></div>
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">{cuentasExt.map(c=><CuentaCard key={c.id} c={c}/>)}</div>
      </div>}
      {cuentas.length===0&&<div className="py-12"><EmptyState icon={Building2} title="Sin cuentas" desc="Registre cuentas en Bancos"/></div>}
      <div className="grid lg:grid-cols-2 gap-4">
        <Card title="Últimas Transacciones">
          {movBanco.length===0?<EmptyState icon={ArrowLeftRight} title="Sin movimientos" desc=""/>:
            <div className="divide-y divide-slate-50">{movBanco.slice(0,8).map(m=>(
              <div key={m.id} className="flex items-center gap-3 py-2 hover:bg-slate-50 rounded-lg px-2">
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${m.tipo==='Ingreso'?'bg-emerald-100':'bg-red-100'}`}>{m.tipo==='Ingreso'?<ArrowUpCircle size={12} className="text-emerald-600"/>:<ArrowDownCircle size={12} className="text-red-500"/>}</div>
                <div className="flex-1 min-w-0"><p className="text-[10px] font-semibold text-slate-800 truncate">{m.concepto}</p><p className="text-[9px] text-slate-400">{m.cuentaNombre} · {dd(m.fecha)}</p></div>
                <div className="text-right flex-shrink-0"><p className={`font-mono font-black text-[11px] ${m.tipo==='Ingreso'?'text-emerald-600':'text-red-500'}`}>${fmt(m.montoUSD)}</p><p className="text-[9px] text-slate-400">Bs.{fmtC(m.montoBs)}</p></div>
              </div>
            ))}</div>}
        </Card>
        <Card title="Consolidado">
          <div className="space-y-3">
            {cuentasNacBs.length>0&&<><p className="text-[8px] font-black uppercase tracking-widest text-blue-600">Bolívares</p>
              {cuentasNacBs.map(c=>{const pct=totBs>0?Number(c.saldo)/totBs*100:0;return(<div key={c.id} className="space-y-0.5"><div className="flex justify-between"><span className="text-[10px] font-semibold text-slate-700 truncate max-w-[150px]">{c.banco}</span><span className="text-[10px] font-mono font-black text-slate-900">Bs.{fmtC(c.saldo)} <span className="text-slate-400">{pct.toFixed(0)}%</span></span></div><div className="w-full bg-blue-50 rounded-full h-1"><div className="h-1 rounded-full bg-blue-500" style={{width:`${Math.min(pct,100)}%`}}/></div></div>);})}
              <div className="flex justify-between pt-1 border-t border-blue-50 text-[9px] font-black text-blue-600 uppercase"><span>Total Bs.</span><span>Bs.{fmtC(totBs)}</span></div></>}
            {cuentasExt.length>0&&<><p className="text-[8px] font-black uppercase tracking-widest text-emerald-600 mt-2">Divisas</p>
              {cuentasExt.map(c=>{const tot=cuentasExt.reduce((a,x)=>a+Number(x.saldo||0),0);const pct=tot>0?Number(c.saldo)/tot*100:0;return(<div key={c.id} className="space-y-0.5"><div className="flex justify-between"><span className="text-[10px] font-semibold text-slate-700 truncate max-w-[120px]">{c.banco} <span className="text-slate-400">({c.moneda})</span></span><span className="text-[10px] font-mono font-black text-slate-900">{c.moneda==='USD'?'$':'€'}{fmtC(c.saldo)} <span className="text-slate-400">{pct.toFixed(0)}%</span></span></div><div className="w-full bg-emerald-50 rounded-full h-1"><div className="h-1 rounded-full bg-emerald-500" style={{width:`${Math.min(pct,100)}%`}}/></div></div>);})}
            </>}
            {cuentas.length>0&&<div className="flex justify-between pt-2 border-t border-slate-200 text-[10px] font-black text-slate-900 uppercase"><span>Consolidado USD</span><span>${fmtC(totConsolUSD)}</span></div>}
          </div>
        </Card>
      </div>
    </div>);
  };

  // ══════════════════════════════════════════════════════════════════════
  // 2. CUENTAS BANCARIAS
  // ══════════════════════════════════════════════════════════════════════
  const CuentasView = () => {
    const [modal, setModal]     = useState(false);
    const [editando, setEdit]   = useState(null);
    const [certCuenta, setCert] = useState(null);
    const [busy, setBusy]       = useState(false);
    const initF = ()=>({banco:'',numeroCuenta:'',tipoCuenta:'Corriente',tipoBanco:'Nacional-Bs',saldo:'0',titular:'',cuentaContableCod:'',cuentaContableNom:''});
    const [form, setForm] = useState(initF());
    const monedaDe = tb => TIPO_BANCO.find(t=>t.id===tb)?.moneda||'BS';

    const openNew  = ()=>{ setEdit(null); setForm(initF()); setModal(true); };
    const openEdit = c  =>{ setEdit(c); setForm({banco:c.banco,numeroCuenta:c.numeroCuenta,tipoCuenta:c.tipoCuenta,tipoBanco:c.tipoBanco||'Nacional-Bs',saldo:String(c.saldo),titular:c.titular||'',cuentaContableCod:c.cuentaContableCod||'',cuentaContableNom:c.cuentaContableNom||''}); setModal(true); };

    const save = async()=>{
      if(!form.banco||!form.numeroCuenta) return alert('Banco y número requeridos');
      setBusy(true);
      try {
        const moneda=monedaDe(form.tipoBanco);
        if(editando) {
          await updateDoc(dref('banco_cuentas',editando.id),{...form,moneda,saldo:Number(form.saldo)});
        } else {
          const id=gid(); await setDoc(dref('banco_cuentas',id),{...form,id,moneda,saldo:Number(form.saldo),ts:serverTimestamp()});
        }
        setModal(false); setEdit(null); setForm(initF());
      } finally { setBusy(false); }
    };

    const canDel = c => !movBanco.find(m=>m.cuentaId===c.id);

    // ── Certificación ─────────────────────────────────────────────────
    if(certCuenta) {
      const c=certCuenta; const bs=c.moneda==='BS'; const tb=TIPO_BANCO.find(t=>t.id===c.tipoBanco)||TIPO_BANCO[0];
      const campos=[
        ['Banco / Entidad Financiera', c.banco],
        ['Tipo de Cuenta',             c.tipoCuenta],
        ['Número de Cuenta',           c.numeroCuenta],
        ['Moneda',                     c.moneda],
        ['Clasificación',              tb.label],
        ['Titular de la Cuenta',       c.titular],
      ];
      return (
        <div>
          <style>{PRINT_STYLE}</style>
          <div className="flex gap-3 mb-5 no-print">
            <Bo onClick={()=>setCert(null)}><ArrowLeft size={13}/> Volver</Bo>
            <button onClick={()=>window.print()} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700"><Download size={13}/> Imprimir / PDF</button>
          </div>
          <div className="bg-white rounded-2xl border-2 border-slate-200 p-10 max-w-2xl mx-auto">
            <div className="text-center border-b-2 border-slate-100 pb-6 mb-6">
              <div className="flex justify-center mb-3"><div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{background:'#f97316'}}><Blocks size={22} className="text-white"/></div></div>
              <p className="font-black text-xl text-slate-900 uppercase tracking-wide">Servicios Jiret G&B, C.A.</p>
              <p className="text-sm text-slate-500 mt-1">RIF: J-412309374 · Caracas, Venezuela</p>
              <div className="mt-3 inline-flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-full"><span className="text-xl">{tb.flag}</span><span className="text-[10px] font-black text-slate-500 uppercase">{tb.id}</span></div>
            </div>
            <h2 className="text-center font-black text-lg text-slate-900 uppercase tracking-widest mb-6">Certificación de Cuenta Bancaria</h2>
            <div className="space-y-0">
              {campos.map(([k,v])=>(
                <div key={k} className="flex gap-4 py-3 border-b border-slate-100">
                  <p className="w-52 text-[10px] font-black uppercase text-slate-400 tracking-widest pt-0.5 flex-shrink-0">{k}</p>
                  <p className="font-semibold text-slate-900 flex-1">{v}</p>
                </div>
              ))}
            </div>
            <p className="text-center text-[10px] text-slate-300 mt-10 uppercase tracking-widest">Documento generado: {dd(today())} · Supply ERP — Servicios Jiret G&B, C.A.</p>
          </div>
        </div>
      );
    }

    // ── Reporte imprimible de cuentas ─────────────────────────────────
    const imprimirCuentas = ()=>{
      const w=window.open('','_blank');
      w.document.write(`<html><head><title>Cuentas Bancarias</title>
        <style>body{font-family:Arial,sans-serif;margin:2cm;color:#1e293b}
        h1{font-size:16px;text-transform:uppercase;letter-spacing:2px;text-align:center;margin-bottom:4px}
        p.sub{text-align:center;font-size:11px;color:#94a3b8;margin-bottom:24px}
        table{width:100%;border-collapse:collapse;font-size:11px}
        th{background:#f1f5f9;border-bottom:2px solid #e2e8f0;padding:8px 10px;text-align:left;text-transform:uppercase;font-size:9px;letter-spacing:1px;color:#64748b}
        td{padding:8px 10px;border-bottom:1px solid #f1f5f9;color:#334155}
        tr:hover td{background:#f8fafc}
        .flag{font-size:16px}
        footer{margin-top:24px;font-size:9px;color:#cbd5e1;text-align:center;border-top:1px solid #e2e8f0;padding-top:12px}
        </style></head><body>
        <h1>Servicios Jiret G&B, C.A. — Registro de Cuentas Bancarias</h1>
        <p class="sub">RIF: J-412309374 · Generado: ${dd(today())}</p>
        <table><thead><tr><th>Tipo</th><th>Banco / Entidad</th><th>Número de Cuenta</th><th>Tipo de Cuenta</th><th>Titular</th><th>Moneda</th></tr></thead>
        <tbody>${cuentas.map(c=>{const tb=TIPO_BANCO.find(t=>t.id===c.tipoBanco)||TIPO_BANCO[0];return`<tr><td><span class="flag">${tb.flag}</span> ${c.tipoBanco||'—'}</td><td>${c.banco}</td><td style="font-family:monospace">${c.numeroCuenta}</td><td>${c.tipoCuenta}</td><td>${c.titular||'—'}</td><td>${c.moneda}</td></tr>`;}).join('')}
        </tbody></table>
        <footer>Supply ERP · ${cuentas.length} cuenta(s) registrada(s) · Servicios Jiret G&amp;B, C.A.</footer>
        </body></html>`);
      w.document.close(); w.print();
    };

    const exportarCuentas = (formato) => {
      const [nacBs, ext] = [
        cuentas.filter(c=>c.tipoBanco==='Nacional-Bs'),
        cuentas.filter(c=>c.tipoBanco==='Nacional-Ext'||c.tipoBanco==='Internacional'),
      ];
      const mkRows = (lista) => lista.map(c=>{
        return `<tr>
          <td style="font-weight:bold">${c.banco}</td>
          <td style="font-family:monospace">${c.numeroCuenta}</td>
          <td>${c.tipoCuenta||'—'}</td>
          <td>${c.moneda}</td>
          <td>${c.titular||'—'}</td>
        </tr>`;
      }).join('');
      const thead=`<thead><tr><th>Banco</th><th>Nro. Cuenta</th><th>Tipo</th><th>Moneda</th><th>Titular</th></tr></thead>`;
      const content=letterheadOpen('Reporte de Cuentas Bancarias',`Titular: Servicios Jiret G&B, C.A. · RIF: J-412309374 · ${dd(today())} · Tasa: ${tasaActiva} Bs/$`)+
        `<h3 style="color:#1e3a5f;font-size:11px;text-transform:uppercase;letter-spacing:2px;margin:16px 0 8px">🇻🇪 Cuentas Nacionales — Bolívares</h3>
        <table>${thead}<tbody>${mkRows(nacBs)}</tbody></table>
        <h3 style="color:#065f46;font-size:11px;text-transform:uppercase;letter-spacing:2px;margin:20px 0 8px">💵 Cuentas Moneda Extranjera</h3>
        <table>${thead}<tbody>${mkRows(ext)}</tbody></table>`+
        letterheadClose(`${cuentas.length} cuenta(s) registrada(s)`);
      if(formato==='pdf'){ printWindow(content); return; }
      const blob=new Blob([content],{type:'application/vnd.ms-excel;charset=utf-8'});
      const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`cuentas_bancarias_${today()}.xls`;a.click();URL.revokeObjectURL(url);
    };

    return (
      <div className="space-y-5">
        <style>{PRINT_STYLE}</style>
        {/* Botones de acción */}
        <div className="flex gap-3 justify-end">
          <button onClick={imprimirCuentas} className="flex items-center gap-2 px-3 py-2 border-2 border-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase hover:bg-slate-50"><Download size={12}/> Imprimir</button>
          <button onClick={()=>exportarCuentas('pdf')} className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase hover:bg-red-700"><FileText size={12}/> PDF</button>
          <button onClick={()=>exportarCuentas('excel')} className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-xl text-[10px] font-black uppercase hover:bg-green-700"><FileSpreadsheet size={12}/> Excel</button>
          <Bg onClick={openNew}><Plus size={12}/> Nueva Cuenta</Bg>
        </div>
        {[
          {label:'🇻🇪 Cuentas Nacionales — Bolívares',  tipos:['Nacional-Bs'],  colorHeader:'#1e3a5f', accent:'#3b82f6'},
          {label:'💵 Cuentas Moneda Extranjera / Internacional', tipos:['Nacional-Ext','Internacional'], colorHeader:'#1a3a2a', accent:'#10b981'},
        ].map(grupo=>{
          const lista=cuentas.filter(c=>grupo.tipos.includes(c.tipoBanco||'Nacional-Bs'));
          const totUSD=lista.reduce((a,c)=>{const bs=c.moneda==='BS';return a+(bs?Number(c.saldo)/tasaActiva:Number(c.saldo));},0);
          const totBs =lista.reduce((a,c)=>{const bs=c.moneda==='BS';return a+(bs?Number(c.saldo):Number(c.saldo)*tasaActiva);},0);
          return (
            <div key={grupo.label} className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
              <div className="px-5 py-3 flex items-center justify-between" style={{background:grupo.colorHeader}}>
                <p className="font-black text-white text-xs uppercase tracking-widest">{grupo.label}</p>
                <div className="text-right">
                  <p className="font-mono font-black text-sm" style={{color:grupo.accent==='#3b82f6'?'#93c5fd':'#6ee7b7'}}>Bs. {fmt(totBs)}</p>
                  <p className="font-mono text-white text-[10px] opacity-70">≈ ${fmt(totUSD)} USD</p>
                </div>
              </div>
              {lista.length===0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">Sin cuentas en esta categoría</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead><tr className="bg-slate-50 border-b border-slate-100"><Th>Banco</Th><Th>Nro. Cuenta</Th><Th>Tipo de Cta.</Th><Th>Titular</Th><Th>Moneda</Th><Th></Th></tr></thead>
                    <tbody>
                      {lista.map(c=>{
                        const bs=c.moneda==='BS'; const usd=c.moneda==='USD'; const eur=c.moneda==='EUR';
                        return <tr key={c.id} className="hover:bg-blue-50/30 border-b border-slate-50">
                          <Td className="font-black text-slate-900">{c.banco}</Td>
                          <Td mono className="text-[11px] text-slate-600">{c.numeroCuenta}</Td>
                          <Td className="text-[10px] text-slate-500">{c.tipoCuenta||'—'}</Td>
                          <Td className="uppercase text-[10px] text-slate-400 max-w-[100px] truncate">{c.titular||'—'}</Td>
                          <Td><Pill usd={!bs}>{c.moneda}</Pill></Td>
                          <Td>
                            <div className="flex gap-1">
                              <button onClick={()=>setCert(c)} className="p-1.5 text-blue-400 hover:bg-blue-50 rounded-lg" title="Certificación"><FileText size={12}/></button>
                              <button onClick={()=>openEdit(c)} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg" title="Editar"><Settings size={12}/></button>
                              <button onClick={async()=>{
                                if(!window.confirm(`¿Eliminar cuenta ${c.banco}? Se eliminarán también sus movimientos.`)) return;
                                const batch=writeBatch(db);
                                batch.delete(dref('banco_cuentas',c.id));
                                movBanco.filter(m=>m.cuentaId===c.id).forEach(m=>batch.delete(dref('banco_movimientos',m.id)));
                                await batch.commit();
                              }} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg"><Trash2 size={12}/></button>
                            </div>
                          </Td>
                        </tr>;
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}

        {/* ── CUENTAS NACIONALES Bs ── */}

        <Modal open={modal} onClose={()=>{setModal(false);setEdit(null);}} title={editando?'Editar Cuenta Bancaria':'Nueva Cuenta Bancaria'} wide
          footer={<><Bo onClick={()=>{setModal(false);setEdit(null);}}>Cancelar</Bo><Bg onClick={save} disabled={busy}>{busy?'Guardando...':(editando?'Guardar Cambios':'Registrar Cuenta')}</Bg></>}>
          <div className="grid grid-cols-2 gap-4">
            <FG label="Clasificación de Banco" full>
              <div className="grid grid-cols-3 gap-2">
                {TIPO_BANCO.map(t=>(
                  <label key={t.id} className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 cursor-pointer transition-all ${form.tipoBanco===t.id?'border-blue-500 bg-blue-50':'border-slate-200 hover:border-slate-300'}`}>
                    <input type="radio" name="tipoBancoEdit" value={t.id} checked={form.tipoBanco===t.id} onChange={e=>setForm({...form,tipoBanco:e.target.value})} className="sr-only"/>
                    <span className="text-2xl">{t.flag}</span>
                    <p className="text-[9px] font-black text-slate-700 uppercase text-center leading-tight">{t.id}</p>
                    <Pill usd={t.moneda!=='BS'}>{t.moneda}</Pill>
                  </label>
                ))}
              </div>
            </FG>
            <FG label="Banco / Entidad"><input className={inp} value={form.banco} onChange={e=>setForm({...form,banco:e.target.value.toUpperCase()})} placeholder="BANESCO UNIVERSAL"/></FG>
            <FG label="Número de Cuenta"><input className={inp} value={form.numeroCuenta} onChange={e=>setForm({...form,numeroCuenta:e.target.value})} placeholder="0134-0000-00-0000000000"/></FG>
            <FG label="Tipo de Cuenta"><select className={sel} value={form.tipoCuenta} onChange={e=>setForm({...form,tipoCuenta:e.target.value})}><option>Corriente</option><option>Ahorros</option><option>Nómina</option><option>Divisas</option><option>Custodia</option><option>Swift</option></select></FG>
            <FG label="Titular de la Cuenta" full><input className={inp} value={form.titular} onChange={e=>setForm({...form,titular:e.target.value.toUpperCase()})} placeholder="SERVICIOS JIRET G&B C.A."/></FG>
            <FG label={`Saldo ${editando?'Actual':'Inicial'} (${monedaDe(form.tipoBanco)})`}><input type="number" step="0.01" className={inp} value={form.saldo} onChange={e=>setForm({...form,saldo:e.target.value})}/></FG>
            <FG label="Cuenta Contable Asociada (PUC)" full>
              <select className={sel} value={form.cuentaContableCod} onChange={e=>{const c=contCuentas.find(x=>x.codigo===e.target.value);setForm({...form,cuentaContableCod:e.target.value,cuentaContableNom:c?.nombre||''})}}>
                <option value="">— Sin vincular al PUC —</option>
                {[...contCuentas].filter(c=>String(c.codigo).startsWith('1')).sort((a,b)=>String(a.codigo).localeCompare(String(b.codigo))).map(c=><option key={c.id} value={c.codigo}>{c.codigo} · {c.nombre}</option>)}
              </select>
              {form.cuentaContableCod && <p className="text-[10px] text-blue-600 font-black mt-1">✓ {form.cuentaContableCod} · {form.cuentaContableNom}</p>}
            </FG>
          </div>
        </Modal>
      </div>
    );
  };

  // ══════════════════════════════════════════════════════════════════════
  // 3. MOVIMIENTOS BANCARIOS — Ver / Editar / Eliminar + Asiento Contable
  // ══════════════════════════════════════════════════════════════════════
  const MovimientosView = () => {
    const [modal, setModal]       = useState(false);
    const [detalleId, setDetalle] = useState(null);
    const [editId, setEditId]     = useState(null);
    const [busy, setBusy]         = useState(false);
    const [filtC,    setFiltC]    = useState('');
    const [filtDesde,setFiltD]    = useState('');
    const [filtHasta,setFiltH]    = useState('');
    const [monedaVista,setMonedaVista] = useState('BS'); // BS o USD
    // Búsqueda de cuentas para contrapartidas (indexadas por posición)
    const [busqCtas, setBusqCtas] = useState({});
    const [searchTercero, setSearchTercero] = useState('');
    const [searchBanco,   setSearchBanco]   = useState('');

    // Helper: cuenta selector con grupos Bs/USD
    const CuentaSelector = ({value, onChange, label, excluirId}) => {
      const nacBs=cuentas.filter(c=>c.tipoBanco==='Nacional-Bs'&&c.id!==excluirId);
      const ext  =cuentas.filter(c=>(c.tipoBanco==='Nacional-Ext'||c.tipoBanco==='Internacional')&&c.id!==excluirId);
      return (
        <FG label={label||'Cuenta Bancaria'} full>
          <div className="space-y-2">
            <div className="relative">
              <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
              <input value={searchBanco} onChange={e=>setSearchBanco(e.target.value)}
                placeholder="Buscar banco por nombre o número..." className={`${inp} pl-8`}/>
            </div>
            <select className={`${sel} border-orange-400`} value={value} onChange={e=>{onChange(e.target.value);setSearchBanco('');}}>
              <option value="">— Seleccione la cuenta —</option>
              {nacBs.filter(c=>!searchBanco||(c.banco+' '+c.numeroCuenta).toUpperCase().includes(searchBanco.toUpperCase())).length>0&&(
                <optgroup label="🇻🇪 Cuentas Nacionales — Bolívares">
                  {nacBs.filter(c=>!searchBanco||(c.banco+' '+c.numeroCuenta).toUpperCase().includes(searchBanco.toUpperCase())).map(c=>(
                    <option key={c.id} value={c.id}>VE {c.banco} · {c.numeroCuenta} · Bs. {fmt(c.saldo)}</option>
                  ))}
                </optgroup>
              )}
              {ext.filter(c=>!searchBanco||(c.banco+' '+c.numeroCuenta).toUpperCase().includes(searchBanco.toUpperCase())).length>0&&(
                <optgroup label="💵 Cuentas Moneda Extranjera">
                  {ext.filter(c=>!searchBanco||(c.banco+' '+c.numeroCuenta).toUpperCase().includes(searchBanco.toUpperCase())).map(c=>(
                    <option key={c.id} value={c.id}>🏦 {c.banco} · {c.numeroCuenta} · {c.moneda==='USD'?'$':'€'} {fmt(c.saldo)}</option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>
        </FG>
      );
    };
    const initF = ()=>({fecha:today(),tipo:'Ingreso',cuentaId:'',cuentaDestinoId:'',
      origenIngreso:'Venta',motivoEgreso:'Pago Proveedor',
      concepto:'',referencia:'',tasa:String(tasaActiva),montoNativo:'',
      aplicaTercero:false,tipoTercero:'Cliente',terceroId:'',
      cerrarCxC:false,facturaId:'',
      ctaContraId:'',ctaContraNombre:'',
      lineasContra:[{ctaId:'',ctaNom:'',debeBs:'',haberBs:'',debeUSD:'',haberUSD:''}],
      tasaBanco:'',tasaBcv:String(tasaActiva)
    });
    const [form, setForm] = useState(initF());

    const cuentaSel  = cuentas.find(c=>c.id===form.cuentaId);
    const cuentaDest = cuentas.find(c=>c.id===form.cuentaDestinoId);
    const bs         = cuentaSel?.moneda==='BS';
    const tasa       = Number(form.tasa)||tasaActiva;
    const mNat       = Number(form.montoNativo)||0;
    const montoBs    = bs ? mNat : mNat*tasa;
    const montoUSD   = bs ? mNat/tasa : mNat;

    const factPend = form.tipoTercero==='Cliente'
      ? facturas.filter(f=>f.clienteId===form.terceroId&&f.estado==='Pendiente')
      : [];

    // Cuentas contables sugeridas para contrapartida
    const sugerirContra = () => {
      if(form.tipo==='Ingreso') return form.origenIngreso==='Venta'
        ? contCuentas.filter(c=>c.nombre?.toUpperCase().includes('COBRAR')||c.nombre?.toUpperCase().includes('INGRES'))
        : contCuentas.filter(c=>c.nombre?.toUpperCase().includes('PASIV')||c.nombre?.toUpperCase().includes('PRÉSTAMO'));
      return contCuentas.filter(c=>c.nombre?.toUpperCase().includes('PAGAR')||c.nombre?.toUpperCase().includes('GASTO'));
    };
    const sugs = sugerirContra();

    const save = async()=>{
      if(!form.cuentaId) return alert('Seleccione una cuenta bancaria');
      if(!form.montoNativo||mNat<=0) return alert('Ingrese un monto válido');
      if(!form.concepto) return alert('Ingrese el concepto');
      if(form.tipo==='Transferencia'&&!form.cuentaDestinoId) return alert('Seleccione cuenta destino');
      if(form.aplicaTercero&&!form.terceroId) return alert('Seleccione el tercero');
      setBusy(true);
      try {
        const cuenta=cuentas.find(c=>c.id===form.cuentaId);
        const signo=form.tipo==='Ingreso'?1:-1;
        const nuevoSaldo=Number(cuenta.saldo)+signo*mNat;
        const id=gid(); const batch=writeBatch(db);
        const tercero=form.tipoTercero==='Cliente'?clientes.find(c=>c.id===form.terceroId):provs.find(p=>p.id===form.terceroId);
        const factura=form.cerrarCxC&&form.facturaId?facturas.find(f=>f.id===form.facturaId):null;
        // Asiento contable — cuentas
        const ctaBancoCod  = cuentaSel?.cuentaContable?.split('·')[0]?.trim()||'';
        const ctaBancoNom  = cuentaSel?.cuentaContable?.split('·')[1]?.trim()||`Banco ${cuenta.banco}`;
        const ctaContraCod = form.ctaContraNombre?.split('·')[0]?.trim()||'';
        const ctaContraNom = form.ctaContraNombre?.split('·')[1]?.trim()||form.ctaContraNombre||(form.tipo==='Ingreso'?'Cuentas por Cobrar':'Cuentas por Pagar');
        const asientoDebito  = form.tipo==='Ingreso' ? ctaBancoNom  : ctaContraNom;
        const asientoCredito = form.tipo==='Ingreso' ? ctaContraNom : ctaBancoNom;

        // ── AUTO-GENERAR ASIENTO EN LIBRO DIARIO ──────────────────────────
        const yyyymm = form.fecha.substring(0,7).replace('-','');
        const numComp = `CB-${yyyymm}-${String(movBanco.filter(m=>m.fecha?.startsWith(form.fecha.substring(0,7))).length+1).padStart(4,'0')}`;
        const mesLabel = form.fecha.substring(5,7)+'/'+form.fecha.substring(0,4);
        const esMonedaLocal = cuenta.moneda === 'BS';
        // Línea del banco - para Traslado el banco SIEMPRE va al HABER (sale dinero del banco)
        const bancoBs=esMonedaLocal?montoBs:montoUSD*tasa;
        const bancoUSD=esMonedaLocal?montoBs/tasa:montoUSD;
        const esIngreso=form.tipo==='Ingreso';
        const esTraslado=form.tipo==='Traslado Banco→Caja';
        // Banco: Debe si Ingreso, Haber si Egreso o Traslado
        const bancoEnDebe = esIngreso && !esTraslado;
        const debitLinea = {
          codigo:cuentaSel?.cuentaContableCod||'',
          cuenta:cuentaSel?.cuentaContableNom||`Banco ${cuenta.banco}`,
          tipoLinea:bancoEnDebe?'D':'H',
          nroDoc:form.referencia||'',
          concepto:form.concepto,tasa,
          debeBs:bancoEnDebe?bancoBs:0,haberBs:bancoEnDebe?0:bancoBs,
          debeUSD:bancoEnDebe?bancoUSD:0,haberUSD:bancoEnDebe?0:bancoUSD,
        };
        // Líneas contrapartidas (compuestas)
        const lineasContraFinal=(form.lineasContra||[]).filter(l=>l.ctaId&&(Number(l.debeBs||0)>0||Number(l.haberBs||0)>0)).map(l=>{
          const ctaInfo=contCuentas.find(c=>c.id===l.ctaId)||{};
          return {
            codigo:ctaInfo.codigo||'',cuenta:ctaInfo.nombre||l.ctaNom||'',
            tipoLinea:Number(l.debeBs||0)>0?'D':'H',
            nroDoc:form.referencia||'',concepto:form.concepto,tasa,
            debeBs:Number(l.debeBs||0),haberBs:Number(l.haberBs||0),
            debeUSD:Number(l.debeUSD||0),haberUSD:Number(l.haberUSD||0),
          };
        });
        const todasLineas=[debitLinea,...lineasContraFinal];
        const asientoId=gid();
        batch.set(dref('cont_asientos',asientoId),{
          id:asientoId,
          comprobante: numComp,
          numero: numComp,
          mes: mesLabel,
          fecha: form.fecha,
          tipo: form.tipo==='Traslado Banco→Caja'?'Traslado':form.tipo==='Ingreso'?'Ingreso':'Egreso',
          subTipo: form.tipo,
          nroDocumento: form.referencia||'',
          descripcion: form.concepto.toUpperCase(),
          tasa,
          niif: false,
          efectivo: false,
          modulo: 'Bancos',
          movimientoBancoId: id,
          terceroNombre: tercero?.nombre||'',
          lineas: todasLineas,
          totalDebeBs: todasLineas.reduce((a,l)=>a+l.debeBs,0),
          totalHaberBs: todasLineas.reduce((a,l)=>a+l.haberBs,0),
          totalDebeUSD: todasLineas.reduce((a,l)=>a+l.debeUSD,0),
          totalHaberUSD: todasLineas.reduce((a,l)=>a+l.haberUSD,0),
          ts: serverTimestamp()
        });

        batch.set(dref('banco_movimientos',id),{
          id,fecha:form.fecha,tipo:form.tipo,
          cuentaId:cuenta.id,cuentaNombre:cuenta.banco,tipoBanco:cuenta.tipoBanco,moneda:cuenta.moneda,
          origenIngreso:form.origenIngreso,motivoEgreso:form.motivoEgreso,
          concepto:form.concepto,referencia:form.referencia,
          tasa,montoNativo:mNat,montoBs,montoUSD,
          saldoAnterior:Number(cuenta.saldo),saldoResultante:nuevoSaldo,
          aplicaTercero:form.aplicaTercero,tipoTercero:form.tipoTercero,
          terceroId:tercero?.id||'',terceroNombre:tercero?.nombre||'',
          facturaId:factura?.id||'',facturaNumero:factura?.numero||'',
          ctaContraId:form.ctaContraId,ctaContraNombre:form.ctaContraNombre,
          asientoDebito,asientoCredito,
          asientoContableId:asientoId,
          estatus:'No Conciliado',ts:serverTimestamp()
        });
        batch.update(dref('banco_cuentas',cuenta.id),{saldo:nuevoSaldo});
        if(form.tipo==='Transferencia'&&cuentaDest)
          batch.update(dref('banco_cuentas',cuentaDest.id),{saldo:Number(cuentaDest.saldo)+mNat});
        if(factura&&form.cerrarCxC){
          const ns=Math.max(0,factura.saldoUSD-montoUSD);
          batch.update(dref('facturacion_facturas',factura.id),{saldoUSD:ns,estado:ns<0.01?'Pagada':'Pendiente'});
        }
        await batch.commit();
        setModal(false); setForm(initF()); setBusqCtas({});
      } finally { setBusy(false); }
    };

    // Movimiento en detalle
    const movDetalle = movBanco.find(m=>m.id===detalleId);

    // Guardar EDICIÓN COMPLETA (todos los campos)
    const saveEdit = async()=>{
      if(!editId) return;
      if(!form.cuentaId) return alert('Seleccione una cuenta bancaria');
      if(!form.montoNativo||mNat<=0) return alert('Ingrese un monto válido');
      if(!form.concepto) return alert('Ingrese el concepto');
      setBusy(true);
      try {
        const movOriginal = movBanco.find(m=>m.id===editId);
        const cuentaOrig  = cuentas.find(c=>c.id===movOriginal?.cuentaId);
        const cuentaNueva = cuentas.find(c=>c.id===form.cuentaId);
        const batch = writeBatch(db);
        const signoOrig = movOriginal?.tipo==='Ingreso'?-1:1;
        if(cuentaOrig) batch.update(dref('banco_cuentas',cuentaOrig.id),{saldo:Number(cuentaOrig.saldo)+signoOrig*Number(movOriginal?.montoNativo||0)});
        const signoNuevo = form.tipo==='Ingreso'?1:-1;
        const saldoBase = cuentaOrig?.id===form.cuentaId ? Number(cuentaOrig.saldo)+signoOrig*Number(movOriginal?.montoNativo||0) : Number(cuentaNueva?.saldo||0);
        const nuevoSaldo = saldoBase + signoNuevo*mNat;
        if(cuentaNueva && cuentaOrig?.id!==form.cuentaId) batch.update(dref('banco_cuentas',cuentaNueva.id),{saldo:nuevoSaldo});
        else if(cuentaOrig?.id===form.cuentaId) batch.update(dref('banco_cuentas',form.cuentaId),{saldo:nuevoSaldo});
        const ctaBanco  = cuentaSel?.cuentaContable||`Banco ${cuentaNueva?.banco||''}`;
        const ctaContra = form.ctaContraNombre||(form.tipo==='Ingreso'?'Cuentas por Cobrar':'Cuentas por Pagar');
        const tercero   = form.tipoTercero==='Cliente'?clientes.find(c=>c.id===form.terceroId):provs.find(p=>p.id===form.terceroId);
        batch.update(dref('banco_movimientos',editId),{
          fecha:form.fecha,tipo:form.tipo,
          cuentaId:cuentaNueva?.id||form.cuentaId,cuentaNombre:cuentaNueva?.banco||'',
          tipoBanco:cuentaNueva?.tipoBanco||'',moneda:cuentaNueva?.moneda||'',
          origenIngreso:form.origenIngreso,motivoEgreso:form.motivoEgreso,
          concepto:form.concepto,referencia:form.referencia,
          tasa,montoNativo:mNat,montoBs,montoUSD,saldoResultante:nuevoSaldo,
          aplicaTercero:form.aplicaTercero,tipoTercero:form.tipoTercero,
          terceroId:tercero?.id||'',terceroNombre:tercero?.nombre||'',
          ctaContraId:form.ctaContraId,ctaContraNombre:form.ctaContraNombre,
          asientoDebito:form.tipo==='Ingreso'?ctaBanco:ctaContra,
          asientoCredito:form.tipo==='Ingreso'?ctaContra:ctaBanco,
        });
        await batch.commit();
        setEditId(null); setDetalle(null); setForm(initF());
      } finally { setBusy(false); }
    };

    // ── Eliminar con clave de administrador ───────────────────────────
    const [adminPwd, setAdminPwd]   = useState('');
    const [pwdModal, setPwdModal]   = useState(null); // movement to delete
    const [pwdError, setPwdError]   = useState(false);

    const pedirEliminar = (m) => {
      if(m.estatus==='Conciliado') return alert('Movimiento conciliado: no puede eliminarse.');
      setAdminPwd(''); setPwdError(false); setPwdModal(m);
    };

    const confirmarEliminar = async() => {
      if(adminPwd !== '1234' && adminPwd.toLowerCase() !== 'admin') {
        setPwdError(true); setTimeout(()=>setPwdError(false),1500); return;
      }
      setBusy(true);
      try {
        const m = pwdModal;
        const signo = m.tipo==='Ingreso'?-1:1;
        const cuenta = cuentas.find(c=>c.id===m.cuentaId);
        const batch=writeBatch(db);
        batch.delete(dref('banco_movimientos',m.id));
        if(cuenta) batch.update(dref('banco_cuentas',cuenta.id),{saldo:Number(cuenta.saldo)+signo*Number(m.montoNativo||0)});
        await batch.commit();
        setPwdModal(null); setDetalle(null); setAdminPwd('');
      } finally { setBusy(false); }
    };

    // ── PDF / Excel movimientos bancarios con membrete ─────────────────
    const exportarMovimientos = (formato='excel') => {
      const mList = filtC ? movBanco.filter(m=>m.cuentaId===filtC) : movBanco;
      const cuentaNom = filtC ? cuentas.find(c=>c.id===filtC)?.banco||'Todas' : 'Todas las cuentas';
      const totI=mList.filter(m=>m.tipo==='Ingreso').reduce((a,m)=>a+Number(m.montoUSD||0),0);
      const totE=mList.filter(m=>m.tipo==='Egreso' ).reduce((a,m)=>a+Number(m.montoUSD||0),0);
      const rows=mList.map((m,i)=>`<tr>
        <td>${i+1}</td>
        <td>${dd(m.fecha)}</td>
        <td style="font-weight:bold;color:${m.tipo==='Ingreso'?'#16a34a':m.tipo==='Egreso'?'#dc2626':'#2563eb'}">${m.tipo}</td>
        <td>${m.cuentaNombre||''}</td>
        <td>${m.concepto||''}</td>
        <td>${m.terceroNombre||'—'}</td>
        <td style="font-family:monospace">${m.referencia||'—'}</td>
        <td style="text-align:right;font-family:monospace;font-weight:bold;color:${m.tipo==='Ingreso'?'#16a34a':'#dc2626'}">$${fmt(m.montoUSD)}</td>
        <td style="text-align:right;font-family:monospace">Bs.${fmt(m.montoBs)}</td>
        <td style="text-align:right;font-family:monospace">${m.tasa||''}</td>
        <td><span style="background:${m.estatus==='Conciliado'?'#d1fae5':'#f1f5f9'};color:${m.estatus==='Conciliado'?'#065f46':'#64748b'};padding:2px 8px;border-radius:12px;font-size:9px;font-weight:900">${m.estatus||'Pendiente'}</span></td>
      </tr>`).join('');
      const html=letterheadOpen(
        'Reporte de Movimientos Bancarios',
        `Cuenta: ${cuentaNom} · ${filtDesde||'Inicio'} al ${filtHasta||dd(today())} · ${mList.length} movimientos`
      )+
      `<table><thead><tr><th>#</th><th>Fecha</th><th>Tipo</th><th>Banco</th><th>Concepto</th><th>Tercero</th><th>Referencia</th><th>USD</th><th>Bs.</th><th>Tasa</th><th>Estado</th></tr></thead>
      <tbody>${rows}</tbody>
      <tfoot><tr style="background:#000">
        <td colspan="7" style="color:#94a3b8;font-weight:bold;font-size:9px;text-transform:uppercase">TOTALES — ${mList.length} movimientos</td>
        <td style="text-align:right;font-family:monospace;font-weight:bold;color:#4ade80">Ing: $${fmt(totI)}<br>Egr: $${fmt(totE)}</td>
        <td colspan="3"></td>
      </tr></tfoot></table>`+
      letterheadClose(`Módulo: Tesorería & Bancos · Tasa ref: ${tasaActiva} Bs/$`);
      if(formato==='pdf'){
        printWindow(html);
      } else {
        const blob=new Blob([html],{type:'application/vnd.ms-excel;charset=utf-8'});
        const url=URL.createObjectURL(blob);const a=document.createElement('a');
        a.href=url;a.download=`movimientos_banco_${today()}.xls`;a.click();URL.revokeObjectURL(url);
      }
    };

    const abrirEdicion = (m)=>{
      setEditId(m.id); setDetalle(m.id);
      setForm({...initF(),fecha:m.fecha,tipo:m.tipo,cuentaId:m.cuentaId,
        origenIngreso:m.origenIngreso||'Venta',motivoEgreso:m.motivoEgreso||'Pago Proveedor',
        concepto:m.concepto,referencia:m.referencia||'',
        tasa:String(m.tasa||tasaActiva),montoNativo:String(m.montoNativo||''),
        aplicaTercero:m.aplicaTercero||false,tipoTercero:m.tipoTercero||'Cliente',terceroId:m.terceroId||'',
        ctaContraId:m.ctaContraId||'',ctaContraNombre:m.ctaContraNombre||''});
    };

    // ── Panel info del banco seleccionado ─────────────────────────────
    const BancoInfoPanel = ({ cuentaId }) => {
      const cuenta = cuentas.find(c=>c.id===cuentaId);
      if(!cuenta) return null;
      const bs = cuenta.moneda==='BS';
      const eur= cuenta.moneda==='EUR';
      const movCta = movBanco.filter(m=>m.cuentaId===cuentaId);
      const ultConcil = concils.filter(c=>c.cuentaId===cuentaId).sort((a,b)=>b.fecha?.localeCompare(a.fecha||'')||0)[0];
      // Saldo en USD siempre
      const saldoUSD = bs?Number(cuenta.saldo)/tasaActiva:Number(cuenta.saldo);
      const saldoBs  = bs?Number(cuenta.saldo):Number(cuenta.saldo)*tasaActiva;
      const ultSaldoConcilUSD = ultConcil?.saldoBanco||0;
      const pendientesD = movCta.filter(m=>m.tipo==='Egreso' &&m.estatus!=='Conciliado').reduce((a,m)=>a+Number(m.montoUSD||0),0);
      const pendientesC = movCta.filter(m=>m.tipo==='Ingreso'&&m.estatus!=='Conciliado').reduce((a,m)=>a+Number(m.montoUSD||0),0);
      const saldoDispUSD = saldoUSD - pendientesD + pendientesC;
      const difUltConc  = saldoUSD - ultSaldoConcilUSD;
      const rows = [
        {l:'Fecha Actual',           vbs:dd(today()),               vusd:null,          mono:false},
        {l:'Último saldo conciliado',vbs:`Bs. ${fmt(ultSaldoConcilUSD*tasaActiva)}`, vusd:`$${fmt(ultSaldoConcilUSD)}`, mono:true},
        {l:'Saldo en Libros',        vbs:`Bs. ${fmt(saldoBs)}`,     vusd:`$${fmt(saldoUSD)}`,     mono:true, bold:true},
        {l:'Débitos diferidos (-)',  vbs:`Bs. ${fmt(pendientesD*tasaActiva)}`, vusd:`$${fmt(pendientesD)}`, mono:true, red:true},
        {l:'Créditos diferidos (+)', vbs:`Bs. ${fmt(pendientesC*tasaActiva)}`, vusd:`$${fmt(pendientesC)}`, mono:true, green:true},
        {l:'Saldo disponible',       vbs:`Bs. ${fmt(saldoDispUSD*tasaActiva)}`, vusd:`$${fmt(saldoDispUSD)}`, mono:true, bold:true, accent:true},
        {l:'Dif. Ult. Conciliación', vbs:`Bs. ${fmt(difUltConc*tasaActiva)}`, vusd:`$${fmt(difUltConc)}`, mono:true, red:difUltConc<0, green:difUltConc>=0},
      ];
      return (
        <div className="rounded-xl border border-slate-200 overflow-hidden mb-4">
          <div className="px-4 py-2.5 flex items-center gap-2 border-b border-slate-200" style={{background:'#0f172a'}}>
            <Building2 size={13} className="text-blue-400"/>
            <p className="font-black text-xs text-white uppercase tracking-widest flex-1">{cuenta.banco} · {cuenta.numeroCuenta}</p>
            <Pill usd={!bs}>{cuenta.moneda}</Pill>
          </div>
          {/* Cabecera columnas */}
          <div className="grid grid-cols-3 bg-slate-50 border-b border-slate-100 px-4 py-1.5">
            <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Concepto</p>
            <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest text-right">Bs. (Bolívares)</p>
            <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest text-right">USD (Dólares)</p>
          </div>
          <div className="divide-y divide-slate-50">
            {rows.map(({l,vbs,vusd,mono,bold,red,green,accent})=>(
              <div key={l} className={`grid grid-cols-3 items-center px-4 py-2 ${accent?'bg-blue-50':''}`}>
                <p className="text-[10px] text-slate-500 font-medium">{l}</p>
                <p className={`text-right font-${mono?'mono':'medium'} text-[11px] ${bold?'font-black':'font-semibold'} ${red?'text-red-600':green?'text-emerald-600':'text-slate-700'}`}>{vbs||'—'}</p>
                <p className={`text-right font-${mono?'mono':'medium'} text-[11px] ${bold?'font-black':'font-semibold'} ${red?'text-red-600':green?'text-emerald-600':'text-slate-900'}`}>{vusd||'—'}</p>
              </div>
            ))}
          </div>
        </div>
      );
    };

    const movFilt = movBanco.filter(m=>{
      if(filtC     && m.cuentaId!==filtC)   return false;
      if(filtDesde && m.fecha<filtDesde)     return false;
      if(filtHasta && m.fecha>filtHasta)     return false;
      return true;
    });

    return (
      <div>
        {/* ── MODAL DETALLE / EDICIÓN ── */}
        {movDetalle && (
          <Modal open={!!movDetalle} onClose={()=>{setDetalle(null);setEditId(null);setForm(initF());}} title={editId?`✏ Editando — ${movDetalle.concepto}`:`Movimiento — ${movDetalle.concepto}`} wide
            footer={
              editId
                ? <><Bo onClick={()=>{setEditId(null);setForm(initF());}}>Cancelar</Bo><Bg onClick={saveEdit} disabled={busy}>{busy?'Guardando...':'Guardar Cambios'}</Bg></>
                : <><Bd onClick={()=>eliminar(movDetalle)} disabled={busy||movDetalle.estatus==='Conciliado'}>{movDetalle.estatus==='Conciliado'?'🔒 Conciliado':'🗑 Eliminar'}</Bd><div className="flex-1"/><Bg onClick={()=>abrirEdicion(movDetalle)}>✏ Editar</Bg></>
            }>
            {editId ? (
              /* MODO EDICIÓN COMPLETO */
              <div className="space-y-5">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center gap-2">
                  <Settings size={14} className="text-blue-600"/><p className="text-[10px] font-black text-blue-700 uppercase">Editando todos los campos del movimiento</p>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <FG label="Fecha"><input type="date" className={inp} value={form.fecha} onChange={e=>setForm({...form,fecha:e.target.value})}/></FG>
                  <FG label="Tipo">
                    <div className="flex gap-1">{['Ingreso','Egreso','Transferencia'].map(t=>(
                      <button key={t} onClick={()=>setForm({...form,tipo:t})}
                        className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase border ${form.tipo===t?t==='Ingreso'?'bg-emerald-500 text-white border-emerald-500':t==='Egreso'?'bg-red-500 text-white border-red-500':'bg-blue-500 text-white border-blue-500':'bg-white text-slate-500 border-slate-200'}`}>{t}</button>
                    ))}</div>
                  </FG>
                  <FG label="N° Referencia"><input className={inp} value={form.referencia} onChange={e=>setForm({...form,referencia:e.target.value})}/></FG>
                </div>
                {form.tipo==='Ingreso'&&<div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100">
                  <p className="text-[9px] font-black uppercase text-emerald-700 mb-2 tracking-widest">Origen del Ingreso</p>
                  <div className="flex gap-2 flex-wrap">{['Venta','Préstamo de Terceros','Depósito','Otros'].map(o=>(
                    <button key={o} onClick={()=>setForm({...form,origenIngreso:o})} className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase border transition-all ${form.origenIngreso===o?'bg-emerald-600 text-white border-emerald-600':'bg-white text-slate-500 border-slate-200'}`}>{o}</button>
                  ))}</div>
                </div>}
                {form.tipo==='Egreso'&&<div className="bg-red-50 rounded-xl p-3 border border-red-100">
                  <p className="text-[9px] font-black uppercase text-red-700 mb-2 tracking-widest">Motivo del Egreso</p>
                  <div className="flex gap-2 flex-wrap">{['Pago Proveedor','Nómina','Gastos Operativos','Impuestos','Préstamo','Otros'].map(o=>(
                    <button key={o} onClick={()=>setForm({...form,motivoEgreso:o})} className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase border transition-all ${form.motivoEgreso===o?'bg-red-600 text-white border-red-600':'bg-white text-slate-500 border-slate-200'}`}>{o}</button>
                  ))}</div>
                </div>}
                <FG label={`Cuenta Bancaria (${cuentas.length} disponibles)`} full>
                  <select className={sel} value={form.cuentaId} onChange={e=>setForm({...form,cuentaId:e.target.value})}>
                    <option value="">— Seleccione la cuenta —</option>
                    {cuentas.map(c=>{const tb=TIPO_BANCO.find(t=>t.id===c.tipoBanco)||TIPO_BANCO[0];return<option key={c.id} value={c.id}>{tb.flag} {c.banco} · {c.numeroCuenta} · {c.moneda==='BS'?'Bs.':'$'} {fmt(c.saldo)}</option>;})}
                  </select>
                </FG>
                {cuentaSel&&<div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
                  <div className="grid grid-cols-3 gap-4">
                    <FG label={`Monto (${cuentaSel.moneda})`}><input type="number" step="0.01" min="0.01" className={`${inp} font-black text-lg`} value={form.montoNativo} onChange={e=>setForm({...form,montoNativo:e.target.value})} placeholder="0.00"/></FG>
                    <FG label="Tasa Bs/$"><input type="number" step="0.01" className={inp} value={form.tasa} onChange={e=>setForm({...form,tasa:e.target.value})}/></FG>
                    <div className="flex flex-col justify-end pb-0.5">
                      <div className="rounded-xl p-3 text-center" style={{background:'linear-gradient(135deg,#0f172a,#1e293b)'}}>
                        <p className="text-emerald-400 font-mono font-black text-lg leading-none">${fmt(montoUSD)}</p>
                        <p className="text-slate-400 text-[10px] mt-0.5">Bs. {fmt(montoBs)}</p>
                      </div>
                    </div>
                  </div>
                </div>}
                <FG label="Concepto / Descripción" full><input className={inp} value={form.concepto} onChange={e=>setForm({...form,concepto:e.target.value})}/></FG>
                {/* Asiento contable con moneda correcta */}
                {form.tipo!=='Transferencia'&&cuentaSel&&(
                  <div className="rounded-2xl overflow-hidden border border-blue-100">
                    <div className="px-5 py-3 bg-blue-600 flex items-center gap-2">
                      <BookOpen size={14} className="text-blue-200"/><p className="text-[10px] font-black uppercase text-white tracking-widest">Asiento Contable — {bs?'Bs. (c/equiv. USD)':'USD (c/equiv. Bs.)'}</p>
                    </div>
                    <div className="p-4 bg-blue-50 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white rounded-xl p-3 border-l-4 border-emerald-500 border border-slate-100">
                          <p className="text-[8px] font-black uppercase text-emerald-600 tracking-widest mb-1">DÉBITO +</p>
                          <p className="text-[11px] font-black text-slate-800">{form.tipo==='Ingreso'?(cuentaSel.cuentaContable||`Banco ${cuentaSel.banco}`):(form.ctaContraNombre||'[Cuenta Gasto/Proveedor]')}</p>
                          {mNat>0&&<div className="mt-1"><p className="font-mono font-black text-emerald-600 text-xs">{bs?`Bs. ${fmt(montoBs)}`:`$${fmt(montoUSD)}`}</p><p className="font-mono text-slate-400 text-[10px]">{bs?`≈ $${fmt(montoUSD)}`:`≈ Bs. ${fmt(montoBs)}`}</p></div>}
                        </div>
                        <div className="bg-white rounded-xl p-3 border-l-4 border-red-500 border border-slate-100">
                          <p className="text-[8px] font-black uppercase text-red-600 tracking-widest mb-1">CRÉDITO −</p>
                          <p className="text-[11px] font-black text-slate-800">{form.tipo==='Egreso'?(cuentaSel.cuentaContable||`Banco ${cuentaSel.banco}`):(form.ctaContraNombre||'[CxC / Ingreso]')}</p>
                          {mNat>0&&<div className="mt-1"><p className="font-mono font-black text-red-600 text-xs">{bs?`Bs. ${fmt(montoBs)}`:`$${fmt(montoUSD)}`}</p><p className="font-mono text-slate-400 text-[10px]">{bs?`≈ $${fmt(montoUSD)}`:`≈ Bs. ${fmt(montoBs)}`}</p></div>}
                        </div>
                      </div>
                      <FG label="Cuenta Contrapartida (PUC)">
                        <select className={sel} value={form.ctaContraId} onChange={e=>{const c=contCuentas.find(x=>x.id===e.target.value);setForm({...form,ctaContraId:e.target.value,ctaContraNombre:c?`${c.codigo} · ${c.nombre}`:''})}}>
                          <option value="">— Seleccionar del Plan de Cuentas —</option>
                          {sugs.length>0&&<optgroup label="✨ Sugeridas">{sugs.slice(0,8).map(c=><option key={c.id} value={c.id}>{c.codigo} · {c.nombre}</option>)}</optgroup>}
                          <optgroup label="Todas">{[...contCuentas].sort((a,b)=>String(a.codigo).localeCompare(String(b.codigo))).map(c=><option key={c.id} value={c.id}>{c.codigo} · {c.nombre}</option>)}</optgroup>
                        </select>
                      </FG>
                    </div>
                  </div>
                )}
                {/* Terceros en edición */}
                <div className="border-2 border-slate-100 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-black text-slate-700 uppercase tracking-wide">Tercero Vinculado</p>
                    <button onClick={()=>setForm({...form,aplicaTercero:!form.aplicaTercero,terceroId:''})}
                      className={`w-12 h-6 rounded-full transition-all relative ${form.aplicaTercero?'bg-orange-500':'bg-slate-200'}`}>
                      <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${form.aplicaTercero?'left-6':'left-0.5'}`}/>
                    </button>
                  </div>
                  {form.aplicaTercero&&<div className="grid grid-cols-2 gap-3">
                    <FG label="Tipo"><div className="flex gap-1">{['Cliente','Proveedor'].map(t=>(
                      <button key={t} onClick={()=>setForm({...form,tipoTercero:t,terceroId:''})} className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase border-2 ${form.tipoTercero===t?'bg-slate-900 text-white border-slate-900':'bg-white text-slate-500 border-slate-200'}`}>{t}</button>
                    ))}</div></FG>
                    <FG label="Tercero">
                      <select className={sel} value={form.terceroId} onChange={e=>setForm({...form,terceroId:e.target.value})}>
                        <option value="">— Seleccione —</option>
                        {form.tipoTercero==='Cliente'?clientes.map(c=><option key={c.id} value={c.id}>{c.rif} · {c.nombre}</option>):provs.map(p=><option key={p.id} value={p.id}>{p.rif||''} · {p.nombre}</option>)}
                      </select>
                    </FG>
                  </div>}
                </div>
              </div>
            ) : (
              /* MODO VISTA DETALLE */
              <div className="space-y-5">
                <div className="flex items-center gap-4 p-4 rounded-2xl" style={{background:'linear-gradient(135deg,#0f172a,#1e293b)'}}>
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${movDetalle.tipo==='Ingreso'?'bg-emerald-500':movDetalle.tipo==='Egreso'?'bg-red-500':'bg-blue-500'}`}>
                    {movDetalle.tipo==='Ingreso'?<ArrowUpCircle size={22} className="text-white"/>:movDetalle.tipo==='Egreso'?<ArrowDownCircle size={22} className="text-white"/>:<ArrowLeftRight size={22} className="text-white"/>}
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{movDetalle.tipo} · {movDetalle.cuentaNombre}</p>
                    <p className="font-black text-white text-lg">{movDetalle.concepto}</p>
                    <p className="text-slate-400 text-[10px] mt-0.5">{dd(movDetalle.fecha)} · {movDetalle.referencia||'Sin referencia'}</p>
                  </div>
                  <div className="text-right">
                    {movDetalle.moneda==='BS'
                      ? <><p className="font-mono font-black text-2xl text-emerald-400">Bs. {fmt(movDetalle.montoBs)}</p><p className="text-slate-400 text-xs">≈ ${fmt(movDetalle.montoUSD)}</p></>
                      : <><p className="font-mono font-black text-2xl text-emerald-400">${fmt(movDetalle.montoUSD)}</p><p className="text-slate-400 text-xs">≈ Bs. {fmt(movDetalle.montoBs)}</p></>
                    }
                    <p className="text-slate-500 text-[10px]">Tasa: {movDetalle.tasa}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[['Banco / Cuenta',movDetalle.cuentaNombre],['Tipo de Banco',movDetalle.tipoBanco||'—'],['Moneda',movDetalle.moneda],['Fecha',dd(movDetalle.fecha)],
                    ['Saldo Anterior',`${movDetalle.moneda==='BS'?'Bs.':'$'} ${fmt(movDetalle.saldoAnterior)}`],['Saldo Resultante',`${movDetalle.moneda==='BS'?'Bs.':'$'} ${fmt(movDetalle.saldoResultante)}`],
                    ['N° Referencia',movDetalle.referencia||'—'],['Estado',movDetalle.estatus||'No Conciliado'],
                  ].map(([k,v])=>(
                    <div key={k} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                      <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-0.5">{k}</p>
                      <p className="font-semibold text-slate-800 text-xs">{v}</p>
                    </div>
                  ))}
                </div>
                {movDetalle.aplicaTercero&&movDetalle.terceroNombre&&(
                  <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                    <p className="text-[9px] font-black uppercase text-orange-700 tracking-widest mb-1">Tercero Vinculado</p>
                    <p className="font-black text-slate-900">{movDetalle.terceroNombre}</p>
                    {movDetalle.facturaNumero&&<p className="text-[10px] text-blue-600 font-black mt-0.5">Factura: {movDetalle.facturaNumero}</p>}
                  </div>
                )}
                {(movDetalle.asientoDebito||movDetalle.asientoCredito)&&(
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                    <p className="text-[9px] font-black uppercase text-blue-700 tracking-widest mb-3">Asiento Contable — {movDetalle.moneda==='BS'?'Bs. (c/equiv. USD)':'USD (c/equiv. Bs.)'}</p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 bg-white rounded-lg p-3 border border-blue-100">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0"/>
                        <p className="text-[9px] font-black uppercase text-emerald-700 w-14">DÉBITO</p>
                        <p className="text-xs font-semibold text-slate-700 flex-1">{movDetalle.asientoDebito}</p>
                        <div className="text-right"><p className="font-mono font-black text-xs text-emerald-700">{movDetalle.moneda==='BS'?`Bs. ${fmt(movDetalle.montoBs)}`:`$${fmt(movDetalle.montoUSD)}`}</p><p className="font-mono text-[9px] text-slate-400">{movDetalle.moneda==='BS'?`≈ $${fmt(movDetalle.montoUSD)}`:`≈ Bs. ${fmt(movDetalle.montoBs)}`}</p></div>
                      </div>
                      <div className="flex items-center gap-3 bg-white rounded-lg p-3 border border-blue-100">
                        <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0"/>
                        <p className="text-[9px] font-black uppercase text-red-600 w-14">CRÉDITO</p>
                        <p className="text-xs font-semibold text-slate-700 flex-1 pl-3">{movDetalle.asientoCredito}</p>
                        <div className="text-right"><p className="font-mono font-black text-xs text-red-600">{movDetalle.moneda==='BS'?`Bs. ${fmt(movDetalle.montoBs)}`:`$${fmt(movDetalle.montoUSD)}`}</p><p className="font-mono text-[9px] text-slate-400">{movDetalle.moneda==='BS'?`≈ $${fmt(movDetalle.montoUSD)}`:`≈ Bs. ${fmt(movDetalle.montoBs)}`}</p></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </Modal>
        )}

        {/* ── MODAL CONTRASEÑA ADMIN PARA ELIMINAR ── */}
        {pwdModal && (
          <Modal open={!!pwdModal} onClose={()=>{setPwdModal(null);setAdminPwd('');}} title="Eliminar Movimiento — Requiere Clave Admin"
            footer={<><Bo onClick={()=>{setPwdModal(null);setAdminPwd('');}}>Cancelar</Bo><Bd onClick={confirmarEliminar} disabled={busy}>{busy?'Eliminando...':'Confirmar Eliminación'}</Bd></>}>
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="font-black text-red-700 text-sm mb-1">Eliminar: {pwdModal?.concepto}</p>
                <p className="text-red-600 text-[11px]">Acción IRREVERSIBLE. Se ajustará el saldo bancario.</p>
              </div>
              <FG label="Contraseña de Administrador">
                <div className="relative"><Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14}/>
                  <input type="password" className={`${inp} pl-11 ${pwdError?'border-red-500 bg-red-50':''}`} value={adminPwd} onChange={e=>setAdminPwd(e.target.value)} onKeyDown={e=>e.key==='Enter'&&confirmarEliminar()} placeholder="Clave maestra" autoFocus/>
                </div>
                {pwdError && <p className="text-[10px] text-red-500 font-black mt-1 uppercase">Clave incorrecta</p>}
              </FG>
            </div>
          </Modal>
        )}

        {/* ── FILTROS + TABLA ── */}
        <Card title="Movimientos Bancarios" subtitle="Ingresos · Egresos · Transferencias"
          action={<div className="flex gap-2 flex-wrap items-center">
            {/* Toggle moneda */}
            <div className="flex rounded-xl overflow-hidden border-2 border-slate-200">
              <button onClick={()=>setMonedaVista('BS')} className={`px-3 py-1.5 text-[10px] font-black uppercase transition-all ${monedaVista==='BS'?'bg-blue-600 text-white':'bg-white text-slate-500 hover:bg-slate-50'}`}>Bs.</button>
              <button onClick={()=>setMonedaVista('USD')} className={`px-3 py-1.5 text-[10px] font-black uppercase transition-all ${monedaVista==='USD'?'bg-emerald-600 text-white':'bg-white text-slate-500 hover:bg-slate-50'}`}>USD $</button>
            </div>
            <select className="border-2 border-slate-200 rounded-xl px-3 py-1.5 text-xs outline-none focus:border-blue-500 text-slate-700" value={filtC} onChange={e=>setFiltC(e.target.value)}>
              <option value="">Todos los bancos</option>
              {cuentas.map(c=><option key={c.id} value={c.id}>{c.banco}</option>)}
            </select>
            <div className="flex items-center gap-1.5">
              <input type="date" className="border-2 border-slate-200 rounded-xl px-3 py-1.5 text-xs outline-none focus:border-blue-500" value={filtDesde} onChange={e=>setFiltD(e.target.value)} title="Desde"/>
              <span className="text-slate-400 text-xs font-bold">—</span>
              <input type="date" className="border-2 border-slate-200 rounded-xl px-3 py-1.5 text-xs outline-none focus:border-blue-500" value={filtHasta} onChange={e=>setFiltH(e.target.value)} title="Hasta"/>
            </div>
            {(filtC||filtDesde||filtHasta)&&<button onClick={()=>{setFiltC('');setFiltD('');setFiltH('');}} className="text-[9px] font-black uppercase text-slate-400 hover:text-red-500 px-2">✕ Limpiar</button>}
            <button onClick={()=>window.print()} className="flex items-center gap-1.5 px-3 py-2 border-2 border-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase hover:bg-slate-50"><Download size={12}/> Imprimir</button>
            <button onClick={()=>exportarMovimientos('pdf')} className="flex items-center gap-1.5 px-3 py-2 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase hover:bg-red-700"><FileText size={12}/> PDF</button>
            <button onClick={()=>exportarMovimientos('excel')} className="flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white rounded-xl text-[10px] font-black uppercase hover:bg-green-700"><FileSpreadsheet size={12}/> Excel</button>
            <Bg onClick={()=>{setForm(initF());setModal(true);}}><Plus size={13}/> Nuevo</Bg>
          </div>}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr><Th>Fecha</Th><Th>Tipo</Th><Th>Banco</Th><Th>Concepto / Tercero</Th><Th right>{monedaVista==='BS'?'Bs.':'USD'}</Th><Th right>Tasa</Th><Th>Estado</Th><Th></Th></tr></thead>
              <tbody>
                {movFilt.length===0&&<tr><td colSpan={11}><EmptyState icon={ArrowLeftRight} title="Sin movimientos" desc="Registre transacciones bancarias"/></td></tr>}
                {movFilt.map(m=><tr key={m.id} className="hover:bg-slate-50 cursor-pointer" onClick={()=>setDetalle(m.id)}>
                  <Td>{dd(m.fecha)}</Td>
                  <Td><Badge v={m.tipo==='Ingreso'?'green':m.tipo==='Egreso'?'red':m.tipo==='Traslado Banco→Caja'?'gold':'blue'}>{m.tipo==='Traslado Banco→Caja'?'Traslado':m.tipo}</Badge></Td>
                  <Td className="font-semibold text-[11px] max-w-[90px] truncate">{m.cuentaNombre}</Td>
                  <Td className="max-w-[200px]">
                    <p className="text-slate-800 text-[11px] font-medium truncate">{m.concepto}</p>
                    {m.aplicaTercero&&m.terceroNombre&&<p className="text-[10px] text-blue-600 font-black truncate">{m.terceroNombre}{m.referencia?` · ${m.referencia}`:''}</p>}
                    {(!m.aplicaTercero||!m.terceroNombre)&&m.referencia&&<p className="text-[10px] text-slate-400 font-mono">{m.referencia}</p>}
                  </Td>
                  <Td right mono className={`font-black ${m.tipo==='Ingreso'?'text-emerald-600':'text-red-500'}`}>{monedaVista==='BS'?`Bs.${fmt(m.montoBs)}`:`$${fmt(m.montoUSD)}`}</Td>
                  <Td right mono className="text-slate-400 text-[10px]">{m.tasa}</Td>
                  <Td><Badge v={m.estatus==='Conciliado'?'green':'gray'}>{m.estatus==='Conciliado'?'✓ Conc.':'Pend.'}</Badge></Td>
                  <Td>
                    <div className="flex gap-1" onClick={e=>e.stopPropagation()}>
                      <button onClick={()=>setDetalle(m.id)} className="p-1.5 text-blue-400 hover:bg-blue-50 rounded-lg" title="Ver detalle"><Search size={12}/></button>
                      <button onClick={()=>abrirEdicion(m)} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg" title="Editar"><Settings size={12}/></button>
                      <button onClick={e=>{e.stopPropagation();pedirEliminar(m);}} disabled={m.estatus==='Conciliado'} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg disabled:opacity-30" title="Eliminar (clave admin)"><Trash2 size={12}/></button>
                    </div>
                  </Td>
                </tr>)}
              </tbody>
            </table>
          </div>
        </Card>

        {/* ── MODAL NUEVO MOVIMIENTO ── */}
        <Modal open={modal} onClose={()=>setModal(false)} title="Registrar Movimiento Bancario" xwide
          footer={<><Bo onClick={()=>setModal(false)}>Cancelar</Bo><Bg onClick={save} disabled={busy}>{busy?'Registrando...':'Registrar'}</Bg></>}>
          <div className="space-y-5">
            {/* Tipo + Fecha + Ref */}
            <div className="grid grid-cols-3 gap-4">
              <FG label="Fecha"><input type="date" className={inp} value={form.fecha} onChange={e=>setForm({...form,fecha:e.target.value})}/></FG>
              <FG label="Tipo de Movimiento">
                <div className="flex gap-1 flex-wrap">
                  {['Ingreso','Egreso','Transferencia','Traslado Banco→Caja'].map(t=>(
                    <button key={t} onClick={()=>setForm({...form,tipo:t})}
                      className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase border transition-all min-w-[70px] ${form.tipo===t?t==='Ingreso'?'bg-emerald-500 text-white border-emerald-500':t==='Egreso'?'bg-red-500 text-white border-red-500':t==='Transferencia'?'bg-blue-500 text-white border-blue-500':'bg-amber-500 text-white border-amber-500':'bg-white text-slate-500 border-slate-200'}`}>{t}</button>
                  ))}
                </div>
              </FG>
              <FG label="N° Referencia"><input className={inp} value={form.referencia} onChange={e=>setForm({...form,referencia:e.target.value})} placeholder="REF-0000000"/></FG>
            </div>

            {/* Sub-tipo contextual */}
            {form.tipo==='Ingreso'&&<div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100">
              <p className="text-[9px] font-black uppercase text-emerald-700 mb-2 tracking-widest">Origen del Ingreso</p>
              <div className="flex gap-2 flex-wrap">{['Venta','Préstamo de Terceros','Depósito','Otros'].map(o=>(
                <button key={o} onClick={()=>setForm({...form,origenIngreso:o})} className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase border transition-all ${form.origenIngreso===o?'bg-emerald-600 text-white border-emerald-600':'bg-white text-slate-500 border-slate-200'}`}>{o}</button>
              ))}</div>
            </div>}
            {form.tipo==='Egreso'&&<div className="bg-red-50 rounded-xl p-3 border border-red-100">
              <p className="text-[9px] font-black uppercase text-red-700 mb-2 tracking-widest">Motivo del Egreso</p>
              <div className="flex gap-2 flex-wrap">{['Pago Proveedor','Nómina','Gastos Operativos','Impuestos','Préstamo','Otros'].map(o=>(
                <button key={o} onClick={()=>setForm({...form,motivoEgreso:o})} className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase border transition-all ${form.motivoEgreso===o?'bg-red-600 text-white border-red-600':'bg-white text-slate-500 border-slate-200'}`}>{o}</button>
              ))}</div>
            </div>}

            {/* Cuenta(s) */}
            {form.tipo!=='Transferencia'&&form.tipo!=='Traslado Banco→Caja'
              ? <CuentaSelector value={form.cuentaId} onChange={v=>setForm({...form,cuentaId:v})} label={`Cuenta Bancaria (${cuentas.length} disponibles)`}/>
              : <div className="grid grid-cols-2 gap-4">
                  <CuentaSelector value={form.cuentaId} onChange={v=>setForm({...form,cuentaId:v})} label={form.tipo==='Traslado Banco→Caja'?'🏦 Banco Origen (débito)':'🏦 Banco Origen'} excluirId={form.cuentaDestinoId}/>
                  {form.tipo==='Transferencia'&&<CuentaSelector value={form.cuentaDestinoId} onChange={v=>setForm({...form,cuentaDestinoId:v})} label="🏦 Banco Destino" excluirId={form.cuentaId}/>}
                </div>
            }

            {/* Panel informativo del banco seleccionado */}
            {form.cuentaId && <BancoInfoPanel cuentaId={form.cuentaId}/>}

            {/* Monto + Tasa + Conversión */}
            {cuentaSel&&<div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
              <div className="grid grid-cols-3 gap-4">
                <FG label={`Monto (${cuentaSel.moneda})`}>
                  <input type="number" step="0.01" min="0.01" className={`${inp} font-black text-lg`} value={form.montoNativo} onChange={e=>setForm({...form,montoNativo:e.target.value})} placeholder="0.00"/>
                </FG>
                <FG label="Tasa de Cambio Bs/$">
                  <input type="number" step="0.01" className={inp} value={form.tasa} onChange={e=>setForm({...form,tasa:e.target.value})}/>
                </FG>
                <div className="flex flex-col justify-end pb-0.5">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Equivalencia</p>
                  <div className="rounded-xl p-3 text-center" style={{background:'linear-gradient(135deg,#0f172a,#1e293b)'}}>
                    <p className="text-emerald-400 font-mono font-black text-lg leading-none">${fmt(montoUSD)}</p>
                    <p className="text-slate-400 text-[10px] mt-0.5">Bs. {fmt(montoBs)}</p>
                  </div>
                </div>
              </div>
              <p className="text-[9px] text-slate-400 font-bold mt-2">{bs?`${fmt(mNat)} Bs ÷ ${tasa} = $${fmt(montoUSD)}`:`$${fmt(mNat)} × ${tasa} = Bs.${fmt(montoBs)}`}</p>
            </div>}

            {/* Concepto */}
            <FG label="Concepto / Descripción" full><input className={inp} value={form.concepto} onChange={e=>setForm({...form,concepto:e.target.value})} placeholder="Descripción del movimiento..."/></FG>

            {/* ── ASIENTO CONTABLE COMPUESTO ── */}
            {form.tipo!=='Transferencia' && cuentaSel && (
              <div className="rounded-2xl overflow-hidden border border-blue-100">
                <div className="px-5 py-3 bg-blue-600 flex items-center gap-2">
                  <BookOpen size={14} className="text-blue-200"/>
                  <p className="text-[10px] font-black uppercase text-white tracking-widest">
                    Asiento Contable — {bs?'Bs. (moneda funcional) + equiv. USD':'USD (moneda funcional) + equiv. Bs.'}
                  </p>
                </div>
                <div className="p-4 bg-blue-50 space-y-3">
                  {/* Cabecera de columnas */}
                  <div className="grid gap-1 text-[8px] font-black uppercase text-slate-500 tracking-widest px-1"
                    style={{gridTemplateColumns:'2.5fr 1fr 1fr 1fr 1fr 28px'}}>
                    <div>Cuenta Contable</div>
                    <div className="text-right text-emerald-600">Debe Bs.</div>
                    <div className="text-right text-red-500">Haber Bs.</div>
                    <div className="text-right text-emerald-700">Debe USD</div>
                    <div className="text-right text-red-600">Haber USD</div>
                    <div></div>
                  </div>

                  {/* Línea del banco (pre-fija, no editable cuenta) */}
                  {(() => {
                    const bancoLbl = cuentaSel?.cuentaContableCod
                      ? `${cuentaSel.cuentaContableCod} · ${cuentaSel.banco}`
                      : `Banco ${cuentaSel.banco}`;
                    const esDebito = (form.tipo==='Ingreso'); // Traslado: banco va al HABER
                    const montoFuncional = bs?montoBs:montoUSD;
                    const montoEquiv    = bs?montoUSD:montoBs;
                    return (
                      <div className="grid gap-2 px-1 py-2 bg-white rounded-xl border border-slate-200 items-center"
                        style={{gridTemplateColumns:'2.5fr 1fr 1fr 1fr 1fr 28px'}}>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0"/>
                          <p className="text-[10px] font-black text-slate-800 truncate">{bancoLbl}</p>
                          <span className="text-[8px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-black uppercase flex-shrink-0">Banco</span>
                        </div>
                        <p className={`text-right font-mono font-black text-xs ${esDebito?'text-emerald-700':'text-slate-300'}`}>{esDebito?(bs?`Bs.${fmt(montoBs)}`:`$${fmt(montoUSD)}`):''}</p>
                        <p className={`text-right font-mono font-black text-xs ${!esDebito?'text-red-600':'text-slate-300'}`}>{!esDebito?(bs?`Bs.${fmt(montoBs)}`:`$${fmt(montoUSD)}`):''}</p>
                        <p className={`text-right font-mono text-[10px] ${esDebito?'text-emerald-600':'text-slate-300'}`}>{esDebito?`$${fmt(montoUSD)}`:''}</p>
                        <p className={`text-right font-mono text-[10px] ${!esDebito?'text-red-500':'text-slate-300'}`}>{!esDebito?`$${fmt(montoUSD)}`:''}</p>
                        <div/>
                      </div>
                    );
                  })()}

                  {/* Líneas de contrapartida (editables, múltiples) */}
                  <p className="text-[9px] font-black uppercase text-slate-500 tracking-widest mt-1 mb-1">Contrapartidas</p>
                  {form.lineasContra.map((l,i)=>{
                    const busqCta = busqCtas[i]||'';
                    const setBusqCta = (v) => setBusqCtas(prev=>({...prev,[i]:v}));
                    const ctasFiltradas=[...contCuentas]
                      .filter(c=>!busqCta||(c.codigo+' '+c.nombre).toUpperCase().includes(busqCta.toUpperCase()))
                      .sort((a,b)=>String(a.codigo).localeCompare(String(b.codigo)));
                    return (
                      <div key={i} className="bg-white rounded-xl border border-slate-200 p-3 space-y-2">
                        {/* Buscador de cuenta */}
                        <div className="relative">
                          <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"/>
                          <input value={busqCta} onChange={e=>setBusqCta(e.target.value)}
                            placeholder="Buscar cuenta por código o nombre..." className="w-full text-[10px] border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 outline-none focus:border-blue-400"/>
                        </div>
                        <div className="grid gap-2 items-center" style={{gridTemplateColumns:'2.5fr 1fr 1fr 1fr 1fr 28px'}}>
                          <select className="text-[10px] border border-slate-200 rounded-lg px-2 py-1.5 outline-none focus:border-blue-400 bg-white font-medium"
                            value={l.ctaId} onChange={e=>{
                              const c=contCuentas.find(x=>x.id===e.target.value);
                              const nl=[...form.lineasContra];nl[i]={...nl[i],ctaId:e.target.value,ctaNom:c?`${c.codigo} · ${c.nombre}`:''};
                              setForm({...form,lineasContra:nl});setBusqCta('');
                            }}>
                            <option value="">— Seleccione cuenta —</option>
                            {ctasFiltradas.slice(0,80).map(c=><option key={c.id} value={c.id}>{c.codigo} · {c.nombre}</option>)}
                            {ctasFiltradas.length>80&&<option disabled>...escribe más para filtrar ({ctasFiltradas.length} resultados)</option>}
                          </select>
                          <input type="number" step="0.01" className="text-right text-xs border border-slate-200 rounded-lg px-2 py-1.5 outline-none focus:border-emerald-400 font-mono"
                            value={l.debeBs||''} onChange={e=>{const nl=[...form.lineasContra];nl[i]={...nl[i],debeBs:e.target.value,debeUSD:e.target.value&&tasa?String((Number(e.target.value)/tasa).toFixed(2)):nl[i].debeUSD};setForm({...form,lineasContra:nl});}} placeholder="Debe Bs."/>
                          <input type="number" step="0.01" className="text-right text-xs border border-slate-200 rounded-lg px-2 py-1.5 outline-none focus:border-red-400 font-mono"
                            value={l.haberBs||''} onChange={e=>{const nl=[...form.lineasContra];nl[i]={...nl[i],haberBs:e.target.value,haberUSD:e.target.value&&tasa?String((Number(e.target.value)/tasa).toFixed(2)):nl[i].haberUSD};setForm({...form,lineasContra:nl});}} placeholder="Haber Bs."/>
                          <input type="number" step="0.01" className="text-right text-[10px] border border-slate-200 rounded-lg px-2 py-1.5 outline-none focus:border-emerald-400 font-mono"
                            value={l.debeUSD||''} onChange={e=>{const nl=[...form.lineasContra];nl[i]={...nl[i],debeUSD:e.target.value,debeBs:e.target.value&&tasa?String((Number(e.target.value)*tasa).toFixed(2)):nl[i].debeBs};setForm({...form,lineasContra:nl});}} placeholder="Debe $"/>
                          <input type="number" step="0.01" className="text-right text-[10px] border border-slate-200 rounded-lg px-2 py-1.5 outline-none focus:border-red-400 font-mono"
                            value={l.haberUSD||''} onChange={e=>{const nl=[...form.lineasContra];nl[i]={...nl[i],haberUSD:e.target.value,haberBs:e.target.value&&tasa?String((Number(e.target.value)*tasa).toFixed(2)):nl[i].haberBs};setForm({...form,lineasContra:nl});}} placeholder="Haber $"/>
                          <button onClick={()=>{if(form.lineasContra.length<=1)return;const nl=[...form.lineasContra];nl.splice(i,1);setForm({...form,lineasContra:nl});}}
                            className="text-red-400 hover:text-red-600 flex justify-center"><X size={12}/></button>
                        </div>
                        {l.ctaId&&<p className="text-[9px] text-blue-600 font-black">✓ {l.ctaNom}</p>}
                      </div>
                    );
                  })}

                  {/* Totales y cuadre */}
                  {(() => {
                    const totDebeBs=form.lineasContra.reduce((a,l)=>a+Number(l.debeBs||0),0);
                    const totHaberBs=form.lineasContra.reduce((a,l)=>a+Number(l.haberBs||0),0);
                    const totDebeUSD=form.lineasContra.reduce((a,l)=>a+Number(l.debeUSD||0),0);
                    const totHaberUSD=form.lineasContra.reduce((a,l)=>a+Number(l.haberUSD||0),0);
                    const bancoBs=bs?montoBs:montoUSD*tasa; const bancoUSD=bs?montoBs/tasa:montoUSD;
                    const diff=Math.abs((form.tipo==='Ingreso'?totHaberBs:totDebeBs)-bancoBs);
                    const cuadrado=diff<0.05;
                    return (
                      <div className="mt-1 space-y-2">
                        <div className="grid gap-2 px-1 py-2 bg-slate-900 rounded-xl items-center" style={{gridTemplateColumns:'2.5fr 1fr 1fr 1fr 1fr 28px'}}>
                          <p className="text-[9px] font-black uppercase text-slate-400">TOTALES CONTRAPARTIDA</p>
                          <p className="text-right font-mono font-black text-[10px] text-emerald-400">Bs.{fmt(totDebeBs)}</p>
                          <p className="text-right font-mono font-black text-[10px] text-red-400">Bs.{fmt(totHaberBs)}</p>
                          <p className="text-right font-mono text-[10px] text-emerald-400">${fmt(totDebeUSD)}</p>
                          <p className="text-right font-mono text-[10px] text-red-400">${fmt(totHaberUSD)}</p>
                          <div className="flex justify-center">{cuadrado?<CheckCircle size={13} className="text-emerald-400"/>:<X size={13} className="text-amber-400"/>}</div>
                        </div>
                        {!cuadrado&&mNat>0&&<p className="text-[9px] text-amber-600 font-black">⚠ Diferencia Bs.: {fmt(diff)} — el asiento puede ser parcial</p>}
                      </div>
                    );
                  })()}

                  </div>
                  )}

                  {/* Botón agregar línea */}
                  <button onClick={()=>setForm({...form,lineasContra:[...form.lineasContra,{ctaId:'',ctaNom:'',debeBs:'',haberBs:'',debeUSD:'',haberUSD:''}]})}
                    className="flex items-center gap-1.5 text-[10px] font-black uppercase text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors">
                    <Plus size={12}/> Agregar Cuenta Contrapartida
                  </button>

                  {/* Alerta de balance del asiento */}
                  {form.tipo!=='Transferencia'&&cuentaSel&&mNat>0&&(()=>{
                    const totContra=form.lineasContra.reduce((a,l)=>a+Number(l.debeBs||0)+Number(l.haberBs||0),0);
                    const bancoAmt=bs?montoBs:montoUSD*tasa;
                    const diff=Math.abs(totContra-bancoAmt);
                    const cuadrado=diff<0.05&&totContra>0;
                    return cuadrado
                      ? <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 border-2 border-emerald-400 rounded-xl"><CheckCircle size={16} className="text-emerald-600 flex-shrink-0"/><p className="text-[11px] font-black text-emerald-700 uppercase">✓ Asiento Cuadrado — Débitos = Créditos</p></div>
                      : totContra>0
                        ? <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border-2 border-red-400 rounded-xl"><AlertTriangle size={16} className="text-red-600 flex-shrink-0"/><div><p className="text-[11px] font-black text-red-700 uppercase">⚠ Asiento NO Cuadrado</p><p className="text-[10px] text-red-600">Diferencia: Bs.{fmt(diff)} — El asiento no puede ser registrado sin cuadrar.</p></div></div>
                        : <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 border border-amber-300 rounded-xl"><AlertTriangle size={14} className="text-amber-600 flex-shrink-0"/><p className="text-[10px] font-black text-amber-700 uppercase">Complete las contrapartidas para cuadrar el asiento</p></div>;
                  })()}

                  {/* Traslado automático: tasa banco vs tasa BCV + rebancarización */}
                  {form.tipo==='Traslado Banco→Caja'&&cuentaSel&&mNat>0&&(
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
                      <p className="text-[9px] font-black uppercase text-amber-700 tracking-widest">⚡ Asistente de Rebancarización</p>
                      <div className="grid grid-cols-2 gap-3">
                        <FG label="Tasa del Banco (a la que salió)">
                          <input type="number" step="0.01" className={inp} value={form.tasaBanco||form.tasa}
                            onChange={e=>setForm({...form,tasaBanco:e.target.value})} placeholder="Ej: 375.08"/>
                          <p className="text-[9px] text-slate-400 mt-1">Bs. que salieron del banco ÷ USD</p>
                        </FG>
                        <FG label="Tasa BCV (a la que entra a caja)">
                          <input type="number" step="0.01" className={inp} value={form.tasaBcv||tasaActiva}
                            onChange={e=>setForm({...form,tasaBcv:e.target.value})} placeholder={String(tasaActiva)}/>
                          <p className="text-[9px] text-slate-400 mt-1">USD que entran a caja</p>
                        </FG>
                      </div>
                      {form.tasaBanco&&form.tasaBcv&&mNat>0&&(()=>{
                        const tBanco=Number(form.tasaBanco)||tasa;
                        const tBcv  =Number(form.tasaBcv)||tasa;
                        const bsSalidos=bs?mNat:mNat*tBanco;     // Bs. que salen del banco
                        const usdEntran=bsSalidos/tBcv;           // USD que entran a caja (a tasa BCV)
                        const usdBanco =bs?mNat/tBanco:mNat;      // USD al precio del banco
                        const diffUSD  =usdBanco-usdEntran;       // diferencia = rebancarización
                        const diffBs   =diffUSD*tBcv;
                        return(
                          <div className="bg-white rounded-xl p-3 border border-amber-200 space-y-2">
                            <div className="grid grid-cols-3 gap-2 text-[10px]">
                              <div className="bg-slate-50 rounded-lg p-2 text-center"><p className="text-slate-400 font-medium">Salen del banco</p><p className="font-mono font-black text-slate-900">Bs.{fmt(bsSalidos)}</p><p className="text-slate-400">= ${fmt(usdBanco)} (t.banco)</p></div>
                              <div className="bg-emerald-50 rounded-lg p-2 text-center"><p className="text-emerald-600 font-black">Entran a caja</p><p className="font-mono font-black text-emerald-700">${fmt(usdEntran)}</p><p className="text-emerald-500">a tasa BCV</p></div>
                              <div className="bg-red-50 rounded-lg p-2 text-center"><p className="text-red-600 font-black">Diferencial</p><p className="font-mono font-black text-red-600">${fmt(diffUSD)}</p><p className="text-red-400">Bs.{fmt(diffBs)}</p></div>
                            </div>
                            <button onClick={()=>{
                              // Auto-poblar las líneas contrapartida con Traslado y Rebancarización
                              const ctasTraslado=contCuentas.filter(c=>c.nombre?.toUpperCase().includes('TRASLADO'));
                              const ctasReb=contCuentas.filter(c=>c.nombre?.toUpperCase().includes('REBANCAR')||c.nombre?.toUpperCase().includes('DIFERENC'));
                              const nl=[
                                {ctaId:ctasTraslado[0]?.id||'',ctaNom:ctasTraslado[0]?`${ctasTraslado[0].codigo} · ${ctasTraslado[0].nombre}`:'Traslados de Fondos',debeBs:fmt(bsSalidos-diffBs).replace(/,/g,''),haberBs:'',debeUSD:fmt(usdEntran).replace(/,/g,''),haberUSD:''},
                                {ctaId:ctasReb[0]?.id||'',ctaNom:ctasReb[0]?`${ctasReb[0].codigo} · ${ctasReb[0].nombre}`:'Diferencias en Compensación',debeBs:fmt(diffBs).replace(/,/g,''),haberBs:'',debeUSD:fmt(diffUSD).replace(/,/g,''),haberUSD:''},
                              ];
                              setForm({...form,lineasContra:nl,tasa:form.tasaBanco});
                            }}
                              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 text-white rounded-xl text-[10px] font-black uppercase hover:bg-amber-600 transition-colors">
                              <ArrowRight size={12}/> Aplicar Rebancarización Automática
                            </button>
                          </div>
                        );
                      })()}
                </div>
              </div>
            )}

            {/* Terceros */}
            {form.tipo!=='Transferencia'&&<div className="border-2 border-slate-100 rounded-2xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div><p className="text-xs font-black text-slate-700 uppercase tracking-wide">Vincular a Tercero</p><p className="text-[10px] text-slate-400">Asociar a cliente (CxC) o proveedor (CxP)</p></div>
                <button onClick={()=>setForm({...form,aplicaTercero:!form.aplicaTercero,terceroId:'',facturaId:'',cerrarCxC:false})}
                  className={`w-12 h-6 rounded-full transition-all relative ${form.aplicaTercero?'bg-orange-500':'bg-slate-200'}`}>
                  <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${form.aplicaTercero?'left-6':'left-0.5'}`}/>
                </button>
              </div>
              {form.aplicaTercero&&<div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <FG label="Tipo">
                    <div className="flex gap-1">{['Cliente','Proveedor'].map(t=>(
                      <button key={t} onClick={()=>setForm({...form,tipoTercero:t,terceroId:'',facturaId:''})}
                        className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase border-2 transition-all ${form.tipoTercero===t?'bg-slate-900 text-white border-slate-900':'bg-white text-slate-500 border-slate-200'}`}>{t}</button>
                    ))}</div>
                  </FG>
                  <FG label={form.tipoTercero==='Cliente'?`Clientes (${clientes.length})`:`Proveedores (${provs.length})`}>
                    <div className="space-y-2">
                      <div className="relative">
                        <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                        <input value={searchTercero} onChange={e=>setSearchTercero(e.target.value)}
                          placeholder={`Buscar ${form.tipoTercero.toLowerCase()} por RIF o nombre...`} className={`${inp} pl-8`}/>
                      </div>
                      <select className={sel} value={form.terceroId} onChange={e=>{setForm({...form,terceroId:e.target.value,facturaId:''});setSearchTercero('');}}>
                        <option value="">— Seleccione —</option>
                        {(form.tipoTercero==='Cliente'
                          ? clientes.filter(c=>!searchTercero||(c.rif+' '+c.nombre).toUpperCase().includes(searchTercero.toUpperCase()))
                          : provs.filter(p=>!searchTercero||((p.rif||'')+' '+(p.nombre||'')).toUpperCase().includes(searchTercero.toUpperCase()))
                        ).map(x=><option key={x.id} value={x.id}>{x.rif} · {x.nombre}</option>)}
                      </select>
                    </div>
                  </FG>
                </div>
                {form.tipoTercero==='Cliente'&&form.terceroId&&(
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-black uppercase text-slate-600">Cerrar Cuenta por Cobrar</p>
                      <button onClick={()=>setForm({...form,cerrarCxC:!form.cerrarCxC,facturaId:''})}
                        className={`w-10 h-5 rounded-full transition-all relative ${form.cerrarCxC?'bg-blue-500':'bg-slate-200'}`}>
                        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${form.cerrarCxC?'left-5':'left-0.5'}`}/>
                      </button>
                    </div>
                    {form.cerrarCxC&&(factPend.length>0
                      ?factPend.map(f=>(
                        <label key={f.id} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${form.facturaId===f.id?'border-blue-500 bg-blue-50':'border-slate-200 hover:border-slate-100'}`}>
                          <input type="radio" name="fid" value={f.id} checked={form.facturaId===f.id} onChange={()=>setForm({...form,facturaId:f.id})} className="accent-blue-500"/>
                          <div className="flex-1"><p className="font-black text-xs text-slate-900">{f.numero} · {dd(f.fechaVencimiento)}</p></div>
                          <p className="font-mono font-black text-orange-500">${fmt(f.saldoUSD)}</p>
                          {f.fechaVencimiento<today()&&<Badge v="red">Vencida</Badge>}
                        </label>
                      ))
                      :<div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2"><CheckCircle size={14} className="text-emerald-500"/><p className="text-[10px] font-black text-emerald-700">Sin facturas pendientes.</p></div>
                    )}
                  </div>
                )}
              </div>}
            </div>}
          </div>
        </Modal>
      </div>
    );
  };

  // ══════════════════════════════════════════════════════════════════════
  // 4. CAJA — OPERACIONES DE EFECTIVO
  // ══════════════════════════════════════════════════════════════════════
  const CajaOpView = () => {
    const [modal, setModal] = useState(false);
    const [busy, setBusy]   = useState(false);
    const initF = ()=>({fecha:today(),tipo:'Ingreso',moneda:'BS',concepto:'',referencia:'',monto:'',tasa:String(tasaActiva),aplicaTercero:false,tipoTercero:'Cliente',terceroId:''});
    const [form, setForm] = useState(initF());
    const monto  = Number(form.monto)||0;
    const tasa   = Number(form.tasa)||tasaActiva;
    const montoBs  = form.moneda==='BS' ? monto : monto*tasa;
    const montoUSD = form.moneda==='BS' ? monto/tasa : monto;
    const saldoBs  = movCaja.filter(m=>m.moneda==='BS' ).reduce((a,m)=>a+(m.tipo==='Ingreso'?1:-1)*Number(m.montoBs||0),0);
    const saldoUSD = movCaja.filter(m=>m.moneda==='USD').reduce((a,m)=>a+(m.tipo==='Ingreso'?1:-1)*Number(m.montoUSD||0),0);

    const save = async()=>{
      if(!form.monto||monto<=0) return alert('Ingrese un monto válido');
      if(!form.concepto) return alert('Ingrese el concepto');
      setBusy(true);
      try {
        const id=gid(); const tercero=form.tipoTercero==='Cliente'?clientes.find(c=>c.id===form.terceroId):provs.find(p=>p.id===form.terceroId);
        await setDoc(dref('caja_movimientos',id),{id,fecha:form.fecha,tipo:form.tipo,moneda:form.moneda,concepto:form.concepto,referencia:form.referencia,monto,montoBs,montoUSD,tasa,aplicaTercero:form.aplicaTercero,tipoTercero:form.tipoTercero,terceroId:tercero?.id||'',terceroNombre:tercero?.nombre||'',ts:serverTimestamp()});
        setModal(false); setForm(initF()); setBusqCtas({});
      } finally { setBusy(false); }
    };

    return (
      <div className="space-y-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPI label="Saldo Caja Bs." value={`Bs.${fmt(saldoBs)}`} accent={saldoBs>=0?'green':'red'} Icon={Banknote} sub={`≈ $${fmt(saldoBs/tasaActiva)}`}/>
          <KPI label="Saldo Caja USD" value={`$${fmt(saldoUSD)}`} accent={saldoUSD>=0?'green':'red'} Icon={DollarSign}/>
          <KPI label="Movimientos Hoy" value={movCaja.filter(m=>m.fecha===today()).length} accent="blue" Icon={ArrowLeftRight}/>
          <KPI label="Total Movimientos" value={movCaja.length} accent="purple" Icon={FileText}/>
        </div>

        <Card title="Movimientos de Caja" subtitle="Efectivo Bs. y Divisas"
          action={<Bg onClick={()=>{setForm(initF());setModal(true);}}><Plus size={13}/> Nuevo Movimiento</Bg>}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr><Th>Fecha</Th><Th>Tipo</Th><Th>Moneda</Th><Th>Concepto</Th><Th>Tercero</Th><Th>Ref.</Th><Th right>Monto Bs.</Th><Th right>Monto USD</Th><Th right>Tasa</Th></tr></thead>
              <tbody>
                {movCaja.length===0&&<tr><td colSpan={9}><EmptyState icon={Banknote} title="Sin movimientos de caja" desc="Registre ingresos y egresos de efectivo"/></td></tr>}
                {movCaja.map(m=><tr key={m.id} className="hover:bg-slate-50">
                  <Td>{dd(m.fecha)}</Td>
                  <Td><Badge v={m.tipo==='Ingreso'?'green':'red'}>{m.tipo}</Badge></Td>
                  <Td><Pill usd={m.moneda==='USD'}>{m.moneda}</Pill></Td>
                  <Td className="max-w-[130px] truncate">{m.concepto}</Td>
                  <Td className="text-[10px] max-w-[100px] truncate">{m.terceroNombre||'—'}</Td>
                  <Td mono className="text-slate-400 text-[10px]">{m.referencia||'—'}</Td>
                  <Td right mono className={`font-black ${m.tipo==='Ingreso'?'text-emerald-600':'text-red-500'}`}>Bs.{fmt(m.montoBs)}</Td>
                  <Td right mono className={`text-xs ${m.tipo==='Ingreso'?'text-emerald-500':'text-red-400'}`}>${fmt(m.montoUSD)}</Td>
                  <Td right mono className="text-slate-400 text-[10px]">{m.tasa}</Td>
                </tr>)}
              </tbody>
            </table>
          </div>
        </Card>

        <Modal open={modal} onClose={()=>setModal(false)} title="Movimiento de Caja" wide
          footer={<><Bo onClick={()=>setModal(false)}>Cancelar</Bo><Bg onClick={save} disabled={busy}>{busy?'Registrando...':'Registrar'}</Bg></>}>
          <div className="space-y-5">
            <div className="grid grid-cols-3 gap-4">
              <FG label="Fecha"><input type="date" className={inp} value={form.fecha} onChange={e=>setForm({...form,fecha:e.target.value})}/></FG>
              <FG label="Tipo">
                <div className="flex gap-1">
                  {['Ingreso','Egreso'].map(t=>(
                    <button key={t} onClick={()=>setForm({...form,tipo:t})}
                      className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase border-2 transition-all ${form.tipo===t?t==='Ingreso'?'bg-emerald-500 text-white border-emerald-500':'bg-red-500 text-white border-red-500':'bg-white text-slate-500 border-slate-200'}`}>{t}</button>
                  ))}
                </div>
              </FG>
              <FG label="Moneda de Efectivo">
                <div className="flex gap-1">
                  {[{m:'BS',l:'Bs. 🇻🇪'},{m:'USD',l:'USD 🇺🇸'}].map(({m,l})=>(
                    <button key={m} onClick={()=>setForm({...form,moneda:m})}
                      className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase border-2 transition-all ${form.moneda===m?'bg-slate-900 text-white border-slate-900':'bg-white text-slate-500 border-slate-200'}`}>{l}</button>
                  ))}
                </div>
              </FG>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <FG label={`Monto (${form.moneda})`}><input type="number" step="0.01" min="0.01" className={`${inp} font-black text-lg`} value={form.monto} onChange={e=>setForm({...form,monto:e.target.value})} placeholder="0.00"/></FG>
              <FG label="Tasa de Cambio Bs/$"><input type="number" step="0.01" className={inp} value={form.tasa} onChange={e=>setForm({...form,tasa:e.target.value})}/></FG>
              <div className="flex flex-col justify-end pb-0.5">
                <p className="text-[9px] font-black text-slate-400 uppercase mb-1.5">Equivalencia</p>
                <div className="rounded-xl p-3 text-center" style={{background:'linear-gradient(135deg,#0f172a,#1e293b)'}}>
                  <p className="text-emerald-400 font-mono font-black text-base">${fmt(montoUSD)}</p>
                  <p className="text-slate-400 text-[10px]">Bs.{fmt(montoBs)}</p>
                </div>
              </div>
            </div>
            <FG label="Concepto" full><input className={inp} value={form.concepto} onChange={e=>setForm({...form,concepto:e.target.value})} placeholder="Descripción del movimiento de caja..."/></FG>
            <FG label="Referencia"><input className={inp} value={form.referencia} onChange={e=>setForm({...form,referencia:e.target.value})} placeholder="REF-000"/></FG>
            {/* Tercero */}
            <div className="border-2 border-slate-100 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-black text-slate-700 uppercase tracking-wide">Vincular a Tercero</p>
                <button onClick={()=>setForm({...form,aplicaTercero:!form.aplicaTercero,terceroId:''})}
                  className={`w-12 h-6 rounded-full transition-all relative ${form.aplicaTercero?'bg-orange-500':'bg-slate-200'}`}>
                  <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${form.aplicaTercero?'left-6':'left-0.5'}`}/>
                </button>
              </div>
              {form.aplicaTercero&&<div className="grid grid-cols-2 gap-3">
                <FG label="Tipo"><div className="flex gap-1">{['Cliente','Proveedor'].map(t=>(
                  <button key={t} onClick={()=>setForm({...form,tipoTercero:t,terceroId:''})} className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase border-2 transition-all ${form.tipoTercero===t?'bg-slate-900 text-white border-slate-900':'bg-white text-slate-500 border-slate-200'}`}>{t}</button>
                ))}</div></FG>
                <FG label={form.tipoTercero==='Cliente'?`Clientes (${clientes.length})`:`Proveedores (${provs.length})`}>
                  <select className={sel} value={form.terceroId} onChange={e=>setForm({...form,terceroId:e.target.value})}>
                    <option value="">— Seleccione —</option>
                    {form.tipoTercero==='Cliente'
                      ?clientes.map(c=><option key={c.id} value={c.id}>{c.rif} · {c.nombre}</option>)
                      :provs.map(p=><option key={p.id} value={p.id}>{p.rif||''} · {p.nombre}</option>)}
                  </select>
                </FG>
              </div>}
            </div>
          </div>
        </Modal>
      </div>
    );
  };


  // ══════════════════════════════════════════════════════════════════════
  // 5b. RELACIÓN DE VALES (dinero en caja aún no recibido físicamente)
  // ══════════════════════════════════════════════════════════════════════
  const ValesView = () => {
    const [modal,setModal]=useState(false);
    const [detalle,setDetalle]=useState(null);
    const [busy,setBusy]=useState(false);
    const [vales,setVales]=useState([]);
    const [clientes2,setClientes2]=useState([]);
    const [provs2,setProvs2]=useState([]);
    const [contCuentas2,setCuentas2]=useState([]);
    useEffect(()=>{
      const s1=onSnapshot(query(col('caja_vales'),orderBy('fecha','desc')),s=>setVales(s.docs.map(d=>d.data())));
      const s2=onSnapshot(col('facturacion_clientes'),s=>setClientes2(s.docs.map(d=>d.data())));
      const s3=onSnapshot(col('compras_proveedores'),s=>setProvs2(s.docs.map(d=>d.data())));
      const s4=onSnapshot(col('cont_cuentas'),s=>setCuentas2(s.docs.map(d=>d.data())));
      return()=>{s1();s2();s3();s4();};
    },[]);

    const initF=()=>({fecha:today(),titular:'',tipoTercero:'Persona',terceroId:'',concepto:'',moneda:'USD',monto:'',tasa:String(tasaActiva),estado:'Pendiente'});
    const [form,setForm]=useState(initF());

    const pendientes=vales.filter(v=>v.estado==='Pendiente');
    const cobrados=vales.filter(v=>v.estado!=='Pendiente');
    const totalUSD=pendientes.reduce((a,v)=>a+Number(v.monto||0),0);
    const totalBs=pendientes.reduce((a,v)=>a+Number(v.monto||0)*(v.moneda==='USD'?Number(v.tasa||tasaActiva):1),0);

    const guardarVale=async()=>{
      if(!form.titular&&!form.terceroId)return alert('Ingrese el nombre o seleccione un tercero');
      if(!form.monto||Number(form.monto)<=0)return alert('Ingrese un monto válido');
      if(!form.concepto)return alert('Ingrese el concepto');
      setBusy(true);
      try{
        const id=gid();
        const monto=Number(form.monto);
        const tasa=Number(form.tasa)||tasaActiva;
        const montoUSD=form.moneda==='USD'?monto:monto/tasa;
        const montoBs=form.moneda==='BS'?monto:monto*tasa;
        const tercero=(form.tipoTercero==='Cliente'?clientes2:provs2).find(x=>x.id===form.terceroId);
        const nombre=tercero?.nombre||form.titular;
        await setDoc(dref('caja_vales',id),{id,fecha:form.fecha,titular:nombre,tipoTercero:form.tipoTercero,terceroId:form.terceroId||'',concepto:form.concepto,moneda:form.moneda,monto,montoUSD,montoBs,tasa,estado:'Pendiente',historial:[],ts:serverTimestamp()});
        setModal(false);setForm(initF());
      }finally{setBusy(false);}
    };

    // Bajar de vale: pagar a proveedor, llevar a CxC o marcar cobrado
    const [accionModal,setAccionModal]=useState(null);
    const [accionForm,setAccionForm]=useState({tipo:'Cobrado',concepto:'',ctaId:'',ctaNom:''});
    const ejecutarAccion=async()=>{
      if(!accionModal)return;
      setBusy(true);
      try{
        const id=accionModal.id;
        const histEntry={fecha:today(),tipo:accionForm.tipo,concepto:accionForm.concepto,ctaId:accionForm.ctaId,ctaNom:accionForm.ctaNom};
        const nuevoEstado=accionForm.tipo==='Cobrado'?'Cobrado':accionForm.tipo==='Pago a Proveedor'?'Aplicado a Proveedor':'Aplicado a CxC';
        await import('firebase/firestore').then(()=>null); // ensure imported
        const {updateDoc,arrayUnion}=await import('firebase/firestore');
        await updateDoc(dref('caja_vales',id),{estado:nuevoEstado,fechaCierre:today(),historial:arrayUnion(histEntry)});
        setAccionModal(null);setAccionForm({tipo:'Cobrado',concepto:'',ctaId:'',ctaNom:''});
      }finally{setBusy(false);}
    };

    return(
      <div className="space-y-5">
        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPI label="Vales Pendientes" value={pendientes.length} accent="gold" Icon={FileText}/>
          <KPI label="Total USD en Vales" value={`$${fmt(totalUSD)}`} accent="red" Icon={DollarSign}/>
          <KPI label="Total Bs. en Vales" value={`Bs.${fmt(totalBs)}`} accent="blue" Icon={Banknote}/>
          <KPI label="Vales Aplicados" value={cobrados.length} accent="green" Icon={CheckCircle}/>
        </div>

        {/* Información del módulo */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle size={16} className="text-amber-600 flex-shrink-0 mt-0.5"/>
          <div className="text-[11px] text-amber-700 space-y-0.5">
            <p className="font-black">¿Qué es un Vale de Caja?</p>
            <p>Dinero contabilizado en caja pero que físicamente tiene un tercero. Ej: Luis Ferrer tiene $100 en vale — el efectivo está registrado pero no ha ingresado físicamente.</p>
            <p>Puede <strong>bajar el vale</strong> para: <strong>Pagar a Proveedor</strong>, <strong>Llevar a CxC</strong>, o marcar como <strong>Cobrado</strong>.</p>
          </div>
        </div>

        {/* Vales Pendientes */}
        <Card title={`Vales Pendientes (${pendientes.length})`} subtitle="Efectivo en caja aún no recibido físicamente"
          action={<Bg onClick={()=>{setForm(initF());setModal(true);}} sm><Plus size={12}/> Nuevo Vale</Bg>}>
          {pendientes.length===0
            ?<EmptyState icon={FileText} title="Sin vales pendientes" desc="Registre los vales cuando entregue efectivo a un tercero"/>
            :<div className="divide-y divide-slate-100">
              {pendientes.map(v=>(
                <div key={v.id} className="flex items-center gap-4 py-3 px-2 hover:bg-amber-50/40 rounded-xl">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0"><FileText size={16} className="text-amber-600"/></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-black text-slate-900 text-xs uppercase">{v.titular}</p>
                      <Badge v="gold">Vale</Badge>
                    </div>
                    <p className="text-[10px] text-slate-500">{v.concepto} · {dd(v.fecha)}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-mono font-black text-amber-600">{v.moneda==='USD'?'$':'Bs.'}{fmt(v.monto)}</p>
                    <p className="text-[9px] text-slate-400">{v.moneda==='USD'?`Bs.${fmt(v.montoBs)}`:`$${fmt(v.montoUSD)}`}</p>
                  </div>
                  <button onClick={()=>setAccionModal(v)}
                    className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase hover:bg-orange-500 transition-colors">
                    <ArrowRight size={11}/> Bajar Vale
                  </button>
                </div>
              ))}
            </div>}
        </Card>

        {/* Historial de vales aplicados */}
        {cobrados.length>0&&<Card title={`Vales Aplicados (${cobrados.length})`} subtitle="Historial">
          <table className="w-full text-[11px]"><thead><tr><Th>Fecha</Th><Th>Titular</Th><Th>Concepto</Th><Th>Moneda</Th><Th right>Monto</Th><Th>Estado</Th></tr></thead>
            <tbody>{cobrados.map(v=><tr key={v.id} className="hover:bg-slate-50">
              <Td>{dd(v.fecha)}</Td><Td className="font-black uppercase">{v.titular}</Td>
              <Td className="max-w-[150px] truncate">{v.concepto}</Td>
              <Td><Pill usd={v.moneda==='USD'}>{v.moneda}</Pill></Td>
              <Td right mono className="font-black">{v.moneda==='USD'?'$':'Bs.'}{fmt(v.monto)}</Td>
              <Td><Badge v="green">{v.estado}</Badge></Td>
            </tr>)}</tbody>
          </table>
        </Card>}

        {/* Modal Nuevo Vale */}
        <Modal open={modal} onClose={()=>setModal(false)} title="Registrar Vale de Caja" wide
          footer={<><Bo onClick={()=>setModal(false)}>Cancelar</Bo><Bg onClick={guardarVale} disabled={busy}>{busy?'Guardando...':'Registrar Vale'}</Bg></>}>
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-[11px] text-amber-700">
              <p className="font-black">Vale = efectivo en caja asignado a un tercero que aún no ha ingresado físicamente.</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FG label="Fecha"><input type="date" className={inp} value={form.fecha} onChange={e=>setForm({...form,fecha:e.target.value})}/></FG>
              <FG label="Tipo de Tercero">
                <div className="flex gap-1">{['Persona','Cliente','Proveedor'].map(t=>(
                  <button key={t} onClick={()=>setForm({...form,tipoTercero:t,terceroId:'',titular:''})}
                    className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase border transition-all ${form.tipoTercero===t?'bg-slate-900 text-white border-slate-900':'bg-white text-slate-500 border-slate-200'}`}>{t}</button>
                ))}</div>
              </FG>
              {form.tipoTercero==='Persona'
                ?<FG label="Nombre del Titular" full><input className={inp} value={form.titular} onChange={e=>setForm({...form,titular:e.target.value.toUpperCase()})} placeholder="LUIS FERRER"/></FG>
                :<FG label={form.tipoTercero==='Cliente'?'Cliente':'Proveedor'} full>
                  <select className={sel} value={form.terceroId} onChange={e=>{const t=(form.tipoTercero==='Cliente'?clientes2:provs2).find(x=>x.id===e.target.value);setForm({...form,terceroId:e.target.value,titular:t?.nombre||''});}}>
                    <option value="">— Seleccione —</option>
                    {(form.tipoTercero==='Cliente'?clientes2:provs2).map(x=><option key={x.id} value={x.id}>{x.nombre}</option>)}
                  </select>
                </FG>}
              <FG label="Concepto / Descripción" full><input className={inp} value={form.concepto} onChange={e=>setForm({...form,concepto:e.target.value})} placeholder="Vale de caja para..."/></FG>
              <FG label="Moneda">
                <div className="flex gap-1">{['USD','BS'].map(m=>(
                  <button key={m} onClick={()=>setForm({...form,moneda:m})}
                    className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase border transition-all ${form.moneda===m?'bg-slate-900 text-white':'bg-white text-slate-500 border-slate-200'}`}>{m}</button>
                ))}</div>
              </FG>
              <FG label={`Monto (${form.moneda})`}><input type="number" step="0.01" className={`${inp} font-black text-lg`} value={form.monto} onChange={e=>setForm({...form,monto:e.target.value})}/></FG>
              <FG label="Tasa de Cambio"><input type="number" step="0.01" className={inp} value={form.tasa} onChange={e=>setForm({...form,tasa:e.target.value})}/></FG>
            </div>
          </div>
        </Modal>

        {/* Modal Bajar Vale */}
        {accionModal&&<Modal open={!!accionModal} onClose={()=>setAccionModal(null)} title={`Bajar Vale — ${accionModal?.titular}`} wide
          footer={<><Bo onClick={()=>setAccionModal(null)}>Cancelar</Bo><Bg onClick={ejecutarAccion} disabled={busy}>{busy?'Procesando...':'Aplicar'}</Bg></>}>
          <div className="space-y-4">
            <div className="bg-slate-50 rounded-xl p-4 flex items-center gap-4 border border-slate-200">
              <div><p className="font-black text-slate-900 uppercase">{accionModal.titular}</p><p className="text-[10px] text-slate-500">{accionModal.concepto} · {dd(accionModal.fecha)}</p></div>
              <div className="ml-auto text-right"><p className="font-mono font-black text-amber-600 text-lg">{accionModal.moneda==='USD'?'$':'Bs.'}{fmt(accionModal.monto)}</p></div>
            </div>
            <FG label="Acción a realizar">
              <div className="space-y-2">
                {[{v:'Cobrado',label:'Cobrado — Ingresó físicamente a caja',color:'#10b981'},
                  {v:'Pago a Proveedor',label:'Aplicar como Pago a Proveedor',color:'#3b82f6'},
                  {v:'Llevar a CxC',label:'Llevar a Cuenta por Cobrar (personal/empresa)',color:'#8b5cf6'},
                ].map(({v,label,color})=>(
                  <label key={v} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${accionForm.tipo===v?'border-slate-900 bg-slate-50':'border-slate-200 hover:border-slate-300'}`}>
                    <input type="radio" name="accion" value={v} checked={accionForm.tipo===v} onChange={()=>setAccionForm({...accionForm,tipo:v})} className="accent-slate-900"/>
                    <div><p className="font-black text-[11px] text-slate-800">{label}</p></div>
                  </label>
                ))}
              </div>
            </FG>
            <FG label="Concepto/Observación">
              <input className={inp} value={accionForm.concepto} onChange={e=>setAccionForm({...accionForm,concepto:e.target.value})} placeholder="Descripción de la aplicación..."/>
            </FG>
            {accionForm.tipo!=='Cobrado'&&<FG label="Cuenta Contable">
              <select className={sel} value={accionForm.ctaId} onChange={e=>{const c=contCuentas2.find(x=>x.id===e.target.value);setAccionForm({...accionForm,ctaId:e.target.value,ctaNom:c?`${c.codigo} · ${c.nombre}`:''});}}>
                <option value="">— Seleccione cuenta —</option>
                {[...contCuentas2].sort((a,b)=>String(a.codigo).localeCompare(String(b.codigo))).map(c=><option key={c.id} value={c.id}>{c.codigo} · {c.nombre}</option>)}
              </select>
            </FG>}
          </div>
        </Modal>}
      </div>
    );
  };

  // ══════════════════════════════════════════════════════════════════════
  // 5. ARQUEO DE CAJA
  // ══════════════════════════════════════════════════════════════════════
  const ArqueoCajaView = () => {
    const [modal, setModal] = useState(false);
    const [busy, setBusy]   = useState(false);
    const [cantidades, setCants] = useState({});
    const denoms = DENOM_USD;
    const totalArqueo = denoms.reduce((a,d)=>a+(Number(cantidades[d]||0)*d),0);

    const save = async()=>{
      setBusy(true);
      try {
        const id=gid();
        await setDoc(dref('caja_arques',id),{id,fecha:today(),moneda:'USD',cantidades,totalArqueo,ts:serverTimestamp()});
        setModal(false); setCants({});
      } finally { setBusy(false); }
    };

    return (
      <div className="space-y-5">
        <div className="grid grid-cols-3 gap-4">
          <KPI label="Arqueos Realizados" value={arques.length} accent="blue" Icon={FileText}/>
          <KPI label="Último Arqueo USD" value={`$${fmt(arques[0]?.totalArqueo||0)}`} accent="green" Icon={DollarSign}/>
          <KPI label="Fecha Último Arqueo" value={arques[0]?.fecha?dd(arques[0].fecha):'—'} accent="gold" Icon={CalendarDays}/>
        </div>
        <Card title="Historial de Arqueos" subtitle="Conteos físicos de caja USD" action={<Bg onClick={()=>{setCants({});setModal(true);}} sm><Plus size={12}/> Nuevo Arqueo</Bg>}>
          {arques.length===0?<EmptyState icon={Coins} title="Sin arqueos" desc="Realice el primer arqueo de caja"/>:
            <table className="w-full"><thead><tr><Th>Fecha</Th><Th>Moneda</Th><Th right>Total Contado</Th></tr></thead>
              <tbody>{arques.map(a=><tr key={a.id} className="hover:bg-slate-50">
                <Td>{dd(a.fecha)}</Td><Td><Pill usd>USD</Pill></Td>
                <Td right mono className="font-black text-slate-900">$ {fmt(a.totalArqueo)}</Td>
              </tr>)}</tbody>
            </table>}
        </Card>

        <Modal open={modal} onClose={()=>setModal(false)} title="Arqueo de Caja — Dólares (USD)" wide
          footer={<><Bo onClick={()=>setModal(false)}>Cancelar</Bo><Bg onClick={save} disabled={busy}>{busy?'Guardando...':'Guardar Arqueo'}</Bg></>}>
          <div className="space-y-5">
            <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
              <DollarSign size={16} className="text-blue-600"/>
              <p className="text-[11px] font-black text-blue-700 uppercase">Conteo de Billetes USD — Ingrese cantidad de billetes por denominación</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {denoms.map(d=>(
                <div key={d} className="flex items-center gap-3 bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <div className="w-20 text-right"><p className="font-mono font-black text-slate-700">$ {d>=1?fmt(d):`${d}`}</p></div>
                  <div className="flex-1 flex items-center gap-2">
                    <p className="text-[10px] text-slate-400">×</p>
                    <input type="number" min="0" className={`${inp} text-center w-20`} value={cantidades[d]||''} onChange={e=>{const n={...cantidades};n[d]=e.target.value;setCants(n);}} placeholder="0"/>
                  </div>
                  <div className="w-24 text-right">
                    <p className="font-mono font-black text-slate-900">$ {fmt(d*(Number(cantidades[d])||0))}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="rounded-2xl p-5 flex justify-between items-center" style={{background:'linear-gradient(135deg,#0f172a,#1e293b)'}}>
              <p className="font-black text-white uppercase tracking-widest text-sm">Total Arqueo</p>
              <p className="font-mono font-black text-2xl text-emerald-400">{moneda==='BS'?'Bs.':'$'} {fmt(totalArqueo)}</p>
            </div>
          </div>
        </Modal>
      </div>
    );
  };

  // ══════════════════════════════════════════════════════════════════════
  // 6. CONCILIACIÓN BANCARIA
  // ══════════════════════════════════════════════════════════════════════
  const ConciliacionView = () => {
    const [cuentaId,setCuentaId]=useState('');const [desde,setDesde]=useState(mesActual()+'-01');const [hasta,setHasta]=useState(today());
    const [saldoBanco,setSaldoBco]=useState('');const [marcados,setMarcados]=useState({});const [ajustes,setAjustes]=useState([]);const [busy,setBusy]=useState(false);
    const cuenta=cuentas.find(c=>c.id===cuentaId);
    const todos=movBanco.filter(m=>m.cuentaId===cuentaId&&m.estatus!=='Conciliado');
    const toggle=id=>setMarcados(p=>({...p,[id]:!p[id]}));
    const egTrans=todos.filter(m=>m.tipo==='Egreso' &&!marcados[m.id]).reduce((a,m)=>a+Number(m.montoUSD||0),0);
    const ingTrans=todos.filter(m=>m.tipo==='Ingreso'&&!marcados[m.id]).reduce((a,m)=>a+Number(m.montoUSD||0),0);
    const cargos=ajustes.filter(a=>a.tipo==='Cargo' ).reduce((a,x)=>a+Number(x.monto||0),0);
    const abonos=ajustes.filter(a=>a.tipo==='Abono' ).reduce((a,x)=>a+Number(x.monto||0),0);
    const saldoLibros=cuenta?Number(cuenta.moneda==='BS'?Number(cuenta.saldo)/tasaActiva:cuenta.saldo):0;
    const saldoConcil=saldoLibros+cargos-abonos+egTrans-ingTrans;
    const sbNum=Number(saldoBanco)||0;const diff=sbNum-saldoConcil;const OK=Math.abs(diff)<0.01&&sbNum>0;
    const aprobar=async()=>{
      if(!OK)return alert('Diferencia debe ser $0.00');
      if(!window.confirm('¿Aprobar conciliación? Acción IRREVERSIBLE.'))return;
      setBusy(true);
      try{const batch=writeBatch(db);const ids=Object.entries(marcados).filter(([,v])=>v).map(([k])=>k);ids.forEach(id=>batch.update(dref('banco_movimientos',id),{estatus:'Conciliado'}));const id=gid();batch.set(dref('banco_conciliaciones',id),{id,cuentaId,cuentaNombre:cuenta.banco,desde,hasta,saldoBanco:sbNum,saldoLibros,egTrans,ingTrans,cargos,abonos,saldoConcil,diff,count:ids.length,ajustes,fecha:today(),ts:serverTimestamp()});await batch.commit();setMarcados({});setSaldoBco('');setAjustes([]);alert(`✅ ${ids.length} movimiento(s) conciliados.`);}finally{setBusy(false);}
    };
    return(<div className="space-y-5">
      <Card title="Parámetros de Conciliación"><div className="grid grid-cols-4 gap-4">
        <FG label="Cuenta" full><select className={sel} value={cuentaId} onChange={e=>{setCuentaId(e.target.value);setMarcados({});setAjustes([]);setSaldoBco('');}}>
          <option value="">— Seleccione cuenta a conciliar —</option>
          {[{label:'Cuentas Nacionales Bs.',items:cuentas.filter(c=>c.tipoBanco==='Nacional-Bs')},
            {label:'Cuentas Moneda Extranjera',items:cuentas.filter(c=>c.tipoBanco!=='Nacional-Bs')}
          ].map(g=>g.items.length>0&&(<optgroup key={g.label} label={g.label}>{g.items.map(c=><option key={c.id} value={c.id}>{c.banco} · {c.numeroCuenta} · {c.moneda==='BS'?'Bs.':'$'} {fmt(c.saldo)}</option>)}</optgroup>))}
        </select></FG>
        <FG label="Desde"><input type="date" className={inp} value={desde} onChange={e=>setDesde(e.target.value)}/></FG>
        <FG label="Hasta"><input type="date" className={inp} value={hasta} onChange={e=>setHasta(e.target.value)}/></FG>
        <FG label="Saldo según Banco ($)"><input type="number" step="0.01" className={`${inp} font-black ${OK?'border-emerald-400 bg-emerald-50':sbNum>0?'border-amber-300':''}`} value={saldoBanco} onChange={e=>setSaldoBco(e.target.value)} placeholder="0.00"/></FG>
      </div></Card>
      {cuentaId&&<div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-3">
          <Card title={`Movimientos a Conciliar (${todos.length})`} subtitle="Marque los que aparecen en el estado de cuenta">
            {todos.length===0?<EmptyState icon={CheckCircle} title="Sin movimientos pendientes" desc=""/>:
              <div className="divide-y divide-slate-100">{todos.map(m=>(
                <label key={m.id} className={`flex items-center gap-4 py-3 px-2 cursor-pointer rounded-xl hover:bg-slate-50 ${marcados[m.id]?'bg-emerald-50/60':''}`}>
                  <input type="checkbox" checked={!!marcados[m.id]} onChange={()=>toggle(m.id)} className="w-4 h-4 accent-emerald-500 flex-shrink-0"/>
                  <div className="flex-1 min-w-0"><div className="flex items-center gap-2 mb-0.5"><Badge v={m.tipo==='Ingreso'?'green':m.tipo==='Egreso'?'red':'blue'}>{m.tipo}</Badge><span className="text-[10px] text-slate-400">{dd(m.fecha)}</span></div><p className="text-xs font-semibold text-slate-700 truncate">{m.concepto}</p></div>
                  <div className="text-right flex-shrink-0"><p className={`font-mono font-black text-sm ${m.tipo==='Ingreso'?'text-emerald-600':'text-red-500'}`}>${fmt(m.montoUSD)}</p><p className="text-[10px] text-slate-400">Bs.{fmt(m.montoBs)}</p></div>
                  {marcados[m.id]&&<CheckCircle size={16} className="text-emerald-500 flex-shrink-0"/>}
                </label>
              ))}</div>}
          </Card>
          <Card title="Ajustes Bancarios (NC / ND)" subtitle="Comisiones, intereses no contabilizados"
            action={<button onClick={()=>setAjustes([...ajustes,{tipo:'Cargo',concepto:'',monto:''}])} className="text-[10px] font-black uppercase text-blue-500 flex items-center gap-1 hover:bg-blue-50 px-2 py-1 rounded-lg"><Plus size={12}/> Ajuste</button>}>
            {ajustes.length===0?<p className="text-xs text-slate-400 text-center py-3">Sin ajustes bancarios</p>:
              <div className="space-y-2">{ajustes.map((a,i)=>(
                <div key={i} className="flex gap-2 items-center bg-slate-50 p-2 rounded-xl border border-slate-100">
                  <select className={`${sel} w-28`} value={a.tipo} onChange={e=>{const n=[...ajustes];n[i].tipo=e.target.value;setAjustes(n);}}><option value="Cargo">N. Débito</option><option value="Abono">N. Crédito</option></select>
                  <input className={`${inp} flex-1`} placeholder="Comisión, intereses..." value={a.concepto} onChange={e=>{const n=[...ajustes];n[i].concepto=e.target.value;setAjustes(n);}}/>
                  <input type="number" step="0.01" className={`${inp} w-28 text-right`} value={a.monto} onChange={e=>{const n=[...ajustes];n[i].monto=e.target.value;setAjustes(n);}}/>
                  <button onClick={()=>setAjustes(ajustes.filter((_,j)=>j!==i))} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg"><Trash2 size={12}/></button>
                </div>
              ))}</div>}
          </Card>
        </div>
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden shadow-sm sticky top-4">
            <div className="px-5 py-4" style={{background:'linear-gradient(135deg,#0f172a,#1e293b)'}}><p className="font-black text-white text-sm uppercase tracking-widest">Panel de Cuadre</p></div>
            <div className="p-5 space-y-3">
              {[{l:'Saldo en Libros (Sistema)',v:saldoLibros,c:'text-slate-900',b:true},{l:'(+) Cargos NC no contabilizados',v:cargos,c:'text-red-600'},{l:'(−) Abonos NC no contabilizados',v:abonos,c:'text-emerald-600'},{l:'(+) Egresos en Tránsito',v:egTrans,c:'text-red-500'},{l:'(−) Ingresos en Tránsito',v:ingTrans,c:'text-emerald-500'}].map(({l,v,c,b})=>(
                <div key={l} className="flex items-center justify-between"><p className={`text-[10px] ${b?'font-black text-slate-700':'font-medium text-slate-500'} leading-tight max-w-[150px]`}>{l}</p><p className={`font-mono font-black text-sm ${c}`}>${fmt(v)}</p></div>
              ))}
              <div className="border-t-2 border-slate-200 pt-3 space-y-1">
                <div className="flex items-center justify-between"><p className="text-[10px] font-black text-slate-700 uppercase">= Saldo Conciliado</p><p className="font-mono font-black text-blue-600">${fmt(saldoConcil)}</p></div>
                <div className="flex items-center justify-between"><p className="text-[10px] font-black text-slate-500 uppercase">Saldo según Banco</p><p className="font-mono font-black text-slate-900">${fmt(sbNum)}</p></div>
              </div>
              <div className={`rounded-xl p-4 text-center border-2 ${OK?'border-emerald-400 bg-emerald-50':'border-amber-400 bg-amber-50'}`}>
                <p className="text-[9px] font-black uppercase tracking-widest mb-1 text-slate-500">Diferencia</p>
                <p className={`font-mono font-black text-2xl ${OK?'text-emerald-600':'text-amber-600'}`}>${fmt(diff)}</p>
                {OK?<p className="text-[10px] text-emerald-600 font-black mt-1">✓ Cuadrado</p>:<p className="text-[10px] text-amber-600 font-black mt-1">Pendiente</p>}
              </div>
              <Bg onClick={aprobar} disabled={!OK||busy}>{busy?<><RefreshCw size={13} className="animate-spin"/> Procesando...</>:<><CheckCircle size={13}/> Aprobar</>}</Bg>
              <p className="text-[9px] text-slate-400 text-center">Al aprobar los movimientos quedan bloqueados.</p>
            </div>
          </div>
        </div>
      </div>}
      {!cuentaId&&<EmptyState icon={Building2} title="Seleccione una cuenta bancaria" desc="Elija la cuenta para iniciar la conciliación"/>}
    </div>);
  };

  // ══════════════════════════════════════════════════════════════════════
  // 7. PROVEEDORES
  // ══════════════════════════════════════════════════════════════════════
  const ProveedoresView = () => {
    const [modal,setModal]=useState(false);const [busy,setBusy]=useState(false);
    const [form,setForm]=useState({nombre:'',rif:'',telefono:'',email:'',direccion:'',diasCredito:'0'});
    const save=async()=>{if(!form.nombre||!form.rif)return alert('Nombre y RIF requeridos');setBusy(true);try{const id=gid();await setDoc(dref('compras_proveedores',id),{...form,id,ts:serverTimestamp()});setModal(false);setForm({nombre:'',rif:'',telefono:'',email:'',direccion:'',diasCredito:'0'});}finally{setBusy(false);}};
    return(<div>
      <Card title="Directorio de Proveedores" subtitle={`${provs.length} proveedores`} action={<Bg onClick={()=>setModal(true)} sm><Plus size={12}/> Nuevo</Bg>}>
        <table className="w-full"><thead><tr><Th>RIF</Th><Th>Razón Social</Th><Th>Teléfono</Th><Th>Email</Th><Th>Días Crédito</Th><Th></Th></tr></thead>
          <tbody>
            {provs.length===0&&<tr><td colSpan={6}><EmptyState icon={Users} title="Sin proveedores" desc="Registre sus proveedores"/></td></tr>}
            {provs.map(p=><tr key={p.id} className="hover:bg-slate-50"><Td mono className="font-black">{p.rif}</Td><Td className="uppercase font-semibold">{p.nombre}</Td><Td>{p.telefono||'—'}</Td><Td className="text-slate-400">{p.email||'—'}</Td><Td mono>{p.diasCredito} días</Td><Td><button onClick={()=>deleteDoc(dref('compras_proveedores',p.id))} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg"><Trash2 size={12}/></button></Td></tr>)}
          </tbody>
        </table>
      </Card>
      <Modal open={modal} onClose={()=>setModal(false)} title="Nuevo Proveedor" footer={<><Bo onClick={()=>setModal(false)}>Cancelar</Bo><Bg onClick={save} disabled={busy}>{busy?'Guardando...':'Guardar'}</Bg></>}>
        <div className="grid grid-cols-2 gap-4">
          <FG label="Razón Social" full><input className={inp} value={form.nombre} onChange={e=>setForm({...form,nombre:e.target.value.toUpperCase()})} placeholder="SUMINISTROS ABC C.A."/></FG>
          <FG label="RIF / NIT"><input className={inp} value={form.rif} onChange={e=>setForm({...form,rif:e.target.value.toUpperCase()})} placeholder="J-12345678-9"/></FG>
          <FG label="Teléfono"><input className={inp} value={form.telefono} onChange={e=>setForm({...form,telefono:e.target.value})}/></FG>
          <FG label="Email"><input type="email" className={inp} value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></FG>
          <FG label="Días Crédito"><input type="number" className={inp} value={form.diasCredito} onChange={e=>setForm({...form,diasCredito:e.target.value})}/></FG>
          <FG label="Dirección" full><input className={inp} value={form.direccion} onChange={e=>setForm({...form,direccion:e.target.value})}/></FG>
        </div>
      </Modal>
    </div>);
  };

  // ══════════════════════════════════════════════════════════════════════
  // 8. REPORTES
  // ══════════════════════════════════════════════════════════════════════
  const ReportesView = () => {
    const [rC,setRC]=useState('');const [rD,setRD]=useState(mesActual()+'-01');const [rH,setRH]=useState(today());
    const filt=movBanco.filter(m=>(!rC||m.cuentaId===rC)&&m.fecha>=rD&&m.fecha<=rH);
    const iU=filt.filter(m=>m.tipo==='Ingreso').reduce((a,m)=>a+Number(m.montoUSD||0),0);
    const eU=filt.filter(m=>m.tipo==='Egreso' ).reduce((a,m)=>a+Number(m.montoUSD||0),0);
    const iB=filt.filter(m=>m.tipo==='Ingreso').reduce((a,m)=>a+Number(m.montoBs||0),0);
    const eB=filt.filter(m=>m.tipo==='Egreso' ).reduce((a,m)=>a+Number(m.montoBs||0),0);
    return(<div className="space-y-5">
      <Card title="Filtros"><div className="grid grid-cols-3 gap-4">
        <FG label="Cuenta"><select className={sel} value={rC} onChange={e=>setRC(e.target.value)}><option value="">Todas</option>{cuentas.map(c=><option key={c.id} value={c.id}>{c.banco}</option>)}</select></FG>
        <FG label="Desde"><input type="date" className={inp} value={rD} onChange={e=>setRD(e.target.value)}/></FG>
        <FG label="Hasta"><input type="date" className={inp} value={rH} onChange={e=>setRH(e.target.value)}/></FG>
      </div></Card>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI label="Ingresos USD" value={`$${fmt(iU)}`} accent="green" Icon={ArrowUpCircle} sub={`Bs.${fmt(iB)}`}/>
        <KPI label="Egresos USD"  value={`$${fmt(eU)}`} accent="red"   Icon={ArrowDownCircle} sub={`Bs.${fmt(eB)}`}/>
        <KPI label="Flujo Neto"   value={`$${fmt(iU-eU)}`} accent={iU-eU>=0?'green':'red'} Icon={ArrowLeftRight}/>
        <KPI label="Transacciones" value={filt.length} accent="blue" Icon={FileText}/>
      </div>
      <Card title={`Detalle — ${filt.length} transacciones`} action={<button onClick={()=>window.print()} className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-xl text-[9px] font-black uppercase hover:bg-blue-700"><Download size={12}/> Imprimir</button>}>
        <div className="overflow-x-auto"><table className="w-full"><thead><tr><Th>Fecha</Th><Th>Tipo</Th><Th>Banco</Th><Th>Concepto</Th><Th>Tercero</Th><Th>Ref.</Th><Th right>USD</Th><Th right>Bs.</Th><Th right>Tasa</Th><Th>Estado</Th></tr></thead>
          <tbody>
            {filt.length===0&&<tr><td colSpan={10}><EmptyState icon={BarChart3} title="Sin datos" desc="Ajuste los filtros"/></td></tr>}
            {filt.map(m=><tr key={m.id} className="hover:bg-slate-50">
              <Td>{dd(m.fecha)}</Td><Td><Badge v={m.tipo==='Ingreso'?'green':m.tipo==='Egreso'?'red':'blue'}>{m.tipo}</Badge></Td>
              <Td className="font-semibold text-[11px] max-w-[80px] truncate">{m.cuentaNombre}</Td>
              <Td className="max-w-[130px] truncate">{m.concepto}</Td>
              <Td className="text-[10px] max-w-[100px] truncate">{m.terceroNombre||'—'}</Td>
              <Td mono className="text-slate-400 text-[10px]">{m.referencia||'—'}</Td>
              <Td right mono className={`font-black ${m.tipo==='Ingreso'?'text-emerald-600':'text-red-500'}`}>${fmt(m.montoUSD)}</Td>
              <Td right mono className="text-slate-400 text-xs">Bs.{fmt(m.montoBs)}</Td>
              <Td right mono className="text-slate-400 text-[10px]">{m.tasa}</Td>
              <Td><Badge v={m.estatus==='Conciliado'?'green':'gray'}>{m.estatus||'Pendiente'}</Badge></Td>
            </tr>)}
          </tbody>
          {filt.length>0&&<tfoot><tr style={{background:'#0f172a'}}><td colSpan={6} className="px-4 py-3 text-[10px] font-black uppercase text-slate-400">TOTALES</td><td className="px-4 py-3 text-right font-mono font-black text-white">${fmt(iU-eU)}</td><td className="px-4 py-3 text-right font-mono text-slate-400 text-xs">Bs.{fmt(iB-eB)}</td><td colSpan={2}></td></tr></tfoot>}
        </table></div>
      </Card>
    </div>);
  };

  // ══════════════════════════════════════════════════════════════════════
  // 9. TASAS
  // ══════════════════════════════════════════════════════════════════════
  const TasasView = () => {
    const [modal,setModal]=useState(false);const [busy,setBusy]=useState(false);
    const [form,setForm]=useState({fecha:today(),modulo:'Todos',moneda:'USD',tasaRef:'',fuente:'Oficial / BCV'});
    const save=async()=>{if(!form.tasaRef)return;setBusy(true);try{const id=gid();await setDoc(dref('banco_tasas',id),{...form,tasaRef:Number(form.tasaRef),id,ts:serverTimestamp()});setModal(false);setForm({fecha:today(),modulo:'Todos',moneda:'USD',tasaRef:'',fuente:'Oficial / BCV'});}finally{setBusy(false);}};
    return(<div>
      <div className="grid grid-cols-3 gap-4 mb-5">
        <KPI label="Tasa Global" value={`${tasas.find(t=>t.modulo==='Todos')?.tasaRef||'—'} Bs/$`} accent="gold" Icon={Globe}/>
        <KPI label="Registros" value={tasas.length} accent="blue" Icon={TrendingUp}/>
        <KPI label="Última Actualización" value={dd(tasas[0]?.fecha||'')} accent="green" Icon={CalendarDays}/>
      </div>
      <Card title="Historial de Tasas" action={<Bg onClick={()=>setModal(true)} sm><Plus size={12}/> Nueva</Bg>}>
        <table className="w-full"><thead><tr><Th>Fecha</Th><Th>Módulo</Th><Th>Moneda</Th><Th right>Tasa Bs/$</Th><Th>Fuente</Th></tr></thead>
          <tbody>{tasas.length===0&&<tr><td colSpan={5}><EmptyState icon={Globe} title="Sin tasas" desc="Registre la tasa actual"/></td></tr>}{tasas.map(t=><tr key={t.id} className="hover:bg-slate-50"><Td>{dd(t.fecha)}</Td><Td><Badge v={t.modulo==='Todos'?'gray':'blue'}>{t.modulo}</Badge></Td><Td><Pill usd={t.moneda==='USD'}>{t.moneda}</Pill></Td><Td right mono className="font-black text-slate-900 text-base">{t.tasaRef}</Td><Td className="text-slate-400 text-[10px] uppercase font-semibold">{t.fuente}</Td></tr>)}</tbody>
        </table>
      </Card>
      <Modal open={modal} onClose={()=>setModal(false)} title="Registrar Tasa" footer={<><Bo onClick={()=>setModal(false)}>Cancelar</Bo><Bg onClick={save} disabled={busy}>{busy?'Guardando...':'Guardar'}</Bg></>}>
        <div className="grid grid-cols-2 gap-4">
          <FG label="Fecha"><input type="date" className={inp} value={form.fecha} onChange={e=>setForm({...form,fecha:e.target.value})}/></FG>
          <FG label="Moneda"><select className={sel} value={form.moneda} onChange={e=>setForm({...form,moneda:e.target.value})}><option>USD</option><option>EUR</option></select></FG>
          <FG label="Tasa Bs/$"><input type="number" step="0.01" className={inp} value={form.tasaRef} onChange={e=>setForm({...form,tasaRef:e.target.value})} placeholder="39.50"/></FG>
          <FG label="Módulo"><select className={sel} value={form.modulo} onChange={e=>setForm({...form,modulo:e.target.value})}><option>Todos</option><option>Banco</option><option>Facturación</option><option>Inventario</option></select></FG>
          <FG label="Fuente" full><input className={inp} value={form.fuente} onChange={e=>setForm({...form,fuente:e.target.value})}/></FG>
        </div>
      </Modal>
    </div>);
  };

  // ── NAV ────────────────────────────────────────────────────────────────────
  const navGroups = [
    { group:'Analítica',   color:'#f97316', items:[{id:'dashboard',    label:'Panel General',      icon:LayoutDashboard}] },
    { group:'Bancos',      color:'#3b82f6', items:[{id:'cuentas',      label:'Cuentas Bancarias',  icon:Building2},
                                                    {id:'movimientos',  label:'Movimientos Banco',  icon:ArrowLeftRight},
                                                    {id:'conciliacion', label:'Conciliación',       icon:CheckCircle}] },
    { group:'Caja',        color:'#10b981', items:[{id:'caja_op',       label:'Operaciones Caja',   icon:Banknote},
                                                    {id:'vales',          label:'Relación de Vales',  icon:FileText},
                                                    {id:'arqueo',        label:'Arqueo de Caja',     icon:Calculator}] },
    { group:'Reportes',    color:'#f59e0b', items:[{id:'reportes',     label:'Panel de Reportes',  icon:BarChart3},
                                                    {id:'rpt_gral',    label:'General de Banco',    icon:FileSpreadsheet},
                                                    {id:'rpt_conc',    label:'Conciliaciones',      icon:CheckCircle},
                                                    {id:'rpt_concepto',label:'Por Concepto',        icon:BookMarked},
                                                    {id:'rpt_comp',    label:'Comprobante Bancario',icon:BookOpen}] },
    { group:'Config.',     color:'#64748b', items:[{id:'tasas',        label:'Tasas de Cambio',    icon:Globe}] },
  ];
  const ReportesGeneralView = () => {
    const totBs = cuentas.filter(c=>c.moneda==='BS').reduce((a,c)=>a+Number(c.saldo),0);
    const totUSD= cuentas.filter(c=>c.moneda==='USD').reduce((a,c)=>a+Number(c.saldo),0);
    const totBsEq= cuentas.reduce((a,c)=>a+(c.moneda==='BS'?Number(c.saldo):Number(c.saldo)*tasaActiva),0);
    const imprimir=()=>{
      let rows=cuentas.map(c=>{
        const bs=c.moneda==='BS';
        const usd=bs?Number(c.saldo)/tasaActiva:Number(c.saldo);
        const bsEq=bs?Number(c.saldo):Number(c.saldo)*tasaActiva;
        return `<tr><td>${c.banco}</td><td style="font-family:monospace">${c.numeroCuenta}</td><td>${c.tipoCuenta||'—'}</td><td>${c.moneda}</td><td style="text-align:right;font-family:monospace;font-weight:bold">Bs.${fmt(bsEq)}</td><td style="text-align:right;font-family:monospace;font-weight:bold;color:#16a34a">$${fmt(usd)}</td></tr>`;
      }).join('');
      printWindow(letterheadOpen('Reporte General Bancario',`Tasa: ${tasaActiva} Bs/$ · ${dd(today())} · ${cuentas.length} cuentas`)+
        `<table><thead><tr><th>Banco</th><th>Nro. Cuenta</th><th>Tipo</th><th>Moneda</th><th>Saldo Bs.</th><th>Equiv. USD</th></tr></thead><tbody>${rows}</tbody>
        <tfoot><tr><td colspan="4" style="font-weight:bold">TOTAL CONSOLIDADO</td><td style="text-align:right;font-weight:bold">Bs.${fmt(totBsEq)}</td><td style="text-align:right;font-weight:bold;color:#16a34a">$${fmt(totBsEq/tasaActiva)}</td></tr></tfoot></table>`+
        letterheadClose(`${cuentas.length} cuenta(s) registrada(s)`));
    };
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-3 gap-4">
          <KPI label="Total Bs." value={`Bs. ${fmt(totBs)}`} accent="blue" Icon={Building2} sub={`$${fmt(totBs/tasaActiva)} USD equiv.`}/>
          <KPI label="Total USD" value={`$${fmt(totUSD)}`} accent="green" Icon={DollarSign}/>
          <KPI label="Consolidado USD" value={`$${fmt(totBsEq/tasaActiva)}`} accent="gold" Icon={TrendingUp} sub="Todas las cuentas"/>
        </div>
        <Card title="Resumen General Bancario" action={<button onClick={imprimir} className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase hover:bg-red-700"><Download size={12}/> PDF Membretado</button>}>
          {[{titulo:'Cuentas Nacionales Bs.',tipos:['Nacional-Bs']},{titulo:'Cuentas Moneda Extranjera',tipos:['Nacional-Ext','Internacional']}].map(g=>(
            <div key={g.titulo} className="mb-4">
              <p className="text-xs font-black uppercase text-slate-500 mb-2">{g.titulo}</p>
              <table className="w-full"><thead><tr><Th>Banco</Th><Th>Nro.</Th><Th>Tipo</Th><Th>Moneda</Th><Th right>Saldo</Th><Th right>En USD</Th><Th right>En Bs.</Th></tr></thead>
                <tbody>{cuentas.filter(c=>g.tipos.includes(c.tipoBanco||'Nacional-Bs')).map(c=>{
                  const bs=c.moneda==='BS'; const usd=bs?Number(c.saldo)/tasaActiva:Number(c.saldo); const bsEq=bs?Number(c.saldo):Number(c.saldo)*tasaActiva;
                  return <tr key={c.id} className="hover:bg-slate-50"><Td className="font-black">{c.banco}</Td><Td mono className="text-[10px]">{c.numeroCuenta}</Td><Td className="text-[10px]">{c.tipoCuenta}</Td><Td><Pill usd={!bs}>{c.moneda}</Pill></Td><Td right mono className="font-black">{bs?'Bs.':'$'} {fmt(c.saldo)}</Td><Td right mono className="text-emerald-600 font-black">${fmt(usd)}</Td><Td right mono className="text-blue-600">Bs.{fmt(bsEq)}</Td></tr>;
                })}</tbody>
              </table>
            </div>
          ))}
        </Card>
      </div>
    );
  };

  const ReporteConceptoView = () => {
    const [search, setSearch] = useState('');
    const grouped = movBanco.reduce((acc,m)=>{
      const k=(m.concepto||'Sin concepto').toUpperCase();
      if(!acc[k]) acc[k]={concepto:k,ingresos:0,egresos:0,count:0};
      if(m.tipo==='Ingreso') acc[k].ingresos+=Number(m.montoUSD||0);
      if(m.tipo==='Egreso')  acc[k].egresos +=Number(m.montoUSD||0);
      acc[k].count++;
      return acc;
    },{});
    const rows=Object.values(grouped).filter(r=>!search||r.concepto.includes(search.toUpperCase())).sort((a,b)=>b.ingresos+b.egresos-(a.ingresos+a.egresos));
    return (
      <Card title="Transacciones por Concepto" action={<div className="relative"><Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Filtrar..." className={`${inp} pl-8 w-40`}/></div>}>
        <table className="w-full"><thead><tr><Th>Concepto</Th><Th right>Transacciones</Th><Th right>Ingresos USD</Th><Th right>Egresos USD</Th><Th right>Neto</Th></tr></thead>
          <tbody>{rows.length===0&&<tr><td colSpan={5}><EmptyState icon={BookMarked} title="Sin datos" desc="Registre movimientos bancarios"/></td></tr>}
            {rows.map((r,i)=><tr key={i} className="hover:bg-slate-50">
              <Td className="font-semibold uppercase max-w-[200px] truncate">{r.concepto}</Td>
              <Td right mono className="text-slate-500">{r.count}</Td>
              <Td right mono className="text-emerald-600 font-black">${fmt(r.ingresos)}</Td>
              <Td right mono className="text-red-500 font-black">${fmt(r.egresos)}</Td>
              <Td right mono className={`font-black ${r.ingresos-r.egresos>=0?'text-emerald-700':'text-red-600'}`}>${fmt(r.ingresos-r.egresos)}</Td>
            </tr>)}
          </tbody>
        </table>
      </Card>
    );
  };

  const ComprobantesBancariosView = () => {
    const [mes, setMes] = useState(mesActual());
    const [filtBanco, setFiltBanco] = useState('');
    const [asientosLocal, setAsientosLocal] = useState([]);
    useEffect(()=>{
      const u=onSnapshot(query(col('cont_asientos'),orderBy('fecha','desc')),s=>setAsientosLocal(s.docs.map(d=>d.data())));
      return()=>u();
    },[]);
    const asientosMes = asientosLocal.filter(a=>
      a.modulo==='Bancos' &&
      a.fecha?.startsWith(mes) &&
      (!filtBanco || movBanco.find(m=>m.id===a.movimientoBancoId)?.cuentaId===filtBanco)
    );

    const rows = asientosMes.length > 0 ? asientosMes : movBanco.filter(m=>m.fecha?.startsWith(mes)&&(m.asientoDebito||m.asientoCredito)&&(!filtBanco||m.cuentaId===filtBanco)).map(m=>({
      id:m.id, comprobante:m.asientoContableId||m.id,
      fecha:m.fecha, descripcion:m.concepto,
      cuentaNombre:m.cuentaNombre,
      lineas:[{codigo:'',cuenta:m.asientoDebito,tipoLinea:'D',debeBs:m.montoBs,haberBs:0,debeUSD:m.montoUSD,haberUSD:0},{codigo:'',cuenta:m.asientoCredito,tipoLinea:'H',debeBs:0,haberBs:m.montoBs,debeUSD:0,haberUSD:m.montoUSD}],
    }));

    const getBancoNom = (r) => {
      const movId = r.movimientoBancoId;
      if(movId){const mov=movBanco.find(m=>m.id===movId);if(mov)return mov.cuentaNombre;}
      return r.cuentaNombre||r.descripcion?.split(' ')[0]||'—';
    };

    const imprimir = () => {
      let rowsHtml=rows.map(r=>{
        const banco=getBancoNom(r);
        const lineas=(r.lineas||[]);
        const dBs=lineas.reduce((a,l)=>a+Number(l.debeBs||0),0);
        const hBs=lineas.reduce((a,l)=>a+Number(l.haberBs||0),0);
        const dUSD=lineas.reduce((a,l)=>a+Number(l.debeUSD||0),0);
        return `<tr>
          <td style="font-family:monospace;font-weight:bold;color:#1e40af">${r.comprobante||r.numero||'—'}</td>
          <td>${dd(r.fecha)}</td>
          <td style="font-weight:bold">${banco}</td>
          <td>${r.descripcion||r.concepto||'—'}</td>
          <td style="color:#16a34a">${lineas.find(l=>l.tipoLinea==='D')?.cuenta||'—'}</td>
          <td style="color:#dc2626;padding-left:16px">${lineas.find(l=>l.tipoLinea==='H')?.cuenta||'—'}</td>
          <td style="text-align:right;font-family:monospace;color:#16a34a">$${fmt(dUSD)}</td>
          <td style="text-align:right;font-family:monospace">Bs.${fmt(dBs)}</td>
        </tr>`;
      }).join('');
      printWindow(letterheadOpen(
        `Comprobante Contable Bancario — ${mes}`,
        `${rows.length} asiento(s) · Tasa ref: ${tasaActiva} Bs/$ · Generado: ${dd(today())}`
      )+
        `<table><thead><tr>
          <th>Comprobante</th><th>Fecha</th><th>Banco</th><th>Concepto</th>
          <th>Cuenta Débito</th><th>Cuenta Crédito</th><th>USD</th><th>Bs.</th>
        </tr></thead><tbody>${rowsHtml}</tbody></table>`+
        letterheadClose(`Módulo: Tesorería & Bancos`)
      );
    };

    return (
      <div className="space-y-4">
        {/* Filtros */}
        <div className="flex gap-3 items-center">
          <FG label="Mes"><input type="month" className={inp} style={{width:'140px'}} value={mes} onChange={e=>setMes(e.target.value)}/></FG>
          <FG label="Filtrar por Banco">
            <select className={sel} style={{minWidth:'200px'}} value={filtBanco} onChange={e=>setFiltBanco(e.target.value)}>
              <option value="">Todos los bancos</option>
              {[{label:'🇻🇪 Nacionales Bs.',items:cuentas.filter(c=>c.tipoBanco==='Nacional-Bs')},
                {label:'💵 Moneda Extranjera',items:cuentas.filter(c=>c.tipoBanco!=='Nacional-Bs')}
              ].map(g=>g.items.length>0&&(
                <optgroup key={g.label} label={g.label}>
                  {g.items.map(c=><option key={c.id} value={c.id}>{c.banco}</option>)}
                </optgroup>
              ))}
            </select>
          </FG>
          <div className="ml-auto self-end">
            <button onClick={imprimir} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase hover:bg-red-700"><Download size={12}/> PDF Membretado</button>
          </div>
        </div>

        <Card title={`Comprobante Contable Bancario — ${mes}`} subtitle={`${rows.length} asiento(s) registrado(s)`}>
          {rows.length===0
            ? <EmptyState icon={BookOpen} title="Sin asientos" desc="Los asientos se generan automáticamente al registrar movimientos bancarios"/>
            : <div className="space-y-3">
                {rows.map((r,idx)=>{
                  const banco=getBancoNom(r);
                  const lineas=(r.lineas||[]);
                  const dBs=lineas.reduce((a,l)=>a+Number(l.debeBs||0),0);
                  const hBs=lineas.reduce((a,l)=>a+Number(l.haberBs||0),0);
                  const dUSD=lineas.reduce((a,l)=>a+Number(l.debeUSD||0),0);
                  const hUSD=lineas.reduce((a,l)=>a+Number(l.haberUSD||0),0);
                  return (
                    <div key={r.id||idx} className="rounded-xl border border-slate-200 overflow-hidden">
                      {/* Header del comprobante */}
                      <div className="flex items-center justify-between px-5 py-3" style={{background:'#0f172a'}}>
                        <div className="flex items-center gap-3">
                          <p className="font-mono font-black text-blue-400 text-sm">{r.comprobante||r.numero||'CB-'+(idx+1).toString().padStart(4,'0')}</p>
                          <span className="text-slate-600">·</span>
                          <p className="text-white font-black text-xs uppercase">{banco}</p>
                          <Badge v="blue">{r.tipo||r.subTipo||'Bancario'}</Badge>
                        </div>
                        <div className="text-right">
                          <p className="text-slate-400 text-[10px]">{dd(r.fecha)}</p>
                          <p className="font-mono font-black text-emerald-400 text-sm">${fmt(dUSD)}</p>
                        </div>
                      </div>
                      {/* Descripción */}
                      <div className="px-5 py-2 bg-slate-50 border-b border-slate-100">
                        <p className="text-[10px] text-slate-500 font-medium uppercase">{r.descripcion||r.concepto}</p>
                      </div>
                      {/* Líneas contables */}
                      <div className="px-5 py-3">
                        <div className="text-[8px] font-black uppercase text-slate-400 grid mb-2" style={{gridTemplateColumns:'1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr'}}>
                          <div className="col-span-3">Cuenta de Movimiento</div>
                          <div className="text-center">T</div>
                          <div className="text-right text-emerald-600">Debe Bs.</div>
                          <div className="text-right text-red-500">Haber Bs.</div>
                          <div className="text-right text-emerald-700">Debe USD</div>
                          <div className="text-right text-red-600">Haber USD</div>
                        </div>
                        {lineas.map((l,li)=>(
                          <div key={li} className="grid items-center py-1.5 border-b border-slate-50 last:border-0"
                            style={{gridTemplateColumns:'1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr'}}>
                            <p className="col-span-3 text-xs font-semibold text-slate-800 truncate" style={{paddingLeft:l.tipoLinea==='H'?'16px':'0'}}>{l.cuenta}</p>
                            <p className={`text-center font-black text-xs ${l.tipoLinea==='D'?'text-emerald-600':'text-red-500'}`}>{l.tipoLinea}</p>
                            <p className="text-right font-mono text-[11px] text-emerald-700">{Number(l.debeBs||0)>0?`Bs.${fmt(l.debeBs)}`:''}</p>
                            <p className="text-right font-mono text-[11px] text-red-500">{Number(l.haberBs||0)>0?`Bs.${fmt(l.haberBs)}`:''}</p>
                            <p className="text-right font-mono text-[11px] text-emerald-700">{Number(l.debeUSD||0)>0?`$${fmt(l.debeUSD)}`:''}</p>
                            <p className="text-right font-mono text-[11px] text-red-500">{Number(l.haberUSD||0)>0?`$${fmt(l.haberUSD)}`:''}</p>
                          </div>
                        ))}
                        {/* Totales */}
                        <div className="grid mt-2 pt-2 border-t border-slate-200" style={{gridTemplateColumns:'1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr'}}>
                          <div className="col-span-4 text-[9px] font-black uppercase text-slate-500">TOTALES</div>
                          <div className="text-right font-mono font-black text-[11px] text-emerald-700">Bs.{fmt(dBs)}</div>
                          <div className="text-right font-mono font-black text-[11px] text-red-500">Bs.{fmt(hBs)}</div>
                          <div className="text-right font-mono font-black text-[11px] text-emerald-700">${fmt(dUSD)}</div>
                          <div className="text-right font-mono font-black text-[11px] text-red-500">${fmt(hUSD)}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
          }
        </Card>
      </div>
    );
  };

  const views = {dashboard:<DashboardView/>,cuentas:<CuentasView/>,movimientos:<MovimientosView/>,conciliacion:<ConciliacionView/>,caja_op:<CajaOpView/>,vales:<ValesView/>,arqueo:<ArqueoCajaView/>,reportes:<ReportesView/>,rpt_gral:<ReportesGeneralView/>,rpt_conc:<ConciliacionView/>,rpt_concepto:<ReporteConceptoView/>,rpt_comp:<ComprobantesBancariosView/>,tasas:<TasasView/>};
  const curNav = navGroups.flatMap(g=>g.items).find(n=>n.id===sec);

  return (
    <SidebarLayout brand="Supply G&B" brandSub="Bancos & Caja" navGroups={navGroups} activeId={sec} onNav={setSec} onBack={onBack} accentColor={BLUE}
      headerContent={<>
        <div><h1 className="font-black text-slate-800 text-sm uppercase tracking-wide">{curNav?.label}</h1><p className="text-[9px] text-slate-400 font-medium uppercase tracking-widest">Tesorería <ChevronRight size={8} className="inline"/> {navGroups.find(g=>g.items.find(i=>i.id===sec))?.group?.replace(/[🏦💵]/g,'').trim()}</p></div>
        <div className="flex items-center gap-3">
          <div className="bg-blue-50 border border-blue-200 rounded-full px-3 py-1.5 flex items-center gap-1.5"><DollarSign size={12} className="text-blue-500"/><span className="text-[10px] font-black text-blue-700 font-mono">BCV: {tasaActiva} Bs/$</span></div>
          <Bg onClick={()=>setSec(sec.startsWith('caja')||sec==='arqueo'?'caja_op':'movimientos')} sm><Plus size={12}/> Nuevo</Bg>
        </div>
      </>}>
      {views[sec]||<DashboardView/>}
    </SidebarLayout>
  );
}


// ============================================================================
// MÓDULO CONTABILIDAD — PLAN DE CUENTAS + EXPORTAR/IMPORTAR
// ============================================================================
function ContabilidadApp({ fbUser, onBack }) {
  const [sec, setSec] = useState('dashboard');
  const [cuentas, setCuentas]   = useState([]);
  const [movBanco, setMovBanco] = useState([]);
  const [movCaja,  setMovCaja]  = useState([]);
  const [tasas,    setTasas]    = useState([]);

  useEffect(() => {
    if (!fbUser) return;
    const subs = [
      onSnapshot(col('cont_cuentas'), s => setCuentas(s.docs.map(d=>d.data()))),
      onSnapshot(query(col('banco_movimientos'), orderBy('fecha','desc')), s => setMovBanco(s.docs.map(d=>d.data()))),
      onSnapshot(query(col('caja_movimientos'),  orderBy('fecha','desc')), s => setMovCaja(s.docs.map(d=>d.data()))),
      onSnapshot(query(col('banco_tasas'), orderBy('fecha','desc')), s => setTasas(s.docs.map(d=>d.data()))),
    ];
    return () => subs.forEach(u=>u());
  }, [fbUser]);

  const tasaActiva = tasas.find(t=>t.modulo==='Todos')?.tasaRef || tasas[0]?.tasaRef || 39.50;

  const grupos = [
    {codigo:'1',nombre:'ACTIVOS',color:'green'},{codigo:'2',nombre:'PASIVOS',color:'red'},
    {codigo:'3',nombre:'PATRIMONIO',color:'purple'},{codigo:'4',nombre:'INGRESOS',color:'blue'},
    {codigo:'5',nombre:'COSTOS',color:'gold'},{codigo:'6',nombre:'GASTOS',color:'gray'},
  ];

  // ── Exportar PUC ──────────────────────────────────────────────────
  const exportarPUC = (formato) => {
    const sorted = [...cuentas].sort((a,b)=>String(a.codigo).localeCompare(String(b.codigo)));
    if(formato==='xls') {
      const grupoNames = {'1':'ACTIVOS','2':'PASIVOS','3':'PATRIMONIO','4':'INGRESOS','5':'COSTOS','6':'GASTOS'};
      let html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head><meta charset="utf-8"><style>body{font-family:Arial,sans-serif;font-size:11px}table{border-collapse:collapse;width:100%}th{background:#1e3a5f;color:#fff;font-weight:bold;border:1px solid #94a3b8;padding:6px 10px;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:1px}td{border:1px solid #e2e8f0;padding:4px 10px}tr:nth-child(even) td{background:#f8fafc}</style></head><body>
        <p style="font-size:14px;font-weight:bold;margin-bottom:4px">Plan de Cuentas — Servicios Jiret G&amp;B, C.A.</p>
        <p style="font-size:10px;color:#666;margin-bottom:16px">RIF: J-412309374 · ${sorted.length} cuentas · ${dd(today())}</p>
        <table><thead><tr><th>Código</th><th>Cuenta de movimiento</th><th>Grupo</th><th>Sub-grupo</th><th>Cuenta</th><th>Subcuenta</th><th>Tipo</th><th>Naturaleza</th></tr></thead><tbody>`;
      sorted.forEach(c=>{
        const cod=String(c.codigo); const partes=cod.split('.');
        const grKey=partes[0]||cod.charAt(0); const grNom=grupoNames[grKey]||c.grupo||grKey;
        const subgr=c.subgrupo||(partes.length>=2?partes.slice(0,2).join('.'):cod);
        const cta=c.cuenta||(partes.length>=4?partes.slice(0,4).join('.'):cod);
        const subc=c.subcuenta||(partes.length>4?cod:'');
        html+=`<tr><td style="font-family:Courier New;font-weight:bold;color:#1e40af">${cod}</td><td style="font-weight:500">${c.nombre}</td><td>${grNom}</td><td>${subgr}</td><td>${cta}</td><td>${subc}</td><td>${c.tipo||''}</td><td>${c.naturaleza||''}</td></tr>`;
      });
      html+=`</tbody></table></body></html>`;
      const blob=new Blob([html],{type:'application/vnd.ms-excel;charset=utf-8'});
      const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`plan_cuentas_${today()}.xls`;a.click();URL.revokeObjectURL(url);return;
    }
    const HEADERS=['Código','Cuenta de movimiento','Grupo','Sub-grupo','Cuenta','Subcuenta'];
    const rows=sorted.map(c=>{
      const cod=String(c.codigo);const partes=cod.split('.');const grKey=partes[0]||cod.charAt(0);
      const gN={'1':'ACTIVOS','2':'PASIVOS','3':'PATRIMONIO','4':'INGRESOS','5':'COSTOS','6':'GASTOS'};
      return[cod,c.nombre,gN[grKey]||c.grupo||grKey,c.subgrupo||(partes.length>=2?partes.slice(0,2).join('.'):cod),c.cuenta||(partes.length>=4?partes.slice(0,4).join('.'):cod),c.subcuenta||(partes.length>4?cod:'')];
    });
    const content=[HEADERS,...rows].map(row=>row.join('\t')).join('\r\n');
    const blob=new Blob(['\uFEFF'+content],{type:'text/plain;charset=utf-8'});
    const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`plan_cuentas_${today()}.txt`;a.click();URL.revokeObjectURL(url);
  };

  // ── Importar PUC ──────────────────────────────────────────────────
  const importarPUC = async (event) => {
    const file=event.target.files[0];if(!file)return;
    const text=await file.text();
    const lines=text.split(/\r?\n/).filter(l=>l.trim());
    if(lines.length<1){alert('Archivo vacío.');event.target.value='';return;}
    const firstCell=lines[0].split('\t')[0].trim();
    const hasHeader=!/^\d/.test(firstCell);
    const dataLines=hasHeader?lines.slice(1):lines;
    const existentes=new Set(cuentas.map(c=>String(c.codigo)));
    const batch=writeBatch(db);let importados=0,omitidos=0;
    const grupoMap={'ACTIVOS':'1','ACTIVO':'1','PASIVOS':'2','PASIVO':'2','PATRIMONIO':'3','INGRESOS':'4','INGRESO':'4','COSTOS':'5','COSTO':'5','GASTOS':'6','GASTO':'6','GASTOS ISLR':'6'};
    for(const line of dataLines){
      const parts=line.split('\t').map(v=>v.trim());
      if(parts.length<2)continue;
      const codigo=parts[0];const nombre=parts[1];const grupoTxt=parts[2]||'';const subgrupo=parts[3]||'';const cuenta=parts[4]||'';const subcuenta=parts[5]||'';
      if(!codigo||!nombre)continue;
      if(existentes.has(codigo)){omitidos++;continue;}
      const grupoNum=grupoMap[grupoTxt.toUpperCase().trim()]||codigo.charAt(0);
      const naturaleza=['1','5','6'].includes(grupoNum)?'Deudora':'Acreedora';
      const partesCod=codigo.split('.');const tipo=partesCod.length<=2?'Mayor':partesCod.length<=4?'Auxiliar':'Analítica';
      const id=gid();batch.set(dref('cont_cuentas',id),{id,codigo,nombre:nombre.toUpperCase(),grupo:grupoNum,subgrupo,cuenta,subcuenta,tipo,naturaleza,descripcion:'',ts:serverTimestamp()});
      importados++;
    }
    if(importados===0){alert(`No se importaron cuentas.${omitidos>0?` (${omitidos} ya existían)`:' Verifique el formato.'}`);event.target.value='';return;}
    await batch.commit();
    alert(`✅ ${importados} cuenta(s) importada(s).${omitidos>0?` (${omitidos} omitidas)`:''}`);
    event.target.value='';
  };

  // ── DASHBOARD ──────────────────────────────────────────────────────
  const DashboardView = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {grupos.map(g=>{const cnt=cuentas.filter(c=>String(c.codigo).startsWith(g.codigo)).length;return<KPI key={g.codigo} label={`${g.codigo} — ${g.nombre}`} value={cnt} accent={g.color} Icon={BookOpen} sub={`${cnt} cuentas`}/>;})}</div>
      <Card title="Estructura del PUC" subtitle={`${cuentas.length} cuentas activas`}>
        {cuentas.length===0?<EmptyState icon={BookOpen} title="PUC vacío" desc="Registre o importe el plan de cuentas"/>:
          <div className="space-y-1">{grupos.map(g=>{
            const gc=cuentas.filter(c=>String(c.codigo).startsWith(g.codigo)).sort((a,b)=>String(a.codigo).localeCompare(String(b.codigo)));
            if(!gc.length)return null;
            return(<div key={g.codigo}>
              <div className="flex items-center gap-2 py-2 px-3 bg-slate-50 rounded-lg mt-3 mb-1"><span className="font-mono font-black text-xs text-slate-500">{g.codigo}</span><span className="font-black text-sm text-slate-900 uppercase tracking-wide">{g.nombre}</span><span className="ml-auto text-[10px] text-slate-400">{gc.length} cuentas</span></div>
              {gc.map(c=><div key={c.id} className="flex items-center gap-3 py-2 px-4 hover:bg-slate-50 rounded-lg border-l-2 border-slate-100" style={{marginLeft:`${(String(c.codigo).split('.').length-1)*12}px`}}>
                <span className="font-mono font-black text-xs text-slate-400 w-20 flex-shrink-0">{c.codigo}</span>
                <span className="text-xs font-semibold text-slate-700 flex-1">{c.nombre}</span>
                <Badge v={c.naturaleza==='Deudora'?'blue':'red'}>{c.naturaleza}</Badge>
              </div>)}
            </div>);
          })}</div>}
      </Card>
    </div>
  );

  // ── PLAN DE CUENTAS con EDITAR ──────────────────────────────────────
  const PlanCuentasView = () => {
    const [modal,setModal]=useState(false);const [busy,setBusy]=useState(false);
    const [search,setSearch]=useState('');const [editCuenta,setEditC]=useState(null);
    const initF=()=>({codigo:'',nombre:'',grupo:'1',tipo:'Auxiliar',naturaleza:'Deudora',descripcion:'',subgrupo:'',cuenta:'',subcuenta:''});
    const [form,setForm]=useState(initF());
    const filtered=cuentas.filter(c=>c.nombre?.toUpperCase().includes(search.toUpperCase())||String(c.codigo).includes(search));

    const openEdit=(c)=>{setEditC(c);setForm({codigo:c.codigo,nombre:c.nombre,grupo:c.grupo||'1',tipo:c.tipo||'Auxiliar',naturaleza:c.naturaleza||'Deudora',descripcion:c.descripcion||'',subgrupo:c.subgrupo||'',cuenta:c.cuenta||'',subcuenta:c.subcuenta||''});setModal(true);};
    const openNew=()=>{setEditC(null);setForm(initF());setModal(true);};

    const save=async()=>{
      if(!form.codigo||!form.nombre)return alert('Código y nombre requeridos');
      if(!editCuenta&&cuentas.find(c=>String(c.codigo)===String(form.codigo)))return alert('El código ya existe');
      setBusy(true);
      try{
        if(editCuenta){await updateDoc(dref('cont_cuentas',editCuenta.id),{...form});}
        else{const id=gid();await setDoc(dref('cont_cuentas',id),{...form,id,ts:serverTimestamp()});}
        setModal(false);setEditC(null);setForm(initF());
      }finally{setBusy(false);}
    };

    return(
      <div>
        <Card title="Plan de Cuentas (PUC)" subtitle={`${cuentas.length} cuentas · Formato: Código | Cuenta de movimiento | Grupo | Sub-grupo | Cuenta | Subcuenta`}
          action={<div className="flex gap-2 flex-wrap">
            <div className="relative"><Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar código o cuenta..." className="border-2 border-slate-200 rounded-xl pl-8 pr-3 py-2 text-xs outline-none focus:border-blue-500 w-48"/></div>
            <div className="relative group"><button className="flex items-center gap-1.5 px-3 py-2 border-2 border-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase hover:border-blue-400 hover:text-blue-600 transition-colors"><Download size={12}/> Exportar ▾</button>
              <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-10 overflow-hidden min-w-[160px] hidden group-hover:block">
                <button onClick={()=>exportarPUC('xls')} className="w-full px-4 py-2.5 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"><FileSpreadsheet size={12} className="text-green-600"/> Excel (.xls) — Columnas</button>
                <button onClick={()=>exportarPUC('txt')} className="w-full px-4 py-2.5 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"><FileText size={12} className="text-blue-500"/> TXT Tabulado (importable)</button>
              </div>
            </div>
            <label className="flex items-center gap-1.5 px-3 py-2 border-2 border-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase hover:border-emerald-400 hover:text-emerald-600 transition-colors cursor-pointer"><Upload size={12}/> Importar<input type="file" accept=".csv,.txt,.xls,.xlsx" className="sr-only" onChange={importarPUC}/></label>
            <Bg onClick={openNew} sm><Plus size={12}/> Nueva</Bg>
          </div>}>

          <div className="mb-4 bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-start gap-2">
            <FileText size={14} className="text-blue-500 flex-shrink-0 mt-0.5"/>
            <div><p className="text-[10px] font-black text-blue-700 uppercase tracking-widest mb-0.5">Formato de Importación</p><p className="text-[10px] text-blue-600 font-mono">Código ⇥ Cuenta de movimiento ⇥ Grupo ⇥ Sub-grupo ⇥ Cuenta ⇥ Subcuenta</p><p className="text-[9px] text-blue-400 mt-0.5">Compatible con TXT tabulado. Primera fila puede ser encabezado.</p></div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr><Th>Código</Th><Th>Cuenta de movimiento</Th><Th>Grupo</Th><Th>Sub-grupo</Th><Th>Cuenta</Th><Th>Subcuenta</Th><Th>Tipo</Th><Th>Naturaleza</Th><Th></Th></tr></thead>
              <tbody>
                {filtered.length===0&&<tr><td colSpan={9}><EmptyState icon={BookOpen} title="Sin cuentas" desc="Registre o importe el PUC"/></td></tr>}
                {[...filtered].sort((a,b)=>String(a.codigo).localeCompare(String(b.codigo))).map(c=>{
                  const cod=String(c.codigo);const partes=cod.split('.');const grKey=partes[0]||cod.charAt(0);
                  const gN={'1':'ACTIVOS','2':'PASIVOS','3':'PATRIMONIO','4':'INGRESOS','5':'COSTOS','6':'GASTOS'};
                  const subgr=c.subgrupo||(partes.length>=2?partes.slice(0,2).join('.'):cod);
                  const ctaCol=c.cuenta||(partes.length>=4?partes.slice(0,4).join('.'):cod);
                  const subc=c.subcuenta||(partes.length>4?cod:'—');
                  return<tr key={c.id} className="hover:bg-slate-50">
                    <Td mono className="font-black text-blue-600 text-sm">{c.codigo}</Td>
                    <Td className="font-semibold max-w-[220px]">{c.nombre}</Td>
                    <Td className="text-[10px] font-semibold text-slate-500 max-w-[100px] truncate">{gN[grKey]||c.grupo||grKey}</Td>
                    <Td mono className="text-slate-500 text-[11px] max-w-[120px] truncate">{subgr}</Td>
                    <Td mono className="text-slate-500 text-[11px] max-w-[100px] truncate">{ctaCol}</Td>
                    <Td mono className="text-slate-400 text-[11px] max-w-[100px] truncate">{subc}</Td>
                    <Td><Badge v={c.tipo==='Mayor'?'gold':'gray'}>{c.tipo}</Badge></Td>
                    <Td><Badge v={c.naturaleza==='Deudora'?'blue':'red'}>{c.naturaleza}</Badge></Td>
                    <Td><div className="flex gap-1">
                      <button onClick={()=>openEdit(c)} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg" title="Editar"><Settings size={12}/></button>
                      <button onClick={()=>deleteDoc(dref('cont_cuentas',c.id))} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg"><Trash2 size={12}/></button>
                    </div></Td>
                  </tr>;
                })}
              </tbody>
            </table>
          </div>
        </Card>

        <Modal open={modal} onClose={()=>{setModal(false);setEditC(null);}} title={editCuenta?`Editar Cuenta — ${editCuenta.codigo}`:'Registrar Cuenta Contable'} wide
          footer={<><Bo onClick={()=>{setModal(false);setEditC(null);}}>Cancelar</Bo><Bg onClick={save} disabled={busy}>{busy?'Guardando...':(editCuenta?'Guardar Cambios':'Guardar Cuenta')}</Bg></>}>
          <div className="grid grid-cols-2 gap-4">
            <FG label="Código de Cuenta"><input className={inp} value={form.codigo} onChange={e=>setForm({...form,codigo:e.target.value})} placeholder="1.1.01.01.001" readOnly={!!editCuenta} style={editCuenta?{background:'#f8fafc'}:{}}/></FG>
            <FG label="Cuenta de movimiento"><input className={inp} value={form.nombre} onChange={e=>setForm({...form,nombre:e.target.value.toUpperCase()})} placeholder="CAJA PRINCIPAL"/></FG>
            <FG label="Grupo Principal"><select className={sel} value={form.grupo} onChange={e=>setForm({...form,grupo:e.target.value})}>{grupos.map(g=><option key={g.codigo} value={g.codigo}>{g.codigo} — {g.nombre}</option>)}</select></FG>
            <FG label="Tipo"><select className={sel} value={form.tipo} onChange={e=>setForm({...form,tipo:e.target.value})}><option>Mayor</option><option>Auxiliar</option><option>Analítica</option></select></FG>
            <FG label="Naturaleza"><select className={sel} value={form.naturaleza} onChange={e=>setForm({...form,naturaleza:e.target.value})}><option>Deudora</option><option>Acreedora</option></select></FG>
            <FG label="Sub-grupo"><input className={inp} value={form.subgrupo} onChange={e=>setForm({...form,subgrupo:e.target.value})} placeholder="Ej: ACTIVO CIRCULANTE"/></FG>
            <FG label="Cuenta"><input className={inp} value={form.cuenta} onChange={e=>setForm({...form,cuenta:e.target.value})} placeholder="Ej: DISPONIBLE"/></FG>
            <FG label="Subcuenta"><input className={inp} value={form.subcuenta} onChange={e=>setForm({...form,subcuenta:e.target.value})} placeholder="Ej: BANCOS NACIONALES"/></FG>
            <FG label="Descripción / Uso" full><input className={inp} value={form.descripcion} onChange={e=>setForm({...form,descripcion:e.target.value})} placeholder="Descripción y uso de la cuenta..."/></FG>
          </div>
        </Modal>
      </div>
    );
  };

  // ── COMPROBANTE DIARIO ──────────────────────────────────────────────
  const ComprobanteDiarioView = () => {
    const [modulo, setModulo]   = useState('Banco');
    const [desde,  setDesde]    = useState(mesActual()+'-01');
    const [hasta,  setHasta]    = useState(today());
    const [nroComp,setNroComp]  = useState('');

    // Generar filas del comprobante desde movimientos bancarios
    const generarFilas = () => {
      const movsFiltrados = (modulo==='Banco'?movBanco:movCaja)
        .filter(m=>m.fecha>=desde && m.fecha<=hasta && m.asientoDebito)
        .sort((a,b)=>a.fecha.localeCompare(b.fecha));

      const filas = [];
      const mes = desde.substring(0,7).replace('-','.');
      let comp = 1;
      let saldoBsAcum = 0;
      let saldoUSDacum = 0;

      movsFiltrados.forEach(m => {
        const esBs = m.moneda==='BS';
        const nroDoc = m.referencia || m.facturaNumero || `${m.tipo.substring(0,3).toUpperCase()}-${String(comp).padStart(4,'0')}`;
        const nComp = nroComp || `CB-${String(comp).padStart(4,'0')}`;

        // Línea DÉBITO
        const debBs  = m.tipo==='Ingreso' ? Number(m.montoBs||0)  : 0;
        const habBs  = m.tipo==='Ingreso' ? 0 : Number(m.montoBs||0);
        const debUSD = m.tipo==='Ingreso' ? Number(m.montoUSD||0) : 0;
        const habUSD = m.tipo==='Ingreso' ? 0 : Number(m.montoUSD||0);
        saldoBsAcum  += debBs  - habBs;
        saldoUSDacum += debUSD - habUSD;

        filas.push({
          comprobante: nComp,
          mes,
          fecha: m.fecha,
          codigo: m.ctaContraId ? cuentas.find(c=>c.id===m.ctaContraId)?.codigo||'—' : '—',
          cuenta: m.asientoDebito,
          tipo: 'D',
          nroDoc,
          concepto: m.concepto,
          tasa: m.tasa||tasaActiva,
          debeBs:  debBs,
          haberBs: habBs,
          saldoBs: saldoBsAcum,
          debeUSD: debUSD,
          haberUSD:habUSD,
          saldoUSD:saldoUSDacum,
        });

        // Línea CRÉDITO
        const debBs2  = m.tipo==='Ingreso' ? 0 : Number(m.montoBs||0);
        const habBs2  = m.tipo==='Ingreso' ? Number(m.montoBs||0) : 0;
        const debUSD2 = m.tipo==='Ingreso' ? 0 : Number(m.montoUSD||0);
        const habUSD2 = m.tipo==='Ingreso' ? Number(m.montoUSD||0) : 0;
        saldoBsAcum  += debBs2 - habBs2;
        saldoUSDacum += debUSD2- habUSD2;

        filas.push({
          comprobante: nComp,
          mes,
          fecha: m.fecha,
          codigo: m.ctaContraId ? cuentas.find(c=>c.id===m.ctaContraId)?.codigo||'—' : '—',
          cuenta: m.asientoCredito,
          tipo: 'H',
          nroDoc,
          concepto: m.concepto,
          tasa: m.tasa||tasaActiva,
          debeBs:  debBs2,
          haberBs: habBs2,
          saldoBs: saldoBsAcum,
          debeUSD: debUSD2,
          haberUSD:habUSD2,
          saldoUSD:saldoUSDacum,
        });
        comp++;
      });
      return filas;
    };

    const filas = generarFilas();
    const totDebBs  = filas.reduce((a,f)=>a+f.debeBs,0);
    const totHabBs  = filas.reduce((a,f)=>a+f.haberBs,0);
    const totDebUSD = filas.reduce((a,f)=>a+f.debeUSD,0);
    const totHabUSD = filas.reduce((a,f)=>a+f.haberUSD,0);

    const exportarComprobante = () => {
      const HDRS=['Comprobante','Mes','Fecha','Código','Cuenta de movimiento','Tipo','Nro Documento','CONCEPTO','Tasa','Debe Bs','Haber Bs','Saldo Bs','Debe USD','Haber USD','Saldo USD'];
      const grupoNames={'1':'ACTIVOS','2':'PASIVOS','3':'PATRIMONIO','4':'INGRESOS','5':'COSTOS','6':'GASTOS'};
      let html=`<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head><meta charset="utf-8"><style>body{font-family:Arial;font-size:10px}table{border-collapse:collapse;width:100%}th{background:#1e3a5f;color:#fff;border:1px solid #94a3b8;padding:5px 8px;text-align:left;font-size:9px;text-transform:uppercase}td{border:1px solid #e2e8f0;padding:3px 8px}tr:nth-child(even) td{background:#f8fafc}.debe{color:#065f46;font-weight:bold}.haber{color:#7f1d1d;font-weight:bold}.saldo{color:#1e3a5f}.tot{background:#1e293b;color:#fff;font-weight:bold}</style></head><body>
        <p style="font-size:13px;font-weight:bold">Comprobante Diario — ${modulo} · Servicios Jiret G&amp;B, C.A.</p>
        <p style="font-size:10px;color:#666">Período: ${dd(desde)} al ${dd(hasta)} · Generado: ${dd(today())}</p>
        <table><thead><tr>${HDRS.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>`;
      filas.forEach(f=>{
        html+=`<tr><td>${f.comprobante}</td><td>${f.mes}</td><td>${dd(f.fecha)}</td><td style="font-family:Courier New;color:#1e40af;font-weight:bold">${f.codigo}</td><td>${f.cuenta}</td>
          <td style="text-align:center;font-weight:bold;color:${f.tipo==='D'?'#065f46':'#7f1d1d'}">${f.tipo}</td>
          <td>${f.nroDoc}</td><td>${f.concepto}</td><td style="text-align:right">${f.tasa}</td>
          <td class="debe" style="text-align:right">${f.debeBs>0?fmt(f.debeBs):''}</td>
          <td class="haber" style="text-align:right">${f.haberBs>0?fmt(f.haberBs):''}</td>
          <td class="saldo" style="text-align:right">${fmt(f.saldoBs)}</td>
          <td class="debe" style="text-align:right">${f.debeUSD>0?fmt(f.debeUSD):''}</td>
          <td class="haber" style="text-align:right">${f.haberUSD>0?fmt(f.haberUSD):''}</td>
          <td class="saldo" style="text-align:right">${fmt(f.saldoUSD)}</td></tr>`;
      });
      html+=`<tr class="tot"><td colspan="9" style="text-align:right">TOTALES</td>
        <td style="text-align:right">${fmt(totDebBs)}</td><td style="text-align:right">${fmt(totHabBs)}</td><td style="text-align:right">${fmt(filas[filas.length-1]?.saldoBs||0)}</td>
        <td style="text-align:right">${fmt(totDebUSD)}</td><td style="text-align:right">${fmt(totHabUSD)}</td><td style="text-align:right">${fmt(filas[filas.length-1]?.saldoUSD||0)}</td></tr>
      </tbody></table></body></html>`;
      const blob=new Blob([html],{type:'application/vnd.ms-excel;charset=utf-8'});
      const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`comprobante_${modulo.toLowerCase()}_${desde.substring(0,7)}.xls`;a.click();URL.revokeObjectURL(url);
    };

    return (
      <div className="space-y-5">
        <Card title="Parámetros del Comprobante">
          <div className="grid grid-cols-4 gap-4">
            <FG label="Módulo">
              <div className="flex gap-1">{['Banco','Caja'].map(m=>(
                <button key={m} onClick={()=>setModulo(m)} className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase border-2 transition-all ${modulo===m?'bg-slate-900 text-white border-slate-900':'bg-white text-slate-500 border-slate-200'}`}>{m}</button>
              ))}</div>
            </FG>
            <FG label="Desde"><input type="date" className={inp} value={desde} onChange={e=>setDesde(e.target.value)}/></FG>
            <FG label="Hasta"><input type="date" className={inp} value={hasta} onChange={e=>setHasta(e.target.value)}/></FG>
            <FG label="N° Comprobante (opc.)"><input className={inp} value={nroComp} onChange={e=>setNroComp(e.target.value)} placeholder="CB-0001"/></FG>
          </div>
        </Card>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPI label="Asientos Generados" value={filas.length/2|0} accent="blue" Icon={FileText} sub="operaciones"/>
          <KPI label="Debe Bs." value={`Bs. ${fmt(totDebBs)}`} accent="green" Icon={ArrowUpCircle}/>
          <KPI label="Haber Bs." value={`Bs. ${fmt(totHabBs)}`} accent="red" Icon={ArrowDownCircle}/>
          <KPI label="Saldo Final Bs." value={`Bs. ${fmt(totDebBs-totHabBs)}`} accent={totDebBs>=totHabBs?'green':'red'} Icon={Scale}/>
        </div>

        <Card title={`Comprobante Diario — ${modulo} — ${dd(desde)} al ${dd(hasta)}`} subtitle={`${filas.length} líneas contables`}
          action={<button onClick={exportarComprobante} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl text-[10px] font-black uppercase hover:bg-green-700"><Download size={12}/> Exportar Excel</button>}>
          {filas.length===0?<EmptyState icon={FileText} title="Sin movimientos con asiento contable" desc="Registre movimientos con cuenta contrapartida del PUC"/>:
          <div className="overflow-x-auto">
            <table className="w-full text-xs" style={{minWidth:'1200px'}}>
              <thead>
                <tr>
                  {['Comprobante','Mes','Fecha','Código','Cuenta de movimiento','Tipo','Nro Documento','CONCEPTO','Tasa','Debe Bs','Haber Bs','Saldo Bs','Debe USD','Haber USD','Saldo USD'].map(h=>(
                    <th key={h} className="px-3 py-2.5 text-[9px] font-black uppercase tracking-widest bg-slate-800 text-white border-b-2 border-slate-700 text-left whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filas.map((f,i)=>(
                  <tr key={i} className={`${i%4<2?'bg-white':'bg-slate-50'} hover:bg-blue-50 border-b border-slate-100`}>
                    <td className="px-3 py-2 font-mono font-black text-blue-600 text-[10px]">{f.comprobante}</td>
                    <td className="px-3 py-2 text-slate-500">{f.mes}</td>
                    <td className="px-3 py-2 font-mono text-slate-700 whitespace-nowrap">{dd(f.fecha)}</td>
                    <td className="px-3 py-2 font-mono font-black text-blue-700 text-[10px]">{f.codigo}</td>
                    <td className="px-3 py-2 font-semibold text-slate-800 max-w-[200px] truncate">{f.cuenta}</td>
                    <td className={`px-3 py-2 font-black text-center text-sm ${f.tipo==='D'?'text-emerald-700':'text-red-600'}`}>{f.tipo}</td>
                    <td className="px-3 py-2 font-mono text-slate-500 text-[10px]">{f.nroDoc}</td>
                    <td className="px-3 py-2 max-w-[160px] truncate">{f.concepto}</td>
                    <td className="px-3 py-2 font-mono text-right text-slate-500">{f.tasa}</td>
                    <td className="px-3 py-2 font-mono font-black text-right text-emerald-700">{f.debeBs>0?fmt(f.debeBs):''}</td>
                    <td className="px-3 py-2 font-mono font-black text-right text-red-600">{f.haberBs>0?fmt(f.haberBs):''}</td>
                    <td className="px-3 py-2 font-mono font-black text-right text-blue-800">{fmt(f.saldoBs)}</td>
                    <td className="px-3 py-2 font-mono font-black text-right text-emerald-600">{f.debeUSD>0?fmt(f.debeUSD):''}</td>
                    <td className="px-3 py-2 font-mono font-black text-right text-red-500">{f.haberUSD>0?fmt(f.haberUSD):''}</td>
                    <td className="px-3 py-2 font-mono font-black text-right text-blue-700">{fmt(f.saldoUSD)}</td>
                  </tr>
                ))}
                {/* Totales */}
                <tr className="font-black" style={{background:'#0f172a'}}>
                  <td colSpan={9} className="px-3 py-3 text-right text-[10px] uppercase tracking-widest text-slate-400">TOTALES DEL PERÍODO</td>
                  <td className="px-3 py-3 font-mono text-right text-emerald-400">{fmt(totDebBs)}</td>
                  <td className="px-3 py-3 font-mono text-right text-red-400">{fmt(totHabBs)}</td>
                  <td className="px-3 py-3 font-mono text-right text-blue-300">{fmt(filas[filas.length-1]?.saldoBs||0)}</td>
                  <td className="px-3 py-3 font-mono text-right text-emerald-400">{fmt(totDebUSD)}</td>
                  <td className="px-3 py-3 font-mono text-right text-red-400">{fmt(totHabUSD)}</td>
                  <td className="px-3 py-3 font-mono text-right text-blue-300">{fmt(filas[filas.length-1]?.saldoUSD||0)}</td>
                </tr>
              </tbody>
            </table>
          </div>}
        </Card>
      </div>
    );
  };

  const navGroups=[
    {group:'Analítica',color:'#3b82f6',items:[{id:'dashboard',label:'Resumen PUC',icon:LayoutDashboard}]},
    {group:'Contabilidad',color:'#3b82f6',items:[{id:'plan',label:'Plan de Cuentas',icon:BookOpen}]},
    {group:'Comprobantes',color:'#10b981',items:[{id:'comprobante',label:'Comprobante Diario',icon:FileSpreadsheet}]},
  ];
  const views={dashboard:<DashboardView/>,plan:<PlanCuentasView/>,comprobante:<ComprobanteDiarioView/>};
  const curNav=navGroups.flatMap(g=>g.items).find(n=>n.id===sec);
  return (
    <SidebarLayout brand="Supply G&B" brandSub="Plan de Cuentas" navGroups={navGroups} activeId={sec} onNav={setSec} onBack={onBack} accentColor={BLUE}
      headerContent={<>
        <div><h1 className="font-black text-slate-800 text-sm uppercase tracking-wide">{curNav?.label}</h1><p className="text-[9px] text-slate-400 font-medium uppercase tracking-widest">Contabilidad <ChevronRight size={8} className="inline"/> {navGroups.find(g=>g.items.find(i=>i.id===sec))?.group}</p></div>
        {sec==='comprobante'?<button onClick={()=>{}} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl text-[10px] font-black uppercase hover:bg-green-700"><Download size={12}/> Exportar</button>:<Bg onClick={()=>setSec('plan')} sm><Plus size={12}/> Nueva Cuenta</Bg>}
      </>}>
      {views[sec]}
    </SidebarLayout>
  );
}
function AsientosApp({ fbUser, onBack }) {
  const [sec, setSec] = useState('dashboard');
  const [asientos, setAsientos]   = useState([]);
  const [cuentas, setCuentas]     = useState([]);

  useEffect(() => {
    if (!fbUser) return;
    const subs = [
      onSnapshot(query(col('cont_asientos'), orderBy('fecha','desc')), s => setAsientos(s.docs.map(d=>d.data()))),
      onSnapshot(col('cont_cuentas'), s => setCuentas(s.docs.map(d=>d.data()))),
    ];
    return () => subs.forEach(u=>u());
  }, [fbUser]);

  // ── Helpers para compatibilidad con asientos viejos (campo debito/credito) y nuevos (debeBs/haberBs) ──
  const getDebeBs  = l => Number(l.debeBs  ?? l.debito  ?? 0);
  const getHaberBs = l => Number(l.haberBs ?? l.credito ?? 0);
  const getDebeUSD = l => Number(l.debeUSD  ?? 0);
  const getHaberUSD= l => Number(l.haberUSD ?? 0);

  // ── DASHBOARD ──────────────────────────────────────────────────────────────
  const DashboardView = () => {
    const mesCnt = asientos.filter(a=>a.fecha?.startsWith(mesActual())).length;
    const bancarios = asientos.filter(a=>a.modulo==='Bancos').length;
    const manuales  = asientos.filter(a=>a.modulo!=='Bancos').length;
    const totDebBs  = asientos.reduce((s,a)=>(a.lineas||[]).reduce((l,li)=>l+getDebeBs(li),s),0);
    const totHabBs  = asientos.reduce((s,a)=>(a.lineas||[]).reduce((l,li)=>l+getHaberBs(li),s),0);
    const balOk     = Math.abs(totDebBs-totHabBs)<0.01;
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPI label="Total Asientos" value={asientos.length} accent="blue" Icon={FileText}/>
          <KPI label="Del Mes" value={mesCnt} accent="green" Icon={CalendarDays}/>
          <KPI label="Auto-bancarios" value={bancarios} accent="gold" Icon={Building2} sub="Generados de Bancos"/>
          <KPI label="Balance Gral." value={balOk?'✓ Cuadrado':'✗ Revisar'} accent={balOk?'green':'red'} Icon={Scale}/>
        </div>
        <div className="grid lg:grid-cols-2 gap-5">
          <Card title="Últimos Asientos">
            {asientos.length===0?<EmptyState icon={FileText} title="Sin asientos" desc="Los asientos de banco se generan automáticamente"/>:
              <table className="w-full"><thead><tr><Th>Comprobante</Th><Th>Fecha</Th><Th>Concepto</Th><Th>Módulo</Th><Th right>Debe Bs</Th></tr></thead>
                <tbody>{asientos.slice(0,8).map(a=>{
                  const dBs=(a.lineas||[]).reduce((s,l)=>s+getDebeBs(l),0);
                  return <tr key={a.id} className="hover:bg-slate-50">
                    <Td mono className="font-black text-blue-600">{a.comprobante||a.numero}</Td>
                    <Td>{dd(a.fecha)}</Td>
                    <Td className="max-w-[160px] truncate">{a.descripcion}</Td>
                    <Td><Badge v={a.modulo==='Bancos'?'blue':'gray'}>{a.modulo||'Manual'}</Badge></Td>
                    <Td right mono className="text-emerald-700 font-black">Bs.{fmt(dBs)}</Td>
                  </tr>;
                })}</tbody>
              </table>}
          </Card>
          <Card title="Posición Contable">
            <div className="space-y-3">
              {[{l:'Débitos Bs.',v:`Bs. ${fmt(totDebBs)}`,c:'text-emerald-600'},{l:'Haberes Bs.',v:`Bs. ${fmt(totHabBs)}`,c:'text-red-600'},{l:'Débitos USD',v:`$${fmt(asientos.reduce((s,a)=>(a.lineas||[]).reduce((l,li)=>l+getDebeUSD(li),s),0))}`,c:'text-emerald-700'},{l:'Haberes USD',v:`$${fmt(asientos.reduce((s,a)=>(a.lineas||[]).reduce((l,li)=>l+getHaberUSD(li),s),0))}`,c:'text-red-700'}].map(({l,v,c})=>(
                <div key={l} className="flex justify-between py-2 border-b border-slate-50"><span className="text-xs text-slate-500 font-medium">{l}</span><span className={`font-mono font-black text-sm ${c}`}>{v}</span></div>
              ))}
              <div className={`flex justify-between py-3 px-4 rounded-xl ${balOk?'bg-emerald-50':'bg-red-50'}`}><span className="font-black text-xs uppercase tracking-wide">Diferencia</span><span className={`font-mono font-black ${balOk?'text-emerald-600':'text-red-600'}`}>Bs. {fmt(Math.abs(totDebBs-totHabBs))}</span></div>
            </div>
          </Card>
        </div>
      </div>
    );
  };

  // ── LIBRO DIARIO — TABLA PLANA FORMATO COMPROBANTE ────────────────────────
  const LibroDiarioView = () => {
    const [search, setSearch] = useState('');
    const [filtMes, setFiltMes] = useState('');
    const [filtMod, setFiltMod] = useState('');
    const [monedaVista, setMonedaVista] = useState('BS'); // BS o USD

    const meses = [...new Set(asientos.map(a=>a.mes||a.fecha?.substring(0,7)||''))].filter(Boolean).sort().reverse();

    const filtered = asientos.filter(a=>{
      if(filtMes && (a.mes||a.fecha?.substring(0,7)||'') !== filtMes) return false;
      if(filtMod && (a.modulo||'Manual') !== filtMod) return false;
      if(search && !a.descripcion?.toLowerCase().includes(search.toLowerCase()) && !(a.comprobante||a.numero)?.includes(search)) return false;
      return true;
    });

    // Generar filas planas para la tabla
    const filas = [];
    let saldoAcumBs = 0, saldoAcumUSD = 0;
    [...filtered].sort((a,b)=>a.fecha?.localeCompare(b.fecha)||0).forEach(a=>{
      (a.lineas||[]).forEach(l=>{
        const dBs=getDebeBs(l), hBs=getHaberBs(l), dUSD=getDebeUSD(l), hUSD=getHaberUSD(l);
        saldoAcumBs  += dBs - hBs;
        saldoAcumUSD += dUSD - hUSD;
        filas.push({
          comprobante: a.comprobante||a.numero||'',
          mes: a.mes||a.fecha?.substring(5,7)+'/'+a.fecha?.substring(0,4)||'',
          fecha: a.fecha,
          codigo: l.codigo||l.cuentaCodigo||'',
          cuenta: l.cuenta||l.cuentaNombre||'',
          tipo: l.tipoLinea||((dBs>0||dUSD>0)?'D':'H'),
          nroDoc: l.nroDoc||a.nroDocumento||a.referencia||'',
          concepto: l.concepto||a.descripcion||'',
          tasa: Number(l.tasa||a.tasa||0),
          debeBs: dBs,
          haberBs: hBs,
          saldoBs: saldoAcumBs,
          debeUSD: dUSD,
          haberUSD: hUSD,
          saldoUSD: saldoAcumUSD,
          modulo: a.modulo||'Manual',
          asientoId: a.id,
        });
      });
    });

    const exportarExcel = () => {
      let html=`<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8"><style>body{font-size:10px;font-family:Arial}th{background:#1e3a5f;color:#fff;border:1px solid #94a3b8;padding:4px 8px;font-size:9px;text-transform:uppercase}td{border:1px solid #e2e8f0;padding:3px 8px}tr:nth-child(even) td{background:#f8fafc}.D td:first-child{color:#16a34a}.H td:first-child{color:#dc2626}</style></head><body>
      <p style="font-size:13px;font-weight:bold">Libro Diario — Servicios Jiret G&amp;B, C.A.</p>
      <p style="font-size:10px;color:#666">Generado: ${dd(today())} · ${filas.length} líneas</p>
      <table><thead><tr><th>Comprobante</th><th>Mes</th><th>Fecha</th><th>Código</th><th>Cuenta de movimiento</th><th>Tipo</th><th>Nro Documento</th><th>CONCEPTO</th><th>Tasa</th><th>Debe Bs</th><th>Haber Bs</th><th>Saldo Bs</th><th>Debe USD</th><th>Haber USD</th><th>Saldo USD</th></tr></thead><tbody>`;
      filas.forEach(f=>{
        html+=`<tr class="${f.tipo}"><td style="font-family:Courier New;font-weight:bold">${f.comprobante}</td><td>${f.mes}</td><td>${dd(f.fecha)}</td><td style="font-family:Courier New;color:#1e40af;font-weight:bold">${f.codigo}</td><td>${f.cuenta}</td><td style="font-weight:bold;${f.tipo==='D'?'color:#16a34a':'color:#dc2626'}">${f.tipo}</td><td>${f.nroDoc}</td><td>${f.concepto}</td><td style="text-align:right">${f.tasa}</td><td style="text-align:right">${f.debeBs>0?fmt(f.debeBs):''}</td><td style="text-align:right">${f.haberBs>0?fmt(f.haberBs):''}</td><td style="text-align:right">${fmt(f.saldoBs)}</td><td style="text-align:right">${f.debeUSD>0?fmt(f.debeUSD):''}</td><td style="text-align:right">${f.haberUSD>0?fmt(f.haberUSD):''}</td><td style="text-align:right">${fmt(f.saldoUSD)}</td></tr>`;
      });
      html+=`</tbody></table></body></html>`;
      const blob=new Blob([html],{type:'application/vnd.ms-excel;charset=utf-8'});
      const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`libro_diario_${today()}.xls`;a.click();URL.revokeObjectURL(url);
    };

    return (
      <Card title="Libro Diario" subtitle={`${filas.length} líneas · ${filtered.length} comprobantes`}
        action={<div className="flex gap-2 flex-wrap items-center">
          {/* Toggle moneda */}
          <div className="flex rounded-xl overflow-hidden border-2 border-slate-200">
            <button onClick={()=>setMonedaVista('BS')} className={`px-3 py-1.5 text-[10px] font-black uppercase transition-all ${monedaVista==='BS'?'bg-blue-600 text-white':'bg-white text-slate-500'}`}>Bs.</button>
            <button onClick={()=>setMonedaVista('USD')} className={`px-3 py-1.5 text-[10px] font-black uppercase transition-all ${monedaVista==='USD'?'bg-emerald-600 text-white':'bg-white text-slate-500'}`}>USD</button>
            <button onClick={()=>setMonedaVista('AMBAS')} className={`px-3 py-1.5 text-[10px] font-black uppercase transition-all ${monedaVista==='AMBAS'?'bg-slate-700 text-white':'bg-white text-slate-500'}`}>Ambas</button>
          </div>
          <select className="border-2 border-slate-200 rounded-xl px-3 py-1.5 text-xs outline-none focus:border-blue-500" value={filtMes} onChange={e=>setFiltMes(e.target.value)}>
            <option value="">Todos los meses</option>
            {meses.map(m=><option key={m} value={m}>{m}</option>)}
          </select>
          <select className="border-2 border-slate-200 rounded-xl px-3 py-1.5 text-xs outline-none focus:border-blue-500" value={filtMod} onChange={e=>setFiltMod(e.target.value)}>
            <option value="">Todos</option><option value="Bancos">Bancos</option><option value="Manual">Manual</option>
          </select>
          <div className="relative"><Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar..." className="border-2 border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs outline-none focus:border-blue-500 w-36"/></div>
          <button onClick={exportarExcel} className="flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white rounded-xl text-[10px] font-black uppercase hover:bg-green-700"><Download size={12}/> Excel</button>
        </div>}>
        {filas.length===0?<EmptyState icon={BookMarked} title="Sin registros" desc="Los asientos de banco se generan automáticamente al registrar movimientos"/>:
          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead><tr style={{background:'#0f172a'}}>
                {[
                  'Comprobante','Mes','Fecha','Código','Cuenta de movimiento','T','Nro Doc.','Concepto','Tasa',
                  ...(monedaVista!=='USD'?['Debe Bs','Haber Bs','Saldo Bs']:[]),
                  ...(monedaVista!=='BS' ?['Debe USD','Haber USD','Saldo USD']:[]),
                ].map(h=>(
                  <th key={h} className="px-3 py-2.5 text-left font-black uppercase tracking-wider whitespace-nowrap text-[9px]" style={{color:'#94a3b8',borderBottom:'2px solid #1e293b'}}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {filas.map((f,i)=>{
                  const isD = f.tipo==='D';
                  const cambiaComp = i===0 || filas[i-1].comprobante!==f.comprobante;
                  return (
                    <tr key={i} className={`hover:bg-blue-50/40 transition-colors ${cambiaComp&&i>0?'border-t-2 border-blue-100':''}`}
                      style={{background: isD ? 'rgba(16,185,129,0.04)' : 'rgba(239,68,68,0.04)'}}>
                      <td className="px-3 py-2 font-mono font-black text-blue-600 whitespace-nowrap">{cambiaComp?f.comprobante:''}</td>
                      <td className="px-3 py-2 text-slate-500 whitespace-nowrap">{cambiaComp?f.mes:''}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-slate-600">{cambiaComp?dd(f.fecha):''}</td>
                      <td className="px-3 py-2 font-mono font-black text-blue-700 whitespace-nowrap">{f.codigo}</td>
                      <td className="px-3 py-2 font-medium text-slate-800 max-w-[180px]">
                        <span className={`${!isD?'pl-4':''} block truncate`}>{f.cuenta}</span>
                      </td>
                      <td className={`px-3 py-2 font-black text-center ${isD?'text-emerald-600':'text-red-500'}`}>{f.tipo}</td>
                      <td className="px-3 py-2 font-mono text-slate-400 whitespace-nowrap">{f.nroDoc}</td>
                      <td className="px-3 py-2 text-slate-600 max-w-[160px]"><span className="block truncate">{f.concepto}</span></td>
                      <td className="px-3 py-2 font-mono text-slate-500 text-right whitespace-nowrap">{f.tasa||''}</td>
                      {/* Columnas Bs - visibles si monedaVista es BS o AMBAS */}
                      {monedaVista!=='USD'&&<><td className="px-3 py-2 font-mono font-black text-emerald-600 text-right whitespace-nowrap">{f.debeBs>0?`Bs.${fmt(f.debeBs)}`:''}</td>
                      <td className="px-3 py-2 font-mono font-black text-red-500 text-right whitespace-nowrap">{f.haberBs>0?`Bs.${fmt(f.haberBs)}`:''}</td>
                      <td className="px-3 py-2 font-mono text-slate-700 text-right whitespace-nowrap font-bold">Bs.{fmt(f.saldoBs)}</td></>}
                      {/* Columnas USD - visibles si monedaVista es USD o AMBAS */}
                      {monedaVista!=='BS'&&<><td className="px-3 py-2 font-mono text-emerald-700 text-right whitespace-nowrap">{f.debeUSD>0?`$${fmt(f.debeUSD)}`:''}</td>
                      <td className="px-3 py-2 font-mono text-red-600 text-right whitespace-nowrap">{f.haberUSD>0?`$${fmt(f.haberUSD)}`:''}</td>
                      <td className="px-3 py-2 font-mono text-slate-600 text-right whitespace-nowrap">${fmt(f.saldoUSD)}</td></>}
                    </tr>
                  );
                })}
              </tbody>
              <tfoot><tr style={{background:'#0f172a'}}>
                <td colSpan={9} className="px-3 py-3 font-black text-xs text-slate-400 uppercase tracking-widest">TOTALES PERÍODO</td>
                {monedaVista!=='USD'&&<><td className="px-3 py-3 font-mono font-black text-emerald-400 text-right whitespace-nowrap">Bs.{fmt(filas.reduce((a,f)=>a+f.debeBs,0))}</td><td className="px-3 py-3 font-mono font-black text-red-400 text-right whitespace-nowrap">Bs.{fmt(filas.reduce((a,f)=>a+f.haberBs,0))}</td><td className="px-3 py-3"></td></>}
                {monedaVista!=='BS'&&<><td className="px-3 py-3 font-mono font-black text-emerald-400 text-right whitespace-nowrap">${fmt(filas.reduce((a,f)=>a+f.debeUSD,0))}</td><td className="px-3 py-3 font-mono font-black text-red-400 text-right whitespace-nowrap">${fmt(filas.reduce((a,f)=>a+f.haberUSD,0))}</td><td className="px-3 py-3"></td></>}
              </tr></tfoot>
            </table>
          </div>}
      </Card>
    );
  };

  // ── NUEVO ASIENTO MANUAL — CON TASA Y USD ─────────────────────────────────
  const NuevoAsientoView = () => {
    const [form, setForm] = useState({
      fecha: today(), descripcion:'', tipo:'Manual', referencia:'',
      tasa:'', niif:false, efectivo:false, modulo:'Manual'
    });
    const [lineas, setLineas] = useState([
      {cuentaId:'',codigo:'',cuenta:'',debeBs:'',haberBs:'',debeUSD:'',haberUSD:''},
      {cuentaId:'',codigo:'',cuenta:'',debeBs:'',haberBs:'',debeUSD:'',haberUSD:''},
    ]);
    const [busy, setBusy] = useState(false);
    const tasaNum = Number(form.tasa)||1;

    const totDebeBs  = lineas.reduce((s,l)=>s+Number(l.debeBs||0),0);
    const totHaberBs = lineas.reduce((s,l)=>s+Number(l.haberBs||0),0);
    const totDebeUSD = lineas.reduce((s,l)=>s+Number(l.debeUSD||0),0);
    const totHaberUSD= lineas.reduce((s,l)=>s+Number(l.haberUSD||0),0);
    const balOkBs    = totDebeBs>0 && Math.abs(totDebeBs-totHaberBs)<0.01;
    const balOkUSD   = totDebeUSD>0 && Math.abs(totDebeUSD-totHaberUSD)<0.01;
    const balOk      = balOkBs && balOkUSD;

    const setCuenta = (i, cuentaId) => {
      const c = cuentas.find(x=>x.id===cuentaId);
      const n = [...lineas]; n[i] = {...n[i], cuentaId, codigo:c?.codigo||'', cuenta:c?.nombre||''}; setLineas(n);
    };

    // Cuando cambia Bs, calcular USD automáticamente (y vice versa) según tasa
    const setDebeBs = (i, val) => {
      const n=[...lineas]; n[i].debeBs=val;
      if(tasaNum>0 && val) n[i].debeUSD=String(Number(val)/tasaNum);
      setLineas(n);
    };
    const setHaberBs = (i, val) => {
      const n=[...lineas]; n[i].haberBs=val;
      if(tasaNum>0 && val) n[i].haberUSD=String(Number(val)/tasaNum);
      setLineas(n);
    };
    const setDebeUSD = (i, val) => {
      const n=[...lineas]; n[i].debeUSD=val;
      if(tasaNum>0 && val) n[i].debeBs=String(Number(val)*tasaNum);
      setLineas(n);
    };
    const setHaberUSD = (i, val) => {
      const n=[...lineas]; n[i].haberUSD=val;
      if(tasaNum>0 && val) n[i].haberBs=String(Number(val)*tasaNum);
      setLineas(n);
    };

    const save = async () => {
      if (!form.descripcion) return alert('Ingrese la descripción');
      if (!balOkBs) return alert('Débitos Bs. ≠ Haberes Bs. — el asiento debe estar balanceado');
      const lineasV = lineas.filter(l=>l.cuentaId&&(Number(l.debeBs)>0||Number(l.haberBs)>0));
      if (lineasV.length < 2) return alert('Se requieren al menos 2 líneas');
      setBusy(true);
      try {
        const yyyymm = form.fecha.substring(0,7).replace('-','');
        const mesLabel = form.fecha.substring(5,7)+'/'+form.fecha.substring(0,4);
        const numManuales = asientos.filter(a=>a.modulo==='Manual'&&a.fecha?.startsWith(form.fecha.substring(0,7))).length+1;
        const numero = `CD-${yyyymm}-${String(numManuales).padStart(4,'0')}`;
        const id = gid();
        const lineasFinal = lineasV.map(l=>({
          ...l,
          codigo:l.codigo, cuenta:l.cuenta,
          tipoLinea: Number(l.debeBs)>0?'D':'H',
          nroDoc: form.referencia,
          concepto: form.descripcion.toUpperCase(),
          tasa: tasaNum,
          debeBs:Number(l.debeBs||0), haberBs:Number(l.haberBs||0),
          debeUSD:Number(l.debeUSD||0), haberUSD:Number(l.haberUSD||0),
        }));
        await setDoc(dref('cont_asientos',id),{
          id, comprobante:numero, numero,
          mes:mesLabel, fecha:form.fecha, tipo:form.tipo,
          nroDocumento:form.referencia, descripcion:form.descripcion.toUpperCase(),
          tasa:tasaNum, niif:form.niif, efectivo:form.efectivo,
          modulo:'Manual',
          lineas:lineasFinal,
          totalDebeBs:totDebeBs, totalHaberBs:totHaberBs,
          totalDebeUSD:totDebeUSD, totalHaberUSD:totHaberUSD,
          ts:serverTimestamp()
        });
        setForm({fecha:today(),descripcion:'',tipo:'Manual',referencia:'',tasa:'',niif:false,efectivo:false,modulo:'Manual'});
        setLineas([{cuentaId:'',codigo:'',cuenta:'',debeBs:'',haberBs:'',debeUSD:'',haberUSD:''},{cuentaId:'',codigo:'',cuenta:'',debeBs:'',haberBs:'',debeUSD:'',haberUSD:''}]);
        setSec('libro');
      } finally { setBusy(false); }
    };

    return (
      <div>
        <Card title="Nuevo Comprobante de Diario">
          {/* Encabezado del comprobante — estilo imagen del sistema */}
          <div className="rounded-2xl border-2 border-slate-200 overflow-hidden mb-6">
            <div className="px-5 py-3 flex items-center gap-3" style={{background:'linear-gradient(135deg,#0f172a,#1e293b)'}}>
              <FileText size={16} className="text-blue-400"/>
              <p className="font-black text-white text-sm uppercase tracking-widest">Comprobante Contable</p>
              <Badge v="blue">{form.tipo}</Badge>
            </div>
            <div className="p-5 grid grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-50">
              <FG label="Tipo"><select className={sel} value={form.tipo} onChange={e=>setForm({...form,tipo:e.target.value})}>
                <option>Manual</option><option>Apertura</option><option>Cierre</option><option>Ajuste</option><option>Nómina</option><option>Diferencia Cambiaria</option>
              </select></FG>
              <FG label="Fecha"><input type="date" className={inp} value={form.fecha} onChange={e=>setForm({...form,fecha:e.target.value})}/></FG>
              <FG label="Nro. Documento / Ref."><input className={inp} value={form.referencia} onChange={e=>setForm({...form,referencia:e.target.value})} placeholder="OC-001 / FACT-001"/></FG>
              <FG label="Tasa de Cambio (Bs/$)"><input type="number" step="0.01" className={inp} value={form.tasa} onChange={e=>setForm({...form,tasa:e.target.value})} placeholder="39.50"/></FG>
              <FG label="Descripción / Concepto" full><input className={inp} value={form.descripcion} onChange={e=>setForm({...form,descripcion:e.target.value})} placeholder="Descripción del comprobante..."/></FG>
              <FG label="Opciones">
                <div className="flex gap-4 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.niif} onChange={e=>setForm({...form,niif:e.target.checked})} className="accent-blue-500 w-4 h-4"/>
                    <span className="text-xs font-black uppercase text-slate-600">NIIF</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.efectivo} onChange={e=>setForm({...form,efectivo:e.target.checked})} className="accent-emerald-500 w-4 h-4"/>
                    <span className="text-xs font-black uppercase text-slate-600">Efectivo</span>
                  </label>
                </div>
              </FG>
            </div>
          </div>

          {/* Líneas del asiento — con Bs y USD */}
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-black uppercase text-slate-700 tracking-wide">Líneas Contables — Partida Doble (Bs. y USD)</h4>
            <button onClick={()=>setLineas([...lineas,{cuentaId:'',codigo:'',cuenta:'',debeBs:'',haberBs:'',debeUSD:'',haberUSD:''}])} className="text-[10px] font-black uppercase text-blue-500 flex items-center gap-1 hover:bg-blue-50 px-2 py-1 rounded-lg"><Plus size={12}/> Línea</button>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden mb-5">
            {/* Cabecera */}
            <div className="grid gap-0 bg-slate-800 px-3 py-2.5 text-[9px] font-black uppercase tracking-widest" style={{gridTemplateColumns:'2.5fr 1fr 1fr 1fr 1fr 28px'}}>
              <div className="text-slate-400">Cuenta Contable</div>
              <div className="text-emerald-400 text-right">Debe Bs.</div>
              <div className="text-red-400 text-right">Haber Bs.</div>
              <div className="text-emerald-300 text-right">Debe USD</div>
              <div className="text-red-300 text-right">Haber USD</div>
              <div></div>
            </div>

            {lineas.map((l, i) => (
              <div key={i} className="grid gap-2 px-3 py-2 border-b border-slate-100 items-center" style={{gridTemplateColumns:'2.5fr 1fr 1fr 1fr 1fr 28px'}}>
                <select className={`${sel} text-[11px]`} value={l.cuentaId} onChange={e=>setCuenta(i,e.target.value)}>
                  <option value="">— Seleccione cuenta —</option>
                  {[...cuentas].sort((a,b)=>String(a.codigo).localeCompare(String(b.codigo))).map(c=><option key={c.id} value={c.id}>{c.codigo} · {c.nombre}</option>)}
                </select>
                <input type="number" step="0.01" className={`${inp} text-right font-black text-emerald-700`} value={l.debeBs} onChange={e=>setDebeBs(i,e.target.value)} placeholder="0.00"/>
                <input type="number" step="0.01" className={`${inp} text-right font-black text-red-600`} value={l.haberBs} onChange={e=>setHaberBs(i,e.target.value)} placeholder="0.00"/>
                <input type="number" step="0.01" className={`${inp} text-right text-emerald-600`} value={l.debeUSD} onChange={e=>setDebeUSD(i,e.target.value)} placeholder="0.00"/>
                <input type="number" step="0.01" className={`${inp} text-right text-red-500`} value={l.haberUSD} onChange={e=>setHaberUSD(i,e.target.value)} placeholder="0.00"/>
                <button onClick={()=>{const n=[...lineas];n.splice(i,1);setLineas(n);}} className="p-1 text-red-400 hover:text-red-600 flex justify-center"><Trash2 size={12}/></button>
              </div>
            ))}

            {/* Totales */}
            <div className="grid gap-2 px-3 py-3 items-center bg-slate-900" style={{gridTemplateColumns:'2.5fr 1fr 1fr 1fr 1fr 28px'}}>
              <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest">TOTALES</div>
              <div className={`text-right font-mono font-black text-sm ${balOkBs?'text-emerald-400':'text-white'}`}>Bs.{fmt(totDebeBs)}</div>
              <div className={`text-right font-mono font-black text-sm ${balOkBs?'text-emerald-400':'text-white'}`}>Bs.{fmt(totHaberBs)}</div>
              <div className={`text-right font-mono font-black text-sm ${balOkUSD?'text-emerald-400':'text-slate-400'}`}>${fmt(totDebeUSD)}</div>
              <div className={`text-right font-mono font-black text-sm ${balOkUSD?'text-emerald-400':'text-slate-400'}`}>${fmt(totHaberUSD)}</div>
              <div className="flex justify-center">{balOk?<CheckCircle size={16} className="text-emerald-400"/>:<X size={16} className="text-red-400"/>}</div>
            </div>
          </div>

          {/* Estado de balance */}
          {!balOkBs && totDebeBs>0 && <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 flex items-center gap-2"><AlertTriangle size={14} className="text-amber-600"/><p className="text-[10px] font-black text-amber-700 uppercase">Diferencia Bs.: {fmt(Math.abs(totDebeBs-totHaberBs))} — Debe estar en cero para registrar.</p></div>}
          {balOk && <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 mb-4 flex items-center gap-2"><CheckCircle size={14} className="text-emerald-600"/><p className="text-[10px] font-black text-emerald-700 uppercase">Partida doble balanceada en Bs. y USD ✓</p></div>}

          <div className="flex justify-end gap-3">
            <Bo onClick={()=>setSec('libro')}>Cancelar</Bo>
            <Bg onClick={save} disabled={busy||!balOkBs}>{busy?'Registrando...':'Registrar Comprobante'}</Bg>
          </div>
        </Card>
      </div>
    );
  };

  const navGroups = [
    { group:'Analítica', color:'#f97316', items:[{id:'dashboard',label:'Resumen Contable',icon:LayoutDashboard}] },
    { group:'Libro Diario', color:'#3b82f6', items:[{id:'libro',label:'Ver Libro Diario',icon:BookMarked},{id:'nuevo',label:'Nuevo Comprobante',icon:Plus}] },
  ];
  const views = { dashboard:<DashboardView/>, libro:<LibroDiarioView/>, nuevo:<NuevoAsientoView/> };
  const curNav = navGroups.flatMap(g=>g.items).find(n=>n.id===sec);

  return (
    <SidebarLayout brand="Supply G&B" brandSub="Libro Diario" navGroups={navGroups} activeId={sec} onNav={setSec} onBack={onBack} accentColor={BLUE}
      headerContent={<>
        <div><h1 className="font-black text-slate-800 text-sm uppercase tracking-wide">{curNav?.label}</h1><p className="text-[9px] text-slate-400 font-medium uppercase tracking-widest">Contabilidad <ChevronRight size={8} className="inline"/> Libro Diario</p></div>
        <div className="flex gap-2">
          <Bg onClick={()=>setSec('nuevo')} sm><Plus size={12}/> Comprobante</Bg>
        </div>
      </>}>
      {views[sec]}
    </SidebarLayout>
  );
}

// ============================================================================
// ESTADOS FINANCIEROS — Balance, Resultados, Comprobación, Mayor
// ============================================================================
function BalancesApp({ fbUser, onBack }) {
  const [sec, setSec] = useState('comprobacion');
  const [cuentas,   setCuentas]   = useState([]);
  const [asientos,  setAsientos]  = useState([]);
  const [periodos,  setPeriodos]  = useState([]); // períodos cerrados

  useEffect(()=>{
    if(!fbUser) return;
    const subs=[
      onSnapshot(col('cont_cuentas'), s=>setCuentas(s.docs.map(d=>d.data()))),
      onSnapshot(query(col('cont_asientos'), orderBy('fecha','desc')), s=>setAsientos(s.docs.map(d=>d.data()))),
      onSnapshot(col('cont_periodos'), s=>setPeriodos(s.docs.map(d=>d.data()))),
    ];
    return()=>subs.forEach(u=>u());
  },[fbUser]);

  const tasaActiva = 39.50; // fallback

  // Helpers
  const getDebeBs  = l=>Number(l.debeBs ??l.debito ??0);
  const getHaberBs = l=>Number(l.haberBs??l.credito??0);
  const getDebeUSD = l=>Number(l.debeUSD ??0);
  const getHaberUSD= l=>Number(l.haberUSD??0);

  // Calcular saldo de una cuenta a partir de sus asientos
  const saldoCuenta = (codigo, hastaFecha) => {
    let dBs=0,hBs=0,dUSD=0,hUSD=0;
    asientos.filter(a=>!hastaFecha||a.fecha<=hastaFecha).forEach(a=>{
      (a.lineas||[]).forEach(l=>{
        if((l.codigo||l.cuentaCodigo||'').startsWith(codigo)){
          dBs+=getDebeBs(l); hBs+=getHaberBs(l);
          dUSD+=getDebeUSD(l); hUSD+=getHaberUSD(l);
        }
      });
    });
    return {dBs,hBs,saldoBs:dBs-hBs,dUSD,hUSD,saldoUSD:dUSD-hUSD};
  };

  const grupoMap={'1':'ACTIVOS','2':'PASIVOS','3':'PATRIMONIO','4':'INGRESOS','5':'COSTOS','6':'GASTOS'};

  // ── BALANCE DE COMPROBACIÓN ──────────────────────────────────────────────
  const ComprobacionView = () => {
    const [hasta, setHasta] = useState(today());
    const [soloConMov, setSoloConMov] = useState(true);

    const filas = [...cuentas]
      .sort((a,b)=>String(a.codigo).localeCompare(String(b.codigo)))
      .map(c=>({...c, ...saldoCuenta(c.codigo, hasta)}))
      .filter(c=>!soloConMov||(Math.abs(c.saldoBs)>0.001||Math.abs(c.saldoUSD)>0.001));

    const totDeBs = filas.reduce((a,c)=>a+c.dBs,0);
    const totHaBs = filas.reduce((a,c)=>a+c.hBs,0);
    const totDeUSD= filas.reduce((a,c)=>a+c.dUSD,0);
    const totHaUSD= filas.reduce((a,c)=>a+c.hUSD,0);

    const exportar=()=>{
      let h=`<html><head><meta charset="utf-8"><style>body{font-size:10px;font-family:Arial}th{background:#1e3a5f;color:#fff;border:1px solid #ccc;padding:4px 8px}td{border:1px solid #e2e8f0;padding:3px 8px}tr:nth-child(even) td{background:#f8fafc}</style></head><body>
      <p style="font-size:13px;font-weight:bold">Balance de Comprobación — Servicios Jiret G&B, C.A.</p>
      <p style="font-size:10px;color:#666">Al ${dd(hasta)} · ${filas.length} cuentas</p>
      <table><thead><tr><th>Código</th><th>Cuenta</th><th>Grupo</th><th>Debe Bs</th><th>Haber Bs</th><th>Saldo Bs</th><th>Debe USD</th><th>Haber USD</th><th>Saldo USD</th></tr></thead><tbody>`;
      filas.forEach(c=>{h+=`<tr><td style="font-family:monospace;color:#1e40af;font-weight:bold">${c.codigo}</td><td>${c.nombre}</td><td>${grupoMap[String(c.codigo).charAt(0)]||''}</td><td style="text-align:right">${c.dBs>0?fmt(c.dBs):''}</td><td style="text-align:right">${c.hBs>0?fmt(c.hBs):''}</td><td style="text-align:right;font-weight:bold;${c.saldoBs>=0?'color:#16a34a':'color:#dc2626'}">${fmt(c.saldoBs)}</td><td style="text-align:right">${c.dUSD>0?fmt(c.dUSD):''}</td><td style="text-align:right">${c.hUSD>0?fmt(c.hUSD):''}</td><td style="text-align:right;font-weight:bold">${fmt(c.saldoUSD)}</td></tr>`;});
      h+=`<tr style="background:#0f172a"><td colspan="3" style="color:#94a3b8;font-weight:bold;padding:6px 8px">TOTALES</td><td style="text-align:right;color:#4ade80;font-weight:bold">Bs.${fmt(totDeBs)}</td><td style="text-align:right;color:#f87171;font-weight:bold">Bs.${fmt(totHaBs)}</td><td></td><td style="text-align:right;color:#4ade80;font-weight:bold">$${fmt(totDeUSD)}</td><td style="text-align:right;color:#f87171;font-weight:bold">$${fmt(totHaUSD)}</td><td></td></tr>`;
      h+=`</tbody></table></body></html>`;
      const blob=new Blob([h],{type:'application/vnd.ms-excel;charset=utf-8'});
      const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`balance_comprobacion_${hasta}.xls`;a.click();URL.revokeObjectURL(url);
    };

    return (
      <Card title="Balance de Comprobación" subtitle="Saldos acumulados por cuenta contable"
        action={<div className="flex gap-2 items-center">
          <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase cursor-pointer"><input type="checkbox" checked={soloConMov} onChange={e=>setSoloConMov(e.target.checked)} className="accent-blue-500"/>Solo con movimiento</label>
          <FG label=""><input type="date" className={inp} value={hasta} onChange={e=>setHasta(e.target.value)}/></FG>
          <button onClick={exportar} className="flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white rounded-xl text-[10px] font-black uppercase hover:bg-green-700"><Download size={12}/> Excel</button>
        </div>}>
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead><tr style={{background:'#0f172a'}}>
              {['Código','Cuenta de movimiento','Grupo','Debe Bs','Haber Bs','Saldo Bs','Debe USD','Haber USD','Saldo USD'].map(h=>(
                <th key={h} className="px-3 py-2.5 font-black uppercase tracking-wide text-left whitespace-nowrap text-[9px]" style={{color:'#94a3b8'}}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {filas.length===0&&<tr><td colSpan={9}><EmptyState icon={Scale} title="Sin movimientos" desc="Registre asientos para ver el balance"/></td></tr>}
              {filas.map((c,i)=>(
                <tr key={c.id} className="hover:bg-blue-50/30 border-b border-slate-50">
                  <td className="px-3 py-2 font-mono font-black text-blue-600">{c.codigo}</td>
                  <td className="px-3 py-2 font-medium text-slate-800 max-w-[200px] truncate">{c.nombre}</td>
                  <td className="px-3 py-2 text-[10px] text-slate-500 uppercase">{grupoMap[String(c.codigo).charAt(0)]||'—'}</td>
                  <td className="px-3 py-2 font-mono text-emerald-600 text-right">{c.dBs>0?`Bs.${fmt(c.dBs)}`:''}</td>
                  <td className="px-3 py-2 font-mono text-red-500 text-right">{c.hBs>0?`Bs.${fmt(c.hBs)}`:''}</td>
                  <td className={`px-3 py-2 font-mono font-black text-right ${c.saldoBs>=0?'text-emerald-700':'text-red-600'}`}>Bs.{fmt(c.saldoBs)}</td>
                  <td className="px-3 py-2 font-mono text-emerald-600 text-right">{c.dUSD>0?`$${fmt(c.dUSD)}`:''}</td>
                  <td className="px-3 py-2 font-mono text-red-500 text-right">{c.hUSD>0?`$${fmt(c.hUSD)}`:''}</td>
                  <td className={`px-3 py-2 font-mono font-black text-right ${c.saldoUSD>=0?'text-emerald-700':'text-red-600'}`}>${fmt(c.saldoUSD)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot><tr style={{background:'#0f172a'}}>
              <td colSpan={3} className="px-3 py-3 text-[10px] font-black text-slate-400 uppercase">TOTALES</td>
              <td className="px-3 py-3 font-mono font-black text-emerald-400 text-right">Bs.{fmt(totDeBs)}</td>
              <td className="px-3 py-3 font-mono font-black text-red-400 text-right">Bs.{fmt(totHaBs)}</td>
              <td className="px-3 py-3 font-mono font-black text-white text-right">Bs.{fmt(totDeBs-totHaBs)}</td>
              <td className="px-3 py-3 font-mono font-black text-emerald-400 text-right">${fmt(totDeUSD)}</td>
              <td className="px-3 py-3 font-mono font-black text-red-400 text-right">${fmt(totHaUSD)}</td>
              <td className="px-3 py-3 font-mono font-black text-white text-right">${fmt(totDeUSD-totHaUSD)}</td>
            </tr></tfoot>
          </table>
        </div>
      </Card>
    );
  };

  // ── BALANCE GENERAL ──────────────────────────────────────────────────────
  const BalanceGeneralView = () => {
    const [hasta, setHasta] = useState(today());
    const activos   = cuentas.filter(c=>String(c.codigo).startsWith('1')).map(c=>({...c,...saldoCuenta(c.codigo,hasta)}));
    const pasivos   = cuentas.filter(c=>String(c.codigo).startsWith('2')).map(c=>({...c,...saldoCuenta(c.codigo,hasta)}));
    const patrimonio= cuentas.filter(c=>String(c.codigo).startsWith('3')).map(c=>({...c,...saldoCuenta(c.codigo,hasta)}));

    const totActBs  = activos.reduce((a,c)=>a+c.saldoBs,0);
    const totPasBs  = pasivos.reduce((a,c)=>a+Math.abs(c.saldoBs),0);
    const totPatBs  = patrimonio.reduce((a,c)=>a+Math.abs(c.saldoBs),0);
    const totActUSD = activos.reduce((a,c)=>a+c.saldoUSD,0);

    const SeccionBG = ({titulo, items, colorBorder, totalBs, totalUSD})=>(
      <div className="mb-5">
        <div className="flex items-center justify-between px-5 py-3 rounded-xl mb-2" style={{background:`${colorBorder}15`,border:`1.5px solid ${colorBorder}40`}}>
          <p className="font-black text-sm uppercase tracking-wide" style={{color:colorBorder}}>{titulo}</p>
          <div className="text-right"><p className="font-mono font-black" style={{color:colorBorder}}>Bs. {fmt(Math.abs(totalBs))}</p><p className="text-[10px] text-slate-400">${fmt(Math.abs(totalUSD))}</p></div>
        </div>
        {items.filter(c=>Math.abs(c.saldoBs)>0.001).map(c=>(
          <div key={c.id} className="flex justify-between py-1.5 px-5 text-xs hover:bg-slate-50 rounded">
            <div className="flex items-center gap-2"><span className="font-mono text-blue-500 text-[10px]">{c.codigo}</span><span className="text-slate-700">{c.nombre}</span></div>
            <div className="text-right"><span className="font-mono font-black text-slate-900">Bs. {fmt(Math.abs(c.saldoBs))}</span><span className="text-slate-400 ml-3">${fmt(Math.abs(c.saldoUSD))}</span></div>
          </div>
        ))}
      </div>
    );

    return (
      <Card title="Balance General" subtitle={`Al ${dd(hasta)}`} action={<input type="date" className={inp} value={hasta} onChange={e=>setHasta(e.target.value)} style={{width:'140px'}}/>}>
        <div className="grid lg:grid-cols-2 gap-8">
          <div>
            <SeccionBG titulo="ACTIVOS" items={activos} colorBorder="#10b981" totalBs={totActBs} totalUSD={totActUSD}/>
          </div>
          <div>
            <SeccionBG titulo="PASIVOS" items={pasivos} colorBorder="#ef4444" totalBs={totPasBs} totalUSD={pasivos.reduce((a,c)=>a+Math.abs(c.saldoUSD),0)}/>
            <SeccionBG titulo="PATRIMONIO" items={patrimonio} colorBorder="#8b5cf6" totalBs={totPatBs} totalUSD={patrimonio.reduce((a,c)=>a+Math.abs(c.saldoUSD),0)}/>
            <div className="flex items-center justify-between px-5 py-4 rounded-xl mt-3" style={{background:'#0f172a'}}>
              <p className="font-black text-white uppercase tracking-wide">PASIVO + PATRIMONIO</p>
              <div className="text-right"><p className="font-mono font-black text-orange-400">Bs. {fmt(totPasBs+totPatBs)}</p><p className="text-[10px] text-slate-400">${fmt(pasivos.reduce((a,c)=>a+Math.abs(c.saldoUSD),0)+patrimonio.reduce((a,c)=>a+Math.abs(c.saldoUSD),0))}</p></div>
            </div>
          </div>
        </div>
      </Card>
    );
  };

  // ── ESTADO DE RESULTADOS ─────────────────────────────────────────────────
  const EstadoResultadosView = () => {
    const [desde, setDesde] = useState(mesActual()+'-01');
    const [hasta, setHasta] = useState(today());
    const ingresos = cuentas.filter(c=>String(c.codigo).startsWith('4')).map(c=>({...c,...saldoCuenta(c.codigo,hasta)})).filter(c=>Math.abs(c.saldoBs)>0.001);
    const costos   = cuentas.filter(c=>String(c.codigo).startsWith('5')).map(c=>({...c,...saldoCuenta(c.codigo,hasta)})).filter(c=>Math.abs(c.saldoBs)>0.001);
    const gastos   = cuentas.filter(c=>String(c.codigo).startsWith('6')).map(c=>({...c,...saldoCuenta(c.codigo,hasta)})).filter(c=>Math.abs(c.saldoBs)>0.001);
    const totIngBs = ingresos.reduce((a,c)=>a+Math.abs(c.saldoBs),0);
    const totCosBs = costos.reduce((a,c)=>a+Math.abs(c.saldoBs),0);
    const totGasBs = gastos.reduce((a,c)=>a+Math.abs(c.saldoBs),0);
    const utilBrBs = totIngBs - totCosBs;
    const utilNeBs = totIngBs - totCosBs - totGasBs;
    const totIngUSD= ingresos.reduce((a,c)=>a+Math.abs(c.saldoUSD),0);
    const utilNeUSD= totIngUSD - costos.reduce((a,c)=>a+Math.abs(c.saldoUSD),0) - gastos.reduce((a,c)=>a+Math.abs(c.saldoUSD),0);

    const SecER=({titulo,items,totalBs,totalUSD,color})=>(
      <div className="mb-4">
        <div className="flex justify-between px-4 py-2 rounded-lg mb-1" style={{background:color+'15'}}>
          <p className="font-black text-xs uppercase tracking-wide" style={{color}}>{titulo}</p>
          <div className="text-right"><span className="font-mono font-black text-xs" style={{color}}>Bs.{fmt(Math.abs(totalBs))}</span><span className="text-slate-400 text-[10px] ml-2">${fmt(Math.abs(totalUSD))}</span></div>
        </div>
        {items.map(c=><div key={c.id} className="flex justify-between py-1 px-6 text-xs hover:bg-slate-50 rounded">
          <span className="text-slate-600">{c.nombre}</span>
          <div><span className="font-mono text-slate-800">Bs.{fmt(Math.abs(c.saldoBs))}</span><span className="text-slate-400 ml-2">${fmt(Math.abs(c.saldoUSD))}</span></div>
        </div>)}
      </div>
    );

    return (
      <Card title="Estado de Resultados (Ganancias y Pérdidas)" action={<div className="flex gap-2"><input type="date" className={inp} style={{width:'130px'}} value={desde} onChange={e=>setDesde(e.target.value)}/><input type="date" className={inp} style={{width:'130px'}} value={hasta} onChange={e=>setHasta(e.target.value)}/></div>}>
        <div className="max-w-2xl mx-auto space-y-2">
          <SecER titulo="INGRESOS" items={ingresos} totalBs={totIngBs} totalUSD={totIngUSD} color="#10b981"/>
          <SecER titulo="COSTOS DE VENTAS" items={costos} totalBs={totCosBs} totalUSD={costos.reduce((a,c)=>a+Math.abs(c.saldoUSD),0)} color="#f59e0b"/>
          <div className="flex justify-between px-4 py-3 rounded-xl border-2 border-blue-200 bg-blue-50">
            <p className="font-black text-blue-800 uppercase text-xs">UTILIDAD BRUTA</p>
            <div><span className={`font-mono font-black ${utilBrBs>=0?'text-emerald-700':'text-red-600'}`}>Bs.{fmt(utilBrBs)}</span></div>
          </div>
          <SecER titulo="GASTOS OPERATIVOS" items={gastos} totalBs={totGasBs} totalUSD={gastos.reduce((a,c)=>a+Math.abs(c.saldoUSD),0)} color="#ef4444"/>
          <div className="flex justify-between px-4 py-4 rounded-xl" style={{background:'#0f172a'}}>
            <p className="font-black text-white uppercase tracking-wide">UTILIDAD / PÉRDIDA NETA</p>
            <div className="text-right"><p className={`font-mono font-black text-xl ${utilNeBs>=0?'text-emerald-400':'text-red-400'}`}>Bs.{fmt(utilNeBs)}</p><p className="text-slate-400 text-[10px]">${fmt(utilNeUSD)}</p></div>
          </div>
        </div>
      </Card>
    );
  };

  // ── MAYOR ANALÍTICO ───────────────────────────────────────────────────────
  const MayorAnaliticoView = () => {
    const [cuentaId, setCuentaId] = useState('');
    const [desde, setDesde]       = useState(mesActual()+'-01');
    const [hasta, setHasta]       = useState(today());
    const cuentaSel = cuentas.find(c=>c.id===cuentaId);

    const movsCuenta = [];
    let saldoBsAcum=0, saldoUSDacum=0;
    if(cuentaSel){
      [...asientos].sort((a,b)=>a.fecha?.localeCompare(b.fecha)||0)
        .filter(a=>a.fecha>=desde&&a.fecha<=hasta)
        .forEach(a=>{
          (a.lineas||[]).filter(l=>(l.codigo||l.cuentaCodigo||'').startsWith(cuentaSel.codigo)).forEach(l=>{
            const dBs=Number(l.debeBs??l.debito??0), hBs=Number(l.haberBs??l.credito??0);
            const dUSD=Number(l.debeUSD??0), hUSD=Number(l.haberUSD??0);
            saldoBsAcum+=dBs-hBs; saldoUSDacum+=dUSD-hUSD;
            movsCuenta.push({fecha:a.fecha,comprobante:a.comprobante||a.numero,concepto:l.concepto||a.descripcion,nroDoc:l.nroDoc||a.nroDocumento||'',dBs,hBs,saldoBs:saldoBsAcum,dUSD,hUSD,saldoUSD:saldoUSDacum});
          });
        });
    }

    return (
      <Card title="Mayor Analítico" subtitle="Movimientos y saldo de cuenta">
        <div className="grid grid-cols-4 gap-4 mb-6">
          <FG label="Cuenta Contable" full>
            <select className={sel} value={cuentaId} onChange={e=>setCuentaId(e.target.value)}>
              <option value="">— Seleccione cuenta —</option>
              {[...cuentas].sort((a,b)=>String(a.codigo).localeCompare(String(b.codigo))).map(c=><option key={c.id} value={c.id}>{c.codigo} · {c.nombre}</option>)}
            </select>
          </FG>
          <FG label="Desde"><input type="date" className={inp} value={desde} onChange={e=>setDesde(e.target.value)}/></FG>
          <FG label="Hasta"><input type="date" className={inp} value={hasta} onChange={e=>setHasta(e.target.value)}/></FG>
        </div>
        {cuentaSel ? (
          <div>
            <div className="flex items-center gap-4 p-4 rounded-2xl mb-5" style={{background:'linear-gradient(135deg,#0f172a,#1e293b)'}}>
              <div><p className="text-[9px] font-black text-slate-400 uppercase mb-0.5">{cuentaSel.codigo}</p><p className="font-black text-white">{cuentaSel.nombre}</p></div>
              <div className="ml-auto text-right"><p className="text-emerald-400 font-mono font-black text-xl">Bs.{fmt(saldoBsAcum)}</p><p className="text-slate-400 text-xs">${fmt(saldoUSDacum)}</p></div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[11px]">
                <thead><tr style={{background:'#1e293b'}}>
                  {['Fecha','Comprobante','Concepto','Nro Doc.','Debe Bs','Haber Bs','Saldo Bs','Debe USD','Haber USD','Saldo USD'].map(h=><th key={h} className="px-3 py-2 text-left text-[9px] font-black uppercase text-slate-400 whitespace-nowrap">{h}</th>)}
                </tr></thead>
                <tbody>
                  {movsCuenta.length===0&&<tr><td colSpan={10}><EmptyState icon={BookOpen} title="Sin movimientos" desc="No hay movimientos en el período"/></td></tr>}
                  {movsCuenta.map((m,i)=><tr key={i} className="hover:bg-slate-50 border-b border-slate-50">
                    <td className="px-3 py-2 text-slate-500 whitespace-nowrap">{dd(m.fecha)}</td>
                    <td className="px-3 py-2 font-mono font-black text-blue-600">{m.comprobante}</td>
                    <td className="px-3 py-2 text-slate-700 max-w-[180px] truncate">{m.concepto}</td>
                    <td className="px-3 py-2 font-mono text-slate-400">{m.nroDoc}</td>
                    <td className="px-3 py-2 font-mono text-emerald-600 text-right">{m.dBs>0?`Bs.${fmt(m.dBs)}`:''}</td>
                    <td className="px-3 py-2 font-mono text-red-500 text-right">{m.hBs>0?`Bs.${fmt(m.hBs)}`:''}</td>
                    <td className={`px-3 py-2 font-mono font-black text-right ${m.saldoBs>=0?'text-emerald-700':'text-red-600'}`}>Bs.{fmt(m.saldoBs)}</td>
                    <td className="px-3 py-2 font-mono text-emerald-600 text-right">{m.dUSD>0?`$${fmt(m.dUSD)}`:''}</td>
                    <td className="px-3 py-2 font-mono text-red-500 text-right">{m.hUSD>0?`$${fmt(m.hUSD)}`:''}</td>
                    <td className={`px-3 py-2 font-mono font-black text-right ${m.saldoUSD>=0?'text-emerald-700':'text-red-600'}`}>${fmt(m.saldoUSD)}</td>
                  </tr>)}
                </tbody>
              </table>
            </div>
          </div>
        ):<EmptyState icon={BookOpen} title="Seleccione una cuenta" desc="Elija una cuenta contable para ver su mayor analítico"/>}
      </Card>
    );
  };

  // ── CIERRE CONTABLE ───────────────────────────────────────────────────────
  const CierreContableView = () => {
    const [mes, setMes]   = useState(mesActual());
    const [busy, setBusy] = useState(false);

    const cerrar = async () => {
      if(!window.confirm(`¿Cerrar el período ${mes}? Los asientos de este período quedarán BLOQUEADOS de forma permanente.`)) return;
      setBusy(true);
      try {
        const id = mes.replace('-','');
        const cntMes = asientos.filter(a=>a.fecha?.startsWith(mes)).length;
        await setDoc(dref('cont_periodos',id),{id,mes,fechaCierre:today(),asientosBloqueados:cntMes,ts:serverTimestamp()});
        // Marcar asientos del mes como cerrados
        const batch=writeBatch(db);
        asientos.filter(a=>a.fecha?.startsWith(mes)).forEach(a=>batch.update(dref('cont_asientos',a.id),{periodoCerrado:true,periodoId:id}));
        await batch.commit();
        alert(`✅ Período ${mes} cerrado. ${cntMes} asientos bloqueados.`);
      } finally { setBusy(false); }
    };

    return (
      <div className="space-y-5">
        <div className="grid grid-cols-3 gap-4">
          <KPI label="Períodos Cerrados" value={periodos.length} accent="blue" Icon={CheckCircle}/>
          <KPI label="Asientos Bloqueados" value={periodos.reduce((a,p)=>a+(p.asientosBloqueados||0),0)} accent="red" Icon={Lock}/>
          <KPI label="Último Cierre" value={periodos[0]?.mes||'—'} accent="green" Icon={CalendarDays}/>
        </div>
        <Card title="Cierre de Período Mensual" subtitle="Bloquea todos los asientos del mes seleccionado">
          <div className="max-w-md space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
              <AlertTriangle size={16} className="text-amber-600 flex-shrink-0 mt-0.5"/>
              <p className="text-[11px] text-amber-700 font-medium leading-relaxed">El cierre de período es <strong>IRREVERSIBLE</strong>. Los asientos marcados no podrán ser modificados ni eliminados. Solo realice el cierre cuando haya verificado todos los asientos del período.</p>
            </div>
            <FG label="Período a Cerrar (Mes)">
              <input type="month" className={inp} value={mes} onChange={e=>setMes(e.target.value)}/>
            </FG>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <p className="text-xs text-slate-500 font-medium">Asientos del período <strong className="text-slate-800">{mes}</strong>: <strong className="text-blue-600">{asientos.filter(a=>a.fecha?.startsWith(mes)).length}</strong></p>
            </div>
            <Bg onClick={cerrar} disabled={busy||periodos.find(p=>p.mes===mes)} >
              {periodos.find(p=>p.mes===mes)?<><Lock size={14}/> Ya cerrado</>:busy?<><RefreshCw size={14} className="animate-spin"/> Cerrando...</>:<><CheckCircle size={14}/> Cerrar Período {mes}</>}
            </Bg>
          </div>
        </Card>
        <Card title="Historial de Cierres">
          {periodos.length===0?<EmptyState icon={CalendarDays} title="Sin cierres" desc="No se han cerrado períodos"/>:
            <table className="w-full"><thead><tr><Th>Período</Th><Th>Fecha de Cierre</Th><Th right>Asientos Bloqueados</Th><Th>Estado</Th></tr></thead>
              <tbody>{periodos.map(p=><tr key={p.id} className="hover:bg-slate-50"><Td mono className="font-black text-blue-600">{p.mes}</Td><Td>{dd(p.fechaCierre)}</Td><Td right mono className="font-black">{p.asientosBloqueados}</Td><Td><Badge v="red"><Lock size={10}/> Cerrado</Badge></Td></tr>)}</tbody>
            </table>}
        </Card>
      </div>
    );
  };

  const navGroups = [
    { group:'Estados Financieros', color:'#10b981', items:[
      {id:'comprobacion', label:'Balance de Comprobación', icon:Scale},
      {id:'balance',      label:'Balance General',         icon:Landmark},
      {id:'resultados',   label:'Estado de Resultados',    icon:TrendingUp},
      {id:'mayor',        label:'Mayor Analítico',          icon:BookMarked},
    ]},
    { group:'Control',  color:'#ef4444', items:[
      {id:'cierre', label:'Cierre de Período', icon:Lock},
    ]},
  ];
  const views={comprobacion:<ComprobacionView/>,balance:<BalanceGeneralView/>,resultados:<EstadoResultadosView/>,mayor:<MayorAnaliticoView/>,cierre:<CierreContableView/>};
  const curNav=navGroups.flatMap(g=>g.items).find(n=>n.id===sec);

  return (
    <SidebarLayout brand="Supply G&B" brandSub="Estados Financieros" navGroups={navGroups} activeId={sec} onNav={setSec} onBack={onBack} accentColor="#10b981"
      headerContent={<>
        <div><h1 className="font-black text-slate-800 text-sm uppercase tracking-wide">{curNav?.label}</h1><p className="text-[9px] text-slate-400 uppercase tracking-widest">Contabilidad <ChevronRight size={8} className="inline"/> Reportes</p></div>
        <div className="flex gap-2">
          <button onClick={()=>window.print()} className="flex items-center gap-1.5 px-3 py-2 border-2 border-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase hover:bg-slate-50"><Download size={12}/> Imprimir</button>
        </div>
      </>}>
      {views[sec]||<ComprobacionView/>}
    </SidebarLayout>
  );
}

// ============================================================================
// ACTIVOS FIJOS
// ============================================================================
function ActivosFijosApp({ fbUser, onBack }) {
  const [sec, setSec]     = useState('dashboard');
  const [activos, setActivos] = useState([]);
  const [bajas,   setBajas]   = useState([]);

  useEffect(()=>{
    if(!fbUser) return;
    const subs=[
      onSnapshot(col('activos_fijos'), s=>setActivos(s.docs.map(d=>d.data()))),
      onSnapshot(query(col('activos_bajas'),orderBy('fecha','desc')), s=>setBajas(s.docs.map(d=>d.data()))),
    ];
    return()=>subs.forEach(u=>u());
  },[fbUser]);

  const mesesDesde = (f) => {
    if(!f) return 0;
    const [y,m]=f.split('-').map(Number);
    const now=new Date(); return Math.max(0,(now.getFullYear()-y)*12+(now.getMonth()+1-m));
  };

  // Calcular depreciación acumulada
  const calcDeprec = (a) => {
    const meses = mesesDesde(a.fechaAdquisicion);
    const vidaMeses = Number(a.vidaUtilAnios||0)*12;
    if(vidaMeses===0) return 0;
    const depMensual = Number(a.valorCosto||0) / vidaMeses;
    return Math.min(Number(a.valorCosto||0) - Number(a.valorResidual||0), depMensual * meses);
  };

  const DashboardView = () => {
    const totalCosto   = activos.reduce((a,x)=>a+Number(x.valorCosto||0),0);
    const totalDeprec  = activos.reduce((a,x)=>a+calcDeprec(x),0);
    const totalNeto    = totalCosto - totalDeprec;
    const depMensual   = activos.reduce((a,x)=>{const v=Number(x.vidaUtilAnios||0)*12;return a+(v>0?(Number(x.valorCosto||0)-Number(x.valorResidual||0))/v:0);},0);

    return (
      <div className="space-y-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPI label="Total Activos" value={activos.length} accent="blue" Icon={Layers}/>
          <KPI label="Valor en Libros" value={`$${fmt(totalNeto)}`} accent="green" Icon={DollarSign} sub={`Costo: $${fmt(totalCosto)}`}/>
          <KPI label="Depr. Acumulada" value={`$${fmt(totalDeprec)}`} accent="red" Icon={TrendingDown}/>
          <KPI label="Depr. Mensual" value={`$${fmt(depMensual)}`} accent="gold" Icon={CalendarDays}/>
        </div>
        <Card title="Listado de Activos Fijos">
          {activos.length===0?<EmptyState icon={Layers} title="Sin activos" desc="Registre el mobiliario, maquinaria y vehículos"/>:
            <table className="w-full text-[11px]"><thead><tr><Th>Código</Th><Th>Descripción</Th><Th>Categoría</Th><Th>Fecha Adq.</Th><Th right>Costo $</Th><Th right>Depr. Acum.</Th><Th right>Valor Neto</Th><Th>Estado</Th></tr></thead>
              <tbody>{activos.map(a=>{const dep=calcDeprec(a);const neto=Number(a.valorCosto||0)-dep;return(
                <tr key={a.id} className="hover:bg-slate-50">
                  <Td mono className="font-black text-blue-600">{a.codigo}</Td>
                  <Td className="font-semibold max-w-[160px] truncate">{a.descripcion}</Td>
                  <Td className="text-[10px] uppercase text-slate-500">{a.categoria}</Td>
                  <Td>{dd(a.fechaAdquisicion)}</Td>
                  <Td right mono className="font-black">${fmt(a.valorCosto)}</Td>
                  <Td right mono className="text-red-500">${fmt(dep)}</Td>
                  <Td right mono className="font-black text-emerald-600">${fmt(neto)}</Td>
                  <Td><Badge v={neto>0?'green':'gray'}>{neto>0?'Activo':'Depreciado'}</Badge></Td>
                </tr>);})}</tbody>
            </table>}
        </Card>
      </div>
    );
  };

  const RegistroView = () => {
    const [modal,setModal]=useState(false);const [busy,setBusy]=useState(false);
    const [form,setForm]=useState({codigo:'',descripcion:'',categoria:'Mobiliario',fechaAdquisicion:today(),valorCosto:'',valorResidual:'0',vidaUtilAnios:'5',cuentaContable:''});
    const save=async()=>{
      if(!form.descripcion||!form.valorCosto)return alert('Descripción y valor requeridos');
      setBusy(true);try{const id=gid();await setDoc(dref('activos_fijos',id),{...form,id,valorCosto:Number(form.valorCosto),valorResidual:Number(form.valorResidual),vidaUtilAnios:Number(form.vidaUtilAnios),ts:serverTimestamp()});setModal(false);setForm({codigo:'',descripcion:'',categoria:'Mobiliario',fechaAdquisicion:today(),valorCosto:'',valorResidual:'0',vidaUtilAnios:'5',cuentaContable:''});}finally{setBusy(false);}
    };
    return(
      <div>
        <Card title="Registro de Activos Fijos" subtitle="Mobiliario, Maquinaria, Vehículos, Equipos" action={<Bg onClick={()=>setModal(true)} sm><Plus size={12}/> Nuevo</Bg>}>
          <table className="w-full text-[11px]"><thead><tr><Th>Código</Th><Th>Descripción</Th><Th>Categoría</Th><Th>Adquisición</Th><Th right>Costo</Th><Th right>Residual</Th><Th right>Vida Útil</Th><Th right>Dep/Mes</Th><Th></Th></tr></thead>
            <tbody>
              {activos.length===0&&<tr><td colSpan={9}><EmptyState icon={Layers} title="Sin activos" desc="Registre el primer activo fijo"/></td></tr>}
              {activos.map(a=>{const dm=(Number(a.valorCosto)-Number(a.valorResidual||0))/(Number(a.vidaUtilAnios||1)*12);return(
                <tr key={a.id} className="hover:bg-slate-50">
                  <Td mono className="font-black text-slate-700">{a.codigo||'—'}</Td>
                  <Td className="font-semibold max-w-[160px] truncate">{a.descripcion}</Td>
                  <Td className="text-[10px] uppercase text-slate-500">{a.categoria}</Td>
                  <Td>{dd(a.fechaAdquisicion)}</Td>
                  <Td right mono>${fmt(a.valorCosto)}</Td>
                  <Td right mono className="text-slate-400">${fmt(a.valorResidual||0)}</Td>
                  <Td right><span className="font-semibold">{a.vidaUtilAnios} años</span></Td>
                  <Td right mono className="font-black text-amber-600">${fmt(dm)}</Td>
                  <Td><button onClick={()=>deleteDoc(dref('activos_fijos',a.id))} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg"><Trash2 size={12}/></button></Td>
                </tr>);})}
            </tbody>
          </table>
        </Card>
        <Modal open={modal} onClose={()=>setModal(false)} title="Registrar Activo Fijo" wide footer={<><Bo onClick={()=>setModal(false)}>Cancelar</Bo><Bg onClick={save} disabled={busy}>{busy?'Guardando...':'Registrar'}</Bg></>}>
          <div className="grid grid-cols-2 gap-4">
            <FG label="Código / Serial"><input className={inp} value={form.codigo} onChange={e=>setForm({...form,codigo:e.target.value.toUpperCase()})} placeholder="AF-001"/></FG>
            <FG label="Descripción" full><input className={inp} value={form.descripcion} onChange={e=>setForm({...form,descripcion:e.target.value.toUpperCase()})} placeholder="COMPUTADORA DELL OPTIPLEX 7000"/></FG>
            <FG label="Categoría"><select className={sel} value={form.categoria} onChange={e=>setForm({...form,categoria:e.target.value})}><option>Mobiliario</option><option>Maquinaria</option><option>Vehículos</option><option>Equipos de Computación</option><option>Equipos de Oficina</option><option>Inmuebles</option><option>Otros</option></select></FG>
            <FG label="Fecha de Adquisición"><input type="date" className={inp} value={form.fechaAdquisicion} onChange={e=>setForm({...form,fechaAdquisicion:e.target.value})}/></FG>
            <FG label="Valor de Costo ($)"><input type="number" step="0.01" className={inp} value={form.valorCosto} onChange={e=>setForm({...form,valorCosto:e.target.value})}/></FG>
            <FG label="Valor Residual ($)"><input type="number" step="0.01" className={inp} value={form.valorResidual} onChange={e=>setForm({...form,valorResidual:e.target.value})}/></FG>
            <FG label="Vida Útil (años)"><input type="number" min="1" className={inp} value={form.vidaUtilAnios} onChange={e=>setForm({...form,vidaUtilAnios:e.target.value})}/></FG>
            <FG label="Cuenta Contable (PUC)"><input className={inp} value={form.cuentaContable} onChange={e=>setForm({...form,cuentaContable:e.target.value})} placeholder="1.2.01.01.001"/></FG>
          </div>
        </Modal>
      </div>
    );
  };

  const navGroups=[
    {group:'Activos',color:'#8b5cf6',items:[{id:'dashboard',label:'Panel General',icon:LayoutDashboard},{id:'registro',label:'Registro de Activos',icon:Layers}]},
  ];
  const views={dashboard:<DashboardView/>,registro:<RegistroView/>};
  const curNav=navGroups.flatMap(g=>g.items).find(n=>n.id===sec);
  return(
    <SidebarLayout brand="Supply G&B" brandSub="Activos Fijos" navGroups={navGroups} activeId={sec} onNav={setSec} onBack={onBack} accentColor="#8b5cf6"
      headerContent={<><div><h1 className="font-black text-slate-800 text-sm uppercase">{curNav?.label}</h1><p className="text-[9px] text-slate-400 uppercase tracking-widest">Activos Fijos · Depreciación</p></div><Bg onClick={()=>setSec('registro')} sm><Plus size={12}/> Nuevo Activo</Bg></>}>
      {views[sec]||<DashboardView/>}
    </SidebarLayout>
  );
}

// ============================================================================
// MÓDULO FISCAL — IVA, IGTF, RETENCIONES, LIBROS LEGALES
// ============================================================================
function FiscalApp({ fbUser, onBack }) {
  const [sec, setSec] = useState('dashboard');
  const [facturas,  setFacturas]  = useState([]);
  const [tasas,     setTasas]     = useState([]);

  useEffect(()=>{
    if(!fbUser) return;
    const subs=[
      onSnapshot(query(col('facturacion_facturas'),orderBy('fechaEmision','desc')), s=>setFacturas(s.docs.map(d=>d.data()))),
      onSnapshot(query(col('banco_tasas'),orderBy('fecha','desc')), s=>setTasas(s.docs.map(d=>d.data()))),
    ];
    return()=>subs.forEach(u=>u());
  },[fbUser]);

  const tasaActiva = tasas[0]?.tasaRef || 39.50;

  const DashboardView = () => {
    const ivaDebito  = facturas.filter(f=>f.fechaEmision?.startsWith(mesActual())).reduce((a,f)=>a+Number(f.iva||0),0);
    const ivaCredito = 0; // from purchases (extend later)
    const igtfBase   = facturas.filter(f=>f.igtf>0&&f.fechaEmision?.startsWith(mesActual())).reduce((a,f)=>a+Number(f.igtf||0),0);
    return(
      <div className="space-y-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPI label="IVA Débito (Ventas)" value={`$${fmt(ivaDebito)}`} accent="red" Icon={Receipt} sub={mesActual()}/>
          <KPI label="IVA Crédito (Compras)" value={`$${fmt(ivaCredito)}`} accent="green" Icon={Receipt}/>
          <KPI label="IVA a Pagar" value={`$${fmt(Math.max(0,ivaDebito-ivaCredito))}`} accent={ivaDebito>ivaCredito?'red':'green'} Icon={DollarSign}/>
          <KPI label="IGTF (3%)" value={`$${fmt(igtfBase)}`} accent="gold" Icon={Coins}/>
        </div>
        <div className="grid lg:grid-cols-2 gap-5">
          <Card title="Configuración de Alícuotas IVA">
            <div className="space-y-3">
              {[{tipo:'General',tasa:'16%',color:'#ef4444'},{tipo:'Reducida',tasa:'8%',color:'#f59e0b'},{tipo:'Exenta',tasa:'0%',color:'#10b981'},{tipo:'IGTF Divisas',tasa:'3%',color:'#8b5cf6'}].map(({tipo,tasa,color})=>(
                <div key={tipo} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50">
                  <div className="flex items-center gap-3"><div className="w-3 h-3 rounded-full" style={{background:color}}/><p className="font-semibold text-sm text-slate-700">{tipo}</p></div>
                  <span className="font-mono font-black text-lg" style={{color}}>{tasa}</span>
                </div>
              ))}
            </div>
          </Card>
          <Card title="Resumen del Mes">
            <div className="space-y-3 mt-2">
              {[{l:'Total Ventas del Mes',v:`$${fmt(facturas.filter(f=>f.fechaEmision?.startsWith(mesActual())).reduce((a,f)=>a+Number(f.total||0),0))}`},{l:'IVA Generado (Débito Fiscal)',v:`$${fmt(ivaDebito)}`},{l:'Base Imponible',v:`$${fmt(ivaDebito/0.16)}`}].map(({l,v})=>(
                <div key={l} className="flex justify-between py-2 border-b border-slate-50"><span className="text-xs text-slate-500">{l}</span><span className="font-mono font-black text-sm text-slate-900">{v}</span></div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    );
  };

  const LibroVentasView = () => {
    const [mes, setMes] = useState(mesActual());
    const filtradas = facturas.filter(f=>f.fechaEmision?.startsWith(mes));
    const exportarTxt=()=>{
      const lines=['Nro\tFecha\tRIF\tCliente\tNro Factura\tBase Imponible\tIVA\tTotal'];
      filtradas.forEach((f,i)=>{lines.push([i+1,dd(f.fechaEmision),f.clienteRif||'',f.clienteNombre||'',f.numero||'',fmt(f.subtotal||0),fmt(f.iva||0),fmt(f.total||0)].join('\t'));});
      const blob=new Blob([lines.join('\r\n')],{type:'text/plain;charset=utf-8'});
      const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`libro_ventas_${mes}.txt`;a.click();URL.revokeObjectURL(url);
    };
    return(
      <Card title="Libro de Ventas" subtitle={`${filtradas.length} facturas — ${mes}`}
        action={<div className="flex gap-2"><input type="month" className={inp} style={{width:'140px'}} value={mes} onChange={e=>setMes(e.target.value)}/><button onClick={exportarTxt} className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase hover:bg-blue-700"><Download size={12}/> TXT</button></div>}>
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead><tr><Th>#</Th><Th>Fecha</Th><Th>RIF</Th><Th>Cliente</Th><Th>N° Factura</Th><Th right>Base Imp.</Th><Th right>IVA 16%</Th><Th right>Total</Th></tr></thead>
            <tbody>
              {filtradas.length===0&&<tr><td colSpan={8}><EmptyState icon={Receipt} title="Sin facturas" desc="No hay facturas para el período seleccionado"/></td></tr>}
              {filtradas.map((f,i)=><tr key={f.id} className="hover:bg-slate-50">
                <Td mono>{i+1}</Td><Td>{dd(f.fechaEmision)}</Td>
                <Td mono className="text-slate-600">{f.clienteRif||'—'}</Td>
                <Td className="max-w-[140px] truncate uppercase font-medium">{f.clienteNombre}</Td>
                <Td mono className="font-black text-blue-600">{f.numero}</Td>
                <Td right mono>${fmt(f.subtotal||0)}</Td>
                <Td right mono className="text-red-500">${fmt(f.iva||0)}</Td>
                <Td right mono className="font-black">${fmt(f.total||0)}</Td>
              </tr>)}
            </tbody>
            {filtradas.length>0&&<tfoot><tr style={{background:'#0f172a'}}>
              <td colSpan={5} className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase">TOTALES — {filtradas.length} facturas</td>
              <td className="px-4 py-3 text-right font-mono font-black text-white">${fmt(filtradas.reduce((a,f)=>a+Number(f.subtotal||0),0))}</td>
              <td className="px-4 py-3 text-right font-mono font-black text-red-400">${fmt(filtradas.reduce((a,f)=>a+Number(f.iva||0),0))}</td>
              <td className="px-4 py-3 text-right font-mono font-black text-emerald-400">${fmt(filtradas.reduce((a,f)=>a+Number(f.total||0),0))}</td>
            </tr></tfoot>}
          </table>
        </div>
      </Card>
    );
  };

  const navGroups=[
    {group:'Fiscal',color:'#ef4444',items:[
      {id:'dashboard', label:'Panel Fiscal',     icon:LayoutDashboard},
      {id:'libroventas',label:'Libro de Ventas', icon:Receipt},
    ]},
  ];
  const views={dashboard:<DashboardView/>,libroventas:<LibroVentasView/>};
  const curNav=navGroups.flatMap(g=>g.items).find(n=>n.id===sec);
  return(
    <SidebarLayout brand="Supply G&B" brandSub="Fiscal & Tributario" navGroups={navGroups} activeId={sec} onNav={setSec} onBack={onBack} accentColor="#ef4444"
      headerContent={<><div><h1 className="font-black text-slate-800 text-sm uppercase">{curNav?.label}</h1><p className="text-[9px] text-slate-400 uppercase tracking-widest">IVA · IGTF · Retenciones</p></div></>}>
      {views[sec]||<DashboardView/>}
    </SidebarLayout>
  );
}

// ============================================================================
// MÓDULO COMPRAS & PROVEEDORES
// ============================================================================
function ComprasApp({ fbUser, onBack }) {
  const [sec, setSec]           = useState('dashboard');
  const [proveedores, setProvs] = useState([]);
  const [tasas, setTasas]       = useState([]);

  useEffect(()=>{
    if(!fbUser) return;
    const subs=[
      onSnapshot(col('compras_proveedores'), s=>setProvs(s.docs.map(d=>d.data()))),
      onSnapshot(query(col('banco_tasas'),orderBy('fecha','desc')), s=>setTasas(s.docs.map(d=>d.data()))),
    ];
    return()=>subs.forEach(u=>u());
  },[fbUser]);

  const tasaActiva = tasas[0]?.tasaRef || 39.50;

  const DashboardView = () => (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <KPI label="Proveedores Activos" value={proveedores.filter(p=>p.activo!==false).length} accent="green" Icon={Users}/>
        <KPI label="Total Proveedores" value={proveedores.length} accent="blue" Icon={Briefcase}/>
        <KPI label="Con Email" value={proveedores.filter(p=>p.email).length} accent="gold" Icon={Mail}/>
      </div>
      <Card title="Directorio de Proveedores" subtitle="Vista rápida">
        {proveedores.length===0?<EmptyState icon={Users} title="Sin proveedores" desc="Registre o importe proveedores"/>:
          <table className="w-full text-[11px]"><thead><tr><Th>Código</Th><Th>RIF</Th><Th>Razón Social</Th><Th>Teléfono</Th><Th>Email</Th></tr></thead>
            <tbody>{proveedores.slice(0,10).map(p=><tr key={p.id} className="hover:bg-slate-50">
              <Td mono className="text-slate-500">{p.codigo||'—'}</Td>
              <Td mono className="font-black text-slate-900">{p.rif||p['r.i.f.'||'']}</Td>
              <Td className="uppercase font-semibold max-w-[180px] truncate">{p.nombre||p.descripcion}</Td>
              <Td>{p.telefono||p.teléfonos||'—'}</Td>
              <Td className="text-slate-400 max-w-[130px] truncate">{p.email||'—'}</Td>
            </tr>)}</tbody>
          </table>}
      </Card>
    </div>
  );

  const ProveedoresView = () => {
    const [modal,setModal]       = useState(false);
    const [detalle,setDetalle]   = useState(null);
    const [editando,setEditando] = useState(false);
    const [busy,setBusy]         = useState(false);
    const [search,setSearch]     = useState('');
    const [contCuentas, setContCuentas] = useState([]);
    useEffect(()=>{ const u=onSnapshot(col('cont_cuentas'),s=>setContCuentas(s.docs.map(d=>d.data()))); return()=>u(); },[]);

    const rifToCodigo = (rif) => (rif||'').toUpperCase().replace(/[-\s]/g,'');
    const initF = ()=>({codigo:'',nombre:'',rif:'',telefono:'',email:'',direccion:'',diasCredito:'0',cuentaContableCod:'',cuentaContableNom:'',activo:true});
    const [form,setForm] = useState(initF());
    const filtered = proveedores.filter(p=>
      (p.nombre||p.descripcion||'').toUpperCase().includes(search.toUpperCase())||
      (p.rif||'').toUpperCase().includes(search.toUpperCase())||
      (p.codigo||'').includes(search)
    );

    const openNew  = ()=>{ setEditando(false); setForm(initF()); setModal(true); };
    const openEdit = (p)=>{ setEditando(true); setDetalle(null); setForm({codigo:p.codigo||rifToCodigo(p.rif),nombre:p.nombre||p.descripcion,rif:p.rif||p['r.i.f.']||'',telefono:p.telefono||'',email:p.email||'',direccion:p.direccion||'',diasCredito:p.diasCredito||'0',cuentaContableCod:p.cuentaContableCod||'',cuentaContableNom:p.cuentaContableNom||'',activo:p.activo!==false}); setModal(true); };

    const save = async()=>{
      if(!form.nombre||!form.rif) return alert('Nombre y RIF requeridos');
      const codigo = form.codigo||rifToCodigo(form.rif);
      setBusy(true);
      try{
        if(editando&&detalle){
          await updateDoc(dref('compras_proveedores',detalle.id),{...form,codigo});
        } else {
          const id=gid(); await setDoc(dref('compras_proveedores',id),{...form,codigo,id,ts:serverTimestamp()});
        }
        setModal(false); setForm(initF()); setDetalle(null); setEditando(false);
      }finally{setBusy(false);}
    };

    const eliminar = async(p)=>{
      if(!window.confirm(`¿Eliminar proveedor "${p.nombre||p.descripcion}"?`)) return;
      await deleteDoc(dref('compras_proveedores',p.id));
      setDetalle(null);
    };

    const printProveedor = (p) => {
      const nombre=p.nombre||p.descripcion||'';
      printWindow(
        letterheadOpen('Ficha de Proveedor',`Código: ${p.codigo||rifToCodigo(p.rif)}`)+
        `<table style="width:100%;margin:0"><tbody>
          <tr><td style="width:30%;font-weight:bold;color:#64748b;padding:8px 0">Código / RIF</td><td style="font-weight:900;font-size:13px">${p.codigo||''} · ${p.rif||p['r.i.f.']||''}</td></tr>
          <tr><td style="font-weight:bold;color:#64748b;padding:8px 0">Razón Social</td><td style="font-weight:900;font-size:14px">${nombre}</td></tr>
          <tr><td style="font-weight:bold;color:#64748b;padding:8px 0">Teléfono</td><td>${p.telefono||'—'}</td></tr>
          <tr><td style="font-weight:bold;color:#64748b;padding:8px 0">Email</td><td>${p.email||'—'}</td></tr>
          <tr><td style="font-weight:bold;color:#64748b;padding:8px 0">Dirección</td><td>${p.direccion||'—'}</td></tr>
          <tr><td style="font-weight:bold;color:#64748b;padding:8px 0">Días Crédito</td><td>${p.diasCredito||'0'} días</td></tr>
          <tr><td style="font-weight:bold;color:#64748b;padding:8px 0">Cuenta Contable</td><td><span style="font-family:monospace;color:#1e40af;font-weight:bold">${p.cuentaContableCod||'—'}</span> ${p.cuentaContableNom?'· '+p.cuentaContableNom:''}</td></tr>
        </tbody></table>`+
        letterheadClose('Módulo: Compras & Proveedores')
      );
    };

    const printDirectorio = () => {
      const rows=filtered.map((p,i)=>`<tr>
        <td>${i+1}</td>
        <td style="font-family:monospace;font-weight:bold;color:#1e40af">${p.codigo||rifToCodigo(p.rif)}</td>
        <td style="font-family:monospace">${p.rif||p['r.i.f.']||'—'}</td>
        <td style="font-weight:700">${p.nombre||p.descripcion}</td>
        <td>${p.telefono||'—'}</td>
        <td>${p.email||'—'}</td>
        <td>${p.diasCredito||'0'}d</td>
        <td style="font-family:monospace;color:#1e40af;font-size:9px">${p.cuentaContableCod||'—'}</td>
        <td><span class="badge-${p.activo!==false?'green':'red'}">${p.activo!==false?'Activo':'Inactivo'}</span></td>
      </tr>`).join('');
      printWindow(
        letterheadOpen('Directorio de Proveedores',`${filtered.length} proveedor(es)`)+
        `<table><thead><tr><th>#</th><th>Código</th><th>R.I.F.</th><th>Razón Social</th><th>Teléfono</th><th>Email</th><th>Créd.</th><th>PUC</th><th>Estado</th></tr></thead><tbody>${rows}</tbody></table>`+
        letterheadClose('Módulo: Compras & Proveedores')
      );
    };

    const exportarTxt=()=>{
      const HDRS=['Código','Descripción','Activo','Dirección','Teléfonos','R.I.F.','E-Mail'];
      const rows=proveedores.map(p=>[p.codigo||rifToCodigo(p.rif),p.nombre||p.descripcion||'',p.activo!==false?'Si':'No',p.direccion||'',p.telefono||'',p.rif||'',p.email||'']);
      const content=[HDRS,...rows].map(r=>r.join('\t')).join('\r\n');
      const blob=new Blob(['\uFEFF'+content],{type:'text/plain;charset=utf-8'});
      const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='GENERALDEPROVEEDORES.TXT';a.click();URL.revokeObjectURL(url);
    };

    const importarTxt=async(event)=>{
      const file=event.target.files[0];if(!file)return;
      const text=await file.text();
      const lines=text.split(/\r?\n/).filter(l=>l.trim());
      if(lines.length<2){alert('Archivo vacío');event.target.value='';return;}
      const firstCell=lines[0].split('\t')[0].trim();
      const hasHeader=/[a-zA-ZáéíóúÁÉÍÓÚ]/.test(firstCell)&&!firstCell.startsWith('P');
      const dataLines=hasHeader?lines.slice(1):lines;
      const existentes=new Set(proveedores.map(p=>(p.rif||'').toUpperCase().replace(/[-\s]/g,'')));
      const batch=writeBatch(db);let importados=0,omitidos=0;
      for(const line of dataLines){
        const p=line.split('\t').map(v=>v.trim().replace(/^["']/,'').replace(/["']$/,''));
        if(p.length<2) continue;
        const cod=p[0],nombre=p[1],activo=p[2],dir=p[3]||'',tel=p[4]||'',rif=p[5]||'',email=p[6]||'';
        if(!nombre) continue;
        const rifKey=(rif||cod).toUpperCase().replace(/[-\s]/g,'');
        if(rifKey&&existentes.has(rifKey)){omitidos++;continue;}
        const id=gid();const codigo=rifToCodigo(rif||cod);
        batch.set(dref('compras_proveedores',id),{id,codigo,nombre:nombre.toUpperCase(),activo:activo!=='No',direccion:dir,telefono:tel,rif:(rif||'').toUpperCase(),email,diasCredito:'0',ts:serverTimestamp()});
        importados++;
      }
      if(importados===0){alert(`Sin nuevos proveedores. ${omitidos} ya existían.`);event.target.value='';return;}
      await batch.commit();
      alert(`✅ ${importados} proveedor(es) importado(s).${omitidos>0?` (${omitidos} omitidos)`:''}`);
      event.target.value='';
    };

    return(
      <div>
        {/* ── MODAL DETALLE ── */}
        {detalle && !editando && (
          <Modal open onClose={()=>setDetalle(null)} title={`Proveedor — ${detalle.nombre||detalle.descripcion}`} wide
            footer={<>
              <Bd onClick={()=>eliminar(detalle)}>🗑 Eliminar</Bd>
              <div className="flex-1"/>
              <button onClick={()=>printProveedor(detalle)} className="flex items-center gap-2 px-4 py-2 border-2 border-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase hover:bg-slate-50"><Download size={12}/> Imprimir</button>
              <Bg onClick={()=>openEdit(detalle)}>✏ Editar</Bg>
            </>}>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 p-5 rounded-2xl flex items-center gap-5" style={{background:'linear-gradient(135deg,#0f172a,#1e293b)'}}>
                <div className="w-14 h-14 rounded-2xl bg-emerald-500 flex items-center justify-center flex-shrink-0">
                  <Briefcase size={24} className="text-white"/>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-0.5">{detalle.codigo||rifToCodigo(detalle.rif)}</p>
                  <p className="font-black text-white text-lg">{detalle.nombre||detalle.descripcion}</p>
                  <p className="text-slate-400 text-xs">{detalle.rif||detalle['r.i.f.']}</p>
                </div>
                <div className="ml-auto"><Badge v={detalle.activo!==false?'green':'gray'}>{detalle.activo!==false?'Activo':'Inactivo'}</Badge></div>
              </div>
              {[['Código',detalle.codigo||rifToCodigo(detalle.rif)],['RIF',detalle.rif||detalle['r.i.f.']||'—'],['Teléfono',detalle.telefono||'—'],['Email',detalle.email||'—'],['Días Crédito',(detalle.diasCredito||'0')+'d'],['Dirección',detalle.direccion||'—']].map(([k,v])=>(
                <div key={k} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <p className="text-[9px] font-black uppercase text-slate-400 mb-0.5">{k}</p>
                  <p className="font-semibold text-slate-800 text-sm truncate">{v}</p>
                </div>
              ))}
              {detalle.cuentaContableCod&&(
                <div className="col-span-2 bg-blue-50 border border-blue-100 rounded-xl p-3">
                  <p className="text-[9px] font-black uppercase text-blue-700 mb-0.5">Cuenta Contable (PUC)</p>
                  <p className="font-mono font-black text-blue-700">{detalle.cuentaContableCod} <span className="font-medium text-slate-600">· {detalle.cuentaContableNom}</span></p>
                </div>
              )}
            </div>
          </Modal>
        )}

        {/* ── MODAL CREAR / EDITAR ── */}
        <Modal open={modal} onClose={()=>{setModal(false);setForm(initF());setEditando(false);setDetalle(null);}} title={editando?`Editar: ${detalle?.nombre||detalle?.descripcion}`:'Registrar Proveedor'}
          footer={<><Bo onClick={()=>{setModal(false);setForm(initF());setEditando(false);setDetalle(null);}}>Cancelar</Bo><Bg onClick={save} disabled={busy}>{busy?'Guardando...':(editando?'Guardar Cambios':'Guardar')}</Bg></>}>
          <div className="grid grid-cols-2 gap-4">
            <FG label="R.I.F. / N.I.T. *"><input className={inp} value={form.rif} onChange={e=>{const rif=e.target.value.toUpperCase();setForm({...form,rif,codigo:form.codigo||rifToCodigo(rif)});}} placeholder="J-12345678-9"/></FG>
            <FG label="Código (auto: RIF sin guiones)"><input className={inp} value={form.codigo} onChange={e=>setForm({...form,codigo:e.target.value.toUpperCase()})} placeholder={rifToCodigo(form.rif)||'J412345789'}/></FG>
            <FG label="Razón Social *" full><input className={inp} value={form.nombre} onChange={e=>setForm({...form,nombre:e.target.value.toUpperCase()})} placeholder="PROVEEDOR S.A."/></FG>
            <FG label="Teléfono"><input className={inp} value={form.telefono} onChange={e=>setForm({...form,telefono:e.target.value})}/></FG>
            <FG label="Email"><input type="email" className={inp} value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></FG>
            <FG label="Días Crédito"><input type="number" className={inp} value={form.diasCredito} onChange={e=>setForm({...form,diasCredito:e.target.value})}/></FG>
            <FG label="Dirección" full><input className={inp} value={form.direccion} onChange={e=>setForm({...form,direccion:e.target.value})}/></FG>
            <FG label="Cuenta Contable Asociada (PUC)" full>
              <select className={sel} value={form.cuentaContableCod} onChange={e=>{const c=contCuentas.find(x=>x.codigo===e.target.value);setForm({...form,cuentaContableCod:e.target.value,cuentaContableNom:c?.nombre||''});}}>
                <option value="">— Sin cuenta asociada —</option>
                {contCuentas.filter(c=>String(c.codigo).startsWith('2')).sort((a,b)=>String(a.codigo).localeCompare(String(b.codigo))).map(c=><option key={c.id} value={c.codigo}>{c.codigo} · {c.nombre}</option>)}
              </select>
              {form.cuentaContableCod&&<p className="text-[10px] text-blue-600 font-black mt-1">✓ {form.cuentaContableCod} · {form.cuentaContableNom}</p>}
            </FG>
          </div>
        </Modal>

        {/* ── TABLA ── */}
        <Card title="Directorio de Proveedores" subtitle={`${proveedores.length} proveedores registrados`}
          action={<div className="flex gap-2 flex-wrap items-center">
            <div className="relative"><Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar..." className="border-2 border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs outline-none focus:border-emerald-500 w-36"/></div>
            <button onClick={printDirectorio} className="flex items-center gap-1.5 px-3 py-2 border-2 border-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase hover:bg-slate-50"><Download size={12}/> PDF</button>
            <button onClick={exportarTxt} className="flex items-center gap-1.5 px-3 py-2 border-2 border-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase hover:bg-slate-50"><Download size={12}/> TXT</button>
            <label className="flex items-center gap-1.5 px-3 py-2 border-2 border-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase hover:border-emerald-400 hover:text-emerald-600 cursor-pointer">
              <Upload size={12}/> Importar<input type="file" accept=".txt,.csv" className="sr-only" onChange={importarTxt}/>
            </label>
            <Bg onClick={openNew} sm><Plus size={12}/> Nuevo</Bg>
          </div>}>
          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead><tr><Th>Código</Th><Th>R.I.F.</Th><Th>Razón Social</Th><Th>Teléfono</Th><Th>Email</Th><Th>PUC</Th><Th>Días</Th><Th>Estado</Th><Th></Th></tr></thead>
              <tbody>
                {filtered.length===0&&<tr><td colSpan={9}><EmptyState icon={Users} title="Sin proveedores" desc="Registre o importe proveedores"/></td></tr>}
                {filtered.map(p=><tr key={p.id} className="hover:bg-slate-50 cursor-pointer" onClick={()=>setDetalle(p)}>
                  <Td mono className="font-black text-emerald-600">{p.codigo||rifToCodigo(p.rif)}</Td>
                  <Td mono className="font-semibold text-slate-700">{p.rif||p['r.i.f.']||'—'}</Td>
                  <Td className="uppercase font-semibold max-w-[160px] truncate">{p.nombre||p.descripcion}</Td>
                  <Td>{p.telefono||'—'}</Td>
                  <Td className="text-slate-400 max-w-[120px] truncate">{p.email||'—'}</Td>
                  <Td mono className="text-blue-600 text-[10px]">{p.cuentaContableCod||'—'}</Td>
                  <Td mono className="text-slate-500">{p.diasCredito||'0'}d</Td>
                  <Td><Badge v={p.activo!==false?'green':'gray'}>{p.activo!==false?'Activo':'Inactivo'}</Badge></Td>
                  <Td>
                    <div className="flex gap-1" onClick={e=>e.stopPropagation()}>
                      <button onClick={()=>setDetalle(p)} className="p-1.5 text-blue-400 hover:bg-blue-50 rounded-lg" title="Detalle"><Search size={12}/></button>
                      <button onClick={()=>openEdit(p)} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg" title="Editar"><Settings size={12}/></button>
                      <button onClick={()=>printProveedor(p)} className="p-1.5 text-green-500 hover:bg-green-50 rounded-lg" title="Imprimir"><Download size={12}/></button>
                      <button onClick={()=>eliminar(p)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg" title="Eliminar"><Trash2 size={12}/></button>
                    </div>
                  </Td>
                </tr>)}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    );
  };


  const navGroups=[
    {group:'Panel',color:'#10b981',items:[{id:'dashboard',label:'Panel General',icon:LayoutDashboard}]},
    {group:'Maestros',color:'#10b981',items:[{id:'proveedores',label:'Directorio Proveedores',icon:Users}]},
  ];
  const views={dashboard:<DashboardView/>,proveedores:<ProveedoresView/>};
  const curNav=navGroups.flatMap(g=>g.items).find(n=>n.id===sec);
  return(
    <SidebarLayout brand="Supply G&B" brandSub="Compras & Proveedores" navGroups={navGroups} activeId={sec} onNav={setSec} onBack={onBack} accentColor="#10b981"
      headerContent={<><div><h1 className="font-black text-slate-800 text-sm uppercase">{curNav?.label}</h1><p className="text-[9px] text-slate-400 uppercase tracking-widest">Compras · Proveedores</p></div><Bg onClick={()=>setSec('proveedores')} sm><Plus size={12}/> Proveedor</Bg></>}>
      {views[sec]||<DashboardView/>}
    </SidebarLayout>
  );
}

// ============================================================================
// MÓDULO CONFIGURACIÓN
// ============================================================================
function ConfiguracionApp({ settings, systemUsers, tasasList, onBack }) {
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [errorValidacion, setErrorValidacion] = useState(false);
  const [sec, setSec] = useState('empresa');

  const handleValidation = () => {
    if (adminPassword === '1234' || adminPassword.toLowerCase() === 'admin') { setAdminUnlocked(true); setErrorValidacion(false); }
    else { setErrorValidacion(true); setTimeout(() => setErrorValidacion(false), 2000); }
  };

  if (!adminUnlocked) return (
    <div className="fixed inset-0 flex items-center justify-center z-[200] p-4" style={{ background: 'rgba(15,23,42,.9)', backdropFilter: 'blur(8px)' }}>
      <div className="bg-white rounded-3xl p-10 max-w-sm w-full shadow-2xl relative">
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-20 h-20 rounded-2xl flex items-center justify-center shadow-2xl border-4 border-white" style={{ background: DARK }}><Key size={32} style={{ color: ORANGE }} /></div>
        <div className="mt-10 text-center">
          <h3 className="text-xl font-black text-slate-900 uppercase tracking-widest mb-2">Acceso Restringido</h3>
          <p className="text-slate-500 text-xs font-medium mb-8">Requiere clave de Administrador Master</p>
          <input type="password" value={adminPassword} onChange={e => setAdminPassword(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleValidation()} placeholder="••••••••" autoFocus
            className={`w-full border-2 ${errorValidacion ? 'border-red-500 bg-red-50' : 'border-slate-200'} rounded-2xl p-4 text-center text-xl font-black tracking-[0.5em] focus:border-orange-500 outline-none transition-colors mb-6`} />
          {errorValidacion && <p className="text-[10px] text-red-500 font-black uppercase -mt-4 mb-4">Clave Incorrecta</p>}
          <div className="flex gap-3">
            <button onClick={onBack} className="flex-1 bg-slate-100 text-slate-700 font-black py-3 rounded-xl uppercase text-xs tracking-widest hover:bg-slate-200 transition-colors">Cancelar</button>
            <button onClick={handleValidation} className="flex-1 text-white font-black py-3 rounded-xl uppercase text-xs tracking-widest transition-colors shadow-lg" style={{ background: DARK }}
              onMouseEnter={e => e.target.style.background = ORANGE} onMouseLeave={e => e.target.style.background = DARK}>Desbloquear</button>
          </div>
        </div>
      </div>
    </div>
  );

  const TasasConfig = () => {
    const [modal, setModal] = useState(false); const [busy, setBusy] = useState(false);
    const [form, setForm] = useState({ fecha: today(), modulo: 'Todos', moneda: 'USD', tasaRef: '', fuente: 'Oficial / BCV' });
    const [tasas, setTasas] = useState(tasasList || []);
    useEffect(() => { const unsub = onSnapshot(query(col('banco_tasas'), orderBy('fecha', 'desc')), s => setTasas(s.docs.map(x => x.data()))); return () => unsub(); }, []);
    const save = async () => {
      if (!form.tasaRef) return alert('Tasa requerida'); setBusy(true);
      try { const id = gid(); await setDoc(dref('banco_tasas', id), { ...form, tasaRef: Number(form.tasaRef), id, ts: serverTimestamp() }); setModal(false); setForm({ fecha: today(), modulo: 'Todos', moneda: 'USD', tasaRef: '', fuente: 'Oficial / BCV' }); } finally { setBusy(false); }
    };
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-3 gap-4">
          <KPI label="Tasa Global" value={`${tasas.find(t => t.modulo === 'Todos')?.tasaRef || '—'} Bs/$`} accent="gold" Icon={Globe} />
          <KPI label="Monedas" value="USD / EUR" accent="blue" Icon={DollarSign} />
          <KPI label="Registros" value={tasas.length} accent="green" Icon={TrendingUp} />
        </div>
        <Card title="Tasas Configuradas" action={<Bg onClick={() => setModal(true)} sm><Plus size={12} /> Nueva</Bg>}>
          <table className="w-full"><thead><tr><Th>Fecha</Th><Th>Módulo</Th><Th>Moneda</Th><Th right>Tasa Ref. (Bs/$)</Th><Th>Fuente</Th></tr></thead>
            <tbody>{tasas.length === 0 && <tr><td colSpan={5}><EmptyState icon={Globe} title="Sin tasas" desc="Registre la tasa de cambio" /></td></tr>}{tasas.map(t => <tr key={t.id} className="hover:bg-slate-50"><Td>{dd(t.fecha)}</Td><Td><Badge v={t.modulo === 'Todos' ? 'gray' : 'blue'}>{t.modulo}</Badge></Td><Td><Pill usd={t.moneda === 'USD'}>{t.moneda}</Pill></Td><Td right mono className="font-black text-slate-900 text-sm">{t.tasaRef}</Td><Td className="text-slate-400 text-[10px] uppercase font-semibold">{t.fuente}</Td></tr>)}</tbody>
          </table>
        </Card>
        <Modal open={modal} onClose={() => setModal(false)} title="Registrar Tasa de Cambio" footer={<><Bo onClick={() => setModal(false)}>Cancelar</Bo><Bg onClick={save} disabled={busy}>{busy ? 'Guardando...' : 'Guardar'}</Bg></>}>
          <div className="grid grid-cols-2 gap-4">
            <FG label="Fecha"><input type="date" className={inp} value={form.fecha} onChange={e => setForm({ ...form, fecha: e.target.value })} /></FG>
            <FG label="Moneda"><select className={sel} value={form.moneda} onChange={e => setForm({ ...form, moneda: e.target.value })}><option>USD</option><option>EUR</option></select></FG>
            <FG label="Tasa (Bs/Divisa)"><input type="number" step="0.01" className={inp} value={form.tasaRef} onChange={e => setForm({ ...form, tasaRef: e.target.value })} placeholder="39.50" /></FG>
            <FG label="Módulo"><select className={sel} value={form.modulo} onChange={e => setForm({ ...form, modulo: e.target.value })}><option>Todos</option><option>Banco</option><option>Facturación</option><option>Inventario</option><option>Contabilidad</option></select></FG>
            <FG label="Fuente" full><input className={inp} value={form.fuente} onChange={e => setForm({ ...form, fuente: e.target.value })} placeholder="Oficial / BCV / Paralelo" /></FG>
          </div>
        </Modal>
      </div>
    );
  };

  // Pre-carga de cuentas bancarias de la empresa
  const CUENTAS_PRELOAD = [
    {banco:'BBVA Provincial',nro:'0108-0086-27-0100348585',tipo:'Nacional-Bs', tipoCuenta:'Corriente',moneda:'BS', puc:'1.1.01.02.001',pucNom:'BANCO PROVINCIAL'},
    {banco:'BBVA Provincial',nro:'0108-0086-24-0100367938',tipo:'Nacional-Bs', tipoCuenta:'Custodia',  moneda:'BS', puc:'1.1.01.02.001',pucNom:'BANCO PROVINCIAL'},
    {banco:'Banco Mercantil', nro:'0105-0699-95-1699220018',tipo:'Nacional-Bs', tipoCuenta:'Corriente',moneda:'BS', puc:'1.1.01.02.002',pucNom:'BANCO MERCANTIL'},
    {banco:'Banco Mercantil', nro:'0105-0699-94-5699080384',tipo:'Nacional-Ext',tipoCuenta:'Custodia',  moneda:'USD',puc:'1.1.01.03.002',pucNom:'BANCO MERCANTIL (ME)'},
    {banco:'Banco Mercantil', nro:'0105-0699-99-5699080406',tipo:'Nacional-Ext',tipoCuenta:'Custodia',  moneda:'EUR',puc:'1.1.01.03.002',pucNom:'BANCO MERCANTIL (ME)'},
    {banco:'Bancaribe',       nro:'0114-0560-68-5600068743',tipo:'Nacional-Bs', tipoCuenta:'Corriente',moneda:'BS', puc:'1.1.01.02.003',pucNom:'BANCARIBE'},
    {banco:'Bancaribe',       nro:'0114-0560-69-5604017230',tipo:'Nacional-Bs', tipoCuenta:'Custodia',  moneda:'BS', puc:'1.1.01.02.003',pucNom:'BANCARIBE'},
    {banco:'Banesco',         nro:'0134-0086-50-0861268884',tipo:'Nacional-Bs', tipoCuenta:'Corriente',moneda:'BS', puc:'1.1.01.02.011',pucNom:'BANESCO'},
    {banco:'Banesco',         nro:'J-41230937-4 · TLF:0424-6020171',tipo:'Nacional-Bs',tipoCuenta:'Pago Móvil',moneda:'BS',puc:'1.1.01.02.011',pucNom:'BANESCO'},
  ];

  const CuentasBancariasConfig = () => {
    const [cuentas, setCuentas] = useState([]);
    const [busy, setBusy] = useState(false);
    useEffect(()=>{ const unsub=onSnapshot(col('banco_cuentas'),s=>setCuentas(s.docs.map(d=>d.data()))); return()=>unsub(); },[]);

    const precargar = async () => {
      setBusy(true);
      try {
        const existentes = new Set(cuentas.map(c=>c.numeroCuenta));
        const batch = writeBatch(db);
        let cnt=0;
        CUENTAS_PRELOAD.forEach(c=>{
          if(!existentes.has(c.nro)){
            const id=gid();
            batch.set(dref('banco_cuentas',id),{id,banco:c.banco,numeroCuenta:c.nro,tipoBanco:c.tipo,tipoCuenta:c.tipoCuenta,moneda:c.moneda,titular:'Servicios Jiret G&B, C.A.',saldo:0,cuentaContableCod:c.puc,cuentaContableNom:c.pucNom,ts:serverTimestamp()});
            cnt++;
          }
        });
        // También agregar cuentas PUC bancarias si no existen
        const PUC_BANCOS = [
          {codigo:'1.1.01.02.001',nombre:'BANCO PROVINCIAL',grupo:'1',tipo:'Analítica',naturaleza:'Deudora'},
          {codigo:'1.1.01.02.002',nombre:'BANCO MERCANTIL',grupo:'1',tipo:'Analítica',naturaleza:'Deudora'},
          {codigo:'1.1.01.02.003',nombre:'BANCARIBE',grupo:'1',tipo:'Analítica',naturaleza:'Deudora'},
          {codigo:'1.1.01.02.011',nombre:'BANESCO',grupo:'1',tipo:'Analítica',naturaleza:'Deudora'},
          {codigo:'1.1.01.03.002',nombre:'BANCO MERCANTIL MONEDA EXTRANJERA',grupo:'1',tipo:'Analítica',naturaleza:'Deudora'},
        ];
        // Read existing PUC to avoid duplicates
        const pucSnap = await import('firebase/firestore').then(()=>new Promise(res=>{
          const unsub=onSnapshot(col('cont_cuentas'),s=>{res(s.docs.map(d=>d.data()));unsub();});
        }));
        const pucExist = new Set(pucSnap.map(c=>c.codigo));
        PUC_BANCOS.forEach(p=>{
          if(!pucExist.has(p.codigo)){
            const id=gid();
            batch.set(dref('cont_cuentas',id),{id,...p,descripcion:'',ts:serverTimestamp()});
          }
        });
        await batch.commit();
        alert(`✅ ${cnt} cuenta(s) bancaria(s) precargada(s). PUC bancario actualizado.${cnt===0?' (Cuentas bancarias ya existían)':''}`);
      } finally { setBusy(false); }
    };

    const printCuentas = () => {
      let rows='';
      cuentas.forEach(c=>{ rows+=`<tr><td>${c.banco}</td><td>${c.tipoCuenta||'—'}</td><td style="font-family:monospace;font-weight:bold">${c.numeroCuenta}</td><td>${c.moneda}</td><td style="font-family:monospace;color:#1e40af">${c.cuentaContableCod||'—'}</td><td>${c.cuentaContableNom||'—'}</td></tr>`; });
      printWindow(
        letterheadOpen('Registro de Cuentas Bancarias','Titular: Servicios Jiret G&B, C.A. · RIF: J-412309374')+
        `<table><thead><tr><th>Banco</th><th>Tipo</th><th>Número de Cuenta</th><th>Moneda</th><th>Código PUC</th><th>Cuenta Contable</th></tr></thead><tbody>${rows}</tbody></table>`+
        letterheadClose(`${cuentas.length} cuenta(s) registrada(s)`)
      );
    };

    return (
      <div className="space-y-5">
        <div className="grid grid-cols-3 gap-4">
          <KPI label="Cuentas Registradas" value={cuentas.length} accent="blue" Icon={Building2}/>
          <KPI label="Cuentas Bs." value={cuentas.filter(c=>c.moneda==='BS').length} accent="green" Icon={Banknote}/>
          <KPI label="Cuentas Divisas" value={cuentas.filter(c=>c.moneda!=='BS').length} accent="gold" Icon={Globe}/>
        </div>

        {/* Card de pre-carga */}
        <div className="rounded-2xl p-5 border-2 border-dashed border-orange-300 bg-orange-50">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-black text-orange-800 uppercase tracking-wide mb-1">Cuentas Pre-configuradas G&B</p>
              <p className="text-[11px] text-orange-700">{CUENTAS_PRELOAD.length} cuentas listas: BBVA Provincial · Mercantil · Bancaribe · Banesco (incl. Pago Móvil)</p>
              <div className="flex flex-wrap gap-2 mt-3">
                {['BBVA Provincial','Banco Mercantil','Bancaribe','Banesco'].map(b=>(
                  <span key={b} className="px-3 py-1 bg-orange-600 text-white rounded-full text-[9px] font-black uppercase">{b}</span>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={printCuentas} className="flex items-center gap-2 px-4 py-2 border-2 border-orange-400 text-orange-700 rounded-xl text-[10px] font-black uppercase hover:bg-orange-100"><Download size={12}/> Imprimir</button>
              <Bg onClick={precargar} disabled={busy}>{busy?'Cargando...':'⚡ Pre-cargar Cuentas'}</Bg>
            </div>
          </div>
        </div>

        <Card title="Cuentas Bancarias de la Empresa" subtitle="Titular: Servicios Jiret G&B, C.A.">
          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead><tr><Th>Banco</Th><Th>Tipo Cuenta</Th><Th>Número</Th><Th>Moneda</Th><Th>Código PUC</Th><Th>Cuenta Contable</Th><Th right>Saldo</Th></tr></thead>
              <tbody>
                {cuentas.length===0&&<tr><td colSpan={7}><EmptyState icon={Building2} title="Sin cuentas" desc="Use el botón ⚡ Pre-cargar para cargar las cuentas de la empresa"/></td></tr>}
                {cuentas.map(c=>(
                  <tr key={c.id} className="hover:bg-slate-50">
                    <Td className="font-semibold">{c.banco}</Td>
                    <Td><Badge v={c.tipoCuenta==='Corriente'?'blue':c.tipoCuenta==='Pago Móvil'?'green':'gray'}>{c.tipoCuenta}</Badge></Td>
                    <Td mono className="text-[10px] text-slate-600 max-w-[180px]">{c.numeroCuenta}</Td>
                    <Td><Pill usd={c.moneda!=='BS'}>{c.moneda}</Pill></Td>
                    <Td mono className="font-black text-blue-600">{c.cuentaContableCod||'—'}</Td>
                    <Td className="text-slate-500 text-[10px] max-w-[160px] truncate">{c.cuentaContableNom||'—'}</Td>
                    <Td right mono className="font-black">{c.moneda==='BS'?'Bs.':'$'} {fmt(c.saldo)}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    );
  };

  // ── Datos de Empresa ────────────────────────────────────────────────
  const EmpresaConfig = () => {
    const [form,setForm] = useState({
      razonSocial: settings?.empresaRazonSocial || 'SERVICIOS JIRET G&B, C.A.',
      rif:         settings?.empresaRif         || 'J-412309374',
      telefono:    settings?.empresaTelefono    || '0414-693.03.42',
      email:       settings?.empresaEmail       || '',
      direccion:   settings?.empresaDireccion   || 'AV CIRCUNVALACION NRO 02 C.C EL DIVIDIVI LOCAL G-9 NIVEL PB SECTOR EL TREBOL MARACAIBO-ZULIA',
      actividad:   settings?.empresaActividad   || 'Líderes en material de empaque',
    });
    const [busy,setBusy]=useState(false);
    const [saved,setSaved]=useState(false);
    const save=async()=>{
      setBusy(true);
      try {
        await setDoc(dref('settings','general'),{
          empresaRazonSocial:form.razonSocial,empresaRif:form.rif,
          empresaTelefono:form.telefono,empresaEmail:form.email,
          empresaDireccion:form.direccion,empresaActividad:form.actividad,
          ts:serverTimestamp()
        },{merge:true});
        // Update global EMPRESA_DATA immediately so letterhead reflects the change
        EMPRESA_DATA = {
          razonSocial:form.razonSocial,
          rif:form.rif,
          direccion:form.direccion,
          telefono:form.telefono,
        };
        setSaved(true); setTimeout(()=>setSaved(false),3000);
      } finally { setBusy(false); }
    };
    return (
      <div className="space-y-5">
        <div className="flex items-start gap-4 p-5 bg-orange-50 border border-orange-200 rounded-2xl">
          <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center flex-shrink-0"><Building2 size={18} className="text-white"/></div>
          <div><p className="font-black text-orange-800 text-sm uppercase">Datos de la Empresa</p><p className="text-[11px] text-orange-600 mt-0.5">Estos datos aparecen en el encabezado de todos los reportes e impresiones.</p></div>
        </div>
        <Card title="Información Empresarial">
          <div className="grid grid-cols-2 gap-5">
            <FG label="RAZÓN SOCIAL *" full><input className={inp} value={form.razonSocial} onChange={e=>setForm({...form,razonSocial:e.target.value.toUpperCase()})} placeholder="SERVICIOS JIRET G&B, C.A."/></FG>
            <FG label="RIF *"><input className={inp} value={form.rif} onChange={e=>setForm({...form,rif:e.target.value.toUpperCase()})} placeholder="J-412309374"/></FG>
            <FG label="TELÉFONO"><input className={inp} value={form.telefono} onChange={e=>setForm({...form,telefono:e.target.value})} placeholder="0414-000.00.00"/></FG>
            <FG label="EMAIL"><input type="email" className={inp} value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="admin@empresa.com"/></FG>
            <FG label="DIRECCIÓN FISCAL" full><input className={inp} value={form.direccion} onChange={e=>setForm({...form,direccion:e.target.value.toUpperCase()})} placeholder="Av. Principal, Local 01..."/></FG>
            <FG label="ACTIVIDAD ECONÓMICA" full><input className={inp} value={form.actividad} onChange={e=>setForm({...form,actividad:e.target.value})} placeholder="Suministros industriales..."/></FG>
          </div>
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
            {saved&&<p className="text-[11px] font-black text-emerald-600 flex items-center gap-2"><CheckCircle size={14}/> ¡Datos guardados!</p>}
            <div className="ml-auto"><Bg onClick={save} disabled={busy}>{busy?<><RefreshCw size={13} className="animate-spin"/> Guardando...</>:<><Save size={13}/> Guardar Cambios</>}</Bg></div>
          </div>
        </Card>
        {/* Vista previa membrete */}
        <Card title="Vista Previa — Membrete">
          <div className="rounded-xl overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between px-6 py-4 bg-black border-b-4 border-orange-500">
              <div className="flex items-center gap-2"><span className="text-white text-lg font-light">Supply</span><span className="text-white font-black text-3xl">G</span><div className="bg-orange-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-black">&amp;</div><span className="text-white font-black text-3xl">B</span></div>
              <div className="text-right"><p className="text-orange-400 font-black text-sm">{form.razonSocial}</p><p className="text-gray-400 text-[10px]">RIF: {form.rif}</p><p className="text-gray-500 text-[9px]">{form.direccion}</p>{form.telefono&&<p className="text-gray-500 text-[9px]">Tel: {form.telefono}</p>}</div>
            </div>
            <div className="bg-white px-6 py-2 text-center border-b-2 border-orange-500"><p className="font-black uppercase text-sm">TÍTULO DEL REPORTE</p><p className="text-[9px] text-slate-400">Generado: {dd(today())}</p></div>
          </div>
        </Card>

        {/* Reclasificación masiva (operación silenciosa - no visible en UI) */}
        {false && <Card title="Reclasificación Masiva"><ReclasificacionPanel/></Card>}
      </div>
    );
  };

  // ── Reclasificación masiva de clientes y proveedores ─────────────────
  const ReclasificacionPanel = () => {
    const [busy,setBusy]=useState('');
    const [clientes,setClientes]=useState([]);
    const [proveedores,setProveedores]=useState([]);
    useEffect(()=>{
      const s1=onSnapshot(col('facturacion_clientes'),s=>setClientes(s.docs.map(d=>d.data())));
      const s2=onSnapshot(col('compras_proveedores'), s=>setProveedores(s.docs.map(d=>d.data())));
      return()=>{s1();s2();};
    },[]);

    // RIF: mantener letra inicial + números sin guiones (J123456789)
    const normalizarRif=(rif)=>{
      if(!rif) return '';
      const r=rif.toUpperCase().trim();
      // Extraer letra y números
      const match=r.match(/^([VEJGC])/);
      const letra=match?match[1]:'';
      const nums=r.replace(/[^0-9]/g,'');
      return letra+nums;
    };

    const asignarCuentasClientes = async () => {
      if(!window.confirm(`¿Asignar 1.1.02.01.001 · CUENTAS POR COBRAR a ${clientes.length} clientes?`)) return;
      setBusy('clientes');
      try {
        const batch=writeBatch(db);
        clientes.forEach(c=>{
          const rifNorm=normalizarRif(c.rif||c.codigo||'');
          batch.update(dref('facturacion_clientes',c.id),{
            cuentaContableCod:'1.1.02.01.001',
            cuentaContableNom:'CUENTAS POR COBRAR CLIENTES',
            ...(rifNorm&&{rif:rifNorm,codigo:rifNorm}),
          });
        });
        await batch.commit();
        alert(`✅ ${clientes.length} clientes actualizados con Cta. Contable y RIF normalizado.`);
      } finally { setBusy(''); }
    };

    const asignarCuentasProveedores = async () => {
      if(!window.confirm(`¿Asignar 2.1.01.01.001 · CUENTAS POR PAGAR a ${proveedores.length} proveedores?`)) return;
      setBusy('proveedores');
      try {
        const batch=writeBatch(db);
        proveedores.forEach(p=>{
          const rifNorm=normalizarRif(p.rif||p['r.i.f.']||'');
          batch.update(dref('compras_proveedores',p.id),{
            cuentaContableCod:'2.1.01.01.001',
            cuentaContableNom:'CUENTAS POR PAGAR PROVEEDORES',
            ...(rifNorm&&{rif:rifNorm,codigo:rifNorm}),
          });
        });
        await batch.commit();
        alert(`✅ ${proveedores.length} proveedores actualizados con Cta. Contable y RIF normalizado.`);
      } finally { setBusy(''); }
    };

    return (
      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-[11px] text-blue-700">
          <p className="font-black mb-1">¿Qué hace esta reclasificación?</p>
          <p>• Asigna la cuenta contable asociada a todos los registros existentes</p>
          <p>• Normaliza el RIF: <span className="font-mono bg-blue-100 px-1 rounded">J-41230937-4</span> → <span className="font-mono bg-blue-100 px-1 rounded">J412309374</span></p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="border border-orange-200 rounded-xl p-4 bg-orange-50">
            <p className="font-black text-orange-800 text-sm mb-1">Clientes ({clientes.length})</p>
            <p className="text-[10px] text-orange-600 mb-3 font-mono">1.1.02.01.001 · CUENTAS POR COBRAR</p>
            <button onClick={asignarCuentasClientes} disabled={!!busy}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-500 text-white rounded-xl font-black text-[10px] uppercase hover:bg-orange-600 disabled:opacity-50">
              {busy==='clientes'?<><RefreshCw size={12} className="animate-spin"/> Procesando...</>:<><Users size={12}/> Reclasificar Clientes</>}
            </button>
          </div>
          <div className="border border-emerald-200 rounded-xl p-4 bg-emerald-50">
            <p className="font-black text-emerald-800 text-sm mb-1">Proveedores ({proveedores.length})</p>
            <p className="text-[10px] text-emerald-600 mb-3 font-mono">2.1.01.01.001 · CUENTAS POR PAGAR</p>
            <button onClick={asignarCuentasProveedores} disabled={!!busy}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl font-black text-[10px] uppercase hover:bg-emerald-700 disabled:opacity-50">
              {busy==='proveedores'?<><RefreshCw size={12} className="animate-spin"/> Procesando...</>:<><Briefcase size={12}/> Reclasificar Proveedores</>}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ── Fondo de Pantalla y Sistema ──────────────────────────────────────────
  const SistemaConfig = () => {
    const [busy,setBusy]=useState(false);
    const [preview,setPreview]=useState(null);
    const handleImg=async(e)=>{
      const file=e.target.files[0]; if(!file) return;
      setBusy(true);
      try {
        const reader=new FileReader();
        reader.onload=async ev=>{
          const base64=ev.target.result;
          setPreview(base64);
          await setDoc(dref('settings','general'),{loginBg:base64,ts:serverTimestamp()},{merge:true});
          alert('✅ Fondo actualizado. Se aplicará en el próximo inicio de sesión.');
          setBusy(false);
        };
        reader.readAsDataURL(file);
      } catch { setBusy(false); }
    };
    return (
      <Card title="Fondo de Pantalla de Inicio">
        <p className="text-[11px] text-slate-500 mb-4">Sube una imagen para personalizar el fondo de la pantalla de inicio de sesión.</p>
        <label className="flex items-center gap-3 cursor-pointer">
          <div className="px-5 py-2.5 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase hover:bg-slate-700 transition-colors">{busy?'Subiendo...':'Seleccionar archivo'}</div>
          <span className="text-[10px] text-slate-400">Formatos: JPG, PNG, WEBP (máx. 2MB)</span>
          <input type="file" accept="image/*" className="sr-only" onChange={handleImg}/>
        </label>
        {preview&&<img src={preview} alt="Preview" className="mt-4 rounded-xl max-h-48 object-cover border border-slate-200 shadow-sm"/>}
        {settings?.loginBg&&!preview&&<img src={settings.loginBg} alt="Fondo actual" className="mt-4 rounded-xl max-h-48 object-cover border border-slate-200 shadow-sm"/>}
      </Card>
    );
  };

  const UsuariosConfig = () => {
    const [usuarios, setUsuarios] = useState([]);
    const [showPwd, setShowPwd] = useState(false);
    const [modal,setModal]=useState(false);
    const [editId,setEditId]=useState(null);
    const [busy,setBusy]=useState(false);
    const MODULOS=[
      {id:'facturacion',label:'Ventas & Facturación',icon:'👥'},
      {id:'compras',label:'Compras & Proveedores',icon:'🛒'},
      {id:'inventario',label:'Control de Inventario',icon:'📦'},
      {id:'banco',label:'Bancos & Tesorería',icon:'🏦'},
      {id:'contabilidad',label:'Contabilidad / PUC',icon:'📋'},
      {id:'asientos',label:'Libro Diario',icon:'📒'},
      {id:'balances',label:'Estados Financieros',icon:'📊'},
      {id:'fiscal',label:'IVA & Fiscal',icon:'🧾'},
      {id:'activos_fijos',label:'Activos Fijos',icon:'🏗️'},
      {id:'configuracion',label:'Configuración',icon:'⚙️'},
    ];
    const initF=()=>({nombre:'',username:'',password:'',rol:'Usuario',permisos:{}});
    const [form,setForm]=useState(initF());

    useEffect(()=>{
      const u=onSnapshot(col('system_usuarios'),s=>{
        const docs=s.docs.map(d=>d.data());
        // Incluir el usuario admin por defecto
        const hasAdmin=docs.find(d=>d.username==='admin');
        if(!hasAdmin) docs.unshift({id:'admin',nombre:'Administrador Maestro',username:'admin',rol:'Master',permisos:{},activo:true});
        setUsuarios(docs);
      });
      return()=>u();
    },[]);

    const save=async()=>{
      if(!form.nombre||!form.username||(!editId&&!form.password)) return alert('Nombre, usuario y contraseña son requeridos');
      setBusy(true);
      try {
        const id=editId||gid();
        await setDoc(dref('system_usuarios',id),{id,...form,activo:true,ts:serverTimestamp()},{merge:true});
        setModal(false); setForm(initF()); setEditId(null);
      } finally { setBusy(false); }
    };

    const togglePermiso=(mod)=>setForm({...form,permisos:{...form.permisos,[mod]:!form.permisos[mod]}});

    const abrirEdicion=(u)=>{
      setEditId(u.id);
      setForm({nombre:u.nombre,username:u.username,password:'',rol:u.rol||'Usuario',permisos:u.permisos||{}});
      setModal(true);
    };

    return (
      <div className="space-y-5">
        <Card title="Directorio de Usuarios" subtitle={`${usuarios.length} usuario(s) registrado(s)`}
          action={<Bg onClick={()=>{setForm(initF());setEditId(null);setModal(true);}} sm><UserPlus size={12}/> Nuevo Usuario</Bg>}>
          <table className="w-full"><thead><tr><Th>Nombre</Th><Th>Usuario (ID)</Th><Th>Rol</Th><Th>Permisos</Th><Th>Estado</Th><Th></Th></tr></thead>
            <tbody>
              {usuarios.map(u=><tr key={u.id} className="hover:bg-slate-50">
                <Td className="font-black text-slate-900 uppercase">{u.nombre}</Td>
                <Td mono className="text-slate-600">{u.username}</Td>
                <Td><Badge v={u.rol==='Master'?'red':u.rol==='Admin'?'gold':'blue'}>{u.rol||'Usuario'}</Badge></Td>
                <Td className="text-[10px] text-slate-400">{u.rol==='Master'?'Acceso total':Object.keys(u.permisos||{}).filter(k=>u.permisos[k]).length+' módulo(s)'}</Td>
                <Td><Badge v={u.activo!==false?'green':'gray'}>{u.activo!==false?'Activo':'Inactivo'}</Badge></Td>
                <Td>
                  <div className="flex gap-1">
                    {u.username!=='admin'&&<><button onClick={()=>abrirEdicion(u)} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg"><Settings size={12}/></button>
                    <button onClick={async()=>{if(!window.confirm(`¿Eliminar usuario ${u.nombre}?`))return;await deleteDoc(dref('system_usuarios',u.id));}} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg"><Trash2 size={12}/></button></>}
                  </div>
                </Td>
              </tr>)}
            </tbody>
          </table>
        </Card>

        <Modal open={modal} onClose={()=>{setModal(false);setForm(initF());setEditId(null);}} title={editId?'Editar Usuario':'Nuevo Usuario'} wide
          footer={<><Bo onClick={()=>{setModal(false);setForm(initF());setEditId(null);}}>Cancelar</Bo><Bg onClick={save} disabled={busy}>{busy?'Guardando...':'Guardar Usuario'}</Bg></>}>
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <FG label="Nombre Completo" full><input className={inp} value={form.nombre} onChange={e=>setForm({...form,nombre:e.target.value.toUpperCase()})} placeholder="JUAN PÉREZ"/></FG>
              <FG label="Usuario (ID)"><input className={inp} value={form.username} onChange={e=>setForm({...form,username:e.target.value.toLowerCase().replace(/\s/g,'')})} placeholder="jperez"/></FG>
              <FG label={editId?'Nueva Contraseña (vacío = sin cambio)':'Contraseña *'}>
                <div className="relative">
                  <input type={showPwd?'text':'password'} className={inp} value={form.password} onChange={e=>setForm({...form,password:e.target.value})} placeholder="••••••••"/>
                  <button type="button" onClick={()=>setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors">
                    {showPwd ? <EyeOff size={14}/> : <Eye size={14}/>}
                  </button>
                </div>
              </FG>
              <FG label="Rol / Cargo"><select className={sel} value={form.rol} onChange={e=>setForm({...form,rol:e.target.value})}>
                <option value="Master">Master — Acceso Total</option>
                <option value="Admin">Admin — Sin restricciones</option>
                <option value="Contador">Contador</option>
                <option value="Tesorero">Tesorero</option>
                <option value="Usuario">Usuario — Permisos personalizados</option>
              </select></FG>
            </div>
            {form.rol==='Usuario'&&(
              <div>
                <p className="text-[10px] font-black uppercase text-slate-600 mb-3 tracking-wide">Permisos de Módulos</p>
                <div className="grid grid-cols-2 gap-2">
                  {MODULOS.map(m=>(
                    <label key={m.id} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${form.permisos[m.id]?'border-blue-500 bg-blue-50':'border-slate-200 hover:border-slate-300'}`}>
                      <input type="checkbox" checked={!!form.permisos[m.id]} onChange={()=>togglePermiso(m.id)} className="accent-blue-500 w-4 h-4"/>
                      <span className="text-[11px] font-semibold text-slate-700">{m.icon} {m.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Modal>
      </div>
    );
  };

  // ── Respaldo & Formateo ──────────────────────────────────────────────
  const RespaldoConfig = () => {
    const [busy,setBusy]=useState('');
    const [frecuencia,setFrecuencia]=useState('manual');
    const [horaEjecucion,setHoraEjecucion]=useState('08:00');
    const [lastBackup,setLastBackup]=useState(settings?.lastBackup||null);
    const [carpeta,setCarpeta]=useState('C:\\Respaldos\\GYB_ERP');
    const COLS_ADMIN=[
      {col:'banco_movimientos',label:'Movimientos Bancarios'},
      {col:'banco_cuentas',label:'Cuentas Bancarias'},
      {col:'banco_tasas',label:'Tasas de Cambio'},
      {col:'banco_conciliaciones',label:'Conciliaciones'},
      {col:'facturacion_clientes',label:'Clientes, OPs y Facturas'},
      {col:'facturacion_facturas',label:'Facturas'},
      {col:'compras_proveedores',label:'Proveedores'},
      {col:'inv_productos',label:'Inventario (Kardex)'},
      {col:'inv_movimientos',label:'Movimientos Inventario'},
    ];
    const COLS_CONT=[
      {col:'cont_cuentas',label:'Plan de Cuentas'},
      {col:'cont_asientos',label:'Asientos Contables y Libro Diario'},
      {col:'cont_periodos',label:'Períodos Contables'},
      {col:'activos_fijos',label:'Activos Fijos y Depreciación'},
    ];
    const hacerBackup=async(cols,tipo)=>{
      setBusy(tipo);
      try {
        const bk={version:'1.0',tipo,fecha:today(),ts:Date.now(),data:{}};
        for(const c of cols){ await new Promise(res=>{const u=onSnapshot(col(c.col),s=>{bk.data[c.col]=s.docs.map(d=>d.data());u();res();});}); }
        const blob=new Blob([JSON.stringify(bk,null,2)],{type:'application/json'});
        const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`backup_${tipo}_${today()}.json`;a.click();URL.revokeObjectURL(url);
        await setDoc(dref('settings','general'),{lastBackup:today(),ts:serverTimestamp()},{merge:true});
        setLastBackup(today());
        alert(`✅ Backup de ${tipo} descargado.\n⚠️ Mueve el archivo a: ${carpeta}`);
      } finally { setBusy(''); }
    };
    const importarBackup=async(e)=>{
      const file=e.target.files[0];if(!file)return;
      const pwd=prompt('Clave de administrador:');
      if(pwd!=='1234'&&pwd?.toLowerCase()!=='admin'){alert('Clave incorrecta.');e.target.value='';return;}
      setBusy('import');
      try {
        const json=JSON.parse(await file.text());const batch=writeBatch(db);
        Object.entries(json.data||{}).forEach(([cn,docs])=>docs.forEach(d=>{if(d.id)batch.set(dref(cn,d.id),d);}));
        await batch.commit();
        alert(`✅ Respaldo importado: ${Object.keys(json.data||{}).length} colecciones restauradas.`);
      } catch(err){ alert('Error: '+err.message); } finally { setBusy(''); e.target.value=''; }
    };
    const limpiarSilente=(cn)=>new Promise(res=>{const u=onSnapshot(col(cn),async s=>{u();const b=writeBatch(db);s.docs.forEach(d=>b.delete(d.ref));await b.commit();res();});});
    const reiniciar=async(tipo)=>{
      const cols=tipo==='admin'?COLS_ADMIN:COLS_CONT;
      if(!window.confirm(`⚠️ REINICIAR SISTEMA (${tipo.toUpperCase()})\nEsto elimina TODOS los datos del área ${tipo}. ¿Seguro?`))return;
      if(prompt('Escriba: REINICIAR')!=='REINICIAR')return alert('Cancelado.');
      setBusy('reset_'+tipo);
      try{ for(const c of cols)await limpiarSilente(c.col); alert(`✅ Sistema ${tipo} reiniciado.`); }
      finally{ setBusy(''); }
    };
    return (
      <div className="space-y-5">
        <Card title="Respaldar Sistema" subtitle="Datos JSON + instrucciones App.jsx">
          <div className="space-y-4">
            <div className="bg-slate-50 rounded-xl p-4 grid grid-cols-2 gap-1">
              {[...COLS_ADMIN,...COLS_CONT].map(c=><div key={c.col} className="flex items-center gap-2"><CheckCircle size={11} className="text-emerald-500 flex-shrink-0"/><p className="text-[10px] text-slate-600">{c.label}</p></div>)}
            </div>
            <FG label="📁 CARPETA DE RESPALDO (🔒 Admin)">
              <div className="flex gap-2">
                <input className={inp} value={carpeta} onChange={e=>setCarpeta(e.target.value)} placeholder="C:\Respaldos\GYB_ERP"/>
                <button className="flex-shrink-0 px-3 py-2 bg-orange-500 text-white rounded-xl text-[10px] font-black uppercase hover:bg-orange-600">Cambiar</button>
              </div>
              <p className="text-[9px] text-amber-600 mt-1">⚠ El navegador descarga a tu carpeta de Descargas. Mueve el archivo a la ruta configurada.</p>
            </FG>
            <div>
              <p className="text-[9px] font-black uppercase text-slate-600 mb-2 tracking-widest">⏰ FRECUENCIA DE RECORDATORIO</p>
              <div className="flex gap-2">{['manual','diario','semanal','mensual'].map(f=>(
                <button key={f} onClick={()=>setFrecuencia(f)} className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${frecuencia===f?'bg-emerald-600 text-white':'bg-white border border-slate-200 text-slate-600'}`}>{f}</button>
              ))}</div>

              {/* Hora de ejecución automática - solo cuando no es manual */}
              {frecuencia!=='manual'&&(
                <div className="mt-3 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                  <p className="text-[9px] font-black uppercase text-emerald-700 tracking-widest mb-2">⏰ HORA DE EJECUCIÓN AUTOMÁTICA</p>
                  <div className="flex items-start gap-4">
                    <div className="relative">
                      <input type="time" value={horaEjecucion} onChange={e=>setHoraEjecucion(e.target.value)}
                        className="border-2 border-emerald-300 rounded-xl px-4 py-3 text-sm font-black text-slate-900 outline-none focus:border-emerald-500 bg-white w-36"/>
                    </div>
                    <p className="text-[10px] text-emerald-700 leading-relaxed mt-1">
                      El sistema ejecutará el respaldo automáticamente a esta hora cada {frecuencia==='diario'?'día':frecuencia==='semanal'?'semana':'mes'} mientras el sistema esté abierto.
                    </p>
                  </div>
                </div>
              )}
            </div>
            {lastBackup&&<p className="text-[10px] text-emerald-600 font-black">✓ Último respaldo: {lastBackup}</p>}
            <div className="grid grid-cols-2 gap-3">
              <button onClick={()=>hacerBackup(COLS_ADMIN,'Administracion')} disabled={!!busy} className="flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-xl font-black text-[10px] uppercase hover:bg-emerald-700 disabled:opacity-50">{busy==='Administracion'?<><RefreshCw size={12} className="animate-spin"/> Generando...</>:<><Download size={12}/> Respaldar Administración</>}</button>
              <button onClick={()=>hacerBackup(COLS_CONT,'Contabilidad')} disabled={!!busy} className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase hover:bg-blue-700 disabled:opacity-50">{busy==='Contabilidad'?<><RefreshCw size={12} className="animate-spin"/> Generando...</>:<><Download size={12}/> Respaldar Contabilidad</>}</button>
            </div>
          </div>
        </Card>
        <Card title="📥 Importar Respaldo JSON" subtitle="Requiere clave admin">
          <label className="flex items-center justify-center gap-3 px-6 py-4 bg-blue-50 border-2 border-dashed border-blue-300 rounded-xl cursor-pointer hover:bg-blue-100 transition-colors">
            <Download size={16} className="text-blue-600"/>
            <span className="font-black text-sm text-blue-700 uppercase">{busy==='import'?'Importando...':'Seleccionar Archivo JSON'}</span>
            <input type="file" accept=".json" className="sr-only" onChange={importarBackup}/>
          </label>
        </Card>
        <Card title="Reiniciar Sistema" subtitle="Borrar todos los datos operativos">
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 grid grid-cols-2 gap-1">
            {[...COLS_ADMIN,...COLS_CONT].map(c=><p key={c.col} className="text-[10px] text-red-600">• Se borrará: {c.label}</p>)}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={()=>reiniciar('admin')} disabled={!!busy} className="flex items-center justify-center gap-2 px-4 py-3 bg-orange-600 text-white rounded-xl font-black text-[10px] uppercase hover:bg-orange-700 disabled:opacity-50">{busy==='reset_admin'?<><RefreshCw size={12} className="animate-spin"/> Reiniciando...</>:<><Trash2 size={12}/> Reiniciar Administración</>}</button>
            <button onClick={()=>reiniciar('contabilidad')} disabled={!!busy} className="flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-xl font-black text-[10px] uppercase hover:bg-red-700 disabled:opacity-50">{busy==='reset_contabilidad'?<><RefreshCw size={12} className="animate-spin"/> Reiniciando...</>:<><Trash2 size={12}/> Reiniciar Contabilidad</>}</button>
          </div>
        </Card>
      </div>
    );
  };

  const navGroups = [
    { group: 'General',    color:'#f97316', items: [{ id: 'empresa',  label: 'Datos de Empresa',      icon: Building2 },
                                                      { id: 'sistema',  label: 'Config. del Sistema',   icon: Settings }] },
    { group: 'Seguridad',  color:'#ef4444', items: [{ id: 'usuarios', label: 'Usuarios & Roles',       icon: Users }] },
    { group: 'Finanzas',   color:'#3b82f6', items: [{ id: 'tasas',    label: 'Tasa de Cambio',         icon: Globe }] },
    { group: 'Sistema',    color:'#dc2626', items: [{ id: 'respaldo', label: 'Respaldo & Formateo',    icon: Save }] },
  ];
  const curNav = navGroups.flatMap(g => g.items).find(n => n.id === sec);

  return (
    <SidebarLayout brand="Supply G&B" brandSub="Configuración Maestra" navGroups={navGroups} activeId={sec} onNav={setSec} onBack={() => { setAdminUnlocked(false); onBack(); }} accentColor="#8b5cf6"
      headerContent={<>
        <div><h1 className="font-black text-slate-800 text-sm uppercase tracking-wide">{curNav?.label}</h1><p className="text-[9px] text-slate-400 font-medium uppercase tracking-widest">Configuración <ChevronRight size={8} className="inline" /> {navGroups.find(g => g.items.find(i => i.id === sec))?.group}</p></div>
        <button onClick={() => setAdminUnlocked(false)} className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-500 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors"><Lock size={13} /> Bloquear</button>
      </>}>
      {sec === 'empresa' && <EmpresaConfig />}
      {sec === 'sistema' && <SistemaConfig />}
      {sec === 'tasas'    && <TasasConfig />}
      {sec === 'usuarios' && <UsuariosConfig />}
      {sec === 'respaldo' && <RespaldoConfig />}
    </SidebarLayout>
  );
}

// ============================================================================
// APP ROOT
// ============================================================================
export default function App() {
  const [view, setView] = useState('login');
  const [fbUser, setFbUser] = useState(null);
  const [settings, setSettings] = useState({});
  const [systemUsers] = useState([{ id: '1', username: 'admin', password: '1234', name: 'Administrador Master', role: 'Master' }]);
  const [tasasList, setTasasList] = useState([{ id: 't1', fecha: today(), modulo: 'Todos', moneda: 'USD', tasaRef: 39.50, fuente: 'Oficial / BCV' }]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    signInAnonymously(auth).catch(console.error);
    const unsub = onAuthStateChanged(auth, u => {
      setFbUser(u);
      if (u) {
        setLoading(false);
        onSnapshot(doc(db, 'settings', 'general'), d => {
          if (d.exists()) {
            const s=d.data();
            setSettings(s);
            // Update global letterhead data
            if(s.empresaRazonSocial) EMPRESA_DATA={
              razonSocial:s.empresaRazonSocial||EMPRESA_DATA.razonSocial,
              rif:s.empresaRif||EMPRESA_DATA.rif,
              direccion:s.empresaDireccion||EMPRESA_DATA.direccion,
              telefono:s.empresaTelefono||EMPRESA_DATA.telefono,
            };
          }
        });
        onSnapshot(query(col('banco_tasas'), orderBy('fecha', 'desc')), s => { if (!s.empty) setTasasList(s.docs.map(x => x.data())); });
      }
    });
    return () => unsub();
  }, []);

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: DARK }}>
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6" style={{ background: ORANGE }}><Blocks size={28} className="text-white animate-pulse" /></div>
      <div className="w-10 h-10 border-3 border-orange-500 border-t-transparent rounded-full animate-spin mb-4" style={{ border: `3px solid ${ORANGE}`, borderTopColor: 'transparent' }}></div>
      <p className="font-black uppercase text-xs tracking-[3px]" style={{ color: ORANGE }}>Iniciando Sistema ERP...</p>
    </div>
  );

  const go = (v) => setView(v);

  return (
    <ErrorBoundary>
      {view === 'login' && <LoginScreen onLogin={() => go('selector')} settings={settings} systemUsers={systemUsers} />}
      {view === 'selector' && <MainSelector onSelect={go} />}
      {view === 'admin_dash' && <AdminDash onSelectModule={go} onBack={() => go('selector')} />}
      {view === 'cont_dash' && <ContDash onSelectModule={go} onBack={() => go('selector')} />}
      {view === 'facturacion'  && <FacturacionApp fbUser={fbUser} tasasList={tasasList} onBack={() => go('admin_dash')} />}
      {view === 'compras'      && <ComprasApp fbUser={fbUser} onBack={() => go('admin_dash')} />}
      {view === 'inventario'   && <InventarioApp fbUser={fbUser} onBack={() => go('admin_dash')} />}
      {view === 'banco'        && <BancoApp fbUser={fbUser} onBack={() => go('admin_dash')} />}
      {view === 'contabilidad' && <ContabilidadApp fbUser={fbUser} onBack={() => go('cont_dash')} />}
      {view === 'asientos'     && <AsientosApp fbUser={fbUser} onBack={() => go('cont_dash')} />}
      {view === 'balances'     && <BalancesApp fbUser={fbUser} onBack={() => go('cont_dash')} />}
      {view === 'activos_fijos'&& <ActivosFijosApp fbUser={fbUser} onBack={() => go('cont_dash')} />}
      {view === 'fiscal'       && <FiscalApp fbUser={fbUser} onBack={() => go('cont_dash')} />}
      {view === 'configuracion' && <ConfiguracionApp settings={settings} systemUsers={systemUsers} tasasList={tasasList} onBack={() => go('admin_dash')} />}
    </ErrorBoundary>
  );
}

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

const letterheadOpen = (titulo, subtitulo='') => `
  <html><head><meta charset="utf-8"><title>${titulo}</title><style>${LETTERHEAD_CSS}</style></head><body>
  <div class="lh-header">
    <div class="lh-logo">
      <span class="supply">Supply</span><span class="g">G</span><span class="amp">&amp;</span><span class="b">B</span>
    </div>
    <div class="lh-company">
      <strong>Servicios Jiret G&amp;B, C.A.</strong>
      RIF: J-412309374 · Caracas, Venezuela<br>
      ERP — Sistema de Gestión Empresarial
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
    <span>Servicios Jiret G&amp;B, C.A. — RIF: J-412309374</span>
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
// MÓDULO BANCO & CAJA — ARQUITECTURA COMPLETA v3 (ACTUALIZADA)
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
const DENOM_USD = [100,50,20,10,5,1,0.50,0.25,0.10,0.05,0.01];

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
    
    // Mostrando saldo exacto sin letras K o M
    const fmtC = (n) => fmt(n); 

    const CuentaRow = ({c}) => {
      const bs=c.moneda==='BS';const eur=c.moneda==='EUR';
      const usdEq=bs?Number(c.saldo)/tasaActiva:Number(c.saldo);
      const bsEq=bs?Number(c.saldo):Number(c.saldo)*tasaActiva;
      const movsCta=movBanco.filter(m=>m.cuentaId===c.id);
      const pendientes=movsCta.filter(m=>m.estatus!=='Conciliado').length;
      const colorBorde=bs?'#3b82f6':eur?'#f59e0b':'#10b981';

      return(
        <div onClick={()=>setSec('movimientos')} className="bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-150 cursor-pointer p-4 mb-3 flex items-center justify-between group relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{background:colorBorde}} />
          <div className="flex items-center gap-4 pl-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{background:colorBorde+'12'}}>
              <Landmark size={18} style={{color:colorBorde}}/>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <p className="font-black text-slate-900 text-sm uppercase leading-none">{c.banco}</p>
                <span className="text-[9px] font-black px-1.5 py-0.5 rounded text-white" style={{background:bs?'#f97316':'#0f172a'}}>{c.moneda}</span>
              </div>
              <p className="font-mono text-[11px] text-slate-500">{c.numeroCuenta} <span className="ml-1 text-[9px] uppercase tracking-widest text-slate-400">· {c.tipoBanco}</span></p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="hidden md:block text-right">
              {pendientes>0 && <p className="text-[10px] font-black uppercase text-amber-600 mb-0.5 flex items-center gap-1 justify-end"><AlertTriangle size={10}/> {pendientes} Por conciliar</p>}
              <p className="text-[10px] font-semibold text-slate-400">{movsCta.length} Movimientos</p>
            </div>
            <div className="text-right">
              <p className="font-mono font-black text-lg text-slate-900 leading-none mb-1">{bs?'Bs.':(c.moneda==='USD'?'$':'€')} {fmt(c.saldo)}</p>
              <p className="font-mono text-[10px] text-slate-400">{bs?`≈ $${fmt(usdEq)}`:c.moneda==='EUR'?`≈ $${fmt(usdEq)} · Bs.${fmt(bsEq)}`:`≈ Bs.${fmt(bsEq)}`}</p>
            </div>
            <ChevronRight size={18} className="text-slate-300 group-hover:text-blue-500 transition-colors"/>
          </div>
        </div>
      );
    };

    return(<div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPI label="Bancos USD" value={`$${fmt(Math.max(0,totUSD))}`} accent="green" Icon={Building2} sub={`≈ Bs.${fmt(Math.max(0,totUSD)*tasaActiva)}`}/>
        <KPI label="Bancos Bs." value={`Bs.${fmt(Math.max(0,totBs))}`} accent="blue" Icon={Landmark} sub={`≈ $${fmt(Math.max(0,totBs)/tasaActiva)}`}/>
        <KPI label="Caja Bs." value={`Bs.${fmt(Math.max(0,cajaBs))}`} accent="gold" Icon={Banknote}/>
        <KPI label="Caja USD" value={`$${fmt(Math.max(0,cajaUSD))}`} accent="purple" Icon={DollarSign}/>
      </div>
      {cuentasNacBs.length>0&&<div>
        <div className="flex items-center gap-2 mb-3"><div className="w-1 h-5 rounded-full bg-blue-500"/><p className="font-black text-[10px] uppercase tracking-widest text-slate-700">Cuentas Nacionales · Bolívares</p><div className="flex-1 h-px bg-slate-100"/><div className="bg-blue-50 px-3 py-1 rounded-lg"><span className="text-[9px] font-black text-blue-700 uppercase">Total: Bs.{fmtC(totBs)}</span></div></div>
        <div className="flex flex-col">{cuentasNacBs.map(c=><CuentaRow key={c.id} c={c}/>)}</div>
      </div>}
      {cuentasExt.length>0&&<div>
        <div className="flex items-center gap-2 mb-3"><div className="w-1 h-5 rounded-full bg-emerald-500"/><p className="font-black text-[10px] uppercase tracking-widest text-slate-700">Moneda Extranjera</p><div className="flex-1 h-px bg-slate-100"/><div className="bg-emerald-50 px-3 py-1 rounded-lg"><span className="text-[9px] font-black text-emerald-700 uppercase">USD: ${fmtC(totUSD)} · EUR: €{fmtC(totEUR)}</span></div></div>
        <div className="flex flex-col">{cuentasExt.map(c=><CuentaRow key={c.id} c={c}/>)}</div>
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

    const exportarCuentas = (formato) => {
      const [nacBs, ext] = [
        cuentas.filter(c=>c.tipoBanco==='Nacional-Bs'),
        cuentas.filter(c=>c.tipoBanco==='Nacional-Ext'||c.tipoBanco==='Internacional'),
      ];
      const mkRows = (lista) => lista.map(c=>{
        const bs=c.moneda==='BS';
        return `<tr>
          <td style="font-weight:bold">${c.banco}</td>
          <td style="font-family:monospace">${c.numeroCuenta}</td>
          <td>${c.tipoCuenta||'—'}</td>
          <td>${c.moneda}</td>
          <td>${c.titular||'—'}</td>
          <td style="font-family:monospace;color:#1e40af">${c.cuentaContableCod||'—'}</td>
        </tr>`;
      }).join('');
      const thead=`<thead><tr><th>Banco</th><th>Nro. Cuenta</th><th>Tipo</th><th>Moneda</th><th>Titular</th><th>PUC</th></tr></thead>`;
      const content=letterheadOpen('Directorio de Cuentas Bancarias',`Titular: Servicios Jiret G&B, C.A. · RIF: J-412309374 · ${dd(today())}`)+
        `<h3 style="color:#1e3a5f;font-size:11px;text-transform:uppercase;letter-spacing:2px;margin:16px 0 8px">🇻🇪 Cuentas Nacionales — Bolívares</h3>
        <table>${thead}<tbody>${mkRows(nacBs)}</tbody></table>
        <h3 style="color:#065f46;font-size:11px;text-transform:uppercase;letter-spacing:2px;margin:20px 0 8px">💵 Cuentas Moneda Extranjera</h3>
        <table>${thead}<tbody>${mkRows(ext)}</tbody></table>`+
        letterheadClose(`${cuentas.length} cuenta(s) registrada(s)`);
      if(formato==='pdf'){ printWindow(content); return; }
      const blob=new Blob([content],{type:'application/vnd.ms-excel;charset=utf-8'});
      const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`directorio_cuentas_${today()}.xls`;a.click();URL.revokeObjectURL(url);
    };

    return (
      <div className="space-y-5">
        <style>{PRINT_STYLE}</style>
        {/* Botones de acción */}
        <div className="flex gap-3 justify-end">
          <button onClick={()=>exportarCuentas('pdf')} className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase hover:bg-red-700"><FileText size={12}/> PDF</button>
          <button onClick={()=>exportarCuentas('excel')} className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-xl text-[10px] font-black uppercase hover:bg-green-700"><FileSpreadsheet size={12}/> Excel</button>
          <Bg onClick={openNew}><Plus size={12}/> Nueva Cuenta</Bg>
        </div>
        {[
          {label:'🇻🇪 Cuentas Nacionales — Bolívares',  tipos:['Nacional-Bs'],  colorHeader:'#1e3a5f', accent:'#3b82f6'},
          {label:'💵 Cuentas Moneda Extranjera / Internacional', tipos:['Nacional-Ext','Internacional'], colorHeader:'#1a3a2a', accent:'#10b981'},
        ].map(grupo=>{
          const lista=cuentas.filter(c=>grupo.tipos.includes(c.tipoBanco||'Nacional-Bs'));
          return (
            <div key={grupo.label} className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
              <div className="px-5 py-3 flex items-center justify-between" style={{background:grupo.colorHeader}}>
                <p className="font-black text-white text-xs uppercase tracking-widest">{grupo.label}</p>
              </div>
              {lista.length===0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">Sin cuentas en esta categoría</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead><tr className="bg-slate-50 border-b border-slate-100"><Th>Banco</Th><Th>Nro. Cuenta</Th><Th>Tipo de Cta.</Th><Th>PUC</Th><Th>Titular</Th><Th>Moneda</Th><Th></Th></tr></thead>
                    <tbody>
                      {lista.map(c=>{
                        const bs=c.moneda==='BS';
                        return <tr key={c.id} className="hover:bg-blue-50/30 border-b border-slate-50">
                          <Td className="font-black text-slate-900">{c.banco}</Td>
                          <Td mono className="text-[11px] text-slate-600">{c.numeroCuenta}</Td>
                          <Td className="text-[10px] text-slate-500">{c.tipoCuenta||'—'}</Td>
                          <Td mono className="text-[10px] text-blue-600 font-black">{c.cuentaContableCod||'—'}</Td>
                          <Td className="uppercase text-[10px] text-slate-400 max-w-[100px] truncate">{c.titular||'—'}</Td>
                          <Td><Pill usd={!bs}>{c.moneda}</Pill></Td>
                          <Td>
                            <div className="flex gap-1 justify-end">
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

        {/* ── MODAL NUEVA/EDITAR CUENTA ── */}

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
            <FG label={`Saldo Inicial (${monedaDe(form.tipoBanco)})`}><input type="number" step="0.01" className={inp} value={form.saldo} onChange={e=>setForm({...form,saldo:e.target.value})}/></FG>
            <FG label="Cuenta Contable Asociada (PUC)">
              <select className={sel} value={form.cuentaContableCod} onChange={e=>{const c=contCuentas.find(x=>x.codigo===e.target.value);setForm({...form,cuentaContableCod:e.target.value,cuentaContableNom:c?.nombre||''})}}>
                <option value="">— Sin vincular al PUC —</option>
                {[...contCuentas].filter(c=>String(c.codigo).startsWith('1')).sort((a,b)=>String(a.codigo).localeCompare(String(b.codigo))).map(c=><option key={c.id} value={c.codigo}>{c.codigo} · {c.nombre}</option>)}
              </select>
            </FG>
          </div>
        </Modal>
      </div>
    );
  };

  // ══════════════════════════════════════════════════════════════════════
  // 3. MOVIMIENTOS BANCARIOS
  // ══════════════════════════════════════════════════════════════════════
  const MovimientosView = () => {
    const [modal, setModal]       = useState(false);
    const [detalleId, setDetalle] = useState(null);
    const [editId, setEditId]     = useState(null);
    const [busy, setBusy]         = useState(false);
    const [filtC,    setFiltC]    = useState('');
    const [filtDesde,setFiltD]    = useState('');
    const [filtHasta,setFiltH]    = useState('');
    const [monedaVista,setMonedaVista] = useState('BS'); 
    const [busqCtas, setBusqCtas] = useState({});
    const [searchTercero, setSearchTercero] = useState('');
    const [searchBanco,   setSearchBanco]   = useState('');

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
      tasaCaja:'',montoCaja:''
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

        const ctaBancoNom  = cuentaSel?.cuentaContable?.split('·')[1]?.trim()||`Banco ${cuenta.banco}`;
        const ctaContraNom = form.ctaContraNombre?.split('·')[1]?.trim()||form.ctaContraNombre||(form.tipo==='Ingreso'?'Cuentas por Cobrar':'Cuentas por Pagar');
        const asientoDebito  = form.tipo==='Ingreso' ? ctaBancoNom  : ctaContraNom;
        const asientoCredito = form.tipo==='Ingreso' ? ctaContraNom : ctaBancoNom;

        const yyyymm = form.fecha.substring(0,7).replace('-','');
        const numComp = `CB-${yyyymm}-${String(movBanco.filter(m=>m.fecha?.startsWith(form.fecha.substring(0,7))).length+1).padStart(4,'0')}`;
        const mesLabel = form.fecha.substring(5,7)+'/'+form.fecha.substring(0,4);
        const esMonedaLocal = cuenta.moneda === 'BS';
        
        const bancoBs=esMonedaLocal?montoBs:montoUSD*tasa;
        const bancoUSD=esMonedaLocal?montoBs/tasa:montoUSD;
        const esIngreso=form.tipo==='Ingreso';
        const debitLinea = {
          codigo:cuentaSel?.cuentaContableCod||'',
          cuenta:cuentaSel?.cuentaContableNom||`Banco ${cuenta.banco}`,
          tipoLinea:esIngreso?'D':'H',
          nroDoc:form.referencia||'',
          concepto:form.concepto,tasa,
          debeBs:esIngreso?bancoBs:0,haberBs:esIngreso?0:bancoBs,
          debeUSD:esIngreso?bancoUSD:0,haberUSD:esIngreso?0:bancoUSD,
        };
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

    const movDetalle = movBanco.find(m=>m.id===detalleId);

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

    const [adminPwd, setAdminPwd]   = useState('');
    const [pwdModal, setPwdModal]   = useState(null); 
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

    const BancoInfoPanel = ({ cuentaId }) => {
      const cuenta = cuentas.find(c=>c.id===cuentaId);
      if(!cuenta) return null;
      const bs = cuenta.moneda==='BS';
      const movCta = movBanco.filter(m=>m.cuentaId===cuentaId);
      const ultConcil = concils.filter(c=>c.cuentaId===cuentaId).sort((a,b)=>b.fecha?.localeCompare(a.fecha||'')||0)[0];
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

        {/* ── FILTROS + TABLA ── */}
        <Card title="Movimientos Bancarios" subtitle="Ingresos · Egresos · Transferencias"
          action={<div className="flex gap-2 flex-wrap items-center">
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
              <thead><tr><Th>Fecha</Th><Th>Tipo</Th><Th>Banco</Th><Th>Concepto</Th><Th>Tercero</Th><Th>Ref.</Th><Th right>{monedaVista==='BS'?'Monto Bs.':'Monto USD'}</Th><Th right>{monedaVista==='BS'?'Equiv. USD':'Equiv. Bs.'}</Th><Th right>Tasa</Th><Th>Estado</Th><Th></Th></tr></thead>
              <tbody>
                {movFilt.length===0&&<tr><td colSpan={11}><EmptyState icon={ArrowLeftRight} title="Sin movimientos" desc="Registre transacciones bancarias"/></td></tr>}
                {movFilt.map(m=><tr key={m.id} className="hover:bg-slate-50 cursor-pointer" onClick={()=>setDetalle(m.id)}>
                  <Td>{dd(m.fecha)}</Td>
                  <Td><Badge v={m.tipo==='Ingreso'?'green':m.tipo==='Egreso'?'red':'blue'}>{m.tipo}</Badge></Td>
                  <Td className="text-[11px] font-semibold max-w-[80px] truncate">{m.cuentaNombre}</Td>
                  <Td className="max-w-[120px] truncate">{m.concepto}</Td>
                  <Td className="text-[10px] max-w-[100px]">{m.aplicaTercero?<p className="font-bold text-slate-700 truncate">{m.terceroNombre}</p>:<span className="text-slate-300">—</span>}</Td>
                  <Td mono className="text-slate-400 text-[10px]">{m.referencia||'—'}</Td>
                  <Td right mono className={`font-black ${m.tipo==='Ingreso'?'text-emerald-600':'text-red-500'}`}>{monedaVista==='BS'?`Bs.${fmt(m.montoBs)}`:`$${fmt(m.montoUSD)}`}</Td>
                  <Td right mono className="text-slate-400 text-xs">{monedaVista==='BS'?`$${fmt(m.montoUSD)}`:`Bs.${fmt(m.montoBs)}`}</Td>
                  <Td right mono className="text-slate-400 text-[10px]">{m.tasa}</Td>
                  <Td><Badge v={m.estatus==='Conciliado'?'green':'gray'}>{m.estatus||'Pendiente'}</Badge></Td>
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

            {form.tipo!=='Transferencia'&&form.tipo!=='Traslado Banco→Caja'
              ? <CuentaSelector value={form.cuentaId} onChange={v=>setForm({...form,cuentaId:v})} label={`Cuenta Bancaria (${cuentas.length} disponibles)`}/>
              : <div className="grid grid-cols-2 gap-4">
                  <CuentaSelector value={form.cuentaId} onChange={v=>setForm({...form,cuentaId:v})} label={form.tipo==='Traslado Banco→Caja'?'🏦 Banco Origen (débito)':'🏦 Banco Origen'} excluirId={form.cuentaDestinoId}/>
                  {form.tipo==='Transferencia'&&<CuentaSelector value={form.cuentaDestinoId} onChange={v=>setForm({...form,cuentaDestinoId:v})} label="🏦 Banco Destino" excluirId={form.cuentaId}/>}
                </div>
            }

            {form.cuentaId && <BancoInfoPanel cuentaId={form.cuentaId}/>}

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

            <FG label="Concepto / Descripción" full><input className={inp} value={form.concepto} onChange={e=>setForm({...form,concepto:e.target.value})} placeholder="Descripción del movimiento..."/></FG>

            {form.tipo!=='Transferencia' && cuentaSel && (
              <div className="rounded-2xl overflow-hidden border border-blue-100">
                <div className="px-5 py-3 bg-blue-600 flex items-center gap-2">
                  <BookOpen size={14} className="text-blue-200"/>
                  <p className="text-[10px] font-black uppercase text-white tracking-widest">
                    Asiento Contable — {bs?'Bs. (moneda funcional) + equiv. USD':'USD (moneda funcional) + equiv. Bs.'}
                  </p>
                </div>
                <div className="p-4 bg-blue-50 space-y-3">
                  <div className="grid gap-1 text-[8px] font-black uppercase text-slate-500 tracking-widest px-1"
                    style={{gridTemplateColumns:'2.5fr 1fr 1fr 1fr 1fr 28px'}}>
                    <div>Cuenta Contable</div>
                    <div className="text-right text-emerald-600">Debe Bs.</div>
                    <div className="text-right text-red-500">Haber Bs.</div>
                    <div className="text-right text-emerald-700">Debe USD</div>
                    <div className="text-right text-red-600">Haber USD</div>
                    <div></div>
                  </div>

                  {(() => {
                    const bancoLbl = cuentaSel?.cuentaContableCod
                      ? `${cuentaSel.cuentaContableCod} · ${cuentaSel.banco}`
                      : `Banco ${cuentaSel.banco}`;
                    const esDebito = form.tipo==='Ingreso'||form.tipo==='Traslado Banco→Caja';
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

                  <p className="text-[9px] font-black uppercase text-slate-500 tracking-widest mt-1 mb-1">Contrapartidas</p>
                  {form.lineasContra.map((l,i)=>{
                    const busqCta = busqCtas[i]||'';
                    const setBusqCta = (v) => setBusqCtas(prev=>({...prev,[i]:v}));
                    const ctasFiltradas=[...contCuentas]
                      .filter(c=>!busqCta||(c.codigo+' '+c.nombre).toUpperCase().includes(busqCta.toUpperCase()))
                      .sort((a,b)=>String(a.codigo).localeCompare(String(b.codigo)));
                    return (
                      <div key={i} className="bg-white rounded-xl border border-slate-200 p-3 space-y-2">
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

                  <button onClick={()=>setForm({...form,lineasContra:[...form.lineasContra,{ctaId:'',ctaNom:'',debeBs:'',haberBs:'',debeUSD:'',haberUSD:''}]})}
                    className="flex items-center gap-1.5 text-[10px] font-black uppercase text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors">
                    <Plus size={12}/> Agregar Cuenta Contrapartida
                  </button>

                  {form.tipo==='Traslado Banco→Caja'&&(
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-[10px] text-amber-700 space-y-0.5">
                      <p className="font-black">💡 Traslado Banco → Caja con Rebancarización:</p>
                      <p>• Línea 1: <span className="font-mono">Traslados de Fondos</span> — Debe Bs. × (monto que entra a caja)</p>
                      <p>• Línea 2: <span className="font-mono">Diferencias en Compensación (Rebancarización)</span> — Debe Bs. × diferencial cambiario</p>
                    </div>
                  )}
                </div>
              </div>
            )}

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
        setModal(false); setForm(initF()); 
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
  // 5. ARQUEO DE CAJA
  // ══════════════════════════════════════════════════════════════════════
  const ArqueoCajaView = () => {
    const [modal, setModal] = useState(false);
    const [busy, setBusy]   = useState(false);
    const [moneda, setMoneda] = useState('BS');
    const [cantidades, setCants] = useState({});
    const denoms = moneda==='BS' ? DENOM_BS : DENOM_USD;
    const totalArqueo = denoms.reduce((a,d)=>a+(Number(cantidades[d]||0)*d),0);

    const save = async()=>{
      setBusy(true);
      try {
        const id=gid();
        await setDoc(dref('caja_arques',id),{id,fecha:today(),moneda,cantidades,totalArqueo,ts:serverTimestamp()});
        setModal(false); setCants({});
      } finally { setBusy(false); }
    };

    return (
      <div className="space-y-5">
        <div className="grid grid-cols-3 gap-4">
          <KPI label="Arqueos Realizados" value={arques.length} accent="blue" Icon={FileText}/>
          <KPI label="Último Arqueo Bs." value={`Bs.${fmt(arques.find(a=>a.moneda==='BS')?.totalArqueo||0)}`} accent="green" Icon={Banknote}/>
          <KPI label="Último Arqueo USD" value={`$${fmt(arques.find(a=>a.moneda==='USD')?.totalArqueo||0)}`} accent="gold" Icon={DollarSign}/>
        </div>
        <Card title="Historial de Arqueos" subtitle="Conteos físicos de caja" action={<Bg onClick={()=>{setCants({});setModal(true);}} sm><Plus size={12}/> Nuevo Arqueo</Bg>}>
          {arques.length===0?<EmptyState icon={Coins} title="Sin arqueos" desc="Realice el primer arqueo de caja"/>:
            <table className="w-full"><thead><tr><Th>Fecha</Th><Th>Moneda</Th><Th right>Total Contado</Th></tr></thead>
              <tbody>{arques.map(a=><tr key={a.id} className="hover:bg-slate-50">
                <Td>{dd(a.fecha)}</Td><Td><Pill usd={a.moneda==='USD'}>{a.moneda}</Pill></Td>
                <Td right mono className="font-black text-slate-900">{a.moneda==='BS'?'Bs.':'$'} {fmt(a.totalArqueo)}</Td>
              </tr>)}</tbody>
            </table>}
        </Card>

        <Modal open={modal} onClose={()=>setModal(false)} title="Arqueo de Caja — Conteo por Denominaciones" wide
          footer={<><Bo onClick={()=>setModal(false)}>Cancelar</Bo><Bg onClick={save} disabled={busy}>{busy?'Guardando...':'Guardar Arqueo'}</Bg></>}>
          <div className="space-y-5">
            <div className="flex gap-2">
              {[{m:'BS',l:'Bolívares 🇻🇪'},{m:'USD',l:'Dólares 🇺🇸'}].map(({m,l})=>(
                <button key={m} onClick={()=>{setMoneda(m);setCants({});}}
                  className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase border-2 transition-all ${moneda===m?'bg-slate-900 text-white border-slate-900':'bg-white text-slate-500 border-slate-200'}`}>{l}</button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {denoms.map(d=>(
                <div key={d} className="flex items-center gap-3 bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <div className="w-20 text-right"><p className="font-mono font-black text-slate-700">{moneda==='BS'?'Bs.':'$'} {d>=1?fmt(d):d}</p></div>
                  <div className="flex-1 flex items-center gap-2">
                    <p className="text-[10px] text-slate-400">×</p>
                    <input type="number" min="0" className={`${inp} text-center w-20`} value={cantidades[d]||''} onChange={e=>{const n={...cantidades};n[d]=e.target.value;setCants(n);}} placeholder="0"/>
                  </div>
                  <div className="w-24 text-right">
                    <p className="font-mono font-black text-slate-900">{moneda==='BS'?'Bs.':'$'} {fmt(d*(Number(cantidades[d])||0))}</p>
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

    const asientosMes = asientos.filter(a=>
      a.modulo==='Bancos' &&
      a.fecha?.startsWith(mes) &&
      (!filtBanco || a.movimientoBancoId && movBanco.find(m=>m.id===a.movimientoBancoId)?.cuentaId===filtBanco)
    );

    const movsMes = movBanco.filter(m=>
      m.fecha?.startsWith(mes) &&
      (m.asientoDebito||m.asientoCredito) &&
      (!filtBanco||m.cuentaId===filtBanco)
    );

    const rows = asientosMes.length > 0 ? asientosMes : movsMes.map(m=>({
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

  const views = {dashboard:<DashboardView/>,cuentas:<CuentasView/>,movimientos:<MovimientosView/>,conciliacion:<ConciliacionView/>,caja_op:<CajaOpView/>,arqueo:<ArqueoCajaView/>,proveedores:<ProveedoresView/>,reportes:<ReportesView/>,rpt_gral:<ReportesGeneralView/>,rpt_conc:<ConciliacionView/>,rpt_concepto:<ReporteConceptoView/>,rpt_comp:<ComprobantesBancariosView/>,tasas:<TasasView/>};
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

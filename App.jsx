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
  BookMarked, Coins, BadgeDollarSign, Inbox, Send
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
const DARK = '#0f172a';
const ORANGE = '#f97316';
const BLUE = '#3b82f6';
const BG = '#f1f5f9';

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

const Modal = ({ open, onClose, title, children, footer, wide }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4" style={{ background: 'rgba(15,23,42,.85)', backdropFilter: 'blur(4px)' }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={`bg-white rounded-2xl w-full ${wide ? 'max-w-3xl' : 'max-w-lg'} max-h-[92vh] flex flex-col shadow-2xl`}>
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

// Sidebar layout shared across all modules
const SidebarLayout = ({ brand, brandSub, navGroups, activeId, onNav, children, headerContent, onBack, accentColor = ORANGE }) => (
  <div className="flex h-screen overflow-hidden w-full">
    <aside className="w-60 flex flex-col h-screen overflow-y-auto flex-shrink-0" style={{ background: `linear-gradient(180deg, ${DARK} 0%, #1e293b 100%)` }}>
      <div className="px-5 py-5 border-b border-white/10 flex-shrink-0">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: accentColor }}><Blocks size={14} className="text-white" /></div>
          <span className="font-black text-white text-sm tracking-wide">{brand}</span>
        </div>
        <p className="text-[9px] text-slate-500 uppercase tracking-[2px] font-bold ml-9">{brandSub}</p>
      </div>
      <nav className="flex-1 py-3 overflow-y-auto">
        {navGroups.map(({ group, items }) => (
          <div key={group} className="mb-3">
            <p className="px-5 pb-1.5 text-[8px] font-black uppercase tracking-[2px] text-slate-600">{group}</p>
            {items.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => onNav(id)} className={`w-full flex items-center gap-3 px-5 py-2.5 text-left transition-all text-[11px] font-bold uppercase tracking-wide ${activeId === id ? 'text-white border-r-4 border-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                style={activeId === id ? { background: `${accentColor}cc` } : {}}>
                <Icon size={14} className="flex-shrink-0" /><span className="truncate">{label}</span>
              </button>
            ))}
          </div>
        ))}
      </nav>
      <div className="p-4 border-t border-white/5 flex-shrink-0">
        <button onClick={onBack} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors border border-white/10">
          <ArrowLeft size={13} /> Volver
        </button>
      </div>
    </aside>
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
    <div className="min-h-screen flex items-stretch">
      {/* Left panel */}
      <div className="hidden lg:flex flex-1 flex-col items-center justify-center p-16 relative overflow-hidden" style={{ background: 'linear-gradient(135deg,#0f172a 0%,#1e3a5f 50%,#0f172a 100%)' }}>
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle at 25% 25%, #f97316 1px, transparent 1px), radial-gradient(circle at 75% 75%, #3b82f6 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        <div className="relative z-10 text-center max-w-sm">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-2xl" style={{ background: ORANGE }}>
              <Blocks size={32} className="text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight mb-3">Supply <span style={{ color: ORANGE }}>G&B</span></h1>
          <p className="text-slate-400 text-sm font-medium leading-relaxed mb-10">Sistema ERP Profesional · Gestión Empresarial Integral</p>
          <div className="grid grid-cols-2 gap-4 text-left">
            {[{ icon: Receipt, t: 'Facturación', s: 'CxC multimoneda' }, { icon: Package, t: 'Inventario', s: 'Control de stock' }, { icon: Building2, t: 'Tesorería', s: 'Bancos y caja' }, { icon: BookOpen, t: 'Contabilidad', s: 'Plan de cuentas' }].map(({ icon: Icon, t, s }) => (
              <div key={t} className="bg-white/5 rounded-xl p-4 border border-white/10">
                <Icon size={20} className="mb-2" style={{ color: ORANGE }} />
                <p className="font-black text-white text-xs uppercase tracking-wide">{t}</p>
                <p className="text-slate-500 text-[10px] mt-0.5">{s}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 lg:max-w-md flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: ORANGE }}><Blocks size={20} className="text-white" /></div>
            <div><p className="font-black text-slate-900 text-lg">Supply <span style={{ color: ORANGE }}>G&B</span></p><p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">ERP</p></div>
          </div>

          <h2 className="font-black text-slate-900 text-2xl mb-1">Bienvenido de vuelta</h2>
          <p className="text-slate-500 text-sm mb-8">Ingrese sus credenciales para continuar</p>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">Usuario</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                <input type="text" required value={loginData.username} onChange={e => setLoginData({ ...loginData, username: e.target.value })} className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl py-3 pl-11 pr-4 text-sm font-semibold outline-none focus:border-orange-500 focus:bg-white transition-all text-slate-900" placeholder="admin" />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                <input type="password" required value={loginData.password} onChange={e => setLoginData({ ...loginData, password: e.target.value })} className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl py-3 pl-11 pr-4 text-sm font-semibold outline-none focus:border-orange-500 focus:bg-white transition-all text-slate-900" placeholder="••••••••" />
              </div>
            </div>
            {loginError && <div className="bg-red-50 text-red-500 text-[10px] font-black uppercase p-3 rounded-xl text-center border border-red-200">{loginError}</div>}
            <button type="submit" disabled={loading} className="w-full text-white font-black py-4 rounded-xl uppercase tracking-widest text-xs transition-all shadow-lg flex justify-center items-center gap-2 mt-2 disabled:opacity-70" style={{ background: loading ? '#94a3b8' : ORANGE }}>
              {loading ? <><RefreshCw size={14} className="animate-spin" /> Verificando...</> : <>Ingresar al Sistema <ArrowRight size={14} /></>}
            </button>
          </form>
          <p className="text-center text-[10px] text-slate-300 mt-8 font-medium uppercase tracking-widest">© {new Date().getFullYear()} Jiret G&B C.A.</p>
        </div>
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
    { id: 'facturacion', name: 'Ventas & Facturación', icon: Receipt, color: '#f97316', desc: 'Clientes, facturas y cuentas por cobrar' },
    { id: 'inventario', name: 'Control de Inventario', icon: Package, color: '#10b981', desc: 'Catálogo, stock y movimientos' },
    { id: 'banco', name: 'Bancos & Tesorería', icon: Building2, color: '#3b82f6', desc: 'Cuentas, movimientos y conciliación' },
    { id: 'configuracion', name: 'Configuración', icon: Settings, color: '#8b5cf6', desc: 'Empresa, usuarios y tasas de cambio' },
  ];
  return (
    <div className="min-h-screen flex flex-col" style={{ background: BG }}>
      <header className="px-8 py-4 flex items-center justify-between border-b border-white/10 shadow-lg" style={{ background: `linear-gradient(135deg,${DARK},#1e293b)` }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: ORANGE }}><Blocks size={18} className="text-white" /></div>
          <span className="text-white font-black text-lg tracking-wide">Supply <span style={{ color: ORANGE }}>G&B</span></span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => onSelectModule('configuracion')} className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/10 text-white hover:bg-white/20 transition-colors border border-white/10"><Settings size={16} /></button>
          <button onClick={onBack} className="px-4 py-2 rounded-xl border border-red-800/50 text-red-400 hover:bg-red-500 hover:text-white transition-colors flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"><LogOut size={13} /> Salir</button>
        </div>
      </header>
      <div className="flex-1 max-w-5xl mx-auto w-full p-10">
        <div className="mb-10">
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-[3px] mb-1">Panel Principal</p>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Área Administrativa</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {mods.map(mod => (
            <button key={mod.id} onClick={() => onSelectModule(mod.id)} className="group bg-white rounded-2xl p-7 text-left border border-slate-100 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform" style={{ background: mod.color + '15' }}>
                <mod.icon size={26} style={{ color: mod.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-black text-slate-900 text-sm uppercase tracking-wide mb-1">{mod.name}</h3>
                <p className="text-[11px] text-slate-400 font-medium">{mod.desc}</p>
              </div>
              <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-500 transition-colors flex-shrink-0" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ContDash({ onSelectModule, onBack }) {
  const mods = [
    { id: 'contabilidad', name: 'Plan de Cuentas', icon: BookOpen, color: '#3b82f6', desc: 'Estructura contable PUC, grupos y subcuentas' },
    { id: 'asientos', name: 'Libro Diario', icon: FileText, color: '#f97316', desc: 'Asientos de diario y comprobantes' },
    { id: 'balances', name: 'Balances & Reportes', icon: BarChart3, color: '#10b981', desc: 'Balance de comprobación y estado financiero' },
  ];
  return (
    <div className="min-h-screen flex flex-col" style={{ background: BG }}>
      <header className="px-8 py-4 flex items-center justify-between border-b border-white/10 shadow-lg" style={{ background: `linear-gradient(135deg,${DARK},#1e293b)` }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-blue-500"><Blocks size={18} className="text-white" /></div>
          <span className="text-white font-black text-lg tracking-wide">Supply <span className="text-blue-400">G&B</span></span>
        </div>
        <button onClick={onBack} className="px-4 py-2 rounded-xl border border-red-800/50 text-red-400 hover:bg-red-500 hover:text-white transition-colors flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"><LogOut size={13} /> Salir</button>
      </header>
      <div className="flex-1 max-w-4xl mx-auto w-full p-10">
        <div className="mb-10">
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-[3px] mb-1">Panel Principal</p>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Área Contable & Fiscal</h2>
        </div>
        <div className="space-y-4">
          {mods.map(mod => (
            <button key={mod.id} onClick={() => onSelectModule(mod.id)} className="group w-full bg-white rounded-2xl p-7 text-left border border-slate-100 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform" style={{ background: mod.color + '15' }}>
                <mod.icon size={26} style={{ color: mod.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-black text-slate-900 text-sm uppercase tracking-wide mb-1">{mod.name}</h3>
                <p className="text-[11px] text-slate-400 font-medium">{mod.desc}</p>
              </div>
              <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-500 transition-colors flex-shrink-0" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MÓDULO FACTURACIÓN & CxC
// ============================================================================
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
    const [modal, setModal] = useState(false);
    const [form, setForm] = useState({ nombre: '', rif: '', direccion: '', telefono: '', email: '', diasCredito: '0' });
    const [busy, setBusy] = useState(false);
    const [search, setSearch] = useState('');
    const filtered = clientes.filter(c => c.nombre?.includes(search.toUpperCase()) || c.rif?.includes(search.toUpperCase()));

    const save = async () => {
      if (!form.nombre || !form.rif) return alert('Nombre y RIF requeridos');
      setBusy(true);
      try {
        const id = gid(); await setDoc(dref('facturacion_clientes', id), { ...form, id, ts: serverTimestamp() });
        setModal(false); setForm({ nombre: '', rif: '', direccion: '', telefono: '', email: '', diasCredito: '0' });
      } finally { setBusy(false); }
    };

    return (
      <div>
        <Card title="Directorio de Clientes" subtitle={`${clientes.length} clientes registrados`}
          action={<div className="flex gap-2"><div className="relative"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..." className="border-2 border-slate-200 rounded-xl pl-8 pr-3 py-2 text-xs outline-none focus:border-orange-500 w-40" /></div><Bg onClick={() => setModal(true)} sm><Plus size={12} /> Nuevo</Bg></div>}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr><Th>RIF / NIT</Th><Th>Razón Social</Th><Th>Teléfono</Th><Th>Email</Th><Th>Días Crédito</Th><Th></Th></tr></thead>
              <tbody>
                {filtered.length === 0 && <tr><td colSpan={6}><EmptyState icon={Users} title="Sin clientes" desc="Registre su primer cliente" /></td></tr>}
                {filtered.map(c => <tr key={c.id} className="hover:bg-slate-50">
                  <Td mono className="font-black text-slate-900">{c.rif}</Td>
                  <Td className="uppercase font-semibold">{c.nombre}</Td>
                  <Td>{c.telefono || '—'}</Td>
                  <Td className="text-slate-400">{c.email || '—'}</Td>
                  <Td><span className="font-mono text-slate-700">{c.diasCredito} días</span></Td>
                  <Td><button onClick={() => deleteDoc(dref('facturacion_clientes', c.id))} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={12} /></button></Td>
                </tr>)}
              </tbody>
            </table>
          </div>
        </Card>
        <Modal open={modal} onClose={() => setModal(false)} title="Registrar Nuevo Cliente" footer={<><Bo onClick={() => setModal(false)}>Cancelar</Bo><Bg onClick={save} disabled={busy}>{busy ? 'Guardando...' : 'Guardar Cliente'}</Bg></>}>
          <div className="grid grid-cols-2 gap-4">
            <FG label="Razón Social" full><input className={inp} value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value.toUpperCase() })} placeholder="INVERSIONES EJEMPLO C.A." /></FG>
            <FG label="RIF / NIT"><input className={inp} value={form.rif} onChange={e => setForm({ ...form, rif: e.target.value.toUpperCase() })} placeholder="J-12345678-9" /></FG>
            <FG label="Teléfono"><input className={inp} value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} placeholder="0414-0000000" /></FG>
            <FG label="Email"><input type="email" className={inp} value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="contacto@empresa.com" /></FG>
            <FG label="Días de Crédito"><input type="number" className={inp} value={form.diasCredito} onChange={e => setForm({ ...form, diasCredito: e.target.value })} placeholder="15" /></FG>
            <FG label="Dirección Fiscal" full><input className={inp} value={form.direccion} onChange={e => setForm({ ...form, direccion: e.target.value })} placeholder="Dirección completa..." /></FG>
          </div>
        </Modal>
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
// MÓDULO BANCO & TESORERÍA — ARQUITECTURA COMPLETA
// ============================================================================
const TIPO_BANCO = [
  { id:'Nacional-Bs',   label:'Banco Nacional — Moneda Nacional (Bs.)',    moneda:'BS',  flag:'🇻🇪' },
  { id:'Nacional-Ext',  label:'Banco Nacional — Moneda Extranjera (USD)', moneda:'USD', flag:'🏦' },
  { id:'Internacional', label:'Banco Internacional (USD)',                  moneda:'USD', flag:'🌐' },
];
const esBs = (c) => c?.moneda === 'BS';

function BancoApp({ fbUser, onBack }) {
  const [sec, setSec] = useState('dashboard');
  const [cuentas, setCuentas]       = useState([]);
  const [movimientos, setMov]       = useState([]);
  const [conciliaciones, setConc]   = useState([]);
  const [tasas, setTasas]           = useState([]);
  const [clientes, setClientes]     = useState([]);
  const [facturas, setFacturas]     = useState([]);
  const [proveedores, setProv]      = useState([]);
  const [contCuentas, setContC]     = useState([]);

  useEffect(() => {
    if (!fbUser) return;
    const subs = [
      onSnapshot(col('banco_cuentas'), s => setCuentas(s.docs.map(d=>d.data()))),
      onSnapshot(query(col('banco_movimientos'), orderBy('fecha','desc')), s => setMov(s.docs.map(d=>d.data()))),
      onSnapshot(col('banco_conciliaciones'), s => setConc(s.docs.map(d=>d.data()))),
      onSnapshot(query(col('banco_tasas'), orderBy('fecha','desc')), s => setTasas(s.docs.map(d=>d.data()))),
      onSnapshot(col('facturacion_clientes'), s => setClientes(s.docs.map(d=>d.data()))),
      onSnapshot(query(col('facturacion_facturas'), orderBy('fechaEmision','desc')), s => setFacturas(s.docs.map(d=>d.data()))),
      onSnapshot(col('compras_proveedores'), s => setProv(s.docs.map(d=>d.data()))),
      onSnapshot(col('cont_cuentas'), s => setContC(s.docs.map(d=>d.data()))),
    ];
    return () => subs.forEach(u=>u());
  }, [fbUser]);

  const tasaActiva = tasas.find(t=>t.modulo==='Banco'||t.modulo==='Todos')?.tasaRef || tasas[0]?.tasaRef || 39.50;

  // ── 1. DASHBOARD ───────────────────────────────────────────────────────────
  const DashboardView = () => {
    const totUSD = cuentas.filter(c=>c.moneda!=='BS').reduce((a,c)=>a+Number(c.saldo||0),0);
    const totBs  = cuentas.filter(c=>c.moneda==='BS').reduce((a,c)=>a+Number(c.saldo||0),0);
    const ingMes = movimientos.filter(m=>m.tipo==='Ingreso'&&m.fecha?.startsWith(mesActual())).reduce((a,m)=>a+Number(m.montoUSD||0),0);
    const egrMes = movimientos.filter(m=>m.tipo==='Egreso' &&m.fecha?.startsWith(mesActual())).reduce((a,m)=>a+Number(m.montoUSD||0),0);
    const noConcil = movimientos.filter(m=>m.estatus!=='Conciliado').length;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPI label="Total USD" value={`$${fmt(totUSD)}`} accent="green" Icon={DollarSign} sub={`≈ Bs. ${fmt(totUSD*tasaActiva)}`}/>
          <KPI label="Total Bs." value={`Bs. ${fmt(totBs)}`} accent="blue" Icon={Banknote} sub={`≈ $${fmt(totBs/tasaActiva)}`}/>
          <KPI label="Ingresos del Mes" value={`$${fmt(ingMes)}`} accent="gold" Icon={ArrowUpCircle} sub={mesActual()}/>
          <KPI label="Pendientes Conciliar" value={noConcil} accent={noConcil>0?'red':'green'} Icon={RefreshCw} sub="movimientos sin conciliar"/>
        </div>
        <div className="grid lg:grid-cols-3 gap-4">
          {cuentas.map(c=>{
            const tb=TIPO_BANCO.find(t=>t.id===c.tipoBanco)||TIPO_BANCO[0];
            const bs=c.moneda==='BS';
            const mvCuenta=movimientos.filter(m=>m.cuentaId===c.id);
            const ultMov=mvCuenta[0];
            return (
              <div key={c.id} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-lg transition-all cursor-pointer" onClick={()=>setSec('movimientos')}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2"><span className="text-xl">{tb.flag}</span><div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center"><Landmark size={14} className="text-blue-500"/></div></div>
                  <div className="flex flex-col items-end gap-1"><Pill usd={!bs}>{c.moneda}</Pill>{c.cuentaContable&&<span className="text-[9px] font-black text-slate-400 uppercase">{c.cuentaContable}</span>}</div>
                </div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{tb.id}</p>
                <p className="text-[10px] font-black text-slate-700 uppercase mb-2">{c.banco}</p>
                <p className="font-mono font-black text-2xl text-slate-900">{bs?'Bs.':'$'} {fmt(c.saldo)}</p>
                {!bs&&<p className="text-[10px] text-slate-400 mt-0.5">≈ Bs. {fmt(Number(c.saldo)*tasaActiva)}</p>}
                {bs &&<p className="text-[10px] text-slate-400 mt-0.5">≈ ${fmt(Number(c.saldo)/tasaActiva)}</p>}
                <p className="text-[10px] text-slate-400 mt-2 font-mono">{c.numeroCuenta}</p>
                {ultMov&&<p className="text-[9px] text-slate-300 mt-1 uppercase">Últ. mov: {dd(ultMov.fecha)} · {ultMov.tipo}</p>}
              </div>
            );
          })}
          {cuentas.length===0&&<div className="lg:col-span-3"><EmptyState icon={Building2} title="Sin cuentas bancarias" desc="Registre sus cuentas bancarias"/></div>}
        </div>
        <div className="grid lg:grid-cols-2 gap-5">
          <Card title="Últimos Movimientos">
            {movimientos.length===0?<EmptyState icon={ArrowLeftRight} title="Sin movimientos" desc="Registre transacciones"/>:
              <table className="w-full"><thead><tr><Th>Fecha</Th><Th>Tipo</Th><Th>Banco</Th><Th>Concepto</Th><Th right>USD</Th><Th right>Bs.</Th></tr></thead>
                <tbody>{movimientos.slice(0,7).map(m=><tr key={m.id} className="hover:bg-slate-50">
                  <Td>{dd(m.fecha)}</Td>
                  <Td><Badge v={m.tipo==='Ingreso'?'green':m.tipo==='Egreso'?'red':'blue'}>{m.tipo}</Badge></Td>
                  <Td className="text-[11px] font-semibold max-w-[80px] truncate">{m.cuentaNombre}</Td>
                  <Td className="max-w-[140px] truncate">{m.concepto}</Td>
                  <Td right mono className={`font-black text-xs ${m.tipo==='Ingreso'?'text-emerald-600':'text-red-500'}`}>${fmt(m.montoUSD)}</Td>
                  <Td right mono className="text-slate-400 text-xs">Bs.{fmt(m.montoBs)}</Td>
                </tr>)}</tbody>
              </table>}
          </Card>
          <Card title="Posición Consolidada de Caja">
            <div className="space-y-3">
              {[...TIPO_BANCO].map(tb=>{
                const grupo=cuentas.filter(c=>c.tipoBanco===tb.id);
                if(!grupo.length) return null;
                const totG=grupo.reduce((a,c)=>a+Number(c.moneda==='BS'?Number(c.saldo)/tasaActiva:Number(c.saldo)),0);
                return (
                  <div key={tb.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                    <div className="flex items-center gap-2"><span>{tb.flag}</span><div><p className="text-[10px] font-black uppercase text-slate-700">{tb.id}</p><p className="text-[9px] text-slate-400">{grupo.length} cuenta{grupo.length!==1?'s':''}</p></div></div>
                    <p className="font-mono font-black text-slate-900">${fmt(totG)}</p>
                  </div>
                );
              })}
              <div className="flex items-center justify-between p-3 rounded-xl border-2 border-slate-900">
                <p className="font-black text-sm uppercase text-slate-900 tracking-wide">TOTAL CONSOLIDADO</p>
                <p className="font-mono font-black text-lg text-slate-900">${fmt(cuentas.reduce((a,c)=>a+(c.moneda==='BS'?Number(c.saldo)/tasaActiva:Number(c.saldo)),0))}</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  };

  // ── 2. CUENTAS (MAESTRO) ───────────────────────────────────────────────────
  const CuentasView = () => {
    const [modal, setModal] = useState(false);
    const [viewMode, setViewMode] = useState('list'); // list | cert
    const [certCuenta, setCertCuenta] = useState(null);
    const [form, setForm] = useState({banco:'',numeroCuenta:'',tipoCuenta:'Corriente',tipoBanco:'Nacional-Bs',saldo:'0',titular:'',cuentaContable:'',cuentaContableId:''});
    const [busy, setBusy] = useState(false);
    const monedaDe = (tb)=>TIPO_BANCO.find(t=>t.id===tb)?.moneda||'BS';
    const save = async()=>{
      if(!form.banco||!form.numeroCuenta) return alert('Banco y número requeridos');
      setBusy(true);
      try {
        const id=gid(); const moneda=monedaDe(form.tipoBanco);
        await setDoc(dref('banco_cuentas',id),{...form,id,moneda,saldo:Number(form.saldo),ts:serverTimestamp()});
        setModal(false); setForm({banco:'',numeroCuenta:'',tipoCuenta:'Corriente',tipoBanco:'Nacional-Bs',saldo:'0',titular:'',cuentaContable:'',cuentaContableId:''});
      } finally { setBusy(false); }
    };
    const canDelete = (c)=>!movimientos.find(m=>m.cuentaId===c.id);

    if (viewMode==='cert' && certCuenta) {
      const c=certCuenta; const bs=c.moneda==='BS';
      return (
        <div>
          <div className="flex gap-3 mb-5"><Bo onClick={()=>setViewMode('list')}><ArrowLeft size={13}/> Volver</Bo><button onClick={()=>window.print()} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700"><Download size={13}/> Imprimir / PDF</button></div>
          <div id="cert-print" className="bg-white rounded-2xl border-2 border-slate-200 p-10 max-w-2xl mx-auto">
            <div className="text-center border-b-2 border-slate-100 pb-6 mb-6">
              <div className="flex justify-center mb-3"><div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{background:'#f97316'}}><Blocks size={22} className="text-white"/></div></div>
              <p className="font-black text-xl text-slate-900 uppercase tracking-wide">Servicios Jiret G&B, C.A.</p>
              <p className="text-sm text-slate-500 mt-1">RIF: J-412309374 · Caracas, Venezuela</p>
            </div>
            <h2 className="text-center font-black text-lg text-slate-900 uppercase tracking-widest mb-6">Certificación de Cuenta Bancaria</h2>
            <div className="space-y-3">
              {[['Banco / Entidad Financiera',c.banco],['Tipo de Cuenta',c.tipoCuenta],['Número de Cuenta',c.numeroCuenta],['Moneda',c.moneda],['Clasificación',c.tipoBanco],['Titular',c.titular],['Cuenta Contable Asociada',c.cuentaContable||'—'],['Saldo Actual',`${bs?'Bs.':'$'} ${fmt(c.saldo)}`],].map(([k,v])=>(
                <div key={k} className="flex gap-4 py-2 border-b border-slate-100">
                  <p className="w-48 text-[10px] font-black uppercase text-slate-400 tracking-widest pt-0.5">{k}</p>
                  <p className="font-semibold text-slate-900 flex-1">{v}</p>
                </div>
              ))}
            </div>
            <div className="mt-10 grid grid-cols-2 gap-8">
              <div className="border-t-2 border-slate-300 pt-3 text-center"><p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Elaborado por</p></div>
              <div className="border-t-2 border-slate-300 pt-3 text-center"><p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Aprobado por</p></div>
            </div>
            <p className="text-center text-[10px] text-slate-300 mt-8 uppercase tracking-widest">Documento generado el {dd(today())} · Supply ERP — Servicios Jiret G&B, C.A.</p>
          </div>
        </div>
      );
    }

    return (
      <div>
        <Card title="Cuentas Bancarias" subtitle={`${cuentas.length} cuentas — Tasa activa: ${tasaActiva} Bs/$`} action={<Bg onClick={()=>setModal(true)} sm><Plus size={12}/> Nueva Cuenta</Bg>}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr><Th>Clasificación</Th><Th>Banco</Th><Th>Nro. Cuenta</Th><Th>Titular</Th><Th>Cta. Contable</Th><Th>Moneda</Th><Th right>Saldo</Th><Th right>Equiv. $</Th><Th></Th></tr></thead>
              <tbody>
                {cuentas.length===0&&<tr><td colSpan={9}><EmptyState icon={Building2} title="Sin cuentas" desc="Registre cuentas bancarias"/></td></tr>}
                {cuentas.map(c=>{
                  const tb=TIPO_BANCO.find(t=>t.id===c.tipoBanco)||TIPO_BANCO[0]; const bs=c.moneda==='BS';
                  return <tr key={c.id} className="hover:bg-slate-50">
                    <Td><div className="flex items-center gap-1.5"><span>{tb.flag}</span><span className="text-[9px] font-black uppercase text-slate-500">{c.tipoBanco}</span></div></Td>
                    <Td className="font-semibold">{c.banco}</Td>
                    <Td mono className="text-[11px] text-slate-600">{c.numeroCuenta}</Td>
                    <Td className="uppercase text-[11px] text-slate-400 max-w-[100px] truncate">{c.titular}</Td>
                    <Td mono className="text-[10px] text-blue-600 font-black">{c.cuentaContable||'—'}</Td>
                    <Td><Pill usd={!bs}>{c.moneda}</Pill></Td>
                    <Td right mono className="font-black">{bs?'Bs.':'$'} {fmt(c.saldo)}</Td>
                    <Td right mono className="text-emerald-600 font-black">${fmt(bs?Number(c.saldo)/tasaActiva:Number(c.saldo))}</Td>
                    <Td>
                      <div className="flex gap-1">
                        <button onClick={()=>{setCertCuenta(c);setViewMode('cert');}} className="p-1.5 text-blue-400 hover:bg-blue-50 rounded-lg transition-colors" title="Certificación"><FileText size={12}/></button>
                        {canDelete(c)&&<button onClick={()=>deleteDoc(dref('banco_cuentas',c.id))} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={12}/></button>}
                      </div>
                    </Td>
                  </tr>;
                })}
              </tbody>
            </table>
          </div>
        </Card>
        <Modal open={modal} onClose={()=>setModal(false)} title="Registrar Cuenta Bancaria" wide footer={<><Bo onClick={()=>setModal(false)}>Cancelar</Bo><Bg onClick={save} disabled={busy}>{busy?'Guardando...':'Guardar Cuenta'}</Bg></>}>
          <div className="grid grid-cols-2 gap-4">
            <FG label="Clasificación de Banco" full>
              <div className="grid grid-cols-3 gap-2">
                {TIPO_BANCO.map(t=>(
                  <label key={t.id} className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 cursor-pointer transition-all ${form.tipoBanco===t.id?'border-blue-500 bg-blue-50':'border-slate-200 hover:border-slate-300'}`}>
                    <input type="radio" name="tipoBanco" value={t.id} checked={form.tipoBanco===t.id} onChange={e=>setForm({...form,tipoBanco:e.target.value})} className="sr-only"/>
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
            <FG label="Cuenta Contable Asociada (PUC)" full>
              <select className={sel} value={form.cuentaContableId} onChange={e=>{const c=contCuentas.find(x=>x.id===e.target.value);setForm({...form,cuentaContableId:e.target.value,cuentaContable:c?`${c.codigo} · ${c.nombre}`:''})}}>
                <option value="">— Sin vincular —</option>
                {contCuentas.filter(c=>String(c.codigo).startsWith('1')).sort((a,b)=>String(a.codigo).localeCompare(String(b.codigo))).map(c=><option key={c.id} value={c.id}>{c.codigo} · {c.nombre}</option>)}
              </select>
            </FG>
            <FG label={`Saldo Inicial (${monedaDe(form.tipoBanco)})`}><input type="number" step="0.01" className={inp} value={form.saldo} onChange={e=>setForm({...form,saldo:e.target.value})}/></FG>
          </div>
        </Modal>
      </div>
    );
  };

  // ── 3. TRANSACCIONES ───────────────────────────────────────────────────────
  const MovimientosView = () => {
    const [modal, setModal] = useState(false);
    const [busy, setBusy] = useState(false);
    const [filterCuenta, setFilter] = useState('');

    const initF = ()=>({fecha:today(),tipo:'Ingreso',cuentaId:'',cuentaDestinoId:'',
      origenIngreso:'Venta',motivoEgreso:'Pago Proveedor',
      concepto:'',referencia:'',tasa:String(tasaActiva),montoNativo:'',
      aplicaTercero:true,tipoTercero:'Cliente',terceroId:'',
      cerrarCxC:false,facturaId:'',
      cuentaContableContra:'',cuentaContableContraId:''});
    const [form,setForm] = useState(initF());

    const cuentaSel  = cuentas.find(c=>c.id===form.cuentaId);
    const cuentaDest = cuentas.find(c=>c.id===form.cuentaDestinoId);
    const bs     = cuentaSel?.moneda==='BS';
    const tasa   = Number(form.tasa)||tasaActiva;
    const mNat   = Number(form.montoNativo)||0;
    const montoBs  = bs ? mNat : mNat*tasa;
    const montoUSD = bs ? mNat/tasa : mNat;

    const tercerosSel = form.tipoTercero==='Cliente'
      ? clientes.map(c=>({id:c.id,label:`${c.rif} · ${c.nombre}`}))
      : form.tipoTercero==='Proveedor'
        ? proveedores.map(p=>({id:p.id,label:`${p.rif||''} · ${p.nombre}`}))
        : [...clientes.map(c=>({id:c.id,label:`C: ${c.nombre}`})),...proveedores.map(p=>({id:p.id,label:`P: ${p.nombre}`}))];

    const factPend = form.tipoTercero==='Cliente'
      ? facturas.filter(f=>f.clienteId===form.terceroId&&f.estado==='Pendiente')
      : [];

    // Sugerencia de cuenta contable contrapartida
    const sugerirCuenta = () => {
      if(form.tipo==='Ingreso')
        return form.origenIngreso==='Venta'
          ? contCuentas.filter(c=>c.nombre?.toUpperCase().includes('COBRAR')||c.nombre?.toUpperCase().includes('INGRES'))
          : contCuentas.filter(c=>c.nombre?.toUpperCase().includes('PRÉSTAMO')||c.nombre?.toUpperCase().includes('PASIV'));
      if(form.tipo==='Egreso')
        return form.motivoEgreso==='Pago Proveedor'
          ? contCuentas.filter(c=>c.nombre?.toUpperCase().includes('PAGAR')||c.nombre?.toUpperCase().includes('PROVEEDOR'))
          : contCuentas.filter(c=>c.nombre?.toUpperCase().includes('GASTO')||c.nombre?.toUpperCase().includes('NÓMIN'));
      return contCuentas;
    };

    const save = async()=>{
      if(!form.cuentaId||!form.montoNativo||!form.concepto) return alert('Cuenta, monto y concepto requeridos');
      if(form.tipo==='Transferencia'&&!form.cuentaDestinoId) return alert('Seleccione cuenta destino');
      if(form.aplicaTercero&&!form.terceroId) return alert('Seleccione el tercero');
      setBusy(true);
      try {
        const cuenta=cuentas.find(c=>c.id===form.cuentaId);
        const signo=form.tipo==='Ingreso'?1:-1;
        const nuevoSaldoOrigen=Number(cuenta.saldo)+signo*mNat;
        const id=gid(); const batch=writeBatch(db);
        const tercero=(form.tipo==='Ingreso'&&form.origenIngreso==='Venta')||form.tipoTercero==='Cliente'
          ?clientes.find(c=>c.id===form.terceroId)
          :proveedores.find(p=>p.id===form.terceroId);
        const factura=form.cerrarCxC&&form.facturaId?facturas.find(f=>f.id===form.facturaId):null;

        // Asiento contable sugerido (para referencia)
        const asientoDebito  = form.tipo==='Ingreso'  ? (cuentaSel?.cuentaContable||'BANCO')  : (form.cuentaContableContra||'CTA CONTRA');
        const asientoCredito = form.tipo==='Ingreso'  ? (form.cuentaContableContra||'CXC/ING') : (cuentaSel?.cuentaContable||'BANCO');

        batch.set(dref('banco_movimientos',id),{
          id,fecha:form.fecha,tipo:form.tipo,
          cuentaId:cuenta.id,cuentaNombre:cuenta.banco,tipoBanco:cuenta.tipoBanco,moneda:cuenta.moneda,
          origenIngreso:form.origenIngreso,motivoEgreso:form.motivoEgreso,
          concepto:form.concepto,referencia:form.referencia,
          tasa,montoNativo:mNat,montoBs,montoUSD,
          saldoAnterior:Number(cuenta.saldo),saldoResultante:nuevoSaldoOrigen,
          aplicaTercero:form.aplicaTercero,tipoTercero:form.tipoTercero,
          terceroId:tercero?.id||'',terceroNombre:tercero?.nombre||'',
          facturaId:factura?.id||'',facturaNumero:factura?.numero||'',
          asientoDebito,asientoCredito,
          estatus:'No Conciliado',ts:serverTimestamp()
        });
        batch.update(dref('banco_cuentas',cuenta.id),{saldo:nuevoSaldoOrigen});

        if(form.tipo==='Transferencia'&&cuentaDest){
          batch.update(dref('banco_cuentas',cuentaDest.id),{saldo:Number(cuentaDest.saldo)+mNat});
        }
        if(factura&&form.cerrarCxC){
          const ns=Math.max(0,factura.saldoUSD-montoUSD);
          batch.update(dref('facturacion_facturas',factura.id),{saldoUSD:ns,estado:ns<0.01?'Pagada':'Pendiente'});
        }
        await batch.commit();
        setModal(false); setForm(initF());
      } finally { setBusy(false); }
    };

    const movFilt = filterCuenta?movimientos.filter(m=>m.cuentaId===filterCuenta):movimientos;

    return (
      <div>
        <Card title="Movimientos Bancarios" subtitle="Ingresos · Egresos · Transferencias"
          action={<div className="flex gap-2">
            <select className="border-2 border-slate-200 rounded-xl px-3 py-1.5 text-xs outline-none focus:border-blue-500 text-slate-700 font-semibold" value={filterCuenta} onChange={e=>setFilter(e.target.value)}>
              <option value="">Todos los bancos</option>
              {cuentas.map(c=><option key={c.id} value={c.id}>{c.banco}</option>)}
            </select>
            <Bg onClick={()=>{setForm(initF());setModal(true);}}><Plus size={13}/> Nuevo</Bg>
          </div>}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr><Th>Fecha</Th><Th>Tipo</Th><Th>Banco</Th><Th>Concepto</Th><Th>Tercero/Factura</Th><Th>Ref.</Th><Th right>USD</Th><Th right>Bs.</Th><Th right>Tasa</Th><Th>Estado</Th></tr></thead>
              <tbody>
                {movFilt.length===0&&<tr><td colSpan={10}><EmptyState icon={ArrowLeftRight} title="Sin movimientos" desc="Registre transacciones bancarias"/></td></tr>}
                {movFilt.map(m=><tr key={m.id} className="hover:bg-slate-50">
                  <Td>{dd(m.fecha)}</Td>
                  <Td><Badge v={m.tipo==='Ingreso'?'green':m.tipo==='Egreso'?'red':'blue'}>{m.tipo}</Badge></Td>
                  <Td className="text-[11px] font-semibold max-w-[80px] truncate">{m.cuentaNombre}</Td>
                  <Td className="max-w-[130px] truncate">{m.concepto}</Td>
                  <Td className="text-[10px] max-w-[110px]">
                    {m.aplicaTercero?<><p className="font-bold text-slate-700 truncate">{m.terceroNombre}</p>{m.facturaNumero&&<p className="text-blue-500 font-black">{m.facturaNumero}</p>}</>:<span className="text-slate-300">—</span>}
                  </Td>
                  <Td mono className="text-slate-400 text-[10px]">{m.referencia||'—'}</Td>
                  <Td right mono className={`font-black ${m.tipo==='Ingreso'?'text-emerald-600':'text-red-500'}`}>${fmt(m.montoUSD)}</Td>
                  <Td right mono className="text-slate-400 text-xs">Bs.{fmt(m.montoBs)}</Td>
                  <Td right mono className="text-slate-400 text-[10px]">{m.tasa}</Td>
                  <Td><Badge v={m.estatus==='Conciliado'?'green':'gray'}>{m.estatus||'No Conciliado'}</Badge></Td>
                </tr>)}
              </tbody>
            </table>
          </div>
        </Card>

        <Modal open={modal} onClose={()=>setModal(false)} title="Registrar Movimiento Bancario" wide
          footer={<><Bo onClick={()=>setModal(false)}>Cancelar</Bo><Bg onClick={save} disabled={busy}>{busy?'Registrando...':'Registrar'}</Bg></>}>
          <div className="space-y-5">
            {/* Fila básica */}
            <div className="grid grid-cols-3 gap-4">
              <FG label="Fecha"><input type="date" className={inp} value={form.fecha} onChange={e=>setForm({...form,fecha:e.target.value})}/></FG>
              <FG label="Tipo">
                <div className="flex gap-1">
                  {['Ingreso','Egreso','Transferencia'].map(t=>(
                    <button key={t} onClick={()=>setForm({...form,tipo:t})}
                      className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase transition-all border ${form.tipo===t?t==='Ingreso'?'bg-emerald-500 text-white border-emerald-500':t==='Egreso'?'bg-red-500 text-white border-red-500':'bg-blue-500 text-white border-blue-500':'bg-white text-slate-500 border-slate-200'}`}>{t}</button>
                  ))}
                </div>
              </FG>
              <FG label="N° Referencia"><input className={inp} value={form.referencia} onChange={e=>setForm({...form,referencia:e.target.value})} placeholder="REF-0000000"/></FG>
            </div>

            {/* Sub-tipo */}
            {form.tipo==='Ingreso'&&(
              <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                <p className="text-[9px] font-black uppercase text-emerald-700 mb-2 tracking-widest">Origen del Ingreso</p>
                <div className="flex gap-2">
                  {['Venta','Préstamo de Terceros','Otros'].map(o=>(
                    <button key={o} onClick={()=>setForm({...form,origenIngreso:o})}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all border ${form.origenIngreso===o?'bg-emerald-600 text-white border-emerald-600':'bg-white text-slate-500 border-slate-200'}`}>{o}</button>
                  ))}
                </div>
              </div>
            )}
            {form.tipo==='Egreso'&&(
              <div className="bg-red-50 rounded-xl p-4 border border-red-100">
                <p className="text-[9px] font-black uppercase text-red-700 mb-2 tracking-widest">Motivo del Egreso</p>
                <div className="flex flex-wrap gap-2">
                  {['Pago Proveedor','Nómina','Gastos Operativos','Impuestos','Préstamo','Otros'].map(o=>(
                    <button key={o} onClick={()=>setForm({...form,motivoEgreso:o})}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all border ${form.motivoEgreso===o?'bg-red-600 text-white border-red-600':'bg-white text-slate-500 border-slate-200'}`}>{o}</button>
                  ))}
                </div>
              </div>
            )}

            {/* Cuenta(s) bancaria(s) */}
            {form.tipo!=='Transferencia'
              ? <FG label="Cuenta Bancaria" full>
                  <select className={sel} value={form.cuentaId} onChange={e=>setForm({...form,cuentaId:e.target.value})}>
                    <option value="">— Seleccione cuenta —</option>
                    {TIPO_BANCO.map(tb=>{const g=cuentas.filter(c=>c.tipoBanco===tb.id);if(!g.length)return null;return <optgroup key={tb.id} label={`${tb.flag} ${tb.id}`}>{g.map(c=><option key={c.id} value={c.id}>{c.banco} · {c.numeroCuenta} — {c.moneda==='BS'?'Bs.':'$'} {fmt(c.saldo)}</option>)}</optgroup>;})}
                  </select>
                </FG>
              : <div className="grid grid-cols-2 gap-4">
                  <FG label="🏦 Banco Origen">
                    <select className={sel} value={form.cuentaId} onChange={e=>setForm({...form,cuentaId:e.target.value})}><option value="">— Origen —</option>{cuentas.map(c=><option key={c.id} value={c.id}>{c.banco} · {c.moneda==='BS'?'Bs.':'$'} {fmt(c.saldo)}</option>)}</select>
                  </FG>
                  <FG label="🏦 Banco Destino">
                    <select className={sel} value={form.cuentaDestinoId} onChange={e=>setForm({...form,cuentaDestinoId:e.target.value})}><option value="">— Destino —</option>{cuentas.filter(c=>c.id!==form.cuentaId).map(c=><option key={c.id} value={c.id}>{c.banco} · {c.moneda==='BS'?'Bs.':'$'} {fmt(c.saldo)}</option>)}</select>
                  </FG>
                </div>
            }

            {/* Monto + Tasa + Conversión */}
            {cuentaSel&&(
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
                <div className="grid grid-cols-3 gap-4">
                  <FG label={`Monto (${cuentaSel.moneda})`}>
                    <input type="number" step="0.01" className={`${inp} font-black text-lg`} value={form.montoNativo} onChange={e=>setForm({...form,montoNativo:e.target.value})} placeholder="0.00"/>
                  </FG>
                  <FG label="Tasa de Cambio (Bs/$)">
                    <div className="relative"><input type="number" step="0.01" className={inp} value={form.tasa} onChange={e=>setForm({...form,tasa:e.target.value})}/><span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-slate-300 font-black">BCV</span></div>
                  </FG>
                  <div className="flex flex-col justify-end pb-0.5">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Equivalencia</p>
                    <div className="rounded-xl p-3" style={{background:'linear-gradient(135deg,#0f172a,#1e293b)'}}>
                      <p className="text-emerald-400 font-mono font-black text-lg leading-none">${fmt(montoUSD)}</p>
                      <p className="text-slate-400 text-[10px] mt-0.5">Bs. {fmt(montoBs)}</p>
                    </div>
                  </div>
                </div>
                <p className="text-[9px] text-slate-400 font-bold mt-2">
                  {bs?`${fmt(mNat)} Bs ÷ ${tasa} = $${fmt(montoUSD)}`:`$${fmt(mNat)} × ${tasa} = Bs. ${fmt(montoBs)}`}
                </p>
              </div>
            )}

            {/* Concepto */}
            <FG label="Concepto / Descripción" full>
              <input className={inp} value={form.concepto} onChange={e=>setForm({...form,concepto:e.target.value})} placeholder="Descripción del movimiento..."/>
            </FG>

            {/* Asiento contable sugerido */}
            {form.tipo!=='Transferencia'&&(
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                <p className="text-[9px] font-black uppercase text-blue-700 mb-2 tracking-widest">Asiento Contable Automático (referencia)</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white rounded-lg p-3 border border-blue-100">
                    <p className="text-[9px] font-black text-emerald-600 uppercase mb-1">DÉBITO →</p>
                    <p className="text-xs font-bold text-slate-700">{form.tipo==='Ingreso'?(cuentaSel?.cuentaContable||'Banco / Caja'):'Cuenta de Gasto/Proveedor'}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-blue-100">
                    <p className="text-[9px] font-black text-red-500 uppercase mb-1">CRÉDITO ←</p>
                    <p className="text-xs font-bold text-slate-700">{form.tipo==='Egreso'?(cuentaSel?.cuentaContable||'Banco / Caja'):'CxC / Ingreso'}</p>
                  </div>
                </div>
                <FG label="Cuenta Contable Contrapartida (opcional)">
                  <select className={sel} value={form.cuentaContableContraId} onChange={e=>{const c=contCuentas.find(x=>x.id===e.target.value);setForm({...form,cuentaContableContraId:e.target.value,cuentaContableContra:c?`${c.codigo} · ${c.nombre}`:''})}}>
                    <option value="">— Seleccionar del PUC —</option>
                    {sugerirCuenta().map(c=><option key={c.id} value={c.id}>{c.codigo} · {c.nombre}</option>)}
                    <optgroup label="Todas las cuentas">{contCuentas.sort((a,b)=>String(a.codigo).localeCompare(String(b.codigo))).map(c=><option key={c.id} value={c.id}>{c.codigo} · {c.nombre}</option>)}</optgroup>
                  </select>
                </FG>
              </div>
            )}

            {/* Terceros */}
            {form.tipo!=='Transferencia'&&(
              <div className="border-2 border-slate-100 rounded-2xl p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div><p className="text-xs font-black text-slate-700 uppercase tracking-wide">Vincular a Tercero</p><p className="text-[10px] text-slate-400">Asociar cliente (CxC) o proveedor (CxP)</p></div>
                  <button onClick={()=>setForm({...form,aplicaTercero:!form.aplicaTercero,terceroId:'',facturaId:'',cerrarCxC:false})}
                    className={`w-12 h-6 rounded-full transition-all relative ${form.aplicaTercero?'bg-orange-500':'bg-slate-200'}`}>
                    <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${form.aplicaTercero?'left-6':'left-0.5'}`}/>
                  </button>
                </div>
                {form.aplicaTercero&&(
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <FG label="Tipo">
                        <div className="flex gap-1">
                          {['Cliente','Proveedor'].map(t=>(
                            <button key={t} onClick={()=>setForm({...form,tipoTercero:t,terceroId:'',facturaId:''})}
                              className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase border-2 transition-all ${form.tipoTercero===t?'bg-slate-900 text-white border-slate-900':'bg-white text-slate-500 border-slate-200'}`}>{t}</button>
                          ))}
                        </div>
                      </FG>
                      <FG label={form.tipoTercero==='Cliente'?'Cliente':'Proveedor'}>
                        <select className={sel} value={form.terceroId} onChange={e=>setForm({...form,terceroId:e.target.value,facturaId:''})}>
                          <option value="">— Seleccione —</option>
                          {tercerosSel.map(t=><option key={t.id} value={t.id}>{t.label}</option>)}
                        </select>
                      </FG>
                    </div>
                    {form.tipoTercero==='Cliente'&&form.terceroId&&factPend.length>0&&(
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] font-black uppercase text-slate-600">Cerrar Cuenta por Cobrar</p>
                          <button onClick={()=>setForm({...form,cerrarCxC:!form.cerrarCxC,facturaId:''})}
                            className={`w-10 h-5 rounded-full transition-all relative ${form.cerrarCxC?'bg-blue-500':'bg-slate-200'}`}>
                            <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${form.cerrarCxC?'left-5':'left-0.5'}`}/>
                          </button>
                        </div>
                        {form.cerrarCxC&&factPend.map(f=>(
                          <label key={f.id} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${form.facturaId===f.id?'border-blue-500 bg-blue-50':'border-slate-200 hover:border-slate-100'}`}>
                            <input type="radio" name="fid" value={f.id} checked={form.facturaId===f.id} onChange={()=>setForm({...form,facturaId:f.id})} className="accent-blue-500"/>
                            <div className="flex-1"><p className="font-black text-xs text-slate-900">{f.numero} · {dd(f.fechaVencimiento)}</p></div>
                            <p className="font-mono font-black text-orange-500">${fmt(f.saldoUSD)}</p>
                            {f.fechaVencimiento<today()&&<Badge v="red">Vencida</Badge>}
                          </label>
                        ))}
                      </div>
                    )}
                    {form.tipoTercero==='Cliente'&&form.terceroId&&factPend.length===0&&(
                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2"><CheckCircle size={14} className="text-emerald-500"/><p className="text-[10px] font-black text-emerald-700">Sin facturas pendientes de cobro.</p></div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </Modal>
      </div>
    );
  };

  // ── 4. CONCILIACIÓN BANCARIA ───────────────────────────────────────────────
  const ConciliacionView = () => {
    const [cuentaId, setCuentaId]   = useState('');
    const [desde,    setDesde]      = useState(mesActual()+'-01');
    const [hasta,    setHasta]      = useState(today());
    const [saldoBanco, setSaldoBco] = useState('');
    const [marcados,   setMarcados] = useState({});  // id → true/false
    const [ajustes,    setAjustes]  = useState([]);  // [{tipo,concepto,monto}]
    const [busy,       setBusy]     = useState(false);

    const cuenta = cuentas.find(c=>c.id===cuentaId);
    const movPeriodo = movimientos.filter(m=>m.cuentaId===cuentaId&&m.fecha>=desde&&m.fecha<=hasta&&m.estatus!=='Conciliado');
    const movHistorico = movimientos.filter(m=>m.cuentaId===cuentaId&&m.fecha<desde&&m.estatus!=='Conciliado');
    const todosParaConciliar = [...movHistorico,...movPeriodo];

    const toggle = (id)=>setMarcados(prev=>({...prev,[id]:!prev[id]}));

    const egresosTransito = todosParaConciliar.filter(m=>m.tipo==='Egreso'&&!marcados[m.id]).reduce((a,m)=>a+Number(m.montoUSD||0),0);
    const ingresosTransito = todosParaConciliar.filter(m=>m.tipo==='Ingreso'&&!marcados[m.id]).reduce((a,m)=>a+Number(m.montoUSD||0),0);
    const cargosNoCont  = ajustes.filter(a=>a.tipo==='Cargo' ).reduce((a,x)=>a+Number(x.monto||0),0);
    const abonosNoCont  = ajustes.filter(a=>a.tipo==='Abono' ).reduce((a,x)=>a+Number(x.monto||0),0);

    const saldoLibros   = cuenta ? Number(cuenta.moneda==='BS'?Number(cuenta.saldo)/tasaActiva:cuenta.saldo) : 0;
    const saldoConcil   = saldoLibros + cargosNoCont - abonosNoCont + egresosTransito - ingresosTransito;
    const saldoBancoNum = Number(saldoBanco)||0;
    const diferencia    = saldoBancoNum - saldoConcil;
    const OK            = Math.abs(diferencia)<0.01 && saldoBancoNum>0;

    const aprobar = async()=>{
      if(!OK) return alert('Diferencia debe ser 0.00 para aprobar');
      if(!window.confirm('¿Confirmar cierre de conciliación? Esta acción es IRREVERSIBLE.')) return;
      setBusy(true);
      try {
        const batch=writeBatch(db);
        const ids=Object.entries(marcados).filter(([,v])=>v).map(([k])=>k);
        ids.forEach(id=>batch.update(dref('banco_movimientos',id),{estatus:'Conciliado'}));
        const concId=gid();
        batch.set(dref('banco_conciliaciones',concId),{id:concId,cuentaId,cuentaNombre:cuenta.banco,desde,hasta,saldoBanco:saldoBancoNum,saldoLibros,egresosTransito,ingresosTransito,cargosNoCont,abonosNoCont,saldoConciliado:saldoConcil,diferencia,movsConciliados:ids.length,ajustes,aprobado:true,fecha:today(),ts:serverTimestamp()});
        await batch.commit();
        setMarcados({}); setSaldoBco(''); setAjustes([]);
        alert(`✅ Conciliación aprobada. ${ids.length} movimiento(s) marcados como Conciliados.`);
      } finally { setBusy(false); }
    };

    return (
      <div className="space-y-5">
        {/* Parámetros */}
        <Card title="Parámetros de Conciliación">
          <div className="grid grid-cols-4 gap-4">
            <FG label="Cuenta Bancaria" full>
              <select className={sel} value={cuentaId} onChange={e=>{setCuentaId(e.target.value);setMarcados({});}}>
                <option value="">— Seleccione cuenta —</option>
                {cuentas.map(c=><option key={c.id} value={c.id}>{TIPO_BANCO.find(t=>t.id===c.tipoBanco)?.flag||''} {c.banco} · {c.numeroCuenta} · Saldo: {c.moneda==='BS'?'Bs.':'$'} {fmt(c.saldo)}</option>)}
              </select>
            </FG>
            <FG label="Desde"><input type="date" className={inp} value={desde} onChange={e=>setDesde(e.target.value)}/></FG>
            <FG label="Hasta"><input type="date" className={inp} value={hasta} onChange={e=>setHasta(e.target.value)}/></FG>
            <FG label="Saldo Final según Banco ($)">
              <input type="number" step="0.01" className={`${inp} font-black text-lg ${OK?'border-emerald-400 bg-emerald-50':saldoBancoNum>0?'border-amber-400 bg-amber-50':''}`}
                value={saldoBanco} onChange={e=>setSaldoBco(e.target.value)} placeholder="0.00"/>
            </FG>
          </div>
        </Card>

        {cuentaId&&(
          <div className="grid lg:grid-cols-3 gap-5">
            {/* Lista de movimientos */}
            <div className="lg:col-span-2 space-y-3">
              <Card title={`Movimientos a Conciliar — ${todosParaConciliar.length}`} subtitle="Marque los que aparecen en el estado de cuenta del banco">
                {todosParaConciliar.length===0
                  ?<EmptyState icon={CheckCircle} title="Sin movimientos pendientes" desc="No hay movimientos sin conciliar para este período"/>
                  :<div className="divide-y divide-slate-100">
                    {todosParaConciliar.map(m=>(
                      <label key={m.id} className={`flex items-center gap-4 py-3 px-2 cursor-pointer rounded-xl hover:bg-slate-50 transition-colors ${marcados[m.id]?'bg-emerald-50/60':''}`}>
                        <input type="checkbox" checked={!!marcados[m.id]} onChange={()=>toggle(m.id)} className="w-4 h-4 accent-emerald-500 rounded flex-shrink-0"/>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <Badge v={m.tipo==='Ingreso'?'green':m.tipo==='Egreso'?'red':'blue'}>{m.tipo}</Badge>
                            <span className="text-[10px] text-slate-400">{dd(m.fecha)}</span>
                            {m.fecha<desde&&<Badge v="gold">Anterior</Badge>}
                          </div>
                          <p className="text-xs font-semibold text-slate-700 truncate">{m.concepto}</p>
                          {m.terceroNombre&&<p className="text-[10px] text-slate-400 truncate">{m.terceroNombre}</p>}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className={`font-mono font-black text-sm ${m.tipo==='Ingreso'?'text-emerald-600':'text-red-500'}`}>${fmt(m.montoUSD)}</p>
                          <p className="text-[10px] text-slate-400">Bs.{fmt(m.montoBs)}</p>
                        </div>
                        {marcados[m.id]&&<CheckCircle size={16} className="text-emerald-500 flex-shrink-0"/>}
                      </label>
                    ))}
                  </div>}
              </Card>

              {/* Ajustes (NC/ND bancarios) */}
              <Card title="Ajustes Bancarios" subtitle="Notas de débito/crédito del banco no contabilizadas"
                action={<button onClick={()=>setAjustes([...ajustes,{tipo:'Cargo',concepto:'',monto:''}])} className="text-[10px] font-black uppercase text-blue-500 flex items-center gap-1 hover:bg-blue-50 px-2 py-1 rounded-lg"><Plus size={12}/> Ajuste</button>}>
                {ajustes.length===0?<p className="text-xs text-slate-400 text-center py-3">Sin ajustes. Agregue comisiones, intereses, etc.</p>:
                  <div className="space-y-2">
                    {ajustes.map((a,i)=>(
                      <div key={i} className="flex gap-2 items-center bg-slate-50 p-2 rounded-xl border border-slate-100">
                        <select className={`${sel} w-28 flex-shrink-0`} value={a.tipo} onChange={e=>{const n=[...ajustes];n[i].tipo=e.target.value;setAjustes(n);}}>
                          <option value="Cargo">N. Débito</option><option value="Abono">N. Crédito</option>
                        </select>
                        <input className={`${inp} flex-1`} placeholder="Comisión bancaria, intereses..." value={a.concepto} onChange={e=>{const n=[...ajustes];n[i].concepto=e.target.value;setAjustes(n);}}/>
                        <input type="number" step="0.01" className={`${inp} w-28 text-right`} placeholder="USD" value={a.monto} onChange={e=>{const n=[...ajustes];n[i].monto=e.target.value;setAjustes(n);}}/>
                        <button onClick={()=>setAjustes(ajustes.filter((_,j)=>j!==i))} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg"><Trash2 size={12}/></button>
                      </div>
                    ))}
                  </div>}
              </Card>
            </div>

            {/* Panel de cuadre */}
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden shadow-sm sticky top-4">
                <div className="px-5 py-4 border-b border-slate-100" style={{background:'linear-gradient(135deg,#0f172a,#1e293b)'}}>
                  <p className="font-black text-white text-sm uppercase tracking-widest">Panel de Cuadre</p>
                  <p className="text-slate-400 text-[10px] mt-0.5">Tiempo real</p>
                </div>
                <div className="p-5 space-y-3">
                  {[
                    {label:'Saldo en Libros (Sistema)',value:saldoLibros,color:'text-slate-900',bold:true},
                    {label:'(+) Cargos NC no contabilizados',value:cargosNoCont,color:'text-red-600'},
                    {label:'(−) Abonos NC no contabilizados',value:abonosNoCont,color:'text-emerald-600'},
                    {label:'(+) Egresos en Tránsito',value:egresosTransito,color:'text-red-500'},
                    {label:'(−) Ingresos en Tránsito',value:ingresosTransito,color:'text-emerald-500'},
                  ].map(({label,value,color,bold})=>(
                    <div key={label} className="flex items-center justify-between">
                      <p className={`text-[10px] ${bold?'font-black text-slate-700':'font-medium text-slate-500'} leading-tight max-w-[150px]`}>{label}</p>
                      <p className={`font-mono font-black text-sm ${color}`}>${fmt(value)}</p>
                    </div>
                  ))}
                  <div className="border-t-2 border-slate-200 pt-3 mt-3">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[10px] font-black text-slate-700 uppercase">= Saldo Conciliado</p>
                      <p className="font-mono font-black text-base text-blue-600">${fmt(saldoConcil)}</p>
                    </div>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[10px] font-black text-slate-500 uppercase">Saldo según Banco</p>
                      <p className="font-mono font-black text-base text-slate-900">${fmt(saldoBancoNum)}</p>
                    </div>
                  </div>
                  <div className={`rounded-xl p-4 text-center border-2 ${OK?'border-emerald-400 bg-emerald-50':'border-amber-400 bg-amber-50'}`}>
                    <p className="text-[9px] font-black uppercase tracking-widest mb-1 text-slate-500">Diferencia</p>
                    <p className={`font-mono font-black text-2xl ${OK?'text-emerald-600':'text-amber-600'}`}>${fmt(diferencia)}</p>
                    {OK?<p className="text-[10px] text-emerald-600 font-black mt-1">✓ Cuadrado al centavo</p>:<p className="text-[10px] text-amber-600 font-black mt-1">Pendiente de cuadrar</p>}
                  </div>
                  <div className="flex flex-col gap-2 pt-2">
                    <Bg onClick={aprobar} disabled={!OK||busy}>
                      {busy?<><RefreshCw size={13} className="animate-spin"/> Procesando...</>:<><CheckCircle size={13}/> Aprobar Conciliación</>}
                    </Bg>
                    <p className="text-[9px] text-slate-400 text-center">Al aprobar, los movimientos quedan bloqueados de forma permanente.</p>
                  </div>
                </div>
              </div>

              {/* Historial de conciliaciones */}
              {conciliaciones.filter(c=>c.cuentaId===cuentaId).length>0&&(
                <Card title="Conciliaciones Cerradas">
                  {conciliaciones.filter(c=>c.cuentaId===cuentaId).slice(0,5).map(c=>(
                    <div key={c.id} className="flex items-center justify-between py-2 border-b border-slate-50">
                      <div><p className="text-[10px] font-black text-slate-700">{dd(c.desde)} — {dd(c.hasta)}</p><p className="text-[9px] text-slate-400">{c.movsConciliados} mov. conciliados</p></div>
                      <div className="text-right"><p className="font-mono font-black text-emerald-600 text-xs">${fmt(c.saldoBanco)}</p><Badge v="green">Aprobada</Badge></div>
                    </div>
                  ))}
                </Card>
              )}
            </div>
          </div>
        )}
        {!cuentaId&&<EmptyState icon={Building2} title="Seleccione una cuenta" desc="Elija la cuenta bancaria para comenzar la conciliación"/>}
      </div>
    );
  };

  // ── 5. PROVEEDORES ─────────────────────────────────────────────────────────
  const ProveedoresView = () => {
    const [modal,setModal]=useState(false); const [busy,setBusy]=useState(false);
    const [form,setForm]=useState({nombre:'',rif:'',telefono:'',email:'',direccion:'',diasCredito:'0'});
    const save=async()=>{if(!form.nombre||!form.rif)return alert('Nombre y RIF requeridos');setBusy(true);try{const id=gid();await setDoc(dref('compras_proveedores',id),{...form,id,ts:serverTimestamp()});setModal(false);setForm({nombre:'',rif:'',telefono:'',email:'',direccion:'',diasCredito:'0'});}finally{setBusy(false);}};
    return(<div>
      <Card title="Directorio de Proveedores" subtitle={`${proveedores.length} proveedores`} action={<Bg onClick={()=>setModal(true)} sm><Plus size={12}/> Nuevo</Bg>}>
        <table className="w-full"><thead><tr><Th>RIF</Th><Th>Razón Social</Th><Th>Teléfono</Th><Th>Email</Th><Th>Días Crédito</Th><Th></Th></tr></thead>
          <tbody>
            {proveedores.length===0&&<tr><td colSpan={6}><EmptyState icon={Users} title="Sin proveedores" desc="Registre sus proveedores"/></td></tr>}
            {proveedores.map(p=><tr key={p.id} className="hover:bg-slate-50"><Td mono className="font-black">{p.rif}</Td><Td className="uppercase font-semibold">{p.nombre}</Td><Td>{p.telefono||'—'}</Td><Td className="text-slate-400">{p.email||'—'}</Td><Td mono>{p.diasCredito} días</Td><Td><button onClick={()=>deleteDoc(dref('compras_proveedores',p.id))} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg"><Trash2 size={12}/></button></Td></tr>)}
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

  // ── 6. REPORTES BANCARIOS ─────────────────────────────────────────────────
  const ReportesView = () => {
    const [rptCuenta,setRptC]=useState(''); const [rptDesde,setRptD]=useState(mesActual()+'-01'); const [rptHasta,setRptH]=useState(today());
    const filtrado=movimientos.filter(m=>(!rptCuenta||m.cuentaId===rptCuenta)&&m.fecha>=rptDesde&&m.fecha<=rptHasta);
    const ingUSD=filtrado.filter(m=>m.tipo==='Ingreso').reduce((a,m)=>a+Number(m.montoUSD||0),0);
    const egrUSD=filtrado.filter(m=>m.tipo==='Egreso' ).reduce((a,m)=>a+Number(m.montoUSD||0),0);
    const ingBs =filtrado.filter(m=>m.tipo==='Ingreso').reduce((a,m)=>a+Number(m.montoBs||0),0);
    const egrBs =filtrado.filter(m=>m.tipo==='Egreso' ).reduce((a,m)=>a+Number(m.montoBs||0),0);
    const neto  =ingUSD-egrUSD;
    return(<div className="space-y-5">
      <Card title="Filtros del Reporte"><div className="grid grid-cols-3 gap-4">
        <FG label="Cuenta"><select className={sel} value={rptCuenta} onChange={e=>setRptC(e.target.value)}><option value="">Todas las cuentas</option>{cuentas.map(c=><option key={c.id} value={c.id}>{c.banco}</option>)}</select></FG>
        <FG label="Desde"><input type="date" className={inp} value={rptDesde} onChange={e=>setRptD(e.target.value)}/></FG>
        <FG label="Hasta"><input type="date" className={inp} value={rptHasta} onChange={e=>setRptH(e.target.value)}/></FG>
      </div></Card>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI label="Ingresos (USD)" value={`$${fmt(ingUSD)}`} accent="green" Icon={ArrowUpCircle} sub={`Bs. ${fmt(ingBs)}`}/>
        <KPI label="Egresos (USD)" value={`$${fmt(egrUSD)}`} accent="red" Icon={ArrowDownCircle} sub={`Bs. ${fmt(egrBs)}`}/>
        <KPI label="Flujo Neto" value={`$${fmt(neto)}`} accent={neto>=0?'green':'red'} Icon={ArrowLeftRight}/>
        <KPI label="Transacciones" value={filtrado.length} accent="blue" Icon={FileText}/>
      </div>
      {!rptCuenta&&<Card title="Por Banco">
        <table className="w-full"><thead><tr><Th>Banco</Th><Th>Tipo</Th><Th right>Ingresos $</Th><Th right>Egresos $</Th><Th right>Ingresos Bs.</Th><Th right>Egresos Bs.</Th><Th right>Txns</Th></tr></thead>
          <tbody>{cuentas.map(c=>{const mv=filtrado.filter(m=>m.cuentaId===c.id);const iU=mv.filter(m=>m.tipo==='Ingreso').reduce((a,m)=>a+Number(m.montoUSD||0),0);const eU=mv.filter(m=>m.tipo==='Egreso').reduce((a,m)=>a+Number(m.montoUSD||0),0);const iB=mv.filter(m=>m.tipo==='Ingreso').reduce((a,m)=>a+Number(m.montoBs||0),0);const eB=mv.filter(m=>m.tipo==='Egreso').reduce((a,m)=>a+Number(m.montoBs||0),0);
            return<tr key={c.id} className="hover:bg-slate-50"><Td className="font-semibold">{c.banco}</Td><Td><span className="text-[9px] font-black uppercase text-slate-400">{c.tipoBanco}</span></Td><Td right mono className="text-emerald-600 font-bold">${fmt(iU)}</Td><Td right mono className="text-red-500 font-bold">${fmt(eU)}</Td><Td right mono className="text-emerald-700 text-xs">Bs.{fmt(iB)}</Td><Td right mono className="text-red-600 text-xs">Bs.{fmt(eB)}</Td><Td right mono className="font-black">{mv.length}</Td></tr>;
          })}</tbody>
        </table>
      </Card>}
      <Card title={`Detalle — ${filtrado.length} transacciones`} action={<button onClick={()=>window.print()} className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-blue-700"><Download size={12}/> Imprimir</button>}>
        <div className="overflow-x-auto"><table className="w-full"><thead><tr><Th>Fecha</Th><Th>Tipo</Th><Th>Banco</Th><Th>Concepto</Th><Th>Tercero</Th><Th>Ref.</Th><Th right>USD</Th><Th right>Bs.</Th><Th right>Tasa</Th><Th>Estado</Th></tr></thead>
          <tbody>
            {filtrado.length===0&&<tr><td colSpan={10}><EmptyState icon={BarChart3} title="Sin transacciones" desc="No hay datos para los filtros seleccionados"/></td></tr>}
            {filtrado.map(m=><tr key={m.id} className="hover:bg-slate-50">
              <Td>{dd(m.fecha)}</Td><Td><Badge v={m.tipo==='Ingreso'?'green':m.tipo==='Egreso'?'red':'blue'}>{m.tipo}</Badge></Td>
              <Td className="text-[11px] font-semibold max-w-[80px] truncate">{m.cuentaNombre}</Td>
              <Td className="max-w-[130px] truncate">{m.concepto}</Td>
              <Td className="text-[10px] max-w-[100px] truncate">{m.terceroNombre||'—'}</Td>
              <Td mono className="text-slate-400 text-[10px]">{m.referencia||'—'}</Td>
              <Td right mono className={`font-black ${m.tipo==='Ingreso'?'text-emerald-600':'text-red-500'}`}>${fmt(m.montoUSD)}</Td>
              <Td right mono className="text-slate-400 text-xs">Bs.{fmt(m.montoBs)}</Td>
              <Td right mono className="text-slate-400 text-[10px]">{m.tasa}</Td>
              <Td><Badge v={m.estatus==='Conciliado'?'green':'gray'}>{m.estatus||'Pendiente'}</Badge></Td>
            </tr>)}
          </tbody>
          {filtrado.length>0&&<tfoot><tr className="bg-slate-900"><td colSpan={6} className="px-4 py-3 text-[10px] font-black uppercase text-slate-400 tracking-widest">TOTALES</td><td className="px-4 py-3 text-right font-mono font-black text-white">${fmt(ingUSD-egrUSD)}</td><td className="px-4 py-3 text-right font-mono text-slate-400 text-xs">Bs.{fmt(ingBs-egrBs)}</td><td colSpan={2}></td></tr></tfoot>}
        </table></div>
      </Card>
    </div>);
  };

  // ── 7. TASAS ───────────────────────────────────────────────────────────────
  const TasasView = () => {
    const [modal,setModal]=useState(false); const [busy,setBusy]=useState(false);
    const [form,setForm]=useState({fecha:today(),modulo:'Todos',moneda:'USD',tasaRef:'',fuente:'Oficial / BCV'});
    const save=async()=>{if(!form.tasaRef)return alert('Tasa requerida');setBusy(true);try{const id=gid();await setDoc(dref('banco_tasas',id),{...form,tasaRef:Number(form.tasaRef),id,ts:serverTimestamp()});setModal(false);setForm({fecha:today(),modulo:'Todos',moneda:'USD',tasaRef:'',fuente:'Oficial / BCV'});}finally{setBusy(false);}};
    return(<div>
      <div className="grid grid-cols-3 gap-4 mb-5">
        <KPI label="Tasa Global Activa" value={`${tasas.find(t=>t.modulo==='Todos')?.tasaRef||'—'} Bs/$`} accent="gold" Icon={Globe}/>
        <KPI label="Registros" value={tasas.length} accent="blue" Icon={TrendingUp}/>
        <KPI label="Última Actualización" value={dd(tasas[0]?.fecha||'')} accent="green" Icon={CalendarDays}/>
      </div>
      <Card title="Tasas de Cambio" subtitle="Historial BCV y de mercado" action={<Bg onClick={()=>setModal(true)} sm><Plus size={12}/> Nueva</Bg>}>
        <table className="w-full"><thead><tr><Th>Fecha</Th><Th>Módulo</Th><Th>Moneda</Th><Th right>Tasa (Bs/$)</Th><Th>Fuente</Th></tr></thead>
          <tbody>{tasas.length===0&&<tr><td colSpan={5}><EmptyState icon={Globe} title="Sin tasas" desc="Registre la tasa actual"/></td></tr>}{tasas.map(t=><tr key={t.id} className="hover:bg-slate-50"><Td>{dd(t.fecha)}</Td><Td><Badge v={t.modulo==='Todos'?'gray':'blue'}>{t.modulo}</Badge></Td><Td><Pill usd={t.moneda==='USD'}>{t.moneda}</Pill></Td><Td right mono className="font-black text-slate-900 text-base">{t.tasaRef}</Td><Td className="text-slate-400 text-[10px] uppercase font-semibold">{t.fuente}</Td></tr>)}</tbody>
        </table>
      </Card>
      <Modal open={modal} onClose={()=>setModal(false)} title="Registrar Tasa" footer={<><Bo onClick={()=>setModal(false)}>Cancelar</Bo><Bg onClick={save} disabled={busy}>{busy?'Guardando...':'Guardar'}</Bg></>}>
        <div className="grid grid-cols-2 gap-4">
          <FG label="Fecha"><input type="date" className={inp} value={form.fecha} onChange={e=>setForm({...form,fecha:e.target.value})}/></FG>
          <FG label="Moneda"><select className={sel} value={form.moneda} onChange={e=>setForm({...form,moneda:e.target.value})}><option>USD</option><option>EUR</option></select></FG>
          <FG label="Tasa Bs/$"><input type="number" step="0.01" className={inp} value={form.tasaRef} onChange={e=>setForm({...form,tasaRef:e.target.value})} placeholder="39.50"/></FG>
          <FG label="Módulo"><select className={sel} value={form.modulo} onChange={e=>setForm({...form,modulo:e.target.value})}><option>Todos</option><option>Banco</option><option>Facturación</option><option>Inventario</option></select></FG>
          <FG label="Fuente" full><input className={inp} value={form.fuente} onChange={e=>setForm({...form,fuente:e.target.value})} placeholder="Oficial / BCV / Paralelo"/></FG>
        </div>
      </Modal>
    </div>);
  };

  // ── NAV & RENDER ───────────────────────────────────────────────────────────
  const navGroups = [
    { group:'Analítica',   items:[{id:'dashboard',    label:'Panel de Tesorería', icon:LayoutDashboard}] },
    { group:'Bancario',    items:[{id:'cuentas',      label:'Cuentas Bancarias',  icon:Building2},
                                  {id:'movimientos',  label:'Movimientos',        icon:ArrowLeftRight},
                                  {id:'conciliacion', label:'Conciliación',       icon:CheckCircle}] },
    { group:'Terceros',    items:[{id:'proveedores',  label:'Proveedores',        icon:Users}] },
    { group:'Reportes',    items:[{id:'reportes',     label:'Reporte Bancario',   icon:BarChart3}] },
    { group:'Config.',     items:[{id:'tasas',        label:'Tasas de Cambio',    icon:Globe}] },
  ];
  const views = { dashboard:<DashboardView/>, cuentas:<CuentasView/>, movimientos:<MovimientosView/>, conciliacion:<ConciliacionView/>, proveedores:<ProveedoresView/>, reportes:<ReportesView/>, tasas:<TasasView/> };
  const curNav = navGroups.flatMap(g=>g.items).find(n=>n.id===sec);

  return (
    <SidebarLayout brand="Supply G&B" brandSub="Bancos & Tesorería" navGroups={navGroups} activeId={sec} onNav={setSec} onBack={onBack} accentColor={BLUE}
      headerContent={<>
        <div><h1 className="font-black text-slate-800 text-sm uppercase tracking-wide">{curNav?.label}</h1><p className="text-[9px] text-slate-400 font-medium uppercase tracking-widest">Tesorería <ChevronRight size={8} className="inline"/> {navGroups.find(g=>g.items.find(i=>i.id===sec))?.group}</p></div>
        <div className="flex items-center gap-3">
          <div className="bg-blue-50 border border-blue-200 rounded-full px-3 py-1.5 flex items-center gap-1.5"><DollarSign size={12} className="text-blue-500"/><span className="text-[10px] font-black text-blue-700 font-mono">BCV: {tasaActiva} Bs/$</span></div>
          <Bg onClick={()=>setSec('movimientos')} sm><Plus size={12}/> Transacción</Bg>
        </div>
      </>}>
      {views[sec]}
    </SidebarLayout>
  );
}

// ============================================================================
// MÓDULO CONTABILIDAD — PLAN DE CUENTAS (NUEVO — COMPLETO)
// ============================================================================
function ContabilidadApp({ fbUser, onBack }) {
  const [sec, setSec] = useState('dashboard');
  const [cuentas, setCuentas] = useState([]);

  useEffect(() => {
    if (!fbUser) return;
    const unsub = onSnapshot(col('cont_cuentas'), s => setCuentas(s.docs.map(d => d.data())));
    return () => unsub();
  }, [fbUser]);

  const grupos = [
    { codigo: '1', nombre: 'ACTIVOS', color: 'green' }, { codigo: '2', nombre: 'PASIVOS', color: 'red' },
    { codigo: '3', nombre: 'PATRIMONIO', color: 'purple' }, { codigo: '4', nombre: 'INGRESOS', color: 'blue' },
    { codigo: '5', nombre: 'COSTOS', color: 'gold' }, { codigo: '6', nombre: 'GASTOS', color: 'gray' },
  ];

  const DashboardView = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {grupos.map(g => {
          const cnt = cuentas.filter(c => String(c.codigo).startsWith(g.codigo)).length;
          return <KPI key={g.codigo} label={`Grupo ${g.codigo} — ${g.nombre}`} value={cnt} accent={g.color} Icon={BookOpen} sub={`${cnt} cuentas registradas`} />;
        })}
      </div>
      <Card title="Estructura del Plan Único de Cuentas" subtitle={`${cuentas.length} cuentas contables activas`}>
        {cuentas.length === 0 ? <EmptyState icon={BookOpen} title="PUC Vacío" desc="Registre cuentas en el plan de cuentas" /> :
          <div className="space-y-1">
            {grupos.map(g => {
              const gCuentas = cuentas.filter(c => String(c.codigo).startsWith(g.codigo)).sort((a, b) => String(a.codigo).localeCompare(String(b.codigo)));
              if (gCuentas.length === 0) return null;
              return (
                <div key={g.codigo}>
                  <div className="flex items-center gap-2 py-2 px-3 bg-slate-50 rounded-lg mt-3 mb-1">
                    <span className="font-mono font-black text-xs text-slate-500">{g.codigo}</span>
                    <span className="font-black text-sm text-slate-900 uppercase tracking-wide">{g.nombre}</span>
                    <span className="ml-auto text-[10px] text-slate-400">{gCuentas.length} cuentas</span>
                  </div>
                  {gCuentas.map(c => (
                    <div key={c.id} className="flex items-center gap-3 py-2 px-4 hover:bg-slate-50 rounded-lg border-l-2 border-slate-100" style={{ marginLeft: `${(String(c.codigo).length - 1) * 12}px` }}>
                      <span className="font-mono font-black text-xs text-slate-400 w-16 flex-shrink-0">{c.codigo}</span>
                      <span className="text-xs font-semibold text-slate-700 flex-1">{c.nombre}</span>
                      <Badge v={c.naturaleza === 'Deudora' ? 'blue' : 'red'}>{c.naturaleza}</Badge>
                      <Badge v={c.tipo === 'Mayor' ? 'gold' : 'gray'}>{c.tipo}</Badge>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>}
      </Card>
    </div>
  );

  const PlanCuentasView = () => {
    const [modal, setModal] = useState(false);
    const [form, setForm] = useState({ codigo: '', nombre: '', grupo: '1', tipo: 'Auxiliar', naturaleza: 'Deudora', descripcion: '' });
    const [busy, setBusy] = useState(false);
    const [search, setSearch] = useState('');
    const filtered = cuentas.filter(c => c.nombre?.toUpperCase().includes(search.toUpperCase()) || String(c.codigo).includes(search));

    const save = async () => {
      if (!form.codigo || !form.nombre) return alert('Código y nombre requeridos');
      if (cuentas.find(c => String(c.codigo) === String(form.codigo))) return alert('El código ya existe');
      setBusy(true);
      try { const id = gid(); await setDoc(dref('cont_cuentas', id), { ...form, id, ts: serverTimestamp() }); setModal(false); setForm({ codigo: '', nombre: '', grupo: '1', tipo: 'Auxiliar', naturaleza: 'Deudora', descripcion: '' }); } finally { setBusy(false); }
    };

    const NATURALES = ['Deudora', 'Acreedora'];
    const TIPOS = ['Mayor', 'Auxiliar', 'Analítica'];

    return (
      <div>
        <Card title="Plan de Cuentas (PUC)" subtitle="Estructura contable de la empresa"
          action={<div className="flex gap-2"><div className="relative"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..." className="border-2 border-slate-200 rounded-xl pl-8 pr-3 py-2 text-xs outline-none focus:border-blue-500 w-36" /></div><Bg onClick={() => setModal(true)} sm><Plus size={12} /> Nueva Cuenta</Bg></div>}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr><Th>Código</Th><Th>Nombre de la Cuenta</Th><Th>Grupo</Th><Th>Tipo</Th><Th>Naturaleza</Th><Th>Descripción</Th><Th></Th></tr></thead>
              <tbody>
                {filtered.length === 0 && <tr><td colSpan={7}><EmptyState icon={BookOpen} title="Sin cuentas" desc="Registre las cuentas del PUC" /></td></tr>}
                {[...filtered].sort((a, b) => String(a.codigo).localeCompare(String(b.codigo))).map(c => <tr key={c.id} className="hover:bg-slate-50">
                  <Td mono className="font-black text-blue-600 text-sm">{c.codigo}</Td>
                  <Td className="font-semibold max-w-[200px]">{c.nombre}</Td>
                  <Td><span className="text-[10px] uppercase font-black text-slate-500">{grupos.find(g => String(c.codigo).startsWith(g.codigo))?.nombre || c.grupo}</span></Td>
                  <Td><Badge v={c.tipo === 'Mayor' ? 'gold' : 'gray'}>{c.tipo}</Badge></Td>
                  <Td><Badge v={c.naturaleza === 'Deudora' ? 'blue' : 'red'}>{c.naturaleza}</Badge></Td>
                  <Td className="text-slate-400 max-w-[180px] truncate">{c.descripcion || '—'}</Td>
                  <Td><button onClick={() => deleteDoc(dref('cont_cuentas', c.id))} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={12} /></button></Td>
                </tr>)}
              </tbody>
            </table>
          </div>
        </Card>
        <Modal open={modal} onClose={() => setModal(false)} title="Registrar Cuenta Contable" footer={<><Bo onClick={() => setModal(false)}>Cancelar</Bo><Bg onClick={save} disabled={busy}>{busy ? 'Guardando...' : 'Guardar Cuenta'}</Bg></>}>
          <div className="grid grid-cols-2 gap-4">
            <FG label="Código de Cuenta"><input className={inp} value={form.codigo} onChange={e => setForm({ ...form, codigo: e.target.value })} placeholder="101001" /></FG>
            <FG label="Nombre de la Cuenta"><input className={inp} value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value.toUpperCase() })} placeholder="CAJA PRINCIPAL" /></FG>
            <FG label="Grupo Principal"><select className={sel} value={form.grupo} onChange={e => setForm({ ...form, grupo: e.target.value })}>{grupos.map(g => <option key={g.codigo} value={g.codigo}>{g.codigo} — {g.nombre}</option>)}</select></FG>
            <FG label="Tipo de Cuenta"><select className={sel} value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })}>{TIPOS.map(t => <option key={t}>{t}</option>)}</select></FG>
            <FG label="Naturaleza"><select className={sel} value={form.naturaleza} onChange={e => setForm({ ...form, naturaleza: e.target.value })}>{NATURALES.map(n => <option key={n}>{n}</option>)}</select></FG>
            <FG label="Descripción" full><input className={inp} value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} placeholder="Descripción y uso de la cuenta..." /></FG>
          </div>
        </Modal>
      </div>
    );
  };

  const navGroups = [
    { group: 'Analítica', items: [{ id: 'dashboard', label: 'Resumen PUC', icon: LayoutDashboard }] },
    { group: 'Contabilidad', items: [{ id: 'plan', label: 'Plan de Cuentas', icon: BookOpen }] },
  ];
  const views = { dashboard: <DashboardView />, plan: <PlanCuentasView /> };
  const curNav = navGroups.flatMap(g => g.items).find(n => n.id === sec);

  return (
    <SidebarLayout brand="Supply G&B" brandSub="Plan de Cuentas" navGroups={navGroups} activeId={sec} onNav={setSec} onBack={onBack} accentColor={BLUE}
      headerContent={<>
        <div><h1 className="font-black text-slate-800 text-sm uppercase tracking-wide">{curNav?.label}</h1><p className="text-[9px] text-slate-400 font-medium uppercase tracking-widest">Contabilidad <ChevronRight size={8} className="inline" /> PUC</p></div>
        <Bg onClick={() => setSec('plan')} sm><Plus size={12} /> Nueva Cuenta</Bg>
      </>}>
      {views[sec]}
    </SidebarLayout>
  );
}

// ============================================================================
// MÓDULO ASIENTOS — LIBRO DIARIO (NUEVO — COMPLETO)
// ============================================================================
function AsientosApp({ fbUser, onBack }) {
  const [sec, setSec] = useState('dashboard');
  const [asientos, setAsientos] = useState([]);
  const [cuentas, setCuentas] = useState([]);

  useEffect(() => {
    if (!fbUser) return;
    const subs = [
      onSnapshot(query(col('cont_asientos'), orderBy('fecha', 'desc')), s => setAsientos(s.docs.map(d => d.data()))),
      onSnapshot(col('cont_cuentas'), s => setCuentas(s.docs.map(d => d.data())))
    ];
    return () => subs.forEach(u => u());
  }, [fbUser]);

  const DashboardView = () => {
    const mesCnt = asientos.filter(a => a.fecha?.startsWith(mesActual())).length;
    const totDebitos = asientos.reduce((s, a) => s + (a.lineas || []).reduce((l, li) => l + Number(li.debito || 0), 0), 0);
    const totCreditos = asientos.reduce((s, a) => s + (a.lineas || []).reduce((l, li) => l + Number(li.credito || 0), 0), 0);
    const balanceado = Math.abs(totDebitos - totCreditos) < 0.01;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPI label="Total Asientos" value={asientos.length} accent="blue" Icon={FileText} />
          <KPI label="Asientos del Mes" value={mesCnt} accent="green" Icon={CalendarDays} />
          <KPI label="Total Débitos" value={`$${fmt(totDebitos)}`} accent="gold" Icon={ArrowUpCircle} />
          <KPI label="Balance" value={balanceado ? '✓ OK' : '✗ Error'} accent={balanceado ? 'green' : 'red'} Icon={Scale} sub={balanceado ? 'Partida doble correcta' : 'Revisar asientos'} />
        </div>
        <Card title="Últimos Asientos de Diario">
          {asientos.length === 0 ? <EmptyState icon={FileText} title="Libro Diario vacío" desc="Registre el primer asiento contable" /> :
            <table className="w-full"><thead><tr><Th>Nro.</Th><Th>Fecha</Th><Th>Descripción</Th><Th>Tipo</Th><Th right>Débito</Th><Th right>Crédito</Th></tr></thead>
              <tbody>{asientos.slice(0, 8).map(a => {
                const deb = (a.lineas || []).reduce((s, l) => s + Number(l.debito || 0), 0);
                const cred = (a.lineas || []).reduce((s, l) => s + Number(l.credito || 0), 0);
                return <tr key={a.id} className="hover:bg-slate-50">
                  <Td mono className="font-black text-blue-600">{a.numero}</Td>
                  <Td>{dd(a.fecha)}</Td>
                  <Td className="max-w-[200px] truncate">{a.descripcion}</Td>
                  <Td><Badge v={a.tipo === 'Manual' ? 'blue' : a.tipo === 'Apertura' ? 'green' : 'gray'}>{a.tipo || 'Manual'}</Badge></Td>
                  <Td right mono className="text-emerald-700 font-black">${fmt(deb)}</Td>
                  <Td right mono className="text-red-600 font-black">${fmt(cred)}</Td>
                </tr>;
              })}</tbody>
            </table>}
        </Card>
      </div>
    );
  };

  const LibroDiarioView = () => {
    const [search, setSearch] = useState('');
    const filtered = asientos.filter(a => a.descripcion?.toLowerCase().includes(search.toLowerCase()) || a.numero?.includes(search));
    return (
      <Card title="Libro Diario" subtitle={`${asientos.length} asientos registrados`}
        action={<div className="flex gap-2"><div className="relative"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..." className="border-2 border-slate-200 rounded-xl pl-8 pr-3 py-2 text-xs outline-none focus:border-blue-500 w-36" /></div></div>}>
        {filtered.length === 0 ? <EmptyState icon={BookMarked} title="Sin asientos" desc="No hay asientos que coincidan" /> :
          <div className="space-y-3">
            {filtered.map(a => {
              const deb = (a.lineas || []).reduce((s, l) => s + Number(l.debito || 0), 0);
              const cred = (a.lineas || []).reduce((s, l) => s + Number(l.credito || 0), 0);
              const balOk = Math.abs(deb - cred) < 0.01;
              return (
                <div key={a.id} className="border border-slate-100 rounded-xl overflow-hidden hover:border-blue-200 transition-colors">
                  <div className="flex items-center justify-between px-5 py-3 bg-slate-50 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-black text-blue-600 text-sm">{a.numero}</span>
                      <span className="text-xs text-slate-500">{dd(a.fecha)}</span>
                      <Badge v={a.tipo === 'Manual' ? 'blue' : 'green'}>{a.tipo || 'Manual'}</Badge>
                    </div>
                    <div className="flex items-center gap-3">
                      {!balOk && <Badge v="red">Desbalanceado</Badge>}
                      <button onClick={() => deleteDoc(dref('cont_asientos', a.id))} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={12} /></button>
                    </div>
                  </div>
                  <div className="px-5 py-3"><p className="text-xs font-semibold text-slate-700 mb-3">{a.descripcion}</p>
                    <table className="w-full">
                      <thead><tr><th className="text-[9px] font-black uppercase tracking-widest text-slate-400 text-left pb-1.5 w-24">Código</th><th className="text-[9px] font-black uppercase tracking-widest text-slate-400 text-left pb-1.5">Cuenta</th><th className="text-[9px] font-black uppercase tracking-widest text-slate-400 text-right pb-1.5 w-28">Débito</th><th className="text-[9px] font-black uppercase tracking-widest text-slate-400 text-right pb-1.5 w-28">Crédito</th></tr></thead>
                      <tbody>{(a.lineas || []).map((l, i) => <tr key={i} className={l.debito > 0 ? '' : 'bg-slate-50/50'}>
                        <td className="font-mono font-bold text-xs text-blue-600 py-1 pr-3">{l.cuentaCodigo}</td>
                        <td className={`text-xs py-1 ${l.debito > 0 ? 'font-semibold text-slate-800' : 'pl-8 text-slate-500'}`}>{l.cuentaNombre}</td>
                        <td className="text-right font-mono text-xs py-1 text-emerald-700 font-bold">{Number(l.debito) > 0 ? `$${fmt(l.debito)}` : ''}</td>
                        <td className="text-right font-mono text-xs py-1 text-red-600 font-bold">{Number(l.credito) > 0 ? `$${fmt(l.credito)}` : ''}</td>
                      </tr>)}</tbody>
                      <tfoot><tr className="border-t-2 border-slate-200"><td colSpan={2} className="pt-2 text-[10px] font-black uppercase text-slate-400">TOTALES</td><td className="pt-2 text-right font-mono font-black text-xs text-emerald-700">${fmt(deb)}</td><td className="pt-2 text-right font-mono font-black text-xs text-red-600">${fmt(cred)}</td></tr></tfoot>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>}
      </Card>
    );
  };

  const NuevoAsientoView = () => {
    const [form, setForm] = useState({ fecha: today(), descripcion: '', tipo: 'Manual', referencia: '' });
    const [lineas, setLineas] = useState([{ cuentaId: '', cuentaCodigo: '', cuentaNombre: '', debito: '', credito: '' }, { cuentaId: '', cuentaCodigo: '', cuentaNombre: '', debito: '', credito: '' }]);
    const [busy, setBusy] = useState(false);
    const totDeb = lineas.reduce((s, l) => s + Number(l.debito || 0), 0);
    const totCred = lineas.reduce((s, l) => s + Number(l.credito || 0), 0);
    const balOk = totDeb > 0 && Math.abs(totDeb - totCred) < 0.01;

    const setCuenta = (i, cuentaId) => {
      const c = cuentas.find(x => x.id === cuentaId);
      const n = [...lineas]; n[i] = { ...n[i], cuentaId, cuentaCodigo: c?.codigo || '', cuentaNombre: c?.nombre || '' }; setLineas(n);
    };

    const save = async () => {
      if (!form.descripcion) return alert('Ingrese la descripción del asiento');
      if (!balOk) return alert('El asiento no está balanceado (Débitos ≠ Créditos)');
      const lineasValidas = lineas.filter(l => l.cuentaId && (Number(l.debito) > 0 || Number(l.credito) > 0));
      if (lineasValidas.length < 2) return alert('Se requieren al menos 2 líneas contables');
      setBusy(true);
      try {
        const numero = `AS-${String(asientos.length + 1).padStart(5, '0')}`; const id = gid();
        await setDoc(dref('cont_asientos', id), { id, numero, fecha: form.fecha, descripcion: form.descripcion.toUpperCase(), tipo: form.tipo, referencia: form.referencia, lineas: lineasValidas.map(l => ({ ...l, debito: Number(l.debito || 0), credito: Number(l.credito || 0) })), totalDebito: totDeb, totalCredito: totCred, ts: serverTimestamp() });
        setForm({ fecha: today(), descripcion: '', tipo: 'Manual', referencia: '' }); setLineas([{ cuentaId: '', cuentaCodigo: '', cuentaNombre: '', debito: '', credito: '' }, { cuentaId: '', cuentaCodigo: '', cuentaNombre: '', debito: '', credito: '' }]);
        setSec('libro');
      } finally { setBusy(false); }
    };

    return (
      <div>
        <Card title="Nuevo Asiento de Diario">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 pb-6 border-b border-slate-100">
            <FG label="Fecha"><input type="date" className={inp} value={form.fecha} onChange={e => setForm({ ...form, fecha: e.target.value })} /></FG>
            <FG label="Tipo"><select className={sel} value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })}><option>Manual</option><option>Apertura</option><option>Cierre</option><option>Ajuste</option><option>Nómina</option></select></FG>
            <FG label="Referencia"><input className={inp} value={form.referencia} onChange={e => setForm({ ...form, referencia: e.target.value })} placeholder="FACT-00001 / OC-001" /></FG>
            <FG label="Descripción" full><input className={inp} value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} placeholder="Descripción del asiento contable..." /></FG>
          </div>

          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-black uppercase text-slate-700 tracking-wide">Líneas del Asiento (Partida Doble)</h4>
            <button onClick={() => setLineas([...lineas, { cuentaId: '', cuentaCodigo: '', cuentaNombre: '', debito: '', credito: '' }])} className="text-[10px] font-black uppercase text-blue-500 flex items-center gap-1 hover:bg-blue-50 px-2 py-1 rounded-lg transition-colors"><Plus size={12} /> Línea</button>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden mb-4">
            <div className="grid grid-cols-12 gap-0 bg-slate-50 px-4 py-2 border-b border-slate-200">
              <div className="col-span-7 text-[9px] font-black uppercase tracking-widest text-slate-400">Cuenta Contable</div>
              <div className="col-span-2 text-[9px] font-black uppercase tracking-widest text-slate-400 text-right">Débito</div>
              <div className="col-span-2 text-[9px] font-black uppercase tracking-widest text-slate-400 text-right">Crédito</div>
              <div className="col-span-1"></div>
            </div>
            {lineas.map((l, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 px-3 py-2 border-b border-slate-100 items-center">
                <div className="col-span-7">
                  <select className={`${sel} text-[11px]`} value={l.cuentaId} onChange={e => setCuenta(i, e.target.value)}>
                    <option value="">— Seleccione cuenta —</option>
                    {[...cuentas].sort((a, b) => String(a.codigo).localeCompare(String(b.codigo))).map(c => <option key={c.id} value={c.id}>{c.codigo} · {c.nombre}</option>)}
                  </select>
                </div>
                <div className="col-span-2"><input type="number" step="0.01" className={`${inp} text-right text-emerald-700 font-black`} value={l.debito} onChange={e => { const n = [...lineas]; n[i].debito = e.target.value; if (e.target.value) n[i].credito = ''; setLineas(n); }} placeholder="0.00" /></div>
                <div className="col-span-2"><input type="number" step="0.01" className={`${inp} text-right text-red-600 font-black`} value={l.credito} onChange={e => { const n = [...lineas]; n[i].credito = e.target.value; if (e.target.value) n[i].debito = ''; setLineas(n); }} placeholder="0.00" /></div>
                <div className="col-span-1 flex justify-center"><button onClick={() => { const n = [...lineas]; n.splice(i, 1); setLineas(n); }} className="p-1 text-red-400 hover:text-red-600 transition-colors"><Trash2 size={12} /></button></div>
              </div>
            ))}
            <div className="grid grid-cols-12 gap-2 px-3 py-3 bg-slate-900 items-center">
              <div className="col-span-7 text-[10px] font-black uppercase text-slate-400 tracking-widest">TOTALES</div>
              <div className={`col-span-2 text-right font-mono font-black text-sm ${balOk ? 'text-emerald-400' : 'text-white'}`}>${fmt(totDeb)}</div>
              <div className={`col-span-2 text-right font-mono font-black text-sm ${balOk ? 'text-emerald-400' : 'text-white'}`}>${fmt(totCred)}</div>
              <div className="col-span-1 text-center">{balOk ? <CheckCircle size={16} className="text-emerald-400 mx-auto" /> : <X size={16} className="text-red-400 mx-auto" />}</div>
            </div>
          </div>

          {!balOk && totDeb > 0 && <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 flex items-center gap-2"><AlertTriangle size={14} className="text-amber-600 flex-shrink-0" /><p className="text-[10px] font-black text-amber-700 uppercase">Diferencia: ${fmt(Math.abs(totDeb - totCred))} — El asiento debe estar balanceado para registrar.</p></div>}
          {balOk && <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 mb-4 flex items-center gap-2"><CheckCircle size={14} className="text-emerald-600 flex-shrink-0" /><p className="text-[10px] font-black text-emerald-700 uppercase">Asiento balanceado — Partida doble correcta.</p></div>}

          <div className="flex justify-end gap-3">
            <Bo onClick={() => setSec('libro')}>Cancelar</Bo>
            <Bg onClick={save} disabled={busy || !balOk}>{busy ? 'Registrando...' : 'Registrar Asiento'}</Bg>
          </div>
        </Card>
      </div>
    );
  };

  const navGroups = [
    { group: 'Analítica', items: [{ id: 'dashboard', label: 'Resumen Contable', icon: LayoutDashboard }] },
    { group: 'Libro Diario', items: [{ id: 'libro', label: 'Ver Asientos', icon: BookMarked }, { id: 'nuevo', label: 'Nuevo Asiento', icon: Plus }] },
  ];
  const views = { dashboard: <DashboardView />, libro: <LibroDiarioView />, nuevo: <NuevoAsientoView /> };
  const curNav = navGroups.flatMap(g => g.items).find(n => n.id === sec);

  return (
    <SidebarLayout brand="Supply G&B" brandSub="Libro Diario" navGroups={navGroups} activeId={sec} onNav={setSec} onBack={onBack} accentColor={BLUE}
      headerContent={<>
        <div><h1 className="font-black text-slate-800 text-sm uppercase tracking-wide">{curNav?.label}</h1><p className="text-[9px] text-slate-400 font-medium uppercase tracking-widest">Contabilidad <ChevronRight size={8} className="inline" /> Libro Diario</p></div>
        <Bg onClick={() => setSec('nuevo')} sm><Plus size={12} /> Nuevo Asiento</Bg>
      </>}>
      {views[sec]}
    </SidebarLayout>
  );
}

// ============================================================================
// MÓDULO BALANCES (Placeholder informativo)
// ============================================================================
function BalancesApp({ onBack }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ background: BG }}>
      <div className="bg-white rounded-3xl p-12 shadow-sm border border-slate-100 text-center max-w-md w-full">
        <div className="w-20 h-20 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-6"><BarChart3 size={36} className="text-emerald-500" /></div>
        <h2 className="text-xl font-black text-slate-900 uppercase tracking-wide mb-2">Balances & Reportes</h2>
        <p className="text-slate-500 text-sm font-medium mb-8 leading-relaxed">Balance de Comprobación, Estado de Resultados y Balance General — próxima versión.</p>
        <button onClick={onBack} className="bg-slate-900 text-white px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-700 transition-colors flex items-center gap-2 mx-auto"><ArrowLeft size={14} /> Volver</button>
      </div>
    </div>
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

  const navGroups = [
    { group: 'General', items: [{ id: 'empresa', label: 'Datos de Empresa', icon: Building2 }] },
    { group: 'Seguridad', items: [{ id: 'usuarios', label: 'Usuarios & Roles', icon: Users }] },
    { group: 'Financiero', items: [{ id: 'tasas', label: 'Tasa de Cambio', icon: Globe }] },
  ];
  const curNav = navGroups.flatMap(g => g.items).find(n => n.id === sec);

  return (
    <SidebarLayout brand="Supply G&B" brandSub="Configuración Maestra" navGroups={navGroups} activeId={sec} onNav={setSec} onBack={() => { setAdminUnlocked(false); onBack(); }} accentColor="#8b5cf6"
      headerContent={<>
        <div><h1 className="font-black text-slate-800 text-sm uppercase tracking-wide">{curNav?.label}</h1><p className="text-[9px] text-slate-400 font-medium uppercase tracking-widest">Configuración <ChevronRight size={8} className="inline" /> {navGroups.find(g => g.items.find(i => i.id === sec))?.group}</p></div>
        <button onClick={() => setAdminUnlocked(false)} className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-500 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors"><Lock size={13} /> Bloquear</button>
      </>}>
      {sec === 'empresa' && (
        <Card title="Datos de la Empresa">
          <div className="grid grid-cols-2 gap-5">
            <FG label="Razón Social" full><input className={inp} defaultValue="Servicios Jiret G&B, C.A." /></FG>
            <FG label="RIF / NIT"><input className={inp} defaultValue="J-412309374" /></FG>
            <FG label="Teléfono"><input className={inp} defaultValue="+58 414-0000000" /></FG>
            <FG label="Email"><input type="email" className={inp} defaultValue="admin@jiretgb.com" /></FG>
            <FG label="Dirección Fiscal" full><input className={inp} defaultValue="Caracas, Venezuela" /></FG>
            <FG label="Actividad Económica" full><input className={inp} defaultValue="Suministros y servicios industriales" /></FG>
            <div className="col-span-2 flex justify-end mt-2"><Bg><Save size={14} /> Guardar Cambios</Bg></div>
          </div>
        </Card>
      )}
      {sec === 'tasas' && <TasasConfig />}
      {sec === 'usuarios' && (
        <Card title="Directorio de Usuarios" subtitle="Gestión de accesos al sistema" action={<Bg sm><UserPlus size={13} /> Nuevo Usuario</Bg>}>
          <table className="w-full"><thead><tr><Th>Nombre</Th><Th>Usuario</Th><Th>Rol</Th><Th>Estado</Th><Th></Th></tr></thead>
            <tbody>{(systemUsers || []).map(u => <tr key={u.id} className="hover:bg-slate-50">
              <Td className="font-black text-slate-900 uppercase">{u.name}</Td>
              <Td mono className="text-slate-500">{u.username || 'admin'}</Td>
              <Td><Badge v={u.role === 'Master' ? 'red' : 'blue'}>{u.role}</Badge></Td>
              <Td><Badge v="green">Activo</Badge></Td>
              <Td><button className="p-1.5 text-slate-400 hover:text-orange-500 rounded-lg transition-colors"><Settings size={13} /></button></Td>
            </tr>)}</tbody>
          </table>
        </Card>
      )}
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
        onSnapshot(doc(db, 'settings', 'general'), d => { if (d.exists()) setSettings(d.data()); });
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
      {view === 'facturacion' && <FacturacionApp fbUser={fbUser} tasasList={tasasList} onBack={() => go('admin_dash')} />}
      {view === 'inventario' && <InventarioApp fbUser={fbUser} onBack={() => go('admin_dash')} />}
      {view === 'banco' && <BancoApp fbUser={fbUser} onBack={() => go('admin_dash')} />}
      {view === 'contabilidad' && <ContabilidadApp fbUser={fbUser} onBack={() => go('cont_dash')} />}
      {view === 'asientos' && <AsientosApp fbUser={fbUser} onBack={() => go('cont_dash')} />}
      {view === 'balances' && <BalancesApp onBack={() => go('cont_dash')} />}
      {view === 'configuracion' && <ConfiguracionApp settings={settings} systemUsers={systemUsers} tasasList={tasasList} onBack={() => go('admin_dash')} />}
    </ErrorBoundary>
  );
}

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
  Settings, Home, Factory, TestTube, Lock, User, ArrowRight,
  Settings2, Mail, CreditCard, CalendarDays, FileCheck, MapPin, Image as ImageIcon, Key, PieChart
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import {
  getFirestore, collection, doc, setDoc, updateDoc,
  onSnapshot, deleteDoc, query, orderBy, serverTimestamp, writeBatch
} from 'firebase/firestore';

// ============================================================================
// CONFIGURACIÓN FIREBASE & UTILIDADES GLOBALES
// ============================================================================
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, errorMsg: '' }; }
  static getDerivedStateFromError(error) { return { hasError: true }; }
  componentDidCatch(error) { this.setState({ errorMsg: error?.message || String(error) }); }
  render() {
    if (this.state.hasError) return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 print:hidden">
        <AlertTriangle size={60} className="text-red-500 mb-4" />
        <h2 className="text-2xl font-black text-black uppercase mb-2">Sistema Protegido de Caída</h2>
        <p className="text-gray-500 text-sm mb-6">{this.state.errorMsg}</p>
        <button onClick={() => window.location.reload()} className="bg-black text-white font-black px-8 py-4 rounded-xl uppercase tracking-widest text-xs shadow-lg">Recargar Interfaz</button>
      </div>
    );
    return this.props.children; 
  }
}

const compressImage = (file, callback) => {
  const reader = new FileReader(); reader.readAsDataURL(file);
  reader.onload = event => {
    const img = new Image(); img.src = event.target.result;
    img.onload = () => {
      const canvas = document.createElement('canvas'); const ctx = canvas.getContext('2d');
      const MAX_WIDTH = 1920; let width = img.width; let height = img.height;
      if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
      canvas.width = width; canvas.height = height; ctx.drawImage(img, 0, 0, width, height);
      callback(canvas.toDataURL('image/jpeg', 0.6)); 
    };
  };
};

const firebaseConfig = {
  apiKey: "AIzaSyBri2uZAaxsH4S0OpqhYvXB4wfCqo4g3sk", authDomain: "erp-gyb-supply.firebaseapp.com",
  projectId: "erp-gyb-supply", storageBucket: "erp-gyb-supply.firebasestorage.app",
  messagingSenderId: "201939139821", appId: "1:201939139821:web:95e5f589e546d7d557e0e4",
};
const fbApp = initializeApp(firebaseConfig, 'erp_master');
const auth = getAuth(fbApp); const db = getFirestore(fbApp, "us-central");
const dref = (n, id) => doc(db, n, String(id)); const col = (n) => collection(db, n);

const fmt = (n) => new Intl.NumberFormat('es-VE',{minimumFractionDigits:2,maximumFractionDigits:2}).format(Number(n)||0);
const today = () => { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
const dd = (s) => { if(!s) return '—'; const [y,m,d]=s.split('-'); return `${d}/${m}/${y}`; };
const gid = () => Date.now().toString(36)+Math.random().toString(36).slice(2,6);

// ============================================================================
// COMPONENTES UI
// ============================================================================
const Badge = ({children, v='green'}) => {
  const s={green:'bg-emerald-100 text-emerald-700',red:'bg-red-100 text-red-600',gold:'bg-orange-100 text-orange-700',blue:'bg-blue-100 text-blue-700',gray:'bg-gray-100 text-gray-500'};
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide ${s[v]||s.gray}`}>{children}</span>;
};
const Pill = ({children, usd}) => <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase ${usd?'bg-black text-white':'bg-[#f97316] text-white'}`}>{children}</span>;
const KPI = ({label,value,sub,accent='green',Icon}) => {
  const a={green:'border-emerald-500',gold:'border-[#f97316]',blue:'border-blue-500',red:'border-red-500'};
  return (
    <div className={`bg-white rounded-2xl border-2 border-gray-100 border-t-4 ${a[accent]} p-5 shadow-sm`}>
      <div className="flex items-start justify-between mb-3"><p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{label}</p>{Icon && <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center"><Icon size={15} className="text-gray-400"/></div>}</div>
      <p className="font-black text-2xl text-black font-mono">{value}</p>{sub && <p className="text-[10px] text-gray-400 mt-1.5 font-medium">{sub}</p>}
    </div>
  );
};
const Card = ({title,subtitle,action,children,noPad}) => (
  <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden mb-5">
    {(title||action) && <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-3"><div>{title && <h3 className="font-black text-black text-sm uppercase tracking-wide">{title}</h3>}{subtitle && <p className="text-[10px] text-gray-400 mt-0.5 font-medium">{subtitle}</p>}</div>{action}</div>}
    <div className={noPad?'':'p-6'}>{children}</div>
  </div>
);
const BarChart = ({data=[],height=120}) => {
  const max = Math.max(...data.map(d=>d.value),1);
  return (
    <div className="flex items-end gap-2 w-full" style={{height}}>
      {data.map((d,i)=>(<div key={i} className="flex-1 flex flex-col items-center gap-1"><div className="w-full rounded-t-lg" style={{height:`${Math.max((d.value/max)*(height-24),4)}px`,background:d.color||'#000000'}}/><span className="text-[9px] font-black text-gray-400 uppercase truncate w-full text-center">{d.label}</span></div>))}
    </div>
  );
};
const Donut = ({segs=[],size=120}) => {
  const r=42; const cx=size/2; const cy=size/2; const circ=2*Math.PI*r; const total=segs.reduce((a,s)=>a+s.value,0)||1; let off=0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f3f4f6" strokeWidth="14"/>
      {segs.map((s,i)=>{const pct=s.value/total; const dash=pct*circ; const el=<circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={s.color} strokeWidth="14" strokeDasharray={`${dash} ${circ-dash}`} strokeDashoffset={-off*circ} style={{transform:`rotate(-90deg)`,transformOrigin:`${cx}px ${cy}px`}}/>; off+=pct; return el;})}
    </svg>
  );
};
const Modal = ({open,onClose,title,children,footer,wide}) => {
  if(!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{background:'rgba(0,0,0,.8)'}} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className={`bg-white rounded-[2.5rem] w-full ${wide?'max-w-4xl':'max-w-lg'} max-h-[90vh] flex flex-col shadow-2xl`}>
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 flex-shrink-0"><h2 className="font-black text-black uppercase tracking-widest text-sm">{title}</h2><button onClick={onClose} className="w-10 h-10 rounded-2xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"><X size={18} className="text-gray-500"/></button></div>
        <div className="overflow-y-auto flex-1 p-8">{children}</div>
        {footer && <div className="px-8 py-5 border-t border-gray-100 flex justify-end gap-3 flex-shrink-0 bg-gray-50 rounded-b-[2.5rem]">{footer}</div>}
      </div>
    </div>
  );
};
const FG = ({label,children,full}) => <div className={full?'col-span-2':''}><label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5">{label}</label>{children}</div>;
const inp = "w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-[#f97316] transition-colors bg-white text-black";
const Bp = ({onClick,children,sm}) => <button onClick={onClick} className={`bg-black text-white font-black uppercase tracking-widest ${sm?'text-[9px] px-3 py-2':'text-[10px] px-6 py-3'} rounded-xl hover:bg-gray-800 transition-all flex items-center justify-center gap-2`}>{children}</button>;
const Bg = ({onClick,children,sm}) => <button onClick={onClick} className={`bg-[#f97316] text-white font-black uppercase tracking-widest ${sm?'text-[9px] px-3 py-2':'text-[10px] px-6 py-3'} rounded-xl hover:bg-[#ea580c] transition-all shadow-md flex items-center justify-center gap-2`}>{children}</button>;
const Bo = ({onClick,children,sm}) => <button onClick={onClick} className={`border-2 border-gray-200 bg-white text-gray-600 font-black uppercase tracking-widest ${sm?'text-[9px] px-3 py-2':'text-[10px] px-6 py-3'} rounded-xl hover:bg-gray-50 transition-all flex items-center justify-center gap-2`}>{children}</button>;
const Th = ({children,right}) => <th className={`px-4 py-3 text-[9px] font-black uppercase tracking-widest text-gray-400 border-b-2 border-gray-100 bg-gray-50 ${right?'text-right':'text-left'} whitespace-nowrap`}>{children}</th>;
const Td = ({children,right,mono,className=''}) => <td className={`px-4 py-3 text-xs border-b border-gray-50 ${right?'text-right':''} ${mono?'font-mono':'font-medium'} ${className}`}>{children}</td>;


// ============================================================================
// LOGIN SCREEN
// ============================================================================
function LoginScreen({ onLogin, settings, systemUsers }) {
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault(); 
    const user = loginData.username.toLowerCase().trim(); const pass = loginData.password.trim();
    const foundUser = (systemUsers || []).find(u => u.username === user && u.password === pass);
    if (foundUser || (user === 'admin' && pass === '1234')) { 
      onLogin(foundUser || { name: 'Administrador Maestro', role: 'Master' }); setLoginError(''); 
    } else { setLoginError('Credenciales incorrectas. Intente nuevamente.'); }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative" style={{ backgroundImage: settings?.loginBg ? `url(${settings.loginBg})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center' }}>
      {settings?.loginBg && <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>}
      <div className="bg-white p-12 rounded-[2rem] shadow-2xl w-full max-w-md relative z-10 border-t-8 border-orange-500 transform transition-all">
        <div className="text-center mb-10">
          <span className="text-3xl font-light tracking-widest text-gray-800">Supply</span>
          <div className="flex items-center justify-center -mt-2"><span className="text-black font-black text-[50px] leading-none">G</span><div className="bg-orange-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-xl font-black mx-1 shadow-inner">&amp;</div><span className="text-black font-black text-[50px] leading-none">B</span></div>
          <p className="text-[10px] font-black tracking-widest text-gray-400 mt-2 uppercase">Enterprise Resource Planning</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-6">
          <div><label className="block text-[10px] font-black text-gray-500 uppercase mb-2 tracking-widest">Usuario de Acceso</label><div className="relative"><User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18}/><input type="text" required value={loginData.username} onChange={(e) => setLoginData({...loginData, username: e.target.value})} className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-black outline-none focus:border-orange-500 focus:bg-white transition-all text-black" placeholder="admin" /></div></div>
          <div><label className="block text-[10px] font-black text-gray-500 uppercase mb-2 tracking-widest">Clave de Seguridad</label><div className="relative"><Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18}/><input type="password" required value={loginData.password} onChange={(e) => setLoginData({...loginData, password: e.target.value})} className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-black outline-none focus:border-orange-500 focus:bg-white transition-all text-black" placeholder="••••••••" /></div></div>
          {loginError && <div className="bg-red-50 text-red-500 text-[10px] font-black uppercase p-3 rounded-xl text-center border border-red-100 animate-pulse">{loginError}</div>}
          <button type="submit" className="w-full bg-black text-white font-black py-5 rounded-2xl uppercase tracking-widest text-xs hover:bg-gray-900 transition-all shadow-xl hover:shadow-orange-500/20 mt-4 flex justify-center items-center gap-2">INGRESAR AL SISTEMA <ArrowRight size={16}/></button>
        </form>
        <div className="mt-8 text-center"><p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">© {new Date().getFullYear()} Jiret G&B C.A.</p></div>
      </div>
    </div>
  );
}

// ============================================================================
// PANTALLA 2: SELECTOR PRINCIPAL DE ÁREAS
// ============================================================================
function MainSelector({ onSelect }) {
  return (
    <div className="min-h-screen bg-[#f3f4f6] flex items-center justify-center p-6">
      <div className="flex flex-col md:flex-row gap-8 max-w-5xl w-full">
        <div onClick={() => onSelect('admin_dash')} className="flex-1 bg-[#0a0a0a] rounded-[2.5rem] p-12 cursor-pointer border-l-8 border-[#f97316] shadow-2xl hover:-translate-y-2 hover:shadow-[#f97316]/20 transition-all duration-300 group text-center">
          <div className="w-28 h-28 bg-[#1a1a1a] rounded-full flex items-center justify-center mb-8 mx-auto group-hover:scale-110 transition-transform duration-500"><Briefcase size={48} className="text-[#f97316]"/></div>
          <h2 className="text-2xl font-black text-white uppercase tracking-widest mb-4">Área Administrativa</h2>
          <p className="text-gray-400 text-sm font-medium leading-relaxed max-w-sm">Gestión de Facturación (CxC), Control de Inventario Multimoneda, Bancos y Configuración.</p>
        </div>
        <div onClick={() => onSelect('cont_dash')} className="flex-1 bg-white rounded-[2.5rem] p-12 cursor-pointer border-l-8 border-[#3b82f6] shadow-2xl hover:-translate-y-2 hover:shadow-[#3b82f6]/20 transition-all duration-300 group text-center">
          <div className="w-28 h-28 bg-blue-50 rounded-full flex items-center justify-center mb-8 mx-auto group-hover:scale-110 transition-transform duration-500"><Calculator size={48} className="text-[#3b82f6]"/></div>
          <h2 className="text-2xl font-black text-black uppercase tracking-widest mb-4">Área Contable</h2>
          <p className="text-gray-500 text-sm font-medium leading-relaxed max-w-sm">Mantenimiento de Plan de Cuentas Central, Asientos de Libro Diario y Balances.</p>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// DASHBOARD ADMINISTRATIVO
// ============================================================================
function AdminDashboard({ onSelectModule, onBack }) {
  const modAdmin = [
    { id: 'facturacion', name: 'Ventas y Facturación', icon: Receipt, dark: true, border: 'border-[#f97316]', text: 'text-[#f97316]', desc: 'Directorio, Facturas y CxC' },
    { id: 'inventario', name: 'Control Inventario', icon: Package, dark: true, border: 'border-[#f97316]', text: 'text-[#f97316]', desc: 'Catálogo y Movimientos' },
    { id: 'banco', name: 'Bancos y Tesorería', icon: Building2, dark: false, border: 'border-orange-400', text: 'text-orange-400', desc: 'Cuentas, Vales y Liquidez' },
    { id: 'reportes', name: 'Reportes Financieros', icon: BarChart3, dark: false, border: 'border-blue-500', text: 'text-blue-500', desc: 'Dashboard de Rentabilidad' },
    { id: 'nomina', name: 'Gestión de Nómina', icon: Users, dark: false, border: 'border-gray-400', text: 'text-gray-400', desc: 'Personal y Comisiones' },
    { id: 'configuracion', name: 'Configuración Maestra', icon: Settings, dark: false, border: 'border-gray-300', text: 'text-gray-500', desc: 'Empresa, Roles y Tasas' }
  ];

  return (
    <div className="min-h-screen bg-[#f3f4f6] flex flex-col">
      <header className="bg-[#0a0a0a] px-6 py-4 flex items-center justify-between border-b-4 border-[#f97316]">
        <div className="flex items-center gap-12">
          <div className="flex items-center gap-2 cursor-pointer" onClick={onBack}><Blocks className="text-white" size={28} /><span className="text-white font-black text-xl tracking-widest">Supply <span className="text-[#f97316]">G&B</span></span></div>
          <nav className="hidden md:flex gap-6"><button onClick={onBack} className="bg-[#f97316] text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><Home size={14}/> Inicio</button></nav>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right hidden sm:block"><p className="text-[#f97316] text-[10px] font-black uppercase tracking-widest">Master</p><p className="text-white text-xs font-black uppercase">Administrador General</p></div>
          <div className="flex items-center gap-3 border-l border-gray-800 pl-6">
            <button onClick={() => onSelectModule('configuracion')} className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center text-gray-400 hover:text-white border border-gray-800"><Settings size={18}/></button>
            <button onClick={() => window.location.reload()} className="px-4 py-2 rounded-xl border border-red-900/50 text-red-500 hover:bg-red-500 hover:text-white transition-colors flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"><LogOut size={14}/> Salir</button>
          </div>
        </div>
      </header>
      <div className="flex-1 max-w-6xl mx-auto w-full p-8 md:p-12">
        <div className="text-center mb-12"><h2 className="text-3xl font-black text-black uppercase tracking-[0.2em]">Panel Administrativo ERP</h2><div className="w-16 h-1.5 bg-[#f97316] mx-auto mt-4 rounded-full"></div></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {modAdmin.map(mod => (
            <button key={mod.id} onClick={() => onSelectModule(mod.id)} className={`relative rounded-[2rem] p-6 text-left border-l-[6px] ${mod.border} shadow-lg hover:-translate-y-1 transition-all duration-300 group flex flex-col h-44 ${mod.dark ? 'bg-[#0a0a0a]' : 'bg-white'}`}>
              <mod.icon size={32} className={`${mod.color} mb-4 group-hover:scale-110 transition-transform`} strokeWidth={2} />
              <h3 className={`font-black text-sm uppercase tracking-wide mb-2 ${mod.dark ? 'text-white' : 'text-black'}`}>{mod.name}</h3>
              <p className={`text-[10px] font-medium leading-relaxed ${mod.dark ? 'text-gray-400' : 'text-gray-500'}`}>{mod.desc}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// DASHBOARD CONTABLE
// ============================================================================
function ContableDashboard({ onSelectModule, onBack }) {
  const modCont = [
    { id: 'contabilidad', name: 'Plan de Cuentas / Maestro', icon: BookOpen, type: 'white', color: 'text-[#3b82f6]', border: 'border-[#3b82f6]', desc: 'Estructura de cuentas (PUC) y clasificación' },
    { id: 'asientos', name: 'Asientos de Libro Diario', icon: FileText, type: 'white', color: 'text-[#f97316]', border: 'border-[#f97316]', desc: 'Registro de operaciones y comprobantes' },
    { id: 'impuestos', name: 'Gestión de Impuestos', icon: Calculator, type: 'dark', color: 'text-red-500', border: 'border-red-500', desc: 'Retenciones IVA, ISLR y libros fiscales' }
  ];

  return (
    <div className="min-h-screen bg-[#f3f4f6] flex flex-col">
      <header className="bg-[#0a0a0a] px-6 py-4 flex items-center justify-between border-b-4 border-[#3b82f6]">
        <div className="flex items-center gap-12">
          <div className="flex items-center gap-2 cursor-pointer" onClick={onBack}><Blocks className="text-[#3b82f6]" size={28} /><span className="text-white font-black text-xl tracking-widest">Supply <span className="text-[#3b82f6]">G&B</span></span></div>
          <nav className="hidden md:flex gap-6"><button onClick={onBack} className="bg-[#3b82f6] text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><Home size={14}/> Contable</button></nav>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right hidden sm:block"><p className="text-[#3b82f6] text-[10px] font-black uppercase tracking-widest">Master</p><p className="text-white text-xs font-black uppercase">Contador General</p></div>
          <div className="flex items-center gap-3 border-l border-gray-800 pl-6"><button onClick={() => window.location.reload()} className="px-4 py-2 rounded-xl border border-red-900/50 text-red-500 hover:bg-red-500 hover:text-white transition-colors flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"><LogOut size={14}/> Salir</button></div>
        </div>
      </header>
      <div className="flex-1 max-w-5xl mx-auto w-full p-8 md:p-12">
        <div className="text-center mb-12"><h2 className="text-3xl font-black text-black uppercase tracking-[0.2em]">Panel Contable & Fiscal</h2><div className="w-16 h-1.5 bg-[#3b82f6] mx-auto mt-4 rounded-full"></div></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {modCont.map(mod => (
            <button key={mod.id} onClick={() => onSelectModule(mod.id)} className={`relative rounded-[2rem] p-8 text-left border-l-[6px] ${mod.border} shadow-lg hover:-translate-y-1 transition-all duration-300 group flex flex-col ${mod.type==='dark' ? 'bg-[#0a0a0a]' : 'bg-white'}`}>
              <mod.icon size={36} className={`${mod.color} mb-4 group-hover:scale-110 transition-transform`} strokeWidth={2} />
              <h3 className={`font-black text-lg uppercase tracking-wide mb-2 ${mod.type==='dark' ? 'text-white' : 'text-black'}`}>{mod.name}</h3>
              <p className={`text-xs font-medium leading-relaxed ${mod.type==='dark' ? 'text-gray-400' : 'text-gray-500'}`}>{mod.desc}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MÓDULO FACTURACIÓN Y CXC (BLUEPRINT DEFINITIVO)
// ============================================================================
function FacturacionApp({ fbUser, tasasList, onBack }) {
  const [sec, setSec] = useState('dashboard_cxc');
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

  // -- VISTA: DASHBOARD CXC --
  const DashboardCxC = () => {
    const totalCartera = facturas.reduce((a, f) => a + (f.saldoUSD||0), 0);
    const porVencer = facturas.filter(f => f.estado === 'Por Vencer' || (f.estado === 'Pendiente' && f.fechaVencimiento >= today())).reduce((a, f) => a + (f.saldoUSD||0), 0);
    const vencidas = facturas.filter(f => f.estado === 'Vencida' || (f.estado === 'Pendiente' && f.fechaVencimiento < today())).reduce((a, f) => a + (f.saldoUSD||0), 0);
    const ventasMes = facturas.filter(f => f.fechaEmision.startsWith(today().slice(0, 7))).reduce((a, f) => a + (f.total||0), 0);

    return (
      <div className="space-y-6">
        <div className="bg-black rounded-3xl p-8 flex justify-between items-center text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10"><p className="text-[10px] font-black uppercase text-gray-400 mb-1 tracking-widest">Cartera Viva (CxC Total)</p><p className="text-4xl font-mono font-black text-[#f97316]">$ {fmt(totalCartera)}</p></div>
          <div className="text-right relative z-10"><button className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2"><Download size={14}/> Reporte Ejecutivo</button></div>
          <div className="absolute -right-10 -bottom-10 opacity-10"><PieChart size={200} /></div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <KPI label="Ventas del Mes" value={`$ ${fmt(ventasMes)}`} accent="blue" Icon={TrendingUp} />
          <KPI label="Facturas Por Vencer" value={`$ ${fmt(porVencer)}`} accent="green" Icon={CheckCircle} />
          <KPI label="Cartera Vencida (Riesgo)" value={`$ ${fmt(vencidas)}`} accent="red" Icon={AlertTriangle} />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card title="Últimas Facturas Emitidas">
            <table className="w-full">
              <thead><tr><Th>Factura</Th><Th>Cliente</Th><Th right>Total</Th><Th>Estado</Th></tr></thead>
              <tbody>
                {facturas.slice(0, 5).map(f => (
                  <tr key={f.id} className="hover:bg-gray-50 border-b border-gray-50">
                    <Td mono className="font-black text-[#f97316]">{f.numero}</Td>
                    <Td className="truncate max-w-[120px]">{f.clienteNombre}</Td>
                    <Td right mono>${fmt(f.total)}</Td>
                    <Td><Badge v={f.estado==='Pagada'?'green':f.fechaVencimiento < today() ? 'red' : 'gold'}>{f.estado}</Badge></Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
          <Card title="Últimos Pagos (Liquidaciones)">
            <table className="w-full">
              <thead><tr><Th>Fecha</Th><Th>Factura</Th><Th>Método</Th><Th right>Monto</Th></tr></thead>
              <tbody>
                {pagos.slice(0, 5).map(p => (
                  <tr key={p.id} className="hover:bg-gray-50 border-b border-gray-50">
                    <Td>{dd(p.fecha)}</Td><Td mono className="font-black">{p.facturaNumero}</Td>
                    <Td><span className="text-[10px] text-gray-500 uppercase">{p.metodo}</span></Td>
                    <Td right mono className="text-emerald-600 font-black">+${fmt(p.monto)}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      </div>
    );
  };

  // -- VISTA: CLIENTES --
  const ClientesView = () => {
    const [modal, setModal] = useState(false);
    const [form, setForm] = useState({ nombre: '', rif: '', direccion: '', telefono: '', diasCredito: '0' });
    const [busy, setBusy] = useState(false);

    const save = async () => {
      if (!form.nombre || !form.rif) return alert('Nombre y RIF requeridos');
      setBusy(true);
      try {
        const id = gid(); await setDoc(dref('facturacion_clientes', id), { ...form, id, ts: serverTimestamp() });
        setModal(false); setForm({ nombre: '', rif: '', direccion: '', telefono: '', diasCredito: '0' });
      } finally { setBusy(false); }
    };

    return (
      <div>
        <Card title="Directorio de Clientes" action={<Bg onClick={() => setModal(true)} sm><Plus size={14}/> Nuevo Cliente</Bg>}>
          <div className="overflow-x-auto"><table className="w-full">
            <thead><tr><Th>RIF / NIT</Th><Th>Razón Social</Th><Th>Teléfono</Th><Th>Días Crédito</Th><Th></Th></tr></thead>
            <tbody>
              {clientes.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-xs text-gray-400">Sin clientes registrados</td></tr>}
              {clientes.map(c => (
                <tr key={c.id} className="hover:bg-gray-50 border-b border-gray-50">
                  <Td mono className="font-black text-black">{c.rif}</Td><Td className="uppercase font-bold">{c.nombre}</Td>
                  <Td>{c.telefono}</Td><Td mono>{c.diasCredito} días</Td>
                  <Td><button onClick={() => deleteDoc(dref('facturacion_clientes', c.id))} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg"><Trash2 size={12}/></button></Td>
                </tr>
              ))}
            </tbody>
          </table></div>
        </Card>
        <Modal open={modal} onClose={() => setModal(false)} title="Registrar Cliente" footer={<><Bo onClick={() => setModal(false)}>Cancelar</Bo><Bg onClick={save}>{busy ? 'Guardando...' : 'Guardar'}</Bg></>}>
          <div className="grid grid-cols-2 gap-4">
            <FG label="Razón Social" full><input className={inp} value={form.nombre} onChange={e=>setForm({...form, nombre: e.target.value.toUpperCase()})} placeholder="EJ: INVERSIONES EJEMPLO C.A." /></FG>
            <FG label="RIF / NIT"><input className={inp} value={form.rif} onChange={e=>setForm({...form, rif: e.target.value.toUpperCase()})} placeholder="J-12345678-9" /></FG>
            <FG label="Teléfono Contacto"><input className={inp} value={form.telefono} onChange={e=>setForm({...form, telefono: e.target.value})} placeholder="0414-0000000" /></FG>
            <FG label="Días de Crédito (Vencimiento)"><input type="number" className={inp} value={form.diasCredito} onChange={e=>setForm({...form, diasCredito: e.target.value})} placeholder="15" /></FG>
            <FG label="Dirección Fiscal" full><input className={inp} value={form.direccion} onChange={e=>setForm({...form, direccion: e.target.value})} placeholder="Dirección completa..." /></FG>
          </div>
        </Modal>
      </div>
    );
  };

  // -- VISTA: FACTURACIÓN --
  const FacturasView = () => {
    const [modal, setModal] = useState(false);
    const [items, setItems] = useState([{ desc: '', cant: 1, precio: 0 }]);
    const [form, setForm] = useState({ clienteId: '', fechaEmision: today(), moneda: 'USD' });
    const [busy, setBusy] = useState(false);

    const subtotal = items.reduce((sum, item) => sum + (Number(item.cant) * Number(item.precio)), 0);
    const iva = subtotal * 0.16; const total = subtotal + iva;

    const saveFactura = async () => {
      if (!form.clienteId) return alert('Seleccione un cliente');
      if (items.length === 0 || !items[0].desc) return alert('Agregue al menos un producto');
      setBusy(true);
      try {
        const c = clientes.find(x => x.id === form.clienteId);
        const numero = `FACT-${String(facturas.length + 1).padStart(5, '0')}`; const id = gid();
        let fVenc = form.fechaEmision;
        if (c.diasCredito) { const d = new Date(form.fechaEmision); d.setDate(d.getDate() + Number(c.diasCredito)); fVenc = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }

        await setDoc(dref('facturacion_facturas', id), {
          id, numero, clienteId: c.id, clienteNombre: c.nombre, clienteRif: c.rif,
          fechaEmision: form.fechaEmision, fechaVencimiento: fVenc, moneda: form.moneda, tasaRef: tasaActiva,
          subtotal, iva, total, saldoUSD: total, estado: 'Pendiente', items, ts: serverTimestamp()
        });
        setModal(false); setForm({ clienteId: '', fechaEmision: today(), moneda: 'USD' }); setItems([{ desc: '', cant: 1, precio: 0 }]);
      } finally { setBusy(false); }
    };

    return (
      <div>
        <Card title="Historial de Facturación" action={<Bg onClick={() => setModal(true)}><Plus size={14}/> Emitir Factura</Bg>}>
          <div className="overflow-x-auto"><table className="w-full">
            <thead><tr><Th>Nro.</Th><Th>Fecha Emisión</Th><Th>Cliente</Th><Th>Vencimiento</Th><Th right>Total</Th><Th>Estado</Th></tr></thead>
            <tbody>
              {facturas.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-xs text-gray-400">Sin facturas emitidas</td></tr>}
              {facturas.map(f => (
                <tr key={f.id} className="hover:bg-gray-50 border-b border-gray-50">
                  <Td mono className="font-black text-[#f97316]">{f.numero}</Td><Td>{dd(f.fechaEmision)}</Td><Td className="uppercase font-bold">{f.clienteNombre}</Td>
                  <Td className={f.fechaVencimiento < today() && f.estado === 'Pendiente' ? 'text-red-500 font-bold' : ''}>{dd(f.fechaVencimiento)}</Td>
                  <Td right mono className="font-black text-black">${fmt(f.total)}</Td><Td><Badge v={f.estado==='Pagada'?'green':f.fechaVencimiento < today() ? 'red' : 'gold'}>{f.estado}</Badge></Td>
                </tr>
              ))}
            </tbody>
          </table></div>
        </Card>

        <Modal open={modal} onClose={() => setModal(false)} title="Emisión de Factura" wide footer={<><Bo onClick={() => setModal(false)}>Cancelar</Bo><Bg onClick={saveFactura}>{busy ? 'Procesando...' : 'Emitir Factura'}</Bg></>}>
          <div className="grid grid-cols-3 gap-4 mb-6 pb-6 border-b border-gray-100">
            <FG label="Cliente" full><select className={inp} value={form.clienteId} onChange={e=>setForm({...form, clienteId: e.target.value})}><option value="">Seleccione un cliente...</option>{clientes.map(c => <option key={c.id} value={c.id}>{c.rif} - {c.nombre}</option>)}</select></FG>
            <FG label="Fecha Emisión"><input type="date" className={inp} value={form.fechaEmision} onChange={e=>setForm({...form, fechaEmision: e.target.value})} /></FG>
          </div>
          <div className="mb-4 flex justify-between items-center"><h4 className="text-xs font-black uppercase text-black">Líneas de Facturación</h4><button onClick={() => setItems([...items, {desc:'',cant:1,precio:0}])} className="text-[10px] font-black uppercase text-[#f97316] flex items-center gap-1 hover:bg-orange-50 px-2 py-1 rounded"><Plus size={12}/> Fila</button></div>
          <div className="space-y-2 mb-6">
            {items.map((item, i) => (
              <div key={i} className="flex gap-2 items-center bg-gray-50 p-2 rounded-xl border border-gray-100">
                <input type="text" className={`${inp} flex-1`} placeholder="Descripción" value={item.desc} onChange={e=>{const n=[...items]; n[i].desc=e.target.value; setItems(n);}} />
                <input type="number" min="1" className={`${inp} w-20 text-center`} placeholder="Cant." value={item.cant} onChange={e=>{const n=[...items]; n[i].cant=e.target.value; setItems(n);}} />
                <input type="number" step="0.01" className={`${inp} w-32 text-right`} placeholder="Precio Unt." value={item.precio} onChange={e=>{const n=[...items]; n[i].precio=e.target.value; setItems(n);}} />
                <div className="w-28 text-right font-mono font-black text-xs text-gray-500">${fmt(item.cant * item.precio)}</div>
                <button onClick={()=>{const n=[...items]; n.splice(i,1); setItems(n);}} className="p-2 text-red-400 hover:text-red-600"><Trash2 size={14}/></button>
              </div>
            ))}
          </div>
          <div className="bg-black text-white p-6 rounded-2xl flex justify-end gap-12">
            <div className="text-right space-y-2 text-xs text-gray-400"><p>SUBTOTAL</p><p>IVA (16%)</p><p className="text-sm font-black text-white mt-2">TOTAL USD</p></div>
            <div className="text-right space-y-2 font-mono font-black"><p>${fmt(subtotal)}</p><p>${fmt(iva)}</p><p className="text-xl text-[#f97316] mt-1">${fmt(total)}</p></div>
          </div>
        </Modal>
      </div>
    );
  };

  // -- VISTA: CUENTAS POR COBRAR (PAGOS E IGTF) --
  const CuentasCobrarView = () => {
    const [modalPago, setModalPago] = useState(false);
    const [fActiva, setFActiva] = useState(null);
    const [formPago, setFormPago] = useState({ fecha: today(), monto: '', metodo: 'Transferencia Bs', ref: '' });
    const [busy, setBusy] = useState(false);

    const pendientes = facturas.filter(f => f.estado === 'Pendiente' || f.estado === 'Vencida' || f.estado === 'Por Vencer');

    const abonoUSD = Number(formPago.monto) || 0;
    const aplicaIGTF = formPago.metodo === 'Efectivo Divisas' || formPago.metodo === 'Zelle';
    const montoIGTF_USD = aplicaIGTF ? abonoUSD * 0.03 : 0;
    const totalDesembolsoUSD = abonoUSD + montoIGTF_USD;
    const montoBsPagar = abonoUSD * tasaActiva;
    const valorOriginalBs = abonoUSD * (fActiva?.tasaRef || tasaActiva);
    const diferencialBs = montoBsPagar - valorOriginalBs;

    const registrarPago = async () => {
      if (!formPago.monto || !formPago.ref) return alert('Monto y referencia requeridos');
      if (abonoUSD > fActiva.saldoUSD) return alert('El monto supera el saldo deudor.');
      setBusy(true);
      try {
        const pId = gid(); const nuevoSaldo = fActiva.saldoUSD - abonoUSD;
        const nuevoEstado = nuevoSaldo <= 0.01 ? 'Pagada' : 'Pendiente';
        const batch = writeBatch(db);
        batch.set(dref('facturacion_pagos', pId), { id: pId, facturaId: fActiva.id, facturaNumero: fActiva.numero, clienteNombre: fActiva.clienteNombre, fecha: formPago.fecha, monto: abonoUSD, igtf: montoIGTF_USD, difCambiario: diferencialBs, metodo: formPago.metodo, ref: formPago.ref, ts: serverTimestamp() });
        batch.update(dref('facturacion_facturas', fActiva.id), { saldoUSD: nuevoSaldo, estado: nuevoEstado });
        await batch.commit();
        setModalPago(false); setFormPago({ fecha: today(), monto: '', metodo: 'Transferencia Bs', ref: '' }); setFActiva(null);
      } finally { setBusy(false); }
    };

    return (
      <div>
        <Card title="Cuentas por Cobrar (Facturas Abiertas)">
          <div className="overflow-x-auto"><table className="w-full">
            <thead><tr><Th>Factura</Th><Th>Cliente</Th><Th>Vencimiento</Th><Th right>Tasa Origen</Th><Th right>Monto Total</Th><Th right>Saldo Deudor</Th><Th></Th></tr></thead>
            <tbody>
              {pendientes.length === 0 && <tr><td colSpan={7} className="text-center py-8 text-xs text-gray-400">Sin cuentas por cobrar.</td></tr>}
              {pendientes.map(f => (
                <tr key={f.id} className="hover:bg-gray-50 border-b border-gray-50">
                  <Td mono className="font-black text-black">{f.numero}</Td><Td className="uppercase">{f.clienteNombre}</Td>
                  <Td className={f.fechaVencimiento < today() ? 'text-red-500 font-bold' : ''}>{dd(f.fechaVencimiento)}{f.fechaVencimiento < today() && <span className="ml-2 text-[8px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded uppercase">Vencida</span>}</Td>
                  <Td right mono>{f.tasaRef}</Td><Td right mono>${fmt(f.total)}</Td><Td right mono className="font-black text-[#f97316]">${fmt(f.saldoUSD)}</Td>
                  <Td right><button onClick={() => { setFActiva(f); setFormPago({...formPago, monto: f.saldoUSD}); setModalPago(true); }} className="bg-black text-white px-3 py-1.5 rounded-lg text-[9px] font-black uppercase hover:bg-[#f97316] transition-colors">Abonar</button></Td>
                </tr>
              ))}
            </tbody>
          </table></div>
        </Card>

        <Modal open={modalPago} onClose={() => setModalPago(false)} title={`Liquidar Recibo - ${fActiva?.numero}`} footer={<><Bo onClick={() => setModalPago(false)}>Cancelar</Bo><Bg onClick={registrarPago}>{busy ? 'Contabilizando...' : 'Confirmar Pago'}</Bg></>}>
          {fActiva && (
            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex justify-between items-center"><div><p className="text-[10px] text-gray-500 font-black uppercase">Cliente</p><p className="font-black text-black">{fActiva.clienteNombre}</p></div><div className="text-right"><p className="text-[10px] text-gray-500 font-black uppercase">Saldo Restante</p><p className="font-mono font-black text-xl text-[#f97316]">${fmt(fActiva.saldoUSD)}</p></div></div>
              <div className="grid grid-cols-2 gap-4">
                <FG label="Fecha de Pago"><input type="date" className={inp} value={formPago.fecha} onChange={e=>setFormPago({...formPago, fecha: e.target.value})} /></FG>
                <FG label="Monto a Abonar (USD)"><input type="number" step="0.01" max={fActiva.saldoUSD} className={inp} value={formPago.monto} onChange={e=>setFormPago({...formPago, monto: e.target.value})} /></FG>
                <FG label="Método de Pago"><select className={inp} value={formPago.metodo} onChange={e=>setFormPago({...formPago, metodo: e.target.value})}><option>Transferencia Bs</option><option>Efectivo Divisas</option><option>Zelle</option></select></FG>
                <FG label="Nro. Referencia"><input type="text" className={inp} value={formPago.ref} onChange={e=>setFormPago({...formPago, ref: e.target.value})} placeholder="Ej: ZELLE-1234" /></FG>
                
                {formPago.metodo === 'Transferencia Bs' && (
                  <div className="col-span-2 bg-blue-50 border border-blue-100 rounded-xl p-4 grid grid-cols-3 gap-4">
                    <div><p className="text-[9px] font-black text-blue-600 uppercase mb-1">Cobrado (Bs.)</p><p className="font-mono font-black text-black">Bs. {fmt(montoBsPagar)}</p><p className="text-[9px] text-gray-500">Tasa: {tasaActiva}</p></div>
                    <div><p className="text-[9px] font-black text-gray-500 uppercase mb-1">Valor Original</p><p className="font-mono font-black text-gray-600">Bs. {fmt(valorOriginalBs)}</p><p className="text-[9px] text-gray-500">Tasa: {fActiva.tasaRef}</p></div>
                    <div className="border-l border-blue-200 pl-4"><p className="text-[9px] font-black text-blue-600 uppercase mb-1">Dif. Cambiario</p><p className={`font-mono font-black ${diferencialBs>=0?'text-emerald-600':'text-red-500'}`}>{diferencialBs>=0?'+':''}Bs. {fmt(diferencialBs)}</p></div>
                  </div>
                )}
                {aplicaIGTF && (
                  <div className="col-span-2 bg-orange-50 border border-orange-200 rounded-xl p-4 flex justify-between items-center">
                    <div><p className="text-[10px] font-black text-orange-700 uppercase tracking-widest flex items-center gap-2"><AlertTriangle size={14}/> Percepción IGTF (3%)</p><p className="text-[9px] text-gray-600 mt-1">El pago genera impuesto de transacción.</p></div>
                    <div className="text-right"><p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Monto IGTF</p><p className="font-mono font-black text-xl text-orange-600">${fmt(montoIGTF_USD)}</p></div>
                  </div>
                )}
              </div>
              {abonoUSD > 0 && (
                <div className="bg-black text-white p-6 rounded-2xl flex justify-between items-center mt-4">
                  <div className="space-y-1"><p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Desembolso Total Cliente</p><p className="text-[10px] text-gray-500">Abono Factura + IGTF (Si aplica)</p></div>
                  <div className="text-right font-mono font-black">{formPago.metodo === 'Transferencia Bs' ? <p className="text-2xl text-[#f97316]">Bs. {fmt(montoBsPagar)}</p> : <p className="text-2xl text-[#f97316]">${fmt(totalDesembolsoUSD)}</p>}</div>
                </div>
              )}
            </div>
          )}
        </Modal>
      </div>
    );
  };

  const NAV_FACT = [
    { id: 'dashboard_cxc', label: 'Resumen Ejecutivo', icon: LayoutDashboard, group: 'Analítica' },
    { id: 'clientes', label: 'Directorio Clientes', icon: Users, group: 'General' },
    { id: 'facturas', label: 'Emisión de Facturas', icon: Receipt, group: 'Operaciones' },
    { id: 'cxc', label: 'Cuentas por Cobrar', icon: Wallet, group: 'Finanzas' }
  ];

  const views = { dashboard_cxc: <DashboardCxC />, clientes: <ClientesView />, facturas: <FacturasView />, cxc: <CuentasCobrarView /> };
  const groups = [...new Set(NAV_FACT.map(n => n.group))];
  const curNav = NAV_FACT.find(n => n.id === sec);

  return (
    <div className="flex h-screen overflow-hidden bg-white w-full">
      <aside className="w-64 bg-black flex flex-col h-screen overflow-y-auto flex-shrink-0">
        <div className="px-6 py-6 border-b border-white/10 flex-shrink-0"><p className="font-black text-sm text-[#f97316] leading-tight">Servicios Jiret G&amp;B</p><p className="text-[9px] text-gray-400 uppercase tracking-widest mt-1">Facturación & CxC</p></div>
        <nav className="flex-1 py-4">
          {groups.map(group => (
            <div key={group} className="mb-4">
              <p className="px-6 pb-2 text-[8px] font-black uppercase tracking-[2px] text-gray-600">{group}</p>
              {NAV_FACT.filter(n => n.group === group).map(({ id, label, icon: Icon }) => (
                <button key={id} onClick={() => setSec(id)} className={`w-full flex items-center gap-3 px-6 py-2.5 text-left transition-all text-xs font-black uppercase tracking-wider ${sec === id ? 'bg-[#f97316] text-white shadow-lg shadow-[#f97316]/20 border-r-4 border-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>
                  <Icon size={16} className="flex-shrink-0" /><span className="truncate">{label}</span>
                </button>
              ))}
            </div>
          ))}
        </nav>
        <div className="p-4 border-t border-white/5"><button onClick={onBack} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#f97316] transition-colors"><ArrowLeft size={14}/> Volver al Panel</button></div>
      </aside>
      <div className="flex-1 flex flex-col overflow-hidden min-w-0 bg-[#f3f4f6]">
        <header className="bg-white border-b border-gray-100 px-8 h-16 flex items-center justify-between flex-shrink-0 shadow-sm">
          <div><h1 className="font-black text-black text-sm uppercase tracking-wide">{curNav?.label}</h1><p className="text-[9px] text-gray-400 font-medium uppercase tracking-widest">Ventas <ChevronRight size={8} className="inline"/> {curNav?.group}</p></div>
          <div className="flex items-center gap-4">
            <div className="bg-orange-50 border border-orange-200 rounded-full px-4 py-2 flex items-center gap-2 shadow-sm"><span className="text-[11px] font-black text-orange-700 font-mono tracking-tighter">Tasa Activa: {tasaActiva} Bs./$</span></div>
            <button onClick={() => setSec('facturas')} className="bg-[#f97316] text-white font-black text-[10px] uppercase tracking-widest px-4 py-2.5 rounded-xl hover:bg-[#ea580c] transition-colors flex items-center gap-2 shadow-md"><Plus size={14}/> Facturar</button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-8 max-w-6xl mx-auto w-full">{views[sec]}</main>
      </div>
    </div>
  );
}


// ============================================================================
// MÓDULO CONFIGURACIÓN (Con panel lateral y Tasas por Módulo)
// ============================================================================
function ConfiguracionApp({ settings, systemUsers, tasasList, onBack }) {
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [errorValidacion, setErrorValidacion] = useState(false);
  const [sec, setSec] = useState('empresa');

  const handleAdminValidation = () => {
    if (adminPassword === '1234' || adminPassword.toLowerCase() === 'admin') { setAdminUnlocked(true); setErrorValidacion(false); } 
    else { setErrorValidacion(true); setTimeout(() => setErrorValidacion(false), 2000); }
  };

  if (!adminUnlocked) {
    return (
      <div className="fixed inset-0 bg-[#0a0a0a]/90 flex items-center justify-center z-[200] p-4">
        <div className="bg-white rounded-[2.5rem] p-10 max-w-sm w-full shadow-2xl transform transition-all relative border border-white/20">
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-24 bg-[#0a0a0a] rounded-full flex items-center justify-center shadow-2xl border-4 border-[#f97316]"><Key size={40} className="text-[#f97316]" /></div>
          <div className="mt-12 text-center">
            <h3 className="text-2xl font-black text-black uppercase tracking-widest mb-2">Configuración</h3>
            <p className="text-gray-500 text-xs font-bold mb-8">Requiere privilegios de Administrador Master.</p>
            <div className="mb-8 relative">
              <input type="password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleAdminValidation()} placeholder="••••••••" className={`w-full border-2 ${errorValidacion ? 'border-red-500 bg-red-50' : 'border-gray-200'} rounded-2xl p-4 text-center text-xl font-black tracking-[0.5em] focus:border-[#f97316] outline-none transition-colors`} autoFocus />
              {errorValidacion && <p className="text-[10px] text-red-500 font-black uppercase mt-2 absolute w-full text-center">Clave Incorrecta</p>}
            </div>
            <div className="flex gap-3">
              <button onClick={onBack} className="flex-1 bg-gray-100 text-gray-700 font-black py-4 rounded-xl uppercase text-xs tracking-widest hover:bg-gray-200">Cancelar</button>
              <button onClick={handleAdminValidation} className="flex-1 bg-black text-white font-black py-4 rounded-xl uppercase text-xs tracking-widest hover:bg-[#f97316] transition-colors shadow-lg">Desbloquear</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Componente interno Tasas para usar en Configuración
  const TasasConfig = () => {
    const [modal,setModal]=useState(false); const [busy,setBusy]=useState(false);
    const [form,setForm]=useState({fecha:today(), modulo:'Todos', moneda:'USD', tasaRef:'', fuente:'Oficial / BCV'}); 
    const save=async()=>{ if(!form.tasaRef) return alert('Ingrese la tasa referencial'); setBusy(true); try{const id=gid(); await setDoc(dref('banco_tasas',id),{...form, tasaRef:Number(form.tasaRef), id, ts:serverTimestamp()}); setModal(false); setForm({fecha:today(), modulo:'Todos', moneda:'USD', tasaRef:'', fuente:'Oficial / BCV'});}finally{setBusy(false);} };
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-3 gap-4"><KPI label="Tasa Global" value={`${tasasList.find(t=>t.modulo==='Todos')?.tasaRef||0} Bs./$`} accent="gold" Icon={Globe}/><KPI label="Monedas" value={`USD/EUR`} accent="blue" Icon={DollarSign}/><KPI label="Registros" value={tasasList.length} accent="green" Icon={TrendingUp}/></div>
        <Card title="Tasas Configuradas por Módulo" action={<Bg onClick={()=>setModal(true)} sm><Plus size={12}/>Nueva Tasa</Bg>}><div className="overflow-x-auto"><table className="w-full"><thead><tr><Th>Fecha</Th><Th>Módulo</Th><Th>Moneda</Th><Th right>Tasa Ref.</Th><Th>Fuente</Th></tr></thead><tbody>{tasasList.length===0&&<tr><td colSpan={5} className="text-center text-xs text-gray-400 py-8">Sin tasas</td></tr>}{tasasList.map(t=><tr key={t.id} className="hover:bg-gray-50"><Td>{dd(t.fecha)}</Td><Td><Badge v={t.modulo==='Todos'?'gray':'blue'}>{t.modulo}</Badge></Td><Td><Pill usd={t.moneda==='USD'}>{t.moneda}</Pill></Td><Td right mono className="font-black text-black">{t.tasaRef}</Td><Td><span className="text-[10px] text-gray-500 uppercase">{t.fuente}</span></Td></tr>)}</tbody></table></div></Card>
        <Modal open={modal} onClose={()=>setModal(false)} title="Registrar Tasa" footer={<><Bo onClick={()=>setModal(false)}>Cancelar</Bo><Bg onClick={save}>{busy?'Guardando…':'Guardar'}</Bg></>}><div className="grid grid-cols-2 gap-4"><FG label="Fecha"><input type="date" className={inp} value={form.fecha} onChange={e=>setForm({...form,fecha:e.target.value})}/></FG><FG label="Moneda"><select className={inp} value={form.moneda} onChange={e=>setForm({...form,moneda:e.target.value})}><option>USD</option><option>EUR</option></select></FG><FG label="Tasa Referencial"><input type="number" step="0.01" className={inp} value={form.tasaRef} onChange={e=>setForm({...form,tasaRef:e.target.value})} placeholder="39.50"/></FG><FG label="Módulo Aplicable"><select className={inp} value={form.modulo} onChange={e=>setForm({...form,modulo:e.target.value})}><option>Todos</option><option>Banco</option><option>Facturación</option><option>Inventario</option><option>Contabilidad</option></select></FG><FG label="Fuente" full><input type="text" className={inp} value={form.fuente} onChange={e=>setForm({...form,fuente:e.target.value})} placeholder="Oficial / BCV / Libre" /></FG></div></Modal>
      </div>
    );
  };

  const NAV_CONFIG = [
    { id: 'empresa', label: 'Mi Empresa', icon: Building2, group: 'General' },
    { id: 'usuarios', label: 'Usuarios y Accesos', icon: Users, group: 'Seguridad' },
    { id: 'tasas', label: 'Tasa de Cambio', icon: TrendingUp, group: 'Financiero' },
  ];
  const groups = [...new Set(NAV_CONFIG.map(n => n.group))];
  const curNav = NAV_CONFIG.find(n => n.id === sec);

  return (
    <div className="flex h-screen overflow-hidden bg-white w-full">
      <aside className="w-64 bg-black flex flex-col h-screen overflow-y-auto flex-shrink-0">
        <div className="px-6 py-6 border-b border-white/10 flex-shrink-0"><p className="font-black text-sm text-[#f97316] leading-tight">Servicios Jiret</p><p className="text-[9px] text-gray-400 uppercase tracking-widest mt-1">Configuración Maestra</p></div>
        <nav className="flex-1 py-4">
          {groups.map(group => (
            <div key={group} className="mb-4">
              <p className="px-6 pb-2 text-[8px] font-black uppercase tracking-[2px] text-gray-600">{group}</p>
              {NAV_CONFIG.filter(n => n.group === group).map(({ id, label, icon: Icon }) => (
                <button key={id} onClick={() => setSec(id)} className={`w-full flex items-center gap-3 px-6 py-3 text-left transition-all text-xs font-black uppercase tracking-wider ${sec === id ? 'bg-[#f97316] text-white shadow-lg shadow-[#f97316]/20 border-r-4 border-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}><Icon size={16} className="flex-shrink-0" /><span className="truncate">{label}</span></button>
              ))}
            </div>
          ))}
        </nav>
        <div className="p-4 border-t border-white/5"><button onClick={onBack} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#f97316] transition-colors"><ArrowLeft size={14}/> Volver al Panel</button></div>
      </aside>
      
      <div className="flex-1 flex flex-col overflow-hidden min-w-0 bg-[#f3f4f6]">
        <header className="bg-white border-b border-gray-100 px-8 h-16 flex items-center justify-between flex-shrink-0 shadow-sm">
          <div><h1 className="font-black text-black text-sm uppercase tracking-wide">{curNav?.label}</h1><p className="text-[9px] text-gray-400 font-medium uppercase tracking-widest">Configuración <ChevronRight size={8} className="inline"/> {curNav?.group}</p></div>
          <button onClick={() => setAdminUnlocked(false)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"><Lock size={18}/></button>
        </header>
        <main className="flex-1 overflow-y-auto p-8 max-w-5xl mx-auto w-full">
          {sec === 'empresa' && (
            <Card title="Datos de la Empresa"><div className="grid grid-cols-2 gap-5"><FG label="Razón Social" full><input className={inp} defaultValue="Servicios Jiret G&B, C.A." /></FG><FG label="RIF / NIT"><input className={inp} defaultValue="J-412309374" /></FG><FG label="Teléfono"><input className={inp} defaultValue="+58 414-0000000" /></FG><div className="col-span-2 flex justify-end mt-4"><Bg><Save size={16}/> Guardar</Bg></div></div></Card>
          )}
          {sec === 'tasas' && <TasasConfig />}
          {sec === 'usuarios' && (
            <Card title="Directorio de Usuarios" action={<Bg sm><UserPlus size={14}/> Nuevo</Bg>}><table className="w-full"><thead><tr><Th>Nombre</Th><Th>Rol</Th><Th>Estado</Th><Th></Th></tr></thead><tbody>{(systemUsers || []).map(u => <tr key={u.id} className="hover:bg-gray-50 border-b border-gray-50"><Td className="font-black text-black uppercase">{u.name}</Td><Td><Badge v={u.role==='Master'?'red':'blue'}>{u.role}</Badge></Td><Td><Badge v="green">Activo</Badge></Td><Td><button className="p-2 text-gray-400 hover:text-[#f97316]"><Settings size={14}/></button></Td></tr>)}</tbody></table></Card>
          )}
        </main>
      </div>
    </div>
  );
}

// ============================================================================
// APP ROOT (ESTADO GLOBAL Y ENRUTADOR MAIN)
// ============================================================================
export default function App() {
  const [view, setView] = useState('login'); 
  const [fbUser, setFbUser] = useState(null);
  const [settings, setSettings] = useState({});
  const [systemUsers, setSystemUsers] = useState([{id: '1', username: 'admin', name: 'Master', role: 'Master'}]);
  const [tasasList, setTasasList] = useState([{ id:'t1', fecha: today(), modulo:'Todos', moneda:'USD', tasaRef: 39.50, fuente: 'Oficial / BCV' }]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    signInAnonymously(auth).catch(console.error);
    const unsub = onAuthStateChanged(auth, u => {
      setFbUser(u);
      if (u) {
        setLoading(false);
        onSnapshot(doc(db, 'settings', 'general'), d => { if (d.exists()) setSettings(d.data()); });
        onSnapshot(query(col('banco_tasas'), orderBy('fecha','desc')), s => {
          if(!s.empty) setTasasList(s.docs.map(x=>x.data()));
        });
      }
    });
    return () => unsub();
  }, []);

  if (loading) return <div className="min-h-screen bg-black flex flex-col items-center justify-center"><div className="w-16 h-16 border-4 border-[#f97316] border-t-transparent rounded-full animate-spin mb-4"></div><p className="text-[#f97316] font-black uppercase text-xs tracking-widest">Iniciando Core ERP...</p></div>;

  return (
    <ErrorBoundary>
      {view === 'login' && <LoginScreen onLogin={() => setView('selector')} settings={settings} systemUsers={systemUsers} />}
      {view === 'selector' && <MainSelector onSelect={setView} />}
      
      {view === 'admin_dash' && (
        <div className="min-h-screen bg-[#f3f4f6] flex flex-col">
          <header className="bg-[#0a0a0a] px-6 py-4 flex items-center justify-between border-b-4 border-[#f97316]">
            <div className="flex items-center gap-12"><div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('selector')}><Blocks className="text-white" size={28} /><span className="text-white font-black text-xl tracking-widest">Supply <span className="text-[#f97316]">G&B</span></span></div></div>
            <div className="flex items-center gap-6"><div className="text-right hidden sm:block"><p className="text-[#f97316] text-[10px] font-black uppercase tracking-widest">Master</p><p className="text-white text-xs font-black uppercase">Admin General</p></div><div className="flex items-center gap-3 border-l border-gray-800 pl-6"><button onClick={() => setView('configuracion')} className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center text-gray-400 hover:text-white border border-gray-800"><Settings size={18}/></button><button onClick={() => window.location.reload()} className="px-4 py-2 rounded-xl border border-red-900/50 text-red-500 hover:bg-red-500 hover:text-white transition-colors flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"><LogOut size={14}/> Salir</button></div></div>
          </header>
          <div className="flex-1 max-w-6xl mx-auto w-full p-8 md:p-12">
            <div className="text-center mb-12"><h2 className="text-3xl font-black text-black uppercase tracking-[0.2em]">Panel Administrativo ERP</h2><div className="w-16 h-1.5 bg-[#f97316] mx-auto mt-4 rounded-full"></div></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { id: 'facturacion', name: 'Ventas y Facturación', icon: Receipt, dark: true, border: 'border-[#f97316]', text: 'text-[#f97316]', desc: 'Directorio, Facturas y CxC' },
                { id: 'inventario', name: 'Control Inventario', icon: Package, dark: true, border: 'border-[#f97316]', text: 'text-[#f97316]', desc: 'Catálogo y Movimientos' },
                { id: 'banco', name: 'Bancos y Tesorería', icon: Building2, dark: false, border: 'border-orange-400', text: 'text-orange-400', desc: 'Cuentas, Vales y Liquidez' },
                { id: 'configuracion', name: 'Configuración Maestra', icon: Settings, dark: false, border: 'border-gray-300', text: 'text-gray-500', desc: 'Empresa, Roles y Tasas' }
              ].map(mod => (
                <button key={mod.id} onClick={() => setView(mod.id)} className={`relative rounded-[2rem] p-6 text-left border-l-[6px] ${mod.border} shadow-lg hover:-translate-y-1 transition-all duration-300 group flex flex-col h-44 ${mod.dark ? 'bg-[#0a0a0a]' : 'bg-white'}`}>
                  <mod.icon size={32} className={`${mod.color} mb-4 group-hover:scale-110 transition-transform`} strokeWidth={2} />
                  <h3 className={`font-black text-sm uppercase tracking-wide mb-2 ${mod.dark ? 'text-white' : 'text-black'}`}>{mod.name}</h3><p className={`text-[10px] font-medium leading-relaxed ${mod.dark ? 'text-gray-400' : 'text-gray-500'}`}>{mod.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {view === 'cont_dash' && (
        <div className="min-h-screen bg-[#f3f4f6] flex flex-col">
          <header className="bg-[#0a0a0a] px-6 py-4 flex items-center justify-between border-b-4 border-[#3b82f6]">
            <div className="flex items-center gap-12"><div className="flex items-center gap-2 cursor-pointer" onClick={()=>setView('selector')}><Blocks className="text-[#3b82f6]" size={28} /><span className="text-white font-black text-xl tracking-widest">Supply <span className="text-[#3b82f6]">G&B</span></span></div></div>
            <div className="flex items-center gap-6"><div className="text-right hidden sm:block"><p className="text-[#3b82f6] text-[10px] font-black uppercase tracking-widest">Master</p><p className="text-white text-xs font-black uppercase">Contador General</p></div><div className="flex items-center gap-3 border-l border-gray-800 pl-6"><button onClick={() => window.location.reload()} className="px-4 py-2 rounded-xl border border-red-900/50 text-red-500 hover:bg-red-500 hover:text-white transition-colors flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"><LogOut size={14}/> Salir</button></div></div>
          </header>
          <div className="flex-1 max-w-5xl mx-auto w-full p-8 md:p-12">
            <div className="text-center mb-12"><h2 className="text-3xl font-black text-black uppercase tracking-[0.2em]">Panel Contable & Fiscal</h2><div className="w-16 h-1.5 bg-[#3b82f6] mx-auto mt-4 rounded-full"></div></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { id: 'contabilidad', name: 'Plan de Cuentas / Maestro', icon: BookOpen, type: 'white', color: 'text-[#3b82f6]', border: 'border-[#3b82f6]', desc: 'Estructura de cuentas (PUC) y clasificación' },
                { id: 'asientos', name: 'Asientos de Libro Diario', icon: FileText, type: 'white', color: 'text-[#f97316]', border: 'border-[#f97316]', desc: 'Registro de operaciones y comprobantes' }
              ].map(mod => (
                <button key={mod.id} onClick={() => setView(mod.id)} className={`relative rounded-[2rem] p-8 text-left border-l-[6px] ${mod.border} shadow-lg hover:-translate-y-1 transition-all duration-300 group flex flex-col ${mod.type==='dark' ? 'bg-[#0a0a0a]' : 'bg-white'}`}>
                  <mod.icon size={36} className={`${mod.color} mb-4 group-hover:scale-110 transition-transform`} strokeWidth={2} />
                  <h3 className={`font-black text-lg uppercase tracking-wide mb-2 ${mod.type==='dark' ? 'text-white' : 'text-black'}`}>{mod.name}</h3><p className={`text-xs font-medium leading-relaxed ${mod.type==='dark' ? 'text-gray-400' : 'text-gray-500'}`}>{mod.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MÓDULOS OPERATIVOS ACTIVOS */}
      {view === 'facturacion' && <FacturacionApp fbUser={fbUser} tasasList={tasasList} onBack={() => setView('admin_dash')} />}
      {view === 'banco' && <BancoApp fbUser={fbUser} onBack={() => setView('admin_dash')} />}
      {view === 'contabilidad' && <ContabilidadApp fbUser={fbUser} onBack={() => setView('cont_dash')} />}
      {view === 'configuracion' && <ConfiguracionApp settings={settings} systemUsers={systemUsers} tasasList={tasasList} onBack={() => setView('admin_dash')} />}

      {/* Constructores Módulos en Desarrollo */}
      {['inventario', 'asientos'].includes(view) && (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0a] p-6">
          <div className="bg-white p-10 rounded-[3rem] shadow-2xl text-center border-t-8 border-[#f97316] max-w-md w-full">
            <div className="w-20 h-20 bg-gray-100 rounded-[2rem] flex items-center justify-center mx-auto mb-6"><Blocks size={40} className="text-gray-400" /></div>
            <h2 className="text-2xl font-black text-black uppercase mb-2">Módulo en Desarrollo</h2>
            <p className="text-gray-500 text-sm font-medium mb-8">El entorno de <span className="font-black text-[#f97316] uppercase">{view}</span> está actualmente en fase de codificación.</p>
            <button onClick={() => setView(view === 'asientos' ? 'cont_dash' : 'admin_dash')} className="bg-black w-full text-white px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-[#f97316] transition-all shadow-lg"><ArrowLeft size={16} className="inline mr-2" /> Volver al Dashboard</button>
          </div>
        </div>
      )}
    </ErrorBoundary>
  );
}

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
  MapPin, Image as ImageIcon, Key
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import {
  getFirestore, collection, doc, setDoc, updateDoc,
  onSnapshot, deleteDoc, query, orderBy, serverTimestamp
} from 'firebase/firestore';

// ============================================================================
// CONFIGURACIÓN FIREBASE & UTILIDADES
// ============================================================================
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, errorMsg: '' }; }
  static getDerivedStateFromError(e) { return { hasError: true, errorMsg: e?.message || String(e) }; }
  render() {
    if (this.state.hasError) return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0a] p-6">
        <AlertTriangle size={56} className="text-[#f97316] mb-4" />
        <h2 className="text-xl font-black text-white uppercase mb-2">Error del Sistema</h2>
        <p className="text-gray-400 text-sm mb-6 text-center max-w-sm">{this.state.errorMsg}</p>
        <button onClick={() => window.location.reload()} className="bg-[#f97316] text-white font-black px-8 py-3 rounded-2xl uppercase tracking-widest text-xs">Recargar</button>
      </div>
    );
    return this.props.children;
  }
}

const firebaseConfig = {
  apiKey: "AIzaSyBri2uZAaxsH4S0OpqhYvXB4wfCqo4g3sk",
  authDomain: "erp-gyb-supply.firebaseapp.com",
  projectId: "erp-gyb-supply",
  storageBucket: "erp-gyb-supply.firebasestorage.app",
  messagingSenderId: "201939139821",
  appId: "1:201939139821:web:95e5f589e546d7d557e0e4",
};
const fbApp = initializeApp(firebaseConfig, 'banco');
const auth = getAuth(fbApp);
const db = getFirestore(fbApp, "us-central");
const col = (n) => collection(db, n);
const dref = (n, id) => doc(db, n, String(id));

const fmt = (n) => new Intl.NumberFormat('es-VE',{minimumFractionDigits:2,maximumFractionDigits:2}).format(Number(n)||0);
const today = () => { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
const dd = (s) => { if(!s) return '—'; const [y,m,d]=s.split('-'); return `${d}/${m}/${y}`; };
const gid = () => Date.now().toString(36)+Math.random().toString(36).slice(2,6);

// ============================================================================
// COMPONENTES UI (COLORES NEGRO, BLANCO Y NARANJA)
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
      <div className="flex items-start justify-between mb-3">
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{label}</p>
        {Icon && <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center"><Icon size={15} className="text-gray-400"/></div>}
      </div>
      <p className="font-black text-2xl text-black font-mono">{value}</p>
      {sub && <p className="text-[10px] text-gray-400 mt-1.5 font-medium">{sub}</p>}
    </div>
  );
};
const Card = ({title,subtitle,action,children,noPad}) => (
  <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden mb-5">
    {(title||action) && <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-3">
      <div>{title && <h3 className="font-black text-black text-sm uppercase tracking-wide">{title}</h3>}{subtitle && <p className="text-[10px] text-gray-400 mt-0.5 font-medium">{subtitle}</p>}</div>
      {action}
    </div>}
    <div className={noPad?'':'p-6'}>{children}</div>
  </div>
);
const BarChart = ({data=[],height=120}) => {
  const max = Math.max(...data.map(d=>d.value),1);
  return (
    <div className="flex items-end gap-2 w-full" style={{height}}>
      {data.map((d,i)=>(
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div className="w-full rounded-t-lg" style={{height:`${Math.max((d.value/max)*(height-24),4)}px`,background:d.color||'#000000'}}/>
          <span className="text-[9px] font-black text-gray-400 uppercase truncate w-full text-center">{d.label}</span>
        </div>
      ))}
    </div>
  );
};
const LSvg = ({data=[],color='#f97316',height=100}) => {
  if(data.length<2) return <div className="flex items-center justify-center h-24 text-xs text-gray-300">Datos insuficientes</div>;
  const max=Math.max(...data,1); const min=Math.min(...data,0); const range=max-min||1; const w=300; const h=height;
  const pts=data.map((v,i)=>{const x=(i/(data.length-1))*(w-20)+10; const y=h-((v-min)/range)*(h-20)-10; return `${x},${y}`;}).join(' ');
  return <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{height}}><polyline fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points={pts}/><polyline fill={`${color}20`} stroke="none" points={`10,${h-10} ${pts} ${w-10},${h-10}`}/></svg>;
};
const Donut = ({segs=[],size=120}) => {
  const r=42; const cx=size/2; const cy=size/2; const circ=2*Math.PI*r;
  const total=segs.reduce((a,s)=>a+s.value,0)||1; let off=0;
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
      <div className={`bg-white rounded-[2.5rem] w-full ${wide?'max-w-xl':'max-w-lg'} max-h-[90vh] flex flex-col shadow-2xl`}>
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 flex-shrink-0">
          <h2 className="font-black text-black uppercase tracking-widest text-sm">{title}</h2>
          <button onClick={onClose} className="w-10 h-10 rounded-2xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"><X size={18} className="text-gray-500"/></button>
        </div>
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
// PANTALLA 1: LOGIN SCREEN
// ============================================================================
function LoginScreen({ onLogin }) {
  const [pass, setPass] = useState('');
  const [error, setError] = useState(false);

  const handleLogin = () => {
    if (pass === '1234' || pass.toLowerCase() === 'admin') {
      onLogin();
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-[#f97316]/10 rounded-full blur-[100px]"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-blue-500/10 rounded-full blur-[100px]"></div>

      <div className="max-w-md w-full bg-white rounded-[2.5rem] p-10 shadow-2xl relative z-10 border border-white/20">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-black rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl transform -rotate-6">
            <Blocks className="text-[#f97316]" size={40} />
          </div>
          <h1 className="text-3xl font-black text-black uppercase tracking-tighter">Supply <span className="text-[#f97316]">G&B</span></h1>
          <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.3em] mt-1">Servicios Jiret · ERP Master</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Clave de Acceso Master</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
              <input 
                type="password" 
                className={`w-full bg-gray-50 border-2 ${error ? 'border-red-500 bg-red-50' : 'border-gray-100'} rounded-2xl py-4 pl-12 pr-4 text-center font-black tracking-[0.5em] outline-none focus:border-[#f97316] transition-all`}
                placeholder="••••"
                value={pass}
                onChange={e => setPass(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && handleLogin()}
              />
            </div>
            {error && <p className="text-center text-red-500 text-[10px] font-black uppercase mt-3 animate-pulse">Credenciales Incorrectas</p>}
          </div>

          <button onClick={handleLogin} className="w-full bg-black text-white font-black py-4 rounded-2xl uppercase text-xs tracking-[0.2em] hover:bg-[#f97316] transition-all shadow-lg flex items-center justify-center gap-3 group">
            Entrar al Sistema <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-50 flex justify-center gap-6">
          <div className="flex items-center gap-2 text-gray-300"><ShieldCheck size={14} /><span className="text-[9px] font-black uppercase">AES-256 Encrypted</span></div>
          <div className="flex items-center gap-2 text-gray-300"><Globe size={14} /><span className="text-[9px] font-black uppercase">v3.1.0 Cloud</span></div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// PANTALLA 2: SELECTOR DE ÁREA
// ============================================================================
function MainSelector({ onSelect }) {
  return (
    <div className="min-h-screen bg-[#f3f4f6] flex items-center justify-center p-6">
      <div className="flex flex-col md:flex-row gap-8 max-w-5xl w-full">
        <div onClick={() => onSelect('admin_dash')} className="flex-1 bg-[#0a0a0a] rounded-[2.5rem] p-12 cursor-pointer border-l-8 border-[#f97316] shadow-2xl hover:-translate-y-2 transition-transform duration-300 group flex flex-col items-center text-center relative overflow-hidden">
          <div className="w-28 h-28 bg-[#1f2937] rounded-full flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500"><Briefcase size={40} className="text-[#f97316]" strokeWidth={2.5} /></div>
          <h2 className="text-2xl font-black text-white uppercase tracking-widest mb-4">Área Administrativa</h2>
          <p className="text-gray-400 text-sm font-medium leading-relaxed max-w-sm">Gestión de Facturación, Control de Inventario Multimoneda, Bancos y Tesorería.</p>
        </div>
        <div onClick={() => onSelect('cont_dash')} className="flex-1 bg-white rounded-[2.5rem] p-12 cursor-pointer border-l-8 border-[#3b82f6] shadow-2xl hover:-translate-y-2 transition-transform duration-300 group flex flex-col items-center text-center">
          <div className="w-28 h-28 bg-[#dbeafe] rounded-full flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500"><Calculator size={40} className="text-[#3b82f6]" strokeWidth={2.5} /></div>
          <h2 className="text-2xl font-black text-black uppercase tracking-widest mb-4">Área Contable</h2>
          <p className="text-gray-500 text-sm font-medium leading-relaxed max-w-sm">Mantenimiento de Multiempresas, Plan de Cuentas Central, Asientos de Libro Diario y Balances.</p>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// PANTALLA 3A: DASHBOARD ADMINISTRATIVO
// ============================================================================
function AdminDashboard({ onSelectModule, onBack }) {
  const modAdmin = [
    { id: 'facturacion', name: 'Ventas y Facturación', icon: Receipt, dark: true, border: 'border-[#f97316]', text: 'text-[#f97316]', desc: 'Directorio, OP y Facturación' },
    { id: 'inventario', name: 'Control Inventario', icon: Package, dark: true, border: 'border-[#f97316]', text: 'text-[#f97316]', desc: 'Catálogo, Movimientos y Kardex' },
    { id: 'banco', name: 'Bancos y Tesorería', icon: Building2, dark: false, border: 'border-orange-400', text: 'text-orange-400', desc: 'Cuentas, Vales y Liquidez' },
    { id: 'reportes', name: 'Reportes Financieros', icon: BarChart3, dark: false, border: 'border-blue-500', text: 'text-blue-500', desc: 'Dashboard de Rentabilidad' },
    { id: 'nomina', name: 'Gestión de Nómina', icon: Users, dark: false, border: 'border-gray-400', text: 'text-gray-400', desc: 'Personal, viáticos y comisiones' },
    { id: 'configuracion', name: 'Configuración', icon: Settings, dark: false, border: 'border-gray-300', text: 'text-gray-500', desc: 'Mi Empresa, Sucursales y Usuarios' }
  ];

  return (
    <div className="min-h-screen bg-[#f3f4f6] flex flex-col">
      <header className="bg-[#0a0a0a] px-6 py-4 flex items-center justify-between border-b-4 border-[#f97316]">
        <div className="flex items-center gap-12">
          <div className="flex items-center gap-2 cursor-pointer" onClick={onBack}>
            <Blocks className="text-white" size={28} />
            <span className="text-white font-black text-xl tracking-widest">Supply <span className="text-[#f97316]">G&B</span></span>
          </div>
          <nav className="hidden md:flex gap-6">
            <button className="bg-[#f97316] text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><Home size={14}/> Inicio</button>
            <button className="text-gray-400 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><Receipt size={14}/> Ventas</button>
            <button className="text-gray-400 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><Package size={14}/> Inventario</button>
          </nav>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right hidden sm:block"><p className="text-[#f97316] text-[10px] font-black uppercase tracking-widest">Master</p><p className="text-white text-xs font-black uppercase">Administrador General</p></div>
          <div className="flex items-center gap-3 border-l border-gray-800 pl-6">
            <button onClick={() => onSelectModule('configuracion')} className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center text-gray-400 hover:text-white border border-gray-800"><Settings size={18}/></button>
            <button onClick={onBack} className="px-4 py-2 rounded-xl border border-red-900/50 text-red-500 hover:bg-red-500 hover:text-white transition-colors flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"><LogOut size={14}/> Salir</button>
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-6xl mx-auto w-full p-8 md:p-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-black text-black uppercase tracking-[0.2em]">Panel Principal ERP</h2>
          <div className="w-16 h-1.5 bg-[#f97316] mx-auto mt-4 rounded-full"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {modAdmin.map(mod => {
            const Icon = mod.icon;
            const isDark = mod.type === 'dark';
            return (
              <button key={mod.id} onClick={() => onSelectModule(mod.id)} className={`relative rounded-[2rem] p-6 text-left border-l-[6px] ${mod.border} shadow-lg hover:-translate-y-1 transition-all duration-300 group flex flex-col h-44 ${isDark ? 'bg-[#0a0a0a]' : 'bg-white'}`}>
                <Icon size={32} className={`${mod.color} mb-4 group-hover:scale-110 transition-transform`} strokeWidth={2} />
                <h3 className={`font-black text-sm uppercase tracking-wide mb-2 ${isDark ? 'text-white' : 'text-black'}`}>{mod.name}</h3>
                <p className={`text-[10px] font-medium leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{mod.desc}</p>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// PANTALLA 3B: DASHBOARD CONTABLE
// ============================================================================
function ContableDashboard({ onSelectModule, onBack }) {
  const modCont = [
    { id: 'contabilidad', name: 'Plan de Cuentas / Maestro', icon: BookOpen, type: 'white', color: 'text-[#3b82f6]', border: 'border-[#3b82f6]', desc: 'Estructura de cuentas (PUC) y clasificación' },
    { id: 'asientos', name: 'Asientos de Libro Diario', icon: FileText, type: 'white', color: 'text-[#f97316]', border: 'border-[#f97316]', desc: 'Registro de operaciones y comprobantes' },
    { id: 'impuestos', name: 'Gestión de Impuestos', icon: Calculator, type: 'dark', color: 'text-red-500', border: 'border-red-500', desc: 'Retenciones IVA, ISLR y libros fiscales' },
    { id: 'nacionalizacion', name: 'Costos de Nacionalización', icon: Globe, type: 'dark', color: 'text-emerald-500', border: 'border-emerald-500', desc: 'Estructura de importaciones' }
  ];

  return (
    <div className="min-h-screen bg-[#f3f4f6] flex flex-col">
      <header className="bg-[#0a0a0a] px-6 py-4 flex items-center justify-between border-b-4 border-[#3b82f6]">
        <div className="flex items-center gap-12">
          <div className="flex items-center gap-2 cursor-pointer" onClick={onBack}>
            <Blocks className="text-[#3b82f6]" size={28} />
            <span className="text-white font-black text-xl tracking-widest">Supply <span className="text-[#3b82f6]">G&B</span></span>
          </div>
          <nav className="hidden md:flex gap-6">
            <button className="bg-[#3b82f6] text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><Home size={14}/> Contable</button>
          </nav>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right hidden sm:block"><p className="text-[#3b82f6] text-[10px] font-black uppercase tracking-widest">Master</p><p className="text-white text-xs font-black uppercase">Contador General</p></div>
          <div className="flex items-center gap-3 border-l border-gray-800 pl-6">
            <button onClick={onBack} className="px-4 py-2 rounded-xl border border-red-900/50 text-red-500 hover:bg-red-500 hover:text-white transition-colors flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"><LogOut size={14}/> Salir</button>
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-5xl mx-auto w-full p-8 md:p-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-black text-black uppercase tracking-[0.2em]">Panel Contable & Fiscal</h2>
          <div className="w-16 h-1.5 bg-[#3b82f6] mx-auto mt-4 rounded-full"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {modCont.map(mod => {
            const Icon = mod.icon;
            const isDark = mod.type === 'dark';
            return (
              <button key={mod.id} onClick={() => onSelectModule(mod.id)} className={`relative rounded-[2rem] p-8 text-left border-l-[6px] ${mod.border} shadow-lg hover:-translate-y-1 transition-all duration-300 group flex flex-col ${isDark ? 'bg-[#0a0a0a]' : 'bg-white'}`}>
                <Icon size={36} className={`${mod.color} mb-4 group-hover:scale-110 transition-transform`} strokeWidth={2} />
                <h3 className={`font-black text-lg uppercase tracking-wide mb-2 ${isDark ? 'text-white' : 'text-black'}`}>{mod.name}</h3>
                <p className={`text-xs font-medium leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{mod.desc}</p>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  );
}


// ============================================================================
// MÓDULO DE CONFIGURACIÓN (REDISEÑADO SEGÚN IMÁGENES)
// ============================================================================
function ConfiguracionApp({ onBack }) {
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [errorValidacion, setErrorValidacion] = useState(false);
  const [sec, setSec] = useState('empresa');

  // Menú Lateral de Configuración
  const NAV_CONFIG = [
    { id: 'empresa', label: 'Mi Empresa', icon: Building2, group: 'General' },
    { id: 'sucursales', label: 'Sucursales', icon: Landmark, group: 'General' },
    { id: 'monedas', label: 'Monedas', icon: DollarSign, group: 'Financiero' },
    { id: 'tasas', label: 'Tasa de Cambio', icon: TrendingUp, group: 'Financiero' },
    { id: 'tipos_cambio', label: 'Tipos de Cambio', icon: ArrowLeftRight, group: 'Financiero' },
    { id: 'usuarios', label: 'Usuarios', icon: Users, group: 'Seguridad' },
    { id: 'roles', label: 'Roles y Permisos', icon: ShieldCheck, group: 'Seguridad' }
  ];

  const handleAdminValidation = () => {
    if (adminPassword === '1234' || adminPassword.toLowerCase() === 'admin') {
      setAdminUnlocked(true); setErrorValidacion(false);
    } else {
      setErrorValidacion(true); setTimeout(() => setErrorValidacion(false), 2000);
    }
  };

  // PANTALLA DE BLOQUEO DE CONFIGURACIÓN
  if (!adminUnlocked) {
    return (
      <div className="fixed inset-0 bg-[#0a0a0a]/90 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-[2.5rem] p-10 max-w-sm w-full shadow-2xl transform transition-all relative border border-white/20">
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-24 bg-[#0a0a0a] rounded-full flex items-center justify-center shadow-2xl border-4 border-[#f97316]">
            <Key size={40} className="text-[#f97316]" />
          </div>
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

  const groups = [...new Set(NAV_CONFIG.map(n => n.group))];
  const curNav = NAV_CONFIG.find(n => n.id === sec);

  // VISTAS DEL MÓDULO CONFIGURACIÓN
  const renderView = () => {
    switch(sec) {
      case 'empresa':
        return (
          <Card title="Datos de la Empresa">
            <div className="flex flex-col md:flex-row gap-8">
              <div className="w-full md:w-1/3 flex flex-col items-center">
                <div className="w-48 h-48 border-4 border-dashed border-gray-200 rounded-[2rem] flex flex-col items-center justify-center text-gray-400 bg-gray-50 hover:bg-orange-50 hover:border-[#f97316] hover:text-[#f97316] cursor-pointer transition-all">
                  <ImageIcon size={40} className="mb-2" />
                  <span className="text-xs font-black uppercase tracking-widest">Subir Logo</span>
                </div>
              </div>
              <div className="w-full md:w-2/3 grid grid-cols-2 gap-5">
                <FG label="Razón Social" full><input className={inp} defaultValue="Servicios Jiret G&B, C.A." /></FG>
                <FG label="RIF / NIT"><input className={inp} defaultValue="J-40000000-0" /></FG>
                <FG label="Teléfono"><input className={inp} defaultValue="+58 414-0000000" /></FG>
                <FG label="Correo Electrónico" full><input className={inp} defaultValue="contacto@supplygyb.com" /></FG>
                <FG label="Moneda Principal"><select className={inp}><option>Bolívares (Bs.)</option><option>Dólar (USD)</option></select></FG>
                <FG label="Moneda Secundaria"><select className={inp}><option>Dólar (USD)</option><option>Euros (EUR)</option></select></FG>
                <div className="col-span-2 flex justify-end mt-4"><Bg><Save size={16}/> Guardar Cambios</Bg></div>
              </div>
            </div>
          </Card>
        );
      case 'sucursales':
        return (
          <Card title="Gestión de Sucursales" action={<Bg sm><Plus size={14}/> Nueva Sucursal</Bg>}>
            <div className="overflow-x-auto"><table className="w-full">
              <thead><tr><Th>Código</Th><Th>Nombre</Th><Th>Dirección</Th><Th>Teléfono</Th><Th>Estado</Th><Th></Th></tr></thead>
              <tbody>
                <tr className="hover:bg-gray-50 border-b border-gray-100">
                  <Td mono className="font-black text-[#f97316]">SUC-01</Td><Td className="font-black text-black uppercase">Sede Principal Maracaibo</Td><Td className="text-gray-500">Av. 5 de Julio, Zulia</Td><Td mono>0261-7000000</Td><Td><Badge v="green">Activo</Badge></Td><Td><button className="p-2 text-gray-400 hover:text-[#f97316]"><Settings size={14}/></button></Td>
                </tr>
              </tbody>
            </table></div>
          </Card>
        );
      case 'usuarios':
        return (
          <Card title="Directorio de Usuarios" action={<Bg sm><UserPlus size={14}/> Nuevo Usuario</Bg>}>
            <div className="overflow-x-auto"><table className="w-full">
              <thead><tr><Th>Nombre</Th><Th>Correo</Th><Th>Sucursal</Th><Th>Rol</Th><Th>Estado</Th><Th></Th></tr></thead>
              <tbody>
                <tr className="hover:bg-gray-50 border-b border-gray-100">
                  <Td className="font-black text-black uppercase">Luis Ferrer</Td><Td className="text-gray-500">admin@supplygyb.com</Td><Td><Badge v="gray">SUC-01</Badge></Td><Td><Badge v="red">Master</Badge></Td><Td><Badge v="green">Activo</Badge></Td><Td><button className="p-2 text-gray-400 hover:text-[#f97316]"><Settings size={14}/></button></Td>
                </tr>
                <tr className="hover:bg-gray-50 border-b border-gray-100">
                  <Td className="font-black text-black uppercase">Contabilidad</Td><Td className="text-gray-500">contable@supplygyb.com</Td><Td><Badge v="gray">SUC-01</Badge></Td><Td><Badge v="blue">Contador</Badge></Td><Td><Badge v="green">Activo</Badge></Td><Td><button className="p-2 text-gray-400 hover:text-[#f97316]"><Settings size={14}/></button></Td>
                </tr>
              </tbody>
            </table></div>
          </Card>
        );
      case 'roles':
        return (
          <Card title="Roles y Permisos" action={<Bg sm><ShieldCheck size={14}/> Nuevo Rol</Bg>}>
            <div className="overflow-x-auto"><table className="w-full">
              <thead><tr><Th>Nombre del Rol</Th><Th>Descripción</Th><Th right>Usuarios</Th><Th>Estado</Th><Th></Th></tr></thead>
              <tbody>
                <tr className="hover:bg-gray-50 border-b border-gray-100">
                  <Td className="font-black text-red-600 uppercase">Master</Td><Td className="text-gray-500">Acceso total al sistema y configuraciones</Td><Td right mono className="font-black">1</Td><Td><Badge v="green">Activo</Badge></Td><Td><button className="p-2 text-gray-400 hover:text-[#f97316]"><Settings size={14}/></button></Td>
                </tr>
                <tr className="hover:bg-gray-50 border-b border-gray-100">
                  <Td className="font-black text-blue-600 uppercase">Contador</Td><Td className="text-gray-500">Acceso a módulo contable y asientos</Td><Td right mono className="font-black">2</Td><Td><Badge v="green">Activo</Badge></Td><Td><button className="p-2 text-gray-400 hover:text-[#f97316]"><Settings size={14}/></button></Td>
                </tr>
              </tbody>
            </table></div>
          </Card>
        );
      default:
        return (
          <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-gray-100">
            <Blocks size={48} className="text-gray-200 mb-4" />
            <h3 className="text-lg font-black text-gray-400 uppercase tracking-widest mb-2">Sección en Construcción</h3>
            <p className="text-xs text-gray-400 text-center max-w-sm">Esta área se encuentra en desarrollo activo para la versión final del sistema.</p>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-white w-full">
      {/* Sidebar Configuración */}
      <aside className="w-64 bg-black flex flex-col h-screen overflow-y-auto flex-shrink-0">
        <div className="px-6 py-6 border-b border-white/10 flex-shrink-0">
          <p className="font-black text-sm text-[#f97316] leading-tight">Servicios Jiret G&amp;B</p>
          <p className="text-[9px] text-gray-400 uppercase tracking-widest mt-1">Ajustes Generales</p>
        </div>
        <nav className="flex-1 py-4">
          {groups.map(group => (
            <div key={group} className="mb-4">
              <p className="px-6 pb-2 text-[8px] font-black uppercase tracking-[2px] text-gray-600">{group}</p>
              {NAV_CONFIG.filter(n => n.group === group).map(({ id, label, icon: Icon }) => (
                <button key={id} onClick={() => setSec(id)} className={`w-full flex items-center gap-3 px-6 py-3 text-left transition-all text-xs font-black uppercase tracking-wider ${sec === id ? 'bg-[#f97316] text-white shadow-lg shadow-[#f97316]/20 border-r-4 border-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>
                  <Icon size={16} className="flex-shrink-0" /><span className="truncate">{label}</span>
                </button>
              ))}
            </div>
          ))}
        </nav>
        <div className="p-4 border-t border-white/5">
          <button onClick={onBack} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#f97316] transition-colors"><ArrowLeft size={14}/> Volver al Panel</button>
        </div>
      </aside>
      
      {/* Área Principal de Configuración */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0 bg-[#f3f4f6]">
        <header className="bg-white border-b border-gray-100 px-8 h-16 flex items-center justify-between flex-shrink-0 shadow-sm">
          <div>
            <h1 className="font-black text-black text-sm uppercase tracking-wide">{curNav?.label}</h1>
            <p className="text-[9px] text-gray-400 font-medium uppercase tracking-widest">Configuración <ChevronRight size={8} className="inline"/> {curNav?.group}</p>
          </div>
          <div className="flex items-center gap-3">
             <button onClick={() => setAdminUnlocked(false)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"><Lock size={18}/></button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-8 max-w-5xl mx-auto w-full">
          {renderView()}
        </main>
      </div>
    </div>
  );
}

// ============================================================================
// MÓDULO BANCO (DASHBOARD/CUENTAS/MOV/TASAS)
// ============================================================================
function DashboardBanco({movimientos,vales,cuentas,tasas}) {
  const th = tasas.find(t=>t.modulo==='Banco' || t.modulo==='Todos')?.tasaRef || tasas[0]?.tasaRef || 39.47;
  const totalBs=cuentas.filter(c=>c.moneda==='Bs.').reduce((a,c)=>a+Number(c.saldo),0);
  const totalUSD=cuentas.filter(c=>c.moneda==='USD').reduce((a,c)=>a+Number(c.saldo),0);
  const caja=cuentas.find(c=>c.tipo==='Caja')?.saldo||0;
  const pend=vales.filter(v=>v.estado==='Pendiente');
  const tvales=pend.reduce((a,v)=>a+Number(v.monto),0);
  const posicion=totalBs+(totalUSD*th)+Number(caja)-tvales;
  const ing=movimientos.filter(m=>m.tipo==='ingreso').reduce((a,m)=>a+Number(m.equiv||m.monto),0);
  const egr=movimientos.filter(m=>m.tipo==='egreso').reduce((a,m)=>a+Number(m.equiv||m.monto),0);
  const recent=[...movimientos].slice(0,6);
  const barData=[{label:'Ingresos',value:ing,color:'#10b981'},{label:'Egresos',value:egr,color:'#ef4444'},{label:'Vales',value:tvales,color:'#f97316'},{label:'Caja',value:Number(caja),color:'#0a0a0a'}];
  const ds=cuentas.slice(0,4).map((c,i)=>({value:Number(c.saldo)*(c.moneda==='USD'?th:1),color:['#0a0a0a','#f97316','#10b981','#3b82f6'][i%4]}));
  return (
    <div>
      <div className="bg-black rounded-3xl p-6 mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div><p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Posición Neta de Liquidez</p><p className="font-black text-3xl text-[#f97316] font-mono">Bs. {fmt(posicion)}</p><p className="text-[10px] text-gray-500 mt-1">Bancos + Caja − Vales Pendientes</p></div>
        <div className="text-right"><p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Tasa Referencial Activa</p><p className="font-black text-2xl text-[#f97316] font-mono">{th} Bs./$</p><p className="text-[10px] text-gray-500 mt-1">≡ ${fmt(posicion/th)} USD</p></div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KPI label="Total Bancos Bs." value={`Bs. ${fmt(totalBs)}`} accent="green" Icon={Banknote}/>
        <KPI label="Total Bancos USD" value={`$${fmt(totalUSD)}`} accent="gold" Icon={DollarSign}/>
        <KPI label="Caja Principal" value={`Bs. ${fmt(caja)}`} accent="blue" Icon={PiggyBank}/>
        <KPI label="Vales Pendientes" value={`Bs. ${fmt(tvales)}`} sub={`${pend.length} sin liquidar`} accent="red" Icon={Wallet}/>
      </div>
      <div className="grid md:grid-cols-3 gap-5">
        <div className="md:col-span-2"><Card title="Flujo del Período"><BarChart data={barData} height={140}/><div className="flex gap-4 mt-4 flex-wrap">{barData.map(d=><span key={d.label} className="flex items-center gap-1.5 text-[10px] font-black text-gray-400 uppercase"><span className="w-2.5 h-2.5 rounded-sm" style={{background:d.color}}/>{d.label}: Bs.{fmt(d.value)}</span>)}</div></Card></div>
        <div><Card title="Distribución"><div className="flex justify-center mb-4"><Donut segs={ds} size={130}/></div><div className="space-y-2">{cuentas.slice(0,4).map((c,i)=><div key={c.id} className="flex items-center justify-between text-[10px]"><span className="flex items-center gap-1.5 font-black text-gray-500 uppercase"><span className="w-2 h-2 rounded-sm" style={{background:['#0a0a0a','#f97316','#10b981','#3b82f6'][i%4]}}/>{c.banco}</span><span className="font-mono font-black text-black">{c.moneda==='USD'?'$':'Bs.'}{fmt(c.saldo)}</span></div>)}</div></Card></div>
      </div>
      <div className="grid md:grid-cols-2 gap-5">
        <Card title="Últimos Movimientos">
          <table className="w-full"><thead><tr><Th>Fecha</Th><Th>Concepto</Th><Th right>Monto</Th></tr></thead>
          <tbody>{recent.length===0&&<tr><td colSpan={3} className="text-center text-xs text-gray-400 py-8">Sin movimientos</td></tr>}{recent.map(m=><tr key={m.id} className="hover:bg-gray-50"><Td>{dd(m.fecha)}</Td><Td className="max-w-[130px] truncate">{m.concepto}</Td><Td right mono className={m.tipo==='ingreso'?'text-emerald-600':'text-red-500'}>{m.tipo==='ingreso'?'+':'−'}{m.moneda==='USD'?'$':'Bs.'}{fmt(m.monto)}</Td></tr>)}</tbody></table>
        </Card>
        <Card title="Vales en Tránsito" action={<Badge v="red">{pend.length} pendientes</Badge>}>
          {pend.length===0&&<p className="text-xs text-gray-400 text-center py-8">Sin vales pendientes</p>}
          {pend.map(v=><div key={v.id} className="flex items-start justify-between py-3 border-b border-gray-50 last:border-0"><div><p className="text-xs font-black text-black">{v.num} — {v.beneficiario}</p><p className="text-[10px] text-gray-400 mt-0.5">{v.concepto}</p></div><span className="font-mono font-black text-xs text-red-500">Bs.{fmt(v.monto)}</span></div>)}
        </Card>
      </div>
    </div>
  );
}

function CuentasBanco({cuentas, planCuentas}) {
  const [modal,setModal]=useState(false); const [form,setForm]=useState({banco:'',num:'',tipo:'Corriente',moneda:'Bs.',puc:'',saldo:''}); const [busy,setBusy]=useState(false);
  const save=async()=>{if(!form.banco||!form.num||!form.puc) return alert('Banco, número y cuenta PUC requeridos'); setBusy(true); try{const id=gid(); await setDoc(dref('banco_cuentas',id),{...form,saldo:Number(form.saldo)||0,id,ts:serverTimestamp()}); setModal(false); setForm({banco:'',num:'',tipo:'Corriente',moneda:'Bs.',puc:'',saldo:''});}finally{setBusy(false);}};
  const del=async(id)=>{if(window.confirm('¿Eliminar cuenta?')) await deleteDoc(dref('banco_cuentas',id));};
  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {cuentas.map((c,i)=><div key={c.id} className="bg-white rounded-2xl border-2 border-gray-100 p-4 hover:border-[#f97316] hover:shadow-md transition-all group cursor-pointer"><p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">{c.banco}</p><p className="text-[10px] font-mono text-gray-400 mb-2 truncate">{c.num}</p><p className="font-black text-xl font-mono text-black">{c.moneda==='USD'?'$':'Bs.'}{fmt(c.saldo)}</p><div className="flex items-center justify-between mt-2"><Pill usd={c.moneda==='USD'}>{c.moneda}</Pill><button onClick={()=>del(c.id)} className="opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={12} className="text-red-400"/></button></div></div>)}
        <button onClick={()=>setModal(true)} className="border-2 border-dashed border-gray-200 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 hover:border-[#f97316] hover:bg-orange-50 transition-all min-h-[100px]"><Plus size={20} className="text-gray-300"/><span className="text-[9px] font-black uppercase text-gray-300">Nueva Cuenta</span></button>
      </div>
      <Card title="Registro de Cuentas" action={<Bp onClick={()=>setModal(true)} sm><Plus size={12}/>Nueva</Bp>}><div className="overflow-x-auto"><table className="w-full"><thead><tr><Th>Banco</Th><Th>Número</Th><Th>Tipo</Th><Th>Moneda</Th><Th>Cuenta Contable (PUC)</Th><Th right>Saldo</Th><Th></Th></tr></thead><tbody>{cuentas.length===0&&<tr><td colSpan={7} className="text-center text-xs text-gray-400 py-8">Sin cuentas registradas</td></tr>}{cuentas.map(c=><tr key={c.id} className="hover:bg-gray-50"><Td><span className="font-black text-black">{c.banco}</span></Td><Td mono>{c.num}</Td><Td>{c.tipo}</Td><Td><Pill usd={c.moneda==='USD'}>{c.moneda}</Pill></Td><Td mono><Badge v="gray">{c.puc}</Badge></Td><Td right mono>{c.moneda==='USD'?'$':'Bs.'}{fmt(c.saldo)}</Td><Td><button onClick={()=>del(c.id)} className="p-1.5 bg-red-50 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition-all"><Trash2 size={11}/></button></Td></tr>)}</tbody></table></div></Card>
      <Modal open={modal} onClose={()=>setModal(false)} title="Nueva Cuenta Bancaria" footer={<><Bo onClick={()=>setModal(false)}>Cancelar</Bo><Bg onClick={save}>{busy?'Guardando…':'Guardar'}</Bg></>}><div className="grid grid-cols-2 gap-4"><FG label="Banco"><input className={inp} value={form.banco} onChange={e=>setForm({...form,banco:e.target.value})} placeholder="Banesco"/></FG><FG label="Tipo"><select className={inp} value={form.tipo} onChange={e=>setForm({...form,tipo:e.target.value})}><option>Corriente</option><option>Ahorro</option><option>Internacional</option><option>Caja</option></select></FG><FG label="Número de Cuenta" full><input className={inp} value={form.num} onChange={e=>setForm({...form,num:e.target.value})} placeholder="0134-xxxx-xx-xxxxxxxxxx"/></FG><FG label="Moneda"><select className={inp} value={form.moneda} onChange={e=>setForm({...form,moneda:e.target.value})}><option>Bs.</option><option>USD</option><option>EUR</option></select></FG><FG label="Saldo Inicial"><input type="number" className={inp} value={form.saldo} onChange={e=>setForm({...form,saldo:e.target.value})} placeholder="0.00"/></FG><FG label="Cuenta Contable (PUC)" full><select className={inp} value={form.puc} onChange={e=>setForm({...form,puc:e.target.value})}><option value="">Seleccione cuenta del Plan de Cuentas...</option>{planCuentas.filter(c => c.tipo?.toUpperCase().includes('ACTIVO')).map(c => <option key={c.id} value={c.codigo}>{c.codigo} — {c.nombre}</option>)}</select></FG></div></Modal>
    </div>
  );
}

function Tasas({tasas}) {
  const [modal,setModal]=useState(false); 
  const [form,setForm]=useState({fecha:today(), modulo:'Todos', moneda:'USD', tasaRef:'', fuente:'Oficial / BCV'}); 
  const [busy,setBusy]=useState(false);
  
  const save=async()=>{
    if(!form.tasaRef) return alert('Ingrese la tasa referencial'); 
    setBusy(true); 
    try{
      const id=gid(); await setDoc(dref('banco_tasas',id),{...form, tasaRef:Number(form.tasaRef), id, ts:serverTimestamp()}); 
      setModal(false); setForm({fecha:today(), modulo:'Todos', moneda:'USD', tasaRef:'', fuente:'Oficial / BCV'});
    }finally{setBusy(false);}
  };
  
  const tGlobal = tasas.find(t=>t.modulo==='Todos')?.tasaRef || 0; 
  const tBanco = tasas.find(t=>t.modulo==='Banco')?.tasaRef || tGlobal; 
  const ld=[...tasas].reverse().slice(-10).map(t=>t.tasaRef);

  return (
    <div>
      <div className="grid grid-cols-3 gap-4 mb-6"><KPI label="Tasa Referencial Global" value={`${tGlobal} Bs./$`} sub="Aplica si el módulo no tiene tasa propia" accent="gold" Icon={TrendingUp}/><KPI label="Tasa Módulo Banco" value={`${tBanco} Bs./$`} accent="blue" Icon={Landmark}/><KPI label="Monedas Aceptadas" value={`USD / EUR`} sub="Configuración estricta" accent="green" Icon={DollarSign}/></div>
      <div className="grid md:grid-cols-2 gap-5">
        <Card title="Histórico de Tasas por Módulo" action={<Bg onClick={()=>setModal(true)} sm><Plus size={12}/>Registrar Tasa</Bg>}><div className="overflow-x-auto"><table className="w-full"><thead><tr><Th>Fecha</Th><Th>Módulo Aplicable</Th><Th>Moneda</Th><Th right>Tasa Ref.</Th><Th>Fuente</Th></tr></thead><tbody>{tasas.length===0&&<tr><td colSpan={5} className="text-center text-xs text-gray-400 py-8">Sin tasas</td></tr>}{tasas.map(t=><tr key={t.id} className="hover:bg-gray-50"><Td>{dd(t.fecha)}</Td><Td><Badge v={t.modulo==='Todos'?'gray':'blue'}>{t.modulo}</Badge></Td><Td><Pill usd={t.moneda==='USD'}>{t.moneda}</Pill></Td><Td right mono className="font-black text-black">{t.tasaRef}</Td><Td><span className="text-[10px] text-gray-500 uppercase">{t.fuente}</span></Td></tr>)}</tbody></table></div></Card>
        <Card title="Evolución (últimas 10 sesiones)"><LSvg data={ld} height={120}/></Card>
      </div>
      <Modal open={modal} onClose={()=>setModal(false)} title="Registrar Tasa de Cambio" footer={<><Bo onClick={()=>setModal(false)}>Cancelar</Bo><Bg onClick={save}>{busy?'Guardando…':'Guardar'}</Bg></>}>
        <div className="grid grid-cols-2 gap-4">
          <FG label="Fecha"><input type="date" className={inp} value={form.fecha} onChange={e=>setForm({...form,fecha:e.target.value})}/></FG>
          <FG label="Moneda"><select className={inp} value={form.moneda} onChange={e=>setForm({...form,moneda:e.target.value})}><option>USD</option><option>EUR</option></select></FG>
          <FG label="Tasa Referencial"><input type="number" step="0.01" className={inp} value={form.tasaRef} onChange={e=>setForm({...form,tasaRef:e.target.value})} placeholder="39.47"/></FG>
          <FG label="Módulo Aplicable"><select className={inp} value={form.modulo} onChange={e=>setForm({...form,modulo:e.target.value})}><option>Todos</option><option>Banco</option><option>Facturación</option><option>Inventario</option><option>Contabilidad</option></select></FG>
          <FG label="Fuente" full><input type="text" className={inp} value={form.fuente} onChange={e=>setForm({...form,fuente:e.target.value})} placeholder="Oficial / BCV / Libre" /></FG>
        </div>
      </Modal>
    </div>
  );
}

function Tipos({tipos, planCuentas}) {
  const [modal,setModal]=useState(false); const [filtro,setFiltro]=useState('todos'); const [form,setForm]=useState({cod:'',desc:'',nat:'ingreso',retIVA:'No',retISLR:'No',puc:''}); const [busy,setBusy]=useState(false);
  const save=async()=>{if(!form.cod||!form.desc||!form.puc) return alert('Requeridos: Código, desc. y cuenta'); setBusy(true); try{const id=gid(); await setDoc(dref('banco_tipos',id),{...form,id,ts:serverTimestamp()}); setModal(false); setForm({cod:'',desc:'',nat:'ingreso',retIVA:'No',retISLR:'No',puc:''});}finally{setBusy(false);}};
  const fil=filtro==='todos'?tipos:tipos.filter(t=>t.nat===filtro);
  return (
    <div>
      <div className="flex gap-2 mb-5">{['todos','ingreso','egreso'].map(t=><button key={t} onClick={()=>setFiltro(t)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors ${filtro===t?'bg-black text-white':'bg-white border-2 border-gray-200 text-gray-500 hover:border-black'}`}>{t}</button>)}</div>
      <Card title="Catálogo de Conceptos" action={<Bp onClick={()=>setModal(true)} sm><Plus size={12}/>Nuevo Tipo</Bp>}><div className="overflow-x-auto"><table className="w-full"><thead><tr><Th>Código</Th><Th>Descripción</Th><Th>Naturaleza</Th><Th>Ret. IVA</Th><Th>Ret. ISLR</Th><Th>Cuenta Contable (PUC)</Th></tr></thead><tbody>{fil.length===0&&<tr><td colSpan={6} className="text-center text-xs text-gray-400 py-8">Sin tipos registrados</td></tr>}{fil.map(t=><tr key={t.id} className="hover:bg-gray-50"><Td mono className="font-black text-black">{t.cod}</Td><Td>{t.desc}</Td><Td><Badge v={t.nat==='ingreso'?'green':'red'}>{t.nat}</Badge></Td><Td>{t.retIVA==='Sí'?<Badge v="gold">Sí</Badge>:'—'}</Td><Td>{t.retISLR==='Sí'?<Badge v="gold">Sí</Badge>:'—'}</Td><Td mono><Badge v="gray">{t.puc}</Badge></Td></tr>)}</tbody></table></div></Card>
      <Modal open={modal} onClose={()=>setModal(false)} title="Nuevo Tipo de Movimiento" footer={<><Bo onClick={()=>setModal(false)}>Cancelar</Bo><Bp onClick={save}>{busy?'Guardando…':'Crear'}</Bp></>}><div className="grid grid-cols-2 gap-4"><FG label="Código"><input className={inp} value={form.cod} onChange={e=>setForm({...form,cod:e.target.value})} placeholder="ING-001"/></FG><FG label="Naturaleza"><select className={inp} value={form.nat} onChange={e=>setForm({...form,nat:e.target.value})}><option value="ingreso">Ingreso</option><option value="egreso">Egreso</option></select></FG><FG label="Descripción" full><input className={inp} value={form.desc} onChange={e=>setForm({...form,desc:e.target.value})} placeholder="Cobro..."/></FG><FG label="Ret. IVA"><select className={inp} value={form.retIVA} onChange={e=>setForm({...form,retIVA:e.target.value})}><option>No</option><option>Sí</option></select></FG><FG label="Ret. ISLR"><select className={inp} value={form.retISLR} onChange={e=>setForm({...form,retISLR:e.target.value})}><option>No</option><option>Sí</option></select></FG><FG label="Cuenta Contable (PUC)" full><select className={inp} value={form.puc} onChange={e=>setForm({...form,puc:e.target.value})}><option value="">Seleccione cuenta...</option>{planCuentas.map(c => <option key={c.id} value={c.codigo}>{c.codigo} — {c.nombre}</option>)}</select></FG></div></Modal>
    </div>
  );
}

function Chequeras({chequeras,cuentas}) { 
  const [modal,setModal]=useState(false); const [form,setForm]=useState({cuentaId:'',banco:'',serie:'',ini:'',fin:'',fechaRecep:today()}); const [busy,setBusy]=useState(false);
  const save=async()=>{if(!form.serie||!form.ini||!form.fin) return alert('Complete todos los campos'); setBusy(true); try{const id=gid(); await setDoc(dref('banco_chequeras',id),{...form,ini:Number(form.ini),fin:Number(form.fin),actual:Number(form.ini),usados:0,id,estado:'Activa',ts:serverTimestamp()}); setModal(false); setForm({cuentaId:'',banco:'',serie:'',ini:'',fin:'',fechaRecep:today()});}finally{setBusy(false);}};
  return (
    <Card title="Registro de Chequeras" action={<Bp onClick={()=>setModal(true)} sm><Plus size={12}/>Nueva</Bp>}><div className="overflow-x-auto"><table className="w-full"><thead><tr><Th>Banco</Th><Th>Serie</Th><Th right>Ini.</Th><Th right>Fin</Th><Th right>Actual</Th><Th right>Usados</Th><Th>Estado</Th></tr></thead><tbody>{chequeras.length===0&&<tr><td colSpan={7} className="text-center text-xs text-gray-400 py-8">Sin chequeras</td></tr>}{chequeras.map(c=>{const tot=c.fin-c.ini+1; const pct=Math.round((c.usados/tot)*100); const est=pct>=90?'Por agotar':pct===0?'Nueva':'Activa'; return <tr key={c.id} className="hover:bg-gray-50"><Td><span className="font-black text-black">{c.banco}</span></Td><Td mono>{c.serie}</Td><Td right mono>{String(c.ini).padStart(3,'0')}</Td><Td right mono>{String(c.fin).padStart(3,'0')}</Td><Td right mono>{String(c.actual).padStart(3,'0')}</Td><Td right><span className="font-mono font-black">{c.usados}</span><span className="text-gray-300 text-[10px]"> /{tot}</span></Td><Td><Badge v={est==='Activa'?'green':est==='Nueva'?'blue':'gold'}>{est}</Badge></Td></tr>;})} </tbody></table></div>
      <Modal open={modal} onClose={()=>setModal(false)} title="Registrar Chequera" footer={<><Bo onClick={()=>setModal(false)}>Cancelar</Bo><Bp onClick={save}>{busy?'Guardando…':'Registrar'}</Bp></>}><div className="grid grid-cols-2 gap-4"><FG label="Banco / Cuenta" full><select className={inp} value={form.cuentaId} onChange={e=>{const c=cuentas.find(x=>x.id===e.target.value); setForm({...form,cuentaId:e.target.value,banco:c?c.banco:''});}}><option value="">Seleccionar...</option>{cuentas.map(c=><option key={c.id} value={c.id}>{c.banco} — {c.num}</option>)}</select></FG><FG label="Serie"><input className={inp} value={form.serie} onChange={e=>setForm({...form,serie:e.target.value})} placeholder="A"/></FG><FG label="Folio Inicial"><input type="number" className={inp} value={form.ini} onChange={e=>setForm({...form,ini:e.target.value})} placeholder="001"/></FG><FG label="Folio Final"><input type="number" className={inp} value={form.fin} onChange={e=>setForm({...form,fin:e.target.value})} placeholder="050"/></FG><FG label="Fecha Recepción" full><input type="date" className={inp} value={form.fechaRecep} onChange={e=>setForm({...form,fechaRecep:e.target.value})}/></FG></div></Modal>
    </Card>
  );
}

function Movimientos({movimientos,cuentas,tipos,tasas}) {
  const [modal,setModal]=useState(false); const [busca,setBusca]=useState(''); 
  const tasaActiva = tasas.find(t=>t.modulo==='Banco' || t.modulo==='Todos')?.tasaRef || '39.47';
  const [form,setForm]=useState({fecha:today(),tipo:'ingreso',concepto:'',cuentaId:'',moneda:'Bs.',monto:'',tasaRef:tasaActiva,retIVA:'No',retISLR:'No',ref:''}); 
  const [busy,setBusy]=useState(false);
  
  const save=async()=>{if(!form.monto||!form.concepto) return alert('Concepto y monto requeridos'); setBusy(true); try{const c=cuentas.find(x=>x.id===form.cuentaId); const equiv=form.moneda==='USD'?Number(form.monto)*Number(form.tasaRef):Number(form.monto); const id=gid(); await setDoc(dref('banco_movimientos',id),{...form,monto:Number(form.monto),tasaRef:Number(form.tasaRef),equiv,banco:c?.banco||'',id,ts:serverTimestamp()}); if(c){const delta=form.tipo==='ingreso'?equiv:-equiv; await updateDoc(dref('banco_cuentas',form.cuentaId),{saldo:Number(c.saldo)+delta});} setModal(false); setForm({fecha:today(),tipo:'ingreso',concepto:'',cuentaId:'',moneda:'Bs.',monto:'',tasaRef:tasaActiva,retIVA:'No',retISLR:'No',ref:''});}finally{setBusy(false);}};
  const del=async(m)=>{if(!window.confirm('¿Eliminar?')) return; await deleteDoc(dref('banco_movimientos',m.id)); const c=cuentas.find(x=>x.id===m.cuentaId); if(c){const delta=m.tipo==='ingreso'?-m.equiv:m.equiv; await updateDoc(dref('banco_cuentas',m.cuentaId),{saldo:Number(c.saldo)+delta});}};
  const fil=movimientos.filter(m=>!busca||m.concepto?.toLowerCase().includes(busca.toLowerCase())||m.banco?.toLowerCase().includes(busca.toLowerCase()));
  
  return (
    <div>
      <div className="flex items-center gap-3 mb-5 flex-wrap"><div className="flex items-center gap-2 border-2 border-gray-200 rounded-xl px-3 py-2 bg-white flex-1 max-w-sm"><Search size={14} className="text-gray-400 flex-shrink-0"/><input className="outline-none text-xs font-medium w-full text-black bg-transparent" placeholder="Buscar..." value={busca} onChange={e=>setBusca(e.target.value)}/></div><Bg onClick={()=>setModal(true)}><Plus size={14}/>Registrar Movimiento</Bg></div>
      <Card title="Libro de Movimientos" subtitle={`${fil.length} registros`} action={<Bo onClick={()=>window.print()} sm><Download size={12}/>Exportar</Bo>}><div className="overflow-x-auto"><table className="w-full"><thead><tr><Th>Fecha</Th><Th>Concepto</Th><Th>Cuenta</Th><Th>Mon.</Th><Th right>Monto</Th><Th right>Equiv. Bs.</Th><Th>IVA</Th><Th>ISLR</Th><Th></Th></tr></thead><tbody>{fil.length===0&&<tr><td colSpan={9} className="text-center text-xs text-gray-400 py-8">Sin movimientos</td></tr>}{fil.map(m=><tr key={m.id} className="hover:bg-gray-50"><Td>{dd(m.fecha)}</Td><Td className="max-w-[140px] truncate">{m.concepto}</Td><Td>{m.banco}</Td><Td><Pill usd={m.moneda==='USD'}>{m.moneda}</Pill></Td><Td right mono className={m.tipo==='ingreso'?'text-emerald-600':'text-red-500'}>{m.tipo==='ingreso'?'+':'−'}{m.moneda==='USD'?'$':'Bs.'}{fmt(m.monto)}</Td><Td right mono>Bs.{fmt(m.equiv)}</Td><Td className="text-[10px] text-gray-400">{m.retIVA!=='No'?<Badge v="gold">{m.retIVA}</Badge>:'—'}</Td><Td className="text-[10px] text-gray-400">{m.retISLR!=='No'?<Badge v="gold">{m.retISLR}</Badge>:'—'}</Td><Td><button onClick={()=>del(m)} className="p-1.5 bg-red-50 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition-all"><Trash2 size={11}/></button></Td></tr>)}</tbody></table></div></Card>
      <Modal open={modal} onClose={()=>setModal(false)} title="Registrar Movimiento Bancario" wide footer={<><Bo onClick={()=>setModal(false)}>Cancelar</Bo><Bg onClick={save}>{busy?'Guardando…':'Guardar'}</Bg></>}><div className="grid grid-cols-2 gap-4"><FG label="Fecha"><input type="date" className={inp} value={form.fecha} onChange={e=>setForm({...form,fecha:e.target.value})}/></FG><FG label="Tipo"><select className={inp} value={form.tipo} onChange={e=>setForm({...form,tipo:e.target.value})}><option value="ingreso">Ingreso</option><option value="egreso">Egreso</option></select></FG><FG label="Concepto" full><select className={inp} value={form.concepto} onChange={e=>setForm({...form,concepto:e.target.value})}><option value="">Seleccionar...</option>{tipos.map(t=><option key={t.id} value={t.desc}>{t.desc}</option>)}<option value="Otro">Otro</option></select></FG><FG label="Cuenta Bancaria"><select className={inp} value={form.cuentaId} onChange={e=>setForm({...form,cuentaId:e.target.value})}><option value="">Seleccionar...</option>{cuentas.map(c=><option key={c.id} value={c.id}>{c.banco} ({c.moneda})</option>)}</select></FG><FG label="Moneda"><select className={inp} value={form.moneda} onChange={e=>setForm({...form,moneda:e.target.value})}><option>Bs.</option><option>USD</option></select></FG><FG label="Monto"><input type="number" className={inp} value={form.monto} onChange={e=>setForm({...form,monto:e.target.value})} placeholder="0.00"/></FG>{form.moneda==='USD'&&<FG label="Tasa Referencial"><input type="number" step="0.01" className={inp} value={form.tasaRef} onChange={e=>setForm({...form,tasaRef:e.target.value})}/></FG>}<FG label="Ret. IVA"><select className={inp} value={form.retIVA} onChange={e=>setForm({...form,retIVA:e.target.value})}><option>No</option><option>75% (16%)</option></select></FG><FG label="Ret. ISLR"><select className={inp} value={form.retISLR} onChange={e=>setForm({...form,retISLR:e.target.value})}><option>No</option><option>2%</option><option>3%</option><option>5%</option></select></FG><FG label="Referencia" full><input className={inp} value={form.ref} onChange={e=>setForm({...form,ref:e.target.value})} placeholder="Nro. factura, referencia..."/></FG></div>{form.monto&&form.moneda==='USD'&&<div className="mt-4 bg-orange-50 rounded-xl p-3 text-xs font-black text-orange-700">≡ Bs. {fmt(Number(form.monto)*Number(form.tasaRef))} a tasa {form.tasaRef}</div>}</Modal>
    </div>
  );
}

function Vales({vales,cuentas,tasas}) {
  const [modal,setModal]=useState(false); const [liq,setLiq]=useState(null); const [mj,setMj]=useState(''); const [form,setForm]=useState({fecha:today(),tipo:'egreso',beneficiario:'',concepto:'',monto:'',fechaLim:''}); const [busy,setBusy]=useState(false);
  const pend=vales.filter(v=>v.estado==='Pendiente'); const tv=pend.reduce((a,v)=>a+Number(v.monto),0); const caja=cuentas.find(c=>c.tipo==='Caja');
  const save=async()=>{if(!form.beneficiario||!form.monto) return alert('Beneficiario y monto requeridos'); setBusy(true); try{const id=gid(); const num=`V-${String(vales.length+1).padStart(4,'0')}`; await setDoc(dref('banco_vales',id),{...form,monto:Number(form.monto),num,id,estado:'Pendiente',ts:serverTimestamp()}); setModal(false); setForm({fecha:today(),tipo:'egreso',beneficiario:'',concepto:'',monto:'',fechaLim:''});}finally{setBusy(false);}};
  const liquidar=async()=>{if(!liq) return; setBusy(true); try{const j=Number(mj)||Number(liq.monto); const dev=Number(liq.monto)-j; await updateDoc(dref('banco_vales',liq.id),{estado:'Liquidado',montoJust:j,devolucion:dev,fechaLiq:today()}); if(caja&&dev>0) await updateDoc(dref('banco_cuentas',caja.id),{saldo:Number(caja.saldo)+dev}); setLiq(null); setMj('');}finally{setBusy(false);}};
  return (
    <div>
      <div className="grid grid-cols-3 gap-4 mb-6"><KPI label="Vales Emitidos" value={vales.length} sub="Total del período" accent="blue" Icon={FileText}/><KPI label="Pendientes" value={pend.length} sub={`Bs. ${fmt(tv)}`} accent="red" Icon={Clock}/><KPI label="Liquidados" value={vales.length-pend.length} sub="Justificados" accent="green" Icon={CheckCircle}/></div>
      <div className="grid md:grid-cols-3 gap-5">
        <div className="md:col-span-2"><Card title="Vales Emitidos" action={<Bo onClick={()=>setModal(true)} sm><Plus size={12}/>Emitir Vale</Bo>}><div className="overflow-x-auto"><table className="w-full"><thead><tr><Th>N° Vale</Th><Th>Fecha</Th><Th>Beneficiario</Th><Th>Concepto</Th><Th right>Monto</Th><Th>Estado</Th><Th></Th></tr></thead><tbody>{vales.length===0&&<tr><td colSpan={7} className="text-center text-xs text-gray-400 py-8">Sin vales</td></tr>}{vales.map(v=><tr key={v.id} className="hover:bg-gray-50"><Td mono className="font-black text-black">{v.num}</Td><Td>{dd(v.fecha)}</Td><Td>{v.beneficiario}</Td><Td>{v.concepto}</Td><Td right mono className="text-red-500">Bs.{fmt(v.monto)}</Td><Td><Badge v={v.estado==='Pendiente'?'gold':'green'}>{v.estado}</Badge></Td><Td>{v.estado==='Pendiente'&&<Bg onClick={()=>{setLiq(v);setMj(v.monto);}} sm>Liquidar</Bg>}</Td></tr>)}</tbody></table></div></Card></div>
        <div><div className="bg-black rounded-3xl p-5 mb-4"><p className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-1">Saldo Caja Principal</p><p className="font-black text-2xl text-[#f97316] font-mono mt-2">Bs. {fmt(caja?.saldo||0)}</p><div className="border-t border-gray-800 mt-4 pt-4 space-y-2"><div className="flex justify-between text-[10px]"><span className="text-gray-500">Vales pendientes</span><span className="font-mono font-black text-red-400">-Bs.{fmt(tv)}</span></div><div className="flex justify-between text-[10px]"><span className="text-gray-500">Posición neta</span><span className="font-mono font-black text-[#f97316]">Bs.{fmt((caja?.saldo||0)-tv)}</span></div></div></div><Card title="Pendientes"><div>{pend.length===0&&<p className="text-xs text-gray-400 text-center py-4">Sin vales pendientes</p>}{pend.map(v=><div key={v.id} className="flex justify-between items-center py-2.5 border-b border-gray-50 last:border-0"><div><p className="text-xs font-black text-black">{v.num}</p><p className="text-[10px] text-gray-400">{v.beneficiario}</p></div><span className="font-mono text-xs font-black text-red-500">Bs.{fmt(v.monto)}</span></div>)}</div></Card></div>
      </div>
      <Modal open={modal} onClose={()=>setModal(false)} title="Emitir Vale de Caja" footer={<><Bo onClick={()=>setModal(false)}>Cancelar</Bo><Bg onClick={save}>{busy?'Guardando…':'Emitir Vale'}</Bg></>}><div className="grid grid-cols-2 gap-4"><FG label="Fecha"><input type="date" className={inp} value={form.fecha} onChange={e=>setForm({...form,fecha:e.target.value})}/></FG><FG label="Tipo"><select className={inp} value={form.tipo} onChange={e=>setForm({...form,tipo:e.target.value})}><option value="egreso">Egreso (Salida)</option><option value="ingreso">Ingreso (Entrada)</option></select></FG><FG label="Beneficiario" full><input className={inp} value={form.beneficiario} onChange={e=>setForm({...form,beneficiario:e.target.value})} placeholder="Nombre del empleado..."/></FG><FG label="Concepto" full><select className={inp} value={form.concepto} onChange={e=>setForm({...form,concepto:e.target.value})}><option value="">Seleccionar...</option><option>Anticipo de viáticos</option><option>Solicitud de efectivo</option><option>Anticipo de nómina</option><option>Compra menor</option></select></FG><FG label="Monto Bs."><input type="number" className={inp} value={form.monto} onChange={e=>setForm({...form,monto:e.target.value})} placeholder="0.00"/></FG><FG label="Fecha Límite"><input type="date" className={inp} value={form.fechaLim} onChange={e=>setForm({...form,fechaLim:e.target.value})}/></FG></div><div className="mt-4 bg-orange-50 rounded-xl p-3 text-[10px] font-black text-orange-700">⚠ Queda en estado Pendiente hasta su liquidación.</div></Modal>
      <Modal open={!!liq} onClose={()=>setLiq(null)} title="Liquidar Vale" footer={<><Bo onClick={()=>setLiq(null)}>Cancelar</Bo><Bg onClick={liquidar}>{busy?'Procesando…':'Liquidar y Ejecutar'}</Bg></>}>{liq&&<div className="space-y-4"><div className="bg-black rounded-2xl p-4 space-y-2">{[['Vale',liq.num],['Beneficiario',liq.beneficiario],['Monto emitido',`Bs. ${fmt(liq.monto)}`]].map(([k,v])=><div key={k} className="flex justify-between text-xs"><span className="text-gray-400">{k}</span><span className="font-black text-white">{v}</span></div>)}</div><FG label="Monto Justificado"><input type="number" className={inp} value={mj} onChange={e=>setMj(e.target.value)} placeholder={liq.monto}/></FG>{mj&&Number(mj)<Number(liq.monto)&&<div className="bg-emerald-50 rounded-xl p-3 text-xs font-black text-emerald-700">↩ Devolución a Caja: Bs. {fmt(Number(liq.monto)-Number(mj))}</div>}</div>}</Modal>
    </div>
  );
}

function Transferencias({transferencias,cuentas,tasas}) {
  const tasaActiva = tasas.find(t=>t.modulo==='Banco' || t.modulo==='Todos')?.tasaRef || '39.47';
  const [modal,setModal]=useState(false); const [form,setForm]=useState({fecha:today(),origenId:'',destinoId:'',monto:'',tasaRef:tasaActiva,ref:''}); const [busy,setBusy]=useState(false);
  const save=async()=>{if(!form.origenId||!form.destinoId||!form.monto) return alert('Complete todos los campos'); if(form.origenId===form.destinoId) return alert('Origen y destino deben ser diferentes'); setBusy(true); try{const o=cuentas.find(c=>c.id===form.origenId); const d=cuentas.find(c=>c.id===form.destinoId); const mn=Number(form.monto); const id=gid(); const op=`TRF-${String(transferencias.length+1).padStart(4,'0')}`; await setDoc(dref('banco_transferencias',id),{...form,monto:mn,tasaRef:Number(form.tasaRef),op,origenBanco:o?.banco,destinoBanco:d?.banco,id,estado:'Ejecutada',ts:serverTimestamp()}); await updateDoc(dref('banco_cuentas',form.origenId),{saldo:Number(o.saldo)-mn}); await updateDoc(dref('banco_cuentas',form.destinoId),{saldo:Number(d.saldo)+mn}); setModal(false); setForm({fecha:today(),origenId:'',destinoId:'',monto:'',tasaRef:tasaActiva,ref:''});}finally{setBusy(false);}};
  return (
    <Card title="Transferencias entre Cuentas Propias" action={<Bg onClick={()=>setModal(true)}><Plus size={14}/>Nueva Transferencia</Bg>}><div className="overflow-x-auto"><table className="w-full"><thead><tr><Th>Fecha</Th><Th>N° Op.</Th><Th>Origen</Th><Th>Destino</Th><Th right>Monto</Th><Th>Tasa</Th><Th>Estado</Th></tr></thead><tbody>{transferencias.length===0&&<tr><td colSpan={7} className="text-center text-xs text-gray-400 py-8">Sin transferencias</td></tr>}{transferencias.map(t=><tr key={t.id} className="hover:bg-gray-50"><Td>{dd(t.fecha)}</Td><Td mono className="font-black">{t.op}</Td><Td>{t.origenBanco}</Td><Td>{t.destinoBanco}</Td><Td right mono>Bs.{fmt(t.monto)}</Td><Td mono>{t.tasaRef}</Td><Td><Badge v="green">{t.estado}</Badge></Td></tr>)}</tbody></table></div>
      <Modal open={modal} onClose={()=>setModal(false)} title="Nueva Transferencia" footer={<><Bo onClick={()=>setModal(false)}>Cancelar</Bo><Bg onClick={save}>{busy?'Ejecutando…':'Ejecutar'}</Bg></>}><div className="grid grid-cols-2 gap-4"><FG label="Fecha"><input type="date" className={inp} value={form.fecha} onChange={e=>setForm({...form,fecha:e.target.value})}/></FG><FG label="Tasa Referencial"><input type="number" step="0.01" className={inp} value={form.tasaRef} onChange={e=>setForm({...form,tasaRef:e.target.value})}/></FG><FG label="Cuenta Origen" full><select className={inp} value={form.origenId} onChange={e=>setForm({...form,origenId:e.target.value})}><option value="">Seleccionar...</option>{cuentas.map(c=><option key={c.id} value={c.id}>{c.banco} ({c.moneda}) — {c.moneda==='USD'?'$':'Bs.'}{fmt(c.saldo)}</option>)}</select></FG><FG label="Cuenta Destino" full><select className={inp} value={form.destinoId} onChange={e=>setForm({...form,destinoId:e.target.value})}><option value="">Seleccionar...</option>{cuentas.filter(c=>c.id!==form.origenId).map(c=><option key={c.id} value={c.id}>{c.banco} ({c.moneda})</option>)}</select></FG><FG label="Monto"><input type="number" className={inp} value={form.monto} onChange={e=>setForm({...form,monto:e.target.value})} placeholder="0.00"/></FG><FG label="Referencia"><input className={inp} value={form.ref} onChange={e=>setForm({...form,ref:e.target.value})} placeholder="Nro. comprobante"/></FG></div></Modal>
    </Card>
  );
}

function Conciliacion({movimientos,cuentas}) {
  const [sel,setSel]=useState(''); const mov=sel?movimientos.filter(m=>m.cuentaId===sel):movimientos; const conc=mov.filter(m=>m.conciliado); const pend=mov.filter(m=>!m.conciliado);
  const cruzar=async(m)=>await updateDoc(dref('banco_movimientos',m.id),{conciliado:true});
  return (
    <div className="grid md:grid-cols-3 gap-5">
      <div className="md:col-span-2"><Card title="Conciliación Bancaria" action={<select className={`${inp} w-44`} value={sel} onChange={e=>setSel(e.target.value)}><option value="">Todas las cuentas</option>{cuentas.map(c=><option key={c.id} value={c.id}>{c.banco}</option>)}</select>}><div className={`flex items-center gap-2 p-3 rounded-xl mb-4 text-xs font-black ${pend.length===0?'bg-emerald-50 text-emerald-700':'bg-orange-50 text-orange-700'}`}>{pend.length===0?<CheckCircle size={14}/>:<Clock size={14}/>}{pend.length===0?`${conc.length} movimientos conciliados`:`${pend.length} movimientos pendientes de cruce`}</div><div className="overflow-x-auto"><table className="w-full"><thead><tr><Th>Fecha</Th><Th>Concepto</Th><Th right>Monto</Th><Th>Estado</Th><Th></Th></tr></thead><tbody>{mov.length===0&&<tr><td colSpan={5} className="text-center text-xs text-gray-400 py-8">Sin movimientos</td></tr>}{mov.map(m=><tr key={m.id} className="hover:bg-gray-50"><Td>{dd(m.fecha)}</Td><Td className="max-w-[180px] truncate">{m.concepto}</Td><Td right mono className={m.tipo==='ingreso'?'text-emerald-600':'text-red-500'}>{m.tipo==='ingreso'?'+':'−'}Bs.{fmt(m.equiv)}</Td><Td><Badge v={m.conciliado?'green':'gold'}>{m.conciliado?'Conciliado':'Pendiente'}</Badge></Td><Td>{!m.conciliado&&<button onClick={()=>cruzar(m)} className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-500 hover:text-white text-[10px] font-black px-2">✓ Cruzar</button>}</Td></tr>)}</tbody></table></div></Card></div>
      <div><Card title="Resumen">{[['Total movimientos',mov.length],['Conciliados',conc.length],['Pendientes',pend.length]].map(([k,v])=><div key={k} className="flex justify-between items-center py-3 border-b border-gray-50 last:border-0"><span className="text-xs font-medium text-gray-500">{k}</span><span className="font-black text-black text-sm">{v}</span></div>)}<div className="mt-4"><div className="w-full bg-gray-100 rounded-full h-2 mb-1"><div className="bg-emerald-500 h-2 rounded-full" style={{width:`${mov.length?(conc.length/mov.length*100):0}%`}}/></div><p className="text-[10px] text-gray-400 font-black text-right">{mov.length?Math.round(conc.length/mov.length*100):0}% conciliado</p></div></Card></div>
    </div>
  );
}

function Arqueo({vales,cuentas}) {
  const DENOMS=[200,100,50,20,10,5,2,1]; const [pz,setPz]=useState({}); const [busy,setBusy]=useState(false); const caja=cuentas.find(c=>c.tipo==='Caja'); const pend=vales.filter(v=>v.estado==='Pendiente'); const tv=pend.reduce((a,v)=>a+Number(v.monto),0); const tot=DENOMS.reduce((a,d)=>a+d*(Number(pz[d])||0),0); const dif=tot-((caja?.saldo||0)-tv);
  const guardar=async()=>{setBusy(true); try{const id=gid(); await setDoc(dref('banco_arqueos',id),{id,fecha:today(),hora:new Date().toLocaleTimeString('es-VE'),piezas:pz,total:tot,saldoSistema:caja?.saldo||0,diferencia:dif,ts:serverTimestamp()}); alert('Arqueo guardado');}finally{setBusy(false);}};
  return (
    <div className="grid md:grid-cols-2 gap-5">
      <Card title="Conteo de Efectivo" action={<Bg onClick={guardar} sm>{busy?'Guardando…':'Guardar Arqueo'}</Bg>}><table className="w-full mb-4"><thead><tr><Th>Denominación</Th><Th right>Piezas</Th><Th right>Subtotal</Th></tr></thead><tbody>{DENOMS.map(d=><tr key={d} className="hover:bg-gray-50"><Td><span className="font-black text-black">Bs. {d}</span></Td><Td right><input type="number" min="0" value={pz[d]||''} onChange={e=>setPz({...pz,[d]:e.target.value})} className="w-20 border-2 border-gray-200 rounded-lg px-2 py-1 text-xs font-mono font-black text-right outline-none focus:border-[#f97316]" placeholder="0"/></Td><Td right mono className="font-black text-black">Bs. {fmt(d*(Number(pz[d])||0))}</Td></tr>)}</tbody><tfoot><tr className="bg-black"><td colSpan={2} className="px-4 py-3 text-xs font-black uppercase text-white">Total Contado</td><td className="px-4 py-3 text-right font-mono font-black text-[#f97316]">Bs. {fmt(tot)}</td></tr></tfoot></table></Card>
      <div className="space-y-4"><div className="bg-black rounded-3xl p-5"><p className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-3">Comparación de Saldos</p>{[['Saldo Sistema',`Bs. ${fmt(caja?.saldo||0)}`,'text-white'],['Vales Pendientes',`- Bs. ${fmt(tv)}`,'text-red-400'],['Saldo Esperado',`Bs. ${fmt((caja?.saldo||0)-tv)}`,'text-[#f97316]'],['Total Arqueo',`Bs. ${fmt(tot)}`,'text-[#f97316]']].map(([k,v,c])=><div key={k} className="flex justify-between py-2 border-b border-gray-800 last:border-0"><span className="text-[10px] text-gray-400 font-medium">{k}</span><span className={`font-mono font-black text-xs ${c}`}>{v}</span></div>)}<div className={`mt-4 p-3 rounded-xl ${Math.abs(dif)<0.01?'bg-emerald-900/50 border border-emerald-800':'bg-red-900/50 border border-red-800'}`}><p className="text-[9px] font-black uppercase text-gray-400 mb-1">Diferencia</p><p className={`font-mono font-black text-xl ${Math.abs(dif)<0.01?'text-emerald-400':'text-red-400'}`}>{dif>=0?'+':''}Bs. {fmt(dif)}</p></div></div><Card title="Vales sin Justificar">{pend.length===0&&<p className="text-xs text-gray-400 text-center py-4">Sin vales pendientes</p>}{pend.map(v=><div key={v.id} className="flex justify-between items-center py-2.5 border-b border-gray-50 last:border-0"><div><p className="text-xs font-black text-black">{v.num} — {v.beneficiario}</p><p className="text-[10px] text-gray-400">{v.concepto}</p></div><span className="font-mono text-xs font-black text-red-500">Bs.{fmt(v.monto)}</span></div>)}</Card></div>
    </div>
  );
}

function Reportes({movimientos,cuentas,vales,tasas}) {
  const [tab,setTab]=useState('flujo'); const th = tasas.find(t=>t.modulo==='Banco' || t.modulo==='Todos')?.tasaRef || tasas[0]?.tasaRef || 39.47; const ing=movimientos.filter(m=>m.tipo==='ingreso').reduce((a,m)=>a+Number(m.equiv||m.monto),0); const egr=movimientos.filter(m=>m.tipo==='egreso').reduce((a,m)=>a+Number(m.equiv||m.monto),0); const st=cuentas.reduce((a,c)=>a+Number(c.saldo)*(c.moneda==='USD'?th:1),0);
  return (
    <div>
      <div className="flex gap-2 mb-6 flex-wrap">{[['flujo','Flujo de Caja'],['libro','Libro Auxiliar'],['multimoneda','Multimoneda']].map(([k,l])=><button key={k} onClick={()=>setTab(k)} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors ${tab===k?'bg-black text-white':'bg-white border-2 border-gray-200 text-gray-500 hover:border-black'}`}>{l}</button>)}</div>
      {tab==='flujo'&&<div><div className="grid grid-cols-3 gap-4 mb-6"><KPI label="Total Ingresos" value={`Bs. ${fmt(ing)}`} accent="green" Icon={TrendingUp}/><KPI label="Total Egresos" value={`Bs. ${fmt(egr)}`} accent="red" Icon={TrendingDown}/><KPI label="Flujo Neto" value={`Bs. ${fmt(ing-egr)}`} accent={ing>=egr?'green':'red'} Icon={BarChart3}/></div><Card title="Distribución del Flujo"><BarChart data={[{label:'Ingresos',value:ing,color:'#10b981'},{label:'Egresos',value:egr,color:'#ef4444'},{label:'Neto',value:ing-egr,color:'#0a0a0a'}]} height={160}/></Card></div>}
      {tab==='libro'&&<Card title="Libro Auxiliar de Bancos" action={<Bo sm onClick={()=>window.print()}><Download size={12}/>Exportar</Bo>}><div className="overflow-x-auto"><table className="w-full"><thead><tr><Th>Fecha</Th><Th>Concepto</Th><Th>Banco</Th><Th>Moneda</Th><Th right>Débito</Th><Th right>Crédito</Th><Th right>Equiv. Bs.</Th></tr></thead><tbody>{movimientos.length===0&&<tr><td colSpan={7} className="text-center text-xs text-gray-400 py-8">Sin movimientos</td></tr>}{[...movimientos].sort((a,b)=>(b.fecha||'')>(a.fecha||'')?1:-1).map(m=><tr key={m.id} className="hover:bg-gray-50"><Td>{dd(m.fecha)}</Td><Td className="max-w-[150px] truncate">{m.concepto}</Td><Td>{m.banco}</Td><Td><Pill usd={m.moneda==='USD'}>{m.moneda}</Pill></Td><Td right mono className="text-red-500">{m.tipo==='egreso'?fmt(m.monto):'—'}</Td><Td right mono className="text-emerald-600">{m.tipo==='ingreso'?fmt(m.monto):'—'}</Td><Td right mono className="font-black">Bs.{fmt(m.equiv)}</Td></tr>)}</tbody></table></div></Card>}
      {tab==='multimoneda'&&<div><div className="grid grid-cols-2 gap-4 mb-6"><KPI label="Posición Total (Bs.)" value={`Bs. ${fmt(st)}`} accent="gold" Icon={Landmark}/><KPI label="Posición Total (USD)" value={`$${fmt(st/th)}`} accent="blue" Icon={DollarSign}/></div><Card title="Saldos por Moneda"><div className="overflow-x-auto"><table className="w-full"><thead><tr><Th>Banco</Th><Th>Tipo</Th><Th>Moneda</Th><Th right>Saldo</Th><Th right>Tasa Ref.</Th><Th right>Equiv. Bs.</Th></tr></thead><tbody>{cuentas.map(c=><tr key={c.id} className="hover:bg-gray-50"><Td><span className="font-black text-black">{c.banco}</span></Td><Td>{c.tipo}</Td><Td><Pill usd={c.moneda==='USD'}>{c.moneda}</Pill></Td><Td right mono className="font-black">{c.moneda==='USD'?'$':'Bs.'}{fmt(c.saldo)}</Td><Td right mono>{c.moneda==='USD'?th:'1.00'}</Td><Td right mono className="font-black text-black">Bs.{fmt(Number(c.saldo)*(c.moneda==='USD'?th:1))}</Td></tr>)}</tbody><tfoot><tr className="bg-black"><td colSpan={5} className="px-4 py-3 text-xs font-black uppercase text-white">Total Consolidado</td><td className="px-4 py-3 text-right font-mono font-black text-[#f97316]">Bs.{fmt(st)}</td></tr></tfoot></table></div></Card></div>}
    </div>
  );
}

const NAV_BANCO=[
  {id:'dashboard',label:'Dashboard',icon:LayoutDashboard,group:'Panel'},
  {id:'cuentas',label:'Cuentas',icon:Building2,group:'Configuración'},
  {id:'tasas',label:'Tasas de Cambio',icon:TrendingUp,group:'Configuración'},
  {id:'tipos',label:'Tipos Movimiento',icon:List,group:'Configuración'},
  {id:'chequeras',label:'Chequeras',icon:BookOpen,group:'Configuración'},
  {id:'movimientos',label:'Ing. / Egresos',icon:ArrowLeftRight,group:'Operativa'},
  {id:'vales',label:'Vales y Caja',icon:Wallet,group:'Operativa',badge:true},
  {id:'transferencias',label:'Transferencias',icon:ArrowRightLeft,group:'Operativa'},
  {id:'conciliacion',label:'Conciliación',icon:Scale,group:'Control'},
  {id:'arqueo',label:'Arqueo de Caja',icon:Calculator,group:'Control'},
  {id:'reportes',label:'Analítica & BI',icon:BarChart3,group:'Reportes'},
];

function BancoApp({ fbUser, onBack }) {
  const [sec,setSec]=useState('dashboard'); 
  const [cuentas,setCuentas]=useState([]); const [tasas,setTasas]=useState([]);
  const [tipos,setTipos]=useState([]); const [chequeras,setChequeras]=useState([]);
  const [movimientos,setMovimientos]=useState([]); const [vales,setVales]=useState([]);
  const [transferencias,setTransferencias]=useState([]); const [planCuentas, setPlanCuentas]=useState([]);

  useEffect(()=>{
    if(!fbUser) return;
    const subs=[
      onSnapshot(col('banco_cuentas'),s=>setCuentas(s.docs.map(d=>d.data()))),
      onSnapshot(query(col('banco_tasas'),orderBy('fecha','desc')),s=>setTasas(s.docs.map(d=>d.data()))),
      onSnapshot(col('banco_tipos'),s=>setTipos(s.docs.map(d=>d.data()))),
      onSnapshot(col('banco_chequeras'),s=>setChequeras(s.docs.map(d=>d.data()))),
      onSnapshot(query(col('banco_movimientos'),orderBy('fecha','desc')),s=>setMovimientos(s.docs.map(d=>d.data()))),
      onSnapshot(query(col('banco_vales'),orderBy('ts','desc')),s=>setVales(s.docs.map(d=>d.data()))),
      onSnapshot(query(col('banco_transferencias'),orderBy('fecha','desc')),s=>setTransferencias(s.docs.map(d=>d.data()))),
      onSnapshot(query(col('contabilidad_cuentas'),orderBy('codigo','asc')),s=>setPlanCuentas(s.docs.map(d=>d.data())))
    ];
    return ()=>subs.forEach(u=>u());
  },[fbUser]);

  const vp=vales.filter(v=>v.estado==='Pendiente').length;
  const tasaActiva = tasas.find(t=>t.modulo==='Banco' || t.modulo==='Todos')?.tasaRef || tasas[0]?.tasaRef || '—';

  const sections={
    dashboard:<DashboardBanco movimientos={movimientos} vales={vales} cuentas={cuentas} tasas={tasas}/>,
    cuentas:<CuentasBanco cuentas={cuentas} planCuentas={planCuentas}/>,
    tasas:<Tasas tasas={tasas}/>, tipos:<Tipos tipos={tipos} planCuentas={planCuentas}/>,
    chequeras:<Chequeras chequeras={chequeras} cuentas={cuentas}/>,
    movimientos:<Movimientos movimientos={movimientos} cuentas={cuentas} tipos={tipos} tasas={tasas}/>,
    vales:<Vales vales={vales} cuentas={cuentas} tasas={tasas}/>,
    transferencias:<Transferencias transferencias={transferencias} cuentas={cuentas} tasas={tasas}/>,
    conciliacion:<Conciliacion movimientos={movimientos} cuentas={cuentas}/>,
    arqueo:<Arqueo vales={vales} cuentas={cuentas}/>,
    reportes:<Reportes movimientos={movimientos} cuentas={cuentas} vales={vales} tasas={tasas}/>,
  };

  const groups=[...new Set(NAV_BANCO.map(n=>n.group))];
  const curNav=NAV_BANCO.find(n=>n.id===sec);

  return (
    <div className="flex h-screen overflow-hidden bg-white w-full">
      <aside className="w-64 bg-black flex flex-col h-screen overflow-y-auto flex-shrink-0">
        <div className="px-6 py-6 border-b border-white/10 flex-shrink-0">
          <p className="font-black text-sm text-[#f97316] leading-tight">Servicios Jiret G&amp;B, C.A.</p>
          <p className="text-[9px] text-gray-400 uppercase tracking-widest mt-1">Supply ERP · Módulo Banco</p>
        </div>
        <nav className="flex-1 py-4">
          {groups.map(group=>(
            <div key={group} className="mb-4">
              <p className="px-6 pb-2 text-[8px] font-black uppercase tracking-[2px] text-gray-600">{group}</p>
              {NAV_BANCO.filter(n=>n.group===group).map(({id,label,icon:Icon,badge})=>(
                <button key={id} onClick={()=>setSec(id)} className={`w-full flex items-center gap-3 px-6 py-2.5 text-left transition-all text-xs font-black uppercase tracking-wider ${sec===id?'bg-[#f97316] text-white shadow-lg shadow-[#f97316]/20 border-r-4 border-white':'text-gray-400 hover:bg-white/5 hover:text-white'}`}>
                  <Icon size={16} className="flex-shrink-0"/><span className="truncate">{label}</span>
                  {badge&&vp>0&&<span className="ml-auto bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">{vp}</span>}
                </button>
              ))}
            </div>
          ))}
        </nav>
        <div className="p-4 border-t border-white/5">
          <button onClick={onBack} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-800 transition-colors"><ArrowLeft size={14}/> Volver al Panel</button>
        </div>
      </aside>
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="bg-white border-b border-gray-100 px-8 h-16 flex items-center justify-between flex-shrink-0 shadow-sm">
          <div><h1 className="font-black text-black text-sm uppercase tracking-wide">{curNav?.label||'Dashboard'}</h1><p className="text-[9px] text-gray-400 font-medium uppercase tracking-widest">Banco <ChevronRight size={8} className="inline"/> {curNav?.group}</p></div>
          <div className="flex items-center gap-4">
            <div className="bg-orange-50 border border-orange-200 rounded-full px-4 py-2 flex items-center gap-2 shadow-sm"><span className="w-2 h-2 rounded-full bg-[#f97316] animate-pulse"/><span className="text-[11px] font-black text-orange-700 font-mono">Ref. Banco: {tasaActiva} Bs./$</span></div>
            <button onClick={()=>setSec('movimientos')} className="bg-[#f97316] text-white font-black text-[10px] uppercase tracking-widest px-4 py-2.5 rounded-xl hover:bg-[#ea580c] transition-colors flex items-center gap-2 shadow-md"><Plus size={14}/> Movimiento</button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-8 bg-gray-50">{sections[sec]}</main>
      </div>
    </div>
  );
}

// ============================================================================
// MÓDULO CONTABILIDAD E IMPORTACIÓN PUC
// ============================================================================
function ContabilidadApp({ fbUser, onBack }) {
  const [sec,setSec]=useState('plan_cuentas'); 
  const [planCuentas, setPlanCuentas]=useState([]);
  const [busy,setBusy]=useState(false);
  const [modal,setModal]=useState(false);
  const [form,setForm]=useState({codigo:'',nombre:'',tipo:'Activo',naturaleza:'Deudora',nivel:'1'});

  useEffect(()=>{
    if(!fbUser) return;
    const sub = onSnapshot(query(col('contabilidad_cuentas'),orderBy('codigo','asc')),s=>setPlanCuentas(s.docs.map(d=>d.data())));
    return ()=>sub();
  },[fbUser]);

  const save=async()=>{
    if(!form.codigo||!form.nombre) return alert('Código y nombre obligatorios');
    setBusy(true); 
    try{
      const id=gid(); await setDoc(dref('contabilidad_cuentas',id),{...form, id, ts:serverTimestamp()}); 
      setModal(false); setForm({codigo:'',nombre:'',tipo:'Activo',naturaleza:'Deudora',nivel:'1'});
    }finally{ setBusy(false); }
  };
  const del=async(id)=>{if(window.confirm('¿Eliminar cuenta?')) await deleteDoc(dref('contabilidad_cuentas',id));};

  const handleExport = () => {
    let csvContent = "Código,Descripción\n";
    planCuentas.forEach(c => { csvContent += `"${c.codigo}","${c.nombre}"\n`; });
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a"); link.setAttribute("href", url); link.setAttribute("download", "plan_de_cuentas.csv");
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target.result;
      const lines = text.split('\n');
      setBusy(true);
      try {
        for (const line of lines) {
          if (!line.trim()) continue;
          const parts = line.includes('\t') ? line.split('\t') : line.split(',');
          let rawCode = parts[0]?.trim();
          const code = rawCode.replace(/\\s*/g, '').replace(/\\s*/g, '').trim();
          const name = parts[1]?.trim()?.replace(/(^"|"$)/g, '');
          
          if (code && name && !code.toLowerCase().includes('código')) { 
            const id = gid();
            let tipo = 'No Asignado';
            if(code.startsWith('1')) tipo = 'Activo';
            if(code.startsWith('2')) tipo = 'Pasivo';
            if(code.startsWith('3')) tipo = 'Patrimonio';
            if(code.startsWith('4')) tipo = 'Ingreso';
            if(code.startsWith('5')) tipo = 'Costo';
            if(code.startsWith('6') || code.startsWith('7')) tipo = 'Gasto';

            await setDoc(dref('contabilidad_cuentas', id), {
              codigo: code, nombre: name, tipo: tipo,
              naturaleza: (code.startsWith('1') || code.startsWith('5') || code.startsWith('6')) ? 'Deudora' : 'Acreedora',
              nivel: String(code.split('.').length), id, ts: serverTimestamp()
            });
          }
        }
        alert('Plan de cuentas importado exitosamente.');
      } catch (error) {
        alert('Hubo un error al procesar el archivo.');
      } finally {
        setBusy(false); e.target.value = null;
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-white w-full">
      <aside className="w-64 bg-black flex flex-col h-screen overflow-y-auto flex-shrink-0">
        <div className="px-6 py-6 border-b border-white/10 flex-shrink-0">
          <p className="font-black text-sm text-[#3b82f6] leading-tight">Servicios Jiret G&amp;B, C.A.</p>
          <p className="text-[9px] text-gray-400 uppercase tracking-widest mt-1">Supply ERP · Contabilidad</p>
        </div>
        <nav className="flex-1 py-4">
           <div className="mb-4">
             <p className="px-6 pb-2 text-[8px] font-black uppercase tracking-[2px] text-gray-600">Maestros</p>
             <button className="w-full flex items-center gap-3 px-6 py-2.5 text-left transition-all text-xs font-black uppercase tracking-wider bg-[#3b82f6] text-white shadow-lg shadow-[#3b82f6]/20 border-r-4 border-white">
               <List size={16} className="flex-shrink-0"/><span className="truncate">Plan de Cuentas</span>
             </button>
           </div>
        </nav>
        <div className="p-4 border-t border-white/5">
          <button onClick={onBack} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-800 transition-colors"><ArrowLeft size={14}/> Volver al Panel</button>
        </div>
      </aside>
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="bg-white border-b border-gray-100 px-8 h-16 flex items-center justify-between flex-shrink-0 shadow-sm">
          <div><h1 className="font-black text-black text-sm uppercase tracking-wide">Plan de Cuentas (PUC)</h1><p className="text-[9px] text-gray-400 font-medium uppercase tracking-widest">Contabilidad <ChevronRight size={8} className="inline"/> Maestros</p></div>
        </header>
        <main className="flex-1 overflow-y-auto p-8 bg-gray-50">
           <Card 
            title="Estructura del Plan de Cuentas" 
            action={
              <div className="flex items-center gap-2">
                <input type="file" accept=".txt,.csv" id="import-puc" className="hidden" onChange={handleImport} />
                <Bo onClick={() => document.getElementById('import-puc').click()} sm><Upload size={12}/> Importar</Bo>
                <Bo onClick={handleExport} sm><Download size={12}/> Exportar</Bo>
                <Bg onClick={()=>setModal(true)} sm><Plus size={12}/> Nueva Cuenta</Bg>
              </div>
            }
          >
            {busy && <div className="p-4 bg-orange-50 text-orange-700 text-xs font-black text-center mb-4 rounded-xl animate-pulse">Procesando archivo y construyendo árbol de cuentas, por favor espere...</div>}
            <div className="overflow-x-auto"><table className="w-full">
              <thead><tr><Th>Código Contable</Th><Th>Descripción de la Cuenta</Th><Th>Clasificación</Th><Th>Naturaleza</Th><Th right>Nivel</Th><Th></Th></tr></thead>
              <tbody>
                {planCuentas.length===0&&<tr><td colSpan={6} className="text-center text-xs text-gray-400 py-8">Sin cuentas estructuradas. Importe su archivo TXT.</td></tr>}
                {planCuentas.map(c=><tr key={c.id} className="hover:bg-gray-50 border-b border-gray-100 last:border-0">
                  <Td mono className="font-black text-[#3b82f6] w-32">{c.codigo}</Td>
                  <Td className="font-bold text-black uppercase">{c.nombre}</Td>
                  <Td><Badge v={c.tipo==='Activo'||c.tipo==='Egreso'||c.tipo==='Costo'||c.tipo==='Gasto'?'green':c.tipo==='Pasivo'||c.tipo==='Ingreso'?'gold':'blue'}>{c.tipo}</Badge></Td>
                  <Td><Badge v={c.naturaleza==='Deudora'?'gray':'blue'}>{c.naturaleza}</Badge></Td>
                  <Td right mono className="text-gray-400">{c.nivel}</Td>
                  <Td><button onClick={()=>del(c.id)} className="p-1.5 bg-red-50 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition-all"><Trash2 size={11}/></button></Td>
                </tr>)}
              </tbody>
            </table></div>
          </Card>

          <Modal open={modal} onClose={()=>setModal(false)} title="Registrar Cuenta Contable" footer={<><Bo onClick={()=>setModal(false)}>Cancelar</Bo><Bg onClick={save}>{busy?'Guardando…':'Registrar'}</Bg></>}>
            <div className="grid grid-cols-2 gap-4">
              <FG label="Código de Cuenta"><input className={inp} value={form.codigo} onChange={e=>setForm({...form,codigo:e.target.value})} placeholder="Ej: 1.1.01.01.001"/></FG>
              <FG label="Nivel"><input type="number" min="1" max="5" className={inp} value={form.nivel} onChange={e=>setForm({...form,nivel:e.target.value})} placeholder="1"/></FG>
              <FG label="Descripción (Nombre)" full><input className={inp} value={form.nombre} onChange={e=>setForm({...form,nombre:e.target.value})} placeholder="Ej: Banco Banesco Corriente"/></FG>
              <FG label="Clasificación / Tipo"><select className={inp} value={form.tipo} onChange={e=>setForm({...form,tipo:e.target.value})}><option>Activo</option><option>Pasivo</option><option>Patrimonio</option><option>Ingreso</option><option>Costo</option><option>Gasto</option></select></FG>
              <FG label="Naturaleza"><select className={inp} value={form.naturaleza} onChange={e=>setForm({...form,naturaleza:e.target.value})}><option>Deudora</option><option>Acreedora</option></select></FG>
            </div>
          </Modal>
        </main>
      </div>
    </div>
  );
}

// ============================================================================
// APP ROOT (ENRUTADOR PRINCIPAL)
// ============================================================================
export default function App() {
  const [view, setView] = useState('login'); 
  const [fbUser, setFbUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    signInAnonymously(auth).catch(console.error);
    const unsub = onAuthStateChanged(auth, u => {
      setFbUser(u);
      if (u) setLoading(false);
    });
    return () => unsub();
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center">
      <div className="w-16 h-16 border-4 border-[#f97316] border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-[#f97316] font-black uppercase text-xs tracking-widest">Iniciando Core ERP...</p>
    </div>
  );

  return (
    <ErrorBoundary>
      {/* 1. Login */}
      {view === 'login' && <LoginScreen onLogin={() => setView('selector')} />}
      
      {/* 2. Selector Principal */}
      {view === 'selector' && <MainSelector onSelect={setView} />}

      {/* 3. Panel Administrativo */}
      {view === 'admin_dash' && <AdminDashboard onSelectModule={(id) => setView(id)} onBack={() => setView('selector')} />}

      {/* 4. Panel Contable */}
      {view === 'cont_dash' && <ContableDashboard onSelectModule={(id) => setView(id)} onBack={() => setView('selector')} />}

      {/* 5. Módulos Operativos */}
      {view === 'banco' && <BancoApp fbUser={fbUser} onBack={() => setView('admin_dash')} />}
      {view === 'contabilidad' && <ContabilidadApp fbUser={fbUser} onBack={() => setView('cont_dash')} />}
      {view === 'configuracion' && <ConfiguracionApp onBack={() => setView('admin_dash')} />}

      {/* 6. Módulos en Desarrollo */}
      {['facturacion', 'inventario', 'nomina', 'reportes', 'asientos', 'impuestos', 'nacionalizacion'].includes(view) && (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0a] p-6">
          <div className="bg-white p-10 rounded-[3rem] shadow-2xl text-center border-t-8 border-[#f97316] max-w-md w-full">
            <div className="w-20 h-20 bg-gray-100 rounded-[2rem] flex items-center justify-center mx-auto mb-6"><Blocks size={40} className="text-gray-400" /></div>
            <h2 className="text-2xl font-black text-black uppercase mb-2">Módulo en Desarrollo</h2>
            <p className="text-gray-500 text-sm font-medium mb-8">El entorno de <span className="font-black text-[#f97316] uppercase">{view}</span> está actualmente en fase de codificación.</p>
            <button onClick={() => setView(view === 'asientos' || view === 'impuestos' || view === 'nacionalizacion' ? 'cont_dash' : 'admin_dash')} className="bg-black w-full text-white px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-[#f97316] transition-all shadow-lg"><ArrowLeft size={16} className="inline mr-2" /> Volver al Dashboard</button>
          </div>
        </div>
      )}
    </ErrorBoundary>
  );
}

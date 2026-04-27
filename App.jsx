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
  Settings2, Mail
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import {
  getFirestore, collection, doc, setDoc, updateDoc,
  onSnapshot, deleteDoc, query, orderBy, serverTimestamp, writeBatch
} from 'firebase/firestore';

// ============================================================================
// CONFIGURACIÓN FIREBASE & UTILIDADES
// ============================================================================
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, errorMsg: '' }; }
  static getDerivedStateFromError(error) { return { hasError: true }; }
  componentDidCatch(error) { this.setState({ errorMsg: error && error.message ? error.message : String(error) }); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 print:hidden">
          <AlertTriangle size={60} className="text-red-500 mb-4" />
          <h2 className="text-2xl font-black text-black uppercase mb-2">Sistema Protegido de Caída</h2>
          <p className="text-gray-500 text-sm mb-6">{this.state.errorMsg}</p>
          <button onClick={() => window.location.reload()} className="bg-black text-white font-black px-8 py-4 rounded-xl uppercase tracking-widest text-xs shadow-lg">Recargar Interfaz</button>
        </div>
      );
    }
    return this.props.children; 
  }
}

// COMPRESOR DE IMÁGENES (Extraído de App 45)
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
const dref = (n, id) => doc(db, n, String(id));
const col = (n) => collection(db, n);

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
// LOGIN SCREEN (Exactamente copiado de App 45 con su Background)
// ============================================================================
function LoginScreen({ onLogin, settings, systemUsers }) {
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault(); 
    const user = loginData.username.toLowerCase().trim(); 
    const pass = loginData.password.trim();
    
    // Validación real contra la BD o maestro (admin/1234) de respaldo
    const foundUser = (systemUsers || []).find(u => u.username === user && u.password === pass);
    
    if (foundUser || (user === 'admin' && pass === '1234')) { 
      onLogin(foundUser || { name: 'Administrador Maestro', role: 'Master' }); 
      setLoginError(''); 
    } else { 
      setLoginError('Credenciales incorrectas. Intente nuevamente.'); 
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative" style={{ backgroundImage: settings?.loginBg ? `url(${settings.loginBg})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center' }}>
      {settings?.loginBg && <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>}
      <div className="bg-white p-12 rounded-[2rem] shadow-2xl w-full max-w-md relative z-10 border-t-8 border-orange-500 transform transition-all">
        <div className="text-center mb-10">
          <span className="text-3xl font-light tracking-widest text-gray-800">Supply</span>
          <div className="flex items-center justify-center -mt-2">
            <span className="text-black font-black text-[50px] leading-none">G</span><div className="bg-orange-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-xl font-black mx-1 shadow-inner">&amp;</div><span className="text-black font-black text-[50px] leading-none">B</span>
          </div>
          <p className="text-[10px] font-black tracking-widest text-gray-400 mt-2 uppercase">Enterprise Resource Planning</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-[10px] font-black text-gray-500 uppercase mb-2 tracking-widest">Usuario de Acceso</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18}/>
              <input type="text" required value={loginData.username} onChange={(e) => setLoginData({...loginData, username: e.target.value})} className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-black outline-none focus:border-orange-500 focus:bg-white transition-all text-black" placeholder="admin" />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-500 uppercase mb-2 tracking-widest">Clave de Seguridad</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18}/>
              <input type="password" required value={loginData.password} onChange={(e) => setLoginData({...loginData, password: e.target.value})} className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-black outline-none focus:border-orange-500 focus:bg-white transition-all text-black" placeholder="••••••••" />
            </div>
          </div>
          {loginError && <div className="bg-red-50 text-red-500 text-[10px] font-black uppercase p-3 rounded-xl text-center border border-red-100 animate-in fade-in">{loginError}</div>}
          <button type="submit" className="w-full bg-black text-white font-black py-5 rounded-2xl uppercase tracking-widest text-xs hover:bg-gray-900 transition-all shadow-xl hover:shadow-orange-500/20 mt-4 flex justify-center items-center gap-2">INGRESAR AL SISTEMA <ArrowRight size={16}/></button>
        </form>
        <div className="mt-8 text-center"><p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">© {new Date().getFullYear()} Jiret G&B C.A. Todos los derechos reservados.</p></div>
      </div>
    </div>
  );
}


// ============================================================================
// MÓDULO DE CONFIGURACIÓN (Extraído Exactamente de App 45)
// ============================================================================
function ConfiguracionApp({ settings, systemUsers, onBack }) {
  
  // Estados para Usuarios
  const initialUserForm = { username: '', password: '', name: '', role: 'Usuario', permissions: {
    ventas: false, ventas_ops: false, ventas_facturacion: false, ventas_directorio: false,
    produccion: false, produccion_proyeccion: false, produccion_ordenes: false, produccion_activa: false, produccion_historial: false,
    formulas: false, inventario: false, inventario_solicitudes: false, inventario_catalogo: false, inventario_movimientos: false, inventario_kardex: false,
    simulador: false, costos: false, costos_operativos: false, costos_reportes: false, configuracion: false
  }};
  const [newUserForm, setNewUserForm] = useState(initialUserForm);
  const [editingUserId, setEditingUserId] = useState(null);

  // Estados de Seguridad
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [errorValidacion, setErrorValidacion] = useState(false);

  const handleAdminValidation = () => {
    if (adminPassword === '1234' || adminPassword.toLowerCase() === 'admin') {
      setAdminUnlocked(true); setErrorValidacion(false);
    } else {
      setErrorValidacion(true); setTimeout(() => setErrorValidacion(false), 2000);
    }
  };

  const handleBgUpload = (e) => {
    const file = e.target.files[0];
    if (file) { 
      compressImage(file, async (base64) => { 
        try { 
          await setDoc(doc(db, 'settings', 'general'), { loginBg: base64 }, { merge: true }); 
          alert('Fondo actualizado.'); 
        } catch (error) { 
          alert('Imagen muy pesada o error de red.'); 
        } 
      }); 
    }
  };

  const handleSaveUser = async (e) => {
    e.preventDefault(); 
    if (!newUserForm.username || !newUserForm.password) return alert('Usuario y contraseña requeridos.');
    const userId = newUserForm.username.toLowerCase().trim();
    try { 
      await setDoc(doc(db, 'users', userId), { ...newUserForm, username: userId }); 
      setNewUserForm(initialUserForm); setEditingUserId(null); alert('Usuario registrado/actualizado.'); 
    } catch(err) { alert(err.message); }
  };

  const startEditUser = (u) => {
    const defaultPerms = initialUserForm.permissions;
    const mergedPerms = { ...defaultPerms, ...(u.permissions || {}) };
    setEditingUserId(u.username);
    setNewUserForm({ ...u, permissions: mergedPerms });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteUser = async (id) => { 
    if(id === 'admin') return alert('No puedes eliminar al administrador maestro.'); 
    if(window.confirm(`¿Desea eliminar el acceso al usuario ${id}?`)) {
      await deleteDoc(doc(db, 'users', id));
    }
  };

  if (!adminUnlocked) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center relative">
         <div className="absolute top-6 left-6"><button onClick={onBack} className="bg-black text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 shadow-lg"><ArrowLeft size={14}/> Volver</button></div>
         <div className="bg-white rounded-[2rem] p-10 max-w-sm w-full shadow-2xl transform transition-all relative border border-gray-100">
           <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-20 h-20 bg-red-500 rounded-full flex items-center justify-center shadow-lg border-4 border-white">
             <ShieldCheck size={36} className="text-white" />
           </div>
           <div className="mt-10 text-center">
             <h3 className="text-xl font-black text-black uppercase tracking-wide mb-2">Acceso Restringido</h3>
             <p className="text-gray-500 text-xs font-bold mb-6">Se requieren privilegios de Administrador Master para modificar la configuración.</p>
             <div className="mb-6 relative">
               <input type="password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleAdminValidation()} placeholder="••••••••" className={`w-full border-2 ${errorValidacion ? 'border-red-500 bg-red-50' : 'border-gray-200'} rounded-xl p-4 text-center text-lg font-black tracking-widest focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none transition-all`} autoFocus />
               {errorValidacion && <p className="text-[10px] text-red-500 font-black uppercase mt-2 absolute w-full text-center">Contraseña Incorrecta</p>}
             </div>
             <div className="flex gap-3">
               <button onClick={onBack} className="flex-1 bg-gray-200 text-gray-700 font-black py-4 rounded-xl uppercase text-xs tracking-widest hover:bg-gray-300 transition-all">Cancelar</button>
               <button onClick={handleAdminValidation} className="flex-1 bg-red-500 text-white font-black py-4 rounded-xl shadow-lg uppercase text-xs tracking-widest hover:bg-red-600 transition-all flex items-center justify-center gap-2">Validar</button>
             </div>
           </div>
         </div>
      </div>
    );
  }

  // Layout Vertical de App (45)
  return (
    <div className="min-h-screen bg-gray-100 pb-12">
      {/* Header Configuración */}
      <nav className="bg-black text-white px-6 py-4 shadow-xl sticky top-0 z-40 border-b-4 border-orange-500 flex justify-between items-center">
        <div className="flex items-center gap-2">
           <Settings2 size={24} className="text-orange-500"/>
           <span className="font-black text-lg uppercase tracking-widest">Configuración Maestra</span>
        </div>
        <button onClick={onBack} className="bg-gray-800 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 hover:bg-gray-700 transition-colors"><ArrowLeft size={14}/> Volver al Panel</button>
      </nav>

      <div className="max-w-4xl mx-auto space-y-8 pt-8 px-6 animate-in fade-in">
        
        {/* Accesos Directos Contables */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200">
          <h2 className="text-xl font-black uppercase text-black mb-4 flex items-center gap-3 border-b pb-3"><ArrowRightLeft className="text-teal-500"/> Contabilidad</h2>
          <button onClick={() => alert('Dirígete al Panel Contable en el inicio para acceder al Libro Diario.')} className="px-6 py-3 rounded-2xl border-2 border-teal-200 bg-teal-50 text-teal-700 font-black text-[10px] uppercase hover:bg-teal-100 flex items-center gap-2 transition-all shadow-sm">
            <ArrowRightLeft size={16}/> Libro Diario — Asientos Contables
          </button>
        </div>

        {/* DATOS DE EMPRESA */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200">
          <h2 className="text-xl font-black uppercase text-black mb-4 flex items-center gap-3 border-b pb-3"><FileText className="text-orange-500"/> Datos de la Empresa</h2>
          <p className="text-xs font-bold text-gray-500 mb-4">Estos datos aparecerán en el encabezado de todos los reportes e impresiones.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="text-[9px] font-black text-gray-500 uppercase block mb-1">Razón Social *</label>
              <input type="text" defaultValue={settings.empresaRazonSocial||'SERVICIOS JIRET G&B, C.A.'} onBlur={async e=>{ await setDoc(doc(db, 'settings','general'),{empresaRazonSocial:e.target.value.trim().toUpperCase()},{merge:true}); }} className="w-full border-2 border-gray-200 rounded-xl p-3 text-xs font-bold uppercase outline-none focus:border-orange-400" placeholder="RAZÓN SOCIAL COMPLETA"/>
            </div>
            <div>
              <label className="text-[9px] font-black text-gray-500 uppercase block mb-1">RIF *</label>
              <input type="text" defaultValue={settings.empresaRif||'J-412309374'} onBlur={async e=>{ await setDoc(doc(db, 'settings','general'),{empresaRif:e.target.value.trim().toUpperCase()},{merge:true}); }} className="w-full border-2 border-gray-200 rounded-xl p-3 text-xs font-bold outline-none focus:border-orange-400" placeholder="J-XXXXXXXXX"/>
            </div>
            <div>
              <label className="text-[9px] font-black text-gray-500 uppercase block mb-1">Teléfono</label>
              <input type="text" defaultValue={settings.empresaTelefono||''} onBlur={async e=>{ await setDoc(doc(db, 'settings','general'),{empresaTelefono:e.target.value.trim()},{merge:true}); }} className="w-full border-2 border-gray-200 rounded-xl p-3 text-xs font-bold outline-none focus:border-orange-400" placeholder="0261-0000000"/>
            </div>
            <div className="md:col-span-2">
              <label className="text-[9px] font-black text-gray-500 uppercase block mb-1">Dirección Fiscal</label>
              <input type="text" defaultValue={settings.empresaDireccion||''} onBlur={async e=>{ await setDoc(doc(db, 'settings','general'),{empresaDireccion:e.target.value.trim().toUpperCase()},{merge:true}); }} className="w-full border-2 border-gray-200 rounded-xl p-3 text-xs font-bold uppercase outline-none focus:border-orange-400" placeholder="DIRECCIÓN COMPLETA"/>
            </div>
          </div>
          <p className="text-[9px] text-gray-400 font-bold mt-3">Los campos se guardan al hacer clic fuera (blur).</p>
        </div>

        {/* Configuración de Correos */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200">
          <h2 className="text-xl font-black uppercase text-black mb-4 flex items-center gap-3 border-b pb-3"><Mail className="text-blue-500"/> Configuración de Correos — Notificaciones</h2>
          <p className="text-xs font-bold text-gray-500 mb-4">Configure los correos a los que se enviarán notificaciones de requisiciones y órdenes de compra.</p>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[9px] font-black text-gray-500 uppercase block mb-1">📧 Correo Principal — Procura</label>
                <input type="email" defaultValue={settings.emailProcura||''} onBlur={async e=>{ await setDoc(doc(db, 'settings','general'),{emailProcura:e.target.value.trim()},{merge:true}); }} className="w-full border-2 border-gray-200 rounded-xl p-3 text-xs font-bold outline-none focus:border-blue-400" placeholder="procura@empresa.com"/>
              </div>
              <div>
                <label className="text-[9px] font-black text-gray-500 uppercase block mb-1">📧 Correo Almacén</label>
                <input type="email" defaultValue={settings.emailAlmacen||''} onBlur={async e=>{ await setDoc(doc(db, 'settings','general'),{emailAlmacen:e.target.value.trim()},{merge:true}); }} className="w-full border-2 border-gray-200 rounded-xl p-3 text-xs font-bold outline-none focus:border-blue-400" placeholder="almacen@empresa.com"/>
              </div>
            </div>
            <div>
              <label className="text-[9px] font-black text-gray-500 uppercase block mb-2">Lista de Contactos adicionales (aparecen en dropdown al enviar OC)</label>
              <div className="space-y-1 mb-2">
                {(settings.emailContactos||[]).map((c,i) => (
                  <div key={i} className="flex gap-2 items-center bg-gray-50 border border-gray-200 rounded-xl p-1.5">
                    <input type="text" defaultValue={c.nombre} onBlur={async e=>{const nl=(settings.emailContactos||[]).map((x,j)=>j===i?{...x,nombre:e.target.value.trim()}:x);await setDoc(doc(db, 'settings','general'),{emailContactos:nl},{merge:true});}} className="flex-1 text-xs font-bold bg-transparent outline-none border-b border-transparent focus:border-blue-400 px-1" placeholder="Nombre"/>
                    <input type="email" defaultValue={c.email} onBlur={async e=>{const nl=(settings.emailContactos||[]).map((x,j)=>j===i?{...x,email:e.target.value.trim()}:x);await setDoc(doc(db, 'settings','general'),{emailContactos:nl},{merge:true});}} className="flex-1 text-xs text-gray-600 bg-transparent outline-none border-b border-transparent focus:border-blue-400 px-1" placeholder="email@empresa.com"/>
                    <button onClick={async()=>{const nl=(settings.emailContactos||[]).filter((_,j)=>j!==i);await setDoc(doc(db, 'settings','general'),{emailContactos:nl},{merge:true});}} className="p-1 text-red-400 hover:text-red-600 flex-shrink-0"><Trash2 size={13}/></button>
                  </div>
                ))}
                {(settings.emailContactos||[]).length===0 && <p className="text-[9px] text-gray-400 font-bold italic">Sin contactos agregados aún.</p>}
              </div>
              <div className="flex gap-2">
                <input type="text" id="cfgContactoNombre" className="flex-1 border-2 border-gray-200 rounded-xl p-2 text-xs font-bold outline-none focus:border-blue-400" placeholder="Nombre (ej: Gerencia)"/>
                <input type="email" id="cfgContactoEmail" className="flex-1 border-2 border-gray-200 rounded-xl p-2 text-xs font-bold outline-none focus:border-blue-400" placeholder="email@empresa.com"/>
                <button onClick={async()=>{ const n=document.getElementById('cfgContactoNombre')?.value?.trim(); const e=document.getElementById('cfgContactoEmail')?.value?.trim(); if(!n||!e)return; const nl=[...(settings.emailContactos||[]),{nombre:n,email:e}]; await setDoc(doc(db, 'settings','general'),{emailContactos:nl},{merge:true}); document.getElementById('cfgContactoNombre').value=''; document.getElementById('cfgContactoEmail').value=''; }} className="bg-blue-600 text-white px-4 py-2 rounded-xl font-black text-[10px] uppercase hover:bg-blue-700 flex items-center gap-1 whitespace-nowrap"><Plus size={13}/> Agregar</button>
              </div>
            </div>
          </div>
        </div>

        {/* Fondo de Pantalla */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-200">
          <h2 className="text-xl font-black uppercase text-black mb-6 flex items-center gap-3 border-b pb-4"><Settings2 className="text-gray-400"/> Configuración del Sistema</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-black uppercase text-black mb-2">Fondo de Pantalla de Inicio</h3>
              <p className="text-xs text-gray-500 font-bold mb-4">Sube una imagen para personalizar el fondo de la pantalla de inicio de sesión.</p>
              <input type="file" accept="image/*" onChange={handleBgUpload} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-gray-100 file:text-black hover:file:bg-gray-200" />
              {settings.loginBg && <img src={settings.loginBg} alt="Background Preview" className="mt-4 rounded-xl border border-gray-200 max-h-48 object-cover shadow-sm" />}
            </div>
          </div>
        </div>

        {/* GESTIÓN DE USUARIOS */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-200">
          <h2 className="text-xl font-black uppercase text-black mb-6 flex items-center gap-3 border-b pb-4"><Users className="text-orange-500"/> Gestión de Usuarios</h2>
          <form onSubmit={handleSaveUser} className="space-y-4 mb-8 bg-gray-50 p-6 rounded-2xl border border-gray-100">
            <h3 className="text-sm font-black uppercase text-black mb-4">{editingUserId ? 'Modificar Usuario' : 'Nuevo Usuario'}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Usuario (ID)</label><input type="text" disabled={!!editingUserId} required value={newUserForm.username} onChange={e=>setNewUserForm({...newUserForm, username: e.target.value.toLowerCase().trim()})} className="w-full border-2 border-gray-200 rounded-xl p-3 font-black text-xs outline-none focus:border-orange-500" /></div>
              <div><label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Contraseña</label><input type="text" required value={newUserForm.password} onChange={e=>setNewUserForm({...newUserForm, password: e.target.value})} className="w-full border-2 border-gray-200 rounded-xl p-3 font-black text-xs outline-none focus:border-orange-500" /></div>
              <div><label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Nombre Completo</label><input type="text" required value={newUserForm.name} onChange={e=>setNewUserForm({...newUserForm, name: e.target.value.toUpperCase()})} className="w-full border-2 border-gray-200 rounded-xl p-3 font-black text-xs uppercase outline-none focus:border-orange-500" /></div>
              <div><label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Rol / Cargo</label><input type="text" value={newUserForm.role} onChange={e=>setNewUserForm({...newUserForm, role: e.target.value})} className="w-full border-2 border-gray-200 rounded-xl p-3 font-black text-xs uppercase outline-none focus:border-orange-500" /></div>
            </div>
            
            <div className="mt-4">
              <label className="text-[10px] font-bold text-gray-500 uppercase block mb-3">Permisos de Módulos y Sub-módulos</label>
              <div className="space-y-3">
                {[
                  { key:'ventas', label:'Ventas y Facturación', icon:'👥', subs:[ {key:'ventas_ops', label:'OPs / Requisiciones'}, {key:'ventas_facturacion', label:'Facturación'}, {key:'ventas_directorio', label:'Directorio de Clientes'} ]},
                  { key:'produccion', label:'Producción Planta', icon:'🏭', subs:[ {key:'produccion_proyeccion', label:'Proyección MP'}, {key:'produccion_ordenes', label:'Órdenes de Compra'}, {key:'produccion_activa', label:'Producción Activa'}, {key:'produccion_historial', label:'Historial / Reportes'} ]},
                  { key:'formulas', label:'Fórmulas / Recetas', icon:'🧪', subs:[] },
                  { key:'inventario', label:'Control Inventario', icon:'📦', subs:[ {key:'inventario_solicitudes', label:'Solicitudes de Planta'}, {key:'inventario_catalogo', label:'Inv. General'}, {key:'inventario_movimientos', label:'Entradas / Salidas'}, {key:'inventario_kardex', label:'Kardex y Reportes'} ]},
                  { key:'costos', label:'Costos / Reportes Financieros', icon:'💰', subs:[ {key:'costos_operativos', label:'Costos Operativos'}, {key:'costos_reportes', label:'Reportes Financieros / Estado de Resultado'} ]},
                  { key:'banco', label:'Bancos y Tesorería', icon:'🏦', subs:[] },
                  { key:'contabilidad', label:'Contabilidad General', icon:'📊', subs:[] },
                  { key:'configuracion', label:'Configuración', icon:'⚙️', subs:[] },
                ].map(mod => (
                  <div key={mod.key} className="border-2 border-gray-200 rounded-xl overflow-hidden">
                    <label className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-all ${newUserForm.permissions[mod.key] ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 hover:bg-gray-100'}`}>
                      <input type="checkbox" checked={!!newUserForm.permissions[mod.key]} onChange={e=>{
                        const checked = e.target.checked;
                        const newPerms = {...newUserForm.permissions, [mod.key]: checked};
                        if (!checked) mod.subs.forEach(s=>{ newPerms[s.key]=false; });
                        setNewUserForm({...newUserForm, permissions: newPerms});
                      }} className="w-4 h-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded" />
                      <span className="text-sm">{mod.icon}</span>
                      <span className="text-xs font-black uppercase text-gray-800">{mod.label}</span>
                      {newUserForm.permissions[mod.key] && mod.subs.length > 0 && (
                        <span className="ml-auto text-[9px] font-bold text-orange-600">▼ Configurar sub-módulos</span>
                      )}
                    </label>
                    {newUserForm.permissions[mod.key] && mod.subs.length > 0 && (
                      <div className="border-t border-gray-200 px-4 py-3 bg-white grid grid-cols-2 gap-2">
                        {mod.subs.map(sub => (
                          <label key={sub.key} className="flex items-center gap-2 cursor-pointer hover:bg-orange-50 px-3 py-2 rounded-lg border border-gray-100 transition-all">
                            <input type="checkbox" checked={!!newUserForm.permissions[sub.key]} onChange={e=>setNewUserForm({...newUserForm, permissions:{...newUserForm.permissions,[sub.key]:e.target.checked}})} className="w-3.5 h-3.5 text-orange-500 border-gray-300 rounded" />
                            <span className="text-[10px] font-bold text-gray-600 uppercase">{sub.label}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end pt-4"><button type="submit" className="bg-black text-white px-8 py-3 rounded-xl font-black text-[10px] uppercase shadow-lg hover:bg-gray-800 transition-all flex items-center gap-2"><UserPlus size={16}/> GUARDAR USUARIO</button></div>
          </form>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap text-sm">
              <thead className="bg-gray-100 border-b-2 border-gray-200">
                <tr className="uppercase font-black text-[10px] text-gray-500 tracking-widest">
                  <th className="py-3 px-4">Usuario / Nombre</th>
                  <th className="py-3 px-4">Rol</th>
                  <th className="py-3 px-4">Permisos</th>
                  <th className="py-3 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(systemUsers || []).map(u => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 font-black">@{u.username}<br/><span className="text-[10px] font-bold text-gray-500">{u.name}</span></td>
                    <td className="py-3 px-4"><span className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest ${u.role==='Master'?'bg-red-100 text-red-700':u.role==='Planta'?'bg-blue-100 text-blue-700':'bg-gray-200 text-gray-700'}`}>{u.role}</span></td>
                    <td className="py-3 px-4">
                      {u.role === 'Master' ? ( <span className="text-[10px] font-bold text-gray-500">Acceso Total</span> ) : (
                        <div className="flex gap-1 flex-wrap w-48">
                          {Object.keys(u.permissions||{}).filter(k=>u.permissions[k] && !k.includes('_')).slice(0,3).map(k=>(
                            <span key={k} className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-[9px] uppercase font-bold">{k}</span>
                          ))}
                          {Object.keys(u.permissions||{}).filter(k=>u.permissions[k] && !k.includes('_')).length>3 && <span className="text-[10px] text-gray-400">...</span>}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex gap-2 justify-center">
                        <button onClick={()=>startEditUser(u)} className="p-2 bg-gray-100 text-gray-500 rounded-lg hover:bg-orange-500 hover:text-white transition-all"><Settings size={14}/></button>
                        {u.username!=='admin' && <button onClick={()=>handleDeleteUser(u.id)} className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all"><Trash2 size={14}/></button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}


// ============================================================================
// PANTALLA SELECTOR DE ÁREAS (PRINCIPAL)
// ============================================================================
function MainSelector({ onSelect }) {
  return (
    <div className="min-h-screen bg-[#f3f4f6] flex items-center justify-center p-6">
      <div className="flex flex-col md:flex-row gap-8 max-w-5xl w-full">
        <div onClick={() => onSelect('admin_dash')} className="flex-1 bg-[#0a0a0a] rounded-[2.5rem] p-12 cursor-pointer border-l-8 border-[#f97316] shadow-2xl hover:-translate-y-2 hover:shadow-[#f97316]/20 transition-all duration-300 group text-center">
          <div className="w-28 h-28 bg-[#1a1a1a] rounded-full flex items-center justify-center mb-8 mx-auto group-hover:scale-110 transition-transform duration-500"><Briefcase size={48} className="text-[#f97316]"/></div>
          <h2 className="text-2xl font-black text-white uppercase tracking-widest mb-4">Área Administrativa</h2>
          <p className="text-gray-400 text-sm font-medium">Gestión de Facturación, Control de Inventario Multimoneda y Bancos.</p>
        </div>
        <div onClick={() => onSelect('cont_dash')} className="flex-1 bg-white rounded-[2.5rem] p-12 cursor-pointer border-l-8 border-[#3b82f6] shadow-2xl hover:-translate-y-2 hover:shadow-[#3b82f6]/20 transition-all duration-300 group text-center">
          <div className="w-28 h-28 bg-blue-50 rounded-full flex items-center justify-center mb-8 mx-auto group-hover:scale-110 transition-transform duration-500"><Calculator size={48} className="text-[#3b82f6]"/></div>
          <h2 className="text-2xl font-black text-black uppercase tracking-widest mb-4">Área Contable</h2>
          <p className="text-gray-500 text-sm font-medium">Mantenimiento de Plan de Cuentas Central, Asientos de Libro Diario y Balances.</p>
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
    { id: 'facturacion', name: 'Ventas y Facturación', icon: Receipt, dark: true, border: 'border-[#f97316]', text: 'text-[#f97316]', desc: 'Directorio, OP y Facturación' },
    { id: 'inventario', name: 'Control Inventario', icon: Package, dark: true, border: 'border-[#f97316]', text: 'text-[#f97316]', desc: 'Catálogo, Movimientos y Kardex' },
    { id: 'banco', name: 'Bancos y Tesorería', icon: Building2, dark: false, border: 'border-orange-400', text: 'text-orange-400', desc: 'Cuentas, Vales y Liquidez' },
    { id: 'reportes', name: 'Reportes Financieros', icon: BarChart3, dark: false, border: 'border-blue-500', text: 'text-blue-500', desc: 'Dashboard de Rentabilidad' },
    { id: 'nomina', name: 'Nómina', icon: Users, dark: false, border: 'border-gray-400', text: 'text-gray-400', desc: 'Personal y Comisiones' },
  ];

  return (
    <div className="min-h-screen bg-[#f3f4f6] flex flex-col">
      <header className="bg-black px-6 py-4 flex items-center justify-between border-b-4 border-[#f97316]">
        <div className="flex items-center gap-10">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => onBack()}><Blocks className="text-white" size={24}/><span className="text-white font-black text-xl tracking-tighter">Supply <span className="text-[#f97316]">G&B</span></span></div>
          <nav className="hidden md:flex gap-4">
            <button onClick={() => onBack()} className="bg-[#f97316] text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2"><Home size={14}/> Inicio</button>
          </nav>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right hidden sm:block"><p className="text-[#f97316] text-[9px] font-black uppercase">Master</p><p className="text-white text-[11px] font-black uppercase">Administrador General</p></div>
          <div className="flex items-center gap-3 border-l border-gray-800 pl-6">
            <button onClick={() => onSelectModule('configuracion')} className="p-3 bg-gray-900 text-gray-400 rounded-xl hover:text-white hover:bg-gray-800 transition-all border border-gray-800"><Settings size={16}/></button>
            <button onClick={() => window.location.reload()} className="p-3 border border-red-900/40 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"><LogOut size={16}/></button>
          </div>
        </div>
      </header>
      <div className="max-w-6xl mx-auto w-full p-10 flex-1">
        <div className="text-center mb-12"><h2 className="text-4xl font-black text-black uppercase tracking-[0.2em]">Panel Principal ERP</h2><div className="w-20 h-1.5 bg-[#f97316] mx-auto mt-4 rounded-full"></div></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {modAdmin.map(m => (
            <button key={m.id} onClick={() => onSelectModule(m.id)} className={`${m.dark ? 'bg-black' : 'bg-white'} rounded-[2.5rem] p-8 text-left border-l-[8px] ${m.border} shadow-xl hover:-translate-y-2 transition-all duration-300 group flex flex-col h-48`}>
              <m.icon size={36} className={`${m.text} mb-4 group-hover:scale-110 transition-transform`} strokeWidth={2.5}/>
              <h3 className={`font-black text-sm uppercase tracking-wide mb-2 ${m.dark ? 'text-white' : 'text-black'}`}>{m.name}</h3>
              <p className={`text-[10px] font-medium leading-relaxed flex-1 ${m.dark ? 'text-gray-400' : 'text-gray-500'}`}>{m.desc}</p>
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
  return (
    <div className="min-h-screen bg-[#f3f4f6] flex flex-col">
      <header className="bg-black px-6 py-4 flex items-center justify-between border-b-4 border-[#3b82f6]">
        <div className="flex items-center gap-10">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => onBack()}><Blocks className="text-[#3b82f6]" size={24}/><span className="text-white font-black text-xl tracking-tighter">Supply <span className="text-[#3b82f6]">G&B</span></span></div>
          <nav className="hidden md:flex gap-4">
            <button onClick={() => onBack()} className="bg-[#3b82f6] text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2"><Home size={14}/> Contable</button>
          </nav>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right hidden sm:block"><p className="text-[#3b82f6] text-[9px] font-black uppercase">Master</p><p className="text-white text-[11px] font-black uppercase">Contador General</p></div>
          <div className="flex items-center gap-3 border-l border-gray-800 pl-6">
            <button onClick={() => window.location.reload()} className="p-3 border border-red-900/40 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"><LogOut size={16}/></button>
          </div>
        </div>
      </header>
      <div className="max-w-5xl mx-auto w-full p-10 flex-1">
        <div className="text-center mb-12"><h2 className="text-4xl font-black text-black uppercase tracking-[0.2em]">Área Contable y Fiscal</h2><div className="w-20 h-1.5 bg-[#3b82f6] mx-auto mt-4 rounded-full"></div></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { id: 'contabilidad', name: 'Plan de Cuentas (PUC)', icon: BookOpen, dark: false, border: 'border-[#3b82f6]', text: 'text-[#3b82f6]', desc: 'Estructura del árbol contable, importación y catalogación.' },
            { id: 'asientos', name: 'Asientos de Libro Diario', icon: FileText, dark: false, border: 'border-[#f97316]', text: 'text-[#f97316]', desc: 'Registro de operaciones manuales y comprobantes contables.' },
            { id: 'impuestos', name: 'Gestión de Impuestos', icon: Calculator, dark: true, border: 'border-red-500', text: 'text-red-500', desc: 'Retenciones IVA, ISLR y libros de compra/venta.' },
            { id: 'nacionalizacion', name: 'Nacionalización', icon: Globe, dark: true, border: 'border-emerald-500', text: 'text-emerald-500', desc: 'Estructura de costos de importaciones.' }
          ].map(m => (
            <button key={m.id} onClick={() => onSelectModule(m.id)} className={`${m.dark ? 'bg-black' : 'bg-white'} rounded-[2.5rem] p-10 text-left border-l-[8px] ${m.border} shadow-xl hover:-translate-y-2 transition-all duration-300 group flex flex-col h-56`}>
              <m.icon size={40} className={`${m.text} mb-4 group-hover:scale-110 transition-transform`} strokeWidth={2}/>
              <h3 className={`font-black text-lg uppercase tracking-wide mb-2 ${m.dark ? 'text-white' : 'text-black'}`}>{m.name}</h3>
              <p className={`text-xs font-medium leading-relaxed flex-1 ${m.dark ? 'text-gray-400' : 'text-gray-500'}`}>{m.desc}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// APP ROOT (ESTADO GLOBAL Y ENRUTADOR)
// ============================================================================
export default function App() {
  const [view, setView] = useState('login'); 
  const [fbUser, setFbUser] = useState(null);
  const [appUser, setAppUser] = useState(null);
  const [settings, setSettings] = useState({});
  const [systemUsers, setSystemUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    signInAnonymously(auth).catch(console.error);
    const unsub = onAuthStateChanged(auth, u => {
      setFbUser(u);
      if (u) {
        setLoading(false);
        // Suscripción Global a Configuraciones
        onSnapshot(doc(db, 'settings', 'general'), d => {
          if (d.exists()) setSettings(d.data());
        });
        // Suscripción Global a Usuarios
        onSnapshot(collection(db, 'users'), s => {
          setSystemUsers(s.docs.map(x => ({id: x.id, ...x.data()})));
        });
      }
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
      {view === 'login' && <LoginScreen onLogin={(u) => { setAppUser(u); setView('selector'); }} settings={settings} systemUsers={systemUsers} />}
      {view === 'selector' && <MainSelector onSelect={setView} />}
      
      {view === 'admin_dash' && <AdminDashboard onSelectModule={setView} onBack={() => setView('selector')} />}
      {view === 'cont_dash' && <ContableDashboard onSelectModule={setView} onBack={() => setView('selector')} />}

      {/* MÓDULOS RESTAURADOS COMPLETOS DE LA ETAPA ANTERIOR */}
      {view === 'banco' && <BancoApp fbUser={fbUser} onBack={() => setView('admin_dash')} />}
      {view === 'contabilidad' && <ContabilidadApp fbUser={fbUser} onBack={() => setView('cont_dash')} />}
      
      {/* NUEVO MÓDULO DE CONFIGURACIÓN C/ BACKGROUND */}
      {view === 'configuracion' && <ConfiguracionApp settings={settings} systemUsers={systemUsers} onBack={() => setView('admin_dash')} />}

      {/* Constructores Genéricos */}
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


// ============================================================================
// MÓDULO DE BANCO COMPLETO Y FUNCIONAL
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
  const [modal,setModal]=useState(false); const [form,setForm]=useState({fecha:today(), modulo:'Todos', moneda:'USD', tasaRef:'', fuente:'Oficial / BCV'}); const [busy,setBusy]=useState(false);
  const save=async()=>{if(!form.tasaRef) return alert('Ingrese la tasa referencial'); setBusy(true); try{const id=gid(); await setDoc(dref('banco_tasas',id),{...form, tasaRef:Number(form.tasaRef), id, ts:serverTimestamp()}); setModal(false); setForm({fecha:today(), modulo:'Todos', moneda:'USD', tasaRef:'', fuente:'Oficial / BCV'});}finally{setBusy(false);}};
  const tGlobal = tasas.find(t=>t.modulo==='Todos')?.tasaRef || 0; const tBanco = tasas.find(t=>t.modulo==='Banco')?.tasaRef || tGlobal; const ld=[...tasas].reverse().slice(-10).map(t=>t.tasaRef);
  return (
    <div>
      <div className="grid grid-cols-3 gap-4 mb-6"><KPI label="Tasa Referencial Global" value={`${tGlobal} Bs./$`} sub="Aplica si el módulo no tiene tasa propia" accent="gold" Icon={TrendingUp}/><KPI label="Tasa Módulo Banco" value={`${tBanco} Bs./$`} accent="blue" Icon={Landmark}/><KPI label="Monedas Aceptadas" value={`USD / EUR`} sub="Configuración estricta" accent="green" Icon={DollarSign}/></div>
      <div className="grid md:grid-cols-2 gap-5">
        <Card title="Histórico de Tasas por Módulo" action={<Bg onClick={()=>setModal(true)} sm><Plus size={12}/>Registrar Tasa</Bg>}><div className="overflow-x-auto"><table className="w-full"><thead><tr><Th>Fecha</Th><Th>Módulo Aplicable</Th><Th>Moneda</Th><Th right>Tasa Ref.</Th><Th>Fuente</Th></tr></thead><tbody>{tasas.length===0&&<tr><td colSpan={5} className="text-center text-xs text-gray-400 py-8">Sin tasas</td></tr>}{tasas.map(t=><tr key={t.id} className="hover:bg-gray-50"><Td>{dd(t.fecha)}</Td><Td><Badge v={t.modulo==='Todos'?'gray':'blue'}>{t.modulo}</Badge></Td><Td><Pill usd={t.moneda==='USD'}>{t.moneda}</Pill></Td><Td right mono className="font-black text-black">{t.tasaRef}</Td><Td><span className="text-[10px] text-gray-500 uppercase">{t.fuente}</span></Td></tr>)}</tbody></table></div></Card>
        <Card title="Evolución (últimas 10 sesiones)"><LSvg data={ld} height={120}/></Card>
      </div>
      <Modal open={modal} onClose={()=>setModal(false)} title="Registrar Tasa de Cambio" footer={<><Bo onClick={()=>setModal(false)}>Cancelar</Bo><Bg onClick={save}>{busy?'Guardando…':'Guardar'}</Bg></>}><div className="grid grid-cols-2 gap-4"><FG label="Fecha"><input type="date" className={inp} value={form.fecha} onChange={e=>setForm({...form,fecha:e.target.value})}/></FG><FG label="Moneda"><select className={inp} value={form.moneda} onChange={e=>setForm({...form,moneda:e.target.value})}><option>USD</option><option>EUR</option></select></FG><FG label="Tasa Referencial"><input type="number" step="0.01" className={inp} value={form.tasaRef} onChange={e=>setForm({...form,tasaRef:e.target.value})} placeholder="39.47"/></FG><FG label="Módulo Aplicable"><select className={inp} value={form.modulo} onChange={e=>setForm({...form,modulo:e.target.value})}><option>Todos</option><option>Banco</option><option>Facturación</option><option>Inventario</option><option>Contabilidad</option></select></FG><FG label="Fuente" full><input type="text" className={inp} value={form.fuente} onChange={e=>setForm({...form,fuente:e.target.value})} placeholder="Oficial / BCV / Libre" /></FG></div></Modal>
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
        const batch = writeBatch(db);
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

            batch.set(dref('contabilidad_cuentas', id), {
              codigo: code, nombre: name, tipo: tipo,
              naturaleza: (code.startsWith('1') || code.startsWith('5') || code.startsWith('6')) ? 'Deudora' : 'Acreedora',
              nivel: String(code.split('.').length), id, ts: serverTimestamp()
            });
          }
        }
        await batch.commit();
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

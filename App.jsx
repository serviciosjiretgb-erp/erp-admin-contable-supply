import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, Building2, TrendingUp, List, BookOpen,
  ArrowLeftRight, Wallet, ArrowRightLeft, Scale, Calculator,
  BarChart3, Plus, X, Search, ChevronRight, AlertTriangle,
  CheckCircle, Clock, DollarSign, Download, Trash2,
  Banknote, PiggyBank, FileText, LineChart, Landmark,
  TrendingDown, Receipt, Package, ShoppingCart, Globe, 
  Users, ArrowLeft, Blocks, FileSpreadsheet, BookText,
  Briefcase, Upload
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import {
  getFirestore, collection, doc, setDoc, updateDoc,
  onSnapshot, deleteDoc, query, orderBy, serverTimestamp
} from 'firebase/firestore';

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, errorMsg: '' }; }
  static getDerivedStateFromError(e) { return { hasError: true, errorMsg: e?.message || String(e) }; }
  render() {
    if (this.state.hasError) return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black p-6">
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{background:'rgba(0,0,0,.7)'}} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className={`bg-white rounded-3xl w-full ${wide?'max-w-xl':'max-w-lg'} max-h-[90vh] flex flex-col shadow-2xl`}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 flex-shrink-0">
          <h2 className="font-black text-black uppercase tracking-wide text-sm">{title}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200"><X size={14} className="text-gray-500"/></button>
        </div>
        <div className="overflow-y-auto flex-1 p-6">{children}</div>
        {footer && <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 flex-shrink-0">{footer}</div>}
      </div>
    </div>
  );
};
const FG = ({label,children,full}) => <div className={full?'col-span-2':''}><label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5">{label}</label>{children}</div>;
const inp = "w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-xs font-bold outline-none focus:border-[#f97316] transition-colors bg-white text-black";
const Bp = ({onClick,children,sm}) => <button onClick={onClick} className={`bg-black text-white font-black uppercase tracking-widest ${sm?'text-[9px] px-3 py-2':'text-[10px] px-5 py-2.5'} rounded-xl hover:bg-gray-900 transition-colors flex items-center gap-1.5`}>{children}</button>;
const Bg = ({onClick,children,sm}) => <button onClick={onClick} className={`bg-[#f97316] text-white font-black uppercase tracking-widest ${sm?'text-[9px] px-3 py-2':'text-[10px] px-5 py-2.5'} rounded-xl hover:bg-[#ea580c] transition-colors flex items-center gap-1.5`}>{children}</button>;
const Bo = ({onClick,children,sm}) => <button onClick={onClick} className={`border-2 border-gray-200 bg-white text-gray-600 font-black uppercase tracking-widest ${sm?'text-[9px] px-3 py-2':'text-[10px] px-5 py-2.5'} rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-1.5`}>{children}</button>;
const Th = ({children,right}) => <th className={`px-4 py-3 text-[9px] font-black uppercase tracking-widest text-gray-400 border-b-2 border-gray-100 bg-gray-50 ${right?'text-right':'text-left'} whitespace-nowrap`}>{children}</th>;
const Td = ({children,right,mono,className=''}) => <td className={`px-4 py-3 text-xs border-b border-gray-50 ${right?'text-right':''} ${mono?'font-mono':'font-medium'} ${className}`}>{children}</td>;

// ============================================================================
// MÓDULO BANCO (ADMINISTRATIVO)
// ============================================================================
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

function Dashboard({movimientos,vales,cuentas,tasas}) {
  const th=tasas[0]?.tasa||39.47;
  const totalBs=cuentas.filter(c=>c.moneda==='Bs.').reduce((a,c)=>a+Number(c.saldo),0);
  const totalUSD=cuentas.filter(c=>c.moneda==='USD').reduce((a,c)=>a+Number(c.saldo),0);
  const caja=cuentas.find(c=>c.tipo==='Caja')?.saldo||0;
  const pend=vales.filter(v=>v.estado==='Pendiente');
  const tvales=pend.reduce((a,v)=>a+Number(v.monto),0);
  const posicion=totalBs+(totalUSD*th)+Number(caja)-tvales;
  const ing=movimientos.filter(m=>m.tipo==='ingreso').reduce((a,m)=>a+Number(m.equiv||m.monto),0);
  const egr=movimientos.filter(m=>m.tipo==='egreso').reduce((a,m)=>a+Number(m.equiv||m.monto),0);
  const recent=[...movimientos].slice(0,6);
  const barData=[{label:'Ingresos',value:ing,color:'#10b981'},{label:'Egresos',value:egr,color:'#ef4444'},{label:'Vales',value:tvales,color:'#f97316'},{label:'Caja',value:Number(caja),color:'#000000'}];
  const ds=cuentas.slice(0,4).map((c,i)=>({value:Number(c.saldo)*(c.moneda==='USD'?th:1),color:['#000000','#f97316','#10b981','#6b7280'][i%4]}));
  return (
    <div>
      <div className="bg-black rounded-3xl p-6 mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div><p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Posición Neta de Liquidez</p><p className="font-black text-3xl text-[#f97316] font-mono">Bs. {fmt(posicion)}</p><p className="text-[10px] text-gray-500 mt-1">Bancos + Caja − Vales Pendientes</p></div>
        <div className="text-right"><p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Tasa BCV Hoy</p><p className="font-black text-2xl text-[#f97316] font-mono">{th} Bs./$</p><p className="text-[10px] text-gray-500 mt-1">≡ ${fmt(posicion/th)} USD</p></div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KPI label="Total Bancos Bs." value={`Bs. ${fmt(totalBs)}`} accent="green" Icon={Banknote}/>
        <KPI label="Total Bancos USD" value={`$${fmt(totalUSD)}`} accent="gold" Icon={DollarSign}/>
        <KPI label="Caja Principal" value={`Bs. ${fmt(caja)}`} accent="blue" Icon={PiggyBank}/>
        <KPI label="Vales Pendientes" value={`Bs. ${fmt(tvales)}`} sub={`${pend.length} sin liquidar`} accent="red" Icon={Wallet}/>
      </div>
      <div className="grid md:grid-cols-3 gap-5">
        <div className="md:col-span-2">
          <Card title="Flujo del Período"><BarChart data={barData} height={140}/><div className="flex gap-4 mt-4 flex-wrap">{barData.map(d=><span key={d.label} className="flex items-center gap-1.5 text-[10px] font-black text-gray-400 uppercase"><span className="w-2.5 h-2.5 rounded-sm" style={{background:d.color}}/>{d.label}: Bs.{fmt(d.value)}</span>)}</div></Card>
        </div>
        <div>
          <Card title="Distribución"><div className="flex justify-center mb-4"><Donut segs={ds} size={130}/></div><div className="space-y-2">{cuentas.slice(0,4).map((c,i)=><div key={c.id} className="flex items-center justify-between text-[10px]"><span className="flex items-center gap-1.5 font-black text-gray-500 uppercase"><span className="w-2 h-2 rounded-sm" style={{background:['#000000','#f97316','#10b981','#6b7280'][i%4]}}/>{c.banco}</span><span className="font-mono font-black text-black">{c.moneda==='USD'?'$':'Bs.'}{fmt(c.saldo)}</span></div>)}</div></Card>
        </div>
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

function Cuentas({cuentas, planCuentas}) {
  const [modal,setModal]=useState(false);
  const [form,setForm]=useState({banco:'',num:'',tipo:'Corriente',moneda:'Bs.',puc:'',saldo:''});
  const [busy,setBusy]=useState(false);
  const save=async()=>{if(!form.banco||!form.num||!form.puc) return alert('Banco, número y cuenta PUC requeridos'); setBusy(true); try{const id=gid(); await setDoc(dref('banco_cuentas',id),{...form,saldo:Number(form.saldo)||0,id,ts:serverTimestamp()}); setModal(false); setForm({banco:'',num:'',tipo:'Corriente',moneda:'Bs.',puc:'',saldo:''});}finally{setBusy(false);}};
  const del=async(id)=>{if(window.confirm('¿Eliminar cuenta?')) await deleteDoc(dref('banco_cuentas',id));};
  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {cuentas.map((c,i)=><div key={c.id} className="bg-white rounded-2xl border-2 border-gray-100 p-4 hover:border-[#f97316] hover:shadow-md transition-all group cursor-pointer"><p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">{c.banco}</p><p className="text-[10px] font-mono text-gray-400 mb-2 truncate">{c.num}</p><p className="font-black text-xl font-mono text-black">{c.moneda==='USD'?'$':'Bs.'}{fmt(c.saldo)}</p><div className="flex items-center justify-between mt-2"><Pill usd={c.moneda==='USD'}>{c.moneda}</Pill><button onClick={()=>del(c.id)} className="opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={12} className="text-red-400"/></button></div></div>)}
        <button onClick={()=>setModal(true)} className="border-2 border-dashed border-gray-200 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 hover:border-[#f97316] hover:bg-orange-50 transition-all min-h-[100px]"><Plus size={20} className="text-gray-300"/><span className="text-[9px] font-black uppercase text-gray-300">Nueva Cuenta</span></button>
      </div>
      <Card title="Registro de Cuentas" action={<Bp onClick={()=>setModal(true)} sm><Plus size={12}/>Nueva</Bp>}>
        <div className="overflow-x-auto"><table className="w-full"><thead><tr><Th>Banco</Th><Th>Número</Th><Th>Tipo</Th><Th>Moneda</Th><Th>Cuenta Contable (PUC)</Th><Th right>Saldo</Th><Th></Th></tr></thead>
        <tbody>{cuentas.length===0&&<tr><td colSpan={7} className="text-center text-xs text-gray-400 py-8">Sin cuentas registradas</td></tr>}{cuentas.map(c=><tr key={c.id} className="hover:bg-gray-50"><Td><span className="font-black text-black">{c.banco}</span></Td><Td mono>{c.num}</Td><Td>{c.tipo}</Td><Td><Pill usd={c.moneda==='USD'}>{c.moneda}</Pill></Td><Td mono><Badge v="gray">{c.puc}</Badge></Td><Td right mono>{c.moneda==='USD'?'$':'Bs.'}{fmt(c.saldo)}</Td><Td><button onClick={()=>del(c.id)} className="p-1.5 bg-red-50 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition-all"><Trash2 size={11}/></button></Td></tr>)}</tbody></table></div>
      </Card>
      <Modal open={modal} onClose={()=>setModal(false)} title="Nueva Cuenta Bancaria" footer={<><Bo onClick={()=>setModal(false)}>Cancelar</Bo><Bg onClick={save}>{busy?'Guardando…':'Guardar'}</Bg></>}>
        <div className="grid grid-cols-2 gap-4">
          <FG label="Banco"><input className={inp} value={form.banco} onChange={e=>setForm({...form,banco:e.target.value})} placeholder="Banesco"/></FG>
          <FG label="Tipo"><select className={inp} value={form.tipo} onChange={e=>setForm({...form,tipo:e.target.value})}><option>Corriente</option><option>Ahorro</option><option>Internacional</option><option>Caja</option></select></FG>
          <FG label="Número de Cuenta" full><input className={inp} value={form.num} onChange={e=>setForm({...form,num:e.target.value})} placeholder="0134-xxxx-xx-xxxxxxxxxx"/></FG>
          <FG label="Moneda"><select className={inp} value={form.moneda} onChange={e=>setForm({...form,moneda:e.target.value})}><option>Bs.</option><option>USD</option><option>EUR</option></select></FG>
          <FG label="Saldo Inicial"><input type="number" className={inp} value={form.saldo} onChange={e=>setForm({...form,saldo:e.target.value})} placeholder="0.00"/></FG>
          <FG label="Cuenta Contable (PUC)" full>
            <select className={inp} value={form.puc} onChange={e=>setForm({...form,puc:e.target.value})}>
              <option value="">Seleccione cuenta del Plan de Cuentas...</option>
              {planCuentas.filter(c => c.tipo?.toUpperCase().includes('ACTIVO')).map(c => <option key={c.id} value={c.codigo}>{c.codigo} — {c.nombre}</option>)}
            </select>
          </FG>
        </div>
      </Modal>
    </div>
  );
}

function Tasas({tasas}) {
  const [modal,setModal]=useState(false);
  const [form,setForm]=useState({fecha:today(),tasa:'',tasaRef:'',moneda:'USD',fuente:'BCV'});
  const [busy,setBusy]=useState(false);
  const save=async()=>{if(!form.tasa) return alert('Ingrese la tasa'); setBusy(true); try{const id=gid(); await setDoc(dref('banco_tasas',id),{...form,tasa:Number(form.tasa),tasaRef:Number(form.tasaRef)||0,id,ts:serverTimestamp()}); setModal(false); setForm({fecha:today(),tasa:'',tasaRef:'',moneda:'USD',fuente:'BCV'});}finally{setBusy(false);}};
  const th=tasas[0]?.tasa||0; const ta=tasas[1]?.tasa||th; const v=ta?((th-ta)/ta*100).toFixed(2):0;
  const ld=[...tasas].reverse().slice(-10).map(t=>t.tasa);
  return (
    <div>
      <div className="grid grid-cols-3 gap-4 mb-6"><KPI label="Tasa BCV Hoy" value={`${th} Bs./$`} sub={dd(tasas[0]?.fecha)} accent="gold" Icon={TrendingUp}/><KPI label="Tasa Referencial" value={`${tasas[0]?.tasaRef||'—'} Bs./$`} accent="blue" Icon={LineChart}/><KPI label="Variación" value={`${v>0?'+':''}${v}%`} sub="vs día anterior" accent={v>=0?'red':'green'} Icon={TrendingUp}/></div>
      <div className="grid md:grid-cols-2 gap-5">
        <Card title="Histórico de Tasas" action={<Bg onClick={()=>setModal(true)} sm><Plus size={12}/>Registrar</Bg>}>
          <div className="overflow-x-auto"><table className="w-full"><thead><tr><Th>Fecha</Th><Th>Moneda</Th><Th right>Tasa BCV</Th><Th right>Ref.</Th><Th>Fuente</Th></tr></thead>
          <tbody>{tasas.length===0&&<tr><td colSpan={5} className="text-center text-xs text-gray-400 py-8">Sin tasas</td></tr>}{tasas.map(t=><tr key={t.id} className="hover:bg-gray-50"><Td>{dd(t.fecha)}</Td><Td><Pill usd>{t.moneda}</Pill></Td><Td right mono className="font-black text-black">{t.tasa}</Td><Td right mono className="text-gray-400">{t.tasaRef||'—'}</Td><Td><Badge v="blue">{t.fuente}</Badge></Td></tr>)}</tbody></table></div>
        </Card>
        <Card title="Evolución (últimas 10 sesiones)"><LSvg data={ld} height={120}/></Card>
      </div>
      <Modal open={modal} onClose={()=>setModal(false)} title="Registrar Tasa de Cambio" footer={<><Bo onClick={()=>setModal(false)}>Cancelar</Bo><Bg onClick={save}>{busy?'Guardando…':'Guardar'}</Bg></>}>
        <div className="grid grid-cols-2 gap-4">
          <FG label="Fecha"><input type="date" className={inp} value={form.fecha} onChange={e=>setForm({...form,fecha:e.target.value})}/></FG>
          <FG label="Moneda"><select className={inp} value={form.moneda} onChange={e=>setForm({...form,moneda:e.target.value})}><option>USD</option><option>EUR</option></select></FG>
          <FG label="Tasa BCV"><input type="number" step="0.01" className={inp} value={form.tasa} onChange={e=>setForm({...form,tasa:e.target.value})} placeholder="39.47"/></FG>
          <FG label="Tasa Referencial"><input type="number" step="0.01" className={inp} value={form.tasaRef} onChange={e=>setForm({...form,tasaRef:e.target.value})} placeholder="41.20"/></FG>
          <FG label="Fuente" full><select className={inp} value={form.fuente} onChange={e=>setForm({...form,fuente:e.target.value})}><option>BCV</option><option>Manual</option></select></FG>
        </div>
      </Modal>
    </div>
  );
}

function Tipos({tipos, planCuentas}) {
  const [modal,setModal]=useState(false); const [filtro,setFiltro]=useState('todos');
  const [form,setForm]=useState({cod:'',desc:'',nat:'ingreso',retIVA:'No',retISLR:'No',puc:''}); const [busy,setBusy]=useState(false);
  const save=async()=>{if(!form.cod||!form.desc||!form.puc) return alert('Código, descripción y cuenta contable requeridos'); setBusy(true); try{const id=gid(); await setDoc(dref('banco_tipos',id),{...form,id,ts:serverTimestamp()}); setModal(false); setForm({cod:'',desc:'',nat:'ingreso',retIVA:'No',retISLR:'No',puc:''});}finally{setBusy(false);}};
  const fil=filtro==='todos'?tipos:tipos.filter(t=>t.nat===filtro);
  return (
    <div>
      <div className="flex gap-2 mb-5">{['todos','ingreso','egreso'].map(t=><button key={t} onClick={()=>setFiltro(t)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors ${filtro===t?'bg-black text-white':'bg-white border-2 border-gray-200 text-gray-500 hover:border-black'}`}>{t}</button>)}</div>
      <Card title="Catálogo de Conceptos" action={<Bp onClick={()=>setModal(true)} sm><Plus size={12}/>Nuevo Tipo</Bp>}>
        <div className="overflow-x-auto"><table className="w-full"><thead><tr><Th>Código</Th><Th>Descripción</Th><Th>Naturaleza</Th><Th>Ret. IVA</Th><Th>Ret. ISLR</Th><Th>Cuenta Contable (PUC)</Th></tr></thead>
        <tbody>{fil.length===0&&<tr><td colSpan={6} className="text-center text-xs text-gray-400 py-8">Sin tipos registrados</td></tr>}{fil.map(t=><tr key={t.id} className="hover:bg-gray-50"><Td mono className="font-black text-black">{t.cod}</Td><Td>{t.desc}</Td><Td><Badge v={t.nat==='ingreso'?'green':'red'}>{t.nat}</Badge></Td><Td>{t.retIVA==='Sí'?<Badge v="gold">Sí</Badge>:'—'}</Td><Td>{t.retISLR==='Sí'?<Badge v="gold">Sí</Badge>:'—'}</Td><Td mono><Badge v="gray">{t.puc}</Badge></Td></tr>)}</tbody></table></div>
      </Card>
      <Modal open={modal} onClose={()=>setModal(false)} title="Nuevo Tipo de Movimiento" footer={<><Bo onClick={()=>setModal(false)}>Cancelar</Bo><Bp onClick={save}>{busy?'Guardando…':'Crear'}</Bp></>}>
        <div className="grid grid-cols-2 gap-4">
          <FG label="Código"><input className={inp} value={form.cod} onChange={e=>setForm({...form,cod:e.target.value})} placeholder="ING-001"/></FG>
          <FG label="Naturaleza"><select className={inp} value={form.nat} onChange={e=>setForm({...form,nat:e.target.value})}><option value="ingreso">Ingreso</option><option value="egreso">Egreso</option></select></FG>
          <FG label="Descripción" full><input className={inp} value={form.desc} onChange={e=>setForm({...form,desc:e.target.value})} placeholder="Cobro de facturas..."/></FG>
          <FG label="Ret. IVA"><select className={inp} value={form.retIVA} onChange={e=>setForm({...form,retIVA:e.target.value})}><option>No</option><option>Sí</option></select></FG>
          <FG label="Ret. ISLR"><select className={inp} value={form.retISLR} onChange={e=>setForm({...form,retISLR:e.target.value})}><option>No</option><option>Sí</option></select></FG>
          <FG label="Cuenta Contable (PUC)" full>
            <select className={inp} value={form.puc} onChange={e=>setForm({...form,puc:e.target.value})}>
              <option value="">Seleccione cuenta del Plan de Cuentas...</option>
              {planCuentas.map(c => <option key={c.id} value={c.codigo}>{c.codigo} — {c.nombre}</option>)}
            </select>
          </FG>
        </div>
      </Modal>
    </div>
  );
}

function Chequeras({chequeras,cuentas}) { 
  const [modal,setModal]=useState(false);
  const [form,setForm]=useState({cuentaId:'',banco:'',serie:'',ini:'',fin:'',fechaRecep:today()}); const [busy,setBusy]=useState(false);
  const save=async()=>{if(!form.serie||!form.ini||!form.fin) return alert('Complete todos los campos'); setBusy(true); try{const id=gid(); await setDoc(dref('banco_chequeras',id),{...form,ini:Number(form.ini),fin:Number(form.fin),actual:Number(form.ini),usados:0,id,estado:'Activa',ts:serverTimestamp()}); setModal(false); setForm({cuentaId:'',banco:'',serie:'',ini:'',fin:'',fechaRecep:today()});}finally{setBusy(false);}};
  return (
    <Card title="Registro de Chequeras" action={<Bp onClick={()=>setModal(true)} sm><Plus size={12}/>Nueva</Bp>}>
      <div className="overflow-x-auto"><table className="w-full"><thead><tr><Th>Banco</Th><Th>Serie</Th><Th right>Ini.</Th><Th right>Fin</Th><Th right>Actual</Th><Th right>Usados</Th><Th>Estado</Th></tr></thead>
      <tbody>{chequeras.length===0&&<tr><td colSpan={7} className="text-center text-xs text-gray-400 py-8">Sin chequeras</td></tr>}{chequeras.map(c=>{const tot=c.fin-c.ini+1; const pct=Math.round((c.usados/tot)*100); const est=pct>=90?'Por agotar':pct===0?'Nueva':'Activa'; return <tr key={c.id} className="hover:bg-gray-50"><Td><span className="font-black text-black">{c.banco}</span></Td><Td mono>{c.serie}</Td><Td right mono>{String(c.ini).padStart(3,'0')}</Td><Td right mono>{String(c.fin).padStart(3,'0')}</Td><Td right mono>{String(c.actual).padStart(3,'0')}</Td><Td right><span className="font-mono font-black">{c.usados}</span><span className="text-gray-300 text-[10px]"> /{tot}</span></Td><Td><Badge v={est==='Activa'?'green':est==='Nueva'?'blue':'gold'}>{est}</Badge></Td></tr>;})} </tbody></table></div>
      <Modal open={modal} onClose={()=>setModal(false)} title="Registrar Chequera" footer={<><Bo onClick={()=>setModal(false)}>Cancelar</Bo><Bp onClick={save}>{busy?'Guardando…':'Registrar'}</Bp></>}>
        <div className="grid grid-cols-2 gap-4">
          <FG label="Banco / Cuenta" full><select className={inp} value={form.cuentaId} onChange={e=>{const c=cuentas.find(x=>x.id===e.target.value); setForm({...form,cuentaId:e.target.value,banco:c?c.banco:''});}}><option value="">Seleccionar...</option>{cuentas.map(c=><option key={c.id} value={c.id}>{c.banco} — {c.num}</option>)}</select></FG>
          <FG label="Serie"><input className={inp} value={form.serie} onChange={e=>setForm({...form,serie:e.target.value})} placeholder="A"/></FG>
          <FG label="Folio Inicial"><input type="number" className={inp} value={form.ini} onChange={e=>setForm({...form,ini:e.target.value})} placeholder="001"/></FG>
          <FG label="Folio Final"><input type="number" className={inp} value={form.fin} onChange={e=>setForm({...form,fin:e.target.value})} placeholder="050"/></FG>
          <FG label="Fecha Recepción" full><input type="date" className={inp} value={form.fechaRecep} onChange={e=>setForm({...form,fechaRecep:e.target.value})}/></FG>
        </div>
      </Modal>
    </Card>
  );
}

function Movimientos({movimientos,cuentas,tipos,tasas}) {
  const [modal,setModal]=useState(false); const [busca,setBusca]=useState('');
  const [form,setForm]=useState({fecha:today(),tipo:'ingreso',concepto:'',cuentaId:'',moneda:'Bs.',monto:'',tasa:tasas[0]?.tasa||'39.47',retIVA:'No',retISLR:'No',ref:''}); const [busy,setBusy]=useState(false);
  const save=async()=>{if(!form.monto||!form.concepto) return alert('Concepto y monto requeridos'); setBusy(true); try{const c=cuentas.find(x=>x.id===form.cuentaId); const equiv=form.moneda==='USD'?Number(form.monto)*Number(form.tasa):Number(form.monto); const id=gid(); await setDoc(dref('banco_movimientos',id),{...form,monto:Number(form.monto),tasa:Number(form.tasa),equiv,banco:c?.banco||'',id,ts:serverTimestamp()}); if(c){const delta=form.tipo==='ingreso'?equiv:-equiv; await updateDoc(dref('banco_cuentas',form.cuentaId),{saldo:Number(c.saldo)+delta});} setModal(false); setForm({fecha:today(),tipo:'ingreso',concepto:'',cuentaId:'',moneda:'Bs.',monto:'',tasa:tasas[0]?.tasa||'39.47',retIVA:'No',retISLR:'No',ref:''});}finally{setBusy(false);}};
  const del=async(m)=>{if(!window.confirm('¿Eliminar?')) return; await deleteDoc(dref('banco_movimientos',m.id)); const c=cuentas.find(x=>x.id===m.cuentaId); if(c){const delta=m.tipo==='ingreso'?-m.equiv:m.equiv; await updateDoc(dref('banco_cuentas',m.cuentaId),{saldo:Number(c.saldo)+delta});}};
  const fil=movimientos.filter(m=>!busca||m.concepto?.toLowerCase().includes(busca.toLowerCase())||m.banco?.toLowerCase().includes(busca.toLowerCase()));
  return (
    <div>
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="flex items-center gap-2 border-2 border-gray-200 rounded-xl px-3 py-2 bg-white flex-1 max-w-sm"><Search size={14} className="text-gray-400 flex-shrink-0"/><input className="outline-none text-xs font-medium w-full text-black bg-transparent" placeholder="Buscar..." value={busca} onChange={e=>setBusca(e.target.value)}/></div>
        <Bg onClick={()=>setModal(true)}><Plus size={14}/>Registrar Movimiento</Bg>
      </div>
      <Card title="Libro de Movimientos" subtitle={`${fil.length} registros`} action={<Bo onClick={()=>window.print()} sm><Download size={12}/>Exportar</Bo>}>
        <div className="overflow-x-auto"><table className="w-full"><thead><tr><Th>Fecha</Th><Th>Concepto</Th><Th>Cuenta</Th><Th>Mon.</Th><Th right>Monto</Th><Th right>Equiv. Bs.</Th><Th>IVA</Th><Th>ISLR</Th><Th></Th></tr></thead>
        <tbody>{fil.length===0&&<tr><td colSpan={9} className="text-center text-xs text-gray-400 py-8">Sin movimientos</td></tr>}{fil.map(m=><tr key={m.id} className="hover:bg-gray-50"><Td>{dd(m.fecha)}</Td><Td className="max-w-[140px] truncate">{m.concepto}</Td><Td>{m.banco}</Td><Td><Pill usd={m.moneda==='USD'}>{m.moneda}</Pill></Td><Td right mono className={m.tipo==='ingreso'?'text-emerald-600':'text-red-500'}>{m.tipo==='ingreso'?'+':'−'}{m.moneda==='USD'?'$':'Bs.'}{fmt(m.monto)}</Td><Td right mono>Bs.{fmt(m.equiv)}</Td><Td className="text-[10px] text-gray-400">{m.retIVA!=='No'?<Badge v="gold">{m.retIVA}</Badge>:'—'}</Td><Td className="text-[10px] text-gray-400">{m.retISLR!=='No'?<Badge v="gold">{m.retISLR}</Badge>:'—'}</Td><Td><button onClick={()=>del(m)} className="p-1.5 bg-red-50 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition-all"><Trash2 size={11}/></button></Td></tr>)}</tbody></table></div>
      </Card>
      <Modal open={modal} onClose={()=>setModal(false)} title="Registrar Movimiento Bancario" wide footer={<><Bo onClick={()=>setModal(false)}>Cancelar</Bo><Bg onClick={save}>{busy?'Guardando…':'Guardar'}</Bg></>}>
        <div className="grid grid-cols-2 gap-4">
          <FG label="Fecha"><input type="date" className={inp} value={form.fecha} onChange={e=>setForm({...form,fecha:e.target.value})}/></FG>
          <FG label="Tipo"><select className={inp} value={form.tipo} onChange={e=>setForm({...form,tipo:e.target.value})}><option value="ingreso">Ingreso</option><option value="egreso">Egreso</option></select></FG>
          <FG label="Concepto" full><select className={inp} value={form.concepto} onChange={e=>setForm({...form,concepto:e.target.value})}><option value="">Seleccionar...</option>{tipos.map(t=><option key={t.id} value={t.desc}>{t.desc}</option>)}<option value="Otro">Otro</option></select></FG>
          <FG label="Cuenta Bancaria"><select className={inp} value={form.cuentaId} onChange={e=>setForm({...form,cuentaId:e.target.value})}><option value="">Seleccionar...</option>{cuentas.map(c=><option key={c.id} value={c.id}>{c.banco} ({c.moneda})</option>)}</select></FG>
          <FG label="Moneda"><select className={inp} value={form.moneda} onChange={e=>setForm({...form,moneda:e.target.value})}><option>Bs.</option><option>USD</option></select></FG>
          <FG label="Monto"><input type="number" className={inp} value={form.monto} onChange={e=>setForm({...form,monto:e.target.value})} placeholder="0.00"/></FG>
          {form.moneda==='USD'&&<FG label="Tasa BCV"><input type="number" step="0.01" className={inp} value={form.tasa} onChange={e=>setForm({...form,tasa:e.target.value})}/></FG>}
          <FG label="Ret. IVA"><select className={inp} value={form.retIVA} onChange={e=>setForm({...form,retIVA:e.target.value})}><option>No</option><option>75% (16%)</option></select></FG>
          <FG label="Ret. ISLR"><select className={inp} value={form.retISLR} onChange={e=>setForm({...form,retISLR:e.target.value})}><option>No</option><option>2%</option><option>3%</option><option>5%</option></select></FG>
          <FG label="Referencia" full><input className={inp} value={form.ref} onChange={e=>setForm({...form,ref:e.target.value})} placeholder="Nro. factura, referencia..."/></FG>
        </div>
        {form.monto&&form.moneda==='USD'&&<div className="mt-4 bg-orange-50 rounded-xl p-3 text-xs font-black text-orange-700">≡ Bs. {fmt(Number(form.monto)*Number(form.tasa))} a tasa {form.tasa}</div>}
      </Modal>
    </div>
  );
}

function Vales({vales,cuentas,tasas}) { return <div className="p-4 bg-white rounded-3xl border border-gray-100"><p className="text-xs text-gray-500 font-bold">Módulo de Vales cargado</p></div>; }
function Transferencias({transferencias,cuentas,tasas}) { return <div className="p-4 bg-white rounded-3xl border border-gray-100"><p className="text-xs text-gray-500 font-bold">Módulo de Transferencias cargado</p></div>; }
function Conciliacion({movimientos,cuentas}) { return <div className="p-4 bg-white rounded-3xl border border-gray-100"><p className="text-xs text-gray-500 font-bold">Módulo de Conciliación cargado</p></div>; }
function Arqueo({vales,cuentas}) { return <div className="p-4 bg-white rounded-3xl border border-gray-100"><p className="text-xs text-gray-500 font-bold">Módulo de Arqueo cargado</p></div>; }
function Reportes({movimientos,cuentas,vales,tasas}) { return <div className="p-4 bg-white rounded-3xl border border-gray-100"><p className="text-xs text-gray-500 font-bold">Módulo Analítico cargado</p></div>; }

function BancoApp({ fbUser }) {
  const [sec,setSec]=useState('dashboard'); 
  const [cuentas,setCuentas]=useState([]); const [tasas,setTasas]=useState([]);
  const [tipos,setTipos]=useState([]); const [chequeras,setChequeras]=useState([]);
  const [movimientos,setMovimientos]=useState([]); const [vales,setVales]=useState([]);
  const [transferencias,setTransferencias]=useState([]);
  const [planCuentas, setPlanCuentas]=useState([]);

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
  const sections={
    dashboard:<Dashboard movimientos={movimientos} vales={vales} cuentas={cuentas} tasas={tasas}/>,
    cuentas:<Cuentas cuentas={cuentas} planCuentas={planCuentas}/>,
    tasas:<Tasas tasas={tasas}/>, 
    tipos:<Tipos tipos={tipos} planCuentas={planCuentas}/>,
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
      <aside className="w-56 min-w-[224px] bg-black flex flex-col h-screen overflow-y-auto flex-shrink-0">
        <div className="px-5 py-6 border-b border-white/10 flex-shrink-0"><p className="font-black text-sm text-[#f97316] leading-tight">Servicios Jiret G&amp;B, C.A.</p><p className="text-[9px] text-gray-400 uppercase tracking-widest mt-1">Supply ERP · Banco (Admin)</p></div>
        <nav className="flex-1 py-3">
          {groups.map(group=>(
            <div key={group}>
              <p className="px-5 pt-4 pb-1.5 text-[8px] font-black uppercase tracking-[2px] text-gray-500">{group}</p>
              {NAV_BANCO.filter(n=>n.group===group).map(({id,label,icon:Icon,badge})=>(
                <button key={id} onClick={()=>setSec(id)} className={`w-full flex items-center gap-2.5 px-4 py-2.5 mx-2 rounded-xl text-left transition-all text-xs font-black uppercase tracking-wide mb-0.5 ${sec===id?'bg-[#f97316]/20 text-[#f97316]':'text-gray-400 hover:bg-white/5 hover:text-white'}`} style={{width:'calc(100% - 16px)'}}>
                  <Icon size={14} className="flex-shrink-0"/><span className="truncate">{label}</span>
                  {badge&&vp>0&&<span className="ml-auto bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">{vp}</span>}
                </button>
              ))}
            </div>
          ))}
        </nav>
      </aside>
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="bg-white border-b border-gray-100 px-6 h-14 flex items-center justify-between gap-4 flex-shrink-0 shadow-sm">
          <div><h1 className="font-black text-black text-sm uppercase tracking-wide">{curNav?.label||'Dashboard'}</h1><p className="text-[9px] text-gray-400 font-medium uppercase tracking-widest">Administrativo <ChevronRight size={8} className="inline"/> Banco</p></div>
          <div className="flex items-center gap-3">
            <div className="bg-orange-50 border border-orange-200 rounded-full px-3 py-1.5 flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#f97316]"/><span className="text-[10px] font-black text-orange-700 font-mono">BCV: {tasas[0]?.tasa||'—'} Bs./$</span></div>
            <button onClick={()=>setSec('movimientos')} className="bg-[#f97316] text-white font-black text-[10px] uppercase tracking-widest px-4 py-2 rounded-xl hover:bg-[#ea580c] transition-colors flex items-center gap-1.5"><Plus size={12}/>Movimiento</button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50">{sections[sec]}</main>
      </div>
    </div>
  );
}

// ============================================================================
// MÓDULO CONTABILIDAD
// ============================================================================
const NAV_CONTAB=[
  {id:'plan_cuentas',label:'Plan de Cuentas',icon:List,group:'Maestros'},
  {id:'asientos',label:'Asientos Diarios',icon:BookText,group:'Operativa'},
  {id:'mayor',label:'Libro Mayor',icon:FileText,group:'Reportes'},
  {id:'balances',label:'Balances Financieros',icon:BarChart3,group:'Reportes'},
];

function PlanCuentas({planCuentas}) {
  const [modal,setModal]=useState(false);
  const [form,setForm]=useState({codigo:'',nombre:'',tipo:'Activo',naturaleza:'Deudora',nivel:'1'});
  const [busy,setBusy]=useState(false);

  const save=async()=>{
    if(!form.codigo||!form.nombre) return alert('Código y nombre son obligatorios');
    setBusy(true); 
    try{
      const id=gid(); 
      await setDoc(dref('contabilidad_cuentas',id),{...form, id, ts:serverTimestamp()}); 
      setModal(false); 
      setForm({codigo:'',nombre:'',tipo:'Activo',naturaleza:'Deudora',nivel:'1'});
    }finally{
      setBusy(false);
    }
  };

  const del=async(id)=>{if(window.confirm('¿Eliminar cuenta contable?')) await deleteDoc(dref('contabilidad_cuentas',id));};

  const handleExport = () => {
    let csvContent = "Código,Descripción\n";
    planCuentas.forEach(c => {
      csvContent += `"${c.codigo}","${c.nombre}"\n`;
    });
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "plan_de_cuentas_jiret.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
          
          // Limpiamos los tags si existen en el TXT
          const code = rawCode.replace(/\\s*/g, '').replace(/\\s*/g, '').trim();
          const name = parts[1]?.trim()?.replace(/(^"|"$)/g, '');
          
          if (code && name && !code.toLowerCase().includes('código') && !code.toLowerCase().includes('codigo')) { 
            const id = gid();
            // Determinamos el tipo aproximado según el número inicial
            let tipo = 'No Asignado';
            if(code.startsWith('1')) tipo = 'Activo';
            if(code.startsWith('2')) tipo = 'Pasivo';
            if(code.startsWith('3')) tipo = 'Patrimonio';
            if(code.startsWith('4')) tipo = 'Ingreso';
            if(code.startsWith('5')) tipo = 'Costo';
            if(code.startsWith('6')) tipo = 'Gasto';

            await setDoc(dref('contabilidad_cuentas', id), {
              codigo: code,
              nombre: name,
              tipo: tipo,
              naturaleza: (code.startsWith('1') || code.startsWith('5') || code.startsWith('6')) ? 'Deudora' : 'Acreedora',
              nivel: String(code.split('.').length),
              id,
              ts: serverTimestamp()
            });
          }
        }
        alert('Plan de cuentas importado exitosamente.');
      } catch (error) {
        console.error(error);
        alert('Hubo un error al procesar el archivo.');
      } finally {
        setBusy(false);
        e.target.value = null; // Reiniciamos el input para futuras importaciones
      }
    };
    reader.readAsText(file);
  };

  return (
    <div>
      <Card 
        title="Estructura del Plan de Cuentas (PUC)" 
        action={
          <div className="flex items-center gap-2">
            <input type="file" accept=".txt,.csv" id="import-puc" className="hidden" onChange={handleImport} />
            <Bo onClick={() => document.getElementById('import-puc').click()} sm><Upload size={12}/> Importar</Bo>
            <Bo onClick={handleExport} sm><Download size={12}/> Exportar</Bo>
            <Bg onClick={()=>setModal(true)} sm><Plus size={12}/>Nueva Cuenta</Bg>
          </div>
        }
      >
        <div className="overflow-x-auto"><table className="w-full">
          <thead><tr><Th>Código Contable</Th><Th>Descripción de la Cuenta</Th><Th>Clasificación</Th><Th>Naturaleza</Th><Th right>Nivel</Th><Th></Th></tr></thead>
          <tbody>
            {planCuentas.length===0&&<tr><td colSpan={6} className="text-center text-xs text-gray-400 py-8">Sin cuentas estructuradas. Importe su archivo TXT/CSV o cree una nueva.</td></tr>}
            {planCuentas.map(c=><tr key={c.id} className="hover:bg-gray-50 border-b border-gray-100 last:border-0">
              <Td mono className="font-black text-[#f97316] w-32">{c.codigo}</Td>
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
    </div>
  );
}

function ContabilidadApp({ fbUser }) {
  const [sec,setSec]=useState('plan_cuentas'); 
  const [planCuentas, setPlanCuentas]=useState([]);

  useEffect(()=>{
    if(!fbUser) return;
    const sub = onSnapshot(query(col('contabilidad_cuentas'),orderBy('codigo','asc')),s=>setPlanCuentas(s.docs.map(d=>d.data())));
    return ()=>sub();
  },[fbUser]);

  const sections={
    plan_cuentas:<PlanCuentas planCuentas={planCuentas}/>,
    asientos: <div className="p-6 bg-white rounded-3xl border border-gray-100 text-center"><p className="text-gray-500 font-bold text-xs uppercase">Módulo de Asientos en Desarrollo</p></div>,
    mayor: <div className="p-6 bg-white rounded-3xl border border-gray-100 text-center"><p className="text-gray-500 font-bold text-xs uppercase">Libro Mayor en Desarrollo</p></div>,
    balances: <div className="p-6 bg-white rounded-3xl border border-gray-100 text-center"><p className="text-gray-500 font-bold text-xs uppercase">Balances en Desarrollo</p></div>,
  };

  const groups=[...new Set(NAV_CONTAB.map(n=>n.group))];
  const curNav=NAV_CONTAB.find(n=>n.id===sec);

  return (
    <div className="flex h-screen overflow-hidden bg-white w-full">
      <aside className="w-56 min-w-[224px] bg-black flex flex-col h-screen overflow-y-auto flex-shrink-0">
        <div className="px-5 py-6 border-b border-white/10 flex-shrink-0"><p className="font-black text-sm text-[#f97316] leading-tight">Servicios Jiret G&amp;B, C.A.</p><p className="text-[9px] text-gray-400 uppercase tracking-widest mt-1">Supply ERP · Contabilidad</p></div>
        <nav className="flex-1 py-3">
          {groups.map(group=>(
            <div key={group}>
              <p className="px-5 pt-4 pb-1.5 text-[8px] font-black uppercase tracking-[2px] text-gray-500">{group}</p>
              {NAV_CONTAB.filter(n=>n.group===group).map(({id,label,icon:Icon})=>(
                <button key={id} onClick={()=>setSec(id)} className={`w-full flex items-center gap-2.5 px-4 py-2.5 mx-2 rounded-xl text-left transition-all text-xs font-black uppercase tracking-wide mb-0.5 ${sec===id?'bg-[#f97316]/20 text-[#f97316]':'text-gray-400 hover:bg-white/5 hover:text-white'}`} style={{width:'calc(100% - 16px)'}}>
                  <Icon size={14} className="flex-shrink-0"/><span className="truncate">{label}</span>
                </button>
              ))}
            </div>
          ))}
        </nav>
      </aside>
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="bg-white border-b border-gray-100 px-6 h-14 flex items-center justify-between gap-4 flex-shrink-0 shadow-sm">
          <div><h1 className="font-black text-black text-sm uppercase tracking-wide">{curNav?.label}</h1><p className="text-[9px] text-gray-400 font-medium uppercase tracking-widest">Contabilidad <ChevronRight size={8} className="inline"/> {curNav?.group}</p></div>
        </header>
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50">{sections[sec]}</main>
      </div>
    </div>
  );
}

// ============================================================================
// PANEL DE CONTROL PRINCIPAL (HOME)
// ============================================================================
function MainDashboard({ onSelectModule }) {
  const modAdmin = [
    { id: 'banco', name: 'Banco y Tesorería', icon: Building2, color: 'bg-black', desc: 'Gestión de cuentas, liquidez y conciliación' },
    { id: 'facturacion', name: 'Facturación', icon: Receipt, color: 'bg-black', desc: 'Emisión de facturas y cuentas por cobrar' },
    { id: 'inventario', name: 'Inventario / Prod.', icon: Package, color: 'bg-black', desc: 'Control de stock (KG), formulación y OPs' },
    { id: 'compras', name: 'Compras', icon: ShoppingCart, color: 'bg-black', desc: 'Proveedores y cuentas por pagar' },
    { id: 'nomina', name: 'Nómina', icon: Users, color: 'bg-black', desc: 'Personal, viáticos y comisiones' }
  ];

  const modCont = [
    { id: 'contabilidad', name: 'Contabilidad General', icon: Briefcase, color: 'bg-[#f97316]', desc: 'Plan de cuentas (PUC), asientos y balances' },
    { id: 'impuestos', name: 'Gestión Fiscal', icon: Calculator, color: 'bg-[#ea580c]', desc: 'Retenciones de IVA, ISLR y libros' },
    { id: 'nacionalizacion', name: 'Costos / Import.', icon: Globe, color: 'bg-[#c2410c]', desc: 'Estructuras de costos de nacionalización' }
  ];

  const renderMod = (mod) => {
    const Icon = mod.icon;
    return (
      <button key={mod.id} onClick={() => onSelectModule(mod.id)} className="bg-white rounded-[2rem] p-6 text-left border-2 border-transparent hover:border-[#f97316] hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group flex flex-col h-full shadow-sm">
        <div className={`${mod.color} w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-md`}><Icon size={28} className="text-white" /></div>
        <h2 className="text-black font-black text-sm uppercase tracking-wide mb-2 leading-tight">{mod.name}</h2>
        <p className="text-gray-500 text-[10px] font-medium leading-relaxed flex-1">{mod.desc}</p>
        <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-4">
          <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 group-hover:text-[#f97316] transition-colors">Ingresar</span>
          <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-orange-50 transition-colors"><ChevronRight size={14} className="text-gray-400 group-hover:text-[#f97316]" /></div>
        </div>
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-black p-6 md:p-10 flex flex-col">
      <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col">
        <header className="mb-10 text-center md:text-left border-b border-gray-800 pb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
              <Blocks className="text-[#f97316]" size={32} />
              <h1 className="text-3xl font-black text-white uppercase tracking-widest">Supply ERP</h1>
            </div>
            <p className="text-gray-400 text-xs font-black uppercase tracking-[0.2em] ml-1">Servicios Jiret G&B, C.A.</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl px-5 py-3 inline-flex flex-col items-center md:items-end">
            <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Usuario Activo</span>
            <span className="text-xs text-[#f97316] font-black">Admin / Contador</span>
          </div>
        </header>

        <div className="mb-10">
          <h3 className="text-white font-black text-xs uppercase tracking-[0.2em] mb-6 flex items-center gap-3"><span className="w-8 h-1 bg-white rounded-full"/>Área Administrativa y Operativa</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-5">{modAdmin.map(renderMod)}</div>
        </div>
        
        <div>
          <h3 className="text-white font-black text-xs uppercase tracking-[0.2em] mb-6 flex items-center gap-3"><span className="w-8 h-1 bg-[#f97316] rounded-full"/>Área Contable y Financiera</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-5">{modCont.map(renderMod)}</div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [activeModule, setActiveModule] = useState('home');
  const [fbUser, setFbUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{signInAnonymously(auth).catch(console.error); const u=onAuthStateChanged(auth,user=>{setFbUser(user); if(user) setLoading(false);}); return ()=>u();},[]);

  if(loading) return <div className="min-h-screen flex items-center justify-center bg-black"><div className="text-center"><div className="w-12 h-12 border-4 border-[#f97316] border-t-transparent rounded-full animate-spin mx-auto mb-4"/><p className="text-[#f97316] font-black text-xs uppercase tracking-widest">Iniciando Core ERP...</p></div></div>;

  return (
    <ErrorBoundary>
      {activeModule === 'home' && <MainDashboard onSelectModule={setActiveModule} />}
      
      {activeModule === 'banco' && (
        <div className="relative h-screen flex flex-col bg-gray-50">
          <div className="absolute top-3 right-6 z-50">
            <button onClick={() => setActiveModule('home')} className="bg-black text-white px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#f97316] hover:text-white transition-colors flex items-center gap-2 shadow-lg"><ArrowLeft size={14} /> Panel Principal</button>
          </div>
          <BancoApp fbUser={fbUser} />
        </div>
      )}

      {activeModule === 'contabilidad' && (
        <div className="relative h-screen flex flex-col bg-gray-50">
          <div className="absolute top-3 right-6 z-50">
            <button onClick={() => setActiveModule('home')} className="bg-black text-white px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#f97316] hover:text-white transition-colors flex items-center gap-2 shadow-lg"><ArrowLeft size={14} /> Panel Principal</button>
          </div>
          <ContabilidadApp fbUser={fbUser} />
        </div>
      )}

      {activeModule !== 'home' && activeModule !== 'banco' && activeModule !== 'contabilidad' && (
        <div className="min-h-screen flex flex-col items-center justify-center bg-black p-6">
          <div className="bg-white p-8 rounded-3xl shadow-2xl text-center border-t-4 border-[#f97316] max-w-md w-full">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6"><Blocks size={32} className="text-gray-400" /></div>
            <h2 className="text-xl font-black text-black uppercase mb-2">Módulo en Desarrollo</h2>
            <p className="text-gray-500 text-xs font-medium mb-6">El entorno de <span className="font-black text-[#f97316] uppercase">{activeModule}</span> está en fase de codificación.</p>
            <button onClick={() => setActiveModule('home')} className="bg-black w-full text-white px-6 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-900 transition-colors flex justify-center items-center gap-2"><ArrowLeft size={14} /> Volver al Supply ERP</button>
          </div>
        </div>
      )}
    </ErrorBoundary>
  );
}

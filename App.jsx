import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, Building2, TrendingUp, List, BookOpen,
  ArrowLeftRight, Wallet, ArrowRightLeft, Scale, Calculator,
  BarChart3, Plus, X, Search, ChevronRight, AlertTriangle,
  CheckCircle, Clock, DollarSign, Download, Trash2,
  Banknote, PiggyBank, FileText, LineChart, Landmark,
  TrendingDown
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0d1b2e] p-6">
        <AlertTriangle size={56} className="text-[#e8b84b] mb-4" />
        <h2 className="text-xl font-black text-white uppercase mb-2">Error del Sistema</h2>
        <p className="text-gray-400 text-sm mb-6 text-center max-w-sm">{this.state.errorMsg}</p>
        <button onClick={() => window.location.reload()} className="bg-[#c8972a] text-[#0d1b2e] font-black px-8 py-3 rounded-2xl uppercase tracking-widest text-xs">Recargar</button>
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
  const s={green:'bg-emerald-100 text-emerald-700',red:'bg-red-100 text-red-600',gold:'bg-amber-50 text-amber-700',blue:'bg-blue-100 text-blue-700',gray:'bg-gray-100 text-gray-500'};
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide ${s[v]||s.gray}`}>{children}</span>;
};
const Pill = ({children, usd}) => <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase ${usd?'bg-blue-50 text-blue-700':'bg-amber-50 text-amber-700'}`}>{children}</span>;
const KPI = ({label,value,sub,accent='green',Icon}) => {
  const a={green:'border-emerald-500',gold:'border-[#c8972a]',blue:'border-blue-500',red:'border-red-500'};
  return (
    <div className={`bg-white rounded-2xl border-2 border-gray-100 border-t-4 ${a[accent]} p-5 shadow-sm`}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{label}</p>
        {Icon && <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center"><Icon size={15} className="text-gray-400"/></div>}
      </div>
      <p className="font-black text-2xl text-[#0d1b2e] font-mono">{value}</p>
      {sub && <p className="text-[10px] text-gray-400 mt-1.5 font-medium">{sub}</p>}
    </div>
  );
};
const Card = ({title,subtitle,action,children,noPad}) => (
  <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden mb-5">
    {(title||action) && <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-3">
      <div>{title && <h3 className="font-black text-[#0d1b2e] text-sm uppercase tracking-wide">{title}</h3>}{subtitle && <p className="text-[10px] text-gray-400 mt-0.5 font-medium">{subtitle}</p>}</div>
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
          <div className="w-full rounded-t-lg" style={{height:`${Math.max((d.value/max)*(height-24),4)}px`,background:d.color||'#0d1b2e'}}/>
          <span className="text-[9px] font-black text-gray-400 uppercase truncate w-full text-center">{d.label}</span>
        </div>
      ))}
    </div>
  );
};
const LSvg = ({data=[],color='#c8972a',height=100}) => {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{background:'rgba(13,27,46,.7)'}} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className={`bg-white rounded-3xl w-full ${wide?'max-w-xl':'max-w-lg'} max-h-[90vh] flex flex-col shadow-2xl`}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 flex-shrink-0">
          <h2 className="font-black text-[#0d1b2e] uppercase tracking-wide text-sm">{title}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200"><X size={14} className="text-gray-500"/></button>
        </div>
        <div className="overflow-y-auto flex-1 p-6">{children}</div>
        {footer && <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 flex-shrink-0">{footer}</div>}
      </div>
    </div>
  );
};
const FG = ({label,children,full}) => <div className={full?'col-span-2':''}><label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5">{label}</label>{children}</div>;
const inp = "w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-xs font-bold outline-none focus:border-[#c8972a] transition-colors bg-white text-[#0d1b2e]";
const Bp = ({onClick,children,sm}) => <button onClick={onClick} className={`bg-[#0d1b2e] text-white font-black uppercase tracking-widest ${sm?'text-[9px] px-3 py-2':'text-[10px] px-5 py-2.5'} rounded-xl hover:bg-[#1a2f52] transition-colors flex items-center gap-1.5`}>{children}</button>;
const Bg = ({onClick,children,sm}) => <button onClick={onClick} className={`bg-[#c8972a] text-[#0d1b2e] font-black uppercase tracking-widest ${sm?'text-[9px] px-3 py-2':'text-[10px] px-5 py-2.5'} rounded-xl hover:bg-[#e8b84b] transition-colors flex items-center gap-1.5`}>{children}</button>;
const Bo = ({onClick,children,sm}) => <button onClick={onClick} className={`border-2 border-gray-200 bg-white text-gray-600 font-black uppercase tracking-widest ${sm?'text-[9px] px-3 py-2':'text-[10px] px-5 py-2.5'} rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-1.5`}>{children}</button>;
const Th = ({children,right}) => <th className={`px-4 py-3 text-[9px] font-black uppercase tracking-widest text-gray-400 border-b-2 border-gray-100 bg-gray-50 ${right?'text-right':'text-left'} whitespace-nowrap`}>{children}</th>;
const Td = ({children,right,mono,className=''}) => <td className={`px-4 py-3 text-xs border-b border-gray-50 ${right?'text-right':''} ${mono?'font-mono':'font-medium'} ${className}`}>{children}</td>;

const NAV=[
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
  const barData=[{label:'Ingresos',value:ing,color:'#1a7d5a'},{label:'Egresos',value:egr,color:'#c0392b'},{label:'Vales',value:tvales,color:'#c8972a'},{label:'Caja',value:Number(caja),color:'#0d1b2e'}];
  const ds=cuentas.slice(0,4).map((c,i)=>({value:Number(c.saldo)*(c.moneda==='USD'?th:1),color:['#0d1b2e','#c8972a','#1a7d5a','#1a5fa8'][i%4]}));
  return (
    <div>
      <div className="bg-[#0d1b2e] rounded-3xl p-6 mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div><p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Posición Neta de Liquidez</p><p className="font-black text-3xl text-[#e8b84b] font-mono">Bs. {fmt(posicion)}</p><p className="text-[10px] text-gray-500 mt-1">Bancos + Caja − Vales Pendientes</p></div>
        <div className="text-right"><p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Tasa BCV Hoy</p><p className="font-black text-2xl text-[#e8b84b] font-mono">{th} Bs./$</p><p className="text-[10px] text-gray-500 mt-1">≡ ${fmt(posicion/th)} USD</p></div>
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
          <Card title="Distribución"><div className="flex justify-center mb-4"><Donut segs={ds} size={130}/></div><div className="space-y-2">{cuentas.slice(0,4).map((c,i)=><div key={c.id} className="flex items-center justify-between text-[10px]"><span className="flex items-center gap-1.5 font-black text-gray-500 uppercase"><span className="w-2 h-2 rounded-sm" style={{background:['#0d1b2e','#c8972a','#1a7d5a','#1a5fa8'][i%4]}}/>{c.banco}</span><span className="font-mono font-black text-[#0d1b2e]">{c.moneda==='USD'?'$':'Bs.'}{fmt(c.saldo)}</span></div>)}</div></Card>
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-5">
        <Card title="Últimos Movimientos">
          <table className="w-full"><thead><tr><Th>Fecha</Th><Th>Concepto</Th><Th right>Monto</Th></tr></thead>
          <tbody>{recent.length===0&&<tr><td colSpan={3} className="text-center text-xs text-gray-400 py-8">Sin movimientos</td></tr>}{recent.map(m=><tr key={m.id} className="hover:bg-gray-50"><Td>{dd(m.fecha)}</Td><Td className="max-w-[130px] truncate">{m.concepto}</Td><Td right mono className={m.tipo==='ingreso'?'text-emerald-600':'text-red-500'}>{m.tipo==='ingreso'?'+':'−'}{m.moneda==='USD'?'$':'Bs.'}{fmt(m.monto)}</Td></tr>)}</tbody></table>
        </Card>
        <Card title="Vales en Tránsito" action={<Badge v="red">{pend.length} pendientes</Badge>}>
          {pend.length===0&&<p className="text-xs text-gray-400 text-center py-8">Sin vales pendientes</p>}
          {pend.map(v=><div key={v.id} className="flex items-start justify-between py-3 border-b border-gray-50 last:border-0"><div><p className="text-xs font-black text-[#0d1b2e]">{v.num} — {v.beneficiario}</p><p className="text-[10px] text-gray-400 mt-0.5">{v.concepto}</p></div><span className="font-mono font-black text-xs text-red-500">Bs.{fmt(v.monto)}</span></div>)}
        </Card>
      </div>
    </div>
  );
}

function Cuentas({cuentas}) {
  const [modal,setModal]=useState(false);
  const [form,setForm]=useState({banco:'',num:'',tipo:'Corriente',moneda:'Bs.',puc:'',saldo:''});
  const [busy,setBusy]=useState(false);
  const save=async()=>{if(!form.banco||!form.num) return alert('Banco y número requeridos'); setBusy(true); try{const id=gid(); await setDoc(dref('banco_cuentas',id),{...form,saldo:Number(form.saldo)||0,id,ts:serverTimestamp()}); setModal(false); setForm({banco:'',num:'',tipo:'Corriente',moneda:'Bs.',puc:'',saldo:''});}finally{setBusy(false);}};
  const del=async(id)=>{if(window.confirm('¿Eliminar cuenta?')) await deleteDoc(dref('banco_cuentas',id));};
  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {cuentas.map((c,i)=><div key={c.id} className="bg-white rounded-2xl border-2 border-gray-100 p-4 hover:border-[#c8972a] hover:shadow-md transition-all group cursor-pointer"><p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">{c.banco}</p><p className="text-[10px] font-mono text-gray-400 mb-2 truncate">{c.num}</p><p className="font-black text-xl font-mono text-[#0d1b2e]">{c.moneda==='USD'?'$':'Bs.'}{fmt(c.saldo)}</p><div className="flex items-center justify-between mt-2"><Pill usd={c.moneda==='USD'}>{c.moneda}</Pill><button onClick={()=>del(c.id)} className="opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={12} className="text-red-400"/></button></div></div>)}
        <button onClick={()=>setModal(true)} className="border-2 border-dashed border-gray-200 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 hover:border-[#c8972a] hover:bg-[#fdf3dc] transition-all min-h-[100px]"><Plus size={20} className="text-gray-300"/><span className="text-[9px] font-black uppercase text-gray-300">Nueva Cuenta</span></button>
      </div>
      <Card title="Registro de Cuentas" action={<Bp onClick={()=>setModal(true)} sm><Plus size={12}/>Nueva</Bp>}>
        <div className="overflow-x-auto"><table className="w-full"><thead><tr><Th>Banco</Th><Th>Número</Th><Th>Tipo</Th><Th>Moneda</Th><Th>PUC</Th><Th right>Saldo</Th><Th></Th></tr></thead>
        <tbody>{cuentas.length===0&&<tr><td colSpan={7} className="text-center text-xs text-gray-400 py-8">Sin cuentas registradas</td></tr>}{cuentas.map(c=><tr key={c.id} className="hover:bg-gray-50"><Td><span className="font-black text-[#0d1b2e]">{c.banco}</span></Td><Td mono>{c.num}</Td><Td>{c.tipo}</Td><Td><Pill usd={c.moneda==='USD'}>{c.moneda}</Pill></Td><Td mono>{c.puc}</Td><Td right mono>{c.moneda==='USD'?'$':'Bs.'}{fmt(c.saldo)}</Td><Td><button onClick={()=>del(c.id)} className="p-1.5 bg-red-50 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition-all"><Trash2 size={11}/></button></Td></tr>)}</tbody></table></div>
      </Card>
      <Modal open={modal} onClose={()=>setModal(false)} title="Nueva Cuenta Bancaria" footer={<><Bo onClick={()=>setModal(false)}>Cancelar</Bo><Bg onClick={save}>{busy?'Guardando…':'Guardar'}</Bg></>}>
        <div className="grid grid-cols-2 gap-4">
          <FG label="Banco"><input className={inp} value={form.banco} onChange={e=>setForm({...form,banco:e.target.value})} placeholder="Banesco"/></FG>
          <FG label="Tipo"><select className={inp} value={form.tipo} onChange={e=>setForm({...form,tipo:e.target.value})}><option>Corriente</option><option>Ahorro</option><option>Internacional</option><option>Caja</option></select></FG>
          <FG label="Número de Cuenta" full><input className={inp} value={form.num} onChange={e=>setForm({...form,num:e.target.value})} placeholder="0134-xxxx-xx-xxxxxxxxxx"/></FG>
          <FG label="Moneda"><select className={inp} value={form.moneda} onChange={e=>setForm({...form,moneda:e.target.value})}><option>Bs.</option><option>USD</option><option>EUR</option></select></FG>
          <FG label="Cuenta PUC"><input className={inp} value={form.puc} onChange={e=>setForm({...form,puc:e.target.value})} placeholder="1.1.01.01.001"/></FG>
          <FG label="Saldo Inicial"><input type="number" className={inp} value={form.saldo} onChange={e=>setForm({...form,saldo:e.target.value})} placeholder="0.00"/></FG>
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
          <tbody>{tasas.length===0&&<tr><td colSpan={5} className="text-center text-xs text-gray-400 py-8">Sin tasas</td></tr>}{tasas.map(t=><tr key={t.id} className="hover:bg-gray-50"><Td>{dd(t.fecha)}</Td><Td><Pill usd>{t.moneda}</Pill></Td><Td right mono className="font-black text-[#0d1b2e]">{t.tasa}</Td><Td right mono className="text-gray-400">{t.tasaRef||'—'}</Td><Td><Badge v="blue">{t.fuente}</Badge></Td></tr>)}</tbody></table></div>
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

function Tipos({tipos}) {
  const [modal,setModal]=useState(false); const [filtro,setFiltro]=useState('todos');
  const [form,setForm]=useState({cod:'',desc:'',nat:'ingreso',retIVA:'No',retISLR:'No',puc:''}); const [busy,setBusy]=useState(false);
  const save=async()=>{if(!form.cod||!form.desc) return alert('Código y descripción requeridos'); setBusy(true); try{const id=gid(); await setDoc(dref('banco_tipos',id),{...form,id,ts:serverTimestamp()}); setModal(false); setForm({cod:'',desc:'',nat:'ingreso',retIVA:'No',retISLR:'No',puc:''});}finally{setBusy(false);}};
  const fil=filtro==='todos'?tipos:tipos.filter(t=>t.nat===filtro);
  return (
    <div>
      <div className="flex gap-2 mb-5">{['todos','ingreso','egreso'].map(t=><button key={t} onClick={()=>setFiltro(t)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors ${filtro===t?'bg-[#0d1b2e] text-white':'bg-white border-2 border-gray-200 text-gray-500 hover:border-[#0d1b2e]'}`}>{t}</button>)}</div>
      <Card title="Catálogo de Conceptos" action={<Bp onClick={()=>setModal(true)} sm><Plus size={12}/>Nuevo Tipo</Bp>}>
        <div className="overflow-x-auto"><table className="w-full"><thead><tr><Th>Código</Th><Th>Descripción</Th><Th>Naturaleza</Th><Th>Ret. IVA</Th><Th>Ret. ISLR</Th><Th>PUC</Th></tr></thead>
        <tbody>{fil.length===0&&<tr><td colSpan={6} className="text-center text-xs text-gray-400 py-8">Sin tipos registrados</td></tr>}{fil.map(t=><tr key={t.id} className="hover:bg-gray-50"><Td mono className="font-black text-[#0d1b2e]">{t.cod}</Td><Td>{t.desc}</Td><Td><Badge v={t.nat==='ingreso'?'green':'red'}>{t.nat}</Badge></Td><Td>{t.retIVA==='Sí'?<Badge v="gold">Sí</Badge>:'—'}</Td><Td>{t.retISLR==='Sí'?<Badge v="gold">Sí</Badge>:'—'}</Td><Td mono>{t.puc}</Td></tr>)}</tbody></table></div>
      </Card>
      <Modal open={modal} onClose={()=>setModal(false)} title="Nuevo Tipo de Movimiento" footer={<><Bo onClick={()=>setModal(false)}>Cancelar</Bo><Bp onClick={save}>{busy?'Guardando…':'Crear'}</Bp></>}>
        <div className="grid grid-cols-2 gap-4">
          <FG label="Código"><input className={inp} value={form.cod} onChange={e=>setForm({...form,cod:e.target.value})} placeholder="ING-001"/></FG>
          <FG label="Naturaleza"><select className={inp} value={form.nat} onChange={e=>setForm({...form,nat:e.target.value})}><option value="ingreso">Ingreso</option><option value="egreso">Egreso</option></select></FG>
          <FG label="Descripción" full><input className={inp} value={form.desc} onChange={e=>setForm({...form,desc:e.target.value})} placeholder="Cobro de facturas..."/></FG>
          <FG label="Ret. IVA"><select className={inp} value={form.retIVA} onChange={e=>setForm({...form,retIVA:e.target.value})}><option>No</option><option>Sí</option></select></FG>
          <FG label="Ret. ISLR"><select className={inp} value={form.retISLR} onChange={e=>setForm({...form,retISLR:e.target.value})}><option>No</option><option>Sí</option></select></FG>
          <FG label="Cuenta PUC" full><input className={inp} value={form.puc} onChange={e=>setForm({...form,puc:e.target.value})} placeholder="4.1.01.001"/></FG>
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
      <tbody>{chequeras.length===0&&<tr><td colSpan={7} className="text-center text-xs text-gray-400 py-8">Sin chequeras</td></tr>}{chequeras.map(c=>{const tot=c.fin-c.ini+1; const pct=Math.round((c.usados/tot)*100); const est=pct>=90?'Por agotar':pct===0?'Nueva':'Activa'; return <tr key={c.id} className="hover:bg-gray-50"><Td><span className="font-black text-[#0d1b2e]">{c.banco}</span></Td><Td mono>{c.serie}</Td><Td right mono>{String(c.ini).padStart(3,'0')}</Td><Td right mono>{String(c.fin).padStart(3,'0')}</Td><Td right mono>{String(c.actual).padStart(3,'0')}</Td><Td right><span className="font-mono font-black">{c.usados}</span><span className="text-gray-300 text-[10px]"> /{tot}</span></Td><Td><Badge v={est==='Activa'?'green':est==='Nueva'?'blue':'gold'}>{est}</Badge></Td></tr>;})} </tbody></table></div>
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
        <div className="flex items-center gap-2 border-2 border-gray-200 rounded-xl px-3 py-2 bg-white flex-1 max-w-sm"><Search size={14} className="text-gray-400 flex-shrink-0"/><input className="outline-none text-xs font-medium w-full text-[#0d1b2e] bg-transparent" placeholder="Buscar..." value={busca} onChange={e=>setBusca(e.target.value)}/></div>
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
        {form.monto&&form.moneda==='USD'&&<div className="mt-4 bg-[#fdf3dc] rounded-xl p-3 text-xs font-black text-[#7a5a00]">≡ Bs. {fmt(Number(form.monto)*Number(form.tasa))} a tasa {form.tasa}</div>}
      </Modal>
    </div>
  );
}

function Vales({vales,cuentas,tasas}) {
  const [modal,setModal]=useState(false); const [liq,setLiq]=useState(null); const [mj,setMj]=useState('');
  const [form,setForm]=useState({fecha:today(),tipo:'egreso',beneficiario:'',concepto:'',monto:'',fechaLim:''}); const [busy,setBusy]=useState(false);
  const pend=vales.filter(v=>v.estado==='Pendiente'); const tv=pend.reduce((a,v)=>a+Number(v.monto),0);
  const caja=cuentas.find(c=>c.tipo==='Caja');
  const save=async()=>{if(!form.beneficiario||!form.monto) return alert('Beneficiario y monto requeridos'); setBusy(true); try{const id=gid(); const num=`V-${String(vales.length+1).padStart(4,'0')}`; await setDoc(dref('banco_vales',id),{...form,monto:Number(form.monto),num,id,estado:'Pendiente',ts:serverTimestamp()}); setModal(false); setForm({fecha:today(),tipo:'egreso',beneficiario:'',concepto:'',monto:'',fechaLim:''});}finally{setBusy(false);}};
  const liquidar=async()=>{if(!liq) return; setBusy(true); try{const j=Number(mj)||Number(liq.monto); const dev=Number(liq.monto)-j; await updateDoc(dref('banco_vales',liq.id),{estado:'Liquidado',montoJust:j,devolucion:dev,fechaLiq:today()}); if(caja&&dev>0) await updateDoc(dref('banco_cuentas',caja.id),{saldo:Number(caja.saldo)+dev}); setLiq(null); setMj('');}finally{setBusy(false);}};
  return (
    <div>
      <div className="grid grid-cols-3 gap-4 mb-6"><KPI label="Vales Emitidos" value={vales.length} sub="Total del período" accent="blue" Icon={FileText}/><KPI label="Pendientes" value={pend.length} sub={`Bs. ${fmt(tv)}`} accent="red" Icon={Clock}/><KPI label="Liquidados" value={vales.length-pend.length} sub="Justificados" accent="green" Icon={CheckCircle}/></div>
      <div className="grid md:grid-cols-3 gap-5">
        <div className="md:col-span-2">
          <Card title="Vales Emitidos" action={<Bo onClick={()=>setModal(true)} sm><Plus size={12}/>Emitir Vale</Bo>}>
            <div className="overflow-x-auto"><table className="w-full"><thead><tr><Th>N° Vale</Th><Th>Fecha</Th><Th>Beneficiario</Th><Th>Concepto</Th><Th right>Monto</Th><Th>Estado</Th><Th></Th></tr></thead>
            <tbody>{vales.length===0&&<tr><td colSpan={7} className="text-center text-xs text-gray-400 py-8">Sin vales</td></tr>}{vales.map(v=><tr key={v.id} className="hover:bg-gray-50"><Td mono className="font-black text-[#0d1b2e]">{v.num}</Td><Td>{dd(v.fecha)}</Td><Td>{v.beneficiario}</Td><Td>{v.concepto}</Td><Td right mono className="text-red-500">Bs.{fmt(v.monto)}</Td><Td><Badge v={v.estado==='Pendiente'?'gold':'green'}>{v.estado}</Badge></Td><Td>{v.estado==='Pendiente'&&<Bg onClick={()=>{setLiq(v);setMj(v.monto);}} sm>Liquidar</Bg>}</Td></tr>)}</tbody></table></div>
          </Card>
        </div>
        <div>
          <div className="bg-[#0d1b2e] rounded-3xl p-5 mb-4"><p className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-1">Saldo Caja Principal</p><p className="font-black text-2xl text-[#e8b84b] font-mono mt-2">Bs. {fmt(caja?.saldo||0)}</p><div className="border-t border-gray-700 mt-4 pt-4 space-y-2"><div className="flex justify-between text-[10px]"><span className="text-gray-500">Vales pendientes</span><span className="font-mono font-black text-red-400">-Bs.{fmt(tv)}</span></div><div className="flex justify-between text-[10px]"><span className="text-gray-500">Posición neta</span><span className="font-mono font-black text-[#e8b84b]">Bs.{fmt((caja?.saldo||0)-tv)}</span></div></div></div>
          <Card title="Pendientes"><div>{pend.length===0&&<p className="text-xs text-gray-400 text-center py-4">Sin vales pendientes</p>}{pend.map(v=><div key={v.id} className="flex justify-between items-center py-2.5 border-b border-gray-50 last:border-0"><div><p className="text-xs font-black text-[#0d1b2e]">{v.num}</p><p className="text-[10px] text-gray-400">{v.beneficiario}</p></div><span className="font-mono text-xs font-black text-red-500">Bs.{fmt(v.monto)}</span></div>)}</div></Card>
        </div>
      </div>
      <Modal open={modal} onClose={()=>setModal(false)} title="Emitir Vale de Caja" footer={<><Bo onClick={()=>setModal(false)}>Cancelar</Bo><Bg onClick={save}>{busy?'Guardando…':'Emitir Vale'}</Bg></>}>
        <div className="grid grid-cols-2 gap-4">
          <FG label="Fecha"><input type="date" className={inp} value={form.fecha} onChange={e=>setForm({...form,fecha:e.target.value})}/></FG>
          <FG label="Tipo"><select className={inp} value={form.tipo} onChange={e=>setForm({...form,tipo:e.target.value})}><option value="egreso">Egreso (Salida)</option><option value="ingreso">Ingreso (Entrada)</option></select></FG>
          <FG label="Beneficiario" full><input className={inp} value={form.beneficiario} onChange={e=>setForm({...form,beneficiario:e.target.value})} placeholder="Nombre del empleado..."/></FG>
          <FG label="Concepto" full><select className={inp} value={form.concepto} onChange={e=>setForm({...form,concepto:e.target.value})}><option value="">Seleccionar...</option><option>Anticipo de viáticos</option><option>Solicitud de efectivo</option><option>Anticipo de nómina</option><option>Compra menor</option></select></FG>
          <FG label="Monto Bs."><input type="number" className={inp} value={form.monto} onChange={e=>setForm({...form,monto:e.target.value})} placeholder="0.00"/></FG>
          <FG label="Fecha Límite"><input type="date" className={inp} value={form.fechaLim} onChange={e=>setForm({...form,fechaLim:e.target.value})}/></FG>
        </div>
        <div className="mt-4 bg-[#fdf3dc] rounded-xl p-3 text-[10px] font-black text-[#7a5a00]">⚠ Queda en estado Pendiente hasta su liquidación.</div>
      </Modal>
      <Modal open={!!liq} onClose={()=>setLiq(null)} title="Liquidar Vale" footer={<><Bo onClick={()=>setLiq(null)}>Cancelar</Bo><Bg onClick={liquidar}>{busy?'Procesando…':'Liquidar y Ejecutar'}</Bg></>}>
        {liq&&<div className="space-y-4"><div className="bg-[#0d1b2e] rounded-2xl p-4 space-y-2">{[['Vale',liq.num],['Beneficiario',liq.beneficiario],['Monto emitido',`Bs. ${fmt(liq.monto)}`]].map(([k,v])=><div key={k} className="flex justify-between text-xs"><span className="text-gray-400">{k}</span><span className="font-black text-white">{v}</span></div>)}</div><FG label="Monto Justificado"><input type="number" className={inp} value={mj} onChange={e=>setMj(e.target.value)} placeholder={liq.monto}/></FG>{mj&&Number(mj)<Number(liq.monto)&&<div className="bg-emerald-50 rounded-xl p-3 text-xs font-black text-emerald-700">↩ Devolución a Caja: Bs. {fmt(Number(liq.monto)-Number(mj))}</div>}</div>}
      </Modal>
    </div>
  );
}

function Transferencias({transferencias,cuentas,tasas}) {
  const [modal,setModal]=useState(false);
  const [form,setForm]=useState({fecha:today(),origenId:'',destinoId:'',monto:'',tasa:tasas[0]?.tasa||'39.47',ref:''}); const [busy,setBusy]=useState(false);
  const save=async()=>{if(!form.origenId||!form.destinoId||!form.monto) return alert('Complete todos los campos'); if(form.origenId===form.destinoId) return alert('Origen y destino deben ser diferentes'); setBusy(true); try{const o=cuentas.find(c=>c.id===form.origenId); const d=cuentas.find(c=>c.id===form.destinoId); const mn=Number(form.monto); const id=gid(); const op=`TRF-${String(transferencias.length+1).padStart(4,'0')}`; await setDoc(dref('banco_transferencias',id),{...form,monto:mn,tasa:Number(form.tasa),op,origenBanco:o?.banco,destinoBanco:d?.banco,id,estado:'Ejecutada',ts:serverTimestamp()}); await updateDoc(dref('banco_cuentas',form.origenId),{saldo:Number(o.saldo)-mn}); await updateDoc(dref('banco_cuentas',form.destinoId),{saldo:Number(d.saldo)+mn}); setModal(false); setForm({fecha:today(),origenId:'',destinoId:'',monto:'',tasa:tasas[0]?.tasa||'39.47',ref:''});}finally{setBusy(false);}};
  return (
    <Card title="Transferencias entre Cuentas Propias" action={<Bg onClick={()=>setModal(true)}><Plus size={14}/>Nueva Transferencia</Bg>}>
      <div className="overflow-x-auto"><table className="w-full"><thead><tr><Th>Fecha</Th><Th>N° Op.</Th><Th>Origen</Th><Th>Destino</Th><Th right>Monto</Th><Th>Tasa</Th><Th>Estado</Th></tr></thead>
      <tbody>{transferencias.length===0&&<tr><td colSpan={7} className="text-center text-xs text-gray-400 py-8">Sin transferencias</td></tr>}{transferencias.map(t=><tr key={t.id} className="hover:bg-gray-50"><Td>{dd(t.fecha)}</Td><Td mono className="font-black">{t.op}</Td><Td>{t.origenBanco}</Td><Td>{t.destinoBanco}</Td><Td right mono>Bs.{fmt(t.monto)}</Td><Td mono>{t.tasa}</Td><Td><Badge v="green">{t.estado}</Badge></Td></tr>)}</tbody></table></div>
      <Modal open={modal} onClose={()=>setModal(false)} title="Nueva Transferencia" footer={<><Bo onClick={()=>setModal(false)}>Cancelar</Bo><Bg onClick={save}>{busy?'Ejecutando…':'Ejecutar'}</Bg></>}>
        <div className="grid grid-cols-2 gap-4">
          <FG label="Fecha"><input type="date" className={inp} value={form.fecha} onChange={e=>setForm({...form,fecha:e.target.value})}/></FG>
          <FG label="Tasa BCV"><input type="number" step="0.01" className={inp} value={form.tasa} onChange={e=>setForm({...form,tasa:e.target.value})}/></FG>
          <FG label="Cuenta Origen" full><select className={inp} value={form.origenId} onChange={e=>setForm({...form,origenId:e.target.value})}><option value="">Seleccionar...</option>{cuentas.map(c=><option key={c.id} value={c.id}>{c.banco} ({c.moneda}) — {c.moneda==='USD'?'$':'Bs.'}{fmt(c.saldo)}</option>)}</select></FG>
          <FG label="Cuenta Destino" full><select className={inp} value={form.destinoId} onChange={e=>setForm({...form,destinoId:e.target.value})}><option value="">Seleccionar...</option>{cuentas.filter(c=>c.id!==form.origenId).map(c=><option key={c.id} value={c.id}>{c.banco} ({c.moneda})</option>)}</select></FG>
          <FG label="Monto"><input type="number" className={inp} value={form.monto} onChange={e=>setForm({...form,monto:e.target.value})} placeholder="0.00"/></FG>
          <FG label="Referencia"><input className={inp} value={form.ref} onChange={e=>setForm({...form,ref:e.target.value})} placeholder="Nro. comprobante"/></FG>
        </div>
      </Modal>
    </Card>
  );
}

function Conciliacion({movimientos,cuentas}) {
  const [sel,setSel]=useState('');
  const mov=sel?movimientos.filter(m=>m.cuentaId===sel):movimientos;
  const conc=mov.filter(m=>m.conciliado); const pend=mov.filter(m=>!m.conciliado);
  const cruzar=async(m)=>await updateDoc(dref('banco_movimientos',m.id),{conciliado:true});
  return (
    <div className="grid md:grid-cols-3 gap-5">
      <div className="md:col-span-2">
        <Card title="Conciliación Bancaria" action={<select className={`${inp} w-44`} value={sel} onChange={e=>setSel(e.target.value)}><option value="">Todas las cuentas</option>{cuentas.map(c=><option key={c.id} value={c.id}>{c.banco}</option>)}</select>}>
          <div className={`flex items-center gap-2 p-3 rounded-xl mb-4 text-xs font-black ${pend.length===0?'bg-emerald-50 text-emerald-700':'bg-[#fdf3dc] text-[#7a5a00]'}`}>{pend.length===0?<CheckCircle size={14}/>:<Clock size={14}/>}{pend.length===0?`${conc.length} movimientos conciliados`:`${pend.length} movimientos pendientes de cruce`}</div>
          <div className="overflow-x-auto"><table className="w-full"><thead><tr><Th>Fecha</Th><Th>Concepto</Th><Th right>Monto</Th><Th>Estado</Th><Th></Th></tr></thead>
          <tbody>{mov.length===0&&<tr><td colSpan={5} className="text-center text-xs text-gray-400 py-8">Sin movimientos</td></tr>}{mov.map(m=><tr key={m.id} className="hover:bg-gray-50"><Td>{dd(m.fecha)}</Td><Td className="max-w-[180px] truncate">{m.concepto}</Td><Td right mono className={m.tipo==='ingreso'?'text-emerald-600':'text-red-500'}>{m.tipo==='ingreso'?'+':'−'}Bs.{fmt(m.equiv)}</Td><Td><Badge v={m.conciliado?'green':'gold'}>{m.conciliado?'Conciliado':'Pendiente'}</Badge></Td><Td>{!m.conciliado&&<button onClick={()=>cruzar(m)} className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-500 hover:text-white text-[10px] font-black px-2">✓ Cruzar</button>}</Td></tr>)}</tbody></table></div>
        </Card>
      </div>
      <div>
        <Card title="Resumen">
          {[['Total movimientos',mov.length],['Conciliados',conc.length],['Pendientes',pend.length]].map(([k,v])=><div key={k} className="flex justify-between items-center py-3 border-b border-gray-50 last:border-0"><span className="text-xs font-medium text-gray-500">{k}</span><span className="font-black text-[#0d1b2e] text-sm">{v}</span></div>)}
          <div className="mt-4"><div className="w-full bg-gray-100 rounded-full h-2 mb-1"><div className="bg-emerald-500 h-2 rounded-full" style={{width:`${mov.length?(conc.length/mov.length*100):0}%`}}/></div><p className="text-[10px] text-gray-400 font-black text-right">{mov.length?Math.round(conc.length/mov.length*100):0}% conciliado</p></div>
        </Card>
      </div>
    </div>
  );
}

function Arqueo({vales,cuentas}) {
  const DENOMS=[200,100,50,20,10,5,2,1]; const [pz,setPz]=useState({}); const [busy,setBusy]=useState(false);
  const caja=cuentas.find(c=>c.tipo==='Caja'); const pend=vales.filter(v=>v.estado==='Pendiente'); const tv=pend.reduce((a,v)=>a+Number(v.monto),0);
  const tot=DENOMS.reduce((a,d)=>a+d*(Number(pz[d])||0),0); const dif=tot-((caja?.saldo||0)-tv);
  const guardar=async()=>{setBusy(true); try{const id=gid(); await setDoc(dref('banco_arqueos',id),{id,fecha:today(),hora:new Date().toLocaleTimeString('es-VE'),piezas:pz,total:tot,saldoSistema:caja?.saldo||0,diferencia:dif,ts:serverTimestamp()}); alert('Arqueo guardado');}finally{setBusy(false);}};
  return (
    <div className="grid md:grid-cols-2 gap-5">
      <Card title="Conteo de Efectivo" action={<Bg onClick={guardar} sm>{busy?'Guardando…':'Guardar Arqueo'}</Bg>}>
        <table className="w-full mb-4"><thead><tr><Th>Denominación</Th><Th right>Piezas</Th><Th right>Subtotal</Th></tr></thead>
        <tbody>{DENOMS.map(d=><tr key={d} className="hover:bg-gray-50"><Td><span className="font-black text-[#0d1b2e]">Bs. {d}</span></Td><Td right><input type="number" min="0" value={pz[d]||''} onChange={e=>setPz({...pz,[d]:e.target.value})} className="w-20 border-2 border-gray-200 rounded-lg px-2 py-1 text-xs font-mono font-black text-right outline-none focus:border-[#c8972a]" placeholder="0"/></Td><Td right mono className="font-black text-[#0d1b2e]">Bs. {fmt(d*(Number(pz[d])||0))}</Td></tr>)}</tbody>
        <tfoot><tr className="bg-[#0d1b2e]"><td colSpan={2} className="px-4 py-3 text-xs font-black uppercase text-white">Total Contado</td><td className="px-4 py-3 text-right font-mono font-black text-[#e8b84b]">Bs. {fmt(tot)}</td></tr></tfoot></table>
      </Card>
      <div className="space-y-4">
        <div className="bg-[#0d1b2e] rounded-3xl p-5">
          <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-3">Comparación de Saldos</p>
          {[['Saldo Sistema',`Bs. ${fmt(caja?.saldo||0)}`,'text-white'],['Vales Pendientes',`- Bs. ${fmt(tv)}`,'text-red-400'],['Saldo Esperado',`Bs. ${fmt((caja?.saldo||0)-tv)}`,'text-[#e8b84b]'],['Total Arqueo',`Bs. ${fmt(tot)}`,'text-[#e8b84b]']].map(([k,v,c])=><div key={k} className="flex justify-between py-2 border-b border-gray-700 last:border-0"><span className="text-[10px] text-gray-400 font-medium">{k}</span><span className={`font-mono font-black text-xs ${c}`}>{v}</span></div>)}
          <div className={`mt-4 p-3 rounded-xl ${Math.abs(dif)<0.01?'bg-emerald-900':'bg-red-900'}`}><p className="text-[9px] font-black uppercase text-gray-400 mb-1">Diferencia</p><p className={`font-mono font-black text-xl ${Math.abs(dif)<0.01?'text-emerald-400':'text-red-400'}`}>{dif>=0?'+':''}Bs. {fmt(dif)}</p></div>
        </div>
        <Card title="Vales sin Justificar">{pend.length===0&&<p className="text-xs text-gray-400 text-center py-4">Sin vales pendientes</p>}{pend.map(v=><div key={v.id} className="flex justify-between items-center py-2.5 border-b border-gray-50 last:border-0"><div><p className="text-xs font-black text-[#0d1b2e]">{v.num} — {v.beneficiario}</p><p className="text-[10px] text-gray-400">{v.concepto}</p></div><span className="font-mono text-xs font-black text-red-500">Bs.{fmt(v.monto)}</span></div>)}</Card>
      </div>
    </div>
  );
}

function Reportes({movimientos,cuentas,vales,tasas}) {
  const [tab,setTab]=useState('flujo');
  const th=tasas[0]?.tasa||39.47;
  const ing=movimientos.filter(m=>m.tipo==='ingreso').reduce((a,m)=>a+Number(m.equiv||m.monto),0);
  const egr=movimientos.filter(m=>m.tipo==='egreso').reduce((a,m)=>a+Number(m.equiv||m.monto),0);
  const st=cuentas.reduce((a,c)=>a+Number(c.saldo)*(c.moneda==='USD'?th:1),0);
  return (
    <div>
      <div className="flex gap-2 mb-6 flex-wrap">{[['flujo','Flujo de Caja'],['libro','Libro Auxiliar'],['multimoneda','Multimoneda']].map(([k,l])=><button key={k} onClick={()=>setTab(k)} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors ${tab===k?'bg-[#0d1b2e] text-white':'bg-white border-2 border-gray-200 text-gray-500 hover:border-[#0d1b2e]'}`}>{l}</button>)}</div>
      {tab==='flujo'&&<div><div className="grid grid-cols-3 gap-4 mb-6"><KPI label="Total Ingresos" value={`Bs. ${fmt(ing)}`} accent="green" Icon={TrendingUp}/><KPI label="Total Egresos" value={`Bs. ${fmt(egr)}`} accent="red" Icon={TrendingDown}/><KPI label="Flujo Neto" value={`Bs. ${fmt(ing-egr)}`} accent={ing>=egr?'green':'red'} Icon={BarChart3}/></div><Card title="Distribución del Flujo"><BarChart data={[{label:'Ingresos',value:ing,color:'#1a7d5a'},{label:'Egresos',value:egr,color:'#c0392b'},{label:'Neto',value:ing-egr,color:'#0d1b2e'}]} height={160}/></Card></div>}
      {tab==='libro'&&<Card title="Libro Auxiliar de Bancos" action={<Bo sm onClick={()=>window.print()}><Download size={12}/>Exportar</Bo>}><div className="overflow-x-auto"><table className="w-full"><thead><tr><Th>Fecha</Th><Th>Concepto</Th><Th>Banco</Th><Th>Moneda</Th><Th right>Débito</Th><Th right>Crédito</Th><Th right>Equiv. Bs.</Th></tr></thead><tbody>{movimientos.length===0&&<tr><td colSpan={7} className="text-center text-xs text-gray-400 py-8">Sin movimientos</td></tr>}{[...movimientos].sort((a,b)=>(b.fecha||'')>(a.fecha||'')?1:-1).map(m=><tr key={m.id} className="hover:bg-gray-50"><Td>{dd(m.fecha)}</Td><Td className="max-w-[150px] truncate">{m.concepto}</Td><Td>{m.banco}</Td><Td><Pill usd={m.moneda==='USD'}>{m.moneda}</Pill></Td><Td right mono className="text-red-500">{m.tipo==='egreso'?fmt(m.monto):'—'}</Td><Td right mono className="text-emerald-600">{m.tipo==='ingreso'?fmt(m.monto):'—'}</Td><Td right mono className="font-black">Bs.{fmt(m.equiv)}</Td></tr>)}</tbody></table></div></Card>}
      {tab==='multimoneda'&&<div><div className="grid grid-cols-2 gap-4 mb-6"><KPI label="Posición Total (Bs.)" value={`Bs. ${fmt(st)}`} accent="gold" Icon={Landmark}/><KPI label="Posición Total (USD)" value={`$${fmt(st/th)}`} accent="blue" Icon={DollarSign}/></div><Card title="Saldos por Moneda"><div className="overflow-x-auto"><table className="w-full"><thead><tr><Th>Banco</Th><Th>Tipo</Th><Th>Moneda</Th><Th right>Saldo</Th><Th right>Tasa</Th><Th right>Equiv. Bs.</Th></tr></thead><tbody>{cuentas.map(c=><tr key={c.id} className="hover:bg-gray-50"><Td><span className="font-black text-[#0d1b2e]">{c.banco}</span></Td><Td>{c.tipo}</Td><Td><Pill usd={c.moneda==='USD'}>{c.moneda}</Pill></Td><Td right mono className="font-black">{c.moneda==='USD'?'$':'Bs.'}{fmt(c.saldo)}</Td><Td right mono>{c.moneda==='USD'?th:'1.00'}</Td><Td right mono className="font-black text-[#0d1b2e]">Bs.{fmt(Number(c.saldo)*(c.moneda==='USD'?th:1))}</Td></tr>)}</tbody><tfoot><tr className="bg-[#0d1b2e]"><td colSpan={5} className="px-4 py-3 text-xs font-black uppercase text-white">Total Consolidado</td><td className="px-4 py-3 text-right font-mono font-black text-[#e8b84b]">Bs.{fmt(st)}</td></tr></tfoot></table></div></Card></div>}
    </div>
  );
}

function BancoApp() {
  const [sec,setSec]=useState('dashboard'); const [fbUser,setFbUser]=useState(null);
  const [cuentas,setCuentas]=useState([]); const [tasas,setTasas]=useState([]);
  const [tipos,setTipos]=useState([]); const [chequeras,setChequeras]=useState([]);
  const [movimientos,setMovimientos]=useState([]); const [vales,setVales]=useState([]);
  const [transferencias,setTransferencias]=useState([]); const [loading,setLoading]=useState(true);

  useEffect(()=>{signInAnonymously(auth).catch(console.error); const u=onAuthStateChanged(auth,user=>{setFbUser(user); if(user) setLoading(false);}); return ()=>u();},[]);

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
    ];
    return ()=>subs.forEach(u=>u());
  },[fbUser]);

  const vp=vales.filter(v=>v.estado==='Pendiente').length;
  const sections={
    dashboard:<Dashboard movimientos={movimientos} vales={vales} cuentas={cuentas} tasas={tasas}/>,
    cuentas:<Cuentas cuentas={cuentas}/>, tasas:<Tasas tasas={tasas}/>, tipos:<Tipos tipos={tipos}/>,
    chequeras:<Chequeras chequeras={chequeras} cuentas={cuentas}/>,
    movimientos:<Movimientos movimientos={movimientos} cuentas={cuentas} tipos={tipos} tasas={tasas}/>,
    vales:<Vales vales={vales} cuentas={cuentas} tasas={tasas}/>,
    transferencias:<Transferencias transferencias={transferencias} cuentas={cuentas} tasas={tasas}/>,
    conciliacion:<Conciliacion movimientos={movimientos} cuentas={cuentas}/>,
    arqueo:<Arqueo vales={vales} cuentas={cuentas}/>,
    reportes:<Reportes movimientos={movimientos} cuentas={cuentas} vales={vales} tasas={tasas}/>,
  };

  if(loading) return <div className="min-h-screen flex items-center justify-center bg-[#0d1b2e]"><div className="text-center"><div className="w-12 h-12 border-4 border-[#c8972a] border-t-transparent rounded-full animate-spin mx-auto mb-4"/><p className="text-[#e8b84b] font-black text-xs uppercase tracking-widest">Cargando Supply ERP...</p></div></div>;

  const groups=[...new Set(NAV.map(n=>n.group))];
  const curNav=NAV.find(n=>n.id===sec);

  return (
    <div className="flex h-screen overflow-hidden bg-[#f7f8fc]">
      <aside className="w-56 min-w-[224px] bg-[#0d1b2e] flex flex-col h-screen overflow-y-auto flex-shrink-0">
        <div className="px-5 py-6 border-b border-white/10 flex-shrink-0"><p className="font-black text-sm text-[#e8b84b] leading-tight">Servicios Jiret G&amp;B, C.A.</p><p className="text-[9px] text-gray-500 uppercase tracking-widest mt-1">Supply ERP · Módulo Banco</p></div>
        <nav className="flex-1 py-3">
          {groups.map(group=>(
            <div key={group}>
              <p className="px-5 pt-4 pb-1.5 text-[8px] font-black uppercase tracking-[2px] text-gray-600">{group}</p>
              {NAV.filter(n=>n.group===group).map(({id,label,icon:Icon,badge})=>(
                <button key={id} onClick={()=>setSec(id)} className={`w-full flex items-center gap-2.5 px-4 py-2.5 mx-2 rounded-xl text-left transition-all text-xs font-black uppercase tracking-wide mb-0.5 ${sec===id?'bg-[#c8972a]/20 text-[#e8b84b]':'text-gray-500 hover:bg-white/5 hover:text-gray-300'}`} style={{width:'calc(100% - 16px)'}}>
                  <Icon size={14} className="flex-shrink-0"/><span className="truncate">{label}</span>
                  {badge&&vp>0&&<span className="ml-auto bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">{vp}</span>}
                </button>
              ))}
            </div>
          ))}
        </nav>
        <div className="px-4 py-4 border-t border-white/10 flex-shrink-0"><div className="flex items-center gap-2.5"><div className="w-7 h-7 rounded-full bg-[#c8972a] flex items-center justify-center text-[10px] font-black text-[#0d1b2e]">AG</div><div><p className="text-[10px] font-black text-gray-300">Admin General</p><p className="text-[9px] text-gray-600">Tesorero</p></div></div></div>
      </aside>
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="bg-white border-b border-gray-100 px-6 h-14 flex items-center justify-between gap-4 flex-shrink-0 shadow-sm">
          <div><h1 className="font-black text-[#0d1b2e] text-sm uppercase tracking-wide">{curNav?.label||'Dashboard'}</h1><p className="text-[9px] text-gray-400 font-medium uppercase tracking-widest">Banco <ChevronRight size={8} className="inline"/> {curNav?.group}</p></div>
          <div className="flex items-center gap-3">
            <div className="bg-[#fdf3dc] border border-[#e8c96a] rounded-full px-3 py-1.5 flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#c8972a]"/><span className="text-[10px] font-black text-[#7a5a00] font-mono">BCV: {tasas[0]?.tasa||'—'} Bs./$</span></div>
            <button onClick={()=>setSec('movimientos')} className="bg-[#c8972a] text-[#0d1b2e] font-black text-[10px] uppercase tracking-widest px-4 py-2 rounded-xl hover:bg-[#e8b84b] transition-colors flex items-center gap-1.5"><Plus size={12}/>Movimiento</button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">{sections[sec]}</main>
      </div>
    </div>
  );
}

export default function App() {
  return <ErrorBoundary><BancoApp/></ErrorBoundary>;
}

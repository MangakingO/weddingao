'use client';
import { useState, useEffect, useCallback, memo } from 'react';

const GRADE_ORDER = ['A','B','C','D','F'];
const RELATION_OPTIONS = ['Fam (immediate)','Fam (extended)','Family +1','Friend','Friend +1','Colleague','Colleague +1','Other'];
const SIDE_OPTIONS = ['Oscar','Anay','Both'];
const YN_OPTIONS = ['Yes','No','Pending'];
const VENDOR_CATS = ['Venue','Catering','Photography','Videography','DJ / Band','Florist','Hair & Makeup','Officiant','Transportation','Cake','Invitations','Other'];
const BUDGET_CATS = ['Venue','Catering','Photography','Videography','Florals','Entertainment','Food & Drink','Stationery','Attire','Beauty','Transportation','Accommodation','Gifts','Other'];
const COMP_FEATURES = ['Price / Package','Catering Included','BYOB Allowed','Linens Included','Capacity (guests)','DJ Included','Photography Included','Venue Hours','Overtime Fee','Cleanup (us or team)','Bartender Included','License / Security','Deposit Required','Cancellation Policy','Overall Rating','Notes'];
const CAT_COLORS = {'Venue':'#c96e87','Catering':'#8b6f52','Photography':'#4a6a9c','Videography':'#4a7c3f','Florals':'#b05a75','Entertainment':'#7a5c8a','Food & Drink':'#c8601a','Stationery':'#6a9e3f','Attire':'#c9a96e','Beauty':'#e8a0b0','Transportation':'#9b8a90','Accommodation':'#8a7a1a','Gifts':'#a8bba0','Other':'#9b8a90'};

function calcOverall(g){ return Math.round(((+g.necessity||0)+(+g.oscar_score||0)+(+g.anay_score||0))/3*10)/10; }
function getGrade(s){ if(s>=9)return'A'; if(s>=7.5)return'B'; if(s>=6)return'C'; if(s>=4)return'D'; return'F'; }
function isPlus1(rel){ return rel?.includes('+1'); }
function headcount(g){ return isPlus1(g.relation)?2:1; }
function fmt(n){ return '$'+Number(n||0).toLocaleString('en-US',{minimumFractionDigits:0,maximumFractionDigits:0}); }

// shared styles
const inputStyle = { background:'transparent', border:'none', fontFamily:"'Jost',sans-serif", fontSize:13, color:'var(--ink)', width:'100%', outline:'none' };
const selectStyle = { background:'transparent', border:'none', fontFamily:"'Jost',sans-serif", fontSize:13, color:'var(--ink)', width:'100%', outline:'none', cursor:'pointer', appearance:'none', WebkitAppearance:'none', paddingRight:14, backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%239b8a90'/%3E%3C/svg%3E")`, backgroundRepeat:'no-repeat', backgroundPosition:'right 0 center' };
const thStyle = { padding:'14px 16px', textAlign:'left', fontSize:10, letterSpacing:'.18em', textTransform:'uppercase', color:'var(--muted)', fontWeight:500, background:'rgba(242,207,216,.18)', borderBottom:'1px solid var(--border)', whiteSpace:'nowrap' };
const tdStyle = { padding:'12px 16px', verticalAlign:'middle', borderBottom:'1px solid rgba(200,160,175,.12)', fontSize:13 };
const delBtnStyle = { background:'none', border:'none', color:'rgba(200,160,175,.4)', cursor:'pointer', fontSize:16, padding:'2px 6px', borderRadius:5 };
const btnPrimary = { display:'inline-flex', alignItems:'center', gap:7, padding:'10px 20px', borderRadius:50, border:'none', background:'linear-gradient(135deg,var(--deep-rose),var(--mauve))', color:'white', fontFamily:"'Jost',sans-serif", fontSize:12, fontWeight:500, cursor:'pointer', letterSpacing:'.03em', whiteSpace:'nowrap', boxShadow:'0 4px 14px rgba(201,110,135,.3)' };
const btnOutline = { display:'inline-flex', alignItems:'center', gap:7, padding:'10px 18px', borderRadius:50, border:'1px solid var(--border)', background:'var(--card-bg)', color:'var(--muted)', fontFamily:"'Jost',sans-serif", fontSize:12, fontWeight:500, cursor:'pointer', letterSpacing:'.03em', whiteSpace:'nowrap' };
const addRowBtn = { display:'flex', alignItems:'center', justifyContent:'center', gap:8, marginTop:12, padding:'12px 18px', background:'rgba(242,207,216,.15)', border:'1.5px dashed rgba(201,110,135,.25)', borderRadius:14, color:'var(--rose)', fontFamily:"'Jost',sans-serif", fontSize:12, cursor:'pointer', width:'100%' };
const gradeBadgeStyle = g => ({ display:'inline-flex', alignItems:'center', justifyContent:'center', width:28, height:28, borderRadius:7, fontFamily:"'Playfair Display',serif", fontSize:13, fontWeight:700, color:'white', background: g==='A'?'var(--ga)':g==='B'?'var(--gb)':g==='C'?'var(--gc)':g==='D'?'var(--gd)':'var(--gf)' });

function Spinner(){ return <div style={{ width:18,height:18,border:'2px solid var(--border)',borderTopColor:'var(--deep-rose)',borderRadius:'50%',animation:'spin 0.7s linear infinite',flexShrink:0 }} />; }
function GradeToggle({grade,on,onClick}){
  const c={A:'#4a7c3f',B:'#6a9e3f',C:'#b89a1a',D:'#c8601a',F:'#992020'};
  return <button onClick={onClick} style={{width:34,height:34,borderRadius:8,border:'none',background:c[grade],color:'white',opacity:on?1:0.28,cursor:'pointer',transition:'all .2s',fontFamily:"'Playfair Display',serif",fontSize:14,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',boxShadow:on?'0 3px 12px rgba(0,0,0,.2)':'none',transform:on?'translateY(-1px)':'none'}}>{grade}</button>;
}
function ScoreBar({value}){
  return <div style={{display:'flex',alignItems:'center',gap:8}}>
    <div style={{flex:1,height:3,background:'rgba(200,160,175,.2)',borderRadius:2,overflow:'hidden'}}>
      <div style={{height:'100%',borderRadius:2,background:'linear-gradient(90deg,var(--rose),var(--deep-rose))',width:`${value*10}%`,transition:'width .4s'}} />
    </div>
    <div style={{fontSize:13,fontWeight:600,minWidth:26,textAlign:'right'}}>{value}</div>
  </div>;
}

// ── Each row is its own component with LOCAL state ─────────
// This prevents the mirroring bug — each row manages its own
// input values independently and only calls save on blur.

const GuestRow = memo(function GuestRow({ g, index, invited, onSave, onDelete, invitedGrades }) {
  const [local, setLocal] = useState(g);
  useEffect(() => { setLocal(g); }, [g.id]); // reset if row identity changes

  const overall = calcOverall(local);
  const grade   = getGrade(overall);
  const inv     = invitedGrades.has(grade);
  const plus1   = isPlus1(local.relation);

  function change(field, value) { setLocal(p => ({...p, [field]: value})); }
  function save(field, value)   { onSave(g.id, field, value); }
  function saveNum(field, value){ const v = Math.min(10, Math.max(1, +value||1)); setLocal(p=>({...p,[field]:v})); onSave(g.id, field, v); }

  return (
    <tr style={{background: inv ? 'rgba(232,160,176,.06)':'white', borderLeft: inv?'3px solid var(--deep-rose)':'none'}}>
      <td style={{...tdStyle,color:'var(--muted)',fontSize:11,textAlign:'center',width:36}}>{index+1}</td>
      <td style={{...tdStyle,fontWeight:500}}>
        <input style={inputStyle} value={local.name||''} placeholder="Name…"
          onChange={e=>change('name',e.target.value)}
          onBlur={e=>save('name',e.target.value)} />
      </td>
      <td style={tdStyle}>
        <select style={selectStyle} value={local.relation}
          onChange={e=>{ change('relation',e.target.value); save('relation',e.target.value); }}>
          {RELATION_OPTIONS.map(r=><option key={r}>{r}</option>)}
        </select>
        {plus1 && <span style={{fontSize:9,padding:'1px 5px',borderRadius:4,background:'rgba(201,169,110,.15)',color:'var(--gold-dark)',border:'1px solid rgba(201,169,110,.3)',marginLeft:5}}>2 heads</span>}
      </td>
      <td style={tdStyle}>
        <select style={{...selectStyle,color:local.side==='Oscar'?'#4a6a9c':local.side==='Anay'?'var(--deep-rose)':'var(--ink)',fontWeight:500}}
          value={local.side}
          onChange={e=>{ change('side',e.target.value); save('side',e.target.value); }}>
          {SIDE_OPTIONS.map(s=><option key={s}>{s}</option>)}
        </select>
      </td>
      {[['necessity',local.necessity],['oscar_score',local.oscar_score],['anay_score',local.anay_score]].map(([field,val])=>(
        <td key={field} style={tdStyle}>
          <input style={{...inputStyle,width:40,textAlign:'center',fontWeight:600}}
            type="number" min="1" max="10" value={val||''}
            onChange={e=>change(field,+e.target.value)}
            onBlur={e=>saveNum(field,e.target.value)} />
        </td>
      ))}
      <td style={{...tdStyle,minWidth:130}}><ScoreBar value={overall}/></td>
      <td style={tdStyle}><div style={gradeBadgeStyle(grade)}>{grade}</div></td>
      <td style={tdStyle}>
        <span style={{display:'inline-flex',alignItems:'center',gap:4,fontSize:11,padding:'4px 11px',borderRadius:20,fontWeight:500,background:inv?'linear-gradient(135deg,rgba(168,187,160,.3),rgba(140,170,130,.2))':'rgba(155,138,144,.1)',color:inv?'#3a6b2a':'var(--muted)',border:inv?'1px solid rgba(140,170,130,.3)':'1px solid rgba(155,138,144,.15)'}}>
          {inv?'✓ Invited':'— Not yet'}
        </span>
      </td>
      <td style={tdStyle}>
        <input style={{...inputStyle,color:'var(--muted)',fontSize:12}} value={local.notes||''} placeholder="Notes…"
          onChange={e=>change('notes',e.target.value)}
          onBlur={e=>save('notes',e.target.value)} />
      </td>
      <td style={tdStyle}><button style={delBtnStyle} onClick={()=>onDelete(g.id)}>×</button></td>
    </tr>
  );
});

const VendorRow = memo(function VendorRow({ v, index, onSave, onDelete }) {
  const [local, setLocal] = useState(v);
  useEffect(() => { setLocal(v); }, [v.id]);

  function change(field, value) { setLocal(p=>({...p,[field]:value})); }
  function save(field, value)   { onSave(v.id, field, value); }

  return (
    <tr style={{background:'white',borderBottom:'1px solid rgba(200,160,175,.12)'}}>
      <td style={{...tdStyle,color:'var(--muted)',fontSize:11,textAlign:'center',width:36}}>{index+1}</td>
      <td style={{...tdStyle,fontWeight:500}}>
        <input style={inputStyle} value={local.name||''} placeholder="Vendor name…"
          onChange={e=>change('name',e.target.value)} onBlur={e=>save('name',e.target.value)} />
      </td>
      <td style={tdStyle}>
        <select style={selectStyle} value={local.category}
          onChange={e=>{ change('category',e.target.value); save('category',e.target.value); }}>
          {VENDOR_CATS.map(c=><option key={c}>{c}</option>)}
        </select>
      </td>
      <td style={tdStyle}>
        <input style={inputStyle} value={local.contact||''} placeholder="Phone / email…"
          onChange={e=>change('contact',e.target.value)} onBlur={e=>save('contact',e.target.value)} />
      </td>
      <td style={tdStyle}>
        <div style={{display:'flex',alignItems:'center',gap:6}}>
          <input style={{...inputStyle,color:'var(--deep-rose)'}} value={local.link||''} placeholder="https://…"
            onChange={e=>change('link',e.target.value)} onBlur={e=>save('link',e.target.value)} />
          {local.link && <a href={local.link} target="_blank" rel="noreferrer" style={{fontSize:16,textDecoration:'none',flexShrink:0}} title="Open">🔗</a>}
        </div>
      </td>
      {[['inquiry',local.inquiry],['response',local.response]].map(([field,val])=>(
        <td key={field} style={tdStyle}>
          <select style={{...selectStyle,color:val==='Yes'?'#3a6b2a':val==='Pending'?'var(--gold-dark)':'var(--muted)',fontWeight:500}}
            value={val} onChange={e=>{ change(field,e.target.value); save(field,e.target.value); }}>
            {YN_OPTIONS.map(o=><option key={o}>{o}</option>)}
          </select>
        </td>
      ))}
      <td style={tdStyle}>
        <input style={inputStyle} value={local.price||''} placeholder="$0,000"
          onChange={e=>change('price',e.target.value)} onBlur={e=>save('price',e.target.value)} />
      </td>
      <td style={tdStyle}>
        <input style={{...inputStyle,color:'var(--muted)',fontSize:12}} value={local.notes||''} placeholder="Notes…"
          onChange={e=>change('notes',e.target.value)} onBlur={e=>save('notes',e.target.value)} />
      </td>
      <td style={tdStyle}><button style={delBtnStyle} onClick={()=>onDelete(v.id)}>×</button></td>
    </tr>
  );
});

const BudgetRow = memo(function BudgetRow({ b, index, onSave, onDelete }) {
  const [local, setLocal] = useState(b);
  useEffect(() => { setLocal(b); }, [b.id]);

  function change(field, value) { setLocal(p=>({...p,[field]:value})); }
  function save(field, value)   { onSave(b.id, field, value); }

  const diff = (+local.actual||0)-(+local.estimated||0);
  const over = diff > 0;
  const catColor = CAT_COLORS[local.category]||'var(--muted)';

  return (
    <tr style={{background:local.paid?'rgba(168,187,160,.06)':'white',borderBottom:'1px solid rgba(200,160,175,.12)'}}>
      <td style={{...tdStyle,color:'var(--muted)',fontSize:11,textAlign:'center',width:36}}>{index+1}</td>
      <td style={{...tdStyle,fontWeight:500}}>
        <input style={inputStyle} value={local.name||''} placeholder="Expense name…"
          onChange={e=>change('name',e.target.value)} onBlur={e=>save('name',e.target.value)} />
      </td>
      <td style={tdStyle}>
        <div style={{display:'flex',alignItems:'center',gap:7}}>
          <div style={{width:8,height:8,borderRadius:'50%',background:catColor,flexShrink:0}}/>
          <select style={selectStyle} value={local.category}
            onChange={e=>{ change('category',e.target.value); save('category',e.target.value); }}>
            {BUDGET_CATS.map(c=><option key={c}>{c}</option>)}
          </select>
        </div>
      </td>
      <td style={{...tdStyle,textAlign:'right'}}>
        <input style={{...inputStyle,textAlign:'right',fontWeight:500}} value={local.estimated||''} placeholder="0" type="number"
          onChange={e=>change('estimated',e.target.value)} onBlur={e=>save('estimated',+e.target.value)} />
      </td>
      <td style={{...tdStyle,textAlign:'right'}}>
        <input style={{...inputStyle,textAlign:'right',fontWeight:500}} value={local.actual||''} placeholder="0" type="number"
          onChange={e=>change('actual',e.target.value)} onBlur={e=>save('actual',+e.target.value)} />
      </td>
      <td style={{...tdStyle,textAlign:'right',fontWeight:600,color:diff===0?'var(--muted)':over?'#c83030':'#3a6b2a'}}>
        {diff===0?'—':(over?'+':'')+fmt(Math.abs(diff))}
      </td>
      <td style={{...tdStyle,textAlign:'center'}}>
        <input type="checkbox" checked={!!local.paid}
          onChange={e=>{ change('paid',e.target.checked); save('paid',e.target.checked); }}
          style={{width:16,height:16,accentColor:'var(--deep-rose)',cursor:'pointer'}} />
      </td>
      <td style={tdStyle}>
        <input style={{...inputStyle,color:'var(--muted)',fontSize:12}} value={local.notes||''} placeholder="Notes…"
          onChange={e=>change('notes',e.target.value)} onBlur={e=>save('notes',e.target.value)} />
      </td>
      <td style={tdStyle}><button style={delBtnStyle} onClick={()=>onDelete(b.id)}>×</button></td>
    </tr>
  );
});

// ── CAPACITY BAR ───────────────────────────────────────────
function CapacityBar({ current, limit, onLimitChange }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState(String(limit));
  useEffect(()=>setDraft(String(limit)),[limit]);

  const pct   = Math.min(Math.round((current/limit)*100),100);
  const over  = current > limit;
  const warn  = current >= limit*0.9;
  const color = over?'#c83030':warn?'#c8601a':'#4a7c3f';

  return (
    <div style={{background: over?'rgba(200,80,80,.1)':warn?'rgba(200,100,30,.08)':'rgba(74,124,63,.08)', border:`1px solid ${color}30`,borderRadius:14,padding:'14px 20px',marginBottom:18,display:'flex',alignItems:'center',gap:16,flexWrap:'wrap'}}>
      <div style={{flexShrink:0}}>
        <div style={{fontSize:10,letterSpacing:'.18em',textTransform:'uppercase',color,fontWeight:500,marginBottom:3}}>{over?'⚠️ Over Capacity':warn?'⚡ Near Capacity':'✓ Capacity'}</div>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:700,color,lineHeight:1}}>{current} <span style={{fontSize:13,fontWeight:400,opacity:.7}}>/ {limit} guests</span></div>
      </div>
      <div style={{flex:1,minWidth:160}}>
        <div style={{height:8,background:'rgba(0,0,0,.1)',borderRadius:4,overflow:'hidden'}}>
          <div style={{height:'100%',borderRadius:4,background:color,width:`${pct}%`,transition:'width .6s ease'}}/>
        </div>
        <div style={{fontSize:10,color,marginTop:4,opacity:.8}}>{pct}% of venue capacity used</div>
      </div>
      <div style={{flexShrink:0,display:'flex',alignItems:'center',gap:8}}>
        <span style={{fontSize:11,color:'var(--muted)'}}>Limit:</span>
        {editing ? (
          <input autoFocus type="number" value={draft}
            onChange={e=>setDraft(e.target.value)}
            onBlur={()=>{ setEditing(false); onLimitChange(parseInt(draft)||200); }}
            onKeyDown={e=>{ if(e.key==='Enter'){setEditing(false);onLimitChange(parseInt(draft)||200);} }}
            style={{width:70,padding:'4px 8px',border:'1px solid var(--border)',borderRadius:8,fontFamily:"'Jost',sans-serif",fontSize:13,outline:'none',textAlign:'center'}} />
        ) : (
          <button onClick={()=>setEditing(true)} style={{padding:'5px 12px',borderRadius:8,border:'1px solid var(--border)',background:'white',fontFamily:"'Jost',sans-serif",fontSize:12,cursor:'pointer',color:'var(--ink)'}}>
            {limit} <span style={{color:'var(--muted)',fontSize:10}}>✎</span>
          </button>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
export default function Planner() {
  const [tab, setTab]           = useState('guests');
  const [vtab, setVtab]         = useState('contacts');
  const [guests, setGuests]     = useState([]);
  const [vendors, setVendors]   = useState([]);
  const [budget, setBudget]     = useState([]);
  const [compData, setCompData] = useState({});
  const [venueNames, setVenueNames] = useState([]);
  const [invitedGrades, setInvitedGrades] = useState(new Set(['A','B']));
  const [activeFilter, setActiveFilter]   = useState('all');
  const [showModal, setShowModal]         = useState(false);
  const [capacityLimit, setCapacityLimit] = useState(200);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);

  useEffect(()=>{
    async function load(){
      try{
        const [gR,vR,bR,compR,setR,capR] = await Promise.all([
          fetch('/api/guests').then(r=>r.json()),
          fetch('/api/vendors').then(r=>r.json()),
          fetch('/api/budget').then(r=>r.json()),
          fetch('/api/venues').then(r=>r.json()),
          fetch('/api/settings').then(r=>r.json()),
          fetch('/api/capacity').then(r=>r.json()),
        ]);
        setGuests(Array.isArray(gR)?gR:[]);
        setVendors(Array.isArray(vR)?vR:[]);
        setBudget(Array.isArray(bR)?bR:[]);
        const cd={}, names=new Set();
        if(Array.isArray(compR)) compR.forEach(row=>{ if(!cd[row.venue_name])cd[row.venue_name]={}; cd[row.venue_name][row.feature]=row.value||''; names.add(row.venue_name); });
        ['The Grand Ballroom','Casa Verde Estate'].forEach(v=>{ names.add(v); if(!cd[v])cd[v]={}; });
        setCompData(cd); setVenueNames([...names]);
        if(setR?.invited_grades) setInvitedGrades(new Set(setR.invited_grades.split(',')));
        if(capR?.capacity) setCapacityLimit(capR.capacity);
      }catch(e){console.error(e);}
      finally{setLoading(false);}
    }
    load();
  },[]);

  // derived
  const isInvited = useCallback(g => invitedGrades.has(getGrade(calcOverall(g))), [invitedGrades]);
  const invitedGuests  = guests.filter(isInvited);
  const totalHeads     = invitedGuests.reduce((s,g)=>s+headcount(g),0);
  const sentCount      = invitedGuests.filter(g=>g.invite_sent).length;
  const gc = {A:0,B:0,C:0,D:0,F:0};
  guests.forEach(g=>gc[getGrade(calcOverall(g))]++);
  const totalEstimated = budget.reduce((s,b)=>s+(+b.estimated||0),0);
  const totalActual    = budget.reduce((s,b)=>s+(+b.actual||0),0);
  const totalPaid      = budget.filter(b=>b.paid).reduce((s,b)=>s+(+b.actual||0),0);

  const filteredGuests = guests.filter(g=>{
    if(activeFilter==='invited') return isInvited(g);
    if(activeFilter==='oscar')   return g.side==='Oscar'||g.side==='Both';
    if(activeFilter==='anay')    return g.side==='Anay'||g.side==='Both';
    return true;
  });

  // grade toggle
  async function toggleGrade(g){
    const idx=GRADE_ORDER.indexOf(g);
    let lo=-1; GRADE_ORDER.forEach((gr,i)=>{ if(invitedGrades.has(gr))lo=i; });
    let newSet = invitedGrades.has(g)&&idx===lo&&idx>0 ? new Set([...invitedGrades].filter(gr=>gr!==g)) : new Set(GRADE_ORDER.slice(0,idx+1));
    if(newSet.size===0) newSet.add('A');
    setInvitedGrades(newSet);
    await fetch('/api/settings',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({invited_grades:[...newSet].join(',')})});
  }

  async function handleCapacityChange(v){
    setCapacityLimit(v);
    await fetch('/api/capacity',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({capacity:v})});
  }

  // guest CRUD
  async function addGuest(){
    const res=await fetch('/api/guests',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'',relation:'Friend',side:'Anay',necessity:5,oscar_score:5,anay_score:5,notes:''})});
    const g=await res.json(); setGuests(p=>[...p,g]);
  }
  const saveGuest = useCallback(async (id,field,value)=>{
    setGuests(p=>p.map(g=>g.id===id?{...g,[field]:value}:g));
    setSaving(true);
    await fetch(`/api/guests/${id}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({[field]:value})});
    setSaving(false);
  },[]);
  async function deleteGuest(id){ setGuests(p=>p.filter(g=>g.id!==id)); await fetch(`/api/guests/${id}`,{method:'DELETE'}); }

  // vendor CRUD
  async function addVendor(){
    const res=await fetch('/api/vendors',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'',category:'Venue',contact:'',link:'',inquiry:'No',response:'No',price:'',notes:''})});
    const v=await res.json(); setVendors(p=>[...p,v]);
  }
  const saveVendor = useCallback(async (id,field,value)=>{
    setVendors(p=>p.map(v=>v.id===id?{...v,[field]:value}:v));
    setSaving(true);
    await fetch(`/api/vendors/${id}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({[field]:value})});
    setSaving(false);
  },[]);
  async function deleteVendor(id){ setVendors(p=>p.filter(v=>v.id!==id)); await fetch(`/api/vendors/${id}`,{method:'DELETE'}); }

  // budget CRUD
  async function addBudgetItem(){
    const res=await fetch('/api/budget',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'',category:'Venue',estimated:0,actual:0,paid:false,notes:''})});
    const b=await res.json(); setBudget(p=>[...p,b]);
  }
  const saveBudget = useCallback(async (id,field,value)=>{
    setBudget(p=>p.map(b=>b.id===id?{...b,[field]:value}:b));
    setSaving(true);
    await fetch(`/api/budget/${id}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({[field]:value})});
    setSaving(false);
  },[]);
  async function deleteBudget(id){ setBudget(p=>p.filter(b=>b.id!==id)); await fetch(`/api/budget/${id}`,{method:'DELETE'}); }

  // venue comparison
  async function updateComp(venue,feature,value){
    setCompData(p=>({...p,[venue]:{...(p[venue]||{}),[feature]:value}}));
    setSaving(true);
    await fetch('/api/venues',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({venue_name:venue,feature,value})});
    setSaving(false);
  }
  async function addVenue(){ const name=prompt('Venue name:'); if(!name?.trim())return; setVenueNames(p=>[...p,name.trim()]); setCompData(p=>({...p,[name.trim()]:{}})); }
  async function removeVenue(name){ if(!confirm(`Remove "${name}"?`))return; setVenueNames(p=>p.filter(v=>v!==name)); setCompData(p=>{const d={...p};delete d[name];return d;}); await fetch(`/api/venues/${encodeURIComponent(name)}`,{method:'DELETE'}); }

  function exportCSV(){
    const rows=[['Name','Relation','Side','Grade','Headcount','Notes','Invite Sent']];
    invitedGuests.forEach(g=>rows.push([g.name,g.relation,g.side,getGrade(calcOverall(g)),headcount(g),g.notes||'',g.invite_sent?'Yes':'No']));
    const csv=rows.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
    const a=document.createElement('a'); a.href='data:text/csv;charset=utf-8,'+encodeURIComponent(csv); a.download='invited-guests.csv'; a.click();
  }

  const sortedGrades = [...invitedGrades].sort((a,b)=>GRADE_ORDER.indexOf(a)-GRADE_ORDER.indexOf(b));
  const cardStyle = hero => ({ background:hero?'linear-gradient(135deg,var(--deep-rose),var(--mauve))':'var(--card-bg)', backdropFilter:'blur(16px)', border:hero?'none':'1px solid var(--border)', borderRadius:18, padding:'20px 22px', animation:'cardIn .5s ease both' });

  if(loading) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',background:'var(--cream)',flexDirection:'column',gap:16}}>
      <div style={{fontFamily:"'Playfair Display',serif",fontSize:28,fontStyle:'italic',color:'var(--deep-rose)'}}>Anay & Oscar</div>
      <Spinner/>
    </div>
  );

  return (
    <div style={{display:'flex',height:'100vh',overflow:'hidden',background:'var(--cream)'}}>
      <div style={{position:'fixed',inset:0,zIndex:0,pointerEvents:'none',background:'radial-gradient(ellipse 70% 60% at 15% 20%,rgba(242,207,216,.55) 0%,transparent 70%),radial-gradient(ellipse 55% 50% at 85% 10%,rgba(232,160,176,.35) 0%,transparent 65%),radial-gradient(ellipse 60% 55% at 90% 80%,rgba(245,230,208,.45) 0%,transparent 70%),#fdf7f2'}} />

      {/* SIDEBAR */}
      <aside style={{width:240,minHeight:'100vh',background:'rgba(42,31,36,.94)',backdropFilter:'blur(20px)',display:'flex',flexDirection:'column',padding:'32px 0 24px',flexShrink:0,zIndex:10}}>
        <div style={{padding:'0 24px 28px',borderBottom:'1px solid rgba(255,255,255,.08)'}}>
          <span style={{fontSize:22,marginBottom:6,display:'block'}}>🌸</span>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:19,fontStyle:'italic',color:'var(--blush)',lineHeight:1.2}}>Anay <em style={{color:'var(--gold)',fontStyle:'normal'}}>&</em> Oscar</div>
          <div style={{fontSize:9,letterSpacing:'.22em',textTransform:'uppercase',color:'rgba(255,255,255,.3)',marginTop:5}}>November 6th · Wedding Planner</div>
        </div>
        <nav style={{padding:'20px 12px',flex:1,display:'flex',flexDirection:'column',gap:4}}>
          {[['guests','💌','Guest List'],['vendors','🏛️','Vendors'],['budget','💰','Budget']].map(([id,icon,label])=>(
            <button key={id} onClick={()=>setTab(id)} style={{display:'flex',alignItems:'center',gap:11,padding:'11px 14px',borderRadius:10,border:'none',background:tab===id?'linear-gradient(135deg,rgba(201,110,135,.35),rgba(201,110,135,.15))':'none',color:tab===id?'var(--blush)':'rgba(255,255,255,.55)',fontFamily:"'Jost',sans-serif",fontSize:13,fontWeight:tab===id?500:400,cursor:'pointer',transition:'all .2s',textAlign:'left',width:'100%',letterSpacing:'.02em'}}>
              <span style={{fontSize:16,width:20,textAlign:'center'}}>{icon}</span><span>{label}</span>
            </button>
          ))}
        </nav>
        <div style={{padding:'20px 16px 0',borderTop:'1px solid rgba(255,255,255,.08)',marginTop:'auto'}}>
          <div style={{display:'flex',alignItems:'center',gap:10,padding:'10px 8px',borderRadius:10,background:'rgba(255,255,255,.06)'}}>
            <div style={{width:34,height:34,borderRadius:'50%',background:'linear-gradient(135deg,var(--rose),var(--deep-rose))',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,color:'white',fontWeight:600,flexShrink:0}}>A</div>
            <div>
              <div style={{fontSize:12,fontWeight:500,color:'var(--blush)'}}>Anay</div>
              <div style={{fontSize:9,color:'rgba(255,255,255,.35)',letterSpacing:'.1em',textTransform:'uppercase',marginTop:1}}>Bride ✨</div>
            </div>
            {saving&&<div style={{marginLeft:'auto'}}><Spinner/></div>}
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <main style={{flex:1,overflowY:'auto',padding:'36px 40px',position:'relative',zIndex:1}}>

        {/* ══ GUESTS ══ */}
        {tab==='guests'&&(
          <div style={{animation:'fadeIn .3s ease both'}}>
            <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',marginBottom:24}}>
              <div>
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:34,fontWeight:700,color:'var(--ink)',letterSpacing:'-.01em'}}>Guest <em style={{color:'var(--deep-rose)',fontStyle:'italic'}}>List</em></div>
                <div style={{fontSize:11,color:'var(--muted)',letterSpacing:'.06em',marginTop:4}}>Score 1–10 · grade decides the invite · +1 relations count as 2 heads</div>
              </div>
              <div style={{display:'flex',gap:10}}>
                <button style={btnOutline} onClick={()=>setShowModal(true)}>💾 Export Invited</button>
                <button style={btnPrimary} onClick={addGuest}>＋ Add Guest</button>
              </div>
            </div>

            <CapacityBar current={totalHeads} limit={capacityLimit} onLimitChange={handleCapacityChange}/>

            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14,marginBottom:26}}>
              {[[true,'Total Headcount',totalHeads,`${sortedGrades[0]}–${sortedGrades[sortedGrades.length-1]} invited`],[false,'Invited Entries',invitedGuests.length,'+1s each = 2 heads'],[false,'Not Yet Invited',guests.length-invitedGuests.length,'below threshold'],[false,'',null,null]].map(([hero,label,val,sub],i)=>(
                i===3 ? (
                  <div key={i} style={cardStyle(false)}>
                    <div style={{fontSize:10,letterSpacing:'.18em',textTransform:'uppercase',color:'var(--muted)',marginBottom:8,fontWeight:500}}>Grades</div>
                    <div style={{display:'flex',gap:8,marginTop:10}}>
                      {GRADE_ORDER.map(g=>(
                        <div key={g} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:2}}>
                          <div style={{...gradeBadgeStyle(g),width:22,height:22,fontSize:11,borderRadius:5}}>{g}</div>
                          <div style={{fontSize:11,fontWeight:600}}>{gc[g]}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div key={i} style={cardStyle(hero)}>
                    <div style={{fontSize:10,letterSpacing:'.18em',textTransform:'uppercase',color:hero?'rgba(255,255,255,.65)':'var(--muted)',marginBottom:8,fontWeight:500}}>{label}</div>
                    <div style={{fontFamily:"'Playfair Display',serif",fontSize:36,fontWeight:700,lineHeight:1,color:hero?'white':'var(--ink)'}}>{val}</div>
                    <div style={{fontSize:11,color:hero?'rgba(255,255,255,.55)':'var(--muted)',marginTop:5}}>{sub}</div>
                  </div>
                )
              ))}
            </div>

            <div style={{display:'flex',alignItems:'center',gap:12,flexWrap:'wrap',background:'var(--card-bg)',backdropFilter:'blur(12px)',border:'1px solid var(--border)',borderRadius:14,padding:'12px 18px',marginBottom:18}}>
              <div style={{fontSize:10,letterSpacing:'.18em',textTransform:'uppercase',color:'var(--muted)',whiteSpace:'nowrap'}}>Invited if grade ≥</div>
              <div style={{display:'flex',gap:6}}>{GRADE_ORDER.map(g=><GradeToggle key={g} grade={g} on={invitedGrades.has(g)} onClick={()=>toggleGrade(g)}/>)}</div>
              <div style={{fontSize:10,color:'var(--muted)'}}>Click to adjust who counts toward headcount</div>
            </div>

            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:18,gap:16,flexWrap:'wrap'}}>
              <div style={{display:'flex',gap:6}}>
                {[['all','All',guests.length],['invited','✓ Invited',invitedGuests.length],['oscar',"Oscar's Side",guests.filter(g=>g.side==='Oscar'||g.side==='Both').length],['anay',"Anay's Side",guests.filter(g=>g.side==='Anay'||g.side==='Both').length]].map(([f,label,count])=>(
                  <button key={f} onClick={()=>setActiveFilter(f)} style={{padding:'9px 20px',borderRadius:50,border:activeFilter===f?'none':'1px solid var(--border)',background:activeFilter===f?'linear-gradient(135deg,var(--deep-rose),var(--mauve))':'var(--card-bg)',color:activeFilter===f?'white':'var(--muted)',fontFamily:"'Jost',sans-serif",fontSize:12,fontWeight:500,cursor:'pointer',boxShadow:activeFilter===f?'0 4px 14px rgba(201,110,135,.35)':'none'}}>
                    {label} <span style={{display:'inline-flex',alignItems:'center',justifyContent:'center',width:18,height:18,borderRadius:'50%',background:activeFilter===f?'rgba(255,255,255,.25)':'var(--blush)',color:activeFilter===f?'white':'var(--deep-rose)',fontSize:10,fontWeight:700,marginLeft:5}}>{count}</span>
                  </button>
                ))}
              </div>
              <button style={{...btnOutline,fontSize:11,padding:'8px 14px'}} onClick={()=>setShowModal(true)}>👁 View Invited</button>
            </div>

            <div style={{background:'var(--card-bg)',backdropFilter:'blur(16px)',border:'1px solid var(--border)',borderRadius:20,overflow:'hidden'}}>
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead><tr>{['#','Name','Relation','Side','Necessity','Oscar','Anay','Overall','Grade','Status','Notes',''].map((h,i)=><th key={i} style={{...thStyle,width:h==='#'?36:undefined,minWidth:h==='Overall'?130:undefined}}>{h}</th>)}</tr></thead>
                <tbody>
                  {filteredGuests.map((g,i)=>(
                    <GuestRow key={g.id} g={g} index={i} invited={isInvited(g)} onSave={saveGuest} onDelete={deleteGuest} invitedGrades={invitedGrades}/>
                  ))}
                </tbody>
              </table>
            </div>
            <button style={addRowBtn} onClick={addGuest}>🌸 Add a Guest</button>
          </div>
        )}

        {/* ══ VENDORS ══ */}
        {tab==='vendors'&&(
          <div style={{animation:'fadeIn .3s ease both'}}>
            <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',marginBottom:24}}>
              <div>
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:34,fontWeight:700,color:'var(--ink)',letterSpacing:'-.01em'}}>Vendor <em style={{color:'var(--deep-rose)',fontStyle:'italic'}}>Planning</em></div>
                <div style={{fontSize:11,color:'var(--muted)',letterSpacing:'.06em',marginTop:4}}>Track contacts & compare venues side by side</div>
              </div>
              <button style={btnPrimary} onClick={addVendor}>＋ Add Vendor</button>
            </div>
            <div style={{display:'flex',borderBottom:'1.5px solid var(--border)',marginBottom:22}}>
              {[['contacts','Contacts & Inquiries'],['comparison','Venue Comparison']].map(([id,label])=>(
                <button key={id} onClick={()=>setVtab(id)} style={{background:'none',border:'none',fontFamily:"'Jost',sans-serif",fontSize:12,letterSpacing:'.1em',textTransform:'uppercase',fontWeight:500,color:vtab===id?'var(--deep-rose)':'var(--muted)',padding:'10px 20px',cursor:'pointer',borderBottom:vtab===id?'2px solid var(--deep-rose)':'2px solid transparent',marginBottom:-1.5,transition:'all .2s'}}>{label}</button>
              ))}
            </div>
            {vtab==='contacts'&&(
              <div style={{animation:'fadeIn .3s ease both'}}>
                <div style={{background:'var(--card-bg)',backdropFilter:'blur(16px)',border:'1px solid var(--border)',borderRadius:20,overflow:'hidden'}}>
                  <table style={{width:'100%',borderCollapse:'collapse'}}>
                    <thead><tr>{['#','Vendor Name','Category','Contact','Link','Inquiry Sent?','Response?','Price Range','Notes',''].map((h,i)=><th key={i} style={thStyle}>{h}</th>)}</tr></thead>
                    <tbody>{vendors.map((v,i)=><VendorRow key={v.id} v={v} index={i} onSave={saveVendor} onDelete={deleteVendor}/>)}</tbody>
                  </table>
                </div>
                <button style={addRowBtn} onClick={addVendor}>🌸 Add Vendor</button>
              </div>
            )}
            {vtab==='comparison'&&(
              <div style={{animation:'fadeIn .3s ease both'}}>
                <div style={{display:'flex',gap:10,marginBottom:14,alignItems:'center'}}>
                  <span style={{fontSize:10,color:'var(--muted)',letterSpacing:'.15em',textTransform:'uppercase'}}>Venues:</span>
                  <button onClick={addVenue} style={{display:'inline-flex',alignItems:'center',gap:7,padding:'9px 16px',background:'none',border:'1.5px dashed rgba(201,110,135,.3)',borderRadius:50,color:'var(--rose)',fontFamily:"'Jost',sans-serif",fontSize:11,cursor:'pointer'}}>＋ Add Venue</button>
                </div>
                <div style={{overflowX:'auto',borderRadius:16,border:'1px solid var(--border)'}}>
                  <table style={{width:'100%',borderCollapse:'collapse',background:'rgba(255,255,255,.7)',minWidth:700}}>
                    <thead>
                      <tr>
                        <th style={{background:'rgba(245,230,208,.4)',color:'var(--muted)',width:160,position:'sticky',left:0,padding:'12px 14px',fontSize:10,letterSpacing:'.18em',textTransform:'uppercase',textAlign:'left',fontWeight:500,whiteSpace:'nowrap'}}>Feature</th>
                        {venueNames.map(v=><th key={v} style={{background:'linear-gradient(135deg,var(--deep-rose),var(--mauve))',color:'white',padding:'12px 14px',fontSize:10,letterSpacing:'.18em',textTransform:'uppercase',textAlign:'center',minWidth:150,fontWeight:500}}>{v}<button onClick={()=>removeVenue(v)} style={{background:'none',border:'none',color:'rgba(255,255,255,.55)',cursor:'pointer',marginLeft:6,fontSize:12}}>×</button></th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {COMP_FEATURES.map(f=>(
                        <tr key={f}>
                          <td style={{background:'rgba(245,230,208,.35)',color:'var(--ink)',fontFamily:"'Jost',sans-serif",fontSize:11,letterSpacing:'.06em',textTransform:'uppercase',padding:'10px 14px',fontWeight:500,borderRight:'1.5px solid var(--border)',whiteSpace:'nowrap',position:'sticky',left:0}}>{f}</td>
                          {venueNames.map(v=>(
                            <td key={v} style={{padding:'10px 14px',borderBottom:'1px solid rgba(200,160,175,.12)',borderRight:'1px solid rgba(200,160,175,.08)',fontSize:12}}>
                              <input style={{background:'transparent',border:'none',fontFamily:"'Jost',sans-serif",fontSize:12,color:'var(--ink)',width:'100%',outline:'none',minWidth:100}}
                                value={compData[v]?.[f]||''} placeholder="—"
                                onChange={e=>setCompData(p=>({...p,[v]:{...(p[v]||{}),[f]:e.target.value}}))}
                                onBlur={e=>updateComp(v,f,e.target.value)} />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══ BUDGET ══ */}
        {tab==='budget'&&(
          <div style={{animation:'fadeIn .3s ease both'}}>
            <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',marginBottom:24}}>
              <div>
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:34,fontWeight:700,color:'var(--ink)',letterSpacing:'-.01em'}}>Wedding <em style={{color:'var(--deep-rose)',fontStyle:'italic'}}>Budget</em></div>
                <div style={{fontSize:11,color:'var(--muted)',letterSpacing:'.06em',marginTop:4}}>Track estimated vs actual spend · mark items as paid</div>
              </div>
              <button style={btnPrimary} onClick={addBudgetItem}>＋ Add Expense</button>
            </div>

            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14,marginBottom:26}}>
              {[[true,'Total Budget',fmt(totalEstimated),'estimated spend'],[false,'Spent So Far',fmt(totalActual),`${fmt(totalEstimated-totalActual)} remaining`],[false,'Paid',fmt(totalPaid),`${budget.filter(b=>b.paid).length} items paid`],[false,'Items',budget.length,`${budget.filter(b=>!b.paid).length} unpaid`]].map(([hero,label,val,sub],i)=>(
                <div key={i} style={cardStyle(hero)}>
                  <div style={{fontSize:10,letterSpacing:'.18em',textTransform:'uppercase',color:hero?'rgba(255,255,255,.65)':'var(--muted)',marginBottom:8,fontWeight:500}}>{label}</div>
                  <div style={{fontFamily:"'Playfair Display',serif",fontSize:hero?30:28,fontWeight:700,lineHeight:1,color:hero?'white':'var(--ink)'}}>{val}</div>
                  <div style={{fontSize:11,color:hero?'rgba(255,255,255,.55)':'var(--muted)',marginTop:5}}>{sub}</div>
                </div>
              ))}
            </div>

            <div style={{background:'var(--card-bg)',backdropFilter:'blur(12px)',border:'1px solid var(--border)',borderRadius:14,padding:'16px 20px',marginBottom:20}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:8,alignItems:'center'}}>
                <span style={{fontSize:11,letterSpacing:'.1em',textTransform:'uppercase',color:'var(--muted)',fontWeight:500}}>Budget Used</span>
                <span style={{fontSize:12,fontWeight:600,color:totalActual>totalEstimated?'#c83030':'var(--deep-rose)'}}>{totalEstimated?Math.round(totalActual/totalEstimated*100):0}%</span>
              </div>
              <div style={{height:8,background:'rgba(200,160,175,.15)',borderRadius:4,overflow:'hidden'}}>
                <div style={{height:'100%',borderRadius:4,background:totalActual>totalEstimated?'#c83030':'linear-gradient(90deg,var(--rose),var(--deep-rose))',width:`${totalEstimated?Math.min(Math.round(totalActual/totalEstimated*100),100):0}%`,transition:'width .6s ease'}}/>
              </div>
              <div style={{display:'flex',justifyContent:'space-between',marginTop:6,fontSize:11,color:'var(--muted)'}}>
                <span>{fmt(totalActual)} spent</span><span>{fmt(totalEstimated)} budget</span>
              </div>
            </div>

            <div style={{background:'var(--card-bg)',backdropFilter:'blur(16px)',border:'1px solid var(--border)',borderRadius:20,overflow:'hidden'}}>
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead><tr>{['#','Expense','Category','Estimated','Actual','Difference','Paid?','Notes',''].map((h,i)=><th key={i} style={{...thStyle,width:h==='#'?36:undefined,textAlign:['Estimated','Actual','Difference'].includes(h)?'right':undefined}}>{h}</th>)}</tr></thead>
                <tbody>{budget.map((b,i)=><BudgetRow key={b.id} b={b} index={i} onSave={saveBudget} onDelete={deleteBudget}/>)}</tbody>
                {budget.length>0&&(
                  <tfoot>
                    <tr style={{background:'rgba(242,207,216,.12)',borderTop:'2px solid var(--border)'}}>
                      <td colSpan={3} style={{...tdStyle,fontWeight:600,fontSize:11,letterSpacing:'.1em',textTransform:'uppercase',color:'var(--muted)'}}>TOTALS</td>
                      <td style={{...tdStyle,textAlign:'right',fontWeight:700,fontFamily:"'Playfair Display',serif",fontSize:15}}>{fmt(totalEstimated)}</td>
                      <td style={{...tdStyle,textAlign:'right',fontWeight:700,fontFamily:"'Playfair Display',serif",fontSize:15}}>{fmt(totalActual)}</td>
                      <td style={{...tdStyle,textAlign:'right',fontWeight:700,color:totalActual>totalEstimated?'#c83030':'#3a6b2a',fontFamily:"'Playfair Display',serif",fontSize:15}}>{totalActual===totalEstimated?'—':(totalActual>totalEstimated?'+':'')+fmt(Math.abs(totalActual-totalEstimated))}</td>
                      <td colSpan={3}/>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
            <button style={addRowBtn} onClick={addBudgetItem}>🌸 Add Expense</button>
          </div>
        )}
      </main>

      {/* ══ INVITED MODAL ══ */}
      {showModal&&(
        <div style={{position:'fixed',inset:0,zIndex:200,background:'rgba(42,31,36,.4)',backdropFilter:'blur(8px)',display:'flex',alignItems:'center',justifyContent:'center',animation:'overlayIn .3s ease both'}} onClick={e=>{if(e.target===e.currentTarget)setShowModal(false);}}>
          <div style={{background:'white',borderRadius:24,width:740,maxWidth:'95vw',maxHeight:'88vh',overflow:'hidden',display:'flex',flexDirection:'column',boxShadow:'0 30px 80px rgba(42,31,36,.25)',animation:'modalIn .35s cubic-bezier(.34,1.56,.64,1) both'}} onClick={e=>e.stopPropagation()}>
            <div style={{padding:'24px 28px 20px',background:'linear-gradient(135deg,var(--deep-rose),var(--mauve))',color:'white'}}>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:24,fontWeight:700,fontStyle:'italic'}}>✨ Invited Guest List</div>
              <div style={{fontSize:11,opacity:.7,marginTop:4,letterSpacing:'.08em'}}>Grade {sortedGrades[0]}–{sortedGrades[sortedGrades.length-1]} · {invitedGuests.length} entries · {totalHeads} total heads</div>
            </div>
            <div style={{padding:'16px 28px 0',borderBottom:'1px solid var(--border)'}}>
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14}}>
                <div style={{flex:1,height:6,background:'rgba(200,160,175,.2)',borderRadius:3,overflow:'hidden'}}>
                  <div style={{height:'100%',borderRadius:3,background:'linear-gradient(90deg,var(--rose),var(--deep-rose))',width:`${invitedGuests.length?Math.round(sentCount/invitedGuests.length*100):0}%`,transition:'width .5s ease'}}/>
                </div>
                <div style={{fontSize:11,color:'var(--muted)',whiteSpace:'nowrap'}}>Invites sent: <strong style={{color:'var(--deep-rose)'}}>{sentCount} / {invitedGuests.length}</strong></div>
              </div>
            </div>
            <div style={{flex:1,overflowY:'auto',padding:'16px 28px'}}>
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead><tr>{['#','Name','Relation','Side','Grade','Heads','Notes','Invite Sent?'].map(h=><th key={h} style={{fontSize:10,letterSpacing:'.18em',textTransform:'uppercase',color:'var(--muted)',fontWeight:500,padding:'10px 12px',textAlign:'left',borderBottom:'1.5px solid var(--border)'}}>{h}</th>)}</tr></thead>
                <tbody>
                  {invitedGuests.map((g,i)=>{
                    const grade=getGrade(calcOverall(g));
                    return(
                      <tr key={g.id} style={{borderBottom:'1px solid rgba(200,160,175,.12)'}}>
                        <td style={{padding:'12px',color:'var(--muted)',fontSize:11}}>{i+1}</td>
                        <td style={{padding:'12px',fontWeight:500}}>{g.name}</td>
                        <td style={{padding:'12px',color:'var(--muted)',fontSize:12}}>{g.relation}</td>
                        <td style={{padding:'12px',fontSize:12,color:g.side==='Oscar'?'#4a6a9c':g.side==='Anay'?'var(--deep-rose)':'var(--ink)',fontWeight:500}}>{g.side}</td>
                        <td style={{padding:'12px'}}><div style={{...gradeBadgeStyle(grade),width:24,height:24,fontSize:12}}>{grade}</div></td>
                        <td style={{padding:'12px',fontWeight:600,color:'var(--deep-rose)',textAlign:'center'}}>{headcount(g)}</td>
                        <td style={{padding:'12px',color:'var(--muted)',fontSize:11,fontStyle:'italic'}}>{g.notes||''}</td>
                        <td style={{padding:'12px',textAlign:'center'}}>
                          <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:7}}>
                            <input type="checkbox" checked={!!g.invite_sent} onChange={e=>saveGuest(g.id,'invite_sent',e.target.checked)} style={{width:18,height:18,accentColor:'var(--deep-rose)',cursor:'pointer'}}/>
                            <span style={{fontSize:11,color:g.invite_sent?'#3a6b2a':'var(--muted)',fontWeight:g.invite_sent?500:400}}>{g.invite_sent?'✓ Sent':'Not sent'}</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div style={{padding:'18px 28px',borderTop:'1px solid var(--border)',display:'flex',gap:10,justifyContent:'flex-end',alignItems:'center'}}>
              <div style={{fontSize:12,color:'var(--muted)',marginRight:'auto'}}><strong style={{color:'var(--deep-rose)',fontSize:15}}>{totalHeads}</strong> guests at your wedding 🌸</div>
              <button style={btnOutline} onClick={()=>setShowModal(false)}>Close</button>
              <button style={btnPrimary} onClick={exportCSV}>⬇ Export CSV</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

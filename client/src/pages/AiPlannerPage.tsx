import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import Navbar from "../components/Layout/Navbar";
import {
  generateItinerary, chatWithAssistant, createNewTripFromItinerary,
  getStoredApiKey, checkAiKeyStatus, type StructuredItinerary, type ApplyProgress,
} from "../services/aiPlannerService";
import { AiKeyModal } from "../components/Planner/AiKeyModal";
import { useToast } from "../components/shared/Toast";
import {
  Sparkles, MapPin, Calendar, Wallet, Cloud, Sun, CloudRain, Snowflake,
  Wind, Utensils, Camera, Music, Backpack, BookOpen, Zap, RefreshCw,
  Clock, Tag, CheckCircle, AlertCircle, Copy, Bot, Send, X,
  ChevronRight, ChevronLeft, Key, Eye, EyeOff, Thermometer,
  DollarSign, FolderPlus, Loader2, RotateCcw, Shield,
} from "lucide-react";

const BUDGET_OPTIONS = [
  { id: "budget", label: "Budget",   icon: "🎒", desc: "Backpacker-friendly" },
  { id: "mid",    label: "Mid-range", icon: "🏨", desc: "Comfortable & balanced" },
  { id: "luxury", label: "Luxury",   icon: "💎", desc: "Premium experience" },
];
const STYLE_OPTIONS = [
  { id: "solo",   label: "Solo",   icon: "🧍" },
  { id: "couple", label: "Couple", icon: "👫" },
  { id: "family", label: "Family", icon: "👨‍👩‍👧" },
  { id: "group",  label: "Group",  icon: "👥" },
];
const WEATHER_OPTIONS = [
  { id: "summer",  label: "Summer",  Icon: Sun,         color: "#f59e0b" },
  { id: "monsoon", label: "Monsoon", Icon: CloudRain,   color: "#3b82f6" },
  { id: "winter",  label: "Winter",  Icon: Snowflake,   color: "#60a5fa" },
  { id: "spring",  label: "Spring",  Icon: Wind,        color: "#34d399" },
  { id: "autumn",  label: "Autumn",  Icon: Thermometer, color: "#f97316" },
];
const INTEREST_OPTIONS = [
  { id: "culture",     label: "Culture & Heritage",  Icon: BookOpen },
  { id: "food",        label: "Food & Cuisine",       Icon: Utensils },
  { id: "adventure",   label: "Adventure & Trekking", Icon: Backpack },
  { id: "photography", label: "Photography",          Icon: Camera },
  { id: "nightlife",   label: "Nightlife & Music",    Icon: Music },
  { id: "nature",      label: "Nature & Wildlife",    Icon: Zap },
];
const CURRENCY_OPTIONS = ["INR","USD","EUR","GBP","AED","SGD","JPY","AUD"];
const SLOT_STYLES: Record<string,{bg:string;text:string;label:string}> = {
  morning:   { bg:"rgba(251,191,36,0.15)",  text:"#fbbf24", label:"Morning"   },
  afternoon: { bg:"rgba(251,146,60,0.15)",  text:"#fb923c", label:"Afternoon" },
  evening:   { bg:"rgba(167,139,250,0.15)", text:"#a78bfa", label:"Evening"   },
};
const BAR_COLORS = ["#6366f1","#8b5cf6","#a78bfa","#c084fc","#e879f9","#f472b6"];

function fmtCur(amount:number,currency:string){
  try{ return new Intl.NumberFormat("en-IN",{style:"currency",currency,maximumFractionDigits:0}).format(amount); }
  catch{ return `${currency} ${amount.toLocaleString()}`; }
}

function Chip({selected,onClick,children,color}:{selected:boolean;onClick:()=>void;children:React.ReactNode;color?:string}){
  return(
    <button onClick={onClick} type="button" style={{
      padding:"7px 14px",borderRadius:24,cursor:"pointer",fontSize:13,outline:"none",
      border:selected?`1.5px solid ${color||"#6366f1"}`:"1.5px solid rgba(255,255,255,0.12)",
      background:selected?`${color||"#6366f1"}22`:"rgba(255,255,255,0.04)",
      color:selected?(color||"#a78bfa"):"rgba(255,255,255,0.65)",
      fontWeight:selected?600:400,transition:"all 0.2s",
    }}>{children}</button>
  );
}

function StepDot({n,active,done}:{n:number;active:boolean;done:boolean}){
  return(
    <div style={{
      width:34,height:34,borderRadius:"50%",flexShrink:0,
      display:"flex",alignItems:"center",justifyContent:"center",
      fontSize:13,fontWeight:700,transition:"all 0.3s",
      background:active?"linear-gradient(135deg,#6366f1,#a855f7)":done?"#22c55e":"rgba(255,255,255,0.08)",
      border:active?"2px solid #a855f7":done?"2px solid #22c55e":"2px solid rgba(255,255,255,0.15)",
      color:active||done?"#fff":"rgba(255,255,255,0.4)",
    }}>
      {done?<CheckCircle size={16}/>:n}
    </div>
  );
}

function ActivityRow({act,currency}:{act:any;currency:string}){
  const slot=SLOT_STYLES[act.timeSlot]||SLOT_STYLES.morning;
  return(
    <div style={{background:"rgba(255,255,255,0.035)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:12,padding:"12px 14px",marginBottom:9}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
        <div style={{flex:1}}>
          <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:4,flexWrap:"wrap" as const}}>
            <span style={{fontSize:10,fontWeight:700,padding:"2px 9px",borderRadius:20,background:slot.bg,color:slot.text}}>{slot.label}</span>
            {act.time&&<span style={{fontSize:11,color:"rgba(255,255,255,0.38)"}}><Clock size={10} style={{display:"inline" as const,marginRight:3}}/>{act.time}</span>}
            {act.duration&&<span style={{fontSize:11,color:"rgba(255,255,255,0.38)"}}>· {act.duration}</span>}
          </div>
          <div style={{fontSize:14,fontWeight:700,color:"#fff",marginBottom:3}}>{act.name}</div>
          <div style={{fontSize:12,color:"rgba(255,255,255,0.55)",lineHeight:1.5}}>{act.description}</div>
        </div>
        {!!act.estimatedCost&&act.estimatedCost>0&&(
          <div style={{fontSize:12,fontWeight:700,color:"#4ade80",background:"rgba(74,222,128,0.1)",borderRadius:10,padding:"3px 9px",whiteSpace:"nowrap" as const}}>
            ~{fmtCur(act.estimatedCost,currency)}
          </div>
        )}
      </div>
      {act.category&&<div style={{marginTop:7}}><span style={{fontSize:10,color:"rgba(255,255,255,0.35)",background:"rgba(255,255,255,0.06)",padding:"2px 7px",borderRadius:7}}><Tag size={8} style={{display:"inline" as const,marginRight:3}}/>{act.category}</span></div>}
    </div>
  );
}

function DayCard({day,currency}:{day:any;currency:string}){
  const [open,setOpen]=useState(true);
  return(
    <div style={{background:"rgba(255,255,255,0.025)",border:"1px solid rgba(255,255,255,0.09)",borderRadius:16,overflow:"hidden",marginBottom:14}}>
      <button onClick={()=>setOpen(o=>!o)} type="button" style={{width:"100%",display:"flex",alignItems:"center",gap:12,padding:"14px 18px",background:"none",border:"none",cursor:"pointer",textAlign:"left" as const}}>
        <div style={{width:40,height:40,borderRadius:11,background:"linear-gradient(135deg,#6366f1,#a855f7)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:14,fontWeight:800,color:"#fff"}}>D{day.dayNumber}</div>
        <div style={{flex:1}}>
          <div style={{fontSize:14,fontWeight:700,color:"#fff"}}>{day.title}</div>
          {day.weatherNote&&<div style={{fontSize:11,color:"#60a5fa",marginTop:2}}><Cloud size={10} style={{display:"inline" as const,marginRight:4}}/>{day.weatherNote}</div>}
        </div>
        <ChevronRight size={16} style={{color:"rgba(255,255,255,0.35)",transform:open?"rotate(90deg)":"rotate(0deg)",transition:"transform 0.2s"}}/>
      </button>
      {open&&(
        <div style={{padding:"0 14px 14px"}}>
          {day.activities.map((a:any,i:number)=><ActivityRow key={i} act={a} currency={currency}/>)}
        </div>
      )}
    </div>
  );
}

function BudgetBars({items,total,currency}:{items:any[];total:number;currency:string}){
  return(
    <div style={{display:"flex",flexDirection:"column" as const,gap:14}}>
      {items.map((item,i)=>{
        const pct=total>0?Math.round((item.amount/total)*100):0;
        return(
          <div key={i}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:5,fontSize:13}}>
              <span style={{color:"rgba(255,255,255,0.8)",fontWeight:500}}>{item.name}</span>
              <span style={{color:BAR_COLORS[i%BAR_COLORS.length],fontWeight:700}}>{fmtCur(item.amount,currency)} <span style={{color:"rgba(255,255,255,0.35)",fontWeight:400}}>({pct}%)</span></span>
            </div>
            <div style={{height:6,borderRadius:6,background:"rgba(255,255,255,0.08)",overflow:"hidden"}}>
              <div style={{width:`${pct}%`,height:"100%",borderRadius:6,transition:"width 1s cubic-bezier(.4,0,.2,1)",background:`linear-gradient(90deg,${BAR_COLORS[i%BAR_COLORS.length]},${BAR_COLORS[(i+1)%BAR_COLORS.length]})`}}/>
            </div>
          </div>
        );
      })}
      <div style={{marginTop:6,padding:"14px 18px",borderRadius:14,background:"linear-gradient(135deg,rgba(99,102,241,0.18),rgba(168,85,247,0.18))",border:"1px solid rgba(168,85,247,0.3)",textAlign:"center" as const}}>
        <div style={{fontSize:11,color:"rgba(255,255,255,0.5)",marginBottom:4}}>Total Estimated Budget</div>
        <div style={{fontSize:26,fontWeight:800,color:"#a78bfa"}}>{fmtCur(total,currency)}</div>
      </div>
    </div>
  );
}

export default function AiPlannerPage(){
  const navigate=useNavigate();
  const toast=useToast();
  const [formPage,setFormPage]=useState(0);
  const [destination,setDestination]=useState("");
  const [days,setDays]=useState(5);
  const [startDate,setStartDate]=useState("");
  const [weather,setWeather]=useState("summer");
  const [travelStyle,setTravelStyle]=useState("couple");
  const [budget,setBudget]=useState("mid");
  const [currency,setCurrency]=useState("INR");
  const [interests,setInterests]=useState<string[]>(["culture","food"]);
  const [showKey,setShowKey]=useState(false);
  const [apiKeyInput,setApiKeyInput]=useState(()=>getStoredApiKey()||"");
  const [keyModalOpen,setKeyModalOpen]=useState(false);
  const [keyStatus,setKeyStatus]=useState<{configured:boolean;source:string}>({configured:false,source:"none"});
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState<string|null>(null);
  const [itinerary,setItinerary]=useState<StructuredItinerary|null>(null);
  const [viewMode,setViewMode]=useState<"days"|"budget"|"tips"|"markdown">("days");
  const [activeDay,setActiveDay]=useState<number|null>(null);
  const [applying,setApplying]=useState(false);
  const [applyProgress,setApplyProgress]=useState<ApplyProgress|null>(null);
  const [chatOpen,setChatOpen]=useState(false);
  const [chatInput,setChatInput]=useState("");
  const [chatMsgs,setChatMsgs]=useState<Array<{role:"user"|"assistant";content:string;id:string}>>([
    {role:"assistant",id:"init",content:"Hi! I am TripMate AI.\n\nGenerate your itinerary first, then ask me anything — packing tips, local food, hidden gems, budget hacks!"},
  ]);
  const [chatLoading,setChatLoading]=useState(false);
  const chatEndRef=useRef<HTMLDivElement>(null);
  const chatInputRef=useRef<HTMLInputElement>(null);

  useEffect(()=>{chatEndRef.current?.scrollIntoView({behavior:"smooth"});},[chatMsgs]);
  useEffect(()=>{checkAiKeyStatus().then(setKeyStatus);},[]);

  const toggleInterest=(id:string)=>setInterests(prev=>prev.includes(id)?prev.filter(i=>i!==id):[...prev,id]);

  const generate=useCallback(async()=>{
    if(!destination.trim()){setError("Please enter a destination.");return;}
    setLoading(true);setError(null);
    try{
      const result=await generateItinerary({destination:destination.trim(),days,budget,currency,weather,travelStyle,interests,startDate:startDate||undefined});
      setItinerary(result);
      toast.success("Itinerary generated!");
    }catch(e:unknown){
      const msg=(e instanceof Error?e.message:String(e))||"Generation failed. Check your API key.";
      setError(msg);
      if(msg.toLowerCase().includes("key"))setKeyModalOpen(true);
    }finally{setLoading(false);}
  },[destination,days,budget,currency,weather,travelStyle,interests,startDate,toast]);

  const applyToNewTrip=useCallback(async()=>{
    if(!itinerary)return;
    setApplying(true);setApplyProgress(null);
    try{
      const trip=await createNewTripFromItinerary(itinerary,startDate||undefined,setApplyProgress);
      toast.success(`Trip created!`);
      setTimeout(()=>navigate(`/trips/${trip.id}`),800);
    }catch(e:unknown){
      toast.error((e instanceof Error?e.message:String(e))||"Failed");
    }finally{setApplying(false);setApplyProgress(null);}
  },[itinerary,startDate,navigate,toast]);

  const sendChat=useCallback(async()=>{
    const text=chatInput.trim();
    if(!text||chatLoading)return;
    const uid=Date.now().toString();
    const aid=(Date.now()+1).toString();
    setChatMsgs(prev=>[...prev,{role:"user",id:uid,content:text},{role:"assistant",id:aid,content:""}]);
    setChatInput("");setChatLoading(true);
    try{
      const history=chatMsgs.filter(m=>m.id!=="init").concat({role:"user",id:uid,content:text}).map(m=>({role:m.role,content:m.content}));
      const ctx=itinerary?{destination:itinerary.destination,days:itinerary.daysCount,weather,budget,currency}:undefined;
      const reply=await chatWithAssistant(history,ctx as Record<string,unknown>|undefined);
      setChatMsgs(prev=>prev.map(m=>m.id===aid?{...m,content:reply}:m));
    }catch{
      setChatMsgs(prev=>prev.map(m=>m.id===aid?{...m,content:"Error: Check your Gemini API key."}:m));
    }finally{setChatLoading(false);chatInputRef.current?.focus();}
  },[chatInput,chatLoading,chatMsgs,itinerary,weather,budget,currency]);

  const copyMarkdown=()=>{if(itinerary)navigator.clipboard.writeText(itinerary.markdown).then(()=>toast.success("Copied!"));};

  const inputSt:React.CSSProperties={width:"100%",background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.14)",borderRadius:12,padding:"13px 15px",color:"#fff",fontSize:14,outline:"none",boxSizing:"border-box"};
  const labelSt:React.CSSProperties={display:"block",fontSize:12,color:"rgba(255,255,255,0.55)",marginBottom:8,fontWeight:500};
  const card:React.CSSProperties={background:"rgba(255,255,255,0.04)",backdropFilter:"blur(20px)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:22,padding:"28px 24px"};

  return(
    <div style={{minHeight:"100vh",background:"linear-gradient(135deg,#0a0a0f 0%,#0d0a1a 40%,#0a0f1a 100%)",fontFamily:"Inter,-apple-system,sans-serif",color:"#fff",position:"relative",overflow:"hidden"}}>
      <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,pointerEvents:"none",zIndex:0}}>
        <div style={{position:"absolute",top:"8%",left:"8%",width:380,height:380,borderRadius:"50%",background:"radial-gradient(circle,rgba(99,102,241,0.11),transparent 70%)",filter:"blur(40px)"}}/>
        <div style={{position:"absolute",top:"45%",right:"4%",width:280,height:280,borderRadius:"50%",background:"radial-gradient(circle,rgba(168,85,247,0.09),transparent 70%)",filter:"blur(40px)"}}/>
        <div style={{position:"absolute",bottom:"12%",left:"28%",width:320,height:320,borderRadius:"50%",background:"radial-gradient(circle,rgba(236,72,153,0.07),transparent 70%)",filter:"blur(50px)"}}/>
      </div>
      <div style={{position:"relative",zIndex:1}}>
        <Navbar/>
        {!itinerary?(
          <div style={{maxWidth:660,margin:"0 auto",padding:"36px 20px 120px"}}>
            <div style={{textAlign:"center",marginBottom:44}}>
              <div style={{display:"inline-flex",alignItems:"center",gap:8,background:"rgba(168,85,247,0.14)",border:"1px solid rgba(168,85,247,0.28)",borderRadius:28,padding:"7px 18px",marginBottom:18}}>
                <Sparkles size={14} style={{color:"#a855f7"}}/>
                <span style={{fontSize:12,color:"#a78bfa",fontWeight:600}}>Powered by Google Gemini</span>
              </div>
              <h1 style={{fontSize:"clamp(30px,5vw,50px)",fontWeight:800,margin:0,lineHeight:1.1}}>
                <span style={{background:"linear-gradient(135deg,#6366f1,#a855f7,#ec4899)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>AI Trip Planner</span>
              </h1>
              <p style={{fontSize:15,color:"rgba(255,255,255,0.5)",marginTop:10}}>Personalized itinerary · Weather-smart · Budget-aware</p>
            </div>
            <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:6,marginBottom:36}}>
              {["Destination","Style & Budget","Interests"].map((label,i)=>(
                <React.Fragment key={i}>
                  <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:5,cursor:"pointer"}} onClick={()=>setFormPage(i)}>
                    <StepDot n={i+1} active={formPage===i} done={formPage>i}/>
                    <span style={{fontSize:10,color:formPage===i?"#a78bfa":"rgba(255,255,255,0.3)",fontWeight:formPage===i?600:400}}>{label}</span>
                  </div>
                  {i<2&&<div style={{width:40,height:1,background:formPage>i?"#6366f1":"rgba(255,255,255,0.1)",transition:"background 0.3s",marginBottom:20}}/>}
                </React.Fragment>
              ))}
            </div>
            <div style={card}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20,padding:"8px 12px",borderRadius:10,background:keyStatus.configured?"rgba(34,197,94,0.08)":"rgba(239,68,68,0.08)",border:`1px solid ${keyStatus.configured?"rgba(34,197,94,0.25)":"rgba(239,68,68,0.25)"}`}}>
                <div style={{display:"flex",alignItems:"center",gap:7,fontSize:12,color:keyStatus.configured?"#4ade80":"#f87171"}}>
                  <Shield size={13}/>{keyStatus.configured?`Gemini key active (${keyStatus.source})`:"Gemini API key not configured"}
                </div>
                <button onClick={()=>setKeyModalOpen(true)} type="button" style={{background:"none",border:"none",cursor:"pointer",fontSize:12,color:keyStatus.configured?"#4ade80":"#f87171",fontWeight:600,display:"flex",alignItems:"center",gap:5}}>
                  <Key size={12}/>{keyStatus.configured?"Change":"Set Key"}
                </button>
              </div>
              {formPage===0&&(
                <div style={{display:"flex",flexDirection:"column",gap:20}}>
                  <div>
                    <label style={labelSt}><MapPin size={12} style={{display:"inline",marginRight:5,color:"#a78bfa"}}/>Destination *</label>
                    <input value={destination} onChange={e=>setDestination(e.target.value)} placeholder="e.g. Goa, Paris, Manali…" style={inputSt} onKeyDown={e=>e.key==="Enter"&&setFormPage(1)}/>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                    <div>
                      <label style={labelSt}><Calendar size={12} style={{display:"inline",marginRight:5,color:"#a78bfa"}}/>Number of Days</label>
                      <div style={{display:"flex",alignItems:"center",gap:10}}>
                        <button onClick={()=>setDays(d=>Math.max(1,d-1))} type="button" style={{width:34,height:34,borderRadius:9,background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.12)",color:"#fff",cursor:"pointer",fontSize:18}}>-</button>
                        <span style={{fontSize:22,fontWeight:800,color:"#a78bfa",minWidth:30,textAlign:"center"}}>{days}</span>
                        <button onClick={()=>setDays(d=>Math.min(30,d+1))} type="button" style={{width:34,height:34,borderRadius:9,background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.12)",color:"#fff",cursor:"pointer",fontSize:18}}>+</button>
                      </div>
                    </div>
                    <div>
                      <label style={labelSt}><Calendar size={12} style={{display:"inline",marginRight:5,color:"#a78bfa"}}/>Start Date (optional)</label>
                      <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} style={{...inputSt,padding:"10px 13px",colorScheme:"dark"}}/>
                    </div>
                  </div>
                  <div>
                    <label style={labelSt}><Cloud size={12} style={{display:"inline",marginRight:5,color:"#a78bfa"}}/>Season / Weather</label>
                    <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                      {WEATHER_OPTIONS.map(opt=>{const sel=weather===opt.id;const Ic=opt.Icon;return(
                        <button key={opt.id} type="button" onClick={()=>setWeather(opt.id)} style={{display:"flex",alignItems:"center",gap:6,padding:"7px 13px",borderRadius:18,border:sel?`1.5px solid ${opt.color}`:"1.5px solid rgba(255,255,255,0.1)",background:sel?`${opt.color}22`:"rgba(255,255,255,0.04)",color:sel?opt.color:"rgba(255,255,255,0.55)",cursor:"pointer",fontSize:12,fontWeight:sel?600:400}}>
                          <Ic size={13}/>{opt.label}
                        </button>
                      );})}
                    </div>
                  </div>
                </div>
              )}
              {formPage===1&&(
                <div style={{display:"flex",flexDirection:"column",gap:20}}>
                  <div>
                    <label style={labelSt}>Travel Style</label>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9}}>
                      {STYLE_OPTIONS.map(opt=>{const sel=travelStyle===opt.id;return(
                        <button key={opt.id} type="button" onClick={()=>setTravelStyle(opt.id)} style={{padding:"13px",borderRadius:13,border:sel?"1.5px solid #6366f1":"1.5px solid rgba(255,255,255,0.1)",background:sel?"rgba(99,102,241,0.14)":"rgba(255,255,255,0.04)",color:sel?"#a78bfa":"rgba(255,255,255,0.55)",cursor:"pointer",fontSize:12,fontWeight:sel?700:400,display:"flex",alignItems:"center",justifyContent:"center",gap:7}}>
                          <span style={{fontSize:18}}>{opt.icon}</span>{opt.label}
                        </button>
                      );})}
                    </div>
                  </div>
                  <div>
                    <label style={labelSt}><Wallet size={12} style={{display:"inline",marginRight:5,color:"#a78bfa"}}/>Budget Level</label>
                    <div style={{display:"flex",flexDirection:"column",gap:9}}>
                      {BUDGET_OPTIONS.map(opt=>{const sel=budget===opt.id;return(
                        <button key={opt.id} type="button" onClick={()=>setBudget(opt.id)} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 15px",borderRadius:13,border:sel?"1.5px solid #6366f1":"1.5px solid rgba(255,255,255,0.1)",background:sel?"rgba(99,102,241,0.12)":"rgba(255,255,255,0.04)",cursor:"pointer",textAlign:"left"}}>
                          <span style={{fontSize:20}}>{opt.icon}</span>
                          <div style={{flex:1}}>
                            <div style={{fontSize:12,fontWeight:sel?700:500,color:sel?"#a78bfa":"#fff"}}>{opt.label}</div>
                            <div style={{fontSize:11,color:"rgba(255,255,255,0.4)"}}>{opt.desc}</div>
                          </div>
                          {sel&&<CheckCircle size={15} style={{color:"#6366f1"}}/>}
                        </button>
                      );})}
                    </div>
                  </div>
                  <div>
                    <label style={labelSt}><DollarSign size={12} style={{display:"inline",marginRight:5,color:"#a78bfa"}}/>Currency</label>
                    <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
                      {CURRENCY_OPTIONS.map(c=><Chip key={c} selected={currency===c} onClick={()=>setCurrency(c)}>{c}</Chip>)}
                    </div>
                  </div>
                </div>
              )}
              {formPage===2&&(
                <div style={{display:"flex",flexDirection:"column",gap:20}}>
                  <div>
                    <label style={labelSt}>Interests <span style={{color:"rgba(255,255,255,0.3)"}}>(select any)</span></label>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9}}>
                      {INTEREST_OPTIONS.map(opt=>{const sel=interests.includes(opt.id);const Ic=opt.Icon;return(
                        <button key={opt.id} type="button" onClick={()=>toggleInterest(opt.id)} style={{display:"flex",alignItems:"center",gap:9,padding:"11px 13px",borderRadius:13,border:sel?"1.5px solid #a855f7":"1.5px solid rgba(255,255,255,0.1)",background:sel?"rgba(168,85,247,0.12)":"rgba(255,255,255,0.04)",color:sel?"#a78bfa":"rgba(255,255,255,0.55)",cursor:"pointer",fontSize:12,fontWeight:sel?600:400}}>
                          <Ic size={15}/>{opt.label}
                        </button>
                      );})}
                    </div>
                  </div>
                  <div style={{borderTop:"1px solid rgba(255,255,255,0.08)",paddingTop:18}}>
                    <label style={labelSt}><Key size={12} style={{display:"inline",marginRight:5,color:"#a78bfa"}}/>Gemini API Key <span style={{color:"rgba(255,255,255,0.3)"}}>(or set in server .env)</span></label>
                    <div style={{position:"relative"}}>
                      <input type={showKey?"text":"password"} value={apiKeyInput} onChange={e=>setApiKeyInput(e.target.value)} placeholder="AIza..." style={{...inputSt,padding:"12px 42px 12px 14px",fontFamily:"monospace"}}/>
                      <button onClick={()=>setShowKey(s=>!s)} type="button" style={{position:"absolute",right:11,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:"rgba(255,255,255,0.4)",cursor:"pointer",padding:4}}>
                        {showKey?<EyeOff size={15}/>:<Eye size={15}/>}
                      </button>
                    </div>
                    <div style={{fontSize:11,color:"rgba(255,255,255,0.3)",marginTop:5}}>Free key at <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" style={{color:"#6366f1"}}>aistudio.google.com</a>. Or set GEMINI_API_KEY in server/.env.</div>
                  </div>
                </div>
              )}
              <div style={{display:"flex",gap:10,marginTop:24}}>
                {formPage>0&&(
                  <button type="button" onClick={()=>setFormPage(p=>p-1)} style={{display:"flex",alignItems:"center",gap:5,padding:"11px 18px",borderRadius:11,background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",color:"rgba(255,255,255,0.7)",cursor:"pointer",fontSize:13}}>
                    <ChevronLeft size={15}/>Back
                  </button>
                )}
                {formPage<2?(
                  <button type="button" onClick={()=>{if(formPage===0&&!destination.trim()){setError("Enter a destination.");return;}setError(null);setFormPage(p=>p+1);}} style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:7,padding:"13px",borderRadius:11,border:"none",cursor:"pointer",fontSize:14,fontWeight:700,background:"linear-gradient(135deg,#6366f1,#a855f7)",color:"#fff"}}>
                    Next<ChevronRight size={15}/>
                  </button>
                ):(
                  <button type="button" onClick={generate} disabled={loading} style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:9,padding:"14px",borderRadius:11,border:"none",cursor:loading?"wait":"pointer",fontSize:14,fontWeight:700,color:"#fff",background:loading?"rgba(99,102,241,0.4)":"linear-gradient(135deg,#6366f1,#a855f7)"}}>
                    {loading?<><RefreshCw size={16} style={{animation:"spin 1s linear infinite"}}/>Generating...</>:<><Sparkles size={16}/>Generate Itinerary</>}
                  </button>
                )}
              </div>
              {error&&<div style={{marginTop:14,padding:"11px 14px",borderRadius:11,background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.28)",color:"#f87171",fontSize:12,display:"flex",alignItems:"center",gap:7}}><AlertCircle size={14}/>{error}</div>}
            </div>
          </div>
        ):(
          <div style={{maxWidth:900,margin:"0 auto",padding:"30px 18px 120px"}}>
            <button type="button" onClick={()=>setItinerary(null)} style={{display:"flex",alignItems:"center",gap:5,background:"none",border:"none",color:"rgba(255,255,255,0.45)",cursor:"pointer",fontSize:12,marginBottom:18,padding:0}}>
              <ChevronLeft size={13}/>New plan
            </button>
            <div style={{background:"linear-gradient(135deg,rgba(99,102,241,0.18),rgba(168,85,247,0.14))",border:"1px solid rgba(168,85,247,0.28)",borderRadius:22,padding:"22px 22px 18px",marginBottom:20,position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",top:-30,right:-30,width:130,height:130,background:"radial-gradient(circle,rgba(168,85,247,0.25),transparent 70%)",pointerEvents:"none"}}/>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:12}}>
                <div>
                  <div style={{fontSize:11,color:"#a78bfa",fontWeight:600,marginBottom:4,textTransform:"uppercase",letterSpacing:1}}>AI Itinerary</div>
                  <h2 style={{margin:0,fontSize:24,fontWeight:800,color:"#fff"}}><MapPin size={17} style={{display:"inline",marginRight:6,color:"#a78bfa"}}/>{itinerary.destination}</h2>
                  <div style={{display:"flex",gap:12,marginTop:7,flexWrap:"wrap"}}>
                    <span style={{fontSize:12,color:"rgba(255,255,255,0.5)"}}><Calendar size={10} style={{display:"inline",marginRight:3}}/>{itinerary.daysCount} days</span>
                    <span style={{fontSize:12,color:"rgba(255,255,255,0.5)"}}><Wallet size={10} style={{display:"inline",marginRight:3}}/>{budget} . {currency}</span>
                    <span style={{fontSize:12,color:"rgba(255,255,255,0.5)"}}><Cloud size={10} style={{display:"inline",marginRight:3}}/>{weather}</span>
                  </div>
                </div>
                <div style={{display:"flex",gap:7,alignItems:"center",flexWrap:"wrap"}}>
                  <button type="button" onClick={copyMarkdown} title="Copy" style={{width:34,height:34,borderRadius:9,background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.1)",color:"rgba(255,255,255,0.55)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><Copy size={13}/></button>
                  <button type="button" onClick={generate} title="Regenerate" style={{width:34,height:34,borderRadius:9,background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.1)",color:"rgba(255,255,255,0.55)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><RotateCcw size={13}/></button>
                  <button type="button" onClick={applyToNewTrip} disabled={applying} style={{display:"flex",alignItems:"center",gap:7,padding:"8px 14px",borderRadius:10,border:"none",background:applying?"rgba(34,197,94,0.35)":"linear-gradient(135deg,#22c55e,#16a34a)",color:"#fff",fontWeight:700,fontSize:12,cursor:applying?"not-allowed":"pointer"}}>
                    {applying?<><Loader2 size={13} style={{animation:"spin 1s linear infinite"}}/>{applyProgress?.step||"Applying..."}</>:<><FolderPlus size={13}/>Create Trip</>}
                  </button>
                </div>
              </div>
              <p style={{margin:"12px 0 0",fontSize:13,color:"rgba(255,255,255,0.62)",lineHeight:1.6}}>{itinerary.summary}</p>
              {itinerary.weatherForecast&&<div style={{marginTop:10,padding:"8px 12px",borderRadius:10,background:"rgba(96,165,250,0.1)",border:"1px solid rgba(96,165,250,0.2)",fontSize:12,color:"#93c5fd"}}><Cloud size={11} style={{display:"inline",marginRight:4}}/>{itinerary.weatherForecast}</div>}
              {applying&&applyProgress&&(
                <div style={{marginTop:10}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:4,fontSize:11,color:"rgba(255,255,255,0.5)"}}><span>{applyProgress.step}</span><span>{applyProgress.percent}%</span></div>
                  <div style={{height:4,borderRadius:4,background:"rgba(255,255,255,0.08)"}}><div style={{height:"100%",borderRadius:4,background:"linear-gradient(90deg,#22c55e,#4ade80)",width:`${applyProgress.percent}%`,transition:"width 0.3s"}}/></div>
                </div>
              )}
            </div>
            <div style={{display:"flex",gap:7,marginBottom:18,flexWrap:"wrap"}}>
              {(["days","budget","tips","markdown"] as const).map(tab=>(
                <button key={tab} type="button" onClick={()=>setViewMode(tab)} style={{padding:"7px 16px",borderRadius:16,border:viewMode===tab?"1.5px solid #6366f1":"1.5px solid rgba(255,255,255,0.1)",background:viewMode===tab?"rgba(99,102,241,0.18)":"rgba(255,255,255,0.04)",color:viewMode===tab?"#a78bfa":"rgba(255,255,255,0.45)",cursor:"pointer",fontSize:12,fontWeight:viewMode===tab?700:400}}>
                  {tab==="days"?"Day-by-Day":tab==="budget"?"Budget":tab==="tips"?"Packing Tips":"Markdown"}
                </button>
              ))}
            </div>
            {viewMode==="days"&&(
              <div>
                <div style={{display:"flex",gap:6,marginBottom:14,overflowX:"auto",paddingBottom:3}}>
                  <button type="button" onClick={()=>setActiveDay(null)} style={{padding:"5px 12px",borderRadius:12,fontSize:11,fontWeight:600,cursor:"pointer",border:activeDay===null?"1.5px solid #6366f1":"1.5px solid rgba(255,255,255,0.1)",background:activeDay===null?"rgba(99,102,241,0.18)":"rgba(255,255,255,0.04)",color:activeDay===null?"#a78bfa":"rgba(255,255,255,0.38)",whiteSpace:"nowrap"}}>All</button>
                  {itinerary.days.map(d=>(
                    <button key={d.dayNumber} type="button" onClick={()=>setActiveDay(d.dayNumber)} style={{padding:"5px 12px",borderRadius:12,fontSize:11,fontWeight:600,cursor:"pointer",border:activeDay===d.dayNumber?"1.5px solid #a855f7":"1.5px solid rgba(255,255,255,0.1)",background:activeDay===d.dayNumber?"rgba(168,85,247,0.18)":"rgba(255,255,255,0.04)",color:activeDay===d.dayNumber?"#c084fc":"rgba(255,255,255,0.38)",whiteSpace:"nowrap"}}>D{d.dayNumber}</button>
                  ))}
                </div>
                {itinerary.days.filter(d=>activeDay===null||d.dayNumber===activeDay).map(day=>(
                  <DayCard key={day.dayNumber} day={day} currency={itinerary!.currency}/>
                ))}
              </div>
            )}
            {viewMode==="budget"&&<div style={{background:"rgba(255,255,255,0.025)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:18,padding:"22px 20px"}}><h3 style={{margin:"0 0 20px",fontSize:16,fontWeight:700,color:"#fff"}}>Budget Breakdown</h3><BudgetBars items={itinerary.budgetBreakdown} total={itinerary.totalEstimatedBudget} currency={itinerary.currency}/></div>}
            {viewMode==="tips"&&(
              <div style={{background:"rgba(255,255,255,0.025)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:18,padding:"22px 20px"}}>
                <h3 style={{margin:"0 0 16px",fontSize:16,fontWeight:700,color:"#fff"}}>Packing Tips</h3>
                <div style={{display:"flex",flexDirection:"column",gap:9}}>
                  {itinerary.packingTips.map((tip,i)=>(
                    <div key={i} style={{display:"flex",alignItems:"flex-start",gap:10,padding:"10px 13px",borderRadius:10,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.06)"}}>
                      <CheckCircle size={14} style={{color:"#4ade80",flexShrink:0,marginTop:1}}/><span style={{fontSize:12,color:"rgba(255,255,255,0.75)",lineHeight:1.5}}>{tip}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {viewMode==="markdown"&&(
              <div style={{background:"rgba(255,255,255,0.025)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:18,overflow:"hidden"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 16px",borderBottom:"1px solid rgba(255,255,255,0.06)"}}>
                  <span style={{fontSize:12,fontWeight:600,color:"rgba(255,255,255,0.65)"}}>Raw Markdown</span>
                  <button type="button" onClick={copyMarkdown} style={{display:"flex",alignItems:"center",gap:5,padding:"5px 11px",borderRadius:7,background:"rgba(99,102,241,0.18)",border:"1px solid rgba(99,102,241,0.28)",color:"#a78bfa",cursor:"pointer",fontSize:11,fontWeight:600}}><Copy size={11}/>Copy</button>
                </div>
                <pre style={{margin:0,padding:"16px",color:"rgba(255,255,255,0.6)",fontSize:11,lineHeight:1.7,overflowX:"auto",maxHeight:560,whiteSpace:"pre-wrap",wordBreak:"break-word"}}>{itinerary.markdown}</pre>
              </div>
            )}
          </div>
        )}
      </div>
      {!chatOpen&&(
        <button type="button" onClick={()=>setChatOpen(true)} title="Chat with TripMate AI" style={{position:"fixed",bottom:24,right:24,zIndex:200,width:56,height:56,borderRadius:"50%",border:"none",cursor:"pointer",background:"linear-gradient(135deg,#6366f1,#a855f7)",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 8px 28px rgba(99,102,241,0.5)"}}>
          <Bot size={24} color="#fff"/>
          <div style={{position:"absolute",top:0,right:0,width:13,height:13,borderRadius:"50%",background:"#22c55e",border:"2px solid #0a0a0f"}}/>
        </button>
      )}
      {chatOpen&&(
        <div style={{position:"fixed",bottom:20,right:20,zIndex:300,width:340,height:490,borderRadius:18,overflow:"hidden",background:"rgba(13,10,26,0.97)",backdropFilter:"blur(22px)",border:"1px solid rgba(168,85,247,0.28)",boxShadow:"0 20px 60px rgba(0,0,0,0.8)",display:"flex",flexDirection:"column"}}>
          <div style={{display:"flex",alignItems:"center",gap:9,padding:"12px 14px",borderBottom:"1px solid rgba(255,255,255,0.07)",background:"linear-gradient(135deg,rgba(99,102,241,0.18),rgba(168,85,247,0.13))"}}>
            <div style={{width:32,height:32,borderRadius:"50%",background:"linear-gradient(135deg,#6366f1,#a855f7)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Bot size={16} color="#fff"/></div>
            <div style={{flex:1}}><div style={{fontSize:13,fontWeight:700,color:"#fff"}}>TripMate AI</div><div style={{fontSize:10,color:"#4ade80"}}>Online</div></div>
            <button type="button" onClick={()=>setChatOpen(false)} style={{background:"none",border:"none",color:"rgba(255,255,255,0.4)",cursor:"pointer",padding:3}}><X size={16}/></button>
          </div>
          <div style={{flex:1,overflowY:"auto",padding:"11px 11px 5px",display:"flex",flexDirection:"column",gap:9}}>
            {chatMsgs.map(msg=>(
              <div key={msg.id} style={{display:"flex",justifyContent:msg.role==="user"?"flex-end":"flex-start"}}>
                <div style={{maxWidth:"83%",padding:"9px 12px",borderRadius:msg.role==="user"?"16px 16px 3px 16px":"16px 16px 16px 3px",background:msg.role==="user"?"linear-gradient(135deg,#6366f1,#a855f7)":"rgba(255,255,255,0.07)",border:msg.role==="user"?"none":"1px solid rgba(255,255,255,0.09)",color:"#fff",fontSize:12,lineHeight:1.5,whiteSpace:"pre-wrap"}}>
                  {msg.content||<span style={{opacity:0.4,fontStyle:"italic"}}>Thinking...</span>}
                </div>
              </div>
            ))}
            {chatLoading&&<div style={{display:"flex"}}><div style={{padding:"8px 13px",borderRadius:"16px 16px 16px 3px",background:"rgba(255,255,255,0.07)",display:"flex",gap:4,alignItems:"center"}}>{[0,1,2].map(n=><div key={n} style={{width:6,height:6,borderRadius:"50%",background:"#a78bfa",animation:`bounce 1.2s ease-in-out ${n*0.2}s infinite`}}/>)}</div></div>}
            <div ref={chatEndRef}/>
          </div>
          <div style={{padding:"8px 10px",borderTop:"1px solid rgba(255,255,255,0.07)"}}>
            <div style={{display:"flex",gap:7,alignItems:"center"}}>
              <input ref={chatInputRef} value={chatInput} onChange={e=>setChatInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&(e.preventDefault(),sendChat())} placeholder="Ask about packing, food, routes..." style={{flex:1,background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.11)",borderRadius:10,padding:"8px 12px",color:"#fff",fontSize:12,outline:"none"}}/>
              <button type="button" onClick={sendChat} disabled={chatLoading||!chatInput.trim()} style={{width:34,height:34,borderRadius:9,background:chatInput.trim()?"linear-gradient(135deg,#6366f1,#a855f7)":"rgba(255,255,255,0.06)",border:"none",cursor:chatInput.trim()?"pointer":"default",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <Send size={13} color={chatInput.trim()?"#fff":"rgba(255,255,255,0.3)"}/>
              </button>
            </div>
          </div>
        </div>
      )}
      <AiKeyModal isOpen={keyModalOpen} onClose={()=>setKeyModalOpen(false)} onKeySaved={()=>checkAiKeyStatus().then(setKeyStatus)}/>
      <style>{`
        @import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap");
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
        *{box-sizing:border-box}
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:rgba(168,85,247,0.28);border-radius:4px}
        input::placeholder{color:rgba(255,255,255,0.22)!important}
        input[type=date]::-webkit-calendar-picker-indicator{filter:invert(0.7)}
      `}</style>
    </div>
  );
}

import { useState, useRef } from "react";
import {
  Plus, LogOut, Home, ClipboardList, Building, Users,
  Calculator, FileText, Settings, X, Trash2, Edit2,
  Eye, Printer, ChevronDown, ChevronUp, Check, Euro,
  MapPin, Clock, AlertCircle, Save, Menu
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell
} from "recharts";

const LOHNGRUPPEN = [
  { id:"lg1", short:"LG 1", label:"LG 1 – Einfache Reinigung",        brutto:13.00 },
  { id:"lg2", short:"LG 2", label:"LG 2 – Unterhaltsreinigung",        brutto:13.50 },
  { id:"lg3", short:"LG 3", label:"LG 3 – Glas- & Fassadenreinigung", brutto:14.10 },
  { id:"lg4", short:"LG 4", label:"LG 4 – Spezialreinigung",           brutto:14.50 },
  { id:"lg5", short:"LG 5", label:"LG 5 – Vorarbeiter",                brutto:15.20 },
  { id:"lg6", short:"LG 6", label:"LG 6 – Objektleiter / Meister",     brutto:16.00 },
];
const SVS = 0.205;

const SERVICES = [
  { id:"buero",       icon:"🏢", label:"Büroreinigung"        },
  { id:"treppenhaus", icon:"🪜", label:"Treppenhausreinigung" },
  { id:"fenster",     icon:"🪟", label:"Fensterreinigung"     },
  { id:"bauend",      icon:"🏗️", label:"Bauendreinigung"      },
  { id:"grund",       icon:"🧹", label:"Grundreinigung"       },
  { id:"sanitaer",    icon:"🚿", label:"Sanitärreinigung"     },
  { id:"glas",        icon:"✨", label:"Glasreinigung"        },
  { id:"sonder",      icon:"⭐", label:"Sonderreinigung"      },
];

const RECURRING = [
  { value:"none",     label:"Einmalig"    },
  { value:"daily",    label:"Täglich"     },
  { value:"weekly",   label:"Wöchentlich" },
  { value:"biweekly", label:"14-täglich"  },
  { value:"monthly",  label:"Monatlich"   },
];

const STATUS = {
  pending:     { bg:"bg-amber-900/40",   text:"text-amber-400",  label:"Ausstehend" },
  in_progress: { bg:"bg-blue-900/40",    text:"text-blue-400",   label:"In Arbeit"  },
  done:        { bg:"bg-emerald-900/40", text:"text-emerald-400",label:"Erledigt"   },
  cancelled:   { bg:"bg-red-900/40",     text:"text-red-400",    label:"Storniert"  },
};

const today = new Date().toISOString().split("T")[0];
const fmtDate = (d) => d ? new Date(d + "T00:00:00").toLocaleDateString("de-DE") : "—";
const fmtEuro = (n) => `${Number(n || 0).toFixed(2).replace(".", ",")} €`;
const calcPreis = (job) => {
  if (job.preisart === "pauschale") return +job.pauschalpreis || 0;
  const base = (+job.stunden || 0) * (+job.stundensatz || 0);
  return job.preisart === "svs" ? base * (1 + SVS) : base;
};

const INIT_COMPANY = {
  name:"Muster Gebäudereinigung GmbH", street:"Musterstraße 12", city:"10117 Berlin",
  phone:"030 / 12 34 567", email:"info@muster-reinigung.de",
  ustid:"DE123456789", steuernr:"11/222/33333",
};

const INIT_CUSTOMERS = [
  { id:"c1", name:"ABC GmbH", ansprechpartner:"Thomas Müller", phone:"030 1234567", email:"mueller@abc.de",
    ustid:"DE987654321", steuernr:"11/333/44444", zahlungsziel:14,
    street:"Hauptstraße 42", city:"10117 Berlin",
    objects:[{id:"o1",name:"Hauptbüro EG",address:"Hauptstraße 42, 10117 Berlin"},{id:"o2",name:"Lager 1. OG",address:"Hauptstraße 42, 10117 Berlin"}] },
  { id:"c2", name:"XYZ Corp", ansprechpartner:"Sandra Schmidt", phone:"030 9876543", email:"schmidt@xyz.de",
    ustid:"DE111222333", steuernr:"22/444/55555", zahlungsziel:30,
    street:"Alexanderplatz 1", city:"10178 Berlin",
    objects:[{id:"o3",name:"Büro 3. OG",address:"Alexanderplatz 1, 10178 Berlin"}] },
  { id:"c3", name:"TechHub Berlin", ansprechpartner:"Klaus Weber", phone:"030 5556677", email:"weber@techhub.de",
    ustid:"DE444555666", steuernr:"33/555/66666", zahlungsziel:14,
    street:"Potsdamer Str. 15", city:"10785 Berlin",
    objects:[{id:"o4",name:"Coworking EG",address:"Potsdamer Str. 15, 10785 Berlin"},{id:"o5",name:"Küche",address:"Potsdamer Str. 15, 10785 Berlin"}] },
];

const INIT_EMPLOYEES = [
  { id:"e1", name:"Maria Koch",  phone:"0176 1234567", email:"m.koch@firma.de",   lohngruppe:"lg2", done:24, rating:4.8 },
  { id:"e2", name:"Ali Hassan",  phone:"0176 9876543", email:"a.hassan@firma.de", lohngruppe:"lg2", done:18, rating:4.6 },
  { id:"e3", name:"Jana Peters", phone:"0177 1122334", email:"j.peters@firma.de", lohngruppe:"lg5", done:31, rating:4.9 },
];

const INIT_JOBS = [
  { id:"j1", customerId:"c1", customerName:"ABC GmbH", objectId:"o1", objectName:"Hauptbüro EG",
    address:"Hauptstraße 42, 10117 Berlin", status:"in_progress", date:today, timeStart:"08:00", timeEnd:"11:00",
    preisart:"stunden", stunden:3, stundensatz:45, pauschalpreis:0,
    assignedTo:"e1", assignedName:"Maria Koch", recurring:"weekly",
    services:["buero","sanitaer"], abnahme:null, invoiced:false, notes:"Bitte Besprechungsraum besonders gründlich." },
  { id:"j2", customerId:"c2", customerName:"XYZ Corp", objectId:"o3", objectName:"Büro 3. OG",
    address:"Alexanderplatz 1, 10178 Berlin", status:"pending", date:today, timeStart:"14:00", timeEnd:"16:00",
    preisart:"pauschale", stunden:2, stundensatz:40, pauschalpreis:180,
    assignedTo:"e2", assignedName:"Ali Hassan", recurring:"none",
    services:["treppenhaus"], abnahme:null, invoiced:false, notes:"" },
  { id:"j3", customerId:"c3", customerName:"TechHub Berlin", objectId:"o4", objectName:"Coworking EG",
    address:"Potsdamer Str. 15, 10785 Berlin", status:"done", date:today, timeStart:"06:00", timeEnd:"13:00",
    preisart:"svs", stunden:7, stundensatz:45, pauschalpreis:0,
    assignedTo:"e3", assignedName:"Jana Peters", recurring:"monthly",
    services:["buero","fenster"], abnahme:{completedAt:"13:00",signedBy:"Klaus Weber",signature:true},
    invoiced:true, notes:"" },
];

const WEEK_DATA = [
  {day:"Mo",u:1200},{day:"Di",u:980},{day:"Mi",u:1450},
  {day:"Do",u:1100},{day:"Fr",u:1800},{day:"Sa",u:650},{day:"So",u:420},
];

const DInput = ({ label, ...props }) => (
  <div>
    {label && <label className="text-xs font-semibold text-gray-400 block mb-1">{label}</label>}
    <input {...props} className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500" />
  </div>
);

const DSelect = ({ label, children, ...props }) => (
  <div>
    {label && <label className="text-xs font-semibold text-gray-400 block mb-1">{label}</label>}
    <select {...props} className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
      {children}
    </select>
  </div>
);

function Abnahmezettel({ job, company, customers, onClose }) {
  const customer = customers.find(c => c.id === job.customerId) || {};
  const abnahme  = job.abnahme || {};
  const preis    = calcPreis(job);
  const svcLabels = (job.services||[]).map(id => SERVICES.find(s => s.id === id)?.label).filter(Boolean);
  const docRef = useRef(null);

  const handlePrint = () => {
    const html = docRef.current?.innerHTML || "";
    const win = window.open("","_blank");
    win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8">
      <title>Abnahmezettel</title>
      <style>
        *{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial,sans-serif;color:#111;padding:28px;font-size:13px}
        .hdr{display:flex;justify-content:space-between;border-bottom:2px solid #1d4ed8;padding-bottom:12px;margin-bottom:18px}
        .section{font-weight:700;font-size:13px;color:#1d4ed8;border-bottom:1px solid #ddd;padding-bottom:4px;margin:14px 0 8px}
        table{width:100%;border-collapse:collapse;margin-bottom:4px}
        td{padding:5px 8px;border:1px solid #e5e7eb;font-size:12px}td.lbl{font-weight:600;background:#eff6ff;width:38%}
        .tag{display:inline-block;background:#dbeafe;color:#1e40af;padding:2px 10px;border-radius:20px;font-size:11px;font-weight:600;margin:2px}
        .sig-row{display:flex;gap:32px;margin-top:40px}.sig-box{flex:1;border-top:2px solid #111;padding-top:8px;font-size:12px}
        .footer{margin-top:30px;border-top:1px solid #e5e7eb;padding-top:10px;text-align:center;font-size:10px;color:#999}
        @media print{body{padding:14px}}
      </style></head><body>${html}</body></html>`);
    win.document.close(); win.print();
  };

  const preisDesc = job.preisart === "pauschale" ? "Pauschalpreis"
    : `${job.stunden} Std. × ${job.stundensatz} €${job.preisart==="svs"?" + SVS-Zuschlag":""}`;

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 overflow-auto">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-3 bg-blue-700 rounded-t-2xl flex-shrink-0">
          <span className="font-bold text-white flex items-center gap-2"><FileText size={16}/>Abnahmezettel</span>
          <div className="flex gap-2">
            <button onClick={handlePrint} className="flex items-center gap-1 bg-white text-blue-700 px-3 py-1 rounded-lg text-xs font-bold hover:bg-blue-50"><Printer size={13}/> Drucken / PDF</button>
            <button onClick={onClose} className="text-white/70 hover:text-white p-1"><X size={18}/></button>
          </div>
        </div>
        <div className="overflow-y-auto flex-1 bg-white rounded-b-2xl">
          <div ref={docRef} className="p-7 text-gray-900">
            <div className="hdr flex justify-between border-b-2 border-blue-700 pb-4 mb-4">
              <div>
                <div className="text-lg font-bold">{company.name}</div>
                <div className="text-xs text-gray-500">{company.street} · {company.city}</div>
                <div className="text-xs text-gray-500">{company.phone} · {company.email}</div>
                <div className="text-xs text-gray-400">USt-ID: {company.ustid} · St.-Nr.: {company.steuernr}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-400">Belegnr.</div>
                <div className="font-bold text-blue-700">AZ-{job.id.toUpperCase()}</div>
                <div className="text-xs text-gray-500 mt-1">{fmtDate(job.date)}</div>
              </div>
            </div>
            <div className="text-center font-bold text-blue-700 text-lg mb-5">ABNAHMEZETTEL / LEISTUNGSNACHWEIS</div>
            <div className="section font-semibold text-sm text-blue-700 border-b border-gray-200 pb-1 mb-2">Auftraggeber</div>
            <table className="w-full text-xs border-collapse mb-3"><tbody>
              <tr><td className="lbl py-1.5 px-2 font-semibold bg-blue-50 w-40">Firma</td><td className="py-1.5 px-2">{job.customerName}</td><td className="lbl py-1.5 px-2 font-semibold bg-blue-50 w-40">Ansprechpartner</td><td className="py-1.5 px-2">{customer.ansprechpartner||"—"}</td></tr>
              <tr><td className="lbl py-1.5 px-2 font-semibold bg-blue-50">Adresse</td><td className="py-1.5 px-2">{customer.street}, {customer.city}</td><td className="lbl py-1.5 px-2 font-semibold bg-blue-50">USt-ID</td><td className="py-1.5 px-2">{customer.ustid||"—"}</td></tr>
              <tr><td className="lbl py-1.5 px-2 font-semibold bg-blue-50">Objekt</td><td className="py-1.5 px-2 font-semibold" colSpan={3}>{job.objectName||job.address}</td></tr>
            </tbody></table>
            <div className="section font-semibold text-sm text-blue-700 border-b border-gray-200 pb-1 mb-2 mt-3">Leistungszeitraum</div>
            <table className="w-full text-xs border-collapse mb-3"><tbody>
              <tr><td className="lbl py-1.5 px-2 font-semibold bg-blue-50 w-40">Datum</td><td className="py-1.5 px-2">{fmtDate(job.date)}</td><td className="lbl py-1.5 px-2 font-semibold bg-blue-50 w-40">Beginn</td><td className="py-1.5 px-2">{job.timeStart||"—"} Uhr</td></tr>
              <tr><td className="lbl py-1.5 px-2 font-semibold bg-blue-50">Mitarbeiter</td><td className="py-1.5 px-2">{job.assignedName||"—"}</td><td className="lbl py-1.5 px-2 font-semibold bg-blue-50">Ende</td><td className="py-1.5 px-2">{job.timeEnd||abnahme.completedAt||"—"} Uhr</td></tr>
              <tr><td className="lbl py-1.5 px-2 font-semibold bg-blue-50">Turnus</td><td className="py-1.5 px-2">{RECURRING.find(r=>r.value===job.recurring)?.label||"—"}</td><td className="lbl py-1.5 px-2 font-semibold bg-blue-50">Dauer</td><td className="py-1.5 px-2">{job.stunden?`${job.stunden} Std.`:"—"}</td></tr>
            </tbody></table>
            <div className="section font-semibold text-sm text-blue-700 border-b border-gray-200 pb-1 mb-2 mt-3">Erbrachte Leistungen</div>
            <div className="mb-3 flex flex-wrap gap-1">
              {svcLabels.map((s,i)=><span key={i} className="tag bg-blue-50 text-blue-800 px-2 py-0.5 rounded text-xs border border-blue-200">{s}</span>)}
              {svcLabels.length===0&&<span className="text-xs text-gray-400">Keine Leistungen eingetragen</span>}
            </div>
            <div className="section font-semibold text-sm text-blue-700 border-b border-gray-200 pb-1 mb-2 mt-3">Vergütung</div>
            <table className="w-full text-xs border-collapse mb-3"><tbody>
              <tr><td className="lbl py-1.5 px-2 font-semibold bg-blue-50 w-40">Preisart</td><td className="py-1.5 px-2">{preisDesc}</td><td className="lbl py-1.5 px-2 font-semibold bg-blue-50 w-40">Betrag netto</td><td className="py-1.5 px-2 font-bold">{fmtEuro(preis)}</td></tr>
              <tr><td className="lbl py-1.5 px-2 font-semibold bg-blue-50">Zahlungsziel</td><td className="py-1.5 px-2">{customer.zahlungsziel?`${customer.zahlungsziel} Tage`:"—"}</td><td className="lbl py-1.5 px-2 font-semibold bg-blue-50">Status</td><td className={`py-1.5 px-2 font-semibold ${job.invoiced?"text-green-700":"text-amber-700"}`}>{job.invoiced?"✓ Abgerechnet":"Noch offen"}</td></tr>
            </tbody></table>
            {job.notes&&<><div className="section font-semibold text-sm text-blue-700 border-b border-gray-200 pb-1 mb-2 mt-3">Bemerkungen</div><p className="text-xs text-gray-700 bg-gray-50 px-3 py-2 rounded mb-3">{job.notes}</p></>}
            <div className="section font-semibold text-sm text-blue-700 border-b border-gray-200 pb-1 mb-4 mt-4">Bestätigung und Unterschriften</div>
            <div className="sig-row flex gap-8">
              <div className="flex-1"><div className="border-b-2 border-gray-800 h-14 mb-2 flex items-end">{abnahme.signature&&<span className="text-xs text-gray-400 italic mb-1">Unterschrift liegt vor</span>}</div><div className="text-xs text-gray-600"><div className="font-bold">{job.customerName}</div><div>{abnahme.signedBy?`(${abnahme.signedBy})`:"Auftraggeber"}</div><div className="mt-1 text-gray-400">Datum: __________________</div></div></div>
              <div className="flex-1"><div className="border-b-2 border-gray-800 h-14 mb-2"></div><div className="text-xs text-gray-600"><div className="font-bold">{company.name}</div><div>{job.assignedName||"Mitarbeiter"}</div><div className="mt-1 text-gray-400">Datum: __________________</div></div></div>
            </div>
            <div className="footer mt-6 pt-4 border-t border-gray-200 text-center text-xs text-gray-400">{company.name} · {company.street} · {company.city} · {company.phone} · {company.email}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function JobForm({ initial, customers, employees, onSave, onCancel }) {
  const [f, setF] = useState(initial || {
    customerId:"", customerName:"", objectId:"", objectName:"",
    address:"", status:"pending", date:today, timeStart:"08:00", timeEnd:"10:00",
    preisart:"stunden", stunden:2, stundensatz:45, pauschalpreis:0,
    assignedTo:"", assignedName:"", recurring:"none", services:[], notes:"",
  });
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  const cust = customers.find(c => c.id === f.customerId);
  const pickCustomer = (id) => { const c = customers.find(x=>x.id===id); setF(p=>({...p,customerId:id,customerName:c?.name||"",objectId:"",objectName:"",address:c?`${c.street}, ${c.city}`:""})); };
  const pickObject = (id) => { const o = cust?.objects?.find(x=>x.id===id); set("objectId",id); set("objectName",o?.name||""); set("address",o?.address||f.address); };
  const pickEmployee = (id) => { const e = employees.find(x=>x.id===id); set("assignedTo",id); set("assignedName",e?.name||""); };
  const toggleSvc = (id) => set("services", f.services.includes(id)?f.services.filter(s=>s!==id):[...f.services,id]);
  const preview = calcPreis(f);

  return (
    <div className="fixed inset-0 bg-black/70 z-40 flex items-center justify-center p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between px-5 py-3 bg-blue-700 rounded-t-2xl">
          <span className="font-bold text-white">{initial?"Auftrag bearbeiten":"Neuer Auftrag"}</span>
          <button onClick={onCancel} className="text-white/70 hover:text-white"><X size={18}/></button>
        </div>
        <div className="p-5 space-y-4">
          <DSelect label="Kunde *" value={f.customerId} onChange={e=>pickCustomer(e.target.value)}>
            <option value="">— Kunde wählen —</option>
            {customers.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
          </DSelect>
          {cust&&<DSelect label="Objekt / Standort" value={f.objectId} onChange={e=>pickObject(e.target.value)}>
            <option value="">— Objekt wählen —</option>
            {cust.objects?.map(o=><option key={o.id} value={o.id}>{o.name}</option>)}
          </DSelect>}
          <div className="grid grid-cols-3 gap-3">
            <DInput label="Datum *" type="date" value={f.date} onChange={e=>set("date",e.target.value)}/>
            <DInput label="Beginn"  type="time" value={f.timeStart} onChange={e=>set("timeStart",e.target.value)}/>
            <DInput label="Ende"    type="time" value={f.timeEnd}   onChange={e=>set("timeEnd",e.target.value)}/>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-400 block mb-1">Preisart *</label>
            <div className="grid grid-cols-3 gap-2">
              {[["stunden","Stundenlohn"],["svs","Stunden+SVS"],["pauschale","Pauschal"]].map(([v,l])=>(
                <button key={v} type="button" onClick={()=>set("preisart",v)}
                  className={`py-2 rounded-lg text-xs font-semibold border transition-colors ${f.preisart===v?"bg-blue-600 text-white border-blue-600":"border-gray-600 text-gray-300 hover:border-gray-500"}`}>{l}</button>
              ))}
            </div>
          </div>
          {f.preisart==="pauschale"
            ?<DInput label="Pauschalpreis (€)" type="number" min="0" step="10" value={f.pauschalpreis} onChange={e=>set("pauschalpreis",+e.target.value)}/>
            :<div className="grid grid-cols-2 gap-3">
              <DInput label="Stunden" type="number" min="0.5" step="0.5" value={f.stunden} onChange={e=>set("stunden",+e.target.value)}/>
              <DInput label="Stundensatz (€)" type="number" min="1" step="0.5" value={f.stundensatz} onChange={e=>set("stundensatz",+e.target.value)}/>
            </div>
          }
          <div className="bg-blue-900/30 border border-blue-700/50 rounded-lg px-4 py-2 flex justify-between items-center">
            <span className="text-xs text-blue-400 font-semibold">Preis netto:</span>
            <span className="font-bold text-blue-300">{fmtEuro(preview)}</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <DSelect label="Mitarbeiter" value={f.assignedTo} onChange={e=>pickEmployee(e.target.value)}>
              <option value="">— Wählen —</option>
              {employees.map(e=><option key={e.id} value={e.id}>{e.name}</option>)}
            </DSelect>
            <DSelect label="Wiederholung" value={f.recurring} onChange={e=>set("recurring",e.target.value)}>
              {RECURRING.map(r=><option key={r.value} value={r.value}>{r.label}</option>)}
            </DSelect>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-400 block mb-2">Leistungsarten</label>
            <div className="flex flex-wrap gap-2">
              {SERVICES.map(s=>(
                <button key={s.id} type="button" onClick={()=>toggleSvc(s.id)}
                  className={`text-xs px-3 py-1 rounded-full border transition-colors ${f.services.includes(s.id)?"bg-blue-600 text-white border-blue-600":"border-gray-600 text-gray-400 hover:border-gray-500"}`}>
                  {s.icon} {s.label}
                </button>
              ))}
            </div>
          </div>
          <DSelect label="Status" value={f.status} onChange={e=>set("status",e.target.value)}>
            {Object.entries(STATUS).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
          </DSelect>
          <div>
            <label className="text-xs font-semibold text-gray-400 block mb-1">Notizen</label>
            <textarea rows={2} value={f.notes} onChange={e=>set("notes",e.target.value)} placeholder="Interne Hinweise..."
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"/>
          </div>
          <div className="flex gap-3 pt-1">
            <button onClick={onCancel} className="flex-1 py-2 border border-gray-600 text-gray-300 rounded-xl text-sm hover:bg-gray-700">Abbrechen</button>
            <button onClick={()=>onSave(f)} className="flex-1 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700">Speichern</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CustomerForm({ initial, onSave, onCancel }) {
  const [f, setF] = useState(initial||{name:"",ansprechpartner:"",phone:"",email:"",ustid:"",steuernr:"",zahlungsziel:14,street:"",city:"",objects:[]});
  const [newObj, setNewObj] = useState({name:"",address:""});
  const [addObj, setAddObj] = useState(false);
  const set = (k,v) => setF(p=>({...p,[k]:v}));
  const addObject = () => { if(!newObj.name)return; set("objects",[...f.objects,{id:`o_${Date.now()}`,...newObj}]); setNewObj({name:"",address:""}); setAddObj(false); };

  return (
    <div className="fixed inset-0 bg-black/70 z-40 flex items-center justify-center p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between px-5 py-3 bg-emerald-700 rounded-t-2xl">
          <span className="font-bold text-white">{initial?"Kunde bearbeiten":"Neuer Kunde"}</span>
          <button onClick={onCancel} className="text-white/70 hover:text-white"><X size={18}/></button>
        </div>
        <div className="p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <DInput label="Firmenname *" value={f.name} onChange={e=>set("name",e.target.value)} placeholder="Firma GmbH"/>
            <DInput label="Ansprechpartner" value={f.ansprechpartner} onChange={e=>set("ansprechpartner",e.target.value)}/>
            <DInput label="Telefon" value={f.phone} onChange={e=>set("phone",e.target.value)}/>
            <DInput label="E-Mail" type="email" value={f.email} onChange={e=>set("email",e.target.value)}/>
            <DInput label="USt-ID" value={f.ustid} onChange={e=>set("ustid",e.target.value)} placeholder="DE123456789"/>
            <DInput label="Steuernummer" value={f.steuernr} onChange={e=>set("steuernr",e.target.value)}/>
            <DInput label="Straße" value={f.street} onChange={e=>set("street",e.target.value)}/>
            <DInput label="PLZ + Ort" value={f.city} onChange={e=>set("city",e.target.value)}/>
            <div className="col-span-2">
              <DSelect label="Zahlungsziel" value={f.zahlungsziel} onChange={e=>set("zahlungsziel",+e.target.value)}>
                {[7,14,21,30,45,60].map(d=><option key={d} value={d}>{d} Tage</option>)}
              </DSelect>
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-gray-400">Objekte / Standorte</label>
              <button type="button" onClick={()=>setAddObj(!addObj)} className="text-xs text-blue-400 font-semibold flex items-center gap-1"><Plus size={12}/>Hinzufügen</button>
            </div>
            {f.objects.map(o=>(
              <div key={o.id} className="flex items-center justify-between bg-gray-700 rounded-lg px-3 py-2 mb-1">
                <div><div className="text-sm font-semibold text-white">{o.name}</div>{o.address&&<div className="text-xs text-gray-400">{o.address}</div>}</div>
                <button onClick={()=>set("objects",f.objects.filter(x=>x.id!==o.id))} className="text-red-400 hover:text-red-300 ml-2"><X size={14}/></button>
              </div>
            ))}
            {addObj&&<div className="bg-gray-700/50 border border-gray-600 rounded-xl p-3 space-y-2">
              <DInput value={newObj.name} onChange={e=>setNewObj(n=>({...n,name:e.target.value}))} placeholder="Objektname (z.B. Büro EG)"/>
              <DInput value={newObj.address} onChange={e=>setNewObj(n=>({...n,address:e.target.value}))} placeholder="Adresse (optional)"/>
              <div className="flex gap-2">
                <button onClick={()=>setAddObj(false)} className="flex-1 py-1.5 border border-gray-600 text-gray-300 rounded-lg text-xs">Abbrechen</button>
                <button onClick={addObject} className="flex-1 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold">Hinzufügen</button>
              </div>
            </div>}
          </div>
          <div className="flex gap-3 pt-1">
            <button onClick={onCancel} className="flex-1 py-2 border border-gray-600 text-gray-300 rounded-xl text-sm hover:bg-gray-700">Abbrechen</button>
            <button onClick={()=>onSave(f)} className="flex-1 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700">Speichern</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Dashboard({ jobs, customers }) {
  const total  = jobs.reduce((s,j)=>s+calcPreis(j),0);
  const done   = jobs.filter(j=>j.status==="done").length;
  const open   = jobs.filter(j=>!["done","cancelled"].includes(j.status)).length;
  const billed = jobs.filter(j=>j.invoiced).reduce((s,j)=>s+calcPreis(j),0);
  const COLORS = ["#3b82f6","#10b981","#f59e0b","#8b5cf6","#ec4899","#14b8a6"];
  const custRev = customers.map((c,i)=>({name:c.name.split(" ")[0],u:jobs.filter(j=>j.customerId===c.id).reduce((s,j)=>s+calcPreis(j),0),fill:COLORS[i%COLORS.length]})).filter(c=>c.u>0);
  const todayJobs = jobs.filter(j=>j.date===today);

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-bold text-white">Dashboard</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          {label:"Umsatz gesamt",val:fmtEuro(total), icon:<Euro size={18}/>,    color:"text-blue-400",    bg:"bg-blue-900/30 border-blue-800/50"},
          {label:"Erledigt",     val:done,            icon:<Check size={18}/>,   color:"text-emerald-400", bg:"bg-emerald-900/30 border-emerald-800/50"},
          {label:"Offen",        val:open,            icon:<Clock size={18}/>,   color:"text-amber-400",   bg:"bg-amber-900/30 border-amber-800/50"},
          {label:"Abgerechnet",  val:fmtEuro(billed), icon:<FileText size={18}/>,color:"text-purple-400",  bg:"bg-purple-900/30 border-purple-800/50"},
        ].map(c=>(
          <div key={c.label} className={`${c.bg} border rounded-2xl p-4`}>
            <div className={`${c.color} mb-1`}>{c.icon}</div>
            <div className="text-xl font-bold text-white">{c.val}</div>
            <div className="text-xs text-gray-400">{c.label}</div>
          </div>
        ))}
      </div>
      <div className="bg-gray-800 border border-gray-700 rounded-2xl p-4">
        <div className="text-sm font-semibold text-gray-300 mb-3">Umsatz (Woche)</div>
        <ResponsiveContainer width="100%" height={130}>
          <AreaChart data={WEEK_DATA}>
            <defs><linearGradient id="grad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient></defs>
            <XAxis dataKey="day" tick={{fontSize:11,fill:"#9ca3af"}} axisLine={false} tickLine={false}/>
            <YAxis tick={{fontSize:11,fill:"#9ca3af"}} axisLine={false} tickLine={false} width={40}/>
            <Tooltip contentStyle={{background:"#1f2937",border:"1px solid #374151",borderRadius:8,color:"#f3f4f6"}} formatter={v=>fmtEuro(v)}/>
            <Area type="monotone" dataKey="u" stroke="#3b82f6" fill="url(#grad)" strokeWidth={2}/>
          </AreaChart>
        </ResponsiveContainer>
      </div>
      {custRev.length>0&&<div className="bg-gray-800 border border-gray-700 rounded-2xl p-4">
        <div className="text-sm font-semibold text-gray-300 mb-3">Umsatz nach Kunden</div>
        <ResponsiveContainer width="100%" height={110}>
          <BarChart data={custRev} barSize={26}>
            <XAxis dataKey="name" tick={{fontSize:11,fill:"#9ca3af"}} axisLine={false} tickLine={false}/>
            <YAxis tick={{fontSize:11,fill:"#9ca3af"}} axisLine={false} tickLine={false} width={40}/>
            <Tooltip contentStyle={{background:"#1f2937",border:"1px solid #374151",borderRadius:8,color:"#f3f4f6"}} formatter={v=>fmtEuro(v)}/>
            <Bar dataKey="u" radius={[5,5,0,0]}>{custRev.map((e,i)=><Cell key={i} fill={e.fill}/>)}</Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>}
      <div className="bg-gray-800 border border-gray-700 rounded-2xl p-4">
        <div className="text-sm font-semibold text-gray-300 mb-3">Heute · {new Date().toLocaleDateString("de-DE",{weekday:"long",day:"numeric",month:"long"})}</div>
        {todayJobs.length===0?<p className="text-sm text-gray-500">Keine Aufträge für heute.</p>
          :todayJobs.map(j=>{const sc=STATUS[j.status]||{};return(
            <div key={j.id} className="flex items-center gap-3 py-2 border-b border-gray-700 last:border-0">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sc.bg} ${sc.text}`}>{sc.label}</span>
              <div className="flex-1 min-w-0"><div className="text-sm font-semibold text-white truncate">{j.customerName}</div><div className="text-xs text-gray-400">{j.objectName||j.address} · {j.timeStart} Uhr</div></div>
              <div className="text-sm font-bold text-white">{fmtEuro(calcPreis(j))}</div>
            </div>
          );})}
      </div>
    </div>
  );
}

function Jobs({ jobs, setJobs, customers, employees, company }) {
  const [modal, setModal] = useState(null);
  const [pdfJob, setPdfJob] = useState(null);
  const [filter, setFilter] = useState("all");
  const filtered = filter==="all"?jobs:jobs.filter(j=>j.status===filter);
  const save = (form) => { if(modal==="new") setJobs(p=>[...p,{...form,id:`j${Date.now()}`,abnahme:null,invoiced:false}]); else setJobs(p=>p.map(j=>j.id===modal.id?{...j,...form}:j)); setModal(null); };

  return (
    <div className="p-4">
      {modal&&<JobForm initial={modal==="new"?null:modal} customers={customers} employees={employees} onSave={save} onCancel={()=>setModal(null)}/>}
      {pdfJob&&<Abnahmezettel job={pdfJob} company={company} customers={customers} onClose={()=>setPdfJob(null)}/>}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-white">Aufträge</h2>
        <button onClick={()=>setModal("new")} className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded-xl text-sm font-semibold hover:bg-blue-700"><Plus size={16}/>Neu</button>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-2 mb-3">
        {[["all","Alle"],["pending","Ausstehend"],["in_progress","In Arbeit"],["done","Erledigt"]].map(([v,l])=>(
          <button key={v} onClick={()=>setFilter(v)} className={`whitespace-nowrap text-xs px-3 py-1 rounded-full font-medium border transition-colors ${filter===v?"bg-blue-600 text-white border-blue-600":"border-gray-600 text-gray-400 hover:border-gray-500"}`}>{l}</button>
        ))}
      </div>
      <div className="space-y-2">
        {filtered.length===0&&<p className="text-sm text-gray-500 text-center py-10">Keine Aufträge gefunden.</p>}
        {filtered.map(job=>{
          const sc=STATUS[job.status]||{};
          return(
            <div key={job.id} className="bg-gray-800 border border-gray-700 rounded-2xl p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sc.bg} ${sc.text}`}>{sc.label}</span>
                    {job.recurring!=="none"&&<span className="text-xs bg-purple-900/40 text-purple-400 px-2 py-0.5 rounded-full">🔁 {RECURRING.find(r=>r.value===job.recurring)?.label}</span>}
                    {job.invoiced&&<span className="text-xs bg-emerald-900/40 text-emerald-400 px-2 py-0.5 rounded-full">✓ Abgerechnet</span>}
                  </div>
                  <div className="font-bold text-white">{job.customerName}</div>
                  <div className="text-xs text-gray-400">{job.objectName||job.address}</div>
                  <div className="text-xs text-gray-500 mt-0.5">📅 {fmtDate(job.date)} · {job.timeStart}–{job.timeEnd} · 👤 {job.assignedName||"—"}</div>
                  {(job.services||[]).length>0&&<div className="mt-1.5 flex flex-wrap gap-1">{job.services.map(id=>{const s=SERVICES.find(x=>x.id===id);return s?<span key={id} className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full">{s.icon} {s.label}</span>:null;})}</div>}
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="font-bold text-white">{fmtEuro(calcPreis(job))}</div>
                  <div className="text-xs text-gray-500">{job.preisart==="pauschale"?"Pauschal":`${job.stunden}h×${job.stundensatz}€${job.preisart==="svs"?"+SVS":""}`}</div>
                </div>
              </div>
              <div className="flex gap-3 mt-3 pt-3 border-t border-gray-700">
                <button onClick={()=>setPdfJob(job)} className="flex items-center gap-1 text-xs text-blue-400 font-semibold hover:text-blue-300"><Eye size={13}/>Abnahmezettel</button>
                <button onClick={()=>setJobs(p=>p.map(j=>j.id===job.id?{...j,invoiced:!j.invoiced}:j))} className={`flex items-center gap-1 text-xs font-semibold ${job.invoiced?"text-amber-400 hover:text-amber-300":"text-emerald-400 hover:text-emerald-300"}`}><Euro size={13}/>{job.invoiced?"Als offen":"Abrechnen"}</button>
                <div className="flex-1"/>
                <button onClick={()=>setModal(job)} className="p-1 text-gray-500 hover:text-blue-400"><Edit2 size={14}/></button>
                <button onClick={()=>setJobs(p=>p.filter(j=>j.id!==job.id))} className="p-1 text-gray-500 hover:text-red-400"><Trash2 size={14}/></button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Customers({ customers, setCustomers, jobs }) {
  const [modal, setModal] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const save = (form) => { if(modal==="new") setCustomers(p=>[...p,{...form,id:`c${Date.now()}`}]); else setCustomers(p=>p.map(c=>c.id===modal.id?{...c,...form}:c)); setModal(null); };

  return (
    <div className="p-4">
      {modal&&<CustomerForm initial={modal==="new"?null:modal} onSave={save} onCancel={()=>setModal(null)}/>}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-white">Kunden</h2>
        <button onClick={()=>setModal("new")} className="flex items-center gap-1 bg-emerald-600 text-white px-3 py-1.5 rounded-xl text-sm font-semibold hover:bg-emerald-700"><Plus size={16}/>Neu</button>
      </div>
      <div className="space-y-2">
        {customers.map(c=>{
          const rev=jobs.filter(j=>j.customerId===c.id).reduce((s,j)=>s+calcPreis(j),0);
          const open=expanded===c.id;
          return(
            <div key={c.id} className="bg-gray-800 border border-gray-700 rounded-2xl overflow-hidden">
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="font-bold text-white">{c.name}</div>
                    <div className="text-xs text-gray-400">{c.ansprechpartner} · {c.phone}</div>
                    <div className="text-xs text-gray-500">{c.street}, {c.city}</div>
                    <div className="text-xs text-gray-600 mt-0.5">USt-ID: {c.ustid||"—"} · Zahlungsziel: {c.zahlungsziel} Tage</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="font-bold text-emerald-400">{fmtEuro(rev)}</div>
                    <div className="text-xs text-gray-500">{jobs.filter(j=>j.customerId===c.id).length} Aufträge</div>
                  </div>
                </div>
                <div className="flex gap-3 mt-3 pt-3 border-t border-gray-700">
                  <button onClick={()=>setExpanded(open?null:c.id)} className="text-xs text-blue-400 font-semibold flex items-center gap-1 hover:text-blue-300"><Building size={12}/>{c.objects?.length||0} Objekte{open?<ChevronUp size={12}/>:<ChevronDown size={12}/>}</button>
                  <div className="flex-1"/>
                  <button onClick={()=>setModal(c)} className="p-1 text-gray-500 hover:text-blue-400"><Edit2 size={14}/></button>
                  <button onClick={()=>setCustomers(p=>p.filter(x=>x.id!==c.id))} className="p-1 text-gray-500 hover:text-red-400"><Trash2 size={14}/></button>
                </div>
              </div>
              {open&&<div className="border-t border-gray-700 px-4 pb-3 pt-2 bg-gray-900/50">
                {(c.objects||[]).length===0?<p className="text-xs text-gray-500">Keine Objekte.</p>
                  :(c.objects||[]).map(o=>(
                    <div key={o.id} className="flex items-center gap-2 py-1.5 text-xs border-b border-gray-800 last:border-0">
                      <MapPin size={11} className="text-blue-500 flex-shrink-0"/>
                      <span className="font-semibold text-gray-300">{o.name}</span>
                      {o.address&&<span className="text-gray-500">· {o.address}</span>}
                    </div>
                  ))}
              </div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Employees({ employees, setEmployees, jobs }) {
  const [showNew, setShowNew] = useState(false);
  const [nE, setNE] = useState({name:"",phone:"",email:"",lohngruppe:"lg2"});
  const save = () => { if(!nE.name)return; setEmployees(p=>[...p,{...nE,id:`e${Date.now()}`,done:0,rating:0}]); setNE({name:"",phone:"",email:"",lohngruppe:"lg2"}); setShowNew(false); };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-white">Mitarbeiter</h2>
        <button onClick={()=>setShowNew(!showNew)} className="flex items-center gap-1 bg-indigo-600 text-white px-3 py-1.5 rounded-xl text-sm font-semibold hover:bg-indigo-700"><Plus size={16}/>Neu</button>
      </div>
      {showNew&&<div className="bg-gray-800 border border-indigo-700/50 rounded-2xl p-4 mb-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <DInput label="Name" value={nE.name} onChange={e=>setNE(n=>({...n,name:e.target.value}))}/>
          <DSelect label="Lohngruppe" value={nE.lohngruppe} onChange={e=>setNE(n=>({...n,lohngruppe:e.target.value}))}>
            {LOHNGRUPPEN.map(l=><option key={l.id} value={l.id}>{l.short} – {l.brutto.toFixed(2)} €/Std.</option>)}
          </DSelect>
          <DInput label="Telefon" value={nE.phone} onChange={e=>setNE(n=>({...n,phone:e.target.value}))}/>
          <DInput label="E-Mail" type="email" value={nE.email} onChange={e=>setNE(n=>({...n,email:e.target.value}))}/>
        </div>
        <div className="flex gap-2">
          <button onClick={()=>setShowNew(false)} className="flex-1 py-2 border border-gray-600 text-gray-300 rounded-xl text-sm">Abbrechen</button>
          <button onClick={save} className="flex-1 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold">Speichern</button>
        </div>
      </div>}
      <div className="space-y-3">
        {employees.map(emp=>{
          const lg=LOHNGRUPPEN.find(l=>l.id===emp.lohngruppe)||LOHNGRUPPEN[1];
          const initials=emp.name.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase();
          return(
            <div key={emp.id} className="bg-gray-800 border border-gray-700 rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-900/60 border border-indigo-700/50 flex items-center justify-center text-indigo-300 font-bold text-sm flex-shrink-0">{initials}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-white">{emp.name}</div>
                  <div className="text-xs text-indigo-400 font-medium">{lg.label}</div>
                  <div className="text-xs text-gray-500">{lg.brutto.toFixed(2)} € brutto · Vollkosten: {(lg.brutto*(1+SVS)).toFixed(2)} €/Std.</div>
                  <div className="text-xs text-gray-500">{emp.phone} · {emp.email}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-sm font-bold text-white">{emp.done} Jobs</div>
                  {emp.rating>0&&<div className="text-xs text-amber-400">★ {emp.rating}</div>}
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-700">
                <button onClick={()=>setEmployees(p=>p.filter(e=>e.id!==emp.id))} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"><Trash2 size={12}/>Entfernen</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Kalkulator() {
  const [lg, setLg]       = useState("lg2");
  const [stunden, setH]   = useState(8);
  const [ma, setMa]       = useState(1);
  const [aufschlag, setA] = useState(30);
  const [fahrk, setF]     = useState(20);
  const [material, setM]  = useState(15);
  const [mwst, setMwst]   = useState(true);
  const lohn=LOHNGRUPPEN.find(l=>l.id===lg)||LOHNGRUPPEN[1];
  const bStd=lohn.brutto, svs=bStd*SVS, kStd=bStd+svs;
  const lGes=kStd*stunden*ma, aufBet=lGes*(aufschlag/100);
  const netto=lGes+aufBet+(+fahrk)+(+material);
  const mwstB=mwst?netto*0.19:0, brutto=netto+mwstB;
  const Row=({label,sub,value,bold})=>(
    <div className="flex justify-between items-center py-2 border-b border-gray-700 last:border-0">
      <div><div className={`text-sm ${bold?"text-white font-bold":"text-gray-300"}`}>{label}</div>{sub&&<div className="text-xs text-gray-500">{sub}</div>}</div>
      <div className={bold?"text-blue-400 font-bold text-base":"text-gray-200 text-sm"}>{value}</div>
    </div>
  );
  return (
    <div className="p-4 max-w-xl mx-auto">
      <div className="flex items-center gap-2 mb-4">
        <Calculator size={20} className="text-blue-400"/>
        <h2 className="text-lg font-bold text-white">Lohnkalkulator</h2>
        <span className="text-xs bg-blue-900/50 text-blue-400 border border-blue-800/50 px-2 py-0.5 rounded-full">Tarifvertrag</span>
      </div>
      <div className="bg-gray-800 border border-gray-700 rounded-2xl p-4 mb-4">
        <div className="text-xs font-semibold text-gray-400 mb-3">Lohngruppe (Tarifvertrag Gebäudereinigung)</div>
        <div className="space-y-1.5">
          {LOHNGRUPPEN.map(l=>(
            <label key={l.id} className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-colors ${lg===l.id?"bg-blue-900/40 border border-blue-700/50":"border border-transparent hover:bg-gray-700/50"}`}>
              <input type="radio" name="lg" value={l.id} checked={lg===l.id} onChange={()=>setLg(l.id)} className="accent-blue-500"/>
              <div className="flex-1 text-sm font-medium text-white">{l.label}</div>
              <div className="text-xs font-bold text-blue-400">{l.brutto.toFixed(2)} €</div>
            </label>
          ))}
        </div>
      </div>
      <div className="bg-gray-800 border border-gray-700 rounded-2xl p-4 mb-4 grid grid-cols-2 gap-3">
        <DInput label="Stunden" type="number" min="0.5" step="0.5" value={stunden} onChange={e=>setH(+e.target.value)}/>
        <DInput label="Mitarbeiter" type="number" min="1" value={ma} onChange={e=>setMa(+e.target.value)}/>
        <DInput label="Aufschlag %" type="number" min="0" value={aufschlag} onChange={e=>setA(+e.target.value)}/>
        <DInput label="Fahrkosten €" type="number" min="0" value={fahrk} onChange={e=>setF(e.target.value)}/>
        <DInput label="Material €" type="number" min="0" value={material} onChange={e=>setM(e.target.value)}/>
        <div className="flex items-center gap-2 self-end pb-2"><input type="checkbox" id="mwst" checked={mwst} onChange={e=>setMwst(e.target.checked)} className="accent-blue-500 w-4 h-4"/><label htmlFor="mwst" className="text-xs font-semibold text-gray-400">+ 19 % MwSt.</label></div>
      </div>
      <div className="bg-gray-800 border border-gray-700 rounded-2xl p-4">
        <div className="text-xs font-semibold text-gray-400 mb-1">Kalkulation</div>
        <Row label="Bruttolohn/Std."  sub={lohn.short}               value={fmtEuro(bStd)}/>
        <Row label="AG-SVS/Std."      sub={`${(SVS*100).toFixed(1)}%`} value={fmtEuro(svs)}/>
        <Row label="Vollkosten/Std."                                  value={fmtEuro(kStd)}/>
        <Row label="Gesamtlohn"       sub={`${stunden}h × ${ma} MA`} value={fmtEuro(lGes)}/>
        <Row label={`Aufschlag ${aufschlag}%`}                        value={fmtEuro(aufBet)}/>
        <Row label="Fahrk. + Material"                                value={fmtEuro((+fahrk)+(+material))}/>
        {mwst&&<Row label="Netto"                                     value={fmtEuro(netto)}/>}
        {mwst&&<Row label="MwSt. 19 %"                                value={fmtEuro(mwstB)}/>}
        <Row label={mwst?"Angebotspreis Brutto":"Angebotspreis Netto"} value={fmtEuro(brutto)} bold/>
        <div className="mt-1 text-right text-xs text-gray-500">→ {fmtEuro(brutto/(stunden*ma||1))} / Std.</div>
      </div>
    </div>
  );
}

function Einstellungen({ company, setCompany }) {
  const [f, setF] = useState(company);
  const set = (k,v) => setF(p=>({...p,[k]:v}));
  return (
    <div className="p-4 max-w-lg">
      <h2 className="text-lg font-bold text-white mb-4">Firmeneinstellungen</h2>
      <div className="bg-gray-800 border border-gray-700 rounded-2xl p-4 space-y-3">
        {[["name","Firmenname"],["street","Straße"],["city","PLZ + Ort"],["phone","Telefon"],["email","E-Mail"],["ustid","USt-ID"],["steuernr","Steuernummer"]].map(([k,l])=>
          <DInput key={k} label={l} value={f[k]||""} onChange={e=>set(k,e.target.value)}/>
        )}
        <button onClick={()=>setCompany(f)} className="w-full py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 flex items-center justify-center gap-2 mt-1"><Save size={15}/>Speichern</button>
        <p className="text-xs text-gray-500 text-center">Diese Daten erscheinen auf allen Abnahmezetteln.</p>
      </div>
    </div>
  );
}

const USERS = [
  {id:"mgr",role:"manager", name:"Max Manager",pass:"manager"},
  {id:"e1", role:"employee",name:"Maria Koch",  pass:"maria"  },
  {id:"e2", role:"employee",name:"Ali Hassan",  pass:"ali"    },
];

function Login({ onLogin }) {
  const [pass, setPass] = useState("");
  const [err, setErr]   = useState("");
  const login = () => { const u=USERS.find(u=>u.pass===pass.toLowerCase().trim()); if(u){onLogin(u);return;} setErr("Falsch. Demo: manager · maria · ali"); };
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-3xl shadow-2xl w-full max-w-sm p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/20 text-3xl">🧹</div>
          <h1 className="text-2xl font-bold text-white">CleanTrack Pro</h1>
          <p className="text-sm text-gray-500 mt-1">Gebäudereinigung Verwaltung</p>
        </div>
        {err&&<div className="bg-red-900/30 border border-red-800/50 text-red-400 text-xs px-3 py-2 rounded-lg mb-3 flex items-center gap-2"><AlertCircle size={14}/>{err}</div>}
        <div className="mb-5">
          <label className="text-xs font-semibold text-gray-400 block mb-1">Passwort</label>
          <input type="password" value={pass} onChange={e=>setPass(e.target.value)} placeholder="Passwort eingeben"
            onKeyDown={e=>e.key==="Enter"&&login()}
            className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 placeholder-gray-600"/>
        </div>
        <button onClick={login} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20">Anmelden</button>
        <div className="mt-4 text-xs text-gray-600 text-center">Demo: <span className="text-gray-400 font-mono">manager</span> · <span className="text-gray-400 font-mono">maria</span> · <span className="text-gray-400 font-mono">ali</span></div>
      </div>
    </div>
  );
}

function EmployeeApp({ user, jobs, setJobs, onLogout }) {
  const myJobs = jobs.filter(j=>j.assignedTo===user.id||j.assignedName===user.name);
  return (
    <div className="min-h-screen bg-gray-950">
      <div className="bg-gray-900 border-b border-gray-800 px-4 py-4 flex items-center justify-between">
        <div><div className="font-bold text-white text-lg">Hallo, {user.name.split(" ")[0]} 👋</div><div className="text-xs text-gray-500">{new Date().toLocaleDateString("de-DE",{weekday:"long",day:"numeric",month:"long"})}</div></div>
        <button onClick={onLogout} className="bg-gray-800 border border-gray-700 p-2 rounded-xl text-gray-400 hover:text-white"><LogOut size={18}/></button>
      </div>
      <div className="p-4">
        <div className="text-sm font-semibold text-gray-400 mb-3">Meine Aufträge</div>
        {myJobs.length===0?<div className="text-center py-16 text-gray-600"><Users size={40} className="mx-auto mb-3 opacity-30"/><p>Keine Aufträge zugewiesen.</p></div>
          :myJobs.map(job=>{const sc=STATUS[job.status]||{};return(
            <div key={job.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-4 mb-3">
              <div className="flex items-center gap-2 mb-2"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sc.bg} ${sc.text}`}>{sc.label}</span></div>
              <div className="font-bold text-white">{job.customerName}</div>
              <div className="text-xs text-gray-400">{job.objectName||job.address}</div>
              <div className="text-xs text-gray-500 mt-1">📅 {fmtDate(job.date)} · {job.timeStart}–{job.timeEnd} Uhr</div>
              {job.notes&&<div className="mt-2 text-xs bg-amber-900/20 border border-amber-800/30 text-amber-400 px-3 py-1.5 rounded-lg">{job.notes}</div>}
              {(job.services||[]).length>0&&<div className="mt-2 flex flex-wrap gap-1">{job.services.map(id=>{const s=SERVICES.find(x=>x.id===id);return s?<span key={id} className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">{s.icon} {s.label}</span>:null;})}</div>}
              {job.status!=="done"&&<button onClick={()=>setJobs(p=>p.map(j=>j.id===job.id?{...j,status:"done",abnahme:{completedAt:new Date().toLocaleTimeString("de-DE",{hour:"2-digit",minute:"2-digit"}),signature:false}}:j))} className="w-full mt-3 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 flex items-center justify-center gap-2"><Check size={16}/>Auftrag abschließen</button>}
            </div>
          );})}
      </div>
    </div>
  );
}

const NAV = [
  {id:"dashboard", label:"Dashboard",     icon:Home},
  {id:"jobs",      label:"Aufträge",      icon:ClipboardList},
  {id:"customers", label:"Kunden",        icon:Building},
  {id:"employees", label:"Mitarbeiter",   icon:Users},
  {id:"kalkulator",label:"Kalkulator",    icon:Calculator},
  {id:"settings",  label:"Einstellungen", icon:Settings},
];

export default function CleanTrackPro() {
  const [user, setUser]           = useState(null);
  const [jobs, setJobs]           = useState(INIT_JOBS);
  const [customers, setCustomers] = useState(INIT_CUSTOMERS);
  const [employees, setEmployees] = useState(INIT_EMPLOYEES);
  const [company, setCompany]     = useState(INIT_COMPANY);
  const [page, setPage]           = useState("dashboard");
  const [menuOpen, setMenu]       = useState(false);

  if(!user) return <Login onLogin={setUser}/>;
  if(user.role==="employee") return <EmployeeApp user={user} jobs={jobs} setJobs={setJobs} onLogout={()=>setUser(null)}/>;

  const renderPage = () => {
    switch(page) {
      case "dashboard":  return <Dashboard  jobs={jobs} customers={customers} employees={employees}/>;
      case "jobs":       return <Jobs       jobs={jobs} setJobs={setJobs} customers={customers} employees={employees} company={company}/>;
      case "customers":  return <Customers  customers={customers} setCustomers={setCustomers} jobs={jobs}/>;
      case "employees":  return <Employees  employees={employees} setEmployees={setEmployees} jobs={jobs}/>;
      case "kalkulator": return <Kalkulator/>;
      case "settings":   return <Einstellungen company={company} setCompany={setCompany}/>;
      default: return null;
    }
  };

  return (
    <div style={{display:"flex",height:"100vh",background:"#030712",overflow:"hidden"}}>
      {/* Sidebar – immer sichtbar */}
      <aside style={{width:"14rem",flexShrink:0,background:"#111827",borderRight:"1px solid #1f2937",display:"flex",flexDirection:"column",height:"100vh"}}>
        <div style={{padding:"1.25rem 1rem",borderBottom:"1px solid #1f2937"}}>
          <div style={{display:"flex",alignItems:"center",gap:"0.5rem"}}>
            <div style={{width:"2rem",height:"2rem",background:"#2563eb",borderRadius:"0.75rem",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1rem"}}>🧹</div>
            <div>
              <div style={{fontWeight:700,fontSize:"0.875rem",color:"#fff"}}>CleanTrack</div>
              <div style={{fontSize:"0.75rem",color:"#6b7280"}}>Pro</div>
            </div>
          </div>
        </div>
        <nav style={{flex:1,paddingTop:"0.75rem",overflowY:"auto"}}>
          {NAV.map(item=>{const Icon=item.icon;const active=page===item.id;return(
            <button key={item.id} onClick={()=>setPage(item.id)}
              style={{width:"100%",display:"flex",alignItems:"center",gap:"0.75rem",padding:"0.625rem 1rem",fontSize:"0.875rem",fontWeight:500,background:active?"rgba(37,99,235,0.2)":"transparent",color:active?"#60a5fa":"#9ca3af",borderRight:active?"2px solid #3b82f6":"2px solid transparent",cursor:"pointer",border:"none",textAlign:"left"}}>
              <Icon size={17}/>{item.label}
            </button>
          );})}
        </nav>
        <div style={{padding:"1rem",borderTop:"1px solid #1f2937"}}>
          <div style={{fontSize:"0.75rem",color:"#9ca3af",fontWeight:600}}>{user.name}</div>
          <div style={{fontSize:"0.75rem",color:"#4b5563",marginBottom:"0.75rem"}}>{company.name}</div>
          <button onClick={()=>setUser(null)} style={{display:"flex",alignItems:"center",gap:"0.5rem",fontSize:"0.75rem",color:"#ef4444",fontWeight:600,background:"transparent",border:"none",cursor:"pointer"}}>
            <LogOut size={14}/>Abmelden
          </button>
        </div>
      </aside>
      <main style={{flex:1,overflowY:"auto",minWidth:0}}>
        {renderPage()}
      </main>
    </div>
  );
}

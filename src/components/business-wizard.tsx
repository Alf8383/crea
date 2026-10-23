"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { locations, districtsFor, provincesFor } from "@/lib/locations";
import { getTaxPath } from "@/lib/practical-guides";
import { RuleEngine } from "@/lib/rule-engine";
import { activities, rules, sources } from "@/lib/seed-catalog";
import { sectionNames, visibleQuestions, type Answers, type Question } from "@/lib/questionnaire";
import { scopedStorageKey } from "@/lib/account-storage";
import type { BusinessContext } from "@/lib/types";

const draftKey = "efp-questionnaire-draft";
const sectorMap: Record<string,string> = {
  "Restaurante / alimentos":"alimentos","Tienda / comercio":"comercio",Tecnología:"tecnologia",Servicios:"profesional",Construcción:"construccion",Transporte:"transporte",Manufactura:"manufactura",Turismo:"turismo",Hospedaje:"alojamiento",Educación:"educacion",Salud:"salud",Belleza:"belleza",Agropecuario:"agricultura",Importación:"importacion",Exportación:"exportacion",Entretenimiento:"entretenimiento",Otro:"otro",
};
const amountRanges = ["Menos de S/ 2,500","S/ 2,500 a S/ 5,000","S/ 5,001 a S/ 10,000","S/ 10,001 a S/ 20,000","S/ 20,001 a S/ 50,000","S/ 50,001 a S/ 100,000","Más de S/ 100,000","Todavía no puedo estimarlo"];
const activityExamples:Record<string,string[]>={
  alimentos:["Restaurante","Cafetería","Comida para llevar","Preparación de alimentos","Servicio de catering"],
  comercio:["Tienda de ropa","Bodega o minimarket","Venta de abarrotes","Venta de equipos","Venta por Internet"],
  tecnologia:["Desarrollo de software","Diseño de páginas web","Aplicaciones móviles","Soporte técnico","Consultoría tecnológica"],
  profesional:["Consultoría empresarial","Diseño gráfico","Servicios contables","Asesoría profesional","Servicios técnicos"],
  construccion:["Construcción de viviendas","Remodelación de viviendas","Instalaciones eléctricas","Acabados de construcción","Servicios de contratista"],
  transporte:["Transporte de carga","Transporte de pasajeros","Servicio de taxi","Mensajería y reparto","Transporte turístico"],
  manufactura:["Fabricación de muebles","Confección de ropa","Elaboración de productos","Fabricación de alimentos","Producción artesanal"],
  turismo:["Vendo o reservo pasajes, hoteles y paquetes de otros proveedores","Organizo y opero mis propios tours o excursiones","Ofrezco ambos: agencia de viajes y tours propios","Guía turística","Transporte turístico"],
  alojamiento:["Hospedaje","Hotel","Hostal","Alquiler de habitaciones","Alojamiento turístico"],
  educacion:["Centro de capacitación","Clases particulares","Academia de idiomas","Talleres educativos","Servicio de tutoría"],
  salud:["Consultorio de salud","Atención de enfermería","Servicios de rehabilitación","Consultorio odontológico","Bienestar y terapia"],
  belleza:["Salón de belleza","Peluquería","Manicure y pedicure","Barbería","Tratamientos de belleza"],
  agricultura:["Cultivo de hortalizas","Cultivo de frutas","Producción agrícola","Crianza de animales","Venta de productos del campo"],
  importacion:["Importación de ropa","Importación de equipos","Importación de alimentos","Importación de repuestos","Importación de productos para venta"],
  exportacion:["Exportación de productos agrícolas","Exportación de artesanías","Exportación de alimentos","Venta de productos al extranjero","Exportación de prendas"],
  entretenimiento:["Organización de eventos","Producción musical","Espectáculos en vivo","Actividades recreativas","Producción audiovisual"],
};
const answer = (data: Answers, id: string) => String(data[id] || "");
const number = (data: Answers, id: string) => Number(answer(data,id)) || 0;
const yes = (data: Answers, id: string) => answer(data,id) === "Sí";
const selected = "border-[#1464f6] bg-blue-50 shadow-[0_0_0_1px_#1464f6]";

function toContext(a: Answers): BusinessContext {
  const sectorId = sectorMap[answer(a,"P01")] || "otro";
  const description = answer(a,"P02") || answer(a,"P01.1");
  const normalizeActivity=(text:string)=>text.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLocaleLowerCase("es");
  const normalizedDescription=normalizeActivity(description);
  const tourismAgency = sectorId === "turismo" && /\b(agencia|reserv|pasaj|boleto|tercer|proveedor)\b/.test(normalizedDescription);
  const tourismOperator = sectorId === "turismo" && /oper|organiz|realiz|ofrezco|hago|propio|excursion|tour/.test(normalizedDescription) && !tourismAgency;
  const matched = !normalizedDescription ? undefined : tourismAgency
    ? activities.find(item=>item.id==="agencia")
    : tourismOperator
    ? activities.find(item=>item.id==="operador-turistico")
    : activities.find(item=>item.sectorId===sectorId && (normalizeActivity(item.name).includes(normalizedDescription)||normalizedDescription.includes(normalizeActivity(item.name))))
      || (sectorId !== "otro" ? activities.find(item=>item.sectorId===sectorId) : undefined);
  const invoice = answer(a,"P23");
  const customerAnswer = answer(a,"P22");
  return {
    questionnaire:a,businessName:description || answer(a,"P01.1") || "Mi negocio",purpose:answer(a,"P03").includes("formalizad") ? "revisar" : answer(a,"P03").includes("ventas") || answer(a,"P03").includes("opero") ? "formalizar" : "crear",
    sectorId,activityId:matched?.id || "",otherActivity:description,department:answer(a,"P04"),province:answer(a,"P05")==="No encuentro mi provincia"?answer(a,"P05_TEXT"):answer(a,"P05"),district:answer(a,"P06")==="No encuentro mi distrito"?answer(a,"P06_TEXT"):answer(a,"P06"),
    legalPerson:answer(a,"P09")==="Persona natural"?"natural":answer(a,"P09")==="Persona jurídica / empresa"?"juridica":"aun-no-se",
    hasPartners:["2 personas","3 personas","4 o más"].includes(answer(a,"P07")),partnerCount:answer(a,"P07")==="2 personas"?2:answer(a,"P07")==="3 personas"?3:answer(a,"P07")==="4 o más"?4:1,
    hasPhysicalLocation:yes(a,"P10"),servesPublic:yes(a,"P12") || answer(a,"P12")==="Algunas veces",hasEmployees:yes(a,"P28"),employeeCount:number(a,"P29"),employeeCountPerShift:number(a,"P29.1"),
    sellsOnline:yes(a,"P25"),preparesFood:yes(a,"R01") || yes(a,"M07") || yes(a,"H03") || yes(a,"EN03"),importsGoods:sectorId==="importacion" || yes(a,"C03"),exportsGoods:sectorId==="exportacion" || yes(a,"P27") || yes(a,"A06"),
    providesRegulatedService:false,customerType:customerAnswer==="Personas"?"personas":customerAnswer==="Empresas" || customerAnswer==="Estado"?"empresas":customerAnswer==="Personas y empresas" || customerAnswer==="Personas, empresas y Estado"?"ambos":"aun-no-se",
    monthlyRevenue:answer(a,"P20").startsWith("monto:")?Number(answer(a,"P20").slice(6))||0:0,
    monthlyPurchases:number(a,"TAX_PURCHASES"),annualPurchases:number(a,"TAX_PURCHASES")*12,fixedAssets:number(a,"TAX_ASSETS"),
    needsInvoices:invoice.startsWith("Sí") || invoice==="Probablemente muy pocas veces"?true:invoice.startsWith("No, venderé")?false:null,
    hasMultipleLocations:false,foreignSourceIncome:false,collectsPersonalData:yes(a,"TE02"),
  };
}

function QuestionInput({question,data,setValue}:{question:Question;data:Answers;setValue:(id:string,value:string|string[])=>void}){
  const value = data[question.id];
  const [expandedLegal,setExpandedLegal]=useState<string|null>(null);
  const [categorySearch,setCategorySearch]=useState("");
  const [suggestionsOpen,setSuggestionsOpen]=useState(true);
  const inputClass = "w-full rounded-2xl border border-slate-300 bg-white px-5 py-4 text-lg text-[#10295b] outline-none focus:border-[#1464f6] focus:ring-4 focus:ring-blue-100";
  if(question.id==="P01"){
    const iconByRubric:Record<string,string>={"Restaurante / alimentos":"RESTAURANTE.png","Tienda / comercio":"TIENDA.png","Tecnología":"TECNOLOGIA.png","Servicios":"SERVICIOS.png","Construcción":"CONSTRUCCION.png","Transporte":"TRANSPORTE.png","Manufactura":"MANUFACTURA.png","Turismo":"TURISMO.png","Hospedaje":"HOSPEDAJE.png","Educación":"EDUCACION.png","Salud":"SALUD.png","Belleza":"BELLEZA.png","Agropecuario":"AGROPECUARIO.png","Importación":"IMPORTACION.png","Exportación":"EXPORTACION.png","Entretenimiento":"entretenimiento.png"};
    const normalize=(text:string)=>text.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLocaleLowerCase("es");
    const rubrics=(question.options||[]).filter(item=>item.value!=="Otro"&&normalize(item.label).includes(normalize(categorySearch)));
    const selectedOther=value==="Otro";
    return <div className="space-y-3">
      <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-400 focus-within:border-[#1464f6] focus-within:ring-4 focus-within:ring-blue-100"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-5 w-5 shrink-0" stroke="currentColor" strokeWidth="2"><circle cx="10.8" cy="10.8" r="6.8"/><path strokeLinecap="round" d="m16 16 5 5"/></svg><span className="sr-only">Buscar rubro</span><input type="search" value={categorySearch} onChange={event=>setCategorySearch(event.target.value)} placeholder="Buscar rubro..." className="w-full bg-transparent text-base text-[#10295b] outline-none placeholder:text-slate-400" /></label>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {rubrics.map((item,index)=>{const on=value===item.value;const id="rubric-"+index;return <div key={item.value} className="relative"><input id={id} className="peer sr-only" type="radio" name={question.id} checked={on} onChange={()=>setValue(question.id,item.value)}/><label htmlFor={id} className={"flex min-h-[82px] cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition hover:border-blue-400 peer-focus-visible:ring-4 peer-focus-visible:ring-blue-200 "+(on?selected:"border-slate-200 bg-white")}><span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-blue-100 text-sm font-bold text-[#1464f6]">{(question.options||[]).findIndex(option=>option.value===item.value)+1}</span><Image src={"/rubros/"+iconByRubric[item.value]} alt="" width={34} height={34} className="h-9 w-9 shrink-0 object-contain"/><span className="text-sm font-medium leading-5 text-[#10295b]">{item.label}</span>{on&&<span aria-hidden="true" className="absolute right-2 top-2 grid h-5 w-5 place-items-center rounded-full bg-[#1464f6] text-[11px] text-white">✓</span>}</label></div>})}
        {rubrics.length===0&&<p className="rounded-lg bg-blue-50 p-3 text-sm text-slate-600 sm:col-span-2 xl:col-span-4">No encontramos ese nombre. Si tu actividad no aparece, selecciónala en “Otro”.</p>}
        <div className="col-span-full flex flex-col gap-2 rounded-xl sm:col-span-2 sm:flex-row">
          <div className={"relative flex min-h-[82px] shrink-0 items-center rounded-xl border transition sm:w-48 "+(selectedOther?selected:"border-slate-200 bg-white hover:border-blue-400")}><input id="rubric-other" className="peer sr-only" type="radio" name={question.id} checked={selectedOther} onChange={()=>setValue(question.id,"Otro")}/><label htmlFor="rubric-other" className="flex h-full min-h-[82px] w-full cursor-pointer items-center gap-3 px-4 py-3 peer-focus-visible:ring-4 peer-focus-visible:ring-blue-200"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-blue-100 text-sm font-bold text-[#1464f6]">17</span><span aria-hidden="true" className="text-xl font-black tracking-widest text-[#1464f6]">···</span><span className="text-sm font-medium text-[#10295b]">Otro</span>{selectedOther&&<span aria-hidden="true" className="absolute right-2 top-2 grid h-5 w-5 place-items-center rounded-full bg-[#1464f6] text-[11px] text-white">✓</span>}</label></div>
          {selectedOther&&<label className="flex min-h-[82px] flex-1 items-center"><span className="sr-only">Escribe el rubro de tu negocio</span><input autoFocus type="text" value={answer(data,"P01.1")} onChange={event=>setValue("P01.1",event.target.value)} placeholder="Escribe el rubro..." className={inputClass+" h-full min-h-[58px] rounded-xl py-3 text-base"}/></label>}
        </div>
      </div>
    </div>;
  }
  if(question.id==="P02"){
    const sectorId=sectorMap[answer(data,"P01")]||"otro";
    const query=typeof value==="string"?value:"";
    const examples=sectorId==="otro"?[]:activityExamples[sectorId]||[];
    const normalize=(text:string)=>text.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLocaleLowerCase("es");
    const words=normalize(query).split(/\s+/).filter(word=>word.length>2&&!['para','por','con','del','una','uno','que'].includes(word));
    const suggestions=words.length?examples.filter(example=>words.some(word=>normalize(example).split(/\s+/).some(part=>part.includes(word)||word.includes(part)))):examples;
    return <div className="space-y-5">
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div><p className="max-w-3xl text-base leading-7 text-slate-600">Escribe la actividad con tus propias palabras o elige una sugerencia para empezar. Puedes editarla antes de continuar.</p></div>
        <aside className="flex gap-3 rounded-2xl bg-blue-50 p-4 text-sm leading-6 text-slate-600"><span aria-hidden="true" className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-blue-100 text-lg font-bold text-[#1464f6]">i</span><p><b className="text-[#1464f6]">Puedes escribir en palabras simples.</b><br/>Cuéntanos a qué te dedicarás. Las sugerencias son ejemplos; la actividad y su clasificación oficial se revisarán según lo que describas.</p></aside>
      </div>
      <div className="flex items-center gap-3 rounded-2xl border-2 border-[#1464f6] bg-white px-4 shadow-[0_0_0_3px_#dbeafe] focus-within:ring-4 focus-within:ring-blue-100"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-6 w-6 shrink-0 text-[#10295b]" stroke="currentColor" strokeWidth="2"><circle cx="10.8" cy="10.8" r="6.8"/><path strokeLinecap="round" d="m16 16 5 5"/></svg><label className="sr-only" htmlFor="main-activity-description">Describe la actividad principal</label><input id="main-activity-description" autoFocus type="text" value={query} onChange={event=>setValue(question.id,event.target.value)} placeholder="Escribe a qué se dedicará tu negocio..." className="min-w-0 flex-1 bg-transparent py-4 text-lg text-[#10295b] outline-none placeholder:text-slate-400"/><button type="button" aria-label="Borrar descripción" onClick={()=>setValue(question.id,"")} disabled={!query} className="grid h-9 w-9 place-items-center rounded-full text-xl text-[#1464f6] hover:bg-blue-50 disabled:invisible">×</button><span aria-hidden="true" className="h-9 border-l border-slate-200"/><button type="button" aria-label={suggestionsOpen?"Ocultar sugerencias":"Mostrar sugerencias"} aria-expanded={suggestionsOpen} onClick={()=>setSuggestionsOpen(open=>!open)} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-[#10295b] hover:bg-blue-50"><svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" className={"h-5 w-5 transition-transform "+(suggestionsOpen?"":"-rotate-90")}><path d="m4.5 7 5.5 5.5L15.5 7z"/></svg></button></div>
      {sectorId==="otro"?<p className="text-sm text-slate-500">Elegiste “Otro”: puedes describir tu actividad libremente; no mostraremos sugerencias de un rubro distinto.</p>:suggestionsOpen&&<section aria-label="Sugerencias de actividad" className="space-y-3"><h2 className="text-sm font-semibold text-slate-500">{query.trim()?"Sugerencias relacionadas":"Algunas ideas para este rubro"}</h2>{suggestions.length>0?<div className="flex flex-wrap gap-2">{suggestions.map(example=><button type="button" key={example} onClick={()=>setValue(question.id,example)} className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-3 text-sm font-medium text-[#0a4db7] transition hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="2"><circle cx="10.8" cy="10.8" r="6.8"/><path strokeLinecap="round" d="m16 16 5 5"/></svg>{example}</button>)}</div>:<p className="text-sm text-slate-500">No encontramos una sugerencia parecida. Puedes continuar con tu propia descripción.</p>}</section>}
      <p className="flex items-center gap-2 text-sm text-slate-500"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M6 3.75h8l4 4v12.5H6zM14 3.75v4h4M9 12h6M9 15.5h6"/></svg>Usaremos tu descripción para orientar las siguientes preguntas de tu negocio.</p>
    </div>;
  }
  if(question.id==="P03"){
    const details:Record<string,{description:string;icon:React.ReactNode}>={
      "Solo tengo la idea":{description:"Aún no he empezado a vender ni a operar.",icon:<><path d="M9 18h6m-5 4h4m-5-8a7 7 0 1 1 6 0c-.8.6-1 1.2-1 2h-4c0-.8-.2-1.4-1-2Z"/><path d="M12 2v2m9 8h-2M5 12H3m15.4-6.4-1.4 1.4M7 7 5.6 5.6"/></>},
      "Estoy preparando el negocio":{description:"Estoy organizando requisitos, local o documentos.",icon:<><path d="M6 3h8l4 4v14H6zM14 3v5h5M9 12h6m-6 4h6"/></>},
      "Ya realizo algunas ventas":{description:"He comenzado a vender de forma inicial o esporádica.",icon:<><path d="M3 4h2l2.2 11h10.9l2-8H6"/><circle cx="9" cy="19" r="1.5"/><circle cx="17" cy="19" r="1.5"/></>},
      "Ya opero regularmente":{description:"Mi negocio ya funciona de manera continua.",icon:<><path d="m3 17 6-6 4 3 8-9"/><path d="M15 5h6v6"/></>},
      "Estoy formalizado parcialmente":{description:"Tengo algunos trámites hechos, pero no todo completo.",icon:<><rect x="5" y="4" width="14" height="18" rx="2"/><path d="M9 4V2h6v2m-6 7 2 2 4-4m-6 7h6"/></>},
      "Ya tengo una empresa formalizada":{description:"Mi negocio ya está constituido y en regla en gran parte.",icon:<><rect x="4" y="3" width="16" height="19" rx="2"/><path d="M9 7h2v2H9zm4 0h2v2h-2zm-4 4h2v2H9zm4 0h2v2h-2zm-4 4h2v2H9zm4 0h2v2h-2zM2 22h20"/></>},
    };
    return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{question.options?.map((item,index)=>{const on=value===item.value;const info=details[item.value];const id="stage-option-"+index;return <div key={item.value} className="relative"><input id={id} className="peer sr-only" type="radio" name={question.id} checked={on} onChange={()=>setValue(question.id,item.value)}/><label htmlFor={id} className={'relative flex min-h-36 cursor-pointer items-start gap-4 rounded-2xl border p-5 transition hover:border-blue-400 peer-focus-visible:ring-4 peer-focus-visible:ring-blue-200 '+(on?selected:'border-slate-200 bg-white')}><span aria-hidden="true" className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-blue-50 text-[#1464f6]"><svg viewBox="0 0 24 24" fill="none" className="h-9 w-9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{info.icon}</svg></span><span className="pt-1"><span className="block font-bold leading-6 text-[#10295b]">{item.label}</span><span className="mt-2 block text-sm leading-5 text-slate-500">{info.description}</span></span>{on&&<span aria-hidden="true" className="absolute right-3 top-3 grid h-6 w-6 place-items-center rounded-full bg-[#1464f6] text-xs text-white">✓</span>}</label></div>})}</div>;
  }
  if(question.id==="P04"){
    const department=answer(data,"P04"),province=answer(data,"P05"),district=answer(data,"P06");
    const departments=[...new Set(locations.map(item=>item.department))];
    const provinces=provincesFor(department);
    const districts=districtsFor(department,province);
    const fieldClass="w-full rounded-xl border border-slate-300 bg-white px-4 py-3.5 text-base text-[#10295b] outline-none transition focus:border-[#1464f6] focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400";
    const pin=<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-[#1464f6]" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></svg>;
    const selectField=(label:string,list:string[],current:string,onChange:(value:string)=>void,disabled=false,extra?:ReactNode)=><label className="block min-w-0"><span className="mb-2 flex items-center gap-2 font-semibold text-[#10295b]">{pin}{label}</span><select value={current} onChange={event=>onChange(event.target.value)} disabled={disabled} className={fieldClass}><option value="">Selecciona {label.toLowerCase()}</option>{list.map(item=><option key={item} value={item}>{item}</option>)}{extra}</select></label>;
    return <div className="space-y-4">
      <div className="rounded-2xl border border-blue-200 bg-blue-50/40 p-5 sm:p-8">
        <div className="grid items-end gap-4 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1fr)]">
          {selectField("Departamento",departments,department,value=>setValue("P04",value))}
          <span aria-hidden="true" className="hidden pb-4 text-2xl font-bold text-slate-300 md:block">→</span>
          {selectField("Provincia",provinces,province,value=>setValue("P05",value),!department,<option value="No encuentro mi provincia">No encuentro mi provincia</option>)}
          <span aria-hidden="true" className="hidden pb-4 text-2xl font-bold text-slate-300 md:block">→</span>
          {selectField("Distrito",districts,district,value=>setValue("P06",value),!province,<option value="No encuentro mi distrito">No encuentro mi distrito</option>)}
        </div>
        {province==="No encuentro mi provincia"&&<label className="mt-4 block"><span className="sr-only">Escribe tu provincia</span><input className={fieldClass} value={answer(data,"P05_TEXT")} onChange={event=>setValue("P05_TEXT",event.target.value)} placeholder="Escribe el nombre de tu provincia"/></label>}
        {district==="No encuentro mi distrito"&&<label className="mt-4 block"><span className="sr-only">Escribe tu distrito</span><input className={fieldClass} value={answer(data,"P06_TEXT")} onChange={event=>setValue("P06_TEXT",event.target.value)} placeholder="Escribe el nombre de tu distrito"/></label>}
        <div className="mt-6 flex items-center gap-4 border-t border-blue-200 pt-5"><span aria-hidden="true" className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#1464f6] text-xl font-bold text-white">i</span><p className="text-sm leading-6 text-slate-600"><b className="block text-[#1464f6]">Podrás cambiar esta ubicación después</b>si tu negocio opera en otra zona.</p></div>
      </div>
      <p className="text-sm text-slate-500">El catálogo de localidades está en ampliación. Si no encuentras tu provincia o distrito, puedes escribirlo aquí.</p>
    </div>;
  }
  if(question.kind==="text" || question.kind==="number"){
    const isTaxAmount=question.id==="TAX_PURCHASES"||question.id==="TAX_ASSETS";
    const presets=question.id==="TAX_PURCHASES"?[["0","S/ 0 (Sin compras de mercadería)"],["500","S/ 500"],["1500","S/ 1,500"],["3500","S/ 3,500"],["6000","S/ 6,000"],["10000","S/ 10,000"]]:question.id==="TAX_ASSETS"?[["0","S/ 0 (Sin equipos ni maquinaria)"],["1500","S/ 1,500"],["5000","S/ 5,000"],["15000","S/ 15,000"],["50000","S/ 50,000"],["100000","S/ 100,000"]]:[];
    return <div className="space-y-4">
      <div className="relative">
        {isTaxAmount&&<span className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-400">S/</span>}
        <input autoFocus type={question.kind==="number"?"number":"text"} min={question.kind==="number"?0:undefined} value={typeof value==="string"?value:""} onChange={event=>setValue(question.id,event.target.value)} placeholder={isTaxAmount?"0.00":question.kind==="number"?"Escribe una cantidad":"Escribe aquí con tus palabras"} className={inputClass+(isTaxAmount?" pl-12":"")}/>
      </div>
      {presets.length>0&&<div className="space-y-2"><p className="text-sm font-semibold text-slate-500">O selecciona un monto aproximado rápido:</p><div className="flex flex-wrap gap-2">{presets.map(([amount,label])=><button type="button" key={amount} onClick={()=>setValue(question.id,amount)} className={"rounded-xl border px-4 py-2.5 text-sm font-semibold transition hover:border-blue-400 "+(value===amount?selected:"border-slate-200 bg-white text-[#10295b]")}>{label}</button>)}</div></div>}
    </div>;
  }
  if(question.kind==="department" || question.kind==="province" || question.kind==="district"){
    const list=question.kind==="department"?locations.map(item=>item.department):question.kind==="province"?provincesFor(answer(data,"P04")):districtsFor(answer(data,"P04"),answer(data,"P05"));
    const options=[...new Set(list)];
    return <div className="space-y-4"><select value={typeof value==="string"?value:""} onChange={event=>setValue(question.id,event.target.value)} className={inputClass}><option value="">Selecciona una opción</option>{options.map(item=><option key={item} value={item}>{item}</option>)}{question.kind==="province"&&<option value="No encuentro mi provincia">No encuentro mi provincia</option>}{question.kind==="district"&&<option value="No encuentro mi distrito">No encuentro mi distrito</option>}</select>{question.kind==="province"&&value==="No encuentro mi provincia"&&<input aria-label="Escribe tu provincia" className={inputClass} value={answer(data,"P05_TEXT")} onChange={event=>setValue("P05_TEXT",event.target.value)} placeholder="Escribe tu provincia" />}{question.kind==="district"&&value==="No encuentro mi distrito"&&<input aria-label="Escribe tu distrito" className={inputClass} value={answer(data,"P06_TEXT")} onChange={event=>setValue("P06_TEXT",event.target.value)} placeholder="Escribe tu distrito" />}</div>;
  }
  if(question.kind==="range"){
    type EstimateLine={id:string;name:string;quantity:string;price:string};
    const savedLines=(()=>{try{const saved=JSON.parse(answer(data,"P20_EST_ITEMS")) as EstimateLine[];return Array.isArray(saved)?saved:[];}catch{return [];}})();
    const legacyCount=answer(data,"P20_EST_COUNT"),legacyPrice=answer(data,"P20_EST_PRICE");
    const estimateLines:EstimateLine[]=savedLines.length?savedLines:legacyCount||legacyPrice?[{id:"legacy",name:"Producto o servicio",quantity:legacyCount,price:legacyPrice}]:[{id:"item-1",name:"",quantity:"",price:""}];
    const updateLines=(lines:EstimateLine[])=>setValue("P20_EST_ITEMS",JSON.stringify(lines));
    const projectedAmount=Math.round(estimateLines.reduce((total,line)=>total+(Number(line.quantity)||0)*(Number(line.price)||0),0)*100)/100;
    const formattedAmount=new Intl.NumberFormat("es-PE",{maximumFractionDigits:2}).format(projectedAmount);
    const allLinesReady=estimateLines.length>0&&estimateLines.every(line=>line.name.trim()&&Number(line.quantity)>0&&Number(line.price)>0);
    return <div className="space-y-5">
      <section className="rounded-2xl border border-blue-200 bg-blue-50/70 p-4 sm:p-5"><h2 className="font-bold text-[#10295b]">Calcula cada producto o servicio por separado</h2><p className="mt-1 text-sm leading-6 text-slate-600">No tienes que usar un mismo precio para todo. Agrega una fila por cada producto, servicio o paquete que ofrecerás; escribe cuántos esperas vender o atender en un mes normal y cuánto cobrarás por cada uno.</p><div className="mt-4 space-y-3">{estimateLines.map((line,index)=><div key={line.id} className="rounded-xl border border-blue-100 bg-white p-3"><div className="mb-2 flex items-center justify-between"><b className="text-sm text-[#10295b]">Oferta {index+1}</b>{estimateLines.length>1&&<button type="button" onClick={()=>updateLines(estimateLines.filter(item=>item.id!==line.id))} className="rounded px-2 py-1 text-sm font-semibold text-rose-700 hover:bg-rose-50">Quitar</button>}</div><div className="grid gap-3 md:grid-cols-3"><label className="block text-sm font-semibold text-[#10295b]">¿Qué ofrecerás?<input type="text" value={line.name} onChange={event=>updateLines(estimateLines.map(item=>item.id===line.id?{...item,name:event.target.value}:item))} placeholder="Ej. corte de cabello, menú, tour" className={inputClass+" mt-1 bg-white text-base"}/></label><label className="block text-sm font-semibold text-[#10295b]">¿Cuántos al mes?<input type="number" min={0} step={1} value={line.quantity} onChange={event=>updateLines(estimateLines.map(item=>item.id===line.id?{...item,quantity:event.target.value}:item))} placeholder="Ej. 12" className={inputClass+" mt-1 bg-white text-base"}/></label><label className="block text-sm font-semibold text-[#10295b]">Precio de cada uno (S/)<input type="number" min={0} step="0.01" value={line.price} onChange={event=>updateLines(estimateLines.map(item=>item.id===line.id?{...item,price:event.target.value}:item))} placeholder="Ej. 35" className={inputClass+" mt-1 bg-white text-base"}/></label></div><p className="mt-2 text-right text-sm text-slate-600">Subtotal estimado: <b>S/ {new Intl.NumberFormat("es-PE",{maximumFractionDigits:2}).format((Number(line.quantity)||0)*(Number(line.price)||0))}</b></p></div>)}</div><button type="button" onClick={()=>updateLines([...estimateLines,{id:`item-${Date.now()}`,name:"",quantity:"",price:""}])} className="mt-3 rounded-lg border border-blue-200 bg-white px-4 py-2.5 text-sm font-bold text-[#1464f6] hover:bg-blue-50">+ Agregar otro producto o servicio</button><div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-3"><p className="text-sm text-slate-700">Total mensual estimado = <b className="text-lg text-[#1464f6]">S/ {formattedAmount}</b></p><button type="button" disabled={!allLinesReady||projectedAmount<=0} onClick={()=>setValue(question.id,"monto:"+projectedAmount)} className="rounded-lg bg-[#1464f6] px-4 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">Usar este total</button></div><p className="mt-3 text-xs leading-5 text-slate-600">Si aún no empezaste, calcula lo que crees que podrías vender. El total es lo que cobrarías, antes de restar compras, alquiler u otros gastos. Completa o quita las filas vacías.</p></section>
      <label className="block font-semibold text-[#10295b]">O escribe directamente cuánto esperas cobrar en un mes<input type="number" min={0} step="0.01" className={inputClass+" mt-2"} value={typeof value==="string"&&value.startsWith("monto:")?value.slice(6):""} onChange={event=>setValue(question.id,event.target.value?"monto:"+event.target.value:"")} placeholder="Ej. S/ 4,000"/></label><p className="text-center text-sm font-semibold text-slate-500">o elige un rango aproximado</p><div className="grid gap-2 sm:grid-cols-2">{amountRanges.map(item=><button type="button" key={item} onClick={()=>setValue(question.id,item)} className={"rounded-xl border px-4 py-3 text-left font-medium transition hover:border-blue-400 "+(value===item?selected:"border-slate-200 bg-white")}>{item}</button>)}</div>
    </div>;
  }
  if(question.id==="P09"){
    const explanations:Record<string,{meaning:string;benefit:string;consideration:string}>={
      "Persona natural":{meaning:"Tú, como persona, registras y realizas la actividad del negocio con tu propio RUC.",benefit:"Suele implicar un inicio más sencillo: no constituyes una empresa en SUNARP para empezar como persona natural con negocio.",consideration:"En general, no hay separación automática entre tus bienes personales y los del negocio; puedes responder personalmente por sus obligaciones."},
      "Persona jurídica / empresa":{meaning:"Creas una entidad con nombre e identidad propios, distinta de las personas que la forman. La empresa actúa por medio de su representante.",benefit:"Puede facilitar trabajar con socios, incorporar inversión y separar el patrimonio del negocio del personal, según el tipo de empresa que constituyas.",consideration:"Debes constituir e inscribir la forma elegida y cumplir sus formalidades. La responsabilidad no es idéntica para todos los tipos ni situaciones."},
    };
    return <div className="grid gap-4 md:grid-cols-2">{question.options?.map((item,index)=>{const on=value===item.value;const info=explanations[item.value];const expanded=expandedLegal===item.value;const detailId="legal-info-"+index;return <article key={item.value} className="overflow-hidden rounded-2xl"><div className={"relative rounded-2xl border transition "+(on?selected:"border-slate-200 bg-white hover:border-blue-400")}><input id={"legal-option-"+index} className="sr-only" type="radio" name={question.id} checked={on} onChange={()=>setValue(question.id,item.value)}/><label htmlFor={"legal-option-"+index} className="flex min-h-24 cursor-pointer items-center gap-4 px-5 py-5 pr-16"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-blue-100 text-xl font-bold text-[#1464f6]">{on?"✓":index+1}</span><span className="font-semibold text-[#10295b]">{item.label}{item.value==="Todavía no lo sé"&&<span className="mt-2 block text-sm font-normal leading-5 text-slate-600">La recomendación final te ayudará a comparar las dos formas.</span>}</span>{on&&<span aria-hidden="true" className="absolute right-12 top-3 grid h-6 w-6 place-items-center rounded-full bg-[#1464f6] text-xs text-white">✓</span>}</label>{info&&<button type="button" aria-label={(expanded?"Ocultar":"Ver")+" explicación de "+item.label} aria-expanded={expanded} aria-controls={detailId} onClick={()=>setExpandedLegal(expanded?null:item.value)} className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full text-[#1464f6] hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-6 w-6" stroke="currentColor" strokeWidth="2"><circle cx="10.8" cy="10.8" r="6.8"/><path strokeLinecap="round" d="m16 16 5 5"/></svg></button>}</div>{expanded&&info&&<div id={detailId} className="space-y-3 rounded-b-2xl border border-t-0 border-blue-200 bg-blue-50/70 p-5 text-sm leading-6 text-slate-700"><p><b className="text-[#10295b]">Qué significa:</b> {info.meaning}</p><p><b className="text-emerald-800">Ventaja:</b> {info.benefit}</p><p><b className="text-amber-900">Ten en cuenta:</b> {info.consideration}</p></div>}</article>})}<p className="rounded-xl bg-blue-50 p-4 text-sm leading-6 text-slate-700 md:col-span-2">La responsabilidad y los trámites dependen del tipo de empresa y de cada caso. <a className="font-bold text-[#1464f6] underline" href="https://www.gob.pe/es/80682-constituir-una-empresa-guia-paso-a-paso-para-emprendedores" target="_blank" rel="noreferrer">Consulta la guía oficial de formalización de PRODUCE ↗</a></p></div>;
  }
  const multiple=question.kind==="multiple";
  return <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{question.options?.map((item,index)=>{const on=multiple?Array.isArray(value)&&value.includes(item.value):value===item.value;return <label key={item.value} className={"relative flex min-h-28 cursor-pointer items-center gap-4 rounded-2xl border p-5 text-lg transition hover:border-blue-400 "+(on?selected:"border-slate-200 bg-white")}><input className="sr-only" type={multiple?"checkbox":"radio"} name={question.id} checked={Boolean(on)} onChange={()=>{if(multiple){const current=Array.isArray(value)?value:[];setValue(question.id,on?current.filter(v=>v!==item.value):[...current,item.value]);}else setValue(question.id,item.value);}}/><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-blue-100 text-xl font-bold text-[#1464f6]">{item.icon || (on?"✓":index+1)}</span><span className="font-medium text-[#10295b]">{item.label}</span>{on&&<span className="absolute right-3 top-3 grid h-6 w-6 place-items-center rounded-full bg-[#1464f6] text-xs text-white">✓</span>}</label>})}</div>;
}

export function BusinessWizard(){
  const router=useRouter();
  const [data,setData]=useState<Answers>({});
  const [section,setSection]=useState(0);
  const [position,setPosition]=useState(0);
  const [busy,setBusy]=useState(false);
  const accountDraftKey=scopedStorageKey(draftKey);
  const accountContextKey=scopedStorageKey("efp-business-context");
  useEffect(()=>{const frame=requestAnimationFrame(()=>{try{const saved=localStorage.getItem(accountDraftKey);const draft=saved?JSON.parse(saved):{};const answers:Answers=draft.answers||{};const requestedQuestion=new URLSearchParams(window.location.search).get("continuar");let restoredSection=Math.min(4,draft.section||0);let restoredPosition=draft.position||0;if(restoredSection===0){if(restoredPosition===4||restoredPosition===5)restoredPosition=3;else if(restoredPosition>5)restoredPosition-=2;}if(requestedQuestion==="tributario"){restoredSection=2;restoredPosition=0;}else if(requestedQuestion){for(let index=0;index<5;index++){const targetPosition=visibleQuestions(index,answers).findIndex(question=>question.id===requestedQuestion);if(targetPosition>=0){restoredSection=index;restoredPosition=targetPosition;break;}}}setData(answers);setSection(restoredSection);setPosition(Math.max(0,Math.min(restoredPosition,visibleQuestions(restoredSection,answers).length-1)));}catch{}});return()=>cancelAnimationFrame(frame);},[accountDraftKey]);
  const current=useMemo(()=>visibleQuestions(section,data),[section,data]);
  const q=current[Math.min(position,Math.max(0,current.length-1))];
  const value=q?data[q.id]:undefined;
  const canContinue=section===4 || !q || (q.optional || (Array.isArray(value)?value.length>0:Boolean(String(value||"").trim()))) && !(q.id==="P01"&&value==="Otro"&&!answer(data,"P01.1").trim()) && !(q.id==="P04"&&(!answer(data,"P05")||!answer(data,"P06")||(answer(data,"P05")==="No encuentro mi provincia"&&!answer(data,"P05_TEXT").trim())||(answer(data,"P06")==="No encuentro mi distrito"&&!answer(data,"P06_TEXT").trim()))) && !(q.id==="P05"&&value==="No encuentro mi provincia"&&!answer(data,"P05_TEXT").trim()) && !(q.id==="P06"&&value==="No encuentro mi distrito"&&!answer(data,"P06_TEXT").trim());
  const setValue=(id:string,value:string|string[])=>setData(previous=>{const next={...previous,[id]:value};if(id==="P04"){next.P05="";next.P05_TEXT="";next.P06="";next.P06_TEXT="";}if(id==="P05"){next.P06="";next.P06_TEXT="";if(value!=="No encuentro mi provincia")next.P05_TEXT="";}if(id==="P06"&&value!=="No encuentro mi distrito")next.P06_TEXT="";localStorage.setItem(accountDraftKey,JSON.stringify({answers:next,section,position}));return next;});
  const move=(direction:1|-1)=>{
    if(direction===1){if(position<current.length-1)setPosition(position+1);else{setSection(Math.min(4,section+1));setPosition(0);}}
    else if(position>0)setPosition(position-1);else if(section>0){const before=visibleQuestions(section-1,data);setSection(section-1);setPosition(Math.max(0,before.length-1));}
    const nextSection=direction===1&&position>=current.length-1?Math.min(4,section+1):direction===-1&&position===0?Math.max(0,section-1):section;
    localStorage.setItem(accountDraftKey,JSON.stringify({answers:data,section:nextSection,position:direction===1&&position>=current.length-1?0:direction===-1&&position===0?Math.max(0,visibleQuestions(nextSection,data).length-1):position+direction}));
  };
  const jumpToQuestion=(questionId:string)=>{
    for(let s=0;s<4;s++){
      const idx=visibleQuestions(s,data).findIndex(item=>item.id===questionId);
      if(idx>=0){
        setSection(s);
        setPosition(idx);
        localStorage.setItem(accountDraftKey,JSON.stringify({answers:data,section:s,position:idx}));
        return;
      }
    }
  };
  const resetWizard=()=>{
    setData({});
    setSection(0);
    setPosition(0);
    try{localStorage.removeItem(accountDraftKey);}catch{}
  };
  const finish=async()=>{
    setBusy(true);
    const context=toContext(data);
    localStorage.setItem(accountContextKey,JSON.stringify(context));
    let targetPath="/negocios/demo/ruta";
    try{
      const res=await fetch("/api/businesses",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(context)});
      if(res.ok){
        const body=await res.json();
        if(body?.id)targetPath=`/negocios/${body.id}/ruta`;
      }
    }catch{}finally{
      setBusy(false);
      router.push(targetPath);
    }
  };
  const previewContext=useMemo(()=>toContext(data),[data]);
  const previewSteps=useMemo(()=>RuleEngine.evaluate(previewContext,rules,sources),[previewContext]);
  const previewTax=useMemo(()=>getTaxPath(previewContext),[previewContext]);
  const summary:[string,string,string][]=[
    ["Actividad",answer(data,"P02")||answer(data,"P01.1")||"Sin definir","P02"],
    ["Rubro",answer(data,"P01"),"P01"],
    ["Ubicación",[answer(data,"P06")==="No encuentro mi distrito"?answer(data,"P06_TEXT"):answer(data,"P06"),answer(data,"P05")==="No encuentro mi provincia"?answer(data,"P05_TEXT"):answer(data,"P05"),answer(data,"P04")].filter(Boolean).join(", "),"P04"],
    ["Etapa",answer(data,"P03"),"P03"],
    ["Propietarios y forma",[answer(data,"P07"),answer(data,"P09")].filter(Boolean).join(" · "),"P07"],
    ["Local",answer(data,"P10")==="Sí"?answer(data,"P11")||"Sí":"No","P10"],
    ["Ventas mensuales",answer(data,"P20").startsWith("monto:")?"S/ "+answer(data,"P20").slice(6):answer(data,"P20"),"P20"],
    ["Compras y activos",[answer(data,"TAX_PURCHASES")?`Compras: S/ ${answer(data,"TAX_PURCHASES")}`:"",answer(data,"TAX_ASSETS")?`Equipos: S/ ${answer(data,"TAX_ASSETS")}`:""].filter(Boolean).join(" · "),"TAX_PURCHASES"],
    ["Clientes y facturas",[answer(data,"P22"),answer(data,"P23")].filter(Boolean).join(" · "),"P22"],
    ["Trabajadores",answer(data,"P28")==="Sí"?`${answer(data,"P29")||0} total (${answer(data,"P29.1")||0} por turno)`:answer(data,"P28"),"P28"],
    ["RUC actual",answer(data,"P32"),"P32"],
  ];
  return <main className="min-h-screen bg-[#edf5fb] px-4 py-5 text-[#071c56] sm:px-8"><div className="mx-auto max-w-7xl overflow-hidden rounded-[28px] bg-white shadow-[0_20px_80px_#0b35751c]"><nav className="flex flex-wrap items-center justify-between gap-3 border-b border-blue-100 px-6 py-5 sm:px-10"><Link href="/" className="text-4xl font-black tracking-tight text-[#0a318c]">Crea</Link><div className="flex flex-wrap items-center gap-2 text-sm font-semibold">{Object.keys(data).length>0&&<button type="button" onClick={resetWizard} className="rounded-xl px-3 py-2.5 text-slate-500 hover:bg-rose-50 hover:text-rose-700">Reiniciar respuestas</button>}<Link href="/negocios/demo/ruta" className="rounded-xl px-3 py-2.5 text-slate-600 hover:bg-blue-50">Ver ruta demo</Link><Link href="/negocios" className="rounded-xl border border-blue-200 px-4 py-2.5 text-[#1464f6] hover:bg-blue-50">Mi espacio</Link></div></nav><div className="px-6 py-7 sm:px-12 sm:py-10"><ol aria-label="Progreso del cuestionario" className="grid grid-cols-5 gap-2">{sectionNames.map((name,index)=><li key={name} className={"text-center text-xs sm:text-sm "+(index===section?"font-bold text-[#1464f6]":"text-slate-500")}><button type="button" onClick={()=>{if(index<=section||Object.keys(data).length>0){setSection(index);setPosition(0);}}} className="group w-full cursor-pointer focus:outline-none"><span className={"mx-auto mb-2 grid h-9 w-9 place-items-center rounded-full border text-sm font-bold transition group-hover:scale-105 "+(index<section?"border-emerald-400 bg-emerald-400 text-white":index===section?"border-[#1464f6] bg-[#1464f6] text-white":"border-slate-200 bg-slate-50")}>{index<section?"✓":index+1}</span><span className="block">{name}</span></button></li>)}</ol>{section<4?<><div className="mt-12 max-w-4xl"><p className="text-lg text-slate-500">Paso {section+1} de 5 · Pregunta {position+1} de {current.length}</p><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-blue-100"><div className="h-full rounded-full bg-[#1464f6] transition-all" style={{width:((position+1)/current.length*100)+"%"}}/></div><h1 className="mt-6 text-3xl font-bold leading-tight sm:text-5xl">{q?.title}</h1><p className="mt-4 text-lg text-slate-600">{q?.help||"Elige la respuesta que mejor describe tu situación actual."}</p></div><div className="mt-9 max-w-7xl">{q&&<QuestionInput key={q.id} question={q} data={data} setValue={setValue}/>}</div><p className="mt-6 text-sm text-slate-500">Tus respuestas se guardan en este navegador para que puedas retomarlas.</p><div className="mt-10 flex justify-between gap-4 border-t border-slate-100 pt-6"><button onClick={()=>move(-1)} disabled={section===0&&position===0} className="rounded-xl border border-slate-200 px-6 py-3 font-bold disabled:opacity-40">← Atrás</button><button onClick={()=>move(1)} disabled={!canContinue} className="rounded-xl bg-[#1464f6] px-8 py-3 font-bold text-white shadow-lg shadow-blue-200 disabled:opacity-40">Siguiente →</button></div></>:<><p className="mt-12 text-lg text-slate-500">Paso 5 de 5 · Resumen ejecutivo</p><h1 className="mt-2 text-3xl font-black sm:text-4xl">Ya conocemos tu negocio</h1><p className="mt-2 text-base text-slate-600">Revisa tu diagnóstico preliminar. Si deseas corregir algún dato, haz clic sobre cualquier tarjeta para ir directo a esa pregunta.</p><div className="mt-6 grid gap-4 rounded-3xl border border-blue-200 bg-gradient-to-r from-blue-50 to-white p-5 sm:grid-cols-2"><div className="rounded-2xl bg-white p-4 shadow-sm"><span className="text-xs font-bold uppercase tracking-wider text-[#1464f6]">Preselección tributaria detectada</span><p className="mt-1 text-xl font-black text-[#071c56]">{previewTax.title}</p><p className="mt-1 text-xs leading-5 text-slate-600">{previewTax.reason}</p></div><div className="rounded-2xl bg-white p-4 shadow-sm"><span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Ruta de formalización</span><p className="mt-1 text-xl font-black text-[#071c56]">{previewSteps.length} pasos identificados para tu negocio</p><p className="mt-1 text-xs leading-5 text-slate-600">Incluye trámites ante SUNAT, {previewContext.legalPerson==="juridica"?"SUNARP, ":""}{previewContext.hasPhysicalLocation?`Municipalidad de ${previewContext.district||"tu distrito"}, `:""}y obligaciones aplicables.</p></div></div><div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{summary.map(([label,val,qId])=><button key={label} type="button" onClick={()=>jumpToQuestion(qId)} className="group flex flex-col justify-between rounded-2xl border border-blue-100 bg-blue-50/50 p-4 text-left transition hover:border-[#1464f6] hover:bg-white"><div className="flex items-center justify-between gap-2"><p className="text-xs font-bold uppercase tracking-wide text-[#1464f6]">{label}</p><span className="text-xs font-bold text-slate-400 group-hover:text-[#1464f6]">Editar ✎</span></div><p className="mt-2 text-sm font-semibold text-[#071c56]">{val||"No informado"}</p></button>)}</div><div className="mt-9 flex flex-wrap justify-between gap-3 border-t border-slate-100 pt-6"><button onClick={()=>move(-1)} className="rounded-xl border border-slate-200 px-6 py-3 font-bold">← Revisar paso anterior</button><button disabled={busy} onClick={finish} className="rounded-xl bg-[#1464f6] px-8 py-3.5 text-base font-bold text-white shadow-lg shadow-blue-200 hover:bg-blue-700 disabled:opacity-50">{busy?"Preparando…":"Ver mi ruta y simulador tributario →"}</button></div></>}</div></div></main>;
}

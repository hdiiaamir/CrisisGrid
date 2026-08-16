/**
 * ============================================================================
 * CRISISGRID — Offline-first disaster resource mesh PWA (Color Edition)
 * Fully self-contained: only `react` is imported. No Dexie, no Leaflet/canvas
 * libs, no PeerJS, no icon packages. Icons are inline SVG.
 * Storage tries window.storage (Artifacts) -> localStorage -> memory fallback.
 * ============================================================================
 */

 import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";

 /* ----------------------------------------------------------------------
  * Storage adapter
  * ------------------------------------------------------------------- */
 const memoryFallback = {};
 const storageAdapter = {
   async get(key) {
     try {
       if (typeof window !== "undefined" && window.storage && window.storage.get) {
         const r = await window.storage.get(key, false);
         return r ? r.value : null;
       }
     } catch (e) {}
     try {
       if (typeof window !== "undefined" && window.localStorage) {
         return window.localStorage.getItem(key);
       }
     } catch (e) {}
     return key in memoryFallback ? memoryFallback[key] : null;
   },
   async set(key, value) {
     try {
       if (typeof window !== "undefined" && window.storage && window.storage.set) {
         await window.storage.set(key, value, false);
         return true;
       }
     } catch (e) {}
     try {
       if (typeof window !== "undefined" && window.localStorage) {
         window.localStorage.setItem(key, value);
         return true;
       }
     } catch (e) {}
     memoryFallback[key] = value;
     return true;
   },
 };
 
 const STORAGE_KEY = "crisisgrid:resources:v3_color";
 
 /* ----------------------------------------------------------------------
  * Inline SVG icons
  * ------------------------------------------------------------------- */
 function Icon({ name, size = 16, strokeWidth = 2, className = "" }) {
   const common = {
     width: size,
     height: size,
     viewBox: "0 0 24 24",
     fill: "none",
     stroke: "currentColor",
     strokeWidth,
     strokeLinecap: "round",
     strokeLinejoin: "round",
     className,
   };
   switch (name) {
     case "wifi":
       return (
         <svg {...common}>
           <path d="M2 8.5a17 17 0 0 1 20 0" />
           <path d="M5.5 12.5a11.5 11.5 0 0 1 13 0" />
           <path d="M9 16.5a6 6 0 0 1 6 0" />
           <circle cx="12" cy="20" r="1.2" fill="currentColor" stroke="none" />
         </svg>
       );
     case "wifi-off":
       return (
         <svg {...common}>
           <path d="M2 2l20 20" />
           <path d="M9.5 4.5a17 17 0 0 1 12.5 4" />
           <path d="M2.5 8.5a17 17 0 0 1 4.5-3" />
           <path d="M5.5 12.5a11.5 11.5 0 0 1 6-3.2" />
           <path d="M13.5 13.3a11.5 11.5 0 0 1 5 3.2" />
           <path d="M9 16.5a6 6 0 0 1 4-1.3" />
           <circle cx="12" cy="20" r="1.2" fill="currentColor" stroke="none" />
         </svg>
       );
     case "users":
       return (
         <svg {...common}>
           <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
           <circle cx="9" cy="7" r="4" />
           <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
           <path d="M16 3.13a4 4 0 0 1 0 7.75" />
         </svg>
       );
     case "battery":
       return (
         <svg {...common}>
           <rect x="2" y="7" width="16" height="10" rx="2" />
           <path d="M22 11v2" />
           <rect x="4.5" y="9.5" width="8" height="5" rx="1" fill="currentColor" stroke="none" />
         </svg>
       );
     case "disk":
       return (
         <svg {...common}>
           <path d="M4 4h12l4 4v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
           <path d="M6 4v4h8V4" />
           <circle cx="12" cy="14" r="3" />
         </svg>
       );
     case "plus":
       return (
         <svg {...common}>
           <path d="M12 5v14M5 12h14" />
         </svg>
       );
     case "x":
       return (
         <svg {...common}>
           <path d="M18 6L6 18M6 6l12 12" />
         </svg>
       );
     case "radio":
       return (
         <svg {...common}>
           <circle cx="12" cy="12" r="2" />
           <path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14" />
         </svg>
       );
     case "send":
       return (
         <svg {...common}>
           <line x1="22" y1="2" x2="11" y2="13" />
           <polygon points="22 2 15 22 11 13 2 9 22 2" />
         </svg>
       );
     case "check":
       return (
         <svg {...common}>
           <polyline points="20 6 9 17 4 12" />
         </svg>
       );
     case "crosshair":
       return (
         <svg {...common}>
           <circle cx="12" cy="12" r="10" />
           <line x1="22" y1="12" x2="18" y2="12" />
           <line x1="6" y1="12" x2="2" y2="12" />
           <line x1="12" y1="6" x2="12" y2="2" />
           <line x1="12" y1="22" x2="12" y2="18" />
         </svg>
       );
     case "trash":
       return (
         <svg {...common}>
           <polyline points="3 6 5 6 21 6" />
           <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
         </svg>
       );
     case "pin":
       return (
         <svg {...common}>
           <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
           <circle cx="12" cy="10" r="3" />
         </svg>
       );
     case "zoom-in":
       return (
         <svg {...common}>
           <circle cx="11" cy="11" r="8" />
           <line x1="21" y1="21" x2="16.65" y2="16.65" />
           <line x1="11" y1="8" x2="11" y2="14" />
           <line x1="8" y1="11" x2="14" y2="11" />
         </svg>
       );
     case "zoom-out":
       return (
         <svg {...common}>
           <circle cx="11" cy="11" r="8" />
           <line x1="21" y1="21" x2="16.65" y2="16.65" />
           <line x1="8" y1="11" x2="14" y2="11" />
         </svg>
       );
     case "target":
       return (
         <svg {...common}>
           <circle cx="12" cy="12" r="10" />
           <circle cx="12" cy="12" r="6" />
           <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
         </svg>
       );
     case "loader":
       return (
         <svg {...common} className={`${className} animate-spin`}>
           <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" />
         </svg>
       );
     case "alert":
       return (
         <svg {...common}>
           <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
           <line x1="12" y1="9" x2="12" y2="13" />
           <line x1="12" y1="17" x2="12.01" y2="17" />
         </svg>
       );
     case "home":
       return (
         <svg {...common}>
           <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
           <polyline points="9 22 9 12 15 12 15 22" />
         </svg>
       );
     case "droplet":
       return (
         <svg {...common}>
           <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
         </svg>
       );
     case "activity":
       return (
         <svg {...common}>
           <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
         </svg>
       );
     default:
       return null;
   }
 }
 
 /* ----------------------------------------------------------------------
  * Theming & Resource Type Visual Styles
  * ------------------------------------------------------------------- */
 const TYPE_CONFIG = {
   shelter: {
     label: "SHELTER",
     iconName: "home",
     badge: "bg-amber-100 text-amber-800 border-amber-300",
     activeBtn: "bg-amber-500 text-white shadow-amber-200",
     bgPin: "bg-amber-500",
     pinRing: "ring-amber-300",
     border: "border-amber-200",
   },
   water: {
     label: "WATER",
     iconName: "droplet",
     badge: "bg-sky-100 text-sky-800 border-sky-300",
     activeBtn: "bg-sky-500 text-white shadow-sky-200",
     bgPin: "bg-sky-500",
     pinRing: "ring-sky-300",
     border: "border-sky-200",
   },
   medical: {
     label: "MEDICAL",
     iconName: "activity",
     badge: "bg-rose-100 text-rose-800 border-rose-300",
     activeBtn: "bg-rose-500 text-white shadow-rose-200",
     bgPin: "bg-rose-500",
     pinRing: "ring-rose-300",
     border: "border-rose-200",
   },
 };
 
 const URGENCY_CONFIG = {
   critical: {
     label: "CRITICAL",
     badge: "bg-rose-500 text-white font-bold animate-pulse",
     dot: "bg-rose-500",
   },
   medium: {
     label: "MEDIUM",
     badge: "bg-amber-400 text-slate-900 font-semibold",
     dot: "bg-amber-400",
   },
   low: {
     label: "STABLE",
     badge: "bg-emerald-100 text-emerald-800 font-medium",
     dot: "bg-emerald-500",
   },
 };
 
 const BOUNDS = { latMin: 33.98, latMax: 34.12, lngMin: -118.36, lngMax: -118.16 };
 
 function project(lat, lng) {
   const x = ((lng - BOUNDS.lngMin) / (BOUNDS.lngMax - BOUNDS.lngMin)) * 100;
   const y = (1 - (lat - BOUNDS.latMin) / (BOUNDS.latMax - BOUNDS.latMin)) * 100;
   return { x: Math.min(99, Math.max(1, x)), y: Math.min(99, Math.max(1, y)) };
 }
 function unproject(xPct, yPct) {
   const lng = BOUNDS.lngMin + (xPct / 100) * (BOUNDS.lngMax - BOUNDS.lngMin);
   const lat = BOUNDS.latMax - (yPct / 100) * (BOUNDS.latMax - BOUNDS.latMin);
   return { lat: Number(lat.toFixed(5)), lng: Number(lng.toFixed(5)) };
 }
 
 const SEED_RESOURCES = [
   { id: "R-1001", type: "shelter", name: "Wilshire Rec Center", units: 120, lat: 34.062, lng: -118.309, urgency: "low", notes: "Generators on, fresh cots available.", updatedAt: Date.now() - 1000 * 60 * 40, node: "NODE-2B9C" },
   { id: "R-1002", type: "water", name: "5th St Distribution Pt", units: 40, lat: 34.041, lng: -118.245, urgency: "critical", notes: "Down to ~40 water packs. Rush supply needed.", updatedAt: Date.now() - 1000 * 60 * 12, node: "NODE-7F3A" },
   { id: "R-1003", type: "medical", name: "Field Aid Station 3", units: 14, lat: 34.09, lng: -118.28, urgency: "critical", notes: "Low on IV fluid and basic bandages.", updatedAt: Date.now() - 1000 * 60 * 3, node: "NODE-2B9C" },
   { id: "R-1004", type: "shelter", name: "Grant Elementary Gym", units: 60, lat: 34.02, lng: -118.34, urgency: "medium", notes: "Pet-friendly zone open.", updatedAt: Date.now() - 1000 * 60 * 90, node: "LOCAL" },
   { id: "R-1005", type: "water", name: "Overlook Tank Site", units: 300, lat: 34.105, lng: -118.2, urgency: "low", notes: "Full reservoir, boil advisory lifted.", updatedAt: Date.now() - 1000 * 60 * 55, node: "NODE-4D11" },
   { id: "R-1006", type: "medical", name: "Mobile Clinic — Ave 26", units: 4, lat: 34.03, lng: -118.19, urgency: "medium", notes: "2 volunteer doctors on site.", updatedAt: Date.now() - 1000 * 60 * 70, node: "NODE-7F3A" },
 ];
 
 function timeAgo(ts) {
   const s = Math.floor((Date.now() - ts) / 1000);
   if (s < 60) return `${s}s ago`;
   const m = Math.floor(s / 60);
   if (m < 60) return `${m}m ago`;
   const h = Math.floor(m / 60);
   return `${h}h ago`;
 }
 function uid(prefix) {
   return `${prefix}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
 }
 function fmtTime() {
   return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
 }
 
 /* ---------------------------- Top Nav ---------------------------- */
 
 function TopNav({ online, setOnline, peerCount, storageKb, onOpenDrawer }) {
   const [battery, setBattery] = useState(null);
   useEffect(() => {
     let mounted = true;
     if (typeof navigator !== "undefined" && navigator.getBattery) {
       navigator.getBattery().then((b) => {
         if (mounted) setBattery(Math.round(b.level * 100));
       }).catch(() => setBattery(null));
     }
     return () => { mounted = false; };
   }, []);
 
   return (
     <header className="bg-slate-900 text-white shadow-md shrink-0">
       <div className="flex items-center justify-between px-4 sm:px-6 h-16 gap-3">
         <div className="flex items-center gap-3">
           <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-sky-400 flex items-center justify-center shadow-inner">
             <Icon name="target" size={20} strokeWidth={2.5} className="text-white" />
           </div>
           <div>
             <div className="flex items-center gap-2">
               <span className="font-sans font-black tracking-tight text-base sm:text-lg">CrisisGrid</span>
               <span className="text-[10px] font-mono tracking-widest uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-1.5 py-0.5 rounded">
                 v3.2 Mesh
               </span>
             </div>
             <p className="text-[11px] text-slate-400 font-sans hidden sm:block">Offline Relief Coordination Network</p>
           </div>
         </div>
 
         <div className="flex items-center gap-2 font-sans text-xs shrink-0">
           <div className="hidden sm:flex items-center gap-1.5 bg-slate-800/80 border border-slate-700/60 px-3 py-1.5 rounded-lg text-slate-300">
             <Icon name="battery" size={14} className="text-emerald-400" />
             <span className="font-semibold font-mono">{battery !== null ? `${battery}%` : "100%"}</span>
           </div>
           <div className="hidden sm:flex items-center gap-1.5 bg-slate-800/80 border border-slate-700/60 px-3 py-1.5 rounded-lg text-slate-300">
             <Icon name="disk" size={14} className="text-sky-400" />
             <span className="font-mono">{storageKb} KB</span>
           </div>
 
           <button
             onClick={() => setOnline((o) => !o)}
             className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium border transition-all ${
               online
                 ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20"
                 : "bg-rose-500/10 border-rose-500/30 text-rose-300 hover:bg-rose-500/20"
             }`}
           >
             <span className={`w-2 h-2 rounded-full ${online ? "bg-emerald-400 animate-pulse" : "bg-rose-400"}`} />
             <Icon name={online ? "wifi" : "wifi-off"} size={14} />
             <span className="hidden xs:inline">{online ? "Mesh Online" : "Offline Mode"}</span>
           </button>
 
           <button
             onClick={onOpenDrawer}
             className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg font-medium shadow-sm transition-colors"
           >
             <Icon name="users" size={14} />
             <span>{peerCount}</span>
             <span className="hidden md:inline text-indigo-200 text-[11px]">Peers</span>
           </button>
         </div>
       </div>
     </header>
   );
 }
 
 /* ---------------------------- Filter Bar ---------------------------- */
 
 function FilterBar({ filters, toggleFilter, counts }) {
   const items = [
     { key: "shelter", label: "Shelters" },
     { key: "water", label: "Water Hubs" },
     { key: "medical", label: "Medical Aid" },
   ];
   return (
     <div className="flex items-center gap-2 px-4 sm:px-6 py-3 bg-white border-b border-slate-200 shadow-sm overflow-x-auto shrink-0">
       <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 mr-1 hidden sm:inline">Filters:</span>
       {items.map(({ key, label }) => {
         const active = filters[key];
         const conf = TYPE_CONFIG[key];
         return (
           <button
             key={key}
             onClick={() => toggleFilter(key)}
             className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all border ${
               active
                 ? `${conf.activeBtn} border-transparent shadow-sm scale-105`
                 : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
             }`}
           >
             <Icon name={conf.iconName} size={14} />
             <span>{label}</span>
             <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${active ? "bg-white/30 text-white" : "bg-slate-200 text-slate-700"}`}>
               {counts[key] ?? 0}
             </span>
           </button>
         );
       })}
 
       <div className="w-px h-6 bg-slate-200 mx-1 shrink-0" />
 
       <button
         onClick={() => toggleFilter("criticalOnly")}
         className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
           filters.criticalOnly
             ? "bg-rose-600 text-white border-transparent shadow-sm ring-2 ring-rose-200"
             : "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
         }`}
       >
         <Icon name="alert" size={13} />
         Critical Needs Only
       </button>
     </div>
   );
 }
 
 /* ---------------------------- Interactive Map Field ---------------------------- */
 
 function MapField({ resources, selectedId, setSelectedId, pendingPoint, mapMode, onMapClick }) {
   const worldRef = useRef(null);
   const [scale, setScale] = useState(1);
   const [offset, setOffset] = useState({ x: 0, y: 0 });
   const [dragging, setDragging] = useState(false);
   const dragState = useRef({ dragging: false, startX: 0, startY: 0, startOffset: { x: 0, y: 0 }, moved: false });
 
   const clampScale = (s) => Math.min(3, Math.max(0.6, s));
 
   const onWheel = (e) => {
     e.preventDefault();
     const delta = e.deltaY > 0 ? -0.15 : 0.15;
     setScale((s) => clampScale(s + delta));
   };
 
   const onPointerDown = (e) => {
     dragState.current = { dragging: true, startX: e.clientX, startY: e.clientY, startOffset: offset, moved: false };
     setDragging(true);
   };
   const onPointerMove = (e) => {
     if (!dragState.current.dragging) return;
     const dx = e.clientX - dragState.current.startX;
     const dy = e.clientY - dragState.current.startY;
     if (Math.abs(dx) > 3 || Math.abs(dy) > 3) dragState.current.moved = true;
     setOffset({ x: dragState.current.startOffset.x + dx, y: dragState.current.startOffset.y + dy });
   };
   const onPointerUp = (e) => {
     const wasDrag = dragState.current.moved;
     dragState.current.dragging = false;
     setDragging(false);
     if (!wasDrag && mapMode && worldRef.current) {
       const rect = worldRef.current.getBoundingClientRect();
       const xPct = ((e.clientX - rect.left) / rect.width) * 100;
       const yPct = ((e.clientY - rect.top) / rect.height) * 100;
       if (xPct >= 0 && xPct <= 100 && yPct >= 0 && yPct <= 100) {
         onMapClick(unproject(xPct, yPct));
       }
     }
   };
 
   const resetView = () => {
     setScale(1);
     setOffset({ x: 0, y: 0 });
   };
 
   const gridLines = [0, 25, 50, 75, 100];
 
   return (
     <div className="relative flex-1 min-h-[360px] rounded-2xl border border-slate-200 bg-slate-50 overflow-hidden shadow-sm select-none">
       {/* Top Map Banner */}
       <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-30 pointer-events-none">
         <div className="flex items-center gap-2 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-200/80 shadow-sm pointer-events-auto">
           <Icon name="crosshair" size={14} className="text-indigo-600" />
           <span className="text-xs font-semibold text-slate-700">Live Grid View</span>
           <span className="text-[10px] text-slate-400 font-mono">({Math.round(scale * 100)}%)</span>
         </div>
 
         {mapMode && (
           <div className="bg-indigo-600 text-white font-medium text-xs px-3 py-1.5 rounded-lg shadow-lg animate-bounce pointer-events-auto">
             Click anywhere to set emergency pin 📍
           </div>
         )}
       </div>
 
       {/* Floating Controls */}
       <div className="absolute right-3 bottom-3 z-30 flex flex-col gap-1.5 bg-white/95 backdrop-blur-sm p-1 rounded-xl border border-slate-200 shadow-md">
         <button onClick={() => setScale((s) => clampScale(s + 0.2))} className="w-8 h-8 flex items-center justify-center text-slate-700 hover:bg-slate-100 rounded-lg" title="Zoom In">
           <Icon name="zoom-in" size={16} />
         </button>
         <button onClick={() => setScale((s) => clampScale(s - 0.2))} className="w-8 h-8 flex items-center justify-center text-slate-700 hover:bg-slate-100 rounded-lg" title="Zoom Out">
           <Icon name="zoom-out" size={16} />
         </button>
         <button onClick={resetView} className="w-8 h-8 flex items-center justify-center text-slate-700 hover:bg-slate-100 rounded-lg" title="Center View">
           <Icon name="target" size={16} />
         </button>
       </div>
 
       {/* Canvas Area */}
       <div
         className={`absolute inset-0 overflow-hidden ${mapMode ? "cursor-crosshair" : dragging ? "cursor-grabbing" : "cursor-grab"}`}
         onWheel={onWheel}
         onPointerDown={onPointerDown}
         onPointerMove={onPointerMove}
         onPointerUp={onPointerUp}
       >
         <div
           ref={worldRef}
           className="absolute inset-0"
           style={{
             transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
             transformOrigin: "50% 50%",
             backgroundImage:
               "radial-gradient(#cbd5e1 1.5px, transparent 1.5px), linear-gradient(to right, #e2e8f0 1px, transparent 1px), linear-gradient(to bottom, #e2e8f0 1px, transparent 1px)",
             backgroundSize: "24px 24px, 120px 120px, 120px 120px",
             backgroundColor: "#f8fafc",
           }}
         >
           {/* Coordinates Labels */}
           {gridLines.map((g) => {
             const { lat } = unproject(0, g);
             return (
               <span key={`lat-${g}`} className="absolute left-2 text-[10px] font-mono text-slate-400 font-medium" style={{ top: `${g}%` }}>
                 {lat.toFixed(3)}°N
               </span>
             );
           })}
           {gridLines.map((g) => {
             const { lng } = unproject(g, 0);
             return (
               <span key={`lng-${g}`} className="absolute bottom-2 text-[10px] font-mono text-slate-400 font-medium" style={{ left: `${g}%` }}>
                 {lng.toFixed(3)}°W
               </span>
             );
           })}
 
           {/* Pending Drop Marker */}
           {pendingPoint && (
             <div
               className="absolute -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none animate-pulse"
               style={{ left: `${project(pendingPoint.lat, pendingPoint.lng).x}%`, top: `${project(pendingPoint.lat, pendingPoint.lng).y}%` }}
             >
               <div className="w-8 h-8 rounded-full border-2 border-dashed border-indigo-600 bg-indigo-500/20 flex items-center justify-center">
                 <div className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
               </div>
             </div>
           )}
 
           {/* Render Active Resource Markers */}
           {resources.map((r) => {
             const { x, y } = project(r.lat, r.lng);
             const isSelected = r.id === selectedId;
             const conf = TYPE_CONFIG[r.type];
             const isCritical = r.urgency === "critical";
 
             return (
               <button
                 key={r.id}
                 onPointerDown={(e) => e.stopPropagation()}
                 onClick={(e) => {
                   e.stopPropagation();
                   if (!mapMode) setSelectedId(r.id === selectedId ? null : r.id);
                 }}
                 className="absolute -translate-x-1/2 -translate-y-full group z-20 transition-transform duration-150"
                 style={{ left: `${x}%`, top: `${y}%` }}
               >
                 <div className="flex flex-col items-center">
                   <div
                     className={`relative flex items-center justify-center w-8 h-8 rounded-full shadow-md text-white font-bold transition-all ${
                       conf.bgPin
                     } ${
                       isSelected
                         ? "scale-125 ring-4 ring-indigo-500 shadow-xl"
                         : "group-hover:scale-110 group-hover:shadow-lg"
                     }`}
                   >
                     <Icon name={conf.iconName} size={15} />
                     {isCritical && (
                       <span className="absolute -top-1 -right-1 w-3 h-3 bg-rose-600 rounded-full ring-2 ring-white animate-ping" />
                     )}
                   </div>
                   <div className={`w-1.5 h-2 -mt-0.5 rounded-b-full ${conf.bgPin}`} />
                 </div>
               </button>
             );
           })}
         </div>
       </div>
 
       {resources.length === 0 && (
         <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
           <div className="bg-white/80 backdrop-blur px-4 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-500">
             No locations found with selected filters
           </div>
         </div>
       )}
     </div>
   );
 }
 
 /* ---------------------------- Feed & List View ---------------------------- */
 
 function ResourceList({ resources, selectedId, setSelectedId, onDelete }) {
   return (
     <div className="w-full lg:w-[380px] shrink-0 rounded-2xl border border-slate-200 flex flex-col bg-white shadow-sm overflow-hidden max-h-[450px] lg:max-h-none">
       <div className="px-4 py-3.5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between shrink-0">
         <div className="flex items-center gap-2">
           <span className="w-2 h-2 rounded-full bg-indigo-600" />
           <span className="font-semibold text-xs tracking-wide uppercase text-slate-700">Relief Resources</span>
         </div>
         <span className="text-xs bg-slate-200/80 text-slate-700 px-2 py-0.5 rounded-full font-bold">
           {resources.length} active
         </span>
       </div>
 
       <div className="overflow-y-auto flex-1 divide-y divide-slate-100 p-2 space-y-1">
         {resources
           .slice()
           .sort((a, b) => b.updatedAt - a.updatedAt)
           .map((r) => {
             const isSelected = r.id === selectedId;
             const conf = TYPE_CONFIG[r.type];
             const urg = URGENCY_CONFIG[r.urgency];
 
             return (
               <div
                 key={r.id}
                 onClick={() => setSelectedId(isSelected ? null : r.id)}
                 className={`p-3 rounded-xl cursor-pointer transition-all border ${
                   isSelected
                     ? "bg-indigo-50/70 border-indigo-200 shadow-sm"
                     : "bg-white border-transparent hover:bg-slate-50 hover:border-slate-200"
                 }`}
               >
                 <div className="flex items-start justify-between gap-2">
                   <div className="flex items-center gap-2.5 min-w-0">
                     <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${conf.badge}`}>
                       <Icon name={conf.iconName} size={16} />
                     </div>
                     <div className="min-w-0">
                       <p className="text-xs font-bold text-slate-900 truncate">{r.name}</p>
                       <p className="text-[11px] text-slate-500 truncate">{r.notes || "No additional notes provided"}</p>
                     </div>
                   </div>
                   <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${urg.badge}`}>
                     {urg.label}
                   </span>
                 </div>
 
                 <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100/80 text-[11px] text-slate-500">
                   <span className="font-medium">
                     {r.units != null ? `📦 ${r.units} capacity` : "📍 Open site"}
                   </span>
                   <div className="flex items-center gap-2">
                     <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                       {timeAgo(r.updatedAt)}
                     </span>
                     {isSelected && (
                       <button
                         onClick={(e) => {
                           e.stopPropagation();
                           onDelete(r.id);
                         }}
                         className="text-rose-600 hover:text-rose-700 p-1 hover:bg-rose-50 rounded"
                         title="Delete record"
                       >
                         <Icon name="trash" size={13} />
                       </button>
                     )}
                   </div>
                 </div>
               </div>
             );
           })}
 
         {resources.length === 0 && (
           <div className="py-12 text-center text-slate-400">
             <p className="text-sm font-medium">No resources logged</p>
             <p className="text-xs text-slate-400 mt-0.5">Report a hub or clear your search filters</p>
           </div>
         )}
       </div>
     </div>
   );
 }
 
 /* ---------------------------- Detailed Summary Bar ---------------------------- */
 
 function DetailBar({ resource, onClose, onDelete }) {
   if (!resource) return null;
   const conf = TYPE_CONFIG[resource.type];
   const urg = URGENCY_CONFIG[resource.urgency];
 
   return (
     <div className="mt-3 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shrink-0 animate-fadeIn">
       <div className="flex items-start sm:items-center gap-3 min-w-0">
         <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${conf.badge}`}>
           <Icon name={conf.iconName} size={20} />
         </div>
         <div className="min-w-0">
           <div className="flex items-center gap-2 flex-wrap">
             <h3 className="font-bold text-sm text-slate-900 truncate">{resource.name}</h3>
             <span className={`text-[10px] px-2 py-0.5 rounded-full ${urg.badge}`}>{urg.label}</span>
           </div>
           <p className="text-xs text-slate-500 mt-0.5">{resource.notes || "No notes attached"}</p>
           <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono mt-1">
             <span>Lat: {resource.lat.toFixed(4)}°, Lng: {resource.lng.toFixed(4)}°</span>
             {resource.units && <span>· Capacity: {resource.units}</span>}
             <span>· Updated: {timeAgo(resource.updatedAt)}</span>
           </div>
         </div>
       </div>
 
       <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
         <button
           onClick={() => onDelete(resource.id)}
           className="flex items-center gap-1 text-xs text-rose-600 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg font-medium transition-colors"
         >
           <Icon name="trash" size={14} /> Remove
         </button>
         <button
           onClick={onClose}
           className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
         >
           <Icon name="x" size={16} />
         </button>
       </div>
     </div>
   );
 }
 
 /* ---------------------------- Friendly Report Modal ---------------------------- */
 
 function ReportModal({ open, onClose, onSubmit, pendingPoint, onRequestPin }) {
   const [form, setForm] = useState({ type: "shelter", name: "", units: "", urgency: "low", notes: "", lat: "", lng: "" });
 
   useEffect(() => {
     if (open) {
       setForm((f) => ({ ...f, lat: pendingPoint ? pendingPoint.lat : "", lng: pendingPoint ? pendingPoint.lng : "" }));
     }
   }, [open, pendingPoint]);
 
   if (!open) return null;
   const canSubmit = form.name.trim().length > 0 && form.lat !== "" && form.lng !== "";
 
   const handleSubmit = (e) => {
     e.preventDefault();
     if (!canSubmit) return;
     onSubmit({ ...form, lat: Number(form.lat), lng: Number(form.lng), units: form.units === "" ? null : Number(form.units) });
     setForm({ type: "shelter", name: "", units: "", urgency: "low", notes: "", lat: "", lng: "" });
   };
 
   return (
     <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
       <form onSubmit={handleSubmit} className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-scaleUp">
         <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
           <div className="flex items-center gap-2">
             <div className="w-7 h-7 rounded-lg bg-indigo-500 flex items-center justify-center">
               <Icon name="plus" size={16} className="text-white" />
             </div>
             <h2 className="font-bold text-base">Report Relief Resource</h2>
           </div>
           <button type="button" onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
             <Icon name="x" size={18} />
           </button>
         </div>
 
         <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
           <div>
             <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Select Category</label>
             <div className="grid grid-cols-3 gap-2.5">
               {Object.entries(TYPE_CONFIG).map(([key, conf]) => (
                 <button
                   type="button"
                   key={key}
                   onClick={() => setForm((f) => ({ ...f, type: key }))}
                   className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-all ${
                     form.type === key
                       ? `${conf.activeBtn} border-transparent shadow-md scale-102`
                       : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                   }`}
                 >
                   <Icon name={conf.iconName} size={20} />
                   <span className="text-xs font-bold">{conf.label}</span>
                 </button>
               ))}
             </div>
           </div>
 
           <div>
             <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Facility / Name</label>
             <input
               type="text"
               value={form.name}
               onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
               placeholder="e.g. Community Center, Water Well #4"
               className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
             />
           </div>
 
           <div className="grid grid-cols-2 gap-3">
             <div>
               <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Available Units / Beds</label>
               <input
                 type="number"
                 min="0"
                 value={form.units}
                 onChange={(e) => setForm((f) => ({ ...f, units: e.target.value }))}
                 placeholder="e.g. 150"
                 className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
               />
             </div>
 
             <div>
               <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Urgency Level</label>
               <select
                 value={form.urgency}
                 onChange={(e) => setForm((f) => ({ ...f, urgency: e.target.value }))}
                 className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
               >
                 <option value="low">Stable / Stocked</option>
                 <option value="medium">Medium Priority</option>
                 <option value="critical">🚨 High Critical Need</option>
               </select>
             </div>
           </div>
 
           <div>
             <div className="flex items-center justify-between mb-1.5">
               <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Coordinates</label>
               <button type="button" onClick={onRequestPin} className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1">
                 <Icon name="pin" size={13} /> Select on map
               </button>
             </div>
             <div className="grid grid-cols-2 gap-2">
               <input
                 type="number"
                 step="0.0001"
                 value={form.lat}
                 onChange={(e) => setForm((f) => ({ ...f, lat: e.target.value }))}
                 placeholder="Latitude"
                 className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
               />
               <input
                 type="number"
                 step="0.0001"
                 value={form.lng}
                 onChange={(e) => setForm((f) => ({ ...f, lng: e.target.value }))}
                 placeholder="Longitude"
                 className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
               />
             </div>
           </div>
 
           <div>
             <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Field Notes</label>
             <textarea
               rows={2}
               value={form.notes}
               onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
               placeholder="Add contact info, generator status, hazards..."
               className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
             />
           </div>
         </div>
 
         <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
           <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-200">
             Cancel
           </button>
           <button
             type="submit"
             disabled={!canSubmit}
             className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white shadow-md transition-all ${
               canSubmit ? "bg-indigo-600 hover:bg-indigo-500 hover:scale-102" : "bg-slate-300 cursor-not-allowed shadow-none"
             }`}
           >
             <Icon name="check" size={16} /> Save Resource
           </button>
         </div>
       </form>
     </div>
   );
 }
 
 /* ---------------------------- Mesh Sync Drawer ---------------------------- */
 
 function MeshDrawer({ open, onClose, myPeerId, peers, onConnect, onBroadcast, log, online }) {
   const [inputId, setInputId] = useState("");
   const connectedCount = peers.filter((p) => p.status === "connected").length;
 
   return (
     <div className={`fixed inset-0 z-50 transition-opacity duration-200 ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}>
       <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs" onClick={onClose} />
       <div className={`absolute right-0 top-0 h-full w-full sm:w-[400px] bg-white shadow-2xl flex flex-col transition-transform duration-300 ${open ? "translate-x-0" : "translate-x-full"}`}>
         <div className="px-5 h-16 bg-slate-900 text-white flex items-center justify-between shrink-0">
           <div className="flex items-center gap-2">
             <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
               <Icon name="radio" size={16} />
             </div>
             <span className="font-bold text-sm tracking-wide">P2P Mesh Network</span>
           </div>
           <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
             <Icon name="x" size={18} />
           </button>
         </div>
 
         <div className="p-5 border-b border-slate-100 bg-slate-50/70">
           <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Your Local Node ID</p>
           <div className="flex items-center justify-between bg-white border border-slate-200 px-3.5 py-2 rounded-xl shadow-xs">
             <span className="font-mono text-sm font-bold text-indigo-700">{myPeerId}</span>
             <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
               <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Active
             </span>
           </div>
         </div>
 
         <div className="p-5 border-b border-slate-100">
           <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Connect New Peer</p>
           <div className="flex gap-2">
             <input
               value={inputId}
               onChange={(e) => setInputId(e.target.value.toUpperCase())}
               placeholder="e.g. NODE-9X2A"
               className="flex-1 px-3 py-2 rounded-xl border border-slate-200 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
             />
             <button
               onClick={() => {
                 if (!inputId.trim()) return;
                 onConnect(inputId.trim());
                 setInputId("");
               }}
               disabled={!online}
               className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 rounded-xl shadow-sm transition-colors"
             >
               Pair
             </button>
           </div>
         </div>
 
         <div className="p-5 border-b border-slate-100">
           <div className="flex items-center justify-between mb-2.5">
             <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Connected Nodes ({connectedCount})</p>
             <button
               onClick={onBroadcast}
               disabled={!online || connectedCount === 0}
               className="flex items-center gap-1.5 text-xs bg-indigo-50 text-indigo-700 font-bold px-2.5 py-1 rounded-lg hover:bg-indigo-100"
             >
               <Icon name="send" size={12} /> Sync Now
             </button>
           </div>
 
           <div className="space-y-1.5 max-h-36 overflow-y-auto">
             {peers.map((p) => (
               <div key={p.id} className="flex items-center justify-between bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl">
                 <span className="font-mono text-xs font-bold text-slate-700">{p.id}</span>
                 <span className="text-[11px] font-medium text-emerald-600 flex items-center gap-1">
                   <Icon name="check" size={13} /> Linked
                 </span>
               </div>
             ))}
           </div>
         </div>
 
         <div className="p-5 flex-1 flex flex-col min-h-0 bg-slate-900 text-slate-300">
           <p className="text-[10px] font-mono tracking-widest text-slate-400 uppercase mb-2">Live Mesh Event Stream</p>
           <div className="flex-1 overflow-y-auto font-mono text-xs space-y-1 bg-slate-950 p-3 rounded-xl border border-slate-800">
             {log.map((entry, i) => (
               <p key={i} className="leading-relaxed">
                 <span className="text-slate-500">[{entry.time}]</span>{" "}
                 <span className={entry.text.includes("REPORT") ? "text-amber-400" : "text-emerald-400"}>{entry.text}</span>
               </p>
             ))}
           </div>
         </div>
       </div>
     </div>
   );
 }
 
 /* ---------------------------- Main Application Container ---------------------------- */
 
 export default function App() {
   const [ready, setReady] = useState(false);
   const [resources, setResources] = useState([]);
   const [filters, setFilters] = useState({ shelter: true, water: true, medical: true, criticalOnly: false });
   const [online, setOnline] = useState(true);
   const [peers, setPeers] = useState([{ id: "NODE-2B9C", status: "connected" }]);
   const [drawerOpen, setDrawerOpen] = useState(false);
   const [modalOpen, setModalOpen] = useState(false);
   const [mapMode, setMapMode] = useState(false);
   const [pendingPoint, setPendingPoint] = useState(null);
   const [selectedId, setSelectedId] = useState(null);
   const [log, setLog] = useState([{ time: fmtTime(), text: "MESH_INITIALIZED · NODE-2B9C LINKED" }]);
   const myPeerId = useRef(uid("NODE")).current;
 
   useEffect(() => {
     let mounted = true;
     (async () => {
       const stored = await storageAdapter.get(STORAGE_KEY);
       let parsed = null;
       try {
         parsed = stored ? JSON.parse(stored) : null;
       } catch (e) {
         parsed = null;
       }
       if (!mounted) return;
       if (parsed && Array.isArray(parsed) && parsed.length) {
         setResources(parsed);
       } else {
         setResources(SEED_RESOURCES);
         storageAdapter.set(STORAGE_KEY, JSON.stringify(SEED_RESOURCES));
       }
       setReady(true);
     })();
     return () => { mounted = false; };
   }, []);
 
   useEffect(() => {
     if (ready) storageAdapter.set(STORAGE_KEY, JSON.stringify(resources));
   }, [resources, ready]);
 
   const addLog = useCallback((text) => {
     setLog((l) => [{ time: fmtTime(), text }, ...l].slice(0, 50));
   }, []);
 
   const toggleFilter = (key) => setFilters((f) => ({ ...f, [key]: !f[key] }));
 
   const filtered = useMemo(
     () =>
       resources.filter((r) => {
         if (!filters[r.type]) return false;
         if (filters.criticalOnly && r.urgency !== "critical") return false;
         return true;
       }),
     [resources, filters]
   );
 
   const counts = useMemo(
     () => resources.reduce((acc, r) => ({ ...acc, [r.type]: (acc[r.type] || 0) + 1 }), { shelter: 0, water: 0, medical: 0 }),
     [resources]
   );
 
   const storageKb = useMemo(() => Math.max(1, Math.round(JSON.stringify(resources).length / 1024)), [resources]);
 
   const handleSubmitReport = (data) => {
     const newResource = { id: uid("R"), ...data, updatedAt: Date.now(), node: "LOCAL" };
     setResources((r) => [newResource, ...r]);
     addLog(`BROADCAST_NEW_${newResource.type.toUpperCase()}: "${newResource.name}"`);
     setModalOpen(false);
     setMapMode(false);
     setPendingPoint(null);
     setSelectedId(newResource.id);
   };
 
   const handleDelete = (id) => {
     setResources((r) => r.filter((x) => x.id !== id));
     setSelectedId((s) => (s === id ? null : s));
     addLog(`PURGED_RESOURCE: ${id}`);
   };
 
   const handleConnect = (peerId) => {
     setPeers((p) => [...p.filter((x) => x.id !== peerId), { id: peerId, status: "connected" }]);
     addLog(`PEER_PAIRED: ${peerId}`);
   };
 
   const handleBroadcast = () => {
     const connectedCount = peers.filter((p) => p.status === "connected").length;
     addLog(`BROADCAST_SYNC: ${resources.length} nodes to ${connectedCount} peers`);
   };
 
   const selectedResource = resources.find((r) => r.id === selectedId) || null;
 
   if (!ready) {
     return (
       <div className="h-full min-h-[500px] flex items-center justify-center bg-slate-50 font-sans text-sm text-slate-500 gap-2">
         <Icon name="loader" size={18} className="text-indigo-600" />
         <span>Initializing local mesh database...</span>
       </div>
     );
   }
 
   return (
     <div className="h-full min-h-[650px] flex flex-col bg-slate-100/60 text-slate-800 font-sans antialiased">
       <TopNav
         online={online}
         setOnline={setOnline}
         peerCount={peers.filter((p) => p.status === "connected").length}
         storageKb={storageKb}
         onOpenDrawer={() => setDrawerOpen(true)}
       />
       <FilterBar filters={filters} toggleFilter={toggleFilter} counts={counts} />
 
       <main className="flex-1 flex flex-col lg:flex-row gap-4 p-4 min-h-0 max-w-7xl mx-auto w-full">
         <div className="flex flex-col flex-1 min-h-[380px]">
           <MapField
             resources={filtered}
             selectedId={selectedId}
             setSelectedId={setSelectedId}
             pendingPoint={pendingPoint}
             mapMode={mapMode}
             onMapClick={(pt) => {
               setPendingPoint(pt);
               setMapMode(false);
               setModalOpen(true);
             }}
           />
           {selectedResource && (
             <DetailBar resource={selectedResource} onClose={() => setSelectedId(null)} onDelete={handleDelete} />
           )}
         </div>
         <ResourceList resources={filtered} selectedId={selectedId} setSelectedId={setSelectedId} onDelete={handleDelete} />
       </main>
 
       {/* Floating Action Button */}
       <button
         onClick={() => {
           setPendingPoint(null);
           setModalOpen(true);
         }}
         className="fixed bottom-6 right-6 z-30 flex items-center gap-2 px-5 h-13 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all font-bold text-sm"
       >
         <Icon name="plus" size={18} strokeWidth={2.5} />
         <span>Report Resource</span>
       </button>
 
       <ReportModal
         open={modalOpen}
         onClose={() => {
           setModalOpen(false);
           setMapMode(false);
           setPendingPoint(null);
         }}
         onSubmit={handleSubmitReport}
         pendingPoint={pendingPoint}
         onRequestPin={() => {
           setModalOpen(false);
           setMapMode(true);
         }}
       />
 
       <MeshDrawer
         open={drawerOpen}
         onClose={() => setDrawerOpen(false)}
         myPeerId={myPeerId}
         peers={peers}
         onConnect={handleConnect}
         onBroadcast={handleBroadcast}
         log={log}
         online={online}
       />
     </div>
   );
 }
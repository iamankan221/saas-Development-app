import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient, formatINR } from "@/lib/api";
import { useLocation } from "wouter";
import { TrendingUp, IndianRupee, Clock, Users, Package, AlertTriangle, FileText, Activity, Calendar, Filter, ChevronRight, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function Dashboard() {
  const [timeframe, setTimeframe] = useState("yesterday");
  const [activeTopTab, setActiveTopTab] = useState("quantityWise");
  
  // Date filter state (logic matching Bills.jsx)
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [startText, setStartText] = useState("");
  const [endText, setEndText] = useState("");
  const fromTextRef = useRef(null);
  const toTextRef = useRef(null);

  const { data: summary, isLoading: sl } = useQuery({ queryKey: ["dashboard-summary"], queryFn: apiClient.getDashboardSummary });
  const { data: activity = [], isLoading: al } = useQuery({ queryKey: ["dashboard-activity"], queryFn: async () => {
    const response = await apiClient.getDashboardActivity();
    return response.data || response.activity || response || []; 
  }});
  
  const { data: topItems, isLoading: tl } = useQuery({ 
    queryKey: ["dashboard-top-items", startDate, endDate], 
    queryFn: () => apiClient.getTopSellingItems({ 
      startDate: startDate || undefined, 
      endDate: endDate || undefined 
    }) 
  });

  const [, navigate] = useLocation();

  // Date input logic (copied from Bills.jsx)
  const handleDateChange = (val, textSetter, dateSetter, nextRef = null) => {
    let clean = val.replace(/[^\d]/g, "");
    if (clean.length > 8) clean = clean.slice(0, 8);
    let formatted = clean;
    if (clean.length > 2) formatted = clean.slice(0, 2) + "/" + clean.slice(2);
    if (clean.length > 4) formatted = formatted.slice(0, 5) + "/" + formatted.slice(5);
    
    textSetter(formatted);

    if (formatted.length === 10) {
      const [d, m, y] = formatted.split("/");
      dateSetter(`${y}-${m}-${d}`);
      if (nextRef?.current) nextRef.current.focus();
    } else {
      dateSetter("");
    }
  };

  // Auto-rotate timeframe for dynamic trends (KPI cards only)
  useEffect(() => {
    const periods = ["yesterday", "weekly", "monthly"];
    const interval = setInterval(() => {
      setTimeframe(prev => {
        const nextIndex = (periods.indexOf(prev) + 1) % periods.length;
        return periods[nextIndex];
      });
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const getTrend = (key) => {
    if (!summary?.growth) return undefined;
    return summary.growth[timeframe]?.[key];
  };

  const timeframeLabels = { yesterday: "yesterday", weekly: "prev. week", monthly: "prev. month" };

  const cards = [
    { label: "Today's Sales",   value: formatINR(summary?.todaySales),   icon: TrendingUp,     color: "text-blue-600",   bg: "bg-blue-50",   path: "/bills", trend: getTrend("sales") },
    { label: "Today's Profit",  value: formatINR(summary?.todayProfit),  icon: IndianRupee,    color: "text-emerald-600",bg: "bg-emerald-50", path: "/bills", trend: getTrend("profit") },
    { label: "Unpaid Amount",   value: formatINR(summary?.unpaidAmount), icon: Clock,          color: "text-red-600",    bg: "bg-red-50",     path: "/bills", trend: getTrend("unpaid") },
    { label: "Total Customers", value: summary?.totalCustomers ?? "0",   icon: Users,          color: "text-indigo-600", bg: "bg-indigo-50",  path: "/customers", trend: getTrend("customers"), unit: "new" },
    { label: "Total Stock Value",value: formatINR(summary?.totalStockValue), icon: Package,    color: "text-purple-600", bg: "bg-purple-50",  path: "/inventory", wide: true },
    { label: "Low Stock Items", value: summary?.lowStockCount ?? "0",    icon: AlertTriangle,  color: "text-amber-600",  bg: "bg-amber-50",   path: "/inventory" },
    { label: "Expiring Soon",   value: summary?.expiringItemsCount ?? "0", icon: AlertTriangle, color: "text-orange-600", bg: "bg-orange-50",  path: "/inventory" },
  ];

  const currentTopList = topItems?.[activeTopTab] || [];
  const maxVal = currentTopList.length > 0 ? (activeTopTab === 'quantityWise' ? currentTopList[0].quantity : (activeTopTab === 'valueWise' ? currentTopList[0].value : currentTopList[0].profit)) : 1;

  const tabConfigs = {
    quantityWise: { label: "Quantity", icon: Package, color: "text-blue-600", bg: "bg-blue-50", unit: "PCS" },
    valueWise: { label: "Value", icon: TrendingUp, color: "text-indigo-600", bg: "bg-indigo-50", unit: "VAL" },
    profitWise: { label: "Profit", icon: Activity, color: "text-emerald-600", bg: "bg-emerald-50", unit: "PROF" },
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard Overview</h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">Live business analytics & growth metrics</p>
        </div>
      </div>

      {/* KPI Cards Grid with Dynamic Trends */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div 
              key={card.label} 
              className={`card p-5 cursor-pointer hover:shadow-md transition-all flex flex-col justify-between min-h-[140px] ${card.wide ? "md:col-span-2" : ""}`}
              onClick={() => navigate(card.path)}
            >
              <div className="flex items-start justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{card.label}</span>
                <div className={`w-8 h-8 rounded-lg ${card.bg} flex items-center justify-center`}>
                  <Icon className={`w-4 h-4 ${card.color}`} />
                </div>
              </div>
              
              <div className="mt-2">
                <p className={`text-3xl tracking-tight font-bold ${card.color}`}>
                  {sl ? <span className="animate-pulse opacity-20">—</span> : card.value}
                </p>
                
                {card.trend !== undefined && !sl && (
                  <div key={timeframe} className="mt-2 flex items-center gap-1.5 animate-pulse-fade">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5 ${card.trend >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}>
                      {card.trend >= 0 ? "+" : ""}{card.trend} {card.unit || "%"}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">vs {timeframeLabels[timeframe]}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Combined Top Performing Items Section */}
        <div className="lg:col-span-2 card overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 bg-slate-50/30 flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
            <div className="flex items-center gap-3 shrink-0">
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-200">
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
              <h2 className="hidden sm:block font-black text-slate-900 text-sm uppercase tracking-tight">Top Performers</h2>
            </div>

            <div className="flex items-center gap-3">
              {/* Toggle Switch */}
              <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/50">
                {Object.entries(tabConfigs).map(([key, config]) => (
                  <button
                    key={key}
                    onClick={() => setActiveTopTab(key)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                      activeTopTab === key 
                        ? "bg-white text-blue-600 shadow-sm" 
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <config.icon className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{config.label}</span>
                  </button>
                ))}
              </div>

              {/* Advanced Date Filter with Integrated Layout */}
              <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-sm">
                
                {/* START DATE */}
                <div className="flex items-center gap-2 group">
                   <div className="relative w-4 h-4 flex items-center justify-center">
                      <Calendar 
                        className="w-3.5 h-3.5 text-slate-900 group-hover:text-blue-600 transition-colors cursor-pointer" 
                        onClick={() => document.getElementById('dash-start-native')?.showPicker?.() || document.getElementById('dash-start-native')?.click()}
                      />
                      <input 
                        id="dash-start-native"
                        type="date" 
                        className="absolute invisible pointer-events-none w-0 h-0 overflow-hidden"
                        tabIndex={-1}
                        value={startDate}
                        onChange={e => {
                          const v = e.target.value;
                          setStartDate(v);
                          if (v) { const [y,m,d] = v.split("-"); setStartText(`${d}/${m}/${y}`); } else setStartText("");
                        }}
                      />
                   </div>
                   <div className="relative w-24 h-5">
                      {!startText && <span className="absolute inset-0 text-[11px] font-black text-slate-600 flex items-center pointer-events-none uppercase tracking-tighter">DD/MM/YYYY</span>}
                      {startText && startText.length < 10 && (
                        <span className="absolute inset-0 text-[11px] font-black text-slate-400 flex items-center pointer-events-none uppercase tracking-tighter">
                          <span className="opacity-0">{startText}</span>
                          { "DD/MM/YYYY".slice(startText.length) }
                        </span>
                      )}
                      <input 
                        ref={fromTextRef}
                        type="text" 
                        value={startText}
                        onChange={e => handleDateChange(e.target.value, setStartText, setStartDate, toTextRef)}
                        maxLength={10}
                        style={{ caretColor: "#2563eb" }}
                        className="absolute inset-0 bg-transparent text-[11px] font-black text-slate-900 focus:outline-none border-none ring-0 focus:ring-0 shadow-none leading-5 uppercase tracking-tighter"
                      />
                   </div>
                </div>

                <span className="text-slate-400 font-bold">—</span>

                {/* END DATE */}
                <div className="flex items-center gap-2 group">
                   <div className="relative w-4 h-4 flex items-center justify-center">
                      <Calendar 
                        className="w-3.5 h-3.5 text-slate-900 group-hover:text-blue-600 transition-colors cursor-pointer" 
                        onClick={() => document.getElementById('dash-end-native')?.showPicker?.() || document.getElementById('dash-end-native')?.click()}
                      />
                      <input 
                        id="dash-end-native"
                        type="date" 
                        className="absolute invisible pointer-events-none w-0 h-0 overflow-hidden"
                        tabIndex={-1}
                        value={endDate}
                        min={startDate}
                        onChange={e => {
                          const v = e.target.value;
                          setEndDate(v);
                          if (v) { const [y,m,d] = v.split("-"); setEndText(`${d}/${m}/${y}`); } else setEndText("");
                        }}
                      />
                   </div>
                   <div className="relative w-24 h-5">
                      {!endText && <span className="absolute inset-0 text-[11px] font-black text-slate-600 flex items-center pointer-events-none uppercase tracking-tighter">DD/MM/YYYY</span>}
                      {endText && endText.length < 10 && (
                        <span className="absolute inset-0 text-[11px] font-black text-slate-400 flex items-center pointer-events-none uppercase tracking-tighter">
                          <span className="opacity-0">{endText}</span>
                          { "DD/MM/YYYY".slice(endText.length) }
                        </span>
                      )}
                      <input 
                        ref={toTextRef}
                        type="text" 
                        value={endText}
                        onChange={e => handleDateChange(e.target.value, setEndText, setEndDate)}
                        maxLength={10}
                        style={{ caretColor: "#2563eb" }}
                        className="absolute inset-0 bg-transparent text-[11px] font-black text-slate-900 focus:outline-none border-none ring-0 focus:ring-0 shadow-none leading-5 uppercase tracking-tighter"
                      />
                   </div>
                </div>

                {(startDate || endDate) && (
                  <button 
                    onClick={() => { setStartDate(""); setEndDate(""); setStartText(""); setEndText(""); }}
                    className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex-1 p-4 min-h-[360px]">
            {tl ? (
              <div className="h-full flex flex-col items-center justify-center gap-3 py-12">
                <div className="w-10 h-10 border-4 border-blue-600/10 border-t-blue-600 rounded-full animate-spin" />
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest animate-pulse">Analyzing Data...</p>
              </div>
            ) : currentTopList.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center gap-4 py-12">
                <Package className="w-16 h-16 text-slate-100" />
                <div className="text-center">
                   <p className="font-black text-slate-300 text-lg uppercase">No Data Found</p>
                   <p className="text-xs text-slate-400 font-medium mt-1">Try expanding your date range</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {currentTopList.map((item, idx) => {
                  const val = activeTopTab === 'quantityWise' ? item.quantity : (activeTopTab === 'valueWise' ? item.value : item.profit);
                  const pct = Math.max(5, (val / maxVal) * 100);
                  const config = tabConfigs[activeTopTab];
                  
                  return (
                    <div key={item.id} className="group relative p-4 rounded-2xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100">
                      <div className="flex items-center justify-between relative z-10">
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-sm font-black text-slate-400 group-hover:text-blue-600 group-hover:border-blue-100 transition-all shadow-sm">
                            {idx + 1}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-black text-slate-900 truncate group-hover:text-blue-600 transition-colors">{item.name}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Product ID: #{item.id}</p>
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <p className={`text-base font-black ${config.color}`}>
                            {activeTopTab === 'quantityWise' ? item.quantity : formatINR(val)}
                          </p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">{config.unit}</p>
                        </div>
                      </div>
                      
                      {/* Performance Bar */}
                      <div className="mt-3 relative h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={`absolute inset-y-0 left-0 rounded-full transition-all duration-1000 ease-out bg-gradient-to-r ${
                            activeTopTab === 'profitWise' ? "from-emerald-400 to-emerald-600" : "from-blue-400 to-blue-600"
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <div className="p-4 bg-slate-50/50 border-t border-slate-100 text-center">
            <button 
              onClick={() => navigate("/analytics")}
              className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:tracking-[0.2em] transition-all flex items-center gap-2 mx-auto"
            >
              View Detailed Analytics <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Activity Feed (Store Activity) */}
        <div className="card overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-600" />
              <h2 className="font-bold text-slate-900 text-sm">Store Activity</h2>
            </div>
          </div>
          <div className="flex-1 divide-y divide-slate-50 overflow-y-auto max-h-[500px] no-scrollbar">
            {al ? (
               <div className="p-12 text-center text-slate-300 font-medium animate-pulse">Loading updates...</div>
            ) : activity.length === 0 ? (
               <div className="p-12 text-center text-slate-400 font-medium">No activity detected.</div>
            ) : (
              activity.map((act) => (
                <div key={act.id} className="flex gap-4 p-4 hover:bg-slate-50/50 transition-colors cursor-pointer group">
                   <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 group-hover:bg-white group-hover:shadow-md transition-all">
                      <FileText className="w-5 h-5 text-slate-400 group-hover:text-blue-600" />
                   </div>
                   <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                         <p className="text-xs font-black text-slate-900 truncate pr-2 leading-tight uppercase tracking-tight">{act.title}</p>
                         <span className="text-[9px] font-black text-slate-300 uppercase whitespace-nowrap pt-0.5">
                            {act.createdAt ? formatDistanceToNow(new Date(act.createdAt)) : "recent"} ago
                         </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-1 font-medium">{act.description}</p>
                      {act.amount && (
                        <p className="text-[11px] font-black text-blue-600 mt-1.5">{formatINR(act.amount)}</p>
                      )}
                   </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

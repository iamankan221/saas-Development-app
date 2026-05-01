import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient, formatINR, formatINRInteger } from "@/lib/api";
import { useLocation } from "wouter";
import { TrendingUp, IndianRupee, Clock, Users, Package, AlertTriangle, FileText, Activity, Calendar, Filter, ChevronRight, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function Dashboard() {
  const { data: settings } = useQuery({ queryKey: ["settings"], queryFn: apiClient.getSettings });
  
  const [timeframe, setTimeframe] = useState("yesterday");
  const [activeTopTab, setActiveTopTab] = useState("quantityWise");
  
  // Date filter state initialized from settings
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [startText, setStartText] = useState("");
  const [endText, setEndText] = useState("");

  useEffect(() => {
    if (settings) {
      if (settings.dashboardRange === "custom") {
        setStartDate(settings.dashStartDate);
        setEndDate(settings.dashEndDate);
        if (settings.dashStartDate) { const [y,m,d] = settings.dashStartDate.split("-"); setStartText(`${d}/${m}/${y}`); }
        if (settings.dashEndDate) { const [y,m,d] = settings.dashEndDate.split("-"); setEndText(`${d}/${m}/${y}`); }
      } else if (settings.dashboardRange) {
        const days = parseInt(settings.dashboardRange);
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - days);
        
        const startStr = start.toISOString().split("T")[0];
        const endStr = end.toISOString().split("T")[0];
        
        setStartDate(startStr);
        setEndDate(endStr);
        const [sy, sm, sd] = startStr.split("-");
        const [ey, em, ed] = endStr.split("-");
        setStartText(`${sd}/${sm}/${sy}`);
        setEndText(`${ed}/${em}/${ey}`);
      }
    }
  }, [settings]);
  const fromTextRef = useRef(null);
  const toTextRef = useRef(null);

  const { data: summary, isLoading: sl } = useQuery({ 
    queryKey: ["dashboard-summary", startDate, endDate], 
    queryFn: () => apiClient.getDashboardSummary({ startDate, endDate }) 
  });
  
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

  // Auto-sync timeframe with selected range
  useEffect(() => {
    if (settings?.dashboardRange === "0") setTimeframe("yesterday");
    else if (settings?.dashboardRange === "7") setTimeframe("weekly");
    else if (settings?.dashboardRange === "30") setTimeframe("monthly");
  }, [settings?.dashboardRange]);

  // Auto-rotate timeframe for dynamic trends (KPI cards only)
  useEffect(() => {
    // Only rotate if we are NOT on a specific fixed range that has a direct trend
    if (["0", "7", "30"].includes(settings?.dashboardRange)) return;

    const periods = ["yesterday", "weekly", "monthly"];
    const interval = setInterval(() => {
      setTimeframe(prev => {
        const nextIndex = (periods.indexOf(prev) + 1) % periods.length;
        return periods[nextIndex];
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [settings?.dashboardRange]);

  const getTrend = (key) => {
    if (!summary?.growth) return undefined;
    return summary.growth[timeframe]?.[key];
  };

  const timeframeLabels = { yesterday: "Yesterday", weekly: "Prev. Week", monthly: "Prev. Month" };

  const isFiltered = summary?.isFiltered;

  const cards = [
    { 
      label: isFiltered ? "Period Sales" : "Today's Sales",   
      value: formatINRInteger(isFiltered ? summary?.periodSales : summary?.todaySales),   
      icon: TrendingUp,     
      color: "text-blue-600",   
      path: "/bills", 
      trend: getTrend("sales") 
    },
    { 
      label: isFiltered ? "Period Profit" : "Today's Profit",  
      value: formatINRInteger(isFiltered ? summary?.periodProfit : summary?.todayProfit),  
      icon: IndianRupee,    
      color: "text-emerald-600",
      path: "/bills", 
      trend: getTrend("profit") 
    },
    { label: "Unpaid Amount",   value: formatINRInteger(summary?.unpaidAmount), icon: Clock,          color: "text-red-600",    path: "/bills", trend: getTrend("unpaid") },
    { 
      label: isFiltered ? "New Customers" : "Total Customers", 
      value: isFiltered ? (summary?.periodNewCustomers ?? "0") : (summary?.totalCustomers ?? "0"),   
      icon: Users,          
      color: "text-indigo-600", 
      path: "/customers", 
      trend: getTrend("customers"), 
      unit: "new" 
    },
    { label: "Total Stock Value",value: formatINRInteger(summary?.totalStockValue), icon: Package,    color: "text-purple-600", path: "/inventory", wide: true },
    { label: "Low Stock Items", value: summary?.lowStockCount ?? "0",    icon: AlertTriangle,  color: "text-amber-600",  path: "/inventory" },
    { label: "Expiring Soon",   value: summary?.expiringItemsCount ?? "0", icon: AlertTriangle, color: "text-orange-600", path: "/inventory" },
  ];

  const currentMetrics = topItems?.[activeTopTab] || { top: [], bottom: [] };
  const topList = currentMetrics.top || [];
  const bottomList = currentMetrics.bottom || [];
  
  const maxVal = topList.length > 0 ? (activeTopTab === 'quantityWise' ? topList[0].quantity : (activeTopTab === 'valueWise' ? topList[0].value : topList[0].profit)) : 1;

  const tabConfigs = {
    quantityWise: { label: "Quantity", icon: Package, color: "text-blue-600", bg: "bg-blue-50", unit: "PCS" },
    valueWise: { label: "Value", icon: TrendingUp, color: "text-indigo-600", bg: "bg-indigo-50", unit: "VAL" },
    profitWise: { label: "Profit", icon: Activity, color: "text-emerald-600", bg: "bg-emerald-50", unit: "PROF" },
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-foreground tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1 font-medium tracking-tight">Live business analytics & growth metrics</p>
        </div>
      </div>

      {/* KPI Cards Grid with Dynamic Trends */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div 
              key={card.label} 
              className={`card p-5 cursor-pointer hover:bg-accent/30 transition-all flex flex-col justify-between min-h-[120px] ${card.wide ? "md:col-span-2" : ""}`}
              onClick={() => navigate(card.path)}
            >
              <div className="flex items-start justify-between">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{card.label}</span>
                <Icon className={`w-4 h-4 opacity-80 transition-opacity ${card.color.replace('blue-600', 'primary').replace('emerald-600', 'emerald-500').replace('red-600', 'destructive').replace('indigo-600', 'primary').replace('purple-600', 'primary').replace('amber-600', 'amber-500').replace('orange-600', 'orange-500')}`} />
              </div>
              
              <div className="mt-1">
                <p className={`text-2xl tracking-tighter font-black ${card.color.replace('blue-600', 'primary').replace('emerald-600', 'emerald-500').replace('red-600', 'destructive').replace('indigo-600', 'primary').replace('purple-600', 'primary').replace('amber-600', 'amber-500').replace('orange-600', 'orange-500')}`}>
                  {sl ? <span className="animate-pulse opacity-20">—</span> : card.value}
                </p>
                
                {card.trend !== undefined && !sl && (
                  <div key={timeframe} className="mt-1 flex items-center gap-1.5 animate-pulse-fade">
                    <span className={`text-[10px] font-black ${card.trend >= 0 ? "text-emerald-500" : "text-destructive"}`}>
                      {card.trend >= 0 ? "↑" : "↓"} {Math.abs(card.trend)}{card.unit || "%"}
                    </span>
                    <span className="text-[9px] text-muted-foreground/50 font-bold uppercase tracking-tight">vs {timeframeLabels[timeframe]}</span>
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
          <div className="p-4 border-b border-border bg-accent/30 flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
            <div className="flex items-center gap-3 shrink-0">
              <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                <Activity className="w-4 h-4 text-primary-foreground" />
              </div>
              <h2 className="hidden sm:block font-black text-foreground text-sm uppercase tracking-tight">Product Velocity</h2>
            </div>

            <div className="flex items-center gap-3">
              {/* Toggle Switch */}
              <div className="flex bg-accent p-1 rounded-xl border border-border">
                {Object.entries(tabConfigs).map(([key, config]) => (
                  <button
                    key={key}
                    onClick={() => setActiveTopTab(key)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                      activeTopTab === key 
                        ? "bg-card text-primary shadow-sm" 
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <config.icon className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{config.label}</span>
                  </button>
                ))}
              </div>

              {/* Advanced Date Filter with Integrated Layout */}
              <div className="flex items-center gap-3 bg-card border border-border rounded-xl px-3 py-1.5 shadow-sm">
                
                {/* START DATE */}
                <div className="flex items-center gap-2 group">
                   <div className="relative w-4 h-4 flex items-center justify-center">
                      <Calendar 
                        className="w-3.5 h-3.5 text-foreground group-hover:text-primary transition-colors cursor-pointer" 
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
                   <div className="relative w-20 h-5">
                      {!startText && <span className="absolute inset-0 text-[11px] font-black text-muted-foreground/60 flex items-center pointer-events-none uppercase tracking-tighter">DD/MM/YYYY</span>}
                      {startText && startText.length < 10 && (
                        <span className="absolute inset-0 text-[11px] font-black text-muted-foreground/30 flex items-center pointer-events-none uppercase tracking-tighter">
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
                        style={{ caretColor: "var(--primary)" }}
                        className="absolute inset-0 bg-transparent text-[11px] font-black text-foreground focus:outline-none border-none ring-0 focus:ring-0 shadow-none leading-5 uppercase tracking-tighter"
                      />
                   </div>
                </div>

                <span className="text-muted-foreground/30 font-bold">—</span>

                {/* END DATE */}
                <div className="flex items-center gap-2 group">
                   <div className="relative w-4 h-4 flex items-center justify-center">
                      <Calendar 
                        className="w-3.5 h-3.5 text-foreground group-hover:text-primary transition-colors cursor-pointer" 
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
                   <div className="relative w-20 h-5">
                      {!endText && <span className="absolute inset-0 text-[11px] font-black text-muted-foreground/60 flex items-center pointer-events-none uppercase tracking-tighter">DD/MM/YYYY</span>}
                      {endText && endText.length < 10 && (
                        <span className="absolute inset-0 text-[11px] font-black text-muted-foreground/30 flex items-center pointer-events-none uppercase tracking-tighter">
                          <span className="absolute opacity-0">{endText}</span>
                          { "DD/MM/YYYY".slice(endText.length) }
                        </span>
                      )}
                      <input 
                        ref={toTextRef}
                        type="text" 
                        value={endText}
                        onChange={e => handleDateChange(e.target.value, setEndText, setEndDate)}
                        maxLength={10}
                        style={{ caretColor: "var(--primary)" }}
                        className="absolute inset-0 bg-transparent text-[11px] font-black text-foreground focus:outline-none border-none ring-0 focus:ring-0 shadow-none leading-5 uppercase tracking-tighter"
                      />
                   </div>
                </div>

                {(startDate || endDate) && (
                  <button 
                    onClick={() => { setStartDate(""); setEndDate(""); setStartText(""); setEndText(""); }}
                    className="p-1 text-destructive hover:bg-destructive/10 rounded transition-colors"
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
                <div className="w-10 h-10 border-4 border-primary/10 border-t-primary rounded-full animate-spin" />
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest animate-pulse">Analyzing Velocity...</p>
              </div>
            ) : topList.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center gap-4 py-12">
                <Package className="w-16 h-16 text-muted-foreground/10" />
                <div className="text-center">
                   <p className="font-black text-muted-foreground/30 text-lg uppercase tracking-widest">No Data Found</p>
                   <p className="text-[10px] text-muted-foreground/50 font-bold mt-1 uppercase tracking-tighter">Try expanding your date range</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* TOP PERFORMERS COLUMN */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2 px-2">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-[10px] font-semibold text-slate-400">High Velocity</span>
                  </div>
                  <div className="space-y-2">
                    {topList.map((item, idx) => {
                      const val = activeTopTab === 'quantityWise' ? item.quantity : (activeTopTab === 'valueWise' ? item.value : item.profit);
                      const pct = Math.max(5, (val / maxVal) * 100);
                      const config = tabConfigs[activeTopTab];
                      
                      return (
                        <div key={`top-${item.id}`} className="group relative p-3 rounded-xl hover:bg-primary/5 transition-all border border-transparent hover:border-primary/20">
                          <div className="flex items-center justify-between relative z-10">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-card border border-border flex items-center justify-center text-[10px] font-bold text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                                {idx + 1}
                              </div>
                              <div className="min-w-0">
                                <p className="text-[13px] font-semibold text-foreground truncate">{item.name}</p>
                                <p className="text-[9px] font-medium text-slate-400 mt-0.5">ID: #{item.id}</p>
                              </div>
                            </div>
                            <div className="text-right ml-4">
                              <p className="text-xs font-bold text-slate-600">
                                {activeTopTab === 'quantityWise' ? item.quantity : formatINR(val)}
                              </p>
                              <p className="text-[9px] font-medium text-slate-400">{config.unit}</p>
                            </div>
                          </div>
                          <div className="mt-2 relative h-1 bg-accent rounded-full overflow-hidden">
                            <div 
                              className="absolute inset-y-0 left-0 rounded-full transition-all duration-1000 ease-out bg-primary"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* LOW PERFORMERS COLUMN */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2 px-2">
                    <Clock className="w-3.5 h-3.5 text-orange-500" />
                    <span className="text-[10px] font-semibold text-slate-400">Slow Moving / Dead Stock</span>
                  </div>
                  <div className="space-y-2">
                    {bottomList.map((item, idx) => {
                      const val = activeTopTab === 'quantityWise' ? item.quantity : (activeTopTab === 'valueWise' ? item.value : item.profit);
                      const pct = Math.max(2, (val / maxVal) * 100);
                      const config = tabConfigs[activeTopTab];
                      
                      return (
                        <div key={`bottom-${item.id}`} className="group relative p-3 rounded-xl hover:bg-destructive/5 transition-all border border-transparent hover:border-destructive/20">
                          <div className="flex items-center justify-between relative z-10">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-card border border-border flex items-center justify-center text-[10px] font-bold text-destructive group-hover:text-destructive group-hover:border-destructive/30 transition-all shadow-sm">
                                {idx + 1}
                              </div>
                              <div className="min-w-0">
                                <p className="text-[13px] font-semibold text-foreground truncate group-hover:text-destructive transition-colors">{item.name}</p>
                                <p className="text-[9px] font-medium text-slate-400 mt-0.5">ID: #{item.id}</p>
                              </div>
                            </div>
                            <div className="text-right ml-4">
                              <p className="text-xs font-bold text-slate-500">
                                {activeTopTab === 'quantityWise' ? item.quantity : formatINR(val)}
                              </p>
                              <p className="text-[9px] font-medium text-slate-400">{config.unit}</p>
                            </div>
                          </div>
                          <div className="mt-2 relative h-1 bg-accent rounded-full overflow-hidden">
                            <div 
                              className="absolute inset-y-0 left-0 rounded-full transition-all duration-1000 ease-out bg-muted-foreground/30"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="p-4 bg-accent/30 border-t border-border text-center">
            <button 
              onClick={() => navigate("/analytics")}
              className="text-[10px] font-bold text-primary transition-all flex items-center gap-2 mx-auto"
            >
              View Detailed Analytics <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Activity Feed (Store Activity) */}
        <div className="card overflow-hidden flex flex-col">
          <div className="p-5 border-b border-border flex items-center justify-between bg-accent/30">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              <h2 className="font-semibold text-foreground text-sm">Store Activity</h2>
            </div>
          </div>
          <div className="flex-1 divide-y divide-border overflow-y-auto max-h-[500px] no-scrollbar">
            {al ? (
               <div className="p-12 text-center text-muted-foreground/30 font-medium animate-pulse">Loading updates...</div>
            ) : activity.length === 0 ? (
               <div className="p-12 text-center text-muted-foreground font-medium">No activity detected.</div>
            ) : (
              activity.map((act) => (
                <div key={act.id} className="flex gap-4 p-4 hover:bg-accent transition-colors cursor-pointer group">
                   <div className="w-10 h-10 rounded-xl bg-accent border border-border flex items-center justify-center shrink-0 group-hover:bg-card group-hover:shadow-md transition-all">
                      <FileText className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
                   </div>
                   <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                         <p className="text-xs font-bold text-foreground truncate pr-2 leading-tight">{act.title}</p>
                         <span className="text-[9px] font-semibold text-muted-foreground/50 whitespace-nowrap pt-0.5">
                            {act.createdAt ? formatDistanceToNow(new Date(act.createdAt)) : "recent"} ago
                         </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-1 line-clamp-1 font-medium">{act.description}</p>
                      {act.amount && (
                        <p className="text-[11px] font-bold text-primary mt-1.5">{formatINR(act.amount)}</p>
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

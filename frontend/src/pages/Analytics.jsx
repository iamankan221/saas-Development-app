import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient, formatINR, formatINRInteger } from "@/lib/api";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { TrendingUp, Package, Activity, IndianRupee, Calendar, Trash2 } from "lucide-react";

const formatShortINR = (val) => {
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
  if (val >= 1000) return `₹${(val / 1000).toFixed(0)}k`;
  return `₹${val}`;
};

export default function Analytics() {
  const [activeTab, setActiveTab] = useState("quantityWise");
  
  // Date filter state
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [startText, setStartText] = useState("");
  const [endText, setEndText] = useState("");
  const fromTextRef = useRef(null);
  const toTextRef = useRef(null);

  const { data: salesData = [], isLoading: sl } = useQuery({ 
    queryKey: ["analytics-sales", startDate, endDate], 
    queryFn: () => apiClient.getSalesAnalytics({ startDate: startDate || undefined, endDate: endDate || undefined }) 
  });
  
  const { data: plData = [], isLoading: pl } = useQuery({ 
    queryKey: ["analytics-pl", startDate, endDate], 
    queryFn: () => apiClient.getProfitLossAnalytics({ startDate: startDate || undefined, endDate: endDate || undefined }) 
  });
  
  const { data: topItems, isLoading: tl } = useQuery({ 
    queryKey: ["analytics-top", startDate, endDate], 
    queryFn: () => apiClient.getTopSellingItems({ startDate: startDate || undefined, endDate: endDate || undefined }) 
  });

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

  const totalRevenue = plData.reduce((a, d) => a + d.revenue, 0);
  const totalProfit  = plData.reduce((a, d) => a + d.profit, 0);
  const margin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : 0;

  const currentTopList = topItems?.[activeTab]?.top || [];

  const tabConfigs = {
    quantityWise: { label: "Quantity", icon: Package, color: "text-blue-600", bg: "bg-blue-50", unit: "Units" },
    valueWise: { label: "Revenue", icon: TrendingUp, color: "text-indigo-600", bg: "bg-indigo-50", unit: "Revenue" },
    profitWise: { label: "Profit", icon: Activity, color: "text-emerald-600", bg: "bg-emerald-50", unit: "Profit" },
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-foreground tracking-tight">Analytics</h1>
          <p className="text-sm text-muted-foreground mt-1 font-medium tracking-tight">Interactive performance Setting</p>
        </div>

        {/* Dynamic Date Filter (Calendar) */}
        <div className="flex items-center gap-3 bg-card border border-border rounded-2xl px-4 py-2 shadow-sm shrink-0 self-start xl:self-center">
            {/* START DATE */}
            <div className="flex items-center gap-2 group">
               <div className="relative w-4 h-4 flex items-center justify-center">
                  <Calendar 
                    className="w-3.5 h-3.5 text-foreground group-hover:text-primary transition-colors cursor-pointer" 
                    onClick={() => document.getElementById('ana-start-native')?.showPicker?.() || document.getElementById('ana-start-native')?.click()}
                  />
                  <input id="ana-start-native" type="date" className="absolute invisible w-0 h-0" tabIndex={-1} value={startDate}
                    onChange={e => { const v = e.target.value; setStartDate(v); if (v) { const [y,m,d] = v.split("-"); setStartText(`${d}/${m}/${y}`); } else setStartText(""); }} />
               </div>
                <div className="relative w-20 h-5">
                   {!startText && <span className="absolute inset-0 text-[11px] font-black text-muted-foreground/60 flex items-center pointer-events-none uppercase tracking-tighter">DD/MM/YYYY</span>}
                   {startText && startText.length < 10 && (
                     <span className="absolute inset-0 text-[11px] font-black text-muted-foreground/30 flex items-center pointer-events-none uppercase tracking-tighter">
                       <span className="opacity-0">{startText}</span>
                       { "DD/MM/YYYY".slice(startText.length) }
                     </span>
                   )}
                   <input ref={fromTextRef} type="text" value={startText} onChange={e => handleDateChange(e.target.value, setStartText, setStartDate, toTextRef)} maxLength={10}
                     style={{ caretColor: "var(--primary)" }} className="absolute inset-0 bg-transparent text-[11px] font-black text-foreground focus:outline-none border-none ring-0 focus:ring-0 shadow-none leading-5 uppercase tracking-tighter" />
                </div>
            </div>

            <span className="text-muted-foreground/30 font-bold">—</span>

            {/* END DATE */}
            <div className="flex items-center gap-2 group">
               <div className="relative w-4 h-4 flex items-center justify-center">
                  <Calendar 
                    className="w-3.5 h-3.5 text-foreground group-hover:text-primary transition-colors cursor-pointer" 
                    onClick={() => document.getElementById('ana-end-native')?.showPicker?.() || document.getElementById('ana-end-native')?.click()}
                  />
                  <input id="ana-end-native" type="date" className="absolute invisible w-0 h-0" tabIndex={-1} value={endDate} min={startDate}
                    onChange={e => { const v = e.target.value; setEndDate(v); if (v) { const [y,m,d] = v.split("-"); setEndText(`${d}/${m}/${y}`); } else setEndText(""); }} />
               </div>
                <div className="relative w-20 h-5">
                   {!endText && <span className="absolute inset-0 text-[11px] font-black text-muted-foreground/60 flex items-center pointer-events-none uppercase tracking-tighter">DD/MM/YYYY</span>}
                   {endText && endText.length < 10 && (
                     <span className="absolute inset-0 text-[11px] font-black text-muted-foreground/30 flex items-center pointer-events-none uppercase tracking-tighter">
                       <span className="opacity-0">{endText}</span>
                       { "DD/MM/YYYY".slice(endText.length) }
                     </span>
                   )}
                   <input ref={toTextRef} type="text" value={endText} onChange={e => handleDateChange(e.target.value, setEndText, setEndDate)} maxLength={10}
                     style={{ caretColor: "var(--primary)" }} className="absolute inset-0 bg-transparent text-[11px] font-black text-foreground focus:outline-none border-none ring-0 focus:ring-0 shadow-none leading-5 uppercase tracking-tighter" />
                </div>
            </div>

            {(startDate || endDate) && (
              <button onClick={() => { setStartDate(""); setEndDate(""); setStartText(""); setEndText(""); }}
                className="p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-950 rounded transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Total Revenue", value: formatINRInteger(totalRevenue),  color: "text-primary" },
          { label: "Total Profit",  value: formatINRInteger(totalProfit),   color: totalProfit >= 0 ? "text-emerald-500" : "text-destructive" },
          { label: "Profit Margin",  value: `${margin}%`,             color: "text-foreground" },
        ].map(c => (
          <div key={c.label} className="card p-5">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{c.label}</p>
            <p className={`text-3xl font-black mt-2 tracking-tighter ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Trend */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-black text-foreground text-sm uppercase tracking-tight flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" /> Sales Trend
            </h2>
          </div>
          {sl ? (
            <div className="h-[240px] flex items-center justify-center text-slate-300 font-bold uppercase animate-pulse">Syncing Trends…</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.1)" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 10, fontWeight: 700, fill: 'hsl(var(--muted-foreground))' }} 
                  tickFormatter={(d) => {
                    return d.includes('-') && d.split('-').length === 3 ? d.slice(5) : d;
                  }} 
                  stroke="hsl(var(--border))" 
                  minTickGap={30}
                />
                <YAxis tick={{ fontSize: 10, fontWeight: 700, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={formatShortINR} stroke="hsl(var(--border))" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))', 
                    borderRadius: '12px',
                    color: 'hsl(var(--foreground))',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.3)'
                  }} 
                  cursor={{ stroke: 'hsl(var(--primary) / 0.3)', strokeWidth: 2 }}
                  formatter={(v) => [formatINR(v), "Sales"]} 
                />
                <Line type="monotone" dataKey="totalSales" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* P&L Bar Chart */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-black text-foreground text-sm uppercase tracking-tight">Sales Details</h2>
          </div>
          {pl ? (
            <div className="h-[240px] flex items-center justify-center text-slate-300 font-bold uppercase animate-pulse">Calculating Growth…</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={plData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.1)" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fontWeight: 700, fill: 'hsl(var(--muted-foreground))' }} stroke="hsl(var(--border))" />
                <YAxis tick={{ fontSize: 10, fontWeight: 700, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={formatShortINR} stroke="hsl(var(--border))" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))', 
                    borderRadius: '12px',
                    color: 'hsl(var(--foreground))',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.3)'
                  }} 
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                  cursor={{ fill: 'hsl(var(--accent) / 0.2)' }}
                  formatter={(v) => formatINR(v)} 
                />
                <Legend 
                  iconType="circle" 
                  wrapperStyle={{ 
                    paddingTop: '20px', 
                    fontSize: '10px', 
                    fontWeight: 900, 
                    textTransform: 'uppercase',
                    color: 'hsl(var(--foreground))' 
                  }} 
                />
                <Bar dataKey="revenue" fill="#3b82f6" name="Revenue" radius={[4,4,0,0]} />
                <Bar dataKey="profit"  fill="#10b981" name="Profit"  radius={[4,4,0,0]} />
                <Bar dataKey="cost"    fill="#f43f5e" name="Cost"    radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Top Items List */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                <Package className="w-5 h-5 text-primary-foreground" />
             </div>
             <h2 className="font-black text-foreground text-base uppercase tracking-tight">Product Rankings</h2>
          </div>

          <div className="flex bg-accent p-1 rounded-xl border border-border self-start sm:self-center">
            {Object.entries(tabConfigs).map(([key, config]) => (
              <button key={key} onClick={() => setActiveTab(key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeTab === key ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}>
                <config.icon className="w-3.5 h-3.5" />
                <span>{config.label}</span>
              </button>
            ))}
          </div>
        </div>

        {tl ? (
          <div className="py-12 flex flex-col items-center justify-center gap-4 text-slate-300 uppercase font-black text-xs animate-pulse">Syncing Leaderboard...</div>
        ) : (topItems?.[activeTab]?.top || []).length === 0 ? (
          <div className="py-12 text-center text-slate-300 font-black uppercase text-xs tracking-widest">No Sales in selected range</div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {/* TOP PERFORMERS */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2 px-2">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">High Velocity (Top 5)</span>
              </div>
              <div className="space-y-3">
                {(topItems?.[activeTab]?.top || []).map((item, idx) => {
                  const val = activeTab === 'quantityWise' ? item.quantity : (activeTab === 'valueWise' ? item.value : item.profit);
                  const config = tabConfigs[activeTab];
                  return (
                    <div key={`top-${item.id}`} className="flex items-center gap-4 p-4 rounded-2xl bg-card border border-border/60 hover:shadow-xl hover:shadow-blue-600/5 transition-all group">
                      <div className="w-10 h-10 rounded-xl bg-accent border border-border flex items-center justify-center text-sm font-black text-muted-foreground group-hover:text-blue-600 transition-colors shadow-sm">
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-foreground truncate group-hover:text-blue-600 transition-colors uppercase tracking-tight">{item.name}</p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1">ID: #{item.id}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-black ${config.color}`}>
                          {activeTab === 'quantityWise' ? `${item.quantity} PCS` : formatINR(val)}
                        </p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter mt-0.5">{config.label}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* BOTTOM PERFORMERS */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2 px-2">
                <Activity className="w-3.5 h-3.5 text-red-500" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Slow Moving / Dead Stock</span>
              </div>
              <div className="space-y-3">
                {(topItems?.[activeTab]?.bottom || []).map((item, idx) => {
                  const val = activeTab === 'quantityWise' ? item.quantity : (activeTab === 'valueWise' ? item.value : item.profit);
                  const config = tabConfigs[activeTab];
                  return (
                    <div key={`bottom-${item.id}`} className="flex items-center gap-4 p-4 rounded-2xl bg-destructive/5 border border-destructive/20 hover:bg-card hover:shadow-xl hover:shadow-red-600/5 transition-all group">
                      <div className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center text-sm font-black text-destructive/40 group-hover:text-red-600 transition-colors shadow-sm">
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-foreground truncate group-hover:text-red-600 transition-colors uppercase tracking-tight">{item.name}</p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1">ID: #{item.id}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-muted-foreground">
                          {activeTab === 'quantityWise' ? `${item.quantity} PCS` : formatINR(val)}
                        </p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter mt-0.5">{config.label}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import { useQuery } from "@tanstack/react-query";
import { apiClient, formatINR } from "@/lib/api";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { TrendingUp } from "lucide-react";

const formatShortINR = (val) => `₹${(val / 1000).toFixed(0)}k`;

export default function Analytics() {
  const { data: salesData = [], isLoading: sl } = useQuery({ queryKey: ["analytics-sales"], queryFn: apiClient.getSalesAnalytics });
  const { data: plData = [],    isLoading: pl } = useQuery({ queryKey: ["analytics-pl"],    queryFn: apiClient.getProfitLossAnalytics });
  const { data: topItems = [],  isLoading: tl } = useQuery({ queryKey: ["analytics-top"],   queryFn: apiClient.getTopSellingItems });

  const recentSales = salesData.slice(-14);
  const totalRevenue = plData.reduce((a, d) => a + d.revenue, 0);
  const totalProfit  = plData.reduce((a, d) => a + d.profit, 0);
  const margin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-sm text-gray-500 mt-1">Business performance overview</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Revenue (6mo)", value: formatINR(totalRevenue),  color: "text-blue-600" },
          { label: "Total Profit (6mo)",  value: formatINR(totalProfit),   color: totalProfit >= 0 ? "text-emerald-600" : "text-red-600" },
          { label: "Profit Margin",       value: `${margin}%`,             color: "text-gray-900" },
        ].map(c => (
          <div key={c.label} className="card p-4">
            <p className="text-xs text-gray-500">{c.label}</p>
            <p className={`text-2xl font-bold mt-1 ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Sales Trend */}
      <div className="card p-5">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-blue-600" /> Sales Trend (Last 14 Days)
        </h2>
        {sl ? (
          <div className="h-48 flex items-center justify-center text-gray-400">Loading…</div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={recentSales}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={d => d.slice(5)} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={formatShortINR} />
              <Tooltip formatter={(v) => formatINR(v)} labelFormatter={d => `Date: ${d}`} />
              <Line type="monotone" dataKey="totalSales" stroke="#3b82f6" strokeWidth={2} dot={false} name="Sales" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* P&L */}
      <div className="card p-5">
        <h2 className="font-semibold text-gray-900 mb-4">Monthly Profit & Loss</h2>
        {pl ? (
          <div className="h-48 flex items-center justify-center text-gray-400">Loading…</div>
        ) : plData.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-gray-400">No data yet. Create some bills first.</div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={plData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={formatShortINR} />
              <Tooltip formatter={(v) => formatINR(v)} />
              <Legend />
              <Bar dataKey="revenue" fill="#3b82f6" name="Revenue" radius={[3,3,0,0]} />
              <Bar dataKey="profit"  fill="#10b981" name="Profit"  radius={[3,3,0,0]} />
              <Bar dataKey="cost"    fill="#ef4444" name="Cost"    radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Top Items */}
      <div className="card p-5">
        <h2 className="font-semibold text-gray-900 mb-4">Top Selling Items</h2>
        {tl ? (
          <p className="text-gray-400 text-sm">Loading…</p>
        ) : topItems.length === 0 ? (
          <p className="text-gray-400 text-sm">No sales data yet.</p>
        ) : (
          <div className="space-y-3">
            {topItems.map((item, idx) => (
              <div key={item.name} className="flex items-center gap-4">
                <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold shrink-0">
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                  <p className="text-xs text-gray-400">{item.totalQuantity} units sold</p>
                </div>
                <p className="font-semibold text-gray-900">{formatINR(item.totalRevenue)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

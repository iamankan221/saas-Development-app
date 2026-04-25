import { useQuery } from "@tanstack/react-query";
import { apiClient, formatINR } from "@/lib/api";
import { TrendingUp, DollarSign, Clock, Users, Package, AlertTriangle, FileText, Activity } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function Dashboard() {
  const { data: summary, isLoading: sl } = useQuery({ queryKey: ["dashboard-summary"], queryFn: apiClient.getDashboardSummary });
  const { data: activity = [], isLoading: al } = useQuery({ queryKey: ["dashboard-activity"], queryFn: async () => {
    const response = await apiClient.getDashboardActivity();
    // Return the actual array, whether it's wrapped in 'data' or 'activity'
    return response.data || response.activity || response || []; 
  }});

  const cards = [
    { label: "Today's Sales",   value: formatINR(summary?.todaySales),   icon: TrendingUp,     color: "text-blue-600",   bg: "bg-blue-50" },
    { label: "Today's Profit",  value: formatINR(summary?.todayProfit),  icon: DollarSign,     color: "text-emerald-600",bg: "bg-emerald-50" },
    { label: "Unpaid Amount",   value: formatINR(summary?.unpaidAmount), icon: Clock,          color: "text-red-600",    bg: "bg-red-50" },
    { label: "Total Customers", value: summary?.totalCustomers ?? "—",   icon: Users,          color: "text-indigo-600", bg: "bg-indigo-50" },
    { label: "Total Stock Value",value: formatINR(summary?.totalStockValue), icon: Package,    color: "text-purple-600", bg: "bg-purple-50", wide: true },
    { label: "Low Stock Items", value: summary?.lowStockCount ?? "—",    icon: AlertTriangle,  color: "text-amber-600",  bg: "bg-amber-50" },
    { label: "Expiring Soon",   value: summary?.expiringItemsCount ?? "—", icon: AlertTriangle, color: "text-orange-600", bg: "bg-orange-50" },
  ];

  const typeIcon = (type) => {
    if (type === "bill_created")     return <FileText className="w-4 h-4" />;
    if (type === "payment_received") return <DollarSign className="w-4 h-4" />;
    if (type === "stock_low")        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
    return <Package className="w-4 h-4" />;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="text-sm text-gray-500 mt-1">Your business at a glance today.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map(({ label, value, icon: Icon, color, bg, wide }) => (
          <div key={label} className={`card p-4 ${wide ? "col-span-2" : ""}`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-gray-500">{label}</span>
              <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
            </div>
            <p className={`text-2xl font-bold ${color}`}>
              {sl ? <span className="text-gray-300 animate-pulse">—</span> : value}
            </p>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-5">
          <Activity className="w-5 h-5 text-blue-600" />
          <h2 className="font-semibold text-gray-900">Recent Activity</h2>
        </div>

        {al ? (
          <div className="space-y-4">
            {[1,2,3,4].map(i => (
              <div key={i} className="flex gap-4 animate-pulse">
                <div className="w-10 h-10 rounded-full bg-gray-100 shrink-0" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-3 bg-gray-100 rounded w-1/3" />
                  <div className="h-3 bg-gray-100 rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : activity.length === 0 ? (
          <p className="text-center py-10 text-gray-400">No recent activity</p>
        ) : (
          <div className="space-y-5">
            {activity.map((item, idx) => (
              <div key={item.id} className="flex gap-4">
                <div className="relative shrink-0">
                  <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                    {typeIcon(item.type)}
                  </div>
                  {idx < activity.length - 1 && (
                    <div className="absolute top-10 left-1/2 -translate-x-1/2 w-px h-5 bg-gray-100" />
                  )}
                </div>
                <div className="flex-1 min-w-0 pt-1">
                  <div className="flex justify-between items-start gap-2">
                    <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                    <span className="text-xs text-gray-400 whitespace-nowrap shrink-0">
                      {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                  {item.amount != null && (
                    <p className="text-sm font-bold text-blue-600 mt-1">{formatINR(item.amount)}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

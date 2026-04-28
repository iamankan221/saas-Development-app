import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useDispatch, useSelector } from "react-redux";
import {
  LayoutDashboard, Users, FileText, Package, Truck, BarChart3, Settings, Menu, X, LogOut, ChevronLeft, ChevronRight
} from "lucide-react";
import { logoutUser } from "../redux/slices/authSlice";

const NAV_ITEMS = [
  { href: "/",           icon: LayoutDashboard, label: "Dashboard" },
  { href: "/customers",  icon: Users,           label: "Customers" },
  { href: "/bills",      icon: FileText,        label: "Bills & Invoices" },
  { href: "/inventory",  icon: Package,         label: "Inventory" },
  { href: "/suppliers",  icon: Truck,           label: "Suppliers" },
  { href: "/analytics",  icon: BarChart3,       label: "Analytics" },
  { href: "/settings",   icon: Settings,        label: "Settings" },
];

export function Layout({ children }) {
  const [location, navigate] = useLocation();
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hoverIndex, setHoverIndex] = useState(null);

  useEffect(() => setMobileOpen(false), [location]);

  const activeIndex = NAV_ITEMS.findIndex((item) => item.href === location);
  const displayIndex = hoverIndex !== null ? hoverIndex : (activeIndex !== -1 ? activeIndex : null);

  const handleLogout = () => {
    dispatch(logoutUser()).then(() => {
      navigate("/login");
    });
  };

  return (
    <div className="min-h-screen flex bg-[#F8FAFC] font-sans">
      {/* Sidebar */}
      <aside className={`
        fixed md:sticky top-0 left-0 z-40 h-screen flex flex-col
        bg-white border-r border-slate-200 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]
        ${collapsed ? "md:w-[90px]" : "md:w-64"}
        ${mobileOpen ? "translate-x-0 w-64" : "-translate-x-full md:translate-x-0"}
      `}>
        {/* Logo Section */}
        <div className={`h-20 flex items-center shrink-0 border-b border-slate-50 transition-all duration-500 ${collapsed ? "px-4" : "px-6"}`}>
          <div className="flex items-center gap-3 transition-all duration-500">
            <div className={`rounded-lg bg-black flex items-center justify-center text-white font-black shadow-lg shadow-black/10 transition-all duration-500 ${collapsed ? "w-7 h-7 text-[10px]" : "w-8 h-8 text-xs"}`}>VB</div>
            {!collapsed && <span className="font-bold text-xl text-slate-900 tracking-tight animate-pulse-fade">VyaparBook</span>}
          </div>
          <button onClick={() => setCollapsed(!collapsed)} className={`hidden md:flex ml-auto rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-900 transition-all duration-300 ${collapsed ? "p-1" : "p-2"}`}>
            {collapsed ? (
              <ChevronRight className="w-4 h-4 transition-all duration-500" />
            ) : (
              <ChevronLeft className="w-5 h-5 transition-all duration-500" />
            )}
          </button>
        </div>

        {/* Nav */}
        <div className="flex-1 py-4 px-3 relative" onMouseLeave={() => setHoverIndex(null)}>
          <div className="relative">
            {/* Sliding Indicator Pill - Precision Mouse Tracking */}
            <div 
              className={`absolute h-12 bg-[#0061FF] rounded-2xl transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] shadow-xl shadow-blue-600/20 ${collapsed ? "left-2 right-2" : "left-0 right-0"}`}
              style={{ 
                opacity: displayIndex !== null ? 1 : 0,
                transform: `translateY(${(displayIndex || 0) * 48}px)`,
                pointerEvents: 'none'
              }}
            />

            <nav className="relative z-10">
              {NAV_ITEMS.map((item, idx) => {
                const Icon = item.icon;
                const active = location === item.href;
                const isHovered = hoverIndex === idx;
                const shouldHighlight = isHovered || (active && hoverIndex === null);

                return (
                  <Link key={item.href} href={item.href}>
                    <a 
                      onMouseEnter={() => setHoverIndex(idx)}
                      className={`flex items-center gap-3 h-12 rounded-2xl text-sm font-bold transition-all duration-500 ${collapsed ? "justify-center" : "px-4"} ${shouldHighlight ? "text-white" : "text-slate-500 hover:translate-x-1"}`}
                    >
                      <Icon className={`w-5 h-5 shrink-0 transition-transform duration-500 ${shouldHighlight ? "scale-110" : ""}`} />
                      {!collapsed && <span className="animate-pulse-fade truncate">{item.label}</span>}
                    </a>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100">
           {user && !collapsed && (
             <div className="px-4 py-3 bg-[#F1F5F9] rounded-2xl mb-4">
               <p className="text-xs font-bold text-slate-900 truncate tracking-tight">{user.firstName} {user.lastName}</p>
               <p className="text-[10px] text-slate-500 truncate font-semibold">{user.email}</p>
             </div>
           )}
           <button onClick={handleLogout} className={`flex items-center gap-3 py-2 text-slate-500 hover:text-red-600 w-full transition-colors font-bold text-sm ${collapsed ? "justify-center" : "px-4"}`}>
             <LogOut className="w-5 h-5" />
             {!collapsed && <span>Sign Out</span>}
           </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-100 px-6 flex items-center md:hidden">
          <button onClick={() => setMobileOpen(true)} className="text-slate-500"><Menu className="w-6 h-6" /></button>
          <span className="ml-4 font-bold text-lg">VyaparBook</span>
        </header>
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

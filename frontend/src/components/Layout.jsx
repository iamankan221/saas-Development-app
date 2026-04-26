import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useDispatch, useSelector } from "react-redux";
import {
  LayoutDashboard, Users, FileText, Package, Truck, BarChart3, Settings, Menu, X, LogOut
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

  useEffect(() => setMobileOpen(false), [location]);

  const handleLogout = () => {
    dispatch(logoutUser()).then(() => {
      navigate("/login");
    });
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/40 z-30 md:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:sticky top-0 left-0 z-40 h-screen flex flex-col
        bg-[hsl(222,20%,14%)] border-r border-[hsl(222,15%,20%)]
        transition-all duration-300
        ${collapsed ? "md:w-[72px]" : "md:w-64"}
        ${mobileOpen ? "translate-x-0 w-64" : "-translate-x-full md:translate-x-0"}
      `}>
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-[hsl(222,15%,20%)] shrink-0">
          {!collapsed && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center text-white font-bold text-sm shadow">
                VB
              </div>
              <span className="font-bold text-lg text-white">VyaparBook</span>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:flex p-1.5 rounded-lg text-gray-400 hover:bg-[hsl(222,15%,22%)] hover:text-white transition-colors ml-auto"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
            const active = href === "/" ? location === "/" : location.startsWith(href);
            return (
              <Link key={href} href={href}>
                <a className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                  ${active
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-gray-400 hover:bg-[hsl(222,15%,22%)] hover:text-white"
                  }
                  ${collapsed ? "justify-center" : ""}
                `}>
                  <Icon className="w-5 h-5 shrink-0" />
                  {!collapsed && <span>{label}</span>}
                </a>
              </Link>
            );
          })}
        </nav>

        {/* Logout section */}
        <div className="border-t border-[hsl(222,15%,20%)] p-2 shrink-0">
          {!collapsed && user && (
            <div className="px-3 py-2 mb-1">
              <p className="text-sm font-medium text-white truncate">{user.firstName} {user.lastName}</p>
              <p className="text-xs text-gray-400 truncate">{user.email}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className={`
              w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
              text-gray-400 hover:bg-red-500/10 hover:text-red-400
              ${collapsed ? "justify-center" : ""}
            `}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <div className="md:hidden sticky top-0 z-20 flex items-center justify-between h-14 px-4 bg-white border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-500 flex items-center justify-center text-white font-bold text-xs">VB</div>
            <span className="font-bold text-gray-900">VyaparBook</span>
          </div>
          <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 rounded-lg hover:bg-gray-100">
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        <main className="flex-1 p-4 md:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

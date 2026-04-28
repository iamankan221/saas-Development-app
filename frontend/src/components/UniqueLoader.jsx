import { Package, Activity } from "lucide-react";

export function UniqueLoader({ message = "Loading VyaparBook..." }) {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white overflow-hidden">
      {/* Animated Background Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-50/50 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-50/50 rounded-full blur-[120px] animate-pulse delay-700" />
      
      <div className="relative flex flex-col items-center">
        {/* Pulsing Icon Core */}
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-blue-500/20 rounded-2xl blur-2xl animate-ping" />
          <div className="relative w-16 h-16 bg-white border-2 border-blue-100 rounded-2xl shadow-xl flex items-center justify-center animate-bounce duration-[2000ms]">
            <Package className="w-8 h-8 text-blue-600" />
            <Activity className="absolute -top-1 -right-1 w-4 h-4 text-emerald-500 animate-pulse" />
          </div>
        </div>

        {/* Branding & Message */}
        <div className="flex flex-col items-center gap-2">
          <h2 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-1">
            <span className="text-blue-600">Vyapar</span>
            <span>Book</span>
          </h2>
          <div className="flex items-center gap-2 px-4 py-1.5 bg-slate-50 rounded-full border border-slate-100">
            <div className="flex gap-1">
              <span className="w-1 h-1 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1 h-1 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1 h-1 bg-blue-400 rounded-full animate-bounce" />
            </div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">
              {message}
            </p>
          </div>
        </div>
      </div>

      {/* Shimmer Progress Bar at Bottom */}
      <div className="fixed bottom-0 left-0 w-full h-1 bg-slate-50 overflow-hidden">
        <div className="h-full bg-gradient-to-r from-blue-400 via-indigo-500 to-blue-400 w-1/3 animate-[shimmer_2s_infinite_linear]" />
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }
      `}} />
    </div>
  );
}

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiClient, formatINR, normalizePhone, maskPhone } from "@/lib/api";
import { Plus, Search, Eye, Trash2, User, Phone, Receipt, Building2, X } from "lucide-react";
import { toast } from "@/lib/toast";

function SupplierModal({ onClose, onSave }) {
  const [form, setForm] = useState({ name: "", contactPerson: "", phone: "", email: "", address: "", gstNumber: "" });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("Supplier name is required"); return; }
    onSave({
      ...form,
      phone: normalizePhone(form.phone)
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-black text-foreground mb-5 uppercase tracking-tight">Add Supplier</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { name: "name",          label: "Supplier Name *",   type: "text",   placeholder: "Global Traders" },
            { name: "contactPerson", label: "Contact Person",    type: "text",   placeholder: "Suresh Gupta" },
            { name: "phone",         label: "Phone",             type: "tel",    placeholder: "9876543210" },
            { name: "email",         label: "Email",             type: "email",  placeholder: "contact@global.com" },
            { name: "address",       label: "Address",           type: "text",   placeholder: "Mumbai, Maharashtra" },
            { name: "gstNumber",     label: "GST Number",        type: "text",   placeholder: "27AADCG1234M1Z5" },
          ].map(f => (
            <div key={f.name}>
              <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1.5">{f.label}</label>
              {f.name === "phone" ? (
                <div className="relative group">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none border-r border-border pr-2">
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-tighter">IND</span>
                    <span className="text-xs font-bold text-foreground">+91</span>
                  </div>
                  <input 
                    className="input pl-[4.5rem] font-mono" 
                    type="tel"
                    placeholder={f.placeholder}
                    value={form[f.name]} 
                    onChange={e => setForm(v => ({ ...v, [f.name]: e.target.value.replace(/\D/g, "").slice(0, 10)}))} 
                  />
                </div>
              ) : (
                <input
                  className="input"
                  type={f.type}
                  placeholder={f.placeholder}
                  value={form[f.name]}
                  onChange={e => setForm(v => ({ ...v, [f.name]: e.target.value }))}
                />
              )}
            </div>
          ))}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">Add Supplier</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Suppliers() {
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const qc = useQueryClient();

  // Reset page on filter change
  useEffect(() => {
    setPage(1);
  }, [search]);

  const { data: res, isLoading } = useQuery({ 
    queryKey: ["suppliers", search, page],
    queryFn: () => apiClient.getSuppliers({ search: search || undefined, page, limit: 10 })
  });

  const { data: settings } = useQuery({ queryKey: ["settings"], queryFn: apiClient.getSettings });

  const suppliers = res?.data || [];
  const pagination = res?.pagination || { page: 1, pages: 1 };

  const createMutation = useMutation({
    mutationFn: apiClient.createSupplier,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["suppliers"] });
      setShowModal(false);
      toast.success("Supplier added successfully");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: apiClient.deleteSupplier,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["suppliers"] });
      toast.success("Supplier removed");
    },
  });

  return (
    <div className="space-y-6">
      {showModal && <SupplierModal onClose={() => setShowModal(false)} onSave={createMutation.mutate} />}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-foreground tracking-tight">Suppliers</h1>
          <p className="text-sm text-muted-foreground mt-1 font-medium">Manage supplier profiles and procurement details</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4" /> Add Supplier
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/30" />
        <input 
          type="text" 
          placeholder="Search suppliers..." 
          className="input pl-11"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Supplier Cards */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="py-20 text-center text-slate-400 font-medium animate-pulse">Loading suppliers...</div>
        ) : suppliers.length === 0 ? (
          <div className="card p-12 text-center text-muted-foreground font-black uppercase tracking-widest text-[10px]">
             <Building2 className="w-12 h-12 mx-auto mb-3 opacity-10" />
             No suppliers found.
          </div>
        ) : (
          suppliers.map((s) => (
            <div key={s.id} className="card p-5 hover:border-primary/30 transition-all group">
              <div className="flex flex-col md:flex-row md:items-center gap-6">
                {/* Initial Circle */}
                <div className="w-12 h-12 rounded-2xl bg-accent border border-border flex items-center justify-center text-muted-foreground font-black text-lg shrink-0 group-hover:bg-primary/10 group-hover:text-primary transition-colors uppercase">
                  {s.name.charAt(0)}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-black text-foreground text-lg tracking-tight uppercase">{s.name}</h3>
                    <div className="flex items-center gap-4 mt-1 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                      <span className="flex items-center gap-1"><User className="w-3 h-3 text-primary" /> {s.contactPerson || "N/A"}</span>
                      <span className="flex items-center gap-1 font-mono"><Phone className="w-3 h-3 text-primary" /> {maskPhone(s.phone, settings?.maskPhoneNumbers)}</span>
                    </div>
                    <p className="text-[9px] font-black text-muted-foreground/50 uppercase tracking-widest mt-2">GST: {s.gstNumber || "Not Provided"}</p>
                  </div>
                  
                  <div className="md:text-right flex flex-col md:items-end justify-center">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Total Purchased</p>
                    <p className="text-xl font-black text-foreground mt-1">{formatINR(s.totalPurchased || 0)}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 border-t md:border-t-0 pt-4 md:pt-0 border-border/50">
                  <button 
                    className="p-2.5 rounded-xl hover:bg-accent text-muted-foreground hover:text-primary transition-all"
                    onClick={() => navigate(`/suppliers/${s.id}`)}
                    title="View Details"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                  <button 
                    className="btn btn-danger p-2.5"
                    onClick={() => { if(confirm("Remove this supplier?")) deleteMutation.mutate(s.id); }}
                    title="Delete Supplier"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination Controls */}
      {!isLoading && pagination.pages > 1 && (
        <div className="mt-8 flex flex-col md:flex-row items-center justify-between gap-6 border-t border-border pt-8 pb-4">
          <div className="flex flex-col gap-1">
            <p className="text-sm text-muted-foreground font-medium">
              Showing Page <span className="text-foreground font-bold">{pagination.page}</span> of <span className="text-foreground font-bold">{pagination.pages}</span>
            </p>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
              Total {pagination.total} Suppliers
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Page Number Buttons */}
            <div className="flex items-center gap-1 bg-accent p-1 rounded-xl border border-border">
              {Array.from({ length: pagination.pages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === pagination.pages || (p >= page - 1 && p <= page + 1))
                .map((p, i, arr) => (
                  <div key={p} className="flex items-center">
                    {i > 0 && arr[i-1] !== p - 1 && <span className="text-muted-foreground font-bold px-2">...</span>}
                    <button
                      onClick={() => { setPage(p); window.scrollTo(0, 0); }}
                      className={`w-9 h-9 rounded-lg text-sm font-bold transition-all duration-200 ${
                        page === p 
                          ? "bg-primary text-white shadow-lg shadow-primary/20 scale-105" 
                          : "text-muted-foreground hover:bg-card hover:text-primary hover:shadow-sm"
                      }`}
                    >
                      {p}
                    </button>
                  </div>
                ))}
            </div>

            {/* Jump to Page */}
            <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-3 py-1.5 shadow-sm group focus-within:border-primary transition-colors">
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-tighter">Go to</span>
              <input 
                type="number" 
                min="1" 
                max={pagination.pages}
                placeholder={page}
                className="w-10 bg-transparent text-sm font-bold text-foreground focus:outline-none text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const val = parseInt(e.target.value);
                    if (val >= 1 && val <= pagination.pages) {
                       setPage(val);
                       window.scrollTo(0, 0);
                       e.target.value = "";
                       e.target.blur();
                    }
                  }
                }}
              />
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setPage(p => Math.max(1, p - 1)); window.scrollTo(0, 0); }}
                disabled={page === 1}
                className="h-10 px-4 rounded-xl bg-card border border-border text-foreground font-bold text-xs uppercase tracking-widest hover:bg-accent hover:border-border disabled:opacity-30 disabled:pointer-events-none transition-all shadow-sm active:scale-95"
              >
                Prev
              </button>
              <button
                onClick={() => { setPage(p => Math.min(pagination.pages, p + 1)); window.scrollTo(0, 0); }}
                disabled={page === pagination.pages}
                className="h-10 px-4 rounded-xl bg-card border border-border text-foreground font-bold text-xs uppercase tracking-widest hover:bg-accent hover:border-border disabled:opacity-30 disabled:pointer-events-none transition-all shadow-sm active:scale-95"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiClient, formatINR } from "@/lib/api";
import { Plus, Search, Eye, Trash2, User, Phone, Receipt, Building2, X } from "lucide-react";
import { toast } from "@/lib/toast";

function SupplierModal({ onClose, onSave }) {
  const [form, setForm] = useState({ name: "", contactPerson: "", phone: "", email: "", address: "", gstNumber: "" });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("Supplier name is required"); return; }
    onSave(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-semibold mb-5">Add Supplier</h2>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
              <input
                className="input"
                type={f.type}
                placeholder={f.placeholder}
                value={form[f.name]}
                onChange={e => setForm(v => ({ ...v, [f.name]: e.target.value }))}
              />
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
  const [showModal, setShowModal] = useState(false);
  const qc = useQueryClient();

  const { data: res, isLoading } = useQuery({ 
    queryKey: ["suppliers"], 
    queryFn: apiClient.getSuppliers 
  });

  const suppliers = Array.isArray(res) ? res : (res?.data || []);

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

  const filtered = suppliers.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.contactPerson?.toLowerCase().includes(search.toLowerCase()) ||
    s.gstNumber?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {showModal && <SupplierModal onClose={() => setShowModal(false)} onSave={createMutation.mutate} />}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Suppliers</h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">Manage supplier profiles and payment details</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4" /> Add Supplier
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input 
          type="text" 
          placeholder="Search suppliers..." 
          className="input pl-11 bg-white border-slate-200"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Supplier Cards */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="py-20 text-center text-slate-400 font-medium animate-pulse">Loading suppliers...</div>
        ) : filtered.length === 0 ? (
          <div className="card p-12 text-center text-slate-400 font-medium">
             <Building2 className="w-12 h-12 mx-auto mb-3 opacity-20" />
             No suppliers found.
          </div>
        ) : (
          filtered.map((s) => (
            <div key={s.id} className="card p-5 hover:border-blue-200 transition-all group">
              <div className="flex flex-col md:flex-row md:items-center gap-6">
                {/* Initial Circle */}
                <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 font-bold text-lg shrink-0 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                  {s.name.charAt(0).toUpperCase()}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg">{s.name}</h3>
                    <div className="flex items-center gap-4 mt-1 text-xs font-medium text-slate-500">
                      <span className="flex items-center gap-1"><User className="w-3 h-3" /> {s.contactPerson || "N/A"}</span>
                      <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {s.phone || "N/A"}</span>
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">GST: {s.gstNumber || "Not Provided"}</p>
                  </div>
                  
                  <div className="md:text-right flex flex-col md:items-end justify-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Purchased</p>
                    <p className="text-xl font-black text-slate-900 mt-1">{formatINR(s.totalPurchased || 0)}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 border-t md:border-t-0 pt-4 md:pt-0 border-slate-50">
                  <button 
                    className="p-2.5 rounded-xl hover:bg-slate-50 text-slate-400 hover:text-blue-600 transition-all"
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
    </div>
  );
}

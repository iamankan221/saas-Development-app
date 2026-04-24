import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiClient, formatDate } from "@/lib/api";
import { Search, Plus, Trash2, Eye, Truck } from "lucide-react";

function SupplierModal({ onClose, onSave }) {
  const [form, setForm] = useState({ name: "", contactPerson: "", phone: "", email: "", address: "", gstNumber: "", paymentTerms: "Net 30" });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSave({ ...form, email: form.email || null, address: form.address || null, gstNumber: form.gstNumber || null });
  };

  const fields = [
    { name: "name",          label: "Company Name *", placeholder: "AgroBridge Wholesalers", full: true },
    { name: "contactPerson", label: "Contact Person", placeholder: "Mahesh Kumar" },
    { name: "phone",         label: "Phone",          placeholder: "9811122334" },
    { name: "email",         label: "Email",          placeholder: "mahesh@company.com" },
    { name: "address",       label: "Address",        placeholder: "Industrial Area, Bengaluru", full: true },
    { name: "gstNumber",     label: "GST Number",     placeholder: "29AAABM4321H1Z4" },
    { name: "paymentTerms",  label: "Payment Terms",  placeholder: "Net 30" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-semibold mb-5">Add Supplier</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
          {fields.map(f => (
            <div key={f.name} className={f.full ? "col-span-2" : ""}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
              <input className="input" placeholder={f.placeholder} value={form[f.name]}
                onChange={e => setForm(v => ({ ...v, [f.name]: e.target.value }))} />
            </div>
          ))}
          <div className="col-span-2 flex justify-end gap-3 pt-2">
            <button type="button" className="btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary">Add Supplier</button>
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

  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: ["suppliers", search],
    queryFn: () => apiClient.getSuppliers(search ? { search } : {}),
  });

  const createMutation = useMutation({
    mutationFn: apiClient.createSupplier,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["suppliers"] }); setShowModal(false); },
  });
  const deleteMutation = useMutation({
    mutationFn: apiClient.deleteSupplier,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["suppliers"] }),
  });

  return (
    <div className="space-y-6">
      {showModal && <SupplierModal onClose={() => setShowModal(false)} onSave={createMutation.mutate} />}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Suppliers</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your supplier relationships</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4" /> Add Supplier
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input className="input pl-9" placeholder="Search suppliers…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {isLoading ? (
        <p className="text-center py-10 text-gray-400">Loading suppliers…</p>
      ) : suppliers.length === 0 ? (
        <div className="card flex flex-col items-center py-16 gap-3">
          <Truck className="w-12 h-12 text-gray-200" />
          <p className="text-gray-400">No suppliers found.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {suppliers.map(s => (
            <div key={s.id} className="card p-5 hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/suppliers/${s.id}`)}>
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm shrink-0">
                  {s.name.charAt(0)}
                </div>
                <div className="flex gap-1">
                  <button className="btn-ghost p-1.5" onClick={e => { e.stopPropagation(); navigate(`/suppliers/${s.id}`); }}><Eye className="w-4 h-4" /></button>
                  <button className="btn-danger p-1.5" onClick={e => { e.stopPropagation(); if (confirm(`Delete "${s.name}"?`)) deleteMutation.mutate(s.id); }}><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              <h3 className="font-semibold text-gray-900">{s.name}</h3>
              {s.contactPerson && <p className="text-sm text-gray-500">{s.contactPerson}</p>}
              <p className="text-sm text-gray-500">{s.phone}</p>
              {s.email && <p className="text-xs text-gray-400 mt-1">{s.email}</p>}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                {s.gstNumber && <span className="text-xs text-gray-400">{s.gstNumber}</span>}
                {s.paymentTerms && <span className="badge badge-blue">{s.paymentTerms}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

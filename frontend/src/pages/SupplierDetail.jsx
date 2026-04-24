import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { apiClient, formatDate } from "@/lib/api";
import { ArrowLeft, Edit2, Save, X } from "lucide-react";

export default function SupplierDetail() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(null);

  const { data: supplier, isLoading } = useQuery({
    queryKey: ["supplier", id],
    queryFn: () => apiClient.getSupplier(id),
    onSuccess: (data) => !form && setForm(data),
  });

  const updateMutation = useMutation({
    mutationFn: (data) => apiClient.updateSupplier(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["supplier", id] }); setEditing(false); },
  });

  if (isLoading) return <p className="text-center py-20 text-gray-400">Loading…</p>;
  if (!supplier) return <p className="text-center py-20 text-red-500">Supplier not found.</p>;

  const fields = [
    { name: "name",          label: "Company Name" },
    { name: "contactPerson", label: "Contact Person" },
    { name: "phone",         label: "Phone" },
    { name: "email",         label: "Email" },
    { name: "address",       label: "Address" },
    { name: "gstNumber",     label: "GST Number" },
    { name: "paymentTerms",  label: "Payment Terms" },
  ];

  return (
    <div className="max-w-2xl space-y-5">
      <div className="flex items-center gap-3">
        <button className="btn-ghost p-2" onClick={() => navigate("/suppliers")}><ArrowLeft className="w-4 h-4" /></button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{supplier.name}</h1>
          {supplier.contactPerson && <p className="text-sm text-gray-500">{supplier.contactPerson} · {supplier.phone}</p>}
        </div>
        {editing ? (
          <div className="flex gap-2">
            <button className="btn-outline" onClick={() => { setForm(supplier); setEditing(false); }}><X className="w-4 h-4" /></button>
            <button className="btn-primary gap-2" onClick={() => updateMutation.mutate(form)}><Save className="w-4 h-4" /> Save</button>
          </div>
        ) : (
          <button className="btn-outline gap-2" onClick={() => { setForm({...supplier}); setEditing(true); }}><Edit2 className="w-4 h-4" /> Edit</button>
        )}
      </div>

      <div className="card p-5">
        <h2 className="font-semibold text-gray-900 mb-4">Supplier Details</h2>
        <div className="grid grid-cols-2 gap-4">
          {fields.map(f => (
            <div key={f.name} className={f.name === "address" ? "col-span-2" : ""}>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{f.label}</label>
              {editing ? (
                <input className="input" value={(form || {})[f.name] ?? ""}
                  onChange={e => setForm(v => ({ ...v, [f.name]: e.target.value }))} />
              ) : (
                <p className="font-medium text-gray-900">{supplier[f.name] || "—"}</p>
              )}
            </div>
          ))}
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Added</label>
            <p className="font-medium text-gray-900">{formatDate(supplier.createdAt)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

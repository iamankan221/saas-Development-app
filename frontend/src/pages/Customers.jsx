import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiClient, formatINR, formatDate } from "@/lib/api";
import { Search, Plus, Trash2, Eye, Users } from "lucide-react";

function CustomerModal({ onClose, onSave }) {
  const [form, setForm] = useState({ name: "", phone: "", email: "", address: "", gstNumber: "" });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.phone.trim() || form.phone.length < 10) e.phone = "Valid phone required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSave({
      ...form,
      email: form.email || null,
      address: form.address || null,
      gstNumber: form.gstNumber || null,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-semibold mb-5">Add Customer</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { name: "name",        label: "Name *",       type: "text",   placeholder: "Ravi Sharma" },
            { name: "phone",       label: "Phone *",      type: "tel",    placeholder: "9876543210" },
            { name: "email",       label: "Email",        type: "email",  placeholder: "ravi@example.com" },
            { name: "address",     label: "Address",      type: "text",   placeholder: "12, MG Road, Bengaluru" },
            { name: "gstNumber",   label: "GST Number",   type: "text",   placeholder: "29AADCB2230M1ZP" },
            { name: "creditLimit", label: "Credit Limit (₹)", type: "number", placeholder: "50000" },
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
              {errors[f.name] && <p className="text-xs text-red-500 mt-1">{errors[f.name]}</p>}
            </div>
          ))}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary">Add Customer</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Customers() {
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const qc = useQueryClient();

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ["customers", search],
    queryFn: async () => {
      const response = await apiClient.getCustomers(search ? { search } : {});
      return response.data || response.customers || response || [];
    }
  });

  const createMutation = useMutation({
    mutationFn: apiClient.createCustomer,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["customers"] }); setShowModal(false); },
  });

  const deleteMutation = useMutation({
    mutationFn: apiClient.deleteCustomer,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["customers"] }),
  });

  return (
    <div className="space-y-6">
      {showModal && (
        <CustomerModal
          onClose={() => setShowModal(false)}
          onSave={(data) => createMutation.mutate(data)}
        />
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your customer accounts</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4" /> Add Customer
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          className="input pl-9"
          placeholder="Search by name or phone..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      {isLoading ? (
        <p className="text-center py-10 text-gray-400">Loading customers…</p>
      ) : customers.length === 0 ? (
        <div className="card flex flex-col items-center py-16 gap-3">
          <Users className="w-12 h-12 text-gray-200" />
          <p className="text-gray-400">No customers found.</p>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-gray-50">
              <tr className="text-left text-xs text-gray-500 uppercase tracking-wider">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">GST</th>
                <th className="px-4 py-3 font-medium text-right">Total Billed</th>
                <th className="px-4 py-3 font-medium text-right">Outstanding</th>
                <th className="px-4 py-3 font-medium">Joined</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {customers.map(c => (
                <tr
                  key={c.id}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/customers/${c.id}`)}
                >
                  <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                  <td className="px-4 py-3 text-gray-600">{c.phone}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{c.gstNumber || "—"}</td>
                  <td className="px-4 py-3 text-right font-medium">{formatINR(c.totalBilled)}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={c.outstandingBalance > 0 ? "text-red-600 font-semibold" : "text-gray-400"}>
                      {formatINR(c.outstandingBalance)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(c.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 justify-end">
                      <button
                        className="btn-ghost p-1.5"
                        onClick={e => { e.stopPropagation(); navigate(`/customers/${c.id}`); }}
                      ><Eye className="w-4 h-4" /></button>
                      <button
                        className="btn-danger p-1.5"
                        onClick={e => {
                          e.stopPropagation();
                          if (confirm(`Delete ${c.name}?`)) deleteMutation.mutate(c.id);
                        }}
                      ><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

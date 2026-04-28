import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { apiClient, formatDate } from "@/lib/api";
import { ArrowLeft, Edit2, Save, X } from "lucide-react";
import { toast } from "@/lib/toast";

export default function SupplierDetail() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const qc = useQueryClient();
  const [payMode, setPayMode] = useState("upi");
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});

  const { data: supplier, isLoading } = useQuery({
    queryKey: ["supplier", id],
    queryFn: () => apiClient.getSupplier(id),
  });

  useEffect(() => {
    if (supplier) setForm(supplier);
  }, [supplier]);

  const updateMutation = useMutation({
    mutationFn: (payload) => apiClient.updateSupplier(id, payload),
    onSuccess: () => { 
      qc.invalidateQueries({ queryKey: ["supplier", id] }); 
      setEditing(false); 
      toast.success("Supplier details updated!");
    },
    onError: (err) => {
      console.error("Update failed:", err);
      toast.error("Failed to update supplier.");
    }
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
    { name: "upiId",         label: "UPI ID" },
    { name: "accountNumber", label: "Account Number" },
    { name: "ifscCode",      label: "IFSC Code" },
    { name: "bankName",      label: "Bank Name" },
  ];

  return (
    <div className="max-w-3xl space-y-5 pb-20">
      <div className="flex items-center gap-3">
        <button className="btn btn-ghost p-2" onClick={() => navigate("/suppliers")}><ArrowLeft className="w-4 h-4" /></button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{supplier.name}</h1>
          {supplier.contactPerson && <p className="text-sm text-gray-500">{supplier.contactPerson} · {supplier.phone}</p>}
        </div>
        {editing ? (
          <div className="flex gap-2">
            <button className="btn btn-outline px-6" onClick={() => { setForm(supplier); setEditing(false); }}><X className="w-4 h-4" /> Cancel</button>
            <button className="btn btn-primary px-8 gap-2 shadow-xl shadow-blue-600/20" onClick={() => updateMutation.mutate(form)}>
              <Save className="w-4 h-4" /> Save Changes
            </button>
          </div>
        ) : (
          <button className="btn btn-outline gap-2 px-6" onClick={() => { setForm({...supplier}); setEditing(true); }}><Edit2 className="w-4 h-4" /> Edit Profile</button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <div className="card p-6">
            <h2 className="font-bold text-slate-900 text-lg mb-6 border-b pb-4">Supplier Information</h2>
            <div className="grid grid-cols-2 gap-x-6 gap-y-6">
              {fields.slice(0, 7).map(f => (
                <div key={f.name} className={f.name === "address" ? "col-span-2" : ""}>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">{f.label}</label>
                  {editing ? (
                    <input className="input" value={(form || {})[f.name] ?? ""}
                      onChange={e => setForm(v => ({ ...v, [f.name]: e.target.value }))} />
                  ) : (
                    <p className="font-bold text-slate-700">{supplier[f.name] || "—"}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="card p-6">
            <h2 className="font-bold text-slate-900 text-lg mb-6 border-b pb-4">Banking & Payment Settings</h2>
            <div className="grid grid-cols-2 gap-x-6 gap-y-6">
              {fields.slice(7).map(f => (
                <div key={f.name}>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">{f.label}</label>
                  {editing ? (
                    <input className="input" value={(form || {})[f.name] ?? ""}
                      onChange={e => setForm(v => ({ ...v, [f.name]: e.target.value }))} />
                  ) : (
                    <p className="font-bold text-slate-700">{supplier[f.name] || "—"}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          {/* Payment Hub */}
          <div className="card p-6 bg-gradient-to-br from-white to-slate-50 border-blue-100 shadow-xl shadow-blue-600/5 sticky top-6">
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-bold text-slate-900 text-lg">Quick Pay</h3>
              <div className="flex p-1 bg-slate-100 rounded-xl">
                <button 
                  onClick={() => setPayMode("upi")}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${payMode === "upi" ? "bg-[#0061FF] text-white shadow-lg shadow-blue-600/20" : "text-slate-500 hover:text-slate-900"}`}
                >UPI</button>
                <button 
                  onClick={() => setPayMode("bank")}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${payMode === "bank" ? "bg-[#0061FF] text-white shadow-lg shadow-blue-600/20" : "text-slate-500 hover:text-slate-900"}`}
                >Bank</button>
              </div>
            </div>

            <div className="space-y-6 text-center">
              {payMode === "upi" ? (
                <>
                  <div className="mx-auto p-4 bg-white rounded-3xl border border-slate-100 shadow-sm relative group overflow-hidden w-fit">
                    {supplier.upiId ? (
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=upi://pay?pa=${supplier.upiId}&pn=${supplier.name}&cu=INR`} 
                        alt="UPI QR Code"
                        className="w-44 h-44 relative z-10"
                      />
                    ) : (
                      <div className="w-44 h-44 flex flex-col items-center justify-center text-slate-300 p-4">
                        <Edit2 className="w-8 h-8 mb-2 opacity-20" />
                        <p className="text-[10px] font-bold uppercase tracking-wider">No UPI ID Added</p>
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 mb-1">UPI Transfer</p>
                    <p className="text-xs text-slate-500 mb-6 px-4">Scan QR to pay {supplier.name} instantly via any UPI app</p>
                    <div className="bg-white px-4 py-3 rounded-2xl border border-slate-100 inline-flex items-center gap-2 group cursor-pointer hover:border-blue-200 transition-all shadow-sm">
                      <span className="text-sm font-bold text-slate-700">{supplier.upiId || "Not Provided"}</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  {[
                    { label: "Account No", value: supplier.accountNumber },
                    { label: "IFSC Code",  value: supplier.ifscCode },
                    { label: "Bank Name",  value: supplier.bankName }
                  ].map(f => (
                    <div key={f.label} className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm text-left">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{f.label}</p>
                      <p className="text-lg font-black text-slate-900 tracking-tight">{f.value || "—"}</p>
                    </div>
                  ))}
                  <button 
                    className="btn btn-primary w-full h-14 shadow-xl shadow-blue-600/20 mt-4"
                    onClick={() => window.open('https://www.onlinesbi.sbi/', '_blank')}
                  >
                    Open Bank Portal
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

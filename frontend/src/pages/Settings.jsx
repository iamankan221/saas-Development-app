import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { Save, CheckCircle } from "lucide-react";

export default function Settings() {
  const [form, setForm] = useState(null);
  const [saved, setSaved] = useState(false);

  const { data: settings, isLoading } = useQuery({ queryKey: ["settings"], queryFn: apiClient.getSettings });

  useEffect(() => { if (settings && !form) setForm(settings); }, [settings]);

  const updateMutation = useMutation({
    mutationFn: apiClient.updateSettings,
    onSuccess: () => { setSaved(true); setTimeout(() => setSaved(false), 2500); },
  });

  if (isLoading || !form) return <p className="text-center py-20 text-gray-400">Loading…</p>;

  const sections = [
    {
      title: "Store Information",
      fields: [
        { name: "shopName",  label: "Shop Name",     placeholder: "My Store" },
        { name: "phone",     label: "Phone Number",  placeholder: "9876500000" },
        { name: "email",     label: "Email",         placeholder: "store@email.com" },
        { name: "address",   label: "Address",       placeholder: "10, MG Road, Bengaluru", full: true },
        { name: "gstNumber", label: "GST Number",    placeholder: "29XXXXX1234Z" },
      ],
    },
    {
      title: "Invoice Settings",
      fields: [
        { name: "invoicePrefix", label: "Invoice Prefix", placeholder: "INV" },
        { name: "currency",      label: "Currency",        placeholder: "INR" },
        { name: "taxRate",       label: "Default GST Rate (%)", placeholder: "18", type: "number" },
      ],
    },
  ];

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Configure your store and invoice preferences</p>
      </div>

      {sections.map(section => (
        <div key={section.title} className="card p-5">
          <h2 className="font-semibold text-gray-900 mb-4">{section.title}</h2>
          <div className="grid grid-cols-2 gap-4">
            {section.fields.map(f => (
              <div key={f.name} className={f.full ? "col-span-2" : ""}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
                <input
                  className="input"
                  type={f.type || "text"}
                  placeholder={f.placeholder}
                  value={form[f.name] ?? ""}
                  onChange={e => setForm(v => ({ ...v, [f.name]: e.target.value }))}
                />
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="flex items-center justify-end gap-3">
        {saved && (
          <span className="flex items-center gap-1.5 text-sm text-emerald-600 font-medium">
            <CheckCircle className="w-4 h-4" /> Settings saved!
          </span>
        )}
        <button
          className="btn-primary gap-2"
          onClick={() => updateMutation.mutate(form)}
          disabled={updateMutation.isPending}
        >
          <Save className="w-4 h-4" />
          {updateMutation.isPending ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { apiClient, formatINR, formatDate } from "@/lib/api";
import { ArrowLeft, Edit2, Save, X } from "lucide-react";

const CATEGORIES = [
  "Groceries", "Dairy", "Beverages", "Personal Care", "Household", "Electronics", "Hardware", "Others"
];

const UNITS = [
  { short: "pcs", label: "Piece (pcs)" },
  { short: "kg",  label: "Kilogram (kg)" },
  { short: "g",   label: "Gram (g)" },
  { short: "ltr", label: "Liter (ltr)" },
  { short: "ml",  label: "Milliliter (ml)" },
  { short: "box", label: "Box (box)" },
  { short: "pkt", label: "Packet (pkt)" },
  { short: "dz",  label: "Dozen (dz)" },
];

const TAX_OPTIONS = [
  "NONE", "IGST 0%", "GST 0%", "IGST 0.25%", "GST 0.25%", "IGST 3%", "GST 3%", "IGST 5%", "GST 5%", 
  "IGST 12%", "GST 12%", "IGST 18%", "GST 18%", "IGST 28%", "GST 28%", "IGST 40%", "GST 40%", "Exempt"
];

export default function InventoryDetail() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(null);

  const { data: item, isLoading } = useQuery({
    queryKey: ["inventory-item", id],
    queryFn: () => apiClient.getInventoryItem(id),
    onSuccess: (data) => !form && setForm(data),
  });

  const updateMutation = useMutation({
    mutationFn: (data) => {
      const taxParts = String(data.taxRate).split(" ");
      const taxType = taxParts[0] === "Exempt" ? "EXEMPT" : taxParts[0];
      const taxRate = taxParts[1] ? parseFloat(taxParts[1].replace("%", "")) : (taxParts[0] === "NONE" || taxParts[0] === "Exempt" ? 0 : data.taxRate);
      return apiClient.updateInventoryItem(id, { ...data, taxRate, taxType });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["inventory-item", id] }); setEditing(false); },
  });

  if (isLoading) return <p className="text-center py-20 text-gray-400">Loading…</p>;
  if (!item) return <p className="text-center py-20 text-red-500">Item not found.</p>;

  const current = editing ? form : item;

  const fields = [
    { name: "name",             label: "Item Name",         type: "text" },
    { name: "sku",              label: "SKU",               type: "text" },
    { name: "category",         label: "Category",          type: "select", options: CATEGORIES },
    { name: "location",         label: "Storage Location",  type: "text" },
    { name: "unit",             label: "Unit",              type: "select", options: UNITS },
    { name: "purchasePrice",    label: "Purchase Price (₹)",type: "number" },
    { name: "sellingPrice",     label: "Selling Price (₹)", type: "number" },
    { name: "currentQuantity",  label: "Current Stock",     type: "number" },
    { name: "totalQuantity",    label: "Total Quantity",    type: "number" },
    { name: "lowStockThreshold",label: "Low Stock Threshold",type:"number" },
    { name: "taxRate",          label: "Tax Rate",          type: "select", options: TAX_OPTIONS },
    { name: "unitValue",        label: "Unit Value (SKU Qty)", type: "number" },
    { name: "hsnCode",          label: "HSN Code",          type: "text" },
    { name: "expiryDate",       label: "Expiry Date",       type: "date" },
  ];

  return (
    <div className="max-w-3xl space-y-5">
      <div className="flex items-center gap-3">
        <button className="btn btn-ghost p-2" onClick={() => navigate("/inventory")}><ArrowLeft className="w-4 h-4" /></button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{item.name}</h1>
          <p className="text-sm text-gray-500">{item.category || "—"} · {item.location || "—"}</p>
        </div>
        {editing ? (
          <div className="flex gap-2">
            <button className="btn btn-outline gap-2" onClick={() => { setForm(item); setEditing(false); }}><X className="w-4 h-4" /> Cancel</button>
            <button className="btn btn-primary gap-2" onClick={() => updateMutation.mutate(form)} disabled={updateMutation.isPending}><Save className="w-4 h-4" /> Save</button>
          </div>
        ) : (
          <button className="btn btn-outline gap-2" onClick={() => { 
            const taxLabel = item.taxType && item.taxRate != null 
              ? (item.taxType === "NONE" ? "NONE" : item.taxType === "EXEMPT" ? "Exempt" : `${item.taxType} ${item.taxRate}%`)
              : (item.taxRate != null ? `GST ${item.taxRate}%` : "NONE");
            setForm({...item, taxRate: TAX_OPTIONS.includes(taxLabel) ? taxLabel : "GST 18%"}); 
            setEditing(true); 
          }}><Edit2 className="w-4 h-4" /> Edit</button>
        )}
      </div>

      {/* Stock Status */}
      <div className="grid grid-cols-3 gap-4">
        <div className={`card p-4 ${item.currentQuantity <= item.lowStockThreshold ? "border-orange-200 bg-orange-50" : ""}`}>
          <p className="text-xs text-gray-500">Current Stock</p>
          <p className={`text-2xl font-bold mt-1 ${item.currentQuantity <= item.lowStockThreshold ? "text-orange-600" : "text-gray-900"}`}>
            {item.currentQuantity} <span className="text-sm font-normal text-gray-500">{item.unit}</span>
          </p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500">Stock Value</p>
          <p className="text-2xl font-bold mt-1 text-purple-600">{formatINR(item.sellingPrice * item.currentQuantity)}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500">Margin</p>
          <p className="text-2xl font-bold mt-1 text-emerald-600">
            {item.purchasePrice > 0 ? (((item.sellingPrice - item.purchasePrice) / item.sellingPrice) * 100).toFixed(1) : "—"}%
          </p>
        </div>
      </div>

      {/* Details */}
      <div className="card p-5">
        <h2 className="font-semibold text-gray-900 mb-4">Item Details</h2>
        <div className="grid grid-cols-2 gap-4">
          {fields.map(f => (
            <div key={f.name}>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{f.label}</label>
              {editing ? (
                f.type === "select" ? (
                  <select
                    className="input"
                    value={form[f.name] ?? ""}
                  onChange={e => {
                    const val = e.target.value;
                    if (f.name === "unit") {
                      const isDecimalUnit = ["kg", "g", "ltr", "ml"].includes(val);
                      setForm(v => {
                        const next = { ...v, unit: val };
                        if (!isDecimalUnit) {
                          if (next.currentQuantity) next.currentQuantity = String(next.currentQuantity).split(".")[0];
                          if (next.totalQuantity) next.totalQuantity = String(next.totalQuantity).split(".")[0];
                          if (next.lowStockThreshold) next.lowStockThreshold = String(next.lowStockThreshold).split(".")[0];
                        }
                        return next;
                      });
                    } else {
                      setForm(v => ({ ...v, [f.name]: val }));
                    }
                  }}
                >
                  {f.name === "category" ? (
                    f.options.map(opt => <option key={opt} value={opt}>{opt}</option>)
                  ) : (
                    f.options.map(opt => <option key={opt.short} value={opt.short}>{opt.label}</option>)
                  )}
                </select>
                ) : (
                  <input
                    className={`input transition-all duration-300 ${
                      f.name === "sellingPrice" && form.sellingPrice > 0 && form.purchasePrice > 0
                        ? Number(form.sellingPrice) > Number(form.purchasePrice)
                          ? "text-emerald-600 bg-emerald-50 border-emerald-300 font-bold"
                          : Number(form.sellingPrice) < Number(form.purchasePrice)
                            ? "text-red-600 bg-red-50 border-red-300 font-bold"
                            : ""
                        : ""
                    }`}
                    type={f.type}
                    step={(() => {
                      if (f.type !== "number") return undefined;
                      const isDecimalUnit = ["kg", "g", "ltr", "ml"].includes(form.unit);
                      if (f.name === "currentQuantity" || f.name === "totalQuantity" || f.name === "lowStockThreshold") {
                        return isDecimalUnit ? "0.01" : "1";
                      }
                      return "0.01";
                    })()}
                    value={form[f.name] ?? ""}
                    onChange={e => {
                      let val = e.target.value;
                      const isDecimalUnit = ["kg", "g", "ltr", "ml"].includes(form.unit);
                      if (!isDecimalUnit && (f.name === "currentQuantity" || f.name === "totalQuantity" || f.name === "lowStockThreshold")) {
                        val = val.split(".")[0];
                      }
                      setForm(v => ({ ...v, [f.name]: val }));
                    }}
                  />
                )
              ) : (
                <p className="font-medium text-gray-900">
                  {f.name === "unit" ? (UNITS.find(u => u.short === item[f.name])?.label || item[f.name] || "—") : 
                   f.name === "taxRate" ? (
                     item.taxType && item.taxRate != null 
                       ? (item.taxType === "NONE" ? "NONE" : item.taxType === "EXEMPT" ? "Exempt" : `${item.taxType} ${item.taxRate}%`)
                       : (item.taxRate != null ? `GST ${item.taxRate}%` : "—")
                   ) :
                   f.type === "date" ? formatDate(item[f.name]) :
                   (item[f.name] ?? "—")}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

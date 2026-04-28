import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiClient, formatINR, formatDate } from "@/lib/api";
import { Search, Plus, Trash2, Eye, Package, AlertTriangle, Clock } from "lucide-react";

function AddItemModal({ onClose, onSave }) {
  const [form, setForm] = useState({
    name: "", sku: "", category: "", location: "", unit: "pcs",
    purchasePrice: 0, sellingPrice: 0, currentQuantity: 0,
    totalQuantity: 0, lowStockThreshold: 10, taxRate: 18,
    hsnCode: "", expiryDate: "", supplierId: null,
    unitValue: 1.0,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.unit.trim()) return;
    onSave({
      ...form,
      purchasePrice: +form.purchasePrice, sellingPrice: +form.sellingPrice,
      currentQuantity: +form.currentQuantity, totalQuantity: +form.totalQuantity,
      lowStockThreshold: +form.lowStockThreshold, taxRate: +form.taxRate,
      unitValue: +form.unitValue || 1.0,
      sku: form.sku || null, category: form.category || null,
      location: form.location || null, hsnCode: form.hsnCode || null,
      expiryDate: form.expiryDate || null,
    });
  };

  const fields = [
    { name: "name",             label: "Item Name *",         type: "text",   placeholder: "Product name",       full: true },
    { name: "sku",              label: "SKU",                 type: "text",   placeholder: "SKU-001" },
    { name: "category",         label: "Category",            type: "text",   placeholder: "Groceries, Dairy…" },
    { name: "location",         label: "Storage Location",    type: "text",   placeholder: "Rack A-1" },
    { name: "unit",             label: "Unit *",              type: "text",   placeholder: "pcs, kg, ltr…" },
    { name: "purchasePrice",    label: "Purchase Price (₹) *",type: "number", placeholder: "0" },
    { name: "sellingPrice",     label: "Selling Price (₹) *", type: "number", placeholder: "0" },
    { name: "currentQuantity",  label: "Current Qty *",       type: "number", placeholder: "0" },
    { name: "totalQuantity",    label: "Total Qty",           type: "number", placeholder: "0" },
    { name: "lowStockThreshold",label: "Low Stock Threshold", type: "number", placeholder: "10" },
    { name: "taxRate",          label: "GST Rate (%)",        type: "number", placeholder: "18" },
    { name: "unitValue",        label: "Unit Value (SKU Qty) *", type: "number", placeholder: "1.0" },
    { name: "hsnCode",          label: "HSN Code",            type: "text",   placeholder: "8528720" },
    { name: "expiryDate",       label: "Expiry Date",         type: "date" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold mb-5">Add Inventory Item</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
          {fields.map(f => (
            <div key={f.name} className={f.full ? "col-span-2" : ""}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
              <input
                className="input"
                type={f.type}
                placeholder={f.placeholder}
                value={form[f.name]}
                step={f.type === "number" ? "0.01" : undefined}
                onChange={e => setForm(v => ({ ...v, [f.name]: e.target.value }))}
              />
            </div>
          ))}
          <div className="col-span-2 flex justify-end gap-3 pt-2">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">Add Item</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Inventory() {
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [filterLow, setFilterLow] = useState(false);
  const [filterExpiring, setFilterExpiring] = useState(false);
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const qc = useQueryClient();

  const { data: itemsRes, isLoading } = useQuery({
    queryKey: ["inventory", search, filterLow, filterExpiring, page],
    queryFn: async () => {
      const response = await apiClient.getInventory({ 
        search: search || undefined, 
        lowStock: filterLow || undefined, 
        expiringSoon: filterExpiring || undefined,
        page,
        limit: 20
      });
      return response;
    }
  });

  const items = itemsRes?.data || [];
  const pagination = itemsRes?.pagination || { page: 1, pages: 1 };
  const summary = itemsRes?.summary;

  const createMutation = useMutation({
    mutationFn: apiClient.createInventoryItem,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["inventory"] }); setShowModal(false); },
  });
  const deleteMutation = useMutation({
    mutationFn: apiClient.deleteInventoryItem,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["inventory"] }); },
  });

  const today = new Date().toISOString().split("T")[0];
  const limit = new Date(); limit.setDate(limit.getDate() + 30);
  const expiryLimit = limit.toISOString().split("T")[0];

  return (
    <div className="space-y-6">
      {showModal && <AddItemModal onClose={() => setShowModal(false)} onSave={createMutation.mutate} />}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory & Stock</h1>
          <p className="text-sm text-gray-500 mt-1">Manage product catalog and stock levels</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4" /> Add Item
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Items",    value: summary?.totalItems ?? "—",              warn: false },
          { label: "Stock Value",    value: formatINR(summary?.totalStockValue),     warn: false },
          { label: "Low Stock",      value: summary?.lowStockCount ?? "—",           warn: (summary?.lowStockCount ?? 0) > 0 },
          { label: "Expiring Soon",  value: summary?.expiringSoonCount ?? "—",       warn: (summary?.expiringSoonCount ?? 0) > 0 },
        ].map(c => (
          <div key={c.label} className={`card p-4 ${c.warn ? "border-orange-200" : ""}`}>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">{c.label}</p>
            <p className={`text-xl font-bold mt-1 ${c.warn ? "text-orange-600" : "text-gray-900"}`}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input className="input pl-9" placeholder="Search items…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {[
          { label: "Low Stock", active: filterLow, toggle: () => setFilterLow(!filterLow), activeClass: "bg-orange-100 border-orange-300 text-orange-700" },
          { label: "Expiring Soon", active: filterExpiring, toggle: () => setFilterExpiring(!filterExpiring), activeClass: "bg-yellow-100 border-yellow-300 text-yellow-700" },
        ].map(f => (
          <button key={f.label} onClick={f.toggle} className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${f.active ? f.activeClass : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"}`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      {isLoading ? (
        <p className="text-center py-10 text-gray-400">Loading inventory…</p>
      ) : items.length === 0 ? (
        <div className="card flex flex-col items-center py-16 gap-3">
          <Package className="w-12 h-12 text-gray-200" />
          <p className="text-gray-400">No inventory items found.</p>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-gray-50">
              <tr className="text-left text-xs text-gray-500 uppercase tracking-wider">
                <th className="px-4 py-3 font-medium">Item</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Location</th>
                <th className="px-4 py-3 font-medium text-right">Unit Value</th>
                <th className="px-4 py-3 font-medium text-right">Stock</th>
                <th className="px-4 py-3 font-medium text-right">Selling Price</th>
                <th className="px-4 py-3 font-medium text-right">Stock Value</th>
                <th className="px-4 py-3 font-medium text-right">Expiry</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map(item => {
                const isLow = item.currentQuantity <= item.lowStockThreshold;
                const isExpiring = item.expiryDate && item.expiryDate >= today && item.expiryDate <= expiryLimit;
                return (
                  <tr key={item.id} className="hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => navigate(`/inventory/${item.id}`)}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{item.name}</p>
                      {item.sku && <p className="text-xs text-gray-400">{item.sku}</p>}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{item.category || "—"}</td>
                    <td className="px-4 py-3 text-gray-500">{item.location || "—"}</td>
                    <td className="px-4 py-3 text-right text-gray-500 font-mono text-xs">{item.unitValue || 1}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-semibold ${isLow ? "text-orange-600" : "text-gray-900"}`}>
                        {item.currentQuantity} {item.unit}
                      </span>
                      {isLow && <AlertTriangle className="inline ml-1 w-3 h-3 text-orange-500" />}
                    </td>
                    <td className="px-4 py-3 text-right">{formatINR(item.sellingPrice)}</td>
                    <td className="px-4 py-3 text-right font-medium">{formatINR(item.sellingPrice * item.currentQuantity)}</td>
                    <td className="px-4 py-3 text-right">
                      {item.expiryDate ? (
                        <span className={isExpiring ? "text-orange-600 font-medium" : "text-gray-500"}>
                          {item.expiryDate}
                          {isExpiring && <Clock className="inline ml-1 w-3 h-3" />}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 justify-end">
                        <button className="btn btn-ghost p-1.5" onClick={e => { e.stopPropagation(); navigate(`/inventory/${item.id}`); }}><Eye className="w-4 h-4" /></button>
                        <button className="btn btn-danger p-1.5" onClick={e => { e.stopPropagation(); if (confirm(`Delete "${item.name}"?`)) deleteMutation.mutate(item.id); }}><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Controls */}
      {!isLoading && pagination.pages > 1 && (
        <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-6">
          <p className="text-sm text-slate-500 font-medium">
            Showing <span className="text-slate-900">Page {pagination.page}</span> of <span className="text-slate-900">{pagination.pages}</span>
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => { setPage(p => Math.max(1, p - 1)); window.scrollTo(0, 0); }}
              disabled={page === 1}
              className="btn bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none px-6"
            >
              Previous
            </button>
            <button
              onClick={() => { setPage(p => Math.min(pagination.pages, p + 1)); window.scrollTo(0, 0); }}
              disabled={page === pagination.pages}
              className="btn bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none px-6"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

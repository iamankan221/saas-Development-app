import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiClient, formatINR, formatDate } from "@/lib/api";
import { Plus, Eye, Trash2, FileText } from "lucide-react";

const STATUSES = ["all", "paid", "unpaid", "draft", "cancelled"];

export default function Bills() {
  const [, navigate] = useLocation();
  const [filterStatus, setFilterStatus] = useState("all");
  const qc = useQueryClient();

  const { data: bills = [], isLoading } = useQuery({
    queryKey: ["bills", filterStatus],
    queryFn: async() => {
      const response = await apiClient.getBills(filterStatus !== "all" ? { status: filterStatus } : {});
      return response.data || response.bills || response || [];
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => apiClient.updateBill(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bills"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: apiClient.deleteBill,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bills"] }),
  });

  const statusBadge = (s) => {
    const map = { paid: "badge-green", unpaid: "badge-red", draft: "badge-yellow", cancelled: "badge-gray" };
    return <span className={`badge ${map[s] || "badge-gray"}`}>{s}</span>;
  };

  const totals = {
    total: bills.reduce((a, b) => a + b.totalAmount, 0),
    paid: bills.filter(b => b.status === "paid").reduce((a, b) => a + b.totalAmount, 0),
    unpaid: bills.filter(b => b.status === "unpaid").reduce((a, b) => a + b.totalAmount, 0),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bills & Invoices</h1>
          <p className="text-sm text-gray-500 mt-1">Manage all your invoices</p>
        </div>
        <button className="btn-primary" onClick={() => navigate("/bills/new")}>
          <Plus className="w-4 h-4" /> New Bill
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total",   value: formatINR(totals.total),  color: "text-gray-900" },
          { label: "Paid",    value: formatINR(totals.paid),   color: "text-emerald-600" },
          { label: "Unpaid",  value: formatINR(totals.unpaid), color: "text-red-600" },
        ].map(c => (
          <div key={c.label} className="card p-4">
            <p className="text-xs text-gray-500">{c.label}</p>
            <p className={`text-xl font-bold mt-1 ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {STATUSES.map(s => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
              filterStatus === s
                ? "bg-blue-600 text-white border-blue-600"
                : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Table */}
      {isLoading ? (
        <p className="text-center py-10 text-gray-400">Loading bills…</p>
      ) : bills.length === 0 ? (
        <div className="card flex flex-col items-center py-16 gap-3">
          <FileText className="w-12 h-12 text-gray-200" />
          <p className="text-gray-400">No bills found.</p>
          <button className="btn-primary mt-2" onClick={() => navigate("/bills/new")}>
            <Plus className="w-4 h-4" /> Create First Bill
          </button>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-gray-50">
              <tr className="text-left text-xs text-gray-500 uppercase tracking-wider">
                <th className="px-4 py-3 font-medium">Bill #</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Due Date</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Amount</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {bills.map(b => (
                <tr
                  key={b.id}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/bills/${b.id}`)}
                >
                  <td className="px-4 py-3 font-medium text-blue-600">{b.billNumber}</td>
                  <td className="px-4 py-3 text-gray-900">{b.customerName}</td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(b.createdAt)}</td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(b.dueDate)}</td>
                  <td className="px-4 py-3">{statusBadge(b.status)}</td>
                  <td className="px-4 py-3 text-right font-semibold">{formatINR(b.totalAmount)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 justify-end">
                      {b.status === "unpaid" && (
                        <button
                          className="px-2 py-1 text-xs rounded bg-green-50 text-green-700 border border-green-200 hover:bg-green-100"
                          onClick={e => { e.stopPropagation(); updateMutation.mutate({ id: b.id, data: { status: "paid" } }); }}
                        >Mark Paid</button>
                      )}
                      <button className="btn-ghost p-1.5" onClick={e => { e.stopPropagation(); navigate(`/bills/${b.id}`); }}>
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        className="btn-danger p-1.5"
                        onClick={e => { e.stopPropagation(); if (confirm("Delete this bill?")) deleteMutation.mutate(b.id); }}
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

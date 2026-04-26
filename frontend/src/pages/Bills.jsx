import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiClient, formatINR, formatDate } from "@/lib/api";
import { Plus, Eye, Trash2, FileText, Copy, Check, Calendar, RotateCcw, X, Loader2, Search, FileDown } from "lucide-react";
import { generateInvoicePDF } from "@/lib/invoicePDF";
import { toast } from "@/lib/toast";

const STATUS_OPTIONS = ["paid", "unpaid", "partial", "quotation"];

export default function Bills() {
  const [, navigate] = useLocation();
  const [selectedStatuses, setSelectedStatuses] = useState(new Set()); // empty = all
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [copiedId, setCopiedId] = useState(null);
  const [showReturn, setShowReturn] = useState(false);
  const qc = useQueryClient();

  const { data: bills = [], isLoading } = useQuery({
    queryKey: ["bills"],
    queryFn: async() => {
      const response = await apiClient.getBills({});
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
    const map = { paid: "badge-green", unpaid: "badge-red", partial: "badge-yellow", draft: "badge-gray", quotation: "badge-gray" };
    const label = { partial: "Partial Paid", draft: "Quotation", quotation: "Quotation" };
    return <span className={`badge ${map[s] || "badge-gray"}`}>{label[s] || s}</span>;
  };

  // Toggle status filter
  const toggleStatus = (s) => {
    setSelectedStatuses(prev => {
      const next = new Set(prev);
      if (next.has(s)) {
        next.delete(s);
      } else {
        next.add(s);
      }
      return next;
    });
  };

  const selectAll = () => setSelectedStatuses(new Set());
  const isAllSelected = selectedStatuses.size === 0;

  // Client-side filtering (status + date)
  const filteredBills = bills.filter(b => {
    // Status filter
    if (!isAllSelected && !selectedStatuses.has(b.status)) return false;
    // Date filter
    if (startDate) {
      const billDate = new Date(b.createdAt).toISOString().split('T')[0];
      if (billDate < startDate) return false;
    }
    if (endDate) {
      const billDate = new Date(b.createdAt).toISOString().split('T')[0];
      if (billDate > endDate) return false;
    }
    return true;
  });

  const totals = {
    total: filteredBills.reduce((a, b) => a + Number(b.totalAmount), 0),
    paid: filteredBills.filter(b => b.status === "paid").reduce((a, b) => a + Number(b.totalAmount), 0),
    unpaid: filteredBills.filter(b => b.status === "unpaid").reduce((a, b) => a + Number(b.totalAmount), 0),
    partial: filteredBills.filter(b => b.status === "partial").reduce((a, b) => a + Number(b.paidAmount || 0), 0),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bills & Invoices</h1>
          <p className="text-sm text-gray-500 mt-1">Manage all your invoices</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-outline gap-1.5" onClick={() => setShowReturn(true)}>
            <RotateCcw className="w-4 h-4" /> Return
          </button>
          <button className="btn-primary" onClick={() => navigate("/bills/new")}>
            <Plus className="w-4 h-4" /> New Bill
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total",        value: formatINR(totals.total),   color: "text-gray-900" },
          { label: "Paid",         value: formatINR(totals.paid),    color: "text-emerald-600" },
          { label: "Unpaid",       value: formatINR(totals.unpaid),  color: "text-red-600" },
          { label: "Partial Paid", value: formatINR(totals.partial), color: "text-amber-600" },
        ].map(c => (
          <div key={c.label} className="card p-4">
            <p className="text-xs text-gray-500">{c.label}</p>
            <p className={`text-xl font-bold mt-1 ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-2 flex-wrap">
          {/* All button */}
          <button
            onClick={selectAll}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
              isAllSelected
                ? "bg-blue-600 text-white border-blue-600"
                : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            All
          </button>
          {/* Individual status buttons */}
          {STATUS_OPTIONS.map(s => (
            <button
              key={s}
              onClick={() => toggleStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                selectedStatuses.has(s)
                  ? "bg-blue-600 text-white border-blue-600"
                  : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              {s === "partial" ? "Partial Paid" : s === "quotation" ? "Quotation" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        <div className="h-6 w-px bg-gray-200 hidden md:block" />

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            <label className="text-xs font-medium text-gray-500">From</label>
            <input
              className="input text-sm py-1.5 px-2.5 w-36"
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-1.5">
            <label className="text-xs font-medium text-gray-500">To</label>
            <input
              className="input text-sm py-1.5 px-2.5 w-36"
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
            />
          </div>
          {(startDate || endDate) && (
            <button
              type="button"
              className="px-2 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg border border-red-200 transition-colors"
              onClick={() => { setStartDate(""); setEndDate(""); }}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <p className="text-center py-10 text-gray-400">Loading bills…</p>
      ) : filteredBills.length === 0 ? (
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
                <th className="px-4 py-3 font-medium">Invoice No.</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Due Date</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Amount</th>
                <th className="px-4 py-3 font-medium text-right">Paid</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredBills.map(b => (
                <tr
                  key={b.id}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/bills/${b.id}`)}
                >
                  <td className="px-4 py-3 font-medium text-blue-600">{b.billNumber}</td>
                  <td className="px-4 py-3">
                    <div className="inline-flex items-center gap-1.5">
                      <span className="font-mono text-xs font-semibold tracking-wider bg-amber-50 text-amber-700 border border-amber-200 px-2 py-1 rounded-md">
                        {b.billCode || "—"}
                      </span>
                      {b.billCode && (
                        <button
                          type="button"
                          className="p-1 rounded-md text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                          title="Copy Invoice No."
                          onClick={e => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(b.billCode);
                            setCopiedId(b.id);
                            setTimeout(() => setCopiedId(null), 1500);
                          }}
                        >
                          {copiedId === b.id
                            ? <Check className="w-3.5 h-3.5 text-green-500" />
                            : <Copy className="w-3.5 h-3.5" />
                          }
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-900">{b.customerName}</td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(b.createdAt)}</td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(b.dueDate)}</td>
                  <td className="px-4 py-3">{statusBadge(b.status)}</td>
                  <td className="px-4 py-3 text-right font-semibold">{formatINR(b.totalAmount)}</td>
                  <td className="px-4 py-3 text-right text-emerald-600 font-medium">{formatINR(b.paidAmount || 0)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 justify-end">
                      {(b.status === "unpaid" || b.status === "partial") && (
                        <button
                          className="px-2 py-1 text-xs rounded bg-green-50 text-green-700 border border-green-200 hover:bg-green-100"
                          onClick={e => { e.stopPropagation(); updateMutation.mutate({ id: b.id, data: { status: "paid" } }); }}
                        >Mark Paid</button>
                      )}
                      <button
                        className="btn-ghost p-1.5"
                        title="Download PDF Invoice"
                        onClick={e => {
                          e.stopPropagation();
                          apiClient.getBill(b.id).then(fullBill => generateInvoicePDF(fullBill)).catch(() => generateInvoicePDF(b));
                        }}
                      >
                        <FileDown className="w-4 h-4 text-red-500" />
                      </button>
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

      {/* Return Modal */}
      {showReturn && (
        <ReturnModal
          onClose={() => setShowReturn(false)}
          onFound={(bill) => {
            setShowReturn(false);
            navigate(`/bills/new?mode=return&billId=${bill.id}`);
          }}
        />
      )}
    </div>
  );
}

// ============================================================================
// RETURN MODAL
// ============================================================================

function ReturnModal({ onClose, onFound }) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [foundBill, setFoundBill] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!code.trim()) { toast.error("Please enter an invoice code"); return; }
    setLoading(true);
    setFoundBill(null);
    try {
      const bill = await apiClient.getBillByCode(code.trim());
      setFoundBill(bill);
      toast.success("Bill found!");
    } catch (err) {
      toast.error(err.response?.data?.error || "No bill found with that code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-gray-900">Return Bill</h2>
          <button type="button" onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSearch} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1.5">Invoice Code</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                className="input text-center tracking-[0.3em] uppercase font-mono text-lg pl-10"
                type="text"
                maxLength={8}
                placeholder="EF314B"
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                autoFocus
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">Enter the 6-character invoice code from the bill</p>
          </div>

          {/* Found Bill Preview */}
          {foundBill && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500 uppercase">Bill Found</span>
                <span className="font-mono text-xs font-semibold tracking-wider bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-md">
                  {foundBill.billCode}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-500">Bill #:</span>{" "}
                  <span className="font-medium text-gray-900">{foundBill.billNumber}</span>
                </div>
                <div>
                  <span className="text-gray-500">Customer:</span>{" "}
                  <span className="font-medium text-gray-900">{foundBill.customerName}</span>
                </div>
                <div>
                  <span className="text-gray-500">Amount:</span>{" "}
                  <span className="font-semibold text-gray-900">{formatINR(foundBill.totalAmount)}</span>
                </div>
                <div>
                  <span className="text-gray-500">Status:</span>{" "}
                  <span className={`font-medium ${foundBill.status === "paid" ? "text-emerald-600" : foundBill.status === "unpaid" ? "text-red-600" : "text-amber-600"}`}>
                    {foundBill.status}
                  </span>
                </div>
              </div>
              {foundBill.items && foundBill.items.length > 0 && (
                <div className="pt-2 border-t border-gray-200">
                  <span className="text-xs font-semibold text-gray-500">Items ({foundBill.items.length}):</span>
                  <div className="mt-1 space-y-0.5">
                    {foundBill.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-xs text-gray-600">
                        <span>{item.itemName} × {item.quantity}</span>
                        <span>{formatINR(item.unitPrice)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-1">
            <button type="button" className="btn-outline" onClick={onClose}>Cancel</button>
            {foundBill ? (
              <button
                type="button"
                onClick={() => onFound(foundBill)}
                className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 transition-colors shadow-sm"
              >
                <RotateCcw className="w-4 h-4" /> Process Return
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
              >
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Searching...</> : <><Search className="w-4 h-4" /> Find Bill</>}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

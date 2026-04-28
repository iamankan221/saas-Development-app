import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiClient, formatINR, formatDate } from "@/lib/api";
import { Plus, Eye, Trash2, FileText, Copy, Check, Calendar, RotateCcw, X, Loader2, Search, FileDown } from "lucide-react";
import { generateInvoicePDF } from "@/lib/invoicePDF";
import { toast } from "@/lib/toast";

const STATUS_OPTIONS = ["paid", "unpaid", "partial", "quotation"];

export default function Bills() {
  const [, navigate] = useLocation();
  const [page, setPage] = useState(1);
  const [selectedStatuses, setSelectedStatuses] = useState(new Set()); 
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [startText, setStartText] = useState("");
  const [endText, setEndText] = useState("");
  const [copiedId, setCopiedId] = useState(null);
  const [showReturn, setShowReturn] = useState(false);
  const qc = useQueryClient();
  const fromTextRef = useRef(null);
  const toTextRef = useRef(null);

  const handleDateChange = (val, textSetter, dateSetter, nextRef = null) => {
    // Always update the text being typed
    let clean = val.replace(/[^\d]/g, "");
    if (clean.length > 8) clean = clean.slice(0, 8);
    let formatted = clean;
    if (clean.length > 2) formatted = clean.slice(0, 2) + "/" + clean.slice(2);
    if (clean.length > 4) formatted = formatted.slice(0, 5) + "/" + formatted.slice(5);
    
    textSetter(formatted);

    // Update filter state only if complete
    if (formatted.length === 10) {
      const [d, m, y] = formatted.split("/");
      dateSetter(`${y}-${m}-${d}`);
      if (nextRef?.current) nextRef.current.focus();
    } else {
      dateSetter("");
    }
  };

  const { data: billsRes, isLoading } = useQuery({
    queryKey: ["bills", page],
    queryFn: async() => {
      const response = await apiClient.getBills({ page, limit: 20 });
      return response;
    },
  });

  const bills = billsRes?.data || [];
  const pagination = billsRes?.pagination || { page: 1, pages: 1 };

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

  const clearAllFilters = () => setSelectedStatuses(new Set());

  // Client-side filtering (status + date)
  const filteredBills = bills.filter(b => {
    // Status filter
    if (selectedStatuses.size > 0 && !selectedStatuses.has(b.status)) return false;
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
        <div className="flex gap-3">
          <button className="btn btn-outline" onClick={() => setShowReturn(true)}>
            <RotateCcw className="w-4 h-4" /> Return
          </button>
          <button className="btn btn-primary" onClick={() => navigate("/bills/new")}>
            <Plus className="w-4 h-4" /> New Bill
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total",        value: formatINR(billsRes?.summary?.total || 0),   color: "text-gray-900" },
          { label: "Paid",         value: formatINR(billsRes?.summary?.paid || 0),    color: "text-emerald-600" },
          { label: "Unpaid",       value: formatINR(billsRes?.summary?.unpaid || 0),  color: "text-red-600" },
          { label: "Partial Paid", value: formatINR(billsRes?.summary?.partial || 0), color: "text-amber-600" },
        ].map(c => (
          <div key={c.label} className="card p-4">
            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">{c.label}</p>
            <p className={`text-xl font-bold mt-1 ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Filters & Date Picker */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex p-1.5 bg-slate-100/50 rounded-2xl border border-slate-200/50 overflow-hidden w-fit">
          <button
            onClick={clearAllFilters}
            className={`relative z-10 px-6 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${
              selectedStatuses.size === 0
                ? "text-white bg-[#0061FF] shadow-lg shadow-blue-600/20"
                : "text-slate-500 hover:bg-[#0061FF] hover:text-white hover:shadow-lg hover:shadow-blue-600/10"
            }`}
          >
            All
          </button>
          
          <div className="flex gap-1 ml-1">
            {STATUS_OPTIONS.map(s => {
              const active = selectedStatuses.has(s);
              return (
                <button
                  key={s}
                  onClick={() => toggleStatus(s)}
                  className={`relative z-10 px-6 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${
                    active
                      ? "text-white bg-[#0061FF] shadow-lg shadow-blue-600/20"
                      : "text-slate-500 hover:bg-[#0061FF] hover:text-white hover:shadow-lg hover:shadow-blue-600/10"
                  }`}
                >
                  {s === "partial" ? "Partial" : s === "quotation" ? "Quote" : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-2 shadow-sm shrink-0">
          <div className="flex items-center gap-2 cursor-default">
            <div className="relative">
              <Calendar 
                className="w-3.5 h-3.5 text-slate-400 cursor-pointer hover:text-blue-600 transition-colors" 
                onClick={() => {
                  const el = document.getElementById('bill-start-date');
                  if (el?.showPicker) el.showPicker(); else el?.click();
                }}
              />
              <input 
                id="bill-start-date"
                type="date" 
                tabIndex="-1"
                className="absolute opacity-0 pointer-events-none w-0 h-0 caret-transparent overflow-hidden"
                value={startDate}
                onChange={e => {
                  const val = e.target.value;
                  setStartDate(val);
                  if (val) {
                    const [y, m, d] = val.split("-");
                    setStartText(`${d}/${m}/${y}`);
                  } else {
                    setStartText("");
                  }
                }}
              />
            </div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-tight w-10 shrink-0 select-none">FROM</span>
            <div className="relative flex-1 flex items-center h-8 cursor-text" onClick={() => fromTextRef.current?.focus()}>
              {/* Ghost Suggestion Layer */}
              {!startText && <span className="absolute inset-0 text-sm text-slate-300 pointer-events-none flex items-center h-full">DD/MM/YYYY</span>}
              {startText && startText.length < 10 && (
                <span className="absolute inset-0 text-sm pointer-events-none flex items-center h-full">
                  <span className="opacity-0">{startText}</span>
                  <span className="text-slate-200">{"DD/MM/YYYY".slice(startText.length)}</span>
                </span>
              )}
              <input 
                ref={fromTextRef}
                type="text" 
                className="relative z-10 text-sm text-slate-900 focus:outline-none bg-transparent w-full h-full py-1 caret-blue-500" 
                value={startText}
                onChange={e => handleDateChange(e.target.value, setStartText, setStartDate, toTextRef)}
                onKeyDown={e => {
                  if (e.key === "Delete" || (e.key === "Backspace" && !startText)) {
                    setStartText("");
                    setStartDate("");
                  }
                }}
                maxLength={10}
              />
            </div>
          </div>
          <div className="flex items-center gap-2 cursor-default">
            <div className="relative">
              <Calendar 
                className="w-3.5 h-3.5 text-slate-400 cursor-pointer hover:text-blue-600 transition-colors" 
                onClick={() => {
                  const el = document.getElementById('bill-end-date');
                  if (el?.showPicker) el.showPicker(); else el?.click();
                }}
              />
              <input 
                id="bill-end-date"
                type="date" 
                tabIndex="-1"
                className="absolute opacity-0 pointer-events-none w-0 h-0 caret-transparent overflow-hidden"
                min={startDate}
                value={endDate}
                onChange={e => {
                  const val = e.target.value;
                  setEndDate(val);
                  if (val) {
                    const [y, m, d] = val.split("-");
                    setEndText(`${d}/${m}/${y}`);
                  } else {
                    setEndText("");
                  }
                }}
              />
            </div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-tight w-8 shrink-0 text-center select-none">TO</span>
            <div className="relative flex-1 flex items-center h-8 cursor-text" onClick={() => toTextRef.current?.focus()}>
              {/* Ghost Suggestion Layer */}
              {!endText && <span className="absolute inset-0 text-sm text-slate-300 pointer-events-none flex items-center h-full">DD/MM/YYYY</span>}
              {endText && endText.length < 10 && (
                <span className="absolute inset-0 text-sm pointer-events-none flex items-center h-full">
                  <span className="opacity-0">{endText}</span>
                  <span className="text-slate-200">{"DD/MM/YYYY".slice(endText.length)}</span>
                </span>
              )}
              <input 
                ref={toTextRef}
                type="text" 
                className="relative z-10 text-sm text-slate-900 focus:outline-none bg-transparent w-full h-full py-1 caret-blue-500" 
                value={endText}
                onChange={e => handleDateChange(e.target.value, setEndText, setEndDate)}
                onKeyDown={e => {
                  if (e.key === "Delete" || (e.key === "Backspace" && !endText)) {
                    setEndText("");
                    setEndDate("");
                  }
                  if (e.key === "Backspace" && !endText && fromTextRef.current) {
                    fromTextRef.current.focus();
                  }
                }}
                maxLength={10}
              />
            </div>
          </div>
          {(startDate || endDate) && (
            <button 
              onClick={() => { 
                setStartDate(""); setEndDate("");
                setStartText(""); setEndText("");
              }}
              className="ml-2 p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all"
              title="Clear all dates"
            >
              <Trash2 className="w-3.5 h-3.5" />
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
          <button className="btn btn-primary mt-2" onClick={() => navigate("/bills/new")}>
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
                  <td className="px-4 py-3 text-gray-900 font-medium">
                    {b.customerName?.toLowerCase().includes("walk-in") 
                      ? `Walk-in #${b.billCode || "N/A"}` 
                      : (b.customerName || "Walk-in")
                    }
                  </td>
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
                        className="btn btn-ghost p-1.5"
                        title="Download PDF Invoice"
                        onClick={e => {
                          e.stopPropagation();
                          apiClient.getBill(b.id).then(fullBill => generateInvoicePDF(fullBill)).catch(() => generateInvoicePDF(b));
                        }}
                      >
                        <FileDown className="w-4 h-4 text-red-500" />
                      </button>
                      <button className="btn btn-ghost p-1.5" onClick={e => { e.stopPropagation(); navigate(`/bills/${b.id}`); }}>
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        className="btn btn-danger p-1.5"
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

      {/* Pagination Controls */}
      {!isLoading && pagination.pages > 1 && (
        <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-6">
          <p className="text-sm text-slate-500 font-medium">
            Showing <span className="text-slate-900">Page {pagination.page}</span> of <span className="text-slate-900">{pagination.pages}</span>
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none px-6"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
              disabled={page === pagination.pages}
              className="btn bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none px-6"
            >
              Next
            </button>
          </div>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl w-full max-w-md p-6 border dark:border-white/10">
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
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
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

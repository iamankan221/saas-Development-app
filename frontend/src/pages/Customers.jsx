import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiClient, formatINR, formatDate } from "@/lib/api";
import { Search, Plus, Trash2, Eye, Users, Calendar } from "lucide-react";

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
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">Add Customer</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Customers() {
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all"); // all, active, inactive
  const [filterDebt, setFilterDebt] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [sortBy, setSortBy] = useState("newest"); // newest, oldest, name, balance
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const qc = useQueryClient();
  const fromRef = useRef(null);
  const toRef = useRef(null);
  const fromTextRef = useRef(null);
  const toTextRef = useRef(null);

  const handleDateChange = (val, setter, nextRef = null) => {
    if (!val) {
      setter("");
      return;
    }

    // Only allow digits
    let clean = val.replace(/[^\d]/g, "");
    if (clean.length > 8) clean = clean.slice(0, 8);
    
    let formatted = clean;
    if (clean.length > 2) formatted = clean.slice(0, 2) + "/" + clean.slice(2);
    if (clean.length > 4) formatted = formatted.slice(0, 5) + "/" + formatted.slice(5);
    
    setter(formatted);

    // Auto-focus next field if full
    if (formatted.length === 10 && nextRef?.current) {
      nextRef.current.focus();
    }
  };

  const { data: customersRes, isLoading } = useQuery({
    queryKey: ["customers", search, filterStatus, page],
    queryFn: async () => {
      const params = { search: search || undefined, page, limit: 20 };
      if (filterStatus !== "all") params.status = filterStatus;
      const response = await apiClient.getCustomers(params);
      return response;
    }
  });

  const customers = customersRes?.data || [];
  const pagination = customersRes?.pagination || { page: 1, pages: 1 };

  const displayCustomers = [...customers]
    .filter(c => {
      const matchDebt = !filterDebt || c.outstandingBalance > 0;
      const createdAt = new Date(c.createdAt).getTime();
      
      const parseDMY = (str) => {
        if (!str) return null;
        const parts = str.split("/");
        if (parts.length !== 3) return null;
        const [d, m, y] = parts.map(Number);
        const date = new Date(y, m - 1, d);
        return isNaN(date.getTime()) ? null : date.getTime();
      };

      const fromTime = parseDMY(fromDate);
      const toTime = parseDMY(toDate);

      const matchFrom = !fromTime || createdAt >= fromTime;
      const matchTo = !toTime || createdAt <= (toTime + 86399999); // End of day
      return matchDebt && matchFrom && matchTo;
    })
    .sort((a, b) => {
      if (sortBy === "newest") return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === "oldest") return new Date(a.createdAt) - new Date(b.createdAt);
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "balance") return b.outstandingBalance - a.outstandingBalance;
      return 0;
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
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4" /> Add Customer
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Total Customers</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{customersRes?.summary?.total || 0}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-emerald-600 uppercase font-bold tracking-wider">Active</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{customersRes?.summary?.active || 0}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-red-600 uppercase font-bold tracking-wider">With Debt</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{customersRes?.summary?.withDebt || 0}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-blue-600 uppercase font-bold tracking-wider">Total Outstanding</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{formatINR(customersRes?.summary?.totalOutstanding || 0)}</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-wrap md:flex-nowrap gap-3 items-center overflow-x-auto pb-1 no-scrollbar">
        <div className="relative shrink-0 w-60">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className="input pl-9"
            placeholder="Search customers..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <select 
          className="input w-auto shrink-0 min-w-[120px]"
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>

        <select 
          className="input w-auto shrink-0 min-w-[140px]"
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="name">Name A-Z</option>
          <option value="balance">Highest Debt</option>
        </select>
        <button 
          onClick={() => setFilterDebt(!filterDebt)}
          className={`shrink-0 px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
            filterDebt 
              ? "bg-red-50 border-red-200 text-red-600 shadow-sm" 
              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
          }`}
        >
          With Debt
        </button>

        <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-2 shadow-sm shrink-0">
          <div className="flex items-center gap-2 cursor-default">
            <div className="relative">
              <Calendar 
                className="w-3.5 h-3.5 text-slate-400 cursor-pointer hover:text-blue-600 transition-colors" 
                onClick={() => fromRef.current?.showPicker ? fromRef.current.showPicker() : fromRef.current?.click()}
              />
              <input 
                ref={fromRef}
                type="date" 
                tabIndex="-1"
                className="absolute opacity-0 pointer-events-none w-0 h-0 caret-transparent overflow-hidden"
                value={fromDate ? fromDate.split("/").reverse().join("-") : ""}
                onChange={e => {
                  if (!e.target.value) {
                    setFromDate("");
                    return;
                  }
                  const [y, m, d] = e.target.value.split("-");
                  setFromDate(`${d}/${m}/${y}`);
                }}
              />
            </div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-tight w-10 shrink-0 select-none">FROM</span>
            <div className="relative flex-1 flex items-center h-8 cursor-text" onClick={() => fromTextRef.current?.focus()}>
              {/* Ghost Suggestion Layer */}
              {!fromDate && <span className="absolute inset-0 text-sm text-slate-300 pointer-events-none flex items-center h-full">DD/MM/YYYY</span>}
              {fromDate && fromDate.length < 10 && (
                <span className="absolute inset-0 text-sm pointer-events-none flex items-center h-full">
                  <span className="opacity-0">{fromDate}</span>
                  <span className="text-slate-200">{"DD/MM/YYYY".slice(fromDate.length)}</span>
                </span>
              )}
              <input 
                ref={fromTextRef}
                type="text" 
                className="relative z-10 text-sm text-slate-900 focus:outline-none bg-transparent w-full h-full py-1 caret-blue-500" 
                value={fromDate}
                onChange={e => handleDateChange(e.target.value, setFromDate, toTextRef)}
                onKeyDown={e => {
                  if (e.key === "Delete" || (e.key === "Backspace" && fromDate.length <= 1)) {
                    setFromDate("");
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
                onClick={() => toRef.current?.showPicker ? toRef.current.showPicker() : toRef.current?.click()}
              />
              <input 
                ref={toRef}
                type="date" 
                tabIndex="-1"
                className="absolute opacity-0 pointer-events-none w-0 h-0 caret-transparent overflow-hidden"
                min={fromDate ? fromDate.split("/").reverse().join("-") : ""}
                value={toDate ? toDate.split("/").reverse().join("-") : ""}
                onChange={e => {
                  if (!e.target.value) {
                    setToDate("");
                    return;
                  }
                  const [y, m, d] = e.target.value.split("-");
                  setToDate(`${d}/${m}/${y}`);
                }}
              />
            </div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-tight w-8 shrink-0 text-center select-none">TO</span>
            <div className="relative flex-1 flex items-center h-8 cursor-text" onClick={() => toTextRef.current?.focus()}>
              {/* Ghost Suggestion Layer */}
              {!toDate && <span className="absolute inset-0 text-sm text-slate-300 pointer-events-none flex items-center h-full">DD/MM/YYYY</span>}
              {toDate && toDate.length < 10 && (
                <span className="absolute inset-0 text-sm pointer-events-none flex items-center h-full">
                  <span className="opacity-0">{toDate}</span>
                  <span className="text-slate-200">{"DD/MM/YYYY".slice(toDate.length)}</span>
                </span>
              )}
              <input 
                ref={toTextRef}
                type="text" 
                className="relative z-10 text-sm text-slate-900 focus:outline-none bg-transparent w-full h-full py-1 caret-blue-500" 
                value={toDate}
                onChange={e => handleDateChange(e.target.value, setToDate)}
                onKeyDown={e => {
                  if (e.key === "Delete" || (e.key === "Backspace" && toDate.length <= 1)) {
                    setToDate("");
                  }
                  if (e.key === "Backspace" && !toDate && fromTextRef.current) {
                    fromTextRef.current.focus();
                  }
                }}
                maxLength={10}
              />
            </div>
          </div>
          {(fromDate || toDate) && (
            <button 
              onClick={() => { setFromDate(""); setToDate(""); }}
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
        <p className="text-center py-10 text-gray-400">Loading customers…</p>
      ) : displayCustomers.length === 0 ? (
        <div className="card flex flex-col items-center py-16 gap-3">
          <Users className="w-12 h-12 text-gray-200" />
          <p className="text-gray-400">No customers match your filters.</p>
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
              {displayCustomers.map(c => (
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
                        className="btn btn-ghost p-1.5"
                        onClick={e => { e.stopPropagation(); navigate(`/customers/${c.id}`); }}
                      ><Eye className="w-4 h-4" /></button>
                      <button
                        className="btn btn-danger p-1.5"
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

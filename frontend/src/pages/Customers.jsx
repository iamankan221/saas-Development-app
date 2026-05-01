import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiClient, formatINR, formatDate, normalizePhone, maskPhone } from "@/lib/api";
import { Search, Plus, Trash2, Eye, Users, Calendar, X } from "lucide-react";

function CustomerModal({ onClose, onSave }) {
  const [form, setForm] = useState({ name: "", phone: "", email: "", address: "", pincode: "", gender: "M", gstNumber: "" });
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
      phone: normalizePhone(form.phone),
      email: form.email || null,
      address: form.address || null,
      pincode: form.pincode || null,
      gender: form.gender,
      gstNumber: form.gstNumber || null,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border/50">
          <h2 className="text-base font-black text-foreground uppercase tracking-[0.2em]">Add Customer</h2>
          <button type="button" onClick={onClose} className="p-1 rounded-lg hover:bg-accent text-muted-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Name *</label>
              <input
                className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all"
                type="text"
                placeholder="Ravi Sharma"
                value={form.name}
                onChange={e => setForm(v => ({ ...v, name: e.target.value }))}
              />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Phone *</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none border-r border-border pr-2">
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-tighter">IND</span>
                  <span className="text-xs font-bold text-foreground">+91</span>
                </div>
                <input
                  className="w-full bg-card border border-border rounded-xl pl-20 pr-4 py-3 text-sm text-foreground font-mono focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all"
                  type="tel"
                  placeholder="9876543210"
                  value={form.phone}
                  onChange={e => setForm(v => ({ ...v, phone: e.target.value.replace(/\D/g, "").slice(0, 10)}))}
                />
              </div>
              {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
            </div>

            <div>
              <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Email</label>
              <input
                className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all"
                type="email"
                placeholder="ravi@example.com"
                value={form.email}
                onChange={e => setForm(v => ({ ...v, email: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Address</label>
              <input
                className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all"
                type="text"
                placeholder="12, MG Road, Bengaluru"
                value={form.address}
                onChange={e => setForm(v => ({ ...v, address: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Pincode</label>
                <input
                  className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm text-foreground font-mono focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all"
                  type="text"
                  placeholder="560001"
                  value={form.pincode}
                  onChange={e => setForm(v => ({ ...v, pincode: e.target.value.replace(/\D/g, "").slice(0, 6) }))}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Gender</label>
                <div className="flex bg-card border border-border rounded-xl p-1 h-[46px]">
                  <button
                    type="button"
                    onClick={() => setForm(v => ({ ...v, gender: "M" }))}
                    className={`flex-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${form.gender === "M" ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:bg-accent"}`}
                  >
                    M
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm(v => ({ ...v, gender: "F" }))}
                    className={`flex-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${form.gender === "F" ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:bg-accent"}`}
                  >
                    F
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">GST Number</label>
              <input
                className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm text-foreground font-mono uppercase focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all"
                type="text"
                placeholder="29AADCB2230M1ZP"
                value={form.gstNumber}
                onChange={e => setForm(v => ({ ...v, gstNumber: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-6">
            <button type="button" className="flex-1 px-6 py-3.5 rounded-xl text-xs font-black text-foreground uppercase tracking-widest border border-border hover:bg-accent transition-all" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3.5 rounded-xl text-xs font-black text-white uppercase tracking-widest bg-primary hover:opacity-90 shadow-lg shadow-primary/20 transition-all"
            >
              Add Customer
            </button>
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

  // Reset page on filter change
  useEffect(() => {
    setPage(1);
  }, [search, filterStatus, filterDebt, fromDate, toDate, sortBy]);

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
    queryKey: ["customers", search, filterStatus, filterDebt, fromDate, toDate, sortBy, page],
    queryFn: async () => {
      const params = { 
        search: search || undefined, 
        page, 
        limit: 20,
        status: filterStatus !== "all" ? filterStatus : undefined,
        withDebt: filterDebt || undefined,
        fromDate: fromDate ? fromDate.split("/").reverse().join("-") : undefined,
        toDate: toDate ? toDate.split("/").reverse().join("-") : undefined,
        sortBy
      };
      const response = await apiClient.getCustomers(params);
      return response;
    }
  });

  const { data: settings } = useQuery({ queryKey: ["settings"], queryFn: apiClient.getSettings });

  const displayCustomers = customersRes?.data || [];
  const pagination = customersRes?.pagination || { page: 1, pages: 1 };

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
          <h1 className="text-2xl font-black text-foreground tracking-tight">Customers</h1>
          <p className="text-sm text-muted-foreground mt-1 font-medium">Manage your customer accounts & credit relations</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4" /> Add Customer
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Total Customers</p>
          <p className="text-2xl font-black text-foreground mt-1">{customersRes?.summary?.total || 0}</p>
        </div>
        <div className="card p-4">
          <p className="text-[10px] text-emerald-500 uppercase font-black tracking-widest">Active</p>
          <p className="text-2xl font-black text-foreground mt-1">{customersRes?.summary?.active || 0}</p>
        </div>
        <div className="card p-4">
          <p className="text-[10px] text-destructive uppercase font-black tracking-widest">With Debt</p>
          <p className="text-2xl font-black text-foreground mt-1">{customersRes?.summary?.withDebt || 0}</p>
        </div>
        <div className="card p-4">
          <p className="text-[10px] text-primary uppercase font-black tracking-widest">Total Outstanding</p>
          <p className="text-2xl font-black text-foreground mt-1">{formatINR(customersRes?.summary?.totalOutstanding || 0)}</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-wrap md:flex-nowrap gap-3 items-center overflow-x-auto pb-1 no-scrollbar">
        <div className="relative shrink-0 w-60 h-11">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
          <input
            className="input pl-9 h-full"
            placeholder="Search customers..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <select 
          className="input w-auto shrink-0 min-w-[120px] h-11"
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>

        <select 
          className="input w-auto shrink-0 min-w-[140px] h-11"
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
          className={`shrink-0 px-4 h-11 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${
            filterDebt 
              ? "bg-destructive/10 border-destructive text-destructive shadow-lg shadow-destructive/10" 
              : "bg-card border-border text-muted-foreground hover:border-border/80"
          }`}
        >
          With Debt
        </button>

        <div className="flex items-center gap-3 bg-card border border-border rounded-xl px-4 h-11 shadow-sm shrink-0">
          <div className="flex items-center gap-2 cursor-default">
            <div className="relative">
              <Calendar 
                className="w-3.5 h-3.5 text-foreground cursor-pointer hover:text-primary transition-colors" 
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
            <span className="text-[10px] font-black text-foreground uppercase tracking-widest w-10 shrink-0 select-none pt-0.5">FROM</span>
            <div className="relative flex-1 flex items-center h-full cursor-text" onClick={() => fromTextRef.current?.focus()}>
              {/* Ghost Suggestion Layer */}
              {!fromDate && <span className="absolute inset-0 text-[11px] font-black text-muted-foreground/60 pointer-events-none flex items-center h-full uppercase tracking-tighter">DD/MM/YYYY</span>}
              {fromDate && fromDate.length < 10 && (
                <span className="absolute inset-0 text-[11px] font-black pointer-events-none flex items-center h-full uppercase tracking-tighter">
                  <span className="opacity-0">{fromDate}</span>
                  <span className="text-muted-foreground/30">{"DD/MM/YYYY".slice(fromDate.length)}</span>
                </span>
              )}
              <input 
                ref={fromTextRef}
                type="text" 
                className="relative z-10 text-[11px] font-black text-foreground focus:outline-none bg-transparent w-full h-full py-1 uppercase tracking-tighter" 
                style={{ caretColor: "var(--primary)" }}
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
                className="w-4 h-4 text-primary cursor-pointer hover:opacity-80 transition-opacity" 
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
            <span className="text-[10px] font-black text-foreground uppercase tracking-widest w-8 shrink-0 text-center select-none pt-0.5">TO</span>
            <div className="relative flex-1 flex items-center h-full cursor-text" onClick={() => toTextRef.current?.focus()}>
              {/* Ghost Suggestion Layer */}
              {!toDate && <span className="absolute inset-0 text-[11px] font-black text-muted-foreground/60 pointer-events-none flex items-center h-full uppercase tracking-tighter">DD/MM/YYYY</span>}
              {toDate && toDate.length < 10 && (
                <span className="absolute inset-0 text-[11px] font-black pointer-events-none flex items-center h-full uppercase tracking-tighter">
                  <span className="opacity-0">{toDate}</span>
                  <span className="text-muted-foreground/30">{"DD/MM/YYYY".slice(toDate.length)}</span>
                </span>
              )}
              <input 
                ref={toTextRef}
                type="text" 
                className="relative z-10 text-[11px] font-black text-foreground focus:outline-none bg-transparent w-full h-full py-1 uppercase tracking-tighter" 
                style={{ caretColor: "var(--primary)" }}
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
        <p className="text-center py-10 text-muted-foreground/50">Loading customers…</p>
      ) : displayCustomers.length === 0 ? (
        <div className="card flex flex-col items-center py-16 gap-3">
          <Users className="w-12 h-12 text-muted-foreground/10" />
          <p className="text-muted-foreground/50 font-bold uppercase tracking-widest text-[10px]">No customers match your filters.</p>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-accent/30">
              <tr className="text-left text-[10px] text-muted-foreground uppercase font-black tracking-widest">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">GST</th>
                <th className="px-4 py-3 font-medium text-right">Total Billed</th>
                <th className="px-4 py-3 font-medium text-right">Outstanding</th>
                <th className="px-4 py-3 font-medium">Joined</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {displayCustomers.map(c => (
                <tr
                  key={c.id}
                  className="hover:bg-accent/50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/customers/${c.id}`)}
                >
                  <td className="px-4 py-3 font-black text-foreground">{c.name}</td>
                  <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                    {maskPhone(c.phone, settings?.maskPhoneNumbers)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{c.gstNumber || "—"}</td>
                  <td className="px-4 py-3 text-right font-medium">{formatINR(c.totalBilled)}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={c.outstandingBalance > 0 ? "text-destructive font-semibold" : "text-muted-foreground/40"}>
                      {formatINR(c.outstandingBalance)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(c.createdAt)}</td>
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
        <div className="mt-8 flex flex-col md:flex-row items-center justify-between gap-6 border-t border-border pt-8 pb-4">
          <div className="flex flex-col gap-1">
            <p className="text-sm text-muted-foreground font-medium">
              Showing Page <span className="text-foreground font-bold">{pagination.page}</span> of <span className="text-foreground font-bold">{pagination.pages}</span>
            </p>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
              Total {pagination.total} Customers
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Page Number Buttons */}
            <div className="flex items-center gap-1 bg-accent p-1 rounded-xl border border-border">
              {Array.from({ length: pagination.pages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === pagination.pages || (p >= page - 1 && p <= page + 1))
                .map((p, i, arr) => (
                  <div key={p} className="flex items-center">
                    {i > 0 && arr[i-1] !== p - 1 && <span className="text-muted-foreground font-bold px-2">...</span>}
                    <button
                      onClick={() => { setPage(p); window.scrollTo(0, 0); }}
                      className={`w-9 h-9 rounded-lg text-sm font-bold transition-all duration-200 ${
                        page === p 
                          ? "bg-primary text-white shadow-lg shadow-primary/20 scale-105" 
                          : "text-muted-foreground hover:bg-card hover:text-primary hover:shadow-sm"
                      }`}
                    >
                      {p}
                    </button>
                  </div>
                ))}
            </div>

            {/* Jump to Page */}
            <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-3 py-1.5 shadow-sm group focus-within:border-primary transition-colors">
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-tighter">Go to</span>
              <input 
                type="number" 
                min="1" 
                max={pagination.pages}
                placeholder={page}
                className="w-10 bg-transparent text-sm font-bold text-foreground focus:outline-none text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const val = parseInt(e.target.value);
                    if (val >= 1 && val <= pagination.pages) {
                       setPage(val);
                       window.scrollTo(0, 0);
                       e.target.value = "";
                       e.target.blur();
                    }
                  }
                }}
              />
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setPage(p => Math.max(1, p - 1)); window.scrollTo(0, 0); }}
                disabled={page === 1}
                className="h-10 px-4 rounded-xl bg-card border border-border text-foreground font-bold text-xs uppercase tracking-widest hover:bg-accent hover:border-border disabled:opacity-30 disabled:pointer-events-none transition-all shadow-sm active:scale-95"
              >
                Prev
              </button>
              <button
                onClick={() => { setPage(p => Math.min(pagination.pages, p + 1)); window.scrollTo(0, 0); }}
                disabled={page === pagination.pages}
                className="h-10 px-4 rounded-xl bg-card border border-border text-foreground font-bold text-xs uppercase tracking-widest hover:bg-accent hover:border-border disabled:opacity-30 disabled:pointer-events-none transition-all shadow-sm active:scale-95"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { apiClient, formatINR, formatDate } from "@/lib/api";
import { ArrowLeft, Printer } from "lucide-react";
import { generateInvoicePDF } from "@/lib/invoicePDF";

export default function BillDetail() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const qc = useQueryClient();
  const [payMode, setPayMode] = useState("upi");

  const { data: bill, isLoading } = useQuery({
    queryKey: ["bill", id],
    queryFn: () => apiClient.getBill(id),
  });

  const updateMutation = useMutation({
    mutationFn: (data) => apiClient.updateBill(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bill", id] });
      qc.invalidateQueries({ queryKey: ["bills"] });
      qc.invalidateQueries({ queryKey: ["customers"] });
    },
  });

  if (isLoading) return <p className="text-center py-20 text-gray-400">Loading…</p>;
  if (!bill) return <p className="text-center py-20 text-red-500">Bill not found.</p>;

  const statusBadge = (s) => {
    const map = { paid: "badge-green", unpaid: "badge-red", partial: "badge-yellow", draft: "badge-gray" };
    return <span className={`badge ${map[s] || "badge-gray"} text-sm px-3 py-1`}>{s === "partial" ? "Partial Paid" : s}</span>;
  };

  return (
    <div className="max-w-3xl space-y-5">
      <div className="flex items-center gap-3">
        <button className="btn btn-ghost p-2" onClick={() => navigate("/bills")}><ArrowLeft className="w-4 h-4" /></button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{bill.billNumber}</h1>
          <p className="text-sm text-gray-500">
            {bill.customerName?.toLowerCase().includes("walk-in") 
              ? `Walk-in #${bill.billCode || "N/A"}` 
              : (bill.customerName || "Walk-in")
            } · {formatDate(bill.createdAt)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {statusBadge(bill.status)}
          {(bill.status === "unpaid" || bill.status === "partial") && (
            <button
              className="btn btn-primary bg-green-600 hover:bg-green-700"
              onClick={() => updateMutation.mutate({ status: "paid" })}
              disabled={updateMutation.isPending}
            >Mark as Paid</button>
          )}
          <button
            className="btn btn-outline gap-2"
            onClick={() => generateInvoicePDF(bill, { autoPrint: true })}
          >
            <Printer className="w-4 h-4" /> Print
          </button>
        </div>
      </div>

      {/* Bill Header */}
      <div className="card p-6">
        <div className="flex justify-between mb-6">
          <div>
            <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold mb-2">VB</div>
            <p className="font-bold text-lg text-gray-900">VyaparBook Store</p>
            <p className="text-sm text-gray-500">10, Brigade Road, Bengaluru</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900">{bill.billNumber}</p>
            <p className="text-sm text-gray-500 mt-1">Date: {formatDate(bill.createdAt)}</p>
            {bill.dueDate && (bill.status === "unpaid" || bill.status === "partial") && (
              <p className="text-sm text-gray-500">Due: {formatDate(bill.dueDate)}</p>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <p className="text-xs text-gray-500 uppercase font-medium mb-1">Bill To</p>
            <p className="font-semibold text-gray-900">
              {bill.customerName?.toLowerCase().includes("walk-in") 
                ? `Walk-in #${bill.billCode || "N/A"}` 
                : (bill.customerName || "Walk-in")
              }
            </p>
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr className="text-left text-xs text-gray-500 uppercase">
              <th className="px-4 py-3">Item</th>
              <th className="px-4 py-3 text-right">Qty</th>
              <th className="px-4 py-3 text-right">Unit Price</th>
              <th className="px-4 py-3 text-right">Disc%</th>
              <th className="px-4 py-3 text-right">GST%</th>
              <th className="px-4 py-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {bill.items?.map(item => (
              <tr key={item.id}>
                <td className="px-4 py-3 font-medium">{item.itemName}</td>
                <td className="px-4 py-3 text-right">{item.quantity}</td>
                <td className="px-4 py-3 text-right">{formatINR(item.unitPrice)}</td>
                <td className="px-4 py-3 text-right">{item.discount}%</td>
                <td className="px-4 py-3 text-right">{item.taxRate}%</td>
                <td className="px-4 py-3 text-right font-semibold">{formatINR(item.subtotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="border-t px-4 py-4 flex justify-end">
          <div className="w-60 space-y-2 text-sm">
            <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>{formatINR(bill.subtotal)}</span></div>
            <div className="flex justify-between text-green-600"><span>Discount</span><span>-{formatINR(bill.discountAmount)}</span></div>
            <div className="flex justify-between text-gray-600"><span>GST</span><span>+{formatINR(bill.taxAmount)}</span></div>
            <div className="flex justify-between font-bold text-base text-gray-900 border-t pt-2">
              <span>Total</span><span>{formatINR(bill.totalAmount)}</span>
            </div>
            <div className="flex justify-between text-emerald-600"><span>Paid</span><span>{formatINR(bill.paidAmount || 0)}</span></div>
            {Number(bill.totalAmount || 0) - Number(bill.paidAmount || 0) > 0 && (
              <div className="flex justify-between text-red-600 font-semibold"><span>Balance Due</span><span>{formatINR(Number(bill.totalAmount || 0) - Number(bill.paidAmount || 0))}</span></div>
            )}
          </div>
        </div>

        {bill.notes && (
          <div className="border-t px-4 py-3 bg-gray-50">
            <p className="text-xs text-gray-500">Notes: {bill.notes}</p>
          </div>
        )}
      </div>

      {/* Payment Hub */}
      {(bill.status === "unpaid" || bill.status === "partial") && (
        <div className="card p-6 bg-gradient-to-br from-white to-slate-50 border-blue-100 shadow-xl shadow-blue-600/5 mt-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-slate-900 text-lg">Payment Methods</h3>
              <p className="text-xs text-slate-500 font-medium">Select a method to complete the transaction</p>
            </div>
            <div className="flex p-1 bg-slate-100 rounded-xl">
              <button 
                onClick={() => setPayMode("upi")}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${payMode === "upi" ? "bg-[#0061FF] text-white shadow-lg shadow-blue-600/20" : "text-slate-500 hover:text-slate-900"}`}
              >UPI</button>
              <button 
                onClick={() => setPayMode("bank")}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${payMode === "bank" ? "bg-[#0061FF] text-white shadow-lg shadow-blue-600/20" : "text-slate-500 hover:text-slate-900"}`}
              >Bank Transfer</button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-8">
            {payMode === "upi" ? (
              <>
                <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm relative group overflow-hidden shrink-0">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=upi://pay?pa=vyaparbook@okicici&pn=VyaparBook&am=${Number(bill.totalAmount) - Number(bill.paidAmount || 0)}&cu=INR`} 
                    alt="UPI QR Code"
                    className="w-32 h-32 relative z-10"
                  />
                </div>
                <div className="flex-1 text-center md:text-left">
                  <p className="text-sm font-bold text-slate-900 mb-1">Scan to Pay via UPI</p>
                  <p className="text-xs text-slate-500 mb-4">Scan QR with any app like GPay, PhonePe, or Paytm</p>
                  <div className="bg-white px-4 py-2.5 rounded-xl border border-slate-100 inline-flex items-center gap-2 group cursor-pointer hover:border-blue-200 transition-all shadow-sm">
                    <span className="text-sm font-bold text-slate-700">vyaparbook@okicici</span>
                    <div className="w-px h-3 bg-slate-200" />
                    <span className="text-[10px] font-bold text-[#0061FF] uppercase tracking-wider group-hover:underline">Copy ID</span>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                  <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Account Number</p>
                    <p className="text-lg font-black text-slate-900 tracking-tight">918273645510</p>
                  </div>
                  <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">IFSC Code</p>
                    <p className="text-lg font-black text-slate-900 tracking-tight uppercase">VYAP0001234</p>
                  </div>
                </div>
                <div className="shrink-0">
                  <button 
                    className="btn btn-primary h-14 px-8 shadow-xl shadow-blue-600/20"
                    onClick={() => window.open('https://www.onlinesbi.sbi/', '_blank')}
                  >
                    Go to Bank
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

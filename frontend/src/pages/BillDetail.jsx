import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { apiClient, formatINR, formatDate } from "@/lib/api";
import { ArrowLeft, Printer } from "lucide-react";

export default function BillDetail() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const qc = useQueryClient();

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
    const map = { paid: "badge-green", unpaid: "badge-red", draft: "badge-yellow", cancelled: "badge-gray" };
    return <span className={`badge ${map[s] || "badge-gray"} text-sm px-3 py-1`}>{s}</span>;
  };

  return (
    <div className="max-w-3xl space-y-5">
      <div className="flex items-center gap-3">
        <button className="btn-ghost p-2" onClick={() => navigate("/bills")}><ArrowLeft className="w-4 h-4" /></button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{bill.billNumber}</h1>
          <p className="text-sm text-gray-500">{bill.customerName} · {formatDate(bill.createdAt)}</p>
        </div>
        <div className="flex items-center gap-2">
          {statusBadge(bill.status)}
          {bill.status === "unpaid" && (
            <button
              className="btn-primary bg-green-600 hover:bg-green-700"
              onClick={() => updateMutation.mutate({ status: "paid" })}
              disabled={updateMutation.isPending}
            >Mark as Paid</button>
          )}
          <button className="btn-outline gap-2" onClick={() => window.print()}>
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
            {bill.dueDate && <p className="text-sm text-gray-500">Due: {formatDate(bill.dueDate)}</p>}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <p className="text-xs text-gray-500 uppercase font-medium mb-1">Bill To</p>
            <p className="font-semibold text-gray-900">{bill.customerName}</p>
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
          </div>
        </div>

        {bill.notes && (
          <div className="border-t px-4 py-3 bg-gray-50">
            <p className="text-xs text-gray-500">Notes: {bill.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}

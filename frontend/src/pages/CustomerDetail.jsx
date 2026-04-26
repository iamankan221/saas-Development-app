import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { apiClient, formatINR, formatDate } from "@/lib/api";
import { ArrowLeft, FileText, IndianRupee } from "lucide-react";

export default function CustomerDetail() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const qc = useQueryClient();

  const { data: customer, isLoading } = useQuery({
    queryKey: ["customer", id],
    queryFn: () => apiClient.getCustomer(id),
  });
  const { data: bills = [] } = useQuery({
    queryKey: ["bills", { customerId: id }],
    queryFn: async () => {
      const response = await apiClient.getBills({ customerId: id });
      return response.data || response.bills || response || [];
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data) => apiClient.updateCustomer(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["customer", id] }),
  });

  if (isLoading) return <p className="text-center py-20 text-gray-400">Loading…</p>;
  if (!customer) return <p className="text-center py-20 text-red-500">Customer not found.</p>;

  const outstanding = Number(customer.totalBilled || 0) - Number(customer.totalPaid || 0);

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <button className="btn-ghost p-2" onClick={() => navigate("/customers")}>
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{customer.name}</h1>
          <p className="text-sm text-gray-500">{customer.phone} {customer.email ? `· ${customer.email}` : ""}</p>
        </div>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { label: "Total Billed", value: formatINR(customer.totalBilled), color: "text-gray-900" },
          { label: "Total Paid", value: formatINR(customer.totalPaid), color: "text-emerald-600" },
          { label: "Outstanding", value: formatINR(outstanding), color: outstanding > 0 ? "text-red-600" : "text-gray-400" },
        ].map(c => (
          <div key={c.label} className="card p-4">
            <p className="text-xs text-gray-500 mb-1">{c.label}</p>
            <p className={`text-xl font-bold ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Details */}
      <div className="card p-5">
        <h2 className="font-semibold text-gray-900 mb-4">Customer Details</h2>
        <dl className="grid grid-cols-2 gap-4 text-sm">
          {[
            { label: "Address", value: customer.address },
            { label: "GST Number", value: customer.gstNumber },
            { label: "PAN Number", value: customer.panNumber },
            { label: "Credit Limit", value: customer.creditLimit ? formatINR(customer.creditLimit) : "Not set" },
            { label: "Joined", value: formatDate(customer.createdAt) },
          ].map(({ label, value }) => (
            <div key={label}>
              <dt className="text-gray-500 text-xs font-medium uppercase tracking-wide">{label}</dt>
              <dd className="mt-0.5 font-medium text-gray-900">{value || "—"}</dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Bills */}
      <div className="card p-5">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-600" /> Bills ({bills.length})
        </h2>
        {bills.length === 0 ? (
          <p className="text-sm text-gray-400">No bills yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b">
              <tr className="text-left text-xs text-gray-500">
                <th className="pb-2">Bill #</th>
                <th className="pb-2">Date</th>
                <th className="pb-2">Status</th>
                <th className="pb-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {bills.map(b => (
                <tr key={b.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/bills/${b.id}`)}>
                  <td className="py-2.5 font-medium text-blue-600">{b.billNumber}</td>
                  <td className="py-2.5 text-gray-500">{formatDate(b.createdAt)}</td>
                  <td className="py-2.5">
                    <span className={`badge ${b.status === "paid" ? "badge-green" : b.status === "unpaid" ? "badge-red" : "badge-gray"}`}>
                      {b.status}
                    </span>
                  </td>
                  <td className="py-2.5 text-right font-semibold">{formatINR(b.totalAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

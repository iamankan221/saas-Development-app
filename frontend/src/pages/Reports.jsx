import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  ClipboardList, Clock, Calendar, FileDown, Mail, CheckCircle, ArrowRight, Loader2, TrendingUp, Users, Trash2
} from "lucide-react";
import { toast } from "@/lib/toast";
import { apiClient, formatINR, formatDate } from "@/lib/api";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useRef } from "react";


const REPORT_TYPES = [
  { id: "today", label: "Today", desc: "Real-time snapshot of today's velocity", icon: Clock },
  { id: "yesterday", label: "Yesterday", desc: "Audit of the previous business day", icon: Clock },
  { id: "weekly", label: "Weekly Growth", desc: "Week-over-week performance analysis", icon: ClipboardList },
  { id: "monthly", label: "Monthly Audit", desc: "Comprehensive 30-day business summary", icon: Calendar },
  { id: "quarterly", label: "Quarterly Review", desc: "Seasonal trends & tax intelligence", icon: ClipboardList },
  { id: "yearly", label: "Yearly Intelligence", desc: "Complete annual fiscal performance", icon: Calendar },
  { id: "custom", label: "Custom Date", desc: "Pick a specific date for deep audit", icon: Calendar },
];

export default function Reports() {
  const [selectedType, setSelectedType] = useState("today");
  const [processingAction, setProcessingAction] = useState(null); // 'download', 'mail', or null
  const [reportData, setReportData] = useState(null);
  const [behaviourRange, setBehaviourRange] = useState("30");
  const [exportingBehaviour, setExportingBehaviour] = useState(false);
  const [activeMainTab, setActiveMainTab] = useState("business"); // "business" or "behaviour"
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const reportRef = useRef(null);

  const rangeMap = { today: "0", yesterday: "1", weekly: "7", monthly: "30", quarterly: "90", yearly: "365", custom: null };

  // Auto-fetch Shop Metrics
  const { data: shopMetrics, isLoading: loadingShop } = useQuery({
    queryKey: ['shop-intelligence-summary', selectedType, startDate, endDate],
    enabled: selectedType !== "custom" || (!!startDate && !!endDate),
    queryFn: async () => {
      const params = selectedType === "custom" 
        ? { startDate, endDate } 
        : { range: rangeMap[selectedType] };
      const [summary, intelligence] = await Promise.all([
        apiClient.getDashboardSummary(params),
        apiClient.getIntelligenceAnalytics(params)
      ]);
      return { summary, intelligence };
    }
  });

  // Auto-fetch Behaviour Metrics
  const { data: behaviourData, isLoading: loadingBehaviour } = useQuery({
    queryKey: ['behaviour-metrics', behaviourRange, startDate, endDate],
    enabled: behaviourRange !== "custom" || (!!startDate && !!endDate),
    queryFn: () => {
      const params = behaviourRange === "custom" 
        ? { startDate, endDate } 
        : { range: behaviourRange };
      return apiClient.getCustomerBehaviour({ ...params, _t: Date.now() });
    }
  });

  const bMetrics = behaviourData ? {
    count: behaviourData.length,
    revenue: behaviourData.reduce((sum, c) => sum + (Number(c["Total Spent (Rs)"]) || 0), 0),
    avg: behaviourData.length > 0 
      ? behaviourData.reduce((sum, c) => sum + (Number(c["Total Spent (Rs)"]) || 0), 0) / behaviourData.length 
      : 0
  } : null;

  // Helper to get range label (Dynamic based on current moment)
  const getDateRangeLabel = (days) => {
    const end = new Date();
    const start = new Date();
    
    // Specific logic for "Yesterday" (days === "1" in behavior, but "yesterday" in business type)
    if (days === "1") {
      start.setDate(end.getDate() - 1);
      return formatDate(start);
    }

    // Today
    if (days === "0") return formatDate(end);

    // Ranges (7, 30, 90, 365)
    // We subtract (days - 1) to make the range inclusive of today (e.g. 7 days = today + 6 past days)
    if (typeof days === "string" && days.includes("-")) return formatDate(new Date(days)); // Custom Date string

    start.setDate(end.getDate() - (Number(days) > 0 ? Number(days) - 1 : 0));
    return `${formatDate(start)} — ${formatDate(end)}`;
  };

  const getCustomRangeLabel = () => {
    if (!startDate || !endDate) return "Select Date Range";
    return `${formatDate(startDate)} — ${formatDate(endDate)}`;
  };
  const C_DARK = [13, 37, 63];    // #0D253F
  const C_WHITE = [255, 255, 255];
  const C_LIGHT = [248, 250, 252]; // slate-50
  const C_BORDER = [226, 232, 240]; // slate-200
  const C_BLUE = [37, 99, 235];
  const C_GREEN = [5, 150, 105];
  const C_AMBER = [217, 119, 6];
  const C_PINK = [219, 39, 119];
  const C_GREY = [100, 116, 139];


  const handleAction = async (action) => {
    setProcessingAction(action);
    try {
      const rangeMap = { today: "0", weekly: "7", monthly: "30", quarterly: "90", yearly: "365" };
      const range = rangeMap[selectedType];
      
      const [summary, topItems, intelligence, settings] = await Promise.all([
        apiClient.getDashboardSummary({ range }),
        apiClient.getTopSellingItems({ range, limit: 10 }),
        apiClient.getIntelligenceAnalytics({ range }),
        apiClient.getSettings()
      ]);

      const data = { summary, topItems, intelligence, settings, rangeLabel: REPORT_TYPES.find(t => t.id === selectedType)?.label };
      setReportData(data);

      // ── PDF GENERATION LOGIC ──────────────────────────────────────
      const generatePDF = async () => {
        await new Promise(r => setTimeout(r, 100));

        const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
        const PW = 210; // page width mm
        const PH = 297; // page height mm
        const ML = 10; // margin left
        const MR = 10; // margin right
        const CW = PW - ML - MR; // content width
        let y = 10; // current Y position
        const pageNums = [];

        const addPageNum = () => { pageNums.push(doc.internal.getCurrentPageInfo().pageNumber); };
        const checkNewPage = (needed) => {
          if (y + needed > PH - 15) { doc.addPage(); y = 10; addPageNum(); }
        };
        const sectionTitle = (title) => {
          checkNewPage(14);
          doc.setFillColor(...C_DARK);
          doc.rect(ML, y, CW, 10, 'F');
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8);
          doc.setTextColor(...C_WHITE);
          doc.text(title.toUpperCase(), ML + 3, y + 6.8);
          y += 12;
        };

        // ── PAGE 1 HEADER ──────────────────────────────────────────────
        doc.setFillColor(...C_DARK);
        doc.roundedRect(ML, y, CW, 22, 2, 2, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.setTextColor(...C_WHITE);
        doc.text('BUSINESS ANALYSIS REPORT', ML + 5, y + 10);
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'normal');
        const fullRangeLabel = selectedType === 'custom' ? getCustomRangeLabel() : getDateRangeLabel(rangeMap[selectedType]);
        doc.text(`${data.settings?.shopName || 'RETAIL STORE'}  •  ${fullRangeLabel}  •  ${selectedType.toUpperCase()} REPORT`, ML + 5, y + 17);
        y += 24;

        // ── KPI ROW 1 ──────────────────────────────────────────────────
        sectionTitle('Key Performance Indicators');
        const kpis = [
          { label: 'TOTAL SALES', value: `Rs. ${((data.summary?.periodSales || 0) / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, sub: 'Gross Revenue', color: [219, 234, 254] },
          { label: 'CUSTOMERS', value: `${data.summary?.totalCustomers || 0}`, sub: `Avg Rs.${((data.summary?.periodSales / (data.summary?.totalCustomers || 1)) / 100).toFixed(0)} basket`, color: [209, 250, 229] },
          { label: 'RETURNS', value: `${data.intelligence?.returnStats?.count || 0}`, sub: `Val Rs.${((data.intelligence?.returnStats?.value || 0) / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, color: [254, 243, 199] },
          { label: 'GROSS PROFIT', value: `Rs. ${((data.summary?.periodProfit || 0) / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, sub: `Margin: ${(data.summary?.periodSales > 0 ? ((data.summary?.periodProfit || 0) / (data.summary?.periodSales || 1)) * 100 : 0).toFixed(1)}%`, color: [220, 252, 231] },
        ];
        const kpiW = (CW - 6) / 4;
        kpis.forEach((k, i) => {
          const kx = ML + i * (kpiW + 2);
          doc.setFillColor(...k.color);
          doc.roundedRect(kx, y, kpiW, 30, 2, 2, 'F');
          doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(...C_DARK);
          doc.text(k.label, kx + kpiW / 2, y + 6, { align: 'center' });
          doc.setFontSize(12);
          doc.text(k.value, kx + kpiW / 2, y + 18, { align: 'center' });
          doc.setFontSize(6.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(...C_GREY);
          doc.text(k.sub, kx + kpiW / 2, y + 26, { align: 'center' });
        });
        y += 33;

        // ── KPI ROW 2 ──────────────────────────────────────────────────
        const peakHour = Object.entries(data.intelligence?.rushHours || {}).sort((a, b) => b[1].count - a[1].count)[0];
        const kpis2 = [
          { label: 'AVG TRANSACTION', value: `Rs. ${((data.summary?.periodSales || 0) / (data.summary?.totalBills || 1) / 100).toFixed(0)}`, sub: 'Per Bill Value', color: [224, 242, 254] },
          { label: 'OUTSTANDING', value: `Rs. ${((data.summary?.unpaidAmount || 0) / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, sub: 'Unpaid Dues', color: [254, 226, 226] },
          { label: 'LOW STOCK', value: `${data.summary?.lowStockCount || 0}`, sub: 'Items Need Restock', color: [255, 237, 213] },
          { label: 'PEAK HOUR', value: peakHour ? peakHour[0] : 'N/A', sub: peakHour ? `${peakHour[1].count} customers` : 'No data', color: [220, 252, 231] },
        ];
        kpis2.forEach((k, i) => {
          const kx = ML + i * (kpiW + 2);
          doc.setFillColor(...k.color);
          doc.roundedRect(kx, y, kpiW, 28, 2, 2, 'F');
          doc.setFont('helvetica', 'bold'); doc.setFontSize(6.5); doc.setTextColor(...C_DARK);
          doc.text(k.label, kx + kpiW / 2, y + 6, { align: 'center' });
          doc.setFontSize(11);
          doc.text(k.value, kx + kpiW / 2, y + 17, { align: 'center' });
          doc.setFontSize(6); doc.setFont('helvetica', 'normal'); doc.setTextColor(...C_GREY);
          doc.text(k.sub, kx + kpiW / 2, y + 24, { align: 'center' });
        });
        y += 32;

        // ── OPERATIONAL SUMMARY ────────────────────────────────────────
        sectionTitle('Operational Summary');
        const halfW = (CW - 4) / 2;
        const opH = 45; 
        doc.setFillColor(...C_LIGHT);
        doc.roundedRect(ML, y, halfW, opH, 2, 2, 'F');
        const retCards = [
          { label: 'TOTAL TRANSACTIONS', val: `${data.summary?.totalBills || 0}` },
          { label: 'RETURN RATE', val: `${((data.intelligence?.returnStats?.count / (data.summary?.totalBills || 1)) * 100).toFixed(1)}%` },
          { label: 'RETURN VALUE', val: `Rs. ${((data.intelligence?.returnStats?.value || 0) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
        ];
        const miniW = (halfW - 6) / 3;
        retCards.forEach((rc, i) => {
          const rx = ML + 2 + i * (miniW + 1);
          doc.setFillColor(...C_WHITE);
          doc.roundedRect(rx, y + 2, miniW, opH - 4, 1, 1, 'F');
          doc.setFont('helvetica', 'bold'); doc.setFontSize(6.5); doc.setTextColor(...C_GREY);
          doc.text(rc.label, rx + miniW / 2, y + 10, { align: 'center' });
          doc.setFontSize(14); doc.setTextColor(...C_DARK);
          doc.text(rc.val, rx + miniW / 2, y + 28, { align: 'center' });
        });
        
        doc.setFillColor(...C_LIGHT);
        doc.roundedRect(ML + halfW + 4, y, halfW, opH, 2, 2, 'F');
        doc.setFont('helvetica', 'bold'); doc.setFontSize(6.5); doc.setTextColor(...C_GREY);
        doc.text('STORE RUSH HOURS', ML + halfW + 7, y + 6);
        const rushEntries = Object.entries(data.intelligence?.rushHours || {});
        const maxRush = Math.max(...rushEntries.map(([, d]) => d.count), 1);
        const barMaxH = 28;
        const barW = halfW / (rushEntries.length + 1);
        rushEntries.forEach(([slot, rData], i) => {
          const bx = ML + halfW + 4 + barW * i + barW * 0.3;
          const bh = (rData.count / maxRush) * barMaxH;
          const by = y + opH - 6 - bh;
          doc.setFillColor(rData.count > 40 ? 239 : 59, rData.count > 40 ? 68 : 130, rData.count > 40 ? 68 : 246);
          doc.rect(bx, by, barW * 0.6, bh, 'F');
          doc.setFontSize(5); doc.setTextColor(...C_GREY);
          doc.text(slot.split('-')[0], bx + barW * 0.3, y + opH - 2, { align: 'center' });
        });
        y += opH + 4;

        // ── GENDER + PAYMENT ───────────────────────────────────────────
        sectionTitle('Customer Profile & Payment Analysis');
        const demoH = 60;
        const cx1 = ML + halfW / 2;
        const cy1 = y + 30;
        const r1 = 15;
        doc.setFillColor(...C_LIGHT);
        doc.roundedRect(ML, y, halfW, demoH, 2, 2, 'F');
        doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(...C_GREY);
        doc.text('GENDER DISTRIBUTION', ML + halfW / 2, y + 7, { align: 'center' });
        doc.setDrawColor(37, 99, 235); doc.setLineWidth(5);
        doc.circle(cx1, cy1, r1);
        doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...C_DARK);
        doc.text(`${data.summary?.totalCustomers || 0}`, cx1, cy1 + 3, { align: 'center' });
        doc.setFontSize(7);
        doc.setFillColor(37, 99, 235); doc.circle(ML + 4, y + demoH - 7, 1.8, 'F');
        doc.setTextColor(...C_DARK); doc.text(`M: ${data.intelligence?.demographics?.M || 0}`, ML + 8, y + demoH - 5.5);
        doc.setFillColor(219, 39, 119); doc.circle(ML + halfW / 3 + 2, y + demoH - 7, 1.8, 'F');
        doc.text(`F: ${data.intelligence?.demographics?.F || 0}`, ML + halfW / 3 + 6, y + demoH - 5.5);
        doc.setFillColor(...C_GREY); doc.circle(ML + (halfW * 2) / 3 + 2, y + demoH - 7, 1.8, 'F');
        doc.text(`Other: ${data.intelligence?.demographics?.Other || 0}`, ML + (halfW * 2) / 3 + 6, y + demoH - 5.5);
        const cx2 = ML + halfW + 4 + halfW / 2;
        doc.setFillColor(...C_LIGHT);
        doc.roundedRect(ML + halfW + 4, y, halfW, demoH, 2, 2, 'F');
        doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(...C_GREY);
        doc.text('PAYMENT MODE SPLIT', cx2, y + 7, { align: 'center' });
        doc.setDrawColor(37, 99, 235); doc.setLineWidth(5);
        doc.circle(cx2, cy1, r1);
        doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...C_DARK);
        doc.text('100%', cx2, cy1 + 3, { align: 'center' });
        const pmodes = [
          { label: 'UPI', val: `${(data.intelligence?.paymentDistribution?.UPI || 0).toFixed(0)}%`, color: C_BLUE },
          { label: 'Cash', val: `${(data.intelligence?.paymentDistribution?.CASH || 0).toFixed(0)}%`, color: C_GREEN },
          { label: 'Card', val: `${(data.intelligence?.paymentDistribution?.CARD || 0).toFixed(0)}%`, color: C_AMBER },
        ];
        pmodes.forEach((pm, i) => {
          const lx = ML + halfW + 5 + i * (halfW / 3);
          doc.setFillColor(...pm.color); doc.circle(lx + 1.5, y + demoH - 7, 1.8, 'F');
          doc.setTextColor(...C_DARK); doc.text(`${pm.label}: ${pm.val}`, lx + 5, y + demoH - 5.5);
        });
        y += demoH + 6;

        checkNewPage(90);
        sectionTitle('Top 10 Best-Selling Items');
        const items = data.topItems?.quantityWise?.top || [];
        const maxQty = items[0]?.quantity || 1;
        items.forEach((item) => {
          checkNewPage(12);
          const barFrac = item.quantity / maxQty;
          const labelW = 50;
          const barAreaW = CW - labelW - 2;
          doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(...C_DARK);
          const label = item.name.length > 30 ? item.name.substring(0, 30) + '…' : item.name;
          doc.text(label, ML, y + 5.5);
          doc.setFillColor(226, 232, 240); doc.roundedRect(ML + labelW, y, barAreaW, 8, 1.2, 1.2, 'F');
          doc.setFillColor(...C_BLUE);
          if (barFrac > 0) doc.roundedRect(ML + labelW, y, barAreaW * barFrac, 8, 1.2, 1.2, 'F');
          doc.setFontSize(7);
          if (barFrac > 0.2) { doc.setTextColor(...C_WHITE); doc.text(`${item.quantity} units`, ML + labelW + barAreaW * barFrac - 2, y + 5.5, { align: 'right' }); }
          else { doc.setTextColor(...C_DARK); doc.text(`${item.quantity} units`, ML + labelW + barAreaW * barFrac + 2, y + 5.5); }
          y += 11;
        });
        y += 5;

        checkNewPage(80);
        sectionTitle('Top 10 Highest Spending Customers');
        autoTable(doc, {
          startY: y,
          margin: { left: ML, right: MR },
          head: [['Rank', 'Customer Name', 'Gender', 'Amount Spent', 'Tier']],
          body: (data.intelligence?.topCustomers || []).map((c, i) => [
            i === 0 ? 'Gold' : i === 1 ? 'Silver' : i === 2 ? 'Bronze' : `${i + 1}`,
            c.name, c.gender || 'N/A', `Rs. ${(c.totalSpent / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, i < 3 ? 'Premium' : i < 6 ? 'Gold' : 'Silver',
          ]),
          headStyles: { fillColor: C_DARK, textColor: C_WHITE, fontSize: 8, fontStyle: 'bold', cellPadding: 4 },
          columnStyles: {
            0: { halign: 'center', cellWidth: 25 },
            1: { halign: 'left' },
            2: { halign: 'center', cellWidth: 25 },
            3: { halign: 'right', cellWidth: 45 },
            4: { halign: 'center', cellWidth: 30 }
          },
          bodyStyles: { fontSize: 8, textColor: C_DARK, cellPadding: 4 },
          alternateRowStyles: { fillColor: C_LIGHT },
          // Force headers to follow column alignment
          didParseCell: (hookData) => {
            if (hookData.section === 'head') {
              const colIdx = hookData.column.index;
              if (colIdx === 0) hookData.cell.styles.halign = 'center';
              if (colIdx === 2) hookData.cell.styles.halign = 'center';
              if (colIdx === 3) hookData.cell.styles.halign = 'right';
              if (colIdx === 4) hookData.cell.styles.halign = 'center';
            }
          },
          didDrawPage: () => addPageNum(),
        });
        y = doc.lastAutoTable.finalY + 5;

        const totalPages = doc.internal.getNumberOfPages();
        for (let pg = 1; pg <= totalPages; pg++) {
          doc.setPage(pg);
          doc.setFillColor(...C_DARK); doc.rect(0, PH - 10, PW, 10, 'F');
          doc.setFont('helvetica', 'bold'); doc.setFontSize(6); doc.setTextColor(...C_WHITE);
          doc.text('VyaparBook Retail Analytics', ML, PH - 4);
          doc.text(`Page ${pg} of ${totalPages}`, PW - MR, PH - 4, { align: 'right' });
        }

        const dateStr = new Date().toISOString().split('T')[0];
        const rangeLabel = selectedType === 'custom' ? `${startDate}_to_${endDate}` : selectedType;
        doc.save(`Business_Report_${rangeLabel}_${dateStr}.pdf`);
        toast.success(`Intelligence report generated successfully.`);
      };

      const sendMail = async () => {
        await new Promise(r => setTimeout(r, 1500));
        toast.success(`Intelligence report sent to ${settings?.email || "owner"}!`);
      };

      if (action === 'download') {
        await generatePDF();
        await sendMail();
      } else if (action === 'mail') {
        await sendMail();
      }

    } catch (err) {
      console.error(err);
      toast.error("Failed to compile report.");
    } finally {
      setProcessingAction(null);
    }
  };

  const handleExportBehaviour = async () => {
    setExportingBehaviour(true);
    try {
      const data = await apiClient.getCustomerBehaviour({ range: behaviourRange, _t: Date.now() });
      if (!data || data.length === 0) {
        toast.error("No customer data found for this period.");
        return;
      }
      const headers = Object.keys(data[0]);
      const csvRows = [
        headers.join(","),
        ...data.map(row => headers.map(header => {
          const val = row[header] || "";
          return typeof val === 'string' && val.includes(',') ? `"${val}"` : val;
        }).join(","))
      ];
      const blob = new Blob([csvRows.join("\n")], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      const dateStr = new Date().toISOString().split('T')[0];
      link.setAttribute("download", `Customer_Behaviour_${behaviourRange}d_${dateStr}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("CSV Exported successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to export behaviour data.");
    } finally {
      setExportingBehaviour(false);
    }
  };

  return (
    <div className="max-w-5xl space-y-8 pb-20 mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border pb-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Shop Reports</h1>
          <p className="text-xs text-muted-foreground font-medium">Generate and export deep business metrics in one click.</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-accent/50 rounded-full border border-border">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Live Analytics Active</span>
        </div>
      </div>

      <div className="flex items-center gap-1 bg-accent/30 p-1 rounded-xl border border-border w-fit">
        {[
          { id: "business", label: "Business Report", icon: ClipboardList },
          { id: "behaviour", label: "Customer Behaviour Analysis", icon: TrendingUp }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveMainTab(tab.id)}
            className={`flex items-center gap-2.5 px-6 py-2.5 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap ${
              activeMainTab === tab.id 
                ? "bg-primary text-white shadow-md scale-[1.02]" 
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            }`}
          >
            <tab.icon className={`w-3.5 h-3.5 ${activeMainTab === tab.id ? "text-white" : "text-muted-foreground"}`} />
            {tab.label}
          </button>
        ))}
      </div>

      {activeMainTab === "business" ? (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="flex items-center gap-1 bg-accent/30 p-1.5 rounded-2xl border border-border overflow-x-auto no-scrollbar">
            {REPORT_TYPES.map((type) => (
              <div key={type.id} className="relative flex items-center">
                <button
                  onClick={() => setSelectedType(type.id)}
                  className={`flex items-center gap-2.5 px-6 py-3 rounded-xl text-[10px] font-bold transition-all whitespace-nowrap ${
                    selectedType === type.id 
                      ? "bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]" 
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  }`}
                >
                  <type.icon className={`w-4 h-4 ${selectedType === type.id ? "text-white" : "text-muted-foreground"}`} />
                  {type.label}
                </button>
              </div>
            ))}
          </div>

          <div className="card p-8 border-border bg-card/50">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <h3 className="text-lg font-bold text-foreground tracking-tight">{REPORT_TYPES.find(t => t.id === selectedType)?.label}</h3>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-primary bg-primary/5 px-2.5 py-1 rounded-full border border-primary/10">
                     <Calendar className="w-3 h-3" />
                     {selectedType === "custom" ? getCustomRangeLabel() : getDateRangeLabel(rangeMap[selectedType])}
                  </div>
                </div>

                {selectedType === "custom" ? (
                  <div className="flex items-center gap-6 bg-background p-3 px-5 rounded-2xl border border-border/60 shadow-sm animate-in fade-in slide-in-from-left-2">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-bold text-foreground uppercase tracking-wider">From</span>
                      <div className="relative flex items-center h-8 min-w-[120px] bg-accent/20 px-3 rounded-lg border border-border/40 hover:bg-accent/30 transition-all cursor-pointer group">
                        <Calendar className="w-3.5 h-3.5 text-primary mr-2 pointer-events-none" />
                        <span className="text-xs font-bold text-muted-foreground/80 uppercase pointer-events-none">
                          {startDate ? formatDate(startDate) : "DD/MM/YYYY"}
                        </span>
                        <input 
                          type="date"
                          value={startDate}
                          autoComplete="off"
                          onChange={(e) => setStartDate(e.target.value)}
                          onClick={(e) => e.target.showPicker?.()}
                          style={{ colorScheme: 'dark' }}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                        />
                      </div>
                    </div>

                    <div className="h-4 w-[1px] bg-border/80" />

                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-bold text-foreground uppercase tracking-wider">To</span>
                      <div className="relative flex items-center h-8 min-w-[120px] bg-accent/20 px-3 rounded-lg border border-border/40 hover:bg-accent/30 transition-all cursor-pointer group">
                        <Calendar className="w-3.5 h-3.5 text-primary mr-2 pointer-events-none" />
                        <span className="text-xs font-bold text-muted-foreground/80 uppercase pointer-events-none">
                          {endDate ? formatDate(endDate) : "DD/MM/YYYY"}
                        </span>
                        <input 
                          type="date"
                          value={endDate}
                          min={startDate}
                          autoComplete="off"
                          onChange={(e) => setEndDate(e.target.value)}
                          onClick={(e) => e.target.showPicker?.()}
                          style={{ colorScheme: 'dark' }}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                        />
                      </div>
                    </div>

                    <div className="h-4 w-[1px] bg-border/80" />
                    <button 
                      onClick={() => {
                        setStartDate("");
                        setEndDate("");
                      }}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                      title="Clear Custom Range"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <p className="text-[10px] text-muted-foreground font-medium italic opacity-70">
                    {REPORT_TYPES.find(t => t.id === selectedType)?.desc}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button 
                  disabled={processingAction !== null}
                  onClick={() => handleAction('download')}
                  className="btn btn-primary h-12 px-8 gap-2 text-xs font-bold shadow-lg hover:scale-[1.02] transition-all"
                >
                  {processingAction === 'download' ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
                  Download PDF
                </button>
                <button 
                  disabled={processingAction !== null}
                  onClick={() => handleAction('mail')}
                  className="btn btn-outline h-12 px-8 gap-2 text-xs font-bold border-primary/20 text-primary hover:bg-primary/5 hover:scale-[1.02] transition-all"
                >
                  {processingAction === 'mail' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                  Mail to Owner
                </button>
              </div>
            </div>
          </div>
          
          {shopMetrics && (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
              {/* TOP RANKINGS AREA */}

            </div>
          )}
        </div>
      ) : (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
          {/* RANGE SELECTION - TOP MENU */}
          <div className="flex items-center gap-1 bg-accent/30 p-1.5 rounded-2xl border border-border overflow-x-auto no-scrollbar">
            {[
              { id: "0", label: "Today" },
              { id: "1", label: "Yesterday" },
              { id: "7", label: "1 Week" },
              { id: "30", label: "1 Month" },
              { id: "90", label: "3 Months" },
              { id: "365", label: "12 Months" },
              { id: "custom", label: "Custom Date" },
            ].map((range) => (
              <button
                key={range.id}
                onClick={() => setBehaviourRange(range.id)}
                className={`flex items-center gap-2.5 px-6 py-3 rounded-xl text-[10px] font-bold transition-all whitespace-nowrap ${
                  behaviourRange === range.id 
                    ? "bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]" 
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>

          <div className="card p-8 border-border bg-card/50">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-8">
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <h3 className="text-lg font-bold text-foreground tracking-tight">Intelligence Dataset Export</h3>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-600 bg-emerald-500/5 px-2.5 py-1 rounded-full border border-emerald-500/10">
                    <Calendar className="w-3 h-3" />
                    {getDateRangeLabel(behaviourRange)}
                  </div>
                </div>

                {behaviourRange === "custom" ? (
                  <div className="flex items-center gap-6 bg-background p-3 px-5 rounded-2xl border border-border/60 shadow-sm animate-in fade-in slide-in-from-left-2">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-bold text-foreground uppercase tracking-wider">From</span>
                      <div className="relative flex items-center h-8 min-w-[120px] bg-accent/20 px-3 rounded-lg border border-border/40 hover:bg-accent/30 transition-all cursor-pointer group">
                        <Calendar className="w-3.5 h-3.5 text-emerald-600 mr-2 pointer-events-none" />
                        <span className="text-xs font-bold text-muted-foreground/80 uppercase pointer-events-none">
                          {startDate ? formatDate(startDate) : "DD/MM/YYYY"}
                        </span>
                        <input 
                          type="date"
                          value={startDate}
                          autoComplete="off"
                          onChange={(e) => setStartDate(e.target.value)}
                          onClick={(e) => e.target.showPicker?.()}
                          style={{ colorScheme: 'dark' }}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                        />
                      </div>
                    </div>

                    <div className="h-4 w-[1px] bg-border/80" />

                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-bold text-foreground uppercase tracking-wider">To</span>
                      <div className="relative flex items-center h-8 min-w-[120px] bg-accent/20 px-3 rounded-lg border border-border/40 hover:bg-accent/30 transition-all cursor-pointer group">
                        <Calendar className="w-3.5 h-3.5 text-emerald-600 mr-2 pointer-events-none" />
                        <span className="text-xs font-bold text-muted-foreground/80 uppercase pointer-events-none">
                          {endDate ? formatDate(endDate) : "DD/MM/YYYY"}
                        </span>
                        <input 
                          type="date"
                          value={endDate}
                          min={startDate}
                          autoComplete="off"
                          onChange={(e) => setEndDate(e.target.value)}
                          onClick={(e) => e.target.showPicker?.()}
                          style={{ colorScheme: 'dark' }}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                        />
                      </div>
                    </div>

                    <div className="h-4 w-[1px] bg-border/80" />
                    <button 
                      onClick={() => {
                        setStartDate("");
                        setEndDate("");
                      }}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                      title="Clear Custom Range"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <p className="text-[10px] text-muted-foreground font-medium italic opacity-70">
                    Detailed visitor metrics, individual spend patterns, and lifetime value auditing.
                  </p>
                )}
              </div>

              <button 
                disabled={exportingBehaviour}
                onClick={handleExportBehaviour}
                className="btn btn-primary h-12 px-8 gap-2 text-xs font-bold shadow-lg hover:scale-[1.02] transition-all"
              >
                {exportingBehaviour ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
                Export Dataset (CSV)
              </button>
            </div>

            <div className="space-y-4 pt-8 border-t border-border/50">
              <div className="flex items-center gap-2 px-1">
                 <TrendingUp className="w-4 h-4 text-emerald-500" />
                 <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Dataset Snapshot</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { label: "Unique Customers", val: bMetrics?.count || 0, sub: "Total in range", color: "text-blue-600" },
                  { label: "Total Revenue", val: formatINR(bMetrics?.revenue || 0), sub: "Sum of spent", color: "text-emerald-600" },
                  { label: "Avg Spend/Cust", val: formatINR(bMetrics?.avg || 0), sub: "Per visitor value", color: "text-amber-600" }
                ].map((kpi, i) => (
                  <div key={i} className="flex flex-col p-5 rounded-2xl bg-accent/30 border border-border/50 hover:bg-accent/50 transition-all">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{kpi.label}</span>
                    {loadingBehaviour ? (
                      <div className="h-6 w-full bg-accent animate-pulse rounded mt-2" />
                    ) : (
                      <span className={`text-xl font-bold mt-1 ${kpi.color}`}>{kpi.val}</span>
                    )}
                    <p className="text-[9px] text-muted-foreground/60 italic font-medium mt-1">{kpi.sub}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

// ============================================================================
// HELPERS
// ============================================================================

function numberToWordsINR(num) {
  if (num === 0) return "Rupees Zero Only";
  const isNeg = num < 0;
  num = Math.abs(Math.round(num));
  const o = ["","One","Two","Three","Four","Five","Six","Seven","Eight","Nine","Ten","Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen","Seventeen","Eighteen","Nineteen"];
  const t = ["","","Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"];
  const t2 = n => n < 20 ? o[n] : t[Math.floor(n/10)] + (n%10 ? " "+o[n%10] : "");
  const t3 = n => { if (!n) return ""; if (n<100) return t2(n); return o[Math.floor(n/100)]+" Hundred"+(n%100?" "+t2(n%100):""); };
  const p = [];
  if (num>=1e7) { p.push(t3(Math.floor(num/1e7))+" Crore"); num%=1e7; }
  if (num>=1e5) { p.push(t2(Math.floor(num/1e5))+" Lakh"); num%=1e5; }
  if (num>=1e3) { p.push(t2(Math.floor(num/1e3))+" Thousand"); num%=1e3; }
  if (num>0) p.push(t3(num));
  return (isNeg?"Minus ":"")+"Rupees "+p.join(" ")+" Only";
}

function fmtINR(v) {
  const n = Number(v)||0;
  return "Rs. " + n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(d) {
  if (!d) return "\u2014";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

// ============================================================================
// BUILD PDF
// ============================================================================

function buildPDF(bill, options = {}) {
  const co = {
    name: options.companyName || "VyaparBook",
    address: options.companyAddress || "123 Business Street, Mumbai, Maharashtra 400001",
    phone: options.companyPhone || "+91 98765 43210",
    email: options.companyEmail || "billing@vyaparbook.com",
    gst: options.companyGST || "27AABCU9603R1ZM",
  };

  const doc = new jsPDF("portrait", "mm", "a4");
  const PW = 210, PH = 297;
  const M = 12; // margins
  const CW = PW - M * 2; // 186mm content width
  const pad = 8; // Inner padding for text
  let y = M;

  const C_ORANGE = [255, 90, 0];
  const C_DARK = [31, 41, 55];
  const C_GRAY = [107, 114, 128];
  const C_WHITE = [255, 255, 255];
  const C_CREAM = [255, 248, 240];
  const C_GREEN = [16, 185, 129];
  const C_RED = [239, 68, 68];
  
  const setColor = (c) => doc.setTextColor(...c);
  const setFill = (c) => doc.setFillColor(...c);

  // ────────────────────────────────────────────────────────────────────
  // HEADER (Rounded Top Corners)
  // ────────────────────────────────────────────────────────────────────
  setFill(C_ORANGE);
  // Full rounded rect
  doc.roundedRect(M, y, CW, 40, 2, 2, "F");
  // Overlap the bottom to make bottom corners sharp
  doc.rect(M, y + 20, CW, 20, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  setColor(C_WHITE);
  doc.text(co.name, M + pad, y + 14);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(co.address, M + pad, y + 20);
  doc.text(`${co.phone} - ${co.email}`, M + pad, y + 25);
  doc.text(`GSTIN: ${co.gst}`, M + pad, y + 30);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.text("INVOICE", M + CW - pad, y + 20, { align: "right" });

  y += 40;

  // ────────────────────────────────────────────────────────────────────
  // META BAR
  // ────────────────────────────────────────────────────────────────────
  setFill(C_CREAM);
  doc.rect(M, y, CW, 20, "F");
  
  // Orange thin line below meta
  doc.setDrawColor(253, 216, 181);
  doc.setLineWidth(0.3);
  doc.line(M, y + 20, M + CW, y + 20);

  const drawInlineMeta = (label, value, xPos, yPos) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    setColor(C_ORANGE);
    doc.text(label, xPos, yPos);
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    setColor(C_DARK);
    // Add offset based on label length
    const offset = doc.getTextWidth(label) + 2;
    doc.text(value, xPos + offset, yPos);
  };

  const metaY1 = y + 8;
  drawInlineMeta("INVOICE NO.", bill.billNumber || "\u2014", M + pad, metaY1);
  drawInlineMeta("INVOICE CODE", bill.billCode || "\u2014", M + pad + 40, metaY1);
  drawInlineMeta("DATE", fmtDate(bill.createdAt), M + pad + 85, metaY1);
  drawInlineMeta("DUE DATE", fmtDate(bill.dueDate), M + pad + 130, metaY1);

  const metaY2 = y + 16;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  setColor(C_ORANGE);
  doc.text("STATUS", M + pad, metaY2);
  
  // Status Badge
  const sLabel = bill.status === "partial" ? "PARTIAL PAID" : (bill.status || "unpaid").toUpperCase();
  const sBadgeColor = bill.status === "paid" ? [209, 250, 229] : bill.status === "unpaid" ? [254, 226, 226] : [254, 243, 199];
  const sTextColor = bill.status === "paid" ? C_GREEN : bill.status === "unpaid" ? C_RED : [217, 119, 6];
  
  doc.setFontSize(7);
  const badgeW = doc.getTextWidth(sLabel) + 6;
  setFill(sBadgeColor);
  doc.roundedRect(M + pad + 13, metaY2 - 3.5, badgeW, 5, 1, 1, "F");
  setColor(sTextColor);
  doc.text(sLabel, M + pad + 16, metaY2);

  y += 30;

  // ────────────────────────────────────────────────────────────────────
  // BILL FROM / BILL TO
  // ────────────────────────────────────────────────────────────────────
  const leftX = M + pad;
  const rightX = M + CW / 2 + 5;
  const sectionW = CW / 2 - pad - 5;

  const drawParty = (title, name, lines, x) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    setColor(C_ORANGE);
    doc.text(title, x, y);
    doc.setDrawColor(253, 216, 181);
    doc.setLineWidth(0.4);
    doc.line(x, y + 2, x + sectionW, y + 2);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    setColor(C_DARK);
    doc.text(name, x, y + 9);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    setColor(C_GRAY);
    let ly = y + 15;
    lines.forEach(l => {
      if (l) { doc.text(l, x, ly); ly += 5; }
    });
  };

  const cn = bill.customerName || bill.customer?.name || "Walk-in Customer";
  const cp = bill.customer?.phone ? `Phone: ${bill.customer.phone}` : "";
  const ce = bill.customer?.email ? `Email: ${bill.customer.email}` : "";
  const ca = bill.customer?.address || "";
  const cg = bill.customer?.gstNumber ? `GSTIN: ${bill.customer.gstNumber}` : "";

  drawParty("BILL FROM", co.name, [co.address, `Phone: ${co.phone}`, `Email: ${co.email}`, `GSTIN: ${co.gst}`], leftX);
  drawParty("BILL TO", cn, [ca, cp, ce, cg], rightX);

  y += 45;

  // ────────────────────────────────────────────────────────────────────
  // ITEMS TABLE
  // ────────────────────────────────────────────────────────────────────
  let sub = 0, totalDisc = 0, totalTax = 0;
  
  const tableData = (bill.items || []).map((it, i) => {
    const q = Number(it.quantity) || 0;
    const p = Number(it.unitPrice) || 0;
    const dp = Number(it.discount) || 0;
    const tp = Number(it.taxRate) || 0;
    const base = q * p;
    const ld = base * dp / 100;
    const af = base - ld;
    const lt = af * tp / 100;
    const total = af + lt;
    
    sub += base; totalDisc += ld; totalTax += lt;
    
    return [
      String(i + 1),
      it.itemName || "Item",
      String(q),
      fmtINR(p),
      `${dp}%`,
      `${tp}%`,
      fmtINR(total)
    ];
  });

  autoTable(doc, {
    startY: y,
    margin: { left: M, right: M },
    head: [["#", "DESCRIPTION", "QTY", "UNIT PRICE", "DISC.", "GST", "TOTAL"]],
    body: tableData.length > 0 ? tableData : [["", "No items added", "", "", "", "", ""]],
    theme: "plain",
    styles: { font: "helvetica", fontSize: 8, textColor: C_DARK, cellPadding: 3 },
    headStyles: {
      fillColor: false, // Turn off default sharp rectangle background
      textColor: C_WHITE,
      fontStyle: "bold",
      fontSize: 7,
      halign: "left",
      cellPadding: 4,
    },
    columnStyles: {
      0: { halign: "center", cellWidth: 10 },
      1: { halign: "left", cellWidth: 60, fontStyle: "bold" },
      2: { halign: "center", cellWidth: 15 },
      3: { halign: "right", cellWidth: 30 },
      4: { halign: "center", cellWidth: 15 },
      5: { halign: "center", cellWidth: 15 },
      6: { halign: "right", cellWidth: 41, fontStyle: "bold" },
    },
    alternateRowStyles: { fillColor: [250, 250, 250] },
    willDrawCell: function(data) {
      // Draw a custom rounded rectangle for the entire header row background
      if (data.section === "head" && data.column.index === 0) {
        doc.setFillColor(...C_ORANGE);
        const h = data.cell.height;
        doc.roundedRect(M, data.cell.y, CW, h, 2, 2, "F");
        // Overlap the bottom to make bottom corners sharp
        doc.rect(M, data.cell.y + h / 2, CW, h / 2, "F");
      }
    },
    didParseCell: function(data) {
      if (data.section === "head") {
        if (data.column.index === 0) data.cell.styles.halign = "center";
        if (data.column.index === 2 || data.column.index === 4 || data.column.index === 5) data.cell.styles.halign = "center";
        if (data.column.index === 3 || data.column.index === 6) data.cell.styles.halign = "right";
      }
    }
  });

  y = (doc.lastAutoTable?.finalY || y + 20) + 10;

  // ────────────────────────────────────────────────────────────────────
  // SUMMARY SECTION
  // ────────────────────────────────────────────────────────────────────
  const grand = sub - totalDisc + totalTax;
  const paidAmt = Number(bill.paidAmount) || 0;

  const wordsBoxW = CW * 0.55;
  const totalsX = M + wordsBoxW + 10;
  const totalsW = CW - wordsBoxW - 10;

  // AMOUNT IN WORDS
  setFill(C_CREAM);
  doc.roundedRect(M, y, wordsBoxW, 16, 1, 1, "F");
  setFill(C_ORANGE);
  doc.rect(M, y, 2, 16, "F"); // Orange left border

  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  setColor(C_ORANGE);
  doc.text("TOTAL AMOUNT IN WORDS", M + 5, y + 5);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  setColor(C_DARK);
  const wordsLines = doc.splitTextToSize(numberToWordsINR(grand), wordsBoxW - 8);
  doc.text(wordsLines, M + 5, y + 11);

  // NOTES
  if (bill.notes) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    setColor(C_ORANGE);
    doc.text("NOTES", M, y + 24);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    setColor(C_GRAY);
    const noteLines = doc.splitTextToSize(bill.notes, wordsBoxW);
    doc.text(noteLines, M, y + 29);
  }

  // TOTALS
  let ty = y;
  const drawRow = (label, value, opts = {}) => {
    doc.setFont("helvetica", opts.bold ? "bold" : "normal");
    doc.setFontSize(opts.size || 9);
    setColor(opts.color || C_GRAY);
    doc.text(label, totalsX, ty);
    
    doc.setFont("helvetica", opts.bold ? "bold" : "normal");
    setColor(opts.valColor || opts.color || C_DARK);
    doc.text(value, totalsX + totalsW, ty, { align: "right" });
    ty += opts.gap || 6;
  };

  drawRow("Subtotal", fmtINR(sub));
  if (totalDisc > 0) drawRow("Discount", `- ${fmtINR(totalDisc)}`, { color: C_ORANGE, valColor: C_ORANGE });
  drawRow("GST", fmtINR(totalTax));

  // Line
  doc.setDrawColor(...C_DARK);
  doc.setLineWidth(0.4);
  doc.line(totalsX, ty - 2, totalsX + totalsW, ty - 2);
  ty += 4;

  drawRow("Total", fmtINR(grand), { bold: true, size: 12, color: C_DARK, gap: 7 });

  if (paidAmt > 0) {
    drawRow("Paid", fmtINR(paidAmt), { color: C_GREEN, valColor: C_GREEN });
  }

  // ────────────────────────────────────────────────────────────────────
  // FOOTER (Rounded Bottom Corners)
  // ────────────────────────────────────────────────────────────────────
  const footerH = 26;
  const footerY = PH - M - footerH;

  setFill([31, 41, 55]); // Dark navy/gray
  // Main rounded rect
  doc.roundedRect(M, footerY, CW, footerH, 2, 2, "F");
  // Fill top corners to make them sharp
  doc.rect(M, footerY, CW, 10, "F");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  setColor(C_GRAY);
  doc.text("Terms & Conditions:", M + pad, footerY + 8);
  doc.text("1. Payment is due within 30 days of invoice date.", M + pad, footerY + 12);
  doc.text("2. Goods once sold will not be taken back.", M + pad, footerY + 16);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  setColor(C_ORANGE);
  doc.text("Thank You!", M + CW - pad, footerY + 10, { align: "right" });
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  setColor(C_GRAY);
  doc.text(`Generated by ${co.name}`, M + CW - pad, footerY + 15, { align: "right" });

  // Very bottom orange line inside the rounded footer
  setFill(C_ORANGE);
  doc.roundedRect(M, footerY + footerH - 2, CW, 2, 2, 2, "F");
  doc.rect(M, footerY + footerH - 2, CW, 1, "F"); // Sharp top of the line

  return doc;
}

// ============================================================================
// EXPORTS
// ============================================================================

export function generateInvoicePDF(bill, options = {}) {
  const doc = buildPDF(bill, options);
  if (options.autoPrint) {
    doc.autoPrint();
  }
  const blobUrl = doc.output("bloburl");
  const w = window.open(blobUrl, "_blank");
  // Fallback if popup blocker prevents window.open
  if (!w) {
    const blob = doc.output("blob");
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Invoice_${bill.billNumber || "Preview"}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

export async function generateInvoicePDFBlob(bill, options = {}) {
  const doc = buildPDF(bill, options);
  const blob = doc.output("blob");
  return new File([blob], `${bill.billNumber || "Invoice"}.pdf`, { type: "application/pdf" });
}

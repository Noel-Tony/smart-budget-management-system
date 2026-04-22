// ─── CSV Export ──────────────────────────────────────────────────────────────
export const exportCSV = (transactions, filename = 'transactions.csv') => {
  const headers = ['Date', 'Type', 'Category', 'Description', 'Amount (INR)'];
  const rows = transactions.map(t => [
    new Date(t.date).toLocaleDateString('en-IN'),
    t.type,
    t.category,
    t.description || '',
    t.amount
  ]);

  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href     = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

// ─── PDF Export using jsPDF ───────────────────────────────────────────────────
export const exportPDF = async (data, user) => {
  const { jsPDF } = await import('jspdf');
  const autoTable  = (await import('jspdf-autotable')).default;

  const {
    transactions = [],
    overview     = {},
    currentMonth = {},
    categoryBreakdown = [],
    statistics   = {},
    regression   = {},
  } = data;

  const now       = new Date();
  const monthName = now.toLocaleString('default', { month: 'long', year: 'numeric' });
  const fmt       = n => `Rs.${Number(n || 0).toLocaleString('en-IN')}`;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W   = doc.internal.pageSize.getWidth();

  // ── Header bar ──────────────────────────────────────────────────────────────
  doc.setFillColor(26, 26, 46);
  doc.rect(0, 0, W, 28, 'F');

  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('BudgetWise', 14, 12);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(180, 180, 200);
  doc.text('Student Budget Management System', 14, 19);
  doc.text(`Generated: ${now.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}`, W - 14, 19, { align: 'right' });

  // ── Title ────────────────────────────────────────────────────────────────────
  doc.setFontSize(14);
  doc.setTextColor(15, 15, 15);
  doc.setFont('helvetica', 'bold');
  doc.text(`Financial Report — ${monthName}`, 14, 40);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(130, 130, 130);
  doc.text(`Account: ${user?.name}  |  ${user?.email}`, 14, 47);

  // ── Summary stat boxes ───────────────────────────────────────────────────────
  const stats = [
    { label: 'Total Income',    value: fmt(overview.totalIncome),   color: [22, 163, 74] },
    { label: 'Total Expense',   value: fmt(overview.totalExpense),  color: [220, 38, 38] },
    { label: 'Net Balance',     value: fmt(overview.balance),       color: [37, 99, 235] },
    { label: 'Month Expense',   value: fmt(currentMonth.expense),   color: [217, 119, 6] },
  ];

  const boxW = (W - 28 - 9) / 4;
  stats.forEach((s, i) => {
    const x = 14 + i * (boxW + 3);
    const y = 54;
    doc.setFillColor(248, 247, 244);
    doc.roundedRect(x, y, boxW, 22, 3, 3, 'F');
    doc.setFontSize(7);
    doc.setTextColor(...s.color);
    doc.setFont('helvetica', 'bold');
    doc.text(s.label.toUpperCase(), x + boxW / 2, y + 7, { align: 'center' });
    doc.setFontSize(11);
    doc.text(s.value, x + boxW / 2, y + 16, { align: 'center' });
  });

  let y = 86;

  // ── Category Breakdown table ─────────────────────────────────────────────────
  doc.setFontSize(11);
  doc.setTextColor(15, 15, 15);
  doc.setFont('helvetica', 'bold');
  doc.text('Category Breakdown (This Month)', 14, y);
  y += 4;

  autoTable(doc, {
    startY: y,
    head: [['Category', 'Amount (INR)', 'Transactions', '% of Total']],
    body: categoryBreakdown.map(c => {
      const pct = overview.totalExpense > 0 ? ((c.total / overview.totalExpense) * 100).toFixed(1) : '0.0';
      return [c._id, fmt(c.total), c.count, `${pct}%`];
    }),
    styles: { fontSize: 8.5, cellPadding: 4 },
    headStyles: { fillColor: [26, 26, 46], textColor: 255, fontStyle: 'bold', fontSize: 8 },
    alternateRowStyles: { fillColor: [250, 248, 245] },
    columnStyles: { 1: { halign: 'right' }, 2: { halign: 'center' }, 3: { halign: 'center' } },
    margin: { left: 14, right: 14 },
  });

  y = doc.lastAutoTable.finalY + 12;

  // ── Statistical Analysis ──────────────────────────────────────────────────────
  if (y > 240) { doc.addPage(); y = 20; }

  doc.setFontSize(11);
  doc.setTextColor(15, 15, 15);
  doc.setFont('helvetica', 'bold');
  doc.text('Statistical Analysis of Monthly Expenses', 14, y);
  y += 6;

  const statItems = [
    ['Mean (Average)',     fmt(statistics.mean)],
    ['Variance',          fmt(statistics.variance)],
    ['Standard Deviation',fmt(statistics.stdDev)],
    ['Minimum',           fmt(statistics.min)],
    ['Maximum',           fmt(statistics.max)],
    ['Months Tracked',    statistics.n || 0],
  ];

  autoTable(doc, {
    startY: y,
    head: [['Metric', 'Value']],
    body: statItems,
    styles: { fontSize: 8.5, cellPadding: 4 },
    headStyles: { fillColor: [61, 59, 255], textColor: 255, fontStyle: 'bold', fontSize: 8 },
    alternateRowStyles: { fillColor: [250, 248, 255] },
    columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } },
    tableWidth: 100,
    margin: { left: 14 },
  });

  y = doc.lastAutoTable.finalY + 10;

  // ── Linear Regression ─────────────────────────────────────────────────────────
  if (y > 240) { doc.addPage(); y = 20; }

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 15, 15);
  doc.text('Linear Regression — Spending Forecast', 14, y);
  y += 6;

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(61, 59, 255);
  doc.text(`Equation: y = ${regression.slope}x + ${regression.intercept}   |   R² = ${regression.rSquared}`, 14, y);
  y += 5;

  doc.setTextColor(100, 100, 100);
  const trend = regression.slope > 0
    ? `Spending is trending upward by ${fmt(regression.slope)} per month.`
    : 'Spending trend is stable or decreasing.';
  doc.text(trend, 14, y);
  y += 7;

  if (regression.predictions?.length) {
    autoTable(doc, {
      startY: y,
      head: [['Month', 'Predicted Expense']],
      body: regression.predictions.map(p => [p.month, fmt(p.predicted)]),
      styles: { fontSize: 8.5, cellPadding: 4 },
      headStyles: { fillColor: [108, 99, 255], textColor: 255, fontStyle: 'bold', fontSize: 8 },
      alternateRowStyles: { fillColor: [248, 247, 255] },
      columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } },
      tableWidth: 100,
      margin: { left: 14 },
    });
    y = doc.lastAutoTable.finalY + 12;
  }

  // ── Recent Transactions ───────────────────────────────────────────────────────
  if (transactions.length > 0) {
    if (y > 200) { doc.addPage(); y = 20; }

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 15, 15);
    doc.text('Recent Transactions (Last 30)', 14, y);
    y += 4;

    const recent = transactions.slice(0, 30);
    autoTable(doc, {
      startY: y,
      head: [['Date', 'Type', 'Category', 'Description', 'Amount']],
      body: recent.map(t => [
        new Date(t.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        t.type.toUpperCase(),
        t.category,
        t.description || '—',
        fmt(t.amount),
      ]),
      styles: { fontSize: 7.5, cellPadding: 3.5 },
      headStyles: { fillColor: [26, 26, 46], textColor: 255, fontStyle: 'bold', fontSize: 7.5 },
      alternateRowStyles: { fillColor: [250, 248, 245] },
      columnStyles: {
        1: { halign: 'center', fontStyle: 'bold' },
        4: { halign: 'right', fontStyle: 'bold' },
      },
      didDrawCell: (d) => {
        if (d.section === 'body' && d.column.index === 1) {
          const val = d.cell.raw;
          doc.setTextColor(val === 'INCOME' ? 22 : 220, val === 'INCOME' ? 163 : 38, val === 'INCOME' ? 74 : 38);
        }
      },
      margin: { left: 14, right: 14 },
    });
  }

  // ── Footer on every page ──────────────────────────────────────────────────────
  const pages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setTextColor(180, 180, 180);
    doc.setFont('helvetica', 'normal');
    doc.text('BudgetWise — Student Budget Management System', 14, 292);
    doc.text(`Page ${i} of ${pages}`, W - 14, 292, { align: 'right' });
  }

  doc.save(`BudgetWise_Report_${now.getFullYear()}_${String(now.getMonth()+1).padStart(2,'0')}.pdf`);
};

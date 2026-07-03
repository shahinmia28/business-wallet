import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

/**
 * expenses: [{id, reason, amount, date}]
 * incomes:  [{id, reason, selAmount, amount, date}]
 */
export async function generateBackupPDF({ expenses, incomes }) {
  const MONTHS = [
    'জানুয়ারি',
    'ফেব্রুয়ারি',
    'মার্চ',
    'এপ্রিল',
    'মে',
    'জুন',
    'জুলাই',
    'আগস্ট',
    'সেপ্টেম্বর',
    'অক্টোবর',
    'নভেম্বর',
    'ডিসেম্বর',
  ];

  const fmt = (n) =>
    '৳' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });

  // ── ডেটা বছর → মাস অনুযায়ী গ্রুপ করি ──────────────────────
  const yearMap = {}; // { 2024: { 0: { sales, income, expense, expenseByReason } } }

  for (const inc of incomes) {
    const d = new Date(inc.date);
    const y = d.getFullYear();
    const m = d.getMonth();
    if (!yearMap[y]) yearMap[y] = {};
    if (!yearMap[y][m])
      yearMap[y][m] = { sales: 0, income: 0, expense: 0, reasons: {} };
    yearMap[y][m].sales += Number(inc.selAmount || 0);
    yearMap[y][m].income += Number(inc.amount || 0);
  }

  for (const exp of expenses) {
    const d = new Date(exp.date);
    const y = d.getFullYear();
    const m = d.getMonth();
    if (!yearMap[y]) yearMap[y] = {};
    if (!yearMap[y][m])
      yearMap[y][m] = { sales: 0, income: 0, expense: 0, reasons: {} };
    yearMap[y][m].expense += Number(exp.amount || 0);
    const reason = (exp.reason || 'অন্যান্য').trim();
    yearMap[y][m].reasons[reason] =
      (yearMap[y][m].reasons[reason] || 0) + Number(exp.amount || 0);
  }

  const years = Object.keys(yearMap).sort((a, b) => b - a); // নতুন বছর আগে

  // ── প্রতিটা বছরের HTML page ──────────────────────────────────
  const yearPages = years.map((year) => {
    const months = yearMap[year];

    // বার্ষিক মোট
    let yearTotalSales = 0;
    let yearTotalIncome = 0;
    let yearTotalExpense = 0;

    const monthRows = MONTHS.map((mName, idx) => {
      const data = months[idx] || {
        sales: 0,
        income: 0,
        expense: 0,
        reasons: {},
      };
      yearTotalSales += data.sales;
      yearTotalIncome += data.income;
      yearTotalExpense += data.expense;

      // খাত ভিত্তিক ব্যয়
      const reasonRows = Object.entries(data.reasons)
        .sort((a, b) => b[1] - a[1])
        .map(
          ([r, amt]) =>
            `<div class="reason-row"><span class="reason-name">↳ ${r}</span><span class="reason-amt">${fmt(amt)}</span></div>`,
        )
        .join('');

      const hasData = data.sales > 0 || data.income > 0 || data.expense > 0;

      return `
        <tr class="${hasData ? '' : 'empty-row'}">
          <td class="month-name">${mName}</td>
          <td class="num teal">${data.sales > 0 ? fmt(data.sales) : '—'}</td>
          <td class="num green">${data.income > 0 ? fmt(data.income) : '—'}</td>
          <td class="num red">
            ${data.expense > 0 ? fmt(data.expense) : '—'}
            ${reasonRows ? `<div class="reasons">${reasonRows}</div>` : ''}
          </td>
          <td class="num ${data.income - data.expense >= 0 ? 'green' : 'red'}">
            ${hasData ? fmt(data.income - data.expense) : '—'}
          </td>
        </tr>`;
    }).join('');

    const yearBalance = yearTotalIncome - yearTotalExpense;

    return `
    <div class="year-page">
      <!-- Year Header -->
      <div class="year-header">
        <div class="year-title">📊 ${year} সালের বার্ষিক রিপোর্ট</div>
        <div class="year-summary">
          <div class="y-sum-box teal-bg">
            <div class="y-sum-val">${fmt(yearTotalSales)}</div>
            <div class="y-sum-lbl">মোট বিক্রয়</div>
          </div>
          <div class="y-sum-box green-bg">
            <div class="y-sum-val">${fmt(yearTotalIncome)}</div>
            <div class="y-sum-lbl">মোট আয়</div>
          </div>
          <div class="y-sum-box red-bg">
            <div class="y-sum-val">${fmt(yearTotalExpense)}</div>
            <div class="y-sum-lbl">মোট ব্যয়</div>
          </div>
          <div class="y-sum-box ${yearBalance >= 0 ? 'green-bg' : 'red-bg'}">
            <div class="y-sum-val">${fmt(yearBalance)}</div>
            <div class="y-sum-lbl">নিট লাভ/ক্ষতি</div>
          </div>
        </div>
      </div>

      <!-- Monthly Table -->
      <table>
        <thead>
          <tr>
            <th>মাস</th>
            <th>বিক্রয়</th>
            <th>আয়</th>
            <th>ব্যয় (খাতভিত্তিক)</th>
            <th>ব্যালেন্স</th>
          </tr>
        </thead>
        <tbody>
          ${monthRows}
        </tbody>
        <tfoot>
          <tr class="total-row">
            <td>বার্ষিক মোট</td>
            <td class="num teal">${fmt(yearTotalSales)}</td>
            <td class="num green">${fmt(yearTotalIncome)}</td>
            <td class="num red">${fmt(yearTotalExpense)}</td>
            <td class="num ${yearBalance >= 0 ? 'green' : 'red'}">${fmt(yearBalance)}</td>
          </tr>
        </tfoot>
      </table>

      <div class="page-footer">BusinessWallet — ${year} Annual Report • Generated: ${new Date().toLocaleDateString('en-GB')}</div>
    </div>`;
  });

  // ── সম্পূর্ণ HTML ──────────────────────────────────────────
  const html = `
<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="UTF-8"/>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; background: #f0f4f8; }

    .year-page {
      background: white;
      margin: 0;
      padding: 28px 24px 20px;
      page-break-after: always;
      min-height: 100vh;
    }
    .year-page:last-child { page-break-after: avoid; }

    /* Year Header */
    .year-header { margin-bottom: 20px; }
    .year-title {
      font-size: 20px;
      font-weight: 700;
      color: #1e3a5f;
      margin-bottom: 14px;
      padding-bottom: 8px;
      border-bottom: 3px solid #008080;
    }
    .year-summary {
      display: flex;
      gap: 10px;
      margin-bottom: 4px;
    }
    .y-sum-box {
      flex: 1;
      border-radius: 10px;
      padding: 12px 8px;
      text-align: center;
    }
    .y-sum-val { font-size: 14px; font-weight: 700; color: white; }
    .y-sum-lbl { font-size: 10px; color: rgba(255,255,255,0.85); margin-top: 3px; }
    .teal-bg  { background: #0d9488; }
    .green-bg { background: #16a34a; }
    .red-bg   { background: #dc2626; }

    /* Table */
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
    }
    thead tr { background: #1e3a5f; }
    thead th {
      color: white;
      padding: 9px 8px;
      text-align: left;
      font-weight: 600;
    }
    tbody tr { border-bottom: 1px solid #f0f0f0; }
    tbody tr:nth-child(even) { background: #f9fafb; }
    tbody tr.empty-row { opacity: 0.4; }
    td { padding: 8px; vertical-align: top; }
    .month-name { font-weight: 600; color: #374151; font-size: 13px; }
    .num { text-align: right; font-weight: 600; }
    .teal  { color: #0d9488; }
    .green { color: #16a34a; }
    .red   { color: #dc2626; }

    /* Expense reasons */
    .reasons { margin-top: 5px; }
    .reason-row {
      display: flex;
      justify-content: space-between;
      font-size: 10px;
      color: #666;
      padding: 1px 0;
    }
    .reason-name { color: #888; }
    .reason-amt  { font-weight: 600; color: #ef4444; }

    /* Footer row */
    tfoot .total-row {
      background: #1e3a5f;
      color: white;
    }
    tfoot .total-row td { padding: 10px 8px; font-weight: 700; font-size: 13px; }
    tfoot .total-row .teal  { color: #5eead4; }
    tfoot .total-row .green { color: #86efac; }
    tfoot .total-row .red   { color: #fca5a5; }

    /* Page footer */
    .page-footer {
      margin-top: 16px;
      text-align: center;
      font-size: 10px;
      color: #aaa;
    }
  </style>
</head>
<body>
  ${yearPages.length ? yearPages.join('') : '<div style="padding:40px;text-align:center;color:#888">কোনো ডেটা নেই</div>'}
</body>
</html>`;

  const { uri } = await Print.printToFileAsync({ html, base64: false });
  return uri;
}

export async function shareBackup(uri) {
  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) throw new Error('এই ডিভাইসে শেয়ার করা যাচ্ছে না');
  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    dialogTitle: 'বার্ষিক রিপোর্ট শেয়ার করুন',
    UTI: 'com.adobe.pdf',
  });
}

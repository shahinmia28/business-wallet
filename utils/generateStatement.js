import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

/**
 * type: 'supplier' | 'customer'
 * entity: supplier/customer object (name, phone, address, totalPurchase/totalSale, totalPayment, due)
 * transactions: array of transaction objects
 */
export async function generateStatement({ type, entity, transactions }) {
  const isSupplier = type === 'supplier';

  const primaryLabel = isSupplier ? 'মোট ক্রয়' : 'মোট বিক্রয়';
  const primaryKey = isSupplier ? 'purchase' : 'sale';
  const primaryTotal = isSupplier ? entity.totalPurchase : entity.totalSale;
  const txLabel = isSupplier ? 'ক্রয়' : 'বিক্রয়';
  const payLabel = isSupplier ? 'পেমেন্ট' : 'আদায়';
  const accentColor = isSupplier ? '#008080' : '#6366f1';

  const fmt = (n) =>
    '৳ ' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });

  const txRows = transactions
    .map(
      (tx) => `
      <tr>
        <td>${tx.date || ''}</td>
        <td>${tx.invoiceNo || '-'}</td>
        <td class="amount ${isSupplier ? 'red' : 'teal'}">${tx[primaryKey] > 0 ? fmt(tx[primaryKey]) : '-'}</td>
        <td class="amount purple">${tx.payment > 0 ? fmt(tx.payment) : '-'}</td>
        <td>${tx.description || '-'}</td>
      </tr>`,
    )
    .join('');

  const html = `
<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Statement</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Helvetica Neue', Arial, sans-serif;
      background: #f8f9fa;
      color: #222;
      padding: 30px;
    }

    /* Header */
    .header {
      background: ${accentColor};
      color: white;
      padding: 24px 28px;
      border-radius: 12px;
      margin-bottom: 24px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .header h1 { font-size: 22px; font-weight: 700; margin-bottom: 4px; }
    .header p  { font-size: 13px; opacity: 0.85; }
    .header .date { font-size: 12px; opacity: 0.75; text-align: right; }

    /* Info Card */
    .info-card {
      background: white;
      border-radius: 10px;
      padding: 18px 22px;
      margin-bottom: 20px;
      border: 1px solid #e5e7eb;
    }
    .info-card h2 { font-size: 16px; color: ${accentColor}; margin-bottom: 10px; }
    .info-row { display: flex; gap: 8px; font-size: 13px; color: #555; margin-bottom: 5px; }
    .info-row span:first-child { font-weight: 600; color: #333; min-width: 80px; }

    /* Summary */
    .summary {
      display: flex;
      gap: 14px;
      margin-bottom: 24px;
    }
    .sum-box {
      flex: 1;
      background: white;
      border-radius: 10px;
      padding: 14px;
      text-align: center;
      border: 1px solid #e5e7eb;
    }
    .sum-box .val { font-size: 15px; font-weight: 700; margin-bottom: 4px; }
    .sum-box .lbl { font-size: 11px; color: #888; }
    .sum-box.primary .val { color: ${isSupplier ? '#ef4444' : '#14b8a6'}; }
    .sum-box.payment .val { color: ${isSupplier ? '#14b8a6' : '#6366f1'}; }
    .sum-box.due     .val { color: #f59e0b; }

    /* Table */
    table {
      width: 100%;
      border-collapse: collapse;
      background: white;
      border-radius: 10px;
      overflow: hidden;
      border: 1px solid #e5e7eb;
      font-size: 12px;
    }
    thead { background: ${accentColor}; color: white; }
    thead th { padding: 10px 12px; text-align: left; font-weight: 600; }
    tbody tr:nth-child(even) { background: #f9fafb; }
    tbody td { padding: 9px 12px; border-bottom: 1px solid #f0f0f0; color: #444; }
    .amount { font-weight: 600; }
    .red    { color: #ef4444; }
    .teal   { color: #14b8a6; }
    .purple { color: #6366f1; }

    /* Footer */
    .footer {
      margin-top: 24px;
      text-align: center;
      font-size: 11px;
      color: #aaa;
    }
  </style>
</head>
<body>

  <!-- Header -->
  <div class="header">
    <div>
      <h1>${isSupplier ? 'সাপ্লায়ার স্টেটমেন্ট' : 'কাস্টমার স্টেটমেন্ট'}</h1>
      <p>${entity.name}</p>
      ${entity.phone ? `<p>📞 ${entity.phone}</p>` : ''}
      ${entity.address ? `<p>📍 ${entity.address}</p>` : ''}
    </div>
    <div class="date">
      তারিখ: ${new Date().toLocaleDateString('en-GB')}<br/>
      মোট লেনদেন: ${transactions.length} টি
    </div>
  </div>

  <!-- Summary -->
  <div class="summary">
    <div class="sum-box primary">
      <div class="val">${fmt(primaryTotal)}</div>
      <div class="lbl">${primaryLabel}</div>
    </div>
    <div class="sum-box payment">
      <div class="val">${fmt(entity.totalPayment)}</div>
      <div class="lbl">${payLabel}</div>
    </div>
    <div class="sum-box due">
      <div class="val">${fmt(entity.due)}</div>
      <div class="lbl">বাকি</div>
    </div>
  </div>

  <!-- Transactions Table -->
  <table>
    <thead>
      <tr>
        <th>তারিখ</th>
        <th>ইনভয়েস</th>
        <th>${txLabel}</th>
        <th>${payLabel}</th>
        <th>বিবরণ</th>
      </tr>
    </thead>
    <tbody>
      ${txRows.length ? txRows : '<tr><td colspan="5" style="text-align:center;color:#aaa;padding:20px">কোনো লেনদেন নেই</td></tr>'}
    </tbody>
  </table>

  <div class="footer">BusinessWallet — Generated on ${new Date().toLocaleString('en-GB')}</div>

</body>
</html>`;

  // PDF generate করুন এবং URI রিটার্ন করুন
  const { uri } = await Print.printToFileAsync({ html, base64: false });
  return uri;
}

export async function shareStatement(pdfUri) {
  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(pdfUri, {
      mimeType: 'application/pdf',
      dialogTitle: 'স্টেটমেন্ট শেয়ার করুন',
      UTI: 'com.adobe.pdf',
    });
  } else {
    throw new Error('এই ডিভাইসে শেয়ার করা যাচ্ছে না');
  }
}

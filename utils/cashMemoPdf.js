import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

const escapeHtml = (value) =>
  String(value ?? '').replace(/[&<>"']/g, (character) => {
    const entities = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return entities[character];
  });

const formatMoney = (value) =>
  `৳ ${Number(value || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;

export async function shareCashMemoPdf(memo, paperSize = 'a4') {
  const isThermal = paperSize === '58mm' || paperSize === '80mm';
  const pageWidth =
    paperSize === '58mm' ? 164 : paperSize === '80mm' ? 227 : 595;
  const subtotal = memo.items.reduce(
    (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0),
    0,
  );
  const discount =
    memo.discountType === 'percent'
      ? Math.floor(
          (subtotal *
            Math.min(100, Math.max(0, Number(memo.discountValue || 0)))) /
            100,
        )
      : Math.min(subtotal, Math.max(0, Number(memo.discountValue || 0)));
  const total = Math.max(0, subtotal - discount);
  const itemRows = memo.items
    .map(
      (item, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${escapeHtml(item.name)}</td>
          <td class="number">${escapeHtml(item.quantity)}</td>
          <td class="number">${formatMoney(item.price)}</td>
          <td class="number">${formatMoney(Number(item.price) * Number(item.quantity))}</td>
        </tr>`,
    )
    .join('');
  const thermalItems = memo.items
    .map(
      (item, index) => `
        <div class="receipt-item">
          <div class="item-name">${index + 1}. ${escapeHtml(item.name)}</div>
          <div class="item-math">
            <span>${escapeHtml(item.quantity)} × ${formatMoney(item.price)}</span>
            <strong>${formatMoney(Number(item.price) * Number(item.quantity))}</strong>
          </div>
        </div>`,
    )
    .join('');
  const date = new Date(memo.date);
  const dateLabel = Number.isNaN(date.getTime())
    ? escapeHtml(memo.date)
    : date.toLocaleDateString('en-GB');
  const fileDate = Number.isNaN(date.getTime())
    ? 'unknown-date'
    : date.toISOString().slice(0, 10);
  const customerName =
    (memo.customerName || 'Customer')
      .normalize('NFKC')
      .replace(/[<>:"/\\|?*\u0000-\u001f]/g, '')
      .trim()
      .replace(/\s+/g, '_')
      .replace(/[. ]+$/g, '') || 'Customer';
  const formatSuffix = isThermal ? `_${paperSize}` : '_A4';
  const baseFileName = `${customerName}_${fileDate}_memo-${memo.id}${formatSuffix}`;
  const serialNumber = `BW-${String(memo.id).padStart(4, '0')}`;
  const thermalTextLength = [
    memo.shopName,
    memo.shopPhone,
    memo.shopAddress,
    memo.shopDescription,
    memo.customerName,
    memo.phone,
    memo.address,
    ...memo.items.map((item) => item.name),
  ].reduce((sum, value) => sum + String(value || '').length, 0);
  const pageHeight = isThermal
    ? Math.ceil(
        430 +
          memo.items.length * 68 +
          Math.ceil(thermalTextLength / (paperSize === '58mm' ? 22 : 32)) * 20,
      )
    : 842;
  const pageWidthMm = ((pageWidth * 25.4) / 72).toFixed(2);
  const pageHeightMm = ((pageHeight * 25.4) / 72).toFixed(2);

  const html = `<!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>
          * { box-sizing: border-box; }
          @page { size: ${isThermal ? `${pageWidthMm}mm ${pageHeightMm}mm` : '210mm 297mm'}; margin: ${isThermal ? '0' : '12mm'}; }
          body { font-family: Arial, sans-serif; color: #182b2a; margin: 0; padding: 0; background: #fff; font-size: 14px; width: 100%; }
          .paper { width: 100%; max-width: 100%; border: 1px solid #e3e9e7; border-radius: 16px; padding: 18px; overflow: hidden; }
          .shop { text-align: center; padding: 2px 12px 20px; border-bottom: 2px solid #2f4f4f; }
          .shop-name { color: #203d3a; font-size: 32px; font-weight: 800; letter-spacing: .3px; margin: 0; }
          .shop-meta { color: #536663; font-size: 14px; margin-top: 7px; }

          .shop-phone { font-size: 20px; margin: 8px auto 0; background: #f1f5f3; color: #405b57; border: 1px solid #e0e8e5; border-radius: 20px; padding: 8px 13px; font-weight: 700; letter-spacing: .5px; display: inline-block; }

          .shop-description { color: #344744; font-size: 15px; font-weight: 400; line-height: 1.6; letter-spacing: .15px; margin: 9px auto 0; max-width: 520px; padding: 0 8px; }

          

          .shop-address { color: #405b57; font-size: 16px; margin: 8px auto 0; font-weight: 700; display: inline-block; }
          .document-bar { display: flex; justify-content: space-between; align-items: center; gap: 10px; margin: 19px 0 14px; }
          .serial { min-width: 0; color: #203d3a; font-size: 16px; font-weight: 800; letter-spacing: .3px; overflow-wrap: anywhere; }
          .date-badge { flex: 0 0 auto; background: #f1f5f3; color: #405b57; border: 1px solid #e0e8e5; border-radius: 20px; padding: 8px 10px; font-size: 13px; white-space: nowrap; }
          .customer { border: 1px solid #e5ebe8; border-radius: 11px; background: #fbfcfb; padding: 15px 16px; }
          .customer-top { display: flex; align-items: center; gap: 26px; font-size: 15px; white-space: nowrap; }
          .customer-item { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
          .customer-label { color: #657775; font-size: 12px;  margin-right: 7px; letter-spacing: .5px; }
          .customer-value { color: #253b38; font-weight: 700; }
          .address { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #536663; font-size: 14px; margin-top: 10px; }
          table { width: 100%; max-width: 100%; table-layout: fixed; border-collapse: collapse; margin-top: 22px; font-size: 13px; }
          th:nth-child(1), td:nth-child(1) { width: 7%; }
          th:nth-child(2), td:nth-child(2) { width: 35%; }
          th:nth-child(3), td:nth-child(3) { width: 15%; }
          th:nth-child(4), td:nth-child(4) { width: 21%; }
          th:nth-child(5), td:nth-child(5) { width: 22%; }
          thead { display: table-header-group; }
          th { padding: 10px 5px; color: #fff; background: #2f4f4f; text-align: left; font-weight: 700; font-size: 12px; overflow-wrap: anywhere; }
          th:first-child { border-radius: 8px 0 0 8px; }
          th:last-child { border-radius: 0 8px 8px 0; }
          td { padding: 10px 5px; border-bottom: 1px solid #e9eeec; color: #344744; font-size: 13px; overflow-wrap: anywhere; }
          tbody tr:nth-child(even) { background: #f8faf9; }
          .number { text-align: right; white-space: normal; word-break: break-word; }
          .totals { width: min(285px, 100%); margin: 19px 0 0 auto; }
          .total-row { display: flex; justify-content: space-between; padding: 8px 2px; color: #536663; font-size: 14px; }
          .total-row strong { color: #2a403d; }
          .grand { border-top: 1px solid #dfe7e4; margin-top: 6px; padding: 13px 12px; background: #f1f5f3; border-radius: 8px; font-size: 18px; font-weight: 800; color: #203d3a; }
          .footer { margin-top: 30px; padding-top: 13px; border-top: 1px solid #e8edeb; text-align: center; color: #73827f; font-size: 12px; }
          .thermal-customer, .thermal-items, .thermal-totals { display: none; }
          @media print { body { width: 100%; padding: 0; } .paper { width: 100%; max-width: 100%; border: 0; padding: 0; overflow: visible; } }
          ${
            isThermal
              ? `
          body { font-size: 12px; }
          .paper { border: 0; border-radius: 0; padding: 9px; overflow: visible; }
          .shop { padding: 0 2px 10px; }
          .shop-name { font-size: ${paperSize === '58mm' ? '18px' : '22px'}; overflow-wrap: anywhere; }
          .shop-phone, .shop-description, .shop-address { font-size: 12px; margin-top: 5px; padding: 0; max-width: 100%; overflow-wrap: anywhere; }
          .document-bar { margin: 10px 0; gap: 5px; align-items: flex-start; }
          .serial { font-size: 11px; }
          .date-badge { font-size: 10px; padding: 4px 6px; white-space: normal; text-align: right; }
          .customer, table, .totals { display: none; }
          .thermal-customer, .thermal-items, .thermal-totals { display: block; }
          .thermal-customer { border-top: 1px dashed #7b8985; border-bottom: 1px dashed #7b8985; padding: 7px 0; line-height: 1.5; overflow-wrap: anywhere; }
          .thermal-customer div { margin: 2px 0; }
          .receipt-item { padding: 7px 0; border-bottom: 1px dashed #aab4b1; overflow-wrap: anywhere; }
          .item-name { font-weight: 700; }
          .item-math { display: flex; justify-content: space-between; gap: 5px; margin-top: 3px; }
          .item-math span, .item-math strong { min-width: 0; overflow-wrap: anywhere; }
          .thermal-totals { margin-top: 8px; border-top: 1px dashed #7b8985; padding-top: 5px; }
          .thermal-totals .total-row { font-size: 12px; padding: 4px 0; gap: 4px; }
          .thermal-totals .grand { font-size: 15px; padding: 7px 0; background: transparent; border-radius: 0; }
          .footer { margin-top: 12px; padding: 8px 0 0; font-size: 10px; }
          `
              : ''
          }
        </style>
      </head>
      <body>
        <main class="paper">
          <header class="shop">
            ${memo.shopName ? `<h1 class="shop-name">${escapeHtml(memo.shopName)}</h1>` : '<h1 class="shop-name">Cash Memo</h1>'}
            
            ${memo.shopPhone ? `<div class="shop-phone">${escapeHtml(memo.shopPhone)}</div>` : ''}

            ${memo.shopDescription ? `<div class="shop-description">${escapeHtml(memo.shopDescription)}</div>` : ''}

            

            ${memo.shopAddress ? `<div class="shop-address"> ${escapeHtml(memo.shopAddress)}</div>` : ''}
          </header>
          <div class="document-bar">
            <div class="serial">Memo No. ${escapeHtml(serialNumber)}</div>
            <div class="date-badge">Date: ${dateLabel}</div>
          </div>
          <section class="thermal-customer">
            <div><strong>Customer:</strong> ${escapeHtml(memo.customerName || 'Not specified')}</div>
            ${memo.phone ? `<div><strong>Phone:</strong> ${escapeHtml(memo.phone)}</div>` : ''}
            ${memo.address ? `<div><strong>Address:</strong> ${escapeHtml(memo.address)}</div>` : ''}
          </section>
          <section class="customer">
            <div class="customer-top">
              <div class="customer-item"><span class="customer-label">Customer :</span><span class="customer-value">${escapeHtml(memo.customerName || 'Not specified')}</span></div>
              <div class="customer-item"><span class="customer-label">Phone :</span><span class="customer-value">${escapeHtml(memo.phone || '—')}</span></div>
            </div>
            ${memo.address ? `<div class="address"><span class="customer-label">Address :</span>${escapeHtml(memo.address)}</div>` : ''}
          </section>
          <table>
            <thead><tr><th>#</th><th>Product</th><th class="number">Quantity</th><th class="number">Unit Price</th><th class="number">Amount</th></tr></thead>
            <tbody>${itemRows || '<tr><td colspan="5" style="text-align:center;color:#87938f">No products added</td></tr>'}</tbody>
          </table>
          <section class="thermal-items">
            ${thermalItems || '<div class="receipt-item">No products added</div>'}
          </section>
          <section class="totals">
            <div class="total-row"><span>Subtotal</span><strong>${formatMoney(subtotal)}</strong></div>
            <div class="total-row"><span>Discount${memo.discountType === 'percent' ? ` (${escapeHtml(memo.discountValue)}%)` : ''}</span><strong>- ${formatMoney(discount)}</strong></div>
            <div class="total-row grand"><span>Total</span><span>${formatMoney(total)}</span></div>
          </section>
          <section class="thermal-totals">
            <div class="total-row"><span>Subtotal</span><strong>${formatMoney(subtotal)}</strong></div>
            <div class="total-row"><span>Discount${memo.discountType === 'percent' ? ` (${escapeHtml(memo.discountValue)}%)` : ''}</span><strong>- ${formatMoney(discount)}</strong></div>
            <div class="total-row grand"><span>Total</span><span>${formatMoney(total)}</span></div>
          </section>
          <footer class="footer">Thanks for your shopping!</footer>
        </main>
      </body>
    </html>`;

  const { uri } = await Print.printToFileAsync({
    html,
    base64: false,
    width: pageWidth,
    height: pageHeight,
    margins: { top: 0, bottom: 0, left: 0, right: 0 },
  });
  let fileName = `${baseFileName}.pdf`;
  let destination = `${FileSystem.cacheDirectory}${fileName}`;
  if (await FileSystem.getInfoAsync(destination).then((info) => info.exists)) {
    fileName = `${baseFileName}_${Date.now()}.pdf`;
    destination = `${FileSystem.cacheDirectory}${fileName}`;
  }
  await FileSystem.moveAsync({ from: uri, to: destination });
  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('PDF sharing is not available on this device.');
  }
  await Sharing.shareAsync(destination, {
    mimeType: 'application/pdf',
    dialogTitle: 'Share cash memo',
    UTI: 'com.adobe.pdf',
  });
  return destination;
}

import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import {
  getAllCustomers,
  getAllCustomerTransactionsForBackup,
  getAllExpenses,
  getAllIncomes,
  getAllNotes,
  getAllSuppliers,
  getAllSupplierTransactionsForBackup,
  insertCustomer,
  insertCustomerTransaction,
  insertExpense,
  insertIncome,
  insertNote,
  insertSupplier,
  insertSupplierTransaction,
} from '../database/db';

const BACKUP_VERSION = 1;

/* ═══════════════════════════════════════════════
   BACKUP
═══════════════════════════════════════════════ */
export async function createBackup() {
  // সব ডেটা পড়ি
  const [
    expenses,
    incomes,
    suppliers,
    supplierTransactions,
    customers,
    customerTransactions,
    notes,
  ] = await Promise.all([
    getAllExpenses(),
    getAllIncomes(),
    getAllSuppliers(),
    getAllSupplierTransactionsForBackup(),
    getAllCustomers(),
    getAllCustomerTransactionsForBackup(),
    getAllNotes(),
  ]);

  const backup = {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    expenses,
    incomes,
    suppliers,
    supplierTransactions,
    customers,
    customerTransactions,
    notes,
  };

  // তারিখ সহ ফাইল নাম
  const dateStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const fileName = `BusinessWallet_Backup_${dateStr}.json`;
  const filePath = `${FileSystem.cacheDirectory}${fileName}`;

  await FileSystem.writeAsStringAsync(
    filePath,
    JSON.stringify(backup, null, 2),
    { encoding: 'utf8' },
  );

  return filePath;
}

export async function shareBackup() {
  const filePath = await createBackup();
  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) throw new Error('এই ডিভাইসে শেয়ার করা যাচ্ছে না');
  await Sharing.shareAsync(filePath, {
    mimeType: 'application/json',
    dialogTitle: 'Backup শেয়ার করুন',
  });
}

/* ═══════════════════════════════════════════════
   RESTORE (Merge)
   বিদ্যমান ডেটা থাকবে + নতুন ডেটা যোগ হবে
   Duplicate skip হবে
═══════════════════════════════════════════════ */
export async function restoreBackup() {
  // ফাইল pick করো
  const result = await DocumentPicker.getDocumentAsync({
    type: 'application/json',
    copyToCacheDirectory: true,
  });

  if (result.canceled) return { canceled: true };

  const uri = result.assets[0].uri;
  const raw = await FileSystem.readAsStringAsync(uri, {
    encoding: 'utf8',
  });

  let backup;
  try {
    backup = JSON.parse(raw);
  } catch {
    throw new Error('ফাইলটি সঠিক Backup ফাইল নয়');
  }

  if (!backup.version || !backup.exportedAt) {
    throw new Error('ফাইলটি সঠিক Backup ফাইল নয়');
  }

  const stats = {
    expenses: 0,
    incomes: 0,
    suppliers: 0,
    supplierTx: 0,
    customers: 0,
    customerTx: 0,
    notes: 0,
  };

  // ── বিদ্যমান ডেটা লোড (duplicate check এর জন্য) ──
  const [
    exExpenses,
    exIncomes,
    exSuppliers,
    exSupplierTx,
    exCustomers,
    exCustomerTx,
    exNotes,
  ] = await Promise.all([
    getAllExpenses(),
    getAllIncomes(),
    getAllSuppliers(),
    getAllSupplierTransactionsForBackup(),
    getAllCustomers(),
    getAllCustomerTransactionsForBackup(),
    getAllNotes(),
  ]);

  // ── EXPENSES ──
  for (const e of backup.expenses || []) {
    const dup = exExpenses.find(
      (x) =>
        x.date === e.date && x.amount === e.amount && x.reason === e.reason,
    );
    if (!dup) {
      await insertExpense({ reason: e.reason, amount: e.amount, date: e.date });
      stats.expenses++;
    }
  }

  // ── INCOMES ──
  for (const i of backup.incomes || []) {
    const dup = exIncomes.find(
      (x) =>
        x.date === i.date && x.amount === i.amount && x.reason === i.reason,
    );
    if (!dup) {
      await insertIncome({
        reason: i.reason,
        selAmount: i.selAmount,
        amount: i.amount,
        date: i.date,
      });
      stats.incomes++;
    }
  }

  // ── SUPPLIERS (old ID → new ID mapping) ──
  const supplierIdMap = {}; // backup এর id → device এর নতুন id

  for (const s of backup.suppliers || []) {
    // phone বা name+createdAt দিয়ে duplicate check
    const dup = exSuppliers.find(
      (x) =>
        (s.phone && s.phone.trim() && x.phone === s.phone) ||
        (x.name === s.name && x.createdAt === s.createdAt),
    );
    if (dup) {
      supplierIdMap[s.id] = dup.id;
    } else {
      try {
        const r = await insertSupplier({
          name: s.name,
          phone: s.phone,
          address: s.address,
          note: s.note,
          createdAt: s.createdAt,
        });
        supplierIdMap[s.id] = r.lastInsertRowId;
        stats.suppliers++;
      } catch {
        // phone duplicate হলে existing খুঁজি
        const existing = exSuppliers.find((x) => x.name === s.name);
        if (existing) supplierIdMap[s.id] = existing.id;
      }
    }
  }

  // ── SUPPLIER TRANSACTIONS ──
  for (const tx of backup.supplierTransactions || []) {
    const newSupplierId = supplierIdMap[tx.supplierId];
    if (!newSupplierId) continue;

    const dup = exSupplierTx.find(
      (x) =>
        x.date === tx.date &&
        x.purchase === tx.purchase &&
        x.payment === tx.payment &&
        supplierIdMap[tx.supplierId] === x.supplierId,
    );
    if (!dup) {
      await insertSupplierTransaction({
        supplierId: newSupplierId,
        purchase: tx.purchase,
        payment: tx.payment,
        description: tx.description,
        invoiceNo: tx.invoiceNo,
        date: tx.date,
        createdAt: tx.createdAt,
      });
      stats.supplierTx++;
    }
  }

  // ── CUSTOMERS (old ID → new ID mapping) ──
  const customerIdMap = {};

  for (const c of backup.customers || []) {
    const dup = exCustomers.find(
      (x) =>
        (c.phone && c.phone.trim() && x.phone === c.phone) ||
        (x.name === c.name && x.createdAt === c.createdAt),
    );
    if (dup) {
      customerIdMap[c.id] = dup.id;
    } else {
      try {
        const r = await insertCustomer({
          name: c.name,
          phone: c.phone,
          address: c.address,
          note: c.note,
          createdAt: c.createdAt,
        });
        customerIdMap[c.id] = r.lastInsertRowId;
        stats.customers++;
      } catch {
        const existing = exCustomers.find((x) => x.name === c.name);
        if (existing) customerIdMap[c.id] = existing.id;
      }
    }
  }

  // ── CUSTOMER TRANSACTIONS ──
  for (const tx of backup.customerTransactions || []) {
    const newCustomerId = customerIdMap[tx.customerId];
    if (!newCustomerId) continue;

    const dup = exCustomerTx.find(
      (x) =>
        x.date === tx.date &&
        x.sale === tx.sale &&
        x.payment === tx.payment &&
        customerIdMap[tx.customerId] === x.customerId,
    );
    if (!dup) {
      await insertCustomerTransaction({
        customerId: newCustomerId,
        sale: tx.sale,
        payment: tx.payment,
        description: tx.description,
        invoiceNo: tx.invoiceNo,
        date: tx.date,
        createdAt: tx.createdAt,
      });
      stats.customerTx++;
    }
  }

  // ── NOTES ──
  for (const n of backup.notes || []) {
    const dup = exNotes.find((x) => x.createdAt === n.createdAt);
    if (!dup) {
      await insertNote({
        title: n.title,
        content: n.content,
        pinned: n.pinned,
        createdAt: n.createdAt,
        updatedAt: n.updatedAt,
      });
      stats.notes++;
    }
  }

  return { canceled: false, stats };
}

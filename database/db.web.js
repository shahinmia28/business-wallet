// expo-sqlite ওয়েবে সরাসরি সাপোর্ট করে না।
// আপাতত স্টাব রাখা হলো যাতে web build এ import error না হয়।
// যদি ভবিষ্যতে web সাপোর্ট লাগে, তাহলে এখানে
// expo-sqlite/web (wa-sqlite) বা localStorage/IndexedDB ভিত্তিক
// বাস্তব ইমপ্লিমেন্টেশন বসাতে হবে।

const notSupported = (fnName) => async () => {
  console.warn(`[db.web] "${fnName}" web এ এখনো সাপোর্ট করে না`);
  throw new Error('এই ফিচারটি Web ভার্সনে এখনো সাপোর্ট করে না');
};

export const initDB = async () => {
  console.warn('[db.web] initDB: web এ এখনো ডাটাবেজ সাপোর্ট নেই');
};

// Expenses
export const getAllExpenses = async () => [];
export const insertExpense = notSupported('insertExpense');
export const deleteExpenseById = notSupported('deleteExpenseById');
export const updateExpense = notSupported('updateExpense');

// Incomes
export const getAllIncomes = async () => [];
export const insertIncome = notSupported('insertIncome');
export const deleteIncomeById = notSupported('deleteIncomeById');
export const updateIncome = notSupported('updateIncome');

// Suppliers
export const getAllSuppliers = async () => [];
export const getAllSuppliersIncludingInactive = async () => [];
export const insertSupplier = notSupported('insertSupplier');
export const updateSupplier = notSupported('updateSupplier');
export const deleteSupplier = notSupported('deleteSupplier');
export const deactivateSupplier = notSupported('deactivateSupplier');
export const activateSupplier = notSupported('activateSupplier');
export const getSupplierById = async () => null;
export const getSupplierByPhone = async () => null;
export const getSupplierSummary = async () => ({
  totalSupplier: 0,
  totalPurchase: 0,
  totalPayment: 0,
  totalDue: 0,
});

// Supplier Transactions
export const getSupplierTransactions = async () => [];
export const insertSupplierTransaction = notSupported(
  'insertSupplierTransaction',
);
export const updateSupplierTransaction = notSupported(
  'updateSupplierTransaction',
);
export const deleteSupplierTransaction = notSupported(
  'deleteSupplierTransaction',
);

// Notes
export const getAllNotes = async () => [];
export const insertNote = notSupported('insertNote');
export const updateNote = notSupported('updateNote');
export const deleteNoteById = notSupported('deleteNoteById');

/* ===== CUSTOMERS ===== */
export const getAllCustomers = async () => [];
export const getAllCustomersIncludingInactive = async () => [];
export const insertCustomer = async () => null;
export const updateCustomer = async () => null;
export const deleteCustomer = async () => null;
export const deactivateCustomer = async () => null;
export const activateCustomer = async () => null;
export const getCustomerById = async () => null;
export const getCustomerByPhone = async () => null;
export const getCustomerSummary = async () => ({
  totalCustomer: 0,
  totalSale: 0,
  totalPayment: 0,
  totalDue: 0,
});

/* ===== CUSTOMER TRANSACTIONS ===== */
export const getCustomerTransactions = async () => [];
export const insertCustomerTransaction = async () => null;
export const updateCustomerTransaction = async () => null;
export const deleteCustomerTransaction = async () => null;

/* ===== BACKUP HELPERS ===== */
export const getAllSupplierTransactionsForBackup = async () => [];
export const getAllCustomerTransactionsForBackup = async () => [];

export default null;

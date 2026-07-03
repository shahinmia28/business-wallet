import { Platform } from 'react-native';

let dbModule;

if (Platform.OS === 'web') {
  dbModule = require('./db.web');
} else {
  dbModule = require('./db.native');
}

export const {
  initDB,

  // Expenses
  getAllExpenses,
  insertExpense,
  deleteExpenseById,
  updateExpense,

  // Incomes
  getAllIncomes,
  insertIncome,
  deleteIncomeById,
  updateIncome,

  // Suppliers
  getAllSuppliers,
  getAllSuppliersIncludingInactive,
  insertSupplier,
  updateSupplier,
  deleteSupplier,
  deactivateSupplier,
  activateSupplier,
  getSupplierById,
  getSupplierByPhone,
  getSupplierSummary,

  // Supplier Transactions
  getSupplierTransactions,
  insertSupplierTransaction,
  updateSupplierTransaction,
  deleteSupplierTransaction,

  // Notes
  getAllNotes,
  insertNote,
  updateNote,
  deleteNoteById,

  // Customers
  getAllCustomers,
  getAllCustomersIncludingInactive,
  insertCustomer,
  updateCustomer,
  deleteCustomer,
  deactivateCustomer,
  activateCustomer,
  getCustomerById,
  getCustomerByPhone,
  getCustomerSummary,

  // Customer Transactions
  getCustomerTransactions,
  insertCustomerTransaction,
  updateCustomerTransaction,
  deleteCustomerTransaction,
} = dbModule;

export default dbModule.default;

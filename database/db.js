import { Platform } from 'react-native';

let dbModule;

if (Platform.OS === 'web') {
  dbModule = require('./db.web');
} else {
  dbModule = require('./db.native');
}

export const {
  initDB,
  getAllExpenses,
  insertExpense,
  deleteExpenseById,
  updateExpense,
  getAllIncomes,
  insertIncome,
  deleteIncomeById,
  updateIncome,
} = dbModule;

export default dbModule.default;

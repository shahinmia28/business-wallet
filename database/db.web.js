// SQLite is NOT supported on web in this project

export const initDB = async () => {
  console.log('SQLite disabled on web');
};

/* ===== EXPENSE ===== */
export const getAllExpenses = async () => [];
export const insertExpense = async () => null;
export const deleteExpenseById = async () => null;
export const updateExpense = async () => null;

/* ===== INCOME ===== */
export const getAllIncomes = async () => [];
export const insertIncome = async () => null;
export const deleteIncomeById = async () => null;
export const updateIncome = async () => null;

export default null;

import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('dailyExpense.db');

/* ===================== INIT DB + MIGRATIONS ===================== */
export const initDB = async () => {
  // 1️⃣ Create migrations table if not exists
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE
    );
  `);

  // 2️⃣ Define migrations
  const migrations = [
    {
      name: 'create_expenses_table',
      query: `
        CREATE TABLE IF NOT EXISTS expenses (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          reason TEXT,
          amount REAL,
          date TEXT
        );
      `,
    },
    {
      name: 'create_incomes_table',
      query: `
        CREATE TABLE IF NOT EXISTS incomes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          reason TEXT,
          selAmount REAL,
          amount REAL,
          date TEXT
        );
      `,
    },
    {
      name: 'create_notes_table',
      query: `
        CREATE TABLE IF NOT EXISTS notes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT,
          content TEXT,
          pinned INTEGER DEFAULT 0,
          createdAt TEXT,
          updatedAt TEXT
        );
      `,
    },
    // future migrations example
    {
      name: 'add_incomes_selAmount_column',
      query: `ALTER TABLE incomes ADD COLUMN selAmount REAL;`,
    },
  ];

  // 3️⃣ Run migrations that are not applied
  for (const m of migrations) {
    try {
      // check if migration already applied
      const applied = await db.getAllAsync(
        'SELECT * FROM migrations WHERE name = ?;',
        [m.name]
      );
      if (applied.length === 0) {
        await db.execAsync(m.query);
        await db.runAsync('INSERT INTO migrations (name) VALUES (?);', [
          m.name,
        ]);
        console.log(`Migration applied: ${m.name}`);
      }
    } catch (e) {
      console.warn(`Migration skipped or failed: ${m.name}`, e.message);
    }
  }

  console.log('DB initialized with migrations');
};

/* ===================== EXPENSES ===================== */
export const getAllExpenses = async () =>
  await db.getAllAsync('SELECT * FROM expenses ORDER BY date DESC;');

export const insertExpense = async ({ reason, amount, date }) =>
  await db.runAsync(
    'INSERT INTO expenses (reason, amount, date) VALUES (?, ?, ?);',
    [reason, amount, date]
  );

export const updateExpense = async ({ id, reason, amount, date }) =>
  await db.runAsync(
    'UPDATE expenses SET reason=?, amount=?, date=? WHERE id=?;',
    [reason, amount, date, id]
  );

export const deleteExpenseById = async (id) =>
  await db.runAsync('DELETE FROM expenses WHERE id=?;', [id]);

/* ===================== INCOMES ===================== */
export const getAllIncomes = async () =>
  await db.getAllAsync('SELECT * FROM incomes ORDER BY date DESC;');

export const insertIncome = async ({ reason, selAmount, amount, date }) =>
  await db.runAsync(
    'INSERT INTO incomes (reason, selAmount, amount, date) VALUES (?, ?, ?, ?);',
    [reason, selAmount, amount, date]
  );

export const updateIncome = async ({ id, reason, selAmount, amount, date }) =>
  await db.runAsync(
    'UPDATE incomes SET reason=?, selAmount=?, amount=?, date=? WHERE id=?;',
    [reason, selAmount, amount, date, id]
  );

export const deleteIncomeById = async (id) =>
  await db.runAsync('DELETE FROM incomes WHERE id=?;', [id]);

/* ===================== NOTES ===================== */
export const getAllNotes = async () =>
  await db.getAllAsync(`
    SELECT * FROM notes
    ORDER BY pinned DESC, datetime(updatedAt) DESC, datetime(createdAt) DESC;
  `);

export const insertNote = async ({
  title,
  content,
  pinned,
  createdAt,
  updatedAt,
}) =>
  await db.runAsync(
    'INSERT INTO notes (title, content, pinned, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?);',
    [title, content, pinned, createdAt, updatedAt]
  );

export const updateNote = async ({ id, title, content, pinned, updatedAt }) =>
  await db.runAsync(
    'UPDATE notes SET title=?, content=?, pinned=?, updatedAt=? WHERE id=?;',
    [title, content, pinned, updatedAt, id]
  );

export const deleteNoteById = async (id) =>
  await db.runAsync('DELETE FROM notes WHERE id=?;', [id]);

export default db;

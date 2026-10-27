import * as SQLite from 'expo-sqlite';
import {
  deletePrescriptionImage,
  deleteProfileImage,
} from '../utils/customerPrescription';

const db = SQLite.openDatabaseSync('dailyExpense.db');

db.execSync('PRAGMA foreign_keys = ON;');

const currentTimestamp = () => new Date().toISOString();

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
    {
      name: 'create_suppliers_table',
      query: `
    CREATE TABLE IF NOT EXISTS suppliers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT,
      address TEXT,
      note TEXT,
      profileImagePath TEXT,
      createdAt TEXT
    );
  `,
    },
    {
      name: 'create_supplier_transactions_table',
      query: `
    CREATE TABLE IF NOT EXISTS supplier_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,

      supplierId INTEGER NOT NULL,

      purchase REAL NOT NULL DEFAULT 0,

      payment REAL NOT NULL DEFAULT 0,

      description TEXT DEFAULT '',
      
      invoiceNo TEXT DEFAULT '',

      date TEXT NOT NULL,

      createdAt TEXT NOT NULL,

      FOREIGN KEY (supplierId)
        REFERENCES suppliers(id)
        ON DELETE CASCADE
    );
  `,
    },
    // future migrations example
    {
      name: 'add_incomes_selAmount_column',
      query: `ALTER TABLE incomes ADD COLUMN selAmount REAL;`,
    },
    {
      name: 'add_notes_noteType_column',
      query: `ALTER TABLE notes ADD COLUMN noteType TEXT NOT NULL DEFAULT 'text';`,
    },
    {
      name: 'add_notes_isLocked_column',
      query: `ALTER TABLE notes ADD COLUMN isLocked INTEGER NOT NULL DEFAULT 0;`,
    },
    {
      // ফাঁকা/NULL ফোন একাধিকবার থাকতে পারবে, কিন্তু একই ফোন নম্বর দুইবার থাকতে পারবে না
      name: 'add_unique_index_suppliers_phone',
      query: `
        CREATE UNIQUE INDEX IF NOT EXISTS idx_suppliers_phone_unique
        ON suppliers(phone)
        WHERE phone IS NOT NULL AND TRIM(phone) <> '';
      `,
    },
    {
      name: 'add_suppliers_profile_image_path_column',
      query: `ALTER TABLE suppliers ADD COLUMN profileImagePath TEXT;`,
    },
    {
      // Delete না করে Hide/Show করার জন্য
      name: 'add_suppliers_isActive_column',
      query: `ALTER TABLE suppliers ADD COLUMN isActive INTEGER DEFAULT 1;`,
    },
    {
      // পুরনো DB তে invoiceNo কলাম নেই, migration দিয়ে যোগ করতে হবে
      name: 'add_supplier_transactions_invoiceNo_column',
      query: `ALTER TABLE supplier_transactions ADD COLUMN invoiceNo TEXT DEFAULT '';`,
    },
    {
      name: 'create_customers_table',
      query: `
        CREATE TABLE IF NOT EXISTS customers (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          phone TEXT,
          address TEXT,
          note TEXT,
          profileImagePath TEXT,
          prescriptionPhotoPath TEXT,
          isActive INTEGER DEFAULT 1,
          createdAt TEXT
        );
      `,
    },
    {
      name: 'add_unique_index_customers_phone',
      query: `
        CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_phone_unique
        ON customers(phone)
        WHERE phone IS NOT NULL AND TRIM(phone) <> '';
      `,
    },
    {
      name: 'add_customers_profile_image_path_column',
      query: `ALTER TABLE customers ADD COLUMN profileImagePath TEXT;`,
    },
    {
      name: 'add_customers_prescription_photo_path_column',
      query: `ALTER TABLE customers ADD COLUMN prescriptionPhotoPath TEXT;`,
    },
    {
      name: 'create_customer_transactions_table',
      query: `
        CREATE TABLE IF NOT EXISTS customer_transactions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          customerId INTEGER NOT NULL,
          sale REAL NOT NULL DEFAULT 0,
          payment REAL NOT NULL DEFAULT 0,
          description TEXT DEFAULT '',
          invoiceNo TEXT DEFAULT '',
          date TEXT NOT NULL,
          createdAt TEXT NOT NULL,
          FOREIGN KEY (customerId)
            REFERENCES customers(id)
            ON DELETE CASCADE
        );
      `,
    },
    {
      name: 'create_cash_memos_table',
      query: `
        CREATE TABLE IF NOT EXISTS cash_memos (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          customerName TEXT NOT NULL DEFAULT '',
          phone TEXT DEFAULT '',
          address TEXT DEFAULT '',
          note TEXT DEFAULT '',
          date TEXT NOT NULL,
          items TEXT NOT NULL DEFAULT '[]',
          discountValue REAL NOT NULL DEFAULT 0,
          discountType TEXT NOT NULL DEFAULT 'fixed',
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_cash_memos_date
        ON cash_memos(date DESC, id DESC);
      `,
    },
    {
      name: 'create_memo_shop_profile_table',
      query: `
        CREATE TABLE IF NOT EXISTS memo_shop_profile (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          name TEXT NOT NULL DEFAULT '',
          phone TEXT NOT NULL DEFAULT '',
          address TEXT NOT NULL DEFAULT '',
          description TEXT NOT NULL DEFAULT '',
          updatedAt TEXT NOT NULL
        );
      `,
    },
    {
      name: 'add_cash_memo_shop_name_column',
      query: `ALTER TABLE cash_memos ADD COLUMN shopName TEXT NOT NULL DEFAULT '';`,
    },
    {
      name: 'add_cash_memo_shop_phone_column',
      query: `ALTER TABLE cash_memos ADD COLUMN shopPhone TEXT NOT NULL DEFAULT '';`,
    },
    {
      name: 'add_cash_memo_shop_address_column',
      query: `ALTER TABLE cash_memos ADD COLUMN shopAddress TEXT NOT NULL DEFAULT '';`,
    },
    {
      name: 'add_cash_memo_shop_description_column',
      query: `ALTER TABLE cash_memos ADD COLUMN shopDescription TEXT NOT NULL DEFAULT '';`,
    },
  ];

  // 3️⃣ Run migrations that are not applied
  for (const m of migrations) {
    try {
      // check if migration already applied
      const applied = await db.getAllAsync(
        'SELECT * FROM migrations WHERE name = ?;',
        [m.name],
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

  for (const table of ['suppliers', 'customers']) {
    const columns = await db.getAllAsync(`PRAGMA table_info(${table});`);
    if (!columns.some((column) => column.name === 'updatedAt')) {
      await db.execAsync(`ALTER TABLE ${table} ADD COLUMN updatedAt TEXT;`);
    }
    await db.runAsync(
      `UPDATE ${table} SET updatedAt=createdAt WHERE updatedAt IS NULL;`,
    );
  }

  console.log('DB initialized with migrations');
};

/* ===================== EXPENSES ===================== */
export const getAllExpenses = async () =>
  await db.getAllAsync('SELECT * FROM expenses ORDER BY date DESC;');

export const insertExpense = async ({ reason, amount, date }) =>
  await db.runAsync(
    'INSERT INTO expenses (reason, amount, date) VALUES (?, ?, ?);',
    [reason, amount, date],
  );

export const updateExpense = async ({ id, reason, amount, date }) =>
  await db.runAsync(
    'UPDATE expenses SET reason=?, amount=?, date=? WHERE id=?;',
    [reason, amount, date, id],
  );

export const deleteExpenseById = async (id) =>
  await db.runAsync('DELETE FROM expenses WHERE id=?;', [id]);

/* ===================== INCOMES ===================== */
export const getAllIncomes = async () =>
  await db.getAllAsync('SELECT * FROM incomes ORDER BY date DESC;');

export const insertIncome = async ({ reason, selAmount, amount, date }) =>
  await db.runAsync(
    'INSERT INTO incomes (reason, selAmount, amount, date) VALUES (?, ?, ?, ?);',
    [reason, selAmount, amount, date],
  );

export const updateIncome = async ({ id, reason, selAmount, amount, date }) =>
  await db.runAsync(
    'UPDATE incomes SET reason=?, selAmount=?, amount=?, date=? WHERE id=?;',
    [reason, selAmount, amount, date, id],
  );

export const deleteIncomeById = async (id) =>
  await db.runAsync('DELETE FROM incomes WHERE id=?;', [id]);

/* ===================== SUPPLIERS ===================== */

export const getAllSuppliers = async () =>
  await db.getAllAsync(`
      SELECT
          s.*,

          IFNULL(SUM(t.purchase),0) AS totalPurchase,

          IFNULL(SUM(t.payment),0) AS totalPayment,

          IFNULL(SUM(t.purchase),0) -
          IFNULL(SUM(t.payment),0) AS due

      FROM suppliers s

      LEFT JOIN supplier_transactions t
      ON s.id=t.supplierId

      WHERE IFNULL(s.isActive,1)=1

      GROUP BY s.id

      ORDER BY datetime(s.createdAt) DESC;
  `);

export const getSupplierByPhone = async (phone) => {
  if (!phone || !phone.trim()) return null;
  return await db.getFirstAsync('SELECT * FROM suppliers WHERE phone = ?;', [
    phone.trim(),
  ]);
};

export const insertSupplier = async ({
  name,
  phone,
  address,
  note,
  profileImagePath,
  createdAt,
}) => {
  if (!createdAt) {
    throw new Error('createdAt আবশ্যক — Supplier তৈরির সময় অবশ্যই দিতে হবে');
  }
  if (phone && phone.trim()) {
    const existing = await getSupplierByPhone(phone);
    if (existing) {
      throw new Error('এই ফোন নম্বর দিয়ে আগে থেকেই একজন সাপ্লায়ার আছে');
    }
  }
  try {
    return await db.runAsync(
      `INSERT INTO suppliers
      (name,phone,address,note,profileImagePath,createdAt,updatedAt,isActive)
      VALUES (?,?,?,?,?,?,?,1)`,
      [
        name,
        phone,
        address,
        note,
        profileImagePath ?? null,
        createdAt,
        createdAt,
      ],
    );
  } catch (e) {
    if (e.message && e.message.includes('UNIQUE')) {
      throw new Error('এই ফোন নম্বর দিয়ে আগে থেকেই একজন সাপ্লায়ার আছে');
    }
    throw e;
  }
};

export const updateSupplier = async ({
  id,
  name,
  phone,
  address,
  note,
  profileImagePath,
}) => {
  const updatedAt = currentTimestamp();
  if (phone && phone.trim()) {
    const existing = await getSupplierByPhone(phone);
    if (existing && existing.id !== id) {
      throw new Error('এই ফোন নম্বর দিয়ে আগে থেকেই একজন সাপ্লায়ার আছে');
    }
  }
  try {
    if (profileImagePath !== undefined) {
      return await db.runAsync(
        `UPDATE suppliers
         SET
         name=?,
         phone=?,
         address=?,
         note=?,
         profileImagePath=?,
         updatedAt=?
         WHERE id=?`,
        [name, phone, address, note, profileImagePath ?? null, updatedAt, id],
      );
    }

    return await db.runAsync(
      `UPDATE suppliers
       SET
       name=?,
       phone=?,
       address=?,
       note=?,
       updatedAt=?
       WHERE id=?`,
      [name, phone, address, note, updatedAt, id],
    );
  } catch (e) {
    if (e.message && e.message.includes('UNIQUE')) {
      throw new Error('এই ফোন নম্বর দিয়ে আগে থেকেই একজন সাপ্লায়ার আছে');
    }
    throw e;
  }
};

export const deleteSupplier = async (id) => {
  const supplier = await getSupplierById(id);
  if (supplier?.profileImagePath) {
    await deleteProfileImage(supplier.profileImagePath);
  }
  await db.runAsync(`DELETE FROM suppliers WHERE id=?`, [id]);
};

// Delete না করে শুধু Hide করার জন্য (isActive=0)
export const deactivateSupplier = async (id) =>
  await db.runAsync(
    `UPDATE suppliers SET isActive=0, updatedAt=? WHERE id=?`,
    [currentTimestamp(), id],
  );

export const activateSupplier = async (id) =>
  await db.runAsync(
    `UPDATE suppliers SET isActive=1, updatedAt=? WHERE id=?`,
    [currentTimestamp(), id],
  );

export const getAllSuppliersIncludingInactive = async () =>
  await db.getAllAsync(`
      SELECT
          s.*,
          IFNULL(SUM(t.purchase),0) AS totalPurchase,
          IFNULL(SUM(t.payment),0) AS totalPayment,
          IFNULL(SUM(t.purchase),0) - IFNULL(SUM(t.payment),0) AS due
      FROM suppliers s
      LEFT JOIN supplier_transactions t
      ON s.id=t.supplierId
      GROUP BY s.id
      ORDER BY datetime(s.createdAt) DESC;
  `);

export const getSupplierById = async (id) =>
  await db.getFirstAsync(
    `
    SELECT
      s.*,
      IFNULL(SUM(t.purchase),0) AS totalPurchase,
      IFNULL(SUM(t.payment),0) AS totalPayment,
      IFNULL(SUM(t.purchase),0) - IFNULL(SUM(t.payment),0) AS due
    FROM suppliers s
    LEFT JOIN supplier_transactions t
      ON s.id = t.supplierId
    WHERE s.id = ?
    GROUP BY s.id;
    `,
    [id],
  );

export const getSupplierSummary = async () =>
  await db.getFirstAsync(`
    SELECT
      COUNT(*) AS totalSupplier,

      IFNULL(
        (
          SELECT SUM(purchase)
          FROM supplier_transactions
        ),0
      ) AS totalPurchase,

      IFNULL(
        (
          SELECT SUM(payment)
          FROM supplier_transactions
        ),0
      ) AS totalPayment,

      IFNULL(
        (
          SELECT SUM(purchase)
          FROM supplier_transactions
        ),0
      )
      -
      IFNULL(
        (
          SELECT SUM(payment)
          FROM supplier_transactions
        ),0
      ) AS totalDue
    FROM suppliers
    WHERE IFNULL(isActive,1)=1
  `);

export const getSupplierTransactions = async (supplierId) =>
  await db.getAllAsync(
    `
    SELECT *
    FROM supplier_transactions
    WHERE supplierId=?
    ORDER BY date DESC,id DESC;
`,
    [supplierId],
  );

export const insertSupplierTransaction = async ({
  supplierId,
  purchase,
  payment,
  description,
  invoiceNo,
  date,
  createdAt,
}) => {
  const result = await db.runAsync(
    `
INSERT INTO supplier_transactions
(
supplierId,
purchase,
payment,
description,
invoiceNo,
date,
createdAt
)
VALUES(?,?,?,?,?,?,?)
`,
    [
      supplierId,
      purchase,
      payment,
      description,
      invoiceNo ?? '',
      date,
      createdAt,
    ],
  );
  await db.runAsync('UPDATE suppliers SET updatedAt=? WHERE id=?', [
    createdAt,
    supplierId,
  ]);
  return result;
};

export const updateSupplierTransaction = async ({
  id,
  purchase,
  payment,
  description,
  invoiceNo,
  date,
}) => {
  const result = await db.runAsync(
    `
UPDATE supplier_transactions

SET

purchase=?,
payment=?,
description=?,
invoiceNo=?,
date=?

WHERE id=?`,
    [purchase, payment, description, invoiceNo ?? '', date, id],
  );
  await db.runAsync(
    `UPDATE suppliers SET updatedAt=? WHERE id=(
      SELECT supplierId FROM supplier_transactions WHERE id=?
    )`,
    [currentTimestamp(), id],
  );
  return result;
};

export const deleteSupplierTransaction = async (id) => {
  const transaction = await db.getFirstAsync(
    'SELECT supplierId FROM supplier_transactions WHERE id=?',
    [id],
  );
  const result = await db.runAsync(
    `
DELETE FROM supplier_transactions
WHERE id=?`,
    [id],
  );
  if (transaction) {
    await db.runAsync('UPDATE suppliers SET updatedAt=? WHERE id=?', [
      currentTimestamp(),
      transaction.supplierId,
    ]);
  }
  return result;
};

/* ===================== NOTES ===================== */
export const getAllNotes = async () =>
  await db.getAllAsync(`
    SELECT * FROM notes
    ORDER BY pinned DESC, datetime(updatedAt) DESC, datetime(createdAt) DESC;
  `);

export const insertNote = async ({
  title,
  content,
  noteType,
  isLocked,
  pinned,
  createdAt,
  updatedAt,
}) =>
  await db.runAsync(
    'INSERT INTO notes (title, content, noteType, isLocked, pinned, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?);',
    [title, content, noteType || 'text', isLocked ? 1 : 0, pinned, createdAt, updatedAt],
  );

export const updateNote = async ({
  id,
  title,
  content,
  noteType,
  isLocked,
  pinned,
  updatedAt,
}) =>
  await db.runAsync(
    'UPDATE notes SET title=?, content=?, noteType=?, isLocked=?, pinned=?, updatedAt=? WHERE id=?;',
    [title, content, noteType || 'text', isLocked ? 1 : 0, pinned, updatedAt, id],
  );

export const deleteNoteById = async (id) =>
  await db.runAsync('DELETE FROM notes WHERE id=?;', [id]);

/* ===================== CASH MEMOS ===================== */
const parseMemo = (memo) => ({
  ...memo,
  items: JSON.parse(memo.items || '[]'),
});

export const getAllMemos = async () => {
  const rows = await db.getAllAsync(
    'SELECT * FROM cash_memos ORDER BY date DESC, id DESC;',
  );
  return rows.map(parseMemo);
};

export const getMemoById = async (id) => {
  const memo = await db.getFirstAsync(
    'SELECT * FROM cash_memos WHERE id=?;',
    [id],
  );
  return memo ? parseMemo(memo) : null;
};

export const insertMemo = async ({
  customerName,
  phone,
  address,
  note,
  date,
  items = [],
  discountValue = 0,
  discountType = 'fixed',
  shopName = '',
  shopPhone = '',
  shopAddress = '',
  shopDescription = '',
  createdAt,
  updatedAt,
}) => {
  const timestamp = currentTimestamp();
  return db.runAsync(
    `INSERT INTO cash_memos
      (customerName, phone, address, note, date, items, discountValue, discountType,
       shopName, shopPhone, shopAddress, shopDescription, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      customerName || '',
      phone || '',
      address || '',
      note || '',
      date,
      JSON.stringify(items),
      Number(discountValue) || 0,
      discountType === 'percent' ? 'percent' : 'fixed',
      shopName,
      shopPhone,
      shopAddress,
      shopDescription,
      createdAt || timestamp,
      updatedAt || createdAt || timestamp,
    ],
  );
};

export const updateMemo = async ({
  id,
  customerName,
  phone,
  address,
  note,
  date,
  items,
  discountValue,
  discountType,
  shopName,
  shopPhone,
  shopAddress,
  shopDescription,
}) =>
  db.runAsync(
    `UPDATE cash_memos
     SET customerName=?, phone=?, address=?, note=?, date=?, items=?,
         discountValue=?, discountType=?, shopName=?, shopPhone=?, shopAddress=?,
         shopDescription=?, updatedAt=?
     WHERE id=?;`,
    [
      customerName || '',
      phone || '',
      address || '',
      note || '',
      date,
      JSON.stringify(items || []),
      Number(discountValue) || 0,
      discountType === 'percent' ? 'percent' : 'fixed',
      shopName || '',
      shopPhone || '',
      shopAddress || '',
      shopDescription || '',
      currentTimestamp(),
      id,
    ],
  );

export const deleteMemoById = async (id) =>
  db.runAsync('DELETE FROM cash_memos WHERE id=?;', [id]);

export const getShopProfile = async () =>
  db.getFirstAsync('SELECT * FROM memo_shop_profile WHERE id=1;');

export const saveShopProfile = async ({ name, phone, address, description }) =>
  db.runAsync(
    `INSERT INTO memo_shop_profile (id, name, phone, address, description, updatedAt)
     VALUES (1, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       name=excluded.name,
       phone=excluded.phone,
       address=excluded.address,
       description=excluded.description,
       updatedAt=excluded.updatedAt;`,
    [
      name.trim(),
      phone.trim(),
      address.trim(),
      description.trim(),
      currentTimestamp(),
    ],
  );

export default db;

/* ===================== CUSTOMERS ===================== */

export const getAllCustomers = async () =>
  await db.getAllAsync(`
    SELECT
      c.*,
      IFNULL(SUM(t.sale),0) AS totalSale,
      IFNULL(SUM(t.payment),0) AS totalPayment,
      IFNULL(SUM(t.sale),0) - IFNULL(SUM(t.payment),0) AS due
    FROM customers c
    LEFT JOIN customer_transactions t ON c.id = t.customerId
    WHERE IFNULL(c.isActive,1) = 1
    GROUP BY c.id
    ORDER BY datetime(c.createdAt) DESC;
  `);

export const getAllCustomersIncludingInactive = async () =>
  await db.getAllAsync(`
    SELECT
      c.*,
      IFNULL(SUM(t.sale),0) AS totalSale,
      IFNULL(SUM(t.payment),0) AS totalPayment,
      IFNULL(SUM(t.sale),0) - IFNULL(SUM(t.payment),0) AS due
    FROM customers c
    LEFT JOIN customer_transactions t ON c.id = t.customerId
    GROUP BY c.id
    ORDER BY datetime(c.createdAt) DESC;
  `);

export const getCustomerById = async (id) =>
  await db.getFirstAsync(
    `
    SELECT
      c.*,
      IFNULL(SUM(t.sale),0) AS totalSale,
      IFNULL(SUM(t.payment),0) AS totalPayment,
      IFNULL(SUM(t.sale),0) - IFNULL(SUM(t.payment),0) AS due
    FROM customers c
    LEFT JOIN customer_transactions t ON c.id = t.customerId
    WHERE c.id = ?
    GROUP BY c.id;
    `,
    [id],
  );

export const getCustomerByPhone = async (phone) => {
  if (!phone || !phone.trim()) return null;
  return await db.getFirstAsync('SELECT * FROM customers WHERE phone = ?;', [
    phone.trim(),
  ]);
};

export const getCustomerSummary = async () =>
  await db.getFirstAsync(`
    SELECT
      COUNT(*) AS totalCustomer,
      IFNULL((SELECT SUM(sale) FROM customer_transactions),0) AS totalSale,
      IFNULL((SELECT SUM(payment) FROM customer_transactions),0) AS totalPayment,
      IFNULL((SELECT SUM(sale) FROM customer_transactions),0)
      -
      IFNULL((SELECT SUM(payment) FROM customer_transactions),0) AS totalDue
    FROM customers
    WHERE IFNULL(isActive,1) = 1
  `);

export const insertCustomer = async ({
  name,
  phone,
  address,
  note,
  createdAt,
  profileImagePath,
  prescriptionPhotoPath,
}) => {
  if (!createdAt) throw new Error('createdAt আবশ্যক');
  if (phone && phone.trim()) {
    const existing = await getCustomerByPhone(phone);
    if (existing)
      throw new Error('এই ফোন নম্বর দিয়ে আগে থেকেই একজন কাস্টমার আছে');
  }
  try {
    return await db.runAsync(
      `INSERT INTO customers (name,phone,address,note,profileImagePath,prescriptionPhotoPath,createdAt,updatedAt,isActive) VALUES (?,?,?,?,?,?,?,?,1)`,
      [
        name,
        phone,
        address,
        note,
        profileImagePath ?? null,
        prescriptionPhotoPath ?? null,
        createdAt,
        createdAt,
      ],
    );
  } catch (e) {
    if (e.message?.includes('UNIQUE'))
      throw new Error('এই ফোন নম্বর দিয়ে আগে থেকেই একজন কাস্টমার আছে');
    throw e;
  }
};

export const updateCustomer = async ({
  id,
  name,
  phone,
  address,
  note,
  profileImagePath,
  prescriptionPhotoPath,
}) => {
  const updatedAt = currentTimestamp();
  if (phone && phone.trim()) {
    const existing = await getCustomerByPhone(phone);
    if (existing && existing.id !== id)
      throw new Error('এই ফোন নম্বর দিয়ে আগে থেকেই একজন কাস্টমার আছে');
  }
  try {
    if (profileImagePath !== undefined || prescriptionPhotoPath !== undefined) {
      const current = await getCustomerById(id);
      return await db.runAsync(
        `UPDATE customers SET name=?, phone=?, address=?, note=?, profileImagePath=?, prescriptionPhotoPath=?, updatedAt=? WHERE id=?`,
        [
          name,
          phone,
          address,
          note,
          profileImagePath ?? current?.profileImagePath ?? null,
          prescriptionPhotoPath ?? current?.prescriptionPhotoPath ?? null,
          updatedAt,
          id,
        ],
      );
    }

    return await db.runAsync(
      `UPDATE customers SET name=?, phone=?, address=?, note=?, updatedAt=? WHERE id=?`,
      [name, phone, address, note, updatedAt, id],
    );
  } catch (e) {
    if (e.message?.includes('UNIQUE'))
      throw new Error('এই ফোন নম্বর দিয়ে আগে থেকেই একজন কাস্টমার আছে');
    throw e;
  }
};

export const deleteCustomer = async (id) => {
  const customer = await getCustomerById(id);
  if (customer?.profileImagePath) {
    await deleteProfileImage(customer.profileImagePath);
  }
  if (customer?.prescriptionPhotoPath) {
    await deletePrescriptionImage(customer.prescriptionPhotoPath);
  }
  await db.runAsync(`DELETE FROM customers WHERE id=?`, [id]);
};

export const deactivateCustomer = async (id) =>
  await db.runAsync(
    `UPDATE customers SET isActive=0, updatedAt=? WHERE id=?`,
    [currentTimestamp(), id],
  );

export const activateCustomer = async (id) =>
  await db.runAsync(
    `UPDATE customers SET isActive=1, updatedAt=? WHERE id=?`,
    [currentTimestamp(), id],
  );

/* ===================== CUSTOMER TRANSACTIONS ===================== */

export const getCustomerTransactions = async (customerId) =>
  await db.getAllAsync(
    `SELECT * FROM customer_transactions WHERE customerId=? ORDER BY date DESC, id DESC;`,
    [customerId],
  );

export const insertCustomerTransaction = async ({
  customerId,
  sale,
  payment,
  description,
  invoiceNo,
  date,
  createdAt,
}) => {
  const result = await db.runAsync(
    `INSERT INTO customer_transactions
    (customerId,sale,payment,description,invoiceNo,date,createdAt)
    VALUES(?,?,?,?,?,?,?)`,
    [customerId, sale, payment, description, invoiceNo ?? '', date, createdAt],
  );
  await db.runAsync('UPDATE customers SET updatedAt=? WHERE id=?', [
    createdAt,
    customerId,
  ]);
  return result;
};

export const updateCustomerTransaction = async ({
  id,
  sale,
  payment,
  description,
  invoiceNo,
  date,
}) => {
  const result = await db.runAsync(
    `UPDATE customer_transactions
    SET sale=?, payment=?, description=?, invoiceNo=?, date=?
    WHERE id=?`,
    [sale, payment, description, invoiceNo ?? '', date, id],
  );
  await db.runAsync(
    `UPDATE customers SET updatedAt=? WHERE id=(
      SELECT customerId FROM customer_transactions WHERE id=?
    )`,
    [currentTimestamp(), id],
  );
  return result;
};

export const deleteCustomerTransaction = async (id) => {
  const transaction = await db.getFirstAsync(
    'SELECT customerId FROM customer_transactions WHERE id=?',
    [id],
  );
  const result = await db.runAsync(
    `DELETE FROM customer_transactions WHERE id=?`,
    [id],
  );
  if (transaction) {
    await db.runAsync('UPDATE customers SET updatedAt=? WHERE id=?', [
      currentTimestamp(),
      transaction.customerId,
    ]);
  }
  return result;
};

/* ===================== BACKUP HELPERS ===================== */

export const getAllSupplierTransactionsForBackup = async () =>
  await db.getAllAsync(`SELECT * FROM supplier_transactions ORDER BY id;`);

export const getAllCustomerTransactionsForBackup = async () =>
  await db.getAllAsync(`SELECT * FROM customer_transactions ORDER BY id;`);

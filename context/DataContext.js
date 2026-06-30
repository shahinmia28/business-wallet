import { createContext, useContext, useEffect, useState } from 'react';
import {
  deleteExpenseById,
  deleteIncomeById,
  deleteNoteById,
  getAllExpenses,
  getAllIncomes,
  getAllNotes,
  insertExpense,
  insertIncome,
  insertNote,
  updateExpense,
  updateIncome,
  updateNote,
} from '../database/db';

const DataContext = createContext();

export const DataProvider = ({ children }) => {
  const [expenses, setExpenses] = useState([]);
  const [incomes, setIncomes] = useState([]);
  const [notes, setNotes] = useState([]);

  const fetchData = async () => {
    setExpenses(await getAllExpenses());
    setIncomes(await getAllIncomes());
    setNotes(await getAllNotes());
  };

  useEffect(() => {
    fetchData();
  }, []);

  const addExpense = async (item) => {
    await insertExpense(item);
    fetchData();
  };

  const addIncome = async (item) => {
    await insertIncome(item);
    fetchData();
  };

  const deleteExpense = async (id) => {
    await deleteExpenseById(id);
    fetchData();
  };

  const deleteIncome = async (id) => {
    await deleteIncomeById(id);
    fetchData();
  };

  const editExpense = async (item) => {
    await updateExpense(item);
    fetchData();
  };

  const editIncome = async (item) => {
    await updateIncome(item);
    fetchData();
  };

  // notes
  const addNote = async (note) => {
    await insertNote({
      ...note,
      pinned: note.pinned ?? 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    fetchData();
  };

  const editNote = async (note) => {
    await updateNote({
      ...note,
      updatedAt: new Date().toISOString(),
    });
    fetchData();
  };

  const deleteNote = async (id) => {
    await deleteNoteById(id);
    fetchData();
  };

  return (
    <DataContext.Provider
      value={{
        expenses,
        incomes,
        addExpense,
        addIncome,
        deleteExpense,
        deleteIncome,
        editExpense,
        editIncome,
        notes,
        addNote,
        editNote,
        deleteNote,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);

import { openDB } from 'idb';

export const initDB = async () => {
  return openDB('finanse-db', 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('transactions')) {
        db.createObjectStore('transactions', { keyPath: 'id' });
      }
    }
  });
};

export const saveTransactionToDB = async (transaction) => {
  const db = await initDB();
  await db.put('transactions', transaction);
};

export const getTransactionsFromDB = async () => {
  const db = await initDB();
  return await db.getAll('transactions');
};

export const clearTransactionsFromDB = async () => {
  const db = await initDB();
  await db.clear('transactions');
};

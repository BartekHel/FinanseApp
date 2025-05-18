import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  username: { type: String, required: true },
  type: { type: String, enum: ['income', 'expense'], required: true },
  amount: { type: Number, required: true },
  date: { type: String, required: true }
});

export const Transaction = mongoose.model('Transaction', transactionSchema);

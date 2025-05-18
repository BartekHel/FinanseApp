import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { Transaction } from './models/Transaction.js';
import { BudgetSetting } from './models/BudgetSetting.js';
import { User } from './models/User.js';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
mongoose.connect(process.env.MONGO_URI);

app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;

  try {
    const existing = await User.findOne({ username });
    if (existing) return res.status(409).json({ message: 'Użytkownik już istnieje' });

    const user = new User({ username, password });
    await user.save();
    res.status(201).json({ message: 'Zarejestrowano' });
  } catch (err) {
    res.status(500).json({ message: 'Błąd serwera' });
  }
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });

    if (!user || user.password !== password) {
      return res.status(401).json({ message: 'Nieprawidłowy login lub hasło' });
    }

    res.status(200).json({ message: 'Zalogowano', user: { username } });
  } catch (err) {
    res.status(500).json({ message: 'Błąd serwera' });
  }
});

app.post('/api/transactions', async (req, res) => {
  const { username, type, amount, date } = req.body;

  try {
    const transaction = new Transaction({ username, type, amount, date });
    await transaction.save();
    res.status(201).json({ message: 'Transakcja zapisana' });
  } catch (err) {
    console.error('Błąd zapisu transakcji:', err);
    res.status(500).json({ message: 'Błąd serwera' });
  }
});

app.get('/api/transactions/:username', async (req, res) => {
  try {
    const list = await Transaction.find({ username: req.params.username }).sort({ date: -1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: 'Błąd serwera' });
  }
});

app.delete('/api/transactions/:username', async (req, res) => {
  try {
    const { username } = req.params;
    await Transaction.deleteMany({ username });
    res.status(200).json({ message: 'Usunięto transakcje' });
  } catch (err) {
    res.status(500).json({ message: 'Błąd serwera przy usuwaniu transakcji' });
  }
});

app.post('/api/budget-settings', async (req, res) => {
  const { username, balanceGoal, balanceMilestones, incomeMilestones, expenseMilestones } = req.body;

  try {
    await BudgetSetting.findOneAndUpdate(
      { username },
      {
        balanceGoal,
        balanceMilestones,
        incomeMilestones,
        expenseMilestones
      },
      { upsert: true, new: true }
    );
    res.status(200).json({ message: 'Zapisano ustawienia budżetu' });
  } catch (err) {
    console.error('Błąd zapisu ustawień budżetu:', err);
    res.status(500).json({ message: 'Błąd serwera' });
  }
});

app.get('/api/budget-settings/:username', async (req, res) => {
  try {
    const settings = await BudgetSetting.findOne({ username: req.params.username });
    res.status(200).json(settings || {});
  } catch (err) {
    console.error('Błąd pobierania ustawień budżetu:', err);
    res.status(500).json({ message: 'Błąd serwera' });
  }
});

app.listen(5000, () => console.log('Server działa na http://localhost:5000'));

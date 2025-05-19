const functions = require("firebase-functions");
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const { User } = require("./models/User");
const { Transaction } = require("./models/Transaction");
const { BudgetSetting } = require("./models/BudgetSetting");

require("dotenv").config();
const app = express();

const corsOptions = {
  origin: 'https://finanseapp-270402.web.app',
  methods: ['GET', 'POST', 'DELETE', 'PUT', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

const mongoUri = process.env.MONGO_URI;
mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  ssl: true
}).catch(err => {
  console.error("Błąd MongoDB:", err);
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Wewnętrzny błąd serwera' });
});

app.post('/login', async (req, res) => {
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

app.post('/transactions', async (req, res) => {
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

app.get('/transactions/:username', async (req, res) => {
  try {
    const list = await Transaction.find({ username: req.params.username }).sort({ date: -1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: 'Błąd serwera' });
  }
});

app.delete('/transactions/:username', async (req, res) => {
  try {
    const { username } = req.params;
    await Transaction.deleteMany({ username });
    res.status(200).json({ message: 'Usunięto transakcje' });
  } catch (err) {
    res.status(500).json({ message: 'Błąd serwera przy usuwaniu transakcji' });
  }
});

app.post('/budget-settings', async (req, res) => {
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

app.get('/budget-settings/:username', async (req, res) => {
  try {
    const settings = await BudgetSetting.findOne({ username: req.params.username });
    res.status(200).json(settings || {});
  } catch (err) {
    console.error('Błąd pobierania ustawień budżetu:', err);
    res.status(500).json({ message: 'Błąd serwera' });
  }
});

exports.api = functions.https.onRequest(app);

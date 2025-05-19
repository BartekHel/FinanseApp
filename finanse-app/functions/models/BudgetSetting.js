const mongoose = require("mongoose");

const budgetSettingSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  balanceGoal: { type: Number, default: null },
  balanceMilestones: { type: [Number], default: [] },
  incomeMilestones: { type: [Number], default: [] },
  expenseMilestones: { type: [Number], default: [] }
});

const BudgetSetting = mongoose.model("BudgetSetting", budgetSettingSchema);
module.exports = { BudgetSetting };

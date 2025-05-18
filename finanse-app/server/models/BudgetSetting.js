import mongoose from 'mongoose';

const budgetSettingSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  balanceGoal: { type: Number, default: null },
  balanceMilestones: { type: [Number], default: [] },
  incomeMilestones: { type: [Number], default: [] },
  expenseMilestones: { type: [Number], default: [] }
});

export const BudgetSetting = mongoose.model('BudgetSetting', budgetSettingSchema);

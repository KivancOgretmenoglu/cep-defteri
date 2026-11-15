import type { offBudgetTr } from './offbudget.tr';

/** "Off budget" expenses (big one-off purchases you saved up for) strings (spread into en.ts). */
export const offBudgetEn: Record<keyof typeof offBudgetTr, string> = {
  'ob.toggle': "Off budget",
  'ob.toggleHint': "Not counted toward your monthly budget or category limit; it still comes out of your balance and shows in reports. For one-off big purchases you saved up for, like a guitar.",
  'ob.bigNudge': "This is {pct} of your monthly budget. If it's a one-off you saved up for, you can keep it off budget.",
  'ob.tag': "off budget",
  'ob.tagTitle': "Not counted toward the monthly budget",
  'ob.budgetLine': "Kept off budget: {amount}. Not counted in the figures above; it did come out of your balance.",
  'csv.offBudget': "Off budget",
};

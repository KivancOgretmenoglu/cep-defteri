/** Completion rings and real-progress messages (English). */
export const ringsEn = {
  'rings.label': "Month progress",
  'rings.elapsed': "Month elapsed",
  'rings.budget': "Budget",
  'rings.goal': "Goal",
  'rings.elapsedAlt': "{pct}% of the month has passed.",
  'rings.budgetAlt': "{pct}% of the budget used.",
  'rings.budgetAltAmt': "{pct}% of the budget used: {spent} / {budget}.",
  'rings.budgetOver': "Over budget ({pct}%).",
  'rings.budgetOverAmt': "Over budget: {spent} / {budget}.",
  'rings.goalAlt': "{pct}% of the \"{goal}\" goal reached.",
  'rings.goalAltAmt': "\"{goal}\" goal: {cur} / {target} ({pct}%).",
  'rings.goalDone': "Goal \"{goal}\" reached.",
  'rings.pctShort': "{pct}%",
  'mood.better.text': "You've spent {amount} less than at this point last month.",
  'mood.better.textHidden': "You've spent less than at this point last month.",
  'mood.better.why': "Rule: this month's spending is at least 10% below last month's spending up to the same day (refunds deducted, both months within tracking).",
} satisfies Record<string, string>;

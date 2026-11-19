import type { growthTr } from './growth.tr';

/** Subscription finder, weekly summary notification, review prompt and in-app update strings. */
export const growthEn: Record<keyof typeof growthTr, string> = {
  'rec.title': "Looks like regular payments",
  'rec.intro': "These repeat every month on about the same day for about the same amount. Make them a plan and your spendable money sets the next payment aside in advance, with a reminder the day before.",
  'rec.line': "Monthly around day {day} · for {months} months",
  'rec.make': "Make a plan",
  'rec.dismiss': "Not a subscription",
  'rec.dismissed': "Got it, I won't suggest this again",

  'notif.weekTitle': "Your week",
  'notif.weekBody': "You spent {amount} this week{cmp}.{top}",
  'notif.weekLess': " · {pct} less than last week 👏",
  'notif.weekMore': " · {pct} more than last week",
  'notif.weekTop': " Top: {cat}.",
  'ns.weekly': "Weekly summary",
  'ns.weeklyHint': "Sunday at 8 pm: this week's spending and how it compares to last week.",

  'upd.toastReady': "New version downloaded",
  'upd.restart': "Restart",
};

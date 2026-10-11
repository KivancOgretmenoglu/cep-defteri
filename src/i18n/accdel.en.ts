/** Archive confirmation, archived investment accounts and deleting an account with its history (spread into en.ts). */
import { plural } from './grammar';

export const accdelEn = {
  'accdel.err.daily': "Daily accounts can't be deleted with their history (your expenses would go too). You can archive them.",
  'accdel.deleteAll': "Delete account and its history",
  'accdel.confirmTitle': "Delete this account?",
  'accdel.confirmLead': "\"{name}\" and these linked records will be deleted:",
  'accdel.cnt.transfers': (v: { n?: string | number }) => plural(v.n ?? 0, 'transfer'),
  'accdel.cnt.otherTx': (v: { n?: string | number }) => `${plural(v.n ?? 0, 'other entry', 'other entries')} (refunds included)`,
  'accdel.cnt.valuations': (v: { n?: string | number }) => plural(v.n ?? 0, 'value update'),
  'accdel.cnt.plans': (v: { n?: string | number }) => plural(v.n ?? 0, 'plan'),
  'accdel.cnt.goals': (v: { n?: string | number }) => plural(v.n ?? 0, 'goal'),
  'accdel.balanceNote': "Once transfers to and from this account are deleted, your daily account balances change accordingly.",
  'accdel.effectUp': "{name} balance goes up by {amount}",
  'accdel.effectDown': "{name} balance goes down by {amount}",
  'accdel.noEffect': "Your daily account balances won't change.",
  'accdel.undoHint': "You can undo for a few seconds after deleting; a backup is a good idea for later.",
  'accdel.confirmBtn': "Yes, delete everything",
  'accdel.archiveTitle': "Archive this account?",
  'accdel.archiveBody': "This account still holds {amount}. Archived accounts are hidden from lists and totals; you can restore it any time.",
  'accdel.archiveBtn': "Archive",
  'accdel.archivedNoteInv': "This account is archived: it's hidden from the investment list and the total investment value; its history is kept.",
  'accdel.archivedSection': "Archived accounts ({n})",
  'accdel.archivedBanner': "This account is archived; it's hidden from lists and totals.",
  'accdel.backToActive': "Back to active accounts",
};

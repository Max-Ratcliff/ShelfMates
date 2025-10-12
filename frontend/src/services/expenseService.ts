/**
 * Expense service
 *
 * This file provides a thin Firestore-backed service for creating and
 * subscribing to Expense (ledger) documents and Payments. The goal is
 * to have a canonical, client-visible ledger that other UI pieces can
 * read from. For strong guarantees you should add server-side
 * validation or Cloud Functions to canonicalize and process requests.
 *
 * Money is represented as integer cents (minor units) to avoid floating
 * point rounding mistakes. All helper functions in this file accept and
 * return cents for amounts.
 */
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  doc,
  setDoc,
  getDocs,
  writeBatch,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

// -----------------------------
// Type definitions / interfaces
// -----------------------------

/** Per-user amount inside an expense. */
export interface ExpenseEntry {
  userId: string;
  amountCents: number; // integer cents
  settledCents?: number; // how much of this entry has been paid
}

/** The canonical expense doc stored in Firestore. */
export interface Expense {
  id: string;
  householdId: string;
  createdBy: string;
  payerId: string;
  totalCents: number;
  currency?: string;
  participants: string[]; // list of user ids
  method?: 'equal' | 'shares' | 'custom' | 'payer';
  shares?: Record<string, number> | null; // relative weights when method == 'shares'
  customAmounts?: Record<string, number> | null; // cents when method == 'custom'
  entries: ExpenseEntry[]; // canonical per-user decomposition
  roundingAdjustmentCents?: number;
  note?: string;
  status?: 'open' | 'partially_settled' | 'settled' | 'cancelled';
  createdAt?: any; // Firestore timestamp
  processedAt?: any | null;
}

/** Data required to create an expense. `entries` may be omitted and
 * computed by backend/cloud function if you prefer server-side canonicalization.
 */
export interface ExpenseCreate {
  householdId: string;
  createdBy: string;
  payerId: string;
  totalCents: number;
  currency?: string;
  participants?: string[];
  method?: 'equal' | 'shares' | 'custom' | 'payer';
  shares?: Record<string, number> | null;
  customAmounts?: Record<string, number> | null;
  entries?: ExpenseEntry[]; // optional - if omitted the client or server should compute
  note?: string;
  itemId?: string | null; // optional link to an item
}

/** Payment structure to record settlement. */
export interface PaymentApply {
  expenseId: string; // expense being settled
  userId: string; // which entry in expense
  amountCents: number; // cents applied
}

export interface Payment {
  id: string;
  householdId: string;
  fromUser: string;
  toUser: string;
  totalCents: number;
  currency?: string;
  appliesTo?: PaymentApply[];
  note?: string;
  status?: 'pending' | 'completed' | 'failed';
  createdAt?: any;
}

// -----------------------------
// Firestore collection helpers
// -----------------------------

const expensesColl = (householdId: string) => collection(db, 'households', householdId, 'expenses');
const paymentsColl = (householdId: string) => collection(db, 'households', householdId, 'payments');

// -----------------------------
// Public service functions
// -----------------------------

/**
 * Create an expense document. This function writes a canonical expense
 * doc to `households/{houseId}/expenses`. It does NOT update balances;
 * for small projects you can use Firestore transactions on the client,
 * or add server-side Cloud Functions to process the expense and update
 * `balances` documents.
 */
export async function createExpense(expense: ExpenseCreate): Promise<string> {
  const docRef = await addDoc(expensesColl(expense.householdId), {
    createdBy: expense.createdBy,
    payerId: expense.payerId,
    totalCents: expense.totalCents,
    currency: expense.currency || 'USD',
    participants: expense.participants || [],
    method: expense.method || 'equal',
    shares: expense.shares || null,
    customAmounts: expense.customAmounts || null,
    entries: expense.entries || [],
    note: expense.note || null,
    status: 'open',
    itemId: expense.itemId || null,
    createdAt: serverTimestamp(),
    processedAt: null,
  });

  return docRef.id;
}

/**
 * Update an existing expense document. Partial fields may be provided.
 */
export async function updateExpense(householdId: string, expenseId: string, changes: Partial<Expense>) {
  const ref = doc(db, 'households', householdId, 'expenses', expenseId);
  // stamp an updatedAt field for tracking
  await updateDoc(ref, {
    ...changes,
    updatedAt: serverTimestamp(),
  } as any);
}

/**
 * Delete an expense document.
 */
export async function deleteExpense(householdId: string, expenseId: string) {
  const ref = doc(db, 'households', householdId, 'expenses', expenseId);
  await deleteDoc(ref);
}

/**
 * Subscribe to expenses for a household. Calls the callback with the
 * latest list any time the collection changes.
 */
export function subscribeToExpenses(householdId: string, callback: (expenses: Expense[]) => void) {
  const q = query(expensesColl(householdId), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const items: Expense[] = snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
    callback(items);
  });
}

/**
 * Get expense documents for a given item (one-time fetch).
 */
export async function getExpensesByItem(householdId: string, itemId: string): Promise<Expense[]> {
  const q = query(expensesColl(householdId), where('itemId', '==', itemId), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
}

/**
 * Create a payment record and optionally apply it to multiple expenses.
 * This function just writes the payment record. Applying the payment to
 * split entries and updating balances should be done server-side or in a
 * Firestore transaction to avoid race conditions.
 */
export async function createPayment(payment: Omit<Payment, 'id' | 'createdAt' | 'status'>) {
  const docRef = await addDoc(paymentsColl(payment.householdId), {
    fromUser: payment.fromUser,
    toUser: payment.toUser,
    totalCents: payment.totalCents,
    currency: payment.currency || 'USD',
    appliesTo: payment.appliesTo || null,
    note: payment.note || null,
    status: 'completed',
    createdAt: serverTimestamp(),
  });

  return docRef.id;
}

/**
 * Helper to write an expense and a corresponding payment atomically using
 * a batched write. Useful for UIs where the payer records both expense and
 * immediate self-payment in one action. NOTE: this does not update balances.
 */
export async function createExpenseWithPayment(expense: ExpenseCreate, payment?: Omit<Payment, 'id' | 'createdAt' | 'status'>) {
  // Use a write batch to write both docs together.
  const batch = writeBatch(db);
  const expRef = doc(expensesColl(expense.householdId));
  batch.set(expRef, {
    createdBy: expense.createdBy,
    payerId: expense.payerId,
    totalCents: expense.totalCents,
    currency: expense.currency || 'USD',
    participants: expense.participants || [],
    method: expense.method || 'equal',
    shares: expense.shares || null,
    customAmounts: expense.customAmounts || null,
    entries: expense.entries || [],
    note: expense.note || null,
    status: 'open',
    itemId: expense.itemId || null,
    createdAt: serverTimestamp(),
    processedAt: null,
  });

  if (payment) {
    const payRef = doc(paymentsColl(payment.householdId));
    batch.set(payRef, {
      fromUser: payment.fromUser,
      toUser: payment.toUser,
      totalCents: payment.totalCents,
      currency: payment.currency || 'USD',
      appliesTo: payment.appliesTo || null,
      note: payment.note || null,
      status: 'completed',
      createdAt: serverTimestamp(),
    });
  }

  await batch.commit();
}

export default {
  createExpense,
  subscribeToExpenses,
  getExpensesByItem,
  createPayment,
  createExpenseWithPayment,
};

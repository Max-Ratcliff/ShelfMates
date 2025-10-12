import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useHousehold } from '@/contexts/HouseholdContext';
import { useAuth } from '@/contexts/AuthContext';
import { createPayment, updateExpense, deleteExpense } from '@/services/expenseService';
import { toast } from 'sonner';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { subscribeToExpenses } from '@/services/expenseService';

interface MemberSummary {
  id: string;
  name: string;
  netCents: number; // placeholder; you should compute or read balances from server
}

export default function BalancesTab() {
  const { householdId, userData } = useHousehold();
  const [members, setMembers] = useState<MemberSummary[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [expenses, setExpenses] = useState<any[]>([]);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!householdId) return;

    // Fetch household members (simple one-time read)
    const fetchMembers = async () => {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('household_id', '==', householdId));
      const snap = await getDocs(q);
      const list = snap.docs.map((d) => ({ id: d.id, name: (d.data() as any).name || 'User' }));
      // initialize netCents to 0 — replace with real balances later
      const summaries = list.map((m) => ({ ...m, netCents: 0 }));
      // sort alphabetically
      summaries.sort((a, b) => a.name.localeCompare(b.name));
      setMembers(summaries);
    };

    fetchMembers();

    // Subscribe to expenses for the household and keep a flat list (used to show per-member items)
    const unsub = subscribeToExpenses(householdId, (items) => {
      setExpenses(items);
    });

    return () => unsub?.();
  }, [householdId]);

  // Recompute net balances whenever expenses or members change
  useEffect(() => {
    if (!members || members.length === 0) return;
    // build a map of member id -> net cents
    const map: Record<string, number> = {};
    members.forEach((m) => (map[m.id] = 0));

    for (const exp of expenses) {
      const payer = exp.payerId;
      // If entries are present, use them. Otherwise, try to compute equal split.
      const entries = exp.entries && exp.entries.length ? exp.entries : (() => {
        const parts = exp.participants || [];
        const total = exp.totalCents || 0;
        if (!parts.length) return [];
        const share = Math.floor(total / parts.length);
        const remainder = total - share * parts.length;
        return parts.map((uid: string, idx: number) => ({ userId: uid, amountCents: share + (idx === 0 ? remainder : 0) }));
      })();

      for (const entry of entries) {
        if (!entry || !entry.userId) continue;
        const uid = entry.userId;
        const amt = entry.amountCents || 0;
        const settled = entry.settledCents || 0;
        const outstanding = Math.max(0, amt - settled);

        if (uid === payer) {
          // payer's own entry: ignore their own share
          continue;
        }

        // participant owes outstanding; payer is owed outstanding
        map[uid] = (map[uid] || 0) - outstanding;
        map[payer] = (map[payer] || 0) + outstanding;
      }
    }

    // update members netCents in state
    setMembers((prev) => prev.map((m) => ({ ...m, netCents: map[m.id] || 0 })));
  }, [expenses, members]);

  // Helper to get expenses related to a member (they owe or they are owed)
  const expensesForMember = (memberId: string) =>
    expenses.filter((exp: any) => exp.participants?.includes(memberId) || exp.payerId === memberId);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Grocery Balances</h2>

      <div className="space-y-3">
        {members.map((m) => {
          const memberExpenses = expensesForMember(m.id);
          const oweAmount = m.netCents < 0 ? Math.abs(m.netCents) : 0;
          const owedTo = m.netCents > 0 ? m.netCents : 0;
          return (
            <Card key={m.id} className="border">
              <CardHeader className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  <Avatar>
                    <AvatarFallback>{m.name.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{m.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {m.netCents < 0 ? `$${(oweAmount/100).toFixed(2)} · owes you` : `$${(owedTo/100).toFixed(2)} · they owe you`}
                    </p>
                  </div>
                </div>
                <button
                  className="rounded p-2"
                  onClick={() => setExpanded((s) => ({ ...s, [m.id]: !s[m.id] }))}
                  aria-label="Toggle member expenses"
                >
                  {expanded[m.id] ? <ChevronUp /> : <ChevronDown />}
                </button>
              </CardHeader>

              {expanded[m.id] && (
                <CardContent>
                  {memberExpenses.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No current expenses for this member.</p>
                  ) : (
                    <div className="space-y-2">
                      {memberExpenses.map((e: any) => (
                        <div key={e.id} className="flex items-center justify-between rounded-md bg-muted/30 p-3">
                          <div>
                            <p className="font-medium">{e.note || 'Expense'}</p>
                            <p className="text-sm text-muted-foreground">Paid by {e.payerId}</p>
                            {/* show per-entry outstanding info when applicable */}
                            {currentUser && (() => {
                              const myEntry = (e.entries || []).find((en: any) => en.userId === currentUser.uid);
                              if (myEntry) {
                                const owed = myEntry.amountCents || 0;
                                const settled = myEntry.settledCents || 0;
                                const outstanding = Math.max(0, owed - settled);
                                return (
                                  <p className="text-sm text-muted-foreground">{settled >= owed ? 'Settled' : `$${(outstanding/100).toFixed(2)} outstanding`}</p>
                                );
                              }
                              return null;
                            })()}
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">${(e.totalCents/100).toFixed(2)}</p>
                            <p className="text-sm text-muted-foreground">{e.status}</p>
                            {/* show mark-as-paid button if currentUser owes and there is outstanding amount */}
                            {currentUser && (() => {
                              const myEntry = (e.entries || []).find((en: any) => en.userId === currentUser.uid);
                              if (myEntry) {
                                const owed = myEntry.amountCents || 0;
                                const settled = myEntry.settledCents || 0;
                                const outstanding = Math.max(0, owed - settled);
                                if (outstanding > 0) {
                                  return (
                                    <button
                                      className="mt-2 inline-flex items-center gap-2 rounded bg-primary px-3 py-1 text-white"
                                      onClick={async () => {
                                        try {
                                          // create a payment record from current user to the payer
                                          await createPayment({
                                            householdId: householdId!,
                                            fromUser: currentUser.uid,
                                            toUser: e.payerId,
                                            totalCents: outstanding,
                                            appliesTo: [{ expenseId: e.id, userId: currentUser.uid, amountCents: outstanding }],
                                          });

                                          // update the expense entry's settledCents and deduct from total
                                          const updatedEntries = (e.entries || []).map((en: any) => {
                                            if (en.userId === currentUser.uid) {
                                              return { ...en, settledCents: (en.settledCents || 0) + outstanding };
                                            }
                                            return en;
                                          });

                                          // deduct the paid share from totalCents
                                          const newTotal = Math.max(0, (e.totalCents || 0) - outstanding);

                                          // check if all entries are fully settled
                                          const allSettled = updatedEntries.every((en: any) => (en.amountCents || 0) <= (en.settledCents || 0));

                                          if (allSettled || newTotal === 0) {
                                            // everyone has paid — remove the expense entirely
                                            try {
                                              await deleteExpense(householdId!, e.id);
                                              toast.success('Expense fully settled and removed');
                                            } catch (delErr: any) {
                                              console.error('Failed to delete settled expense', delErr);
                                              toast.error(`Failed to remove expense: ${delErr?.message || delErr}`);
                                            }
                                          } else {
                                            // partial settlement — update entries, total and status
                                            const newStatus = 'partially_settled';
                                            await updateExpense(householdId!, e.id, { entries: updatedEntries, totalCents: newTotal, status: newStatus } as any);
                                            toast.success('Payment recorded');
                                          }
                                        } catch (err: any) {
                                          console.error('Failed to mark paid', err);
                                          toast.error(`Failed to record payment: ${err?.message || err}`);
                                        }
                                      }}
                                    >
                                      Mark as paid
                                    </button>
                                  );
                                }
                              }
                              return null;
                            })()}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, Trash2, TrendingUp, TrendingDown, CheckCircle2 } from 'lucide-react';
import { useHousehold } from '@/contexts/HouseholdContext';
import { useAuth } from '@/contexts/AuthContext';
import { createPayment, updateExpense, deleteExpense } from '@/services/expenseService';
import { toast } from 'sonner';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { subscribeToExpenses } from '@/services/expenseService';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

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

  // Recompute pairwise balances between current user and each member
  useEffect(() => {
    if (!members || members.length === 0 || !currentUser) return;

    const map: Record<string, number> = {};
    members.forEach((m) => (map[m.id] = 0));

    for (const exp of expenses) {
      const entries = exp.entries && exp.entries.length ? exp.entries : (() => {
        const parts = exp.participants || [];
        const total = exp.totalCents || 0;
        if (!parts.length) return [];
        const share = Math.floor(total / parts.length);
        const remainder = total - share * parts.length;
        return parts.map((uid: string, idx: number) => ({ userId: uid, amountCents: share + (idx === 0 ? remainder : 0) }));
      })();

      // For each member, calculate their balance relative to current user
      for (const member of members) {
        if (member.id === currentUser.uid) continue; // skip self

        const memberEntry = entries.find((e: any) => e.userId === member.id);
        const currentUserEntry = entries.find((e: any) => e.userId === currentUser.uid);

        // Case 1: Current user is payer, member is participant
        if (exp.payerId === currentUser.uid && memberEntry) {
          const memberOwes = (memberEntry.amountCents || 0) - (memberEntry.settledCents || 0);
          map[member.id] = (map[member.id] || 0) + memberOwes; // positive = they owe me
        }

        // Case 2: Member is payer, current user is participant
        if (exp.payerId === member.id && currentUserEntry) {
          const iOwe = (currentUserEntry.amountCents || 0) - (currentUserEntry.settledCents || 0);
          map[member.id] = (map[member.id] || 0) - iOwe; // negative = I owe them
        }
      }
    }

    // update members netCents in state
    // positive = they owe me, negative = I owe them
    setMembers((prev) => prev.map((m) => ({ ...m, netCents: map[m.id] || 0 })));
  }, [expenses, currentUser, members.length]); // Re-run when members array length changes

  // Helper to get expenses related to a member (they owe or they are owed)
  const expensesForMember = (memberId: string) =>
    expenses.filter((exp: any) => exp.participants?.includes(memberId) || exp.payerId === memberId);

  // Compute summary totals
  // Positive netCents = they owe me
  // Negative netCents = I owe them
  const totalOwedToYou = members
    .filter(m => m.netCents > 0)
    .reduce((sum, m) => sum + m.netCents, 0);

  const totalYouOwe = members
    .filter(m => m.netCents < 0)
    .reduce((sum, m) => sum + Math.abs(m.netCents), 0);

  const netBalance = totalOwedToYou - totalYouOwe;

  // Separate members into categories
  const membersIOwe = members
    .filter(m => m.netCents < 0)
    .sort((a, b) => a.netCents - b.netCents); // Most negative (highest debt) first

  const membersThatOweMe = members
    .filter(m => m.netCents > 0)
    .sort((a, b) => b.netCents - a.netCents); // Highest amount first

  const settledMembers = members
    .filter(m => m.netCents === 0)
    .sort((a, b) => a.name.localeCompare(b.name));

  // Toggle for settled section
  const [showSettled, setShowSettled] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Grocery Balances</h2>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">You Owe</p>
                <p className="text-2xl font-bold text-destructive">${(totalYouOwe / 100).toFixed(2)}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-destructive opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-500/30 bg-green-500/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Owed to You</p>
                <p className="text-2xl font-bold text-green-600">${(totalOwedToYou / 100).toFixed(2)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className={netBalance === 0 ? "border-muted" : netBalance > 0 ? "border-green-500/30 bg-green-500/5" : "border-destructive/30 bg-destructive/5"}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Net Balance</p>
                <p className={`text-2xl font-bold ${netBalance === 0 ? "text-muted-foreground" : netBalance > 0 ? "text-green-600" : "text-destructive"}`}>
                  {netBalance === 0 ? "$0.00" : `${netBalance > 0 ? '+' : ''}$${(netBalance / 100).toFixed(2)}`}
                </p>
              </div>
              {netBalance === 0 ? (
                <CheckCircle2 className="h-8 w-8 text-muted-foreground opacity-50" />
              ) : netBalance > 0 ? (
                <TrendingUp className="h-8 w-8 text-green-600 opacity-50" />
              ) : (
                <TrendingDown className="h-8 w-8 text-destructive opacity-50" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Empty state */}
      {members.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <CheckCircle2 className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-lg font-medium text-muted-foreground">No household members yet</p>
            <p className="text-sm text-muted-foreground mt-1">Invite members to start tracking expenses</p>
          </CardContent>
        </Card>
      )}

      {/* All settled state */}
      {members.length > 0 && totalYouOwe === 0 && totalOwedToYou === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <CheckCircle2 className="h-12 w-12 mx-auto text-green-600 mb-3" />
            <p className="text-lg font-medium">All Settled!</p>
            <p className="text-sm text-muted-foreground mt-1">Everyone has paid their share</p>
          </CardContent>
        </Card>
      )}

      {/* ACTION NEEDED SECTION - Debts you need to pay */}
      {membersIOwe.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-destructive">⚠️ Action Needed</h3>
            <Badge variant="destructive">{membersIOwe.length}</Badge>
          </div>
          {membersIOwe.map((m) => {
            // Get expenses where I owe this member (they were the payer)
            const relevantExpenses = expenses.filter(exp =>
              exp.payerId === m.id &&
              currentUser &&
              exp.entries?.some((e: any) =>
                e.userId === currentUser.uid &&
                ((e.amountCents || 0) - (e.settledCents || 0)) > 0
              )
            );

            const oweAmount = Math.abs(m.netCents);

            return (
              <Card key={m.id} className="border-destructive/30 bg-destructive/5">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12 mt-1">
                      <AvatarFallback className="bg-destructive text-destructive-foreground">
                        {m.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      {/* Header */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div>
                          <p className="font-semibold text-lg">You Owe {m.name}</p>
                          <p className="text-2xl font-bold text-destructive">${(oweAmount / 100).toFixed(2)}</p>
                        </div>
                      </div>

                      {/* Inline Expense Chips */}
                      {relevantExpenses.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {relevantExpenses.map((exp: any) => {
                            const myEntry = exp.entries?.find((e: any) => e.userId === currentUser?.uid);
                            const myOutstanding = myEntry
                              ? (myEntry.amountCents || 0) - (myEntry.settledCents || 0)
                              : 0;

                            return (
                              <Badge key={exp.id} variant="outline" className="px-3 py-1 text-sm border-destructive/30">
                                {exp.note || 'Expense'} ${(myOutstanding / 100).toFixed(2)}
                              </Badge>
                            );
                          })}
                        </div>
                      )}

                      {/* Action Button */}
                      <div className="flex justify-end">
                        <button
                          className="inline-flex items-center gap-2 rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90"
                          onClick={async () => {
                            if (!currentUser || !householdId) return;

                            try {
                              // Mark all outstanding expenses with this person as paid
                              for (const exp of relevantExpenses) {
                                const myEntry = exp.entries?.find((e: any) => e.userId === currentUser.uid);
                                if (!myEntry) continue;

                                const outstanding = (myEntry.amountCents || 0) - (myEntry.settledCents || 0);
                                if (outstanding <= 0) continue;

                                await createPayment({
                                  householdId: householdId,
                                  fromUser: currentUser.uid,
                                  toUser: exp.payerId,
                                  totalCents: outstanding,
                                  appliesTo: [{ expenseId: exp.id, userId: currentUser.uid, amountCents: outstanding }],
                                });

                                const updatedEntries = exp.entries.map((en: any) => {
                                  if (en.userId === currentUser.uid) {
                                    return { ...en, settledCents: (en.settledCents || 0) + outstanding };
                                  }
                                  return en;
                                });

                                const allSettled = updatedEntries.every((en: any) =>
                                  (en.settledCents || 0) >= (en.amountCents || 0)
                                );

                                if (allSettled) {
                                  await deleteExpense(householdId, exp.id);
                                } else {
                                  await updateExpense(householdId, exp.id, {
                                    entries: updatedEntries,
                                    status: 'partially_settled'
                                  } as any);
                                }
                              }

                              toast.success(`Paid $${(oweAmount / 100).toFixed(2)} to ${m.name}`);
                            } catch (err: any) {
                              console.error('Failed to mark paid', err);
                              toast.error(`Failed to record payment: ${err?.message || err}`);
                            }
                          }}
                        >
                          Mark All Paid
                        </button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* AWAITING PAYMENT SECTION - Money owed to you */}
      {membersThatOweMe.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-green-600">💰 Awaiting Payment</h3>
            <Badge className="bg-green-600 hover:bg-green-700">{membersThatOweMe.length}</Badge>
          </div>
          {membersThatOweMe.map((m) => {
            // Get expenses where this member owes me (I was the payer)
            const relevantExpenses = expenses.filter(exp =>
              exp.payerId === currentUser?.uid &&
              exp.entries?.some((e: any) =>
                e.userId === m.id &&
                ((e.amountCents || 0) - (e.settledCents || 0)) > 0
              )
            );

            const owedAmount = m.netCents;

            return (
              <Card key={m.id} className="border-green-500/30 bg-green-500/5">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12 mt-1">
                      <AvatarFallback className="bg-green-600 text-white">
                        {m.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      {/* Header */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div>
                          <p className="font-semibold text-lg">{m.name} Owes You</p>
                          <p className="text-2xl font-bold text-green-600">${(owedAmount / 100).toFixed(2)}</p>
                        </div>
                      </div>

                      {/* Inline Expense Chips */}
                      {relevantExpenses.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {relevantExpenses.map((exp: any) => {
                            const theirEntry = exp.entries?.find((e: any) => e.userId === m.id);
                            const theirOutstanding = theirEntry
                              ? (theirEntry.amountCents || 0) - (theirEntry.settledCents || 0)
                              : 0;

                            return (
                              <Badge key={exp.id} variant="outline" className="px-3 py-1 text-sm border-green-500/30">
                                {exp.note || 'Expense'} ${(theirOutstanding / 100).toFixed(2)}
                              </Badge>
                            );
                          })}
                        </div>
                      )}

                      {/* Future: Send Reminder Button */}
                      <div className="flex justify-end">
                        <p className="text-sm text-muted-foreground italic">Waiting for payment...</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* SETTLED SECTION - Collapsed by default */}
      {settledMembers.length > 0 && (
        <div className="space-y-3">
          <button
            onClick={() => setShowSettled(!showSettled)}
            className="flex items-center gap-2 w-full text-left hover:opacity-80 transition-opacity"
          >
            <h3 className="text-lg font-semibold text-muted-foreground">✅ All Settled</h3>
            <Badge variant="secondary">{settledMembers.length}</Badge>
            {showSettled ? <ChevronUp className="h-4 w-4 ml-auto" /> : <ChevronDown className="h-4 w-4 ml-auto" />}
          </button>

          {showSettled && settledMembers.map((m) => (
            <Card key={m.id} className="border-muted">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-muted text-muted-foreground">
                      {m.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium">{m.name}</p>
                    <p className="text-sm text-muted-foreground">$0.00 · All settled</p>
                  </div>
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

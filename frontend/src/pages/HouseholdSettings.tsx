import { useState, useEffect } from "react";
import { Copy, RefreshCw, LogOut, UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
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
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useHousehold } from "@/contexts/HouseholdContext";
import { collection, query, where, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { updateUserHousehold } from "@/services/userService";

interface HouseholdMember {
  id: string;
  name: string;
  email: string;
  photoURL?: string;
  isCreator: boolean;
}

export default function HouseholdSettings() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { householdData, householdId, userData, refreshUserData } = useHousehold();
  const [members, setMembers] = useState<HouseholdMember[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch household members
  useEffect(() => {
    const fetchMembers = async () => {
      if (!householdId) {
        setLoading(false);
        return;
      }

      try {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("household_id", "==", householdId));
        const querySnapshot = await getDocs(q);

        const membersList: HouseholdMember[] = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name || "Unknown",
            email: data.email || "",
            photoURL: data.photoURL || "",
            // Firestore user doc id is the user's UID; compare doc.id to household created_by
            isCreator: doc.id === householdData?.created_by,
          };
        });

        setMembers(membersList);
      } catch (error) {
        console.error("Error fetching members:", error);
        toast.error("Failed to load household members");
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, [householdId, householdData]);

  const handleCopyCode = () => {
    if (householdData?.invite_code) {
      navigator.clipboard.writeText(householdData.invite_code);
      toast.success("Invite code copied to clipboard!");
    }
  };

  const handleRegenerateCode = async () => {
    if (!householdId || !householdData) return;

    try {
      // Generate new 6-character code
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let newCode = '';
      for (let i = 0; i < 6; i++) {
        newCode += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      const householdRef = doc(db, "households", householdId);
      await updateDoc(householdRef, {
        invite_code: newCode,
      });

      toast.success("New invite code generated!");
    } catch (error) {
      console.error("Error regenerating code:", error);
      toast.error("Failed to regenerate invite code");
    }
  };

  const handleLeaveHousehold = async () => {
    if (!currentUser) return;

    try {
      await updateUserHousehold(currentUser.uid, "");
      await refreshUserData();
      toast.success("You've left the household");
      navigate("/join");
    } catch (error) {
      console.error("Error leaving household:", error);
      toast.error("Failed to leave household");
    }
  };

  if (!householdId || !householdData) {
    return (
      <div className="container mx-auto max-w-4xl p-4 sm:p-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground">You're not part of a household yet.</p>
          <Button className="mt-4" onClick={() => navigate("/join")}>
            Join or Create Household
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl p-4 sm:p-6">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Household Settings</h1>
        <p className="mt-1 sm:mt-2 text-sm sm:text-base text-muted-foreground">
          Manage your household members and preferences
        </p>
      </div>

      <div className="space-y-6">
        {/* Household Info */}
        <Card>
          <CardHeader>
            <CardTitle>Household Information</CardTitle>
            <CardDescription>Details about your shared household</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Household Name</p>
              <p className="text-lg font-semibold">{householdData.name}</p>
            </div>

            <Separator />

            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Invite Code</p>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <code className="flex-1 rounded-md bg-muted px-3 sm:px-4 py-2.5 sm:py-2 font-mono text-base sm:text-lg font-semibold tracking-wider text-center sm:text-left">
                  {householdData.invite_code}
                </code>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="default"
                    onClick={handleCopyCode}
                    className="flex-1 sm:flex-none touch-manipulation"
                  >
                    <Copy className="h-4 w-4 mr-2 sm:mr-0" />
                    <span className="sm:hidden">Copy</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="default"
                    onClick={handleRegenerateCode}
                    className="flex-1 sm:flex-none touch-manipulation"
                  >
                    <RefreshCw className="h-4 w-4 mr-2 sm:mr-0" />
                    <span className="sm:hidden">Regenerate</span>
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Share this code with household members to invite them
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Members List */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
              <div>
                <CardTitle>Household Members</CardTitle>
                <CardDescription>
                  {members.length} member(s) in this household
                </CardDescription>
              </div>
              <Button
                size="sm"
                className="gap-2 w-full sm:w-auto touch-manipulation"
                onClick={handleCopyCode}
              >
                <UserPlus className="h-4 w-4" />
                Invite
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading members...</p>
            ) : members.length === 0 ? (
              <p className="text-sm text-muted-foreground">No members found</p>
            ) : (
              <div className="space-y-4">
                {members.map((member) => (
                  <div key={member.id} className="flex items-center gap-4">
                    <Avatar>
                      {member.photoURL && (
                        <AvatarImage
                          src={member.photoURL}
                          alt={member.name}
                          referrerPolicy="no-referrer"
                        />
                      )}
                      <AvatarFallback className="bg-secondary text-secondary-foreground">
                        {member.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">
                        {member.name}
                        {member.id === currentUser?.uid && " (You)"}
                        {member.isCreator && (
                          <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                            Creator
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-muted-foreground">{member.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
            <CardDescription>
              Irreversible actions that affect your household membership
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="gap-2">
                  <LogOut className="h-4 w-4" />
                  Leave Household
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    You will be removed from "{householdData.name}" and will lose access
                    to all shared items. You'll need a new invite code to rejoin.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleLeaveHousehold}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Leave Household
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

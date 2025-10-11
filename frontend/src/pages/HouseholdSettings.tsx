import { useState } from "react";
import { Copy, RefreshCw, LogOut, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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

// Mock data
const mockHousehold = {
  name: "The Smith House",
  inviteCode: "ABC12345",
  members: [
    { id: "1", name: "You", email: "you@example.com", isAdmin: true },
    { id: "2", name: "Jane Smith", email: "jane@example.com", isAdmin: false },
    { id: "3", name: "Bob Johnson", email: "bob@example.com", isAdmin: false },
  ],
};

export default function HouseholdSettings() {
  const [inviteCode, setInviteCode] = useState(mockHousehold.inviteCode);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(inviteCode);
    toast.success("Invite code copied to clipboard!");
  };

  const handleRegenerateCode = () => {
    const newCode = Math.random().toString(36).substring(2, 10).toUpperCase();
    setInviteCode(newCode);
    toast.success("New invite code generated!");
  };

  const handleLeaveHousehold = () => {
    toast.success("You've left the household");
  };

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
              <p className="text-lg font-semibold">{mockHousehold.name}</p>
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Invite Code</p>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <code className="flex-1 rounded-md bg-muted px-3 sm:px-4 py-2.5 sm:py-2 font-mono text-base sm:text-lg font-semibold tracking-wider text-center sm:text-left">
                  {inviteCode}
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
                  {mockHousehold.members.length} member(s) in this household
                </CardDescription>
              </div>
              <Button size="sm" className="gap-2 w-full sm:w-auto touch-manipulation">
                <UserPlus className="h-4 w-4" />
                Invite
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockHousehold.members.map((member) => (
                <div key={member.id} className="flex items-center gap-4">
                  <Avatar>
                    <AvatarFallback className="bg-secondary text-secondary-foreground">
                      {member.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium">
                      {member.name}
                      {member.isAdmin && (
                        <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                          Admin
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-muted-foreground">{member.email}</p>
                  </div>
                </div>
              ))}
            </div>
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
                    You will be removed from "{mockHousehold.name}" and will lose access
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

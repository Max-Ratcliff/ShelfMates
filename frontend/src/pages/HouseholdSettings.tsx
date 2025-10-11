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
    <div className="container mx-auto max-w-4xl p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Household Settings</h1>
        <p className="mt-2 text-muted-foreground">
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
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded-md bg-muted px-4 py-2 font-mono text-lg font-semibold tracking-wider">
                  {inviteCode}
                </code>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopyCode}
                  title="Copy code"
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleRegenerateCode}
                  title="Regenerate code"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
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
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Household Members</CardTitle>
                <CardDescription>
                  {mockHousehold.members.length} member(s) in this household
                </CardDescription>
              </div>
              <Button size="sm" className="gap-2">
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

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useHousehold } from "@/contexts/HouseholdContext";
import { createHousehold, joinHousehold } from "@/services/householdService";

export default function JoinHousehold() {
  const [inviteCode, setInviteCode] = useState("");
  const [householdName, setHouseholdName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { refreshUserData } = useHousehold();

  const handleJoinHousehold = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser) {
      toast.error("You must be logged in to join a household");
      navigate("/login");
      return;
    }

    if (!inviteCode.trim() || inviteCode.length !== 6) {
      toast.error("Please enter a valid 6-character invite code");
      return;
    }

    setLoading(true);
    try {
      const household = await joinHousehold(inviteCode.trim(), currentUser.uid);
      await refreshUserData();
      toast.success(`Joined ${household.name} successfully!`);
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Error joining household:", error);
      if (error.message === 'Invalid invite code') {
        toast.error("Invalid invite code. Please check and try again.");
      } else {
        toast.error("Failed to join household. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateHousehold = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser) {
      toast.error("You must be logged in to create a household");
      navigate("/login");
      return;
    }

    if (!householdName.trim()) {
      toast.error("Please enter a household name");
      return;
    }

    setLoading(true);
    try {
      const { inviteCode } = await createHousehold(householdName.trim(), currentUser.uid);
      await refreshUserData();
      toast.success(`Household created! Your invite code is: ${inviteCode}`, {
        duration: 8000,
      });
      navigate("/dashboard");
    } catch (error) {
      console.error("Error creating household:", error);
      toast.error("Failed to create household. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-card">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary">
            <span className="text-3xl">🏠</span>
          </div>
          <CardTitle className="text-2xl">Setup Your Household</CardTitle>
          <CardDescription>
            Create a new household or join an existing one
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="join" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="join">Join</TabsTrigger>
              <TabsTrigger value="create">Create</TabsTrigger>
            </TabsList>

            <TabsContent value="join" className="space-y-4 mt-4">
              <form onSubmit={handleJoinHousehold}>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="code">Invite Code</Label>
                    <Input
                      id="code"
                      type="text"
                      placeholder="ABC123"
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                      maxLength={6}
                      className="text-center text-lg font-mono tracking-wider"
                      required
                      disabled={loading}
                    />
                    <p className="text-xs text-muted-foreground">
                      6-character code provided by your household admin
                    </p>
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Joining..." : "Join Household"}
                  </Button>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="create" className="space-y-4 mt-4">
              <form onSubmit={handleCreateHousehold}>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Household Name</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="The Smith Family"
                      value={householdName}
                      onChange={(e) => setHouseholdName(e.target.value)}
                      required
                      disabled={loading}
                    />
                    <p className="text-xs text-muted-foreground">
                      Choose a name for your household
                    </p>
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Creating..." : "Create Household"}
                  </Button>
                </div>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>

        <CardFooter className="flex flex-col space-y-2">
          <p className="text-center text-sm text-muted-foreground">
            <Link to="/login" className="font-medium hover:underline">
              Back to login
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

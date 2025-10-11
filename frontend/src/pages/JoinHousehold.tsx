import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function JoinHousehold() {
  const [inviteCode, setInviteCode] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Firebase check will go here
    if (inviteCode.length === 8) {
      toast.success("Joined household successfully!");
      navigate("/dashboard");
    } else {
      toast.error("Invalid invite code");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-card">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary">
            <span className="text-3xl">🏠</span>
          </div>
          <CardTitle className="text-2xl">Join a household</CardTitle>
          <CardDescription>
            Enter the invite code shared by your household member
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Invite Code</Label>
              <Input
                id="code"
                type="text"
                placeholder="ABC12345"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                maxLength={8}
                className="text-center text-lg font-mono tracking-wider"
                required
              />
              <p className="text-xs text-muted-foreground">
                8-character code provided by your household admin
              </p>
            </div>

            <Button type="submit" className="w-full" variant="default">
              Join Household
            </Button>
          </CardContent>
        </form>

        <CardFooter className="flex flex-col space-y-2">
          <p className="text-center text-sm text-muted-foreground">
            Don't have an invite code?{" "}
            <Link to="/signup" className="font-medium text-primary hover:underline">
              Create your own household
            </Link>
          </p>
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

import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertCircle, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";

export default function SignUp() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [householdName, setHouseholdName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isJoiningHousehold, setIsJoiningHousehold] = useState(false);
  const navigate = useNavigate();
  const { signUp, signInWithGoogle } = useAuth();

  // Check if user is coming from "Join household" flow
  useEffect(() => {
    const pendingJoin = sessionStorage.getItem('pendingHouseholdJoin');
    if (pendingJoin === 'true') {
      setIsJoiningHousehold(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await signUp(email, password, name.trim());
      // Redirect to household setup page
      navigate("/join");
    } catch (error: any) {
      // Extract user-friendly error message
      const errorMessage = error.code === 'auth/email-already-in-use'
        ? 'An account with this email already exists. Please sign in instead.'
        : error.code === 'auth/weak-password'
        ? 'Password is too weak. Please use at least 6 characters.'
        : error.code === 'auth/invalid-email'
        ? 'Invalid email address. Please enter a valid email.'
        : error.code === 'auth/operation-not-allowed'
        ? 'Email/password sign-up is not enabled. Please contact support.'
        : 'Failed to create account. Please try again.';

      setError(errorMessage);
      console.error("Sign up error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setLoading(true);
    setError("");
    try {
      await signInWithGoogle();
      // Redirect to household setup page
      navigate("/join");
    } catch (error: any) {
      const errorMessage = error.code === 'auth/popup-closed-by-user'
        ? 'Sign-up popup was closed. Please try again.'
        : error.code === 'auth/cancelled-popup-request'
        ? 'Sign-up was cancelled. Please try again.'
        : 'Failed to sign up with Google. Please try again.';

      setError(errorMessage);
      console.error("Google sign up error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-card">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary">
            <span className="text-3xl">{isJoiningHousehold ? "🏠" : "🥘"}</span>
          </div>
          <CardTitle className="text-2xl">
            {isJoiningHousehold ? "Join a Household" : "Create your account"}
          </CardTitle>
          <CardDescription>
            {isJoiningHousehold
              ? "First, create your account. Then you'll enter your invite code."
              : "Start tracking your household's food inventory"}
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {isJoiningHousehold && (
              <Alert className="bg-secondary/50 border-secondary">
                <Home className="h-4 w-4" />
                <AlertDescription>
                  After creating your account, you'll be able to enter your invite code to join the household.
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {!isJoiningHousehold && (
              <div className="space-y-2">
                <Label htmlFor="household">Household Name</Label>
                <Input
                  id="household"
                  type="text"
                  placeholder="The Smith House"
                  value={householdName}
                  onChange={(e) => setHouseholdName(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  This will be visible to all household members
                </p>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating account..." : "Create Account"}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleGoogleSignUp}
              disabled={loading}
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Sign up with Google
            </Button>
          </CardContent>
        </form>

        <CardFooter className="flex flex-col space-y-2">
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

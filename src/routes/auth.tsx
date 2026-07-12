import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ADMIN_EMAIL } from "@/lib/site";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Admin Sign In — GSK Enterprises" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // If already signed in as admin, redirect
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data, error }) => {
      if (error) {
        await supabase.auth.signOut({ scope: "local" });
        return;
      }
      if (data.user) navigate({ to: "/admin", replace: true });
    });
  }, [navigate]);

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await supabase.auth.signOut({ scope: "local" });
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (!error) {
      const { error: userError } = await supabase.auth.getUser();
      if (userError) {
        setLoading(false);
        return toast.error("Could not start your admin session. Please try again.");
      }
    }
    setLoading(false);
    if (error) return toast.error("Invalid email or password. Please enter the exact admin login details.");
    toast.success("Signed in");
    navigate({ to: "/admin", replace: true });
  };

  const signUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: { emailRedirectTo: window.location.origin + "/admin" },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Account created. Check your email to confirm.");
  };

  const signInGoogle = async () => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + "/auth",
    });
    if (result.error) toast.error(String((result.error as Error).message ?? result.error));
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-12">
        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
          <h1 className="font-display text-2xl font-bold text-brand">Admin Sign In</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Restricted access. Only the site owner ({ADMIN_EMAIL}) can reach the admin
            dashboard.
          </p>

          <Tabs defaultValue="signin" className="mt-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            <TabsContent value="signin">
              <form onSubmit={signIn} className="mt-4 space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-brand text-brand-foreground"
                >
                  {loading ? "Signing in…" : "Sign In"}
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="signup">
              <form onSubmit={signUp} className="mt-4 space-y-4">
                <div>
                  <Label htmlFor="email2">Email</Label>
                  <Input
                    id="email2"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="password2">Password</Label>
                  <Input
                    id="password2"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={6}
                    required
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-brand text-brand-foreground"
                >
                  {loading ? "Creating…" : "Sign Up"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-widest text-muted-foreground">
            <div className="h-px flex-1 bg-border" /> or <div className="h-px flex-1 bg-border" />
          </div>
          <Button
            variant="outline"
            className="w-full"
            onClick={signInGoogle}
          >
            Continue with Google
          </Button>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

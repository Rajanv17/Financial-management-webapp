import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Wallet } from "lucide-react";
import { AuthIllustration } from "@/components/auth/auth-illustration";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApiClientError } from "@/lib/api";
import { useAuth } from "@/features/auth/auth-provider";
import { loginSchema, registerSchema } from "@/features/auth/schemas";
import type { LoginInput, RegisterInput } from "@/features/auth/types";

export default function AuthPage() {
  const { login, register } = useAuth();
  const [activeTab, setActiveTab] = useState("login");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [registerError, setRegisterError] = useState<string | null>(null);

  const loginForm = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  const registerForm = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { username: "", email: "", password: "" },
  });

  const onLogin = loginForm.handleSubmit(async (values) => {
    setLoginError(null);
    try {
      await login(values);
    } catch (error) {
      loginForm.setValue("password", "");
      setLoginError(
        error instanceof ApiClientError
          ? error.message
          : "Could not sign in. Try again.",
      );
    }
  });

  const onRegister = registerForm.handleSubmit(async (values) => {
    setRegisterError(null);
    try {
      await register(values);
    } catch (error) {
      registerForm.setValue("password", "");
      setRegisterError(
        error instanceof ApiClientError
          ? error.message
          : "Could not create the account. Try again.",
      );
    }
  });

  return (
    <div className="grid min-h-svh bg-background md:grid-cols-2">
      <aside className="hidden flex-col bg-sidebar px-10 py-12 text-sidebar-foreground md:flex">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-lg bg-sidebar-primary">
            <Wallet className="size-6 text-sidebar-primary-foreground" />
          </div>
          <span className="text-lg font-semibold">Finance Manager</span>
        </div>
        <div className="mt-10 max-w-sm space-y-3">
          <h1 className="text-3xl font-semibold tracking-tight">
            Track money with a calm, clear workspace.
          </h1>
          <p className="text-sm text-sidebar-foreground/80">
            Sign in to record income and expenses, set monthly budgets, and see
            where your money goes.
          </p>
        </div>
        <div className="flex min-h-0 flex-1 items-center justify-center py-8">
          <AuthIllustration />
        </div>
        <p className="text-xs text-sidebar-foreground/60">
          Amounts are in INR (Indian Rupee)
        </p>
      </aside>

      <div className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md space-y-8">
          <div className="flex items-center gap-3 md:hidden">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary">
              <Wallet className="size-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold text-foreground">
              Finance Manager
            </span>
          </div>

          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              Welcome
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Sign in to your account or create a new one.
            </p>
          </div>

          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="mb-6 grid w-full grid-cols-2">
              <TabsTrigger value="login">Sign in</TabsTrigger>
              <TabsTrigger value="register">Create account</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={onLogin} className="space-y-4" noValidate>
                <div className="space-y-2">
                  <Label htmlFor="login-username">Username</Label>
                  <Input
                    id="login-username"
                    autoComplete="username"
                    aria-invalid={!!loginForm.formState.errors.username}
                    aria-describedby={
                      loginForm.formState.errors.username
                        ? "login-username-error"
                        : undefined
                    }
                    {...loginForm.register("username")}
                  />
                  {loginForm.formState.errors.username ? (
                    <p
                      id="login-username-error"
                      className="text-sm text-destructive"
                    >
                      {loginForm.formState.errors.username.message}
                    </p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    autoComplete="current-password"
                    aria-invalid={!!loginForm.formState.errors.password}
                    aria-describedby={
                      loginForm.formState.errors.password
                        ? "login-password-error"
                        : undefined
                    }
                    {...loginForm.register("password")}
                  />
                  {loginForm.formState.errors.password ? (
                    <p
                      id="login-password-error"
                      className="text-sm text-destructive"
                    >
                      {loginForm.formState.errors.password.message}
                    </p>
                  ) : null}
                </div>
                {loginError ? (
                  <p className="text-sm text-destructive" role="alert">
                    {loginError}
                  </p>
                ) : null}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={loginForm.formState.isSubmitting}
                >
                  {loginForm.formState.isSubmitting ? "Signing in…" : "Sign in"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={onRegister} className="space-y-4" noValidate>
                <div className="space-y-2">
                  <Label htmlFor="register-username">Username</Label>
                  <Input
                    id="register-username"
                    autoComplete="username"
                    aria-invalid={!!registerForm.formState.errors.username}
                    aria-describedby={
                      registerForm.formState.errors.username
                        ? "register-username-error"
                        : undefined
                    }
                    {...registerForm.register("username")}
                  />
                  {registerForm.formState.errors.username ? (
                    <p
                      id="register-username-error"
                      className="text-sm text-destructive"
                    >
                      {registerForm.formState.errors.username.message}
                    </p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-email">Email</Label>
                  <Input
                    id="register-email"
                    type="email"
                    autoComplete="email"
                    aria-invalid={!!registerForm.formState.errors.email}
                    aria-describedby={
                      registerForm.formState.errors.email
                        ? "register-email-error"
                        : undefined
                    }
                    {...registerForm.register("email")}
                  />
                  {registerForm.formState.errors.email ? (
                    <p
                      id="register-email-error"
                      className="text-sm text-destructive"
                    >
                      {registerForm.formState.errors.email.message}
                    </p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-password">Password</Label>
                  <Input
                    id="register-password"
                    type="password"
                    autoComplete="new-password"
                    aria-invalid={!!registerForm.formState.errors.password}
                    aria-describedby={
                      registerForm.formState.errors.password
                        ? "register-password-error"
                        : undefined
                    }
                    {...registerForm.register("password")}
                  />
                  {registerForm.formState.errors.password ? (
                    <p
                      id="register-password-error"
                      className="text-sm text-destructive"
                    >
                      {registerForm.formState.errors.password.message}
                    </p>
                  ) : null}
                </div>
                {registerError ? (
                  <p className="text-sm text-destructive" role="alert">
                    {registerError}
                  </p>
                ) : null}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={registerForm.formState.isSubmitting}
                >
                  {registerForm.formState.isSubmitting
                    ? "Creating account…"
                    : "Create account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

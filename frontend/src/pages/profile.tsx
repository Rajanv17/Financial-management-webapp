import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Mail, User } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/features/auth/auth-provider";
import { profileSchema } from "@/features/auth/schemas";
import type { ProfileInput } from "@/features/auth/types";
import { ApiClientError } from "@/lib/api";
import { userInitials } from "@/lib/format";

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: user?.username ?? "",
      email: user?.email ?? "",
    },
  });

  useEffect(() => {
    if (user) {
      form.reset({ username: user.username, email: user.email });
    }
  }, [user, form]);

  if (!user) return null;

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(null);
    try {
      await updateProfile(values);
      setEditing(false);
      toast.success("Profile updated");
    } catch (error) {
      setFormError(
        error instanceof ApiClientError
          ? error.message
          : "Could not update your profile. Try again.",
      );
    }
  });

  return (
    <div className="space-y-6 text-foreground">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground">Manage your account settings.</p>
      </div>

      <Card className="mx-auto w-full max-w-xl border-border shadow-sm">
        <CardContent className="space-y-8 p-6">
          <div className="flex items-center gap-4">
            <Avatar className="size-16">
              <AvatarFallback className="bg-primary/10 text-lg text-primary">
                {userInitials(user.username)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">{user.username}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>

          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <div className="space-y-2">
              <Label htmlFor="profile-username">Username</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="profile-username"
                  className="pl-10"
                  readOnly={!editing}
                  aria-invalid={!!form.formState.errors.username}
                  aria-describedby={
                    form.formState.errors.username
                      ? "profile-username-error"
                      : undefined
                  }
                  {...form.register("username")}
                />
              </div>
              {form.formState.errors.username ? (
                <p id="profile-username-error" className="text-sm text-destructive">
                  {form.formState.errors.username.message}
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="profile-email"
                  type="email"
                  className="pl-10"
                  readOnly={!editing}
                  aria-invalid={!!form.formState.errors.email}
                  aria-describedby={
                    form.formState.errors.email
                      ? "profile-email-error"
                      : undefined
                  }
                  {...form.register("email")}
                />
              </div>
              {form.formState.errors.email ? (
                <p id="profile-email-error" className="text-sm text-destructive">
                  {form.formState.errors.email.message}
                </p>
              ) : null}
            </div>
            {formError ? (
              <p className="text-sm text-destructive" role="alert">
                {formError}
              </p>
            ) : null}
            {editing ? (
              <div className="flex gap-2">
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? "Saving…" : "Save changes"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditing(false);
                    setFormError(null);
                    form.reset({
                      username: user.username,
                      email: user.email,
                    });
                  }}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button type="button" onClick={() => setEditing(true)}>
                Edit profile
              </Button>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

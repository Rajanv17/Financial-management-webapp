import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Mail, User } from "lucide-react";
import { ErrorState, PageHeader } from "@/components/shared";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchProfile } from "@/features/auth/api";
import { useAuth } from "@/features/auth/auth-provider";
import { profileSchema } from "@/features/auth/schemas";
import type { ProfileInput } from "@/features/auth/types";
import { ApiClientError } from "@/lib/api";
import { userInitials } from "@/lib/format";
import { queryKeys } from "@/lib/query-keys";

const formatJoined = (iso: string) =>
  new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));

export default function ProfilePage() {
  const { updateProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const profileQuery = useQuery({
    queryKey: queryKeys.user.profile,
    queryFn: fetchProfile,
  });

  const form = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: "",
      email: "",
    },
  });

  const profile = profileQuery.data;

  useEffect(() => {
    if (profile && !editing) {
      form.reset({ username: profile.username, email: profile.email });
    }
  }, [profile, editing, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(null);
    try {
      await updateProfile(values);
      await profileQuery.refetch();
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
    <div className="space-y-6">
      <PageHeader
        title="Profile"
        description="Username and email for this account. There is no full name field."
      />

      {profileQuery.isLoading && !profile ? (
        <Card className="mx-auto w-full max-w-xl">
          <CardContent className="space-y-6 p-6">
            <div className="flex items-center gap-4">
              <Skeleton className="size-16 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-48" />
              </div>
            </div>
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      ) : null}

      {profileQuery.isError ? (
        <ErrorState
          message={
            profileQuery.error instanceof ApiClientError
              ? profileQuery.error.message
              : "Could not load your profile."
          }
          onRetry={() => void profileQuery.refetch()}
        />
      ) : null}

      {profile ? (
        <Card className="mx-auto w-full max-w-xl">
          <CardContent className="space-y-8 p-6">
            <div className="flex items-center gap-4">
              <Avatar className="size-16">
                <AvatarFallback className="bg-primary/10 text-lg text-primary">
                  {userInitials(profile.username)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{profile.username}</p>
                <p className="text-sm text-muted-foreground">{profile.email}</p>
                <p className="text-sm text-muted-foreground">
                  Member since {formatJoined(profile.createdAt)}
                </p>
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
                      form.formState.errors.email ? "profile-email-error" : undefined
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
                        username: profile.username,
                        email: profile.email,
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
      ) : null}
    </div>
  );
}

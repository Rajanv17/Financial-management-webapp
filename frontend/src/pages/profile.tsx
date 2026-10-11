import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
// import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User, Mail } from "lucide-react";

export default function ProfilePage() {
  return (
    <div className="space-y-6 text-foreground">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground">Manage your account settings.</p>
      </div>

      <Card className="border-none bg-white shadow-lg w-1/2 h-auto mx-auto">
        <CardContent className="p-5">
          <div className="grid gap-8">
            {/* Profile Picture Section */}
            {/* <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold mb-2">Profile Picture</h3>
                <div className="flex flex-col items-center gap-4">
                  <Avatar className="h-32 w-32">
                    <AvatarFallback className="text-2xl bg-blue-100 text-blue-700">
                      JD
                    </AvatarFallback>
                  </Avatar>
                  <Button variant="outline" className="w-full max-w-xs">
                    Change Picture
                  </Button>
                </div>
              </div>
            </div> */}

            {/* Account Information Section */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold mb-1">Account Information</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Update your personal details
                </p>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Username</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      defaultValue="johndoe"
                      className="pl-10 bg-gray-50"
                      readOnly
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      defaultValue="John Doe"
                      className="pl-10 bg-gray-50"
                      readOnly
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      defaultValue="john.doe@example.com"
                      type="email"
                      className="pl-10 bg-gray-50"
                      readOnly
                    />
                  </div>
                </div>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white mt-4">
                  Edit Profile
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

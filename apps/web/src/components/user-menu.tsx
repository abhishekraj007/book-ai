import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authClient } from "@/lib/auth-client";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@convex-starter/backend/convex/_generated/api";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Crown, LogOut, Settings } from "lucide-react";

interface UserMenuProps {
  isPremium: boolean;
}

export default function UserMenu({ isPremium }: UserMenuProps) {
  const router = useRouter();
  const userData = useQuery(api.user.fetchUserAndProfile);

  if (!userData) {
    return null;
  }

  const userName =
    userData?.profile?.name || userData?.userMetadata?.name || "User";
  const userEmail = userData?.userMetadata?.email || "";
  const userImage = userData?.userMetadata?.image;
  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10">
            <AvatarImage src={userImage || undefined} alt={userName} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          {isPremium && (
            <div className="absolute -top-1 -right-1 bg-primary rounded-full p-0.5 border-2 border-background">
              <Crown className="h-3 w-3 text-primary-foreground fill-primary-foreground" />
            </div>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-card w-56" align="end">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{userName}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {userEmail}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => router.push("/settings" as any)}
          className="cursor-pointer"
        >
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            authClient.signOut({
              fetchOptions: {
                onSuccess: () => {
                  router.push("/dashboard");
                },
              },
            });
          }}
          className="cursor-pointer"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

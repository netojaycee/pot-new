import { getCurrentUser } from "@/lib/actions/auth.actions";
import UserMenu from "./UserMenu";
import Link from "next/link";
import { Button } from "../ui/button";

export default async function UserActions() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="items-center space-x-1 hidden md:flex">
        <Button
          asChild
          // className="text-sm font-normal transition-all hover:text-primary duration-300 hover:scale-105"
        >
          <Link href="/auth/login">GET STARTED</Link>
        </Button>
      </div>
    );
  }

  return <UserMenu user={user} />;
}

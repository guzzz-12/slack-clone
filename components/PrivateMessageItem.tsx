import Link from "next/link";
import { useParams } from "next/navigation";
import Typography from "./Typography";
import { WorkspaceMember } from "@/types/supabase";
import { cn } from "@/lib/utils";

type Params = {
  workspaceId: string;
  userId: string;
}

interface Props {
  workspaceId: string;
  user: WorkspaceMember;
}

const PrivateMessageItem = ({workspaceId, user}: Props) => {
  const params = useParams<Params>();

  const isActive = params.userId === user.id && params.workspaceId === workspaceId;

  return (
    <Link
      className="block w-full"
      href={`/conversations/workspace/${workspaceId}/user/${user.id}`}
    >
      <div className={cn("flex justify-start items-center gap-1 w-full px-2 py-1 rounded-sm bg-transparent cursor-pointer hover:bg-neutral-700 transition-colors", isActive && "bg-neutral-700")}>
        <div className="flex justify-start items-center gap-2 flex-grow overflow-hidden">
          <div className="relative w-[24px] h-[24px] rounded-full flex-shrink-0">
            <img
              className="block w-full h-full text-xs object-cover object-center rounded-full"
              src={user.avatar_url || ""}
              alt={user.name || user.email}
            />
          </div>
          <Typography
            className="w-full flex-grow text-sm text-left truncate"
            variant="p"
            text={user.name || user.email}
          />
        </div>

        <span className="flex justify-center items-center min-w-[24px] h-[24px] p-1.5 flex-shrink-0 text-[12px] font-semibold text-white rounded-full bg-primary-dark">
          {/* {unreadCount > 99 ? "99+" : unreadCount} */}
          99+
        </span>
          
      </div>
    </Link>
  )
}

export default PrivateMessageItem
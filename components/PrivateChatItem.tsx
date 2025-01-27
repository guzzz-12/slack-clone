import Link from "next/link";
import { useParams } from "next/navigation";
import Typography from "./Typography";
import { PrivateMessageWithSender, WorkspaceMember } from "@/types/supabase";
import { cn } from "@/lib/utils";

type Params = {
  workspaceId: string;
  userId: string;
}

interface Props {
  workspaceId: string;
  member: WorkspaceMember;
  unreadMessages: PrivateMessageWithSender[];
}

const PrivateChatItem = ({workspaceId, member, unreadMessages}: Props) => {
  const params = useParams<Params>();

  const unreadCount = unreadMessages.filter((m) => m.sender.id === member.id).length;
  const isItemActive = params.userId === member.id && params.workspaceId === workspaceId;

  return (
    <Link
      className="block w-full"
      href={`/workspace/${workspaceId}/private-chat/${member.id}`}
    >
      <div className={cn("flex justify-start items-center gap-1 w-full p-2 rounded-sm bg-neutral-700/30 cursor-pointer hover:bg-neutral-600 transition-colors", isItemActive && "bg-neutral-950")}>
        <div className="flex justify-start items-center gap-2 flex-grow overflow-hidden">
          <div className="relative w-[24px] h-[24px] rounded-full flex-shrink-0">
            <img
              className="block w-full h-full text-xs object-cover object-center rounded-full"
              src={member.avatar_url || ""}
              alt={member.name || member.email}
            />
          </div>
          <Typography
            className="w-full flex-grow text-sm text-left truncate"
            variant="p"
            text={member.name || member.email}
          />
        </div>

        {unreadCount > 0 && (
          <span className="flex justify-center items-center min-w-[24px] h-[24px] p-1.5 flex-shrink-0 text-[12px] font-semibold text-white rounded-full bg-primary-dark">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </div>
    </Link>
  )
}

export default PrivateChatItem
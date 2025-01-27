import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Typography from "./Typography";
import { PrivateMessageWithSender, WorkspaceMember } from "@/types/supabase";
import { cn } from "@/lib/utils";
import { pusherClient } from "@/utils/pusherClientSide";

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

  const [isAway, setIsAway] = useState(() => member.is_away);

  const unreadCount = unreadMessages.filter((m) => m.sender.id === member.id).length;
  const isItemActive = params.userId === member.id && params.workspaceId === workspaceId;


  // Escuchar el evento de cambio de presencia del usuario
  // y actualizar el estado isAway
  useEffect(() => {
    const channel = pusherClient.subscribe(`member-${member.id}`);

    channel.bind("user-presence", (data: { isAway: boolean }) => {
      setIsAway(data.isAway);
    });

    return () => {
      pusherClient.unsubscribe(`member-${member.id}`);
    };
  }, [member]);


  return (
    <Link
      className="block w-full"
      href={`/workspace/${workspaceId}/private-chat/${member.id}`}
    >
      <div className={cn("flex justify-start items-center gap-1 w-full rounded-sm bg-neutral-700/30 cursor-pointer hover:bg-neutral-600 transition-colors", isItemActive && "bg-neutral-950")}>
        <div className="flex justify-start items-center gap-2 flex-grow p-2 overflow-hidden">
          <div className="relative w-[24px] h-[24px] rounded-full flex-shrink-0">
            <img
              className="block w-full h-full text-xs object-cover object-center rounded-full"
              src={member.avatar_url || ""}
              alt={member.name || member.email}
            />

            <div className={cn("absolute bottom-0 right-0 w-[6px] h-[6px] rounded-full outline outline-2 outline-white z-30", isAway ? "bg-neutral-400" : "bg-green-500")}/>
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
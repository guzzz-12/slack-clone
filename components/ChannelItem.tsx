import Link from "next/link";
import { GoHash } from "react-icons/go";
import Typography from "./Typography";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { Channel, MessageWithSender, } from "@/types/supabase"
import { cn } from "@/lib/utils";

interface Props {
  channel: Channel;
  currentChannelId: string;
  unreadMessages: MessageWithSender[];
}

const ChannelItem = ({currentChannelId, channel, unreadMessages}: Props) => {
  const unreadCount = unreadMessages.filter((m) => m.channel_id === channel.id).length;

  return (
    <TooltipProvider>
      <Tooltip delayDuration={250}>
        <TooltipTrigger className="flex justify-start w-full" asChild>
          <Link
            className="block w-full flex-shrink-0 overflow-hidden"
            href={`/workspace/${channel.workspace_id}/channel/${channel.id}`}
          >
            <div className={cn("flex justify-start items-center gap-1 w-full px-2 py-1 bg-neutral-900 rounded-sm cursor-pointer hover:bg-neutral-700 transition-colors", channel.id === currentChannelId && "bg-neutral-700")}>
              <GoHash className="flex-shrink-0" />
              <Typography
                className="w-full flex-grow text-sm text-left truncate"
                variant="p"
                text={channel.name}
              />

              {unreadCount > 0 && (
                <span className="flex justify-center items-center min-w-[24px] h-[24px] p-1.5 flex-shrink-0 text-[12px] font-semibold text-white rounded-full bg-primary-dark">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
                
            </div>
          </Link>
        </TooltipTrigger>

        <TooltipContent side="right">
          {channel.name}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export default ChannelItem
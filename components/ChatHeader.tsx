"use client"

import { GoHash } from "react-icons/go";
import { FaVideo } from "react-icons/fa";
import { AiOutlineVideoCameraAdd } from "react-icons/ai";
import SearchBar from "./SearchBar";
import { Skeleton } from "./ui/skeleton";
import { Button } from "./ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { useMessages } from "@/hooks/useMessages";
import { useUser } from "@/hooks/useUser";
import { useWorkspace } from "@/hooks/useWorkspace";
import { combineUuid } from "@/utils/constants";

interface Props {
  currentWorkspaceId: string;
  currentChannelId: string;
  title: string | undefined;
  loading: boolean;
  chatType: "channel" | "private";
}

const ChatHeader = ({currentChannelId, title, loading, chatType}: Props) => {
  const {callerId, setCallerId, setVideoCallType} = useMessages();
  const {currentChannel} = useWorkspace();
  const {user} = useUser();

  /** Generar el callerId cuando se inicie una videollamada */
  const onClickHandler = (type: "channel" | "private") => {
    setVideoCallType(type);

    if (type === "channel") {
      setCallerId(currentChannelId);
    }

    if (type === "private" && user) {
      const combinedUserIds = combineUuid(user.id, currentChannelId);
      setCallerId(combinedUserIds);
    }
  }

  if (!currentChannel || !user) {
    return null;
  }

  return (
    <header className="flex justify-between items-center gap-2 w-full min-h-[57px] px-4 py-2 flex-shrink-0 border-b border-neutral-900 bg-neutral-800">
      {loading && (
        <>
          <Skeleton className="w-1/2 h-5 bg-neutral-600" />
          <Skeleton className="w-[240px] h-[40px] bg-neutral-600" />
        </>
      )}

      {!loading && (
        <>
          <div className="flex justify-start items-center gap-1 overflow-hidden">
            <GoHash />
            <h2 className="text-base font-normal flex-grow truncate">
              {title}
            </h2>
          </div>
          
          <div className="flex justify-start items-center gap-2">
            <SearchBar />

            {/* Mostrar botón para unirse a una reunión si el channel tiene una reunión activa y el usuario no se ha unido */}
            {currentChannel.meeting_members.length > 0 && !currentChannel.meeting_members.includes(user.id) &&
              <TooltipProvider>
                <Tooltip delayDuration={250}>
                  <TooltipTrigger className="flex justify-start w-full" asChild>
                    <Button
                      variant="ghost"
                      aria-labelledby="join-meeting-btn"
                      onClick={() => onClickHandler("channel")}
                    >
                      <AiOutlineVideoCameraAdd size={30} aria-hidden />
                      <span id="join-meeting-btn" hidden>
                        Join meeting
                      </span>
                    </Button>
                  </TooltipTrigger>

                  <TooltipContent side="bottom">
                    Join Meeting
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            }

            {/* Mostrar botón para iniciar una reunión si no hay una reunión activa */}
            {!callerId && currentChannel.meeting_members.length === 0 &&
              <TooltipProvider>
                <Tooltip delayDuration={250}>
                  <TooltipTrigger className="flex justify-start w-full" asChild>
                    <Button
                      variant="ghost"
                      aria-labelledby="start-video-call-btn"
                      onClick={() => onClickHandler(chatType)}
                    >
                      <FaVideo size={30} aria-hidden />
                      <span id="start-video-call-btn" hidden>
                        Start Video Call
                      </span>
                    </Button>
                  </TooltipTrigger>

                  <TooltipContent side="bottom">
                    {chatType  === "channel" ? "Start Video Meeting" : "Start Video Call"}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            }
          </div>
        </>
      )}
    </header>
  )
}

export default ChatHeader
import { GoHash } from "react-icons/go";
import { FaVideo, FaVideoSlash } from "react-icons/fa";
import SearchBar from "./SearchBar";
import { Skeleton } from "./ui/skeleton";
import { Button } from "./ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { useMessages } from "@/hooks/useMessages";
import { useUser } from "@/hooks/useUser";
import { useEffect } from "react";
import { combineUuid } from "@/utils/constants";

interface Props {
  currentWorkspaceId: string;
  currentChannelId: string;
  title: string | undefined;
  loading: boolean;
  chatType: "channel" | "private";
}

const ChatHeader = ({ currentChannelId, title, loading, chatType}: Props) => {
  const {callerId, videoCallType, setCallerId, setVideoCallType} = useMessages();

  const {user} = useUser();

  // Generar el callerId cuando se inicie una videollamada
  useEffect(() => {
    if (videoCallType === "channel") {
      setCallerId(currentChannelId);
    }

    if (videoCallType === "private" && user) {
      const combinedUserIds = combineUuid(user.id, currentChannelId);
      setCallerId(combinedUserIds);
    }
  }, [videoCallType, user]);

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

            {videoCallType !== "private" &&
              <TooltipProvider>
                <Tooltip delayDuration={250}>
                  <TooltipTrigger className="flex justify-start w-full" asChild>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        if (callerId) {
                          setCallerId(null);
                          setVideoCallType(null);

                        } else {
                          setVideoCallType(chatType);
                        }
                      }}
                    >
                      {callerId ? <FaVideoSlash size={30} /> : <FaVideo size={30} />}
                    </Button>
                  </TooltipTrigger>

                  <TooltipContent side="bottom">
                    {!callerId ? "Start Video Call" : "End video call"}
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
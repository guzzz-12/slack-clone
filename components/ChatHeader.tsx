import { GoHash } from "react-icons/go";
import { FaVideo, FaVideoSlash } from "react-icons/fa";
import SearchBar from "./SearchBar";
import { Skeleton } from "./ui/skeleton";
import { Button } from "./ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { useMessages } from "@/hooks/useMessages";

interface Props {
  currentWorkspaceId: string;
  currentChannelId: string;
  title: string | undefined;
  loading: boolean;
}

const ChatHeader = ({title, loading}: Props) => {
  const {isVideoCall, setIsVideoCall} = useMessages();

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

            <TooltipProvider>
              <Tooltip delayDuration={250}>
                <TooltipTrigger className="flex justify-start w-full" asChild>
                  <Button
                    variant="ghost"
                    onClick={() => setIsVideoCall(!isVideoCall)}
                  >
                    {isVideoCall ? <FaVideoSlash size={30} /> : <FaVideo size={30} />}
                  </Button>
                </TooltipTrigger>

                <TooltipContent side="bottom">
                  {!isVideoCall ? "Start Video Call" : "End video call"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

          </div>
        </>
      )}
    </header>
  )
}

export default ChatHeader
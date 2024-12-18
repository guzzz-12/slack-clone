"use client"

import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { FaArrowDown, FaArrowUp, FaPlus } from "react-icons/fa6";
import Typography from "./Typography";
import CreateChannelModal from "./CreateChannelModal";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { Skeleton } from "./ui/skeleton";
import { useWorkspace } from "@/hooks/useWorkspace";
import { cn } from "@/lib/utils";
import { Channel, User } from "@/types/supabase";

interface Props {
  userData: User;
}

const InfoSection = ({userData}: Props) => {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [isChannelCollapsed, setIsChannelCollapsed] = useState(true);
  const [isDmsCollapsed, setIsDmsCollapsed] = useState(true);
  const [isChannelModalOpen, setIsChannelModalOpen] = useState(false);
  const [loadingChannels, setLoadingChannels] = useState(true);

  const {currentWorkspace, loadingWorkspaces} = useWorkspace();

  // Consultar los channels del workspace cuando el workspace haya cargado
  useEffect(() => {
    if (currentWorkspace && !loadingWorkspaces) {
      axios<Channel[]>(`/api/workspace/${currentWorkspace.workspaceData.id}/channels`)
      .then((res) => setChannels(res.data))
      .catch((error: any) => {
        toast.error(error.message);
      })
      .finally(() => setLoadingChannels(false));
    }
  }, [currentWorkspace, loadingWorkspaces]);

  return (
    <aside className="flex flex-col justify-start items-center gap-2 w-full max-w-[270px] flex-grow flex-shrink-0 p-4 bg-neutral-800 border-r rounded-l-lg">
      {loadingChannels && (
        <>
          <div className="flex justify-between items-center w-full mb-4">
            <Skeleton className="w-[60%] h-5 bg-neutral-600" />
            <Skeleton className="w-8 h-8 rounded-full bg-neutral-600" />
          </div>

          <div className="flex flex-col gap-2 w-full">
            <Skeleton className="w-[80%] h-4 bg-neutral-600" />
            <Skeleton className="w-[80%] h-4 bg-neutral-600" />
            <Skeleton className="w-[80%] h-4 bg-neutral-600" />
          </div>

          <Separator className="w-full my-2 bg-neutral-600" />

          <div className="flex justify-between items-center w-full mb-4">
            <Skeleton className="w-[60%] h-5 bg-neutral-600" />
            <Skeleton className="w-8 h-8 rounded-full bg-neutral-600" />
          </div>

          <div className="flex flex-col gap-2 w-full">
            <Skeleton className="w-[80%] h-4 bg-neutral-600" />
            <Skeleton className="w-[80%] h-4 bg-neutral-600" />
            <Skeleton className="w-[80%] h-4 bg-neutral-600" />
          </div>
        </>
      )}

      {!loadingChannels && (
        <>
          <Collapsible
            className="flex flex-col gap-2 w-full"
            open={isChannelCollapsed}
            onOpenChange={(open) => setIsChannelCollapsed(open)}
          >
            <CreateChannelModal
              userId={userData.id}
              isOpen={isChannelModalOpen}
              setIsOpen={setIsChannelModalOpen}
            />

            <div className="flex justify-between items-center w-full">
              <CollapsibleTrigger className="flex justify-start items-center gap-2 flex-grow">
                {isChannelCollapsed ? <FaArrowDown /> : <FaArrowUp />}
                <Typography
                  className="font-bold"
                  variant="p"
                  text="Channels"
                />
              </CollapsibleTrigger>

              <Button
                className="w-8 h-8 p-1 flex-shrink-0 rounded-full hover:bg-neutral-900 group"
                variant="outline"
                onClick={() => setIsChannelModalOpen(true)}
              >
                <FaPlus className="group-hover:scale-125 transition-transform" />
              </Button>
            </div>

            {/* Renderizar los channels del workspace */}
            <CollapsibleContent>
              {channels.map((ch) => (
                <Typography
                  key={ch.id}
                  className={cn("px-2 py-1 text-sm rounded-sm bg-transparent cursor-pointer hover:bg-neutral-700 transition-colors")}
                  variant="p"
                  text={`#${ch.name}`}
                />
              ))}
            </CollapsibleContent>
          </Collapsible>

          <Separator className="w-full bg-neutral-700" />

          <Collapsible
            className="flex flex-col gap-2 w-full"
            open={isDmsCollapsed}
            onOpenChange={(open) => setIsDmsCollapsed(open)}
          >
            <div className="flex justify-between items-center w-full">
              <CollapsibleTrigger className="flex justify-start items-center gap-2 flex-grow">
                {isDmsCollapsed ? <FaArrowDown /> : <FaArrowUp />}
                <Typography
                  className="font-bold"
                  variant="p"
                  text="Direct Messages"
                />
              </CollapsibleTrigger>

              <Button
                className="w-8 h-8 p-1 flex-shrink-0 rounded-full hover:bg-neutral-900 group"
                variant="outline"
              >
                <FaPlus className="group-hover:scale-125 transition-transform" />
              </Button>
            </div>

            <CollapsibleContent>
              <Typography
                className={cn("px-2 py-1 text-sm rounded-sm bg-transparent cursor-pointer hover:bg-neutral-700 transition-colors")}
                variant="p"
                text="User 1"
              />

              <Typography
                className={cn("px-2 py-1 text-sm rounded-sm bg-transparent cursor-pointer hover:bg-neutral-700 transition-colors")}
                variant="p"
                text="User 2"
              />

              <Typography
                className={cn("px-2 py-1 text-sm rounded-sm bg-transparent cursor-pointer hover:bg-neutral-700 transition-colors")}
                variant="p"
                text="User 3"
              />
            </CollapsibleContent>
          </Collapsible>
        </>
      )}
    </aside>
  )
}

export default InfoSection
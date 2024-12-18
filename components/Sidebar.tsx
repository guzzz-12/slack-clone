"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RiHome2Fill } from "react-icons/ri";
import { PiChatsTeardrop } from "react-icons/pi";
import { FiPlus } from "react-icons/fi";
import toast from "react-hot-toast";
import WorkspaceItem from "./WorkspaceItem";
import Typography from "./Typography";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { Card, CardContent } from "./ui/card";
import { Skeleton } from "./ui/skeleton";
import { useWorkspace } from "@/hooks/useWorkspace";
import { supabaseBrowserClient } from "@/utils/supabase/supabaseBrowserClient";
import { cn } from "@/lib/utils";
import { User } from "@/types/supabase";

interface Props {
  userData: User;
}

const Sidebar = ({userData}: Props) => {
  const router = useRouter();

  const [isAway, setIsAway] = useState(() => userData.is_away);
  const [loading, setLoading] = useState(false);

  const {currentWorkspace, userWorkspaces, loadingWorkspaces} = useWorkspace();

  // Cerrar sesión
  const signoutHandler = async () => {
    try {
      setLoading(true);

      const {error} = await supabaseBrowserClient.auth.signOut();

      if (error) {
        throw new Error(error.message);
      }

      router.refresh();

    } catch (error: any) {
      toast.error(error.message);
      
    } finally {
      localStorage.removeItem("selectedWorkspaceId");
      setLoading(false);
    }
  }

  // Alternar el estado available/unavailable
  const isAwayHandler = async () => {
    try {
      setLoading(true);

      const {error} = await supabaseBrowserClient
        .from("users")
        .update({is_away: !isAway})
        .eq("id", userData.id);

      if (error) {
        throw new Error(error.message);
      }

      setIsAway(prev => !prev);

    } catch (error: any) {
      toast.error(error.message);
      
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col justify-start items-stretch h-full w-16 px-4 bg-black">
      <nav className="flex flex-col justify-between items-center flex-grow gap-4 max-h-full">
        {loadingWorkspaces && (
          <ul className="flex flex-col items-center gap-3 max-h-full flex-grow">
            <li className="w-10 h-10 mb-1">
              <Skeleton className="w-full h-full rounded-full" />
            </li>

            <li>
              <div className="flex flex-col items-center gap-2">
                <Skeleton className="w-10 h-10 rounded-lg" />
                <Skeleton className="w-full h-3" />
              </div>
            </li>

            <li>
              <div className="flex flex-col items-center gap-2">
                <Skeleton className="w-10 h-10 rounded-lg" />
                <Skeleton className="w-full h-3" />
              </div>
            </li>
          </ul>
        )}

        {!loadingWorkspaces && currentWorkspace && (
          <ul className="flex flex-col items-center gap-3 max-h-full flex-grow">
            <li className="w-10 h-10 mb-1 cursor-pointer">
              <TooltipProvider>
                <Tooltip delayDuration={250}>
                  <TooltipTrigger className="w-10 h-10">
                    <img
                      className="block w-full h-full object-cover object-center rounded-full"
                      src={currentWorkspace.workspaceData.image_url}
                      alt={currentWorkspace.workspaceData.name}
                    />
                  </TooltipTrigger>
                  
                  <TooltipContent
                    className="max-h-[350px] overflow-y-auto scrollbar-thin"
                    side="bottom"
                    sideOffset={10}
                  >
                    <Card className="w-[350px] border-0">
                      <CardContent className="flex flex-col p-0 gap-2">
                        {/* Mostrar el item del workspace actual */}
                        <WorkspaceItem
                          workspace={currentWorkspace.workspaceData}
                          loading={loading}
                        />

                        {/* Mostrar los demás workspaces del usuario */}
                        {userWorkspaces
                          .filter(w => w.id !== currentWorkspace.workspaceData.id)
                          .map(wsp => (
                            <Fragment key={wsp.id}>
                              <WorkspaceItem
                                workspace={wsp}
                                loading={loading}
                              />
                            </Fragment>
                          ))
                        }

                        <Separator />

                        <Link
                          className="flex items-center gap-2 px-2 py-1 group"
                          href="/create-workspace"
                          onClick={(e) => {
                            if (loading) {
                              e.preventDefault();
                            }
                          }}
                        >
                          <div className="flex justify-center items-center w-10 h-10 rounded-full bg-white/30">
                            <FiPlus
                              className="group-hover:scale-125 transition-all duration-300"
                              size={20}
                            />
                          </div>
                          
                          <Typography
                            className="text-sm"
                            variant="p"
                            text="Add workspace"
                          />
                        </Link>
                      </CardContent>
                    </Card>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </li>

            <li>
              <button
                className="flex flex-col items-center gap-1 text-white cursor-pointer"
                disabled={loading}
              >
                <div className="p-2 rounded-lg bg-white/30 group">
                  <RiHome2Fill
                    className="group-hover:scale-125 transition-all duration-300"
                    size={20}
                  />
                </div>
                <Typography
                  className="text-xs"
                  variant="p"
                  text="Home"
                />
              </button>
            </li>

            <li>
              <button
                className="flex flex-col items-center gap-1 text-white cursor-pointer"
                disabled={loading}
              >
                <div className="p-2 rounded-lg bg-white/30 group">
                  <PiChatsTeardrop
                    className="group-hover:scale-125 transition-all duration-300"
                    size={20}
                  />
                </div>
                <Typography
                  className="text-xs"
                  variant="p"
                  text="DMs"
                />
              </button>
            </li>
          </ul>
        )}
      </nav>

      {!loadingWorkspaces && (
        <div className="flex flex-col items-center gap-2">
          <TooltipProvider>
            <Tooltip delayDuration={250}>
              <TooltipTrigger disabled={loadingWorkspaces || loading} asChild>
                <Link
                  href="/create-workspace"
                  className="flex justify-center items-center w-10 h-10 p-2 rounded-full bg-white/30 group"
                >
                  <FiPlus
                    className="group-hover:scale-125 transition-all duration-300"
                    size={20}
                  />
                </Link>
              </TooltipTrigger>

              <TooltipContent side="right">
                <Typography
                  variant="p"
                  text="Create new"
                  className="text-sm"
                />
              </TooltipContent>
            </Tooltip>

            <Tooltip delayDuration={250}>
              <TooltipTrigger disabled={loadingWorkspaces || loading}>
                <div className="relative flex justify-center items-center w-10 h-10">
                  <img
                    className="block w-full h-full object-cover object-center rounded-lg"
                    src={userData.avatar_url!}
                    alt={userData.name || "User avatar"}
                  />

                  <div className={cn("absolute -bottom-0.5 -right-0.5 w-[14px] h-[14px] rounded-full border-[3px] border-white z-10", isAway ? "bg-neutral-400" : "bg-green-500")}/>
                </div>
              </TooltipTrigger>

              <TooltipContent className="px-4 py-3" side="right">
                <div className="flex justify-start items-center gap-2">
                  <img
                    className="block w-10 h-10 object-cover object-center rounded-full" 
                    src={userData.avatar_url!}
                    alt={userData.name || "User avatar"}
                    crossOrigin="anonymous"
                  />

                  <div className="flex flex-col gap-1">
                    <Typography
                      className="text-sm font-semibold"
                      variant="p"
                      text={userData.email}
                    />

                    <div className="flex justify-start items-center gap-1">
                      <div className={cn("w-3 h-3 rounded-full", isAway ? "bg-neutral-400" : "bg-green-500")}/>

                      <Typography
                        className="text-xs text-neutral-300"
                        variant="p"
                        text={isAway ? "Unavailable" : "Available"}
                      />
                    </div>
                  </div>
                </div>

                <Separator className="my-2" />

                <Button
                  className="w-full border"
                  variant="ghost"
                  size="sm"
                  disabled={loading}
                  onClick={isAwayHandler}
                >
                  {isAway ? "Change to available" : "Change to unavailable"}
                </Button>

                <Separator className="my-2" />

                <Button
                  className="w-full border"
                  variant="ghost"
                  size="sm"
                  disabled={loading}
                  onClick={signoutHandler}
                >
                  Signout
                </Button>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}
    </div>
  )
}

export default Sidebar
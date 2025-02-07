"use client";

import { Fragment, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import { RiHome2Fill } from "react-icons/ri";
import { PiChatsTeardrop } from "react-icons/pi";
import { FiPlus } from "react-icons/fi";
import { MdAlternateEmail } from "react-icons/md";
import toast from "react-hot-toast";
import WorkspaceItem from "./WorkspaceItem";
import Typography from "./Typography";
import InviteModal from "./InviteModal";
import ProfileModal from "./ProfileModal";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { Card, CardContent } from "./ui/card";
import { Skeleton } from "./ui/skeleton";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useUser } from "@/hooks/useUser";
import { supabaseBrowserClient } from "@/utils/supabase/supabaseBrowserClient";
import { cn } from "@/lib/utils";

const Sidebar = () => {
  const router = useRouter();

  const {user, setUser, setLoadingUser} = useUser();

  const [isAway, setIsAway] = useState(() => user?.is_away);
  const [openInviteModal, setOpenInviteModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const [openProfilePopover, setOpenProfilePopover] = useState(false);
  const [openProfileModal, setOpenProfileModal] = useState(false);

  const {currentWorkspace, userWorkspaces, loadingWorkspaces} = useWorkspace();

  // Consultar la data del usuario y actualizar el state global del user
  useEffect(() => {
    setLoadingUser(true);

    supabaseBrowserClient.auth.getSession()
    .then((res) => {
      if (res.data.session) {
        const userId = res.data.session.user.id;
        return supabaseBrowserClient.from("users").select("*").eq("id", userId).single();
      }
    })
    .then((res) => {
      if (res) {
        setUser(res.data);
      }
    })
    .catch((error) => {
      toast.error(error.message);
    })
    .finally(() => {
      setLoadingUser(false);
    });
  }, []);

  // Cerrar sesión
  const signoutHandler = async () => {
    try {
      setLoading(true);

      const {error} = await supabaseBrowserClient.auth.signOut();

      if (error) {
        throw new Error(error.message);
      }

      setUser(null);

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
    if (!user) {
      return;
    }

    try {
      setLoading(true);

      await axios({
        method: "POST",
        url: `/api/user-presence`,
        data: {
          isAway: !isAway
        }
      });

      setIsAway(prev => !prev);

    } catch (error: any) {
      toast.error(error.message);
      
    } finally {
      setLoading(false);
    }
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex flex-col justify-start items-stretch h-full w-16 flex-shrink-0 p-4 pt-0 bg-black">
      <InviteModal
        isOpen={openInviteModal}
        setIsOpen={setOpenInviteModal}
        workspaceId={currentWorkspace?.workspaceData.id}
        workspaceName={currentWorkspace?.workspaceData.name}
        inviteCode={currentWorkspace?.workspaceData.invite_code}
      />

      <ProfileModal
        open={openProfileModal}
        setOpen={setOpenProfileModal}
      />

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
              <Popover>
                <PopoverTrigger className="w-10 h-10">
                  <img
                    className="block w-full h-full object-cover object-center rounded-full"
                    src={currentWorkspace.workspaceData.image_url}
                    alt={currentWorkspace.workspaceData.name}
                  />
                </PopoverTrigger>

                <PopoverContent className="w-fit p-2 translate-x-[1rem]">
                  <Card className="w-[350px] border-0">
                    <CardContent className="flex flex-col p-0 gap-2">
                      {/* Mostrar el item del workspace actual */}
                      <WorkspaceItem
                        user={user}
                        workspace={currentWorkspace.workspaceData}
                        loading={loading}
                      />

                      {/* Mostrar los demás workspaces del usuario */}
                      {userWorkspaces
                        .filter(w => w.id !== currentWorkspace.workspaceData.id)
                        .map(wsp => (
                          <Fragment key={wsp.id}>
                            <WorkspaceItem
                              user={user}
                              workspace={wsp}
                              loading={loading}
                            />
                          </Fragment>
                        ))
                      }

                      {currentWorkspace?.workspaceData.admin_id === user?.id && (
                        <>
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
                        </>
                      )}
                    </CardContent>
                  </Card>
                </PopoverContent>
              </Popover>
            </li>

            <li>
              <Link
                href="/user-workspaces"
                className="flex flex-col items-center gap-1 text-white cursor-pointer"
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
              </Link>
            </li>

            <li>
              <button
                className="flex flex-col items-center gap-1 text-white cursor-pointer"
                disabled={loading}
              >
                <div className="p-2 rounded-lg bg-white/30 group" aria-hidden>
                  <PiChatsTeardrop
                    className="group-hover:scale-125 transition-all duration-300"
                    size={20}
                    aria-hidden
                  />
                </div>
                <Typography
                  className="text-xs"
                  variant="p"
                  text="Private Messages"
                />
              </button>
            </li>

            {currentWorkspace.workspaceData.admin_id === user?.id && (
              <li>
                <TooltipProvider>
                  <Tooltip delayDuration={250}>
                    <TooltipTrigger disabled={loading} asChild>
                      <button
                        className="flex flex-col items-center gap-1 text-white cursor-pointer"
                        disabled={loading}
                        aria-describedby="invite-tooltip-content"
                        onClick={() => setOpenInviteModal(true)}
                      >
                        <div className="p-2 rounded-lg bg-white/30 group" aria-hidden>
                          <MdAlternateEmail
                            className="group-hover:scale-125 transition-all duration-300"
                            size={20}
                            aria-hidden
                          />
                        </div>
                        <Typography
                          className="text-xs"
                          variant="p"
                          text="Invite"
                        />
                      </button>
                    </TooltipTrigger>

                    <TooltipContent
                      id="invite-tooltip-content"
                      className="max-w-[150px]"
                      side="right"
                      sideOffset={12}
                    >
                      <Typography
                        variant="p"
                        text="Invite your friends to join this workspace"
                        className="text-sm"
                      />
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </li>
            )}
          </ul>
        )}
      </nav>

      {!loadingWorkspaces && (
        <div className="flex flex-col items-center gap-3">
          {currentWorkspace?.workspaceData.admin_id === user?.id && 
            <TooltipProvider>
              <Tooltip delayDuration={250}>
                <TooltipTrigger disabled={loadingWorkspaces || loading} asChild>
                  <Link
                    href="/create-workspace"
                    className="flex justify-center items-center w-10 h-10 p-2 rounded-full bg-white/30 group"
                    aria-labelledby="create-workspace-tooltip-trigger-label"
                  >
                    <FiPlus
                      className="group-hover:scale-125 transition-all duration-300"
                      size={20}
                      aria-hidden
                    />
                    <span id="create-workspace-tooltip-trigger-label" hidden>
                      Create workspace
                    </span>
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
            </TooltipProvider>
          }

          <Popover
            open={openProfilePopover}
            onOpenChange={setOpenProfilePopover}
          >
            <PopoverTrigger disabled={loadingWorkspaces || loading}>
              <div className="relative flex justify-center items-center w-10 h-10">
                <img
                  className="block w-full h-full object-cover object-center rounded-lg"
                  src={user.avatar_url!}
                  alt={user.name || "User avatar"}
                />

                <div className={cn("absolute -bottom-0.5 -right-0.5 w-[14px] h-[14px] rounded-full border-[3px] border-white z-10", isAway ? "bg-neutral-400" : "bg-green-500")}/>
              </div>
            </PopoverTrigger>

            <PopoverContent className="translate-x-[0.5rem] translate-y-[-0.5rem]" side="right">
              <Button
                className="flex justify-start items-center gap-2 w-full h-auto border"
                variant="ghost"
                disabled={loading}
                onClick={() => {
                  setOpenProfilePopover(false);
                  setTimeout(() => {
                    setOpenProfileModal(true);                    
                  }, 500);
                }}
              >
                <img
                  className="block w-10 h-10 object-cover object-center rounded-full border" 
                  src={user.avatar_url!}
                  alt={user.name || "User avatar"}
                  aria-hidden
                />

                <div className="flex flex-col gap-1">
                  <Typography
                    className="text-sm font-semibold"
                    variant="p"
                    text={user.email}
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
              </Button>

              <Separator className="my-2" />

              <Button
                className="w-full mb-2 border"
                variant="ghost"
                size="sm"
                disabled={loading}
                onClick={isAwayHandler}
              >
                {isAway ? "Change to available" : "Change to unavailable"}
              </Button>

              <Button
                className="w-full border"
                variant="ghost"
                size="sm"
                disabled={loading}
                onClick={signoutHandler}
              >
                Signout
              </Button>
            </PopoverContent>
          </Popover>
        </div>
      )}
    </div>
  )
}

export default Sidebar
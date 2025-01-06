import Link from "next/link";
import Typography from "./Typography";
import { useWorkspace } from "@/hooks/useWorkspace";
import { Workspace } from "@/types/supabase";
import { cn } from "@/lib/utils";

interface Props {
  workspace: Workspace;
  loading: boolean;
}

const WorkspaceItem = ({workspace, loading}: Props) => {
  const {currentWorkspace} = useWorkspace();

  const isActive = currentWorkspace?.workspaceData.id === workspace.id;

  return (
    <Link
      className={cn("flex items-center gap-2 w-full px-2 py-1 rounded-sm bg-transparent hover:bg-neutral-700 cursor-pointer transition-all", isActive && "bg-neutral-700")}
      href={`/workspace/${workspace.id}`}
      onClick={(e) => {
        if (loading) {
          e.preventDefault();
        }
      }}
    >
      <img
        className="block w-10 h-10 object-cover object-center rounded-full"
        src={workspace.image_url}
        alt={workspace.name}
      />

      <div className="w-full overflow-hidden">
        <Typography
          className="max-w-full text-sm truncate"
          variant="p"
          text={workspace.name}
        />
        <Typography
          className="text-xs text-neutral-500"
          variant="p"
          text={workspace.invite_code}
        />
      </div>
    </Link>
  )
}

export default WorkspaceItem
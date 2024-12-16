import Link from "next/link";
import Typography from "./Typography";
import { Workspace } from "@/types/supabase";

interface Props {
  workspace: Workspace;
  loading: boolean;
}

const WorkspaceItem = ({workspace, loading}: Props) => {
  return (
    <Link
      className="flex items-center gap-2 px-2 py-1 hover:opacity-70 cursor-pointer"
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

      <div>
        <Typography
          className="text-sm"
          variant="p"
          text={workspace.name}
        />
        {workspace.invite_code && (
          <Typography
            className="text-xs text-neutral-500"
            variant="p"
            text={workspace.invite_code}
          />
        )}
      </div>
    </Link>
  )
}

export default WorkspaceItem
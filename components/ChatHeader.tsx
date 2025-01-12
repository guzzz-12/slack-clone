import SearchBar from "./SearchBar";
import { Skeleton } from "./ui/skeleton";

interface Props {
  currentWorkspaceId: string;
  currentChannelId: string;
  title: string | undefined;
  loading: boolean;
}

const ChatHeader = ({currentWorkspaceId, currentChannelId, title, loading}: Props) => {
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
          <h2 className="text-base font-normal flex-grow truncate">
            {title}
          </h2>
          
          <SearchBar
            currentWorkspaceId={currentWorkspaceId}
            currentChannelId={currentChannelId}
            placeholder={title!}
          />
        </>
      )}
    </header>
  )
}

export default ChatHeader
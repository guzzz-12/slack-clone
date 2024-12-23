import { MdHeadset } from "react-icons/md";
import { Skeleton } from "./ui/skeleton";

interface Props {
  title: string | undefined;
  loading: boolean;
}

const ChatHeader = ({title, loading}: Props) => {
  return (
    <header className="flex justify-between items-center gap-2 w-full min-h-[45px] px-4 py-2 flex-shrink-0 border-b border-neutral-900 bg-neutral-800">
      {loading && (
        <>
          <Skeleton className="w-1/2 h-5 bg-neutral-600" />
          <Skeleton className="w-5 h-5 bg-neutral-600" />
        </>
      )}

      {!loading && (
        <>
          <h2 className="text-base font-normal flex-grow truncate">
            {title}
          </h2>
          <MdHeadset className="text-2xl flex-shrink-0" />
        </>
      )}
    </header>
  )
}

export default ChatHeader
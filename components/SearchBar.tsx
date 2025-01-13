import { ChangeEvent } from "react";
import { MdSearch } from "react-icons/md";
import { Input } from "./ui/input";
import { useMessages } from "@/hooks/useMessages";

interface Props {
  currentWorkspaceId: string;
  currentChannelId: string;
  placeholder: string;
}

const SearchBar = ({placeholder}: Props) => {
  const {term, setTerm, loadingMessages} = useMessages();

  const onChangeHandler = (e: ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setTerm(term);
  }

  return (
    <search>
      <form
        className="relative w-[240px]"
        noValidate
        onSubmit={(e) => e.preventDefault()}
      >
        <MdSearch
          className="absolute left-2 top-1/2 text-neutral-400 -translate-y-1/2"
          size={24}
        />
        <Input
          className="w-full pl-9 border"
          type="search"
          placeholder={`Search in ${placeholder}...`}
          disabled={loadingMessages}
          value={term || ""}
          onChange={onChangeHandler}
        />
      </form>
    </search>
  )
}

export default SearchBar
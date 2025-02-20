import { ChangeEvent } from "react";
import { MdSearch } from "react-icons/md";
import { Input } from "./ui/input";
import { useMessages } from "@/hooks/useMessages";
import { Label } from "./ui/label";

const SearchBar = () => {
  const { term, setTerm, loadingMessages } = useMessages();

  const onChangeHandler = (e: ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setTerm(term);
  }

  return (
    <search aria-labelledby="search-messages-label">
      <span id="search-messages-label" hidden>
        Search messages in this chat
      </span>

      <form
        className="relative w-[240px]"
        noValidate
        onSubmit={(e) => e.preventDefault()}
      >
        <MdSearch
          className="absolute left-2 top-1/2 text-neutral-400 -translate-y-1/2"
          size={24}
          aria-hidden
        />

        <span id="search-input" hidden>
          Search messages
        </span>

        <Input
          aria-labelledby="search-input"
          className="w-full pl-9 border"
          type="search"
          disabled={loadingMessages}
          value={term || ""}
          onChange={onChangeHandler}
        />
      </form>
    </search>
  )
}

export default SearchBar
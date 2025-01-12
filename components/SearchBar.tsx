import { ChangeEvent, useEffect, useState } from "react";
import axios, { isAxiosError } from "axios";
import { MdSearch } from "react-icons/md";
import toast from "react-hot-toast";
import { Input } from "./ui/input";
import { useDebounce } from "@/hooks/useDebounce";
import { useMessages } from "@/hooks/useMessages";
import { PaginatedMessages } from "@/types/paginatedMessages";

interface Props {
  currentWorkspaceId: string;
  currentChannelId: string;
  placeholder: string;
}

const SearchBar = ({currentWorkspaceId, currentChannelId, placeholder}: Props) => {
  const [term, setTerm] = useState("");
  const [searching, setSearching] = useState(false);

  const {messages, loadingMessages, page, hasMore, setLoadingMessages, setHasMore, setMessages} = useMessages();
  const {debouncedValue} = useDebounce(term);

  useEffect(() => {
    if (debouncedValue.length > 0) {
      setSearching(true);
      setLoadingMessages(true);
      setMessages([]);
      setHasMore(true);

      axios<PaginatedMessages>({
        method: "GET",
        url: `/api/workspace/${currentWorkspaceId}/channels/${currentChannelId}/messages/search`,
        params: {
          searchTerm: debouncedValue,
          page
        }
      })
      .then((res) => {
        setMessages(res.data.messages);
        setHasMore(res.data.hasMore);
      })
      .catch((error: any) => {
        let message = error.message;

        if (isAxiosError(error)) {
          message = error.response?.data.message;
        }

        toast.error(message);
      })
      .finally(() => {
        setSearching(false);
        setLoadingMessages(false);
      });
    }
  }, [debouncedValue, page]);

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
          disabled={searching}
          value={term}
          onChange={onChangeHandler}
        />
      </form>
    </search>
  )
}

export default SearchBar
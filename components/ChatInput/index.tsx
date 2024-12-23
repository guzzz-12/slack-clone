"use client"

import { useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Picker from "@emoji-mart/react";
import data from "@emoji-mart/data";
import axios, { AxiosError } from "axios";
import toast from "react-hot-toast";
import { BsEmojiSmile, BsSendFill } from "react-icons/bs";
import { FiPlus } from "react-icons/fi";
import { useTheme } from "next-themes";
import MenuBar from "@/components/ChatInput/MenuBar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { MessageWithSender } from "@/types/supabase";

interface Props {
  workspaceId: string;
  channelId: string | undefined;
  isLoading: boolean;
}

const ChatInput = ({workspaceId, channelId, isLoading}: Props) => {
  const {theme} = useTheme();

  const [sending, setSending] = useState(false);

  const editor = useEditor({
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "w-full flex-grow"
      },
    },
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: "Type your message...",
      })
    ]
  });

  const onSubmitHandler = async () => {
    try {
      if (!editor) {
        return;
      }

      setSending(true);

      const message = editor.getHTML();

      // if (message.length === 0 || message.trim() === "") {
      //   return;
      // }
      
      const messageData = {
        textContent: message,
        workspaceId,
        channelId,
      }

      const res = await axios<MessageWithSender>({
        method: "POST",
        url: "/api/socket/messages",
        data: messageData
      });

      console.log(res.data);
      
    } catch (error: any) {
      let message = error.message;

      if (error instanceof AxiosError) {
        message = error.response?.data.message;
      }

      toast.error(message);

    } finally {
      setSending(false);
    }
  }

  return (
    <div className="relative flex flex-col justify-start w-full max-h-[270px] border-t overflow-y-auto scrollbar-thin">
      {/* Header del input del chat */}
      <div className="sticky top-0 flex justify-between items-center gap-2 w-full flex-shrink-0 px-4 py-2 bg-neutral-950 z-50">
        {isLoading &&
          <>
            <div className="flex justify-start items-center gap-2 w-full">
              <Skeleton className="w-7 h-7 rounded-full bg-neutral-600" />
              <Skeleton className="w-7 h-7 rounded-full bg-neutral-600" />
              <Skeleton className="w-7 h-7 rounded-full bg-neutral-600" />
              <Skeleton className="w-7 h-7 rounded-full bg-neutral-600" />
              <Skeleton className="w-7 h-7 rounded-full bg-neutral-600" />
              <Skeleton className="w-7 h-7 rounded-full bg-neutral-600" />
            </div>

            <div className="flex justify-between items-center gap-2">
              <Skeleton className="w-7 h-7 rounded-full bg-neutral-600" />
              <Skeleton className="w-7 h-7 rounded-full bg-neutral-600" />
            </div>
          </>
        }

        {!isLoading &&
          <>
            <MenuBar editor={editor} />

            <div className="flex justify-between items-center gap-2">
              <Popover>
                <PopoverTrigger className="" asChild>
                  <button className="w-6 h-6 rounded-full bg-neutral-300">
                    <BsEmojiSmile className="block w-full h-full text-neutral-900" />
                  </button>
                </PopoverTrigger>

                <PopoverContent className="w-fit p-0" side="top" sideOffset={10}>
                  <Picker
                    data={data}
                    theme={theme}
                    onEmojiSelect={(emoji: any) => editor?.chain().focus().insertContent(emoji.native).run()}
                  />
                </PopoverContent>
              </Popover>

              <button className="w-6 h-6 rounded-full bg-neutral-300">
                <FiPlus className="block w-full h-full text-neutral-900" />
              </button>
            
            </div>
          </>
        }
      </div>

      {isLoading && (
        <div className="w-full h-[70px]" />
      )}

      {!isLoading && (
        <>
          <EditorContent
            className="flex-col w-full h-full flex-grow px-4 pr-16 text-white prose"
            disabled={isLoading || sending}
            editor={editor}
          />

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className="sticky left-full bottom-2 w-12 h-8 p-1.5 rounded-full border border-transparent bg-neutral-300 -translate-x-2 z-10 hover:bg-neutral-400 transition-colors"
                  disabled={sending}
                  onClick={onSubmitHandler}
                >
                  <BsSendFill className="block w-full h-full text-neutral-900" />
                </button>
              </TooltipTrigger>

              <TooltipContent>
                Send
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </>
      )}
    </div>
  )
}

export default ChatInput
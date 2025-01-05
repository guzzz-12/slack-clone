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
import AttachmentModal from "./AttachmentModal";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageWithSender } from "@/types/supabase";

interface Props {
  workspaceId: string;
  channelId: string;
  isLoading: boolean;
}

const ChatInput = ({workspaceId, channelId, isLoading}: Props) => {
  const {theme} = useTheme();

  const [sending, setSending] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);
  const [openFileModal, setOpenFileModal] = useState(false);

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

  // Detectar si el mensaje esta vacio al escribir
  editor?.on("update", (e) => {
    setIsEmpty(e.editor.isEmpty);
  });

  const onSubmitHandler = async () => {
    try {
      if (!editor) {
        return;
      }

      setSending(true);

      const textContent = editor.getHTML();

      // No permitir enviar mensajes vacios
      if (textContent.length === 0 || textContent.trim() === "") {
        return;
      }

      const formData = new FormData();
      formData.append("textContent", textContent);

      await axios<MessageWithSender>({
        method: "POST",
        url: `/api/workspace/${workspaceId}/channels/${channelId}/messages`,
        data: formData,
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });

      // Limpiar el editor al enviar el mensaje
      editor.commands.clearContent(true);
      
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
    <div className="relative flex flex-col justify-start w-full min-h-[150px] max-h-[270px] border-t overflow-y-auto scrollbar-thin">
      {/* Modal de archivos a enviar como attachments */}
      <AttachmentModal
        workspaceId={workspaceId}
        channelId={channelId}
        isOpen={openFileModal}
        setIsOpen={setOpenFileModal}
      />

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

                <PopoverContent
                  className="w-fit p-0 translate-x-[-16px]"
                  side="top"
                  sideOffset={16}
                >
                  <Picker
                    data={data}
                    theme={theme}
                    previewPosition="none"
                    maxFrequentRows={0}
                    onEmojiSelect={(emoji: any, _e: PointerEvent) => {
                      editor?.chain().insertContent(emoji.native).run();
                    }}
                  />
                </PopoverContent>
              </Popover>

              <button
                className="w-6 h-6 rounded-full bg-neutral-300"
                onClick={() => setOpenFileModal(true)}
              >
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
            className="flex flex-col w-full h-full flex-grow text-white prose"
            disabled={isLoading || sending}
            editor={editor}
          />

          <button
            className="absolute right-1.5 bottom-2 w-12 h-8 p-1.5 rounded-full border border-transparent bg-neutral-300 -translate-x-2 z-10 hover:bg-neutral-400 transition-colors disabled:cursor-not-allowed disabled:bg-neutral-400"
            disabled={sending || isEmpty}
            onClick={onSubmitHandler}
          >
            <BsSendFill className="block w-full h-full text-neutral-900" />
          </button>
        </>
      )}
    </div>
  )
}

export default ChatInput
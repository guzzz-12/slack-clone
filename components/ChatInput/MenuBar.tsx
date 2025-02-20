"use client"

import { ReactNode } from "react";
import { Editor } from "@tiptap/react";
import { icons } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface Props {
  editor: Editor | null;
}

interface MenuBarItemProps {
  content: ReactNode;
  icon: keyof typeof icons;
  label: string;
  description: string;
  editor: Editor | null;
  item: "bold" | "italic" | "strike" | "code" | "orderedList" | "bulletList" | "codeBlock";
  disabled: boolean;
  onClick: () => void;
}

/** Item del menú del editor */
const MenuBarItem = ({ content, icon, label, description, item, editor, disabled, onClick }: MenuBarItemProps) => {
  const Icon = icons[icon];

  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            className={cn("w-7 h-7 p-[3px] rounded-full border border-transparent", editor?.isActive(item) && "border-neutral-300")}
            disabled={disabled}
            aria-labelledby={`item-label-${item.toLowerCase()}`}
            aria-describedby={`item-description-${item.toLowerCase()}`}
            onClick={onClick}
          >
            <span id={`item-label-${item.toLowerCase()}`} hidden>{label}</span>
            <span id={`item-description-${item.toLowerCase()}`} hidden>{description}</span>
            <Icon className="block w-full h-full" aria-hidden />
          </button>
        </TooltipTrigger>

        <TooltipContent id="content">
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
};

const MenuBar = ({ editor }: Props) => {
  return (
    <div className="flex justify-start items-center gap-2 w-full">
      <TooltipProvider delayDuration={100}>
        <MenuBarItem
          content="Bold"
          icon="Bold"
          label="Text Bold"
          description="Toggle text bold style"
          item="bold"
          editor={editor}
          disabled={!editor?.can().chain().focus().toggleBold().run()}
          onClick={() => editor?.chain().focus().toggleBold().run()}
        />

        <MenuBarItem
          content="Italic"
          icon="Italic"
          label="Text Italic"
          description="Toggle text italic style"
          item="italic"
          editor={editor}
          disabled={!editor?.can().chain().focus().toggleItalic().run()}
          onClick={() => editor?.chain().focus().toggleItalic().run()}
        />

        <MenuBarItem
          content="Strike"
          icon="Strikethrough"
          label="Text Strikethrough"
          description="Toggle text strikethrough"
          item="strike"
          editor={editor}
          disabled={!editor?.can().chain().focus().toggleStrike().run()}
          onClick={() => editor?.chain().focus().toggleStrike().run()}
        />

        <MenuBarItem
          content="Bullet List"
          icon="List"
          label="Bullet List"
          description="Toggle bullet list"
          item="bulletList"
          editor={editor}
          disabled={!editor?.can().chain().focus().toggleBulletList().run()}
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
        />

        <MenuBarItem
          content="Ordered List"
          icon="ListOrdered"
          label="Ordered List"
          description="Toggle ordered list"
          item="orderedList"
          editor={editor}
          disabled={!editor?.can().chain().focus().toggleOrderedList().run()}
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
        />

        <MenuBarItem
          content="Code"
          icon="Code"
          label="Code"
          description="Toggle code style"
          item="code"
          editor={editor}
          disabled={!editor?.can().chain().focus().toggleCode().run()}
          onClick={() => editor?.chain().focus().toggleCode().run()}
        />

        <MenuBarItem
          content="Code Block"
          icon="SquareCode"
          label="Code Block"
          description="Toggle code block style"
          item="codeBlock"
          editor={editor}
          disabled={!editor?.can().chain().focus().toggleCodeBlock().run()}
          onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
        />
      </TooltipProvider>
    </div>
  )
}

export default MenuBar
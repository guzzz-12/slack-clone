"use client"

import { Dispatch, SetStateAction, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Button } from "./ui/button";
import { useInertAttribute } from "@/hooks/useInertAttribute";

interface Props {
  open: boolean;
  title: string;
  description: string;
  loading: boolean;
  callback: () => void;
  setOpen: Dispatch<SetStateAction<boolean>>;
}

const ConfirmationModal = (props: Props) => {
  const { open, title, description, loading, callback, setOpen } = props;

  const modalRef = useRef<HTMLDialogElement | null>(null);
  const confirmBtnRef = useRef<HTMLButtonElement | null>(null);
  const cancelBtnRef = useRef<HTMLButtonElement | null>(null);

  const { setInert } = useInertAttribute();

  // Focus trap y cerrar modal al pulsar escape
  const handleKeyDown = (event: KeyboardEvent) => {
    if (open && event.key === "Escape") {
      setInert(false);
      setOpen(false);
    }

    if (event.key === "Tab") {
      if (event.shiftKey) {
        if (document.activeElement === confirmBtnRef.current) {
          event.preventDefault();
          cancelBtnRef.current!.focus();
        }
      } else {
        if (document.activeElement === cancelBtnRef.current) {
          event.preventDefault();
          confirmBtnRef.current!.focus();
        }
      }
    }
  };

  // Deshabilitar el scroll del body,
  // dar focus al botón de confirmación y
  // hacer inertes todos los elementos interactivos
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      confirmBtnRef.current!.focus();
      setInert(true);
    } else {
      document.body.style.overflow = "unset";
      setInert(false);
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  if (!open) return null;

  const Dialog = (
    <dialog
      ref={modalRef}
      className="fixed top-0 left-0 flex justify-center items-center w-full h-screen bg-black/80 z-[1000]"
      aria-labelledby="modal-title"
      aria-describedby="modal-description"
    >
      <section
        className="flex flex-col justify-center items-center gap-4 p-4 bg-neutral-800 rounded-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col justify-center items-center">
          <h1
            id="modal-title"
            className="text-lg font-semibold"
          >
            {title}
          </h1>

          <p
            id="modal-description"
            className="text-sm opacity-90"
          >
            {description}
          </p>
        </div>

        <div className="w-full h-[1px] bg-neutral-600" />

        <footer className="flex justify-end items-center gap-2">
          <Button
            ref={confirmBtnRef}
            variant="destructive"
            disabled={loading}
            onClick={(e) => {
              if (loading) return;
              callback();
              setOpen(false);
            }}
          >
            Confirm
          </Button>

          <Button
            ref={cancelBtnRef}
            variant="outline"
            disabled={loading}
            onClick={(e) => {
              if (loading) return;
              setOpen(false);
            }}
          >
            Cancel
          </Button>
        </footer>
      </section>
    </dialog>
  );

  return createPortal(Dialog, document.body);
}

export default ConfirmationModal
"use client"

import { Dispatch, SetStateAction } from "react";
import Lightbox from "yet-another-react-lightbox";
import LightboxZoom from "yet-another-react-lightbox/plugins/zoom";
import { MessageWithSender } from "@/types/supabase";
import "yet-another-react-lightbox/styles.css";

interface Props {
  message: MessageWithSender
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
}

const ImageLightbox = ({message, isOpen, setIsOpen}: Props) => {

  if (message.message_type !== "image") return null;

  return (
    <Lightbox
      open={isOpen}
      close={() => setIsOpen(false)}
      plugins={[LightboxZoom]}
      slides={[{src: message.attachment_url!, alt: message.sender.name || message.sender.email}]}
      
      render={{buttonPrev: () => null, buttonNext: () => null}}
    />
  )
}

export default ImageLightbox;
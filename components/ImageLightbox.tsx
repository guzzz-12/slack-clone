"use client"

import Lightbox from "yet-another-react-lightbox";
import LightboxZoom from "yet-another-react-lightbox/plugins/zoom";
import { useImageLightbox } from "@/hooks/useImageLightbox";
import "yet-another-react-lightbox/styles.css";

const ImageLightbox = () => {
  const {message, open, setOpen, setMessage} = useImageLightbox();

  if (!message || message.message_type !== "image") return null;

  return (
    <Lightbox
      open={open}
      close={() => {
        setOpen(false);
        setMessage(null);
      }}
      plugins={[LightboxZoom]}
      slides={[{src: message.attachment_url!, alt: message.sender.name || message.sender.email}]}
      render={{buttonPrev: () => null, buttonNext: () => null}}
    />
  )
}

export default ImageLightbox;
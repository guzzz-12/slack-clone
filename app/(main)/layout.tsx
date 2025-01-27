import { ReactNode } from "react";
import Sidebar from "@/components/Sidebar";
import InfoSection from "@/components/InfoSection";
import ImageLightbox from "@/components/ImageLightbox";

interface Props {
  children: ReactNode;
}

export const revalidate = 0;

const MainLayout = async ({children}: Props) => {
  return (
    <section className="flex justify-start items-stretch h-screen pt-8 pr-2 pb-2 bg-black">
      <Sidebar />
      <InfoSection />
      <ImageLightbox />
      {children}
    </section>
  );
}

export default MainLayout
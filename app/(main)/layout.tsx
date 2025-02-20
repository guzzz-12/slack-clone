import { ReactNode } from "react";
import Sidebar from "@/components/Sidebar";
import InfoSection from "@/components/InfoSection";
import ImageLightbox from "@/components/ImageLightbox";
import MainSection from "@/components/MainSection";

interface Props {
  children: ReactNode;
}

export const revalidate = 0;

const MainLayout = async ({ children }: Props) => {
  return (
    <MainSection>
      <Sidebar />
      <InfoSection />
      <ImageLightbox />
      {children}
    </MainSection>
  );
}

export default MainLayout
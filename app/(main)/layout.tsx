import { ReactNode } from "react";
import Sidebar from "@/components/Sidebar";
import InfoSection from "@/components/InfoSection";
import { getUserData } from "@/utils/getUserData";

interface Props {
  children: ReactNode;
}

export const revalidate = 0;

const MainLayout = async ({children}: Props) => {
  const user = await getUserData();

  return (
    <section className="flex justify-start items-stretch h-screen pt-8 pr-4 pb-2 bg-black">
      <Sidebar userData={user} />
      <InfoSection />
      {children}
    </section>
  );
}

export default MainLayout
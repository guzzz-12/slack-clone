"use client"

import { ReactNode } from "react";
import { useInertAttribute } from "@/hooks/useInertAttribute";

const MainSection = ({ children }: { children: ReactNode }) => {
  const { inert } = useInertAttribute();

  return (
    <section
      className="flex justify-start items-stretch h-screen pt-8 pr-2 pb-2 bg-black"
      {...(inert ? { inert: "" } : {})}
    >
      {children}
    </section>
  )
}

export default MainSection;
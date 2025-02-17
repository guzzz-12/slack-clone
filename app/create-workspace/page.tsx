"use client"

import { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {AnimatePresence, motion} from "framer-motion";
import Step1 from "@/components/createWorkspace/Step1";
import Step2 from "@/components/createWorkspace/Step2";
import Typography from "@/components/Typography";
import { WorkspaceFormSchema } from "@/utils/formSchemas";
import { pageBaseTitle } from "@/utils/constants";
import { BsSlack } from "react-icons/bs";

export type FormType = z.infer<typeof WorkspaceFormSchema>


const CreateWorkspacePage = () => {
  const [step, setStep] = useState<1|2>(1);

  const formProps = useForm<FormType>({
    resolver: zodResolver(WorkspaceFormSchema),
    defaultValues: {
      name: "",
      image: undefined
    }
  });

  // Actualizar el title de la página
  useEffect(() => {
    document.title = `${pageBaseTitle} | Create workspace`;
  }, []);

  return (
    <main className="grid place-content-center w-screen h-screen bg-neutral-800 text-white">
      <section className="flex flex-col justify-center items-center w-[550px] mb-4">
        <div className="flex justify-center items-center gap-3 mb-2">
          <BsSlack size={30} />
          <Typography variant="h1" text="TeamFlow" />
        </div>

        <Typography
          className="mb-1"
          variant="p"
          text="Create a workspace or join an existing workspace if you have an invitation link."
        />
      </section>

      <section className="w-[550px] px-6 py-4 border rounded-md border-neutral-400">
        <FormProvider {...formProps}>
          <AnimatePresence initial={true} mode="wait">
            {step === 1 && (
              <motion.article
                key="step-1"
                initial={{y: -10, opacity: 0}}
                animate={{y: 0, opacity: 1}}
                exit={{y: -10, opacity: 0}}
              >
                <Typography
                  className="text-neutral-400"
                  text={`Step ${step} of 2`}
                  variant="p"
                />
                <Step1 setStep={setStep} />
              </motion.article>
            )}

            {step === 2 && (
              <motion.article
                key="step-2"
                initial={{y: -10, opacity: 0}}
                animate={{y: 0, opacity: 1}}
                exit={{y: -10, opacity: 0}}
              >
                <Typography
                  className="text-neutral-400"
                  text={`Step ${step} of 2`}
                  variant="p"
                />
                <Step2 setStep={setStep} />
              </motion.article>
            )}
          </AnimatePresence>
        </FormProvider>
      </section>
    </main>
  )
}

export default CreateWorkspacePage
"use client"

import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useFormContext } from "react-hook-form";
import Typography from "../Typography";
import FormErrorMessage from "../FormErrorMessage";
import { FormControl, FormField, FormItem } from "../ui/form";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { FormType } from "@/app/create-workspace/page";
import { cn } from "@/lib/utils";

interface Props {
  setStep: Dispatch<SetStateAction<1|2>>;
}

const Step1 = ({setStep}: Props) => {
  const router = useRouter();

  const [selectedWorkspace, setSelectedWorkspace] = useState("");
  
  useEffect(() => {
    const selectedWorkspaceId = localStorage.getItem("selectedWorkspaceId");

    if (selectedWorkspaceId) {
      setSelectedWorkspace(selectedWorkspaceId);
    }
  }, []);

  const formProps = useFormContext<FormType>();

  const {theme} = useTheme();

  const onSubmitHandler = async () => {
    // Validar manualmente el campo name al intentar pasar al siguiente step
    const triggered = await formProps.trigger("name", {shouldFocus: true});

    if (triggered) {
      return setStep(2);
    }
  }

  return (
    <div>
      <Typography
        className="mb-2"
        variant="h2"
        text="What is the name of your company or team?"
      />

      <Typography
        className="mb-6 text-neutral-300 leading-tight"
        variant="p"
        text="This will be the name of your workspace. Write something that your team will recognize."
      />

      <form
        className="flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmitHandler();
        }}
      >
        <FormField
          name="name"
          control={formProps.control}
          render={({field}) => (
            <FormItem>
              <FormControl>
                <Input
                  className={cn("px-3 py-5 text-base", theme === "light" ? "text-neutral-900" : "text-white", formProps.formState.errors.name ? "border-destructive" : "border")}
                  placeholder="My Workspace"
                  {...field}
                />
              </FormControl>
              
              <FormErrorMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-start items-center gap-1 w-full">
          <Button
            className="w-max text-white bg-primary-dark hover:bg-primary-light"
            type="submit"
          >
            <Typography
              text="Continue"
              variant="p"
            />
          </Button>

          {/* Navegar de regreso al workspace seleccionado */}
          {selectedWorkspace && (
            <Button
              className="w-max text-white hover:bg-neutral-900"
              variant="ghost"
              type="button"
              onClick={() => {
                router.push(`/workspace/${selectedWorkspace}`);
              }}
            >
              <Typography
                text="Cancel"
                variant="p"
              />
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}

export default Step1;
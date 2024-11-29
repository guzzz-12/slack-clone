"use client"

import { Dispatch, SetStateAction } from "react";
import { useFormContext } from "react-hook-form";
import { useTheme } from "next-themes";
import Typography from "../Typography";
import FormErrorMessage from "./FormErrorMessage";
import { FormControl, FormField, FormItem } from "../ui/form";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { FormType } from "@/app/workspace/create/page";
import { cn } from "@/lib/utils";

interface Props {
  setStep: Dispatch<SetStateAction<1|2>>;
}

const Step1 = ({setStep}: Props) => {
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
                  className={cn(theme === "light" ? "text-neutral-900" : "text-white", formProps.formState.errors.name ? "border-destructive" : "border")}
                  placeholder="My Workspace"
                  {...field}
                />
              </FormControl>
              
              <FormErrorMessage />
            </FormItem>
          )}
        />

        <Button className="w-max text-white bg-primary-dark hover:bg-primary-light">
          <Typography
            text="Continue"
            variant="p"
          />
        </Button>
      </form>
    </div>
  );
}

export default Step1;
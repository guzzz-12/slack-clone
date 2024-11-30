import { useTheme } from "next-themes";
import { FormMessage } from "./ui/form";
import { cn } from "@/lib/utils";

const FormErrorMessage = () => {
  const { theme } = useTheme();

  return (
    <FormMessage className={cn("text-left translate-y-[-5px]", theme === "dark" ? "text-red-500" : "text-destructive")} />
  )
}

export default FormErrorMessage;
import { HTMLAttributes } from "react";
import { IoCheckmarkCircleOutline, IoWarningOutline } from "react-icons/io5";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  type: "success" | "error";
  title: string;
  subtitle?: string;
  className?: HTMLAttributes<HTMLElement>["className"];
}

const Alert = ({open, type, title, subtitle, className}: Props) => {
  return (
    <div
      className={cn("rounded-md custom-alert", type === "success" ? "bg-green-100 border-green-700" : "bg-red-100 border-destructive", className)}
      role={type === "error" ? "alert" : "status"}
    >
      {open &&
        <div className="flex justify-start items-center gap-2">
          {type === "success" && (
            <IoCheckmarkCircleOutline
              className="text-green-700"
              size={27}
              aria-hidden
            />
          )}

          {type === "error" && (
            <IoWarningOutline
              className="text-destructive"
              size={27}
              aria-hidden
            />
          )}

          <div className={cn("flex flex-col justify-center items-start", type === "success" ? "text-green-700" : "text-destructive")}>
            <h2 className="text-sm font-semibold">
              {title}
            </h2>
            
            {subtitle &&
              <p className="text-xs opacity-90">
                {subtitle}
              </p>
            }
          </div>
        </div>
      }
    </div>
  )
}

export default Alert
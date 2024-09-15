import { IoCheckmarkCircleOutline, IoWarningOutline } from "react-icons/io5";
import { cn } from "@/lib/utils";

interface Props {
  type: "success" | "error";
  title: string;
  subtitle?: string;
}

const Alert = ({type, title, subtitle}: Props) => {
  return (
    <div className={cn("flex justify-start items-center gap-2 p-3 rounded-md border", type === "success" ? "border-green-700 bg-green-700/5" : "border-destructive bg-destructive/5")}>
      {type === "success" && <IoCheckmarkCircleOutline className="text-green-700" size={27} />}
      {type === "error" && <IoWarningOutline className="text-destructive" size={27} />}

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
  )
}

export default Alert
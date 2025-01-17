import { LuLoader2 } from "react-icons/lu";

interface Props {
  size?: number;
}

const Spinner = ({size = 30}: Props) => {
  return (
    <div className="absolute top-0 left-0 flex justify-center items-center w-full h-full bg-white z-10">
      <LuLoader2 className="text-primary-light animate-spin" size={size} />
    </div>
  )
}

export default Spinner
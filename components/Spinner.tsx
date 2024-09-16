import { LuLoader2 } from "react-icons/lu";

const Spinner = () => {
  return (
    <div className="absolute top-0 left-0 flex justify-center items-center w-full h-full bg-white z-10">
      <LuLoader2 className="text-primary-light animate-spin" size={30} />
    </div>
  )
}

export default Spinner
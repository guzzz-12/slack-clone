import { redirect } from "next/navigation";
import { getAllUserWorkspaces } from "@/utils/getUserData";

const Home = async () => {
  // Consultar el útimo workspace del usuario
  const workspaces = await getAllUserWorkspaces(true);

  if (workspaces.length === 0) {
    return redirect("/create-workspace");
  }

  return redirect("/user-workspaces");
}

export default Home;
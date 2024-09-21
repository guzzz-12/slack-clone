import { redirect } from "next/navigation";
import { getAllUserWorkspaces } from "@/utils/getUserData";

const Home = async () => {
  // Consultar el útimo workspace del usuario
  const workspaces = await getAllUserWorkspaces(true);

  if (workspaces.length === 0) {
    return redirect("workspace/create");
  }

  return redirect(`/workspace/${workspaces[0].id}`);
}

export default Home;
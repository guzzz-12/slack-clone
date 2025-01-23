import { Metadata } from "next";
import Link from "next/link";
import { FaArrowRight } from "react-icons/fa6";
import { FiPlus } from "react-icons/fi";
import { Separator } from "@/components/ui/separator";
import SignoutBtn from "@/components/SignoutBtn";
import { getUserData } from "@/utils/getUserData";
import { getUserWorkspaces } from "@/utils/getUserWorkspaces";

export const metadata: Metadata = {
  title: "Your Workspaces",
};

const UserWorkspaces = async () => {
  const {email} = await getUserData();
  const workspaces = await getUserWorkspaces();

  return (
    <>
      <header className="flex justify-end items-center px-4 py-1 bg-neutral-900 border-b">
        <SignoutBtn />
      </header>

      <main className="flex flex-col justify-start items-center h-screen pb-6 overflow-hidden">
        <section className="flex flex-col justify-center items-center w-full pt-16 pb-9 bg-neutral-900">
          <h1 className="mb-6 text-6xl text-center font-semibold">
            Slack Clone
          </h1>

          <h2 className="mb-4 text-xl text-center">
            Create a new Workspace
          </h2>

          <Link
            className="flex justify-center items-center gap-1 w-full max-w-[450px] px-4 py-2 text-sm text-neutral-900 uppercase bg-neutral-300 rounded-md hover:bg-neutral-100 transition-colors group"
            href="/create-workspace"
          >
            <FiPlus className="group-hover:scale-125 transition-transform" size={24} /> Create workspace
          </Link>
        </section>

        <div className="flex justify-center items-center gap-6 w-full my-9">
          <Separator/>
          <span className="text-sm text-neutral-400 font-semibold">OR</span>
          <Separator/>
        </div>

        <section className="flex flex-col items-center gap-4 w-full max-w-[750px] p-4 bg-neutral-900 rounded-md overflow-hidden">
          <h2 className="text-xl">
            Open a Workspace
          </h2>

          <div className="px-2 py-1 bg-neutral-800 rounded-md">
            <p className="text-sm">
              <span className="font-semibold">{email}</span> Workspaces
            </p>
          </div>


          <div className="flex flex-col gap-2 w-full max-w-[450px] px-6 py-4 border rounded-md overflow-y-auto scrollbar-thin">
            {workspaces.length === 0 && (
              <p className="text-lg text-center text-neutral-400">
                You don't have any workspaces yet
              </p>
            )}

            {workspaces.length > 0 && (
              <div className="flex flex-col gap-3 w-full">
                {workspaces.map((workspace) => (
                  <Link
                    key={workspace.workspace_id}
                    href={`/workspace/${workspace.workspace_id}`}
                    className="flex justify-start items-center gap-2 w-full pr-4 rounded-lg bg-neutral-800 cursor-pointer hover:bg-neutral-700 transition-colors duration-350 group"
                  >
                    <div className="w-12 h-12 rounded-l-lg overflow-hidden">
                      <img
                        src={workspace.workspace_image}
                        alt={workspace.workspace_name}
                        className="block w-full h-full object-cover object-center"
                      />
                    </div>

                    <div className="flex flex-col justify-center items-start gap-1">
                      <h3 className="text-sm font-semibold uppercase">
                        {workspace.workspace_name}
                      </h3>

                      <p className="text-xs text-neutral-400 font-semibold">
                        {workspace.members.length} members
                      </p>
                    </div>

                    <div className="flex justify-between items-center gap-2 w-fit ml-auto">
                      <p className="text-sm text-neutral-400 font-semibold group-hover:text-neutral-100 transition-colors duration-350">
                        Open
                      </p>
                      <FaArrowRight className="block group-hover:translate-x-2  transition-transform duration-350" size={22} />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </>
  )
}

export default UserWorkspaces;
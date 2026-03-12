import { redirect } from "next/navigation";
import { apiUrl } from "@/lib/utils";
import { Board } from "@/types";

async function getAllBoards(): Promise<Board[]> {
  try {
    const res = await fetch(apiUrl("boards"), { cache: "no-store" });
    if (!res.ok) return [];
    return res.json();
  } catch (e) {
    console.log("Error fetching boards on home");
    return [];
  }
}

export default async function Home() {
  const boards = await getAllBoards();

  if (boards.length > 0) {
    redirect(`/boards/${boards[0].id}`);
  }

  return (
    <div className="p-8 text-white flex flex-col gap-4 bg-[#0079bf] min-h-screen">
      <h2 className="text-xl">No boards found</h2>
      <p>Please create a board in the backend to get started.</p>
    </div>
  );
}
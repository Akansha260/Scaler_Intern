import { redirect } from "next/navigation";
import { apiUrl } from "@/lib/utils";
import { Board } from "@/types";
import AutoRefresh from "@/components/AutoRefresh";

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
      <h2 className="text-xl">Loading boards...</h2>
      <p>If the server is starting, this page will refresh automatically.</p>
      <AutoRefresh />
    </div>
  );
}
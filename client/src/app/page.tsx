import BoardComponent from "@/components/Board";
import { Board } from "@/types";

async function getBoardData(): Promise<Board | null> {
  try {
    const res = await fetch("http://localhost:5000/api/boards/1", { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to fetch board");
    return res.json();
  } catch(e) {
    console.error(e);
    return null;
  }
}

export default async function Page() {
  const board = await getBoardData();

  if (!board) {
    return <div className="p-8 text-white">Error loading board data. Ensure Express backend is running.</div>;
  }

  return (
    <main className="h-screen w-full flex flex-col bg-[#0079bf] overflow-hidden">
      <header className="h-12 bg-black/20 flex items-center px-4 shrink-0">
        <h1 className="text-white font-bold text-lg">{board.title}</h1>
      </header>
      <div className="flex-1 overflow-x-auto p-4 items-start">
        <BoardComponent initialBoard={board} />
      </div>
    </main>
  );
}

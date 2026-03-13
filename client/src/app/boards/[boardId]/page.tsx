import BoardComponent from "@/components/Board";
import BoardSwitcher from "@/components/BoardSwitcher";
import { Board } from "@/types";
import { redirect } from "next/navigation";
import { apiUrl } from "@/lib/utils";

async function getBoardData(id: string): Promise<Board | null> {
  try {
    const res = await fetch(apiUrl(`boards/${id}`), { cache: "no-store" });
    if (!res.ok) return null;
    return res.json();
  } catch (e) {
    console.log("Error fetching board data");
    return null;
  }
}

async function getAllBoards() {
  try {
    const res = await fetch(apiUrl("boards"), { cache: "no-store" });
    if (!res.ok) return [];
    return res.json();
  } catch (e) {
    console.log("Error fetching boards");
    return [];
  }
}

export default async function Page({ params }: { params: Promise<{ boardId: string }> }) {
  const resolvedParams = await params;

  const [board, allBoards] = await Promise.all([
    getBoardData(resolvedParams.boardId),
    getAllBoards(),
  ]);

  if (!board) {
    const defaultBoardId = allBoards[0]?.id;

    // Avoid redirect loops: only redirect if the default board
    // is different from the one we just tried to load.
    if (defaultBoardId && String(defaultBoardId) !== resolvedParams.boardId) {
      redirect(`/boards/${defaultBoardId}`);
    }

    return (
      <div className="p-8 text-white flex flex-col gap-4">
        <h2 className="text-xl">Board Not Found</h2>
        <p>No boards are available yet. Please create a board in the backend.</p>
      </div>
    );
  }

  return (
    <main className="h-screen w-full flex flex-col bg-[#0079bf] overflow-hidden">
      <header className="h-12 bg-black flex items-center px-4 shrink-0 gap-4">
        <div className="font-bold text-xl text-white mr-4 italic logo">TaskWeave</div>
        <BoardSwitcher boards={allBoards} activeBoardId={board.id} />
      </header>
      <div className="flex-1 overflow-hidden flex flex-col">
        <BoardComponent initialBoard={board} />
      </div>
    </main>
  );
}

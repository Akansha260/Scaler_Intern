import { useState } from 'react';
import { Board } from '@/types';
import { apiUrl } from '@/lib/utils';

export function useBoard(initialBoard: Board) {
  const [board, setBoard] = useState(initialBoard);

  const addList = async (title: string) => {
    const res = await fetch(apiUrl('lists'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ board_id: board.id, title }),
    });
    if (res.ok) {
      const newList = await res.json();
      setBoard(prev => ({ ...prev, lists: [...prev.lists, { ...newList, cards: [] }] }));
    }
  };

  const updateListTitle = async (listId: number, title: string) => {
    const res = await fetch(apiUrl(`lists/${listId}`), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    });
    if (res.ok) {
      setBoard(prev => ({ ...prev, lists: prev.lists.map(l => l.id === listId ? { ...l, title } : l) }));
    }
  };

  const deleteList = async (listId: number) => {
    const res = await fetch(apiUrl(`lists/${listId}`), { method: 'DELETE' });
    if (res.ok) {
      setBoard(prev => ({ ...prev, lists: prev.lists.filter(l => l.id !== listId) }));
    }
  };

  const addCard = async (listId: number, title: string) => {
    const res = await fetch(apiUrl('cards'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ list_id: listId, title }),
    });
    if(res.ok) {
      const newCard = await res.json();
      setBoard(prev => ({
        ...prev, lists: prev.lists.map(l => l.id === listId ? { ...l, cards: [...l.cards, { ...newCard, labels: [], members: [], checklists:[] }] } : l)
      }));
    }
  };

  const deleteCard = async (cardId: number, listId: number) => {
    const res = await fetch(apiUrl(`cards/${cardId}`), { method: 'DELETE' });
    if(res.ok) {
      setBoard(prev => ({
        ...prev, lists: prev.lists.map(l => l.id === listId ? { ...l, cards: l.cards.filter(c => c.id !== cardId) } : l)
      }));
    }
  };

  const reorderLists = async (startIndex: number, endIndex: number) => {
    const newLists = Array.from(board.lists);
    const [removed] = newLists.splice(startIndex, 1);
    newLists.splice(endIndex, 0, removed);
    
    newLists.forEach((list, index) => { list.position = index + 1; });
    setBoard(prev => ({ ...prev, lists: newLists }));

    const items = newLists.map(l => ({ id: l.id, position: l.position }));
    await fetch(apiUrl('lists/reorder'), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    });
  };

  const moveCard = async (sourceListId: number, destListId: number, sourceIndex: number, destIndex: number) => {
    const newLists = Array.from(board.lists);
    const sourceListIndex = newLists.findIndex(l => l.id === sourceListId);
    const destListIndex = newLists.findIndex(l => l.id === destListId);
    if(sourceListIndex === -1 || destListIndex === -1) return;

    const sourceList = newLists[sourceListIndex];
    const destList = newLists[destListIndex];

    const sourceCards = Array.from(sourceList.cards);
    const destCards = sourceListId === destListId ? sourceCards : Array.from(destList.cards);

    const [removed] = sourceCards.splice(sourceIndex, 1);
    destCards.splice(destIndex, 0, removed);

    sourceCards.forEach((c, i) => { c.position = i + 1; });
    if (sourceListId !== destListId) {
      destCards.forEach((c, i) => { c.position = i + 1; });
    }

    newLists[sourceListIndex] = { ...sourceList, cards: sourceCards };
    newLists[destListIndex] = { ...destList, cards: destCards };

    setBoard(prev => ({ ...prev, lists: newLists }));

    let items = destCards.map(c => ({ id: c.id, position: c.position, list_id: destListId }));
    if (sourceListId !== destListId) {
      items = [...items, ...sourceCards.map(c => ({ id: c.id, position: c.position, list_id: sourceListId }))];
    }

    await fetch(apiUrl('cards/move'), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    });
  };

  const updateCardInBoard = (updatedCard: any) => {
    setBoard(prev => {
      const isCardAlreadyInBoard = prev.lists.some(l => l.cards.some(c => c.id === updatedCard.id));
      
      if (updatedCard.is_archived) {
        // Remove card if it's archived
        return {
          ...prev,
          lists: prev.lists.map(list => ({
            ...list,
            cards: list.cards.filter(card => card.id !== updatedCard.id)
          })),
        };
      } else {
        // Add card back or update if it's NOT archived
        return {
          ...prev,
          lists: prev.lists.map(list => ({
            ...list,
            cards: list.id === updatedCard.list_id
              ? (list.cards.some(c => c.id === updatedCard.id) 
                  ? list.cards.map(c => c.id === updatedCard.id ? { ...c, ...updatedCard } : c)
                  : [...list.cards, { ...updatedCard, labels: updatedCard.labels || [], members: updatedCard.members || [], checklists: updatedCard.checklists || [] }].sort((a,b) => a.position - b.position)
                )
              : list.cards.filter(c => c.id !== updatedCard.id)
          })),
        };
      }
    });
  };



  return {
    board,
    setBoard,
    addList,
    updateListTitle,
    deleteList,
    addCard,
    deleteCard,
    reorderLists,
    moveCard,
    updateCardInBoard,
  };
}

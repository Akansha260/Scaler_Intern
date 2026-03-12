import { useState, useCallback } from 'react';
import { Board } from '@/types';
import { apiUrl } from '@/lib/utils';

export function useBoard(initialBoard: Board) {
  const [board, setBoard] = useState(initialBoard);

  const addList = useCallback(async (title: string) => {
    try {
      const res = await fetch(apiUrl('lists'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ board_id: board.id, title }),
      });
      if (res.ok) {
        const newList = await res.json();
        setBoard(prev => ({ 
          ...prev, 
          lists: [...prev.lists, { ...newList, cards: [] }] 
        }));
      }
    } catch (err) {
      console.error(err);
    }
  }, [board.id]);

  const updateListTitle = useCallback(async (listId: number, title: string) => {
    setBoard(prev => ({
      ...prev,
      lists: prev.lists.map(l => l.id === listId ? { ...l, title } : l)
    }));

    try {
      await fetch(apiUrl(`lists/${listId}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });
    } catch (err) {
      console.error(err);
    }
  }, []);

  const deleteList = useCallback(async (listId: number) => {
    setBoard(prev => ({
      ...prev,
      lists: prev.lists.filter(l => l.id !== listId)
    }));

    try {
      await fetch(apiUrl(`lists/${listId}`), { method: 'DELETE' });
    } catch (err) {
      console.error(err);
    }
  }, []);

  const addCard = useCallback(async (listId: number, title: string) => {
    try {
      const res = await fetch(apiUrl('cards'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ list_id: listId, title }),
      });
      if(res.ok) {
        const newCard = await res.json();
        setBoard(prev => ({
          ...prev, 
          lists: prev.lists.map(l => l.id === listId 
            ? { ...l, cards: [...l.cards, { ...newCard, labels: [], members: [], checklists: [] }] } 
            : l
          )
        }));
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  const deleteCard = useCallback(async (cardId: number, listId: number) => {
    setBoard(prev => ({
      ...prev, 
      lists: prev.lists.map(l => l.id === listId 
        ? { ...l, cards: l.cards.filter(c => c.id !== cardId) } 
        : l
      )
    }));

    try {
      await fetch(apiUrl(`cards/${cardId}`), { method: 'DELETE' });
    } catch (err) {
      console.error(err);
    }
  }, []);

  const reorderLists = useCallback((startIndex: number, endIndex: number) => {
    setBoard(prev => {
      const newLists = [...prev.lists];
      const [removed] = newLists.splice(startIndex, 1);
      newLists.splice(endIndex, 0, removed);
      const updatedLists = newLists.map((list, index) => ({ ...list, position: index + 1 }));
      
      const items = updatedLists.map((l, index) => ({ id: l.id, position: index + 1 }));
      fetch(apiUrl('lists/reorder'), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      }).catch(console.error);

      return { ...prev, lists: updatedLists };
    });
  }, []);

  const moveCard = useCallback((sourceListId: number, destListId: number, sourceIndex: number, destIndex: number) => {
    setBoard(prev => {
      const newLists = [...prev.lists];
      const sourceListIndex = newLists.findIndex(l => l.id === sourceListId);
      const destListIndex = newLists.findIndex(l => l.id === destListId);
      if(sourceListIndex === -1 || destListIndex === -1) return prev;

      const sourceList = { ...newLists[sourceListIndex], cards: [...newLists[sourceListIndex].cards] };
      const destList = sourceListId === destListId ? sourceList : { ...newLists[destListIndex], cards: [...newLists[destListIndex].cards] };

      const [removed] = sourceList.cards.splice(sourceIndex, 1);
      destList.cards.splice(destIndex, 0, removed);

      sourceList.cards.forEach((c, i) => { c.position = i + 1; });
      if (sourceListId !== destListId) {
          destList.cards.forEach((c, i) => { c.position = i + 1; });
      }

      newLists[sourceListIndex] = sourceList;
      if (sourceListId !== destListId) {
          newLists[destListIndex] = destList;
      }

      const items = [
        ...sourceList.cards.map((c, i) => ({ id: c.id, position: i + 1, list_id: sourceListId })),
        ...(sourceListId !== destListId ? destList.cards.map((c, i) => ({ id: c.id, position: i + 1, list_id: destListId })) : [])
      ];

      fetch(apiUrl('cards/move'), {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items }),
      }).catch(console.error);

      return { ...prev, lists: newLists };
    });
  }, []);

  const updateCardInBoard = useCallback((updatedCard: any) => {
    setBoard(prev => ({
      ...prev,
      lists: prev.lists.map(list => ({
        ...list,
        cards: updatedCard.is_archived
          ? list.cards.filter(card => card.id !== updatedCard.id)
          : (list.id === updatedCard.list_id
              ? (list.cards.some(c => c.id === updatedCard.id) 
                  ? list.cards.map(c => c.id === updatedCard.id ? { ...c, ...updatedCard } : c)
                  : [...list.cards, { ...updatedCard, labels: updatedCard.labels || [], members: updatedCard.members || [], checklists: updatedCard.checklists || [] }].sort((a,b) => a.position - b.position)
                )
              : list.cards.filter(c => c.id !== updatedCard.id)
            )
      })),
    }));
  }, []);

  return {
    board,
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

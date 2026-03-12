export interface Label { id: number; name: string; color: string; }
export interface User { id: number; name: string; }
export interface ChecklistItem { id: number; title: string; is_completed: boolean; }
export interface Checklist { id: number; title: string; items: ChecklistItem[]; }
export interface Card { id: number; title: string; position: number; description?: string; due_date?: string; labels: Label[]; members: User[]; checklists?: Checklist[]; }
export interface List { id: number; title: string; position: number; cards: Card[]; }
export interface Board { id: number; title: string; lists: List[]; }

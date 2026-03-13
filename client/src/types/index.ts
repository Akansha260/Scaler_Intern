export interface Label { 
  id: number; 
  name: string; 
  color: string; 
}

export interface User { 
  id: number; 
  name: string; 
}

export interface ChecklistItem { 
  id: number; 
  title: string; 
  is_completed: boolean; 
  position: number;
}

export interface Checklist { 
  id: number; 
  title: string; 
  position: number;
  items: ChecklistItem[]; 
}

export interface Card {
  id: number;
  title: string;
  position: number;
  description?: string;
  start_date?: string;
  due_date?: string;
  is_archived?: boolean;
  is_completed?: boolean;
  labels: Label[];
  members: User[];
  checklists: Checklist[];
  checklist_completed?: number;
  checklist_total?: number;
}

export interface List { 
  id: number; 
  title: string; 
  position: number; 
  cards: Card[]; 
}

export interface Board { 
  id: number; 
  title: string; 
  lists: List[]; 
}
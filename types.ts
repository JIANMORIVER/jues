export type Block = 'morning' | 'afternoon' | 'evening';

export interface Subtask {
  text: string;
  done: boolean;
}

export interface Task {
  id: number;
  title: string;
  desc: string;
  reward: number;
  completed?: boolean;
  block?: Block;
  time?: string; // ISO Date string
  // Eisenhower Matrix properties
  importance?: boolean;
  urgency?: boolean; 
  subtasks: Subtask[];
}

export type TabType = 'daily' | 'target' | 'training' | 'challenge';

export interface AppData {
  daily: Task[];
  target: Task[];
  training: Task[];
  challenge: Task[];
  score: number;
}
export type ViewType = 'qa' | 'map' | 'temporal' | 'graph';

export interface Document {
  id: number;
  title: string;
  content: string;
  url: string;
}

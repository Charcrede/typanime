import { Category } from "./category";

export interface Content {
  id: number;
  title: string;
  text: string;
  image: string;
  author?: string | null;
  type: 'citation' | 'synopsis';
  category: Category;
  createdAt: string;
  updatedAt: string;
}

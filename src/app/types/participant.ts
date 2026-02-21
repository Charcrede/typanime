import { User } from "./user";

export type Participant = { id: number; user_id: number; user: User;  wpm: number; accuracy: number; createdAt: string }
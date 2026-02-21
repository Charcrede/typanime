import { Content } from "./content";
import { Participant } from "./participant";

    export type Challenge = {
        id: number;
        title: string;
        content_id: number;
        content: Content;
        duration: number;
        expires_at: string;
        max_players: number;
        createdAt: string;
        participants: Participant[];
    }
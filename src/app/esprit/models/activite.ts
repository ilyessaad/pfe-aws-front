import { Session } from "./session";
import { User } from "./user";

export interface Activite {
    id?:number;
    nom?:string;
    description?:string;
    annimateur?:Annimateur;
    image?:string;
    listSessions?: number[]; 
    reservationIds?: number[]; 
    users?:User[]

}

export enum Annimateur {
    ANIMATEUR_1 = "ANNIM1",
    ANIMATEUR_2 = "ANNIM2",
}
import { Activite } from "./activite";

export interface Session {
    id?:number;
    nom?:string;
    activite?:Activite
}

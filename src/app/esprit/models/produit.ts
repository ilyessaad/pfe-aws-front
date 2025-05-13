import { Service } from "../models/service";

export interface Produit {
    _id: string;
    nom?: string;
    description?: string;
    image?: string;
    service: Service;
}
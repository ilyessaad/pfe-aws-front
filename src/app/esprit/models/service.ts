export interface Service {
    c_id: number;
    account_name: string; // Ajout pour le filtrage
    region: string;
    service_name: string;
    resource_id: string;
    data: any;
    timestamp: string;
}

import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

// Interface pour représenter une anomalie
export interface Anomaly {
    id: number;
    user_id: number;
    region: string;
    anomaly_name: string;
    details: any;
    resource_id: string;
    alert: string;
    timestamp: string;
}

// Interface pour la réponse de succès
export interface AnomalySuccessResponse {
    data: Anomaly[];
    status: 'success';
}

// Interface pour la réponse d'erreur
export interface AnomalyErrorResponse {
    message: string;
    status: 'error';
}

// Union type pour la réponse
export type AnomalyResponse = AnomalySuccessResponse | AnomalyErrorResponse;

@Injectable({
    providedIn: 'root'
})
export class AnomalyService {
    private apiUrl = `${environment.apiUrl}/api/anomalies`;

    constructor(private http: HttpClient) {}

    getAnomalies(anomalyName: string): Observable<AnomalyResponse> {
        const url = `${this.apiUrl}?anomaly_name=${encodeURIComponent(anomalyName)}`;
        return this.http.get<AnomalyResponse>(url).pipe(
            catchError(this.handleError)
        );
    }

    // Gestion des erreurs HTTP
    private handleError(error: HttpErrorResponse) {
        let errorMessage = 'Une erreur est survenue';
        if (error.error instanceof ErrorEvent) {
            // Erreur côté client
            errorMessage = `Erreur: ${error.error.message}`;
        } else {
            // Erreur côté serveur
            errorMessage = `Code: ${error.status}, Message: ${error.error.message || error.message}`;
        }
        console.error(errorMessage);
        return throwError(() => new Error(errorMessage));
    }
}

import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

// Interface pour représenter une anomalie (basée sur la structure de votre table anomalies)
export interface Anomaly {
    id: number;
    user_id: number;
    region: string;
    anomaly_name: string;
    details: any; // Les détails sont un objet JSON
    resource_id: string;
    alert: string;
    timestamp: string;
}

@Injectable({
    providedIn: 'root'
})
export class AnomalyService {
    private apiUrl = `${environment.apiUrl}/api/anomalies`;

    constructor(private http: HttpClient) {}

    getAnomalies(anomalyName: string): Observable<{ data: Anomaly[]; status: string }> {
        const url = `${this.apiUrl}?anomaly_name=${encodeURIComponent(anomalyName)}`;
        return this.http.get<{ data: Anomaly[]; status: string }>(url).pipe(
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

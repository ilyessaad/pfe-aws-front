import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from "../../../environments/environment";
import { Service } from '../models/service'; // Importer l'interface

@Injectable({
    providedIn: 'root'
})
export class FinOpsService {
    private apiUrl = `${environment.apiUrl}/api/finops-overview`;
    private servicesUrl = `${environment.apiUrl}/api/services`;

    constructor(private http: HttpClient) {
        console.log('API URL:', this.apiUrl);
        console.log('Services URL:', this.servicesUrl);
    }

    getFinOpsOverview(params?: HttpParams): Observable<any> {
        return this.http.get<any>(this.apiUrl, { params }).pipe(
            catchError((error) => {
                console.error('Erreur lors de la requête API:', error);
                return throwError(() => new Error('Erreur lors de la récupération des données FinOps: ' + error.message));
            })
        );
    }

    getServices(params?: HttpParams): Observable<Service[]> {
        return this.http.get<Service[]>(this.servicesUrl, { params }).pipe(
            catchError((error) => {
                console.error('Erreur lors de la requête API (services):', error);
                return throwError(() => new Error('Erreur lors de la récupération des services: ' + error.message));
            })
        );
    }
}

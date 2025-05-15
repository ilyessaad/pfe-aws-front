import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, tap, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';
import { AwsUser } from '../models/aws-user';

@Injectable({
    providedIn: 'root'
})
export class UserService {
    private loggedInSubject: BehaviorSubject<boolean>;

    constructor(private http: HttpClient, private router: Router) {
        const storedLoggedIn = localStorage.getItem('loggedIn');
        this.loggedInSubject = new BehaviorSubject<boolean>(storedLoggedIn ? JSON.parse(storedLoggedIn) : false);
    }

    signIn(credentials: { username: string, password: string }): Observable<any> {
        return this.http.post(`${environment.apiUrl}/login`, credentials).pipe(
            tap((response: any) => {
                if (response.status === 'success') {
                    this.setLoggedIn(true);
                }
            }),
            catchError(this.handleError)
        );
    }

    addUser(credentials: { access_key_id: string, secret_access_key: string }): Observable<any> {
        return this.http.post(`${environment.apiUrl}/users`, credentials).pipe(
            tap((response: any) => {
                if (response.status === 'success') {
                    console.log('Utilisateur ajouté avec succès');
                }
            }),
            catchError(this.handleError)
        );
    }

    getUsers(): Observable<AwsUser[]> {
        return this.http.get<AwsUser[]>(`${environment.apiUrl}/users`).pipe(
            tap((users) => console.log('Utilisateurs récupérés:', users)),
            catchError(this.handleError)
        );
    }

    deleteUser(userId: number): Observable<any> {
        return this.http.delete(`${environment.apiUrl}/users/${userId}`).pipe(
            tap((response: any) => {
                if (response.status === 'success') {
                    console.log('Utilisateur supprimé avec succès');
                }
            }),
            catchError(this.handleError)
        );
    }

    isLoggedIn(): Observable<boolean> {
        return this.loggedInSubject.asObservable();
    }

    setLoggedIn(status: boolean) {
        this.loggedInSubject.next(status);
        localStorage.setItem('loggedIn', JSON.stringify(status));
    }

    logout(): void {
        this.setLoggedIn(false);
        localStorage.removeItem('loggedIn');
    }

    private handleError(error: HttpErrorResponse) {
        let errorMessage = 'Échec de l’opération. Veuillez réessayer.';
        if (error.status === 401) {
            errorMessage = 'Accès non autorisé : ' + (error.error.message || 'Identifiants incorrects');
        } else if (error.status === 400) {
            errorMessage = error.error.message || 'Erreur de validation des données';
        } else if (error.status === 404) {
            errorMessage = error.error.message || 'Ressource non trouvée';
        } else if (error.status === 409) {
            errorMessage = error.error.message || 'Conflit : Données déjà existantes';
        } else {
            errorMessage = error.error?.message || 'Erreur serveur';
        }
        console.error(`${error.status} - ${errorMessage}`);
        return throwError(() => new Error(errorMessage));
    }
}

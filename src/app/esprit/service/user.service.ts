import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, tap, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';

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
        if (error.status === 401) {
            console.error('Unauthorized access:', error.error.message);
        } else if (error.status === 400) {
            console.error('Erreur de validation:', error.error.message);
        } else if (error.status === 409) {
            console.error('Conflit:', error.error.message);
        } else {
            console.error('An error occurred:', error.error?.message || error.message);
        }
        return throwError(() => new Error(error.error.message || 'Échec de l’opération. Veuillez réessayer.'));
    }
}

import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, tap, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';
import { AwsUser } from '../models/aws-user';

@Injectable({
    providedIn: 'root'
})
export class UserService {
    private loggedInSubject: BehaviorSubject<boolean>;
    private roleSubject: BehaviorSubject<string | null>;

    constructor(private http: HttpClient, private router: Router) {
        const storedLoggedIn = localStorage.getItem('loggedIn');
        const storedRole = localStorage.getItem('role');
        this.loggedInSubject = new BehaviorSubject<boolean>(storedLoggedIn ? JSON.parse(storedLoggedIn) : false);
        this.roleSubject = new BehaviorSubject<string | null>(storedRole);
    }

    signIn(credentials: { username: string, password: string }): Observable<any> {
        console.log(`Sending POST to ${environment.apiUrl}/login with credentials: ${JSON.stringify(credentials)}`);
        return this.http.post(`${environment.apiUrl}/login`, credentials, { withCredentials: true }).pipe(
            tap((response: any) => {
                if (response.status === 'success') {
                    this.setLoggedIn(true);
                    this.setRole(response.role);
                    console.log('Login response:', response);
                }
            }),
            catchError(this.handleError)
        );
    }

    addUser(credentials: { access_key_id: string, secret_access_key: string, account_name: string }): Observable<any> {
        const userRole = localStorage.getItem('role'); // or however you store it
        const headers = {
            'X-User-Role': userRole || '',
            'Content-Type': 'application/json'
        };
        return this.http.post(`${environment.apiUrl}/users`, credentials, { headers: headers, withCredentials: true }).pipe(
            tap((response: any) => {
                if (response.status === 'success') {
                    console.log('Account added successfully');
                }
            }),
            catchError(this.handleError)
        );
    }

    updateAccount(accountId: string, credentials: { access_key_id?: string, secret_access_key?: string, account_name?: string }): Observable<any> {
        const userRole = localStorage.getItem('role'); // or however you store it
        const headers = {
            'X-User-Role': userRole || '',
            'Content-Type': 'application/json'
        };
        console.log(`Sending PATCH to ${environment.apiUrl}/accounts/${accountId}`);
        return this.http.patch(`${environment.apiUrl}/accounts/${accountId}`, credentials, {headers: headers, withCredentials: true }).pipe(
            tap((response: any) => {
                if (response.status === 'success') {
                    console.log('Account updated successfully');
                }
            }),
            catchError(this.handleError)
        );
    }

    getUsers(): Observable<AwsUser[]> {
        return this.http.get<AwsUser[]>(`${environment.apiUrl}/users`, { withCredentials: true }).pipe(
            tap((users) => console.log('Accounts retrieved:', users)),
            catchError(this.handleError)
        );
    }
    getRole(): string | null {

        return localStorage.getItem('role');

    }

    deleteUser(accountId: string): Observable<any> {
        console.log(`Sending DELETE to ${environment.apiUrl}/users/${accountId}`);
        const userRole = localStorage.getItem('role'); // or however you store it

        const headers = {
            'X-User-Role': userRole || '',
            'Content-Type': 'application/json'
        };
        return this.http.delete(`${environment.apiUrl}/users/${accountId}`, { headers: headers, withCredentials: true }).pipe(
            tap((response: any) => {
                if (response.status === 'success') {
                    console.log('Account deleted successfully');
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

    setRole(role: string | null) {
        this.roleSubject.next(role);
        if (role) {
            localStorage.setItem('role', role);
        } else {
            localStorage.removeItem('role');
        }
    }


// Add logout method to clear cookies
    logout(): void {
        this.setLoggedIn(false);
        localStorage.removeItem('loggedIn');
    }

    private handleError(error: HttpErrorResponse) {
        let errorMessage = 'Operation failed. Please try again.';
        if (error.status === 401) {
            errorMessage = 'Unauthorized access: ' + (error.error.message || 'Invalid credentials');
        } else if (error.status === 400) {
            errorMessage = error.error.message || 'Data validation error';
        } else if (error.status === 403) {
            errorMessage = error.error.message || 'Operation not allowed for read-only users';
        } else if (error.status === 404) {
            errorMessage = error.error.message || 'Resource not found';
        } else if (error.status === 409) {
            errorMessage = error.error.message || 'Conflict: Data already exists';
        } else {
            errorMessage = error.error?.message || 'Server error';
        }
        console.error(`${error.status} - ${errorMessage}`);
        return throwError(() => new Error(errorMessage));
    }
}

import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, throwError } from 'rxjs';
import { Session } from '../models/session';

@Injectable({
  providedIn: 'root'
})
export class SessionService {

  constructor(private http: HttpClient, private router: Router) { }

  getSessionById(id: any): Observable<Session> {
    return this.http.get<Session>('http://localhost:8075/session/' + id);
  } 

  getSession() {
    return this.http.get<Session[]>("http://localhost:8075/session/allSessions");
  }



  addSession(data: any): Observable<Session> {
    return this.http.post<Session>("http://localhost:8075/session", data)
      .pipe(
        catchError((error: any) => {
          console.error('Erreur lors de l\'ajout de la session:', error);
          return throwError('Une erreur s\'est produite lors de l\'ajout de la session. Veuillez réessayer.');
        })
      );
  }

  putSession(id: any, session: any): Observable<Session> {
    return this.http.put<Session>(`http://localhost:8075/session/${id}`, session)
    .pipe(
      catchError((error: any) => {
        console.error('Erreur lors de l\'ajout de session:', error);
        return throwError('Une erreur s\'est produite lors de l\'ajout de session. Veuillez réessayer.');
      })
    );
  }
  
  


  deleteSession(id:any):Observable<Session>{
    return this.http.delete<Session>("http://localhost:8075/session/"+id)

  }

  addSessionAndAssignToActivite(session: Session, activiteId: number): Observable<Session> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post<Session>(`http://localhost:8075/session/addSessionAndAssignToActivite/${activiteId}`, session, { headers });
        
  }

}

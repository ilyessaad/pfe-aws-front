import { Token } from "@angular/compiler";
import {Injectable} from "@angular/core";

const USER_KEY = 'auth-user';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private accessTokenKey = 'accessToken';
  private refreshTokenKey = 'refreshToken';



  constructor() {}

  setTokens(acessToken: string, refreshToken: string): void {
    sessionStorage.setItem(this.accessTokenKey, acessToken);
    sessionStorage.setItem(this.refreshTokenKey, refreshToken);
  }

  getUserId(): number | null {
    const userId = sessionStorage.getItem('id');
    return userId ? parseInt(userId, 10) : null;
  }
  

  getAccessToken(): string | null {
    return sessionStorage.getItem(this.accessTokenKey);
  }

  getRefreshToken(): string | null {
    return sessionStorage.getItem(this.refreshTokenKey);
  }

  clearTokens(): void {
    sessionStorage.removeItem(this.accessTokenKey);
    sessionStorage.removeItem(this.refreshTokenKey);
  }
  
  clean(): void {
    window.sessionStorage.clear();
  }

  public signOut(): void {
    window.sessionStorage.removeItem(USER_KEY);
    // Optionally, you can clear other session-related data or perform additional cleanup
  }

  public saveUser(user: any): void {
    // Save only necessary user data, like username and role
    const userData = {
      id : user.id,
      imageTest : user.image,
      username: user.username, // Assuming this is where your access token is stored
      role: user.role,
      Token : user.acessToken
     
      // Add other necessary data if needed
    };

    window.sessionStorage.removeItem(USER_KEY); // Remove any existing user data
    window.sessionStorage.setItem(USER_KEY, JSON.stringify(userData)); // Store new user data
  }

  public getUser(): any {
    const user = window.sessionStorage.getItem(USER_KEY);
    if (user) {
      return JSON.parse(user); // Parse and return the user object
    }
  
    return null; // Return null if no user data found
  }

  

  public isLoggedIn(): boolean {
    const user = window.sessionStorage.getItem(USER_KEY);
    return !!user; // Return true if user data exists, false otherwise
  }  
}
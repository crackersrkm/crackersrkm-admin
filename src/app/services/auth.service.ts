import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiUrl = 'http://localhost:3001/auth';
  
  // Signals to hold active session details
  public readonly currentUser = signal<any | null>(null);
  public readonly token = signal<string | null>(null);

  constructor(private readonly http: HttpClient, private readonly router: Router) {
    this.loadSession();
  }

  private loadSession(): void {
    const savedToken = localStorage.getItem('access_token');
    const savedUser = localStorage.getItem('current_user');
    
    if (savedToken && savedUser) {
      this.token.set(savedToken);
      try {
        this.currentUser.set(JSON.parse(savedUser));
      } catch (e) {
        this.logout();
      }
    }
  }

  public signup(signupData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/signup`, signupData);
  }

  public login(credentials: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, credentials).pipe(
      tap((res) => {
        if (res && res.accessToken) {
          localStorage.setItem('access_token', res.accessToken);
          localStorage.setItem('current_user', JSON.stringify(res.user));
          this.token.set(res.accessToken);
          this.currentUser.set(res.user);
        }
      })
    );
  }

  public logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('current_user');
    this.token.set(null);
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  public isAuthenticated(): boolean {
    return !!this.token();
  }

  public isAdmin(): boolean {
    const user = this.currentUser();
    return user && user.userType === 'admin';
  }
}

import { Injectable } from '@angular/core';
import { MsalService } from '@azure/msal-angular';
import { Router } from '@angular/router';
import { InteractionRequiredAuthError } from '@azure/msal-browser';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor(private msalService: MsalService, private router: Router) {}

  login(): void {
    this.msalService.loginRedirect({
      scopes: ["User.Read"]
    });
  }

  logout(): void {
    this.msalService.logoutRedirect();
    localStorage.removeItem('token');
  }
  getUserName(): string | null {
    const account = this.getActiveAccount();
    return account?.name || null; // Returns the user's name
  }
  isAuthenticated(): boolean {
    return this.msalService.instance.getAllAccounts().length > 0;
  }

  getActiveAccount() {
    return this.msalService.instance.getActiveAccount();
  }

  acquireToken(): void {
    const account = this.getActiveAccount();
    if (account) {
      this.msalService.acquireTokenSilent({
        account: account,
        scopes: ["User.Read"]
      }).subscribe({
        next: (result) => {
          if (result.accessToken) {
            console.log('Access Token:', result.accessToken);
            localStorage.setItem('token', result.accessToken); // Almacenar el token en localStorage
          }
        },
        error: (error) => {
          if (error instanceof InteractionRequiredAuthError) {
            this.msalService.acquireTokenPopup({
              scopes: ["User.Read"]
            }).subscribe({
              next: (result) => {
                console.log('Access Token:', result.accessToken);
                localStorage.setItem('token', result.accessToken); // Almacenar el token en localStorage
              },
              error: (err) => console.error('Error getting token:', err)
            });
          } else {
            console.error('Error getting token:', error);
          }
        }
      });
    }
  }

  // Método síncrono para obtener el token desde localStorage
  getToken(): string | null {
    return localStorage.getItem('token'); // Esto devolverá el token almacenado
  }
}

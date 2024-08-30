import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { MsalService } from '@azure/msal-angular';
import { switchMap } from 'rxjs/operators';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(private msalService: MsalService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return this.msalService.acquireTokenSilent({
      account: this.msalService.instance.getAllAccounts()[0],
      scopes: ['user.read'] // Define los scopes necesarios
    }).pipe(
      switchMap(tokenResponse => {
        const cloned = req.clone({
          setHeaders: {
            Authorization: `Bearer ${tokenResponse.accessToken}`
          }
        });
        return next.handle(cloned);
      })
    );
  }
}

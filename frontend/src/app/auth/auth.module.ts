import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
import { MsalModule, MsalInterceptor, MSAL_INSTANCE, MSAL_GUARD_CONFIG, MSAL_INTERCEPTOR_CONFIG, MsalGuardConfiguration, MsalInterceptorConfiguration } from '@azure/msal-angular';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { IPublicClientApplication, PublicClientApplication, InteractionType, BrowserCacheLocation } from '@azure/msal-browser';
import { environment } from '../../environments/environment';
// Factory para la instancia de MSAL
export function MSALInstanceFactory(): IPublicClientApplication {
  return new PublicClientApplication({
    auth: {
      clientId: environment.msalConfig.auth.clientId,
      authority: environment.msalConfig.auth.authority,
      redirectUri: environment.msalConfig.auth.redirectUri,
    },
    cache: {
      cacheLocation: BrowserCacheLocation.LocalStorage,
      storeAuthStateInCookie: false
    }
  });
}

// Configuración del guard
export function MSALGuardConfigFactory(): MsalGuardConfiguration {
  return {
    interactionType: InteractionType.Redirect, // Uso del tipo específico para la configuración
    authRequest: {
      scopes: ['user.read']
    }
  };
}

// Configuración del interceptor
export function MSALInterceptorConfigFactory(): MsalInterceptorConfiguration {
  return {
    interactionType: InteractionType.Redirect, // Uso del tipo específico para la configuración
    protectedResourceMap: new Map([
      ['https://graph.microsoft.com/v1.0/me', ['user.read']]
    ])
  };
}

@NgModule({
  imports: [
    CommonModule,
    MsalModule.forRoot(
      MSALInstanceFactory(),
      MSALGuardConfigFactory(),
      MSALInterceptorConfigFactory()
    )
  ],
  providers: [
    AuthService,
    AuthGuard,
    { provide: HTTP_INTERCEPTORS, useClass: MsalInterceptor, multi: true }
  ]
})
export class AuthModule { }

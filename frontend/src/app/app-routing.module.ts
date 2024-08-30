import { RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { NotfoundComponent } from './demo/components/notfound/notfound.component';
import { AppLayoutComponent } from "./layout/app.layout.component";
import { AuthGuard } from './auth/auth.guard';

@NgModule({
  imports: [
    RouterModule.forRoot([
      {
        path: '', component: AppLayoutComponent,
        children: [
          { path: '', loadChildren: () => import('./demo/components/dashboard/dashboard.module').then(m => m.DashboardModule), canActivate: [AuthGuard] },
          { path: 'utilities', loadChildren: () => import('./demo/components/utilities/utilities.module').then(m => m.UtilitiesModule), canActivate: [AuthGuard] },
          { path: 'documentation', loadChildren: () => import('./demo/components/documentation/documentation.module').then(m => m.DocumentationModule), canActivate: [AuthGuard] },
          { path: 'pages', loadChildren: () => import('./demo/components/pages/pages.module').then(m => m.PagesModule), canActivate: [AuthGuard] }
        ]
      },
      { path: 'auth', loadChildren: () => import('./demo/components/auth/auth.module').then(m => m.AuthModule) }, // Si esta ruta no requiere autenticación, se deja sin guard
      { path: 'landing', loadChildren: () => import('./demo/components/landing/landing.module').then(m => m.LandingModule) },
      { path: 'notfound', component: NotfoundComponent },
      { path: '**', redirectTo: '/notfound' },
    ], { scrollPositionRestoration: 'enabled', anchorScrolling: 'enabled', onSameUrlNavigation: 'reload' })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }

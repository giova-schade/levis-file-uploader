import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

@NgModule({
    imports: [RouterModule.forChild([
        { path: 'fileconfig', loadChildren: () => import('./fileconfig/fileconfig.module').then(m => m.FileConfigModule) },
        { path: 'project/:id', loadChildren: () => import('./project/project.module').then(m => m.ProjectModule) },
        { path: '**', redirectTo: '/notfound' }
    ])],
    exports: [RouterModule]
})
export class PagesRoutingModule { }

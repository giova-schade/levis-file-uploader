import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FileConfigComponent } from './fileconfig.component';

@NgModule({
    imports: [RouterModule.forChild([
        { path: '', component: FileConfigComponent }
    ])],
    exports: [RouterModule]
})
export class FileConfigRoutingModule { }

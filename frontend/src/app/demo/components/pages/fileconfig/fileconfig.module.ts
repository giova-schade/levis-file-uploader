import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { FileConfigRoutingModule } from './fileconfig-routing.module';
import { FileConfigComponent } from './fileconfig.component';
import { DropdownModule } from 'primeng/dropdown'; 
import { FileUploadModule } from 'primeng/fileupload';
import { ToolbarModule } from 'primeng/toolbar';
import { TableModule } from 'primeng/table';
import { ProgressBarModule } from 'primeng/progressbar';
import { ToastModule } from 'primeng/toast';
import { FilePondModule, registerPlugin } from 'ngx-filepond';

import { InputTextModule } from 'primeng/inputtext';
import { PaginatorModule } from 'primeng/paginator';


@NgModule({
  imports: [
    CommonModule,
    FormsModule, 
    FileConfigRoutingModule,
    DropdownModule,
    FileUploadModule,
    ToolbarModule,
    TableModule,
    ProgressBarModule,
    ToastModule,
    FilePondModule,
    InputTextModule,
    PaginatorModule
  ],
  declarations: [FileConfigComponent]
})
export class FileConfigModule { }

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProjectRoutingModule } from './project-routing.module';
import { ProjectComponent } from './project.component';
import { TimelineModule } from 'primeng/timeline';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { FileUploadModule } from 'primeng/fileupload';
import { ToastModule } from 'primeng/toast'; 
import { TableModule } from 'primeng/table';

import { ProgressBarModule } from 'primeng/progressbar';
import { InputTextModule } from 'primeng/inputtext';
import { PaginatorModule } from 'primeng/paginator';

import { DialogModule } from 'primeng/dialog';
import { ToolbarModule } from 'primeng/toolbar';
import { OrganizationChartModule } from 'primeng/organizationchart';
import { FilePondModule, registerPlugin } from 'ngx-filepond';
import { AccordionModule } from 'primeng/accordion';

@NgModule({
    imports: [
        AccordionModule,
        CommonModule,
        TimelineModule,
        ButtonModule,
        CardModule,
        ProjectRoutingModule,
        FileUploadModule,
        ToastModule,
        TableModule,
        ProgressBarModule,
        InputTextModule,
        PaginatorModule,
        DialogModule,
        ToolbarModule,
        OrganizationChartModule,
        FilePondModule
        
    ],
    declarations: [ProjectComponent]
})
export class ProjectModule { }

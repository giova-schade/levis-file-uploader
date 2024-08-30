import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DashboardComponent } from './dashboard.component';
import { ChartModule } from 'primeng/chart';
import { MenuModule } from 'primeng/menu';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { StyleClassModule } from 'primeng/styleclass';
import { PanelMenuModule } from 'primeng/panelmenu';
import { DashboardsRoutingModule } from './dashboard-routing.module';
import { ToastModule } from 'primeng/toast'; 
import { MessageService } from 'primeng/api';
import { ProgressBarModule } from 'primeng/progressbar';
import { TabViewModule } from 'primeng/tabview';
import { OrganizationChartModule } from 'primeng/organizationchart';
import { ToolbarModule } from 'primeng/toolbar';
import {CheckboxModule} from 'primeng/checkbox';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        ChartModule,
        MenuModule,
        TableModule,
        StyleClassModule,
        PanelMenuModule,
        ButtonModule,
        DashboardsRoutingModule,
        ToastModule,
        ProgressBarModule ,
        TabViewModule,
        OrganizationChartModule,
        ToolbarModule,
        CheckboxModule
    ],
    declarations: [DashboardComponent],
    providers: [MessageService]
})
export class DashboardModule { }

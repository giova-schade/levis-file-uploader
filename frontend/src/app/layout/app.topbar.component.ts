import { Component, ElementRef, ViewChild, OnInit } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { LayoutService } from "./service/app.layout.service";
import { MsalService } from '@azure/msal-angular';
import { OverlayPanel } from 'primeng/overlaypanel';
import { AuthService } from '../auth/auth.service';


@Component({
    selector: 'app-topbar',
    templateUrl: './app.topbar.component.html',
    styleUrls: ['./app.topbar.component.css']
})
export class AppTopBarComponent implements OnInit {

    items!: MenuItem[];
    initials: string | null = null;

    @ViewChild('menubutton') menuButton!: ElementRef;
    @ViewChild('topbarmenubutton') topbarMenuButton!: ElementRef;
    @ViewChild('topbarmenu') menu!: ElementRef;
    @ViewChild('op') overlayPanel!: OverlayPanel;

    constructor(public layoutService: LayoutService, private msalService: MsalService,  private authService: AuthService ) { }

    ngOnInit() {
        const account = this.msalService.instance.getActiveAccount();
        this.authService.getToken();
        if (account && account.name) {
            this.initials = this.getInitials(account.name);
            
            
        }
    }

    getInitials(name: string): string {
        const parts = name.split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        } else if (parts.length === 1) {
            return parts[0][0].toUpperCase();
        }
        return '';
    }
    
    logout() {
        this.msalService.logoutRedirect();
    }

    showOverlay(event: Event, overlayPanel: OverlayPanel) {
        overlayPanel.toggle(event);
    }
    
}

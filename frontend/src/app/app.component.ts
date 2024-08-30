import { Component, OnInit } from '@angular/core';
import { PrimeNGConfig } from 'primeng/api';
import { MsalService } from '@azure/msal-angular';
import { MessageService } from 'primeng/api';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    providers: [MessageService] 
})
export class AppComponent implements OnInit {

    constructor(private primengConfig: PrimeNGConfig, private msalService: MsalService, private messageService: MessageService) { }

    ngOnInit() {
        this.primengConfig.ripple = true;
        
        this.msalService.instance.initialize().then(() => {
          this.msalService.instance.handleRedirectPromise().then(response => {
            if (response && response.account) {
              this.msalService.instance.setActiveAccount(response.account);
            }
          }).catch(error => {
            console.error('Error en la autenticación:', error);
          });
        }).catch(error => {
          console.error('Error al inicializar MSAL:', error);
        });
      }
}

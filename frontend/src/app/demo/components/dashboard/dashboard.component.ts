import { Component, OnInit, OnDestroy , ViewEncapsulation} from '@angular/core';
import { MenuItem, MessageService } from 'primeng/api'; 
import { Product } from '../../api/product';
import { ProductService } from '../../service/product.service';
import { Subscription, debounceTime } from 'rxjs';
import { LayoutService } from 'src/app/layout/service/app.layout.service';
import { ProjectService } from '../../service/project.service';
import { Router } from '@angular/router';
import { Project } from '../../model/project.model';

@Component({
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.css'],
    providers: [MessageService],
    encapsulation: ViewEncapsulation.None
})
export class DashboardComponent implements OnInit, OnDestroy {

    loading: boolean = false;
    projects: Project[] = [];
    selectedProjectIds: number[] = [];
    constructor(
        private productService: ProductService, 
        public layoutService: LayoutService,
        private projectService: ProjectService,
        private messageService: MessageService,
        private router: Router 
    ) {
       
    }

    ngOnInit() {
        this.loadProjects();
    }

    loadProjects(): void {
        this.loading = true;
        this.projectService.getProjects().subscribe({
            next: (response) => {
                if (response.projects && response.projects.length > 0) {
                    this.projects = response.projects;
                } else {
                    // Manejo del caso donde no hay proyectos
                    this.messageService.add({
                        severity: 'warn',
                        summary: 'Advertencia',
                        detail: 'No se encontraron proyectos.',
                        life: 5000
                    });
                }
            },
            error: (err) => {
                if (err.status === 400 && err.error.message === "No se encontraron proyectos.") {
                    this.messageService.add({
                        severity: 'warn',
                        summary: 'Advertencia',
                        detail: 'No se encontraron proyectos.',
                        life: 5000
                    });
                } else {
                    console.error('Error al obtener los proyectos:', err);
                    this.showError(); 
                }
                this.loading = false; 
            },
            complete: () => {
                this.loading = false; 
            }
        });
    }
    
    createSchemaNodes(esquemas: any[], nombreTabla: string): any[] {
        return [{
            label: nombreTabla,
            expanded: true, // Habilita el colapsado
            children: esquemas.map((esquema) => ({
                label: esquema.campo_nombre,
                expanded: false, // Permite que los hijos también se puedan colapsar
                data: {
                    tipo: esquema.tipo_dato,
                    requerido: esquema.requerido ? 'Sí' : 'No',
                    clavePrimaria: esquema.es_clave_primaria ? 'Sí' : 'No',
                    unico: esquema.es_unico ? 'Sí' : 'No'
                }
            }))
        }];
    }
    
    
    navigateToNewProject(){
        this.router.navigate(['/pages/project', 'new']); 
        
    }
    
    showError() {
        this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Hubo un problema al realizar la llamada al servicio.',
            life: 5000 
        });
    }
    navigateToProject(projectId: number): void {
        this.router.navigate(['/pages/project', projectId]); 
    }
    toggleProjectSelection(projectId: number, checked: boolean): void {
        if (checked) {
          this.selectedProjectIds.push(projectId);
        } else {
          this.selectedProjectIds = this.selectedProjectIds.filter(id => id !== projectId);
        }
      }
    
      deleteSelectedProjects(): void {
        if (this.selectedProjectIds.length === 0) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Advertencia',
                detail: 'Debe seleccionar al menos un proyecto para eliminar.'
            });
            return;
        }
    
        this.projectService.deleteProjects(this.selectedProjectIds).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Éxito',
                    detail: 'Proyectos eliminados correctamente.'
                });
    
                this.projects = this.projects.filter(project => !this.selectedProjectIds.includes(project.id));
                this.selectedProjectIds = [];
                this.loadProjects();  
            },
            error: (err) => {
                console.error('Error al eliminar los proyectos:', err);
                this.showError();
            }
        });
    }
    

    ngOnDestroy() {

    }
}

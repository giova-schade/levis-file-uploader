import { Component, OnInit , ViewChild} from '@angular/core';
import { ProjectService } from '../../../service/project.service';
import { MessageService } from 'primeng/api';
import { Project } from '../../../model/project.model';
import { Router } from '@angular/router';
import { FilePondComponent } from 'ngx-filepond';
import { FilePondOptions, FilePondFile , FileStatus} from 'filepond';
import { FileUploadService } from '../../../service/file-upload.service';

// Interfaz para opciones del dropdown
interface ProjectOption {
  label: string;
  value: number;
}

@Component({
  templateUrl: './fileconfig.component.html',
  styleUrls: ['./fileconfig.component.scss'],
  providers: [MessageService]
})
export class FileConfigComponent implements OnInit {
  projectOptions: ProjectOption[] = [];
  selectedProjectId!: number; 
  selectedProject!: Project;
  loading: boolean = false;
  uploadedFiles: any[] = [];
  totalSize: number = 0;
  totalSizePercent: number = 0;
  errorMessage: string | null = null;
  tableHeaders: string[] = [];
  archivoCSV?: File; 
  uploadErrors: any[] = []; 
  
  @ViewChild('myPond') myPond!: FilePondComponent;
  pondOptions: FilePondOptions = {
    credits: false,
    allowMultiple: false, 
    instantUpload: false, 
    labelIdle: 'Arrastra y suelta archivos aquí o <span class="filepond--label-action">explora</span>',
    labelFileProcessing: 'Subiendo...',
    labelFileProcessingComplete: 'Subida completada',
    labelFileProcessingAborted: 'Subida cancelada',
    labelFileLoading: 'Cargando...',
    labelFileLoadError: 'Error al cargar el archivo',
    labelFileRemoved: 'Archivo eliminado',
    labelButtonRemoveItem: 'Eliminar',
    labelButtonAbortItemLoad: 'Abortar carga',
    labelButtonRetryItemLoad: 'Reintentar carga',
    labelButtonAbortItemProcessing: 'Cancelar',
    labelButtonUndoItemProcessing: 'Deshacer',
    labelButtonRetryItemProcessing: 'Reintentar',
    labelButtonProcessItem: 'Subir',
    server: {
        process: (fieldName, file, metadata, load, error, progress, abort) => {
          this.progressCallback = progress;
          this.loadCallback = load;
          this.errorCallback = error;
          this.simulateUpload(file as File);
          return {
            abort: () => {
              abort();
            }
          };
        }
      }
 };
 private progressCallback!: (isComputable: boolean, loaded: number, total: number) => void;
 private loadCallback!: (serverFileId: string) => void;
 private errorCallback!: (errorText: string) => void;
  pondFiles: FilePondOptions["files"] = [];
  constructor(
    private projectService: ProjectService,
    private messageService: MessageService,
    private router: Router,
    private fileUploadService: FileUploadService 
  ) {}

  ngOnInit() {
    this.loadProjects();
  }

  loadProjects(): void {
    this.projectService.getProjects().subscribe({
      next: (response) => {
        // Cargar las opciones del dropdown
        this.projectOptions = response.projects.map((proj: any) => ({
          label: proj.nombre_proyecto,
          value: proj.id
        }));
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar proyectos' });
      }
    });
  }

  onProjectSelect(event: any): void {
    const projectId = event.value; // Usamos el ID del proyecto seleccionado
    this.loading = true;
    this.errorMessage = null;

    this.projectService.getProjectById(projectId).subscribe({
      next: (response) => {
        // Cargar el proyecto completo
        this.selectedProject = response[0].project;

        // Configurar las cabeceras de la tabla
        if (this.selectedProject?.tabla_asociada?.datos?.length > 0) {
          this.tableHeaders = Object.keys(this.selectedProject.tabla_asociada.datos[0]);
        }
      },
      error: (err) => {
        if (err.status === 404) {
          this.errorMessage = err.error?.error || 'Ocurrió un error al cargar los datos.';
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: this.errorMessage
          });
        } else {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error al cargar los datos del proyecto seleccionado.'
          });
        }
        this.loading = false;
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  pondHandleInit() {
    console.log('FilePond ha sido inicializado', this.myPond);
  }


  pondHandleAddFile(event: any) {
    if (!this.selectedProjectId) {
      this.messageService.add({ severity: 'warn', summary: 'Advertencia', detail: 'Debe seleccionar un proyecto antes de subir un archivo.' });  
      this.myPond['pond'].removeFile(event.file.id);
      return;
    }
  
    const file = event.file;
    if (file.fileType !== 'text/csv') {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Solo se permiten archivos CSV' });
      this.myPond['pond'].removeFile(event.file.id);

    } else {
      this.selectedProject.archivo_csv = file.file;
      this.archivoCSV = file.file;
      console.log('Un archivo CSV fue añadido', event);
    }
  }
  

  pondHandleActivateFile(event: any) {
    console.log('Un archivo fue activado', event);
  }

  navigateToNewProject(): void {
    this.router.navigate(['/pages/project/new']);
  }

  onTemplatedUpload(): void {
    this.messageService.add({ severity: 'info', summary: 'Success', detail: 'Archivos subidos correctamente' });
  }

  onSelectedFiles(event: any): void {
    this.uploadedFiles = event.files;
    this.calculateTotalSize();
  }

  calculateTotalSize(): void {
    this.totalSize = this.uploadedFiles.reduce((acc, file) => acc + file.size, 0);
    this.totalSizePercent = (this.totalSize / 1000000) * 100;
  }
  uploadFileToServer(projectId: number, file: File): void {
    this.fileUploadService.uploadFile(projectId, file).subscribe({
      next: (response) => {
        this.loadCallback('subida-completa');
        this.messageService.add({
          severity: 'success',
          summary: 'Proceso completado',
          detail: 'Archivo subido correctamente al servidor.'
        });
        this.reloadProjectData(projectId);
      },
      error: (err) => {
        console.error('Error al subir el archivo:', err);
        if (err.status === 400 && err.error) {
          this.displaySchemaError(err.error);
  
          const fileItem = this.myPond['pond'].getFile();
  
          if (fileItem) {
            fileItem.setMetadata('error', true);
            this.myPond['pond'].removeFile(fileItem.id, { revert: false });
            this.myPond['pond'].addFile(file, { index: fileItem.serverId, metadata: { error: true } });
          }
        } else {
          this.errorCallback('Error al subir el archivo');
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Ocurrió un error al subir el archivo.'
          });
        }
      }
    });
  }
  
  
  
  displaySchemaError(errorResponse: any): void {
    this.uploadErrors = errorResponse.errores || [];
    const errorMessage = errorResponse.error;

    this.messageService.add({
      severity: 'error',
      summary: 'Error en el archivo CSV',
      detail: errorMessage,
      sticky: true,
    });
  }
  reloadProjectData(projectId: number): void {
    this.projectService.getProjectById(projectId).subscribe({
      next: (response) => {
        this.selectedProject = response[0].project;
        if (this.selectedProject?.tabla_asociada?.datos?.length > 0) {
          this.tableHeaders = Object.keys(this.selectedProject.tabla_asociada.datos[0]);
        }
        this.messageService.add({
          severity: 'info',
          summary: 'Datos Actualizados',
          detail: 'El esquema del proyecto se ha recargado con éxito.'
        });
      },
      error: (err) => {
        console.error('Error al recargar el proyecto:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Ocurrió un error al recargar el proyecto.'
        });
      }
    });
  }
  
  simulateUpload(file: File): void { // Accept the file as a parameter
    let progressValue = 0;
    const interval = setInterval(() => {
      progressValue += 20;
      this.progressCallback(true, progressValue, 100);

      if (progressValue >= 100) {
        clearInterval(interval);
        this.uploadFileToServer(this.selectedProjectId, file);
      }
    }, 500);
  }
  

  onRemoveTemplatingFile(event: Event, file: any, removeFileCallback: any, index: number): void {
    this.uploadedFiles.splice(index, 1);
    removeFileCallback(index);
    this.calculateTotalSize();
  }

  uploadEvent(uploadCallback: any): void {
    uploadCallback();
  }

  formatSize(size: number): string {
    return `${(size / 1024).toFixed(2)} KB`;
  }
}

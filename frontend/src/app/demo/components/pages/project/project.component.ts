import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild } from '@angular/core';
import { MessageService } from 'primeng/api';
import { ProjectService } from '../../../service/project.service';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import JSONEditor from 'jsoneditor';
import { Esquema, Project, Validacion } from '../../../model/project.model';
import { AuthService } from 'src/app/auth/auth.service';
import { FilePondComponent } from 'ngx-filepond';
import { FilePondOptions, FilePondFile } from 'filepond';
@Component({
  templateUrl: './project.component.html',
  styleUrls: ['./project.scss'],
  providers: [MessageService]
})
export class ProjectComponent implements OnInit, AfterViewInit, OnDestroy {

  loading: boolean = false;
  projectId!: number;
  projectData: Project = {
    nombre_proyecto: '',
    nombre_tabla: '',
    creado_modificado_por: '',
    fecha_creacion: '',
    fecha_actualizacion: '',
    esquemas: [],
    validaciones: [],
    tabla_asociada: {
      nombre_tabla: '',
      datos: []
    }
  };
  tableHeaders: string[] = [];
  jsonEditorSchema: any;
  jsonEditorValidations: any;
  fullscreenSchemaEditor: any;
  fullscreenValidationsEditor: any;
  esquemaData: any[] = [];
  isNewProject: boolean = false;
  originalProjectData: Project | null = null;


  displaySchemaDialog: boolean = false;
  displayValidationsDialog: boolean = false;
  allowedValidations: string[] = [];
  archivoCsv?: File;
  allowedEsquemaProperties = ['campo_nombre', 'tipo_dato', 'requerido', 'longitud_maxima', 'valores_permitidos', 'es_clave_primaria', 'es_unico'];
  allowedValidationProperties = ['nombre_regla', 'valor', 'mensaje_error'];
  validRules: string[] = [];
  validationErrors: { fila: number; campo: string; valor_incorrecto: any; mensaje_error: string }[] = [];
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
    labelButtonProcessItem: 'Subir'
  };
  pondFiles: FilePondOptions["files"] = [];

  constructor(
    private messageService: MessageService,
    private projectService: ProjectService,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
  ) { }

  ngOnInit() {
    this.route.params.subscribe(params => {
      if (this.router.url.includes('new')) {
        this.isNewProject = true;
        this.loadValidations();
      } else {
        this.projectId = +params['id'];
        this.loadData();
      }
    });
  }

  ngAfterViewInit() {
    this.initEditors();
  }
  loadValidations(): void {
    this.projectService.getValidations().subscribe({
      next: (allowedValidations) => {
        if (Array.isArray(allowedValidations['validaciones'])) {
          this.allowedValidations = allowedValidations['validaciones'].map((validation: any) => validation.nombre_regla);
        } else {
          console.error('Error: allowedValidations no es un array válido', allowedValidations);
          this.allowedValidations = [];
        }
      },
      error: () => {
        this.showError('Error al cargar las validaciones permitidas.');
      }
    });
  }
  initEditors() {
    const containerSchema = document.getElementById('jsoneditor-schema');
    const containerValidations = document.getElementById('jsoneditor-validations');

    if (containerSchema) {
      const optionsSchema = {
        mode: 'code',
        onChange: () => this.handleSchemaChange(),

      };
      this.jsonEditorSchema = new JSONEditor(containerSchema as HTMLElement, optionsSchema);
    }

    if (containerValidations) {
      const optionsValidations = {
        mode: 'code',
        onChange: () => this.handleValidationsChange(),
        onPaste: () => console.log('Se ha pegado contenido en las validaciones')
      };
      this.jsonEditorValidations = new JSONEditor(containerValidations as HTMLElement, optionsValidations);
    }
  }

  handleSchemaChange() {
    try {
      const schemaData = this.jsonEditorSchema.get();

      if (Array.isArray(schemaData) && schemaData.every(item => typeof item === 'object')) {
        console.log('Esquema modificado:', schemaData);
        this.projectData.esquemas = schemaData;
        this.esquemaData = this.generateEsquemaChartData(this.projectData.esquemas);
      } else {
        throw new Error('El esquema debe ser un arreglo de objetos.');
      }
    } catch (error) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'JSON de esquema inválido. Verifique la estructura.' });
    }
  }
  handleValidationsChange() {
    try {
      const validationData = this.jsonEditorValidations.get();

      if (Array.isArray(validationData) && validationData.every(item => typeof item === 'object')) {
        console.log('Validaciones modificadas:', validationData);
        this.projectData.validaciones = validationData;
      } else {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Las validaciones deben ser un arreglo de objetos.' });
        throw new Error('Las validaciones deben ser un arreglo de objetos.');

      }
    } catch (error) {
      console.log(error)
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'JSON de validaciones inválido. Verifique la estructura.' });
    }
  }


  createProject(): void {
    if (this.projectData.nombre_proyecto && this.projectData.nombre_tabla) {
      if (!this.archivoCsv) {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Debe subir un archivo CSV antes de continuar.' });
        return;
      }

      this.loading = true;

      const userName = this.authService.getUserName();
      if (userName) {
        this.projectData.usuario_modificacion = userName;
      }

      const errors = this.validateEditorContent(this.projectData);
      if (errors.length > 0) {
        errors.forEach(error => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error de Validación',
            detail: `${error.path}: ${error.message}`
          });
        });
        this.loading = false;
        return;
      }

      this.projectService.createProject(this.projectData).subscribe({
        next: (response) => {
          const projectId = response.project_id;
          this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Proyecto creado correctamente.' });

          this.uploadCsvFile(projectId, this.archivoCsv!);
        },
        error: (err) => {
          if (err.status === 400) {
            const errorMessage = err.error?.error || 'Error al crear el proyecto.';
            this.messageService.add({ severity: 'error', summary: 'Error', detail: errorMessage });
          } else {
            this.showError('Error al crear el proyecto.');
          }
          this.loading = false;
        },
        complete: () => {
          this.loading = false;
        }
      });
    } else {
      this.showError('Debe completar todos los campos.');
    }
  }

  uploadCsvFile(projectId: number, archivoCsv: File): void {
    this.projectService.uploadCsvFile(projectId, archivoCsv).subscribe({
      next: () => {
        this.router.navigate([`/`]);
      },
      error: (err) => {
        if (err.status === 400 && err.error?.error) {
          const errorMessage = err.error.error;
          this.validationErrors = err.error.errores.map((error: any) => ({
            fila: error.fila,
            campo: error.campo,
            valor_incorrecto: error.valor_incorrecto,
            mensaje_error: error.mensaje_error
          }));
          this.messageService.add({
            severity: 'error',
            summary: 'Error al subir el archivo CSV',
            detail: errorMessage,
            sticky: true
          });

          // Mostrar los detalles adicionales si están presentes
          if (err.error.campos_esperados && err.error.campos_esperados.length > 0) {
            this.messageService.add({
              severity: 'warn',
              summary: 'Campos esperados:',
              detail: err.error.campos_esperados.join(', '),
              sticky: true
            });
          }

          this.projectService.deleteProjects([projectId]).subscribe(() => {
            this.messageService.add({ severity: 'info', summary: 'Info', detail: 'Proyecto eliminado debido a un fallo en la subida del archivo.' });
          });
        } else {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al subir el archivo CSV.' });

          this.projectService.deleteProjects([projectId]).subscribe(() => {
            this.messageService.add({ severity: 'info', summary: 'Info', detail: 'Proyecto eliminado debido a un fallo en la subida del archivo.' });
          });
        }
      },
      complete: () => {
        this.loading = false;
      }
    });
  }



  generateEsquemaChartData(esquemas: any[]): any[] {
    if (!esquemas) return [];

    const root = {
      label: 'Esquema',
      children: esquemas.map((esquema) => ({
        label: esquema.campo_nombre,
        type: esquema.tipo_dato,
        data: `Requerido: ${esquema.requerido ? 'Sí' : 'No'}`
      }))
    };

    return [root];
  }
  mapEsquema(esquema: any): Esquema {
    return {
      campo_nombre: esquema.campo_nombre || '',
      tipo_dato: esquema.tipo_dato || '',
      requerido: esquema.requerido ?? false,
      longitud_maxima: esquema.longitud_maxima || null,
      valores_permitidos: esquema.valores_permitidos || null,
      es_clave_primaria: esquema.es_clave_primaria ?? false,
      es_unico: esquema.es_unico ?? false
    };
  }

  mapValidacion(validacion: any): Validacion {
    return {
      campo_nombre: validacion.campo_nombre || '',
      mensaje_error: validacion.mensaje_error || '',
      nombre_regla: validacion.validacion,
      valor: validacion.valor || {}
    };
  }

  loadData(): void {
    this.loading = true;

    forkJoin({
      project: this.projectService.getProjectById(this.projectId),
      allowedValidations: this.projectService.getValidations()
    }).subscribe({
      next: ({ project, allowedValidations }) => {
        if (project && project.length > 0) {
          const rawProjectData = project[0]?.project || null;

          // Mapeamos los datos del proyecto
          this.projectData = {
            ...rawProjectData,
            esquemas: rawProjectData.esquemas.map((esquema: any) => this.mapEsquema(esquema)),
            validaciones: rawProjectData.validaciones.map((validacion: any) => this.mapValidacion(validacion)),
          };
          // Accedemos al array de validaciones permitido
          if (allowedValidations && Array.isArray(allowedValidations['validaciones'])) {
            this.allowedValidations = allowedValidations['validaciones'].map((validation: any) => validation.nombre_regla);
          } else {
            console.error('Error: allowedValidations no es un array válido', allowedValidations);
            this.allowedValidations = [];
          }
          this.originalProjectData = JSON.parse(JSON.stringify(this.projectData));

          if (this.projectData.tabla_asociada?.datos.length > 0) {
            this.tableHeaders = Object.keys(this.projectData.tabla_asociada.datos[0]);
          }

          this.esquemaData = this.generateEsquemaChartData(this.projectData.esquemas);

          const filteredEsquemas = this.projectData.esquemas.map((esquema: any) => this.filterEsquemaProperties(esquema));
          this.jsonEditorSchema.set(filteredEsquemas);
          this.jsonEditorValidations.set(this.projectData.validaciones);
        } else {
          this.showError('No se pudo cargar el proyecto.');
        }
      },
      error: () => {
        this.showError('Error al cargar los datos.');
        this.projectData = null;
        this.loading = false;
      },
      complete: () => {
        this.loading = false;
      }
    });
  }




  filterEsquemaProperties(esquema: any): any {
    const filteredEsquema: any = {};
    const extraProperties: any = {};

    Object.keys(esquema).forEach(prop => {
      if (this.allowedEsquemaProperties.includes(prop)) {
        filteredEsquema[prop] = esquema[prop];
      } else {
        extraProperties[prop] = esquema[prop];
      }
    });

    filteredEsquema._extraProperties = extraProperties;
    return filteredEsquema;
  }

  validateEditorContent(json: any): any[] {
    const errors: any[] = [];

    // Validar esquemas (si están presentes)
    if (json.esquemas) {
      json.esquemas.forEach((esquema: any, index: number) => {
        Object.keys(esquema).forEach(key => {
          if (!this.allowedEsquemaProperties.includes(key) && key !== '_extraProperties') {
            errors.push({
              path: `esquemas[${index}].${key}`,
              message: `Propiedad no permitida o incorrecta: ${key}. Esta propiedad no es parte del modelo, pero se mantendrá.`
            });
          }
        });

        // Validar propiedades obligatorias
        if (!esquema.campo_nombre) {
          errors.push({
            path: `esquemas[${index}].campo_nombre`,
            message: `El campo "campo_nombre" es obligatorio.`
          });
        }

        if (!esquema.tipo_dato) {
          errors.push({
            path: `esquemas[${index}].tipo_dato`,
            message: `El campo "tipo_dato" es obligatorio.`
          });
        } else if (!['string', 'number', 'date', 'varchar', 'integer'].includes(esquema.tipo_dato)) {
          errors.push({
            path: `esquemas[${index}].tipo_dato`,
            message: `El tipo de dato "${esquema.tipo_dato}" no es válido.`
          });
        }

        if (typeof esquema.requerido !== 'boolean') {
          errors.push({
            path: `esquemas[${index}].requerido`,
            message: `El campo "requerido" debe ser un booleano.`
          });
        }

        // Validar valores permitidos si aplica
        if (esquema.valores_permitidos && !Array.isArray(esquema.valores_permitidos)) {
          errors.push({
            path: `esquemas[${index}].valores_permitidos`,
            message: `El campo "valores_permitidos" debe ser una lista.`
          });
        }
      });
    }

    // Validar validaciones
    if (json.validaciones) {
      json.validaciones.forEach((validacion: any, index: number) => {
        if (!validacion.campo_nombre) {
          errors.push({
            path: `validaciones[${index}].campo_nombre`,
            message: `El campo "campo_nombre" es obligatorio.`
          });
        }

        if (!validacion.mensaje_error) {
          errors.push({
            path: `validaciones[${index}].mensaje_error`,
            message: `El campo "mensaje_error" es obligatorio.`
          });
        }

        if (!validacion.nombre_regla) {
          errors.push({
            path: `validaciones[${index}].nombre_regla`,
            message: `El campo "validacion" es obligatorio.`
          });
        } else if (!this.allowedValidations.includes(validacion.nombre_regla)) {
          errors.push({
            path: `validaciones[${index}].nombre_regla`,
            message: `La validación "${validacion.nombre_regla}" no está permitida.`
          });
        }

        if (!validacion.valor || typeof validacion.valor !== 'object') {
          errors.push({
            path: `validaciones[${index}].valor`,
            message: 'El campo "valor" debe ser un objeto.'
          });
        } else {
          // Validar las propiedades dentro del objeto 'valor' si es necesario
          Object.keys(validacion.valor).forEach((key) => {
            if (typeof validacion.valor[key] === 'undefined' || validacion.valor[key] === null) {
              errors.push({
                path: `validaciones[${index}].valor.${key}`,
                message: `El valor de "${key}" no puede ser nulo o indefinido.`
              });
            }
          });
        }
      });
    }

    return errors;
  }




  updateProjectData(): void {
    const esquemas = this.jsonEditorSchema.get();
    const validaciones = this.jsonEditorValidations.get();

    this.projectData.esquemas = esquemas.map((esquema: any) => this.filterEsquemaProperties(esquema));

    // Validate the structure before allowing the update
    const errors = this.validateEditorContent(this.projectData);
    if (errors.length > 0) {
      this.showError('Errores en la validación. Por favor, revise.');
      return;
    }
  }


  updateProject(): void {
    this.updateProjectData();

    const errors = this.validateEditorContent(this.projectData);
    console.log('asd')
    if (errors.length > 0) {
      errors.forEach(error => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error de Validación',
          detail: `${error.path}: ${error.message}`
        });
      });
      return;
    }

    // Aquí ya tenemos datos validados, procedemos a guardar
    const userName = this.authService.getUserName();
    if (userName) {
      this.projectData.usuario_modificacion = userName;
    }

    // Verificamos si hay cambios
    if (JSON.stringify(this.projectData) === JSON.stringify(this.originalProjectData)) {
      this.messageService.add({
        severity: 'info',
        summary: 'Sin cambios',
        detail: 'No hay cambios para actualizar.'
      });
      return;
    }

    // Procedemos con la actualización
    this.loading = true;
    console.log('asd')
    this.projectService.updateProject(this.projectId, this.projectData).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Proyecto actualizado correctamente.' });
      },
      error: (err) => {
        if (err.status === 400 && err.error?.errors) {
          const errorMessages = this.formatErrorMessages(err.error.errors);
          this.showError(errorMessages);
        } else {
          this.showError('Ocurrió un error al actualizar el proyecto.');
        }
        this.loading = false;
      },
      complete: () => {
        this.loading = false;
      }
    });
  }



  formatErrorMessages(errors: any): string {
    return Object.entries(errors)
      .map(([field, message]) => `Campo '${field}': ${message}`)
      .join(', ');
  }
  openSchemaDialog() {
    this.displaySchemaDialog = true;
    setTimeout(() => {
      const container = document.getElementById('jsoneditor-schema-fullscreen');
      this.fullscreenSchemaEditor = new JSONEditor(container as HTMLElement, { mode: 'code' });
      this.fullscreenSchemaEditor.set(this.jsonEditorSchema.get());
    }, 0);
  }

  openValidationsDialog() {
    this.displayValidationsDialog = true;
    setTimeout(() => {
      const container = document.getElementById('jsoneditor-validations-fullscreen');
      this.fullscreenValidationsEditor = new JSONEditor(container as HTMLElement, { mode: 'code' });
      this.fullscreenValidationsEditor.set(this.jsonEditorValidations.get());
    }, 0);
  }

  closeSchemaDialog() {
    this.displaySchemaDialog = false;
    if (this.fullscreenSchemaEditor) {
      this.fullscreenSchemaEditor.destroy();
    }
  }

  closeValidationsDialog() {
    this.displayValidationsDialog = false;
    if (this.fullscreenValidationsEditor) {
      this.fullscreenValidationsEditor.destroy();
    }
  }

  showError(message: string = 'Hubo un problema al cargar la información del proyecto.') {
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: message,
      life: 5000
    });
  }

  applyFilterGlobal(filterValue: string, matchMode: string) {
    (document.querySelector('#dt') as any).filterGlobal(filterValue, matchMode);
  }

  goBack(): void {
    this.router.navigate(['/']);
  }
  // Handler when FilePond is initialized
  pondHandleInit() {
    console.log('FilePond ha sido inicializado', this.myPond);
  }
  getKeys(obj: any): string[] {
    return obj ? Object.keys(obj) : [];
  }

  pondHandleAddFile(event: any) {
    const file = event.file.file;
    if (file.type !== 'text/csv') {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Solo se permiten archivos CSV' });
      this.myPond['pond'].removeFile(event.file.id);
    } else {
      this.archivoCsv = file; // Almacena el archivo CSV en la variable
      console.log('Archivo CSV añadido:', file);
    }
  }
  pondHandleProcessFile(event: any) {
    console.log('Archivo procesado con éxito:', event);
  }

  pondHandleProcessFileError(event: any) {
    console.log('Error al procesar el archivo:', event);
  }


  pondHandleActivateFile(event: any) {
    console.log('Un archivo fue activado', event);
  }
  ngOnDestroy() {
    if (this.jsonEditorSchema) {
      this.jsonEditorSchema.destroy();
    }
    if (this.jsonEditorValidations) {
      this.jsonEditorValidations.destroy();
    }
    if (this.fullscreenSchemaEditor) {
      this.fullscreenSchemaEditor.destroy();
    }
    if (this.fullscreenValidationsEditor) {
      this.fullscreenValidationsEditor.destroy();
    }
  }
}

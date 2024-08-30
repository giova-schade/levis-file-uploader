export interface Esquema {
    campo_nombre: string;
    tipo_dato: string;
    requerido: boolean;
    longitud_maxima?: number | null;
    valores_permitidos?: any[] | null;
    es_clave_primaria: boolean;
    es_unico: boolean;
  }
  
  export interface Validacion {
    campo_nombre: string;
    mensaje_error: string;
    nombre_regla: string;
    valor: { [key: string]: any };  
  }
  
  
  export interface TablaAsociada {
    nombre_tabla: string;
    datos: any[];
  }
  
  export interface Project {
    id?: number;
    nombre_proyecto: string;
    nombre_tabla: string;
    creado_modificado_por: string;
    fecha_creacion: string;
    fecha_actualizacion: string;
    esquemas: Esquema[];
    validaciones: Validacion[];
    tabla_asociada: TablaAsociada;
    archivo_csv?: File;
    usuario_modificacion?: string; 
  }
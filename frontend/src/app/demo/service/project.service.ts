import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../auth/auth.service'; // Importa el AuthService

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  private apiUrl = `${environment.apiUrl}/projects/projects`;
  private apiUrlBy = `${environment.apiUrl}/projects`;
  private apiUrlA = `${environment.apiUrl}`;
  private apiUrDelete = `${environment.apiUrl}/projects/delete`;
  private apiUrlUpload = `${environment.apiUrl}/upload`;


  constructor(private http: HttpClient, private authService: AuthService) {} // Inyecta el AuthService

  // Obtener lista de proyectos
  getProjects(): Observable<any> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get(`${this.apiUrl}`, { headers });
  }

  // Obtener un proyecto por ID
  getProjectById(id: number): Observable<any> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get(`${this.apiUrlBy}/projectsById/${id}`, { headers });
  }
  // Obtener lista de validaciones disponibles
  getValidations(): Observable<string[]> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get<string[]>(`${this.apiUrlA}/validations/`, { headers });
  }
  // Crear un nuevo proyecto
  createProject(projectData: any): Observable<any> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.put(`${this.apiUrlBy}/`, projectData, { headers });
}
  
  // Servicio para subir el archivo CSV
  uploadCsvFile(projectId: number, archivoCsv: File): Observable<any> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    const formData = new FormData();
    formData.append('file', archivoCsv);

    return this.http.post(`${this.apiUrlBy}/upload/${projectId}`, formData, { headers });
  }
  
  // Actualizar un proyecto existente
  updateProject(id: number, projectData: any): Observable<any> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.put(`${this.apiUrlBy}/${id}`, projectData, { headers });
  }

  

// Eliminar un proyecto
deleteProjects(projectIds: number[]): Observable<any> {
  const token = this.authService.getToken();
  const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
  const body = { project_ids: projectIds };
  
  return this.http.request('delete', `${this.apiUrDelete}`, { 
    headers: headers,
    body: body 
  });
}

}

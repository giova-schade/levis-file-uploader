import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class FileUploadService {
  private apiUrl = `${environment.apiUrl}/upload`;

  constructor(private http: HttpClient, private authService: AuthService) {}

  uploadFile(projectId: number, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);

    const token = this.authService.getToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.post(`${this.apiUrl}/${projectId}`, formData, { headers });
  }
}

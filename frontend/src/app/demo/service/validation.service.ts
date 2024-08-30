import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ValidationService {
  private apiUrl = `${environment.apiUrl}/validations`;

  constructor(private http: HttpClient) {}

  // Obtener todas las validaciones
  getValidations(): Observable<any> {
    return this.http.get(`${this.apiUrl}`);
  }
}

import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  private apiUrl = 'https://app-204edef5-5c42-4d2e-9cbe-32596723ac54.cleverapps.io/api';


  constructor(private http: HttpClient) {}

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Ocurrió un error desconocido';
    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      errorMessage = Error: ${error.error.message};
    } else {
      // El backend retornó un código de error
      errorMessage = Código de error ${error.status},  +
                     mensaje: ${error.error.message || error.statusText};
    }
    console.error(errorMessage);
    return throwError(errorMessage);
  }

  loginAlumno(usuario: string, correo: string, rut: string): Observable<any> {
    return this.http.post(${this.apiUrl}/login-alumno, { usuario, correo_institucional: correo, rut })
      .pipe(
        catchError(error => {
          console.error('Error details:', error);
          if (error.error instanceof ErrorEvent) {
            console.error('Client side error:', error.error.message);
          } else {
            console.error(Server side error: ${error.status} ${error.message});
          }
          return throwError('Ocurrió un error al conectar con el servidor. Por favor, intente nuevamente.');
        })
      );
  }

  loginProfesor(usuario: string, contrasena: string): Observable<any> {
    return this.http.post(${this.apiUrl}/login-profesor, { usuario, contrasena })
      .pipe(
        tap(response => console.log('Respuesta del servidor:', response)),
        catchError(this.handleError)
      );
  }

  registroProfesor(correo: string, rut: string, contrasena: string): Observable<any> {
    return this.http.post(${this.apiUrl}/registro-profesor, { correo_institucional: correo, rut, contrasena })
      .pipe(
        tap(response => console.log('Respuesta del servidor:', response)),
        catchError(this.handleError)
      );
  }


  obtenerAlumno(id: number): Observable<any> {
    return this.http.get(${this.apiUrl}/alumno/${id}).pipe(
      catchError(this.handleError)
    );
  }

 // Nueva función para obtener los ramos del alumno
 obtenerRamos(alumnoId: number): Observable<any> {
   return this.http.get<any>(${this.apiUrl}/ramos/${alumnoId});
 }


 obtenerRamosYClasesTotales(alumnoId: number): Observable<any> {
  return this.http.get<any>(${this.apiUrl}/ramos/${alumnoId});  // Asegúrate de que la URL esté correcta
}

  // Cambiar el tipo de 'id' a 'number' en el método obtenerAsistencia
obtenerAsistencia(id: number): Observable<any> {
  return this.http.get<any>(${this.apiUrl}/asistencia/${id});
}



}

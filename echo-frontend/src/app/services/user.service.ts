import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = environment.apiUrl + '/api/users';

  constructor(private http: HttpClient) {}

  /**
   * Busca usuarios por nombre de usuario
   * @param username Nombre de usuario a buscar
   * @returns Observable con el array de usuarios que coinciden con la búsqueda
   */
  searchUsers(username: string): Observable<User[]> {
    if (!username || username.trim().length < 2) {
      return of([]);
    }
    
    return this.http.get<User[]>(`${this.apiUrl}/search?username=${encodeURIComponent(username)}`).pipe(
      catchError(error => {
        console.error('Error buscando usuarios:', error);
        return of([]);
      })
    );
  }

  /**
   * Obtener usuario por nombre de usuario.
   * Usa el endpoint de búsqueda temporalmente.
   * @param username El nombre de usuario del artista.
   * @returns Observable con el usuario encontrado o null.
   */
  getUserByUsername(username: string): Observable<User | null> {
    if (!username || username.trim().length === 0) {
      return of(null);
    }
    // Usamos el endpoint de búsqueda y tomamos el primer resultado
    return this.searchUsers(username).pipe(
      map(users => (users && users.length > 0 ? users[0] : null)),
      catchError(error => {
        console.error('Error obteniendo usuario por nombre de usuario:', error);
        return of(null);
      })
    );
  }

  /**
   * Obtiene todos los artistas
   * @returns Observable con el array de artistas
   */
  getArtists(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/artists`).pipe(
      catchError(error => {
        console.error('Error cargando artistas:', error);
        return of([]);
      })
    );
  }

  /**
   * Obtiene todos los usuarios registrados.
   * Llama al endpoint /api/users/search sin parámetro para obtener todos.
   * @returns Observable con el array de todos los usuarios.
   */
  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/search`).pipe(
      catchError(error => {
        console.error('Error obteniendo todos los usuarios:', error);
        // Puedes ajustar el manejo de errores según necesites
        return of([]); // Retornar un array vacío en caso de error
      })
    );
  }

  /**
   * Elimina un usuario por su ID.
   * @param id El ID del usuario a eliminar.
   * @returns Observable<void>
   */
  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      catchError(error => {
        console.error(`Error eliminando usuario con ID ${id}:`, error);
        return throwError(() => new Error(`No se pudo eliminar el usuario con ID ${id}`));
      })
    );
  }

  /**
   * Actualiza la información de un usuario (incluyendo el rol).
   * @param user El objeto User con la información actualizada.
   * @returns Observable<User> con el usuario actualizado.
   */
  updateUser(user: User): Observable<User> {
    if (user && user.id === undefined) {
      console.error('Error actualizando usuario: El ID del usuario es indefinido.');
      return throwError(() => new Error('El ID del usuario es indefinido.'));
    }
    return this.http.put<User>(`${this.apiUrl}/${user.id}`, user).pipe(
      catchError(error => {
        console.error(`Error actualizando usuario con ID ${user.id}:`, error);
        return throwError(() => new Error(`No se pudo actualizar el usuario con ID ${user.id}`));
      })
    );
  }
}

import { Component, OnInit } from '@angular/core';
import { UserService } from '../../services/user.service';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { User } from '../../models/user.model';
import { Role } from '../../models/role.model';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-user-management',
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.css'],
  imports: [CommonModule]
})
export class UserManagementComponent implements OnInit {
  users: User[] = [];
  filteredUsers: User[] = [];
  paginatedUsers: User[] = [];
  searchTerm: string = '';
  availableRolesBackendNames: string[] = ['ROLE_ADMIN', 'ROLE_USER'];
  
  isLoading: boolean = false;
  successMessage: string | null = null;
  errorMessage: string | null = null;

  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalUsers: number = 0;
  totalPages: number = 0;

  constructor(private userService: UserService) { }

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers() {
    this.isLoading = true;
    this.clearMessages();

    this.userService.getAllUsers().pipe(
      catchError(err => {
        this.handleError('No se pudieron cargar los usuarios.', err);
        return of([]);
      })
    ).subscribe(users => {
      this.users = users.map(user => ({
        ...user,
        roles: user.roles || [],
        isProcessing: false
      }));
      this.filterUsers();
      this.isLoading = false;
    });
  }

  onSearchChange(event: any) {
    this.searchTerm = (event.target as HTMLInputElement).value.toLowerCase();
    this.filterUsers();
  }

  filterUsers() {
    let tempUsers = this.users;
    if (this.searchTerm) {
      tempUsers = this.users.filter(user =>
        user.username.toLowerCase().includes(this.searchTerm) ||
        user.email.toLowerCase().includes(this.searchTerm) ||
        (user.roles && user.roles.some(role => role.name.toLowerCase().includes(this.searchTerm)))
      );
    }
    this.filteredUsers = tempUsers;
    this.totalUsers = this.filteredUsers.length;
    this.totalPages = Math.ceil(this.totalUsers / this.itemsPerPage);
    this.currentPage = 1;
    this.paginateUsers();
  }

  paginateUsers() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedUsers = this.filteredUsers.slice(startIndex, endIndex);
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.paginateUsers();
    }
  }

  getRoleDisplayName(backendRoleName: string): string {
    switch (backendRoleName) {
      case 'ROLE_ADMIN':
        return 'Administrator';
      case 'ROLE_USER':
        return 'Regular User';
      default:
        return backendRoleName;
    }
  }

  getUserRoleName(user: User): string {
    return user.roles && user.roles.length > 0 ? user.roles[0].name : '[Sin Rol]';
  }

  confirmDeleteUser(user: User) {
    if (user.isProcessing) {
      return;
    }
    if (confirm(`¿Estás seguro de que quieres eliminar a ${user.username}?`)) {
      this.deleteUser(user);
    }
  }

  deleteUser(user: User) {
    console.log('Intentando eliminar usuario:', user);
    this.clearMessages();

    if (user.id === undefined) {
      console.error('No se puede eliminar el usuario: el ID es indefinido.');
      this.handleError('No se puede eliminar el usuario: ID no disponible.', null);
      return;
    }

    this.setUserProcessing(user.id, true);

    this.userService.deleteUser(user.id).subscribe({
      next: () => {
        console.log('Usuario eliminado con éxito:', user);
        this.users = this.users.filter(u => u.id !== user.id);
        this.filterUsers();
        this.showSuccessMessage(`Usuario ${user.username} eliminado con éxito.`);
      },
      error: (err) => {
        this.handleError(`Error al eliminar usuario ${user.username}.`, err);
        this.setUserProcessing(user.id, false);
      }
    });
  }

  changeRole(user: User, event: Event) {
    const newRoleBackendName = (event.target as HTMLSelectElement).value;
    console.log('Intentando cambiar rol del usuario:', user.username, 'a', newRoleBackendName);

    const currentRoleNames = user.roles ? user.roles.map(role => role.name) : [];
    const currentMainRoleBackendName = currentRoleNames.length > 0 ? currentRoleNames[0] : '';

    if (currentMainRoleBackendName === newRoleBackendName || user.isProcessing) {
      console.log('El rol es el mismo, el rol principal no ha cambiado o el usuario está procesando.');
      if (user.isProcessing) {
        (event.target as HTMLSelectElement).value = currentMainRoleBackendName;
      }
      return;
    }

    if (user.id === undefined) {
      console.error('No se puede cambiar el rol del usuario: el ID es indefinido.');
      this.handleError('No se puede cambiar el rol del usuario: ID no disponible.', null);
      (event.target as HTMLSelectElement).value = currentMainRoleBackendName;
      return;
    }

    const originalRoles = user.roles ? [...user.roles] : [];

    const newRoleObject: Role = { name: newRoleBackendName };
    const updatedUser = { ...user, roles: [newRoleObject] };

    this.clearMessages();
    this.setUserProcessing(user.id, true);

    this.userService.updateUser(updatedUser).subscribe({
      next: (updatedUserData) => {
        console.log('Usuario actualizado con éxito (rol cambiado):', updatedUserData);
        const index = this.users.findIndex(u => u.id === updatedUserData.id);
        if (index !== -1) {
          this.users[index] = { ...updatedUserData, roles: updatedUserData.roles || [], isProcessing: false };
          this.filterUsers();
        }
        this.showSuccessMessage(`Rol de usuario ${updatedUserData.username} cambiado a ${this.getRoleDisplayName(this.getUserRoleName(updatedUserData))}.`);
      },
      error: (err) => {
        this.handleError(`Error al cambiar rol del usuario ${user.username}.`, err);

        const index = this.users.findIndex(u => u.id === user.id);
        if (index !== -1) {
          this.users[index].roles = originalRoles;
          this.users[index].isProcessing = false;
          this.filterUsers();
        }
        (event.target as HTMLSelectElement).value = originalRoles.length > 0 ? originalRoles[0].name : '';
      }
    });
  }

  private setUserProcessing(userId: number | undefined, isProcessing: boolean) {
    if (userId === undefined) return;
    const user = this.users.find(u => u.id === userId);
    if (user) {
      user.isProcessing = isProcessing;
    }
  }

  private showSuccessMessage(message: string) {
    this.successMessage = message;
    setTimeout(() => this.successMessage = null, 5000);
  }

  private handleError(message: string, error: any) {
    console.error(message, error);
    this.errorMessage = message;
    setTimeout(() => this.errorMessage = null, 5000);
  }

  private clearMessages() {
    this.successMessage = null;
    this.errorMessage = null;
  }

} 
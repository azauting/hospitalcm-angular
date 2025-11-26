import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '../../../../core/services/user/user.service';
import { finalize } from 'rxjs/operators';
import { AuthService } from '../../../../core/services/auth/auth.service';
import { Router } from '@angular/router';

@Component({
    selector: 'app-admin-usuarios',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './usuarios.html'
})
export class AdminUsuariosComponent implements OnInit {

    usuarios = signal<any[]>([]);
    loading = signal(false);
    errorMsg = signal('');
    successMsg = signal('');
    filtroBusqueda = signal('');
    filtroRol = signal('todos');
    filtroUnidad = signal('todos');

    modalRol: any = null;
    modalUnidad: any = null;
    modalPassword: any = null;

    // paginación
    currentPage = 1;
    itemsPerPage = 10;
    totalUsers = 0;



    usuario: any; // usuario logeado

    constructor(
        private userService: UserService,
        private authService: AuthService,
        private router: Router
    ) { }

    ngOnInit() {
        this.usuario = this.authService.getUser();
        this.cargarUsuarios();
    }

    // =============================
    // OBTENER TODOS LOS USUARIOS
    // =============================
    cargarUsuarios() {
        this.loading.set(true);
        this.errorMsg.set('');
        this.successMsg.set('');

        this.userService.getAllUsers()
            .pipe(finalize(() => this.loading.set(false)))
            .subscribe({
                next: (resp: any) => {
                    if (resp?.success) {
                        const usersData = resp.data || [];
                        this.usuarios.set(usersData);
                        console.log("Usuarios cargados:", usersData);
                        this.totalUsers = usersData.length;
                    } else {
                        this.errorMsg.set(resp?.message || 'No se pudieron obtener usuarios');
                    }
                },
                error: () => {
                    this.errorMsg.set('Error al obtener los usuarios');
                },
            });
    }

    convertRol(value: string): number {
        return Number(value);
    }

    convertUnidad(value: string): number | null {
        if (value === 'null') return null;

        const num = Number(value);
        return isNaN(num) ? null : num;
    }
    // ===================================
    // CAMBIAR CONTRASEÑA DEL USUARIO
    // ===================================
    cambiarPassword(usuarioId: number, nuevaContrasena: string) {
        if (!nuevaContrasena.trim()) {
            this.errorMsg.set('La contraseña no puede estar vacía');
            return;
        }
        console.log(nuevaContrasena)
        this.loading.set(true);
        this.userService.updateUserPassword(usuarioId, { contrasena: nuevaContrasena })
            .pipe(finalize(() => this.loading.set(false)))
            .subscribe({
                next: (resp: any) => {
                    if (resp.success) {
                        this.successMsg.set('Contraseña actualizada correctamente');
                    } else {
                        this.errorMsg.set(resp.message || 'Error al actualizar contraseña');
                    }
                },
                error: () => this.errorMsg.set('Error al actualizar contraseña')
            });
    }

    // ===================================
    // CAMBIAR ROL DEL USUARIO
    // ===================================
    cambiarRol(usuarioId: number, nuevoRol: number) {
        console.log("Role enviando", nuevoRol);
        this.loading.set(true);
        
        this.userService.updateUserRole(usuarioId, { newRoleId: nuevoRol })
            .pipe(finalize(() => this.loading.set(false)))
            .subscribe({
                next: (resp: any) => {
                    if (resp.success) {
                        this.successMsg.set('Rol actualizado correctamente');
                        this.cargarUsuarios();
                    } else {
                        this.errorMsg.set(resp.message);
                    }
                },
                error: () => this.errorMsg.set('Error al actualizar rol')
            });
    }

    // ===================================
    // CAMBIAR UNIDAD DEL USUARIO
    // ===================================
    cambiarUnidad(usuarioId: number, nuevaUnidad: number | null) {
        console.log("Unidad enviada:", nuevaUnidad);

        this.loading.set(true);
        this.userService.updateUserUnit(usuarioId, { newUnitId: nuevaUnidad })
            .pipe(finalize(() => this.loading.set(false)))
            .subscribe({
                next: (resp: any) => {
                    if (resp.success) {
                        this.successMsg.set('Unidad actualizada correctamente');
                        this.cargarUsuarios();
                    } else {
                        this.errorMsg.set(resp.message);
                    }
                },
                error: () => this.errorMsg.set('Error al actualizar unidad')
            });
    }

    // ===================================
    // SOPORTES DISPONIBLES
    // ===================================
    cargarSoportesDisponibles() {
        this.loading.set(true);
        this.userService.getAvailableSupports()
            .pipe(finalize(() => this.loading.set(false)))
            .subscribe({
                next: (resp: any) => {
                    console.log("Soportes disponibles:", resp.data);
                },
                error: () => this.errorMsg.set('Error al obtener soportes disponibles')
            });
    }
    // ==============================
    // FILTROS
    // ==============================
    getFilteredUsers() {
        const search = this.filtroBusqueda().toLowerCase();
        const rol = this.filtroRol();
        const unidad = this.filtroUnidad();

        return this.usuarios().filter(u => {

            // 🔍 BUSQUEDA general (nombre o correo)
            const matchSearch =
                u.nombre_completo.toLowerCase().includes(search) ||
                u.correo.toLowerCase().includes(search);

            // 🎭 FILTRO ROL
            const matchRol =
                rol === 'todos' ||
                String(u.rol_id) === rol ||
                u.nombre_rol?.toLowerCase() === rol;

            // 🏢 FILTRO UNIDAD
            const matchUnidad =
                unidad === 'todos' ||
                String(u.unidad_id) === unidad ||
                u.nombre_unidad?.toLowerCase() === unidad;

            return matchSearch && matchRol && matchUnidad;
        });
    }

    // ===============================
    // PAGINACIÓN
    // ===============================
    getPaginatedUsers() {
        const filtered = this.getFilteredUsers();
        this.totalUsers = filtered.length;

        const start = (this.currentPage - 1) * this.itemsPerPage;
        return filtered.slice(start, start + this.itemsPerPage);
    }

    get totalPages(): number {
        return Math.ceil(this.totalUsers / this.itemsPerPage);
    }

    nextPage() {
        if (this.currentPage < this.totalPages) {
            this.currentPage++;
        }
    }

    previousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
        }
    }

    // Cambiar items por página
    onItemsPerPageChange(event: any) {
        this.itemsPerPage = Number(event.target.value);
        this.currentPage = 1;
    }

}

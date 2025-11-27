import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '../../../../core/services/user/user.service';
import { finalize } from 'rxjs/operators';
import { AuthService } from '../../../../core/services/auth/auth.service';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';

@Component({
    selector: 'app-admin-usuarios',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './usuarios.html'
})
export class AdminUsuariosComponent implements OnInit {

    // DATA & STATES
    usuarios = signal<any[]>([]);
    loading = signal(false);
    
    // FILTROS
    filtroBusqueda = signal('');
    filtroRol = signal('todos');
    filtroUnidad = signal('todos');

    // MODALS (Objeto usuario seleccionado)
    modalRol: any = null;
    modalUnidad: any = null;
    modalPassword: any = null;

    // PAGINACIÓN
    currentPage = 1;
    itemsPerPage = 10;
    totalUsers = 0;

    usuario: any; // Usuario logeado

    constructor(
        private userService: UserService,
        private authService: AuthService,
        private toastr: ToastrService
    ) { }

    ngOnInit() {
        this.usuario = this.authService.getUser();
        this.cargarUsuarios();
    }

    // =============================
    // CARGA DE DATOS
    // =============================
    cargarUsuarios() {
        this.loading.set(true);

        this.userService.getAllUsers()
            .pipe(finalize(() => this.loading.set(false)))
            .subscribe({
                next: (resp: any) => {
                    if (resp?.success) {
                        const usersData = resp.data || [];
                        this.usuarios.set(usersData);
                        this.totalUsers = usersData.length;
                    } else {
                        this.toastr.error(resp?.message || 'No se pudieron obtener los usuarios', 'Error');
                    }
                },
                error: () => this.toastr.error('Error de conexión al cargar usuarios', 'Error'),
            });
    }

    // ===================================
    // ACCIONES DE MODIFICACIÓN
    // ===================================
    
    cambiarPassword(usuarioId: number, nuevaContrasena: string) {
        if (!nuevaContrasena || !nuevaContrasena.trim()) {
            this.toastr.warning('La contraseña no puede estar vacía', 'Atención');
            return;
        }

        const toastId = this.toastr.info('Actualizando...', 'Procesando').toastId;

        this.userService.updateUserPassword(usuarioId, { contrasena: nuevaContrasena })
            .subscribe({
                next: (resp: any) => {
                    this.toastr.clear(toastId);
                    if (resp.success) {
                        this.toastr.success('Contraseña actualizada correctamente', 'Éxito');
                    } else {
                        this.toastr.error(resp.message || 'Error al actualizar', 'Error');
                    }
                },
                error: () => {
                    this.toastr.clear(toastId);
                    this.toastr.error('Error del servidor', 'Error');
                }
            });
    }

    cambiarRol(usuarioId: number, nuevoRol: number) {
        const toastId = this.toastr.info('Actualizando rol...', 'Procesando').toastId;
        
        this.userService.updateUserRole(usuarioId, { newRoleId: nuevoRol })
            .subscribe({
                next: (resp: any) => {
                    this.toastr.clear(toastId);
                    if (resp.success) {
                        this.toastr.success('Rol actualizado correctamente', 'Éxito');
                        this.cargarUsuarios(); // Recargar lista
                    } else {
                        this.toastr.error(resp.message, 'Error');
                    }
                },
                error: () => {
                    this.toastr.clear(toastId);
                    this.toastr.error('Error al actualizar rol', 'Error');
                }
            });
    }

    cambiarUnidad(usuarioId: number, nuevaUnidad: number | null) {
        const toastId = this.toastr.info('Actualizando unidad...', 'Procesando').toastId;

        this.userService.updateUserUnit(usuarioId, { newUnitId: nuevaUnidad })
            .subscribe({
                next: (resp: any) => {
                    this.toastr.clear(toastId);
                    if (resp.success) {
                        this.toastr.success('Unidad actualizada correctamente', 'Éxito');
                        this.cargarUsuarios();
                    } else {
                        this.toastr.error(resp.message, 'Error');
                    }
                },
                error: () => {
                    this.toastr.clear(toastId);
                    this.toastr.error('Error al actualizar unidad', 'Error');
                }
            });
    }

    // ==============================
    // HELPERS & FILTROS
    // ==============================
    convertRol(value: string): number {
        return Number(value);
    }

    convertUnidad(value: string): number | null {
        if (value === 'null' || value === '') return null;
        const num = Number(value);
        return isNaN(num) ? null : num;
    }

    getFilteredUsers() {
        const search = this.filtroBusqueda().toLowerCase();
        const rol = this.filtroRol();
        const unidad = this.filtroUnidad();

        return this.usuarios().filter(u => {
            // 1. Busqueda Texto
            const matchSearch =
                u.nombre_completo.toLowerCase().includes(search) ||
                u.correo.toLowerCase().includes(search);

            // 2. Rol
            const matchRol =
                rol === 'todos' ||
                String(u.rol_id) === rol ||
                u.nombre_rol?.toLowerCase() === rol;

            // 3. Unidad
            const matchUnidad =
                unidad === 'todos' ||
                String(u.unidad_id) === unidad ||
                (unidad === 'null' && !u.unidad_id);

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
        return Math.ceil(this.totalUsers / this.itemsPerPage) || 1;
    }

    nextPage() {
        if (this.currentPage < this.totalPages) this.currentPage++;
    }

    previousPage() {
        if (this.currentPage > 1) this.currentPage--;
    }

    onItemsPerPageChange(event: any) {
        this.itemsPerPage = Number(event.target.value);
        this.currentPage = 1;
    }
}
import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService, CreateUserPayload } from '../../../../core/services/auth.service';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';

@Component({
    selector: 'app-admin-create-user',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './crear-usuario.html'
})
export class CreateUserComponent {

    loading = signal(false);

    // Form fields
    nombre_completo = signal('');
    correo = signal('');
    contrasena = signal('');
    rol_id = signal<number | null>(null);
    unidad_id = signal<number | null>(null);

    constructor(
        private authService: AuthService,
        private toastr: ToastrService,
        private router: Router
    ) { }

    createUser() {
        if (!this.nombre_completo() || !this.correo() || !this.contrasena() || !this.rol_id()) {
            this.toastr.warning('Todos los campos obligatorios deben completarse', 'Atención');
            return;
        }

        const payload: CreateUserPayload = {
            nombre_completo: this.nombre_completo(),
            correo: this.correo(),
            contrasena: this.contrasena(),
            rol_id: this.rol_id()!,
            unidad_id: this.rol_id() === 1 ? null : this.unidad_id(), // lógica ejemplo
        };

        this.loading.set(true);

        this.authService.createUser(payload).subscribe({
            next: (resp: any) => {
                this.loading.set(false);

                if (resp.success) {
                    this.toastr.success('Usuario creado exitosamente', 'Éxito');

                    // Clear form
                    this.nombre_completo.set('');
                    this.correo.set('');
                    this.contrasena.set('');
                    this.rol_id.set(null);
                    this.unidad_id.set(null);

                    // Optional redirect
                    this.router.navigate(['/admin/usuarios']);
                } else {
                    this.toastr.error(resp.message || 'Error al crear usuario', 'Error');
                }
            },
            error: () => {
                this.loading.set(false);
                this.toastr.error('Error de servidor', 'Error');
            }
        });
    }
}

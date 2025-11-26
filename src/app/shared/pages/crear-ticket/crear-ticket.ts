import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';

import {
    TicketService,
    TicketCreatePayload,
    Ubicacion
} from '../../../core/services/ticket/ticket.service';
import { AuthService } from '../../../core/services/auth/auth.service';
@Component({
    selector: 'app-crear-ticket',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './crear-ticket.html',
})
export class CrearTicketComponent implements OnInit {
    private ticketService = inject(TicketService);
    private router = inject(Router);
    public authService = inject(AuthService);

    rol = '';
    // campos del formulario
    asunto = '';
    descripcion = '';
    telefono = '';
    autor_problema = '';
    evento_id: number | null = null;
    ubicacion_id: number | null = null;

    // signals
    ubicaciones = signal<Ubicacion[]>([]);
    loading = signal<boolean>(false);
    loadingUbicaciones = signal<boolean>(false);
    errorMsg = signal<string>('');
    successMsg = signal<string>('');

    ngOnInit() {
        const user = this.authService.getUser();
        this.rol = user?.nombre_rol ?? '';
        this.cargarUbicaciones();
    }

    cargarUbicaciones() {
        // Solo cargar si no estamos ya cargando y no tenemos datos
        if (this.loadingUbicaciones() || this.ubicaciones().length > 0) {
            return;
        }

        this.loadingUbicaciones.set(true);
        this.errorMsg.set('');

        this.ticketService.getUbicaciones()
            .pipe(finalize(() => this.loadingUbicaciones.set(false)))
            .subscribe({
                next: (resp: any) => {
                    if (resp?.success) {
                        const ubicacionesData = resp.data?.ubicaciones ?? [];
                        this.ubicaciones.set(ubicacionesData);

                        if (ubicacionesData.length === 0) {
                            this.errorMsg.set('No hay ubicaciones disponibles. Contacta al administrador.');
                        }
                    } else {
                        this.errorMsg.set(resp?.message || 'No se pudieron obtener las ubicaciones');
                    }
                },
                error: (error) => {
                    console.error('Error loading locations:', error);
                    this.errorMsg.set('Error al cargar las ubicaciones. Por favor, intenta más tarde.');
                }
            });
    }

    onSubmit() {
        if (!this.validarFormulario()) {
            return;
        }

        this.errorMsg.set('');
        this.successMsg.set('');

        // Base del payload (todos los roles)
        const payload: any = {
            asunto: this.asunto.trim(),
            descripcion: this.descripcion.trim(),
            telefono: this.telefono.trim(),
            autor_problema: this.autor_problema.trim(),
            ubicacion_id: this.ubicacion_id!,
        };

        // Si es SOPORTE o ADMINISTRADOR → debe enviar evento_id
        if (this.rol === 'soporte' || this.rol === 'administrador') {
            if (!this.evento_id) {
                this.errorMsg.set('Debes seleccionar un evento para este ticket');
                return;
            }
            payload.evento_id = this.evento_id;
        }

        this.loading.set(true);

        this.ticketService.crearTicket(payload)
            .pipe(finalize(() => this.loading.set(false)))
            .subscribe({
                next: (resp: any) => {
                    if (resp?.success) {
                        this.successMsg.set(resp.message || '¡Ticket creado correctamente!');
                        this.limpiarFormulario();

                        setTimeout(() => {
                            if (this.rol === 'solicitante') {
                                this.router.navigate(['/solicitante/mis-tickets']);
                            } else if (this.rol === 'soporte') {
                                this.router.navigate(['/soporte']);
                            } else {
                                this.router.navigate(['/admin']);
                            }
                        }, 1500);
                    } else {
                        this.errorMsg.set(resp?.message || 'Error al crear el ticket');
                    }
                },
                error: (error) => {
                    console.error('Error creating ticket:', error);
                    this.errorMsg.set(this.obtenerMensajeError(error));
                }
            });
    }


    private validarFormulario(): boolean {
        if (!this.asunto.trim()) {
            this.errorMsg.set('El asunto es requerido');
            return false;
        }

        if (!this.descripcion.trim()) {
            this.errorMsg.set('La descripción es requerida');
            return false;
        }

        if (!this.telefono.trim()) {
            this.errorMsg.set('El teléfono es requerido');
            return false;
        }

        if (!this.autor_problema.trim()) {
            this.errorMsg.set('El nombre de quien reporta es requerido');
            return false;
        }

        if (!this.ubicacion_id) {
            this.errorMsg.set('Debes seleccionar una ubicación');
            return false;
        }

        if (this.ubicaciones().length === 0) {
            this.errorMsg.set('No hay ubicaciones disponibles. No se puede crear el ticket.');
            return false;
        }

        // Validaciones de longitud
        if (this.asunto.trim().length < 5) {
            this.errorMsg.set('El asunto debe tener al menos 5 caracteres');
            return false;
        }

        if (this.descripcion.trim().length < 10) {
            this.errorMsg.set('La descripción debe tener al menos 10 caracteres');
            return false;
        }

        if (this.autor_problema.trim().length < 3) {
            this.errorMsg.set('El nombre debe tener al menos 3 caracteres');
            return false;
        }

        return true;
    }

    private limpiarFormulario(): void {
        this.asunto = '';
        this.descripcion = '';
        this.telefono = '';
        this.autor_problema = '';
        this.ubicacion_id = null;
    }

    private obtenerMensajeError(error: any): string {
        if (error.status === 0) {
            return 'Error de conexión. Verifica tu conexión a internet.';
        } else if (error.status === 400) {
            return 'Datos inválidos. Por favor, verifica la información ingresada.';
        } else if (error.status === 401) {
            return 'Sesión expirada. Por favor, inicia sesión nuevamente.';
        } else if (error.status === 500) {
            return 'Error del servidor. Por favor, intenta más tarde.';
        }

        return 'Error al crear el ticket. Por favor, intenta nuevamente.';
    }

    volver(): void {
        this.router.navigate(['/solicitante/mis-tickets']);
    }

    // Método para recargar ubicaciones
    recargarUbicaciones(): void {
        this.ubicaciones.set([]); // Limpiar ubicaciones existentes
        this.cargarUbicaciones();
    }

    // Getters para el template
    get hayUbicaciones(): boolean {
        return this.ubicaciones().length > 0;
    }

    get formularioValido(): boolean {
        return !!this.asunto.trim() &&
            !!this.descripcion.trim() &&
            !!this.telefono.trim() &&
            !!this.autor_problema.trim() &&
            !!this.ubicacion_id &&
            this.hayUbicaciones;
    }
}
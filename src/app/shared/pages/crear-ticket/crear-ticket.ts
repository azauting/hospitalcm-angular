import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';


import {
    TicketService,
} from '../../../core/services/ticket.service';
import { Location } from '../../../core/services/tipo.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
    selector: 'app-create-ticket',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './crear-ticket.html',
})
export class CrearTicketComponent implements OnInit {

    // Injections
    private ticketService = inject(TicketService);
    private router = inject(Router);
    private authService = inject(AuthService);
    private toastr = inject(ToastrService);


    // User data
    role = '';

    // Form fields
    asunto = '';
    descripcion = '';
    telefono = '';
    autor_problema = '';
    evento_id: number | null = null;
    ubicacion_id: number | null = null;
    ip_manual = '';

    // Signals
    locations = signal<Location[]>([]);
    loading = signal<boolean>(false);
    loadingLocations = signal<boolean>(false);
    userIp = signal<string>(''); 

    ngOnInit() {
        const user = this.authService.getUser();
        this.role = user?.nombre_rol?.toLowerCase() ?? '';
        this.autor_problema = user?.nombre_completo ?? '';
        this.loadLocations();
        this.detectarIpBackend();
    }
    detectarIpBackend() {
        this.ticketService.getMyIp().subscribe({
            next: (resp) => {
                if (resp.success) {
                    this.userIp.set(resp.ip);
                }
            },
            error: (err) => {
                console.error('No se pudo obtener la IP del servidor', err);
                this.userIp.set('Desconocida');
            }
        });
    }

    loadLocations() {
        if (this.loadingLocations() || this.locations().length > 0) return;

        this.loadingLocations.set(true);

        this.ticketService.getLocations()
            .pipe(finalize(() => this.loadingLocations.set(false)))
            .subscribe({
                next: (resp: any) => {
                    if (resp?.success) {
                        const data = resp.data?.tipos_ubicacion?.ubicaciones ?? [];
                        this.locations.set(data);

                        if (data.length === 0) {
                            this.toastr.warning('No hay ubicaciones configuradas en el sistema.', 'Aviso');
                        }
                    } else {
                        this.toastr.error('No se pudieron cargar las ubicaciones', 'Error');
                    }
                },
                error: () => {
                    this.toastr.error('Error de conexión al cargar ubicaciones', 'Error de Red');
                }
            });
    }

    onSubmit() {
        if (!this.validateForm()) return;

        const payload: any = {
            asunto: this.asunto.trim(),
            descripcion: this.descripcion.trim(),
            telefono: this.telefono.trim(),
            autor_problema: this.autor_problema.trim(),
            ip_manual: this.ip_manual.trim(),
            ubicacion_id: this.ubicacion_id!,
        };

        // Extra data for support/admin users
        if (this.role === 'soporte' || this.role === 'administrador') {
            if (!this.evento_id) {
                this.toastr.warning('Debes clasificar el tipo de evento', 'Faltan datos');
                return;
            }
            payload.evento_id = this.evento_id;
        }

        this.loading.set(true);

        this.ticketService.createTicket(payload)
            .pipe(finalize(() => this.loading.set(false)))
            .subscribe({
                next: (resp: any) => {
                    if (resp?.success) {
                        this.toastr.success('Ticket creado correctamente', '¡Enviado!');

                        setTimeout(() => {
                            this.redirectByRole();
                        }, 1500);

                    } else {
                        this.toastr.error(resp?.message || 'No se pudo crear el ticket', 'Error');
                    }
                },
                error: (error) => {
                    console.error(error);
                    const msg = error.status === 0 ? 'Sin conexión al servidor' : 'Error interno del servidor';
                    this.toastr.error(msg, 'Error');
                }
            });
    }

    private validateForm(): boolean {
        if (!this.asunto.trim()) {
            this.toastr.warning('El asunto es obligatorio', 'Atención');
            return false;
        }
        if (!this.descripcion.trim()) {
            this.toastr.warning('La descripción es obligatoria', 'Atención');
            return false;
        }
        if (!this.ubicacion_id) {
            this.toastr.warning('Selecciona una ubicación', 'Atención');
            return false;
        }
        if (!this.telefono.trim()) {
            this.toastr.warning('Indica un teléfono de contacto', 'Atención');
            return false;
        }
        if (!this.autor_problema.trim()) {
            this.toastr.warning('Indica quién reporta el problema', 'Atención');
            return false;
        }
        if (!this.ip_manual.trim()) {
            this.toastr.warning('La IP es obligatoria', 'Atención');
            return false;
        }
        return true;
    }

    cancel() {
        this.redirectByRole();
    }

    private redirectByRole() {
        if (this.role === 'administrador') {
            this.router.navigate(['/admin/tickets/sin-revisar']);
        } else if (this.role === 'soporte') {
            this.router.navigate(['/soporte']);
        } else {
            this.router.navigate(['/inicio/mis-tickets']);
        }
    }
}

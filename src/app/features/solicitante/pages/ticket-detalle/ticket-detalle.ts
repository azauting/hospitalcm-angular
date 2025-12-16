import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs/operators';

import { TicketService } from '../../../../core/services/ticket.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
    selector: 'app-ticket-detalle',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './ticket-detalle.html',
})
export class TicketDetalleComponent implements OnInit {

    // signals
    ticket = signal<any | null>(null);
    detalle = signal<any | null>(null);
    observaciones = signal<any[]>([]);

    loading = signal<boolean>(false);
    errorMsg = signal<string>('');

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private ticketService: TicketService,
        private authService: AuthService
    ) { }

    ngOnInit() {
        const id = Number(this.route.snapshot.paramMap.get('id'));
        if (!id) {
            this.errorMsg.set('ID de ticket no válido');
            return;
        }

        this.cargarTicket(id);
    }

    // === usuario (misma lógica que sidebar) ===
    get usuario() {
        return this.authService.user();
    }

    cargarTicket(id: number) {
        this.loading.set(true);
        this.errorMsg.set('');
        this.ticket.set(null);
        this.detalle.set(null);
        this.observaciones.set([]);

        this.ticketService.getTicketById(id)
            .pipe(finalize(() => this.loading.set(false)))
            .subscribe({
                next: (resp: any) => {
                    if (!resp?.success) {
                        this.errorMsg.set(resp?.message || 'No se pudo obtener el ticket');
                        return;
                    }

                    const wrapper = resp.data?.ticket;
                    if (!wrapper) {
                        this.errorMsg.set('El ticket no contiene información válida');
                        return;
                    }

                    this.ticket.set(wrapper.ticket || null);
                    this.detalle.set(wrapper.detalle || null);
                    this.observaciones.set(wrapper.observaciones || []);
                },
                error: () => {
                    this.errorMsg.set('Error al obtener el ticket');
                }
            });
    }

    // === UX FRONT: validar si puede cancelar ===
    puedeCancelarTicket(): boolean {
        const t = this.ticket();
        const u = this.usuario;

        if (!t || !u) return false;

        // solo solicitante
        if (u.nombre_rol !== 'solicitante') return false;

        // no cerrado ni resuelto
        if (['cerrado', 'resuelto'].includes(t.estado)) return false;

        // validación de tiempo (solo UX, backend valida de nuevo)
        const fechaCreacion = new Date(t.fecha_creacion);
        const ahora = new Date();
        const minutos = (ahora.getTime() - fechaCreacion.getTime()) / 1000 / 60;

        return minutos <= 5;
    }

    cancelarTicket() {
        const t = this.ticket();
        if (!t) return;

        if (!confirm('¿Estás seguro de anular este ticket? Esta acción no se puede deshacer.')) {
            return;
        }

        this.loading.set(true);

        this.ticketService.cancelTicket(t.ticket_id)
            .pipe(finalize(() => this.loading.set(false)))
            .subscribe({
                next: (resp: any) => {
                    if (resp?.success) {
                        this.router.navigate(['/inicio']);
                    } else {
                        this.errorMsg.set(resp?.message || 'No se pudo cancelar el ticket');
                    }
                },
                error: (err) => {
                    this.errorMsg.set(err?.error?.message || 'Error al cancelar el ticket');
                }
            });
    }

    volver() {
        this.router.navigate(['/solicitante/mis-tickets']);
    }
}

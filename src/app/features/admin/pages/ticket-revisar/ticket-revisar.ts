import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { FormsModule } from '@angular/forms';
import { TicketService } from '../../../../core/services/ticket/ticket.service';

@Component({
    selector: 'app-admin-ticket-revisar',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './ticket-revisar.html',
})
export class AdminTicketRevisarComponent implements OnInit {

    ticket = signal<any | null>(null);
    detalle = signal<any | null>(null);
    observaciones = signal<any[]>([]);
    soportes = signal<any[]>([]);

    loading = signal(false);
    savingConfig = signal(false);

    errorMsg = signal('');
    successMsg = signal('');

    unidad_id = signal<number | null>(null);
    prioridad_id = signal<number | null>(null);
    estado_id = signal<number | null>(null);

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private ticketService: TicketService
    ) { }

    ngOnInit() {
        const id = Number(this.route.snapshot.paramMap.get('id'));

        if (!id) {
            this.errorMsg.set('ID de ticket inválido');
            return;
        }

        this.cargar(id);
        this.cargarSoportes();
    }

    cargar(id: number) {
        this.loading.set(true);

        this.ticket.set(null);
        this.detalle.set(null);
        this.observaciones.set([]);

        this.errorMsg.set('');
        this.successMsg.set('');

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
                        this.errorMsg.set('Formato no válido');
                        return;
                    }

                    this.ticket.set(wrapper.ticket);
                    this.detalle.set(wrapper.detalle || null);
                    this.observaciones.set(wrapper.observaciones || []);

                    const t = wrapper.ticket;
                    this.unidad_id.set(t.unidad_id ?? null);
                    this.prioridad_id.set(t.prioridad_id ?? null);
                    this.estado_id.set(t.estado_id ?? null);
                },
                error: () => this.errorMsg.set('Error cargando el ticket'),
            });
    }

    cargarSoportes() {
        this.ticketService.getSoportes()
            .subscribe({
                next: (resp: any) => {
                    if (resp?.success) {
                        this.soportes.set(resp.data || []);
                    } else {
                        this.errorMsg.set('Error al obtener los soportes');
                    }
                },
                error: () => this.errorMsg.set('Error al obtener los soportes'),
            });
    }

    asignarSoporte(soporteId: number) {
        const t = this.ticket();
        if (!t) return;

        this.loading.set(true);

        this.ticketService.assignSoporte(t.ticket_id, soporteId)
            .pipe(finalize(() => this.loading.set(false)))
            .subscribe({
                next: (resp: any) => {
                    if (resp?.success) {
                        this.successMsg.set('Soporte asignado correctamente');
                        this.cargar(t.ticket_id);
                    } else {
                        this.errorMsg.set(resp?.message || 'Error al asignar soporte');
                    }
                },
                error: () => this.errorMsg.set('Error al asignar soporte'),
            });
    }

    private safeValue(val: number | null): number | undefined {
        return val == null ? undefined : val;
    }

    guardarCambios() {
        const t = this.ticket();
        if (!t) return;

        this.savingConfig.set(true);
        this.errorMsg.set('');
        this.successMsg.set('');

        const payload = {
            unidad_id: this.safeValue(this.unidad_id()),
            prioridad_id: this.safeValue(this.prioridad_id()),
            estado_id: this.safeValue(this.estado_id()),
        };

        this.ticketService.updateTicket(t.ticket_id, payload)
            .pipe(finalize(() => this.savingConfig.set(false)))
            .subscribe({
                next: (resp: any) => {
                    if (resp?.success) {
                        this.successMsg.set('Cambios guardados correctamente');
                        this.cargar(t.ticket_id);
                    } else {
                        this.errorMsg.set(resp?.message || 'Error al guardar los cambios');
                    }
                },
                error: () => this.errorMsg.set('Error al guardar los cambios'),
            });
    }

    guardarRevision() {
        const t = this.ticket();
        if (!t) return;

        this.loading.set(true);
        this.errorMsg.set('');
        this.successMsg.set('');

        this.ticketService.markReviewed(t.ticket_id)
            .pipe(finalize(() => this.loading.set(false)))
            .subscribe({
                next: (resp: any) => {
                    if (resp?.success) {
                        this.successMsg.set('Revisión finalizada correctamente');
                        this.cargar(t.ticket_id);
                        setTimeout(() => {
                            this.router.navigate(['/admin/tickets-revisados']);
                        }, 800);
                    } else {
                        this.errorMsg.set(resp?.message || 'No se pudo finalizar revisión');
                    }
                },
                error: () => this.errorMsg.set('Error al finalizar revisión'),
            });
    }

    volver() {
        this.router.navigate(['/admin/tickets-sin-revisar']);
    }

    getInicialSoporte(): string {
        const d = this.detalle();

        if (!d || !d.soporte_nombre) return 'S';

        return d.soporte_nombre.charAt(0).toUpperCase();
    }
}

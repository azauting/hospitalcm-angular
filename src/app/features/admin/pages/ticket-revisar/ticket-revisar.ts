import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { FormsModule } from '@angular/forms';
import { TicketService } from '../../../../core/services/ticket/ticket.service';
import { ToastrService } from 'ngx-toastr';

@Component({
    selector: 'app-admin-ticket-revisar',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './ticket-revisar.html',
})
export class AdminTicketRevisarComponent implements OnInit {

    // DATA
    ticket = signal<any | null>(null);
    detalle = signal<any | null>(null);
    soportes = signal<any[]>([]);

    // STATES
    loading = signal(false);
    savingConfig = signal(false);
    
    // FORM CONFIG
    unidad_id = signal<number | null>(null);
    prioridad_id = signal<number | null>(null);
    estado_id = signal<number | null>(null);

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private ticketService: TicketService,
        private toastr: ToastrService
    ) { }

    ngOnInit() {
        const id = Number(this.route.snapshot.paramMap.get('id'));
        if (!id) {
            this.toastr.error('Identificador de ticket inválido', 'Error');
            this.volver();
            return;
        }

        this.cargar(id);
        this.cargarSoportes();
    }

    cargar(id: number) {
        this.loading.set(true);

        this.ticketService.getTicketById(id)
            .pipe(finalize(() => this.loading.set(false)))
            .subscribe({
                next: (resp: any) => {
                    if (!resp?.success) {
                        this.toastr.error(resp?.message || 'No se pudo obtener el ticket', 'Error');
                        return;
                    }

                    const wrapper = resp.data?.ticket;
                    if (!wrapper) return;

                    this.ticket.set(wrapper.ticket);
                    this.detalle.set(wrapper.detalle || null);

                    // Inicializar selects con valores actuales
                    const t = wrapper.ticket;
                    this.unidad_id.set(t.unidad_id ?? null);
                    this.prioridad_id.set(t.prioridad_id ?? null);
                    this.estado_id.set(t.estado_id ?? null);
                },
                error: () => this.toastr.error('Error de conexión cargando datos', 'Error'),
            });
    }

    cargarSoportes() {
        this.ticketService.getSoportes().subscribe({
            next: (resp: any) => {
                if (resp?.success) this.soportes.set(resp.data || []);
            }
        });
    }

    asignarSoporte(soporteId: number) {
        const t = this.ticket();
        if (!t) return;

        // Toast de carga
        const toastId = this.toastr.info('Asignando técnico...', 'Procesando', { disableTimeOut: true }).toastId;

        this.ticketService.assignSoporte(t.ticket_id, soporteId)
            .subscribe({
                next: (resp: any) => {
                    this.toastr.clear(toastId); // Limpiar loading
                    if (resp?.success) {
                        this.toastr.success('Técnico asignado correctamente', 'Éxito');
                        this.cargar(t.ticket_id);
                    } else {
                        this.toastr.error(resp?.message || 'No se pudo asignar', 'Error');
                    }
                },
                error: () => {
                    this.toastr.clear(toastId);
                    this.toastr.error('Error en el servidor al asignar', 'Error');
                }
            });
    }

    guardarCambios() {
        const t = this.ticket();
        if (!t) return;

        this.savingConfig.set(true);
        
        const payload = {
            unidad_id: this.unidad_id() ?? undefined,
            prioridad_id: this.prioridad_id() ?? undefined,
            estado_id: this.estado_id() ?? undefined,
        };

        this.ticketService.updateTicket(t.ticket_id, payload)
            .pipe(finalize(() => this.savingConfig.set(false)))
            .subscribe({
                next: (resp: any) => {
                    if (resp?.success) {
                        this.toastr.success('Clasificación guardada', 'Guardado');
                        this.cargar(t.ticket_id);
                    } else {
                        this.toastr.warning(resp?.message || 'No se pudieron guardar cambios', 'Atención');
                    }
                },
                error: () => this.toastr.error('Error al guardar configuración', 'Error')
            });
    }

    guardarRevision() {
        const t = this.ticket();
        if (!t) return;

        if (!this.detalle()?.soporte_asignado) {
            this.toastr.warning('Te recomendamos asignar un técnico antes de finalizar la revisión, aunque no es obligatorio.', 'Aviso', { timeOut: 5000 });
        }

        const toastId = this.toastr.info('Finalizando revisión...', 'Procesando').toastId;

        this.ticketService.markReviewed(t.ticket_id)
            .subscribe({
                next: (resp: any) => {
                    this.toastr.clear(toastId);
                    if (resp?.success) {
                        this.toastr.success('Ticket movido a bandeja de salida', 'Revisión Completada');
                        // Salir después de un momento
                        setTimeout(() => {
                            this.router.navigate(['/admin/tickets/revisados']);
                        }, 1000);
                    } else {
                        this.toastr.error(resp?.message || 'Fallo al finalizar revisión', 'Error');
                    }
                },
                error: () => {
                    this.toastr.clear(toastId);
                    this.toastr.error('Error de servidor', 'Error');
                }
            });
    }

    volver() {
        this.router.navigate(['/admin/tickets/sin-revisar']);
    }

    getInicialSoporte(): string {
        return this.detalle()?.soporte_nombre?.charAt(0).toUpperCase() || '?';
    }
}
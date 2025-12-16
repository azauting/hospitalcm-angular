import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../../../core/services/user.service';
import { TicketService } from '../../../../core/services/ticket.service';
import { ToastrService } from 'ngx-toastr';

@Component({
    selector: 'app-admin-ticket-review',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './ticket-revisar.html',
})
export class AdminTicketReviewComponent implements OnInit {

    // ============================
    // DATA
    // ============================
    ticket = signal<any | null>(null);
    detail = signal<any | null>(null);
    supportUsers = signal<any[]>([]);

    // ============================
    // STATES
    // ============================
    loading = signal(false);
    savingConfig = signal(false);
    isClassificationSaved = signal(false); // Controls read-only mode

    // ============================
    // FORM SIGNALS
    // ============================
    unidad_id = signal<number | null>(null);
    prioridad_id = signal<number | null>(null);
    estado_id = signal<number | null>(null); 

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private ticketService: TicketService,
        private userService: UserService,
        private toastr: ToastrService
    ) {}

    // ============================
    // INIT
    // ============================
    ngOnInit() {
        const id = Number(this.route.snapshot.paramMap.get('id'));

        if (!id) {
            this.toastr.error('Identificador de ticket inválido', 'Error');
            this.goBack();
            return;
        }

        this.loadTicket(id);
        this.loadSupportUsers();
    }

    // ============================
    // HTML HELPER
    // ============================
    isSaved(): boolean {
        return this.isClassificationSaved();
    }

    // ============================
    // LOAD TICKET
    // ============================
    loadTicket(id: number) {
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
                    this.detail.set(wrapper.detalle || null);

                    const t = wrapper.ticket;

                    // ============================
                    // MAP TEXT → IDs
                    // ============================
                    const mapUnidad: any = { 'soporte técnico': 1, 'infraestructura': 2, 'desarrollo': 3 };
                    const mapPrioridad: any = { 'baja': 1, 'media': 2, 'alta': 3 };
                    const mapEstado: any = { 'abierto': 1, 'en proceso': 2, 'resuelto': 3, 'cerrado': 4 };

                    const uVal = t.unidad?.toLowerCase() || '';
                    const pVal = t.prioridad?.toLowerCase() || '';
                    const eVal = t.estado?.toLowerCase() || '';

                    this.unidad_id.set(mapUnidad[uVal] || null);
                    this.prioridad_id.set(mapPrioridad[pVal] || null);
                    this.estado_id.set(mapEstado[eVal] || null);

                    // ============================
                    // READ-ONLY MODE LOGIC
                    // ============================
                    if (eVal === 'en proceso' || (this.unidad_id() && this.prioridad_id())) {
                        this.isClassificationSaved.set(true);
                    } else {
                        this.isClassificationSaved.set(false);
                    }
                },
                error: () => {
                    this.toastr.error('Error de conexión cargando datos', 'Error');
                },
            });
    }

    // ============================
    // LOAD SUPPORT USERS
    // ============================
    loadSupportUsers() {
        this.userService.getSupportUsers().subscribe({
            next: (resp: any) => {
                if (resp?.success) this.supportUsers.set(resp.data || []);
            }
        });
    }

    // ============================
    // ASSIGN SUPPORT
    // ============================
    assignSupport(supportId: number) {
        const t = this.ticket();
        if (!t) return;

        if (!this.isClassificationSaved()) {
            this.toastr.warning(
                'Debes guardar la clasificación (Unidad y Prioridad) antes de asignar.',
                'Atención'
            );
            return;
        }

        const toastId = this.toastr.info('Asignando técnico...', 'Procesando', {
            disableTimeOut: true,
        }).toastId;

        this.ticketService.assignSupport(t.ticket_id, supportId).subscribe({
            next: (resp: any) => {
                this.toastr.clear(toastId);

                if (resp?.success) {
                    this.toastr.success('Técnico asignado correctamente', 'Éxito');
                    this.loadTicket(t.ticket_id);
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

    // ============================
    // SAVE CLASSIFICATION
    // ============================
    saveClassification() {
        const t = this.ticket();
        if (!t) return;

        if (!this.unidad_id()) {
            this.toastr.warning('Debes seleccionar una Unidad Responsable.', 'Faltan datos');
            return;
        }

        if (!this.prioridad_id()) {
            this.toastr.warning('Debes seleccionar un Nivel de Prioridad.', 'Faltan datos');
            return;
        }

        this.savingConfig.set(true);

        const payload = {
            unidad_id: this.unidad_id()!,
            prioridad_id: this.prioridad_id()!,
            estado_id: this.estado_id()!,
        };

        this.ticketService.updateTicket(t.ticket_id, payload)
            .pipe(finalize(() => this.savingConfig.set(false)))
            .subscribe({
                next: (resp: any) => {
                    if (resp?.success) {
                        this.toastr.success('Clasificación guardada correctamente', 'Guardado');
                        this.isClassificationSaved.set(true);
                    } else {
                        this.toastr.warning(resp?.message || 'No se pudieron guardar cambios', 'Atención');
                    }
                },
                error: () => {
                    this.toastr.error('Error al guardar configuración', 'Error');
                }
            });
    }

    // ============================
    // FINALIZE REVIEW
    // ============================
    finalizeReview() {
        const t = this.ticket();
        if (!t) return;

        if (!this.isClassificationSaved()) {
            this.toastr.error('Debes clasificar el ticket antes de finalizar.', 'Error');
            return;
        }

        if (!this.detail()?.soporte_asignado) {
            this.toastr.warning(
                'Recomendación: asignar un técnico antes de finalizar (opcional).',
                'Aviso',
                { timeOut: 5000 }
            );
        }

        const toastId = this.toastr.info('Finalizando revisión...', 'Procesando').toastId;

        this.ticketService.markReviewed(t.ticket_id).subscribe({
            next: (resp: any) => {
                this.toastr.clear(toastId);

                if (resp?.success) {
                    this.toastr.success('Ticket movido a bandeja de salida', 'Revisión Completada');

                    setTimeout(() => {
                        this.router.navigate(['/admin/tickets/revisados']);
                    }, 900);
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

    // ============================
    // UTILS
    // ============================
    getSupportInitial(): string {
        return this.detail()?.soporte_nombre?.charAt(0).toUpperCase() || '?';
    }

    goBack() {
        this.router.navigate(['/admin/tickets/sin-revisar']);
    }
}

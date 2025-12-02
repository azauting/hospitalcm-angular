import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { FormsModule } from '@angular/forms';
import { TicketService } from '../../../core/services/ticket.service';
import { UserService } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
    selector: 'app-ticket-detail-staff',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './ticket-detalle-staff.html',
})
export class TicketDetailStaff implements OnInit {

    // Signals
    ticket = signal<any>(null);
    detail = signal<any>(null);
    observations = signal<any[]>([]);
    members = signal<any[]>([]);

    // UI States
    loading = signal(false);
    loadingAction = signal(false);
    errorMsg = signal('');
    successMsg = signal('');

    // Form input signals
    response = signal('');
    newObservation = signal('');

    // Current user
    currentUser: any;

    // Integrantes modal
    showMembersModal = signal(false);
    availableSupports = signal<any[]>([]);

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private ticketService: TicketService,
        private userService: UserService,
        private authService: AuthService
    ) { }

    ngOnInit() {
        const id = Number(this.route.snapshot.paramMap.get('id'));
        if (!id) {
            this.errorMsg.set('ID de ticket inválido');
            return;
        }

        this.resolveUserAndLoadTicket(id);
    }

    // Get user first, then load ticket
    private resolveUserAndLoadTicket(ticketId: number) {
        const user = this.authService.getUser();

        if (user) {
            this.currentUser = user;
            this.loadTicketData(ticketId);
        } else {
            this.loading.set(true);
            this.authService.getMe()
                .pipe(finalize(() => this.loading.set(false)))
                .subscribe({
                    next: (resp: any) => {
                        if (resp?.success && resp.data?.user) {
                            this.currentUser = resp.data.user;
                            this.authService.setUser(this.currentUser);
                            this.loadTicketData(ticketId);
                        } else {
                            this.errorMsg.set('Error de autenticación');
                        }
                    },
                    error: () => this.errorMsg.set('Error obteniendo sesión')
                });
        }
    }

    loadTicketData(id: number) {
        this.loading.set(true);
        this.resetMessages();

        this.ticketService.getTicketById(id)
            .pipe(finalize(() => this.loading.set(false)))
            .subscribe({
                next: (resp: any) => {
                    if (!resp?.success) {
                        this.errorMsg.set(resp?.message || 'Error al cargar ticket');
                        return;
                    }

                    const data = resp.data?.ticket;
                    this.ticket.set(data?.ticket || null);
                    this.detail.set(data?.detalle || null);
                    this.observations.set(data?.observaciones || []);
                    this.members.set(data?.integrantes || []);
                },
                error: () => this.errorMsg.set('Error de conexión con el servidor')
            });
    }

    // --- Ticket Actions ---

    assignToSelf() {
        const t = this.ticket();
        if (!t) return;

        this.loadingAction.set(true);

        this.ticketService.assignTicketToSelf(t.ticket_id, this.currentUser.usuario_id)
            .pipe(finalize(() => this.loadingAction.set(false)))
            .subscribe({
                next: (resp: any) => {
                    if (resp?.success) {
                        this.showSuccess('Ticket asignado exitosamente');
                        this.loadTicketData(t.ticket_id);
                    } else {
                        this.errorMsg.set(resp?.message);
                    }
                },
                error: () => this.errorMsg.set('Error al asignar ticket')
            });
    }

    closeTicket() {
        const t = this.ticket();
        if (!t) return;

        if (!this.response().trim()) {
            this.errorMsg.set('Es obligatoria una respuesta de resolución para cerrar el ticket.');
            return;
        }

        if (!confirm('¿Estás seguro de cerrar este ticket? Esta acción notificará al usuario.')) return;

        this.loadingAction.set(true);

        this.ticketService.closeTicket(t.ticket_id, this.response())
            .pipe(finalize(() => this.loadingAction.set(false)))
            .subscribe({
                next: (resp: any) => {
                    if (resp?.success) {
                        this.goBack();
                    } else {
                        this.errorMsg.set(resp?.message);
                    }
                },
                error: () => this.errorMsg.set('Error al cerrar el ticket')
            });
    }

    addObservation() {
        const t = this.ticket();
        const obs = this.newObservation().trim();
        if (!t || !obs) return;

        this.loadingAction.set(true);

        this.ticketService.addObservation(t.ticket_id, obs)
            .pipe(finalize(() => this.loadingAction.set(false)))
            .subscribe({
                next: (resp: any) => {
                    if (resp?.success) {
                        this.newObservation.set('');
                        this.loadTicketData(t.ticket_id);
                    }
                },
                error: () => this.errorMsg.set('Error al guardar observación')
            });
    }

    // --- Member Management ---

    openMembersModal() {
        this.showMembersModal.set(true);

        if (this.availableSupports().length === 0) {
            this.userService.getSupportUsers().subscribe((resp: any) => {
                if (resp?.success) this.availableSupports.set(resp.data || []);
            });
        }
    }

    addMember(soporteId: number) {
        const t = this.ticket();
        if (!t) return;

        this.ticketService.addMember(t.ticket_id, soporteId).subscribe((resp: any) => {
            if (resp?.success) {
                this.loadTicketData(t.ticket_id);
                this.showMembersModal.set(false);
            }
        });
    }

    // --- Helpers ---

    goBack() {
        const route = this.currentUser?.rol === 'soporte'
            ? '/soporte'
            : '/admin/tickets/revisados';

        this.router.navigate([route]);
    }

    resetMessages() {
        this.errorMsg.set('');
        this.successMsg.set('');
    }

    showSuccess(msg: string) {
        this.successMsg.set(msg);
        setTimeout(() => this.successMsg.set(''), 4000);
    }

    getStatusClass(estado: string): string {
        const map: any = {
            'abierto': 'bg-blue-100 text-blue-800 ring-blue-600/20',
            'en proceso': 'bg-amber-100 text-amber-800 ring-amber-600/20',
            'en pausa': 'bg-gray-100 text-gray-800 ring-gray-600/20',
            'cancelado': 'bg-red-100 text-red-800 ring-red-600/20',
            'cerrado': 'bg-emerald-100 text-emerald-800 ring-emerald-600/20'
        };
        return `ring-1 ring-inset ${map[estado] || 'bg-gray-50 text-gray-600'}`;
    }

    getPriorityClass(prioridad: string): string {
        const map: any = {
            'alta': 'text-red-700 bg-red-50 ring-red-600/10',
            'media': 'text-yellow-800 bg-yellow-50 ring-yellow-600/20',
            'baja': 'text-green-700 bg-green-50 ring-green-600/20'
        };
        return `ring-1 ring-inset ${map[prioridad] || 'text-gray-600 bg-gray-50'}`;
    }
}

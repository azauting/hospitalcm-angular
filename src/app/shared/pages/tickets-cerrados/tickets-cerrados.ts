import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { TicketService } from '../../../core/services/ticket.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
    selector: 'app-tickets-cerrados',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './tickets-cerrados.html'
})
export class TicketsCerradosComponent implements OnInit {

    // ============================
    // DATA & STATE
    // ============================
    tickets = signal<any[]>([]);
    loading = signal(false);
    errorMsg = signal('');

    currentDate = signal(new Date());

    // ============================
    // PAGINATION
    // ============================
    currentPage = 1;
    itemsPerPage = 10;
    totalTickets = 0;

    // ============================
    // FILTERS
    // ============================
    filterSearch = '';
    filterOrigin = 'todos';
    filterEvent = 'todos';
    filterDateFrom = '';
    filterDateTo = '';

    // USER
    user: any;

    constructor(
        private ticketService: TicketService,
        private authService: AuthService,
        private router: Router
    ) { }

    ngOnInit() {
        this.loadUser();
        this.loadTickets();

        // Clock update
        setInterval(() => this.currentDate.set(new Date()), 1000);
    }

    // ============================
    // DATA LOADING
    // ============================
    loadUser() {
        const rawUser = this.authService.getUser();
        if (rawUser && rawUser.data && rawUser.data.user) {
            this.user = rawUser.data.user;
        } else {
            this.user = rawUser;
        }
    }

    loadTickets() {
        this.loading.set(true);
        this.errorMsg.set('');

        this.ticketService.getClosedTickets()
            .pipe(finalize(() => this.loading.set(false)))
            .subscribe({
                next: (resp: any) => {
                    if (resp?.success) {
                        const data = resp.data?.tickets || [];

                        // Sort descending (Newest first)
                        data.sort((a: any, b: any) =>
                            new Date(b.fecha_creacion).getTime() - new Date(a.fecha_creacion).getTime()
                        );

                        this.tickets.set(data);
                        this.totalTickets = data.length;
                    } else {
                        this.errorMsg.set(resp?.message || 'No se pudieron cargar los tickets.');
                    }
                },
                error: (err: any) => {
                    // Capture backend error message
                    const msg = err.error?.message || 'Error de conexión con el servidor.';
                    this.errorMsg.set(msg);
                    console.error('API Error:', err);
                }
            });
    }

    // ============================
    // ACTIONS
    // ============================
    viewDetail(ticket_id: number): void {
        if (!this.user) this.loadUser();

        const role = this.user?.nombre_rol || this.user?.rol || '';

        if (!role) {
            console.error('No se pudo determinar el rol del usuario');
            return;
        }

        if (role === 'administrador') {
            this.router.navigate(['/admin/ticket', ticket_id]);
        } else {
            this.router.navigate(['/soporte/ticket', ticket_id]);
        }
    }

    // ============================
    // FILTER LOGIC
    // ============================
    getFilteredTickets() {
        const search = this.filterSearch.toLowerCase().trim();
        const origin = this.filterOrigin.toLowerCase();
        const event = this.filterEvent.toLowerCase();

        return this.tickets().filter(t => {
            // 1. Search (ID, Subject, User)
            const matchSearch = !search ||
                t.ticket_id.toString().includes(search) ||
                (t.asunto && t.asunto.toLowerCase().includes(search)) ||
                (t.usuario_nombre && t.usuario_nombre.toLowerCase().includes(search));

            // 2. Origin
            const matchOrigin = origin === 'todos' || (t.origen && t.origen.toLowerCase() === origin);

            // 3. Event
            const matchEvent = event === 'todos' || (t.evento && t.evento.toLowerCase() === event);

            // 4. Dates
            const ticketDate = new Date(t.fecha_creacion);
            const matchFrom = !this.filterDateFrom || ticketDate >= new Date(this.filterDateFrom);

            // Include the whole end day
            const matchTo = !this.filterDateTo || ticketDate <= new Date(this.filterDateTo + 'T23:59:59');

            return matchSearch && matchOrigin && matchEvent && matchFrom && matchTo;
        });
    }

    resetFilters() {
        this.filterSearch = '';
        this.filterOrigin = 'todos';
        this.filterEvent = 'todos';
        this.filterDateFrom = '';
        this.filterDateTo = '';
        this.currentPage = 1;
    }

    // Event Handlers for HTML (Updates signals/vars and resets pagination)
    onFilterSearchChange(val: string) { this.filterSearch = val; this.currentPage = 1; }
    onFilterOriginChange(val: string) { this.filterOrigin = val; this.currentPage = 1; }
    onFilterEventoChange(val: string) { this.filterEvent = val; this.currentPage = 1; }
    onFiltroFechaDesdeChange(val: string) { this.filterDateFrom = val; this.currentPage = 1; }
    onFiltroFechaHastaChange(val: string) { this.filterDateTo = val; this.currentPage = 1; }

    // ============================
    // PAGINATION
    // ============================
    getPaginatedTickets() {
        const filtered = this.getFilteredTickets();
        // Update total based on current filters for pagination calculation
        const totalFiltered = filtered.length;

        // Reset page if out of bounds
        if (this.currentPage > Math.ceil(totalFiltered / this.itemsPerPage) && this.currentPage > 1) {
            this.currentPage = 1;
        }

        const start = (this.currentPage - 1) * this.itemsPerPage;
        return filtered.slice(start, start + this.itemsPerPage);
    }

    get totalPages(): number {
        return Math.ceil(this.getFilteredTickets().length / this.itemsPerPage) || 1;
    }

    getPageNumbers(): number[] {
        const pages: number[] = [];
        const total = this.totalPages;
        const current = this.currentPage;

        if (total <= 7) {
            for (let i = 1; i <= total; i++) pages.push(i);
        } else {
            if (current <= 4) {
                pages.push(1, 2, 3, 4, 5, -1, total);
            } else if (current >= total - 3) {
                pages.push(1, -1, total - 4, total - 3, total - 2, total - 1, total);
            } else {
                pages.push(1, -1, current - 1, current, current + 1, -1, total);
            }
        }
        return pages;
    }

    nextPage() {
        if (this.currentPage < this.totalPages) this.currentPage++;
    }

    previousPage() {
        if (this.currentPage > 1) this.currentPage--;
    }

    goToPage(page: number) {
        if (page !== -1 && page >= 1 && page <= this.totalPages) {
            this.currentPage = page;
        }
    }

    onItemsPerPageChange(event: any) {
        this.itemsPerPage = Number(event.target.value);
        this.currentPage = 1;
    }

    // Helpers
    getStartIndex(): number {
        return (this.currentPage - 1) * this.itemsPerPage;
    }

    getEndIndex(): number {
        const total = this.getFilteredTickets().length;
        return Math.min(this.currentPage * this.itemsPerPage, total);
    }

    trackByTicketId(index: number, ticket: any): number {
        return ticket.ticket_id;
    }

    getStatusClass(estado: string) {
        if (!estado) return 'bg-slate-100 text-slate-600 border-slate-200';
        const e = estado.toLowerCase();
        if (e === 'abierto') return 'bg-blue-50 text-blue-700 border-blue-200';
        if (e.includes('proceso')) return 'bg-indigo-50 text-indigo-700 border-indigo-200';
        if (e === 'cerrado') return 'bg-green-50 text-green-700 border-green-200';
        if (e === 'cancelado') return 'bg-red-50 text-red-700 border-red-200';
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
}
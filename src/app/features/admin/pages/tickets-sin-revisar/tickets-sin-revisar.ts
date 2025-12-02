import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { TicketService } from '../../../../core/services/ticket.service';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-admin-tickets-unreviewed',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './tickets-sin-revisar.html',
})
export class AdminTicketsUnreviewedComponent implements OnInit {

    // =========================================
    // Reactive signals (real reactive state)
    // =========================================
    tickets = signal<any[]>([]);
    loading = signal<boolean>(false);
    errorMsg = signal<string>('');
    currentDate = signal(new Date());

    // =========================================
    // Regular properties (for ngModel binding)
    // =========================================
    filterSearch = '';
    filterOrigin = 'todos';
    filterEvent = 'todos';
    filterDateFrom = '';
    filterDateTo = '';

    // Mirror reactive signals (proper reactive state)
    _filterSearch = signal('');
    _filterOrigin = signal('todos');
    _filterEvent = signal('todos');
    _filterDateFrom = signal('');
    _filterDateTo = signal('');

    // =========================================
    // Pagination
    // =========================================
    currentPage = 1;
    itemsPerPage = 10;
    totalTickets = 0;

    constructor(
        private ticketService: TicketService,
        private router: Router,
    ) {}

    ngOnInit() {
        this.loadTickets();

        // Timer to refresh clock UI
        setInterval(() => this.currentDate.set(new Date()), 1000);
    }

    // =========================================
    // Load initial tickets
    // =========================================
    loadTickets() {
        this.loading.set(true);
        this.errorMsg.set('');

        this.ticketService.getUnreviewedTickets()
            .pipe(finalize(() => this.loading.set(false)))
            .subscribe({
                next: (resp: any) => {
                    if (resp?.success) {
                        const data = resp.data?.tickets ?? resp.data?.tickets_sin_revisar ?? [];
                        this.tickets.set(data);
                        this.totalTickets = data.length;
                    } else {
                        this.errorMsg.set(resp?.message || 'No se pudieron cargar los tickets.');
                    }
                },
                error: () => {
                    this.errorMsg.set('Error de conexión al cargar tickets.');
                }
            });
    }

    // =========================================
    // ngModel handlers → signals
    // =========================================
    onFilterSearchChange(v: string) { this.filterSearch = v; this._filterSearch.set(v); }
    onFilterOriginChange(v: string) { this.filterOrigin = v; this._filterOrigin.set(v); }
    onFilterEventChange(v: string) { this.filterEvent = v; this._filterEvent.set(v); }
    onFilterDateFromChange(v: string) { this.filterDateFrom = v; this._filterDateFrom.set(v); }
    onFilterDateToChange(v: string) { this.filterDateTo = v; this._filterDateTo.set(v); }

    // =========================================
    // Filtering + pagination logic
    // =========================================
    getFilteredTickets() {
        const search = this._filterSearch().toLowerCase().trim();

        return this.tickets().filter(t => {
            const matchSearch =
                !search ||
                t.asunto.toLowerCase().includes(search) ||
                t.usuario_nombre.toLowerCase().includes(search) ||
                t.ticket_id.toString().includes(search);

            const matchOrigin =
                this._filterOrigin() === 'todos' ||
                t.origen?.toLowerCase() === this._filterOrigin();

            const matchEvent =
                this._filterEvent() === 'todos' ||
                t.evento?.toLowerCase() === this._filterEvent();

            const ticketDate = new Date(t.fecha_creacion);

            const matchFrom =
                !this._filterDateFrom() ||
                ticketDate >= new Date(this._filterDateFrom());

            const matchTo =
                !this._filterDateTo() ||
                ticketDate <= new Date(this._filterDateTo() + 'T23:59:59');

            return matchSearch && matchOrigin && matchEvent && matchFrom && matchTo;
        });
    }

    getPaginatedTickets() {
        const filtered = this.getFilteredTickets();
        this.totalTickets = filtered.length;

        const start = (this.currentPage - 1) * this.itemsPerPage;
        return filtered.slice(start, start + this.itemsPerPage);
    }

    resetFilters() {
        this.filterSearch = '';
        this.filterOrigin = 'todos';
        this.filterEvent = 'todos';
        this.filterDateFrom = '';
        this.filterDateTo = '';

        this._filterSearch.set('');
        this._filterOrigin.set('todos');
        this._filterEvent.set('todos');
        this._filterDateFrom.set('');
        this._filterDateTo.set('');

        this.currentPage = 1;
    }

    // TrackBy performance helper
    trackByTicketId(index: number, ticket: any) {
        return ticket.ticket_id;
    }

    // ===============================
    // Pagination UI helpers
    // ===============================
    get totalPages() {
        return Math.ceil(this.totalTickets / this.itemsPerPage) || 1;
    }

    previousPage() { if (this.currentPage > 1) this.currentPage--; }
    nextPage() { if (this.currentPage < this.totalPages) this.currentPage++; }

    goToPage(page: number) {
        if (page !== -1 && page >= 1 && page <= this.totalPages) {
            this.currentPage = page;
        }
    }

    getPageNumbers() {
        const pages: number[] = [];
        const total = this.totalPages;
        const current = this.currentPage;

        if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

        if (current <= 4)
            return [1, 2, 3, 4, 5, -1, total];

        if (current >= total - 3)
            return [1, -1, total - 4, total - 3, total - 2, total - 1, total];

        return [1, -1, current - 1, current, current + 1, -1, total];
    }

    onItemsPerPageChange(event: any) {
        this.itemsPerPage = Number(event.target.value);
        this.currentPage = 1;
    }

    viewDetail(ticket_id: number) {
        this.router.navigate([`/admin/ticket/${ticket_id}/sin-revisar`]);
    }
}

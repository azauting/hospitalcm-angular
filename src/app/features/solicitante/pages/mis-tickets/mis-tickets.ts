import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TicketService } from '../../../../core/services/ticket.service';
import { finalize } from 'rxjs';

@Component({
    selector: 'app-my-tickets',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './mis-tickets.html',
})
export class MyTicketsComponent implements OnInit {

    // --- DATA ---
    tickets = signal<any[]>([]);           
    filteredTickets = signal<any[]>([]);

    // --- UI STATES ---
    loading = signal(false);
    errorMsg = signal('');

    // --- FILTERS (Signals) ---
    filterText = signal('');
    filterStartDate = signal('');
    filterEndDate = signal('');

    // --- PAGINATION ---
    currentPage = 1;
    itemsPerPage = 10;
    totalPages = 1;

    // --- UTILITIES ---
    Math = Math;

    constructor(
        private ticketService: TicketService,
        private router: Router
    ) {}

    ngOnInit() {
        this.loadMyTickets();
    }

    // =============================================================
    // LOAD DATA
    // =============================================================
    loadMyTickets() {
        this.loading.set(true);
        this.errorMsg.set('');

        this.ticketService.getMyTickets()
            .pipe(finalize(() => this.loading.set(false)))
            .subscribe({
                next: (resp: any) => {
                    if (resp?.success) {
                        const data = resp.data?.tickets ?? [];

                        // Sort newest → oldest
                        data.sort(
                            (a: any, b: any) =>
                                new Date(b.fecha_creacion).getTime() -
                                new Date(a.fecha_creacion).getTime()
                        );

                        this.tickets.set(data);
                        this.applyFilters();
                    } else {
                        this.errorMsg.set(resp?.message || 'No se pudieron obtener tus tickets');
                    }
                },
                error: () => this.errorMsg.set('Error de conexión al obtener tus tickets')
            });
    }

    // =============================================================
    // FILTER LOGIC
    // =============================================================
    applyFilters() {
        let result = [...this.tickets()];

        const text = this.filterText().toLowerCase().trim();
        const start = this.filterStartDate() ? new Date(this.filterStartDate()) : null;
        const end = this.filterEndDate() ? new Date(this.filterEndDate()) : null;

        // Include full day for end date
        if (end) end.setHours(23, 59, 59);

        // 1. Filter by text
        if (text) {
            result = result.filter(t =>
                t.asunto.toLowerCase().includes(text) ||
                t.ticket_id.toString().includes(text) ||
                t.estado.toLowerCase().includes(text)
            );
        }

        // 2. Filter by date range
        if (start || end) {
            result = result.filter(t => {
                const ticketDate = new Date(t.fecha_creacion);
                if (start && ticketDate < start) return false;
                if (end && ticketDate > end) return false;
                return true;
            });
        }

        this.filteredTickets.set(result);

        // Reset pagination
        this.calculateTotalPages();
        this.currentPage = 1;
    }

    clearFilters() {
        this.filterText.set('');
        this.filterStartDate.set('');
        this.filterEndDate.set('');
        this.applyFilters();
    }

    // =============================================================
    // PAGINATION LOGIC
    // =============================================================
    calculateTotalPages() {
        this.totalPages = Math.ceil(this.filteredTickets().length / this.itemsPerPage) || 1;
    }

    getPaginatedTickets(): any[] {
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        return this.filteredTickets().slice(startIndex, endIndex);
    }

    goToPage(page: number): void {
        if (page >= 1 && page <= this.totalPages) {
            this.currentPage = page;
        }
    }

    previousPage(): void {
        this.goToPage(this.currentPage - 1);
    }

    nextPage(): void {
        this.goToPage(this.currentPage + 1);
    }

    getPageNumbers(): number[] {
        return Array.from({ length: this.totalPages }, (_, i) => i + 1);
    }

    // =============================================================
    // UI HELPERS & NAVIGATION
    // =============================================================
    viewDetail(ticketId: number): void {
        this.router.navigate(['/inicio/ticket', ticketId]);
    }

    createTicket() {
        this.router.navigate(['/inicio/crear-ticket']);
    }

    // Badge background/text class
    getStatusClass(status: string): string {
        const map: any = {
            'abierto': 'bg-blue-50 text-blue-700 border-blue-200',
            'nuevo': 'bg-blue-50 text-blue-700 border-blue-200',
            'en proceso': 'bg-amber-50 text-amber-700 border-amber-200',
            'cerrado': 'bg-emerald-50 text-emerald-700 border-emerald-200',
            'resuelto': 'bg-emerald-50 text-emerald-700 border-emerald-200',
            'cancelado': 'bg-red-50 text-red-700 border-red-200'
        };
        return map[status.toLowerCase()] || 'bg-slate-50 text-slate-700 border-slate-200';
    }

    // Dot color class inside badge
    getStatusDotClass(status: string): string {
        const map: any = {
            'abierto': 'bg-blue-500',
            'nuevo': 'bg-blue-500',
            'en proceso': 'bg-amber-500',
            'cerrado': 'bg-emerald-500',
            'resuelto': 'bg-emerald-500',
            'cancelado': 'bg-red-500'
        };
        return map[status.toLowerCase()] || 'bg-slate-500';
    }
}

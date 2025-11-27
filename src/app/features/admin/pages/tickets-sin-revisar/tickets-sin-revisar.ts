import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { TicketService } from '../../../../core/services/ticket/ticket.service';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-admin-tickets-sin-revisar',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './tickets-sin-revisar.html',
})
export class AdminTicketsSinRevisarComponent implements OnInit {

    // Signals
    tickets = signal<any[]>([]);
    loading = signal<boolean>(false);
    errorMsg = signal<string>('');

    // Paginación
    currentPage = 1;
    itemsPerPage = 10;
    totalTickets = 0;

    // Filtros
    filtroBusqueda: string = '';
    filtroOrigen: string = 'todos';
    filtroEvento: string = 'todos';
    filtroFechaDesde: string = '';
    filtroFechaHasta: string = '';

    constructor(
        private ticketService: TicketService,
        private router: Router,
    ) { }

    ngOnInit() {
        this.cargarTickets();
    }

    get fechaActual(): Date {
        return new Date();
    }

    cargarTickets() {
        this.loading.set(true);
        this.errorMsg.set('');
        
        this.ticketService.getTicketsSinRevisar()
            .pipe(finalize(() => this.loading.set(false)))
            .subscribe({
                next: (resp: any) => {
                    if (resp?.success) {
                        // Soporta ambas estructuras de respuesta por si acaso
                        const data = resp.data?.tickets ?? resp.data?.tickets_sin_revisar ?? [];
                        this.tickets.set(data);
                        // El totalTickets se actualizará dinámicamente según el filtro
                    } else {
                        this.errorMsg.set(resp?.message || 'No se pudieron cargar los tickets.');
                    }
                },
                error: () => {
                    this.errorMsg.set('Error de conexión al cargar tickets.');
                }
            });
    }

    verDetalle(ticket_id: number): void {
        this.router.navigate([`/admin/ticket/${ticket_id}/sin-revisar`]);
    }

    // =========================================================
    // LÓGICA DE FILTRADO Y PAGINACIÓN
    // =========================================================

    getFilteredTickets() {
        const search = this.filtroBusqueda.toLowerCase().trim();

        return this.tickets().filter(t => {

            // 1. Búsqueda Texto
            const matchSearch =
                !search ||
                t.asunto.toLowerCase().includes(search) ||
                t.usuario_nombre.toLowerCase().includes(search) ||
                t.ticket_id.toString().includes(search);

            // 2. Origen
            const matchOrigen =
                this.filtroOrigen === 'todos' ||
                t.origen?.toLowerCase() === this.filtroOrigen;

            // 3. Evento
            const matchEvento =
                this.filtroEvento === 'todos' ||
                t.evento?.toLowerCase() === this.filtroEvento;

            // 4. Fechas
            const fechaTicket = new Date(t.fecha_creacion);
            
            const matchDesde = !this.filtroFechaDesde || 
                fechaTicket >= new Date(this.filtroFechaDesde);

            const matchHasta = !this.filtroFechaHasta || 
                fechaTicket <= new Date(this.filtroFechaHasta + 'T23:59:59');

            return matchSearch && matchOrigen && matchEvento && matchDesde && matchHasta;
        });
    }

    getPaginatedTickets() {
        const filtered = this.getFilteredTickets();
        this.totalTickets = filtered.length; // Actualizar total para la UI

        const start = (this.currentPage - 1) * this.itemsPerPage;
        return filtered.slice(start, start + this.itemsPerPage);
    }

    resetFiltros() {
        this.filtroBusqueda = '';
        this.filtroOrigen = 'todos';
        this.filtroEvento = 'todos';
        this.filtroFechaDesde = '';
        this.filtroFechaHasta = '';
        this.currentPage = 1;
    }

    // Optimizador para ngFor
    trackByTicketId(index: number, ticket: any): number {
        return ticket.ticket_id;
    }

    // =========================================================
    // PAGINACIÓN UI
    // =========================================================

    get totalPages(): number {
        return Math.ceil(this.totalTickets / this.itemsPerPage) || 1;
    }

    previousPage(): void {
        if (this.currentPage > 1) this.currentPage--;
    }

    nextPage(): void {
        if (this.currentPage < this.totalPages) this.currentPage++;
    }

    goToPage(page: number): void {
        if (page !== -1 && page >= 1 && page <= this.totalPages) {
            this.currentPage = page;
        }
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

    onItemsPerPageChange(event: any): void {
        this.itemsPerPage = Number(event.target.value);
        this.currentPage = 1;
    }
}
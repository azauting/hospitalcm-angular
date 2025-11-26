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

    tickets = signal<any[]>([]);
    loading = signal<boolean>(false);
    errorMsg = signal<string>('');
    modalVisible = signal(false);

    // Propiedades para la paginación
    currentPage = 1;
    itemsPerPage = 10;
    totalTickets = 0;
    // busqueda
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

    cargarTickets() {
        this.loading.set(true);
        this.errorMsg.set('');
        this.tickets.set([]);

        this.ticketService.getTicketsSinRevisar()
            .pipe(finalize(() => this.loading.set(false)))
            .subscribe({
                next: (resp: any) => {
                    console.log('Tickets sin revisar:', resp);

                    if (resp?.success) {
                        const ticketsData = resp.data?.tickets ?? resp.data?.tickets_sin_revisar ?? [];
                        this.tickets.set(ticketsData);
                        this.totalTickets = ticketsData.length; // ✅ Actualizar totalTickets
                    } else {
                        this.errorMsg.set(resp?.message || 'No se pudieron obtener los tickets sin revisar');
                    }
                },
                error: () => {
                    this.errorMsg.set('Error al obtener los tickets sin revisar');
                }
            });
    }

    verDetalle(ticket_id: number): void {
        this.router.navigate([`/admin/ticket/${ticket_id}/sin-revisar`]);
    }
    getFilteredTickets() {
        const search = this.filtroBusqueda.toLowerCase();

        return this.tickets().filter(t => {

            // 🔍 BUSQUEDA GENERAL
            const matchSearch =
                t.asunto.toLowerCase().includes(search) ||
                t.usuario_nombre.toLowerCase().includes(search) ||
                t.origen.toLowerCase().includes(search) ||
                t.evento.toLowerCase().includes(search);

            const matchOrigen =
                this.filtroOrigen === 'todos' ||
                t.origen.toLowerCase() === this.filtroOrigen;

            const matchEvento =
                this.filtroEvento === 'todos' ||
                t.evento.toLowerCase() === this.filtroEvento;

            const fecha = new Date(t.fecha_creacion);

            // Desde
            const matchFechaDesde =
                !this.filtroFechaDesde ||
                fecha >= new Date(this.filtroFechaDesde);

            // Hasta
            const matchFechaHasta =
                !this.filtroFechaHasta ||
                fecha <= new Date(this.filtroFechaHasta + 'T23:59:59');

            return matchSearch && matchOrigen && matchEvento && matchFechaDesde && matchFechaHasta;
        });
    }

    // Computed properties
    get totalPages(): number {
        return Math.ceil(this.totalTickets / this.itemsPerPage);
    }

    getPaginatedTickets() {
        const filtered = this.getFilteredTickets();
        this.totalTickets = filtered.length;

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

    getStartIndex(): number {
        return (this.currentPage - 1) * this.itemsPerPage;
    }

    getEndIndex(): number {
        return Math.min(this.currentPage * this.itemsPerPage, this.totalTickets);
    }

    // Métodos de navegación
    previousPage(): void {
        if (this.currentPage > 1) {
            this.currentPage--;
        }
    }

    nextPage(): void {
        if (this.currentPage < this.totalPages) {
            this.currentPage++;
        }
    }

    goToPage(page: number): void {
        if (page >= 1 && page <= this.totalPages) {
            this.currentPage = page;
        }
    }

    // Generar números de página para el paginador
    getPageNumbers(): number[] {
        const pages: number[] = [];
        const maxVisiblePages = 7;

        if (this.totalPages <= maxVisiblePages) {
            // Mostrar todas las páginas
            for (let i = 1; i <= this.totalPages; i++) {
                pages.push(i);
            }
        } else {
            // Lógica para mostrar páginas con ellipsis
            if (this.currentPage <= 4) {
                // Primeras páginas
                for (let i = 1; i <= 5; i++) {
                    pages.push(i);
                }
                pages.push(-1); // -1 representa los puntos suspensivos
                pages.push(this.totalPages);
            } else if (this.currentPage >= this.totalPages - 3) {
                // Últimas páginas
                pages.push(1);
                pages.push(-1);
                for (let i = this.totalPages - 4; i <= this.totalPages; i++) {
                    pages.push(i);
                }
            } else {
                // Páginas intermedias
                pages.push(1);
                pages.push(-1);
                for (let i = this.currentPage - 1; i <= this.currentPage + 1; i++) {
                    pages.push(i);
                }
                pages.push(-1);
                pages.push(this.totalPages);
            }
        }

        return pages;
    }

    // Clase CSS para los botones de página
    getPageButtonClass(page: number): string {
        const baseClass = 'px-3 py-2 text-sm font-medium rounded-lg transition-colors min-w-[40px]';

        if (page === -1) {
            return `${baseClass} text-slate-500 cursor-default`;
        }

        if (page === this.currentPage) {
            return `${baseClass} bg-blue-600 text-white hover:bg-blue-700`;
        }

        return `${baseClass} text-slate-700 bg-white border border-slate-300 hover:bg-slate-50`;
    }

    // Cambiar items por página
    onItemsPerPageChange(event: any): void {
        this.itemsPerPage = parseInt(event.target.value, 10);
        this.currentPage = 1; // Volver a la primera página
    }

    // Getter para la fecha actual
    get fechaActual(): Date {
        return new Date();
    }
}
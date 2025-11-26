import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs/operators';
import { Router } from '@angular/router';
import { TicketService } from '../../../../core/services/ticket/ticket.service';

@Component({
    selector: 'app-mis-tickets',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './mis-tickets.html',
})
export class MisTicketsComponent implements OnInit {

    tickets = signal<any[]>([]);
    loading = signal<boolean>(false);
    errorMsg = signal<string>('');

    // Propiedades para la paginación
    currentPage = 1;
    itemsPerPage = 5;
    totalTickets = 0;

    constructor(
        private ticketService: TicketService,
        private router: Router
    ) { }

    ngOnInit() {
        this.cargarMisTickets();
    }

    cargarMisTickets() {
        this.loading.set(true);
        this.errorMsg.set('');
        this.tickets.set([]);

        this.ticketService.getMisTickets()
            .pipe(finalize(() => this.loading.set(false)))
            .subscribe({
                next: (resp: any) => {
                    console.log('Respuesta /api/tickets/mis-tickets:', resp);

                    if (resp?.success) {
                        const ticketsData = resp.data?.tickets ?? [];
                        this.tickets.set(ticketsData);
                        this.totalTickets = ticketsData.length; // ← ACTUALIZAR totalTickets
                    } else {
                        this.errorMsg.set(resp?.message || 'No se pudieron obtener tus tickets');
                    }
                },
                error: () => {
                    this.errorMsg.set('Error al obtener tus tickets');
                }
            });
    }

    verDetalle(ticketId: number): void {
        // Navegar a la página de detalle del ticket
        this.router.navigate(['/inicio/ticket', ticketId]);
    }

    // Método para contar tickets por estado
    getTicketsByStatus(status: string): number {
        return this.tickets().filter(t => t.estado === status).length;
    }

    // Computed properties
    get totalPages(): number {
        return Math.ceil(this.totalTickets / this.itemsPerPage);
    }

    getPaginatedTickets(): any[] {
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        return this.tickets().slice(startIndex, endIndex);
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
}
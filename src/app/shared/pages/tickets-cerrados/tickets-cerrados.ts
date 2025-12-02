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

    fechaActual = signal(new Date());

    // ============================
    // PAGINACIÓN
    // ============================
    currentPage = 1;
    itemsPerPage = 10;
    totalTickets = 0; // Para mostrar en el header

    // ============================
    // FILTROS
    // ============================
    filtroBusqueda = '';
    filtroOrigen = 'todos';
    filtroEvento = 'todos';
    filtroFechaDesde = '';
    filtroFechaHasta = '';

    // USUARIO
    usuario: any;

    constructor(
        private ticketService: TicketService,
        private authService: AuthService,
        private router: Router
    ) { }

    ngOnInit() {
        this.cargarUsuario();
        this.cargarTickets();

        // Actualizar reloj (opcional, solo visual)
        setInterval(() => this.fechaActual.set(new Date()), 1000);
    }

    // ============================
    // CARGA DE DATOS
    // ============================
    cargarUsuario() {
        const rawUser = this.authService.getUser();
        // Manejo robusto de la estructura del usuario
        if (rawUser && rawUser.data && rawUser.data.user) {
            this.usuario = rawUser.data.user;
        } else {
            this.usuario = rawUser;
        }
    }

    cargarTickets() {
        this.loading.set(true);
        this.errorMsg.set('');

        // Asumimos que tienes este método en tu servicio. 
        // Si no, agrégalo: return this.http.get(`${this.apiUrl}/tickets/cerrados`, { withCredentials: true });
        this.ticketService.getClosedTickets()
            .pipe(finalize(() => this.loading.set(false)))
            .subscribe({
                next: (resp: any) => {
                    if (resp?.success) {
                        const data = resp.data?.tickets || [];

                        // Ordenar por fecha DESCENDENTE (Más reciente arriba) para historial
                        data.sort((a: any, b: any) => new Date(b.fecha_creacion).getTime() - new Date(a.fecha_creacion).getTime());

                        this.tickets.set(data);
                        this.totalTickets = data.length;
                    } else {
                        this.errorMsg.set(resp?.message || 'No se pudieron cargar los tickets.');
                    }
                },
                error: () => {
                    this.errorMsg.set('Error de conexión con el servidor.');
                }
            });
    }

    // ============================
    // NAVEGACIÓN
    // ============================
    verDetalle(ticket_id: number): void {
        if (!this.usuario) this.cargarUsuario();

        if (!this.usuario || !this.usuario.nombre_rol) {
            console.error('No se pudo determinar el rol del usuario');
            return;
        }

        if (this.usuario.nombre_rol === 'administrador') {
            this.router.navigate(['/admin/ticket', ticket_id]);
        } else {
            this.router.navigate(['/soporte/ticket', ticket_id]);
        }
    }

    // ============================
    // LÓGICA DE FILTRADO
    // ============================
    getFilteredTickets() {
        const search = this.filtroBusqueda.toLowerCase().trim();
        const origen = this.filtroOrigen.toLowerCase();
        const evento = this.filtroEvento.toLowerCase();

        return this.tickets().filter(t => {
            // 1. Busqueda Texto (ID, Asunto, Usuario)
            const matchSearch = !search ||
                t.ticket_id.toString().includes(search) ||
                t.asunto.toLowerCase().includes(search) ||
                t.usuario_nombre.toLowerCase().includes(search);

            // 2. Origen
            const matchOrigen = origen === 'todos' || t.origen.toLowerCase() === origen;

            // 3. Evento
            const matchEvento = evento === 'todos' || t.evento.toLowerCase() === evento;

            // 4. Fechas
            const fechaTicket = new Date(t.fecha_creacion);
            const matchDesde = !this.filtroFechaDesde || fechaTicket >= new Date(this.filtroFechaDesde);

            // Ajuste para incluir todo el día final
            const fechaHastaFin = this.filtroFechaHasta ? new Date(this.filtroFechaHasta + 'T23:59:59') : null;
            const matchHasta = !fechaHastaFin || fechaTicket <= fechaHastaFin;

            return matchSearch && matchOrigen && matchEvento && matchDesde && matchHasta;
        });
    }

    // Métodos disparados por el HTML (ngModelChange) para resetear paginación al filtrar
    onFiltroBusquedaChange(val: string) { this.filtroBusqueda = val; this.currentPage = 1; }
    onFiltroOrigenChange(val: string) { this.filtroOrigen = val; this.currentPage = 1; }
    onFiltroEventoChange(val: string) { this.filtroEvento = val; this.currentPage = 1; }
    onFiltroFechaDesdeChange(val: string) { this.filtroFechaDesde = val; this.currentPage = 1; }
    onFiltroFechaHastaChange(val: string) { this.filtroFechaHasta = val; this.currentPage = 1; }

    resetFiltros() {
        this.filtroBusqueda = '';
        this.filtroOrigen = 'todos';
        this.filtroEvento = 'todos';
        this.filtroFechaDesde = '';
        this.filtroFechaHasta = '';
        this.currentPage = 1;
    }

    // ============================
    // PAGINACIÓN
    // ============================
    getPaginatedTickets() {
        const filtered = this.getFilteredTickets();
        // Actualizamos el total basado en el filtro actual, no el total global
        // Nota: totalTickets lo usas para el header global, aquí calculamos para paginar
        const totalFiltered = filtered.length;

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

    // Optimización de rendimiento para ngFor
    trackByTicketId(index: number, ticket: any): number {
        return ticket.ticket_id;
    }
}
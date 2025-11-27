import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { FormsModule } from '@angular/forms';
import { TicketService } from '../../../../core/services/ticket/ticket.service';
import { AuthService } from '../../../../core/services/auth/auth.service';

@Component({
  selector: 'app-tickets-asignados-por-soporte',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tickets-asignados-por-soporte.html',
})
export class TicketsAsignadosPorSoporteComponent implements OnInit {
  
  // DATA
  tickets = signal<any[]>([]);
  
  // STATES
  loading = signal(false);
  errorMsg = signal('');

  // PAGINACIÓN
  currentPage = 1;
  itemsPerPage = 10; 
  totalTickets = 0;

  // FILTROS
  filtroBusqueda: string = '';
  filtroPrioridad: string = 'todos';
  filtroEstado: string = 'todos';
  filtroFechaDesde: string = '';
  filtroFechaHasta: string = '';
  
  // USUARIO
  usuario: any;

  constructor(
    private ticketService: TicketService,
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit() {
    this.usuario = this.authService.getUser();
    this.cargarTickets();
  }

  get fechaActual(): Date {
    return new Date();
  }

  cargarTickets() {
    this.loading.set(true);
    this.errorMsg.set('');

    this.ticketService.getTicketsAsignadosPorSoporte()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (resp: any) => {
          if (resp?.success) {
            const ticketsData = resp.data?.tickets || [];
            // Ordenar por defecto por fecha (más reciente primero)
            ticketsData.sort((a:any, b:any) => new Date(b.fecha_creacion).getTime() - new Date(a.fecha_creacion).getTime());
            
            this.tickets.set(ticketsData);
            this.totalTickets = ticketsData.length;
          } else {
            this.errorMsg.set(resp?.message || 'No se pudieron obtener los tickets');
          }
        },
        error: () => {
          this.errorMsg.set('Error de conexión al cargar tickets');
        },
      });
  }

  verDetalle(ticket_id: number): void {
    this.router.navigate(['/soporte/ticket/', ticket_id]);
  }

  // =========================================================
  // LÓGICA DE FILTRADO
  // =========================================================
  getFilteredTickets() {
    const search = this.filtroBusqueda.toLowerCase().trim();

    return this.tickets().filter(t => {

      // 1. Búsqueda General
      const matchSearch =
        !search ||
        t.asunto.toLowerCase().includes(search) ||
        t.descripcion?.toLowerCase().includes(search) ||
        t.ticket_id.toString().includes(search);

      // 2. Prioridad
      const matchPrioridad =
        this.filtroPrioridad === 'todos' ||
        t.prioridad.toLowerCase() === this.filtroPrioridad;

      // 3. Estado
      const matchEstado =
        this.filtroEstado === 'todos' ||
        t.estado.toLowerCase() === this.filtroEstado;

      // 4. Fechas
      const fecha = new Date(t.fecha_creacion);
      
      const matchFechaDesde =
        !this.filtroFechaDesde ||
        fecha >= new Date(this.filtroFechaDesde);

      const matchFechaHasta =
        !this.filtroFechaHasta ||
        fecha <= new Date(this.filtroFechaHasta + 'T23:59:59');

      return matchSearch && matchPrioridad && matchEstado && matchFechaDesde && matchFechaHasta;
    });
  }

  get nombreUnidad(): string {
    if (!this.usuario) return 'Mi Unidad';
    return this.usuario.nombre_unidad || this.usuario.unidad || 'Soporte Técnico';
  }

  resetFiltros() {
    this.filtroBusqueda = '';
    this.filtroPrioridad = 'todos';
    this.filtroEstado = 'todos';
    this.filtroFechaDesde = '';
    this.filtroFechaHasta = '';
    this.currentPage = 1;
  }

  // =========================================================
  // PAGINACIÓN
  // =========================================================
  
  get totalPages(): number {
    return Math.ceil(this.totalTickets / this.itemsPerPage) || 1;
  }

  getPaginatedTickets() {
    const filtered = this.getFilteredTickets();
    this.totalTickets = filtered.length;

    const start = (this.currentPage - 1) * this.itemsPerPage;
    return filtered.slice(start, start + this.itemsPerPage);
  }

  getStartIndex(): number {
    return (this.currentPage - 1) * this.itemsPerPage;
  }

  getEndIndex(): number {
    return Math.min(this.currentPage * this.itemsPerPage, this.totalTickets);
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
    this.itemsPerPage = parseInt(event.target.value, 10);
    this.currentPage = 1;
  }

  // =========================================================
  // ESTILOS
  // =========================================================

  getPriorityClass(prioridad: string) {
    if (!prioridad) return 'bg-slate-100 text-slate-600 border-slate-200';
    const p = prioridad.toLowerCase();
    
    if (p === 'alta') return 'bg-red-50 text-red-700 border-red-200';
    if (p === 'media') return 'bg-amber-50 text-amber-700 border-amber-200';
    if (p === 'baja') return 'bg-green-50 text-green-700 border-green-200';
    
    return 'bg-slate-100 text-slate-600 border-slate-200';
  }

  getStatusClass(estado: string) {
    if (!estado) return 'bg-slate-100 text-slate-600 border-slate-200';
    const e = estado.toLowerCase();

    if (e === 'abierto') return 'bg-blue-50 text-blue-700 border-blue-200';
    if (e === 'en proceso') return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    if (e === 'en pausa') return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    if (e === 'cerrado') return 'bg-green-100 text-green-700 border-green-200';
    if (e === 'cancelado') return 'bg-red-50 text-red-700 border-red-200';

    return 'bg-slate-100 text-slate-600 border-slate-200';
  }
}
import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs/operators';
import { TicketService } from '../../../core/services/ticket/ticket.service';
import { AuthService } from '../../../core/services/auth/auth.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-tickets-revisados',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tickets-revisados.html',
})
export class TicketsRevisadosComponent implements OnInit {
  tickets = signal<any[]>([]);
  loading = signal(false);
  errorMsg = signal('');

  // Propiedades para la paginación
  currentPage = 1;
  itemsPerPage = 5;
  totalTickets = 0;

  filtroBusqueda: string = '';
  filtroPrioridad: string = 'todos';
  filtroEstado: string = 'todos';
  filtroFechaDesde: string = '';
  filtroFechaHasta: string = '';
  // Propiedad para el usuario
  usuario: any;

  constructor(
    private ticketService: TicketService,
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit() {
    // Obtener el usuario del servicio de autenticación
    this.usuario = this.authService.getUser();
    this.cargarTickets();
  }

  cargarTickets() {
    this.loading.set(true);
    this.errorMsg.set('');

    this.ticketService.getTicketsRevisados()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (resp: any) => {
          if (resp?.success) {
            const ticketsData = resp.data?.tickets || [];
            this.tickets.set(ticketsData);
            this.totalTickets = ticketsData.length;
            console.log('Tickets revisados cargados:', ticketsData);
          } else {
            this.errorMsg.set(resp?.message || 'No se pudieron obtener los tickets');
          }
        },
        error: () => {
          this.errorMsg.set('Error al obtener los tickets de la unidad');
        },
      });
  }

  verDetalle(ticket_id: number): void {
    this.router.navigate(['/admin/ticket/', ticket_id]);
  }

  getFilteredTickets() {
    const search = this.filtroBusqueda.toLowerCase();

    return this.tickets().filter(t => {

      // 🔍 BUSQUEDA GENERAL
      const matchSearch =
        t.asunto.toLowerCase().includes(search) ||
        t.descripcion.toLowerCase().includes(search) ||
        t.prioridad.toLowerCase().includes(search) ||
        t.estado.toLowerCase().includes(search);

      const matchPrioridad =
        this.filtroPrioridad === 'todos' ||
        t.prioridad.toLowerCase() === this.filtroPrioridad;

      const matchEstado =
        this.filtroEstado === 'todos' ||
        t.estado.toLowerCase() === this.filtroEstado;

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

  // Getter para obtener el nombre de la unidad de forma segura
  get nombreUnidad(): string {
    if (!this.usuario) return 'Mi Unidad';

    // Diferentes posibles nombres de propiedades donde podría estar la unidad
    return this.usuario.nombre_unidad ||
      this.usuario.unidad
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
    this.filtroPrioridad = 'todos';
    this.filtroEstado = 'todos';
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
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (this.currentPage <= 4) {
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
        pages.push(-1);
        pages.push(this.totalPages);
      } else if (this.currentPage >= this.totalPages - 3) {
        pages.push(1);
        pages.push(-1);
        for (let i = this.totalPages - 4; i <= this.totalPages; i++) {
          pages.push(i);
        }
      } else {
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
  getPriorityClass(prioridad: string) {
    if (!prioridad) return 'bg-slate-100 text-slate-800 border border-slate-200';

    const normalized = prioridad.toLowerCase().trim();
    if (normalized === 'alta') {
      return 'bg-red-100 text-red-800 border border-red-200';
    }
    if (normalized === 'media') {
      return 'bg-amber-100 text-amber-800 border border-amber-200';
    }
    if (normalized === 'baja') {
      return 'bg-green-100 text-green-800 border border-green-200';
    }

    return 'bg-slate-100 text-slate-800 border border-slate-200';
  }
  getStatusClass(estado: string) {
    if (!estado) return 'bg-slate-100 text-slate-800 border border-slate-200';

    const normalized = estado.toLowerCase().trim();

    if (normalized === 'abierto') {
      return 'bg-blue-100 text-blue-800 border border-blue-200';
    }

    if (normalized === 'en proceso') {
      return 'bg-amber-100 text-amber-800 border border-amber-200';
    }

    if (normalized === 'en pausa') {
      return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
    }

    if (normalized === 'cancelado') {
      return 'bg-red-100 text-red-800 border border-red-200';
    }

    if (normalized === 'cerrado') {
      return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
    }



    return 'bg-slate-100 text-slate-800 border border-slate-200';
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
    this.currentPage = 1;
  }

  // Getter para la fecha actual
  get fechaActual(): Date {
    return new Date();
  }
}
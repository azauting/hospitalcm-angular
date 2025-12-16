import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { FormsModule } from '@angular/forms';
import { TicketService } from '../../../core/services/ticket.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-reviewed-tickets',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tickets-revisados.html',
})
export class TicketsReviewedComponent implements OnInit {

  // DATA
  tickets = signal<any[]>([]);

  // STATES
  loading = signal(false);
  errorMsg = signal('');

  // PAGINATION
  currentPage = 1;
  itemsPerPage = 10;
  totalTickets = 0;

  // FILTERS 
  filterSearch: string = '';
  filterStatus: string = 'todos';
  filterDateFrom: string = '';
  filterDateTo: string = '';
  filterOrigin: string = 'todos'; // Variable para el select de origen

  // USER
  user: any;

  constructor(
    private ticketService: TicketService,
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit() {
    this.user = this.authService.getUser();
    this.loadTickets();
  }

  get currentDate(): Date {
    return new Date();
  }

  // =========================================================
  // DATA LOADING
  // =========================================================
  loadTickets() {
    this.loading.set(true);
    this.errorMsg.set('');

    this.ticketService.getReviewedTickets()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (resp: any) => {
          if (resp?.success) {
            const ticketsData = resp.data?.tickets || [];

            // Ordenar por más recientes
            ticketsData.sort(
              (a: any, b: any) =>
                new Date(b.fecha_creacion).getTime() -
                new Date(a.fecha_creacion).getTime()
            );

            this.tickets.set(ticketsData);
            this.totalTickets = ticketsData.length;
          } else {
            this.errorMsg.set(resp?.message || 'No se pudieron obtener los tickets');
          }
        },
        error: (err: any) => {
          const mensajeServidor = err.error?.message || 'Error de conexión al cargar tickets';
          this.errorMsg.set(mensajeServidor);
          console.error('Error API:', err);
        },
      });
  }

  viewDetail(ticketId: number): void {
    const rol = this.user?.nombre_rol || this.user?.rol || '';
    if (rol === 'administrador') {
      this.router.navigate(['/admin/ticket/', ticketId]);
    } else {
      this.router.navigate(['/soporte/ticket/', ticketId]);
    }
  }

  // =========================================================
  // FILTER LOGIC (Actualizada con Origen)
  // =========================================================
  getFilteredTickets() {
    const search = this.filterSearch.toLowerCase().trim();

    return this.tickets().filter(t => {
      // 1. Buscador General
      const matchSearch =
        !search ||
        (t.asunto && t.asunto.toLowerCase().includes(search)) ||
        (t.descripcion && t.descripcion.toLowerCase().includes(search)) ||
        t.ticket_id.toString().includes(search);

      // 2. Estado
      const tEstado = t.estado ? t.estado.toLowerCase() : '';
      let matchStatus = this.filterStatus === 'todos';

      if (!matchStatus) {
        if (this.filterStatus === 'en proceso' || this.filterStatus === 'en_proceso') {
          matchStatus = tEstado.includes('proceso');
        } else {
          matchStatus = tEstado === this.filterStatus;
        }
      }

      // 3. Origen (NUEVO)
      const tOrigen = t.origen ? t.origen.toLowerCase() : '';
      const matchOrigin = this.filterOrigin === 'todos' || tOrigen === this.filterOrigin;

      // 4. Rango de Fechas
      const fecha = new Date(t.fecha_creacion);
      const matchFrom = !this.filterDateFrom || fecha >= new Date(this.filterDateFrom);
      const matchTo = !this.filterDateTo || fecha <= new Date(this.filterDateTo + 'T23:59:59');

      return matchSearch && matchStatus && matchOrigin && matchFrom && matchTo;
    });
  }

  resetFilters() {
    this.filterSearch = '';
    this.filterStatus = 'todos';
    this.filterOrigin = 'todos'; // Reseteamos origen
    this.filterDateFrom = '';
    this.filterDateTo = '';
    this.currentPage = 1;
  }

  // =========================================================
  // PAGINATION LOGIC
  // =========================================================

  get totalPages(): number {
    return Math.ceil(this.totalTickets / this.itemsPerPage) || 1;
  }

  getPaginatedTickets() {
    const filtered = this.getFilteredTickets();
    this.totalTickets = filtered.length;

    if (this.currentPage > this.totalPages) {
      this.currentPage = 1;
    }

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

  // Ayuda al rendimiento de ngFor
  trackByTicketId(index: number, item: any): number {
    return item.ticket_id;
  }

  // =========================================================
  // STYLES & HELPERS
  // =========================================================

  get unitName(): string {
    if (!this.user) return 'Cargando...';
    const u = this.user.nombre_unidad || this.user.unidad || 'Unidad';
    return u.charAt(0).toUpperCase() + u.slice(1);
  }

  getPriorityClass(prioridad: string) {
    if (!prioridad) return 'bg-slate-100 text-slate-600 border-slate-200';
    const p = prioridad.toLowerCase();
    if (p === 'alta') return 'bg-red-50 text-red-700 border-red-200';
    if (p === 'media') return 'bg-amber-50 text-amber-700 border-amber-200';
    if (p === 'baja') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    return 'bg-slate-100 text-slate-600 border-slate-200';
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
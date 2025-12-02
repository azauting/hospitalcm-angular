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

  // FILTERS
  filterSearch: string = '';
  filterPriority: string = 'todos';
  filterStatus: string = 'todos';
  filterDateFrom: string = '';
  filterDateTo: string = '';

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
  }

  // =========================================================
  // LOAD USER
  // =========================================================
  loadUser() {
    const rawUser = this.authService.getUser();

    if (rawUser && rawUser.data && rawUser.data.user) {
        this.user = rawUser.data.user;
    } else {
        this.user = rawUser;
    }
    
    console.log('Usuario cargado:', this.user);
  }

  get currentDate(): Date {
    return new Date();
  }

  // =========================================================
  // LOAD TICKETS
  // =========================================================
  loadTickets() {
    this.loading.set(true);
    this.errorMsg.set('');

    this.ticketService.getReviewedTickets()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (resp: any) => {
          if (resp?.success) {
            const data = resp.data?.tickets || [];

            // Ascending order (oldest first)
            data.sort((a: any, b: any) =>
              new Date(a.fecha_creacion).getTime() - new Date(b.fecha_creacion).getTime()
            );

            this.tickets.set(data);
          } else {
            this.errorMsg.set(resp?.message || 'No se pudieron obtener los tickets');
          }
        },
        error: () => {
          this.errorMsg.set('Error de conexión con el servidor');
        },
      });
  }

  viewDetail(ticket_id: number): void {

    // Recheck user
    if (!this.user) {
      this.loadUser();
    }

    if (!this.user || !this.user.nombre_rol) {
      console.error('Error: No se pudo identificar el rol del usuario.', this.user);
      return;
    }

    // Safe navigation by role
    if (this.user.nombre_rol === 'administrador') {
      this.router.navigate(['/admin/ticket', ticket_id]);
    } else {
      this.router.navigate(['/soporte/ticket', ticket_id]);
    }
  }

  // =========================================================
  // GENERAL FILTERING LOGIC
  // =========================================================
  getFilteredTickets() {
    const search = this.filterSearch.toLowerCase().trim();

    return this.tickets().filter(t => {

      const matchSearch =
        !search ||
        t.asunto.toLowerCase().includes(search) ||
        t.descripcion?.toLowerCase().includes(search) ||
        t.ticket_id.toString().includes(search);

      const matchPriority =
        this.filterPriority === 'todos' ||
        t.prioridad.toLowerCase() === this.filterPriority;

      const matchStatus =
        this.filterStatus === 'todos' ||
        t.estado.toLowerCase() === this.filterStatus;

      const fecha = new Date(t.fecha_creacion);

      const matchFrom =
        !this.filterDateFrom || fecha >= new Date(this.filterDateFrom);

      const matchTo =
        !this.filterDateTo || fecha <= new Date(this.filterDateTo + 'T23:59:59');

      return matchSearch && matchPriority && matchStatus && matchFrom && matchTo;
    });
  }

  // =========================================================
  // FILTERING FOR KANBAN COLUMNS
  // =========================================================
  getTicketsByPriority(priorityColumn: string) {
    const filtered = this.getFilteredTickets();
    return filtered.filter(t => t.prioridad.toLowerCase() === priorityColumn.toLowerCase());
  }

  get unitName(): string {
    if (!this.user) return 'Cargando...';

    const u = this.user.nombre_unidad || this.user.unidad || 'Unidad Central';
    return u.charAt(0).toUpperCase() + u.slice(1);
  }

  resetFilters() {
    this.filterSearch = '';
    this.filterPriority = 'todos';
    this.filterStatus = 'todos';
    this.filterDateFrom = '';
    this.filterDateTo = '';
  }
}

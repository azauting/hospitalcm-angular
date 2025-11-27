import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms'; // <--- IMPORTANTE
import { TicketService } from '../../../../core/services/ticket/ticket.service';
import { finalize } from 'rxjs';

@Component({
    selector: 'app-mis-tickets',
    standalone: true,
    imports: [CommonModule, FormsModule], // <--- Agregado FormsModule
    templateUrl: './mis-tickets.html',
})
export class MisTicketsComponent implements OnInit {

    // --- DATA ---
    tickets = signal<any[]>([]);           // Todos los tickets (Backup)
    ticketsFiltrados = signal<any[]>([]);  // Los que se ven en la tabla
    
    // --- UI STATES ---
    loading = signal(false);
    errorMsg = signal('');

    // --- FILTROS (Signals) ---
    filtroTexto = signal('');
    filtroFechaInicio = signal('');
    filtroFechaFin = signal('');

    // --- PAGINACIÓN ---
    currentPage = 1;
    itemsPerPage = 10;
    totalPages = 1;
    
    // --- UTILIDADES ---
    Math = Math; // Para usar Math.min en el HTML

    constructor(
        private ticketService: TicketService,
        private router: Router
    ) {}

    ngOnInit() {
        this.cargarMisTickets();
    }

    // =============================================================
    // CARGA DE DATOS
    // =============================================================
    cargarMisTickets() {
        this.loading.set(true);
        this.errorMsg.set('');
        
        this.ticketService.getMisTickets()
            .pipe(finalize(() => this.loading.set(false)))
            .subscribe({
                next: (resp: any) => {
                    if (resp?.success) {
                        const data = resp.data?.tickets ?? []; // Ajusta según venga tu API (resp.data o resp.data.tickets)
                        
                        // Ordenamos por fecha (el más nuevo primero)
                        data.sort((a: any, b: any) => new Date(b.fecha_creacion).getTime() - new Date(a.fecha_creacion).getTime());

                        this.tickets.set(data);
                        
                        // Inicializamos la vista filtrada con todos los datos
                        this.aplicarFiltros(); 
                    } else {
                        this.errorMsg.set(resp?.message || 'No se pudieron obtener tus tickets');
                    }
                },
                error: () => this.errorMsg.set('Error de conexión al obtener tus tickets')
            });
    }

    // =============================================================
    // LÓGICA DE FILTRADO
    // =============================================================
    aplicarFiltros() {
        let resultado = [...this.tickets()];
        
        const texto = this.filtroTexto().toLowerCase().trim();
        const inicio = this.filtroFechaInicio() ? new Date(this.filtroFechaInicio()) : null;
        const fin = this.filtroFechaFin() ? new Date(this.filtroFechaFin()) : null;

        // Ajuste: Que la fecha fin incluya todo el día (hasta las 23:59:59)
        if (fin) fin.setHours(23, 59, 59);

        // 1. Filtro por Texto (ID, Asunto, Estado)
        if (texto) {
            resultado = resultado.filter(t => 
                t.asunto.toLowerCase().includes(texto) ||
                t.ticket_id.toString().includes(texto) ||
                t.estado.toLowerCase().includes(texto)
            );
        }

        // 2. Filtro por Rango de Fechas
        if (inicio || fin) {
            resultado = resultado.filter(t => {
                const fechaTicket = new Date(t.fecha_creacion);
                if (inicio && fechaTicket < inicio) return false;
                if (fin && fechaTicket > fin) return false;
                return true;
            });
        }

        this.ticketsFiltrados.set(resultado);
        
        // Recalcular paginación y volver a la página 1
        this.calculateTotalPages();
        this.currentPage = 1;
    }

    limpiarFiltros() {
        this.filtroTexto.set('');
        this.filtroFechaInicio.set('');
        this.filtroFechaFin.set('');
        this.aplicarFiltros();
    }

    // =============================================================
    // LÓGICA DE PAGINACIÓN
    // =============================================================
    calculateTotalPages() {
        this.totalPages = Math.ceil(this.ticketsFiltrados().length / this.itemsPerPage) || 1;
    }

    getPaginatedTickets(): any[] {
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        return this.ticketsFiltrados().slice(startIndex, endIndex);
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
        // Genera array simple [1, 2, 3...] según totalPages
        return Array.from({ length: this.totalPages }, (_, i) => i + 1);
    }

    // =============================================================
    // UI HELPERS & NAVEGACIÓN
    // =============================================================
    verDetalle(ticketId: number): void {
        this.router.navigate(['/inicio/ticket', ticketId]);
    }

    crearTicket() {
        this.router.navigate(['/inicio/crear-ticket']);
    }

    // Clases para el Badge (Fondo y Texto)
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

    // Clases para el Puntito de color dentro del badge
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
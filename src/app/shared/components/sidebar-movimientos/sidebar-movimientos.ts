import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription, interval } from 'rxjs';
import { startWith, switchMap } from 'rxjs/operators';
import { TicketLogService } from '../../../core/services/ticket-log/ticket-log.service';

interface MovimientoLog {
    ticket_movimiento_id: number;
    ticket_id: number;
    movimiento_id: number;
    fecha: string; // ISO
    nombre_completo: string;
    tipo_movimiento: string;
}

@Component({
    selector: 'app-sidebar-movimientos',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './sidebar-movimientos.html',
})
export class SideBarMovementsComponent implements OnInit, OnDestroy {

    movimientos = signal<MovimientoLog[]>([]);
    loading = signal(false);
    errorMsg = signal('');

    private readonly pollIntervalMs = 10000;
    private pollSub?: Subscription;

    constructor(private ticketLogService: TicketLogService) { }

    ngOnInit() {
        this.iniciarPolling();
    }

    ngOnDestroy() {
        this.pollSub?.unsubscribe();
    }

    private iniciarPolling() {
        this.loading.set(true);
        this.errorMsg.set('');

        this.pollSub = interval(this.pollIntervalMs)
            .pipe(
                startWith(0),
                switchMap(() => this.ticketLogService.getLatestGlobalMovement())
            )
            .subscribe({
                next: (resp: any) => {
                    this.loading.set(false);

                    if (!resp?.success || !resp.data) {
                        this.errorMsg.set(resp?.message || 'No se pudieron obtener los últimos movimientos');
                        return;
                    }

                    // 👇 Ahora el backend devuelve un ARRAY de movimientos
                    const movimientos: MovimientoLog[] = resp.data || [];

                    this.movimientos.set(movimientos);

                    this.errorMsg.set('');
                },
                error: (err) => {
                    console.error('Error obteniendo últimos movimientos globales:', err);
                    this.loading.set(false);
                    this.errorMsg.set('Error al obtener movimientos recientes');

                    if (err?.status === 401 || err?.status === 403) {
                        this.pollSub?.unsubscribe();
                    }
                }
            });
    }

    cerrarTarjeta(id: number) {
        this.movimientos.update(lista =>
            lista.filter(m => m.ticket_movimiento_id !== id)
        );
        // Nota: en el próximo polling se volverán a cargar desde el backend.
        // Si quisieras que NO vuelvan a aparecer hasta que llegue algo nuevo,
        // habría que añadir lógica extra para recordar cuáles se cerraron.
    }

    formatoTipoMovimiento(tipo: string): string {
        return tipo
            .toLowerCase()
            .replace(/_/g, ' ')
            .replace(/^\w/, c => c.toUpperCase());
    }
}
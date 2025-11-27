import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription, interval } from 'rxjs';
import { startWith, switchMap } from 'rxjs/operators';
import { TicketLogService } from '../../../core/services/ticket-log/ticket-log.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

export interface MovimientoLog {
    ticket_movimiento_id: number;
    ticket_id: number;
    movimiento_id: number;
    fecha: string;
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

    private readonly pollIntervalMs = 15000; // 15 seg para no saturar
    private pollSub?: Subscription;

    constructor(
        private ticketLogService: TicketLogService,
        private sanitizer: DomSanitizer
    ) { }

    ngOnInit() {
        this.iniciarPolling();
    }

    ngOnDestroy() {
        this.pollSub?.unsubscribe();
    }

    private iniciarPolling() {
        // Solo mostramos loading la primera vez
        if (this.movimientos().length === 0) {
            this.loading.set(true);
        }
        
        this.errorMsg.set('');

        this.pollSub = interval(this.pollIntervalMs)
            .pipe(
                startWith(0),
                switchMap(() => this.ticketLogService.getLatestGlobalMovement())
            )
            .subscribe({
                next: (resp: any) => {
                    this.loading.set(false);

                    if (!resp?.success) {
                        // No mostramos error invasivo si falla un poll intermedio, solo log
                        console.warn('Polling logs:', resp?.message);
                        return;
                    }

                    const nuevosMovimientos: MovimientoLog[] = resp.data || [];
                    
                    // Actualizamos solo si hay cambios para evitar parpadeos innecesarios
                    // (Comparación simple por longitud o ID del primero)
                    const actuales = this.movimientos();
                    if (nuevosMovimientos.length !== actuales.length || 
                        (nuevosMovimientos.length > 0 && nuevosMovimientos[0].ticket_movimiento_id !== actuales[0]?.ticket_movimiento_id)) {
                        this.movimientos.set(nuevosMovimientos);
                    }
                },
                error: (err) => {
                    this.loading.set(false);
                    console.error('Error polling movimientos:', err);
                    // Si es error de auth, detenemos el polling
                    if (err.status === 401 || err.status === 403) {
                        this.errorMsg.set('Sesión expirada');
                        this.pollSub?.unsubscribe();
                    }
                }
            });
    }

    cerrarTarjeta(id: number) {
        // Eliminación optimista local
        this.movimientos.update(lista => lista.filter(m => m.ticket_movimiento_id !== id));
    }

    formatoTipoMovimiento(tipo: string): string {
        if (!tipo) return 'Acción';
        // Ej: CREACION_TICKET -> Creación Ticket
        return tipo
            .toLowerCase()
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    // Retorna el SVG path según el tipo
    getIconForType(tipo: string): SafeHtml {
        let svgContent = '';
        const t = tipo.toLowerCase();

        if (t.includes('crea')) {
            // Plus / Nuevo (Creación)
            svgContent = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>';
        } else if (t.includes('cierra') || t.includes('resue')) {
            // Check (Cierre/Resolución)
            svgContent = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>';
        } else if (t.includes('asigna')) {
            // Usuario (Asignación)
            svgContent = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>';
        } else if (t.includes('coment') || t.includes('observ')) {
            // Burbuja (Comentario)
            svgContent = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/></svg>';
        } else {
            // Default (Reloj/Cambio)
            svgContent = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20v-6M6 20V10M18 20V4"/></svg>';
        }

        return this.sanitizer.bypassSecurityTrustHtml(svgContent);
    }
}
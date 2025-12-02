import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs/operators';

import { TicketService } from '../../../../core/services/ticket.service';

@Component({
    selector: 'app-ticket-detalle',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './ticket-detalle.html',
})
export class TicketDetalleComponent implements OnInit {

    // signals con estructura limpia
    ticket = signal<any | null>(null);      // ticket principal
    detalle = signal<any | null>(null);     // detalle (respuesta, soporte)
    observaciones = signal<any[]>([]);      // observaciones[]

    loading = signal<boolean>(false);
    errorMsg = signal<string>('');

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private ticketService: TicketService
    ) { }

    ngOnInit() {
        const id = Number(this.route.snapshot.paramMap.get('id'));
        if (!id) {
            this.errorMsg.set('ID de ticket no válido');
            return;
        }

        this.cargarTicket(id);
    }

    cargarTicket(id: number) {
        this.loading.set(true);
        this.errorMsg.set('');
        this.ticket.set(null);
        this.detalle.set(null);
        this.observaciones.set([]);

        this.ticketService.getTicketById(id)
            .pipe(finalize(() => this.loading.set(false)))
            .subscribe({
                next: (resp: any) => {
                    console.log("Detalle REAL:", resp);

                    if (!resp?.success) {
                        this.errorMsg.set(resp?.message || 'No se pudo obtener el ticket');
                        return;
                    }

                    const wrapper = resp.data?.ticket;
                    if (!wrapper) {
                        this.errorMsg.set("El ticket no contiene información válida");
                        return;
                    }


                    this.ticket.set(wrapper.ticket || null);
                    this.detalle.set(wrapper.detalle || null);
                    this.observaciones.set(wrapper.observaciones || []);
                },
                error: () => {
                    this.errorMsg.set("Error al obtener el ticket");
                }
            });
    }

    volver() {
        this.router.navigate(['/solicitante/mis-tickets']);
    }
}

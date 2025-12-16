import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface TicketCreatePayload {
    asunto: string;
    descripcion: string;
    telefono: string;
    autor_problema: string;
    evento?: string;
    ubicacion_id: number;
    ip_manual: string;
}



export interface TicketSummary {
    ticket_id: number;
    asunto: string;
    estado: string;
    fecha_creacion: string;
}

export interface Ticket {
    ticket_id: number;
    asunto: string;
    descripcion: string;
    telefono: string;
    autor_problema: string;
    ubicacion: Location;
    prioridad: string;
    unidad: string;
    estado: string;
    evento?: string;
    fecha_creacion: string;
}

@Injectable({
    providedIn: 'root',
})
export class TicketService {
    constructor(
        private http: HttpClient,
        @Inject('API_URL') private apiUrl: string
    ) { }

    // ============================
    // CREATE TICKET
    // ============================
    createTicket(payload: TicketCreatePayload) {
        return this.http.post(
            `${this.apiUrl}/api/tickets`,
            payload,
            { withCredentials: true }
        );
    }

    // ============================
    // LOCATIONS
    // ============================
    getLocations() {
        return this.http.get(
            `${this.apiUrl}/api/tipos/ubicacion`,
            { withCredentials: true }
        );
    }

    // ============================
    // TICKETS (USER)
    // ============================
    getMyTickets() {
        return this.http.get(
            `${this.apiUrl}/api/tickets/mis-tickets`,
            { withCredentials: true }
        );
    }

    getTicketById(id: number) {
        return this.http.get(
            `${this.apiUrl}/api/tickets/${id}`,
            { withCredentials: true }
        );
    }

    // ============================
    // TICKETS (ADMIN / SOPORTE)
    // ============================
    getUnreviewedTickets() {
        return this.http.get(
            `${this.apiUrl}/api/tickets/sin-revisar`,
            { withCredentials: true }
        );
    }

    getInternalTickets() {
        return this.http.get(
            `${this.apiUrl}/api/tickets/internal`,
            { withCredentials: true }
        );
    }

    getAssignedTickets() {
        return this.http.get(
            `${this.apiUrl}/api/tickets/mis-tickets/asignados`,
            { withCredentials: true }
        );
    }

    // ============================
    // UPDATE TICKET
    // ============================
    updateTicket(
        id: number,
        data: { unidad_id?: number; prioridad_id?: number }
    ) {
        return this.http.patch(
            `${this.apiUrl}/api/tickets/${id}`,
            data,
            { withCredentials: true }
        );
    }

    // ============================
    // ASSIGN SUPPORT
    // ============================
    assignSupport(ticketId: number, supportId: number) {
        return this.http.patch(
            `${this.apiUrl}/api/tickets/${ticketId}/assign`,
            { soporte_id: supportId },
            { withCredentials: true }
        );
    }

    assignTicketToSelf(ticketId: number, supportId: number) {
        return this.http.patch(
            `${this.apiUrl}/api/tickets/${ticketId}/assign`,
            { soporte_id: supportId },
            { withCredentials: true }
        );
    }

    // ============================
    // REVIEWED TICKETS
    // ============================
    markReviewed(ticketId: number) {
        return this.http.patch(
            `${this.apiUrl}/api/tickets/${ticketId}/review`,
            {},
            { withCredentials: true }
        );
    }

    getReviewedTickets() {
        return this.http.get(
            `${this.apiUrl}/api/tickets/revisados`,
            { withCredentials: true }
        );
    }

    // ============================
    // CLOSE TICKET
    // ============================
    closeTicket(ticketId: number, finalResponse: string) {
        return this.http.patch(
            `${this.apiUrl}/api/tickets/${ticketId}/close`,
            { respuesta_final: finalResponse },
            { withCredentials: true }
        );
    }

    // ============================
    // OBSERVATIONS
    // ============================
    addObservation(ticketId: number, observacion: string) {
        return this.http.post(
            `${this.apiUrl}/api/tickets/${ticketId}/detalle/observacion`,
            { observacion },
            { withCredentials: true }
        );
    }

    // ============================
    // MEMBERS
    // ============================
    addMember(ticketId: number, userId: number) {
        return this.http.post(
            `${this.apiUrl}/api/tickets/${ticketId}/detalle/integrante`,
            { usuario_id: userId },
            { withCredentials: true }
        );
    }

    // ============================
    // CLOSED TICKETS
    // ============================
    getClosedTickets() {
        return this.http.get(
            `${this.apiUrl}/api/tickets/cerrados`,
            { withCredentials: true }
        );
    }
    cancelTicket(ticketId: number) {
        return this.http.patch(
            `${this.apiUrl}/api/tickets/${ticketId}/cancel`,
            {},
            { withCredentials: true }
        );
    }
    getMyIp() {
        return this.http.get<any>(`${this.apiUrl}/api/my-ip`);
    }
}

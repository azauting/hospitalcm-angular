import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
    providedIn: 'root',
})
export class TicketLogService {
    private apiUrl = 'https://api-hcm-tickets-production.up.railway.app';

    constructor(private http: HttpClient) { }

    getLatestGlobalMovement() {
        return this.http.get(
            `${this.apiUrl}/api/tickets/movimientos/recientes`,
            { withCredentials: true }
        );
    }
}
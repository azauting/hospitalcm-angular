import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

// ===== TYPES =====

// Simple KPI response
export interface KpiNumberResponse {
    success: boolean;
    message: string; // <--- Mantiene español porque viene del backend
    data: number;
}

// Resolved per month
export interface ResolvedMonthItem {
    mes: string;      // <--- string español desde el backend
    resueltos: number;
}

export interface ResolvedMonthResponse {
    success: boolean;
    message: string;
    data: ResolvedMonthItem[];
}

// MTTR per month
export interface MttrItem {
    mes: string;
    mttr_horas: string;
}

export interface MttrMonthlyResponse {
    success: boolean;
    message: string;
    data: MttrItem[];
}

// Treemap locations
export interface TreemapLocationItem {
    ubicacion: string; // español desde backend
    tickets: number;
}

export interface TreemapCategory {
    name: string;
    data: TreemapLocationItem[];
}

export interface TreemapResponse {
    success: boolean;
    message: string;
    data: TreemapCategory[];
}

@Injectable({
    providedIn: 'root'
})
export class DashboardService {

    constructor(
        private http: HttpClient,
        @Inject('API_URL') private apiUrl: string
    ) {}

    // ===== KPI NUMERIC =====

    getTicketsCreatedToday() {
        return this.http.get<KpiNumberResponse>(
            `${this.apiUrl}/api/analytics/tickets-creados-hoy`,
            { withCredentials: true }
        );
    }

    getTicketsClosedToday() {
        return this.http.get<KpiNumberResponse>(
            `${this.apiUrl}/api/analytics/tickets-cerrados-hoy`,
            { withCredentials: true }
        );
    }

    getTicketsOpen() {
        return this.http.get<KpiNumberResponse>(
            `${this.apiUrl}/api/analytics/tickets-abiertos`,
            { withCredentials: true }
        );
    }

    getTicketsInProcess() {
        return this.http.get<KpiNumberResponse>(
            `${this.apiUrl}/api/analytics/tickets-en-proceso`,
            { withCredentials: true }
        );
    }

    // ===== CHARTS =====

    getResolvedPerMonth() {
        return this.http.get<ResolvedMonthResponse>(
            `${this.apiUrl}/api/analytics/resueltos-mes`,
            { withCredentials: true }
        );
    }

    getMonthlyMTTR() {
        return this.http.get<MttrMonthlyResponse>(
            `${this.apiUrl}/api/analytics/mttr-mensual`,
            { withCredentials: true }
        );
    }

    getLocationsTreemap() {
        return this.http.get<TreemapResponse>(
            `${this.apiUrl}/api/analytics/ubicaciones/treemap`,
            { withCredentials: true }
        );
    }
}

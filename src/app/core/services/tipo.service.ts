import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Location {
    ubicacion_id: number;
    ubicacion: string;
    area_id?: number | null;
    nombre_area?: string | null;
}

@Injectable({
    providedIn: 'root'
})
export class TypeService {

    constructor(
        private http: HttpClient,
        @Inject('API_URL') private apiUrl: string
    ) { }

    // ============================
    // LOCATIONS
    // ============================
    getLocations(): Observable<any> {
        return this.http.get(`${this.apiUrl}/api/tipos/ubicacion`, {
            withCredentials: true
        });
    }

    createLocation(data: { location: string; area_id: number }): Observable<any> {
        return this.http.post(`${this.apiUrl}/api/tipos/ubicacion`, {
            ubicacion: data.location,
            area_id: data.area_id
        }, { withCredentials: true });
    }

    updateLocation(id: number, data: { location: string; area_id: number }): Observable<any> {
        return this.http.patch(`${this.apiUrl}/api/tipos/ubicacion/${id}`, {
            ubicacion: data.location,
            area_id: data.area_id
        }, { withCredentials: true });
    }

    // ============================
    // AREAS
    // ============================
    getAreas(): Observable<any> {
        return this.http.get(`${this.apiUrl}/api/tipos/area`, {
            withCredentials: true
        });
    }

    createArea(data: { area_name: string }): Observable<any> {
        return this.http.post(`${this.apiUrl}/api/tipos/area`, {
            nombre_area: data.area_name
        }, { withCredentials: true });
    }

    updateArea(id: number, data: { area_name: string }): Observable<any> {
        return this.http.patch(`${this.apiUrl}/api/tipos/area/${id}`, {
            nombre_area: data.area_name
        }, { withCredentials: true });
    }

    // ============================
    // EVENTS
    // ============================
    getEvents(): Observable<any> {
        return this.http.get(`${this.apiUrl}/api/tipos/evento`, {
            withCredentials: true
        });
    }

    updateEvent(id: number, data: { event: string }): Observable<any> {
        return this.http.patch(`${this.apiUrl}/api/tipos/evento/${id}`, {
            evento: data.event
        }, { withCredentials: true });
    }

    getEventById(id: number): Observable<any> {
        return this.http.get(`${this.apiUrl}/api/tipos/evento/${id}`, {
            withCredentials: true
        });
    }

    createEvent(data: { event: string }): Observable<any> {
        return this.http.post(`${this.apiUrl}/api/tipos/evento`, {
            evento: data.event
        }, { withCredentials: true });
    }

    // ============================
    // OTHERS
    // ============================
    getUnitTypes(): Observable<any> {
        return this.http.get(`${this.apiUrl}/api/tipos/unidad`, {
            withCredentials: true
        });
    }

    getStatusTypes(): Observable<any> {
        return this.http.get(`${this.apiUrl}/api/tipos/estado`, {
            withCredentials: true
        });
    }

    getPriorityTypes(): Observable<any> {
        return this.http.get(`${this.apiUrl}/api/tipos/prioridad`, {
            withCredentials: true
        });
    }

    getOriginTypes(): Observable<any> {
        return this.http.get(`${this.apiUrl}/api/tipos/origen`, {
            withCredentials: true
        });
    }
}

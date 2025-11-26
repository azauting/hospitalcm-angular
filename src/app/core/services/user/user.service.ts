import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface UpdateUserPayload {
    contrasena?: string;
    rol_id?: number;
    unidad_id?: number | null;
}

@Injectable({
    providedIn: 'root'
})
export class UserService {

    private apiUrl = 'https://api-hcm-tickets-production.up.railway.app';

    constructor(private http: HttpClient) { }

    // Obtener todos los usuarios
    getAllUsers() {
        console.log("Llamando a getAllUsers");
        return this.http.get(`${this.apiUrl}/api/users`, {
            withCredentials: true
        });

    }

    // Obtener un usuario
    getUserById(id: number) {
        console.log(`Llamando a getUserById con id: ${id}`);
        return this.http.get(`${this.apiUrl}/api/users/${id}`, {
            withCredentials: true
        });

    }

    // Cambiar contraseña
    updateUserPassword(id: number, payload: { contrasena: string }) {
        console.log(`Llamando a updateUserPassword con id: ${id}`);
        return this.http.patch(
            `${this.apiUrl}/api/users/${id}/update-password`,
            payload,
            { withCredentials: true }
        );

    }

    // Cambiar rol
    updateUserRole(id: number, payload: { newRoleId: number }) {
        return this.http.patch(
            `${this.apiUrl}/api/users/${id}/update-role`,
            payload,
            { withCredentials: true }
        );
    }

    // Cambiar unidad
    updateUserUnit(id: number, payload: { newUnitId: number | null }) {
        return this.http.patch(
            `${this.apiUrl}/api/users/${id}/update-unit`,
            payload,
            { withCredentials: true }
        );
    }

    // Obtener soportes disponibles
    getAvailableSupports() {
        return this.http.get(
            `${this.apiUrl}/api/user/soportes-disponibles`,
            { withCredentials: true }
        );
    }
}

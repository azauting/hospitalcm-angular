import { Inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';


export interface CreateUserPayload {
    nombre_completo: string;
    correo: string;
    contrasena: string;
    rol_id: number;
    unidad_id?: number | null;
}
@Injectable({
    providedIn: 'root',
})

export class AuthService {
    user = signal<any>(null);

    constructor(private http: HttpClient,
        @Inject('API_URL') private apiUrl: string
    ) { }

    login(correo: string, contrasena: string) {
        const body = { correo, contrasena };

        return this.http.post(`${this.apiUrl}/api/login`, body, {
            withCredentials: true,
        });
    }
    refreshUser() {
        this.getMe().subscribe({
            next: (resp: any) => {
                if (resp?.success) {
                    this.user.set(resp.data?.user);
                    console.log('Usuario autenticado:', resp.data?.user);
                } else {
                    this.user.set(null);
                }
            },
            error: () => {
                this.user.set(null);
            }
        });
    }

    getMe() {
        return this.http.get(`${this.apiUrl}/api/auth/me`, {
            withCredentials: true,
        });
    }

    setUser(user: any) {
        this.user.set(user);
    }

    getUser() {
        return this.user();
    }

    isLoggedIn() {
        return this.user() !== null;
    }
    createUser(payload: CreateUserPayload) {
        console.log('Llamando a createUser con payload:', payload);
        return this.http.post(
            `${this.apiUrl}/api/new-user`,
            payload,
            { withCredentials: true }
        );
    }
}

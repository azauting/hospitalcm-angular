import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
    providedIn: 'root',
})
export class AuthService {

    private apiUrl = 'https://api-hcm-tickets-production.up.railway.app';

    user = signal<any>(null);

    constructor(private http: HttpClient) { }

    login(correo: string, contrasena: string) {
        const body = { correo, contrasena };

        return this.http.post(`${this.apiUrl}/auth/login`, body, {
            withCredentials: true, // 👈 necesario para que se envíe/guarde cookie
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

    // 👇 NUEVO: probar si la cookie funciona
    getMe() {
        return this.http.get(`${this.apiUrl}/auth/me`, {
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
}

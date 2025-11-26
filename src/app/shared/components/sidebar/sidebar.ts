import { Component, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth/auth.service';

@Component({
    selector: 'app-sidebar',
    standalone: true,
    templateUrl: './sidebar.html',
    imports: [CommonModule],
})
export class SidebarComponent implements OnInit {

    currentRoute = '';

    constructor(
        public authService: AuthService,
        private router: Router,
    ) {

        // Detectar cambios de ruta
        this.router.events.subscribe(() => {
            this.currentRoute = this.router.url;
        });

        // 🔥 SE EJECUTA CADA VEZ QUE EL USER CAMBIA (signal)
        effect(() => {
            const user = this.authService.user(); // <-- así se lee un signal

            console.log("📌 Sidebar recibió usuario:", user);

            if (user) {
                this.redirectIfRoleMismatch(user);
            }
        });
    }

    ngOnInit() {

        this.currentRoute = this.router.url;

        // Si no hay usuario cargado → recuperarlo desde cookie
        if (!this.authService.getUser()) {
            console.log("⏳ Recuperando usuario desde cookie...");
            this.authService.refreshUser();
        } else {
            console.log("✔ Usuario ya estaba cargado:", this.authService.getUser());
        }
    }

    // ACCESO AL USUARIO DESDE EL HTML
    get usuario() {
        return this.authService.user(); // signal()
    }

    // ======================================================
    // REDIRECCIÓN POR ROL
    // ======================================================
    redirectIfRoleMismatch(user: any) {
        if (!user) return;

        const rol = user.nombre_rol?.toLowerCase();
        const url = this.router.url;

        if (rol === 'administrador' && url.startsWith('/soporte')) {
            this.router.navigate(['/admin']);
        }

        if (rol === 'soporte' && url.startsWith('/admin')) {
            this.router.navigate(['/soporte/tickets']);
        }
    }

    // ======================================================
    // ADMIN
    // ======================================================
    goDashboard() {
        this.router.navigate(['/admin']);
    }

    goTicketsSinRevisar() {
        this.router.navigate(['/admin/tickets/sin-revisar']);
    }

    goTicketsRevisados() {
        this.router.navigate(['/admin/tickets/revisados']);
    }

    goCrearTicket() {
        this.router.navigate(['/admin/crear-ticket']);
    }

    goTicketsInternos() {
        this.router.navigate(['/admin/tickets/internos']);
    }
    goUsuarios() {
        this.router.navigate(['/admin/usuarios']);
    }

    // ======================================================
    // SOPORTE
    // ======================================================
    goSoporteTickets() {
        this.router.navigate(['/soporte']);
    }

    goSoporteMisTickets() {
        this.router.navigate(['/soporte/mis-tickets']);
    }

    goSoporteCrearTicket() {
        this.router.navigate(['/soporte/crear-ticket']);
    }

    // ======================================================
    // UTILIDADES
    // ======================================================
    cerrarSesion() {
        this.authService.setUser(null);
        this.router.navigate(['/login']);
    }

    getInitials(name: string): string {
        if (!name) return '';
        const p = name.split(' ');
        return (p[0][0] + p[p.length - 1][0]).toUpperCase();
    }

    getNavButtonClass(route: string): string {
        if (this.currentRoute === route) {
            return 'bg-slate-800 text-white';
        }
        return 'text-slate-400 hover:bg-slate-700 hover:text-white';
    }
}

import { Component, OnInit, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { AuthService } from '../../../core/services/auth/auth.service';
import { filter } from 'rxjs/operators';

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
        // 1. Detectar cambios de ruta para marcar activo el botón
        this.router.events.pipe(
            filter(event => event instanceof NavigationEnd)
        ).subscribe((event: any) => {
            this.currentRoute = event.urlAfterRedirects || event.url;
        });

        // 2. Efecto para redirección de seguridad por Rol
        effect(() => {
            const user = this.authService.user();
            if (user) {
                this.redirectIfRoleMismatch(user);
            }
        });
    }

    ngOnInit() {
        this.currentRoute = this.router.url;

        // Recuperar sesión si se recarga la página
        if (!this.authService.getUser()) {
            this.authService.refreshUser();
        }
    }

    // Getter para usar en el HTML de forma limpia
    get usuario() {
        return this.authService.user();
    }

    // ======================================================
    // LÓGICA DE ESTILOS (Colores Corporativos)
    // ======================================================
    getNavButtonClass(route: string): string {
        // Verifica si la ruta actual es exactamente la del botón
        const isActive = this.currentRoute === route;

        if (isActive) {
            // ACTIVO: Fondo Cian (#62CEEA) y Texto Azul (#002777) con sombra suave
            return 'bg-[#62CEEA] text-[#002777] shadow-md shadow-[#62CEEA]/20 font-bold';
        }
        
        // INACTIVO: Texto Blanco semi-transparente, Hover blanco suave
        return 'text-white/80 hover:bg-white/10 hover:text-white font-medium';
    }

    getInitials(name: string | undefined): string {
        if (!name) return 'U';
        const parts = name.split(' ');
        // Retorna primera letra del primer nombre + primera letra del último apellido
        if (parts.length > 1) {
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        }
        return parts[0].substring(0, 2).toUpperCase();
    }

    // ======================================================
    // SEGURIDAD: REDIRECCIÓN POR ROL
    // ======================================================
    private redirectIfRoleMismatch(user: any) {
        const rol = user.nombre_rol?.toLowerCase();
        const url = this.router.url;

        if (rol === 'administrador' && url.startsWith('/soporte')) {
            this.router.navigate(['/admin']);
        }

        if (rol === 'soporte' && url.startsWith('/admin')) {
            this.router.navigate(['/soporte']); // Corregido a la raíz de soporte
        }
    }

    // ======================================================
    // NAVEGACIÓN - ADMIN
    // ======================================================
    goDashboard() { this.router.navigate(['/admin']); }
    goTicketsSinRevisar() { this.router.navigate(['/admin/tickets/sin-revisar']); }
    goTicketsRevisados() { this.router.navigate(['/admin/tickets/revisados']); }
    goCrearTicket() { this.router.navigate(['/admin/crear-ticket']); }
    goTicketsInternos() { this.router.navigate(['/admin/tickets/internos']); } // Agregado
    goUsuarios() { this.router.navigate(['/admin/usuarios']); }

    // ======================================================
    // NAVEGACIÓN - SOPORTE
    // ======================================================
    goSoporteTickets() { this.router.navigate(['/soporte']); }
    goSoporteMisTickets() { this.router.navigate(['/soporte/mis-tickets']); }
    goSoporteCrearTicket() { this.router.navigate(['/soporte/crear-ticket']); }

    // ======================================================
    // UTILIDADES
    // ======================================================
    cerrarSesion() {
        this.authService.setUser(null);
        localStorage.removeItem('hospital_credenciales'); // Opcional: limpiar credenciales guardadas
        this.router.navigate(['/login']);
    }
}
import { Component, OnInit, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
	selector: 'app-solicitante-navbar',
	standalone: true,
	imports: [CommonModule],
	templateUrl: './solicitante-navbar.html',
})
export class SolicitanteNavbarComponent implements OnInit {
	isMobileMenuOpen = false;
	currentRoute: string = '';

	constructor(
		public authService: AuthService,
		private router: Router
	) {
		// Escuchar cambios de ruta
		this.router.events.subscribe(() => {
			this.currentRoute = this.router.url;
		});
	}

	ngOnInit() {
		this.currentRoute = this.router.url;

		if (!this.authService.getUser()) {
			this.authService.refreshUser();
		}
	}

	get usuario() {
		return this.authService.getUser();
	}

	// Navegación
	irAInicio() {
		this.router.navigate(['/inicio']);
	}

	irAMisTickets() {
		this.router.navigate(['/inicio/mis-tickets']);
	}

	irACrearTicket() {
		this.router.navigate(['/inicio/crear-ticket']);
	}

	// Menú mobile
	toggleMobileMenu() {
		this.isMobileMenuOpen = !this.isMobileMenuOpen;
	}

	closeMobileMenu() {
		this.isMobileMenuOpen = false;
	}

	// Cerrar menú mobile al hacer clic fuera
	@HostListener('document:click', ['$event'])
	onDocumentClick(event: MouseEvent) {
		const target = event.target as HTMLElement;
		if (!target.closest('.relative.md\\:hidden') && this.isMobileMenuOpen) {
			this.closeMobileMenu();
		}
	}

	// Obtener iniciales para el avatar
	getInitials(fullName: string | undefined): string {
		if (!fullName) return 'U';

		return fullName
			.split(' ')
			.map(name => name[0])
			.join('')
			.toUpperCase()
			.substring(0, 2);
	}

	// Clase CSS para botones de navegación activos
	getNavButtonClass(ruta: string): string {
		const isActive = this.router.url === ruta;
		// Si está activo: Fondo Cian muy suave (10%) y texto Azul Corporativo
		// Si inactivo: Texto gris slate, hover con fondo gris muy suave
		return isActive
			? 'bg-[#62CEEA]/10 text-[#002777]'
			: 'text-slate-600 hover:bg-slate-50 hover:text-[#002777]';
	}

	isActive(ruta: string): boolean {
		return this.router.url === ruta;
	}

	recargar() {
		this.authService.refreshUser();
	}

	cerrarSesion() {
		this.authService.setUser(null);
		this.router.navigate(['/login']);
	}
}
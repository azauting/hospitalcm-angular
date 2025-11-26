import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';  // ← IMPORTANTE
import { AuthService } from '../../../core/services/auth/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule],  // ← AGREGA CommonModule AQUÍ
  templateUrl: './login.html',
})
export class LoginComponent {


  correo = '';
  contrasena = '';
  recordarSesion = false;

  loading = false;
  errorMsg = '';

  // Año actual para el footer
  currentYear = new Date().getFullYear();

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    // Cargar credenciales guardadas si "recordar sesión" estaba activado
    this.cargarCredencialesGuardadas();
  }

  /**
   * Carga las credenciales guardadas en localStorage si existen
   */
  private cargarCredencialesGuardadas(): void {
    const credencialesGuardadas = localStorage.getItem('hospital_credenciales');
    if (credencialesGuardadas) {
      const credenciales = JSON.parse(credencialesGuardadas);
      this.correo = credenciales.correo || '';
      this.contrasena = credenciales.contrasena || '';
      this.recordarSesion = true;
    }
  }

  /**
   * Guarda las credenciales en localStorage
   */
  private guardarCredenciales(): void {
    if (this.recordarSesion) {
      const credenciales = {
        correo: this.correo,
        contrasena: this.contrasena
      };
      localStorage.setItem('hospital_credenciales', JSON.stringify(credenciales));
    } else {
      localStorage.removeItem('hospital_credenciales');
    }
  }



  /**
   * Valida el formato del correo institucional
   */
  private validarCorreoInstitucional(correo: string): boolean {
    const dominioValido = /@hospital.cl$/i;
    return dominioValido.test(correo);
  }

  /**
   * Maneja el envío del formulario de login
   */
  onSubmit(): void {
    // Validaciones básicas
    if (!this.correo || !this.contrasena) {
      this.errorMsg = 'Por favor, completa todos los campos';
      return;
    }

    // Validar formato de correo institucional
    if (!this.validarCorreoInstitucional(this.correo)) {
      this.errorMsg = 'Por favor, usa tu correo institucional del hospital (@hospital.puntaarenas.cl)';
      return;
    }

    this.loading = true;
    this.errorMsg = '';

    this.authService.login(this.correo, this.contrasena).subscribe({
      next: (resp: any) => {
        this.loading = false;

        if (resp?.success) {
          const user = resp.data?.user;
          this.authService.setUser(user);

          // Guardar credenciales si el usuario marcó "recordar sesión"
          this.guardarCredenciales();

          // Redirigir según rol con mensajes personalizados
          this.redirigirSegunRol(user);
        } else {
          this.errorMsg = resp?.message || 'Error al iniciar sesión. Por favor, verifica tus credenciales.';
        }
      },
      error: (err) => {
        this.loading = false;

        // Mensajes de error más específicos
        if (err.status === 0) {
          this.errorMsg = 'Error de conexión. Verifica tu conexión a internet.';
        } else if (err.status === 401) {
          this.errorMsg = 'Credenciales incorrectas. Por favor, verifica tu correo y contraseña.';
        } else if (err.status === 500) {
          this.errorMsg = 'Error del servidor. Por favor, contacta al soporte técnico.';
        } else {
          this.errorMsg = 'Error inesperado. Intenta nuevamente o contacta soporte.';
        }

        console.error('Error en login:', err);
      }
    });
  }


  /**
   * Redirige al usuario según su rol con lógica mejorada
   */
  private redirigirSegunRol(user: any): void {
    const rol = user.nombre_rol?.toLowerCase();

    switch (rol) {
      case 'solicitante':
        this.router.navigate(['/inicio']);
        console.log('Redirigiendo a panel de solicitante');
        break;

      case 'soporte':
        this.router.navigate(['/soporte']);
        console.log('Redirigiendo a panel de soporte técnico');
        break;

      case 'administrador':
        this.router.navigate(['/admin']);
        console.log('Redirigiendo a panel administrativo');
        break;
      default:
        console.warn('Rol no reconocido:', rol);
        this.router.navigate(['/']);
        break;
    }
  }

  /**
   * Limpia el mensaje de error cuando el usuario empieza a escribir
   */
  onInputChange(): void {
    if (this.errorMsg) {
      this.errorMsg = '';
    }
  }
}
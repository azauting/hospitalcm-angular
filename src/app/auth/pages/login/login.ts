import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth/auth.service';
import { finalize } from 'rxjs';

// 1. Importamos el servicio
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './login.html',
})
export class LoginComponent {

  correo = '';
  contrasena = '';
  recordarSesion = false;
  loading = false;

  currentYear = new Date().getFullYear();

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastr: ToastrService
  ) {
    this.cargarCredencialesGuardadas();
  }

  private cargarCredencialesGuardadas(): void {
    const creds = localStorage.getItem('hospital_credenciales');
    if (creds) {
      const data = JSON.parse(creds);
      this.correo = data.correo || '';
      this.contrasena = data.contrasena || '';
      this.recordarSesion = true;
    }
  }

  private guardarCredenciales(): void {
    if (this.recordarSesion) {
      localStorage.setItem('hospital_credenciales', JSON.stringify({
        correo: this.correo,
        contrasena: this.contrasena
      }));
    } else {
      localStorage.removeItem('hospital_credenciales');
    }
  }

  private validarCorreoInstitucional(correo: string): boolean {
    // const dominioValido = /@hospital.cl$/i; 
    // return dominioValido.test(correo);
    return true; 
  }

  onSubmit(): void {
    // 1. Validaciones
    if (!this.correo || !this.contrasena) {
      this.toastr.warning('Por favor completa todos los campos', 'Atención');
      return;
    }

    if (!this.validarCorreoInstitucional(this.correo)) {
      this.toastr.warning('Debes usar tu correo institucional', 'Correo inválido');
      return;
    }

    this.loading = true;

    this.authService.login(this.correo, this.contrasena)
      .pipe(
        finalize(() => this.loading = false)
      )
      .subscribe({
        next: (resp: any) => {
          if (resp?.success) {
            // LOGIN EXITOSO
            const user = resp.data?.user;
            this.authService.setUser(user);
            this.guardarCredenciales();
            
            // Mensaje de éxito
            this.toastr.success(`Bienvenido, ${user.nombre_completo || 'Usuario'}`, 'Acceso Correcto');

            this.redirigirSegunRol(user);
          } else {
            // LOGIN FALLIDO (Lógica de negocio: contraseña mal, usuario inactivo, etc.)
            this.toastr.error(resp?.message || 'Credenciales inválidas', 'Error de Acceso');
          }
        },
        error: (err) => {
          // ERROR DE RED O SERVIDOR
          let msg = 'No se pudo conectar con el servidor';
          if (err.status === 401) msg = 'Credenciales incorrectas';
          if (err.status >= 500) msg = 'Error interno del sistema';
          
          this.toastr.error(msg, 'Error');
          console.error(err);
        }
      });
  }

  private redirigirSegunRol(user: any): void {
    // Pequeño delay para que se alcance a apreciar el Toast verde
    setTimeout(() => {
        const rol = user.nombre_rol?.toLowerCase();
        switch (rol) {
        case 'solicitante': this.router.navigate(['/inicio']); break;
        case 'soporte': this.router.navigate(['/soporte']); break;
        case 'administrador': this.router.navigate(['/admin']); break;
        default: this.router.navigate(['/']); break;
        }
    }, 500);
  }
}
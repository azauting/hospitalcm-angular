import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-solicitante-inicio',
  standalone: true,
  templateUrl: './inicio.html',
})
export class SolicitanteInicioComponent {
  constructor(private router: Router) {}
  irACrearTicket() {
    this.router.navigate(['/solicitante/crear-ticket']);
  }
}
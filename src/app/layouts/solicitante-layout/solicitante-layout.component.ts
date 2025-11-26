import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SolicitanteNavbarComponent } from '../../shared/components/solicitante-navbar/solicitante-navbar';

@Component({
    selector: 'app-solicitante-layout',
    standalone: true,
    imports: [RouterModule, SolicitanteNavbarComponent],
    templateUrl: './solicitante-layout.component.html',
})
export class SolicitanteLayoutComponent { }
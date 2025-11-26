import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SideBarMovementsComponent } from '../../shared/components/sidebar-movimientos/sidebar-movimientos';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar';

@Component({
    selector: 'app-soporte-layout',
    standalone: true,
    imports: [RouterModule, SidebarComponent, SideBarMovementsComponent],
    templateUrl: './soporte-layout.component.html',
})
export class SoporteLayoutComponent { }

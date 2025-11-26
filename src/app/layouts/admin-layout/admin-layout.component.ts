import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SideBarMovementsComponent } from '../../shared/components/sidebar-movimientos/sidebar-movimientos';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar';
@Component({
    selector: 'app-admin-layout',
    standalone: true,
    imports: [RouterModule, SidebarComponent, SideBarMovementsComponent],
    templateUrl: './admin-layout.component.html',
})
export class AdminLayoutComponent { }
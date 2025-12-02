import { Routes } from '@angular/router';

import { LoginComponent } from './auth/pages/login/login';

import { SolicitanteInicioComponent } from './features/solicitante/pages/inicio/inicio';
import { MyTicketsComponent } from './features/solicitante/pages/mis-tickets/mis-tickets';
import { AdminDashboardComponent } from './features/admin/pages/dashboard/dashboard';
import { AdminTicketsUnreviewedComponent } from './features/admin/pages/tickets-sin-revisar/tickets-sin-revisar';
import { AdminTicketReviewComponent } from './features/admin/pages/ticket-revisar/ticket-revisar';
import { UsuariosSolicitantesComponent } from './features/admin/pages/usuarios-solicitantes/usuarios-solicitantes';
import { TicketsAssignedBySupportComponent } from './features/soporte/pages/tickets-asignados-por-soporte/tickets-asignados-por-soporte';
import { UsuariosSoportesComponent } from './features/admin/pages/usuarios-soportes/usuarios-soportes';
import { LocationsComponent} from './features/admin/pages/ubicaciones/ubicaciones';
import { EventTypeComponent } from './features/admin/pages/tipo_evento/tipo-evento';
// layouts
import { AdminLayoutComponent } from './layouts/admin-layout/admin-layout.component';
import { SoporteLayoutComponent } from './layouts/soporte-layout/soporte-layout.component';
import { SolicitanteLayoutComponent } from './layouts/solicitante-layout/solicitante-layout.component';
// compartidos
import { CrearTicketComponent } from './shared/pages/crear-ticket/crear-ticket';
import { TicketDetalleComponent } from './features/solicitante/pages/ticket-detalle/ticket-detalle';
import { TicketsReviewedComponent } from './shared/pages/tickets-revisados/tickets-revisados';
import { TicketDetailStaff } from './shared/pages/ticket-detalle-staff/ticket-detalle-staff';
import { TicketsCerradosComponent } from './shared/pages/tickets-cerrados/tickets-cerrados';


export const routes: Routes = [
    // rutas de autenticación
    {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full',
    },
    {
        path: 'login',
        component: LoginComponent,
    },
    {
        path: 'inicio',
        component: SolicitanteLayoutComponent,
        children: [
            { path: '', component: SolicitanteInicioComponent },
            { path: 'crear-ticket', component: CrearTicketComponent },
            { path: 'mis-tickets', component: MyTicketsComponent },
            { path: 'ticket/:id', component: TicketDetalleComponent },
        ]
    },
    {
        path: 'soporte',
        component: SoporteLayoutComponent,
        children: [
            { path: '', component: TicketsReviewedComponent },
            { path: 'mis-tickets', component: TicketsAssignedBySupportComponent },
            { path: 'crear-ticket', component: CrearTicketComponent },
            { path: 'ticket/:id', component: TicketDetailStaff },
        ]
    },
    {
        path: 'admin',
        component: AdminLayoutComponent,
        children: [
            { path: '', component: AdminDashboardComponent },
            { path: 'tickets/sin-revisar', component: AdminTicketsUnreviewedComponent },
            { path: 'ticket/:id/sin-revisar', component: AdminTicketReviewComponent },
            { path: 'tickets/revisados', component: TicketsReviewedComponent },
            { path: 'tickets/cerrados', component: TicketsCerradosComponent },
            { path: 'ticket/:id', component: TicketDetailStaff },
            { path: 'crear-ticket', component: CrearTicketComponent },
            { path: 'solicitantes', component: UsuariosSolicitantesComponent },
            { path: 'soportes', component: UsuariosSoportesComponent },
            { path: 'ubicaciones', component: LocationsComponent },
            { path: 'tipos-evento', component: EventTypeComponent },
        ]
    },
];

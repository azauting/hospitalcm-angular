import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideToastr } from 'ngx-toastr';
import { provideAnimations } from '@angular/platform-browser/animations';
import { environment } from './environments/environment';
import localeEs from '@angular/common/locales/es';
import { registerLocaleData } from '@angular/common';
import { LOCALE_ID } from '@angular/core';


import { App } from './app/app';
import { routes } from './app/app.routes';

registerLocaleData(localeEs);

bootstrapApplication(App, {
  providers: [
    provideRouter(routes),
    provideHttpClient(),
    provideAnimations(),

    provideToastr(
      { positionClass: 'toast-top-right', preventDuplicates: true },
    ),
    { provide: 'API_URL', useValue: environment.apiUrl },
    { provide: 'WITH_CREDENTIALS', useValue: environment.withCredentials },
    { provide: LOCALE_ID, useValue: 'es-CL' }
  ]
});



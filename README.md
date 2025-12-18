# Gestion de incidencias TI

## Estructura Principal del Proyecto (`src/app`)

Para mantener el orden, la estructura del codigo fue hecha de la siguiente forma

* **`core/`**: Aqui están los servicios que conectan con la API 
* **`features/`**: Contenido dividido por el rol del usuario
* `admin/`: Gestion de usuarios, unidades y dashboards
* `solicitante/`: Vistas para personal médico (crear requerimientos)
* `soporte/`: Vistas para técnicos que resuelven los tickets


* **`layouts/`**: Estructuras visuales base para cada rol
* **`shared/`**: Componentes reutilizables (Sidebar, Navbar) y páginas comunes como el detalle de un ticket
* **`auth/`**: Todo el flujo de inicio de sesión

---


## Comandos de Desarrollo 

### Iniciar servidor local

```bash
bun ng serve

```

Entra a `http://localhost:4200/`. La app se recarga sola al guardar cambios.

### Generar nuevos componentes

```bash
bun ng generate component nombre-del-componente

```

### Compilar para producción

```bash
bun ng build

```

---

## Que se puede hacer

* se puede explicar un paso a paso de como se debe instalar
* explicar flujos importantes
* roles
* etc
* Al final que se entiendas los flujos principales de cada rol en la explicacion con la funciones etc


1. **Configuracion inicial:**
* Instala Bun en tu equipo si no lo tienes.
* Ejecuta `bun install` para descargar las dependencias.


2. **Variables de entorno:**
* Revisa `src/environments/environment.ts` y asegúrate de que la URL de la API apunte a tu servidor local de backend


3. **Exploracion de rutas:**
* Abre `src/app/app.routes.ts` para entender cómo están conectadas las páginas de Admin, Soporte y Solicitante


4. **Estilos:**
* Estamos usando **Tailwind CSS**. Antes de crear estilos nuevos, revisa si puedes usar clases existentes en el HTML para mantener la consistencia



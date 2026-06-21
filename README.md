# Frontend — Módulo de Psicología Clínica y General (UCE)

React 19 + Vite + TypeScript + Tailwind.

## Cómo correrlo

```bash
npm install
cp .env.test .env
npm run dev
```

Abre http://localhost:5173 — vas a ver la página pública de inicio.

## Flujo de pantallas

```
/                  página pública: quiénes somos, servicios, ubicación, contacto
/ingresar          login (acepta ?servicio=CLINICA|GENERAL para mostrar contexto)
/registro          registro de estudiante, con checkboxes obligatorios de
                    Términos y Condiciones + consentimiento de datos (LOPDP)
/terminos          texto de términos — ES UN BORRADOR, falta validación legal/UCE
/mi-solicitud       vista del estudiante tras registrarse (placeholder, sin
                    lógica real de asignación de citas todavía)
/cambiar-contrasena cambio de contraseña obligatorio (HU-03)
/dashboard          panel del personal (ADMIN / PSICOLOGO / COORDINADOR)
```

Cuentas de prueba (modo mock, sin backend):

| Correo | Contraseña | Rol |
| --- | --- | --- |
| admin@uce.edu.ec | Admin123 | ADMIN |
| psicologo@uce.edu.ec | Psico123 | PSICOLOGO |
| coordinador@uce.edu.ec | Coord123 | COORDINADOR (fuerza cambio de contraseña) |
| estudiante@uce.edu.ec | Estud123 | ESTUDIANTE |

## Cómo está organizado

```
src/
  api/
    client.ts        cliente Axios con interceptor de JWT (para cuando haya backend)
    mockData.ts       usuarios de prueba (bórralos cuando conectes el backend)
    authService.ts     login()/registrar()/logout() — AQUÍ se decide mock vs backend real
  auth/
    AuthContext.tsx    sesión global: usuario actual, iniciarSesion, registrarse, cerrarSesion
  routes/
    PrivateRoute.tsx   protege rutas; redirige a /ingresar o /no-autorizado
    AppRoutes.tsx       mapa de rutas de toda la app (públicas + privadas)
  pages/
    public/            HomePage, TermsPage (sitio público)
    auth/              LoginPage, RegisterPage, ChangePasswordPage
    estudiante/        MiSolicitud (placeholder)
    dashboard/         DashboardHome (panel de personal)
  components/
    public/            PublicHeader (navbar del sitio público)
    layout/            AppLayout (sidebar + topbar internos, menú por rol)
  lib/
    validators.ts      esquemas Zod para los formularios
  types/
    auth.ts            Usuario, Rol, SesionAuth, LoginCredenciales, RegistroDatos
```
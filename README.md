# Frontend — Plataforma de Telemedicina (Psicología) UCE

Aplicación React + Vite + TypeScript que consume el backend Spring Boot
`psicologia-clinica-backend`.

## Requisitos

- Node.js 20 LTS (o superior)
- npm 10+ (viene con Node)

## Configuración

Crea un archivo `.env` en la raíz del proyecto (ya viene uno como `.env.example`):

```
VITE_API_URL=http://localhost:8080/api/v1
VITE_USE_MOCK=false
```

- `VITE_API_URL` debe apuntar al backend incluyendo el sufijo `/api/v1`.
- `VITE_USE_MOCK=true` activa el modo simulado (sin backend) — usado solo en
  fases tempranas de desarrollo o demos sin red.

## Ejecutar en desarrollo

```bash
npm install
npm run dev
```

La app queda en http://localhost:5173.

## Construir para producción

```bash
npm run build
```

El bundle estático queda en `dist/`, listo para servirse con Nginx o cualquier
servidor estático.

## Estructura

```
src/
├── api/
│   ├── client.ts            ← axios + interceptors + refresh token
│   ├── authService.ts       ← login, registro, logout, change password
│   ├── fichaService.ts      ← plantilla para los demás servicios
│   └── mockData.ts          ← usuarios de prueba para modo mock
├── auth/
│   └── AuthContext.tsx      ← contexto + restauración de sesión
├── components/              ← layout y header público
├── lib/
│   └── validators.ts        ← schemas Zod
├── pages/                   ← páginas por dominio
├── routes/                  ← rutas y protección por rol
└── types/
    └── auth.ts              ← tipos backend + tipos frontend + mappers
```

## Patrón de capa de servicios

Los componentes React **nunca** llaman a `apiClient` directamente. Llaman a
funciones de un servicio (`authService`, `fichaService`, etc.). Cada servicio:

1. Define los tipos del backend (espejo del DTO Java).
2. Define los tipos del frontend (lo que la UI usa).
3. Define funciones mapper entre ambos.
4. Expone métodos asíncronos que la UI consume.

Esto centraliza interceptors, manejo de errores y refresh token en un solo
lugar, y permite cambiar el backend sin tocar las páginas.

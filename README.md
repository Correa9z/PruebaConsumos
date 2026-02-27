# Prueba

Monorepo: **apps/web** (React) y **apps/api** (Next.js). Arquitectura hexagonal en el backend.

## Estructura

```
prueba/
├── apps/
│   ├── api/        # Backend Next.js – domain, application, infrastructure en src/
│   └── web/        # Frontend React (Vite)
├── packages/       # (futuro: shared-types, ocr-migration)
├── docker/         # Configuración Docker
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

## Requisitos

- Node >= 20
- pnpm

## Comandos

```bash
pnpm install
pnpm dev          # ambas apps
pnpm dev:api      # API en 3001
pnpm dev:web      # Web en 3000
pnpm build
pnpm lint
```

## Apps

| App | Puerto | Descripción                |
|-----|--------|----------------------------|
| web | 3000   | SPA React (Vite)           |
| api | 3001   | API Next.js (hexagonal)   |

La web hace proxy de `/api` al backend en desarrollo.

Ver **PLAN_MAESTRO.md** para el plan de construcción por fases.

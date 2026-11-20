# Design System — Eco Aventura (RentFlow PWA)

## Product Context
- **Surface Mode:** `Operate` (gestión en tiempo real de alquiler de rodados y bienes náuticos en pista, caja diaria y flota).
- **Platform:** Web PWA Mobile-First (`index.html`, React 19, Tailwind CSS v3).
- **Language:** Español (Argentina).

## Visual Palette & Tokens (`tailwind.config.js`)
| Token | Hex | Uso |
|-------|-----|-----|
| `eco.cream` | `#FAF6E8` / `#FAF5E4` | Fondo cálido principal de la aplicación y headers de modales |
| `eco.card` | `#FFFFFF` | Superficie principal de tarjetas y modales |
| `eco.surface` | `#F6F3EA` | Superficies secundarias, inputs, chips inactivos y bloques de resumen |
| `eco.dark` | `#1C1C1C` | Texto principal, botones primarios, pills activos, badges de unidad |
| `eco.creamMuted` | `#71706B` | Texto secundario, etiquetas y placeholders |
| `eco.creamDark` | `#52514E` | Texto de apoyo con mayor contraste |
| `eco.gold` | `#F7D147` | Acento principal de marca, alertas de garantía, botón *Reservar* / *Info Rafting* |
| `eco.leaf` | `#16A34A` | Estado activo / disponible / en tiempo |

### Semáforo Operativo (`RentalCard`)
- **WAITING (`LISTO PARA INICIAR`):** Borde y badge `#F7D147`, caja de tiempo `#F9E27D/55`.
- **GREEN (`EN TIEMPO`):** Badge `#DCFCE7` / `#166534`, caja de tiempo `#1C1C1C` texto blanco.
- **YELLOW (`POR VENCER`, ≤ 5 min):** Borde `#F7D147`, badge `#FEF3C7` / `#92400E`.
- **RED (`TIEMPO CUMPLIDO`):** Borde y anillo `rose-500`, badge `#FEE2E2` / `#991B1B`, botón finalizar `rose-600` (sin rebotes ni animaciones competidoras).

## Typography
- **Font Family:** `Plus Jakarta Sans` (con fallback `sans-serif`).
- **Tabular Data:** Usar `font-mono` o `tabular-nums` en cronómetros, montos y porcentajes para evitar saltos de layout al actualizar cada segundo.

## Layout & Surfaces
- **Cards & Modals:** `rounded-[28px]`, borde `border-black/[0.06]` o `border-black/[0.08]`, sombra suave `shadow-[0_8px_30px_rgb(0,0,0,0.04)]`.
- **Pills & Buttons:** `rounded-full`, feedback táctil `active:scale-95` o `active:scale-[0.98]`.
- **Modals & Feedback:** Todos los diálogos implementan `role="dialog"` / `role="alertdialog"`, `aria-modal="true"`, cierre con `Escape` (`useEscapeKey`), cierre por backdrop y notificaciones no bloqueantes vía `uiFeedback` (`FeedbackHost`).

## Motion & Accessibility
- Respetar `@media (prefers-reduced-motion: reduce)` en `src/index.css`.
- Evitar `animate-bounce` y animaciones simultáneas en un mismo elemento.
- Permitir zoom en móviles (`viewport` sin `user-scalable=no`).

# 🌿 Eco Aventura - Gestión de Alquileres en Tiempo Real

> **Aplicación Web Progresiva (PWA) Mobile-First** diseñada para reemplazar planillas de cálculo y cuadernos manuales en la gestión de alquileres temporales de bienes rodantes y náuticos (**Kartings a pedal, Kayaks, Monopatines eléctricos, Cuadriciclos / Carritos familiares**) para **Eco Aventura**. Con paleta botánica de lujo: *Dark Emerald Green* (`#02110c`), *Olive Green* (`#1a422f`) y *Cream Beige* (`#f3ebd6`).

---

## 🚀 Características Principales

### 1. Tablero de Control en Tiempo Real (Semáforo Dinámico)
- **Verde**: Más de 5 minutos restantes.
- **Amarillo**: Menos de 5 minutos restantes (aviso sonoro preventivo y parpadeo).
- **Rojo Intermitente**: Tiempo cumplido o en mora. Muestra los minutos exactos de demora transcurridos y el recargo sugerido según la tarifa por minuto de la categoría.
- **Alertas Auditivas Nativas**: Sintetizador mediante **Web Audio API** (doble beep de advertencia y alarma de finalización) sin requerir descarga de archivos MP3 externos.
- **Botón "+15 min"**: Extensión rápida de tiempo con un solo toque.

### 2. Módulo de Finalización y Cobro Rápido
- **Alerta Crítica Destacada**: 
  > 🚨 **"RECORDAR DEVOLVER DOCUMENTO DE IDENTIDAD / GARANTÍA"**
  Muestra de forma destacada el casillero físico asignado (`Casillero 04`, `Caja B-2`), el tipo de documento retenido (`DNI`, `Licencia`, etc.) y la fotografía del documento si fue tomada.
- **Cálculo Automático de Mora**: Sugiere el monto por tiempo excedido con inputs rápidos para ajustar bonificaciones o recargos.
- **Desglose de Liquidación**: Tarifa base + Recargo - Descuento = **Total a Cobrar**.
- **Liberación Inmediata**: Al confirmar el cobro, registra el ingreso en caja, dispara confetti visual y libera la unidad en la flota de forma automática.

### 3. Asignación Express "Nuevo Alquiler"
- **Selectores Visuales**: Categorías con badge de stock en tiempo real. Si no hay stock disponible, la categoría se deshabilita automáticamente con la etiqueta `Sin Stock`.
- **Botones de Duración Predefinida**: `[30 min]`, `[1 hora]`, `[Personalizado]`.
- **Registro Rápido de Garantía**: Tipo de documento (`DNI`, `Licencia`, `Pasaporte`), selector rápido de casillero físico (`C-01` a `C-08` o texto personalizado) y botón de captura fotográfica rápida con la cámara del smartphone.
- **Selección de Método de Pago**: `[Efectivo]`, `[Transferencia]`, `[Tarjeta]`.

### 4. Control de Flota e Inventario
- Vista integral de unidades: **Disponibles**, **En Alquiler**, **En Mantenimiento (Taller)** y **Fuera de Servicio (Baja)**.
- Cambio de estado en 1 toque.
- Alta rápida de nuevas unidades con número de código (`K-05`, `KY-04`), categoría y notas técnicas.

### 5. Caja Diaria y Arqueo de Turno
- Balance en tiempo real: Desglose entre **Efectivo Físico en Mano**, **Transferencias (Bancos / MP)** y **Tarjetas**.
- Formulario express de **Egreso / Gasto Menor** (Combustible, Repuestos, Insumos, Viáticos).
- **Arqueo y Cierre de Turno**: Generador de reporte formateado para WhatsApp con un botón directo `Copiar Texto` y `Enviar a WhatsApp`.

### 6. Métricas y Estadísticas
- Facturación total acumulada y ticket promedio por salida.
- Ranking de categorías y top 5 unidades más demandadas.
- Histograma de franjas horarias con indicación de **Hora Pico**.

---

## 🛠️ Stack Tecnológico

- **Frontend**: React 19 + TypeScript + Vite
- **Estilos**: Tailwind CSS (Tailwind 3 Mobile-First, viewport safe-area insets, animaciones pulse)
- **Iconos**: Lucide React
- **Audio y Háptica**: Web Audio API (sintetizador de ondas osciladoras) + Vibration API
- **Persistencia**: Dual-Persistence Engine (Almacenamiento Offline First con `localStorage` reactivo + Conector directo a **Supabase PostgreSQL & Realtime**)

---

## 📦 Ejecución Local

### Prerrequisitos
- Node.js v18 o superior
- npm o pnpm

### Pasos
```bash
# 1. Ingresar al directorio del proyecto
cd rentflow-pwa

# 2. Instalar dependencias
npm install

# 3. Iniciar el servidor de desarrollo Vite
npm run dev
```

La aplicación quedará disponible en `http://localhost:5173/` (o el puerto asignado). Para probarla desde un celular conectado a la misma red WiFi, abre la URL de red indicada en la consola (ej. `http://192.168.1.X:5173/`).

---

## 🌐 Despliegue en Producción (100% Gratuito)

### Opción A: Frontend en Vercel
1. Sube este repositorio a **GitHub**.
2. Ingresa a [Vercel](https://vercel.com) e inicia sesión con GitHub.
3. Haz clic en **Add New Project** y selecciona el repositorio `rentflow-pwa`.
4. En la configuración de Build & Output Settings:
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. Haz clic en **Deploy**. ¡Tu PWA estará disponible en una URL `https://tu-app.vercel.app` en menos de 1 minuto!

### Opción B: Base de Datos en Supabase (Opcional para sincronización multi-dispositivo)
1. Crea un proyecto gratuito en [Supabase](https://supabase.com).
2. Ve a la sección **SQL Editor** en el panel de Supabase.
3. Copia y pega el contenido del archivo [`supabase_schema.sql`](./supabase_schema.sql) que incluye:
   - Tablas `categories`, `units`, `rentals`, `cash_movements`.
   - Triggers automáticos para liberar y reservar unidades.
   - Políticas de seguridad RLS.
   - Activación del canal `supabase_realtime`.
   - Semilla inicial de datos.
4. En la app RentFlow, ve al ícono de engranaje ⚙️ (Configuración), pestaña **Supabase / Cloud**, ingresa la **URL del Proyecto** y la **Anon Public Key**, y presiona **Guardar**.

---

## 📱 Instalación como App Nativa en Smartphone (PWA)

1. Abre la URL en el navegador de tu teléfono (**Chrome** en Android o **Safari** en iOS).
2. **En Android**: Presiona los 3 puntos superiores y selecciona **"Instalar aplicación"** o **"Añadir a la pantalla de inicio"**.
3. **En iPhone (iOS)**: Presiona el botón de **Compartir** (cuadrado con flecha hacia arriba) y selecciona **"Agregar al inicio"** (+).
4. La aplicación funcionará a pantalla completa como una aplicación móvil nativa.

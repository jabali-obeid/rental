-- ==================================================================================
-- ECO AVENTURA PWA - ESQUEMA DE BASE DE DATOS COMPLETO (SUPABASE / POSTGRESQL)
-- Sistema Mobile-First de Gestión en Tiempo Real de Alquiler de Rodados y Náutica
-- ==================================================================================

-- 1. EXTENSIONES REQUERIDAS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLA: CATEGORÍAS DE BIENES (Eco Aventura)
CREATE TABLE IF NOT EXISTS public.categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    icon TEXT NOT NULL DEFAULT 'Bike',
    color TEXT NOT NULL DEFAULT '#10b981',
    default_rate_30m NUMERIC(10, 2) NOT NULL DEFAULT 18000.00,
    default_rate_60m NUMERIC(10, 2) NOT NULL DEFAULT 32000.00,
    penalty_rate_10min NUMERIC(10, 2) NOT NULL DEFAULT 6000.00,
    penalty_rate_per_min NUMERIC(10, 2) NOT NULL DEFAULT 600.00,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. TABLA: UNIDADES / INVENTARIO FLOTA
CREATE TABLE IF NOT EXISTS public.units (
    id TEXT PRIMARY KEY,
    category_id TEXT NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    code_number TEXT NOT NULL,
    name TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('disponible', 'alquilado', 'mantenimiento', 'baja')) DEFAULT 'disponible',
    current_rental_id TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_category_code UNIQUE (category_id, code_number)
);

-- 4. TABLA: ALQUILERES (HISTORIAL Y ACTIVOS)
CREATE TABLE IF NOT EXISTS public.rentals (
    id TEXT PRIMARY KEY,
    unit_id TEXT NOT NULL REFERENCES public.units(id) ON DELETE RESTRICT,
    category_id TEXT NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    start_time TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    duration_minutes INTEGER NOT NULL DEFAULT 30,
    expected_end_time TIMESTAMPTZ NOT NULL,
    actual_end_time TIMESTAMPTZ,
    status TEXT NOT NULL CHECK (status IN ('activo', 'finalizado', 'cancelado')) DEFAULT 'activo',
    
    -- Control de garantía y documentos físicos
    doc_type TEXT NOT NULL DEFAULT 'DNI' CHECK (doc_type IN ('DNI', 'Licencia', 'Pasaporte', 'Cédula', 'Llaves', 'Otro')),
    doc_locker TEXT NOT NULL, -- Ej: Casillero 04
    doc_photo_url TEXT,
    
    -- Liquidación y cobranza
    base_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    penalty_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    discount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    total_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    payment_method TEXT NOT NULL CHECK (payment_method IN ('efectivo', 'transferencia', 'tarjeta', 'mixto')) DEFAULT 'efectivo',
    payment_details JSONB DEFAULT '{}'::jsonb,
    
    notes TEXT,
    created_by TEXT DEFAULT 'Operador Eco Aventura',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Relación diferida de unidad hacia su alquiler activo
ALTER TABLE public.units 
    DROP CONSTRAINT IF EXISTS fk_unit_current_rental;
ALTER TABLE public.units 
    ADD CONSTRAINT fk_unit_current_rental 
    FOREIGN KEY (current_rental_id) REFERENCES public.rentals(id) ON DELETE SET NULL;

-- 5. TABLA: CAJA DIARIA Y MOVIMIENTOS
CREATE TABLE IF NOT EXISTS public.cash_movements (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('ingreso_alquiler', 'ingreso_recargo', 'egreso_gasto', 'apertura_caja', 'cierre_caja')),
    category TEXT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    payment_method TEXT NOT NULL CHECK (payment_method IN ('efectivo', 'transferencia', 'tarjeta', 'mixto')) DEFAULT 'efectivo',
    rental_id TEXT REFERENCES public.rentals(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    registered_by TEXT NOT NULL DEFAULT 'Operador',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5.1 TABLA: HISTORIAL DE CIERRES DE CAJA Y ARQUEOS DIARIOS
CREATE TABLE IF NOT EXISTS public.daily_closings (
    id TEXT PRIMARY KEY,
    closed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    closed_by TEXT NOT NULL DEFAULT 'Operador',
    date_label TEXT NOT NULL,
    total_rentals INTEGER NOT NULL DEFAULT 0,
    total_efectivo NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    total_transferencia NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    total_tarjeta NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    total_ingresos NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    total_egresos NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    balance_neto NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    notes TEXT,
    movements_snapshot JSONB NOT NULL DEFAULT '[]'::jsonb,
    rentals_snapshot JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. ÍNDICES DE RENDIMIENTO
CREATE INDEX IF NOT EXISTS idx_rentals_status_expected ON public.rentals (status, expected_end_time);
CREATE INDEX IF NOT EXISTS idx_rentals_created_at ON public.rentals (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_units_status ON public.units (status);
CREATE INDEX IF NOT EXISTS idx_units_category ON public.units (category_id);
CREATE INDEX IF NOT EXISTS idx_cash_movements_created ON public.cash_movements (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_daily_closings_closed_at ON public.daily_closings (closed_at DESC);

-- 7. VISTA RESUMIDA DE OCUPACIÓN Y FLOTA (Security Invoker para evitar alertas de seguridad)
CREATE OR REPLACE VIEW public.v_fleet_realtime_status
WITH (security_invoker = true) AS
SELECT 
    c.id AS category_id,
    c.name AS category_name,
    c.icon AS category_icon,
    c.color AS category_color,
    COUNT(u.id) AS total_units,
    COUNT(CASE WHEN u.status = 'disponible' THEN 1 END) AS available_units,
    COUNT(CASE WHEN u.status = 'alquilado' THEN 1 END) AS rented_units,
    COUNT(CASE WHEN u.status = 'mantenimiento' THEN 1 END) AS maintenance_units
FROM public.categories c
LEFT JOIN public.units u ON u.category_id = c.id
WHERE c.is_active = true
GROUP BY c.id, c.name, c.icon, c.color;

-- 8. HABILITAR SUPABASE REALTIME
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.rentals;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.units;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.cash_movements;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.categories;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.daily_closings;
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN undefined_object THEN NULL;
END $$;

-- 9. SEGURIDAD Y POLÍTICAS RLS (Acceso habilitado)
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rentals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_closings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public and auth access to categories" ON public.categories;
CREATE POLICY "Public and auth access to categories" ON public.categories FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public and auth access to units" ON public.units;
CREATE POLICY "Public and auth access to units" ON public.units FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public and auth access to rentals" ON public.rentals;
CREATE POLICY "Public and auth access to rentals" ON public.rentals FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public and auth access to cash_movements" ON public.cash_movements;
CREATE POLICY "Public and auth access to cash_movements" ON public.cash_movements FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public and auth access to daily_closings" ON public.daily_closings;
CREATE POLICY "Public and auth access to daily_closings" ON public.daily_closings FOR ALL USING (true) WITH CHECK (true);

-- 10. CARGA INICIAL DE CATEGORÍAS (Tarifas y Mora en bloques de 10 min de Eco Aventura)
INSERT INTO public.categories (id, name, slug, icon, color, default_rate_30m, default_rate_60m, penalty_rate_10min, penalty_rate_per_min)
VALUES
    ('c-kartings', 'Kartings a Pedal', 'kartings', 'Car', '#f97316', 18000.00, 32000.00, 6000.00, 600.00),
    ('c-carritos-simples', 'Carritos Familiares Simples', 'carritos-simples', 'Users', '#10b981', 22000.00, 38000.00, 7500.00, 750.00),
    ('c-monopatines', 'Monopatines Eléctricos', 'monopatines', 'Zap', '#8b5cf6', 22000.00, 38000.00, 7500.00, 750.00),
    ('c-carritos-dobles', 'Carritos Familiares Dobles', 'carritos-dobles', 'Users', '#eab308', 28000.00, 48000.00, 9500.00, 950.00),
    ('c-kayaks', 'Kayaks (Dobles/Simples)', 'kayaks', 'Ship', '#06b6d4', 20000.00, 35000.00, 7000.00, 700.00)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    default_rate_30m = EXCLUDED.default_rate_30m,
    default_rate_60m = EXCLUDED.default_rate_60m,
    penalty_rate_10min = EXCLUDED.penalty_rate_10min;

-- 11. CARGA INICIAL DE LA FLOTA COMPLETA (100% DISPONIBLE / 0 KM)
INSERT INTO public.units (id, category_id, code_number, name, status)
VALUES
    -- Kartings ($18.000 / 30m)
    ('u-k1', 'c-kartings', 'K-01', 'Karting Rojo GT', 'disponible'),
    ('u-k2', 'c-kartings', 'K-02', 'Karting Azul Pro', 'disponible'),
    ('u-k3', 'c-kartings', 'K-03', 'Karting Amarillo Sport', 'disponible'),
    ('u-k4', 'c-kartings', 'K-04', 'Karting Verde Turbo', 'disponible'),
    
    -- Carritos Simples ($22.000 / 30m)
    ('u-cs1', 'c-carritos-simples', 'CS-01', 'Carrito Simple 1', 'disponible'),
    ('u-cs2', 'c-carritos-simples', 'CS-02', 'Carrito Simple 2', 'disponible'),
    ('u-cs3', 'c-carritos-simples', 'CS-03', 'Carrito Simple 3', 'disponible'),

    -- Monopatines Eléctricos ($22.000 / 30m)
    ('u-mp1', 'c-monopatines', 'MP-01', 'Xiaomi Mi Pro #1', 'disponible'),
    ('u-mp2', 'c-monopatines', 'MP-02', 'Xiaomi Mi Pro #2', 'disponible'),
    ('u-mp3', 'c-monopatines', 'MP-03', 'Segway Ninebot Max', 'disponible'),

    -- Carritos Dobles ($28.000 / 30m)
    ('u-cd1', 'c-carritos-dobles', 'CD-01', 'Carrito Doble 1', 'disponible'),
    ('u-cd2', 'c-carritos-dobles', 'CD-02', 'Carrito Doble 2', 'disponible'),

    -- Kayaks ($20.000 / 30m)
    ('u-ky1', 'c-kayaks', 'KY-01', 'Kayak Doble Laguna', 'disponible'),
    ('u-ky2', 'c-kayaks', 'KY-02', 'Kayak Simple Delta', 'disponible'),
    ('u-ky3', 'c-kayaks', 'KY-03', 'Kayak Doble Explorer', 'disponible')
ON CONFLICT (id) DO NOTHING;

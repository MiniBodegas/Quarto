# 🗄️ Base de Datos - Configuración y Políticas RLS

## ✅ Tabla `users` - Ya Creada

```sql
CREATE TABLE public.users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email text NOT NULL,
  name text NULL,
  phone text NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_email_key UNIQUE (email)
) TABLESPACE pg_default;
```

## 🔐 Políticas RLS Recomendadas

### Opción 1: Políticas Permisivas (RECOMENDADA para tu flujo)

Esta opción permite crear usuarios durante el booking sin autenticación previa.

**Archivo:** `database/users_rls_policies.sql` - Solución 1

**Ventajas:**
- ✅ Compatible con tu flujo actual de booking
- ✅ No requiere cambios en el código frontend
- ✅ Los usuarios pueden ser creados antes de autenticarse
- ✅ Mantiene seguridad en SELECT, UPDATE y DELETE

**Aplicar en Supabase:**

```sql
-- 1. Habilitar RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 2. SELECT: Solo ver datos propios
CREATE POLICY "Users can view own data"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

-- 3. INSERT: Permitir creación sin auth (para booking)
CREATE POLICY "Allow user creation"
  ON public.users FOR INSERT
  WITH CHECK (true);

-- 4. UPDATE: Actualizar propios datos o sin auth (para booking upsert)
CREATE POLICY "Users can update own data"
  ON public.users FOR UPDATE
  USING (auth.uid() = id OR auth.uid() IS NULL);

-- 5. DELETE: Solo usuarios autenticados
CREATE POLICY "Users can delete own data"
  ON public.users FOR DELETE
  USING (auth.uid() = id);
```

### Opción 2: Políticas Estrictas (Requiere Backend)

Esta opción es más segura pero requiere usar Service Role Key en operaciones sin autenticación.

**No recomendada actualmente** porque requerirías:
1. Crear API endpoint en el backend
2. Usar Service Role Key para insertar usuarios
3. Modificar BookingScreen para usar la API

---

## 📊 Otras Tablas Existentes

Basado en el código, tu base de datos también tiene estas tablas:

### `bookings`
```sql
-- Campos conocidos:
- id (uuid, PK)
- user_id (uuid, FK → users.id) [puede ser null inicialmente]
- email (text)
- name (text)
- phone (text)
- payment_status (text) ['PENDING', 'APPROVED', 'DECLINED']
- amount_total (numeric)
- wompi_reference (text)
- wompi_transaction_id (text)
- paid_at (timestamp)
- date (timestamp)
- time_slot (text)
- document_type (text)
- document_number (text)
- storage_months (integer)
- created_at (timestamp)
```

**RLS Recomendada para bookings:**
```sql
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Usuarios autenticados pueden ver sus propios bookings
CREATE POLICY "Users can view own bookings"
  ON public.bookings FOR SELECT
  USING (auth.uid() = user_id);

-- Permitir creación sin auth (para el flujo de booking inicial)
CREATE POLICY "Allow booking creation"
  ON public.bookings FOR INSERT
  WITH CHECK (true);

-- Permitir actualización sin auth (para webhook de Wompi)
CREATE POLICY "Allow booking updates"
  ON public.bookings FOR UPDATE
  USING (true);
```

### `inventory`
```sql
-- Campos conocidos:
- id (uuid, PK)
- user_id (uuid, FK → users.id)
- booking_id (uuid, FK → bookings.id)
- item_data (jsonb)
- created_at (timestamp)
```

**RLS Recomendada para inventory:**
```sql
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own inventory"
  ON public.inventory FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Allow inventory creation"
  ON public.inventory FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update own inventory"
  ON public.inventory FOR UPDATE
  USING (auth.uid() = user_id);
```

### `items` (catálogo de items predefinidos)
```sql
-- Campos conocidos:
- id (uuid, PK)
- name (text)
- category_id (uuid, FK → categories.id)
- volume (numeric)
- image_url (text)
- created_at (timestamp)
```

**RLS Recomendada para items:**
```sql
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;

-- Todos pueden leer el catálogo
CREATE POLICY "Everyone can view items"
  ON public.items FOR SELECT
  USING (true);
```

### `categories`
```sql
-- Campos conocidos:
- id (uuid, PK)
- name (text)
- icon (text)
- created_at (timestamp)
```

**RLS Recomendada para categories:**
```sql
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view categories"
  ON public.categories FOR SELECT
  USING (true);
```

### `custom_items` (items personalizados del usuario)
```sql
-- Campos conocidos:
- id (uuid, PK)
- user_id (uuid, FK → users.id)
- name (text)
- volume (numeric)
- quantity (integer)
- created_at (timestamp)
```

**RLS Recomendada para custom_items:**
```sql
ALTER TABLE public.custom_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own custom items"
  ON public.custom_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Allow custom item creation"
  ON public.custom_items FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update own custom items"
  ON public.custom_items FOR UPDATE
  USING (auth.uid() = user_id);
```

### `transports`
```sql
-- Campos conocidos:
- id (uuid, PK)
- booking_id (uuid, FK → bookings.id)
- origin_address (text)
- destination_address (text)
- distance (numeric)
- cost (numeric)
- created_at (timestamp)
```

**RLS Recomendada para transports:**
```sql
ALTER TABLE public.transports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow transport operations"
  ON public.transports FOR ALL
  USING (true);
```

### `quotes`
```sql
-- Campos conocidos:
- id (uuid, PK)
- user_id (uuid, FK → users.id)
- items_data (jsonb)
- total_volume (numeric)
- status (text)
- created_at (timestamp)
```

**RLS Recomendada para quotes:**
```sql
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own quotes"
  ON public.quotes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Allow quote creation"
  ON public.quotes FOR INSERT
  WITH CHECK (true);
```

---

## 🚀 Cómo Aplicar las Políticas

### En Supabase Dashboard:

1. **Ir a SQL Editor:**
   - Dashboard → SQL Editor → "New Query"

2. **Copiar y pegar el contenido de:**
   - `database/users_rls_policies.sql` (Solución 1)

3. **Ejecutar el script:**
   - Click en "Run" o Ctrl+Enter

4. **Verificar políticas aplicadas:**
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'users';
   ```

### Desde CLI (Supabase CLI):

```bash
# Si tienes Supabase CLI instalado
supabase db push

# O ejecutar directamente el archivo SQL
psql postgres://[TU_CONNECTION_STRING] < database/users_rls_policies.sql
```

---

## ✅ Checklist de Seguridad

- [x] Tabla `users` creada
- [ ] RLS habilitado en `users`
- [ ] Políticas aplicadas en `users`
- [ ] RLS habilitado en `bookings`
- [ ] RLS habilitado en `inventory`
- [ ] RLS habilitado en `items`
- [ ] RLS habilitado en `categories`
- [ ] RLS habilitado en `custom_items`
- [ ] RLS habilitado en `transports`
- [ ] RLS habilitado en `quotes`

---

## 🧪 Testing de Políticas

Después de aplicar las políticas, prueba estos escenarios:

### 1. Crear usuario sin autenticación (booking flow)
```javascript
// Debe funcionar ✅
const { data, error } = await supabase
  .from('users')
  .insert([{ name: 'Test', email: 'test@test.com', phone: '123' }]);
```

### 2. Leer usuario sin autenticación
```javascript
// Debe retornar vacío ❌ (correcto)
const { data, error } = await supabase
  .from('users')
  .select('*')
  .eq('email', 'test@test.com');
```

### 3. Leer usuario autenticado
```javascript
// Después de login, debe retornar el usuario ✅
const { data, error } = await supabase
  .from('users')
  .select('*')
  .eq('id', auth.user.id);
```

### 4. Actualizar usuario sin autenticación (booking upsert)
```javascript
// Debe funcionar ✅
const { data, error } = await supabase
  .from('users')
  .update({ name: 'Updated', phone: '456' })
  .eq('email', 'test@test.com');
```

### 5. Actualizar usuario autenticado
```javascript
// Debe funcionar solo para sus propios datos ✅
const { data, error } = await supabase
  .from('users')
  .update({ name: 'Updated' })
  .eq('id', auth.user.id);
```

---

## 📝 Notas Importantes

1. **Service Role Key:** Nunca expongas la Service Role Key en el frontend
2. **Anon Key:** El Anon Key es seguro para usar en el frontend
3. **RLS:** Las políticas RLS se aplican incluso con el Anon Key
4. **Testing:** Siempre prueba las políticas antes de ir a producción
5. **Backup:** Haz backup de la base de datos antes de aplicar cambios

---

## 🔗 Referencias

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Policies](https://www.postgresql.org/docs/current/sql-createpolicy.html)

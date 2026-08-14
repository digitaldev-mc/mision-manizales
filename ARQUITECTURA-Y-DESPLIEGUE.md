# Misión Manizales — Arquitectura técnica y guía de despliegue

> **Documento para el equipo de desarrollo y para Cursor.** Este archivo es la
> especificación técnica de implementación (stack, esquema de datos, endpoints,
> seguridad, integraciones) **y** la guía operativa de despliegue en DreamHost
> VPS. Complementa —no reemplaza— el documento funcional
> `solicitud despliegue mision manizales.docx`, que define **qué** debe hacer
> el sitio. Este documento define **cómo** se construye y **cómo** se pone en
> producción.
>
> **Cómo usarlo en Cursor:** pega este archivo en la raíz del repo como
> `ARQUITECTURA.md`, ábrelo con `@ARQUITECTURA.md` en el chat de Cursor y
> constrúyelo **módulo por módulo siguiendo el orden de la sección 15**, sin
> saltar la validación de cada fase. Cada sección de "Instrucciones para
> Cursor" está escrita en imperativo, con nombres exactos de archivos, rutas,
> tablas y campos — no improvises nombres distintos a los que aquí se definen,
> porque el resto del documento (deploy, env vars, esquema) depende de que
> coincidan exactamente.

---

## 0. Decisiones de arquitectura y por qué difieren del proyecto de referencia

Se adjuntó como referencia `COMOFUNCIONA.md` del proyecto **La Calle de las
Aves y las Flores** (mismo cliente, mismo VPS DreamHost, mismo patrón de
despliegue: SSH + GitHub Actions + `git pull` en el VPS). Ese proyecto es
**PHP + MySQL sin build ni Node en producción** — Apache sirve los archivos
PHP directamente.

Misión Manizales **no puede replicar ese modelo 1:1** porque el alcance es
mayor: pasarelas de pago con webhooks, panel admin con autenticación robusta
y roles, actualización en tiempo casi real del termómetro, generación de PDF,
conciliación financiera y cumplimiento de la Ley 1581. Eso pide un backend con
estado de aplicación, lógica de negocio no trivial y un ORM con migraciones
versionadas — construirlo en PHP plano sería más lento de mantener y más
propenso a errores de seguridad en el manejo de webhooks y dinero.

**Decisión: Next.js 16 (App Router, TypeScript) como aplicación full-stack,
corriendo como proceso Node persistente en el mismo VPS DreamHost, expuesto
mediante la función "Proxy Server" del panel de DreamHost.** Se mantiene
exactamente el mismo patrón operativo del proyecto de referencia en todo lo
demás:

| Igual que el proyecto de referencia | Diferente (por qué) |
|---|---|
| Usuario SSH dedicado por proyecto | — |
| Repo propio en GitHub, deploy key de solo lectura | — |
| GitHub Actions dispara el deploy por SSH al hacer push a `main` | — |
| `scripts/deploy.sh` en el VPS hace `git pull` + actualiza el sitio | Además corre `npm ci`, `prisma migrate deploy` y `npm run build` (aquí sí hay build, porque Next.js lo requiere) |
| Secrets de producción **solo viven en el servidor**, nunca en Git | Aquí es `.env` en vez de `config.php` |
| Base de datos MySQL creada en el panel de DreamHost | Igual, vía Prisma en vez de PDO |
| Deploy manual de respaldo si Actions falla | — |
| Apache sirviendo directamente el HTML/PHP | **Sustituido por:** proceso Node persistente (PM2) en un puerto local + **Proxy Server** de DreamHost apuntando el subdominio a ese puerto (Apache no sirve la app directamente porque no es PHP) |

Esta última fila es el cambio real de infraestructura. DreamHost VPS no
corre Node bajo Passenger de forma estándar; el mecanismo soportado y
documentado por DreamHost es: la app Node escucha en un puerto local
(no privilegiado, ≥ 8000), un gestor de procesos (`pm2`) la mantiene viva y
la reinicia si falla o si el servidor reinicia, y en el panel
(**Servers & Usage → Manage → Proxy Server**) se crea un proxy que mapea el
subdominio público (con SSL automático) hacia ese puerto local. La sección
16 detalla esto paso a paso.

**Motor de base de datos: MySQL 8** (no Postgres), porque DreamHost provee
creación de bases de datos MySQL nativamente desde el panel — es el mismo
mecanismo que ya usa el proyecto de referencia (`Websites → MySQL
Databases`), y así se evita instalar y mantener Postgres manualmente en el
VPS. Prisma soporta MySQL igual de bien que Postgres, así que no hay
pérdida funcional.

**Pasarela de pago colombiana (PSE/tarjeta):** por decisión explícita del
cliente, se deja **fuera del alcance de esta primera fase**. Solo se
implementa **PayPal** de forma completa. El diseño (sección 8) incluye una
interfaz `PaymentProvider` para que agregar Wompi o ePayco más adelante sea
un adaptador nuevo, no una reescritura.

**Correcorreo transaccional: Resend.** El roadmap del proyecto de
referencia ya contempla verificar el dominio `manizalescomparte.com` en
Resend. Se reutiliza esa misma cuenta/dominio de Resend, solo con una
dirección de envío distinta para esta campaña (ver sección 11).

---

## 1. Resumen funcional (referencia rápida)

Landing pública + tienda + donaciones + panel admin para la campaña "Misión
Manizales". El detalle completo de reglas de negocio está en
`solicitud despliegue mision manizales.docx`; los puntos que determinan el
diseño técnico:

- Donaciones reales por **PayPal** (webhook-driven) y transferencia/PSE
  manual conciliada por el admin.
- Tienda con inventario, checkout y pago real, mismo proveedor que
  donaciones cuando sea posible.
- Termómetro que solo sube con **pagos confirmados**, no al llenar el
  formulario.
- CMS propio (sin tocar código) para hero, historias, eventos, aliados,
  productos, meta del termómetro.
- Panel admin con autenticación server-side real, multiusuario, roles,
  rate limiting, log de auditoría.
- Datos personales cifrados en reposo, HTTPS, Política de Tratamiento de
  Datos Personales conforme a la Ley 1581 de 2012.

---

## 2. Arquitectura general

```
Tu computador (Next.js + TypeScript, con build)
        │  git push origin main
        ▼
GitHub (digitaldev-mc/mision-manizales)
        │  dispara GitHub Actions (.github/workflows/deploy.yml)
        ▼
SSH → VPS DreamHost (vps16389.dreamhostps.com, usuario mision_mzl)
        │  ejecuta scripts/deploy.sh
        ▼
  1. git pull en ~/mision-manizales-src
  2. npm ci --omit=dev
  3. npx prisma generate
  4. npx prisma migrate deploy
  5. npm run build
  6. pm2 reload mision-manizales   (o pm2 start si es el primer deploy)
  7. healthcheck: curl -sf http://127.0.0.1:8010/api/health
        │
        ▼
Proceso Node (Next.js standalone) escuchando en 127.0.0.1:8010
        │
        ▼
DreamHost Panel → Proxy Server (subdominio → puerto 8010, SSL automático)
        │
        ▼
https://mision.manizalescomparte.com
        │
        ├── App Router (SSR/RSC) — landing, tienda, donaciones, panel admin
        ├── /api/*  — Route Handlers (REST interno + webhooks)
        └── MySQL (DreamHost panel) ←→ Prisma ORM
                │
                └── Cloudflare R2 (o S3) — imágenes/videos/comprobantes subidos
```

**No hay Apache sirviendo archivos de la app directamente.** Apache/Nginx de
DreamHost solo actúa como *reverse proxy* con terminación SSL hacia el
proceso Node. Esto es distinto del proyecto de referencia y es la pieza que
hay que configurar una sola vez en el panel (sección 16.4).

---

## 3. Stack tecnológico

| Capa | Elección | Versión de referencia (ago. 2026) |
|---|---|---|
| Runtime | Node.js | 24.x (Active LTS) |
| Framework | Next.js (App Router) | 16.x |
| Lenguaje | TypeScript | 5.x, `strict: true` |
| ORM | Prisma | 7.x |
| Base de datos | MySQL | 8.0 (provisto por DreamHost) |
| Autenticación | Auth.js (NextAuth v5), Credentials Provider | 5.x |
| Hash de contraseñas | `bcrypt` (o `argon2` si el VPS soporta compilar el binario nativo) | — |
| Validación | `zod` | 3.x |
| Pagos internacionales | PayPal Checkout SDK (JS) + PayPal REST API v2 (Orders) + Webhooks v1 | — |
| Pago Colombia (PSE/tarjeta) | Diferido — interfaz `PaymentProvider` lista para Wompi/ePayco | — |
| Email transaccional | Resend (`resend` npm SDK) | — |
| Generación de PDF (certificados/soportes) | `@react-pdf/renderer` o `pdf-lib` | — |
| Storage de archivos subidos | Cloudflare R2 (S3-compatible) vía `@aws-sdk/client-s3` | — |
| Proceso en producción | PM2 (fork mode, 1 instancia) | — |
| Reverse proxy / SSL | DreamHost Proxy Server (panel) | — |
| CI/CD | GitHub Actions → SSH → `deploy.sh` | — |

**Por qué PM2 en modo *fork* (una sola instancia) y no *cluster*:** el rate
limiting de login (sección 12) y el caché en memoria del termómetro
(sección 10) asumen un único proceso Node. Si más adelante el tráfico lo
justifica, migrar a cluster requiere mover ese estado a la base de datos o a
Redis — está señalado como pendiente en la sección 21, pero no es necesario
para el volumen esperado de esta campaña.

---

## 4. Estructura del proyecto

```
mision-manizales/
├── app/
│   ├── (public)/
│   │   ├── page.tsx                     # Landing
│   │   ├── donar/page.tsx               # Formulario de donación
│   │   ├── tienda/page.tsx              # Catálogo
│   │   ├── tienda/[slug]/page.tsx       # Detalle de producto
│   │   ├── carrito/page.tsx
│   │   ├── checkout/page.tsx
│   │   ├── politica-datos/page.tsx      # Política de Tratamiento de Datos Personales
│   │   └── gracias/page.tsx             # Confirmación post-pago
│   ├── (admin)/
│   │   ├── admin/layout.tsx             # Guard de sesión + rol
│   │   ├── admin/page.tsx               # Dashboard / reportes
│   │   ├── admin/donaciones/page.tsx
│   │   ├── admin/pedidos/page.tsx
│   │   ├── admin/productos/page.tsx
│   │   ├── admin/contenido/page.tsx     # CMS: hero, historias, eventos, aliados
│   │   ├── admin/termometro/page.tsx
│   │   ├── admin/usuarios/page.tsx      # Gestión de admins y roles
│   │   └── admin/login/page.tsx
│   └── api/
│       ├── auth/[...nextauth]/route.ts
│       ├── donaciones/route.ts                    # POST crear donación (estado pendiente)
│       ├── donaciones/[id]/route.ts               # GET/PATCH (admin)
│       ├── pagos/paypal/create-order/route.ts     # POST — crea orden en PayPal
│       ├── pagos/paypal/webhook/route.ts          # POST — webhook PayPal (firma verificada)
│       ├── pedidos/route.ts
│       ├── pedidos/[id]/route.ts
│       ├── productos/route.ts
│       ├── stock/reservar/route.ts                # reserva temporal de stock en checkout
│       ├── termometro/route.ts                    # GET público (con caché corto)
│       ├── termometro/ajustar/route.ts             # PATCH — solo admin, con auditoría
│       ├── contenido/[seccion]/route.ts
│       ├── uploads/presign/route.ts               # URL firmada para subir a R2
│       ├── reportes/export/route.ts               # CSV/Excel
│       └── health/route.ts                        # healthcheck para deploy.sh
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts                          # crea el primer admin (reemplaza a setup.php)
├── lib/
│   ├── prisma.ts                        # singleton PrismaClient
│   ├── auth.ts                          # config de Auth.js
│   ├── payments/
│   │   ├── provider.ts                  # interfaz PaymentProvider
│   │   ├── paypal.ts                    # implementación PayPal
│   │   └── wompi.ts.stub                # placeholder documentado, no activo
│   ├── email/
│   │   ├── resend.ts
│   │   └── templates/                   # donación confirmada, pedido, envío, etc.
│   ├── crypto.ts                        # cifrado AES-256-GCM de PII
│   ├── audit.ts                         # helper de log de auditoría
│   ├── rateLimit.ts                     # limitador de intentos de login
│   └── validation/                      # esquemas zod compartidos
├── middleware.ts                        # fuerza HTTPS, cabeceras de seguridad, CSRF admin
├── scripts/
│   ├── deploy.sh                        # EN EL VPS: pull + build + pm2 reload
│   ├── ecosystem.config.js              # config de PM2
│   └── healthcheck.sh
├── .github/workflows/deploy.yml
├── .env.example
├── next.config.ts                       # output: "standalone"
└── ARQUITECTURA.md                      # este documento
```

### Instrucciones para Cursor — estructura

Crea el proyecto con `npx create-next-app@latest mision-manizales
--typescript --app --src-dir=false --import-alias "@/*"`. Instala de una
vez las dependencias base:

```bash
npm install @prisma/client zod bcrypt next-auth@beta @auth/prisma-adapter \
  resend @aws-sdk/client-s3 @aws-sdk/s3-request-presigner \
  @paypal/checkout-server-sdk @react-pdf/renderer date-fns
npm install -D prisma tsx @types/bcrypt
```

No generes carpetas ni nombres distintos a los listados arriba: el resto de
este documento (endpoints, `.env`, script de deploy) referencia estas rutas
exactas.

---

## 5. Modelo de datos (Prisma / MySQL)

Puntos de diseño importantes, no evidentes solo con el schema:

- **PII cifrada en aplicación, no en columna plana.** Documento, teléfono y
  dirección se guardan como `String` pero el valor almacenado es el
  resultado de `encryptPII()` (AES-256-GCM, ver sección 12.3). El correo se
  guarda **sin cifrar** porque se necesita indexar/buscar y enviar
  duplicados vía Resend; se protege por control de acceso, no por cifrado
  de columna.
- **Toda donación y pedido nace en estado `pending` y solo el webhook los
  mueve a `confirmed`/`paid`.** Nunca confirmar desde el frontend.
- **`WebhookEvent` existe para idempotencia**: PayPal reintenta webhooks;
  sin esta tabla se duplicarían confirmaciones y el termómetro sumaría de
  más.
- **`AuditLog` es genérico** (`entity`, `entityId`, `action`, `actorId`,
  `diff`) para cubrir el requisito de trazabilidad tanto en pagos como en
  ajustes manuales del termómetro y cambios de contenido.

```prisma
// prisma/schema.prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum AdminRole {
  SUPERADMIN
  FINANZAS      // solo ve/gestiona donaciones y pedidos
  CONTENIDO     // solo edita CMS
}

model AdminUser {
  id           String    @id @default(cuid())
  email        String    @unique
  passwordHash String
  name         String
  role         AdminRole @default(CONTENIDO)
  active       Boolean   @default(true)
  lastLoginAt  DateTime?
  createdAt    DateTime  @default(now())
  auditLogs    AuditLog[]
}

model LoginAttempt {
  id        String   @id @default(cuid())
  email     String
  ip        String
  success   Boolean
  createdAt DateTime @default(now())

  @@index([email, createdAt])
  @@index([ip, createdAt])
}

enum DonationStatus {
  pending
  confirmed
  failed
  abandoned
}

enum PaymentMethod {
  paypal
  transferencia
  pse
}

model Donation {
  id                String         @id @default(cuid())
  referenceCode     String         @unique   // ID único de referencia visible al donante
  amountCOP         Int                       // se guarda en la moneda de reporte (COP); si es PayPal en USD, ver amountOriginal/currencyOriginal
  amountOriginal    Int
  currencyOriginal  String                    // "COP" | "USD"
  documentType      String                    // CC, CE, Pasaporte, NIT, TI
  documentNumber    String                    // cifrado en aplicación
  fullName          String
  phone             String                    // cifrado en aplicación
  email             String
  address           String                    // cifrado en aplicación
  dataConsentAt      DateTime
  dataConsentIp       String
  licitOriginDeclaredAt DateTime               // declaración de origen lícito de recursos
  paymentMethod     PaymentMethod
  status            DonationStatus @default(pending)
  providerOrderId   String?                   // ID de orden en PayPal / Wompi
  manualProofUrl    String?                   // comprobante subido para transferencia manual
  confirmedAt       DateTime?
  confirmedBy       String?                   // adminUserId si fue confirmación manual
  createdAt         DateTime       @default(now())
  updatedAt         DateTime       @updatedAt

  @@index([status, createdAt])
  @@index([documentNumber])
  @@index([email])
}

enum OrderStatus {
  pending
  paid
  preparing
  shipped
  delivered
  cancelled
}

model Product {
  id          String   @id @default(cuid())
  name        String
  slug        String   @unique
  description String   @db.Text
  priceCOP    Int
  imageUrl    String
  stock       Int      @default(0)
  soldOut     Boolean  @default(false)
  active      Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  orderItems  OrderItem[]
}

model Order {
  id              String        @id @default(cuid())
  referenceCode   String        @unique
  documentType    String
  documentNumber  String        // cifrado
  fullName        String
  phone           String        // cifrado
  email           String
  address         String        // cifrado
  status          OrderStatus   @default(pending)
  paymentMethod   PaymentMethod
  providerOrderId String?
  totalCOP        Int
  items           OrderItem[]
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  @@index([status, createdAt])
}

model OrderItem {
  id        String  @id @default(cuid())
  order     Order   @relation(fields: [orderId], references: [id])
  orderId   String
  product   Product @relation(fields: [productId], references: [id])
  productId String
  quantity  Int
  unitPriceCOP Int
}

model ThermometerSetting {
  id            Int      @id @default(1)
  goalCOP       Int
  manualAdjustCOP Int    @default(0)   // ajustes manuales del admin (+/-), quedan sumados/restados al total calculado
  updatedAt     DateTime @updatedAt
  updatedBy     String?
}

model WebhookEvent {
  id          String   @id @default(cuid())
  provider    String   // "paypal" | "wompi"
  eventId     String   @unique  // id que envía el proveedor — clave de idempotencia
  eventType   String
  payload     Json
  processedAt DateTime @default(now())
}

model ContentBlock {
  id        String   @id @default(cuid())
  section   String   // "hero_video" | "payment_info" | ...
  data      Json
  updatedAt DateTime @updatedAt
  updatedBy String?
}

model Story {
  id          String   @id @default(cuid())
  title       String
  videoUrl    String?
  imageUrl    String?
  description String   @db.Text
  published   Boolean  @default(true)
  order       Int      @default(0)
  createdAt   DateTime @default(now())
}

model Event {
  id          String   @id @default(cuid())
  title       String
  date        DateTime
  place       String
  description String   @db.Text
  published   Boolean  @default(true)
  createdAt   DateTime @default(now())
}

model Partner {
  id       String  @id @default(cuid())
  name     String
  logoUrl  String?
  order    Int     @default(0)
  active   Boolean @default(true)
}

model AuditLog {
  id        String     @id @default(cuid())
  entity    String     // "Donation" | "Order" | "ThermometerSetting" | "ContentBlock" | ...
  entityId  String
  action    String     // "manual_confirm" | "manual_adjust" | "update" | "delete" | ...
  actor     AdminUser  @relation(fields: [actorId], references: [id])
  actorId   String
  diff      Json?
  createdAt DateTime   @default(now())

  @@index([entity, entityId])
}
```

### Instrucciones para Cursor — datos

1. Crea `prisma/schema.prisma` exactamente como arriba.
2. `npx prisma migrate dev --name init` en local (contra un MySQL local o un
   contenedor Docker de MySQL 8 — no contra producción).
3. Escribe `prisma/seed.ts` que cree un `AdminUser` inicial con rol
   `SUPERADMIN`, leyendo `SEED_ADMIN_EMAIL` y `SEED_ADMIN_PASSWORD` desde
   `.env` y hasheando con `bcrypt` antes de insertar. Regístralo en
   `package.json` → `"prisma": { "seed": "tsx prisma/seed.ts" }`.
4. En producción **nunca** uses `prisma migrate dev`; el deploy usa
   `prisma migrate deploy` (aplica migraciones ya generadas, no crea
   nuevas). Genera y prueba las migraciones siempre en local primero.

---

## 6. Variables de entorno

`.env` **nunca se commitea**. Se crea a mano una sola vez en el servidor
(igual que `config.php` en el proyecto de referencia). En el repo solo va
`.env.example` con las claves sin valores reales.

```bash
# .env.example

# --- Base de datos ---
DATABASE_URL="mysql://usuario:password@mysql.manizalescomparte.com:3306/mision_manizales"

# --- App ---
NODE_ENV="production"
PORT="8010"
NEXT_PUBLIC_SITE_URL="https://mision.manizalescomparte.com"

# --- Auth.js ---
AUTH_SECRET=""            # openssl rand -base64 32
AUTH_TRUST_HOST="true"

# --- Cifrado de PII (sección 12.3) ---
PII_ENCRYPTION_KEY=""     # openssl rand -hex 32 (32 bytes = AES-256)

# --- PayPal ---
PAYPAL_ENV="live"                 # "sandbox" en desarrollo
PAYPAL_CLIENT_ID=""
PAYPAL_CLIENT_SECRET=""
PAYPAL_WEBHOOK_ID=""              # generado al registrar el webhook en developer.paypal.com

# --- Resend ---
RESEND_API_KEY=""
EMAIL_FROM="Misión Manizales <notificaciones@manizalescomparte.com>"
EMAIL_ADMIN_NOTIFY="manizalescomparte@gmail.com"

# --- Almacenamiento (Cloudflare R2, S3-compatible) ---
R2_ACCOUNT_ID=""
R2_ACCESS_KEY_ID=""
R2_SECRET_ACCESS_KEY=""
R2_BUCKET="mision-manizales-uploads"
R2_PUBLIC_URL="https://cdn.manizalescomparte.com"

# --- Semilla de admin inicial (solo se usa una vez, en el primer deploy) ---
SEED_ADMIN_EMAIL=""
SEED_ADMIN_PASSWORD=""
```

**Regla dura:** ni `deploy.sh` ni el workflow de GitHub Actions escriben
secretos de aplicación en el servidor. Los secrets de GitHub Actions
(`VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`) sirven **únicamente** para abrir la
conexión SSH — no para inyectar variables de negocio. El `.env` de
producción se edita a mano por SSH (`nano ~/mision-manizales-src/.env`) y
`deploy.sh` jamás lo toca ni lo sobreescribe.

---

## 7. Módulo de donaciones — diseño técnico

### 7.1 Formulario (`app/(public)/donar/page.tsx`)

Client component con validación `zod` en el cliente **y la misma validación
repetida server-side** en `POST /api/donaciones` (la validación de
frontend nunca es suficiente — así lo exige el documento funcional §2.1).

Esquema `zod` compartido (`lib/validation/donation.ts`):

```ts
export const donationSchema = z.object({
  amountCOP: z.number().int().positive(),
  documentType: z.enum(["CC", "CE", "Pasaporte", "NIT", "TI"]),
  documentNumber: z.string().min(4).max(20),
  fullName: z.string().min(3).max(120),
  phone: z.string().min(7).max(20),
  email: z.string().email(),
  address: z.string().min(5).max(200),
  dataConsent: z.literal(true),
  licitOriginDeclared: z.literal(true),
  paymentMethod: z.enum(["paypal", "transferencia", "pse"]),
});
```

### 7.2 Flujo de creación y confirmación

1. `POST /api/donaciones` valida con el schema de arriba, genera
   `referenceCode` (formato `MM-DON-<timestamp36>-<random4>`), inserta el
   registro con `status: "pending"`, guarda `dataConsentAt`/`dataConsentIp`
   y `licitOriginDeclaredAt`. Devuelve `{ donationId, referenceCode }`.
2. Frontend, según `paymentMethod`:
   - **PayPal:** llama a `POST /api/pagos/paypal/create-order` con el
     `donationId` → el backend crea la orden en PayPal (Orders API v2),
     guarda `providerOrderId` en la donación, devuelve el `orderID` al
     frontend para que el SDK de PayPal (`@paypal/react-paypal-js` en el
     cliente) abra el checkout.
   - **Transferencia/PSE manual:** se muestra la referencia única y los
     datos bancarios (desde `ContentBlock` `payment_info`); la donación
     queda `pending` hasta conciliación manual (sección 7.4).
3. **El webhook, no el frontend, confirma el pago.**
   `POST /api/pagos/paypal/webhook`:
   - Verifica la firma con `POST
     https://api-m.paypal.com/v1/notifications/verify-webhook-signature`
     usando `PAYPAL_WEBHOOK_ID`. **Rechazar (`403`) cualquier evento cuya
     firma no verifique.**
   - Si `event.id` ya existe en `WebhookEvent` → responder `200` sin
     reprocesar (idempotencia).
   - Si el evento es `CHECKOUT.ORDER.APPROVED` o
     `PAYMENT.CAPTURE.COMPLETED` → capturar el pago si aún no está
     capturado, marcar `Donation.status = "confirmed"`,
     `confirmedAt = now()`, y **en la misma transacción de Prisma**
     incrementar el total del termómetro (no en un paso separado — evita
     estados inconsistentes si el proceso muere entre medias).
   - Disparar email al donante (7.3) y al equipo (7.4) **después** de
     confirmar el commit de la transacción, no antes.
4. Si el evento es de fallo/denegación → `status = "failed"`. Si pasan
   más de 48h en `pending` sin webhook → un cron (sección 21) las marca
   `abandoned`.

### 7.3 Correo al donante

Vía Resend, template en `lib/email/templates/donacion-confirmada.tsx`
(usar `@react-email/components` si se agrega, o HTML simple). Debe incluir
nombre, monto, fecha, `referenceCode`, datos de verificación de Misión
Manizales, y adjuntar PDF de soporte generado con `@react-pdf/renderer`
cuando el monto sea deducible (regla exacta de "cuándo aplica" queda a
definir con el cliente — dejar el flag `certificateEligible` en el
`ContentBlock` de configuración).

### 7.4 Correo interno y conciliación manual

Al confirmarse cualquier donación, `EMAIL_ADMIN_NOTIFY` recibe copia con el
detalle. Para transferencias manuales: `PATCH
/api/donaciones/[id]` con `{ status: "confirmed" }` **solo accesible con
sesión admin de rol `SUPERADMIN` o `FINANZAS`**, exige adjuntar
`manualProofUrl` (subida previa a R2 vía `/api/uploads/presign`), y escribe
un `AuditLog` con `action: "manual_confirm"`.

---

## 8. Pagos — interfaz `PaymentProvider`

```ts
// lib/payments/provider.ts
export interface PaymentProvider {
  createOrder(input: { amount: number; currency: string; referenceCode: string }): Promise<{ providerOrderId: string; redirectOrClientToken: string }>;
  verifyWebhookSignature(headers: Headers, rawBody: string): Promise<boolean>;
  parseWebhookEvent(rawBody: string): { eventId: string; eventType: string; providerOrderId: string; status: "approved" | "failed" };
  captureOrder(providerOrderId: string): Promise<{ captured: boolean }>;
}
```

`lib/payments/paypal.ts` implementa esta interfaz por completo. Wompi/ePayco
quedan **fuera de esta fase** por decisión del cliente; el archivo
`lib/payments/wompi.ts.stub` documenta la forma que tendría la
implementación (Wompi también usa eventos firmados con HMAC-SHA256 sobre un
`checksum` en el payload) para que agregarla después sea implementar la
interfaz, no rediseñar el flujo de donaciones/pedidos.

---

## 9. Módulo de tienda

- Verificación de stock **en el servidor** dentro de una transacción
  Prisma al confirmar el pago (`OrderItem` + `Product.stock`
  decrementado atómicamente con `WHERE stock >= quantity` para evitar
  sobreventa por condiciones de carrera).
- Reserva temporal de stock en checkout (`/api/stock/reservar`) con TTL
  corto (p. ej. 10 minutos) para no bloquear inventario indefinidamente si
  alguien abandona el pago — implementar con una columna
  `reservedUntil`/`reservedQty` en `Product` o una tabla `StockHold`
  aparte si el volumen lo justifica.
- Estados de pedido `pending → paid → preparing → shipped → delivered`,
  cada transición vía `PATCH /api/pedidos/[id]` (admin), cada cambio
  dispara `AuditLog` y, en `shipped`, correo al comprador.

---

## 10. Termómetro de recaudo

- `GET /api/termometro` es público, calcula
  `SUM(Donation.amountCOP WHERE status = confirmed) + SUM(ventas de merch marcadas para meta) + ThermometerSetting.manualAdjustCOP`.
- Cachear el resultado en memoria del proceso Node por 5–10 segundos
  (`unstable_cache` de Next.js o un `Map` simple con timestamp) para no
  golpear MySQL en cada poll de cada visitante.
- Frontend hace `polling` cada 20–30 s (`setInterval` + `fetch`) — es la
  opción explícitamente aceptada en el documento funcional §4 y no
  requiere infraestructura adicional en el VPS.
- **Ruta de mejora futura (no en esta fase):** Server-Sent Events desde el
  mismo proceso Next.js (`app/api/termometro/stream/route.ts` con
  `ReadableStream`) para push casi instantáneo sin agregar Redis/Pusher —
  factible porque PM2 corre en modo *fork* (una sola instancia
  manteniendo las conexiones abiertas). Documentado en sección 21.
- Ajuste manual: `PATCH /api/termometro/ajustar`, solo `SUPERADMIN`,
  siempre con `AuditLog`.

---

## 11. CMS / panel administrativo

Todas las secciones editables (§5 del documento funcional: hero, historias,
eventos, aliados, productos, datos de pago mostrados) usan el mismo patrón:
tabla dedicada (`Story`, `Event`, `Partner`, `Product`) o `ContentBlock`
genérico con `data: Json` para bloques sueltos de configuración (video hero,
datos de pago). El panel admin es App Router con Server Actions o Route
Handlers — no localStorage, no estado solo-cliente: **todo cambio se
persiste en MySQL y se refleja para todos los visitantes**, como exige el
documento funcional.

Subida de imágenes/videos: el admin pide una URL firmada
(`POST /api/uploads/presign`) para subir directo del navegador a Cloudflare
R2 (evita pasar archivos grandes por el proceso Node del VPS), y guarda la
URL pública resultante (`R2_PUBLIC_URL/...`) en el campo correspondiente.

---

## 12. Autenticación y seguridad del panel admin

### 12.1 Autenticación

Auth.js v5, `CredentialsProvider`, contra `AdminUser`. Sesión JWT firmada
con `AUTH_SECRET`. `middleware.ts` protege todo `/admin/*` excepto
`/admin/login`, redirigiendo si no hay sesión o si el rol no alcanza para
la ruta (ej. `CONTENIDO` no puede entrar a `/admin/donaciones`).

### 12.2 Contraseñas y fuerza bruta

- `bcrypt` con `saltRounds >= 12`.
- `POST /api/auth/[...nextauth]` (login) registra cada intento en
  `LoginAttempt` (éxito o fallo, con `email` e `ip`).
- Antes de validar credenciales: si hay ≥ 5 intentos fallidos para ese
  `email` **o** esa `ip` en los últimos 15 minutos, rechazar con `429` sin
  siquiera consultar `AdminUser` (evita enumeración de usuarios además de
  fuerza bruta). Implementado en `lib/rateLimit.ts` contra la tabla
  `LoginAttempt` (no en memoria, para que sobreviva un `pm2 reload`).
- Cierre de sesión por inactividad: `maxAge` corto en la cookie de sesión
  de Auth.js (p. ej. 30 minutos) + renovación solo con actividad.

### 12.3 Cifrado de PII en reposo

`lib/crypto.ts` expone `encryptPII(value: string)` /
`decryptPII(value: string)` usando `crypto.createCipheriv("aes-256-gcm",
Buffer.from(PII_ENCRYPTION_KEY, "hex"), iv)`, guardando `iv` + `authTag` +
ciphertext concatenados en base64 en el mismo campo `String` de la base de
datos. Se cifran: `documentNumber`, `phone`, `address` en `Donation` y
`Order`. El `email` se mantiene legible por necesidad operativa (envío de
correos, búsqueda), protegido por control de acceso (12.4), no por cifrado
de columna.

`PII_ENCRYPTION_KEY` vive solo en `.env` del servidor. **Rotar esta clave
implica re-cifrar todos los registros existentes** — documentar este costo
antes de rotarla por rutina; solo rotar si hay sospecha de compromiso.

### 12.4 Control de acceso a datos

Ningún endpoint público (`/api/donaciones`, `/api/pedidos` sin `[id]`
autenticado) devuelve `documentNumber`, `phone` ni `address` en claro. Los
Route Handlers bajo `/api/*` que exponen estos campos verifican sesión
admin en cada request (no solo confiar en que el middleware protegió la
página — un `fetch` directo al endpoint debe fallar igual sin sesión).

### 12.5 Cabeceras y CSRF

`middleware.ts` añade `Strict-Transport-Security`,
`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`,
`Content-Security-Policy` (permitiendo los dominios de PayPal, Resend no
aplica del lado cliente, R2/CDN). Auth.js maneja CSRF nativamente para sus
propias rutas; para Server Actions de mutación en `/admin`, Next.js ya
valida el origen por defecto — no desactivar esa protección.

---

## 13. Datos personales y cumplimiento (Ley 1581 de 2012)

- `dataConsentAt` + `dataConsentIp` quedan registrados por cada donación y
  pedido (evidencia de aceptación, con fecha e IP).
- `app/(public)/politica-datos/page.tsx` publica la Política de
  Tratamiento de Datos Personales; el checkbox de autorización en el
  formulario enlaza a esta ruta (`href="/politica-datos"`, `target="_blank"`).
- Mecanismo de habeas data: un correo dedicado
  (`EMAIL_ADMIN_NOTIFY` o uno específico, p. ej.
  `datos@manizalescomparte.com`) publicado en la política, para
  solicitudes de eliminación/corrección. El responsable del tratamiento
  (persona jurídica o natural a cargo de Misión Manizales) y el tiempo de
  retención de datos son decisiones **legales, no técnicas** — dejarlas
  como placeholders de texto en la página de política hasta que el
  cliente las confirme; no inventar un plazo de retención en el código.
- Todo el tráfico corre por HTTPS (impuesto por el Proxy Server de
  DreamHost, sección 16.4) — reforzar además con un redirect
  `http → https` en `middleware.ts` porque, a diferencia de Apache directo,
  **el `.htaccess` no aplica cuando el tráfico pasa por el Proxy Server**
  (limitación documentada de DreamHost).

---

## 14. Integraciones — resumen

| Función | Proveedor | Notas de esta implementación |
|---|---|---|
| Pago internacional | PayPal Checkout SDK + Orders API v2 + Webhooks v1 | Implementado completo en esta fase |
| Pago Colombia (PSE/tarjeta) | Wompi o ePayco | Diferido — interfaz lista, sin activar |
| Email transaccional | Resend | Reutiliza dominio `manizalescomparte.com` ya en proceso de verificación |
| Base de datos | MySQL 8 (DreamHost panel) | Vía Prisma |
| Hosting/backend | DreamHost VPS (mismo VPS del proyecto de referencia) | Proceso Node + Proxy Server |
| Storage de imágenes/videos/comprobantes | Cloudflare R2 (S3-compatible) | Evita llenar disco del VPS y facilita backups/CDN |

---

## 15. Orden de construcción sugerido para Cursor

Construir en este orden — cada fase debe compilar y tener al menos una
prueba manual antes de pasar a la siguiente:

1. Scaffold del proyecto (sección 4) + `prisma/schema.prisma` (sección 5) +
   migración inicial + seed de admin.
2. Auth.js + panel admin con login funcional, roles, rate limiting de
   login (sección 12.1–12.2). Sin esto, nada del panel debe existir.
3. CMS básico (`ContentBlock`, `Story`, `Event`, `Partner`) con subida a
   R2 — permite que el resto del equipo empiece a cargar contenido real
   mientras se construye pagos.
4. Formulario de donación + endpoint `/api/donaciones` con validación
   server-side (sin pago real todavía, solo persistencia en `pending`).
5. Integración PayPal (`create-order` + webhook + captura + confirmación
   transaccional del termómetro) contra **sandbox** de PayPal.
6. Emails transaccionales (Resend) para donación confirmada + notificación
   interna.
7. Catálogo + carrito + checkout + control de stock + integración de pago
   reutilizando el mismo `PaymentProvider` de PayPal.
8. Reportes admin (filtros, export CSV/Excel).
9. Auditoría (`AuditLog`) integrada en cada mutación admin sensible —
   revisar retroactivamente que los pasos 2–8 la estén llamando.
10. Endgame de seguridad: cabeceras, CSP, revisión de que ningún endpoint
    filtre PII sin sesión (sección 12.4), página de política de datos.
11. Solo entonces: primer despliegue a producción (sección 17), con
    `PAYPAL_ENV=live` y credenciales reales.

---

## 16. Despliegue — infraestructura (DreamHost VPS)

### 16.1 Reutilizar el VPS existente

Se asume el mismo VPS del proyecto de referencia
(`vps16389.dreamhostps.com`) salvo que el cliente indique otro. Verificar
capacidad disponible (RAM/CPU) antes de sumar un segundo proceso Node
persistente al servidor — un `next build` con `output: "standalone"` y PM2
en modo fork es liviano, pero conviene revisar `free -h` en el VPS antes
del primer deploy.

### 16.2 Base de datos (panel DreamHost)

**Websites → MySQL Databases** en el panel:

- Database: `mision_manizales`
- User: `mision_user` + contraseña segura y distinta a cualquier otro
  proyecto
- Hostname: intentar reutilizar el hostname MySQL ya existente
  (`mysql.manizalescomparte.com`) agregando esta base de datos ahí si el
  panel lo permite; si el panel exige un hostname nuevo por base de datos,
  usar `mysql-mision.manizalescomparte.com`. Confirmar cuál aplica dentro
  del panel real de la cuenta antes de escribir `DATABASE_URL`.

Anotar host, nombre de BD, usuario y contraseña → van en `.env` (sección 6).

### 16.3 Usuario SSH dedicado + deploy key

Mismo patrón que el proyecto de referencia, con su propio usuario y su
propia llave (no reutilizar la de `avesyflores_mzl`; cada proyecto con su
deploy key de solo lectura):

```bash
# En el VPS, como el nuevo usuario SSH mision_mzl
ssh-keygen -t ed25519 -C "mision_mzl deploy" -f ~/.ssh/id_ed25519_github -N ""

mkdir -p ~/.ssh && chmod 700 ~/.ssh
cat >> ~/.ssh/config << 'EOF'
Host github.com
  HostName github.com
  User git
  IdentityFile ~/.ssh/id_ed25519_github
  IdentitiesOnly yes
EOF
chmod 600 ~/.ssh/config

cat ~/.ssh/id_ed25519_github.pub   # pegar en GitHub → repo → Settings → Deploy keys (solo lectura)
```

```bash
git clone git@github.com:digitaldev-mc/mision-manizales.git ~/mision-manizales-src
cd ~/mision-manizales-src
cp .env.example .env
nano .env      # completar con los valores reales de la sección 6
chmod 600 .env
```

### 16.4 Node.js, PM2 y linger

DreamHost VPS no ejecuta Node bajo Passenger de forma estándar; el
mecanismo soportado es: proceso propio en un puerto local + gestor de
procesos + **Proxy Server** del panel (ver 16.5). Documentación oficial:
[Node.js overview](https://help.dreamhost.com/hc/en-us/articles/217185397-Node-js-overview),
[Instalar una versión personalizada de NVM y Node.js](https://help.dreamhost.com/hc/en-us/articles/360029083351-Installing-a-custom-version-of-NVM-and-Node-js),
[Using linger with Node.js](https://help.dreamhost.com/hc/en-us/articles/26354404192404-Using-linger-with-Node-js),
[Proxy Server](https://help.dreamhost.com/hc/en-us/articles/217955787-Proxy-Server).

```bash
# Instalar Node 24 vía NVM (como mision_mzl)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
source ~/.bashrc
nvm install 24
nvm alias default 24

npm install -g pm2

# Imprescindible: sin esto, PM2 muere al cerrar la sesión SSH
loginctl enable-linger
```

`scripts/ecosystem.config.js`:

```js
module.exports = {
  apps: [{
    name: "mision-manizales",
    script: ".next/standalone/server.js",
    cwd: "/home/mision_mzl/mision-manizales-src",
    env: { NODE_ENV: "production", PORT: "8010" },
    instances: 1,
    exec_mode: "fork",
    autorestart: true,
    max_memory_restart: "400M",
  }],
};
```

`next.config.ts` debe incluir `output: "standalone"` para que el build
genere `.next/standalone/server.js` como entrypoint autocontenido (no
depende de `next start` ni de `node_modules` completo en runtime).

Primer arranque:

```bash
cd ~/mision-manizales-src
npm ci --omit=dev
npx prisma generate
npx prisma migrate deploy
npx prisma db seed
npm run build
pm2 start scripts/ecosystem.config.js
pm2 save
pm2 startup   # sigue las instrucciones que imprime (systemd --user)
```

### 16.5 Proxy Server (panel DreamHost) — mapear el subdominio al puerto

En el panel: **Servers & Usage → Manage → Proxy Server**:

1. **URL to set up Proxy under:** `mision.manizalescomparte.com` (crear el
   subdominio primero en **Websites → Manage Websites** si no existe).
2. **Port Number to Proxy:** `8010` (debe coincidir con `PORT` en `.env` y
   en `ecosystem.config.js`).
3. Guardar. DreamHost gestiona el SSL de ese subdominio automáticamente a
   través del proxy — no hace falta Certbot manual.

Limitaciones documentadas a tener en cuenta: **el `.htaccess` no aplica**
a través del proxy (por eso el redirect HTTPS y las cabeceras de seguridad
se hacen en `middleware.ts`, sección 12.5), y los assets estáticos a veces
requieren atención aparte — con `output: "standalone"` Next.js sirve
`/​_next/static/*` desde el mismo proceso, así que en el caso normal no se
necesita un subdominio adicional solo para estáticos; solo revisarlo si se
detectan 404 en assets después del primer deploy.

---

## 17. Primer despliegue — checklist único

Seguir en orden la primera vez; después de esto, el día a día es
`git push` (sección 18).

- [ ] **A.** Base de datos creada en el panel (16.2), `DATABASE_URL`
      confirmada.
- [ ] **B.** Repo en GitHub (`digitaldev-mc/mision-manizales`), rama `main`.
- [ ] **C.** Usuario SSH `mision_mzl` creado, deploy key generada y
      agregada en GitHub como *read-only* (16.3).
- [ ] **D.** `~/mision-manizales-src` clonado en el VPS, `.env` creado a
      mano con todos los valores reales (16.3, sección 6).
- [ ] **E.** Node 24 + PM2 instalados, `loginctl enable-linger` ejecutado
      (16.4).
- [ ] **F.** `npm ci`, `prisma migrate deploy`, `prisma db seed`,
      `npm run build`, `pm2 start` + `pm2 save` + `pm2 startup` (16.4).
- [ ] **G.** Subdominio creado y Proxy Server configurado apuntando al
      puerto `8010` (16.5).
- [ ] **H.** `curl -sf https://mision.manizalescomparte.com/api/health`
      responde `200`.
- [ ] **I.** Login admin funciona con el usuario sembrado por
      `prisma db seed`; cambiar esa contraseña inicial de inmediato desde
      el panel.
- [ ] **J.** Webhook de PayPal registrado en
      [developer.paypal.com](https://developer.paypal.com) apuntando a
      `https://mision.manizalescomparte.com/api/pagos/paypal/webhook`,
      `PAYPAL_WEBHOOK_ID` copiado al `.env` del servidor, **reiniciar PM2**
      después (`pm2 reload mision-manizales`) para que tome el nuevo valor.
- [ ] **K.** Donación de prueba de punta a punta en modo sandbox/real de
      bajo monto: formulario → PayPal → webhook → estado `confirmed` →
      termómetro sube → llegan los dos correos (donante + equipo).
- [ ] **L.** GitHub Actions configurado (sección 18) y probado con un
      commit vacío.
- [ ] **M.** Política de Tratamiento de Datos Personales publicada y
      enlazada desde el checkbox del formulario.

---

## 18. Despliegue continuo

`scripts/deploy.sh` (se ejecuta **en el VPS**):

```bash
#!/usr/bin/env bash
set -euo pipefail

cd ~/mision-manizales-src

git pull origin main

npm ci --omit=dev
npx prisma generate
npx prisma migrate deploy
npm run build

pm2 reload mision-manizales --update-env

sleep 2
curl -sf http://127.0.0.1:8010/api/health || {
  echo "Healthcheck falló tras el deploy" >&2
  exit 1
}

echo "Deploy OK: $(git log -1 --oneline)"
```

```bash
chmod +x scripts/deploy.sh
```

`.github/workflows/deploy.yml`:

```yaml
name: Deploy to VPS
on:
  push:
    branches: [main]
  workflow_dispatch: {}

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: SSH deploy
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: bash ~/mision-manizales-src/scripts/deploy.sh
```

Secrets en GitHub (**Settings → Secrets and variables → Actions**):

| Secret | Valor |
|---|---|
| `VPS_HOST` | `vps16389.dreamhostps.com` |
| `VPS_USER` | `mision_mzl` |
| `VPS_SSH_KEY` | Llave privada dedicada a **este** deploy (no reutilizar la de `avesyflores_mzl`; generar un par nuevo con `ssh-keygen` y agregar la pública a `~/.ssh/authorized_keys` de `mision_mzl`) |

**Nota importante, distinta del proyecto de referencia:** aquí `deploy.sh`
hace `npm ci` + `npm run build`, lo que toma más tiempo que un simple
`rsync` de PHP (puede tardar 1–3 minutos en vez de 10–30 segundos). Si el
workflow de GitHub Actions tiene timeout corto, ajustarlo (`timeout-minutes`
en el job) para que no se corte a mitad del build.

### Si GitHub Actions falla (respaldo manual)

```bash
ssh mision_mzl@vps16389.dreamhostps.com
bash ~/mision-manizales-src/scripts/deploy.sh
```

Verificación rápida:

```bash
git -C ~/mision-manizales-src log -1 --oneline
pm2 status mision-manizales
curl -sf http://127.0.0.1:8010/api/health
```

---

## 19. Operación — logs, backups, troubleshooting

```bash
pm2 logs mision-manizales           # stdout/stderr de la app
pm2 monit                           # CPU/memoria en vivo
tail -f ~/logs/mision.manizalescomparte.com/https/error.log   # logs del proxy/Apache
```

**Backups de MySQL:** DreamHost hace backups de servidor, pero no
sustituyen un backup lógico propio de la base de datos. Programar (cron
del usuario `mision_mzl`) un `mysqldump` diario a un directorio fuera del
repo, y opcionalmente subirlo también a R2:

```bash
0 3 * * * mysqldump -h mysql.manizalescomparte.com -u mision_user -p'...' mision_manizales | gzip > ~/backups/mision-$(date +\%F).sql.gz
```

Retener backups un número de días razonable y purgar los más viejos en el
mismo cron.

---

## 20. Qué NO se sube a Git / qué no debe sobrescribir el deploy

- `.env` — vive solo en el servidor, se edita a mano.
- `node_modules/`, `.next/` — se regeneran en cada deploy.
- Cualquier archivo subido por el CMS — no vive en el VPS en absoluto,
  vive en R2 (por diseño, así el deploy nunca puede pisarlo).
- `ARQUITECTURA.md` puede subirse al repo sin problema (es documentación,
  no secretos) — a diferencia de `config.php` en el proyecto de
  referencia, aquí no hay nada sensible en este archivo.

---

## 21. Roadmap / pendiente

- [ ] Definir e implementar la pasarela colombiana (Wompi o ePayco) sobre
      la interfaz `PaymentProvider` ya preparada (sección 8).
- [ ] Migrar el termómetro de *polling* a Server-Sent Events si la
      campaña gana tracción y el *polling* cada 20–30 s se vuelve
      perceptible o pesado para MySQL.
- [ ] Si el tráfico crece lo suficiente para justificar PM2 en modo
      *cluster*, mover el rate limiting de login y el caché del
      termómetro de memoria de proceso a MySQL/Redis (el rate limiting ya
      está en tabla `LoginAttempt`, así que solo el caché de 5–10s del
      termómetro necesitaría ese cambio).
- [ ] Confirmar con el cliente/asesor legal el tiempo exacto de retención
      de datos y el responsable formal del tratamiento para completar la
      Política de Tratamiento de Datos Personales (sección 13) — son
      datos legales, no técnicos, y no deben quedar como texto genérico
      en producción.
- [ ] Ambiente de *staging* (subdominio adicional + base de datos
      separada) antes de cada release grande, siguiendo exactamente el
      mismo patrón de despliegue de este documento.
- [ ] Rotar `PII_ENCRYPTION_KEY` y `AUTH_SECRET` si alguna vez se exponen
      en un chat, log o commit accidental (igual que la nota de rotación
      de `RESEND_API_KEY` en el proyecto de referencia).

---

*Basado en el documento funcional `solicitud despliegue mision manizales.docx`
y en el patrón de despliegue validado en `COMOFUNCIONA.md` (La Calle de las
Aves y las Flores). Última actualización: agosto 2026.*

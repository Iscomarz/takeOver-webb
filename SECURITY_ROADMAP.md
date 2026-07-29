# 🛡️ Take Over — Security Roadmap & Risk Register

> **Objetivo:** Registro centralizado de seguridad para auditar, mitigar y dar seguimiento a los riesgos técnicos de la infraestructura web (`takeOver-webb`) y del panel de administración (`take-over-admin`).

---

## 📊 Resumen de Estado

| ID | Riesgo / Vector | Severidad | Estado | Ubicación |
|---|---|---|---|---|
| **SEC-01** | Exfiltración de datos RLS en Supabase (Tickets / PII) | 🔴 CRÍTICA | ✅ COMPLETADO | Supabase RLS |
| **SEC-02** | Scrapers, escáneres y ataques en capa Edge | 🟠 ALTA | ✅ COMPLETADO | `src/hooks.server.js` |
| **SEC-03** | Optimización de autenticación en Webhook (`getSession()` activo) | 🟢 BAJA (Optimizado) | ✅ FUNCIONANDO | `src/routes/api/webhook/+server.js` |
| **SEC-04** | Permisos y visibilidad en Supabase Storage Buckets (`codigosQR`) | 🟡 MEDIA | ✅ COMPLETADO | Supabase Storage (`codigosQR`) |
| **SEC-05** | Rate Limit volátil en entornos Serverless (Vercel) | 🔵 BAJA-MEDIA | ⏳ PENDIENTE | Edge / Upstash Redis |
| **SEC-06** | Validación de esquemas e inyección en endpoints JSON | 🔵 BAJA-MEDIA | ⏳ PENDIENTE | `src/routes/api/*` |

---

## 🔍 Detalle y Planes de Acción

### ✅ SEC-01: Exfiltración de datos RLS en Supabase
- **Descripción:** La tabla `ticket` permitía lectura pública (`USING (true)` para `anon`), exponiendo códigos QR y referencias de boletos.
- **Acción Realizada:** Migración `20260729220000_security_rls_hardening.sql` aplicada en producción. Lectura de `ticket`, `mCliente`, `mVenta` y `mPago` restringida exclusivamente a usuarios autenticados (`authenticated`) en el Admin y al servidor vía `service_role`.

---

### ✅ SEC-02: Escudo de Seguridad en Capa Edge
- **Descripción:** Vulnerabilidad a escáneres de rutas (`.env`, `wp-admin`), bots agresivos de scraping y falta de cabeceras HTTP de seguridad.
- **Acción Realizada:** Implementado [src/hooks.server.js](file:///C:/Users/FranciscoEmmanuelMar/Desktop/Francisco/Dev/TakeOver/take-over-jules-new-arq/takeOver-webb/src/hooks.server.js) con `sequence()`:
  - Bloqueo inmediato 403 a User-Agents agresivos.
  - Bloqueo 404 a intentos de traversal de rutas.
  - Rate limit por IP en rutas transaccionales.
  - Inyección de cabeceras HSTS, X-Frame-Options, Permissions-Policy.

---

### ✅ SEC-03: Autenticación en Webhook (Reutilización de Sesión)
- **Estado:** ✅ OPTIMIZADO & FUNCIONANDO (< 3s)
- **Descripción:** Se verificó la implementación en `src/routes/api/webhook/+server.js`. El webhook reutiliza la sesión mediante `supabase.auth.getSession()` y omite `signOut()`, eliminando el login repetitivo en ejecuciones *warm* de Vercel.
- **Nota de Mantenibilidad Futura (Opcional):** Si en el futuro se quiere eliminar la dependencia de la contraseña de usuario (`SUPABASE_PASSWORD`), se puede instanciar con `SUPABASE_SERVICE_ROLE_KEY`.

---

### ✅ SEC-04: Auditoría y Blindaje de Storage Buckets (`codigosQR`)
- **Estado:** ✅ COMPLETADO
- **Descripción:** Migración `20260729223000_secure_storage_codigos_qr.sql` ejecutada en la nube mediante Supabase CLI:
  - El bucket `codigosQR` se configuró explícitamente como **Privado** (`public = false`).
  - La lectura/enumeración pública de archivos `anon` sin autenticación quedó bloqueada.
  - Acceso total configurado para el rol `authenticated` del panel de administración y bypass seguro vía `service_role` en las APIs del servidor.

---

### ⏳ SEC-05: Rate Limiting Distribuido para Eventos de Alta Concurrencia
- **Severidad:** 🔵 BAJA-MEDIA
- **Descripción:** En Vercel, el Rate Limiter en memoria de `hooks.server.js` se reinicia con cold starts y no comparte estado entre lambdas paralelas en picos masivos de venta de tickets.
- **Plan de Mitigación:**
  - [ ] Evaluar conexión de `@upstash/ratelimit` sobre Redis HTTP cuando aumente la concurrencia.
  - [ ] Mantener conteo global unificado con respuesta en < 5ms por petición.

---

### ⏳ SEC-06: Validación Estricta de Payload JSON en APIs
- **Severidad:** 🔵 BAJA-MEDIA
- **Descripción:** Endpoints públicos tipo `/api/free-checkout`, `/api/registro-invitacion` y `/api/lista-espera` procesan JSON recibido directamente del cliente.
- **Plan de Mitigación:**
  - [ ] Implementar validación de esquemas (usando Zod o verificación estricta) para asegurar tipos, longitudes y formatos de email/teléfono antes de llamar a la base de datos.

---

*Última actualización: 2026-07-29*

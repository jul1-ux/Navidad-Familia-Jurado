# Navidad con la Familia Jurado

Aplicación para la Familia Jurado Alania, 25/12/2026. La configuración vigente y sus límites se describen en [CORRECCIONES_FINALES.md](CORRECCIONES_FINALES.md).

## Arquitectura y archivos

- `app/page.tsx`: sobre, invitación, encuesta sencilla, regalos propios y galería.
- `app/envelope.tsx`: sobre cerrado y carta animada.
- `app/api/[...path]/route.ts`: API, validación y permisos de consulta/edición.
- `app/auth.ts`: autorización propia y autenticación de la administradora única.
- `app/anfitriones/page.tsx`: administración, papelera y estados de eliminación.
- `app/configurar-administracion/page.tsx`: configuración o recuperación privada de la contraseña administrativa.
- `app/content-lock.ts` y `app/deletions.ts`: serialización y borrado definitivo verificable por etapas.
- `app/excel.ts`: reconciliación de tres hojas con Microsoft Graph, cola y protección frente a versiones antiguas.
- `db/schema.ts`, `drizzle/`: tablas y migraciones.
- `worker/index.ts`: operación del servidor y reintentos después de las solicitudes.

D1 conserva los registros, R2 los archivos. El almacenamiento local ayuda a conservar autorización y cambios pendientes; no sustituye a la base de datos. Los borradores y la edición requieren autorización. La consulta de cartitas publicadas está disponible mediante «Ya me registré», sin cuentas familiares.

## Administradora única

La cuenta administrativa requiere el DNI autorizado y la contraseña elegida privadamente por la propietaria. No se publica el DNI en el código del navegador ni se precompleta.

Si no existe contraseña, abrir `/configurar-administracion`, verificar la cuenta propietaria y escribir manualmente DNI y contraseña nueva. Solo esa identidad puede configurar o recuperar la misma cuenta. Después, usar `/anfitriones` con DNI y contraseña. Verificar la cuenta propietaria no concede por sí solo acceso al panel. «Cerrar sesión» invalida su sesión en el servidor.

Los valores `ADMIN_EMAIL` y `ADMIN_DNI` se configuran como secretos del servidor. El archivo `.env.example` solo enumera claves sin valores. La contraseña administrativa tiene hash scrypt con sal aleatoria; la restricción de cuenta única también se aplica en la base de datos.

## Excel privado: autorización real pendiente

Usar un `.xlsx` exclusivo de esta actividad en OneDrive para empresas o SharePoint. Configurar una aplicación Microsoft Entra con autorización delegada `Files.ReadWrite` y `offline_access`, y registrar como secretos `MS_CLIENT_ID`, `MS_TENANT_ID`, `MS_REFRESH_TOKEN`, `MS_DRIVE_ID`, `MS_WORKBOOK_ID` y, si corresponde, `MS_CLIENT_SECRET`.

La integración conserva las hojas `Respuestas`, `Participantes` y `Regalos`, con tablas `tRespuestas`, `tParticipantes`, `tRegalos`. Dedicar el libro a la aplicación: sus filas se reconcilian con la base de datos; no agregar manualmente registros que deban conservarse. No se exportan borradores, DNI, contraseñas ni credenciales de acceso. Las referencias de imagen son identificadores privados.

Tras configurar secretos, desplegar y verificar en el panel una sincronización real. Mientras no exista autorización Microsoft, la sincronización y la etapa externa de las eliminaciones permanecerán pendientes. No se sustituyen por CSV ni por una descarga manual.

Los reintentos automáticos se activan por solicitudes posteriores al sitio; no se configuró un disparador periódico sin tráfico. También hay reintento administrativo explícito, que conserva la identidad de cada operación.

## Verificación y mantenimiento

Ejecutar `npx tsc --noEmit` y `node tests/api-integration.mjs`. Las pruebas usan bases y archivos efímeros separados de producción. No se publican datos ficticios.

El despliegue usa Sites, conserva el identificador de `.openai/hosting.json` y aplica las migraciones. No repetir SQL de migraciones ya aplicado. El sitio comparte su invitación por enlace y mantiene los permisos de edición y administración en el servidor.

Consultar `CORRECCIONES_FINALES.md` para el alcance de las 62 comprobaciones, la revisión de navegador, los límites de caché y la retención de respaldos externos que la aplicación no puede purgar selectivamente.

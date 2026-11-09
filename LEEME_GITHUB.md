# Navidad con la Familia Jurado — Código completo para GitHub

Esta carpeta contiene el código fuente de la versión 7 publicada el 9 de noviembre de 2026, con eliminación lógica/física, corrección de sobres eliminados, música opcional y fondo navideño. Incluye interfaz, servidor, estilos, imágenes del diseño, esquema de datos, migraciones, pruebas, dependencias declaradas y sus licencias incluidas.

## 1. Subir a GitHub

1. Descomprime el ZIP.
2. Crea un repositorio vacío en tu cuenta de GitHub.
3. Sube TODO el contenido de la carpeta `navidad-familia-jurado`, incluyendo `.gitignore`, `.env.example`, `.npmrc` y `.openai/hosting.json`. Conserva la estructura de carpetas.
4. No subas contraseñas, valores de secretos, `.dev.vars`, archivos `.env` locales ni copias de la base de datos.

También puedes hacerlo desde una terminal, dentro de la carpeta descomprimida:

```sh
git init
git add .
git commit -m "Plataforma navideña Familia Jurado"
git branch -M main
git remote add origin URL_DE_TU_REPOSITORIO
git push -u origin main
```

Reemplaza `URL_DE_TU_REPOSITORIO` con la URL que te entrega GitHub. No se crea ni publica un repositorio automáticamente al descargar este ZIP.

## 2. Instalar y ejecutar

Requisito: Node.js 22.13 o superior y npm.

```sh
npm ci
npm run build
```

El proyecto usa React, TypeScript, Vite/Vinext y un servidor Cloudflare Worker. Las bases D1 y los archivos R2 son servicios separados del código. Para preparar una base LOCAL vacía, después de compilar ejecuta estas migraciones una sola vez, en este orden:

```sh
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_ambitious_rafael_vega.sql
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0001_workable_squadron_sinister.sql
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0002_rare_meltdown.sql
npm run dev
```

Abre la dirección que imprima la terminal. No repitas estas migraciones sobre una base que ya las tenga aplicadas. `npm start` permite revisar localmente la compilación; no publica el sitio.

Para variables locales del Worker puedes crear `.dev.vars` a partir de las claves vacías de `.env.example`. Para producción, utiliza el gestor privado de secretos del alojamiento. No pongas DNI ni contraseñas en componentes del navegador. La contraseña administrativa se configura por el procedimiento privado de la propietaria; no hay una contraseña pública incluida.

## 3. Comprobar el código

```sh
npx tsc --noEmit
node tests/api-integration.mjs
npm run build
```

Las 66 pruebas de integración se ejecutaron satisfactoriamente en la versión entregada. Crean D1 y R2 efímeros; Microsoft se simula en estas pruebas. Los valores de prueba son ficticios y no corresponden a credenciales reales.

## 4. Qué contiene cada carpeta

- `app/`: invitación, galería, regalos, música, administración, API y permisos.
- `public/`: recursos gráficos del diseño.
- `db/` y `drizzle/`: modelo y migraciones de base de datos.
- `worker/`: punto de entrada del servidor.
- `scripts/`, `lib/`, `vendor/`: soporte de ejecución y compilación, integración y licencias.
- `components/`, `hooks/`: componentes y utilidades de la base del proyecto.
- `tests/`: comprobaciones de integración.
- `docs/CONFIGURACION.md`: configuración de administradora, almacenamiento y Excel.
- `docs/CORRECCIONES_FINALES.md`: comportamiento, pruebas, correcciones y límites reales.
- `README.md`: documentación técnica original del entorno base.
- `VERSION_ENTREGADA.json`: versión y huellas de los archivos fuente entregados.

## 5. Alojamiento, datos y conexiones

GitHub guarda el código. GitHub Pages por sí solo no ejecuta la API ni sustituye D1/R2. La publicación actual utiliza Sites/Cloudflare; `.openai/hosting.json` conserva su identificador de proyecto para trazabilidad y continuidad, pero no contiene secretos ni concede acceso por sí mismo.

Este ZIP no es una copia de los participantes, sus imágenes subidas, sesiones o registros privados. Tampoco incluye `node_modules`, compilaciones, cachés o el historial `.git`; `npm ci` reconstruye las dependencias. Descargar o subir el código a GitHub no altera los datos ni la web publicada.

Para mover el sitio a otro alojamiento hay que configurar sus bases, almacenamiento, secretos y despliegue. Además, la configuración/recuperación de la administradora confía en la identidad verificada que Sites inyecta mediante encabezados. En otro alojamiento, esa identidad debe provenir de una autenticación/proxy de confianza que reemplace los encabezados del visitante; no debe aceptarse un encabezado enviado libremente por Internet. No publiques esa ruta sin adaptar primero esta protección.

La sincronización real con Excel sigue pendiente de autorizar el archivo Microsoft. El código y los reintentos están incluidos; no se presenta esa conexión como activa. El borrado local retira las cartitas de la galería aunque Excel esté pendiente. Los respaldos e historiales del proveedor no se purgan con el borrado activo de la aplicación.

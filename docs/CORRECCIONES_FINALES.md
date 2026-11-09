# Correcciones: consulta sin cuentas, apertura y eliminación definitiva

## Recorrido familiar actual

La inscripción vuelve a ser: «Sí, quiero participar» → nombre y apellido → confirmar → tres opciones de regalo. No se piden usuario, contraseña, correo, teléfono ni DNI. La confirmación se guarda antes de abrir los regalos y Excel no bloquea ese paso.

«Ya me registré» consulta directamente la galería, con o sin autorización de edición. No registra otra respuesta, no crea participantes y no pide un enlace personal. Un botón no acredita identidad: cualquier persona que tenga el enlace de la invitación puede usarlo y consultar las publicaciones. Los borradores no se entregan mediante esa consulta.

La edición propia requiere una credencial aleatoria comprobada en el servidor, conservada en ese navegador. No se autoriza por nombre ni por un identificador elegido en el formulario. La autorización recordada dura hasta 180 días y se renueva al volver con un acceso válido. Cambiar de dispositivo o perderla requiere recuperación asistida de la administradora; los enlaces personales anteriores siguen siendo una alternativa opcional.

Los endpoints de cuentas familiares se deshabilitaron. Los registros previos y sus regalos permanecen. Las sesiones anteriores siguen siendo compatibles y los hashes de contraseñas familiares inactivas se retiran cuando su titular vuelve con autorización válida. La administración independiente con DNI y contraseña no se modificó.

## Sobre y apertura

Se encontraron dos causas en la implementación anterior: una marca persistente que reabría automáticamente el contenido y reglas de estilo móviles que anulaban transformaciones. Se retiraron ambas dependencias para esta interacción.

Cada entrada explícita en la portada reinicia el sobre cerrado. Al pulsar «Abrir invitación», se anima la solapa y sale la carta; después aparece la invitación. No se guarda una marca que impida repetirlo. Navegar entre regalos y galería no vuelve a la portada. Con movimiento reducido se revela el mismo contenido mediante una transición mínima.

## Dos acciones administrativas distintas

- **Mover a la papelera:** guarda una copia recuperable; no borra la inscripción.
- **Eliminar definitivamente:** solicita la confirmación explícita indicada por la propietaria y elimina los datos de regalos, sus copias recuperables y los archivos exclusivos de la cartita. No borra al participante ni su respuesta a la encuesta.

La eliminación definitiva puede iniciarse desde una cartita activa o desde la papelera. El panel muestra un diálogo con «Cancelar» y «Sí, eliminar definitivamente», con el nombre de la persona y la advertencia de irreversibilidad.

## Qué se borra y cómo se comprueba

La aplicación almacena los regalos como JSON en la fila de participante. El borrado elimina ese JSON activo y publicado, elimina físicamente todas las filas de papelera de esa persona —incluidas copias restauradas anteriormente— y crea una operación durable sin copiar nombres de regalos, descripciones ni contenido de imágenes.

La lista de archivos a procesar incluye imágenes del borrador, publicaciones, copias anteriores y cargas del participante que quedaron sin usar. Se comprueba cada referencia antes de borrar. Si otro registro todavía utiliza una imagen, se conserva. Los archivos exclusivos se eliminan con R2.delete y se confirma su ausencia con R2.head; después se eliminan las filas de metadatos correspondientes.

Actualmente no se generan miniaturas automáticas. Se implementó un registro de archivos derivados y la limpieza paginada del espacio de nombres de cada imagen, para borrar también miniaturas y versiones registradas o almacenadas allí. No se borran objetos ajenos inferidos a partir de nombres arbitrarios. Un archivo físico registrado por otra imagen se conserva.

Las etapas de datos, almacenamiento y Excel se muestran por separado en «Eliminaciones definitivas». Solo se muestra «Eliminación definitiva completada» después de confirmar el almacenamiento y la retirada de las filas de regalos de Excel. Si no hay conexión con Microsoft, la operación sigue pendiente aunque los datos locales y sus archivos ya hayan sido retirados. Hay un botón «Reintentar eliminación»; repetirlo usa la misma operación.

Al completar, se elimina el manifiesto de imágenes de la operación. Solo quedan el estado administrativo mínimo, las fechas, la referencia al participante y el registro de la acción, sin regalos ni imágenes. El participante y su respuesta permanecen, tal como exige el encargo.

## Solicitudes antiguas, sincronización y cachés

Una eliminación incrementa la versión de la cartita, deja una barrera irreversible y bloquea cargas, ediciones, restauraciones o retiros posteriores de esa cartita. Un bloqueo compartido serializa las mutaciones de contenido y la comprobación/borrado de archivos. Las solicitudes antiguas no pueden reinsertar el contenido eliminado.

La cola de Excel contiene eventos, no copias de regalos. Cada sincronización vuelve a leer la base actual. La eliminación incrementa una generación: una sincronización que tenía una copia anterior se invalida. Las escrituras externas se serializan y el borrado no se confirma mientras haya un evento obligatorio pendiente. La reconciliación posterior elimina las filas antiguas, sin duplicar participantes.

La entrega de imágenes usa `no-store`, no se emplea un depósito público ni se genera un caché CDN de imágenes. Las vistas abiertas comprueban referencias y versiones cada 15 segundos y al recuperar visibilidad; retiran vistas previas y borradores locales obsoletos cuando se detecta el borrado. La autorización del servidor invalida inmediatamente las nuevas consultas y escrituras. La aplicación no puede borrar remotamente capturas, descargas o memoria de dispositivos desconectados; esos dispositivos limpian sus copias bajo control de la aplicación al volver a consultar.

## Límites de respaldos externos

El borrado implementado corresponde al almacenamiento activo y a las copias recuperables gestionadas por esta aplicación. No incluye borrado seguro de sectores de disco, historiales internos o respaldos administrados por terceros.

Cloudflare D1 ofrece recuperación temporal mediante Time Travel; la aplicación no dispone de una operación para purgar selectivamente ese historial del proveedor. OneDrive/SharePoint también puede conservar versiones del libro o aplicar políticas de retención. Actualizar o borrar filas del libro actual no equivale a purgar esas versiones externas. No se promete su desaparición inmediata.

Referencias del proveedor:

- https://developers.cloudflare.com/d1/reference/time-travel/
- https://developers.cloudflare.com/r2/reference/consistency/
- https://learn.microsoft.com/en-us/sharepoint/version-overview

## Verificación

Se ejecutaron 62 comprobaciones de integración con el servidor real dentro de Workers/Miniflare, D1 y R2 efímeros. Incluyen registro sin cuentas, consulta sin identificación, no duplicación, borradores privados, edición propia, administración exclusiva, papelera y recuperación; también eliminación de JSON y filas, archivos reales y derivados, archivos compartidos, fallos de almacenamiento, falta de Microsoft, reintentos idempotentes y cancelación de sincronización con datos anteriores.

Las pruebas de Excel usan Microsoft simulado. La autorización y el archivo Microsoft reales siguen pendientes; no se afirma una prueba de eliminación en ese archivo real. En producción, una eliminación no se presentará como terminada mientras esa etapa esté pendiente.

En navegador se comprobó la portada cerrada, la apertura por teclado y el contenido revelado; al volver mediante «Invitación», el sobre reaparece cerrado. La compilación y los tipos se verifican antes de publicar. No se afirma una prueba física con un teléfono.

Las migraciones son aditivas y no eliminan participantes o regalos durante la actualización. Solo se ejecutan borrados cuando la administradora los confirma expresamente.

## Corrección de sobres retirados y ambiente navideño (9/11/2026)

La consulta de galería conservaba todos los participantes y sustituía los regalos eliminados por un sobre «Preparando su cartita». Se corrigió la causa en el servidor: solo se devuelven cartitas con estado activo. Papelera, retiro, borrado físico en proceso y borrado completado quedan fuera. La participación y la respuesta se conservan. Esta corrección retira también los sobres de operaciones ya existentes, sin volver a borrar sus datos.

«Eliminar cartita» abre una elección entre eliminación lógica (papelera recuperable) y física (eliminación definitiva). Esta última conserva la segunda confirmación explícita. El panel indica «Cartita borrada de la web · Excel pendiente» cuando el almacenamiento ya se limpió; no confunde esa limpieza local con una confirmación de Excel. No se ha configurado la conexión Microsoft real y no se afirma haber borrado su historial externo.

Se agregaron cuatro pruebas de regresión: desaparición del sobre en papelera, reaparición al restaurarlo, desaparición durante una eliminación con Excel pendiente y retiro completo de galería. Pasaron las 66 comprobaciones de integración y la revisión de tipos.

El fondo usa texturas y colores estáticos, sin movimientos repetitivos. La música es una frase instrumental original sintetizada en el navegador, sin solicitudes externas. Empieza apagada y se controla mediante «Activar música» / «Desactivar música» durante el recorrido. No solicita permisos ni modifica las autorizaciones del participante.

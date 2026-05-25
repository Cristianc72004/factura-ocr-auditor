# Auditor Agentico de Facturacion de Siniestros

Plataforma web demostrable para auditar facturas emitidas por talleres en siniestros vehiculares. El sistema permite registrar la base administrativa de la aseguradora, cargar reportes de siniestro del cliente, recibir facturas del taller, reconocer documentos con OCR, validar contra reglas de negocio y generar un reporte de auditoria con clasificacion automatica.

El objetivo del prototipo es ayudar a una aseguradora a decidir si una factura debe quedar:

- `approved`: aprobada
- `observed`: observada
- `rejected`: rechazada

Los casos con alertas se envian a revision humana.

## Idea Principal

La factura del taller no se valida sola. El sistema cruza la factura contra todo el contexto registrado:

- cliente y poliza
- vehiculo y placa
- reporte de siniestro declarado por el cliente
- factura informada por el cliente
- taller autorizado por convenio
- tarifario acordado
- servicios autorizados
- danos reportados
- items cobrados
- totales, IVA, UUID y duplicados

Con ese cruce se detectan sobreprecios, items no relacionados, talleres no autorizados, diferencias de totales y posibles duplicados.

## Flujo Correcto Del Sistema

Este es el orden recomendado de uso.

1. Clientes y polizas

   Registra o revisa la informacion del asegurado:

   - nombre del cliente
   - documento
   - numero de poliza
   - aseguradora
   - vehiculo
   - placa
   - tipo de plan
   - deducible
   - limite maximo de reparacion
   - servicios cubiertos

   Esta informacion permite saber si el cliente esta cubierto y si la factura corresponde al vehiculo asegurado.

2. Talleres y convenio

   Registra los talleres que pueden facturar a la aseguradora:

   - nombre del taller
   - identificacion fiscal
   - aseguradora con convenio
   - estado del taller
   - tarifa de hora de mano de obra
   - monto maximo por factura
   - categorias permitidas

   Esto permite validar si el emisor de la factura es un taller autorizado.

3. Tarifario

   Carga los conceptos autorizados para repuestos, materiales, mano de obra y servicios:

   - codigo
   - descripcion
   - categoria
   - precio maximo unitario
   - horas maximas
   - si esta autorizado o no

   El motor usa el tarifario para detectar precios fuera de rango, mano de obra excesiva e items no tarifados.

4. Reporte de siniestro

   El cliente reporta el accidente. En esta seccion se registra:

   - numero de siniestro
   - numero de factura informado por el cliente
   - poliza asociada
   - asegurado
   - vehiculo y placa
   - fecha del accidente
   - dano reportado
   - servicios autorizados
   - talleres autorizados
   - monto estimado

   Este reporte es la base para comparar si la factura del taller realmente corresponde al accidente declarado.

5. Generador de facturas

   El generador sirve para crear facturas PDF de prueba basadas en un siniestro ya registrado.

   Uso recomendado:

   - entra a `/generator`
   - selecciona un reporte de siniestro
   - selecciona el taller emisor
   - genera una factura PDF
   - prueba el reconocimiento OCR
   - descarga el PDF si quieres
   - sube ese PDF en `/upload` para auditarlo

   El generador es util para probar el sistema sin depender de facturas externas. Produce facturas con el formato reconocido por el modelo `Factura_DigitFlow`.

6. Carga de factura

   En `/upload` se sube la factura del taller.

   Formatos aceptados:

   - PDF
   - PNG
   - JPG
   - JPEG
   - DOCX

   El sistema:

   - valida tipo y tamano del archivo
   - lee el documento
   - extrae texto con OCR o parser de documento
   - reconoce si corresponde al formato soportado
   - convierte el texto en datos estructurados
   - permite correccion manual
   - ejecuta auditoria

7. Auditoria automatica

   El motor backend valida:

   - numero de factura
   - numero de siniestro
   - cliente asegurado
   - vehiculo y placa
   - taller emisor
   - convenio del taller
   - poliza
   - cobertura
   - tarifario
   - dano reportado vs items cobrados
   - servicios autorizados
   - subtotal, IVA y total
   - UUID repetido
   - factura repetida
   - items duplicados

   El frontend no decide la auditoria. La logica esta en backend dentro de `src/lib/audit`.

8. Casos auditados

   En `/cases` se revisan las facturas ya auditadas. La tabla muestra resumen y permite abrir una vista rapida o el detalle completo.

   En el detalle se ve:

   - estado final
   - riesgo
   - datos de factura
   - datos del siniestro
   - items facturados
   - alertas
   - OCR bruto
   - historial de revision humana

9. Revision humana

   El auditor humano revisa principalmente facturas `observed` o `rejected`.

   Puede:

   - cambiar estado manualmente
   - agregar comentario
   - dejar historial de decision

## Motor De Reglas

El motor aplica reglas como:

- si el UUID ya existe, alerta critica
- si el numero de factura ya existe, alerta critica
- si no existe el siniestro, alerta alta
- si la poliza no existe o no esta activa, alerta alta
- si el vehiculo no coincide, alerta alta
- si la placa no coincide, alerta alta
- si el taller no esta autorizado, alerta alta
- si el item no existe en tarifario, alerta media o alta
- si el precio supera tarifario, alerta alta
- si la mano de obra supera horas permitidas, alerta media
- si el item no corresponde al dano reportado, alerta alta
- si el total calculado no coincide con el declarado, alerta alta

## Scoring De Riesgo

El riesgo va de 0 a 100.

- alerta critica: +40
- alerta alta: +25
- alerta media: +15
- alerta baja: +5

Clasificacion:

- 0 a 30: `approved`
- 31 a 70: `observed`
- 71 a 100: `rejected`

## Asistente Conversacional

La pantalla principal incluye un agente conversacional para administradores y auditores.

Puede responder preguntas como:

- explicame el flujo
- como uso el generador
- que datos necesito cargar
- que valida el motor
- que facturas tienen alertas criticas
- que debo revisar primero
- resume el estado del dia
- por que esta factura fue observada
- compara contra tarifario
- busca duplicados

El agente tambien intenta interpretar errores comunes de escritura. Por ejemplo:

- `facrura` se interpreta como factura
- `sinietro` se interpreta como siniestro
- `fljo` se interpreta como flujo
- `tarifa` se interpreta como tarifario

## Secciones De La Aplicacion

- `/`: guia principal y chat del agente
- `/dashboard`: indicadores generales y flujo operativo
- `/clients`: CRUD de clientes y polizas
- `/workshops`: CRUD de talleres y convenios
- `/tariffs`: CRUD de tarifario
- `/claims`: CRUD de reportes de siniestro
- `/generator`: generador de facturas PDF de prueba
- `/upload`: carga, OCR, correccion y auditoria
- `/cases`: casos auditados
- `/cases/[id]`: detalle del caso y revision humana

## Datos Demo

El proyecto incluye datos demo en:

- `src/data/policies.json`
- `src/data/claims.json`
- `src/data/workshops.json`
- `src/data/tariffs.json`
- `src/data/demo-invoices.json`

Actualmente contiene multiples polizas, reportes de siniestro, talleres y conceptos tarifarios para probar el flujo completo.

## Stack

- Next.js
- TypeScript
- Tailwind CSS
- API Route Handlers
- Tesseract.js
- pdf-lib
- pdf-parse
- mammoth
- Vercel Blob con fallback local
- Prisma schema preparado para futura migracion a PostgreSQL

## Instalacion Local

```bash
npm install
npm run dev
```

Abre:

```txt
http://localhost:3000
```

Validaciones utiles:

```bash
npm run typecheck
npm run build
```

## Persistencia Local

Si no existe `BLOB_READ_WRITE_TOKEN`, el sistema usa persistencia local:

- `.local-data/` para datos editables
- `uploads/invoices/` para facturas subidas
- `uploads/generated/` para facturas generadas

Estas carpetas no deben subirse a Git.

El repositorio conserva solo:

- `uploads/invoices/.gitkeep`
- `uploads/generated/.gitkeep`

## Despliegue En Vercel

El proyecto ya esta preparado para Vercel usando `@vercel/blob`.

Pasos:

1. Sube el repositorio a GitHub.
2. Importa el proyecto en Vercel.
3. Crea un Vercel Blob Store.
4. Conecta el Blob Store al proyecto.
5. Verifica que exista la variable `BLOB_READ_WRITE_TOKEN`.
6. Ejecuta deploy o redeploy.

Configuracion recomendada:

- Framework: Next.js
- Install command: `npm install`
- Build command: `npm run build`
- Output: automatico

## Vercel Blob

Para este prototipo se recomienda crear el Blob Store como `Public`, porque el sistema guarda archivos y luego vuelve a leerlos usando la URL generada por Vercel Blob.

Variable necesaria:

```bash
BLOB_READ_WRITE_TOKEN=
```

En local puede quedar vacia. En Vercel debe existir para que archivos y datos persistan entre deploys.

Con Blob activo se guardan:

- facturas subidas: `invoices/...`
- PDFs generados: `generated/...`
- datos editables: `data/invoices.json`, `data/tariffs.json`, `data/claims.json`, `data/policies.json`, `data/workshops.json`

## Archivos Que Si Deben Subirse A Git

- `src/`
- `prisma/`
- `package.json`
- `package-lock.json`
- `next.config.ts`
- `tailwind.config.ts`
- `postcss.config.js`
- `tsconfig.json`
- `vercel.json`
- `.env.example`
- `.gitignore`
- `README.md`
- `uploads/invoices/.gitkeep`
- `uploads/generated/.gitkeep`

## Archivos Que No Deben Subirse A Git

- `node_modules/`
- `.next/`
- `.local-data/`
- `.env`
- PDFs generados dentro de `uploads/generated/`
- facturas subidas dentro de `uploads/invoices/`
- `tsconfig.tsbuildinfo`

## Limitaciones Del Prototipo

- El OCR puede fallar en documentos complejos o mal escaneados.
- Si el OCR queda incompleto, el usuario debe corregir datos manualmente.
- El reconocimiento esta optimizado para el modelo `Factura_DigitFlow`.
- Para produccion real, conviene usar OCR externo, almacenamiento privado, autenticacion, roles y base PostgreSQL.
- En Vercel, para archivos grandes conviene migrar a subida directa cliente -> Blob.

## Scripts

```bash
npm run dev
npm run typecheck
npm run build
npm start
```

## Resumen Operativo

El flujo ideal es:

```txt
Cliente y poliza
  -> Taller y tarifario
  -> Reporte de siniestro del cliente
  -> Factura real o generada del taller
  -> OCR y datos estructurados
  -> Auditoria automatica
  -> Reporte de alertas
  -> Revision humana si corresponde
```

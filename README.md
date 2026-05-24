# Auditor Agentico de Facturacion de Siniestros

Prototipo web para auditar facturas y documentos enviados por talleres en siniestros vehiculares.

## Funcionalidades

- Carga de PDF, PNG, JPG, JPEG y DOCX con validacion de tipo y tamano.
- OCR local con Tesseract.js para imagenes.
- Lectura de texto PDF y DOCX.
- Correccion manual si el OCR queda incompleto.
- Reconocimiento del modelo `Factura_DigitFlow`; si no corresponde, muestra documento no valido.
- Parser heuristico de factura a datos estructurados.
- Motor de auditoria backend:
  - validacion contra tarifario,
  - validacion contra siniestro,
  - validacion contra poliza,
  - validacion contra convenio del taller,
  - deteccion de duplicados,
  - validacion de totales e IVA,
  - scoring de riesgo.
- Clasificacion automatica: aprobada, observada o rechazada.
- Dashboard administrativo.
- CRUD de clientes/polizas, talleres y tarifario.
- Reporte de siniestro del cliente con numero de factura informada.
- Factura del taller validada contra reporte del cliente, poliza, convenio y tarifario.
- Panel de casos con filtros y busqueda.
- Detalle de caso con reporte, alertas, OCR bruto e historial humano.
- Revision humana con cambio manual de estado y comentario.
- Generador de facturas PDF sinteticas del modelo DigitFlow.
- Asistente conversacional interno para consultar estado, casos, alertas y prioridades.

## Stack

- Next.js
- TypeScript
- Tailwind CSS
- API Route Handlers
- Tesseract.js
- Vercel Blob con fallback local
- Prisma schema preparado para una futura migracion a PostgreSQL

## Instalacion local

```bash
npm install
npm run dev
```

Abre `http://localhost:3000`.

En local, si no existe `BLOB_READ_WRITE_TOKEN`, el sistema usa:

- `.local-data/` para datos editables
- `uploads/` para facturas y PDFs generados

Estas carpetas no deben subirse a Git.

## Despliegue en Vercel

El proyecto ya esta refactorizado para Vercel usando `@vercel/blob`.

Pasos:

1. Sube el repositorio a GitHub.
2. Importa el proyecto desde Vercel.
3. En Vercel, crea un Blob Store.
4. Conecta el Blob Store al proyecto.
5. Verifica que exista la variable `BLOB_READ_WRITE_TOKEN`.
6. Ejecuta el deploy.

Con `BLOB_READ_WRITE_TOKEN` activo, el sistema guarda en Blob:

- facturas subidas: `invoices/...`
- PDFs generados: `generated/...`
- datos editables del panel: `data/invoices.json`, `data/tariffs.json`, `data/claims.json`, `data/policies.json`, `data/workshops.json`

## Cargas en Vercel

Este prototipo usa subida por API server-side, compatible con Vercel para archivos pequenos. El limite configurado es 4 MB para evitar problemas con el limite de request de funciones serverless.

Para produccion con facturas mas pesadas, conviene migrar a subida directa cliente -> Vercel Blob y dejar que la API solo reciba la URL/metadata.

## Flujo demo

1. Carga o confirma clientes/polizas.
2. Registra el reporte del siniestro del cliente con numero de factura informada.
3. Carga o confirma talleres conveniados y tarifario acordado.
4. Entra a `/upload`.
5. Sube la factura del taller en PDF, imagen o DOCX.
6. Revisa OCR y datos extraidos.
7. Pulsa `Auditar factura`.
8. El sistema compara factura vs reporte, poliza, convenio y tarifario.
9. Revisa alertas por sobreprecio, duplicado, item no tarifado o dano no relacionado.

## Generar facturas de prueba

Entra a `/generator`, indica la cantidad de PDFs y pulsa `Generar PDFs`.

Cada factura generada:

- usa el formato `Factura_DigitFlow`,
- toma datos de clientes, polizas, siniestros y talleres registrados,
- mantiene senales de reconocimiento como `FACTURA ELECTRONICA`, `N Siniestro`, `TOTAL ARS`, `CAE`, `AFIP` y `UUID`,
- varia numero de factura, siniestro, asegurado, vehiculo, placa, items y total,
- puede descargarse o probarse directamente contra OCR.

## Variables de entorno

```bash
BLOB_READ_WRITE_TOKEN=
```

Localmente puede quedar vacia.

En Vercel debe existir para que los datos y archivos persistan entre deploys.

## Scripts

```bash
npm run dev
npm run build
npm run typecheck
```

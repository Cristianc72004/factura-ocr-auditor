# Auditor Agéntico de Facturación de Siniestros

Prototipo web para auditar automáticamente facturas y documentos enviados por talleres en siniestros vehiculares.

## Funcionalidades

- Carga de PDF, PNG, JPG, JPEG y DOCX con validación de tipo y tamaño.
- OCR local con Tesseract.js para imágenes.
- Lectura de texto DOCX para validar facturas de prueba.
- Fallback manual para PDF o OCR incompleto.
- Reconocimiento simplificado del modelo `Factura_DigitFlow`: emisor DigitFlow, factura electrónica, siniestro, total ARS, CAE/AFIP, tabla de ítems y UUID. Si no corresponde, se bloquea la auditoría y se muestra `Documento no válido`.
- Parser heurístico de factura a datos estructurados.
- Motor de auditoría backend:
  - validación contra tarifario,
  - validación contra siniestro,
  - detección de duplicados,
  - validación de totales e IVA,
  - scoring de riesgo.
- Clasificación automática: aprobada, observada o rechazada.
- Dashboard administrativo.
- Panel administrativo orientado al flujo real: primero tarifario acordado, luego siniestralidad reportada, después carga y auditoría.
- Panel de casos con filtros y búsqueda.
- Vista de siniestros reportados.
- Vista de clientes asegurados y polizas activas.
- Vista de talleres conveniados con tarifa de mano de obra, categorias permitidas y monto maximo.
- Detalle de caso con reporte, alertas, OCR bruto e historial humano.
- Revisión humana con cambio manual de estado y comentario.
- Tarifario demo editable.
- Generador de facturas PDF sintéticas del modelo DigitFlow para crear varias muestras de prueba.
- Prisma schema listo para migrar a SQLite/PostgreSQL, aunque el demo usa JSON local.

## Stack

- Next.js
- TypeScript
- Tailwind CSS
- API Route Handlers
- Tesseract.js
- Persistencia local en `.local-data`
- Prisma ORM preparado en `prisma/schema.prisma`

## Instalación

```bash
npm install
npm run dev
```

Abre `http://localhost:3000`.

## Flujo demo

1. Entra a `/upload`.
2. Sube una factura en imagen, PDF o DOCX.
3. Revisa el OCR bruto.
4. Corrige los campos extraídos si hace falta.
5. Pulsa `Auditar factura`.
6. Abre el caso generado para revisar alertas y decisión humana.

También puedes simular OCR pegando texto en el campo de OCR y pulsando `Reprocesar texto corregido`.

## Generar facturas de prueba

Entra a `/generator`, indica la cantidad de PDFs y pulsa `Generar PDFs`.

Cada factura generada:

- usa el formato simplificado `Factura_DigitFlow`,
- toma datos posibles de clientes, polizas, siniestros y talleres conveniados registrados,
- mantiene señales de reconocimiento como `FACTURA ELECTRONICA`, `N Siniestro`, `TOTAL ARS`, `CAE`, `AFIP` y `UUID`,
- varia numero de factura, siniestro, asegurado, vehiculo, placa, items y total,
- puede descargarse o probarse directamente contra `/api/ocr`.

## Datos demo

Los datos semilla están en:

- `src/data/tariffs.json`
- `src/data/claims.json`
- `src/data/demo-invoices.json`

En ejecución, el prototipo copia el tarifario a `.local-data` y guarda ahí los casos auditados.
Las facturas auditadas arrancan vacías; el flujo operativo comienza con el tarifario acordado y los siniestros reportados.
Los PDFs sintéticos se generan en `uploads/generated` y no se suben a Git.

## Seguridad del prototipo

- Tipos MIME permitidos: PDF, PNG, JPG, JPEG, DOCX.
- Tamaño máximo: 8 MB.
- Nombres de archivo sanitizados.
- Archivos guardados bajo `uploads/invoices`.
- La lógica de auditoría vive en backend/lib, no en componentes frontend.

## Scripts

```bash
npm run dev
npm run build
npm run typecheck
```

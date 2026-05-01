# Skill: local-storage-indexeddb

## Cuándo usar
Cuando se implementa historial de impresión, reimpresión, o cualquier persistencia de datos entre sesiones sin backend.

## Estado actual
**No implementado.** Feature pendiente — ver `PLANS.md`.

## Cuándo usar localStorage vs IndexedDB

| Criterio | localStorage | IndexedDB |
|----------|-------------|-----------|
| Tamaño de datos | < 5MB | Varios GB |
| Tipo de datos | Solo strings | Cualquier tipo JS |
| Consultas | No (solo key-value) | Sí (índices) |
| Async | No (síncrono) | Sí (Promise/IDB) |
| Usar para | Configuración, presets custom | Historial de etiquetas, LabelModel[] |

**Conclusión:** usar IndexedDB para el historial (los `LabelModel[]` pueden ser grandes), localStorage para configuración pequeña (preset seleccionado, configuración de UI).

## Estructura de datos sugerida para historial

```ts
// src/lib/printHistory.ts

interface PrintHistoryEntry {
  id: string            // UUID o timestamp string
  timestamp: number     // Date.now()
  fileName: string
  sheetName: string
  labelCount: number
  presetId: LabelPresetId
  labels: LabelModel[]
}

const DB_NAME = 'glassflow'
const DB_VERSION = 1
const STORE_NAME = 'printHistory'
const MAX_HISTORY_ENTRIES = 50
```

## API mínima para IndexedDB

```ts
// Abrir/inicializar la DB
async function openDB(): Promise<IDBDatabase>

// Guardar una entrada
async function savePrintEntry(entry: PrintHistoryEntry): Promise<void>

// Listar entradas (ordenadas por timestamp desc)
async function getPrintHistory(): Promise<PrintHistoryEntry[]>

// Eliminar entrada por ID
async function deletePrintEntry(id: string): Promise<void>

// Limpiar historial completo
async function clearPrintHistory(): Promise<void>
```

## Integración con App.tsx

```ts
// Al imprimir exitosamente (en printWithZebra, downloadZpl, etc.):
await savePrintEntry({
  id: crypto.randomUUID(),
  timestamp: Date.now(),
  fileName,
  sheetName: selectedSheetName,
  labelCount: scopedLabels.length,
  presetId: selectedPresetId,
  labels: scopedLabels,
})
```

## Persistencia de configuración con localStorage

```ts
// Guardar preset seleccionado:
localStorage.setItem('glassflow:preset', selectedPresetId)

// Restaurar al montar:
const savedPreset = localStorage.getItem('glassflow:preset') as LabelPresetId | null
if (savedPreset && LABEL_PRESETS.some(p => p.id === savedPreset)) {
  setSelectedPresetId(savedPreset)
}
```

## Consideraciones

- Siempre usar `try/catch` alrededor de operaciones IndexedDB (el storage puede estar lleno o bloqueado)
- Limitar el historial a `MAX_HISTORY_ENTRIES` para evitar crecimiento ilimitado
- El historial no se sincroniza entre máquinas (es local al navegador)
- En modo incógnito, IndexedDB se borra al cerrar el navegador
- `crypto.randomUUID()` está disponible en navegadores modernos (Chrome 92+, Firefox 95+)

## Componente sugerido: PrintHistoryPanel

```tsx
// src/components/PrintHistoryPanel.tsx
interface PrintHistoryPanelProps {
  onReprint: (labels: LabelModel[], presetId: LabelPresetId) => void
}
```

- Muestra una lista de las últimas N impresiones
- Cada entrada: nombre de archivo, fecha, cantidad de etiquetas, botón "Reimprimir"
- "Reimprimir" carga los labels del historial y los envía a Zebra con el preset guardado

## Errores comunes esperados

| Error | Causa | Solución |
|-------|-------|----------|
| `IDBOpenDBRequest` error | DB bloqueada por otra pestaña | Cerrar otras pestañas o usar `blocked` event handler |
| Datos perdidos | Usuario limpió storage del navegador | Informar al usuario, es esperado |
| `QuotaExceededError` | Storage lleno | Limpiar entradas viejas automáticamente |
| Tipo `any` en IDBRequest | IDB no tiene tipos genéricos nativos | Usar wrapper typesafe o librería `idb` |

## Librería opcional: idb

Si la API nativa de IndexedDB resulta muy verbosa:
```bash
npm install idb
```
Provee una API Promise-based y tipada sin mucho overhead.

## Criterio de "done"

- [ ] Cada impresión se guarda automáticamente en IndexedDB
- [ ] Panel de historial muestra las últimas 50 entradas
- [ ] Botón "Reimprimir" funciona correctamente
- [ ] El historial persiste al recargar la página
- [ ] Sin errores de TypeScript
- [ ] El flujo principal no se ve afectado si IndexedDB falla (silent fail con log)

# Skill: frontend-react-ui

## Cuándo usar
Cuando se trabaja con: componentes React, estado en App.tsx, CSS de la app, props de componentes, eventos del usuario, accesibilidad, preview de etiquetas.

## Archivos relevantes
- `src/App.tsx` — estado global y handlers
- `src/App.css` — estilos de la app
- `src/index.css` — reset/base styles
- `src/components/*.tsx` — todos los componentes
- `src/types.ts` — tipos compartidos

## Stack

- React 19 (sin legacy Context API, sin class components)
- TypeScript estricto
- Vite como bundler
- Sin librería de componentes UI (todo CSS propio)
- Sin librería de estado global (todo useState/useMemo en App.tsx)

## Estructura de estado en App.tsx

```ts
labels: LabelModel[]          // etiquetas cargadas del Excel
messages: AppMessage[]        // mensajes de éxito/warning
errorMessage: string | null   // error actual (solo uno a la vez)
fileName: string              // nombre del archivo cargado
currentFile: File | null      // archivo actual (para recargar al cambiar hoja)
sheetNames: string[]          // hojas disponibles en el workbook
selectedSheetName: string     // hoja activa
isProcessing: boolean         // cargando/procesando
selectedPresetId: LabelPresetId // preset de etiqueta activo
```

El `printScope` está hardcodeado a `'all'` por ahora. El scope real se resuelve en `resolveLabelsForScope`.

## Props de componentes

### UploadPanel
```ts
{ fileName: string; isProcessing: boolean; onFileSelect: (file: File | null) => void }
```

### SheetSelector
```ts
{ sheetNames: string[]; selectedSheetName: string; isProcessing: boolean; onSelectSheet: (name: string) => void }
```

### LabelPresetSelector
```ts
{ presets: LabelSettings[]; selectedPresetId: LabelPresetId; onSelectPreset: (id: LabelPresetId) => void }
```

### Toolbar
```ts
{
  hasLabels: boolean; totalCount: number; selectedCount: number; settingsSummary: string;
  onSelectAll: () => void; onClearSelection: () => void;
  onPrintAllWithZebra: () => void; onPrintSelectedWithZebra: () => void;
  onDownloadAllZpl: () => void; onDownloadSelectedZpl: () => void;
  onCopyAllZpl: () => void; onCopySelectedZpl: () => void;
}
```

### LabelPreviewList
```ts
{ labels: LabelModel[]; settings: LabelSettings; printScope: PrintScope; onToggleSelection: (id: string, selected: boolean) => void }
```

## Agregar un nuevo botón de acción

1. Agregar la función handler en `App.tsx`
2. Agregar la prop al tipo de `Toolbar` en `Toolbar.tsx`
3. Agregar el botón en el JSX de `Toolbar`
4. Pasar el handler desde `App.tsx` a `<Toolbar>`

## Agregar un nuevo campo a la preview

1. Agregar el campo a `LabelModel` en `types.ts`
2. Poblarlo en `excelParser.ts`
3. Mostrarlo en `LabelCard.tsx`
4. Sanitizarlo y agregarlo al ZPL en `zpl.ts`

## Variables CSS de layout de etiqueta

Definidas dinámicamente desde `App.tsx` con `useEffect`:
```css
--label-width-mm    /* ej: 100mm */
--label-height-mm   /* ej: 150mm */
--label-height-ratio /* ej: 1.5 */
```

Usar estas variables en `LabelCard.css` o `App.css` para mantener la proporción visual correcta.

## Clases CSS de layout

```css
.app-shell          /* contenedor principal */
.hero-panel         /* área de carga */
.status-panel       /* mensajes */
.workspace          /* área de trabajo con etiquetas */
.no-print           /* oculto al imprimir */
.message-card--success
.message-card--warning
```

## Reglas de componentes

- Un componente por archivo
- Props tipadas con `interface`, nunca `any`
- Eventos del usuario: `on{Acción}` (ej: `onFileSelect`, `onSelectSheet`)
- Estado local solo si no necesita coordinación con otros componentes
- `useCallback` y `useMemo` solo cuando hay un problema de performance real, no preventivamente

## Comandos de validación

```bash
npm run dev    # verificar en el navegador que no hay regresiones
npm run build  # sin errores de TypeScript ni Vite
npm run lint   # sin warnings de ESLint
```

## Errores comunes

| Error | Causa | Solución |
|-------|-------|----------|
| Preview de etiqueta distorsionada | `--label-height-ratio` no actualizado | Verificar el `useEffect` en App.tsx |
| Botón no responde | Handler no pasado como prop | Revisar el flujo desde App.tsx → Toolbar |
| Tipo `any` en props | Type inference perdida | Tipar explícitamente la prop |
| Estado stale | Closure capturando el estado anterior | Usar la forma funcional de setState: `setLabels(current => ...)` |

## Criterio de "done"

- [ ] Componente se renderiza sin errores en `npm run dev`
- [ ] Props correctamente tipadas (sin `any`)
- [ ] Accesibilidad básica: labels, aria, roles
- [ ] Sin errores en `npm run build`
- [ ] El flujo principal (cargar Excel → ver labels → imprimir) no se rompe

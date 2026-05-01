import type { ImportSummary } from '../types'

interface Props {
  summary: ImportSummary
}

const TABLE_TYPE_LABELS: Record<string, string> = {
  dvh: 'DVH',
  simple_glass: 'Vidrio simple',
}

export function ImportSummaryPanel({ summary }: Props) {
  return (
    <div className="import-summary">
      <h3 className="import-summary__title">Resumen de importación</h3>

      <div className="import-summary__tables">
        {summary.tables.map((t, i) => (
          <div key={i} className="import-summary__table-row">
            <span className="import-summary__badge">
              {TABLE_TYPE_LABELS[t.type] ?? t.type}
            </span>
            <span>{t.labelsValid + t.labelsWithWarnings} etiquetas</span>
            {t.labelsWithWarnings > 0 && (
              <span className="import-summary__warn">{t.labelsWithWarnings} advertencias</span>
            )}
            {t.labelsWithErrors > 0 && (
              <span className="import-summary__error">{t.labelsWithErrors} errores</span>
            )}
            {t.rowsIgnored > 0 && (
              <span className="import-summary__ignored">{t.rowsIgnored} ignoradas</span>
            )}
          </div>
        ))}
      </div>

      <div className="import-summary__totals">
        <span>
          <strong>{summary.totalValid + summary.totalWarnings}</strong> etiquetas listas
        </span>
        {summary.totalIgnored > 0 && (
          <span className="import-summary__ignored">{summary.totalIgnored} filas ignoradas</span>
        )}
        {summary.totalErrors > 0 && (
          <span className="import-summary__error">{summary.totalErrors} con error</span>
        )}
      </div>
    </div>
  )
}

import { LabelCard } from './LabelCard'
import type { LabelModel, LabelSettings, PrintScope } from '../types'

interface LabelPreviewListProps {
  labels: LabelModel[]
  settings: LabelSettings
  printScope: PrintScope
  onToggleSelection: (id: string, selected: boolean) => void
}

export function LabelPreviewList({
  labels,
  settings,
  printScope,
  onToggleSelection,
}: LabelPreviewListProps) {
  return (
    <div className="preview-panel print-area">
      <div className="preview-grid label-print-list">
        {labels.map((label) => (
          <LabelCard
            key={label.id}
            label={label}
            settings={settings}
            hiddenOnPrint={printScope === 'selected' && !label.selected}
            onToggleSelection={onToggleSelection}
          />
        ))}
      </div>
    </div>
  )
}

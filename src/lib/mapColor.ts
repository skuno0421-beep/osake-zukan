const COLOR_SCALE = [
  { min: 0, max: 0, color: '#F0F0F0' },
  { min: 1, max: 1, color: '#FFF0D0' },
  { min: 2, max: 3, color: '#FFCC80' },
  { min: 4, max: 6, color: '#FFA040' },
  { min: 7, max: 9, color: '#E07010' },
  { min: 10, max: Infinity, color: '#A04000' },
]

export function getPrefectureColor(count: number): string {
  const entry = COLOR_SCALE.find(({ min, max }) => count >= min && count <= max)
  return entry?.color ?? '#F0F0F0'
}

export function getColorLegend() {
  return COLOR_SCALE.map(({ min, max, color }) => ({
    label: max === Infinity ? `${min}件以上` : min === max ? `${min}件` : `${min}〜${max}件`,
    color,
  }))
}

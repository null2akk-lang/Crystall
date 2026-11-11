import type { Skin } from '../lib/game'
import { approximatePriceUsd } from '../lib/skin-prices'

export function SkinPrice({ item }: { item: Skin }) {
  const price = approximatePriceUsd(item)
  return (
    <span
      className="skin-price"
      title="Примерная цена обычной версии в долларах США"
    >
      {price.toLocaleString('ru-RU', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}{' '}
      $
    </span>
  )
}

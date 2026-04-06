'use client'

import { useInventory } from '@/lib/hooks/useInventory'
import { InventoryTable } from '@/components/inventory/InventoryTable'

export default function InventoryPage() {
  const { inventory, isLoading, error } = useInventory()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Warehouse Inventory</h1>
        <p className="text-gray-600 mt-2">
          Current available ingredients in warehouse. This view auto-refreshes every 10
          seconds to show real-time inventory levels.
        </p>
      </div>

      <InventoryTable inventory={inventory} isLoading={isLoading} error={error} />
    </div>
  )
}

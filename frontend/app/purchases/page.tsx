'use client'

import { usePurchases } from '@/lib/hooks/usePurchases'
import { PurchaseTable } from '@/components/purchases/PurchaseTable'

export default function PurchasesPage() {
  const { purchases, isLoading, error } = usePurchases()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Purchase History</h1>
        <p className="text-gray-600 mt-2">
          History of all ingredient purchases from the farmers market. Shows when
          warehouse inventory was insufficient.
        </p>
      </div>

      <PurchaseTable purchases={purchases} isLoading={isLoading} error={error} />
    </div>
  )
}

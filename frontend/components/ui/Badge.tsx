import { HTMLAttributes, forwardRef } from 'react'
import { clsx } from 'clsx'
import type { OrderStatus, DishStatus } from '@/lib/types'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'success' | 'warning' | 'error' | 'info' | 'default'
  status?: OrderStatus | DishStatus
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, status, children, ...props }, ref) => {
    // Determine variant from status if not explicitly provided
    const effectiveVariant = variant || getVariantFromStatus(status)

    const variantClasses = {
      success: 'bg-green-100 text-green-800 border-green-200',
      warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      error: 'bg-red-100 text-red-800 border-red-200',
      info: 'bg-blue-100 text-blue-800 border-blue-200',
      default: 'bg-gray-100 text-gray-800 border-gray-200'
    }

    return (
      <span
        ref={ref}
        className={clsx(
          'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
          variantClasses[effectiveVariant],
          className
        )}
        {...props}
      >
        {children || status}
      </span>
    )
  }
)

Badge.displayName = 'Badge'

function getVariantFromStatus(status?: OrderStatus | DishStatus): 'success' | 'warning' | 'error' | 'info' | 'default' {
  if (!status) return 'default'

  const statusMap: Record<string, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
    // Order statuses
    COMPLETED: 'success',
    IN_PROGRESS: 'info',
    PENDING: 'warning',
    FAILED: 'error',

    // Dish statuses
    PREPARED: 'success',
    PREPARING: 'info',
    WAITING_INGREDIENTS: 'warning'
  }

  return statusMap[status] || 'default'
}

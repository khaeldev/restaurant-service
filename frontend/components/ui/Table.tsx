import { HTMLAttributes, forwardRef } from 'react'
import { clsx } from 'clsx'

export const Table = forwardRef<HTMLTableElement, HTMLAttributes<HTMLTableElement>>(
  ({ className, children, ...props }, ref) => (
    <div className="overflow-x-auto">
      <table
        ref={ref}
        className={clsx('min-w-full divide-y divide-gray-200', className)}
        {...props}
      >
        {children}
      </table>
    </div>
  )
)

Table.displayName = 'Table'

export const TableHead = forwardRef<HTMLTableSectionElement, HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, children, ...props }, ref) => (
    <thead ref={ref} className={clsx('bg-gray-50', className)} {...props}>
      {children}
    </thead>
  )
)

TableHead.displayName = 'TableHead'

export const TableBody = forwardRef<HTMLTableSectionElement, HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, children, ...props }, ref) => (
    <tbody
      ref={ref}
      className={clsx('bg-white divide-y divide-gray-200', className)}
      {...props}
    >
      {children}
    </tbody>
  )
)

TableBody.displayName = 'TableBody'

export const TableRow = forwardRef<HTMLTableRowElement, HTMLAttributes<HTMLTableRowElement>>(
  ({ className, children, ...props }, ref) => (
    <tr ref={ref} className={clsx('hover:bg-gray-50', className)} {...props}>
      {children}
    </tr>
  )
)

TableRow.displayName = 'TableRow'

export const TableHeader = forwardRef<HTMLTableCellElement, HTMLAttributes<HTMLTableCellElement>>(
  ({ className, children, ...props }, ref) => (
    <th
      ref={ref}
      className={clsx(
        'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider',
        className
      )}
      {...props}
    >
      {children}
    </th>
  )
)

TableHeader.displayName = 'TableHeader'

export const TableCell = forwardRef<HTMLTableCellElement, HTMLAttributes<HTMLTableCellElement>>(
  ({ className, children, ...props }, ref) => (
    <td
      ref={ref}
      className={clsx('px-6 py-4 whitespace-nowrap text-sm text-gray-900', className)}
      {...props}
    >
      {children}
    </td>
  )
)

TableCell.displayName = 'TableCell'

import { useState, useEffect, useRef } from 'react'

type Initializer<T> = T | (() => T)

function resolve<T>(init: Initializer<T>): T {
  return typeof init === 'function' ? (init as () => T)() : init
}

/**
 * Like useState but persists to localStorage under `key`.
 * Falls back to `initialValue` if nothing is stored yet.
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: Initializer<T>,
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key)
      if (raw !== null) return JSON.parse(raw) as T
    } catch {
      // ignore parse errors
    }
    return resolve(initialValue)
  })

  // Keep a ref so the effect always has the latest value without re-running
  const stateRef = useRef(state)
  stateRef.current = state

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(stateRef.current))
    } catch {
      // quota exceeded or private browsing — silently skip
    }
  }, [key, state])

  return [state, setState]
}

/**
 * Read-only sync access to a localStorage key — useful when a page
 * needs another module's persisted data without owning it.
 * Returns the stored value if present, otherwise `fallback`.
 */
export function readLocalStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (raw !== null) return JSON.parse(raw) as T
  } catch {
    // ignore
  }
  return fallback
}

/** All localStorage keys used across the virtual DB */
export const DB_KEYS = {
  // HR
  employees:            'vetafarm_employees',
  // Suppliers & Customers
  suppliers:            'vetafarm_suppliers',
  // Sales
  saleOrders:           'vetafarm_sale_orders',
  salePayments:         'vetafarm_sale_payments',
  // Purchasing
  purchaseOrders:       'vetafarm_purchase_orders',
  purchasePayments:     'vetafarm_purchase_payments',
  // Attendance
  attendanceRecords:    'vetafarm_attendance_records',
  attendanceLeaves:     'vetafarm_attendance_leaves',
  // Payroll
  payrollRecords:       'vetafarm_payroll_records',
  // Cashier / Treasury
  treasuryAccounts:     'vetafarm_treasury_accounts',
  treasuryTxs:          'vetafarm_treasury_txs',
  // Settings
  users:                'vetafarm_users',
  rules:                'vetafarm_rules',
  // Accounts (General Ledger)
  accountsChart:        'vetafarm_accounts_chart',
  accountsEntries:      'vetafarm_accounts_entries',
  accountsCostCenters:  'vetafarm_accounts_cost_centers',
  accountsAssets:       'vetafarm_accounts_assets',
  accountsBankAccounts: 'vetafarm_accounts_bank_accounts',
  accountsTreasuries:   'vetafarm_accounts_treasuries',
} as const

import React, { createContext, useContext } from 'react'
import type {
  Account, JournalEntry, CostCenter, Currency,
  Asset, BankAccount, Treasury
} from '../../types/accounts'
import {
  CHART_OF_ACCOUNTS, JOURNAL_ENTRIES, COST_CENTERS,
  CURRENCIES, ASSETS, BANK_ACCOUNTS, TREASURIES,
  MOCK_CUSTOMERS, MOCK_SUPPLIERS,
} from '../../data/accountsData'
import { useLocalStorage, DB_KEYS } from '../../hooks/useLocalStorage'

interface AccountsContextType {
  accounts:        Account[]
  setAccounts:     React.Dispatch<React.SetStateAction<Account[]>>
  entries:         JournalEntry[]
  setEntries:      React.Dispatch<React.SetStateAction<JournalEntry[]>>
  costCenters:     CostCenter[]
  setCostCenters:  React.Dispatch<React.SetStateAction<CostCenter[]>>
  currencies:      Currency[]
  assets:          Asset[]
  setAssets:       React.Dispatch<React.SetStateAction<Asset[]>>
  bankAccounts:    BankAccount[]
  setBankAccounts: React.Dispatch<React.SetStateAction<BankAccount[]>>
  treasuries:      Treasury[]
  setTreasuries:   React.Dispatch<React.SetStateAction<Treasury[]>>

  customers: { id: string; name: string }[]
  suppliers: { id: string; name: string }[]

  postJournalEntry: (entry: JournalEntry) => void
}

const AccountsContext = createContext<AccountsContextType | null>(null)

export function AccountsProvider({ children }: { children: React.ReactNode }) {
  // ── Persistent state via virtual DB ──────────────────────────────────────
  const [accounts,     setAccounts]     = useLocalStorage<Account[]>     (DB_KEYS.accountsChart,        CHART_OF_ACCOUNTS)
  const [entries,      setEntries]      = useLocalStorage<JournalEntry[]> (DB_KEYS.accountsEntries,      JOURNAL_ENTRIES)
  const [costCenters,  setCostCenters]  = useLocalStorage<CostCenter[]>   (DB_KEYS.accountsCostCenters,  COST_CENTERS)
  const [assets,       setAssets]       = useLocalStorage<Asset[]>        (DB_KEYS.accountsAssets,       ASSETS)
  const [bankAccounts, setBankAccounts] = useLocalStorage<BankAccount[]>  (DB_KEYS.accountsBankAccounts, BANK_ACCOUNTS)
  const [treasuries,   setTreasuries]   = useLocalStorage<Treasury[]>     (DB_KEYS.accountsTreasuries,   TREASURIES)

  // Currencies & parties are static config — no persistence needed
  const currencies = CURRENCIES
  const customers  = MOCK_CUSTOMERS
  const suppliers  = MOCK_SUPPLIERS

  // ── Double-entry posting ──────────────────────────────────────────────────
  const postJournalEntry = (entry: JournalEntry) => {
    // 1. Append entry
    setEntries(prev => [entry, ...prev])

    // 2. Adjust balances using account nature
    //    Debit-nature accounts: debit increases balance, credit decreases
    //    Credit-nature accounts: credit increases balance, debit decreases
    setAccounts(prev => prev.map(acc => {
      let netChange = 0
      entry.lines.forEach(line => {
        if (line.accountId === acc.id) {
          netChange += acc.nature === 'debit'
            ? (line.debit  - line.credit)
            : (line.credit - line.debit)
        }
      })
      return netChange !== 0 ? { ...acc, balance: acc.balance + netChange } : acc
    }))
  }

  return (
    <AccountsContext.Provider value={{
      accounts,     setAccounts,
      entries,      setEntries,
      costCenters,  setCostCenters,
      currencies,
      assets,       setAssets,
      bankAccounts, setBankAccounts,
      treasuries,   setTreasuries,
      customers,    suppliers,
      postJournalEntry,
    }}>
      {children}
    </AccountsContext.Provider>
  )
}

export function useAccounts() {
  const ctx = useContext(AccountsContext)
  if (!ctx) throw new Error('useAccounts must be used within AccountsProvider')
  return ctx
}

export type AccountType = 'cash' | 'bank'
export type TxType     = 'deposit' | 'withdrawal' | 'transfer'
export type TxCategory =
  | 'sales'
  | 'purchasing'
  | 'payroll'
  | 'operating'
  | 'maintenance'
  | 'transfer'
  | 'other'

export interface TreasuryAccount {
  id: string
  name: string
  type: AccountType
  bankName?: string
  accountNumber?: string
  balance: number
  isActive: boolean
}

export interface TreasuryTransaction {
  id: string
  txNumber: string
  date: string
  type: TxType
  category: TxCategory
  accountId: string
  targetAccountId?: string
  amount: number
  description: string
  reference?: string
  notes?: string
}

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  cash: 'صندوق نقدي',
  bank: 'حساب بنكي',
}

export const TX_TYPE_LABELS: Record<TxType, string> = {
  deposit:    'إيداع',
  withdrawal: 'سحب',
  transfer:   'تحويل',
}

export const TX_CATEGORY_LABELS: Record<TxCategory, string> = {
  sales:       'تحصيل مبيعات',
  purchasing:  'دفع مشتريات',
  payroll:     'رواتب وأجور',
  operating:   'مصروفات تشغيلية',
  maintenance: 'صيانة',
  transfer:    'تحويل داخلي',
  other:       'أخرى',
}

export const DEPOSIT_CATEGORIES: TxCategory[]    = ['sales', 'other']
export const WITHDRAWAL_CATEGORIES: TxCategory[] = ['purchasing', 'payroll', 'operating', 'maintenance', 'other']

// ─── Account Types ────────────────────────────────────────────────────────────

export type AccountCategory =
  | 'fixed_assets'       // أصول ثابتة
  | 'current_assets'     // أصول متداولة
  | 'inventory'          // مخزون
  | 'receivables'        // ذمم مدينة (عملاء)
  | 'banks'              // بنوك
  | 'treasuries'         // خزائن/نقدية
  | 'current_liabilities'// التزامات متداولة
  | 'long_liabilities'   // التزامات طويلة الأجل
  | 'payables'           // ذمم دائنة (موردون)
  | 'equity'             // حقوق الملكية
  | 'revenue'            // إيرادات
  | 'cogs'               // تكلفة البضاعة المباعة
  | 'expenses'           // مصاريف
  | 'other_income'       // دخل آخر
  | 'other_expenses'     // مصاريف أخرى

export type AccountNature = 'debit' | 'credit' // طبيعة الحساب (مدين/دائن)

export type AccountLevel = 1 | 2 | 3

export interface Account {
  id: string
  code: string              // رقم الحساب (مثلاً 1101)
  name: string              // اسم الحساب
  nameEn?: string
  category: AccountCategory
  nature: AccountNature
  level: AccountLevel
  parentId: string | null
  balance: number           // الرصيد بالعملة الرئيسية
  currency: string          // ج.م / USD / EUR …
  isActive: boolean
  allowPosting: boolean     // هل يمكن الترحيل إليه مباشرة؟
  notes?: string
}

// ─── Journal Entry Types ──────────────────────────────────────────────────────

export type JournalEntryType =
  | 'general'       // قيد عام
  | 'collection'    // تحصيل
  | 'payment'       // دفع/صرف
  | 'expense'       // مصروف
  | 'revenue'       // إيراد
  | 'salary'        // مرتب / راتب
  | 'purchase'      // شراء
  | 'sale'          // بيع
  | 'advance'       // سلفة
  | 'discount'      // خصم
  | 'gratuity'      // إكرامية
  | 'depreciation'  // إهلاك
  | 'closing'       // قيد إغلاق
  | 'inventory_in'  // إضافة مخزون
  | 'inventory_out' // سحب مخزون

export type JournalEntryStatus = 'draft' | 'posted' | 'closed'

export interface JournalLine {
  id: string
  accountId: string
  accountCode: string
  accountName: string
  debit: number             // مدين بالعملة الرئيسية
  credit: number            // دائن بالعملة الرئيسية
  amount: number            // المبلغ بالعملة الأصلية
  currency: string
  exchangeRate: number      // معامل التحويل
  costCenterId?: string     // مركز التكلفة
  notes?: string
}

export interface JournalEntry {
  id: string
  number: string            // رقم القيد (مثلاً JE-2026-0042)
  date: string              // ISO date
  description: string       // بيان القيد
  type: JournalEntryType
  status: JournalEntryStatus
  lines: JournalLine[]
  totalDebit: number
  totalCredit: number
  isBalanced: boolean
  customerId?: string       // عميل مرتبط
  supplierId?: string       // مورد مرتبط
  salesOrderId?: string     // أمر بيع
  purchaseOrderId?: string  // أمر شراء
  costCenterId?: string
  createdBy: string
  createdAt: string
  postedAt?: string
}

// ─── Cost Center ──────────────────────────────────────────────────────────────

export interface CostCenter {
  id: string
  code: string
  name: string
  description?: string
  isActive: boolean
}

// ─── Currency ─────────────────────────────────────────────────────────────────

export interface Currency {
  code: string           // EGP, USD, EUR …
  name: string           // الجنيه المصري
  symbol: string         // ج.م / $ / €
  exchangeRate: number   // معامل التحويل للعملة الرئيسية
  isBase: boolean
  isActive: boolean
}

// ─── Asset ────────────────────────────────────────────────────────────────────

export type DepreciationMethod = 'straight_line' | 'declining_balance'
export type AssetType = 'equipment' | 'vehicle' | 'building' | 'land' | 'furniture' | 'other'

export interface Asset {
  id: string
  code: string
  name: string
  type: AssetType
  purchaseDate: string
  purchaseCost: number
  usefulLifeYears: number
  depreciationMethod: DepreciationMethod
  residualValue: number
  accumulatedDepreciation: number
  bookValue: number          // القيمة الدفترية
  accountId: string          // حساب الأصل
  depExpenseAccountId: string// حساب مصروف الإهلاك
  accDepAccountId: string    // حساب مجمع الإهلاك
  isDisposed: boolean
  notes?: string
}

// ─── Bank Account ─────────────────────────────────────────────────────────────

export interface BankAccount {
  id: string
  code: string
  bankName: string
  accountName: string
  accountNumber: string
  currency: string
  openingBalance: number
  currentBalance: number
  accountId: string      // الحساب في شجرة الحسابات
  isActive: boolean
}

// ─── Treasury (Safe/Cash Box) ─────────────────────────────────────────────────

export interface Treasury {
  id: string
  code: string
  name: string
  currency: string
  openingBalance: number
  currentBalance: number
  accountId: string
  isActive: boolean
  custodian?: string     // أمين الصندوق
}

// ─── Inventory Settings ───────────────────────────────────────────────────────

export type InventoryMethod = 'perpetual' | 'periodic'

// ─── Report Types ─────────────────────────────────────────────────────────────

export interface TrialBalanceLine {
  accountCode: string
  accountName: string
  category: AccountCategory
  totalDebit: number
  totalCredit: number
  balance: number
  nature: AccountNature
}

export interface BalanceSheetSection {
  title: string
  items: { name: string; amount: number; code: string }[]
  total: number
}

export interface IncomeStatementLine {
  name: string
  amount: number
  code: string
  pct?: number
}

// ─── Filter & UI Helpers ──────────────────────────────────────────────────────

export type ReportPeriod = 'today' | 'this_week' | 'this_month' | 'this_quarter' | 'this_year' | 'custom'

export const ACCOUNT_CATEGORY_LABELS: Record<AccountCategory, string> = {
  fixed_assets:        'الأصول الثابتة',
  current_assets:      'الأصول المتداولة',
  inventory:           'المخزون',
  receivables:         'ذمم مدينة — عملاء',
  banks:               'بنوك',
  treasuries:          'خزائن ونقدية',
  current_liabilities: 'التزامات متداولة',
  long_liabilities:    'التزامات طويلة الأجل',
  payables:            'ذمم دائنة — موردون',
  equity:              'حقوق الملكية',
  revenue:             'الإيرادات',
  cogs:                'تكلفة البضاعة المباعة',
  expenses:            'المصاريف',
  other_income:        'إيرادات أخرى',
  other_expenses:      'مصاريف أخرى',
}

export const JOURNAL_TYPE_LABELS: Record<JournalEntryType, string> = {
  general:       'قيد عام',
  collection:    'تحصيل',
  payment:       'مدفوعات',
  expense:       'مصروف',
  revenue:       'إيراد',
  salary:        'مرتبات',
  purchase:      'شراء',
  sale:          'بيع',
  advance:       'سلفة',
  discount:      'خصم',
  gratuity:      'إكرامية',
  depreciation:  'إهلاك',
  closing:       'قيد إغلاق',
  inventory_in:  'إضافة مخزون',
  inventory_out: 'سحب مخزون',
}

export const JOURNAL_STATUS_LABELS: Record<JournalEntryStatus, string> = {
  draft:  'مسودة',
  posted: 'مرحّل',
  closed: 'مغلق',
}

export const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  equipment: 'معدات وآلات',
  vehicle:   'سيارات',
  building:  'مباني وعقارات',
  land:      'أراضي',
  furniture: 'أثاث وتجهيزات',
  other:     'أخرى',
}

export const DEPRECIATION_METHOD_LABELS: Record<DepreciationMethod, string> = {
  straight_line:     'القسط الثابت',
  declining_balance: 'القسط المتناقص',
}

export const ACCOUNT_CATEGORY_GROUPS: { label: string; bg: string; text: string; border: string; categories: AccountCategory[] }[] = [
  {
    label: 'الأصول',
    bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-200',
    categories: ['fixed_assets', 'current_assets', 'inventory', 'receivables', 'banks', 'treasuries'],
  },
  {
    label: 'الالتزامات',
    bg: 'bg-red-50', text: 'text-red-800', border: 'border-red-200',
    categories: ['current_liabilities', 'long_liabilities', 'payables'],
  },
  {
    label: 'حقوق الملكية',
    bg: 'bg-purple-50', text: 'text-purple-800', border: 'border-purple-200',
    categories: ['equity'],
  },
  {
    label: 'الإيرادات',
    bg: 'bg-green-50', text: 'text-green-800', border: 'border-green-200',
    categories: ['revenue', 'other_income'],
  },
  {
    label: 'المصاريف',
    bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200',
    categories: ['cogs', 'expenses', 'other_expenses'],
  },
]

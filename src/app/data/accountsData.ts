import type {
  Account, JournalEntry, CostCenter, Currency,
  Asset, BankAccount, Treasury,
} from '../types/accounts'

// ─────────────────────────────────────────────────────────────────────────────
// شجرة الحسابات القياسية (Chart of Accounts)
// ─────────────────────────────────────────────────────────────────────────────
export const CHART_OF_ACCOUNTS: Account[] = [
  // ══════════════════ 1 — الأصول ══════════════════
  { id: 'a1',    code: '1',    name: 'الأصول',               category: 'current_assets', nature: 'debit', level: 1, parentId: null,  balance: 4_820_000, currency: 'EGP', isActive: true, allowPosting: false },

  // 11 — الأصول الثابتة
  { id: 'a11',   code: '11',   name: 'الأصول الثابتة',       category: 'fixed_assets',   nature: 'debit', level: 2, parentId: 'a1',  balance: 2_100_000, currency: 'EGP', isActive: true, allowPosting: false },
  { id: 'a1101', code: '1101', name: 'مباني وعقارات',         category: 'fixed_assets',   nature: 'debit', level: 3, parentId: 'a11', balance: 1_200_000, currency: 'EGP', isActive: true, allowPosting: true },
  { id: 'a1102', code: '1102', name: 'أراضي',                 category: 'fixed_assets',   nature: 'debit', level: 3, parentId: 'a11', balance: 400_000,   currency: 'EGP', isActive: true, allowPosting: true },
  { id: 'a1103', code: '1103', name: 'آلات ومعدات',           category: 'fixed_assets',   nature: 'debit', level: 3, parentId: 'a11', balance: 350_000,   currency: 'EGP', isActive: true, allowPosting: true },
  { id: 'a1104', code: '1104', name: 'سيارات ومركبات',        category: 'fixed_assets',   nature: 'debit', level: 3, parentId: 'a11', balance: 250_000,   currency: 'EGP', isActive: true, allowPosting: true },
  { id: 'a1105', code: '1105', name: 'أثاث وتجهيزات',         category: 'fixed_assets',   nature: 'debit', level: 3, parentId: 'a11', balance: 80_000,    currency: 'EGP', isActive: true, allowPosting: true },
  { id: 'a1106', code: '1106', name: 'مجمع الإهلاك',          category: 'fixed_assets',   nature: 'credit',level: 3, parentId: 'a11', balance: -180_000,  currency: 'EGP', isActive: true, allowPosting: true },

  // 12 — الأصول المتداولة
  { id: 'a12',   code: '12',   name: 'الأصول المتداولة',     category: 'current_assets', nature: 'debit', level: 2, parentId: 'a1',  balance: 1_470_000, currency: 'EGP', isActive: true, allowPosting: false },
  { id: 'a1201', code: '1201', name: 'نقدية بالصندوق الرئيسي',category: 'treasuries',    nature: 'debit', level: 3, parentId: 'a12', balance: 150_000,   currency: 'EGP', isActive: true, allowPosting: true },
  { id: 'a1202', code: '1202', name: 'صندوق العمليات اليومية',category: 'treasuries',    nature: 'debit', level: 3, parentId: 'a12', balance: 30_000,    currency: 'EGP', isActive: true, allowPosting: true },
  { id: 'a1211', code: '1211', name: 'بنك مصر — الحساب الجاري',category: 'banks',        nature: 'debit', level: 3, parentId: 'a12', balance: 680_000,   currency: 'EGP', isActive: true, allowPosting: true },
  { id: 'a1212', code: '1212', name: 'البنك الأهلي — توفير',  category: 'banks',          nature: 'debit', level: 3, parentId: 'a12', balance: 320_000,   currency: 'EGP', isActive: true, allowPosting: true },
  { id: 'a1213', code: '1213', name: 'بنك CIB — حساب دولار',  category: 'banks',          nature: 'debit', level: 3, parentId: 'a12', balance: 290_000,   currency: 'USD', isActive: true, allowPosting: true },

  // 13 — المخزون
  { id: 'a13',   code: '13',   name: 'المخزون',              category: 'inventory',    nature: 'debit', level: 2, parentId: 'a1',  balance: 680_000,   currency: 'EGP', isActive: true, allowPosting: false },
  { id: 'a1301', code: '1301', name: 'مخزون المواد تغليف',         category: 'inventory',    nature: 'debit', level: 3, parentId: 'a13', balance: 280_000,   currency: 'EGP', isActive: true, allowPosting: true },
  { id: 'a1302', code: '1302', name: 'مخزون الغازات فريون والمستلزمات',category: 'inventory', nature: 'debit', level: 3, parentId: 'a13', balance: 95_000,    currency: 'EGP', isActive: true, allowPosting: true },
  { id: 'a1303', code: '1303', name: 'مخزون الأسماك ولحوم (للتجميد)',category: 'inventory',    nature: 'debit', level: 3, parentId: 'a13', balance: 305_000,   currency: 'EGP', isActive: true, allowPosting: true },

  // 14 — الذمم المدينة
  { id: 'a14',   code: '14',   name: 'الذمم المدينة',        category: 'receivables',   nature: 'debit', level: 2, parentId: 'a1',  balance: 570_000,   currency: 'EGP', isActive: true, allowPosting: false },
  { id: 'a1401', code: '1401', name: 'حسابات العملاء',        category: 'receivables',   nature: 'debit', level: 3, parentId: 'a14', balance: 440_000,   currency: 'EGP', isActive: true, allowPosting: true },
  { id: 'a1402', code: '1402', name: 'أوراق قبض',             category: 'receivables',   nature: 'debit', level: 3, parentId: 'a14', balance: 80_000,    currency: 'EGP', isActive: true, allowPosting: true },
  { id: 'a1403', code: '1403', name: 'سلف الموظفين',          category: 'receivables',   nature: 'debit', level: 3, parentId: 'a14', balance: 50_000,    currency: 'EGP', isActive: true, allowPosting: true },
  { id: 'a1404', code: '1404', name: 'مردودات المبيعات',      category: 'receivables',   nature: 'debit', level: 3, parentId: 'a14', balance: 0,         currency: 'EGP', isActive: true, allowPosting: true },

  // ══════════════════ 2 — الالتزامات ══════════════════
  { id: 'a2',    code: '2',    name: 'الالتزامات',           category: 'current_liabilities', nature: 'credit', level: 1, parentId: null,  balance: 1_380_000, currency: 'EGP', isActive: true, allowPosting: false },

  // 21 — الالتزامات المتداولة
  { id: 'a21',   code: '21',   name: 'الالتزامات المتداولة', category: 'current_liabilities', nature: 'credit', level: 2, parentId: 'a2',  balance: 680_000,   currency: 'EGP', isActive: true, allowPosting: false },
  { id: 'a2101', code: '2101', name: 'حسابات الموردين',       category: 'payables',            nature: 'credit', level: 3, parentId: 'a21', balance: 380_000,   currency: 'EGP', isActive: true, allowPosting: true },
  { id: 'a2102', code: '2102', name: 'أوراق دفع',             category: 'payables',            nature: 'credit', level: 3, parentId: 'a21', balance: 120_000,   currency: 'EGP', isActive: true, allowPosting: true },
  { id: 'a2103', code: '2103', name: 'مصاريف مستحقة الدفع',  category: 'current_liabilities', nature: 'credit', level: 3, parentId: 'a21', balance: 85_000,    currency: 'EGP', isActive: true, allowPosting: true },
  { id: 'a2104', code: '2104', name: 'رواتب مستحقة',          category: 'current_liabilities', nature: 'credit', level: 3, parentId: 'a21', balance: 75_000,    currency: 'EGP', isActive: true, allowPosting: true },
  { id: 'a2105', code: '2105', name: 'ضرائب مستحقة',          category: 'current_liabilities', nature: 'credit', level: 3, parentId: 'a21', balance: 20_000,    currency: 'EGP', isActive: true, allowPosting: true },
  { id: 'a2106', code: '2106', name: 'مردودات المشتريات',     category: 'current_liabilities', nature: 'credit', level: 3, parentId: 'a21', balance: 0,         currency: 'EGP', isActive: true, allowPosting: true },

  // 22 — الالتزامات طويلة الأجل
  { id: 'a22',   code: '22',   name: 'التزامات طويلة الأجل', category: 'long_liabilities', nature: 'credit', level: 2, parentId: 'a2',  balance: 700_000,   currency: 'EGP', isActive: true, allowPosting: false },
  { id: 'a2201', code: '2201', name: 'قروض بنكية طويلة الأجل',category: 'long_liabilities', nature: 'credit', level: 3, parentId: 'a22', balance: 700_000,   currency: 'EGP', isActive: true, allowPosting: true },

  // ══════════════════ 3 — حقوق الملكية ══════════════════
  { id: 'a3',    code: '3',    name: 'حقوق الملكية',          category: 'equity', nature: 'credit', level: 1, parentId: null,  balance: 3_440_000, currency: 'EGP', isActive: true, allowPosting: false },
  { id: 'a31',   code: '31',   name: 'رأس المال',              category: 'equity', nature: 'credit', level: 2, parentId: 'a3',  balance: 2_500_000, currency: 'EGP', isActive: true, allowPosting: false },
  { id: 'a3101', code: '3101', name: 'رأس المال المدفوع',      category: 'equity', nature: 'credit', level: 3, parentId: 'a31', balance: 2_500_000, currency: 'EGP', isActive: true, allowPosting: true },
  { id: 'a32',   code: '32',   name: 'الاحتياطيات',            category: 'equity', nature: 'credit', level: 2, parentId: 'a3',  balance: 540_000,   currency: 'EGP', isActive: true, allowPosting: false },
  { id: 'a3201', code: '3201', name: 'احتياطي قانوني',         category: 'equity', nature: 'credit', level: 3, parentId: 'a32', balance: 340_000,   currency: 'EGP', isActive: true, allowPosting: true },
  { id: 'a3202', code: '3202', name: 'احتياطي عام',            category: 'equity', nature: 'credit', level: 3, parentId: 'a32', balance: 200_000,   currency: 'EGP', isActive: true, allowPosting: true },
  { id: 'a33',   code: '33',   name: 'الأرباح والخسائر',       category: 'equity', nature: 'credit', level: 2, parentId: 'a3',  balance: 400_000,   currency: 'EGP', isActive: true, allowPosting: false },
  { id: 'a3301', code: '3301', name: 'أرباح السنوات السابقة',  category: 'equity', nature: 'credit', level: 3, parentId: 'a33', balance: 197_600,   currency: 'EGP', isActive: true, allowPosting: true },
  { id: 'a3302', code: '3302', name: 'أرباح وخسائر السنة الحالية',category: 'equity', nature: 'credit', level: 3, parentId: 'a33', balance: 202_400, currency: 'EGP', isActive: true, allowPosting: true },

  // ══════════════════ 4 — الإيرادات ══════════════════
  { id: 'a4',    code: '4',    name: 'الإيرادات',             category: 'revenue', nature: 'credit', level: 1, parentId: null,  balance: 1_221_500, currency: 'EGP', isActive: true, allowPosting: false },
  { id: 'a41',   code: '41',   name: 'إيرادات المبيعات',      category: 'revenue', nature: 'credit', level: 2, parentId: 'a4',  balance: 1_206_500, currency: 'EGP', isActive: true, allowPosting: false },
  { id: 'a4101', code: '4101', name: 'مبيعات بضائع مخزنة (رؤوس)',   category: 'revenue', nature: 'credit', level: 3, parentId: 'a41', balance: 780_000,   currency: 'EGP', isActive: true, allowPosting: true },
  { id: 'a4102', code: '4102', name: 'مبيعات منتجات مبردة',   category: 'revenue', nature: 'credit', level: 3, parentId: 'a41', balance: 286_500,   currency: 'EGP', isActive: true, allowPosting: true },
  { id: 'a4103', code: '4103', name: 'مبيعات مواد تغليف فائضة',   category: 'revenue', nature: 'credit', level: 3, parentId: 'a41', balance: 75_000,    currency: 'EGP', isActive: true, allowPosting: true },
  { id: 'a4104', code: '4104', name: 'مبيعات منتجات ثانوية',  category: 'revenue', nature: 'credit', level: 3, parentId: 'a41', balance: 65_000,    currency: 'EGP', isActive: true, allowPosting: true },
  { id: 'a42',   code: '42',   name: 'إيرادات أخرى',          category: 'other_income', nature: 'credit', level: 2, parentId: 'a4', balance: 15_000, currency: 'EGP', isActive: true, allowPosting: false },
  { id: 'a4201', code: '4201', name: 'إيرادات إيجارات',       category: 'other_income', nature: 'credit', level: 3, parentId: 'a42', balance: 10_000, currency: 'EGP', isActive: true, allowPosting: true },
  { id: 'a4202', code: '4202', name: 'فوائد بنكية',           category: 'other_income', nature: 'credit', level: 3, parentId: 'a42', balance: 5_000,  currency: 'EGP', isActive: true, allowPosting: true },

  // ══════════════════ 5 — المصاريف ══════════════════
  { id: 'a5',    code: '5',    name: 'المصاريف',              category: 'expenses', nature: 'debit', level: 1, parentId: null,  balance: 1_019_100, currency: 'EGP', isActive: true, allowPosting: false },

  // 51 — تكلفة البضاعة
  { id: 'a51',   code: '51',   name: 'تكلفة البضاعة المباعة', category: 'cogs',     nature: 'debit', level: 2, parentId: 'a5',  balance: 496_000,   currency: 'EGP', isActive: true, allowPosting: false },
  { id: 'a5101', code: '5101', name: 'مشتريات بضائع مخزنة ومواد تغليف',  category: 'cogs',     nature: 'debit', level: 3, parentId: 'a51', balance: 496_000,   currency: 'EGP', isActive: true, allowPosting: true },

  // 52 — رواتب وأجور
  { id: 'a52',   code: '52',   name: 'الرواتب والأجور',       category: 'expenses', nature: 'debit', level: 2, parentId: 'a5',  balance: 370_000,   currency: 'EGP', isActive: true, allowPosting: false },
  { id: 'a5201', code: '5201', name: 'رواتب العمالة',          category: 'expenses', nature: 'debit', level: 3, parentId: 'a52', balance: 280_000,   currency: 'EGP', isActive: true, allowPosting: true },
  { id: 'a5202', code: '5202', name: 'مكافآت وحوافز',         category: 'expenses', nature: 'debit', level: 3, parentId: 'a52', balance: 60_000,    currency: 'EGP', isActive: true, allowPosting: true },
  { id: 'a5203', code: '5203', name: 'اشتراكات تأمينات',       category: 'expenses', nature: 'debit', level: 3, parentId: 'a52', balance: 30_000,    currency: 'EGP', isActive: true, allowPosting: true },

  // 53 — المصاريف التشغيلية
  { id: 'a53',   code: '53',   name: 'المصاريف التشغيلية',   category: 'expenses', nature: 'debit', level: 2, parentId: 'a5',  balance: 82_000,    currency: 'EGP', isActive: true, allowPosting: false },
  { id: 'a5301', code: '5301', name: 'مصاريف كهرباء ومياه',   category: 'expenses', nature: 'debit', level: 3, parentId: 'a53', balance: 28_000,    currency: 'EGP', isActive: true, allowPosting: true },
  { id: 'a5302', code: '5302', name: 'مصاريف وقود ومحروقات',  category: 'expenses', nature: 'debit', level: 3, parentId: 'a53', balance: 32_000,    currency: 'EGP', isActive: true, allowPosting: true },
  { id: 'a5303', code: '5303', name: 'مصاريف نقل وشحن',       category: 'expenses', nature: 'debit', level: 3, parentId: 'a53', balance: 12_000,    currency: 'EGP', isActive: true, allowPosting: true },
  { id: 'a5304', code: '5304', name: 'مصاريف اتصالات',         category: 'expenses', nature: 'debit', level: 3, parentId: 'a53', balance: 4_500,     currency: 'EGP', isActive: true, allowPosting: true },
  { id: 'a5305', code: '5305', name: 'مصاريف إدارية عمومية',  category: 'expenses', nature: 'debit', level: 3, parentId: 'a53', balance: 5_500,     currency: 'EGP', isActive: true, allowPosting: true },

  // 54 — الصيانة
  { id: 'a54',   code: '54',   name: 'مصاريف الصيانة',        category: 'expenses', nature: 'debit', level: 2, parentId: 'a5',  balance: 36_000,    currency: 'EGP', isActive: true, allowPosting: false },
  { id: 'a5401', code: '5401', name: 'صيانة آلات ومعدات',      category: 'expenses', nature: 'debit', level: 3, parentId: 'a54', balance: 18_000,    currency: 'EGP', isActive: true, allowPosting: true },
  { id: 'a5402', code: '5402', name: 'صيانة مباني وعنابر تبريد',    category: 'expenses', nature: 'debit', level: 3, parentId: 'a54', balance: 12_000,    currency: 'EGP', isActive: true, allowPosting: true },
  { id: 'a5403', code: '5403', name: 'صيانة سيارات',           category: 'expenses', nature: 'debit', level: 3, parentId: 'a54', balance: 6_000,     currency: 'EGP', isActive: true, allowPosting: true },

  // 55 — الإهلاك
  { id: 'a55',   code: '55',   name: 'مصاريف الإهلاك',        category: 'expenses', nature: 'debit', level: 2, parentId: 'a5',  balance: 35_100,    currency: 'EGP', isActive: true, allowPosting: false },
  { id: 'a5501', code: '5501', name: 'إهلاك المباني',          category: 'expenses', nature: 'debit', level: 3, parentId: 'a55', balance: 12_000,    currency: 'EGP', isActive: true, allowPosting: true },
  { id: 'a5502', code: '5502', name: 'إهلاك الآلات والمعدات',  category: 'expenses', nature: 'debit', level: 3, parentId: 'a55', balance: 14_000,    currency: 'EGP', isActive: true, allowPosting: true },
  { id: 'a5503', code: '5503', name: 'إهلاك السيارات',          category: 'expenses', nature: 'debit', level: 3, parentId: 'a55', balance: 9_100,     currency: 'EGP', isActive: true, allowPosting: true },

  // 56 — تكاليف مالية
  { id: 'a56',   code: '56',   name: 'التكاليف المالية',       category: 'other_expenses', nature: 'debit', level: 2, parentId: 'a5', balance: 0, currency: 'EGP', isActive: true, allowPosting: false },
  { id: 'a5601', code: '5601', name: 'فوائد قروض',             category: 'other_expenses', nature: 'debit', level: 3, parentId: 'a56', balance: 0, currency: 'EGP', isActive: true, allowPosting: true },
  { id: 'a5602', code: '5602', name: 'عمولات بنكية',           category: 'other_expenses', nature: 'debit', level: 3, parentId: 'a56', balance: 0, currency: 'EGP', isActive: true, allowPosting: true },
]

// ─────────────────────────────────────────────────────────────────────────────
// مراكز التكلفة
// ─────────────────────────────────────────────────────────────────────────────
export const COST_CENTERS: CostCenter[] = [
  { id: 'cc1', code: 'CC-01', name: 'قسم الإنتاج والتجميد',  description: 'حفظ وتجميد الأسماك ولحوم', isActive: true },
  { id: 'cc2', code: 'CC-02', name: 'قسم الإدارة العامة',    description: 'التكاليف الإدارية',    isActive: true },
  { id: 'cc3', code: 'CC-03', name: 'قسم المبيعات والتسويق', description: 'تكاليف البيع',         isActive: true },
  { id: 'cc4', code: 'CC-04', name: 'قسم الصيانة',           description: 'صيانة الأصول',         isActive: true },
]

// ─────────────────────────────────────────────────────────────────────────────
// العملات
// ─────────────────────────────────────────────────────────────────────────────
export const CURRENCIES: Currency[] = [
  { code: 'EGP', name: 'الجنيه المصري',  symbol: 'ج.م',  exchangeRate: 1,    isBase: true,  isActive: true },
  { code: 'USD', name: 'الدولار الأمريكي', symbol: '$',  exchangeRate: 48.5, isBase: false, isActive: true },
  { code: 'EUR', name: 'اليورو',           symbol: '€',  exchangeRate: 52.3, isBase: false, isActive: true },
  { code: 'SAR', name: 'الريال السعودي',   symbol: 'ر.س', exchangeRate: 12.9, isBase: false, isActive: true },
]

// ─────────────────────────────────────────────────────────────────────────────
// الأصول الثابتة
// ─────────────────────────────────────────────────────────────────────────────
export const ASSETS: Asset[] = [
  {
    id: 'ast1', code: 'AST-001', name: 'مبنى العنابر تبريد الرئيسي', type: 'building',
    purchaseDate: '2020-01-15', purchaseCost: 800_000, usefulLifeYears: 40,
    depreciationMethod: 'straight_line', residualValue: 100_000,
    accumulatedDepreciation: 87_500, bookValue: 712_500,
    accountId: 'a1101', depExpenseAccountId: 'a5501', accDepAccountId: 'a1106',
    isDisposed: false,
  },
  {
    id: 'ast2', code: 'AST-002', name: 'مبنى الإدارة', type: 'building',
    purchaseDate: '2021-06-01', purchaseCost: 400_000, usefulLifeYears: 40,
    depreciationMethod: 'straight_line', residualValue: 50_000,
    accumulatedDepreciation: 26_250, bookValue: 373_750,
    accountId: 'a1101', depExpenseAccountId: 'a5501', accDepAccountId: 'a1106',
    isDisposed: false,
  },
  {
    id: 'ast3', code: 'AST-003', name: 'ماكينة مواد تعبئة أوتوماتيك', type: 'equipment',
    purchaseDate: '2022-03-10', purchaseCost: 180_000, usefulLifeYears: 10,
    depreciationMethod: 'straight_line', residualValue: 20_000,
    accumulatedDepreciation: 48_000, bookValue: 132_000,
    accountId: 'a1103', depExpenseAccountId: 'a5502', accDepAccountId: 'a1106',
    isDisposed: false,
  },
  {
    id: 'ast4', code: 'AST-004', name: 'سيارة نقل — نيسان 2023', type: 'vehicle',
    purchaseDate: '2023-01-20', purchaseCost: 150_000, usefulLifeYears: 5,
    depreciationMethod: 'straight_line', residualValue: 30_000,
    accumulatedDepreciation: 18_600, bookValue: 131_400,
    accountId: 'a1104', depExpenseAccountId: 'a5503', accDepAccountId: 'a1106',
    isDisposed: false,
  },
  {
    id: 'ast5', code: 'AST-005', name: 'سيارة مدير السوق', type: 'vehicle',
    purchaseDate: '2022-09-01', purchaseCost: 100_000, usefulLifeYears: 5,
    depreciationMethod: 'straight_line', residualValue: 15_000,
    accumulatedDepreciation: 25_500, bookValue: 74_500,
    accountId: 'a1104', depExpenseAccountId: 'a5503', accDepAccountId: 'a1106',
    isDisposed: false,
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// البنوك
// ─────────────────────────────────────────────────────────────────────────────
export const BANK_ACCOUNTS: BankAccount[] = [
  { id: 'bk1', code: 'BNK-001', bankName: 'بنك مصر',       accountName: 'نجم كولد ستور — الحساب الجاري',  accountNumber: '1234567890123', currency: 'EGP', openingBalance: 500_000, currentBalance: 680_000, accountId: 'a1211', isActive: true },
  { id: 'bk2', code: 'BNK-002', bankName: 'البنك الأهلي',  accountName: 'نجم كولد ستور — توفير',           accountNumber: '0987654321098', currency: 'EGP', openingBalance: 250_000, currentBalance: 320_000, accountId: 'a1212', isActive: true },
  { id: 'bk3', code: 'BNK-003', bankName: 'CIB',           accountName: 'نجم كولد ستور — دولار',           accountNumber: '5566778899001', currency: 'USD', openingBalance: 5_000,   currentBalance: 5_979,   accountId: 'a1213', isActive: true },
]

// ─────────────────────────────────────────────────────────────────────────────
// الخزائن
// ─────────────────────────────────────────────────────────────────────────────
export const TREASURIES: Treasury[] = [
  { id: 'tr1', code: 'TRS-001', name: 'الصندوق الرئيسي',        currency: 'EGP', openingBalance: 100_000, currentBalance: 150_000, accountId: 'a1201', isActive: true, custodian: 'أحمد محمود' },
  { id: 'tr2', code: 'TRS-002', name: 'صندوق العمليات اليومية', currency: 'EGP', openingBalance: 20_000,  currentBalance: 30_000,  accountId: 'a1202', isActive: true, custodian: 'سامي خالد' },
]

// ─────────────────────────────────────────────────────────────────────────────
// القيود المحاسبية (دفتر اليومية)
// ─────────────────────────────────────────────────────────────────────────────
export const JOURNAL_ENTRIES: JournalEntry[] = [
  {
    id: 'je001', number: 'JE-2026-001', date: '2026-01-05',
    description: 'شراء مواد تغليف عوازل حرارية من مورد — الدلتا للمواد تغليف',
    type: 'purchase', status: 'posted',
    customerId: undefined, supplierId: 'sup1', purchaseOrderId: 'PO-2026-001',
    lines: [
      { id: 'l1', accountId: 'a1301', accountCode: '1301', accountName: 'مخزون المواد تغليف',      debit: 80_000, credit: 0, amount: 80_000, currency: 'EGP', exchangeRate: 1, costCenterId: 'cc1' },
      { id: 'l2', accountId: 'a2101', accountCode: '2101', accountName: 'حسابات الموردين',     debit: 0, credit: 80_000, amount: 80_000, currency: 'EGP', exchangeRate: 1 },
    ],
    totalDebit: 80_000, totalCredit: 80_000, isBalanced: true,
    createdBy: 'محاسب', createdAt: '2026-01-05T09:00:00', postedAt: '2026-01-05T10:00:00',
  },
  {
    id: 'je002', number: 'JE-2026-002', date: '2026-01-10',
    description: 'تحصيل مبيعات بضائع مخزنة — عميل ثلاجات النيل',
    type: 'collection', status: 'posted',
    customerId: 'cust1', supplierId: undefined, salesOrderId: 'SO-2026-001',
    lines: [
      { id: 'l3', accountId: 'a1211', accountCode: '1211', accountName: 'بنك مصر — الحساب الجاري', debit: 165_000, credit: 0, amount: 165_000, currency: 'EGP', exchangeRate: 1 },
      { id: 'l4', accountId: 'a1401', accountCode: '1401', accountName: 'حسابات العملاء',           debit: 0, credit: 165_000, amount: 165_000, currency: 'EGP', exchangeRate: 1 },
    ],
    totalDebit: 165_000, totalCredit: 165_000, isBalanced: true,
    createdBy: 'محاسب', createdAt: '2026-01-10T11:00:00', postedAt: '2026-01-10T11:30:00',
  },
  {
    id: 'je003', number: 'JE-2026-003', date: '2026-01-14',
    description: 'شراء أسماك ولحوم مجمدة — مورد خليل ترادينج',
    type: 'purchase', status: 'posted',
    supplierId: 'sup2', purchaseOrderId: 'PO-2026-002',
    lines: [
      { id: 'l5', accountId: 'a1303', accountCode: '1303', accountName: 'مخزون الأسماك ولحوم (للتجميد)', debit: 280_000, credit: 0, amount: 280_000, currency: 'EGP', exchangeRate: 1, costCenterId: 'cc1' },
      { id: 'l6', accountId: 'a2101', accountCode: '2101', accountName: 'حسابات الموردين',          debit: 0, credit: 280_000, amount: 280_000, currency: 'EGP', exchangeRate: 1 },
    ],
    totalDebit: 280_000, totalCredit: 280_000, isBalanced: true,
    createdBy: 'محاسب', createdAt: '2026-01-14T08:00:00', postedAt: '2026-01-14T09:00:00',
  },
  {
    id: 'je004', number: 'JE-2026-004', date: '2026-01-15',
    description: 'تحصيل فاتورة عميل — شركة النجوم للتجارة',
    type: 'collection', status: 'posted',
    customerId: 'cust2', salesOrderId: 'SO-2026-002',
    lines: [
      { id: 'l7', accountId: 'a1201', accountCode: '1201', accountName: 'نقدية بالصندوق الرئيسي', debit: 120_000, credit: 0, amount: 120_000, currency: 'EGP', exchangeRate: 1 },
      { id: 'l8', accountId: 'a1401', accountCode: '1401', accountName: 'حسابات العملاء',          debit: 0, credit: 120_000, amount: 120_000, currency: 'EGP', exchangeRate: 1 },
    ],
    totalDebit: 120_000, totalCredit: 120_000, isBalanced: true,
    createdBy: 'محاسب', createdAt: '2026-01-15T14:00:00', postedAt: '2026-01-15T14:30:00',
  },
  {
    id: 'je005', number: 'JE-2026-005', date: '2026-01-17',
    description: 'دفع مستحقات الموردين — الدلتا للمواد تغليف',
    type: 'payment', status: 'posted',
    supplierId: 'sup1',
    lines: [
      { id: 'l9',  accountId: 'a2101', accountCode: '2101', accountName: 'حسابات الموردين',   debit: 75_000, credit: 0, amount: 75_000, currency: 'EGP', exchangeRate: 1 },
      { id: 'l10', accountId: 'a1211', accountCode: '1211', accountName: 'بنك مصر — الجاري', debit: 0, credit: 75_000, amount: 75_000, currency: 'EGP', exchangeRate: 1 },
    ],
    totalDebit: 75_000, totalCredit: 75_000, isBalanced: true,
    createdBy: 'محاسب', createdAt: '2026-01-17T10:00:00', postedAt: '2026-01-17T10:30:00',
  },
  {
    id: 'je006', number: 'JE-2026-006', date: '2026-02-01',
    description: 'صرف رواتب وأجور العمالة — يناير 2026',
    type: 'salary', status: 'posted',
    lines: [
      { id: 'l11', accountId: 'a5201', accountCode: '5201', accountName: 'رواتب العمالة',   debit: 160_000, credit: 0, amount: 160_000, currency: 'EGP', exchangeRate: 1, costCenterId: 'cc2' },
      { id: 'l12', accountId: 'a5202', accountCode: '5202', accountName: 'مكافآت وحوافز',  debit: 20_000,  credit: 0, amount: 20_000,  currency: 'EGP', exchangeRate: 1, costCenterId: 'cc2' },
      { id: 'l13', accountId: 'a5203', accountCode: '5203', accountName: 'اشتراكات تأمينات',debit: 15_000,  credit: 0, amount: 15_000,  currency: 'EGP', exchangeRate: 1, costCenterId: 'cc2' },
      { id: 'l14', accountId: 'a1211', accountCode: '1211', accountName: 'بنك مصر — الجاري',debit: 0, credit: 195_000, amount: 195_000, currency: 'EGP', exchangeRate: 1 },
    ],
    totalDebit: 195_000, totalCredit: 195_000, isBalanced: true,
    createdBy: 'محاسب', createdAt: '2026-02-01T09:00:00', postedAt: '2026-02-01T09:30:00',
  },
  {
    id: 'je007', number: 'JE-2026-007', date: '2026-02-10',
    description: 'مصاريف كهرباء ومياه — يناير 2026',
    type: 'expense', status: 'posted',
    lines: [
      { id: 'l15', accountId: 'a5301', accountCode: '5301', accountName: 'مصاريف كهرباء ومياه', debit: 14_000, credit: 0, amount: 14_000, currency: 'EGP', exchangeRate: 1, costCenterId: 'cc1' },
      { id: 'l16', accountId: 'a1201', accountCode: '1201', accountName: 'نقدية بالصندوق',       debit: 0, credit: 14_000, amount: 14_000, currency: 'EGP', exchangeRate: 1 },
    ],
    totalDebit: 14_000, totalCredit: 14_000, isBalanced: true,
    createdBy: 'محاسب', createdAt: '2026-02-10T11:00:00', postedAt: '2026-02-10T11:30:00',
  },
  {
    id: 'je008', number: 'JE-2026-008', date: '2026-02-22',
    description: 'تحصيل مبيعات منتجات ثانوية',
    type: 'collection', status: 'posted',
    customerId: 'cust3',
    lines: [
      { id: 'l17', accountId: 'a1211', accountCode: '1211', accountName: 'بنك مصر — الجاري', debit: 38_500, credit: 0, amount: 38_500, currency: 'EGP', exchangeRate: 1 },
      { id: 'l18', accountId: 'a4104', accountCode: '4104', accountName: 'مبيعات منتجات ثانوية', debit: 0, credit: 38_500, amount: 38_500, currency: 'EGP', exchangeRate: 1 },
    ],
    totalDebit: 38_500, totalCredit: 38_500, isBalanced: true,
    createdBy: 'محاسب', createdAt: '2026-02-22T14:00:00', postedAt: '2026-02-22T14:30:00',
  },
  {
    id: 'je009', number: 'JE-2026-009', date: '2026-03-01',
    description: 'صرف رواتب وأجور العمالة — فبراير 2026',
    type: 'salary', status: 'posted',
    lines: [
      { id: 'l19', accountId: 'a5201', accountCode: '5201', accountName: 'رواتب العمالة',    debit: 120_000, credit: 0, amount: 120_000, currency: 'EGP', exchangeRate: 1, costCenterId: 'cc2' },
      { id: 'l20', accountId: 'a5202', accountCode: '5202', accountName: 'مكافآت وحوافز',   debit: 40_000,  credit: 0, amount: 40_000,  currency: 'EGP', exchangeRate: 1, costCenterId: 'cc2' },
      { id: 'l21', accountId: 'a5203', accountCode: '5203', accountName: 'اشتراكات تأمينات', debit: 15_000,  credit: 0, amount: 15_000,  currency: 'EGP', exchangeRate: 1, costCenterId: 'cc2' },
      { id: 'l22', accountId: 'a1211', accountCode: '1211', accountName: 'بنك مصر — الجاري', debit: 0, credit: 175_000, amount: 175_000, currency: 'EGP', exchangeRate: 1 },
    ],
    totalDebit: 175_000, totalCredit: 175_000, isBalanced: true,
    createdBy: 'محاسب', createdAt: '2026-03-01T09:00:00', postedAt: '2026-03-01T09:30:00',
  },
  {
    id: 'je010', number: 'JE-2026-010', date: '2026-03-10',
    description: 'تحصيل مبيعات بضائع مخزنة — عميل ثلاجات النيل',
    type: 'collection', status: 'posted',
    customerId: 'cust1', salesOrderId: 'SO-2026-003',
    lines: [
      { id: 'l23', accountId: 'a1211', accountCode: '1211', accountName: 'بنك مصر — الجاري', debit: 165_000, credit: 0, amount: 165_000, currency: 'EGP', exchangeRate: 1 },
      { id: 'l24', accountId: 'a1401', accountCode: '1401', accountName: 'حسابات العملاء',    debit: 0, credit: 165_000, amount: 165_000, currency: 'EGP', exchangeRate: 1 },
    ],
    totalDebit: 165_000, totalCredit: 165_000, isBalanced: true,
    createdBy: 'محاسب', createdAt: '2026-03-10T10:00:00', postedAt: '2026-03-10T10:30:00',
  },
  {
    id: 'je011', number: 'JE-2026-011', date: '2026-03-14',
    description: 'مصروف إهلاك الأصول الثابتة — الربع الأول 2026',
    type: 'depreciation', status: 'posted',
    lines: [
      { id: 'l25', accountId: 'a5501', accountCode: '5501', accountName: 'إهلاك المباني',         debit: 8_750,  credit: 0, amount: 8_750,  currency: 'EGP', exchangeRate: 1 },
      { id: 'l26', accountId: 'a5502', accountCode: '5502', accountName: 'إهلاك الآلات والمعدات', debit: 10_000, credit: 0, amount: 10_000, currency: 'EGP', exchangeRate: 1 },
      { id: 'l27', accountId: 'a5503', accountCode: '5503', accountName: 'إهلاك السيارات',         debit: 6_500,  credit: 0, amount: 6_500,  currency: 'EGP', exchangeRate: 1 },
      { id: 'l28', accountId: 'a1106', accountCode: '1106', accountName: 'مجمع الإهلاك',           debit: 0, credit: 25_250, amount: 25_250, currency: 'EGP', exchangeRate: 1 },
    ],
    totalDebit: 25_250, totalCredit: 25_250, isBalanced: true,
    createdBy: 'محاسب', createdAt: '2026-03-14T08:00:00', postedAt: '2026-03-14T08:30:00',
  },
  {
    id: 'je012', number: 'JE-2026-012', date: '2026-03-24',
    description: 'صرف رواتب وأجور العمالة — مارس 2026',
    type: 'salary', status: 'posted',
    lines: [
      { id: 'l29', accountId: 'a5201', accountCode: '5201', accountName: 'رواتب العمالة',    debit: 160_000, credit: 0, amount: 160_000, currency: 'EGP', exchangeRate: 1, costCenterId: 'cc2' },
      { id: 'l30', accountId: 'a1211', accountCode: '1211', accountName: 'بنك مصر — الجاري', debit: 0, credit: 160_000, amount: 160_000, currency: 'EGP', exchangeRate: 1 },
    ],
    totalDebit: 160_000, totalCredit: 160_000, isBalanced: true,
    createdBy: 'محاسب', createdAt: '2026-03-24T09:00:00', postedAt: '2026-03-24T09:30:00',
  },
  {
    id: 'je013', number: 'JE-2026-013', date: '2026-03-27',
    description: 'تحصيل مبيعات بضائع مخزنة — عميل الفرسان',
    type: 'collection', status: 'posted',
    customerId: 'cust4', salesOrderId: 'SO-2026-004',
    lines: [
      { id: 'l31', accountId: 'a1201', accountCode: '1201', accountName: 'نقدية بالصندوق',   debit: 120_000, credit: 0, amount: 120_000, currency: 'EGP', exchangeRate: 1 },
      { id: 'l32', accountId: 'a4101', accountCode: '4101', accountName: 'مبيعات بضائع مخزنة',      debit: 0, credit: 120_000, amount: 120_000, currency: 'EGP', exchangeRate: 1 },
    ],
    totalDebit: 120_000, totalCredit: 120_000, isBalanced: true,
    createdBy: 'محاسب', createdAt: '2026-03-27T12:00:00', postedAt: '2026-03-27T12:30:00',
  },
  {
    id: 'je014', number: 'JE-2026-014', date: '2026-03-30',
    description: 'مصاريف وقود ومحروقات — مارس 2026',
    type: 'expense', status: 'posted',
    lines: [
      { id: 'l33', accountId: 'a5302', accountCode: '5302', accountName: 'مصاريف وقود ومحروقات', debit: 18_500, credit: 0, amount: 18_500, currency: 'EGP', exchangeRate: 1, costCenterId: 'cc1' },
      { id: 'l34', accountId: 'a1201', accountCode: '1201', accountName: 'نقدية بالصندوق',        debit: 0, credit: 18_500, amount: 18_500, currency: 'EGP', exchangeRate: 1 },
    ],
    totalDebit: 18_500, totalCredit: 18_500, isBalanced: true,
    createdBy: 'محاسب', createdAt: '2026-03-30T10:00:00', postedAt: '2026-03-30T10:30:00',
  },
  {
    id: 'je015', number: 'JE-2026-015', date: '2026-03-31',
    description: 'قيد مصروف تشغيلي — مارس 2026',
    type: 'expense', status: 'posted',
    lines: [
      { id: 'l35', accountId: 'a5305', accountCode: '5305', accountName: 'مصاريف إدارية عمومية', debit: 14_000, credit: 0, amount: 14_000, currency: 'EGP', exchangeRate: 1, costCenterId: 'cc2' },
      { id: 'l36', accountId: 'a1212', accountCode: '1212', accountName: 'البنك الأهلي — توفير',  debit: 0, credit: 14_000, amount: 14_000, currency: 'EGP', exchangeRate: 1 },
    ],
    totalDebit: 14_000, totalCredit: 14_000, isBalanced: true,
    createdBy: 'محاسب', createdAt: '2026-03-31T15:00:00', postedAt: '2026-03-31T15:30:00',
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// ثوابت مفيدة
// ─────────────────────────────────────────────────────────────────────────────
export const BASE_CURRENCY = 'EGP'
export const DEFAULT_INVENTORY_METHOD: 'perpetual' | 'periodic' = 'perpetual'

export const MOCK_CUSTOMERS = [
  { id: 'cust1', name: 'ثلاجات النيل للاستثمار' },
  { id: 'cust2', name: 'شركة النجوم للتجارة' },
  { id: 'cust3', name: 'مصنع الأمل للمنتجات الغذائية' },
  { id: 'cust4', name: 'تجارة الفرسان' },
]

export const MOCK_SUPPLIERS = [
  { id: 'sup1', name: 'الدلتا للمواد تغليف والمخصبات' },
  { id: 'sup2', name: 'خليل ترادينج للأسماك ولحوم' },
  { id: 'sup3', name: 'شركة الأمل للمواد تغليف' },
]

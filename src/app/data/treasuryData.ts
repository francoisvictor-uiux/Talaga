import { TreasuryAccount, TreasuryTransaction } from '../types/treasury'

export const accounts: TreasuryAccount[] = [
  { id: 'acc-cash-1', name: 'صندوق الثلاجة الرئيسي', type: 'cash', balance: 62100, isActive: true },
  { id: 'acc-bank-1', name: 'بنك مصر - حساب جاري', type: 'bank', bankName: 'بنك مصر', accountNumber: '1234-5678-90', balance: 395000, isActive: true },
  { id: 'acc-bank-2', name: 'البنك الأهلي المصري', type: 'bank', bankName: 'البنك الأهلي المصري', accountNumber: '9876-5432-10', balance: 85000, isActive: true },
]

export const transactions: TreasuryTransaction[] = [
  { id: 'tx-1',  txNumber: 'TX-2026-001', date: '2026-03-01', type: 'deposit',    category: 'sales',      accountId: 'acc-bank-1', amount: 82500,  description: 'تحصيل فاتورة مبيعات بضائع مخزنة', reference: 'SO-2026-001' },
  { id: 'tx-2',  txNumber: 'TX-2026-002', date: '2026-03-01', type: 'withdrawal', category: 'purchasing', accountId: 'acc-bank-1', amount: 82500,  description: 'دفع فاتورة مشتريات مواد تغليف', reference: 'PO-2026-001', notes: 'تحويل بنكي كامل' },
  { id: 'tx-3',  txNumber: 'TX-2026-003', date: '2026-03-03', type: 'deposit',    category: 'sales',      accountId: 'acc-cash-1', amount: 45000,  description: 'تحصيل نقدي مبيعات بضائع مخزنة', reference: 'SO-2026-002' },
  { id: 'tx-4',  txNumber: 'TX-2026-004', date: '2026-03-05', type: 'withdrawal', category: 'purchasing', accountId: 'acc-cash-1', amount: 10000,  description: 'دفع جزئي غازات فريون تبريد', reference: 'PO-2026-002', notes: 'الدفعة الأولى' },
  { id: 'tx-5',  txNumber: 'TX-2026-005', date: '2026-03-08', type: 'transfer',   category: 'transfer',   accountId: 'acc-cash-1', targetAccountId: 'acc-bank-1', amount: 50000, description: 'تحويل من الصندوق لبنك مصر' },
  { id: 'tx-6',  txNumber: 'TX-2026-006', date: '2026-03-10', type: 'deposit',    category: 'sales',      accountId: 'acc-bank-1', amount: 165000, description: 'تحصيل مبيعات بضائع مخزنة', reference: 'SO-2026-003' },
  { id: 'tx-7',  txNumber: 'TX-2026-007', date: '2026-03-12', type: 'withdrawal', category: 'operating',  accountId: 'acc-cash-1', amount: 8500,   description: 'مصروفات كهرباء وماء مارس 2026' },
  { id: 'tx-8',  txNumber: 'TX-2026-008', date: '2026-03-14', type: 'withdrawal', category: 'purchasing', accountId: 'acc-bank-1', amount: 280000, description: 'دفع مشتريات أسماك ولحوم هولشتاين', reference: 'PO-2026-004', notes: 'تحويل بنكي فور الاستلام' },
  { id: 'tx-9',  txNumber: 'TX-2026-009', date: '2026-03-15', type: 'deposit',    category: 'sales',      accountId: 'acc-bank-1', amount: 120000, description: 'تحصيل فاتورة مبيعات بضائع مخزنة', reference: 'SO-2026-004' },
  { id: 'tx-10', txNumber: 'TX-2026-010', date: '2026-03-17', type: 'withdrawal', category: 'purchasing', accountId: 'acc-bank-1', amount: 75000,  description: 'دفع مشتريات عوازل حرارية (شيك)', reference: 'PO-2026-005', notes: 'شيك مؤجل 30 يوم' },
  { id: 'tx-11', txNumber: 'TX-2026-011', date: '2026-03-18', type: 'deposit',    category: 'sales',      accountId: 'acc-cash-1', amount: 25000,  description: 'تحصيل نقدي مبيعات منتجات' },
  { id: 'tx-12', txNumber: 'TX-2026-012', date: '2026-03-20', type: 'withdrawal', category: 'purchasing', accountId: 'acc-bank-1', amount: 30000,  description: 'دفعة مقدم مشتريات مواد تغليف', reference: 'PO-2026-007', notes: 'دفعة مقدم 30,000 ج.م' },
  { id: 'tx-13', txNumber: 'TX-2026-013', date: '2026-03-21', type: 'withdrawal', category: 'purchasing', accountId: 'acc-cash-1', amount: 8400,   description: 'دفع غازات فريون تبريد', reference: 'PO-2026-006', notes: 'نقدي' },
  { id: 'tx-14', txNumber: 'TX-2026-014', date: '2026-03-22', type: 'deposit',    category: 'sales',      accountId: 'acc-cash-1', amount: 38500,  description: 'تحصيل مبيعات منتجات ثانوية', reference: 'SO-2026-005' },
  { id: 'tx-15', txNumber: 'TX-2026-015', date: '2026-03-24', type: 'withdrawal', category: 'payroll',    accountId: 'acc-bank-1', amount: 185000, description: 'رواتب وأجور شهر مارس 2026', notes: 'تحويل رواتب الشهر' },
  { id: 'tx-16', txNumber: 'TX-2026-016', date: '2026-03-25', type: 'transfer',   category: 'transfer',   accountId: 'acc-bank-2', targetAccountId: 'acc-bank-1', amount: 100000, description: 'تحويل من الأهلي لبنك مصر', notes: 'لتغطية مدفوعات الرواتب' },
  { id: 'tx-17', txNumber: 'TX-2026-017', date: '2026-03-26', type: 'withdrawal', category: 'maintenance', accountId: 'acc-cash-1', amount: 15000,  description: 'صيانة معدات وأجهزة الثلاجة' },
  { id: 'tx-18', txNumber: 'TX-2026-018', date: '2026-03-27', type: 'deposit',    category: 'sales',      accountId: 'acc-bank-1', amount: 120000, description: 'تحصيل مبيعات بضائع مخزنة', reference: 'SO-2026-006' },
  { id: 'tx-19', txNumber: 'TX-2026-019', date: '2026-03-28', type: 'withdrawal', category: 'purchasing', accountId: 'acc-cash-1', amount: 15000,  description: 'دفع جزئي غازات فريون تبريد', reference: 'PO-2026-011', notes: 'الدفعة الأولى' },
  { id: 'tx-20', txNumber: 'TX-2026-020', date: '2026-03-29', type: 'deposit',    category: 'other',      accountId: 'acc-cash-1', amount: 22000,  description: 'إيرادات متنوعة' },
  { id: 'tx-21', txNumber: 'TX-2026-021', date: '2026-03-30', type: 'withdrawal', category: 'operating',  accountId: 'acc-cash-1', amount: 12000,  description: 'مصروفات تشغيلية متنوعة' },
]

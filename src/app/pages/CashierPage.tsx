import { useState, useMemo } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { toast } from 'sonner'
import {
  Search, Plus, X, Download, Landmark, Wallet2,
  ChevronRight, ChevronLeft, ChevronsRight, ChevronsLeft,
  Eye, ArrowDownCircle, ArrowUpCircle, ArrowLeftRight,
  FileText, AlertCircle, ChevronDown, CreditCard,
  Building2, Banknote, TrendingUp, TrendingDown,
} from 'lucide-react'
import {
  TreasuryAccount, TreasuryTransaction,
  TxType, TxCategory,
  ACCOUNT_TYPE_LABELS, TX_TYPE_LABELS, TX_CATEGORY_LABELS,
  DEPOSIT_CATEGORIES, WITHDRAWAL_CATEGORIES,
} from '../types/treasury'
import { accounts as initAccounts, transactions as initTransactions } from '../data/treasuryData'

// ─── helpers ──────────────────────────────────────────────────────────────────────────────
const fmtMoney = (n: number) => n.toLocaleString('ar-EG') + ' ج.م'
const fmtDate  = (d: string) =>
  new Date(d).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' })
const genId = (p = 'id') => `${p}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
const todayStr = () => new Date().toISOString().split('T')[0]

const PAGE_SIZE = 10

function usePagination<T>(items: T[], pageSize = PAGE_SIZE) {
  const [page, setPage] = useState(1)
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize))
  const safePage   = Math.min(page, totalPages)
  const slice      = items.slice((safePage - 1) * pageSize, safePage * pageSize)
  return { page: safePage, setPage, totalPages, slice, total: items.length }
}

// ─── type/category colours ────────────────────────────────────────────────────────────────────────────
const TX_TYPE_CFG: Record<TxType, { label: string; color: string; bg: string; dot: string; icon: React.ElementType }> = {
  deposit:    { label: 'إيداع',   color: 'text-green-700',  bg: 'bg-green-50',  dot: 'bg-green-500',  icon: ArrowDownCircle  },
  withdrawal: { label: 'سحب',    color: 'text-red-700',    bg: 'bg-red-50',    dot: 'bg-red-500',    icon: ArrowUpCircle    },
  transfer:   { label: 'تحويل',  color: 'text-blue-700',   bg: 'bg-blue-50',   dot: 'bg-blue-500',   icon: ArrowLeftRight   },
}

const CAT_COLOR: Partial<Record<TxCategory, string>> = {
  sales:       'bg-emerald-50 text-emerald-700',
  purchasing:  'bg-amber-50 text-amber-700',
  payroll:     'bg-violet-50 text-violet-700',
  operating:   'bg-sky-50 text-sky-700',
  maintenance: 'bg-orange-50 text-orange-700',
  transfer:    'bg-blue-50 text-blue-700',
  other:       'bg-neutral-100 text-neutral-500',
}

// ─── reusable atoms ─────────────────────────────────────────────────────────────────────────────
const inputCls  = 'w-full h-9 rounded-lg border border-neutral-200 bg-neutral-50 px-3 font-cairo text-[13px] text-neutral-800 focus:outline-none focus:ring-2 focus:accent-ring/30 focus:accent-border transition'
const selectCls = inputCls + ' appearance-none cursor-pointer'

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="font-cairo text-[12px] font-semibold text-neutral-600 block mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  )
}

function TypeBadge({ type }: { type: TxType }) {
  const cfg = TX_TYPE_CFG[type]
  const Icon = cfg.icon
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-cairo text-[11px] font-semibold ${cfg.bg} ${cfg.color}`}>
      <Icon size={11} />
      {cfg.label}
    </span>
  )
}

function Pagination({ page, totalPages, setPage, total, pageSize }: {
  page: number; totalPages: number; setPage: (p: number) => void; total: number; pageSize: number
}) {
  const start = (page - 1) * pageSize + 1
  const end   = Math.min(page * pageSize, total)
  if (total === 0) return null
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-100" dir="rtl">
      <span className="font-cairo text-[12px] text-neutral-400">
        عرض <span className="font-semibold text-neutral-600">{start}–{end}</span> من <span className="font-semibold text-neutral-600">{total}</span>
      </span>
      <div className="flex items-center gap-1">
        <button onClick={() => setPage(1)} disabled={page === 1} className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 disabled:opacity-30 disabled:pointer-events-none transition-colors"><ChevronsRight size={14} /></button>
        <button onClick={() => setPage(page - 1)} disabled={page === 1} className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 disabled:opacity-30 disabled:pointer-events-none transition-colors"><ChevronRight size={14} /></button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).filter(p => Math.abs(p - page) <= 2).map(p => (
          <button key={p} onClick={() => setPage(p)} className={`w-7 h-7 rounded-lg font-cairo text-[12px] font-semibold transition-colors ${p === page ? 'accent-bg text-white' : 'text-neutral-500 hover:bg-neutral-100'}`}>{p}</button>
        ))}
        <button onClick={() => setPage(page + 1)} disabled={page === totalPages} className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 disabled:opacity-30 disabled:pointer-events-none transition-colors"><ChevronLeft size={14} /></button>
        <button onClick={() => setPage(totalPages)} disabled={page === totalPages} className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 disabled:opacity-30 disabled:pointer-events-none transition-colors"><ChevronsLeft size={14} /></button>
      </div>
    </div>
  )
}

// ─── Account Card ──────────────────────────────────────────────────────────────────────────────
function AccountCard({ acc, txList, selected, onClick }: {
  acc: TreasuryAccount; txList: TreasuryTransaction[]
  selected: boolean; onClick: () => void
}) {
  const lastTx = txList.filter(t => t.accountId === acc.id || t.targetAccountId === acc.id)
    .sort((a, b) => b.date.localeCompare(a.date))[0]

  return (
    <button
      onClick={onClick}
      className={[
        'rounded-2xl border p-4 text-right shrink-0 w-[220px] transition-all duration-150 cursor-pointer',
        selected
          ? 'accent-bg accent-border shadow-md'
          : 'bg-white border-neutral-100 shadow-sm hover:accent-border/30 hover:shadow-md',
      ].join(' ')}
      dir="rtl"
    >
      <div className="flex items-center justify-between mb-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${selected ? 'bg-white/20' : acc.type === 'cash' ? 'bg-amber-50' : 'bg-blue-50'}`}>
          {acc.type === 'cash'
            ? <Banknote size={17} className={selected ? 'text-white' : 'text-amber-600'} />
            : <Building2 size={17} className={selected ? 'text-white' : 'text-blue-600'} />}
        </div>
        <span className={`font-cairo text-[10px] font-semibold px-2 py-0.5 rounded-full ${selected ? 'bg-white/20 text-white' : acc.type === 'cash' ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'}`}>
          {ACCOUNT_TYPE_LABELS[acc.type]}
        </span>
      </div>
      <p className={`font-cairo text-[12px] font-semibold mb-0.5 leading-tight ${selected ? 'text-white' : 'text-neutral-700'}`}>{acc.name}</p>
      {acc.accountNumber && <p className={`font-cairo text-[10px] mb-2 ${selected ? 'text-white/60' : 'text-neutral-400'}`}>{acc.accountNumber}</p>}
      <p className={`font-cairo font-bold text-[18px] leading-tight ${selected ? 'text-white' : 'text-neutral-900'}`}>{fmtMoney(acc.balance)}</p>
      {lastTx && (
        <p className={`font-cairo text-[10px] mt-1 ${selected ? 'text-white/60' : 'text-neutral-400'}`}>
          آخر حركة: {fmtDate(lastTx.date)}
        </p>
      )}
    </button>
  )
}

// ─── Add Deposit/Withdrawal Modal ──────────────────────────────────────────────────────────────────────────
interface TxForm {
  type: TxType
  accountId: string
  category: TxCategory
  amount: string
  date: string
  description: string
  reference: string
  notes: string
}

function AddTransactionModal({
  accounts, initType, initAccountId, onSave, onClose,
}: {
  accounts: TreasuryAccount[]
  initType: 'deposit' | 'withdrawal'
  initAccountId?: string
  onSave: (form: TxForm) => void
  onClose: () => void
}) {
  const [form, setForm] = useState<TxForm>({
    type: initType,
    accountId: initAccountId ?? accounts[0]?.id ?? '',
    category: initType === 'deposit' ? 'sales' : 'purchasing',
    amount: '',
    date: todayStr(),
    description: '',
    reference: '',
    notes: '',
  })
  const set = <K extends keyof TxForm>(k: K, v: TxForm[K]) => setForm(f => ({ ...f, [k]: v }))

  const cats = form.type === 'deposit' ? DEPOSIT_CATEGORIES : WITHDRAWAL_CATEGORIES
  const valid = !!form.accountId && parseFloat(form.amount) > 0 && form.description.trim() !== ''

  const isDeposit = form.type === 'deposit'
  const accent = isDeposit ? '#16a34a' : '#dc2626'
  const accentBg = isDeposit ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
  const iconBg   = isDeposit ? 'bg-green-50' : 'bg-red-50'
  const Icon     = isDeposit ? ArrowDownCircle : ArrowUpCircle

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-[460px] overflow-hidden">
        <div className={`h-1 w-full`} style={{ background: `linear-gradient(to left, ${accent}, ${accent}aa)` }} />
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center`}>
              <Icon size={15} style={{ color: accent }} />
            </div>
            <div>
              <h2 className="font-cairo font-bold text-[15px] text-neutral-800">
                {isDeposit ? 'إيداع جديد' : 'سحب جديد'}
              </h2>
              <p className="font-cairo text-[11px] text-neutral-400">تسجيل حركة {isDeposit ? 'إيداع' : 'سحب'} في الحساب</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-400"><X size={16} /></button>
        </div>
        <div className="px-5 py-4 space-y-3">
          <div className="flex items-center gap-2 p-1 bg-neutral-100 rounded-xl">
            {(['deposit', 'withdrawal'] as const).map(t => (
              <button key={t} onClick={() => setForm(f => ({ ...f, type: t, category: t === 'deposit' ? 'sales' : 'purchasing' }))}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg font-cairo text-[12px] font-semibold transition-all ${form.type === t ? 'bg-white shadow-sm text-neutral-800' : 'text-neutral-500 hover:text-neutral-700'}`}>
                {t === 'deposit' ? <ArrowDownCircle size={13} className="text-green-600" /> : <ArrowUpCircle size={13} className="text-red-500" />}
                {TX_TYPE_LABELS[t]}
              </button>
            ))}
          </div>
          <Field label="الحساب" required>
            <div className="relative">
              <select value={form.accountId} onChange={e => set('accountId', e.target.value)} className={selectCls}>
                {accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({fmtMoney(a.balance)})</option>)}
              </select>
              <ChevronDown size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
            </div>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="الفئة" required>
              <div className="relative">
                <select value={form.category} onChange={e => set('category', e.target.value as TxCategory)} className={selectCls}>
                  {cats.map(c => <option key={c} value={c}>{TX_CATEGORY_LABELS[c]}</option>)}
                </select>
                <ChevronDown size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
              </div>
            </Field>
            <Field label="التاريخ" required>
              <input type="date" value={form.date} onChange={e => set('date', e.target.value)} className={inputCls} />
            </Field>
          </div>
          <Field label="المبلغ (ج.م)" required>
            <input type="number" min="0.01" step="0.01" value={form.amount} onChange={e => set('amount', e.target.value)}
              placeholder="0.00" className={inputCls} autoFocus />
          </Field>
          <Field label="البيان" required>
            <input value={form.description} onChange={e => set('description', e.target.value)}
              placeholder="وصف الحركة..." className={inputCls} />
          </Field>
          <Field label="رقم المرجع">
            <input value={form.reference} onChange={e => set('reference', e.target.value)}
              placeholder="PO-/SO-/..." className={inputCls} />
          </Field>
          <Field label="ملاحظات">
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2}
              placeholder="أي ملاحظات إضافية..."
              className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 font-cairo text-[13px] placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:accent-ring/30 focus:accent-border transition resize-none" />
          </Field>
        </div>
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-neutral-100">
          <button onClick={onClose} className="px-4 py-2 rounded-lg font-cairo text-[13px] font-semibold text-neutral-600 hover:bg-neutral-100">إلغاء</button>
          <button onClick={() => valid && onSave(form)} disabled={!valid}
            className={`flex items-center gap-2 px-5 py-2 text-white rounded-lg font-cairo text-[13px] font-semibold ${accentBg} disabled:opacity-40 disabled:pointer-events-none`}>
            <Icon size={14} />
            تأكيد {isDeposit ? 'الإيداع' : 'السحب'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Transfer Modal ──────────────────────────────────────────────────────────────────────────────────
function TransferModal({
  accounts, onSave, onClose,
}: {
  accounts: TreasuryAccount[]
  onSave: (fromId: string, toId: string, amount: number, date: string, notes: string, desc: string) => void
  onClose: () => void
}) {
  const [fromId, setFromId] = useState(accounts[0]?.id ?? '')
  const [toId,   setToId]   = useState(accounts[1]?.id ?? '')
  const [amount, setAmount] = useState('')
  const [date,   setDate]   = useState(todayStr())
  const [desc,   setDesc]   = useState('')
  const [notes,  setNotes]  = useState('')

  const fromAcc = accounts.find(a => a.id === fromId)
  const amt     = parseFloat(amount)
  const valid   = fromId !== toId && amt > 0 && (fromAcc ? amt <= fromAcc.balance : false) && desc.trim() !== ''

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-[440px] overflow-hidden">
        <div className="h-1 w-full bg-gradient-to-l from-blue-600 to-blue-400" />
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <ArrowLeftRight size={15} className="text-blue-600" />
            </div>
            <div>
              <h2 className="font-cairo font-bold text-[15px] text-neutral-800">تحويل بين الحسابات</h2>
              <p className="font-cairo text-[11px] text-neutral-400">تحويل داخلي بين حسابات الثلاجة</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-400"><X size={16} /></button>
        </div>
        <div className="px-5 py-4 space-y-3">
          <Field label="من حساب" required>
            <div className="relative">
              <select value={fromId} onChange={e => setFromId(e.target.value)} className={selectCls}>
                {accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({fmtMoney(a.balance)})</option>)}
              </select>
              <ChevronDown size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
            </div>
          </Field>
          <div className="flex items-center justify-center">
            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
              <ChevronDown size={16} className="text-blue-600" />
            </div>
          </div>
          <Field label="إلى حساب" required>
            <div className="relative">
              <select value={toId} onChange={e => setToId(e.target.value)} className={selectCls}>
                {accounts.filter(a => a.id !== fromId).map(a => <option key={a.id} value={a.id}>{a.name} ({fmtMoney(a.balance)})</option>)}
              </select>
              <ChevronDown size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
            </div>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="المبلغ (ج.م)" required>
              <input type="number" min="0.01" value={amount} onChange={e => setAmount(e.target.value)}
                placeholder="0.00" className={inputCls} autoFocus />
            </Field>
            <Field label="التاريخ" required>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className={inputCls} />
            </Field>
          </div>
          {fromAcc && parseFloat(amount) > fromAcc.balance && (
            <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-100 px-3 py-2">
              <AlertCircle size={13} className="text-red-500 shrink-0" />
              <p className="font-cairo text-[12px] text-red-700">المبلغ يتجاوز رصيد الحساب ({fmtMoney(fromAcc.balance)})</p>
            </div>
          )}
          <Field label="البيان" required>
            <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="سبب التحويل..." className={inputCls} />
          </Field>
          <Field label="ملاحظات">
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="ملاحظات إضافية..."
              className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 font-cairo text-[13px] placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400 transition resize-none" />
          </Field>
        </div>
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-neutral-100">
          <button onClick={onClose} className="px-4 py-2 rounded-lg font-cairo text-[13px] font-semibold text-neutral-600 hover:bg-neutral-100">إلغاء</button>
          <button onClick={() => valid && onSave(fromId, toId, amt, date, notes, desc)} disabled={!valid}
            className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-cairo text-[13px] font-semibold disabled:opacity-40 disabled:pointer-events-none">
            <ArrowLeftRight size={14} /> تأكيد التحويل
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── View Transaction Modal ────────────────────────────────────────────────────────────────────────────
function ViewTransactionModal({
  tx, accounts, onClose,
}: {
  tx: TreasuryTransaction; accounts: TreasuryAccount[]; onClose: () => void
}) {
  const acc       = accounts.find(a => a.id === tx.accountId)
  const targetAcc = tx.targetAccountId ? accounts.find(a => a.id === tx.targetAccountId) : null
  const cfg       = TX_TYPE_CFG[tx.type]
  const Icon      = cfg.icon

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-[440px] overflow-hidden">
        <div className={`h-1 w-full ${cfg.bg} opacity-80`} style={{ background: tx.type === 'deposit' ? 'linear-gradient(to left,#16a34a,#4ade80)' : tx.type === 'withdrawal' ? 'linear-gradient(to left,#dc2626,#f87171)' : 'linear-gradient(to left,#2563eb,#60a5fa)' }} />
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg ${cfg.bg} flex items-center justify-center`}>
              <Icon size={15} className={cfg.color} />
            </div>
            <div>
              <h2 className="font-cairo font-bold text-[15px] text-neutral-800">{tx.txNumber}</h2>
              <p className="font-cairo text-[11px] text-neutral-400">{fmtDate(tx.date)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <TypeBadge type={tx.type} />
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-400"><X size={16} /></button>
          </div>
        </div>
        <div className="px-5 py-4 space-y-4">
          <div className={`rounded-xl ${cfg.bg} px-4 py-3 flex items-center justify-between`}>
            <span className={`font-cairo text-[13px] font-semibold ${cfg.color}`}>المبلغ</span>
            <span className={`font-cairo font-bold text-[22px] ${cfg.color}`}>{fmtMoney(tx.amount)}</span>
          </div>
          <div className="space-y-2">
            {[
              { label: 'البيان',      value: tx.description },
              { label: 'الحساب',      value: acc?.name ?? tx.accountId },
              ...(targetAcc ? [{ label: 'إلى حساب', value: targetAcc.name }] : []),
              { label: 'الفئة',       value: TX_CATEGORY_LABELS[tx.category] },
              ...(tx.reference ? [{ label: 'المرجع',  value: tx.reference }] : []),
            ].map(row => (
              <div key={row.label} className="flex items-center justify-between border-b border-neutral-100 pb-2">
                <span className="font-cairo text-[12px] text-neutral-400">{row.label}</span>
                <span className="font-cairo font-semibold text-[12px] text-neutral-700">{row.value}</span>
              </div>
            ))}
          </div>
          {tx.notes && (
            <div className="rounded-xl bg-yellow-50 border border-yellow-100 p-3 flex gap-2">
              <AlertCircle size={14} className="text-yellow-600 shrink-0 mt-0.5" />
              <p className="font-cairo text-[12px] text-yellow-800">{tx.notes}</p>
            </div>
          )}
        </div>
        <div className="flex justify-end px-5 py-4 border-t border-neutral-100">
          <button onClick={onClose} className="px-5 py-2 rounded-lg font-cairo text-[13px] font-semibold text-neutral-600 hover:bg-neutral-100">إغلاق</button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────────────────────
const ALL_TYPES: (TxType | 'all')[] = ['all', 'deposit', 'withdrawal', 'transfer']
const TYPE_FILTER_LABELS: Record<string, string> = { all: 'الكل', deposit: 'إيداع', withdrawal: 'سحب', transfer: 'تحويل' }

export default function CashierPage() {
  const [accs, setAccs]   = useLocalStorage<TreasuryAccount[]>('vetafarm_treasury_accounts', initAccounts)
  const [txs,  setTxs]    = useLocalStorage<TreasuryTransaction[]>('vetafarm_treasury_txs', initTransactions)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<TxType | 'all'>('all')
  const [filterAcc,  setFilterAcc]  = useState<string>('all')
  const [selectedAccId, setSelectedAccId] = useState<string | null>(null)

  const [showDeposit,  setShowDeposit]  = useState(false)
  const [showWithdraw, setShowWithdraw] = useState(false)
  const [showTransfer, setShowTransfer] = useState(false)
  const [viewTx, setViewTx] = useState<TreasuryTransaction | null>(null)

  const stats = useMemo(() => {
    const totalCash  = accs.filter(a => a.type === 'cash').reduce((s, a) => s + a.balance, 0)
    const totalBank  = accs.filter(a => a.type === 'bank').reduce((s, a) => s + a.balance, 0)
    const totalBal   = totalCash + totalBank
    const today = todayStr()
    const todayCount = txs.filter(t => t.date === today).length
    return { totalCash, totalBank, totalBal, todayCount }
  }, [accs, txs])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return txs.filter(t => {
      const matchQ  = !q || t.description.toLowerCase().includes(q) || t.txNumber.toLowerCase().includes(q) || (t.reference ?? '').toLowerCase().includes(q)
      const matchTp = filterType === 'all' || t.type === filterType
      const matchAc = filterAcc === 'all' || t.accountId === filterAcc || t.targetAccountId === filterAcc
      const matchSel = !selectedAccId || t.accountId === selectedAccId || t.targetAccountId === selectedAccId
      return matchQ && matchTp && matchAc && matchSel
    }).sort((a, b) => b.date.localeCompare(a.date) || b.txNumber.localeCompare(a.txNumber))
  }, [txs, search, filterType, filterAcc, selectedAccId])

  const { page, setPage, totalPages, slice, total } = usePagination(filtered)

  function handleAddTx(form: TxForm) {
    const amt = parseFloat(form.amount)
    const newTx: TreasuryTransaction = {
      id: genId('tx'), txNumber: `TX-2026-${String(txs.length + 1).padStart(3, '0')}`,
      date: form.date, type: form.type, category: form.category,
      accountId: form.accountId, amount: amt,
      description: form.description,
      reference: form.reference || undefined,
      notes: form.notes || undefined,
    }
    setTxs(prev => [newTx, ...prev])
    setAccs(prev => prev.map(a => {
      if (a.id !== form.accountId) return a
      return { ...a, balance: form.type === 'deposit' ? a.balance + amt : a.balance - amt }
    }))
    setShowDeposit(false); setShowWithdraw(false)
    toast.success(`تم تسجيل ${TX_TYPE_LABELS[form.type]}`, { description: `${fmtMoney(amt)} · ${form.description}` })
  }

  function handleTransfer(fromId: string, toId: string, amount: number, date: string, notes: string, desc: string) {
    const num = String(txs.length + 1).padStart(3, '0')
    const newTx: TreasuryTransaction = {
      id: genId('tx'), txNumber: `TX-2026-${num}`,
      date, type: 'transfer', category: 'transfer',
      accountId: fromId, targetAccountId: toId,
      amount, description: desc,
      notes: notes || undefined,
    }
    setTxs(prev => [newTx, ...prev])
    setAccs(prev => prev.map(a => {
      if (a.id === fromId) return { ...a, balance: a.balance - amount }
      if (a.id === toId)   return { ...a, balance: a.balance + amount }
      return a
    }))
    setShowTransfer(false)
    const fromName = accs.find(a => a.id === fromId)?.name ?? ''
    const toName   = accs.find(a => a.id === toId)?.name ?? ''
    toast.success('تم التحويل بنجاح', { description: `${fmtMoney(amount)} من ${fromName} إلى ${toName}` })
  }

  const accMap: Record<string, string> = Object.fromEntries(accs.map(a => [a.id, a.name]))

  return (
    <div className="min-h-full bg-neutral-50 p-6 font-cairo" dir="rtl">
      <div className="max-w-[1280px] mx-auto space-y-5">

        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-cairo font-bold text-[22px] text-neutral-800">الخزينة والبنوك</h1>
            <p className="font-cairo text-[13px] text-neutral-400 mt-0.5">إدارة الحسابات النقدية والبنكية وتتبع الحركات</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-4 py-2.5 border border-neutral-200 bg-white text-neutral-600 rounded-xl font-cairo text-[13px] font-semibold hover:bg-neutral-50">
              <Download size={15} /> تصدير
            </button>
            <button onClick={() => setShowTransfer(true)} className="flex items-center gap-2 px-4 py-2.5 border border-blue-200 bg-blue-50 text-blue-700 rounded-xl font-cairo text-[13px] font-semibold hover:bg-blue-100">
              <ArrowLeftRight size={15} /> تحويل
            </button>
            <button onClick={() => setShowWithdraw(true)} className="flex items-center gap-2 px-4 py-2.5 border border-red-200 bg-red-50 text-red-700 rounded-xl font-cairo text-[13px] font-semibold hover:bg-red-100">
              <ArrowUpCircle size={15} /> سحب
            </button>
            <button onClick={() => setShowDeposit(true)} className="flex items-center gap-2 px-4 py-2.5 accent-bg text-white rounded-xl font-cairo text-[13px] font-semibold hover:opacity-90 shadow-sm">
              <ArrowDownCircle size={16} /> إيداع
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: Banknote,     label: 'إجمالي النقدية',  value: fmtMoney(stats.totalCash),  color: 'bg-amber-50 text-amber-600',   text: 'text-amber-700' },
            { icon: Building2,    label: 'إجمالي البنوك',   value: fmtMoney(stats.totalBank),  color: 'bg-blue-50 text-blue-600',     text: 'text-blue-700'  },
            { icon: Wallet2,      label: 'الرصيد الكلي',    value: fmtMoney(stats.totalBal),   color: 'bg-[#e8f5ee] accent-text', text: 'accent-text' },
            { icon: CreditCard,   label: 'حركات اليوم',     value: String(stats.todayCount),   color: 'bg-violet-50 text-violet-600', text: 'text-violet-700'},
          ].map(({ icon: Icon, label, value, color, text }) => (
            <div key={label} className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color.split(' ')[0]}`}>
                <Icon size={18} className={color.split(' ')[1]} />
              </div>
              <div>
                <p className="font-cairo text-[11px] text-neutral-400">{label}</p>
                <p className={`font-cairo font-bold text-[18px] ${text} leading-tight`}>{value}</p>
              </div>
            </div>
          ))}
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-cairo font-bold text-[14px] text-neutral-700">الحسابات</h2>
            {selectedAccId && (
              <button onClick={() => setSelectedAccId(null)} className="flex items-center gap-1 font-cairo text-[12px] accent-text hover:underline">
                <X size={12} /> عرض كل الحسابات
              </button>
            )}
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {accs.map(acc => (
              <AccountCard
                key={acc.id} acc={acc} txList={txs}
                selected={selectedAccId === acc.id}
                onClick={() => setSelectedAccId(prev => prev === acc.id ? null : acc.id)}
              />
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
          <div className="flex flex-wrap items-center gap-3 px-5 py-3.5 border-b border-neutral-100">
            <div className="flex items-center gap-1.5 shrink-0">
              <FileText size={14} className="text-neutral-400" />
              <span className="font-cairo font-bold text-[14px] text-neutral-700">سجل الحركات</span>
            </div>
            <div className="relative flex-1 min-w-[200px]">
              <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
                placeholder="بحث بالبيان أو رقم الحركة أو المرجع..."
                className="w-full h-9 rounded-lg border border-neutral-200 bg-neutral-50 pr-9 pl-3 font-cairo text-[13px] placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:accent-ring/30 focus:accent-border transition" />
              {search && <button onClick={() => setSearch('')} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"><X size={13} /></button>}
            </div>
            <div className="relative">
              <select value={filterAcc} onChange={e => { setFilterAcc(e.target.value); setPage(1) }}
                className="h-9 rounded-lg border border-neutral-200 bg-neutral-50 pr-3 pl-8 font-cairo text-[12px] font-semibold text-neutral-600 appearance-none cursor-pointer focus:outline-none focus:accent-border transition">
                <option value="all">كل الحسابات</option>
                {accs.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
              <ChevronDown size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
            </div>
            <div className="flex items-center gap-1 bg-neutral-100 rounded-xl p-1">
              {ALL_TYPES.map(tp => (
                <button key={tp} onClick={() => { setFilterType(tp); setPage(1) }}
                  className={`px-3 py-1.5 rounded-lg font-cairo text-[12px] font-semibold transition-all ${filterType === tp ? 'bg-white text-neutral-800 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}>
                  {TYPE_FILTER_LABELS[tp]}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-100">
                  {['رقم الحركة', 'التاريخ', 'النوع', 'الحساب', 'البيان', 'الفئة', 'المبلغ', 'مرجع', 'عمليات'].map(h => (
                    <th key={h} className="px-4 py-3 font-cairo text-[11px] font-semibold text-neutral-500 text-right whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {slice.length === 0 ? (
                  <tr><td colSpan={9} className="px-4 py-12 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-neutral-100 flex items-center justify-center mx-auto mb-3"><Landmark size={20} className="text-neutral-400" /></div>
                    <p className="font-cairo text-[13px] text-neutral-400">لا توجد حركات مالية مطابقة</p>
                  </td></tr>
                ) : slice.map((tx, i) => {
                  const isDeposit    = tx.type === 'deposit'
                  const isWithdrawal = tx.type === 'withdrawal'
                  return (
                    <tr key={tx.id} className={`border-b border-neutral-50 hover:bg-neutral-50/70 transition-colors ${i % 2 === 0 ? '' : 'bg-neutral-50/30'}`}>
                      <td className="px-4 py-3">
                        <span className="font-cairo font-semibold text-[11px] accent-text">{tx.txNumber}</span>
                      </td>
                      <td className="px-4 py-3 font-cairo text-[12px] text-neutral-600 whitespace-nowrap">{fmtDate(tx.date)}</td>
                      <td className="px-4 py-3"><TypeBadge type={tx.type} /></td>
                      <td className="px-4 py-3">
                        <p className="font-cairo text-[12px] font-semibold text-neutral-700 whitespace-nowrap">{accMap[tx.accountId] ?? tx.accountId}</p>
                        {tx.targetAccountId && (
                          <p className="font-cairo text-[10px] text-neutral-400 mt-0.5 flex items-center gap-1">
                            <ChevronDown size={9} /> {accMap[tx.targetAccountId]}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 max-w-[180px]">
                        <p className="font-cairo text-[12px] text-neutral-700 truncate">{tx.description}</p>
                        {tx.notes && <p className="font-cairo text-[10px] text-neutral-400 truncate mt-0.5">{tx.notes}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full font-cairo text-[10px] font-semibold ${CAT_COLOR[tx.category] ?? 'bg-neutral-100 text-neutral-500'}`}>
                          {TX_CATEGORY_LABELS[tx.category]}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`font-cairo font-bold text-[13px] ${isDeposit ? 'text-green-600' : isWithdrawal ? 'text-red-600' : 'text-blue-600'}`}>
                          {isDeposit ? '+' : isWithdrawal ? '−' : '⇄'} {fmtMoney(tx.amount)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {tx.reference
                          ? <span className="font-cairo text-[11px] accent-text font-semibold">{tx.reference}</span>
                          : <span className="text-neutral-300">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => setViewTx(tx)} title="عرض التفاصيل"
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-neutral-400 hover:accent-text hover:bg-[#e8f5ee] transition-colors">
                          <Eye size={14} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} setPage={setPage} total={total} pageSize={PAGE_SIZE} />
        </div>
      </div>

      {showDeposit  && <AddTransactionModal accounts={accs} initType="deposit"    initAccountId={selectedAccId ?? undefined} onSave={handleAddTx} onClose={() => setShowDeposit(false)} />}
      {showWithdraw && <AddTransactionModal accounts={accs} initType="withdrawal" initAccountId={selectedAccId ?? undefined} onSave={handleAddTx} onClose={() => setShowWithdraw(false)} />}
      {showTransfer && <TransferModal accounts={accs} onSave={handleTransfer} onClose={() => setShowTransfer(false)} />}
      {viewTx       && <ViewTransactionModal tx={viewTx} accounts={accs} onClose={() => setViewTx(null)} />}
    </div>
  )
}

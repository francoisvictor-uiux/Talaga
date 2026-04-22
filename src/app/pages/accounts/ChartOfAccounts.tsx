import { useState, useMemo, useEffect } from 'react'
import {
  ChevronDown, ChevronLeft, Search, Plus, X,
  TrendingUp, TrendingDown, Layers, Filter,
} from 'lucide-react'
import type { Account, AccountCategory } from '../../types/accounts'
import { ACCOUNT_CATEGORY_LABELS, ACCOUNT_CATEGORY_GROUPS } from '../../types/accounts'
import { useAccounts } from './AccountsContext'

const fmtMoney = (n: number) =>
  (n < 0 ? '(' : '') + Math.abs(n).toLocaleString('ar-EG') + ' ج.م' + (n < 0 ? ')' : '')

// ─── Category badge ───────────────────────────────────────────────────────────
function CategoryBadge({ category }: { category: AccountCategory }) {
  const group = ACCOUNT_CATEGORY_GROUPS.find(g => g.categories.includes(category))
  if (!group) return null
  return (
    <span className={`text-[10px] font-cairo font-semibold px-2 py-0.5 rounded-full border ${group.bg} ${group.text} ${group.border}`}>
      {ACCOUNT_CATEGORY_LABELS[category]}
    </span>
  )
}

// ─── Add Account Modal ────────────────────────────────────────────────────────
function AddAccountModal({ parentAccount, onClose, onSave }: {
  parentAccount: Account | null
  onClose: () => void
  onSave: (acc: Partial<Account>) => void
}) {
  const [form, setForm] = useState({
    code: parentAccount ? parentAccount.code + '0' : '',
    name: '',
    category: parentAccount?.category ?? 'current_assets' as AccountCategory,
    notes: '',
  })

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-neutral-900/40 backdrop-blur-sm" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-fade-in" dir="rtl">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-cairo font-bold text-[16px] text-neutral-900">إضافة حساب جديد</h3>
            {parentAccount && <p className="font-cairo text-[12px] text-neutral-400 mt-0.5">تحت: {parentAccount.code} — {parentAccount.name}</p>}
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-neutral-100 text-neutral-400"><X size={15} /></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="font-cairo font-semibold text-[11px] text-neutral-500 uppercase tracking-wider mb-1.5 block">رقم الحساب</label>
            <input value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value }))}
              className="w-full h-10 px-3 border border-neutral-200 rounded-[8px] font-cairo text-[13px] outline-none focus:accent-border focus:ring-2 focus:accent-ring/20"
              placeholder="مثال: 1107" />
          </div>
          <div>
            <label className="font-cairo font-semibold text-[11px] text-neutral-500 uppercase tracking-wider mb-1.5 block">اسم الحساب *</label>
            <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              className="w-full h-10 px-3 border border-neutral-200 rounded-[8px] font-cairo text-[13px] outline-none focus:accent-border focus:ring-2 focus:accent-ring/20"
              placeholder="اسم الحساب" />
          </div>
          <div>
            <label className="font-cairo font-semibold text-[11px] text-neutral-500 uppercase tracking-wider mb-1.5 block">النوع</label>
            <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value as AccountCategory }))}
              className="w-full h-10 px-3 border border-neutral-200 rounded-[8px] font-cairo text-[13px] outline-none focus:accent-border">
              {Object.entries(ACCOUNT_CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className="font-cairo font-semibold text-[11px] text-neutral-500 uppercase tracking-wider mb-1.5 block">ملاحظات</label>
            <input value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
              className="w-full h-10 px-3 border border-neutral-200 rounded-[8px] font-cairo text-[13px] outline-none focus:accent-border"
              placeholder="اختياري" />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2.5 border border-neutral-200 text-neutral-600 rounded-[10px] font-cairo font-semibold text-[13px] hover:bg-neutral-50">إلغاء</button>
          <button onClick={() => { if (form.name) { onSave({ ...form, parentId: parentAccount?.id ?? null, level: ((parentAccount?.level ?? 0) + 1) as 1|2|3, balance: 0, nature: 'debit', isActive: true, allowPosting: true, currency: 'EGP' }); onClose() } }}
            className="flex-1 py-2.5 accent-bg text-white rounded-[10px] font-cairo font-semibold text-[13px] hover:bg-[#155832]">
            إضافة الحساب
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Account Row ──────────────────────────────────────────────────────────────
interface AccountRowProps {
  account: Account
  children: Account[]
  depth: number
  allAccounts: Account[]
  onAddChild: (acc: Account) => void
  collapseCounter: number
  expandCounter: number
}

function AccountRow({ account, children, depth, allAccounts, onAddChild, collapseCounter, expandCounter }: AccountRowProps) {
  const [open, setOpen] = useState(false)
  const hasChildren = children.length > 0
  const indentPx = depth * 24

  useEffect(() => {
    if (collapseCounter > 0) setOpen(false)
  }, [collapseCounter])

  useEffect(() => {
    if (expandCounter > 0) setOpen(true)
  }, [expandCounter])

  const bgClass = 'bg-white border-b border-neutral-100'

  const isPositive = account.balance >= 0

  return (
    <>
      <div
        className={`flex items-center gap-2 px-4 py-3 hover:bg-neutral-50 cursor-pointer transition-colors group ${bgClass}`}
        style={{ paddingRight: `${16 + indentPx}px` }}
        onClick={() => hasChildren && setOpen(o => !o)}
      >
        {/* Expand toggle */}
        <div className="w-5 h-5 flex items-center justify-center shrink-0">
          {hasChildren
            ? open
              ? <ChevronDown size={13} className="text-neutral-400" />
              : <ChevronLeft size={13} className="text-neutral-400" />
            : <div className="w-1.5 h-1.5 rounded-full bg-neutral-200" />}
        </div>

        {/* Account code */}
        <span className={`font-mono text-[11px] font-bold shrink-0 w-[52px] ${depth === 0 ? 'text-neutral-700' : 'text-neutral-400'}`}>
          {account.code}
        </span>

        {/* Name */}
        <span className={`font-cairo flex-1 min-w-0 truncate ${depth === 0 ? 'font-bold text-[14px] text-neutral-800' : depth === 1 ? 'font-semibold text-[13px] text-neutral-700' : 'font-medium text-[12px] text-neutral-600'}`}>
          {account.name}
        </span>

        {/* Category badge */}
        <div className="w-24 shrink-0 flex items-center hidden md:flex">
          {depth === 2 && <CategoryBadge category={account.category} />}
        </div>

        {/* Balance */}
        <div className="w-32 flex items-center justify-start shrink-0">
          {depth === 2 && (
            isPositive
              ? <TrendingUp size={11} className="text-green-500 ml-1.5" />
              : <TrendingDown size={11} className="text-red-500 ml-1.5" />
          )}
          <span className={`font-cairo font-bold text-[12px] ${depth === 0 ? 'text-[14px] text-neutral-800' : isPositive ? 'text-neutral-700' : 'text-red-600'}`}>
            {fmtMoney(account.balance)}
          </span>
        </div>

        {/* Nature */}
        <div className="w-14 shrink-0 flex justify-start">
          <span className={`text-[10px] font-cairo font-semibold px-2 py-0.5 rounded-full ${account.nature === 'debit' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
            {account.nature === 'debit' ? 'مدين' : 'دائن'}
          </span>
        </div>

        {/* Add child button */}
        <div className="w-6 shrink-0 flex justify-end">
          {account.level < 3 && (
            <button
              onClick={e => { e.stopPropagation(); onAddChild(account) }}
              className="w-6 h-6 flex items-center justify-center rounded-md opacity-0 group-hover:opacity-100 hover:accent-bg/10 accent-text transition-all"
              title="إضافة حساب فرعي"
            >
              <Plus size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Children */}
      {hasChildren && open && children.map(child => (
        <AccountRow
          key={child.id}
          account={child}
          children={allAccounts.filter(a => a.parentId === child.id)}
          depth={depth + 1}
          allAccounts={allAccounts}
          onAddChild={onAddChild}
          collapseCounter={collapseCounter}
          expandCounter={expandCounter}
        />
      ))}
    </>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ChartOfAccounts() {
  const { accounts, setAccounts } = useAccounts()
  const [search, setSearch] = useState('')
  const [filterGroup, setFilterGroup] = useState<string>('all')
  const [addParent, setAddParent] = useState<Account | null | 'root'>()
  const [showAddModal, setShowAddModal] = useState(false)
  const [collapseCounter, setCollapseCounter] = useState(0)
  const [expandCounter, setExpandCounter] = useState(0)

  const filtered = useMemo(() => {
    if (!search && filterGroup === 'all') return accounts
    return accounts.filter(a => {
      const matchSearch = !search || a.name.includes(search) || a.code.includes(search)
      const matchGroup = filterGroup === 'all' || ACCOUNT_CATEGORY_GROUPS.find(g => g.label === filterGroup)?.categories.includes(a.category)
      return matchSearch && matchGroup
    })
  }, [accounts, search, filterGroup])

  const topLevel = useMemo(() => filtered.filter(a => a.parentId === null), [filtered])

  // KPIs
  const totalAssets  = accounts.filter(a => a.level === 1 && a.code === '1').reduce((s, a) => s + a.balance, 0)
  const totalLiab    = accounts.filter(a => a.level === 1 && a.code === '2').reduce((s, a) => s + a.balance, 0)
  const totalEquity  = accounts.filter(a => a.level === 1 && a.code === '3').reduce((s, a) => s + a.balance, 0)
  const totalRev     = accounts.filter(a => a.level === 1 && a.code === '4').reduce((s, a) => s + a.balance, 0)
  const totalExp     = accounts.filter(a => a.level === 1 && a.code === '5').reduce((s, a) => s + a.balance, 0)

  function handleSave(acc: Partial<Account>) {
    const newAcc: Account = {
      id: `a${Date.now()}`,
      code: acc.code ?? '',
      name: acc.name ?? '',
      category: acc.category ?? 'current_assets',
      nature: acc.nature ?? 'debit',
      level: acc.level ?? 3,
      parentId: acc.parentId ?? null,
      balance: 0,
      currency: 'EGP',
      isActive: true,
      allowPosting: true,
    }
    setAccounts(p => [...p, newAcc])
    setShowAddModal(false)
    setAddParent(undefined)
  }

  return (
    <div className="space-y-5" dir="rtl">

      {/* Accounting Equation Banner */}
      <div className={`p-4 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border ${Math.abs(totalAssets - totalLiab - totalEquity) < 1 ? 'bg-[#f0fdf4] border-[#bbf7d0]' : 'bg-red-50 border-red-200'}`}>
        <div>
          <h2 className="font-cairo font-bold text-[16px] text-neutral-800">معادلة الميزانية ومطابقة الحسابات</h2>
          <p className="font-cairo text-[13px] text-neutral-600 mt-0.5">الأصول = الالتزامات + حقوق الملكية</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex gap-2 font-cairo font-bold text-[18px] text-neutral-900" dir="ltr">
            <span>{fmtMoney(totalAssets)}</span>
            <span className="text-neutral-400">=</span>
            <span>{fmtMoney(totalLiab + totalEquity)}</span>
          </div>
          <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-cairo font-bold text-[13px] ${Math.abs(totalAssets - totalLiab - totalEquity) < 1 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {Math.abs(totalAssets - totalLiab - totalEquity) < 1 ? '✓ متوازن' : '✗ غير متوازن'}
          </span>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'إجمالي الأصول',    value: totalAssets,  color: 'text-blue-700',   bg: 'bg-blue-50',   border: 'border-blue-200' },
          { label: 'إجمالي الالتزامات', value: totalLiab,   color: 'text-red-700',    bg: 'bg-red-50',    border: 'border-red-200' },
          { label: 'حقوق الملكية',     value: totalEquity,  color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200' },
          { label: 'إجمالي الإيرادات', value: totalRev,     color: 'text-green-700',  bg: 'bg-green-50',  border: 'border-green-200' },
          { label: 'إجمالي المصاريف',  value: totalExp,     color: 'text-amber-700',  bg: 'bg-amber-50',  border: 'border-amber-200' },
        ].map(kpi => (
          <div key={kpi.label} className={`${kpi.bg} border ${kpi.border} rounded-xl p-3.5`}>
            <p className="font-cairo text-[11px] text-neutral-500 mb-1">{kpi.label}</p>
            <p className={`font-cairo font-bold text-[15px] ${kpi.color}`}>{fmtMoney(kpi.value)}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-4 flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2 h-9 px-3 rounded-[8px] bg-neutral-50 border border-neutral-200 flex-1 min-w-[180px]">
          <Search size={13} className="text-neutral-400 shrink-0" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث في الحسابات…"
            className="flex-1 bg-transparent outline-none font-cairo text-[13px] placeholder:text-neutral-400" />
          {search && <button onClick={() => setSearch('')}><X size={12} className="text-neutral-400" /></button>}
        </div>

        <div className="flex items-center gap-1.5 h-9 px-3 rounded-[8px] bg-neutral-50 border border-neutral-200">
          <Filter size={12} className="text-neutral-400" />
          <select value={filterGroup} onChange={e => setFilterGroup(e.target.value)}
            className="bg-transparent outline-none font-cairo text-[13px] text-neutral-700">
            <option value="all">كل المجموعات</option>
            {ACCOUNT_CATEGORY_GROUPS.map(g => <option key={g.label} value={g.label}>{g.label}</option>)}
          </select>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setCollapseCounter(c => c + 1)}
            className="flex items-center gap-1 h-9 px-3 border border-neutral-200 text-neutral-600 rounded-[8px] font-cairo font-semibold text-[13px] hover:bg-neutral-50"
          >
            طي الكل
          </button>
          <button
            onClick={() => setExpandCounter(c => c + 1)}
            className="flex items-center gap-1 h-9 px-3 border border-neutral-200 text-neutral-600 rounded-[8px] font-cairo font-semibold text-[13px] hover:bg-neutral-50"
          >
            بسط الكل
          </button>
        </div>

        <button
          onClick={() => { setAddParent(null); setShowAddModal(true) }}
          className="flex items-center gap-2 h-9 px-4 accent-bg text-white rounded-[8px] font-cairo font-semibold text-[13px] hover:bg-[#155832] transition-colors"
        >
          <Plus size={14} /> إضافة حساب
        </button>
      </div>

      {/* Table Header */}
      <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2.5 bg-neutral-50 border-b border-neutral-200" style={{ paddingRight: '16px' }}>
          <div className="w-5 shrink-0" />
          <span className="font-cairo font-semibold text-[10.5px] text-neutral-400 uppercase tracking-wider shrink-0 w-[52px]">الكود</span>
          <span className="font-cairo font-semibold text-[10.5px] text-neutral-400 uppercase tracking-wider flex-1">اسم الحساب</span>
          <span className="font-cairo font-semibold text-[10.5px] text-neutral-400 uppercase tracking-wider shrink-0 w-24 hidden md:block">النوع</span>
          <span className="font-cairo font-semibold text-[10.5px] text-neutral-400 uppercase tracking-wider shrink-0 w-32">الرصيد</span>
          <span className="font-cairo font-semibold text-[10.5px] text-neutral-400 uppercase tracking-wider shrink-0 w-14">الطبيعة</span>
          <div className="w-6 shrink-0" />
        </div>

        <div>
          {topLevel.length === 0
            ? (
              <div className="flex flex-col items-center py-16 gap-3">
                <Layers size={32} className="text-neutral-200" />
                <p className="font-cairo text-[13px] text-neutral-400">لا توجد نتائج</p>
              </div>
            )
            : topLevel.map(acc => (
              <AccountRow
                key={acc.id}
                account={acc}
                children={filtered.filter(a => a.parentId === acc.id)}
                depth={0}
                allAccounts={filtered}
                onAddChild={parent => { setAddParent(parent); setShowAddModal(true) }}
                collapseCounter={collapseCounter}
                expandCounter={expandCounter}
              />
            ))
          }
        </div>

        {/* Footer summary */}
        <div className="bg-neutral-50 border-t border-neutral-200 px-4 py-3 flex items-center justify-between">
          <span className="font-cairo text-[12px] text-neutral-500">{accounts.length} حساب في الدليل</span>
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <AddAccountModal
          parentAccount={addParent && addParent !== 'root' ? addParent : null}
          onClose={() => { setShowAddModal(false); setAddParent(undefined) }}
          onSave={handleSave}
        />
      )}
    </div>
  )
}

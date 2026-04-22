import { useState, useMemo } from 'react'
import {
  X, ArrowDownToLine, ArrowUpFromLine, Activity, Calculator, UserMinus, Plus, Trash2,
} from 'lucide-react'
import { BASE_CURRENCY } from '../../data/accountsData'
import type { JournalEntryType, JournalLine, JournalEntry } from '../../types/accounts'
import { useAccounts } from './AccountsContext'

interface Props {
  onClose: () => void
  onSave: (entry: Partial<JournalEntry>) => void
}

type TabType = 'collection' | 'payment' | 'expense' | 'salary' | 'general'

const TABS: { id: TabType; label: string; icon: any; color: string }[] = [
  { id: 'collection', label: 'سند قبض',   icon: ArrowDownToLine, color: 'text-green-600' },
  { id: 'payment',    label: 'سند صرف',   icon: ArrowUpFromLine, color: 'text-red-600' },
  { id: 'expense',    label: 'فاتورة مصروف', icon: Calculator,      color: 'text-amber-600' },
  { id: 'salary',     label: 'رواتب وسلف',   icon: UserMinus,       color: 'text-violet-600' },
  { id: 'general',    label: 'قيد يومية', icon: Activity,        color: 'text-blue-600' },
]

export default function QuickEntryModal({ onClose, onSave }: Props) {
  const { accounts, costCenters, currencies } = useAccounts()

  const [tab, setTab] = useState<TabType>('collection')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [desc, setDesc] = useState('')
  const [referenceId, setReferenceId] = useState('') // New!
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState(BASE_CURRENCY)

  // Smart dropdowns
  const [cashAccountId, setCashAccountId] = useState('') // Treasury or Bank
  const [partyId, setPartyId] = useState('')             // Customer or Supplier Account
  const [expenseAccountId, setExpenseAccountId] = useState('') // Expense account
  const [costCenterId, setCostCenterId] = useState('')

  // General Entry Lines
  const [lines, setLines] = useState<(Partial<JournalLine> & { id: string })[]>([
    { id: 'l1', debit: 0, credit: 0, currency: BASE_CURRENCY, exchangeRate: 1 },
    { id: 'l2', debit: 0, credit: 0, currency: BASE_CURRENCY, exchangeRate: 1 },
  ])

  // Lookups
  const cashAccounts = useMemo(() => accounts.filter(a => ['banks', 'treasuries'].includes(a.category) && a.allowPosting), [accounts])
  const custAccounts = useMemo(() => accounts.filter(a => a.category === 'receivables' && a.allowPosting), [accounts])
  const suppAccounts = useMemo(() => accounts.filter(a => a.category === 'payables' && a.allowPosting), [accounts])
  const expAccounts  = useMemo(() => accounts.filter(a => a.category === 'expenses' && a.allowPosting), [accounts])

  const addLine = () => setLines(p => [...p, { id: Date.now().toString(), debit: 0, credit: 0, currency: BASE_CURRENCY, exchangeRate: 1 }])
  const removeLine = (id: string) => setLines(p => p.filter(l => l.id !== id))
  const updateLine = (id: string, f: keyof JournalLine, v: any) => setLines(p => p.map(l => l.id === id ? { ...l, [f]: v } : l))

  const totalDebit  = lines.reduce((s, l) => s + (Number(l.debit) || 0), 0)
  const totalCredit = lines.reduce((s, l) => s + (Number(l.credit) || 0), 0)
  const isBalanced  = totalDebit > 0 && totalDebit === totalCredit

  const saveForm = () => {
    const numAmt = Number(amount)
    let finalLines: Partial<JournalLine>[] = []
    let tType: JournalEntryType = 'general'
    let finalDesc = desc

    if (referenceId.trim()) {
      finalDesc += ` (مرجع: ${referenceId})`
    }

    if (tab === 'collection') {
      if (!cashAccountId || !partyId || !numAmt) return alert('يرجى إكمال البيانات')
      tType = 'collection'
      const cashAcc = cashAccounts.find(a => a.id === cashAccountId)
      const custAcc = custAccounts.find(a => a.id === partyId)
      finalLines = [
        { accountId: cashAcc?.id, accountCode: cashAcc?.code, accountName: cashAcc?.name, debit: numAmt, credit: 0, amount: numAmt, currency },
        { accountId: custAcc?.id, accountCode: custAcc?.code, accountName: custAcc?.name, debit: 0, credit: numAmt, amount: numAmt, currency },
      ]
    } else if (tab === 'payment') {
      if (!cashAccountId || !partyId || !numAmt) return alert('يرجى إكمال البيانات')
      tType = 'payment'
      const cashAcc = cashAccounts.find(a => a.id === cashAccountId)
      const suppAcc = suppAccounts.find(a => a.id === partyId)
      finalLines = [
        { accountId: suppAcc?.id, accountCode: suppAcc?.code, accountName: suppAcc?.name, debit: numAmt, credit: 0, amount: numAmt, currency },
        { accountId: cashAcc?.id, accountCode: cashAcc?.code, accountName: cashAcc?.name, debit: 0, credit: numAmt, amount: numAmt, currency },
      ]
    } else if (tab === 'expense' || tab === 'salary') {
      if (!cashAccountId || !expenseAccountId || !numAmt) return alert('يرجى إكمال البيانات')
      tType = tab === 'salary' ? 'salary' : 'expense'
      const cashAcc = cashAccounts.find(a => a.id === cashAccountId)
      const expAcc  = accounts.find(a => a.id === expenseAccountId)
      finalLines = [
        { accountId: expAcc?.id, accountCode: expAcc?.code, accountName: expAcc?.name, debit: numAmt, credit: 0, amount: numAmt, currency, costCenterId },
        { accountId: cashAcc?.id, accountCode: cashAcc?.code, accountName: cashAcc?.name, debit: 0, credit: numAmt, amount: numAmt, currency },
      ]
    } else {
      if (!isBalanced) return alert('القيد غير متوازن')
      tType = 'general'
      finalLines = lines.map(l => {
        const acc = accounts.find(a => a.id === l.accountId)
        return {
          accountId: acc?.id, accountCode: acc?.code, accountName: acc?.name,
          debit: Number(l.debit) || 0, credit: Number(l.credit) || 0,
          amount: Math.max(Number(l.debit) || 0, Number(l.credit) || 0),
          currency: l.currency, costCenterId: l.costCenterId, notes: l.notes, exchangeRate: 1
        }
      }).filter(l => l.accountId && (l.debit! > 0 || l.credit! > 0))
    }

    onSave({
      date,
      description: finalDesc,
      type: tType,
      status: 'posted',
      lines: finalLines as JournalLine[],
      totalDebit: tab === 'general' ? totalDebit : numAmt,
      totalCredit: tab === 'general' ? totalCredit : numAmt,
      isBalanced: true,
      createdBy: 'مدير النظام',
    })
  }

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-neutral-900/50 backdrop-blur-sm shadow-2xl" dir="rtl">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-fade-in">
        
        {/* Header Tabs */}
        <div className="bg-neutral-50 px-2 pt-2 border-b border-neutral-200 flex justify-between items-end">
          <div className="flex gap-1 overflow-x-auto">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`py-2.5 px-4 rounded-t-xl font-cairo font-semibold text-[13px] flex items-center gap-2 transition-colors ${tab === t.id ? 'bg-white text-neutral-900 shadow-[0_-2px_6px_rgba(0,0,0,0.05)] border-t border-x border-neutral-200 translate-y-px' : 'text-neutral-500 hover:text-neutral-700'}`}>
                <t.icon size={16} className={tab === t.id ? t.color : 'text-neutral-400'} />
                {t.label}
              </button>
            ))}
          </div>
          <button onClick={onClose} className="mb-2 p-1.5 rounded-lg text-neutral-400 hover:bg-neutral-200 hover:text-neutral-600">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="font-cairo text-[11px] font-semibold text-neutral-500 mb-1.5 block">التاريخ</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full h-10 px-3 border border-neutral-200 rounded-[8px] font-cairo text-[13px] outline-none focus:accent-border" />
            </div>
            <div>
              <label className="font-cairo text-[11px] font-semibold text-neutral-500 mb-1.5 block">البيان / الوصف</label>
              <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="مثال: فاتورة مبيعات، سداد..." className="w-full h-10 px-3 border border-neutral-200 rounded-[8px] font-cairo text-[13px] outline-none focus:accent-border" />
            </div>
            {tab !== 'general' && (
              <div>
                <label className="font-cairo text-[11px] font-semibold text-neutral-500 mb-1.5 block">أمر مرجعي / رقم الفاتورة</label>
                <input value={referenceId} onChange={e => setReferenceId(e.target.value)} placeholder="اختياري (SO-101)" className="w-full h-10 px-3 border border-neutral-200 rounded-[8px] font-cairo text-[13px] outline-none focus:accent-border" dir="ltr" />
              </div>
            )}
          </div>

          {tab !== 'general' && (
            <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 grid grid-cols-2 gap-4 mt-2">
              <div>
                <label className="font-cairo text-[11px] font-semibold text-neutral-500 mb-1.5 block">المبلغ</label>
                <div className="flex bg-white border border-neutral-200 rounded-lg overflow-hidden focus-within:accent-border">
                  <input type="number" min="0" value={amount} onChange={e => setAmount(e.target.value)} className="flex-1 h-10 px-3 font-cairo text-[14px] text-left outline-none" placeholder="0.00" dir="ltr" />
                  <select value={currency} onChange={e => setCurrency(e.target.value)} className="w-16 h-10 bg-neutral-100 border-l border-neutral-200 font-cairo text-[12px] outline-none px-1 text-center font-bold">
                    {currencies.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-cairo text-[11px] font-semibold text-neutral-500 mb-1.5 block">طريقة الدفع (الخزينة/البنك)</label>
                <select value={cashAccountId} onChange={e => setCashAccountId(e.target.value)} className="w-full h-10 px-3 border border-neutral-200 rounded-[8px] font-cairo text-[13px] bg-white outline-none focus:accent-border">
                  <option value="">-- اختر النقدية --</option>
                  {cashAccounts.map(a => <option key={a.id} value={a.id}>{a.code} — {a.name}</option>)}
                </select>
              </div>

              {tab === 'collection' && (
                <div>
                  <label className="font-cairo text-[11px] font-semibold text-neutral-500 mb-1.5 block">من حساب (العميل)</label>
                  <select value={partyId} onChange={e => setPartyId(e.target.value)} className="w-full h-10 px-3 border border-neutral-200 rounded-[8px] font-cairo text-[13px] bg-white outline-none focus:accent-border">
                    <option value="">-- اختر حساب العميل --</option>
                    {custAccounts.map(a => <option key={a.id} value={a.id}>{a.code} — {a.name}</option>)}
                  </select>
                </div>
              )}

              {tab === 'payment' && (
                <div>
                  <label className="font-cairo text-[11px] font-semibold text-neutral-500 mb-1.5 block">إلى حساب (المورد)</label>
                  <select value={partyId} onChange={e => setPartyId(e.target.value)} className="w-full h-10 px-3 border border-neutral-200 rounded-[8px] font-cairo text-[13px] bg-white outline-none focus:accent-border">
                    <option value="">-- اختر حساب المورد --</option>
                    {suppAccounts.map(a => <option key={a.id} value={a.id}>{a.code} — {a.name}</option>)}
                  </select>
                </div>
              )}

              {tab === 'expense' && (
                <>
                  <div>
                    <label className="font-cairo text-[11px] font-semibold text-neutral-500 mb-1.5 block">بند المصروف</label>
                    <select value={expenseAccountId} onChange={e => setExpenseAccountId(e.target.value)} className="w-full h-10 px-3 border border-neutral-200 rounded-[8px] font-cairo text-[13px] bg-white outline-none focus:accent-border">
                      <option value="">-- اختر المصروف --</option>
                      {expAccounts.map(a => <option key={a.id} value={a.id}>{a.code} — {a.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="font-cairo text-[11px] font-semibold text-neutral-500 mb-1.5 block">مركز تكلفة (اختياري)</label>
                    <select value={costCenterId} onChange={e => setCostCenterId(e.target.value)} className="w-full h-10 px-3 border border-neutral-200 rounded-[8px] font-cairo text-[13px] bg-white outline-none focus:accent-border">
                      <option value="">-- بلا مركز تكلفة --</option>
                      {costCenters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                </>
              )}

              {tab === 'salary' && (
                <>
                  <div>
                    <label className="font-cairo text-[11px] font-semibold text-neutral-500 mb-1.5 block">بند الراتب / السلفة (مدين)</label>
                    <select value={expenseAccountId} onChange={e => setExpenseAccountId(e.target.value)} className="w-full h-10 px-3 border border-neutral-200 rounded-[8px] font-cairo text-[13px] bg-white outline-none focus:accent-border">
                      <option value="">-- اختر الحساب (مصروف رواتب / سلف عمّال) --</option>
                      {accounts.filter(a => ['expenses', 'receivables'].includes(a.category) && a.allowPosting).map(a => <option key={a.id} value={a.id}>{a.code} — {a.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="font-cairo text-[11px] font-semibold text-neutral-500 mb-1.5 block">مركز تكلفة (اختياري)</label>
                    <select value={costCenterId} onChange={e => setCostCenterId(e.target.value)} className="w-full h-10 px-3 border border-neutral-200 rounded-[8px] font-cairo text-[13px] bg-white outline-none focus:accent-border">
                      <option value="">-- بلا --</option>
                      {costCenters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                </>
              )}
            </div>
          )}

          {/* General Journal Lines UI */}
          {tab === 'general' && (
            <div className="border border-neutral-200 rounded-xl overflow-hidden mt-2">
              <table className="w-full">
                <thead className="bg-neutral-50 border-b border-neutral-200">
                  <tr>
                    <th className="px-3 py-2.5 text-right font-cairo text-[11px] text-neutral-500">الحساب</th>
                    <th className="px-3 py-2.5 text-right font-cairo text-[11px] text-neutral-500">مدين</th>
                    <th className="px-3 py-2.5 text-right font-cairo text-[11px] text-neutral-500">دائن</th>
                    <th className="px-3 py-2.5 text-right font-cairo text-[11px] text-neutral-500">مركز تكلفة</th>
                    <th className="px-3 py-2.5 text-right font-cairo text-[11px] text-neutral-500">ملاحظات سطر</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {lines.map((l, i) => (
                    <tr key={l.id}>
                      <td className="p-2">
                        <select value={l.accountId ?? ''} onChange={e => updateLine(l.id, 'accountId', e.target.value)} className="w-full h-9 px-2 border border-neutral-200 rounded-[6px] font-cairo text-[12px] outline-none focus:accent-border">
                          <option value="">- الحساب -</option>
                          {accounts.filter(a => a.allowPosting).map(a => <option key={a.id} value={a.id}>{a.code} — {a.name}</option>)}
                        </select>
                      </td>
                      <td className="p-2"><input type="number" min="0" value={l.debit || ''} onChange={e => updateLine(l.id, 'debit', e.target.value)} className="w-[100px] h-9 px-2 border border-neutral-200 rounded-[6px] font-cairo font-bold text-[13px] text-red-600 text-left outline-none focus:accent-border" dir="ltr" /></td>
                      <td className="p-2"><input type="number" min="0" value={l.credit || ''} onChange={e => updateLine(l.id, 'credit', e.target.value)} className="w-[100px] h-9 px-2 border border-neutral-200 rounded-[6px] font-cairo font-bold text-[13px] text-green-600 text-left outline-none focus:accent-border" dir="ltr" /></td>
                      <td className="p-2">
                         <select value={l.costCenterId ?? ''} onChange={e => updateLine(l.id, 'costCenterId', e.target.value)} className="w-full h-9 px-2 border border-neutral-200 rounded-[6px] font-cairo text-[11px] outline-none focus:accent-border">
                           <option value="">- بلا -</option>
                           {costCenters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                         </select>
                      </td>
                      <td className="p-2"><input value={l.notes || ''} onChange={e => updateLine(l.id, 'notes', e.target.value)} className="w-full h-9 px-2 border border-neutral-200 rounded-[6px] font-cairo text-[12px] outline-none focus:accent-border" placeholder="البيان..." /></td>
                      <td className="p-2 text-center">
                        <button onClick={() => removeLine(l.id)} className="p-1.5 text-neutral-400 hover:text-red-500 rounded-md hover:bg-red-50"><Trash2 size={14} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="bg-neutral-50 p-3 border-t border-neutral-200 flex justify-between items-center">
                <button onClick={addLine} className="flex items-center gap-1.5 accent-text font-cairo font-semibold text-[12px] hover:underline">
                  <Plus size={14} /> إضافة سطر
                </button>
                <div className="flex gap-6 font-cairo font-bold text-[13px]">
                  <div className="flex gap-2 text-red-600"><span>إجمالي مدين:</span><span>{totalDebit.toLocaleString()} ج.م</span></div>
                  <div className="flex gap-2 text-green-600"><span>إجمالي دائن:</span><span>{totalCredit.toLocaleString()} ج.م</span></div>
                  <div className={`flex gap-2 px-3 py-0.5 rounded-full ${isBalanced ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    <span>الفرق:</span><span>{Math.abs(totalDebit - totalCredit).toLocaleString()} ج.م</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-200 flex gap-3">
          <button onClick={onClose} className="px-5 py-2.5 border border-neutral-200 text-neutral-600 rounded-lg font-cairo font-bold text-[13px] hover:bg-neutral-50 transition-colors">إلغاء</button>
          <button onClick={saveForm} disabled={tab === 'general' && !isBalanced}
            className="flex-1 py-2.5 accent-bg text-white rounded-lg font-cairo font-bold text-[13px] hover:bg-[#155832] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2">
            حفظ القيد {tab === 'general' ? '(عام)' : ''}
          </button>
        </div>
      </div>
    </div>
  )
}

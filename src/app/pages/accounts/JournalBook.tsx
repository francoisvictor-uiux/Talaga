import { useState, useMemo } from 'react'
import {
  Search, Plus, Filter, Download, BookOpen, Clock, CheckCircle2, ChevronDown
} from 'lucide-react'
import type { JournalEntry, JournalEntryType } from '../../types/accounts'
import { JOURNAL_TYPE_LABELS, JOURNAL_STATUS_LABELS } from '../../types/accounts'
import QuickEntryModal from './QuickEntryModal'
import { useAccounts } from './AccountsContext'

const fmtMoney = (n: number) => n.toLocaleString('ar-EG') + ' ج.م'
const fmtDate  = (d: string)  => new Date(d).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric', year: 'numeric' })

function EntryExpanded({ entry }: { entry: JournalEntry }) {
  return (
    <div className="bg-neutral-50/50 px-6 py-4 border-b border-neutral-100">
      <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full">
          <thead className="bg-neutral-50 border-b border-neutral-200">
            <tr>
              <th className="px-4 py-2.5 text-right font-cairo text-[11px] text-neutral-500 font-semibold w-24">رقم الحساب</th>
              <th className="px-4 py-2.5 text-right font-cairo text-[11px] text-neutral-500 font-semibold">اسم الحساب</th>
              <th className="px-4 py-2.5 text-right font-cairo text-[11px] text-neutral-500 font-semibold w-32">مدين</th>
              <th className="px-4 py-2.5 text-right font-cairo text-[11px] text-neutral-500 font-semibold w-32">دائن</th>
              <th className="px-4 py-2.5 text-right font-cairo text-[11px] text-neutral-500 font-semibold w-48">البيان</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {entry.lines.map(line => (
              <tr key={line.id} className="hover:bg-neutral-50/50 transition-colors">
                <td className="px-4 py-2 font-mono text-[11.5px] text-neutral-600">{line.accountCode}</td>
                <td className="px-4 py-2 font-cairo text-[12.5px] font-semibold text-neutral-800">{line.accountName}</td>
                <td className="px-4 py-2 font-cairo font-bold text-[13px] text-red-600">{line.debit > 0 ? fmtMoney(line.debit) : '-'}</td>
                <td className="px-4 py-2 font-cairo font-bold text-[13px] text-green-600">{line.credit > 0 ? fmtMoney(line.credit) : '-'}</td>
                <td className="px-4 py-2 font-cairo text-[12px] text-neutral-500">{line.notes || entry.description}</td>
              </tr>
            ))}
            <tr className="bg-neutral-50/50 border-t border-neutral-200">
              <td colSpan={2} className="px-4 py-3 font-cairo font-bold text-[13px] text-neutral-700 text-left">الإجمالي:</td>
              <td className="px-4 py-3 font-cairo font-bold text-[13px] text-neutral-900 border-x border-neutral-200">{fmtMoney(entry.totalDebit)}</td>
              <td className="px-4 py-3 font-cairo font-bold text-[13px] text-neutral-900">{fmtMoney(entry.totalCredit)}</td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="mt-3 flex gap-6 text-[11.5px] font-cairo text-neutral-500">
        <span><strong className="text-neutral-700">بواسطة:</strong> {entry.createdBy}</span>
        <span><strong className="text-neutral-700">تاريخ الإنشاء:</strong> {fmtDate(entry.createdAt)}</span>
        {entry.costCenterId && <span><strong className="text-neutral-700">مركز التكلفة:</strong> {entry.costCenterId}</span>}
      </div>
    </div>
  )
}

export default function JournalBook() {
  const { entries, postJournalEntry } = useAccounts()
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<JournalEntryType | 'all'>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showQuickEntry, setShowQuickEntry] = useState(false)

  const filtered = useMemo(() => {
    return entries.filter(e => {
      const matchSearch = !search || e.number.includes(search) || e.description.includes(search)
      const matchType   = filterType === 'all' || e.type === filterType
      return matchSearch && matchType
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [entries, search, filterType])

  return (
    <div className="space-y-5" dir="rtl">
      
      {/* KPI & Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="flex items-center gap-4">
          <div className="bg-white border border-neutral-200 shadow-sm rounded-xl px-5 py-3 flex gap-4 min-w-[280px]">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <BookOpen size={20} />
            </div>
            <div>
              <p className="font-cairo text-[12px] text-neutral-500">إجمالي القيود</p>
              <div className="flex items-baseline gap-2">
                <span className="font-cairo font-bold text-[22px] text-neutral-800">{entries.length}</span>
                <span className="font-cairo text-[11px] text-neutral-400">قيد</span>
              </div>
            </div>
          </div>
        </div>

        <button onClick={() => setShowQuickEntry(true)} className="flex items-center gap-2 px-5 py-3 accent-bg text-white rounded-xl font-cairo font-bold text-[13px] hover:bg-[#155832] transition-colors shadow-sm">
          <Plus size={16} /> إضافة قيد / سند
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-4 flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2 h-10 px-3 rounded-lg bg-neutral-50 border border-neutral-200 flex-1 min-w-[220px]">
          <Search size={14} className="text-neutral-400 shrink-0" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث برقم القيد أو البيان..."
            className="flex-1 bg-transparent outline-none font-cairo text-[13px] placeholder:text-neutral-400" />
        </div>

        <div className="flex items-center gap-2 h-10 px-3 rounded-lg bg-neutral-50 border border-neutral-200">
          <Filter size={14} className="text-neutral-400" />
          <select value={filterType} onChange={e => setFilterType(e.target.value as JournalEntryType | 'all')}
            className="bg-transparent outline-none font-cairo text-[13px] text-neutral-700">
            <option value="all">كل الأنواع</option>
            {Object.entries(JOURNAL_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>

        <button className="flex items-center gap-2 h-10 px-4 border border-neutral-200 text-neutral-600 rounded-lg font-cairo font-semibold text-[13px] hover:bg-neutral-50 transition-colors">
          <Download size={14} /> تصدير PDF
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-neutral-50 border-b border-neutral-200">
              <th className="px-4 py-3 text-right font-cairo text-[11px] font-bold text-neutral-500 uppercase tracking-wider w-40">رقم القيد</th>
              <th className="px-4 py-3 text-right font-cairo text-[11px] font-bold text-neutral-500 uppercase tracking-wider">التاريخ</th>
              <th className="px-4 py-3 text-right font-cairo text-[11px] font-bold text-neutral-500 uppercase tracking-wider">البيان</th>
              <th className="px-4 py-3 text-right font-cairo text-[11px] font-bold text-neutral-500 uppercase tracking-wider">النوع</th>
              <th className="px-4 py-3 text-right font-cairo text-[11px] font-bold text-neutral-500 uppercase tracking-wider">الإجمالي</th>
              <th className="px-4 py-3 text-right font-cairo text-[11px] font-bold text-neutral-500 uppercase tracking-wider">الحالة</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {filtered.map(entry => (
              <React.Fragment key={entry.id}>
                <tr className="hover:bg-neutral-50/50 transition-colors cursor-pointer" onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <ChevronDown size={14} className={`text-neutral-400 shrink-0 transition-transform ${expandedId === entry.id ? 'rotate-180' : 'rotate-90'}`} />
                      <span className="font-mono font-bold text-[12px] text-neutral-700">{entry.number}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-cairo text-[12px] text-neutral-600">{fmtDate(entry.date)}</td>
                  <td className="px-4 py-3 font-cairo text-[13px] font-medium text-neutral-800 max-w-[250px] truncate">{entry.description}</td>
                  <td className="px-4 py-3">
                    <span className="font-cairo text-[11px] font-semibold px-2 py-1 rounded-md bg-neutral-100 text-neutral-600 border border-neutral-200">
                      {JOURNAL_TYPE_LABELS[entry.type]}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-cairo font-bold text-[14px] text-neutral-900">{fmtMoney(entry.totalDebit)}</td>
                  <td className="px-4 py-3">
                    {entry.status === 'posted'
                      ? <span className="flex items-center gap-1 w-max font-cairo text-[11px] font-bold text-green-700 bg-green-50 px-2 py-1 rounded-full"><CheckCircle2 size={12}/> {JOURNAL_STATUS_LABELS.posted}</span>
                      : <span className="flex items-center gap-1 w-max font-cairo text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded-full"><Clock size={12}/> مسودة</span>
                    }
                  </td>
                </tr>
                {expandedId === entry.id && (
                  <tr>
                    <td colSpan={7} className="p-0 border-b-2 accent-border/20">
                      <EntryExpanded entry={entry} />
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-12">
                  <BookOpen size={32} className="mx-auto text-neutral-200 mb-3" />
                  <p className="font-cairo font-semibold text-[14px] text-neutral-500">لا توجد قيود</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showQuickEntry && (
        <QuickEntryModal
          onClose={() => setShowQuickEntry(false)}
          onSave={(entry) => {
            const newEntry = {
              ...entry,
              id: `je${Date.now()}`,
              number: `JE-${new Date().getFullYear()}-${String(entries.length + 1).padStart(3, '0')}`,
              createdAt: new Date().toISOString(),
            } as JournalEntry
            postJournalEntry(newEntry)
            setShowQuickEntry(false)
          }}
        />
      )}
    </div>
  )
}

// Ensure React is imported above or the Fragment works
import React from 'react'

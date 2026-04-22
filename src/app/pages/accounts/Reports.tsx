import { useState, useMemo } from 'react'
import {
  FileText, Download, Scale, TrendingUp, Filter, Users, Table, Calendar
} from 'lucide-react'
import type { Account, AccountCategory } from '../../types/accounts'
import { useAccounts } from './AccountsContext'

const fmtMoney = (n: number) =>
  (n < 0 ? '(' : '') + Math.abs(n).toLocaleString('ar-EG') + ' ج.م' + (n < 0 ? ')' : '')

type ReportType = 'trial_balance' | 'balance_sheet' | 'income_statement' | 'customer_vendors'

export default function Reports() {
  const { accounts } = useAccounts()
  const [reportType, setReportType] = useState<ReportType>('trial_balance')
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0])
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0])

  // Calculate generic groups
  const assetsAccounts   = accounts.filter(a => a.code.startsWith('1') && a.level === 3)
  const liabAccounts     = accounts.filter(a => a.code.startsWith('2') && a.level === 3)
  const equityAccounts   = accounts.filter(a => a.code.startsWith('3') && a.level === 3)
  const revAccounts      = accounts.filter(a => a.code.startsWith('4') && a.level === 3)
  const expAccounts      = accounts.filter(a => a.code.startsWith('5') && a.level === 3)

  // Totals
  const sum = (accs: Account[]) => accs.reduce((s, a) => s + Math.abs(a.balance), 0)
  
  const totalAssets = sum(assetsAccounts)
  const totalLiab   = sum(liabAccounts)
  const totalEquity = sum(equityAccounts)
  const totalRev    = sum(revAccounts)
  const totalExp    = sum(expAccounts)

  const netIncome = totalRev - totalExp

  // Trial Balance Logic
  const allPostingAccounts = accounts.filter(a => a.allowPosting)
  const trialTotalDebit = allPostingAccounts.filter(a => a.nature === 'debit').reduce((s, a) => s + Math.abs(a.balance), 0)
  const trialTotalCredit = allPostingAccounts.filter(a => a.nature === 'credit').reduce((s, a) => s + Math.abs(a.balance), 0)
  
  // Custom accounts (Customers & Suppliers)
  const customers = accounts.filter(a => a.category === 'receivables' && a.level === 3)
  const suppliers = accounts.filter(a => a.category === 'payables' && a.level === 3)

  return (
    <div className="space-y-5" dir="rtl">
      
      {/* Sidebar Layout for reports */}
      <div className="flex flex-col md:flex-row gap-5 items-start">
        
        {/* Report Selector Nav */}
        <div className="w-full md:w-64 shrink-0 bg-white border border-neutral-200 rounded-2xl p-2 shadow-sm space-y-1">
          <p className="px-3 py-2 font-cairo font-semibold text-[11px] text-neutral-400 uppercase tracking-widest">نوع التقرير</p>
          {[
            { id: 'trial_balance', label: 'ميزان المراجعة', icon: Table },
            { id: 'balance_sheet', label: 'الميزانية العمومية (المركز المالي)', icon: Scale },
            { id: 'income_statement', label: 'قائمة الدخل', icon: TrendingUp },
            { id: 'customer_vendors', label: 'أرصدة العملاء والموردين', icon: Users },
          ].map(t => (
            <button key={t.id} onClick={() => setReportType(t.id as ReportType)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-cairo text-[13px] font-semibold transition-colors
              ${reportType === t.id ? 'accent-bg text-white shadow-sm' : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'}`}>
              <t.icon size={16} /> {t.label}
            </button>
          ))}
        </div>

        {/* Report Content */}
        <div className="flex-1 w-full bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden">
          
          {/* Toolbar */}
          <div className="px-5 py-4 border-b border-neutral-100 flex flex-col md:flex-row gap-4 justify-between md:items-center bg-neutral-50/50">
            <div>
              <h2 className="font-cairo font-bold text-[18px] text-neutral-800">
                {reportType === 'trial_balance' ? 'ميزان المراجعة' :
                 reportType === 'balance_sheet' ? 'المركز المالي (الميزانية العمومية)' :
                 reportType === 'income_statement' ? 'قائمة الدخل (الأرباح والخسائر)' :
                 'أرصدة العملاء والموردين'}
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 bg-white px-3 py-1.5 border border-neutral-200 rounded-xl">
                <Calendar size={14} className="text-neutral-400" />
                <span className="font-cairo text-[11px] font-semibold text-neutral-500">من</span>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="outline-none font-cairo text-[12px] bg-transparent" />
                <span className="font-cairo text-[11px] font-semibold text-neutral-500 ml-1 mr-2">إلى</span>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="outline-none font-cairo text-[12px] bg-transparent" />
              </div>
              <button className="flex items-center gap-2 px-4 py-2 hover:accent-bg/10 accent-text rounded-xl font-cairo font-semibold text-[13px] border accent-border/20 transition-colors bg-white">
                <Filter size={14} /> تصفية
              </button>
              <button className="flex items-center gap-2 px-4 py-2 border border-neutral-200 text-neutral-600 rounded-xl font-cairo font-semibold text-[13px] hover:bg-neutral-100 transition-colors bg-white">
                <Download size={14} /> طباعة / تصدير
              </button>
            </div>
          </div>

          <div className="p-5">
            {/* ─── TRIAL BALANCE ─────────────────────────────────────────────────── */}
            {reportType === 'trial_balance' && (
              <div className="border border-neutral-200 rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead className="bg-neutral-100 border-b border-neutral-200">
                    <tr>
                      <th className="px-4 py-3 text-right font-cairo text-[11px] font-bold text-neutral-500 uppercase">رقم الحساب</th>
                      <th className="px-4 py-3 text-right font-cairo text-[11px] font-bold text-neutral-500 uppercase">اسم الحساب</th>
                      <th className="px-4 py-3 text-right font-cairo text-[11px] font-bold text-neutral-500 uppercase w-32 border-r border-neutral-200/60 transition-colors hover:bg-blue-50/50">أرصدة مدينة</th>
                      <th className="px-4 py-3 text-right font-cairo text-[11px] font-bold text-neutral-500 uppercase w-32">أرصدة دائنة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {allPostingAccounts.map(acc => (
                      <tr key={acc.id} className="hover:bg-neutral-50 transition-colors">
                        <td className="px-4 py-2 font-mono text-[12px] text-neutral-500">{acc.code}</td>
                        <td className="px-4 py-2 font-cairo text-[13px] font-medium text-neutral-800">{acc.name}</td>
                        <td className="px-4 py-2 font-cairo font-bold text-[13px] text-red-700 bg-red-50/20">{acc.nature === 'debit' ? fmtMoney(Math.abs(acc.balance)) : '-'}</td>
                        <td className="px-4 py-2 font-cairo font-bold text-[13px] text-green-700 bg-green-50/20">{acc.nature === 'credit' ? fmtMoney(Math.abs(acc.balance)) : '-'}</td>
                      </tr>
                    ))}
                    <tr className="bg-neutral-100 border-t-2 border-neutral-300">
                      <td colSpan={2} className="px-4 py-3 font-cairo font-bold text-[14px] text-neutral-800 text-left">الإجمالي المطابق:</td>
                      <td className="px-4 py-3 font-cairo font-bold text-[15px] text-red-800">{fmtMoney(trialTotalDebit)}</td>
                      <td className="px-4 py-3 font-cairo font-bold text-[15px] text-green-800">{fmtMoney(trialTotalCredit)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* ─── BALANCE SHEET ─────────────────────────────────────────────────── */}
            {reportType === 'balance_sheet' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Assets */}
                <div className="space-y-4">
                  <div className="border border-blue-200 rounded-xl overflow-hidden">
                    <div className="bg-blue-50 p-3 border-b border-blue-200"><h3 className="font-cairo font-bold text-[15px] text-blue-800">الأصول (الموجودات)</h3></div>
                    <table className="w-full">
                      <tbody className="divide-y divide-neutral-100">
                        {assetsAccounts.map(a => (
                          <tr key={a.id}>
                            <td className="px-4 py-2 font-cairo text-[13px] text-neutral-700">{a.name}</td>
                            <td className="px-4 py-2 font-cairo font-bold text-[13px] text-blue-700 text-left">{fmtMoney(Math.abs(a.balance))}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-blue-50/50 border-t border-blue-200">
                        <tr>
                          <td className="px-4 py-3 font-cairo font-bold text-[14px] text-blue-900">إجمالي الأصول</td>
                          <td className="px-4 py-3 font-cairo font-bold text-[16px] text-blue-900 text-left">{fmtMoney(totalAssets)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {/* Liab & Equity */}
                <div className="space-y-4">
                  <div className="border border-red-200 rounded-xl overflow-hidden">
                    <div className="bg-red-50 p-3 border-b border-red-200"><h3 className="font-cairo font-bold text-[15px] text-red-800">الالتزامات (المطلوبات)</h3></div>
                    <table className="w-full">
                      <tbody className="divide-y divide-neutral-100">
                        {liabAccounts.map(a => (
                          <tr key={a.id}>
                            <td className="px-4 py-2 font-cairo text-[13px] text-neutral-700">{a.name}</td>
                            <td className="px-4 py-2 font-cairo font-bold text-[13px] text-red-700 text-left">{fmtMoney(Math.abs(a.balance))}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-red-50/50 border-t border-red-200">
                        <tr>
                          <td className="px-4 py-3 font-cairo font-bold text-[13px] text-red-900">إجمالي الالتزامات</td>
                          <td className="px-4 py-3 font-cairo font-bold text-[14px] text-red-900 text-left">{fmtMoney(totalLiab)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  <div className="border border-purple-200 rounded-xl overflow-hidden">
                    <div className="bg-purple-50 p-3 border-b border-purple-200"><h3 className="font-cairo font-bold text-[15px] text-purple-800">حقوق الملكية</h3></div>
                    <table className="w-full">
                      <tbody className="divide-y divide-neutral-100">
                        {equityAccounts.map(a => (
                          <tr key={a.id}>
                            <td className="px-4 py-2 font-cairo text-[13px] text-neutral-700">{a.name}</td>
                            <td className="px-4 py-2 font-cairo font-bold text-[13px] text-purple-700 text-left">{fmtMoney(Math.abs(a.balance))}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-purple-50/50 border-t border-purple-200">
                        <tr>
                          <td className="px-4 py-3 font-cairo font-bold text-[13px] text-purple-900">إجمالي حقوق الملكية</td>
                          <td className="px-4 py-3 font-cairo font-bold text-[14px] text-purple-900 text-left">{fmtMoney(totalEquity)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  <div className="bg-neutral-100 border border-neutral-200 rounded-xl p-4 flex justify-between items-center shadow-inner">
                    <span className="font-cairo font-bold text-[15px] text-neutral-800">إجمالي الالتزامات وحقوق الملكية</span>
                    <span className="font-cairo font-bold text-[18px] text-neutral-900">{fmtMoney(totalLiab + totalEquity)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* ─── INCOME STATEMENT ──────────────────────────────────────────────── */}
            {reportType === 'income_statement' && (
              <div className="max-w-2xl mx-auto">
                <div className="border border-neutral-200 rounded-xl overflow-hidden">
                  
                  {/* Revenues */}
                  <div className="bg-green-50 p-3 border-b border-neutral-200"><h3 className="font-cairo font-bold text-[15px] text-green-800">الإيرادات المبيعات</h3></div>
                  <table className="w-full text-left">
                    <tbody className="divide-y divide-neutral-100">
                      {revAccounts.map(a => (
                        <tr key={a.id}>
                          <td className="px-5 py-2 font-cairo text-[13px] text-neutral-700 text-right">{a.name}</td>
                          <td className="px-5 py-2 font-cairo font-semibold text-[13px] text-neutral-900">{fmtMoney(Math.abs(a.balance))}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-green-50/30 border-t border-neutral-200">
                      <tr>
                        <td className="px-5 py-3 font-cairo font-bold text-[14px] text-green-900 text-right">إجمالي الإيرادات</td>
                        <td className="px-5 py-3 font-cairo font-bold text-[15px] text-green-700">{fmtMoney(totalRev)}</td>
                      </tr>
                    </tfoot>
                  </table>

                  {/* Expenses */}
                  <div className="bg-amber-50 p-3 border-y border-neutral-200 mt-4"><h3 className="font-cairo font-bold text-[15px] text-amber-800">المصاريف والتكاليف</h3></div>
                  <table className="w-full text-left">
                    <tbody className="divide-y divide-neutral-100">
                      {expAccounts.map(a => (
                        <tr key={a.id}>
                          <td className="px-5 py-2 font-cairo text-[13px] text-neutral-700 text-right">{a.name}</td>
                          <td className="px-5 py-2 font-cairo font-semibold text-[13px] text-neutral-600">({fmtMoney(Math.abs(a.balance))})</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-amber-50/30 border-t border-neutral-200">
                      <tr>
                        <td className="px-5 py-3 font-cairo font-bold text-[14px] text-amber-900 text-right">إجمالي المصاريف</td>
                        <td className="px-5 py-3 font-cairo font-bold text-[15px] text-amber-700">({fmtMoney(totalExp)})</td>
                      </tr>
                    </tfoot>
                  </table>

                  {/* Net Income */}
                  <div className={`p-5 flex justify-between items-center border-t-4 ${netIncome >= 0 ? 'bg-primary-50 border-primary-200' : 'bg-red-50 border-red-200'}`}>
                    <span className={`font-cairo font-bold text-[18px] ${netIncome >= 0 ? 'text-primary-800' : 'text-red-800'}`}>
                      {netIncome >= 0 ? 'صافي الربح المُحقق' : 'صافي الخسارة'}
                    </span>
                    <span className={`font-cairo font-bold text-[24px] ${netIncome >= 0 ? 'text-primary-700' : 'text-red-700'}`}>
                      {fmtMoney(Math.abs(netIncome))}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* ─── CUSTOMERS & VENDORS ───────────────────────────────────────────── */}
            {reportType === 'customer_vendors' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Customers */}
                <div className="border border-neutral-200 rounded-xl overflow-hidden">
                  <div className="bg-neutral-50 flex items-center justify-between p-3 border-b border-neutral-200">
                    <h3 className="font-cairo font-bold text-[14px] text-neutral-800">أرصدة العملاء (مدينون)</h3>
                  </div>
                  <table className="w-full">
                    <tbody className="divide-y divide-neutral-100">
                      {customers.map(c => (
                        <tr key={c.id}>
                          <td className="px-4 py-2 font-cairo text-[13px] font-medium text-neutral-800">{c.name}</td>
                          <td className="px-4 py-2 font-cairo font-bold text-[13px] text-red-600 text-left">{fmtMoney(Math.abs(c.balance))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Suppliers */}
                <div className="border border-neutral-200 rounded-xl overflow-hidden">
                  <div className="bg-neutral-50 flex items-center justify-between p-3 border-b border-neutral-200">
                    <h3 className="font-cairo font-bold text-[14px] text-neutral-800">أرصدة الموردين (دائنون)</h3>
                  </div>
                  <table className="w-full">
                    <tbody className="divide-y divide-neutral-100">
                      {suppliers.map(s => (
                        <tr key={s.id}>
                          <td className="px-4 py-2 font-cairo text-[13px] font-medium text-neutral-800">{s.name}</td>
                          <td className="px-4 py-2 font-cairo font-bold text-[13px] text-green-600 text-left">{fmtMoney(Math.abs(s.balance))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}

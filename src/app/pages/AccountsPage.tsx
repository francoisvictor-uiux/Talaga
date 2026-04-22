import { useState } from 'react'
import {
  PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, CartesianGrid, ResponsiveContainer
} from 'recharts'
import {
  TrendingUp, TrendingDown, Percent, Scale, BookOpen, Layers, Settings, Table
} from 'lucide-react'

// Sub-pages
import ChartOfAccounts from './accounts/ChartOfAccounts'
import JournalBook from './accounts/JournalBook'
import Reports from './accounts/Reports'
import AccountSettings from './accounts/AccountSettings'
import { AccountsProvider, useAccounts } from './accounts/AccountsContext'

// Dashboard data
import { CHART_OF_ACCOUNTS } from '../data/accountsData'

const fmtMoney  = (n: number) => n.toLocaleString('ar-EG') + ' ج.م'

const EXPENSE_BREAKDOWN = [
  { name: 'مشتريات',       value: 248000, pct: 58.9, color: '#f59e0b' },
  { name: 'رواتب وأجور',   value: 185000, pct: 43.9, color: '#8b5cf6' },
  { name: 'تشغيلية',       value: 20500,  pct: 4.9,  color: '#0ea5e9' },
  { name: 'صيانة',         value: 15000,  pct: 3.6,  color: '#f97316' },
]

type Tab = 'dashboard' | 'chart' | 'journal' | 'reports' | 'settings'

function KpiCard({ label, value, sub, trend, icon: Icon, accent }: {
  label: string; value: string; sub?: string
  trend?: { dir: 'up' | 'down'; pct: number }
  icon: any
  accent: { bg: string; iconColor: string; textColor: string }
}) {
  return (
    <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-5">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl ${accent.bg} flex items-center justify-center shrink-0`}>
          <Icon size={18} className={accent.iconColor} />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-[11px] font-semibold font-cairo rounded-full px-2 py-1 ${trend.dir === 'up' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {trend.dir === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {trend.pct}%
          </div>
        )}
      </div>
      <p className="font-cairo text-[11px] text-neutral-400 mb-1">{label}</p>
      <p className={`font-cairo font-bold text-[22px] ${accent.textColor} leading-tight`}>{value}</p>
      {sub && <p className="font-cairo text-[11px] text-neutral-400 mt-1">{sub}</p>}
    </div>
  )
}

function FinancialDashboard() {
  const { accounts } = useAccounts()
  
  const sumLevel = (code: string) => accounts.filter(a => a.level === 1 && a.code.startsWith(code)).reduce((s, a) => s + a.balance, 0)
  const rev = sumLevel('4')
  const exp = sumLevel('5')
  const profit = rev - exp
  const profPct = rev > 0 ? Math.round((profit / rev) * 100) : 0

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="إجمالي الإيرادات" value={fmtMoney(rev)} sub="الفترة الحالية" trend={{ dir: 'up', pct: 14 }} icon={TrendingUp} accent={{ bg: 'bg-[#e8f5ee]', iconColor: 'accent-text', textColor: 'accent-text' }} />
        <KpiCard label="إجمالي المصروفات" value={fmtMoney(exp)} sub="الفترة الحالية" trend={{ dir: 'down', pct: 8 }} icon={TrendingDown} accent={{ bg: 'bg-red-50', iconColor: 'text-red-600', textColor: 'text-red-700' }} />
        <KpiCard label="صافي الربح" value={fmtMoney(profit)} sub="الفترة الحالية" trend={{ dir: 'up', pct: 22 }} icon={Scale} accent={{ bg: 'bg-blue-50', iconColor: 'text-blue-600', textColor: 'text-blue-700' }} />
        <KpiCard label="هامش الربح" value={`${profPct}%`} sub="نسبة الربح الصافي" icon={Percent} accent={{ bg: 'bg-violet-50', iconColor: 'text-violet-600', textColor: 'text-violet-700' }} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-5">
          <div className="mb-4">
            <h2 className="font-cairo font-bold text-[15px] text-neutral-800">توزيع المصروفات (ملخص)</h2>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-center gap-8">
            <PieChart width={220} height={220}>
              <Pie data={EXPENSE_BREAKDOWN} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" paddingAngle={3} isAnimationActive={true}>
                {EXPENSE_BREAKDOWN.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
              </Pie>
              <Tooltip 
                formatter={(value: number, name: string) => [fmtMoney(value), name]} 
                contentStyle={{ fontFamily: 'Cairo', fontSize: 13, borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} 
              />
            </PieChart>
            <div className="w-full md:w-auto flex flex-col gap-2">
              {EXPENSE_BREAKDOWN.map(item => (
                <div key={item.name} className="flex items-center justify-between gap-6 p-2.5 rounded-xl border border-transparent hover:border-neutral-100 hover:bg-neutral-50 hover:shadow-sm transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="font-cairo font-semibold text-[13px] text-neutral-700">{item.name}</span>
                  </div>
                  <div className="text-left font-cairo">
                    <p className="font-bold text-[14px] text-neutral-900">{fmtMoney(item.value)}</p>
                    <p className="text-[11px] font-semibold text-neutral-400 mt-0.5">{item.pct}% من الإجمالي</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-5">
          <div className="mb-4">
            <h2 className="font-cairo font-bold text-[15px] text-neutral-800">رسم بياني للإيرادات / المصروفات</h2>
            <p className="font-cairo text-[12px] text-neutral-400 mt-1">يُشير لصافي الربح الشهري - (البيانات ديمو).</p>
          </div>
          <div className="h-56 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { name: 'إيرادات', value: rev, fill: '#22c55e' },
                { name: 'مصروفات', value: exp, fill: '#f87171' },
                { name: 'صافي الربح', value: Math.max(profit, 0), fill: '#3b82f6' }
              ]} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontFamily: 'Cairo', fontSize: 13, fill: '#737373' }} dy={10} />
                <Tooltip 
                  formatter={(v: number) => [fmtMoney(v), '']} 
                  contentStyle={{ fontFamily: 'Cairo', fontSize: 13, borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} 
                  cursor={{ fill: 'transparent' }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} isAnimationActive={true} animationDuration={1500} barSize={45} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}

function AccountsPageContent() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard')

  const TABS: { id: Tab; label: string; icon: any }[] = [
    { id: 'dashboard', label: 'لوحة التحكم',   icon: TrendingUp },
    { id: 'chart',     label: 'شجرة الحسابات', icon: Layers },
    { id: 'journal',   label: 'دفتر اليومية',  icon: BookOpen },
    { id: 'reports',   label: 'التقارير',      icon: Table },
    { id: 'settings',  label: 'الإعدادات',     icon: Settings },
  ]

  return (
    <div className="min-h-full bg-neutral-50 p-6 font-cairo" dir="rtl">
      <div className="max-w-[1280px] mx-auto space-y-6">

        {/* Page Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-cairo font-bold text-[24px] text-neutral-900 leading-tight">النظام المحاسبي المتكامل</h1>
            <p className="font-cairo text-[13px] text-neutral-500 mt-1">التقارير المالية، القيود اليومية، شجرة الحسابات والأدلة</p>
          </div>
        </div>

        {/* Unified Tabs Header */}
        <div className="flex flex-wrap items-center gap-1 bg-white border border-neutral-200 p-1.5 rounded-2xl shadow-sm overflow-x-auto">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-cairo font-semibold text-[13px] transition-all whitespace-nowrap
              ${activeTab === t.id ? 'accent-bg text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100'}`}
            >
              <t.icon size={16} className={activeTab === t.id ? 'text-white' : 'text-neutral-400'} />
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="animate-fade-in">
          {activeTab === 'dashboard' && <FinancialDashboard />}
          {activeTab === 'chart'     && <ChartOfAccounts />}
          {activeTab === 'journal'   && <JournalBook />}
          {activeTab === 'reports'   && <Reports />}
          {activeTab === 'settings'  && <AccountSettings />}
        </div>

      </div>
    </div>
  )
}

export default function AccountsPage() {
  return (
    <AccountsProvider>
      <AccountsPageContent />
    </AccountsProvider>
  )
}
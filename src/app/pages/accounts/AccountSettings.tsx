import { useState } from 'react'
import {
  Settings, Building2, Landmark, Wallet, Globe, Briefcase, Plus, Package, Power,
  CheckCircle2, X
} from 'lucide-react'
import {
  DEFAULT_INVENTORY_METHOD
} from '../../data/accountsData'
import { useAccounts } from './AccountsContext'
import type { CostCenter, Asset, BankAccount, Treasury, AssetType, DepreciationMethod } from '../../types/accounts'

const fmtMoney = (n: number) => n.toLocaleString('ar-EG') + ' ج.م'
const fmtDate  = (d: string)  => new Date(d).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric', year: 'numeric' })

type SettingsTab = 'cost_centers' | 'currencies' | 'assets' | 'banks' | 'treasuries' | 'inventory' | 'year_end'

// ── Small shared modal shell ──────────────────────────────────────────────────
function ModalShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
          <h3 className="font-cairo font-bold text-[16px] text-neutral-800">{title}</h3>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-700 transition-colors"><X size={18} /></button>
        </div>
        <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="font-cairo font-semibold text-[12px] text-neutral-600">{label}</label>
      {children}
    </div>
  )
}

const inputCls = 'w-full border border-neutral-200 rounded-lg px-3 py-2 font-cairo text-[13px] text-neutral-800 focus:outline-none focus:accent-border focus:ring-1 focus:accent-ring/20 transition-all'
const selectCls = inputCls

// ── Add Cost Center Modal ────────────────────────────────────────────────────
function AddCostCenterModal({ onClose, onSave }: { onClose: () => void; onSave: (c: CostCenter) => void }) {
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')

  const save = () => {
    if (!code.trim() || !name.trim()) return
    onSave({ id: `cc${Date.now()}`, code: code.trim(), name: name.trim(), description: desc.trim() || undefined, isActive: true })
    onClose()
  }

  return (
    <ModalShell title="إضافة مركز تكلفة جديد" onClose={onClose}>
      <Field label="كود مركز التكلفة *">
        <input className={inputCls} value={code} onChange={e => setCode(e.target.value)} placeholder="مثال: CC-005" dir="ltr" />
      </Field>
      <Field label="اسم مركز التكلفة *">
        <input className={inputCls} value={name} onChange={e => setName(e.target.value)} placeholder="مثال: قسم الإنتاج" />
      </Field>
      <Field label="الوصف">
        <textarea className={inputCls + ' resize-none'} rows={3} value={desc} onChange={e => setDesc(e.target.value)} placeholder="وصف اختياري..." />
      </Field>
      <div className="flex gap-3 pt-2">
        <button onClick={save} className="flex-1 py-2.5 accent-bg text-white rounded-xl font-cairo font-bold text-[13px] hover:bg-[#155832] transition-colors">حفظ</button>
        <button onClick={onClose} className="flex-1 py-2.5 bg-neutral-100 text-neutral-700 rounded-xl font-cairo font-bold text-[13px] hover:bg-neutral-200 transition-colors">إلغاء</button>
      </div>
    </ModalShell>
  )
}

// ── Add Asset Modal ──────────────────────────────────────────────────────────
function AddAssetModal({ onClose, onSave }: { onClose: () => void; onSave: (a: Asset) => void }) {
  const [code,      setCode]      = useState('')
  const [name,      setName]      = useState('')
  const [type,      setType]      = useState<AssetType>('equipment')
  const [date,      setDate]      = useState('')
  const [cost,      setCost]      = useState('')
  const [life,      setLife]      = useState('5')
  const [method,    setMethod]    = useState<DepreciationMethod>('straight_line')
  const [residual,  setResidual]  = useState('0')
  const [notes,     setNotes]     = useState('')

  const save = () => {
    if (!code.trim() || !name.trim() || !date || !cost) return
    const purchaseCost = parseFloat(cost) || 0
    const res = parseFloat(residual) || 0
    onSave({
      id: `ast${Date.now()}`,
      code: code.trim(),
      name: name.trim(),
      type,
      purchaseDate: date,
      purchaseCost,
      usefulLifeYears: parseInt(life) || 5,
      depreciationMethod: method,
      residualValue: res,
      accumulatedDepreciation: 0,
      bookValue: purchaseCost,
      accountId: 'a2',
      depExpenseAccountId: 'ea1',
      accDepAccountId: 'aa1',
      isDisposed: false,
      notes: notes.trim() || undefined,
    })
    onClose()
  }

  const ASSET_TYPES: { value: AssetType; label: string }[] = [
    { value: 'equipment', label: 'معدات وآلات' },
    { value: 'vehicle',   label: 'مركبات' },
    { value: 'building',  label: 'مباني' },
    { value: 'land',      label: 'أراضي' },
    { value: 'furniture', label: 'أثاث ومفروشات' },
    { value: 'other',     label: 'أخرى' },
  ]

  return (
    <ModalShell title="إضافة أصل ثابت جديد" onClose={onClose}>
      <div className="grid grid-cols-2 gap-3">
        <Field label="كود الأصل *">
          <input className={inputCls} value={code} onChange={e => setCode(e.target.value)} placeholder="FA-010" dir="ltr" />
        </Field>
        <Field label="نوع الأصل *">
          <select className={selectCls} value={type} onChange={e => setType(e.target.value as AssetType)}>
            {ASSET_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </Field>
      </div>
      <Field label="اسم الأصل *">
        <input className={inputCls} value={name} onChange={e => setName(e.target.value)} placeholder="مثال: سيارة نقل ٢٠٢٤" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="تاريخ الشراء *">
          <input className={inputCls} type="date" value={date} onChange={e => setDate(e.target.value)} />
        </Field>
        <Field label="تكلفة الشراء (ج.م) *">
          <input className={inputCls} type="number" min="0" value={cost} onChange={e => setCost(e.target.value)} placeholder="0" dir="ltr" />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="العمر الإنتاجي (سنوات)">
          <input className={inputCls} type="number" min="1" value={life} onChange={e => setLife(e.target.value)} dir="ltr" />
        </Field>
        <Field label="القيمة التخريدية (ج.م)">
          <input className={inputCls} type="number" min="0" value={residual} onChange={e => setResidual(e.target.value)} dir="ltr" />
        </Field>
      </div>
      <Field label="طريقة الإهلاك">
        <select className={selectCls} value={method} onChange={e => setMethod(e.target.value as DepreciationMethod)}>
          <option value="straight_line">القسط الثابت (Straight-Line)</option>
          <option value="declining_balance">القسط المتناقص (Declining Balance)</option>
        </select>
      </Field>
      <Field label="ملاحظات">
        <textarea className={inputCls + ' resize-none'} rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="ملاحظات اختيارية..." />
      </Field>
      <div className="flex gap-3 pt-2">
        <button onClick={save} className="flex-1 py-2.5 accent-bg text-white rounded-xl font-cairo font-bold text-[13px] hover:bg-[#155832] transition-colors">حفظ الأصل</button>
        <button onClick={onClose} className="flex-1 py-2.5 bg-neutral-100 text-neutral-700 rounded-xl font-cairo font-bold text-[13px] hover:bg-neutral-200 transition-colors">إلغاء</button>
      </div>
    </ModalShell>
  )
}

// ── Add Bank Account Modal ───────────────────────────────────────────────────
function AddBankModal({ onClose, onSave }: { onClose: () => void; onSave: (b: BankAccount) => void }) {
  const [code,       setCode]       = useState('')
  const [bankName,   setBankName]   = useState('')
  const [accName,    setAccName]    = useState('')
  const [accNumber,  setAccNumber]  = useState('')
  const [currency,   setCurrency]   = useState('EGP')
  const [opening,    setOpening]    = useState('0')

  const save = () => {
    if (!bankName.trim() || !accName.trim() || !accNumber.trim()) return
    const bal = parseFloat(opening) || 0
    onSave({
      id: `bk${Date.now()}`,
      code: code.trim() || `BK-${Date.now().toString().slice(-4)}`,
      bankName: bankName.trim(),
      accountName: accName.trim(),
      accountNumber: accNumber.trim(),
      currency,
      openingBalance: bal,
      currentBalance: bal,
      accountId: 'ca1',
      isActive: true,
    })
    onClose()
  }

  return (
    <ModalShell title="إضافة حساب بنكي جديد" onClose={onClose}>
      <div className="grid grid-cols-2 gap-3">
        <Field label="كود الحساب">
          <input className={inputCls} value={code} onChange={e => setCode(e.target.value)} placeholder="BK-004" dir="ltr" />
        </Field>
        <Field label="العملة">
          <select className={selectCls} value={currency} onChange={e => setCurrency(e.target.value)}>
            <option value="EGP">ج.م (EGP)</option>
            <option value="USD">$ (USD)</option>
            <option value="EUR">€ (EUR)</option>
            <option value="SAR">ر.س (SAR)</option>
          </select>
        </Field>
      </div>
      <Field label="اسم البنك *">
        <input className={inputCls} value={bankName} onChange={e => setBankName(e.target.value)} placeholder="مثال: البنك الأهلي المصري" />
      </Field>
      <Field label="اسم الحساب *">
        <input className={inputCls} value={accName} onChange={e => setAccName(e.target.value)} placeholder="مثال: حساب الشركة الجاري" />
      </Field>
      <Field label="رقم الحساب *">
        <input className={inputCls} value={accNumber} onChange={e => setAccNumber(e.target.value)} placeholder="XXXX-XXXX-XXXX" dir="ltr" />
      </Field>
      <Field label="الرصيد الافتتاحي (ج.م)">
        <input className={inputCls} type="number" min="0" value={opening} onChange={e => setOpening(e.target.value)} dir="ltr" />
      </Field>
      <div className="flex gap-3 pt-2">
        <button onClick={save} className="flex-1 py-2.5 accent-bg text-white rounded-xl font-cairo font-bold text-[13px] hover:bg-[#155832] transition-colors">حفظ الحساب</button>
        <button onClick={onClose} className="flex-1 py-2.5 bg-neutral-100 text-neutral-700 rounded-xl font-cairo font-bold text-[13px] hover:bg-neutral-200 transition-colors">إلغاء</button>
      </div>
    </ModalShell>
  )
}

// ── Add Treasury Modal ───────────────────────────────────────────────────────
function AddTreasuryModal({ onClose, onSave }: { onClose: () => void; onSave: (t: Treasury) => void }) {
  const [code,      setCode]      = useState('')
  const [name,      setName]      = useState('')
  const [currency,  setCurrency]  = useState('EGP')
  const [opening,   setOpening]   = useState('0')
  const [custodian, setCustodian] = useState('')

  const save = () => {
    if (!name.trim()) return
    const bal = parseFloat(opening) || 0
    onSave({
      id: `tr${Date.now()}`,
      code: code.trim() || `TR-${Date.now().toString().slice(-4)}`,
      name: name.trim(),
      currency,
      openingBalance: bal,
      currentBalance: bal,
      accountId: 'ca2',
      isActive: true,
      custodian: custodian.trim() || undefined,
    })
    onClose()
  }

  return (
    <ModalShell title="إضافة خزينة نقدية جديدة" onClose={onClose}>
      <div className="grid grid-cols-2 gap-3">
        <Field label="كود الخزينة">
          <input className={inputCls} value={code} onChange={e => setCode(e.target.value)} placeholder="TR-004" dir="ltr" />
        </Field>
        <Field label="العملة">
          <select className={selectCls} value={currency} onChange={e => setCurrency(e.target.value)}>
            <option value="EGP">ج.م (EGP)</option>
            <option value="USD">$ (USD)</option>
            <option value="EUR">€ (EUR)</option>
            <option value="SAR">ر.س (SAR)</option>
          </select>
        </Field>
      </div>
      <Field label="اسم الخزينة *">
        <input className={inputCls} value={name} onChange={e => setName(e.target.value)} placeholder="مثال: خزينة الفرع الثاني" />
      </Field>
      <Field label="أمين الصندوق">
        <input className={inputCls} value={custodian} onChange={e => setCustodian(e.target.value)} placeholder="اسم أمين الصندوق" />
      </Field>
      <Field label="الرصيد الافتتاحي (ج.م)">
        <input className={inputCls} type="number" min="0" value={opening} onChange={e => setOpening(e.target.value)} dir="ltr" />
      </Field>
      <div className="flex gap-3 pt-2">
        <button onClick={save} className="flex-1 py-2.5 accent-bg text-white rounded-xl font-cairo font-bold text-[13px] hover:bg-[#155832] transition-colors">حفظ الخزينة</button>
        <button onClick={onClose} className="flex-1 py-2.5 bg-neutral-100 text-neutral-700 rounded-xl font-cairo font-bold text-[13px] hover:bg-neutral-200 transition-colors">إلغاء</button>
      </div>
    </ModalShell>
  )
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function AccountSettings() {
  const {
    costCenters, setCostCenters,
    currencies,
    assets,       setAssets,
    bankAccounts, setBankAccounts,
    treasuries,   setTreasuries,
    postJournalEntry,
  } = useAccounts()

  const [tab,          setTab]          = useState<SettingsTab>('inventory')
  const [showCCModal,  setShowCCModal]  = useState(false)
  const [showAstModal, setShowAstModal] = useState(false)
  const [showBkModal,  setShowBkModal]  = useState(false)
  const [showTrModal,  setShowTrModal]  = useState(false)

  const handleAdd = () => {
    if (tab === 'cost_centers') setShowCCModal(true)
    else if (tab === 'assets')  setShowAstModal(true)
    else if (tab === 'banks')   setShowBkModal(true)
    else if (tab === 'treasuries') setShowTrModal(true)
  }

  const handleYearEndClose = () => {
    if (confirm('هل أنت متأكد من رغبتك في عمل قيود الإهلاك السنوية وإقفال السنة المالية؟ لا يمكن التراجع عن هذه العملية.')) {
      postJournalEntry({
        id: `je${Date.now()}`,
        number: `JE-Close-${new Date().getFullYear()}`,
        date: new Date().toISOString().split('T')[0],
        description: `قيود إقفال وإهلاكات نهاية السنة المالية ${new Date().getFullYear()}`,
        type: 'general',
        status: 'posted',
        totalDebit: assets.reduce((s, a) => s + (a.bookValue * 0.1), 0),
        totalCredit: assets.reduce((s, a) => s + (a.bookValue * 0.1), 0),
        isBalanced: true,
        createdBy: 'النظام (آلي)',
        createdAt: new Date().toISOString(),
        lines: [
           { id: '1', accountId: 'ea1', accountCode: '5801', accountName: 'مصروف إهلاك الأصول', debit: assets.reduce((s, a) => s + (a.bookValue * 0.1), 0), credit: 0, amount: assets.reduce((s, a) => s + (a.bookValue * 0.1), 0), currency: 'EGP', exchangeRate: 1 },
           { id: '2', accountId: 'aa1', accountCode: '1109', accountName: 'مجمع إهلاك الأصول', debit: 0, credit: assets.reduce((s, a) => s + (a.bookValue * 0.1), 0), amount: assets.reduce((s, a) => s + (a.bookValue * 0.1), 0), currency: 'EGP', exchangeRate: 1 },
        ]
      });
      alert('تم إقفال السنة وإنشاء القيود بنجاح!');
    }
  }

  return (
    <div className="flex flex-col md:flex-row gap-5" dir="rtl">

      {/* ── Modals ── */}
      {showCCModal  && <AddCostCenterModal onClose={() => setShowCCModal(false)}  onSave={c => setCostCenters(prev  => [...prev, c])} />}
      {showAstModal && <AddAssetModal      onClose={() => setShowAstModal(false)} onSave={a => setAssets(prev      => [...prev, a])} />}
      {showBkModal  && <AddBankModal       onClose={() => setShowBkModal(false)}  onSave={b => setBankAccounts(prev => [...prev, b])} />}
      {showTrModal  && <AddTreasuryModal   onClose={() => setShowTrModal(false)}  onSave={t => setTreasuries(prev  => [...prev, t])} />}

      {/* Sidebar Nav */}
      <div className="w-full md:w-56 shrink-0 bg-white border border-neutral-200 rounded-2xl p-2 shadow-sm space-y-1 h-max">
        <p className="px-3 py-2 font-cairo font-semibold text-[11px] text-neutral-400 uppercase tracking-widest">الإعدادات والأدلة</p>
        {[
          { id: 'inventory',    label: 'نظام الجرد',       icon: Package   },
          { id: 'cost_centers', label: 'مراكز التكلفة',   icon: Briefcase },
          { id: 'currencies',   label: 'العملات والصرف',  icon: Globe     },
          { id: 'assets',       label: 'سجل الأصول',       icon: Building2 },
          { id: 'banks',        label: 'حسابات البنوك',    icon: Landmark  },
          { id: 'treasuries',   label: 'الخزائن (النقدية)', icon: Wallet   },
          { id: 'year_end',     label: 'العمليات الختامية', icon: Power    },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id as SettingsTab)}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-cairo text-[13px] font-semibold transition-colors
            ${tab === t.id ? 'accent-bg text-white shadow-sm' : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'}`}>
            <t.icon size={16} /> {t.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="flex-1 bg-white border border-neutral-200 rounded-2xl p-5 shadow-sm min-h-[500px]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-cairo font-bold text-[18px] text-neutral-800">
            {tab === 'inventory'    ? 'إعدادات نظام الجرد' :
             tab === 'cost_centers' ? 'دليل مراكز التكلفة' :
             tab === 'currencies'   ? 'إعدادات العملات وأسعار الصرف' :
             tab === 'assets'       ? 'سجل الأصول الثابتة وإهلاكها' :
             tab === 'banks'        ? 'إدارة الحسابات البنكية' :
             tab === 'year_end'     ? 'إقفال السنة المالية والعمليات الختامية' :
             'إدارة خزائن النقدية'}
          </h2>
          {tab !== 'inventory' && tab !== 'year_end' && tab !== 'currencies' && (
            <button onClick={handleAdd} className="flex items-center gap-1.5 px-3 py-2 accent-bg text-white rounded-lg font-cairo font-semibold text-[12px] hover:bg-[#155832] transition-colors">
              <Plus size={14} /> إضافة جديد
            </button>
          )}
        </div>

        {/* ── Inventory ── */}
        {tab === 'inventory' && (
          <div className="max-w-md space-y-4">
            <div className="p-4 rounded-xl border-2 accent-border bg-[#e8f5ee] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-1.5 h-full accent-bg" />
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="radio" name="inv_method" value="perpetual" className="mt-1" defaultChecked={DEFAULT_INVENTORY_METHOD === 'perpetual'} />
                <div>
                  <p className="font-cairo font-bold text-[14px] text-neutral-800">نظام الجرد المستمر (Perpetual)</p>
                  <p className="font-cairo text-[12px] text-neutral-600 leading-relaxed mt-1">يتم عمل قيد أوتوماتيكي مع كل حركة بيع لسحب البضاعة المباعة من المخزون وتحميلها على تكلفة البضاعة المباعة. (موصى به لرقابة أفضل).</p>
                </div>
              </label>
            </div>
            <div className="p-4 rounded-xl border border-neutral-200 hover:border-neutral-300 transition-colors">
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="radio" name="inv_method" value="periodic" className="mt-1" defaultChecked={DEFAULT_INVENTORY_METHOD === 'periodic'} />
                <div>
                  <p className="font-cairo font-bold text-[14px] text-neutral-800">نظام الجرد الدوري (Periodic)</p>
                  <p className="font-cairo text-[12px] text-neutral-600 leading-relaxed mt-1">لا يتم التأثير على المخزون إلا في نهاية المدة (السنة/الشهر) بقيد إغلاق للمخزون القديم والجديد لتسوية تكلفة البضاعة المباعة.</p>
                </div>
              </label>
            </div>
            <button className="w-full py-2.5 bg-neutral-800 text-white rounded-lg font-cairo font-semibold text-[13px] hover:bg-neutral-900 mt-4">
              حفظ إعدادات المخزون
            </button>
          </div>
        )}

        {/* ── Cost Centers ── */}
        {tab === 'cost_centers' && (
          <div className="border border-neutral-200 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="px-4 py-2.5 text-right font-cairo font-bold text-[11px] text-neutral-500">كود</th>
                  <th className="px-4 py-2.5 text-right font-cairo font-bold text-[11px] text-neutral-500">اسم مركز التكلفة</th>
                  <th className="px-4 py-2.5 text-right font-cairo font-bold text-[11px] text-neutral-500">الوصف</th>
                  <th className="px-4 py-2.5 text-right font-cairo font-bold text-[11px] text-neutral-500">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {costCenters.map(c => (
                  <tr key={c.id} className="hover:bg-neutral-50/60 transition-colors">
                    <td className="px-4 py-3 font-mono text-[12px] text-neutral-600">{c.code}</td>
                    <td className="px-4 py-3 font-cairo font-bold text-[13px] text-neutral-800">{c.name}</td>
                    <td className="px-4 py-3 font-cairo text-[12px] text-neutral-500">{c.description}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded font-cairo text-[10px] font-bold ${c.isActive ? 'bg-green-50 text-green-700' : 'bg-neutral-100 text-neutral-500'}`}>
                        {c.isActive ? 'نشط' : 'غير نشط'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Currencies ── */}
        {tab === 'currencies' && (
          <div className="border border-neutral-200 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="px-4 py-2.5 text-right font-cairo font-bold text-[11px] text-neutral-500">الرمز</th>
                  <th className="px-4 py-2.5 text-right font-cairo font-bold text-[11px] text-neutral-500">اسم العملة</th>
                  <th className="px-4 py-2.5 text-right font-cairo font-bold text-[11px] text-neutral-500">معامل التحويل (لعملة الأساس)</th>
                  <th className="px-4 py-2.5 text-right font-cairo font-bold text-[11px] text-neutral-500">أساسية؟</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {currencies.map(c => (
                  <tr key={c.code} className={c.isBase ? 'bg-blue-50/20' : 'hover:bg-neutral-50/60 transition-colors'}>
                    <td className="px-4 py-3 font-mono font-bold text-[14px] text-neutral-800">{c.symbol} ({c.code})</td>
                    <td className="px-4 py-3 font-cairo font-bold text-[13px] text-neutral-800">{c.name}</td>
                    <td className="px-4 py-3 font-cairo text-[13px] text-neutral-600">{c.exchangeRate}</td>
                    <td className="px-4 py-3">
                      {c.isBase && <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-700 font-cairo text-[10px] font-bold">عملة النظام</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Assets ── */}
        {tab === 'assets' && (
          <div className="border border-neutral-200 rounded-xl overflow-hidden overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="px-4 py-2.5 text-right font-cairo font-bold text-[11px] text-neutral-500 whitespace-nowrap">كود الأصل</th>
                  <th className="px-4 py-2.5 text-right font-cairo font-bold text-[11px] text-neutral-500 whitespace-nowrap">اسم الأصل</th>
                  <th className="px-4 py-2.5 text-right font-cairo font-bold text-[11px] text-neutral-500 whitespace-nowrap">تاريخ الشراء</th>
                  <th className="px-4 py-2.5 text-right font-cairo font-bold text-[11px] text-neutral-500 whitespace-nowrap">تكلفة الشراء</th>
                  <th className="px-4 py-2.5 text-right font-cairo font-bold text-[11px] text-neutral-500 whitespace-nowrap">إهلاك مجمع</th>
                  <th className="px-4 py-2.5 text-right font-cairo font-bold text-[11px] text-neutral-500 whitespace-nowrap">القيمة الدفترية</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {assets.map(a => (
                  <tr key={a.id} className="hover:bg-neutral-50/60 transition-colors">
                    <td className="px-4 py-3 font-mono text-[12px] text-neutral-600 whitespace-nowrap">{a.code}</td>
                    <td className="px-4 py-3 font-cairo font-bold text-[13px] text-neutral-800 whitespace-nowrap">{a.name}</td>
                    <td className="px-4 py-3 font-cairo text-[12px] text-neutral-500 whitespace-nowrap">{fmtDate(a.purchaseDate)}</td>
                    <td className="px-4 py-3 font-cairo font-semibold text-[13px] text-neutral-700 whitespace-nowrap">{fmtMoney(a.purchaseCost)}</td>
                    <td className="px-4 py-3 font-cairo font-semibold text-[13px] text-red-600 whitespace-nowrap">({fmtMoney(a.accumulatedDepreciation)})</td>
                    <td className="px-4 py-3 font-cairo font-bold text-[13px] text-blue-700 whitespace-nowrap">{fmtMoney(a.bookValue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Banks ── */}
        {tab === 'banks' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {bankAccounts.map(b => (
              <div key={b.id} className="border border-neutral-200 rounded-xl p-4 bg-gradient-to-br from-white to-neutral-50/50">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-3">
                  <Landmark size={18} />
                </div>
                <h3 className="font-cairo font-bold text-[15px] text-neutral-800">{b.bankName}</h3>
                <p className="font-cairo text-[12px] text-neutral-500 mb-2">{b.accountName}</p>
                <p className="font-mono text-[11px] text-neutral-400 bg-neutral-100 px-2 py-1 rounded mb-3 w-fit">{b.accountNumber}</p>
                <div className="pt-3 border-t border-neutral-200 flex justify-between items-center">
                  <span className="font-cairo text-[11px] text-neutral-500">الرصيد الدفتري</span>
                  <span className="font-cairo font-bold text-[14px] text-neutral-900" dir="ltr">{b.currentBalance.toLocaleString()} {b.currency}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Treasuries ── */}
        {tab === 'treasuries' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {treasuries.map(t => (
              <div key={t.id} className="border border-neutral-200 rounded-xl p-4 bg-gradient-to-br from-white to-neutral-50/50">
                <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center mb-3">
                  <Wallet size={18} />
                </div>
                <h3 className="font-cairo font-bold text-[15px] text-neutral-800">{t.name}</h3>
                <p className="font-cairo text-[12px] text-neutral-500 mb-3">الصراف: {t.custodian || 'غير محدد'}</p>
                <div className="pt-3 border-t border-neutral-200 flex justify-between items-center">
                  <span className="font-cairo text-[11px] text-neutral-500">رصيد الخزينة</span>
                  <span className="font-cairo font-bold text-[16px] text-neutral-900" dir="ltr">{t.currentBalance.toLocaleString()} {t.currency}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Year End ── */}
        {tab === 'year_end' && (
          <div className="max-w-xl space-y-5">
            <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-red-900 font-cairo">
              <div className="flex items-start gap-3">
                <Power className="mt-1 shrink-0 text-red-600" size={20} />
                <div>
                  <h3 className="font-bold text-[15px] mb-1">تنبيه إقفال السنة</h3>
                  <p className="text-[13px] leading-relaxed opacity-90">عملية إقفال السنة ستقوم باحتساب إهلاك الأصول آلياً، وترحيل أرصدة الإيرادات والمصروفات إلى حساب الأرباح المبقاة (Retained Earnings)، وإغلاق الفترات المحاسبية السابقة لمنع أي تعديل عليها.</p>
                </div>
              </div>
            </div>
            <div className="border border-neutral-200 rounded-xl p-5 space-y-4">
               <h4 className="font-cairo font-bold text-[14px]">المهام التي سيتم تنفيذها بنقرة واحدة:</h4>
               <ul className="space-y-3 font-cairo text-[13px] text-neutral-600">
                 <li className="flex gap-2 items-center"><CheckCircle2 size={16} className="text-green-600" /> مراجعة القيد المزدوج ومطابقة ميزان المراجعة آلياً.</li>
                 <li className="flex gap-2 items-center"><CheckCircle2 size={16} className="text-green-600" /> حساب الإهلاك وتوليد قيد الإهلاك السنوي (Depreciation Journal).</li>
                 <li className="flex gap-2 items-center"><CheckCircle2 size={16} className="text-green-600" /> تصفير حسابات النتيجة (الإيرادات/المصروفات) ونقل الصافي للميزانية.</li>
                 <li className="flex gap-2 items-center"><CheckCircle2 size={16} className="text-green-600" /> فتح حسابات السنة المالية وتدوير الأرصدة الافتتاحية.</li>
               </ul>
            </div>
            <button onClick={handleYearEndClose} className="w-full py-3 bg-red-600 text-white rounded-xl font-cairo font-bold shadow-lg hover:bg-red-700 hover:shadow-xl transition-all flex items-center justify-center gap-2">
              <Power size={18} /> تنفيذ الإقفال المحاسبي السنوي الآن
            </button>
          </div>
        )}

      </div>
    </div>
  )
}

# Cold Storage ERP — Figma Make Prompt
## نظام إدارة مخازن التبريد

---

## Project Identity

**App Name:** نظام إدارة مخازن التبريد (Cold Storage Warehouse Management System)
**Language:** Arabic (RTL — Right to Left)
**Primary Color:** Blue (#1E40AF primary, #3B82F6 accent, #DBEAFE background tints)
**Status Colors:**
- Incoming (وارد): Green (#16A34A)
- Outgoing (منصرف): Red (#DC2626)
- Transfer (تحويل): Orange (#EA580C)
**Font:** Noto Sans Arabic or Cairo
**Layout Direction:** RTL throughout all screens
**Device Targets:** Desktop (primary), Tablet (secondary for warehouse staff)

---

## Global Layout Structure

Every screen shares this shell:

```
┌─────────────────────────────────────────┐
│  Top Bar: Logo | Bell (Notifications) | User Avatar | Logout  │
├──────────┬──────────────────────────────┤
│          │                              │
│ Sidebar  │   Main Content Area          │
│ Nav Menu │                              │
│          │                              │
└──────────┴──────────────────────────────┘
```

**Sidebar Navigation Items (Arabic, RTL icons on right):**
1. 🏠 لوحة التحكم
2. 🏭 المخازن والثلاجات
3. 📦 الأصناف والعبوات
4. 👥 العملاء
5. 👨‍💼 الموظفون
6. ✅ الوارد
7. 🚚 المنصرف
8. 🔄 التحويلات
9. 📊 الجرد والتسويات
10. 💰 السندات والتحصيلات
11. 📈 التقارير
12. ✅ قائمة المهام
13. 🔒 سجل التعديلات
14. ⚙️ الإعدادات

---

## Screen 1: Login Screen (شاشة تسجيل الدخول)

**Purpose:** Secure entry point to the system

**Layout:** Centered card on a blue gradient background

**Elements:**
- Company logo at top center (snowflake / warehouse icon)
- Title: "نظام إدارة مخازن التبريد"
- Username field (اسم المستخدم) — RTL input
- Password field (كلمة المرور) — RTL input with show/hide toggle
- "تسجيل الدخول" primary blue button (full width)
- Optional: Face ID / Fingerprint icon below button with label "أو استخدم بصمة الوجه"
- Footer: version number

**Colors:** White card, #1E3A5F dark blue background with subtle snowflake pattern

---

## Screen 2: Dashboard (لوحة التحكم)

**Purpose:** At-a-glance overview of operations

**Layout:** Header stats row + 2-column grid of charts and alerts

**Top KPI Cards (4 cards in a row):**
1. 📦 إجمالي الأصناف المخزنة — number in blue
2. 🏭 نسبة الإشغال — percentage with circular progress bar
3. 💰 إيرادات اليوم — amount in green
4. ⚠️ تنبيهات منتهية الصلاحية — number in orange/red badge

**Middle Section (2 columns):**
- **Left:** Bar chart — حركة الوارد والمنصرف (last 7 days, green vs red bars)
- **Right:** Donut chart — توزيع المساحات (% occupied per warehouse)

**Bottom Section:**
- Recent transactions table (آخر الحركات): columns → رقم الفاتورة | العميل | النوع (badge colored) | الكمية | التاريخ | الحالة
- Quick alerts list (تنبيهات): items with icon + text + timestamp

---

## Screen 3: Warehouses (المخازن والثلاجات)

**Purpose:** Browse and manage the warehouse hierarchy: Warehouse → Chamber (عنبر) → Cell (مربع)

**Layout:** Tree/List view with expandable rows + detail panel on right

**Main Table Columns:**
- اسم الثلاجة | عدد العنابر | السعة الكلية | المشغول | المتاح | حالة الماكينة (badge: تشغيل/إيقاف/صيانة) | الإجراءات

**Capacity Display:** Small horizontal progress bar (blue fill) inline with numbers

**Machine Status Badges:**
- تشغيل = Green badge
- صيانة = Orange badge
- إيقاف = Red badge

**Actions per row:** تعديل | عرض العنابر (expand tree) | QR

**Add Warehouse Button:** "+ إضافة ثلاجة" — top right, blue

---

## Screen 4: Items & Packages (الأصناف والعبوات)

**Purpose:** Define stored product types and packaging formats

**Layout:** Two tabs: "الأصناف" | "العبوات"

**Items Tab — Table Columns:**
- كود الصنف | اسم الصنف | نوع التخزين (badge: تبريد/تجميد) | فترة التخزين القصوى (days) | تنبيه قبل (days) | الحالة

**Packages Tab — Table Columns:**
- كود العبوة | نوع العبوة (طرد/شوال/كرتونة) | الوزن (kg) | الأبعاد (cm) | الإجراءات

**Storage Type Badges:**
- تبريد = Light blue badge with snowflake icon
- تجميد = Dark blue badge with ice icon

---

## Screen 5: Customers (إدارة العملاء)

**Purpose:** Full customer master data with custom pricing and drivers

**Layout:** Searchable/filterable table + slide-in detail drawer

**Table Columns:**
- كود العميل | اسم العميل | الهاتف | الرصيد النقدي (green if positive, red if negative) | عدد الأصناف المخزنة | المندوب | الإجراءات

**Customer Detail Drawer (right side, full height):**
Tabs inside drawer:
1. البيانات الأساسية — name, phone, address, tax number, notes
2. الأسعار المخصصة — table of item → price per day / per month
3. السائقون والمناديب — list with name, phone, license plate
4. كشف الحساب — mini statement of transactions and balance

**Add Customer:** "+ إضافة عميل" modal with all fields

---

## Screen 6: Employees (الموظفون)

**Purpose:** HR management for warehouse staff

**Layout:** Cards grid view (employee photo + name + role) with list toggle

**Employee Card:**
- Avatar circle (initials if no photo)
- Name (bold)
- Role badge (مدير/أمين مخزن/محاسب/عامل)
- Status dot (active/inactive)
- Quick actions: عرض | تعديل | الصلاحيات

**Permissions Modal:**
Checklist grouped by module — e.g.:
- المخازن: [عرض] [إضافة] [تعديل] [حذف]
- الحركات: [عرض] [إضافة] ...

**Other Tabs:** المرتبات | الإجازات | السلف والغياب

---

## Screen 7: Incoming (شاشة الوارد)

**Purpose:** Register new stock arrivals

**Color Theme:** Green accent (#16A34A header bar, green CTA button)

**Header:** شريط أخضر | "فاتورة استلام جديدة" | رقم الفاتورة (auto-generated)

**Form Top Section (grid 3 cols):**
- العميل (searchable dropdown)
- التاريخ (date picker, RTL)
- السائق (dropdown from customer's driver list)
- رقم السيارة (auto-fill from driver)
- المخزن المستلم (dropdown)
- ملاحظات (text area)

**Items Table (add rows dynamically):**
| # | الصنف | العبوة | الكمية | الوزن | تاريخ الإنتاج | تاريخ الانتهاء | رقم السيريال | العنبر/المربع | حذف |

**Footer:**
- "إضافة صنف" row button
- Total summary: إجمالي الطرود | إجمالي الوزن
- "طباعة الفاتورة + QR" button (green)
- "حفظ الفاتورة" button (primary blue)

---

## Screen 8: Outgoing (شاشة المنصرف)

**Purpose:** Register stock dispatches

**Color Theme:** Red accent (#DC2626 header bar, red CTA)

**Header:** شريط أحمر | "فاتورة صرف جديدة" | رقم الفاتورة

**Form Top Section:**
- العميل (searchable dropdown)
- التاريخ
- السائق (required — cannot save without driver)
- رقم السيارة
- المخزن
- ملاحظات

**Items Table:**
| # | الصنف | العبوة | الكمية المطلوبة | الكمية المتاحة (read-only, from stock) | رقم السيريال | العوارية (التالف) | العنبر/المربع | حذف |

**Validation:** Red warning if requested qty > available qty

**Footer:**
- "إضافة صنف" button
- "حفظ وطباعة" red button

---

## Screen 9: Transfers (شاشة التحويلات)

**Purpose:** Transfer stock between warehouses OR between customers

**Color Theme:** Orange accent (#EA580C)

**Two Sub-tabs:**
1. تحويل بين مخازن
2. تحويل بين عملاء

**Between Warehouses Form:**
- من مخزن → إلى مخزن (both dropdown)
- الصنف | العبوة | الكمية
- ملاحظات
- "تأكيد التحويل" orange button

**Between Customers Form:**
- من عميل → إلى عميل
- الصنف | الكمية | العنبر
- "تأكيد التحويل" orange button

---

## Screen 10: Inventory Control (الجرد والتسويات)

**Purpose:** Compare theoretical vs actual stock, flag shortages

**Layout:** Filter bar (مخزن / عميل / صنف / تاريخ) + results table

**Table Columns:**
- الصنف | العميل | الرصيد النظري | الجرد الفعلي | الفرق | حالة الفرق (badge: مطابق/عجز/زيادة)

**Difference Badges:**
- مطابق = Green
- عجز = Red with warning icon
- زيادة = Orange

**Action:** "بدء جرد جديد" button launches a counting form per location

---

## Screen 11: Receipts & Payments (السندات والتحصيلات)

**Purpose:** Record customer payments and operational expenses

**Two Tabs:** سندات القبض | سندات الصرف

**Receipt Voucher Form:**
- العميل | المبلغ | طريقة الدفع (نقدي/تحويل/شيك) | التاريخ | ملاحظات
- "حفظ وطباعة السند" green button

**Expense Voucher Form:**
- البند | المبلغ | من الخزينة | التاريخ | ملاحظات
- "حفظ وطباعة السند" red button

**History Table:** رقم السند | النوع | الطرف | المبلغ | التاريخ | أنشأ بواسطة

---

## Screen 12: Reports (التقارير)

**Purpose:** Financial and operational reports

**Layout:** Left sidebar with report categories + main content area

**Report Categories:**
- تقارير المخازن (مخزن محدد / كل المخازن)
- تقارير العملاء (كشف حساب عميل)
- تقارير مالية (إيرادات / مصروفات / أرباح)
- تقارير الحركات (وارد / منصرف / تحويلات)
- تقارير الجرد

**Report Viewer:**
- Date range picker
- Filter dropdowns (client, warehouse, item)
- "تشغيل التقرير" button
- Results in table with "طباعة" and "تصدير Excel" buttons
- Charts when applicable (bar / line)

---

## Screen 13: Todo List (قائمة المهام)

**Purpose:** Track operational tasks and recurring expenses

**Layout:** Kanban or simple checklist

**Task Card:**
- عنوان المهمة
- النوع badge (مصروف/مهمة/تذكير)
- الأولوية (high/medium/low — colored dot)
- تاريخ الاستحقاق
- المسؤول (employee avatar)
- حالة checkbox

**Add Task:** "+ إضافة مهمة" button opens modal

---

## Screen 14: Audit Log (سجل التعديلات)

**Purpose:** Security log of all system changes

**Layout:** Filterable read-only table

**Columns:**
- التاريخ والوقت | المستخدم | الموديول | نوع الإجراء (badge: إضافة/تعديل/حذف) | التفاصيل (expandable) | IP العنوان

**Action Badges:**
- إضافة = Green
- تعديل = Blue
- حذف = Red

**Filters:** بحث بالمستخدم | الموديول | التاريخ من/إلى

**Note:** No edit or delete actions available on this screen — read only

---

## Screen 15: Settings (الإعدادات)

**Purpose:** System configuration and company profile

**Layout:** Left tabs navigation

**Tabs:**
1. بيانات الشركة — name, logo, address, commercial registration, contract
2. إعدادات الطباعة — thermal/A4 toggle, QR size, logo on invoice
3. الأمان — password policy, session timeout, 2FA toggle
4. النسخ الاحتياطي — last backup time, manual backup button
5. المظهر — color theme (blue default), font size

---

## Component Library (Reusable Components)

| Component | Variants |
|-----------|----------|
| Button | Primary (Blue) / Success (Green) / Danger (Red) / Warning (Orange) / Ghost |
| Badge/Tag | Success / Error / Warning / Info / Neutral |
| Input Field | Default / With Icon / Error State / Disabled — all RTL |
| Table | With pagination, sortable headers, row actions |
| Modal/Dialog | Small / Medium / Large — centered, with backdrop |
| Sidebar Nav Item | Default / Active / Hover |
| KPI Card | Icon + number + label + optional trend arrow |
| Alert/Toast | Success / Error / Warning / Info — slides in from top right |
| Avatar | With image / Initials fallback / With status dot |
| Date Picker | RTL calendar, Arabic month names |

---

## Design Tokens

```
Primary Blue:    #1E40AF
Accent Blue:     #3B82F6
Light Blue BG:   #DBEAFE

Success Green:   #16A34A
Success Light:   #DCFCE7

Danger Red:      #DC2626
Danger Light:    #FEE2E2

Warning Orange:  #EA580C
Warning Light:   #FFEDD5

Text Primary:    #111827
Text Secondary:  #6B7280
Border:          #E5E7EB
Background:      #F9FAFB
Card White:      #FFFFFF

Border Radius:   8px (cards), 6px (inputs), 4px (badges)
Shadow:          0 1px 3px rgba(0,0,0,0.1)
Font Scale:      12 / 14 / 16 / 18 / 24 / 32px
```

---

## Instructions for Figma Make

1. All text must be **Arabic, right-to-left (RTL)**
2. Use **IBM Plex Sans Arabic** font family
3. Apply the blue color theme and components consistently across all screens
4. Use the status colors strictly: **Green = incoming, Red = outgoing, Orange = transfer**
5. Every screen must include the shared sidebar and top bar
6. Tables should have alternating row backgrounds (#F9FAFB / #FFFFFF)
7. All buttons should have hover states
8. Forms should show validation states (error in red, success in green)
9. Use card shadows for depth on KPI cards and modals
10. The login screen is the only screen without the sidebar
11. Use Lucid open source icons
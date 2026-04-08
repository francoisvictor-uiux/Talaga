// ===== WAREHOUSES =====
export const warehouses = [
  { id: 1, letter: "A", name: "ثلاجة المنطقة الأولى",    storageType: "تجميد", chambers: 3, totalCapacity: 100, occupied: 78,  machineStatus: "تشغيل",  machineType: "كمبروسور مكثف هواء",  machinePower: 50, dailyRent: 2.5, monthlyRent: 65, notes: "" },
  { id: 2, letter: "B", name: "ثلاجة الحبوب والبقوليات", storageType: "تبريد", chambers: 4, totalCapacity: 150, occupied: 92,  machineStatus: "تشغيل",  machineType: "كمبروسور أمونيا",     machinePower: 75, dailyRent: 1.8, monthlyRent: 48, notes: "" },
  { id: 3, letter: "C", name: "ثلاجة اللحوم والدواجن",   storageType: "تجميد", chambers: 2, totalCapacity: 80,  occupied: 45,  machineStatus: "صيانة",  machineType: "كمبروسور مكثف هواء",  machinePower: 40, dailyRent: 3.0, monthlyRent: 80, notes: "في صيانة دورية" },
  { id: 4, letter: "D", name: "ثلاجة الخضروات والفواكه", storageType: "تبريد", chambers: 5, totalCapacity: 120, occupied: 30,  machineStatus: "تشغيل",  machineType: "كمبروسور فريون",      machinePower: 30, dailyRent: 1.5, monthlyRent: 40, notes: "" },
  { id: 5, letter: "E", name: "ثلاجة المنتجات المصنعة",  storageType: "تجميد", chambers: 3, totalCapacity: 90,  occupied: 60,  machineStatus: "إيقاف",  machineType: "كمبروسور مكثف هواء",  machinePower: 45, dailyRent: 2.0, monthlyRent: 55, notes: "متوقفة مؤقتاً لصيانة الكهرباء" },
];

export const chambers = [
  { id: 1,  warehouseId: 1, code: "A-1", storageType: "تجميد", cells: 12, temp: -18, occupied: 8,  length: 10, width: 8,  height: 5, capacityWeight: 30, capacityBox: 240, capacitySack: 180, capacityCarton: 480, notes: "" },
  { id: 2,  warehouseId: 1, code: "A-2", storageType: "تجميد", cells: 15, temp: -20, occupied: 14, length: 12, width: 8,  height: 5, capacityWeight: 40, capacityBox: 300, capacitySack: 220, capacityCarton: 600, notes: "" },
  { id: 3,  warehouseId: 1, code: "A-3", storageType: "تجميد", cells: 10, temp: -15, occupied: 6,  length: 8,  width: 6,  height: 5, capacityWeight: 25, capacityBox: 200, capacitySack: 150, capacityCarton: 400, notes: "" },
  { id: 4,  warehouseId: 2, code: "B-1", storageType: "تبريد", cells: 20, temp: 4,   occupied: 18, length: 15, width: 10, height: 6, capacityWeight: 50, capacityBox: 400, capacitySack: 300, capacityCarton: 800, notes: "" },
  { id: 5,  warehouseId: 2, code: "B-2", storageType: "تبريد", cells: 18, temp: 2,   occupied: 17, length: 12, width: 10, height: 6, capacityWeight: 45, capacityBox: 360, capacitySack: 270, capacityCarton: 720, notes: "" },
  { id: 6,  warehouseId: 2, code: "B-3", storageType: "تبريد", cells: 16, temp: 3,   occupied: 14, length: 12, width: 8,  height: 6, capacityWeight: 40, capacityBox: 320, capacitySack: 240, capacityCarton: 640, notes: "" },
  { id: 7,  warehouseId: 2, code: "B-4", storageType: "تبريد", cells: 14, temp: 5,   occupied: 9,  length: 10, width: 8,  height: 6, capacityWeight: 35, capacityBox: 280, capacitySack: 200, capacityCarton: 560, notes: "" },
  { id: 8,  warehouseId: 3, code: "C-1", storageType: "تجميد", cells: 14, temp: -22, occupied: 10, length: 10, width: 8,  height: 5, capacityWeight: 35, capacityBox: 280, capacitySack: 210, capacityCarton: 560, notes: "" },
  { id: 9,  warehouseId: 3, code: "C-2", storageType: "تجميد", cells: 16, temp: -18, occupied: 8,  length: 12, width: 8,  height: 5, capacityWeight: 40, capacityBox: 320, capacitySack: 240, capacityCarton: 640, notes: "" },
  { id: 10, warehouseId: 4, code: "D-1", storageType: "تبريد", cells: 10, temp: 5,   occupied: 4,  length: 8,  width: 6,  height: 4, capacityWeight: 20, capacityBox: 160, capacitySack: 120, capacityCarton: 320, notes: "" },
  { id: 11, warehouseId: 4, code: "D-2", storageType: "تبريد", cells: 12, temp: 4,   occupied: 5,  length: 10, width: 6,  height: 4, capacityWeight: 25, capacityBox: 200, capacitySack: 150, capacityCarton: 400, notes: "" },
  { id: 12, warehouseId: 4, code: "D-3", storageType: "تبريد", cells: 8,  temp: 6,   occupied: 3,  length: 8,  width: 5,  height: 4, capacityWeight: 18, capacityBox: 144, capacitySack: 108, capacityCarton: 288, notes: "" },
  { id: 13, warehouseId: 4, code: "D-4", storageType: "تبريد", cells: 10, temp: 3,   occupied: 7,  length: 10, width: 6,  height: 4, capacityWeight: 22, capacityBox: 176, capacitySack: 130, capacityCarton: 352, notes: "" },
  { id: 14, warehouseId: 4, code: "D-5", storageType: "تبريد", cells: 12, temp: 4,   occupied: 5,  length: 10, width: 8,  height: 4, capacityWeight: 28, capacityBox: 224, capacitySack: 168, capacityCarton: 448, notes: "" },
  { id: 15, warehouseId: 5, code: "E-1", storageType: "تجميد", cells: 15, temp: -20, occupied: 12, length: 12, width: 8,  height: 5, capacityWeight: 38, capacityBox: 304, capacitySack: 228, capacityCarton: 608, notes: "" },
  { id: 16, warehouseId: 5, code: "E-2", storageType: "تجميد", cells: 14, temp: -18, occupied: 9,  length: 10, width: 8,  height: 5, capacityWeight: 32, capacityBox: 256, capacitySack: 192, capacityCarton: 512, notes: "" },
  { id: 17, warehouseId: 5, code: "E-3", storageType: "تجميد", cells: 12, temp: -22, occupied: 7,  length: 10, width: 7,  height: 5, capacityWeight: 28, capacityBox: 224, capacitySack: 168, capacityCarton: 448, notes: "" },
];

// ===== CUSTOMERS =====
export const customers = [
  { id: 1, code: "C001", name: "شركة النيل للتجارة والتوزيع", phone: "01012345678", balance: 15000, itemsStored: 120, agent: "أحمد محمد", address: "القاهرة - مدينة نصر", taxNumber: "123456789", notes: "" },
  { id: 2, code: "C002", name: "مؤسسة رمسيس للمواد الغذائية", phone: "01156789012", balance: -3200, itemsStored: 85, agent: "سعيد العمري", address: "الإسكندرية - سيدي جابر", taxNumber: "234567891", notes: "عميل مميز" },
  { id: 3, code: "C003", name: "مجموعة الدلتا للتوزيع", phone: "01232109876", balance: 28500, itemsStored: 230, agent: "محمد الشيمي", address: "الجيزة - حي الدقي", taxNumber: "345678912", notes: "" },
  { id: 4, code: "C004", name: "شركة سيناء للمواد الغذائية", phone: "01009876543", balance: 5600, itemsStored: 45, agent: "خالد السيد", address: "بورسعيد - المنطقة الصناعية", taxNumber: "456789123", notes: "بيتأخر في الدفع أحياناً" },
  { id: 5, code: "C005", name: "مؤسسة البحيرة للتجارة", phone: "01143216789", balance: 0, itemsStored: 180, agent: "عبدالله النجار", address: "المنصورة - حي الجامعة", taxNumber: "567891234", notes: "" },
  { id: 6, code: "C006", name: "شركة الأهرام للمنتجات الزراعية", phone: "01212345678", balance: 42000, itemsStored: 310, agent: "فهد الحلواني", address: "الإسماعيلية - حي الضفة الغربية", taxNumber: "678912345", notes: "عميل VIP" },
];

export const customerDrivers = [
  { id: 1, customerId: 1, name: "يوسف عبدالرحمن", phone: "01012345679", plate: "أ ب ج 1234" },
  { id: 2, customerId: 1, name: "طارق حسين", phone: "01123456789", plate: "د هـ و 5678" },
  { id: 3, customerId: 2, name: "حمدي الشمري", phone: "01234567890", plate: "ز ح ط 9012" },
  { id: 4, customerId: 3, name: "رامي البلوي", phone: "01056789012", plate: "ي ك ل 3456" },
];

export const customerPricing = [
  { id: 1, customerId: 1, itemName: "دجاج مجمد", pricePerDay: 2.5, pricePerMonth: 70 },
  { id: 2, customerId: 1, itemName: "لحم بقري", pricePerDay: 4.0, pricePerMonth: 110 },
  { id: 3, customerId: 2, itemName: "خضروات", pricePerDay: 1.5, pricePerMonth: 40 },
];

// ===== EMPLOYEES =====
export const employees = [
  { id: 1, name: "أحمد محمد علي", role: "مدير", status: "active", phone: "01011111111", email: "ahmed@coldstorage.eg", salary: 8500, joinDate: "2020-03-15" },
  { id: 2, name: "سارة عبدالله المحمدي", role: "محاسب", status: "active", phone: "01122222222", email: "sara@coldstorage.eg", salary: 6000, joinDate: "2021-06-01" },
  { id: 3, name: "خالد عمر الشيمي", role: "عامل مخزن", status: "active", phone: "01233333333", email: "khaled@coldstorage.eg", salary: 4500, joinDate: "2019-11-10" },
  { id: 4, name: "منى سعيد العطار", role: "عامل مخزن", status: "inactive", phone: "01044444444", email: "mona@coldstorage.eg", salary: 4500, joinDate: "2022-01-20" },
  { id: 5, name: "محمود علي السيد", role: "عامل مخزن", status: "active", phone: "01155555555", email: "mahmoud@coldstorage.eg", salary: 3000, joinDate: "2023-05-05" },
  { id: 6, name: "نور محمد الصعيدي", role: "عامل مخزن", status: "active", phone: "01266666666", email: "nour@coldstorage.eg", salary: 3000, joinDate: "2023-08-15" },
];

// ===== ITEMS =====
export const items = [
  { id: 1, code: "د-001", prefix: "د", name: "دجاج مجمد",       storageType: "تجميد",  maxDays: 180, alertDays: 14, status: "active",   image: "" },
  { id: 2, code: "ل-001", prefix: "ل", name: "لحم بقري",        storageType: "تجميد",  maxDays: 365, alertDays: 30, status: "active",   image: "" },
  { id: 3, code: "أ-001", prefix: "أ", name: "أسماك",           storageType: "تجميد",  maxDays: 120, alertDays: 10, status: "active",   image: "" },
  { id: 4, code: "خ-001", prefix: "خ", name: "خضروات مبردة",    storageType: "تبريد",  maxDays: 30,  alertDays: 5,  status: "active",   image: "" },
  { id: 5, code: "ف-001", prefix: "ف", name: "فواكه مبردة",     storageType: "تبريد",  maxDays: 21,  alertDays: 3,  status: "active",   image: "" },
  { id: 6, code: "ج-001", prefix: "ج", name: "جبنة رومي",       storageType: "تبريد",  maxDays: 45,  alertDays: 7,  status: "active",   image: "" },
  { id: 7, code: "م-001", prefix: "م", name: "معجنات مجمدة",    storageType: "تجميد",  maxDays: 90,  alertDays: 14, status: "active",   image: "" },
  { id: 8, code: "ز-001", prefix: "ز", name: "زبيب",            storageType: "تنشير",  maxDays: 365, alertDays: 30, status: "active",   image: "" },
  { id: 9, code: "ب-001", prefix: "ب", name: "بطاطس",           storageType: "تبريد",  maxDays: 60,  alertDays: 10, status: "active",   image: "" },
  { id: 10,code: "ع-001", prefix: "ع", name: "عسل طبيعي",       storageType: "تنشير",  maxDays: 730, alertDays: 60, status: "inactive", image: "" },
];

export const packages = [
  { id: 1, code: "P001", type: "طرد",     weight: 20, length: 50, width: 40, height: 30, status: "active", image: "" },
  { id: 2, code: "P002", type: "شوال",    weight: 50, length: 80, width: 60, height: 10, status: "active", image: "" },
  { id: 3, code: "P003", type: "كرتونة",  weight: 15, length: 40, width: 30, height: 25, status: "active", image: "" },
  { id: 4, code: "P004", type: "صندوق",   weight: 25, length: 60, width: 45, height: 35, status: "active", image: "" },
  { id: 5, code: "P005", type: "برميل",   weight: 10, length: 35, width: 35, height: 50, status: "active", image: "" },
];

// ===== TRANSACTIONS =====
export const transactions = [
  { id: 1, invoice: "INV-2024-001", customer: "شركة النيل للتجارة", type: "وارد", quantity: 50, weight: 1000, date: "2024-01-15", status: "مكتمل" },
  { id: 2, invoice: "INV-2024-002", customer: "مؤسسة رمسيس", type: "منصرف", quantity: 30, weight: 600, date: "2024-01-15", status: "مكتمل" },
  { id: 3, invoice: "INV-2024-003", customer: "مجموعة الدلتا", type: "تحويل", quantity: 20, weight: 400, date: "2024-01-16", status: "معلق" },
  { id: 4, invoice: "INV-2024-004", customer: "شركة سيناء", type: "وارد", quantity: 100, weight: 2000, date: "2024-01-16", status: "مكتمل" },
  { id: 5, invoice: "INV-2024-005", customer: "مؤسسة البحيرة", type: "منصرف", quantity: 45, weight: 900, date: "2024-01-17", status: "مكتمل" },
  { id: 6, invoice: "INV-2024-006", customer: "شركة الأهرام", type: "وارد", quantity: 75, weight: 1500, date: "2024-01-17", status: "مكتمل" },
  { id: 7, invoice: "INV-2024-007", customer: "شركة النيل للتجارة", type: "منصرف", quantity: 25, weight: 500, date: "2024-01-18", status: "مكتمل" },
  { id: 8, invoice: "INV-2024-008", customer: "مجموعة الدلتا", type: "وارد", quantity: 60, weight: 1200, date: "2024-01-18", status: "مكتمل" },
];

// ===== DAILY MOVEMENT CHART DATA =====
export const dailyMovement = [
  { day: "السبت",    incoming: 85,  outgoing: 45 },
  { day: "الأحد",    incoming: 120, outgoing: 78 },
  { day: "الاثنين",  incoming: 95,  outgoing: 60 },
  { day: "الثلاثاء", incoming: 140, outgoing: 95 },
  { day: "الأربعاء", incoming: 75,  outgoing: 110 },
  { day: "الخميس",  incoming: 180, outgoing: 85 },
  { day: "الجمعة",  incoming: 60,  outgoing: 40 },
];

// ===== WAREHOUSE OCCUPANCY =====
export const warehouseOccupancy = [
  { name: "ثلاجة المنطقة الأولى", value: 78, fill: "#3B82F6" },
  { name: "ثلاجة الحبوب", value: 92, fill: "#1E40AF" },
  { name: "ثلاجة اللحوم", value: 45, fill: "#60A5FA" },
  { name: "ثلاجة الخضروات", value: 30, fill: "#93C5FD" },
  { name: "ثلاجة المصنعة", value: 60, fill: "#BFDBFE" },
];

// ===== INVENTORY =====
export const inventory = [
  { id: 1, item: "دجاج مجمد", customer: "شركة النيل", theoretical: 500, actual: 498, diff: -2, status: "عجز" },
  { id: 2, item: "لحم بقري", customer: "مؤسسة رمسيس", theoretical: 300, actual: 300, diff: 0, status: "مطابق" },
  { id: 3, item: "أسماك", customer: "مجموعة الدلتا", theoretical: 200, actual: 205, diff: 5, status: "زيادة" },
  { id: 4, item: "خضروات", customer: "شركة سيناء", theoretical: 150, actual: 148, diff: -2, status: "عجز" },
  { id: 5, item: "فواكه", customer: "مؤسسة البحيرة", theoretical: 180, actual: 180, diff: 0, status: "مطابق" },
  { id: 6, item: "منتجات ألبان", customer: "شركة الأهرام", theoretical: 250, actual: 252, diff: 2, status: "زيادة" },
];

// ===== RECEIPTS =====
export const receipts = [
  { id: 1, voucherNo: "RV-2024-001", type: "قبض", party: "شركة النيل للتجارة", amount: 5000, paymentMethod: "نقدي", date: "2024-01-15", createdBy: "أحمد محمد" },
  { id: 2, voucherNo: "RV-2024-002", type: "قبض", party: "مجموعة الدلتا", amount: 12000, paymentMethod: "تحويل", date: "2024-01-16", createdBy: "سارة المحمدي" },
  { id: 3, voucherNo: "EV-2024-001", type: "صرف", party: "نفقات صيانة", amount: 2500, paymentMethod: "نقدي", date: "2024-01-16", createdBy: "أحمد محمد" },
  { id: 4, voucherNo: "RV-2024-003", type: "قبض", party: "شركة سيناء", amount: 8000, paymentMethod: "شيك", date: "2024-01-17", createdBy: "سارة المحمدي" },
  { id: 5, voucherNo: "EV-2024-002", type: "صرف", party: "رواتب موظفين", amount: 18000, paymentMethod: "تحويل", date: "2024-01-18", createdBy: "أحمد محمد" },
];

// ===== TASKS =====
export const tasks = [
  { id: 1, title: "مراجعة سجلات الجرد الشهري", type: "مهمة", priority: "عالية", dueDate: "2024-01-25", assignee: "خالد الشيمي", status: "pending" },
  { id: 2, title: "دفع فاتورة الكهرباء", type: "مصروف", priority: "عالية", dueDate: "2024-01-20", assignee: "سارة المحمدي", status: "pending" },
  { id: 3, title: "صيانة مكيفات ثلاجة اللحوم", type: "مهمة", priority: "متوسطة", dueDate: "2024-01-30", assignee: "محمود السيد", status: "completed" },
  { id: 4, title: "تجديد عقد التأمين", type: "تذكير", priority: "منخفضة", dueDate: "2024-02-15", assignee: "أحمد محمد", status: "pending" },
  { id: 5, title: "تدريب الموظفين الجدد", type: "مهمة", priority: "متوسطة", dueDate: "2024-01-28", assignee: "أحمد محمد", status: "pending" },
  { id: 6, title: "مراجعة أسعار التخزين", type: "مهمة", priority: "منخفضة", dueDate: "2024-02-01", assignee: "سارة المحمدي", status: "completed" },
];

// ===== AUDIT LOG =====
export const auditLogs = [
  { id: 1, datetime: "2024-01-18 09:15:32", user: "أحمد محمد", module: "الوارد", action: "إضافة", details: "تم إضافة فاتورة INV-2024-008", ip: "192.168.1.10" },
  { id: 2, datetime: "2024-01-18 08:45:10", user: "سارة المحمدي", module: "السندات", action: "إضافة", details: "تم إضافة سند قبض RV-2024-003", ip: "192.168.1.11" },
  { id: 3, datetime: "2024-01-17 16:30:05", user: "خالد الشيمي", module: "المخازن", action: "تعديل", details: "تم تعديل بيانات ثلاجة اللحوم", ip: "192.168.1.12" },
  { id: 4, datetime: "2024-01-17 14:20:15", user: "أحمد محمد", module: "العملاء", action: "إضافة", details: "تم إضافة عميل جديد C007", ip: "192.168.1.10" },
  { id: 5, datetime: "2024-01-17 11:10:45", user: "سارة المحمدي", module: "الموظفون", action: "تعديل", details: "تم تعديل راتب الموظف محمود السيد", ip: "192.168.1.11" },
  { id: 6, datetime: "2024-01-16 15:05:22", user: "خالد الشيمي", module: "الأصناف", action: "حذف", details: "تم حذف الصنف I009 (منتجات تالفة)", ip: "192.168.1.12" },
  { id: 7, datetime: "2024-01-16 10:30:11", user: "أحمد محمد", module: "الإعدادات", action: "تعديل", details: "تم تحديث بيانات الشركة", ip: "192.168.1.10" },
  { id: 8, datetime: "2024-01-15 09:00:00", user: "منى العطار", module: "المنصرف", action: "إضافة", details: "تم إضافة فاتورة INV-2024-005", ip: "192.168.1.13" },
];

// ===== ALERTS =====
export const alerts = [
  { id: 1, text: "صنف دجاج مجمد (C001) هينتهي خلال 7 أيام", time: "من ساعة", icon: "warning" },
  { id: 2, text: "ثلاجة الحبوب وصلت لـ 92% من الطاقة الاستيعابية", time: "من 3 ساعات", icon: "alert" },
  { id: 3, text: "سند قبض من مؤسسة رمسيس متأخر 15 يوم", time: "من يوم", icon: "money" },
  { id: 4, text: "صنف أسماك (C003) هينتهي خلال 10 أيام", time: "من يومين", icon: "warning" },
];

// ===== REPORT CATEGORIES =====
export const reportCategories = [
  { id: "warehouse", label: "تقارير المخازن", items: ["مخزن محدد", "كل المخازن", "تقرير الطاقة الاستيعابية"] },
  { id: "customer", label: "تقارير العملاء", items: ["كشف حساب عميل", "أكتر العملاء تخزيناً", "العملاء المدينين"] },
  { id: "financial", label: "تقارير مالية", items: ["إيرادات التخزين", "المصروفات التشغيلية", "الأرباح والخسائر"] },
  { id: "movement", label: "تقارير الحركات", items: ["تقرير الوارد", "تقرير المنصرف", "تقرير التحويلات"] },
  { id: "inventory", label: "تقارير الجرد", items: ["جرد شامل", "تقرير الفروقات", "تقرير منتهية الصلاحية"] },
];
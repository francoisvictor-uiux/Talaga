import { apiFetch } from "./api";

type ServiceResult<T> = { isSuccess: boolean; data?: T; errorMessages?: string[] };

function unwrap<T>(res: ServiceResult<T>, fallback: string): T {
  if (!res.isSuccess) throw new Error(res.errorMessages?.[0] ?? fallback);
  return res.data as T;
}

// ── Types ─────────────────────────────────────────────────────────────────────

export type InvoiceType   = "Opening" | "MonthlyRent" | "Outgoing" | "Final" | "OpeningBalance";
export type InvoiceStatus = "Draft" | "Issued" | "PartiallyPaid" | "Paid" | "Cancelled";

export type BackendInvoiceItem = {
  id: string;
  invoiceId: string;
  sourceMovementId?: string | null;
  itemId?: string | null;
  itemName: string;
  brandId?: string | null;
  brandName?: string | null;
  quantity: number;
  weightKg?: number | null;
  daysStored: number;
  pricePerDay: number;
  pricePerMonth: number;
  rentAmount: number;
  billingMethod?: string | null;
  naulageAmount: number;
  openingFeeAmount: number;
  preCoolingFeeAmount: number;
  otherFeesAmount: number;
  lineTotal: number;
  description?: string | null;
  isManual?: boolean;
  addedByName?: string | null;
};

export type BackendInvoice = {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName?: string | null;
  invoiceType: InvoiceType;
  invoiceDate: string;
  periodFrom: string;
  periodTo: string;
  subTotal: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  status: InvoiceStatus;
  notes?: string | null;
  items: BackendInvoiceItem[];
  creationDate: string;
};

// ── Queries ───────────────────────────────────────────────────────────────────

export type GetInvoicesArgs = {
  customerId?: string;
  status?: InvoiceStatus;
  from?: string;
  to?: string;
};

export async function getInvoices(args: GetInvoicesArgs = {}): Promise<BackendInvoice[]> {
  const p = new URLSearchParams();
  if (args.customerId) p.set("customerId", args.customerId);
  if (args.status)     p.set("status",     args.status);
  if (args.from)       p.set("from",       args.from);
  if (args.to)         p.set("to",         args.to);
  const qs = p.toString() ? `?${p.toString()}` : "";
  return unwrap(await apiFetch<ServiceResult<BackendInvoice[]>>(`/Invoices/GetInvoices${qs}`), "فشل تحميل الفواتير");
}

export async function getInvoice(id: string): Promise<BackendInvoice> {
  return unwrap(
    await apiFetch<ServiceResult<BackendInvoice>>("/Invoices/GetInvoice", { headers: { "X-Id": id } }),
    "فشل تحميل الفاتورة",
  );
}

// ── Preview ───────────────────────────────────────────────────────────────────

export type PreviewMonthlyItem = {
  sourceMovementId?: string | null;
  itemId?: string | null;
  itemName: string;
  brandName?: string | null;
  quantity: number;
  daysStored: number;
  pricePerDay: number;
  pricePerMonth: number;
  rentAmount: number;
  movementNumber?: string | null;
};

export type PreviewMonthlyResult = {
  customerId: string;
  customerName?: string | null;
  periodFrom: string;
  periodTo: string;
  items: PreviewMonthlyItem[];
  subTotal: number;
};

export async function previewMonthlyInvoice(customerId: string, periodTo?: string): Promise<PreviewMonthlyResult> {
  return unwrap(
    await apiFetch<ServiceResult<PreviewMonthlyResult>>("/Invoices/PreviewMonthlyInvoice", {
      method: "POST", body: { customerId, periodTo },
    }),
    "فشل حساب معاينة الفاتورة",
  );
}

// ── Generation ────────────────────────────────────────────────────────────────

export async function generateOpeningInvoice(movementId: string, notes?: string): Promise<BackendInvoice> {
  return unwrap(
    await apiFetch<ServiceResult<BackendInvoice>>("/Invoices/GenerateOpeningInvoice", {
      method: "POST", body: { movementId, notes },
    }),
    "فشل إنشاء فاتورة الاستلام",
  );
}

export async function generateMonthlyInvoice(customerId: string, periodTo?: string, notes?: string): Promise<BackendInvoice> {
  return unwrap(
    await apiFetch<ServiceResult<BackendInvoice>>("/Invoices/GenerateMonthlyInvoice", {
      method: "POST", body: { customerId, periodTo, notes },
    }),
    "فشل إنشاء الفاتورة الشهرية",
  );
}

export async function generateOutgoingInvoice(movementId: string, notes?: string): Promise<BackendInvoice> {
  return unwrap(
    await apiFetch<ServiceResult<BackendInvoice>>("/Invoices/GenerateOutgoingInvoice", {
      method: "POST", body: { movementId, notes },
    }),
    "فشل إنشاء فاتورة الصرف",
  );
}

// ── State ─────────────────────────────────────────────────────────────────────

export async function issueInvoice(id: string): Promise<BackendInvoice> {
  return unwrap(
    await apiFetch<ServiceResult<BackendInvoice>>("/Invoices/IssueInvoice", { method: "PUT", headers: { "X-Id": id } }),
    "فشل إصدار الفاتورة",
  );
}

export async function recordPayment(invoiceId: string, amount: number, notes?: string): Promise<BackendInvoice> {
  return unwrap(
    await apiFetch<ServiceResult<BackendInvoice>>("/Invoices/RecordPayment", {
      method: "PUT", body: { invoiceId, amount, notes },
    }),
    "فشل تسجيل الدفع",
  );
}

export async function cancelInvoice(id: string): Promise<void> {
  unwrap(
    await apiFetch<ServiceResult<boolean>>("/Invoices/CancelInvoice", { method: "DELETE", headers: { "X-Id": id } }),
    "فشل إلغاء الفاتورة",
  );
}

// ── Manual item management ────────────────────────────────────────────────────

export type AddInvoiceItemPayload = Omit<BackendInvoiceItem, "id" | "invoiceId"> & { invoiceId: string };
export type EditInvoiceItemPayload = BackendInvoiceItem;

export async function addInvoiceItem(payload: AddInvoiceItemPayload): Promise<BackendInvoiceItem> {
  return unwrap(
    await apiFetch<ServiceResult<BackendInvoiceItem>>("/Invoices/AddInvoiceItem", { method: "POST", body: payload }),
    "فشل إضافة بند الفاتورة",
  );
}

export async function editInvoiceItem(payload: EditInvoiceItemPayload): Promise<BackendInvoiceItem> {
  return unwrap(
    await apiFetch<ServiceResult<BackendInvoiceItem>>("/Invoices/EditInvoiceItem", { method: "PUT", body: payload }),
    "فشل تعديل بند الفاتورة",
  );
}

export async function removeInvoiceItem(id: string): Promise<void> {
  unwrap(
    await apiFetch<ServiceResult<boolean>>("/Invoices/RemoveInvoiceItem", { method: "DELETE", headers: { "X-Id": id } }),
    "فشل حذف بند الفاتورة",
  );
}

export async function addManualExpense(invoiceId: string, description: string, amount: number, addedByName?: string): Promise<BackendInvoiceItem> {
  return unwrap(
    await apiFetch<ServiceResult<BackendInvoiceItem>>("/Invoices/AddManualExpense", {
      method: "POST", body: { invoiceId, description, amount, addedByName },
    }),
    "فشل إضافة المصروف اليدوي",
  );
}

export async function generateOpeningBalanceInvoice(customerId: string, notes?: string): Promise<BackendInvoice> {
  return unwrap(
    await apiFetch<ServiceResult<BackendInvoice>>("/Invoices/GenerateOpeningBalanceInvoice", {
      method: "POST", body: { customerId, notes },
    }),
    "فشل إنشاء فاتورة الرصيد الافتتاحي",
  );
}

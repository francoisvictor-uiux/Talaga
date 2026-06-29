export type ColDef = { id: string; label: string };

export const INCOMING_COLS: ColDef[] = [
  { id: "item",           label: "الصنف" },
  { id: "brand",          label: "الماركة" },
  { id: "package",        label: "العبوة" },
  { id: "quantity",       label: "الكمية" },
  { id: "weightPerUnit",  label: "وزن الوحدة" },
  { id: "weight",         label: "الوزن (كجم)" },
  { id: "productionDate", label: "تاريخ الإنتاج" },
  { id: "expiryDate",     label: "تاريخ الانتهاء" },
  { id: "serial",         label: "رقم الرسالة" },
  { id: "damaged",        label: "العوارية" },
  { id: "preCooling",     label: "إعادة تبريد" },
  { id: "chamber",        label: "مربع التبريد" },
  { id: "temperature",    label: "درجة الحرارة (°م)" },
  { id: "naulage",        label: "النولون" },
];

export const OUTGOING_COLS: ColDef[] = [
  { id: "incomingRef",  label: "حركة الوارد" },
  { id: "item",         label: "الصنف" },
  { id: "brand",        label: "الماركة" },
  { id: "package",      label: "العبوة" },
  { id: "requestedQty", label: "الكمية المطلوبة" },
  { id: "availableQty", label: "الكمية المتاحة" },
  { id: "storageDays",  label: "أيام التخزين" },
  { id: "totalPrice",   label: "إجمالي السعر" },
  { id: "serial",       label: "رقم الرسالة" },
  { id: "damaged",      label: "العوارية" },
  { id: "chamber",      label: "مربع التبريد" },
];

export const INCOMING_COL_KEY  = "talaga_incoming_col_order";
export const OUTGOING_COL_KEY  = "talaga_outgoing_col_order";

export const defaultIncomingOrder = () => INCOMING_COLS.map(c => c.id);
export const defaultOutgoingOrder = () => OUTGOING_COLS.map(c => c.id);

/** Parse a JSON column-order string (from DB or localStorage), fill missing cols at end */
export function parseOrder(raw: string | null | undefined, defaults: string[]): string[] {
  try {
    if (raw) {
      const stored: string[] = JSON.parse(raw);
      const valid = stored.filter(id => defaults.includes(id));
      const missing = defaults.filter(id => !valid.includes(id));
      return [...valid, ...missing];
    }
  } catch { /* ignore */ }
  return defaults;
}

/** Read the stored order from localStorage, filling in any missing columns at the end */
export function resolveOrder(key: string, defaults: string[]): string[] {
  return parseOrder(localStorage.getItem(key), defaults);
}

export const SETTING_KEY_INCOMING = "UI.IncomingColOrder";
export const SETTING_KEY_OUTGOING = "UI.OutgoingColOrder";

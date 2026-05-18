import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate, useParams, useLocation } from "react-router";
import { QRCodeSVG } from "qrcode.react";
import {
  addMovement,
  editMovement,
  deactivateMovement,
  getAllMovements,
  getMovement,
  getAvailableSources,
  type BackendMovement,
  type AvailableSource,
} from "../services/movementService";
import { getAllCustomers, type BackendCustomer } from "../services/customerService";
import { getAllItems, getAllPackages, type BackendItem, type BackendPackage } from "../services/itemService";
import { getAllWarehouses, getChambers, type BackendWarehouse, type BackendChamber } from "../services/warehouseService";
import { getAllEmployees, type BackendEmployee } from "../services/employeeService";
import { getCustomerDrivers, type BackendCustomerDriver } from "../services/customerDriverService";
import { getCustomerNaulages, type BackendCustomerNaulage } from "../services/customerNaulageService";
import { getBrandsByItem, type BackendBrand } from "../services/brandService";
import { resolveImageUrl } from "../services/api";
import { getCustomerPrices, type BackendCustomerPrice } from "../services/customerPricingService";
import {
  Plus, Trash2, Printer, Save, Eye, Pencil,
  PackagePlus, PackageMinus, ArrowLeftRight, AlertCircle,
  Thermometer, MessageCircle, Gift, Cigarette, DoorOpen, X,
  List, Search, Filter, ChevronDown, ArrowRight, QrCode, Download, Tag,
} from "lucide-react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "../components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "../components/ui/command";
import { ChevronsUpDown, Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "../components/ui/tooltip";
import { Checkbox } from "../components/ui/checkbox";

import { useConfirmDelete } from "../components/ui/ConfirmDialog";
import { toast } from "sonner";
import { cn } from "../components/ui/utils";

/* ─── animation presets ─── */
const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } };
const anim = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.28 } } };

const escapeHtml = (s: string) => s
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
  .replace(/'/g, "&#39;");

/* ─── Build a scannable deep-link to a single movement.
       Uses hash-router URLs so it survives the GitHub-Pages base path. ─── */
function movementDeepLink(id: string): string {
  const { origin, pathname } = window.location;
  return `${origin}${pathname}#/movements/${id}`;
}

/* ─── Print a 5cm × 5cm QR label for a movement.
       Opens a new window sized for a label printer or cut-sheet,
       auto-prints then closes. `copies` maps to N identical label pages. ─── */
function printQrLabel(m: BackendMovement, copies = 1) {
  const w = window.open("", "_blank", "width=300,height=400");
  if (!w) { toast.error("افتح نوافذ البوب-أب للطباعة"); return; }

  const qrUrl   = movementDeepLink(m.id);
  const qrImg   = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&ecc=M&data=${encodeURIComponent(qrUrl)}`;
  const typeAr  = m.movementType === "Incoming" ? "وارد"
                : m.movementType === "Outgoing"  ? "منصرف"
                : m.movementType === "Transfer"  ? "تحويل" : m.movementType;
  const typeCls = m.movementType === "Incoming" ? "in"
                : m.movementType === "Outgoing"  ? "out" : "tr";
  const date     = (m.movementDate ?? "").slice(0, 10);
  const customer = m.customerArName || m.customerName || "";
  const item     = m.itemArName     || m.itemName     || "";
  const qty      = `${(m.quantity ?? 0).toLocaleString("ar-EG")} ${m.unit || "طرد"}`;
  const warehouse = m.toWarehouseName   || m.fromWarehouseName   || "";
  const chamber   = m.toChamberName    || m.fromChamberName     || "";
  const location  = [warehouse, chamber].filter(Boolean).join(" / ");

  const label = `
  <div class="label">
    <div class="top">
      <span class="badge ${typeCls}">${typeAr}</span>
      <span class="inv">${m.movementNumber}</span>
    </div>
    <div class="qr"><img src="${qrImg}" /></div>
    <div class="info">
      <div class="cust">${escapeHtml(customer)}</div>
      <div class="itm">${escapeHtml(item)} &mdash; ${qty}</div>
      ${location ? `<div class="meta">${escapeHtml(location)}</div>` : ""}
      <div class="meta">${date}</div>
    </div>
  </div>`;

  const html = `<!doctype html>
<html dir="rtl" lang="ar"><head><meta charset="utf-8"/>
<title>ملصق ${m.movementNumber}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0;}
  @page{size:5cm 5cm;margin:0;}
  body{font-family:"Noto Kufi Arabic",Tahoma,sans-serif;width:5cm;background:#fff;}
  .label{
    width:5cm;height:5cm;
    display:flex;flex-direction:column;align-items:center;
    padding:1.5mm;overflow:hidden;page-break-after:always;
  }
  .top{
    width:100%;display:flex;align-items:center;
    justify-content:space-between;margin-bottom:0.8mm;
  }
  .badge{font-size:5.5pt;font-weight:700;padding:0.5mm 1.8mm;border-radius:1.5mm;}
  .in {background:#dcfce7;color:#166534;}
  .out{background:#fee2e2;color:#991b1b;}
  .tr {background:#ffedd5;color:#9a3412;}
  .inv{font-size:5.5pt;font-weight:700;color:#111;font-family:"Courier New",monospace;direction:ltr;}
  .qr{flex:1;display:flex;align-items:center;justify-content:center;}
  .qr img{width:30mm;height:30mm;}
  .info{width:100%;text-align:center;border-top:0.3mm solid #ddd;padding-top:0.8mm;margin-top:0.5mm;}
  .cust{font-size:6pt;font-weight:700;color:#111;margin-bottom:0.4mm;}
  .itm {font-size:5.5pt;color:#333;margin-bottom:0.3mm;}
  .meta{font-size:4.8pt;color:#777;}
</style></head><body>
  ${Array.from({ length: copies }, () => label).join("")}
  <script>window.onload=function(){window.print();window.close();};<\/script>
</body></html>`;

  w.document.write(html);
  w.document.close();
}

/* ─── Print a full A4 invoice for a movement.
       `m` is the header record; `itemRows` are all sibling rows of the invoice. ─── */
function printInvoice(m: BackendMovement, itemRows: BackendMovement[]) {
  const w = window.open("", "_blank", "width=800,height=900");
  if (!w) { toast.error("افتح نوافذ البوب-أب للطباعة"); return; }
  const rows = itemRows.length > 0 ? itemRows : [m];
  const typeLabel = m.movementType === "Incoming" ? "وارد"
    : m.movementType === "Outgoing" ? "منصرف"
    : m.movementType === "Transfer" ? "تحويل" : m.movementType;
  const date = new Date(m.movementDate).toLocaleDateString("ar-EG");
  const fromLine = m.fromWarehouseName
    ? `${m.fromWarehouseName}${m.fromChamberName ? " / " + m.fromChamberName : ""}`
    : "—";
  const toLine = m.toWarehouseName
    ? `${m.toWarehouseName}${m.toChamberName ? " / " + m.toChamberName : ""}`
    : "—";
  const qrUrl    = movementDeepLink(m.id);
  const qrImgSrc = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(qrUrl)}`;
  const rowQr    = (id: string) =>
    `https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(movementDeepLink(id))}`;
  const html = `<!doctype html>
<html dir="rtl" lang="ar"><head><meta charset="utf-8"/><title>ايصال استلام ${baseInvoiceNo(m.movementNumber)}</title>
<style>
  @page { size: A4; margin: 18mm; }
  body { font-family: "Noto Kufi Arabic", "Tahoma", sans-serif; color: #111; }
  .header { display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid #155dfc; padding-bottom:12px; margin-bottom:18px; gap:14px; }
  .title { font-size:22px; font-weight:700; color:#155dfc; }
  .subtitle { font-size:12px; color:#666; }
  .badge { display:inline-block; padding:4px 10px; border-radius:999px; font-size:12px; font-weight:600; }
  .badge.in { background:#dcfce7; color:#166534; }
  .badge.out { background:#fee2e2; color:#991b1b; }
  .badge.tr { background:#ffedd5; color:#9a3412; }
  table { width:100%; border-collapse:collapse; margin-top:12px; }
  th, td { border:1px solid #d1d5db; padding:8px 10px; font-size:13px; text-align:right; }
  th { background:#f3f4f6; font-weight:600; }
  .grid { display:grid; grid-template-columns:1fr 1fr; gap:14px; margin-top:14px; }
  .field { padding:10px 12px; background:#f9fafb; border:1px solid #e5e7eb; border-radius:6px; }
  .field .lbl { font-size:11px; color:#6b7280; }
  .field .val { font-size:14px; font-weight:600; color:#111; margin-top:4px; }
  .footer { margin-top:36px; display:flex; justify-content:space-between; }
  .sig { width:30%; border-top:1px solid #9ca3af; padding-top:6px; text-align:center; font-size:12px; color:#6b7280; }
  .qr { display:flex; flex-direction:column; align-items:center; gap:4px; }
  .qr img { width:120px; height:120px; }
  .qr .lbl { font-size:10px; color:#6b7280; }
</style></head><body>
  <div class="header">
    <div>
      <div class="title">ايصال استلام</div>
      <div class="subtitle">رقم: ${m.movementNumber} — ${date}</div>
      <span class="badge ${m.movementType === "Incoming" ? "in" : m.movementType === "Outgoing" ? "out" : "tr"}" style="margin-top:6px">${typeLabel}</span>
    </div>
    <div class="qr">
      <img src="${qrImgSrc}" alt="QR" />
      <span class="lbl">امسح للوصول للحركة</span>
    </div>
  </div>
  <div class="grid">
    <div class="field"><div class="lbl">العميل</div><div class="val">${escapeHtml(m.customerArName ?? m.customerName ?? "—")}</div></div>
    <div class="field"><div class="lbl">الصنف</div><div class="val">${escapeHtml(m.itemArName ?? m.itemName ?? "—")}</div></div>
    <div class="field"><div class="lbl">من</div><div class="val">${escapeHtml(fromLine)}</div></div>
    <div class="field"><div class="lbl">إلى</div><div class="val">${escapeHtml(toLine)}</div></div>
    <div class="field"><div class="lbl">السائق</div><div class="val">${escapeHtml(m.driverName ?? "—")}</div></div>
    <div class="field"><div class="lbl">رقم السيارة</div><div class="val">${escapeHtml(m.vehiclePlate ?? "—")}</div></div>
  </div>
  <table>
    <thead><tr><th>#</th><th>البيان</th><th>الماركة</th><th>العبوة</th><th>الكمية</th><th>الوحدة</th><th>الوزن (كجم)</th><th>رقم الرسالة</th><th>النولون</th><th>QR</th></tr></thead>
    <tbody>
      ${rows.map((r, i) => {
        const rowNaulage = (r.naulagePerUnit ?? 0) * (r.quantity ?? 0);
        return `
      <tr>
        <td>${i + 1}</td>
        <td>${escapeHtml(r.itemArName ?? r.itemName ?? "—")}</td>
        <td>${r.brandName ? `<span style="background:#ede9fe;color:#6d28d9;padding:1px 6px;border-radius:9px;font-size:11px">${escapeHtml(r.brandName)}</span>` : "—"}</td>
        <td>${escapeHtml(r.packageName ?? "—")}</td>
        <td>${(r.quantity ?? 0).toLocaleString("ar-EG")}</td>
        <td>${escapeHtml(r.unit ?? "طرد")}</td>
        <td>${r.netWeightKg != null ? r.netWeightKg.toLocaleString("ar-EG") : "—"}</td>
        <td>${escapeHtml(r.referenceNumber ?? "—")}</td>
        <td>${rowNaulage > 0 ? rowNaulage.toLocaleString("ar-EG") + " ج.م" : "—"}</td>
        <td style="text-align:center"><img src="${rowQr(r.id)}" alt="QR" style="width:60px;height:60px"/></td>
      </tr>`;
      }).join("")}
    </tbody>
  </table>
  ${m.notes ? `<div class="field" style="margin-top:14px"><div class="lbl">ملاحظات</div><div class="val">${escapeHtml(m.notes)}</div></div>` : ""}
  <div class="footer">
    <div class="sig">توقيع المسؤول</div>
    <div class="sig">توقيع السائق</div>
    <div class="sig">توقيع المستلم</div>
  </div>
  <script>window.onload = () => { window.focus(); window.print(); }<\/script>
</body></html>`;
  w.document.open();
  w.document.write(html);
  w.document.close();
}

/* ─── Storage cost stat tile.
       Computes per-day / per-month storage cost from customer special pricing
       and shows a per-item breakdown table on hover. ─── */
type StorageCostRow = { itemId: string; itemName?: string; quantity: number };

function StorageCostStat({
  rows, pricing, accentClass = "text-blue-700",
}: {
  rows: StorageCostRow[];
  pricing: BackendCustomerPrice[];
  accentClass?: string;
}) {
  const breakdown = useMemo(() => {
    const lines = rows
      .filter(r => (r.itemId || r.itemName) && r.quantity > 0)
      .map(r => {
        const p = pricing.find(x =>
          (r.itemId && x.itemId === r.itemId) ||
          (r.itemName && x.itemName === r.itemName)
        );
        const perDay   = p?.pricePerDay ?? 0;
        const perMonth = p?.pricePerMonth ?? 0;
        return {
          name: r.itemName || "—",
          qty: r.quantity,
          perDay,
          perMonth,
          hasPrice: !!p,
          totalDay: perDay * r.quantity,
          totalMonth: perMonth * r.quantity,
        };
      });
    return {
      items: lines,
      totalDay:   lines.reduce((s, l) => s + l.totalDay,   0),
      totalMonth: lines.reduce((s, l) => s + l.totalMonth, 0),
      missing:    lines.filter(l => !l.hasPrice).length,
    };
  }, [rows, pricing]);

  if (pricing.length === 0 || breakdown.items.length === 0) return null;

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="cursor-help">
            <p className="text-xs text-gray-500">تخزين / يوم</p>
            <p className={cn("text-2xl font-bold", accentClass)}>
              {breakdown.totalDay.toLocaleString("ar-EG")} <span className="text-xs font-normal">ج.م</span>
            </p>
            <p className="text-[10px] text-gray-500">/ شهر: <span className="font-semibold">{breakdown.totalMonth.toLocaleString("ar-EG")}</span> ج.م</p>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" align="center" className="bg-white text-gray-800 border border-gray-200 shadow-xl p-0 max-w-none">
          <div className="px-3 py-2 border-b border-gray-100 bg-gray-50/60 text-xs font-semibold text-gray-700">
            تفاصيل سعر التخزين لكل صنف
          </div>
          <table className="text-xs" dir="rtl">
            <thead>
              <tr className="bg-gray-50/60 text-gray-600">
                <th className="text-right px-2.5 py-1.5 font-medium">الصنف</th>
                <th className="text-right px-2.5 py-1.5 font-medium">الكمية</th>
                <th className="text-right px-2.5 py-1.5 font-medium">سعر/يوم</th>
                <th className="text-right px-2.5 py-1.5 font-medium">سعر/شهر</th>
                <th className="text-right px-2.5 py-1.5 font-medium">إجمالي/يوم</th>
                <th className="text-right px-2.5 py-1.5 font-medium">إجمالي/شهر</th>
              </tr>
            </thead>
            <tbody>
              {breakdown.items.map((l, i) => (
                <tr key={i} className={cn("border-t border-gray-100", !l.hasPrice && "text-gray-400")}>
                  <td className="px-2.5 py-1.5">{l.name}{!l.hasPrice && <span className="text-[10px] mr-1">(لا يوجد سعر مخصص)</span>}</td>
                  <td className="px-2.5 py-1.5">{l.qty.toLocaleString("ar-EG")}</td>
                  <td className="px-2.5 py-1.5">{l.perDay.toLocaleString("ar-EG")}</td>
                  <td className="px-2.5 py-1.5">{l.perMonth.toLocaleString("ar-EG")}</td>
                  <td className="px-2.5 py-1.5 font-medium">{l.totalDay.toLocaleString("ar-EG")}</td>
                  <td className="px-2.5 py-1.5 font-medium">{l.totalMonth.toLocaleString("ar-EG")}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-amber-50 border-t border-amber-100 text-amber-800">
                <td colSpan={4} className="px-2.5 py-1.5 font-semibold">الإجمالي</td>
                <td className="px-2.5 py-1.5 font-bold">{breakdown.totalDay.toLocaleString("ar-EG")} ج.م</td>
                <td className="px-2.5 py-1.5 font-bold">{breakdown.totalMonth.toLocaleString("ar-EG")} ج.م</td>
              </tr>
            </tfoot>
          </table>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/* ─── tab meta ─── */
const TAB_META = {
  index: {
    label: "كل الحركات", icon: List, color: "text-blue-600",
    activeBg: "bg-blue-600", activeText: "text-white", headerBg: "bg-blue-700",
    prefix: "ALL", invoiceLabel: "سجل الحركات", invoiceDesc: "عرض وبحث وتصفية جميع الحركات",
  },
  incoming: {
    label: "الوارد", icon: PackagePlus, color: "text-green-600",
    activeBg: "bg-green-600", activeText: "text-white", headerBg: "bg-green-600",
    prefix: "INV", invoiceLabel: "فاتورة استلام جديدة", invoiceDesc: "تسجيل البضاعة الواردة للثلاجة",
  },
  outgoing: {
    label: "المنصرف", icon: PackageMinus, color: "text-red-600",
    activeBg: "bg-red-600", activeText: "text-white", headerBg: "bg-red-600",
    prefix: "OUT", invoiceLabel: "فاتورة صرف جديدة", invoiceDesc: "تسجيل البضاعة المنصرفة من الثلاجة",
  },
  transfers: {
    label: "التحويلات", icon: ArrowLeftRight, color: "text-orange-600",
    activeBg: "bg-orange-600", activeText: "text-white", headerBg: "bg-orange-600",
    prefix: "TRF", invoiceLabel: "تحويل جديد", invoiceDesc: "تحويل الأصناف بين الثلاجات أو العملاء",
  },
};

/* ─── WhatsApp helper ─── */
const sendWhatsApp = (message: string, toPhone: string) => {
  if (!toPhone) {
    toast.info("لم يتم تحديد رقم العميل للإرسال");
    return;
  }
  const clean = toPhone.replace(/\D/g, "").replace(/^0/, "20");
  window.open(`https://wa.me/${clean}?text=${encodeURIComponent(message)}`, "_blank");
};



/* ══════════════════════════════════════════════
   INDEX TAB — كل الحركات
══════════════════════════════════════════════ */
interface MovementRecord {
  id: string;
  type: "incoming" | "outgoing" | "transfers";
  invoiceNo: string;
  customer: string;
  item: string;
  quantity: number;
  weight?: number;
  naulage: number;
  warehouse: string;
  date: string;
  temperature?: string;
  driver?: string;
  notes?: string;
}

const MOCK_MOVEMENTS: MovementRecord[] = [
  { id: "1", type: "incoming", invoiceNo: "INV-2024-101", customer: "شركة النور للتجارة", item: "دجاج مجمد", quantity: 200, weight: 480, naulage: 1200, warehouse: "ثلاجة اللحوم", date: "2024-01-20", temperature: "-18", driver: "يوسف عبدالرحمن" },
  { id: "2", type: "outgoing", invoiceNo: "OUT-2024-045", customer: "مجموعة الخليج", item: "لحم بقري", quantity: 50, naulage: 600, warehouse: "ثلاجة اللحوم", date: "2024-01-19", driver: "طارق الحسين" },
  { id: "3", type: "transfers", invoiceNo: "TRF-2024-012", customer: "شركة النور للتجارة", item: "أسماك", quantity: 30, naulage: 0, warehouse: "ثلاجة الأسماك", date: "2024-01-18", notes: "تحويل بين ثلاجات" },
  { id: "4", type: "incoming", invoiceNo: "INV-2024-100", customer: "مؤسسة الفجر", item: "خضروات مبردة", quantity: 150, weight: 320, naulage: 900, warehouse: "ثلاجة الخضروات", date: "2024-01-17", temperature: "-5", driver: "يوسف عبدالرحمن" },
  { id: "5", type: "outgoing", invoiceNo: "OUT-2024-044", customer: "شركة النور للتجارة", item: "دجاج مجمد", quantity: 80, naulage: 480, warehouse: "ثلاجة اللحوم", date: "2024-01-16", driver: "طارق الحسين" },
  { id: "6", type: "transfers", invoiceNo: "TRF-2024-011", customer: "مجموعة الخليج", item: "لحم بقري", quantity: 20, naulage: 0, warehouse: "ثلاجة الحبوب", date: "2024-01-15", notes: "تحويل بين عملاء" },
  { id: "7", type: "incoming", invoiceNo: "INV-2024-099", customer: "مجموعة الخليج", item: "فواكه مبردة", quantity: 100, weight: 210, naulage: 600, warehouse: "ثلاجة الخضروات", date: "2024-01-14", temperature: "-2" },
  { id: "8", type: "outgoing", invoiceNo: "OUT-2024-043", customer: "مؤسسة الفجر", item: "خضروات مبردة", quantity: 60, naulage: 360, warehouse: "ثلاجة الخضروات", date: "2024-01-13" },
  { id: "9", type: "incoming", invoiceNo: "INV-2024-098", customer: "شركة النور للتجارة", item: "أسماك", quantity: 70, weight: 140, naulage: 420, warehouse: "ثلاجة الأسماك", date: "2024-01-12", temperature: "-20", driver: "يوسف عبدالرحمن" },
  { id: "10", type: "outgoing", invoiceNo: "OUT-2024-042", customer: "مجموعة الخليج", item: "فواكه مبردة", quantity: 40, naulage: 240, warehouse: "ثلاجة الخضروات", date: "2024-01-11" },
];

const TYPE_LABELS: Record<MovementRecord["type"], string> = {
  incoming: "وارد",
  outgoing: "منصرف",
  transfers: "تحويل",
};
const TYPE_COLORS: Record<MovementRecord["type"], string> = {
  incoming: "bg-green-100 text-green-700",
  outgoing: "bg-red-100 text-red-700",
  transfers: "bg-orange-100 text-orange-700",
};
const TYPE_DOT: Record<MovementRecord["type"], string> = {
  incoming: "bg-green-500",
  outgoing: "bg-red-500",
  transfers: "bg-orange-500",
};

const TYPE_BACKEND_TO_FRONT: Record<string, MovementRecord["type"]> = {
  Incoming: "incoming",
  Outgoing: "outgoing",
  Transfer: "transfers",
};

/* Strip the trailing "-N" item-count suffix from INV/OUT invoice numbers.
   e.g. "INV-1716234567890-2" → "INV-1716234567890"
   TRF numbers (no suffix) are returned unchanged. */
const baseInvoiceNo = (n: string): string => {
  const m = n.match(/^(.+)-([1-9]\d?)$/);
  return m ? m[1] : n;
};

const mapMovement = (m: BackendMovement): MovementRecord => {
  const type = (TYPE_BACKEND_TO_FRONT[m.movementType] ?? "incoming") as MovementRecord["type"];
  const warehouse =
    type === "outgoing"
      ? (m.fromWarehouseName || "—")
      : (m.toWarehouseName || m.fromWarehouseName || "—");
  return {
    id: m.id,
    type,
    invoiceNo: m.movementNumber,
    customer: m.customerArName || m.customerName || "—",
    item: m.itemArName || m.itemName || "—",
    quantity: Number(m.quantity ?? 0),
    weight: m.netWeightKg ?? undefined,
    naulage: (m.naulagePerUnit ?? 0) * (m.quantity ?? 0),
    warehouse,
    date: (m.movementDate ?? "").slice(0, 10),
    driver: m.driverName ?? undefined,
    notes: m.notes ?? undefined,
  };
};

function IndexTab() {
  const navigate = useNavigate();

  const [customers, setCustomers] = useState<BackendCustomer[]>([]);
  const [movements, setMovements] = useState<MovementRecord[]>([]);
  const [rawMovements, setRawMovements] = useState<BackendMovement[]>([]);
  const [loading, setLoading] = useState(false);
  const { confirmDelete, dialog: confirmDialog } = useConfirmDelete();

  const reload = async () => {
    setLoading(true);
    try {
      const list = await getAllMovements({ pageIndex: 1, pageSize: 200 });
      setRawMovements(list);
      setMovements(list.map(mapMovement));
    } catch (err: any) {
      toast.error(err?.message ?? "فشل تحميل الحركات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
    getAllCustomers(1, 200).then(l => setCustomers(l.filter(c => c.isActive))).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── QR popup (scannable large QR for any movement row) ── */
  const [qrPopup, setQrPopup] = useState<BackendMovement | null>(null);

  /* Find all backend rows that share an invoice (by base number, ignoring -N suffix). */
  const siblingsOf = (m: BackendMovement) =>
    rawMovements.filter(x => baseInvoiceNo(x.movementNumber) === baseInvoiceNo(m.movementNumber));


  const handleDeleteMovement = async (m: BackendMovement) => {
    try {
      await deactivateMovement(m.id);
      toast.success(`تم حذف الحركة ${m.movementNumber}`);
      await reload();
    } catch (err: any) {
      toast.error(err?.message ?? "فشل حذف الحركة");
    }
  };

  const printMovement = (m: BackendMovement) => {
    const siblings = siblingsOf(m).filter(s => s.isActive);
    printInvoice(m, siblings.length > 0 ? siblings : [m]);
  };

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | MovementRecord["type"]>("all");
  const [customerFilter, setCustomerFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    return movements.filter(m => {
      if (typeFilter !== "all" && m.type !== typeFilter) return false;
      if (customerFilter !== "all" && m.customer !== customerFilter) return false;
      if (dateFrom && m.date < dateFrom) return false;
      if (dateTo && m.date > dateTo) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          m.invoiceNo.toLowerCase().includes(q) ||
          m.customer.toLowerCase().includes(q) ||
          m.item.toLowerCase().includes(q) ||
          m.warehouse.toLowerCase().includes(q) ||
          (m.driver || "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [movements, search, typeFilter, customerFilter, dateFrom, dateTo]);

  const uniqueCustomers = useMemo(() => [...new Set(movements.map(m => m.customer))], [movements]);

  /* Group filtered rows by base invoice number — one table row per invoice */
  const grouped = useMemo(() => {
    const map = new Map<string, { records: MovementRecord[]; raws: BackendMovement[] }>();
    filtered.forEach(m => {
      const raw = rawMovements.find(r => r.id === m.id);
      if (!raw) return;
      const key = baseInvoiceNo(m.invoiceNo);
      if (!map.has(key)) map.set(key, { records: [], raws: [] });
      map.get(key)!.records.push(m);
      map.get(key)!.raws.push(raw);
    });
    return [...map.values()].map(({ records, raws }) => {
      const first = records[0];
      return {
        invoiceBase: baseInvoiceNo(first.invoiceNo),
        type: first.type,
        customer: first.customer,
        itemNames: records.map(r => r.item),
        totalQty: records.reduce((s, r) => s + r.quantity, 0),
        totalWeight: records.reduce((s, r) => s + (r.weight ?? 0), 0),
        totalNaulage: records.reduce((s, r) => s + r.naulage, 0),
        warehouse: first.warehouse,
        driver: first.driver,
        date: first.date,
        firstRaw: raws[0],
        allRaws: raws,
      };
    });
  }, [filtered, rawMovements]);

  const totalIncoming = filtered.filter(m => m.type === "incoming").reduce((s, m) => s + m.quantity, 0);
  const totalOutgoing = filtered.filter(m => m.type === "outgoing").reduce((s, m) => s + m.quantity, 0);
  const totalTransfers = filtered.filter(m => m.type === "transfers").reduce((s, m) => s + m.quantity, 0);
  const totalNaulage = filtered.reduce((s, m) => s + m.naulage, 0);

  const hasActiveFilters = typeFilter !== "all" || customerFilter !== "all" || dateFrom || dateTo;


  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
      {/* Stats */}
      <motion.div variants={anim} className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "إجمالي الوارد", value: totalIncoming.toLocaleString(), unit: "طرد", color: "border-green-200 bg-green-50", valueColor: "text-green-700", icon: PackagePlus, iconColor: "text-green-600" },
          { label: "إجمالي المنصرف", value: totalOutgoing.toLocaleString(), unit: "طرد", color: "border-red-200 bg-red-50", valueColor: "text-red-700", icon: PackageMinus, iconColor: "text-red-600" },
          { label: "إجمالي التحويلات", value: totalTransfers.toLocaleString(), unit: "طرد", color: "border-orange-200 bg-orange-50", valueColor: "text-orange-700", icon: ArrowLeftRight, iconColor: "text-orange-600" },
          { label: "إجمالي النولون", value: totalNaulage.toLocaleString(), unit: "ج.م", color: "border-amber-200 bg-amber-50", valueColor: "text-amber-700", icon: List, iconColor: "text-amber-600" },
        ].map((s, i) => {
          const SIcon = s.icon;
          return (
            <Card key={i} className={`border shadow-sm ${s.color}`}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-white/60`}><SIcon className={`w-4 h-4 ${s.iconColor}`} /></div>
                <div>
                  <p className="text-xs text-gray-500">{s.label}</p>
                  <p className={`text-xl font-bold ${s.valueColor}`}>{s.value} <span className="text-xs font-normal">{s.unit}</span></p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </motion.div>

      {/* Search & Filter Bar */}
      <motion.div variants={anim}>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-3 flex-wrap">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="ابحث برقم الفاتورة، العميل، الصنف، الثلاجة..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  dir="rtl"
                  className="w-full pr-9 pl-4 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                />
                {search && (
                  <button onClick={() => setSearch("")} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Type quick filter */}
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                {(["all", "incoming", "outgoing", "transfers"] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setTypeFilter(t)}
                    className={cn(
                      "px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap",
                      typeFilter === t ? "bg-white shadow-sm text-gray-800" : "text-gray-500 hover:text-gray-700",
                    )}
                  >
                    {t === "all" ? "الكل" : TYPE_LABELS[t]}
                  </button>
                ))}
              </div>

              {/* Advanced Filters toggle */}
              <button
                onClick={() => setShowFilters(f => !f)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm border transition-all",
                  showFilters || hasActiveFilters
                    ? "border-blue-400 text-blue-600 bg-blue-50"
                    : "border-gray-200 text-gray-600 hover:border-gray-300",
                )}
              >
                <Filter className="w-4 h-4" />
                فلتر
                {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-blue-500" />}
                <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", showFilters && "rotate-180")} />
              </button>
            </div>

            {/* Advanced Filters Panel */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="pt-3 border-t grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs text-gray-500 font-medium">العميل</label>
                      <select
                        value={customerFilter}
                        onChange={e => setCustomerFilter(e.target.value)}
                        dir="rtl"
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                      >
                        <option value="all">كل العملاء</option>
                        {uniqueCustomers.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs text-gray-500 font-medium">من تاريخ</label>
                      <input
                        type="date"
                        value={dateFrom}
                        onChange={e => setDateFrom(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs text-gray-500 font-medium">إلى تاريخ</label>
                      <input
                        type="date"
                        value={dateTo}
                        onChange={e => setDateTo(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                      />
                    </div>
                  </div>
                  {hasActiveFilters && (
                    <button
                      onClick={() => { setTypeFilter("all"); setCustomerFilter("all"); setDateFrom(""); setDateTo(""); }}
                      className="mt-2 text-xs text-red-500 hover:text-red-600 flex items-center gap-1"
                    >
                      <X className="w-3.5 h-3.5" />مسح كل الفلاتر
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>

      {/* Table */}
      <motion.div variants={anim}>
        <Card className="border-0 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b bg-gray-50 flex items-center justify-between">
            <h3 className="font-semibold text-gray-800">نتائج الحركات</h3>
            <span className="text-xs text-gray-500 bg-white border border-gray-200 px-2 py-0.5 rounded-full">{grouped.length} فاتورة</span>
          </div>
          <CardContent className="p-0">
            {grouped.length === 0 ? (
              <div className="py-16 text-center text-gray-400">
                <List className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">لا توجد حركات تطابق البحث</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[960px]">
                  <thead>
                    <tr className="bg-blue-50 border-b border-blue-100">
                      {["#","النوع","رقم الفاتورة","العميل","الأصناف","الكمية","النولون","الثلاجة","السائق","التاريخ","QR","إجراءات"].map((h, i) => (
                        <th key={i} className="text-right px-3 py-2.5 text-xs font-medium text-blue-800 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {grouped.map((g, idx) => (
                      <motion.tr
                        key={g.invoiceBase}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: idx * 0.03 }}
                        className="border-b hover:bg-gray-50/60 transition-colors"
                      >
                        <td className="px-3 py-3 text-gray-400 text-xs">{idx + 1}</td>
                        <td className="px-3 py-3">
                          <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium", TYPE_COLORS[g.type])}>
                            <span className={cn("w-1.5 h-1.5 rounded-full", TYPE_DOT[g.type])} />
                            {TYPE_LABELS[g.type]}
                          </span>
                        </td>
                        <td className="px-3 py-3 font-mono text-xs text-blue-600 whitespace-nowrap">{g.invoiceBase}</td>
                        <td className="px-3 py-3 text-gray-700 text-xs">{g.customer}</td>
                        <td className="px-3 py-3 text-gray-700 text-xs">
                          {g.itemNames.length === 1
                            ? g.itemNames[0]
                            : <span>
                                {g.itemNames.slice(0, 2).join("، ")}
                                {g.itemNames.length > 2 && <span className="text-gray-400 mr-1">+{g.itemNames.length - 2}</span>}
                                <span className="mr-1.5 text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">{g.itemNames.length} أصناف</span>
                              </span>
                          }
                        </td>
                        <td className="px-3 py-3">
                          <span className="font-semibold text-gray-800">{g.totalQty.toLocaleString()}</span>
                          <span className="text-xs text-gray-400 mr-1">طرد</span>
                          {g.totalWeight > 0 && <span className="text-xs text-gray-400 block">{g.totalWeight.toLocaleString()} كجم</span>}
                        </td>
                        <td className="px-3 py-3 text-amber-600 font-medium text-xs">{g.totalNaulage > 0 ? g.totalNaulage.toLocaleString() + " ج.م" : "—"}</td>
                        <td className="px-3 py-3 text-gray-600 text-xs">{g.warehouse}</td>
                        <td className="px-3 py-3 text-gray-500 text-xs">{g.driver || "—"}</td>
                        <td className="px-3 py-3 text-gray-500 text-xs whitespace-nowrap">{g.date}</td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <button
                            title="افتح الـQR للمسح"
                            onClick={() => setQrPopup(g.firstRaw)}
                            className="inline-flex items-center justify-center bg-white border border-gray-200 rounded p-0.5 hover:border-blue-400 transition-colors"
                          >
                            <QRCodeSVG value={movementDeepLink(g.firstRaw.id)} size={36} level="M" includeMargin={false} />
                          </button>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-0.5">
                            <button title="عرض" onClick={() => navigate(`/movements/${g.firstRaw.id}`)} className="p-1.5 rounded hover:bg-blue-50 text-blue-600">
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button title="تعديل" onClick={() => navigate(`/movements/${g.firstRaw.id}/edit`)} className="p-1.5 rounded hover:bg-gray-100 text-gray-500">
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button title="طباعة الفاتورة" onClick={() => printMovement(g.firstRaw)} className="p-1.5 rounded hover:bg-indigo-50 text-indigo-600">
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                            <button title="طباعة ملصق QR" onClick={() => printQrLabel(g.firstRaw)} className="p-1.5 rounded hover:bg-green-50 text-green-600">
                              <Tag className="w-3.5 h-3.5" />
                            </button>
                            <button
                              title="حذف الفاتورة"
                              onClick={() => confirmDelete(
                                g.invoiceBase,
                                async () => {
                                  await Promise.all(g.allRaws.map(r => deactivateMovement(r.id)));
                                  toast.success(`تم حذف الفاتورة ${g.invoiceBase}`);
                                  await reload();
                                },
                                { title: "حذف الفاتورة", description: `سيتم حذف فاتورة ${g.invoiceBase} (${g.allRaws.length} صنف) نهائياً.` }
                              )}
                              className="p-1.5 rounded hover:bg-red-50 text-red-500"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {confirmDialog}

      <QrPopupDialog movement={qrPopup} onClose={() => setQrPopup(null)} />
    </motion.div>
  );
}

/* ══════════════════════════════════════════════
   QrPopupDialog — large scannable QR for any row
══════════════════════════════════════════════ */
function QrPopupDialog({ movement, onClose }: { movement: BackendMovement | null; onClose: () => void }) {
  if (!movement) return null;
  const link = movementDeepLink(movement.id);
  const typeLabel = movement.movementType === "Incoming" ? "وارد"
    : movement.movementType === "Outgoing" ? "منصرف"
    : movement.movementType === "Transfer" ? "تحويل" : movement.movementType;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(link);
      toast.success("تم نسخ الرابط");
    } catch {
      toast.error("تعذر نسخ الرابط");
    }
  };

  return (
    <Dialog open={!!movement} onOpenChange={o => { if (!o) onClose(); }}>
      <DialogContent dir="rtl" className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-blue-600" />
            رمز QR للحركة
            <span className="text-[11px] bg-gray-100 px-2 py-0.5 rounded-full text-gray-600">{typeLabel}</span>
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center text-center py-3 space-y-3">
          <div className="bg-white p-4 rounded-xl border border-gray-200">
            <QRCodeSVG value={link} size={260} level="M" includeMargin={false} />
          </div>
          <div className="text-sm text-gray-700 space-y-0.5">
            <p className="font-mono">{movement.movementNumber}</p>
            <p className="text-xs text-gray-500">{movement.itemArName ?? movement.itemName ?? "—"} — {(movement.quantity ?? 0).toLocaleString("ar-EG")} {movement.unit ?? "طرد"}</p>
          </div>
          <p className="text-[10px] font-mono text-gray-400 break-all px-2">{link}</p>
        </div>
        <DialogFooter className="gap-2">
          <Button onClick={() => printQrLabel(movement)} variant="outline" className="gap-1.5 border-green-300 text-green-700 hover:bg-green-50">
            <Tag className="w-4 h-4" />طباعة ملصق
          </Button>
          <Button onClick={copyLink} variant="outline" className="gap-1.5">نسخ الرابط</Button>
          <Button onClick={onClose} className="bg-[#155dfc] hover:bg-blue-700 text-white">إغلاق</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DetailRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
      <span className="text-[11px] text-gray-500">{label}</span>
      <span className={cn("text-gray-800", mono && "font-mono text-xs")}>{value}</span>
    </div>
  );
}

/* ══════════════════════════════════════════════
   MovementViewScreen — full-screen detail with QR
══════════════════════════════════════════════ */
function MovementViewScreen({
  movement,
  siblings,
  onBack,
  onEdit,
  onPrint,
  onDelete,
}: {
  movement: BackendMovement;
  siblings: BackendMovement[];
  onBack: () => void;
  onEdit: () => void;
  onPrint: () => void;
  onDelete: () => void;
}) {
  const m = movement;
  const rows = siblings.length > 0 ? siblings : [movement];
  const totalQty    = rows.reduce((s, r) => s + (r.quantity ?? 0), 0);
  const totalWeight = rows.reduce((s, r) => s + (r.netWeightKg ?? 0), 0);

  /* QR popup state — opened by clicking any small QR (per-item or main) */
  const [qrPopupRow, setQrPopupRow] = useState<BackendMovement | null>(null);
  /* Main QR card collapse */
  const [qrCollapsed, setQrCollapsed] = useState(false);
  /* WhatsApp dialog */
  const [showWa, setShowWa]   = useState(false);
  const [waPhone, setWaPhone] = useState("");
  const typeLabel = m.movementType === "Incoming" ? "وارد"
    : m.movementType === "Outgoing" ? "منصرف"
    : m.movementType === "Transfer" ? "تحويل" : m.movementType;
  const headerBg = m.movementType === "Incoming" ? "bg-green-600"
    : m.movementType === "Outgoing" ? "bg-red-600"
    : "bg-orange-600";
  const TypeIcon = m.movementType === "Incoming" ? PackagePlus
    : m.movementType === "Outgoing" ? PackageMinus
    : ArrowLeftRight;

  const deepLink = movementDeepLink(m.id);
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(deepLink);
      toast.success("تم نسخ رابط الحركة");
    } catch {
      toast.error("تعذر نسخ الرابط");
    }
  };

  const downloadQr = () => {
    const svg = document.getElementById("movement-qr-svg") as unknown as SVGElement | null;
    if (!svg) return;
    const blob = new Blob([new XMLSerializer().serializeToString(svg)], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `movement-${m.movementNumber}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5" dir="rtl">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="border-0 shadow-sm overflow-hidden">
          <div className={cn("px-5 py-4 text-white", headerBg)}>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={onBack}
                  className="w-9 h-9 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition-colors"
                  title="رجوع لسجل الحركات"
                >
                  <ArrowRight className="w-5 h-5" />
                </button>
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <TypeIcon className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold flex items-center gap-2">
                    تفاصيل الحركة
                    <span className="text-[11px] bg-white/20 px-2 py-0.5 rounded-full">{typeLabel}</span>
                  </h2>
                  <p className="text-xs opacity-80 font-mono">{baseInvoiceNo(m.movementNumber)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={() => setShowWa(true)} className="bg-green-500 hover:bg-green-400 text-white gap-1.5">
                  <MessageCircle className="w-4 h-4" />واتساب
                </Button>
                <Button onClick={onPrint} className="bg-white text-gray-700 hover:bg-gray-100 gap-1.5">
                  <Printer className="w-4 h-4" />طباعة
                </Button>
                <Button onClick={onEdit} className="bg-white/90 text-gray-700 hover:bg-white gap-1.5">
                  <Pencil className="w-4 h-4" />تعديل
                </Button>
                <Button onClick={onDelete} variant="outline" className="bg-white/10 text-white border-white/30 hover:bg-white/20 gap-1.5">
                  <Trash2 className="w-4 h-4" />حذف
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Body */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: data grid + items table */}
        <div className="lg:col-span-2 space-y-5">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5 space-y-4">
              <h3 className="text-sm font-semibold text-gray-700 border-r-2 border-blue-500 pr-2">بيانات الفاتورة</h3>
              <div className="grid grid-cols-2 gap-3">
                <DetailRow label="رقم الفاتورة" value={baseInvoiceNo(m.movementNumber)} mono />
                <DetailRow label="التاريخ" value={new Date(m.movementDate).toLocaleDateString("ar-EG")} />
                <DetailRow label="العميل" value={m.customerArName ?? m.customerName ?? "—"} />
                <DetailRow label="عدد الأصناف" value={`${rows.length}`} />
                <DetailRow label="من" value={m.fromWarehouseName ? `${m.fromWarehouseName}${m.fromChamberName ? " / " + m.fromChamberName : ""}` : "—"} />
                <DetailRow label="إلى" value={m.toWarehouseName ? `${m.toWarehouseName}${m.toChamberName ? " / " + m.toChamberName : ""}` : "—"} />
                <DetailRow label="السائق" value={m.driverName ?? "—"} />
                <DetailRow label="رقم السيارة" value={m.vehiclePlate ?? "—"} />
                <DetailRow label="إجمالي الكمية" value={`${totalQty.toLocaleString("ar-EG")} ${m.unit ?? "طرد"}`} />
                <DetailRow label="إجمالي الوزن" value={totalWeight ? `${totalWeight.toLocaleString("ar-EG")} كجم` : "—"} />
                <DetailRow label="الحالة" value={m.isActive ? "نشط" : "محذوف"} />
                <DetailRow label="تاريخ الإنشاء" value={m.creationDate ? new Date(m.creationDate).toLocaleString("ar-EG") : "—"} />
              </div>
              {m.notes && (
                <div>
                  <div className="text-xs text-gray-500 mb-1">ملاحظات</div>
                  <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 text-gray-800 whitespace-pre-wrap leading-relaxed text-sm">{m.notes}</div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <div className="px-4 py-3 border-b bg-gray-50 flex items-center justify-between">
              <h3 className="font-semibold text-gray-800 text-sm">الأصناف والرسوم ({rows.length})</h3>
            </div>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[1100px]">
                  <thead>
                    <tr className="bg-blue-50 border-b border-blue-100">
                      {["#","الصنف","الماركة","العبوة","الكمية","الوزن (كجم)","مربع التبريد","رقم الرسالة","نولون/وحدة","إجمالي النولون","فتح عنبر","إعادة تبريد","إجمالي الرسوم","QR"].map((h,i) => (
                        <th key={i} className={cn(
                          "text-right px-3 py-2.5 text-xs font-medium whitespace-nowrap",
                          i >= 8 && i <= 12 ? "text-amber-800 bg-amber-50" : "text-blue-800",
                        )}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, idx) => {
                      const chamberLabel = r.toChamberName || r.fromChamberName || "—";
                      const rowNaulage   = (r.naulagePerUnit ?? 0) * (r.quantity ?? 0);
                      const rowOpening   = r.openingFee ?? 0;
                      const rowPreCool   = r.preCoolingFee ?? 0;
                      const rowTotal     = rowNaulage + rowOpening + rowPreCool;
                      return (
                        <tr key={r.id} className="border-b hover:bg-gray-50/30">
                          <td className="px-3 py-2.5 text-gray-500 text-xs">{idx + 1}</td>
                          <td className="px-3 py-2.5 text-gray-800 font-medium">{r.itemArName ?? r.itemName ?? "—"}</td>
                          <td className="px-3 py-2.5 text-xs">
                            {r.brandName
                              ? <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 text-[11px] font-medium">{r.brandName}</span>
                              : <span className="text-gray-400">—</span>}
                          </td>
                          <td className="px-3 py-2.5 text-gray-700 text-xs">{r.packageName ?? "—"}</td>
                          <td className="px-3 py-2.5 font-semibold text-gray-800">
                            {(r.quantity ?? 0).toLocaleString("ar-EG")}
                            <span className="text-xs text-gray-400 mr-1">{r.unit ?? "طرد"}</span>
                          </td>
                          <td className="px-3 py-2.5 text-gray-700 text-xs">{r.netWeightKg != null ? r.netWeightKg.toLocaleString("ar-EG") : "—"}</td>
                          <td className="px-3 py-2.5 text-gray-700 text-xs">{chamberLabel}</td>
                          <td className="px-3 py-2.5 font-mono text-xs text-gray-600">{r.referenceNumber ?? "—"}</td>
                          {/* Fees columns */}
                          <td className="px-3 py-2.5 text-xs text-amber-700 bg-amber-50/40">
                            {r.naulagePerUnit ? `${r.naulagePerUnit.toLocaleString("ar-EG")} / ${r.naulageUnit ?? "طرد"}` : "—"}
                          </td>
                          <td className="px-3 py-2.5 text-xs font-semibold text-amber-700 bg-amber-50/40">
                            {rowNaulage > 0 ? `${rowNaulage.toLocaleString("ar-EG")} ج.م` : "—"}
                          </td>
                          <td className="px-3 py-2.5 text-xs text-orange-600 bg-orange-50/30">
                            {rowOpening > 0 ? `${rowOpening.toLocaleString("ar-EG")} ج.م` : "—"}
                          </td>
                          <td className="px-3 py-2.5 text-xs text-blue-600 bg-blue-50/30">
                            {rowPreCool > 0 ? `${rowPreCool.toLocaleString("ar-EG")} ج.م` : "—"}
                          </td>
                          <td className="px-3 py-2.5 bg-gray-50">
                            {rowTotal > 0
                              ? <span className="font-bold text-gray-900">{rowTotal.toLocaleString("ar-EG")} <span className="text-xs font-normal text-gray-500">ج.م</span></span>
                              : <span className="text-xs text-gray-400">—</span>
                            }
                          </td>
                          <td className="px-3 py-2.5">
                            <button
                              type="button"
                              onClick={() => setQrPopupRow(r)}
                              title={`افتح QR ${r.itemArName ?? r.itemName ?? ""}`}
                              className="inline-flex items-center justify-center bg-white border border-gray-200 rounded p-0.5 hover:border-blue-400 transition-colors"
                            >
                              <QRCodeSVG value={movementDeepLink(r.id)} size={36} level="M" includeMargin={false} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  {/* Totals footer */}
                  {rows.length > 0 && (() => {
                    const totNaulage  = rows.reduce((s, r) => s + (r.naulagePerUnit ?? 0) * (r.quantity ?? 0), 0);
                    const totOpening  = rows.reduce((s, r) => s + (r.openingFee ?? 0), 0);
                    const totPreCool  = rows.reduce((s, r) => s + (r.preCoolingFee ?? 0), 0);
                    const totQty      = rows.reduce((s, r) => s + (r.quantity ?? 0), 0);
                    const totWeight   = rows.reduce((s, r) => s + (r.netWeightKg ?? 0), 0);
                    const grand       = totNaulage + totOpening + totPreCool;
                    return (
                      <tfoot>
                        <tr className="bg-gray-100 border-t-2 border-gray-300 font-semibold text-xs">
                          <td colSpan={4} className="px-3 py-2.5 text-gray-600">الإجمالي</td>
                          <td className="px-3 py-2.5 text-gray-800">{totQty.toLocaleString("ar-EG")} طرد</td>
                          <td className="px-3 py-2.5 text-gray-700">{totWeight > 0 ? `${totWeight.toLocaleString("ar-EG")} كجم` : "—"}</td>
                          <td colSpan={2} />
                          <td className="px-3 py-2.5 bg-amber-50" />
                          <td className="px-3 py-2.5 text-amber-700 bg-amber-50">{totNaulage > 0 ? `${totNaulage.toLocaleString("ar-EG")} ج.م` : "—"}</td>
                          <td className="px-3 py-2.5 text-orange-600 bg-orange-50/30">{totOpening > 0 ? `${totOpening.toLocaleString("ar-EG")} ج.م` : "—"}</td>
                          <td className="px-3 py-2.5 text-blue-600 bg-blue-50/30">{totPreCool > 0 ? `${totPreCool.toLocaleString("ar-EG")} ج.م` : "—"}</td>
                          <td className="px-3 py-2.5 bg-gray-50">
                            {grand > 0 ? <span className="text-base font-bold text-gray-900">{grand.toLocaleString("ar-EG")} ج.م</span> : "—"}
                          </td>
                          <td />
                        </tr>
                      </tfoot>
                    );
                  })()}
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Fees summary cards */}
          {(() => {
            const totNaulage = rows.reduce((s, r) => s + (r.naulagePerUnit ?? 0) * (r.quantity ?? 0), 0);
            const totOpening = rows.reduce((s, r) => s + (r.openingFee ?? 0), 0);
            const totPreCool = rows.reduce((s, r) => s + (r.preCoolingFee ?? 0), 0);
            const grand      = totNaulage + totOpening + totPreCool;
            if (grand === 0) return null;
            return (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="rounded-xl p-3 bg-amber-50 border border-amber-200 text-center">
                  <p className="text-xs text-gray-500 mb-1">إجمالي النولون</p>
                  <p className="text-lg font-bold text-amber-700">{totNaulage.toLocaleString("ar-EG")} <span className="text-xs font-normal">ج.م</span></p>
                </div>
                {totOpening > 0 && (
                  <div className="rounded-xl p-3 bg-orange-50 border border-orange-200 text-center">
                    <p className="text-xs text-gray-500 mb-1">فتح عنبر</p>
                    <p className="text-lg font-bold text-orange-600">{totOpening.toLocaleString("ar-EG")} <span className="text-xs font-normal">ج.م</span></p>
                  </div>
                )}
                {totPreCool > 0 && (
                  <div className="rounded-xl p-3 bg-blue-50 border border-blue-200 text-center">
                    <p className="text-xs text-gray-500 mb-1">إعادة تبريد</p>
                    <p className="text-lg font-bold text-blue-600">{totPreCool.toLocaleString("ar-EG")} <span className="text-xs font-normal">ج.م</span></p>
                  </div>
                )}
                <div className="rounded-xl p-3 bg-gray-800 border border-gray-700 text-center">
                  <p className="text-xs text-gray-300 mb-1">إجمالي الرسوم</p>
                  <p className="text-xl font-bold text-white">{grand.toLocaleString("ar-EG")} <span className="text-xs font-normal">ج.م</span></p>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Right: QR card (collapsible) */}
        <Card className="border-0 shadow-sm h-fit">
          <button
            type="button"
            onClick={() => setQrCollapsed(c => !c)}
            className="w-full flex items-center justify-between gap-2 px-4 py-3 border-b text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <span className="flex items-center gap-2">
              <QrCode className="w-4 h-4" />
              <span className="text-sm font-semibold">رمز الحركة</span>
            </span>
            <ChevronDown className={cn("w-4 h-4 transition-transform", qrCollapsed ? "" : "rotate-180")} />
          </button>
          {!qrCollapsed && (
            <CardContent className="p-5 flex flex-col items-center text-center">
              <button
                type="button"
                onClick={() => setQrPopupRow(m)}
                title="افتح QR كبير للمسح"
                className="bg-white p-3 rounded-xl border border-gray-200 hover:border-blue-400 transition-colors"
              >
                <QRCodeSVG id="movement-qr-svg" value={deepLink} size={180} level="M" includeMargin={false} />
              </button>
              <p className="text-[11px] text-gray-500 mt-3 leading-relaxed">
                امسح الكود لفتح هذه الحركة على أي جهاز.
                <br />
                <span className="font-mono text-[10px] text-gray-400 break-all">{deepLink}</span>
              </p>
              <div className="flex flex-col gap-2 mt-4 w-full">
                <Button
                  size="sm"
                  onClick={() => printQrLabel(m)}
                  className="w-full gap-1.5 bg-green-600 hover:bg-green-700 text-white"
                >
                  <Tag className="w-4 h-4" />طباعة ملصق 5×5 سم
                </Button>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={copyLink} className="flex-1 gap-1.5">
                    نسخ الرابط
                  </Button>
                  <Button size="sm" variant="outline" onClick={downloadQr} className="flex-1 gap-1.5">
                    <Download className="w-4 h-4" />SVG
                  </Button>
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      </motion.div>

      <QrPopupDialog movement={qrPopupRow} onClose={() => setQrPopupRow(null)} />

      {/* ── WhatsApp Dialog ── */}
      {showWa && (() => {
        const date    = (m.movementDate ?? "").slice(0, 10);
        const customer = m.customerArName || m.customerName || "—";
        const warehouse = m.movementType === "Outgoing"
          ? (m.fromWarehouseName ?? "—")
          : (m.toWarehouseName || m.fromWarehouseName || "—");
        const totalNaulage = rows.reduce((s, r) => s + (r.naulagePerUnit ?? 0) * (r.quantity ?? 0), 0);
        const totalOpening = rows.reduce((s, r) => s + (r.openingFee ?? 0), 0);
        const totalPreCool = rows.reduce((s, r) => s + (r.preCoolingFee ?? 0), 0);
        const grand        = totalNaulage + totalOpening + totalPreCool;
        const itemLines    = rows.map((r, i) =>
          `  ${i + 1}. ${r.itemArName || r.itemName || "—"} — ${(r.quantity ?? 0).toLocaleString()} ${r.unit || "طرد"}${r.netWeightKg ? ` / ${r.netWeightKg.toLocaleString()} كجم` : ""}`
        ).join("\n");
        const msg = `${typeLabel === "وارد" ? "🟢" : typeLabel === "منصرف" ? "🔴" : "🟡"} *${typeLabel} — ${m.movementNumber}*
العميل: ${customer}
التاريخ: ${date}
الثلاجة: ${warehouse}${m.driverName ? `\nالسائق: ${m.driverName}${m.vehiclePlate ? ` / ${m.vehiclePlate}` : ""}` : ""}
الأصناف:
${itemLines}
إجمالي الكمية: ${totalQty.toLocaleString()} طرد${totalWeight > 0 ? ` / ${totalWeight.toLocaleString()} كجم` : ""}${grand > 0 ? `\nإجمالي الرسوم: ${grand.toLocaleString()} ج.م` : ""}`;

        return (
          <Dialog open onOpenChange={o => { if (!o) setShowWa(false); }}>
            <DialogContent dir="rtl" className="max-w-lg bg-white">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-green-600" />
                  إرسال عبر واتساب
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                {/* Message preview */}
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">الرسالة</label>
                  <pre className="bg-green-50 border border-green-200 rounded-xl p-3 text-xs text-gray-800 whitespace-pre-wrap leading-relaxed font-sans max-h-60 overflow-y-auto">{msg}</pre>
                </div>
                {/* Phone input */}
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">رقم الهاتف (اختياري)</label>
                  <input
                    type="tel"
                    dir="ltr"
                    value={waPhone}
                    onChange={e => setWaPhone(e.target.value)}
                    placeholder="01XXXXXXXXX أو اتركه فارغاً لاختيار المستلم في واتساب"
                    className="w-full h-9 rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400/30 focus:border-green-400"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">إذا تركت الرقم فارغاً ستفتح واتساب لتختار المستلم يدوياً</p>
                </div>
              </div>
              <DialogFooter className="gap-2">
                <Button
                  onClick={() => {
                    if (waPhone.trim()) {
                      sendWhatsApp(msg, waPhone.trim());
                    } else {
                      window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
                    }
                    setShowWa(false);
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white gap-1.5"
                >
                  <MessageCircle className="w-4 h-4" />فتح واتساب
                </Button>
                <Button variant="outline" onClick={() => setShowWa(false)}>إلغاء</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        );
      })()}
    </div>
  );
}


/* ══════════════════════════════════════════════
   INCOMING TAB
══════════════════════════════════════════════ */
const NAULAGE_UNITS = ["طرد", "شوال", "كارتونة", "صندوق", "برميل", "كيلو", "طن"] as const;
const DEFAULT_NAULAGE_UNIT = "طرد";

const AVATAR_GRADS = ["from-blue-400 to-blue-700","from-violet-400 to-violet-700","from-emerald-400 to-emerald-700","from-rose-400 to-rose-600","from-amber-400 to-orange-500","from-cyan-400 to-cyan-700","from-pink-400 to-pink-700","from-indigo-400 to-indigo-700"];
const custGrad = (name: string) => AVATAR_GRADS[(name?.charCodeAt(0) || 0) % AVATAR_GRADS.length];
const itemGrad = (storageType: string) =>
  storageType === "تجميد" ? "from-blue-400 to-blue-700" : storageType === "تبريد" ? "from-cyan-400 to-cyan-600" : "from-amber-400 to-orange-500";

function OptionAvatar({ imageUrl, initial, grad }: { imageUrl?: string | null; initial: string; grad: string }) {
  const src = resolveImageUrl(imageUrl);
  return (
    <span className={cn("inline-flex w-5 h-5 rounded-full flex-shrink-0 overflow-hidden items-center justify-center text-white text-[9px] font-bold bg-gradient-to-br", grad)}>
      {src ? <img src={src} className="w-full h-full object-cover" alt="" /> : initial.charAt(0).toUpperCase()}
    </span>
  );
}

function CustomerCombobox({
  value, onValueChange, customers, placeholder = "اختر العميل", className,
}: {
  value: string;
  onValueChange: (v: string) => void;
  customers: BackendCustomer[];
  placeholder?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const selected = customers.find(c => c.id === value);
  const filtered = search
    ? customers.filter(c =>
        (c.arName || c.name || "").toLowerCase().includes(search.toLowerCase()) ||
        (c.mobile || "").includes(search) ||
        (c.phone || "").includes(search)
      )
    : customers;
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          dir="rtl"
          className={cn(
            "flex w-full items-center justify-between gap-2 rounded-md border border-input bg-background px-3 py-2 h-9 text-sm shadow-sm hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-1 focus:ring-ring",
            className,
          )}
        >
          {selected ? (
            <div className="flex items-center gap-2 min-w-0">
              <OptionAvatar imageUrl={selected.imageUrl} initial={(selected.arName || selected.name || "?").charAt(0)} grad={custGrad(selected.arName || selected.name || "")} />
              <span className="truncate">{selected.arName || selected.name}</span>
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="w-4 h-4 opacity-50 flex-shrink-0" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start" dir="rtl">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="بحث بالاسم أو الهاتف..."
            value={search}
            onValueChange={setSearch}
            dir="rtl"
            className="h-9"
          />
          <CommandList>
            <CommandEmpty>لا توجد نتائج</CommandEmpty>
            <CommandGroup>
              {filtered.map(c => (
                <CommandItem
                  key={c.id}
                  value={c.id}
                  onSelect={() => { onValueChange(c.id); setSearch(""); setOpen(false); }}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <OptionAvatar imageUrl={c.imageUrl} initial={(c.arName || c.name || "?").charAt(0)} grad={custGrad(c.arName || c.name || "")} />
                  <div className="flex-1 min-w-0 text-right">
                    <p className="text-sm font-medium truncate">{c.arName || c.name}</p>
                    {(c.mobile || c.phone) && <p className="text-xs text-muted-foreground">{c.mobile || c.phone}</p>}
                  </div>
                  {c.id === value && <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

interface IncomingRow {
  id: number;
  backendId?: string;
  itemId: string; item: string;
  packageId: string; pkg: string;
  quantity: string;
  weight: string; productionDate: string; expiryDate: string;
  serial: string; chamberId: string; naulage: string; naulageUnit: string;
  weightPerUnit: string;
  temperature: string; damaged: string; preCooling: string;
  brandId: string; brandName: string;
}

interface GratuityDist {
  employeeId: string; name: string; selected: boolean; amount: string;
}

const emptyRow = (): IncomingRow => ({
  id: Date.now() + Math.floor(Math.random() * 1000),
  itemId: "", item: "", packageId: "", pkg: "",
  quantity: "", weight: "", productionDate: "", expiryDate: "",
  serial: "", chamberId: "", naulage: "", naulageUnit: DEFAULT_NAULAGE_UNIT,
  temperature: "", damaged: "0", preCooling: "",
  weightPerUnit: "",
  brandId: "", brandName: "",
});

function IncomingTab({
  editTarget = null,
  editSiblings = [],
  onDoneEditing,
  onSaveAndView,
}: {
  editTarget?: BackendMovement | null;
  editSiblings?: BackendMovement[];
  onDoneEditing?: () => void;
  onSaveAndView?: (id: string, waPhone?: string, waMsg?: string) => void;
} = {}) {
  const isEditing = !!editTarget;
  const originalSiblingIds = useMemo(
    () => (isEditing ? editSiblings.map(s => s.id) : []),
    [isEditing, editSiblings],
  );
  const [customerDriverOptions, setCustomerDriverOptions] = useState<BackendCustomerDriver[]>([]);
  const [customerNaulages, setCustomerNaulages] = useState<BackendCustomerNaulage[]>([]);
  const [customerPricing, setCustomerPricing] = useState<BackendCustomerPrice[]>([]);
  const [customers, setCustomers] = useState<BackendCustomer[]>([]);
  const [items, setItems] = useState<BackendItem[]>([]);
  const [packages, setPackages] = useState<BackendPackage[]>([]);
  const [warehouses, setWarehouses] = useState<BackendWarehouse[]>([]);
  const [chambers, setChambers] = useState<BackendChamber[]>([]);
  const [employees, setEmployees] = useState<BackendEmployee[]>([]);
  const [brandsCache, setBrandsCache] = useState<Record<string, BackendBrand[]>>({});

  const loadBrandsForItem = async (itemId: string) => {
    if (!itemId || brandsCache[itemId]) return;
    try {
      const brands = await getBrandsByItem(itemId);
      setBrandsCache(prev => ({ ...prev, [itemId]: brands }));
    } catch { /* silent */ }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [c, i, p, w, ch, eRes] = await Promise.all([
          getAllCustomers(1, 200),
          getAllItems(1, 200),
          getAllPackages(1, 200),
          getAllWarehouses(1, 100),
          getChambers(),
          getAllEmployees(1, 200),
        ]);
        if (cancelled) return;
        setCustomers(c.filter(x => x.isActive));
        setItems(i.filter(x => x.isActive));
        setPackages(p.filter(x => x.isActive));
        setWarehouses(w.filter(x => x.isActive));
        setChambers(ch.filter(x => x.isActive));
        setEmployees(eRes.items.filter(x => x.isActive));
      } catch (err: any) {
        if (!cancelled) toast.error(err?.message ?? "فشل تحميل البيانات");
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [selectedWarehouseId, setSelectedWarehouseId] = useState("");
  const [selectedWaPhone, setSelectedWaPhone] = useState("");
  const [temperature, setTemperature] = useState("");
  const [openingFee, setOpeningFee] = useState("");
  const [movementDate, setMovementDate] = useState(new Date().toISOString().split("T")[0]);
  const [driverName, setDriverName] = useState("");
  const [vehiclePlate, setVehiclePlate] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [rows, setRows] = useState<IncomingRow[]>([emptyRow()]);

  const [showGratuity, setShowGratuity] = useState(false);
  const [gratuityTotal, setGratuityTotal] = useState("");
  const [gratuityDist, setGratuityDist] = useState<GratuityDist[]>([]);
  useEffect(() => {
    setGratuityDist(employees.map(e => ({ employeeId: e.id, name: e.arName || e.fullName, selected: false, amount: "" })));
  }, [employees]);

  const randomInvoiceNo = useMemo(() => `INV-2024-${String(Math.floor(Math.random() * 900) + 100).padStart(3, "0")}`, []);
  const invoiceNo = editTarget?.movementNumber ?? randomInvoiceNo;

  /* ── Prefill all state from editTarget once auxiliary data has loaded ── */
  const [prefillDone, setPrefillDone] = useState(false);
  useEffect(() => {
    if (!isEditing || prefillDone) return;
    if (customers.length === 0 || items.length === 0 || warehouses.length === 0) return;
    const head = editTarget!;
    setSelectedCustomerId(head.customerId);
    setSelectedWarehouseId(head.toWarehouseId ?? "");
    setMovementDate((head.movementDate ?? "").slice(0, 10));
    setDriverName(head.driverName ?? "");
    setVehiclePlate(head.vehiclePlate ?? "");
    setNotes(head.notes ?? "");
    setOpeningFee(head.openingFee != null ? String(head.openingFee) : "");
    setSelectedWaPhone(head.customerName ? "" : "");
    const prefRows: IncomingRow[] = editSiblings.map(s => ({
      id: Date.now() + Math.floor(Math.random() * 100000),
      backendId: s.id,
      itemId: s.itemId,
      item: s.itemArName ?? s.itemName ?? "",
      packageId: s.packageId ?? "",
      pkg: s.packageName ?? "",
      quantity: String(s.quantity ?? ""),
      weight: s.netWeightKg != null ? String(s.netWeightKg) : "",
      productionDate: s.productionDate ? s.productionDate.slice(0, 10) : "",
      expiryDate: s.expiryDate ? s.expiryDate.slice(0, 10) : "",
      serial: s.referenceNumber ?? "",
      chamberId: s.toChamberId ?? "",
      naulage: s.naulagePerUnit != null ? String(s.naulagePerUnit) : "",
      naulageUnit: s.naulageUnit || DEFAULT_NAULAGE_UNIT,
      temperature: s.temperature != null ? String(s.temperature) : "",
      damaged: s.damagedQuantity != null ? String(s.damagedQuantity) : "0",
      preCooling: s.preCoolingFee != null ? String(s.preCoolingFee) : "",
      weightPerUnit: s.weightPerUnit != null ? String(s.weightPerUnit) : "",
      brandId: s.brandId ?? "",
      brandName: s.brandName ?? "",
    }));
    // Pre-load brands for all items in the edit batch
    const uniqueItemIds = [...new Set(editSiblings.map(s => s.itemId).filter(Boolean))];
    uniqueItemIds.forEach(id => { void loadBrandsForItem(id); });
    setRows(prefRows.length ? prefRows : [emptyRow()]);
    setPrefillDone(true);
  }, [isEditing, prefillDone, customers.length, items.length, warehouses.length, editTarget, editSiblings]);

  const addRow = () => setRows(r => [...r, emptyRow()]);
  const removeRow = (id: number) => { if (rows.length > 1) setRows(r => r.filter(x => x.id !== id)); };
  const updateRow = (id: number, patch: Partial<IncomingRow>) =>
    setRows(r => r.map(x => x.id === id ? { ...x, ...patch } : x));

  const warehouseChambers = useMemo(
    () => selectedWarehouseId ? chambers.filter(c => c.warehouseId === selectedWarehouseId) : [],
    [chambers, selectedWarehouseId],
  );

  const onWarehouseChange = (val: string) => {
    setSelectedWarehouseId(val);
    setRows(r => r.map(x => ({ ...x, chamberId: "" })));
  };

  const onCustomerChange = (val: string) => {
    setSelectedCustomerId(val);
    const cust = customers.find(c => c.id === val);
    setSelectedWaPhone(cust?.mobile || cust?.phone || "");
    setDriverName("");
    setVehiclePlate("");
  };

  useEffect(() => {
    if (!selectedCustomerId) {
      setCustomerDriverOptions([]);
      setCustomerNaulages([]);
      setCustomerPricing([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const [drv, nau, pri] = await Promise.all([
          getCustomerDrivers(selectedCustomerId),
          getCustomerNaulages(selectedCustomerId),
          getCustomerPrices(selectedCustomerId),
        ]);
        if (cancelled) return;
        setCustomerDriverOptions(drv.filter(d => d.isActive));
        setCustomerNaulages(nau.filter(n => n.isActive));
        setCustomerPricing(pri.filter(p => p.isActive));
      } catch {
        if (!cancelled) {
          setCustomerDriverOptions([]);
          setCustomerNaulages([]);
          setCustomerPricing([]);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [selectedCustomerId]);

  const onDriverChange = (driverId: string) => {
    const d = customerDriverOptions.find(x => String(x.id) === driverId);
    if (d) {
      setDriverName(d.name);
      setVehiclePlate(d.plate || "");
    }
  };

  const lookupCustomerNaulage = (itemId: string, itemName: string, preferredUnit?: string): { naulage: string; naulageUnit: string } | null => {
    if (!itemId && !itemName) return null;
    const matches = customerNaulages.filter(n =>
      (itemId && n.itemId && n.itemId === itemId) ||
      (itemName && n.itemName === itemName),
    );
    if (matches.length === 0) return null;
    if (preferredUnit) {
      const exact = matches.find(n => n.naulageUnit === preferredUnit);
      return exact ? { naulage: String(exact.naulage), naulageUnit: exact.naulageUnit } : null;
    }
    const m = matches[0];
    return { naulage: String(m.naulage), naulageUnit: m.naulageUnit || DEFAULT_NAULAGE_UNIT };
  };

  const findPackageByUnit = (unitName: string) =>
    packages.find(p => (p.arName || p.name || p.packageType) === unitName);

  const customerPhoneOptions = useMemo(() => {
    if (!selectedCustomerId) return [];
    const cust = customers.find(c => c.id === selectedCustomerId);
    const opts: { label: string; phone: string }[] = [];
    if (cust?.mobile) opts.push({ label: `${cust.arName || cust.name} (موبايل)`, phone: cust.mobile });
    if (cust?.phone && cust.phone !== cust.mobile) opts.push({ label: `${cust.arName || cust.name} (هاتف)`, phone: cust.phone });
    return opts;
  }, [selectedCustomerId, customers]);

  const totalQty = rows.reduce((s, r) => s + (Number(r.quantity) || 0), 0);
  const totalWeight = rows.reduce((s, r) => s + (Number(r.weight) || 0), 0);
  const totalNaulage = rows.reduce((s, r) => s + (Number(r.naulage) || 0) * (Number(r.quantity) || 0), 0);
  const totalPreCooling = rows.reduce((s, r) => s + (Number(r.preCooling) || 0), 0);

  const handleSave = async () => {
    if (!selectedCustomerId) { toast.error("اختر العميل"); return; }
    if (!selectedWarehouseId) { toast.error("اختر الثلاجة المستلم"); return; }
    const validRows = rows.filter(r => r.itemId && Number(r.quantity) > 0);
    if (validRows.length === 0) { toast.error("أضف صنف واحد على الأقل بكمية صحيحة"); return; }

    setSaving(true);
    try {
      const isoDate = new Date(movementDate).toISOString();

      if (isEditing) {
        const keptIds = new Set(validRows.filter(r => r.backendId).map(r => r.backendId!));
        const removedIds = originalSiblingIds.filter(id => !keptIds.has(id));

        // 1) Deactivate rows the user removed
        await Promise.all(removedIds.map(id => deactivateMovement(id)));

        // 2) Update existing rows in place
        await Promise.all(validRows.filter(r => r.backendId).map(r =>
          editMovement({
            id: r.backendId!,
            movementNumber: invoiceNo,
            movementType: "Incoming",
            movementDate: isoDate,
            customerId: selectedCustomerId,
            itemId: r.itemId,
            packageId: r.packageId || undefined,
            toWarehouseId: selectedWarehouseId,
            toChamberId: r.chamberId || undefined,
            quantity: Number(r.quantity),
            netWeightKg: Number(r.weight) || undefined,
            unit: "طرد",
            driverName: driverName || undefined,
            vehiclePlate: vehiclePlate || undefined,
            referenceNumber: r.serial || undefined,
            notes: notes || undefined,
            productionDate: r.productionDate || undefined,
            expiryDate: r.expiryDate || undefined,
            naulagePerUnit: r.naulage ? Number(r.naulage) : undefined,
            naulageUnit: r.naulageUnit || undefined,
            openingFee: openingFee ? Number(openingFee) : undefined,
            temperature: r.temperature ? Number(r.temperature) : undefined,
            damagedQuantity: r.damaged ? Number(r.damaged) : undefined,
            brandId: r.brandId || undefined,
            brandName: r.brandName || undefined,
            preCoolingFee: r.preCooling ? Number(r.preCooling) : undefined,
            weightPerUnit: r.weightPerUnit ? Number(r.weightPerUnit) : undefined,
            isActive: true,
          })
        ));

        // 3) Add brand-new rows under the same invoice
        await Promise.all(validRows.filter(r => !r.backendId).map(r =>
          addMovement({
            movementNumber: invoiceNo,
            movementType: "Incoming",
            movementDate: isoDate,
            customerId: selectedCustomerId,
            itemId: r.itemId,
            packageId: r.packageId || undefined,
            toWarehouseId: selectedWarehouseId,
            toChamberId: r.chamberId || undefined,
            quantity: Number(r.quantity),
            netWeightKg: Number(r.weight) || undefined,
            unit: "طرد",
            driverName: driverName || undefined,
            vehiclePlate: vehiclePlate || undefined,
            referenceNumber: r.serial || undefined,
            notes: notes || undefined,
            productionDate: r.productionDate || undefined,
            expiryDate: r.expiryDate || undefined,
            naulagePerUnit: r.naulage ? Number(r.naulage) : undefined,
            naulageUnit: r.naulageUnit || undefined,
            openingFee: openingFee ? Number(openingFee) : undefined,
            temperature: r.temperature ? Number(r.temperature) : undefined,
            damagedQuantity: r.damaged ? Number(r.damaged) : undefined,
            brandId: r.brandId || undefined,
            brandName: r.brandName || undefined,
            preCoolingFee: r.preCooling ? Number(r.preCooling) : undefined,
            weightPerUnit: r.weightPerUnit ? Number(r.weightPerUnit) : undefined,
          })
        ));

        toast.success(`تم تحديث الحركة ${invoiceNo}`);
        onDoneEditing?.();
        return;
      }

      // ── Create flow ──
      let savedCount = 0;
      const savedMovements: BackendMovement[] = [];
      for (const r of validRows) {
        const num = `${invoiceNo}-${++savedCount}`;
        const result = await addMovement({
          movementNumber: num,
          movementType: "Incoming",
          movementDate: isoDate,
          customerId: selectedCustomerId,
          itemId: r.itemId,
          packageId: r.packageId || undefined,
          toWarehouseId: selectedWarehouseId,
          toChamberId: r.chamberId || undefined,
          quantity: Number(r.quantity),
          netWeightKg: Number(r.weight) || undefined,
          unit: "طرد",
          driverName: driverName || undefined,
          vehiclePlate: vehiclePlate || undefined,
          referenceNumber: r.serial || undefined,
          notes: notes || undefined,
          productionDate: r.productionDate || undefined,
          expiryDate: r.expiryDate || undefined,
          naulagePerUnit: r.naulage ? Number(r.naulage) : undefined,
          naulageUnit: r.naulageUnit || undefined,
          openingFee: openingFee ? Number(openingFee) : undefined,
          temperature: r.temperature ? Number(r.temperature) : undefined,
          damagedQuantity: r.damaged ? Number(r.damaged) : undefined,
          brandId: r.brandId || undefined,
          brandName: r.brandName || undefined,
          preCoolingFee: r.preCooling ? Number(r.preCooling) : undefined,
          weightPerUnit: r.weightPerUnit ? Number(r.weightPerUnit) : undefined,
        });
        savedMovements.push(result);
      }
      const custObj = customers.find(c => c.id === selectedCustomerId);
      const whObj   = warehouses.find(w => w.id === selectedWarehouseId);
      const printRows = savedMovements.map((s, i) => ({
        ...s,
        customerArName: s.customerArName || custObj?.arName || custObj?.name || "",
        customerName:   s.customerName   || custObj?.name  || "",
        toWarehouseName: s.toWarehouseName || whObj?.arName || whObj?.name || "",
        itemArName:  s.itemArName  || validRows[i]?.item || "",
        packageName: s.packageName || validRows[i]?.pkg  || "",
      }));
      const customerName = custObj?.arName || custObj?.name || "عميل";
      const msg = `🟢 *وارد جديد*\nرقم الفاتورة: ${invoiceNo}\nالعميل: ${customerName}\nالكمية: ${totalQty.toLocaleString()} طرد\nالوزن: ${totalWeight.toLocaleString()} كجم\nدرجة الحرارة: ${temperature || "—"} °م\nالنولون: ${totalNaulage.toLocaleString()} ج.م\nالتاريخ: ${new Date().toLocaleDateString("ar-EG")}`;
      toast.success(`تم حفظ ${savedCount} حركة وارد للفاتورة ${invoiceNo}`);
      setRows([emptyRow()]);
      onSaveAndView?.(savedMovements[0].id, selectedWaPhone || undefined, selectedWaPhone ? msg : undefined);
    } catch (err: any) {
      toast.error(err?.message ?? "فشل حفظ الحركات");
    } finally {
      setSaving(false);
    }
  };

  const handleGratuitySave = () => {
    const selected = gratuityDist.filter(d => d.selected);
    if (!gratuityTotal || selected.length === 0) { toast.error("حدد المبلغ والموظفين"); return; }
    toast.success(`تم توزيع إكرامية ${Number(gratuityTotal).toLocaleString()} ج.م على ${selected.length} موظف`);
    setShowGratuity(false);
    setGratuityTotal("");
    setGratuityDist(d => d.map(x => ({ ...x, selected: false, amount: "" })));
  };

  const splitEqually = () => {
    const sel = gratuityDist.filter(d => d.selected);
    if (!gratuityTotal || sel.length === 0) return;
    const share = (Number(gratuityTotal) / sel.length).toFixed(2);
    setGratuityDist(d => d.map(x => x.selected ? { ...x, amount: share } : x));
  };

  const { confirmDelete, dialog: confirmDialog } = useConfirmDelete();

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
      {/* Header */}
      <motion.div variants={anim}>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>العميل *</Label>
                <CustomerCombobox value={selectedCustomerId} onValueChange={onCustomerChange} customers={customers} />
                {selectedCustomerId && (
                  <div className="mt-1 space-y-0.5">
                    <Label className="text-[11px] text-gray-400 flex items-center gap-1"><MessageCircle className="w-3 h-3 text-green-500" />إرسال واتساب إلى</Label>
                    <Select value={selectedWaPhone} onValueChange={setSelectedWaPhone}>
                      <SelectTrigger dir="rtl" className="h-8 text-xs border-green-200 bg-green-50/40">
                        <SelectValue placeholder="اختر رقم الإرسال" />
                      </SelectTrigger>
                      <SelectContent dir="rtl">
                        {customerPhoneOptions.map(o => (
                          <SelectItem key={o.phone} value={o.phone} className="text-xs">
                            {o.label} — {o.phone}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>التاريخ *</Label>
                <Input type="date" dir="rtl" value={movementDate} onChange={e => setMovementDate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>السائق</Label>
                {customerDriverOptions.length > 0 ? (
                  <Select
                    value={customerDriverOptions.find(d => d.name === driverName) ? String(customerDriverOptions.find(d => d.name === driverName)!.id) : ""}
                    onValueChange={onDriverChange}
                  >
                    <SelectTrigger dir="rtl">
                      <SelectValue placeholder="اختر السائق" />
                    </SelectTrigger>
                    <SelectContent dir="rtl">
                      {customerDriverOptions.map(d => (
                        <SelectItem key={d.id} value={String(d.id)}>
                          {d.name} — {d.plate || "بدون لوحة"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    placeholder={selectedCustomerId ? "لا يوجد سائقون لهذا العميل — اكتب الاسم" : "اختر العميل أولاً"}
                    dir="rtl"
                    value={driverName}
                    onChange={e => setDriverName(e.target.value)}
                  />
                )}
              </div>
              <div className="space-y-1.5">
                <Label>رقم السيارة</Label>
                <Input placeholder="أ ب ج 1234" dir="rtl" value={vehiclePlate} onChange={e => setVehiclePlate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>الثلاجة المستلم *</Label>
                <Select value={selectedWarehouseId} onValueChange={onWarehouseChange}>
                  <SelectTrigger dir="rtl"><SelectValue placeholder="اختر الثلاجة" /></SelectTrigger>
                  <SelectContent dir="rtl">{warehouses.map(w => <SelectItem key={w.id} value={w.id}>{w.arName || w.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="col-span-2 md:col-span-3 space-y-1.5">
                <Label>ملاحظات</Label>
                <Textarea placeholder="ملاحظات إضافية..." dir="rtl" className="resize-none h-9 py-1" rows={1} value={notes} onChange={e => setNotes(e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Items table */}
      <motion.div variants={anim}>
        <Card className="border-0 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b bg-gray-50 flex items-center justify-between">
            <h3 className="font-semibold text-gray-800">الأصناف الواردة</h3>
            <span className="text-xs text-gray-500">{rows.length} صنف</span>
          </div>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[1050px]">
                <thead>
                  <tr className="bg-green-50 border-b border-green-100">
                    {["#","الصنف","الماركة","العبوة","الكمية","وزن الوحدة","الوزن (كجم)","تاريخ الإنتاج","تاريخ الانتهاء","رقم الرسالة","العوارية","اعادة تبريد","مربع التبريد/المربع","درجة الحرارة (°م)","النولون (ج.م + الوحدة)",""].map((h,i) => (
                      <th key={i} className={cn("text-right px-3 py-2.5 text-xs font-medium text-green-800", i===9?"bg-amber-50 text-amber-800":"")}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, idx) => (
                    <motion.tr key={row.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="border-b hover:bg-gray-50/30 transition-colors">
                      <td className="px-3 py-2 text-gray-500 text-xs">{idx + 1}</td>
                      <td className="px-2 py-1.5">
                        <Select value={row.itemId} onValueChange={v => {
                          const it = items.find(i => i.id === v);
                          const itName = it?.arName || it?.name || "";
                          const n = lookupCustomerNaulage(v, itName);
                          if (n) {
                            const pkg = findPackageByUnit(n.naulageUnit);
                            updateRow(row.id, {
                              itemId: v,
                              item: itName,
                              naulage: n.naulage,
                              naulageUnit: n.naulageUnit,
                              brandId: "", brandName: "",
                              ...(pkg ? { packageId: pkg.id, pkg: pkg.arName || pkg.name || pkg.packageType || n.naulageUnit } : {}),
                            });
                          } else {
                            updateRow(row.id, { itemId: v, item: itName, naulage: "", naulageUnit: DEFAULT_NAULAGE_UNIT, brandId: "", brandName: "" });
                          }
                          void loadBrandsForItem(v);
                        }}>
                          <SelectTrigger className="h-8 text-xs" dir="rtl"><SelectValue placeholder="اختر الصنف" /></SelectTrigger>
                          <SelectContent dir="rtl">{items.map(i => (
                            <SelectItem key={i.id} value={i.id}>
                              <div className="flex items-center gap-2">
                                <OptionAvatar imageUrl={i.imageUrl} initial={i.prefix || (i.arName || i.name || "?").charAt(0)} grad={itemGrad(i.storageType)} />
                                {i.arName || i.name}
                              </div>
                            </SelectItem>
                          ))}</SelectContent>
                        </Select>
                      </td>
                      {/* Brand cell */}
                      <td className="px-2 py-1.5">
                        <Select
                          value={row.brandId}
                          onValueChange={v => {
                            const br = (brandsCache[row.itemId] || []).find(b => b.id === v);
                            updateRow(row.id, { brandId: v, brandName: br?.name ?? "" });
                          }}
                          disabled={!row.itemId || !(brandsCache[row.itemId]?.length)}
                        >
                          <SelectTrigger className="h-8 text-xs w-28" dir="rtl">
                            <SelectValue placeholder={!row.itemId ? "اختر الصنف" : !(brandsCache[row.itemId]?.length) ? "لا توجد ماركات" : "الماركة"} />
                          </SelectTrigger>
                          <SelectContent dir="rtl">
                            {(brandsCache[row.itemId] || []).map(b => (
                              <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-2 py-1.5">
                        <Select value={row.packageId} onValueChange={v => {
                          const p = packages.find(x => x.id === v);
                          const pkgName = p?.arName || p?.name || p?.packageType || "";
                          const lookup = lookupCustomerNaulage(row.itemId, row.item, pkgName);
                          updateRow(row.id, {
                            packageId: v,
                            pkg: pkgName,
                            naulageUnit: pkgName || row.naulageUnit,
                            naulage: lookup ? lookup.naulage : "",
                          });
                        }}>
                          <SelectTrigger className="h-8 text-xs" dir="rtl"><SelectValue placeholder="العبوة" /></SelectTrigger>
                          <SelectContent dir="rtl">{packages.map(p => (
                            <SelectItem key={p.id} value={p.id}>
                              <div className="flex items-center gap-2">
                                <OptionAvatar imageUrl={p.imageUrl} initial={(p.arName || p.name || p.packageType || "?").charAt(0)} grad="from-orange-400 to-orange-600" />
                                {p.arName || p.name || p.packageType}
                              </div>
                            </SelectItem>
                          ))}</SelectContent>
                        </Select>
                      </td>
                      {/* الكمية — when changed, recalculate total weight from unit weight */}
                      <td className="px-2 py-1.5">
                        <Input className="h-8 text-xs w-20" type="number" placeholder="0" dir="rtl" value={row.quantity}
                          onChange={e => {
                            const qty = e.target.value;
                            const patch: Partial<IncomingRow> = { quantity: qty };
                            if (row.weightPerUnit && Number(qty) > 0)
                              patch.weight = String((Number(row.weightPerUnit) * Number(qty)).toFixed(3));
                            updateRow(row.id, patch);
                          }} />
                      </td>
                      {/* وزن الوحدة — enter unit weight → auto total; or derive from total */}
                      <td className="px-2 py-1.5">
                        <div className="flex items-center gap-0.5">
                          <Input className="h-8 text-xs w-20" type="number" placeholder="وزن/وحدة" dir="rtl" value={row.weightPerUnit}
                            onChange={e => {
                              const wu = e.target.value;
                              const patch: Partial<IncomingRow> = { weightPerUnit: wu };
                              if (wu && Number(row.quantity) > 0)
                                patch.weight = String((Number(wu) * Number(row.quantity)).toFixed(3));
                              updateRow(row.id, patch);
                            }} />
                        </div>
                      </td>
                      {/* الوزن الإجمالي — enter total → auto derive unit weight */}
                      <td className="px-2 py-1.5">
                        <Input className="h-8 text-xs w-24" type="number" placeholder="إجمالي" dir="rtl" value={row.weight}
                          onChange={e => {
                            const w = e.target.value;
                            const patch: Partial<IncomingRow> = { weight: w };
                            if (w && Number(row.quantity) > 0)
                              patch.weightPerUnit = String((Number(w) / Number(row.quantity)).toFixed(4));
                            updateRow(row.id, patch);
                          }} />
                      </td>
                      <td className="px-2 py-1.5"><Input className="h-8 text-xs" type="date" value={row.productionDate} onChange={e => updateRow(row.id, { productionDate: e.target.value })} /></td>
                      <td className="px-2 py-1.5"><Input className="h-8 text-xs" type="date" value={row.expiryDate} onChange={e => updateRow(row.id, { expiryDate: e.target.value })} /></td>
                      <td className="px-2 py-1.5"><Input className="h-8 text-xs w-28" placeholder="SN-XXXXX" dir="rtl" value={row.serial} onChange={e => updateRow(row.id, { serial: e.target.value })} /></td>
                      <td className="px-2 py-1.5"><Input className="h-8 text-xs w-20" type="number" placeholder="0" dir="rtl" value={row.damaged} onChange={e => updateRow(row.id, { damaged: e.target.value })} /></td>
                      <td className="px-2 py-1.5">
                        <div className="flex items-center gap-1">
                          <Input className="h-8 text-xs w-20" type="number" placeholder="0" dir="rtl" value={row.preCooling} onChange={e => updateRow(row.id, { preCooling: e.target.value })} />
                          <span className="text-xs text-blue-500 whitespace-nowrap">ج.م</span>
                        </div>
                      </td>
                      <td className="px-2 py-1.5">
                        <Select
                          value={row.chamberId}
                          onValueChange={v => updateRow(row.id, { chamberId: v })}
                          disabled={!selectedWarehouseId}
                        >
                          <SelectTrigger className="h-8 text-xs w-32" dir="rtl">
                            <SelectValue placeholder={selectedWarehouseId ? "اختر مربع التبريد" : "اختر الثلاجة أولاً"} />
                          </SelectTrigger>
                          <SelectContent dir="rtl">
                            {warehouseChambers.length === 0 ? (
                              <div className="px-2 py-1.5 text-xs text-gray-400">لا توجد مربعات تبريد</div>
                            ) : (
                              warehouseChambers.map(c => (
                                <SelectItem key={c.id} value={c.id}>
                                  {c.code}{c.arName ? ` — ${c.arName}` : ""}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-2 py-1.5">
                        {(() => {
                          const itm = items.find(i => i.id === row.itemId);
                          const t = row.temperature !== "" ? Number(row.temperature) : null;
                          const outOfRange = t !== null && itm && (
                            (itm.temperatureMin != null && t < itm.temperatureMin) ||
                            (itm.temperatureMax != null && t > itm.temperatureMax)
                          );
                          return (
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1">
                                <Input
                                  className={cn("h-8 text-xs w-20", outOfRange && "border-red-400 bg-red-50 text-red-700 focus:ring-red-300")}
                                  type="number" placeholder="-18" dir="rtl"
                                  value={row.temperature}
                                  onChange={e => {
                                    const val = e.target.value;
                                    updateRow(row.id, { temperature: val });
                                    if (!itm || val === "") return;
                                    const tv = Number(val);
                                    const out = (itm.temperatureMin != null && tv < itm.temperatureMin) ||
                                                (itm.temperatureMax != null && tv > itm.temperatureMax);
                                    if (out) {
                                      const range = `${itm.temperatureMin ?? "—"}°م ~ ${itm.temperatureMax ?? "—"}°م`;
                                      toast.warning(`درجة الحرارة (${val}°م) خارج النطاق المطلوب للصنف: ${range} — قد تحتاج لرسوم إعادة تبريد`, { duration: 4000 });
                                    }
                                  }}
                                />
                                <span className="text-xs text-gray-400">°م</span>
                              </div>
                              {outOfRange && itm && (
                                <p className="text-[10px] text-red-600 flex items-center gap-0.5 whitespace-nowrap">
                                  <AlertCircle className="w-2.5 h-2.5 flex-shrink-0" />
                                  {itm.temperatureMin ?? "—"}~{itm.temperatureMax ?? "—"}°م
                                </p>
                              )}
                              {!outOfRange && itm && (itm.temperatureMin != null || itm.temperatureMax != null) && (
                                <p className="text-[10px] text-gray-400 whitespace-nowrap">
                                  {itm.temperatureMin ?? "—"}~{itm.temperatureMax ?? "—"}°م
                                </p>
                              )}
                            </div>
                          );
                        })()}
                      </td>
                      <td className="px-2 py-1.5 bg-amber-50/50">
                        <div className="flex items-center gap-1">
                          <Input className="h-8 text-xs w-20 border-amber-200 bg-amber-50" type="number" placeholder="0" dir="rtl" value={row.naulage} onChange={e => updateRow(row.id, { naulage: e.target.value })} />
                          <Select value={row.naulageUnit} onValueChange={v => updateRow(row.id, { naulageUnit: v })}>
                            <SelectTrigger className="h-8 text-xs w-20 border-amber-200 bg-amber-50" dir="rtl"><SelectValue /></SelectTrigger>
                            <SelectContent dir="rtl">
                              {Array.from(new Set([...NAULAGE_UNITS, row.naulageUnit].filter(Boolean))).map(u => (
                                <SelectItem key={u} value={u}>{u}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {row.naulage && <span className="text-xs text-amber-600">=&nbsp;{((Number(row.naulage)||0)*(Number(row.quantity)||0)).toLocaleString()}</span>}
                        </div>
                      </td>
                      <td className="px-2 py-1.5">
                        <button onClick={() => confirmDelete(row.item || `السطر ${idx+1}`, () => removeRow(row.id), { title: "حذف السطر", description: "هل تريد حذف هذا السطر من الفاتورة؟" })} className="p-1 text-red-400 hover:bg-red-50 rounded">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 border-t">
              <button onClick={addRow} className="flex items-center gap-1.5 text-green-600 hover:text-green-700 text-sm font-medium hover:bg-green-50 px-3 py-1.5 rounded">
                <Plus className="w-4 h-4" />إضافة صنف
              </button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Footer */}
      <motion.div variants={anim}>
        <Card className="border-0 shadow-sm bg-green-50 border border-green-100">
          <CardContent className="p-4 space-y-3">
            {/* Totals row */}
            <div className="flex items-center gap-8 flex-wrap">
              <div><p className="text-xs text-gray-500">إجمالي الطرود</p><p className="text-2xl font-bold text-green-700">{totalQty.toLocaleString()}</p></div>
              <div><p className="text-xs text-gray-500">إجمالي الوزن</p><p className="text-2xl font-bold text-green-700">{totalWeight.toLocaleString()} كجم</p></div>
              <div><p className="text-xs text-gray-500">إجمالي النولون</p><p className="text-2xl font-bold text-amber-600">{totalNaulage.toLocaleString()} ج.م</p></div>
              {totalPreCooling > 0 && (
                <div><p className="text-xs text-gray-500">إجمالي اعادة التبريد</p><p className="text-2xl font-bold text-blue-600">{totalPreCooling.toLocaleString()} ج.م</p></div>
              )}
              <StorageCostStat
                rows={rows.map(r => ({ itemId: r.itemId, itemName: r.item, quantity: Number(r.quantity) || 0 }))}
                pricing={customerPricing}
                accentClass="text-emerald-700"
              />
            </div>
            {/* Extra fees + actions */}
            <div className="flex items-center justify-between flex-wrap gap-3 pt-2 border-t border-green-200">
              <div className="flex items-center gap-3 flex-wrap">
                {/* فتح مربع تبريد */}
                <div className="flex items-center gap-2 bg-white border border-green-200 rounded-lg px-3 py-1.5">
                  <DoorOpen className="w-4 h-4 text-green-600" />
                  <Label className="text-xs text-gray-600 whitespace-nowrap">فتح مربع تبريد (إيراد):</Label>
                  <Input type="number" placeholder="0" dir="rtl" value={openingFee} onChange={e => setOpeningFee(e.target.value)} className="h-7 text-xs w-24 border-0 bg-transparent p-0 focus-visible:ring-0" />
                  <span className="text-xs text-gray-500">ج.م</span>
                </div>
                {/* إكرامية button */}
                <Button variant="outline" size="sm" onClick={() => setShowGratuity(true)} className="border-purple-400 text-purple-700 hover:bg-purple-50 gap-1.5">
                  <Gift className="w-4 h-4" />إكرامية
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={handleSave} disabled={saving} className="bg-green-600 hover:bg-green-700 text-white gap-2">
                  <Save className="w-4 h-4" />{saving ? "جاري الحفظ..." : "حفظ + واتساب"}<MessageCircle className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
      {confirmDialog}

      {/* Gratuity Dialog */}
      <Dialog open={showGratuity} onOpenChange={setShowGratuity}>
        <DialogContent dir="rtl" className="max-w-lg bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Gift className="w-5 h-5 text-purple-600" />توزيع إكرامية على الموظفين</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-3">
              <div className="flex-1 space-y-1.5">
                <Label>إجمالي الإكرامية (ج.م)</Label>
                <Input type="number" placeholder="0" dir="rtl" value={gratuityTotal} onChange={e => setGratuityTotal(e.target.value)} className="border border-[#d1d5dc] bg-[#f9fafb]" />
              </div>
              <Button size="sm" variant="outline" onClick={splitEqually} className="mt-6 whitespace-nowrap">توزيع متساوي</Button>
            </div>
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-purple-50 px-3 py-2 border-b">
                <p className="text-xs font-medium text-purple-800">اختر الموظفين وحدد نصيب كل واحد</p>
              </div>
              <div className="divide-y max-h-56 overflow-y-auto">
                {gratuityDist.map((d, i) => (
                  <div key={d.employeeId} className="flex items-center gap-3 px-3 py-2.5">
                    <Checkbox
                      checked={d.selected}
                      onCheckedChange={checked => setGratuityDist(prev => prev.map((x, j) => j===i ? {...x, selected: !!checked} : x))}
                    />
                    <span className="flex-1 text-sm font-medium text-gray-700">{d.name}</span>
                    <div className="flex items-center gap-1">
                      <Input
                        type="number" placeholder="0" dir="rtl"
                        value={d.amount}
                        onChange={e => setGratuityDist(prev => prev.map((x,j) => j===i ? {...x, amount: e.target.value} : x))}
                        disabled={!d.selected}
                        className="h-7 w-24 text-xs border border-[#d1d5dc] bg-[#f9fafb] disabled:opacity-40"
                      />
                      <span className="text-xs text-gray-500">ج.م</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {gratuityTotal && gratuityDist.filter(d=>d.selected).length > 0 && (
              <div className="flex items-center justify-between bg-purple-50 rounded-lg px-3 py-2 text-sm">
                <span className="text-gray-600">موزع على {gratuityDist.filter(d=>d.selected).length} موظفين</span>
                <span className="font-semibold text-purple-700">
                  متبقي: {(Number(gratuityTotal) - gratuityDist.reduce((s,d)=>s+(Number(d.amount)||0),0)).toLocaleString()} ج.م
                </span>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2 mt-2">
            <Button onClick={handleGratuitySave} className="bg-[#155dfc] hover:bg-blue-700 text-white">حفظ وإضافة للمستحقات</Button>
            <Button variant="outline" onClick={() => setShowGratuity(false)}>إلغاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════
   OUTGOING TAB
══════════════════════════════════════════════ */
interface OutgoingRow {
  id: number;
  backendId?: string;
  incomingMovementNumber: string;
  incomingMovementDate: string;
  itemId: string; item: string;
  packageId: string; pkg: string;
  requestedQty: string;
  availableQty: number; availableUnit: string;
  serial: string; damaged: string; chamber: string; naulage: string; naulageUnit: string;
}

const emptyOutRow = (): OutgoingRow => ({
  id: Date.now() + Math.floor(Math.random() * 1000),
  incomingMovementNumber: "", incomingMovementDate: "",
  itemId: "", item: "", packageId: "", pkg: "",
  requestedQty: "", availableQty: 0, availableUnit: "",
  serial: "", damaged: "0", chamber: "", naulage: "", naulageUnit: DEFAULT_NAULAGE_UNIT,
});

const daysBetween = (startISO: string, endISO: string): number => {
  if (!startISO || !endISO) return 0;
  const s = new Date(startISO).getTime();
  const e = new Date(endISO).getTime();
  if (isNaN(s) || isNaN(e)) return 0;
  return Math.max(0, Math.ceil((e - s) / 86400000));
};

function OutgoingTab({
  editTarget = null,
  editSiblings = [],
  onDoneEditing,
  onSaveAndView,
}: {
  editTarget?: BackendMovement | null;
  editSiblings?: BackendMovement[];
  onDoneEditing?: () => void;
  onSaveAndView?: (id: string, waPhone?: string, waMsg?: string) => void;
} = {}) {
  const isEditing = !!editTarget;
  const originalSiblingIds = useMemo(
    () => (isEditing ? editSiblings.map(s => s.id) : []),
    [isEditing, editSiblings],
  );
  const [customerDriverOptions, setCustomerDriverOptions] = useState<BackendCustomerDriver[]>([]);
  const [customerNaulages, setCustomerNaulages] = useState<BackendCustomerNaulage[]>([]);
  const [customerPricing, setCustomerPricing] = useState<BackendCustomerPrice[]>([]);
  const [customerIncomingMovements, setCustomerIncomingMovements] = useState<BackendMovement[]>([]);
  const [customers, setCustomers] = useState<BackendCustomer[]>([]);
  const [items, setItems] = useState<BackendItem[]>([]);
  const [packages, setPackages] = useState<BackendPackage[]>([]);
  const [warehouses, setWarehouses] = useState<BackendWarehouse[]>([]);
  const [chambers, setChambers] = useState<BackendChamber[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [c, i, p, w, ch] = await Promise.all([
          getAllCustomers(1, 200),
          getAllItems(1, 200),
          getAllPackages(1, 200),
          getAllWarehouses(1, 100),
          getChambers(),
        ]);
        if (cancelled) return;
        setCustomers(c.filter(x => x.isActive));
        setItems(i.filter(x => x.isActive));
        setPackages(p.filter(x => x.isActive));
        setWarehouses(w.filter(x => x.isActive));
        setChambers(ch.filter(x => x.isActive));
      } catch (err: any) {
        if (!cancelled) toast.error(err?.message ?? "فشل تحميل البيانات");
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [selectedWarehouseId, setSelectedWarehouseId] = useState("");
  const [selectedWaPhone, setSelectedWaPhone] = useState("");
  const [selectedDriver, setSelectedDriver] = useState("");
  const [vehiclePlate, setVehiclePlate] = useState("");
  const [movementDate, setMovementDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [temperature, setTemperature] = useState("");
  const [openingFee, setOpeningFee] = useState("");
  const [saving, setSaving] = useState(false);
  const [rows, setRows] = useState<OutgoingRow[]>([emptyOutRow()]);
  const [showTips, setShowTips] = useState(false);
  const [tipsAmount, setTipsAmount] = useState("");
  const [tipsNote, setTipsNote] = useState("");
  const randomInvoiceNo = useMemo(() => `OUT-2024-${String(Math.floor(Math.random() * 900) + 100).padStart(3, "0")}`, []);
  const invoiceNo = editTarget?.movementNumber ?? randomInvoiceNo;

  /* ── Prefill all state from editTarget once auxiliary data has loaded ── */
  const [prefillDone, setPrefillDone] = useState(false);
  useEffect(() => {
    if (!isEditing || prefillDone) return;
    if (customers.length === 0 || items.length === 0 || warehouses.length === 0) return;
    const head = editTarget!;
    setSelectedCustomerId(head.customerId);
    setSelectedWarehouseId(head.fromWarehouseId ?? "");
    setMovementDate((head.movementDate ?? "").slice(0, 10));
    setSelectedDriver(head.driverName ?? "");
    setVehiclePlate(head.vehiclePlate ?? "");
    setNotes(head.notes ?? "");
    setOpeningFee(head.openingFee != null ? String(head.openingFee) : "");
    const prefRows: OutgoingRow[] = editSiblings.map(s => ({
      id: Date.now() + Math.floor(Math.random() * 100000),
      backendId: s.id,
      incomingMovementNumber: s.sourceMovementNumber ?? "",
      incomingMovementDate: "",
      itemId: s.itemId,
      item: s.itemArName ?? s.itemName ?? "",
      packageId: s.packageId ?? "",
      pkg: s.packageName ?? "",
      requestedQty: String(s.quantity ?? ""),
      availableQty: 0,
      availableUnit: s.unit ?? "",
      serial: s.referenceNumber ?? "",
      damaged: "0",
      chamber: s.fromChamberId ?? "",
      naulage: s.naulagePerUnit != null ? String(s.naulagePerUnit) : "",
      naulageUnit: s.naulageUnit || DEFAULT_NAULAGE_UNIT,
    }));
    setRows(prefRows.length ? prefRows : [emptyOutRow()]);
    setPrefillDone(true);
  }, [isEditing, prefillDone, customers.length, items.length, warehouses.length, editTarget, editSiblings]);

  const addRow = () => setRows(r => [...r, emptyOutRow()]);
  const removeRow = (id: number) => { if (rows.length > 1) setRows(r => r.filter(x => x.id !== id)); };
  const updateRow = (id: number, patch: Partial<OutgoingRow>) =>
    setRows(r => r.map(x => x.id === id ? { ...x, ...patch } : x));

  const onCustomerChange = (val: string) => {
    setSelectedCustomerId(val);
    const cust = customers.find(c => c.id === val);
    setSelectedWaPhone(cust?.mobile || cust?.phone || "");
    setSelectedDriver("");
    setVehiclePlate("");
  };

  useEffect(() => {
    if (!selectedCustomerId) {
      setCustomerDriverOptions([]);
      setCustomerNaulages([]);
      setCustomerPricing([]);
      setCustomerIncomingMovements([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const [drv, nau, pri, inc] = await Promise.all([
          getCustomerDrivers(selectedCustomerId),
          getCustomerNaulages(selectedCustomerId),
          getCustomerPrices(selectedCustomerId),
          getAllMovements({ customerId: selectedCustomerId, movementType: "Incoming", pageSize: 500 }),
        ]);
        if (cancelled) return;
        setCustomerDriverOptions(drv.filter(d => d.isActive));
        setCustomerNaulages(nau.filter(n => n.isActive));
        setCustomerPricing(pri.filter(p => p.isActive));
        setCustomerIncomingMovements(inc.filter(m => m.isActive));
      } catch {
        if (!cancelled) {
          setCustomerDriverOptions([]);
          setCustomerNaulages([]);
          setCustomerPricing([]);
          setCustomerIncomingMovements([]);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [selectedCustomerId]);

  const warehouseChambers = useMemo(
    () => selectedWarehouseId ? chambers.filter(c => c.warehouseId === selectedWarehouseId) : [],
    [chambers, selectedWarehouseId],
  );

  // Resolve the sourceMovementId for a given outgoing row by matching the incoming
  // invoice number + item + package among the customer's incoming movements.
  const resolveSourceId = (r: OutgoingRow): string | undefined => {
    if (!r.incomingMovementNumber) return undefined;
    const found = customerIncomingMovements.find(m =>
      m.movementNumber === r.incomingMovementNumber
      && m.itemId === r.itemId
      && (m.packageId ?? null) === (r.packageId || null));
    return found?.id;
  };

  const incomingInvoices = useMemo(() => {
    const groups = new Map<string, { movementNumber: string; movementDate: string; rows: BackendMovement[] }>();
    for (const m of customerIncomingMovements) {
      const key = m.movementNumber;
      const existing = groups.get(key);
      if (existing) {
        existing.rows.push(m);
        if (m.movementDate < existing.movementDate) existing.movementDate = m.movementDate;
      } else {
        groups.set(key, { movementNumber: key, movementDate: m.movementDate, rows: [m] });
      }
    }
    return Array.from(groups.values()).sort((a, b) => b.movementDate.localeCompare(a.movementDate));
  }, [customerIncomingMovements]);

  const customerStockItems = useMemo(() => {
    const ids = new Set<string>();
    for (const inv of incomingInvoices) {
      for (const r of inv.rows) ids.add(r.itemId);
    }
    return items.filter(i => ids.has(i.id));
  }, [incomingInvoices, items]);

  const getInvoiceItems = (movementNumber: string): BackendItem[] => {
    if (!movementNumber) return customerStockItems;
    const inv = incomingInvoices.find(x => x.movementNumber === movementNumber);
    if (!inv) return [];
    const ids = new Set(inv.rows.map(r => r.itemId));
    return items.filter(i => ids.has(i.id));
  };

  const getInvoicesContainingItem = (itemId: string) => {
    if (!itemId) return incomingInvoices;
    return incomingInvoices.filter(inv => inv.rows.some(r => r.itemId === itemId));
  };

  const getInvoiceItemAvailQty = (movementNumber: string, itemId: string): number => {
    if (!movementNumber || !itemId) return 0;
    const inv = incomingInvoices.find(x => x.movementNumber === movementNumber);
    if (!inv) return 0;
    return inv.rows.filter(r => r.itemId === itemId).reduce((s, r) => s + (r.quantity || 0), 0);
  };

  const getInvoiceItemPackage = (movementNumber: string, itemId: string): { packageId: string; packageName: string; unit: string } => {
    if (!movementNumber || !itemId) return { packageId: "", packageName: "", unit: "" };
    const inv = incomingInvoices.find(x => x.movementNumber === movementNumber);
    if (!inv) return { packageId: "", packageName: "", unit: "" };
    const match = inv.rows.find(r => r.itemId === itemId && (r.packageId || r.unit));
    if (!match) return { packageId: "", packageName: "", unit: "" };
    return { packageId: match.packageId ?? "", packageName: match.packageName ?? "", unit: match.unit ?? "" };
  };

  const rowStorageDays = (row: OutgoingRow): number =>
    daysBetween(row.incomingMovementDate, movementDate);

  const rowStorageCost = (row: OutgoingRow): number => {
    const days = rowStorageDays(row);
    if (!days) return 0;
    const p = customerPricing.find(x =>
      (row.itemId && x.itemId === row.itemId) ||
      (row.item && x.itemName === row.item),
    );
    if (!p) return 0;
    return days * (p.pricePerDay || 0) * (Number(row.requestedQty) || 0);
  };

  const onDriverChange = (driverId: string) => {
    const d = customerDriverOptions.find(x => String(x.id) === driverId);
    if (d) {
      setSelectedDriver(d.name);
      setVehiclePlate(d.plate || "");
    }
  };

  const lookupCustomerNaulage = (itemId: string, itemName: string, preferredUnit?: string): { naulage: string; naulageUnit: string } | null => {
    if (!itemId && !itemName) return null;
    const matches = customerNaulages.filter(n =>
      (itemId && n.itemId && n.itemId === itemId) ||
      (itemName && n.itemName === itemName),
    );
    if (matches.length === 0) return null;
    if (preferredUnit) {
      const exact = matches.find(n => n.naulageUnit === preferredUnit);
      return exact ? { naulage: String(exact.naulage), naulageUnit: exact.naulageUnit } : null;
    }
    const m = matches[0];
    return { naulage: String(m.naulage), naulageUnit: m.naulageUnit || DEFAULT_NAULAGE_UNIT };
  };

  const findPackageByUnit = (unitName: string) =>
    packages.find(p => (p.arName || p.name || p.packageType) === unitName);

  const customerPhoneOptions = useMemo(() => {
    if (!selectedCustomerId) return [];
    const cust = customers.find(c => c.id === selectedCustomerId);
    const opts: { label: string; phone: string }[] = [];
    if (cust?.mobile) opts.push({ label: `${cust.arName || cust.name} (موبايل)`, phone: cust.mobile });
    if (cust?.phone && cust.phone !== cust.mobile) opts.push({ label: `${cust.arName || cust.name} (هاتف)`, phone: cust.phone });
    return opts;
  }, [selectedCustomerId, customers]);

  const hasError = (row: OutgoingRow) => Number(row.requestedQty) > row.availableQty && row.availableQty > 0 && row.requestedQty !== "";
  const totalQty = rows.reduce((s, r) => s + (Number(r.requestedQty) || 0), 0);
  const totalNaulage = rows.reduce((s, r) => s + (Number(r.naulage) || 0) * (Number(r.requestedQty) || 0), 0);
  const totalStorageCost = rows.reduce((s, r) => s + rowStorageCost(r), 0);

  const handleSave = async () => {
    if (rows.some(hasError)) { toast.error("الكمية المطلوبة تتجاوز الكمية المتاحة"); return; }
    if (!selectedCustomerId) { toast.error("اختر العميل"); return; }
    if (!selectedWarehouseId) { toast.error("اختر الثلاجة"); return; }
    if (!isEditing && !selectedDriver) { toast.error("اختر السائق"); return; }
    const validRows = rows.filter(r => r.itemId && Number(r.requestedQty) > 0);
    if (validRows.length === 0) { toast.error("أضف صنف واحد على الأقل بكمية صحيحة"); return; }

    setSaving(true);
    try {
      const isoDate = new Date(movementDate).toISOString();

      if (isEditing) {
        const keptIds = new Set(validRows.filter(r => r.backendId).map(r => r.backendId!));
        const removedIds = originalSiblingIds.filter(id => !keptIds.has(id));

        await Promise.all(removedIds.map(id => deactivateMovement(id)));

        for (const r of validRows) {
          if (!r.chamber) { toast.error("اختر مربع التبريد لكل سطر"); setSaving(false); return; }
          if (!resolveSourceId(r)) { toast.error("اختر فاتورة المصدر لكل سطر"); setSaving(false); return; }
        }

        await Promise.all(validRows.filter(r => r.backendId).map(r =>
          editMovement({
            id: r.backendId!,
            movementNumber: invoiceNo,
            movementType: "Outgoing",
            movementDate: isoDate,
            customerId: selectedCustomerId,
            itemId: r.itemId,
            packageId: r.packageId || undefined,
            fromWarehouseId: selectedWarehouseId,
            fromChamberId: r.chamber || undefined,
            sourceMovementId: resolveSourceId(r),
            quantity: Number(r.requestedQty),
            unit: "طرد",
            driverName: selectedDriver || undefined,
            vehiclePlate: vehiclePlate || undefined,
            referenceNumber: r.serial || undefined,
            notes: notes || undefined,
            naulagePerUnit: r.naulage ? Number(r.naulage) : undefined,
            naulageUnit: r.naulageUnit || undefined,
            openingFee: openingFee ? Number(openingFee) : undefined,
            damagedQuantity: r.damaged ? Number(r.damaged) : undefined,
            isActive: true,
          })
        ));

        await Promise.all(validRows.filter(r => !r.backendId).map(r =>
          addMovement({
            movementNumber: invoiceNo,
            movementType: "Outgoing",
            movementDate: isoDate,
            customerId: selectedCustomerId,
            itemId: r.itemId,
            packageId: r.packageId || undefined,
            fromWarehouseId: selectedWarehouseId,
            fromChamberId: r.chamber || undefined,
            sourceMovementId: resolveSourceId(r),
            quantity: Number(r.requestedQty),
            unit: "طرد",
            driverName: selectedDriver || undefined,
            vehiclePlate: vehiclePlate || undefined,
            referenceNumber: r.serial || undefined,
            notes: notes || undefined,
            naulagePerUnit: r.naulage ? Number(r.naulage) : undefined,
            naulageUnit: r.naulageUnit || undefined,
            openingFee: openingFee ? Number(openingFee) : undefined,
            damagedQuantity: r.damaged ? Number(r.damaged) : undefined,
          })
        ));

        toast.success(`تم تحديث الحركة ${invoiceNo}`);
        onDoneEditing?.();
        return;
      }

      // ── Create flow ──
      for (const r of validRows) {
        if (!r.chamber) { toast.error("اختر مربع التبريد لكل سطر"); setSaving(false); return; }
        if (!resolveSourceId(r)) { toast.error("اختر فاتورة المصدر لكل سطر"); setSaving(false); return; }
      }
      let savedCount = 0;
      const savedMovements: BackendMovement[] = [];
      for (const r of validRows) {
        const num = `${invoiceNo}-${++savedCount}`;
        const result = await addMovement({
          movementNumber: num,
          movementType: "Outgoing",
          movementDate: isoDate,
          customerId: selectedCustomerId,
          itemId: r.itemId,
          packageId: r.packageId || undefined,
          fromWarehouseId: selectedWarehouseId,
          fromChamberId: r.chamber,
          sourceMovementId: resolveSourceId(r),
          quantity: Number(r.requestedQty),
          unit: "طرد",
          driverName: selectedDriver || undefined,
          vehiclePlate: vehiclePlate || undefined,
          referenceNumber: r.serial || undefined,
          notes: notes || undefined,
          naulagePerUnit: r.naulage ? Number(r.naulage) : undefined,
          naulageUnit: r.naulageUnit || undefined,
          openingFee: openingFee ? Number(openingFee) : undefined,
          temperature: r.temperature ? Number(r.temperature) : undefined,
          damagedQuantity: r.damaged ? Number(r.damaged) : undefined,
          brandId: r.brandId || undefined,
          brandName: r.brandName || undefined,
          preCoolingFee: r.preCooling ? Number(r.preCooling) : undefined,
          weightPerUnit: r.weightPerUnit ? Number(r.weightPerUnit) : undefined,
        });
        savedMovements.push(result);
      }
      const custObj = customers.find(c => c.id === selectedCustomerId);
      const whObj   = warehouses.find(w => w.id === selectedWarehouseId);
      const printRows = savedMovements.map((s, i) => ({
        ...s,
        customerArName: s.customerArName || custObj?.arName || custObj?.name || "",
        customerName:   s.customerName   || custObj?.name  || "",
        fromWarehouseName: s.fromWarehouseName || whObj?.arName || whObj?.name || "",
        itemArName:  s.itemArName  || validRows[i]?.item || "",
        packageName: s.packageName || validRows[i]?.pkg  || "",
      }));
      const customerName = custObj?.arName || custObj?.name || "عميل";
      const msg = `🔴 *منصرف جديد*\nرقم الفاتورة: ${invoiceNo}\nالعميل: ${customerName}\nالكمية: ${totalQty.toLocaleString()} طرد\nدرجة الحرارة: ${temperature || "—"} °م\nالنولون: ${totalNaulage.toLocaleString()} ج.م${openingFee ? `\nفتح مربع تبريد: ${Number(openingFee).toLocaleString()} ج.م` : ""}\nالتاريخ: ${new Date().toLocaleDateString("ar-EG")}`;
      toast.success(`تم حفظ ${savedCount} حركة منصرف للفاتورة ${invoiceNo}`);
      setRows([emptyOutRow()]);
      onSaveAndView?.(savedMovements[0].id, selectedWaPhone || undefined, selectedWaPhone ? msg : undefined);
    } catch (err: any) {
      toast.error(err?.message ?? "فشل حفظ الحركات");
    } finally {
      setSaving(false);
    }
  };

  const handleTipsSave = () => {
    if (!tipsAmount) { toast.error("أدخل مبلغ الدخان"); return; }
    toast.success(`تم تسجيل دخان بقيمة ${Number(tipsAmount).toLocaleString()} ج.م كمصروف`);
    setShowTips(false); setTipsAmount(""); setTipsNote("");
  };

  const { confirmDelete, dialog: confirmDialog } = useConfirmDelete();

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
      {/* Header */}
      <motion.div variants={anim}>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>العميل *</Label>
                <CustomerCombobox value={selectedCustomerId} onValueChange={onCustomerChange} customers={customers} />
                {selectedCustomerId && (
                  <div className="mt-1 space-y-0.5">
                    <Label className="text-[11px] text-gray-400 flex items-center gap-1"><MessageCircle className="w-3 h-3 text-green-500" />إرسال واتساب إلى</Label>
                    <Select value={selectedWaPhone} onValueChange={setSelectedWaPhone}>
                      <SelectTrigger dir="rtl" className="h-8 text-xs border-green-200 bg-green-50/40">
                        <SelectValue placeholder="اختر رقم الإرسال" />
                      </SelectTrigger>
                      <SelectContent dir="rtl">
                        {customerPhoneOptions.map(o => (
                          <SelectItem key={o.phone} value={o.phone} className="text-xs">
                            {o.label} — {o.phone}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>التاريخ *</Label>
                <Input type="date" dir="rtl" value={movementDate} onChange={e => setMovementDate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>السائق *</Label>
                {customerDriverOptions.length > 0 ? (
                  <Select
                    value={customerDriverOptions.find(d => d.name === selectedDriver) ? String(customerDriverOptions.find(d => d.name === selectedDriver)!.id) : ""}
                    onValueChange={onDriverChange}
                  >
                    <SelectTrigger dir="rtl">
                      <SelectValue placeholder="اختر السائق" />
                    </SelectTrigger>
                    <SelectContent dir="rtl">
                      {customerDriverOptions.map(d => (
                        <SelectItem key={d.id} value={String(d.id)}>
                          {d.name} — {d.plate || "بدون لوحة"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    placeholder={selectedCustomerId ? "لا يوجد سائقون لهذا العميل — اكتب الاسم" : "اختر العميل أولاً"}
                    dir="rtl"
                    value={selectedDriver}
                    onChange={e => setSelectedDriver(e.target.value)}
                  />
                )}
              </div>
              <div className="space-y-1.5">
                <Label>رقم السيارة</Label>
                <Input placeholder="أ ب ج 1234" dir="rtl" value={vehiclePlate} onChange={e => setVehiclePlate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>الثلاجة *</Label>
                <Select value={selectedWarehouseId} onValueChange={setSelectedWarehouseId}>
                  <SelectTrigger dir="rtl"><SelectValue placeholder="اختر الثلاجة" /></SelectTrigger>
                  <SelectContent dir="rtl">{warehouses.map(w => <SelectItem key={w.id} value={w.id}>{w.arName || w.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5"><Thermometer className="w-3.5 h-3.5 text-blue-500" />درجة الحرارة (°م)</Label>
                <Input type="number" placeholder="-18" dir="rtl" value={temperature} onChange={e => setTemperature(e.target.value)} className="border border-[#d1d5dc] bg-[#f9fafb]" />
              </div>
              <div className="col-span-2 md:col-span-3 space-y-1.5">
                <Label>ملاحظات</Label>
                <Textarea placeholder="ملاحظات إضافية..." dir="rtl" className="resize-none h-9 py-1" rows={1} value={notes} onChange={e => setNotes(e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Items table */}
      <motion.div variants={anim}>
        <Card className="border-0 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b bg-gray-50 flex items-center justify-between">
            <h3 className="font-semibold text-gray-800">الأصناف المنصرفة</h3>
          </div>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[1320px]">
                <thead>
                  <tr className="bg-red-50 border-b border-red-100">
                    {["#","حركة الوارد","الصنف","العبوة","الكمية المطلوبة","الكمية المتاحة","أيام التخزين","إجمالي السعر","رقم الرسالة","العوارية","مربع التبريد","النولون (ج.م + الوحدة)",""].map((h,i) => (
                      <th key={i} className={cn("text-right px-3 py-2.5 text-xs font-medium text-red-800", i===11?"bg-amber-50 text-amber-800":"", i===6?"text-rose-700":"", i===7?"bg-rose-50 text-rose-800":"")}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, idx) => {
                    const err = hasError(row);
                    return (
                      <motion.tr key={row.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className={cn("border-b transition-colors", err ? "bg-red-50/50" : "hover:bg-gray-50/30")}>
                        <td className="px-3 py-2 text-gray-500 text-xs">{idx + 1}</td>
                        <td className="px-2 py-1.5">
                          <Select
                            value={row.incomingMovementNumber}
                            onValueChange={v => {
                              const inv = incomingInvoices.find(x => x.movementNumber === v);
                              if (!inv) return;
                              if (row.itemId && inv.rows.some(r => r.itemId === row.itemId)) {
                                const availQty = getInvoiceItemAvailQty(v, row.itemId);
                                const invPkg = getInvoiceItemPackage(v, row.itemId);
                                const pkgFromList = invPkg.packageId ? packages.find(p => p.id === invPkg.packageId) : undefined;
                                const pkgName = invPkg.packageName || pkgFromList?.arName || pkgFromList?.name || pkgFromList?.packageType || "";
                                const availUnit = invPkg.unit || pkgName || "";
                                const n = lookupCustomerNaulage(row.itemId, row.item, pkgName || undefined);
                                updateRow(row.id, {
                                  incomingMovementNumber: v,
                                  incomingMovementDate: inv.movementDate,
                                  availableQty: availQty,
                                  availableUnit: availUnit,
                                  packageId: invPkg.packageId,
                                  pkg: pkgName,
                                  naulage: n ? n.naulage : "",
                                  naulageUnit: pkgName || (n ? n.naulageUnit : DEFAULT_NAULAGE_UNIT),
                                });
                              } else {
                                updateRow(row.id, {
                                  incomingMovementNumber: v,
                                  incomingMovementDate: inv.movementDate,
                                  itemId: "",
                                  item: "",
                                  packageId: "",
                                  pkg: "",
                                  requestedQty: "",
                                  availableQty: 0,
                                  availableUnit: "",
                                  naulage: "",
                                  naulageUnit: DEFAULT_NAULAGE_UNIT,
                                });
                              }
                            }}
                            disabled={!selectedCustomerId}
                          >
                            <SelectTrigger className="h-8 text-xs w-44" dir="rtl">
                              <SelectValue placeholder={
                                !selectedCustomerId
                                  ? "اختر العميل أولاً"
                                  : incomingInvoices.length === 0
                                    ? "لا توجد فواتير وارد"
                                    : row.itemId && getInvoicesContainingItem(row.itemId).length > 1
                                      ? "متعدد — اختر فاتورة"
                                      : "اختياري — اختر فاتورة"
                              } />
                            </SelectTrigger>
                            <SelectContent dir="rtl">
                              {(row.itemId ? getInvoicesContainingItem(row.itemId) : incomingInvoices).map(inv => (
                                <SelectItem key={inv.movementNumber} value={inv.movementNumber}>
                                  {inv.movementNumber} — {(inv.movementDate || "").slice(0, 10)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-2 py-1.5">
                          <Select value={row.itemId} onValueChange={v => {
                            const it = items.find(i => i.id === v);
                            const itName = it?.arName || it?.name || "";

                            let invNum = row.incomingMovementNumber;
                            let invDate = row.incomingMovementDate;
                            if (!invNum) {
                              const matches = getInvoicesContainingItem(v);
                              if (matches.length === 1) {
                                invNum = matches[0].movementNumber;
                                invDate = matches[0].movementDate;
                              }
                            }

                            if (!invNum) {
                              updateRow(row.id, {
                                itemId: v,
                                item: itName,
                                packageId: "",
                                pkg: "",
                                availableQty: 0,
                                availableUnit: "",
                                naulage: "",
                                naulageUnit: DEFAULT_NAULAGE_UNIT,
                              });
                              return;
                            }

                            const availQty = getInvoiceItemAvailQty(invNum, v);
                            const invPkg = getInvoiceItemPackage(invNum, v);
                            const pkgFromList = invPkg.packageId ? packages.find(p => p.id === invPkg.packageId) : undefined;
                            const pkgName = invPkg.packageName || pkgFromList?.arName || pkgFromList?.name || pkgFromList?.packageType || "";
                            const availUnit = invPkg.unit || pkgName || "";
                            const n = lookupCustomerNaulage(v, itName, pkgName || undefined);
                            updateRow(row.id, {
                              itemId: v,
                              item: itName,
                              incomingMovementNumber: invNum,
                              incomingMovementDate: invDate,
                              availableQty: availQty,
                              availableUnit: availUnit,
                              packageId: invPkg.packageId,
                              pkg: pkgName,
                              naulage: n ? n.naulage : "",
                              naulageUnit: pkgName || (n ? n.naulageUnit : DEFAULT_NAULAGE_UNIT),
                            });
                          }}>
                            <SelectTrigger className="h-8 text-xs" dir="rtl"><SelectValue placeholder="الصنف" /></SelectTrigger>
                            <SelectContent dir="rtl">{getInvoiceItems(row.incomingMovementNumber).map(i => (
                              <SelectItem key={i.id} value={i.id}>
                                <div className="flex items-center gap-2">
                                  <OptionAvatar imageUrl={i.imageUrl} initial={i.prefix || (i.arName || i.name || "?").charAt(0)} grad={itemGrad(i.storageType)} />
                                  {i.arName || i.name}
                                </div>
                              </SelectItem>
                            ))}</SelectContent>
                          </Select>
                        </td>
                        <td className="px-2 py-1.5">
                          <div className="h-8 text-xs px-3 flex items-center rounded-lg border border-gray-200 bg-gray-50 text-gray-700 w-full min-w-[6rem]">
                            {row.pkg || <span className="text-gray-400">—</span>}
                          </div>
                        </td>
                        <td className="px-2 py-1.5">
                          <div className="relative">
                            <Input className={cn("h-8 text-xs w-24", err ? "border-red-500 bg-red-50" : "")} type="number" placeholder="0" dir="rtl" value={row.requestedQty} onChange={e => updateRow(row.id, { requestedQty: e.target.value })} />
                            {err && <AlertCircle className="absolute left-1 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-red-500" />}
                          </div>
                          {err && <p className="text-red-500 text-xs mt-0.5">يتجاوز المتاح!</p>}
                        </td>
                        <td className="px-2 py-1.5">
                          <span className={cn("text-xs font-medium px-2 py-0.5 rounded", row.availableQty > 0 ? "text-green-700 bg-green-100" : "text-gray-400 bg-gray-100")}>
                            {row.availableQty || "—"} {row.availableUnit || row.pkg || ""}
                          </span>
                        </td>
                        <td className="px-2 py-1.5">
                          {row.incomingMovementDate ? (
                            <div className="flex flex-col gap-0.5">
                              <span className="text-xs font-medium text-rose-700">{rowStorageDays(row).toLocaleString()} يوم</span>
                              <span className="text-[10px] text-gray-500">{(row.incomingMovementDate || "").slice(0, 10)} ← {(movementDate || "").slice(0, 10)}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-2 py-1.5 bg-rose-50/40">
                          {(() => {
                            if (!row.incomingMovementDate || !row.itemId) return <span className="text-xs text-gray-400">—</span>;
                            const days = rowStorageDays(row);
                            const p = customerPricing.find(x =>
                              (row.itemId && x.itemId === row.itemId) ||
                              (row.item && x.itemName === row.item),
                            );
                            if (!p) return <span className="text-xs text-gray-400" title="لا يوجد سعر مخصص لهذا العميل">— لا يوجد سعر</span>;
                            const qty = Number(row.requestedQty) || 0;
                            const total = days * (p.pricePerDay || 0) * qty;
                            return (
                              <div className="flex flex-col gap-0.5">
                                <span className="text-xs font-bold text-rose-700">{total.toLocaleString()} ج.م</span>
                                <span className="text-[10px] text-gray-500">{days} × {p.pricePerDay.toLocaleString()} × {qty}</span>
                              </div>
                            );
                          })()}
                        </td>
                        <td className="px-2 py-1.5"><Input className="h-8 text-xs w-28" placeholder="SN-XXXXX" dir="rtl" value={row.serial} onChange={e => updateRow(row.id, { serial: e.target.value })} /></td>
                        <td className="px-2 py-1.5"><Input className="h-8 text-xs w-20" type="number" placeholder="0" dir="rtl" value={row.damaged} onChange={e => updateRow(row.id, { damaged: e.target.value })} /></td>
                        <td className="px-2 py-1.5">
                          <Select value={row.chamber} onValueChange={v => updateRow(row.id, { chamber: v })} disabled={!selectedWarehouseId}>
                            <SelectTrigger dir="rtl" className="h-8 text-xs w-28"><SelectValue placeholder={selectedWarehouseId ? "مربع التبريد" : "—"} /></SelectTrigger>
                            <SelectContent dir="rtl">{warehouseChambers.map(c => <SelectItem key={c.id} value={c.id}>{c.code}</SelectItem>)}</SelectContent>
                          </Select>
                        </td>
                        <td className="px-2 py-1.5 bg-amber-50/50">
                          <div className="flex items-center gap-1">
                            <Input className="h-8 text-xs w-20 border-amber-200 bg-amber-50" type="number" placeholder="0" dir="rtl" value={row.naulage} onChange={e => updateRow(row.id, { naulage: e.target.value })} />
                            <div className="h-8 text-xs w-20 px-3 flex items-center rounded-lg border border-amber-200 bg-amber-50 text-gray-700">
                              {row.naulageUnit || <span className="text-gray-400">—</span>}
                            </div>
                            {row.naulage && <span className="text-xs text-amber-600">=&nbsp;{((Number(row.naulage)||0)*(Number(row.requestedQty)||0)).toLocaleString()}</span>}
                          </div>
                        </td>
                        <td className="px-2 py-1.5">
                          <button onClick={() => confirmDelete(row.item || `السطر ${idx+1}`, () => removeRow(row.id), { title: "حذف السطر", description: "هل تريد حذف هذا السطر من فاتورة الصرف؟" })} className="p-1 text-red-400 hover:bg-red-50 rounded">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 border-t">
              <button onClick={addRow} className="flex items-center gap-1.5 text-red-600 hover:text-red-700 text-sm font-medium hover:bg-red-50 px-3 py-1.5 rounded">
                <Plus className="w-4 h-4" />إضافة صنف
              </button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Footer */}
      <motion.div variants={anim}>
        <Card className="border-0 shadow-sm bg-red-50 border border-red-100">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-8 flex-wrap">
              <div><p className="text-xs text-gray-500">إجمالي الطرود المنصرفة</p><p className="text-2xl font-bold text-red-700">{totalQty.toLocaleString()}</p></div>
              <div><p className="text-xs text-gray-500">إجمالي النولون</p><p className="text-2xl font-bold text-amber-600">{totalNaulage.toLocaleString()} ج.م</p></div>
              {totalStorageCost > 0 && (
                <div><p className="text-xs text-gray-500">إجمالي السعر (تكلفة التخزين)</p><p className="text-2xl font-bold text-rose-700">{totalStorageCost.toLocaleString()} ج.م</p></div>
              )}
              <StorageCostStat
                rows={rows.map(r => ({ itemId: r.itemId, itemName: r.item, quantity: Number(r.requestedQty) || 0 }))}
                pricing={customerPricing}
                accentClass="text-rose-700"
              />
              {temperature && (
                <div className="flex items-center gap-1.5 bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg">
                  <Thermometer className="w-4 h-4" />
                  <span className="font-semibold">{temperature} °م</span>
                </div>
              )}
            </div>
            <div className="flex items-center justify-between flex-wrap gap-3 pt-2 border-t border-red-200">
              <div className="flex items-center gap-3 flex-wrap">
                {/* فتح مربع تبريد */}
                <div className="flex items-center gap-2 bg-white border border-red-200 rounded-lg px-3 py-1.5">
                  <DoorOpen className="w-4 h-4 text-red-600" />
                  <Label className="text-xs text-gray-600 whitespace-nowrap">فتح مربع تبريد (مصروف):</Label>
                  <Input type="number" placeholder="0" dir="rtl" value={openingFee} onChange={e => setOpeningFee(e.target.value)} className="h-7 text-xs w-24 border-0 bg-transparent p-0 focus-visible:ring-0" />
                  <span className="text-xs text-gray-500">ج.م</span>
                </div>
                {/* دخان button */}
                <Button variant="outline" size="sm" onClick={() => setShowTips(true)} className="border-orange-400 text-orange-700 hover:bg-orange-50 gap-1.5">
                  <Cigarette className="w-4 h-4" />دخان (تيبس)
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={handleSave} disabled={saving} className="bg-red-600 hover:bg-red-700 text-white gap-2">
                  <Save className="w-4 h-4" />{saving ? "جاري الحفظ..." : "حفظ + واتساب"}<MessageCircle className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
      {confirmDialog}

      {/* Tips Dialog */}
      <Dialog open={showTips} onOpenChange={setShowTips}>
        <DialogContent dir="rtl" className="max-w-sm bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Cigarette className="w-5 h-5 text-orange-600" />إضافة دخان (تيبس للسائق)</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>اسم السائق</Label>
              <Input dir="rtl" value={selectedDriver || tipsNote} onChange={e => setTipsNote(e.target.value)} placeholder="اسم السائق" className="border border-[#d1d5dc] bg-[#f9fafb]" />
            </div>
            <div className="space-y-1.5">
              <Label>المبلغ (ج.م)</Label>
              <Input type="number" placeholder="0" dir="rtl" value={tipsAmount} onChange={e => setTipsAmount(e.target.value)} className="border border-[#d1d5dc] bg-[#f9fafb]" />
            </div>
            <div className="bg-orange-50 border border-orange-100 rounded-lg p-3 text-xs text-orange-700">
              <p>سيتم تسجيل هذا المبلغ كمصروف في المصاريف التشغيلية.</p>
            </div>
          </div>
          <DialogFooter className="gap-2 mt-2">
            <Button onClick={handleTipsSave} className="bg-[#155dfc] hover:bg-blue-700 text-white">تسجيل كمصروف</Button>
            <Button variant="outline" onClick={() => setShowTips(false)}>إلغاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════
   TRANSFERS TAB CONTENT
══════════════════════════════════════════════ */
function TransfersTab() {
  const [customers, setCustomers] = useState<BackendCustomer[]>([]);
  const [items, setItems] = useState<BackendItem[]>([]);
  const [warehouses, setWarehouses] = useState<BackendWarehouse[]>([]);
  const [chambers, setChambers] = useState<BackendChamber[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [c, i, w, ch] = await Promise.all([
          getAllCustomers(1, 200),
          getAllItems(1, 200),
          getAllWarehouses(1, 100),
          getChambers(),
        ]);
        if (cancelled) return;
        setCustomers(c.filter(x => x.isActive));
        setItems(i.filter(x => x.isActive));
        setWarehouses(w.filter(x => x.isActive));
        setChambers(ch.filter(x => x.isActive));
      } catch (err: any) {
        if (!cancelled) toast.error(err?.message ?? "فشل تحميل البيانات");
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const [subTab, setSubTab] = useState("warehouses");
  const [temperature, setTemperature] = useState("");
  const [saving, setSaving] = useState(false);

  // Warehouse-to-warehouse transfer state
  const [whFromId, setWhFromId] = useState("");
  const [whToId, setWhToId] = useState("");
  const [whFromChamberId, setWhFromChamberId] = useState("");
  const [whToChamberId, setWhToChamberId] = useState("");
  const [whCustomerId, setWhCustomerId] = useState("");
  const [whItemId, setWhItemId] = useState("");
  const [whQty, setWhQty] = useState("");
  const [whNotes, setWhNotes] = useState("");
  const [whSources, setWhSources] = useState<AvailableSource[]>([]);
  const [whSourceId, setWhSourceId] = useState("");

  const fromChamberOptions = useMemo(
    () => whFromId ? chambers.filter(c => c.warehouseId === whFromId) : [],
    [chambers, whFromId],
  );
  const toChamberOptions = useMemo(
    () => whToId ? chambers.filter(c => c.warehouseId === whToId) : [],
    [chambers, whToId],
  );

  useEffect(() => {
    setWhSourceId("");
    if (!whCustomerId || !whItemId || !whFromChamberId) { setWhSources([]); return; }
    let cancelled = false;
    (async () => {
      try {
        const list = await getAvailableSources({ customerId: whCustomerId, itemId: whItemId, chamberId: whFromChamberId });
        if (!cancelled) setWhSources(list);
      } catch (err: any) {
        if (!cancelled) { setWhSources([]); toast.error(err?.message ?? "فشل تحميل الفواتير المتاحة"); }
      }
    })();
    return () => { cancelled = true; };
  }, [whCustomerId, whItemId, whFromChamberId]);

  // Customer-to-customer transfer state
  const [cstFromId, setCstFromId] = useState("");
  const [cstToId, setCstToId] = useState("");
  const [cstWarehouseId, setCstWarehouseId] = useState("");
  const [cstChamberId, setCstChamberId] = useState("");
  const [cstItemId, setCstItemId] = useState("");
  const [cstQty, setCstQty] = useState("");
  const [cstNotes, setCstNotes] = useState("");
  const [cstSources, setCstSources] = useState<AvailableSource[]>([]);
  const [cstSourceId, setCstSourceId] = useState("");

  const cstChamberOptions = useMemo(
    () => cstWarehouseId ? chambers.filter(c => c.warehouseId === cstWarehouseId) : [],
    [chambers, cstWarehouseId],
  );

  useEffect(() => {
    setCstSourceId("");
    if (!cstFromId || !cstItemId || !cstChamberId) { setCstSources([]); return; }
    let cancelled = false;
    (async () => {
      try {
        const list = await getAvailableSources({ customerId: cstFromId, itemId: cstItemId, chamberId: cstChamberId });
        if (!cancelled) setCstSources(list);
      } catch (err: any) {
        if (!cancelled) { setCstSources([]); toast.error(err?.message ?? "فشل تحميل الفواتير المتاحة"); }
      }
    })();
    return () => { cancelled = true; };
  }, [cstFromId, cstItemId, cstChamberId]);

  const trf = useMemo(() => `TRF-2024-${String(Math.floor(Math.random() * 900) + 100).padStart(3, "0")}`, []);

  const handleSave = async (type: string) => {
    setSaving(true);
    try {
      if (type === "warehouses") {
        if (!whFromId || !whToId) { toast.error("اختر الثلاجة المصدر والوجهة"); return; }
        if (!whFromChamberId || !whToChamberId) { toast.error("اختر مربع التبريد المصدر والوجهة"); return; }
        if (!whCustomerId) { toast.error("اختر العميل"); return; }
        if (!whItemId) { toast.error("اختر الصنف"); return; }
        if (!whSourceId) { toast.error("اختر فاتورة المصدر"); return; }
        if (!whQty || Number(whQty) <= 0) { toast.error("أدخل كمية صحيحة"); return; }
        await addMovement({
          movementNumber: trf,
          movementType: "Transfer",
          movementDate: new Date().toISOString(),
          customerId: whCustomerId,
          itemId: whItemId,
          fromWarehouseId: whFromId,
          fromChamberId: whFromChamberId,
          toWarehouseId: whToId,
          toChamberId: whToChamberId,
          sourceMovementId: whSourceId,
          quantity: Number(whQty),
          unit: "طرد",
          notes: whNotes || undefined,
        });
      } else {
        if (!cstFromId || !cstToId) { toast.error("اختر العميل المحول والمستلم"); return; }
        if (cstFromId === cstToId) { toast.error("لا يمكن التحويل من العميل إلى نفسه"); return; }
        if (!cstWarehouseId || !cstChamberId) { toast.error("اختر الثلاجة ومربع التبريد"); return; }
        if (!cstItemId) { toast.error("اختر الصنف"); return; }
        if (!cstSourceId) { toast.error("اختر فاتورة المصدر"); return; }
        if (!cstQty || Number(cstQty) <= 0) { toast.error("أدخل كمية صحيحة"); return; }
        await addMovement({
          movementNumber: trf,
          movementType: "Transfer",
          movementDate: new Date().toISOString(),
          customerId: cstFromId,
          toCustomerId: cstToId,
          itemId: cstItemId,
          fromWarehouseId: cstWarehouseId,
          fromChamberId: cstChamberId,
          toWarehouseId: cstWarehouseId,
          toChamberId: cstChamberId,
          sourceMovementId: cstSourceId,
          quantity: Number(cstQty),
          unit: "طرد",
          notes: cstNotes || undefined,
        });
      }
      const label = type === "warehouses" ? "تحويل ثلاجة" : "تحويل عميل";
      const msg = `🟡 *${label} جديد*\nرقم التحويل: ${trf}${temperature ? `\nدرجة الحرارة: ${temperature} °م` : ""}\nالتاريخ: ${new Date().toLocaleDateString("ar-EG")}`;
      toast.success(`تم تأكيد ${label} برقم ${trf}`);
      sendWhatsApp(msg);
    } catch (err: any) {
      toast.error(err?.message ?? "فشل حفظ التحويل");
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
      <motion.div variants={anim}>
        <Tabs defaultValue="warehouses" onValueChange={setSubTab} dir="rtl">
          <TabsList className="bg-orange-50 border border-orange-100">
            <TabsTrigger value="warehouses" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white">تحويل بين ثلاجات</TabsTrigger>
            <TabsTrigger value="customers" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white">تحويل بين عملاء</TabsTrigger>
          </TabsList>

          {/* Between Warehouses */}
          <TabsContent value="warehouses">
            <Card className="border-0 shadow-sm mt-4">
              <CardContent className="p-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4 p-4 bg-orange-50 rounded-xl border border-orange-100">
                    <p className="font-semibold text-orange-800 text-sm flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-orange-600 text-white text-xs flex items-center justify-center">من</span>الثلاجة المصدر
                    </p>
                    <div className="space-y-1.5"><Label className="text-xs">الثلاجة</Label>
                      <Select value={whFromId} onValueChange={v => { setWhFromId(v); setWhFromChamberId(""); }}>
                        <SelectTrigger dir="rtl"><SelectValue placeholder="اختر الثلاجة" /></SelectTrigger>
                        <SelectContent dir="rtl">{warehouses.map(w => <SelectItem key={w.id} value={w.id}>{w.arName || w.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5"><Label className="text-xs">مربع التبريد</Label>
                      <Select value={whFromChamberId} onValueChange={setWhFromChamberId} disabled={!whFromId}>
                        <SelectTrigger dir="rtl"><SelectValue placeholder={whFromId ? "اختر مربع التبريد" : "اختر الثلاجة أولاً"} /></SelectTrigger>
                        <SelectContent dir="rtl">{fromChamberOptions.map(c => <SelectItem key={c.id} value={c.id}>{c.arName || c.name} ({c.code})</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5"><Label className="text-xs">العميل</Label>
                      <CustomerCombobox value={whCustomerId} onValueChange={setWhCustomerId} customers={customers} />
                    </div>
                  </div>
                  <div className="space-y-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
                    <p className="font-semibold text-blue-800 text-sm flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center">إلى</span>الثلاجة الوجهة
                    </p>
                    <div className="space-y-1.5"><Label className="text-xs">الثلاجة</Label>
                      <Select value={whToId} onValueChange={v => { setWhToId(v); setWhToChamberId(""); }}>
                        <SelectTrigger dir="rtl"><SelectValue placeholder="اختر الثلاجة" /></SelectTrigger>
                        <SelectContent dir="rtl">{warehouses.map(w => <SelectItem key={w.id} value={w.id}>{w.arName || w.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5"><Label className="text-xs">مربع التبريد المستهدف</Label>
                      <Select value={whToChamberId} onValueChange={setWhToChamberId} disabled={!whToId}>
                        <SelectTrigger dir="rtl"><SelectValue placeholder={whToId ? "اختر مربع التبريد" : "اختر الثلاجة أولاً"} /></SelectTrigger>
                        <SelectContent dir="rtl">{toChamberOptions.map(c => <SelectItem key={c.id} value={c.id}>{c.arName || c.name} ({c.code})</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="font-semibold text-gray-700 text-sm mb-3">تفاصيل الصنف</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="space-y-1.5"><Label className="text-xs">الصنف</Label>
                      <Select value={whItemId} onValueChange={setWhItemId}>
                        <SelectTrigger dir="rtl"><SelectValue placeholder="الصنف" /></SelectTrigger>
                        <SelectContent dir="rtl">{items.map(i => (
                            <SelectItem key={i.id} value={i.id}>
                              <div className="flex items-center gap-2">
                                <OptionAvatar imageUrl={i.imageUrl} initial={i.prefix || (i.arName || i.name || "?").charAt(0)} grad={itemGrad(i.storageType)} />
                                {i.arName || i.name}
                              </div>
                            </SelectItem>
                          ))}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5"><Label className="text-xs">الكمية</Label><Input type="number" placeholder="0" dir="rtl" value={whQty} onChange={e => setWhQty(e.target.value)} /></div>
                    <div className="space-y-1.5">
                      <Label className="text-xs flex items-center gap-1"><Thermometer className="w-3 h-3 text-blue-500" />درجة الحرارة (°م)</Label>
                      <Input type="number" placeholder="-18" dir="rtl" value={temperature} onChange={e => setTemperature(e.target.value)} className="border border-[#d1d5dc] bg-[#f9fafb]" />
                    </div>
                    <div className="space-y-1.5"><Label className="text-xs">ملاحظات</Label><Input placeholder="ملاحظات..." dir="rtl" value={whNotes} onChange={e => setWhNotes(e.target.value)} /></div>
                  </div>
                  <div className="mt-3 space-y-1.5">
                    <Label className="text-xs">فاتورة المصدر (الحركة الواردة)</Label>
                    <Select value={whSourceId} onValueChange={setWhSourceId} disabled={!whCustomerId || !whItemId || !whFromChamberId}>
                      <SelectTrigger dir="rtl">
                        <SelectValue placeholder={
                          !whCustomerId || !whItemId || !whFromChamberId
                            ? "اختر العميل والصنف ومربع التبريد المصدر أولاً"
                            : whSources.length === 0
                              ? "لا توجد فواتير متاحة"
                              : "اختر الفاتورة"
                        } />
                      </SelectTrigger>
                      <SelectContent dir="rtl">
                        {whSources.map(s => (
                          <SelectItem key={s.movementId} value={s.movementId}>
                            {s.movementNumber} — متاح {s.remainingQuantity}{s.unit ? ` ${s.unit}` : ""} من {s.originalQuantity}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="mt-4 flex justify-start">
                  <Button onClick={() => handleSave("warehouses")} disabled={saving} className="bg-orange-600 hover:bg-orange-700 text-white gap-2">
                    <Save className="w-4 h-4" />{saving ? "جاري الحفظ..." : "تأكيد التحويل"} + <MessageCircle className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Between Customers */}
          <TabsContent value="customers">
            <Card className="border-0 shadow-sm mt-4">
              <CardContent className="p-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3 p-4 bg-orange-50 rounded-xl border border-orange-100">
                    <p className="font-semibold text-orange-800 text-sm flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-orange-600 text-white text-xs flex items-center justify-center">من</span>العميل المحوِّل
                    </p>
                    <div className="space-y-1.5"><Label className="text-xs">العميل</Label>
                      <CustomerCombobox value={cstFromId} onValueChange={setCstFromId} customers={customers} />
                    </div>
                  </div>
                  <div className="space-y-3 p-4 bg-blue-50 rounded-xl border border-blue-100">
                    <p className="font-semibold text-blue-800 text-sm flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center">إلى</span>العميل المستلِم
                    </p>
                    <div className="space-y-1.5"><Label className="text-xs">العميل</Label>
                      <CustomerCombobox value={cstToId} onValueChange={setCstToId} customers={customers} />
                    </div>
                  </div>
                </div>
                <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="font-semibold text-gray-700 text-sm mb-3">موقع التخزين</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5"><Label className="text-xs">الثلاجة</Label>
                      <Select value={cstWarehouseId} onValueChange={v => { setCstWarehouseId(v); setCstChamberId(""); }}>
                        <SelectTrigger dir="rtl"><SelectValue placeholder="اختر الثلاجة" /></SelectTrigger>
                        <SelectContent dir="rtl">{warehouses.map(w => <SelectItem key={w.id} value={w.id}>{w.arName || w.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5"><Label className="text-xs">مربع التبريد</Label>
                      <Select value={cstChamberId} onValueChange={setCstChamberId} disabled={!cstWarehouseId}>
                        <SelectTrigger dir="rtl"><SelectValue placeholder={cstWarehouseId ? "اختر مربع التبريد" : "اختر الثلاجة أولاً"} /></SelectTrigger>
                        <SelectContent dir="rtl">{cstChamberOptions.map(c => <SelectItem key={c.id} value={c.id}>{c.arName || c.name} ({c.code})</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="space-y-1.5"><Label className="text-xs">الصنف</Label>
                      <Select value={cstItemId} onValueChange={setCstItemId}>
                        <SelectTrigger dir="rtl"><SelectValue placeholder="الصنف" /></SelectTrigger>
                        <SelectContent dir="rtl">{items.map(i => (
                            <SelectItem key={i.id} value={i.id}>
                              <div className="flex items-center gap-2">
                                <OptionAvatar imageUrl={i.imageUrl} initial={i.prefix || (i.arName || i.name || "?").charAt(0)} grad={itemGrad(i.storageType)} />
                                {i.arName || i.name}
                              </div>
                            </SelectItem>
                          ))}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5"><Label className="text-xs">الكمية</Label><Input type="number" placeholder="0" dir="rtl" value={cstQty} onChange={e => setCstQty(e.target.value)} /></div>
                    <div className="space-y-1.5">
                      <Label className="text-xs flex items-center gap-1"><Thermometer className="w-3 h-3 text-blue-500" />درجة الحرارة (°م)</Label>
                      <Input type="number" placeholder="-18" dir="rtl" value={temperature} onChange={e => setTemperature(e.target.value)} className="border border-[#d1d5dc] bg-[#f9fafb]" />
                    </div>
                    <div className="space-y-1.5"><Label className="text-xs">ملاحظات</Label><Input placeholder="ملاحظات إضافية..." dir="rtl" value={cstNotes} onChange={e => setCstNotes(e.target.value)} /></div>
                  </div>
                  <div className="mt-3 space-y-1.5">
                    <Label className="text-xs">فاتورة المصدر (الحركة الواردة)</Label>
                    <Select value={cstSourceId} onValueChange={setCstSourceId} disabled={!cstFromId || !cstItemId || !cstChamberId}>
                      <SelectTrigger dir="rtl">
                        <SelectValue placeholder={
                          !cstFromId || !cstItemId || !cstChamberId
                            ? "اختر العميل والصنف ومربع التبريد أولاً"
                            : cstSources.length === 0
                              ? "لا توجد فواتير متاحة"
                              : "اختر الفاتورة"
                        } />
                      </SelectTrigger>
                      <SelectContent dir="rtl">
                        {cstSources.map(s => (
                          <SelectItem key={s.movementId} value={s.movementId}>
                            {s.movementNumber} — متاح {s.remainingQuantity}{s.unit ? ` ${s.unit}` : ""} من {s.originalQuantity}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="mt-4 flex justify-start">
                  <Button onClick={() => handleSave("customers")} disabled={saving} className="bg-orange-600 hover:bg-orange-700 text-white gap-2">
                    <Save className="w-4 h-4" />{saving ? "جاري الحفظ..." : "تأكيد التحويل"} + <MessageCircle className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Recent transfers */}
      <motion.div variants={anim}>
        <Card className="border-0 shadow-sm">
          <div className="px-4 py-3 border-b"><h3 className="font-semibold text-gray-800">آخر التحويلات</h3></div>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  {["رقم التحويل","النوع","من","إلى","الكمية","التاريخ"].map(h => (
                    <th key={h} className="text-right px-4 py-2.5 text-xs font-medium text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { no: "TRF-2024-005", type: "بين ثلاجات", from: "ثلاجة المنطقة الأولى", to: "ثلاجة الحبوب", qty: 20, date: "2024-01-18" },
                  { no: "TRF-2024-004", type: "بين عملاء", from: "شركة النور", to: "مجموعة الخليج", qty: 15, date: "2024-01-17" },
                  { no: "TRF-2024-003", type: "بين ثلاجات", from: "ثلاجة اللحوم", to: "ثلاجة الخضروات", qty: 30, date: "2024-01-16" },
                ].map((t, i) => (
                  <tr key={t.no} className={i % 2 === 0 ? "bg-white border-b" : "bg-gray-50/30 border-b"}>
                    <td className="px-4 py-3 font-mono text-xs text-orange-600">{t.no}</td>
                    <td className="px-4 py-3"><span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs">{t.type}</span></td>
                    <td className="px-4 py-3 text-gray-700 text-xs">{t.from}</td>
                    <td className="px-4 py-3 text-gray-700 text-xs">{t.to}</td>
                    <td className="px-4 py-3 text-gray-700">{t.qty} طرد</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{t.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════
   MAIN MOVEMENTS PAGE
══════════════════════════════════════════════ */
type NewMovementTab = "incoming" | "outgoing" | "transfers";

const NEW_MOVEMENT_TABS: { key: NewMovementTab; label: string; icon: typeof PackagePlus; activeBg: string; activeText: string; headerBg: string; invoiceLabel: string; invoiceDesc: string }[] = [
  { key: "incoming",  label: "وارد",  icon: PackagePlus,    activeBg: "bg-green-600",  activeText: "text-white", headerBg: "bg-green-600",  invoiceLabel: "فاتورة استلام جديدة", invoiceDesc: "تسجيل البضاعة الواردة للثلاجة" },
  { key: "outgoing",  label: "منصرف", icon: PackageMinus,   activeBg: "bg-red-600",    activeText: "text-white", headerBg: "bg-red-600",    invoiceLabel: "فاتورة صرف جديدة",    invoiceDesc: "تسجيل البضاعة المنصرفة من الثلاجة" },
  { key: "transfers", label: "تحويل", icon: ArrowLeftRight, activeBg: "bg-orange-600", activeText: "text-white", headerBg: "bg-orange-600", invoiceLabel: "تحويل جديد",          invoiceDesc: "تحويل الأصناف بين الثلاجات أو العملاء" },
];

export function Movements() {
  const navigate = useNavigate();
  const [view, setView] = useState<"index" | "new">("index");
  const [newTab, setNewTab] = useState<NewMovementTab>("incoming");

  /* After save, navigate to the view page; carry WhatsApp info in state so it fires there */
  const handleSaveAndView = (id: string, waPhone?: string, waMsg?: string) =>
    navigate(`/movements/${id}`, { state: waPhone ? { waPhone, waMsg } : undefined });

  const activeMeta = NEW_MOVEMENT_TABS.find(t => t.key === newTab)!;
  const ActiveIcon = activeMeta.icon;

  /* ── INDEX VIEW ── */
  if (view === "index") {
    return (
      <div className="space-y-5" dir="rtl">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-0 shadow-sm overflow-hidden">
            <div className="bg-blue-700 px-5 py-4 text-white">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <List className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-bold">سجل الحركات</h2>
                    <p className="text-xs opacity-80">عرض وبحث وتصفية جميع الحركات</p>
                  </div>
                </div>
                <Button
                  onClick={() => setView("new")}
                  className="bg-white text-blue-700 hover:bg-blue-50 gap-2 font-semibold shadow-sm"
                >
                  <Plus className="w-4 h-4" />حركة جديدة
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
        <IndexTab />
      </div>
    );
  }

  /* ── NEW MOVEMENT VIEW ── */
  return (
    <div className="space-y-5" dir="rtl">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="border-0 shadow-sm overflow-hidden">
          <div className={cn("px-5 py-4 text-white", activeMeta.headerBg)}>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setView("index")}
                  className="w-9 h-9 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition-colors"
                  title="رجوع لسجل الحركات"
                >
                  <ChevronDown className="w-5 h-5 -rotate-90" />
                </button>
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <ActiveIcon className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold">{activeMeta.invoiceLabel}</h2>
                  <p className="text-xs opacity-80">{activeMeta.invoiceDesc}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Type tabs */}
          <div className="px-5 py-3 bg-gray-50 border-b flex items-center gap-2 overflow-x-auto">
            {NEW_MOVEMENT_TABS.map(t => {
              const TIcon = t.icon;
              return (
                <button
                  key={t.key}
                  onClick={() => setNewTab(t.key)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                    newTab === t.key
                      ? `${t.activeBg} ${t.activeText} shadow-sm`
                      : "text-gray-600 hover:bg-white",
                  )}
                >
                  <TIcon className="w-4 h-4" />{t.label}
                </button>
              );
            })}
          </div>
        </Card>
      </motion.div>

      {/* Form content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={newTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {newTab === "incoming"  && <IncomingTab onSaveAndView={handleSaveAndView} />}
          {newTab === "outgoing"  && <OutgoingTab onSaveAndView={handleSaveAndView} />}
          {newTab === "transfers" && <TransfersTab />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ══════════════════════════════════════════════
   MovementDetailPage — dedicated /movements/:id route
   Loads the movement by ID, shows MovementViewScreen directly.
══════════════════════════════════════════════ */
export function MovementDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [movement, setMovement] = useState<BackendMovement | null>(null);
  const [siblings, setSiblings] = useState<BackendMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const { confirmDelete, dialog: confirmDialog } = useConfirmDelete();

  /* Fire WhatsApp once the movement has loaded (phone+message passed via nav state) */
  useEffect(() => {
    const st = location.state as { waPhone?: string; waMsg?: string } | null;
    if (st?.waPhone && movement) {
      sendWhatsApp(st.waMsg ?? "", st.waPhone);
      window.history.replaceState({}, ""); // clear so refresh doesn't re-fire
    }
  }, [movement]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getMovement(id)
      .then(async m => {
        setMovement(m);
        const all = await getAllMovements({ pageSize: 500 });
        setSiblings(all.filter(x => baseInvoiceNo(x.movementNumber) === baseInvoiceNo(m.movementNumber) && x.isActive));
      })
      .catch(() => toast.error("فشل تحميل الحركة"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" dir="rtl">
        <p className="text-gray-400 text-sm">جاري تحميل الحركة...</p>
      </div>
    );
  }
  if (!movement) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3" dir="rtl">
        <AlertCircle className="w-10 h-10 text-gray-300" />
        <p className="text-gray-500">لم يتم العثور على الحركة</p>
        <Button onClick={() => navigate("/movements")} variant="outline" className="gap-2">
          <ArrowRight className="w-4 h-4" />العودة لسجل الحركات
        </Button>
      </div>
    );
  }

  const handleDelete = async () => {
    try {
      await deactivateMovement(movement.id);
      toast.success(`تم حذف الحركة ${movement.movementNumber}`);
      navigate("/movements");
    } catch (err: any) {
      toast.error(err?.message ?? "فشل حذف الحركة");
    }
  };

  return (
    <>
      <MovementViewScreen
        movement={movement}
        siblings={siblings}
        onBack={() => navigate("/movements")}
        onEdit={() => navigate(`/movements/${movement.id}/edit`)}
        onPrint={() => printInvoice(movement, siblings.length ? siblings : [movement])}
        onDelete={() =>
          confirmDelete(
            movement.movementNumber,
            () => { void handleDelete(); },
            { title: "حذف الحركة", description: `سيتم حذف الحركة ${movement.movementNumber} نهائياً.` },
          )
        }
      />
      {confirmDialog}
    </>
  );
}

/* ══════════════════════════════════════════════
   MovementEditPage — /movements/:id/edit
   Loads movement by ID, renders the matching form tab in edit mode.
══════════════════════════════════════════════ */
export function MovementEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [movement, setMovement] = useState<BackendMovement | null>(null);
  const [siblings, setSiblings] = useState<BackendMovement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getMovement(id)
      .then(async m => {
        setMovement(m);
        const all = await getAllMovements({ pageSize: 500 });
        setSiblings(all.filter(x => baseInvoiceNo(x.movementNumber) === baseInvoiceNo(m.movementNumber) && x.isActive));
      })
      .catch(() => toast.error("فشل تحميل الحركة للتعديل"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" dir="rtl">
        <p className="text-gray-400 text-sm">جاري تحميل الحركة...</p>
      </div>
    );
  }
  if (!movement) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3" dir="rtl">
        <AlertCircle className="w-10 h-10 text-gray-300" />
        <p className="text-gray-500">لم يتم العثور على الحركة</p>
        <Button onClick={() => navigate("/movements")} variant="outline" className="gap-2">
          <ArrowRight className="w-4 h-4" />العودة لسجل الحركات
        </Button>
      </div>
    );
  }

  const movTab = movement.movementType === "Outgoing" ? "outgoing"
    : movement.movementType === "Transfer" ? "transfers" : "incoming";
  const activeMeta = NEW_MOVEMENT_TABS.find(t => t.key === movTab)!;
  const ActiveIcon = activeMeta.icon;

  const done = () => navigate(`/movements/${movement.id}`);

  return (
    <div className="space-y-5" dir="rtl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="border-0 shadow-sm overflow-hidden">
          <div className={cn("px-5 py-4 text-white", activeMeta.headerBg)}>
            <div className="flex items-center gap-3">
              <button
                onClick={done}
                className="w-9 h-9 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition-colors"
                title="رجوع للحركة"
              >
                <ChevronDown className="w-5 h-5 -rotate-90" />
              </button>
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <ActiveIcon className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold">تعديل الحركة {movement.movementNumber}</h2>
                <p className="text-xs opacity-80">تعديل بيانات الحركة</p>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      <AnimatePresence mode="wait">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
          {movTab === "incoming" && (
            <IncomingTab
              editTarget={movement}
              editSiblings={siblings}
              onDoneEditing={done}
              onSaveAndView={newId => navigate(`/movements/${newId || movement.id}`)}
            />
          )}
          {movTab === "outgoing" && (
            <OutgoingTab
              editTarget={movement}
              editSiblings={siblings}
              onDoneEditing={done}
              onSaveAndView={newId => navigate(`/movements/${newId || movement.id}`)}
            />
          )}
          {movTab === "transfers" && <TransfersTab />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

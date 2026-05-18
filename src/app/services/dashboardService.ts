import { apiFetch } from "./api";

type ServiceResult<T> = {
  isSuccess: boolean;
  data?: T;
  errorMessages?: string[];
};

export type BackendDailyFlow = {
  date: string;
  dayLabel: string;
  incomingQty: number;
  outgoingQty: number;
};

export type BackendWarehouseOccupancy = {
  id: string;
  code: string;
  name: string;
  storageType: string;
  capacity: number;
  occupied: number;
  percentage: number;
};

export type BackendRecentMovement = {
  id: string;
  number: string;
  type: string;
  customerName: string;
  itemName: string;
  quantity: number;
  unit?: string | null;
  date: string;
};

export type BackendDashboardSummary = {
  warehousesCount: number;
  chambersCount: number;
  itemsCount: number;
  customersCount: number;
  employeesCount: number;
  movementsCount: number;

  totalStoredQuantity: number;
  totalCapacity: number;
  occupancyPercentage: number;

  incomingLast7d: number;
  outgoingLast7d: number;
  transferLast7d: number;

  dailyFlow: BackendDailyFlow[];
  warehouseOccupancy: BackendWarehouseOccupancy[];
  recentMovements: BackendRecentMovement[];
};

export async function getDashboardSummary(): Promise<BackendDashboardSummary> {
  const res = await apiFetch<ServiceResult<BackendDashboardSummary>>("/Dashboard/GetSummary");
  if (!res.isSuccess) throw new Error(res.errorMessages?.[0] ?? "فشل تحميل لوحة التحكم");
  return res.data as BackendDashboardSummary;
}

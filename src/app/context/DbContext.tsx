import { createContext, useContext, useState, type ReactNode } from "react";
import {
  warehouses    as _warehouses,
  chambers      as _chambers,
  customers     as _customers,
  customerDrivers  as _customerDrivers,
  customerPricing  as _customerPricing,
  customerItems    as _customerItems,
  customerContacts as _customerContacts,
  employees     as _employees,
  items         as _items,
  packages      as _packages,
  transactions  as _transactions,
  receipts      as _receipts,
  tasks         as _tasks,
  auditLogs     as _auditLogs,
  inventory     as _inventory,
} from "../data/mockData";

/* ── infer types from data arrays ── */
type Warehouse       = typeof _warehouses[0];
type Chamber         = typeof _chambers[0];
type Customer        = typeof _customers[0];
type CustomerDriver  = typeof _customerDrivers[0];
type CustomerPrice   = typeof _customerPricing[0];
type CustomerItem    = typeof _customerItems[0];
type CustomerContact = typeof _customerContacts[0];
type Employee       = typeof _employees[0];
type Item           = typeof _items[0];
type Package        = typeof _packages[0];
type Transaction    = typeof _transactions[0];
type Receipt        = typeof _receipts[0];
type Task           = typeof _tasks[0];
type AuditLog       = typeof _auditLogs[0];
type InventoryRow   = typeof _inventory[0];

/* ── Extended Customer with optional image ── */
export type CustomerExt = Customer & { image?: string };

/* ── generic CRUD helpers ── */
function makeId<T extends { id: number }>(list: T[]): number {
  return list.length > 0 ? Math.max(...list.map(x => x.id)) + 1 : 1;
}

/* ═══════════════════════════════════════════════
   Context type
═══════════════════════════════════════════════ */
interface DbCtx {
  /* Warehouses */
  warehouses: Warehouse[];
  addWarehouse:    (w: Omit<Warehouse, "id">) => void;
  updateWarehouse: (id: number, patch: Partial<Warehouse>) => void;
  deleteWarehouse: (id: number) => void;

  /* Chambers */
  chambers: Chamber[];
  addChamber:    (c: Omit<Chamber, "id">) => void;
  updateChamber: (id: number, patch: Partial<Chamber>) => void;
  deleteChamber: (id: number) => void;

  /* Customers */
  customers: CustomerExt[];
  addCustomer:    (c: Omit<CustomerExt, "id">) => void;
  updateCustomer: (id: number, patch: Partial<CustomerExt>) => void;
  deleteCustomer: (id: number) => void;

  /* Customer sub-tables */
  customerDrivers: CustomerDriver[];
  addCustomerDriver:    (d: Omit<CustomerDriver, "id">) => void;
  updateCustomerDriver: (id: number, patch: Partial<CustomerDriver>) => void;
  deleteCustomerDriver: (id: number) => void;

  customerContacts: CustomerContact[];
  addCustomerContact:    (c: Omit<CustomerContact, "id">) => void;
  updateCustomerContact: (id: number, patch: Partial<CustomerContact>) => void;
  deleteCustomerContact: (id: number) => void;

  customerPricing: CustomerPrice[];
  addCustomerPrice:    (p: Omit<CustomerPrice, "id">) => void;
  updateCustomerPrice: (id: number, patch: Partial<CustomerPrice>) => void;
  deleteCustomerPrice: (id: number) => void;

  customerItems: CustomerItem[];
  addCustomerItem:    (ci: Omit<CustomerItem, "id">) => void;
  updateCustomerItem: (id: number, patch: Partial<CustomerItem>) => void;
  deleteCustomerItem: (id: number) => void;

  /* Employees */
  employees: Employee[];
  addEmployee:    (e: Omit<Employee, "id">) => void;
  updateEmployee: (id: number, patch: Partial<Employee>) => void;
  deleteEmployee: (id: number) => void;

  /* Items */
  items: Item[];
  addItem:    (i: Omit<Item, "id">) => void;
  updateItem: (id: number, patch: Partial<Item>) => void;
  deleteItem: (id: number) => void;

  /* Packages */
  packages: Package[];
  addPackage:    (p: Omit<Package, "id">) => void;
  updatePackage: (id: number, patch: Partial<Package>) => void;
  deletePackage: (id: number) => void;

  /* Transactions */
  transactions: Transaction[];
  addTransaction: (t: Omit<Transaction, "id">) => void;
  deleteTransaction: (id: number) => void;

  /* Receipts */
  receipts: Receipt[];
  addReceipt:    (r: Omit<Receipt, "id">) => void;
  updateReceipt: (id: number, patch: Partial<Receipt>) => void;
  deleteReceipt: (id: number) => void;

  /* Tasks */
  tasks: Task[];
  addTask:    (t: Omit<Task, "id">) => void;
  updateTask: (id: number, patch: Partial<Task>) => void;
  deleteTask: (id: number) => void;

  /* Audit Log */
  auditLogs: AuditLog[];
  addAuditLog: (l: Omit<AuditLog, "id">) => void;

  /* Inventory */
  inventory: InventoryRow[];
  updateInventory: (id: number, patch: Partial<InventoryRow>) => void;
}

/* ═══════════════════════════════════════════════
   Context
═══════════════════════════════════════════════ */
const DbContext = createContext<DbCtx | null>(null);

/** Generic state helpers to reduce boilerplate */
function useEntityState<T extends { id: number }>(initial: T[]) {
  const [list, setList] = useState<T[]>(initial);

  const add = (item: Omit<T, "id">) =>
    setList(prev => [...prev, { ...item, id: makeId(prev) } as unknown as T]);

  const update = (id: number, patch: Partial<T>) =>
    setList(prev => prev.map(x => x.id === id ? { ...x, ...patch } : x));

  const remove = (id: number) =>
    setList(prev => prev.filter(x => x.id !== id));

  return { list, add, update, remove, setList };
}

/* ═══════════════════════════════════════════════
   Provider
═══════════════════════════════════════════════ */
export function DbProvider({ children }: { children: ReactNode }) {
  const wh    = useEntityState<Warehouse>(_warehouses);
  const ch    = useEntityState<Chamber>(_chambers);
  const cust  = useEntityState<CustomerExt>(_customers as CustomerExt[]);
  const cd    = useEntityState<CustomerDriver>(_customerDrivers);
  const cp    = useEntityState<CustomerPrice>(_customerPricing);
  const ci    = useEntityState<CustomerItem>(_customerItems);
  const cc    = useEntityState<CustomerContact>(_customerContacts);
  const emp   = useEntityState<Employee>(_employees);
  const itm   = useEntityState<Item>(_items);
  const pkg   = useEntityState<Package>(_packages);
  const tx    = useEntityState<Transaction>(_transactions);
  const rec   = useEntityState<Receipt>(_receipts);
  const tsk   = useEntityState<Task>(_tasks);
  const audit = useEntityState<AuditLog>(_auditLogs);
  const inv   = useEntityState<InventoryRow>(_inventory);

  const value: DbCtx = {
    /* Warehouses */
    warehouses:      wh.list,
    addWarehouse:    wh.add,
    updateWarehouse: wh.update,
    deleteWarehouse: wh.remove,

    /* Chambers */
    chambers:      ch.list,
    addChamber:    ch.add,
    updateChamber: ch.update,
    deleteChamber: ch.remove,

    /* Customers */
    customers:      cust.list,
    addCustomer:    cust.add,
    updateCustomer: cust.update,
    deleteCustomer: cust.remove,

    /* Customer sub-tables */
    customerDrivers:      cd.list,
    addCustomerDriver:    cd.add,
    updateCustomerDriver: cd.update,
    deleteCustomerDriver: cd.remove,

    customerContacts:      cc.list,
    addCustomerContact:    cc.add,
    updateCustomerContact: cc.update,
    deleteCustomerContact: cc.remove,

    customerPricing:      cp.list,
    addCustomerPrice:     cp.add,
    updateCustomerPrice:  cp.update,
    deleteCustomerPrice:  cp.remove,

    customerItems:      ci.list,
    addCustomerItem:    ci.add,
    updateCustomerItem: ci.update,
    deleteCustomerItem: ci.remove,

    /* Employees */
    employees:      emp.list,
    addEmployee:    emp.add,
    updateEmployee: emp.update,
    deleteEmployee: emp.remove,

    /* Items */
    items:      itm.list,
    addItem:    itm.add,
    updateItem: itm.update,
    deleteItem: itm.remove,

    /* Packages */
    packages:      pkg.list,
    addPackage:    pkg.add,
    updatePackage: pkg.update,
    deletePackage: pkg.remove,

    /* Transactions */
    transactions:   tx.list,
    addTransaction: tx.add,
    deleteTransaction: tx.remove,

    /* Receipts */
    receipts:      rec.list,
    addReceipt:    rec.add,
    updateReceipt: rec.update,
    deleteReceipt: rec.remove,

    /* Tasks */
    tasks:      tsk.list,
    addTask:    tsk.add,
    updateTask: tsk.update,
    deleteTask: tsk.remove,

    /* Audit Log */
    auditLogs:   audit.list,
    addAuditLog: audit.add,

    /* Inventory */
    inventory:       inv.list,
    updateInventory: inv.update,
  };

  return <DbContext.Provider value={value}>{children}</DbContext.Provider>;
}

export function useDb() {
  const ctx = useContext(DbContext);
  if (!ctx) throw new Error("useDb must be inside DbProvider");
  return ctx;
}

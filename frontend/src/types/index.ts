// === Типы техники ===

export type EquipmentType = 'pc' | 'laptop' | 'monoblock' | 'printer' | 'mfp' | 'router' | 'switch';

export const EQUIPMENT_TYPE_LABELS: Record<EquipmentType, string> = {
  pc: 'ПК',
  laptop: 'Ноутбук',
  monoblock: 'Моноблок',
  printer: 'Принтер',
  mfp: 'МФУ',
  router: 'Маршрутизатор',
  switch: 'Коммутатор',
};

export const ALL_EQUIPMENT_TYPES: EquipmentType[] = [
  'pc', 'laptop', 'monoblock', 'printer', 'mfp', 'router', 'switch',
];

// === Типы комплектующих ===

export type ComponentType = 'ram' | 'ssd' | 'hdd' | 'gpu' | 'psu' | 'nic' | 'motherboard' | 'cpu' | 'optical' | 'controller' | 'monitor' | 'ups';

export const COMPONENT_TYPE_LABELS: Record<ComponentType, string> = {
  ram: 'Оперативная память',
  ssd: 'SSD-накопитель',
  hdd: 'Жёсткий диск (HDD)',
  gpu: 'Видеокарта',
  psu: 'Блок питания',
  nic: 'Сетевая карта',
  motherboard: 'Материнская плата',
  cpu: 'Процессор',
  optical: 'Оптический привод',
  controller: 'Контроллер (RAID и др.)',
  monitor: 'Монитор',
  ups: 'ИБП',
};

export const ALL_COMPONENT_TYPES: ComponentType[] = [
  'ram', 'ssd', 'hdd', 'gpu', 'psu', 'nic', 'motherboard', 'cpu', 'optical', 'controller', 'monitor', 'ups',
];

// === Модели данных ===

export interface CommonFields {
  startYear: string;
  model: string;
  serialNumber: string;
}

export interface Component {
  id: string;
  type: ComponentType;
  name: string;
  inventoryNumber?: string;
  serialNumber?: string;
  specifications?: Record<string, unknown>;
}

export interface Equipment {
  id: string;
  type: EquipmentType;
  inventoryNumber: string;
  responsibleUserId: string;
  roomId: string;
  commissionDate: string;
  notes: string;
  ipMode: string;
  ipAddress: string;
  commonFields: CommonFields;
  specificFields: Record<string, unknown>;
  components: Component[];
}

export interface Department {
  id: string;
  name: string;
}

export interface ResponsibleUser {
  id: string;
  lastName: string;
  firstName: string;
  patronymic: string;
  departmentId: string;
}

export interface Building {
  name: string;
  floors: number[];
}

export interface Room {
  id: string;
  floor: number;
  number: string;
}

export interface FloorPlanRoom {
  roomId: string;
  shape: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
}

export interface FloorPlan {
  floor: number;
  width: number;
  height: number;
  rooms: FloorPlanRoom[];
}

export interface License {
  id: string;
  softwareName: string;
  licenseKey: string;
  licenseType: 'perpetual' | 'subscription';
  userId: string;
  purchaseDate?: string;
  expirationDate?: string;
  quantity: number;
  notes?: string;
}

export interface DataStore {
  version: number;
  lastModified: string;
  modifiedBy: string;
  building: Building;
  departments: Department[];
  responsibleUsers: ResponsibleUser[];
  rooms: Room[];
  floorPlans: FloorPlan[];
  equipment: Equipment[];
  licenses: License[];
}

// === Конфигурация ===

export interface AppConfig {
  dataFilePath: string;
  passwordHash: string;
  autoRefreshIntervalSec: number;
  editSessionTimeoutMin: number;
}

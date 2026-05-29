package models

// EquipmentType определяет тип техники
type EquipmentType string

const (
	EquipmentTypePC        EquipmentType = "pc"
	EquipmentTypeLaptop    EquipmentType = "laptop"
	EquipmentTypeMonoblock EquipmentType = "monoblock"
	EquipmentTypePrinter   EquipmentType = "printer"
	EquipmentTypeMFP       EquipmentType = "mfp"
	EquipmentTypeRouter    EquipmentType = "router"
	EquipmentTypeSwitch    EquipmentType = "switch"
)

// EquipmentTypeLabels — русские названия типов техники
var EquipmentTypeLabels = map[EquipmentType]string{
	EquipmentTypePC:        "ПК",
	EquipmentTypeLaptop:    "Ноутбук",
	EquipmentTypeMonoblock: "Моноблок",
	EquipmentTypePrinter:   "Принтер",
	EquipmentTypeMFP:       "МФУ",
	EquipmentTypeRouter:    "Маршрутизатор",
	EquipmentTypeSwitch:    "Коммутатор",
}

// AllEquipmentTypes — все допустимые типы техники
var AllEquipmentTypes = []EquipmentType{
	EquipmentTypePC, EquipmentTypeLaptop, EquipmentTypeMonoblock,
	EquipmentTypePrinter, EquipmentTypeMFP,
	EquipmentTypeRouter, EquipmentTypeSwitch,
}

// CommonFields — общие поля для всех типов техники
type CommonFields struct {
	StartYear    string `json:"startYear"`
	Model        string `json:"model"`
	SerialNumber string `json:"serialNumber"`
}

// Equipment — единица техники
type Equipment struct {
	ID                string                 `json:"id"`
	Type              EquipmentType          `json:"type"`
	InventoryNumber   string                 `json:"inventoryNumber"`
	ResponsibleUserID string                 `json:"responsibleUserId"`
	RoomID            string                 `json:"roomId"`
	CommissionDate    string                 `json:"commissionDate"`
	Notes             string                 `json:"notes"`
	IPMode            string                 `json:"ipMode"`
	IPAddress         string                 `json:"ipAddress"`
	InRepair          bool                   `json:"inRepair"`
	RepairDate        string                 `json:"repairDate"`
	CommonFields      CommonFields           `json:"commonFields"`
	SpecificFields    map[string]interface{} `json:"specificFields"`
	Components        []Component            `json:"components"`
}

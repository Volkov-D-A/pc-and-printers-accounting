package models

// ComponentType определяет тип комплектующего
type ComponentType string

const (
	ComponentTypeRAM         ComponentType = "ram"
	ComponentTypeSSD         ComponentType = "ssd"
	ComponentTypeHDD         ComponentType = "hdd"
	ComponentTypeGPU         ComponentType = "gpu"
	ComponentTypePSU         ComponentType = "psu"
	ComponentTypeNIC         ComponentType = "nic"
	ComponentTypeMotherboard ComponentType = "motherboard"
	ComponentTypeCPU         ComponentType = "cpu"
	ComponentTypeOptical     ComponentType = "optical"
	ComponentTypeController  ComponentType = "controller"
)

// ComponentTypeLabels — русские названия типов комплектующих
var ComponentTypeLabels = map[ComponentType]string{
	ComponentTypeRAM:         "Оперативная память",
	ComponentTypeSSD:         "SSD-накопитель",
	ComponentTypeHDD:         "Жёсткий диск (HDD)",
	ComponentTypeGPU:         "Видеокарта",
	ComponentTypePSU:         "Блок питания",
	ComponentTypeNIC:         "Сетевая карта",
	ComponentTypeMotherboard: "Материнская плата",
	ComponentTypeCPU:         "Процессор",
	ComponentTypeOptical:     "Оптический привод",
	ComponentTypeController:  "Контроллер (RAID и др.)",
}

// AllComponentTypes — все допустимые типы комплектующих
var AllComponentTypes = []ComponentType{
	ComponentTypeRAM, ComponentTypeSSD, ComponentTypeHDD,
	ComponentTypeGPU, ComponentTypePSU, ComponentTypeNIC,
	ComponentTypeMotherboard, ComponentTypeCPU,
	ComponentTypeOptical, ComponentTypeController,
}

// Component — комплектующее, привязанное к технике
type Component struct {
	ID              string                 `json:"id"`
	Type            ComponentType          `json:"type"`
	Name            string                 `json:"name"`
	InventoryNumber string                 `json:"inventoryNumber,omitempty"`
	SerialNumber    string                 `json:"serialNumber,omitempty"`
	Specifications  map[string]interface{} `json:"specifications,omitempty"`
}

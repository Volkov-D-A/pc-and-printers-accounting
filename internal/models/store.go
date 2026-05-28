package models

// DataStore — корневая структура JSON-файла данных
type DataStore struct {
	Version    int               `json:"version"`
	ModifiedAt string            `json:"lastModified"`
	ModifiedBy string            `json:"modifiedBy"`
	Building   Building          `json:"building"`
	Departments []Department     `json:"departments"`
	Users      []ResponsibleUser `json:"responsibleUsers"`
	Rooms      []Room            `json:"rooms"`
	FloorPlans []FloorPlan       `json:"floorPlans"`
	Equipment  []Equipment       `json:"equipment"`
	Licenses   []License         `json:"licenses"`
}

// NewDefaultDataStore создаёт пустое хранилище с настройками по умолчанию
func NewDefaultDataStore() *DataStore {
	return &DataStore{
		Version: 1,
		Building: Building{
			Name:   "Главный корпус",
			Floors: []int{0, 1, 2},
		},
		Departments: []Department{},
		Users:       []ResponsibleUser{},
		Rooms:       []Room{},
		FloorPlans: []FloorPlan{
			{Floor: 0, Width: 1200, Height: 800, Rooms: []FloorPlanRoom{}},
			{Floor: 1, Width: 1200, Height: 800, Rooms: []FloorPlanRoom{}},
			{Floor: 2, Width: 1200, Height: 800, Rooms: []FloorPlanRoom{}},
		},
		Equipment: []Equipment{},
		Licenses:  []License{},
	}
}

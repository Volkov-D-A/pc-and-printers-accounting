package models

// FloorPlanRoom — визуальное представление кабинета на плане этажа (SVG-прямоугольник)
type FloorPlanRoom struct {
	RoomID string  `json:"roomId"`
	Shape  string  `json:"shape"` // "rect"
	X      float64 `json:"x"`
	Y      float64 `json:"y"`
	Width  float64 `json:"width"`
	Height float64 `json:"height"`
	Color  string  `json:"color"`
}

// FloorPlan — план одного этажа
type FloorPlan struct {
	Floor  int             `json:"floor"`
	Width  float64         `json:"width"`
	Height float64         `json:"height"`
	Rooms  []FloorPlanRoom `json:"rooms"`
}

package models

// Building — здание (одно в текущей конфигурации)
type Building struct {
	Name   string `json:"name"`
	Floors []int  `json:"floors"` // [0, 1, 2]
}

// Room — кабинет
type Room struct {
	ID     string `json:"id"`
	Floor  int    `json:"floor"`
	Number string `json:"number"`
}

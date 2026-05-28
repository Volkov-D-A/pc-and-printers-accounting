package models

// Department — подразделение организации
type Department struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

// ResponsibleUser — ответственный пользователь (ФИО + подразделение)
type ResponsibleUser struct {
	ID           string `json:"id"`
	LastName     string `json:"lastName"`
	FirstName    string `json:"firstName"`
	Patronymic   string `json:"patronymic"`
	DepartmentID string `json:"departmentId"`
}

// FullName возвращает полное ФИО пользователя
func (u *ResponsibleUser) FullName() string {
	return u.LastName + " " + u.FirstName + " " + u.Patronymic
}

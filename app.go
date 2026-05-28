package main

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/google/uuid"
	"github.com/xuri/excelize/v2"
	wailsRuntime "github.com/wailsapp/wails/v2/pkg/runtime"

	"pc-and-printers-accounting/internal/auth"
	"pc-and-printers-accounting/internal/config"
	"pc-and-printers-accounting/internal/models"
	"pc-and-printers-accounting/internal/storage"
)

// App — основная структура приложения с Wails-биндингами
type App struct {
	ctx       context.Context
	store     *storage.JSONStore
	editMode  bool
	stopTimer chan struct{}
}

// NewApp создаёт новый экземпляр приложения
func NewApp() *App {
	return &App{
		stopTimer: make(chan struct{}),
	}
}

// startup вызывается при запуске приложения
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx

	// Загружаем конфигурацию
	cfg, err := config.Load()
	if err != nil {
		log.Printf("Ошибка загрузки конфигурации: %v", err)
	}

	// Если указан путь к файлу данных — загружаем
	if cfg != nil && cfg.HasDataFile() {
		a.store = storage.NewJSONStore(cfg.DataFilePath)
		if _, err := a.store.Load(); err != nil {
			log.Printf("Ошибка загрузки данных: %v", err)
		}
		// Запускаем фоновый мониторинг изменений
		go a.watchForUpdates()
	}
}

// shutdown вызывается при закрытии приложения
func (a *App) shutdown(ctx context.Context) {
	close(a.stopTimer)
}

// watchForUpdates периодически проверяет изменения в файле данных
func (a *App) watchForUpdates() {
	cfg := config.Get()
	interval := time.Duration(cfg.AutoRefreshIntervalSec) * time.Second
	if interval <= 0 {
		interval = 30 * time.Second
	}
	ticker := time.NewTicker(interval)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			if a.store == nil || a.editMode {
				continue
			}
			changed, err := a.store.CheckForUpdates()
			if err != nil {
				log.Printf("Ошибка проверки обновлений: %v", err)
				continue
			}
			if changed {
				wailsRuntime.EventsEmit(a.ctx, "data:updated")
			}
		case <-a.stopTimer:
			return
		}
	}
}

// --- Конфигурация ---

// GetConfig возвращает текущую конфигурацию
func (a *App) GetConfig() *config.Config {
	return config.Get()
}

// IsFirstRun проверяет, первый ли это запуск (пароль не задан)
func (a *App) IsFirstRun() bool {
	cfg := config.Get()
	return cfg == nil || cfg.IsFirstRun()
}

// HasDataFile проверяет, настроен ли путь к файлу данных
func (a *App) HasDataFile() bool {
	cfg := config.Get()
	return cfg != nil && cfg.HasDataFile()
}

// SetDataFilePath устанавливает путь к файлу данных
func (a *App) SetDataFilePath(path string) error {
	cfg := config.Get()
	cfg.DataFilePath = path
	if err := config.Save(cfg); err != nil {
		return err
	}

	// Загружаем или создаём данные
	a.store = storage.NewJSONStore(path)
	_, err := a.store.Load()
	return err
}

// SelectDataFile открывает системный диалог выбора файла
func (a *App) SelectDataFile() (string, error) {
	path, err := wailsRuntime.OpenFileDialog(a.ctx, wailsRuntime.OpenDialogOptions{
		Title: "Выберите файл данных",
		Filters: []wailsRuntime.FileFilter{
			{DisplayName: "JSON файлы", Pattern: "*.json"},
		},
	})
	return path, err
}

// SelectNewDataFile открывает диалог сохранения нового файла
func (a *App) SelectNewDataFile() (string, error) {
	path, err := wailsRuntime.SaveFileDialog(a.ctx, wailsRuntime.SaveDialogOptions{
		Title:           "Создать файл данных",
		DefaultFilename: "data.json",
		Filters: []wailsRuntime.FileFilter{
			{DisplayName: "JSON файлы", Pattern: "*.json"},
		},
	})
	return path, err
}

// --- Аутентификация ---

// SetupPassword устанавливает пароль при первом запуске
func (a *App) SetupPassword(password string) error {
	return auth.SetPassword(password)
}

// Authenticate проверяет пароль и включает режим редактирования
func (a *App) Authenticate(password string) error {
	if err := auth.VerifyPassword(password); err != nil {
		return err
	}
	a.editMode = true
	wailsRuntime.EventsEmit(a.ctx, "auth:editModeChanged", true)
	return nil
}

// ExitEditMode выходит из режима редактирования
func (a *App) ExitEditMode() {
	a.editMode = false
	wailsRuntime.EventsEmit(a.ctx, "auth:editModeChanged", false)
}

// IsEditMode возвращает текущий режим (просмотр/редактирование)
func (a *App) IsEditMode() bool {
	return a.editMode
}

// ChangePassword меняет пароль
func (a *App) ChangePassword(oldPassword, newPassword string) error {
	return auth.ChangePassword(oldPassword, newPassword)
}

// --- Данные ---

// GetAllData возвращает все данные
func (a *App) GetAllData() (*models.DataStore, error) {
	if a.store == nil {
		return nil, nil
	}
	return a.store.GetData(), nil
}

// ReloadData принудительно перезагружает данные из файла
func (a *App) ReloadData() (*models.DataStore, error) {
	if a.store == nil {
		return nil, nil
	}
	return a.store.Reload()
}

// --- CRUD Техники ---

// GetEquipment возвращает единицу техники по ID
func (a *App) GetEquipment(id string) *models.Equipment {
	data := a.store.GetData()
	for i := range data.Equipment {
		if data.Equipment[i].ID == id {
			return &data.Equipment[i]
		}
	}
	return nil
}

// AddEquipment добавляет новую единицу техники
func (a *App) AddEquipment(eq models.Equipment) error {
	if !a.editMode {
		return ErrReadOnly
	}
	data := a.store.GetData()
	eq.ID = uuid.New().String()
	if eq.Components == nil {
		eq.Components = []models.Component{}
	}
	if eq.SpecificFields == nil {
		eq.SpecificFields = make(map[string]interface{})
	}
	data.Equipment = append(data.Equipment, eq)
	return a.store.Save(data)
}

// UpdateEquipment обновляет единицу техники
func (a *App) UpdateEquipment(eq models.Equipment) error {
	if !a.editMode {
		return ErrReadOnly
	}
	data := a.store.GetData()
	for i := range data.Equipment {
		if data.Equipment[i].ID == eq.ID {
			data.Equipment[i] = eq
			return a.store.Save(data)
		}
	}
	return ErrNotFound
}

// DeleteEquipment удаляет единицу техники
func (a *App) DeleteEquipment(id string) error {
	if !a.editMode {
		return ErrReadOnly
	}
	data := a.store.GetData()
	for i := range data.Equipment {
		if data.Equipment[i].ID == id {
			data.Equipment = append(data.Equipment[:i], data.Equipment[i+1:]...)
			return a.store.Save(data)
		}
	}
	return ErrNotFound
}

// --- CRUD Подразделения ---

// AddDepartment добавляет подразделение
func (a *App) AddDepartment(dept models.Department) error {
	if !a.editMode {
		return ErrReadOnly
	}
	data := a.store.GetData()
	dept.ID = uuid.New().String()
	data.Departments = append(data.Departments, dept)
	return a.store.Save(data)
}

// UpdateDepartment обновляет подразделение
func (a *App) UpdateDepartment(dept models.Department) error {
	if !a.editMode {
		return ErrReadOnly
	}
	data := a.store.GetData()
	for i := range data.Departments {
		if data.Departments[i].ID == dept.ID {
			data.Departments[i] = dept
			return a.store.Save(data)
		}
	}
	return ErrNotFound
}

// DeleteDepartment удаляет подразделение
func (a *App) DeleteDepartment(id string) error {
	if !a.editMode {
		return ErrReadOnly
	}
	data := a.store.GetData()
	for i := range data.Departments {
		if data.Departments[i].ID == id {
			data.Departments = append(data.Departments[:i], data.Departments[i+1:]...)
			return a.store.Save(data)
		}
	}
	return ErrNotFound
}

// --- CRUD Пользователи ---

// AddUser добавляет ответственного пользователя
func (a *App) AddUser(user models.ResponsibleUser) error {
	if !a.editMode {
		return ErrReadOnly
	}
	data := a.store.GetData()
	user.ID = uuid.New().String()
	data.Users = append(data.Users, user)
	return a.store.Save(data)
}

// UpdateUser обновляет ответственного пользователя
func (a *App) UpdateUser(user models.ResponsibleUser) error {
	if !a.editMode {
		return ErrReadOnly
	}
	data := a.store.GetData()
	for i := range data.Users {
		if data.Users[i].ID == user.ID {
			data.Users[i] = user
			return a.store.Save(data)
		}
	}
	return ErrNotFound
}

// DeleteUser удаляет ответственного пользователя
func (a *App) DeleteUser(id string) error {
	if !a.editMode {
		return ErrReadOnly
	}
	data := a.store.GetData()
	for i := range data.Users {
		if data.Users[i].ID == id {
			data.Users = append(data.Users[:i], data.Users[i+1:]...)
			return a.store.Save(data)
		}
	}
	return ErrNotFound
}

// --- CRUD Кабинеты ---

// AddRoom добавляет кабинет
func (a *App) AddRoom(room models.Room) error {
	if !a.editMode {
		return ErrReadOnly
	}
	data := a.store.GetData()
	room.ID = uuid.New().String()
	data.Rooms = append(data.Rooms, room)
	return a.store.Save(data)
}

// UpdateRoom обновляет кабинет
func (a *App) UpdateRoom(room models.Room) error {
	if !a.editMode {
		return ErrReadOnly
	}
	data := a.store.GetData()
	for i := range data.Rooms {
		if data.Rooms[i].ID == room.ID {
			data.Rooms[i] = room
			return a.store.Save(data)
		}
	}
	return ErrNotFound
}

// DeleteRoom удаляет кабинет
func (a *App) DeleteRoom(id string) error {
	if !a.editMode {
		return ErrReadOnly
	}
	data := a.store.GetData()
	for i := range data.Rooms {
		if data.Rooms[i].ID == id {
			data.Rooms = append(data.Rooms[:i], data.Rooms[i+1:]...)
			return a.store.Save(data)
		}
	}
	return ErrNotFound
}

// --- CRUD Лицензии ---

// AddLicense добавляет лицензию
func (a *App) AddLicense(lic models.License) error {
	if !a.editMode {
		return ErrReadOnly
	}
	data := a.store.GetData()
	lic.ID = uuid.New().String()
	data.Licenses = append(data.Licenses, lic)
	return a.store.Save(data)
}

// UpdateLicense обновляет лицензию
func (a *App) UpdateLicense(lic models.License) error {
	if !a.editMode {
		return ErrReadOnly
	}
	data := a.store.GetData()
	for i := range data.Licenses {
		if data.Licenses[i].ID == lic.ID {
			data.Licenses[i] = lic
			return a.store.Save(data)
		}
	}
	return ErrNotFound
}

// DeleteLicense удаляет лицензию
func (a *App) DeleteLicense(id string) error {
	if !a.editMode {
		return ErrReadOnly
	}
	data := a.store.GetData()
	for i := range data.Licenses {
		if data.Licenses[i].ID == id {
			data.Licenses = append(data.Licenses[:i], data.Licenses[i+1:]...)
			return a.store.Save(data)
		}
	}
	return ErrNotFound
}

// --- Поэтажный план ---

// UpdateFloorPlan обновляет план этажа
func (a *App) UpdateFloorPlan(plan models.FloorPlan) error {
	if !a.editMode {
		return ErrReadOnly
	}
	data := a.store.GetData()
	for i := range data.FloorPlans {
		if data.FloorPlans[i].Floor == plan.Floor {
			data.FloorPlans[i] = plan
			return a.store.Save(data)
		}
	}
	// Если план для этажа не найден — добавляем
	data.FloorPlans = append(data.FloorPlans, plan)
	return a.store.Save(data)
}

// --- Справочники (типы техники и комплектующих) ---

// GetEquipmentTypes возвращает все типы техники с русскими названиями
func (a *App) GetEquipmentTypes() map[models.EquipmentType]string {
	return models.EquipmentTypeLabels
}

// GetComponentTypes возвращает все типы комплектующих с русскими названиями
func (a *App) GetComponentTypes() map[models.ComponentType]string {
	return models.ComponentTypeLabels
}

// --- Экспорт отчётов ---

// ExportReportToXLSX экспортирует отфильтрованные данные в Excel
func (a *App) ExportReportToXLSX(equipmentIDs []string) (string, error) {
	savePath, err := wailsRuntime.SaveFileDialog(a.ctx, wailsRuntime.SaveDialogOptions{
		Title:           "Сохранить отчёт",
		DefaultFilename: "report.xlsx",
		Filters: []wailsRuntime.FileFilter{
			{DisplayName: "Excel файлы", Pattern: "*.xlsx"},
		},
	})
	if err != nil {
		return "", err
	}
	if savePath == "" {
		return "", nil
	}

	data := a.store.GetData()
	
	// Create a new Excel file
	f := excelize.NewFile()
	defer func() {
		if err := f.Close(); err != nil {
			fmt.Println(err)
		}
	}()

	sheetName := "Техника"
	index, err := f.NewSheet(sheetName)
	if err != nil {
		return "", err
	}

	// Set headers
	headers := []string{"Инвентарный №", "Тип", "Год начала", "Модель", "Серийный №", "Кабинет", "Ответственный"}
	for i, header := range headers {
		cell, _ := excelize.CoordinatesToCellName(i+1, 1)
		f.SetCellValue(sheetName, cell, header)
	}

	// Set style for header
	style, err := f.NewStyle(&excelize.Style{
		Font: &excelize.Font{Bold: true},
	})
	if err == nil {
		f.SetRowStyle(sheetName, 1, 1, style)
	}

	// Map equipmentIDs to a set for fast lookup
	idMap := make(map[string]bool)
	for _, id := range equipmentIDs {
		idMap[id] = true
	}

	row := 2
	for _, eq := range data.Equipment {
		if len(equipmentIDs) > 0 && !idMap[eq.ID] {
			continue
		}

		roomStr := ""
		for _, r := range data.Rooms {
			if r.ID == eq.RoomID {
				roomStr = r.Number
				break
			}
		}

		userStr := ""
		for _, u := range data.Users {
			if u.ID == eq.ResponsibleUserID {
				userStr = u.LastName + " " + u.FirstName
				break
			}
		}

		f.SetCellValue(sheetName, fmt.Sprintf("A%d", row), eq.InventoryNumber)
		f.SetCellValue(sheetName, fmt.Sprintf("B%d", row), models.EquipmentTypeLabels[eq.Type])
		f.SetCellValue(sheetName, fmt.Sprintf("C%d", row), eq.CommonFields.StartYear)
		f.SetCellValue(sheetName, fmt.Sprintf("D%d", row), eq.CommonFields.Model)
		f.SetCellValue(sheetName, fmt.Sprintf("E%d", row), eq.CommonFields.SerialNumber)
		f.SetCellValue(sheetName, fmt.Sprintf("F%d", row), roomStr)
		f.SetCellValue(sheetName, fmt.Sprintf("G%d", row), userStr)
		
		row++
	}

	f.SetActiveSheet(index)

	if err := f.SaveAs(savePath); err != nil {
		return "", err
	}

	return savePath, nil
}

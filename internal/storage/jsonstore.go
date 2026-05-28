package storage

import (
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"sync"
	"time"

	"pc-and-printers-accounting/internal/models"
)

var (
	ErrVersionConflict = errors.New("данные были изменены другим пользователем, перезагрузите данные")
	ErrLockFailed      = errors.New("не удалось получить блокировку файла данных")
	ErrLockExists      = errors.New("файл данных заблокирован другим пользователем")
)

const (
	lockTimeout = 60 * time.Second // Время жизни lock-файла до автоудаления
)

// JSONStore управляет чтением/записью JSON-файла с блокировкой
type JSONStore struct {
	filePath string
	mu       sync.RWMutex
	data     *models.DataStore
	version  int
}

// NewJSONStore создаёт новый экземпляр хранилища
func NewJSONStore(filePath string) *JSONStore {
	return &JSONStore{
		filePath: filePath,
	}
}

// lockFilePath возвращает путь к lock-файлу
func (s *JSONStore) lockFilePath() string {
	return s.filePath + ".lock"
}

// acquireLock создаёт lock-файл для эксклюзивного доступа к записи
func (s *JSONStore) acquireLock() error {
	lockPath := s.lockFilePath()

	// Проверяем существующую блокировку
	info, err := os.Stat(lockPath)
	if err == nil {
		// Lock-файл существует — проверяем, не устарел ли он
		if time.Since(info.ModTime()) > lockTimeout {
			// Устаревший lock-файл — удаляем
			if removeErr := os.Remove(lockPath); removeErr != nil {
				return fmt.Errorf("%w: не удалось удалить устаревший lock-файл: %v", ErrLockFailed, removeErr)
			}
		} else {
			return ErrLockExists
		}
	}

	// Создаём lock-файл с информацией о процессе
	hostname, _ := os.Hostname()
	lockData := fmt.Sprintf("pid=%d\nhost=%s\ntime=%s\n", os.Getpid(), hostname, time.Now().Format(time.RFC3339))

	// O_CREATE|O_EXCL — атомарное создание, фейлим если файл уже существует
	f, err := os.OpenFile(lockPath, os.O_CREATE|os.O_EXCL|os.O_WRONLY, 0600)
	if err != nil {
		if os.IsExist(err) {
			return ErrLockExists
		}
		return fmt.Errorf("%w: %v", ErrLockFailed, err)
	}
	defer f.Close()

	_, err = f.WriteString(lockData)
	return err
}

// releaseLock удаляет lock-файл
func (s *JSONStore) releaseLock() {
	os.Remove(s.lockFilePath())
}

// Load загружает данные из JSON-файла
func (s *JSONStore) Load() (*models.DataStore, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	data, err := os.ReadFile(s.filePath)
	if err != nil {
		if os.IsNotExist(err) {
			// Файл не существует — создаём новый с данными по умолчанию
			store := models.NewDefaultDataStore()
			s.data = store
			s.version = store.Version
			return store, s.writeUnsafe(store)
		}
		return nil, fmt.Errorf("ошибка чтения файла данных: %w", err)
	}

	store := &models.DataStore{}
	if err := json.Unmarshal(data, store); err != nil {
		return nil, fmt.Errorf("ошибка парсинга файла данных: %w", err)
	}

	s.data = store
	s.version = store.Version
	return store, nil
}

// GetData возвращает кешированные данные
func (s *JSONStore) GetData() *models.DataStore {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.data
}

// GetVersion возвращает текущую версию данных
func (s *JSONStore) GetVersion() int {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.version
}

// Save сохраняет данные в JSON-файл с проверкой версии и блокировкой
func (s *JSONStore) Save(store *models.DataStore) error {
	// Получаем блокировку
	if err := s.acquireLock(); err != nil {
		return err
	}
	defer s.releaseLock()

	// Перечитываем файл для проверки версии (optimistic concurrency)
	currentData, err := os.ReadFile(s.filePath)
	if err != nil && !os.IsNotExist(err) {
		return fmt.Errorf("ошибка перечитывания файла данных: %w", err)
	}

	if err == nil {
		currentStore := &models.DataStore{}
		if jsonErr := json.Unmarshal(currentData, currentStore); jsonErr == nil {
			if currentStore.Version != s.version {
				// Перезагружаем данные для фронтенда
				s.mu.Lock()
				s.data = currentStore
				s.version = currentStore.Version
				s.mu.Unlock()
				return ErrVersionConflict
			}
		}
	}

	// Увеличиваем версию
	s.mu.Lock()
	defer s.mu.Unlock()

	store.Version = s.version + 1
	store.ModifiedAt = time.Now().Format(time.RFC3339)
	hostname, _ := os.Hostname()
	store.ModifiedBy = hostname

	if err := s.writeUnsafe(store); err != nil {
		return err
	}

	s.data = store
	s.version = store.Version
	return nil
}

// writeUnsafe записывает данные в файл (должен вызываться с удерживаемой блокировкой)
func (s *JSONStore) writeUnsafe(store *models.DataStore) error {
	data, err := json.MarshalIndent(store, "", "  ")
	if err != nil {
		return fmt.Errorf("ошибка сериализации данных: %w", err)
	}

	// Атомарная запись: пишем во временный файл, затем переименовываем
	dir := filepath.Dir(s.filePath)
	tmpFile, err := os.CreateTemp(dir, "data-*.tmp")
	if err != nil {
		return fmt.Errorf("ошибка создания временного файла: %w", err)
	}
	tmpPath := tmpFile.Name()

	if _, err := tmpFile.Write(data); err != nil {
		tmpFile.Close()
		os.Remove(tmpPath)
		return fmt.Errorf("ошибка записи во временный файл: %w", err)
	}

	if err := tmpFile.Close(); err != nil {
		os.Remove(tmpPath)
		return fmt.Errorf("ошибка закрытия временного файла: %w", err)
	}

	if err := os.Rename(tmpPath, s.filePath); err != nil {
		os.Remove(tmpPath)
		return fmt.Errorf("ошибка переименования временного файла: %w", err)
	}

	return nil
}

// CheckForUpdates проверяет, изменился ли файл (по дате модификации)
func (s *JSONStore) CheckForUpdates() (bool, error) {
	info, err := os.Stat(s.filePath)
	if err != nil {
		return false, err
	}

	currentData, err := os.ReadFile(s.filePath)
	if err != nil {
		return false, err
	}

	_ = info // можно использовать info.ModTime() для быстрой проверки

	currentStore := &models.DataStore{}
	if err := json.Unmarshal(currentData, currentStore); err != nil {
		return false, err
	}

	s.mu.RLock()
	changed := currentStore.Version != s.version
	s.mu.RUnlock()

	if changed {
		s.mu.Lock()
		s.data = currentStore
		s.version = currentStore.Version
		s.mu.Unlock()
	}

	return changed, nil
}

// Reload принудительно перезагружает данные из файла
func (s *JSONStore) Reload() (*models.DataStore, error) {
	return s.Load()
}

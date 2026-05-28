package config

import (
	"encoding/json"
	"os"
	"path/filepath"
	"sync"
)

// Config — локальная конфигурация приложения
type Config struct {
	DataFilePath           string `json:"dataFilePath"`
	PasswordHash           string `json:"passwordHash"`
	AutoRefreshIntervalSec int    `json:"autoRefreshIntervalSec"`
	EditSessionTimeoutMin  int    `json:"editSessionTimeoutMin"`
}

var (
	instance *Config
	once     sync.Once
	cfgPath  string
)

// DefaultConfig возвращает конфигурацию по умолчанию
func DefaultConfig() *Config {
	return &Config{
		DataFilePath:           "",
		PasswordHash:           "",
		AutoRefreshIntervalSec: 30,
		EditSessionTimeoutMin:  15,
	}
}

// GetConfigDir возвращает директорию для хранения конфигурации
func GetConfigDir() (string, error) {
	configDir, err := os.UserConfigDir()
	if err != nil {
		return "", err
	}
	appDir := filepath.Join(configDir, "pc-and-printers-accounting")
	if err := os.MkdirAll(appDir, 0700); err != nil {
		return "", err
	}
	return appDir, nil
}

// GetConfigPath возвращает путь к файлу конфигурации
func GetConfigPath() (string, error) {
	dir, err := GetConfigDir()
	if err != nil {
		return "", err
	}
	return filepath.Join(dir, "config.json"), nil
}

// Load загружает конфигурацию из файла или создаёт новую
func Load() (*Config, error) {
	var loadErr error
	once.Do(func() {
		path, err := GetConfigPath()
		if err != nil {
			loadErr = err
			return
		}
		cfgPath = path

		data, err := os.ReadFile(path)
		if err != nil {
			if os.IsNotExist(err) {
				instance = DefaultConfig()
				return
			}
			loadErr = err
			return
		}

		cfg := &Config{}
		if err := json.Unmarshal(data, cfg); err != nil {
			loadErr = err
			return
		}
		instance = cfg
	})
	return instance, loadErr
}

// Save сохраняет конфигурацию в файл
func Save(cfg *Config) error {
	path, err := GetConfigPath()
	if err != nil {
		return err
	}

	data, err := json.MarshalIndent(cfg, "", "  ")
	if err != nil {
		return err
	}

	if err := os.WriteFile(path, data, 0600); err != nil {
		return err
	}

	instance = cfg
	return nil
}

// Get возвращает текущую конфигурацию (должна быть предварительно загружена через Load)
func Get() *Config {
	return instance
}

// IsFirstRun возвращает true, если пароль ещё не установлен
func (c *Config) IsFirstRun() bool {
	return c.PasswordHash == ""
}

// HasDataFile возвращает true, если путь к файлу данных настроен
func (c *Config) HasDataFile() bool {
	return c.DataFilePath != ""
}

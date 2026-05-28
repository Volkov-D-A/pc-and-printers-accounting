package auth

import (
	"errors"

	"golang.org/x/crypto/bcrypt"

	"pc-and-printers-accounting/internal/config"
)

var (
	ErrInvalidPassword = errors.New("неверный пароль")
	ErrNoPassword      = errors.New("пароль не установлен")
)

// HashPassword хеширует пароль с помощью bcrypt
func HashPassword(password string) (string, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return "", err
	}
	return string(hash), nil
}

// VerifyPassword проверяет пароль по сохранённому хешу
func VerifyPassword(password string) error {
	cfg := config.Get()
	if cfg == nil || cfg.PasswordHash == "" {
		return ErrNoPassword
	}

	err := bcrypt.CompareHashAndPassword([]byte(cfg.PasswordHash), []byte(password))
	if err != nil {
		return ErrInvalidPassword
	}
	return nil
}

// SetPassword устанавливает новый пароль (хеширует и сохраняет в конфиг)
func SetPassword(password string) error {
	hash, err := HashPassword(password)
	if err != nil {
		return err
	}

	cfg := config.Get()
	cfg.PasswordHash = hash
	return config.Save(cfg)
}

// ChangePassword меняет пароль, проверяя старый
func ChangePassword(oldPassword, newPassword string) error {
	if err := VerifyPassword(oldPassword); err != nil {
		return err
	}
	return SetPassword(newPassword)
}

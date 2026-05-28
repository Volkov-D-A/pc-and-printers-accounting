package main

import "errors"

var (
	ErrReadOnly = errors.New("режим только для чтения, авторизуйтесь для редактирования")
	ErrNotFound = errors.New("запись не найдена")
)

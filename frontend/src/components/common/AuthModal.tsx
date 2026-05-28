import { useState } from 'react';
import './AuthModal.css';

interface AuthModalProps {
  mode: 'setup' | 'login';
  onSubmit: (password: string) => Promise<void>;
  onCancel?: () => void;
  error?: string;
}

export default function AuthModal({ mode, onSubmit, onCancel, error }: AuthModalProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    if (mode === 'setup' && password !== confirmPassword) {
      setLocalError('Пароли не совпадают');
      return;
    }

    if (password.length < 4) {
      setLocalError('Пароль должен содержать минимум 4 символа');
      return;
    }

    setLoading(true);
    try {
      await onSubmit(password);
    } catch {
      setLocalError('Ошибка аутентификации');
    } finally {
      setLoading(false);
    }
  };

  const displayError = error || localError;

  return (
    <div className="modal-overlay">
      <div className="modal auth-modal">
        <div className="auth-modal-icon">
          {mode === 'setup' ? '🔐' : '🔒'}
        </div>
        <h2 className="modal-title">
          {mode === 'setup' ? 'Установите пароль' : 'Введите пароль'}
        </h2>
        <p className="auth-modal-desc">
          {mode === 'setup'
            ? 'Установите пароль для защиты редактирования данных'
            : 'Для перехода в режим редактирования введите пароль'}
        </p>

        <form onSubmit={handleSubmit} className="auth-modal-form">
          <div className="form-group">
            <label className="form-label" htmlFor="auth-password">Пароль</label>
            <input
              id="auth-password"
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Введите пароль"
              autoFocus
              autoComplete="off"
            />
          </div>

          {mode === 'setup' && (
            <div className="form-group">
              <label className="form-label" htmlFor="auth-confirm">Подтвердите пароль</label>
              <input
                id="auth-confirm"
                type="password"
                className="input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Введите пароль повторно"
                autoComplete="off"
              />
            </div>
          )}

          {displayError && (
            <div className="auth-modal-error">{displayError}</div>
          )}

          <div className="modal-actions">
            {onCancel && (
              <button type="button" className="btn btn-secondary" onClick={onCancel}>
                Отмена
              </button>
            )}
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Проверка...' : mode === 'setup' ? 'Установить' : 'Войти'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

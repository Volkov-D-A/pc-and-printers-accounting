import { useState, useEffect } from 'react';
import { GetConfig, SelectDataFile, SelectNewDataFile, SetDataFilePath, ChangePassword } from '../../wailsjs/go/main/App';
import type { config } from '../../wailsjs/go/models';

interface SettingsPageProps {
  onFileSelected?: () => void;
}

export default function SettingsPage({ onFileSelected }: SettingsPageProps) {
  const [appConfig, setAppConfig] = useState<config.Config | null>(null);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passMessage, setPassMessage] = useState('');
  const [passError, setPassError] = useState('');

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const cfg = await GetConfig();
      setAppConfig(cfg);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectExisting = async () => {
    try {
      const path = await SelectDataFile();
      if (path) {
        await SetDataFilePath(path);
        await loadConfig();
        if (onFileSelected) onFileSelected();
      }
    } catch (err: any) {
      alert(`Ошибка: ${err}`);
    }
  };

  const handleCreateNew = async () => {
    try {
      const path = await SelectNewDataFile();
      if (path) {
        await SetDataFilePath(path);
        await loadConfig();
        if (onFileSelected) onFileSelected();
      }
    } catch (err: any) {
      alert(`Ошибка: ${err}`);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassMessage('');
    setPassError('');

    if (newPassword.length < 4) {
      setPassError('Новый пароль должен содержать минимум 4 символа');
      return;
    }

    try {
      await ChangePassword(oldPassword, newPassword);
      setPassMessage('Пароль успешно изменён');
      setOldPassword('');
      setNewPassword('');
    } catch (err: any) {
      setPassError(err || 'Ошибка изменения пароля');
    }
  };

  return (
    <div style={{ padding: 'var(--spacing-xl)' }}>
      <h1 className="page-title">Настройки</h1>

      {!appConfig?.dataFilePath && (
        <div className="card" style={{ marginBottom: 'var(--spacing-lg)', border: '1px solid var(--accent-warning)' }}>
          <div className="card-header">
            <h2 className="card-title" style={{ color: 'var(--accent-warning)' }}>Файл данных не выбран</h2>
          </div>
          <p style={{ marginBottom: 'var(--spacing-md)' }}>
            Для работы программы необходимо указать файл данных (JSON). Вы можете создать новый файл 
            или открыть существующий, например, на сетевом диске.
          </p>
        </div>
      )}

      <div className="form-row">
        {/* Карточка файла данных */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Файл данных</h2>
          </div>
          
          <div className="form-group" style={{ marginBottom: 'var(--spacing-xl)' }}>
            <label className="form-label">Текущий путь:</label>
            <div className="input" style={{ wordBreak: 'break-all', background: 'var(--bg-tertiary)', color: appConfig?.dataFilePath ? 'var(--text-primary)' : 'var(--text-muted)' }}>
              {appConfig?.dataFilePath || 'Не установлен'}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
            <button className="btn btn-primary" onClick={handleSelectExisting}>
              Открыть существующий
            </button>
            <button className="btn btn-secondary" onClick={handleCreateNew}>
              Создать новый
            </button>
          </div>
        </div>

        {/* Карточка изменения пароля */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Смена пароля</h2>
          </div>

          <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="oldPass">Текущий пароль</label>
              <input
                id="oldPass"
                type="password"
                className="input"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
              />
            </div>
            
            <div className="form-group">
              <label className="form-label" htmlFor="newPass">Новый пароль</label>
              <input
                id="newPass"
                type="password"
                className="input"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            {passMessage && <div style={{ color: 'var(--accent-success)', fontSize: 'var(--font-size-sm)' }}>{passMessage}</div>}
            {passError && <div style={{ color: 'var(--accent-danger)', fontSize: 'var(--font-size-sm)' }}>{passError}</div>}

            <div>
              <button type="submit" className="btn btn-secondary">
                Изменить пароль
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

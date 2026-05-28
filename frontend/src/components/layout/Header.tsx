import { Lock, Unlock } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import './Header.css';

interface HeaderProps {
  editMode: boolean;
  onToggleEditMode: () => void;
}

const getTitle = (path: string) => {
  if (path === '/') return 'Главная';
  if (path.startsWith('/equipment')) return 'Техника';
  if (path.startsWith('/floorplan')) return 'Поэтажный план';
  if (path.startsWith('/licenses')) return 'Лицензии';
  if (path.startsWith('/dictionaries')) return 'Справочники';
  if (path.startsWith('/reports')) return 'Отчёты';
  if (path.startsWith('/settings')) return 'Настройки';
  return '';
};

export default function Header({ editMode, onToggleEditMode }: HeaderProps) {
  const location = useLocation();
  const title = getTitle(location.pathname);

  return (
    <header className="header">
      <div className="header-left">
        {title && <h1 className="header-page-title">{title}</h1>}
      </div>

      <div className="header-right">
        <button
          className={`header-edit-btn ${editMode ? 'header-edit-btn--active' : ''}`}
          onClick={onToggleEditMode}
          title={editMode ? 'Выйти из режима редактирования' : 'Включить редактирование'}
        >
          <span className="header-edit-icon">{editMode ? <Unlock size={16} /> : <Lock size={16} />}</span>
          <span className="header-edit-label">
            {editMode ? 'Редактирование' : 'Просмотр'}
          </span>
          <span className={`header-edit-dot ${editMode ? 'header-edit-dot--active' : ''}`} />
        </button>
      </div>
    </header>
  );
}

import { Lock, Unlock } from 'lucide-react';
import './Header.css';

interface HeaderProps {
  editMode: boolean;
  onToggleEditMode: () => void;
}

export default function Header({ editMode, onToggleEditMode }: HeaderProps) {
  return (
    <header className="header">
      <div className="header-left">
        {/* Будет содержать breadcrumb / заголовок страницы */}
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

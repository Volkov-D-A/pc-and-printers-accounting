import { NavLink } from 'react-router-dom';
import './Sidebar.css';

const navItems = [
  { path: '/', label: 'Главная', icon: '📊' },
  { path: '/equipment', label: 'Техника', icon: '🖥️' },
  { path: '/floorplan', label: 'Поэтажный план', icon: '🏢' },
  { path: '/licenses', label: 'Лицензии', icon: '📜' },
  { path: '/dictionaries', label: 'Справочники', icon: '📁' },
  { path: '/reports', label: 'Отчёты', icon: '📋' },
  { path: '/settings', label: 'Настройки', icon: '⚙️' },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <span className="sidebar-logo-icon">🖥️</span>
        <span className="sidebar-logo-text">Учёт техники</span>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `sidebar-nav-item ${isActive ? 'sidebar-nav-item--active' : ''}`
            }
            end={item.path === '/'}
          >
            <span className="sidebar-nav-icon">{item.icon}</span>
            <span className="sidebar-nav-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <span className="sidebar-version">v0.1.0</span>
      </div>
    </aside>
  );
}

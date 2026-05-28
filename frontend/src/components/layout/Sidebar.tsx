import { NavLink } from 'react-router-dom';
import { 
  BarChart3, 
  Monitor, 
  Building2, 
  ScrollText, 
  FolderTree, 
  ClipboardList, 
  Settings 
} from 'lucide-react';
import './Sidebar.css';

const navItems = [
  { path: '/', label: 'Главная', icon: <BarChart3 size={20} /> },
  { path: '/equipment', label: 'Техника', icon: <Monitor size={20} /> },
  { path: '/floorplan', label: 'Поэтажный план', icon: <Building2 size={20} /> },
  { path: '/licenses', label: 'Лицензии', icon: <ScrollText size={20} /> },
  { path: '/dictionaries', label: 'Справочники', icon: <FolderTree size={20} /> },
  { path: '/reports', label: 'Отчёты', icon: <ClipboardList size={20} /> },
  { path: '/settings', label: 'Настройки', icon: <Settings size={20} /> },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <Monitor size={24} className="sidebar-logo-icon" />
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

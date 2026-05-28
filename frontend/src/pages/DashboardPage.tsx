import { useEffect, useState } from 'react';
import { EQUIPMENT_TYPE_LABELS } from '../types';
import type { EquipmentType } from '../types';
import { useAppContext } from '../context/AppContext';
import { 
  FolderOpen, 
  PcCase, 
  Laptop, 
  MonitorSmartphone, 
  Printer, 
  Settings2, 
  Router, 
  Network 
} from 'lucide-react';
import './DashboardPage.css';

export default function DashboardPage() {
  const { data } = useAppContext();
  const [stats, setStats] = useState<Record<string, number>>({});
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    if (!data) return;

    const counts: Record<string, number> = {};
    data.equipment.forEach((eq) => {
      counts[eq.type] = (counts[eq.type] || 0) + 1;
    });
    setStats(counts);
    setTotalCount(data.equipment.length);
  }, [data]);

  if (!data) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon"><FolderOpen size={48} /></div>
        <div className="empty-state-title">Файл данных не загружен</div>
        <p>Перейдите в настройки и укажите путь к файлу данных</p>
      </div>
    );
  }

  const statCards: { type: EquipmentType; icon: React.ReactNode }[] = [
    { type: 'pc', icon: <PcCase size={24} /> },
    { type: 'laptop', icon: <Laptop size={24} /> },
    { type: 'monoblock', icon: <MonitorSmartphone size={24} /> },
    { type: 'printer', icon: <Printer size={24} /> },
    { type: 'mfp', icon: <Settings2 size={24} /> },
    { type: 'router', icon: <Router size={24} /> },
    { type: 'switch', icon: <Network size={24} /> },
  ];

  return (
    <div className="dashboard">
      <h1 className="page-title">Главная</h1>

      <div className="dashboard-summary">
        <div className="dashboard-total-card card">
          <div className="dashboard-total-number">{totalCount}</div>
          <div className="dashboard-total-label">Всего единиц техники</div>
        </div>

        <div className="dashboard-total-card card">
          <div className="dashboard-total-number">{data.responsibleUsers.length}</div>
          <div className="dashboard-total-label">Ответственных лиц</div>
        </div>

        <div className="dashboard-total-card card">
          <div className="dashboard-total-number">{data.licenses.length}</div>
          <div className="dashboard-total-label">Лицензий ПО</div>
        </div>

        <div className="dashboard-total-card card">
          <div className="dashboard-total-number">{data.rooms.length}</div>
          <div className="dashboard-total-label">Кабинетов</div>
        </div>
      </div>

      <h2 className="section-title">По типам техники</h2>
      <div className="dashboard-grid">
        {statCards.map(({ type, icon }) => (
          <div key={type} className="dashboard-stat-card card">
            <span className="dashboard-stat-icon">{icon}</span>
            <div className="dashboard-stat-info">
              <span className="dashboard-stat-count">{stats[type] || 0}</span>
              <span className="dashboard-stat-label">
                {EQUIPMENT_TYPE_LABELS[type]}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { EQUIPMENT_TYPE_LABELS } from '../types';
import type { EquipmentType } from '../types';
import { useAppContext } from '../context/AppContext';
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
        <div className="empty-state-icon">📂</div>
        <div className="empty-state-title">Файл данных не загружен</div>
        <p>Перейдите в настройки и укажите путь к файлу данных</p>
      </div>
    );
  }

  const statCards: { type: EquipmentType; icon: string }[] = [
    { type: 'pc', icon: '🖥️' },
    { type: 'laptop', icon: '💻' },
    { type: 'monoblock', icon: '🖥️' },
    { type: 'printer', icon: '🖨️' },
    { type: 'mfp', icon: '📠' },
    { type: 'scanner', icon: '📷' },
    { type: 'router', icon: '📡' },
    { type: 'switch', icon: '🔌' },
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

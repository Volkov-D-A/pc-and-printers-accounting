import { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { EQUIPMENT_TYPE_LABELS } from '../types';
import { ExportReportToXLSX } from '../../wailsjs/go/main/App';
import './ReportsPage.css';

export default function ReportsPage() {
  const { data } = useAppContext();
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [exporting, setExporting] = useState(false);
  const [resultMsg, setResultMsg] = useState('');

  const handleTypeToggle = (type: string) => {
    setSelectedTypes(prev => 
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const handleExport = async () => {
    if (!data) return;
    
    setExporting(true);
    setResultMsg('');
    
    // Filter equipment IDs based on selection
    let idsToExport: string[] = [];
    if (selectedTypes.length === 0) {
      idsToExport = data.equipment.map(eq => eq.id);
    } else {
      idsToExport = data.equipment
        .filter(eq => selectedTypes.includes(eq.type))
        .map(eq => eq.id);
    }

    try {
      const savedPath = await ExportReportToXLSX(idsToExport);
      if (savedPath) {
        setResultMsg(`Отчёт успешно сохранён: ${savedPath}`);
      }
    } catch (err) {
      alert(`Ошибка экспорта: ${err}`);
    } finally {
      setExporting(false);
    }
  };

  const totalCount = data?.equipment.length || 0;
  const filteredCount = selectedTypes.length === 0 
    ? totalCount 
    : data?.equipment.filter(eq => selectedTypes.includes(eq.type)).length || 0;

  return (
    <div className="reports-page">
      <div className="page-header">
        <h1 className="page-title">Отчёты и экспорт</h1>
      </div>

      <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
        <h2 className="card-title" style={{ marginBottom: 'var(--spacing-lg)' }}>Экспорт списка техники в Excel</h2>
        
        <div style={{ marginBottom: 'var(--spacing-xl)' }}>
          <label className="form-label">Фильтр по типу (оставьте пустым для экспорта всех данных)</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-sm)' }}>
            {Object.entries(EQUIPMENT_TYPE_LABELS).map(([key, label]) => (
              <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={selectedTypes.includes(key)}
                  onChange={() => handleTypeToggle(key)}
                />
                {label}
              </label>
            ))}
          </div>
        </div>

        <div style={{ padding: 'var(--spacing-md)', background: 'var(--bg-tertiary)', borderRadius: 'var(--border-radius-md)', marginBottom: 'var(--spacing-xl)' }}>
          <div>Будет экспортировано записей: <strong>{filteredCount}</strong> из {totalCount}</div>
        </div>

        <button 
          className="btn btn-primary" 
          style={{ width: '100%', justifyContent: 'center' }}
          onClick={handleExport}
          disabled={exporting || filteredCount === 0}
        >
          {exporting ? 'Генерация отчёта...' : 'Сохранить XLSX...'}
        </button>

        {resultMsg && (
          <div style={{ marginTop: 'var(--spacing-md)', color: 'var(--accent-success)', fontSize: 'var(--font-size-sm)', textAlign: 'center' }}>
            {resultMsg}
          </div>
        )}
      </div>
    </div>
  );
}

import { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { EQUIPMENT_TYPE_LABELS } from '../types';
import { ExportReportToXLSX } from '../../wailsjs/go/main/App';
import './ReportsPage.css';

export default function ReportsPage() {
  const { data } = useAppContext();
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [filterRam, setFilterRam] = useState('');
  const [filterCartridge, setFilterCartridge] = useState('');
  const [filterOs, setFilterOs] = useState('');
  const [filterDriveType, setFilterDriveType] = useState('');
  const [filterDriveSize, setFilterDriveSize] = useState('');
  const [filterDrum, setFilterDrum] = useState('');
  
  const [exporting, setExporting] = useState(false);
  const [resultMsg, setResultMsg] = useState('');

  const uniqueOptions = useMemo(() => {
    if (!data) return { ram: [], os: [], cartridge: [], driveType: [], driveSize: [], drum: [] };
    const opts = {
      ram: new Set<string>(),
      os: new Set<string>(),
      cartridge: new Set<string>(),
      driveType: new Set<string>(),
      driveSize: new Set<string>(),
      drum: new Set<string>()
    };

    data.equipment.forEach(eq => {
      if (eq.specificFields?.ram) opts.ram.add(String(eq.specificFields.ram));
      if (eq.specificFields?.os) opts.os.add(String(eq.specificFields.os));
      if (eq.specificFields?.cartridgeType) opts.cartridge.add(String(eq.specificFields.cartridgeType));
      if (eq.specificFields?.driveType) opts.driveType.add(String(eq.specificFields.driveType));
      if (eq.specificFields?.driveSize) opts.driveSize.add(String(eq.specificFields.driveSize));
      if (eq.specificFields?.drumType) opts.drum.add(String(eq.specificFields.drumType));
    });

    return {
      ram: Array.from(opts.ram).sort(),
      os: Array.from(opts.os).sort(),
      cartridge: Array.from(opts.cartridge).sort(),
      driveType: Array.from(opts.driveType).sort(),
      driveSize: Array.from(opts.driveSize).sort(),
      drum: Array.from(opts.drum).sort()
    };
  }, [data]);

  const filteredEquipment = useMemo(() => {
    if (!data) return [];
    return data.equipment.filter(eq => {
      if (selectedTypes.length > 0 && !selectedTypes.includes(eq.type)) {
        return false;
      }
      if (filterRam && eq.specificFields?.ram !== filterRam) return false;
      if (filterOs && eq.specificFields?.os !== filterOs) return false;
      if (filterDriveType && eq.specificFields?.driveType !== filterDriveType) return false;
      if (filterDriveSize && eq.specificFields?.driveSize !== filterDriveSize) return false;
      if (filterCartridge && eq.specificFields?.cartridgeType !== filterCartridge) return false;
      if (filterDrum && eq.specificFields?.drumType !== filterDrum) return false;
      
      return true;
    });
  }, [data, selectedTypes, filterRam, filterOs, filterDriveType, filterDriveSize, filterCartridge, filterDrum]);

  const showPcFields = selectedTypes.length === 0 || selectedTypes.some(t => ['pc', 'laptop', 'monoblock'].includes(t));
  const showPrinterFields = selectedTypes.length === 0 || selectedTypes.some(t => ['printer', 'mfp'].includes(t));

  const handleTypeToggle = (type: string) => {
    setSelectedTypes(prev => 
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
    // Сброс специфичных фильтров при изменении типа, чтобы они не блокировали выдачу
    setFilterRam('');
    setFilterOs('');
    setFilterDriveType('');
    setFilterDriveSize('');
    setFilterCartridge('');
    setFilterDrum('');
  };

  const handleExport = async () => {
    if (!data) return;
    
    setExporting(true);
    setResultMsg('');
    
    const idsToExport = filteredEquipment.map(eq => eq.id);

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
  const filteredCount = filteredEquipment.length;

  return (
    <div className="reports-page">
      <div className="card" style={{ width: '100%', maxWidth: '600px', margin: '0 auto' }}>
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

        {(showPcFields || showPrinterFields) && (
          <div style={{ marginBottom: 'var(--spacing-xl)' }}>
            <label className="form-label">Дополнительные параметры</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
              
              {showPcFields && (
                <>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.8rem', marginBottom: '2px' }}>ОЗУ (ГБ)</label>
                    <select className="select" value={filterRam} onChange={e => setFilterRam(e.target.value)}>
                      <option value="">Любое</option>
                      {uniqueOptions.ram.map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.8rem', marginBottom: '2px' }}>ОС</label>
                    <select className="select" value={filterOs} onChange={e => setFilterOs(e.target.value)}>
                      <option value="">Любая</option>
                      {uniqueOptions.os.map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.8rem', marginBottom: '2px' }}>Тип накопителя</label>
                    <select className="select" value={filterDriveType} onChange={e => setFilterDriveType(e.target.value)}>
                      <option value="">Любой</option>
                      {uniqueOptions.driveType.map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.8rem', marginBottom: '2px' }}>Объем накопителя</label>
                    <select className="select" value={filterDriveSize} onChange={e => setFilterDriveSize(e.target.value)}>
                      <option value="">Любой</option>
                      {uniqueOptions.driveSize.map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                </>
              )}

              {showPrinterFields && (
                <>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.8rem', marginBottom: '2px' }}>Тип картриджа</label>
                    <select className="select" value={filterCartridge} onChange={e => setFilterCartridge(e.target.value)}>
                      <option value="">Любой</option>
                      {uniqueOptions.cartridge.map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.8rem', marginBottom: '2px' }}>Тип фотобарабана</label>
                    <select className="select" value={filterDrum} onChange={e => setFilterDrum(e.target.value)}>
                      <option value="">Любой</option>
                      {uniqueOptions.drum.map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

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

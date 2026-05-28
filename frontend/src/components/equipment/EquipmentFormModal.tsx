import { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { EQUIPMENT_TYPE_LABELS, COMPONENT_TYPE_LABELS, ALL_COMPONENT_TYPES } from '../../types';
import type { Equipment, Component, EquipmentType, ComponentType } from '../../types';
import { AddEquipment, UpdateEquipment } from '../../../wailsjs/go/main/App';
import './EquipmentFormModal.css';

interface EquipmentFormModalProps {
  equipment: Equipment | null;
  onClose: () => void;
  onSave: () => void;
}

export default function EquipmentFormModal({ equipment, onClose, onSave }: EquipmentFormModalProps) {
  const { data } = useAppContext();
  
  const [formData, setFormData] = useState<Partial<Equipment>>({
    type: 'pc',
    inventoryNumber: '',
    roomId: '',
    responsibleUserId: '',
    commissionDate: new Date().toISOString().split('T')[0],
    notes: '',
    ipMode: 'dhcp',
    ipAddress: '',
    commonFields: { startYear: '', model: '', serialNumber: '' },
    specificFields: {},
    components: [],
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Component temp state
  const [addingComponent, setAddingComponent] = useState(false);
  const [newComponent, setNewComponent] = useState<Partial<Component>>({
    type: 'ram', name: '', inventoryNumber: '', serialNumber: ''
  });

  useEffect(() => {
    if (equipment) {
      setFormData(JSON.parse(JSON.stringify(equipment)));
    }
  }, [equipment]);

  const handleChange = (field: keyof Equipment, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCommonFieldChange = (field: keyof Equipment['commonFields'], value: string) => {
    setFormData((prev) => ({
      ...prev,
      commonFields: { ...(prev.commonFields as any), [field]: value },
    }));
  };

  const handleSpecificFieldChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      specificFields: { ...(prev.specificFields || {}), [field]: value },
    }));
  };

  const handleAddComponent = () => {
    if (!newComponent.name || !newComponent.type) {
      setError('Имя и тип комплектующего обязательны');
      return;
    }
    setError('');
    const comp: Component = {
      id: crypto.randomUUID(),
      type: newComponent.type as ComponentType,
      name: newComponent.name,
      inventoryNumber: newComponent.inventoryNumber,
      serialNumber: newComponent.serialNumber,
      specifications: {},
    };
    setFormData((prev) => ({
      ...prev,
      components: [...(prev.components || []), comp],
    }));
    setAddingComponent(false);
    setNewComponent({ type: 'ram', name: '', inventoryNumber: '', serialNumber: '' });
  };

  const handleRemoveComponent = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      components: (prev.components || []).filter((c) => c.id !== id),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.inventoryNumber) {
      setError('Инвентарный номер обязателен');
      return;
    }

    setLoading(true);
    try {
      if (equipment?.id) {
        await UpdateEquipment(formData as any);
      } else {
        await AddEquipment(formData as any);
      }
      onSave();
    } catch (err: any) {
      setError(`Ошибка сохранения: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal form-modal" style={{ maxWidth: '800px', width: '95%' }}>
        <h2 className="modal-title">{equipment ? 'Редактировать технику' : 'Добавить технику'}</h2>

        <form onSubmit={handleSubmit} className="equipment-form">
          {error && <div className="form-error">{error}</div>}

          <div className="form-section">
            <h3 className="section-subtitle">Основная информация</h3>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Тип техники</label>
                <select className="select" value={formData.type} onChange={(e) => handleChange('type', e.target.value)}>
                  {Object.entries(EQUIPMENT_TYPE_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Инвентарный номер *</label>
                <input className="input" value={formData.inventoryNumber} onChange={(e) => handleChange('inventoryNumber', e.target.value)} required />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Кабинет</label>
                <select className="select" value={formData.roomId} onChange={(e) => handleChange('roomId', e.target.value)}>
                  <option value="">Не указан</option>
                  {data?.rooms.map((r) => (
                    <option key={r.id} value={r.id}>{r.number}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Ответственный</label>
                <select className="select" value={formData.responsibleUserId} onChange={(e) => handleChange('responsibleUserId', e.target.value)}>
                  <option value="">Не указан</option>
                  {data?.responsibleUsers.map((u) => (
                    <option key={u.id} value={u.id}>{u.lastName} {u.firstName} {u.patronymic}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Год начала эксплуатации</label>
                <input className="input" placeholder="Например: 2021" value={formData.commonFields?.startYear} onChange={(e) => handleCommonFieldChange('startYear', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Модель</label>
                <input className="input" value={formData.commonFields?.model} onChange={(e) => handleCommonFieldChange('model', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Серийный номер</label>
                <input className="input" value={formData.commonFields?.serialNumber} onChange={(e) => handleCommonFieldChange('serialNumber', e.target.value)} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Сетевой режим (IP)</label>
                <select className="select" value={formData.ipMode} onChange={(e) => handleChange('ipMode', e.target.value)}>
                  <option value="dhcp">Динамический (DHCP)</option>
                  <option value="static">Статический</option>
                </select>
              </div>
              {formData.ipMode === 'static' && (
                <div className="form-group">
                  <label className="form-label">IP Адрес</label>
                  <input className="input" placeholder="192.168.1.10" value={formData.ipAddress} onChange={(e) => handleChange('ipAddress', e.target.value)} />
                </div>
              )}
            </div>
          </div>

          <div className="form-section">
            <h3 className="section-subtitle">Специфичные поля (в зависимости от типа)</h3>
            <div className="form-row">
              {formData.type === 'pc' || formData.type === 'laptop' || formData.type === 'monoblock' ? (
                <>
                  <div className="form-group">
                    <label className="form-label">ОС</label>
                    <input className="input" value={(formData.specificFields?.os as string) || ''} onChange={(e) => handleSpecificFieldChange('os', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Сетевое имя (Hostname)</label>
                    <input className="input" value={(formData.specificFields?.hostname as string) || ''} onChange={(e) => handleSpecificFieldChange('hostname', e.target.value)} />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Объем ОЗУ (ГБ)</label>
                    <input className="input" type="number" value={(formData.specificFields?.ram as string) || ''} onChange={(e) => handleSpecificFieldChange('ram', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Тип накопителя</label>
                    <select className="select" value={(formData.specificFields?.driveType as string) || ''} onChange={(e) => handleSpecificFieldChange('driveType', e.target.value)}>
                      <option value="">Не указан</option>
                      <option value="HDD">HDD</option>
                      <option value="SSD">SSD</option>
                      <option value="NVMe">NVMe</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Объем накопителя (ГБ)</label>
                    <input className="input" type="number" value={(formData.specificFields?.driveSize as string) || ''} onChange={(e) => handleSpecificFieldChange('driveSize', e.target.value)} />
                  </div>
                </>
              ) : formData.type === 'printer' || formData.type === 'mfp' ? (
                <>
                  <div className="form-group">
                    <label className="form-label">Тип картриджа</label>
                    <input className="input" placeholder="Например: CE285A" value={(formData.specificFields?.cartridgeType as string) || ''} onChange={(e) => handleSpecificFieldChange('cartridgeType', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Тип фотобарабана (опционально)</label>
                    <input className="input" placeholder="Например: DR-1075" value={(formData.specificFields?.drumType as string) || ''} onChange={(e) => handleSpecificFieldChange('drumType', e.target.value)} />
                  </div>
                </>
              ) : (
                <div className="text-muted">Для данного типа нет обязательных специфичных полей</div>
              )}
            </div>
          </div>

          <div className="form-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
              <h3 className="section-subtitle" style={{ margin: 0 }}>Комплектующие ({formData.components?.length || 0})</h3>
              <button type="button" className="btn btn-sm btn-secondary" onClick={() => setAddingComponent(!addingComponent)}>
                {addingComponent ? 'Отмена' : '+ Добавить деталь'}
              </button>
            </div>

            {addingComponent && (
              <div className="card component-add-card">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Тип</label>
                    <select className="select" value={newComponent.type} onChange={(e) => setNewComponent({ ...newComponent, type: e.target.value as ComponentType })}>
                      {ALL_COMPONENT_TYPES.map(t => <option key={t} value={t}>{COMPONENT_TYPE_LABELS[t]}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Название (характеристика)</label>
                    <input className="input" placeholder="Например: 16GB DDR4 Kingston" value={newComponent.name} onChange={(e) => setNewComponent({ ...newComponent, name: e.target.value })} />
                  </div>
                </div>
                <div className="form-row mt-sm">
                  <div className="form-group">
                    <label className="form-label">Инв. номер (если есть)</label>
                    <input className="input" value={newComponent.inventoryNumber} onChange={(e) => setNewComponent({ ...newComponent, inventoryNumber: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Серийный номер (если есть)</label>
                    <input className="input" value={newComponent.serialNumber} onChange={(e) => setNewComponent({ ...newComponent, serialNumber: e.target.value })} />
                  </div>
                </div>
                <button type="button" className="btn btn-sm btn-primary mt-md" onClick={handleAddComponent}>
                  Сохранить комплектующее
                </button>
              </div>
            )}

            {formData.components && formData.components.length > 0 && (
              <table className="table" style={{ marginTop: 'var(--spacing-md)' }}>
                <thead>
                  <tr>
                    <th>Тип</th>
                    <th>Название</th>
                    <th>Инв/Сер номер</th>
                    <th style={{ width: '50px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {formData.components.map((c) => (
                    <tr key={c.id}>
                      <td><span className="badge badge-secondary">{COMPONENT_TYPE_LABELS[c.type]}</span></td>
                      <td>{c.name}</td>
                      <td style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
                        {c.inventoryNumber && <div>Инв: {c.inventoryNumber}</div>}
                        {c.serialNumber && <div>SN: {c.serialNumber}</div>}
                      </td>
                      <td>
                        <button type="button" className="btn btn-icon btn-ghost" style={{ color: 'var(--accent-danger)' }} onClick={() => handleRemoveComponent(c.id)}>
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="modal-actions" style={{ marginTop: 'var(--spacing-2xl)' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Отмена
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

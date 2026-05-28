import { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { EQUIPMENT_TYPE_LABELS } from '../types';
import type { Equipment } from '../types';
import { DeleteEquipment } from '../../wailsjs/go/main/App';
import EquipmentFormModal from '../components/equipment/EquipmentFormModal';
import './EquipmentPage.css';

export default function EquipmentPage() {
  const { data, editMode, reloadData } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<Equipment | null>(null);

  const equipmentList = data?.equipment || [];

  const filteredEquipment = useMemo(() => {
    return equipmentList.filter((eq) => {
      const matchSearch =
        eq.inventoryNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        eq.commonFields.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        eq.commonFields.manufacturer.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchType = typeFilter ? eq.type === typeFilter : true;

      return matchSearch && matchType;
    });
  }, [equipmentList, searchTerm, typeFilter]);

  const handleAdd = () => {
    setEditingItem(null);
    setShowForm(true);
  };

  const handleEdit = (eq: Equipment) => {
    setEditingItem(eq);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Вы действительно хотите удалить эту единицу техники?')) return;
    try {
      await DeleteEquipment(id);
      await reloadData();
    } catch (err: any) {
      alert(`Ошибка удаления: ${err}`);
    }
  };

  const handleFormSave = async () => {
    setShowForm(false);
    await reloadData();
  };

  return (
    <div className="equipment-page">
      <div className="page-header">
        <h1 className="page-title">Техника</h1>
        {editMode && (
          <button className="btn btn-primary" onClick={handleAdd}>
            <span style={{ fontSize: '1.2rem' }}>+</span> Добавить технику
          </button>
        )}
      </div>

      <div className="filters card">
        <div className="form-group">
          <input
            type="text"
            className="input"
            placeholder="Поиск по инвентарному номеру, модели..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="form-group" style={{ minWidth: '200px' }}>
          <select
            className="select"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="">Все типы</option>
            {Object.entries(EQUIPMENT_TYPE_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="table-container card">
        <table className="table">
          <thead>
            <tr>
              <th>Инв. №</th>
              <th>Тип</th>
              <th>Производитель / Модель</th>
              <th>Серийный №</th>
              <th>Кабинет / Ответственный</th>
              {editMode && <th style={{ width: '120px', textAlign: 'right' }}>Действия</th>}
            </tr>
          </thead>
          <tbody>
            {filteredEquipment.length === 0 ? (
              <tr>
                <td colSpan={editMode ? 6 : 5} style={{ textAlign: 'center', padding: 'var(--spacing-3xl)' }}>
                  <div style={{ color: 'var(--text-muted)' }}>Ничего не найдено</div>
                </td>
              </tr>
            ) : (
              filteredEquipment.map((eq) => {
                const room = data?.rooms.find((r) => r.id === eq.roomId);
                const user = data?.responsibleUsers.find((u) => u.id === eq.responsibleUserId);

                return (
                  <tr key={eq.id}>
                    <td>
                      <span className="badge badge-primary">{eq.inventoryNumber}</span>
                    </td>
                    <td>{EQUIPMENT_TYPE_LABELS[eq.type]}</td>
                    <td>
                      <div style={{ fontWeight: 'var(--font-weight-medium)' }}>{eq.commonFields.manufacturer}</div>
                      <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
                        {eq.commonFields.model}
                      </div>
                    </td>
                    <td>{eq.commonFields.serialNumber || '-'}</td>
                    <td>
                      <div>{room ? `${room.number} - ${room.name}` : '-'}</div>
                      <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
                        {user ? `${user.lastName} ${user.firstName[0]}. ${user.patronymic?.[0] || ''}.` : '-'}
                      </div>
                    </td>
                    {editMode && (
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 'var(--spacing-sm)', justifyContent: 'flex-end' }}>
                          <button className="btn btn-icon btn-secondary" onClick={() => handleEdit(eq)} title="Редактировать">
                            ✏️
                          </button>
                          <button className="btn btn-icon btn-danger" onClick={() => handleDelete(eq.id)} title="Удалить">
                            🗑️
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <EquipmentFormModal
          equipment={editingItem}
          onClose={() => setShowForm(false)}
          onSave={handleFormSave}
        />
      )}
    </div>
  );
}

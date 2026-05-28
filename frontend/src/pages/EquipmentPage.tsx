import { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { EQUIPMENT_TYPE_LABELS } from '../types';
import type { Equipment } from '../types';
import { DeleteEquipment, ExportReportToXLSX } from '../../wailsjs/go/main/App';
import EquipmentFormModal from '../components/equipment/EquipmentFormModal';
import EquipmentViewModal from '../components/equipment/EquipmentViewModal';
import { Pencil, Trash2, Download } from 'lucide-react';
import './EquipmentPage.css';

export default function EquipmentPage() {
  const { data, editMode, reloadData } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [modelFilter, setModelFilter] = useState('');
  const [roomFilter, setRoomFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [yearFrom, setYearFrom] = useState('');
  const [yearTo, setYearTo] = useState('');
  
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<Equipment | null>(null);
  const [viewingItem, setViewingItem] = useState<Equipment | null>(null);

  const equipmentList = data?.equipment || [];

  const uniqueModels = useMemo(() => {
    const models = equipmentList.map(eq => eq.commonFields.model).filter(m => m.trim() !== '');
    return Array.from(new Set(models)).sort();
  }, [equipmentList]);

  const filteredEquipment = useMemo(() => {
    return equipmentList.filter((eq) => {
      const matchSearch =
        eq.inventoryNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        eq.commonFields.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        eq.commonFields.startYear.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchType = typeFilter ? eq.type === typeFilter : true;
      const matchModel = modelFilter ? eq.commonFields.model === modelFilter : true;
      const matchRoom = roomFilter ? eq.roomId === roomFilter : true;
      const matchUser = userFilter ? eq.responsibleUserId === userFilter : true;
      const eqYear = parseInt(eq.commonFields.startYear || '0') || 0;
      const matchYearFrom = yearFrom ? eqYear >= parseInt(yearFrom) : true;
      const matchYearTo = yearTo ? eqYear <= parseInt(yearTo) : true;

      return matchSearch && matchType && matchModel && matchRoom && matchUser && matchYearFrom && matchYearTo;
    });
  }, [equipmentList, searchTerm, typeFilter, modelFilter, roomFilter, userFilter, yearFrom, yearTo]);

  const handleAdd = () => {
    setEditingItem(null);
    setShowForm(true);
  };

  const handleEdit = (eq: Equipment) => {
    setEditingItem(eq);
    setShowForm(true);
  };

  const handleRowClick = (eq: Equipment, e: React.MouseEvent) => {
    // Prevent opening view modal if clicking on action buttons
    if ((e.target as HTMLElement).closest('button')) return;
    setViewingItem(eq);
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

  const handleExport = async () => {
    try {
      const ids = filteredEquipment.map(eq => eq.id);
      const path = await ExportReportToXLSX(ids);
      if (path) {
        alert(`Отчет успешно сохранен в файл:\n${path}`);
      }
    } catch (err: any) {
      if (err) {
        alert(`Ошибка при экспорте: ${err}`);
      }
    }
  };

  return (
    <div className="equipment-page">
      {editMode && (
        <div className="page-header" style={{ justifyContent: 'flex-end', marginBottom: 'var(--spacing-lg)' }}>
          <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
            <button className="btn btn-primary" onClick={handleAdd}>
              <span style={{ fontSize: '1.2rem', marginRight: '4px' }}>+</span> Добавить технику
            </button>
          </div>
        </div>
      )}

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
        <div className="form-group" style={{ minWidth: '150px' }}>
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
        <div className="form-group" style={{ minWidth: '150px' }}>
          <select
            className="select"
            value={modelFilter}
            onChange={(e) => setModelFilter(e.target.value)}
          >
            <option value="">Все модели</option>
            {uniqueModels.map(model => (
              <option key={model} value={model}>
                {model}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group" style={{ minWidth: '150px' }}>
          <select
            className="select"
            value={roomFilter}
            onChange={(e) => setRoomFilter(e.target.value)}
          >
            <option value="">Все кабинеты</option>
            {data?.rooms.map(room => (
              <option key={room.id} value={room.id}>
                Каб. {room.number}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group" style={{ minWidth: '200px' }}>
          <select
            className="select"
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
          >
            <option value="">Все ответственные</option>
            {data?.responsibleUsers.map(user => (
              <option key={user.id} value={user.id}>
                {user.lastName} {user.firstName[0]}. {user.patronymic?.[0] ? user.patronymic[0] + '.' : ''}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group" style={{ minWidth: '100px' }}>
          <input
            type="number"
            className="input"
            placeholder="Год от"
            value={yearFrom}
            onChange={(e) => setYearFrom(e.target.value)}
          />
        </div>
        <div className="form-group" style={{ minWidth: '100px' }}>
          <input
            type="number"
            className="input"
            placeholder="Год до"
            value={yearTo}
            onChange={(e) => setYearTo(e.target.value)}
          />
        </div>
        <button className="btn btn-secondary" style={{ padding: '0 var(--spacing-md)', height: '40px' }} onClick={handleExport} title="Экспорт отфильтрованных данных в Excel">
          <Download size={20} />
        </button>
      </div>

      <div className="table-container card">
        <table className="table">
          <thead>
            <tr>
              <th>Инв. №</th>
              <th>Тип</th>
              <th>Год начала / Модель</th>
              <th>Кабинет / Ответственный</th>
              {editMode && <th style={{ width: '120px', textAlign: 'right' }}>Действия</th>}
            </tr>
          </thead>
          <tbody>
            {filteredEquipment.length === 0 ? (
              <tr>
                <td colSpan={editMode ? 5 : 4} style={{ textAlign: 'center', padding: 'var(--spacing-3xl)' }}>
                  <div style={{ color: 'var(--text-muted)' }}>Ничего не найдено</div>
                </td>
              </tr>
            ) : (
              filteredEquipment.map((eq) => {
                const room = data?.rooms.find((r) => r.id === eq.roomId);
                const user = data?.responsibleUsers.find((u) => u.id === eq.responsibleUserId);

                return (
                  <tr key={eq.id} onClick={(e) => handleRowClick(eq, e)} style={{ cursor: 'pointer' }} className="table-row-hover">
                    <td>
                      <span className="badge badge-primary">{eq.inventoryNumber}</span>
                    </td>
                    <td>{EQUIPMENT_TYPE_LABELS[eq.type]}</td>
                    <td>
                      <div style={{ fontWeight: 'var(--font-weight-medium)' }}>{eq.commonFields.model}</div>
                      <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
                        Год: {eq.commonFields.startYear || '—'}
                      </div>
                    </td>
                    <td>
                      <div>{room ? room.number : '-'}</div>
                      <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
                        {user ? `${user.lastName} ${user.firstName[0]}. ${user.patronymic?.[0] || ''}.` : '-'}
                      </div>
                    </td>
                    {editMode && (
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 'var(--spacing-sm)', justifyContent: 'flex-end' }}>
                          <button className="btn btn-icon btn-secondary" onClick={() => handleEdit(eq)} title="Редактировать">
                            <Pencil size={16} />
                          </button>
                          <button className="btn btn-icon btn-danger" onClick={() => handleDelete(eq.id)} title="Удалить">
                            <Trash2 size={16} />
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

      {viewingItem && (
        <EquipmentViewModal
          equipment={viewingItem}
          onClose={() => setViewingItem(null)}
          onEdit={editMode ? () => { setViewingItem(null); handleEdit(viewingItem); } : undefined}
        />
      )}
    </div>
  );
}

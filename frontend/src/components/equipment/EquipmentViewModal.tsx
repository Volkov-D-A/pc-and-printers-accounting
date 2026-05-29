import { X, Server, Network, User, MapPin } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { EQUIPMENT_TYPE_LABELS, COMPONENT_TYPE_LABELS } from '../../types';
import type { Equipment } from '../../types';
import './EquipmentViewModal.css';

interface EquipmentViewModalProps {
  equipment: Equipment;
  onClose: () => void;
  onEdit?: () => void;
}

export default function EquipmentViewModal({ equipment, onClose, onEdit }: EquipmentViewModalProps) {
  const { data, editMode } = useAppContext();

  const room = data?.rooms.find((r) => r.id === equipment.roomId);
  const user = data?.responsibleUsers.find((u) => u.id === equipment.responsibleUserId);

  const renderValue = (val: string | undefined | null) => {
    if (!val || val.trim() === '') return <span className="view-value empty">Не указано</span>;
    return <span className="view-value">{val}</span>;
  };

  return (
    <div className="view-modal-overlay" onClick={onClose}>
      <div className="view-modal" onClick={(e) => e.stopPropagation()}>
        <div className="view-modal-header">
          <h2>
            <Server size={24} />
            {EQUIPMENT_TYPE_LABELS[equipment.type]} — {equipment.inventoryNumber}
          </h2>
          <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
            {editMode && onEdit && (
              <button className="btn btn-secondary btn-sm" onClick={onEdit}>
                Редактировать
              </button>
            )}
            <button className="btn btn-icon btn-secondary" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="view-modal-content">
          {equipment.inRepair && (
            <div style={{ padding: 'var(--spacing-md)', background: 'var(--accent-warning)', color: '#fff', borderRadius: 'var(--border-radius-md)', marginBottom: 'var(--spacing-lg)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
              <span style={{ fontSize: '1.2rem' }}>🔧</span>
              <span style={{ fontWeight: 'bold' }}>
                Оборудование находится в ремонте {equipment.repairDate ? `с ${equipment.repairDate}` : ''}
              </span>
            </div>
          )}
          
          <section>
            <h3 className="view-section-title">Общая информация</h3>
            <div className="view-grid">
              <div className="view-field">
                <span className="view-label">Инвентарный номер</span>
                {renderValue(equipment.inventoryNumber)}
              </div>
              <div className="view-field">
                <span className="view-label">Модель</span>
                {renderValue(equipment.commonFields.model)}
              </div>
              <div className="view-field">
                <span className="view-label">Серийный номер</span>
                {renderValue(equipment.commonFields.serialNumber)}
              </div>
              <div className="view-field">
                <span className="view-label">Год начала эксплуатации</span>
                {renderValue(equipment.commonFields.startYear)}
              </div>
              <div className="view-field">
                <span className="view-label">Дата ввода в учет</span>
                {renderValue(equipment.commissionDate)}
              </div>
            </div>
          </section>

          <section>
            <h3 className="view-section-title">Расположение</h3>
            <div className="view-grid">
              <div className="view-field">
                <span className="view-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={12} /> Кабинет</span>
                {room ? <span className="view-value">{room.number} (Этаж {room.floor})</span> : renderValue(null)}
              </div>
              <div className="view-field">
                <span className="view-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><User size={12} /> Ответственный</span>
                {user ? <span className="view-value">{user.lastName} {user.firstName} {user.patronymic || ''}</span> : renderValue(null)}
              </div>
            </div>
          </section>

          <section>
            <h3 className="view-section-title">Сетевые настройки</h3>
            <div className="view-grid">
              <div className="view-field">
                <span className="view-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Network size={12} /> Режим IP</span>
                <span className="view-value">{equipment.ipMode === 'static' ? 'Статический' : 'DHCP'}</span>
              </div>
              {equipment.ipMode === 'static' && (
                <div className="view-field">
                  <span className="view-label">IP-адрес</span>
                  {renderValue(equipment.ipAddress)}
                </div>
              )}
            </div>
          </section>

          {/* Специфичные поля */}
          {Object.keys(equipment.specificFields || {}).length > 0 && (
            <section>
              <h3 className="view-section-title">Спецификации</h3>
              <div className="view-grid">
                {(equipment.type === 'pc' || equipment.type === 'laptop' || equipment.type === 'monoblock') && (
                  <>
                    <div className="view-field">
                      <span className="view-label">ОС</span>
                      {renderValue(equipment.specificFields?.os as string)}
                    </div>
                    <div className="view-field">
                      <span className="view-label">Hostname</span>
                      {renderValue(equipment.specificFields?.hostname as string)}
                    </div>
                    <div className="view-field">
                      <span className="view-label">ОЗУ (ГБ)</span>
                      {renderValue(equipment.specificFields?.ram as string)}
                    </div>
                    <div className="view-field">
                      <span className="view-label">Тип накопителя</span>
                      {renderValue(equipment.specificFields?.driveType as string)}
                    </div>
                    <div className="view-field">
                      <span className="view-label">Объем накопителя (ГБ)</span>
                      {renderValue(equipment.specificFields?.driveSize as string)}
                    </div>
                  </>
                )}
                {(equipment.type === 'printer' || equipment.type === 'mfp') && (
                  <>
                    <div className="view-field">
                      <span className="view-label">Тип картриджа</span>
                      {renderValue(equipment.specificFields?.cartridgeType as string)}
                    </div>
                    <div className="view-field">
                      <span className="view-label">Тип фотобарабана</span>
                      {renderValue(equipment.specificFields?.drumType as string)}
                    </div>
                  </>
                )}
              </div>
            </section>
          )}

          {/* Комплектующие */}
          {equipment.components && equipment.components.length > 0 && (
            <section>
              <h3 className="view-section-title">Комплектующие / Периферия ({equipment.components.length})</h3>
              <div style={{ border: '1px solid var(--surface-border-light)', borderRadius: 'var(--border-radius-md)', overflow: 'hidden' }}>
                <table className="view-components-table">
                  <thead>
                    <tr>
                      <th>Тип</th>
                      <th>Название / Модель</th>
                      <th>Серийный / Инв. номер</th>
                    </tr>
                  </thead>
                  <tbody>
                    {equipment.components.map((comp) => (
                      <tr key={comp.id}>
                        <td>{COMPONENT_TYPE_LABELS[comp.type] || comp.type}</td>
                        <td>{comp.name}</td>
                        <td>
                          {comp.inventoryNumber && <div>Инв: {comp.inventoryNumber}</div>}
                          {comp.serialNumber && <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>SN: {comp.serialNumber}</div>}
                          {!comp.inventoryNumber && !comp.serialNumber && '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Заметки */}
          {equipment.notes && equipment.notes.trim() !== '' && (
            <section>
              <h3 className="view-section-title">Заметки</h3>
              <div style={{ whiteSpace: 'pre-wrap', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
                {equipment.notes}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

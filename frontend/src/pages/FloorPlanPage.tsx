import { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import type { FloorPlan, FloorPlanRoom, Room, Equipment } from '../types';
import { EQUIPMENT_TYPE_LABELS } from '../types';
import { UpdateFloorPlan } from '../../wailsjs/go/main/App';
import { MousePointer2, User } from 'lucide-react';
import EquipmentViewModal from '../components/equipment/EquipmentViewModal';
import './FloorPlanPage.css';

// Константы
const FLOORS = [
  { level: 0, label: '0 эт.' },
  { level: 1, label: '1 эт.' },
  { level: 2, label: '2 эт.' },
];

const DEFAULT_WIDTH = 1200;
const DEFAULT_HEIGHT = 800;

export default function FloorPlanPage() {
  const { data, editMode, reloadData } = useAppContext();
  const [currentFloor, setCurrentFloor] = useState<number>(1);
  
  // Состояние редактора
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [viewingEquipment, setViewingEquipment] = useState<Equipment | null>(null);
  
  // Локальный стейт текущего плана для редактирования (до сохранения)
  const currentPlan = useMemo(() => {
    return data?.floorPlans.find((p) => p.floor === currentFloor) || {
      floor: currentFloor, width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT, rooms: []
    };
  }, [data, currentFloor]);

  const [localRooms, setLocalRooms] = useState<FloorPlanRoom[]>(currentPlan.rooms);

  // Синхронизация при смене этажа
  useMemo(() => {
    setLocalRooms(currentPlan.rooms);
    setSelectedRoomId(null);
  }, [currentPlan]);

  const hasUnsavedChanges = useMemo(() => {
    return JSON.stringify(localRooms) !== JSON.stringify(currentPlan.rooms);
  }, [localRooms, currentPlan.rooms]);

  // Оборудование на текущем этаже для отображения инфо-панели
  const equipmentInSelectedRoom = useMemo(() => {
    if (!selectedRoomId || !data) return [];
    return data.equipment.filter(eq => eq.roomId === selectedRoomId);
  }, [selectedRoomId, data]);

  const equipmentByUser = useMemo(() => {
    const grouped: Record<string, Equipment[]> = {};
    equipmentInSelectedRoom.forEach(eq => {
      const uid = eq.responsibleUserId || 'unassigned';
      if (!grouped[uid]) grouped[uid] = [];
      grouped[uid].push(eq);
    });
    return grouped;
  }, [equipmentInSelectedRoom]);

  const selectedLogicalRoom = useMemo(() => {
    if (!selectedRoomId || !data) return null;
    return data.rooms.find(r => r.id === selectedRoomId);
  }, [selectedRoomId, data]);

  // === События редактора (Только в editMode) ===

  const handleMouseDown = (e: React.MouseEvent<SVGRectElement>, room: FloorPlanRoom) => {
    e.stopPropagation();
    if (!editMode) {
      setSelectedRoomId(room.roomId);
      return;
    }
    e.stopPropagation();
    setSelectedRoomId(room.roomId);
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setDragOffset({ x: room.x, y: room.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !editMode || !selectedRoomId) return;

    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;

    const GRID_SIZE = 25;
    const snap = (val: number) => Math.round(val / GRID_SIZE) * GRID_SIZE;

    // В реальном приложении нужно учитывать масштаб (zoom/pan), но здесь для простоты 1:1
    setLocalRooms(prev => prev.map(r => {
      if (r.roomId === selectedRoomId) {
        return {
          ...r,
          x: Math.max(0, snap(dragOffset.x + dx)),
          y: Math.max(0, snap(dragOffset.y + dy))
        };
      }
      return r;
    }));
  };

  const handleMouseUp = () => {
    if (!editMode) return;
    setIsDragging(false);
  };

  const handleSvgClick = () => {
    if (isDragging) return;
    setSelectedRoomId(null);
  };

  const handleAddRoom = (roomId: string) => {
    if (!editMode) return;
    if (localRooms.some(r => r.roomId === roomId)) {
      alert('Этот кабинет уже есть на плане');
      return;
    }
    const newRoom: FloorPlanRoom = {
      roomId, shape: 'rect', x: 50, y: 50, width: 100, height: 75, color: '#6366f1'
    };
    setLocalRooms([...localRooms, newRoom]);
    setSelectedRoomId(roomId);
  };

  const handleRemoveRoom = () => {
    if (!editMode || !selectedRoomId) return;
    setLocalRooms(prev => prev.filter(r => r.roomId !== selectedRoomId));
    setSelectedRoomId(null);
  };

  const handleSave = async () => {
    if (!editMode) return;
    try {
      const newPlan: FloorPlan = {
        floor: currentFloor,
        width: currentPlan.width,
        height: currentPlan.height,
        rooms: localRooms,
      };
      await UpdateFloorPlan(newPlan as any);
      await reloadData();
    } catch (err: any) {
      alert(`Ошибка сохранения: ${err}`);
    }
  };

  // Кабинеты текущего этажа (логические), которых еще нет на плане
  const unmappedRooms = useMemo(() => {
    if (!data) return [];
    const onFloor = data.rooms.filter(r => r.floor === currentFloor);
    return onFloor.filter(r => !localRooms.some(lr => lr.roomId === r.id));
  }, [data, currentFloor, localRooms]);

  return (
    <div className="floorplan-page">


      <div className="floorplan-layout">
        {/* SVG Редактор/Вьювер */}
        <div className="floorplan-svg-container card" 
             onMouseMove={handleMouseMove} 
             onMouseUp={handleMouseUp}
             onMouseLeave={handleMouseUp}
             onClick={handleSvgClick}>
          <svg 
            width="100%" 
            height="100%" 
            viewBox={`0 0 ${currentPlan.width} ${currentPlan.height}`}
            className="floorplan-svg"
          >
            {/* Сетка (опционально) */}
            <defs>
              <pattern id="grid" width="25" height="25" patternUnits="userSpaceOnUse">
                <path d="M 25 0 L 0 0 0 25" fill="none" stroke="var(--surface-border)" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />

            {/* Внешний контур этажа (заглушка, если нет сложной формы) */}
            <rect x="0" y="0" width={currentPlan.width} height={currentPlan.height} fill="none" stroke="var(--surface-border-light)" strokeWidth="2" />

            {/* Отрисовка комнат */}
            {localRooms.map(room => {
              const isSelected = room.roomId === selectedRoomId;
              const logicalRoom = data?.rooms.find(r => r.id === room.roomId);
              return (
                <g key={room.roomId} transform={`translate(${room.x}, ${room.y})`}>
                  <rect
                    width={room.width}
                    height={room.height}
                    fill={room.color}
                    fillOpacity={isSelected ? 0.8 : 0.4}
                    stroke={isSelected ? '#fff' : room.color}
                    strokeWidth={isSelected ? 3 : 1}
                    style={{ cursor: editMode ? 'grab' : 'pointer', transition: 'fill-opacity 0.2s' }}
                    onMouseDown={(e) => handleMouseDown(e, room)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  {logicalRoom && (
                    <text
                      x={room.width / 2}
                      y={room.height / 2}
                      textAnchor="middle"
                      alignmentBaseline="middle"
                      fill="#fff"
                      fontSize="14"
                      fontWeight="bold"
                      style={{ pointerEvents: 'none' }}
                    >
                      {logicalRoom.number}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Сайдбар панели управления */}
        <div className="floorplan-sidebar">
          <div className="card">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
              <div className="floor-tabs" style={{ display: 'flex', gap: 'var(--spacing-sm)', flexWrap: 'wrap' }}>
                {FLOORS.map(f => (
                  <button
                    key={f.level}
                    className={`btn ${currentFloor === f.level ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setCurrentFloor(f.level)}
                    style={{ flex: 1, minWidth: '80px', padding: 'var(--spacing-sm)' }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {editMode && (
                <button 
                  className="btn btn-primary" 
                  onClick={handleSave} 
                  disabled={!hasUnsavedChanges}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  {hasUnsavedChanges ? '💾 Сохранить' : '💾 Сохранено'}
                </button>
              )}
            </div>
          </div>
          {editMode ? (
            <div className="card">
              <h3 className="section-subtitle">Редактор (Этаж {currentFloor})</h3>
              
              <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                <label className="form-label">Неразмещенные кабинеты</label>
                {unmappedRooms.length === 0 ? (
                  <div className="text-muted text-sm mt-sm">Все кабинеты размещены</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)', marginTop: 'var(--spacing-sm)' }}>
                    {unmappedRooms.map(r => (
                      <button key={r.id} className="btn btn-secondary btn-sm" onClick={() => handleAddRoom(r.id)}>
                        + {r.number}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {selectedRoomId && selectedLogicalRoom && (
                <div style={{ padding: 'var(--spacing-md)', background: 'var(--bg-tertiary)', borderRadius: 'var(--border-radius-md)' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: 'var(--spacing-sm)' }}>
                    Выбран: {selectedLogicalRoom.number}
                  </div>
                  <button className="btn btn-danger btn-sm" onClick={handleRemoveRoom} style={{ width: '100%' }}>
                    Убрать с плана
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="card" style={{ height: '100%' }}>
              <h3 className="section-subtitle">Информация</h3>
              
              {!selectedRoomId ? (
                <div className="empty-state" style={{ padding: 'var(--spacing-xl)' }}>
                  <div className="empty-state-icon" style={{ fontSize: '2rem' }}><MousePointer2 size={32} /></div>
                  <p>Кликните на кабинет для просмотра деталей</p>
                </div>
              ) : selectedLogicalRoom ? (
                <div>
                  <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'bold', marginBottom: 'var(--spacing-sm)' }}>
                    Кабинет {selectedLogicalRoom.number}
                  </div>

                  <h4 style={{ marginBottom: 'var(--spacing-sm)' }}>Техника ({equipmentInSelectedRoom.length}):</h4>
                  {equipmentInSelectedRoom.length === 0 ? (
                    <div className="text-muted text-sm">В кабинете нет закреплённой техники</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)', maxHeight: '400px', overflowY: 'auto' }}>
                      {Object.entries(equipmentByUser).map(([userId, eqs]) => {
                        let userName = 'Без ответственного';
                        if (userId !== 'unassigned') {
                          const u = data?.responsibleUsers.find(u => u.id === userId);
                          if (u) userName = `${u.lastName} ${u.firstName[0]}. ${u.patronymic?.[0] ? u.patronymic[0] + '.' : ''}`.trim();
                        }

                        return (
                          <div key={userId}>
                            <div style={{ fontWeight: 'bold', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--spacing-xs)', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <User size={14} /> {userName} ({eqs.length})
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
                              {eqs.map(eq => (
                                <div 
                                  key={eq.id} 
                                  style={{ padding: 'var(--spacing-sm)', background: 'var(--bg-tertiary)', borderRadius: 'var(--border-radius-md)', cursor: 'pointer' }}
                                  onClick={() => setViewingEquipment(eq)}
                                  className="table-row-hover"
                                >
                                  <div style={{ fontWeight: 'bold', fontSize: 'var(--font-size-sm)', display: 'flex', gap: '4px' }}>
                                    <span>{eq.inventoryNumber}</span>
                                    <span style={{ color: 'var(--text-secondary)', fontWeight: 'normal' }}>({EQUIPMENT_TYPE_LABELS[eq.type]})</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>

      {viewingEquipment && (
        <EquipmentViewModal
          equipment={viewingEquipment}
          onClose={() => setViewingEquipment(null)}
        />
      )}
    </div>
  );
}

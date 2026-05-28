import { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import type { FloorPlan, FloorPlanRoom, Room, Equipment } from '../types';
import { UpdateFloorPlan } from '../../wailsjs/go/main/App';
import './FloorPlanPage.css';

// Константы
const FLOORS = [
  { level: 0, label: 'Цокольный этаж' },
  { level: 1, label: '1 Этаж' },
  { level: 2, label: '2 Этаж' },
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

  const selectedLogicalRoom = useMemo(() => {
    if (!selectedRoomId || !data) return null;
    return data.rooms.find(r => r.id === selectedRoomId);
  }, [selectedRoomId, data]);

  // === События редактора (Только в editMode) ===

  const handleMouseDown = (e: React.MouseEvent<SVGRectElement>, room: FloorPlanRoom) => {
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

    // В реальном приложении нужно учитывать масштаб (zoom/pan), но здесь для простоты 1:1
    setLocalRooms(prev => prev.map(r => {
      if (r.roomId === selectedRoomId) {
        return {
          ...r,
          x: Math.max(0, dragOffset.x + dx),
          y: Math.max(0, dragOffset.y + dy)
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
      roomId, shape: 'rect', x: 50, y: 50, width: 150, height: 100, color: '#6366f1'
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
      <div className="page-header">
        <h1 className="page-title">Поэтажный план</h1>
        
        <div className="floor-tabs">
          {FLOORS.map(f => (
            <button
              key={f.level}
              className={`btn ${currentFloor === f.level ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setCurrentFloor(f.level)}
            >
              {f.label}
            </button>
          ))}
        </div>

        {editMode && (
          <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
            <button 
              className="btn btn-primary" 
              onClick={handleSave} 
              disabled={!hasUnsavedChanges}
            >
              {hasUnsavedChanges ? '💾 Сохранить (есть изменения)' : '💾 Сохранено'}
            </button>
          </div>
        )}
      </div>

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
              <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                <path d="M 50 0 L 0 0 0 50" fill="none" stroke="var(--surface-border)" strokeWidth="0.5" />
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
                        + {r.number} ({r.name})
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {selectedRoomId && selectedLogicalRoom && (
                <div style={{ padding: 'var(--spacing-md)', background: 'var(--bg-tertiary)', borderRadius: 'var(--border-radius-md)' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: 'var(--spacing-sm)' }}>
                    Выбран: {selectedLogicalRoom.number} ({selectedLogicalRoom.name})
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
                  <div className="empty-state-icon" style={{ fontSize: '2rem' }}>🖱️</div>
                  <p>Кликните на кабинет для просмотра деталей</p>
                </div>
              ) : selectedLogicalRoom ? (
                <div>
                  <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'bold', marginBottom: 'var(--spacing-sm)' }}>
                    Кабинет {selectedLogicalRoom.number}
                  </div>
                  <div style={{ color: 'var(--text-secondary)', marginBottom: 'var(--spacing-lg)' }}>
                    {selectedLogicalRoom.name}
                  </div>

                  <h4 style={{ marginBottom: 'var(--spacing-sm)' }}>Техника ({equipmentInSelectedRoom.length}):</h4>
                  {equipmentInSelectedRoom.length === 0 ? (
                    <div className="text-muted text-sm">В кабинете нет закреплённой техники</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)', maxHeight: '400px', overflowY: 'auto' }}>
                      {equipmentInSelectedRoom.map(eq => (
                        <div key={eq.id} style={{ padding: 'var(--spacing-sm)', background: 'var(--bg-tertiary)', borderRadius: 'var(--border-radius-md)' }}>
                          <div style={{ fontWeight: 'bold', fontSize: 'var(--font-size-sm)' }}>{eq.inventoryNumber}</div>
                          <div style={{ fontSize: 'var(--font-size-sm)' }}>{eq.commonFields.manufacturer} {eq.commonFields.model}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

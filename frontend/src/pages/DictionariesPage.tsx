import { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import type { Department, ResponsibleUser, Room } from '../types';
import { AddDepartment, UpdateDepartment, DeleteDepartment, AddUser, UpdateUser, DeleteUser, AddRoom, UpdateRoom, DeleteRoom } from '../../wailsjs/go/main/App';

type ActiveTab = 'departments' | 'users' | 'rooms';

export default function DictionariesPage() {
  const { data, editMode, reloadData } = useAppContext();
  const [activeTab, setActiveTab] = useState<ActiveTab>('departments');

  // Form states
  const [showForm, setShowForm] = useState(false);
  
  const [deptForm, setDeptForm] = useState<Partial<Department>>({ name: '' });
  const [userForm, setUserForm] = useState<Partial<ResponsibleUser>>({ lastName: '', firstName: '', patronymic: '', departmentId: '' });
  const [roomForm, setRoomForm] = useState<Partial<Room>>({ number: '', name: '', floor: 1 });

  // === Departments ===
  const handleEditDept = (d: Department) => { setDeptForm(d); setShowForm(true); };
  const handleDeleteDept = async (id: string) => {
    if (!window.confirm('Удалить подразделение?')) return;
    try { await DeleteDepartment(id); await reloadData(); } catch (err) { alert(err); }
  };
  const handleSaveDept = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (deptForm.id) await UpdateDepartment(deptForm as any);
      else await AddDepartment(deptForm as any);
      setShowForm(false);
      await reloadData();
    } catch (err) { alert(err); }
  };

  // === Users ===
  const handleEditUser = (u: ResponsibleUser) => { setUserForm(u); setShowForm(true); };
  const handleDeleteUser = async (id: string) => {
    if (!window.confirm('Удалить пользователя?')) return;
    try { await DeleteUser(id); await reloadData(); } catch (err) { alert(err); }
  };
  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (userForm.id) await UpdateUser(userForm as any);
      else await AddUser(userForm as any);
      setShowForm(false);
      await reloadData();
    } catch (err) { alert(err); }
  };

  // === Rooms ===
  const handleEditRoom = (r: Room) => { setRoomForm(r); setShowForm(true); };
  const handleDeleteRoom = async (id: string) => {
    if (!window.confirm('Удалить кабинет?')) return;
    try { await DeleteRoom(id); await reloadData(); } catch (err) { alert(err); }
  };
  const handleSaveRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (roomForm.id) await UpdateRoom(roomForm as any);
      else await AddRoom(roomForm as any);
      setShowForm(false);
      await reloadData();
    } catch (err) { alert(err); }
  };

  const handleAddNew = () => {
    setShowForm(true);
    if (activeTab === 'departments') setDeptForm({ name: '' });
    else if (activeTab === 'users') setUserForm({ lastName: '', firstName: '', patronymic: '', departmentId: '' });
    else if (activeTab === 'rooms') setRoomForm({ number: '', name: '', floor: 1 });
  };

  return (
    <div style={{ padding: 'var(--spacing-xl)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-xl)' }}>
        <h1 className="page-title" style={{ margin: 0 }}>Справочники</h1>
        {editMode && (
          <button className="btn btn-primary" onClick={handleAddNew}>+ Добавить запись</button>
        )}
      </div>

      <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)' }}>
        <button className={`btn ${activeTab === 'departments' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('departments')}>Подразделения</button>
        <button className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('users')}>Пользователи</button>
        <button className={`btn ${activeTab === 'rooms' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('rooms')}>Кабинеты</button>
      </div>

      <div className="card">
        {activeTab === 'departments' && (
          <table className="table">
            <thead><tr><th>Название</th>{editMode && <th style={{textAlign:'right'}}>Действия</th>}</tr></thead>
            <tbody>
              {data?.departments.map(d => (
                <tr key={d.id}>
                  <td>{d.name}</td>
                  {editMode && (
                    <td style={{textAlign:'right'}}>
                      <button className="btn btn-icon btn-secondary" onClick={() => handleEditDept(d)}>✏️</button>
                      <button className="btn btn-icon btn-danger" onClick={() => handleDeleteDept(d.id)}>🗑️</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeTab === 'users' && (
          <table className="table">
            <thead><tr><th>ФИО</th><th>Подразделение</th>{editMode && <th style={{textAlign:'right'}}>Действия</th>}</tr></thead>
            <tbody>
              {data?.responsibleUsers.map(u => {
                const dept = data?.departments.find(d => d.id === u.departmentId);
                return (
                  <tr key={u.id}>
                    <td>{u.lastName} {u.firstName} {u.patronymic}</td>
                    <td>{dept?.name || '-'}</td>
                    {editMode && (
                      <td style={{textAlign:'right'}}>
                        <button className="btn btn-icon btn-secondary" onClick={() => handleEditUser(u)}>✏️</button>
                        <button className="btn btn-icon btn-danger" onClick={() => handleDeleteUser(u.id)}>🗑️</button>
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}

        {activeTab === 'rooms' && (
          <table className="table">
            <thead><tr><th>Номер</th><th>Название</th><th>Этаж</th>{editMode && <th style={{textAlign:'right'}}>Действия</th>}</tr></thead>
            <tbody>
              {data?.rooms.map(r => (
                <tr key={r.id}>
                  <td><span className="badge badge-primary">{r.number}</span></td>
                  <td>{r.name}</td>
                  <td>{r.floor}</td>
                  {editMode && (
                    <td style={{textAlign:'right'}}>
                      <button className="btn btn-icon btn-secondary" onClick={() => handleEditRoom(r)}>✏️</button>
                      <button className="btn btn-icon btn-danger" onClick={() => handleDeleteRoom(r.id)}>🗑️</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showForm && (
        <div className="modal-overlay">
          <div className="modal">
            <h2 className="modal-title">Добавить/Редактировать</h2>
            
            {activeTab === 'departments' && (
              <form onSubmit={handleSaveDept}>
                <div className="form-group mb-lg">
                  <label className="form-label">Название подразделения</label>
                  <input className="input" value={deptForm.name} onChange={e => setDeptForm({...deptForm, name: e.target.value})} required />
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Отмена</button>
                  <button type="submit" className="btn btn-primary">Сохранить</button>
                </div>
              </form>
            )}

            {activeTab === 'users' && (
              <form onSubmit={handleSaveUser}>
                <div className="form-group mb-sm">
                  <label className="form-label">Фамилия</label>
                  <input className="input" value={userForm.lastName} onChange={e => setUserForm({...userForm, lastName: e.target.value})} required />
                </div>
                <div className="form-group mb-sm">
                  <label className="form-label">Имя</label>
                  <input className="input" value={userForm.firstName} onChange={e => setUserForm({...userForm, firstName: e.target.value})} required />
                </div>
                <div className="form-group mb-sm">
                  <label className="form-label">Отчество</label>
                  <input className="input" value={userForm.patronymic} onChange={e => setUserForm({...userForm, patronymic: e.target.value})} />
                </div>
                <div className="form-group mb-lg">
                  <label className="form-label">Подразделение</label>
                  <select className="select" value={userForm.departmentId} onChange={e => setUserForm({...userForm, departmentId: e.target.value})}>
                    <option value="">Без подразделения</option>
                    {data?.departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Отмена</button>
                  <button type="submit" className="btn btn-primary">Сохранить</button>
                </div>
              </form>
            )}

            {activeTab === 'rooms' && (
              <form onSubmit={handleSaveRoom}>
                <div className="form-group mb-sm">
                  <label className="form-label">Номер</label>
                  <input className="input" value={roomForm.number} onChange={e => setRoomForm({...roomForm, number: e.target.value})} required />
                </div>
                <div className="form-group mb-sm">
                  <label className="form-label">Название / Описание</label>
                  <input className="input" value={roomForm.name} onChange={e => setRoomForm({...roomForm, name: e.target.value})} required />
                </div>
                <div className="form-group mb-lg">
                  <label className="form-label">Этаж</label>
                  <select className="select" value={roomForm.floor} onChange={e => setRoomForm({...roomForm, floor: Number(e.target.value)})}>
                    <option value={0}>Цокольный (0)</option>
                    <option value={1}>Первый (1)</option>
                    <option value={2}>Второй (2)</option>
                  </select>
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Отмена</button>
                  <button type="submit" className="btn btn-primary">Сохранить</button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}
    </div>
  );
}

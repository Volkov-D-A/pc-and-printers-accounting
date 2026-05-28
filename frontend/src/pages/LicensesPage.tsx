import { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import type { License } from '../types';
import { AddLicense, UpdateLicense, DeleteLicense } from '../../wailsjs/go/main/App';
import './LicensesPage.css';

export default function LicensesPage() {
  const { data, editMode, reloadData } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<License | null>(null);

  const [formData, setFormData] = useState<Partial<License>>({
    softwareName: '',
    licenseKey: '',
    licenseType: 'perpetual',
    userId: '',
    quantity: 1,
    purchaseDate: new Date().toISOString().split('T')[0],
    expirationDate: '',
    notes: '',
  });

  const licenses = data?.licenses || [];

  const filteredLicenses = useMemo(() => {
    return licenses.filter(l => 
      l.softwareName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.licenseKey.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [licenses, searchTerm]);

  const handleAdd = () => {
    setEditingItem(null);
    setFormData({
      softwareName: '', licenseKey: '', licenseType: 'perpetual',
      userId: '', quantity: 1, purchaseDate: new Date().toISOString().split('T')[0],
      expirationDate: '', notes: ''
    });
    setShowForm(true);
  };

  const handleEdit = (l: License) => {
    setEditingItem(l);
    setFormData(JSON.parse(JSON.stringify(l)));
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Удалить эту лицензию?')) return;
    try {
      await DeleteLicense(id);
      await reloadData();
    } catch (err) {
      alert(`Ошибка: ${err}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.softwareName || !formData.licenseKey) {
      alert('Заполните обязательные поля');
      return;
    }
    try {
      if (editingItem?.id) {
        await UpdateLicense(formData as any);
      } else {
        await AddLicense(formData as any);
      }
      setShowForm(false);
      await reloadData();
    } catch (err) {
      alert(`Ошибка сохранения: ${err}`);
    }
  };

  return (
    <div className="licenses-page" style={{ padding: 'var(--spacing-xl)', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-xl)' }}>
        <h1 className="page-title" style={{ margin: 0 }}>Лицензии ПО</h1>
        {editMode && (
          <button className="btn btn-primary" onClick={handleAdd}>+ Добавить лицензию</button>
        )}
      </div>

      <div className="filters card" style={{ marginBottom: 'var(--spacing-lg)' }}>
        <input 
          type="text" 
          className="input" 
          placeholder="Поиск по названию или ключу..." 
          value={searchTerm} 
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="table-container card" style={{ flex: 1 }}>
        <table className="table">
          <thead>
            <tr>
              <th>Программное обеспечение</th>
              <th>Ключ</th>
              <th>Тип</th>
              <th>Пользователь</th>
              <th>Срок действия</th>
              {editMode && <th style={{ textAlign: 'right' }}>Действия</th>}
            </tr>
          </thead>
          <tbody>
            {filteredLicenses.length === 0 ? (
              <tr><td colSpan={editMode ? 6 : 5} style={{ textAlign: 'center', padding: 'var(--spacing-xl)' }}>Нет данных</td></tr>
            ) : filteredLicenses.map(l => {
              const user = data?.responsibleUsers.find(u => u.id === l.userId);
              return (
                <tr key={l.id}>
                  <td style={{ fontWeight: 'var(--font-weight-medium)' }}>{l.softwareName}</td>
                  <td><span className="badge badge-secondary">{l.licenseKey}</span></td>
                  <td>{l.licenseType === 'perpetual' ? 'Бессрочная' : 'Подписка'}</td>
                  <td>{user ? `${user.lastName} ${user.firstName[0]}.` : '-'}</td>
                  <td>
                    {l.licenseType === 'perpetual' ? 'Навсегда' : l.expirationDate || 'Не указан'}
                  </td>
                  {editMode && (
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 'var(--spacing-sm)', justifyContent: 'flex-end' }}>
                        <button className="btn btn-icon btn-secondary" onClick={() => handleEdit(l)}>✏️</button>
                        <button className="btn btn-icon btn-danger" onClick={() => handleDelete(l.id)}>🗑️</button>
                      </div>
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="modal-overlay">
          <div className="modal">
            <h2 className="modal-title">{editingItem ? 'Редактировать лицензию' : 'Новая лицензия'}</h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
              <div className="form-group">
                <label className="form-label">Название ПО *</label>
                <input className="input" value={formData.softwareName} onChange={e => setFormData({...formData, softwareName: e.target.value})} required />
              </div>
              <div className="form-group">
                <label className="form-label">Ключ *</label>
                <input className="input" value={formData.licenseKey} onChange={e => setFormData({...formData, licenseKey: e.target.value})} required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Тип</label>
                  <select className="select" value={formData.licenseType} onChange={e => setFormData({...formData, licenseType: e.target.value as any})}>
                    <option value="perpetual">Бессрочная</option>
                    <option value="subscription">Подписка</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Пользователь</label>
                  <select className="select" value={formData.userId} onChange={e => setFormData({...formData, userId: e.target.value})}>
                    <option value="">Не привязана</option>
                    {data?.responsibleUsers.map(u => (
                      <option key={u.id} value={u.id}>{u.lastName} {u.firstName}</option>
                    ))}
                  </select>
                </div>
              </div>
              {formData.licenseType === 'subscription' && (
                <div className="form-group">
                  <label className="form-label">Дата окончания</label>
                  <input type="date" className="input" value={formData.expirationDate || ''} onChange={e => setFormData({...formData, expirationDate: e.target.value})} />
                </div>
              )}
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Отмена</button>
                <button type="submit" className="btn btn-primary">Сохранить</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useCallback, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import AuthModal from './components/common/AuthModal';
import DashboardPage from './pages/DashboardPage';
import EquipmentPage from './pages/EquipmentPage';
import FloorPlanPage from './pages/FloorPlanPage';
import LicensesPage from './pages/LicensesPage';
import DictionariesPage from './pages/DictionariesPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import type { DataStore } from './types';
import { AppContext } from './context/AppContext';
import './styles/index.css';

import { 
  IsFirstRun, 
  HasDataFile, 
  GetAllData, 
  SetupPassword, 
  Authenticate, 
  ExitEditMode,
  IsEditMode,
  ReloadData
} from '../wailsjs/go/main/App';
import { EventsOn, EventsOff } from '../wailsjs/runtime/runtime';

export default function App() {
  const [data, setData] = useState<DataStore | null>(null);
  const [editMode, setEditMode] = useState(false);
  
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'setup' | 'login'>('login');
  const [authError, setAuthError] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [isFirstRun, setIsFirstRun] = useState(false);
  const [hasDataFile, setHasDataFile] = useState(false);

  // Инициализация при старте
  const initializeApp = useCallback(async () => {
    try {
      setLoading(true);
      const firstRun = await IsFirstRun();
      setIsFirstRun(firstRun);

      if (firstRun) {
        setAuthMode('setup');
        setShowAuthModal(true);
      }

      const hasFile = await HasDataFile();
      setHasDataFile(hasFile);

      if (hasFile) {
        const storeData = await GetAllData();
        // Приведение типов из-за особенностей генерации Wails
        setData(storeData as unknown as DataStore);
      }

      const isEdit = await IsEditMode();
      setEditMode(isEdit);
    } catch (err) {
      console.error('Ошибка инициализации:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    initializeApp();

    // Подписка на обновление данных в фоне
    EventsOn('data:updated', async () => {
      console.log('Файл данных был изменён извне, перезагрузка...');
      try {
        const newData = await ReloadData();
        setData(newData as unknown as DataStore);
      } catch (err) {
        console.error('Ошибка перезагрузки данных:', err);
      }
    });

    // Подписка на изменение режима редактирования
    EventsOn('auth:editModeChanged', (isEdit: boolean) => {
      setEditMode(isEdit);
    });

    return () => {
      EventsOff('data:updated');
      EventsOff('auth:editModeChanged');
    };
  }, [initializeApp]);

  const handleToggleEditMode = useCallback(async () => {
    if (editMode) {
      try {
        await ExitEditMode();
      } catch (err) {
        console.error(err);
      }
    } else {
      setAuthMode('login');
      setShowAuthModal(true);
      setAuthError('');
    }
  }, [editMode]);

  const handleAuth = useCallback(async (password: string) => {
    try {
      if (authMode === 'setup') {
        await SetupPassword(password);
        setIsFirstRun(false);
        setShowAuthModal(false);
      } else {
        await Authenticate(password);
        setShowAuthModal(false);
      }
    } catch (err: any) {
      setAuthError(err || 'Неверный пароль');
      throw err;
    }
  }, [authMode]);

  if (loading) {
    return <div className="app-layout" style={{ alignItems: 'center', justifyContent: 'center' }}>Загрузка...</div>;
  }

  return (
    <AppContext.Provider value={{ data, editMode, reloadData: async () => {
      try {
        const newData = await ReloadData();
        setData(newData as unknown as DataStore);
      } catch (err) {
        console.error(err);
      }
    }}}>
      <HashRouter>
        <div className="app-layout">
          <Sidebar />
          <div className="app-main">
            <Header editMode={editMode} onToggleEditMode={handleToggleEditMode} />
            <main className="app-content">
              {(!hasDataFile && !isFirstRun) ? (
                <Routes>
                  <Route path="/settings" element={<SettingsPage onFileSelected={initializeApp} />} />
                  <Route path="*" element={<Navigate to="/settings" replace />} />
                </Routes>
              ) : (
                <Routes>
                  <Route path="/" element={<DashboardPage />} />
                  <Route path="/equipment" element={<EquipmentPage />} />
                  <Route path="/floorplan" element={<FloorPlanPage />} />
                  <Route path="/licenses" element={<LicensesPage />} />
                  <Route path="/dictionaries" element={<DictionariesPage />} />
                  <Route path="/reports" element={<ReportsPage />} />
                  <Route path="/settings" element={<SettingsPage onFileSelected={initializeApp} />} />
                </Routes>
              )}
            </main>
          </div>
        </div>

        {showAuthModal && (
          <AuthModal
            mode={authMode}
            onSubmit={handleAuth}
            onCancel={authMode === 'setup' ? undefined : () => setShowAuthModal(false)}
            error={authError}
          />
        )}
      </HashRouter>
    </AppContext.Provider>
  );
}

import React, { useState, useEffect } from 'react';
import { ViewState, Promoter } from './types';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './views/DashboardView';
import { ManagementView } from './views/ManagementView';
import { DatabaseView } from './views/DatabaseView';
import { CalendarView } from './views/CalendarView';
import { LoginView } from './views/LoginView';
import { supabase } from './supabase';
import { Toaster } from 'react-hot-toast';

function App() {
  const [session, setSession] = useState<any>(null);
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [promoters, setPromoters] = useState<Promoter[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchPromoters = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('promoters')
        .select('*')
        .order('name');
      
      if (error) throw error;
      
      if (data) {
        const sanitized = data.map((p: any) => ({
            ...p,
            city: p.city || '',
            role: p.role || '',
            regional: p.regional || '',
            admission: p.admission || '',
            dueDate: p.dueDate || p.duedate || p.vencimento || p.Vencimento || '',
            limitDate: p.limitDate || p.limitdate || '',
            period1: p.period1 || { start: null, duration: 0 },
            period2: p.period2 || { start: null, duration: 0 }
        }));
        setPromoters(sanitized as Promoter[]);
      }
    } catch (error) {
      console.error('Error fetching promoters:', error);
      // toast.error('Erro ao carregar dados'); // We can add toast here if we want
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) {
      fetchPromoters();
    }
  }, [session]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setPromoters([]);
  };

  if (!session) {
    return (
      <>
        <Toaster position="top-right" />
        <LoginView onLoginSuccess={() => {}} />
      </>
    );
  }

  const renderContent = () => {
    if (loading && promoters.length === 0) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    switch (currentView) {
      case 'dashboard':
        return <DashboardView promoters={promoters} />;
      case 'management':
        return <ManagementView promoters={promoters} setPromoters={setPromoters} onRefresh={fetchPromoters} />;
      case 'database':
        return <DatabaseView promoters={promoters} setPromoters={setPromoters} onRefresh={fetchPromoters} />;
      case 'calendar':
        return <CalendarView promoters={promoters} />;
      default:
        return <DashboardView promoters={promoters} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 font-sans text-gray-900">
      <Toaster position="top-right" />
      <Sidebar currentView={currentView} setCurrentView={setCurrentView} onLogout={handleLogout} />
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {renderContent()}
      </div>
    </div>
  );
}

export default App;

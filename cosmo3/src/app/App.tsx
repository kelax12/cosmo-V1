// =============================================================================
// APP - Point d'entrée avec Code Splitting
// =============================================================================

import React, { Suspense, lazy, memo } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';

// Providers
import { AuthProvider, useAuth } from '@/features/auth';
import { DataProvider } from '@/features/data';

// Eager load critical pages
import LandingPage from '@/pages/LandingPage';
import LoginPage from '@/pages/LoginPage';
import SignupPage from '@/pages/SignupPage';

// Lazy load other pages for code splitting
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const TasksPage = lazy(() => import('@/pages/TasksPage'));
const AgendaPage = lazy(() => import('@/pages/AgendaPage'));
const HabitsPage = lazy(() => import('@/pages/HabitsPage'));
const OKRPage = lazy(() => import('@/pages/OKRPage'));
const StatisticsPage = lazy(() => import('@/pages/StatisticsPage'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));
const PremiumPage = lazy(() => import('@/pages/PremiumPage'));
const MessagingPage = lazy(() => import('@/pages/MessagingPage'));

// Lazy load Layout
const Layout = lazy(() => import('@/components/Layout'));

// Query client config optimized
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,    // 5 minutes
      gcTime: 1000 * 60 * 30,      // 30 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

// Loading spinner component
const LoadingSpinner = memo(() => (
  <div className="min-h-screen bg-slate-950 flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      <p className="text-slate-400 text-sm">Chargement...</p>
    </div>
  </div>
));
LoadingSpinner.displayName = 'LoadingSpinner';

// Page loading fallback
const PageLoader = memo(() => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
  </div>
));
PageLoader.displayName = 'PageLoader';

// Protected route wrapper
const ProtectedRoute = memo<{ children: React.ReactNode }>(({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) return <LoadingSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Layout>
        <Suspense fallback={<PageLoader />}>
          {children}
        </Suspense>
      </Layout>
    </Suspense>
  );
});
ProtectedRoute.displayName = 'ProtectedRoute';

// Public route (redirect if authenticated)
const PublicRoute = memo<{ children: React.ReactNode }>(({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) return <LoadingSpinner />;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  
  return <>{children}</>;
});
PublicRoute.displayName = 'PublicRoute';

// App routes
const AppRoutes = memo(() => (
  <Routes>
    {/* Public routes - eager loaded */}
    <Route path="/" element={<LandingPage />} />
    <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
    <Route path="/signup" element={<PublicRoute><SignupPage /></PublicRoute>} />
    
    {/* Protected routes - lazy loaded */}
    <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
    <Route path="/tasks" element={<ProtectedRoute><TasksPage /></ProtectedRoute>} />
    <Route path="/agenda" element={<ProtectedRoute><AgendaPage /></ProtectedRoute>} />
    <Route path="/habits" element={<ProtectedRoute><HabitsPage /></ProtectedRoute>} />
    <Route path="/okr" element={<ProtectedRoute><OKRPage /></ProtectedRoute>} />
    <Route path="/statistics" element={<ProtectedRoute><StatisticsPage /></ProtectedRoute>} />
    <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
    <Route path="/premium" element={<ProtectedRoute><PremiumPage /></ProtectedRoute>} />
    <Route path="/messages" element={<ProtectedRoute><MessagingPage /></ProtectedRoute>} />
    
    {/* Fallback */}
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
));
AppRoutes.displayName = 'AppRoutes';

// Main App component
const App: React.FC = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <DataProvider>
        <Toaster 
          position="top-right" 
          richColors 
          closeButton
          theme="dark"
          toastOptions={{
            duration: 3000,
          }}
        />
        <AppRoutes />
      </DataProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default memo(App);

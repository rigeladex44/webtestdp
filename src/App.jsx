// src/App.jsx
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';

import MainLayout from '@/layouts/MainLayout.jsx';

import ProfilePage from '@/pages/ProfilePage.jsx';
import SettingsPage from '@/pages/SettingsPage.jsx';
import ChangePasswordPage from '@/pages/ChangePasswordPage.jsx';

import LoginPage from '@/pages/LoginPage.jsx';
import RegisterPage from '@/pages/RegisterPage.jsx';
import ForgotPasswordPage from '@/pages/ForgotPasswordPage.jsx';

import DashboardClassic from '@/pages/DashboardClassic.jsx';
import CashflowMini from '@/pages/CashflowMini.jsx';
import ProfitLoss from '@/pages/ProfitLoss.jsx';
import SalesEntryPage from '@/pages/SalesEntryPage.jsx';
import OtherIncomePage from '@/pages/OtherIncomePage.jsx'; // <— BARU

import MailPage from '@/pages/apps/MailPage.jsx';
import ChatPage from '@/pages/apps/ChatPage.jsx';
import FAQPage from '@/pages/apps/FAQPage.jsx';

import ButtonsPage from '@/pages/ui-elements/ButtonsPage.jsx';
import DropdownsPage from '@/pages/ui-elements/DropdownsPage.jsx';
import BadgesPage from '@/pages/ui-elements/BadgesPage.jsx';
import LoadingPage from '@/pages/ui-elements/LoadingPage.jsx';

import NotificationsPage from '@/pages/ui-components/NotificationsPage.jsx';
import ProgressPage from '@/pages/ui-components/ProgressPage.jsx';
import CarouselPage from '@/pages/ui-components/CarouselPage.jsx';
import CardsPage from '@/pages/ui-components/CardsPage.jsx';
import PaginationPage from '@/pages/ui-components/PaginationPage.jsx';

import ChartBoxes1 from '@/pages/widgets/ChartBoxes1.jsx';
import ProfileBox from '@/pages/widgets/ProfileBox.jsx';

import DataTablesPage from '@/pages/forms-elements/DataTablesPage.jsx';
import GridTablesPage from '@/pages/forms-elements/GridTablesPage.jsx';
import DatePickerPage from '@/pages/forms-elements/DatePickerPage.jsx';
import InputSelectsPage from '@/pages/forms-widgets/InputSelectsPage.jsx';
import InputMaskPage from '@/pages/forms-widgets/InputMaskPage.jsx';

import ChartJSPage from '@/pages/charts/ChartJSPage.jsx';
import ApexChartsPage from '@/pages/charts/ApexChartsPage.jsx';
import SparklinePage from '@/pages/charts/SparklinePage.jsx';

import { Toaster } from '@/components/ui/toaster.jsx';
import { TransactionsProvider } from '@/context/TransactionsContext.jsx';

// ===== Admin area =====
import RequireRole from '@/routes/RequireRole.jsx';
import AdminLayout from '@/layouts/AdminLayout.jsx';
import AdminHomePage from '@/pages/admin/AdminHomePage.jsx';
import AdminUsersPage from '@/pages/admin/AdminUsersPage.jsx';
import AdminAuditLogPage from '@/pages/admin/AdminAuditLogPage.jsx';

const AUTH_KEY = 'isAuthenticated';
const isAuthed = () => localStorage.getItem(AUTH_KEY) === 'true';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}
function PrivateRoute({ children }) { return isAuthed() ? children : <Navigate to="/login" replace />; }
function PublicRoute({ children }) { return isAuthed() ? <Navigate to="/dashboard" replace /> : children; }

function NotFound() {
  return (
    <div className="min-h-screen grid place-items-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold">404</h1>
        <p className="mt-2 text-muted-foreground">Halaman tidak ditemukan</p>
        <a href="/" className="inline-block mt-4 underline">Kembali ke beranda</a>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <ScrollToTop />
      <Routes>
        {/* Public */}
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
        <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />

        {/* App utama (kasir/keuangan) */}
        <Route
          path="/"
          element={
            <PrivateRoute>
              <TransactionsProvider>
                <MainLayout />
              </TransactionsProvider>
            </PrivateRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardClassic />} />
          <Route path="arus-kas-kecil" element={<CashflowMini />} />
          <Route path="laba-rugi" element={<ProfitLoss />} />
          <Route path="entri-penjualan" element={<SalesEntryPage />} />
          <Route path="pendapatan-lain" element={<OtherIncomePage />} /> {/* BARU */}

          <Route path="apps/mail" element={<MailPage />} />
          <Route path="apps/chat" element={<ChatPage />} />
          <Route path="apps/faq" element={<FAQPage />} />

          <Route path="ui-elements/buttons" element={<ButtonsPage />} />
          <Route path="ui-elements/dropdowns" element={<DropdownsPage />} />
          <Route path="ui-elements/badges" element={<BadgesPage />} />
          <Route path="ui-elements/loading" element={<LoadingPage />} />

          <Route path="ui-components/notifications" element={<NotificationsPage />} />
          <Route path="ui-components/progress" element={<ProgressPage />} />
          <Route path="ui-components/carousel" element={<CarouselPage />} />
          <Route path="ui-components/cards" element={<CardsPage />} />
          <Route path="ui-components/pagination" element={<PaginationPage />} />

          <Route path="widgets/chart-boxes-1" element={<ChartBoxes1 />} />
          <Route path="widgets/profile-box" element={<ProfileBox />} />

          <Route path="forms-elements/data-tables" element={<DataTablesPage />} />
          <Route path="forms-elements/grid-tables" element={<GridTablesPage />} />
          <Route path="forms-elements/date-picker" element={<DatePickerPage />} />
          <Route path="forms-widgets/input-selects" element={<InputSelectsPage />} />
          <Route path="forms-widgets/input-mask" element={<InputMaskPage />} />

          <Route path="charts/chartjs" element={<ChartJSPage />} />
          <Route path="charts/apex" element={<ApexChartsPage />} />
          <Route path="charts/sparkline" element={<SparklinePage />} />

          <Route path="profile" element={<ProfilePage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="change-password" element={<ChangePasswordPage />} />
        </Route>

        {/* Admin */}
        <Route
          path="/admin/*"
          element={
            <RequireRole role="admin">
              <AdminLayout />
            </RequireRole>
          }
        >
          <Route index element={<AdminHomePage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="audit" element={<AdminAuditLogPage />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
    </Router>
  );
}

// Packages
import { Fragment } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Utils
import '../utils/helpers.jsx';
import { Sidebar, Header } from '../components';

// Authenticated Screens
import {
  Dashboard,
  CompanyProfileList,
  CompanyProfileForm,
  InvoicesList,
  InvoiceForm,
  CustomersList,
  CustomerForm,
  UserManagementList,
  UserManagementForm,
} from './authenticated-screens';

// Unauthenticated Screens
import { Login, ResetPassword } from './unauthenticated-screens';

function Screens() {
  // TODO: Replace with actual authentication state (e.g. from context/API)
  // const isAuthenticated = false;
  const isAuthenticated = false;

  const AUTHENTICATED_LAYOUT = () => (
    <div className="min-h-screen bg-[#f5f6f8] dark:bg-[#0f1323] text-[#0d121b] dark:text-[#f8f9fc]">
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 flex flex-col overflow-y-auto">
          <Header />
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/company-profile" element={<CompanyProfileList />} />
            <Route path="/company-profile/new" element={<CompanyProfileForm />} />
            <Route path="/invoices" element={<InvoicesList />} />
            <Route path="/invoices/new" element={<InvoiceForm />} />
            <Route path="/customer" element={<CustomersList />} />
            <Route path="/customer/new" element={<CustomerForm />} />
            <Route path="/user-management" element={<UserManagementList />} />
            <Route path="/user-management/new" element={<UserManagementForm />} />
          </Routes>
        </main>
      </div>
    </div>
  );

  const UNAUTHENTICATED_LAYOUT = () => (
    <div className="min-h-screen bg-[#f5f6f8] dark:bg-[#0f1323] text-[#0d121b] dark:text-[#f8f9fc]">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </div>
  );

  const CONTENT = () => (
    <Fragment>
      {isAuthenticated ? AUTHENTICATED_LAYOUT() : UNAUTHENTICATED_LAYOUT()}
    </Fragment>
  );

  return CONTENT();
}

export default Screens;

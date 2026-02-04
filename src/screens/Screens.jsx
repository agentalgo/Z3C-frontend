// Packages
import { Fragment, useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAtomValue } from 'jotai';

// Atoms
import { auth } from '../atoms';

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
  const authValue = useAtomValue(auth);
  const [hasMounted, setHasMounted] = useState(false);
  const isAuthenticated = Boolean(authValue);

  useEffect(() => {
    setHasMounted(true);
  }, []);

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

  const CONTENT = () => {
    if (!hasMounted) {
      // Avoid flashing the login screen briefly on initial render
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#f5f6f8] dark:bg-[#0f1323] text-[#0d121b] dark:text-[#f8f9fc]">
          <span className="text-sm text-slate-600 dark:text-slate-300">
            Loading your workspace...
          </span>
        </div>
      );
    }

    return (
      <Fragment>
        {isAuthenticated ? AUTHENTICATED_LAYOUT() : UNAUTHENTICATED_LAYOUT()}
      </Fragment>
    );
  };

  return CONTENT();
}

export default Screens;

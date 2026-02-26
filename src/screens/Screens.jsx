// Packages
import { Fragment, useEffect, useMemo, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAtomValue } from 'jotai';

// Utils
import '../utils';
import { auth, loginInfo } from '../atoms';
import { Sidebar, Header } from '../components';
import { parseLoginInfo, getNormalizedModulePermissions } from '../utils';

// Authenticated Screens
import {
  Dashboard,
  CompanyProfileList,
  CompanyProfileForm,
  InvoiceList,
  InvoiceForm,
  CustomerList,
  CustomerForm,
  UserManagementList,
  UserManagementForm,
} from './authenticated-screens';

// Unauthenticated Screens
import { Login, ResetPassword } from './unauthenticated-screens';

function Screens() {
  const authValue = useAtomValue(auth);
  const loginInfoValue = useAtomValue(loginInfo);
  const [isMounted, _isMounted] = useState(false);
  const isAuthenticated = Boolean(authValue);

  const user = useMemo(() => parseLoginInfo(loginInfoValue), [loginInfoValue]);

  const getPerms = (moduleKey) => getNormalizedModulePermissions(user, moduleKey);

  useEffect(() => {
    _isMounted(true);
  }, []);

  const AUTHENTICATED_LAYOUT = () => {
    const companyProfilePerms = getPerms('companyProfile');
    const invoicePerms = getPerms('invoice');
    const customerPerms = getPerms('customer');
    const userPerms = getPerms('user');

    return (
      <div className="min-h-screen bg-[#f5f6f8] dark:bg-[#0f1323] text-[#0d121b] dark:text-[#f8f9fc]">
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 flex flex-col overflow-y-auto">
            <Header />
            <Routes>
              <Route path="*" element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />

              {companyProfilePerms.read && (
                <>
                  <Route path="/company-profile" element={<CompanyProfileList />} />
                  {companyProfilePerms.create && (
                    <Route path="/company-profile/new" element={<CompanyProfileForm />} />
                  )}
                  {companyProfilePerms.update && (
                    <Route path="/company-profile/:id" element={<CompanyProfileForm />} />
                  )}
                </>
              )}

              {invoicePerms.read && (
                <>
                  <Route path="/invoices" element={<InvoiceList />} />
                  {invoicePerms.create && (
                    <Route path="/invoices/new" element={<InvoiceForm />} />
                  )}
                  {invoicePerms.update && (
                    <Route path="/invoices/:id" element={<InvoiceForm />} />
                  )}
                </>
              )}

              {customerPerms.read && (
                <>
                  <Route path="/customer" element={<CustomerList />} />
                  {customerPerms.create && (
                    <Route path="/customer/new" element={<CustomerForm />} />
                  )}
                  {customerPerms.update && (
                    <Route path="/customer/:id" element={<CustomerForm />} />
                  )}
                </>
              )}

              {userPerms.read && (
                <>
                  <Route path="/user-management" element={<UserManagementList />} />
                  {userPerms.create && (
                    <Route path="/user-management/new" element={<UserManagementForm />} />
                  )}
                  {userPerms.update && (
                    <Route path="/user-management/:id" element={<UserManagementForm />} />
                  )}
                </>
              )}
            </Routes>
          </main>
        </div>
      </div>
    );
  };

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
    if (!isMounted) {
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

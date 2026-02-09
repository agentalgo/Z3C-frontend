// Packages
import { NavLink } from 'react-router-dom';
import { useAtom } from 'jotai';

// Atoms
import { auth } from '../../atoms';
import { LogoutRequest } from '../../requests';

const navigation = [
  { label: 'Dashboard', icon: 'dashboard', path: '/' },
  // { label: 'Company Profile', icon: 'business', path: '/company-profile' },
  { label: 'Invoices', icon: 'description', path: '/invoices' },
  { label: 'Customer', icon: 'people', path: '/customer' },
  { label: 'User Management', icon: 'manage_accounts', path: '/user-management' },
]

function Sidebar() {
  const [token, setAuth] = useAtom(auth);

  const handleLogout = () => {
    if (token) {
      LogoutRequest(token)
        .finally(() => {
          setAuth(null);
        });
    } else {
      setAuth(null);
    }
  };

  const LOGO_SECTION = () => (
    <div className="flex items-center gap-3 mb-8">
      <div className="bg-primary p-2 rounded-lg text-white">
        <span className="material-symbols-outlined">shield_with_heart</span>
      </div>
      <div className="flex flex-col">
        <h1 className="text-[#0d121b] dark:text-white text-base font-bold leading-none">ZATCA Hub</h1>
        <p className="text-[#4c669a] text-xs font-normal">Phase 2 Compliant</p>
      </div>
    </div>
  );

  const NAVIGATION_SECTION = () => (
    <nav className="flex flex-col gap-1">
      {navigation.map((item) => (
        <NavLink
          key={item.label}
          to={item.path}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm cursor-pointer ${isActive
              ? 'bg-primary/10 text-primary font-semibold'
              : 'text-[#4c669a] dark:text-[#a0aec0] font-medium hover:bg-gray-100 dark:hover:bg-gray-800'
            }`
          }
        >
          <span className="material-symbols-outlined">{item.icon}</span>
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );

  const LOGOUT_SECTION = () => (
    <button
      type="button"
      onClick={handleLogout}
      className="mt-6 flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-900/30 transition-colors"
    >
      <span className="material-symbols-outlined">logout</span>
      <span>Logout</span>
    </button>
  );

  const SIDEBAR_CONTENT = () => (
    <div className="p-6 flex flex-col h-full">
      {LOGO_SECTION()}
      {NAVIGATION_SECTION()}
      {LOGOUT_SECTION()}
    </div>
  );

  return (
    <aside className="w-64 border-r border-[#e7ebf3] dark:border-[#2a3447] bg-white dark:bg-[#161f30] hidden lg:flex flex-col">
      {SIDEBAR_CONTENT()}
    </aside>
  );
}

export default Sidebar;

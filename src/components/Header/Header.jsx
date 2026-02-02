// Packages
import { Fragment } from 'react';

// Utils
import { useTheme } from '../../contexts/ThemeContext';

function Header() {
  const { theme, toggleTheme } = useTheme();

  const SEARCH_SECTION = () => (
    <div className="flex items-center gap-6 flex-1">
      <label className="flex flex-col min-w-[320px] max-w-md">
        <div className="flex w-full items-stretch rounded-lg h-10 bg-[#f0f2f5] dark:bg-[#20293a]">
          <div className="text-[#4c669a] flex items-center justify-center px-3">
            <span className="material-symbols-outlined text-[20px]">search</span>
          </div>
          <input
            className="w-full bg-transparent border-none focus:ring-0 text-sm placeholder:text-[#4c669a] text-[#0d121b] dark:text-white"
            placeholder="Search invoices, certificates, or logs..."
          />
        </div>
      </label>
    </div>
  );

  const ACTIONS_SECTION = () => (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          toggleTheme()
        }}
        className="p-2 rounded-lg bg-[#f0f2f5] dark:bg-[#20293a] text-[#0d121b] dark:text-[#f8f9fc] hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        aria-label="Toggle theme"
      >
        <span className="material-symbols-outlined">
          {theme === 'light' ? 'dark_mode' : 'light_mode'}
        </span>
      </button>     
      <div className="h-8 w-[1px] bg-[#e7ebf3] dark:border-[#2a3447] mx-2"></div>
      <div className="flex items-center gap-3">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-bold leading-tight">Ahmed K.</p>
          <p className="text-[11px] text-[#4c669a] dark:text-[#a0aec0]">Administrator</p>
        </div>
        <div
          className="bg-center bg-no-repeat aspect-square bg-cover rounded-full border-2 border-primary/20 h-10 w-10"
          style={{
            backgroundImage:
              'url("https://lh3.googleusercontent.com/aida-public/AB6AXuAD6MYPHhaG0KwwmK-scZ-vaHh2mMsGe8P8sraZRwsAuWieQDFpAmdDnotcTgLw__zOPuFGKjrm_rTMpaZoWRftoX-fQY9QigJqs2cn-T9KkFlaJGI7cFs4e0SSi5t6NTieOeWy1Q4pfegQA5B860riKe-jO_KU8LJpWTQ20LzJ1vVZDd-88Oft0eXqUUj27CMOt5pEOWMy7vN4R5ZhmuFemtGNmfv8SYCv8esOc1RwR-DmWcl2RcZbNMSMPhxOJTaDxD2Gma_oP74")',
          }}
          role="img"
          aria-label="User avatar"
        ></div>
      </div>
    </div>
  );

  const HEADER_CONTENT = () => (
    <Fragment>
      {/* {SEARCH_SECTION()} */}
      {ACTIONS_SECTION()}
    </Fragment>
  );

  return (
    <header className="flex items-center justify-end border-b border-[#e7ebf3] dark:border-[#2a3447] bg-white/80 dark:bg-[#161f30]/80 backdrop-blur-md px-8 py-4 sticky top-0 z-10">
      {HEADER_CONTENT()}
    </header>
  );
}

export default Header;

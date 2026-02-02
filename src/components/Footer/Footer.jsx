// Packages
import { Fragment } from 'react';

function Footer() {
  const LINKS_SECTION = () => (
    <div className="flex gap-4">
      <a className="hover:text-primary" href="#" aria-label="Documentation">
        Documentation
      </a>
      <a className="hover:text-primary" href="#" aria-label="API Reference">
        API Reference
      </a>
      <a className="hover:text-primary" href="#" aria-label="Support">
        Support
      </a>
    </div>
  );

  const FOOTER_CONTENT = () => (
    <Fragment>
      <p>© 2023 ZATCA Compliance Hub. Enterprise Edition v2.4.1</p>
      {/* {LINKS_SECTION()} */}
    </Fragment>
  );

  return (
    <footer className="p-8 mt-auto border-t border-[#e7ebf3] dark:border-[#2a3447] flex justify-between items-center text-[#4c669a] text-xs">
      {FOOTER_CONTENT()}
    </footer>
  );
}

export default Footer;

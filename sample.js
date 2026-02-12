// Packages
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAtom } from 'jotai';
import { Store } from 'react-notifications-component';
import dayjs from 'dayjs';

// APIs
import { BlockHourInvoiceListRequest, BlockHourInvoiceSearchRequest } from '../../../requests';

// Utils
import { constants, decodeString, authenticationErrorHandle, ignoreTimeZone } from '../../../utils';
import { auth, loggedUserInfoCache } from '../../../atoms';
import { TableLite, Edit, SearchBar } from '../../../components';

function BlockHourInvoicesList() {

  const Navigate = useNavigate();
  const SearchRef = useRef(null);
  const [isLoading, _isLoading] = useState(false);
  const [blockHourInvoices, _blockHourInvoices] = useState([]);
  const [searchString, _searchString] = useState('');
  const [authState, _authState] = useAtom(auth);
  const [loggedUserInfo, _loggedUserInfo] = useAtom(loggedUserInfoCache);

  // Get users either from cache or from server
  useEffect(() => {
    if (authState) {
      getBlockHourInvoices();
    }
  }, [authState]);

  const getBlockHourInvoices = (page = undefined) => {
    const token = decodeString(authState);
    _isLoading(true);
    BlockHourInvoiceListRequest(token, page).then(res => {
      if (res && res?.status === 401) {
        authenticationErrorHandle(() => _authState('0'));
        return (
          { errorCodes: constants.SESSIONTIMEOUT }
        );
      } else return (res.json())
    }).then(
      data => {
        if (constants.LOGOUTERRORTYPES.includes(data?.errorCodes)) return;
        if (data && data.results) {
          // Keep server data in local state with current time
          _blockHourInvoices({
            data: [...data.results?.map(invoice => (
              {
                ...invoice,
                invoice_number: invoice?.invoice_number || '-',
                createdat: dayjs(ignoreTimeZone(invoice?.createdat))?.format('YYYY-MM-DD')
              }
            ))],
            pagination: {
              currentPage: page,
              totalPages: Math.ceil(data?.count / constants.PAGINATIONPERPAGE)
            },
            created: Date.now()
          });
          _isLoading(false);
        } else {
          throw 'Request Failed';
        }
      }
    )
      .catch(
        err => {
          _isLoading(false);
          console.error(err);
          Store.addNotification({ ...constants.ERRORTOAST, message: 'Failed to fetch block hour invoices' });
        }
      )
  };

  const getSearchedBlockHourInvoices = () => {
    const token = decodeString(authState);
    _isLoading(true);
    BlockHourInvoiceSearchRequest(token, searchString).then(res => {
      if (res && res?.status === 401) {
        authenticationErrorHandle(() => _authState('0'));
        return (
          { errorCodes: constants.SESSIONTIMEOUT }
        );
      } else return (res.json())
    }).then(
      data => {
        if (constants.LOGOUTERRORTYPES.includes(data?.errorCodes)) return;
        if (data) {          
          _blockHourInvoices({
            data: [...data?.map(invoice => (
              {
                ...invoice,
                invoice_number: invoice?.invoice_number || '-',
                createdat: dayjs(ignoreTimeZone(invoice?.createdat))?.format('YYYY-MM-DD')
              }
            ))],
            pagination: {
              currentPage: 1,
              paginationAvailable: 0,
              totalPages: Math.ceil(data?.count / constants.PAGINATIONPERPAGE)
            },
            created: Date.now()
          });
          _isLoading(false);
        } else {
          throw 'Request Failed';
        }
      }
    )
      .catch(
        err => {
          _isLoading(false);
          console.error(err);
          Store.addNotification({ ...constants.ERRORTOAST, message: 'Failed to fetch block hour invoices' });
        }
      )
  };


  const BlockHourInvoiceheaders = ["id", "request_id", "createdat"];

  const CustomHeaders = {
    "id": "Invoice Id",
    "request_id": "Request Id",
    "invoice_number": "Invoice No.",
    "createdat": "Created Date",
  };

  const sortBy = ["id", "request_id"];

  // *********** Handlers ***********

  const handlePaginate = (pageNo) => {
    getBlockHourInvoices(pageNo);
  };

  const handleSearchString = (e) => {
    _searchString(e.target.value);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchString?.trim() === '') {
      getBlockHourInvoices();
    } else {
      getSearchedBlockHourInvoices();
    }
  };

  const routeToEditBlockHourInvoice = (id) => {
    Navigate(`/block-hour-invoices/edit/${id}`);
  };

  const routeToViewBlockHourInvoice = (id) => {
    Navigate(`/block-hour-invoices/view/${id}`);
  };

  // *********** Render Functions ***********

  const CUSTOM_EDIT_BTN = {
    "render":
      <button
        style={{ "color": "black" }}
        className={"custom-edit-fsr-btn small-left-margin"}
      >
        <span className="w3-tooltip">
          <span className='tooltip-text w3-text w3-tag w-12'>
            Edit
          </span>
          <Edit className='h-5 w-5' />
        </span>
      </button>
    ,
    "className": "custom-edit-fsr-btn"
  };

  const CONTENT = () => (
    <div className='page-content w3-white h-full relative overflow-hidden'>
      <div className='py-2'>
        {/* {NEW_USER_BUTTON()} */}
        <div className='list-view-container overflow-auto'>
          <SearchBar
            placeholder='Search by Invoice Id or Request Id...'
            containerClass='w-full relative'
            className='w3-input w3-medium'
            value={searchString}
            onChange={handleSearchString}
            onSearch={handleSearch}
            buttonClass='cursor-pointer no-background w3-border-0 p-1 absolute right-0 small-right-margin'
          />
          <TableLite
            showActions={true}
            data={blockHourInvoices && blockHourInvoices?.data || []}
            headers={BlockHourInvoiceheaders}
            customHeaders={CustomHeaders}
            sortBy={sortBy}
            searchBy={sortBy}
            searchable={true}
            searchFormRef={SearchRef}
            showPagination={true}
            totalPages={blockHourInvoices?.pagination?.totalPages || 1}
            currentPage={blockHourInvoices?.pagination?.currentPage || 1}
            renderEdit={CUSTOM_EDIT_BTN}
            onRowEdit={(event, row) => routeToEditBlockHourInvoice(row.id)}
            onRowView={(event, row) => routeToViewBlockHourInvoice(row.id)}
            onPaginate={(pageNo) => handlePaginate(pageNo)}
            cellStyle={{ fontSize: '0.8em' }}
            noDataMessage={isLoading ? 'Loading data...' : 'No data found'}
            actionTypes={
              loggedUserInfo?.data?.groups?.includes(constants?.USER_ROLES?.finance)
                ? ['edit', 'view']
                : ['view']
            }
          />
        </div>
      </div>
    </div>
  );

  return (
    <div>
      {CONTENT()}
    </div>
  )
}

export default BlockHourInvoicesList;
// Mock API Handler for Pagination
export const fetchPaginatedData = async (endpoint, page = 1, pageSize = 10, filters = {}) => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Mock data generation based on endpoint
  const generateMockData = (type, page, pageSize) => {
    const data = [];
    const startIndex = (page - 1) * pageSize;

    if (type === 'invoices') {
      const statuses = ['CLEARED', 'REPORTED', 'REJECTED', 'PENDING'];
      const paymentTerms = ['Net 15', 'Net 30', 'Net 45'];
      const types = ['B2B', 'B2C'];
      const customers = ['Al-Futtaim Logistics', 'Jeddah Retail Co.', 'Saudi Trading Ltd', 'Aramco Support Div', 'Riyadh Trading'];
      const companyProfiles = ['Company A', 'Company B', 'Company C', 'Company D', 'Company E'];
      const paymentTypes = ['Bank Transfer', 'Credit Card', 'Cash'];
      const emailStatuses = ['Sent', 'Pending', 'Failed'];
      const paidStatuses = ['Yes', 'No'];
      const complianceStatuses = ['Compliant', 'Non-Compliant'];

      for (let i = 0; i < pageSize; i++) {
        const index = startIndex + i;
        data.push({
          invoiceNo: `INV-2023-${String(8842 - index).padStart(4, '0')}`,
          referenceNo: `REF-${String(index + 1).padStart(3, '0')}`,
          zatcaStatus: statuses[index % statuses.length],
          paymentTerm: paymentTerms[index % paymentTerms.length],
          emailSendStatus: emailStatuses[index % emailStatuses.length],
          invoicePaid: paidStatuses[index % 2],
          zatcaComplianceStatus: complianceStatuses[index % 2],
          type: types[index % types.length],
          customer: customers[index % customers.length],
          companyProfile: companyProfiles[index % companyProfiles.length],
          grossAmount: `${(Math.random() * 50000 + 1000).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`,
          paymentType: paymentTypes[index % paymentTypes.length],
        });
      }
    } else if (type === 'company-profiles') {
      const profileNames = ['Main Branch', 'Jeddah Office', 'Eastern Region', 'Warehouse Division', 'Export Unit'];
      const companyNames = ['Al-Futtaim Trading LLC', 'Saudi Logistics Co.', 'Gulf Industries Ltd', 'National Storage Solutions', 'Arabian Exports Inc.'];
      const regions = ['Riyadh', 'Jeddah', 'Eastern Region'];
      const addresses = [
        'King Fahd Road, Al Olaya District, Riyadh 12345, Saudi Arabia',
        'Prince Sultan Street, Al Rawdah, Jeddah 21432, Saudi Arabia',
        'King Abdullah Road, Al Khobar 31952, Saudi Arabia',
        'Industrial Area, Second Industrial City, Riyadh 14334, Saudi Arabia',
        'Jeddah Islamic Port, Jeddah 21188, Saudi Arabia',
      ];

      for (let i = 0; i < pageSize; i++) {
        const index = startIndex + i;
        const regionIndex = index % regions.length;
        data.push({
          profileName: `${profileNames[index % profileNames.length]} ${index > 4 ? `(${Math.floor(index / 5) + 1})` : ''}`,
          profileNumber: `PRF-${String(index + 1).padStart(3, '0')}`,
          companyName: `${companyNames[index % companyNames.length]} ${index > 4 ? `Branch ${Math.floor(index / 5) + 1}` : ''}`,
          email: `info${index > 0 ? index : ''}@company${index + 1}.sa`,
          phoneNumber: `+966 ${String(11 + (index % 3)).padStart(2, '0')} ${String(234 + index).padStart(3, '0')} ${String(5678 + index).padStart(4, '0')}`,
          crnNumber: `${String(1010123456 + index)}`,
          vat: `3000${String(12345600003 + index).padStart(11, '0')}`,
          fullAddress: addresses[regionIndex],
        });
      }
    } else if (type === 'customers') {
      const firstNames = ['Ahmed', 'Fatima', 'Mohammed', 'Sarah', 'Khalid', 'Noura', 'Omar', 'Layla'];
      const lastNames = ['Al-Saud', 'Al-Zahrani', 'Al-Rashid', 'Al-Mutairi', 'Al-Otaibi', 'Al-Ghamdi', 'Al-Harbi', 'Al-Shammari'];
      const companyProfiles = ['Fl3xx', 'FB01', 'MR02', 'SM03', 'KO04', 'NG05', 'OH06', 'LS07'];
      const arabicNames = ['أحمد السعود', 'فاطمة الزهراني', 'محمد الرشيد', 'سارة المطيري', 'خالد العتيبي', 'نورة الغامدي', 'عمر الحربي', 'ليلى الشمري'];
      const registeredNames = [
        'Ahmed Al-Saud Trading Co.',
        'Fatima Al-Zahrani Logistics LLC',
        'Mohammed Al-Rashid Industries',
        'Sarah Al-Mutairi Solutions',
        'Khalid Al-Otaibi Exports Inc.',
        'Noura Al-Ghamdi Trading',
        'Omar Al-Harbi Services',
        'Layla Al-Shammari Group',
      ];
      const addresses = [
        'King Fahd Road, Al Olaya District, Riyadh 12345, Saudi Arabia',
        'Prince Sultan Street, Al Rawdah, Jeddah 21432, Saudi Arabia',
        'King Abdullah Road, Al Khobar 31952, Saudi Arabia',
        'Industrial Area, Second Industrial City, Riyadh 14334, Saudi Arabia',
        'Jeddah Islamic Port, Jeddah 21188, Saudi Arabia',
      ];

      for (let i = 0; i < pageSize; i++) {
        const index = startIndex + i;
        data.push({
          firstName: firstNames[index % firstNames.length],
          lastName: lastNames[index % lastNames.length],
          companyProfile: companyProfiles[index % companyProfiles.length],
          referenceNo: `REF-${String(index + 1).padStart(3, '0')}`,
          arabicName: arabicNames[index % arabicNames.length],
          registeredName: registeredNames[index % registeredNames.length],
          email: `${firstNames[index % firstNames.length].toLowerCase()}@customer${index + 1}.sa`,
          phone: `+966 ${String(11 + (index % 3)).padStart(2, '0')} ${String(234 + index).padStart(3, '0')} ${String(5678 + index).padStart(4, '0')}`,
          customerVat: `3000${String(12345600003 + index).padStart(11, '0')}`,
          fullAddress: addresses[index % addresses.length],
        });
      }
    } else if (type === 'users') {
      const firstNames = ['Muhammad Taufiq', 'Lakshmi', 'Ahmed', 'Fatima', 'Mohammed', 'Sarah', 'Khalid', 'Noura'];
      const lastNames = ['Yusuf', 'Veluchamy', 'Al-Saud', 'Al-Zahrani', 'Al-Rashid', 'Al-Mutairi', 'Al-Otaibi', 'Al-Ghamdi'];
      const adminStatuses = ['Yes', 'No'];
      const activeStatuses = ['Yes', 'No'];
      const dates = [
        '2023-06-18 04:18:06 PM',
        '2023-05-15 10:30:00 AM',
        '2023-07-22 11:15:00 AM',
        '2023-04-10 08:00:00 AM',
        '2023-12-20 02:45:00 PM',
        '2023-11-10 09:20:00 AM',
        '2024-01-15 03:30:00 PM',
        '2023-09-05 01:25:00 PM',
      ];

      for (let i = 0; i < pageSize; i++) {
        const index = startIndex + i;
        const createdDate = dates[index % dates.length];
        const updatedDate = dates[(index + 2) % dates.length];

        data.push({
          firstName: firstNames[index % firstNames.length],
          lastName: lastNames[index % lastNames.length],
          email: `${firstNames[index % firstNames.length].toLowerCase().replace(' ', '')}@spa.sa`,
          isAdmin: adminStatuses[index % 2],
          isActive: activeStatuses[index % 2],
          createdDate: createdDate,
          updatedDate: updatedDate,
        });
      }
    }

    return data;
  };

  // Determine endpoint type
  let endpointType = 'company-profiles';
  if (endpoint.includes('invoice')) {
    endpointType = 'invoices';
  } else if (endpoint.includes('customer')) {
    endpointType = 'customers';
  } else if (endpoint.includes('user')) {
    endpointType = 'users';
  }

  // Generate mock data
  const data = generateMockData(endpointType, page, pageSize);

  // Mock total count (simulating 50 total items)
  const totalCount = 50;
  const totalPages = Math.ceil(totalCount / pageSize);

  return {
    data,
    pagination: {
      page,
      pageSize,
      totalCount,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
};

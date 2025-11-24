// Perfiles de Clientes (Empresas o Personas Naturales)
export const allCompanyProfiles = [
  {
    id: 'company-1',
    name: 'Alicia Johnson',
    billing_email: 'alice@example.com',
    operational_contact_email: 'alice@example.com',
    document_id: '123456789',
    phone: '3101234567',
    address: 'Calle Falsa 123, Apto 404, Bogotá',
    storage_unit_number: 'A-101',
    account_credit: 100000,
    has_automatic_payment: false,
    type: 'individual',
  },
  {
    id: 'company-2',
    name: 'Innovatec S.A.S.',
    billing_email: 'facturacion@innovatec.com',
    operational_contact_email: 'roberto.w@innovatec.com',
    document_id: '900.123.456-7',
    phone: '3209876543',
    address: 'Avenida Siempre Viva 742, Medellín',
    storage_unit_number: 'B-205',
    account_credit: 0,
    has_automatic_payment: true,
    automatic_payment_card_last4: '4242',
    type: 'company',
  },
];

// Usuarios que pueden iniciar sesión en el portal
export const mockLoginUsers = [
    {
        id: 'login-user-1',
        company_id: 'company-1',
        name: 'Alicia Johnson',
        email: 'alice@example.com',
        has_password: false,
    },
    {
        id: 'login-user-2',
        company_id: 'company-2',
        name: 'Roberto Williams',
        email: 'roberto.w@innovatec.com',
        has_password: true,
    },
    {
        id: 'login-user-3',
        company_id: 'company-2',
        name: 'Ana Gomez',
        email: 'ana.g@innovatec.com',
        has_password: true,
    }
];


export const mockInvoices = [
  {
    id: 'inv-001',
    company_id: 'company-1',
    invoice_number: 'R-2024-001',
    issue_date: '2024-07-01',
    due_date: '2024-07-15',
    amount: 550000,
    status: 'paid',
    items: [
      { description: 'Suscripción Mensual - Plan Pro', amount: 400000 },
      { description: 'Almacenamiento en la Nube - 50GB', amount: 150000 },
    ],
  },
  {
    id: 'inv-002',
    company_id: 'company-1',
    invoice_number: 'R-2024-002',
    issue_date: '2024-08-01',
    due_date: '2024-08-15',
    amount: 625500,
    status: 'unpaid',
    items: [
      { description: 'Suscripción Mensual - Plan Pro', amount: 400000 },
      { description: 'Almacenamiento en la Nube - 50GB', amount: 150000 },
      { description: 'Uso Excedente de API', amount: 75500 },
    ],
  },
  {
    id: 'inv-003',
    company_id: 'company-1',
    invoice_number: 'R-2024-003',
    issue_date: '2024-06-01',
    due_date: '2024-06-15',
    amount: 395000,
    status: 'overdue',
    items: [{ description: 'Consulta Única', amount: 395000 }],
  },
   {
    id: 'inv-004',
    company_id: 'company-2',
    invoice_number: 'R-2024-004',
    issue_date: '2024-07-10',
    due_date: '2024-07-25',
    amount: 250000,
    status: 'paid',
    items: [{ description: 'Suscripción Mensual - Plan Básico', amount: 250000 }],
  },
  {
    id: 'inv-005',
    company_id: 'company-2',
    invoice_number: 'R-2024-005',
    issue_date: '2024-08-10',
    due_date: '2024-08-25',
    amount: 250000,
    status: 'unpaid',
    items: [{ description: 'Suscripción Mensual - Plan Básico', amount: 250000 }],
  },
];

export const mockAuthorizedPersons = [
  {
    id: 'auth-1',
    company_id: 'company-1',
    name: 'Carlos Perez',
    document_id: '1122334455',
  },
  {
    id: 'auth-2',
    company_id: 'company-1',
    name: 'Maria Rodriguez',
    document_id: '2233445566',
  },
  {
    id: 'auth-3',
    company_id: 'company-2',
    name: 'Luis Gomez',
    document_id: '3344556677',
    authorized_by: 'Roberto Williams',
  },
];

export const mockStorageUnits = [
    { id: 'unit-1', number: 'A-101', status: 'occupied', company_id: 'company-1' },
    { id: 'unit-2', number: 'A-102', status: 'vacant' },
    { id: 'unit-3', number: 'A-103', status: 'vacant' },
    { id: 'unit-4', number: 'B-205', status: 'occupied', company_id: 'company-2' },
    { id: 'unit-5', number: 'B-206', status: 'vacant' },
    { id: 'unit-6', number: 'C-301', status: 'vacant' },
];

export const mockInventoryItems = [
    {
        id: 'item-1',
        company_id: 'company-1',
        storage_unit_id: 'unit-1',
        name: 'Cajas de Archivo 2023',
        quantity: 12,
        category: 'Documentos',
        description: 'Cajas con facturas y contabilidad año 2023',
        last_updated: '2024-01-15'
    },
    {
        id: 'item-2',
        company_id: 'company-1',
        storage_unit_id: 'unit-1',
        name: 'Bicicleta de Montaña',
        quantity: 1,
        category: 'Deportes',
        description: 'Marca Trek, color rojo, guardada con funda',
        last_updated: '2023-12-10'
    },
    {
        id: 'item-3',
        company_id: 'company-2',
        storage_unit_id: 'unit-4',
        name: 'Servidores Rack 4U',
        quantity: 5,
        category: 'Tecnología',
        description: 'Servidores Dell PowerEdge antiguos',
        last_updated: '2024-02-20'
    },
    {
        id: 'item-4',
        company_id: 'company-2',
        storage_unit_id: 'unit-4',
        name: 'Monitores 24"',
        quantity: 10,
        category: 'Tecnología',
        description: 'Monitores Samsung para oficina',
        last_updated: '2024-02-20'
    }
];

export const mockInventoryLogs = [
    {
        id: 'log-1',
        company_id: 'company-1',
        storage_unit_id: 'unit-1',
        item_id: 'item-1',
        item_name: 'Cajas de Archivo 2023',
        action: 'create',
        quantity_change: 12,
        previous_quantity: 0,
        new_quantity: 12,
        date: '2024-01-15',
        performed_by: 'Alicia Johnson',
        notes: 'Ingreso inicial de archivo'
    },
    {
        id: 'log-2',
        company_id: 'company-2',
        storage_unit_id: 'unit-4',
        item_id: 'item-3',
        item_name: 'Servidores Rack 4U',
        action: 'exit',
        quantity_change: -2,
        previous_quantity: 7,
        new_quantity: 5,
        date: '2024-03-05',
        performed_by: 'Roberto Williams',
        notes: 'Retiro para pruebas en sede norte'
    }
];

export const mockAccessLogs = [
    {
        id: 'access-1',
        company_id: 'company-1',
        person_id: 'auth-1',
        person_name: 'Carlos Perez',
        action: 'entry',
        timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(), // 2 hours ago
    },
    {
        id: 'access-2',
        company_id: 'company-1',
        person_id: 'auth-1',
        person_name: 'Carlos Perez',
        action: 'exit',
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 mins ago
    },
    {
        id: 'access-3',
        company_id: 'company-2',
        person_id: 'auth-3',
        person_name: 'Luis Gomez',
        action: 'entry',
        timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 mins ago (Still inside)
    }
];
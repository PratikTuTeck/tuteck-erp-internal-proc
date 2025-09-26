# TuTeck ERP - Procurement Module (PROC)

A React-based procurement management system with role-based access control (RBAC).

## Authentication & Authorization

This application implements a comprehensive authentication and authorization system:

### Features

- **Token-based Authentication**: Validates user tokens with the backend API
- **Role-based Access Control (RBAC)**: Controls access to menus and submenus based on user permissions
- **Module-level Security**: Only users with PROC module access can use the application
- **Dynamic Menu Rendering**: Menus and submenus are displayed based on user permissions

### API Integration

The app validates user access by calling:

```
POST ${VITE_API_BASE_URL}/user-access/validate-with-access-proc
```

### Environment Variables

Create a `.env` file based on `.env.example`:

```bash
VITE_API_BASE_URL=http://localhost:3000
```

### Access Levels

The system supports three access levels:

- **MODULE**: Top-level module access (e.g., PROC, CRM, IMS)
- **MENU**: Menu-level access (e.g., Indent Management, PO Management)
- **SUBMENU**: Submenu-level access (e.g., All po, RFQ Management)

### Usage

The authentication context provides:

- `user`: Current authenticated user data
- `isLoading`: Authentication validation state
- `isAuthenticated`: Authentication status
- `procAccesses`: User's PROC module permissions
- `hasAccess(menuName, submenuName?)`: Check access permissions

---

# rfq need backend

get all rfq - rfq + rfq.vendor + rfq.warehouse - add approval_status filter
get by id rfq - rfq + vndor + warehouse + indent + item
get all by rfq_detail - add filter by rfq id
indent get all with filter approval_status = 'APPROVED'
vendor get all with filter approval_status = 'APPROVED'
rfq approve and reject endpoint to update approval_status
vendor quotation - vendor quotation + rfq + rfq vendor + rfq warehouse + indent + item for get all
vendor quotation - vendor quotation + vendor details + vendor term details + rfq + rfq vendor + rfq warehouse + indent + item for get by id

rfq vendor - vendor quotation + vendor + add filter rfq_id
po - get all po + vendor + origin type == quotation
<!-- ? origin id = vendor quotation id - join - vendor quotation  -->

po - get po + vendor <!-- we need more joins-->

# rfq prompt

## rfq management tab

- view rfq data call get api all 'rfq'
- approve button on view rfq row call post api - 'rfq/decision/:id' and the id is from the corresponding row's rfq_id
- create rfq
  - for select indent dropdown call get all api - 'indent' with query param 'approval_status'='APPROVED'
  - for warehouse dropdown call get all api - 'warehouse'
  - select vendors button will call get all api - 'vendors' with query param 'approval_status' = 'APPROVED'
  - on submit store the vendor ids in the state for that corresponding item id

## vendor quotation

- select rfq dropdown will call get all rfq api - 'rfq' with query param -- approval_status = "APPROVED"
- view will call get all api - 'rfq'
- eye button in each row will call the get api - 'rfq'
- in vendor quotation entry modal will get all api - 'rfq-details' with query param - rfq_id
- submit vendor quotation will call post api - 'vendor-quotation' with all the relevant api keys

## generate cs

- it will

# po prompt

- po view will call get all api - 'po' with approval_status = 'APPROVED' as query params
- each row eye button will call get api - '/po/:id'
- create purchase order will post api - '/po' with the relevant keys as payload - source_type will be mapped to po_origin_type in db with 'QUOTATION' or 'INDENT' as keys.
  on choosing 'Quotation' we call - get all api - 'rfq' with query params approval_status = 'APPROVED' for select rfq dropdown - on choosing a rfq we call get api - 'rfq_vendor' for select vendor dropdown
  on choosing 'Indent Details' we call - get all api - 'indent' with query params approval_status = 'APPROVED' for select indent dropdown - for select vendor dropdown we call get all api -'vendor' with query param 'approval_status' = 'APPROVED' - on save button click we call the post api - 'po' with payload with keys with the po_origin_id api key from ui key select rfq or sleecct indent

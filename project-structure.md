# KeepLynk Web App - Project Structure

## Root Structure

```
KeepLynk/apps/web/
├── eslint.config.js
├── index.html
├── package.json
├── README.md
├── vite.config.js
├── public/
└── src/
    ├── App.jsx
    ├── index.css
    ├── main.jsx
    ├── assets/
    ├── desktop/
    ├── mobile/
    └── store/
```

## Source Directory (`src/`)

### Desktop Module

```
src/desktop/
├── modules/
│   ├── auth/
│   ├── core/
│   │   ├── components/
│   │   │   ├── Layout.jsx
│   │   │   └── Sidebar.jsx
│   │   └── hooks/
│   ├── personas/
│   │   ├── creator/
│   │   ├── entrepreneur/
│   │   ├── professional/
│   │   ├── researcher/
│   │   └── student/
│   │       ├── components/
│   │       └── pages/
│   │           ├── Bookmarks.jsx
│   │           ├── Folders.jsx
│   │           ├── Home.jsx
│   │           ├── Resources.jsx
│   │           └── StudySets.jsx
│   └── shared/
└── pages/
```

### Mobile Module

```
src/mobile/
├── modules/
│   ├── auth/
│   ├── core/
│   │   ├── components/
│   │   │   └── Layout.jsx
│   │   └── hooks/
│   ├── personas/
│   │   ├── creator/
│   │   ├── entrepreneur/
│   │   ├── professional/
│   │   ├── researcher/
│   │   └── student/
│   │       ├── components/
│   │       └── pages/
│   │           ├── Bookmarks.jsx
│   │           ├── Folders.jsx
│   │           ├── Home.jsx
│   │           ├── Resources.jsx
│   │           └── StudySets.jsx
│   └── shared/
└── pages/
```

### Store (State Management)

```
src/store/
├── hooks.js
├── sidebarSlice.js
└── Store.js
```

### Assets

```
src/assets/
└── logo1.svg
```

## Import Path Guidelines

### From Desktop Components

- **Store imports** (from `src/desktop/modules/core/components/`):
  ```javascript
  import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
  import { toggleSidebar } from '../../../../store/sidebarSlice';
  ```

- **Assets imports** (from `src/desktop/modules/core/components/`):
  ```javascript
  import logo from '../../../../assets/logo1.svg';
  ```

- **Desktop components** (from `src/App.jsx`):
  ```javascript
  import Layout from './desktop/modules/core/components/Layout';
  import Home from './desktop/modules/personas/student/pages/Home';
  ```

### From Mobile Components

- **Store imports** (from `src/mobile/modules/core/components/`):
  ```javascript
  import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
  ```

- **Mobile components** (from `src/App.jsx`):
  ```javascript
  import Layout from './mobile/modules/core/components/Layout';
  ```

## Module Organization

### Personas
The app supports multiple personas, each with their own pages and components:
- **Student** - Educational tools (bookmarks, study sets, resources)
- **Professional** - Professional workspace features
- **Creator** - Content creation tools
- **Entrepreneur** - Business management features
- **Researcher** - Research and documentation tools

### Authentication Data Model
Signup and user registration forms now use the following fields:

```
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "initialPersona": "student" // Optional
}
```

The Signup page UI includes fields for first name, last name, email, password, and persona selection.

### Core Modules
- **auth/** - Authentication and authorization
- **core/** - Shared layout, sidebar, and core functionality
- **shared/** - Common components and utilities

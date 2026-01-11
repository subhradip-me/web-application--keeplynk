# KeepLynk API - Modular Structure Guide

## 📁 New API Structure

All APIs are now organized in `apps/web/src/shared/api/`:

```
shared/api/
├── index.js          # Central export (use this for imports)
├── apiClient.js      # Axios instance with interceptors
├── authAPI.js        # Authentication endpoints
├── resourcesAPI.js   # Resources CRUD
├── foldersAPI.js     # Folders CRUD
├── tagsAPI.js        # Tags CRUD
└── organiseAPI.js    # Auto-organize features
```

## 🚀 Usage Examples

### Import APIs

```javascript
// Import all APIs
import { authAPI, resourcesAPI, foldersAPI, tagsAPI, organiseAPI } from '@/shared/api';

// Or import specific ones
import { authAPI } from '@/shared/api';
```

### Authentication

```javascript
// Login
const { user, token } = await authAPI.login({ email, password });

// Register
const { user, token } = await authAPI.register({
  firstName,
  lastName,
  email,
  password,
  initialPersona: 'genaral'
});

// Logout
authAPI.logout();
```

### Resources

```javascript
// Get all resources
const { data } = await resourcesAPI.getAll({ limit: 10 });

// Get unorganized resources
const { data } = await resourcesAPI.getUnorganized();

// Create resource
const { data } = await resourcesAPI.create({
  title: 'My Resource',
  type: 'url',
  url: 'https://example.com'
});

// Update resource
const { data } = await resourcesAPI.update(resourceId, {
  title: 'Updated Title'
});

// Delete resource
await resourcesAPI.delete(resourceId);
```

### Folders

```javascript
// Get all folders
const { data } = await foldersAPI.getAll();

// Get folder by ID
const { data } = await foldersAPI.getById(folderId);

// Create folder
const { data } = await foldersAPI.create({
  name: 'New Folder',
  color: '#3B82F6',
  icon: '📁'
});

// Update folder
const { data } = await foldersAPI.update(folderId, {
  name: 'Updated Name'
});

// Delete folder
await foldersAPI.delete(folderId);

// Get folder resources
const { data } = await foldersAPI.getResources(folderId);
```

### Tags

```javascript
// Get all tags
const { data } = await tagsAPI.getAll();

// Create tag
const { data } = await tagsAPI.create({
  name: 'Important',
  color: '#EF4444'
});

// Update tag
const { data } = await tagsAPI.update(tagId, {
  name: 'Very Important'
});

// Delete tag
await tagsAPI.delete(tagId);
```

### Auto-Organize

```javascript
// Auto-organize resources
const { data } = await organiseAPI.autoOrganise({
  resourceIds: [id1, id2, id3]
});
```

## 🔧 Features

### Automatic Persona Detection
The API client automatically detects and sets the persona based on the current URL:
- `/genaral/*` → X-Persona: genaral
- `/student/*` → X-Persona: student
- `/professional/*` → X-Persona: professional

### Auto Token Management
- Tokens are automatically added to requests
- 401 responses automatically clear storage and redirect to signin

### Error Handling
```javascript
try {
  const data = await resourcesAPI.getAll();
} catch (error) {
  console.error(error.message); // User-friendly error message
}
```

## 🔄 Migration from Old API

**Before:**
```javascript
import apiClient from '../../../shared/api/apiClient';
const response = await apiClient.get('/resources');
```

**After:**
```javascript
import { resourcesAPI } from '@/shared/api';
const response = await resourcesAPI.getAll();
```

## 📱 Mobile vs Desktop

Both mobile and desktop can use the same API imports:

```javascript
// Works in both mobile and desktop
import { authAPI, resourcesAPI } from '@/shared/api';
// OR
import { authAPI, resourcesAPI } from '../../../../shared/api';
```

## ⚡ Benefits

1. **Type Safety**: Clear method names and parameters
2. **Consistency**: Same API across mobile and desktop
3. **Maintainability**: Single source of truth for API calls
4. **Error Handling**: Centralized error handling
5. **Auto Persona**: Automatic persona detection
6. **Auto Auth**: Automatic token management

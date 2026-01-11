// Central API Export
export { default as apiClient } from './apiClient';
export { authAPI } from './authAPI';
export { resourcesAPI } from './resourcesAPI';
export { foldersAPI } from './foldersAPI';
export { tagsAPI } from './tagsAPI';
export { organiseAPI } from './organiseAPI';

// Legacy exports for backward compatibility
import { authAPI as authAPIImport } from './authAPI';
export { authAPI as Auth } from './authAPI';
export const Login = authAPIImport.login;
export const Register = authAPIImport.register;

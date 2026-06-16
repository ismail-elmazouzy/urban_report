import API from './api';

export const register = (data) => API.post('/auth/register', data);
export const login    = (data) => API.post('/auth/login', data);

export const saveUser = (data) => {
  localStorage.setItem('token', data.token);
  localStorage.setItem('role',  data.role);
  localStorage.setItem('email', data.email);
};

export const logout       = () => { localStorage.clear(); window.location.href = '/login'; };
export const getRole      = () => localStorage.getItem('role');
export const getEmail     = () => localStorage.getItem('email');
export const getZone      = () => localStorage.getItem('zone');
export const isLogged     = () => !!localStorage.getItem('token');
export const isSuperAdmin = () => localStorage.getItem('role') === 'SUPER_ADMIN';
export const isAdminVille = () => localStorage.getItem('role') === 'ADMIN_VILLE';
export const isAdmin      = () => ['ADMIN_VILLE', 'SUPER_ADMIN'].includes(localStorage.getItem('role'));
import { isLogged, isAdmin, getRole, getEmail } from '../services/auth';

export default function useAuth() {
  return {
    isLogged: isLogged(),
    isAdmin:  isAdmin(),
    role:     getRole(),
    email:    getEmail(),
  };
}
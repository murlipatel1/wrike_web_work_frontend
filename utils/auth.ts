import Cookies from 'js-cookie';

export const getAuthHeader = () => {
  const token = Cookies.get('token');
  if (token) {
    return {
      Authorization: `Bearer ${token}`,
    };
  }
  return {};
};


export const isTokenExpired = (): boolean => {
  if (typeof window !== 'undefined') {
    const tokenExpiry = localStorage.getItem('tokenExpiry');
    if (!tokenExpiry) return true;
    
    const expiryTime = parseInt(tokenExpiry, 10);
    return Date.now() > expiryTime;
  }
  return true;
};
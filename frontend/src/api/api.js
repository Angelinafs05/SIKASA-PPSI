import axios from 'axios';

const API_BASE_URL = 'http://localhost/SIKASA%20PPSI/backend';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add a request interceptor to include the JWT token and Admin View Period
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Only set Content-Type to application/json if NOT sending FormData
    if (!(config.data instanceof FormData)) {
      config.headers['Content-Type'] = 'application/json';
    }
    
    // Inject Admin View Period if available and user is admin/kepala_sekolah
    const storedUserJson = localStorage.getItem('user');
    let isAdmin = false;
    if (storedUserJson) {
      try {
        const u = JSON.parse(storedUserJson);
        isAdmin = u && (u.role === 'admin' || u.role === 'kepala_sekolah');
      } catch (e) {}
    }

    if (isAdmin) {
      const adminViewYear = localStorage.getItem('adminViewYear');
      const adminViewSemester = localStorage.getItem('adminViewSemester');
      if (adminViewYear) {
        config.headers['X-Admin-View-Year'] = adminViewYear;
      }
      if (adminViewSemester) {
        config.headers['X-Admin-View-Semester'] = adminViewSemester;
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle errors globally
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear local storage and redirect to login if unauthorized
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('adminPeriodConfirmed');
      localStorage.removeItem('adminViewYear');
      localStorage.removeItem('adminViewSemester');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

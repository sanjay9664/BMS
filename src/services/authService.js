const EXTERNAL_API_URL = import.meta.env.VITE_EXTERNAL_API_URL;

export const loginToSochiot = async (email, password) => {
  try {
    const response = await fetch(`${EXTERNAL_API_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    const data = await response.json();
    if (data.token) {
      localStorage.setItem('sochiot_token', data.token);
      return data.token;
    }
    throw new Error('No token received');
  } catch (error) {
    console.error('Auth Error:', error);
    throw error;
  }
};

export const getSochiotUserMe = async () => {
  const token = localStorage.getItem('sochiot_token');
  if (!token) return null;

  try {
    const response = await fetch(`${EXTERNAL_API_URL}/user/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('sochiot_token');
      }
      throw new Error('Failed to fetch user data');
    }

    return await response.json();
  } catch (error) {
    console.error('Fetch Me Error:', error);
    throw error;
  }
};

const CONFIG_API_URL = import.meta.env.VITE_CONFIG_API_URL;

export const getSochiotLocationData = async (locationId) => {
  const token = localStorage.getItem('sochiot_token');
  if (!token) return null;

  try {
    const response = await fetch(`${CONFIG_API_URL}/entity/LOCATION/${locationId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) throw new Error('Failed to fetch location data');
    return await response.json();
  } catch (error) {
    console.error('Fetch Location Error:', error);
    throw error;
  }
};
export const getSochiotDeviceDetails = async (deviceId) => {
  const token = localStorage.getItem('sochiot_token');
  if (!token) return null;

  try {
    const response = await fetch(`${CONFIG_API_URL}/device/${deviceId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) throw new Error('Failed to fetch device details');
    return await response.json();
  } catch (error) {
    console.error('Fetch Device Details Error:', error);
    throw error;
  }
};
          



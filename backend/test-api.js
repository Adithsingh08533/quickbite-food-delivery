const jwt = require('jsonwebtoken');
const axios = require('axios');
const token = jwt.sign({ userId: 'some-owner-id', role: 'owner' }, 'quickbite_secret_key_123', { expiresIn: '1h' });
const payload = {
  name: 'Pista House',
  address: '7,6, Plot no 8',
  cuisineType: 'South Indian',
  city: 'Hyderabad',
  phone: '+919392983145',
  pinCode: '501513'
};
axios.post('http://localhost:5000/api/v1/restaurants', payload, {
  headers: { Authorization: `Bearer ${token}` }
}).then(r => console.log('Success:', r.data))
  .catch(e => console.log('Error:', e.response?.data));

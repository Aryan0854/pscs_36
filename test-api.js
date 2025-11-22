const http = require('http');

// Make a request to the API endpoint
const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/analytics/dashboard',
  method: 'GET'
};

const req = http.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Status Code:', res.statusCode);
    console.log('Response Headers:', res.headers);
    console.log('Response Data:', data);
    
    try {
      const jsonData = JSON.parse(data);
      console.log('Parsed JSON:', JSON.stringify(jsonData, null, 2));
    } catch (error) {
      console.error('Error parsing JSON:', error);
    }
  });
});

req.on('error', (error) => {
  console.error('Request Error:', error);
});

req.end();
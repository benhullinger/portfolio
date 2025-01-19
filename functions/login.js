const querystring = require('querystring');
const axios = require('axios');

exports.handler = async function (event, context) {
  // Get password from form submission
  const { password } = querystring.parse(event.body);
  
  // Get redirect path from query string
  const { redirect } = querystring.parse(event.headers.referer.split('?')[1]);

  const endpoint = `${process.env.URL}/.netlify/identity/token`;
  const data = querystring.stringify({
    grant_type: 'password',
    username: process.env.AUTH_USERNAME, // Set this in Netlify environment variables
    password: password,
  });

  try {
    const response = await axios.post(endpoint, data, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    
    return {
      statusCode: 302,
      headers: {
        'Set-Cookie': `nf_jwt=${response.data.access_token}; Path=/; HttpOnly; Secure`,
        'Cache-Control': 'no-cache',
        Location: redirect || '/index.html',
      },
    };
  } catch (error) {
    return {
      statusCode: 302,
      headers: {
        'Cache-Control': 'no-cache',
        Location: `/login/?redirect=${encodeURIComponent(redirect)}`,
      },
    };
  }
};

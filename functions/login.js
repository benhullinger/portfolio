const querystring = require('querystring');
const axios = require('axios');

exports.handler = async function (event, context) {
  const { password, redirect } = querystring.parse(event.body);
  
  const endpoint = `${process.env.URL}/.netlify/identity/token`;
  const data = querystring.stringify({
    grant_type: 'password',
    username: process.env.AUTH_USERNAME,
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
        Location: `/login.html?redirect=${redirect || ''}`,
      },
    };
  }
};

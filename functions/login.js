const querystring = require('querystring');
const axios = require('axios');

exports.handler = async function (event, context) {
  const { password } = querystring.parse(event.body);
  const { redirect } = querystring.parse(event.headers.referer.split('?')[1]);

  const endpoint = `${process.env.URL}/.netlify/identity/token`;
  const data = querystring.stringify({
    grant_type: 'password',
    username: 'email@hullinger.design',
    password: password,
  });

  try {
    const response = await axios.post(endpoint, data, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    const access_token = response.data.access_token;

    return {
      statusCode: 302,
      headers: {
        // Set two cookies - one HttpOnly for security, one for JS detection
        'Set-Cookie': [
          `nf_jwt=${access_token}; Path=/; HttpOnly; Secure`,
          `auth_status=true; Path=/; Secure`
        ].join(', '),
        'Cache-Control': 'no-cache',
        Location: redirect || '/pro/',
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

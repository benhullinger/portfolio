exports.handler = async (event) => {
  const path = event.path;
  return {
    statusCode: 302,
    headers: {
      Location: `/login.html?redirect=${path}`,
    },
  };
};
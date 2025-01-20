exports.handler = async (event) => {
  // Remove .html extension if present for consistency
  const path = event.path.replace('.html', '');
  const encodedPath = encodeURIComponent(path);
  
  return {
    statusCode: 302,
    headers: {
      Location: `/login.html?redirect=${encodedPath}`,
    },
  };
};
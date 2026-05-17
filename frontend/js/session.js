async function loadCurrentUser() {

  const token =
    localStorage.getItem(
      'token'
    );

  if (!token) {

    window.location.href =
      '/index.html';

    return;
  }

  const response =
    await fetch(

      `${CONFIG.API_URL}/api/v1/me`,

      {

        headers: {

          Authorization:
            `Bearer ${token}`

        }

      }

    );

  const result =
    await response.json();

  if (!result.success) {

    localStorage.removeItem(
      'token'
    );

    window.location.href =
      '/index.html';

    return;
  }

  localStorage.setItem(

    'currentUser',

    JSON.stringify(
      result.data
    )

  );

  return result.data;
}
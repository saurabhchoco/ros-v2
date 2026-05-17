import { initializeApp }
from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';

import {
  getAuth
}
from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';

const firebaseConfig = {
  apiKey: 'AIzaSyCrKwj-ghmgQOzU7vcEzW1blmJaHwpAhCY',
  authDomain: 'ros-v2.firebaseapp.com',
  projectId: 'ros-v2'
};

const app =
  initializeApp(firebaseConfig);

const auth =
  getAuth(app);

export {
  auth
};
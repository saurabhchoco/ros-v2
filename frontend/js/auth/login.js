import { auth }
from './firebase.js';

import {
  signInWithEmailAndPassword
}
from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';

const loginBtn =
  document.getElementById(
    'loginBtn'
  );

loginBtn.addEventListener(
  'click',
  async () => {

    const email =
      document.getElementById(
        'email'
      ).value;

    const password =
      document.getElementById(
        'password'
      ).value;

    try {

      const userCredential =
        await signInWithEmailAndPassword(
          auth,
          email,
          password
        );

      const token =
        await userCredential.user.getIdToken();

      localStorage.setItem(
        'token',
        token
      );

      alert('Login successful');

      console.log(token);

    } catch (error) {

      console.error(error);

      alert(error.message);

    }

  }
);
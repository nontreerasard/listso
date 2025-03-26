const axios = require('axios');

setInterval(() => {
  axios.get('https://new-listso.onrender.com')
    .then(response => {
      console.log('Ping successful');
    })
    .catch(error => {
      console.log('Ping failed', error);
    });
}, 5 * 60 * 1000);

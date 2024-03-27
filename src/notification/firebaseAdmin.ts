import * as firebase from 'firebase-admin';
import * as path from 'path';

firebase.initializeApp({
  credential: firebase.credential.cert(
    path.join(__dirname, 'upspot-mvp-pwa-firebase-adminsdk-sjeb3-490e3f3272.json'),
  ),
});

export default firebase
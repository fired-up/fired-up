import firebase from 'firebase';
//import 'firebase/firestore';

// https://github.com/zeit/next.js/issues/1999 
if ( !firebase.apps.length ) {
    firebase.initializeApp({
        apiKey: process.env.FIREBASE_API,
        projectId: process.env.FIREBASE_PROJECT,
        authDomain: process.env.FIREBASE_DOMAIN,
        databaseURL: process.env.FIREBASE_DATABASE,
        storageBucket: process.env.FIREBASE_STORAGE,
        messagingSenderId: process.env.FIREBASE_SENDER
    });
}

export default firebase;
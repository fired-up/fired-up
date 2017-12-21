// Note, firebase needs to be included via some global method in fired up and not per-module
import firebase from 'firebase';
import 'firebase/firestore';

if ( !firebase.apps.length ) {
    firebase.initializeApp({
        apiKey: process.env.FIREBASE_API,
        projectId: process.env.FIREBASE_PROJECT,
        authDomain: process.env.FIREBASE_DOMAIN,
        databaseURL: process.env.FIREBASE_DATABASE,
        storageBucket: process.env.FIREBASE_STORAGE,
    });
}

const writeAction = ( form, intent, fields ) => {
    const data = {
        form,
        fields,
        intent,
        url: location.href,
        utm: JSON.parse(localStorage.getItem('utm') || '{}'),
        created_at: firebase.firestore.FieldValue.serverTimestamp(),
    }   

    firebase
        .firestore()
        .collection('phone2action')
        .add(data);
}

export default { writeAction };
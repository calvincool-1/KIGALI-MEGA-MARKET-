// Firebase Configuration Example
// Copy this file to firebase.js and replace with your actual Firebase credentials

const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    databaseURL: "https://YOUR_PROJECT_ID.firebaseio.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

export default firebaseConfig;

/* 
HOW TO GET YOUR FIREBASE CREDENTIALS:

1. Go to https://console.firebase.google.com/
2. Create a new project or select existing project
3. Click on the gear icon (⚙️) next to "Project Overview"
4. Select "Project settings"
5. Scroll down to "Your apps" section
6. Click on the web icon (</>)
7. Register your app
8. Copy the firebaseConfig object
9. Paste it above, replacing the placeholder values
10. Save this file as firebase.js (without .example)

REQUIRED FIREBASE SERVICES:
- Authentication (Email/Password enabled)
- Realtime Database (with security rules from README.md)
*/

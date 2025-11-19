# Features

This document outlines the features of the Rental Expense Forecaster application.

## Manage User Sessions

### Description
A user can either access this application as a guest or as a registered user. Allow the user to register and login to the application using their google account.
Since this application doesnt require much, the goal will be to have the user's settings and history saved in a JSON document in the user's google drive.
This will hopefully remove the need for enabling a backend server and allow the user to access their data from any device. 

If the user is not logged in, the application will default to a guest session. If the user makes a change to webpage, the user can either be prompted to do the following:
* Create an account and save their data to their google drive.
OR
* Generate the data as a JSON document and download it to their device.

### Notes

Create a login link at the top of the page that will redirect the user to the google login page.
When the user first navigates to the page, they will be a guest. They will have the option to login or register. 

For Guest Sessions:
* The user will have the ability to download the working state of their session as a JSON document.
* The user will have the ability to upload a JSON document to load their session.

For a logged in user:
* The user will have the ability to save their session to their google drive.
* The user will have the ability to load their session from their google drive.
    * This should happen automatically when the user logs in.

For logging in/registering, provide a login button that uses google's oAuth2.0 to authenticate the user.
Provide a logout button that will clear the user's session and redirect them to the login page.

### Acceptance Criteria

- [ ] The user can register and login to the application using their google account.
- [ ] The user's settings and history are saved in a JSON document in the user's google drive.
- [ ] The user can access their data from any device.
- [ ] The user can logout of the application.
- [ ] The user can see a logout button when they are logged in.
- [ ] The user can see a login button when they are not logged in.
- [ ] The user can see a register button when they are not logged in.
- [ ] The user can see a guest button when they are not logged in.



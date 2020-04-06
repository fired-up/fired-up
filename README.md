# Fired Up

Fired Up is an open-source serverless CRM that scales. Built on Google’s powerful Firebase 

## Built in Components

### Signups Processing

When your users signup, their form submission will be written to Firestore. From there, you can add as many post-donation tasks as you’d like. We have used these tasks to validate email addresses, add geolocation to people’s postal codes, send autoresponders, and process signups into Person records. Signups can be isolated into different buckets on the data side by using Form IDs from Fired Up Admin.

Signups support an unlimited amount of custom fields, and a standardized set (OSDI naming convention) of profile fields.

### People Processing

A person visiting your campaign may take multiple actions both online and offline. Fired Up builds a person record with the activities they take, updates fields when new data comes in, and keeps record of when and how a persons profile data has changed. A base person record contains profile fields with OSDI naming convention, but you can add your own fields which will be upserted from signups and other actions

People records can then be reported on or synced into other systems (like emailers or texting tools)

### Embeddable Form Widget

A react-based embeddable forms widget allows you to quickly setup a customized signup field with built-in validation. 

### Admin Dashboard

Next.js based admin dashboard secured with Firebase Authentication. 

Within the dashboard, you can currently create “forms” which group together signups and download form submissions 

### Firebase Functions Deploy

### Other Integrations

There are several more vendor-specific plugins to Fired Up in the Tom Steyer integrations repo

## Roadmap

Some features we’d like to implement in future releases of Fired Up
 * A truly modular plugins system that can add additional functionality into the firebase functions deploy, the admin dashboard, and in post-signup actions

- - - - -

## Development

### Requirements

* A fresh Firebase project - we recommend a `-dev` and `-prod ` project so that you can isolate testing and production code.
* A Node.js development environment 
  * Node.js
  * NVM
  * Yarn Package Manager
* [Installed Firebase CLI](https://firebase.google.com/docs/cli)

### Getting Started

* Clone this repo
* Run `nvm use`, making sure to install the current Node.js version if it isn't currently present
* Run `yarn`
* Configure your Firebase development projects. Copy `.firebaserc-sample` to `.firebaserc` and rename the projects to match your dev/prod Firebase projects.
* Run `firebase use dev`

## Packages Development

Our functionality is broken out into a series of packages so that each fired up install can be tailored to your organizations needs. 

### Functions Development

* Install root functions deps:
`cd functions && yarn`
* Deploy everything to firebase with `yarn deploy:dev`



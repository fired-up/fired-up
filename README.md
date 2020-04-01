# Fired Up

## Usage

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



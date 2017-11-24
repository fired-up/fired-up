require('dotenv').config();

const next = require('next')
const routes = require('./routes.js')
const app = next({dev: process.env.NODE_ENV !== 'production'})
const handler = routes.getRequestHandler(app)

// With express
const express = require('express')

app.prepare().then(() => {
  express().use(handler).listen(3000)
})
const routes = module.exports = require('next-routes')()

routes
    .add('signup/single', '/signup/:slug');

const routes = module.exports = require('next-routes')()

// By default Next.js' router is used, which will treat anything in `pages` as its own route.
// So index.js, folder/index.js will be treated as / and /folder respectively
// We only need to add dynamic pages. So /folder/single.js needs to be added below with its URL structure.
routes
    .add('signup/single', '/signup/:slug');

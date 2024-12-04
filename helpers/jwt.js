const { expressjwt: jwt } = require("express-jwt");
function authJwt() {
    const secret = process.env.secret;
    const api = process.env.API_URL;
    return jwt({
        secret,
        algorithms: ['HS256'],
    })
        .unless({
            path: [
                
                {
                    url: /\/api\/v1\/users(.*)/,
                    methods: ['GET', 'POST', 'PUT', 'PATCH', 'OPTIONS', 'DELETE']
                },
                {
                    url: /\/api\/v1\/pharmacies(.*)/,
                    methods: ['GET', 'POST', 'PUT', 'OPTIONS', 'DELETE']
                },
                {
                    url: /\/api\/v1\/barangays(.*)/,
                    methods: ['GET', 'POST', 'PUT', 'OPTIONS', 'DELETE']
                },
                {
                    url: /\/api\/v1\/diseases(.*)/,
                    methods: ['GET', 'POST', 'PUT', 'OPTIONS', 'DELETE']
                },
                {
                    url: /\/api\/v1\/medication-category(.*)/,
                    methods: ['GET', 'POST', 'PUT', 'OPTIONS', 'DELETE']
                },
                {
                    url: /\/api\/v1\/medicine(.*)/,
                    methods: ['GET', 'POST', 'PUT', 'OPTIONS', 'DELETE']
                },
                {
                    url: /\/public\/uploads(.*)/,
                    methods: ['GET', 'OPTIONS', 'POST']
                },
                `${api}/users`,
                `${api}/users/login`,
                `${api}/users/register`,
                // `${api}/users/updateProfile`,
            ]
        })
}

async function isRevoked(req, payload, done) {
    if (!payload.isAdmin) {
        done(null, true)
    }
    done();
}

module.exports = authJwt
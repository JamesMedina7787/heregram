const env = {
    PORT: process.env.PORT || 3000,
    DB_NAME: process.env.DB_NAME || 'heregram',
    DB_HOST: process.env.DB_HOST || 'localhost',
    DB_USER: process.env.DB_USER || '',
    DB_PASS: process.env.DB_PASS || '',
    DB_PORT: process.env.DB_PORT || '5432',
    DB_DIALECT: process.env.DB_DIALECT || 'postgres'
}

module.exports = env;
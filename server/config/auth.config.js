module.exports = {
    jwtSecret: process.env.JWT_SECRET || 'dkn-secret-key-2024',
    jwtExpiry: process.env.JWT_EXPIRY || '24h',
    refreshTokenExpiry: process.env.REFRESH_TOKEN_EXPIRY || '7d',
    saltRounds: 10
};

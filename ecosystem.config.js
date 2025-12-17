module.exports = {
    apps: [{
        name: 'complaint-box-server',
        script: './server/server.js',
        instances: 1,
        exec_mode: 'cluster',
        env: {
            NODE_ENV: 'production',
            PORT: process.env.PORT || 8080
        },
        error_file: './logs/err.log',
        out_file: './logs/out.log',
        log_file: './logs/combined.log',
        time: true
    }]
};

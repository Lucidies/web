        module.exports = {
        apps: [
            {
            name: 'biolink',
            script: 'npm',
            args: 'start',
            cwd: '/var/www/biolink',
            instances: 'max',
            exec_mode: 'cluster',
            env: {
                NODE_ENV: 'production',
                PORT: 3000,
            },
            error_file: '/var/log/pm2/biolink-error.log',
            out_file: '/var/log/pm2/biolink-out.log',
            log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
            restart_delay: 4000,
            max_memory_restart: '500M',
            autorestart: true,
            watch: false,
            },
        ],
        };

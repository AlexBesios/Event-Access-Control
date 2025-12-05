/* global require, process */
const app = require('./app');
const database = require('./services/database');

const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';

async function start() {
    await database.init();
    
    app.listen(PORT, HOST, () => {
        console.log(`Node.js server running on http://${HOST}:${PORT}`);
        console.log(`Access locally at http://localhost:${PORT}`);
        console.log(`Python API should be running on ${process.env.PYTHON_API_URL || 'http://localhost:8000'}`);
    });
}

start().catch(console.error);

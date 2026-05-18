/**
 * Abre o cardápio e o admin no mesmo host/porta (mesmo localStorage).
 * Uso: npm run open:all   (com servidor já em execução: npm start)
 */
const { execSync } = require('child_process');
const port = String(Number(process.env.PORT) || 3019);
const base = 'http://localhost:' + port;
const urls = [base + '/', base + '/admin/'];

if (process.platform === 'win32') {
    urls.forEach(function (u) {
        execSync('cmd /c start "" "' + u.replace(/"/g, '') + '"', { stdio: 'ignore' });
    });
} else {
    urls.forEach(function (u) {
        execSync('open "' + u.replace(/"/g, '') + '"', { stdio: 'ignore' });
    });
}

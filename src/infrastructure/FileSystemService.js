const fs = require('fs');
const path = require('path');

class FileSystemService {
    readMelIgnore(filePath = path.join(process.cwd(), '.melignore')) {
        try {
            if (fs.existsSync(filePath)) {
                const data = fs.readFileSync(filePath, 'utf-8');

                return data.split('\n').map(line => line.trim()).filter(line => line);
            }

            return [];
        } catch (err) {
            console.error(`Error reading .melignore: ${err.message}`);
            return [];
        }
    }

    readPackageJson(filePath = path.join(process.cwd(), 'package.json')) {
        try {
            if (fs.existsSync(filePath)) {
                const data = fs.readFileSync(filePath, 'utf-8');
                return JSON.parse(data);
            }
            return null;
        } catch (err) {
            console.error(`Error reading package.json: ${err.message}`);
            return null;
        }
    }
}

module.exports = FileSystemService;

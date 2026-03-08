const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

// Base path for URL generation (matches vite.config.js)
const BASE_PATH = '/music';

const app = express();
const PORT = 3001;

// Enable CORS
app.use(cors());
app.use(express.json());

// Configure multer for file upload
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed'));
        }
    }
});

// Upload endpoint
app.post('/api/upload', upload.single('file'), (req, res) => {
    try {
        const { name, printStatus, difficulty, type } = JSON.parse(req.body.songData);
        const file = req.file;

        if (!file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Tạo đường dẫn thư mục
        const folderPath = path.join(
            __dirname,
            'public',
            'piano',
            printStatus,
            name,
            difficulty,
            type
        );

        // Tạo thư mục nếu chưa tồn tại
        fs.mkdirSync(folderPath, { recursive: true });

        // Lưu file
        const filePath = path.join(folderPath, file.originalname);
        fs.writeFileSync(filePath, file.buffer);

        console.log(`✅ Đã lưu file: ${filePath}`);

        // Tự động regenerate songs.json
        try {
            console.log('🔄 Đang cập nhật songs.json...');
            execSync('node generate_data.cjs', { cwd: __dirname });
            console.log('✅ Đã cập nhật songs.json');
        } catch (err) {
            console.error('⚠️ Lỗi khi cập nhật songs.json:', err.message);
        }

        res.json({
            success: true,
            message: 'File uploaded successfully',
            path: `${printStatus}/${name}/${difficulty}/${type}/${file.originalname}`
        });

    } catch (error) {
        console.error('Error uploading file:', error);
        res.status(500).json({ error: error.message });
    }
});

// Load saved addedAt timestamps from songs.json to keep them stable
function loadSavedAddedAt() {
    const jsonPath = path.join(__dirname, 'src', 'data', 'songs.json');
    if (!fs.existsSync(jsonPath)) return {};
    try {
        const raw = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
        const map = {};
        ['printed', 'not print'].forEach(cat => {
            (raw[cat] || []).forEach(song => {
                if (song.addedAt) map[song.name] = song.addedAt;
            });
        });
        return map;
    } catch { return {}; }
}

// Function to scan folders (same as generate_data.cjs)
function scanFolders(baseDir) {
    const savedAddedAt = loadSavedAddedAt();
    const result = { 'not print': [], 'printed': [] };
    const subDirs = ['not print', 'printed'];

    subDirs.forEach(subDir => {
        const fullPath = path.join(baseDir, 'public', 'piano', subDir);
        if (!fs.existsSync(fullPath)) return;

        const songFolders = fs.readdirSync(fullPath);

        songFolders.forEach(songFolder => {
            const songPath = path.join(fullPath, songFolder);
            const stat = fs.statSync(songPath);
            if (!stat.isDirectory()) return;

            const songData = {
                name: songFolder,
                addedAt: savedAddedAt[songFolder] ?? Date.now(),
                difficulties: {}
            };

            const difficultyFolders = fs.readdirSync(songPath);
            difficultyFolders.forEach(diffFolder => {
                const diffPath = path.join(songPath, diffFolder);
                const diffStat = fs.statSync(diffPath);
                if (!diffStat.isDirectory()) return;

                songData.difficulties[diffFolder] = {};

                const typeFolders = fs.readdirSync(diffPath);
                typeFolders.forEach(typeFolder => {
                    const typePath = path.join(diffPath, typeFolder);
                    const typeStat = fs.statSync(typePath);
                    if (!typeStat.isDirectory()) return;

                    const files = fs.readdirSync(typePath).filter(f => {
                        return fs.statSync(path.join(typePath, f)).isFile();
                    }).map(f => {
                        const relativePath = path.relative(path.join(baseDir, 'public'), path.join(typePath, f));
                        return {
                            name: f,
                            path: BASE_PATH + '/' + relativePath.replace(/\\/g, '/')
                        };
                    });

                    if (files.length > 0) {
                        songData.difficulties[diffFolder][typeFolder] = files;
                    }
                });
            });

            result[subDir].push(songData);
        });
    });

    return result;
}

// API endpoint to get songs (real-time scan)
app.get('/api/songs', (req, res) => {
    try {
        const data = scanFolders(__dirname);
        res.json(data);
    } catch (error) {
        console.error('Error scanning folders:', error);
        res.status(500).json({ error: error.message });
    }
});

// Toggle print status: move song folder between 'printed' <-> 'not print'
app.patch('/api/songs/:name/toggle-print', (req, res) => {
    try {
        const songName = decodeURIComponent(req.params.name);
        const { currentStatus } = req.body; // 'printed' or 'not print'

        if (!currentStatus || !['printed', 'not print'].includes(currentStatus)) {
            return res.status(400).json({ error: 'Invalid currentStatus' });
        }

        const newStatus = currentStatus === 'printed' ? 'not print' : 'printed';
        const baseDir = path.join(__dirname, 'public', 'piano');
        const srcPath = path.join(baseDir, currentStatus, songName);
        const destPath = path.join(baseDir, newStatus, songName);

        if (!fs.existsSync(srcPath)) {
            return res.status(404).json({ error: `Song folder not found: ${srcPath}` });
        }

        // Ensure destination parent exists
        fs.mkdirSync(path.join(baseDir, newStatus), { recursive: true });
        fs.renameSync(srcPath, destPath);

        console.log(`✅ Moved "${songName}" from "${currentStatus}" to "${newStatus}"`);

        // Regenerate songs.json
        try {
            execSync('node generate_data.cjs', { cwd: __dirname });
        } catch (err) {
            console.error('⚠️ Lỗi khi cập nhật songs.json:', err.message);
        }

        res.json({ success: true, newStatus });
    } catch (error) {
        console.error('Error toggling print status:', error);
        res.status(500).json({ error: error.message });
    }
});

// Wishlist endpoints
const WISHLIST_FILE = path.join(__dirname, 'src', 'data', 'wishlist.json');

// Get wishlist
app.get('/api/wishlist', (req, res) => {
    try {
        if (!fs.existsSync(WISHLIST_FILE)) {
            // Create empty wishlist if doesn't exist
            fs.writeFileSync(WISHLIST_FILE, JSON.stringify([]));
            return res.json([]);
        }
        const data = fs.readFileSync(WISHLIST_FILE, 'utf8');
        res.json(JSON.parse(data));
    } catch (error) {
        console.error('Error reading wishlist:', error);
        res.status(500).json({ error: error.message });
    }
});

// Save wishlist
app.post('/api/wishlist', (req, res) => {
    try {
        const wishlist = req.body;
        fs.writeFileSync(WISHLIST_FILE, JSON.stringify(wishlist, null, 2));
        console.log('✅ Wishlist saved successfully');
        res.json({ success: true, message: 'Wishlist saved' });
    } catch (error) {
        console.error('Error saving wishlist:', error);
        res.status(500).json({ error: error.message });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running' });
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📁 Upload endpoint: http://localhost:${PORT}/api/upload`);
});

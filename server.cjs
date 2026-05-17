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
        const isPdf  = file.mimetype === 'application/pdf';
        const isMidi = /\.(mid|midi)$/i.test(file.originalname);
        if (isPdf || isMidi) {
            cb(null, true);
        } else {
            cb(new Error('Only PDF and MIDI files are allowed'));
        }
    }
});

// Upload fields: Easy_Piano, Easy_MIDI, Medium_Piano, Medium_MIDI, Hard_Piano, Hard_MIDI
const UPLOAD_FIELDS = ['Easy', 'Medium', 'Hard'].flatMap(diff =>
    ['Piano', 'MIDI'].map(type => ({ name: `${diff}_${type}`, maxCount: 1 }))
);

// Upload endpoint — nhận nhiều file cùng lúc theo bảng Difficulty × Type
app.post('/api/upload', upload.fields(UPLOAD_FIELDS), (req, res) => {
    try {
        const songName = (req.body.songName || '').trim();
        if (!songName) {
            return res.status(400).json({ error: 'songName is required' });
        }

        const uploadedFiles = [];

        ['Easy', 'Medium', 'Hard'].forEach(difficulty => {
            ['Piano', 'MIDI'].forEach(type => {
                const fieldName = `${difficulty}_${type}`;
                const fileArr = req.files?.[fieldName];
                if (!fileArr || fileArr.length === 0) return;

                const file = fileArr[0];

                // Fix encoding: multer decodes originalname as Latin-1 by default
                const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');

                // Tạo thư mục: public/piano/{songName}/{difficulty}/{type}/
                const folderPath = path.join(__dirname, 'public', 'piano', songName, difficulty, type);
                fs.mkdirSync(folderPath, { recursive: true });

                // Lưu file
                const filePath = path.join(folderPath, originalName);
                fs.writeFileSync(filePath, file.buffer);
                console.log(`✅ Đã lưu: ${filePath}`);

                uploadedFiles.push({ difficulty, type, name: originalName });
            });
        });

        if (uploadedFiles.length === 0) {
            return res.status(400).json({ error: 'Không có file nào được upload' });
        }

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
            message: `Đã upload ${uploadedFiles.length} file cho "${songName}"`,
            files: uploadedFiles,
        });

    } catch (error) {
        console.error('Error uploading files:', error);
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
        // Support cả format mảng mới lẫn format cũ { printed, 'not print' }
        const songs = Array.isArray(raw)
            ? raw
            : [...(raw['printed'] || []), ...(raw['not print'] || [])];
        songs.forEach(song => {
            if (song.addedAt) map[song.name] = song.addedAt;
        });
        return map;
    } catch { return {}; }
}

// Function to scan folders (same as generate_data.cjs)
function scanFolders(baseDir) {
    const savedAddedAt = loadSavedAddedAt();
    const result = [];

    const pianoDir = path.join(baseDir, 'public', 'piano');
    if (!fs.existsSync(pianoDir)) return result;

    const songFolders = fs.readdirSync(pianoDir);

    songFolders.forEach(songFolder => {
        const songPath = path.join(pianoDir, songFolder);
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

        // Chỉ thêm nếu có ít nhất 1 file
        const hasFiles = Object.values(songData.difficulties).some(d =>
            Object.values(d).some(files => files.length > 0)
        );
        if (hasFiles) result.push(songData);
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

// Edit song: đổi tên, thêm/xóa file
app.put('/api/songs/:name', upload.fields(UPLOAD_FIELDS), (req, res) => {
    try {
        const currentName = decodeURIComponent(req.params.name);
        const newName     = (req.body.songName || '').trim();
        const toRemove    = JSON.parse(req.body.toRemove || '[]');
        const toMove      = JSON.parse(req.body.toMove   || '[]');

        const pianoDir   = path.join(__dirname, 'public', 'piano');
        const currentPath = path.join(pianoDir, currentName);

        if (!fs.existsSync(currentPath)) {
            return res.status(404).json({ error: `Không tìm thấy: ${currentName}` });
        }

        // 1. Đổi tên thư mục nếu cần
        let workingPath = currentPath;
        if (newName && newName !== currentName) {
            const newPath = path.join(pianoDir, newName);
            if (fs.existsSync(newPath)) {
                return res.status(400).json({ error: `"${newName}" đã tồn tại` });
            }

            // Lấy addedAt gốc trước khi đổi tên
            const savedAddedAt = loadSavedAddedAt();
            const originalAddedAt = savedAddedAt[currentName] ?? Date.now();

            // Copy toàn bộ thư mục (tránh EPERM của OneDrive khi rename)
            fs.cpSync(currentPath, newPath, { recursive: true });
            fs.rmSync(currentPath, { recursive: true, force: true });
            workingPath = newPath;
            console.log(`✏️ Đã đổi tên: "${currentName}" → "${newName}"`);

            // Cập nhật src/data/songs.json để giữ addedAt cũ dưới tên mới
            // (generate_data.cjs đọc file này để preserve timestamp)
            const jsonPath = path.join(__dirname, 'src', 'data', 'songs.json');
            if (fs.existsSync(jsonPath)) {
                try {
                    const raw = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
                    const songs = Array.isArray(raw) ? raw : [...(raw['printed'] || []), ...(raw['not print'] || [])];
                    const updated = songs.map(s =>
                        s.name === currentName ? { ...s, name: newName, addedAt: originalAddedAt } : s
                    );
                    // Nếu chưa có trong JSON (bài mới chưa từng generate), thêm vào
                    if (!updated.find(s => s.name === newName)) {
                        updated.push({ name: newName, addedAt: originalAddedAt, difficulties: {} });
                    }
                    fs.writeFileSync(jsonPath, JSON.stringify(updated, null, 2), 'utf8');
                } catch (e) {
                    console.warn('⚠️ Không cập nhật được songs.json:', e.message);
                }
            }
        }

        // 2. Xóa các file được đánh dấu TRƯỚC khi chuyển
        //    (tránh bug: file nguồn & file cũ ở đích cùng tên → xóa nhầm file vừa chuyển)
        toRemove.forEach(({ difficulty, type, filename }) => {
            const filePath = path.join(workingPath, difficulty, type, filename);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                console.log(`🗑 Đã xóa file: ${filePath}`);
                const typeDir = path.join(workingPath, difficulty, type);
                const diffDir = path.join(workingPath, difficulty);
                try { if (fs.readdirSync(typeDir).length === 0) fs.rmdirSync(typeDir); } catch {}
                try { if (fs.readdirSync(diffDir).length === 0) fs.rmdirSync(diffDir); } catch {}
            }
        });

        // 3. Chuyển file giữa các ô (copyFileSync+unlinkSync để tránh EPERM OneDrive)
        toMove.forEach(({ fromDifficulty, fromType, filename, toDifficulty, toType }) => {
            const srcPath = path.join(workingPath, fromDifficulty, fromType, filename);
            if (!fs.existsSync(srcPath)) {
                console.warn(`⚠️ Không tìm thấy file để chuyển: ${srcPath}`);
                return;
            }
            const dstDir = path.join(workingPath, toDifficulty, toType);
            fs.mkdirSync(dstDir, { recursive: true });
            fs.copyFileSync(srcPath, path.join(dstDir, filename)); // copy trước
            fs.unlinkSync(srcPath);                                 // xóa nguồn sau
            console.log(`↕️ Chuyển: ${fromDifficulty}/${fromType} → ${toDifficulty}/${toType}/${filename}`);
            const srcTypeDir = path.join(workingPath, fromDifficulty, fromType);
            const srcDiffDir = path.join(workingPath, fromDifficulty);
            try { if (fs.readdirSync(srcTypeDir).length === 0) fs.rmdirSync(srcTypeDir); } catch {}
            try { if (fs.readdirSync(srcDiffDir).length === 0) fs.rmdirSync(srcDiffDir); } catch {}
        });

        // 4. Thêm file mới (upload)
        const uploadedFiles = [];
        ['Easy', 'Medium', 'Hard'].forEach(difficulty => {
            ['Piano', 'MIDI'].forEach(type => {
                const fileArr = req.files?.[`${difficulty}_${type}`];
                if (!fileArr || fileArr.length === 0) return;
                const file = fileArr[0];
                const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
                const folderPath = path.join(workingPath, difficulty, type);
                fs.mkdirSync(folderPath, { recursive: true });
                fs.writeFileSync(path.join(folderPath, originalName), file.buffer);
                console.log(`✅ Đã thêm: ${difficulty}/${type}/${originalName}`);
                uploadedFiles.push({ difficulty, type, name: originalName });
            });
        });

        // 5. Regenerate songs.json
        try { execSync('node generate_data.cjs', { cwd: __dirname }); } catch {}


        res.json({ success: true, newName: newName || currentName, uploadedFiles });
    } catch (error) {
        console.error('Error editing song:', error);
        res.status(500).json({ error: error.message });
    }
});

// Delete song: xóa toàn bộ thư mục bài hát
app.delete('/api/songs/:name', (req, res) => {
    try {
        const songName = decodeURIComponent(req.params.name);
        const songPath = path.join(__dirname, 'public', 'piano', songName);

        if (!fs.existsSync(songPath)) {
            return res.status(404).json({ error: `Không tìm thấy bài hát: ${songName}` });
        }

        // Xóa đệ quy toàn bộ thư mục bài hát
        fs.rmSync(songPath, { recursive: true, force: true });
        console.log(`🗑 Đã xóa: ${songPath}`);

        // Regenerate songs.json
        try {
            execSync('node generate_data.cjs', { cwd: __dirname });
        } catch (err) {
            console.error('⚠️ Lỗi khi cập nhật songs.json:', err.message);
        }

        res.json({ success: true, message: `Đã xóa "${songName}"` });
    } catch (error) {
        console.error('Error deleting song:', error);
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

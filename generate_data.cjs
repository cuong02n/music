const fs = require('fs');
const path = require('path');

// Base path for GitHub Pages deployment
const BASE_PATH = '/music';

const dataDir = path.join(__dirname, 'src', 'data');
const outputFile = path.join(dataDir, 'songs.json');

// Load existing songs.json to preserve addedAt timestamps
function loadExistingData() {
    if (!fs.existsSync(outputFile)) return {};
    try {
        const raw = JSON.parse(fs.readFileSync(outputFile, 'utf8'));
        const map = {};
        // Support cả format mảng mới lẫn format cũ { printed, 'not print' }
        const songs = Array.isArray(raw)
            ? raw
            : [...(raw['printed'] || []), ...(raw['not print'] || [])];
        songs.forEach(song => {
            if (song.addedAt) map[song.name] = song.addedAt;
        });
        return map;
    } catch {
        return {};
    }
}

function scanFolders(baseDir) {
    const existingAddedAt = loadExistingData();
    const result = [];

    const pianoDir = path.join(baseDir, 'public', 'piano');
    if (!fs.existsSync(pianoDir)) {
        console.warn('⚠️ Thư mục public/piano không tồn tại');
        return result;
    }

    const songFolders = fs.readdirSync(pianoDir);

    songFolders.forEach(songFolder => {
        const songPath = path.join(pianoDir, songFolder);
        const stat = fs.statSync(songPath);
        if (!stat.isDirectory()) return;

        // Preserve existing addedAt; for new songs use current time
        const addedAt = existingAddedAt[songFolder] ?? Date.now();

        const songData = {
            name: songFolder,
            addedAt,
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
                    // Path relative to public folder
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
        if (hasFiles) {
            result.push(songData);
        }
    });

    return result;
}

const baseDir = __dirname;
const data = scanFolders(baseDir);

// Save to src/data/songs.json
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

fs.writeFileSync(
    outputFile,
    JSON.stringify(data, null, 2),
    'utf8'
);

console.log('✅ Đã tạo src/data/songs.json');
console.log(`📊 Tổng số bài hát: ${data.length}`);

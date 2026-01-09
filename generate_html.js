const fs = require('fs');
const path = require('path');

function scanFolders(baseDir) {
    const result = { 'not print': [], 'printed': [] };
    const subDirs = ['not print', 'printed'];

    subDirs.forEach(subDir => {
        const fullPath = path.join(baseDir, 'piano', subDir);
        if (!fs.existsSync(fullPath)) return;

        const songFolders = fs.readdirSync(fullPath);

        songFolders.forEach(songFolder => {
            const songPath = path.join(fullPath, songFolder);
            const stat = fs.statSync(songPath);
            if (!stat.isDirectory()) return;

            const songData = {
                name: songFolder,
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
                        const filePath = path.join(typePath, f);
                        const relativePath = path.relative(baseDir, filePath);
                        return {
                            name: f,
                            path: relativePath.replace(/\\/g, '/')
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

function generateHTML(data) {
    const htmlTemplate = `<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Thư Viện Nhạc Piano</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Inter', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
            color: #333;
        }

        .container {
            max-width: 1400px;
            margin: 0 auto;
        }

        header {
            text-align: center;
            margin-bottom: 40px;
            animation: fadeInDown 0.8s ease;
        }

        h1 {
            font-size: 3rem;
            font-weight: 700;
            color: white;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
            margin-bottom: 10px;
        }

        .subtitle {
            font-size: 1.2rem;
            color: rgba(255,255,255,0.9);
            font-weight: 300;
        }

        .stats {
            display: flex;
            gap: 20px;
            justify-content: center;
            margin-top: 20px;
            flex-wrap: wrap;
        }

        .stat-card {
            background: rgba(255,255,255,0.2);
            backdrop-filter: blur(10px);
            padding: 15px 30px;
            border-radius: 15px;
            color: white;
            font-weight: 500;
            box-shadow: 0 8px 32px rgba(0,0,0,0.1);
        }

        .stat-number {
            font-size: 2rem;
            font-weight: 700;
            display: block;
        }

        .search-box {
            margin-bottom: 30px;
            animation: fadeIn 1s ease;
        }

        .search-input {
            width: 100%;
            padding: 18px 25px;
            font-size: 1.1rem;
            border: none;
            border-radius: 15px;
            background: white;
            box-shadow: 0 10px 40px rgba(0,0,0,0.1);
            transition: all 0.3s ease;
            font-family: 'Inter', sans-serif;
        }

        .search-input:focus {
            outline: none;
            box-shadow: 0 15px 50px rgba(0,0,0,0.15);
            transform: translateY(-2px);
        }

        .tabs {
            display: flex;
            gap: 15px;
            margin-bottom: 30px;
            animation: fadeIn 1.2s ease;
        }

        .tab {
            flex: 1;
            padding: 15px 30px;
            background: rgba(255,255,255,0.2);
            backdrop-filter: blur(10px);
            border: none;
            border-radius: 15px;
            color: white;
            font-size: 1.1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            font-family: 'Inter', sans-serif;
        }

        .tab:hover {
            background: rgba(255,255,255,0.3);
            transform: translateY(-2px);
        }

        .tab.active {
            background: white;
            color: #667eea;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }

        .songs-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
            gap: 25px;
            animation: fadeInUp 1s ease;
        }

        .song-card {
            background: white;
            border-radius: 20px;
            padding: 25px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.1);
            transition: all 0.3s ease;
            cursor: pointer;
        }

        .song-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 15px 50px rgba(0,0,0,0.2);
        }

        .song-title {
            font-size: 1.3rem;
            font-weight: 600;
            color: #333;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .song-icon {
            width: 40px;
            height: 40px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 1.2rem;
            flex-shrink: 0;
        }

        .song-details {
            margin-top: 15px;
        }

        .detail-row {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 10px;
            padding: 10px;
            background: #f8f9fa;
            border-radius: 10px;
            transition: all 0.2s ease;
        }

        .detail-row:hover {
            background: #e9ecef;
        }

        .badge {
            display: inline-block;
            padding: 5px 12px;
            border-radius: 20px;
            font-size: 0.85rem;
            font-weight: 500;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }

        .badge.difficulty {
            background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
        }

        .badge.type-piano {
            background: linear-gradient(135deg, #ee0979 0%, #ff6a00 100%);
        }

        .badge.type-chord {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        }

        .badge.type-midi {
            background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
        }

        .file-link {
            color: #667eea;
            text-decoration: none;
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: 5px;
            transition: all 0.2s ease;
        }

        .file-link:hover {
            color: #764ba2;
            gap: 8px;
        }

        .no-results {
            text-align: center;
            padding: 60px 20px;
            color: white;
            font-size: 1.2rem;
        }

        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }

        @keyframes fadeInDown {
            from {
                opacity: 0;
                transform: translateY(-20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        @media (max-width: 768px) {
            h1 {
                font-size: 2rem;
            }

            .songs-grid {
                grid-template-columns: 1fr;
            }

            .tabs {
                flex-direction: column;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>🎹 Thư Viện Nhạc Piano</h1>
            <p class="subtitle">Bộ sưu tập sheet nhạc của bạn</p>
            <div class="stats">
                <div class="stat-card">
                    <span class="stat-number" id="totalSongs">0</span>
                    <span>Bài hát</span>
                </div>
                <div class="stat-card">
                    <span class="stat-number" id="totalFiles">0</span>
                    <span>Files</span>
                </div>
            </div>
        </header>

        <div class="search-box">
            <input type="text" class="search-input" id="searchInput" placeholder="🔍 Tìm kiếm bài hát...">
        </div>

        <div class="tabs">
            <button class="tab active" data-category="all">Tất cả</button>
            <button class="tab" data-category="printed">Đã in</button>
            <button class="tab" data-category="not print">Chưa in</button>
        </div>

        <div class="songs-grid" id="songsGrid"></div>
        <div class="no-results" id="noResults" style="display: none;">
            Không tìm thấy bài hát nào 😢
        </div>
    </div>

    <script>
        const songsData = ${JSON.stringify(data, null, 8)};
        
        let currentCategory = 'all';
        let searchQuery = '';

        function updateStats() {
            const totalSongs = (songsData['printed']?.length || 0) + (songsData['not print']?.length || 0);
            let totalFiles = 0;

            ['printed', 'not print'].forEach(category => {
                songsData[category]?.forEach(song => {
                    Object.values(song.difficulties).forEach(difficulty => {
                        Object.values(difficulty).forEach(files => {
                            totalFiles += files.length;
                        });
                    });
                });
            });

            document.getElementById('totalSongs').textContent = totalSongs;
            document.getElementById('totalFiles').textContent = totalFiles;
        }

        function renderSongs() {
            const grid = document.getElementById('songsGrid');
            const noResults = document.getElementById('noResults');
            grid.innerHTML = '';

            let songs = [];
            if (currentCategory === 'all') {
                songs = [...(songsData['printed'] || []), ...(songsData['not print'] || [])];
            } else {
                songs = songsData[currentCategory] || [];
            }

            if (searchQuery) {
                songs = songs.filter(song => 
                    song.name.toLowerCase().includes(searchQuery.toLowerCase())
                );
            }

            if (songs.length === 0) {
                grid.style.display = 'none';
                noResults.style.display = 'block';
                return;
            }

            grid.style.display = 'grid';
            noResults.style.display = 'none';

            songs.forEach(song => {
                const card = createSongCard(song);
                grid.appendChild(card);
            });
        }

        function createSongCard(song) {
            const card = document.createElement('div');
            card.className = 'song-card';

            let detailsHTML = '';
            Object.entries(song.difficulties).forEach(([difficulty, types]) => {
                Object.entries(types).forEach(([type, files]) => {
                    files.forEach(file => {
                        const typeClass = type.toLowerCase().includes('chord') ? 'type-chord' : 
                                        type.toLowerCase() === 'midi' ? 'type-midi' : 'type-piano';
                        detailsHTML += \`
                            <div class="detail-row">
                                <span class="badge difficulty">\${difficulty}</span>
                                <span class="badge \${typeClass}">\${type}</span>
                                <a href="\${file.path}" class="file-link" target="_blank">
                                    📄 \${file.name}
                                </a>
                            </div>
                        \`;
                    });
                });
            });

            card.innerHTML = \`
                <div class="song-title">
                    <div class="song-icon">🎵</div>
                    <span>\${song.name}</span>
                </div>
                <div class="song-details">
                    \${detailsHTML}
                </div>
            \`;

            return card;
        }

        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                currentCategory = tab.dataset.category;
                renderSongs();
            });
        });

        document.getElementById('searchInput').addEventListener('input', (e) => {
            searchQuery = e.target.value;
            renderSongs();
        });

        updateStats();
        renderSongs();
    </script>
</body>
</html>`;

    return htmlTemplate;
}

const baseDir = __dirname;
const data = scanFolders(baseDir);
const html = generateHTML(data);

fs.writeFileSync('index.html', html, 'utf8');
console.log('✅ Đã tạo file index.html với dữ liệu nhúng trực tiếp');
console.log(`📊 Tổng số bài hát: ${data['not print'].length + data['printed'].length}`);

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
    <title>🎹 Thư Viện Nhạc Piano</title>
    <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🎹</text></svg>">
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

        .main-content {
            display: grid;
            grid-template-columns: 280px 1fr;
            gap: 30px;
            animation: fadeIn 1.2s ease;
        }

        .filters-sidebar {
            background: rgba(255,255,255,0.15);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            padding: 25px;
            height: fit-content;
            position: sticky;
            top: 20px;
        }

        .filters-section {
            animation: fadeIn 1s ease;
        }

        .filter-group {
            margin-bottom: 25px;
        }

        .filter-label {
            color: white;
            font-weight: 600;
            font-size: 0.95rem;
            margin-bottom: 12px;
            display: block;
        }

        .filter-buttons {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }

        .filter-btn {
            padding: 10px 16px;
            border: 2px solid rgba(255,255,255,0.3);
            background: rgba(255,255,255,0.1);
            backdrop-filter: blur(10px);
            border-radius: 10px;
            color: white;
            font-family: 'Inter', sans-serif;
            font-size: 0.9rem;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.3s ease;
            text-align: left;
        }

        .filter-btn:hover {
            background: rgba(255,255,255,0.2);
            border-color: rgba(255,255,255,0.5);
            transform: translateX(5px);
        }

        .filter-btn.active {
            background: white;
            color: #667eea;
            border-color: white;
            box-shadow: 0 5px 20px rgba(0,0,0,0.2);
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

            .main-content {
                grid-template-columns: 1fr;
            }

            .filters-sidebar {
                position: static;
            }

            .songs-grid {
                grid-template-columns: 1fr;
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

        <div class="main-content">
            <aside class="filters-sidebar">
                <div class="filters-section">
                    <div class="filter-group">
                        <span class="filter-label">📂 Trạng thái in</span>
                        <div class="filter-buttons">
                            <button class="filter-btn active" data-filter="print" data-value="all">Tất cả</button>
                            <button class="filter-btn" data-filter="print" data-value="printed">Đã in</button>
                            <button class="filter-btn" data-filter="print" data-value="not print">Chưa in</button>
                        </div>
                    </div>

                    <div class="filter-group">
                        <span class="filter-label">🎹 Loại</span>
                        <div class="filter-buttons">
                            <button class="filter-btn active" data-filter="type" data-value="all">Tất cả</button>
                            <button class="filter-btn" data-filter="type" data-value="piano">Piano</button>
                            <button class="filter-btn" data-filter="type" data-value="midi">MIDI</button>
                            <button class="filter-btn" data-filter="type" data-value="chord">Chord</button>
                        </div>
                    </div>

                    <div class="filter-group">
                        <span class="filter-label">⭐ Độ khó</span>
                        <div class="filter-buttons">
                            <button class="filter-btn active" data-filter="difficulty" data-value="all">Tất cả</button>
                            <button class="filter-btn" data-filter="difficulty" data-value="Easy">Easy</button>
                            <button class="filter-btn" data-filter="difficulty" data-value="Medium">Medium</button>
                            <button class="filter-btn" data-filter="difficulty" data-value="Hard">Hard</button>
                        </div>
                    </div>

                    <div class="filter-group">
                        <span class="filter-label">🔤 Sắp xếp</span>
                        <div class="filter-buttons">
                            <button class="filter-btn active" data-filter="sort" data-value="name-asc">A → Z</button>
                            <button class="filter-btn" data-filter="sort" data-value="name-desc">Z → A</button>
                        </div>
                    </div>
                </div>
            </aside>

            <div class="content-area">
                <div class="songs-grid" id="songsGrid"></div>
                <div class="no-results" id="noResults" style="display: none;">
                    Không tìm thấy bài hát nào 😢
                </div>
            </div>
        </div>
    </div>

    <script>
        const songsData = ${JSON.stringify(data, null, 8)};
        
        let filters = {
            print: 'all',
            type: 'all',
            difficulty: 'all',
            sort: 'name-asc'
        };
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
            
            // Filter by print status
            if (filters.print === 'all') {
                songs = [...(songsData['printed'] || []), ...(songsData['not print'] || [])];
            } else {
                songs = songsData[filters.print] || [];
            }

            // Filter by search
            if (searchQuery) {
                songs = songs.filter(song => 
                    song.name.toLowerCase().includes(searchQuery.toLowerCase())
                );
            }

            // Filter by type
            if (filters.type !== 'all') {
                songs = songs.filter(song => {
                    return Object.values(song.difficulties).some(difficulty => {
                        return Object.keys(difficulty).some(type => {
                            if (filters.type === 'piano') return type.toLowerCase() === 'piano';
                            if (filters.type === 'midi') return type.toLowerCase() === 'midi';
                            if (filters.type === 'chord') return type.toLowerCase().includes('chord');
                            return false;
                        });
                    });
                });
            }

            // Filter by difficulty
            if (filters.difficulty !== 'all') {
                songs = songs.filter(song => {
                    return Object.keys(song.difficulties).includes(filters.difficulty);
                });
            }

            // Sort
            if (filters.sort === 'name-asc') {
                songs.sort((a, b) => a.name.localeCompare(b.name, 'vi'));
            } else if (filters.sort === 'name-desc') {
                songs.sort((a, b) => b.name.localeCompare(a.name, 'vi'));
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

        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const filterType = btn.dataset.filter;
                const filterValue = btn.dataset.value;
                
                // Remove active class from siblings
                btn.parentElement.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // Update filter
                filters[filterType] = filterValue;
                renderSongs();
            });
        });

        // Search
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

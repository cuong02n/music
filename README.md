# 🎹 Piano Library - React App

[![Deploy to GitHub Pages](https://github.com/cuong02n/music/actions/workflows/update-library.yml/badge.svg)](https://github.com/cuong02n/music/actions/workflows/update-library.yml)

Thư viện sheet nhạc piano với giao diện React hiện đại, hỗ trợ tìm kiếm, lọc và quản lý bài hát.

## ✨ Tính Năng

- 🔍 **Tìm kiếm không dấu** - Tìm bài hát tiếng Việt dễ dàng
- 🎯 **Lọc đa tiêu chí** - Theo trạng thái in, độ khó, loại file
- 📊 **Sắp xếp** - A-Z hoặc Z-A
- ➕ **Thêm bài hát** - UI dialog với upload file (local dev)
- 📱 **Responsive** - Hiển thị đẹp trên mọi thiết bị
- 🚀 **Auto-deploy** - GitHub Actions tự động deploy

## 🛠️ Tech Stack

- **Frontend**: React 18 + Vite
- **UI**: Material-UI (MUI)
- **Styling**: CSS Modules
- **Backend** (local only): Express + Multer
- **Deployment**: GitHub Pages

## 📦 Cài Đặt

```bash
# Clone repo
git clone <your-repo-url>
cd sheet

# Install dependencies
npm install
```

## 🚀 Development

### Chạy Local (Full Stack)

```bash
# Chạy cả frontend + backend
npm run dev:full
```

Mở trình duyệt: http://localhost:5173

- **Frontend**: Vite dev server (port 5173)
- **Backend**: Express API (port 3001)

### Chỉ Chạy Frontend

```bash
npm run dev
```

> **Lưu ý**: Khi chỉ chạy frontend, app sẽ tự động dùng `songs.json` tĩnh (fallback).

## 📁 Cấu Trúc Thư Mục

```
sheet/
├── public/
│   ├── piano/              # Thư mục chứa file PDF
│   │   ├── printed/        # Bài đã in
│   │   └── not print/      # Bài chưa in
│   └── favicon.png
├── src/
│   ├── components/         # React components
│   │   ├── Header.jsx
│   │   ├── FilterSidebar.jsx
│   │   ├── SongGrid.jsx
│   │   ├── SongCard.jsx
│   │   └── AddSongDialog.jsx
│   ├── data/
│   │   └── songs.json      # Data file (auto-generated)
│   ├── App.jsx             # Main app
│   └── main.jsx
├── server.cjs              # Express server (local dev)
├── generate_data.cjs       # Script tạo songs.json
└── vite.config.js
```

## 📝 Thêm Bài Hát Mới

### Cách 1: Dùng UI (Local Dev)

1. Chạy `npm run dev:full`
2. Click nút **"Thêm bài hát mới"**
3. Điền thông tin và upload file PDF
4. File tự động lưu vào đúng thư mục

### Cách 2: Thủ Công

1. Copy file PDF vào thư mục:
   ```
   public/piano/{printStatus}/{songName}/{difficulty}/{type}/
   ```

2. Regenerate data:
   ```bash
   node generate_data.cjs
   ```

**Cấu trúc thư mục:**
- `{printStatus}`: `printed` hoặc `not print`
- `{songName}`: Tên bài hát
- `{difficulty}`: `Easy`, `Medium`, hoặc `Hard`
- `{type}`: `Piano`, `Chord`, hoặc `MIDI`

**Ví dụ:**
```
public/piano/not print/Canon in D/Easy/Piano/Canon in D.pdf
```

## 🌐 Deployment

### GitHub Pages (Tự Động)

1. **Cấu hình base path** trong `vite.config.js`:
   ```javascript
   base: command === 'build' ? '/your-repo-name/' : '/'
   ```

2. **Push lên GitHub**:
   ```bash
   git add .
   git commit -m "Update library"
   git push origin master
   ```

3. **GitHub Actions tự động**:
   - Chạy `generate_data.cjs`
   - Build React app
   - Deploy lên GitHub Pages

### Build Local

```bash
# Build production
npm run build

# Preview build
npm run preview
```

Build output: `dist/`

## 🔧 Scripts

| Script | Mô tả |
|--------|-------|
| `npm run dev` | Chạy Vite dev server |
| `npm run server` | Chạy Express backend |
| `npm run dev:full` | Chạy cả frontend + backend |
| `npm run build` | Build production |
| `npm run preview` | Preview production build |

## 📊 Data Format

File `src/data/songs.json`:

```json
{
  "printed": [
    {
      "name": "Canon in D",
      "difficulties": {
        "Easy": {
          "Piano": [
            {
              "name": "Canon in D.pdf",
              "path": "/piano/printed/Canon in D/Easy/Piano/Canon in D.pdf"
            }
          ]
        }
      }
    }
  ],
  "not print": [...]
}
```

## 🎨 Tính Năng Nổi Bật

### Fallback Mechanism

App tự động chọn data source:
- **Local dev**: Fetch từ API (http://localhost:3001/api/songs)
- **Production**: Dùng `songs.json` tĩnh

### Responsive Layout

- **Desktop**: 4 cột
- **Tablet**: 3 cột
- **Mobile**: 1-2 cột

### Search & Filter

- Tìm kiếm không dấu tiếng Việt
- Lọc theo: trạng thái in, độ khó, loại file
- Sắp xếp A-Z hoặc Z-A

## 🐛 Troubleshooting

### Port đã được sử dụng

```bash
# Kill port 5173
Get-Process -Id (Get-NetTCPConnection -LocalPort 5173).OwningProcess | Stop-Process -Force

# Kill port 3001
Get-Process -Id (Get-NetTCPConnection -LocalPort 3001).OwningProcess | Stop-Process -Force
```

### Không thấy bài hát

1. Kiểm tra `songs.json` đã được generate chưa
2. Chạy `node generate_data.cjs`
3. Restart dev server

### GitHub Pages không hoạt động

1. Kiểm tra `base` path trong `vite.config.js`
2. Đảm bảo GitHub Pages đã enable trong repo settings
3. Kiểm tra GitHub Actions logs

## 📄 License

MIT License - Xem file [LICENSE](LICENSE)

## 🤝 Contributing

Pull requests are welcome!

---

**Made with ❤️ using React + Vite**

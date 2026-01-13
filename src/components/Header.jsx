import { Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import './Header.css';

function Header({ stats, searchQuery, onSearchChange, onAddClick }) {
    return (
        <header className="header">
            <h1>🎹 Thư Viện Nhạc Piano</h1>
            <p className="subtitle">Bộ sưu tập sheet nhạc của bạn</p>

            <div className="stats">
                <div className="stat-card">
                    <span className="stat-number">{stats.totalSongs}</span>
                    <span>Bài hát</span>
                </div>
                <div className="stat-card">
                    <span className="stat-number">{stats.totalFiles}</span>
                    <span>Files</span>
                </div>
            </div>

            <div className="search-box">
                <input
                    type="text"
                    className="search-input"
                    placeholder="🔍 Tìm kiếm bài hát..."
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                />
            </div>

            <div style={{ marginTop: '20px' }}>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={onAddClick}
                    size="large"
                    sx={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        padding: '12px 30px',
                        fontSize: '1.1rem',
                        borderRadius: '15px',
                        textTransform: 'none',
                        boxShadow: '0 8px 25px rgba(102, 126, 234, 0.4)',
                        '&:hover': {
                            background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                            boxShadow: '0 12px 35px rgba(102, 126, 234, 0.5)',
                            transform: 'translateY(-2px)'
                        }
                    }}
                >
                    Thêm bài hát mới
                </Button>
            </div>
        </header>
    );
}

export default Header;

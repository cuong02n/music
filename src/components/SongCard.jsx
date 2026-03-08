import { useState } from 'react';
import './SongCard.css';

function SongCard({ song, onTogglePrint }) {
    const [toggling, setToggling] = useState(false);

    const isPrinted = song.category === 'printed';

    const handleToggle = async () => {
        if (!onTogglePrint || toggling) return;
        setToggling(true);
        await onTogglePrint(song.name, song.category);
        setToggling(false);
    };

    return (
        <div className="song-card">
            <div className="song-title">
                <div className="song-icon">🎵</div>
                <span>{song.name}</span>
            </div>

            <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className={`badge ${isPrinted ? 'badge-printed' : 'badge-not-printed'}`}>
                    {isPrinted ? 'Đã in' : 'Chưa in'}
                </span>
                {onTogglePrint && (
                    <button
                        className="toggle-print-btn"
                        onClick={handleToggle}
                        disabled={toggling}
                        title={isPrinted ? 'Đánh dấu chưa in' : 'Đánh dấu đã in'}
                    >
                        {toggling ? '⏳' : isPrinted ? '↩ Chưa in' : '✔ Đã in'}
                    </button>
                )}
            </div>

            <div className="song-details">
                {Object.entries(song.difficulties).map(([difficulty, types]) =>
                    Object.entries(types).map(([type, files]) =>
                        files.map((file, index) => {
                            const typeClass = type.toLowerCase().includes('chord')
                                ? 'type-chord'
                                : type.toLowerCase() === 'midi'
                                    ? 'type-midi'
                                    : 'type-piano';

                            return (
                                <div key={`${difficulty}-${type}-${index}`} className="detail-row">
                                    <span className="badge difficulty">{difficulty}</span>
                                    <span className={`badge ${typeClass}`}>{type}</span>
                                    <a href={file.path} className="file-link" target="_blank" rel="noopener noreferrer">
                                        📄 {file.name}
                                    </a>
                                </div>
                            );
                        })
                    )
                )}
            </div>
        </div>
    );
}

export default SongCard;

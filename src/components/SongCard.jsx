import './SongCard.css';

function SongCard({ song }) {
    const printBadge = song.category === 'printed' ? (
        <span className="badge badge-printed">Đã in</span>
    ) : (
        <span className="badge badge-not-printed">Chưa in</span>
    );

    return (
        <div className="song-card">
            <div className="song-title">
                <div className="song-icon">🎵</div>
                <span>{song.name}</span>
            </div>

            <div style={{ marginTop: '10px' }}>
                {printBadge}
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

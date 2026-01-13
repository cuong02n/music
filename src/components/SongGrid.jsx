import SongCard from './SongCard';
import './SongGrid.css';

function SongGrid({ songs }) {
    if (songs.length === 0) {
        return (
            <div className="no-results">
                Không tìm thấy bài hát nào 😢
            </div>
        );
    }

    return (
        <div className="songs-grid">
            {songs.map((song, index) => (
                <SongCard key={`${song.name}-${index}`} song={song} />
            ))}
        </div>
    );
}

export default SongGrid;

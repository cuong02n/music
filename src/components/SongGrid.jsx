import SongCard from './SongCard';
import './SongGrid.css';

function SongGrid({ songs, onDelete, onEdit, showMidi, difficulty }) {
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
                <SongCard key={`${song.name}-${index}`} song={song} onDelete={onDelete} onEdit={onEdit} showMidi={showMidi} difficulty={difficulty} />
            ))}
        </div>
    );
}

export default SongGrid;


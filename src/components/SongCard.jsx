import { useState } from 'react';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import './SongCard.css';

function SongCard({ song, onDelete, onEdit, showMidi, difficulty }) {
    const [confirming, setConfirming] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const handleDeleteClick = () => setConfirming(true);
    const handleCancel = () => setConfirming(false);

    const handleConfirmDelete = async () => {
        if (!onDelete || deleting) return;
        setDeleting(true);
        await onDelete(song.name);
        setDeleting(false);
        setConfirming(false);
    };

    return (
        <div className="song-card">
            <div className="song-card-header">
                <div className="song-title">
                    <div className="song-icon">🎵</div>
                    <span>{song.name}</span>
                </div>
                <div className="song-card-actions">
                    {onEdit && (
                        <button
                            className="edit-btn"
                            onClick={() => onEdit(song)}
                            title="Chỉnh sửa bài hát"
                        >
                            <EditIcon sx={{ fontSize: '1rem' }} />
                        </button>
                    )}
                    {onDelete && (
                        <button
                            className="delete-btn"
                            onClick={handleDeleteClick}
                            title="Xóa bài hát"
                            disabled={deleting}
                        >
                            <DeleteOutlineIcon sx={{ fontSize: '1rem' }} />
                        </button>
                    )}
                </div>
            </div>

            {confirming && (
                <div className="delete-confirm">
                    <p>Xóa <strong>"{song.name}"</strong>?<br /><span>Thao tác này không thể hoàn tác.</span></p>
                    <div className="delete-confirm-actions">
                        <button className="confirm-cancel-btn" onClick={handleCancel}>Hủy</button>
                        <button className="confirm-delete-btn" onClick={handleConfirmDelete} disabled={deleting}>
                            {deleting ? '⏳ Đang xóa...' : '❌ Xóa'}
                        </button>
                    </div>
                </div>
            )}

            <div className="song-details">
                {Object.entries(song.difficulties).map(([diff, types]) => {
                    // Ẩn cả nhóm difficulty nếu không khớp với filter
                    if (difficulty !== 'all' && diff !== difficulty) return null;

                    return Object.entries(types).map(([type, files]) => {
                        // Ẩn MIDI nếu showMidi = false
                        if (!showMidi && type.toLowerCase() === 'midi') return null;

                        const typeClass = type.toLowerCase().includes('chord')
                            ? 'type-chord'
                            : type.toLowerCase() === 'midi'
                                ? 'type-midi'
                                : 'type-piano';

                        return files.map((file, index) => (
                            <div key={`${diff}-${type}-${index}`} className="detail-row">
                                <span className="badge difficulty">{diff}</span>
                                <span className={`badge ${typeClass}`}>{type}</span>
                                <a href={file.path} className="file-link" target="_blank" rel="noopener noreferrer">
                                    📄 {file.name}
                                </a>
                            </div>
                        ));
                    });
                })}
            </div>
        </div>
    );
}

export default SongCard;

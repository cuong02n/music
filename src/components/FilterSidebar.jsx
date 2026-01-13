import './FilterSidebar.css';

function FilterSidebar({ filters, onFilterChange }) {
    const handleFilterClick = (filterType, value) => {
        onFilterChange({
            ...filters,
            [filterType]: value
        });
    };

    return (
        <aside className="filters-sidebar">
            <div className="filters-section">
                <div className="filter-group">
                    <span className="filter-label">📂 Trạng thái in</span>
                    <div className="filter-buttons">
                        <button
                            className={`filter-btn ${filters.print === 'all' ? 'active' : ''}`}
                            onClick={() => handleFilterClick('print', 'all')}
                        >
                            Tất cả
                        </button>
                        <button
                            className={`filter-btn ${filters.print === 'printed' ? 'active' : ''}`}
                            onClick={() => handleFilterClick('print', 'printed')}
                        >
                            Đã in
                        </button>
                        <button
                            className={`filter-btn ${filters.print === 'not print' ? 'active' : ''}`}
                            onClick={() => handleFilterClick('print', 'not print')}
                        >
                            Chưa in
                        </button>
                    </div>
                </div>

                <div className="filter-group">
                    <span className="filter-label">🎹 Loại</span>
                    <div className="filter-buttons">
                        <button
                            className={`filter-btn ${filters.type === 'all' ? 'active' : ''}`}
                            onClick={() => handleFilterClick('type', 'all')}
                        >
                            Tất cả
                        </button>
                        <button
                            className={`filter-btn ${filters.type === 'piano' ? 'active' : ''}`}
                            onClick={() => handleFilterClick('type', 'piano')}
                        >
                            Piano
                        </button>
                        <button
                            className={`filter-btn ${filters.type === 'midi' ? 'active' : ''}`}
                            onClick={() => handleFilterClick('type', 'midi')}
                        >
                            MIDI
                        </button>
                        <button
                            className={`filter-btn ${filters.type === 'chord' ? 'active' : ''}`}
                            onClick={() => handleFilterClick('type', 'chord')}
                        >
                            Chord
                        </button>
                    </div>
                </div>

                <div className="filter-group">
                    <span className="filter-label">⭐ Độ khó</span>
                    <div className="filter-buttons">
                        <button
                            className={`filter-btn ${filters.difficulty === 'all' ? 'active' : ''}`}
                            onClick={() => handleFilterClick('difficulty', 'all')}
                        >
                            Tất cả
                        </button>
                        <button
                            className={`filter-btn ${filters.difficulty === 'Easy' ? 'active' : ''}`}
                            onClick={() => handleFilterClick('difficulty', 'Easy')}
                        >
                            Easy
                        </button>
                        <button
                            className={`filter-btn ${filters.difficulty === 'Medium' ? 'active' : ''}`}
                            onClick={() => handleFilterClick('difficulty', 'Medium')}
                        >
                            Medium
                        </button>
                        <button
                            className={`filter-btn ${filters.difficulty === 'Hard' ? 'active' : ''}`}
                            onClick={() => handleFilterClick('difficulty', 'Hard')}
                        >
                            Hard
                        </button>
                    </div>
                </div>

                <div className="filter-group">
                    <span className="filter-label">🔤 Sắp xếp</span>
                    <div className="filter-buttons">
                        <button
                            className={`filter-btn ${filters.sort === 'name-asc' ? 'active' : ''}`}
                            onClick={() => handleFilterClick('sort', 'name-asc')}
                        >
                            A → Z
                        </button>
                        <button
                            className={`filter-btn ${filters.sort === 'name-desc' ? 'active' : ''}`}
                            onClick={() => handleFilterClick('sort', 'name-desc')}
                        >
                            Z → A
                        </button>
                    </div>
                </div>
            </div>
        </aside>
    );
}

export default FilterSidebar;

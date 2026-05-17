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
                    <span className="filter-label">🎹 Loại file</span>
                    <label className="toggle-checkbox">
                        <input
                            type="checkbox"
                            checked={filters.showMidi}
                            onChange={e => onFilterChange({ ...filters, showMidi: e.target.checked })}
                        />
                        <span className="toggle-track">
                            <span className="toggle-thumb" />
                        </span>
                        <span className="toggle-text">
                            {filters.showMidi ? 'Hiển thị MIDI' : 'Ẩn MIDI'}
                        </span>
                    </label>
                </div>

                <div className="filter-group">
                    <span className="filter-label">⭐ Độ khó</span>
                    <div className="filter-radio-list">
                        {[
                            { value: 'all',    label: 'Tất cả' },
                            { value: 'Easy',   label: 'Easy' },
                            { value: 'Medium', label: 'Medium' },
                            { value: 'Hard',   label: 'Hard' },
                        ].map(({ value, label }) => {
                            const active = filters.difficulty === value;
                            return (
                                <button
                                    key={value}
                                    className={`filter-radio-item ${active ? 'active' : ''}`}
                                    onClick={() => handleFilterClick('difficulty', value)}
                                >
                                    <span className="filter-radio-tick">{active ? '✓' : ''}</span>
                                    <span>{label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="filter-group">
                    <span className="filter-label">🔤 Sắp xếp</span>
                    <div className="filter-buttons">
                        <button
                            className={`filter-btn ${filters.sort === 'date-new' ? 'active' : ''}`}
                            onClick={() => handleFilterClick('sort', 'date-new')}
                        >
                            🕐 Mới nhất
                        </button>
                        <button
                            className={`filter-btn ${filters.sort === 'date-old' ? 'active' : ''}`}
                            onClick={() => handleFilterClick('sort', 'date-old')}
                        >
                            🕰 Cũ nhất
                        </button>
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

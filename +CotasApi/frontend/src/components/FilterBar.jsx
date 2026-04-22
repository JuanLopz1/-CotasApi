import { categoryOptions, postTypeOptions, statusOptions } from "../api/petPostsApi";

function FilterBar({ filters, onFilterChange, onClearFilters, showStatusFilters = false }) {
  return (
    <section className="filters-shell" aria-labelledby="filters-heading">
      <div className="section-head">
        <h2 id="filters-heading">Browse Pets</h2>
        <button
          type="button"
          className="secondary-button secondary-button--compact"
          onClick={onClearFilters}
        >
          Clear filters
        </button>
      </div>

      <label className="search-input">
        <span className="sr-only">Search posts</span>
        <input
          type="text"
          placeholder="Search pets..."
          value={filters.search}
          onChange={(event) => onFilterChange("search", event.target.value)}
        />
      </label>

      <div className="chip-row">
        {categoryOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            className={`chip ${filters.category === option.value ? "chip-active" : ""}`}
            onClick={() => onFilterChange("category", option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="chip-row">
        <button
          type="button"
          className={`chip ${filters.postType === "" ? "chip-active" : ""}`}
          onClick={() => onFilterChange("postType", "")}
        >
          All post types
        </button>
        {postTypeOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            className={`chip ${String(option.value) === filters.postType ? "chip-active" : ""}`}
            onClick={() => onFilterChange("postType", String(option.value))}
          >
            {option.label}
          </button>
        ))}
      </div>

      {showStatusFilters ? (
        <div className="chip-row">
          <button
            type="button"
            className={`chip ${filters.status === "" ? "chip-active" : ""}`}
            onClick={() => onFilterChange("status", "")}
          >
            All statuses
          </button>
          {statusOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`chip ${String(option.value) === filters.status ? "chip-active" : ""}`}
              onClick={() => onFilterChange("status", String(option.value))}
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}

export default FilterBar;

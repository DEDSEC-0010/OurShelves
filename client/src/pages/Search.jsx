import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import BookCard from '../components/BookCard';
import BookMap from '../components/BookMap';
import { Search as SearchIcon, MapPin, Filter, BookOpen, X, Map, Grid } from 'lucide-react';
import './Search.css';

function Search() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'map'

    const [query, setQuery] = useState(searchParams.get('q') || '');
    const [radius, setRadius] = useState(searchParams.get('radius') || '10');
    const [condition, setCondition] = useState(searchParams.get('condition') || '');
    const [listingType, setListingType] = useState(searchParams.get('listing_type') || '');
    const [location, setLocation] = useState({
        latitude: parseFloat(searchParams.get('lat')) || null,
        longitude: parseFloat(searchParams.get('lng')) || null,
    });
    const [gettingLocation, setGettingLocation] = useState(false);

    useEffect(() => {
        if (!location.latitude && !location.longitude) {
            getLocation();
        }
    }, []);

    useEffect(() => {
        if (location.latitude && location.longitude) {
            searchBooks();
        }
    }, [location]);

    const getLocation = () => {
        if (!navigator.geolocation) {
            setError('Geolocation is not supported by your browser');
            return;
        }

        setGettingLocation(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocation({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                });
                setGettingLocation(false);
            },
            (err) => {
                setError('Unable to get your location. Please enable location services.');
                setGettingLocation(false);
            }
        );
    };

    const searchBooks = async () => {
        if (!location.latitude || !location.longitude) {
            return;
        }

        setLoading(true);
        setError('');

        try {
            const params = {
                q: query || undefined,
                latitude: location.latitude,
                longitude: location.longitude,
                radius,
                condition: condition || undefined,
                listing_type: listingType || undefined,
            };

            const data = await api.searchBooks(params);
            setBooks(data.books);

            const newParams = new URLSearchParams();
            if (query) newParams.set('q', query);
            newParams.set('lat', location.latitude.toString());
            newParams.set('lng', location.longitude.toString());
            newParams.set('radius', radius);
            if (condition) newParams.set('condition', condition);
            if (listingType) newParams.set('listing_type', listingType);
            setSearchParams(newParams);
        } catch (err) {
            setError('Failed to search books. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        searchBooks();
    };

    const clearFilters = () => {
        setCondition('');
        setListingType('');
        setRadius('10');
    };

    return (
        <div className="search-page page">
            <div className="container">
                <header className="search-header">
                    <h1>Find Books Nearby</h1>
                    <p>Discover books available in your neighborhood</p>
                </header>

                <form onSubmit={handleSearch} className="search-form">
                    <div className="search-bar">
                        <SearchIcon size={20} className="search-bar-icon" />
                        <input
                            type="text"
                            placeholder="Search by title, author, or ISBN..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="search-bar-input"
                        />
                        <button type="submit" className="btn btn-primary">
                            Search
                        </button>
                    </div>

                    <div className="search-controls">
                        <div className="search-location">
                            <MapPin size={16} />
                            {location.latitude ? (
                                <span className="text-sm">Location detected</span>
                            ) : (
                                <button
                                    type="button"
                                    className="btn btn-ghost btn-sm"
                                    onClick={getLocation}
                                    disabled={gettingLocation}
                                >
                                    {gettingLocation ? 'Getting location...' : 'Enable Location'}
                                </button>
                            )}
                        </div>

                        <div className="search-controls-right">
                            {/* View Mode Toggle */}
                            <div className="view-toggle">
                                <button
                                    type="button"
                                    className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
                                    onClick={() => setViewMode('grid')}
                                    aria-label="Grid view"
                                >
                                    <Grid size={16} />
                                </button>
                                <button
                                    type="button"
                                    className={`view-toggle-btn ${viewMode === 'map' ? 'active' : ''}`}
                                    onClick={() => setViewMode('map')}
                                    aria-label="Map view"
                                >
                                    <Map size={16} />
                                </button>
                            </div>

                            <button
                                type="button"
                                className="btn btn-ghost btn-sm"
                                onClick={() => setShowFilters(!showFilters)}
                            >
                                <Filter size={16} />
                                Filters
                                {(condition || listingType) && (
                                    <span className="filter-count">
                                        {[condition, listingType].filter(Boolean).length}
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>

                    {showFilters && (
                        <div className="search-filters card">
                            <div className="filters-grid">
                                <div className="form-group">
                                    <label className="form-label">Distance</label>
                                    <select
                                        className="form-select"
                                        value={radius}
                                        onChange={(e) => setRadius(e.target.value)}
                                    >
                                        <option value="5">Within 5 miles</option>
                                        <option value="10">Within 10 miles</option>
                                        <option value="20">Within 20 miles</option>
                                        <option value="50">Within 50 miles</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Condition</label>
                                    <select
                                        className="form-select"
                                        value={condition}
                                        onChange={(e) => setCondition(e.target.value)}
                                    >
                                        <option value="">Any Condition</option>
                                        <option value="New">New</option>
                                        <option value="Good">Good</option>
                                        <option value="Acceptable">Acceptable</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Type</label>
                                    <select
                                        className="form-select"
                                        value={listingType}
                                        onChange={(e) => setListingType(e.target.value)}
                                    >
                                        <option value="">All Types</option>
                                        <option value="Lend">Lending Only</option>
                                        <option value="Exchange">Exchange Only</option>
                                    </select>
                                </div>
                            </div>

                            <div className="filters-actions">
                                <button type="button" className="btn btn-ghost btn-sm" onClick={clearFilters}>
                                    <X size={14} />
                                    Clear Filters
                                </button>
                                <button type="submit" className="btn btn-primary btn-sm">
                                    Apply Filters
                                </button>
                            </div>
                        </div>
                    )}
                </form>

                {error && (
                    <div className="alert alert-error">
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="search-loading">
                        <div className="spinner"></div>
                        <p>Searching for books...</p>
                    </div>
                ) : books.length > 0 ? (
                    <>
                        <p className="search-results-count">
                            Found {books.length} book{books.length !== 1 ? 's' : ''} near you
                        </p>

                        {viewMode === 'map' ? (
                            <BookMap
                                books={books}
                                userLocation={location}
                                radius={parseInt(radius)}
                            />
                        ) : (
                            <div className="books-grid">
                                {books.map((book) => (
                                    <BookCard key={book.id} book={book} />
                                ))}
                            </div>
                        )}
                    </>
                ) : location.latitude ? (
                    <div className="empty-state">
                        <BookOpen size={64} className="empty-state-icon" />
                        <h3 className="empty-state-title">No books found</h3>
                        <p className="empty-state-description">
                            Try expanding your search radius or adjusting filters.
                            Be the first to share a book in your area!
                        </p>
                    </div>
                ) : (
                    <div className="empty-state">
                        <MapPin size={64} className="empty-state-icon" />
                        <h3 className="empty-state-title">Enable location to search</h3>
                        <p className="empty-state-description">
                            We need your location to find books near you. Click the button above to enable.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Search;

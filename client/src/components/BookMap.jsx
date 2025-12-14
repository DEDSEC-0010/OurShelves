import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Star, BookOpen } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './BookMap.css';

// Fix for default marker icons in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom book icon
const bookIcon = new L.DivIcon({
    className: 'book-marker',
    html: `<div class="book-marker-inner">📚</div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
});

// User location icon
const userIcon = new L.DivIcon({
    className: 'user-marker',
    html: `<div class="user-marker-inner">📍</div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
});

// Component to update map center when location changes
function ChangeView({ center, zoom }) {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.setView(center, zoom);
        }
    }, [center, zoom, map]);
    return null;
}

function BookMap({ books, userLocation, radius = 10 }) {
    const center = userLocation
        ? [userLocation.latitude, userLocation.longitude]
        : [40.7128, -74.0060]; // Default to NYC

    const zoom = radius <= 5 ? 13 : radius <= 10 ? 12 : radius <= 20 ? 11 : 10;

    // Convert radius miles to meters for circle
    const radiusMeters = radius * 1609.34;

    return (
        <div className="book-map-container">
            <MapContainer
                center={center}
                zoom={zoom}
                className="book-map"
                scrollWheelZoom={true}
            >
                <ChangeView center={center} zoom={zoom} />

                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* User location marker and radius circle */}
                {userLocation && (
                    <>
                        <Circle
                            center={center}
                            radius={radiusMeters}
                            pathOptions={{
                                color: '#5B4636',
                                fillColor: '#5B4636',
                                fillOpacity: 0.1,
                                weight: 2,
                            }}
                        />
                        <Marker position={center} icon={userIcon}>
                            <Popup>
                                <div className="map-popup user-popup">
                                    <strong>Your Location</strong>
                                </div>
                            </Popup>
                        </Marker>
                    </>
                )}

                {/* Book markers */}
                {books.map((book) => (
                    book.latitude && book.longitude && (
                        <Marker
                            key={book.id}
                            position={[book.latitude, book.longitude]}
                            icon={bookIcon}
                        >
                            <Popup>
                                <div className="map-popup book-popup">
                                    <div className="popup-cover">
                                        {book.cover_url ? (
                                            <img src={book.cover_url} alt={book.title} />
                                        ) : (
                                            <div className="popup-cover-placeholder">
                                                <BookOpen size={20} />
                                            </div>
                                        )}
                                    </div>
                                    <div className="popup-info">
                                        <h4>{book.title}</h4>
                                        <p className="popup-author">{book.author || 'Unknown Author'}</p>
                                        <div className="popup-meta">
                                            <span className="popup-distance">{book.distance?.toFixed(1)} mi</span>
                                            {book.owner_rating > 0 && (
                                                <span className="popup-rating">
                                                    <Star size={12} fill="currentColor" />
                                                    {book.owner_rating.toFixed(1)}
                                                </span>
                                            )}
                                        </div>
                                        <Link to={`/books/${book.id}`} className="popup-link">
                                            View Details →
                                        </Link>
                                    </div>
                                </div>
                            </Popup>
                        </Marker>
                    )
                ))}
            </MapContainer>
        </div>
    );
}

export default BookMap;

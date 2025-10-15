from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
import requests

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///books.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

class Book(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    isbn = db.Column(db.String(13), unique=True, nullable=False)
    title = db.Column(db.String(200), nullable=False)
    author = db.Column(db.String(200), nullable=False)
    cover_art_url = db.Column(db.String(200), nullable=True)
    owner_id = db.Column(db.Integer, nullable=False)

@app.route('/lookup', methods=['GET'])
def lookup_book():
    isbn = request.args.get('isbn')
    if not isbn:
        return jsonify({'message': 'ISBN is required'}), 400

    google_books_api_url = f"https://www.googleapis.com/books/v1/volumes?q=isbn:{isbn}"
    response = requests.get(google_books_api_url)

    if response.status_code != 200:
        return jsonify({'message': 'Failed to fetch book data from Google Books API'}), 500

    data = response.json()
    if 'items' not in data or not data['items']:
        return jsonify({'message': 'Book not found for the given ISBN'}), 404

    book_info = data['items'][0]['volumeInfo']

    # Extract the required information, providing default values if a key is missing
    title = book_info.get('title', 'No Title Found')
    authors = book_info.get('authors', ['No Author Found'])
    publisher = book_info.get('publisher', 'No Publisher Found')
    cover_art_url = book_info.get('imageLinks', {}).get('thumbnail', None)

    return jsonify({
        'title': title,
        'author': ", ".join(authors),
        'publisher': publisher,
        'cover_art_url': cover_art_url
    })

@app.route('/books/add', methods=['POST'])
def add_book():
    data = request.get_json()
    required_fields = ['isbn', 'title', 'author', 'owner_id']
    if not all(field in data for field in required_fields):
        return jsonify({'message': 'Missing required fields'}), 400

    if Book.query.filter_by(isbn=data['isbn']).first():
        return jsonify({'message': 'Book with this ISBN already exists'}), 400

    new_book = Book(
        isbn=data['isbn'],
        title=data['title'],
        author=data['author'],
        cover_art_url=data.get('cover_art_url'),
        owner_id=data['owner_id']
    )
    db.session.add(new_book)
    db.session.commit()

    return jsonify({'message': 'Book added successfully', 'book_id': new_book.id}), 201

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True, port=5001)
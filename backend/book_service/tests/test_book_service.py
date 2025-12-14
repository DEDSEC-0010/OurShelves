import unittest
import json
from unittest.mock import patch
from backend.book_service.app import app, db, Book

class BookServiceTestCase(unittest.TestCase):
    def setUp(self):
        app.config['TESTING'] = True
        app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
        self.app = app.test_client()
        with app.app_context():
            db.create_all()

    def tearDown(self):
        with app.app_context():
            db.session.remove()
            db.drop_all()

    @patch('backend.book_service.app.requests.get')
    def test_lookup_book_success(self, mock_get):
        """Test successful book lookup by ISBN."""
        mock_response = {
            "items": [
                {
                    "volumeInfo": {
                        "title": "Test Book",
                        "authors": ["Test Author"],
                        "publisher": "Test Publisher",
                        "imageLinks": {"thumbnail": "http://example.com/cover.jpg"}
                    }
                }
            ]
        }
        mock_get.return_value.status_code = 200
        mock_get.return_value.json.return_value = mock_response

        response = self.app.get('/lookup?isbn=1234567890123')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(data['title'], 'Test Book')
        self.assertEqual(data['author'], 'Test Author')

    @patch('backend.book_service.app.requests.get')
    def test_lookup_book_not_found(self, mock_get):
        """Test book lookup when ISBN is not found."""
        mock_get.return_value.status_code = 200
        mock_get.return_value.json.return_value = {"items": []}

        response = self.app.get('/lookup?isbn=0000000000000')
        self.assertEqual(response.status_code, 404)
        self.assertIn('Book not found', str(response.data))

    def test_add_book_success(self):
        """Test successfully adding a new book."""
        book_data = {
            "isbn": "9876543210987",
            "title": "Another Test Book",
            "author": "Another Test Author",
            "owner_id": 1,
            "cover_art_url": "http://example.com/another_cover.jpg"
        }
        response = self.app.post('/books/add',
                                 data=json.dumps(book_data),
                                 content_type='application/json')
        self.assertEqual(response.status_code, 201)
        self.assertIn('Book added successfully', str(response.data))
        with app.app_context():
            book = Book.query.filter_by(isbn="9876543210987").first()
            self.assertIsNotNone(book)
            self.assertEqual(book.title, "Another Test Book")

    def test_add_book_duplicate_isbn(self):
        """Test adding a book with a duplicate ISBN."""
        book_data = {
            "isbn": "1112223334445",
            "title": "Duplicate Book",
            "author": "Duplicate Author",
            "owner_id": 2
        }
        # Add the book first
        self.app.post('/books/add',
                      data=json.dumps(book_data),
                      content_type='application/json')
        # Try to add it again
        response = self.app.post('/books/add',
                                 data=json.dumps(book_data),
                                 content_type='application/json')
        self.assertEqual(response.status_code, 400)
        self.assertIn('Book with this ISBN already exists', str(response.data))

if __name__ == '__main__':
    unittest.main()
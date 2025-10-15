import unittest
import json
from backend.user_service.app import app, db, User

class UserServiceTestCase(unittest.TestCase):
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

    def test_register_success(self):
        """Test user registration success."""
        user_data = {
            'email': 'test@example.com',
            'password': 'password123',
            'latitude': 40.7128,
            'longitude': -74.0060
        }
        response = self.app.post('/register',
                                 data=json.dumps(user_data),
                                 content_type='application/json')
        self.assertEqual(response.status_code, 201)
        self.assertIn('User registered successfully', str(response.data))
        with app.app_context():
            user = User.query.filter_by(email='test@example.com').first()
            self.assertIsNotNone(user)
            self.assertTrue(user.check_password('password123'))

    def test_register_duplicate_email(self):
        """Test registration with a duplicate email."""
        user_data = {
            'email': 'test@example.com',
            'password': 'password123',
            'latitude': 40.7128,
            'longitude': -74.0060
        }
        # First registration
        self.app.post('/register',
                      data=json.dumps(user_data),
                      content_type='application/json')
        # Second registration with the same email
        response = self.app.post('/register',
                                 data=json.dumps(user_data),
                                 content_type='application/json')
        self.assertEqual(response.status_code, 400)
        self.assertIn('Email address already registered', str(response.data))

    def test_register_missing_fields(self):
        """Test registration with missing fields."""
        user_data = {
            'email': 'test2@example.com',
            'password': 'password123'
            # Missing latitude and longitude
        }
        response = self.app.post('/register',
                                 data=json.dumps(user_data),
                                 content_type='application/json')
        self.assertEqual(response.status_code, 400)
        self.assertIn('Missing required fields', str(response.data))

if __name__ == '__main__':
    unittest.main()
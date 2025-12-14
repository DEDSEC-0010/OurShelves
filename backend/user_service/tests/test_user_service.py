import unittest
import json
from backend.user_service.app import app, db, User
import pyotp
import pygeohash as pgh

class UserServiceTestCase(unittest.TestCase):
    def setUp(self):
        app.config['TESTING'] = True
        app.config['SECRET_KEY'] = 'test-secret-key'
        app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
        self.app = app.test_client()
        with app.app_context():
            db.create_all()

    def tearDown(self):
        with app.app_context():
            db.session.remove()
            db.drop_all()

    def _register_user(self, email, password):
        user_data = {
            'email': email,
            'password': password,
            'latitude': 40.7128,
            'longitude': -74.0060
        }
        return self.app.post('/register',
                             data=json.dumps(user_data),
                             content_type='application/json')

    def test_registration_and_mfa_setup_flow(self):
        """Test the entire user journey: register -> setup mfa -> access protected route"""
        with self.app as client:
            # 1. Register a new user
            response = self._register_user('journey@example.com', 'password123')
            self.assertEqual(response.status_code, 201)
            self.assertIn('Please proceed to MFA setup', str(response.data))

            # 2. Immediately try to setup MFA
            response = client.get('/mfa/setup')
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.mimetype, 'image/png')

            # 3. Verify the MFA token to complete setup and log in
            with app.app_context():
                user = User.query.filter_by(email='journey@example.com').first()
                self.assertIsNotNone(user.mfa_secret)
                totp = pyotp.TOTP(user.mfa_secret)
                valid_token = totp.now()

            response = client.post('/mfa/verify',
                                   data=json.dumps({'token': valid_token}),
                                   content_type='application/json')
            self.assertEqual(response.status_code, 200)
            self.assertIn('MFA enabled and user logged in successfully', str(response.data))

            # 4. Access a protected route
            response = client.get('/profile')
            self.assertEqual(response.status_code, 200)
            self.assertIn('journey@example.com', str(response.data))

    def test_login_with_existing_mfa_user(self):
        """Test login flow for a user who has already set up MFA."""
        with self.app as client:
            # 1. Setup a user with MFA enabled
            self._register_user('existing@example.com', 'password123')
            client.get('/mfa/setup')
            with app.app_context():
                user = User.query.filter_by(email='existing@example.com').first()
                totp = pyotp.TOTP(user.mfa_secret)
                valid_token = totp.now()
            client.post('/mfa/verify', data=json.dumps({'token': valid_token}), content_type='application/json')
            # Logout the user
            with client.session_transaction() as sess:
                sess.clear()

            # 2. Login with email and password
            login_data = {'email': 'existing@example.com', 'password': 'password123'}
            response = client.post('/login',
                                   data=json.dumps(login_data),
                                   content_type='application/json')
            self.assertEqual(response.status_code, 200)
            self.assertTrue(json.loads(response.data)['mfa_required'])

            # 3. Provide MFA token to complete login
            with app.app_context():
                user = User.query.filter_by(email='existing@example.com').first()
                totp = pyotp.TOTP(user.mfa_secret)
                valid_token = totp.now()

            response = client.post('/login/mfa',
                                   data=json.dumps({'token': valid_token}),
                                   content_type='application/json')
            self.assertEqual(response.status_code, 200)

            # 4. Access protected route
            response = client.get('/profile')
            self.assertEqual(response.status_code, 200)

    def test_login_with_invalid_credentials(self):
        """Test login with incorrect password."""
        self._register_user('invalid@example.com', 'password123')
        login_data = {'email': 'invalid@example.com', 'password': 'wrongpassword'}
        response = self.app.post('/login', data=json.dumps(login_data), content_type='application/json')
        self.assertEqual(response.status_code, 401)
        self.assertIn('Invalid credentials', str(response.data))

    def test_geohash_on_registration(self):
        """Test that a geohash is created on user registration."""
        lat, lon = 37.7749, -122.4194
        user_data = {
            'email': 'geohash@example.com',
            'password': 'password123',
            'latitude': lat,
            'longitude': lon
        }
        self.app.post('/register',
                      data=json.dumps(user_data),
                      content_type='application/json')

        with app.app_context():
            user = User.query.filter_by(email='geohash@example.com').first()
            self.assertIsNotNone(user)
            self.assertEqual(user.geohash, pgh.encode(lat, lon))

    def test_onboarding_info_endpoint(self):
        """Test the /onboarding-info endpoint returns correct information."""
        response = self.app.get('/onboarding-info')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertIn('title', data)
        self.assertIn('core_principles', data)
        self.assertEqual(len(data['core_principles']), 3)

if __name__ == '__main__':
    unittest.main()
from flask import Flask, request, jsonify, session, send_file
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
import pyotp
import qrcode
import io

app = Flask(__name__)
app.config['SECRET_KEY'] = 'super-secret-key-change-in-production'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///users.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128))
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)
    average_rating = db.Column(db.Float, nullable=False, default=0.0)
    completed_transactions = db.Column(db.Integer, nullable=False, default=0)
    mfa_secret = db.Column(db.String(16), nullable=True)
    mfa_enabled = db.Column(db.Boolean, nullable=False, default=False)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    if not data or not 'email' in data or not 'password' in data or not 'latitude' in data or not 'longitude' in data:
        return jsonify({'message': 'Missing required fields'}), 400

    if User.query.filter_by(email=data['email']).first():
        return jsonify({'message': 'Email address already registered'}), 400

    user = User(
        email=data['email'],
        latitude=data['latitude'],
        longitude=data['longitude']
    )
    user.set_password(data['password'])
    db.session.add(user)
    db.session.commit()

    session['mfa_setup_user_id'] = user.id
    return jsonify({'message': 'User registered successfully. Please proceed to MFA setup.', 'user_id': user.id}), 201

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data or not 'email' in data or not 'password' in data:
        return jsonify({'message': 'Missing required fields'}), 400

    user = User.query.filter_by(email=data['email']).first()

    if not user or not user.check_password(data['password']):
        return jsonify({'message': 'Invalid credentials'}), 401

    if user.mfa_enabled:
        session['mfa_user_id'] = user.id
        return jsonify({'message': 'MFA token required', 'mfa_required': True}), 200
    else:
        session['user_id'] = user.id
        return jsonify({'message': 'Logged in successfully', 'mfa_required': False}), 200

@app.route('/login/mfa', methods=['POST'])
def login_mfa():
    if 'mfa_user_id' not in session:
        return jsonify({'message': 'Please log in with email and password first'}), 401

    user = User.query.get(session['mfa_user_id'])
    if not user:
        session.pop('mfa_user_id', None)
        return jsonify({'message': 'User not found'}), 404

    data = request.get_json()
    if not data or 'token' not in data:
        return jsonify({'message': 'Token is required'}), 400

    totp = pyotp.TOTP(user.mfa_secret)
    if totp.verify(data['token']):
        session['user_id'] = session.pop('mfa_user_id')
        return jsonify({'message': 'Logged in successfully'}), 200
    else:
        return jsonify({'message': 'Invalid MFA token'}), 401

@app.route('/mfa/setup', methods=['GET'])
def mfa_setup():
    if 'mfa_setup_user_id' not in session:
        return jsonify({'message': 'Not in MFA setup mode. Please register first.'}), 401

    user = User.query.get(session['mfa_setup_user_id'])
    if not user:
        return jsonify({'message': 'User not found'}), 404

    user.mfa_secret = pyotp.random_base32()
    db.session.commit()

    totp = pyotp.TOTP(user.mfa_secret)
    qr_uri = totp.provisioning_uri(name=user.email, issuer_name="Ourshelves")

    img = qrcode.make(qr_uri)
    buf = io.BytesIO()
    img.save(buf)
    buf.seek(0)

    return send_file(buf, mimetype='image/png')

@app.route('/mfa/verify', methods=['POST'])
def mfa_verify():
    if 'mfa_setup_user_id' not in session:
        return jsonify({'message': 'Not in MFA setup mode. Please register first.'}), 401

    user = User.query.get(session['mfa_setup_user_id'])
    if not user:
        return jsonify({'message': 'User not found'}), 404

    data = request.get_json()
    if not data or 'token' not in data:
        return jsonify({'message': 'Token is required'}), 400

    totp = pyotp.TOTP(user.mfa_secret)
    if totp.verify(data['token']):
        user.mfa_enabled = True
        db.session.commit()
        session.pop('mfa_setup_user_id')
        session['user_id'] = user.id
        return jsonify({'message': 'MFA enabled and user logged in successfully'}), 200
    else:
        return jsonify({'message': 'Invalid token'}), 400

@app.route('/profile')
def profile():
    if 'user_id' not in session:
        return jsonify({'message': 'Not logged in'}), 401
    user = User.query.get(session['user_id'])
    if not user:
        return jsonify({'message': 'User not found'}), 404
    return jsonify({'email': user.email})

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)
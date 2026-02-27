from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from backend.models import db, User
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename  # ये add करें
from dotenv import load_dotenv
import os

load_dotenv()

app = Flask(__name__)

# ---------------- DATABASE ----------------
database_url = os.getenv("DATABASE_URL")
if not database_url:
    raise ValueError("DATABASE_URL not set")
if database_url.startswith("postgres://"):
    database_url = database_url.replace("postgres://", "postgresql://", 1)

app.config["SQLALCHEMY_DATABASE_URI"] = database_url
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file

db.init_app(app)
with app.app_context():
    db.create_all()


CORS(app, origins=[
    "http://localhost:3000",           # Local dev
    "https://your-vercel-frontend.vercel.app",  # Production
    "*" 
])


# ---------------- MUSIC ----------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MUSIC_FOLDER = os.path.join(BASE_DIR, "music")
os.makedirs(MUSIC_FOLDER, exist_ok=True)

def get_song_list():
    try:
        return [f for f in os.listdir(MUSIC_FOLDER) 
                if f.lower().endswith(('.mp3', '.wav', '.m4a'))]
    except:
        return []  # Error handle

# ---------------- REAL PLAYER ----------------
class RealPlayer:
    def __init__(self):
        self.songs = []
        self.current_index = 0
        self.status = "stopped"
        self.volume = 50

    def play(self):
        self.status = "playing"
        return {"status": self.status}

    def pause(self):
        self.status = "paused"
        return {"status": self.status}

    def next_song(self):
        if self.songs:
            self.current_index = (self.current_index + 1) % len(self.songs)
        return {"current_index": self.current_index}

    def prev_song(self):
        if self.songs:
            self.current_index = (self.current_index - 1) % len(self.songs)
        return {"current_index": self.current_index}

player = RealPlayer()

# ---------------- PLAYER CONTROLS ----------------
@app.route("/api/play", methods=["POST"])
def play():
    result = player.play()
    return jsonify(result)

@app.route("/api/pause", methods=["POST"])
def pause():
    result = player.pause()
    return jsonify(result)

@app.route("/api/next", methods=["POST"])
def next_song():
    result = player.next_song()
    return jsonify(result)

@app.route("/api/prev", methods=["POST"])
def prev_song():
    result = player.prev_song()
    return jsonify(result)

# ---------------- VOLUME ---------------- (Missing था)
@app.route("/api/volume_up", methods=["POST"])
def volume_up():
    player.volume = min(100, player.volume + 10)
    return jsonify({"volume": player.volume})

@app.route("/api/volume_down", methods=["POST"])
def volume_down():
    player.volume = max(0, player.volume - 10)
    return jsonify({"volume": player.volume})

# ---------------- LIKE/DISLIKE ---------------- (Missing था)
@app.route("/api/like", methods=["POST"])
def like_song():
    return jsonify({"message": "Song liked!"})

@app.route("/api/dislike", methods=["POST"])
def dislike_song():
    return jsonify({"message": "Song disliked!"})

# ---------------- STATE ----------------
@app.route("/api/state")
def get_state():
    return jsonify({
        "mode": "local",
        "status": player.status,
        "current_index": player.current_index,
        "volume": player.volume,
        "song": player.songs[player.current_index] if player.songs and player.current_index < len(player.songs) else None
    })

# ---------------- MUSIC SERVE ----------------
@app.route("/music/<filename>")
def serve_music(filename):
    try:
        return send_from_directory(MUSIC_FOLDER, filename)
    except:
        return "File not found", 404

# ---------------- SONGS LIST ----------------
@app.route("/api/songs")
def get_songs():
    songs = get_song_list()
    player.songs = songs
    return jsonify({"songs": songs})

@app.route("/api/play_index", methods=["POST"])
def play_index():
    data = request.get_json()
    index = data.get("index", 0)
    songs = get_song_list()
    player.songs = songs
    
    if index < 0 or index >= len(player.songs):
        return jsonify({"error": "Invalid index"}), 400
    
    player.current_index = index
    player.play()
    return jsonify({
        "status": player.status,
        "current_index": player.current_index
    })

# ---------------- MUSIC UPLOAD ---------------- (नया - सबसे जरूरी!)
@app.route("/api/upload_music", methods=["POST"])
def upload_music():
    if 'file' not in request.files:
        return jsonify({"error": "No file"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400
    
    filename = secure_filename(file.filename)
    filepath = os.path.join(MUSIC_FOLDER, filename)
    file.save(filepath)
    
    return jsonify({
        "message": "Upload successful", 
        "filename": filename,
        "songs": get_song_list()
    })

# ---------------- AUTH ---------------- (same)
# app.py में db functions के ऊपर ये add करें
@app.before_request
def before_request():
    try:
        db.session.rollback()  # PendingRollbackError fix
    except:
        pass

# Signup function को ये बनाएं (error handling के साथ)
@app.route("/api/signup", methods=["POST"])
def signup():
    try:
        db.session.rollback()  # Clean session
        
        data = request.get_json()
        print(f"SIGNUP DATA: {data}")  # Debug log
        
        if not data or not all(k in data for k in ['username', 'email', 'password']):
            return jsonify({"error": "Missing fields"}), 400

        # Check existing user
        existing = User.query.filter(
            (User.email == data["email"]) | (User.username == data["username"])
        ).first()
        
        if existing:
            return jsonify({"error": "User already exists"}), 400

        hashed_password = generate_password_hash(data["password"])
        user = User(
            username=data["username"][:50],  # Length limit
            email=data["email"][:120],
            password=hashed_password
        )
        
        db.session.add(user)
        db.session.commit()
        print("SIGNUP SUCCESS")  # Debug log
        
        return jsonify({"message": "Signup successful"}), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"SIGNUP ERROR: {str(e)}")  # Render logs में दिखेगा
        return jsonify({"error": str(e)}), 500


@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json()
    user = User.query.filter(
        (User.email == data["email_or_username"]) | (User.username == data["email_or_username"])
    ).first()
    
    if not user or not check_password_hash(user.password, data["password"]):
        return jsonify({"error": "Invalid credentials"}), 401
    
    return jsonify({"message": "Login successful", "user_id": user.id})

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)

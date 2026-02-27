from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from backend.models import db, User
from werkzeug.security import generate_password_hash, check_password_hash
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

db.init_app(app)

with app.app_context():
    db.create_all()

# Allow all origins (safe for now)
CORS(app, resources={r"/*": {"origins": "*"}})

# ---------------- ROOT ROUTE (VERY IMPORTANT) ----------------
@app.route("/")
def home():
    return "Backend is running successfully!"

# ---------------- MUSIC ----------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MUSIC_FOLDER = os.path.join(BASE_DIR, "music")
os.makedirs(MUSIC_FOLDER, exist_ok=True)

def get_song_list():
    return [
        f for f in os.listdir(MUSIC_FOLDER)
        if f.endswith(".mp3") or f.endswith(".wav")
    ]

# ---------------- PLAYER ----------------
class DummyPlayer:
    def __init__(self):
        self.songs = []
        self.current_index = 0
        self.status = "stopped"
        self.volume = 50

    def play(self):
        self.status = "playing"

    def pause(self):
        self.status = "paused"

    def next_song(self):
        if self.songs:
            self.current_index = (self.current_index + 1) % len(self.songs)

    def prev_song(self):
        if self.songs:
            self.current_index = (self.current_index - 1) % len(self.songs)

player = DummyPlayer()

# ---------------- PLAYER CONTROLS ----------------
@app.route("/api/play", methods=["POST"])
def play():
    player.play()
    return jsonify({"status": player.status})

@app.route("/api/pause", methods=["POST"])
def pause():
    player.pause()
    return jsonify({"status": player.status})

@app.route("/api/next", methods=["POST"])
def next_song():
    player.next_song()
    return jsonify({"current_index": player.current_index})

@app.route("/api/prev", methods=["POST"])
def prev_song():
    player.prev_song()
    return jsonify({"current_index": player.current_index})

# ---------------- STATE ----------------
@app.route("/api/state")
def get_state():
    return jsonify({
        "mode": "local",
        "status": player.status,
        "current_index": player.current_index,
        "song": player.songs[player.current_index] if player.songs and player.current_index < len(player.songs) else None
    })

# ---------------- SONG LIST ----------------
@app.route("/music/<filename>")
def serve_music(filename):
    return send_from_directory(MUSIC_FOLDER, filename)

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

# ---------------- AUTH ----------------
@app.route("/api/signup", methods=["POST"])
def signup():
    data = request.get_json()

    existing = User.query.filter(
        (User.email == data["email"]) |
        (User.username == data["username"])
    ).first()

    if existing:
        return jsonify({"error": "User already exists"}), 400

    hashed_password = generate_password_hash(data["password"])

    user = User(
        username=data["username"],
        email=data["email"],
        password=hashed_password
    )

    db.session.add(user)
    db.session.commit()

    return jsonify({"message": "Signup successful"}), 201


@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json()

    user = User.query.filter(
        (User.email == data["email_or_username"]) |
        (User.username == data["email_or_username"])
    ).first()

    if not user:
        return jsonify({"error": "User not found"}), 401

    if not check_password_hash(user.password, data["password"]):
        return jsonify({"error": "Invalid credentials"}), 401

    return jsonify({
        "message": "Login successful",
        "user_id": user.id
    })

# ---------------- RUN ----------------
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
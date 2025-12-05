import sqlite3
import pickle


class DatabaseManager:
    def __init__(self, db_path="event_access.db"):
        self.db_path = db_path
        self.init_database()

    def init_database(self):
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS members (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                first_name TEXT NOT NULL,
                last_name TEXT NOT NULL,
                email TEXT NOT NULL UNIQUE,
                phone TEXT,
                face_data BLOB NOT NULL,
                registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        )

        cursor.execute("PRAGMA table_info(members)")
        columns = [row[1] for row in cursor.fetchall()]
        if "face_image" not in columns:
            cursor.execute("ALTER TABLE members ADD COLUMN face_image BLOB")
        if "last_name" not in columns:
            cursor.execute("ALTER TABLE members ADD COLUMN last_name TEXT DEFAULT ''")
        if "first_name" not in columns and "name" in columns:
            cursor.execute("ALTER TABLE members RENAME COLUMN name TO first_name")

        conn.commit()
        conn.close()

    def register_member(
        self, first_name, last_name, email, phone, face_roi, face_image=None
    ):
        face_data_blob = sqlite3.Binary(pickle.dumps(face_roi))
        face_image_blob = (
            sqlite3.Binary(pickle.dumps(face_image)) if face_image is not None else None
        )

        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        cursor.execute(
            """
            INSERT INTO members (first_name, last_name, email, phone, face_data, face_image) 
            VALUES (?, ?, ?, ?, ?, ?)
        """,
            (first_name, last_name, email, phone, face_data_blob, face_image_blob),
        )

        conn.commit()
        conn.close()

    def get_all_members(self):
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        cursor.execute(
            "SELECT id, first_name, last_name, email, phone, face_data FROM members"
        )
        rows = cursor.fetchall()

        members = [dict(row) for row in rows]

        conn.close()
        return members

    def get_member_by_id(self, member_id):
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        cursor.execute(
            "SELECT id, first_name, last_name, email, phone FROM members WHERE id = ?",
            (member_id,),
        )
        row = cursor.fetchone()

        if row:
            member = dict(row)
        else:
            member = None

        conn.close()
        return member

    def delete_member(self, member_id):
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        cursor.execute("DELETE FROM members WHERE id = ?", (member_id,))

        conn.commit()
        conn.close()

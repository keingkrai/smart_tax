import psycopg2 as pg
import json, os, hashlib, mimetypes, re
from datetime import date
from decimal import Decimal
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

load_dotenv()
# --------------------------
# Helpers: TH month / date / money / file meta
# --------------------------
THAI_MONTHS = {
    "มกราคม": 1, "กุมภาพันธ์": 2, "มีนาคม": 3, "เมษายน": 4, "พฤษภาคม": 5, "มิถุนายน": 6,
    "กรกฎาคม": 7, "สิงหาคม": 8, "กันยายน": 9, "ตุลาคม": 10, "พฤศจิกายน": 11, "ธันวาคม": 12,
    # รองรับแบบ "01".."12" ด้วย
    "01":1,"02":2,"03":3,"04":4,"05":5,"06":6,"07":7,"08":8,"09":9,"10":10,"11":11,"12":12
}

def parse_doc_date(d):
    """รับ dict {'day':..,'month':..,'year':..} คืน datetime.date หรือ None (แปลง พ.ศ. -> ค.ศ.)"""
    if not d or not isinstance(d, dict):
        return None
    m_raw = str(d.get("month") or "").strip()
    m = THAI_MONTHS.get(m_raw, None)
    y_raw = str(d.get("year") or "").strip()
    y = None
    if y_raw.isdigit():
        y = int(y_raw)
        if y > 2400:  # พ.ศ.
            y -= 543
    # ถ้าไม่ระบุวัน ให้เป็นวันที่ 1
    day_raw = d.get("day")
    day = day_raw if isinstance(day_raw, int) and 1 <= day_raw <= 31 else 1

    if y and m:
        try:
            return date(y, m, day)
        except Exception:
            return None
    return None

def parse_money(val):
    """'20,908.46' -> Decimal('20908.46'); None/ว่าง -> None"""
    if val is None:
        return None
    s = str(val).replace(',', '')
    try:
        return Decimal(s)
    except Exception:
        return None
    
def _sha256_of_file(path: str) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            h.update(chunk)
    return h.hexdigest()

def _normalize_sha(sha: str, fallback_path: str) -> str:
    s = (sha or "").strip().lower()
    if not re.fullmatch(r"[0-9a-f]{64}", s):
        # ถ้าส่งมาไม่ครบ/ไม่ใช่ hex 64 ตัว — คำนวณใหม่จากไฟล์จริง
        if fallback_path and os.path.exists(fallback_path):
            s = _sha256_of_file(fallback_path)
    return s

def file_sha256(path: str) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            h.update(chunk)
    return h.hexdigest()

def ensure_file_meta(meta: dict):
    """
    เติม mime_type / file_size_bytes / sha256 ถ้ายังไม่มี
    ต้องมี meta['file_path'] และ meta['original_name']
    """
    if "file_size_bytes" not in meta:
        meta["file_size_bytes"] = os.path.getsize(meta["file_path"])
    if "mime_type" not in meta:
        mt = mimetypes.guess_type(meta["original_name"])[0]
        meta["mime_type"] = mt or "application/octet-stream"
    if "sha256" not in meta:
        meta["sha256"] = file_sha256(meta["file_path"])
    return meta

def normalize_from_result_json(result_json: dict):
    """
    ดึงฟิลด์สำคัญจาก JSON ผล OCR ของคุณ ให้ตรงชนิดกับคอลัมน์
    JSON ตัวอย่างที่คุณให้มี key: seller, buyer, tax_id, invoice_no, date{..}, total, items[], deduction_status, reason
    """
    vendor_name = result_json.get("seller")
    buyer_name = result_json.get("buyer")
    tax_id = result_json.get("tax_id")
    invoice_no = result_json.get("invoice_no")

    doc_date = parse_doc_date(result_json.get("date"))

    total_amount = parse_money(result_json.get("total"))
    if total_amount is None and isinstance(result_json.get("items"), list):
        acc = Decimal('0')
        for it in result_json["items"]:
            acc += parse_money(it.get("total_price")) or Decimal('0')
        total_amount = acc

    deduction_status = result_json.get("deduction_status")
    deduction_reason = result_json.get("reason")

    return {
        "vendor_name": vendor_name,
        "buyer_name": buyer_name,
        "tax_id": tax_id,
        "invoice_no": invoice_no,
        "doc_date": doc_date,
        "total_amount": total_amount,
        "deduction_status": deduction_status,
        "deduction_reason": deduction_reason,
    }

# --------------------------
# Database
# --------------------------
class DatabaseConnection:
    def __init__(self):
        try:
            # --- Read database connection details from environment variables ---
            host = os.getenv("SUPABASE_DB_HOST", "localhost")
            port = int(os.getenv("SUPABASE_DB_PORT", "5432"))
            db   = os.getenv("SUPABASE_DB_NAME", "smarttax")
            user = os.getenv("SUPABASE_DB_USER", "postgres")
            pwd  = os.getenv("SUPABASE_DB_PASSWORD", "0000")

            print("DB HOST:", host)
            print("DB USER:", user)
            print("DB NAME:", db)

            # --- Establish the connection ---
            self.connection = pg.connect(
                host=host,
                database=db,
                user=user,
                password=pwd,
                port=port
            )
            self.connection.autocommit = True
            self.cursor = self.connection.cursor()
            print("database now")
            # เปิดใช้งาน JSONB ถ้ายังไม่ได้สร้าง extension (รันครั้งเดียวพอ)
            try:
                self.cursor.execute("CREATE EXTENSION IF NOT EXISTS pgcrypto;")
            except Exception:
                pass
        except Exception as e:
            print("Error connecting to the database:", e)

    def create_table(self):
        # แยกคำสั่งเป็นทีละ query (psycopg2 ปลอดภัยกว่า)
        stmts = [
            # employee
            """CREATE TABLE IF NOT EXISTS employee (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                role VARCHAR(30) NOT NULL DEFAULT 'user',
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            )""",
            # document
            """CREATE TABLE IF NOT EXISTS document (
                id               SERIAL PRIMARY KEY,
                employee_id      INTEGER NOT NULL REFERENCES employee(id) ON DELETE CASCADE,
                member_name      VARCHAR(255) NOT NULL,
                original_name    VARCHAR(255) NOT NULL,
                file_path        VARCHAR(500) NOT NULL,
                mime_type        VARCHAR(100) NOT NULL,
                file_size_bytes  BIGINT NOT NULL,
                sha256           VARCHAR(64) NOT NULL,          -- ← เอา UNIQUE ออก
                created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

                vendor_name      VARCHAR(255),
                buyer_name       VARCHAR(255),
                tax_id           VARCHAR(20),
                invoice_no       VARCHAR(100),
                doc_date         DATE,
                total_amount     NUMERIC(18,2),
                deduction_status VARCHAR(50),
                deduction_reason TEXT,

                result_json      JSONB NOT NULL
            )""",
            # indexes
                "CREATE INDEX IF NOT EXISTS idx_document_employee   ON document(employee_id)",
                "CREATE INDEX IF NOT EXISTS idx_document_date       ON document(doc_date)",
                "CREATE INDEX IF NOT EXISTS idx_document_status     ON document(deduction_status)",
                "CREATE INDEX IF NOT EXISTS idx_document_vendor     ON document(vendor_name)",
                "CREATE INDEX IF NOT EXISTS idx_document_result_gin ON document USING GIN (result_json)",
            """CREATE TABLE IF NOT EXISTS document_result_history (
                id            SERIAL PRIMARY KEY,
                document_id   INTEGER NOT NULL REFERENCES document(id) ON DELETE CASCADE,
                stage         VARCHAR(50) NOT NULL,      -- 'final' หรืออื่น ๆ
                result_json   JSONB NOT NULL,
                status        VARCHAR(50),
                reason        TEXT,
                rules_version VARCHAR(50),
                created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            )""",
            "CREATE INDEX IF NOT EXISTS idx_hist_doc   ON document_result_history(document_id)",
            "CREATE INDEX IF NOT EXISTS idx_hist_stage ON document_result_history(stage)"
        ]
        try:
            for sql in stmts:
                self.cursor.execute(sql)
            return "create table success"
        except Exception as e:
            print("Error creating table:", e)
            return "create table failed"

    # --------------------------
    # Employees
    # --------------------------
    def insert_employee(self, name, email, password_hash, role="user"):
        try:
            # 🔎 1) เช็คก่อนว่ามี email นี้แล้วหรือยัง
            self.cursor.execute("SELECT id FROM employee WHERE email = %s", (email,))
            existing = self.cursor.fetchone()
            if existing:
                print("Email already registered:", email)
                return False   # หรือ return existing[0] ถ้าอยากส่ง id เดิมกลับไป

            # 📝 2) ถ้าไม่เจอ email → insert ใหม่
            self.cursor.execute(
                "INSERT INTO employee (name, email, password_hash, role) VALUES (%s, %s, %s, %s) RETURNING id",
                (name, email, password_hash, role)
            )
            return self.cursor.fetchone()[0]

        except Exception as e:
            print("Error inserting employee:", e)
            return None

    def get_employees(self):
        try:
            self.cursor.execute("SELECT id, name, email, role, created_at FROM employee ORDER BY id")
            return self.cursor.fetchall()
        except Exception as e:
            print("Error fetching employees:", e)
            return []

    def get_pre_employee(self, gmail, password_hash):
        try:
            self.cursor = self.connection.cursor(cursor_factory=RealDictCursor)
            self.cursor.execute("SELECT id, name, email, role, created_at FROM employee WHERE email = %s AND password_hash = %s", (gmail, password_hash))
            row = self.cursor.fetchone() 
            return row
        except Exception as e:
            print("Error fetching employee:", e)
            return None
    
    # --------------------------
    # Documents
    # --------------------------
    def insert_document(self, employee_id, member_name, meta, result_json, rules_version=None, add_hist=True):
        sha = _normalize_sha(meta.get("sha256"), meta.get("file_path"))
        meta = {**meta, "sha256": sha}

        try:
            ensure_file_meta(meta)
            fields = normalize_from_result_json(result_json)

            # 1) พยายามแทรก
            sql = sql = """
                INSERT INTO document (
                    employee_id, member_name, original_name, file_path, mime_type,
                    file_size_bytes, sha256,
                    vendor_name, buyer_name, tax_id, invoice_no, doc_date, total_amount,
                    deduction_status, deduction_reason,
                    result_json
                )
                VALUES (%s,%s,%s,%s,%s, %s,%s, %s,%s,%s,%s,%s,%s, %s,%s, %s)
                RETURNING id
                """

            values = (
                employee_id, member_name, meta["original_name"], meta["file_path"],
                meta["mime_type"], meta["file_size_bytes"], meta["sha256"],
                fields["vendor_name"], fields["buyer_name"], fields["tax_id"],
                fields["invoice_no"], fields["doc_date"], fields["total_amount"],
                fields["deduction_status"], fields["deduction_reason"],
                json.dumps(result_json, ensure_ascii=False),
            )
            self.cursor.execute(sql, values)
            row = self.cursor.fetchone()

            if row:
                doc_id = row[0]  # insert ใหม่สำเร็จ
            else:
                # 2) มีอยู่แล้ว (ชนคีย์คู่ employee_id+sha256) → ดึง id เดิม
                self.cursor.execute(
                    "SELECT id FROM document WHERE employee_id = %s AND sha256 = %s",
                    (employee_id, meta["sha256"])
                )
                found = self.cursor.fetchone()
                if not found:
                    return None
                doc_id = found[0]

                # (ออปชัน) อยากอัปเดตฟิลด์สรุป/ผลล่าสุด ก็ทำ UPDATE เพิ่มได้:
                self.cursor.execute("""
                    UPDATE document
                    SET member_name = %s,
                        vendor_name = COALESCE(%s, vendor_name),
                        buyer_name  = COALESCE(%s, buyer_name),
                        tax_id      = COALESCE(%s, tax_id),
                        invoice_no  = COALESCE(%s, invoice_no),
                        doc_date    = COALESCE(%s, doc_date),
                        total_amount= COALESCE(%s, total_amount),
                        deduction_status = %s,
                        deduction_reason = %s,
                        result_json = %s
                    WHERE id = %s
                """, (
                    member_name,
                    fields["vendor_name"], fields["buyer_name"], fields["tax_id"],
                    fields["invoice_no"], fields["doc_date"], fields["total_amount"],
                    fields["deduction_status"], fields["deduction_reason"],
                    json.dumps(result_json, ensure_ascii=False),
                    doc_id
                ))

            if add_hist:
                self.add_history(
                    document_id=doc_id, stage="final",
                    result_json=result_json,
                    status=fields["deduction_status"], reason=fields["deduction_reason"],
                    rules_version=rules_version
                )
            return doc_id

        except Exception as e:
            import traceback
            print("DB insert error:", e)
            traceback.print_exc()
            return None

    def get_all_document(self, employee_id):
        try:
            self.cursor = self.connection.cursor(cursor_factory=RealDictCursor)
            self.cursor.execute("SELECT * FROM document WHERE employee_id = %s", (employee_id,))
            rows = self.cursor.fetchall()
            return rows
        except Exception as e:
            print("Error fetching documents:", e)
            return []

    def get_per_document(self, document_id):
        try:
            self.cursor.execute(""" SELECT jsonb_build_object(
                                        'id', id,
                                        'employee_id', employee_id,
                                        'member_name', member_name,
                                        'original_name', original_name,
                                        'file_path', file_path,
                                        'mime_type', mime_type,
                                        'file_size_bytes', file_size_bytes,
                                        'sha256', TRIM(sha256),
                                        'created_at', created_at,
                                        'vendor_name', vendor_name,
                                        'buyer_name', buyer_name,
                                        'tax_id', tax_id,
                                        'invoice_no', invoice_no,
                                        'doc_date', doc_date,
                                        'total_amount', total_amount,
                                        'deduction_status', deduction_status,
                                        'deduction_reason', deduction_reason,
                                        'result_json', result_json
                                        ) AS doc
                                        FROM document
                                        WHERE id = %s""", (document_id,))
            row = self.cursor.fetchone()
            return row
        except Exception as e:
            print("Error fetching document:", e)
            return None

    def delete_document(self, document_id: int):
        try:
            self.cursor.execute("DELETE FROM document WHERE id = %s", (document_id,))
            return self.cursor.rowcount > 0  # คืน True ถ้าลบได้
        except Exception as e:
            print("Error deleting document:", e)
            return False


    def add_history(self, document_id, stage, result_json, status=None, reason=None, rules_version=None):

        try:
            self.cursor.execute(
                """
                INSERT INTO document_result_history (document_id, stage, result_json, status, reason, rules_version)
                VALUES (%s, %s, %s, %s, %s, %s)
                """,
                (document_id, stage, json.dumps(result_json, ensure_ascii=False), status, reason, rules_version)
            )
            return True
        except Exception as e:
            print("Error inserting history:", e)
            return False

    def close(self):
        if self.connection:
            try:
                self.cursor.close()
            except Exception:
                pass
            try:
                self.connection.close()
            except Exception:
                pass

    def ping(self):
        try:
            self.cursor.execute("select now(), current_user, version()")
            print(self.cursor.fetchone())
            return True
        except Exception as e:
            print("Ping failed:", e)
            return False

import ctypes
import csv
import json
import mimetypes
import os
import threading
import time
import webbrowser
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import quote, urlencode

PORT = 17322
ROOT = Path(__file__).resolve().parent
EXPORT_DIR = ROOT / "exports"
MASTER_TRACKER_JSON = EXPORT_DIR / "nfc-master-tracker.json"
MASTER_TRACKER_CSV = EXPORT_DIR / "nfc-master-tracker.csv"

SCARD_SCOPE_USER = 0
SCARD_SHARE_SHARED = 2
SCARD_PROTOCOL_T0 = 1
SCARD_PROTOCOL_T1 = 2
SCARD_LEAVE_CARD = 0
SCARD_S_SUCCESS = 0
SCARD_E_NOT_TRANSACTED = 0x80100016
SCARD_E_PCI_TOO_SMALL = 0x80100019
SCARD_W_RESET_CARD = 0x80100068
SCARD_W_REMOVED_CARD = 0x80100069

winscard = ctypes.windll.WinScard
pcsc_lock = threading.RLock()


class SCARD_IO_REQUEST(ctypes.Structure):
    _fields_ = [
        ("dwProtocol", ctypes.c_ulong),
        ("cbPciLength", ctypes.c_ulong),
    ]


def check(result, action):
    if result != SCARD_S_SUCCESS:
        raise RuntimeError(f"{action} failed: 0x{result & 0xffffffff:08X}")


def establish_context():
    context = ctypes.c_void_p()
    result = winscard.SCardEstablishContext(SCARD_SCOPE_USER, None, None, ctypes.byref(context))
    check(result, "SCardEstablishContext")
    return context


def release_context(context):
    winscard.SCardReleaseContext(context)


def list_readers():
    context = establish_context()
    try:
        length = ctypes.c_ulong()
        result = winscard.SCardListReadersW(context, None, None, ctypes.byref(length))
        check(result, "SCardListReadersW length")
        buffer = ctypes.create_unicode_buffer(length.value)
        result = winscard.SCardListReadersW(context, None, buffer, ctypes.byref(length))
        check(result, "SCardListReadersW")
        return [reader for reader in buffer.value.split("\x00") if reader]
    finally:
        release_context(context)


def connect_first_reader():
    context = establish_context()
    try:
        readers = list_readers()
        if not readers:
            raise RuntimeError("No NFC readers detected.")

        card = ctypes.c_void_p()
        protocol = ctypes.c_ulong()
        last_error = None
        for reader in readers:
            result = winscard.SCardConnectW(
                context,
                ctypes.c_wchar_p(reader),
                SCARD_SHARE_SHARED,
                SCARD_PROTOCOL_T0 | SCARD_PROTOCOL_T1,
                ctypes.byref(card),
                ctypes.byref(protocol),
            )
            if result == SCARD_S_SUCCESS:
                return context, card, protocol.value, reader
            last_error = result

        check(last_error, "SCardConnectW")
    except Exception:
        release_context(context)
        raise


def disconnect(context, card):
    winscard.SCardDisconnect(card, SCARD_LEAVE_CARD)
    release_context(context)


def begin_transaction(card):
    check(winscard.SCardBeginTransaction(card), "SCardBeginTransaction")


def end_transaction(card):
    winscard.SCardEndTransaction(card, SCARD_LEAVE_CARD)


def transmit(card, protocol, command, response_size=258):
    last_result = SCARD_S_SUCCESS
    for attempt in range(3):
        send_pci = SCARD_IO_REQUEST(protocol, ctypes.sizeof(SCARD_IO_REQUEST))
        recv_pci = SCARD_IO_REQUEST(protocol, ctypes.sizeof(SCARD_IO_REQUEST))
        send_buffer = (ctypes.c_ubyte * len(command)).from_buffer_copy(bytes(command))
        recv_buffer = (ctypes.c_ubyte * response_size)()
        recv_length = ctypes.c_ulong(response_size)
        result = winscard.SCardTransmit(
            card,
            ctypes.byref(send_pci),
            send_buffer,
            len(command),
            ctypes.byref(recv_pci),
            recv_buffer,
            ctypes.byref(recv_length),
        )
        if result == SCARD_S_SUCCESS:
            return bytes(recv_buffer[: recv_length.value])
        last_result = result
        if result not in (SCARD_E_NOT_TRANSACTED, SCARD_E_PCI_TOO_SMALL, SCARD_W_RESET_CARD):
            break
        time.sleep(0.12 * (attempt + 1))
    check(last_result, "SCardTransmit")
    return b""


def text_bytes(value):
    return str(value or "").encode("utf-8")


def uri_payload(uri):
    value = str(uri or "")
    prefixes = [
        ("https://www.", 0x02),
        ("http://www.", 0x01),
        ("https://", 0x04),
        ("http://", 0x03),
        ("mailto:", 0x06),
        ("tel:", 0x05),
    ]
    for prefix, code in prefixes:
        if value.startswith(prefix):
            return bytes([code]) + text_bytes(value[len(prefix) :])
    return b"\x00" + text_bytes(value)


def text_payload(text, language="en"):
    lang = text_bytes(language)
    return bytes([len(lang)]) + lang + text_bytes(text)


def record_payload(record):
    record_type = record.get("type")
    if record_type == "WEBSITE":
        return 0x01, b"U", uri_payload(record.get("url"))
    if record_type == "URI":
        return 0x01, b"U", uri_payload(record.get("uri"))
    if record_type == "PHONE":
        return 0x01, b"U", uri_payload(f"tel:{record.get('phone', '')}")
    if record_type == "SMS":
        phone = record.get("phone", "")
        message = quote(str(record.get("message", "")))
        return 0x01, b"U", uri_payload(f"sms:{phone}?body={message}")
    if record_type == "EMAIL":
        params = {}
        if record.get("subject"):
            params["subject"] = record.get("subject")
        if record.get("body"):
            params["body"] = record.get("body")
        query = f"?{urlencode(params)}" if params else ""
        return 0x01, b"U", uri_payload(f"mailto:{record.get('to', '')}{query}")
    if record_type == "FILE":
        return 0x01, b"U", uri_payload(record.get("uri"))
    if record_type == "TEXT":
        return 0x01, b"T", text_payload(record.get("text"))
    if record_type == "WIFI":
        wifi = (
            f"WIFI:T:{record.get('authenticationType') or 'WPA2_PERSONAL'};"
            f"S:{record.get('ssid') or ''};"
            f"P:{record.get('networkKey') or ''};"
            "H:false;;"
        )
        return 0x01, b"T", text_payload(wifi)
    if record_type == "MIME":
        mime_type = text_bytes(record.get("mimeType") or "application/octet-stream")
        if record.get("mimeDataHex"):
            payload = bytes.fromhex(str(record.get("mimeDataHex")).replace(" ", ""))
        else:
            payload = text_bytes(record.get("mimeDataUtf8"))
        return 0x02, mime_type, payload
    if record_type == "AAR":
        return 0x04, b"android.com:pkg", text_bytes(record.get("packageName"))
    if record_type == "EXTERNAL":
        return 0x04, text_bytes(f"{record.get('domain', '')}:{record.get('type', '')}"), text_bytes(record.get("data"))
    if record_type == "APPLICATION":
        value = f"{record.get('application', '')} {record.get('arguments', '')}".strip()
        return 0x01, b"T", text_payload(value)
    raise RuntimeError(f"Unsupported NDEF record type: {record_type}")


def make_ndef_record(record, index, total):
    tnf, type_name, payload = record_payload(record)
    if len(payload) > 255:
        raise RuntimeError("Payloads above 255 bytes are not supported in this local writer.")
    header = (0x80 if index == 0 else 0) | (0x40 if index == total - 1 else 0) | 0x10 | tnf
    return bytes([header, len(type_name), len(payload)]) + type_name + payload


def make_ndef_message(tag):
    records = tag.get("ndef", {}).get("records", [])
    if not records:
        raise RuntimeError("Request must include tag.ndef.records.")
    return b"".join(make_ndef_record(record, index, len(records)) for index, record in enumerate(records))


def make_type2_tlv(tag):
    message = make_ndef_message(tag)
    if len(message) > 254:
        tlv = b"\x03\xff" + len(message).to_bytes(2, "big") + message + b"\xfe"
    else:
        tlv = b"\x03" + bytes([len(message)]) + message + b"\xfe"
    padding = b"\x00" * ((4 - (len(tlv) % 4)) % 4)
    return tlv + padding


def get_uid(card, protocol):
    response = transmit(card, protocol, bytes.fromhex("FF CA 00 00 00"))
    if len(response) >= 2 and response[-2:] == b"\x90\x00":
        return response[:-2].hex().upper()
    return None


def read_page_block(card, protocol, page):
    response = transmit(card, protocol, bytes([0xFF, 0xB0, 0x00, page, 0x10]), 18)
    if len(response) >= 2 and response[-2:] == b"\x90\x00":
        return response[:-2]
    if response == b"\x63\x00":
        fallback = transmit(card, protocol, bytes([0xFF, 0x00, 0x00, 0x00, 0x05, 0xD4, 0x40, 0x01, 0x30, page]), 32)
        if len(fallback) >= 4 and fallback[-2:] == b"\x90\x00":
            body = fallback[:-2]
            if body[:3] == b"\xD5\x41\x00":
                return body[3:19]
    raise RuntimeError(f"Read page {page} failed: {response.hex().upper()}")


def read_type2_memory(card, protocol, max_pages=60):
    chunks = []
    for page in range(4, max_pages, 4):
        block = read_page_block(card, protocol, page)
        chunks.append(block)
        if b"\xfe" in block:
            break
    return b"".join(chunks)


def write_page(card, protocol, page, data):
    response = transmit(card, protocol, bytes([0xFF, 0xD6, 0x00, page, 0x04]) + data, 2)
    if response == b"\x90\x00":
        return
    if response == b"\x63\x00":
        fallback = transmit(
            card,
            protocol,
            bytes([0xFF, 0x00, 0x00, 0x00, 0x09, 0xD4, 0x40, 0x01, 0xA2, page]) + data,
            16,
        )
        if len(fallback) >= 4 and fallback[-2:] == b"\x90\x00" and fallback[:-2] == b"\xD5\x41\x00":
            return
    raise RuntimeError(f"Write page {page} failed: {response.hex().upper()}")


def extract_ndef_message(memory):
    index = 0
    while index < len(memory):
      tlv = memory[index]
      index += 1
      if tlv == 0x00:
          continue
      if tlv == 0xFE:
          break
      if index >= len(memory):
          break
      if memory[index] == 0xFF:
          if index + 2 >= len(memory):
              break
          length = int.from_bytes(memory[index + 1:index + 3], "big")
          index += 3
      else:
          length = memory[index]
          index += 1
      value = memory[index:index + length]
      index += length
      if tlv == 0x03:
          return value
    return b""


def ndef_used_bytes(memory):
    index = 0
    while index < len(memory):
      tlv_start = index
      tlv = memory[index]
      index += 1
      if tlv == 0x00:
          continue
      if tlv == 0xFE:
          return index
      if index >= len(memory):
          break
      if memory[index] == 0xFF:
          if index + 2 >= len(memory):
              break
          length = int.from_bytes(memory[index + 1:index + 3], "big")
          index += 3
      else:
          length = memory[index]
          index += 1
      index += length
      if tlv == 0x03:
          if index < len(memory) and memory[index] == 0xFE:
              index += 1
          return max(index, tlv_start + 4)
    return 4


def decode_uri_payload(payload):
    prefixes = {
        0x00: "",
        0x01: "http://www.",
        0x02: "https://www.",
        0x03: "http://",
        0x04: "https://",
        0x05: "tel:",
        0x06: "mailto:",
    }
    if not payload:
        return ""
    return prefixes.get(payload[0], "") + payload[1:].decode("utf-8", errors="replace")


def decode_text_payload(payload):
    if not payload:
        return ""
    language_length = payload[0] & 0x3F
    return payload[1 + language_length:].decode("utf-8", errors="replace")


def decode_ndef_message(message):
    records = []
    index = 0
    while index < len(message):
        header = message[index]
        index += 1
        short_record = bool(header & 0x10)
        id_length_present = bool(header & 0x08)
        tnf = header & 0x07
        type_length = message[index]
        index += 1
        if short_record:
            payload_length = message[index]
            index += 1
        else:
            payload_length = int.from_bytes(message[index:index + 4], "big")
            index += 4
        id_length = message[index] if id_length_present else 0
        if id_length_present:
            index += 1
        type_name = message[index:index + type_length]
        index += type_length
        if id_length:
            index += id_length
        payload = message[index:index + payload_length]
        index += payload_length

        decoded = {
            "tnf": tnf,
            "typeName": type_name.decode("utf-8", errors="replace"),
            "payloadHex": payload.hex().upper(),
        }
        if tnf == 0x01 and type_name == b"U":
            decoded["type"] = "URI"
            decoded["uri"] = decode_uri_payload(payload)
        elif tnf == 0x01 and type_name == b"T":
            decoded["type"] = "TEXT"
            decoded["text"] = decode_text_payload(payload)
        elif tnf == 0x02:
            decoded["type"] = "MIME"
            decoded["mimeType"] = decoded["typeName"]
            decoded["mimeDataUtf8"] = payload.decode("utf-8", errors="replace")
        elif tnf == 0x04 and type_name == b"android.com:pkg":
            decoded["type"] = "AAR"
            decoded["packageName"] = payload.decode("utf-8", errors="replace")
        elif tnf == 0x04:
            decoded["type"] = "EXTERNAL"
            decoded["data"] = payload.decode("utf-8", errors="replace")
        else:
            decoded["type"] = "UNKNOWN"
        records.append(decoded)
        if header & 0x40:
            break
    return records


def read_tag():
    with pcsc_lock:
        context, card, protocol, reader = connect_first_reader()
        try:
            begin_transaction(card)
            try:
                uid = get_uid(card, protocol)
                memory = read_type2_memory(card, protocol)
                message = extract_ndef_message(memory)
                records = decode_ndef_message(message) if message else []
                return {
                    "ok": True,
                    "reader": reader,
                    "card": {"uid": uid, "type": "Type 2 / PCSC"},
                    "ndef": {"records": records, "messageHex": message.hex().upper()},
                    "memoryHex": memory.hex().upper(),
                }
            finally:
                end_transaction(card)
        finally:
            disconnect(context, card)


def status():
    with pcsc_lock:
        readers = list_readers()
        if not readers:
            return {"ok": False, "reader": None, "card": None, "error": "No NFC readers detected."}
        try:
            context, card, protocol, reader = connect_first_reader()
            try:
                return {
                    "ok": True,
                    "reader": reader,
                    "card": {"uid": get_uid(card, protocol), "type": "Type 2 / PCSC"},
                    "error": None,
                }
            finally:
                disconnect(context, card)
        except Exception as error:
            return {"ok": True, "reader": readers[0], "card": None, "error": str(error)}


def write_tag(tag):
    with pcsc_lock:
        context, card, protocol, reader = connect_first_reader()
        try:
            begin_transaction(card)
            try:
                uid = get_uid(card, protocol)
                data = make_type2_tlv(tag)
                for offset in range(0, len(data), 4):
                    page = 4 + (offset // 4)
                    write_page(card, protocol, page, data[offset : offset + 4])
                return {
                    "ok": True,
                    "reader": reader,
                    "card": {"uid": uid, "type": "Type 2 / PCSC"},
                    "bytesWritten": len(data),
                    "pagesWritten": len(data) // 4,
                }
            finally:
                end_transaction(card)
        finally:
            disconnect(context, card)


def erase_tag():
    with pcsc_lock:
        context, card, protocol, reader = connect_first_reader()
        try:
            begin_transaction(card)
            try:
                uid = get_uid(card, protocol)
                memory = read_type2_memory(card, protocol)
                used_bytes = min(ndef_used_bytes(memory), len(memory) or 4)
                pages_to_clear = max(1, (used_bytes + 3) // 4)
                write_page(card, protocol, 4, b"\x03\x00\xfe\x00")
                for offset in range(1, pages_to_clear):
                    write_page(card, protocol, 4 + offset, b"\x00\x00\x00\x00")
                return {
                    "ok": True,
                    "reader": reader,
                    "card": {"uid": uid, "type": "Type 2 / PCSC"},
                    "pagesCleared": pages_to_clear,
                }
            finally:
                end_transaction(card)
        finally:
            disconnect(context, card)


def safe_export_name(name):
    stem = "".join(char if char.isalnum() or char in "._-" else "_" for char in str(name or "nfc-progress"))
    stem = stem.strip("._-") or "nfc-progress"
    if not stem.endswith(".json"):
        stem = f"{stem}.json"
    return stem


def progress_metadata(value):
    text = str(value or "")
    marker = "/t/"
    if marker not in text:
        return {"platform": "", "claimNumber": None, "claimToken": "", "cardId": ""}

    token = text.split(marker, 1)[1].split("?", 1)[0].split("#", 1)[0].strip("/")
    parts = token.split("-")
    if len(parts) < 4 or parts[1] != "claim":
        return {"platform": "", "claimNumber": None, "claimToken": token, "cardId": ""}

    try:
        claim_number = int(parts[2])
    except ValueError:
        claim_number = None

    suffix = parts[3].upper()
    card_id = f"{suffix}{claim_number:03d}" if claim_number is not None else ""
    return {
        "platform": parts[0].lower(),
        "claimNumber": claim_number,
        "claimToken": token,
        "cardId": card_id,
    }


def tracker_record(payload, row, export_file):
    metadata = progress_metadata(row.get("value", ""))
    row_number = row.get("rowNumber") or row.get("row_number")
    return {
        "queueKey": payload.get("queueKey", ""),
        "sourceFile": payload.get("fileName", ""),
        "rowNumber": row_number,
        "platform": row.get("platform") or metadata["platform"],
        "claimNumber": row.get("claimNumber") if row.get("claimNumber") is not None else metadata["claimNumber"],
        "claimToken": row.get("claimToken") or metadata["claimToken"],
        "cardId": row.get("cardId") or metadata["cardId"],
        "status": row.get("status", ""),
        "uid": row.get("uid", ""),
        "message": row.get("message", ""),
        "completedAt": row.get("completedAt", ""),
        "updatedAt": row.get("updatedAt") or payload.get("updatedAt", ""),
        "value": row.get("value", ""),
        "exportFile": export_file,
    }


def record_key(record):
    return f"{record.get('queueKey', '')}:{record.get('rowNumber', '')}:{record.get('value', '')}"


def sort_record(record):
    source = str(record.get("sourceFile", ""))
    row_number = record.get("rowNumber")
    try:
        row_number = int(row_number)
    except (TypeError, ValueError):
        row_number = 0
    return source, row_number, str(record.get("value", ""))


def write_master_tracker_csv(records):
    fieldnames = [
        "sourceFile",
        "rowNumber",
        "platform",
        "claimNumber",
        "claimToken",
        "cardId",
        "status",
        "uid",
        "message",
        "completedAt",
        "updatedAt",
        "value",
        "exportFile",
        "queueKey",
    ]
    with MASTER_TRACKER_CSV.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        for record in records:
            writer.writerow({field: record.get(field, "") for field in fieldnames})


def update_master_tracker(payload, export_file):
    rows = payload.get("rows") or []
    if not isinstance(rows, list):
        return None

    existing_records = []
    if MASTER_TRACKER_JSON.exists():
        try:
            existing_payload = json.loads(MASTER_TRACKER_JSON.read_text(encoding="utf-8"))
            existing_records = existing_payload.get("records") or []
        except Exception:
            existing_records = []

    records_by_key = {
        record_key(record): record
        for record in existing_records
        if isinstance(record, dict)
    }

    for index, row in enumerate(rows, start=1):
        if not isinstance(row, dict):
            continue
        if not row.get("rowNumber"):
            row = {**row, "rowNumber": index}
        record = tracker_record(payload, row, export_file)
        records_by_key[record_key(record)] = record

    records = sorted(records_by_key.values(), key=sort_record)
    completed = sum(1 for record in records if record.get("status") == "COMPLETED")
    pending = sum(1 for record in records if record.get("status") != "COMPLETED")
    by_platform = {}
    for record in records:
        platform = record.get("platform") or "other"
        platform_summary = by_platform.setdefault(platform, {"total": 0, "completed": 0, "pending": 0, "errors": 0})
        platform_summary["total"] += 1
        if record.get("status") == "COMPLETED":
            platform_summary["completed"] += 1
        else:
            platform_summary["pending"] += 1
        if record.get("status") == "ERROR":
            platform_summary["errors"] += 1

    master_payload = {
        "version": 1,
        "updatedAt": time.strftime("%Y-%m-%dT%H:%M:%S%z"),
        "total": len(records),
        "completed": completed,
        "pending": pending,
        "byPlatform": by_platform,
        "records": records,
    }
    MASTER_TRACKER_JSON.write_text(json.dumps(master_payload, indent=2), encoding="utf-8")
    write_master_tracker_csv(records)
    return {
        "json": str(MASTER_TRACKER_JSON),
        "csv": str(MASTER_TRACKER_CSV),
        "completed": completed,
        "total": len(records),
    }


class Handler(BaseHTTPRequestHandler):
    def send_json_headers(self, status_code=200):
        self.send_response(status_code)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Allow-Private-Network", "true")
        self.send_header("Content-Type", "application/json")
        self.end_headers()

    def do_OPTIONS(self):
        self.send_json_headers()
        self.wfile.write(b"{}")

    def do_GET(self):
        if self.path == "/status":
            self.send_json_headers()
            self.wfile.write(json.dumps(status()).encode("utf-8"))
            return
        if self.path == "/read":
            try:
                result = read_tag()
                self.send_json_headers()
                self.wfile.write(json.dumps(result).encode("utf-8"))
            except Exception as error:
                self.send_json_headers(500)
                self.wfile.write(json.dumps({"ok": False, "error": str(error)}).encode("utf-8"))
            return

        request_path = self.path.split("?", 1)[0]
        if request_path == "/":
            request_path = "/index.html"
        file_path = (ROOT / request_path.lstrip("/")).resolve()
        if ROOT in file_path.parents and file_path.is_file():
            content_type = mimetypes.guess_type(file_path.name)[0] or "application/octet-stream"
            self.send_response(200)
            self.send_header("Content-Type", content_type)
            self.end_headers()
            self.wfile.write(file_path.read_bytes())
            return

        self.send_json_headers(404)
        self.wfile.write(json.dumps({"ok": False, "error": "Not found"}).encode("utf-8"))
        return

    def do_POST(self):
        if self.path == "/save-progress":
            try:
                length = int(self.headers.get("Content-Length", "0"))
                body = json.loads(self.rfile.read(length).decode("utf-8"))
                EXPORT_DIR.mkdir(parents=True, exist_ok=True)
                filename = safe_export_name(body.get("filename"))
                file_path = (EXPORT_DIR / filename).resolve()
                if EXPORT_DIR not in file_path.parents:
                    raise RuntimeError("Invalid export filename.")
                payload = body.get("payload", {})
                file_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
                master = update_master_tracker(payload, file_path.name)
                self.send_json_headers()
                self.wfile.write(json.dumps({"ok": True, "path": str(file_path), "master": master}).encode("utf-8"))
            except Exception as error:
                self.send_json_headers(500)
                self.wfile.write(json.dumps({"ok": False, "error": str(error)}).encode("utf-8"))
            return

        if self.path == "/erase":
            try:
                result = erase_tag()
                self.send_json_headers()
                self.wfile.write(json.dumps(result).encode("utf-8"))
            except Exception as error:
                self.send_json_headers(500)
                self.wfile.write(json.dumps({"ok": False, "error": str(error)}).encode("utf-8"))
            return

        if self.path != "/write":
            self.send_json_headers(404)
            self.wfile.write(json.dumps({"ok": False, "error": "Not found"}).encode("utf-8"))
            return
        try:
            length = int(self.headers.get("Content-Length", "0"))
            body = json.loads(self.rfile.read(length).decode("utf-8"))
            result = write_tag(body.get("tag", {}))
            self.send_json_headers()
            self.wfile.write(json.dumps(result).encode("utf-8"))
        except Exception as error:
            self.send_json_headers(500)
            self.wfile.write(json.dumps({"ok": False, "error": str(error)}).encode("utf-8"))

    def log_message(self, format, *args):
        return


if __name__ == "__main__":
    print(f"Internal NFC bridge running at http://localhost:{PORT}")
    if os.environ.get("INTERNAL_NFC_NO_BROWSER") != "1":
        threading.Timer(0.5, lambda: webbrowser.open(f"http://localhost:{PORT}/")).start()
    ThreadingHTTPServer(("127.0.0.1", PORT), Handler).serve_forever()

from datetime import datetime
from io import BytesIO

from flask import Flask, abort, jsonify, render_template, request, send_file, url_for
from werkzeug.exceptions import RequestEntityTooLarge

app = Flask(__name__)

# 教學用：資料只暫存在記憶體。重新啟動程式後會清空。
tickets = []
ticket_images = {}

MAX_IMAGE_SIZE = 10 * 1024 * 1024
MAX_IMAGE_COUNT = 3
app.config["MAX_CONTENT_LENGTH"] = MAX_IMAGE_SIZE * MAX_IMAGE_COUNT + 1024 * 1024

ALLOWED_IMAGE_TYPES = {
    ".jpg": ("image/jpeg", b"\xff\xd8\xff"),
    ".jpeg": ("image/jpeg", b"\xff\xd8\xff"),
    ".png": ("image/png", b"\x89PNG\r\n\x1a\n"),
}


@app.get("/")
def index():
    return render_template("index.html")


@app.get("/admin")
def admin():
    return render_template("admin.html")


@app.get("/api/tickets")
def list_tickets():
    return jsonify(tickets)


@app.get("/api/tickets/<ticket_id>/images/<int:image_index>")
def ticket_image(ticket_id, image_index):
    images = ticket_images.get(ticket_id, [])
    if image_index >= len(images):
        abort(404)

    image = images[image_index]
    return send_file(
        BytesIO(image["data"]),
        mimetype=image["mimetype"],
        download_name=image["name"],
        max_age=0,
    )


@app.post("/api/tickets")
def create_ticket():
    data = request.form if request.mimetype == "multipart/form-data" else (
        request.get_json(silent=True) or {}
    )

    uploaded_images = [
        image for image in request.files.getlist("images") if image.filename
    ]
    if len(uploaded_images) > MAX_IMAGE_COUNT:
        return jsonify({"message": f"最多只能上傳 {MAX_IMAGE_COUNT} 張圖片"}), 400

    validated_images = []
    for image in uploaded_images:
        extension = "." + image.filename.rsplit(".", 1)[-1].lower() if "." in image.filename else ""
        allowed_type = ALLOWED_IMAGE_TYPES.get(extension)
        if allowed_type is None or image.mimetype != allowed_type[0]:
            return jsonify({"message": "圖片格式僅接受 JPG 或 PNG"}), 400

        content = image.stream.read(MAX_IMAGE_SIZE + 1)
        if len(content) > MAX_IMAGE_SIZE:
            return jsonify({"message": "單張圖片大小不可超過 10MB"}), 400
        if not content.startswith(allowed_type[1]):
            return jsonify({"message": "圖片內容與檔案格式不符"}), 400

        validated_images.append(
            {
                "name": image.filename.rsplit("/", 1)[-1].rsplit("\\", 1)[-1],
                "mimetype": allowed_type[0],
                "data": content,
            }
        )

    location = str(data.get("location", "")).strip()
    equipment = str(data.get("equipment", "")).strip()
    description = str(data.get("description", "")).strip()
    urgency = str(data.get("urgency", "一般")).strip()
    contact = str(data.get("contact", "")).strip()

    missing = []
    if not location:
        missing.append("地點")
    if not equipment:
        missing.append("設備")
    if not description:
        missing.append("問題描述")
    if not contact:
        missing.append("聯絡方式")

    if missing:
        return jsonify({"message": f"請填寫：{'、'.join(missing)}"}), 400

    ticket = {
        "id": f"T-{len(tickets) + 1:03d}",
        "location": location,
        "equipment": equipment,
        "description": description,
        "urgency": urgency or "一般",
        "contact": contact,
        "status": "待處理",
        "created_at": datetime.now().strftime("%Y-%m-%d %H:%M"),
        "images": [],
    }
    ticket_images[ticket["id"]] = validated_images
    ticket["images"] = [
        {
            "name": image["name"],
            "url": url_for(
                "ticket_image", ticket_id=ticket["id"], image_index=index
            ),
        }
        for index, image in enumerate(validated_images)
    ]
    tickets.append(ticket)

    return jsonify(
        {
            "message": f"報修已建立，案件編號為 {ticket['id']}",
            "ticket": ticket,
        }
    ), 201


@app.patch("/api/tickets/<ticket_id>")
def update_ticket(ticket_id):
    data = request.get_json(silent=True) or {}
    status = str(data.get("status", "")).strip()
    allowed_statuses = {"待處理", "處理中", "已完成"}

    if status not in allowed_statuses:
        return jsonify({"message": "案件狀態不正確"}), 400

    ticket = next((item for item in tickets if item["id"] == ticket_id), None)
    if ticket is None:
        return jsonify({"message": "找不到指定案件"}), 404

    ticket["status"] = status
    return jsonify({"message": f"{ticket_id} 已更新為「{status}」", "ticket": ticket})


@app.errorhandler(RequestEntityTooLarge)
def handle_request_too_large(_error):
    return jsonify({"message": "上傳資料超過伺服器限制"}), 413


if __name__ == "__main__":
    app.run(debug=True)

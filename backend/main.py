from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import psycopg2
from psycopg2.extras import RealDictCursor
from ultralytics import YOLO
import io
from PIL import Image
import numpy as np
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],  # em produção, troque por o domínio do frontend
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

def get_db_connection():
    return psycopg2.connect(
        host=os.getenv("DB_HOST"),
        database=os.getenv("DB_NAME"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        port=os.getenv("DB_PORT",5432)
    )


model = YOLO('yolov8n.pt')

@app.post("/detect")
async def detect_objects(file: UploadFile = File(...)):
    contents = await file.read()
    image = Image.open(io.BytesIO(contents)).convert("RGB")
    
    results = model(image)
    
    detections = []
    counts = {}
    
    for result in results:
        for box in result.boxes:
            class_id = int(box.cls[0])
            label = model.names[class_id]
            
            counts[label] = counts.get(label, 0) + 1
            
            # detections.append({
            #     "label": label,
            #     "confidence": float(box.conf[0]),
            #     "box": box.xyxy[0].tolist()
            # })
    analysis = []
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    for label, count in counts.items():
        cur.execute("SELECT id, nome_exibicao, estoque_minimo FROM produtos_estoque WHERE nome_label = %s", (label,))
        product = cur.fetchone()
        
        if product:
            cur.execute(
                "INSERT INTO historico_deteccoes (produto_id, quantidade_detectada) VALUES (%s, %s)", (product['id'], count)
            )
            
            status = "OK"
            if count < product['estoque_minimo']:
                status = "ALERTA: Estoque Baixo!"
            analysis.append({
                "produto":product['nome_exibicao'],
                "detectado": count,
                "minimo_esperado": product['estoque_minimo'],
                "status": status
            })
    
    conn.commit()
    cur.close()
    conn.close()
    
    return {"analysis": analysis}
        
    # return {
    #     "summary": counts,
    #     "details": detections
    # }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
    
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

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db_connection():
    return psycopg2.connect(
        host=os.getenv("DB_HOST"),
        database=os.getenv("DB_NAME"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        port=os.getenv("DB_PORT", 5432)
    )

model = YOLO('yolov8n.pt')

@app.post("/detect")
async def detect_objects(file: UploadFile = File(...)):
    contents = await file.read()
    image = Image.open(io.BytesIO(contents)).convert("RGB")
    
    results = model(image)
    counts = {}
    
    for result in results:
        for box in result.boxes:
            class_id = int(box.cls[0])
            label = model.names[class_id]
            counts[label] = counts.get(label, 0) + 1

    analysis = []
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    for label, count in counts.items():
        cur.execute("SELECT id, nome_exibicao, estoque_minimo FROM produtos_estoque WHERE nome_label = %s", (label,))
        product = cur.fetchone()
        
        if product:
            cur.execute(
                "INSERT INTO historico_deteccoes (produto_id, quantidade_detectada) VALUES (%s, %s)", 
                (product['id'], count)
            )
            
            status = "OK"
            if count < product['estoque_minimo']:
                status = "ALERTA: Estoque Baixo!"
            
            analysis.append({
                "produto": product['nome_exibicao'],
                "detectado": count,
                "minimo_esperado": product['estoque_minimo'],
                "status": status
            })
    
    conn.commit()
    cur.close()
    conn.close()

    if not analysis:
        return {"analysis": [{"produto": "Nenhum item monitorado", "detectado": 0, "minimo_esperado": 0, "status": "Vazio"}]}
    
    return {"analysis": analysis}

@app.get("/history/{product_label}")
async def get_history(product_label: str):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    # Procura as últimas 10 leituras de um produto específico
    query = """
        SELECT h.quantidade_detectada, h.data_leitura 
        FROM historico_deteccoes h
        JOIN produtos_estoque p ON h.produto_id = p.id
        WHERE p.nome_label = %s
        ORDER BY h.data_leitura DESC
        LIMIT 10
    """
    cur.execute(query, (product_label,))
    history = cur.fetchall()
    
    cur.close()
    conn.close()
    
    return history[::-1]

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
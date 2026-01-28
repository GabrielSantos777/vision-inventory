from ultralytics import YOLO

# Carrega um modelo pré-treinado (detecta 80 tipos de objetos comuns)
model = YOLO('yolov8n.pt')

# Faz a detecção em uma imagem qualquer (pode ser uma URL ou arquivo local)
results = model('https://ultralytics.com/images/bus.jpg')

for result in results:
    result.show()
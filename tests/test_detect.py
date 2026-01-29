import requests

url = "http://localhost:8000/detect"

files = {
    "file": open("tests/bus.jpg", "rb")
}

response = requests.post(url, files=files)

print("Status:", response.status_code)
print("Resposta:")
print(response.json())
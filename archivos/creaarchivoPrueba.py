import csv
import random
from datetime import datetime, timedelta

# Definir los nombres de los archivos y las estructuras de cada tabla
tablas = [
    {
        "nombre_archivo": "tabla_ejemplo_1.csv",
        "fieldnames": ["id", "nombre"],
        "data": [
            {"id": i + 1, "nombre": f"Producto {chr(65 + (i % 26))}{i + 1}"} for i in range(100)
        ]
    },
    {
        "nombre_archivo": "tabla_ejemplo_2.csv",
        "fieldnames": ["codigo", "descripcion"],
        "data": [
            {"codigo": f"COD{str(i + 1).zfill(3)}", "descripcion": f"Descripción del producto {i + 1}"} for i in range(100)
        ]
    },
    {
        "nombre_archivo": "tabla_ejemplo_3.csv",
        "fieldnames": ["fecha", "monto"],
        "data": [
            {
                "fecha": (datetime(2024, 1, 1) + timedelta(days=i)).strftime("%Y-%m-%d"),
                "monto": round(random.uniform(100, 1000), 2)
            } for i in range(100)
        ]
    }
]

# Generar los archivos CSV para cada tabla
for tabla in tablas:
    filename = tabla["nombre_archivo"]
    
    with open(filename, mode="w", newline="") as file:
        writer = csv.DictWriter(file, fieldnames=tabla["fieldnames"])
        writer.writeheader()
        writer.writerows(tabla["data"])
    
    print(f"Archivo {filename} generado exitosamente.")

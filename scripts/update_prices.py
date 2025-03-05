#!/usr/bin/env python3
import os
import json
import csv
import sys
import subprocess
import time
from datetime import datetime
import requests
import re

# Configuración
PROJECT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CMSCRAPE_DIR = os.path.join(PROJECT_DIR, 'scripts', 'CMScrape')
PRODUCTS_FILE = os.path.join(PROJECT_DIR, 'scripts', 'product_links.csv')
OUTPUT_FILE = os.path.join(PROJECT_DIR, 'scripts', 'prices_output.csv')
SERVICE_FILE = os.path.join(PROJECT_DIR, 'src', 'lib', 'cardmarketService.ts')

# Configuración de la API
API_ENDPOINT = os.environ.get('PRICE_UPDATE_API', 'http://localhost:3000/api/update-prices')
API_TOKEN = os.environ.get('PRICE_UPDATE_TOKEN', 'pokebim_secret_token')

def setup_cmscrape():
    """Instala CMScrape si no está instalado"""
    if not os.path.exists(CMSCRAPE_DIR):
        print("Descargando CMScrape...")
        os.makedirs(os.path.dirname(CMSCRAPE_DIR), exist_ok=True)
        subprocess.run(["git", "clone", "https://github.com/DrankRock/CMScrape.git", CMSCRAPE_DIR])
        os.chdir(CMSCRAPE_DIR)
        subprocess.run(["pip", "install", "-r", "requirements.txt"])
        os.chdir(PROJECT_DIR)
        print("CMScrape instalado correctamente")
    else:
        print("CMScrape ya está instalado")

def create_product_links():
    """Crea un archivo CSV con los enlaces a los productos a consultar"""
    # Leer el archivo cardmarketService.ts para extraer los productos existentes
    existing_products = {}
    try:
        with open(SERVICE_FILE, 'r', encoding='utf-8') as f:
            content = f.read()
            # Buscar la tabla REFERENCE_PRICES
            pattern = r"export const REFERENCE_PRICES: {[^}]*} = {([^}]*)}"
            match = re.search(pattern, content, re.DOTALL)
            if match:
                reference_table = match.group(1)
                # Extraer cada producto y su precio
                product_matches = re.findall(r"'([^']+)':\s*([\d.]+)", reference_table)
                for name, price in product_matches:
                    existing_products[name] = float(price)
    except Exception as e:
        print(f"Error al leer los productos existentes: {e}")
    
    # Definir los enlaces a los productos
    products = [
        {"name": "VSTAR-Universe-Booster-Box", "url": "https://www.cardmarket.com/en/Pokemon/Products/Booster-Boxes/VSTAR-Universe-Booster-Box?language=7"},
        {"name": "Terastal-Festival-ex-Booster-Box", "url": "https://www.cardmarket.com/es/Pokemon/Products/Booster-Boxes/Terastal-Festival-ex-Booster-Box?language=10"},
        {"name": "Super-Electric-Breaker-Booster-Box", "url": "https://www.cardmarket.com/es/Pokemon/Products/Booster-Boxes/Super-Electric-Breaker-Booster-Box?language=10"},
        {"name": "Obsidian-Flames-Booster-Box", "url": "https://www.cardmarket.com/es/Pokemon/Products/Booster-Boxes/Obsidian-Flames-Booster-Box?language=10"},
        {"name": "Paldean-Fates-Booster-Box", "url": "https://www.cardmarket.com/es/Pokemon/Products/Booster-Boxes/Paldean-Fates-Booster-Box?language=10"},
        {"name": "Scarlet-Violet-Booster-Box", "url": "https://www.cardmarket.com/es/Pokemon/Products/Booster-Boxes/Scarlet-Violet-Booster-Box?language=10"},
        {"name": "Temporal-Forces-Booster-Box", "url": "https://www.cardmarket.com/es/Pokemon/Products/Booster-Boxes/Temporal-Forces-Booster-Box?language=10"},
        {"name": "Pokemon-151-Booster-Box", "url": "https://www.cardmarket.com/es/Pokemon/Products/Booster-Boxes/Pokemon-151-Booster-Box?language=10"},
        {"name": "Crown-Zenith-Booster-Box", "url": "https://www.cardmarket.com/es/Pokemon/Products/Booster-Boxes/Crown-Zenith-Booster-Box?language=10"},
    ]
    
    # Añadir productos existentes que no estén en la lista
    for name in existing_products:
        if not any(p["name"] == name for p in products):
            # Construir URL basada en el nombre (patrón aproximado)
            url = f"https://www.cardmarket.com/es/Pokemon/Products/Booster-Boxes/{name}?language=10"
            products.append({"name": name, "url": url})
    
    # Crear el archivo CSV
    os.makedirs(os.path.dirname(PRODUCTS_FILE), exist_ok=True)
    with open(PRODUCTS_FILE, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["ProductName", "URL"])
        for product in products:
            writer.writerow([product["name"], product["url"]])
    
    print(f"Archivo de enlaces creado con {len(products)} productos")
    return products

def run_cmscrape():
    """Ejecuta CMScrape para obtener los precios"""
    print("Obteniendo precios con CMScrape...")
    try:
        # Modificación para usar scrapeAndCheck.py o el script adecuado
        os.chdir(CMSCRAPE_DIR)
        result = subprocess.run(["python", "CMScrape.py", "-i", PRODUCTS_FILE, "-o", OUTPUT_FILE, "--no-proxies", "True"], 
                            capture_output=True, text=True)
        os.chdir(PROJECT_DIR)
        
        if result.returncode != 0:
            print(f"Error al ejecutar CMScrape: {result.stderr}")
            return False
        
        print("CMScrape ejecutado correctamente")
        return True
    except Exception as e:
        print(f"Error al ejecutar CMScrape: {e}")
        return False

def read_prices():
    """Lee los precios obtenidos del archivo de salida"""
    prices = {}
    try:
        with open(OUTPUT_FILE, "r", encoding="utf-8") as f:
            reader = csv.reader(f)
            next(reader)  # Saltar encabezados
            for row in reader:
                if len(row) >= 3:
                    product_name = row[0]
                    min_price = float(row[1])  # Precio mínimo
                    prices[product_name] = min_price
        
        print(f"Leídos {len(prices)} precios del archivo de salida")
        return prices
    except Exception as e:
        print(f"Error al leer precios: {e}")
        return {}

def update_service_file(prices):
    """Actualiza directamente el archivo cardmarketService.ts con los nuevos precios"""
    try:
        with open(SERVICE_FILE, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Crear la nueva tabla de precios
        timestamp = datetime.now().strftime('%d/%m/%Y %H:%M')
        new_table = f"""export const REFERENCE_PRICES: {{[key: string]: number}} = {{
  // Precios de productos destacados - última actualización: {timestamp}"""
        
        # Añadir cada precio
        for name, price in sorted(prices.items()):
            new_table += f"\n  '{name}': {price:.2f},"
        
        new_table += "\n};"
        
        # Reemplazar la tabla existente
        updated_content = re.sub(
            r"export const REFERENCE_PRICES: {[^}]*} = {[^}]*};",
            new_table,
            content,
            flags=re.DOTALL
        )
        
        # Guardar el archivo actualizado
        with open(SERVICE_FILE, 'w', encoding='utf-8') as f:
            f.write(updated_content)
        
        print(f"Archivo de servicio actualizado correctamente con {len(prices)} precios")
        return True
    except Exception as e:
        print(f"Error al actualizar el archivo de servicio: {e}")
        return False

def update_api(prices):
    """Envía los precios a la API para actualizar el servidor"""
    try:
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {API_TOKEN}"
        }
        
        payload = {
            "prices": prices,
            "timestamp": datetime.now().isoformat()
        }
        
        response = requests.post(API_ENDPOINT, json=payload, headers=headers)
        
        if response.status_code == 200:
            print("Precios actualizados correctamente en el servidor")
            return True
        else:
            print(f"Error al actualizar precios en el servidor: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"Error al conectar con el servidor: {e}")
        return False

def main():
    """Función principal"""
    print(f"Iniciando actualización de precios: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Configurar CMScrape
    setup_cmscrape()
    
    # Crear archivo de enlaces
    create_product_links()
    
    # Ejecutar CMScrape
    success = run_cmscrape()
    if not success:
        print("No se pudo ejecutar CMScrape. Abortando.")
        return
    
    # Leer precios
    prices = read_prices()
    if not prices:
        print("No se obtuvieron precios. Abortando.")
        return
    
    # Actualizar archivo de servicio
    update_service_file(prices)
    
    # Intentar actualizar a través de la API
    update_api(prices)
    
    print(f"Proceso completado: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

if __name__ == "__main__":
    main() 
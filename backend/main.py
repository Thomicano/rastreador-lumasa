import requests
import re
import time
import json
import urllib.request
import urllib.parse
from datetime import datetime
import holidays
from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.support.ui import Select, WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.by import By
from selenium.webdriver.common.action_chains import ActionChains

# --- CONFIGURACIÓN DE LA APP ---
app = FastAPI()

# Permitir que tu frontend de Next.js se conecte sin problemas
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- CONSTANTES ---
SUPABASE_URL = "https://hapinrbavndhvmcscisp.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhcGlucmJhdm5kaHZtY3NjaXNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzOTY3NDMsImV4cCI6MjA4OTk3Mjc0M30.5HGbsnGrHDdhfqDfYivX9oWvMPc4NqvBo2QuLNwhOAk"
feriados_arg = holidays.Argentina()

# --- FUNCIONES DE APOYO ---
def obtener_tipo_de_dia(fecha_actual):
    if fecha_actual in feriados_arg:
        return 'domingo'
    dia_semana = fecha_actual.weekday()
    if dia_semana == 5: return 'sabado'
    if dia_semana == 6: return 'domingo'
    return 'habil'

# --- RUTAS ---

@app.get("/", response_class=HTMLResponse)
def home():
    return "<h1>Radar Despeñaderos API Online</h1>"

@app.get("/api/horarios")
def obtener_horarios_del_dia(origen: str = "Despeñaderos", destino: str = "Córdoba"):
    hoy = datetime.now()
    tipo_dia_hoy = obtener_tipo_de_dia(hoy)
    
    url = f"{SUPABASE_URL}/rest/v1/horarios?origen=eq.{urllib.parse.quote(origen)}&destino=eq.{urllib.parse.quote(destino)}&tipo_dia=eq.{urllib.parse.quote(tipo_dia_hoy)}"
    req = urllib.request.Request(url, headers={
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}"
    })
    
    try:
        with urllib.request.urlopen(req) as response:
            horarios_reales = json.loads(response.read().decode())
    except Exception as e:
        horarios_reales = []

    return {
        "fecha_consulta": hoy.strftime("%Y-%m-%d"),
        "tipo_dia_detectado": tipo_dia_hoy,
        "horarios": horarios_reales
    }

# ESTA ES LA RUTA MAGICA QUE USARÁ TU BOTON
@app.get("/api/rastrear_automatico")
def rastrear_automatico(origen_id: str, destino_id: str, hora_servicio: str):
    # Definir coordenadas aproximadas para cálculo de cercanía
    COORDS = {
        "156": {"lat": -31.816, "lon": -64.283}, # Despeñaderos
        "1":   {"lat": -31.423, "lon": -64.183}, # Córdoba Terminal
        "105": {"lat": -32.176, "lon": -64.110}, # Río Tercero
    }
    
    # 1. Determinar el sentido del viaje y extremos a buscar
    if str(origen_id) == "156" and str(destino_id) == "1":
        # Sentido Norte (Ida). Buscamos todo el corredor desde el Sur al Norte
        buscar_origen = "105" # Rio Tercero
        buscar_destino = "1"  # Cordoba
        direccion = "norte"
    elif str(origen_id) == "1" and str(destino_id) == "156":
        # Sentido Sur (Vuelta). Buscamos el corredor de Norte a Sur
        buscar_origen = "1"   # Cordoba
        buscar_destino = "105" # Rio Tercero
        direccion = "sur"
    else:
        # Fallback genérico
        buscar_origen = origen_id
        buscar_destino = destino_id
        direccion = "norte"
        
    options = webdriver.ChromeOptions()
    # options.binary_location = r"C:\Program Files\Google\Chrome\Application\chrome.exe" # Desactivado para Render / Docker
    options.add_argument("--headless=new") 
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-blink-features=AutomationControlled")
    options.add_argument("--disable-infobars")
    options.add_experimental_option("excludeSwitches", ["enable-automation"])
    options.add_experimental_option('useAutomationExtension', False)
    
    driver = webdriver.Chrome(options=options)
    driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
    
    try:
        driver.get("https://micronauta.dnsalias.net/usuario/")
        wait = WebDriverWait(driver, 15)
        
        # 2. Saltar Iframes
        try:
            frames = driver.find_elements(By.TAG_NAME, "frame")
            if not frames:
                frames = driver.find_elements(By.TAG_NAME, "iframe")
            if frames:
                driver.switch_to.frame(frames[0])
        except:
            pass
            
        def inyectar_seleccion(fragmento_id, valor):
            xpath = f"//select[contains(@id, '{fragmento_id}')]"
            elem = wait.until(EC.presence_of_element_located((By.XPATH, xpath)))
            driver.execute_script("arguments[0].scrollIntoView({behavior: 'smooth', block: 'center'});", elem)
            time.sleep(0.5)
            ActionChains(driver).move_to_element(elem).perform()
            driver.execute_script(f"""
                var el = arguments[0];
                el.value = '{valor}';
                var evt = document.createEvent('HTMLEvents');
                evt.initEvent('change', true, true);
                el.dispatchEvent(evt);
                if(window.jQuery) {{ jQuery(el).trigger('change'); }}
                if(typeof el.onchange === 'function') {{ el.onchange(); }}
            """, elem)
            time.sleep(1) # Refresh DOM
        
        # A. Provincia y Empresa
        inyectar_seleccion("prov", "5")
        inyectar_seleccion("empresa", "5=6=-1:0")
        time.sleep(2)
        
        # B. Línea Río Tercero
        elem_linea = wait.until(EC.presence_of_element_located((By.XPATH, "//select[contains(@id, 'linea')]")))
        op_lineas = elem_linea.find_elements(By.TAG_NAME, 'option')
        for op in op_lineas:
            if 'CORDOBA - RIO TERCERO' in op.text:
                inyectar_seleccion("linea", op.get_attribute("value"))
                break
                
        time.sleep(4) # Esperar a que carguen los pueblos base
        
        # C. Origen y Destino (Cargamos los extremos)
        inyectar_seleccion("origen", buscar_origen)
        inyectar_seleccion("destino", buscar_destino)
        time.sleep(2)
        
        # D. Buscar
        driver.execute_script("document.getElementById('buscar').click();")
        time.sleep(6) # Clave para que carguen todos los pines
        
        html = driver.page_source
        
        # 3. Extraer TODOS los coches y sus posiciones de forma robusta
        # Usamos re.split para aislar los bloques de cada coche
        bloques_coches = re.split(r"Coche\s*:?", html, flags=re.IGNORECASE)
        
        coches_activos = []
        for bloque in bloques_coches[1:]: # Ignoramos el índice 0 que es el html anterior al primer Coche
            match_nro = re.search(r"^\s*(\d+)", bloque)
            if not match_nro: continue
            
            nro_coche = match_nro.group(1)
            # Buscar coordenadas de forma cercana al número
            match_gps = re.search(r"q=([-0-9.]+),([-0-9.]+)", bloque)
            if match_gps:
                lat = float(match_gps.group(1))
                lon = float(match_gps.group(2))
                coches_activos.append({"coche": nro_coche, "lat": lat, "lon": lon})
                
        if not coches_activos:
            return {"status": "error", "mensaje": "Ningún colectivo de esta línea reporta GPS activo en este momento."}
            
        # 4. Encontrar el Coche Más Cercano según la dirección (Distancia Euclidiana)
        # Lat/Lon de donde el usuario espera el colectivo (Ej: 156=Despeñaderos)
        ref = COORDS.get(origen_id, COORDS["156"])
        ref_lat, ref_lon = ref["lat"], ref["lon"]
        
        candidatos = []
        # En Argentina/Córdoba, Norte es Lat mayor (cerca de -31.4) y Sur es Lat menor (cerca de -32.1)
        for c in coches_activos:
            distancia = ((c["lat"] - ref_lat)**2 + (c["lon"] - ref_lon)**2)**0.5
            
            # Filtro lógico para evitar colectivos que ya pasaron de largo el pueblo
            if direccion == "norte":
                # Si va de Sur a Norte, queremos colectivos que estén al sur (Lat menor) 
                # Damos un pequeño margen (+0.015) por si ya entró a la terminal
                if c["lat"] < (ref_lat + 0.015):
                    candidatos.append({"coche": c, "dist": distancia})
            else:
                # Si va de Norte a Sur, queremos colectivos al norte (Lat mayor)
                if c["lat"] > (ref_lat - 0.015):
                    candidatos.append({"coche": c, "dist": distancia})
                    
        # Fallback de emergencia si el filtro de dirección descarta todo (Ej: gps con error gigante)
        if not candidatos:
            for c in coches_activos:
                distancia = ((c["lat"] - ref_lat)**2 + (c["lon"] - ref_lon)**2)**0.5
                candidatos.append({"coche": c, "dist": distancia})
                
        # Seleccionar el ganador (el de menor distancia)
        candidatos.sort(key=lambda x: x["dist"])
        mejor_candidato = candidatos[0]["coche"]
        
        return {
            "status": "success",
            "coche": mejor_candidato["coche"],
            "coordenadas": {"lat": mejor_candidato["lat"], "lon": mejor_candidato["lon"]},
            "timestamp": datetime.now().strftime("%H:%M:%S")
        }

    except Exception as e:
        return {"status": "error", "mensaje": "Error procesando el mapa de Lumasa", "detalle": str(e)}
    finally:
        driver.quit()

if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.environ.get("PORT", 8000))
    # Esto asegura que pueda correr en el puerto asignado por Render si lo ejecutas vía `python main.py`
    uvicorn.run("main:app", host="0.0.0.0", port=port)
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.support.ui import Select, WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.action_chains import ActionChains
import time
import re


def probar_rastreo_manual(origen_id, destino_id):
    options = webdriver.ChromeOptions()
    # USAMOS BRAVE Y VEMOS LA VENTANA
    # COMENTAMOS EL HEADLESS PARA VER QUÉ PASA
    # options.add_argument("--headless") 
    options.add_argument("--disable-blink-features=AutomationControlled")
    options.add_argument("--disable-infobars")
    options.add_experimental_option("excludeSwitches", ["enable-automation"])
    options.add_experimental_option('useAutomationExtension', False)
    driver = webdriver.Chrome(options=options)
    driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
    try:
        print("🌐 Entrando a la web de Lumasa...")
        # Entramos a la web
        driver.get("https://micronauta.dnsalias.net/usuario/")
        time.sleep(5)

        print("🪟 Buscando iframes/frames en la página...")
        try:
            frames = driver.find_elements(By.TAG_NAME, "frame")
            if not frames:
                frames = driver.find_elements(By.TAG_NAME, "iframe")
            
            if frames:
                driver.switch_to.frame(frames[0])
                print("✅ Se entró exitosamente al primer frame.")
            else:
                print("⚠️ No se encontraron frames. Operando en el documento principal.")
        except Exception as e:
            print(f"⚠️ Error al intentar buscar/cambiar frames: {e}")

        # Función auxiliar súper estricta e imperativa
        def inyectar_seleccion(fragmento_id, valor):
            # 1. Buscamos por XPATH con match parcial por si cambia el ID
            xpath = f"//select[contains(@id, '{fragmento_id}')]"
            elem = driver.find_element(By.XPATH, xpath)
            
            # 2. Scroll para asegurar que está a la vista
            driver.execute_script("arguments[0].scrollIntoView({behavior: 'smooth', block: 'center'});", elem)
            time.sleep(1)
            
            # 3. ActionChains para mover el mouse a las coordenadas
            ActionChains(driver).move_to_element(elem).perform()
            time.sleep(1)
            
            # 4. Inyectamos valor y disparamos todo por JS
            driver.execute_script(f"""
                var el = arguments[0];
                el.value = '{valor}';
                var evt = document.createEvent('HTMLEvents');
                evt.initEvent('change', true, true);
                el.dispatchEvent(evt);
                if(window.jQuery) {{ jQuery(el).trigger('change'); }}
                if(typeof el.onchange === 'function') {{ el.onchange(); }}
            """, elem)
            
            # 5. Sleep estático bloqueante
            time.sleep(5)

        print("📍 Seleccionando Córdoba...")
        inyectar_seleccion("prov", "5")

        print("🏢 Seleccionando Lumasa...")
        inyectar_seleccion("empresa", "5=6=-1:0")
        
        # LÓGICA DE LÍNEA SEGÚN DESTINO
        print("🚌 Seleccionando Línea...")
        texto_linea = 'CORDOBA - LA FALDA' if str(destino_id) == '81' else 'CORDOBA - RIO TERCERO'
        
        elem_linea = driver.find_element(By.XPATH, "//select[contains(@id, 'linea')]")
        opciones_linea = elem_linea.find_elements(By.TAG_NAME, 'option')
        valor_linea = ""
        for op in opciones_linea:
            if texto_linea in op.text:
                valor_linea = op.get_attribute("value")
                break
                
        if valor_linea:
            inyectar_seleccion("linea", valor_linea)
            print(f"✅ Línea seleccionada ({texto_linea}): value {valor_linea}")
        else:
            print(f"⚠️ Alerta: No se encontró la línea {texto_linea} en las opciones.")

        print("⏳ Esperando 5 segundos MUY obligatorios para carga de pueblos...")
        time.sleep(5)

        print("🔄 Seleccionando Origen y Destino...")
        origen_elem = driver.find_element(By.XPATH, "//select[contains(@id, 'origen')]")
        opciones_origen = origen_elem.find_elements(By.TAG_NAME, 'option')
        print(f"📋 Opciones en Origen: {len(opciones_origen)}")

        inyectar_seleccion("origen", str(origen_id))
        inyectar_seleccion("destino", str(destino_id))
        
        # 4. Clic en Buscar vía JS
        print("🔍 Clic en Buscar...")
        driver.execute_script("document.getElementById('buscar').click();")
        time.sleep(5)

        html = driver.page_source
        
        # 6. ANALISIS DE RESULTADOS
        coches_encontrados = re.findall(r"Coche\s*:?\s*(\d+)", html)
        print(f"📊 Coches detectados en el HTML: {coches_encontrados}")

        if coches_encontrados:
            nro_coche = coches_encontrados[0]
            # Buscamos el link q=lat,lon
            patron_gps = rf"Coche\s*:?\s*{nro_coche}.*?q=([-0-9.]+),([-0-9.]+)"
            match_gps = re.search(patron_gps, html, re.DOTALL | re.IGNORECASE)
            
            if match_gps:
                print(f"✅ ¡EXITO! Coche {nro_coche} encontrado en Lat: {match_gps.group(1)}, Lon: {match_gps.group(2)}")
            else:
                print(f"⚠️ Vi el coche {nro_coche} pero NO encontré el link de GPS en el código.")
        else:
            print("❌ LA TABLA ESTÁ VACÍA PARA EL BOT. Mirá la ventana de Brave, ¿aparece el coche?")
            input("Presioná Enter para cerrar el navegador después de revisar...")

    except Exception as e:
        print(f"💥 ERROR: {e}")
        try:
            with open("error_radar.html", "w", encoding="utf-8") as f:
                f.write(driver.page_source)
            print("💾 Se guardó HTML en error_radar.html para debugear.")
        except Exception as file_error:
            print(f"⚠️ No se pudo guardar el archivo HTML: {file_error}")
    finally:    
        driver.quit()

# PROBAMOS BIALET (74) A CASA GRANDE (81)
probar_rastreo_manual("74", "81")
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.action_chains import ActionChains

def get_options():
    options = webdriver.ChromeOptions()
    options.binary_location = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
    options.add_argument("--headless=new")
    driver = webdriver.Chrome(options=options)
    
    try:
        driver.get("https://micronauta.dnsalias.net/usuario/")
        time.sleep(5)
        
        frames = driver.find_elements(By.TAG_NAME, "frame")
        if not frames: frames = driver.find_elements(By.TAG_NAME, "iframe")
        if frames: driver.switch_to.frame(frames[0])
            
        def inyectar(fid, val):
            e = driver.find_element(By.XPATH, f"//select[contains(@id, '{fid}')]")
            driver.execute_script("arguments[0].value = arguments[1]; arguments[0].dispatchEvent(new Event('change'));", e, val)
            time.sleep(2)
            
        inyectar("prov", "5")
        inyectar("empresa", "5=6=-1:0")
        
        # Linea
        elem = driver.find_element(By.XPATH, "//select[contains(@id, 'linea')]")
        for op in elem.find_elements(By.TAG_NAME, 'option'):
            if 'CORDOBA - RIO TERCERO' in op.text:
                inyectar("linea", op.get_attribute("value"))
                break
        
        time.sleep(5)
        
        o_elem = driver.find_element(By.XPATH, "//select[contains(@id, 'origen')]")
        res = []
        for op in o_elem.find_elements(By.TAG_NAME, 'option'):
            res.append(f"{op.text}: {op.get_attribute('value')}")
            
        with open("ids.txt", "w", encoding="utf-8") as f:
            f.write(" | ".join(res))
        
    finally:
        driver.quit()

get_options()

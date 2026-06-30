"""
Preprocesa la foto antes de pasarla a chafa:
- Convierte a escala de grises
- Aumenta contraste y brillo
- Afila bordes
- Guarda como portrait-processed.jpeg
"""
from PIL import Image, ImageEnhance, ImageFilter

src = "docs/portrait.jpeg"
dst = "docs/portrait-processed.jpeg"

img = Image.open(src).convert("L")  # escala de grises

# Aumentar contraste
img = ImageEnhance.Contrast(img).enhance(2.2)

# Aumentar brillo ligeramente
img = ImageEnhance.Brightness(img).enhance(1.1)

# Afilar bordes
img = img.filter(ImageFilter.SHARPEN)
img = img.filter(ImageFilter.SHARPEN)

img.save(dst, quality=95)
print(f"Guardado en {dst}")

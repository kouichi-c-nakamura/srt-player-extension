from PIL import Image

src = Image.open("extension/SRT_128.png")
src.resize((16, 16), Image.Resampling.LANCZOS).save("extension/SRT_16.png")
src.resize((48, 48), Image.Resampling.LANCZOS).save("extension/SRT_48.png")
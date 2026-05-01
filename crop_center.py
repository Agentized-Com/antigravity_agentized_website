from PIL import Image

def crop_center(image_path, crop_percent=0.1):
    try:
        img = Image.open(image_path)
        width, height = img.size
        
        left = width * crop_percent
        top = height * crop_percent
        right = width * (1 - crop_percent)
        bottom = height * (1 - crop_percent)
        
        cropped_img = img.crop((left, top, right, bottom))
        cropped_img.save(image_path)
        print(f"Successfully cropped {image_path}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    crop_center("final_cover_3d_left.png", 0.15) # Crop 15% from edges = zoom in

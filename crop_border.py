from PIL import Image, ImageChops

def remove_border(image_path):
    try:
        img = Image.open(image_path)
        bg = Image.new(img.mode, img.size, (255, 255, 255, 255))
        diff = ImageChops.difference(img, bg)
        diff = ImageChops.add(diff, diff, 2.0, -100)
        bbox = diff.getbbox()
        if bbox:
            cropped_img = img.crop(bbox)
            cropped_img.save(image_path)
            print(f"Successfully cropped {image_path}")
        else:
            print("No border detected or image is empty")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    remove_border("future_city.png")

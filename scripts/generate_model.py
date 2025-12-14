import os
from gradio_client import Client, handle_file
import shutil
import time

# Paths - Updated to use split files provided by user
BASE_DIR = "/Users/jeffonsrud/.gemini/antigravity/brain/75d6f7f5-3347-4f03-8378-7ec10ff269e4"
IMG_FRONT = os.path.join(BASE_DIR, "samurai_front.jpeg")
IMG_BACK = os.path.join(BASE_DIR, "Samurai_back.jpeg")
IMG_LEFT = os.path.join(BASE_DIR, "samurai_left.jpeg")
# IMG_ISO = os.path.join(BASE_DIR, "samurai_iso.jpeg") 
# IMG_TOP = os.path.join(BASE_DIR, "samurai_top.jpeg") 
# Note: API might not accept Top/Iso directly if endpoints are named 'mv_image_front', etc.
# Typically multiview models take Front, Back, Left, Right.
# We have Front, Back, Left. We can infer Right or leave it None.
# Usually 4 views are best. If we lack Right, we can try without it or duplicate Left (flipped).
# Let's try passing Front, Back, Left.

OUTPUT_DIR = "public/models"
os.makedirs(OUTPUT_DIR, exist_ok=True)

def generate_model():
    print("Connecting to Tencent/Hunyuan3D-2 Client...")
    client = Client("Tencent/Hunyuan3D-2")
    
    print("Calling /generation_all (this may take 1-2 minutes)...")
    try:
        # Use Front as the main conditioning image
        
        result = client.predict(
            caption="Japanese Samurai, intricate armor, game asset",
            image=handle_file(IMG_FRONT),
            mv_image_front=handle_file(IMG_FRONT),
            mv_image_back=handle_file(IMG_BACK),
            mv_image_left=handle_file(IMG_LEFT), 
            mv_image_right=None, # We don't have explicit right, let model infer or usage logic handles it
            steps=50, # Increased steps for quality
            guidance_scale=5.0,
            seed=1234,
            octree_resolution=256,
            check_box_rembg=True,
            num_chunks=8000,
            randomize_seed=True,
            api_name="/generation_all"
        )
        
        # Result: (file, file, output, mesh_stats, seed)
        obj_file = result[0]
        tex_file = result[1]
        
        print(f"Generation complete. Result files: {obj_file}, {tex_file}")
        
        if not obj_file:
            print("Error: No OBJ file returned.")
            return

        print("Calling /on_export_click to convert to GLB...")
        export_result = client.predict(
            file_out=handle_file(obj_file),
            file_out2=handle_file(tex_file),
            file_type='glb',
            reduce_face=False,
            export_texture=True,
            target_face_num=10000,
            api_name="/on_export_click"
        )
        
        download_path = export_result[1]
        print(f"GLB generated at: {download_path}")
        
        if download_path:
            final_path = os.path.join(OUTPUT_DIR, "samurai.glb")
            shutil.copy(download_path, final_path)
            print(f"Successfully saved to {final_path}")
        else:
            print("Error: GLB download path missing.")

    except Exception as e:
        print(f"API Call Failed: {e}")

if __name__ == "__main__":
    # Retry logic if needed
    for i in range(3):
        print(f"Attempt {i+1}...")
        try:
            generate_model()
            break
        except Exception as e:
            print(f"Attempt failed: {e}")
            time.sleep(5)

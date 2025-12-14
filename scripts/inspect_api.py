from gradio_client import Client

print("Connecting to Tencent/Hunyuan3D-2...")
client = Client("Tencent/Hunyuan3D-2")
print("Connection successful. Inspecting API...")
client.view_api()

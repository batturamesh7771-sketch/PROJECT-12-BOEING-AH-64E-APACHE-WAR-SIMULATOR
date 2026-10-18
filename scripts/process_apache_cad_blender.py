# process_apache_cad_blender.py
# Uses Blender 5.2.1 LTS to import the 1,480-part Apache OBJ CAD model,
# setup PBR Principled BSDF shaders, organize into Body/MainRotor/TailRotor hierarchy,
# and export a pristine binary GLTF/GLB model for the web simulator.

import bpy
import os

OBJ_PATH = r"E:\Users\user\Downloads\Boeing_AH64E_Apache_1480Parts_Master.obj"
OUT_GLB_DOWNLOADS = r"E:\Users\user\Downloads\Boeing_AH64E_Apache_Master_Blender.glb"
OUT_GLB_SCRATCH = r"C:\Users\user\.gemini\antigravity\scratch\apache_studio\Boeing_AH64E_Apache_Master_Blender.glb"

# 1. Reset scene
bpy.ops.wm.read_factory_settings(use_empty=True)

# 2. Import OBJ model
print("Importing OBJ CAD model into Blender 5.2...")
if hasattr(bpy.ops.wm, 'obj_import'):
    bpy.ops.wm.obj_import(filepath=OBJ_PATH)
else:
    bpy.ops.import_scene.obj(filepath=OBJ_PATH)

print(f"Imported {len(bpy.data.objects)} objects.")

# 3. Create high-fidelity military PBR materials
def get_or_create_mat(name, color_rgba, metallic=0.2, roughness=0.6, transmission=0.0):
    mat = bpy.data.materials.get(name)
    if not mat:
        mat = bpy.data.materials.new(name=name)
        mat.use_nodes = True
        bsdf = mat.node_tree.nodes.get("Principled BSDF")
        if bsdf:
            if "Base Color" in bsdf.inputs:
                bsdf.inputs["Base Color"].default_value = color_rgba
            if "Metallic" in bsdf.inputs:
                bsdf.inputs["Metallic"].default_value = metallic
            if "Roughness" in bsdf.inputs:
                bsdf.inputs["Roughness"].default_value = roughness
            if "Transmission Weight" in bsdf.inputs:
                bsdf.inputs["Transmission Weight"].default_value = transmission
            elif "Transmission" in bsdf.inputs:
                bsdf.inputs["Transmission"].default_value = transmission
    return mat

mat_olive = get_or_create_mat("PBR_OliveDrab_CARC", (0.24, 0.28, 0.20, 1.0), metallic=0.15, roughness=0.68)
mat_gunmetal = get_or_create_mat("PBR_Gunmetal_Composite", (0.12, 0.14, 0.16, 1.0), metallic=0.82, roughness=0.38)
mat_glass = get_or_create_mat("PBR_Canopy_Glass", (0.1, 0.18, 0.15, 1.0), metallic=0.05, roughness=0.12, transmission=0.82)
mat_sensor = get_or_create_mat("PBR_TADS_Sensor", (0.05, 0.35, 0.65, 1.0), metallic=0.4, roughness=0.25)

# 4. Assign materials based on object names
main_rotor_objs = []
tail_rotor_objs = []
body_objs = []

for obj in bpy.data.objects:
    if obj.type != 'MESH':
        continue
    
    n = obj.name.lower()
    obj.data.materials.clear()
    
    if any(k in n for k in ['glass', 'canopy', 'windshield']):
        obj.data.materials.append(mat_glass)
    elif any(k in n for k in ['sensor', 'lens', 'tads_optic', 'flir']):
        obj.data.materials.append(mat_sensor)
    elif any(k in n for k in ['gun', 'm230', 'barrel', 'chain', 'hydra', 'hellfire', 'pylon', 'mast', 'hub']):
        obj.data.materials.append(mat_gunmetal)
    else:
        obj.data.materials.append(mat_olive)

    if any(k in n for k in ['mainrotor', 'main_rotor', 'blade', 'swashplate']) and not any(k in n for k in ['tail', 'fin']):
        main_rotor_objs.append(obj)
    elif any(k in n for k in ['tailrotor', 'tail_rotor', 'antitorque']):
        tail_rotor_objs.append(obj)
    else:
        body_objs.append(obj)

print(f"Categorized objects: Body={len(body_objs)}, MainRotor={len(main_rotor_objs)}, TailRotor={len(tail_rotor_objs)}")

# Create parent empty nodes so Three.js GLTFLoader can easily find and animate them
main_rotor_parent = bpy.data.objects.new("MainRotor", None)
bpy.context.scene.collection.objects.link(main_rotor_parent)
for obj in main_rotor_objs:
    obj.parent = main_rotor_parent

tail_rotor_parent = bpy.data.objects.new("TailRotor", None)
bpy.context.scene.collection.objects.link(tail_rotor_parent)
for obj in tail_rotor_objs:
    obj.parent = tail_rotor_parent

body_parent = bpy.data.objects.new("Body", None)
bpy.context.scene.collection.objects.link(body_parent)
for obj in body_objs:
    obj.parent = body_parent

# 5. Export to binary GLTF (.glb)
print("Exporting binary GLB to Downloads...")
bpy.ops.export_scene.gltf(
    filepath=OUT_GLB_DOWNLOADS,
    export_format='GLB',
    use_selection=False,
    export_apply=True
)

print("Exporting binary GLB to Scratch...")
bpy.ops.export_scene.gltf(
    filepath=OUT_GLB_SCRATCH,
    export_format='GLB',
    use_selection=False,
    export_apply=True
)

print("SUCCESS: Blender GLB export complete!")

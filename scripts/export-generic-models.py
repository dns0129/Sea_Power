"""Export edited model collections without rebuilding/overwriting their art.
blender dist/assets/models/generic-fleet.blend --background --python scripts/export-generic-models.py
Optional after '--': one or more model keys, e.g. fighter destroyer.
"""
import bpy
import sys
from pathlib import Path
from mathutils import Vector

out=Path(__file__).resolve().parents[1]/'dist/assets/models'
requested=set(sys.argv[sys.argv.index('--')+1:]) if '--' in sys.argv else set()
collections=[c for c in bpy.data.collections if c.get('model_key') and
    (not requested or c['model_key'] in requested)]
if not collections:
    raise RuntimeError('No matching model collections in this Blender file.')
for collection in collections:
    bpy.ops.object.select_all(action='DESELECT')
    # Only root objects need translation; any added child parts follow parents.
    roots=[o for o in collection.all_objects if o.parent not in collection.all_objects.values()]
    locations={o:o.location.copy() for o in roots}
    origin=Vector(collection['export_origin'])
    try:
        for obj in roots:obj.location-=origin
        for obj in collection.all_objects:obj.select_set(True)
        bpy.context.view_layer.objects.active=next(iter(collection.all_objects))
        bpy.ops.export_scene.gltf(filepath=str(out/f"generic-{collection['model_key']}.glb"),
            export_format='GLB',use_selection=True,export_apply=True,export_yup=True,
            export_animations=False,export_cameras=False,export_lights=False,export_extras=True)
    finally:
        for obj,location in locations.items():obj.location=location
    print('EXPORTED EDITED MODEL',collection['model_key'],flush=True)

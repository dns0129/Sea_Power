"""Original, editable Sea Power blockout fleet. Run with Blender 4.3+:
blender --background --python scripts/build-generic-models.py
Coordinates: metres, Z up, bow/nose +Y, origin at waterline (aircraft: centre).
The GLB export converts to Y up, nose -Z. No purchased models or textures.
"""
import bpy
import math
import json
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'dist/assets/models'
OUT.mkdir(parents=True, exist_ok=True)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
for c in list(bpy.data.collections):
    if c.name != 'Collection':
        bpy.data.collections.remove(c)


def material(name, color, metal=0, rough=.5):
    m = bpy.data.materials.new(name)
    m.diffuse_color = (*color, 1)
    m.use_nodes = True
    p = m.node_tree.nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value = (*color, 1)
    p.inputs['Metallic'].default_value = metal
    p.inputs['Roughness'].default_value = rough
    return m


HULL = material('Naval grey · hull', (.32, .39, .43), .35, .42)
LIGHT = material('Upperworks grey', (.53, .60, .62), .25, .42)
DECK = material('Non-slip flight deck', (.038, .056, .068), .12, .82)
DARK = material('Machinery / exhaust', (.055, .075, .085), .55, .36)
GLASS = material('Smoked bridge glass', (.055, .17, .22), .65, .18)
WHITE = material('Deck markings / radomes', (.79, .82, .79), .05, .58)
YELLOW = material('Safety ochre', (.83, .55, .16), .12, .58)
RED = material('Waterline oxide / port light', (.30, .09, .075), .18, .55)
GREEN = material('Starboard light', (.15, .6, .42), .12, .35)
AIR = material('Aircraft low visibility grey', (.51, .56, .59), .32, .4)
CANOPY = material('Tinted aircraft canopy', (.09, .24, .29), .65, .12)
MATS = [HULL, LIGHT, DECK, DARK, GLASS, WHITE, YELLOW, RED, GREEN, AIR, CANOPY]
collection = None
prefix = ''


def finish(obj, name, mat):
    obj.name = prefix + '_' + name
    for c in list(obj.users_collection):
        c.objects.unlink(obj)
    collection.objects.link(obj)
    obj.data.materials.append(mat)
    return obj


def bevel(obj, amount):
    mod = obj.modifiers.new('Soft fabricated edges', 'BEVEL')
    mod.width = amount
    mod.segments = 2
    mod = obj.modifiers.new('Weighted corner normals', 'WEIGHTED_NORMAL')
    return obj


def box(name, pos, size, mat=HULL, edge=0, rz=0):
    bpy.ops.mesh.primitive_cube_add(size=1, location=pos)
    obj = finish(bpy.context.object, name, mat)
    obj.scale = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.rotation_euler.z = rz
    if edge:
        bevel(obj, edge)
    return obj


def cylinder(name, pos, radius, depth, mat=HULL, vertices=20, direction=None, r2=None):
    bpy.ops.mesh.primitive_cone_add(vertices=vertices, radius1=radius,
        radius2=radius if r2 is None else r2, depth=depth, location=pos)
    obj = finish(bpy.context.object, name, mat)
    if direction:
        obj.rotation_euler = Vector(direction).to_track_quat('Z', 'Y').to_euler()
    for p in obj.data.polygons:
        p.use_smooth = len(p.vertices) == 4
    return obj


def sphere(name, pos, scale, mat=WHITE):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=20, ring_count=10, location=pos)
    obj = finish(bpy.context.object, name, mat)
    obj.scale = scale
    for p in obj.data.polygons:
        p.use_smooth = True
    return obj


def mesh(name, vertices, faces, mat):
    data = bpy.data.meshes.new(prefix + '_' + name)
    data.from_pydata(vertices, [], faces)
    data.update()
    obj = bpy.data.objects.new(prefix + '_' + name, data)
    collection.objects.link(obj)
    data.materials.append(mat)
    return obj


def plate(name, points, z, depth, mat=DECK):
    n = len(points)
    verts = [(x,y,z-depth) for x,y in points]+[(x,y,z) for x,y in points]
    faces = [tuple(reversed(range(n))), tuple(range(n,2*n))]
    faces += [(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
    return mesh(name, verts, faces, mat)


def line(name, a, b, radius=.08, mat=WHITE):
    va, vb = Vector(a), Vector(b)
    return cylinder(name, (va+vb)/2, radius, (vb-va).length, mat, 8, vb-va)


def hull(length, width, deck=6):
    # Stations from transom to a fine raised bow; ring sections have a real keel.
    stations = [(-.5,.68),(-.43,.91),(-.26,1),(.02,1),(.26,.88),(.40,.51),(.5,.025)]
    verts=[]
    for y,w in stations:
        lift=max(0,y-.2)*4
        verts += [(-width*w*.5,y*length,deck+lift),(-width*w*.5,y*length,.1),
            (-width*w*.31,y*length,-3.8),(0,y*length,-5),
            (width*w*.31,y*length,-3.8),(width*w*.5,y*length,.1),(width*w*.5,y*length,deck+lift)]
    faces=[tuple(reversed(range(7))), tuple(range((len(stations)-1)*7,len(stations)*7))]
    for s in range(len(stations)-1):
        for j in range(7):
            faces.append((s*7+j,s*7+(j+1)%7,(s+1)*7+(j+1)%7,(s+1)*7+j))
    obj=mesh('Hull',verts,faces,HULL)
    obj.data.materials.append(DECK)
    for index,face in enumerate(obj.data.polygons):
        if index>=2 and (index-2)%7==6:
            face.material_index=1
    bevel(obj,.18)
    pts=[(-width*w*.49,y*length) for y,w in stations]+[(width*w*.49,y*length) for y,w in reversed(stations)]
    plate('MainDeck',pts,deck+.12,.35,DECK)
    for side in [-1,1]:
        for (a,wa),(b,wb) in zip(stations[:-1],stations[1:]):
            line('Waterline', (side*width*wa*.5,a*length,.22),(side*width*wb*.5,b*length,.22),.12,DARK)
    return deck


def railings(length, width, z):
    for side in [-1,1]:
        x=width*.48*side
        for start,end in [(-length*.41,-length*.24),(length*.08,length*.25)]:
            line('Guardrail',(x,start,z+1),(x,end,z+1),.05,LIGHT)
            for j in range(6):
                y=start+(end-start)*j/5
                line('RailStanchion',(x,y,z),(x,y,z+1),.045,LIGHT)


def gun(y,z,size=1):
    cylinder('GunRing',(0,y,z+.25*size),1.9*size,.5*size,DARK)
    box('ForwardGun',(0,y,z+1.4*size),(3.6*size,4*size,2.2*size),LIGHT,.5*size)
    line('GunBarrel',(0,y+1.5*size,z+1.5*size),(0,y+7*size,z+2.2*size),.18*size,DARK)


def vls(y,z,rows=4):
    box('VLSRecess',(0,y,z+.12),(6.9,rows*1.6+.5,.3),DARK,.12)
    for x in [-2.4,-.8,.8,2.4]:
        for j in range(rows):
            box('VLSCell',(x,y+(j-(rows-1)/2)*1.6,z+.34),(1.25,1.25,.16),LIGHT,.08)


def bridge(y,z,width=12):
    box('Superstructure',(0,y,z+3.2),(width,width*1.65,6.4),HULL,.9)
    box('Bridge',(0,y+2,z+7.2),(width*1.1,width*.77,3.2),LIGHT,.55)
    for x in [-.41,-.2,0,.2,.41]:
        box('BridgeWindow',(x*width,y+width*.385+2.02,z+7.65),(width*.14,.1,1.05),GLASS,.06)
    for side in [-1,1]:
        box('WingWindow',(side*width*.552,y+2,z+7.65),(.1,width*.57,1.05),GLASS)
        box('NavigationLight',(side*width*.57,y+4,z+6.6),(.3,.65,.25),GREEN if side>0 else RED)
    box('MastBase',(0,y-1,z+11),(width*.37,width*.4,5.3),LIGHT,.4)
    cylinder('MainMast',(0,y-1,z+18),.26,10,LIGHT,12)
    box('RadarSpinner',(0,y-1,z+20.5),(7,.5,1.2),DARK,.1)
    for sign in [-1,1]:
        box('AESAArray',(sign*width*.195,y-1,z+11.5),(.18,width*.27,2.1),DARK,.05)
    sphere('SATCOM',(-width*.3,y-3,z+10),(1.25,1.25,1.3))
    line('Antenna',(width*.27,y-1,z+9),(width*.27,y-1,z+16),.075,DARK)


def helipad(y,z,w=14):
    for side in [-1,1]:
        box('HelipadEdge',(side*w*.44,y,z+.035),(.16,w*.93,.07),WHITE)
        box('HelipadEdge',(0,y+side*w*.46,z+.035),(w*.88,.16,.07),WHITE)
        box('HelipadH',(side*w*.14,y,z+.05),(.28,w*.44,.09),WHITE)
    box('HelipadH',(0,y,z+.05),(w*.3,.28,.09),WHITE)
    # Octagonal landing target.
    for j in range(16):
        a=j*math.tau/16;b=(j+1)*math.tau/16
        line('HelipadRing',(w*.36*math.cos(a),y+w*.36*math.sin(a),z+.05),
            (w*.36*math.cos(b),y+w*.36*math.sin(b),z+.05),.065,WHITE)


def escort(kind):
    is_ddg=kind=='destroyer'; L,W=(158,20) if is_ddg else (128,16)
    z=hull(L,W,6 if is_ddg else 4.8)
    gun(L*.335,z,1 if is_ddg else .8)
    vls(L*.20,z,5 if is_ddg else 3)
    bridge(L*.03,z,12 if is_ddg else 10)
    box('AftHangar',(0,-L*.24,z+3.1),(W*.72,L*.17,6.2),HULL,.65)
    box('HangarDoor',(0,-L*.326,z+2.3),(W*.53,.12,4.6),DARK,.08)
    box('HangarDoorPanels',(0,-L*.327,z+2.25),(W*.5,.14,.13),LIGHT)
    box('Funnel',(0,-L*.105,z+6.5),(5,7,6),LIGHT,.5)
    for x in [-1.5,1.5]:
        cylinder('Exhaust',(x,-L*.105,z+9.65),1.1,.45,DARK)
    for side in [-1,1]:
        for j in range(4):
            cylinder('ASMLauncher',(side*(3+j*.62),-L*.13,z+1.7),.37,4.7,LIGHT,12,(side*.8,0,.7))
        box('LifeRaft',(side*W*.4,-L*.21,z+2),(.9,4.2,1.15),WHITE,.4)
        cylinder('CIWSBase',(side*W*.31,-L*.23,z+7),.9,1.9,LIGHT)
        sphere('CIWSRadar',(side*W*.31,-L*.23,z+8.3),(.85,.85,1.1))
    helipad(-L*.405,z+.2,W*.8)
    railings(L,W,z)


def carrier():
    L,W=310,43;z=hull(L,W,12)
    pts=[(-30,-148),(28,-148),(35,-112),(31,-42),(31,115),(22,153),(-22,153),(-27,93),(-35,30),(-35,-100)]
    plate('FlightDeck',pts,z+2,1.8,DECK)
    for side in [-1,1]:
        box('CatapultTrack',(side*11,73,z+2.05),(.8,125,.1),DARK)
        box('CatapultMarking',(side*11+1,73,z+2.13),(.22,125,.08),WHITE)
    # Angled landing lane and segmented centreline.
    for side in [-1,1]:
        line('LandingLane',(side*6-16,-142,z+2.1),(side*6+5,49,z+2.1),.18,WHITE)
    for j in range(14):
        y=-133+j*12;x=-16+(y+142)/191*21
        box('LandingCentreline',(x,y,z+2.14),(.4,5.4,.12),YELLOW,rz=-.11)
    for j in range(4):
        line('ArrestingWire',(-29,-103+j*8,z+2.14),(0,-103+j*8,z+2.14),.13,WHITE)
    box('Island',(23,-5,z+8),(12,47,13),HULL,1)
    box('IslandBridge',(23,8,z+16),(14,17,5),LIGHT,.7)
    box('IslandGlass',(23,16.6,z+16.4),(12,.12,1.4),GLASS)
    for sign in [-1,1]:
        box('IslandGlass',(23+sign*7.05,8,z+16.4),(.12,15,1.4),GLASS)
    box('IslandMast',(23,-5,z+25),(4,6,14),LIGHT,.4)
    box('RadarSpinner',(23,-5,z+33),(12,.7,2.4),DARK,.15)
    cylinder('IslandAntenna',(23,-5,z+38),.16,10,DARK)
    for y in [-18,13]:
        sphere('IslandRadome',(23,y,z+21),(2.4,2.4,2.4))
    for y in [-95,61]:
        box('DeckElevator',(29,y,z+2.06),(12,20,.12),HULL)
        for j in range(5):
            box('ElevatorSafety',(34.5,y-8+j*4,z+2.15),(.4,2.5,.1),YELLOW)
    # Parked deck aircraft, individually editable in the .blend library.
    for i,y in enumerate([-90,-66,-42,36,59,82]):
        x=-25 if i<3 else 21
        cylinder('ParkedJetFuselage',(x,y,z+3),.72,10,AIR,12,(0,1,0),.35)
        plate('ParkedJetWing',[(x-4,y-1),(x,y+2),(x+4,y-1),(x+2.8,y-2.5),(x-2.8,y-2.5)],z+3,.22,AIR)
        box('ParkedJetTail',(x,y-3.8,z+4),(.18,2,2),AIR,.1)
        sphere('ParkedJetCanopy',(x,y+2,z+3.8),(.5,1.6,.45),CANOPY)
    for x in [-24,26]:
        cylinder('SponsonCIWS',(x,-137,z+2.7),1.3,3,LIGHT)
        sphere('CIWSRadar',(x,-137,z+4.5),(1.2,1.2,1.3))


def supply():
    L,W=190,27;z=hull(L,W,7)
    bridge(-58,z,19)
    for y in [-28,3,31,55]:
        for x in [-7,7]:
            cylinder('CargoTank',(x,y,z+2.4),4.5,4.7,LIGHT)
            cylinder('TankHatch',(x,y,z+4.9),1.2,.3,DARK)
    for y in [-18,25]:
        for x in [-10,10]:
            cylinder('ReplenishmentMast',(x,y,z+9),.55,18,YELLOW)
        line('ReplenishmentGantry',(-10,y,z+17),(10,y,z+17),.45,YELLOW)
        line('CargoBoom',(0,y,z+13),(-18,y+8,z+11),.28,HULL)
        line('CargoBoom',(0,y,z+13),(18,y-8,z+11),.28,HULL)
    helipad(-80,z+.2,19)
    railings(L,W,z)


def submarine():
    sphere('PressureHull',(0,0,-.7),(5.1,53,5.1),DARK)
    box('Sail',(0,-5,5),(3.4,13,8),HULL,1.5)
    for y,h in [(-7,14),(-3,12)]:
        cylinder('Periscope',(0,y,h-2),.15,4,LIGHT,12)
    plate('BowPlanes',[(-10,27),(-2,30),(2,30),(10,27),(9,24),(-9,24)],1,.5,DARK)
    plate('TailPlanes',[(-10,-41),(0,-38),(10,-41),(9,-44),(-9,-44)],0,.6,DARK)
    box('Rudder',(0,-43,1),(.6,8,11),DARK,.5)
    cylinder('PropellerHub',(0,-53,-.5),1.2,3,HULL,16,(0,1,0),.25)
    for j in range(7):
        a=j*math.tau/7
        line('PropellerBlade',(0,-53,-.5),(3.5*math.cos(a),-53.6,3.5*math.sin(a)-.5),.55,YELLOW)


def aircraft(kind):
    large=kind in ['bomber','awacs'];L=39 if large else 19
    radius=1.7 if large else .95
    # Elliptical station fuselage, with a pointed radome and tapered afterbody.
    stations=[(-.5,.45),(-.39,.78),(-.15,1),(.12,1),(.32,.85),(.44,.45),(.5,.025)]
    verts=[];n=16
    for y,w in stations:
        for j in range(n):
            a=j*math.tau/n
            verts.append((math.cos(a)*radius*w,y*L,math.sin(a)*radius*w*.83))
    faces=[tuple(reversed(range(n))),tuple(range((len(stations)-1)*n,len(stations)*n))]
    for s in range(len(stations)-1):
        for j in range(n):
            faces.append((s*n+j,s*n+(j+1)%n,(s+1)*n+(j+1)%n,(s+1)*n+j))
    obj=mesh('Fuselage',verts,faces,AIR)
    for p in obj.data.polygons:p.use_smooth=True
    span=15 if large else 6.6
    for sign in [-1,1]:
        pts=[(sign*.6,L*.18),(sign*span,-L*.17),(sign*span,-L*.28),(sign*2,-L*.23)]
        plate('SweptWing',pts,-.05,.35 if large else .17,AIR)
        pts=[(sign*.4,-L*.29),(sign*span*.38,-L*.43),(sign*span*.38,-L*.48),(sign*.4,-L*.43)]
        plate('Tailplane',pts,.35,.16,AIR)
        if not large:
            fin=mesh('TwinTail',[(sign*.8,-7,.5),(sign*1.7,-8.7,3.3),(sign*2,-5.7,3.0),(sign*.8,-4,.6)],[(0,1,2,3)],AIR)
            solid=fin.modifiers.new('Fin thickness','SOLIDIFY');solid.thickness=.14
            cylinder('Exhaust',(sign*.65,-L*.445,-.1),.54,1.6,DARK,20,(0,1,0))
            cylinder('EngineInterior',(sign*.65,-L*.492,-.1),.36,.05,RED,20,(0,1,0))
            cylinder('Intake',(sign*1.05,-1,-.22),.48,2.5,DARK,16,(0,1,0))
            for x in [sign*3,sign*4.5]:
                box('Pylon',(x,-2,-.45),(.16,1.9,.8),DARK,.08)
                cylinder('TrainingMissile',(x,-1.5,-.95),.14,3.4,WHITE,12,(0,1,0),.025)
                plate('MissileFin',[(x-.4,-2.4),(x,-1.8),(x+.4,-2.4),(x,-2.7)],-1,.06,WHITE)
            line('WingtipLight',(sign*span,-L*.18,0),(sign*span,-L*.18,.15),.15,GREEN if sign>0 else RED)
        else:
            for x in [sign*5,sign*8.5]:
                box('EnginePylon',(x,-2,-1.1),(.4,3,2),HULL,.1)
                cylinder('EngineNacelle',(x,-2,-2),.78,4.8,AIR,20,(0,1,0))
                cylinder('EngineIntake',(x,.43,-2),.61,.1,DARK,20,(0,1,0))
    if large:
        fin=mesh('VerticalTail',[(-.12,-17,.5),(-.12,-17,7),(-.12,-11,6),(-.12,-9,.5)],[(0,1,2,3)],AIR)
        mod=fin.modifiers.new('Fin thickness','SOLIDIFY');mod.thickness=.24
        sphere('Cockpit',(0,L*.35,.7),(1.3,2.6,.8),CANOPY)
    else:
        sphere('Canopy',(0,3.7,.82),(.69,2.6,.57),CANOPY)
        line('CanopyFrame',(-.48,5.1,1),(.48,5.1,1),.075,HULL)
    if kind=='awacs':
        for x in [-.8,.8]:
            box('RadarPylon',(x,-1.5,3),(.3,4.5,4),HULL,.2)
        sphere('RadarSpinner',(0,-1.5,5.6),(5.8,5.8,.65),DARK)
        cylinder('RadomeStripe',(0,-1.5,5.6),5.81,.17,WHITE,48)


def helicopter():
    sphere('Cabin',(0,1,0),(1.7,3.6,1.75),AIR)
    sphere('Cockpit',(0,3,.15),(1.48,1.45,1.3),CANOPY)
    box('CockpitPillar',(0,3.7,.4),(.18,.4,2.2),AIR,.05)
    cylinder('TailBoom',(0,-5,.6),.48,8,AIR,16,(0,-1,.1),.16)
    plate('Tailplane',[(-2.1,-8),(2.1,-8),(1.6,-9),(-1.6,-9)],1,.16,AIR)
    box('TailFin',(0,-8.8,1.8),(.22,1.6,3),AIR,.25)
    for side in [-1,1]:
        cylinder('Turboshaft',(side*.9,-.4,1.6),.58,3.5,HULL,16,(0,1,0))
        cylinder('EngineExhaust',(side*.9,-2.2,1.6),.43,.18,DARK,16,(0,1,0))
        for y in [-1.6,2]:
            line('LandingStrut',(side*1.1,y,-.8),(side*2,y,-2),.12,DARK)
        line('LandingSkid',(side*2,-2.4,-2),(side*2,3,-2),.15,DARK)
        cylinder('Torpedo',(side*2.05,-.5,-.9),.2,2.8,LIGHT,12,(0,1,0))
    cylinder('RotorMast',(0,-.1,2.4),.18,1.4,DARK)
    # Rotor mesh is one separately named animated object, with its origin at hub.
    verts=[];faces=[]
    for j in range(4):
        a=j*math.tau/4
        pts=[(.25,-.16),(7,-.35),(7,.12),(.25,.28)]
        for x,y in pts:verts.append((x*math.cos(a)-y*math.sin(a),x*math.sin(a)+y*math.cos(a),0))
        faces.append(tuple(range(j*4,j*4+4)))
    rotor=mesh('MainRotor',verts,faces,DARK);rotor.location=(0,-.1,3.1)
    mod=rotor.modifiers.new('Blade thickness','SOLIDIFY');mod.thickness=.055
    cylinder('RotorHub',(0,-.1,3.2),.32,.3,HULL)
    cylinder('TailRotor',(0,-8.8,1.5),1.1,.12,DARK,12,(1,0,0))


def facility():
    box('ConcretePad',(0,0,-.15),(28,34,.3),LIGHT,.3)
    box('OperationsBuilding',(-5,-3,2.4),(10,12,4.8),HULL,.4)
    box('Roof',(-5,-3,5),(11,13,.4),DECK,.15)
    for x in [-8,-5,-2]:box('Window',(x,3.05,3),(1.5,.1,.8),GLASS)
    cylinder('RadarMast',(6,-5,7),.3,14,LIGHT)
    box('RadarSpinner',(6,-5,14),(8,.5,2),DARK,.15)
    for y in [6,11]:
        box('LauncherTruck',(5,y,1.5),(4,4,2),DARK,.25)
        for x in [4,6]:cylinder('LaunchTube',(x,y,4),.5,5.5,LIGHT,12,(0,.4,1))


BUILDERS = {
    'carrier': ('通用航空母舰',310,carrier),
    'destroyer': ('通用驱逐舰',158,lambda:escort('destroyer')),
    'frigate': ('通用护卫舰',128,lambda:escort('frigate')),
    'supply': ('通用补给舰',190,supply),
    'submarine': ('通用攻击潜艇',106,submarine),
    'fighter': ('通用多用途战机',19,lambda:aircraft('fighter')),
    'bomber': ('通用攻击机',39,lambda:aircraft('bomber')),
    'awacs': ('通用预警机',39,lambda:aircraft('awacs')),
    'helicopter': ('通用舰载直升机',18,helicopter),
    'facility': ('通用岸基设施',34,facility),
}
manifest={'version':1,'units':'metres','forward':'-Z','up':'+Y',
    'description':'原创通用示意模型，非具体型号复刻；游戏参数独立于外观。',
    'source':'generic-fleet.blend','models':{}}
for index,(key,(label,length,build)) in enumerate(BUILDERS.items()):
    prefix=key
    collection=bpy.data.collections.new(key+' · '+label)
    bpy.context.scene.collection.children.link(collection)
    build()
    bpy.ops.object.select_all(action='DESELECT')
    for obj in collection.objects:
        obj.select_set(True)
    bpy.context.view_layer.objects.active=next(iter(collection.objects))
    bpy.ops.export_scene.gltf(filepath=str(OUT/f'generic-{key}.glb'),export_format='GLB',
        use_selection=True,export_apply=True,export_yup=True,export_animations=False,
        export_cameras=False,export_lights=False,export_extras=True)
    manifest['models'][key]={'name':label,'file':f'generic-{key}.glb','length':length,
        'parts':len(collection.objects)}
    for obj in collection.objects:
        obj.location.x+=(index%4)*380
        obj.location.y-=(index//4)*410
    collection['model_key']=key
    collection['export_origin']=[(index%4)*380,-(index//4)*410,0]
    collection['model_length']=length
    print('EXPORTED',key,flush=True)

(OUT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
bpy.ops.object.select_all(action='DESELECT')
bpy.context.scene.world.color=(.12,.16,.19)
bpy.context.scene['Asset notes']='Original generic blockout fleet. Metres. Model collections are arranged for editing. Export each collection centred at origin. Individual parts remain named and editable.'
bpy.context.preferences.filepaths.save_version=0
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'generic-fleet.blend'),compress=True)
print('FLEET SOURCE SAVED',flush=True)

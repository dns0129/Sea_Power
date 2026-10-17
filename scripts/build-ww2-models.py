"""Original generic WWII fleet, Blender 4.3+, no external model resources.
blender --background --python scripts/build-ww2-models.py
"""
import bpy
import math
import json
import importlib.util
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('fleet_shapes',ROOT/'scripts/build-generic-models.py')
m=importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)
OUT=ROOT/'dist/assets/models'
PAINT=m.material('WWII blue grey camouflage',(.16,.235,.29),.18,.55)
UNDERSIDE=m.material('WWII pale underside',(.48,.54,.56),.12,.7)
RUBBER=m.DARK

def turret(y,z,radius=2.8,barrels=2):
    m.cylinder('TurretBarbette',(0,y,z+.6),radius,1.2,m.DARK)
    m.box('NavalGunTurret',(0,y,z+2.1),(radius*1.9,5.2,3.1),m.HULL,.6)
    for j in range(barrels):
        x=(j-(barrels-1)/2)*.85
        m.line('MainGunBarrel',(x,y+2,z+2.2),(x,y+10,z+2.9),.18,m.DARK)

def bridge(y,z,w=9):
    m.box('LowerBridge',(0,y,z+3),(w,14,6),m.HULL,.45)
    m.box('Wheelhouse',(0,y+1,z+6.8),(w+2,7,2.4),m.LIGHT,.35)
    for x in [-3,-1.5,0,1.5,3]:m.box('BridgeWindow',(x,y+4.55,z+7.2),(1,.1,.8),m.GLASS)
    m.box('DirectorTower',(0,y-1,z+10),(4,4,4),m.HULL,.4)
    m.cylinder('OpticalDirector',(0,y-1,z+12.4),1.7,1,m.LIGHT)
    for sign in [-1,1]:
        m.line('TripodMast',(sign*2,y-4,z+5),(0,y-3,z+24),.18,m.DARK)
    m.line('Foremast',(0,y-2,z+8),(0,y-3,z+29),.15,m.DARK)
    m.line('MastCrossbeam',(-4,y-3,z+24),(4,y-3,z+24),.1,m.DARK)
    m.sphere('LookoutPost',(0,y-3,z+20),(1.25,1.25,.7),m.HULL)

def aa(x,y,z):
    m.cylinder('AAGunTub',(x,y,z+.3),1.3,.6,m.HULL)
    m.box('AAGunShield',(x,y,z+1.15),(2.2,.3,1.4),m.LIGHT,.1)
    for sign in [-1,1]:m.line('AAGunBarrel',(x+sign*.35,y,z+1.1),(x+sign*.35,y+2.6,z+2.2),.09,m.DARK)

def ww2carrier():
    L,W=250,29;z=m.hull(L,W,11)
    pts=[(-15,-124),(15,-124),(17,-114),(17,104),(12,124),(-12,124),(-17,104),(-17,-114)]
    m.plate('StraightFlightDeck',pts,z+1.5,1,m.DECK)
    for sign in [-1,1]:m.box('FlightDeckBoundary',(sign*14.5,0,z+1.56),(.18,222,.1),m.WHITE)
    for j in range(19):m.box('DeckCentreline',(0,-107+j*12,z+1.6),(.25,5,.12),m.WHITE)
    for j in range(6):m.line('ArrestingWire',(-14,-95+j*5,z+1.64),(14,-95+j*5,z+1.64),.07,m.WHITE)
    for y in [-64,21]:m.box('DeckElevator',(0,y,z+1.58),(11,16,.12),m.HULL)
    m.box('Island',(13,18,z+6),(7.5,31,10),m.HULL,.5)
    m.box('IslandBridge',(13,27,z+11.6),(8.5,10,3.5),m.LIGHT,.4)
    m.box('IslandWindows',(13,32.1,z+12),(7,.1,1),m.GLASS)
    for y in [8,17]:
        m.box('Funnel',(13,y,z+14),(4.5,5.5,7),m.HULL,.4)
        m.box('FunnelCap',(13,y,z+17.6),(4.5,5.5,.5),m.DARK,.2)
    m.line('IslandMast',(13,26,z+13),(13,25,z+33),.18,m.DARK)
    m.line('SignalYard',(8,25,z+27),(18,25,z+27),.1,m.DARK)
    for sign in [-1,1]:
        for y in [-94,-40,49,97]:aa(sign*18,y,z-1)
    # Parked piston aircraft, with straight wings and a single vertical tail.
    for y in [-76,-55,-33,50,73,96]:
        x=-10
        m.sphere('ParkedPropFuselage',(x,y,z+2.3),(.55,4.5,.55),PAINT)
        m.plate('ParkedPropWing',[(x-4.7,y-.8),(x-4.4,y+1),(x+4.4,y+1),(x+4.7,y-.8)],z+2.1,.16,PAINT)
        m.box('ParkedPropTail',(x,y-3,z+3),(.15,1.4,1.4),PAINT,.1)
        m.sphere('ParkedCanopy',(x,y+.6,z+2.9),(.42,1.2,.35),m.CANOPY)
        m.line('ParkedPropeller',(x-1,y+4.3,z+2.3),(x+1,y+4.3,z+2.3),.1,m.DARK)

def ww2escort(destroyer=False):
    L,W=(119,12) if destroyer else (188,19);z=m.hull(L,W,4 if destroyer else 5.8)
    bridge(14,z,7 if destroyer else 10)
    for y in [-8,-29]:
        m.cylinder('Funnel',(0,y,z+8),1.8 if destroyer else 2.6,9,m.HULL,16)
        m.cylinder('FunnelCap',(0,y,z+12.6),1.85 if destroyer else 2.65,.5,m.DARK,16)
    for y in ([42,29,-41] if destroyer else [69,49,-53,-75]):turret(y,z,1.65 if destroyer else 2.9,1 if destroyer else 2)
    for sign in [-1,1]:
        for y in [-34,-4,23]:aa(sign*W*.43,y,z+.5)
    if destroyer:
        for y in [-14,-28]:
            for x in [-1,0,1]:m.cylinder('TorpedoTube',(x,y,z+1.3),.32,5,m.DARK,12,(0,1,0))
    else:
        m.box('AircraftHandlingDeck',(0,-35,z+2.3),(14,14,1),m.DECK,.3)
        m.line('CatapultRail',(-8,-33,z+3),(8,-27,z+3),.25,m.HULL)
    m.railings(L,W,z)

def ww2battleship():
    L,W=250,33;z=m.hull(L,W,8.5)
    m.box('ArmouredCitadel',(0,-2,z+1),(25,128,2),m.DECK,.7)
    # Four twin main turrets, two superfiring pairs. Generic editable silhouette.
    for y,h in [(91,0),(65,3),(-67,3),(-93,0)]:
        old=set(m.collection.objects);turret(y,z+h,5.4,2)
        if y<0:
            for obj in set(m.collection.objects)-old:
                obj.location.x=-obj.location.x;obj.location.y=2*y-obj.location.y;obj.rotation_euler.z+=math.pi
    bridge(29,z+2,14)
    m.box('ArmouredConningTower',(0,39,z+7),(8,8,9),m.HULL,1.2)
    m.box('AdmiralBridge',(0,28,z+14),(16,9,3),m.LIGHT,.5)
    m.line('MainRangefinder',(-10,29,z+18),(10,29,z+18),.65,m.LIGHT)
    for y in [3,-25]:
        m.box('Funnel',(0,y,z+11),(10,13,19),m.HULL,1.6)
        m.box('FunnelCap',(0,y,z+20.6),(10.5,13.5,.8),m.DARK,1)
    m.box('AftSuperstructure',(0,-47,z+5),(13,17,10),m.HULL,.6)
    m.line('AftMast',(0,-44,z+10),(0,-45,z+31),.28,m.DARK)
    m.line('SignalYard',(-6,-45,z+25),(6,-45,z+25),.16,m.DARK)
    for sign in [-1,1]:
        for y in [-48,-19,13,48]:
            x=sign*13.7
            m.cylinder('SecondaryBarbette',(x,y,z+1.2),2.2,1.6,m.DARK)
            m.box('SecondaryTurret',(x,y,z+2.7),(4.5,4.7,2.8),m.HULL,.5)
            for dx in [-.5,.5]:m.line('SecondaryGunBarrel',(x+dx,y+1,z+2.8),(x+dx,y+6,z+3.3),.13,m.DARK)
        for y in [-102,-72,-39,-4,33,77]:aa(sign*15.8,y,z+1)
        for y in [-35,-11]:m.sphere('ShipsBoat',(sign*9,y,z+4),(1.4,5.5,.8),m.LIGHT)
        m.line('BoatCrane',(sign*8,-37,z+2),(sign*11,-28,z+11),.2,m.HULL)
    m.railings(L,W,z)

def propeller(y,z,r):
    verts=[];faces=[]
    for j in range(3):
        a=j*math.tau/3
        for x,h in [(.1,-.09),(r,-.19),(r,.12),(.1,.12)]:verts.append((x*math.cos(a)-h*math.sin(a),0,x*math.sin(a)+h*math.cos(a)))
        faces.append(tuple(range(j*4,j*4+4)))
    obj=m.mesh('Propeller',verts,faces,m.DARK);obj.location=(0,y,z)
    solid=obj.modifiers.new('Prop blade thickness','SOLIDIFY');solid.thickness=.045
    m.cylinder('PropellerSpinner',(0,y+.12,z),.25,.4,m.LIGHT,16,(0,1,0),.04)

def ww2plane(role):
    L=9 if role=='fighter' else 10.6 if role=='dive' else 12.4
    span=5.4 if role=='fighter' else 6.4 if role=='dive' else 7.3
    m.sphere('PistonFuselage',(0,-.2,.15),(.69,L*.48,.68),PAINT)
    m.sphere('PaleUnderside',(0,-.1,-.2),(.65,L*.44,.35),UNDERSIDE)
    m.cylinder('RadialEngine',(0,L*.33,.15),.76,1.25,PAINT,24,(0,1,0))
    m.cylinder('EngineOpening',(0,L*.395,.15),.67,.08,m.DARK,24,(0,1,0))
    propeller(L*.42,.15,1.2)
    for sign in [-1,1]:
        m.plate('StraightWing',[(sign*.35,1),(sign*span,.35),(sign*(span+.1),-.55),(sign*(span-.6),-1.3),(sign*.35,-1.1)],-.05,.17,PAINT)
        m.plate('HorizontalTail',[(sign*.2,-L*.31),(sign*2.25,-L*.35),(sign*2.35,-L*.43),(sign*.2,-L*.44)],.25,.13,PAINT)
        m.line('Aileron',(sign*span*.56,-.8,.055),(sign*span*.95,-.8,.055),.015,m.DARK)
        if role!='fighter':m.cylinder('ExternalBomb',(sign*2,-.2,-.55),.2,1.8,m.DARK,12,(0,1,0),.08)
    fin=m.mesh('SingleVerticalTail',[(0,-L*.28,.2),(0,-L*.37,2),(0,-L*.45,1.8),(0,-L*.46,.2)],[(0,1,2,3)],PAINT)
    solid=fin.modifiers.new('Tail thickness','SOLIDIFY');solid.thickness=.14
    m.sphere('Canopy',(0,.2,.72),(.5,1.5 if role=='fighter' else 2.2,.5),m.CANOPY)
    for y in [-.55,.2,.9]:m.line('CanopyFrame',(-.45,y,.85),(.45,y,.85),.04,PAINT)
    m.line('RadioAerial',(0,-.2,1.2),(0,-L*.36,1.8),.012,m.DARK)
    if role=='torpedo':m.cylinder('AerialTorpedo',(0,0,-.83),.28,3.8,m.DARK,16,(0,1,0),.14)

def ww2scout():
    m.sphere('FlyingBoatHull',(0,0,0),(1.5,10,1.4),PAINT)
    m.plate('FlyingBoatKeel',[(-1.1,6),(0,10),(1.1,6),(.9,-7),(-.9,-7)],-.6,.65,UNDERSIDE)
    m.box('WingPylon',(0,-1,2),(1.5,3,3),PAINT,.3)
    m.plate('HighWing',[(-15.5,-1.8),(-15.5,.5),(-3,1.7),(3,1.7),(15.5,.5),(15.5,-1.8)],3,.3,PAINT)
    for sign in [-1,1]:
        m.cylinder('EngineNacelle',(sign*4,1.8,3.2),.78,3,PAINT,20,(0,1,0))
        # Each propeller gets an independent pivot.
        old=set(m.collection.objects);propeller(3.35,3.2,1.65)
        for obj in set(m.collection.objects)-old:obj.location.x+=sign*4
        m.line('WingFloatStrut',(sign*13.4,-.4,2.8),(sign*13.4,-.4,-.7),.1,m.DARK)
        m.sphere('WingFloat',(sign*13.4,0,-.8),(.4,2,.45),PAINT)
        m.plate('Tailplane',[(sign*.3,-7),(sign*4.2,-7.5),(sign*4.4,-9),(sign*.3,-8.9)],1,.18,PAINT)
    m.box('VerticalTail',(0,-8,2.4),(.2,2.6,4),PAINT,.6)
    m.sphere('Cockpit',(0,5,1.05),(1.15,1.6,.65),m.CANOPY)
    m.sphere('ObserverBlister',(-1.45,-2,.2),(.5,1.2,.8),m.CANOPY)
    m.sphere('ObserverBlister',(1.45,-2,.2),(.5,1.2,.8),m.CANOPY)

def ww2airfield():
    m.box('Airstrip',(0,0,-.12),(22,80,.24),m.DECK)
    for y in range(-34,35,8):m.box('RunwayMarking',(0,y,.025),(.35,3.8,.05),m.WHITE)
    for sign in [-1,1]:m.box('RunwayEdge',(sign*9,0,.02),(.2,75,.04),m.WHITE)
    m.box('Hangar',(21,-11,3.5),(17,23,7),m.HULL,.5)
    m.box('HangarDoor',(21,.6,3),(14,.15,5.5),m.DARK)
    m.box('ControlTower',(18,23,4),(5,5,8),m.HULL,.3)
    m.box('TowerWindows',(18,23,7),(5.2,5.2,1.1),m.GLASS,.1)
    m.box('TowerRoof',(18,23,8.5),(6.2,6.2,.4),m.DECK)
    m.line('RadioMast',(25,25,0),(25,25,18),.12,m.DARK)

builders={
 'ww2-battleship':('二战通用战列舰',250,ww2battleship),
 'ww2-carrier':('二战直通甲板航母',250,ww2carrier),
 'ww2-cruiser':('二战重巡洋舰',188,lambda:ww2escort(False)),
 'ww2-destroyer':('二战驱逐舰',119,lambda:ww2escort(True)),
 'ww2-fighter':('二战螺旋桨战斗机',9,lambda:ww2plane('fighter')),
 'ww2-dive':('二战俯冲轰炸机',10.6,lambda:ww2plane('dive')),
 'ww2-torpedo':('二战鱼雷攻击机',12.4,lambda:ww2plane('torpedo')),
 'ww2-scout':('二战水上侦察机',21,ww2scout),
 'ww2-airfield':('二战航空基地',80,ww2airfield)
}
manifest={'version':1,'units':'metres','forward':'-Z','up':'+Y','source':'ww2-fleet.blend','models':{}}
for index,(key,(label,length,build)) in enumerate(builders.items()):
    m.prefix=key;m.collection=bpy.data.collections.new(key+' · '+label);bpy.context.scene.collection.children.link(m.collection);build()
    bpy.ops.object.select_all(action='DESELECT')
    for obj in m.collection.objects:obj.select_set(True)
    bpy.context.view_layer.objects.active=next(iter(m.collection.objects))
    bpy.ops.export_scene.gltf(filepath=str(OUT/f'generic-{key}.glb'),export_format='GLB',use_selection=True,export_apply=True,export_yup=True,export_animations=False,export_cameras=False,export_lights=False)
    manifest['models'][key]={'name':label,'file':f'generic-{key}.glb','length':length,'parts':len(m.collection.objects)}
    origin=[index%3*320,-(index//3)*340,0]
    for obj in m.collection.objects:obj.location.x+=origin[0];obj.location.y+=origin[1]
    m.collection['model_key']=key;m.collection['export_origin']=origin;m.collection['model_length']=length
    print('EXPORTED WWII',key,flush=True)
(OUT/'ww2-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
bpy.context.preferences.filepaths.save_version=0
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'ww2-fleet.blend'),compress=True)

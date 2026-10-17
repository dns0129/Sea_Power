# 通用海空模型 · v1

这是项目原创的通用示意模型库，不对应某一个真实装备的精确外形。游戏中的型号、性能、弹药与传感器由引擎决定，替换外观不会修改战局参数。

包含航母、驱逐舰、护卫舰、补给舰、潜艇、多用途战机、攻击机、预警机、直升机和岸基设施，共 10 类。无外部纹理；材质直接保存在 GLB 中。`generic-fleet.blend` 是完整的可编辑 Blender 4.3 源文件，模型分为独立集合，零件保留命名。源文件中模型在网格中排开，方便编辑。

## 修改现有资产

1. 使用 Blender 打开 `generic-fleet.blend`，编辑对应集合中的模型、材质或零件，保存源文件。
2. 在仓库根目录导出所需模型，例如只导出战机：

   ```sh
   blender --background dist/assets/models/generic-fleet.blend --python scripts/export-generic-models.py -- fighter
   ```

   省略 `-- fighter` 可导出所有带 `model_key` 属性的集合。导出脚本会按集合中的 `export_origin` 属性临时还原原点，导出后恢复编辑位置，不会重建零件或覆盖 Blender 源文件。

3. 保持文件名不变，用新的 GLB 替换 `generic-*.glb`。需要调整展示长度时，修改 `dist/sea-scene-data.js` 中的 `MODEL_PROFILES`。

`scripts/build-generic-models.py` 用于从零重建初始模型库，会覆盖当前资产。修改过的模型请使用上面的导出脚本。

## 坐标与约定

- Blender：米制，Z 向上，舰艏／机头朝 +Y；舰船原点位于水线，飞机原点位于机身中心。
- GLB：米制，Y 向上，舰艏／机头朝 -Z；比例与尺寸见 `manifest.json`。
- 保留名称包含 `MainRotor`、`RadarSpinner` 的对象，可在场景中自动转动。它们的物体原点应处于旋转中心；普通静态零件会按材质合并以减少绘制开销。
- 海面单位坐标直接来自战局。为了同时看清舰船与飞机，模型外观与飞行高度使用示意显示比例；详情面板显示真实的游戏航速和高度。
- 侦察接触使用情报符号，尚未确认的敌方不显示真实型号、装备、损伤或实时位置。

渲染库为本地固定版本 Three.js r169，许可证见 `dist/vendor/three/LICENSE`，运行时无需 CDN。

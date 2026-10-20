export const CHART_THEMES={
  dark:{name:'黑色系 · 夜航',sea:'#101e28',seaEnd:'#07121c',land:'#293a42',coast:'#78939a',grid:'#a1b4c51c',text:'#b2cad7',muted:'#829cae',friendly:'#78d5bd',hostile:'#ff9b8f',route:'#84cdb5',task:'#e5c084'},
  light:{name:'白色系 · 航海图',sea:'#f7fafc',seaEnd:'#dfeef5',land:'#ebe9d8',coast:'#8e9583',grid:'#49627622',text:'#233f50',muted:'#4d697d',friendly:'#086b61',hostile:'#b53340',route:'#176e65',task:'#886017'},
  ocean:{name:'蓝色系 · 深海',sea:'#153d56',seaEnd:'#09283d',land:'#36545b',coast:'#85b8b8',grid:'#acc9de24',text:'#d8e9ef',muted:'#9cbecf',friendly:'#8cf0d5',hostile:'#ffc0b3',route:'#9ce2d1',task:'#ffe0a0'},
};
export const chartTheme=s=>CHART_THEMES[s?.chartTheme]||CHART_THEMES.dark;

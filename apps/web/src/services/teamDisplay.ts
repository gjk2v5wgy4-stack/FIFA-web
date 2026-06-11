export interface TeamDisplay {
  name: string;
  code: string;
  flagCode?: string;
  flagImageUrl?: string;
}

export interface TeamDisplayInput {
  name: string;
  code?: string;
}

interface TeamDisplaySource {
  name: string;
  code: string;
  flagCode?: string;
}

function createFlagImageUrl(flagCode?: string) {
  return flagCode ? `https://flagcdn.com/w40/${flagCode}.png` : undefined;
}

function team(name: string, code: string, flagCode?: string): TeamDisplaySource {
  return { name, code, flagCode };
}

const teamDisplayMap: Record<string, TeamDisplaySource> = {
  "A/B/C/D/F组第3": team("A/B/C/D/F组第三名", "3RD"),
  "A/E/H/I/J组第3": team("A/E/H/I/J组第三名", "3RD"),
  "B/E/F/I/J组第3": team("B/E/F/I/J组第三名", "3RD"),
  "C/D/F/G/H组第3": team("C/D/F/G/H组第三名", "3RD"),
  "C/E/F/H/I组第3": team("C/E/F/H/I组第三名", "3RD"),
  "D/E/I/J/L组第3": team("D/E/I/J/L组第三名", "3RD"),
  "E/F/G/I/J组第3": team("E/F/G/I/J组第三名", "3RD"),
  "E/H/I/J/K组第3": team("E/H/I/J/K组第三名", "3RD"),
  A1: team("A组第一名", "A1"),
  A2: team("A组第二名", "A2"),
  "A组第1": team("A组第一名", "A1"),
  "A组第2": team("A组第二名", "A2"),
  B1: team("B组第一名", "B1"),
  B2: team("B组第二名", "B2"),
  "B组第1": team("B组第一名", "B1"),
  "B组第2": team("B组第二名", "B2"),
  C1: team("C组第一名", "C1"),
  C2: team("C组第二名", "C2"),
  "C组第1": team("C组第一名", "C1"),
  "C组第2": team("C组第二名", "C2"),
  D1: team("D组第一名", "D1"),
  D2: team("D组第二名", "D2"),
  "D组第1": team("D组第一名", "D1"),
  "D组第2": team("D组第二名", "D2"),
  E1: team("E组第一名", "E1"),
  E2: team("E组第二名", "E2"),
  "E组第1": team("E组第一名", "E1"),
  "E组第2": team("E组第二名", "E2"),
  F1: team("F组第一名", "F1"),
  F2: team("F组第二名", "F2"),
  "F组第1": team("F组第一名", "F1"),
  "F组第2": team("F组第二名", "F2"),
  G1: team("G组第一名", "G1"),
  G2: team("G组第二名", "G2"),
  "G组第1": team("G组第一名", "G1"),
  "G组第2": team("G组第二名", "G2"),
  H1: team("H组第一名", "H1"),
  H2: team("H组第二名", "H2"),
  "H组第1": team("H组第一名", "H1"),
  "H组第2": team("H组第二名", "H2"),
  I1: team("I组第一名", "I1"),
  I2: team("I组第二名", "I2"),
  "I组第1": team("I组第一名", "I1"),
  "I组第2": team("I组第二名", "I2"),
  J1: team("J组第一名", "J1"),
  J2: team("J组第二名", "J2"),
  "J组第1": team("J组第一名", "J1"),
  "J组第2": team("J组第二名", "J2"),
  K1: team("K组第一名", "K1"),
  K2: team("K组第二名", "K2"),
  "K组第1": team("K组第一名", "K1"),
  "K组第2": team("K组第二名", "K2"),
  L1: team("L组第一名", "L1"),
  L2: team("L组第二名", "L2"),
  "L组第1": team("L组第一名", "L1"),
  "L组第2": team("L组第二名", "L2"),
  "第101场胜者": team("第101场胜者", "W101"),
  "第101场负者": team("第101场负者", "L101"),
  "第102场胜者": team("第102场胜者", "W102"),
  "第102场负者": team("第102场负者", "L102"),
  "第73场胜者": team("第73场胜者", "W73"),
  "第74场胜者": team("第74场胜者", "W74"),
  "第75场胜者": team("第75场胜者", "W75"),
  "第76场胜者": team("第76场胜者", "W76"),
  "第77场胜者": team("第77场胜者", "W77"),
  "第78场胜者": team("第78场胜者", "W78"),
  "第79场胜者": team("第79场胜者", "W79"),
  "第80场胜者": team("第80场胜者", "W80"),
  "第81场胜者": team("第81场胜者", "W81"),
  "第82场胜者": team("第82场胜者", "W82"),
  "第83场胜者": team("第83场胜者", "W83"),
  "第84场胜者": team("第84场胜者", "W84"),
  "第85场胜者": team("第85场胜者", "W85"),
  "第86场胜者": team("第86场胜者", "W86"),
  "第87场胜者": team("第87场胜者", "W87"),
  "第88场胜者": team("第88场胜者", "W88"),
  "第89场胜者": team("第89场胜者", "W89"),
  "第90场胜者": team("第90场胜者", "W90"),
  "第91场胜者": team("第91场胜者", "W91"),
  "第92场胜者": team("第92场胜者", "W92"),
  "第93场胜者": team("第93场胜者", "W93"),
  "第94场胜者": team("第94场胜者", "W94"),
  "第95场胜者": team("第95场胜者", "W95"),
  "第96场胜者": team("第96场胜者", "W96"),
  "第97场胜者": team("第97场胜者", "W97"),
  "第98场胜者": team("第98场胜者", "W98"),
  "第99场胜者": team("第99场胜者", "W99"),
  "第100场胜者": team("第100场胜者", "W100"),
  Algeria: team("阿尔及利亚", "ALG", "dz"),
  Argentina: team("阿根廷", "ARG", "ar"),
  Australia: team("澳大利亚", "AUS", "au"),
  Austria: team("奥地利", "AUT", "at"),
  Belgium: team("比利时", "BEL", "be"),
  "Bosnia and Herzegovina": team("波黑", "BIH", "ba"),
  "Bosnia & Herzegovina": team("波黑", "BIH", "ba"),
  Brazil: team("巴西", "BRA", "br"),
  Canada: team("加拿大", "CAN", "ca"),
  "Cabo Verde": team("佛得角", "CPV", "cv"),
  "Cape Verde": team("佛得角", "CPV", "cv"),
  Colombia: team("哥伦比亚", "COL", "co"),
  "Congo DR": team("刚果民主共和国", "COD", "cd"),
  "DR Congo": team("刚果民主共和国", "COD", "cd"),
  "Côte d'Ivoire": team("科特迪瓦", "CIV", "ci"),
  "Cote d'Ivoire": team("科特迪瓦", "CIV", "ci"),
  "Ivory Coast": team("科特迪瓦", "CIV", "ci"),
  Croatia: team("克罗地亚", "CRO", "hr"),
  Curaçao: team("库拉索", "CUW", "cw"),
  Curacao: team("库拉索", "CUW", "cw"),
  Czechia: team("捷克", "CZE", "cz"),
  "Czech Republic": team("捷克", "CZE", "cz"),
  Ecuador: team("厄瓜多尔", "ECU", "ec"),
  Egypt: team("埃及", "EGY", "eg"),
  England: team("英格兰", "ENG", "gb-eng"),
  France: team("法国", "FRA", "fr"),
  Germany: team("德国", "GER", "de"),
  Ghana: team("加纳", "GHA", "gh"),
  Haiti: team("海地", "HAI", "ht"),
  "IR Iran": team("伊朗", "IRN", "ir"),
  Iran: team("伊朗", "IRN", "ir"),
  Iraq: team("伊拉克", "IRQ", "iq"),
  Japan: team("日本", "JPN", "jp"),
  Jordan: team("约旦", "JOR", "jo"),
  "Korea Republic": team("韩国", "KOR", "kr"),
  "South Korea": team("韩国", "KOR", "kr"),
  Mexico: team("墨西哥", "MEX", "mx"),
  Morocco: team("摩洛哥", "MAR", "ma"),
  Netherlands: team("荷兰", "NED", "nl"),
  "New Zealand": team("新西兰", "NZL", "nz"),
  Norway: team("挪威", "NOR", "no"),
  Panama: team("巴拿马", "PAN", "pa"),
  Paraguay: team("巴拉圭", "PAR", "py"),
  Portugal: team("葡萄牙", "POR", "pt"),
  Qatar: team("卡塔尔", "QAT", "qa"),
  "Saudi Arabia": team("沙特阿拉伯", "KSA", "sa"),
  Scotland: team("苏格兰", "SCO", "gb-sct"),
  Senegal: team("塞内加尔", "SEN", "sn"),
  "South Africa": team("南非", "RSA", "za"),
  Spain: team("西班牙", "ESP", "es"),
  Sweden: team("瑞典", "SWE", "se"),
  Switzerland: team("瑞士", "SUI", "ch"),
  Tunisia: team("突尼斯", "TUN", "tn"),
  Türkiye: team("土耳其", "TUR", "tr"),
  Turkey: team("土耳其", "TUR", "tr"),
  Uruguay: team("乌拉圭", "URU", "uy"),
  USA: team("美国", "USA", "us"),
  "United States": team("美国", "USA", "us"),
  Uzbekistan: team("乌兹别克斯坦", "UZB", "uz"),
};

const venueDisplayMap: Record<string, string> = {
  "Atlanta Stadium": "亚特兰大体育场",
  Atlanta: "亚特兰大",
  Arlington: "阿灵顿",
  "BC Place Vancouver": "温哥华BC体育场",
  "Boston Stadium": "波士顿体育场",
  "Dallas Stadium": "达拉斯体育场",
  "Estadio Guadalajara": "瓜达拉哈拉体育场",
  "Estadio Monterrey": "蒙特雷体育场",
  Foxborough: "福克斯伯勒",
  Guadalupe: "瓜达卢佩",
  Houston: "休斯敦",
  "Houston Stadium": "休斯敦体育场",
  "Kansas City": "堪萨斯城",
  "Kansas City Stadium": "堪萨斯城体育场",
  "Los Angeles": "洛杉矶",
  "Los Angeles Stadium": "洛杉矶体育场",
  "Lumen Field": "流明球场",
  "MetLife Stadium": "大都会人寿体育场",
  "Mexico City": "墨西哥城",
  "Mexico City Stadium": "墨西哥城体育场",
  Miami: "迈阿密",
  "Miami Stadium": "迈阿密体育场",
  "New Jersey": "新泽西",
  "New York New Jersey Stadium": "纽约/新泽西体育场",
  Philadelphia: "费城",
  "Philadelphia Stadium": "费城体育场",
  "Santa Clara": "圣克拉拉",
  "San Francisco Bay Area Stadium": "旧金山湾区体育场",
  Seattle: "西雅图",
  "Seattle Stadium": "西雅图体育场",
  "SoFi Stadium": "索菲体育场",
  Toronto: "多伦多",
  "Toronto Stadium": "多伦多体育场",
  Vancouver: "温哥华",
  Zapopan: "萨波潘",
};

function normalizeTeamInput(teamInput: string | TeamDisplayInput) {
  return typeof teamInput === "string" ? teamInput : teamInput.code ?? teamInput.name;
}

export function getTeamDisplay(teamInput: string | TeamDisplayInput): TeamDisplay {
  const key = normalizeTeamInput(teamInput);
  const byCode =
    typeof teamInput === "string" ? undefined : teamDisplayMap[teamInput.code ?? ""];
  const display =
    byCode ??
    teamDisplayMap[key] ??
    teamDisplayMap[typeof teamInput === "string" ? "" : teamInput.name];

  if (display) {
    return {
      ...display,
      flagImageUrl: createFlagImageUrl(display.flagCode),
    };
  }

  return {
    name: typeof teamInput === "string" ? teamInput : teamInput.name,
    code: typeof teamInput === "string" ? "" : teamInput.code ?? "",
  };
}

export function formatTeamDisplay(teamInput: string | TeamDisplayInput) {
  return getTeamDisplay(teamInput).name;
}

export function getVenueDisplay(venue: string) {
  return venueDisplayMap[venue] ?? venue;
}

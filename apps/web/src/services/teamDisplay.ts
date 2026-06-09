export interface TeamDisplay {
  name: string;
  flag: string;
  code: string;
}

interface TeamDisplayInput {
  name: string;
  code?: string;
}

const teamDisplayMap: Record<string, TeamDisplay> = {
  "A/B/C/D/F组第3": { name: "A/B/C/D/F组第三名", flag: "", code: "3RD" },
  "A/E/H/I/J组第3": { name: "A/E/H/I/J组第三名", flag: "", code: "3RD" },
  "B/E/F/I/J组第3": { name: "B/E/F/I/J组第三名", flag: "", code: "3RD" },
  "C/D/F/G/H组第3": { name: "C/D/F/G/H组第三名", flag: "", code: "3RD" },
  "C/E/F/H/I组第3": { name: "C/E/F/H/I组第三名", flag: "", code: "3RD" },
  "D/E/I/J/L组第3": { name: "D/E/I/J/L组第三名", flag: "", code: "3RD" },
  "E/F/G/I/J组第3": { name: "E/F/G/I/J组第三名", flag: "", code: "3RD" },
  "E/H/I/J/K组第3": { name: "E/H/I/J/K组第三名", flag: "", code: "3RD" },
  "A组第1": { name: "A组第一名", flag: "", code: "A1" },
  "A组第2": { name: "A组第二名", flag: "", code: "A2" },
  "B组第1": { name: "B组第一名", flag: "", code: "B1" },
  "B组第2": { name: "B组第二名", flag: "", code: "B2" },
  "C组第1": { name: "C组第一名", flag: "", code: "C1" },
  "C组第2": { name: "C组第二名", flag: "", code: "C2" },
  "D组第1": { name: "D组第一名", flag: "", code: "D1" },
  "D组第2": { name: "D组第二名", flag: "", code: "D2" },
  "E组第1": { name: "E组第一名", flag: "", code: "E1" },
  "E组第2": { name: "E组第二名", flag: "", code: "E2" },
  "F组第1": { name: "F组第一名", flag: "", code: "F1" },
  "F组第2": { name: "F组第二名", flag: "", code: "F2" },
  "G组第1": { name: "G组第一名", flag: "", code: "G1" },
  "G组第2": { name: "G组第二名", flag: "", code: "G2" },
  "H组第1": { name: "H组第一名", flag: "", code: "H1" },
  "H组第2": { name: "H组第二名", flag: "", code: "H2" },
  "I组第1": { name: "I组第一名", flag: "", code: "I1" },
  "I组第2": { name: "I组第二名", flag: "", code: "I2" },
  "J组第1": { name: "J组第一名", flag: "", code: "J1" },
  "J组第2": { name: "J组第二名", flag: "", code: "J2" },
  "K组第1": { name: "K组第一名", flag: "", code: "K1" },
  "K组第2": { name: "K组第二名", flag: "", code: "K2" },
  "L组第1": { name: "L组第一名", flag: "", code: "L1" },
  "L组第2": { name: "L组第二名", flag: "", code: "L2" },
  Algeria: { name: "阿尔及利亚", flag: "🇩🇿", code: "ALG" },
  Argentina: { name: "阿根廷", flag: "🇦🇷", code: "ARG" },
  Australia: { name: "澳大利亚", flag: "🇦🇺", code: "AUS" },
  Austria: { name: "奥地利", flag: "🇦🇹", code: "AUT" },
  Belgium: { name: "比利时", flag: "🇧🇪", code: "BEL" },
  "Bosnia and Herzegovina": { name: "波黑", flag: "🇧🇦", code: "BIH" },
  Brazil: { name: "巴西", flag: "🇧🇷", code: "BRA" },
  Canada: { name: "加拿大", flag: "🇨🇦", code: "CAN" },
  "Cabo Verde": { name: "佛得角", flag: "🇨🇻", code: "CPV" },
  Colombia: { name: "哥伦比亚", flag: "🇨🇴", code: "COL" },
  "Congo DR": { name: "刚果民主共和国", flag: "🇨🇩", code: "COD" },
  "Côte d'Ivoire": { name: "科特迪瓦", flag: "🇨🇮", code: "CIV" },
  "C么te d'Ivoire": { name: "科特迪瓦", flag: "🇨🇮", code: "CIV" },
  Croatia: { name: "克罗地亚", flag: "🇭🇷", code: "CRO" },
  Curaçao: { name: "库拉索", flag: "🇨🇼", code: "CUW" },
  "Cura莽ao": { name: "库拉索", flag: "🇨🇼", code: "CUW" },
  Czechia: { name: "捷克", flag: "🇨🇿", code: "CZE" },
  Ecuador: { name: "厄瓜多尔", flag: "🇪🇨", code: "ECU" },
  Egypt: { name: "埃及", flag: "🇪🇬", code: "EGY" },
  England: { name: "英格兰", flag: "🏴", code: "ENG" },
  France: { name: "法国", flag: "🇫🇷", code: "FRA" },
  Germany: { name: "德国", flag: "🇩🇪", code: "GER" },
  Ghana: { name: "加纳", flag: "🇬🇭", code: "GHA" },
  Haiti: { name: "海地", flag: "🇭🇹", code: "HAI" },
  "IR Iran": { name: "伊朗", flag: "🇮🇷", code: "IRN" },
  Iraq: { name: "伊拉克", flag: "🇮🇶", code: "IRQ" },
  Japan: { name: "日本", flag: "🇯🇵", code: "JPN" },
  Jordan: { name: "约旦", flag: "🇯🇴", code: "JOR" },
  "Korea Republic": { name: "韩国", flag: "🇰🇷", code: "KOR" },
  Mexico: { name: "墨西哥", flag: "🇲🇽", code: "MEX" },
  Morocco: { name: "摩洛哥", flag: "🇲🇦", code: "MAR" },
  Netherlands: { name: "荷兰", flag: "🇳🇱", code: "NED" },
  "New Zealand": { name: "新西兰", flag: "🇳🇿", code: "NZL" },
  Norway: { name: "挪威", flag: "🇳🇴", code: "NOR" },
  Panama: { name: "巴拿马", flag: "🇵🇦", code: "PAN" },
  Paraguay: { name: "巴拉圭", flag: "🇵🇾", code: "PAR" },
  Portugal: { name: "葡萄牙", flag: "🇵🇹", code: "POR" },
  Qatar: { name: "卡塔尔", flag: "🇶🇦", code: "QAT" },
  "Saudi Arabia": { name: "沙特阿拉伯", flag: "🇸🇦", code: "KSA" },
  Scotland: { name: "苏格兰", flag: "🏴", code: "SCO" },
  Senegal: { name: "塞内加尔", flag: "🇸🇳", code: "SEN" },
  "South Africa": { name: "南非", flag: "🇿🇦", code: "RSA" },
  Spain: { name: "西班牙", flag: "🇪🇸", code: "ESP" },
  Sweden: { name: "瑞典", flag: "🇸🇪", code: "SWE" },
  Switzerland: { name: "瑞士", flag: "🇨🇭", code: "SUI" },
  Tunisia: { name: "突尼斯", flag: "🇹🇳", code: "TUN" },
  Türkiye: { name: "土耳其", flag: "🇹🇷", code: "TUR" },
  "T眉rkiye": { name: "土耳其", flag: "🇹🇷", code: "TUR" },
  Uruguay: { name: "乌拉圭", flag: "🇺🇾", code: "URU" },
  USA: { name: "美国", flag: "🇺🇸", code: "USA" },
  "United States": { name: "美国", flag: "🇺🇸", code: "USA" },
  Uzbekistan: { name: "乌兹别克斯坦", flag: "🇺🇿", code: "UZB" },
  Wales: { name: "威尔士", flag: "🏴", code: "WAL" },
};

const venueDisplayMap: Record<string, string> = {
  "Atlanta Stadium": "亚特兰大体育场",
  "BC Place Vancouver": "温哥华BC体育场",
  "Boston Stadium": "波士顿体育场",
  "Dallas Stadium": "达拉斯体育场",
  "Estadio Guadalajara": "瓜达拉哈拉体育场",
  "Estadio Monterrey": "蒙特雷体育场",
  "Houston Stadium": "休斯敦体育场",
  "Kansas City Stadium": "堪萨斯城体育场",
  "Los Angeles Stadium": "洛杉矶体育场",
  "Lumen Field": "流明球场",
  "MetLife Stadium": "大都会人寿体育场",
  "Mexico City Stadium": "墨西哥城体育场",
  "Miami Stadium": "迈阿密体育场",
  "New York New Jersey Stadium": "纽约/新泽西体育场",
  "Philadelphia Stadium": "费城体育场",
  "San Francisco Bay Area Stadium": "旧金山湾区体育场",
  "Seattle Stadium": "西雅图体育场",
  "SoFi Stadium": "索菲体育场",
  "Toronto Stadium": "多伦多体育场",
};

function normalizeTeamInput(team: string | TeamDisplayInput) {
  return typeof team === "string" ? team : team.code ?? team.name;
}

export function getTeamDisplay(team: string | TeamDisplayInput): TeamDisplay {
  const key = normalizeTeamInput(team);
  const byCode = typeof team === "string" ? undefined : teamDisplayMap[team.code ?? ""];
  const display = byCode ?? teamDisplayMap[key] ?? teamDisplayMap[typeof team === "string" ? "" : team.name];

  if (display) {
    return display;
  }

  return {
    name: typeof team === "string" ? team : team.name,
    flag: "",
    code: typeof team === "string" ? "" : team.code ?? "",
  };
}

export function formatTeamDisplay(team: string | TeamDisplayInput) {
  const display = getTeamDisplay(team);
  return display.flag ? `${display.name} ${display.flag}` : display.name;
}

export function getVenueDisplay(venue: string) {
  return venueDisplayMap[venue] ?? venue;
}

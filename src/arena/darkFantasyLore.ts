import type { CitadelSecretsProgress } from "./bloodCitadelMap";
import {
  type InfernoProgressState,
  INFERNO_DOCS,
  normalizeInfernoProgress,
} from "./infernoAshMap";

export type LoreLang = "vi" | "en";

export interface LoreTextPair {
  vi: string;
  en: string;
}

export interface WorldChronicleChapter {
  id: string;
  eraTag: LoreTextPair;
  title: LoreTextPair;
  epigraph: LoreTextPair;
  paragraphs: { vi: string[]; en: string[] };
}

export interface HeroChronicleEntry {
  heroId: string;
  faction: LoreTextPair;
  originTitle: LoreTextPair;
  epitaph: LoreTextPair;
  story: LoreTextPair;
  citadelBond: LoreTextPair;
}

export interface BossChronicleEntry {
  wave: number;
  name: LoreTextPair;
  domain: LoreTextPair;
  omen: LoreTextPair;
  lore: LoreTextPair;
}

export const WORLD_CHRONICLE_TITLE: LoreTextPair = {
  vi: "Biên Niên Sử Huyết Nhật Thực",
  en: "Chronicles of the Blood Eclipse",
};

export const WORLD_CHRONICLE_SUBTITLE: LoreTextPair = {
  vi: "VŨ TRỤ DARK FANTASY · TỪ ĐẤU TRƯỜNG CỔ ĐIỂN ĐẾN CỔ THÀNH HUYẾT TÁNG",
  en: "DARK FANTASY LORE · FROM THE CLASSIC ARENA TO THE BLOODSOAKED CITADEL",
};

export const CHRONICLE_CHAPTERS: WorldChronicleChapter[] = [
  {
    id: "eclipse_fall",
    eraTag: { vi: "KỶ NGUYÊN I · HUYẾT NHẬT THỰC", en: "ERA I · THE BLOOD ECLIPSE" },
    title: {
      vi: "Vương Quốc Tro Tàn & Lời Nguyền 27 Đêm",
      en: "Ashen Kingdom & The 27-Night Trial",
    },
    epigraph: {
      vi: "“Khi mặt trời hóa đen trên đỉnh Tháp Nhật Thực, ranh giới giữa người sống, ma thần và bản sao bị xé toạc.”",
      en: "“When the sun blackened above Eclipse Spire, the veil between mortals, fiends, and replicas tore apart.”",
    },
    paragraphs: {
      vi: [
        "Trước khi các đấu trường trở thành lò sát sinh vĩnh cửu, vùng đất Aethelgard từng hưng thịnh nhờ Ma Thạch Đỏ — thứ tinh thể kết tinh từ huyết mạch của các Cổ Thần sa ngã. Lòng tham khai thác bất tử đã khiến Thiên Thần Sa Ngã Lucifer giáng xuống Huyết Nhật Thực, nhấn chìm chín tầng thành bang vào bóng tối.",
        "Đấu Trường Cổ Điển thực chất là một Pháp Trận Phong Ấn khổng lồ do Đấng Sáng Thế Thiên dựng nên. Bất kỳ chiến binh nào bước vào đều phải vượt qua 27 làn sóng thanh trừng và 9 đại trùm trấn giữ chín ấn ký của Vực Thẳm.",
      ],
      en: [
        "Before the arenas became eternal slaughterhouses, the realm of Aethelgard thrived upon Crimson Ma Thach — crystals forged from the blood of fallen Elder Gods. Greed for immortality drew Fallen Seraphim Lucifer to cast the Blood Eclipse, drowning nine citadels in shadow.",
        "The Classic Arena is in truth a colossal Sealing Circle raised by Thiên the Creator. Any warrior who enters must survive 27 waves of purgation and defeat the 9 Abyssal Wardens guarding its seals.",
      ],
    },
  },
  {
    id: "abyssal_seals",
    eraTag: { vi: "KỶ NGUYÊN II · CHÍN TẦNG PHONG ẤN", en: "ERA II · THE NINE SEALS" },
    title: {
      vi: "Chín Đại Trùm & Cánh Cổng Đổ Nát",
      en: "Nine Wardens & The Shattered Gate",
    },
    epigraph: {
      vi: "“Lucifer không phải kẻ mở đầu tai ương — hắn chỉ là kẻ gác cổng cuối cùng ngăn thế giới nhìn thấy thứ bị chôn bên dưới.”",
      en: "“Lucifer did not begin the calamity — he is merely the final warden keeping the world from what lies buried beneath.”",
    },
    paragraphs: {
      vi: [
        "Từ Thạch Thú Cổ Đại ở Màn 3 cho đến Thiên Thần Sa Ngã Lucifer ở Màn 27, mỗi đại trùm đều mang một mảnh ký ức của cuộc chiến hủy diệt năm xưa. Khi Lucifer ngã xuống ở Đấu Trường Cổ Điển, xiềng xích phong ấn phương Bắc mới chịu nới lỏng.",
        "Phía sau màn sương máu ấy hiện ra di tích bị xóa tên khỏi mọi sử sách: Cổ Thành Huyết Táng — nơi một thí nghiệm cấm kỵ từng cố gắng rèn ra chiến binh bất tử từ máu sống và bóng phản chiếu.",
      ],
      en: [
        "From the Ancient Golem Titan at Wave 3 to Fallen Seraphim Lucifer at Wave 27, each boss carries a shard of the ancient cataclysm. Only when Lucifer falls in the Classic Arena do the northern sealing chains finally loosen.",
        "Beyond that crimson mist emerges a ruin erased from every chronicle: the Bloodsoaked Ancient Citadel — where a forbidden experiment once forged immortal vessels from living blood and mirror-split shadows.",
      ],
    },
  },
  {
    id: "blood_citadel_truth",
    eraTag: { vi: "KỶ NGUYÊN III · CỔ THÀNH HUYẾT TÁNG", en: "ERA III · BLOODSOAKED CITADEL" },
    title: {
      vi: "Hầm Bí Mật & Dự Án Huyết Ảnh Số 0",
      en: "The Secret Vault & Project Bloodshade Zero",
    },
    epigraph: {
      vi: "“Kẻ dùng máu đánh thức Ma Thạch. Kẻ bước ra từ mặt gương vỡ. Không một sử gia nào được phép viết tên cả hai.”",
      en: "“One woke Ma Thach with living blood. One stepped out of cracked glass. No scribe was permitted to ink either name.”",
    },
    paragraphs: {
      vi: [
        "Bên trong bức tường đá đổ nát của Cổ Thành Huyết Táng, các tháp canh cổ vẫn tự động khai hỏa theo bản năng bảo vệ hồ sơ mật, còn những bẫy máu cổ xưa rút sinh lực kẻ xâm nhập để nuôi sống lõi Hầm Bí Mật phía Bắc.",
        "Đó là nơi lưu giữ dấu tích cuối cùng của Dự Án Huyết Ảnh Số 0 — thí nghiệm gắn kết huyết mạch Tin với Lõi Ma Thạch Đỏ và tách linh hồn Bảo thành vô số bản sao qua chiếc gương phản chiếu sai lệch.",
      ],
      en: [
        "Within the crumbling stone walls of the Bloodsoaked Ancient Citadel, automated watchtowers still fire to guard classified vaults while blood traps siphon life to feed the Northern Secret Vault.",
        "There lie the final traces of Project Bloodshade Zero — the forbidden program binding Tin's veins to the Crimson Ma Thach Core and fracturing Bảo's soul into stealth replicas through a distorted mirror.",
      ],
    },
  },
  {
    id: "inferno_ash_truth",
    eraTag: { vi: "KỶ NGUYÊN IV · HỎA NGỤC TÀN TRO", en: "ERA IV · INFERNO OF ASHES" },
    title: {
      vi: "Thành Phố Tro Tàn & Mật Thất Bốn Chiếc Ghế",
      en: "The Burned City & Chamber of Four Chairs",
    },
    epigraph: {
      vi: "“Lửa vẫn cháy sau nhiều năm không phải vì thiên thạch — mà vì có bốn người từng ngồi chung một bàn ký tên vào thảm họa.”",
      en: "“The fires still burn not from the meteor alone — four once sat at one table and signed the disaster.”",
    },
    paragraphs: {
      vi: [
        "Mở rộng gấp 1,8 lần Đấu Trường Cổ Điển, Hỏa Ngục Tàn Tro là xác chết của kinh đô cũ sau vụ nổ thiên thạch bí ẩn. Tám khu vực liên thông từ Cổng Thành Tro Tàn đến Miệng Vực Tận Hỏa vẫn còn âm ỉ sét đánh, mạch lửa, cầu đá mục và kho lưu trữ bị xé nát.",
        "Khi đưa Dũng, Danh và Long Hói lần lượt chạm tới ký ức riêng tại Hầm Hiến Tế, Điện Thờ Long Hỏa và Pháo Đài Thiên Hỏa, phong ấn Căn Phòng Bốn Chiếc Ghế dưới lòng đất mới mở ra — nơi Trung cất giữ mảnh sự thật cuối cùng.",
      ],
      en: [
        "Spanning 1.8× the Classic Arena, the Inferno of Ashes preserves the scorched capital after a mysterious meteor cataclysm. Eight interconnected districts still crackle with lightning, magma fissures, fragile bridges, and purged archives.",
        "When Dũng, Danh, and Long Hói each confront their hidden records across the Crypt, Wyrmfire Temple, and Skyfire Bastion, the underground Chamber of Four Chairs opens — revealing Trung's final truth.",
      ],
    },
  },
];

export const HERO_CHRONICLES: Record<string, HeroChronicleEntry> = {
  dung: {
    heroId: "dung",
    faction: { vi: "Hội Lôi Ngục · Tiên Phong", en: "Thunderbound Order · Vanguard" },
    originTitle: {
      vi: "Kẻ Gánh Lời Nguyền Khuyển Thần Ba Đầu",
      en: "Bearer of the Cerberus Thunder Pact",
    },
    epitaph: {
      vi: "“Sấm sét không thanh tẩy ta — nó xích linh hồn Tam Khuyển ngay trong lồng ngực này.”",
      en: "“Lightning does not purify me — it chains the three-headed hound inside my ribs.”",
    },
    story: {
      vi: "Từng là tướng quân hộ thành của Vương Quốc Tro Tàn, Dũng đánh đổi trái tim phàm trần lấy khế ước Lôi Ngục Cerberus để chặn bước tiến của Huyết Ma Bá Chủ. Mỗi khi Dũng hóa cuồng, ba đầu khuyển âm ti gào thét cùng tia sét, xé nát cả xác thịt kẻ thù lẫn lý trí của chính anh.",
      en: "Once a bastion commander of the Ashen Kingdom, Dũng traded his mortal heart for the Cerberus Thunder Pact to halt the Crimson Blood Sovereign. Whenever fury overtakes him, the three hellhound aspects roar through lightning, tearing foes and sanity alike.",
    },
    citadelBond: {
      vi: "Từng đóng quân tại Cổng Nam Cổ Thành trước đêm thành thất thủ; tiếng sấm của anh vẫn khắc trên vết nứt cổng đá.",
      en: "Defended the Citadel's Southern Gate the night it fell; his thunder scars still line the ruined arch.",
    },
  },
  tin: {
    heroId: "tin",
    faction: { vi: "Huyết Thạch · Vật Chủ Số 07", en: "Crimson Ma Thach · Subject 07" },
    originTitle: {
      vi: "Lưỡi Dao Rạch Không Gian Từ Máu Sống",
      en: "Spatial Blade Forged in Living Blood",
    },
    epitaph: {
      vi: "“Mỗi vết rách đỏ thẫm đều là một vết cắt mở lại thí nghiệm mà ta suýt không sống sót.”",
      en: "“Every crimson rift is a scar reopening the experiment I barely survived.”",
    },
    story: {
      vi: "Tin không nhớ tuổi thơ trước khi tỉnh dậy trên bàn đá lạnh lẽo giữa những bình máu phát sáng. Những kẻ đứng đầu Dự Án Huyết Ảnh Số 0 đã tiêm tinh chất Ma Thạch Đỏ trực tiếp vào tĩnh mạch anh, biến huyết tương thành lưỡi kiếm cắt đứt không gian. Tin săn lùng sự thật sau mỗi lần Huyết Ảnh Thức Tỉnh.",
      en: "Tin recalls no childhood before waking on cold stone amid glowing blood vials. Overseers of Project Bloodshade Zero injected liquefied Crimson Ma Thach into his veins, turning his blood into spatial blades. Every crimson slash brings him closer to the truth.",
    },
    citadelBond: {
      vi: "Manh mối cốt lõi ở góc Đông Bắc Cổ Thành Huyết Táng — nơi dấu ấn Ma Thạch vẫn đáp lại nhịp tim của riêng Tin.",
      en: "Core Citadel Easter Egg at the NE ruins — where dormant Ma Thach runes still answer Tin's heartbeat alone.",
    },
  },
  kin: {
    heroId: "kin",
    faction: { vi: "Thung Lũng Gió Chết", en: "Deadwind Vale" },
    originTitle: {
      vi: "Xạ Thủ Nghe Thấy Tiếng Khóc Của Bão Tố",
      en: "Marksman Who Hears the Storm's Dirge",
    },
    epitaph: {
      vi: "“Một mũi tên đúng nhịp gió đủ xuyên qua ba tầng giáp và một lời dối trá.”",
      en: "“One arrow loosed on the storm's breath pierces three plates of iron and one lie.”",
    },
    story: {
      vi: "Kin sống sót sau trận Lôi Tai hủy diệt Rừng Bạc bằng cách khắc xương bão vào cánh cung dài. Đôi mắt anh nhìn thấy dòng khí xoáy của tử thần quanh mỗi mục tiêu; càng bắn nhanh, ngọn gió oán hồn càng gào rít đòi mạng kẻ thù.",
      en: "Kin survived the Stormfall that ruined Silverwood by carving tempest bone into his longbow. His eyes trace death-currents around every foe; the faster he looses, the louder the wailing wind demands blood.",
    },
    citadelBond: {
      vi: "Luôn giữ khoảng cách với các tháp canh Cổ Thành vì ghét thứ ma thuật giam cầm gió trong đá lạnh.",
      en: "Keeps distance from Citadel watchtowers, despising sorcery that traps wind inside dead stone.",
    },
  },
  trung: {
    heroId: "trung",
    faction: { vi: "Tháp Quan Tinh Vỡ", en: "Shattered Astral Spire" },
    originTitle: {
      vi: "Nhà Chiêm Tinh Cõng Trọng Lực Của Các Vì Sao Chết",
      en: "Stargazer Bearing Dead Suns",
    },
    epitaph: {
      vi: "“Sao rơi không phải điềm báo — đó là tiếng gãy của bầu trời khi Lucifer vươn cánh.”",
      en: "“Falling stars are no omen — they are the sky cracking beneath Lucifer's wings.”",
    },
    story: {
      vi: "Trung từng chứng kiến toàn bộ thiên văn đài đổ sập trong đêm Huyết Nhật Thực. Để giữ mảnh thiên thạch không nghiền nát nhân gian, ông kéo ba tinh cầu trọng lực xoay quanh thân mình như chiếc gông vĩnh cửu, biến sức nặng vũ trụ thành khiên và trượng.",
      en: "Trung watched his observatory crumble during the Blood Eclipse. To stop falling shards from crushing mortals, he bound three gravity orbs around his body like eternal shackles, wielding cosmic weight as staff and shield.",
    },
    citadelBond: {
      vi: "Ghi chép thiên văn của ông chỉ ra Cổ Thành Huyết Táng là nơi nhật thực đầu tiên chạm đất.",
      en: "His astral charts mark the Bloodsoaked Citadel as the exact ground zero of the first eclipse.",
    },
  },
  eohyen: {
    heroId: "eohyen",
    faction: { vi: "Băng Cốc Vĩnh Đông", en: "Everfrost Abyss" },
    originTitle: {
      vi: "Nữ Chúa Tự Đóng Băng Trái Tim Để Không Gục Ngã",
      en: "Sovereign Who Froze Her Own Pulse",
    },
    epitaph: {
      vi: "“Máu nóng khiến ngươi chần chừ. Băng giá chỉ giữ lại lưỡi rìu và sự im lặng.”",
      en: "“Warm blood makes you hesitate. Frost leaves only the axe and silence.”",
    },
    story: {
      vi: "Khi Băng Ma Nữ Vương Freya nhấn chìm phương Bắc vào tuyết trắng, Éo Hyên bước thẳng vào bão tuyết với thanh đại rìu băng, chặt đứt cả lời nguyền tê cóng lẫn cảm xúc yếu mềm của bản thân. Mỗi nhát chém của cô kết tinh hơi thở kẻ địch thành tro băng.",
      en: "When Frost Queen Freya buried the north in white ruin, Éo Hyên walked straight into the blizzard with her frostbound battleaxe, cleaving away both numbness and mercy until every swing froze enemy breath mid-air.",
    },
    citadelBond: {
      vi: "Lạnh lùng truy vết các hồ sơ bị thiêu hủy vì nghi ngờ người thân cũ từng biến mất trong Cổ Thành.",
      en: "Coldly hunts burned ledgers, suspecting a lost kin vanished within the Citadel walls.",
    },
  },
  longhoi: {
    heroId: "longhoi",
    faction: { vi: "Đền Hỏa Hồ Tàn Lụi", en: "Ashen Fox Shrine" },
    originTitle: {
      vi: "Xạ Thủ Bị Thiêu Rụi Một Nửa Linh Hồn Bởi Ma Hỏa",
      en: "Marksman Half-Consumed by Foxfire",
    },
    epitaph: {
      vi: "“Đừng nhìn vào đuôi lửa của ta — đó là tro cốt của cả một ngôi đền đang cháy tiếp.”",
      en: "“Do not stare at my flame — it is an entire burned shrine still refusing to die.”",
    },
    story: {
      vi: "Sau khi Hỏa Long Vương thiêu rụi thánh địa Hỏa Hồ, Long Hói nhặt lấy tàn tro linh hồ rèn thành khẩu súng hỏa ma. Ngọn lửa vàng cam thiêu đốt từ trong ra ngoài giúp anh bứt tốc xuyên khói đạn, nhưng cũng khắc dấu ấn thiêu thân lên mỗi phát bắn.",
      en: "After the Infernal Dragon Wyrm scorched the Fox Shrine, Long Hói forged sacred embers into a twin-flame rifle. The blaze drives his blistering speed while slowly burning his own spirit from within.",
    },
    citadelBond: {
      vi: "Khắc dấu hỏa hồ trước những bức tường nứt của Cổ Thành để đánh dấu lối thoát giữa các trận phục kích.",
      en: "Burns foxfire marks along crumbling Citadel walls to chart escape lanes between ambushes.",
    },
  },
  duccong: {
    heroId: "duccong",
    faction: { vi: "Học Viện Hư Không", en: "Void Conclave" },
    originTitle: {
      vi: "Pháp Sư Xếp Ấn Hố Đen Nuốt Chửng Thực Tại",
      en: "Architect of Void Anchor Runes",
    },
    epitaph: {
      vi: "“Khoảng cách chỉ là ảo giác của kẻ yếu; đặt hai ấn ký xuống, cả chiến trường sẽ gập lại.”",
      en: "“Distance is a coward's illusion; place two seals down, and the battlefield folds.”",
    },
    story: {
      vi: "Đức Cống nghiên cứu thứ ma pháp cấm của Lãnh Chúa Hư Không Malakor rồi phản bội chính giáo phái đó. Bằng cách thả các ấn ký hố đen trên mặt đất, anh kéo vạn vật vào điểm kỳ dị nghiền nát xương thịt mà chính anh bước qua như bóng ma.",
      en: "Đức Cống studied Void Lord Malakor's forbidden geometry before betraying the cult. By anchoring gravitational runes across the earth, he folds space into crushing singularities while stepping between them unscathed.",
    },
    citadelBond: {
      vi: "Ấn ký hố đen của anh cộng hưởng bất thường với những bức tường dễ sụp đổ bên trong Cổ Thành Huyết Táng.",
      en: "His gravity seals resonate violently with the Citadel's fracturing stone battlements.",
    },
  },
  gau: {
    heroId: "gau",
    faction: { vi: "Đấu Trường Xích Sắt", en: "Ironchain Pits" },
    originTitle: {
      vi: "Chiến Binh Chỉ Cảm Thấy Sống Khi Xương Sườn Rạn Nứt",
      en: "Titan Who Only Breathes Under Blows",
    },
    epitaph: {
      vi: "“Đánh mạnh hơn nữa! Cơn đau của ngươi là thứ duy nhất giữ cơn thịnh nộ của ta thức tỉnh.”",
      en: "“Strike harder! Your blows are the only anvil heavy enough to wake my wrath.”",
    },
    story: {
      vi: "Bị bắt làm nô lệ giác đấu suốt mười năm, Gấu bẻ gãy xiềng xích bằng đôi tay trần và mang nguyên chiếc giáp rách nát ấy bước vào Đấu Trường. Mỗi đòn đánh gánh trên vai hóa thành Cuồng Nộ Hùng Sư, cho phép anh nhảy bổ xuống nghiền nát cả đội hình quái vật.",
      en: "Enslaved for a decade in blood-iron pits, Gấu snapped his chains bare-handed and entered the Arena in battered iron. Every wound he endures fuels Berserk Fury until his seismic leaps shatter whole swarms.",
    },
    citadelBond: {
      vi: "Đấm nát cả bệ bẫy máu khi thử sức với những bức tường mục rữa của Cổ Thành.",
      en: "Once smashed a blood-trap altar bare-fisted while testing the Citadel's rotting walls.",
    },
  },
  bao: {
    heroId: "bao",
    faction: { vi: "Dự Án Huyết Ảnh Số 0 · Nhánh Ảnh", en: "Project Bloodshade Zero · Shadow Branch" },
    originTitle: {
      vi: "Sát Thủ Hoài Nghi Chính Hình Bóng Của Bản Thân",
      en: "Assassin Haunted by His Own Reflection",
    },
    epitaph: {
      vi: "“Nếu lưỡi dao trong gương ra tay trước ta nửa nhịp… rốt cuộc ai mới là kẻ thật?”",
      en: "“If the blade in the glass strikes half a heartbeat sooner… which one of us is real?”",
    },
    story: {
      vi: "Bảo sở hữu khả năng tàng hình và phân thân hoàn hảo đến mức ngay cả các sát thủ lão luyện cũng không thể lần ra hơi thở. Nhưng trong những cơn ác mộng lạnh gáy, Bảo luôn thấy hàng chục gương mặt giống hệt mình đứng sau tấm gương nứt, thì thầm một câu hỏi không có lời đáp.",
      en: "Bảo commands stealth and shadow clones so seamless that even master assassins lose his scent. Yet in waking nightmares he sees dozens of identical faces behind cracked glass whispering one unbearable question.",
    },
    citadelBond: {
      vi: "Manh mối cốt lõi ở góc Tây Nam Cổ Thành Huyết Táng — chiếc gương sai lệch cất giữ sự thật: “Liệu ngươi có chắc mình là bản thể gốc?”",
      en: "Core Citadel Easter Egg at the SW ruins — the distorted mirror holding his truth: “Are you truly certain that you are the original?”",
    },
  },
  danh: {
    heroId: "danh",
    faction: { vi: "Long Môn Huyết Mạch", en: "Crimson Dragon Sect" },
    originTitle: {
      vi: "Kiếm Khách Giữ Ngọn Lửa Rồng Chưa Tắt",
      en: "Swordsman Keeping the Last Dragon Flame",
    },
    epitaph: {
      vi: "“Thế kiếm thứ nhất chém xương, thế thứ hai rạch giáp, thế thứ ba đánh thức Chân Long.”",
      en: "“First stance cleaves bone, second rends iron, third awakens the Crimson Dragon.”",
    },
    story: {
      vi: "Là truyền nhân cuối cùng của phái Long Kiếm sau cuộc thảm sát Đêm Nhật Thực, Danh rèn máu huyết long tộc vào hai thế võ Khai Sơn và Long Ngâm. Khi kích hoạt Thiên Phạt, linh hồn Xích Long quấn quanh thân anh, thiêu rụi mọi bóng tối dám cản đường.",
      en: "Last heir of the Crimson Dragon Sect after the Eclipse Purge, Danh forged ancient dragonblood into his Mountain-Cleaver and Dragon-Roar stances. Under Heaven's Judgment, a spectral red wyrm coils around his blade.",
    },
    citadelBond: {
      vi: "Truy tìm tàn thư Long Môn bị quân Cổ Thành cướp đi trước ngày sụp đổ.",
      en: "Searches the Citadel ruins for stolen Dragon Sect scrolls taken before the fall.",
    },
  },
  luan: {
    heroId: "luan",
    faction: { vi: "Tháp Đoạn Không", en: "Riftbreakers' Spire" },
    originTitle: {
      vi: "Pháp Sư Phải Đốt Mắt Để Nhìn Thấy Vết Nứt Thực Tại",
      en: "Mage Who Burned His Sight to Read Rifts",
    },
    epitaph: {
      vi: "“Ánh sáng trắng đen của Vực Thẳm không chói lòa — nó chỉ xóa sạch những thứ không xứng tồn tại.”",
      en: "“The Abyss's monochrome glare does not dazzle — it erases whatever fails to endure.”",
    },
    story: {
      vi: "Luận từng mở một cánh cổng Vực Thẳm ngay trong phòng thí nghiệm và trả giá bằng thị lực phàm trần. Đổi lại, ông nhìn thấy từng đường chỉ đen trắng cấu tạo nên không gian, mở cổng dịch chuyển và bắn chùm tia hủy diệt xuyên thủng cả giáp trụ cổ thần.",
      en: "Luận ripped open an Abyssal Gate inside his own study, sacrificing mortal sight. In return he perceives reality's monochrome threads, tearing portals and monochrome annihilation beams through elder armor.",
    },
    citadelBond: {
      vi: "Ghi nhận nhiều vết nứt không gian bất ổn quanh Hầm Bí Mật Cổ Thành và nghi ngờ Thiên từng dùng nó để phong ấn nơi này.",
      en: "Detected unstable rifts around the Citadel's Secret Vault, suspecting Thiên used them to seal the fortress.",
    },
  },
  taidu: {
    heroId: "taidu",
    faction: { vi: "Công Xưởng Phế Tích Số 15", en: "Scrap Foundry XV" },
    originTitle: {
      vi: "Kỹ Sư Chiến Trường Tái Tạo Cơ Khí Cổ Đại",
      en: "Battlefield Engineer of Relic Tech",
    },
    epitaph: {
      vi: "“Ma thuật sẽ phản bội ngươi khi cạn huyết; thép nguội và Drone tác chiến thì không.”",
      en: "“Sorcery betrays you when blood runs dry; cold steel and combat drones never do.”",
    },
    story: {
      vi: "Sau khi chứng kiến Pháo Vương Cơ Giới Rex tàn sát cả quân đoàn, Tài Du nhặt xác các lõi năng lượng cơ giới để chế tạo Drone hộ vệ song hành hai chế độ tấn công và hồi phục cùng hệ thống pháo đài tự hành.",
      en: "After watching Siege Automaton Rex slaughter an army, Tài Du salvaged fallen clockwork cores to craft his dual-mode combat Drone and automated turret grid.",
    },
    citadelBond: {
      vi: "Nhận ra kết cấu cơ chế bắn tự động của Tháp Canh Cổ Thành mang dấu vết công nghệ tiền kỷ nguyên tương tự Rex.",
      en: "Recognized the Citadel watchtowers' targeting gears as pre-eclipse technology akin to Rex.",
    },
  },
  nguyen: {
    heroId: "nguyen",
    faction: { vi: "Tu Viện Thánh Vệ", en: "Sanctuary Bastion" },
    originTitle: {
      vi: "Hộ Vệ Chuyển Hóa Máu Thừa Thành Thành Trì Bất Hoại",
      en: "Bastion Converting Overflowing Life Into Armor",
    },
    epitaph: {
      vi: "“Chừng nào lá chắn sinh mệnh còn sáng, đồng đội phía sau ta sẽ không bước qua ranh giới tử thần.”",
      en: "“So long as the sanctuary shines, no ally behind me crosses into death.”",
    },
    story: {
      vi: "Nguyên bước ra từ đống đổ nát của thánh đường y thuật, mang theo các vệ tinh sinh mệnh tự động cứu nguy đồng đội khi cận tử. Toàn bộ lượng sinh lực dư thừa đều được anh cô đặc thành giáp hộ mệnh kiên cố.",
      en: "Emerging from ruined healing sanctuaries, Nguyên commands orbital life-satellites that intercept fatal blows, crystallizing every drop of overheal into an unbreakable bastion.",
    },
    citadelBond: {
      vi: "Từng cố cứu những nạn nhân bị rút cạn máu quanh bẫy cổ của Cổ Thành, nhưng tất cả đã hóa đá trước khi anh tới.",
      en: "Once tried saving victims drained by Citadel blood traps, arriving only to find stone husks.",
    },
  },
  duy: {
    heroId: "duy",
    faction: { vi: "Hội Tụ Sát Vô Hình", en: "Silent Dusk Guild" },
    originTitle: {
      vi: "Bóng Ma Thở Nhịp Chậm Nhất Trên Chiến Trường",
      en: "Phantom With the Slowest Breath on the Field",
    },
    epitaph: {
      vi: "“Một giây đứng yên nghe gió. Một tích tắc sau, mười hai lưỡi phi tiêu đã cắm vào tử huyệt.”",
      en: "“One quiet second listening to the dark. Next instant, twelve shuriken find your throat.”",
    },
    story: {
      vi: "Duy rèn luyện bí thuật Tụ Sát: càng ẩn mình bất động lâu trong bóng tối, đòn xuất chiêu đầu tiên càng đạt uy lực chí tử. Những hình nhân thế mạng của anh phát nổ đúng lúc kẻ thù tưởng rằng đã dồn anh vào đường cùng.",
      en: "Duy mastered Silent Accumulation: the longer he waits motionless in shadow, the deadlier his opening ambush strikes, leaving explosive decoys where foes thought they had cornered him.",
    },
    citadelBond: {
      vi: "Ẩn nấp hàng đêm trên mái ngói vỡ Cổ Thành để theo dõi những cái bóng vô chủ lang thang gần Hầm Bí Mật.",
      en: "Perches atop broken Citadel eaves at night, tracking masterless shadows near the Secret Vault.",
    },
  },
  phong: {
    heroId: "phong",
    faction: { vi: "Ảnh Tốc Môn", en: "Windshadow Creed" },
    originTitle: {
      vi: "Kẻ Chạy Nhanh Hơn Tiếng Thét Của Kẻ Địch",
      en: "Blade Faster Than a Dying Scream",
    },
    epitaph: {
      vi: "“Ngươi vừa chém trúng một tàn ảnh. Lưỡi kiếm thật đang ở sau gáy ngươi từ ba bước trước.”",
      en: "“You struck an afterimage. My real blade was behind your neck three paces ago.”",
    },
    story: {
      vi: "Phong coi cái chết là bài kiểm tra tốc độ. Mỗi mạng hạ gục giúp anh hồi sinh lực và lập tức làm mới nhịp lướt, để lại hàng loạt ảo ảnh tiếp tục xé xác những con mồi chậm chạp trong sương đêm.",
      en: "Phong treats survival as pure velocity. Each kill restores his pulse and resets his momentum, leaving razor-sharp shadow illusions to finish slower prey in the dark.",
    },
    citadelBond: {
      vi: "Thích nhất những hành lang dài giữa hai tường thành sụp đổ, nơi không mũi tên tháp canh nào bắt kịp bước chân anh.",
      en: "Favors the wide corridors between collapsing Citadel walls where watchtower bolts fail to catch him.",
    },
  },
  dang: {
    heroId: "dang",
    faction: { vi: "Hắc Bạch Võ Đường", en: "Monochrome Tiger Dojo" },
    originTitle: {
      vi: "Võ Sĩ Hổ Quyền Dung Hòa Âm Dương Trong Cuồng Nộ",
      en: "Brawler Harmonizing Black-and-White Fury",
    },
    epitaph: {
      vi: "“Quyền đen phá giáp, quyền trắng chấn hồn — không cần thần binh khi nắm đấm đủ nặng.”",
      en: "“Black fist shatters plate, white fist shakes the soul — no blade needed when iron will strikes.”",
    },
    story: {
      vi: "Khi võ đường bị quái vật tràn vào tàn sát, Đăng đánh gãy thanh bảo kiếm gia truyền để tự buộc tay trần vào băng vải đen trắng. Giáp Hổ Cương giúp anh phản chấn mọi đòn đánh hiểm rồi tung liên hoàn quyền cướp sạch sinh khí địch.",
      en: "When abyssal beasts overran his dojo, Đăng snapped his heirloom sword and wrapped his fists in black-and-white cloth. His Tiger Guard deflects lethal strikes before unleashing bone-crushing flurries.",
    },
    citadelBond: {
      vi: "Từng thử đối đầu tay không với tượng đá Cổ Thành để rèn thân giữa mưa tên tháp canh.",
      en: "Trained bare-handed amid watchtower volleys inside the Citadel courtyard.",
    },
  },
  thanh: {
    heroId: "thanh",
    faction: { vi: "Đầm Lầy Xà Ảnh", en: "Venomserpent Fen" },
    originTitle: {
      vi: "Nữ Pháp Sư Nuôi Linh Xà Bằng Chính Đau Đớn Của Bản Thân",
      en: "Sorceress Feeding Spirit Serpents on Pain",
    },
    epitaph: {
      vi: "“Mỗi nhát cắn vào thịt da ta chỉ làm đàn mãng xà dưới bóng tối thêm đói khát.”",
      en: "“Every wound carved into my flesh only sharpens the hunger of the serpents beneath my feet.”",
    },
    story: {
      vi: "Thanh giao ước với Cổ Xà Vực Thẳm để sinh tồn qua trận dịch hạch sau Nhật Thực. Khi chịu sát thương dồn dập, Vọng Âm Xà Ảnh tự động phản công, còn Đại Xà Hư Không trồi lên nuốt chửng những kẻ địch suy yếu.",
      en: "Thanh struck a pact with Abyssal Serpents to survive the post-eclipse plague. Burst wounds trigger Spirit Serpent echoes while colossal devourer snakes rise to swallow weakened enemies whole.",
    },
    citadelBond: {
      vi: "Cảm nhận rõ mùi máu cổ đóng cặn dưới những phiến đá Cổ Thành vẫn còn sống và đang thầm gọi bầy rắn của cô.",
      en: "Senses ancient blood beneath the Citadel flagstones still pulsing and calling to her serpents.",
    },
  },
  nhi: {
    heroId: "nhi",
    faction: { vi: "Lò Luyện Độc Dược Vô Luân", en: "Plague Alchemist Guild" },
    originTitle: {
      vi: "Xạ Thủ Biến Nọc Độc Thành Thuốc Giải Sinh Mệnh",
      en: "Alchemist Turning Lethal Venom Into Lifeblood",
    },
    epitaph: {
      vi: "“Một bình tím để ăn mòn xương, một bình lục để trói chân cái chết thêm một phút.”",
      en: "“One violet vial to melt bone, one emerald dose to tether life one breath longer.”",
    },
    story: {
      vi: "Từng là dược sư hoàng gia cố tìm thuốc giải cho căn bệnh Huyết Thạch, Nhi nhận ra cách duy nhất để chống lại độc tố của Độc Long Ác Ma là biến chính thân xác mình thành kho đạn dược sống với ba dòng huyết thanh luân chuyển.",
      en: "Formerly a royal apothecary seeking a cure for Bloodstone rot, Nhi discovered the only defense against the Abyssal Venom Wyrm was turning her crossbow into a living laboratory of three rotating serums.",
    },
    citadelBond: {
      vi: "Phân tích các bình máu trong phòng thí nghiệm của Tin và nhận ra công thức Ma Thạch từng bị biến đổi có chủ đích.",
      en: "Examined vials from Tin's Citadel lab and realized the Ma Thach blood formula was deliberately weaponized.",
    },
  },
  thien: {
    heroId: "thien",
    faction: { vi: "Đấng Sáng Thế · Phong Ấn Giả", en: "The Creator Sovereign · Grand Sealer" },
    originTitle: {
      vi: "Kiến Trúc Sư Dựng Lên Pháp Trận Đấu Trường & Khóa Chặt Cổ Thành",
      en: "Architect of the Arena Circle & Citadel Seal",
    },
    epitaph: {
      vi: "“Ta không khóa Cổ Thành vì sợ quái vật. Ta khóa nó vì không muốn thế giới thấy cái giá của sự bất tử.”",
      en: "“I did not seal the Citadel out of fear of monsters. I sealed it to hide the price of immortality.”",
    },
    story: {
      vi: "Thiên là vị thần kiến tạo đã dệt nên luật lệ của Đấu Trường Cổ Điển, điều khiển Thánh Kiếm, Trường Thời Gian và Cổng Thần Ngục. Khi Dự Án Huyết Ảnh Số 0 vượt khỏi tầm kiểm soát, chính Thiên đã hạ lệnh chôn vùi Cổ Thành Huyết Táng khỏi lịch sử — nhưng giờ đây ngài bước xuống chiến trường, cho phép kẻ nắm giữ mật ấn bước thẳng vào cổ thành đổ nát.",
      en: "Thiên is the Creator deity who wove the laws of the Classic Arena, commanding Sovereign Blades, Time Spheres, and Celestial Portals. When Project Bloodshade Zero spiraled out of control, Thiên buried the Bloodsoaked Citadel from history — yet now steps forth, granting bearers of the Founder Seal free passage between both realms.",
    },
    citadelBond: {
      vi: "Khi Thiên xuất hiện hoặc mật khẩu Nhà Sáng Lập được mở, phong ấn Cổ Thành Huyết Táng tự động quy thuận và mở lối tự do.",
      en: "Whenever the Founder Seal is unlocked, the Citadel's ancient wards yield, allowing free passage across both arenas.",
    },
  },
  minh: {
    heroId: "minh",
    faction: { vi: "Tháp Phán Quyết Vĩnh Hàn", en: "Citadel of Binding Judgements" },
    originTitle: {
      vi: "Bậc Thầy Xích Linh Hồn Giữ Nhịp Sống Đồng Đội",
      en: "Master of Soul Chains & Battle Control",
    },
    epitaph: {
      vi: "“Kẻ thù càng giãy giụa trong xiềng xích của ta, ánh sáng hồi sinh trên vai đồng đội càng rực.”",
      en: "“The harder foes thrash in my astral chains, the brighter healing radiates upon my allies.”",
    },
    story: {
      vi: "Minh tin rằng chiến thắng không đến từ cuồng sát mà từ sự kiểm soát tuyệt đối từng nhịp thở của chiến trường. Ba tầng pháp trận trói chân, đóng băng và phong ấn của anh biến những bầy quái hung hãn nhất thành bia tập bắn bất động.",
      en: "Minh believes victory belongs not to reckless slaughter, but total command of tempo. His rooting chains, frost prisons, and sealing fields freeze the deadliest hordes in their tracks.",
    },
    citadelBond: {
      vi: "Khảo sát các rune phong ấn quanh Hầm Bí Mật Cổ Thành và nhận ra chúng dùng cùng ngữ pháp cổ ngữ với Thánh Vực của anh.",
      en: "Identified the Citadel Secret Vault runes as sharing the exact archaic syntax of his own Binding Sanctuaries.",
    },
  },
  ducanh: {
    heroId: "ducanh",
    faction: { vi: "Quân Đoàn Thiết Bích Bất Tử", en: "Immortal Ironwall Legion" },
    originTitle: {
      vi: "Pháo Đài Di Động Không Bao Giờ Lùi Một Bước",
      en: "Living Fortress Who Refuses One Step Back",
    },
    epitaph: {
      vi: "“Hãy trút hết nanh vuốt lên khiên của ta đi — bức tường này chưa từng đổ trước bình minh.”",
      en: "“Break your fangs upon my shield — this wall has never fallen before dawn.”",
    },
    story: {
      vi: "Đức Anh là chiến binh duy nhất bước sống ra khỏi hầm ngục Thiết Bích sau bảy ngày vây hãm. Với Cú Lăn Xung Kích và Cú Nhảy Sao Băng, anh lao thẳng vào tâm bão sát thương, gánh mọi đòn chí mạng để đồng đội có cơ hội thở tiếp.",
      en: "Đức Anh was the lone knight to march out alive from the seven-day Siege of Ironwall. With armored rolls and meteoric leaps, he crashes straight into lethal swarms to shield every comrade behind him.",
    },
    citadelBond: {
      vi: "Đứng sừng sững giữa mưa đạn tháp canh Cổ Thành Huyết Táng như một ngọn tháp thép sống.",
      en: "Stands unbowed beneath the Bloodsoaked Citadel's watchtower barrage like a living iron keep.",
    },
  },
};

export const BOSS_CHRONICLES: BossChronicleEntry[] = [
  {
    wave: 3,
    name: { vi: "Thạch Thú Cổ Đại", en: "Ancient Golem Titan" },
    domain: { vi: "Ấn Ký Thứ Nhất · Đá Cổ", en: "First Seal · Elder Stone" },
    omen: {
      vi: "“Mặt đất rạn nứt báo hiệu tên lính canh đầu tiên thức dậy từ giấc ngủ nghìn năm.”",
      en: "“Splitting flagstones herald the first stone sentinel waking from a thousand-year slumber.”",
    },
    lore: {
      vi: "Được đẽo từ tường thành của kinh đô đầu tiên và thổi hồn bằng tro cốt binh sĩ tử trận, Thạch Thú Cổ Đại có nhiệm vụ nghiền nát những kẻ chưa đủ sức bước qua cửa ải mở màn.",
      en: "Carved from the walls of the first capital and animated by fallen soldiers' ashes, it crushes the unworthy before the true trial begins.",
    },
  },
  {
    wave: 6,
    name: { vi: "Hỏa Long Vương", en: "Infernal Dragon Wyrm" },
    domain: { vi: "Ấn Ký Thứ Hai · Biển Lửa", en: "Second Seal · Crimson Flame" },
    omen: {
      vi: "“Bầu trời đấu trường hóa đỏ như lò luyện kim khi đôi cánh tro tàn vỗ nhịp.”",
      en: "“The arena sky burns like a forge as cinder wings beat overhead.”",
    },
    lore: {
      vi: "Con rồng cổ xưa từng thiêu trụi Đền Hỏa Hồ sau khi nuốt chửng một mảnh Ma Thạch nóng chảy. Cơn thịnh nộ của nó để lại những vũng dung nham sôi sục không thể dập tắt.",
      en: "An elder wyrm that burned the Fox Shrine after devouring molten Ma Thach, scorching the ground with undying magma pools.",
    },
  },
  {
    wave: 9,
    name: { vi: "Băng Ma Nữ Vương", en: "Frost Queen Freya" },
    domain: { vi: "Ấn Ký Thứ Ba · Vĩnh Đông", en: "Third Seal · Everfrost" },
    omen: {
      vi: "“Những cột băng dựng đứng từ lòng đất, giam cầm cả tiếng tim đập.”",
      en: "“Ice spires erupt from stone, freezing even the sound of a pulse.”",
    },
    lore: {
      vi: "Từng là nữ hoàng tuyệt sắc dâng hiến vương quốc cho Băng Cốc để giữ dung nhan bất diệt. Mỗi cột băng cô triệu hồi đều mang gương mặt đóng băng của thần dân cũ.",
      en: "Once a radiant monarch who sold her realm to Everfrost for eternal youth; every ice spire bears the frozen visage of her lost subjects.",
    },
  },
  {
    wave: 12,
    name: { vi: "Lãnh Chúa Hư Không", en: "Void Lord Malakor" },
    domain: { vi: "Ấn Ký Thứ Tư · Đoạn Không", en: "Fourth Seal · Shattered Void" },
    omen: {
      vi: "“Không gian gập đôi và ánh sáng bị hút sạch vào đồng tử tím thẫm.”",
      en: "“Space folds inward as light vanishes into violet pupils.”",
    },
    lore: {
      vi: "Kẻ truyền bá mật ngữ Hư Không xuống Học Viện Đen. Hắn mở toang ranh giới giữa các chiều không gian để triệu hồi những luồng hủy diệt vô hình.",
      en: "High herald of the Void Conclave who tore dimensions open to unleash unseen annihilation beams.",
    },
  },
  {
    wave: 15,
    name: { vi: "Pháo Vương Cơ Giới Rex", en: "Siege Automaton Rex" },
    domain: { vi: "Ấn Ký Thứ Năm · Thiết Khí", en: "Fifth Seal · Relic Siegework" },
    omen: {
      vi: "“Tiếng bánh răng rít lên từ hầm máy tiền kỷ nguyên trước khi loạt đạn pháo trút xuống.”",
      en: "“Pre-eclipse gears shriek before steel artillery rains across the pit.”",
    },
    lore: {
      vi: "Cỗ máy chiến tranh do Hội Kỹ Sư Cấm chế tạo nhằm thay thế con người canh gác Cổ Thành Huyết Táng — cuối cùng lại quay mũi pháo tiêu diệt chính chủ nhân.",
      en: "A war automaton built by forbidden artificers to guard the Bloodsoaked Citadel until it turned its cannons upon its own creators.",
    },
  },
  {
    wave: 18,
    name: { vi: "Lôi Thần Thiên Khải", en: "Thunder Archon Raijin" },
    domain: { vi: "Ấn Ký Thứ Sáu · Lôi Phạt", en: "Sixth Seal · Storm Judgement" },
    omen: {
      vi: "“Mỗi tia chớp đánh xuống đều mang giọng phán xét của bầu trời đã mục nát.”",
      en: "“Every thunderbolt strikes with the judgement of a corrupted heaven.”",
    },
    lore: {
      vi: "Thiên sứ hộ vệ bão tố bị Huyết Nhật Thực vấy bẩn. Hắn trừng phạt bất kỳ phàm nhân nào dám vươn tay tới sức mạnh ngang hàng thần linh.",
      en: "An archon of tempests tainted by the Blood Eclipse, striking down any mortal daring to rival divine might.",
    },
  },
  {
    wave: 21,
    name: { vi: "Độc Long Ác Ma", en: "Abyssal Venom Wyrm" },
    domain: { vi: "Ấn Ký Thứ Bảy · Dịch Hạch", en: "Seventh Seal · Mire Plague" },
    omen: {
      vi: "“Khói lục đặc quánh bốc lên từ xác rồng mục nát, làm hoen rỉ cả giáp sắt.”",
      en: "“Thick emerald miasma rises from rotting scales, corroding iron on contact.”",
    },
    lore: {
      vi: "Quái thai sinh ra từ việc đổ thải hàng nghìn bình thí nghiệm Ma Thạch hỏng xuống đầm lầy phía Nam. Hơi thở của nó là nguồn cơn của đại dịch Hắc Huyết.",
      en: "Born from thousands of failed Ma Thach blood vats dumped into the southern mire, its breath seeded the Blackblood Plague.",
    },
  },
  {
    wave: 24,
    name: { vi: "Huyết Ma Bá Chủ", en: "Crimson Blood Sovereign" },
    domain: { vi: "Ấn Ký Thứ Tám · Huyết Triều", en: "Eighth Seal · Sanguine Throne" },
    omen: {
      vi: "“Mọi giọt máu đổ xuống mặt đá đều trôi ngược về phía ngai vàng đỏ thẫm.”",
      en: "“Every spilled drop of blood flows backward toward the crimson throne.”",
    },
    lore: {
      vi: "Bạo chúa từng tài trợ cho Dự Án Huyết Ảnh Số 0 để kéo dài tuổi thọ vô hạn. Hắn biến chính thể xác mình thành vật chứa khổng lồ của Ma Thạch Đỏ.",
      en: "The tyrant who funded Project Bloodshade Zero in pursuit of endless dominion, remaking his own body into a living Crimson Ma Thach vessel.",
    },
  },
  {
    wave: 27,
    name: { vi: "Thiên Thần Sa Ngã Lucifer", en: "Fallen Seraphim Lucifer" },
    domain: { vi: "Ấn Ký Thứ Chín · Vực Nhật Thực", en: "Ninth Seal · Eclipse Abyss" },
    omen: {
      vi: "“Sáu cánh đen giang rộng nuốt trọn ánh sao — vượt qua ta, ngươi mới đủ tư cách bước vào Cổ Thành Huyết Táng.”",
      en: "“Six black wings swallow the stars — surpass me, and earn passage into the Bloodsoaked Citadel.”",
    },
    lore: {
      vi: "Kẻ đứng đầu cuộc phản loạn Huyết Nhật Thực và cũng là người gác cổng cuối cùng của Đấu Trường Cổ Điển. Khi Lucifer ngã xuống ở Màn 27, phong ấn nghìn năm bị phá vỡ, mở ra cánh cổng dẫn thẳng tới Cổ Thành Huyết Táng.",
      en: "Architect of the Blood Eclipse rebellion and final warden of the Classic Arena. His defeat at Wave 27 shatters the ancient seal, opening the gates to the Bloodsoaked Ancient Citadel.",
    },
  },
];

export interface CitadelChronicleBlock {
  title: string;
  badge: string;
  summary: string;
  tinDossier: { locked: boolean; text: string };
  baoDossier: { locked: boolean; text: string };
  combinedDossier: { locked: boolean; text: string };
}

export function buildCitadelChronicleOverview(
  secrets: CitadelSecretsProgress,
  lang: LoreLang = "vi"
): CitadelChronicleBlock {
  const isVi = lang !== "en";
  return {
    title: isVi ? "Cổ Thành Huyết Táng · Hồ Sơ Tối Mật" : "Bloodsoaked Ancient Citadel · Classified Files",
    badge: secrets.combinedUnlocked
      ? isVi
        ? "ĐÃ GIẢI MÃ TOÀN BỘ (3/3)"
        : "FULLY DECODED (3/3)"
      : isVi
      ? `TIẾN ĐỘ MANH MỐI (${(secrets.tinClue ? 1 : 0) + (secrets.baoClue ? 1 : 0)}/2)`
      : `CLUE PROGRESS (${(secrets.tinClue ? 1 : 0) + (secrets.baoClue ? 1 : 0)}/2)`,
    summary: isVi
      ? "Thành cổ đổ nát kích thước 1600×1600 được mở khóa sau khi chinh phục Màn 27 Đấu Trường Cổ Điển (hoặc tự do chuyển đổi khi đã mở khóa Nhà Sáng Lập Thiên). Nơi đây ẩn chứa tháp canh, bẫy máu, tường sụp đổ, quái phục kích và 2 manh mối tương tác đặc biệt của Tin và Bảo."
      : "A 1600×1600 ruined fortress unlocked by clearing Wave 27 of the Classic Arena (or freely toggled once Founder Thiên is unlocked). It houses watchtowers, blood traps, collapsing walls, ambushes, and interactive secrets for Tin and Bảo.",
    tinDossier: {
      locked: !secrets.tinClue,
      text: secrets.tinClue
        ? isVi
          ? "ĐÃ MỞ · [Góc Đông Bắc] Mẫu vật #MT-07 xác nhận máu sống của Tin từng bị tiêm tinh chất Ma Thạch Đỏ để đánh thức Huyết Ảnh Thuật."
          : "UNLOCKED · [NE Ruins] Subject #MT-07 logs confirm Tin's living blood was infused with Crimson Ma Thach to awaken Bloodshade Arts."
        : isVi
        ? "CHƯA GIẢI MÃ · Hãy đưa tướng TIN tới góc Đông Bắc của Cổ Thành Huyết Táng và ấn [V] (hoặc chạm nút Tương Tác) vào bàn thí nghiệm bình máu."
        : "LOCKED · Bring hero TIN to the NE ruins of the Citadel and interact [V] with the blood vial Ma Thach bench.",
    },
    baoDossier: {
      locked: !secrets.baoClue,
      text: secrets.baoClue
        ? isVi
          ? "ĐÃ MỞ · [Góc Tây Nam] Chiếc gương rạn nứt phơi bày Dự Án Tạo Bản Sao Con Người và câu hỏi ám ảnh: “Liệu ngươi có chắc mình là bản thể gốc?”"
          : "UNLOCKED · [SW Ruins] The distorted mirror exposes the Human Replica Project and the haunting question: “Are you truly certain that you are the original?”"
        : isVi
        ? "CHƯA GIẢI MÃ · Hãy đưa tướng BẢO tới góc Tây Nam của Cổ Thành Huyết Táng và tương tác với chiếc gương phản chiếu sai lệch."
        : "LOCKED · Bring hero BẢO to the SW ruins of the Citadel and interact with the distorted mirror.",
    },
    combinedDossier: {
      locked: !secrets.combinedUnlocked,
      text: secrets.combinedUnlocked
        ? isVi
          ? "SỰ KIỆN ẨN ĐÃ MỞ · Dự Án Huyết Ảnh Số 0: Tin và Bảo chính là hai nhánh sống sót từ CÙNG MỘT THÍ NGHIỆM bị xóa sạch khỏi lịch sử Cổ Thành!"
          : "HIDDEN EVENT UNLOCKED · Project Bloodshade Zero: Tin and Bảo are the two surviving branches of the EXACT SAME experiment erased from Citadel history!"
        : isVi
        ? "BÍ MẬT CHUNG BỊ KHÓA · Khám phá đủ manh mối của Tin và Bảo rồi bước vào Hầm Bí Mật phía Bắc Cổ Thành để mở bệ thờ."
        : "SHARED SECRET LOCKED · Uncover both Tin's and Bảo's clues, then enter the Northern Secret Vault altar.",
    },
  };
}

export interface InfernoChronicleBlock {
  title: string;
  badge: string;
  summary: string;
  docsProgress: string;
  dungDossier: { locked: boolean; text: string };
  danhDossier: { locked: boolean; text: string };
  longhoiDossier: { locked: boolean; text: string };
  fourChairsDossier: { locked: boolean; trungDone: boolean; text: string };
}

export function buildInfernoChronicleOverview(
  progressRaw: InfernoProgressState | null | undefined,
  lang: LoreLang = "vi"
): InfernoChronicleBlock {
  const isVi = lang !== "en";
  const progress = normalizeInfernoProgress(progressRaw);
  const clueCount =
    (progress.dungClue ? 1 : 0) +
    (progress.danhClue ? 1 : 0) +
    (progress.longhoiClue ? 1 : 0);
  const docsTotal = Object.keys(INFERNO_DOCS).length;

  return {
    title: isVi
      ? "Hỏa Ngục Tàn Tro · Hồ Sơ Thành Phố Cháy"
      : "Inferno of Ashes · Scorched City Dossier",
    badge: progress.trungTriggered
      ? isVi
        ? "★ ĐÃ GIẢI MÃ TRỌN VẸN (BỐN CHIẾC GHẾ)"
        : "★ FOUR CHAIRS TRUTH UNVEILED"
      : isVi
      ? `MANH MỐI ANH HÙNG (${clueCount}/3)`
      : `HERO CLUES (${clueCount}/3)`,
    summary: isVi
      ? "Thành phố cổ rộng 2400×2100 gồm 8 khu vực liên kết, lối đi bí mật sau tường nứt, chìa khóa, bẫy sấm sét - khe lửa - tên lửa - cầu sập và chuỗi ký ức ẩn của Dũng, Danh, Long Hói cùng Trung."
      : "A 2400×2100 ruined city of 8 connected districts, destructible secret walls, locked archives, multi-hazard zones, and intertwined secrets for Dũng, Danh, Long Hói, and Trung.",
    docsProgress: isVi
      ? `Tài liệu đã thu thập: ${progress.collectedDocs.length}/${docsTotal}`
      : `Collected Records: ${progress.collectedDocs.length}/${docsTotal}`,
    dungDossier: {
      locked: !progress.dungClue,
      text: progress.dungClue
        ? isVi
          ? "ĐÃ MỞ · [Khu 3 · Hầm Hiến Tế] Ba cái tên trên xiềng xích trùng khớp nghi lễ khống chế Tam Đầu Khuyển — Dũng tự nguyện trói mình để giữ thành phố."
          : "UNLOCKED · [Zone 3 · Sacrificial Crypt] Three chained names match the Cerberus seal — Dũng bound himself willingly to hold the city."
        : isVi
        ? "CHƯA GIẢI MÃ · Đưa tướng DŨNG xuống Khu 3 (Hầm Hiến Tế) và nhấn [V] tại Ba Bệ Đá Xiềng Xích."
        : "LOCKED · Bring hero DŨNG to Zone 3 (Sacrificial Crypt) and press [V] at the Chained Altars.",
    },
    danhDossier: {
      locked: !progress.danhClue,
      text: progress.danhClue
        ? isVi
          ? "ĐÃ MỞ · [Khu 4 · Điện Thờ Long Hỏa] Bia nung chảy tiết lộ Danh từng đón nhận Xích Long Hỏa vào tim, và tiếng trẻ con trong tro tàn vẫn gọi tên anh."
          : "UNLOCKED · [Zone 4 · Wyrmfire Temple] The melted dragon idol reveals Danh took Crimson Wyrmfire into his chest while ash-children call his name."
        : isVi
        ? "CHƯA GIẢI MÃ · Đưa tướng DANH tới Khu 4 (Điện Thờ Long Hỏa) và nhấn [V] trước Tượng Rồng Nung Chảy."
        : "LOCKED · Bring hero DANH to Zone 4 (Wyrmfire Temple) and press [V] at the Melted Dragon Idol.",
    },
    longhoiDossier: {
      locked: !progress.longhoiClue,
      text: progress.longhoiClue
        ? isVi
          ? "ĐÃ MỞ · [Khu 5 · Pháo Đài Thiên Hỏa] Nhật ký âm thanh 3 giọng nói chứng minh Long Hói đã cố phóng hỏa tiễn đánh chặn — nhưng một kẻ thứ tư đã sửa tọa độ."
          : "UNLOCKED · [Zone 5 · Skyfire Bastion] A 3-voice terminal log proves Long Hói fired interceptors, until a fourth hand altered the coordinates."
        : isVi
        ? "CHƯA GIẢI MÃ · Đưa tướng LONG HÓI tới Khu 5 (Pháo Đài Thiên Hỏa) và nhấn [V] tại Bàn Điều Khiển Khẩn Cấp."
        : "LOCKED · Bring hero LONG HÓI to Zone 5 (Skyfire Bastion) and press [V] at the Emergency Console.",
    },
    fourChairsDossier: {
      locked: !progress.fourChairsUnlocked,
      trungDone: Boolean(progress.trungTriggered),
      text: progress.trungTriggered
        ? isVi
          ? "SỰ THẬT CUỐI CÙNG · [Khu 7 · Căn Phòng Bốn Chiếc Ghế] Ba lá thư cùng nét chữ, một chiếc ghế trống tan biến thành tro. Quả cầu phản chiếu gương mặt của Trung — người đồng hành chưa từng vô can."
          : "FINAL TRUTH · [Zone 7 · Four Chairs] Three letters in one handwriting, a fourth shadow chair dissolving to ash. The orb reflects Trung himself."
        : progress.fourChairsUnlocked
        ? isVi
          ? "CỬA MẬT THẤT ĐÃ MỞ · Hãy đưa TRUNG (hoặc bất kỳ anh hùng nào) vào Khu 7 bên dưới thành phố để soi Quả Cầu Ma Thuật."
          : "CHAMBER OPEN · Enter Zone 7 beneath the city (best with TRUNG) and touch the Arcane Orb."
        : isVi
        ? "BỊ KHÓA · Cần giải mã đủ cả 3 manh mối của Dũng, Danh và Long Hói để phá phong ấn Căn Phòng Bốn Chiếc Ghế."
        : "LOCKED · Gather all 3 clues from Dũng, Danh, and Long Hói to unseal the Chamber of Four Chairs.",
    },
  };
}


import { getDatabase } from './database.js';

const products = [
  { weight: 49, tamilName: 'வட்ட பசு', englishName: 'Vatta Pasu' },
  { weight: 49, tamilName: 'DS ராமசந்திரா', englishName: 'DS Ramachandra' },
  { weight: 59, tamilName: 'ஐவரி', englishName: 'Ivory' },
  { weight: 49, tamilName: 'அப்பு அவரை மாவு', englishName: 'Appu Avarai' },
  { weight: 49, tamilName: 'கோமாதா தீவனம்', englishName: 'Komatha Feed' },
  { weight: 49, tamilName: 'மான் தீவனம்', englishName: 'SP Feed' },
  { weight: 49, tamilName: 'ராம்சன் பால்கேன்', englishName: 'Ramson Paalcan' },
  { weight: 49, tamilName: 'சாதா பால்கேன்', englishName: 'Paalcan' },
  { weight: 49, tamilName: 'SRTC பால்கேன்', englishName: 'SRTC Paalcan' },
  { weight: 49, tamilName: 'SMR உ மாவு', englishName: 'SMR urid dust' },
  { weight: 50, tamilName: 'DD', englishName: 'DD' },
  { weight: 50, tamilName: 'நியூ DD', englishName: 'New DD' },
  { weight: 28, tamilName: 'வெ கப்பி', englishName: 'VKappi' },
  { weight: 28, tamilName: 'M கப்பி', englishName: 'M Kappi' },
  { weight: 20, tamilName: '20kg க பொட்டு', englishName: '20kg Kpottu' },
  { weight: 18, tamilName: '18kg க பொட்டு', englishName: '18kg Kpottu' },
  { weight: 49, tamilName: 'ஆலயம் அவரை', englishName: 'Aalayam Avarai' },
  { weight: 49, tamilName: 'நந்தி அவரை', englishName: 'Nandhi Avarai' },
  { weight: 49, tamilName: 'ரெட்ட கிளி அவரை', englishName: 'Red Parrot Avarai' },
  { weight: 49, tamilName: 'யானை அவரை', englishName: 'Yaanai Avarai' },
  { weight: 49, tamilName: 'DS அவரை', englishName: 'DS Avarai' },
  { weight: 49, tamilName: 'DS தீவனம்', englishName: 'DS Feed' },
  { weight: 49, tamilName: 'DS கோமாதா', englishName: 'DS komatha' },
  { weight: 49, tamilName: 'DS மகாராஜா', englishName: 'DS Maharaja' },
  { weight: 49, tamilName: 'DS SMR', englishName: 'DS SMR' },
  { weight: 49, tamilName: 'DS துவரை', englishName: 'DS Thuvarai' },
  { weight: 49, tamilName: 'DS பால்கேன்', englishName: 'DS Paalcan' },
  { weight: 49, tamilName: 'Cycle உ டஸ்ட்', englishName: 'Cycle Urid Dust' },
  { weight: 49, tamilName: 'காமதேனு உ டஸ்ட்', englishName: 'Kamadhenu Urid Dust' },
  { weight: 49, tamilName: 'கோமாதா உ டஸ்ட் yellow', englishName: 'komatha Dust Yellow' },
  { weight: 49, tamilName: 'நந்தி உ மாவு', englishName: 'Nandhi Urid dust' },
  { weight: 49, tamilName: 'பால்குடம்', englishName: 'Paalkudam' },
  { weight: 49, tamilName: 'ஆப்பிள் பருப்பு டஸ்ட்', englishName: 'Apple Paruppu Dust' },
  { weight: 49, tamilName: 'SVS உ மாவு', englishName: 'SVS' },
  { weight: 49, tamilName: 'அமுதசுரபி தீவனம்', englishName: 'Amudhasurabhi Feed' },
  { weight: 49, tamilName: 'DRS தீவனம்', englishName: 'DRS Feed' },
  { weight: 35, tamilName: 'ஆட்டு தீவனம்', englishName: 'Goat Feed' },
  { weight: 49, tamilName: 'கோபி நந்தி தீவனம்', englishName: 'Gobi Nandhi Feed' },
  { weight: 49, tamilName: 'கோபிநாத் ராம்சன் தீவனம்', englishName: 'Gobinath Ramson Feed' },
  { weight: 49, tamilName: 'காமதேனு தீவனம்', englishName: 'Kamadhenu Feed' },
  { weight: 25, tamilName: 'மான் சிப்பம்', englishName: 'sippam' },
  { weight: 49, tamilName: 'ராம்சன் பீட்ஸ்', englishName: 'Ramson Feeds' },
  { weight: 49, tamilName: 'விநாயகர் தீவனம்', englishName: 'Vinayagar Feed' },
  { weight: 49, tamilName: 'VMR தீவனம்', englishName: 'VMR Feed' },
  { weight: 49, tamilName: 'White கோமாதா', englishName: 'White Komatha' },
  { weight: 45, tamilName: 'கோமாதா பாசி', englishName: 'Komatha Paasi' },
  { weight: 49, tamilName: 'மக்கமாவு', englishName: 'Makka Maavu' },
  { weight: 49, tamilName: 'One side பாசி', englishName: 'One Side Paasi' },
  { weight: 45, tamilName: 'MGS பாசி டஸ்ட்', englishName: 'MGS Paasi Dust' },
  { weight: 50, tamilName: '50Kg MGS பாசி டஸ்ட்', englishName: '50Kg MGS Paasi Dust' },
  { weight: 49, tamilName: 'பால்பக்கெட்', englishName: 'Paalbucket' },
  { weight: 50, tamilName: 'Plain bag', englishName: 'Plain Bag' },
  { weight: 59, tamilName: 'திடம் பசு து மாவு', englishName: 'Thidam Pasu Thoordust' },
  { weight: 49, tamilName: 'டைமன்ட் உ டஸ்ட்', englishName: 'Diamond Urid dust' },
  { weight: 49, tamilName: 'காமதேனு து மாவு', englishName: 'Kamadhenu Thoordust' },
  { weight: 49, tamilName: 'குதிரை தீவனம்', englishName: 'Horse Feed' },
  { weight: 49, tamilName: 'நந்தி தீவனம்', englishName: 'Nandhi Feed' },
  { weight: 49, tamilName: 'No.2 து மாவு', englishName: 'No.2' },
  { weight: 49, tamilName: 'ஸ்டார் உ டஸ்ட்', englishName: 'Star Urid Dust' },
  { weight: 49, tamilName: 'அப்பு துவரை', englishName: 'Appu Thuvarai' },
  { weight: 49, tamilName: 'டைமன்ட் து மாவு', englishName: 'Diamond Toordust' },
  { weight: 49, tamilName: 'DL பர்ஷித் விநாயகர் து மாவு', englishName: 'DL  Vinayagar Thoordust' },
  { weight: 49, tamilName: 'கோமாதா வெள்ளை து மாவு', englishName: 'Komatha White Thoordust' },
  { weight: 49, tamilName: 'மஞ்சள் பை', englishName: 'Yellow Bag' },
  { weight: 49, tamilName: 'ஆரஞ்சு து மாவு', englishName: 'Orange Thoordust' },
  { weight: 49, tamilName: 'சங்கு து மாவு', englishName: 'Sangu Thoordust' },
  { weight: 49, tamilName: 'விநாயகர் து மாவு', englishName: 'Vinayagar Toordust' },
  { weight: 59, tamilName: 'White ஐவரி து மாவு', englishName: 'White Ivory Thoordust' },
  { weight: 49, tamilName: 'VSB கோமாதா', englishName: 'VSB Komatha' },
  { weight: 49, tamilName: 'VSB பால்பக்கெட்', englishName: 'VSB Bucket' },
  { weight: 50, tamilName: 'VSB பால்குடம்', englishName: 'VSB Kudam' },
  { weight: 50, tamilName: 'VSB சங்கு', englishName: 'VSB Sangu' },
  { weight: 50, tamilName: 'VSB விநாயகர்', englishName: 'VSB Vinayagar' },
  { weight: 50, tamilName: 'VPMP உ டஸ்ட்', englishName: 'VPMP Urid Dust' },
  { weight: 45, tamilName: 'யானை தவிடு', englishName: 'Yaanai Thavidu' },
  { weight: 49, tamilName: 'SLT தீவனம்', englishName: 'SLT Feed' },
  { weight: 49, tamilName: 'கோமாதா து மாவு TCP', englishName: 'Komatha Thoornoi' },
  { weight: 40, tamilName: '40Kg கப்பி', englishName: '40Kg Vkappi' },
  { weight: 50, tamilName: 'தவிடு', englishName: 'Thavidu' },
  { weight: 44, tamilName: '44 MGS பாசி', englishName: '44Kg MGS dust' },
  { weight: 43, tamilName: 'பருத்தி விதை புண்ணாக்கு', englishName: 'Paruthi' }
];

const database = await getDatabase();

await database.run('UPDATE products SET active = 0');

for (const product of products) {
  const existing = await database.get<{ id: number }>(
    'SELECT id FROM products WHERE english_name = ? LIMIT 1',
    product.englishName
  );

  if (existing) {
    await database.run(
      'UPDATE products SET tamil_name = ?, weight = ?, active = 1 WHERE id = ?',
      product.tamilName,
      product.weight,
      existing.id
    );
    continue;
  }

  await database.run(
    'INSERT INTO products (english_name, tamil_name, weight, active) VALUES (?, ?, ?, 1)',
    product.englishName,
    product.tamilName,
    product.weight
  );
}

await database.close();
console.log(`SQLite seed complete: ${products.length} active products`);

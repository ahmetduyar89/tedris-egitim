
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load environment variables from .env file manually
const envPath = path.resolve(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envConfig: Record<string, string> = {};

envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
        envConfig[key.trim()] = value.trim();
    }
});

const supabaseUrl = envConfig.VITE_SUPABASE_URL;
const supabaseKey = envConfig.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const subjects = [
    { name: 'Matematik', units: ['Doğal Sayılar', 'Kesirler', 'Ondalık Gösterim', 'Yüzdeler', 'Geometrik Cisimler'] },
    { name: 'Fen Bilimleri', units: ['Güneş, Dünya ve Ay', 'Canlılar Dünyası', 'Kuvvetin Ölçülmesi', 'Madde ve Değişim', 'Işığın Yayılması'] },
    { name: 'Türkçe', units: ['Sözcükte Anlam', 'Cümlede Anlam', 'Paragrafta Anlam', 'Yazım Kuralları', 'Noktalama İşaretleri'] },
    { name: 'Sosyal Bilgiler', units: ['Birey ve Toplum', 'Kültür ve Miras', 'İnsanlar, Yerler ve Çevreler', 'Bilim, Teknoloji ve Toplum', 'Üretim, Dağıtım ve Tüketim'] },
    { name: 'İngilizce', units: ['Hello', 'My Town', 'Games and Hobbies', 'My Daily Routine', 'Health'] },
    { name: 'Din Kültürü', units: ['Allah İnancı', 'Ramazan ve Oruç', 'Adap ve Nezaket', 'Hz. Muhammed', 'Kuran-ı Kerim'] }
];

const grades = [5, 6, 7, 8];

async function seedModules() {
    console.log('Seeding kg_modules table...');

    const modules = [];

    for (const grade of grades) {
        for (const subject of subjects) {
            for (let i = 0; i < subject.units.length; i++) {
                const unit = subject.units[i];
                // Create 3 modules per unit
                for (let j = 1; j <= 3; j++) {
                    modules.push({
                        code: `${subject.name.substring(0, 3).toUpperCase()}${grade}.${i + 1}.${j}`,
                        title: `${unit} - Kazanım ${j}`,
                        subject: subject.name,
                        grade: grade,
                        unit: unit,
                        difficulty_level: Math.floor(Math.random() * 5) + 1,
                        description: `${grade}. Sınıf ${subject.name} dersi ${unit} ünitesi ${j}. kazanım açıklaması.`,
                        estimated_duration_minutes: 40
                    });
                }
            }
        }
    }

    const { error } = await supabase
        .from('kg_modules')
        .insert(modules);

    if (error) {
        console.error('Error seeding modules:', error);
    } else {
        console.log(`Successfully seeded ${modules.length} modules.`);
    }
}

seedModules();
